---
topics: [releases-and-incidents]
plans: [2026-11-27-overseer-phase-7d-runner-playbook-jfusco-the-office-714-c8a5b2443d.md]
issue: 'https://github.com/jfusco/the-office/issues/714'
issues:
  [
    'https://github.com/jfusco/the-office/issues/714',
    'https://github.com/jfusco/the-office/issues/690',
  ]
---

# Overseer phase 7d: the runner playbook

Phase 7d ([issue #714](https://github.com/JFusco/the-office/issues/714)) seeds the Overseer's playbook and selects runner guidance from it. Tests are its only callers, and no model runs. The guidance is advisory: not an Office lesson, never curated by Harper, and no authority.

What it adds:

- **The playbook.** Five entries in `docs/overseer/playbook/`, each restating a requirement the triage contract already records, with a README for the format.
- **A strict reader and loader.** An entry is YAML frontmatter only. Any parser warning, alias, unknown field or bad value refuses it. The loader reads the folder from the runner's own installation and refuses the whole playbook for one bad file. That covers a link at any folder, a pipe, a non-regular file and an oversized or non-UTF-8 entry.
- **Selection through the Office's own lesson selector.** Order, limits and rendering are unchanged. Only the heading, the stage label and the reference change, so the text never reads as Office lessons. It is selected once and frozen into the one input both opinions share.
- **Kept out of the citable sources.** Triage now refuses a playbook file, or any name with an empty, `.` or `..` component, offered as a runtime or repository source. Playbook text reaches a reader only as guidance.

The plan review ([plan](../plans/2026-11-27-overseer-phase-7d-runner-playbook-jfusco-the-office-714-c8a5b2443d.md), run `ebd911aa`) accepted 14 findings, and all of them passed recheck. The most material:

- folder containment checked at every level;
- non-blocking, no-follow opens with a cap on the bytes actually read;
- text bounds counted in UTF-16 units;
- relabelled lines and references;
- keeping the playbook out of the citable inventory.

[Issue #714](https://github.com/JFusco/the-office/issues/714) · [Overseer, Runner guidance](../../docs/overseer.md#runner-guidance)
