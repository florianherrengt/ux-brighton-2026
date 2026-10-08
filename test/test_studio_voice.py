import importlib.util
import sys
import unittest
from pathlib import Path


SCRIPT_PATH = Path(__file__).parents[1] / "studio_voice.py"
SPEC = importlib.util.spec_from_file_location("studio_voice", SCRIPT_PATH)
studio_voice = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
sys.modules[SPEC.name] = studio_voice
SPEC.loader.exec_module(studio_voice)


class StudioVoiceTests(unittest.TestCase):
    def test_mlx_audio_sts_extra_is_declared(self):
        source = SCRIPT_PATH.read_text(encoding="utf-8")
        self.assertIn('"mlx-audio[sts]==0.5.0"', source)

    def test_pinned_model_integrity_values_match_downloaded_fp32_artifact(self):
        self.assertEqual(studio_voice.MODEL_FILE_SIZE, 221_178_088)
        self.assertEqual(
            studio_voice.MODEL_SHA256,
            "8e47b75ca25dc402db5420c45c868544da8d2ac43b21a919197da113d4d81313",
        )
        self.assertEqual(studio_voice.MODEL_PARAMETER_COUNT, 55_262_410)

    def test_percentile_interpolates(self):
        self.assertEqual(studio_voice.percentile([0.0, 10.0], 25), 2.5)

    def test_loudness_calibration_compensates_dynamic_normalizer_bias(self):
        self.assertAlmostEqual(
            studio_voice.calibrated_loudness_target(-16.27),
            -15.73,
        )
        self.assertIsNone(studio_voice.calibrated_loudness_target(-16.08))

    def test_mastering_plan_skips_unneeded_processing(self):
        plan = studio_voice.choose_mastering_plan(
            full=[-70, -30, -27, -24, -22, -20, -18, -17, -16, -15],
            mud=[-80, -36, -33, -30, -28, -26, -24, -23, -22, -21],
            body=[-80, -25, -22, -20, -18, -16, -14, -13, -12, -11],
            presence=[-90, -36, -33, -31, -29, -27, -25, -24, -23, -22],
            sibilance=[-100, -48, -45, -43, -41, -39, -37, -36, -35, -34],
            source_sample_rate=16_000,
        )

        self.assertEqual(plan.air_gain_db, 0.0)
        self.assertFalse(plan.deess)
        self.assertLessEqual(plan.compression_threshold_db, -10.0)

    def test_deessing_graph_precedes_voice_compression_and_limiting(self):
        plan = studio_voice.MasteringPlan(
            highpass_hz=75,
            mud_gain_db=-1.0,
            presence_gain_db=0.5,
            air_gain_db=0.0,
            deess=True,
            deess_threshold_db=-24.0,
            deess_ratio=2.0,
            compression_threshold_db=-20.0,
            compression_ratio=3.0,
            expected_compression_gr_db=4.0,
            active_threshold_db=-45.0,
            mud_balance_db=7.0,
            presence_balance_db=-12.0,
            sibilance_balance_db=-2.0,
            short_term_range_db=12.0,
        )

        graph, label = studio_voice.build_mastering_graph(plan)

        self.assertEqual(label, "out")
        self.assertLess(graph.index("acrossover"), graph.index("[deessed]acompressor"))
        self.assertLess(graph.index("[deessed]acompressor"), graph.index("alimiter"))
        self.assertIn("level=0", graph)

    def test_loudness_report_parser_uses_last_json_object(self):
        report = studio_voice.extract_last_json_object(
            'noise {"input_i":"-20.0"}\n'
            '{"input_i":"-16.0","input_tp":"-1.0"}'
        )

        self.assertEqual(report["input_i"], "-16.0")


if __name__ == "__main__":
    unittest.main()
