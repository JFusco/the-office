# Graph Report - office  (2026-11-09)

## Corpus Check
- 527 files · ~249,927 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2969 nodes · 12619 edges · 101 communities (99 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 68 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `75733b37`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Inspector.tsx
- assignment-poll.ts
- source-amendment.ts
- App.tsx
- github-delivery.ts
- OfficeScene.tsx
- store.ts
- requests.ts
- activation-recovery.ts
- conversations/conversations.ts
- process.ts
- blocker-followups.ts
- index.ts
- features/workflow.ts
- preparation-readback.ts
- OfficeSnapshot
- PeoplePanel.tsx
- notifications.ts
- maintenance.ts
- shared.ts
- worker-runtime.ts
- TimeBook.tsx
- Store
- read-links.ts
- artifact
- mutedCopy
- TicketJob
- StageResult
- digest
- github/issue-publication.ts
- knowledge.ts
- session-bridge.ts
- weekly-rollup.ts
- offices.ts
- run-retrospective.ts
- command
- cost-ledger.ts
- delivery-repairs.ts
- adopted-review-candidate.ts
- WorkTime
- http/commands.ts
- record-trigger.ts
- .save
- schedule.ts
- GitHubDelivery
- cec/issue-publication.ts
- ControlStore
- queue-repairs.ts
- outbox.ts
- remove-candidate.ts
- dependencies.ts
- goal-evidence.ts
- scheduled-work.ts
- .getEffect
- Coordinator
- validate-stage.ts
- saved-prerequisite-handoff.ts
- retrospective-subject.ts
- scheduler.ts
- azure.ts
- run-accounting.ts
- effects.ts
- delivery-binding.ts
- features.ts
- goal-reviews.ts
- coordination.ts
- time-scope.ts
- engine.ts
- workKey
- currentAssignment
- slack-intake/run.ts
- lesson-selection.ts
- run-cost.ts
- work.ts
- ServiceHealthPanel.tsx
- learning-events.ts
- fact-bounds.ts
- codex-rollout.ts
- github-context.ts
- review-run.ts
- propose-improvements.ts
- scheduled-retrospectives.ts
- cec/workflow.ts
- admit-improvement.ts
- checkpoint-completion.ts
- coordination-tick.ts
- .value
- discovery-recovery.ts
- control-store.ts
- telemetry.ts
- telemetry/report.ts
- helper-usage.ts
- cost-totals.ts
- follow-up-alerts.ts
- command-registry.ts
- cli.ts
- codex-rollout-file.ts
- brain-followup.ts
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
- 3-file cycle: `server/scheduling/coordination-pump.ts -> server/scheduling/requests.ts -> server/scheduling/coordination.ts -> server/scheduling/coordination-pump.ts`

## Communities (101 total, 2 thin omitted)

### Community 0 - "Inspector.tsx"
Cohesion: 0.07
Nodes (68): Conversation(), Outbox(), slackMessageStatus(), SlackDeliveryCard(), labels, BlockerFollowups(), LessonsPanel(), when() (+60 more)

### Community 1 - "assignment-poll.ts"
Cohesion: 0.08
Nodes (62): noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), Lane, MOVABLE, moveLane(), resolveLane(), cardStatus() (+54 more)

### Community 2 - "source-amendment.ts"
Cohesion: 0.07
Nodes (67): adoptCandidate(), reported, Scope, approvedText(), assert(), AMENDMENT_REVIEW_PROOF, amendmentInstruction(), amendmentIssueSha256() (+59 more)

### Community 3 - "App.tsx"
Cohesion: 0.05
Nodes (60): themeColor, App(), CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants, ElevatorPhase, floorVariants (+52 more)

### Community 4 - "github-delivery.ts"
Cohesion: 0.10
Nodes (53): findingsBlock(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery(), discover(), refreshDependencies(), routeExisting() (+45 more)

### Community 5 - "OfficeScene.tsx"
Cohesion: 0.06
Nodes (56): displayAgentTask(), githubStageLabels, withoutElapsed(), LiveAgentTask(), Props, RunningTask(), text(), Avatar() (+48 more)

### Community 6 - "store.ts"
Cohesion: 0.09
Nodes (38): cecPrompt(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), resolvedDecisionNote(), stageInstructions, cecChatPrompt() (+30 more)

### Community 7 - "requests.ts"
Cohesion: 0.10
Nodes (50): closeoutReceipt(), resumeReviewedMerge(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2 (+42 more)

### Community 8 - "activation-recovery.ts"
Cohesion: 0.10
Nodes (46): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+38 more)

### Community 9 - "conversations/conversations.ts"
Cohesion: 0.08
Nodes (34): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+26 more)

### Community 10 - "process.ts"
Cohesion: 0.08
Nodes (37): investigationEvidence(), OFFICE_FIX_PROMPT, OfficeFixResult, validateOfficeFix(), OFFICE_SOURCE_PATHS, officeSource(), investigationReady(), INVESTIGATION_ATTEMPTS (+29 more)

### Community 11 - "blocker-followups.ts"
Cohesion: 0.11
Nodes (29): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), ITContext, readBackConversations(), diagnosticSnapshot(), investigationCandidates(), investigationId() (+21 more)

### Community 12 - "index.ts"
Cohesion: 0.09
Nodes (36): featureRoute(), close(), config, itSpecialist, loadedRevision, offices, releaseLock, server (+28 more)

### Community 13 - "features/workflow.ts"
Cohesion: 0.12
Nodes (35): approveFeature(), assertRetainedItems(), commandFeature(), createFeature(), featureById(), mutation(), reviewQuestions(), discoveryPrompt() (+27 more)

### Community 14 - "preparation-readback.ts"
Cohesion: 0.11
Nodes (39): bindPreparationBoardOrigins(), claimSchema, eventSchema, PreparationBoardOrigin, readPreparationBoardOrigins(), timestamp, updateSchema, nativeCompletion() (+31 more)

### Community 15 - "OfficeSnapshot"
Cohesion: 0.08
Nodes (34): FeatureRound, SendMessage, FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures() (+26 more)

### Community 16 - "PeoplePanel.tsx"
Cohesion: 0.10
Nodes (38): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+30 more)

### Community 17 - "notifications.ts"
Cohesion: 0.10
Nodes (28): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR (+20 more)

### Community 18 - "maintenance.ts"
Cohesion: 0.10
Nodes (27): maintenancePolicies(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice(), candidateOwner(), SETTLED (+19 more)

### Community 19 - "shared.ts"
Cohesion: 0.07
Nodes (35): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, IntakeSummary(), acceptPreferences() (+27 more)

### Community 20 - "worker-runtime.ts"
Cohesion: 0.10
Nodes (31): contextPacket(), CODEX_DEFAULT_EFFORT, CODEX_DEFAULT_MODEL, CODEX_EFFORTS, CODEX_ROLES, ModelRoute, qaPolicyRoute(), resolveModelRoute() (+23 more)

### Community 21 - "TimeBook.tsx"
Cohesion: 0.11
Nodes (34): AzureBuild, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens(), usd(), KpiTiles() (+26 more)

### Community 22 - "Store"
Cohesion: 0.10
Nodes (19): featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), recoverFeatures(), maintainLearning(), dispatchExposure(), runRollup(), reconcileNativeDelivery() (+11 more)

### Community 23 - "read-links.ts"
Cohesion: 0.13
Nodes (31): effectId(), Config, digest(), IntakeConfig, privateFile(), readConfig(), ToolNames, CaptureReceipt (+23 more)

### Community 24 - "artifact"
Cohesion: 0.14
Nodes (36): verifiedCloseoutCleanupRequest(), savedAdmissionUnresolved(), assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), completedConflictDraftUnresolved(), postConflictPreparationEvidence(), readPostConflictPreparationFacts() (+28 more)

### Community 25 - "mutedCopy"
Cohesion: 0.15
Nodes (27): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView() (+19 more)

### Community 26 - "TicketJob"
Cohesion: 0.09
Nodes (22): BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction(), dependabotReviewGuidance(), StageContext, stagePrompt(), StagePromptInput (+14 more)

### Community 27 - "StageResult"
Cohesion: 0.14
Nodes (27): harnessCloseout(), PASSING, verifyMergeActions(), assertMayMutate(), retryRead(), runHarnessStage(), harnessStageResult(), receipt() (+19 more)

### Community 28 - "digest"
Cohesion: 0.13
Nodes (33): containedFile(), closeoutRequestResolved(), candidateInput(), children, oldAdoptionBasis(), savedCandidateAdmission, preparationRequestResolved(), Assessment (+25 more)

### Community 29 - "github/issue-publication.ts"
Cohesion: 0.16
Nodes (13): FeaturePublisher, PublicationReceipt, publishFeature(), reserveIdentity(), Assign, Board, Content, GitHubIssuePublisher (+5 more)

### Community 30 - "knowledge.ts"
Cohesion: 0.08
Nodes (30): learningMetrics(), lessonsNeedingReview(), Kind, RetrospectiveResult, RollupResultSchema, Stage, SEEDS, BlockerFollowup (+22 more)

### Community 31 - "session-bridge.ts"
Cohesion: 0.12
Nodes (23): claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexSessionContext(), readRollout, claudeSessions(), codexSessions() (+15 more)

### Community 32 - "weekly-rollup.ts"
Cohesion: 0.12
Nodes (24): KnowledgeRunner, RETROSPECTIVE_TIMEOUT, retryDelay(), mirror(), ResearchResult, runWeeklyResearch(), scheduledResearch(), ROLLUP_HISTORY (+16 more)

### Community 33 - "offices.ts"
Cohesion: 0.10
Nodes (14): readLocalIntakeReport(), DELIVERY_CONCURRENCY, LOCAL_BINDINGS, file, project, root, DeliverySlot, officeCapacity (+6 more)

### Community 34 - "run-retrospective.ts"
Cohesion: 0.12
Nodes (25): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, appendLearningFacts(), freezeLearningPacket(), ARTIFACT_LIMIT, clip(), LEDGER_STEPS (+17 more)

### Community 35 - "command"
Cohesion: 0.08
Nodes (8): correlatedBuild(), JiraOperations, plain(), Engine, observe(), observeParked(), parkedReadError, command()

### Community 36 - "cost-ledger.ts"
Cohesion: 0.18
Nodes (24): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId(), OutsideEdit (+16 more)

### Community 37 - "delivery-repairs.ts"
Cohesion: 0.17
Nodes (24): parksInJira(), run(), qaEvidenceGap(), namedRepairIds(), DECISION_KINDS, needsDecision(), afterDraft(), ApproachSchema (+16 more)

### Community 38 - "adopted-review-candidate.ts"
Cohesion: 0.20
Nodes (18): removeAdoptedClone(), lintPRContent(), adoptedReviewCandidate(), ciCheckout(), finishCISetup(), verifyCIHooks(), CIFailure, guardCIRepair() (+10 more)

### Community 39 - "WorkTime"
Cohesion: 0.13
Nodes (22): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+14 more)

### Community 40 - "http/commands.ts"
Cohesion: 0.17
Nodes (22): retryRecipientLookup(), normalizeStatement(), baselineLearning(), configureKnowledge(), declineLessonIssue(), demoteLesson(), reactivateLesson(), retireLesson() (+14 more)

### Community 41 - "record-trigger.ts"
Cohesion: 0.15
Nodes (25): LEARNING_BASELINES, clip(), JobLike, recordCIBudget(), recordParked(), recordRepairBudget(), recordTechnicalBudget(), recordTicketParked() (+17 more)

### Community 42 - ".save"
Cohesion: 0.23
Nodes (24): unpack(), BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue(), readIssues() (+16 more)

### Community 43 - "schedule.ts"
Cohesion: 0.23
Nodes (19): captureProposal(), newTask(), recordObservation(), settlePage(), configDigest(), IntakeLedger, acceptProposals(), runSlackLinks() (+11 more)

### Community 44 - "GitHubDelivery"
Cohesion: 0.12
Nodes (9): GitHubDelivery, advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat(), recoverImplementation(), reconcileScopeRepairReadback() (+1 more)

### Community 45 - "cec/issue-publication.ts"
Cohesion: 0.22
Nodes (7): Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), plainDescription(), Transition

### Community 46 - "ControlStore"
Cohesion: 0.17
Nodes (7): DailyCTO, dailyReviewPrompt(), DailyResultSchema, Briefing, saveReviewBriefing(), ControlStore, DailyCTOReport

### Community 47 - "queue-repairs.ts"
Cohesion: 0.22
Nodes (18): checksFailed(), checksPassed(), checksPending(), CurrentChecksWait, currentMergeChecks(), pass(), pending(), requireThat() (+10 more)

### Community 48 - "outbox.ts"
Cohesion: 0.19
Nodes (15): conversationResolved(), projectOutbox(), syncOutbox(), projectSlackDeliveries(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint() (+7 more)

### Community 49 - "remove-candidate.ts"
Cohesion: 0.20
Nodes (16): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+8 more)

### Community 50 - "dependencies.ts"
Cohesion: 0.22
Nodes (19): Admission, admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, resumeParked(), compatible(), dependencyCompletionKey() (+11 more)

### Community 51 - "goal-evidence.ts"
Cohesion: 0.15
Nodes (15): AUTO_ADOPT_BOTS, GitHubMonitor, githubPRDescription(), azureGoalFacts(), boundedEvidence(), EvidenceStore, GOAL_EVIDENCE_LIMITS, goalEvidencePath() (+7 more)

### Community 52 - "scheduled-work.ts"
Cohesion: 0.17
Nodes (18): deliverySlot(), withAmendmentOwnership(), RollupResult, scheduledSlackIntake(), RollupHooks, deterministicActions, eligible(), KnowledgeOptions (+10 more)

### Community 53 - ".getEffect"
Cohesion: 0.22
Nodes (8): GitHubOperations, fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), Assessment, closeNativeRefresh(), fingerprint(), EffectIntent

### Community 54 - "Coordinator"
Cohesion: 0.09
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 55 - "validate-stage.ts"
Cohesion: 0.16
Nodes (17): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+9 more)

### Community 56 - "saved-prerequisite-handoff.ts"
Cohesion: 0.19
Nodes (20): PrerequisitesSchema, blob(), Execute, inspectPartialWorktree(), partialLocalCleanupCandidate(), partialLocalCleanupKey(), requireProof(), statIdentity() (+12 more)

### Community 57 - "retrospective-subject.ts"
Cohesion: 0.17
Nodes (18): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, maintenanceKey(), azurePrUrl(), findSubject(), jobSubject() (+10 more)

### Community 58 - "scheduler.ts"
Cohesion: 0.20
Nodes (10): fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch(), foreignWork(), WorkSlot (+2 more)

### Community 59 - "azure.ts"
Cohesion: 0.18
Nodes (16): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+8 more)

### Community 60 - "run-accounting.ts"
Cohesion: 0.15
Nodes (18): BoundedRead, EvidenceOutcome, backfillClaudeCost(), CompletionReader, claudeAccounting(), COMPLETION_MAX_BYTES, completionAccounting(), readCompletion() (+10 more)

### Community 61 - "effects.ts"
Cohesion: 0.21
Nodes (13): activeEffectId(), officeMergeProvenance(), reconcileMergeScannerRetry(), Retry, retryMergeScanner(), retryReadBack(), runIdentity(), savedRetry() (+5 more)

### Community 62 - "delivery-binding.ts"
Cohesion: 0.23
Nodes (14): approvedDelivery(), bindDelivery(), featureDeliveryContext(), featureEffectGate(), assertFeatureGate(), bindFeature(), currentApproval(), enrolled() (+6 more)

### Community 63 - "features.ts"
Cohesion: 0.15
Nodes (13): assertFeatureDependencyOrder(), featureDependencyEdges(), key(), GitHubFeaturePublisher, JiraFeaturePublisher, Feature, FeatureApproval, FeatureAttempt (+5 more)

### Community 64 - "goal-reviews.ts"
Cohesion: 0.15
Nodes (15): applyGoalReview(), EvidenceRefSchema, FreshDailyResultSchema, statusAllowed(), workEvidence(), GoalInput, queueGoalNotice(), DailyCTOBriefing (+7 more)

### Community 65 - "coordination.ts"
Cohesion: 0.19
Nodes (17): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation(), checkpointWindow(), dueAt() (+9 more)

### Community 66 - "time-scope.ts"
Cohesion: 0.24
Nodes (16): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), scopeSelector(), midnight(), TicketDay, ticketDayTotals(), captureTime(), artifact() (+8 more)

### Community 67 - "engine.ts"
Cohesion: 0.23
Nodes (15): checkMail(), drainMail(), requestMail(), dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), resume() (+7 more)

### Community 68 - "workKey"
Cohesion: 0.22
Nodes (14): savedActivationFailure(), brainImplementationCandidate(), implementationRecoveryCandidate(), recoveredFindingsResolved(), Assessment, Ownership, reconcileValidation(), validationReadbackCandidate() (+6 more)

### Community 69 - "currentAssignment"
Cohesion: 0.25
Nodes (14): allowed, continuationNativeReview(), continuationReviewArtifacts(), negativeWorker(), reconcileContinuationReview(), savedNegativeContinuationReview(), ContinuationDecision, implementationContinuationDecision() (+6 more)

### Community 70 - "slack-intake/run.ts"
Cohesion: 0.21
Nodes (13): Observation, Message, observeRead(), Page, readArguments(), readMethod(), ReadUnavailable, IntakeRateLimit (+5 more)

### Community 71 - "lesson-selection.ts"
Cohesion: 0.20
Nodes (15): knowledgeContext(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), MAINTENANCE, MAX_LESSONS (+7 more)

### Community 72 - "run-cost.ts"
Cohesion: 0.17
Nodes (15): CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL, Rates (+7 more)

### Community 73 - "work.ts"
Cohesion: 0.13
Nodes (16): ProjectReadiness, AssignmentResult, CompletionCondition, Continuation, DependencyObservation, EligibilityState, ExecutionLane, FailureCategory (+8 more)

### Community 74 - "ServiceHealthPanel.tsx"
Cohesion: 0.21
Nodes (11): diagnosticContext(), DailyCTOSummary, itAgent(), itDiagnostics(), currentServices(), ServiceHealthPanel(), ServiceHealthRow(), HealthReport (+3 more)

### Community 75 - "learning-events.ts"
Cohesion: 0.24
Nodes (12): improvementIntakeGate(), captureLearning(), learningDigest(), recordLearningOpportunity(), expireLearningPackets(), packetReferences(), captureMaintenanceStep(), publicTopicSafe() (+4 more)

### Community 76 - "fact-bounds.ts"
Cohesion: 0.26
Nodes (15): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+7 more)

### Community 77 - "codex-rollout.ts"
Cohesion: 0.18
Nodes (13): add(), CodexRequest, CodexRollout, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens() (+5 more)

### Community 78 - "github-context.ts"
Cohesion: 0.22
Nodes (9): APPROACH_GUIDANCE, reviewInstructions(), deliveryTask(), DeliveryTaskInput, DISCOVERY_GUIDANCE, compactSteps(), reconcileCloseout(), deliveryResearchContext() (+1 more)

### Community 79 - "review-run.ts"
Cohesion: 0.24
Nodes (8): EvidenceSchema, helperInstallation(), readReview(), ReviewEvidence, observeHelperGroups(), stopHelperGroups(), FeatureReviewRunner, prepareExposure()

### Community 80 - "propose-improvements.ts"
Cohesion: 0.22
Nodes (12): distinct(), identity(), improvementIncident(), improvementIncidentKey(), assignmentSubject(), LessonSelection, IMPROVEMENT_POLICY, improvementDigest() (+4 more)

### Community 81 - "scheduled-retrospectives.ts"
Cohesion: 0.24
Nodes (13): busyMaintenanceIds(), clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates(), maintenanceCompletedId(), visibleMaintenanceTriggerIds(), TerminalCandidate (+5 more)

### Community 82 - "cec/workflow.ts"
Cohesion: 0.26
Nodes (11): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), advance(), nextStage(), publicationEvidenceGap(), resultGate(), stageResultGap() (+3 more)

### Community 83 - "admit-improvement.ts"
Cohesion: 0.30
Nodes (9): admitImprovement(), improvementEligible(), improvementManifest(), improvementMarker(), improvementProvider(), linkedRepairGap(), queueImprovements(), FeatureManifest (+1 more)

### Community 84 - "checkpoint-completion.ts"
Cohesion: 0.21
Nodes (9): BrainStatusSchema, identity, brainCheckpointCompletion(), coverageSchema, followupSchema, verified, reconcileCompletedCheckpoints(), ReconciliationRequest (+1 more)

### Community 85 - "coordination-tick.ts"
Cohesion: 0.24
Nodes (10): legacy, reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION, tick(), incompleteReadOutput(), IntakeResult (+2 more)

### Community 86 - ".value"
Cohesion: 0.24
Nodes (6): file, folder, logs, root, xml(), ProjectProgress

### Community 87 - "discovery-recovery.ts"
Cohesion: 0.29
Nodes (10): Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership, rawHash() (+2 more)

### Community 88 - "control-store.ts"
Cohesion: 0.26
Nodes (6): systemClock, applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, statementCache()

### Community 89 - "telemetry.ts"
Cohesion: 0.17
Nodes (11): CostCompleteness, CostComponent, CostLedgerState, ProviderBasis, RunCost, TelemetryReport, TelemetryRow, TelemetrySync (+3 more)

### Community 90 - "telemetry/report.ts"
Cohesion: 0.33
Nodes (11): Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked(), row() (+3 more)

### Community 91 - "helper-usage.ts"
Cohesion: 0.35
Nodes (9): done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf(), codexHome(), HELPER_STDOUT_MAX_BYTES, helperAccounting() (+1 more)

### Community 92 - "cost-totals.ts"
Cohesion: 0.33
Nodes (9): isModelWork(), isTicketModelWork(), ScopePolicy, awaitingEvidence(), CaptureContext, inCostWindow(), TicketCost, ticketCosts() (+1 more)

### Community 93 - "follow-up-alerts.ts"
Cohesion: 0.38
Nodes (7): checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), repeatedVendorReviewBlock(), stoppedInVendorReview(), maintenanceSuperseded(), REOBSERVED

### Community 94 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 95 - "cli.ts"
Cohesion: 0.25
Nodes (6): args, [cmd,...rawArgs], commands, key, projectIndex, PORT

### Community 96 - "codex-rollout-file.ts"
Cohesion: 0.36
Nodes (7): createdAt(), dayDirs(), header(), readCodexRollout(), ROLLOUT_MAX_BYTES, RolloutScan, scanCodexRollouts()

### Community 98 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

## Knowledge Gaps
- **353 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+348 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `assignment-poll.ts`, `source-amendment.ts`, `github-delivery.ts`, `store.ts`, `requests.ts`, `activation-recovery.ts`, `conversations/conversations.ts`, `process.ts`, `blocker-followups.ts`, `index.ts`, `features/workflow.ts`, `preparation-readback.ts`, `OfficeSnapshot`, `notifications.ts`, `maintenance.ts`, `worker-runtime.ts`, `read-links.ts`, `artifact`, `TicketJob`, `StageResult`, `digest`, `github/issue-publication.ts`, `session-bridge.ts`, `weekly-rollup.ts`, `offices.ts`, `run-retrospective.ts`, `command`, `cost-ledger.ts`, `delivery-repairs.ts`, `adopted-review-candidate.ts`, `WorkTime`, `http/commands.ts`, `record-trigger.ts`, `.save`, `schedule.ts`, `GitHubDelivery`, `cec/issue-publication.ts`, `outbox.ts`, `remove-candidate.ts`, `dependencies.ts`, `goal-evidence.ts`, `scheduled-work.ts`, `.getEffect`, `Coordinator`, `validate-stage.ts`, `saved-prerequisite-handoff.ts`, `retrospective-subject.ts`, `scheduler.ts`, `azure.ts`, `run-accounting.ts`, `effects.ts`, `delivery-binding.ts`, `features.ts`, `goal-reviews.ts`, `coordination.ts`, `time-scope.ts`, `engine.ts`, `workKey`, `currentAssignment`, `slack-intake/run.ts`, `lesson-selection.ts`, `ServiceHealthPanel.tsx`, `learning-events.ts`, `github-context.ts`, `review-run.ts`, `propose-improvements.ts`, `scheduled-retrospectives.ts`, `admit-improvement.ts`, `checkpoint-completion.ts`, `coordination-tick.ts`, `.value`, `discovery-recovery.ts`, `control-store.ts`, `brain-followup.ts`?**
  _High betweenness centrality (0.113) - this node is a cross-community bridge._
- **Why does `command()` connect `command` to `assignment-poll.ts`, `github-delivery.ts`, `store.ts`, `requests.ts`, `activation-recovery.ts`, `process.ts`, `blocker-followups.ts`, `features/workflow.ts`, `notifications.ts`, `maintenance.ts`, `worker-runtime.ts`, `read-links.ts`, `StageResult`, `github/issue-publication.ts`, `session-bridge.ts`, `offices.ts`, `cost-ledger.ts`, `delivery-repairs.ts`, `adopted-review-candidate.ts`, `WorkTime`, `.save`, `GitHubDelivery`, `cec/issue-publication.ts`, `remove-candidate.ts`, `dependencies.ts`, `goal-evidence.ts`, `scheduled-work.ts`, `.getEffect`, `Coordinator`, `validate-stage.ts`, `saved-prerequisite-handoff.ts`, `azure.ts`, `effects.ts`, `features.ts`, `coordination.ts`, `engine.ts`, `github-context.ts`, `review-run.ts`, `admit-improvement.ts`, `.value`, `command-registry.ts`, `brain-followup.ts`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `Role` connect `store.ts` to `Inspector.tsx`, `App.tsx`, `github-delivery.ts`, `OfficeScene.tsx`, `conversations/conversations.ts`, `OfficeSnapshot`, `PeoplePanel.tsx`, `maintenance.ts`, `shared.ts`, `worker-runtime.ts`, `Store`, `TicketJob`, `offices.ts`, `delivery-repairs.ts`, `http/commands.ts`, `outbox.ts`, `validate-stage.ts`, `retrospective-subject.ts`, `scheduler.ts`, `run-accounting.ts`, `work.ts`, `github-context.ts`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `command()` (e.g. with `.constructor()` and `executeRequest()`) actually correct?**
  _`command()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _353 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Inspector.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06886446886446887 - nodes in this community are weakly interconnected._
- **Should `assignment-poll.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07581545694975023 - nodes in this community are weakly interconnected._