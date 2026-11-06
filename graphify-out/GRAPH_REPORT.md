# Graph Report - the-office  (2026-11-06)

## Corpus Check
- 373 files · ~191,050 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2257 nodes · 9627 edges · 83 communities (79 shown, 4 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 49 edges (avg confidence: 0.74)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `95469323`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- OfficeScene.tsx
- source-amendment.ts
- command
- index.tsx
- cec/workflow.ts
- .save
- artifact
- Engine
- Inspector.tsx
- agents.ts
- dependency-bots/adopt.ts
- requests.ts
- run-ci-repair.ts
- shared.ts
- activation-recovery.ts
- accept-stage-result.ts
- index.ts
- conversations/conversations.ts
- record-trigger.ts
- Store
- LessonsPanel.tsx
- engine.ts
- digest
- remove-candidate.ts
- discovery-recovery.ts
- OfficeSnapshot
- azure.ts
- assignment-poll.ts
- github-delivery.ts
- ControlStore
- Coordinator
- offices.ts
- dependency-edges.ts
- SlackMessages
- features/workflow.ts
- coordination.ts
- dependencies.ts
- github-check-selection.ts
- daily-cto.ts
- FeatureWorkspace.tsx
- StageResult
- github.ts
- fact-bounds.ts
- github-publication.ts
- TicketJob
- service-health.ts
- prompts/conversations.ts
- knowledge.ts
- jira-publication.ts
- TimeBook.tsx
- delivery-binding.ts
- publish-pr.ts
- jira-time.ts
- run-retrospective.ts
- office-lessons.ts
- useOfficePreferences.ts
- refresh-conflicted.ts
- weekly-rollup.ts
- coordination-tick.ts
- workKey
- session-bridge.ts
- scheduled-work.ts
- features.ts
- github-context.ts
- DailyCTO.tsx
- retrospective-subject.ts
- ServiceHealthPanel.tsx
- Offices
- command-registry.ts
- github-readiness.ts
- config.ts
- GitHubDelivery
- work.ts
- delivery-recoveries.ts
- http/commands.ts
- knowledge-context.ts
- helper-evidence.py
- install-service.mjs
- ProjectProgress
- store.ts
- needsDecision
- BrainFollowup

## God Nodes (most connected - your core abstractions)
1. `Store` - 209 edges
2. `TicketJob` - 110 edges
3. `GitHubDelivery` - 109 edges
4. `artifact()` - 85 edges
5. `digest()` - 82 edges
6. `command()` - 82 edges
7. `workKey()` - 68 edges
8. `StageResult` - 63 edges
9. `cx()` - 63 edges
10. `OfficeSnapshot` - 54 edges

## Surprising Connections (you probably didn't know these)
- `projectOutbox()` --calls--> `deferredPickup()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/pickup-state.ts
- `pump()` --calls--> `deferredPickup()`  [EXTRACTED]
  server/conversations/team-conversation-pump.ts → src/work/pickup-state.ts
- `StageContext` --references--> `Role`  [EXTRACTED]
  server/delivery/pipeline/accept-stage-result.ts → src/shared.ts
- `StageContext` --references--> `StageResult`  [EXTRACTED]
  server/delivery/pipeline/accept-stage-result.ts → src/shared.ts
- `RetrospectivePacket` --references--> `PendingRetrospective`  [EXTRACTED]
  server/knowledge/retrospective-facts.ts → src/contracts/knowledge.ts

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

## Communities (83 total, 4 thin omitted)

### Community 0 - "OfficeScene.tsx"
Cohesion: 0.06
Nodes (55): displayAgentTask(), githubStageLabels, withoutElapsed(), LiveAgentTask(), Props, RunningTask(), text(), Avatar() (+47 more)

### Community 1 - "source-amendment.ts"
Cohesion: 0.07
Nodes (68): stagePrompt(), StagePromptInput, adoptCandidate(), reported, Scope, approvedText(), assert(), amendmentInstruction() (+60 more)

### Community 2 - "command"
Cohesion: 0.13
Nodes (19): JiraOperations, plain(), SlackVerificationSchema, goalNoticeAuthorized(), sendGoalNotice(), Assessment, sanitize(), EffectOperation (+11 more)

### Community 3 - "index.tsx"
Cohesion: 0.08
Nodes (54): Outbox(), SendMessage, labels, GoalList(), blank(), goalInput, Goals(), EvidenceCard() (+46 more)

### Community 4 - "cec/workflow.ts"
Cohesion: 0.13
Nodes (34): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), run(), advance(), nextStage(), publicationEvidenceGap(), qaEvidenceGap() (+26 more)

### Community 5 - ".save"
Cohesion: 0.13
Nodes (30): BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue(), readIssues(), commentDecision() (+22 more)

### Community 6 - "artifact"
Cohesion: 0.18
Nodes (30): assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), reconcileCompletedConflictDraft(), routeReadyPostConflictPublication(), verifyInitialDraftConflictPreparation(), within() (+22 more)

### Community 7 - "Engine"
Cohesion: 0.10
Nodes (5): correlatedBuild(), Engine, observe(), observeParked(), parkedReadError

### Community 8 - "Inspector.tsx"
Cohesion: 0.05
Nodes (54): themeColor, App(), CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants, ElevatorPhase, floorVariants (+46 more)

### Community 9 - "agents.ts"
Cohesion: 0.10
Nodes (25): stageInstructions, SlackResultSchema, HANDS_OFF_RESOLUTION_GUIDANCE, RESOLUTION_GUIDANCE, canFileGithubIssue(), githubFollowupPrompt(), knowledgeChatPrompt(), contextPacket() (+17 more)

### Community 10 - "dependency-bots/adopt.ts"
Cohesion: 0.14
Nodes (39): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard, projectCards() (+31 more)

### Community 11 - "requests.ts"
Cohesion: 0.09
Nodes (59): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+51 more)

### Community 12 - "run-ci-repair.ts"
Cohesion: 0.28
Nodes (11): ciCheckout(), verifyCIHooks(), CIFailure, guardCIRepair(), prepareCIMetadataRepair(), publishCIRepair(), rewordCommits(), CIPlanSchema (+3 more)

### Community 13 - "shared.ts"
Cohesion: 0.09
Nodes (28): ProjectReadiness, ConfirmedSegment, ObservationGap, SnapshotOrdering, TimeLedgerState, ReconciliationRequest, SchedulerState, Conversation() (+20 more)

### Community 14 - "activation-recovery.ts"
Cohesion: 0.24
Nodes (23): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+15 more)

### Community 15 - "accept-stage-result.ts"
Cohesion: 0.20
Nodes (21): acceptStageResult(), mergeAuthorized(), continuationNativeReview(), continuationReviewArtifacts(), negativeWorker(), reconcileContinuationReview(), savedNegativeContinuationReview(), discoveryReviewSatisfied() (+13 more)

### Community 16 - "index.ts"
Cohesion: 0.12
Nodes (30): close(), config, itSpecialist, loadedRevision, offices, releaseLock, server, serviceHealth (+22 more)

### Community 17 - "conversations/conversations.ts"
Cohesion: 0.06
Nodes (46): assertConversationReadback(), conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput (+38 more)

### Community 18 - "record-trigger.ts"
Cohesion: 0.15
Nodes (23): clip(), JobLike, recordCIBudget(), recordParked(), recordRepairBudget(), recordTicketParked(), recordTrigger(), subjectOf() (+15 more)

### Community 19 - "Store"
Cohesion: 0.12
Nodes (11): featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), recoverFeatures(), goalNoticeNeverDispatched(), reconcileNativeDelivery(), recover(), Store (+3 more)

### Community 20 - "LessonsPanel.tsx"
Cohesion: 0.17
Nodes (24): LessonsPanel(), when(), SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS (+16 more)

### Community 21 - "engine.ts"
Cohesion: 0.25
Nodes (14): checkMail(), drainMail(), requestMail(), dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), resume() (+6 more)

### Community 22 - "digest"
Cohesion: 0.17
Nodes (31): containedFile(), finishLeadReview(), Assessment, outsideScanSources(), Ownership, reconcileScopeRepairReadback(), requireThat(), scopeRepairReadbackCandidate() (+23 more)

### Community 23 - "remove-candidate.ts"
Cohesion: 0.20
Nodes (15): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+7 more)

### Community 24 - "discovery-recovery.ts"
Cohesion: 0.13
Nodes (18): Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership, rawHash() (+10 more)

### Community 25 - "OfficeSnapshot"
Cohesion: 0.11
Nodes (33): conversationResolved(), projectOutbox(), knowledgeOutbox(), checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), checkpointSuperseded(), maintenanceSuperseded() (+25 more)

### Community 26 - "azure.ts"
Cohesion: 0.15
Nodes (20): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+12 more)

### Community 27 - "assignment-poll.ts"
Cohesion: 0.13
Nodes (20): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), configureNotices(), Identity, MergeNotifications (+12 more)

### Community 28 - "github-delivery.ts"
Cohesion: 0.17
Nodes (20): findingsBlock(), HANDS_OFF_PROJECTS, handsOff(), BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction(), discover() (+12 more)

### Community 29 - "ControlStore"
Cohesion: 0.17
Nodes (3): Briefing, saveReviewBriefing(), ControlStore

### Community 30 - "Coordinator"
Cohesion: 0.08
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 31 - "offices.ts"
Cohesion: 0.09
Nodes (20): Clock, EASTERN, easternDayFormatter, easternPartsFormatter, systemClock, officeCapacity, fifo(), ScheduledWork (+12 more)

### Community 32 - "dependency-edges.ts"
Cohesion: 1.00
Nodes (3): assertFeatureDependencyOrder(), featureDependencyEdges(), key()

### Community 34 - "features/workflow.ts"
Cohesion: 0.13
Nodes (33): approveFeature(), assertRetainedItems(), commandFeature(), createFeature(), featureById(), mutation(), reviewQuestions(), discoveryPrompt() (+25 more)

### Community 35 - "coordination.ts"
Cohesion: 0.19
Nodes (19): hasUncertainEffects(), reconcileCloseout(), completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation() (+11 more)

### Community 36 - "dependencies.ts"
Cohesion: 0.20
Nodes (19): Admission, admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, resumeParked(), compatible(), dependencyCompletionKey() (+11 more)

### Community 37 - "github-check-selection.ts"
Cohesion: 0.21
Nodes (18): checksFailed(), checksPassed(), checksPending(), CurrentChecksWait, currentMergeChecks(), pass(), pending(), requireThat() (+10 more)

### Community 38 - "daily-cto.ts"
Cohesion: 0.11
Nodes (25): DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), dailyReviewDate(), reviewWeekday(), queueGoalEvidenceRequest(), applyGoalReview() (+17 more)

### Community 39 - "FeatureWorkspace.tsx"
Cohesion: 0.18
Nodes (15): FeatureRound, FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures(), draftKey() (+7 more)

### Community 40 - "StageResult"
Cohesion: 0.38
Nodes (10): harnessCloseout(), PASSING, verifyMergeActions(), runHarnessStage(), harnessStageResult(), receipt(), harnessDraft(), harnessPrepare() (+2 more)

### Community 41 - "github.ts"
Cohesion: 0.26
Nodes (6): GitHubMonitor, githubPRDescription(), GOAL_EVIDENCE_LIMITS, GitHubBoard, GitHubPR, GitHubState

### Community 42 - "fact-bounds.ts"
Cohesion: 0.26
Nodes (15): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+7 more)

### Community 43 - "github-publication.ts"
Cohesion: 0.15
Nodes (15): assertEnrollable(), Assign, Board, Content, GitHubFeaturePublisher, number(), same(), FeaturePublisher (+7 more)

### Community 44 - "TicketJob"
Cohesion: 0.14
Nodes (10): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), dependabotReviewGuidance(), StageContext (+2 more)

### Community 45 - "service-health.ts"
Cohesion: 0.17
Nodes (10): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, slackHealth() (+2 more)

### Community 46 - "prompts/conversations.ts"
Cohesion: 0.13
Nodes (16): cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), cecChatPrompt(), ctoChatPrompt(), itChatPrompt(), slackSendPrompt() (+8 more)

### Community 47 - "knowledge.ts"
Cohesion: 0.15
Nodes (19): Kind, Stage, KnowledgeRetry, Lesson, LESSON_KINDS, LESSON_STAGES, LessonKind, LessonRecurrence (+11 more)

### Community 48 - "jira-publication.ts"
Cohesion: 0.24
Nodes (8): unpack(), Assignment, Content, JiraFeaturePublisher, jiraText(), keyOf(), plainDescription(), Transition

### Community 49 - "TimeBook.tsx"
Cohesion: 0.20
Nodes (16): LiveAnchor, AzureBuild, lastWall, sample(), subscribe(), subscribers, useLiveClock(), liveBuildTiming() (+8 more)

### Community 50 - "delivery-binding.ts"
Cohesion: 0.26
Nodes (13): approvedDelivery(), bindDelivery(), featureDeliveryContext(), featureEffectGate(), assertFeatureGate(), bindFeature(), currentApproval(), enrolled() (+5 more)

### Community 51 - "publish-pr.ts"
Cohesion: 0.18
Nodes (19): activeEffectId(), harnessEffect, assertMayMutate(), retryRead(), park(), developerPRContent(), Execute, lintPRContent() (+11 more)

### Community 52 - "jira-time.ts"
Cohesion: 0.12
Nodes (22): data(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), captureTime(), midnight() (+14 more)

### Community 53 - "run-retrospective.ts"
Cohesion: 0.21
Nodes (16): clip(), PACKET_LIMIT, retrospectiveFacts(), RetrospectivePacket, retrospectivePrompt(), RetrospectiveResultSchema, terminalCandidates(), triggerJobId() (+8 more)

### Community 54 - "office-lessons.ts"
Cohesion: 0.23
Nodes (12): Accepted, acceptRetrospective(), normalizeStatement(), RETROSPECTIVE_HISTORY, decideOfficeProposal(), mirrorOfficeKnowledge(), now(), OfficeKnowledgeStore (+4 more)

### Community 55 - "useOfficePreferences.ts"
Cohesion: 0.11
Nodes (20): PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, acceptPreferences(), PreferenceCandidate, PreferenceState (+12 more)

### Community 56 - "refresh-conflicted.ts"
Cohesion: 0.17
Nodes (19): harnessDelivers(), legacyRecovery(), observe(), merge(), verifyPR(), teamReviewedHead(), completedPRReviews(), eligible() (+11 more)

### Community 57 - "weekly-rollup.ts"
Cohesion: 0.22
Nodes (17): RollupResult, RollupResultSchema, harperFolder(), RETROSPECTIVE_TIMEOUT, retryDelay(), ineffectiveLessons(), lastFriday(), ROLLUP_HISTORY (+9 more)

### Community 58 - "coordination-tick.ts"
Cohesion: 0.21
Nodes (13): reconcileNoticeConfirmations(), PrerequisitesSchema, legacy, reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION, tick() (+5 more)

### Community 59 - "workKey"
Cohesion: 0.13
Nodes (40): recordJobApproach(), advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat(), continuationScope(), continuationWorktree() (+32 more)

### Community 60 - "session-bridge.ts"
Cohesion: 0.21
Nodes (9): claudeSessions(), codexSessions(), desktopSessions(), guardianReview(), LiveSession, loadedCodexSession(), openRollouts(), SessionBridge (+1 more)

### Community 61 - "scheduled-work.ts"
Cohesion: 0.32
Nodes (10): closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), deterministicActions, eligible(), requestResolved() (+2 more)

### Community 62 - "features.ts"
Cohesion: 0.13
Nodes (17): EvidenceSchema, helperInstallation(), readReview(), ReviewEvidence, observeHelperGroups(), stopHelperGroups(), FeatureReviewRunner, importReview() (+9 more)

### Community 63 - "github-context.ts"
Cohesion: 0.14
Nodes (18): ApproachSchema, GITHUB_ISSUE_SKILL, maintenancePolicies(), Result, BrainMaintenance, BrainResult, easternDate(), GitHubMaintenance (+10 more)

### Community 64 - "DailyCTO.tsx"
Cohesion: 0.26
Nodes (8): CTOReview(), goalState, DailyCTO(), GoalHistory(), reportDate(), reviewStatus, reviewExcerpt(), ReviewText()

### Community 65 - "retrospective-subject.ts"
Cohesion: 0.21
Nodes (13): deliveryMetrics(), median(), azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject, ticketSubject(), DeliveryMetrics (+5 more)

### Community 66 - "ServiceHealthPanel.tsx"
Cohesion: 0.25
Nodes (10): diagnosticContext(), diagnosticSnapshot(), itAgent(), itDiagnostics(), currentServices(), ServiceHealthPanel(), ServiceHealthRow(), HeartPulse (+2 more)

### Community 67 - "Offices"
Cohesion: 0.18
Nodes (6): file, project, root, projectById(), projectData(), Offices

### Community 68 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 69 - "github-readiness.ts"
Cohesion: 0.17
Nodes (14): cecPrompt(), resolvedDecisionNote(), acceptConflictRepair(), APPROACH_GUIDANCE, nextJobStage(), reviewInstructions(), deliveryTask(), DeliveryTaskInput (+6 more)

### Community 70 - "config.ts"
Cohesion: 0.14
Nodes (14): args, [cmd,...rawArgs], commands, key, projectIndex, goalEvidencePath(), CEC, DATA (+6 more)

### Community 71 - "GitHubDelivery"
Cohesion: 0.07
Nodes (40): GitHubDelivery, resumeReviewedMerge(), hasSavedPrerequisiteResult(), readPostConflictPreparationFacts(), bindPreparationBoardOrigins(), claimSchema, eventSchema, PreparationBoardOrigin (+32 more)

### Community 72 - "work.ts"
Cohesion: 0.14
Nodes (14): AssignmentResult, CompletionCondition, Continuation, DependencyObservation, EligibilityState, FailureCategory, Prerequisite, ReconciliationAction (+6 more)

### Community 73 - "delivery-recoveries.ts"
Cohesion: 0.12
Nodes (22): savedActivationFailure(), candidateInput(), children, oldAdoptionBasis(), savedCandidateAdmission, validationReadbackCandidate(), repeatConflictRepairAdmission(), runDeliveryRecoveries() (+14 more)

### Community 74 - "http/commands.ts"
Cohesion: 0.45
Nodes (8): configureKnowledge(), declineLessonIssue(), reactivateLesson(), retireLesson(), commandRoute(), enqueueCloseoutReconciliation(), enqueueRequest(), enqueueSourceAmendment()

### Community 75 - "knowledge-context.ts"
Cohesion: 0.24
Nodes (9): Bucket, knowledgeContext(), LESSON_LIMIT, lessonPurpose(), MAX_LESSONS, PURPOSES, render(), SECTION_LIMIT (+1 more)

### Community 78 - "install-service.mjs"
Cohesion: 0.33
Nodes (5): file, folder, logs, root, xml()

### Community 80 - "store.ts"
Cohesion: 0.39
Nodes (4): initialSnapshot(), initializeStoreSchema(), DEVELOPER_EFFORT, DEVELOPER_MODEL

### Community 81 - "needsDecision"
Cohesion: 0.70
Nodes (3): parksInJira(), DECISION_KINDS, needsDecision()

## Knowledge Gaps
- **271 isolated node(s):** `Identity`, `Text`, `Hash`, `Proposal`, `SourceReservation` (+266 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `source-amendment.ts`, `command`, `cec/workflow.ts`, `.save`, `artifact`, `Engine`, `agents.ts`, `dependency-bots/adopt.ts`, `requests.ts`, `activation-recovery.ts`, `accept-stage-result.ts`, `conversations/conversations.ts`, `record-trigger.ts`, `engine.ts`, `digest`, `remove-candidate.ts`, `discovery-recovery.ts`, `OfficeSnapshot`, `azure.ts`, `assignment-poll.ts`, `github-delivery.ts`, `Coordinator`, `offices.ts`, `dependency-edges.ts`, `features/workflow.ts`, `coordination.ts`, `dependencies.ts`, `daily-cto.ts`, `github.ts`, `github-publication.ts`, `TicketJob`, `prompts/conversations.ts`, `jira-publication.ts`, `delivery-binding.ts`, `publish-pr.ts`, `jira-time.ts`, `run-retrospective.ts`, `office-lessons.ts`, `refresh-conflicted.ts`, `weekly-rollup.ts`, `coordination-tick.ts`, `workKey`, `session-bridge.ts`, `scheduled-work.ts`, `features.ts`, `github-context.ts`, `retrospective-subject.ts`, `ServiceHealthPanel.tsx`, `Offices`, `github-readiness.ts`, `GitHubDelivery`, `delivery-recoveries.ts`, `http/commands.ts`, `knowledge-context.ts`, `ProjectProgress`, `store.ts`, `BrainFollowup`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Why does `GitHubDelivery` connect `GitHubDelivery` to `source-amendment.ts`, `cec/workflow.ts`, `artifact`, `Engine`, `requests.ts`, `run-ci-repair.ts`, `activation-recovery.ts`, `accept-stage-result.ts`, `digest`, `discovery-recovery.ts`, `assignment-poll.ts`, `github-delivery.ts`, `Coordinator`, `dependencies.ts`, `github-check-selection.ts`, `StageResult`, `TicketJob`, `delivery-binding.ts`, `publish-pr.ts`, `refresh-conflicted.ts`, `workKey`, `github-readiness.ts`, `delivery-recoveries.ts`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Why does `command()` connect `command` to `cec/workflow.ts`, `.save`, `Engine`, `agents.ts`, `dependency-bots/adopt.ts`, `requests.ts`, `run-ci-repair.ts`, `Store`, `engine.ts`, `remove-candidate.ts`, `azure.ts`, `assignment-poll.ts`, `github-delivery.ts`, `Coordinator`, `features/workflow.ts`, `coordination.ts`, `dependencies.ts`, `github.ts`, `github-publication.ts`, `TicketJob`, `service-health.ts`, `jira-publication.ts`, `publish-pr.ts`, `jira-time.ts`, `workKey`, `session-bridge.ts`, `features.ts`, `github-context.ts`, `command-registry.ts`, `github-readiness.ts`, `GitHubDelivery`, `ProjectProgress`, `BrainFollowup`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **What connects `Identity`, `Text`, `Hash` to the rest of the system?**
  _271 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `OfficeScene.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.062004662004662 - nodes in this community are weakly interconnected._
- **Should `source-amendment.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06594594594594595 - nodes in this community are weakly interconnected._
- **Should `command` be split into smaller, more focused modules?**
  _Cohesion score 0.12903225806451613 - nodes in this community are weakly interconnected._