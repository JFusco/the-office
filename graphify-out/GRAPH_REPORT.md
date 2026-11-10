# Graph Report - the-office  (2026-11-10)

## Corpus Check
- 683 files · ~283,074 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3502 nodes · 15452 edges · 95 communities (93 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 96 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4eea877d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- github-delivery.ts
- source-amendment-scope.ts
- Inspector.tsx
- artifact
- requests.ts
- TicketJob
- saved-prerequisite-handoff.ts
- .getEffect
- App.tsx
- cx
- record-trigger.ts
- shared.ts
- Ticket
- OfficeSnapshot
- worker-runtime.ts
- index.tsx
- LessonsPanel.tsx
- dependency-bots/adopt.ts
- scheduled-work.ts
- knowledge/routes.ts
- SourceRegistry
- schedule.ts
- maintenance.ts
- slack-intake/run.ts
- knowledge-views.ts
- session-bridge.ts
- conversations/conversations.ts
- dependencies.ts
- easternDay
- knowledge/learning-events.ts
- coordination.ts
- .emit
- upload.ts
- closeout.ts
- investigations/run.ts
- knowledge.ts
- WorkTime
- .save
- .transaction
- process.ts
- index.ts
- .get
- workKey
- resume-provider-review.ts
- offices.ts
- github/issue-publication.ts
- task-briefing.ts
- slack-intake/report.ts
- service-health.ts
- preferences-store.ts
- scheduler.ts
- lesson-selection.ts
- digest
- activation-recovery.ts
- cec/issue-publication.ts
- jira-time.ts
- harnessEffect
- assertMayMutate
- Coordinator
- FeatureWorkspace.tsx
- TimeBook.tsx
- cec/workflow.ts
- retrospective-subject.ts
- reconcile-mailbox.ts
- outbox.ts
- knowledge-snapshot.ts
- OfficeConfigView.tsx
- engine.ts
- goal-reviews.ts
- azure.ts
- run-retrospective.ts
- notifications.ts
- tracking-issue.ts
- Store
- run-accounting.ts
- publish-pr.ts
- admit-improvement.ts
- fact-bounds.ts
- run-evidence.ts
- agents.ts
- projects.ts
- MaintenanceRun
- blocker-followups.ts
- .value
- validate-stage.ts
- command-registry.ts
- contracts.ts
- source-amendment.ts
- ServiceHealthPanel.tsx
- launch-policy.ts
- extract-worker.mjs
- IntakeLedger
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

## Communities (95 total, 2 thin omitted)

### Community 0 - "github-delivery.ts"
Cohesion: 0.07
Nodes (79): containedFile(), removeAdoptedClone(), findingsBlock(), namedRepairIds(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery() (+71 more)

### Community 1 - "source-amendment-scope.ts"
Cohesion: 0.10
Nodes (33): approvedText(), assert(), amendmentCaptureObservation(), capture, generation, GenerationContext, head, ids (+25 more)

### Community 2 - "Inspector.tsx"
Cohesion: 0.06
Nodes (61): Conversation(), Outbox(), SendMessage, recommendedReply(), slackMessageStatus(), SlackDeliveryCard(), labels, ServiceHealthRow() (+53 more)

### Community 3 - "artifact"
Cohesion: 0.08
Nodes (85): allowed, assertContinuationWorker(), continuationNativeReview(), continuationReviewArtifacts(), continuationWorkerProof(), negativeWorker(), reconcileContinuationReview(), savedNegativeContinuationReview() (+77 more)

### Community 4 - "requests.ts"
Cohesion: 0.08
Nodes (55): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+47 more)

### Community 5 - "TicketJob"
Cohesion: 0.07
Nodes (38): dependabotReviewGuidance(), StageContext, GitHubDelivery, stageRole(), checksFailed(), checksPassed(), checksPending(), currentMergeChecks() (+30 more)

### Community 6 - "saved-prerequisite-handoff.ts"
Cohesion: 0.30
Nodes (14): PrerequisitesSchema, continuationWorktree(), dependencyVersion(), handoffSavedPrerequisites(), hasSavedPrerequisiteResult(), Ownership, qualified(), readDependencies() (+6 more)

### Community 7 - ".getEffect"
Cohesion: 0.09
Nodes (23): channelNoticeAuthorized(), MergeNotifications, SlackMessages, SlackRequestSchema, GitHubOperations, digestNoticeNeverDispatched(), fileLessonIssue(), lessonIssueBody() (+15 more)

### Community 8 - "App.tsx"
Cohesion: 0.05
Nodes (44): themeColor, BrainWorkspace, CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants, ElevatorPhase, floorVariants (+36 more)

### Community 9 - "cx"
Cohesion: 0.07
Nodes (51): CameraBookmark, restoreBookmark(), Avatar(), AzureWall(), Chair(), Coworker(), CTORoom(), Desk() (+43 more)

### Community 10 - "record-trigger.ts"
Cohesion: 0.10
Nodes (39): baselineLearning(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences(), clip(), maintenanceBlockedId(), MaintenanceCandidate (+31 more)

### Community 11 - "shared.ts"
Cohesion: 0.06
Nodes (67): Admission, IntakeContext, ProjectReadiness, Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId (+59 more)

### Community 12 - "Ticket"
Cohesion: 0.11
Nodes (20): cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), cecChatPrompt(), ctoChatPrompt(), slackSendPrompt(), slackVerifyPrompt() (+12 more)

### Community 13 - "OfficeSnapshot"
Cohesion: 0.14
Nodes (29): compactSteps(), App(), OfficeSnapshot, envelopeCard, deliveryRepairProjection(), DependencyNotice(), card, InboxQueue() (+21 more)

### Community 14 - "worker-runtime.ts"
Cohesion: 0.08
Nodes (36): candidateWorkspaceEnvironment(), assertDigestDispatch(), dispatchExposure(), prepareExposure(), contextPacket(), assertModelOverrides(), CODEX_DEFAULT_EFFORT, CODEX_DEFAULT_MODEL (+28 more)

### Community 15 - "index.tsx"
Cohesion: 0.06
Nodes (68): KnowledgeCapturePage, KnowledgeCadence, KnowledgeDestination, KnowledgeSourceKind, KnowledgeSourceState, KnowledgeSourceSummary, KnowledgeActivityPage, Activity() (+60 more)

### Community 16 - "LessonsPanel.tsx"
Cohesion: 0.10
Nodes (33): IntakeSummary(), LessonsPanel(), when(), ResearchSummary(), completedTime, SlackSeedStatus(), SaveFeedback(), TONE (+25 more)

### Community 17 - "dependency-bots/adopt.ts"
Cohesion: 0.15
Nodes (24): adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR, openDependabotPulls(), readRepo() (+16 more)

### Community 18 - "scheduled-work.ts"
Cohesion: 0.10
Nodes (44): deliverySlot(), closeoutRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), validTicket(), deterministicActions, eligible() (+36 more)

### Community 19 - "knowledge/routes.ts"
Cohesion: 0.10
Nodes (34): intakeActivity(), knowledgeActivityPage(), committedNotePage(), BrainReader, guidanceExcerpt(), KnowledgeContext, independentDigestEvidence(), digestKnowledge() (+26 more)

### Community 20 - "SourceRegistry"
Cohesion: 0.10
Nodes (26): diagnosticSnapshot(), retainedArtifactScope(), eventSourceBindings(), eventVisible(), assignmentSubject(), exposureBindings(), requestSourceBindings(), knowledgeOfficeState() (+18 more)

### Community 21 - "schedule.ts"
Cohesion: 0.21
Nodes (21): KnowledgeRunner, LIMITS, linkKey(), LinkRecord, LinkResult, PublicReadPolicy, runSlackLinks(), checkedReceipt() (+13 more)

### Community 22 - "maintenance.ts"
Cohesion: 0.10
Nodes (27): maintenancePolicies(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice(), candidateOwner(), SETTLED (+19 more)

### Community 23 - "slack-intake/run.ts"
Cohesion: 0.20
Nodes (16): Observation, Message, observeRead(), Page, readArguments(), readMethod(), ReadUnavailable, intakePrompt() (+8 more)

### Community 24 - "knowledge-views.ts"
Cohesion: 0.10
Nodes (28): KnowledgeActivity, KnowledgeEdge, KnowledgeIntakeStatus, KnowledgeMap, KnowledgeNode, CameraPose, flightPose(), cameraTarget() (+20 more)

### Community 25 - "session-bridge.ts"
Cohesion: 0.10
Nodes (28): claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexSessionContext(), readRollout, claudeSessions(), codexSessions() (+20 more)

### Community 26 - "conversations/conversations.ts"
Cohesion: 0.13
Nodes (23): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, ReplySchema, pumpCTO(), queueCTOHandoff(), saveGoals() (+15 more)

### Community 27 - "dependencies.ts"
Cohesion: 0.14
Nodes (24): reconcileNoticeConfirmations(), admit(), resumeParked(), compatible(), dependencyCompletionKey(), dependencyEligibility(), DependencyStores, issueKey() (+16 more)

### Community 28 - "easternDay"
Cohesion: 0.09
Nodes (27): retryDelay(), mirror(), runWeeklyResearch(), scheduledResearch(), DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt() (+19 more)

### Community 29 - "knowledge/learning-events.ts"
Cohesion: 0.27
Nodes (11): improvementIntakeGate(), captureLearning(), learningDigest(), recordLearningOpportunity(), captureMaintenanceStep(), retainAcceptedResult(), publicTopicSafe(), researchTopics() (+3 more)

### Community 30 - "coordination.ts"
Cohesion: 0.16
Nodes (20): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation(), maintenanceSuperseded(), REOBSERVED (+12 more)

### Community 31 - ".emit"
Cohesion: 0.17
Nodes (19): ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), retryRecipientLookup(), bindDiscoveryResume(), DiscoveryResumeInput, configureDigestDelivery() (+11 more)

### Community 32 - "upload.ts"
Cohesion: 0.53
Nodes (4): createExtractor(), extractDocument, Extraction, Extractor

### Community 33 - "closeout.ts"
Cohesion: 0.29
Nodes (11): harnessCloseout(), PASSING, verifyMergeActions(), runHarnessStage(), harnessStageResult(), receipt(), harnessDraft(), harnessPrepare() (+3 more)

### Community 34 - "investigations/run.ts"
Cohesion: 0.12
Nodes (28): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationCandidates(), investigationId(), investigationEvidence(), investigationFollowUps(), INVOCATION_SOURCE_REFS, invocationSource() (+20 more)

### Community 35 - "knowledge.ts"
Cohesion: 0.07
Nodes (43): Accepted, acceptRetrospective(), normalizeStatement(), RETROSPECTIVE_HISTORY, ARTIFACT_LIMIT, clip(), LEDGER_STEPS, MAINTENANCE_LIMIT (+35 more)

### Community 36 - "WorkTime"
Cohesion: 0.09
Nodes (46): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence(), CaptureContext (+38 more)

### Community 37 - ".save"
Cohesion: 0.15
Nodes (30): JiraOperations, plain(), unpack(), BLOCKED, Execute, findComment(), jira(), LiveIssue (+22 more)

### Community 38 - ".transaction"
Cohesion: 0.07
Nodes (61): approveFeature(), assertRetainedItems(), commandFeature(), createFeature(), featureById(), mutation(), reviewQuestions(), featureItemComplete() (+53 more)

### Community 39 - "process.ts"
Cohesion: 0.15
Nodes (18): At, Errno, GroupInventory, GroupProbe, LifecycleDiagnostic, Phase, Pid, groupInventory() (+10 more)

### Community 40 - "index.ts"
Cohesion: 0.09
Nodes (32): args, [cmd,...rawArgs], commands, key, projectIndex, close(), config, itSpecialist (+24 more)

### Community 41 - ".get"
Cohesion: 0.12
Nodes (27): uploadArtifact(), captureProposal(), effectId(), recordObservation(), settlePage(), DERIVED, isStoppingFor(), reconcileIntakeStatus() (+19 more)

### Community 42 - "workKey"
Cohesion: 0.08
Nodes (49): completedPRReviews(), continuationScope(), continuationGuard(), Assessment, diagnosticProof(), discoveryRecoveryCandidate(), ownedArtifact(), Ownership (+41 more)

### Community 43 - "resume-provider-review.ts"
Cohesion: 0.16
Nodes (29): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard, projectCards() (+21 more)

### Community 44 - "offices.ts"
Cohesion: 0.15
Nodes (15): leadershipContext(), leadershipEntries(), decideOfficeProposal(), mirrorOfficeKnowledge(), now(), OfficeKnowledgeStore, proposeOfficeLessons(), retireOfficeLesson() (+7 more)

### Community 45 - "github/issue-publication.ts"
Cohesion: 0.14
Nodes (14): GitHubFeaturePublisher, FeaturePublisher, PublicationReceipt, Assign, Board, Content, GitHubIssuePublisher, number() (+6 more)

### Community 46 - "task-briefing.ts"
Cohesion: 0.10
Nodes (29): assignmentKnowledge(), LessonSelection, AssignmentLookups, Binding, lookupInstructions(), decodeLookupJournal(), lookupJournal, readLookupJournal() (+21 more)

### Community 47 - "slack-intake/report.ts"
Cohesion: 0.21
Nodes (16): newTask(), privateFile(), intakeProgress(), terminalDeferred(), unitKey(), verifiedCapture(), queueReconsideration(), readyReferences() (+8 more)

### Community 48 - "service-health.ts"
Cohesion: 0.19
Nodes (8): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, ServiceHealth

### Community 49 - "preferences-store.ts"
Cohesion: 0.19
Nodes (10): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS (+2 more)

### Community 50 - "scheduler.ts"
Cohesion: 0.16
Nodes (13): ROLES, OfficeEntry, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch() (+5 more)

### Community 51 - "lesson-selection.ts"
Cohesion: 0.19
Nodes (16): knowledgeContext(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), MAINTENANCE, MAX_LESSONS (+8 more)

### Community 52 - "digest"
Cohesion: 0.11
Nodes (34): comparableSlackText(), AuthoredDigest, reconcileDigestAuthorship(), unitAuthorship(), annotateAuthoredUnits(), independentIntakeResult(), outboundBody(), retainOutboundBody() (+26 more)

### Community 53 - "activation-recovery.ts"
Cohesion: 0.15
Nodes (28): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+20 more)

### Community 54 - "cec/issue-publication.ts"
Cohesion: 0.21
Nodes (8): Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), plainDescription(), Transition, JiraFeaturePublisher

### Community 55 - "jira-time.ts"
Cohesion: 0.21
Nodes (13): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+5 more)

### Community 56 - "harnessEffect"
Cohesion: 0.21
Nodes (17): activeEffectId(), harnessEffect, park(), linkDraftIssue(), protectedOriginalClaim(), publicationReadArgs(), Read, readPublication() (+9 more)

### Community 57 - "assertMayMutate"
Cohesion: 0.19
Nodes (17): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+9 more)

### Community 59 - "FeatureWorkspace.tsx"
Cohesion: 0.17
Nodes (15): FeatureRound, FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures(), draftKey() (+7 more)

### Community 60 - "TimeBook.tsx"
Cohesion: 0.08
Nodes (45): TelemetryReport, displayAgentTask(), githubStageLabels, withoutElapsed(), LiveAgentTask(), Props, RunningTask(), text() (+37 more)

### Community 61 - "cec/workflow.ts"
Cohesion: 0.15
Nodes (31): correlatedBuild(), parksInJira(), run(), advance(), nextStage(), publicationEvidenceGap(), qaEvidenceGap(), resultGate() (+23 more)

### Community 62 - "retrospective-subject.ts"
Cohesion: 0.16
Nodes (18): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+10 more)

### Community 63 - "reconcile-mailbox.ts"
Cohesion: 0.29
Nodes (5): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), MessageInput, itChatPrompt()

### Community 64 - "outbox.ts"
Cohesion: 0.14
Nodes (22): projectOutbox(), syncOutbox(), projectSlackDeliveries(), settleRequestedSlackReplacement(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint() (+14 more)

### Community 65 - "knowledge-snapshot.ts"
Cohesion: 0.24
Nodes (20): knowledgeActivity(), officeKnowledgeSnapshot(), publicReference(), referenceVisible(), lookupSummaryVisible(), publicLookupSummary(), readAcceptedResult(), outcomeVisible() (+12 more)

### Community 66 - "OfficeConfigView.tsx"
Cohesion: 0.48
Nodes (5): loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView(), OfficeConfigSummary

### Community 67 - "engine.ts"
Cohesion: 0.08
Nodes (27): checkMail(), drainMail(), requestMail(), dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), resume() (+19 more)

### Community 68 - "goal-reviews.ts"
Cohesion: 0.14
Nodes (16): applyGoalReview(), EvidenceRefSchema, FreshDailyResultSchema, statusAllowed(), workEvidence(), GoalInput, saveGoal(), queueGoalNotice() (+8 more)

### Community 69 - "azure.ts"
Cohesion: 0.09
Nodes (31): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+23 more)

### Community 70 - "run-retrospective.ts"
Cohesion: 0.10
Nodes (32): appendLearningFacts(), learningMetrics(), lessonsNeedingReview(), freezeLearningPacket(), busyMaintenanceIds(), Kind, RetrospectiveResult, RetrospectiveResultSchema (+24 more)

### Community 71 - "notifications.ts"
Cohesion: 0.17
Nodes (17): clamp(), LIMITS, MergedPR, plainSlackText(), section(), shippedSummary(), configureNotices(), Identity (+9 more)

### Community 73 - "tracking-issue.ts"
Cohesion: 0.19
Nodes (17): readBackOrThrow(), ensureTrackingIssue(), findTrackingIssue(), ownTracking(), TrackingIssue, trackingIssueBody(), trackingIssueTitle(), trackingMarker() (+9 more)

### Community 74 - "Store"
Cohesion: 0.06
Nodes (20): Result, Assessment, Clock, officeCapacity, applyConnectionSettings(), closeConnection(), optimizeOnOpen(), statementCache() (+12 more)

### Community 76 - "run-accounting.ts"
Cohesion: 0.05
Nodes (69): ghLogCacheEvidence(), BoundedRead, done(), readBoundedNoFollow(), readBoundedNoFollowSync(), reasonOf(), backfillClaudeCost(), CompletionReader (+61 more)

### Community 77 - "publish-pr.ts"
Cohesion: 0.26
Nodes (13): retryRead(), developerPRContent(), Execute, lintPRContent(), officePRContent(), prContent, assertCandidate(), Candidate (+5 more)

### Community 78 - "admit-improvement.ts"
Cohesion: 0.27
Nodes (12): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+4 more)

### Community 80 - "fact-bounds.ts"
Cohesion: 0.26
Nodes (15): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+7 more)

### Community 81 - "run-evidence.ts"
Cohesion: 0.47
Nodes (4): comparable(), EvidenceOutcome, recordRunEvidence(), RunAccounting

### Community 82 - "agents.ts"
Cohesion: 0.11
Nodes (21): cecPrompt(), resolvedDecisionNote(), stageInstructions, SlackResultSchema, SlackVerificationSchema, HANDS_OFF_RESOLUTION_GUIDANCE, RESOLUTION_GUIDANCE, reviewInstructions() (+13 more)

### Community 83 - "projects.ts"
Cohesion: 0.08
Nodes (26): captureAfter(), CaptureMetadata, capturePage(), cursor(), key(), captureIdentityMatches(), BrainCaptureReceipt, hash (+18 more)

### Community 84 - "MaintenanceRun"
Cohesion: 0.21
Nodes (10): BrainStatusSchema, identity, brainCheckpointCompletion(), coverageSchema, followupSchema, verified, reconcileCompletedCheckpoints(), ReconciliationRequest (+2 more)

### Community 86 - "blocker-followups.ts"
Cohesion: 0.16
Nodes (21): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved() (+13 more)

### Community 88 - ".value"
Cohesion: 0.27
Nodes (6): file, folder, logs, root, xml(), ProjectProgress

### Community 91 - "validate-stage.ts"
Cohesion: 0.16
Nodes (17): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+9 more)

### Community 93 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 94 - "contracts.ts"
Cohesion: 0.22
Nodes (15): CaptureReceipt, ChannelProgress, IntakeResult, IntakeResultValue, Proposal, ReadKind, ReadTask, SourceUnit (+7 more)

### Community 96 - "source-amendment.ts"
Cohesion: 0.06
Nodes (71): deliveryTask(), DeliveryTaskInput, DISCOVERY_GUIDANCE, stagePrompt(), StagePromptInput, adoptCandidate(), reported, Scope (+63 more)

### Community 97 - "ServiceHealthPanel.tsx"
Cohesion: 0.25
Nodes (9): diagnosticContext(), DailyCTOSummary, itAgent(), itDiagnostics(), currentServices(), ServiceHealthPanel(), HealthReport, HeartPulse (+1 more)

### Community 99 - "launch-policy.ts"
Cohesion: 0.47
Nodes (5): LaunchPolicy, launchPolicyFacts(), LaunchPolicyReceipt, retainLaunchPolicy(), workerLaunchPolicy()

### Community 104 - "extract-worker.mjs"
Cohesion: 0.70
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 105 - "IntakeLedger"
Cohesion: 0.18
Nodes (10): IntakeLedger, combineIntakeMetrics(), IntakeMetrics, intakeStatusMetrics(), validTime(), SlackIntakeStatus, format, labels (+2 more)

### Community 106 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

## Knowledge Gaps
- **387 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+382 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `github-delivery.ts`, `artifact`, `requests.ts`, `TicketJob`, `saved-prerequisite-handoff.ts`, `.getEffect`, `record-trigger.ts`, `shared.ts`, `Ticket`, `OfficeSnapshot`, `worker-runtime.ts`, `dependency-bots/adopt.ts`, `scheduled-work.ts`, `knowledge/routes.ts`, `SourceRegistry`, `schedule.ts`, `maintenance.ts`, `slack-intake/run.ts`, `session-bridge.ts`, `conversations/conversations.ts`, `dependencies.ts`, `easternDay`, `knowledge/learning-events.ts`, `coordination.ts`, `.emit`, `closeout.ts`, `investigations/run.ts`, `knowledge.ts`, `WorkTime`, `.save`, `.transaction`, `index.ts`, `workKey`, `resume-provider-review.ts`, `offices.ts`, `github/issue-publication.ts`, `task-briefing.ts`, `slack-intake/report.ts`, `scheduler.ts`, `lesson-selection.ts`, `digest`, `activation-recovery.ts`, `cec/issue-publication.ts`, `jira-time.ts`, `harnessEffect`, `assertMayMutate`, `retrospective-subject.ts`, `reconcile-mailbox.ts`, `outbox.ts`, `engine.ts`, `goal-reviews.ts`, `azure.ts`, `run-retrospective.ts`, `notifications.ts`, `tracking-issue.ts`, `run-accounting.ts`, `publish-pr.ts`, `admit-improvement.ts`, `run-evidence.ts`, `agents.ts`, `MaintenanceRun`, `blocker-followups.ts`, `validate-stage.ts`, `contracts.ts`, `source-amendment.ts`, `ServiceHealthPanel.tsx`, `IntakeLedger`?**
  _High betweenness centrality (0.133) - this node is a cross-community bridge._
- **Why does `OfficeSnapshot` connect `OfficeSnapshot` to `Inspector.tsx`, `App.tsx`, `cx`, `record-trigger.ts`, `shared.ts`, `index.tsx`, `LessonsPanel.tsx`, `SourceRegistry`, `maintenance.ts`, `coordination.ts`, `investigations/run.ts`, `service-health.ts`, `scheduler.ts`, `FeatureWorkspace.tsx`, `TimeBook.tsx`, `cec/workflow.ts`, `reconcile-mailbox.ts`, `outbox.ts`, `azure.ts`, `Store`, `ServiceHealthPanel.tsx`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `command()` connect `Store` to `github-delivery.ts`, `requests.ts`, `TicketJob`, `.getEffect`, `worker-runtime.ts`, `scheduled-work.ts`, `schedule.ts`, `maintenance.ts`, `session-bridge.ts`, `dependencies.ts`, `coordination.ts`, `closeout.ts`, `.save`, `.transaction`, `process.ts`, `resume-provider-review.ts`, `github/issue-publication.ts`, `service-health.ts`, `cec/issue-publication.ts`, `jira-time.ts`, `harnessEffect`, `assertMayMutate`, `engine.ts`, `azure.ts`, `notifications.ts`, `publish-pr.ts`, `admit-improvement.ts`, `agents.ts`, `projects.ts`, `validate-stage.ts`, `command-registry.ts`, `contracts.ts`, `source-amendment.ts`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `command()` (e.g. with `.constructor()` and `executeRequest()`) actually correct?**
  _`command()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _387 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `github-delivery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07424714434060228 - nodes in this community are weakly interconnected._
- **Should `source-amendment-scope.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10158730158730159 - nodes in this community are weakly interconnected._