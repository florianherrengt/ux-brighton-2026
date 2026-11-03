# UX Brighton 2026

This repository contains the Slidev deck and a small local subtitle utility.

## PowerPoint export

Download the [PowerPoint version](https://florianherrengt.github.io/ux-brighton-2026/ux-brighton-2026.pptx).
Each GitHub Pages deployment builds and publishes this file beside the browser
deck. The closing slide keeps its QR code and clickable link to
[florianherrengt.com](https://florianherrengt.com/).

To build it locally, run `npm run build:pptx` with Dagger and Docker running. The
export writes `dist/ux-brighton-2026.pptx`. Slides use images to preserve the
deck's appearance; the factory slide contains the embedded MP4 with muted
autoplay and no loop. Reopen the newly exported file after rebuilding; an earlier
import stays unchanged.

Keynote autoplays the movie when advancing onto the slide. Navigating backwards
to it resets the movie but leaves it paused, including for a movie inserted
directly in Keynote. Click the movie to replay it, or go back one further slide
and advance onto it again.

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
