---
topics: [releases-and-incidents]
plans: [2026-11-26-close-the-evidence-redaction-gaps-in-627-ff6df4e7c7.md]
---

# Close the evidence-redaction gaps

The fixes for #539 and #542 merged without `/review-plan` or `/review-implementation`. A later read-only helper review of what they shipped found eight shapes where a credential survived incident evidence:
1. a dotted property name;
2. a camelCase name past 64 characters;
3. a number or object value;
4. a serialized tab or newline between a label and its value;
5. an escaped apostrophe inside a JSON string;
6. a dotted next label;
7. `password=` swallowing the next label;
8. an uppercase `\U001b` read as a colour code.

A ninth question, where a bare value ends at a written `\uXXXX`, went to Joe. He chose option (a): a written whitespace escape ends the value, and a printable escape stays in it and is masked.

The surgical corrections the first review accepted were not enough. Two plan reviews turned the fix into a change of how redaction decides where an edit begins and ends:
- `JsonLayers` maps every JSON string of the original text once, in one forward pass, including JSON pasted into prose. Each string records its depth and its content decoded to that depth.
- Edits whose extent depends on that depth are chosen on the original text in one forward sweep. These are non-string values, quoted values, labels with nothing after them, and bare values read at their depth. The text is then rendered once.
- The shared sanitizer receives the original text's JSON mode instead of guessing it from text full of placeholders.
- Bare Authorization and Cookie fields use the shared whole-field boundary, including when a serialized gap precedes the punctuation.

A whitespace escape at the bare value's layer ends a value already in progress and preserves the following text. A printable escape stays inside the value and is masked. Evidence that newly matches a widened rule loses text, and the fingerprint of an incident cause holding such text shifts once.

[Archived plan](../plans/2026-11-26-close-the-evidence-redaction-gaps-in-627-ff6df4e7c7.md) · [Issue JFusco/the-office#627](https://github.com/JFusco/the-office/issues/627)
