# UX Brighton 2026

This repository contains the Slidev deck and a small local subtitle utility.

## Word-highlighted subtitles for DaVinci Resolve Free

Prerequisites on macOS:

```sh
brew install ffmpeg whisperkit-cli
```

Generate subtitles from a video or audio file:

```sh
node subtitles.js video.mp4
```

The command creates `video-highlighted.srt` beside the input. The first run may
download WhisperKit's `large-v3-v20240930_626MB` model into the writable macOS
cache at `~/Library/Caches/whisperkit`. Audio and transcription stay on the Mac;
temporary audio and WhisperKit report files are deleted when the command finishes.

The generated SRT aims for 4–7-word chunks, with shorter chunks only around pauses
or unusually long words. Each spoken word gets a cue using its actual WhisperKit
start and end timestamps. The current word is tagged yellow; the rest of the
phrase has no embedded color and therefore follows the subtitle track style in
Resolve. During a short gap inside a chunk, the full phrase remains visible
without a highlighted word. Pauses of 0.75 seconds or more start a new chunk.

To use it in Resolve Free, import the SRT into the Media Pool, then drag it to the
timeline. Set the track font, size, position, and default white color in the
subtitle Inspector. The active word's yellow is stored in each subtitle cue as a
Resolve-compatible `<font color='#ffff00'>` tag.

The command refuses to overwrite an existing `-highlighted.srt` file so that
manual edits in Resolve are not accidentally lost.
