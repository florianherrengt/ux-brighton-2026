#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12,<3.13"
# dependencies = [
#   "mlx-audio[sts]==0.5.0",
# ]
# ///

"""Enhance and master a spoken-word recording on Apple Silicon."""

from __future__ import annotations

import argparse
import array
import hashlib
import json
import math
import os
import platform
import re
import shutil
import subprocess
import sys
import tempfile
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Sequence


MODEL_REPO = "starkdmi/MossFormer2_SE_48K_MLX"
MODEL_REVISION = "ccd0ded00e26f38e9f5b0ba21608aa6a0bcd6434"
MODEL_FILENAME = "model_fp32.safetensors"
MODEL_FILE_SIZE = 221_178_088
MODEL_SHA256 = "8e47b75ca25dc402db5420c45c868544da8d2ac43b21a919197da113d4d81313"
MODEL_PARAMETER_COUNT = 55_262_410
SAMPLE_RATE = 48_000
TARGET_LUFS = -16.0
TARGET_TRUE_PEAK = -1.0
TARGET_LRA = 11.0
FRAME_SECONDS = 0.1
REQUIRED_FILTERS = {
    "acompressor",
    "acrossover",
    "alimiter",
    "amix",
    "aresample",
    "equalizer",
    "highpass",
    "lowpass",
    "loudnorm",
}


class StudioVoiceError(RuntimeError):
    """An actionable pipeline failure."""


@dataclass(frozen=True)
class MediaInfo:
    duration: float
    sample_rate: int
    channels: int
    codec_name: str
    bits_per_sample: int


@dataclass(frozen=True)
class LoudnessInfo:
    integrated_lufs: float
    true_peak_dbtp: float
    loudness_range_lu: float
    threshold_lufs: float
    target_offset_db: float


@dataclass(frozen=True)
class MasteringPlan:
    highpass_hz: int
    mud_gain_db: float
    presence_gain_db: float
    air_gain_db: float
    deess: bool
    deess_threshold_db: float
    deess_ratio: float
    compression_threshold_db: float
    compression_ratio: float
    expected_compression_gr_db: float
    active_threshold_db: float
    mud_balance_db: float
    presence_balance_db: float
    sibilance_balance_db: float
    short_term_range_db: float


def fail(message: str) -> None:
    raise StudioVoiceError(message)


def run_command(
    args: Sequence[str],
    description: str,
    *,
    capture: bool = True,
) -> subprocess.CompletedProcess[bytes]:
    try:
        result = subprocess.run(
            list(args),
            stdout=subprocess.PIPE if capture else None,
            stderr=subprocess.PIPE,
            check=False,
        )
    except FileNotFoundError:
        fail(f"{args[0]} is not installed or is not on PATH.")
    except OSError as error:
        fail(f"Could not run {args[0]}: {error}")

    if result.returncode != 0:
        detail = result.stderr.decode("utf-8", errors="replace").strip()
        if len(detail) > 4_000:
            detail = detail[-4_000:]
        fail(f"{description} failed (exit code {result.returncode}).\n{detail}")

    return result


def parse_args(argv: Sequence[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Enhance speech with the full-precision MossFormer2 MLX model, then "
            "apply measured podcast mastering."
        )
    )
    parser.add_argument("input", type=Path, help="source WAV or other FFmpeg-readable audio")
    parser.add_argument("output", type=Path, help="destination 48 kHz mono 24-bit WAV")
    return parser.parse_args(argv)


def verify_paths(input_path: Path, output_path: Path) -> None:
    if not input_path.exists():
        fail(f"Input file does not exist: {input_path}")
    if not input_path.is_file():
        fail(f"Input path is not a file: {input_path}")
    if input_path.resolve() == output_path.resolve():
        fail("Input and output paths must be different.")
    if output_path.exists():
        fail(f"Output already exists and will not be overwritten: {output_path}")
    if not output_path.parent.exists():
        fail(f"Output directory does not exist: {output_path.parent}")


def find_required_tools() -> tuple[str, str]:
    ffmpeg = shutil.which("ffmpeg")
    ffprobe = shutil.which("ffprobe")
    if not ffmpeg:
        fail("ffmpeg is not installed or is not on PATH. Install it with: brew install ffmpeg")
    if not ffprobe:
        fail("ffprobe is not installed or is not on PATH. Install it with: brew install ffmpeg")

    filters_result = run_command([ffmpeg, "-hide_banner", "-filters"], "FFmpeg filter check")
    filters_text = filters_result.stdout.decode("utf-8", errors="replace")
    missing = sorted(name for name in REQUIRED_FILTERS if not re.search(rf"\b{name}\b", filters_text))
    if missing:
        fail(f"This FFmpeg build is missing required filters: {', '.join(missing)}")

    return ffmpeg, ffprobe


def probe_media(ffprobe: str, path: Path) -> MediaInfo:
    result = run_command(
        [
            ffprobe,
            "-v",
            "error",
            "-select_streams",
            "a:0",
            "-show_entries",
            "stream=codec_name,sample_rate,channels,bits_per_sample,bits_per_raw_sample,duration:format=duration",
            "-of",
            "json",
            str(path),
        ],
        f"Probing {path.name}",
    )
    try:
        payload = json.loads(result.stdout)
        stream = payload["streams"][0]
    except (json.JSONDecodeError, KeyError, IndexError, TypeError) as error:
        fail(f"Could not read an audio stream from {path}: {error}")

    duration_raw = stream.get("duration") or payload.get("format", {}).get("duration")
    try:
        duration = float(duration_raw)
        sample_rate = int(stream["sample_rate"])
        channels = int(stream["channels"])
        bits = int(stream.get("bits_per_raw_sample") or stream.get("bits_per_sample") or 0)
    except (TypeError, ValueError, KeyError) as error:
        fail(f"ffprobe returned invalid audio metadata for {path}: {error}")

    if not math.isfinite(duration) or duration <= 0:
        fail(f"Input duration must be positive; ffprobe reported {duration_raw!r}.")

    return MediaInfo(
        duration=duration,
        sample_rate=sample_rate,
        channels=channels,
        codec_name=str(stream.get("codec_name", "unknown")),
        bits_per_sample=bits,
    )


def extract_last_json_object(text: str) -> dict[str, str]:
    candidates = re.findall(r"\{[^{}]*\}", text, flags=re.DOTALL)
    for candidate in reversed(candidates):
        try:
            parsed = json.loads(candidate)
        except json.JSONDecodeError:
            continue
        if "input_i" in parsed:
            return parsed
    fail("FFmpeg did not return a readable loudness report.")


def parse_finite_float(value: object, label: str) -> float:
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        fail(f"Invalid {label} in FFmpeg report: {value!r}")
    if not math.isfinite(parsed):
        fail(f"Cannot master audio with non-finite {label}: {value!r}")
    return parsed


def measure_loudness(
    ffmpeg: str,
    path: Path,
    *,
    target_lufs: float = TARGET_LUFS,
) -> LoudnessInfo:
    result = run_command(
        [
            ffmpeg,
            "-hide_banner",
            "-nostats",
            "-i",
            str(path),
            "-map",
            "0:a:0",
            "-af",
            f"loudnorm=I={target_lufs}:TP={TARGET_TRUE_PEAK}:LRA={TARGET_LRA}:print_format=json",
            "-f",
            "null",
            "-",
        ],
        f"Measuring loudness of {path.name}",
    )
    report = extract_last_json_object(result.stderr.decode("utf-8", errors="replace"))
    return LoudnessInfo(
        integrated_lufs=parse_finite_float(report.get("input_i"), "integrated loudness"),
        true_peak_dbtp=parse_finite_float(report.get("input_tp"), "true peak"),
        loudness_range_lu=parse_finite_float(report.get("input_lra"), "loudness range"),
        threshold_lufs=parse_finite_float(report.get("input_thresh"), "loudness threshold"),
        target_offset_db=parse_finite_float(report.get("target_offset"), "target offset"),
    )


def verify_mlx_metal():
    if sys.platform != "darwin" or platform.machine() != "arm64":
        fail("This tool requires macOS on Apple Silicon (arm64).")

    try:
        import mlx.core as mx
    except ImportError as error:
        fail(f"mlx-audio's MLX dependency could not be imported: {error}")

    if not mx.metal.is_available():
        fail("MLX is installed, but its Metal backend is unavailable.")
    mx.set_default_device(mx.gpu)
    if mx.default_device() != mx.gpu:
        fail(f"MLX did not select its GPU device: {mx.default_device()}")
    probe = mx.sum(mx.arange(1024))
    mx.eval(probe)
    return mx


def sha256_file(path: str | Path) -> str:
    digest = hashlib.sha256()
    with open(path, "rb") as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def enhance_with_mossformer(input_path: Path):
    mx = verify_mlx_metal()
    try:
        import numpy as np
        from huggingface_hub import hf_hub_download
        from mlx_audio.sts.models.mossformer2_se import (
            MossFormer2SEConfig,
            MossFormer2SEModel,
        )
    except ImportError as error:
        fail(f"mlx-audio is incomplete or could not be imported: {error}")

    print(f"MLX device: {mx.default_device()} (Metal available)")
    print(f"Loading full-precision model: {MODEL_REPO}@{MODEL_REVISION[:12]}")
    weights_path = hf_hub_download(
        repo_id=MODEL_REPO,
        filename=MODEL_FILENAME,
        revision=MODEL_REVISION,
    )
    model_file_size = os.path.getsize(weights_path)
    model_sha256 = sha256_file(weights_path)
    if model_file_size != MODEL_FILE_SIZE or model_sha256 != MODEL_SHA256:
        fail(
            "The downloaded FP32 model failed its integrity check: "
            f"{model_file_size} bytes, sha256 {model_sha256}."
        )
    weights = mx.load(weights_path)
    parameter_count = sum(value.size for value in weights.values())
    non_fp32 = sorted({str(value.dtype) for value in weights.values() if value.dtype != mx.float32})
    if parameter_count != MODEL_PARAMETER_COUNT:
        fail(
            f"Unexpected model parameter count: {parameter_count:,}; "
            f"expected {MODEL_PARAMETER_COUNT:,}."
        )
    if non_fp32:
        fail(f"The requested model file is not entirely FP32; found: {', '.join(non_fp32)}")

    model = MossFormer2SEModel(MossFormer2SEConfig())
    model.load_weights(list(weights.items()))
    mx.eval(model.parameters())
    model.eval()
    print(f"Verified {parameter_count:,} FP32 parameters; enhancing with forced chunked inference...")
    started = time.monotonic()
    enhanced = np.asarray(model.enhance(str(input_path), chunked=True), dtype=np.float32)
    elapsed = time.monotonic() - started
    if enhanced.ndim != 1 or enhanced.size == 0:
        fail(f"MossFormer2 returned an invalid waveform shape: {enhanced.shape}")
    if not np.isfinite(enhanced).all():
        fail("MossFormer2 returned NaN or infinite samples.")
    print(f"Enhancement completed in {elapsed:.1f} seconds.")
    return enhanced


def write_float_wav(ffmpeg: str, samples, output_path: Path) -> None:
    args = [
        ffmpeg,
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        "-f",
        "f32le",
        "-ar",
        str(SAMPLE_RATE),
        "-ac",
        "1",
        "-i",
        "pipe:0",
        "-c:a",
        "pcm_f32le",
        str(output_path),
    ]
    try:
        result = subprocess.run(
            args,
            input=samples.astype("<f4", copy=False).tobytes(),
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
            check=False,
        )
    except OSError as error:
        fail(f"Could not write enhanced audio with FFmpeg: {error}")
    if result.returncode != 0:
        fail(result.stderr.decode("utf-8", errors="replace").strip())


def percentile(values: Sequence[float], percent: float) -> float:
    if not values:
        fail("Cannot calculate a percentile from an empty measurement.")
    if percent < 0 or percent > 100:
        raise ValueError("percent must be between 0 and 100")
    ordered = sorted(values)
    position = (len(ordered) - 1) * percent / 100
    lower = math.floor(position)
    upper = math.ceil(position)
    if lower == upper:
        return ordered[lower]
    fraction = position - lower
    return ordered[lower] * (1 - fraction) + ordered[upper] * fraction


def stream_windowed_rms(ffmpeg: str, path: Path, filters: str | None) -> list[float]:
    args = [
        ffmpeg,
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        str(path),
        "-map",
        "0:a:0",
    ]
    if filters:
        args.extend(["-af", filters])
    args.extend(
        [
            "-ac",
            "1",
            "-ar",
            str(SAMPLE_RATE),
            "-f",
            "f32le",
            "pipe:1",
        ]
    )

    process = subprocess.Popen(args, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    assert process.stdout is not None
    assert process.stderr is not None
    samples_per_frame = round(SAMPLE_RATE * FRAME_SECONDS)
    bytes_per_frame = samples_per_frame * 4
    pending = bytearray()
    levels: list[float] = []

    while True:
        chunk = process.stdout.read(bytes_per_frame - len(pending))
        if not chunk:
            break
        pending.extend(chunk)
        if len(pending) < bytes_per_frame:
            continue
        frame = array.array("f")
        frame.frombytes(pending)
        if sys.byteorder != "little":
            frame.byteswap()
        rms = math.sqrt(math.fsum(sample * sample for sample in frame) / len(frame))
        levels.append(20 * math.log10(max(rms, 1e-12)))
        pending.clear()

    if pending:
        complete_bytes = len(pending) - (len(pending) % 4)
        if complete_bytes:
            frame = array.array("f")
            frame.frombytes(pending[:complete_bytes])
            if sys.byteorder != "little":
                frame.byteswap()
            rms = math.sqrt(math.fsum(sample * sample for sample in frame) / len(frame))
            levels.append(20 * math.log10(max(rms, 1e-12)))

    stderr = process.stderr.read().decode("utf-8", errors="replace")
    return_code = process.wait()
    if return_code != 0:
        fail(f"Spectral analysis failed (exit code {return_code}).\n{stderr.strip()}")
    if not levels:
        fail("Spectral analysis produced no audio frames.")
    return levels


def matching_active_values(values: Sequence[float], active_indices: Sequence[int]) -> list[float]:
    return [values[index] for index in active_indices if index < len(values)]


def choose_mastering_plan(
    full: Sequence[float],
    mud: Sequence[float],
    body: Sequence[float],
    presence: Sequence[float],
    sibilance: Sequence[float],
    source_sample_rate: int,
) -> MasteringPlan:
    frame_count = min(len(full), len(mud), len(body), len(presence), len(sibilance))
    if frame_count < 5:
        fail("The enhanced recording is too short for reliable mastering analysis.")

    full = list(full[:frame_count])
    noise_floor = percentile(full, 15)
    median_level = percentile(full, 50)
    active_threshold = max(-55.0, min(noise_floor + 12.0, median_level - 7.0))
    active_indices = [index for index, level in enumerate(full) if level > active_threshold]
    if len(active_indices) < max(3, frame_count // 10):
        fallback = percentile(full, 60)
        active_indices = [index for index, level in enumerate(full) if level >= fallback]

    active_full = matching_active_values(full, active_indices)
    active_mud = matching_active_values(mud, active_indices)
    active_body = matching_active_values(body, active_indices)
    active_presence = matching_active_values(presence, active_indices)
    active_sibilance = matching_active_values(sibilance, active_indices)

    mud_balance = (
        percentile(active_mud, 50)
        - percentile(active_body, 50)
        + 10 * math.log10(1_650 / 170)
    )
    presence_balance = (
        percentile(active_presence, 50)
        - percentile(active_body, 50)
        + 10 * math.log10(1_650 / 2_500)
    )
    sibilance_balances = [
        sib - pres + 10 * math.log10(2_500 / 4_000)
        for sib, pres in zip(active_sibilance, active_presence)
    ]
    sibilance_balance = percentile(sibilance_balances, 90)

    mud_gain = -min(2.5, max(0.0, (mud_balance - 4.5) * 0.35))
    presence_gain = min(1.5, max(0.0, (-10.0 - presence_balance) * 0.15))
    air_gain = 0.0 if source_sample_rate < 28_000 else 0.0

    deess = sibilance_balance > -5.0
    deess_ratio = 2.5 if sibilance_balance > -1.5 else 2.0
    deess_target_gr = 3.5 if deess_ratio == 2.5 else 2.5
    deess_threshold = percentile(active_sibilance, 95) - deess_target_gr / (1 - 1 / deess_ratio)
    deess_threshold = max(-42.0, min(-12.0, deess_threshold))

    short_term_range = percentile(active_full, 90) - percentile(active_full, 10)
    compression_ratio = 3.0 if short_term_range >= 8.0 else 2.5
    expected_gr = min(5.0, max(3.0, short_term_range * 0.35))
    compression_threshold = percentile(active_full, 90) - expected_gr / (
        1 - 1 / compression_ratio
    )
    compression_threshold = max(-35.0, min(-10.0, compression_threshold))

    return MasteringPlan(
        highpass_hz=75,
        mud_gain_db=round(mud_gain, 2),
        presence_gain_db=round(presence_gain, 2),
        air_gain_db=round(air_gain, 2),
        deess=deess,
        deess_threshold_db=round(deess_threshold, 2),
        deess_ratio=deess_ratio,
        compression_threshold_db=round(compression_threshold, 2),
        compression_ratio=compression_ratio,
        expected_compression_gr_db=round(expected_gr, 2),
        active_threshold_db=round(active_threshold, 2),
        mud_balance_db=round(mud_balance, 2),
        presence_balance_db=round(presence_balance, 2),
        sibilance_balance_db=round(sibilance_balance, 2),
        short_term_range_db=round(short_term_range, 2),
    )


def analyze_for_mastering(ffmpeg: str, path: Path, source_sample_rate: int) -> MasteringPlan:
    print("Analyzing enhanced spectral balance and short-term dynamics...")
    bands = {
        "full": "highpass=f=70:p=2,lowpass=f=15000:p=2",
        "mud": "highpass=f=180:p=2,lowpass=f=350:p=2",
        "body": "highpass=f=350:p=2,lowpass=f=2000:p=2",
        "presence": "highpass=f=2500:p=2,lowpass=f=5000:p=2",
        "sibilance": "highpass=f=5000:p=2,lowpass=f=9000:p=2",
    }
    measurements = {
        name: stream_windowed_rms(ffmpeg, path, filters) for name, filters in bands.items()
    }
    return choose_mastering_plan(source_sample_rate=source_sample_rate, **measurements)


def db_to_amplitude(db: float) -> float:
    return 10 ** (db / 20)


def build_mastering_graph(plan: MasteringPlan) -> tuple[str, str]:
    initial = ["aformat=sample_fmts=fltp:channel_layouts=mono", f"highpass=f={plan.highpass_hz}:p=2"]
    if plan.mud_gain_db < -0.05:
        initial.append(f"equalizer=f=260:t=o:w=1.1:g={plan.mud_gain_db}")
    if plan.presence_gain_db > 0.05:
        initial.append(f"equalizer=f=3500:t=o:w=1.0:g={plan.presence_gain_db}")
    if plan.air_gain_db > 0.05:
        initial.append(f"equalizer=f=12000:t=o:w=1.0:g={plan.air_gain_db}")

    compressor = (
        "acompressor="
        f"threshold={db_to_amplitude(plan.compression_threshold_db):.8f}:"
        f"ratio={plan.compression_ratio}:attack=20:release=100:"
        "knee=2.828427:detection=rms:makeup=1"
    )
    limiter = (
        "aresample=192000:filter_size=64:phase_shift=10:cutoff=0.97,"
        f"alimiter=limit={db_to_amplitude(TARGET_TRUE_PEAK):.8f}:"
        "attack=5:release=50:level=0:latency=1,"
        "aresample=48000:filter_size=64:phase_shift=10:cutoff=0.97"
    )

    if plan.deess:
        graph = (
            f"[0:a]{','.join(initial)}[eq];"
            "[eq]acrossover=split=5000:order=8th:precision=double[low][high];"
            "[high]acompressor="
            f"threshold={db_to_amplitude(plan.deess_threshold_db):.8f}:"
            f"ratio={plan.deess_ratio}:attack=1:release=70:"
            "knee=2.828427:detection=rms:makeup=1[controlled];"
            "[low][controlled]amix=inputs=2:weights='1 1':normalize=0[deessed];"
            f"[deessed]{compressor},{limiter}[out]"
        )
    else:
        graph = f"[0:a]{','.join(initial)},{compressor},{limiter}[out]"
    return graph, "out"


def apply_mastering(ffmpeg: str, input_path: Path, output_path: Path, plan: MasteringPlan) -> None:
    graph, output_label = build_mastering_graph(plan)
    run_command(
        [
            ffmpeg,
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-i",
            str(input_path),
            "-filter_complex",
            graph,
            "-map",
            f"[{output_label}]",
            "-ar",
            str(SAMPLE_RATE),
            "-ac",
            "1",
            "-c:a",
            "pcm_f32le",
            str(output_path),
        ],
        "Corrective EQ, de-essing, compression, and limiting",
    )


def apply_loudness_normalization(
    ffmpeg: str,
    input_path: Path,
    output_path: Path,
    measured: LoudnessInfo,
    *,
    target_lufs: float = TARGET_LUFS,
) -> None:
    loudnorm = (
        f"loudnorm=I={target_lufs}:TP={TARGET_TRUE_PEAK}:LRA={TARGET_LRA}:"
        f"measured_I={measured.integrated_lufs}:"
        f"measured_TP={measured.true_peak_dbtp}:"
        f"measured_LRA={measured.loudness_range_lu}:"
        f"measured_thresh={measured.threshold_lufs}:"
        f"offset={measured.target_offset_db}:linear=true:print_format=json,"
        "aresample=48000:filter_size=64:phase_shift=10:cutoff=0.97"
    )
    run_command(
        [
            ffmpeg,
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-i",
            str(input_path),
            "-map",
            "0:a:0",
            "-af",
            loudnorm,
            "-ar",
            str(SAMPLE_RATE),
            "-ac",
            "1",
            "-c:a",
            "pcm_s24le",
            str(output_path),
        ],
        "Two-pass loudness normalization",
    )


def calibrated_loudness_target(measured_lufs: float) -> float | None:
    error = TARGET_LUFS - measured_lufs
    if abs(error) <= 0.15:
        return None
    return max(-17.0, min(-15.0, TARGET_LUFS + error))


def measure_sample_peak(ffmpeg: str, path: Path) -> float:
    result = run_command(
        [
            ffmpeg,
            "-hide_banner",
            "-nostats",
            "-i",
            str(path),
            "-map",
            "0:a:0",
            "-af",
            "astats=metadata=0:reset=0",
            "-f",
            "null",
            "-",
        ],
        f"Measuring sample peak of {path.name}",
    )
    matches = re.findall(
        r"Peak level dB:\s*(-?inf|[-+]?(?:\d+(?:\.\d*)?|\.\d+))",
        result.stderr.decode("utf-8", errors="replace"),
        flags=re.IGNORECASE,
    )
    if not matches:
        fail("FFmpeg did not report a sample peak.")
    value = float(matches[-1])
    if not math.isfinite(value):
        fail("Final output contains no measurable signal.")
    return value


def validate_output(
    ffprobe: str,
    ffmpeg: str,
    output_path: Path,
    source_duration: float,
) -> tuple[MediaInfo, LoudnessInfo, float, bool]:
    media = probe_media(ffprobe, output_path)
    loudness = measure_loudness(ffmpeg, output_path)
    sample_peak = measure_sample_peak(ffmpeg, output_path)
    clipping = sample_peak >= -0.001

    errors = []
    if media.sample_rate != SAMPLE_RATE:
        errors.append(f"sample rate is {media.sample_rate} Hz")
    if media.channels != 1:
        errors.append(f"channel count is {media.channels}")
    if media.codec_name != "pcm_s24le" or media.bits_per_sample != 24:
        errors.append(f"format is {media.codec_name}/{media.bits_per_sample}-bit")
    if abs(media.duration - source_duration) > 0.05:
        errors.append(
            f"duration changed from {source_duration:.3f}s to {media.duration:.3f}s"
        )
    if abs(loudness.integrated_lufs - TARGET_LUFS) > 0.15:
        errors.append(f"integrated loudness is {loudness.integrated_lufs:.1f} LUFS")
    if loudness.true_peak_dbtp > TARGET_TRUE_PEAK + 0.1:
        errors.append(f"true peak is {loudness.true_peak_dbtp:.1f} dBTP")
    if clipping:
        errors.append("sample clipping was detected")
    if errors:
        fail("Final output validation failed: " + "; ".join(errors))

    return media, loudness, sample_peak, clipping


def print_plan(plan: MasteringPlan, source_sample_rate: int) -> None:
    print("Mastering analysis:")
    print(f"  Active-speech threshold: {plan.active_threshold_db:.1f} dBFS RMS")
    print(f"  Mud balance: {plan.mud_balance_db:+.1f} dB; EQ: {plan.mud_gain_db:+.1f} dB at 260 Hz")
    print(
        f"  Presence balance: {plan.presence_balance_db:+.1f} dB; "
        f"EQ: {plan.presence_gain_db:+.1f} dB at 3.5 kHz"
    )
    if source_sample_rate < 28_000:
        print(
            f"  Air EQ: skipped (the {source_sample_rate / 1000:g} kHz source has no original 10–14 kHz content)"
        )
    else:
        print(f"  Air EQ: {plan.air_gain_db:+.1f} dB")
    if plan.deess:
        print(
            f"  Sibilance balance: {plan.sibilance_balance_db:+.1f} dB; "
            f"5 kHz+ de-esser {plan.deess_ratio:.1f}:1"
        )
    else:
        print(f"  Sibilance balance: {plan.sibilance_balance_db:+.1f} dB; de-esser bypassed")
    print(
        f"  Short-term speech range: {plan.short_term_range_db:.1f} dB; "
        f"compressor {plan.compression_ratio:.1f}:1 at {plan.compression_threshold_db:.1f} dBFS "
        f"(~{plan.expected_compression_gr_db:.1f} dB on louder speech)"
    )


def print_final_report(
    output_path: Path,
    media: MediaInfo,
    loudness: LoudnessInfo,
    sample_peak: float,
    clipping: bool,
) -> None:
    print(f"Created {output_path}")
    print("Final verification:")
    print(f"  Duration: {media.duration:.3f} seconds")
    print(f"  Sample rate: {media.sample_rate} Hz")
    print(f"  Channels: {media.channels} (mono)")
    print(f"  Encoding: 24-bit PCM ({media.codec_name})")
    print(f"  Integrated loudness: {loudness.integrated_lufs:.1f} LUFS")
    print(f"  True peak: {loudness.true_peak_dbtp:.1f} dBTP")
    print(f"  Sample peak: {sample_peak:.2f} dBFS")
    print(f"  Clipping detected: {'yes' if clipping else 'no'}")


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(sys.argv[1:] if argv is None else argv)
    input_path = args.input.expanduser().resolve()
    output_path = args.output.expanduser().resolve()
    verify_paths(input_path, output_path)
    ffmpeg, ffprobe = find_required_tools()
    source_info = probe_media(ffprobe, input_path)
    print(
        f"Input: {source_info.duration:.3f}s, {source_info.sample_rate} Hz, "
        f"{source_info.channels} channel(s), {source_info.codec_name}"
    )
    source_loudness = measure_loudness(ffmpeg, input_path)
    print(
        f"Input loudness: {source_loudness.integrated_lufs:.1f} LUFS, "
        f"{source_loudness.true_peak_dbtp:.1f} dBTP, "
        f"{source_loudness.loudness_range_lu:.1f} LU range"
    )

    temporary_directory = Path(tempfile.mkdtemp(prefix="studio-voice-"))
    staged_output = output_path.with_name(f".{output_path.name}.{os.getpid()}.tmp.wav")
    succeeded = False
    try:
        enhanced_path = temporary_directory / "01_mossformer_fp32.wav"
        mastered_path = temporary_directory / "02_mastered_pre_loudness.wav"

        enhanced = enhance_with_mossformer(input_path)
        write_float_wav(ffmpeg, enhanced, enhanced_path)
        enhanced_info = probe_media(ffprobe, enhanced_path)
        if abs(enhanced_info.duration - source_info.duration) > 0.05:
            fail(
                f"MossFormer2 changed duration from {source_info.duration:.3f}s "
                f"to {enhanced_info.duration:.3f}s."
            )
        enhanced_loudness = measure_loudness(ffmpeg, enhanced_path)
        print(
            f"Enhanced intermediate: {enhanced_loudness.integrated_lufs:.1f} LUFS, "
            f"{enhanced_loudness.true_peak_dbtp:.1f} dBTP"
        )

        plan = analyze_for_mastering(ffmpeg, enhanced_path, source_info.sample_rate)
        print_plan(plan, source_info.sample_rate)
        print("Applying corrective EQ, de-essing, compression, and true-peak limiting...")
        apply_mastering(ffmpeg, enhanced_path, mastered_path, plan)

        print("Measuring the mastered intermediate for two-pass loudness normalization...")
        pre_normalization = measure_loudness(ffmpeg, mastered_path)
        print(
            f"Mastered intermediate: {pre_normalization.integrated_lufs:.1f} LUFS, "
            f"{pre_normalization.true_peak_dbtp:.1f} dBTP"
        )
        apply_loudness_normalization(ffmpeg, mastered_path, staged_output, pre_normalization)

        initial_final_loudness = measure_loudness(ffmpeg, staged_output)
        calibration_target = calibrated_loudness_target(
            initial_final_loudness.integrated_lufs
        )
        if calibration_target is not None:
            print(
                f"Calibrating FFmpeg's dynamic normalization bias "
                f"({initial_final_loudness.integrated_lufs:.2f} LUFS measured)..."
            )
            calibrated_measurement = measure_loudness(
                ffmpeg,
                mastered_path,
                target_lufs=calibration_target,
            )
            apply_loudness_normalization(
                ffmpeg,
                mastered_path,
                staged_output,
                calibrated_measurement,
                target_lufs=calibration_target,
            )

        media, loudness, sample_peak, clipping = validate_output(
            ffprobe,
            ffmpeg,
            staged_output,
            source_info.duration,
        )
        os.replace(staged_output, output_path)
        succeeded = True
        print_final_report(output_path, media, loudness, sample_peak, clipping)
        return 0
    finally:
        if staged_output.exists():
            staged_output.unlink()
        if succeeded:
            shutil.rmtree(temporary_directory)
        else:
            print(f"Intermediate files kept for debugging: {temporary_directory}", file=sys.stderr)


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except StudioVoiceError as error:
        print(f"Error: {error}", file=sys.stderr)
        raise SystemExit(1)
