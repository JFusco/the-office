# Graph Report - the-office  (2026-11-09)

## Corpus Check
- 524 files · ~247,791 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2957 nodes · 12523 edges · 100 communities (97 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 68 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f301b607`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- source-amendment.ts
- github-delivery.ts
- artifact
- .transaction
- index.tsx
- OfficeScene.tsx
- TicketJob
- activation-recovery.ts
- PeoplePanel.tsx
- Inspector.tsx
- maintenance.ts
- preparation-readback.ts
- TimeBook.tsx
- digest
- index.ts
- process.ts
- worker-runtime.ts
- .getEffect
- conversations/conversations.ts
- slack-intake/run.ts
- work-summary.ts
- agents.ts
- it-specialist.ts
- cec/issue-publication.ts
- SettingsPanel.tsx
- .emit
- azure.ts
- Store
- run-retrospective.ts
- knowledge.ts
- run-cost.ts
- session-bridge.ts
- run-accounting.ts
- scheduler.ts
- cec/workflow.ts
- OfficeSnapshot
- .save
- source-amendment-scope.ts
- weekly-rollup.ts
- time-scope.ts
- dependency-bots/adopt.ts
- command
- remove-candidate.ts
- preferences-store.ts
- jira-time.ts
- schedule.ts
- daily-cto.ts
- coordination-tick.ts
- Coordinator
- harnessEffect
- github-check-selection.ts
- delivery-binding.ts
- tracking-issue.ts
- record-trigger.ts
- notifications.ts
- dependencies.ts
- workKey
- accept-retrospective.ts
- retrospective-subject.ts
- GitHubIssuePublisher
- publish-pr.ts
- investigations/run.ts
- goal-reviews.ts
- lesson-selection.ts
- outbox.ts
- validate-stage.ts
- service-health.ts
- admit-improvement.ts
- contract.ts
- github-closeout.ts
- assignment-poll.ts
- investigations/ledger.ts
- discovery-recovery.ts
- control-store.ts
- scheduled-work.ts
- learning-events.ts
- migrations.ts
- coordination.ts
- lessons-view.ts
- saved-prerequisite-handoff.ts
- work.ts
- offices.ts
- telemetry.ts
- Offices
- blocker-followups.ts
- DailyCTO.tsx
- recovery-ledger.ts
- evidence.ts
- scheduled-retrospectives.ts
- shared.ts
- command-registry.ts
- codex-rollout.ts
- research-profile.ts
- cost-totals.ts
- liveReach
- slack-supersession.ts
- helper-evidence.py
- BrainFollowup
- highestStableAtLeast

## God Nodes (most connected - your core abstractions)
1. `Store` - 277 edges
2. `TicketJob` - 122 edges
3. `GitHubDelivery` - 118 edges
4. `command()` - 99 edges
5. `artifact()` - 85 edges
6. `digest()` - 82 edges
7. `cx()` - 77 edges
8. `workKey()` - 73 edges
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

## Communities (100 total, 3 thin omitted)

### Community 0 - "source-amendment.ts"
Cohesion: 0.10
Nodes (53): adoptCandidate(), reported, Scope, Assessment, outsideScanSources(), Ownership, reconcileScopeRepairReadback(), requireThat() (+45 more)

### Community 1 - "github-delivery.ts"
Cohesion: 0.08
Nodes (66): containedFile(), findingsBlock(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery(), BOARD_RULE, conflictRefreshInstruction() (+58 more)

### Community 2 - "artifact"
Cohesion: 0.12
Nodes (53): allowed, continuationNativeReview(), continuationReviewArtifacts(), continuationWorkerProof(), negativeWorker(), savedNegativeContinuationReview(), candidateInput(), children (+45 more)

### Community 3 - ".transaction"
Cohesion: 0.09
Nodes (48): approveFeature(), assertRetainedItems(), commandFeature(), createFeature(), featureById(), mutation(), reviewQuestions(), discoveryPrompt() (+40 more)

### Community 4 - "index.tsx"
Cohesion: 0.08
Nodes (52): Conversation(), slackMessageStatus(), SlackDeliveryCard(), labels, BlockerFollowups(), LessonsPanel(), when(), ResearchSummary() (+44 more)

### Community 5 - "OfficeScene.tsx"
Cohesion: 0.06
Nodes (56): displayAgentTask(), withoutElapsed(), LiveAgentTask(), Props, RunningTask(), text(), Avatar(), AzureWall() (+48 more)

### Community 6 - "TicketJob"
Cohesion: 0.10
Nodes (20): StageContext, GitHubDelivery, stagePrompt(), StagePromptInput, implementationContinuationInstruction(), ciCheckout(), verifyCIHooks(), CIFailure (+12 more)

### Community 7 - "activation-recovery.ts"
Cohesion: 0.13
Nodes (37): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+29 more)

### Community 8 - "PeoplePanel.tsx"
Cohesion: 0.10
Nodes (38): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+30 more)

### Community 9 - "Inspector.tsx"
Cohesion: 0.05
Nodes (57): SendMessage, GoalList(), blank(), goalInput, Goals(), CONNECTION, CONNECTION_DOT, dockItemVariants (+49 more)

### Community 10 - "maintenance.ts"
Cohesion: 0.09
Nodes (31): maintenancePolicies(), captureLearning(), captureMaintenanceStep(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice() (+23 more)

### Community 11 - "preparation-readback.ts"
Cohesion: 0.14
Nodes (24): assertPostConflictOwnership(), bindPreparationBoardOrigins(), claimSchema, eventSchema, PreparationBoardOrigin, readPreparationBoardOrigins(), timestamp, updateSchema (+16 more)

### Community 12 - "TimeBook.tsx"
Cohesion: 0.11
Nodes (35): TelemetryReport, AzureBuild, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens(), usd() (+27 more)

### Community 13 - "digest"
Cohesion: 0.09
Nodes (55): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+47 more)

### Community 14 - "index.ts"
Cohesion: 0.09
Nodes (37): AUTO_ADOPT_BOTS, Link, linkFeature(), featureRoute(), close(), config, itSpecialist, loadedRevision (+29 more)

### Community 15 - "process.ts"
Cohesion: 0.07
Nodes (15): JiraOperations, plain(), unpack(), checkMail(), drainMail(), requestMail(), enableNightly(), ingest() (+7 more)

### Community 16 - "worker-runtime.ts"
Cohesion: 0.09
Nodes (30): assignmentSubject(), contextPacket(), DeliverySlot, officeCapacity, CODEX_DEFAULT_EFFORT, CODEX_DEFAULT_MODEL, CODEX_EFFORTS, CODEX_ROLES (+22 more)

### Community 17 - ".getEffect"
Cohesion: 0.29
Nodes (6): GitHubOperations, fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), closeNativeRefresh(), EffectIntent

### Community 18 - "conversations/conversations.ts"
Cohesion: 0.09
Nodes (33): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+25 more)

### Community 19 - "slack-intake/run.ts"
Cohesion: 0.13
Nodes (33): Config, configDigest(), digest(), IntakeConfig, ToolNames, CaptureReceipt, IntakeResult, IntakeResultValue (+25 more)

### Community 20 - "work-summary.ts"
Cohesion: 0.14
Nodes (26): Outbox(), themeColor, App(), deliveryRepairProjection(), card, InboxQueue(), ACTIVE, maintenanceUpdate() (+18 more)

### Community 21 - "agents.ts"
Cohesion: 0.06
Nodes (47): cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), args, [cmd,...rawArgs], commands, key (+39 more)

### Community 22 - "it-specialist.ts"
Cohesion: 0.35
Nodes (7): partialLocalCleanupKey(), ITContext, publishITReport(), delays, recoverAttempt(), ITFollowUp, ITReport

### Community 23 - "cec/issue-publication.ts"
Cohesion: 0.14
Nodes (15): Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), plainDescription(), Transition, assertEnrollable() (+7 more)

### Community 24 - "SettingsPanel.tsx"
Cohesion: 0.12
Nodes (32): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS, PickupForm(), acceptPreferences() (+24 more)

### Community 25 - ".emit"
Cohesion: 0.14
Nodes (27): ChannelSettings, configureChannelNotices(), configureNotices(), NoticeSettings, retryRecipientLookup(), normalizeStatement(), baselineLearning(), configureKnowledge() (+19 more)

### Community 26 - "azure.ts"
Cohesion: 0.07
Nodes (42): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+34 more)

### Community 27 - "Store"
Cohesion: 0.09
Nodes (20): featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), recoverFeatures(), dispatchExposure(), goalNoticeNeverDispatched(), maintenanceNoticeNeverDispatched(), recover() (+12 more)

### Community 28 - "run-retrospective.ts"
Cohesion: 0.16
Nodes (17): appendLearningFacts(), freezeLearningPacket(), ARTIFACT_LIMIT, clip(), LEDGER_STEPS, MAINTENANCE_LIMIT, maintenanceFacts(), MaintenancePacketSection (+9 more)

### Community 29 - "knowledge.ts"
Cohesion: 0.11
Nodes (21): retrospectivePrompt(), SUBJECT, Kind, RetrospectiveResultSchema, Stage, BlockerFollowup, ImprovementGrant, KnowledgeRetry (+13 more)

### Community 30 - "run-cost.ts"
Cohesion: 0.11
Nodes (21): CodexRollout, CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL (+13 more)

### Community 31 - "session-bridge.ts"
Cohesion: 0.12
Nodes (23): claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexSessionContext(), readRollout, claudeSessions(), codexSessions() (+15 more)

### Community 32 - "run-accounting.ts"
Cohesion: 0.10
Nodes (31): BoundedRead, backfillClaudeCost(), CompletionReader, codexHome(), createdAt(), dayDirs(), header(), readCodexRollout() (+23 more)

### Community 33 - "scheduler.ts"
Cohesion: 0.17
Nodes (12): ROLES, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch(), foreignWork() (+4 more)

### Community 34 - "cec/workflow.ts"
Cohesion: 0.12
Nodes (36): parksInJira(), MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), run(), advance(), nextStage(), publicationEvidenceGap() (+28 more)

### Community 35 - "OfficeSnapshot"
Cohesion: 0.12
Nodes (22): FeatureRound, FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures(), draftKey() (+14 more)

### Community 36 - ".save"
Cohesion: 0.12
Nodes (32): file, folder, logs, root, xml(), correlatedBuild(), BLOCKED, Execute (+24 more)

### Community 37 - "source-amendment-scope.ts"
Cohesion: 0.08
Nodes (39): approvedText(), assert(), assert(), normalize(), officialUrls, ReleaseCapture, verifyReleaseCaptures(), amendmentCaptureObservation() (+31 more)

### Community 38 - "weekly-rollup.ts"
Cohesion: 0.15
Nodes (19): learningMetrics(), lessonsNeedingReview(), RollupResult, RollupResultSchema, KnowledgeRunner, retryDelay(), mirror(), ResearchResult (+11 more)

### Community 39 - "time-scope.ts"
Cohesion: 0.18
Nodes (25): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), midnight(), TicketDay (+17 more)

### Community 40 - "dependency-bots/adopt.ts"
Cohesion: 0.15
Nodes (24): readBackOrThrow(), closesIssue(), linkedBody(), linkPR(), dependabotPR, readRepo(), ensureTrackingIssue(), findTrackingIssue() (+16 more)

### Community 41 - "command"
Cohesion: 0.16
Nodes (22): costLedger(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId(), OutsideEdit, publishCost(), publishing (+14 more)

### Community 42 - "remove-candidate.ts"
Cohesion: 0.18
Nodes (17): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), removeAdoptedClone() (+9 more)

### Community 43 - "preferences-store.ts"
Cohesion: 0.21
Nodes (9): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS (+1 more)

### Community 44 - "jira-time.ts"
Cohesion: 0.14
Nodes (19): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+11 more)

### Community 45 - "schedule.ts"
Cohesion: 0.15
Nodes (28): captureProposal(), effectId(), newTask(), recordObservation(), settlePage(), readConfig(), ChannelProgress, DERIVED (+20 more)

### Community 46 - "daily-cto.ts"
Cohesion: 0.11
Nodes (19): DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), dailyReviewDate(), reviewWeekday(), queueGoalEvidenceRequest(), DailyResultSchema (+11 more)

### Community 47 - "coordination-tick.ts"
Cohesion: 0.21
Nodes (13): reconcileNoticeConfirmations(), PrerequisitesSchema, brainCheckpointCompletion(), reconcileCompletedCheckpoints(), reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION (+5 more)

### Community 48 - "Coordinator"
Cohesion: 0.08
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 49 - "harnessEffect"
Cohesion: 0.19
Nodes (19): harnessCloseout(), PASSING, verifyMergeActions(), activeEffectId(), harnessEffect, assertMayMutate(), runHarnessStage(), harnessStageResult() (+11 more)

### Community 50 - "github-check-selection.ts"
Cohesion: 0.20
Nodes (19): checksFailed(), checksPassed(), checksPending(), CurrentChecksWait, currentMergeChecks(), pass(), pending(), requireThat() (+11 more)

### Community 51 - "delivery-binding.ts"
Cohesion: 0.17
Nodes (20): dispatchNightly(), drainDelivery(), requestDelivery(), resume(), startPilot(), eligibility(), approvedDelivery(), bindDelivery() (+12 more)

### Community 52 - "tracking-issue.ts"
Cohesion: 0.18
Nodes (26): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard, projectCards() (+18 more)

### Community 53 - "record-trigger.ts"
Cohesion: 0.18
Nodes (20): clip(), JobLike, recordCIBudget(), recordParked(), recordRepairBudget(), recordTicketParked(), recordTrigger(), subjectOf() (+12 more)

### Community 54 - "notifications.ts"
Cohesion: 0.10
Nodes (23): channelNoticeAuthorized(), notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR, plainSlackText(), section() (+15 more)

### Community 55 - "dependencies.ts"
Cohesion: 0.22
Nodes (19): Admission, admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, resumeParked(), compatible(), dependencyCompletionKey() (+11 more)

### Community 56 - "workKey"
Cohesion: 0.09
Nodes (41): completedPRReviews(), savedActivationFailure(), continuationScope(), brainImplementationCandidate(), BrainReadback, digest(), implementationRecoveryCandidate(), Ownership (+33 more)

### Community 57 - "accept-retrospective.ts"
Cohesion: 0.23
Nodes (13): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, distinct(), identity(), improvementIncident(), improvementIncidentKey(), IMPROVEMENT_POLICY (+5 more)

### Community 58 - "retrospective-subject.ts"
Cohesion: 0.20
Nodes (14): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+6 more)

### Community 59 - "GitHubIssuePublisher"
Cohesion: 0.28
Nodes (6): Assign, Board, GitHubIssuePublisher, number(), same(), label()

### Community 60 - "publish-pr.ts"
Cohesion: 0.24
Nodes (13): retryRead(), developerPRContent(), Execute, lintPRContent(), officePRContent(), prContent, assertCandidate(), Candidate (+5 more)

### Community 61 - "investigations/run.ts"
Cohesion: 0.20
Nodes (15): OFFICE_FIX_PROMPT, OfficeFixResult, validateOfficeFix(), investigationReady(), INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, InvestigationOptions, InvestigationReport (+7 more)

### Community 62 - "goal-reviews.ts"
Cohesion: 0.14
Nodes (16): applyGoalReview(), EvidenceRefSchema, FreshDailyResultSchema, statusAllowed(), workEvidence(), GoalInput, saveGoal(), queueGoalNotice() (+8 more)

### Community 63 - "lesson-selection.ts"
Cohesion: 0.19
Nodes (16): knowledgeContext(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), LessonSelection, MAINTENANCE (+8 more)

### Community 64 - "outbox.ts"
Cohesion: 0.22
Nodes (13): projectOutbox(), knowledgeOutbox(), checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), repeatedVendorReviewBlock(), stoppedInVendorReview(), checkpointSuperseded() (+5 more)

### Community 65 - "validate-stage.ts"
Cohesion: 0.16
Nodes (17): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+9 more)

### Community 66 - "service-health.ts"
Cohesion: 0.21
Nodes (8): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, ServiceHealth

### Community 67 - "admit-improvement.ts"
Cohesion: 0.24
Nodes (12): assertFeatureDependencyOrder(), featureDependencyEdges(), key(), admitImprovement(), improvementEligible(), improvementManifest(), improvementMarker(), improvementProvider() (+4 more)

### Community 68 - "contract.ts"
Cohesion: 0.20
Nodes (12): At, Errno, GroupInventory, GroupProbe, LifecycleDiagnostic, Phase, Pid, groupInventory() (+4 more)

### Community 69 - "github-closeout.ts"
Cohesion: 0.16
Nodes (15): cecPrompt(), resolvedDecisionNote(), stageInstructions, APPROACH_GUIDANCE, nextJobStage(), reviewInstructions(), deliveryTask(), DeliveryTaskInput (+7 more)

### Community 70 - "assignment-poll.ts"
Cohesion: 0.25
Nodes (11): noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), adoptDependabot(), openDependabotPulls(), refusal(), pinCourier, due() (+3 more)

### Community 71 - "investigations/ledger.ts"
Cohesion: 0.23
Nodes (15): syncOutbox(), projectSlackDeliveries(), settleRequestedSlackReplacement(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint(), slackRequestSettled() (+7 more)

### Community 72 - "discovery-recovery.ts"
Cohesion: 0.15
Nodes (16): Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership, rawHash() (+8 more)

### Community 73 - "control-store.ts"
Cohesion: 0.21
Nodes (8): Clock, systemClock, applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, statementCache(), initialSnapshot()

### Community 74 - "scheduled-work.ts"
Cohesion: 0.18
Nodes (18): deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), scheduledSlackIntake(), deterministicActions (+10 more)

### Community 75 - "learning-events.ts"
Cohesion: 0.25
Nodes (11): improvementIntakeGate(), learningDigest(), recordLearningOpportunity(), expireLearningPackets(), maintainLearning(), packetReferences(), publicTopicSafe(), researchTopics() (+3 more)

### Community 76 - "migrations.ts"
Cohesion: 0.25
Nodes (12): LEARNING_BASELINES, clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates(), maintenanceCompletedId(), maintenanceKey(), visibleMaintenanceTriggerIds() (+4 more)

### Community 77 - "coordination.ts"
Cohesion: 0.16
Nodes (19): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), legacy, validateNativeContinuation(), checkpointWindow() (+11 more)

### Community 78 - "lessons-view.ts"
Cohesion: 0.21
Nodes (11): SEEDS, KnowledgeState, Lesson, OfficeProposal, RetrospectiveRecord, WeeklyRollup, IntakeSummary(), lessonsView (+3 more)

### Community 79 - "saved-prerequisite-handoff.ts"
Cohesion: 0.32
Nodes (12): dependencyVersion(), handoffSavedPrerequisites(), hasSavedPrerequisiteResult(), Ownership, qualified(), readDependencies(), requireSavedPrerequisites(), requireThat() (+4 more)

### Community 80 - "work.ts"
Cohesion: 0.17
Nodes (11): AssignmentResult, CompletionCondition, Continuation, DependencyObservation, EligibilityState, FailureCategory, ReconciliationAction, WorkAssignment (+3 more)

### Community 81 - "offices.ts"
Cohesion: 0.27
Nodes (8): privateFile(), readLocalIntakeReport(), readIntakeReport(), file, project, root, projectById(), projectData()

### Community 82 - "telemetry.ts"
Cohesion: 0.13
Nodes (24): validTicket(), captureCost(), summary(), telemetryRoute(), CostCompleteness, CostEntry, CostLedgerState, TelemetryRow (+16 more)

### Community 84 - "blocker-followups.ts"
Cohesion: 0.56
Nodes (7): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), readBackConversations(), handoff(), reconcileBlockerFollowups()

### Community 85 - "DailyCTO.tsx"
Cohesion: 0.26
Nodes (8): CTOReview(), goalState, DailyCTO(), GoalHistory(), reportDate(), reviewStatus, reviewExcerpt(), ReviewText()

### Community 86 - "recovery-ledger.ts"
Cohesion: 0.38
Nodes (7): savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), diagnosticSnapshot(), nativeDeliveryResolved(), reconcileRecoveryLedger()

### Community 87 - "evidence.ts"
Cohesion: 0.33
Nodes (9): investigationEvidence(), OFFICE_SOURCE_PATHS, officeSource(), done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf() (+1 more)

### Community 88 - "scheduled-retrospectives.ts"
Cohesion: 0.42
Nodes (8): busyMaintenanceIds(), terminalCandidates(), triggerJobId(), harperFolder(), runRetrospective(), busySubjects(), scheduledRetrospectives(), status()

### Community 89 - "shared.ts"
Cohesion: 0.09
Nodes (29): ProjectReadiness, DailyCTOSummary, ProgressionItem, SchedulerState, itAgent(), itDiagnostics(), currentServices(), ServiceHealthPanel() (+21 more)

### Community 90 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 91 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 92 - "research-profile.ts"
Cohesion: 0.44
Nodes (6): codexArguments(), PREVIOUS_RESEARCH_PROFILE_UNAVAILABLE, RESEARCH_CODEX_VERSION, RESEARCH_DISABLED_FEATURES, researchConfiguration(), slackIntakeConfiguration()

### Community 93 - "cost-totals.ts"
Cohesion: 0.38
Nodes (6): awaitingEvidence(), boardUsd(), CaptureContext, inCostWindow(), TicketCost, ticketCosts()

### Community 94 - "liveReach"
Cohesion: 0.60
Nodes (5): GIT_NETWORK, LIVE_PROVIDERS, liveReach(), networkUrl(), remoteUrls()

### Community 95 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 99 - "highestStableAtLeast"
Cohesion: 0.83
Nodes (3): compare(), highestStableAtLeast(), parts()

## Knowledge Gaps
- **352 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+347 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `source-amendment.ts`, `github-delivery.ts`, `artifact`, `.transaction`, `TicketJob`, `activation-recovery.ts`, `maintenance.ts`, `preparation-readback.ts`, `digest`, `index.ts`, `process.ts`, `worker-runtime.ts`, `.getEffect`, `conversations/conversations.ts`, `slack-intake/run.ts`, `agents.ts`, `it-specialist.ts`, `cec/issue-publication.ts`, `.emit`, `azure.ts`, `run-retrospective.ts`, `session-bridge.ts`, `run-accounting.ts`, `scheduler.ts`, `cec/workflow.ts`, `OfficeSnapshot`, `.save`, `weekly-rollup.ts`, `time-scope.ts`, `dependency-bots/adopt.ts`, `command`, `remove-candidate.ts`, `jira-time.ts`, `schedule.ts`, `daily-cto.ts`, `coordination-tick.ts`, `Coordinator`, `harnessEffect`, `delivery-binding.ts`, `tracking-issue.ts`, `record-trigger.ts`, `notifications.ts`, `dependencies.ts`, `workKey`, `accept-retrospective.ts`, `retrospective-subject.ts`, `publish-pr.ts`, `investigations/run.ts`, `goal-reviews.ts`, `lesson-selection.ts`, `validate-stage.ts`, `admit-improvement.ts`, `github-closeout.ts`, `assignment-poll.ts`, `investigations/ledger.ts`, `discovery-recovery.ts`, `control-store.ts`, `scheduled-work.ts`, `learning-events.ts`, `coordination.ts`, `saved-prerequisite-handoff.ts`, `offices.ts`, `telemetry.ts`, `blocker-followups.ts`, `recovery-ledger.ts`, `evidence.ts`, `scheduled-retrospectives.ts`, `shared.ts`, `BrainFollowup`?**
  _High betweenness centrality (0.126) - this node is a cross-community bridge._
- **Why does `Role` connect `worker-runtime.ts` to `github-delivery.ts`, `index.tsx`, `OfficeScene.tsx`, `TicketJob`, `PeoplePanel.tsx`, `Inspector.tsx`, `maintenance.ts`, `conversations/conversations.ts`, `agents.ts`, `.emit`, `Store`, `run-accounting.ts`, `scheduler.ts`, `cec/workflow.ts`, `OfficeSnapshot`, `retrospective-subject.ts`, `outbox.ts`, `validate-stage.ts`, `github-closeout.ts`, `work.ts`, `shared.ts`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `OfficeSnapshot` connect `OfficeSnapshot` to `outbox.ts`, `cec/workflow.ts`, `service-health.ts`, `index.tsx`, `OfficeScene.tsx`, `investigations/ledger.ts`, `PeoplePanel.tsx`, `Inspector.tsx`, `maintenance.ts`, `migrations.ts`, `TimeBook.tsx`, `conversations/conversations.ts`, `work-summary.ts`, `DailyCTO.tsx`, `SettingsPanel.tsx`, `shared.ts`, `azure.ts`, `Store`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `command()` (e.g. with `.constructor()` and `executeRequest()`) actually correct?**
  _`command()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _352 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `source-amendment.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09760374050263004 - nodes in this community are weakly interconnected._
- **Should `github-delivery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08313285217856188 - nodes in this community are weakly interconnected._