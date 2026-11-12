# Graph Report - office-history-retirement-nov12  (2026-11-12)

## Corpus Check
- 741 files · ~305,504 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3699 nodes · 16555 edges · 98 communities (92 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 89 edges (avg confidence: 0.74)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4db12f53`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- source-amendment.ts
- index.tsx
- .getEffect
- dependency-bots/adopt.ts
- artifact
- run-accounting.ts
- features/workflow.ts
- accept-stage-result.ts
- coordination.ts
- shared.ts
- conversations/conversations.ts
- Store
- github-delivery.ts
- MapView.tsx
- daily-cto.ts
- session-bridge.ts
- store.ts
- activation-recovery.ts
- github-context.ts
- OfficeScene.tsx
- worker-runtime.ts
- scheduled-captures.ts
- scheduled-work.ts
- mutedCopy
- knowledge/routes.ts
- PeoplePanel.tsx
- digest
- ticket-evidence.ts
- requests.ts
- run.ts
- record-trigger.ts
- Library.tsx
- agents.ts
- config.ts
- maintenance/maintenance.ts
- process.ts
- metadata-context.ts
- OfficeSnapshot
- TelemetryPanel.tsx
- App.tsx
- hasUncertainEffects
- sanitize
- engine.ts
- run-retrospective.ts
- cec/workflow.ts
- weekly-rollup.ts
- github-readiness.ts
- WorkTime
- .emit
- features.ts
- knowledge.ts
- verifyRepairCandidate
- currentAssignment
- assignment-poll.ts
- closeout.ts
- publish-pr.ts
- goal-reporting.ts
- Coordinator
- Engine
- effects.ts
- MaintenanceRun
- jira-time.ts
- conversations/slack.ts
- FeatureWorkspace.tsx
- remove-candidate.ts
- contract.ts
- admit-improvement.ts
- lesson-selection.ts
- index.ts
- office-lessons.ts
- it-specialist.ts
- assignments.ts
- harnessDelivers
- api-routes.ts
- retrospective-subject.ts
- accepted.ts
- preferences-store.ts
- delivery-task.ts
- local-config.ts
- DailyCTO.tsx
- report.ts
- Offices
- stopped-base-provider.ts
- command-registry.ts
- QuestionDialogHost.tsx
- retire-external-delivery.ts
- retire-history.ts
- cli.ts
- CommittedBrain
- install-service.mjs
- .value
- QuestionNotifications
- extract-worker.mjs
- reconcile-mailbox.ts
- slack-supersession.ts
- helper-evidence.py
- packed-publication-repair.ts

## God Nodes (most connected - your core abstractions)
1. `Store` - 341 edges
2. `TicketJob` - 174 edges
3. `digest()` - 156 edges
4. `GitHubDelivery` - 149 edges
5. `artifact()` - 129 edges
6. `command()` - 109 edges
7. `workKey()` - 99 edges
8. `cx()` - 83 edges
9. `currentAssignment()` - 80 edges
10. `OfficeSnapshot` - 73 edges

## Surprising Connections (you probably didn't know these)
- `readAzurePRs()` --indirect_call--> `row()`  [INFERRED]
  server/cec/observed-prs.ts → src/telemetry/report.ts
- `DeliveryAuthorityInput` --references--> `HarnessRequest`  [EXTRACTED]
  server/delivery/harness/delivery-authority.ts → src/contracts/work.ts
- `rows()` --indirect_call--> `row()`  [INFERRED]
  server/delivery/recovery/source-amendment/source-amendment-held.ts → src/telemetry/report.ts
- `proveOutsideAmendmentUnchanged()` --indirect_call--> `row()`  [INFERRED]
  server/delivery/recovery/source-amendment/source-amendment-held.ts → src/telemetry/report.ts
- `rows()` --indirect_call--> `row()`  [INFERRED]
  server/delivery/recovery/source-amendment/source-amendment-scope.ts → src/telemetry/report.ts

## Import Cycles
- 3-file cycle: `src/knowledge/map/Constellation.tsx -> src/knowledge/map/constellation-runtime.ts -> src/knowledge/map/node-visuals.ts -> src/knowledge/map/Constellation.tsx`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/stage-reconciliation.ts -> server/delivery/recovery/implementation/continuation-review-readback.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/preparation/post-conflict-preparation.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/stopped-base-review.ts -> server/delivery/recovery/stopped-base-checkout.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/parking/resume-provider-review.ts -> server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/parking/resume-provider-review.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/recovery/packed165-draft-link.ts -> server/delivery/pipeline/github-delivery.ts`
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

## Communities (98 total, 6 thin omitted)

### Community 0 - "source-amendment.ts"
Cohesion: 0.05
Nodes (101): closeoutRequestResolved(), adoptCandidate(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related (+93 more)

### Community 1 - "index.tsx"
Cohesion: 0.06
Nodes (79): Conversation(), Outbox(), SendMessage, OutboxMaintenanceStatus(), recommendedReply(), slackMessageStatus(), SlackDeliveryCard(), ServiceHealthPanel() (+71 more)

### Community 2 - ".getEffect"
Cohesion: 0.06
Nodes (47): correlatedBuild(), Assignment, JiraIssuePublisher, keyOf(), Transition, BLOCKED, Execute, findComment() (+39 more)

### Community 3 - "dependency-bots/adopt.ts"
Cohesion: 0.07
Nodes (74): initialManualStart(), Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard (+66 more)

### Community 4 - "artifact"
Cohesion: 0.07
Nodes (74): verifiedCloseoutCleanupRequest(), candidateInput(), children, oldAdoptionBasis(), savedAdmissionUnresolved(), savedCandidateAdmission, assertPostConflictFiles(), assertPostConflictOwnership() (+66 more)

### Community 5 - "run-accounting.ts"
Cohesion: 0.05
Nodes (69): ghLogCacheEvidence(), BoundedRead, done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf(), add() (+61 more)

### Community 6 - "features/workflow.ts"
Cohesion: 0.08
Nodes (53): approveFeature(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), discoveryPrompt(), planPrompt(), artifactPath(), digest() (+45 more)

### Community 7 - "accept-stage-result.ts"
Cohesion: 0.08
Nodes (60): containedFile(), acceptStageResult(), acceptConflictRepair(), PrerequisitesSchema, deliveryNextStage(), pendingPreparationCheck(), mergeAuthorized(), allowed (+52 more)

### Community 8 - "coordination.ts"
Cohesion: 0.06
Nodes (58): reconcileNoticeConfirmations(), Admission, admit(), IntakeContext, compatible(), dependencyCompletionKey(), dependencyEligibility(), DependencyStores (+50 more)

### Community 9 - "shared.ts"
Cohesion: 0.05
Nodes (50): cecChatPrompt(), PICKUP_CHAT, diagnosticContext(), SKILLS, listenerHealth(), providers, ProviderStatusChecks, summary (+42 more)

### Community 10 - "conversations/conversations.ts"
Cohesion: 0.07
Nodes (43): assertConversationReadback(), conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), Conversations, GoalChangeSchema, MessageInput, ReplySchema (+35 more)

### Community 11 - "Store"
Cohesion: 0.08
Nodes (30): featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), wakeFeature(), recoverFeatures(), observeHelperGroups(), stopReview(), maintainLearning() (+22 more)

### Community 12 - "github-delivery.ts"
Cohesion: 0.06
Nodes (33): parksInJira(), BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction(), dependabotReviewGuidance(), discover(), refreshDependencies() (+25 more)

### Community 13 - "MapView.tsx"
Cohesion: 0.07
Nodes (45): KnowledgeActivityPage, KnowledgeEdge, KnowledgeMap, KnowledgeNode, CameraPose, flightPose(), cameraTarget(), focusDistance (+37 more)

### Community 14 - "daily-cto.ts"
Cohesion: 0.07
Nodes (36): expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), DailyCTO, EvidenceRequestConflict (+28 more)

### Community 15 - "session-bridge.ts"
Cohesion: 0.07
Nodes (43): claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexDaemonProcesses(), accountCodexProcesses(), codexProcessInventory, DesktopSessions (+35 more)

### Community 16 - "store.ts"
Cohesion: 0.06
Nodes (38): diagnosticSnapshot(), nativeDeliveryResolved(), seedOfficeLessons(), Clock, EASTERN, easternDayFormatter, easternPartsFormatter, systemClock (+30 more)

### Community 17 - "activation-recovery.ts"
Cohesion: 0.09
Nodes (52): recordJobApproach(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal (+44 more)

### Community 18 - "github-context.ts"
Cohesion: 0.09
Nodes (53): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+45 more)

### Community 19 - "OfficeScene.tsx"
Cohesion: 0.07
Nodes (52): CameraBookmark, restoreBookmark(), Avatar(), AzureWall(), Chair(), Coworker(), CTORoom(), Desk() (+44 more)

### Community 20 - "worker-runtime.ts"
Cohesion: 0.07
Nodes (43): candidateWorkspaceEnvironment(), assignmentSubject(), prepareExposure(), catalogLine(), assertBriefingScope(), LOCAL_BINDINGS, contextPacket(), CODEX_DEFAULT_EFFORT (+35 more)

### Community 21 - "scheduled-captures.ts"
Cohesion: 0.15
Nodes (44): createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest, captureRequests() (+36 more)

### Community 22 - "scheduled-work.ts"
Cohesion: 0.10
Nodes (41): deliverySlot(), metadataRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), requestPriority(), deterministicActions, eligible(), scheduledWork() (+33 more)

### Community 23 - "mutedCopy"
Cohesion: 0.10
Nodes (39): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView() (+31 more)

### Community 24 - "knowledge/routes.ts"
Cohesion: 0.11
Nodes (31): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, GraphNode (+23 more)

### Community 25 - "PeoplePanel.tsx"
Cohesion: 0.09
Nodes (41): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+33 more)

### Community 26 - "digest"
Cohesion: 0.11
Nodes (36): admitGreen156(), GREEN156, green156Admitted(), green156Subject(), retainedGreen156Audit(), assertStoppedBaseAudit(), AuditRow, readStoppedBaseAuditCompletion() (+28 more)

### Community 27 - "ticket-evidence.ts"
Cohesion: 0.11
Nodes (34): jiraRecord(), assetDownloader(), attachmentKind(), evidenceDirectory(), readEvidence(), storeEvidence(), blankEvidence(), CoverageState (+26 more)

### Community 28 - "requests.ts"
Cohesion: 0.12
Nodes (33): accounting, DeliverySubject, nonDelivery, originalReads, HarnessControl, withHarnessWork(), hasSavedPrerequisiteResult(), admitPacked165() (+25 more)

### Community 29 - "run.ts"
Cohesion: 0.11
Nodes (30): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationCandidates(), investigationId(), investigationEvidence(), investigationFollowUps(), INVOCATION_SOURCE_REFS, invocationSource() (+22 more)

### Community 30 - "record-trigger.ts"
Cohesion: 0.10
Nodes (39): BLOCKING, isBlocking(), busyMaintenanceIds(), clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates(), maintenanceCompletedId() (+31 more)

### Community 31 - "Library.tsx"
Cohesion: 0.10
Nodes (28): guidanceExcerpt(), KnowledgeActivity, Activity(), ActivityTimeline(), AssignmentKnowledge(), DocumentMetadata, documentText(), KnowledgeDocumentText (+20 more)

### Community 32 - "agents.ts"
Cohesion: 0.07
Nodes (30): cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), ConversationResultSchema, ctoChatPrompt(), itChatPrompt(), slackSendPrompt() (+22 more)

### Community 33 - "config.ts"
Cohesion: 0.13
Nodes (30): commandFeature(), reviewQuestions(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS, reserveReplacement(), stageBudget(), classifyFeatureFailure() (+22 more)

### Community 34 - "maintenance/maintenance.ts"
Cohesion: 0.09
Nodes (28): maintenancePolicies(), captureMaintenanceStep(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice(), candidateOwner() (+20 more)

### Community 35 - "process.ts"
Cohesion: 0.08
Nodes (24): CommentPage, commentReadback(), Content, jiraText(), JiraOperations, plain(), unpack(), descriptionPreimage() (+16 more)

### Community 36 - "metadata-context.ts"
Cohesion: 0.18
Nodes (32): activeEffectId(), admitPRMetadata(), METADATA_FINDING, assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema, savedMetadataAssessment() (+24 more)

### Community 37 - "OfficeSnapshot"
Cohesion: 0.12
Nodes (33): App(), displayAgentTask(), withoutElapsed(), LiveAgentTask(), Props, RunningTask(), text(), OfficeSnapshot (+25 more)

### Community 38 - "TelemetryPanel.tsx"
Cohesion: 0.11
Nodes (34): TelemetryReport, AzureBuild, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens(), usd() (+26 more)

### Community 39 - "App.tsx"
Cohesion: 0.06
Nodes (36): themeColor, BrainWorkspace, CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants, ElevatorPhase, floorVariants (+28 more)

### Community 40 - "hasUncertainEffects"
Cohesion: 0.13
Nodes (30): hasUncertainEffects(), checksFailed(), checksPassed(), checksPending(), CurrentChecksWait, currentMergeChecks(), pass(), pending() (+22 more)

### Community 41 - "sanitize"
Cohesion: 0.10
Nodes (27): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+19 more)

### Community 42 - "engine.ts"
Cohesion: 0.14
Nodes (32): checkMail(), drainMail(), requestMail(), dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), resume() (+24 more)

### Community 43 - "run-retrospective.ts"
Cohesion: 0.11
Nodes (31): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, blockingTrigger, appendLearningFacts(), freezeLearningPacket(), ARTIFACT_LIMIT (+23 more)

### Community 44 - "cec/workflow.ts"
Cohesion: 0.15
Nodes (32): applyIntakeObservation(), run(), advance(), nextStage(), publicationEvidenceGap(), qaEvidenceGap(), resultGate(), stageResultGap() (+24 more)

### Community 45 - "weekly-rollup.ts"
Cohesion: 0.11
Nodes (30): improvementIntakeGate(), learningDigest(), recordLearningOpportunity(), expireLearningPackets(), LEARNING_BASELINES, packetReferences(), learningMetrics(), publicTopicSafe() (+22 more)

### Community 46 - "github-readiness.ts"
Cohesion: 0.16
Nodes (24): requireDeliveryAuthority(), assertDeliveryMayMutate(), assertMayMutate(), observe(), draftReadHeadMatches(), assertDraftClaimHistory(), linkDraftIssue(), protectedOriginalClaim() (+16 more)

### Community 47 - "WorkTime"
Cohesion: 0.14
Nodes (31): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence(), CaptureContext (+23 more)

### Community 48 - ".emit"
Cohesion: 0.13
Nodes (27): ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), retryRecipientLookup(), enqueueGreen156(), Assessment, bindDiscoveryResume() (+19 more)

### Community 49 - "features.ts"
Cohesion: 0.10
Nodes (29): normalizeRound(), FeatureApproval, FeatureAttempt, FeatureAuthority, FeatureBaseline, FeatureDocument, FeatureHandoff, FeatureHarnessAction (+21 more)

### Community 50 - "knowledge.ts"
Cohesion: 0.09
Nodes (29): curateLesson(), Curation, CurationAction, mergeEvidence(), Kind, RetrospectiveResult, Stage, BlockerFollowup (+21 more)

### Community 51 - "verifyRepairCandidate"
Cohesion: 0.19
Nodes (21): removeAdoptedClone(), stoppedBaseCheckout(), adoptedReviewCandidate(), ciCheckout(), finishCISetup(), verifyCIHooks(), CIFailure, guardCIRepair() (+13 more)

### Community 52 - "currentAssignment"
Cohesion: 0.16
Nodes (24): deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, deliveryIntakeBlocker(), gateRegisteredDelivery(), resolveDeliveryWork(), savedActivationFailure() (+16 more)

### Community 53 - "assignment-poll.ts"
Cohesion: 0.14
Nodes (22): clamp(), LIMITS, MergedPR, plainSlackText(), section(), shippedSummary(), configureNotices(), Identity (+14 more)

### Community 54 - "closeout.ts"
Cohesion: 0.16
Nodes (22): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+14 more)

### Community 55 - "publish-pr.ts"
Cohesion: 0.14
Nodes (20): harnessEffect, retryRead(), park(), commitlintRejection(), developerPRContent(), Execute, officePRContent(), prContent (+12 more)

### Community 56 - "goal-reporting.ts"
Cohesion: 0.16
Nodes (22): leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance() (+14 more)

### Community 57 - "Coordinator"
Cohesion: 0.08
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 58 - "Engine"
Cohesion: 0.09
Nodes (3): channelNoticeAuthorized(), MergeNotifications, Engine

### Community 59 - "effects.ts"
Cohesion: 0.16
Nodes (12): featureById(), mutation(), Link, linkFeature(), reconcilePublication(), uncertainPublications(), reserveIdentity(), FeatureWorkflow (+4 more)

### Community 60 - "MaintenanceRun"
Cohesion: 0.15
Nodes (17): BrainStatusSchema, identity, brainCheckpointCompletion(), coverageSchema, followupSchema, verified, reconcileCompletedCheckpoints(), checkpointHasMaintenanceAlert() (+9 more)

### Community 61 - "jira-time.ts"
Cohesion: 0.15
Nodes (17): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+9 more)

### Community 62 - "conversations/slack.ts"
Cohesion: 0.19
Nodes (11): comparableSlackText(), SlackMessages, SlackRequestSchema, goalNoticeAuthorized(), goalNoticeNeverDispatched(), sendGoalNotice(), maintenanceNoticeAuthorized(), maintenanceNoticeNeverDispatched() (+3 more)

### Community 63 - "FeatureWorkspace.tsx"
Cohesion: 0.15
Nodes (16): LessonDecisionAction, lessonDecisionState(), readLessonDecision(), OutboxLessonDecision(), FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace() (+8 more)

### Community 64 - "remove-candidate.ts"
Cohesion: 0.20
Nodes (16): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+8 more)

### Community 65 - "contract.ts"
Cohesion: 0.16
Nodes (15): Event, one(), prePushRejection(), PushIdentity, settledPushBoundary(), At, Errno, GroupInventory (+7 more)

### Community 66 - "admit-improvement.ts"
Cohesion: 0.21
Nodes (17): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+9 more)

### Community 67 - "lesson-selection.ts"
Cohesion: 0.15
Nodes (19): fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose() (+11 more)

### Community 68 - "index.ts"
Cohesion: 0.14
Nodes (16): close(), config, itSpecialist, loadedRevision, offices, releaseLock, server, serviceHealth (+8 more)

### Community 69 - "office-lessons.ts"
Cohesion: 0.18
Nodes (15): normalizeStatement(), decideOfficeProposal(), mirrorOfficeKnowledge(), now(), OfficeKnowledgeStore, proposeOfficeLessons(), retireOfficeLesson(), Input (+7 more)

### Community 70 - "it-specialist.ts"
Cohesion: 0.22
Nodes (12): ITContext, publishITReport(), delays, recoverAttempt(), ServiceHealthChecks, itFollowUpView(), sessionVisibilityCopy(), date() (+4 more)

### Community 71 - "assignments.ts"
Cohesion: 0.20
Nodes (9): AssignmentLookups, Binding, lookupInstructions(), lookupJournal, KnowledgeAssignment, LearningSubject, LessonExposure, KnowledgeLookupResponse (+1 more)

### Community 72 - "harnessDelivers"
Cohesion: 0.25
Nodes (14): findingsBlock(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery(), teamReviewedHead(), APPROACH_GUARD_REJECTION, failedWorker() (+6 more)

### Community 73 - "api-routes.ts"
Cohesion: 0.25
Nodes (11): featureRoute(), goalHistory(), apiRoute(), RequestContext, fileResponse(), json(), staticRoute(), projectReadiness() (+3 more)

### Community 74 - "retrospective-subject.ts"
Cohesion: 0.21
Nodes (13): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+5 more)

### Community 75 - "accepted.ts"
Cohesion: 0.21
Nodes (11): citations(), recordAcceptedKnowledge(), stageName(), knowledgeCitation(), lessonCitation(), LessonReference, KnowledgeOutcome, KnowledgeReference (+3 more)

### Community 76 - "preferences-store.ts"
Cohesion: 0.21
Nodes (9): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS (+1 more)

### Community 77 - "delivery-task.ts"
Cohesion: 0.23
Nodes (10): cecPrompt(), resolvedDecisionNote(), stageInstructions, reviewInstructions(), deliveryTask(), DeliveryTaskInput, DISCOVERY_GUIDANCE, compactSteps() (+2 more)

### Community 78 - "local-config.ts"
Cohesion: 0.28
Nodes (11): AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), goalEvidencePath(), OfficeConfigInputs, officeConfigRoute(), officeConfigSummary(), CECBinding, localBindings (+3 more)

### Community 79 - "DailyCTO.tsx"
Cohesion: 0.23
Nodes (9): CTOReview(), goalState, DailyCTO(), GoalHistory(), reportDate(), reviewStatus, reviewExcerpt(), ReviewText() (+1 more)

### Community 80 - "report.ts"
Cohesion: 0.29
Nodes (12): Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked(), row() (+4 more)

### Community 82 - "stopped-base-provider.ts"
Cohesion: 0.38
Nodes (8): pinCourier, pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), discussion(), pages(), pullIdentity(), readStoppedBaseProviderContext(), reviewThreads()

### Community 83 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 84 - "QuestionDialogHost.tsx"
Cohesion: 0.44
Nodes (7): FeatureQuestionProjection, nextQuestion(), orderedQuestions(), questionKey(), QuestionDialogHost(), readSuppressed(), Dialog()

### Community 85 - "retire-external-delivery.ts"
Cohesion: 0.44
Nodes (6): completedPRReviews(), eligible(), mergedByOwner(), ownerSettles(), retireExternalDeliveries(), settledExternalRepair()

### Community 86 - "retire-history.ts"
Cohesion: 0.39
Nodes (7): enqueueHistoryRetirement(), historicalRecordDigest(), Intent, records(), retireIncompleteHistory(), HistoryRetirement, HistoryRetirementIntent

### Community 87 - "cli.ts"
Cohesion: 0.25
Nodes (6): args, [cmd,...rawArgs], commands, key, projectIndex, PORT

### Community 89 - "install-service.mjs"
Cohesion: 0.33
Nodes (5): file, folder, logs, root, xml()

### Community 92 - "extract-worker.mjs"
Cohesion: 0.70
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 93 - "reconcile-mailbox.ts"
Cohesion: 0.67
Nodes (3): MISSING_INTAKE, reconcileMailbox(), unusedMailbox()

### Community 94 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

## Knowledge Gaps
- **422 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+417 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `source-amendment.ts`, `.getEffect`, `dependency-bots/adopt.ts`, `artifact`, `run-accounting.ts`, `features/workflow.ts`, `accept-stage-result.ts`, `coordination.ts`, `shared.ts`, `conversations/conversations.ts`, `github-delivery.ts`, `daily-cto.ts`, `session-bridge.ts`, `store.ts`, `activation-recovery.ts`, `github-context.ts`, `worker-runtime.ts`, `scheduled-captures.ts`, `scheduled-work.ts`, `knowledge/routes.ts`, `digest`, `ticket-evidence.ts`, `requests.ts`, `run.ts`, `record-trigger.ts`, `agents.ts`, `config.ts`, `maintenance/maintenance.ts`, `process.ts`, `metadata-context.ts`, `OfficeSnapshot`, `sanitize`, `engine.ts`, `run-retrospective.ts`, `cec/workflow.ts`, `weekly-rollup.ts`, `github-readiness.ts`, `WorkTime`, `.emit`, `verifyRepairCandidate`, `currentAssignment`, `assignment-poll.ts`, `closeout.ts`, `publish-pr.ts`, `goal-reporting.ts`, `Engine`, `effects.ts`, `MaintenanceRun`, `jira-time.ts`, `conversations/slack.ts`, `remove-candidate.ts`, `admit-improvement.ts`, `lesson-selection.ts`, `office-lessons.ts`, `it-specialist.ts`, `assignments.ts`, `harnessDelivers`, `retrospective-subject.ts`, `accepted.ts`, `delivery-task.ts`, `stopped-base-provider.ts`, `retire-external-delivery.ts`, `retire-history.ts`, `.value`, `QuestionNotifications`?**
  _High betweenness centrality (0.132) - this node is a cross-community bridge._
- **Why does `TicketJob` connect `github-delivery.ts` to `source-amendment.ts`, `index.tsx`, `dependency-bots/adopt.ts`, `artifact`, `run-accounting.ts`, `accept-stage-result.ts`, `coordination.ts`, `shared.ts`, `Store`, `activation-recovery.ts`, `github-context.ts`, `worker-runtime.ts`, `digest`, `requests.ts`, `record-trigger.ts`, `metadata-context.ts`, `OfficeSnapshot`, `hasUncertainEffects`, `engine.ts`, `cec/workflow.ts`, `github-readiness.ts`, `.emit`, `verifyRepairCandidate`, `currentAssignment`, `closeout.ts`, `publish-pr.ts`, `goal-reporting.ts`, `MaintenanceRun`, `remove-candidate.ts`, `it-specialist.ts`, `harnessDelivers`, `retrospective-subject.ts`, `delivery-task.ts`, `stopped-base-provider.ts`, `retire-external-delivery.ts`, `.value`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `OfficeSnapshot` connect `OfficeSnapshot` to `index.tsx`, `shared.ts`, `conversations/conversations.ts`, `Store`, `store.ts`, `OfficeScene.tsx`, `mutedCopy`, `PeoplePanel.tsx`, `run.ts`, `record-trigger.ts`, `Library.tsx`, `maintenance/maintenance.ts`, `TelemetryPanel.tsx`, `App.tsx`, `sanitize`, `cec/workflow.ts`, `goal-reporting.ts`, `MaintenanceRun`, `FeatureWorkspace.tsx`, `DailyCTO.tsx`, `reconcile-mailbox.ts`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _422 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `source-amendment.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.04946764946764947 - nodes in this community are weakly interconnected._
- **Should `index.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0597778169634985 - nodes in this community are weakly interconnected._
- **Should `.getEffect` be split into smaller, more focused modules?**
  _Cohesion score 0.055825242718446605 - nodes in this community are weakly interconnected._