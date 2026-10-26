import assert from 'node:assert/strict'
import path from 'node:path'
import test from 'node:test'

import JSZip from 'jszip'
import PptxGenJS from 'pptxgenjs'

import { embedFactoryVideo } from '../scripts/embed-pptx-video.mjs'

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/yZcAAAAASUVORK5CYII=',
  'base64',
)
const video = Buffer.from('small synthetic MP4 fixture')
const layout = { name: 'test-wide', width: 10, height: 5.625 }

async function makePptx(slideCount = 3) {
  const pptx = new PptxGenJS()
  pptx.defineLayout(layout)
  pptx.layout = layout.name
  pptx.author = 'Deck author fixture'
  pptx.subject = 'Deck subject fixture'
  pptx.title = 'Deck title fixture'

  for (let index = 0; index < slideCount; index++) {
    const slide = pptx.addSlide()
    slide.background = { data: `data:image/png;base64,${png.toString('base64')}` }
    slide.addNotes(`Speaker note for fixture slide ${index + 1}`)
  }

  return Buffer.from(await pptx.write({ outputType: 'nodebuffer' }))
}

function markdownWithFactorySlide(at = 2) {
  return Array.from({ length: 3 }, (_, index) => {
    const frontmatter = index === at
      ? "class: factory-video-slide\n"
      : `class: fixture-slide-${index + 1}\n`
    const content = index === at
      ? '<SlidevVideo autoplay autoreset="slide" muted><source src="./assets/factory/steam-factory.mp4" type="video/mp4" /></SlidevVideo>'
      : `Slide ${index + 1}`
    return `---\n${frontmatter}---\n\n${content}`
  }).join('\n')
}

async function zipBuffer(buffer) {
  return JSZip.loadAsync(buffer)
}

function relationshipTargetPath(target) {
  return path.posix.normalize(path.posix.join('ppt/slides', target))
}

function relationships(xml) {
  return [...xml.matchAll(/<Relationship\b([^>]*)\/?\s*>/g)].map(([, attributes]) => {
    const values = Object.fromEntries(
      [...attributes.matchAll(/([\w:]+)="([^"]*)"/g)].map(([, key, value]) => [key, value]),
    )
    return values
  })
}

function getAttribute(xml, tag, name) {
  const match = xml.match(new RegExp(`<${tag}\\b[^>]*\\b${name}="([^"]+)"`))
  return match?.[1]
}

test('embeds the video on the parser-selected slide and preserves the rest of the PPTX package', async () => {
  const original = await makePptx()
  const before = await zipBuffer(original)
  const result = await embedFactoryVideo(original, markdownWithFactorySlide(), video)
  const after = await zipBuffer(result)
  const targetSlidePath = 'ppt/slides/slide3.xml'
  const targetRelsPath = 'ppt/slides/_rels/slide3.xml.rels'
  const videoPath = 'ppt/media/steam-factory.mp4'
  const allowedChanges = new Set([
    targetSlidePath,
    targetRelsPath,
    '[Content_Types].xml',
    videoPath,
  ])

  assert.deepEqual(await after.file(videoPath).async('nodebuffer'), video)
  assert.ok(after.file(targetSlidePath), 'third slide should receive the video')

  const beforeNames = Object.keys(before.files).filter(name => !before.files[name].dir).sort()
  const afterNames = Object.keys(after.files).filter(name => !after.files[name].dir).sort()
  assert.deepEqual(afterNames.filter(name => !before.file(name)), [videoPath])

  for (const name of beforeNames) {
    if (allowedChanges.has(name))
      continue
    assert.deepEqual(
      await after.file(name).async('nodebuffer'),
      await before.file(name).async('nodebuffer'),
      `${name} should remain unchanged`,
    )
  }

  const [presentation, core, notes] = await Promise.all([
    after.file('ppt/presentation.xml').async('string'),
    after.file('docProps/core.xml').async('string'),
    after.file('ppt/notesSlides/notesSlide3.xml').async('string'),
  ])
  assert.match(core, /Deck title fixture/)
  assert.match(core, /Deck author fixture/)
  assert.match(notes, /Speaker note for fixture slide 3/)
  assert.match(presentation, /cx="9144000" cy="5143500"/)
})

test('writes full-canvas muted autoplay timing that targets the embedded video without looping', async () => {
  const result = await embedFactoryVideo(await makePptx(), markdownWithFactorySlide(), video)
  const zip = await zipBuffer(result)
  const slideXml = await zip.file('ppt/slides/slide3.xml').async('string')
  const relsXml = await zip.file('ppt/slides/_rels/slide3.xml.rels').async('string')
  const rels = relationships(relsXml)
  const picture = slideXml.match(/<p:pic>[\s\S]*?<\/p:pic>/)?.[0]
  const videoRel = rels.find(rel => rel.Type?.endsWith('/video'))
  const mediaRel = rels.find(rel => rel.Type?.endsWith('/media'))
  const pictureRelId = getAttribute(picture ?? '', 'a:blip', 'r:embed')
  const pictureRel = rels.find(rel => rel.Id === pictureRelId)
  const pictureId = getAttribute(picture ?? '', 'p:cNvPr', 'id')
  const timing = slideXml.match(/<p:timing>[\s\S]*?<\/p:timing>/)?.[0]

  assert.ok(picture, 'video should be represented by a picture shape')
  assert.ok(timing, 'slide should contain native autoplay timing')
  assert.ok(videoRel)
  assert.ok(mediaRel)
  assert.ok(pictureRel)
  assert.equal(path.posix.basename(videoRel.Target), 'steam-factory.mp4')
  assert.equal(videoRel.Target, mediaRel.Target)
  assert.ok(zip.file(relationshipTargetPath(videoRel.Target)), 'video relationship target should resolve')
  assert.ok(zip.file(relationshipTargetPath(pictureRel.Target)), 'poster relationship target should resolve')
  assert.match(picture, new RegExp(`<a:videoFile\\b[^>]*r:link="${videoRel.Id}"`))
  assert.match(picture, new RegExp(`<p14:media\\b[^>]*r:embed="${mediaRel.Id}"`))
  assert.match(picture, /<a:off x="0" y="0"\/>/)
  assert.match(picture, /<a:ext cx="9144000" cy="5143500"\/>/)
  assert.match(timing, new RegExp(`<p:spTgt\\b[^>]*spid="${pictureId}"`))
  assert.match(timing, /<p:cond\b[^>]*delay="0"/)
  assert.match(timing, /<p:cMediaNode\b[^>]*vol="0"/)
  assert.doesNotMatch(timing, /loop="(?:1|true)"/)
  assert.doesNotMatch(timing, /\brepeat(?:Count|Dur)="indefinite"/)
})

test('rejects missing or duplicate factory-video slide classes', async () => {
  const pptx = await makePptx()
  await assert.rejects(
    embedFactoryVideo(pptx, markdownWithFactorySlide(0).replace('class: factory-video-slide', 'class: other-slide'), video),
    /factory-video-slide/,
  )
  await assert.rejects(
    embedFactoryVideo(
      pptx,
      `${markdownWithFactorySlide(0)}\n---\nclass: factory-video-slide\n---\n\nDuplicate`,
      video,
    ),
    /exactly one|duplicate/i,
  )
})

test('rejects a PPTX whose slide count does not match the parsed deck', async () => {
  await assert.rejects(
    embedFactoryVideo(await makePptx(2), markdownWithFactorySlide(), video),
    /slide count|slides/i,
  )
})

test('rejects an input that already contains the factory video', async () => {
  const first = await embedFactoryVideo(await makePptx(), markdownWithFactorySlide(), video)
  await assert.rejects(
    embedFactoryVideo(first, markdownWithFactorySlide(), video),
    /already|video/i,
  )
})
