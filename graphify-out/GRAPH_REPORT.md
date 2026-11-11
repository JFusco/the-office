# Graph Report - the-office  (2026-11-11)

## Corpus Check
- 795 files · ~316,561 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3936 nodes · 18050 edges · 100 communities (97 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 131 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bc0cda44`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- github-delivery.ts
- accept-stage-result.ts
- activation-recovery.ts
- harnessEffect
- slack-intake/run.ts
- Inspector.tsx
- knowledge.ts
- features/workflow.ts
- verifyRepairCandidate
- knowledge/routes.ts
- .save
- OfficeScene.tsx
- digest
- offices.ts
- cec/issue-publication.ts
- source-amendment-scope.ts
- index.tsx
- Store
- MapView.tsx
- Button
- agents.ts
- scheduled-work.ts
- scheduled-captures.ts
- .run
- migrations.ts
- schedule.ts
- ticket-evidence.ts
- it-specialist.ts
- record-trigger.ts
- OfficeSnapshot
- .transaction
- maintenance/maintenance.ts
- TeamUpdates.tsx
- artifact
- PeoplePanel.tsx
- features/commands.ts
- conversations/conversations.ts
- WorkTime
- features.ts
- index.ts
- conversations/slack.ts
- azure.ts
- http/commands.ts
- digest
- source-amendment.ts
- reader.ts
- telemetry.ts
- workKey
- scheduler.ts
- delivery-recoveries.ts
- run-accounting.ts
- outbox.ts
- intake/admission.ts
- retrospective-subject.ts
- TicketJob
- QuestionStepper.tsx
- requests.ts
- preferences-store.ts
- processGroupAlive
- assignment-poll.ts
- accepted.ts
- remove-candidate.ts
- .getEffect
- TelemetryPanel.tsx
- Coordinator
- session-bridge.ts
- .pump
- engine.ts
- .emit
- jira-time.ts
- service-health.ts
- delivery-repairs.ts
- contract.ts
- fact-bounds.ts
- discovery-recovery.ts
- admit-improvement.ts
- coordination.ts
- telemetry/report.ts
- dependency-bots/adopt.ts
- App.tsx
- cec/workflow.ts
- weekly-rollup.ts
- command-registry.ts
- investigations/ledger.ts
- scheduled-retrospectives.ts
- cost-entries.ts
- shared.ts
- OfficeConfigView.tsx
- extract-worker.mjs
- SlackIntakeStatus.tsx
- slack-supersession.ts
- helper-evidence.py
- .value
- seeded-office-lessons.ts
- codex-rollout.ts
- cli.ts
- QuestionNotifications
- liveReach
- run-evidence.ts

## God Nodes (most connected - your core abstractions)
1. `Store` - 359 edges
2. `TicketJob` - 162 edges
3. `GitHubDelivery` - 141 edges
4. `digest()` - 130 edges
5. `artifact()` - 114 edges
6. `command()` - 109 edges
7. `workKey()` - 95 edges
8. `cx()` - 88 edges
9. `currentAssignment()` - 82 edges
10. `OfficeSnapshot` - 71 edges

## Surprising Connections (you probably didn't know these)
- `Admission` --references--> `AssignmentReview`  [EXTRACTED]
  server/delivery/intake/admission.ts → src/shared.ts
- `visibleLabels()` --indirect_call--> `label()`  [INFERRED]
  src/knowledge/map/label-visibility.ts → server/workers/persona-context.ts
- `rows()` --indirect_call--> `row()`  [INFERRED]
  server/delivery/recovery/source-amendment/source-amendment-scope.ts → src/telemetry/report.ts
- `suppliedEvidence()` --indirect_call--> `reference()`  [INFERRED]
  src/knowledge/content/supplied-evidence.ts → server/knowledge/lesson-selection.ts
- `githubEvidence()` --indirect_call--> `row()`  [INFERRED]
  server/features/handoff/github-evidence.ts → src/telemetry/report.ts

## Import Cycles
- 3-file cycle: `src/knowledge/map/Constellation.tsx -> src/knowledge/map/constellation-runtime.ts -> src/knowledge/map/node-visuals.ts -> src/knowledge/map/Constellation.tsx`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/stage-reconciliation.ts -> server/delivery/recovery/implementation/continuation-review-readback.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/preparation/post-conflict-preparation.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/stopped-base-review.ts -> server/delivery/recovery/stopped-base-checkout.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/parking/resume-provider-review.ts -> server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/parking/resume-provider-review.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/recovery/retire-external-delivery.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/stage-prompts.ts -> server/delivery/publication/metadata-admission.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/stage-prompts.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/publication/metadata-review.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/implementation/activation-recovery.ts -> server/delivery/recovery/validation/validation-provider-context.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/implementation/continuation-guard.ts -> server/delivery/recovery/validation/validation-provider-context.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/implementation/saved-prerequisite-handoff.ts -> server/delivery/recovery/validation/validation-provider-context.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/preparation/post-conflict-preparation.ts -> server/delivery/recovery/preparation/preparation-provider-context.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/preparation/post-conflict-preparation.ts -> server/delivery/recovery/validation/validation-provider-context.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/preparation/post-conflict-preparation.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/pipeline/github-delivery.ts`

## Communities (100 total, 3 thin omitted)

### Community 0 - "github-delivery.ts"
Cohesion: 0.06
Nodes (88): containedFile(), findingsBlock(), assertDeliveryMayMutate(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery(), discover() (+80 more)

### Community 1 - "accept-stage-result.ts"
Cohesion: 0.09
Nodes (58): park(), acceptStageResult(), linkDraftIssue(), protectedOriginalClaim(), METADATA_FINDING, publicationReadArgs(), Read, readPublication() (+50 more)

### Community 2 - "activation-recovery.ts"
Cohesion: 0.09
Nodes (53): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+45 more)

### Community 3 - "harnessEffect"
Cohesion: 0.17
Nodes (30): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), ProjectCard, projectCards(), projectGraphql() (+22 more)

### Community 4 - "slack-intake/run.ts"
Cohesion: 0.10
Nodes (50): independentIntakeResult(), KnowledgeRunner, effectId(), CaptureReceipt, ChannelProgress, IntakeResult, IntakeResultValue, LIMITS (+42 more)

### Community 5 - "Inspector.tsx"
Cohesion: 0.07
Nodes (66): Conversation(), Outbox(), slackMessageStatus(), SlackDeliveryCard(), itAgent(), itDiagnostics(), ServiceHealthPanel(), labels (+58 more)

### Community 6 - "knowledge.ts"
Cohesion: 0.04
Nodes (100): ref_node_crypto, ref_node_fs, ref_node_path, ref_zod, Accepted, acceptRetrospective(), normalizeStatement(), RETROSPECTIVE_HISTORY (+92 more)

### Community 7 - "features/workflow.ts"
Cohesion: 0.07
Nodes (58): approveFeature(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), artifactPath(), digest(), document() (+50 more)

### Community 8 - "verifyRepairCandidate"
Cohesion: 0.13
Nodes (30): removeAdoptedClone(), pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), stoppedBaseCheckout(), assertStoppedBaseApproach(), stoppedBaseNextStage(), discussion(), pages() (+22 more)

### Community 9 - "knowledge/routes.ts"
Cohesion: 0.05
Nodes (86): intakeActivity(), knowledgeActivity(), knowledgeActivityPage(), createExtractor(), extractDocument, Extraction, Extractor, uploadArtifact() (+78 more)

### Community 10 - ".save"
Cohesion: 0.24
Nodes (23): BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue(), readIssues(), commentDecision() (+15 more)

### Community 11 - "OfficeScene.tsx"
Cohesion: 0.07
Nodes (51): CameraBookmark, restoreBookmark(), Avatar(), AzureWall(), Chair(), Coworker(), CTORoom(), Desk() (+43 more)

### Community 12 - "digest"
Cohesion: 0.12
Nodes (45): activeEffectId(), retryRead(), admitPRMetadata(), assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema, savedMetadataAssessment() (+37 more)

### Community 13 - "offices.ts"
Cohesion: 0.10
Nodes (26): queueOutboundDigests(), Config, configDigest(), IntakeConfig, readConfig(), SlackReadAuthority, Command, sourceCommand() (+18 more)

### Community 14 - "cec/issue-publication.ts"
Cohesion: 0.10
Nodes (20): Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), Transition, descriptionPreimage(), plain() (+12 more)

### Community 15 - "source-amendment-scope.ts"
Cohesion: 0.10
Nodes (34): approvedText(), assert(), amendmentCaptureObservation(), capture, generation, GenerationContext, head, ids (+26 more)

### Community 16 - "index.tsx"
Cohesion: 0.08
Nodes (50): KnowledgeCadence, KnowledgeDestination, KnowledgeSourceKind, KnowledgeSourceState, KnowledgeSourceSummary, AddPublicSource(), AddSourceForm(), SourceConnection (+42 more)

### Community 17 - "Store"
Cohesion: 0.05
Nodes (33): CommentPage, commentReadback(), JiraOperations, candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate() (+25 more)

### Community 18 - "MapView.tsx"
Cohesion: 0.08
Nodes (43): KnowledgeActivity, KnowledgeEdge, KnowledgeIntakeStatus, KnowledgeMap, KnowledgeNode, CameraPose, flightPose(), cameraTarget() (+35 more)

### Community 19 - "Button"
Cohesion: 0.13
Nodes (26): KnowledgeCapturePage, KnowledgeActivityPage, Activity(), ActivityStatus(), AssignmentKnowledge(), CaptureReviewDetail(), CaptureReviews(), empty (+18 more)

### Community 20 - "agents.ts"
Cohesion: 0.06
Nodes (60): cecPrompt(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), resolvedDecisionNote(), stageInstructions, cecChatPrompt() (+52 more)

### Community 21 - "scheduled-work.ts"
Cohesion: 0.10
Nodes (42): deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), metadataRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), requestPriority() (+34 more)

### Community 22 - "scheduled-captures.ts"
Cohesion: 0.11
Nodes (56): dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), resume(), startPilot(), advance(), eligibility() (+48 more)

### Community 23 - ".run"
Cohesion: 0.10
Nodes (21): candidateWorkspaceEnvironment(), assignmentSubject(), assertRetainedDispatchScope(), ClaudeStream, codexArguments(), workerLaunchPolicy(), personaContext(), recordWorkerFailure() (+13 more)

### Community 24 - "migrations.ts"
Cohesion: 0.11
Nodes (20): applyGoalReview(), EvidenceRefSchema, FreshDailyResultSchema, statusAllowed(), workEvidence(), GoalInput, saveGoal(), queueGoalNotice() (+12 more)

### Community 25 - "schedule.ts"
Cohesion: 0.11
Nodes (38): captureProposal(), newTask(), recordObservation(), settlePage(), reconcileIntakeStatus(), acceptProposals(), runSlackLinks(), queueReconsideration() (+30 more)

### Community 26 - "ticket-evidence.ts"
Cohesion: 0.12
Nodes (32): plain(), unpack(), jiraRecord(), assetDownloader(), attachmentKind(), evidenceDirectory(), readEvidence(), storeEvidence() (+24 more)

### Community 27 - "it-specialist.ts"
Cohesion: 0.15
Nodes (20): partialLocalCleanupKey(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), ITContext, diagnosticSnapshot(), publishITReport() (+12 more)

### Community 28 - "record-trigger.ts"
Cohesion: 0.14
Nodes (28): baselineLearning(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences(), MaintenanceCandidate, clip(), JobLike (+20 more)

### Community 29 - "OfficeSnapshot"
Cohesion: 0.15
Nodes (15): FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures(), TicketPlanningAction(), SnapshotAcceptance (+7 more)

### Community 30 - ".transaction"
Cohesion: 0.13
Nodes (26): featureItemComplete(), reconcileFeatureCompletion(), discoveryPrompt(), planPrompt(), reserveReplacement(), stageBudget(), classifyFeatureFailure(), automaticEnabled() (+18 more)

### Community 31 - "maintenance/maintenance.ts"
Cohesion: 0.09
Nodes (29): maintenancePolicies(), captureMaintenanceStep(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice(), candidateOwner() (+21 more)

### Community 32 - "TeamUpdates.tsx"
Cohesion: 0.06
Nodes (45): themeColor, App(), usePanelFocus(), acceptPreferences(), PreferenceCandidate, strip(), UNKNOWN_PREFERENCES, OfficePreferencesController (+37 more)

### Community 33 - "artifact"
Cohesion: 0.09
Nodes (57): candidateInput(), children, oldAdoptionBasis(), savedCandidateAdmission, assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence() (+49 more)

### Community 34 - "PeoplePanel.tsx"
Cohesion: 0.10
Nodes (40): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+32 more)

### Community 35 - "features/commands.ts"
Cohesion: 0.21
Nodes (20): commandFeature(), createFeature(), reviewQuestions(), assertEnrollable(), FeatureCommandSchema, applyHarnessAction(), HarnessActionInput, recoveryPreconditions() (+12 more)

### Community 36 - "conversations/conversations.ts"
Cohesion: 0.10
Nodes (30): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+22 more)

### Community 37 - "WorkTime"
Cohesion: 0.15
Nodes (28): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), ScopePolicy, scopeSelector(), midnight(), TicketDay, ticketDayTotals(), captureTime() (+20 more)

### Community 38 - "features.ts"
Cohesion: 0.13
Nodes (28): featureById(), currentApproval(), featureGate(), predecessorComplete(), deliveryPreflight, handoffBinding(), readHandoff(), sameBinding() (+20 more)

### Community 39 - "index.ts"
Cohesion: 0.10
Nodes (35): assertAssessmentVisibility(), assertQuestionVisibility(), close(), config, itSpecialist, loadedRevision, offices, releaseLock (+27 more)

### Community 40 - "conversations/slack.ts"
Cohesion: 0.11
Nodes (20): channelNoticeAuthorized(), MergeNotifications, settleRequestedSlackReplacement(), SlackMessages, SlackRequestSchema, assertDigestDispatch(), outboundBody(), retainOutboundBody() (+12 more)

### Community 41 - "azure.ts"
Cohesion: 0.08
Nodes (38): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+30 more)

### Community 42 - "http/commands.ts"
Cohesion: 0.25
Nodes (14): enqueueMetadataRecovery(), configureDigestDelivery(), DigestSettings, configureKnowledge(), declineLessonIssue(), demoteLesson(), reactivateLesson(), retireLesson() (+6 more)

### Community 43 - "digest"
Cohesion: 0.08
Nodes (34): comparableSlackText(), committedNotePage(), BrainReader, AuthoredDigest, reconcileDigestAuthorship(), unitAuthorship(), annotateAuthoredUnits(), reconcileAuthoredEvidence() (+26 more)

### Community 44 - "source-amendment.ts"
Cohesion: 0.08
Nodes (58): adoptCandidate(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat() (+50 more)

### Community 45 - "reader.ts"
Cohesion: 0.10
Nodes (25): captureAfter(), CaptureMetadata, capturePage(), cursor(), key(), captureIdentityMatches(), BrainCaptureReceipt, hash (+17 more)

### Community 46 - "telemetry.ts"
Cohesion: 0.10
Nodes (25): CodexRollout, CacheWriteDuration, CODEX_ROWS, ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL, Rates (+17 more)

### Community 47 - "workKey"
Cohesion: 0.30
Nodes (9): completedPRReviews(), eligible(), mergedByOwner(), ownerSettles(), retireExternalDeliveries(), settledExternalRepair(), nativeDeliveryReadbackCandidate(), reconcileNativeDelivery() (+1 more)

### Community 48 - "scheduler.ts"
Cohesion: 0.07
Nodes (22): ROLES, DailyCTO, dailyReviewPrompt(), DailyResultSchema, Briefing, saveReviewBriefing(), fifo(), Scheduler (+14 more)

### Community 49 - "delivery-recoveries.ts"
Cohesion: 0.08
Nodes (50): deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, requireDeliveryAuthority(), deliveryIntakeBlocker(), gateRegisteredDelivery(), accounting (+42 more)

### Community 50 - "run-accounting.ts"
Cohesion: 0.10
Nodes (36): ghLogCacheEvidence(), BoundedRead, done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf(), backfillClaudeCost() (+28 more)

### Community 51 - "outbox.ts"
Cohesion: 0.09
Nodes (31): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), projectOutbox(), slackRequestSettled(), deliveryTask(), DeliveryTaskInput (+23 more)

### Community 52 - "intake/admission.ts"
Cohesion: 0.21
Nodes (17): Admission, admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, resumeParked(), compatible(), dependencyCompletionKey() (+9 more)

### Community 53 - "retrospective-subject.ts"
Cohesion: 0.13
Nodes (19): deliveryMetrics(), median(), ARTIFACT_LIMIT, clip(), LEDGER_STEPS, MAINTENANCE_LIMIT, maintenanceFacts(), maintenanceSubject() (+11 more)

### Community 54 - "TicketJob"
Cohesion: 0.07
Nodes (38): installDependencies(), major(), harnessCloseout(), PASSING, verifyMergeActions(), HarnessControl, withHarnessWork(), runHarnessStage() (+30 more)

### Community 55 - "QuestionStepper.tsx"
Cohesion: 0.15
Nodes (20): FeatureHarnessOption, FeatureOption, FeatureQuestion, FeatureQuestionProjection, draftKey(), readDraft(), saveDraft(), QuestionRound() (+12 more)

### Community 56 - "requests.ts"
Cohesion: 0.09
Nodes (55): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+47 more)

### Community 57 - "preferences-store.ts"
Cohesion: 0.19
Nodes (10): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS (+2 more)

### Community 58 - "processGroupAlive"
Cohesion: 0.12
Nodes (27): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_FIX_PROMPT, OfficeFixResult (+19 more)

### Community 59 - "assignment-poll.ts"
Cohesion: 0.14
Nodes (23): ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR, plainSlackText() (+15 more)

### Community 60 - "accepted.ts"
Cohesion: 0.62
Nodes (5): citations(), recordAcceptedKnowledge(), stageName(), knowledgeCitation(), lessonCitation()

### Community 61 - "remove-candidate.ts"
Cohesion: 0.20
Nodes (17): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+9 more)

### Community 62 - ".getEffect"
Cohesion: 0.25
Nodes (8): publishFeature(), GitHubOperations, fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), closeNativeRefresh(), fingerprint(), EffectIntent

### Community 63 - "TelemetryPanel.tsx"
Cohesion: 0.15
Nodes (24): BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens(), usd(), KpiTiles(), command() (+16 more)

### Community 64 - "Coordinator"
Cohesion: 0.09
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 65 - "session-bridge.ts"
Cohesion: 0.08
Nodes (37): claudeSessionContext(), readTranscript, root, claudeSessionScope(), accountCodexProcesses(), codexProcessInventory, DesktopSessions, unaccountedProcesses() (+29 more)

### Community 66 - ".pump"
Cohesion: 0.16
Nodes (4): CommittedBrain, seedOfficeLessons(), Offices, markCaptureStart()

### Community 67 - "engine.ts"
Cohesion: 0.08
Nodes (11): applyIntakeObservation(), checkMail(), drainMail(), requestMail(), ingest(), GitHubMonitor, Result, drainMaintenance() (+3 more)

### Community 68 - ".emit"
Cohesion: 0.11
Nodes (18): reconcileNoticeConfirmations(), PrerequisitesSchema, BrainFollowup, brainCheckpointCompletion(), coverageSchema, followupSchema, verified, reconcileCompletedCheckpoints() (+10 more)

### Community 69 - "jira-time.ts"
Cohesion: 0.21
Nodes (13): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+5 more)

### Community 70 - "service-health.ts"
Cohesion: 0.20
Nodes (9): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, HealthReport (+1 more)

### Community 71 - "delivery-repairs.ts"
Cohesion: 0.15
Nodes (25): correlatedBuild(), parksInJira(), run(), namedRepairIds(), afterDraft(), firstBuildStage(), missingApproachStage(), plannedNext() (+17 more)

### Community 72 - "contract.ts"
Cohesion: 0.22
Nodes (11): At, Errno, GroupInventory, GroupProbe, LifecycleDiagnostic, Phase, Pid, groupInventory() (+3 more)

### Community 73 - "fact-bounds.ts"
Cohesion: 0.22
Nodes (17): leadershipContext(), leadershipEntries(), knowledgeEntries(), collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime() (+9 more)

### Community 74 - "discovery-recovery.ts"
Cohesion: 0.22
Nodes (13): Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership, rawHash() (+5 more)

### Community 75 - "admit-improvement.ts"
Cohesion: 0.27
Nodes (12): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+4 more)

### Community 76 - "coordination.ts"
Cohesion: 0.17
Nodes (19): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation(), maintenanceSuperseded(), REOBSERVED (+11 more)

### Community 77 - "telemetry/report.ts"
Cohesion: 0.17
Nodes (19): proveOutsideAmendmentUnchanged(), requireThat(), rows(), CostEntry, TelemetryReport, TelemetryRow, TelemetrySync, Acc (+11 more)

### Community 78 - "dependency-bots/adopt.ts"
Cohesion: 0.10
Nodes (42): Execute, readBackOrThrow(), adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR (+34 more)

### Community 79 - "App.tsx"
Cohesion: 0.05
Nodes (52): SendMessage, BrainDrawer(), CTOReview(), goalState, DailyCTO(), GoalHistory(), reportDate(), reviewStatus (+44 more)

### Community 80 - "cec/workflow.ts"
Cohesion: 0.26
Nodes (11): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), publicationEvidenceGap(), qaEvidenceGap(), resultGate(), stageResultGap(), unresolvedVerification() (+3 more)

### Community 81 - "weekly-rollup.ts"
Cohesion: 0.20
Nodes (15): knowledgeScopeRevision(), learningMetrics(), lessonsNeedingReview(), RollupResult, harperFolder(), RETROSPECTIVE_TIMEOUT, ROLLUP_HISTORY, rollupDue() (+7 more)

### Community 82 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 83 - "investigations/ledger.ts"
Cohesion: 0.27
Nodes (13): projectSlackDeliveries(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint(), supersedingDelivery(), investigationCandidates(), investigationId() (+5 more)

### Community 84 - "scheduled-retrospectives.ts"
Cohesion: 0.26
Nodes (12): busyMaintenanceIds(), clip(), maintenanceBlockedId(), maintenanceCandidates(), maintenanceCompletedId(), maintenanceKey(), visibleMaintenanceTriggerIds(), triggerJobId() (+4 more)

### Community 85 - "cost-entries.ts"
Cohesion: 0.29
Nodes (10): isModelWork(), isTicketModelWork(), captureCost(), summary(), awaitingEvidence(), CaptureContext, inCostWindow(), TicketCost (+2 more)

### Community 86 - "shared.ts"
Cohesion: 0.06
Nodes (41): assertWorkerLane(), ProjectReadiness, AssignmentResult, CompletionCondition, Continuation, DeliveryAdmission, DependencyObservation, EligibilityState (+33 more)

### Community 87 - "OfficeConfigView.tsx"
Cohesion: 0.48
Nodes (5): loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView(), OfficeConfigSummary

### Community 88 - "extract-worker.mjs"
Cohesion: 0.70
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 89 - "SlackIntakeStatus.tsx"
Cohesion: 0.60
Nodes (4): format, labels, SlackIntakeStatus(), time()

### Community 90 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 93 - ".value"
Cohesion: 0.27
Nodes (6): file, folder, logs, root, xml(), ProjectProgress

### Community 94 - "seeded-office-lessons.ts"
Cohesion: 0.27
Nodes (7): CONSOLIDATED, CONSOLIDATED_AT, seedProjectLessons(), SEEDS, SEEDS, src_shared_knowledgestate, src_shared_lesson

### Community 95 - "codex-rollout.ts"
Cohesion: 0.29
Nodes (9): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO (+1 more)

### Community 96 - "cli.ts"
Cohesion: 0.25
Nodes (6): args, [cmd,...rawArgs], commands, key, projectIndex, PORT

### Community 98 - "liveReach"
Cohesion: 0.60
Nodes (5): GIT_NETWORK, LIVE_PROVIDERS, liveReach(), networkUrl(), remoteUrls()

### Community 99 - "run-evidence.ts"
Cohesion: 0.67
Nodes (3): comparable(), EvidenceOutcome, recordRunEvidence()

## Knowledge Gaps
- **436 isolated node(s):** `SEEDS`, `SEEDS`, `Ownership`, `Retry`, `SourceReservation` (+431 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 536 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `github-delivery.ts`, `accept-stage-result.ts`, `activation-recovery.ts`, `harnessEffect`, `slack-intake/run.ts`, `knowledge.ts`, `features/workflow.ts`, `verifyRepairCandidate`, `knowledge/routes.ts`, `.save`, `digest`, `offices.ts`, `cec/issue-publication.ts`, `agents.ts`, `scheduled-work.ts`, `scheduled-captures.ts`, `.run`, `migrations.ts`, `schedule.ts`, `ticket-evidence.ts`, `it-specialist.ts`, `record-trigger.ts`, `OfficeSnapshot`, `.transaction`, `maintenance/maintenance.ts`, `artifact`, `features/commands.ts`, `conversations/conversations.ts`, `WorkTime`, `features.ts`, `index.ts`, `conversations/slack.ts`, `azure.ts`, `http/commands.ts`, `digest`, `source-amendment.ts`, `workKey`, `scheduler.ts`, `delivery-recoveries.ts`, `run-accounting.ts`, `outbox.ts`, `intake/admission.ts`, `retrospective-subject.ts`, `TicketJob`, `requests.ts`, `processGroupAlive`, `assignment-poll.ts`, `accepted.ts`, `remove-candidate.ts`, `.getEffect`, `session-bridge.ts`, `.pump`, `engine.ts`, `.emit`, `jira-time.ts`, `delivery-repairs.ts`, `discovery-recovery.ts`, `admit-improvement.ts`, `coordination.ts`, `dependency-bots/adopt.ts`, `weekly-rollup.ts`, `investigations/ledger.ts`, `scheduled-retrospectives.ts`, `cost-entries.ts`, `shared.ts`, `QuestionNotifications`, `run-evidence.ts`?**
  _High betweenness centrality (0.137) - this node is a cross-community bridge._
- **Why does `OfficeSnapshot` connect `OfficeSnapshot` to `Inspector.tsx`, `knowledge/routes.ts`, `OfficeScene.tsx`, `index.tsx`, `Store`, `Button`, `agents.ts`, `migrations.ts`, `maintenance/maintenance.ts`, `TeamUpdates.tsx`, `PeoplePanel.tsx`, `azure.ts`, `outbox.ts`, `TelemetryPanel.tsx`, `service-health.ts`, `App.tsx`, `cec/workflow.ts`, `investigations/ledger.ts`, `shared.ts`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `Role` connect `agents.ts` to `github-delivery.ts`, `accept-stage-result.ts`, `Inspector.tsx`, `knowledge.ts`, `OfficeScene.tsx`, `Store`, `.run`, `OfficeSnapshot`, `maintenance/maintenance.ts`, `PeoplePanel.tsx`, `conversations/conversations.ts`, `azure.ts`, `http/commands.ts`, `scheduler.ts`, `run-accounting.ts`, `outbox.ts`, `retrospective-subject.ts`, `TicketJob`, `.emit`, `App.tsx`, `shared.ts`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **What connects `SEEDS`, `SEEDS`, `Ownership` to the rest of the system?**
  _436 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `github-delivery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06150013113034356 - nodes in this community are weakly interconnected._
- **Should `accept-stage-result.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09194053208137715 - nodes in this community are weakly interconnected._
- **Should `activation-recovery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0875 - nodes in this community are weakly interconnected._