# Riverbend story illustrations

The four `story-panel-N.svg` source illustrations and matching PNGs are original code-authored project artwork created on 5 November 2026. They share the game's forest, river, timber and warm orange visual identity. The PNGs are local Chromium rasterizations at 1536 × 1024; SVG sources remain editable. No third-party characters, logos or downloaded artwork are embedded.

An AI illustration attempt used the user's explicitly specified OpenAI-compatible route (`https://api.quya.org/v1`, `gpt-image-2`, high quality, 1536 × 1024, PNG, `--no-augment`) with the bundled imagegen CLI. The endpoint returned HTTP 401 `Invalid API key`; it produced no image. These delivered panels are therefore **native illustrations, not API-generated images**. The ordinary Codex model configuration and authentication were not changed. Image authentication was read only from `image-auth.json` into that image subprocess and is not part of this project or its portable package.

Narrative sequence: (1) broken route delays garden seedlings; (2) apprentices investigate a triangular model with their guide; (3) a bridge takes shape through hands-on building; (4) a safe crossing reconnects the garden and points toward the wider valley. Captions are accessible HTML in the game, so no writing is baked into the artwork.

The user subsequently corrected the exact model ID to `image2.6`. The bundled CLI rejects that ID locally because it only accepts the `gpt-image-` prefix. Without modifying the skill, a standard-library direct OpenAI-compatible REST request was made to `/v1/images/generations` with exact `image2.6`, the same unaugmented prompt, 1536 × 1024 and high quality. That request also returned HTTP 401 `INVALID_API_KEY`. No successful generation or empty-image success is claimed, and 401 responses were not repeatedly retried.

If a valid image credential becomes available, new generated panels can replace the corresponding PNG asset paths without changing game logic. Do not describe the current native panels as successful AI generation.
