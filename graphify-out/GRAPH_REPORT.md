# Graph Report - office-metadata-implementation  (2026-11-10)

## Corpus Check
- 698 files · ~290,469 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3558 nodes · 15902 edges · 107 communities (104 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 96 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6b9fda93`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- dependency-bots/adopt.ts
- scheduler.ts
- Inspector.tsx
- source-amendment.ts
- Store
- workKey
- github-context.ts
- activation-recovery.ts
- OfficeScene.tsx
- worker-runtime.ts
- index.tsx
- shared.ts
- github-delivery.ts
- .getEffect
- digest
- agents.ts
- Library.tsx
- scope-repair-resume.ts
- cx
- cec/workflow.ts
- knowledge/routes.ts
- metadata-context.ts
- lesson-selection.ts
- MapView.tsx
- SourceRegistry
- PeoplePanel.tsx
- OfficeSnapshot
- TimeBook.tsx
- sanitize
- maintenance.ts
- GitHubDelivery
- store.ts
- schedule.ts
- features.ts
- digest
- delivery-repairs.ts
- session-bridge.ts
- cec/issue-publication.ts
- sourceVisible
- slack-intake/report.ts
- run-accounting.ts
- telemetry.ts
- artifact
- StageResult
- accept-stage-result.ts
- .transaction
- cost-ledger.ts
- investigations/run.ts
- run-retrospective.ts
- publish-pr.ts
- accept-retrospective.ts
- knowledge.ts
- slack-intake/config.ts
- .save
- approval.ts
- jira-time.ts
- WorkTime
- Coordinator
- read-links.ts
- assignments.ts
- weekly-rollup.ts
- .emit
- notifications.ts
- dependencies.ts
- remove-candidate.ts
- scheduled-work.ts
- .get
- evidence.ts
- coordination.ts
- FeatureWorkspace.tsx
- offices.ts
- GitHubIssuePublisher
- it-specialist.ts
- goal-reviews.ts
- service-health.ts
- admit-improvement.ts
- ControlStore
- fact-bounds.ts
- contract.ts
- knowledge/learning-events.ts
- daily-cto.ts
- preferences-store.ts
- api-routes.ts
- work.ts
- coordination-tick.ts
- index.ts
- captures.ts
- telemetry/report.ts
- checkpoint-completion.ts
- DailyCTO.tsx
- useOfficePreferences.ts
- .value
- create-candidate.ts
- http/context.ts
- recovery-ledger.ts
- follow-up-alerts.ts
- .pump
- command-registry.ts
- cli.ts
- CommittedBrain
- time-classification.ts
- OfficeConfigView.tsx
- leadership-context.ts
- extract-worker.mjs
- slack-supersession.ts
- helper-evidence.py

## God Nodes (most connected - your core abstractions)
1. `Store` - 318 edges
2. `TicketJob` - 144 edges
3. `GitHubDelivery` - 135 edges
4. `digest()` - 105 edges
5. `command()` - 103 edges
6. `artifact()` - 98 edges
7. `workKey()` - 91 edges
8. `cx()` - 88 edges
9. `currentAssignment()` - 71 edges
10. `OfficeSnapshot` - 70 edges

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
- 3-file cycle: `server/delivery/parking/resume-provider-review.ts -> server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/parking/resume-provider-review.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/recovery/retire-external-delivery.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
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
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/preparation/post-conflict-preparation.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/pipeline/github-delivery.ts`

## Communities (107 total, 3 thin omitted)

### Community 0 - "dependency-bots/adopt.ts"
Cohesion: 0.07
Nodes (70): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard, projectCards() (+62 more)

### Community 1 - "scheduler.ts"
Cohesion: 0.05
Nodes (66): baselineLearning(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences(), maintenanceSubject(), MaintenanceSubjectFacts, busyMaintenanceIds() (+58 more)

### Community 2 - "Inspector.tsx"
Cohesion: 0.04
Nodes (71): DailyCTOSummary, SendMessage, itAgent(), itDiagnostics(), currentServices(), ServiceHealthPanel(), ServiceHealthRow(), blank() (+63 more)

### Community 3 - "source-amendment.ts"
Cohesion: 0.06
Nodes (71): adoptCandidate(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat() (+63 more)

### Community 4 - "Store"
Cohesion: 0.05
Nodes (25): correlatedBuild(), JiraOperations, plain(), GITHUB_ISSUE_SKILL, Result, Assessment, drainMaintenance(), reconcileMaintenance() (+17 more)

### Community 5 - "workKey"
Cohesion: 0.08
Nodes (63): boardPreflightCandidate(), Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership (+55 more)

### Community 6 - "github-context.ts"
Cohesion: 0.07
Nodes (45): assertConversationReadback(), conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput (+37 more)

### Community 7 - "activation-recovery.ts"
Cohesion: 0.08
Nodes (57): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+49 more)

### Community 8 - "OfficeScene.tsx"
Cohesion: 0.06
Nodes (58): displayAgentTask(), githubStageLabels, withoutElapsed(), CameraBookmark, restoreBookmark(), LiveAgentTask(), Props, RunningTask() (+50 more)

### Community 9 - "worker-runtime.ts"
Cohesion: 0.07
Nodes (49): candidateWorkspaceEnvironment(), AUTO_ADOPT_BOTS, assignmentSubject(), dispatchExposure(), prepareExposure(), assertRetainedDispatchScope(), goalEvidencePath(), DELIVERY_CONCURRENCY (+41 more)

### Community 10 - "index.tsx"
Cohesion: 0.07
Nodes (45): Conversation(), Outbox(), recommendedReply(), slackMessageStatus(), SlackDeliveryCard(), labels, BlockerFollowups(), IntakeSummary() (+37 more)

### Community 11 - "shared.ts"
Cohesion: 0.05
Nodes (41): BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction(), dependabotReviewGuidance(), StageContext, deliveryTask(), DeliveryTaskInput (+33 more)

### Community 12 - "github-delivery.ts"
Cohesion: 0.10
Nodes (45): findingsBlock(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery(), discover(), refreshDependencies(), routeExisting() (+37 more)

### Community 13 - ".getEffect"
Cohesion: 0.09
Nodes (27): MergeNotifications, SlackMessages, SlackRequestSchema, GitHubOperations, assertDigestDispatch(), outboundBody(), retainOutboundBody(), digestNoticeNeverDispatched() (+19 more)

### Community 14 - "digest"
Cohesion: 0.10
Nodes (55): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+47 more)

### Community 15 - "agents.ts"
Cohesion: 0.07
Nodes (39): cecPrompt(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), resolvedDecisionNote(), stageInstructions, cecChatPrompt() (+31 more)

### Community 16 - "Library.tsx"
Cohesion: 0.09
Nodes (33): KnowledgeCapturePage, KnowledgeActivity, KnowledgeActivityPage, KnowledgeEdge, Activity(), ActivityStatus(), AssignmentKnowledge(), BrainWorkspace() (+25 more)

### Community 17 - "scope-repair-resume.ts"
Cohesion: 0.11
Nodes (46): candidateInput(), children, oldAdoptionBasis(), savedCandidateAdmission, acceptedNativeGate(), preparationGateEvidence(), within(), Assessment (+38 more)

### Community 18 - "cx"
Cohesion: 0.13
Nodes (35): KnowledgeSourceSummary, empty, AddPublicSource(), AddSourceForm(), SourceConnection, SourceCard(), supported, UploadSource() (+27 more)

### Community 19 - "cec/workflow.ts"
Cohesion: 0.11
Nodes (40): checkMail(), drainMail(), requestMail(), parksInJira(), dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery() (+32 more)

### Community 20 - "knowledge/routes.ts"
Cohesion: 0.10
Nodes (30): intakeActivity(), knowledgeActivity(), knowledgeActivityPage(), committedNotePage(), BrainGraph, BrainNote, BrainReader, GraphNode (+22 more)

### Community 21 - "metadata-context.ts"
Cohesion: 0.14
Nodes (37): admitPRMetadata(), METADATA_FINDING, assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema, savedMetadataAssessment(), validateSaved() (+29 more)

### Community 22 - "lesson-selection.ts"
Cohesion: 0.09
Nodes (38): guidanceExcerpt(), knowledgeContext(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), LessonSelection (+30 more)

### Community 23 - "MapView.tsx"
Cohesion: 0.09
Nodes (33): KnowledgeMap, KnowledgeNode, CameraPose, flightPose(), cameraTarget(), Point, Constellation(), ConstellationView (+25 more)

### Community 24 - "SourceRegistry"
Cohesion: 0.11
Nodes (27): Config, configDigest(), IntakeConfig, readConfig(), SlackReadAuthority, collectionPolicy, readAuthority(), Command (+19 more)

### Community 25 - "PeoplePanel.tsx"
Cohesion: 0.11
Nodes (37): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+29 more)

### Community 26 - "OfficeSnapshot"
Cohesion: 0.11
Nodes (34): themeColor, App(), SnapshotAcceptance, demoSnapshot(), tourStages, useOffice(), OfficeSnapshot, STAGE_ROLE (+26 more)

### Community 27 - "TimeBook.tsx"
Cohesion: 0.10
Nodes (35): TelemetryReport, AzureBuild, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens(), usd() (+27 more)

### Community 28 - "sanitize"
Cohesion: 0.10
Nodes (30): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+22 more)

### Community 29 - "maintenance.ts"
Cohesion: 0.10
Nodes (27): ApproachSchema, maintenancePolicies(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice(), candidateOwner() (+19 more)

### Community 30 - "GitHubDelivery"
Cohesion: 0.13
Nodes (19): removeAdoptedClone(), GitHubDelivery, adoptedReviewCandidate(), ciCheckout(), finishCISetup(), verifyCIHooks(), CIFailure, guardCIRepair() (+11 more)

### Community 31 - "store.ts"
Cohesion: 0.10
Nodes (23): eventSourceBindings(), Clock, DATA, sanitizeObject(), applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration (+15 more)

### Community 32 - "schedule.ts"
Cohesion: 0.14
Nodes (24): newTask(), ChannelProgress, reconcileIntakeStatus(), queueReconsideration(), scheduledSlackIntake(), sourceWork(), micros(), nowTs() (+16 more)

### Community 33 - "features.ts"
Cohesion: 0.11
Nodes (29): jiraText(), discoveryPrompt(), planPrompt(), DiscoverySchema, identity, manifestFromPlan(), ManifestSchema, PlanSchema (+21 more)

### Community 34 - "digest"
Cohesion: 0.18
Nodes (22): comparableSlackText(), AuthoredDigest, reconcileDigestAuthorship(), unitAuthorship(), annotateAuthoredUnits(), independentIntakeResult(), reconcileAuthoredEvidence(), publicationConnections() (+14 more)

### Community 35 - "delivery-repairs.ts"
Cohesion: 0.13
Nodes (31): namedRepairIds(), checksFailed(), checksPassed(), checksPending(), CurrentChecksWait, currentMergeChecks(), pass(), pending() (+23 more)

### Community 36 - "session-bridge.ts"
Cohesion: 0.11
Nodes (27): claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexSessionContext(), readRollout, claudeSessions(), codexSessions() (+19 more)

### Community 37 - "cec/issue-publication.ts"
Cohesion: 0.15
Nodes (13): Assignment, Content, JiraIssuePublisher, keyOf(), plainDescription(), Transition, unpack(), FeaturePublisher (+5 more)

### Community 38 - "sourceVisible"
Cohesion: 0.19
Nodes (25): eventVisible(), knowledgeSnapshot(), officeKnowledgeSnapshot(), publicReference(), lookupSummaryVisible(), publicLookupSummary(), evidenceTitle(), knowledgeMap() (+17 more)

### Community 39 - "slack-intake/report.ts"
Cohesion: 0.15
Nodes (28): key(), Proposal, ReadTask, isStoppingFor(), intakeProgress(), terminalDeferred(), unitKey(), verifiedCapture() (+20 more)

### Community 40 - "run-accounting.ts"
Cohesion: 0.10
Nodes (33): BoundedRead, add(), CodexRequest, CodexTokens, FIELDS, codexHome(), createdAt(), dayDirs() (+25 more)

### Community 41 - "telemetry.ts"
Cohesion: 0.09
Nodes (30): CodexRollout, CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL (+22 more)

### Community 42 - "artifact"
Cohesion: 0.14
Nodes (28): containedFile(), closeoutRequestResolved(), guard(), initialDraftConflictAnchor(), mergeInitialSourceLock(), originalPublication(), Ownership, providerFacts() (+20 more)

### Community 43 - "StageResult"
Cohesion: 0.16
Nodes (22): harnessCloseout(), PASSING, verifyMergeActions(), assertMayMutate(), HarnessControl, withHarnessWork(), runHarnessStage(), harnessStageResult() (+14 more)

### Community 44 - "accept-stage-result.ts"
Cohesion: 0.15
Nodes (30): acceptStageResult(), recordJobApproach(), PrerequisitesSchema, mergeAuthorized(), continuationNativeReview(), continuationReviewArtifacts(), reconcileContinuationReview(), savedNegativeContinuationReview() (+22 more)

### Community 45 - ".transaction"
Cohesion: 0.14
Nodes (20): featureItemComplete(), reconcileFeatureCompletion(), document(), featureRoot(), bindFeature(), currentApproval(), enrolled(), featureGate() (+12 more)

### Community 46 - "cost-ledger.ts"
Cohesion: 0.16
Nodes (25): EffectUncertainError, captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId() (+17 more)

### Community 47 - "investigations/run.ts"
Cohesion: 0.15
Nodes (23): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationCandidates(), investigationId(), investigationFollowUps(), INVOCATION_SOURCE_REFS, investigationResolution(), syncInvestigations() (+15 more)

### Community 48 - "run-retrospective.ts"
Cohesion: 0.12
Nodes (25): acceptRetrospective(), improvementIntakeGate(), learningDigest(), appendLearningFacts(), freezeLearningPacket(), ARTIFACT_LIMIT, clip(), LEDGER_STEPS (+17 more)

### Community 49 - "publish-pr.ts"
Cohesion: 0.15
Nodes (24): activeEffectId(), harnessEffect, retryRead(), linkDraftIssue(), protectedOriginalClaim(), assertCandidate(), Candidate, Execute (+16 more)

### Community 50 - "accept-retrospective.ts"
Cohesion: 0.12
Nodes (22): Accepted, normalizeStatement(), RETROSPECTIVE_HISTORY, decideOfficeProposal(), now(), OfficeKnowledgeStore, proposeOfficeLessons(), retireOfficeLesson() (+14 more)

### Community 51 - "knowledge.ts"
Cohesion: 0.10
Nodes (27): publicTopicSafe(), researchTopics(), TEMPLATES, BlockerFollowup, ImprovementGrant, KnowledgeRetry, KnowledgeState, LearningMetrics (+19 more)

### Community 52 - "slack-intake/config.ts"
Cohesion: 0.12
Nodes (22): exactly(), Message, nativeReadPayload(), pagination(), nativeFile(), Message, observeRead(), Page (+14 more)

### Community 53 - ".save"
Cohesion: 0.21
Nodes (24): BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue(), readIssues(), commentDecision() (+16 more)

### Community 54 - "approval.ts"
Cohesion: 0.20
Nodes (19): approveFeature(), assertRetainedItems(), commandFeature(), createFeature(), featureById(), mutation(), reviewQuestions(), assertFeatureDependencyOrder() (+11 more)

### Community 55 - "jira-time.ts"
Cohesion: 0.14
Nodes (21): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+13 more)

### Community 56 - "WorkTime"
Cohesion: 0.17
Nodes (22): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence(), boardUsd() (+14 more)

### Community 57 - "Coordinator"
Cohesion: 0.08
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 58 - "read-links.ts"
Cohesion: 0.15
Nodes (18): createExtractor(), extractDocument, Extraction, Extractor, uploadArtifact(), KnowledgeRunner, privateFile(), LinkResult (+10 more)

### Community 59 - "assignments.ts"
Cohesion: 0.17
Nodes (13): assignmentKnowledge(), AssignmentLookups, Binding, lookupInstructions(), decodeLookupJournal(), lookupJournal, readLookupJournal(), referenceVisible() (+5 more)

### Community 60 - "weekly-rollup.ts"
Cohesion: 0.14
Nodes (20): deliveryMetrics(), median(), knowledgeScopeRevision(), learningMetrics(), lessonsNeedingReview(), RollupResult, RollupResultSchema, findSubject() (+12 more)

### Community 61 - ".emit"
Cohesion: 0.20
Nodes (18): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), retryRecipientLookup(), configureDigestDelivery(), DigestSettings (+10 more)

### Community 62 - "notifications.ts"
Cohesion: 0.17
Nodes (17): clamp(), LIMITS, MergedPR, plainSlackText(), section(), shippedSummary(), configureNotices(), Identity (+9 more)

### Community 63 - "dependencies.ts"
Cohesion: 0.21
Nodes (19): Admission, admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, resumeParked(), compatible(), dependencyCompletionKey() (+11 more)

### Community 64 - "remove-candidate.ts"
Cohesion: 0.20
Nodes (16): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+8 more)

### Community 65 - "scheduled-work.ts"
Cohesion: 0.17
Nodes (18): deliverySlot(), metadataRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), deterministicActions, eligible(), requestResolved() (+10 more)

### Community 66 - ".get"
Cohesion: 0.21
Nodes (16): retryDelay(), captureProposal(), effectId(), recordObservation(), settlePage(), DERIVED, acceptProposals(), linkKey() (+8 more)

### Community 67 - "evidence.ts"
Cohesion: 0.19
Nodes (15): ghLogCacheEvidence(), investigationEvidence(), invocationSource(), sections, officeSource(), done(), readBoundedNoFollow(), readBoundedNoFollowSync() (+7 more)

### Community 68 - "coordination.ts"
Cohesion: 0.17
Nodes (19): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation(), checkpointWindow(), dueAt() (+11 more)

### Community 69 - "FeatureWorkspace.tsx"
Cohesion: 0.18
Nodes (15): FeatureRound, FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures(), draftKey() (+7 more)

### Community 70 - "offices.ts"
Cohesion: 0.16
Nodes (12): queueImprovements(), readLocalIntakeReport(), file, project, root, DeliverySlot, projectById(), projectData() (+4 more)

### Community 71 - "GitHubIssuePublisher"
Cohesion: 0.27
Nodes (7): PublicationReceipt, Assign, Board, GitHubIssuePublisher, number(), same(), label()

### Community 72 - "it-specialist.ts"
Cohesion: 0.23
Nodes (12): ITContext, readBackConversations(), publishITReport(), delays, recoverAttempt(), itFollowUpView(), sessionVisibilityCopy(), date() (+4 more)

### Community 73 - "goal-reviews.ts"
Cohesion: 0.15
Nodes (15): applyGoalReview(), EvidenceRefSchema, statusAllowed(), workEvidence(), GoalInput, saveGoal(), queueGoalNotice(), DailyCTOBriefing (+7 more)

### Community 74 - "service-health.ts"
Cohesion: 0.18
Nodes (9): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, slackHealth() (+1 more)

### Community 75 - "admit-improvement.ts"
Cohesion: 0.26
Nodes (14): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+6 more)

### Community 76 - "ControlStore"
Cohesion: 0.23
Nodes (4): Briefing, saveReviewBriefing(), ControlStore, DailyCTOReport

### Community 77 - "fact-bounds.ts"
Cohesion: 0.26
Nodes (15): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+7 more)

### Community 78 - "contract.ts"
Cohesion: 0.22
Nodes (11): At, Errno, GroupInventory, GroupProbe, LifecycleDiagnostic, Phase, Pid, groupInventory() (+3 more)

### Community 79 - "knowledge/learning-events.ts"
Cohesion: 0.26
Nodes (10): retainedArtifactScope(), captureLearning(), recordLearningOpportunity(), exposureBindings(), requestSourceBindings(), captureMaintenanceStep(), acceptedSourceBindings(), retainAcceptedResult() (+2 more)

### Community 80 - "daily-cto.ts"
Cohesion: 0.21
Nodes (9): DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), reviewWeekday(), queueGoalEvidenceRequest(), DailyResultSchema, FreshDailyResultSchema (+1 more)

### Community 81 - "preferences-store.ts"
Cohesion: 0.19
Nodes (10): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS (+2 more)

### Community 82 - "api-routes.ts"
Cohesion: 0.30
Nodes (9): knowledgeSessionVisibility(), goalHistory(), apiRoute(), fileResponse(), json(), staticRoute(), validTicket(), projectReadiness() (+1 more)

### Community 83 - "work.ts"
Cohesion: 0.15
Nodes (13): ProjectReadiness, AssignmentResult, CompletionCondition, Continuation, DependencyObservation, EligibilityState, FailureCategory, ReconciliationAction (+5 more)

### Community 84 - "coordination-tick.ts"
Cohesion: 0.21
Nodes (8): reconcileNoticeConfirmations(), BrainFollowup, legacy, reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION, tick()

### Community 85 - "index.ts"
Cohesion: 0.18
Nodes (12): close(), config, itSpecialist, loadedRevision, offices, releaseLock, server, serviceHealth (+4 more)

### Community 86 - "captures.ts"
Cohesion: 0.27
Nodes (10): captureAfter(), CaptureMetadata, capturePage(), cursor(), captureIdentityMatches(), BrainCaptureReceipt, hash, PublishedCaptureNote (+2 more)

### Community 87 - "telemetry/report.ts"
Cohesion: 0.29
Nodes (12): Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked(), row() (+4 more)

### Community 88 - "checkpoint-completion.ts"
Cohesion: 0.24
Nodes (7): BrainStatusSchema, identity, brainCheckpointCompletion(), coverageSchema, followupSchema, verified, reconcileCompletedCheckpoints()

### Community 89 - "DailyCTO.tsx"
Cohesion: 0.26
Nodes (8): CTOReview(), goalState, DailyCTO(), GoalHistory(), reportDate(), reviewStatus, reviewExcerpt(), ReviewText()

### Community 90 - "useOfficePreferences.ts"
Cohesion: 0.26
Nodes (10): acceptPreferences(), PreferenceCandidate, strip(), UNKNOWN_PREFERENCES, OfficePreferencesController, PreferenceFeedback, PreferenceField, requestPreferences() (+2 more)

### Community 91 - ".value"
Cohesion: 0.27
Nodes (6): file, folder, logs, root, xml(), ProjectProgress

### Community 92 - "create-candidate.ts"
Cohesion: 0.31
Nodes (9): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+1 more)

### Community 93 - "http/context.ts"
Cohesion: 0.31
Nodes (8): ITSpecialist, RequestContext, ServiceContext, OfficeConfigInputs, officeConfigRoute(), officeConfigSummary(), CECBinding, runtimeRevision()

### Community 94 - "recovery-ledger.ts"
Cohesion: 0.38
Nodes (7): savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), diagnosticSnapshot(), nativeDeliveryResolved(), reconcileRecoveryLedger()

### Community 95 - "follow-up-alerts.ts"
Cohesion: 0.38
Nodes (7): checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), repeatedVendorReviewBlock(), stoppedInVendorReview(), maintenanceSuperseded(), REOBSERVED

### Community 97 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 98 - "cli.ts"
Cohesion: 0.25
Nodes (6): args, [cmd,...rawArgs], commands, key, projectIndex, PORT

### Community 100 - "time-classification.ts"
Cohesion: 0.62
Nodes (6): captureTime(), artifact(), correctRecoveryClassification(), digest(), timeClassificationDigest(), TimeClassificationInput

### Community 101 - "OfficeConfigView.tsx"
Cohesion: 0.48
Nodes (5): loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView(), OfficeConfigSummary

### Community 102 - "leadership-context.ts"
Cohesion: 0.47
Nodes (4): leadershipContext(), leadershipEntries(), knowledgeEntries(), OfficeEntry

### Community 103 - "extract-worker.mjs"
Cohesion: 0.70
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 104 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

## Knowledge Gaps
- **389 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+384 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `dependency-bots/adopt.ts`, `scheduler.ts`, `source-amendment.ts`, `workKey`, `github-context.ts`, `activation-recovery.ts`, `worker-runtime.ts`, `shared.ts`, `github-delivery.ts`, `.getEffect`, `digest`, `agents.ts`, `scope-repair-resume.ts`, `cec/workflow.ts`, `knowledge/routes.ts`, `metadata-context.ts`, `lesson-selection.ts`, `SourceRegistry`, `OfficeSnapshot`, `sanitize`, `maintenance.ts`, `GitHubDelivery`, `store.ts`, `schedule.ts`, `features.ts`, `digest`, `delivery-repairs.ts`, `session-bridge.ts`, `cec/issue-publication.ts`, `sourceVisible`, `slack-intake/report.ts`, `run-accounting.ts`, `artifact`, `StageResult`, `accept-stage-result.ts`, `.transaction`, `cost-ledger.ts`, `investigations/run.ts`, `run-retrospective.ts`, `publish-pr.ts`, `accept-retrospective.ts`, `knowledge.ts`, `slack-intake/config.ts`, `.save`, `approval.ts`, `jira-time.ts`, `WorkTime`, `read-links.ts`, `assignments.ts`, `weekly-rollup.ts`, `.emit`, `notifications.ts`, `dependencies.ts`, `remove-candidate.ts`, `scheduled-work.ts`, `evidence.ts`, `coordination.ts`, `offices.ts`, `it-specialist.ts`, `goal-reviews.ts`, `admit-improvement.ts`, `knowledge/learning-events.ts`, `api-routes.ts`, `coordination-tick.ts`, `checkpoint-completion.ts`, `create-candidate.ts`, `recovery-ledger.ts`, `time-classification.ts`, `leadership-context.ts`?**
  _High betweenness centrality (0.116) - this node is a cross-community bridge._
- **Why does `Engine` connect `Store` to `scheduled-work.ts`, `coordination.ts`, `workKey`, `github-context.ts`, `offices.ts`, `leadership-context.ts`, `github-delivery.ts`, `.getEffect`, `agents.ts`, `cec/workflow.ts`, `approval.ts`, `sanitize`, `maintenance.ts`, `notifications.ts`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `Role` connect `worker-runtime.ts` to `scheduler.ts`, `Inspector.tsx`, `Store`, `github-context.ts`, `OfficeScene.tsx`, `index.tsx`, `shared.ts`, `github-delivery.ts`, `agents.ts`, `cec/workflow.ts`, `PeoplePanel.tsx`, `OfficeSnapshot`, `maintenance.ts`, `store.ts`, `run-accounting.ts`, `StageResult`, `accept-stage-result.ts`, `.emit`, `offices.ts`, `work.ts`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `command()` (e.g. with `.constructor()` and `executeRequest()`) actually correct?**
  _`command()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _389 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dependency-bots/adopt.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07066167290886392 - nodes in this community are weakly interconnected._
- **Should `scheduler.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05303030303030303 - nodes in this community are weakly interconnected._