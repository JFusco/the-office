# Graph Report - persona-context  (2026-11-06)

## Corpus Check
- 398 files · ~198,369 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2375 nodes · 10123 edges · 84 communities (81 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 51 edges (avg confidence: 0.74)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4bd8aa01`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- source-amendment.ts
- OfficeScene.tsx
- shared.ts
- Inspector.tsx
- index.ts
- agents.ts
- index.tsx
- post-conflict-preparation.ts
- conversations/conversations.ts
- implementation-recovery.ts
- cec/workflow.ts
- closeout-recovery.ts
- features/workflow.ts
- http/commands.ts
- PeoplePanel.tsx
- sanitize
- it-specialist.ts
- TicketJob
- artifact
- Goals.tsx
- OfficeSnapshot
- LessonsPanel.tsx
- digest
- store.ts
- Store
- daily-cto.ts
- jira-publication.ts
- Ticket
- features.ts
- closeout.ts
- Feature
- brain-maintenance.ts
- run-retrospective.ts
- scheduler.ts
- github-check-selection.ts
- requests.ts
- .transaction
- TimeBook.tsx
- .save
- dependency-bots/adopt.ts
- github-publication.ts
- Coordinator
- accept-stage-result.ts
- jira-time.ts
- tracking-issue.ts
- dependencies.ts
- scheduled-work.ts
- retrospective-triggers.ts
- conversations/slack.ts
- validate-stage.ts
- github-delivery.ts
- coordination.ts
- coordination-tick.ts
- outbox.ts
- retrospective-subject.ts
- assignment-poll.ts
- remove-candidate.ts
- engine.ts
- scope.ts
- rootArtifact
- run-ci-repair.ts
- knowledge.ts
- publish-pr.ts
- weekly-rollup.ts
- fact-bounds.ts
- Engine
- prompts/conversations.ts
- github-readiness.ts
- goal-reviews.ts
- github-closeout.ts
- retrospective-facts.ts
- MaintenanceRun
- work.ts
- workKey
- knowledge-context.ts
- config.ts
- .emit
- command-registry.ts
- session-bridge.ts
- provider-observation.ts
- retire-external-delivery.ts
- maintenance-triggers.ts
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
10. `OfficeSnapshot` - 62 edges

## Surprising Connections (you probably didn't know these)
- `DeliverySlot` --references--> `Role`  [EXTRACTED]
  server/office/projects.ts → src/shared.ts
- `projectOutbox()` --calls--> `deferredPickup()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/pickup-state.ts
- `projectOutbox()` --calls--> `parkedProviderWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts
- `projectOutbox()` --calls--> `readinessWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts
- `cecChatPrompt()` --calls--> `timeReport()`  [EXTRACTED]
  server/conversations/prompts/conversations.ts → src/timing/timing.ts

## Import Cycles
- 3-file cycle: `server/conversations/conversations.ts -> server/conversations/slack.ts -> server/workers/agents.ts -> server/conversations/conversations.ts`
- 3-file cycle: `server/conversations/conversation-recovery.ts -> server/conversations/conversations.ts -> server/conversations/team-conversation-pump.ts -> server/conversations/conversation-recovery.ts`
- 3-file cycle: `server/conversations/conversations.ts -> server/scheduling/engine.ts -> server/workers/agents.ts -> server/conversations/conversations.ts`
- 3-file cycle: `server/scheduling/coordination-pump.ts -> server/scheduling/requests.ts -> server/scheduling/coordination.ts -> server/scheduling/coordination-pump.ts`
- 3-file cycle: `server/scheduling/coordination-tick.ts -> server/scheduling/requests.ts -> server/scheduling/coordination.ts -> server/scheduling/coordination-tick.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/recovery/retire-external-delivery.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/stage-prompts.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/queue-repairs.ts -> server/delivery/repairs/ci-admission.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-preparation.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/preparation/post-conflict-preparation.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/queue-repairs.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/implementation/activation-recovery.ts -> server/delivery/recovery/validation/validation-provider-context.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/implementation/continuation-guard.ts -> server/delivery/recovery/validation/validation-provider-context.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/implementation/saved-prerequisite-handoff.ts -> server/delivery/recovery/validation/validation-provider-context.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/preparation/post-conflict-preparation.ts -> server/delivery/recovery/preparation/preparation-provider-context.ts -> server/delivery/pipeline/github-delivery.ts`

## Communities (84 total, 3 thin omitted)

### Community 0 - "source-amendment.ts"
Cohesion: 0.07
Nodes (63): approvedText(), assert(), AMENDMENT_REVIEW_PROOF, amendmentIssueSha256(), authorizeSourceAmendment(), Binding, assert(), normalize() (+55 more)

### Community 1 - "OfficeScene.tsx"
Cohesion: 0.06
Nodes (52): itAgent(), itDiagnostics(), githubStageLabels, withoutElapsed(), Avatar(), AzureWall(), Chair(), Coworker() (+44 more)

### Community 2 - "shared.ts"
Cohesion: 0.05
Nodes (46): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, ProjectReadiness, DailyCTOSummary (+38 more)

### Community 3 - "Inspector.tsx"
Cohesion: 0.05
Nodes (49): themeColor, CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants, ElevatorPhase, floorVariants, leftDoor (+41 more)

### Community 4 - "index.ts"
Cohesion: 0.10
Nodes (34): close(), config, itSpecialist, loadedRevision, offices, releaseLock, server, serviceHealth (+26 more)

### Community 5 - "agents.ts"
Cohesion: 0.08
Nodes (38): cecPrompt(), resolvedDecisionNote(), stageInstructions, HANDS_OFF_RESOLUTION_GUIDANCE, RESOLUTION_GUIDANCE, APPROACH_GUIDANCE, ApproachSchema, reviewInstructions() (+30 more)

### Community 6 - "index.tsx"
Cohesion: 0.09
Nodes (46): Conversation(), Outbox(), recommendedReply(), ServiceHealthPanel(), labels, ServiceHealthRow(), slackMessageUrl(), ArrowRight (+38 more)

### Community 7 - "post-conflict-preparation.ts"
Cohesion: 0.11
Nodes (42): resumeReviewedMerge(), partialLocalCleanupCandidate(), savedActivationFailure(), assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts() (+34 more)

### Community 8 - "conversations/conversations.ts"
Cohesion: 0.08
Nodes (29): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+21 more)

### Community 9 - "implementation-recovery.ts"
Cohesion: 0.08
Nodes (40): recordJobApproach(), continuationScope(), Assessment, diagnosticProof(), discoveryRecoveryCandidate(), ownedArtifact(), Ownership, rawHash() (+32 more)

### Community 10 - "cec/workflow.ts"
Cohesion: 0.11
Nodes (39): correlatedBuild(), parksInJira(), MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), run(), advance(), nextStage() (+31 more)

### Community 11 - "closeout-recovery.ts"
Cohesion: 0.11
Nodes (44): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+36 more)

### Community 12 - "features/workflow.ts"
Cohesion: 0.14
Nodes (34): approveFeature(), assertRetainedItems(), commandFeature(), createFeature(), featureById(), mutation(), reviewQuestions(), discoveryPrompt() (+26 more)

### Community 13 - "http/commands.ts"
Cohesion: 0.09
Nodes (26): ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), retryRecipientLookup(), bindDiscoveryResume(), DiscoveryResumeInput, normalizeStatement() (+18 more)

### Community 14 - "PeoplePanel.tsx"
Cohesion: 0.11
Nodes (37): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+29 more)

### Community 15 - "sanitize"
Cohesion: 0.09
Nodes (33): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+25 more)

### Community 16 - "it-specialist.ts"
Cohesion: 0.09
Nodes (27): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), partialLocalCleanupKey(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved() (+19 more)

### Community 17 - "TicketJob"
Cohesion: 0.10
Nodes (19): StageContext, GitHubDelivery, stagePrompt(), StagePromptInput, adoptCandidate(), reported, Scope, advisoryPM() (+11 more)

### Community 18 - "artifact"
Cohesion: 0.13
Nodes (36): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+28 more)

### Community 19 - "Goals.tsx"
Cohesion: 0.09
Nodes (30): FeatureRound, SendMessage, FeatureDelivery(), views, phases, LinkedFeatures(), draftKey(), readDraft() (+22 more)

### Community 20 - "OfficeSnapshot"
Cohesion: 0.12
Nodes (30): compactSteps(), App(), SnapshotAcceptance, demoSnapshot(), tourStages, useOffice(), OfficeSnapshot, STAGE_ROLE (+22 more)

### Community 21 - "LessonsPanel.tsx"
Cohesion: 0.14
Nodes (27): FeatureDocuments(), FeatureWorkspace(), LessonsPanel(), when(), SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm() (+19 more)

### Community 22 - "digest"
Cohesion: 0.15
Nodes (35): containedFile(), Assessment, outsideScanSources(), Ownership, reconcileScopeRepairReadback(), requireThat(), scopeRepairReadbackCandidate(), scopeRepairRequestResolved() (+27 more)

### Community 23 - "store.ts"
Cohesion: 0.10
Nodes (20): Clock, EASTERN, easternDayFormatter, easternPartsFormatter, systemClock, applyConnectionSettings(), closeConnection(), optimizeOnOpen() (+12 more)

### Community 24 - "Store"
Cohesion: 0.10
Nodes (11): DeliveryTaskInput, Assessment, Store, GIT_NETWORK, LIVE_PROVIDERS, liveReach(), networkUrl(), remoteUrls() (+3 more)

### Community 25 - "daily-cto.ts"
Cohesion: 0.15
Nodes (12): DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), dailyReviewDate(), reviewWeekday(), Briefing, saveReviewBriefing() (+4 more)

### Community 26 - "jira-publication.ts"
Cohesion: 0.18
Nodes (10): Assignment, Content, JiraFeaturePublisher, jiraText(), keyOf(), plainDescription(), Transition, FeaturePublisher (+2 more)

### Community 27 - "Ticket"
Cohesion: 0.13
Nodes (15): JiraOperations, plain(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), slackSendPrompt(), slackVerifyPrompt() (+7 more)

### Community 28 - "features.ts"
Cohesion: 0.14
Nodes (22): bindDelivery(), featureEffectGate(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), assertFeatureGate(), bindFeature(), currentApproval() (+14 more)

### Community 29 - "closeout.ts"
Cohesion: 0.20
Nodes (17): recordCandidateCleanup(), retryCandidateCleanup(), harnessCloseout(), PASSING, verifyMergeActions(), activeEffectId(), harnessEffect, assertMayMutate() (+9 more)

### Community 30 - "Feature"
Cohesion: 0.18
Nodes (14): featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), recoverFeatures(), EvidenceSchema, helperInstallation(), readReview(), ReviewEvidence (+6 more)

### Community 31 - "brain-maintenance.ts"
Cohesion: 0.14
Nodes (17): maintenancePolicies(), reconcileNativeDelivery(), BrainMaintenance, BrainResult, candidateOwner(), SETTLED, skipOwnedCandidate(), Skipped (+9 more)

### Community 32 - "run-retrospective.ts"
Cohesion: 0.13
Nodes (23): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, busyMaintenanceIds(), retrospectivePrompt(), SUBJECT, Kind, RetrospectiveResult (+15 more)

### Community 33 - "scheduler.ts"
Cohesion: 0.16
Nodes (13): ROLES, stageRole(), fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch() (+5 more)

### Community 34 - "github-check-selection.ts"
Cohesion: 0.19
Nodes (20): checksFailed(), checksPassed(), checksPending(), CurrentChecksWait, currentMergeChecks(), pass(), pending(), requireThat() (+12 more)

### Community 35 - "requests.ts"
Cohesion: 0.14
Nodes (23): bindPreparationBoardOrigins(), claimSchema, eventSchema, PreparationBoardOrigin, readPreparationBoardOrigins(), timestamp, updateSchema, readyOnlyReceiptHistory() (+15 more)

### Community 36 - ".transaction"
Cohesion: 0.15
Nodes (12): assertEnrollable(), publishFeature(), reserveIdentity(), GitHubOperations, fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), closeNativeRefresh() (+4 more)

### Community 37 - "TimeBook.tsx"
Cohesion: 0.15
Nodes (22): LiveAnchor, displayAgentTask(), LiveAgentTask(), Props, RunningTask(), text(), AzureBuild, lastWall (+14 more)

### Community 38 - ".save"
Cohesion: 0.26
Nodes (21): unpack(), BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue(), readIssues() (+13 more)

### Community 39 - "dependency-bots/adopt.ts"
Cohesion: 0.21
Nodes (20): readBackOrThrow(), adoptDependabot(), closesIssue(), linkedBody(), linkPR(), dependabotPR, openDependabotPulls(), readRepo() (+12 more)

### Community 40 - "github-publication.ts"
Cohesion: 0.27
Nodes (9): Assign, Board, Content, GitHubFeaturePublisher, number(), same(), PublicationReceipt, label() (+1 more)

### Community 42 - "accept-stage-result.ts"
Cohesion: 0.22
Nodes (20): acceptStageResult(), mergeAuthorized(), allowed, continuationNativeReview(), continuationReviewArtifacts(), continuationWorkerProof(), negativeWorker(), savedNegativeContinuationReview() (+12 more)

### Community 43 - "jira-time.ts"
Cohesion: 0.19
Nodes (15): data(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), captureTime(), midnight() (+7 more)

### Community 44 - "tracking-issue.ts"
Cohesion: 0.25
Nodes (19): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard, projectCards() (+11 more)

### Community 45 - "dependencies.ts"
Cohesion: 0.21
Nodes (19): Admission, admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, compatible(), dependencyCompletionKey(), dependencyEligibility() (+11 more)

### Community 46 - "scheduled-work.ts"
Cohesion: 0.17
Nodes (18): deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), deterministicActions, eligible() (+10 more)

### Community 47 - "retrospective-triggers.ts"
Cohesion: 0.18
Nodes (21): MaintenanceCandidate, clip(), JobLike, recordCIBudget(), recordParked(), recordRepairBudget(), recordTicketParked(), recordTrigger() (+13 more)

### Community 48 - "conversations/slack.ts"
Cohesion: 0.17
Nodes (11): channelNoticeAuthorized(), MergeNotifications, SlackMessages, SlackRequestSchema, SlackResultSchema, SlackVerificationSchema, goalNoticeAuthorized(), sendGoalNotice() (+3 more)

### Community 49 - "validate-stage.ts"
Cohesion: 0.16
Nodes (17): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+9 more)

### Community 50 - "github-delivery.ts"
Cohesion: 0.16
Nodes (15): BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction(), dependabotReviewGuidance(), discover(), refreshDependencies(), routeExisting() (+7 more)

### Community 51 - "coordination.ts"
Cohesion: 0.18
Nodes (18): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation(), checkpointWindow(), dueAt() (+10 more)

### Community 52 - "coordination-tick.ts"
Cohesion: 0.18
Nodes (15): reconcileNoticeConfirmations(), PrerequisitesSchema, brainCheckpointCompletion(), reconcileCompletedCheckpoints(), legacy, reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS (+7 more)

### Community 53 - "outbox.ts"
Cohesion: 0.21
Nodes (14): conversationResolved(), projectOutbox(), syncOutbox(), knowledgeOutbox(), checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), repeatedVendorReviewBlock() (+6 more)

### Community 54 - "retrospective-subject.ts"
Cohesion: 0.18
Nodes (16): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+8 more)

### Community 55 - "assignment-poll.ts"
Cohesion: 0.24
Nodes (11): configureNotices(), Identity, mergeText(), NoticeSettings, noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), pinCourier (+3 more)

### Community 56 - "remove-candidate.ts"
Cohesion: 0.22
Nodes (14): interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval, Execute (+6 more)

### Community 57 - "engine.ts"
Cohesion: 0.25
Nodes (14): checkMail(), drainMail(), requestMail(), dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), resume() (+6 more)

### Community 58 - "scope.ts"
Cohesion: 0.25
Nodes (13): HANDS_OFF_PROJECTS, harnessDelivers(), legacyRecovery(), observe(), teamReviewedHead(), retireInactiveDeliveries(), retireUnstartedDelivery(), unstartedDelivery() (+5 more)

### Community 59 - "rootArtifact"
Cohesion: 0.28
Nodes (13): candidateInput(), children, oldAdoptionBasis(), savedCandidateAdmission, acceptedNativeGate(), preparationGateEvidence(), within(), HistoricalArtifactPath (+5 more)

### Community 60 - "run-ci-repair.ts"
Cohesion: 0.31
Nodes (11): ciCheckout(), verifyCIHooks(), CIFailure, guardCIRepair(), prepareCIMetadataRepair(), publishCIRepair(), rewordCommits(), CIPlanSchema (+3 more)

### Community 61 - "knowledge.ts"
Cohesion: 0.19
Nodes (15): SEEDS, KnowledgeRetry, KnowledgeState, Lesson, LessonRecurrence, OfficeProposal, PendingRetrospective, RepositoryInstruction (+7 more)

### Community 62 - "publish-pr.ts"
Cohesion: 0.24
Nodes (13): retryRead(), developerPRContent(), Execute, lintPRContent(), officePRContent(), prContent, assertCandidate(), Candidate (+5 more)

### Community 63 - "weekly-rollup.ts"
Cohesion: 0.23
Nodes (15): RollupResult, RollupResultSchema, harperFolder(), retryDelay(), ineffectiveLessons(), lastFriday(), ROLLUP_HISTORY, rollupDue() (+7 more)

### Community 64 - "fact-bounds.ts"
Cohesion: 0.28
Nodes (14): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+6 more)

### Community 66 - "prompts/conversations.ts"
Cohesion: 0.21
Nodes (8): cecChatPrompt(), ctoChatPrompt(), itChatPrompt(), diagnosticContext(), diagnosticSnapshot(), knowledgeChatPrompt(), goalReportContext(), currentServices()

### Community 67 - "github-readiness.ts"
Cohesion: 0.25
Nodes (13): findingsBlock(), handsOff(), resumeParked(), acceptConflictRepair(), hasUncertainEffects(), pendingPreparationCheck(), finishLeadReview(), merge() (+5 more)

### Community 68 - "goal-reviews.ts"
Cohesion: 0.16
Nodes (13): applyGoalReview(), DailyResultSchema, EvidenceRefSchema, FreshDailyResultSchema, statusAllowed(), workEvidence(), DailyCTOBriefing, DailyCTOResult (+5 more)

### Community 69 - "github-closeout.ts"
Cohesion: 0.23
Nodes (6): file, folder, logs, root, xml(), ProjectProgress

### Community 70 - "retrospective-facts.ts"
Cohesion: 0.23
Nodes (11): ARTIFACT_LIMIT, clip(), LEDGER_STEPS, MAINTENANCE_LIMIT, maintenanceFacts(), MaintenancePacketSection, clip(), PACKET_LIMIT (+3 more)

### Community 71 - "MaintenanceRun"
Cohesion: 0.20
Nodes (9): Result, BrainStatusSchema, identity, coverageSchema, followupSchema, verified, ReconciliationRequest, DailyCheckpoint (+1 more)

### Community 72 - "work.ts"
Cohesion: 0.15
Nodes (12): AssignmentResult, CompletionCondition, Continuation, DependencyObservation, EligibilityState, FailureCategory, ReconciliationAction, WorkAssignment (+4 more)

### Community 73 - "workKey"
Cohesion: 0.42
Nodes (11): continuationWorktree(), dependencyVersion(), handoffSavedPrerequisites(), Ownership, qualified(), readDependencies(), requireSavedPrerequisites(), requireThat() (+3 more)

### Community 74 - "knowledge-context.ts"
Cohesion: 0.21
Nodes (11): Bucket, knowledgeContext(), LESSON_LIMIT, lessonPurpose(), MAINTENANCE, MAX_LESSONS, PURPOSES, render() (+3 more)

### Community 75 - "config.ts"
Cohesion: 0.12
Nodes (18): args, [cmd,...rawArgs], commands, key, projectIndex, DELIVERY_CONCURRENCY, LEGACY_AUTOMATION, LOCAL_BINDINGS (+10 more)

### Community 76 - ".emit"
Cohesion: 0.22
Nodes (3): MaintenanceSchema, maintenanceCoveragePassed(), maintenanceCoverageSchema()

### Community 77 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 78 - "session-bridge.ts"
Cohesion: 0.33
Nodes (8): claudeSessions(), codexSessions(), desktopSessions(), guardianReview(), LiveSession, loadedCodexSession(), openRollouts(), SessionInventory

### Community 79 - "provider-observation.ts"
Cohesion: 0.36
Nodes (6): followResume(), note(), reconcileAndResumeParked(), observe(), observeParked(), parkedReadError

### Community 80 - "retire-external-delivery.ts"
Cohesion: 0.57
Nodes (5): completedPRReviews(), eligible(), mergedByOwner(), ownerSettles(), retireExternalDeliveries()

### Community 81 - "maintenance-triggers.ts"
Cohesion: 0.57
Nodes (6): clip(), maintenanceBlockedId(), maintenanceCandidates(), maintenanceCompletedId(), maintenanceKey(), visibleMaintenanceTriggerIds()

## Knowledge Gaps
- **285 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+280 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `source-amendment.ts`, `agents.ts`, `post-conflict-preparation.ts`, `conversations/conversations.ts`, `implementation-recovery.ts`, `cec/workflow.ts`, `closeout-recovery.ts`, `features/workflow.ts`, `http/commands.ts`, `sanitize`, `it-specialist.ts`, `TicketJob`, `artifact`, `OfficeSnapshot`, `digest`, `store.ts`, `jira-publication.ts`, `Ticket`, `features.ts`, `closeout.ts`, `Feature`, `brain-maintenance.ts`, `run-retrospective.ts`, `scheduler.ts`, `requests.ts`, `.transaction`, `.save`, `dependency-bots/adopt.ts`, `github-publication.ts`, `accept-stage-result.ts`, `jira-time.ts`, `tracking-issue.ts`, `dependencies.ts`, `scheduled-work.ts`, `retrospective-triggers.ts`, `conversations/slack.ts`, `validate-stage.ts`, `github-delivery.ts`, `coordination.ts`, `coordination-tick.ts`, `retrospective-subject.ts`, `assignment-poll.ts`, `remove-candidate.ts`, `engine.ts`, `scope.ts`, `rootArtifact`, `publish-pr.ts`, `weekly-rollup.ts`, `prompts/conversations.ts`, `github-readiness.ts`, `goal-reviews.ts`, `github-closeout.ts`, `retrospective-facts.ts`, `MaintenanceRun`, `workKey`, `knowledge-context.ts`, `config.ts`, `.emit`, `session-bridge.ts`, `retire-external-delivery.ts`?**
  _High betweenness centrality (0.107) - this node is a cross-community bridge._
- **Why does `GitHubDelivery` connect `TicketJob` to `source-amendment.ts`, `post-conflict-preparation.ts`, `implementation-recovery.ts`, `closeout-recovery.ts`, `artifact`, `digest`, `Store`, `closeout.ts`, `github-check-selection.ts`, `requests.ts`, `accept-stage-result.ts`, `dependencies.ts`, `validate-stage.ts`, `github-delivery.ts`, `assignment-poll.ts`, `scope.ts`, `run-ci-repair.ts`, `github-readiness.ts`, `github-closeout.ts`, `workKey`, `.emit`, `retire-external-delivery.ts`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `Role` connect `agents.ts` to `OfficeScene.tsx`, `shared.ts`, `Inspector.tsx`, `index.tsx`, `conversations/conversations.ts`, `cec/workflow.ts`, `http/commands.ts`, `PeoplePanel.tsx`, `TicketJob`, `OfficeSnapshot`, `store.ts`, `Ticket`, `scheduler.ts`, `accept-stage-result.ts`, `validate-stage.ts`, `github-delivery.ts`, `outbox.ts`, `retrospective-subject.ts`, `prompts/conversations.ts`, `github-readiness.ts`, `github-closeout.ts`, `work.ts`, `config.ts`, `.emit`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `command()` (e.g. with `.constructor()` and `executeRequest()`) actually correct?**
  _`command()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _285 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `source-amendment.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0697980684811238 - nodes in this community are weakly interconnected._
- **Should `OfficeScene.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0625 - nodes in this community are weakly interconnected._