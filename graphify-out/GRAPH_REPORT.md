# Graph Report - office  (2026-11-09)

## Corpus Check
- 530 files · ~251,092 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2984 nodes · 12708 edges · 99 communities (96 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 68 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3474aa6c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- schedule.ts
- Inspector.tsx
- artifact
- .save
- App.tsx
- github-delivery.ts
- source-amendment.ts
- TicketJob
- closeout-recovery.ts
- store.ts
- workKey
- OfficeScene.tsx
- shared.ts
- index.ts
- worker-runtime.ts
- .transaction
- PeoplePanel.tsx
- maintenance.ts
- assignment-poll.ts
- record-trigger.ts
- run-accounting.ts
- features/workflow.ts
- Goals.tsx
- daily-cto.ts
- conversations/slack.ts
- investigations/run.ts
- SettingsPanel.tsx
- session-bridge.ts
- command
- conversations/conversations.ts
- retrospective-subject.ts
- telemetry.ts
- knowledge.ts
- outbox.ts
- cec/workflow.ts
- tracking-issue.ts
- cost-ledger.ts
- scope-repair-resume.ts
- TimeBook.tsx
- cec/issue-publication.ts
- scheduler.ts
- offices.ts
- adopted-review-candidate.ts
- Store
- Coordinator
- review-run.ts
- goal-reporting.ts
- notifications.ts
- http/commands.ts
- dependencies.ts
- features.ts
- GitHubIssuePublisher
- coordination-tick.ts
- coordination.ts
- time-scope.ts
- goal-reviews.ts
- WorkTime
- validate-stage.ts
- publication.ts
- useLiveTiming.ts
- azure.ts
- engine.ts
- assertMayMutate
- lesson-selection.ts
- run-retrospective.ts
- weekly-rollup.ts
- process.ts
- service-health.ts
- weekly-research.ts
- team-conversation-pump.ts
- scheduled-work.ts
- accept-retrospective.ts
- .now
- queue-repairs.ts
- harnessEffect
- fact-bounds.ts
- control-store.ts
- .emit
- publish-pr.ts
- saved-prerequisite-handoff.ts
- delivery-binding.ts
- work.ts
- checkpoint-completion.ts
- Offices
- projects.ts
- cost-totals.ts
- time-readback.ts
- follow-up-alerts.ts
- command-registry.ts
- requeue-waited-implement.ts
- delivery-task.ts
- codex-rollout.ts
- cli.ts
- liveReach
- FeatureWorkflow
- highestStableAtLeast
- slack-supersession.ts
- helper-evidence.py

## God Nodes (most connected - your core abstractions)
1. `Store` - 279 edges
2. `TicketJob` - 125 edges
3. `GitHubDelivery` - 119 edges
4. `command()` - 100 edges
5. `artifact()` - 87 edges
6. `digest()` - 84 edges
7. `cx()` - 77 edges
8. `workKey()` - 75 edges
9. `OfficeSnapshot` - 66 edges
10. `StageResult` - 64 edges

## Surprising Connections (you probably didn't know these)
- `readAzurePRs()` --indirect_call--> `row()`  [INFERRED]
  server/cec/observed-prs.ts → src/telemetry/report.ts
- `rows()` --indirect_call--> `row()`  [INFERRED]
  server/delivery/recovery/source-amendment/source-amendment-held.ts → src/telemetry/report.ts
- `proveOutsideAmendmentUnchanged()` --indirect_call--> `row()`  [INFERRED]
  server/delivery/recovery/source-amendment/source-amendment-held.ts → src/telemetry/report.ts
- `rows()` --indirect_call--> `row()`  [INFERRED]
  server/delivery/recovery/source-amendment/source-amendment-scope.ts → src/telemetry/report.ts
- `tree()` --indirect_call--> `row()`  [INFERRED]
  server/features/planning-baseline.ts → src/telemetry/report.ts

## Import Cycles
- 3-file cycle: `server/knowledge/slack-intake/progress.ts -> server/knowledge/slack-intake/read-links.ts -> server/knowledge/slack-intake/seed-status.ts -> server/knowledge/slack-intake/progress.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/stage-reconciliation.ts -> server/delivery/recovery/implementation/continuation-review-readback.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/recovery/retire-external-delivery.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-guard.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/queue-repairs.ts -> server/delivery/repairs/reconcile-ci-diagnosis.ts -> server/delivery/pipeline/github-delivery.ts`
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

## Communities (99 total, 3 thin omitted)

### Community 0 - "schedule.ts"
Cohesion: 0.07
Nodes (83): KnowledgeRunner, retryDelay(), captureProposal(), effectId(), newTask(), recordObservation(), settlePage(), Config (+75 more)

### Community 1 - "Inspector.tsx"
Cohesion: 0.07
Nodes (74): Conversation(), Outbox(), slackMessageStatus(), SlackDeliveryCard(), ServiceHealthPanel(), labels, ServiceHealthRow(), BlockerFollowups() (+66 more)

### Community 2 - "artifact"
Cohesion: 0.09
Nodes (74): allowed, continuationNativeReview(), continuationWorkerProof(), negativeWorker(), candidateInput(), children, oldAdoptionBasis(), savedCandidateAdmission (+66 more)

### Community 3 - ".save"
Cohesion: 0.06
Nodes (51): file, folder, logs, root, xml(), BLOCKED, Execute, findComment() (+43 more)

### Community 4 - "App.tsx"
Cohesion: 0.05
Nodes (66): itAgent(), itDiagnostics(), themeColor, App(), CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants (+58 more)

### Community 5 - "github-delivery.ts"
Cohesion: 0.08
Nodes (62): containedFile(), findingsBlock(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery(), BOARD_RULE, conflictRefreshInstruction() (+54 more)

### Community 6 - "source-amendment.ts"
Cohesion: 0.06
Nodes (70): stagePrompt(), StagePromptInput, adoptCandidate(), reported, Scope, directionContract(), scopeRepairDirection(), approvedText() (+62 more)

### Community 7 - "TicketJob"
Cohesion: 0.08
Nodes (38): dependabotReviewGuidance(), StageContext, GitHubDelivery, observe(), checksFailed(), checksPassed(), checksPending(), CurrentChecksWait (+30 more)

### Community 8 - "closeout-recovery.ts"
Cohesion: 0.08
Nodes (57): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+49 more)

### Community 9 - "store.ts"
Cohesion: 0.09
Nodes (39): cecPrompt(), resolvedDecisionNote(), stageInstructions, cecChatPrompt(), ctoChatPrompt(), itChatPrompt(), HANDS_OFF_RESOLUTION_GUIDANCE, RESOLUTION_GUIDANCE (+31 more)

### Community 10 - "workKey"
Cohesion: 0.08
Nodes (46): recordJobApproach(), completedPRReviews(), continuationScope(), Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput (+38 more)

### Community 11 - "OfficeScene.tsx"
Cohesion: 0.07
Nodes (48): Avatar(), AzureWall(), Chair(), Coworker(), CTORoom(), Desk(), Floor, Furnishings (+40 more)

### Community 12 - "shared.ts"
Cohesion: 0.06
Nodes (41): fields, PreferencesPatch, StoredBody, ProjectReadiness, DailyCTOSummary, SchedulerState, IntakeSummary(), loadOfficeConfig() (+33 more)

### Community 13 - "index.ts"
Cohesion: 0.09
Nodes (36): featureRoute(), close(), config, itSpecialist, loadedRevision, offices, releaseLock, server (+28 more)

### Community 14 - "worker-runtime.ts"
Cohesion: 0.09
Nodes (35): AUTO_ADOPT_BOTS, assignmentSubject(), IntakeConfig, ROOT, localBindings, assertModelOverrides(), CODEX_DEFAULT_EFFORT, CODEX_DEFAULT_MODEL (+27 more)

### Community 15 - ".transaction"
Cohesion: 0.12
Nodes (38): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+30 more)

### Community 16 - "PeoplePanel.tsx"
Cohesion: 0.10
Nodes (38): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+30 more)

### Community 17 - "maintenance.ts"
Cohesion: 0.10
Nodes (28): maintenancePolicies(), captureMaintenanceStep(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice(), candidateOwner() (+20 more)

### Community 18 - "assignment-poll.ts"
Cohesion: 0.11
Nodes (32): retryCandidateCleanup(), readBackOrThrow(), adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR (+24 more)

### Community 19 - "record-trigger.ts"
Cohesion: 0.11
Nodes (36): baselineLearning(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences(), clip(), maintenanceBlockedId(), MaintenanceCandidate (+28 more)

### Community 20 - "run-accounting.ts"
Cohesion: 0.11
Nodes (36): BoundedRead, done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf(), EvidenceOutcome, backfillClaudeCost() (+28 more)

### Community 21 - "features/workflow.ts"
Cohesion: 0.15
Nodes (30): approveFeature(), assertRetainedItems(), commandFeature(), createFeature(), mutation(), reviewQuestions(), discoveryPrompt(), planPrompt() (+22 more)

### Community 22 - "Goals.tsx"
Cohesion: 0.09
Nodes (29): FeatureRound, SendMessage, FeatureDelivery(), FeatureDocuments(), views, phases, LinkedFeatures(), draftKey() (+21 more)

### Community 23 - "daily-cto.ts"
Cohesion: 0.12
Nodes (15): DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), dailyReviewDate(), reviewWeekday(), queueGoalEvidenceRequest(), DailyResultSchema (+7 more)

### Community 24 - "conversations/slack.ts"
Cohesion: 0.10
Nodes (16): cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), slackSendPrompt(), slackVerifyPrompt(), comparableSlackText(), settleRequestedSlackReplacement() (+8 more)

### Community 25 - "investigations/run.ts"
Cohesion: 0.13
Nodes (24): investigationCandidates(), investigationId(), investigationEvidence(), investigationFollowUps(), investigationResolution(), syncInvestigations(), OFFICE_FIX_PROMPT, OfficeFixResult (+16 more)

### Community 26 - "SettingsPanel.tsx"
Cohesion: 0.16
Nodes (25): FeatureWorkspace(), SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS, PickupForm() (+17 more)

### Community 27 - "session-bridge.ts"
Cohesion: 0.12
Nodes (23): claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexSessionContext(), readRollout, claudeSessions(), codexSessions() (+15 more)

### Community 28 - "command"
Cohesion: 0.07
Nodes (8): correlatedBuild(), JiraOperations, plain(), Engine, observe(), observeParked(), parkedReadError, command()

### Community 29 - "conversations/conversations.ts"
Cohesion: 0.12
Nodes (17): ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff(), saveGoals() (+9 more)

### Community 30 - "retrospective-subject.ts"
Cohesion: 0.11
Nodes (27): deliveryMetrics(), median(), ARTIFACT_LIMIT, clip(), LEDGER_STEPS, MAINTENANCE_LIMIT, maintenanceFacts(), MaintenancePacketSection (+19 more)

### Community 31 - "telemetry.ts"
Cohesion: 0.09
Nodes (28): CodexRollout, CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL (+20 more)

### Community 32 - "knowledge.ts"
Cohesion: 0.09
Nodes (28): retrospectivePrompt(), SUBJECT, Kind, Stage, SEEDS, BlockerFollowup, ImprovementGrant, KnowledgeRetry (+20 more)

### Community 33 - "outbox.ts"
Cohesion: 0.16
Nodes (22): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), projectOutbox(), syncOutbox(), projectSlackDeliveries(), Input (+14 more)

### Community 34 - "cec/workflow.ts"
Cohesion: 0.18
Nodes (25): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), run(), advance(), nextStage(), publicationEvidenceGap(), qaEvidenceGap() (+17 more)

### Community 35 - "tracking-issue.ts"
Cohesion: 0.19
Nodes (25): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard, projectCards() (+17 more)

### Community 36 - "cost-ledger.ts"
Cohesion: 0.18
Nodes (24): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId(), OutsideEdit (+16 more)

### Community 37 - "scope-repair-resume.ts"
Cohesion: 0.17
Nodes (26): Assessment, outsideScanSources(), Ownership, reconcileScopeRepairReadback(), requireThat(), scopeRepairReadbackCandidate(), scopeRepairRequestResolved(), sha (+18 more)

### Community 38 - "TimeBook.tsx"
Cohesion: 0.17
Nodes (22): TelemetryReport, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens(), usd(), KpiTiles() (+14 more)

### Community 39 - "cec/issue-publication.ts"
Cohesion: 0.21
Nodes (9): Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), plainDescription(), Transition, unpack() (+1 more)

### Community 40 - "scheduler.ts"
Cohesion: 0.15
Nodes (13): ROLES, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch(), foreignWork() (+5 more)

### Community 41 - "offices.ts"
Cohesion: 0.15
Nodes (18): savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), ITContext, diagnosticSnapshot(), publishITReport(), nativeDeliveryResolved() (+10 more)

### Community 42 - "adopted-review-candidate.ts"
Cohesion: 0.21
Nodes (17): removeAdoptedClone(), lintPRContent(), adoptedReviewCandidate(), ciCheckout(), finishCISetup(), verifyCIHooks(), CIFailure, guardCIRepair() (+9 more)

### Community 43 - "Store"
Cohesion: 0.17
Nodes (17): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+9 more)

### Community 44 - "Coordinator"
Cohesion: 0.08
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 45 - "review-run.ts"
Cohesion: 0.17
Nodes (15): featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), recoverFeatures(), EvidenceSchema, helperInstallation(), readReview(), ReviewEvidence (+7 more)

### Community 46 - "goal-reporting.ts"
Cohesion: 0.14
Nodes (18): GitHubMonitor, githubPRDescription(), azureGoalFacts(), azurePRDescription(), boundedEvidence(), collectAzureGoalDocuments(), EvidenceStore, GOAL_EVIDENCE_LIMITS (+10 more)

### Community 47 - "notifications.ts"
Cohesion: 0.16
Nodes (20): ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR, plainSlackText() (+12 more)

### Community 48 - "http/commands.ts"
Cohesion: 0.20
Nodes (19): normalizeStatement(), configureKnowledge(), declineLessonIssue(), demoteLesson(), reactivateLesson(), retireLesson(), decideOfficeProposal(), mirrorOfficeKnowledge() (+11 more)

### Community 49 - "dependencies.ts"
Cohesion: 0.20
Nodes (18): Admission, admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, resumeParked(), compatible(), dependencyCompletionKey() (+10 more)

### Community 50 - "features.ts"
Cohesion: 0.15
Nodes (18): assertFeatureDependencyOrder(), featureDependencyEdges(), key(), admitImprovement(), improvementManifest(), improvementMarker(), improvementProvider(), linkedRepairGap() (+10 more)

### Community 51 - "GitHubIssuePublisher"
Cohesion: 0.22
Nodes (8): GitHubFeaturePublisher, PublicationReceipt, Assign, Board, GitHubIssuePublisher, number(), same(), label()

### Community 52 - "coordination-tick.ts"
Cohesion: 0.13
Nodes (14): reconcileNoticeConfirmations(), improvementEligible(), queueImprovements(), BrainFollowup, legacy, reconcileContinuations(), startServiceTicks(), pruneCompletedReads() (+6 more)

### Community 53 - "coordination.ts"
Cohesion: 0.17
Nodes (19): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation(), checkpointWindow(), dueAt() (+11 more)

### Community 54 - "time-scope.ts"
Cohesion: 0.22
Nodes (18): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), scopeSelector(), midnight(), TicketDay, ticketDayTotals(), captureTime(), artifact() (+10 more)

### Community 55 - "goal-reviews.ts"
Cohesion: 0.15
Nodes (16): applyGoalReview(), EvidenceRefSchema, statusAllowed(), workEvidence(), GoalInput, saveGoal(), queueGoalNotice(), resolveProjectLabel() (+8 more)

### Community 56 - "WorkTime"
Cohesion: 0.17
Nodes (19): ConfirmedSegment, LiveAnchor, ObservationGap, SnapshotOrdering, TimeLedgerState, TimePublication, WorkTime, Acc (+11 more)

### Community 57 - "validate-stage.ts"
Cohesion: 0.17
Nodes (16): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+8 more)

### Community 58 - "publication.ts"
Cohesion: 0.21
Nodes (10): featureById(), currentApproval(), Link, linkFeature(), FeaturePublisher, publishFeature(), reserveIdentity(), scheduledFeatures() (+2 more)

### Community 59 - "useLiveTiming.ts"
Cohesion: 0.19
Nodes (16): LiveAgentTask(), Props, RunningTask(), text(), AzureBuild, lastWall, sample(), subscribe() (+8 more)

### Community 60 - "azure.ts"
Cohesion: 0.20
Nodes (14): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+6 more)

### Community 61 - "engine.ts"
Cohesion: 0.23
Nodes (15): checkMail(), drainMail(), requestMail(), dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), resume() (+7 more)

### Community 62 - "assertMayMutate"
Cohesion: 0.29
Nodes (12): harnessCloseout(), PASSING, verifyMergeActions(), assertMayMutate(), runHarnessStage(), harnessStageResult(), receipt(), harnessDraft() (+4 more)

### Community 63 - "lesson-selection.ts"
Cohesion: 0.19
Nodes (16): knowledgeContext(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), LessonSelection, MAINTENANCE (+8 more)

### Community 64 - "run-retrospective.ts"
Cohesion: 0.21
Nodes (14): learningDigest(), recordLearningOpportunity(), appendLearningFacts(), freezeLearningPacket(), busyMaintenanceIds(), RetrospectiveResultSchema, triggerJobId(), KnowledgeRunOptions (+6 more)

### Community 65 - "weekly-rollup.ts"
Cohesion: 0.19
Nodes (16): learningMetrics(), lessonsNeedingReview(), RollupResult, RollupResultSchema, harperFolder(), RETROSPECTIVE_TIMEOUT, ROLLUP_HISTORY, rollupDue() (+8 more)

### Community 66 - "process.ts"
Cohesion: 0.23
Nodes (12): At, Errno, GroupInventory, GroupProbe, LifecycleDiagnostic, Phase, Pid, groupInventory() (+4 more)

### Community 67 - "service-health.ts"
Cohesion: 0.19
Nodes (8): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, ServiceHealth

### Community 68 - "weekly-research.ts"
Cohesion: 0.21
Nodes (12): publicTopicSafe(), researchTopics(), TEMPLATES, mirror(), ResearchResult, runWeeklyResearch(), scheduledResearch(), PREVIOUS_RESEARCH_PROFILE_UNAVAILABLE (+4 more)

### Community 69 - "team-conversation-pump.ts"
Cohesion: 0.24
Nodes (11): assertConversationReadback(), finishSupersededReadback(), pump(), PickupSchema, savePickup(), harperHandoff(), acceptedGoalReport(), permitsGoalEvidenceReturn() (+3 more)

### Community 70 - "scheduled-work.ts"
Cohesion: 0.24
Nodes (14): deliverySlot(), closeoutRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), deterministicActions, eligible(), requestResolved(), scheduledWork() (+6 more)

### Community 71 - "accept-retrospective.ts"
Cohesion: 0.23
Nodes (13): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, distinct(), identity(), improvementIncident(), improvementIncidentKey(), IMPROVEMENT_POLICY (+5 more)

### Community 72 - ".now"
Cohesion: 0.16
Nodes (6): checkpointMeasurement(), HEARTBEAT_GAP_MS, HEARTBEAT_MS, startMeasurement(), WorkOutcome, WorkClaim

### Community 73 - "queue-repairs.ts"
Cohesion: 0.31
Nodes (12): namedRepairIds(), amendmentRepairView(), approachFingerprint(), enqueueRepairDiagnosis(), githubRepairEligible(), jiraRepairable(), REPAIR_DIAGNOSIS, repairFindingIds() (+4 more)

### Community 74 - "harnessEffect"
Cohesion: 0.31
Nodes (12): activeEffectId(), harnessEffect, park(), officeMergeProvenance(), reconcileMergeScannerRetry(), Retry, retryMergeScanner(), retryReadBack() (+4 more)

### Community 75 - "fact-bounds.ts"
Cohesion: 0.30
Nodes (13): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+5 more)

### Community 76 - "control-store.ts"
Cohesion: 0.23
Nodes (7): Clock, applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, statementCache(), initialSnapshot()

### Community 77 - ".emit"
Cohesion: 0.28
Nodes (8): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent()

### Community 78 - "publish-pr.ts"
Cohesion: 0.26
Nodes (12): retryRead(), developerPRContent(), Execute, officePRContent(), prContent, assertCandidate(), Candidate, Execute (+4 more)

### Community 79 - "saved-prerequisite-handoff.ts"
Cohesion: 0.33
Nodes (13): PrerequisitesSchema, continuationWorktree(), dependencyVersion(), handoffSavedPrerequisites(), hasSavedPrerequisiteResult(), Ownership, qualified(), readDependencies() (+5 more)

### Community 80 - "delivery-binding.ts"
Cohesion: 0.31
Nodes (9): featureEffectGate(), assertFeatureGate(), bindFeature(), enrolled(), featureGate(), predecessorComplete(), gateFeatureWork(), improvementIntakeGate() (+1 more)

### Community 81 - "work.ts"
Cohesion: 0.15
Nodes (13): AssignmentResult, CompletionCondition, DependencyObservation, EligibilityState, FailureCategory, Prerequisite, ReconciliationAction, ReconciliationRequest (+5 more)

### Community 82 - "checkpoint-completion.ts"
Cohesion: 0.24
Nodes (7): BrainStatusSchema, identity, brainCheckpointCompletion(), coverageSchema, followupSchema, verified, DailyCheckpoint

### Community 84 - "projects.ts"
Cohesion: 0.22
Nodes (8): LOCAL_BINDINGS, file, project, root, contextPacket(), DeliverySlot, projectById(), PROJECTS

### Community 85 - "cost-totals.ts"
Cohesion: 0.33
Nodes (9): isModelWork(), isTicketModelWork(), ScopePolicy, awaitingEvidence(), CaptureContext, inCostWindow(), TicketCost, ticketCosts() (+1 more)

### Community 86 - "time-readback.ts"
Cohesion: 0.33
Nodes (7): timeLedger(), TimeLedger, dueReadback(), Readback, READBACK_INTERVAL_MS, readBackTime(), SETTLE_MS

### Community 87 - "follow-up-alerts.ts"
Cohesion: 0.38
Nodes (7): checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), repeatedVendorReviewBlock(), stoppedInVendorReview(), maintenanceSuperseded(), REOBSERVED

### Community 88 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 89 - "requeue-waited-implement.ts"
Cohesion: 0.39
Nodes (6): parksInJira(), DECISION_KINDS, needsDecision(), APPROACH_GUARD_REJECTION, failedWorker(), requeueWaitedImplement()

### Community 90 - "delivery-task.ts"
Cohesion: 0.33
Nodes (6): deliveryTask(), DeliveryTaskInput, DISCOVERY_GUIDANCE, compactSteps(), AMENDMENT_REVIEW_PROOF, deliveryResearchContext()

### Community 91 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 92 - "cli.ts"
Cohesion: 0.25
Nodes (6): args, [cmd,...rawArgs], commands, key, projectIndex, PORT

### Community 93 - "liveReach"
Cohesion: 0.60
Nodes (5): GIT_NETWORK, LIVE_PROVIDERS, liveReach(), networkUrl(), remoteUrls()

### Community 95 - "highestStableAtLeast"
Cohesion: 0.83
Nodes (3): compare(), highestStableAtLeast(), parts()

### Community 96 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

## Knowledge Gaps
- **355 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+350 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `schedule.ts`, `artifact`, `.save`, `App.tsx`, `github-delivery.ts`, `source-amendment.ts`, `TicketJob`, `closeout-recovery.ts`, `store.ts`, `workKey`, `shared.ts`, `index.ts`, `worker-runtime.ts`, `.transaction`, `maintenance.ts`, `assignment-poll.ts`, `record-trigger.ts`, `run-accounting.ts`, `features/workflow.ts`, `daily-cto.ts`, `conversations/slack.ts`, `investigations/run.ts`, `session-bridge.ts`, `command`, `conversations/conversations.ts`, `retrospective-subject.ts`, `outbox.ts`, `cec/workflow.ts`, `tracking-issue.ts`, `cost-ledger.ts`, `scope-repair-resume.ts`, `cec/issue-publication.ts`, `scheduler.ts`, `offices.ts`, `adopted-review-candidate.ts`, `Coordinator`, `review-run.ts`, `goal-reporting.ts`, `notifications.ts`, `http/commands.ts`, `dependencies.ts`, `features.ts`, `GitHubIssuePublisher`, `coordination-tick.ts`, `coordination.ts`, `time-scope.ts`, `goal-reviews.ts`, `validate-stage.ts`, `publication.ts`, `azure.ts`, `engine.ts`, `assertMayMutate`, `lesson-selection.ts`, `run-retrospective.ts`, `weekly-rollup.ts`, `weekly-research.ts`, `team-conversation-pump.ts`, `scheduled-work.ts`, `accept-retrospective.ts`, `.now`, `queue-repairs.ts`, `harnessEffect`, `control-store.ts`, `.emit`, `publish-pr.ts`, `saved-prerequisite-handoff.ts`, `delivery-binding.ts`, `checkpoint-completion.ts`, `Offices`, `time-readback.ts`, `requeue-waited-implement.ts`, `delivery-task.ts`, `FeatureWorkflow`?**
  _High betweenness centrality (0.114) - this node is a cross-community bridge._
- **Why does `OfficeSnapshot` connect `App.tsx` to `Inspector.tsx`, `store.ts`, `OfficeScene.tsx`, `shared.ts`, `PeoplePanel.tsx`, `maintenance.ts`, `record-trigger.ts`, `Goals.tsx`, `investigations/run.ts`, `SettingsPanel.tsx`, `outbox.ts`, `cec/workflow.ts`, `TimeBook.tsx`, `scheduler.ts`, `Store`, `useLiveTiming.ts`, `azure.ts`, `service-health.ts`, `team-conversation-pump.ts`, `follow-up-alerts.ts`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `Role` connect `store.ts` to `Inspector.tsx`, `App.tsx`, `github-delivery.ts`, `TicketJob`, `OfficeScene.tsx`, `shared.ts`, `worker-runtime.ts`, `PeoplePanel.tsx`, `maintenance.ts`, `run-accounting.ts`, `conversations/slack.ts`, `conversations/conversations.ts`, `retrospective-subject.ts`, `outbox.ts`, `cec/workflow.ts`, `scheduler.ts`, `http/commands.ts`, `validate-stage.ts`, `team-conversation-pump.ts`, `.emit`, `work.ts`, `projects.ts`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `command()` (e.g. with `.constructor()` and `executeRequest()`) actually correct?**
  _`command()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _355 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `schedule.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06937420986093552 - nodes in this community are weakly interconnected._
- **Should `Inspector.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06596578025149454 - nodes in this community are weakly interconnected._