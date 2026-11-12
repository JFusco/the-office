# Retiring incomplete historical records

An operator may explicitly accept an incomplete historical Brain maintenance record or blocked subprocess diagnosis through `POST /api/commands` with action `retire-incomplete-history` and a `historyRetirement` intent. The intent names each exact record and its SHA-256 over `JSON.stringify(record)` excluding its `retirement` field, includes a reason, and sets `acceptIncompleteHistory: true`.

The scheduler rechecks the original records, terminated process groups, related claims and unsettled external Effects before recording the disposition. A changed record or failed fence blocks the entire batch. An identical intent returns its existing request, including a failed request; it does not dispatch twice.

Retirement adds separate metadata. It preserves blocked/interrupted status, errors, native evidence, reports, counters and original checkpoints. It is administrative acceptance of incomplete history, not reconciliation, maintenance completion, a proved cause or an external-effect success. Retired records leave active follow-up and automatic diagnosis/read-back queues. New faults remain visible. Later normal maintenance still uses current ownership, native date/claim/retry gates and read-before-write deduplication; no fresh maintenance is dispatched by retirement.
