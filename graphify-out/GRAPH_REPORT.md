# Graph Report - persona-context  (2026-11-06)

## Corpus Check
- 397 files · ~197,980 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2369 nodes · 10105 edges · 86 communities (84 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 51 edges (avg confidence: 0.74)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bbb3f108`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- dependency-bots/adopt.ts
- engine.ts
- shared.ts
- Inspector.tsx
- source-amendment.ts
- OfficeScene.tsx
- requests.ts
- SettingsPanel.tsx
- Store
- workKey
- features.ts
- closeout-recovery.ts
- App.tsx
- accept-stage-result.ts
- artifact
- agents.ts
- StageResult
- .transaction
- .save
- sanitize
- OfficeSnapshot
- github-delivery.ts
- executeRequest
- control-store.ts
- maintenance.ts
- work-summary.ts
- weekly-rollup.ts
- TicketJob
- activation-recovery.ts
- notifications.ts
- scope.ts
- github-check-selection.ts
- knowledge.ts
- worker-runtime.ts
- daily-cto.ts
- Role
- scheduled-work.ts
- Ticket
- .emit
- FeatureWorkspace.tsx
- validate-stage.ts
- .getEffect
- retrospective-triggers.ts
- cto-conversations.ts
- retrospective-facts.ts
- coordination.ts
- remove-candidate.ts
- assignment-poll.ts
- service-health.ts
- retrospective-subject.ts
- dependencies.ts
- run-ci-repair.ts
- offices.ts
- migrations.ts
- api-routes.ts
- it-specialist.ts
- fact-bounds.ts
- delivery-task.ts
- interrupted-work-recovery.ts
- DailyCTO.tsx
- useLiveTiming.ts
- Conversations
- saved-prerequisite-handoff.ts
- continuation-evidence.ts
- index.ts
- coordination-tick.ts
- closeout-supervision-proof.ts
- session-bridge.ts
- goal-reporting.ts
- discovery-recovery.ts
- http/context.ts
- knowledge-context.ts
- checkpoint-completion.ts
- jira-time.ts
- time-classification.ts
- office-lessons.ts
- Offices
- github.ts
- command-registry.ts
- cli.ts
- recovery-ledger.ts
- OfficeConfigView.tsx
- liveReach
- dependency-edges.ts
- helper-evidence.py

## God Nodes (most connected - your core abstractions)
1. `Store` - 218 edges
2. `TicketJob` - 114 edges
3. `GitHubDelivery` - 112 edges
4. `command()` - 86 edges
5. `artifact()` - 85 edges
6. `digest()` - 82 edges
7. `workKey()` - 69 edges
8. `cx()` - 69 edges
9. `StageResult` - 63 edges
10. `OfficeSnapshot` - 61 edges

## Surprising Connections (you probably didn't know these)
- `DeliverySlot` --references--> `Role`  [EXTRACTED]
  server/office/projects.ts → src/shared.ts
- `projectOutbox()` --calls--> `parkedProviderWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts
- `projectOutbox()` --calls--> `readinessWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts
- `pump()` --calls--> `deferredPickup()`  [EXTRACTED]
  server/conversations/team-conversation-pump.ts → src/work/pickup-state.ts
- `IntakeContext` --references--> `Coordination`  [EXTRACTED]
  server/delivery/intake/admission.ts → src/shared.ts

## Import Cycles
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/recovery/retire-external-delivery.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/conversations/slack.ts -> server/workers/agents.ts -> server/workers/worker-runtime.ts -> server/conversations/slack.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-guard.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/preparation/post-conflict-preparation.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/implementation/activation-recovery.ts -> server/delivery/recovery/validation/validation-provider-context.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/implementation/continuation-guard.ts -> server/delivery/recovery/validation/validation-provider-context.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/implementation/saved-prerequisite-handoff.ts -> server/delivery/recovery/validation/validation-provider-context.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/preparation/post-conflict-preparation.ts -> server/delivery/recovery/validation/validation-provider-context.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/scope-repair/scope-repair-resume.ts -> server/delivery/recovery/validation/validation-provider-context.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/stage-prompts.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/preparation/post-conflict-preparation.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/queue-repairs.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-preparation.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/scheduling/coordination-tick.ts -> server/scheduling/requests.ts -> server/scheduling/coordination.ts -> server/scheduling/coordination-tick.ts`
- 3-file cycle: `server/conversations/conversation-recovery.ts -> server/conversations/conversations.ts -> server/conversations/team-conversation-pump.ts -> server/conversations/conversation-recovery.ts`
- 3-file cycle: `server/conversations/conversations.ts -> server/scheduling/engine.ts -> server/workers/agents.ts -> server/conversations/conversations.ts`

## Communities (86 total, 2 thin omitted)

### Community 0 - "dependency-bots/adopt.ts"
Cohesion: 0.06
Nodes (57): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard, projectCards() (+49 more)

### Community 1 - "engine.ts"
Cohesion: 0.05
Nodes (66): correlatedBuild(), checkMail(), drainMail(), requestMail(), parksInJira(), dispatchNightly(), drainDelivery(), enableNightly() (+58 more)

### Community 2 - "shared.ts"
Cohesion: 0.05
Nodes (75): ProjectReadiness, DailyCTOSummary, Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+67 more)

### Community 3 - "Inspector.tsx"
Cohesion: 0.07
Nodes (63): Outbox(), SendMessage, ServiceHealthPanel(), labels, ServiceHealthRow(), LessonsPanel(), when(), EvidenceCard() (+55 more)

### Community 4 - "source-amendment.ts"
Cohesion: 0.06
Nodes (71): adoptCandidate(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat() (+63 more)

### Community 5 - "OfficeScene.tsx"
Cohesion: 0.06
Nodes (59): itAgent(), itDiagnostics(), displayAgentTask(), githubStageLabels, withoutElapsed(), LiveAgentTask(), Props, RunningTask() (+51 more)

### Community 6 - "requests.ts"
Cohesion: 0.10
Nodes (48): savedActivationFailure(), assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), reconcileCompletedConflictDraft(), routeReadyPostConflictPublication() (+40 more)

### Community 7 - "SettingsPanel.tsx"
Cohesion: 0.09
Nodes (39): fields, PreferencesPatch, StoredBody, SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm() (+31 more)

### Community 8 - "Store"
Cohesion: 0.09
Nodes (14): JiraOperations, plain(), Content, Result, EffectOperation, Effects, EffectUncertainError, initializeStoreSchema() (+6 more)

### Community 9 - "workKey"
Cohesion: 0.11
Nodes (39): continuationScope(), continuationGuard(), brainImplementationCandidate(), BrainReadback, digest(), implementationRecoveryCandidate(), Ownership, Readback (+31 more)

### Community 10 - "features.ts"
Cohesion: 0.10
Nodes (34): featureItemComplete(), reconcileFeatureCompletion(), artifactPath(), digest(), document(), featureRoot(), currentApproval(), helperTelemetry() (+26 more)

### Community 11 - "closeout-recovery.ts"
Cohesion: 0.12
Nodes (42): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+34 more)

### Community 12 - "App.tsx"
Cohesion: 0.07
Nodes (39): blank(), goalInput, Goals(), CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants, ElevatorPhase (+31 more)

### Community 13 - "accept-stage-result.ts"
Cohesion: 0.14
Nodes (39): containedFile(), acceptStageResult(), recordJobApproach(), finishLeadReview(), mergeAuthorized(), discoveryReviewSatisfied(), savedPrerequisiteFindingsResolved(), reconcilePublishedDraftConflict() (+31 more)

### Community 14 - "artifact"
Cohesion: 0.16
Nodes (32): continuationWorkerProof(), candidateInput(), children, oldAdoptionBasis(), savedCandidateAdmission, nativeCompletion(), preparationNativeAssessment(), acceptedNativeGate() (+24 more)

### Community 15 - "agents.ts"
Cohesion: 0.14
Nodes (26): cecIntakePrompt(), ConversationResultSchema, ReplySchema, cecChatPrompt(), ctoChatPrompt(), HANDS_OFF_RESOLUTION_GUIDANCE, RESOLUTION_GUIDANCE, PICKUP_CHAT (+18 more)

### Community 16 - "StageResult"
Cohesion: 0.14
Nodes (28): harnessCloseout(), PASSING, verifyMergeActions(), activeEffectId(), harnessEffect, assertMayMutate(), retryRead(), runHarnessStage() (+20 more)

### Community 17 - ".transaction"
Cohesion: 0.16
Nodes (26): approveFeature(), assertRetainedItems(), commandFeature(), createFeature(), featureById(), mutation(), reviewQuestions(), discoveryPrompt() (+18 more)

### Community 18 - ".save"
Cohesion: 0.14
Nodes (30): file, folder, logs, root, xml(), unpack(), BLOCKED, Execute (+22 more)

### Community 19 - "sanitize"
Cohesion: 0.11
Nodes (29): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+21 more)

### Community 20 - "OfficeSnapshot"
Cohesion: 0.13
Nodes (22): conversationResolved(), projectOutbox(), syncOutbox(), knowledgeOutbox(), checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), repeatedVendorReviewBlock() (+14 more)

### Community 21 - "github-delivery.ts"
Cohesion: 0.14
Nodes (25): findingsBlock(), handsOff(), BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction(), discover(), refreshDependencies() (+17 more)

### Community 22 - "executeRequest"
Cohesion: 0.07
Nodes (3): coordination(), Coordinator, executeRequest()

### Community 23 - "control-store.ts"
Cohesion: 0.12
Nodes (11): Briefing, saveReviewBriefing(), Clock, applyConnectionSettings(), closeConnection(), optimizeOnOpen(), ControlStore, CTOConfiguration (+3 more)

### Community 24 - "maintenance.ts"
Cohesion: 0.15
Nodes (19): ApproachSchema, GITHUB_ISSUE_SKILL, maintenancePolicies(), BrainMaintenance, BrainResult, easternDate(), GitHubMaintenance, MaintenanceSchema (+11 more)

### Community 25 - "work-summary.ts"
Cohesion: 0.16
Nodes (23): themeColor, App(), usePanelFocus(), envelopeCard, deliveryRepairProjection(), DependencyNotice(), card, InboxQueue() (+15 more)

### Community 26 - "weekly-rollup.ts"
Cohesion: 0.14
Nodes (25): busyMaintenanceIds(), RollupResult, RollupResultSchema, terminalCandidates(), triggerJobId(), harperFolder(), KnowledgeRunner, KnowledgeRunOptions (+17 more)

### Community 27 - "TicketJob"
Cohesion: 0.13
Nodes (10): dependabotReviewGuidance(), StageContext, GitHubDelivery, stagePrompt(), StagePromptInput, ROLES, stageRole(), implementationContinuationInstruction() (+2 more)

### Community 28 - "activation-recovery.ts"
Cohesion: 0.19
Nodes (25): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+17 more)

### Community 29 - "notifications.ts"
Cohesion: 0.17
Nodes (13): channelNoticeAuthorized(), notices(), queueChannelNotice(), Identity, MergeNotifications, reconcileNoticeConfirmations(), comparableSlackText(), SlackMessages (+5 more)

### Community 30 - "scope.ts"
Cohesion: 0.16
Nodes (20): HANDS_OFF_PROJECTS, harnessDelivers(), legacyRecovery(), observe(), merge(), verifyPR(), teamReviewedHead(), completedPRReviews() (+12 more)

### Community 31 - "github-check-selection.ts"
Cohesion: 0.21
Nodes (19): checksFailed(), checksPassed(), checksPending(), CurrentChecksWait, currentMergeChecks(), pass(), pending(), requireThat() (+11 more)

### Community 32 - "knowledge.ts"
Cohesion: 0.12
Nodes (22): retrospectivePrompt(), SUBJECT, Kind, RetrospectiveResultSchema, Stage, SEEDS, KnowledgeRetry, KnowledgeState (+14 more)

### Community 33 - "worker-runtime.ts"
Cohesion: 0.14
Nodes (16): SlackResultSchema, SlackVerificationSchema, ROOT, contextPacket(), labels, toolActivity(), workerActivity(), claudeArguments() (+8 more)

### Community 34 - "daily-cto.ts"
Cohesion: 0.16
Nodes (16): DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), dailyReviewDate(), reviewWeekday(), queueGoalEvidenceRequest(), DailyResultSchema (+8 more)

### Community 35 - "Role"
Cohesion: 0.18
Nodes (13): officeCapacity, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch(), foreignWork() (+5 more)

### Community 36 - "scheduled-work.ts"
Cohesion: 0.15
Nodes (19): deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), deterministicActions, eligible() (+11 more)

### Community 37 - "Ticket"
Cohesion: 0.16
Nodes (9): cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), slackSendPrompt(), slackVerifyPrompt(), Agents, WorkerRuntime, Stage (+1 more)

### Community 38 - ".emit"
Cohesion: 0.18
Nodes (16): ChannelSettings, configureChannelNotices(), configureNotices(), NoticeSettings, retryRecipientLookup(), declineLessonIssue(), reactivateLesson(), retireLesson() (+8 more)

### Community 39 - "FeatureWorkspace.tsx"
Cohesion: 0.17
Nodes (16): FeatureRound, FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures(), draftKey() (+8 more)

### Community 40 - "validate-stage.ts"
Cohesion: 0.16
Nodes (17): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+9 more)

### Community 41 - ".getEffect"
Cohesion: 0.23
Nodes (8): GitHubOperations, fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), Assessment, closeNativeRefresh(), fingerprint(), EffectIntent

### Community 42 - "retrospective-triggers.ts"
Cohesion: 0.20
Nodes (19): configureKnowledge(), clip(), JobLike, recordCIBudget(), recordParked(), recordRepairBudget(), recordTicketParked(), recordTrigger() (+11 more)

### Community 43 - "cto-conversations.ts"
Cohesion: 0.14
Nodes (17): GoalChangeSchema, pumpCTO(), queueCTOHandoff(), saveGoals(), applyGoalReview(), EvidenceRefSchema, FreshDailyResultSchema, statusAllowed() (+9 more)

### Community 44 - "retrospective-facts.ts"
Cohesion: 0.15
Nodes (17): Accepted, acceptRetrospective(), normalizeStatement(), RETROSPECTIVE_HISTORY, ARTIFACT_LIMIT, clip(), LEDGER_STEPS, MAINTENANCE_LIMIT (+9 more)

### Community 45 - "coordination.ts"
Cohesion: 0.18
Nodes (18): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation(), checkpointWindow(), dueAt() (+10 more)

### Community 46 - "remove-candidate.ts"
Cohesion: 0.21
Nodes (15): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+7 more)

### Community 47 - "assignment-poll.ts"
Cohesion: 0.19
Nodes (12): mergeText(), noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), retryCandidateCleanup(), admitReadyCards(), WAIT_STATUSES, pinCourier (+4 more)

### Community 48 - "service-health.ts"
Cohesion: 0.18
Nodes (9): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, slackHealth() (+1 more)

### Community 49 - "retrospective-subject.ts"
Cohesion: 0.19
Nodes (15): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+7 more)

### Community 50 - "dependencies.ts"
Cohesion: 0.30
Nodes (14): Admission, admit(), IntakeContext, compatible(), dependencyCompletionKey(), dependencyEligibility(), DependencyStores, issueKey() (+6 more)

### Community 51 - "run-ci-repair.ts"
Cohesion: 0.30
Nodes (11): ciCheckout(), verifyCIHooks(), CIFailure, guardCIRepair(), prepareCIMetadataRepair(), publishCIRepair(), rewordCommits(), CIPlanSchema (+3 more)

### Community 52 - "offices.ts"
Cohesion: 0.16
Nodes (13): itChatPrompt(), diagnosticContext(), diagnosticSnapshot(), DELIVERY_CONCURRENCY, LOCAL_BINDINGS, file, project, root (+5 more)

### Community 53 - "migrations.ts"
Cohesion: 0.19
Nodes (14): clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates(), maintenanceCompletedId(), maintenanceKey(), visibleMaintenanceTriggerIds(), TerminalCandidate (+6 more)

### Community 54 - "api-routes.ts"
Cohesion: 0.22
Nodes (12): goalHistory(), saveGoal(), apiRoute(), RequestContext, preferencesRoute(), PreferencesRouteContext, fileResponse(), json() (+4 more)

### Community 55 - "it-specialist.ts"
Cohesion: 0.27
Nodes (11): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), ITContext, readBackConversations(), publishITReport(), delays, recoverAttempt() (+3 more)

### Community 56 - "fact-bounds.ts"
Cohesion: 0.26
Nodes (15): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+7 more)

### Community 57 - "delivery-task.ts"
Cohesion: 0.20
Nodes (12): cecPrompt(), resolvedDecisionNote(), stageInstructions, APPROACH_GUIDANCE, reviewInstructions(), deliveryTask(), DeliveryTaskInput, DISCOVERY_GUIDANCE (+4 more)

### Community 58 - "interrupted-work-recovery.ts"
Cohesion: 0.15
Nodes (8): goalNoticeNeverDispatched(), recover(), checkpointMeasurement(), HEARTBEAT_GAP_MS, HEARTBEAT_MS, startMeasurement(), WorkOutcome, durationLabel()

### Community 59 - "DailyCTO.tsx"
Cohesion: 0.19
Nodes (11): CTOReview(), goalState, DailyCTO(), GoalHistory(), reportDate(), reviewStatus, GoalList(), reviewExcerpt() (+3 more)

### Community 60 - "useLiveTiming.ts"
Cohesion: 0.26
Nodes (12): AzureBuild, lastWall, sample(), subscribe(), subscribers, useLiveClock(), liveBuildTiming(), liveTiming() (+4 more)

### Community 61 - "Conversations"
Cohesion: 0.14
Nodes (3): Conversations, MessageInput, OfficeEntry

### Community 62 - "saved-prerequisite-handoff.ts"
Cohesion: 0.33
Nodes (13): PrerequisitesSchema, continuationWorktree(), dependencyVersion(), handoffSavedPrerequisites(), hasSavedPrerequisiteResult(), Ownership, qualified(), readDependencies() (+5 more)

### Community 63 - "continuation-evidence.ts"
Cohesion: 0.35
Nodes (11): allowed, continuationNativeReview(), continuationReviewArtifacts(), negativeWorker(), reconcileContinuationReview(), savedNegativeContinuationReview(), ContinuationDecision, implementationContinuationDecision() (+3 more)

### Community 64 - "index.ts"
Cohesion: 0.18
Nodes (12): close(), config, itSpecialist, loadedRevision, offices, releaseLock, server, serviceHealth (+4 more)

### Community 65 - "coordination-tick.ts"
Cohesion: 0.25
Nodes (10): legacy, reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION, tick(), incompleteReadOutput(), IntakeResult (+2 more)

### Community 66 - "closeout-supervision-proof.ts"
Cohesion: 0.23
Nodes (12): CloseoutSupervisionProofRef, Envelope, hash, head, identity, instant(), known, pid (+4 more)

### Community 67 - "session-bridge.ts"
Cohesion: 0.23
Nodes (9): claudeSessions(), codexSessions(), desktopSessions(), guardianReview(), LiveSession, loadedCodexSession(), openRollouts(), SessionBridge (+1 more)

### Community 68 - "goal-reporting.ts"
Cohesion: 0.35
Nodes (10): assertConversationReadback(), pump(), savePickup(), acceptedGoalReport(), GOAL_REPORT_GUIDANCE, GoalReport, GoalReportSchema, permitsGoalEvidenceReturn() (+2 more)

### Community 69 - "discovery-recovery.ts"
Cohesion: 0.29
Nodes (10): Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership, rawHash() (+2 more)

### Community 70 - "http/context.ts"
Cohesion: 0.29
Nodes (8): ITSpecialist, ServiceContext, OfficeConfigInputs, officeConfigRoute(), officeConfigSummary(), CECBinding, runtimeRevision(), startServiceTicks()

### Community 71 - "knowledge-context.ts"
Cohesion: 0.21
Nodes (11): Bucket, knowledgeContext(), LESSON_LIMIT, lessonPurpose(), MAINTENANCE, MAX_LESSONS, PURPOSES, render() (+3 more)

### Community 72 - "checkpoint-completion.ts"
Cohesion: 0.24
Nodes (7): BrainStatusSchema, identity, brainCheckpointCompletion(), coverageSchema, followupSchema, verified, reconcileCompletedCheckpoints()

### Community 73 - "jira-time.ts"
Cohesion: 0.33
Nodes (6): data(), JiraWorklogs, localId(), locks, matches(), publishJiraTime()

### Community 74 - "time-classification.ts"
Cohesion: 0.38
Nodes (9): captureTime(), midnight(), timeLedger(), artifact(), correctRecoveryClassification(), digest(), timeClassificationDigest(), TimeClassificationInput (+1 more)

### Community 75 - "office-lessons.ts"
Cohesion: 0.35
Nodes (6): decideOfficeProposal(), now(), OfficeKnowledgeStore, proposeOfficeLessons(), retireOfficeLesson(), OfficeKnowledge

### Community 77 - "github.ts"
Cohesion: 0.33
Nodes (5): GitHubMonitor, githubPRDescription(), GitHubBoard, GitHubPR, GitHubState

### Community 78 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 79 - "cli.ts"
Cohesion: 0.25
Nodes (6): args, [cmd,...rawArgs], commands, key, projectIndex, PORT

### Community 80 - "recovery-ledger.ts"
Cohesion: 0.46
Nodes (6): savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), nativeDeliveryResolved(), reconcileRecoveryLedger()

### Community 81 - "OfficeConfigView.tsx"
Cohesion: 0.48
Nodes (5): loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView(), OfficeConfigSummary

### Community 82 - "liveReach"
Cohesion: 0.60
Nodes (5): GIT_NETWORK, LIVE_PROVIDERS, liveReach(), networkUrl(), remoteUrls()

### Community 83 - "dependency-edges.ts"
Cohesion: 1.00
Nodes (3): assertFeatureDependencyOrder(), featureDependencyEdges(), key()

## Knowledge Gaps
- **284 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+279 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `dependency-bots/adopt.ts`, `engine.ts`, `source-amendment.ts`, `requests.ts`, `workKey`, `features.ts`, `closeout-recovery.ts`, `accept-stage-result.ts`, `artifact`, `agents.ts`, `StageResult`, `.transaction`, `.save`, `sanitize`, `OfficeSnapshot`, `github-delivery.ts`, `control-store.ts`, `maintenance.ts`, `weekly-rollup.ts`, `TicketJob`, `activation-recovery.ts`, `notifications.ts`, `scope.ts`, `worker-runtime.ts`, `Role`, `scheduled-work.ts`, `Ticket`, `.emit`, `validate-stage.ts`, `.getEffect`, `retrospective-triggers.ts`, `cto-conversations.ts`, `retrospective-facts.ts`, `coordination.ts`, `remove-candidate.ts`, `retrospective-subject.ts`, `dependencies.ts`, `offices.ts`, `migrations.ts`, `it-specialist.ts`, `delivery-task.ts`, `interrupted-work-recovery.ts`, `Conversations`, `saved-prerequisite-handoff.ts`, `continuation-evidence.ts`, `coordination-tick.ts`, `closeout-supervision-proof.ts`, `session-bridge.ts`, `goal-reporting.ts`, `discovery-recovery.ts`, `knowledge-context.ts`, `checkpoint-completion.ts`, `jira-time.ts`, `time-classification.ts`, `office-lessons.ts`, `Offices`, `github.ts`, `recovery-ledger.ts`, `dependency-edges.ts`?**
  _High betweenness centrality (0.106) - this node is a cross-community bridge._
- **Why does `GitHubDelivery` connect `TicketJob` to `engine.ts`, `source-amendment.ts`, `requests.ts`, `Store`, `workKey`, `closeout-recovery.ts`, `accept-stage-result.ts`, `artifact`, `StageResult`, `github-delivery.ts`, `executeRequest`, `activation-recovery.ts`, `scope.ts`, `github-check-selection.ts`, `validate-stage.ts`, `assignment-poll.ts`, `dependencies.ts`, `run-ci-repair.ts`, `saved-prerequisite-handoff.ts`, `continuation-evidence.ts`, `discovery-recovery.ts`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `command()` connect `Store` to `dependency-bots/adopt.ts`, `engine.ts`, `requests.ts`, `workKey`, `features.ts`, `closeout-recovery.ts`, `agents.ts`, `StageResult`, `.transaction`, `.save`, `sanitize`, `github-delivery.ts`, `executeRequest`, `maintenance.ts`, `notifications.ts`, `worker-runtime.ts`, `scheduled-work.ts`, `validate-stage.ts`, `.getEffect`, `coordination.ts`, `remove-candidate.ts`, `service-health.ts`, `dependencies.ts`, `session-bridge.ts`, `jira-time.ts`, `time-classification.ts`, `github.ts`, `command-registry.ts`, `liveReach`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `command()` (e.g. with `.constructor()` and `executeRequest()`) actually correct?**
  _`command()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _284 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dependency-bots/adopt.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06404040404040404 - nodes in this community are weakly interconnected._
- **Should `engine.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05196717862402693 - nodes in this community are weakly interconnected._