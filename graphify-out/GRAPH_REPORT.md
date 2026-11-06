# Graph Report - office-throughput  (2026-11-06)

## Corpus Check
- 388 files · ~195,881 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2325 nodes · 9917 edges · 89 communities (85 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 48 edges (avg confidence: 0.74)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `51131b03`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- OfficeScene.tsx
- source-amendment.ts
- store.ts
- index.tsx
- cec/workflow.ts
- .save
- artifact
- tracking-issue.ts
- Inspector.tsx
- agents.ts
- github-publication.ts
- closeout-recovery.ts
- TicketJob
- shared.ts
- activation-recovery.ts
- saved-prerequisite-handoff.ts
- index.ts
- conversations/conversations.ts
- retrospective-triggers.ts
- .emit
- LessonsPanel.tsx
- engine.ts
- digest
- remove-candidate.ts
- discovery-recovery.ts
- cx
- azure.ts
- assignment-poll.ts
- accept-stage-result.ts
- it-specialist.ts
- Coordinator
- scheduler.ts
- dependency-bots/adopt.ts
- conversations/slack.ts
- features.ts
- coordination.ts
- dependencies.ts
- github-check-selection.ts
- ControlStore
- OfficeSnapshot
- StageResult
- github.ts
- fact-bounds.ts
- daily-cto.ts
- github-delivery.ts
- service-health.ts
- Ticket
- knowledge.ts
- retrospective-facts.ts
- TimeBook.tsx
- JiraFeaturePublisher
- publish-pr.ts
- scheduled-work.ts
- run-retrospective.ts
- jira-time.ts
- preferences-store.ts
- observe-prs.ts
- weekly-rollup.ts
- coordination-tick.ts
- implementation-recovery.ts
- session-bridge.ts
- source-amendment-scope.ts
- dependency-edges.ts
- maintenance.ts
- DailyCTO.tsx
- retrospective-subject.ts
- continuation-evidence.ts
- config.ts
- command-registry.ts
- closeout-supervision-proof.ts
- Offices
- requests.ts
- work.ts
- useOfficePreferences.ts
- http/commands.ts
- knowledge-context.ts
- helper-evidence.py
- install-service.mjs
- Store
- validate-stage.ts
- OfficeConfigView.tsx
- github-context.ts
- delivery-task.ts
- maintenance-triggers.ts
- JiraWorklogs
- time-classification.ts
- needsDecision
- ProjectProgress

## God Nodes (most connected - your core abstractions)
1. `Store` - 218 edges
2. `TicketJob` - 114 edges
3. `GitHubDelivery` - 112 edges
4. `command()` - 86 edges
5. `artifact()` - 85 edges
6. `digest()` - 82 edges
7. `workKey()` - 69 edges
8. `StageResult` - 63 edges
9. `cx()` - 63 edges
10. `OfficeSnapshot` - 56 edges

## Surprising Connections (you probably didn't know these)
- `projectOutbox()` --calls--> `deferredPickup()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/pickup-state.ts
- `projectOutbox()` --calls--> `parkedProviderWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts
- `projectOutbox()` --calls--> `readinessNeedsFollowup()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts
- `projectOutbox()` --calls--> `readinessWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts
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

## Communities (89 total, 4 thin omitted)

### Community 0 - "OfficeScene.tsx"
Cohesion: 0.06
Nodes (52): itAgent(), itDiagnostics(), Avatar(), AzureWall(), Chair(), Coworker(), CTORoom(), Desk() (+44 more)

### Community 1 - "source-amendment.ts"
Cohesion: 0.09
Nodes (50): adoptCandidate(), reported, Scope, amendmentInstruction(), amendmentIssueSha256(), authorizeSourceAmendment(), Binding, assert() (+42 more)

### Community 2 - "store.ts"
Cohesion: 0.11
Nodes (20): Clock, EASTERN, easternDayFormatter, easternPartsFormatter, systemClock, DATA, applyConnectionSettings(), closeConnection() (+12 more)

### Community 3 - "index.tsx"
Cohesion: 0.08
Nodes (45): Conversation(), recommendedReply(), currentServices(), ServiceHealthPanel(), labels, ServiceHealthRow(), HealthReport, slackMessageUrl() (+37 more)

### Community 4 - "cec/workflow.ts"
Cohesion: 0.14
Nodes (32): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), run(), advance(), nextStage(), publicationEvidenceGap(), qaEvidenceGap() (+24 more)

### Community 5 - ".save"
Cohesion: 0.13
Nodes (31): unpack(), BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue(), readIssues() (+23 more)

### Community 6 - "artifact"
Cohesion: 0.10
Nodes (43): advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat(), candidateInput(), children, oldAdoptionBasis() (+35 more)

### Community 7 - "tracking-issue.ts"
Cohesion: 0.22
Nodes (21): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard, projectCards() (+13 more)

### Community 8 - "Inspector.tsx"
Cohesion: 0.05
Nodes (53): SendMessage, blank(), goalInput, Goals(), CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants (+45 more)

### Community 9 - "agents.ts"
Cohesion: 0.09
Nodes (30): cecPrompt(), resolvedDecisionNote(), stageInstructions, HANDS_OFF_RESOLUTION_GUIDANCE, RESOLUTION_GUIDANCE, APPROACH_GUIDANCE, reviewInstructions(), knowledgeChatPrompt() (+22 more)

### Community 10 - "github-publication.ts"
Cohesion: 0.14
Nodes (17): Assign, Board, Content, GitHubFeaturePublisher, number(), same(), Content, jiraText() (+9 more)

### Community 11 - "closeout-recovery.ts"
Cohesion: 0.12
Nodes (42): assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint(), closeoutProviderEvidence() (+34 more)

### Community 12 - "TicketJob"
Cohesion: 0.11
Nodes (16): StageContext, GitHubDelivery, StagePromptInput, providerFacts(), ciCheckout(), verifyCIHooks(), CIFailure, guardCIRepair() (+8 more)

### Community 13 - "shared.ts"
Cohesion: 0.11
Nodes (23): ConfirmedSegment, ObservationGap, SnapshotOrdering, TimeLedgerState, ReconciliationRequest, WorkFailure, Activity, DailyCheckpoint (+15 more)

### Community 14 - "activation-recovery.ts"
Cohesion: 0.24
Nodes (22): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+14 more)

### Community 15 - "saved-prerequisite-handoff.ts"
Cohesion: 0.33
Nodes (13): PrerequisitesSchema, continuationWorktree(), dependencyVersion(), handoffSavedPrerequisites(), hasSavedPrerequisiteResult(), Ownership, qualified(), readDependencies() (+5 more)

### Community 16 - "index.ts"
Cohesion: 0.12
Nodes (29): close(), config, itSpecialist, loadedRevision, offices, releaseLock, server, serviceHealth (+21 more)

### Community 17 - "conversations/conversations.ts"
Cohesion: 0.12
Nodes (24): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, ReplySchema, pumpCTO(), queueCTOHandoff(), saveGoals() (+16 more)

### Community 18 - "retrospective-triggers.ts"
Cohesion: 0.20
Nodes (19): clip(), JobLike, recordCIBudget(), recordParked(), recordRepairBudget(), recordTechnicalBudget(), recordTicketParked(), recordTrigger() (+11 more)

### Community 19 - ".emit"
Cohesion: 0.17
Nodes (8): featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), recoverFeatures(), observeHelperGroups(), stopHelperGroups(), FeatureReviewRunner, reconcileNativeDelivery()

### Community 20 - "LessonsPanel.tsx"
Cohesion: 0.17
Nodes (24): LessonsPanel(), when(), SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS (+16 more)

### Community 21 - "engine.ts"
Cohesion: 0.13
Nodes (29): checkMail(), drainMail(), requestMail(), dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), resume() (+21 more)

### Community 22 - "digest"
Cohesion: 0.16
Nodes (29): Assessment, outsideScanSources(), Ownership, reconcileScopeRepairReadback(), requireThat(), scopeRepairReadbackCandidate(), scopeRepairRequestResolved(), sha (+21 more)

### Community 23 - "remove-candidate.ts"
Cohesion: 0.20
Nodes (15): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+7 more)

### Community 24 - "discovery-recovery.ts"
Cohesion: 0.29
Nodes (10): Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership, rawHash() (+2 more)

### Community 25 - "cx"
Cohesion: 0.12
Nodes (33): Outbox(), themeColor, App(), EvidenceCard(), Inspector(), TicketDetail(), TicketHeading(), cx() (+25 more)

### Community 26 - "azure.ts"
Cohesion: 0.12
Nodes (25): az(), base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs(), azureGoalFacts() (+17 more)

### Community 27 - "assignment-poll.ts"
Cohesion: 0.13
Nodes (20): ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), configureNotices(), Identity, MergeNotifications, mergeText() (+12 more)

### Community 28 - "accept-stage-result.ts"
Cohesion: 0.12
Nodes (44): containedFile(), findingsBlock(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery(), acceptStageResult(), acceptConflictRepair() (+36 more)

### Community 29 - "it-specialist.ts"
Cohesion: 0.29
Nodes (10): conversationReadbackReady(), queueConversationReadback(), ITContext, readBackConversations(), publishITReport(), delays, recoverAttempt(), ITFollowUp (+2 more)

### Community 30 - "Coordinator"
Cohesion: 0.08
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 31 - "scheduler.ts"
Cohesion: 0.18
Nodes (12): fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch(), foreignWork(), WorkSlot (+4 more)

### Community 32 - "dependency-bots/adopt.ts"
Cohesion: 0.24
Nodes (17): adoptDependabot(), closesIssue(), linkedBody(), linkPR(), dependabotPR, openDependabotPulls(), readRepo(), refusal() (+9 more)

### Community 33 - "conversations/slack.ts"
Cohesion: 0.16
Nodes (13): channelNoticeAuthorized(), comparableSlackText(), SlackMessages, SlackRequestSchema, SlackResultSchema, SlackVerificationSchema, goalNoticeAuthorized(), sendGoalNotice() (+5 more)

### Community 34 - "features.ts"
Cohesion: 0.10
Nodes (47): approveFeature(), assertRetainedItems(), commandFeature(), createFeature(), featureById(), mutation(), reviewQuestions(), discoveryPrompt() (+39 more)

### Community 35 - "coordination.ts"
Cohesion: 0.18
Nodes (18): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation(), checkpointWindow(), dueAt() (+10 more)

### Community 36 - "dependencies.ts"
Cohesion: 0.17
Nodes (20): Admission, admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, resumeParked(), compatible(), dependencyCompletionKey() (+12 more)

### Community 37 - "github-check-selection.ts"
Cohesion: 0.21
Nodes (19): checksFailed(), checksPassed(), checksPending(), CurrentChecksWait, currentMergeChecks(), pass(), pending(), requireThat() (+11 more)

### Community 38 - "ControlStore"
Cohesion: 0.19
Nodes (5): DailyCTO, Briefing, saveReviewBriefing(), ControlStore, DailyCTOReport

### Community 39 - "OfficeSnapshot"
Cohesion: 0.12
Nodes (22): FeatureRound, DailyCTOSummary, FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures() (+14 more)

### Community 40 - "StageResult"
Cohesion: 0.38
Nodes (10): harnessCloseout(), PASSING, verifyMergeActions(), runHarnessStage(), harnessStageResult(), receipt(), harnessDraft(), harnessPrepare() (+2 more)

### Community 41 - "github.ts"
Cohesion: 0.33
Nodes (5): GitHubMonitor, githubPRDescription(), GitHubBoard, GitHubPR, GitHubState

### Community 42 - "fact-bounds.ts"
Cohesion: 0.26
Nodes (15): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+7 more)

### Community 43 - "daily-cto.ts"
Cohesion: 0.14
Nodes (16): EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), applyGoalReview(), DailyResultSchema, EvidenceRefSchema, FreshDailyResultSchema, statusAllowed() (+8 more)

### Community 44 - "github-delivery.ts"
Cohesion: 0.14
Nodes (15): BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction(), dependabotReviewGuidance(), discover(), refreshDependencies(), routeExisting() (+7 more)

### Community 45 - "service-health.ts"
Cohesion: 0.18
Nodes (9): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, slackHealth() (+1 more)

### Community 46 - "Ticket"
Cohesion: 0.11
Nodes (20): cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), MessageInput, cecChatPrompt(), ctoChatPrompt(), itChatPrompt() (+12 more)

### Community 47 - "knowledge.ts"
Cohesion: 0.11
Nodes (25): Accepted, acceptRetrospective(), normalizeStatement(), RETROSPECTIVE_HISTORY, Kind, RetrospectiveResult, Stage, SEEDS (+17 more)

### Community 48 - "retrospective-facts.ts"
Cohesion: 0.23
Nodes (11): ARTIFACT_LIMIT, clip(), LEDGER_STEPS, MAINTENANCE_LIMIT, maintenanceFacts(), MaintenancePacketSection, clip(), PACKET_LIMIT (+3 more)

### Community 49 - "TimeBook.tsx"
Cohesion: 0.14
Nodes (24): LiveAnchor, displayAgentTask(), githubStageLabels, withoutElapsed(), LiveAgentTask(), Props, RunningTask(), text() (+16 more)

### Community 50 - "JiraFeaturePublisher"
Cohesion: 0.33
Nodes (4): Assignment, JiraFeaturePublisher, keyOf(), Transition

### Community 51 - "publish-pr.ts"
Cohesion: 0.17
Nodes (20): activeEffectId(), harnessEffect, assertMayMutate(), readBackOrThrow(), retryRead(), park(), developerPRContent(), Execute (+12 more)

### Community 52 - "scheduled-work.ts"
Cohesion: 0.16
Nodes (19): conversationResolved(), deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), deterministicActions (+11 more)

### Community 53 - "run-retrospective.ts"
Cohesion: 0.22
Nodes (15): busyMaintenanceIds(), retrospectivePrompt(), SUBJECT, RetrospectiveResultSchema, terminalCandidates(), triggerJobId(), KnowledgeRunner, KnowledgeRunOptions (+7 more)

### Community 54 - "jira-time.ts"
Cohesion: 0.27
Nodes (13): dailyReviewDate(), reviewWeekday(), easternDay(), easternInstant(), data(), localId(), locks, matches() (+5 more)

### Community 55 - "preferences-store.ts"
Cohesion: 0.19
Nodes (10): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS (+2 more)

### Community 56 - "observe-prs.ts"
Cohesion: 0.27
Nodes (11): observe(), completedPRReviews(), eligible(), mergedByOwner(), ownerSettles(), retireExternalDeliveries(), retireInactiveDeliveries(), retireUnstartedDelivery() (+3 more)

### Community 57 - "weekly-rollup.ts"
Cohesion: 0.23
Nodes (15): RollupResult, RollupResultSchema, harperFolder(), retryDelay(), ineffectiveLessons(), lastFriday(), ROLLUP_HISTORY, rollupDue() (+7 more)

### Community 58 - "coordination-tick.ts"
Cohesion: 0.13
Nodes (18): reconcileNoticeConfirmations(), BrainStatusSchema, identity, brainCheckpointCompletion(), coverageSchema, followupSchema, verified, reconcileCompletedCheckpoints() (+10 more)

### Community 59 - "implementation-recovery.ts"
Cohesion: 0.12
Nodes (34): continuationScope(), continuationGuard(), brainImplementationCandidate(), BrainReadback, digest(), implementationRecoveryCandidate(), Ownership, Readback (+26 more)

### Community 60 - "session-bridge.ts"
Cohesion: 0.23
Nodes (9): claudeSessions(), codexSessions(), desktopSessions(), guardianReview(), LiveSession, loadedCodexSession(), openRollouts(), SessionBridge (+1 more)

### Community 61 - "source-amendment-scope.ts"
Cohesion: 0.26
Nodes (15): approvedText(), assert(), assert(), boundProfiles, canonical(), Document, ReadSourceFile, releaseAmendmentJournal() (+7 more)

### Community 62 - "dependency-edges.ts"
Cohesion: 1.00
Nodes (3): assertFeatureDependencyOrder(), featureDependencyEdges(), key()

### Community 63 - "maintenance.ts"
Cohesion: 0.12
Nodes (24): maintenancePolicies(), BrainMaintenance, BrainResult, checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), easternDate(), GitHubMaintenance (+16 more)

### Community 64 - "DailyCTO.tsx"
Cohesion: 0.19
Nodes (11): CTOReview(), goalState, DailyCTO(), GoalHistory(), reportDate(), reviewStatus, GoalList(), reviewExcerpt() (+3 more)

### Community 65 - "retrospective-subject.ts"
Cohesion: 0.18
Nodes (16): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+8 more)

### Community 66 - "continuation-evidence.ts"
Cohesion: 0.34
Nodes (12): allowed, assertContinuationWorker(), continuationNativeReview(), continuationReviewArtifacts(), negativeWorker(), reconcileContinuationReview(), savedNegativeContinuationReview(), ContinuationDecision (+4 more)

### Community 67 - "config.ts"
Cohesion: 0.10
Nodes (22): args, [cmd,...rawArgs], commands, key, projectIndex, seedProjectLessons(), GoalInput, DELIVERY_CONCURRENCY (+14 more)

### Community 68 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 69 - "closeout-supervision-proof.ts"
Cohesion: 0.26
Nodes (11): CloseoutSupervisionProofRef, Envelope, hash, head, identity, instant(), known, pid (+3 more)

### Community 71 - "requests.ts"
Cohesion: 0.11
Nodes (44): savedActivationFailure(), recoveredFindingsResolved(), savedCandidateAdmission, assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts() (+36 more)

### Community 72 - "work.ts"
Cohesion: 0.16
Nodes (12): ProjectReadiness, AssignmentResult, CompletionCondition, Continuation, DependencyObservation, EligibilityState, FailureCategory, ReconciliationAction (+4 more)

### Community 73 - "useOfficePreferences.ts"
Cohesion: 0.26
Nodes (10): acceptPreferences(), PreferenceCandidate, strip(), UNKNOWN_PREFERENCES, OfficePreferencesController, PreferenceFeedback, PreferenceField, requestPreferences() (+2 more)

### Community 74 - "http/commands.ts"
Cohesion: 0.20
Nodes (16): configureKnowledge(), declineLessonIssue(), reactivateLesson(), retireLesson(), decideOfficeProposal(), mirrorOfficeKnowledge(), now(), OfficeKnowledgeStore (+8 more)

### Community 75 - "knowledge-context.ts"
Cohesion: 0.24
Nodes (10): Bucket, knowledgeContext(), LESSON_LIMIT, lessonPurpose(), MAINTENANCE, MAX_LESSONS, PURPOSES, render() (+2 more)

### Community 78 - "install-service.mjs"
Cohesion: 0.33
Nodes (5): file, folder, logs, root, xml()

### Community 79 - "Store"
Cohesion: 0.05
Nodes (19): AzureMonitor, correlatedBuild(), JiraOperations, plain(), Assessment, Engine, observe(), observeParked() (+11 more)

### Community 80 - "validate-stage.ts"
Cohesion: 0.16
Nodes (17): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+9 more)

### Community 81 - "OfficeConfigView.tsx"
Cohesion: 0.48
Nodes (5): loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView(), OfficeConfigSummary

### Community 82 - "github-context.ts"
Cohesion: 0.21
Nodes (10): uncertainConversations(), projectOutbox(), canFileGithubIssue(), GITHUB_ISSUE_SKILL, githubFollowupPrompt(), knowledgeOutbox(), goalNoticeNeverDispatched(), Result (+2 more)

### Community 83 - "delivery-task.ts"
Cohesion: 0.31
Nodes (7): deliveryTask(), DeliveryTaskInput, DISCOVERY_GUIDANCE, compactSteps(), AMENDMENT_REVIEW_PROOF, featureDeliveryContext(), deliveryResearchContext()

### Community 84 - "maintenance-triggers.ts"
Cohesion: 0.36
Nodes (9): clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates(), maintenanceCompletedId(), maintenanceKey(), visibleMaintenanceTriggerIds(), TerminalCandidate (+1 more)

### Community 86 - "time-classification.ts"
Cohesion: 0.73
Nodes (5): artifact(), correctRecoveryClassification(), digest(), timeClassificationDigest(), TimeClassificationInput

### Community 87 - "needsDecision"
Cohesion: 0.70
Nodes (3): parksInJira(), DECISION_KINDS, needsDecision()

## Knowledge Gaps
- **281 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+276 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `source-amendment.ts`, `store.ts`, `cec/workflow.ts`, `.save`, `artifact`, `tracking-issue.ts`, `agents.ts`, `github-publication.ts`, `closeout-recovery.ts`, `TicketJob`, `activation-recovery.ts`, `saved-prerequisite-handoff.ts`, `conversations/conversations.ts`, `retrospective-triggers.ts`, `.emit`, `engine.ts`, `digest`, `remove-candidate.ts`, `discovery-recovery.ts`, `azure.ts`, `assignment-poll.ts`, `accept-stage-result.ts`, `it-specialist.ts`, `scheduler.ts`, `dependency-bots/adopt.ts`, `conversations/slack.ts`, `features.ts`, `coordination.ts`, `dependencies.ts`, `OfficeSnapshot`, `github.ts`, `daily-cto.ts`, `github-delivery.ts`, `Ticket`, `knowledge.ts`, `retrospective-facts.ts`, `publish-pr.ts`, `scheduled-work.ts`, `run-retrospective.ts`, `jira-time.ts`, `observe-prs.ts`, `weekly-rollup.ts`, `coordination-tick.ts`, `implementation-recovery.ts`, `session-bridge.ts`, `dependency-edges.ts`, `maintenance.ts`, `retrospective-subject.ts`, `continuation-evidence.ts`, `config.ts`, `closeout-supervision-proof.ts`, `Offices`, `requests.ts`, `http/commands.ts`, `knowledge-context.ts`, `validate-stage.ts`, `github-context.ts`, `delivery-task.ts`, `time-classification.ts`?**
  _High betweenness centrality (0.111) - this node is a cross-community bridge._
- **Why does `GitHubDelivery` connect `TicketJob` to `source-amendment.ts`, `artifact`, `closeout-recovery.ts`, `activation-recovery.ts`, `saved-prerequisite-handoff.ts`, `.emit`, `digest`, `discovery-recovery.ts`, `assignment-poll.ts`, `accept-stage-result.ts`, `Coordinator`, `dependencies.ts`, `github-check-selection.ts`, `StageResult`, `github-delivery.ts`, `publish-pr.ts`, `observe-prs.ts`, `implementation-recovery.ts`, `continuation-evidence.ts`, `requests.ts`, `Store`, `validate-stage.ts`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `command()` connect `Store` to `cec/workflow.ts`, `.save`, `tracking-issue.ts`, `agents.ts`, `github-publication.ts`, `closeout-recovery.ts`, `TicketJob`, `engine.ts`, `remove-candidate.ts`, `azure.ts`, `assignment-poll.ts`, `accept-stage-result.ts`, `conversations/slack.ts`, `features.ts`, `coordination.ts`, `dependencies.ts`, `github.ts`, `github-delivery.ts`, `service-health.ts`, `publish-pr.ts`, `scheduled-work.ts`, `jira-time.ts`, `implementation-recovery.ts`, `session-bridge.ts`, `maintenance.ts`, `command-registry.ts`, `requests.ts`, `validate-stage.ts`, `github-context.ts`, `JiraWorklogs`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `command()` (e.g. with `.constructor()` and `executeRequest()`) actually correct?**
  _`command()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _281 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `OfficeScene.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06144393241167435 - nodes in this community are weakly interconnected._
- **Should `source-amendment.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08874912648497554 - nodes in this community are weakly interconnected._