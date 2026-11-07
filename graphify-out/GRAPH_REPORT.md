# Graph Report - the-office  (2026-11-07)

## Corpus Check
- 411 files · ~202,501 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2430 nodes · 10322 edges · 86 communities (82 shown, 4 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 52 edges (avg confidence: 0.74)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d55aa3d8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- assignment-poll.ts
- dependency-bots/adopt.ts
- Engine
- it-specialist.ts
- source-amendment.ts
- preparation-readback.ts
- PeoplePanel.tsx
- App.tsx
- Ticket
- Inspector.tsx
- github-delivery.ts
- OfficeScene.tsx
- run-ci-repair.ts
- requests.ts
- brain-maintenance.ts
- artifact
- scheduled-work.ts
- index.ts
- workKey
- index.tsx
- conversations/conversations.ts
- GitHubFeaturePublisher
- azure.ts
- accept-stage-result.ts
- FeatureWorkspace.tsx
- OfficeSnapshot
- continuation-evidence.ts
- TimeBook.tsx
- preferences-store.ts
- .transaction
- knowledge.ts
- .save
- Store
- agents.ts
- shared.ts
- Coordinator
- daily-cto.ts
- scheduler.ts
- cec/workflow.ts
- jira-time.ts
- github-publication.ts
- retrospective-triggers.ts
- TicketJob
- conversations/slack.ts
- run-retrospective.ts
- goal-reviews.ts
- coordination.ts
- store.ts
- delivery-binding.ts
- jira-publication.ts
- features.ts
- publish-pr.ts
- dependencies.ts
- retrospective-subject.ts
- fact-bounds.ts
- ProjectProgress
- coordination-tick.ts
- weekly-rollup.ts
- offices.ts
- work.ts
- approval.ts
- .getEffect
- notifications.ts
- .pump
- GitHubMonitor
- DailyCTO.tsx
- knowledge-context.ts
- command-registry.ts
- session-bridge.ts
- saved-prerequisite-handoff.ts
- command
- activation-recovery.ts
- validate-stage.ts
- helper-evidence.py
- goal-evidence.ts
- Role
- .emit
- checkpoint-completion.ts
- engine.ts
- checkpoint-retry.ts
- provider-observation.ts
- dependency-edges.ts
- diagnostic-context.ts
- jira-operations.ts
- BrainFollowup

## God Nodes (most connected - your core abstractions)
1. `Store` - 224 edges
2. `TicketJob` - 116 edges
3. `GitHubDelivery` - 112 edges
4. `command()` - 86 edges
5. `artifact()` - 85 edges
6. `digest()` - 82 edges
7. `workKey()` - 69 edges
8. `cx()` - 69 edges
9. `StageResult` - 63 edges
10. `OfficeSnapshot` - 63 edges

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

## Communities (86 total, 4 thin omitted)

### Community 0 - "assignment-poll.ts"
Cohesion: 0.14
Nodes (21): syncOutbox(), recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot() (+13 more)

### Community 1 - "dependency-bots/adopt.ts"
Cohesion: 0.17
Nodes (27): Execute, readBackOrThrow(), adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR (+19 more)

### Community 3 - "it-specialist.ts"
Cohesion: 0.07
Nodes (29): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), partialLocalCleanupKey(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved() (+21 more)

### Community 4 - "source-amendment.ts"
Cohesion: 0.07
Nodes (65): adoptCandidate(), reported, Scope, approvedText(), assert(), amendmentIssueSha256(), authorizeSourceAmendment(), Binding (+57 more)

### Community 5 - "preparation-readback.ts"
Cohesion: 0.10
Nodes (36): candidateInput(), children, oldAdoptionBasis(), savedCandidateAdmission, bindPreparationBoardOrigins(), claimSchema, eventSchema, PreparationBoardOrigin (+28 more)

### Community 6 - "PeoplePanel.tsx"
Cohesion: 0.10
Nodes (40): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+32 more)

### Community 7 - "App.tsx"
Cohesion: 0.05
Nodes (41): themeColor, CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants, ElevatorPhase, floorVariants, leftDoor (+33 more)

### Community 8 - "Ticket"
Cohesion: 0.16
Nodes (9): cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), itChatPrompt(), slackSendPrompt(), goalReportContext(), Agents, WorkerRuntime (+1 more)

### Community 9 - "Inspector.tsx"
Cohesion: 0.09
Nodes (50): Conversation(), Outbox(), SendMessage, recommendedReply(), ServiceHealthPanel(), labels, ServiceHealthRow(), GoalList() (+42 more)

### Community 10 - "github-delivery.ts"
Cohesion: 0.06
Nodes (63): findingsBlock(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery(), BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE (+55 more)

### Community 11 - "OfficeScene.tsx"
Cohesion: 0.06
Nodes (52): itAgent(), itDiagnostics(), Avatar(), AzureWall(), Chair(), Coworker(), CTORoom(), Desk() (+44 more)

### Community 12 - "run-ci-repair.ts"
Cohesion: 0.21
Nodes (16): developerPRContent(), Execute, lintPRContent(), officePRContent(), prContent, ciCheckout(), verifyCIHooks(), CIFailure (+8 more)

### Community 13 - "requests.ts"
Cohesion: 0.12
Nodes (37): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutProviderEvidence() (+29 more)

### Community 14 - "brain-maintenance.ts"
Cohesion: 0.20
Nodes (10): maintenancePolicies(), reconcileNativeDelivery(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice(), easternDate() (+2 more)

### Community 15 - "artifact"
Cohesion: 0.14
Nodes (40): advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat(), assertPostConflictFiles(), completedConflictDraftCandidate(), postConflictPreparationEvidence() (+32 more)

### Community 16 - "scheduled-work.ts"
Cohesion: 0.13
Nodes (20): conversationResolved(), deliverySlot(), ROLES, stageRole(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), preparationRequestResolved(), withAmendmentOwnership() (+12 more)

### Community 17 - "index.ts"
Cohesion: 0.09
Nodes (33): args, [cmd,...rawArgs], commands, key, projectIndex, close(), config, itSpecialist (+25 more)

### Community 18 - "workKey"
Cohesion: 0.11
Nodes (36): partialLocalCleanupCandidate(), savedActivationFailure(), continuationScope(), brainImplementationCandidate(), BrainReadback, digest(), implementationRecoveryCandidate(), Ownership (+28 more)

### Community 19 - "index.tsx"
Cohesion: 0.12
Nodes (35): LessonsPanel(), when(), SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS (+27 more)

### Community 20 - "conversations/conversations.ts"
Cohesion: 0.11
Nodes (24): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, pumpCTO(), queueCTOHandoff(), saveGoals() (+16 more)

### Community 21 - "GitHubFeaturePublisher"
Cohesion: 0.29
Nodes (6): Assign, Board, GitHubFeaturePublisher, number(), same(), label()

### Community 22 - "azure.ts"
Cohesion: 0.22
Nodes (14): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+6 more)

### Community 23 - "accept-stage-result.ts"
Cohesion: 0.14
Nodes (41): containedFile(), acceptStageResult(), recordJobApproach(), finishLeadReview(), mergeAuthorized(), discoveryReviewSatisfied(), recoveredFindingsResolved(), savedPrerequisiteFindingsResolved() (+33 more)

### Community 24 - "FeatureWorkspace.tsx"
Cohesion: 0.17
Nodes (16): FeatureRound, FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures(), draftKey() (+8 more)

### Community 25 - "OfficeSnapshot"
Cohesion: 0.08
Nodes (49): projectOutbox(), knowledgeOutbox(), checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), repeatedVendorReviewBlock(), stoppedInVendorReview(), checkpointSuperseded() (+41 more)

### Community 26 - "continuation-evidence.ts"
Cohesion: 0.15
Nodes (27): closeoutCheckpoint(), closeoutRecoveryCandidate(), CloseoutRecoveryKind, coreCloseoutNative(), allowed, continuationArtifacts(), continuationNativeReview(), continuationReviewArtifacts() (+19 more)

### Community 27 - "TimeBook.tsx"
Cohesion: 0.16
Nodes (20): LiveAgentTask(), Props, RunningTask(), text(), AzureBuild, lastWall, sample(), subscribe() (+12 more)

### Community 28 - "preferences-store.ts"
Cohesion: 0.19
Nodes (10): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS (+2 more)

### Community 29 - ".transaction"
Cohesion: 0.25
Nodes (8): featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), recoverFeatures(), observeHelperGroups(), stopHelperGroups(), FeatureReviewRunner, Feature

### Community 30 - "knowledge.ts"
Cohesion: 0.10
Nodes (28): Accepted, normalizeStatement(), RETROSPECTIVE_HISTORY, decideOfficeProposal(), now(), OfficeKnowledgeStore, proposeOfficeLessons(), retireOfficeLesson() (+20 more)

### Community 31 - ".save"
Cohesion: 0.24
Nodes (23): BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue(), readIssues(), commentDecision() (+15 more)

### Community 32 - "Store"
Cohesion: 0.10
Nodes (10): Store, checkpointMeasurement(), HEARTBEAT_GAP_MS, HEARTBEAT_MS, startMeasurement(), WorkOutcome, WorkClaim, OfficeEvent (+2 more)

### Community 33 - "agents.ts"
Cohesion: 0.08
Nodes (34): cecIntakePrompt(), ReplySchema, ctoChatPrompt(), slackVerifyPrompt(), SlackResultSchema, SlackVerificationSchema, HANDS_OFF_RESOLUTION_GUIDANCE, RESOLUTION_GUIDANCE (+26 more)

### Community 34 - "shared.ts"
Cohesion: 0.08
Nodes (30): ProjectReadiness, DailyCTOSummary, SchedulerState, loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView(), acceptPreferences() (+22 more)

### Community 35 - "Coordinator"
Cohesion: 0.08
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 36 - "daily-cto.ts"
Cohesion: 0.12
Nodes (15): DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), dailyReviewDate(), reviewWeekday(), queueGoalEvidenceRequest(), DailyResultSchema (+7 more)

### Community 37 - "scheduler.ts"
Cohesion: 0.16
Nodes (13): officeCapacity, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch(), foreignWork() (+5 more)

### Community 38 - "cec/workflow.ts"
Cohesion: 0.11
Nodes (38): parksInJira(), MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), run(), advance(), nextStage(), publicationEvidenceGap() (+30 more)

### Community 39 - "jira-time.ts"
Cohesion: 0.13
Nodes (23): easternDay(), data(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), captureTime() (+15 more)

### Community 40 - "github-publication.ts"
Cohesion: 0.15
Nodes (26): Lane, MOVABLE, resolveLane(), cardStatus(), ProjectCard, projectCards(), projectGraphql(), setCardStatus() (+18 more)

### Community 41 - "retrospective-triggers.ts"
Cohesion: 0.13
Nodes (31): clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates(), maintenanceCompletedId(), maintenanceKey(), visibleMaintenanceTriggerIds(), clip() (+23 more)

### Community 42 - "TicketJob"
Cohesion: 0.11
Nodes (10): StageContext, GitHubDelivery, stagePrompt(), StagePromptInput, resumeReviewedMerge(), readPreparationProviderContext(), providerFacts(), executeRequest() (+2 more)

### Community 43 - "conversations/slack.ts"
Cohesion: 0.16
Nodes (15): reconcileNoticeConfirmations(), comparableSlackText(), SlackMessages, SlackRequestSchema, goalNoticeAuthorized(), goalNoticeNeverDispatched(), sendGoalNotice(), maintenanceNoticeAuthorized() (+7 more)

### Community 44 - "run-retrospective.ts"
Cohesion: 0.19
Nodes (17): acceptRetrospective(), busyMaintenanceIds(), retrospectivePrompt(), SUBJECT, RetrospectiveResultSchema, findSubject(), triggerJobId(), harperFolder() (+9 more)

### Community 45 - "goal-reviews.ts"
Cohesion: 0.15
Nodes (16): applyGoalReview(), EvidenceRefSchema, statusAllowed(), workEvidence(), GoalInput, saveGoal(), queueGoalNotice(), resolveProjectLabel() (+8 more)

### Community 46 - "coordination.ts"
Cohesion: 0.29
Nodes (11): hasUncertainEffects(), reconcileCloseout(), hours, ReviewResult, deferNonReady(), preparePR(), recheck(), recheckCandidate() (+3 more)

### Community 47 - "store.ts"
Cohesion: 0.19
Nodes (16): cecChatPrompt(), PICKUP_CHAT, CEC, DATA, LOCAL_BINDINGS, SKILLS, file, project (+8 more)

### Community 48 - "delivery-binding.ts"
Cohesion: 0.25
Nodes (17): dispatchNightly(), drainDelivery(), requestDelivery(), resume(), startPilot(), eligibility(), bindDelivery(), featureEffectGate() (+9 more)

### Community 49 - "jira-publication.ts"
Cohesion: 0.16
Nodes (14): Assignment, Content, JiraFeaturePublisher, jiraText(), keyOf(), plainDescription(), Transition, FeaturePublisher (+6 more)

### Community 50 - "features.ts"
Cohesion: 0.11
Nodes (32): reviewQuestions(), discoveryPrompt(), planPrompt(), document(), featureRoot(), DiscoverySchema, identity, manifestFromPlan() (+24 more)

### Community 51 - "publish-pr.ts"
Cohesion: 0.17
Nodes (24): moveLane(), harnessCloseout(), PASSING, verifyMergeActions(), activeEffectId(), harnessEffect, assertMayMutate(), retryRead() (+16 more)

### Community 52 - "dependencies.ts"
Cohesion: 0.23
Nodes (17): Admission, admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, compatible(), dependencyCompletionKey(), dependencyEligibility() (+9 more)

### Community 53 - "retrospective-subject.ts"
Cohesion: 0.13
Nodes (23): ARTIFACT_LIMIT, clip(), LEDGER_STEPS, MAINTENANCE_LIMIT, maintenanceFacts(), MaintenancePacketSection, maintenanceSubject(), MaintenanceSubjectFacts (+15 more)

### Community 54 - "fact-bounds.ts"
Cohesion: 0.26
Nodes (15): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+7 more)

### Community 55 - "ProjectProgress"
Cohesion: 0.24
Nodes (6): file, folder, logs, root, xml(), ProjectProgress

### Community 56 - "coordination-tick.ts"
Cohesion: 0.26
Nodes (10): reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION, checkpointWindow(), dueAt(), localDay(), tick() (+2 more)

### Community 57 - "weekly-rollup.ts"
Cohesion: 0.18
Nodes (17): deliveryMetrics(), median(), RollupResult, RollupResultSchema, retryDelay(), ineffectiveLessons(), lastFriday(), ROLLUP_HISTORY (+9 more)

### Community 58 - "offices.ts"
Cohesion: 0.16
Nodes (12): Clock, EASTERN, easternDayFormatter, easternPartsFormatter, systemClock, DELIVERY_CONCURRENCY, applyConnectionSettings(), closeConnection() (+4 more)

### Community 59 - "work.ts"
Cohesion: 0.12
Nodes (15): EffectOperation, AssignmentResult, CompletionCondition, Continuation, DependencyObservation, EligibilityState, FailureCategory, ReconciliationAction (+7 more)

### Community 60 - "approval.ts"
Cohesion: 0.25
Nodes (15): approveFeature(), assertRetainedItems(), commandFeature(), createFeature(), featureById(), mutation(), artifactPath(), digest() (+7 more)

### Community 61 - ".getEffect"
Cohesion: 0.24
Nodes (7): GitHubOperations, fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), closeNativeRefresh(), fingerprint(), EffectIntent

### Community 62 - "notifications.ts"
Cohesion: 0.14
Nodes (21): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR (+13 more)

### Community 63 - ".pump"
Cohesion: 0.21
Nodes (9): candidateOwner(), SETTLED, skipOwnedCandidate(), Skipped, skippedCandidateLedger(), GitHubMaintenance, partialVendorReview(), partialVendorReviewLedger() (+1 more)

### Community 65 - "DailyCTO.tsx"
Cohesion: 0.26
Nodes (8): CTOReview(), goalState, DailyCTO(), GoalHistory(), reportDate(), reviewStatus, reviewExcerpt(), ReviewText()

### Community 66 - "knowledge-context.ts"
Cohesion: 0.21
Nodes (11): Bucket, knowledgeContext(), LESSON_LIMIT, lessonPurpose(), MAINTENANCE, MAX_LESSONS, PURPOSES, render() (+3 more)

### Community 67 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 68 - "session-bridge.ts"
Cohesion: 0.33
Nodes (8): claudeSessions(), codexSessions(), desktopSessions(), guardianReview(), LiveSession, loadedCodexSession(), openRollouts(), SessionInventory

### Community 69 - "saved-prerequisite-handoff.ts"
Cohesion: 0.33
Nodes (13): PrerequisitesSchema, continuationWorktree(), dependencyVersion(), handoffSavedPrerequisites(), hasSavedPrerequisiteResult(), Ownership, qualified(), readDependencies() (+5 more)

### Community 70 - "command"
Cohesion: 0.25
Nodes (9): Result, Assessment, GIT_NETWORK, LIVE_PROVIDERS, liveReach(), networkUrl(), remoteUrls(), command() (+1 more)

### Community 71 - "activation-recovery.ts"
Cohesion: 0.12
Nodes (35): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+27 more)

### Community 72 - "validate-stage.ts"
Cohesion: 0.16
Nodes (17): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+9 more)

### Community 75 - "goal-evidence.ts"
Cohesion: 0.17
Nodes (16): AUTO_ADOPT_BOTS, githubPRDescription(), azureGoalFacts(), azurePRDescription(), boundedEvidence(), collectAzureGoalDocuments(), EvidenceStore, GOAL_EVIDENCE_LIMITS (+8 more)

### Community 76 - "Role"
Cohesion: 0.11
Nodes (26): cecPrompt(), resolvedDecisionNote(), stageInstructions, acceptConflictRepair(), APPROACH_GUIDANCE, ApproachSchema, nextJobStage(), reviewInstructions() (+18 more)

### Community 77 - ".emit"
Cohesion: 0.17
Nodes (21): retryRecipientLookup(), Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership (+13 more)

### Community 78 - "checkpoint-completion.ts"
Cohesion: 0.23
Nodes (8): BrainStatusSchema, identity, parseBrainStatus(), brainCheckpointCompletion(), coverageSchema, followupSchema, verified, reconcileCompletedCheckpoints()

### Community 79 - "engine.ts"
Cohesion: 0.33
Nodes (8): checkMail(), drainMail(), requestMail(), enableNightly(), ingest(), drainMaintenance(), reconcileMaintenance(), requestMaintenance()

### Community 80 - "checkpoint-retry.ts"
Cohesion: 0.39
Nodes (7): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), legacy, validateNativeContinuation()

### Community 81 - "provider-observation.ts"
Cohesion: 0.47
Nodes (4): correlatedBuild(), observe(), observeParked(), parkedReadError

### Community 82 - "dependency-edges.ts"
Cohesion: 1.00
Nodes (3): assertFeatureDependencyOrder(), featureDependencyEdges(), key()

### Community 83 - "diagnostic-context.ts"
Cohesion: 0.60
Nodes (3): diagnosticContext(), diagnosticSnapshot(), currentServices()

### Community 84 - "jira-operations.ts"
Cohesion: 0.60
Nodes (3): JiraOperations, plain(), unpack()

## Knowledge Gaps
- **296 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+291 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `assignment-poll.ts`, `dependency-bots/adopt.ts`, `Engine`, `it-specialist.ts`, `source-amendment.ts`, `preparation-readback.ts`, `Ticket`, `github-delivery.ts`, `requests.ts`, `brain-maintenance.ts`, `artifact`, `scheduled-work.ts`, `workKey`, `conversations/conversations.ts`, `GitHubFeaturePublisher`, `azure.ts`, `accept-stage-result.ts`, `OfficeSnapshot`, `continuation-evidence.ts`, `.transaction`, `knowledge.ts`, `.save`, `agents.ts`, `Coordinator`, `scheduler.ts`, `cec/workflow.ts`, `jira-time.ts`, `github-publication.ts`, `retrospective-triggers.ts`, `TicketJob`, `conversations/slack.ts`, `run-retrospective.ts`, `goal-reviews.ts`, `coordination.ts`, `store.ts`, `delivery-binding.ts`, `jira-publication.ts`, `features.ts`, `publish-pr.ts`, `dependencies.ts`, `retrospective-subject.ts`, `ProjectProgress`, `weekly-rollup.ts`, `offices.ts`, `approval.ts`, `.getEffect`, `notifications.ts`, `.pump`, `GitHubMonitor`, `knowledge-context.ts`, `session-bridge.ts`, `saved-prerequisite-handoff.ts`, `command`, `activation-recovery.ts`, `validate-stage.ts`, `goal-evidence.ts`, `Role`, `.emit`, `checkpoint-completion.ts`, `engine.ts`, `checkpoint-retry.ts`, `dependency-edges.ts`, `diagnostic-context.ts`, `jira-operations.ts`, `BrainFollowup`?**
  _High betweenness centrality (0.139) - this node is a cross-community bridge._
- **Why does `Coordinator` connect `Coordinator` to `assignment-poll.ts`, `activation-recovery.ts`, `requests.ts`, `coordination.ts`, `checkpoint-retry.ts`, `scheduled-work.ts`, `dependencies.ts`, `conversations/conversations.ts`, `coordination-tick.ts`, `offices.ts`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `TicketJob` connect `TicketJob` to `assignment-poll.ts`, `dependency-bots/adopt.ts`, `it-specialist.ts`, `source-amendment.ts`, `preparation-readback.ts`, `Inspector.tsx`, `github-delivery.ts`, `run-ci-repair.ts`, `requests.ts`, `artifact`, `scheduled-work.ts`, `workKey`, `accept-stage-result.ts`, `OfficeSnapshot`, `continuation-evidence.ts`, `shared.ts`, `scheduler.ts`, `cec/workflow.ts`, `github-publication.ts`, `retrospective-triggers.ts`, `delivery-binding.ts`, `publish-pr.ts`, `dependencies.ts`, `retrospective-subject.ts`, `fact-bounds.ts`, `ProjectProgress`, `saved-prerequisite-handoff.ts`, `activation-recovery.ts`, `validate-stage.ts`, `Role`, `.emit`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `command()` (e.g. with `.constructor()` and `executeRequest()`) actually correct?**
  _`command()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _296 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `assignment-poll.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14193548387096774 - nodes in this community are weakly interconnected._
- **Should `Engine` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._