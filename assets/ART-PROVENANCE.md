# Art provenance

## Existing story panels

`story-panel-1.png` through `story-panel-4.png` are the original inherited story
illustrations. They were retained unchanged in this update. The original
project notes describe them as code-authored artwork rasterized in Chromium.
Their editable SVG sources are not present in this project copy.

## Visual update 1.1 — 2026-11-21

Five new runtime images were generated for this project with the installed
`imagegen/scripts/image_gen.py` CLI, model `gpt-image-2`, high quality, using
the user's configured OpenAI-compatible endpoint. Authentication was read
from the Windows user environment into the generation process only. No
credential or configuration file is part of the project or release.

- `riverbend-valley.webp`: main-menu miniature landscape.
- `valley-distance.webp`: distant mountain layers, second composition revision.
- `sandstone-bank.webp`: grass and rock terrain.
- `pine-prop.webp`: decorative evergreen sprite, keyed background and resized.
- `delivery-truck.webp`: seedling vehicle sprite. The returned alpha was
  preserved; stray background fringe was removed before resizing.

Source PNGs, full prompts and the non-runtime workshop concept are stored in
`output/imagegen/` in the working project and excluded from the portable ZIP.
Runtime WebP derivatives are bundled locally in both `site/assets/` and the
root mirror. Decoding, dimensions, nonblank content and browser loading were
checked before delivery. No external image hosting is needed to play.

The existing structural geometry remains code-native, so it follows arbitrary
player designs and deformations. It is visually shaded for shallow depth;
physics and editable coordinates remain two-dimensional.
