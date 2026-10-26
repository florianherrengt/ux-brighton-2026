import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { parseSync } from '@slidev/parser'
import JSZip from 'jszip'

const videoPath = 'assets/factory/steam-factory.mp4'

export async function embedFactoryVideo(pptxBuffer, markdown, videoBuffer) {
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
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const pptxPath = process.argv[2]
  if (!pptxPath)
    throw new Error('Usage: node scripts/embed-pptx-video.mjs <export.pptx>')
  const output = await embedFactoryVideo(
    await readFile(pptxPath),
    await readFile('slides.md', 'utf8'),
    await readFile(videoPath),
  )
  await writeFile(pptxPath, output)
}
