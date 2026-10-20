# UX Brighton 2026

This repository contains the Slidev deck and a small local subtitle utility.

## PowerPoint export

With Dagger and Docker running, `npm run build:pptx` builds the deck and writes
`dist/ux-brighton-2026.pptx`. The export contains one image per slide, so the
factory video appears as a still frame.

Enable the tracked pre-commit hook once per checkout:

```sh
git config core.hooksPath .githooks
```

When deck or export inputs are staged, the hook builds those staged sources through Dagger.
A failed build stops the commit; the generated PowerPoint stays in ignored `dist/`.

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
