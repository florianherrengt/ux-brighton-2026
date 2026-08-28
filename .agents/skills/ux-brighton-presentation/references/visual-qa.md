# Real-preview visual QA

Use this after the required `npm run build`; a successful build is not visual proof.

## Use the preview the user will see

1. Inspect the current terminal or browser state for an existing Slidev server and its actual port before starting another one.
2. Reuse the exact user-visible URL and port when possible. A successful alternate-port preview does not prove that the user's current preview is healthy.
3. Use the repository-supported development command. Do not guess unsupported Slidev flags.
4. Prefer short, recoverable checks of affected slides over one large browser pass. If `networkidle` is unreliable, continue after DOM content loads and verify the visible slide and assets directly.

## Inspect each affected slide

- Check the full 16:9, 980px canvas for cropping, complete focal subjects, text wrapping, contrast, edge collisions, and unintended overlap.
- Confirm every meaningful image loaded (`naturalWidth` is non-zero) and that its visible crop preserves the evidence named in the alt text or claim.
- For text-layout corrections, inspect computed margins, colors, and bounds when theme styles could override local CSS. Compare the actual metric with the named reference rather than relying only on appearance.
- For collages, keep the intended disorder but verify that every complete headline is still identifiable.

## Exercise stateful behaviour

- Enter animations from both neighbouring slides and confirm they replay as intended.
- Navigate away and back to media slides. Verify entry playback, exit reset, natural stopping, muting, and loop state.
- Check the browser console and media state for errors when interaction or playback is involved.

If the intended preview cannot be exercised after trying an available alternate route, report precisely what was built and what remained unverified.
