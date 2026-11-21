# External session awareness

Ordinary harness delivery for Brain and CMS Vocabulary uses the Office's registered admissions,
current scheduler claims and explicit holds. A missing chat inventory remains an
unavailable context source; it does not prevent an otherwise authorized delivery.
Each scheduled write rechecks the exact persisted job or original recovery request,
claim, stage and controls. Private candidate identity, provider head leases, source
acceptance, independent review, QA and durable effect readback still apply. An
interrupted original worker is never accepted or replayed because chat context is
optional. Jira/Azure (CEC) start, ordinary resume and the PM intake review follow the same rule: a
missing or incomplete chat inventory is unavailable context, never a blocker or an owner. A
competing writer is named only from positive evidence: a session shown actively working or waiting
on the exact ticket (reported as `owned` even when the rest of the inventory is incomplete or stale), local
writes by another session, another PR for the ticket, a live resource lease, a refused handoff, or a
remote candidate branch holding a commit the Office worktree does not contain
(`server/cec/candidate-branch-moved.ts`). Explicit QA coordination handoffs, QA plan retries and
saved-implementation continuations still require a complete, fresh inventory in code until those
paths are replaced. Older native recovery workflows and native maintenance
retain their existing ownership rules. Their historical proof formats are unchanged.

The Office checks the shared Codex runtime, open Codex desktop/CLI rollout identities,
Claude's live inventory and its own worker claims. A chat's starting directory alone
does not describe all the repositories it is working in.

For positively loaded Codex identities and live Claude interactive/background sessions,
the bridge reads the current turn's explicit
repository, issue and PR references and up to four recent user messages. It includes
cross-repository context in the project's ownership packet. A linked PR number maps
back to its exact Office delivery ticket; identical numbers in other repositories do
not match. New turn events replace the prior turn's scope. Completed/idle chats supply
context without claiming active ownership.

The same loaded chat also retains conversation project references across turns and
up to 64 user/assistant messages, with 4000 characters per message. Roles, timestamps,
truncated-message flags and an omitted-message count make the evidence limits explicit.
This allows a later brief follow-up to preserve visibility in every previously referenced
Office project, including chats rooted in a shared configuration repository. Earlier
user decisions and assistant reports remain readable in `context.conversation`; they
are evidence to verify, not inferred approvals. Current-turn references and native metadata feed issue ownership; retained
conversation evidence never turns old commands into new active claims. This history starts
at the child session's own history boundary for a fork, and does not load closed chats.

Tool-returned URLs are references for focused investigation. They do not prove an
active writer. Exact issue/PR commands in an active turn can establish ownership;
unknown activity or reference-only evidence requires reconciliation. Reasoning is
excluded. Conversation text is untrusted context and never grants harness permission
or replaces live issue/PR read-back, configured holds or structured prerequisites.
The bridge never messages, resumes or interrupts another session.

Reads stay within the local Codex session directory. JSONL is streamed with a
64 MiB bound per record and one shared read deadline, rather than buffered as a
whole transcript. The reader first captures one complete, metadata-stable file
version into a private, immediately unlinked descriptor, then parses that immutable
version. The descriptor closes on success or failure; no named transcript is retained.
An append during capture discards the attempt and permits one fresh capture within
the original five-second deadline. Appends after capture belong to the next
observation and invalidate the derived cache key; they do not invalidate the earlier
complete observation. Inventory freshness starts before the native reads and capture,
so parsing never grants an old snapshot a new freshness window. The same loaded
identity and complete current-turn records are required. Stable malformed records,
replacements, expired observations and continuing capture-time churn stay unavailable.
Source status uses fixed failure categories without exposing native stderr, chat
text or session paths. A context deadline also names its canonical session UUID
(or `unavailable`), file size, snapshot/fold/identity phase, elapsed phase/read time
and event-loop active/idle time. These bounded observations distinguish snapshot
waits from parser or event-loop work; they do not establish a cause by themselves.
Failure diagnostics never clear ownership or extend the five-second limit.
Unreadable, mismatched or incomplete context makes coverage unavailable;
it cannot produce a clear ownership verdict. This does not provide universal visibility
into remote clients or historical chats. Claude's native inventory supplies activity;
its exact session ID selects the local transcript, including after a checkout moves.
Claude tool results and API-history blobs cannot masquerade as new human decisions
or new tool executions. Unchanged files reuse a derived context index so idle chats
do not require repeated full transcript scans. Growing Codex chats also retain a
derived parser checkpoint before the final blank or unterminated record. The next
immutable capture hashes every previously observed byte before using that checkpoint;
only a matching prefix with the same session, file identity and project bindings
can continue from it. Changed prefixes and truncated files receive a complete fold.
The final record is always reparsed, so an append cannot turn a malformed or partial
record into accepted coverage. Checkpoints contain derived context and a digest,
never transcript bytes or file descriptors. Hashing and parsing share the unchanged
five-second deadline. An interrupted first fold may retain internal progress every
16 MiB at a completed chunk boundary. That progress contains only the derived
parser state, the last sealed-record offset and a digest of the consumed bytes.
The failed read still returns unavailable, never partial context or clear ownership.
On a later normal inventory read, a fresh immutable capture must hash every retained
prefix byte before continuing; changed prefixes, file/session/project identity changes
and truncation invalidate that progress. Full coverage, strict record validation and
freshness are still required before any ownership verdict. No retry or budget reset
is authorized by a saved parsing checkpoint.

Codex rollouts and Claude transcripts are read the same way, on one worker thread
of the service that owns both readers and their derived caches. A read needs many
turns of an event loop inside its five-second deadline, and the service's own loop
can be held for seconds by store writes; the deadline is measured on the thread.
The thread returns derived context or the reader's own failure, never transcript
bytes. A thread that exits, or gives no answer within twenty seconds, fails every
read it still owed as unavailable and is replaced on the next read; its caches start
empty, so the next reads are complete folds. Each project's Jira site and key are
resolved by the service and sent with the read. The thread reads no local
configuration at all, so a configuration file edited or damaged since the service
started cannot change or stop it; a Jira/Azure project that arrives without its site
and key is refused, never read as owning no ticket.

A forked Claude transcript may begin with copied parent records before its own
native identity records. The child index excludes that parent conversation and
ownership scope. A child that has not sent a message yet can still bind through
its native metadata; a foreign identity after that boundary fails the read.

When Joe merges an existing PR and completes its linked issue elsewhere, ordinary
read-only handoffs retire through positive provider read-back. A stopped CI source
repair can also retire once its workers finished, its writes and board moves are
verified, and no claim, pending request, merge or recovery remains. Its original head,
local worktree, repair results and provider receipts are retained. Retirement cancels
the redundant handoff; it does not claim Office review, checks or closeout completed,
and it never publishes or deletes the local repair.
