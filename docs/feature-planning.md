# Feature discovery and planning

On projects with automatic planning enabled, Morgan reads assigned tickets before ordinary intake and decides whether they need a feature plan. Casey researches the captured requirements and repository, asks genuine product questions, and prepares the brief. Alex writes the implementation plan. The installed independent review workflow must accept the plan before the harness authorizes it under the recorded project policy and hands it to existing delivery.

Existing saved features stay manual. Features with no saved progression field are also manual. Open **Features** on the delivery floor and choose **New feature** to describe an idea. Existing goals also have an explicit planning action. On projects without activation, ticket inspectors still offer **Plan a feature from this ticket**. Manual features keep **Confirm brief & create plan** and **Approve & start delivery**.

## Project activation

`office-config.json` in the Office data directory owns per-project activation. The fallback remains manual with assessment disabled. After the first three implementation branches are merged and verified, explicitly add each participating project:

```json
{
  "featurePlanning": {
    "cec": { "progression": "automatic", "assessment": { "enabled": true } },
    "brain": { "progression": "automatic", "assessment": { "enabled": true } },
    "cms-field-vocabulary": { "progression": "automatic", "assessment": { "enabled": true } }
  }
}
```

Merge this field into the existing configuration; preserve holds, provider bindings, concurrency, model routes and release controls. Optional `planningLabels` and `ordinaryLabels` are exact, unique, disjoint lists under `assessment`; both default to empty. No product labels are inferred from ticket titles. Disabling policy stops automatic progression at a policy wait; it never converts a saved manual feature or discards ownership.

The service reads this file only at start. Turning a project on or off takes effect only after a guarded restart once the service reports `busy: false`; read back the loaded activation summary afterwards.

Deploy a reviewed, green immutable release only after the current service reports `busy: false`. Read back the loaded revision and activation summary after restart. Configuration examples alone are not evidence of runtime activation.

## Intake and evidence

Capture reads descriptions, comments, direct children and attachment references through the configured GitHub or Jira adapters. Original Jira description structure is retained. Evidence files live privately under `assessments/<project>/<ticket>/`; byte hashes identify retained artifacts and a separate semantic digest identifies requirement changes. Capture has bounded commands, pagination, attachment bodies, bytes and extraction. Missing access, truncation and unread images remain explicit coverage gaps. A downloaded screenshot is not automatically a visual interpretation.

Active feature ownership, an explicit Start, existing delivery/adopted PR ownership and the Epic decomposition restriction precede label rules and Morgan's assessment. Explicit Start on an unenrolled ticket retains ordinary delivery. Ordinary delivery still follows its existing conditional planning, review and validation policies.

Assessment episodes have durable terminal outcomes. Queue time and active assessment duration have no fixed cutoff. Morgan may continue while producing output. Forty-five minutes without stdout activity triggers worker recovery through the existing bounded retry path. Exhausted unavailable assessments fail open to ordinary delivery. Late model results cannot override Start, fail-open or an enrolled feature. Historical deadline outcomes are retained and an explicit assessment request can create a fresh episode after ownership checks.

Deterministic capture uses the existing operations lane. Morgan uses the shared delivery runtime and runs exclusively, including when delivery concurrency is three. Recurring provider observations share FIFO priority with evidence capture so repeated refreshes cannot overtake an older capture. Worker capacity is preserved.

## Questions for you

The persistent **Questions for you** control collects authorized current questions across projects and floors. The owning project must have planning activation enabled. Source visibility is checked before projection and again before commands; revoked or restricted content is withheld.

The native modal shows one question at a time with Back/Next, recommendations, tradeoffs and a custom answer. Nothing is submitted by default. **Send answers** submits the whole current product/review round to its owning project. **Later** and Escape preserve drafts and suppress only that round in this browser. New rounds remain eligible. Drafts are keyed by project, feature, round and question; stale responses and transient failures preserve unrelated drafts. Tour/demo mode, project switching and an unconfirmed connection suspend opening and submission.

Recovery questions are authored by the harness. **Save note** records context without answering, resolving, revising or requeueing work. An explicit available action is still required. **Retry once** authorizes one attempt of the stored operation while retaining automatic counters; an uncertain write offers read-back only and is never resent. **Pause** preserves evidence and ownership. **Return to ordinary delivery** appears only when current ownership, process, publication and effect checks prove release safe; it retains the historical source ticket and stops this feature's progression.

On enabled projects, ticket inspectors show **Open feature plan** for enrolled tickets and **Ask Morgan to assess** for unenrolled tickets. The assessment request is idempotent and cannot reopen terminal Start/fail-open episodes or bypass ownership. Document views derive Draft, Reviewed and Accepted labels, including policy or human authority, from the saved records without rewriting legacy approval digests.

## Revisions, recovery and release

Each stage allows one initial execution plus two automatic replacements, with 30-second and 120-second retry delays. A feature permits three lifetime replans across revisions. Helper-internal refinements retain the helper's own existing limit. Waiting and stale-result rejection do not spend replacements. Unsupported capabilities, permission/authentication failures and exhausted recovery ask for a harness decision.

Interrupted readers wait for their owned processes to stop. Review recovery adopts and inspects the original canonical helper run, never blindly starts a second run. Process-stop handling is bounded; a surviving process retains its exact claim and delivery reservation until absence is confirmed. A recovery note cannot release that reservation.

Authorization rechecks the confirmed brief, reviewed plan and manifest, current review/research receipts, source baseline, provider evidence, policy, ownership and unanswered decisions after asynchronous reads. Automatic approvals record policy authority; manual approvals retain Joe's authority. Legacy approvals keep their original hashed shape.

Discovery and plan review share an isolated source checkout. Authorization reads the remote target and compares relevant file content, modes, presence and repository instructions. The comparison is limited to the approved scope, so unrelated commits can coexist with an accepted plan.

Requirement edits cause counted replanning for unstarted scope. Only an exact verified Office Effect postimage can explain away a provider change; author identity alone cannot. Started items retain their approved scope and require separate follow-up work for changes.

All external mutations use durable Effects. Uncertain publication remains addressable by its original intent across restart or replan. Create fences never expire and clear only after verified identity reservation or proven undispatched rejection. Reconciliation settles uncertainty without overriding unrelated product/review waits. Delivery is considered queued only after exact feature/item/approval and request/review/job read-back, never because another owner exists for the ticket.

GitHub publication validates repository permissions, labels, assignment and configured board placement. CEC discovers base issue types and required fields with TWG. The configured board scope determines the membership read-back. Unsupported required fields surface as a blocker.

GitHub successors wait for verified merge and closeout. CEC successors wait for verified staging acceptance. Existing holds, prerequisites, ownership, implementation review, selected validation, merge approval and production release controls remain authoritative.

## Verification and CEC-154 acceptance

Unit tests use isolated stores and injected command runners. Browser tests use the synthetic fixture server. Required delivery gates are `pnpm test`, `pnpm build` and `pnpm test:browser`; build/unit CI does not substitute for a recorded browser run. The final integrated branch-three browser receipt covers this branch only after its `runtimeRevision` and the runtime source and built assets are verified to match byte for byte. If runtime identity differs, run the full synthetic `pnpm test:browser` suite again before release.

After activation and deployment, CEC-154 acceptance must read back current assignment, mailbox, ownership and actual staging identity, then retain the original description structure and CEC-155/156 relationships. Morgan's evidence must identify the description, Matt's comment, screenshot and children with hashes and coverage. The accepted plan must cover comment revisions, protected Page Structure, per-thread outcomes, stale-write protection and preservation of authored edits through regeneration. Independent review must complete, and the approval must record policy authority. The matching handoff must enter existing CEC implementation review and staging verification without an approval click.

Read back the evidence chain from assessment through answers, accepted plan, completed independent review and policy approval to the matching CEC implementation review, delivery run, PR and verified staging result. Read back must also show no duplicate or parallel work for CEC-154.

Do not flatten rich content or force an unsupported Epic through publication. A missing lossless rich-content adapter or unsupported decomposition is a visible capability question. Live acceptance remains incomplete until the evidence chain reaches a matching delivery run, PR and verified staging result with CEC-155/156, comments and attachments preserved. Acceptance also stays incomplete while any required evidence or staging identity remains unresolved. Production release remains separate.

The original feature planning implementation and its review history are recorded in [the original plan](plans/feature-planning.md).

Rich Jira source descriptions retain their original ADF nodes. The approved plan text is appended to the document through native raw-ADF field publication. Approval preimages and read-back include the full rich structure, so changes to marks and attributes invalidate the pending write.

Codex ownership coverage uses the live runtime when available together with the native process inventory. An absent runtime socket is covered only when all positively loaded process identities have explicit current-turn activity. Failed, timed-out or unknown process reads keep ownership unavailable.
