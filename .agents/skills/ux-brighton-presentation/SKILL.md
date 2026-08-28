---
name: ux-brighton-presentation
description: Edit, extend, source assets for, and verify the UX Brighton 2026 Slidev talk. Use for this deck's narrative, slide order or copy, styling, deck imagery, headline captures, or video behaviour; do not use for unrelated files, other decks, or generic presentation advice.
---

# UX Brighton presentation

Maintain a coherent, stage-ready Slidev deck that faithfully turns `draft.md` into a visual 25-minute talk.

## Establish the requested change

Read the relevant sections of `draft.md`, `slides.md`, and `style.css` before proposing or editing a slide. Inspect the actual assets used by adjacent slides.

Resolve product choices before implementation when the request leaves multiple meaningful directions open. In particular, ask before removing or replacing a slide, reordering the argument, introducing a new central metaphor, changing established playback behaviour, or choosing among materially different visual treatments. Do not mistake a request to add something for permission to replace an existing beat.

## Shape the narrative

Keep each slide focused on a single spoken beat. Convert the article's argument into concise audience-facing copy, images, sequences, or transitions rather than pasting paragraphs onto slides.

Use the current deck as the sequence of record. Preserve the argument order and transitions established by `draft.md` and neighbouring slides; use practical implications or audience questions where the source material calls for them.

Do not invent autobiographical evidence. When a claim needs proof, find a primary or authoritative source and keep the visible slide simple.

## Implement in the existing system

Make changes in the source files identified by the root `AGENTS.md`. Reuse existing slide classes and design tokens before adding a new local class.

Use low-density, high-impact layouts. Prefer large type, full-bleed imagery, or a short visual sequence over dense explanatory copy. Preserve the author's direct language and the visual rhythm established by neighbouring slides.

Apply the accessibility, source-recording, generated-output, and dependency rules in the root `AGENTS.md`.

## Work with assets

Reuse existing assets where they satisfy the request. Follow the asset locations in the root `AGENTS.md` and the existing naming patterns in those folders.

For external imagery, verify the source page and usage terms, download the watermark-free original when possible, confirm the file type and dimensions, and visually inspect the result before integrating it. For screenshots, capture the requested page rather than recreating its typography.

Respect the requested scope. When the user asks only to find, download, or present options, leave the deck unchanged until they explicitly choose or request integration.

When changing the steam-factory video, preserve the established behaviour recorded in the root `AGENTS.md` unless the user explicitly changes it.

## Verify the delivered result

Use the validation checklist in the root `AGENTS.md`. Inspect each affected slide at presentation size rather than relying on a successful build alone.

When media or navigation is involved, exercise the interaction itself and confirm the expected state before and after navigation.

Report the files changed, the narrative or visual decision made, the build result, and the slides or behaviours actually inspected.
