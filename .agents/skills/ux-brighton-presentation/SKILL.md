---
name: ux-brighton-presentation
description: Edit, extend, integrate media into, and verify the UX Brighton 2026 Slidev talk. Use for this deck's narrative, slide order or copy, styling, layouts, imagery, animation, or video behaviour; use the media-sourcing skill when the requested output is primarily new asset files.
---

# UX Brighton presentation

Maintain a coherent, stage-ready Slidev deck that faithfully turns `draft.md` into a visual 25-minute talk.

## Establish the requested change

Read the relevant sections of `draft.md`, `slides.md`, and `style.css` before proposing or editing a slide. Inspect the actual assets used by adjacent slides.

Resolve product choices before implementation when the request leaves multiple meaningful directions open. In particular, ask before removing or replacing a slide, reordering the argument, introducing a new central metaphor, changing established playback behaviour, or choosing among materially different visual treatments. Do not mistake a request to add something for permission to replace an existing beat.

When inserting a slide, inspect both neighbouring slides and preserve them unless removal or replacement is explicit. If an apparently stray slide or asset conflicts with the requested change, check project evidence before deleting it.

## Shape the narrative

Keep each slide focused on a single spoken beat. Convert the article's argument into concise audience-facing copy, images, sequences, or transitions rather than pasting paragraphs onto slides.

Use the current deck as the sequence of record. Preserve the argument order and transitions established by `draft.md` and neighbouring slides; use practical implications or audience questions where the source material calls for them.

Do not invent autobiographical evidence. When a claim needs proof, find a primary or authoritative source and keep the visible slide simple.

Before changing an established sequence, visual treatment, or interaction, read [references/deck-invariants.md](references/deck-invariants.md). It records accepted deck states that resulted from earlier corrections. Explicit user direction overrides an invariant for the current task; do not edit the skill itself unless skill maintenance is in scope.

## Implement in the existing system

Make changes in the source files identified by the root `AGENTS.md`. Reuse existing slide classes and design tokens before adding a new local class.

Default text-led slides, including quotes, to the title-slide palette: `--deck-ink` background, `--deck-paper` primary text, and `--deck-accent` only for short text emphasis or small details. Do not use the rust accent as a full-slide background unless the user explicitly asks for it or an established slide with that treatment must be preserved. The existing `statement-slide` class has an accent background, so do not select it by default for a new text-led slide.

Use low-density, high-impact layouts. Prefer large type, full-bleed imagery, or a short visual sequence over dense explanatory copy. Preserve the author's direct language and the visual rhythm established by neighbouring slides.

Treat a reference slide as a hierarchy and rhythm reference, not a cropping mandate. Identify every person, object, or piece of evidence the image must retain before choosing `cover`; use `contain` or an uncropped composition when meaning spans the frame. Keep layout geometry explicit enough that intrinsic image dimensions cannot shrink or displace the intended panels.

Apply the accessibility, source-recording, generated-output, and dependency rules in the root `AGENTS.md`.

## Work with assets

Reuse existing assets where they satisfy the request. Search the repository first when the user names a file or says an asset was supplied. A supplied asset remains the selected asset unless the user approves replacement; handle factual mismatches with accurate visible labels and source notes instead of silently substituting another image.

When the primary request is to find, capture, download, or compare media, use the project-local `ux-brighton-media-sourcing` skill. For integration, verify the chosen file itself before editing the deck and record whether it is user-provided, externally sourced, or generated.

Respect the requested scope. When the user asks only to find, download, or present options, leave the deck unchanged until they explicitly choose or request integration.

When changing the steam-factory video, preserve the established behaviour recorded in the root `AGENTS.md` unless the user explicitly changes it.

## Verify the delivered result

Use the validation checklist in the root `AGENTS.md`. For every visual, layout, media, or animation change, also read [references/visual-qa.md](references/visual-qa.md). Inspect each affected slide at presentation size rather than relying on a successful build alone.

When media or navigation is involved, exercise the interaction itself and confirm the expected state before and after navigation.

Report the files changed, the narrative or visual decision made, the build result, and the slides or behaviours actually inspected.
