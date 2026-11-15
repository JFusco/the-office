# Graph Report - office-simple-qa-handoff-nov15  (2026-11-15)

## Corpus Check
- 817 files · ~332,495 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4068 nodes · 19021 edges · 121 communities (116 shown, 5 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 671 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `047df9fd`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- source-amendment.ts
- TicketJob
- Inspector.tsx
- agents.ts
- outbox.ts
- post-conflict-preparation.ts
- session-scope.ts
- constellation-runtime.ts
- App.tsx
- engine.ts
- assignments.ts
- features/workflow.ts
- github/issue-publication.ts
- OfficeScene.tsx
- authorize.ts
- config.ts
- Role
- agents.ts
- worker-runtime.ts
- record-trigger.ts
- artifact
- github-delivery.ts
- digest
- shared.ts
- pilot-delivery.ts
- TimeBook.tsx
- owned-artifact.ts
- DailyCTO.tsx
- run-retrospective.ts
- dependencies.ts
- .emit
- knowledge.ts
- sanitize
- cec/issue-publication.ts
- features.ts
- reader.ts
- shared.ts
- run-accounting.ts
- ref_node_path
- index.tsx
- Conversation.tsx
- .save
- TicketJob
- maintenance/maintenance.ts
- time-scope.ts
- telemetry.ts
- projects.ts
- remove-candidate.ts
- OfficeScene.tsx
- index.ts
- Store
- resume-provider-review.ts
- coordination.ts
- ticket-evidence.ts
- weekly-rollup.ts
- task-briefing.ts
- work.ts
- scheduled-work.ts
- admit-improvement.ts
- service-health.ts
- Effects
- evidence-artifacts.ts
- App.tsx
- harnessEffect
- it-specialist.ts
- useOfficePreferences.ts
- offices.ts
- record-push.ts
- JiraIssuePublisher
- daily-cto.ts
- QuestionStepper.tsx
- Offices
- constellation-runtime.ts
- stopped-base-validation.ts
- tracking-issue.ts
- worker-runtime.ts
- lesson-selection.ts
- blocker-followups.ts
- Store
- features/workflow.ts
- highestStableAtLeast
- coordination.ts
- CommittedBrain
- run-evidence.ts
- ProjectProgress
- process.ts
- node-visuals.ts
- session-context-file.ts
- conversations/conversations.ts
- local-config.ts
- session-bridge.ts
- checkpoint-retry.ts
- report.ts
- capture-session-clone.py
- node-visuals.ts
- RoomCamera.tsx
- continue-access-only-plan.ts
- createConstellation
- report-evidence.ts
- CommittedBrain
- provider-observation.ts
- ProjectProgress
- qualify.ts
- scene-motion.ts
- run-accounting.ts
- RoomCamera.tsx
- admission.ts
- createConstellation
- evidence-artifacts.ts
- price-table.ts
- codex-rollout.ts
- recover-saved-plan.ts
- retire-history.ts
- session-coverage.ts
- merge-summary.ts
- codex-rollout-file.ts
- install-service.mjs
- harnessEffect
- diagnostic-context.ts
- run-evidence.ts
- highestStableAtLeast

## God Nodes (most connected - your core abstractions)
1. `Store` - 361 edges
2. `TicketJob` - 176 edges
3. `digest()` - 165 edges
4. `artifact()` - 129 edges
5. `GitHubDelivery` - 122 edges
6. `command()` - 113 edges
7. `workKey()` - 101 edges
8. `currentAssignment()` - 88 edges
9. `cx()` - 88 edges
10. `Button` - 84 edges

## Surprising Connections (you probably didn't know these)
- `DeliverySlot` --references--> `Role`  [EXTRACTED]
  server/office/projects.ts → src/shared.ts
- `LessonBrainOverlap` --references--> `Lesson`  [EXTRACTED]
  server/knowledge/lesson-brain-audit.ts → src/contracts/knowledge.ts
- `apply()` --indirect_call--> `note()`  [INFERRED]
  src/conversations/OutboxSavedImplementation.tsx → server/cec/parking/resume-parked.ts
- `StageContext` --references--> `Role`  [EXTRACTED]
  server/delivery/pipeline/accept-stage-result.ts → src/shared.ts
- `MaintenanceSubjectFacts` --references--> `Role`  [EXTRACTED]
  server/knowledge/maintenance-subject.ts → src/shared.ts

## Import Cycles
- 2-file cycle: `server/scheduling/coordination-tick.ts -> server/scheduling/coordination.ts -> server/scheduling/coordination-tick.ts`
- 2-file cycle: `server/scheduling/coordination-pump.ts -> server/scheduling/coordination.ts -> server/scheduling/coordination-pump.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/track-adopted-review.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/stage-reconciliation.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/accept-stage-result.ts -> server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/accept-stage-result.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/implementation/saved-prerequisite-handoff.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/source-amendment/source-amendment.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/publication/metadata-context.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/refresh-merge-review.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/closeout/github-closeout.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/queue-repairs.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/knowledge/lesson-exits.ts -> server/scheduling/requests.ts -> server/knowledge/lesson-exits.ts`
- 2-file cycle: `server/delivery/recovery/implementation/candidate-adoption.ts -> server/delivery/recovery/source-amendment/source-amendment.ts -> server/delivery/recovery/implementation/candidate-adoption.ts`
- 2-file cycle: `server/delivery/recovery/source-amendment/source-amendment-held.ts -> server/delivery/recovery/source-amendment/source-amendment.ts -> server/delivery/recovery/source-amendment/source-amendment-held.ts`
- 2-file cycle: `server/conversations/conversations.ts -> server/conversations/cto-conversations.ts -> server/conversations/conversations.ts`
- 2-file cycle: `server/conversations/notifications.ts -> server/conversations/slack.ts -> server/conversations/notifications.ts`
- 2-file cycle: `src/contracts/people.ts -> src/shared.ts -> src/contracts/people.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-guard.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`

## Communities (121 total, 5 thin omitted)

### Community 0 - "source-amendment.ts"
Cohesion: 0.05
Nodes (84): completedPRReviews(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal (+76 more)

### Community 1 - "TicketJob"
Cohesion: 0.06
Nodes (47): harnessCloseout(), PASSING, verifyMergeActions(), runHarnessStage(), harnessStageResult(), receipt(), dependabotReviewGuidance(), pinCourierIdentityRefusal() (+39 more)

### Community 2 - "Inspector.tsx"
Cohesion: 0.07
Nodes (84): containedFile(), findingsBlock(), namedRepairIds(), assertDeliveryMayMutate(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery() (+76 more)

### Community 3 - "agents.ts"
Cohesion: 0.07
Nodes (58): guidanceExcerpt(), KnowledgeActivity, KnowledgeActivityPage, KnowledgeEdge, KnowledgeMap, KnowledgeNode, Activity(), ActivityTimeline() (+50 more)

### Community 4 - "outbox.ts"
Cohesion: 0.09
Nodes (48): accounting, DeliverySubject, nonDelivery, originalReads, HarnessControl, draftReadHeadMatches(), assertDraftClaimHistory(), linkDraftIssue() (+40 more)

### Community 5 - "post-conflict-preparation.ts"
Cohesion: 0.09
Nodes (66): TicketPlanningAction(), blockedSummary(), ServiceHealthPanel(), followUp(), labels, ServiceHealthRow(), BlockerFollowups(), LearningCoverage() (+58 more)

### Community 6 - "session-scope.ts"
Cohesion: 0.14
Nodes (20): claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexSessionContext(), readRollout, LiveSession, ContextProject (+12 more)

### Community 7 - "constellation-runtime.ts"
Cohesion: 0.15
Nodes (16): CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point, focusOverlayMotion(), FocusOverlayLayout (+8 more)

### Community 8 - "App.tsx"
Cohesion: 0.05
Nodes (102): boardPreflightCandidate(), savedActivationFailure(), continuationWorkerProof(), candidateInput(), children, oldAdoptionBasis(), SavedCandidateAdmission, savedCandidateAdmission() (+94 more)

### Community 9 - "engine.ts"
Cohesion: 0.11
Nodes (37): continueImplementation(), checkMail(), drainMail(), requestMail(), dispatchNightly(), drainDelivery(), enableNightly(), resume() (+29 more)

### Community 10 - "assignments.ts"
Cohesion: 0.11
Nodes (39): label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+31 more)

### Community 11 - "features/workflow.ts"
Cohesion: 0.06
Nodes (66): adoptCandidate(), reported, Scope, approvedText(), assert(), amendmentInstruction(), amendmentIssueSha256(), authorizeSourceAmendment() (+58 more)

### Community 12 - "github/issue-publication.ts"
Cohesion: 0.12
Nodes (31): featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS, requestReplan(), reserveReplacement() (+23 more)

### Community 13 - "OfficeScene.tsx"
Cohesion: 0.16
Nodes (34): withoutElapsed(), Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk() (+26 more)

### Community 14 - "authorize.ts"
Cohesion: 0.08
Nodes (47): mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), artifactPath(), digest(), document(), featureRoot() (+39 more)

### Community 15 - "config.ts"
Cohesion: 0.07
Nodes (68): deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, requireDeliveryAuthority(), deliveryIntakeBlocker(), gateRegisteredDelivery(), resolveDeliveryWork() (+60 more)

### Community 16 - "Role"
Cohesion: 0.15
Nodes (16): ROLES, OfficeCapacity, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch() (+8 more)

### Community 17 - "agents.ts"
Cohesion: 0.06
Nodes (43): cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), stageInstructions, readbackDispatchGuidance(), CECReadbackSchema, READBACK_OWNER_SCOPE (+35 more)

### Community 18 - "worker-runtime.ts"
Cohesion: 0.08
Nodes (37): implementationPreview(), implementationContinuationRoute(), qaPlanRetryRoute(), close(), config, itSpecialist, loadedRevision, offices (+29 more)

### Community 19 - "record-trigger.ts"
Cohesion: 0.14
Nodes (49): requestDelivery(), createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), CaptureRequest (+41 more)

### Community 20 - "artifact"
Cohesion: 0.06
Nodes (38): curateLesson(), Curation, CurationAction, mergeEvidence(), BRAIN_SCOPE, SUBJECT, Kind, RetrospectiveResult (+30 more)

### Community 21 - "github-delivery.ts"
Cohesion: 0.09
Nodes (35): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, GraphNode (+27 more)

### Community 22 - "digest"
Cohesion: 0.08
Nodes (23): DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), queueGoalEvidenceRequest(), applyGoalReview(), DailyResultSchema, EvidenceRefSchema (+15 more)

### Community 23 - "shared.ts"
Cohesion: 0.06
Nodes (31): GitHubMonitor, fields, PreferencesPatch, StoredBody, OfficeQAHandoff, OfficeQAHandoffInput, OfficeQAHandoffRequest, PackedPublicationRepair (+23 more)

### Community 24 - "pilot-delivery.ts"
Cohesion: 0.13
Nodes (38): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView() (+30 more)

### Community 25 - "TimeBook.tsx"
Cohesion: 0.11
Nodes (49): activeEffectId(), retryRead(), admitPRMetadata(), METADATA_FINDING, assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema (+41 more)

### Community 26 - "owned-artifact.ts"
Cohesion: 0.24
Nodes (13): BoundedRead, done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf(), backfillClaudeCost(), CompletionReader (+5 more)

### Community 27 - "DailyCTO.tsx"
Cohesion: 0.28
Nodes (9): CTOReview(), goalState, DailyCTO(), reportDate(), reviewStatus, InlineText(), ReviewText(), ProjectGoal (+1 more)

### Community 28 - "run-retrospective.ts"
Cohesion: 0.12
Nodes (24): assertConversationReadback(), Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff(), saveGoals() (+16 more)

### Community 29 - "dependencies.ts"
Cohesion: 0.09
Nodes (42): displayAgentTask(), LiveAgentTask(), Props, RunningTask(), text(), AzureBuild, BreakdownTable(), CostBar() (+34 more)

### Community 30 - ".emit"
Cohesion: 0.16
Nodes (28): parksInJira(), run(), verifiedTransition(), publicationEvidenceGap(), qaEvidenceGap(), resultGate(), stageResultGap(), DECISION_KINDS (+20 more)

### Community 31 - "knowledge.ts"
Cohesion: 0.10
Nodes (40): commandFeature(), reviewQuestions(), assertQuestionVisibility(), applyHarnessAction(), HarnessActionInput, recoveryPreconditions(), recoveryTarget(), normalizeRound() (+32 more)

### Community 32 - "sanitize"
Cohesion: 0.10
Nodes (29): maintenancePolicies(), captureMaintenanceStep(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice(), candidateOwner() (+21 more)

### Community 33 - "cec/issue-publication.ts"
Cohesion: 0.11
Nodes (32): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationCandidates(), investigationId(), investigationEvidence(), investigationFollowUps(), INVOCATION_SOURCE_REFS, invocationSource() (+24 more)

### Community 34 - "features.ts"
Cohesion: 0.10
Nodes (40): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, BlockingTrigger, blockingTrigger(), isBlocking() (+32 more)

### Community 35 - "reader.ts"
Cohesion: 0.12
Nodes (20): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), Identity, MergeNotifications, NoticeSettings (+12 more)

### Community 36 - "shared.ts"
Cohesion: 0.13
Nodes (29): decideImplementation(), requestQAPlanRetry(), configureNotices(), retryRecipientLookup(), recoverCTOInput(), enqueueGreen156(), failedWorker(), requeueWaitedImplement() (+21 more)

### Community 37 - "run-accounting.ts"
Cohesion: 0.09
Nodes (53): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+45 more)

### Community 38 - "ref_node_path"
Cohesion: 0.06
Nodes (52): GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles(), ContinuationIO (+44 more)

### Community 39 - "index.tsx"
Cohesion: 0.05
Nodes (68): Conversation(), SendMessage, LessonDecisionAction, lessonDecisionState(), readLessonDecision(), Outbox(), ctoInputFailure(), OutboxCTOInput() (+60 more)

### Community 40 - "Conversation.tsx"
Cohesion: 0.16
Nodes (26): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress(), effectId() (+18 more)

### Community 41 - ".save"
Cohesion: 0.15
Nodes (21): assetDownloader(), attachmentKind(), evidenceDirectory(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS, EvidenceAttachment (+13 more)

### Community 42 - "TicketJob"
Cohesion: 0.15
Nodes (3): QuestionNotifications, Offices, markCaptureStart()

### Community 43 - "maintenance/maintenance.ts"
Cohesion: 0.16
Nodes (24): readBackOrThrow(), closesIssue(), linkedBody(), linkPR(), DependabotPR, dependabotPR(), adoptDependencyBot(), adoptOne() (+16 more)

### Community 44 - "time-scope.ts"
Cohesion: 0.12
Nodes (21): ctoInputRecovered(), conversationResolved(), projectOutbox(), syncOutbox(), finishSupersededReadback(), projectSlackDeliveries(), settleRequestedSlackReplacement(), Input (+13 more)

### Community 45 - "telemetry.ts"
Cohesion: 0.13
Nodes (32): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence(), CaptureContext (+24 more)

### Community 46 - "projects.ts"
Cohesion: 0.17
Nodes (13): IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), intakeMembership(), projectListScope(), LOCAL_BINDINGS, file (+5 more)

### Community 47 - "remove-candidate.ts"
Cohesion: 0.16
Nodes (20): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+12 more)

### Community 48 - "OfficeScene.tsx"
Cohesion: 0.18
Nodes (30): jiraCollection(), BLOCKED, findComment(), LiveIssue, readIssue(), readIssues(), Execute, jira() (+22 more)

### Community 49 - "index.ts"
Cohesion: 0.11
Nodes (29): deliverySlot(), verifiedCloseoutCleanupRequest(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), requestPriority(), closedTicketRequest(), REOBSERVED (+21 more)

### Community 50 - "Store"
Cohesion: 0.06
Nodes (34): GitHubFeaturePublisher, JiraFeaturePublisher, leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), queueImprovements(), Assessment (+26 more)

### Community 51 - "resume-provider-review.ts"
Cohesion: 0.09
Nodes (40): baselineLearning(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences(), clip(), maintenanceBlockedId(), MaintenanceCandidate (+32 more)

### Community 52 - "coordination.ts"
Cohesion: 0.13
Nodes (21): clip(), DEMAND_LIMIT, demandFacts(), DemandSection, key(), LessonKey, notes(), Binding (+13 more)

### Community 53 - "ticket-evidence.ts"
Cohesion: 0.21
Nodes (25): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), ProjectCard, projectCards(), projectGraphql() (+17 more)

### Community 54 - "weekly-rollup.ts"
Cohesion: 0.25
Nodes (8): closeoutRequestResolved(), GitHubOperations, admitImprovement(), fileLessonIssue(), closeNativeRefresh(), fingerprint(), Effects, EffectIntent

### Community 55 - "task-briefing.ts"
Cohesion: 0.14
Nodes (16): CommentPage, commentReadback(), applyIntakeObservation(), Assignment, Content, jiraText(), Transition, JiraOperations (+8 more)

### Community 56 - "work.ts"
Cohesion: 0.18
Nodes (16): implementationWorkerContext(), cecPrompt(), resolvedDecisionNote(), reviewedPlanGuidance, reviewedPlanGuideDigest, stagePrompt(), StagePromptInput, METADATA_FINDING_GUIDANCE (+8 more)

### Community 57 - "scheduled-work.ts"
Cohesion: 0.28
Nodes (4): PublicationReceipt, GitHubIssuePublisher, number(), same()

### Community 58 - "admit-improvement.ts"
Cohesion: 0.15
Nodes (25): learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), RollupResult (+17 more)

### Community 59 - "service-health.ts"
Cohesion: 0.13
Nodes (19): basisOf(), claudeCost(), toMicroUsd(), claudeCrashZero(), claudeUsage(), codexUsage(), count(), CostCompleteness (+11 more)

### Community 60 - "Effects"
Cohesion: 0.19
Nodes (18): FeatureQuestionProjection, OutboxQuestionRound(), send(), draftKey(), readDraft(), saveDraft(), QuestionRound(), nextQuestion() (+10 more)

### Community 61 - "evidence-artifacts.ts"
Cohesion: 0.14
Nodes (18): BLOCKED_CAUSES, blockedCauses(), projectReadiness(), ProjectReadiness, AssignmentResult, BlockedCause, CompletionCondition, DeliveryAdmission (+10 more)

### Community 62 - "App.tsx"
Cohesion: 0.06
Nodes (48): itAgent(), itDiagnostics(), BrainDrawer(), themeColor, App(), BrainWorkspace, CONNECTION, CONNECTION_DOT (+40 more)

### Community 63 - "harnessEffect"
Cohesion: 0.13
Nodes (22): lessonIssueBody(), lessonIssueMarker(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), lessonText() (+14 more)

### Community 64 - "it-specialist.ts"
Cohesion: 0.18
Nodes (18): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot() (+10 more)

### Community 65 - "useOfficePreferences.ts"
Cohesion: 0.13
Nodes (27): itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps(), BARE_UUID, COMPOSITE, strip(), SUBJECT (+19 more)

### Community 66 - "offices.ts"
Cohesion: 0.14
Nodes (20): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+12 more)

### Community 67 - "record-push.ts"
Cohesion: 0.17
Nodes (17): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+9 more)

### Community 68 - "JiraIssuePublisher"
Cohesion: 0.14
Nodes (16): Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership, rawHash() (+8 more)

### Community 70 - "QuestionStepper.tsx"
Cohesion: 0.22
Nodes (5): JiraIssuePublisher, keyOf(), publicationDescription(), FeatureManifestItem, FeatureOperation

### Community 71 - "Offices"
Cohesion: 0.17
Nodes (13): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), admitReadyCards(), due() (+5 more)

### Community 72 - "constellation-runtime.ts"
Cohesion: 0.19
Nodes (15): partialLocalCleanupKey(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), ITContext, diagnosticSnapshot(), publishITReport() (+7 more)

### Community 73 - "stopped-base-validation.ts"
Cohesion: 0.23
Nodes (14): improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker(), improvementProvider() (+6 more)

### Community 74 - "tracking-issue.ts"
Cohesion: 0.18
Nodes (16): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+8 more)

### Community 75 - "worker-runtime.ts"
Cohesion: 0.07
Nodes (41): candidateWorkspaceEnvironment(), assignmentSubject(), dispatchExposure(), prepareExposure(), LessonSelection, catalogLine(), assertBriefingScope(), clearUnblockBrief() (+33 more)

### Community 77 - "blocker-followups.ts"
Cohesion: 0.37
Nodes (10): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), readBackConversations(), handoff(), reconcileBlockerFollowups(), improvementIntakeGate(), captureLearning() (+2 more)

### Community 78 - "Store"
Cohesion: 0.33
Nodes (10): ensureTrackingIssue(), findTrackingIssue(), ownTracking(), TrackingIssue, trackingIssueBody(), trackingIssueTitle(), trackingMarker(), centralCompanionHandoff() (+2 more)

### Community 79 - "features/workflow.ts"
Cohesion: 0.12
Nodes (15): approveFeature(), featureById(), discoveryPrompt(), planPrompt(), Link, linkFeature(), FeaturePublisher, publishFeature() (+7 more)

### Community 80 - "highestStableAtLeast"
Cohesion: 0.26
Nodes (14): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+6 more)

### Community 81 - "coordination.ts"
Cohesion: 0.08
Nodes (36): reconcileNoticeConfirmations(), admit(), compatible(), dependencyCompletionKey(), dependencyEligibility(), issueKey(), observePrerequisites(), PrerequisiteSchema (+28 more)

### Community 82 - "CommittedBrain"
Cohesion: 0.29
Nodes (5): preferencesRoute(), PreferencesRouteContext, PreferencesStore, PreferenceState, OfficePreferences

### Community 83 - "run-evidence.ts"
Cohesion: 0.16
Nodes (11): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, slackHealth() (+3 more)

### Community 84 - "ProjectProgress"
Cohesion: 0.33
Nodes (11): Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked(), row() (+3 more)

### Community 85 - "process.ts"
Cohesion: 0.13
Nodes (19): inactivityWatch(), At, Errno, errno(), GroupInventory, GroupProbe, LifecycleDiagnostic, Phase (+11 more)

### Community 86 - "node-visuals.ts"
Cohesion: 0.16
Nodes (9): args, [cmd,...rawArgs], commands, key, projectIndex, LessonBrainAudit, lessonBrainAudit(), LessonBrainOverlap (+1 more)

### Community 87 - "session-context-file.ts"
Cohesion: 0.20
Nodes (13): ContextFoldPrefix, contextFoldPrefix(), SessionContextCheckpoint, captureSessionContextClone(), ContextReadPhase, SessionContextDeadline, sessionContextFile(), ContextReadChanged (+5 more)

### Community 89 - "local-config.ts"
Cohesion: 0.21
Nodes (16): AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), githubPRDescription(), azureGoalFacts(), azurePRDescription(), boundedEvidence(), collectAzureGoalDocuments(), EvidenceStore (+8 more)

### Community 90 - "session-bridge.ts"
Cohesion: 0.17
Nodes (15): codexDaemonProcesses(), accountCodexProcesses(), CodexProcessInventory, codexProcessInventory(), DesktopSessions, unaccountedProcesses(), idleExecServers(), isExecServer() (+7 more)

### Community 91 - "checkpoint-retry.ts"
Cohesion: 0.16
Nodes (17): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), legacy, validateNativeContinuation(), checkpointHasMaintenanceAlert() (+9 more)

### Community 92 - "report.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 93 - "capture-session-clone.py"
Cohesion: 0.27
Nodes (8): APPROACH_GUIDANCE, reviewInstructions(), deliveryTask(), DeliveryTaskInput, DISCOVERY_GUIDANCE, compactSteps(), AMENDMENT_REVIEW_PROOF, featureDeliveryContext()

### Community 94 - "node-visuals.ts"
Cohesion: 0.20
Nodes (14): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+6 more)

### Community 95 - "RoomCamera.tsx"
Cohesion: 0.36
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 96 - "continue-access-only-plan.ts"
Cohesion: 0.54
Nodes (6): Document, document(), isAccessOnlyPlan(), settledAccessOnlyState(), continueAccessOnlyPlan(), entryExists()

### Community 97 - "createConstellation"
Cohesion: 0.43
Nodes (5): Event, one(), prePushRejection(), PushIdentity, settledPushBoundary()

### Community 98 - "report-evidence.ts"
Cohesion: 0.39
Nodes (6): safeWebUrl(), officeValidation(), contained(), officeQAEvidenceGap(), OfficeQAReportSchema, text

### Community 100 - "provider-observation.ts"
Cohesion: 0.47
Nodes (4): correlatedBuild(), observe(), observeParked(), parkedReadError

### Community 102 - "qualify.ts"
Cohesion: 0.20
Nodes (11): Execute, adoptDependabot(), DEPENDABOT, openDependabotPulls(), readRepo(), refusal(), DependencyBot, pinCourier (+3 more)

### Community 103 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 104 - "run-accounting.ts"
Cohesion: 0.21
Nodes (14): readCodexRollout(), codexAccounting(), COMPLETION_MAX_BYTES, merge(), readCompletion(), RECONCILE_GRACE_MS, reconcileUncapturedRuns(), reconciling (+6 more)

### Community 105 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (7): CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility, overlayEntranceDelays(), SceneOverlay()

### Community 106 - "admission.ts"
Cohesion: 0.22
Nodes (11): Admission, IntakeContext, WAIT_STATUSES, DependencyStores, Continuation, Prerequisite, WorkFailure, AssignmentReview (+3 more)

### Community 107 - "createConstellation"
Cohesion: 0.18
Nodes (5): ConstellationRuntime, createConstellation(), enter(), finishTap(), move()

### Community 108 - "evidence-artifacts.ts"
Cohesion: 0.35
Nodes (9): readEvidence(), ProviderEvidence, canonical(), evidenceDigest(), evidenceHash(), semantic(), stableUrl(), requirementDrift() (+1 more)

### Community 109 - "price-table.ts"
Cohesion: 0.18
Nodes (9): CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL, Rates (+1 more)

### Community 110 - "codex-rollout.ts"
Cohesion: 0.29
Nodes (9): add(), CodexRequest, CodexRollout, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens() (+1 more)

### Community 111 - "recover-saved-plan.ts"
Cohesion: 0.33
Nodes (7): MISSING_SAVED_PLAN, recoverSavedPlan(), advance(), nextStage(), persistReaderAnalysis(), readerAnalysisReference(), Evidence

### Community 112 - "retire-history.ts"
Cohesion: 0.33
Nodes (7): enqueueHistoryRetirement(), historicalRecordDigest(), Intent, records(), retireIncompleteHistory(), HistoryRetirement, HistoryRetirementIntent

### Community 113 - "session-coverage.ts"
Cohesion: 0.36
Nodes (7): claudeSessions(), completeSessionCoverage(), desktopCoverageGap(), knownActivity(), Report, unexplained(), sessionInventoryFailureDetail()

### Community 114 - "merge-summary.ts"
Cohesion: 0.36
Nodes (7): clamp(), LIMITS, MergedPR, plainSlackText(), section(), shippedSummary(), mergeText()

### Community 115 - "codex-rollout-file.ts"
Cohesion: 0.36
Nodes (7): codexHome(), createdAt(), dayDirs(), header(), ROLLOUT_MAX_BYTES, RolloutScan, scanCodexRollouts()

### Community 116 - "install-service.mjs"
Cohesion: 0.29
Nodes (4): file, folder, logs, root

### Community 117 - "harnessEffect"
Cohesion: 0.52
Nodes (4): HarnessEffect, harnessEffect(), park(), Execute

### Community 118 - "diagnostic-context.ts"
Cohesion: 0.60
Nodes (3): assignmentDiagnostics(), diagnosticContext(), currentServices()

### Community 119 - "run-evidence.ts"
Cohesion: 0.47
Nodes (4): comparable(), EvidenceOutcome, recordRunEvidence(), RunAccounting

### Community 120 - "highestStableAtLeast"
Cohesion: 0.83
Nodes (3): compare(), highestStableAtLeast(), parts()

## Knowledge Gaps
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `source-amendment.ts`, `TicketJob`, `Inspector.tsx`, `outbox.ts`, `App.tsx`, `engine.ts`, `features/workflow.ts`, `github/issue-publication.ts`, `authorize.ts`, `config.ts`, `Role`, `agents.ts`, `worker-runtime.ts`, `record-trigger.ts`, `github-delivery.ts`, `digest`, `shared.ts`, `TimeBook.tsx`, `owned-artifact.ts`, `run-retrospective.ts`, `.emit`, `knowledge.ts`, `sanitize`, `cec/issue-publication.ts`, `features.ts`, `reader.ts`, `shared.ts`, `run-accounting.ts`, `ref_node_path`, `index.tsx`, `Conversation.tsx`, `.save`, `TicketJob`, `maintenance/maintenance.ts`, `time-scope.ts`, `telemetry.ts`, `remove-candidate.ts`, `OfficeScene.tsx`, `index.ts`, `resume-provider-review.ts`, `coordination.ts`, `ticket-evidence.ts`, `weekly-rollup.ts`, `task-briefing.ts`, `work.ts`, `scheduled-work.ts`, `admit-improvement.ts`, `harnessEffect`, `it-specialist.ts`, `offices.ts`, `record-push.ts`, `JiraIssuePublisher`, `QuestionStepper.tsx`, `Offices`, `constellation-runtime.ts`, `stopped-base-validation.ts`, `tracking-issue.ts`, `worker-runtime.ts`, `lesson-selection.ts`, `blocker-followups.ts`, `Store`, `features/workflow.ts`, `coordination.ts`, `process.ts`, `local-config.ts`, `session-bridge.ts`, `checkpoint-retry.ts`, `capture-session-clone.py`, `continue-access-only-plan.ts`, `ProjectProgress`, `qualify.ts`, `run-accounting.ts`, `admission.ts`, `evidence-artifacts.ts`, `recover-saved-plan.ts`, `retire-history.ts`, `harnessEffect`, `diagnostic-context.ts`, `run-evidence.ts`?**
  _High betweenness centrality (0.106) - this node is a cross-community bridge._
- **Should `source-amendment.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.052464525765496636 - nodes in this community are weakly interconnected._
- **Why does `OfficeSnapshot` connect `index.tsx` to `Inspector.tsx`, `agents.ts`, `post-conflict-preparation.ts`, `assignments.ts`, `OfficeScene.tsx`, `worker-runtime.ts`, `shared.ts`, `pilot-delivery.ts`, `DailyCTO.tsx`, `dependencies.ts`, `sanitize`, `cec/issue-publication.ts`, `time-scope.ts`, `remove-candidate.ts`, `Store`, `resume-provider-review.ts`, `evidence-artifacts.ts`, `App.tsx`, `useOfficePreferences.ts`, `Offices`, `worker-runtime.ts`, `run-evidence.ts`, `checkpoint-retry.ts`, `scene-motion.ts`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Should `TicketJob` be split into smaller, more focused modules?**
  _Cohesion score 0.06253585771658061 - nodes in this community are weakly interconnected._
- **Why does `digest()` connect `outbox.ts` to `source-amendment.ts`, `TicketJob`, `Inspector.tsx`, `shared.ts`, `run-accounting.ts`, `ref_node_path`, `App.tsx`, `constellation-runtime.ts`, `time-scope.ts`, `config.ts`, `retire-history.ts`, `index.ts`, `TimeBook.tsx`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Should `Inspector.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06763085399449036 - nodes in this community are weakly interconnected._
- **Should `agents.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06788766788766788 - nodes in this community are weakly interconnected._