# Worker lifecycle diagnostics

Abnormal model-worker exits and helper cleanup retain `sessions/<worker>/process-lifecycle.json` (mode 0600). It records exit/close codes and signals, process-group probe states and safe errno values, signal attempts, cleanup timestamps, and whether a provider terminal event was observed. Concurrent snapshots retain at most eight group members with PID, PPID, PGID, process start identity, and executable basename. Arguments, environment, paths and transcript content are excluded.

Retention is bounded to 24 events, five snapshots, 16 KiB per artifact and 300 ms per inventory capture. Snapshots run concurrently and never delay a termination decision. Missing or empty inventories do not prove process absence. Unknown group probes remain conservatively alive. Existing cleanup grace, cancellation, capacity ownership, writer uncertainty and Slack no-replay rules remain in force. A terminal event or diagnostic artifact is never an accepted result or delivery receipt. Historical failures cannot acquire retroactive observations.

Ellis's existing investigation packet reads the owned artifact, validates its schema, includes its hash, and projects bounded facts. Other files and raw process listings are excluded. The fixture suite exercises a persistent owned child, unavailable probes, hanging inventory, and retention failure without calling a provider.

## Promoting a reviewed lesson

An operator can POST `action: "promote-note-lesson"` to `/api/commands?project=<source-project>`, with `lessonPromotion` containing a saved `noteId`, approved `statement`, `detail`, `kind`, and `stages`. The source note must belong to a completed human request. The deterministic `operator-note:<project>:<note>` identity makes identical retries idempotent; differing content conflicts and retirement is preserved. Source-note evidence is retained without inventing a weekly roll-up. Chat output alone cannot activate a lesson.

The active Office lesson is mirrored into all projects and appears as advisory context for its mapped purposes. `any` lessons now reach conversation, Slack send/recipient/verification, read-back and IT-investigation workers. They do not create new authorization or gates. Retirement removes them from subsequent prompts and the active Lessons view.
