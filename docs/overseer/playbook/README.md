# Overseer playbook

Runner guidance for the Overseer's model readers. It is advisory. It is not an Office lesson: Harper
does not curate it, it does not appear in Joe's lesson digest, and it grants no authority. Current
source and the requirement examples in the evidence win over it. An entry restates a requirement
that `docs/overseer.md` already records. It never adds a rule, a gate or a verdict.

The runner reads this folder from its own trusted installation, and `server/overseer/playbook/`
selects from it. See [Runner guidance](../../overseer.md#runner-guidance).

## Entry format

One entry per file, named `<id>.md`. The file is YAML frontmatter only, with no body: an opening
`---` line, the fields, a closing `---` line and at most one final newline. Every field is required.

| Field | Value |
| --- | --- |
| `id` | Lowercase kebab case, at most 64 characters, equal to the file name without `.md` |
| `revision` | A positive integer. Raise it by hand whenever the entry's meaning changes |
| `kind` | `convention`, `pitfall`, `process` or `tooling` |
| `stages` | Overseer reader stages. Today only `triage`, which covers both opinions |
| `when`, `statement`, `check` | The situation, the action and how to tell it worked: one trimmed line each, at most 240 characters |
| `paths` | Up to four canonical repository-relative paths, each at most 120 characters. They rank an entry; they never filter it |
| `source` | The heading the entry restates, as `docs/overseer.md#<heading-slug>` |

A malformed entry refuses the whole playbook: nothing is applied in part. A selected entry renders as
`- [<kind> · triage] When: … Do: … Check: … Reference: playbook:<id>@<revision>`.

## Checking an edit

An edit to entries only can be classed as documentation and skip the hosted unit tests. Run the
seed check yourself:

```bash
pnpm exec vitest run tests/unit/overseer/playbook/seeded-playbook.test.ts
```
