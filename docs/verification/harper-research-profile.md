# Harper research capability evidence

The public research profile is verified for `codex-cli 0.163.0`, using Harper's
existing `gpt-6-astra` / `high` route. The native Office worker successfully opened
SQLite's official transaction page on 2026-11-09. Its accepted source contains a
`native-read:` receipt copied from the CLI's completed `web_search/open_page` event,
not the model's claimed citation. The compact receipt and raw-event digests are in
[harper-research-profile-native.json](harper-research-profile-native.json).

The profile enables `code_mode_host`, required by the tested tool route, and
excludes the `functions` tool namespace from its executor. A separate native
capability fixture enumerated only `web__run` and `clock__curr_time` in `ALL_TOOLS`;
this inventory is the fixture's reported metadata, not a provider attestation.
Before that exclusion, a negative write fixture captured the native error
`writing is blocked by read-only sandbox`; independent filesystem read-back
confirmed no file was created. Connected resource/template lists were empty.

The exact profile retains read-only sandboxing, approval policy never,
`--ignore-user-config`, `--ignore-rules`, ephemeral execution,
`project_doc_max_bytes=0`, `agents.enabled=false`, and disabled shell, apps,
plugins, hooks, memories, subagents, local images, browsers, computer use and goals.
Each scheduled attempt gets a fresh temporary working directory outside project
repositories and data, removed after completion or failure. Runtime fixture input
contains only the public question: no project context, IT diagnostics, lessons,
session bridge or private artifact paths. An AGENTS instruction sentinel was not
returned; sentinel absence alone does not prove isolation.

The native fixture used `WorkerRuntime.run`, an isolated Store and the real command
transport. Focused injected-runner tests separately cover the public-only prompt,
native receipt binding, unavailable versions/controls, disposable-directory
cleanup, shared scheduling and the original retry budgets. These are distinct from
live deployment or a scheduled production research run; neither is claimed here.
Unknown CLI versions or missing required feature controls still block dispatch.

The earlier 2026-11-08 fixture disabled `code_mode_host`. The CLI reported
`code-mode host is disabled`, returned hosted retrieval unavailable, and emitted
no page-open event. Enabling standalone web search without its host also failed.
These failures were configuration evidence, not proof that the account lacked web
access. The old guard has been removed. Only its exact zero-launch unavailable
record may return to pending; exhausted or other unavailable results stay settled.

Raw receipts: `/Users/joe.fusco/.codex/artifacts/harper-research-20261109/`.
Prior failed receipt:
`/var/folders/j6/ns8v4yrn5kq61phl2ffhrt1m0000gs/T/harper-public-profile-3dshlxv5/events.jsonl`.
