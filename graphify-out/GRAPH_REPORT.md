# Graph Report - office-draft-delivery  (2026-11-10)

## Corpus Check
- 681 files · ~282,505 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3494 nodes · 15430 edges · 107 communities (102 shown, 5 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 96 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `528c0f1f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- dependency-bots/adopt.ts
- Inspector.tsx
- artifact
- OfficeScene.tsx
- http/commands.ts
- WorkTime
- GitHubDelivery
- App.tsx
- source-amendment.ts
- MapView.tsx
- index.tsx
- run-retrospective.ts
- scheduled-work.ts
- agents.ts
- PeoplePanel.tsx
- shared.ts
- closeout-recovery.ts
- weekly-research.ts
- offices.ts
- engine.ts
- conversations/conversations.ts
- worker-runtime.ts
- index.ts
- notifications.ts
- accept-stage-result.ts
- github-readiness.ts
- github-delivery.ts
- TimeBook.tsx
- goal-reporting.ts
- maintenance.ts
- blocker-followups.ts
- activation-recovery.ts
- OfficeSnapshot
- cec/workflow.ts
- queue-repairs.ts
- run-accounting.ts
- session-bridge.ts
- digest
- knowledge/routes.ts
- slack-intake/run.ts
- task-briefing.ts
- schedule.ts
- digest
- command
- telemetry.ts
- constellation-runtime.ts
- .emit
- github/issue-publication.ts
- IntakeLedger
- outbox.ts
- investigations/run.ts
- Store
- store.ts
- .getEffect
- sourceVisible
- .save
- harnessEffect
- features/workflow.ts
- approval.ts
- github-check-selection.ts
- cec/issue-publication.ts
- assertMayMutate
- process.ts
- reader.ts
- knowledge/learning-events.ts
- slack-intake/report.ts
- Coordinator
- service-health.ts
- slack-intake/config.ts
- knowledge.ts
- discovery-recovery.ts
- weekly-rollup.ts
- fact-bounds.ts
- coordination.ts
- validate-stage.ts
- dependencies.ts
- lesson-selection.ts
- contract.ts
- LessonsPanel.tsx
- sources/retained-scope.ts
- features.ts
- delivery-task.ts
- publish-pr.ts
- admit-improvement.ts
- captures.ts
- coordination-tick.ts
- preferences-store.ts
- closeout-supervision-proof.ts
- projects.ts
- .pump
- Ticket
- outbound.ts
- DailyCTO.tsx
- command-registry.ts
- retire-external-delivery.ts
- codex-rollout.ts
- project-progress.ts
- cli.ts
- brain-followup.ts
- OfficeConfigView.tsx
- install-service.mjs
- liveReach
- extract-worker.mjs
- launch-policy.ts
- slack-supersession.ts
- helper-evidence.py

## God Nodes (most connected - your core abstractions)
1. `Store` - 316 edges
2. `TicketJob` - 134 edges
3. `GitHubDelivery` - 122 edges
4. `command()` - 103 edges
5. `artifact()` - 89 edges
6. `cx()` - 88 edges
7. `digest()` - 86 edges
8. `workKey()` - 85 edges
9. `OfficeSnapshot` - 70 edges
10. `digest()` - 66 edges

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
- 3-file cycle: `src/knowledge/map/Constellation.tsx -> src/knowledge/map/constellation-runtime.ts -> src/knowledge/map/node-visuals.ts -> src/knowledge/map/Constellation.tsx`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/stage-reconciliation.ts -> server/delivery/recovery/implementation/continuation-review-readback.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/preparation/post-conflict-preparation.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts`
- 3-file cycle: `server/conversations/notifications.ts -> server/conversations/slack.ts -> server/knowledge/digests/outbound.ts -> server/conversations/notifications.ts`
- 3-file cycle: `server/conversations/notifications.ts -> server/knowledge/digests/send-notice.ts -> server/knowledge/digests/outbound.ts -> server/conversations/notifications.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-guard.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/queue-repairs.ts -> server/delivery/repairs/reconcile-ci-diagnosis.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/parking/resume-provider-review.ts -> server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/parking/resume-provider-review.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-publication.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/conversations/conversations.ts -> server/conversations/slack.ts -> server/workers/agents.ts -> server/conversations/conversations.ts`
- 3-file cycle: `server/conversations/slack.ts -> server/workers/agents.ts -> server/workers/worker-runtime.ts -> server/conversations/slack.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/scope-repair/scope-repair-resume.ts -> server/delivery/recovery/validation/validation-provider-context.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/recovery/retire-external-delivery.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/conversations/conversations.ts -> server/scheduling/engine.ts -> server/workers/agents.ts -> server/conversations/conversations.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/stage-prompts.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-checkout.ts -> server/delivery/pipeline/github-delivery.ts`

## Communities (107 total, 5 thin omitted)

### Community 0 - "dependency-bots/adopt.ts"
Cohesion: 0.07
Nodes (66): noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), Lane, resolveLane(), cardStatus(), Execute, ProjectCard (+58 more)

### Community 1 - "Inspector.tsx"
Cohesion: 0.09
Nodes (57): Conversation(), Outbox(), SendMessage, slackMessageStatus(), SlackDeliveryCard(), ServiceHealthPanel(), labels, ServiceHealthRow() (+49 more)

### Community 2 - "artifact"
Cohesion: 0.09
Nodes (63): assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), reconcileCompletedConflictDraft(), routeReadyPostConflictPublication(), verifyInitialDraftConflictPreparation() (+55 more)

### Community 3 - "OfficeScene.tsx"
Cohesion: 0.05
Nodes (63): itAgent(), itDiagnostics(), displayAgentTask(), githubStageLabels, withoutElapsed(), CameraBookmark, restoreBookmark(), LiveAgentTask() (+55 more)

### Community 4 - "http/commands.ts"
Cohesion: 0.06
Nodes (61): retryRecipientLookup(), bindDiscoveryResume(), DiscoveryResumeInput, configureDigestDelivery(), DigestSettings, baselineLearning(), LEARNING_BASELINES, maintainLearning() (+53 more)

### Community 5 - "WorkTime"
Cohesion: 0.07
Nodes (59): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence(), CaptureContext (+51 more)

### Community 6 - "GitHubDelivery"
Cohesion: 0.07
Nodes (49): GitHubDelivery, boardPreflightCandidate(), Ownership, reconcileBoardPreflight(), savedActivationFailure(), continuationScope(), discoveryRecoveryCandidate(), brainImplementationCandidate() (+41 more)

### Community 7 - "App.tsx"
Cohesion: 0.05
Nodes (56): themeColor, App(), BrainWorkspace, CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants, ElevatorPhase (+48 more)

### Community 8 - "source-amendment.ts"
Cohesion: 0.07
Nodes (63): adoptCandidate(), approvedText(), assert(), amendmentIssueSha256(), authorizeSourceAmendment(), Binding, assert(), normalize() (+55 more)

### Community 9 - "MapView.tsx"
Cohesion: 0.07
Nodes (42): guidanceExcerpt(), KnowledgeCapturePage, Activity(), ActivityStatus(), AssignmentKnowledge(), BrainWorkspace(), CaptureReviewDetail(), CaptureReviews() (+34 more)

### Community 10 - "index.tsx"
Cohesion: 0.09
Nodes (48): KnowledgeSourceSummary, AddPublicSource(), AddSourceForm(), SourceConnection, SourceCard(), supported, UploadSource(), WithdrawSource() (+40 more)

### Community 11 - "run-retrospective.ts"
Cohesion: 0.08
Nodes (43): Accepted, acceptRetrospective(), normalizeStatement(), RETROSPECTIVE_HISTORY, appendLearningFacts(), freezeLearningPacket(), ARTIFACT_LIMIT, clip() (+35 more)

### Community 12 - "scheduled-work.ts"
Cohesion: 0.10
Nodes (41): deliverySlot(), closeoutRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), deterministicActions, eligible(), requestResolved() (+33 more)

### Community 13 - "agents.ts"
Cohesion: 0.09
Nodes (36): cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), cecChatPrompt(), ctoChatPrompt(), itChatPrompt(), slackSendPrompt() (+28 more)

### Community 14 - "PeoplePanel.tsx"
Cohesion: 0.09
Nodes (41): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+33 more)

### Community 15 - "shared.ts"
Cohesion: 0.07
Nodes (43): StageContext, maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject, SubjectStepResult (+35 more)

### Community 16 - "closeout-recovery.ts"
Cohesion: 0.12
Nodes (44): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+36 more)

### Community 17 - "weekly-research.ts"
Cohesion: 0.09
Nodes (18): retryDelay(), mirror(), ResearchResult, runWeeklyResearch(), scheduledResearch(), DailyCTO, dailyReviewPrompt(), Briefing (+10 more)

### Community 18 - "offices.ts"
Cohesion: 0.10
Nodes (25): Config, configDigest(), IntakeConfig, readConfig(), Command, sourceCommand(), fanoutSourceLearning(), configDigestForSeed() (+17 more)

### Community 19 - "engine.ts"
Cohesion: 0.07
Nodes (22): correlatedBuild(), JiraOperations, plain(), checkMail(), drainMail(), requestMail(), dispatchNightly(), drainDelivery() (+14 more)

### Community 20 - "conversations/conversations.ts"
Cohesion: 0.07
Nodes (30): ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff(), saveGoals() (+22 more)

### Community 21 - "worker-runtime.ts"
Cohesion: 0.09
Nodes (32): candidateWorkspaceEnvironment(), diagnosticContext(), prepareExposure(), contextPacket(), DeliverySlot, ModelRoute, labels, toolActivity() (+24 more)

### Community 22 - "index.ts"
Cohesion: 0.10
Nodes (35): close(), config, itSpecialist, loadedRevision, offices, releaseLock, server, serviceHealth (+27 more)

### Community 23 - "notifications.ts"
Cohesion: 0.09
Nodes (27): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR (+19 more)

### Community 24 - "accept-stage-result.ts"
Cohesion: 0.14
Nodes (38): acceptStageResult(), PrerequisitesSchema, mergeAuthorized(), allowed, assertContinuationWorker(), continuationNativeReview(), continuationReviewArtifacts(), continuationWorkerProof() (+30 more)

### Community 25 - "github-readiness.ts"
Cohesion: 0.12
Nodes (32): findingsBlock(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery(), DECISION_KINDS, needsDecision(), acceptConflictRepair() (+24 more)

### Community 26 - "github-delivery.ts"
Cohesion: 0.09
Nodes (24): BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction(), dependabotReviewGuidance(), discover(), refreshDependencies(), routeExisting() (+16 more)

### Community 27 - "TimeBook.tsx"
Cohesion: 0.10
Nodes (35): TelemetryReport, AzureBuild, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens(), usd() (+27 more)

### Community 28 - "goal-reporting.ts"
Cohesion: 0.09
Nodes (31): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+23 more)

### Community 29 - "maintenance.ts"
Cohesion: 0.09
Nodes (27): ApproachSchema, maintenancePolicies(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice(), candidateOwner() (+19 more)

### Community 30 - "blocker-followups.ts"
Cohesion: 0.13
Nodes (28): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved() (+20 more)

### Community 31 - "activation-recovery.ts"
Cohesion: 0.13
Nodes (34): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+26 more)

### Community 32 - "OfficeSnapshot"
Cohesion: 0.09
Nodes (30): FeatureRound, FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures(), draftKey() (+22 more)

### Community 33 - "cec/workflow.ts"
Cohesion: 0.14
Nodes (32): parksInJira(), MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), run(), advance(), nextStage(), publicationEvidenceGap() (+24 more)

### Community 34 - "queue-repairs.ts"
Cohesion: 0.15
Nodes (28): removeAdoptedClone(), namedRepairIds(), adoptedReviewCandidate(), ciCheckout(), finishCISetup(), verifyCIHooks(), CIFailure, guardCIRepair() (+20 more)

### Community 35 - "run-accounting.ts"
Cohesion: 0.11
Nodes (34): ghLogCacheEvidence(), BoundedRead, done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf(), backfillClaudeCost() (+26 more)

### Community 36 - "session-bridge.ts"
Cohesion: 0.11
Nodes (26): claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexSessionContext(), readRollout, claudeSessions(), codexSessions() (+18 more)

### Community 37 - "digest"
Cohesion: 0.15
Nodes (36): containedFile(), verifiedCloseoutCleanupRequest(), candidateInput(), children, oldAdoptionBasis(), savedCandidateAdmission, Assessment, outsideScanSources() (+28 more)

### Community 38 - "knowledge/routes.ts"
Cohesion: 0.14
Nodes (26): intakeActivity(), knowledgeActivityPage(), KnowledgeContext, independentDigestEvidence(), digestKnowledge(), prepareDigestBodies(), retainDigestBody(), publicSearch() (+18 more)

### Community 39 - "slack-intake/run.ts"
Cohesion: 0.13
Nodes (30): independentIntakeResult(), captureProposal(), effectId(), newTask(), recordObservation(), settlePage(), ChannelProgress, DERIVED (+22 more)

### Community 40 - "task-briefing.ts"
Cohesion: 0.12
Nodes (23): AssignmentLookups, Binding, lookupInstructions(), decodeLookupJournal(), lookupJournal, readLookupJournal(), citations(), recordAcceptedKnowledge() (+15 more)

### Community 41 - "schedule.ts"
Cohesion: 0.15
Nodes (22): reconcileIntakeStatus(), scheduledSlackIntake(), sourceWork(), combineIntakeMetrics(), IntakeMetrics, intakeStatusMetrics(), validTime(), IntakeBudget (+14 more)

### Community 42 - "digest"
Cohesion: 0.16
Nodes (27): comparableSlackText(), createExtractor(), extractDocument, Extraction, Extractor, uploadArtifact(), AuthoredDigest, reconcileDigestAuthorship() (+19 more)

### Community 43 - "command"
Cohesion: 0.11
Nodes (18): reviewQuestions(), featureItemComplete(), reconcileFeatureCompletion(), GitHubFeaturePublisher, helperTelemetry(), JiraFeaturePublisher, recoverFeatures(), EvidenceSchema (+10 more)

### Community 44 - "telemetry.ts"
Cohesion: 0.09
Nodes (30): CodexRollout, CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL (+22 more)

### Community 45 - "constellation-runtime.ts"
Cohesion: 0.12
Nodes (23): KnowledgeMap, KnowledgeNode, CameraPose, flightPose(), cameraTarget(), Point, Constellation(), ConstellationView (+15 more)

### Community 46 - ".emit"
Cohesion: 0.12
Nodes (22): assertConversationReadback(), reconcileNoticeConfirmations(), finishSupersededReadback(), settleRequestedSlackReplacement(), pump(), PickupSchema, savePickup(), harperHandoff() (+14 more)

### Community 47 - "github/issue-publication.ts"
Cohesion: 0.17
Nodes (13): FeaturePublisher, PublicationReceipt, publishFeature(), reserveIdentity(), Assign, Board, Content, GitHubIssuePublisher (+5 more)

### Community 48 - "IntakeLedger"
Cohesion: 0.19
Nodes (16): CaptureReceipt, IntakeResult, IntakeResultValue, LIMITS, Observation, ReadKind, ReadTask, SourceUnit (+8 more)

### Community 49 - "outbox.ts"
Cohesion: 0.14
Nodes (21): projectOutbox(), syncOutbox(), projectSlackDeliveries(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint(), slackRequestSettled() (+13 more)

### Community 50 - "investigations/run.ts"
Cohesion: 0.15
Nodes (21): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_FIX_PROMPT, OfficeFixResult (+13 more)

### Community 51 - "Store"
Cohesion: 0.14
Nodes (13): fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch(), foreignWork(), WorkSlot (+5 more)

### Community 52 - "store.ts"
Cohesion: 0.11
Nodes (21): AUTO_ADOPT_BOTS, goalEvidencePath(), localBindings, initialSnapshot(), initializeStoreSchema(), assertModelOverrides(), CODEX_DEFAULT_EFFORT, CODEX_DEFAULT_MODEL (+13 more)

### Community 53 - ".getEffect"
Cohesion: 0.16
Nodes (12): GitHubOperations, fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), Assessment, closeNativeRefresh(), fingerprint(), EffectOperation (+4 more)

### Community 54 - "sourceVisible"
Cohesion: 0.25
Nodes (20): knowledgeActivity(), assignmentKnowledge(), knowledgeSnapshot(), officeKnowledgeSnapshot(), publicReference(), referenceVisible(), lookupSummaryVisible(), publicLookupSummary() (+12 more)

### Community 55 - ".save"
Cohesion: 0.23
Nodes (24): unpack(), BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue(), readIssues() (+16 more)

### Community 56 - "harnessEffect"
Cohesion: 0.18
Nodes (21): activeEffectId(), harnessEffect, resume(), resumeProviderReviews(), observe(), linkDraftIssue(), protectedOriginalClaim(), publicationReadArgs() (+13 more)

### Community 57 - "features/workflow.ts"
Cohesion: 0.17
Nodes (20): discoveryPrompt(), planPrompt(), document(), featureRoot(), DiscoverySchema, identity, manifestFromPlan(), ManifestSchema (+12 more)

### Community 58 - "approval.ts"
Cohesion: 0.22
Nodes (18): approveFeature(), assertRetainedItems(), commandFeature(), createFeature(), featureById(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges() (+10 more)

### Community 59 - "github-check-selection.ts"
Cohesion: 0.20
Nodes (19): checksFailed(), checksPassed(), checksPending(), CurrentChecksWait, currentMergeChecks(), pass(), pending(), requireThat() (+11 more)

### Community 60 - "cec/issue-publication.ts"
Cohesion: 0.24
Nodes (7): Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), plainDescription(), Transition

### Community 61 - "assertMayMutate"
Cohesion: 0.23
Nodes (15): MOVABLE, moveLane(), harnessCloseout(), PASSING, verifyMergeActions(), assertMayMutate(), runHarnessStage(), harnessStageResult() (+7 more)

### Community 62 - "process.ts"
Cohesion: 0.20
Nodes (16): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+8 more)

### Community 63 - "reader.ts"
Cohesion: 0.12
Nodes (10): committedNotePage(), BrainGraph, BrainNote, BrainReader, CommittedBrain, GraphNode, GraphPage, hash (+2 more)

### Community 64 - "knowledge/learning-events.ts"
Cohesion: 0.17
Nodes (19): distinct(), identity(), improvementIncident(), improvementIncidentKey(), captureLearning(), learningDigest(), recordLearningOpportunity(), expireLearningPackets() (+11 more)

### Community 65 - "slack-intake/report.ts"
Cohesion: 0.23
Nodes (19): privateFile(), Proposal, isStoppingFor(), intakeProgress(), terminalDeferred(), unitKey(), verifiedCapture(), LinkRecord (+11 more)

### Community 67 - "service-health.ts"
Cohesion: 0.14
Nodes (11): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, DailyCTOSummary (+3 more)

### Community 68 - "slack-intake/config.ts"
Cohesion: 0.17
Nodes (17): exactly(), Message, nativeReadPayload(), pagination(), nativeFile(), Fields, PublicHosts, SlackAppId (+9 more)

### Community 69 - "knowledge.ts"
Cohesion: 0.13
Nodes (20): KnowledgeAssignment, DeliveryMetrics, ImprovementGrant, KnowledgeRetry, LearningMetrics, Lesson, LessonExposure, LessonRecurrence (+12 more)

### Community 70 - "discovery-recovery.ts"
Cohesion: 0.14
Nodes (15): Assessment, diagnosticProof(), ownedArtifact(), Ownership, rawHash(), recoverDiscovery(), scopeNote(), BrainStatusSchema (+7 more)

### Community 71 - "weekly-rollup.ts"
Cohesion: 0.16
Nodes (17): deliveryMetrics(), median(), learningMetrics(), lessonsNeedingReview(), RollupResult, RollupResultSchema, harperFolder(), RETROSPECTIVE_TIMEOUT (+9 more)

### Community 72 - "fact-bounds.ts"
Cohesion: 0.20
Nodes (18): leadershipContext(), leadershipEntries(), knowledgeEntries(), collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime() (+10 more)

### Community 73 - "coordination.ts"
Cohesion: 0.18
Nodes (18): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation(), checkpointWindow(), dueAt() (+10 more)

### Community 74 - "validate-stage.ts"
Cohesion: 0.17
Nodes (16): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+8 more)

### Community 75 - "dependencies.ts"
Cohesion: 0.25
Nodes (16): Admission, admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, compatible(), dependencyCompletionKey(), dependencyEligibility() (+8 more)

### Community 76 - "lesson-selection.ts"
Cohesion: 0.20
Nodes (16): knowledgeContext(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), MAINTENANCE, MAX_LESSONS (+8 more)

### Community 77 - "contract.ts"
Cohesion: 0.20
Nodes (12): At, Errno, GroupInventory, GroupProbe, LifecycleDiagnostic, Phase, Pid, groupInventory() (+4 more)

### Community 78 - "LessonsPanel.tsx"
Cohesion: 0.16
Nodes (11): BlockerFollowups(), IntakeSummary(), LessonsPanel(), when(), ResearchSummary(), format, labels, SlackIntakeStatus() (+3 more)

### Community 79 - "sources/retained-scope.ts"
Cohesion: 0.25
Nodes (10): retainedArtifactScope(), eventSourceBindings(), assignmentSubject(), LessonSelection, exposureBindings(), requestSourceBindings(), acceptedSourceBindings(), assertRetainedDispatchScope() (+2 more)

### Community 80 - "features.ts"
Cohesion: 0.21
Nodes (12): currentApproval(), featureGate(), predecessorComplete(), scheduledFeatures(), improvementIntakeGate(), FeatureApproval, FeatureAttempt, FeatureBinding (+4 more)

### Community 81 - "delivery-task.ts"
Cohesion: 0.20
Nodes (11): cecPrompt(), resolvedDecisionNote(), stageInstructions, APPROACH_GUIDANCE, reviewInstructions(), deliveryTask(), DeliveryTaskInput, DISCOVERY_GUIDANCE (+3 more)

### Community 82 - "publish-pr.ts"
Cohesion: 0.26
Nodes (13): retryRead(), developerPRContent(), Execute, lintPRContent(), officePRContent(), prContent, assertCandidate(), Candidate (+5 more)

### Community 83 - "admit-improvement.ts"
Cohesion: 0.27
Nodes (10): admitImprovement(), improvementEligible(), improvementManifest(), improvementMarker(), improvementProvider(), linkedRepairGap(), IMPROVEMENT_POLICY, queueImprovements() (+2 more)

### Community 84 - "captures.ts"
Cohesion: 0.25
Nodes (11): captureAfter(), CaptureMetadata, capturePage(), cursor(), key(), captureIdentityMatches(), BrainCaptureReceipt, hash (+3 more)

### Community 85 - "coordination-tick.ts"
Cohesion: 0.24
Nodes (10): legacy, reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION, tick(), incompleteReadOutput(), IntakeResult (+2 more)

### Community 86 - "preferences-store.ts"
Cohesion: 0.21
Nodes (9): PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS, OfficePreferences (+1 more)

### Community 87 - "closeout-supervision-proof.ts"
Cohesion: 0.24
Nodes (12): CloseoutSupervisionProofRef, Envelope, hash, head, identity, instant(), known, pid (+4 more)

### Community 88 - "projects.ts"
Cohesion: 0.24
Nodes (8): readLocalIntakeReport(), file, project, root, officeCapacity, projectById(), projectData(), PROJECTS

### Community 90 - "Ticket"
Cohesion: 0.27
Nodes (4): Agents, WorkerRuntime, Stage, Ticket

### Community 91 - "outbound.ts"
Cohesion: 0.32
Nodes (8): assertDigestDispatch(), outboundBody(), retainOutboundBody(), digestNoticeRequest(), queueOutboundDigests(), sendDigestNotice(), Target, knowledgeScopeRevision()

### Community 92 - "DailyCTO.tsx"
Cohesion: 0.26
Nodes (8): CTOReview(), goalState, DailyCTO(), GoalHistory(), reportDate(), reviewStatus, reviewExcerpt(), ReviewText()

### Community 93 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 94 - "retire-external-delivery.ts"
Cohesion: 0.44
Nodes (6): completedPRReviews(), eligible(), mergedByOwner(), ownerSettles(), retireExternalDeliveries(), settledExternalRepair()

### Community 95 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 97 - "cli.ts"
Cohesion: 0.29
Nodes (5): args, [cmd,...rawArgs], commands, key, projectIndex

### Community 99 - "OfficeConfigView.tsx"
Cohesion: 0.48
Nodes (5): loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView(), OfficeConfigSummary

### Community 100 - "install-service.mjs"
Cohesion: 0.33
Nodes (5): file, folder, logs, root, xml()

### Community 101 - "liveReach"
Cohesion: 0.60
Nodes (5): GIT_NETWORK, LIVE_PROVIDERS, liveReach(), networkUrl(), remoteUrls()

### Community 102 - "extract-worker.mjs"
Cohesion: 0.70
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 103 - "launch-policy.ts"
Cohesion: 0.60
Nodes (4): LaunchPolicy, launchPolicyFacts(), LaunchPolicyReceipt, retainLaunchPolicy()

### Community 104 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

## Knowledge Gaps
- **387 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+382 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `dependency-bots/adopt.ts`, `artifact`, `http/commands.ts`, `WorkTime`, `GitHubDelivery`, `source-amendment.ts`, `run-retrospective.ts`, `scheduled-work.ts`, `agents.ts`, `shared.ts`, `closeout-recovery.ts`, `weekly-research.ts`, `offices.ts`, `engine.ts`, `conversations/conversations.ts`, `worker-runtime.ts`, `index.ts`, `notifications.ts`, `accept-stage-result.ts`, `github-readiness.ts`, `github-delivery.ts`, `goal-reporting.ts`, `maintenance.ts`, `blocker-followups.ts`, `activation-recovery.ts`, `OfficeSnapshot`, `cec/workflow.ts`, `queue-repairs.ts`, `run-accounting.ts`, `session-bridge.ts`, `digest`, `knowledge/routes.ts`, `slack-intake/run.ts`, `task-briefing.ts`, `schedule.ts`, `digest`, `command`, `.emit`, `github/issue-publication.ts`, `IntakeLedger`, `outbox.ts`, `investigations/run.ts`, `store.ts`, `.getEffect`, `sourceVisible`, `.save`, `harnessEffect`, `features/workflow.ts`, `approval.ts`, `cec/issue-publication.ts`, `assertMayMutate`, `process.ts`, `knowledge/learning-events.ts`, `slack-intake/report.ts`, `Coordinator`, `service-health.ts`, `slack-intake/config.ts`, `discovery-recovery.ts`, `weekly-rollup.ts`, `fact-bounds.ts`, `coordination.ts`, `validate-stage.ts`, `dependencies.ts`, `lesson-selection.ts`, `sources/retained-scope.ts`, `features.ts`, `delivery-task.ts`, `publish-pr.ts`, `admit-improvement.ts`, `coordination-tick.ts`, `closeout-supervision-proof.ts`, `projects.ts`, `.pump`, `Ticket`, `outbound.ts`, `retire-external-delivery.ts`, `project-progress.ts`, `brain-followup.ts`?**
  _High betweenness centrality (0.130) - this node is a cross-community bridge._
- **Why does `Role` connect `worker-runtime.ts` to `Inspector.tsx`, `OfficeScene.tsx`, `http/commands.ts`, `App.tsx`, `agents.ts`, `PeoplePanel.tsx`, `shared.ts`, `conversations/conversations.ts`, `accept-stage-result.ts`, `github-readiness.ts`, `github-delivery.ts`, `maintenance.ts`, `OfficeSnapshot`, `cec/workflow.ts`, `run-accounting.ts`, `.emit`, `outbox.ts`, `Store`, `store.ts`, `validate-stage.ts`, `sources/retained-scope.ts`, `delivery-task.ts`, `projects.ts`, `Ticket`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `OfficeSnapshot` connect `OfficeSnapshot` to `Inspector.tsx`, `OfficeScene.tsx`, `http/commands.ts`, `App.tsx`, `MapView.tsx`, `index.tsx`, `agents.ts`, `PeoplePanel.tsx`, `shared.ts`, `worker-runtime.ts`, `index.ts`, `TimeBook.tsx`, `goal-reporting.ts`, `maintenance.ts`, `blocker-followups.ts`, `cec/workflow.ts`, `outbox.ts`, `Store`, `store.ts`, `service-health.ts`, `LessonsPanel.tsx`, `sources/retained-scope.ts`, `DailyCTO.tsx`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `command()` (e.g. with `.constructor()` and `executeRequest()`) actually correct?**
  _`command()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _387 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dependency-bots/adopt.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._
- **Should `Inspector.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08724608724608725 - nodes in this community are weakly interconnected._