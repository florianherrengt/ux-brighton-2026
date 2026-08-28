# UX Brighton presentation

## Project purpose

- This is a Slidev presentation for UX Brighton 2026: Emerging Methods, based on the 25-minute talk in `draft.md`.
- The central argument is that AI will redesign systems of work, not merely make existing jobs faster. The recurring lenses are horses and mechanisation, factory electrification, the red-flag law, system building, and evaluation as the current bottleneck.
- Keep the talk provocative, evidence-backed, practical, and ultimately focused on what the audience can do. Preserve the author's direct voice; do not soften strong language unless asked.
- Never invent the speaker's personal experience, credentials, results, or professional history.

## Source files

- Treat `draft.md` as the source for the full argument and `slides.md` as the source for the current delivered sequence.
- Put deck markup and slide order in `slides.md`; put deck-wide and slide-specific styling in `style.css`.
- Treat `dist/` as generated output. Never edit it directly; regenerate it with `npm run build`.
- Reuse the existing npm and Slidev setup. Do not replace the framework or add dependencies without explicit approval.
- Do not use Git commands as a substitute for building and visually validating deck changes.

## Editing rules

- Inspect the current slide before changing it. When asked to add content, preserve existing slides and insert the new material unless replacement or removal is explicit.
- Ask before cutting, reordering, or replacing an established narrative beat, or before choosing between materially different visual or UX behaviours.
- Reuse existing layouts, CSS classes, design tokens, and asset folders where they fit. Keep the established 16:9, 980px canvas and ink/paper/rust palette.
- Prefer one clear idea or visual beat per slide over article-like paragraphs.
- Add descriptive `alt` text or an appropriate `aria-label` to meaningful visuals. Use empty alt text only for genuinely decorative nested images.
- Add a `[Sources]` HTML comment block to every slide containing an external claim or asset. Record the original page or creator and licence/status when known; identify user-provided and generated assets accurately.
- Preserve the steam-factory video's current behaviour unless asked otherwise: muted autoplay on every slide entry, reset on exit, and no loop.

## Assets

- Keep presentation media under `assets/`, grouped by narrative section:
  - `assets/headlines/` for article captures and headline-collage alternatives.
  - `assets/horses/` for the horse-replacement section.
  - `assets/professions/` for profession photos and derived variants.
  - `assets/timeline/` for the past-to-future sequence.
  - `assets/factory/` for the steam-factory video, extracted frames, and electrification imagery.
  - `assets/red-flag/` for the red-flag section.
- Keep the project root limited to deck source, package, configuration, and guidance files.
- Use watermark-free assets with verified usage terms. Inspect downloaded or generated images before adding them to the deck.
- If the request is download-only or asks for options, do not alter `slides.md` or `style.css` until the user selects an asset.

## Validation

- Run `npm run build` after changes to the deck, styles, or bundled assets.
- Visually inspect every affected slide in the real Slidev deck. Check composition, cropping, text wrapping, contrast, and unintended overlap.
- For video or interaction changes, verify the actual runtime behaviour in a browser, including navigation away and back, and check for media or console errors.
- Report exactly what was built and visually or behaviourally verified. Do not claim unperformed checks.
