# External session awareness

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

Tool-returned URLs are references for focused investigation. They do not prove an
active writer. Exact issue/PR commands in an active turn can establish ownership;
unknown activity or reference-only evidence requires reconciliation. Reasoning is
excluded. Conversation text is untrusted context and never grants harness permission
or replaces live issue/PR read-back, configured holds or structured prerequisites.
The bridge never messages, resumes or interrupts another session.

Reads stay within the local Codex session directory and are bounded at 64 MiB per
loaded rollout. Unreadable, mismatched or incomplete context makes coverage unavailable;
it cannot produce a clear ownership verdict. This does not provide universal visibility
into remote clients or historical chats. Claude's native inventory supplies activity;
its exact session ID selects the local transcript, including after a checkout moves.
Claude tool results and API-history blobs cannot masquerade as new human decisions
or new tool executions. Unchanged files reuse a derived context index so idle chats
do not require repeated full transcript scans.

When Joe merges an existing PR and completes its linked issue elsewhere, ordinary
read-only handoffs retire through positive provider read-back. A stopped CI source
repair can also retire once its workers finished, its writes and board moves are
verified, and no claim, pending request, merge or recovery remains. Its original head,
local worktree, repair results and provider receipts are retained. Retirement cancels
the redundant handoff; it does not claim Office review, checks or closeout completed,
and it never publishes or deletes the local repair.
