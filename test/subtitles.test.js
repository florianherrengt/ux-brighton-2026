import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildWhisperKitArgs,
  formatSrtTimestamp,
  generateSrt,
  groupWords,
  parseWhisperKitReport,
  renderChunk,
} from '../subtitles.js'

function word(raw, start, end) {
  return { raw, start, end }
}

test('uses the verified CLI contract and an explicit writable model cache', () => {
  assert.deepEqual(buildWhisperKitArgs('/tmp/audio.wav', '/tmp/report', '/tmp/models'), [
    'transcribe',
    '--audio-path',
    '/tmp/audio.wav',
    '--model',
    'large-v3-v20240930_626MB',
    '--download-model-path',
    '/tmp/models',
    '--word-timestamps',
    '--report',
    '--report-path',
    '/tmp/report',
  ])
})

test('parses the verified WhisperKit word timestamp structure without losing punctuation', () => {
  const segments = parseWhisperKitReport({
    segments: [
      {
        words: [
          { word: ' This', start: 0.02, end: 0.24, probability: 0.91 },
          { word: ' works.', start: 0.3, end: 0.72, probability: 0.99 },
        ],
      },
    ],
  })

  assert.deepEqual(segments, [
    [word(' This', 0.02, 0.24), word(' works.', 0.3, 0.72)],
  ])
})

test('rejects reports without word timestamps', () => {
  assert.throws(
    () => parseWhisperKitReport({ segments: [{ words: [] }] }),
    /contains no word timestamps/,
  )
})

test('rejects overlapping timings instead of estimating replacements', () => {
  assert.throws(
    () =>
      parseWhisperKitReport({
        segments: [
          {
            words: [
              { word: ' One', start: 0, end: 0.5 },
              { word: ' two', start: 0.4, end: 0.8 },
            ],
          },
        ],
      }),
    /overlapping word timings/,
  )
})

test('balances an eight-word run into two four-word chunks', () => {
  const segment = Array.from({ length: 8 }, (_, index) =>
    word(` word${index + 1}`, index * 0.3, index * 0.3 + 0.2),
  )

  assert.deepEqual(
    groupWords([segment]).map((chunk) => chunk.length),
    [4, 4],
  )
})

test('uses long pauses as hard boundaries without making nearby captions unnecessarily short', () => {
  const segment = [
    word(' This', 0, 0.2),
    word(' is', 0.2, 0.4),
    word(' one', 0.4, 0.6),
    word(' thought,', 0.6, 0.8),
    word(' followed', 0.8, 1),
    word(' by', 1, 1.2),
    word(' another', 2, 2.2),
    word(' one.', 2.2, 2.5),
  ]

  assert.deepEqual(
    groupWords([segment]).map((chunk) => chunk.map((item) => item.raw).join('').trim()),
    ['This is one thought, followed by', 'another one.'],
  )
})

test('treats WhisperKit segments as soft and avoids isolated repeated words', () => {
  const segments = [
    [word(' AI.', 0, 0.2)],
    [word(' AI.', 0.4, 0.6)],
    [
      word(' AI.', 0.8, 1),
      word(' And', 1.1, 1.3),
      word(' then', 1.3, 1.5),
      word(' we', 1.5, 1.7),
      word(' continue.', 1.7, 2),
    ],
  ]

  assert.deepEqual(
    groupWords(segments).map((chunk) => chunk.map((item) => item.raw).join('').trim()),
    ['AI. AI. AI. And then we continue.'],
  )
})

test('does not let punctuation strand one final word', () => {
  const segment = [
    word(' the', 0, 0.2),
    word(' 6th', 0.2, 0.4),
    word(' of', 0.4, 0.6),
    word(' November,', 0.6, 0.8),
    word(' 2026.', 0.8, 1),
  ]

  assert.deepEqual(
    groupWords([segment]).map((chunk) => chunk.length),
    [5],
  )
})

test('renders the active word in Resolve-compatible yellow while preserving raw spacing', () => {
  const chunk = [word(' This', 0, 0.2), word(' is', 0.3, 0.5), word(' everything.', 0.5, 1)]

  assert.equal(
    renderChunk(chunk, 1),
    "This <font color='#ffff00'>is</font> everything.",
  )
})

test('escapes transcript markup without escaping the generated color tag', () => {
  const chunk = [word(' AT&T', 0, 0.2), word(' <wins>', 0.2, 0.5)]

  assert.equal(
    renderChunk(chunk, 0),
    "<font color='#ffff00'>AT&amp;T</font> &lt;wins&gt;",
  )
})

test('uses exact word intervals and white gap cues in generated SRT', () => {
  const chunk = [word(' This', 0.02, 0.24), word(' works.', 0.3, 0.72)]
  const srt = generateSrt([chunk])

  assert.equal(
    srt,
    `1
00:00:00,020 --> 00:00:00,240
<font color='#ffff00'>This</font> works.

2
00:00:00,240 --> 00:00:00,300
This works.

3
00:00:00,300 --> 00:00:00,720
This <font color='#ffff00'>works.</font>
`,
  )
})

test('formats SRT timestamps beyond one hour', () => {
  assert.equal(formatSrtTimestamp(3723.456), '01:02:03,456')
})
