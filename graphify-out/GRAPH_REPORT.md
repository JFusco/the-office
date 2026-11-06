# Graph Report - people-directory  (2026-11-06)

## Corpus Check
- 390 files · ~195,129 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2338 nodes · 9970 edges · 73 communities (72 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 49 edges (avg confidence: 0.73)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c1a9a357`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- dependency-bots/adopt.ts
- weekly-rollup.ts
- artifact
- publish-pr.ts
- source-amendment.ts
- Inspector.tsx
- GitHubDelivery
- github-delivery.ts
- .save
- OfficeScene.tsx
- workKey
- index.tsx
- maintenance.ts
- App.tsx
- config.ts
- requests.ts
- PeoplePanel.tsx
- agents.ts
- Goals.tsx
- store.ts
- conversations/conversations.ts
- activation-recovery.ts
- approval.ts
- assignment-poll.ts
- features.ts
- it-specialist.ts
- azure.ts
- Store
- conversations/slack.ts
- shared.ts
- worker-runtime.ts
- scope-repair-resume.ts
- command
- Coordinator
- retrospective-triggers.ts
- outbox.ts
- run-retrospective.ts
- Engine
- scheduled-work.ts
- engine.ts
- dependencies.ts
- TimeBook.tsx
- offices.ts
- .emit
- coordination.ts
- cec/workflow.ts
- delivery-repairs.ts
- Feature
- retrospective-subject.ts
- goal-reviews.ts
- http/commands.ts
- recovery-ledger.ts
- knowledge.ts
- office-lessons.ts
- preferences-store.ts
- retrospective-facts.ts
- StageResult
- enrollment-gate.ts
- closeout-supervision-proof.ts
- knowledge-context.ts
- useOfficePreferences.ts
- ticket-stage-runner.ts
- approach.ts
- maintenance-triggers.ts
- command-registry.ts
- github.ts
- session-bridge.ts
- continuation-review-readback.ts
- cli.ts
- create-candidate.ts
- time-classification.ts
- helper-evidence.py

## God Nodes (most connected - your core abstractions)
1. `Store` - 216 edges
2. `GitHubDelivery` - 110 edges
3. `TicketJob` - 110 edges
4. `artifact()` - 85 edges
5. `command()` - 85 edges
6. `digest()` - 82 edges
7. `cx()` - 69 edges
8. `workKey()` - 68 edges
9. `StageResult` - 62 edges
10. `OfficeSnapshot` - 61 edges

## Surprising Connections (you probably didn't know these)
- `projectOutbox()` --calls--> `deferredPickup()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/pickup-state.ts
- `projectOutbox()` --calls--> `parkedProviderWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts
- `projectOutbox()` --calls--> `readinessWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts
- `pump()` --calls--> `deferredPickup()`  [EXTRACTED]
  server/conversations/team-conversation-pump.ts → src/work/pickup-state.ts
- `needsReconciliation()` --calls--> `workKey()`  [EXTRACTED]
  server/delivery/parking/retire-backlogged.ts → src/contracts/work.ts

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

## Communities (73 total, 1 thin omitted)

### Community 0 - "dependency-bots/adopt.ts"
Cohesion: 0.07
Nodes (56): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard, projectCards() (+48 more)

### Community 1 - "weekly-rollup.ts"
Cohesion: 0.05
Nodes (57): RollupResult, RollupResultSchema, harperFolder(), retryDelay(), ineffectiveLessons(), lastFriday(), ROLLUP_HISTORY, rollupDue() (+49 more)

### Community 2 - "artifact"
Cohesion: 0.10
Nodes (70): assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint(), closeoutProviderEvidence() (+62 more)

### Community 3 - "publish-pr.ts"
Cohesion: 0.07
Nodes (56): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+48 more)

### Community 4 - "source-amendment.ts"
Cohesion: 0.06
Nodes (72): deliveryTask(), DeliveryTaskInput, DISCOVERY_GUIDANCE, adoptCandidate(), reported, Scope, approvedText(), assert() (+64 more)

### Community 5 - "Inspector.tsx"
Cohesion: 0.08
Nodes (63): Conversation(), Outbox(), ServiceHealthPanel(), labels, ServiceHealthRow(), EvidenceCard(), Inspector(), PORTRAIT (+55 more)

### Community 6 - "GitHubDelivery"
Cohesion: 0.06
Nodes (40): dependabotReviewGuidance(), GitHubDelivery, checksFailed(), checksPassed(), checksPending(), CurrentChecksWait, currentMergeChecks(), pass() (+32 more)

### Community 7 - "github-delivery.ts"
Cohesion: 0.09
Nodes (57): containedFile(), findingsBlock(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery(), BOARD_RULE, conflictRefreshInstruction() (+49 more)

### Community 8 - ".save"
Cohesion: 0.08
Nodes (40): file, folder, logs, root, xml(), BLOCKED, Execute, findComment() (+32 more)

### Community 9 - "OfficeScene.tsx"
Cohesion: 0.06
Nodes (56): displayAgentTask(), githubStageLabels, withoutElapsed(), LiveAgentTask(), Props, RunningTask(), text(), Avatar() (+48 more)

### Community 10 - "workKey"
Cohesion: 0.11
Nodes (49): PrerequisitesSchema, assertContinuationWorker(), continuationScope(), continuationWorktree(), continuationGuard(), discoveryRecoveryCandidate(), brainImplementationCandidate(), BrainReadback (+41 more)

### Community 11 - "index.tsx"
Cohesion: 0.10
Nodes (40): LessonsPanel(), when(), SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), loadOfficeConfig(), OfficeConfigSection() (+32 more)

### Community 12 - "maintenance.ts"
Cohesion: 0.07
Nodes (35): Assessment, diagnosticProof(), ownedArtifact(), Ownership, rawHash(), recoverDiscovery(), scopeNote(), maintenancePolicies() (+27 more)

### Community 13 - "App.tsx"
Cohesion: 0.05
Nodes (45): themeColor, App(), CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants, ElevatorPhase, floorVariants (+37 more)

### Community 14 - "config.ts"
Cohesion: 0.09
Nodes (38): close(), config, itSpecialist, loadedRevision, offices, releaseLock, server, serviceHealth (+30 more)

### Community 15 - "requests.ts"
Cohesion: 0.11
Nodes (41): assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), reconcileCompletedConflictDraft(), routeReadyPostConflictPublication(), verifyInitialDraftConflictPreparation() (+33 more)

### Community 16 - "PeoplePanel.tsx"
Cohesion: 0.10
Nodes (40): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+32 more)

### Community 17 - "agents.ts"
Cohesion: 0.09
Nodes (33): cecPrompt(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), resolvedDecisionNote(), stageInstructions, cecChatPrompt() (+25 more)

### Community 18 - "Goals.tsx"
Cohesion: 0.08
Nodes (32): FeatureRound, SendMessage, FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures() (+24 more)

### Community 19 - "store.ts"
Cohesion: 0.10
Nodes (23): featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), recoverFeatures(), goalNoticeNeverDispatched(), Clock, systemClock, applyConnectionSettings() (+15 more)

### Community 20 - "conversations/conversations.ts"
Cohesion: 0.12
Nodes (24): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+16 more)

### Community 21 - "activation-recovery.ts"
Cohesion: 0.14
Nodes (31): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+23 more)

### Community 22 - "approval.ts"
Cohesion: 0.16
Nodes (23): approveFeature(), assertRetainedItems(), commandFeature(), createFeature(), featureById(), mutation(), reviewQuestions(), assertFeatureDependencyOrder() (+15 more)

### Community 23 - "assignment-poll.ts"
Cohesion: 0.13
Nodes (20): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), configureNotices(), Identity, MergeNotifications (+12 more)

### Community 24 - "features.ts"
Cohesion: 0.14
Nodes (23): discoveryPrompt(), planPrompt(), document(), featureRoot(), DiscoverySchema, PlanSchema, compareBaseline(), prepareBaseline() (+15 more)

### Community 25 - "it-specialist.ts"
Cohesion: 0.14
Nodes (16): ITContext, publishITReport(), delays, recoverAttempt(), listenerHealth(), providers, ProviderStatusChecks, summary (+8 more)

### Community 26 - "azure.ts"
Cohesion: 0.13
Nodes (22): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+14 more)

### Community 27 - "Store"
Cohesion: 0.12
Nodes (13): importReview(), OfficeEntry, fifo(), ScheduledWork, Scheduler, selectWork(), Store, withAssignment() (+5 more)

### Community 28 - "conversations/slack.ts"
Cohesion: 0.14
Nodes (12): slackVerifyPrompt(), comparableSlackText(), SlackMessages, SlackRequestSchema, SlackResultSchema, SlackVerificationSchema, goalNoticeAuthorized(), sendGoalNotice() (+4 more)

### Community 29 - "shared.ts"
Cohesion: 0.10
Nodes (25): Effect, Known, ProjectReadiness, ConfirmedSegment, LiveAnchor, ObservationGap, SnapshotOrdering, TimeLedgerState (+17 more)

### Community 30 - "worker-runtime.ts"
Cohesion: 0.14
Nodes (15): officeCapacity, labels, toolActivity(), workerActivity(), claudeArguments(), ClaudeStream, DEVELOPER_EFFORT, DEVELOPER_MODEL (+7 more)

### Community 31 - "scope-repair-resume.ts"
Cohesion: 0.15
Nodes (25): Assessment, outsideScanSources(), Ownership, requireThat(), sha, assertScopeRepairResumeFindings(), certain(), directionContract() (+17 more)

### Community 32 - "command"
Cohesion: 0.14
Nodes (17): Result, Assessment, timeLedger(), syncing, TimeLedger, dueReadback(), Readback, READBACK_INTERVAL_MS (+9 more)

### Community 33 - "Coordinator"
Cohesion: 0.09
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 34 - "retrospective-triggers.ts"
Cohesion: 0.17
Nodes (22): clip(), JobLike, recordCIBudget(), recordRepairBudget(), recordTechnicalBudget(), recordTicketParked(), recordTrigger(), subjectOf() (+14 more)

### Community 35 - "outbox.ts"
Cohesion: 0.18
Nodes (16): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), projectOutbox(), readBackConversations(), knowledgeOutbox(), checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup() (+8 more)

### Community 36 - "run-retrospective.ts"
Cohesion: 0.15
Nodes (20): busyMaintenanceIds(), retrospectivePrompt(), SUBJECT, Kind, RetrospectiveResult, RetrospectiveResultSchema, Stage, terminalCandidates() (+12 more)

### Community 37 - "Engine"
Cohesion: 0.10
Nodes (5): correlatedBuild(), Engine, observe(), observeParked(), parkedReadError

### Community 38 - "scheduled-work.ts"
Cohesion: 0.13
Nodes (21): conversationResolved(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), deterministicActions, eligible() (+13 more)

### Community 39 - "engine.ts"
Cohesion: 0.20
Nodes (18): checkMail(), drainMail(), requestMail(), dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), resume() (+10 more)

### Community 40 - "dependencies.ts"
Cohesion: 0.22
Nodes (18): Admission, admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, compatible(), dependencyCompletionKey(), dependencyEligibility() (+10 more)

### Community 41 - "TimeBook.tsx"
Cohesion: 0.17
Nodes (18): AzureBuild, lastWall, sample(), subscribe(), subscribers, useLiveClock(), liveBuildTiming(), liveTiming() (+10 more)

### Community 42 - "offices.ts"
Cohesion: 0.17
Nodes (7): mirrorOfficeKnowledge(), file, project, root, projectById(), projectData(), Offices

### Community 43 - ".emit"
Cohesion: 0.16
Nodes (9): reconcileNoticeConfirmations(), BrainFollowup, legacy, reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION, tick() (+1 more)

### Community 44 - "coordination.ts"
Cohesion: 0.19
Nodes (17): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation(), checkpointWindow(), dueAt() (+9 more)

### Community 45 - "cec/workflow.ts"
Cohesion: 0.19
Nodes (13): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), publicationEvidenceGap(), qaEvidenceGap(), resultGate(), stageResultGap(), unresolvedVerification() (+5 more)

### Community 46 - "delivery-repairs.ts"
Cohesion: 0.27
Nodes (15): run(), namedRepairIds(), amendmentRepairView(), approachFingerprint(), enqueueRepairDiagnosis(), githubRepairEligible(), jiraRepairable(), REPAIR_DIAGNOSIS (+7 more)

### Community 47 - "Feature"
Cohesion: 0.20
Nodes (8): EvidenceSchema, helperInstallation(), readReview(), ReviewEvidence, observeHelperGroups(), stopHelperGroups(), FeatureReviewRunner, Feature

### Community 48 - "retrospective-subject.ts"
Cohesion: 0.20
Nodes (14): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+6 more)

### Community 49 - "goal-reviews.ts"
Cohesion: 0.14
Nodes (14): applyGoalReview(), EvidenceRefSchema, FreshDailyResultSchema, statusAllowed(), workEvidence(), GoalInput, DailyCTOBriefing, DailyCTOResult (+6 more)

### Community 50 - "http/commands.ts"
Cohesion: 0.28
Nodes (13): bindDiscoveryResume(), DiscoveryResumeInput, configureKnowledge(), declineLessonIssue(), reactivateLesson(), retireLesson(), configureGoalNotices(), Settings (+5 more)

### Community 51 - "recovery-ledger.ts"
Cohesion: 0.23
Nodes (11): savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), diagnosticContext(), diagnosticSnapshot(), nativeDeliveryResolved(), reconcileRecoveryLedger() (+3 more)

### Community 52 - "knowledge.ts"
Cohesion: 0.19
Nodes (14): SEEDS, KnowledgeRetry, KnowledgeState, Lesson, LessonRecurrence, OfficeProposal, RepositoryInstruction, RetrospectiveEvent (+6 more)

### Community 53 - "office-lessons.ts"
Cohesion: 0.23
Nodes (10): Accepted, acceptRetrospective(), normalizeStatement(), RETROSPECTIVE_HISTORY, decideOfficeProposal(), now(), OfficeKnowledgeStore, proposeOfficeLessons() (+2 more)

### Community 54 - "preferences-store.ts"
Cohesion: 0.19
Nodes (10): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS (+2 more)

### Community 55 - "retrospective-facts.ts"
Cohesion: 0.22
Nodes (12): ARTIFACT_LIMIT, clip(), LEDGER_STEPS, MAINTENANCE_LIMIT, maintenanceFacts(), MaintenancePacketSection, clip(), PACKET_LIMIT (+4 more)

### Community 56 - "StageResult"
Cohesion: 0.24
Nodes (8): JiraOperations, plain(), unpack(), parksInJira(), DECISION_KINDS, needsDecision(), StageContext, StageResult

### Community 57 - "enrollment-gate.ts"
Cohesion: 0.36
Nodes (9): assertEnrollable(), bindFeature(), currentApproval(), enrolled(), featureGate(), predecessorComplete(), publishFeature(), reserveIdentity() (+1 more)

### Community 58 - "closeout-supervision-proof.ts"
Cohesion: 0.26
Nodes (11): CloseoutSupervisionProofRef, Envelope, hash, head, identity, instant(), known, pid (+3 more)

### Community 59 - "knowledge-context.ts"
Cohesion: 0.21
Nodes (11): Bucket, knowledgeContext(), LESSON_LIMIT, lessonPurpose(), MAINTENANCE, MAX_LESSONS, PURPOSES, render() (+3 more)

### Community 60 - "useOfficePreferences.ts"
Cohesion: 0.26
Nodes (10): acceptPreferences(), PreferenceCandidate, strip(), UNKNOWN_PREFERENCES, OfficePreferencesController, PreferenceFeedback, PreferenceField, requestPreferences() (+2 more)

### Community 61 - "ticket-stage-runner.ts"
Cohesion: 0.49
Nodes (6): verifyFeatureEnhance(), approvedDelivery(), bindDelivery(), featureDeliveryContext(), featureEffectGate(), acceptFeatureReview()

### Community 62 - "approach.ts"
Cohesion: 0.49
Nodes (9): afterDraft(), ApproachSchema, firstBuildStage(), missingApproachStage(), plannedNext(), recordApproach(), reroute(), stageNeeded() (+1 more)

### Community 63 - "maintenance-triggers.ts"
Cohesion: 0.36
Nodes (9): clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates(), maintenanceCompletedId(), maintenanceKey(), visibleMaintenanceTriggerIds(), TerminalCandidate (+1 more)

### Community 64 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 65 - "github.ts"
Cohesion: 0.31
Nodes (4): GitHubMonitor, GitHubBoard, GitHubPR, GitHubState

### Community 66 - "session-bridge.ts"
Cohesion: 0.33
Nodes (8): claudeSessions(), codexSessions(), desktopSessions(), guardianReview(), LiveSession, loadedCodexSession(), openRollouts(), SessionInventory

### Community 67 - "continuation-review-readback.ts"
Cohesion: 0.54
Nodes (6): continuationReviewArtifacts(), reconcileContinuationReview(), savedNegativeContinuationReview(), ContinuationDecision, implementationContinuationDecision(), negativeTechnicalReview()

### Community 68 - "cli.ts"
Cohesion: 0.29
Nodes (5): args, [cmd,...rawArgs], commands, key, projectIndex

### Community 69 - "create-candidate.ts"
Cohesion: 0.48
Nodes (6): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf()

### Community 70 - "time-classification.ts"
Cohesion: 0.73
Nodes (5): artifact(), correctRecoveryClassification(), digest(), timeClassificationDigest(), TimeClassificationInput

## Knowledge Gaps
- **280 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+275 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `dependency-bots/adopt.ts`, `weekly-rollup.ts`, `artifact`, `publish-pr.ts`, `source-amendment.ts`, `Inspector.tsx`, `GitHubDelivery`, `github-delivery.ts`, `.save`, `workKey`, `maintenance.ts`, `requests.ts`, `agents.ts`, `store.ts`, `conversations/conversations.ts`, `activation-recovery.ts`, `approval.ts`, `assignment-poll.ts`, `features.ts`, `it-specialist.ts`, `azure.ts`, `conversations/slack.ts`, `worker-runtime.ts`, `scope-repair-resume.ts`, `command`, `Coordinator`, `retrospective-triggers.ts`, `outbox.ts`, `run-retrospective.ts`, `Engine`, `scheduled-work.ts`, `engine.ts`, `dependencies.ts`, `offices.ts`, `.emit`, `coordination.ts`, `cec/workflow.ts`, `delivery-repairs.ts`, `Feature`, `retrospective-subject.ts`, `goal-reviews.ts`, `http/commands.ts`, `recovery-ledger.ts`, `office-lessons.ts`, `retrospective-facts.ts`, `StageResult`, `enrollment-gate.ts`, `closeout-supervision-proof.ts`, `knowledge-context.ts`, `ticket-stage-runner.ts`, `github.ts`, `session-bridge.ts`, `continuation-review-readback.ts`, `create-candidate.ts`, `time-classification.ts`?**
  _High betweenness centrality (0.111) - this node is a cross-community bridge._
- **Why does `Coordinator` connect `Coordinator` to `scheduled-work.ts`, `dependencies.ts`, `offices.ts`, `.emit`, `coordination.ts`, `requests.ts`, `agents.ts`, `assignment-poll.ts`, `Store`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `TicketJob` connect `GitHubDelivery` to `dependency-bots/adopt.ts`, `weekly-rollup.ts`, `artifact`, `publish-pr.ts`, `source-amendment.ts`, `Inspector.tsx`, `github-delivery.ts`, `.save`, `workKey`, `maintenance.ts`, `requests.ts`, `activation-recovery.ts`, `assignment-poll.ts`, `it-specialist.ts`, `Store`, `shared.ts`, `scope-repair-resume.ts`, `retrospective-triggers.ts`, `cec/workflow.ts`, `delivery-repairs.ts`, `retrospective-subject.ts`, `StageResult`, `closeout-supervision-proof.ts`, `ticket-stage-runner.ts`, `approach.ts`, `continuation-review-readback.ts`, `create-candidate.ts`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `command()` (e.g. with `.constructor()` and `executeRequest()`) actually correct?**
  _`command()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _280 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dependency-bots/adopt.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06505050505050505 - nodes in this community are weakly interconnected._
- **Should `weekly-rollup.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05299145299145299 - nodes in this community are weakly interconnected._