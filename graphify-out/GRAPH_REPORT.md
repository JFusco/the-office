# Graph Report - the-office  (2026-11-06)

## Corpus Check
- 350 files · ~179,683 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2098 nodes · 9087 edges · 78 communities (76 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 43 edges (avg confidence: 0.74)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c3734ac6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- OfficeScene.tsx
- source-amendment.ts
- Store
- index.tsx
- cec/workflow.ts
- .save
- artifact
- accept-stage-result.ts
- Inspector.tsx
- agents.ts
- dependency-bots/adopt.ts
- closeout-recovery.ts
- GitHubDelivery
- shared.ts
- activation-recovery.ts
- requests.ts
- index.ts
- conversations/conversations.ts
- publish-pr.ts
- store.ts
- SettingsPanel.tsx
- worker-runtime.ts
- digest
- github-context.ts
- .emit
- work-summary.ts
- azure.ts
- OfficeSnapshot
- github-delivery.ts
- ControlStore
- Coordinator
- config.ts
- approval.ts
- notifications.ts
- features/workflow.ts
- coordination.ts
- dependencies.ts
- github-check-selection.ts
- goal-reviews.ts
- FeatureWorkspace.tsx
- TicketJob
- remove-candidate.ts
- goal-reporting.ts
- jira-publication.ts
- jira-time.ts
- service-health.ts
- features.ts
- github-publication.ts
- JiraFeaturePublisher
- TimeBook.tsx
- .transaction
- scheduler.ts
- time-classification.ts
- it-specialist.ts
- brain-audit-reuse.ts
- preferences-store.ts
- continuation-evidence.ts
- daily-cto.ts
- coordination-tick.ts
- saved-prerequisite-handoff.ts
- session-bridge.ts
- scheduled-work.ts
- closeout-supervision-proof.ts
- checkpoint-completion.ts
- DailyCTO.tsx
- useOfficePreferences.ts
- assignment-poll.ts
- Offices
- command-registry.ts
- delivery-task.ts
- cli.ts
- preparation-board-provenance.ts
- retire-external-delivery.ts
- deliveryInputSha256
- liveReach
- dependency-edges.ts
- helper-evidence.py

## God Nodes (most connected - your core abstractions)
1. `Store` - 200 edges
2. `GitHubDelivery` - 110 edges
3. `TicketJob` - 107 edges
4. `artifact()` - 85 edges
5. `digest()` - 82 edges
6. `command()` - 82 edges
7. `workKey()` - 68 edges
8. `StageResult` - 61 edges
9. `cx()` - 59 edges
10. `OfficeSnapshot` - 53 edges

## Surprising Connections (you probably didn't know these)
- `projectOutbox()` --calls--> `parkedProviderWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts
- `projectOutbox()` --calls--> `readinessWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts
- `pump()` --calls--> `deferredPickup()`  [EXTRACTED]
  server/conversations/team-conversation-pump.ts → src/work/pickup-state.ts
- `needsReconciliation()` --calls--> `workKey()`  [EXTRACTED]
  server/delivery/parking/retire-backlogged.ts → src/contracts/work.ts
- `StageContext` --references--> `Role`  [EXTRACTED]
  server/delivery/pipeline/accept-stage-result.ts → src/shared.ts

## Import Cycles
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/stage-reconciliation.ts -> server/delivery/recovery/implementation/continuation-review-readback.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-guard.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/preparation/post-conflict-preparation.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-publication.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/conversations/conversations.ts -> server/conversations/slack.ts -> server/workers/agents.ts -> server/conversations/conversations.ts`
- 3-file cycle: `server/conversations/slack.ts -> server/workers/agents.ts -> server/workers/worker-runtime.ts -> server/conversations/slack.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/scope-repair/scope-repair-resume.ts -> server/delivery/recovery/validation/validation-provider-context.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/conversations/conversations.ts -> server/scheduling/engine.ts -> server/workers/agents.ts -> server/conversations/conversations.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/stage-prompts.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-checkout.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-evidence.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-preparation.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/conversations/conversation-recovery.ts -> server/conversations/conversations.ts -> server/conversations/team-conversation-pump.ts -> server/conversations/conversation-recovery.ts`
- 3-file cycle: `server/scheduling/coordination-pump.ts -> server/scheduling/requests.ts -> server/scheduling/coordination.ts -> server/scheduling/coordination-pump.ts`
- 3-file cycle: `server/scheduling/coordination-tick.ts -> server/scheduling/requests.ts -> server/scheduling/coordination.ts -> server/scheduling/coordination-tick.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/implementation/activation-recovery.ts -> server/delivery/recovery/validation/validation-provider-context.ts -> server/delivery/pipeline/github-delivery.ts`

## Communities (78 total, 2 thin omitted)

### Community 0 - "OfficeScene.tsx"
Cohesion: 0.05
Nodes (61): itAgent(), itDiagnostics(), displayAgentTask(), githubStageLabels, withoutElapsed(), LiveAgentTask(), Props, RunningTask() (+53 more)

### Community 1 - "source-amendment.ts"
Cohesion: 0.07
Nodes (66): adoptCandidate(), reported, Scope, approvedText(), assert(), amendmentInstruction(), amendmentIssueSha256(), authorizeSourceAmendment() (+58 more)

### Community 2 - "Store"
Cohesion: 0.06
Nodes (19): correlatedBuild(), JiraOperations, plain(), GitHubMonitor, Assessment, drainMaintenance(), reconcileMaintenance(), requestMaintenance() (+11 more)

### Community 3 - "index.tsx"
Cohesion: 0.08
Nodes (55): SendMessage, currentServices(), ServiceHealthPanel(), labels, ServiceHealthRow(), GoalList(), blank(), goalInput (+47 more)

### Community 4 - "cec/workflow.ts"
Cohesion: 0.09
Nodes (52): checkMail(), drainMail(), requestMail(), dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), resume() (+44 more)

### Community 5 - ".save"
Cohesion: 0.08
Nodes (40): file, folder, logs, root, xml(), unpack(), BLOCKED, Execute (+32 more)

### Community 6 - "artifact"
Cohesion: 0.12
Nodes (48): continuationWorkerProof(), savedAdmissionUnresolved(), assertPostConflictFiles(), completedConflictDraftUnresolved(), postConflictPreparationEvidence(), within(), bindPreparationBoardOrigins(), nativeCompletion() (+40 more)

### Community 7 - "accept-stage-result.ts"
Cohesion: 0.11
Nodes (48): containedFile(), findingsBlock(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery(), park(), acceptStageResult() (+40 more)

### Community 8 - "Inspector.tsx"
Cohesion: 0.06
Nodes (49): CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants, ElevatorPhase, floorVariants, leftDoor, OfficeScene (+41 more)

### Community 9 - "agents.ts"
Cohesion: 0.09
Nodes (35): cecPrompt(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), resolvedDecisionNote(), stageInstructions, cecChatPrompt() (+27 more)

### Community 10 - "dependency-bots/adopt.ts"
Cohesion: 0.13
Nodes (40): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard, projectCards() (+32 more)

### Community 11 - "closeout-recovery.ts"
Cohesion: 0.11
Nodes (44): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+36 more)

### Community 12 - "GitHubDelivery"
Cohesion: 0.12
Nodes (16): GitHubDelivery, lintPRContent(), retireInactiveDeliveries(), retireUnstartedDelivery(), unstartedDelivery(), ciCheckout(), verifyCIHooks(), CIFailure (+8 more)

### Community 13 - "shared.ts"
Cohesion: 0.07
Nodes (37): ProjectReadiness, ConfirmedSegment, LiveAnchor, ObservationGap, SnapshotOrdering, TimeLedgerState, AssignmentResult, CompletionCondition (+29 more)

### Community 14 - "activation-recovery.ts"
Cohesion: 0.14
Nodes (33): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+25 more)

### Community 15 - "requests.ts"
Cohesion: 0.16
Nodes (31): savedActivationFailure(), continuationScope(), brainImplementationCandidate(), BrainReadback, digest(), implementationRecoveryCandidate(), Ownership, Readback (+23 more)

### Community 16 - "index.ts"
Cohesion: 0.11
Nodes (28): close(), config, itSpecialist, loadedRevision, offices, releaseLock, server, serviceHealth (+20 more)

### Community 17 - "conversations/conversations.ts"
Cohesion: 0.13
Nodes (20): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+12 more)

### Community 18 - "publish-pr.ts"
Cohesion: 0.15
Nodes (26): harnessCloseout(), PASSING, verifyMergeActions(), activeEffectId(), harnessEffect, assertMayMutate(), retryRead(), runHarnessStage() (+18 more)

### Community 19 - "store.ts"
Cohesion: 0.11
Nodes (16): featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), recoverFeatures(), goalNoticeNeverDispatched(), Clock, recover(), initialSnapshot() (+8 more)

### Community 20 - "SettingsPanel.tsx"
Cohesion: 0.16
Nodes (24): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView() (+16 more)

### Community 21 - "worker-runtime.ts"
Cohesion: 0.11
Nodes (18): SlackResultSchema, SlackVerificationSchema, diagnosticContext(), diagnosticSnapshot(), nativeDeliveryResolved(), contextPacket(), labels, toolActivity() (+10 more)

### Community 22 - "digest"
Cohesion: 0.17
Nodes (29): candidateInput(), children, oldAdoptionBasis(), savedCandidateAdmission, Assessment, outsideScanSources(), Ownership, reconcileScopeRepairReadback() (+21 more)

### Community 23 - "github-context.ts"
Cohesion: 0.15
Nodes (18): ApproachSchema, GITHUB_ISSUE_SKILL, maintenancePolicies(), Result, BrainMaintenance, BrainResult, easternDate(), GitHubMaintenance (+10 more)

### Community 24 - ".emit"
Cohesion: 0.14
Nodes (21): configureNotices(), NoticeSettings, retryRecipientLookup(), Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput (+13 more)

### Community 25 - "work-summary.ts"
Cohesion: 0.16
Nodes (23): Outbox(), themeColor, App(), TicketDetail(), deliveryRepairProjection(), card, InboxQueue(), PMQueueItem (+15 more)

### Community 26 - "azure.ts"
Cohesion: 0.14
Nodes (21): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+13 more)

### Community 27 - "OfficeSnapshot"
Cohesion: 0.14
Nodes (19): conversationResolved(), projectOutbox(), checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), checkpointSuperseded(), maintenanceSuperseded(), REOBSERVED (+11 more)

### Community 28 - "github-delivery.ts"
Cohesion: 0.13
Nodes (19): BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction(), dependabotReviewGuidance(), discover(), refreshDependencies(), routeExisting() (+11 more)

### Community 29 - "ControlStore"
Cohesion: 0.16
Nodes (8): DailyCTO, queueGoalEvidenceRequest(), DailyResultSchema, GoalEvidenceRequestSchema, Briefing, saveReviewBriefing(), ControlStore, DailyCTOReport

### Community 30 - "Coordinator"
Cohesion: 0.08
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 31 - "config.ts"
Cohesion: 0.14
Nodes (18): goalEvidencePath(), systemClock, DATA, LOCAL_BINDINGS, ROOT, file, project, root (+10 more)

### Community 32 - "approval.ts"
Cohesion: 0.24
Nodes (15): approveFeature(), assertRetainedItems(), commandFeature(), createFeature(), featureById(), mutation(), artifactPath(), digest() (+7 more)

### Community 33 - "notifications.ts"
Cohesion: 0.16
Nodes (11): Identity, MergeNotifications, SlackMessages, SlackRequestSchema, goalNoticeAuthorized(), sendGoalNotice(), EffectOperation, Effects (+3 more)

### Community 34 - "features/workflow.ts"
Cohesion: 0.20
Nodes (18): discoveryPrompt(), planPrompt(), document(), featureRoot(), DiscoverySchema, identity, manifestFromPlan(), ManifestSchema (+10 more)

### Community 35 - "coordination.ts"
Cohesion: 0.16
Nodes (19): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), legacy, validateNativeContinuation(), checkpointWindow() (+11 more)

### Community 36 - "dependencies.ts"
Cohesion: 0.23
Nodes (16): Admission, admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, compatible(), dependencyCompletionKey(), dependencyEligibility() (+8 more)

### Community 37 - "github-check-selection.ts"
Cohesion: 0.23
Nodes (16): checksFailed(), checksPassed(), checksPending(), CurrentChecksWait, currentMergeChecks(), pass(), pending(), requireThat() (+8 more)

### Community 38 - "goal-reviews.ts"
Cohesion: 0.13
Nodes (16): applyGoalReview(), EvidenceRefSchema, statusAllowed(), workEvidence(), GoalInput, saveGoal(), queueGoalNotice(), DailyCTOBriefing (+8 more)

### Community 39 - "FeatureWorkspace.tsx"
Cohesion: 0.18
Nodes (15): FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures(), draftKey(), readDraft() (+7 more)

### Community 40 - "TicketJob"
Cohesion: 0.16
Nodes (11): parksInJira(), DECISION_KINDS, needsDecision(), StageContext, stagePrompt(), StagePromptInput, conflictApprovalGuidance(), reconcileNativeDelivery() (+3 more)

### Community 41 - "remove-candidate.ts"
Cohesion: 0.20
Nodes (15): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+7 more)

### Community 42 - "goal-reporting.ts"
Cohesion: 0.20
Nodes (18): githubPRDescription(), collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB (+10 more)

### Community 43 - "jira-publication.ts"
Cohesion: 0.19
Nodes (10): Content, jiraText(), plainDescription(), FeaturePublisher, publishFeature(), reserveIdentity(), EffectUncertainError, FeatureManifest (+2 more)

### Community 44 - "jira-time.ts"
Cohesion: 0.24
Nodes (12): easternDay(), easternInstant(), data(), JiraWorklogs, localId(), locks, matches(), publishJiraTime() (+4 more)

### Community 45 - "service-health.ts"
Cohesion: 0.18
Nodes (10): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, slackHealth() (+2 more)

### Community 46 - "features.ts"
Cohesion: 0.16
Nodes (15): currentApproval(), featureGate(), predecessorComplete(), scheduledFeatures(), gateFeatureWork(), FeatureApproval, FeatureAttempt, FeatureBaseline (+7 more)

### Community 47 - "github-publication.ts"
Cohesion: 0.31
Nodes (7): Assign, Board, Content, GitHubFeaturePublisher, number(), same(), PublicationReceipt

### Community 48 - "JiraFeaturePublisher"
Cohesion: 0.33
Nodes (4): Assignment, JiraFeaturePublisher, keyOf(), Transition

### Community 49 - "TimeBook.tsx"
Cohesion: 0.21
Nodes (15): AzureBuild, lastWall, sample(), subscribe(), subscribers, useLiveClock(), liveBuildTiming(), liveTiming() (+7 more)

### Community 50 - ".transaction"
Cohesion: 0.24
Nodes (10): reviewQuestions(), EvidenceSchema, helperInstallation(), readReview(), ReviewEvidence, observeHelperGroups(), stopHelperGroups(), FeatureReviewRunner (+2 more)

### Community 51 - "scheduler.ts"
Cohesion: 0.21
Nodes (8): fifo(), ScheduledWork, Scheduler, selectWork(), withAssignment(), ExecutionLane, ProgressionItem, QueueTiming

### Community 52 - "time-classification.ts"
Cohesion: 0.23
Nodes (12): timeLedger(), artifact(), correctRecoveryClassification(), digest(), timeClassificationDigest(), TimeClassificationInput, TimeLedger, dueReadback() (+4 more)

### Community 53 - "it-specialist.ts"
Cohesion: 0.30
Nodes (10): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), ITContext, readBackConversations(), publishITReport(), delays, recoverAttempt() (+2 more)

### Community 54 - "brain-audit-reuse.ts"
Cohesion: 0.20
Nodes (13): bindBrainAuditEffects(), Effect, Known, assertPriorBrainAudit(), brainAuditRetryFingerprint(), Context, jsonAfter(), nativeSessionPath() (+5 more)

### Community 55 - "preferences-store.ts"
Cohesion: 0.19
Nodes (10): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS (+2 more)

### Community 56 - "continuation-evidence.ts"
Cohesion: 0.34
Nodes (12): allowed, assertContinuationWorker(), continuationNativeReview(), continuationReviewArtifacts(), negativeWorker(), reconcileContinuationReview(), savedNegativeContinuationReview(), ContinuationDecision (+4 more)

### Community 57 - "daily-cto.ts"
Cohesion: 0.22
Nodes (10): EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), dailyReviewDate(), reviewWeekday(), FreshDailyResultSchema, addDays(), EASTERN (+2 more)

### Community 58 - "coordination-tick.ts"
Cohesion: 0.28
Nodes (10): reconcileNoticeConfirmations(), reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION, tick(), incompleteReadOutput(), IntakeResult (+2 more)

### Community 59 - "saved-prerequisite-handoff.ts"
Cohesion: 0.33
Nodes (12): PrerequisitesSchema, dependencyVersion(), handoffSavedPrerequisites(), hasSavedPrerequisiteResult(), Ownership, qualified(), readDependencies(), requireSavedPrerequisites() (+4 more)

### Community 60 - "session-bridge.ts"
Cohesion: 0.23
Nodes (9): claudeSessions(), codexSessions(), desktopSessions(), guardianReview(), LiveSession, loadedCodexSession(), openRollouts(), SessionBridge (+1 more)

### Community 61 - "scheduled-work.ts"
Cohesion: 0.27
Nodes (9): closeoutRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), deterministicActions, eligible(), OfficeEntry, requestResolved(), scheduledWork() (+1 more)

### Community 62 - "closeout-supervision-proof.ts"
Cohesion: 0.26
Nodes (11): CloseoutSupervisionProofRef, Envelope, hash, head, identity, instant(), known, pid (+3 more)

### Community 63 - "checkpoint-completion.ts"
Cohesion: 0.24
Nodes (7): BrainStatusSchema, identity, brainCheckpointCompletion(), coverageSchema, followupSchema, verified, reconcileCompletedCheckpoints()

### Community 64 - "DailyCTO.tsx"
Cohesion: 0.26
Nodes (8): CTOReview(), goalState, DailyCTO(), GoalHistory(), reportDate(), reviewStatus, reviewExcerpt(), ReviewText()

### Community 65 - "useOfficePreferences.ts"
Cohesion: 0.26
Nodes (10): acceptPreferences(), PreferenceCandidate, strip(), UNKNOWN_PREFERENCES, OfficePreferencesController, PreferenceFeedback, PreferenceField, requestPreferences() (+2 more)

### Community 66 - "assignment-poll.ts"
Cohesion: 0.40
Nodes (7): noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), syncOutbox(), resumeParked(), poll(), readAssignments()

### Community 68 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 69 - "delivery-task.ts"
Cohesion: 0.31
Nodes (7): APPROACH_GUIDANCE, deliveryTask(), DeliveryTaskInput, DISCOVERY_GUIDANCE, AMENDMENT_REVIEW_PROOF, featureDeliveryContext(), deliveryResearchContext()

### Community 70 - "cli.ts"
Cohesion: 0.25
Nodes (6): args, [cmd,...rawArgs], commands, key, projectIndex, PORT

### Community 71 - "preparation-board-provenance.ts"
Cohesion: 0.25
Nodes (7): claimSchema, eventSchema, PreparationBoardOrigin, readPreparationBoardOrigins(), timestamp, updateSchema, PreparationReceiptBinding

### Community 72 - "retire-external-delivery.ts"
Cohesion: 0.57
Nodes (5): completedPRReviews(), eligible(), mergedByOwner(), ownerSettles(), retireExternalDeliveries()

### Community 73 - "deliveryInputSha256"
Cohesion: 0.57
Nodes (6): advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat(), deliveryInputSha256()

### Community 74 - "liveReach"
Cohesion: 0.60
Nodes (5): GIT_NETWORK, LIVE_PROVIDERS, liveReach(), networkUrl(), remoteUrls()

### Community 75 - "dependency-edges.ts"
Cohesion: 1.00
Nodes (3): assertFeatureDependencyOrder(), featureDependencyEdges(), key()

## Knowledge Gaps
- **251 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+246 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `source-amendment.ts`, `cec/workflow.ts`, `.save`, `artifact`, `accept-stage-result.ts`, `agents.ts`, `dependency-bots/adopt.ts`, `closeout-recovery.ts`, `GitHubDelivery`, `activation-recovery.ts`, `requests.ts`, `conversations/conversations.ts`, `publish-pr.ts`, `store.ts`, `worker-runtime.ts`, `digest`, `github-context.ts`, `.emit`, `azure.ts`, `OfficeSnapshot`, `github-delivery.ts`, `config.ts`, `approval.ts`, `notifications.ts`, `features/workflow.ts`, `coordination.ts`, `dependencies.ts`, `goal-reviews.ts`, `TicketJob`, `remove-candidate.ts`, `goal-reporting.ts`, `jira-publication.ts`, `jira-time.ts`, `features.ts`, `github-publication.ts`, `.transaction`, `scheduler.ts`, `time-classification.ts`, `it-specialist.ts`, `brain-audit-reuse.ts`, `continuation-evidence.ts`, `coordination-tick.ts`, `saved-prerequisite-handoff.ts`, `session-bridge.ts`, `scheduled-work.ts`, `closeout-supervision-proof.ts`, `checkpoint-completion.ts`, `Offices`, `delivery-task.ts`, `preparation-board-provenance.ts`, `retire-external-delivery.ts`, `deliveryInputSha256`, `dependency-edges.ts`?**
  _High betweenness centrality (0.118) - this node is a cross-community bridge._
- **Why does `JiraFeaturePublisher` connect `JiraFeaturePublisher` to `Store`, `jira-publication.ts`, `cec/workflow.ts`, `features/workflow.ts`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `command()` connect `Store` to `cec/workflow.ts`, `.save`, `accept-stage-result.ts`, `agents.ts`, `dependency-bots/adopt.ts`, `closeout-recovery.ts`, `GitHubDelivery`, `requests.ts`, `publish-pr.ts`, `worker-runtime.ts`, `github-context.ts`, `azure.ts`, `github-delivery.ts`, `approval.ts`, `notifications.ts`, `features/workflow.ts`, `coordination.ts`, `dependencies.ts`, `remove-candidate.ts`, `jira-publication.ts`, `jira-time.ts`, `service-health.ts`, `github-publication.ts`, `.transaction`, `time-classification.ts`, `session-bridge.ts`, `command-registry.ts`, `liveReach`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _251 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `OfficeScene.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05368382080710848 - nodes in this community are weakly interconnected._
- **Should `source-amendment.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06964006259780908 - nodes in this community are weakly interconnected._
- **Should `Store` be split into smaller, more focused modules?**
  _Cohesion score 0.05755693581780538 - nodes in this community are weakly interconnected._