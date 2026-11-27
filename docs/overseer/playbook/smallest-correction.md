---
id: smallest-correction
revision: 1
kind: convention
stages: [triage]
when: "Returning harness-defect for a refusal that breaks an existing requirement."
statement: "Name the refusal site, the distinct requirement it breaks, the smallest correction with its structured case, the affected files and a regression in an existing test file."
check: "The regression target is a test file given in the evidence, and the correction changes the cited refusal."
paths: []
source: docs/overseer.md#triage-and-corroboration
---
