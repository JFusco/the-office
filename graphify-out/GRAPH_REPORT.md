# Graph Report - people-directory  (2026-11-06)

## Corpus Check
- 381 files · ~192,797 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2298 nodes · 9845 edges · 77 communities (75 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 49 edges (avg confidence: 0.73)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bd54a410`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- .transaction
- store.ts
- source-amendment.ts
- dependency-bots/adopt.ts
- Store
- Inspector.tsx
- index.tsx
- OfficeScene.tsx
- .save
- github-delivery.ts
- cec/workflow.ts
- OfficeSnapshot
- continuation-evidence.ts
- GitHubDelivery
- PeoplePanel.tsx
- accept-stage-result.ts
- offices.ts
- requests.ts
- artifact
- closeout-recovery.ts
- implementation-recovery.ts
- jira-time.ts
- Goals.tsx
- SettingsPanel.tsx
- conversations/conversations.ts
- engine.ts
- index.ts
- it-specialist.ts
- shared.ts
- record-trigger.ts
- publish-pr.ts
- maintenance.ts
- Coordinator
- discovery-recovery.ts
- knowledge.ts
- useLiveTiming.ts
- run-retrospective.ts
- dependencies.ts
- .now
- .emit
- remove-candidate.ts
- goal-reviews.ts
- coordination.ts
- azure.ts
- coordination-tick.ts
- github-check-selection.ts
- scheduler.ts
- StageResult
- run-ci-repair.ts
- service-health.ts
- assignment-poll.ts
- TicketJob
- fact-bounds.ts
- preferences-store.ts
- goal-reporting.ts
- weekly-rollup.ts
- closeout.ts
- scheduled-work.ts
- retrospective-subject.ts
- delivery-task.ts
- saved-prerequisite-handoff.ts
- Offices
- session-bridge.ts
- sanitizeObject
- office-lessons.ts
- useOfficePreferences.ts
- knowledge-context.ts
- command-registry.ts
- cli.ts
- SlackMessages
- create-candidate.ts
- retire-external-delivery.ts
- liveReach
- needsDecision
- Coordination
- helper-evidence.py

## God Nodes (most connected - your core abstractions)
1. `Store` - 215 edges
2. `GitHubDelivery` - 110 edges
3. `TicketJob` - 110 edges
4. `artifact()` - 85 edges
5. `command()` - 85 edges
6. `digest()` - 82 edges
7. `cx()` - 69 edges
8. `workKey()` - 68 edges
9. `StageResult` - 63 edges
10. `OfficeSnapshot` - 60 edges

## Surprising Connections (you probably didn't know these)
- `projectOutbox()` --calls--> `deferredPickup()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/pickup-state.ts
- `pump()` --calls--> `deferredPickup()`  [EXTRACTED]
  server/conversations/team-conversation-pump.ts → src/work/pickup-state.ts
- `IntakeContext` --references--> `Coordination`  [EXTRACTED]
  server/delivery/intake/admission.ts → src/shared.ts
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

## Communities (77 total, 2 thin omitted)

### Community 0 - ".transaction"
Cohesion: 0.05
Nodes (78): approveFeature(), assertRetainedItems(), commandFeature(), createFeature(), featureById(), mutation(), reviewQuestions(), featureItemComplete() (+70 more)

### Community 1 - "store.ts"
Cohesion: 0.07
Nodes (53): cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), cecChatPrompt(), ctoChatPrompt(), itChatPrompt(), slackSendPrompt() (+45 more)

### Community 2 - "source-amendment.ts"
Cohesion: 0.07
Nodes (67): adoptCandidate(), reported, Scope, approvedText(), assert(), AMENDMENT_REVIEW_PROOF, amendmentInstruction(), amendmentIssueSha256() (+59 more)

### Community 3 - "dependency-bots/adopt.ts"
Cohesion: 0.10
Nodes (46): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard, projectCards() (+38 more)

### Community 4 - "Store"
Cohesion: 0.07
Nodes (22): JiraOperations, plain(), channelNoticeAuthorized(), notices(), queueChannelNotice(), Identity, MergeNotifications, stagePrompt() (+14 more)

### Community 5 - "Inspector.tsx"
Cohesion: 0.05
Nodes (52): CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants, ElevatorPhase, floorVariants, leftDoor, OfficeScene (+44 more)

### Community 6 - "index.tsx"
Cohesion: 0.09
Nodes (47): Conversation(), Outbox(), recommendedReply(), ServiceHealthPanel(), labels, ServiceHealthRow(), LessonsPanel(), when() (+39 more)

### Community 7 - "OfficeScene.tsx"
Cohesion: 0.06
Nodes (51): itAgent(), Avatar(), AzureWall(), Chair(), Coworker(), CTORoom(), Desk(), Floor (+43 more)

### Community 8 - ".save"
Cohesion: 0.09
Nodes (37): file, folder, logs, root, xml(), unpack(), BLOCKED, Execute (+29 more)

### Community 9 - "github-delivery.ts"
Cohesion: 0.10
Nodes (42): findingsBlock(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery(), dependabotReviewGuidance(), discover(), refreshDependencies() (+34 more)

### Community 10 - "cec/workflow.ts"
Cohesion: 0.11
Nodes (46): dispatchNightly(), drainDelivery(), requestDelivery(), resume(), startPilot(), run(), advance(), eligibility() (+38 more)

### Community 11 - "OfficeSnapshot"
Cohesion: 0.09
Nodes (41): conversationResolved(), projectOutbox(), knowledgeOutbox(), checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), checkpointSuperseded(), maintenanceSuperseded() (+33 more)

### Community 12 - "continuation-evidence.ts"
Cohesion: 0.12
Nodes (39): closeoutCheckpoint(), closeoutRecoveryCandidate(), CloseoutRecoveryKind, completedClaim(), coreCloseoutNative(), verifiedCloseoutCleanupRequest(), allowed, continuationArtifacts() (+31 more)

### Community 13 - "GitHubDelivery"
Cohesion: 0.11
Nodes (29): GitHubDelivery, resumeReviewedMerge(), advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat(), assertPostConflictFiles() (+21 more)

### Community 14 - "PeoplePanel.tsx"
Cohesion: 0.10
Nodes (39): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+31 more)

### Community 15 - "accept-stage-result.ts"
Cohesion: 0.12
Nodes (39): acceptStageResult(), mergeAuthorized(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash (+31 more)

### Community 16 - "offices.ts"
Cohesion: 0.11
Nodes (20): DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), dailyReviewDate(), reviewWeekday(), queueGoalEvidenceRequest(), DailyResultSchema (+12 more)

### Community 17 - "requests.ts"
Cohesion: 0.11
Nodes (38): savedActivationFailure(), brainImplementationCandidate(), implementationRecoveryCandidate(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), bindPreparationBoardOrigins(), claimSchema (+30 more)

### Community 18 - "artifact"
Cohesion: 0.13
Nodes (38): containedFile(), candidateInput(), children, oldAdoptionBasis(), savedCandidateAdmission, originalPublication(), Assessment, outsideScanSources() (+30 more)

### Community 19 - "closeout-recovery.ts"
Cohesion: 0.11
Nodes (38): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutProviderEvidence() (+30 more)

### Community 20 - "implementation-recovery.ts"
Cohesion: 0.12
Nodes (32): continuationJsonArtifact(), continuationScope(), continuationGuard(), BrainReadback, digest(), Ownership, Readback, recoverBrainImplementation() (+24 more)

### Community 21 - "jira-time.ts"
Cohesion: 0.10
Nodes (27): data(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), captureTime(), midnight() (+19 more)

### Community 22 - "Goals.tsx"
Cohesion: 0.09
Nodes (29): FeatureRound, SendMessage, FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures() (+21 more)

### Community 23 - "SettingsPanel.tsx"
Cohesion: 0.15
Nodes (27): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView() (+19 more)

### Community 24 - "conversations/conversations.ts"
Cohesion: 0.13
Nodes (22): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+14 more)

### Community 25 - "engine.ts"
Cohesion: 0.08
Nodes (15): correlatedBuild(), checkMail(), drainMail(), requestMail(), enableNightly(), ingest(), GitHubMonitor, drainMaintenance() (+7 more)

### Community 26 - "index.ts"
Cohesion: 0.13
Nodes (24): featureRoute(), close(), config, itSpecialist, loadedRevision, offices, releaseLock, server (+16 more)

### Community 27 - "it-specialist.ts"
Cohesion: 0.14
Nodes (20): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), ITContext (+12 more)

### Community 28 - "shared.ts"
Cohesion: 0.08
Nodes (29): ProjectReadiness, DailyCTOSummary, AssignmentResult, CompletionCondition, DependencyObservation, EligibilityState, FailureCategory, ReconciliationAction (+21 more)

### Community 29 - "record-trigger.ts"
Cohesion: 0.16
Nodes (25): clip(), JobLike, recordCIBudget(), recordParked(), recordRepairBudget(), recordTicketParked(), recordTrigger(), subjectOf() (+17 more)

### Community 30 - "publish-pr.ts"
Cohesion: 0.18
Nodes (19): activeEffectId(), harnessEffect, assertMayMutate(), retryRead(), park(), developerPRContent(), Execute, lintPRContent() (+11 more)

### Community 31 - "maintenance.ts"
Cohesion: 0.18
Nodes (15): maintenancePolicies(), BrainMaintenance, BrainResult, easternDate(), GitHubMaintenance, MaintenanceSchema, MAINTENANCE_NATIVE_GUIDANCE, maintenanceCoveragePassed() (+7 more)

### Community 32 - "Coordinator"
Cohesion: 0.09
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 33 - "discovery-recovery.ts"
Cohesion: 0.13
Nodes (18): Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership, rawHash() (+10 more)

### Community 34 - "knowledge.ts"
Cohesion: 0.13
Nodes (21): Accepted, RETROSPECTIVE_HISTORY, Kind, RetrospectiveResult, Stage, KnowledgeRetry, KnowledgeState, Lesson (+13 more)

### Community 35 - "useLiveTiming.ts"
Cohesion: 0.15
Nodes (20): displayAgentTask(), githubStageLabels, withoutElapsed(), LiveAgentTask(), Props, RunningTask(), text(), Agent (+12 more)

### Community 36 - "run-retrospective.ts"
Cohesion: 0.17
Nodes (19): acceptRetrospective(), clip(), PACKET_LIMIT, retrospectiveFacts(), RetrospectivePacket, retrospectivePrompt(), RetrospectiveResultSchema, triggerJobId() (+11 more)

### Community 37 - "dependencies.ts"
Cohesion: 0.23
Nodes (17): Admission, admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, compatible(), dependencyCompletionKey(), dependencyEligibility() (+9 more)

### Community 38 - ".now"
Cohesion: 0.11
Nodes (10): goalNoticeNeverDispatched(), recover(), initialSnapshot(), initializeStoreSchema(), checkpointMeasurement(), HEARTBEAT_GAP_MS, HEARTBEAT_MS, startMeasurement() (+2 more)

### Community 39 - ".emit"
Cohesion: 0.23
Nodes (16): ChannelSettings, configureChannelNotices(), configureNotices(), NoticeSettings, retryRecipientLookup(), configureKnowledge(), declineLessonIssue(), reactivateLesson() (+8 more)

### Community 40 - "remove-candidate.ts"
Cohesion: 0.20
Nodes (15): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+7 more)

### Community 41 - "goal-reviews.ts"
Cohesion: 0.14
Nodes (16): applyGoalReview(), EvidenceRefSchema, FreshDailyResultSchema, statusAllowed(), workEvidence(), GoalInput, saveGoal(), queueGoalNotice() (+8 more)

### Community 42 - "coordination.ts"
Cohesion: 0.18
Nodes (18): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation(), checkpointWindow(), dueAt() (+10 more)

### Community 43 - "azure.ts"
Cohesion: 0.19
Nodes (15): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+7 more)

### Community 44 - "coordination-tick.ts"
Cohesion: 0.16
Nodes (13): reconcileNoticeConfirmations(), PrerequisitesSchema, BrainFollowup, legacy, reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION (+5 more)

### Community 45 - "github-check-selection.ts"
Cohesion: 0.25
Nodes (15): checksFailed(), checksPassed(), checksPending(), currentMergeChecks(), pass(), pending(), requireThat(), runIdentity() (+7 more)

### Community 46 - "scheduler.ts"
Cohesion: 0.17
Nodes (9): Clock, fifo(), ScheduledWork, Scheduler, selectWork(), withAssignment(), ExecutionLane, ProgressionItem (+1 more)

### Community 47 - "StageResult"
Cohesion: 0.18
Nodes (5): StageContext, reconcileNativeDelivery(), Agents, WorkerRuntime, StageResult

### Community 48 - "run-ci-repair.ts"
Cohesion: 0.31
Nodes (11): ciCheckout(), verifyCIHooks(), CIFailure, guardCIRepair(), prepareCIMetadataRepair(), publishCIRepair(), rewordCommits(), CIPlanSchema (+3 more)

### Community 49 - "service-health.ts"
Cohesion: 0.20
Nodes (9): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, slackHealth() (+1 more)

### Community 50 - "assignment-poll.ts"
Cohesion: 0.23
Nodes (12): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), mergeText(), noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), syncOutbox() (+4 more)

### Community 51 - "TicketJob"
Cohesion: 0.17
Nodes (6): BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction(), implementationContinuationInstruction(), TicketJob

### Community 52 - "fact-bounds.ts"
Cohesion: 0.28
Nodes (14): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+6 more)

### Community 53 - "preferences-store.ts"
Cohesion: 0.19
Nodes (10): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS (+2 more)

### Community 54 - "goal-reporting.ts"
Cohesion: 0.25
Nodes (12): githubPRDescription(), azureGoalFacts(), azurePRDescription(), boundedEvidence(), EvidenceStore, GOAL_EVIDENCE_LIMITS, GOAL_REPORT_GUIDANCE, GoalReport (+4 more)

### Community 55 - "weekly-rollup.ts"
Cohesion: 0.24
Nodes (14): RollupResult, RollupResultSchema, RETROSPECTIVE_TIMEOUT, ineffectiveLessons(), lastFriday(), ROLLUP_HISTORY, rollupDue(), RollupHooks (+6 more)

### Community 56 - "closeout.ts"
Cohesion: 0.38
Nodes (9): harnessCloseout(), PASSING, verifyMergeActions(), runHarnessStage(), harnessStageResult(), receipt(), harnessDraft(), harnessPrepare() (+1 more)

### Community 57 - "scheduled-work.ts"
Cohesion: 0.25
Nodes (10): closeoutRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), deterministicActions, eligible(), OfficeEntry, requestResolved() (+2 more)

### Community 58 - "retrospective-subject.ts"
Cohesion: 0.23
Nodes (11): deliveryMetrics(), median(), azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject, ticketSubject(), DeliveryMetrics (+3 more)

### Community 59 - "delivery-task.ts"
Cohesion: 0.24
Nodes (10): cecPrompt(), resolvedDecisionNote(), stageInstructions, APPROACH_GUIDANCE, reviewInstructions(), deliveryTask(), DeliveryTaskInput, DISCOVERY_GUIDANCE (+2 more)

### Community 60 - "saved-prerequisite-handoff.ts"
Cohesion: 0.36
Nodes (12): continuationWorktree(), dependencyVersion(), handoffSavedPrerequisites(), hasSavedPrerequisiteResult(), Ownership, qualified(), readDependencies(), requireSavedPrerequisites() (+4 more)

### Community 62 - "session-bridge.ts"
Cohesion: 0.23
Nodes (9): claudeSessions(), codexSessions(), desktopSessions(), guardianReview(), LiveSession, loadedCodexSession(), openRollouts(), SessionBridge (+1 more)

### Community 63 - "sanitizeObject"
Cohesion: 0.29
Nodes (9): snapshot(), goalEvidencePath(), OfficeConfigInputs, officeConfigRoute(), officeConfigSummary(), CECBinding, localBindings, sanitizeObject() (+1 more)

### Community 64 - "office-lessons.ts"
Cohesion: 0.32
Nodes (7): normalizeStatement(), decideOfficeProposal(), now(), OfficeKnowledgeStore, proposeOfficeLessons(), retireOfficeLesson(), OfficeKnowledge

### Community 65 - "useOfficePreferences.ts"
Cohesion: 0.26
Nodes (10): acceptPreferences(), PreferenceCandidate, strip(), UNKNOWN_PREFERENCES, OfficePreferencesController, PreferenceFeedback, PreferenceField, requestPreferences() (+2 more)

### Community 66 - "knowledge-context.ts"
Cohesion: 0.22
Nodes (10): Bucket, knowledgeContext(), LESSON_LIMIT, lessonPurpose(), MAX_LESSONS, PURPOSES, render(), SECTION_LIMIT (+2 more)

### Community 67 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 68 - "cli.ts"
Cohesion: 0.25
Nodes (6): args, [cmd,...rawArgs], commands, key, projectIndex, PORT

### Community 69 - "SlackMessages"
Cohesion: 0.46
Nodes (3): comparableSlackText(), SlackMessages, SlackRequestSchema

### Community 70 - "create-candidate.ts"
Cohesion: 0.48
Nodes (6): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf()

### Community 71 - "retire-external-delivery.ts"
Cohesion: 0.57
Nodes (5): completedPRReviews(), eligible(), mergedByOwner(), ownerSettles(), retireExternalDeliveries()

### Community 72 - "liveReach"
Cohesion: 0.60
Nodes (5): GIT_NETWORK, LIVE_PROVIDERS, liveReach(), networkUrl(), remoteUrls()

### Community 73 - "needsDecision"
Cohesion: 0.70
Nodes (3): parksInJira(), DECISION_KINDS, needsDecision()

### Community 74 - "Coordination"
Cohesion: 0.67
Nodes (3): TimeLedgerState, Continuation, Coordination

## Knowledge Gaps
- **274 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+269 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `.transaction`, `store.ts`, `source-amendment.ts`, `dependency-bots/adopt.ts`, `.save`, `github-delivery.ts`, `cec/workflow.ts`, `OfficeSnapshot`, `continuation-evidence.ts`, `GitHubDelivery`, `accept-stage-result.ts`, `offices.ts`, `requests.ts`, `artifact`, `closeout-recovery.ts`, `implementation-recovery.ts`, `jira-time.ts`, `conversations/conversations.ts`, `engine.ts`, `index.ts`, `it-specialist.ts`, `record-trigger.ts`, `publish-pr.ts`, `maintenance.ts`, `discovery-recovery.ts`, `knowledge.ts`, `run-retrospective.ts`, `dependencies.ts`, `.now`, `.emit`, `remove-candidate.ts`, `goal-reviews.ts`, `coordination.ts`, `azure.ts`, `coordination-tick.ts`, `scheduler.ts`, `StageResult`, `goal-reporting.ts`, `weekly-rollup.ts`, `scheduled-work.ts`, `retrospective-subject.ts`, `delivery-task.ts`, `saved-prerequisite-handoff.ts`, `Offices`, `session-bridge.ts`, `office-lessons.ts`, `knowledge-context.ts`, `create-candidate.ts`, `retire-external-delivery.ts`?**
  _High betweenness centrality (0.113) - this node is a cross-community bridge._
- **Why does `Engine` connect `engine.ts` to `.transaction`, `Store`, `github-delivery.ts`, `cec/workflow.ts`, `coordination.ts`, `azure.ts`, `GitHubDelivery`, `StageResult`, `offices.ts`, `requests.ts`, `conversations/conversations.ts`, `scheduled-work.ts`, `maintenance.ts`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `TicketJob` connect `TicketJob` to `source-amendment.ts`, `dependency-bots/adopt.ts`, `Store`, `Inspector.tsx`, `.save`, `github-delivery.ts`, `cec/workflow.ts`, `OfficeSnapshot`, `continuation-evidence.ts`, `GitHubDelivery`, `accept-stage-result.ts`, `requests.ts`, `artifact`, `closeout-recovery.ts`, `implementation-recovery.ts`, `it-specialist.ts`, `shared.ts`, `record-trigger.ts`, `publish-pr.ts`, `discovery-recovery.ts`, `dependencies.ts`, `remove-candidate.ts`, `github-check-selection.ts`, `scheduler.ts`, `StageResult`, `run-ci-repair.ts`, `fact-bounds.ts`, `closeout.ts`, `retrospective-subject.ts`, `delivery-task.ts`, `saved-prerequisite-handoff.ts`, `create-candidate.ts`, `retire-external-delivery.ts`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `command()` (e.g. with `.constructor()` and `executeRequest()`) actually correct?**
  _`command()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _274 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `.transaction` be split into smaller, more focused modules?**
  _Cohesion score 0.052116875372689324 - nodes in this community are weakly interconnected._
- **Should `store.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07432651736449204 - nodes in this community are weakly interconnected._