# Graph Report - people-directory  (2026-11-06)

## Corpus Check
- 396 files · ~197,654 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2366 nodes · 10089 edges · 85 communities (83 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 49 edges (avg confidence: 0.73)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bf90689b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- engine.ts
- Inspector.tsx
- OfficeScene.tsx
- source-amendment.ts
- artifact
- daily-cto.ts
- github-delivery.ts
- accept-stage-result.ts
- .transaction
- store.ts
- closeout-recovery.ts
- PeoplePanel.tsx
- App.tsx
- conversations/conversations.ts
- implementation-recovery.ts
- agents.ts
- Store
- features/workflow.ts
- LessonsPanel.tsx
- scheduler.ts
- GitHubDelivery
- activation-recovery.ts
- shared.ts
- azure.ts
- OfficeSnapshot
- github-publication.ts
- maintenance.ts
- control-store.ts
- .save
- dependencies.ts
- TimeBook.tsx
- conversations/slack.ts
- retrospective-triggers.ts
- weekly-rollup.ts
- jira-time.ts
- assignment-poll.ts
- discovery-recovery.ts
- coordination.ts
- tracking-issue.ts
- .api
- Coordinator
- publish-pr.ts
- work-summary.ts
- github-check-selection.ts
- scheduled-work.ts
- jira-publication.ts
- api-routes.ts
- dependency-bots/adopt.ts
- validate-stage.ts
- digest
- scope-repair-resume.ts
- .emit
- closeout.ts
- service-health.ts
- outbox.ts
- .getEffect
- Goals.tsx
- remove-candidate.ts
- knowledge.ts
- it-specialist.ts
- retrospective-subject.ts
- retrospective-facts.ts
- source-amendment-scope.ts
- office-lessons.ts
- fact-bounds.ts
- preferences-store.ts
- process.ts
- .run
- requests.ts
- index.ts
- continuation-evidence.ts
- offices.ts
- useOfficePreferences.ts
- ProjectProgress
- knowledge-context.ts
- Offices
- github.ts
- maintenance-triggers.ts
- scheduled-retrospectives.ts
- command-registry.ts
- session-bridge.ts
- cli.ts
- retire-external-delivery.ts
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
- `projectOutbox()` --calls--> `deferredPickup()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/pickup-state.ts
- `projectOutbox()` --calls--> `parkedProviderWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts
- `projectOutbox()` --calls--> `readinessWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts
- `pump()` --calls--> `deferredPickup()`  [EXTRACTED]
  server/conversations/team-conversation-pump.ts → src/work/pickup-state.ts
- `IntakeContext` --references--> `Coordination`  [EXTRACTED]
  server/delivery/intake/admission.ts → src/shared.ts

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

## Communities (85 total, 2 thin omitted)

### Community 0 - "engine.ts"
Cohesion: 0.05
Nodes (57): correlatedBuild(), checkMail(), drainMail(), requestMail(), parksInJira(), dispatchNightly(), drainDelivery(), enableNightly() (+49 more)

### Community 1 - "Inspector.tsx"
Cohesion: 0.09
Nodes (56): Outbox(), currentServices(), ServiceHealthPanel(), labels, ServiceHealthRow(), EvidenceCard(), Inspector(), PORTRAIT (+48 more)

### Community 2 - "OfficeScene.tsx"
Cohesion: 0.06
Nodes (54): itAgent(), itDiagnostics(), githubStageLabels, withoutElapsed(), Avatar(), AzureWall(), Chair(), Coworker() (+46 more)

### Community 3 - "source-amendment.ts"
Cohesion: 0.07
Nodes (60): adoptCandidate(), assertScopeRepairResumeFindings(), directionContract(), requireThat(), scopeRepairDirection(), scopeRepairResumeInstruction(), amendmentInstruction(), amendmentIssueSha256() (+52 more)

### Community 4 - "artifact"
Cohesion: 0.11
Nodes (51): assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), reconcileCompletedConflictDraft(), within(), bindPreparationBoardOrigins() (+43 more)

### Community 5 - "daily-cto.ts"
Cohesion: 0.07
Nodes (30): DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), dailyReviewDate(), reviewWeekday(), queueGoalEvidenceRequest(), applyGoalReview() (+22 more)

### Community 6 - "github-delivery.ts"
Cohesion: 0.07
Nodes (33): BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction(), dependabotReviewGuidance(), discover(), refreshDependencies(), routeExisting() (+25 more)

### Community 7 - "accept-stage-result.ts"
Cohesion: 0.14
Nodes (42): containedFile(), findingsBlock(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery(), acceptStageResult(), acceptConflictRepair() (+34 more)

### Community 8 - ".transaction"
Cohesion: 0.10
Nodes (36): approveFeature(), assertRetainedItems(), commandFeature(), createFeature(), mutation(), reviewQuestions(), approvedDelivery(), bindDelivery() (+28 more)

### Community 9 - "store.ts"
Cohesion: 0.11
Nodes (32): JiraOperations, plain(), cecChatPrompt(), itChatPrompt(), PICKUP_CHAT, canFileGithubIssue(), GITHUB_ISSUE_SKILL, githubFollowupPrompt() (+24 more)

### Community 10 - "closeout-recovery.ts"
Cohesion: 0.12
Nodes (42): assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint(), closeoutProviderEvidence() (+34 more)

### Community 11 - "PeoplePanel.tsx"
Cohesion: 0.10
Nodes (40): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+32 more)

### Community 12 - "App.tsx"
Cohesion: 0.06
Nodes (40): themeColor, CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants, ElevatorPhase, floorVariants, leftDoor (+32 more)

### Community 13 - "conversations/conversations.ts"
Cohesion: 0.10
Nodes (27): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+19 more)

### Community 14 - "implementation-recovery.ts"
Cohesion: 0.10
Nodes (38): savedActivationFailure(), continuationScope(), brainImplementationCandidate(), BrainReadback, digest(), implementationRecoveryCandidate(), Ownership, Readback (+30 more)

### Community 15 - "agents.ts"
Cohesion: 0.08
Nodes (26): cecPrompt(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), resolvedDecisionNote(), stageInstructions, ctoChatPrompt() (+18 more)

### Community 16 - "Store"
Cohesion: 0.10
Nodes (10): featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), recoverFeatures(), goalNoticeNeverDispatched(), Assessment, recover(), Store (+2 more)

### Community 17 - "features/workflow.ts"
Cohesion: 0.13
Nodes (25): featureById(), discoveryPrompt(), planPrompt(), artifactPath(), document(), featureRoot(), DiscoverySchema, identity (+17 more)

### Community 18 - "LessonsPanel.tsx"
Cohesion: 0.16
Nodes (25): LessonsPanel(), when(), SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS (+17 more)

### Community 19 - "scheduler.ts"
Cohesion: 0.10
Nodes (22): fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch(), foreignWork(), WorkSlot (+14 more)

### Community 20 - "GitHubDelivery"
Cohesion: 0.13
Nodes (23): PrerequisitesSchema, GitHubDelivery, continuationWorktree(), dependencyVersion(), handoffSavedPrerequisites(), hasSavedPrerequisiteResult(), Ownership, qualified() (+15 more)

### Community 21 - "activation-recovery.ts"
Cohesion: 0.17
Nodes (27): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+19 more)

### Community 22 - "shared.ts"
Cohesion: 0.09
Nodes (26): ProjectReadiness, ConfirmedSegment, ObservationGap, SnapshotOrdering, SchedulerState, Conversation(), recommendedReply(), loadOfficeConfig() (+18 more)

### Community 23 - "azure.ts"
Cohesion: 0.13
Nodes (24): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+16 more)

### Community 24 - "OfficeSnapshot"
Cohesion: 0.13
Nodes (21): FeatureRound, FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures(), draftKey() (+13 more)

### Community 25 - "github-publication.ts"
Cohesion: 0.19
Nodes (11): Assign, Board, Content, GitHubFeaturePublisher, number(), same(), FeaturePublisher, PublicationReceipt (+3 more)

### Community 26 - "maintenance.ts"
Cohesion: 0.16
Nodes (18): maintenancePolicies(), BrainMaintenance, BrainResult, easternDate(), GitHubMaintenance, MaintenanceSchema, MAINTENANCE_NATIVE_GUIDANCE, maintenanceCoveragePassed() (+10 more)

### Community 27 - "control-store.ts"
Cohesion: 0.11
Nodes (16): Clock, EASTERN, easternDayFormatter, easternPartsFormatter, systemClock, applyConnectionSettings(), closeConnection(), optimizeOnOpen() (+8 more)

### Community 28 - ".save"
Cohesion: 0.23
Nodes (24): unpack(), BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue(), readIssues() (+16 more)

### Community 29 - "dependencies.ts"
Cohesion: 0.19
Nodes (22): reconcileNoticeConfirmations(), Admission, admit(), IntakeContext, compatible(), dependencyCompletionKey(), dependencyEligibility(), DependencyStores (+14 more)

### Community 30 - "TimeBook.tsx"
Cohesion: 0.15
Nodes (23): LiveAnchor, displayAgentTask(), LiveAgentTask(), Props, RunningTask(), text(), AzureBuild, lastWall (+15 more)

### Community 31 - "conversations/slack.ts"
Cohesion: 0.13
Nodes (14): slackVerifyPrompt(), comparableSlackText(), SlackMessages, SlackRequestSchema, SlackResultSchema, SlackVerificationSchema, goalNoticeAuthorized(), sendGoalNotice() (+6 more)

### Community 32 - "retrospective-triggers.ts"
Cohesion: 0.17
Nodes (23): configureKnowledge(), clip(), JobLike, recordCIBudget(), recordParked(), recordRepairBudget(), recordTechnicalBudget(), recordTicketParked() (+15 more)

### Community 33 - "weekly-rollup.ts"
Cohesion: 0.13
Nodes (24): Kind, RetrospectiveResultSchema, RollupResult, RollupResultSchema, Stage, harperFolder(), KnowledgeRunner, KnowledgeRunOptions (+16 more)

### Community 34 - "jira-time.ts"
Cohesion: 0.18
Nodes (18): easternDay(), easternInstant(), data(), JiraWorklogs, localId(), locks, matches(), publishJiraTime() (+10 more)

### Community 35 - "assignment-poll.ts"
Cohesion: 0.15
Nodes (17): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), Identity, MergeNotifications, mergeText() (+9 more)

### Community 36 - "discovery-recovery.ts"
Cohesion: 0.13
Nodes (19): Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership, rawHash() (+11 more)

### Community 37 - "coordination.ts"
Cohesion: 0.14
Nodes (22): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), legacy, validateNativeContinuation(), checkpointWindow() (+14 more)

### Community 38 - "tracking-issue.ts"
Cohesion: 0.22
Nodes (21): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard, projectCards() (+13 more)

### Community 39 - ".api"
Cohesion: 0.20
Nodes (14): retireInactiveDeliveries(), retireUnstartedDelivery(), unstartedDelivery(), ciCheckout(), verifyCIHooks(), CIFailure, guardCIRepair(), prepareCIMetadataRepair() (+6 more)

### Community 40 - "Coordinator"
Cohesion: 0.09
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 41 - "publish-pr.ts"
Cohesion: 0.17
Nodes (18): activeEffectId(), harnessEffect, readBackOrThrow(), retryRead(), park(), developerPRContent(), Execute, lintPRContent() (+10 more)

### Community 42 - "work-summary.ts"
Cohesion: 0.21
Nodes (18): compactSteps(), App(), usePanelFocus(), deliveryRepairProjection(), card, InboxQueue(), PMQueueItem, pmQueueItems() (+10 more)

### Community 43 - "github-check-selection.ts"
Cohesion: 0.21
Nodes (18): checksFailed(), checksPassed(), checksPending(), CurrentChecksWait, currentMergeChecks(), pass(), pending(), requireThat() (+10 more)

### Community 44 - "scheduled-work.ts"
Cohesion: 0.17
Nodes (18): deliverySlot(), closeoutRequestResolved(), preparationRequestResolved(), scopeRepairRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), deterministicActions, eligible() (+10 more)

### Community 45 - "jira-publication.ts"
Cohesion: 0.26
Nodes (7): Assignment, Content, JiraFeaturePublisher, jiraText(), keyOf(), plainDescription(), Transition

### Community 46 - "api-routes.ts"
Cohesion: 0.20
Nodes (16): ITSpecialist, goalHistory(), saveGoal(), apiRoute(), RequestContext, ServiceContext, OfficeConfigInputs, officeConfigRoute() (+8 more)

### Community 47 - "dependency-bots/adopt.ts"
Cohesion: 0.24
Nodes (17): adoptDependabot(), closesIssue(), linkedBody(), linkPR(), dependabotPR, openDependabotPulls(), readRepo(), refusal() (+9 more)

### Community 48 - "validate-stage.ts"
Cohesion: 0.16
Nodes (17): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+9 more)

### Community 49 - "digest"
Cohesion: 0.16
Nodes (17): verifiedCloseoutCleanupRequest(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat() (+9 more)

### Community 50 - "scope-repair-resume.ts"
Cohesion: 0.20
Nodes (19): Assessment, outsideScanSources(), Ownership, reconcileScopeRepairReadback(), requireThat(), scopeRepairReadbackCandidate(), sha, certain() (+11 more)

### Community 51 - ".emit"
Cohesion: 0.18
Nodes (13): configureNotices(), NoticeSettings, retryRecipientLookup(), declineLessonIssue(), reactivateLesson(), retireLesson(), mirrorOfficeKnowledge(), configureGoalNotices() (+5 more)

### Community 52 - "closeout.ts"
Cohesion: 0.27
Nodes (13): recordCandidateCleanup(), retryCandidateCleanup(), harnessCloseout(), PASSING, verifyMergeActions(), assertMayMutate(), runHarnessStage(), harnessStageResult() (+5 more)

### Community 53 - "service-health.ts"
Cohesion: 0.17
Nodes (10): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, slackHealth() (+2 more)

### Community 54 - "outbox.ts"
Cohesion: 0.21
Nodes (14): conversationResolved(), projectOutbox(), syncOutbox(), knowledgeOutbox(), checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), repeatedVendorReviewBlock() (+6 more)

### Community 55 - ".getEffect"
Cohesion: 0.26
Nodes (7): GitHubOperations, fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), closeNativeRefresh(), fingerprint(), EffectIntent

### Community 56 - "Goals.tsx"
Cohesion: 0.16
Nodes (14): SendMessage, CTOReview(), goalState, DailyCTO(), GoalHistory(), reportDate(), reviewStatus, GoalList() (+6 more)

### Community 57 - "remove-candidate.ts"
Cohesion: 0.22
Nodes (14): interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval, Execute (+6 more)

### Community 58 - "knowledge.ts"
Cohesion: 0.18
Nodes (16): SEEDS, DeliveryMetrics, KnowledgeRetry, KnowledgeState, Lesson, LessonRecurrence, OfficeProposal, PendingRetrospective (+8 more)

### Community 59 - "it-specialist.ts"
Cohesion: 0.27
Nodes (11): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), ITContext, readBackConversations(), publishITReport(), delays, recoverAttempt() (+3 more)

### Community 60 - "retrospective-subject.ts"
Cohesion: 0.21
Nodes (14): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+6 more)

### Community 61 - "retrospective-facts.ts"
Cohesion: 0.18
Nodes (14): ARTIFACT_LIMIT, clip(), LEDGER_STEPS, MAINTENANCE_LIMIT, maintenanceFacts(), MaintenancePacketSection, clip(), PACKET_LIMIT (+6 more)

### Community 62 - "source-amendment-scope.ts"
Cohesion: 0.26
Nodes (15): approvedText(), assert(), assert(), boundProfiles, Document, ReadSourceFile, RELEASE_SOURCE_IDS, releaseAmendmentJournal() (+7 more)

### Community 63 - "office-lessons.ts"
Cohesion: 0.21
Nodes (11): Accepted, acceptRetrospective(), normalizeStatement(), RETROSPECTIVE_HISTORY, decideOfficeProposal(), now(), OfficeKnowledgeStore, proposeOfficeLessons() (+3 more)

### Community 64 - "fact-bounds.ts"
Cohesion: 0.26
Nodes (15): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+7 more)

### Community 65 - "preferences-store.ts"
Cohesion: 0.18
Nodes (11): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, SettingsPanel() (+3 more)

### Community 66 - "process.ts"
Cohesion: 0.23
Nodes (12): compareBaseline(), prepareBaseline(), scopePaths(), SourceChanged, tree(), targetObservation(), GIT_NETWORK, LIVE_PROVIDERS (+4 more)

### Community 67 - ".run"
Cohesion: 0.17
Nodes (8): contextPacket(), labels, toolActivity(), workerActivity(), ClaudeStream, codexArguments(), assertStrictOutputSchema(), completedOutput()

### Community 68 - "requests.ts"
Cohesion: 0.21
Nodes (13): CloseoutSupervisionProofRef, Envelope, hash, head, identity, instant(), known, pid (+5 more)

### Community 69 - "index.ts"
Cohesion: 0.18
Nodes (12): close(), config, itSpecialist, loadedRevision, offices, releaseLock, server, serviceHealth (+4 more)

### Community 70 - "continuation-evidence.ts"
Cohesion: 0.38
Nodes (10): allowed, continuationNativeReview(), continuationReviewArtifacts(), negativeWorker(), reconcileContinuationReview(), savedNegativeContinuationReview(), ContinuationDecision, implementationContinuationDecision() (+2 more)

### Community 71 - "offices.ts"
Cohesion: 0.30
Nodes (8): savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), diagnosticSnapshot(), nativeDeliveryResolved(), reconcileRecoveryLedger(), DELIVERY_CONCURRENCY

### Community 72 - "useOfficePreferences.ts"
Cohesion: 0.26
Nodes (10): acceptPreferences(), PreferenceCandidate, strip(), UNKNOWN_PREFERENCES, OfficePreferencesController, PreferenceFeedback, PreferenceField, requestPreferences() (+2 more)

### Community 73 - "ProjectProgress"
Cohesion: 0.27
Nodes (6): file, folder, logs, root, xml(), ProjectProgress

### Community 74 - "knowledge-context.ts"
Cohesion: 0.24
Nodes (10): Bucket, knowledgeContext(), LESSON_LIMIT, lessonPurpose(), MAINTENANCE, MAX_LESSONS, PURPOSES, render() (+2 more)

### Community 76 - "github.ts"
Cohesion: 0.33
Nodes (5): GitHubMonitor, githubPRDescription(), GitHubBoard, GitHubPR, GitHubState

### Community 77 - "maintenance-triggers.ts"
Cohesion: 0.36
Nodes (9): clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates(), maintenanceCompletedId(), maintenanceKey(), visibleMaintenanceTriggerIds(), TerminalCandidate (+1 more)

### Community 78 - "scheduled-retrospectives.ts"
Cohesion: 0.38
Nodes (8): busyMaintenanceIds(), terminalCandidates(), triggerJobId(), runRetrospective(), busySubjects(), scheduledRetrospectives(), status(), WorkEligibility

### Community 79 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 80 - "session-bridge.ts"
Cohesion: 0.33
Nodes (8): claudeSessions(), codexSessions(), desktopSessions(), guardianReview(), LiveSession, loadedCodexSession(), openRollouts(), SessionInventory

### Community 81 - "cli.ts"
Cohesion: 0.25
Nodes (6): args, [cmd,...rawArgs], commands, key, projectIndex, PORT

### Community 82 - "retire-external-delivery.ts"
Cohesion: 0.57
Nodes (5): completedPRReviews(), eligible(), mergedByOwner(), ownerSettles(), retireExternalDeliveries()

## Knowledge Gaps
- **284 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+279 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `engine.ts`, `source-amendment.ts`, `artifact`, `daily-cto.ts`, `github-delivery.ts`, `accept-stage-result.ts`, `.transaction`, `store.ts`, `closeout-recovery.ts`, `conversations/conversations.ts`, `implementation-recovery.ts`, `agents.ts`, `features/workflow.ts`, `scheduler.ts`, `GitHubDelivery`, `activation-recovery.ts`, `azure.ts`, `OfficeSnapshot`, `github-publication.ts`, `maintenance.ts`, `control-store.ts`, `.save`, `dependencies.ts`, `conversations/slack.ts`, `retrospective-triggers.ts`, `weekly-rollup.ts`, `jira-time.ts`, `assignment-poll.ts`, `discovery-recovery.ts`, `coordination.ts`, `tracking-issue.ts`, `.api`, `publish-pr.ts`, `scheduled-work.ts`, `jira-publication.ts`, `dependency-bots/adopt.ts`, `validate-stage.ts`, `digest`, `scope-repair-resume.ts`, `.emit`, `closeout.ts`, `.getEffect`, `remove-candidate.ts`, `it-specialist.ts`, `retrospective-subject.ts`, `retrospective-facts.ts`, `office-lessons.ts`, `process.ts`, `.run`, `requests.ts`, `continuation-evidence.ts`, `offices.ts`, `knowledge-context.ts`, `Offices`, `github.ts`, `scheduled-retrospectives.ts`, `session-bridge.ts`, `retire-external-delivery.ts`?**
  _High betweenness centrality (0.108) - this node is a cross-community bridge._
- **Why does `GitHubDelivery` connect `GitHubDelivery` to `engine.ts`, `source-amendment.ts`, `artifact`, `github-delivery.ts`, `accept-stage-result.ts`, `closeout-recovery.ts`, `implementation-recovery.ts`, `Store`, `activation-recovery.ts`, `dependencies.ts`, `assignment-poll.ts`, `discovery-recovery.ts`, `.api`, `Coordinator`, `publish-pr.ts`, `github-check-selection.ts`, `validate-stage.ts`, `digest`, `scope-repair-resume.ts`, `closeout.ts`, `requests.ts`, `continuation-evidence.ts`, `retire-external-delivery.ts`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `command()` connect `Store` to `engine.ts`, `github-delivery.ts`, `accept-stage-result.ts`, `.transaction`, `store.ts`, `closeout-recovery.ts`, `implementation-recovery.ts`, `agents.ts`, `features/workflow.ts`, `GitHubDelivery`, `azure.ts`, `github-publication.ts`, `maintenance.ts`, `.save`, `dependencies.ts`, `jira-time.ts`, `assignment-poll.ts`, `coordination.ts`, `tracking-issue.ts`, `.api`, `publish-pr.ts`, `scheduled-work.ts`, `jira-publication.ts`, `validate-stage.ts`, `digest`, `closeout.ts`, `service-health.ts`, `.getEffect`, `remove-candidate.ts`, `process.ts`, `.run`, `requests.ts`, `github.ts`, `command-registry.ts`, `session-bridge.ts`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `command()` (e.g. with `.constructor()` and `executeRequest()`) actually correct?**
  _`command()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _284 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `engine.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.052349336057201226 - nodes in this community are weakly interconnected._
- **Should `Inspector.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08819875776397515 - nodes in this community are weakly interconnected._