import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { parseSync } from '@slidev/parser'
import JSZip from 'jszip'

const videoPath = 'assets/factory/steam-factory.mp4'

export async function embedFactoryVideo(pptxBuffer, markdown, videoBuffer, closingLink) {
  const { slides } = parseSync(markdown)
  const videoSlides = slides.filter(slide =>
    String(slide.frontmatter.class ?? '').split(/\s+/).includes('factory-video-slide'))
  if (videoSlides.length !== 1)
    throw new Error('Expected exactly one factory-video-slide in slides.md')
  if (!videoSlides[0].content.includes(`src="./${videoPath}"`))
    throw new Error(`Expected the factory slide to use ${videoPath}`)

  const zip = await JSZip.loadAsync(pptxBuffer)
  if (zip.file(/^ppt\/slides\/slide\d+\.xml$/).length !== slides.length)
    throw new Error('PowerPoint slide count does not match slides.md')

  const slideNumber = videoSlides[0].index + 1
  const slidePath = `ppt/slides/slide${slideNumber}.xml`
  const relsPath = `ppt/slides/_rels/slide${slideNumber}.xml.rels`
  const slide = await zip.file(slidePath).async('string')
  const rels = await zip.file(relsPath).async('string')
  const presentation = await zip.file('ppt/presentation.xml').async('string')
  const size = presentation.match(/<p:sldSz\b[^>]*\bcx="(\d+)"[^>]*\bcy="(\d+)"/)
  const poster = slide.match(/<p:bg>[\s\S]*?<a:blip\b[^>]*r:embed="([^"]+)"/)
  if (!size || !poster || !slide.includes('</p:spTree>'))
    throw new Error('Expected a Slidev image-background PowerPoint slide')
  if (slide.includes('<p:timing>') || slide.includes('<a:videoFile'))
    throw new Error('Factory slide already contains video or playback timing')

  const shapeId = Math.max(...[...slide.matchAll(/<p:cNvPr\b[^>]*\bid="(\d+)"/g)]
    .map(match => Number(match[1]))) + 1
  const videoId = Math.max(...[...rels.matchAll(/\bId="rId(\d+)"/g)]
    .map(match => Number(match[1]))) + 1
  const mediaId = videoId + 1

  // Native embedded video, using the existing slide image as its poster frame.
  // Shape/relationship structure follows PptxGenJS addMedia and Microsoft's sample:
  // https://learn.microsoft.com/office/open-xml/presentation/how-to-add-a-video-to-a-slide-in-a-presentation
  const picture = `<p:pic>
    <p:nvPicPr>
      <p:cNvPr id="${shapeId}" name="Steam factory video" descr="Steam-powered factory machinery">
        <a:hlinkClick r:id="" action="ppaction://media"/>
      </p:cNvPr>
      <p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr>
      <p:nvPr>
        <a:videoFile r:link="rId${videoId}"/>
        <p:extLst><p:ext uri="{DAA4B4D4-6D71-4841-9C94-3DE7FCFB9230}">
          <p14:media xmlns:p14="http://schemas.microsoft.com/office/powerpoint/2010/main" r:embed="rId${mediaId}"/>
        </p:ext></p:extLst>
      </p:nvPr>
    </p:nvPicPr>
    <p:blipFill><a:blip r:embed="${poster[1]}"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>
    <p:spPr>
      <a:xfrm><a:off x="0" y="0"/><a:ext cx="${size[1]}" cy="${size[2]}"/></a:xfrm>
      <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
    </p:spPr>
  </p:pic>`
  // Start on slide entry, muted, once; the media belongs to this slide only.
  const timing = `<p:timing><p:tnLst><p:par>
    <p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst>
      <p:video><p:cMediaNode vol="0" numSld="1">
        <p:cTn id="2" fill="hold" display="0"><p:stCondLst><p:cond delay="0"/></p:stCondLst></p:cTn>
        <p:tgtEl><p:spTgt spid="${shapeId}"/></p:tgtEl>
      </p:cMediaNode></p:video>
    </p:childTnLst></p:cTn>
  </p:par></p:tnLst></p:timing>`

  zip.file(slidePath, slide.replace('</p:spTree>', `${picture}</p:spTree>`)
    .replace('</p:sld>', `${timing}</p:sld>`))
  zip.file(relsPath, rels.replace('</Relationships>',
    `<Relationship Id="rId${videoId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/video" Target="../media/steam-factory.mp4"/>
     <Relationship Id="rId${mediaId}" Type="http://schemas.microsoft.com/office/2007/relationships/media" Target="../media/steam-factory.mp4"/>
     </Relationships>`))
  const contentTypes = await zip.file('[Content_Types].xml').async('string')
  if (!contentTypes.includes('Extension="mp4"')) {
    zip.file('[Content_Types].xml', contentTypes.replace('</Types>',
      '<Default Extension="mp4" ContentType="video/mp4"/></Types>'))
  }
  zip.file('ppt/media/steam-factory.mp4', videoBuffer)

  if (closingLink) {
    const closingSlides = slides.filter(slide =>
      String(slide.frontmatter.class ?? '').split(/\s+/).includes('closing-recap-slide'))
    if (closingSlides.length !== 1)
      throw new Error('Expected exactly one closing-recap-slide for the website link')
    const { href, x, y, width, height } = closingLink
    if (!['http:', 'https:'].includes(new URL(href).protocol)
      || ![x, y, width, height].every(Number.isFinite)
      || x < 0 || y < 0 || width <= 0 || height <= 0
      || x + width > 1 || y + height > 1)
      throw new Error('Expected a website link within the closing slide bounds')

    const closingNumber = closingSlides[0].index + 1
    const closingPath = `ppt/slides/slide${closingNumber}.xml`
    const closingRelsPath = `ppt/slides/_rels/slide${closingNumber}.xml.rels`
    const closing = await zip.file(closingPath).async('string')
    const closingRels = await zip.file(closingRelsPath).async('string')
    const linkShapeId = Math.max(...[...closing.matchAll(/<p:cNvPr\b[^>]*\bid="(\d+)"/g)]
      .map(match => Number(match[1]))) + 1
    const linkRelId = Math.max(...[...closingRels.matchAll(/\bId="rId(\d+)"/g)]
      .map(match => Number(match[1]))) + 1
    const target = href.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
      .replace(/</g, '&lt;').replace(/>/g, '&gt;')
    // An invisible, clickable rectangle over the existing QR and website label.
    const linkShape = `<p:sp>
      <p:nvSpPr><p:cNvPr id="${linkShapeId}" name="Closing website link"><a:hlinkClick r:id="rId${linkRelId}"/></p:cNvPr><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
      <p:spPr>
        <a:xfrm><a:off x="${Math.round(x * Number(size[1]))}" y="${Math.round(y * Number(size[2]))}"/><a:ext cx="${Math.round(width * Number(size[1]))}" cy="${Math.round(height * Number(size[2]))}"/></a:xfrm>
        <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
        <a:solidFill><a:srgbClr val="FFFFFF"><a:alpha val="0"/></a:srgbClr></a:solidFill><a:ln><a:noFill/></a:ln>
      </p:spPr>
    </p:sp>`
    zip.file(closingPath, closing.replace('</p:spTree>', `${linkShape}</p:spTree>`))
    zip.file(closingRelsPath, closingRels.replace('</Relationships>',
      `<Relationship Id="rId${linkRelId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${target}" TargetMode="External"/></Relationships>`))
  }
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
}

async function captureClosingLink(markdown) {
  const { createServer, resolveOptions } = await import('@slidev/cli')
  const { chromium } = await import('playwright-chromium')
  const { slides } = parseSync(markdown)
  const closing = slides.filter(slide =>
    String(slide.frontmatter.class ?? '').split(/\s+/).includes('closing-recap-slide'))
  if (closing.length !== 1)
    throw new Error('Expected exactly one closing-recap-slide for the website link')

  const options = await resolveOptions({ entry: 'slides.md' }, 'export')
  const server = await createServer(options, {
    server: { host: '127.0.0.1', port: 0 },
    clearScreen: false,
  })
  let browser
  try {
    await server.listen()
    browser = await chromium.launch()
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
    await page.emulateMedia({ colorScheme: 'light', media: 'screen' })
    const { port } = server.httpServer.address()
    await page.goto(`http://127.0.0.1:${port}/print?print=true&range=${closing[0].index + 1}`, {
      waitUntil: 'domcontentloaded',
    })
    const link = page.locator('.print-slide-container .closing-recap-slide .blog-link')
    await link.waitFor({ state: 'visible' })
    await link.locator('img').evaluateAll(images => Promise.all(images.map(image => image.decode())))
    await page.evaluate(() => document.fonts.ready)
    return await link.evaluate(anchor => {
      const bounds = anchor.getBoundingClientRect()
      const slide = anchor.closest('.print-slide-container').getBoundingClientRect()
      return {
        href: anchor.href,
        x: (bounds.left - slide.left) / slide.width,
        y: (bounds.top - slide.top) / slide.height,
        width: bounds.width / slide.width,
        height: bounds.height / slide.height,
      }
    })
  }
  finally {
    await browser?.close()
    await server.close()
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const pptxPath = process.argv[2]
  if (!pptxPath)
    throw new Error('Usage: node scripts/embed-pptx-video.mjs <export.pptx>')
  const markdown = await readFile('slides.md', 'utf8')
  const output = await embedFactoryVideo(
    await readFile(pptxPath),
    markdown,
    await readFile(videoPath),
    await captureClosingLink(markdown),
  )
  await writeFile(pptxPath, output)
}
