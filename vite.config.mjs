import { readFile } from 'node:fs/promises'
import MarkdownExit from 'markdown-exit'

export default {
  plugins: [{
    name: 'ux-brighton:handout',
    apply: 'build',
    async generateBundle() {
      const source = await readFile(new URL('./handout/index.md', import.meta.url), 'utf8')
      const markdown = MarkdownExit()
      const env = {}
      const tokens = markdown.parse(source, env)
      const title = markdown.utils.escapeHtml(tokens[1].content)

      tokens.forEach((token, index) => {
        if (token.type === 'heading_open' && token.tag === 'h2') {
          const slug = tokens[index + 1].content.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
          token.attrSet('id', slug)
        }
      })

      this.emitFile({
        type: 'asset',
        fileName: 'handout/index.md',
        source,
      })

      this.emitFile({
        type: 'asset',
        fileName: 'handout/index.html',
        source: `<!doctype html>
<html lang="en-GB">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} · UX Brighton 2026</title>
  <style>
    body {
      margin: 0;
      background: #f5f1e8;
      color: #171716;
      font: 1.0625rem/1.65 system-ui, sans-serif;
    }
    main {
      max-width: 44rem;
      margin: 0 auto;
      padding: clamp(2rem, 7vw, 5rem) 1.25rem;
    }
    h1, h2, h3 { line-height: 1.2; }
    h1 { margin: 0; font-size: clamp(2rem, 6vw, 3.5rem); }
    h2 { margin-top: 2.5rem; scroll-margin-top: 1rem; }
    h3 { margin-top: 1.75rem; }
    a { color: #963c08; text-underline-offset: 0.15em; }
    ul { padding-inline-start: 1.35rem; }
    li + li { margin-top: 0.45rem; }
    blockquote {
      margin-inline: 0;
      padding-inline-start: 1rem;
      border-inline-start: 3px solid #b84f0b;
    }
  </style>
</head>
<body>
  <main>
${markdown.renderer.render(tokens, markdown.options, env)}  </main>
</body>
</html>
`,
      })
    },
  }],
}
