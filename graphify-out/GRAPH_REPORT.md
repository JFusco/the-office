# Graph Report - the-office  (2026-11-06)

## Corpus Check
- 363 files · ~184,065 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2171 nodes · 9307 edges · 83 communities (78 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 44 edges (avg confidence: 0.74)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `edb31bcb`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- OfficeScene.tsx
- source-amendment.ts
- command
- Inspector.tsx
- cec/workflow.ts
- .save
- StageResult
- Engine
- App.tsx
- agents.ts
- assignment-poll.ts
- digest
- GitHubDelivery
- shared.ts
- activation-recovery.ts
- workKey
- index.ts
- conversations/conversations.ts
- run-retrospective.ts
- Store
- SettingsPanel.tsx
- engine.ts
- artifact
- remove-candidate.ts
- .emit
- work-summary.ts
- azure.ts
- outbox.ts
- github-delivery.ts
- ControlStore
- Coordinator
- offices.ts
- approval.ts
- notifications.ts
- features.ts
- coordination.ts
- dependencies.ts
- github-check-selection.ts
- daily-cto.ts
- OfficeSnapshot
- closeout.ts
- github.ts
- fact-bounds.ts
- publication.ts
- JiraWorklogs
- service-health.ts
- Role
- delivery-repairs.ts
- jira-publication.ts
- TimeBook.tsx
- .transaction
- publish-pr.ts
- time-readback.ts
- it-specialist.ts
- post-conflict-preparation.ts
- preferences-store.ts
- github-readiness.ts
- jira-time.ts
- coordination-tick.ts
- accept-stage-result.ts
- session-bridge.ts
- scheduled-work.ts
- featureById
- brain-maintenance.ts
- Goals.tsx
- office-config.ts
- prompts/conversations.ts
- Offices
- command-registry.ts
- approach.ts
- cli.ts
- preparation-readback.ts
- retire-external-delivery.ts
- rootArtifact
- leadership.ts
- planning-baseline.ts
- helper-evidence.py
- install-service.mjs
- ProjectProgress
- time-classification.ts
- needsDecision
- BrainFollowup

## God Nodes (most connected - your core abstractions)
1. `Store` - 207 edges
2. `TicketJob` - 110 edges
3. `GitHubDelivery` - 110 edges
4. `artifact()` - 85 edges
5. `digest()` - 82 edges
6. `command()` - 80 edges
7. `workKey()` - 68 edges
8. `StageResult` - 61 edges
9. `cx()` - 61 edges
10. `OfficeSnapshot` - 53 edges

## Surprising Connections (you probably didn't know these)
- `apiRoute()` --calls--> `timeReport()`  [EXTRACTED]
  server/office/http/api-routes.ts → src/timing/timing.ts
- `scheduledWork()` --calls--> `deliveryRepairProjection()`  [EXTRACTED]
  server/scheduling/scheduled-work.ts → src/work/delivery-repair-projection.ts
- `scheduledWork()` --calls--> `deferredPickup()`  [EXTRACTED]
  server/scheduling/scheduled-work.ts → src/work/pickup-state.ts
- `withActiveClaims()` --calls--> `workKey()`  [EXTRACTED]
  server/scheduling/scheduled-work.ts → src/contracts/work.ts
- `Store` --references--> `OfficeSnapshot`  [EXTRACTED]
  server/store/store.ts → src/shared.ts

## Import Cycles
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/stage-reconciliation.ts -> server/delivery/recovery/implementation/continuation-review-readback.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-guard.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/preparation/post-conflict-preparation.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-publication.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/conversations/slack.ts -> server/workers/agents.ts -> server/workers/worker-runtime.ts -> server/conversations/slack.ts`
- 3-file cycle: `server/conversations/conversations.ts -> server/conversations/slack.ts -> server/workers/agents.ts -> server/conversations/conversations.ts`
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

## Communities (83 total, 5 thin omitted)

### Community 0 - "OfficeScene.tsx"
Cohesion: 0.06
Nodes (51): Avatar(), AzureWall(), Chair(), Coworker(), CTORoom(), Desk(), Floor, Furnishings (+43 more)

### Community 1 - "source-amendment.ts"
Cohesion: 0.06
Nodes (75): adoptCandidate(), reported, Scope, scopeRepairDirection(), approvedText(), assert(), AMENDMENT_REVIEW_PROOF, amendmentInstruction() (+67 more)

### Community 2 - "command"
Cohesion: 0.11
Nodes (17): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Result, Assessment (+9 more)

### Community 3 - "Inspector.tsx"
Cohesion: 0.08
Nodes (64): Conversation(), Outbox(), recommendedReply(), labels, LessonCard(), LessonsPanel(), when(), GoalList() (+56 more)

### Community 4 - "cec/workflow.ts"
Cohesion: 0.18
Nodes (24): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), run(), advance(), nextStage(), publicationEvidenceGap(), qaEvidenceGap() (+16 more)

### Community 5 - ".save"
Cohesion: 0.13
Nodes (28): BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue(), readIssues(), commentDecision() (+20 more)

### Community 6 - "StageResult"
Cohesion: 0.14
Nodes (31): closeoutCheckpoint(), closeoutRecoveryCandidate(), CloseoutRecoveryKind, completedClaim(), allowed, continuationArtifacts(), continuationNativeReview(), continuationWorkerProof() (+23 more)

### Community 7 - "Engine"
Cohesion: 0.09
Nodes (6): correlatedBuild(), MergeNotifications, Engine, observe(), observeParked(), parkedReadError

### Community 8 - "App.tsx"
Cohesion: 0.05
Nodes (47): itAgent(), itDiagnostics(), ServiceHealthPanel(), ServiceHealthRow(), CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants (+39 more)

### Community 9 - "agents.ts"
Cohesion: 0.10
Nodes (33): cecIntakePrompt(), cecTransitionPrompt(), ConversationResultSchema, slackSendPrompt(), HANDS_OFF_RESOLUTION_GUIDANCE, RESOLUTION_GUIDANCE, PICKUP_CHAT, canFileGithubIssue() (+25 more)

### Community 10 - "assignment-poll.ts"
Cohesion: 0.09
Nodes (48): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard, projectCards() (+40 more)

### Community 11 - "digest"
Cohesion: 0.12
Nodes (43): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutProviderEvidence() (+35 more)

### Community 12 - "GitHubDelivery"
Cohesion: 0.15
Nodes (16): StageContext, GitHubDelivery, stagePrompt(), StagePromptInput, ciCheckout(), verifyCIHooks(), CIFailure, guardCIRepair() (+8 more)

### Community 13 - "shared.ts"
Cohesion: 0.08
Nodes (31): coverageSchema, followupSchema, verified, ProjectReadiness, AssignmentResult, CompletionCondition, Continuation, DependencyObservation (+23 more)

### Community 14 - "activation-recovery.ts"
Cohesion: 0.24
Nodes (21): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+13 more)

### Community 15 - "workKey"
Cohesion: 0.15
Nodes (25): recordJobApproach(), savedActivationFailure(), continuationScope(), continuationGuard(), discoveryRecoveryCandidate(), brainImplementationCandidate(), BrainReadback, digest() (+17 more)

### Community 16 - "index.ts"
Cohesion: 0.12
Nodes (24): close(), config, itSpecialist, loadedRevision, offices, releaseLock, server, serviceHealth (+16 more)

### Community 17 - "conversations/conversations.ts"
Cohesion: 0.13
Nodes (22): assertConversationReadback(), Conversations, GoalChangeSchema, ReplySchema, pumpCTO(), queueCTOHandoff(), saveGoals(), pumpIT() (+14 more)

### Community 18 - "run-retrospective.ts"
Cohesion: 0.06
Nodes (55): acceptRetrospective(), normalizeStatement(), RETROSPECTIVE_HISTORY, Bucket, knowledgeContext(), LESSON_LIMIT, lessonPurpose(), MAX_LESSONS (+47 more)

### Community 19 - "Store"
Cohesion: 0.09
Nodes (18): featureEffectGate(), goalNoticeNeverDispatched(), Clock, EffectOperation, recover(), initialSnapshot(), initializeStoreSchema(), Store (+10 more)

### Community 20 - "SettingsPanel.tsx"
Cohesion: 0.16
Nodes (24): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView() (+16 more)

### Community 21 - "engine.ts"
Cohesion: 0.21
Nodes (16): checkMail(), drainMail(), requestMail(), dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), resume() (+8 more)

### Community 22 - "artifact"
Cohesion: 0.19
Nodes (27): containedFile(), savedPrerequisiteOriginal(), originalPublication(), Assessment, outsideScanSources(), Ownership, reconcileScopeRepairReadback(), requireThat() (+19 more)

### Community 23 - "remove-candidate.ts"
Cohesion: 0.20
Nodes (15): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+7 more)

### Community 24 - ".emit"
Cohesion: 0.14
Nodes (22): MessageInput, configureNotices(), noticeState(), retryRecipientLookup(), Assessment, bindDiscoveryResume(), diagnosticProof(), DiscoveryResumeInput (+14 more)

### Community 25 - "work-summary.ts"
Cohesion: 0.24
Nodes (16): themeColor, App(), deliveryRepairProjection(), PMQueueItem, pmQueueItems(), deliveryChanges(), following, phases (+8 more)

### Community 26 - "azure.ts"
Cohesion: 0.15
Nodes (20): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+12 more)

### Community 27 - "outbox.ts"
Cohesion: 0.28
Nodes (11): conversationResolved(), projectOutbox(), syncOutbox(), checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), checkpointSuperseded(), maintenanceSuperseded() (+3 more)

### Community 28 - "github-delivery.ts"
Cohesion: 0.12
Nodes (26): HANDS_OFF_PROJECTS, handsOff(), BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction(), dependabotReviewGuidance(), discover() (+18 more)

### Community 29 - "ControlStore"
Cohesion: 0.15
Nodes (8): DailyCTO, queueGoalEvidenceRequest(), GoalEvidenceRequestSchema, Briefing, saveReviewBriefing(), OfficeEntry, ControlStore, DailyCTOReport

### Community 30 - "Coordinator"
Cohesion: 0.08
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 31 - "offices.ts"
Cohesion: 0.11
Nodes (19): systemClock, LOCAL_BINDINGS, file, project, root, officeCapacity, projectById(), projectData() (+11 more)

### Community 32 - "approval.ts"
Cohesion: 0.30
Nodes (14): approveFeature(), assertRetainedItems(), commandFeature(), createFeature(), mutation(), reviewQuestions(), assertFeatureDependencyOrder(), featureDependencyEdges() (+6 more)

### Community 33 - "notifications.ts"
Cohesion: 0.17
Nodes (12): Identity, NoticeSettings, slackVerifyPrompt(), comparableSlackText(), SlackMessages, SlackRequestSchema, SlackResultSchema, SlackVerificationSchema (+4 more)

### Community 34 - "features.ts"
Cohesion: 0.14
Nodes (24): discoveryPrompt(), planPrompt(), document(), featureRoot(), DiscoverySchema, identity, manifestFromPlan(), ManifestSchema (+16 more)

### Community 35 - "coordination.ts"
Cohesion: 0.18
Nodes (14): poll(), readAssignments(), checkpointWindow(), dueAt(), hours, localDay(), ReviewResult, deferNonReady() (+6 more)

### Community 36 - "dependencies.ts"
Cohesion: 0.22
Nodes (19): Admission, admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, resumeParked(), compatible(), dependencyCompletionKey() (+11 more)

### Community 37 - "github-check-selection.ts"
Cohesion: 0.21
Nodes (18): checksFailed(), checksPassed(), checksPending(), CurrentChecksWait, currentMergeChecks(), pass(), pending(), requireThat() (+10 more)

### Community 38 - "daily-cto.ts"
Cohesion: 0.18
Nodes (13): EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), applyGoalReview(), DailyResultSchema, EvidenceRefSchema, FreshDailyResultSchema, statusAllowed() (+5 more)

### Community 39 - "OfficeSnapshot"
Cohesion: 0.09
Nodes (31): FeatureRound, FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures(), draftKey() (+23 more)

### Community 40 - "closeout.ts"
Cohesion: 0.29
Nodes (12): harnessCloseout(), PASSING, verifyMergeActions(), assertMayMutate(), runHarnessStage(), harnessStageResult(), receipt(), harnessDraft() (+4 more)

### Community 41 - "github.ts"
Cohesion: 0.26
Nodes (6): GitHubMonitor, githubPRDescription(), GOAL_EVIDENCE_LIMITS, GitHubBoard, GitHubPR, GitHubState

### Community 42 - "fact-bounds.ts"
Cohesion: 0.26
Nodes (15): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+7 more)

### Community 43 - "publication.ts"
Cohesion: 0.23
Nodes (7): FeaturePublisher, publishFeature(), reserveIdentity(), EffectUncertainError, FeatureManifest, FeatureManifestItem, FeatureOperation

### Community 45 - "service-health.ts"
Cohesion: 0.17
Nodes (10): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, slackHealth() (+2 more)

### Community 46 - "Role"
Cohesion: 0.22
Nodes (5): cecReadbackPrompt(), cecReconcilePrompt(), Agents, WorkerRuntime, Role

### Community 47 - "delivery-repairs.ts"
Cohesion: 0.28
Nodes (13): namedRepairIds(), amendmentRepairView(), approachFingerprint(), enqueueRepairDiagnosis(), githubRepairEligible(), jiraRepairable(), REPAIR_DIAGNOSIS, repairFindingIds() (+5 more)

### Community 48 - "jira-publication.ts"
Cohesion: 0.24
Nodes (9): unpack(), Assignment, Content, JiraFeaturePublisher, jiraText(), keyOf(), plainDescription(), Transition (+1 more)

### Community 49 - "TimeBook.tsx"
Cohesion: 0.14
Nodes (24): displayAgentTask(), githubStageLabels, withoutElapsed(), LiveAgentTask(), Props, RunningTask(), text(), Agent (+16 more)

### Community 50 - ".transaction"
Cohesion: 0.17
Nodes (16): featureItemComplete(), reconcileFeatureCompletion(), bindFeature(), currentApproval(), enrolled(), featureGate(), predecessorComplete(), helperTelemetry() (+8 more)

### Community 51 - "publish-pr.ts"
Cohesion: 0.26
Nodes (13): retryRead(), developerPRContent(), Execute, lintPRContent(), officePRContent(), prContent, assertCandidate(), Candidate (+5 more)

### Community 52 - "time-readback.ts"
Cohesion: 0.15
Nodes (14): timeLedger(), TimeLedger, dueReadback(), Readback, READBACK_INTERVAL_MS, readBackTime(), SETTLE_MS, ConfirmedSegment (+6 more)

### Community 53 - "it-specialist.ts"
Cohesion: 0.19
Nodes (17): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), partialLocalCleanupKey(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved() (+9 more)

### Community 54 - "post-conflict-preparation.ts"
Cohesion: 0.23
Nodes (20): assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), reconcileCompletedConflictDraft(), routeReadyPostConflictPublication(), verifyInitialDraftConflictPreparation() (+12 more)

### Community 55 - "preferences-store.ts"
Cohesion: 0.18
Nodes (11): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, SettingsPanel() (+3 more)

### Community 56 - "github-readiness.ts"
Cohesion: 0.17
Nodes (19): queueMergeNotice(), observeGitHubMergeNotices(), findingsBlock(), harnessDelivers(), legacyRecovery(), observe(), finishLeadReview(), merge() (+11 more)

### Community 57 - "jira-time.ts"
Cohesion: 0.23
Nodes (16): dailyReviewDate(), reviewWeekday(), addDays(), EASTERN, easternDay(), easternDayFormatter, easternInstant(), easternPartsFormatter (+8 more)

### Community 58 - "coordination-tick.ts"
Cohesion: 0.19
Nodes (14): reconcileNoticeConfirmations(), PrerequisitesSchema, brainCheckpointCompletion(), reconcileCompletedCheckpoints(), legacy, reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS (+6 more)

### Community 59 - "accept-stage-result.ts"
Cohesion: 0.12
Nodes (40): acceptStageResult(), resumeReviewedMerge(), mergeAuthorized(), advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat() (+32 more)

### Community 60 - "session-bridge.ts"
Cohesion: 0.21
Nodes (9): claudeSessions(), codexSessions(), desktopSessions(), guardianReview(), LiveSession, loadedCodexSession(), openRollouts(), SessionBridge (+1 more)

### Community 61 - "scheduled-work.ts"
Cohesion: 0.29
Nodes (11): closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), preparationRequestResolved(), withAmendmentOwnership(), deterministicActions, eligible(), requestResolved(), scheduledWork() (+3 more)

### Community 62 - "featureById"
Cohesion: 0.23
Nodes (6): featureById(), Link, linkFeature(), FeatureReviewRunner, featureRoute(), FeatureWorkflow

### Community 63 - "brain-maintenance.ts"
Cohesion: 0.13
Nodes (18): maintenancePolicies(), completeNativeCheckpoint(), reconcileNativeDelivery(), BrainMaintenance, BrainResult, BrainStatusSchema, identity, parseBrainStatus() (+10 more)

### Community 64 - "Goals.tsx"
Cohesion: 0.15
Nodes (15): SendMessage, CTOReview(), goalState, DailyCTO(), GoalHistory(), reportDate(), reviewStatus, blank() (+7 more)

### Community 65 - "office-config.ts"
Cohesion: 0.42
Nodes (7): goalEvidencePath(), OfficeConfigInputs, officeConfigRoute(), officeConfigSummary(), CECBinding, localBindings, OfficeProject

### Community 66 - "prompts/conversations.ts"
Cohesion: 0.29
Nodes (7): cecChatPrompt(), ctoChatPrompt(), itChatPrompt(), diagnosticContext(), diagnosticSnapshot(), nativeDeliveryResolved(), currentServices()

### Community 68 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 69 - "approach.ts"
Cohesion: 0.11
Nodes (22): JiraOperations, plain(), cecPrompt(), resolvedDecisionNote(), stageInstructions, APPROACH_GUIDANCE, ApproachSchema, reviewInstructions() (+14 more)

### Community 70 - "cli.ts"
Cohesion: 0.25
Nodes (6): args, [cmd,...rawArgs], commands, key, projectIndex, PORT

### Community 71 - "preparation-readback.ts"
Cohesion: 0.09
Nodes (28): bindPreparationBoardOrigins(), claimSchema, eventSchema, PreparationBoardOrigin, readPreparationBoardOrigins(), timestamp, updateSchema, nativeCompletion() (+20 more)

### Community 72 - "retire-external-delivery.ts"
Cohesion: 0.57
Nodes (5): completedPRReviews(), eligible(), mergedByOwner(), ownerSettles(), retireExternalDeliveries()

### Community 73 - "rootArtifact"
Cohesion: 0.14
Nodes (19): bindBrainAuditEffects(), Effect, Known, assertPriorBrainAudit(), brainAuditRetryFingerprint(), Context, jsonAfter(), nativeSessionPath() (+11 more)

### Community 74 - "leadership.ts"
Cohesion: 0.20
Nodes (8): DailyCTOBriefing, DailyCTOResult, DailyCTOSummary, DailyGoalUpdate, GoalEvidenceRef, GoalEvidenceRequest, GoalProgress, GoalStatus

### Community 75 - "planning-baseline.ts"
Cohesion: 0.46
Nodes (6): compareBaseline(), prepareBaseline(), scopePaths(), SourceChanged, tree(), targetObservation()

### Community 78 - "install-service.mjs"
Cohesion: 0.33
Nodes (5): file, folder, logs, root, xml()

### Community 80 - "time-classification.ts"
Cohesion: 0.73
Nodes (5): artifact(), correctRecoveryClassification(), digest(), timeClassificationDigest(), TimeClassificationInput

### Community 81 - "needsDecision"
Cohesion: 0.70
Nodes (3): parksInJira(), DECISION_KINDS, needsDecision()

## Knowledge Gaps
- **263 isolated node(s):** `offices`, `loadedRevision`, `serviceHealth`, `itSpecialist`, `config` (+258 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `source-amendment.ts`, `command`, `cec/workflow.ts`, `.save`, `StageResult`, `Engine`, `agents.ts`, `assignment-poll.ts`, `digest`, `GitHubDelivery`, `shared.ts`, `activation-recovery.ts`, `workKey`, `conversations/conversations.ts`, `run-retrospective.ts`, `engine.ts`, `artifact`, `remove-candidate.ts`, `.emit`, `azure.ts`, `github-delivery.ts`, `ControlStore`, `Coordinator`, `offices.ts`, `approval.ts`, `notifications.ts`, `features.ts`, `coordination.ts`, `dependencies.ts`, `daily-cto.ts`, `OfficeSnapshot`, `closeout.ts`, `github.ts`, `publication.ts`, `Role`, `delivery-repairs.ts`, `jira-publication.ts`, `.transaction`, `publish-pr.ts`, `time-readback.ts`, `it-specialist.ts`, `post-conflict-preparation.ts`, `github-readiness.ts`, `jira-time.ts`, `coordination-tick.ts`, `accept-stage-result.ts`, `session-bridge.ts`, `scheduled-work.ts`, `featureById`, `brain-maintenance.ts`, `prompts/conversations.ts`, `Offices`, `approach.ts`, `preparation-readback.ts`, `retire-external-delivery.ts`, `rootArtifact`, `planning-baseline.ts`, `ProjectProgress`, `time-classification.ts`, `BrainFollowup`?**
  _High betweenness centrality (0.108) - this node is a cross-community bridge._
- **Why does `ControlStore` connect `ControlStore` to `leadership.ts`, `Store`, `daily-cto.ts`, `offices.ts`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `workKey()` connect `workKey` to `source-amendment.ts`, `.save`, `digest`, `shared.ts`, `Store`, `artifact`, `remove-candidate.ts`, `.emit`, `offices.ts`, `approval.ts`, `dependencies.ts`, `post-conflict-preparation.ts`, `github-readiness.ts`, `coordination-tick.ts`, `accept-stage-result.ts`, `scheduled-work.ts`, `prompts/conversations.ts`, `preparation-readback.ts`, `retire-external-delivery.ts`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **What connects `offices`, `loadedRevision`, `serviceHealth` to the rest of the system?**
  _263 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `OfficeScene.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06440677966101695 - nodes in this community are weakly interconnected._
- **Should `source-amendment.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06172839506172839 - nodes in this community are weakly interconnected._
- **Should `command` be split into smaller, more focused modules?**
  _Cohesion score 0.11330049261083744 - nodes in this community are weakly interconnected._