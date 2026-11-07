# Graph Report - persona-role-names  (2026-11-06)

## Corpus Check
- 402 files · ~199,491 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2387 nodes · 10182 edges · 86 communities (82 shown, 4 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 51 edges (avg confidence: 0.74)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4e6a11e2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- github-delivery.ts
- index.tsx
- requests.ts
- source-amendment.ts
- TicketJob
- engine.ts
- post-conflict-preparation.ts
- shared.ts
- Inspector.tsx
- agents.ts
- OfficeScene.tsx
- digest
- artifact
- conversations/conversations.ts
- Store
- SettingsPanel.tsx
- maintenance.ts
- azure.ts
- work-summary.ts
- OfficeSnapshot
- approval.ts
- .save
- index.ts
- store.ts
- .transaction
- worker-runtime.ts
- Role
- .emit
- remove-candidate.ts
- conversations/slack.ts
- useLiveTiming.ts
- Coordinator
- jira-publication.ts
- dependency-bots/adopt.ts
- activation-recovery.ts
- features/workflow.ts
- retrospective-triggers.ts
- publish-pr.ts
- .getEffect
- run-retrospective.ts
- ControlStore
- tracking-issue.ts
- github-readiness.ts
- validate-stage.ts
- session-bridge.ts
- dependencies.ts
- jira-time.ts
- coordination.ts
- scheduled-work.ts
- daily-cto.ts
- it-specialist.ts
- github-publication.ts
- service-health.ts
- FeatureWorkspace.tsx
- features.ts
- retrospective-subject.ts
- run-ci-repair.ts
- knowledge.ts
- office-lessons.ts
- weekly-rollup.ts
- retrospective-facts.ts
- fact-bounds.ts
- config.ts
- preferences-store.ts
- continuation-evidence.ts
- Offices
- checkpoint-completion.ts
- assignment-poll.ts
- discovery-recovery.ts
- knowledge-context.ts
- record-trigger.ts
- time-readback.ts
- work.ts
- create-candidate.ts
- recovery-ledger.ts
- command-registry.ts
- office-config.ts
- read-retries.ts
- diagnostic-context.ts
- cli.ts
- http/context.ts
- time-classification.ts
- OfficeConfigView.tsx
- JiraWorklogs
- helper-evidence.py

## God Nodes (most connected - your core abstractions)
1. `Store` - 221 edges
2. `TicketJob` - 114 edges
3. `GitHubDelivery` - 112 edges
4. `command()` - 86 edges
5. `artifact()` - 85 edges
6. `digest()` - 82 edges
7. `workKey()` - 69 edges
8. `cx()` - 69 edges
9. `StageResult` - 63 edges
10. `OfficeSnapshot` - 63 edges

## Surprising Connections (you probably didn't know these)
- `projectOutbox()` --calls--> `parkedProviderWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts
- `projectOutbox()` --calls--> `readinessWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts
- `pump()` --calls--> `deferredPickup()`  [EXTRACTED]
  server/conversations/team-conversation-pump.ts → src/work/pickup-state.ts
- `IntakeContext` --references--> `PickupPolicy`  [EXTRACTED]
  server/delivery/intake/admission.ts → src/shared.ts
- `needsReconciliation()` --calls--> `workKey()`  [EXTRACTED]
  server/delivery/parking/retire-backlogged.ts → src/contracts/work.ts

## Import Cycles
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/scope-repair/scope-repair-resume.ts -> server/delivery/recovery/validation/validation-provider-context.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/preparation/post-conflict-preparation.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/stage-reconciliation.ts -> server/delivery/recovery/implementation/continuation-review-readback.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/conversations/conversations.ts -> server/scheduling/engine.ts -> server/workers/agents.ts -> server/conversations/conversations.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-publication.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/scheduling/coordination-pump.ts -> server/scheduling/requests.ts -> server/scheduling/coordination.ts -> server/scheduling/coordination-pump.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/implementation/activation-recovery.ts -> server/delivery/recovery/validation/validation-provider-context.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/implementation/continuation-guard.ts -> server/delivery/recovery/validation/validation-provider-context.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/implementation/saved-prerequisite-handoff.ts -> server/delivery/recovery/validation/validation-provider-context.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/preparation/post-conflict-preparation.ts -> server/delivery/recovery/validation/validation-provider-context.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-checkout.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-preparation.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/preparation/post-conflict-preparation.ts -> server/delivery/recovery/preparation/preparation-provider-context.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/preparation/post-conflict-preparation.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/preparation/post-conflict-preparation.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-evidence.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-guard.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/conversations/conversation-recovery.ts -> server/conversations/conversations.ts -> server/conversations/team-conversation-pump.ts -> server/conversations/conversation-recovery.ts`
- 3-file cycle: `server/scheduling/coordination-tick.ts -> server/scheduling/requests.ts -> server/scheduling/coordination.ts -> server/scheduling/coordination-tick.ts`

## Communities (86 total, 4 thin omitted)

### Community 0 - "github-delivery.ts"
Cohesion: 0.07
Nodes (73): containedFile(), findingsBlock(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery(), BOARD_RULE, conflictRefreshInstruction() (+65 more)

### Community 1 - "index.tsx"
Cohesion: 0.07
Nodes (59): SendMessage, labels, ServiceHealthRow(), LessonsPanel(), when(), CTOReview(), goalState, DailyCTO() (+51 more)

### Community 2 - "requests.ts"
Cohesion: 0.08
Nodes (55): recordJobApproach(), continuationScope(), continuationWorktree(), continuationGuard(), brainImplementationCandidate(), BrainReadback, digest(), implementationRecoveryCandidate() (+47 more)

### Community 3 - "source-amendment.ts"
Cohesion: 0.07
Nodes (64): adoptCandidate(), approvedText(), assert(), AMENDMENT_REVIEW_PROOF, amendmentIssueSha256(), authorizeSourceAmendment(), Binding, assert() (+56 more)

### Community 4 - "TicketJob"
Cohesion: 0.07
Nodes (33): dependabotReviewGuidance(), StageContext, GitHubDelivery, stagePrompt(), StagePromptInput, completedPRReviews(), reported, Scope (+25 more)

### Community 5 - "engine.ts"
Cohesion: 0.08
Nodes (52): checkMail(), drainMail(), requestMail(), parksInJira(), dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery() (+44 more)

### Community 6 - "post-conflict-preparation.ts"
Cohesion: 0.08
Nodes (50): savedActivationFailure(), postConflictPreparationEvidence(), within(), bindPreparationBoardOrigins(), claimSchema, eventSchema, PreparationBoardOrigin, timestamp (+42 more)

### Community 7 - "shared.ts"
Cohesion: 0.08
Nodes (50): ProjectReadiness, DailyCTOSummary, Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+42 more)

### Community 8 - "Inspector.tsx"
Cohesion: 0.05
Nodes (54): CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants, ElevatorPhase, floorVariants, leftDoor, OfficeScene (+46 more)

### Community 9 - "agents.ts"
Cohesion: 0.09
Nodes (36): plain(), cecPrompt(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), resolvedDecisionNote(), stageInstructions (+28 more)

### Community 10 - "OfficeScene.tsx"
Cohesion: 0.07
Nodes (50): Avatar(), AzureWall(), Chair(), Coworker(), CTORoom(), Desk(), Furnishings, Handoff() (+42 more)

### Community 11 - "digest"
Cohesion: 0.10
Nodes (52): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+44 more)

### Community 12 - "artifact"
Cohesion: 0.14
Nodes (44): assertContinuationWorker(), continuationWorkerProof(), candidateInput(), children, oldAdoptionBasis(), savedCandidateAdmission, assertPostConflictFiles(), completedConflictDraftCandidate() (+36 more)

### Community 13 - "conversations/conversations.ts"
Cohesion: 0.09
Nodes (29): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, pumpCTO(), queueCTOHandoff(), saveGoals() (+21 more)

### Community 14 - "Store"
Cohesion: 0.07
Nodes (14): JiraOperations, DeliveryTaskInput, Assessment, fingerprint(), Engine, Store, GIT_NETWORK, LIVE_PROVIDERS (+6 more)

### Community 15 - "SettingsPanel.tsx"
Cohesion: 0.13
Nodes (31): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS, PickupForm(), acceptPreferences() (+23 more)

### Community 16 - "maintenance.ts"
Cohesion: 0.12
Nodes (25): ApproachSchema, maintenancePolicies(), BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice(), candidateOwner(), SETTLED (+17 more)

### Community 17 - "azure.ts"
Cohesion: 0.11
Nodes (26): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+18 more)

### Community 18 - "work-summary.ts"
Cohesion: 0.13
Nodes (28): Outbox(), themeColor, App(), TicketDetail(), envelopeCard, deliveryRepairProjection(), DependencyNotice(), card (+20 more)

### Community 19 - "OfficeSnapshot"
Cohesion: 0.12
Nodes (23): conversationResolved(), projectOutbox(), syncOutbox(), knowledgeOutbox(), checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), repeatedVendorReviewBlock() (+15 more)

### Community 20 - "approval.ts"
Cohesion: 0.16
Nodes (23): approveFeature(), assertRetainedItems(), commandFeature(), createFeature(), featureById(), mutation(), reviewQuestions(), assertFeatureDependencyOrder() (+15 more)

### Community 21 - ".save"
Cohesion: 0.18
Nodes (27): correlatedBuild(), BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue(), readIssues() (+19 more)

### Community 22 - "index.ts"
Cohesion: 0.11
Nodes (24): close(), config, itSpecialist, loadedRevision, offices, releaseLock, server, serviceHealth (+16 more)

### Community 23 - "store.ts"
Cohesion: 0.12
Nodes (18): Clock, systemClock, DATA, applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, EffectOperation (+10 more)

### Community 24 - ".transaction"
Cohesion: 0.14
Nodes (17): featureItemComplete(), reconcileFeatureCompletion(), currentApproval(), featureGate(), predecessorComplete(), helperTelemetry(), recoverFeatures(), EvidenceSchema (+9 more)

### Community 25 - "worker-runtime.ts"
Cohesion: 0.12
Nodes (17): ReplySchema, SlackResultSchema, SlackVerificationSchema, contextPacket(), labels, toolActivity(), workerActivity(), claudeArguments() (+9 more)

### Community 26 - "Role"
Cohesion: 0.15
Nodes (16): ROLES, DeliverySlot, officeCapacity, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork() (+8 more)

### Community 27 - ".emit"
Cohesion: 0.16
Nodes (19): ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), configureNotices(), Identity, NoticeSettings, retryRecipientLookup() (+11 more)

### Community 28 - "remove-candidate.ts"
Cohesion: 0.17
Nodes (20): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+12 more)

### Community 29 - "conversations/slack.ts"
Cohesion: 0.15
Nodes (13): channelNoticeAuthorized(), MergeNotifications, reconcileNoticeConfirmations(), comparableSlackText(), SlackMessages, SlackRequestSchema, goalNoticeNeverDispatched(), maintenanceNoticeAuthorized() (+5 more)

### Community 30 - "useLiveTiming.ts"
Cohesion: 0.14
Nodes (23): displayAgentTask(), githubStageLabels, withoutElapsed(), LiveAgentTask(), Props, RunningTask(), text(), Agent (+15 more)

### Community 32 - "jira-publication.ts"
Cohesion: 0.24
Nodes (8): unpack(), Assignment, Content, JiraFeaturePublisher, jiraText(), keyOf(), plainDescription(), Transition

### Community 33 - "dependency-bots/adopt.ts"
Cohesion: 0.22
Nodes (20): Execute, adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR, openDependabotPulls() (+12 more)

### Community 34 - "activation-recovery.ts"
Cohesion: 0.19
Nodes (23): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+15 more)

### Community 35 - "features/workflow.ts"
Cohesion: 0.20
Nodes (17): discoveryPrompt(), planPrompt(), document(), featureRoot(), DiscoverySchema, identity, manifestFromPlan(), ManifestSchema (+9 more)

### Community 36 - "retrospective-triggers.ts"
Cohesion: 0.18
Nodes (22): clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates(), maintenanceCompletedId(), maintenanceKey(), visibleMaintenanceTriggerIds(), completedId() (+14 more)

### Community 37 - "publish-pr.ts"
Cohesion: 0.17
Nodes (18): activeEffectId(), harnessEffect, readBackOrThrow(), retryRead(), park(), developerPRContent(), Execute, lintPRContent() (+10 more)

### Community 38 - ".getEffect"
Cohesion: 0.22
Nodes (9): GitHubOperations, fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), goalNoticeAuthorized(), sendGoalNotice(), closeNativeRefresh(), Effects (+1 more)

### Community 39 - "run-retrospective.ts"
Cohesion: 0.15
Nodes (19): busyMaintenanceIds(), retrospectivePrompt(), SUBJECT, Kind, RetrospectiveResult, RetrospectiveResultSchema, Stage, triggerJobId() (+11 more)

### Community 40 - "ControlStore"
Cohesion: 0.20
Nodes (5): DailyCTO, Briefing, saveReviewBriefing(), ControlStore, DailyCTOReport

### Community 41 - "tracking-issue.ts"
Cohesion: 0.24
Nodes (19): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), ProjectCard, projectCards(), projectGraphql() (+11 more)

### Community 42 - "github-readiness.ts"
Cohesion: 0.19
Nodes (12): acceptConflictRepair(), APPROACH_GUIDANCE, nextJobStage(), reviewInstructions(), deliveryTask(), DISCOVERY_GUIDANCE, compactSteps(), reconcileCloseout() (+4 more)

### Community 43 - "validate-stage.ts"
Cohesion: 0.20
Nodes (15): HarnessControl, withHarnessWork(), runHarnessStage(), harnessStageResult(), receipt(), Check, harnessChecks(), harnessValidate() (+7 more)

### Community 44 - "session-bridge.ts"
Cohesion: 0.13
Nodes (14): file, folder, logs, root, xml(), ProjectProgress, claudeSessions(), codexSessions() (+6 more)

### Community 45 - "dependencies.ts"
Cohesion: 0.17
Nodes (24): Admission, admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, compatible(), dependencyCompletionKey(), dependencyEligibility() (+16 more)

### Community 46 - "jira-time.ts"
Cohesion: 0.22
Nodes (15): dailyReviewDate(), reviewWeekday(), EASTERN, easternDay(), easternDayFormatter, easternInstant(), easternPartsFormatter, data() (+7 more)

### Community 47 - "coordination.ts"
Cohesion: 0.18
Nodes (18): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation(), checkpointWindow(), dueAt() (+10 more)

### Community 48 - "scheduled-work.ts"
Cohesion: 0.19
Nodes (14): deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), deterministicActions, eligible() (+6 more)

### Community 49 - "daily-cto.ts"
Cohesion: 0.14
Nodes (16): EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), applyGoalReview(), DailyResultSchema, EvidenceRefSchema, FreshDailyResultSchema, statusAllowed() (+8 more)

### Community 50 - "it-specialist.ts"
Cohesion: 0.25
Nodes (12): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), partialLocalCleanupKey(), ITContext, readBackConversations(), publishITReport(), delays (+4 more)

### Community 51 - "github-publication.ts"
Cohesion: 0.17
Nodes (12): Assign, Board, Content, GitHubFeaturePublisher, number(), same(), FeaturePublisher, PublicationReceipt (+4 more)

### Community 52 - "service-health.ts"
Cohesion: 0.18
Nodes (9): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, slackHealth() (+1 more)

### Community 53 - "FeatureWorkspace.tsx"
Cohesion: 0.19
Nodes (13): FeatureRound, FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures(), draftKey() (+5 more)

### Community 54 - "features.ts"
Cohesion: 0.18
Nodes (14): assertFeatureApproach(), featureEffectGate(), assertFeatureGate(), bindFeature(), enrolled(), FeatureApproval, FeatureAttempt, FeatureBaseline (+6 more)

### Community 55 - "retrospective-subject.ts"
Cohesion: 0.20
Nodes (14): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+6 more)

### Community 56 - "run-ci-repair.ts"
Cohesion: 0.29
Nodes (10): ciCheckout(), verifyCIHooks(), CIFailure, prepareCIMetadataRepair(), publishCIRepair(), rewordCommits(), CIPlanSchema, runCIRepair() (+2 more)

### Community 57 - "knowledge.ts"
Cohesion: 0.19
Nodes (14): SEEDS, KnowledgeRetry, KnowledgeState, Lesson, LessonRecurrence, OfficeProposal, RepositoryInstruction, RetrospectiveEvent (+6 more)

### Community 58 - "office-lessons.ts"
Cohesion: 0.23
Nodes (10): Accepted, acceptRetrospective(), normalizeStatement(), RETROSPECTIVE_HISTORY, decideOfficeProposal(), now(), OfficeKnowledgeStore, proposeOfficeLessons() (+2 more)

### Community 59 - "weekly-rollup.ts"
Cohesion: 0.23
Nodes (15): RollupResult, RollupResultSchema, harperFolder(), retryDelay(), ineffectiveLessons(), lastFriday(), ROLLUP_HISTORY, rollupDue() (+7 more)

### Community 60 - "retrospective-facts.ts"
Cohesion: 0.22
Nodes (12): ARTIFACT_LIMIT, clip(), LEDGER_STEPS, MAINTENANCE_LIMIT, maintenanceFacts(), MaintenancePacketSection, clip(), PACKET_LIMIT (+4 more)

### Community 61 - "fact-bounds.ts"
Cohesion: 0.30
Nodes (13): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+5 more)

### Community 62 - "config.ts"
Cohesion: 0.24
Nodes (9): DELIVERY_CONCURRENCY, LOCAL_BINDINGS, ROOT, file, project, root, projectById(), projectData() (+1 more)

### Community 63 - "preferences-store.ts"
Cohesion: 0.21
Nodes (9): PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, SettingsPanel(), OFFICE_PREFERENCE_DEFAULTS (+1 more)

### Community 64 - "continuation-evidence.ts"
Cohesion: 0.38
Nodes (10): allowed, continuationNativeReview(), continuationReviewArtifacts(), negativeWorker(), reconcileContinuationReview(), savedNegativeContinuationReview(), ContinuationDecision, implementationContinuationDecision() (+2 more)

### Community 66 - "checkpoint-completion.ts"
Cohesion: 0.23
Nodes (8): BrainStatusSchema, identity, parseBrainStatus(), brainCheckpointCompletion(), coverageSchema, followupSchema, verified, DailyCheckpoint

### Community 67 - "assignment-poll.ts"
Cohesion: 0.22
Nodes (9): mergeText(), noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), pinCourier, resumeParked(), poll(), readAssignments() (+1 more)

### Community 68 - "discovery-recovery.ts"
Cohesion: 0.29
Nodes (10): Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership, rawHash() (+2 more)

### Community 69 - "knowledge-context.ts"
Cohesion: 0.21
Nodes (11): Bucket, knowledgeContext(), LESSON_LIMIT, lessonPurpose(), MAINTENANCE, MAX_LESSONS, PURPOSES, render() (+3 more)

### Community 70 - "record-trigger.ts"
Cohesion: 0.30
Nodes (11): clip(), JobLike, recordCIBudget(), recordParked(), recordRepairBudget(), recordTicketParked(), recordTrigger(), subjectOf() (+3 more)

### Community 71 - "time-readback.ts"
Cohesion: 0.20
Nodes (10): Readback, READBACK_INTERVAL_MS, SETTLE_MS, ConfirmedSegment, LiveAnchor, ObservationGap, SnapshotOrdering, TimeLedgerState (+2 more)

### Community 72 - "work.ts"
Cohesion: 0.15
Nodes (12): pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION, AssignmentResult, CompletionCondition, EligibilityState, FailureCategory, ReconciliationAction (+4 more)

### Community 73 - "create-candidate.ts"
Cohesion: 0.31
Nodes (9): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+1 more)

### Community 75 - "recovery-ledger.ts"
Cohesion: 0.38
Nodes (7): savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), diagnosticSnapshot(), nativeDeliveryResolved(), reconcileRecoveryLedger()

### Community 77 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 78 - "office-config.ts"
Cohesion: 0.42
Nodes (7): goalEvidencePath(), OfficeConfigInputs, officeConfigRoute(), officeConfigSummary(), CECBinding, localBindings, OfficeProject

### Community 79 - "read-retries.ts"
Cohesion: 0.43
Nodes (6): incompleteReadOutput(), IntakeResult, planReadRetry(), reconcileReadRetries(), WorkFailure, ReadRetry

### Community 80 - "diagnostic-context.ts"
Cohesion: 0.43
Nodes (4): itAgent(), itDiagnostics(), currentServices(), ServiceHealthPanel()

### Community 81 - "cli.ts"
Cohesion: 0.29
Nodes (5): args, [cmd,...rawArgs], commands, key, projectIndex

### Community 82 - "http/context.ts"
Cohesion: 0.48
Nodes (4): ITSpecialist, ServiceContext, runtimeRevision(), startServiceTicks()

### Community 83 - "time-classification.ts"
Cohesion: 0.62
Nodes (6): timeLedger(), artifact(), correctRecoveryClassification(), digest(), timeClassificationDigest(), TimeClassificationInput

### Community 84 - "OfficeConfigView.tsx"
Cohesion: 0.48
Nodes (5): loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView(), OfficeConfigSummary

## Knowledge Gaps
- **285 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+280 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `github-delivery.ts`, `requests.ts`, `source-amendment.ts`, `TicketJob`, `engine.ts`, `post-conflict-preparation.ts`, `agents.ts`, `digest`, `artifact`, `conversations/conversations.ts`, `maintenance.ts`, `azure.ts`, `OfficeSnapshot`, `approval.ts`, `.save`, `index.ts`, `store.ts`, `.transaction`, `worker-runtime.ts`, `Role`, `.emit`, `remove-candidate.ts`, `conversations/slack.ts`, `Coordinator`, `jira-publication.ts`, `dependency-bots/adopt.ts`, `activation-recovery.ts`, `features/workflow.ts`, `publish-pr.ts`, `.getEffect`, `run-retrospective.ts`, `tracking-issue.ts`, `github-readiness.ts`, `session-bridge.ts`, `dependencies.ts`, `jira-time.ts`, `coordination.ts`, `scheduled-work.ts`, `daily-cto.ts`, `it-specialist.ts`, `github-publication.ts`, `features.ts`, `retrospective-subject.ts`, `office-lessons.ts`, `weekly-rollup.ts`, `retrospective-facts.ts`, `config.ts`, `continuation-evidence.ts`, `Offices`, `checkpoint-completion.ts`, `assignment-poll.ts`, `discovery-recovery.ts`, `knowledge-context.ts`, `record-trigger.ts`, `time-readback.ts`, `create-candidate.ts`, `recovery-ledger.ts`, `read-retries.ts`, `diagnostic-context.ts`, `time-classification.ts`?**
  _High betweenness centrality (0.120) - this node is a cross-community bridge._
- **Why does `GitHubDelivery` connect `TicketJob` to `github-delivery.ts`, `continuation-evidence.ts`, `activation-recovery.ts`, `assignment-poll.ts`, `requests.ts`, `publish-pr.ts`, `discovery-recovery.ts`, `post-conflict-preparation.ts`, `source-amendment.ts`, `github-readiness.ts`, `validate-stage.ts`, `digest`, `dependencies.ts`, `Store`, `artifact`, `features.ts`, `run-ci-repair.ts`, `remove-candidate.ts`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `Role` connect `Role` to `github-delivery.ts`, `index.tsx`, `TicketJob`, `shared.ts`, `work.ts`, `agents.ts`, `github-readiness.ts`, `validate-stage.ts`, `Inspector.tsx`, `conversations/conversations.ts`, `OfficeScene.tsx`, `maintenance.ts`, `OfficeSnapshot`, `store.ts`, `retrospective-subject.ts`, `worker-runtime.ts`, `.emit`, `config.ts`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `command()` (e.g. with `.constructor()` and `executeRequest()`) actually correct?**
  _`command()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _285 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `github-delivery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06825619448340346 - nodes in this community are weakly interconnected._
- **Should `index.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.075 - nodes in this community are weakly interconnected._