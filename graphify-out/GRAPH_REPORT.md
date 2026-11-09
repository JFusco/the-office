# Graph Report - the-office  (2026-11-09)

## Corpus Check
- 519 files · ~245,163 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2943 nodes · 12399 edges · 96 communities (94 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 68 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5a3c1181`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- source-amendment.ts
- accept-stage-result.ts
- post-conflict-preparation.ts
- features.ts
- index.tsx
- OfficeScene.tsx
- TicketJob
- artifact
- Role
- Inspector.tsx
- maintenance.ts
- workKey
- TimeBook.tsx
- requests.ts
- index.ts
- Store
- worker-runtime.ts
- .getEffect
- conversations/conversations.ts
- schedule.ts
- OfficeSnapshot
- agents.ts
- it-specialist.ts
- github/issue-publication.ts
- LessonsPanel.tsx
- http/commands.ts
- sanitize
- store.ts
- run-retrospective.ts
- knowledge.ts
- telemetry.ts
- session-bridge.ts
- offices.ts
- scheduler.ts
- .transaction
- FeatureWorkspace.tsx
- .save
- source-amendment-scope.ts
- weekly-rollup.ts
- time-scope.ts
- dependency-bots/adopt.ts
- cost-ledger.ts
- remove-candidate.ts
- preferences-store.ts
- jira-time.ts
- model-routes.ts
- daily-cto.ts
- coordination-tick.ts
- Coordinator
- harnessEffect
- effects.ts
- engine.ts
- release-unpark.ts
- record-trigger.ts
- notifications.ts
- github-delivery.ts
- brain-audit-reuse.ts
- admit-improvement.ts
- retrospective-subject.ts
- checkpoint-completion.ts
- publish-pr.ts
- security.ts
- goal-reviews.ts
- lesson-selection.ts
- MaintenanceRun
- validate-stage.ts
- service-health.ts
- fact-bounds.ts
- process.ts
- delivery-task.ts
- assignment-poll.ts
- outbox.ts
- discovery-recovery.ts
- codex-rollout-file.ts
- scheduled-work.ts
- weekly-research.ts
- run-ci-repair.ts
- coordination.ts
- conversations/slack.ts
- useOfficePreferences.ts
- github.ts
- checkpoint-retry.ts
- telemetry/report.ts
- Offices
- blocker-followups.ts
- DailyCTO.tsx
- .value
- helper-usage.ts
- merge-summary.ts
- shared.ts
- command-registry.ts
- codex-rollout.ts
- run-usage.ts
- slack-supersession.ts
- helper-evidence.py

## God Nodes (most connected - your core abstractions)
1. `Store` - 276 edges
2. `TicketJob` - 117 edges
3. `GitHubDelivery` - 112 edges
4. `command()` - 98 edges
5. `artifact()` - 85 edges
6. `digest()` - 82 edges
7. `cx()` - 77 edges
8. `workKey()` - 73 edges
9. `OfficeSnapshot` - 66 edges
10. `StageResult` - 63 edges

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

## Communities (96 total, 2 thin omitted)

### Community 0 - "source-amendment.ts"
Cohesion: 0.08
Nodes (62): stagePrompt(), adoptCandidate(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related (+54 more)

### Community 1 - "accept-stage-result.ts"
Cohesion: 0.09
Nodes (53): containedFile(), findingsBlock(), namedRepairIds(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery(), acceptStageResult() (+45 more)

### Community 2 - "post-conflict-preparation.ts"
Cohesion: 0.09
Nodes (59): closeoutCheckpoint(), closeoutRecoveryCandidate(), CloseoutRecoveryKind, coreCloseoutNative(), savedActivationFailure(), continuationArtifacts(), continuationNativeReview(), continuationWorkerProof() (+51 more)

### Community 3 - "features.ts"
Cohesion: 0.11
Nodes (32): approveFeature(), assertRetainedItems(), commandFeature(), createFeature(), mutation(), reviewQuestions(), assertFeatureDependencyOrder(), featureDependencyEdges() (+24 more)

### Community 4 - "index.tsx"
Cohesion: 0.08
Nodes (51): Conversation(), Outbox(), recommendedReply(), slackMessageStatus(), SlackDeliveryCard(), ServiceHealthPanel(), labels, ServiceHealthRow() (+43 more)

### Community 5 - "OfficeScene.tsx"
Cohesion: 0.06
Nodes (59): itAgent(), itDiagnostics(), displayAgentTask(), withoutElapsed(), LiveAgentTask(), Props, RunningTask(), text() (+51 more)

### Community 6 - "TicketJob"
Cohesion: 0.07
Nodes (34): StageContext, GitHubDelivery, observe(), StagePromptInput, checksFailed(), checksPassed(), checksPending(), CurrentChecksWait (+26 more)

### Community 7 - "artifact"
Cohesion: 0.09
Nodes (66): PrerequisitesSchema, blob(), Execute, inspectPartialWorktree(), partialLocalCleanupCandidate(), partialLocalCleanupKey(), requireProof(), statIdentity() (+58 more)

### Community 8 - "Role"
Cohesion: 0.11
Nodes (37): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+29 more)

### Community 9 - "Inspector.tsx"
Cohesion: 0.05
Nodes (55): SendMessage, blank(), goalInput, Goals(), CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants (+47 more)

### Community 10 - "maintenance.ts"
Cohesion: 0.06
Nodes (62): parksInJira(), MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), run(), advance(), nextStage(), publicationEvidenceGap() (+54 more)

### Community 11 - "workKey"
Cohesion: 0.09
Nodes (42): continuationScope(), continuationGuard(), brainImplementationCandidate(), BrainReadback, digest(), implementationRecoveryCandidate(), Ownership, Readback (+34 more)

### Community 12 - "TimeBook.tsx"
Cohesion: 0.10
Nodes (36): TelemetryReport, LiveAnchor, AzureBuild, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens() (+28 more)

### Community 13 - "requests.ts"
Cohesion: 0.13
Nodes (34): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutProviderEvidence() (+26 more)

### Community 14 - "index.ts"
Cohesion: 0.07
Nodes (41): args, [cmd,...rawArgs], commands, key, projectIndex, close(), config, itSpecialist (+33 more)

### Community 15 - "Store"
Cohesion: 0.06
Nodes (9): GitHubFeaturePublisher, reconcileNativeDelivery(), BrainFollowup, Result, Assessment, Engine, Store, command() (+1 more)

### Community 16 - "worker-runtime.ts"
Cohesion: 0.12
Nodes (25): assignmentSubject(), labels, toolActivity(), workerActivity(), claudeArguments(), ClaudeStream, DEVELOPER_EFFORT, DEVELOPER_MODEL (+17 more)

### Community 17 - ".getEffect"
Cohesion: 0.26
Nodes (7): GitHubOperations, fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), closeNativeRefresh(), fingerprint(), EffectIntent

### Community 18 - "conversations/conversations.ts"
Cohesion: 0.11
Nodes (24): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+16 more)

### Community 19 - "schedule.ts"
Cohesion: 0.07
Nodes (67): KnowledgeRunner, captureProposal(), effectId(), newTask(), recordObservation(), settlePage(), Config, configDigest() (+59 more)

### Community 20 - "OfficeSnapshot"
Cohesion: 0.10
Nodes (35): themeColor, App(), SnapshotAcceptance, demoSnapshot(), tourStages, useOffice(), OfficeSnapshot, STAGE_ROLE (+27 more)

### Community 21 - "agents.ts"
Cohesion: 0.08
Nodes (36): cecPrompt(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), resolvedDecisionNote(), stageInstructions, cecChatPrompt() (+28 more)

### Community 22 - "it-specialist.ts"
Cohesion: 0.17
Nodes (19): savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), ITContext, diagnosticSnapshot(), investigationCandidates(), investigationId() (+11 more)

### Community 23 - "github/issue-publication.ts"
Cohesion: 0.10
Nodes (19): Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), plainDescription(), Transition, JiraFeaturePublisher (+11 more)

### Community 24 - "LessonsPanel.tsx"
Cohesion: 0.13
Nodes (30): LessonsPanel(), when(), ResearchSummary(), SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), loadOfficeConfig() (+22 more)

### Community 25 - "http/commands.ts"
Cohesion: 0.16
Nodes (23): retryRecipientLookup(), normalizeStatement(), configureKnowledge(), declineLessonIssue(), demoteLesson(), reactivateLesson(), retireLesson(), decideOfficeProposal() (+15 more)

### Community 26 - "sanitize"
Cohesion: 0.15
Nodes (22): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+14 more)

### Community 27 - "store.ts"
Cohesion: 0.09
Nodes (23): featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), recoverFeatures(), dispatchExposure(), prepareExposure(), Clock, systemClock (+15 more)

### Community 28 - "run-retrospective.ts"
Cohesion: 0.15
Nodes (21): appendLearningFacts(), freezeLearningPacket(), ARTIFACT_LIMIT, clip(), LEDGER_STEPS, MAINTENANCE_LIMIT, maintenanceFacts(), MaintenancePacketSection (+13 more)

### Community 29 - "knowledge.ts"
Cohesion: 0.09
Nodes (28): Kind, RetrospectiveResult, Stage, SEEDS, BlockerFollowup, ImprovementGrant, KnowledgeRetry, KnowledgeState (+20 more)

### Community 30 - "telemetry.ts"
Cohesion: 0.11
Nodes (21): CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL, Rates (+13 more)

### Community 31 - "session-bridge.ts"
Cohesion: 0.13
Nodes (23): claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexSessionContext(), readRollout, claudeSessions(), codexSessions() (+15 more)

### Community 32 - "offices.ts"
Cohesion: 0.18
Nodes (16): DELIVERY_CONCURRENCY, BoundedRead, backfillClaudeCost(), CompletionReader, COMPLETION_MAX_BYTES, completionAccounting(), markCaptureStart(), readCompletion() (+8 more)

### Community 33 - "scheduler.ts"
Cohesion: 0.16
Nodes (13): ROLES, officeCapacity, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch() (+5 more)

### Community 34 - ".transaction"
Cohesion: 0.14
Nodes (27): featureById(), discoveryPrompt(), planPrompt(), document(), featureRoot(), DiscoverySchema, identity, manifestFromPlan() (+19 more)

### Community 35 - "FeatureWorkspace.tsx"
Cohesion: 0.18
Nodes (15): FeatureRound, FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures(), draftKey() (+7 more)

### Community 36 - ".save"
Cohesion: 0.24
Nodes (23): BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue(), readIssues(), commentDecision() (+15 more)

### Community 37 - "source-amendment-scope.ts"
Cohesion: 0.08
Nodes (39): approvedText(), assert(), assert(), normalize(), officialUrls, ReleaseCapture, verifyReleaseCaptures(), amendmentCaptureObservation() (+31 more)

### Community 38 - "weekly-rollup.ts"
Cohesion: 0.19
Nodes (16): learningMetrics(), lessonsNeedingReview(), RollupResult, RollupResultSchema, harperFolder(), RETROSPECTIVE_TIMEOUT, lastFriday(), ROLLUP_HISTORY (+8 more)

### Community 39 - "time-scope.ts"
Cohesion: 0.16
Nodes (24): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence(), CaptureContext (+16 more)

### Community 40 - "dependency-bots/adopt.ts"
Cohesion: 0.12
Nodes (32): readBackOrThrow(), adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR, openDependabotPulls() (+24 more)

### Community 41 - "cost-ledger.ts"
Cohesion: 0.14
Nodes (28): EffectUncertainError, captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId() (+20 more)

### Community 42 - "remove-candidate.ts"
Cohesion: 0.20
Nodes (15): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+7 more)

### Community 43 - "preferences-store.ts"
Cohesion: 0.19
Nodes (10): PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, SettingsPanel(), OFFICE_PREFERENCE_DEFAULTS (+2 more)

### Community 44 - "jira-time.ts"
Cohesion: 0.21
Nodes (13): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+5 more)

### Community 45 - "model-routes.ts"
Cohesion: 0.21
Nodes (13): AUTO_ADOPT_BOTS, goalEvidencePath(), localBindings, assertModelOverrides(), CODEX_DEFAULT_EFFORT, CODEX_DEFAULT_MODEL, CODEX_EFFORTS, CODEX_ROLES (+5 more)

### Community 46 - "daily-cto.ts"
Cohesion: 0.12
Nodes (17): DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), dailyReviewDate(), reviewWeekday(), queueGoalEvidenceRequest(), GoalEvidenceRequestSchema (+9 more)

### Community 47 - "coordination-tick.ts"
Cohesion: 0.23
Nodes (11): reconcileNoticeConfirmations(), legacy, reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION, tick(), incompleteReadOutput() (+3 more)

### Community 48 - "Coordinator"
Cohesion: 0.08
Nodes (3): coordination(), Coordinator, PickupPolicy

### Community 49 - "harnessEffect"
Cohesion: 0.22
Nodes (16): retryCandidateCleanup(), harnessCloseout(), PASSING, verifyMergeActions(), activeEffectId(), harnessEffect, assertMayMutate(), runHarnessStage() (+8 more)

### Community 50 - "effects.ts"
Cohesion: 0.17
Nodes (10): correlatedBuild(), JiraOperations, plain(), unpack(), CEC, observe(), observeParked(), parkedReadError (+2 more)

### Community 51 - "engine.ts"
Cohesion: 0.15
Nodes (25): checkMail(), drainMail(), requestMail(), dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), resume() (+17 more)

### Community 52 - "release-unpark.ts"
Cohesion: 0.17
Nodes (25): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard, projectCards() (+17 more)

### Community 53 - "record-trigger.ts"
Cohesion: 0.11
Nodes (38): busyMaintenanceIds(), clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates(), maintenanceCompletedId(), maintenanceKey(), visibleMaintenanceTriggerIds() (+30 more)

### Community 54 - "notifications.ts"
Cohesion: 0.15
Nodes (17): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), configureNotices(), Identity, MergeNotifications (+9 more)

### Community 55 - "github-delivery.ts"
Cohesion: 0.12
Nodes (27): BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction(), Admission, admit(), IntakeContext, dependabotReviewGuidance() (+19 more)

### Community 56 - "brain-audit-reuse.ts"
Cohesion: 0.22
Nodes (11): bindBrainAuditEffects(), Effect, Known, Context, jsonAfter(), nativeSessionPath(), readPriorBrainAudit(), terminalPriorAuditIntent() (+3 more)

### Community 57 - "admit-improvement.ts"
Cohesion: 0.17
Nodes (20): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident() (+12 more)

### Community 58 - "retrospective-subject.ts"
Cohesion: 0.19
Nodes (15): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+7 more)

### Community 59 - "checkpoint-completion.ts"
Cohesion: 0.23
Nodes (8): BrainStatusSchema, identity, parseBrainStatus(), brainCheckpointCompletion(), coverageSchema, followupSchema, verified, reconcileCompletedCheckpoints()

### Community 60 - "publish-pr.ts"
Cohesion: 0.26
Nodes (13): retryRead(), developerPRContent(), Execute, lintPRContent(), officePRContent(), prContent, assertCandidate(), Candidate (+5 more)

### Community 61 - "security.ts"
Cohesion: 0.13
Nodes (23): investigationEvidence(), OFFICE_FIX_PROMPT, OfficeFixResult, validateOfficeFix(), officeSource(), investigationReady(), INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT (+15 more)

### Community 62 - "goal-reviews.ts"
Cohesion: 0.12
Nodes (17): applyGoalReview(), DailyResultSchema, EvidenceRefSchema, FreshDailyResultSchema, statusAllowed(), workEvidence(), GoalInput, queueGoalNotice() (+9 more)

### Community 63 - "lesson-selection.ts"
Cohesion: 0.19
Nodes (16): knowledgeContext(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), LessonSelection, MAINTENANCE (+8 more)

### Community 64 - "MaintenanceRun"
Cohesion: 0.31
Nodes (10): checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), repeatedVendorReviewBlock(), stoppedInVendorReview(), maintenanceSuperseded(), REOBSERVED, ReconciliationRequest (+2 more)

### Community 65 - "validate-stage.ts"
Cohesion: 0.15
Nodes (17): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+9 more)

### Community 66 - "service-health.ts"
Cohesion: 0.17
Nodes (10): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, slackHealth() (+2 more)

### Community 67 - "fact-bounds.ts"
Cohesion: 0.26
Nodes (15): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+7 more)

### Community 68 - "process.ts"
Cohesion: 0.17
Nodes (17): At, Errno, GroupInventory, GroupProbe, LifecycleDiagnostic, Phase, Pid, groupInventory() (+9 more)

### Community 69 - "delivery-task.ts"
Cohesion: 0.31
Nodes (7): deliveryTask(), DeliveryTaskInput, DISCOVERY_GUIDANCE, compactSteps(), AMENDMENT_REVIEW_PROOF, featureDeliveryContext(), deliveryResearchContext()

### Community 70 - "assignment-poll.ts"
Cohesion: 0.35
Nodes (9): noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), admitReadyCards(), WAIT_STATUSES, pinCourier, resumeParked(), poll() (+1 more)

### Community 71 - "outbox.ts"
Cohesion: 0.21
Nodes (14): conversationResolved(), projectOutbox(), syncOutbox(), projectSlackDeliveries(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint() (+6 more)

### Community 72 - "discovery-recovery.ts"
Cohesion: 0.29
Nodes (10): Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership, rawHash() (+2 more)

### Community 73 - "codex-rollout-file.ts"
Cohesion: 0.24
Nodes (11): createdAt(), dayDirs(), header(), readCodexRollout(), ROLLOUT_MAX_BYTES, RolloutScan, scanCodexRollouts(), codexAccounting() (+3 more)

### Community 74 - "scheduled-work.ts"
Cohesion: 0.15
Nodes (21): deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), scheduledSlackIntake(), deterministicActions (+13 more)

### Community 75 - "weekly-research.ts"
Cohesion: 0.15
Nodes (20): improvementIntakeGate(), learningDigest(), recordLearningOpportunity(), baselineLearning(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences() (+12 more)

### Community 76 - "run-ci-repair.ts"
Cohesion: 0.29
Nodes (12): ciCheckout(), verifyCIHooks(), CIFailure, guardCIRepair(), prepareCIMetadataRepair(), publishCIRepair(), rewordCommits(), CIPlanSchema (+4 more)

### Community 77 - "coordination.ts"
Cohesion: 0.24
Nodes (12): checkpointWindow(), dueAt(), hours, localDay(), ReviewResult, deferNonReady(), preparePR(), recheck() (+4 more)

### Community 78 - "conversations/slack.ts"
Cohesion: 0.15
Nodes (9): comparableSlackText(), settleRequestedSlackReplacement(), SlackMessages, SlackRequestSchema, SlackResultSchema, SlackVerificationSchema, Agents, WorkerRuntime (+1 more)

### Community 79 - "useOfficePreferences.ts"
Cohesion: 0.26
Nodes (10): acceptPreferences(), PreferenceCandidate, strip(), UNKNOWN_PREFERENCES, OfficePreferencesController, PreferenceFeedback, PreferenceField, requestPreferences() (+2 more)

### Community 80 - "github.ts"
Cohesion: 0.29
Nodes (6): GitHubMonitor, githubPRDescription(), GOAL_EVIDENCE_LIMITS, GitHubBoard, GitHubPR, GitHubState

### Community 81 - "checkpoint-retry.ts"
Cohesion: 0.52
Nodes (6): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation()

### Community 82 - "telemetry/report.ts"
Cohesion: 0.29
Nodes (12): byWeek(), Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked() (+4 more)

### Community 84 - "blocker-followups.ts"
Cohesion: 0.64
Nodes (6): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), readBackConversations(), handoff(), reconcileBlockerFollowups()

### Community 85 - "DailyCTO.tsx"
Cohesion: 0.20
Nodes (10): CTOReview(), goalState, DailyCTO(), GoalHistory(), reportDate(), reviewStatus, GoalList(), reviewExcerpt() (+2 more)

### Community 86 - ".value"
Cohesion: 0.27
Nodes (6): file, folder, logs, root, xml(), ProjectProgress

### Community 87 - "helper-usage.ts"
Cohesion: 0.28
Nodes (10): OFFICE_SOURCE_PATHS, done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf(), codexHome(), HELPER_STDOUT_MAX_BYTES (+2 more)

### Community 88 - "merge-summary.ts"
Cohesion: 0.36
Nodes (7): clamp(), LIMITS, MergedPR, plainSlackText(), section(), shippedSummary(), mergeText()

### Community 89 - "shared.ts"
Cohesion: 0.08
Nodes (36): ScopeRow, ProjectReadiness, ConfirmedSegment, ObservationGap, SnapshotOrdering, TimeLedgerState, AssignmentResult, CompletionCondition (+28 more)

### Community 90 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 91 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 92 - "run-usage.ts"
Cohesion: 0.32
Nodes (6): CodexRollout, claudeCrashZero(), claudeUsage(), codexUsage(), count(), RunUsage

### Community 95 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

## Knowledge Gaps
- **352 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+347 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `source-amendment.ts`, `accept-stage-result.ts`, `post-conflict-preparation.ts`, `features.ts`, `OfficeScene.tsx`, `TicketJob`, `artifact`, `maintenance.ts`, `workKey`, `requests.ts`, `index.ts`, `worker-runtime.ts`, `.getEffect`, `conversations/conversations.ts`, `schedule.ts`, `OfficeSnapshot`, `agents.ts`, `it-specialist.ts`, `github/issue-publication.ts`, `http/commands.ts`, `sanitize`, `store.ts`, `run-retrospective.ts`, `session-bridge.ts`, `offices.ts`, `scheduler.ts`, `.transaction`, `.save`, `weekly-rollup.ts`, `time-scope.ts`, `dependency-bots/adopt.ts`, `cost-ledger.ts`, `remove-candidate.ts`, `jira-time.ts`, `coordination-tick.ts`, `harnessEffect`, `effects.ts`, `engine.ts`, `release-unpark.ts`, `record-trigger.ts`, `notifications.ts`, `github-delivery.ts`, `brain-audit-reuse.ts`, `admit-improvement.ts`, `retrospective-subject.ts`, `checkpoint-completion.ts`, `publish-pr.ts`, `security.ts`, `goal-reviews.ts`, `lesson-selection.ts`, `validate-stage.ts`, `delivery-task.ts`, `outbox.ts`, `discovery-recovery.ts`, `scheduled-work.ts`, `weekly-research.ts`, `coordination.ts`, `conversations/slack.ts`, `github.ts`, `Offices`, `blocker-followups.ts`?**
  _High betweenness centrality (0.123) - this node is a cross-community bridge._
- **Why does `Role` connect `Role` to `accept-stage-result.ts`, `index.tsx`, `OfficeScene.tsx`, `TicketJob`, `Inspector.tsx`, `maintenance.ts`, `requests.ts`, `index.ts`, `Store`, `worker-runtime.ts`, `conversations/conversations.ts`, `OfficeSnapshot`, `agents.ts`, `http/commands.ts`, `store.ts`, `offices.ts`, `scheduler.ts`, `model-routes.ts`, `github-delivery.ts`, `retrospective-subject.ts`, `validate-stage.ts`, `outbox.ts`, `conversations/slack.ts`, `shared.ts`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `command()` connect `Store` to `accept-stage-result.ts`, `features.ts`, `TicketJob`, `artifact`, `maintenance.ts`, `workKey`, `requests.ts`, `worker-runtime.ts`, `.getEffect`, `schedule.ts`, `agents.ts`, `github/issue-publication.ts`, `sanitize`, `session-bridge.ts`, `.transaction`, `.save`, `cost-ledger.ts`, `remove-candidate.ts`, `jira-time.ts`, `harnessEffect`, `effects.ts`, `engine.ts`, `release-unpark.ts`, `notifications.ts`, `github-delivery.ts`, `admit-improvement.ts`, `publish-pr.ts`, `validate-stage.ts`, `service-health.ts`, `process.ts`, `scheduled-work.ts`, `run-ci-repair.ts`, `coordination.ts`, `github.ts`, `command-registry.ts`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `command()` (e.g. with `.constructor()` and `executeRequest()`) actually correct?**
  _`command()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _352 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `source-amendment.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08490945674044266 - nodes in this community are weakly interconnected._
- **Should `accept-stage-result.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09362279511533243 - nodes in this community are weakly interconnected._