---
topics: [office-ui-and-telemetry]
plans: [2026-11-26-issue-673-clip-bounded-evidence-at-a-complete-utf-8-character-795cc2f567.md]
issue: 'https://github.com/jfusco/the-office/issues/673'
issues: ['https://github.com/jfusco/the-office/issues/673']
---

# Cut bounded evidence at a complete UTF-8 character

`boundedEvidence` limits a PR description to 8,192 bytes. It applies the same rule to Azure goal documents (32,768
bytes) and document errors (500 bytes). It used to decode the clipped bytes and trim only while the text was longer than
the clip. When the cut fell inside a four-byte character after three of its bytes, those three bytes decoded to one
U+FFFD, which is also three bytes. Nothing was trimmed, and the description ended in a replacement character. Valid text
of 8,189 ASCII bytes followed by an emoji showed it.

The cut now moves back from the first excluded byte over UTF-8 continuation bytes to the split character's lead byte,
then decodes. A split character is dropped whole. A replacement character already in the text is a complete character
and is kept. The original byte count and the truncation flag are unchanged in the GitHub and Azure paths.

Found by diff review `ec94faf0` on PR 668. The defect predates that PR.

Evidence: `tests/unit/github/pr-evidence.test.ts` and `tests/unit/leadership/goal-evidence.test.ts` cover the
mid-character cut for GitHub and Azure, each split length of a four-byte character, and a replacement character before
a split and at the cut.

[Archived plan](../plans/2026-11-26-issue-673-clip-bounded-evidence-at-a-complete-utf-8-character-795cc2f567.md) · [Issue JFusco/the-office#673](https://github.com/JFusco/the-office/issues/673)
