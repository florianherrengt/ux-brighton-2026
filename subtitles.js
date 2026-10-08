#!/usr/bin/env node

import { spawn, spawnSync } from 'node:child_process'
import { access, mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { constants as fsConstants } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const WHISPERKIT_MODEL = 'large-v3-v20240930_626MB'
const MIN_WORDS = 4
const MAX_WORDS = 7
const MAX_CHARACTERS = 42
const PAUSE_SECONDS = 0.75
const HIGHLIGHT_COLOR = '#ffff00'
const MODEL_CACHE = path.join(homedir(), 'Library', 'Caches', 'whisperkit')

const HELP = `Usage: node subtitles.js <video-or-audio-file>

Creates <input-name>-highlighted.srt beside the input file.

The first run may download WhisperKit's ${WHISPERKIT_MODEL} model.
Existing output files are never overwritten.`

function fail(message) {
  throw new Error(message)
}

function commandIsAvailable(command) {
  const result = spawnSync(command, ['--version'], { stdio: 'ignore' })

  if (result.error?.code === 'ENOENT') return false
  if (result.error) fail(`Could not run ${command}: ${result.error.message}`)

  return true
}

function runCommand(command, args, description) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit' })

    child.once('error', (error) => {
      if (error.code === 'ENOENT') {
        reject(new Error(`${command} is not installed or is not on PATH.`))
        return
      }

      reject(new Error(`Could not run ${command}: ${error.message}`))
    })

    child.once('exit', (code, signal) => {
      if (code === 0) {
        resolve()
        return
      }

      const detail = signal ? `signal ${signal}` : `exit code ${code}`
      reject(new Error(`${description} failed (${detail}).`))
    })
  })
}

function displayWord(rawWord) {
  return rawWord.trim()
}

function endsSentence(rawWord) {
  return /[.!?…]["'”’)\]}]*$/u.test(displayWord(rawWord))
}

function endsPhrase(rawWord) {
  return /[,;:]["'”’)\]}]*$/u.test(displayWord(rawWord))
}

function characterCount(words) {
  return words.map((word) => displayWord(word.raw)).join(' ').length
}

function balancedWordLimit(wordsRemaining) {
  if (wordsRemaining <= 0) return 0

  const chunkCount = Math.ceil(wordsRemaining / MAX_WORDS)
  return Math.min(MAX_WORDS, Math.ceil(wordsRemaining / chunkCount))
}

export function buildWhisperKitArgs(audioPath, reportDirectory, modelCache = MODEL_CACHE) {
  return [
    'transcribe',
    '--audio-path',
    audioPath,
    '--model',
    WHISPERKIT_MODEL,
    '--download-model-path',
    modelCache,
    '--word-timestamps',
    '--report',
    '--report-path',
    reportDirectory,
  ]
}

export function parseWhisperKitReport(report) {
  if (!report || !Array.isArray(report.segments) || report.segments.length === 0) {
    fail('WhisperKit report has no segments.')
  }

  const timedSegments = []
  let previousWord = null

  for (const [segmentIndex, segment] of report.segments.entries()) {
    if (!Array.isArray(segment.words) || segment.words.length === 0) continue

    const words = segment.words.map((word, wordIndex) => {
      const location = `segments[${segmentIndex}].words[${wordIndex}]`

      if (typeof word?.word !== 'string' || displayWord(word.word) === '') {
        fail(`WhisperKit report has an invalid word at ${location}.`)
      }

      if (!Number.isFinite(word.start) || !Number.isFinite(word.end)) {
        fail(`WhisperKit report has invalid timestamps at ${location}.`)
      }

      if (word.start < 0 || word.end <= word.start) {
        fail(`WhisperKit report has a non-positive word duration at ${location}.`)
      }

      if (previousWord && word.start < previousWord.end) {
        fail(
          `WhisperKit returned overlapping word timings for "${displayWord(previousWord.raw)}" and "${displayWord(word.word)}".`,
        )
      }

      const timedWord = {
        raw: word.word,
        start: word.start,
        end: word.end,
      }
      previousWord = timedWord
      return timedWord
    })

    timedSegments.push(words)
  }

  if (timedSegments.length === 0) {
    fail('WhisperKit report contains no word timestamps. Make sure --word-timestamps is enabled.')
  }

  return timedSegments
}

export function groupWords(timedSegments) {
  const chunks = []
  const pauseGroups = []
  let pauseGroup = []

  for (const word of timedSegments.flat()) {
    const previous = pauseGroup.at(-1)

    if (previous && word.start - previous.end >= PAUSE_SECONDS) {
      pauseGroups.push(pauseGroup)
      pauseGroup = []
    }

    pauseGroup.push(word)
  }

  if (pauseGroup.length > 0) pauseGroups.push(pauseGroup)

  for (const words of pauseGroups) {
    let current = []
    let targetSize = balancedWordLimit(words.length)

    const flush = () => {
      if (current.length > 0) chunks.push(current)
      current = []
    }

    for (const [wordIndex, word] of words.entries()) {
      const wouldBeTooLong =
        current.length > 0 && characterCount([...current, word]) > MAX_CHARACTERS

      if (wouldBeTooLong) {
        flush()
        targetSize = balancedWordLimit(words.length - wordIndex)
      }

      current.push(word)

      const wordsRemaining = words.length - wordIndex - 1
      const canBreakNaturally =
        current.length >= MIN_WORDS &&
        (wordsRemaining === 0 || wordsRemaining >= MIN_WORDS)
      const hasNaturalEnding =
        canBreakNaturally && (endsSentence(word.raw) || endsPhrase(word.raw))

      if (hasNaturalEnding || current.length >= targetSize) {
        flush()
        targetSize = balancedWordLimit(wordsRemaining)
      }
    }

    flush()
  }

  return chunks
}

function escapeSrtText(text) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

export function renderChunk(chunk, activeIndex = null) {
  const rendered = chunk.map((word, index) => {
    const match = /^(\s*)([\s\S]*?)$/u.exec(word.raw)
    const leadingWhitespace = match[1]
    const content = match[2]
    const escaped = escapeSrtText(content)

    if (index !== activeIndex) return escapeSrtText(word.raw)

    return `${leadingWhitespace}<font color='${HIGHLIGHT_COLOR}'>${escaped}</font>`
  })

  return rendered.join('').trim()
}

export function formatSrtTimestamp(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    fail(`Cannot format invalid subtitle timestamp: ${seconds}`)
  }

  const totalMilliseconds = Math.round(seconds * 1000)
  const milliseconds = totalMilliseconds % 1000
  const totalSeconds = Math.floor(totalMilliseconds / 1000)
  const secondsPart = totalSeconds % 60
  const totalMinutes = Math.floor(totalSeconds / 60)
  const minutes = totalMinutes % 60
  const hours = Math.floor(totalMinutes / 60)

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secondsPart).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`
}

function addCue(cues, start, end, text) {
  const startMilliseconds = Math.round(start * 1000)
  const endMilliseconds = Math.round(end * 1000)

  if (endMilliseconds <= startMilliseconds) return

  cues.push({ start, end, text })
}

export function generateSrt(chunks) {
  const cues = []

  for (const chunk of chunks) {
    const neutralText = renderChunk(chunk)

    for (const [wordIndex, word] of chunk.entries()) {
      addCue(cues, word.start, word.end, renderChunk(chunk, wordIndex))

      const nextWord = chunk[wordIndex + 1]
      if (nextWord && nextWord.start > word.end) {
        addCue(cues, word.end, nextWord.start, neutralText)
      }
    }
  }

  return `${cues
    .map(
      (cue, index) =>
        `${index + 1}\n${formatSrtTimestamp(cue.start)} --> ${formatSrtTimestamp(cue.end)}\n${cue.text}`,
    )
    .join('\n\n')}\n`
}

async function assertInputFile(inputPath) {
  let inputStat

  try {
    inputStat = await stat(inputPath)
  } catch (error) {
    if (error.code === 'ENOENT') fail(`Input file does not exist: ${inputPath}`)
    throw error
  }

  if (!inputStat.isFile()) fail(`Input path is not a file: ${inputPath}`)
}

async function assertOutputDoesNotExist(outputPath) {
  try {
    await access(outputPath, fsConstants.F_OK)
  } catch (error) {
    if (error.code === 'ENOENT') return
    throw error
  }

  fail(`Output already exists and will not be overwritten: ${outputPath}`)
}

async function main(args = process.argv.slice(2)) {
  if (args.includes('--help') || args.includes('-h')) {
    console.log(HELP)
    return
  }

  if (args.length !== 1) fail(`Expected one input file.\n\n${HELP}`)

  const inputPath = path.resolve(args[0])
  const parsedInput = path.parse(inputPath)
  const outputPath = path.join(parsedInput.dir, `${parsedInput.name}-highlighted.srt`)

  await assertInputFile(inputPath)
  await assertOutputDoesNotExist(outputPath)

  if (!commandIsAvailable('ffmpeg')) {
    fail('ffmpeg is not installed or is not on PATH. Install it with: brew install ffmpeg')
  }

  if (!commandIsAvailable('whisperkit-cli')) {
    fail(
      'whisperkit-cli is not installed or is not on PATH. Install it with: brew install whisperkit-cli',
    )
  }

  const temporaryDirectory = await mkdtemp(path.join(tmpdir(), 'highlighted-subtitles-'))
  const audioPath = path.join(temporaryDirectory, 'audio.wav')
  const reportPath = path.join(temporaryDirectory, 'audio.json')

  try {
    await mkdir(MODEL_CACHE, { recursive: true })

    console.log('Extracting and normalizing audio with ffmpeg...')
    await runCommand(
      'ffmpeg',
      [
        '-hide_banner',
        '-loglevel',
        'error',
        '-y',
        '-i',
        inputPath,
        '-map',
        '0:a:0',
        '-vn',
        '-ac',
        '1',
        '-ar',
        '16000',
        '-c:a',
        'pcm_s16le',
        audioPath,
      ],
      'Audio extraction',
    )

    console.log(`Transcribing locally with WhisperKit (${WHISPERKIT_MODEL})...`)
    await runCommand(
      'whisperkit-cli',
      buildWhisperKitArgs(audioPath, temporaryDirectory),
      'WhisperKit transcription',
    )

    let report
    try {
      report = JSON.parse(await readFile(reportPath, 'utf8'))
    } catch (error) {
      if (error.code === 'ENOENT') {
        fail(`WhisperKit completed but did not create its expected report: ${reportPath}`)
      }
      if (error instanceof SyntaxError) fail(`WhisperKit created invalid JSON: ${error.message}`)
      throw error
    }

    const chunks = groupWords(parseWhisperKitReport(report))
    const srt = generateSrt(chunks)
    await writeFile(outputPath, srt, { encoding: 'utf8', flag: 'wx' })

    console.log(`Created ${outputPath}`)
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true })
  }
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href

if (isDirectRun) {
  main().catch((error) => {
    console.error(`Error: ${error.message}`)
    process.exitCode = 1
  })
}
