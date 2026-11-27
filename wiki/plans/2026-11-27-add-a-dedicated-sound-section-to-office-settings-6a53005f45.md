---
status: "implemented"
executed: true
evidence: ["src/office/settings/SoundSettings.tsx"]
source_tool: "codex"
source: "JFusco/the-office#746"
topics: ["office-ui-and-telemetry"]
digest: "6a53005f45dbe2a91c26a7aca3b0496269c233f83821242f627a90a470bed33b"
---

# Add a dedicated Sound section to Office Settings

Add a global Sound topic after Office preferences. Provide one shared 0–100% volume slider, three independent switches and four previews. Default to 25% with all effects off.

Bundle the approved hover, setting-on, setting-off and sliding-door WAVs. Trim leading preview padding, preload and decode once, and dispatch ready cues from the interaction. Drop missed cues. Play the elevator cue when the doors begin opening or immediately at a reduced-motion floor change.

Keep saved settings compatible with historical rows. Verify mute, keyboard and pointer input, immediate dispatch during slow saves, and cross-browser preference updates.
