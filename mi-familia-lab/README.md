# Mi Familia Lab — design reference

This is a design mockup created in a visual design tool, exported as a
standalone page. Treat it as a REFERENCE MOCKUP, not production code:
the markup and inline styles carry the design's precise values — colors,
font sizes, spacing, radii, shadows, layout — which an implementation
should replicate faithfully in its own components and styling system
rather than copy wholesale.

## Contents

- `Lab.dc.html` — the artboard (a Design Component: an `<x-dc>`
  template + a small logic class). The values to replicate live in its
  inline `style="…"` attributes and the `<helmet><style>` block.
- `ds/odin/_ds_bundle.js` — referenced resource
- `ds/odin/styles.css` — referenced resource
- `ds/odin/components/data/data.css` — referenced resource
- `ds/odin/components/display/display.css` — referenced resource
- `ds/odin/components/forms/forms.css` — referenced resource
- `ds/odin/components/navigation/navigation.css` — referenced resource
- `ds/odin/components/overlays/overlays.css` — referenced resource
- `ds/odin/tokens/base.css` — referenced resource
- `ds/odin/tokens/brand.css` — referenced resource
- `ds/odin/tokens/colors.css` — referenced resource
- `ds/odin/tokens/fonts.css` — referenced resource
- `ds/odin/tokens/gradients.css` — referenced resource
- `ds/odin/tokens/layout.css` — referenced resource
- `ds/odin/tokens/motion.css` — referenced resource
- `ds/odin/tokens/palette.css` — referenced resource
- `ds/odin/tokens/radius.css` — referenced resource
- `ds/odin/tokens/shadows.css` — referenced resource
- `ds/odin/tokens/spacing.css` — referenced resource
- `ds/odin/tokens/touch.css` — referenced resource
- `ds/odin/tokens/typography.css` — referenced resource
- `assets/` — files uploaded to the design (images, fonts, media)
- `support.js`, `vendor/react*.js` — the runtime that renders the
  component in a browser; not part of the design.

## Uploaded files

Images, fonts and media uploaded to the design are written once each under
`assets/` — 35 in this export — and the exported files refer to them there. A
reference a script puts together while the page runs (for example
`"/_blob/" + id`) is not rewritten and does not load from this folder.

## Viewing

Serve the folder (e.g. `python3 -m http.server`) and open `Lab.dc.html`;
some browsers block the scripts over file://.
