# Exact headline capture

Capture the requested publisher's rendered headline rather than recreating its typography.

## Capture target

- Use the article's canonical page and a high-density or native-resolution browser capture.
- Include the complete headline text and only the title region requested.
- Exclude the masthead, navigation, byline, date, summary, article image, recommendations, and unrelated page chrome unless the user explicitly asks for them.
- Clear cookie banners, newsletter prompts, sticky controls, and other late overlays before capturing. Do not alter the headline itself.

## Sequential verification

Work one screenshot at a time:

1. Load the canonical article page and confirm the visible title matches the requested article.
2. Capture at sufficient resolution for a 980px presentation canvas.
3. Crop to the exact title region without clipping letters, punctuation, or wrapped lines.
4. Inspect the saved file at full size. Verify legibility, clean edges, lack of overlays, correct crop, dimensions, and file format.
5. Only after it passes, continue to the next requested headline.

Use the established `assets/headlines/` naming pattern. Preserve the canonical source URL and note the capture date and rights status. A screenshot does not create reuse rights.

When preparing or checking the existing headline collage, preserve its chaotic, tilted overlap while keeping every complete headline identifiable; do not solve readability by turning it into a rigid grid.
