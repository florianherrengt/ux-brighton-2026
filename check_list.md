# UX Brighton 2026: slide and content checklist

This reviews the current 22-slide deck in [slides.md](slides.md) against the speaker guidance. An unchecked item needs a decision or verification; it does not always mean the slide is defective. This list concerns the talk and its files, not event logistics.

## Check the ending

- [ ] **Slides 19–22 — spoken ending:** These beats (meat proxy, research workflow, faster horses, user experience) are absent from the current draft text. Rehearse their transitions from the historical examples and decide whether the “user experience” question is the intended final beat for now.

## Make each visual beat understandable

- [ ] **Slide 2 — headline collage:** Say that this shows how the AI/jobs debate is being framed. Do not present the headlines as proof that their predictions are true. Give the audience the point aloud; individual screenshot headlines cannot be relied on as readable evidence from the room.
- [ ] **Slides 3–5 — horse comparison:** Explain that the chart shows US horses declining as cars rise, then state why “you are not a horse”: the draft's distinction is that people can learn and reinvent themselves. Name the food → horse → mechanical work diagram as the limited economic analogy, not a model of human value.
- [ ] **Slides 6–9 — “Bullshit” turn:** Make clear that the stamp rejects the idea that the same jobs will simply continue with AI making workers faster. Explain what the three profession photos and robot overlays represent; they illustrate a possible redesign of work, not a claim that the pictured people have already been replaced.
- [ ] **Slide 10 — timeline:** Introduce it as a conceptual move from the known past to an uncertain future, not a dated forecast or data graphic.
- [ ] **Slides 11–14 — electrification:** Tell the full sequence: central steam engine and shafts, a central electric motor driving the same system, then wires and individual motors changing factory layout. The furnace footage, Edison portrait, lightning symbol and later-looking control-panel image do not explain that mechanism by themselves; treat them as illustrations, and do not imply Edison single-handedly caused factory electrification.
- [ ] **Slides 15–18 — historical examples:** State what the 1865 red-flag law required and connect it to preserved human steps. Explain how Durant transferred his manufacturing/distribution skills from carriages to cars, and how Stephenson progressed from operating and understanding machinery to building locomotives. The images and dates alone do not carry those arguments.
- [ ] **Slides 19–20 — current-work example:** Give one concrete example of a “meat proxy” and distinguish it from a person doing valuable evaluation. Trace the research workflow in arrow order, including how real user testing and feedback change the outcome. Clarify whether this diagram is a proposed system or a demonstrated result.
- [ ] **Slides 21–22 — conclusion:** Explain the link from “faster horses” to the question about the “user.” If slide 22 is the ending, make the practical point aloud rather than relying on the question marks to carry it.

## Readability and accessibility in this deck

- [ ] **Slides 2–3:** Provide the meaning of the image text aloud or in accessible audience material. Slide 3's embedded axis labels are small; identify the two series and the US scope verbally. Slide 2's live accessibility tree exposes the collage's general description, not the individual headlines.
- [ ] **Slide 19:** Check the grey definition text and rust emphasis from the back of the room; the rendered text looks subdued against the dark background.
- [ ] **Slide 20:** Test this dense workflow at projection distance. It uses 11–14 px supporting labels across eight boxes. Increase or simplify any text that cannot be read comfortably.
- [ ] **Slides 11–14 and any other visual-only slide:** Describe important visual information while speaking. The factory clip is muted; explain what it contributes to the argument. If any final media has meaningful sound or dialogue, provide captions or a transcript, and check they survive the chosen presentation format.
- [ ] **Final shared file:** Check the exported file itself. Slidev's PPTX contains full-slide images, so provide a text/HTML outline if it will be shared with an audience. For PDF, check selectable text, reading order, and contrast in the actual file. Explain meaningful visuals in speech or the outline.
- [ ] **Full rehearsal:** Run all 22 slides aloud within 25 minutes. Cover every relevant visual and chart in speech, explain acronyms, pause after dense slides, and check the transitions without relying on the audience to read small text.

## Presentation file checks

- [x] The deck is configured at **16:9** in slides.md.
- [x] Generate the 16:9, 22-slide image-based PPTX with `npm run build:pptx`.
- [ ] Check every exported slide at presentation size. For Keynote, open the PPTX in Keynote and save a `.key` copy. The factory video needs a separate playback plan because these exports contain still slides.
