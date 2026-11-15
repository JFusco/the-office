# Graph Report - office-simple-qa-handoff-nov15  (2026-11-15)

## Corpus Check
- 817 files · ~332,527 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4069 nodes · 19022 edges · 118 communities (112 shown, 6 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 671 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9ac3666e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- rootArtifact
- github-readiness.ts
- Inspector.tsx
- agents.ts
- outbox.ts
- post-conflict-preparation.ts
- session-scope.ts
- constellation-runtime.ts
- App.tsx
- enrollment-gate.ts
- assignments.ts
- features/workflow.ts
- ref_node_crypto
- OfficeScene.tsx
- authorize.ts
- ref_node_path
- Role
- agents.ts
- worker-runtime.ts
- record-trigger.ts
- artifact
- github-delivery.ts
- digest
- office-qa-handoff.ts
- pilot-delivery.ts
- TimeBook.tsx
- owned-artifact.ts
- GitHubDelivery
- run-retrospective.ts
- dependencies.ts
- .emit
- features.ts
- sanitize
- cec/issue-publication.ts
- features.ts
- notifications.ts
- shared.ts
- run-accounting.ts
- candidate.ts
- OfficeSnapshot
- Conversation.tsx
- .save
- TicketJob
- index.tsx
- outbox.ts
- telemetry.ts
- scope-repair-resume.ts
- command
- OfficeScene.tsx
- index.ts
- Store
- resume-provider-review.ts
- coordination.ts
- ticket-evidence.ts
- Effects
- LessonsPanel.tsx
- work.ts
- disposition-store.ts
- admit-improvement.ts
- run-usage.ts
- Effects
- shared.ts
- App.tsx
- harnessEffect
- it-specialist.ts
- useOfficePreferences.ts
- offices.ts
- record-push.ts
- JiraIssuePublisher
- daily-cto.ts
- cec/issue-publication.ts
- assignment-poll.ts
- delivery-authority.ts
- stopped-base-validation.ts
- intent.ts
- daily-cto.ts
- lesson-selection.ts
- learning-events.ts
- Store
- Store
- highestStableAtLeast
- coordination.ts
- time-readback.ts
- it-specialist.ts
- ProjectProgress
- record-push.ts
- config.ts
- session-context-file.ts
- conversations/conversations.ts
- engine.ts
- session-bridge.ts
- leadership.ts
- report.ts
- retire-external-delivery.ts
- node-visuals.ts
- RoomCamera.tsx
- continue-access-only-plan.ts
- .constructor
- cec/workflow.ts
- CommittedBrain
- desktopSessions
- ProjectProgress
- qualify.ts
- scene-motion.ts
- run-accounting.ts
- RoomCamera.tsx
- cost-totals.ts
- knowledge-views.ts
- evidence-artifacts.ts
- run-cost.ts
- codex-rollout.ts
- pilot-delivery.ts
- retire-history.ts
- live-reach.ts
- install-service.mjs
- harnessEffect
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
- `apply()` --indirect_call--> `note()`  [INFERRED]
  src/conversations/OutboxSavedImplementation.tsx → server/cec/parking/resume-parked.ts
- `Store` --references--> `OfficeSnapshot`  [EXTRACTED]
  server/store/store.ts → src/shared.ts
- `StageContext` --references--> `Role`  [EXTRACTED]
  server/delivery/pipeline/accept-stage-result.ts → src/shared.ts
- `DeliveryTaskInput` --references--> `TicketJob`  [EXTRACTED]
  server/delivery/pipeline/delivery-task.ts → src/shared.ts
- `StagePromptInput` --references--> `TicketJob`  [EXTRACTED]
  server/delivery/pipeline/stage-prompts.ts → src/shared.ts

## Import Cycles
- 2-file cycle: `server/scheduling/coordination-pump.ts -> server/scheduling/coordination.ts -> server/scheduling/coordination-pump.ts`
- 2-file cycle: `server/scheduling/coordination-tick.ts -> server/scheduling/coordination.ts -> server/scheduling/coordination-tick.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/track-adopted-review.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/stage-reconciliation.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/implementation/saved-prerequisite-handoff.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/source-amendment/source-amendment.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/accept-stage-result.ts -> server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/accept-stage-result.ts`
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

## Communities (118 total, 6 thin omitted)

### Community 0 - "rootArtifact"
Cohesion: 0.05
Nodes (75): interruptedImplementation(), partialLocalCleanupCandidate(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash (+67 more)

### Community 1 - "github-readiness.ts"
Cohesion: 0.10
Nodes (45): observe(), assertAutomationEffects(), automationMergePolicy(), observeAutomationMerge(), routeAutomationMerge(), checksFailed(), checksPassed(), checksPending() (+37 more)

### Community 2 - "Inspector.tsx"
Cohesion: 0.06
Nodes (82): containedFile(), removeAdoptedClone(), harnessCloseout(), PASSING, verifyMergeActions(), findingsBlock(), namedRepairIds(), assertDeliveryMayMutate() (+74 more)

### Community 3 - "agents.ts"
Cohesion: 0.10
Nodes (39): Activity(), ActivityTimeline(), AssignmentKnowledge(), Lookup(), BrainWorkspace(), DocumentMetadata, documentText(), KnowledgeDocumentText (+31 more)

### Community 4 - "outbox.ts"
Cohesion: 0.08
Nodes (46): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+38 more)

### Community 5 - "post-conflict-preparation.ts"
Cohesion: 0.12
Nodes (56): blockedSummary(), ServiceHealthPanel(), labels, ServiceHealthRow(), BlockerFollowups(), GoalList(), card(), EvidenceCard() (+48 more)

### Community 6 - "session-scope.ts"
Cohesion: 0.18
Nodes (16): claudeSessionScope(), codexSessionContext(), readRollout, ContextProject, ContextReader, retainSessionMessage(), SessionConversation, jiraCommandIssues() (+8 more)

### Community 7 - "constellation-runtime.ts"
Cohesion: 0.10
Nodes (20): CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point, createConstellation(), enter() (+12 more)

### Community 8 - "App.tsx"
Cohesion: 0.06
Nodes (106): reconcileBoardPreflight(), advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat(), assertContinuationWorker(), continuationScope() (+98 more)

### Community 9 - "enrollment-gate.ts"
Cohesion: 0.43
Nodes (11): currentApproval(), featureGate(), predecessorComplete(), automaticIntakeWait(), DeliveryPreflight, deliveryPreflight(), handoffBinding(), readHandoff() (+3 more)

### Community 10 - "assignments.ts"
Cohesion: 0.11
Nodes (40): label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+32 more)

### Community 11 - "features/workflow.ts"
Cohesion: 0.06
Nodes (72): DeliveryTaskInput, DISCOVERY_GUIDANCE, adoptCandidate(), reported, Scope, directionContract(), scopeRepairDirection(), approvedText() (+64 more)

### Community 12 - "ref_node_crypto"
Cohesion: 0.11
Nodes (39): commandFeature(), createFeature(), reviewQuestions(), featureItemComplete(), reconcileFeatureCompletion(), assertEnrollable(), FeatureCommandSchema, DELAYS (+31 more)

### Community 13 - "OfficeScene.tsx"
Cohesion: 0.17
Nodes (33): Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk(), ElevatorStage() (+25 more)

### Community 14 - "authorize.ts"
Cohesion: 0.07
Nodes (56): approveFeature(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), discoveryPrompt(), planPrompt(), artifactPath() (+48 more)

### Community 15 - "ref_node_path"
Cohesion: 0.09
Nodes (42): assertStoppedBaseAudit(), AuditRow, readStoppedBaseAuditCompletion(), StoppedBaseAuditReader, CoverageRow, Hash, Kind, readStoppedBaseAuditNative() (+34 more)

### Community 16 - "Role"
Cohesion: 0.09
Nodes (28): intakeLocation(), projectSlackDeliveries(), ROLES, DELIVERY_CONCURRENCY, LOCAL_BINDINGS, file, project, root (+20 more)

### Community 17 - "agents.ts"
Cohesion: 0.04
Nodes (75): cecReconcilePrompt(), stageInstructions, cecChatPrompt(), ctoChatPrompt(), itChatPrompt(), slackSendPrompt(), slackVerifyPrompt(), comparableSlackText() (+67 more)

### Community 18 - "worker-runtime.ts"
Cohesion: 0.06
Nodes (44): implementationPreview(), implementationContinuationRoute(), entryExists(), inspectClosedQAPlan(), qaPlanRetryRoute(), close(), config, itSpecialist (+36 more)

### Community 19 - "record-trigger.ts"
Cohesion: 0.19
Nodes (29): assessmentSignal(), AssessmentSignals, failEvidenceCapture(), CaptureRequest, captureRequest(), captureRequests(), failCapture(), saveCaptureRequest() (+21 more)

### Community 20 - "artifact"
Cohesion: 0.06
Nodes (39): curateLesson(), Curation, CurationAction, mergeEvidence(), LessonBrainAudit, lessonBrainAudit(), LessonBrainOverlap, BRAIN_SCOPE (+31 more)

### Community 21 - "github-delivery.ts"
Cohesion: 0.09
Nodes (31): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, GraphNode (+23 more)

### Community 22 - "digest"
Cohesion: 0.14
Nodes (7): DailyCTO, EvidenceRequestConflict, queueGoalEvidenceRequest(), Briefing, saveReviewBriefing(), ControlStore, DailyCTOReport

### Community 23 - "office-qa-handoff.ts"
Cohesion: 0.83
Nodes (3): OfficeQAHandoff, OfficeQAHandoffInput, OfficeQAHandoffRequest

### Community 24 - "pilot-delivery.ts"
Cohesion: 0.13
Nodes (37): TicketPlanningAction(), SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState (+29 more)

### Community 25 - "TimeBook.tsx"
Cohesion: 0.12
Nodes (49): retryRead(), admitPRMetadata(), assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema, savedMetadataAssessment(), validateSaved() (+41 more)

### Community 26 - "owned-artifact.ts"
Cohesion: 0.19
Nodes (16): done(), readBoundedNoFollow(), readBoundedNoFollowSync(), reasonOf(), codexHome(), createdAt(), dayDirs(), header() (+8 more)

### Community 27 - "GitHubDelivery"
Cohesion: 0.10
Nodes (25): pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), GitHubDelivery, stoppedBaseCheckout(), stoppedBaseHandoffResolved(), discussion(), pages(), pullIdentity() (+17 more)

### Community 28 - "run-retrospective.ts"
Cohesion: 0.10
Nodes (25): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+17 more)

### Community 29 - "dependencies.ts"
Cohesion: 0.09
Nodes (45): LiveAnchor, displayAgentTask(), githubStageLabels, withoutElapsed(), LiveAgentTask(), Props, RunningTask(), text() (+37 more)

### Community 30 - ".emit"
Cohesion: 0.16
Nodes (29): parksInJira(), run(), publicationEvidenceGap(), qaEvidenceGap(), stageResultGap(), DECISION_KINDS, needsDecision(), afterDraft() (+21 more)

### Community 31 - "features.ts"
Cohesion: 0.11
Nodes (24): normalizeRound(), FeatureApproval, FeatureAttempt, FeatureAuthority, FeatureBaseline, FeatureDocument, FeatureHandoff, FeatureHarnessAction (+16 more)

### Community 32 - "sanitize"
Cohesion: 0.08
Nodes (35): maintenancePolicies(), captureLearning(), captureMaintenanceStep(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, BrainStatusSchema, identity (+27 more)

### Community 33 - "cec/issue-publication.ts"
Cohesion: 0.09
Nodes (38): Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint(), supersedingDelivery(), INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationCandidates() (+30 more)

### Community 34 - "features.ts"
Cohesion: 0.09
Nodes (44): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, BlockingTrigger, blockingTrigger(), isBlocking() (+36 more)

### Community 35 - "notifications.ts"
Cohesion: 0.13
Nodes (19): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR (+11 more)

### Community 36 - "shared.ts"
Cohesion: 0.13
Nodes (29): decideImplementation(), requestQAPlanRetry(), configureNotices(), retryRecipientLookup(), recoverCTOInput(), enqueueGreen156(), failedWorker(), requeueWaitedImplement() (+21 more)

### Community 37 - "run-accounting.ts"
Cohesion: 0.10
Nodes (42): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+34 more)

### Community 38 - "candidate.ts"
Cohesion: 0.18
Nodes (16): GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles(), ContinuationIO (+8 more)

### Community 39 - "OfficeSnapshot"
Cohesion: 0.08
Nodes (38): SendMessage, recover(), OutboxSavedImplementation(), apply(), review(), OutboxSavedPlan(), reconcile(), FeatureDelivery() (+30 more)

### Community 40 - "Conversation.tsx"
Cohesion: 0.18
Nodes (24): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId(), OutsideEdit (+16 more)

### Community 41 - ".save"
Cohesion: 0.10
Nodes (30): CommentPage, commentReadback(), JiraOperations, plain(), jiraRecord(), unpack(), metadataDigest(), verifiedTransition() (+22 more)

### Community 43 - "index.tsx"
Cohesion: 0.09
Nodes (27): Conversation(), slackMessageStatus(), SlackDeliveryCard(), slackMessageUrl(), buttonClasses(), ButtonLayout, ButtonVariant, variants (+19 more)

### Community 44 - "outbox.ts"
Cohesion: 0.09
Nodes (33): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), ctoInputRecovered(), conversationResolved(), projectOutbox(), syncOutbox(), slackRequestSettled() (+25 more)

### Community 45 - "telemetry.ts"
Cohesion: 0.17
Nodes (24): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), midnight(), TicketDay (+16 more)

### Community 46 - "scope-repair-resume.ts"
Cohesion: 0.15
Nodes (24): Assessment, outsideScanSources(), Ownership, requireThat(), sha, assertScopeRepairResumeFindings(), certain(), directionPaths (+16 more)

### Community 47 - "command"
Cohesion: 0.07
Nodes (39): az(), AzureMonitor, base, buildUrl(), correlatedBuild(), prUrl(), readInPairs(), ProviderPR (+31 more)

### Community 48 - "OfficeScene.tsx"
Cohesion: 0.19
Nodes (29): jiraCollection(), BLOCKED, findComment(), LiveIssue, readIssue(), readIssues(), Execute, jira() (+21 more)

### Community 49 - "index.ts"
Cohesion: 0.14
Nodes (24): deliverySlot(), verifiedCloseoutCleanupRequest(), metadataRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), requestPriority(), closedTicketRequest(), REOBSERVED (+16 more)

### Community 50 - "Store"
Cohesion: 0.12
Nodes (20): Clock, EASTERN, easternDayFormatter, easternPartsFormatter, systemClock, applyConnectionSettings(), closeConnection(), optimizeOnOpen() (+12 more)

### Community 51 - "resume-provider-review.ts"
Cohesion: 0.12
Nodes (35): LEARNING_BASELINES, maintainLearning(), clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates(), maintenanceCompletedId(), maintenanceKey() (+27 more)

### Community 52 - "coordination.ts"
Cohesion: 0.09
Nodes (27): clip(), DEMAND_LIMIT, demandFacts(), key(), LessonKey, notes(), AssignmentLookups, assignmentLookups (+19 more)

### Community 53 - "ticket-evidence.ts"
Cohesion: 0.20
Nodes (27): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), ProjectCard, projectCards(), projectGraphql() (+19 more)

### Community 54 - "Effects"
Cohesion: 0.12
Nodes (23): featureById(), publishFeature(), reconcilePublication(), uncertainPublications(), reserveIdentity(), GitHubOperations, fileLessonIssue(), lessonIssueBody() (+15 more)

### Community 55 - "LessonsPanel.tsx"
Cohesion: 0.21
Nodes (17): LessonDecisionAction, lessonDecisionState(), readLessonDecision(), OutboxLessonDecision(), act(), readStatus(), LearningCoverage(), Evidence() (+9 more)

### Community 56 - "work.ts"
Cohesion: 0.10
Nodes (29): verifyContinuationPreservation(), implementationWorkerContext(), cecPrompt(), resolvedDecisionNote(), closedReadonlyPlan(), Document, document(), reviewedPlanGuidance (+21 more)

### Community 57 - "disposition-store.ts"
Cohesion: 0.36
Nodes (15): enrolled(), requestCapture(), AssessmentOutcome, AssessmentResult, closeAssessment(), latestAssessment(), openAssessment(), saveAssessment() (+7 more)

### Community 58 - "admit-improvement.ts"
Cohesion: 0.15
Nodes (25): learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), RollupResult (+17 more)

### Community 59 - "run-usage.ts"
Cohesion: 0.38
Nodes (5): claudeCrashZero(), claudeUsage(), codexUsage(), count(), RunUsage

### Community 60 - "Effects"
Cohesion: 0.19
Nodes (18): FeatureQuestionProjection, OutboxQuestionRound(), send(), draftKey(), readDraft(), saveDraft(), QuestionRound(), nextQuestion() (+10 more)

### Community 61 - "shared.ts"
Cohesion: 0.05
Nodes (46): BLOCKED_CAUSES, blockedCauses(), projectReadiness(), persistReaderAnalysis(), readerAnalysisReference(), ProjectReadiness, PackedPublicationRepair, OfficeQAReport (+38 more)

### Community 62 - "App.tsx"
Cohesion: 0.06
Nodes (48): itAgent(), itDiagnostics(), BrainDrawer(), themeColor, App(), BrainWorkspace, CONNECTION, CONNECTION_DOT (+40 more)

### Community 63 - "harnessEffect"
Cohesion: 0.14
Nodes (19): INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonText(), MAINTENANCE, MAX_LESSONS, normalPath() (+11 more)

### Community 64 - "it-specialist.ts"
Cohesion: 0.18
Nodes (18): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot() (+10 more)

### Community 65 - "useOfficePreferences.ts"
Cohesion: 0.10
Nodes (36): compactSteps(), Outbox(), ctoInputFailure(), OutboxCTOInput(), OutboxMaintenanceStatus(), savedImplementationFollowup(), itFollowUpView(), sessionVisibilityCopy() (+28 more)

### Community 66 - "offices.ts"
Cohesion: 0.15
Nodes (19): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+11 more)

### Community 67 - "record-push.ts"
Cohesion: 0.22
Nodes (12): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+4 more)

### Community 68 - "JiraIssuePublisher"
Cohesion: 0.26
Nodes (11): Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership, rawHash() (+3 more)

### Community 70 - "cec/issue-publication.ts"
Cohesion: 0.08
Nodes (21): Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), Transition, descriptionPreimage(), plain() (+13 more)

### Community 71 - "assignment-poll.ts"
Cohesion: 0.11
Nodes (24): Admission, admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, resumeParked(), compatible(), dependencyCompletionKey() (+16 more)

### Community 72 - "delivery-authority.ts"
Cohesion: 0.16
Nodes (20): deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), deliveryIntakeBlocker(), gateRegisteredDelivery(), resolveDeliveryWork(), closeoutRequestResolved(), savedAdmissionUnresolved() (+12 more)

### Community 73 - "stopped-base-validation.ts"
Cohesion: 0.22
Nodes (15): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+7 more)

### Community 74 - "intent.ts"
Cohesion: 0.20
Nodes (12): assertOwnership(), ImplementationDecision, OwnershipRead, consumeQAPlanRetry(), continueUnsealedQA(), entry(), Decision, ImplementationContinuation (+4 more)

### Community 75 - "daily-cto.ts"
Cohesion: 0.18
Nodes (12): evidenceRequestConflicts, dailyReviewPrompt(), applyGoalReview(), DailyResultSchema, EvidenceRefSchema, FreshDailyResultSchema, GoalEvidenceRequestSchema, statusAllowed() (+4 more)

### Community 77 - "learning-events.ts"
Cohesion: 0.39
Nodes (6): improvementIntakeGate(), learningDigest(), recordLearningOpportunity(), expireLearningPackets(), packetReferences(), LearningOpportunity

### Community 78 - "Store"
Cohesion: 0.18
Nodes (18): readBackOrThrow(), DependabotPR, ensureTrackingIssue(), findTrackingIssue(), ownTracking(), TrackingIssue, trackingIssueBody(), trackingIssueTitle() (+10 more)

### Community 79 - "Store"
Cohesion: 0.10
Nodes (17): helperTelemetry(), helperInstallation(), observeHelperGroups(), stopHelperGroups(), FeatureReviewRunner, stopReview(), dispatchExposure(), prepareExposure() (+9 more)

### Community 80 - "highestStableAtLeast"
Cohesion: 0.25
Nodes (15): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+7 more)

### Community 81 - "coordination.ts"
Cohesion: 0.10
Nodes (30): reconcileNoticeConfirmations(), PrerequisitesSchema, completeNativeCheckpoint(), brainCheckpointCompletion(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint() (+22 more)

### Community 82 - "time-readback.ts"
Cohesion: 0.26
Nodes (7): TimeLedger, dueReadback(), Readback, READBACK_INTERVAL_MS, readBackTime(), SETTLE_MS, TimePublication

### Community 83 - "it-specialist.ts"
Cohesion: 0.10
Nodes (23): partialLocalCleanupKey(), assignmentDiagnostics(), ITContext, diagnosticContext(), diagnosticSnapshot(), publishITReport(), nativeDeliveryResolved(), delays (+15 more)

### Community 84 - "ProjectProgress"
Cohesion: 0.14
Nodes (21): CostCompleteness, CostLedgerState, TelemetryReport, TelemetryRow, TelemetrySync, UsageCompleteness, UsageSource, ValuationSource (+13 more)

### Community 85 - "record-push.ts"
Cohesion: 0.15
Nodes (18): Event, one(), prePushRejection(), PushIdentity, Candidate, recordedPush(), settledPushBoundary(), At (+10 more)

### Community 86 - "config.ts"
Cohesion: 0.09
Nodes (29): IntakeBinding, intakeEnumeration(), intakeJql(), intakeMembership(), projectListScope(), cecIntakePrompt(), cecReadbackPrompt(), cecTransitionPrompt() (+21 more)

### Community 87 - "session-context-file.ts"
Cohesion: 0.20
Nodes (13): ContextFoldPrefix, contextFoldPrefix(), SessionContextCheckpoint, captureSessionContextClone(), ContextReadPhase, SessionContextDeadline, sessionContextFile(), ContextReadChanged (+5 more)

### Community 89 - "engine.ts"
Cohesion: 0.33
Nodes (8): checkMail(), drainMail(), requestMail(), enableNightly(), ingest(), drainMaintenance(), reconcileMaintenance(), requestMaintenance()

### Community 90 - "session-bridge.ts"
Cohesion: 0.11
Nodes (21): claudeSessionContext(), readTranscript, root, accountCodexProcesses(), CodexProcessInventory, codexProcessInventory(), DesktopSessions, unaccountedProcesses() (+13 more)

### Community 91 - "leadership.ts"
Cohesion: 0.20
Nodes (8): DailyCTOBriefing, DailyCTOResult, DailyCTOSummary, DailyGoalUpdate, GoalEvidenceRef, GoalEvidenceRequest, GoalProgress, GoalStatus

### Community 92 - "report.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 93 - "retire-external-delivery.ts"
Cohesion: 0.44
Nodes (6): completedPRReviews(), eligible(), mergedByOwner(), ownerSettles(), retireExternalDeliveries(), settledExternalRepair()

### Community 94 - "node-visuals.ts"
Cohesion: 0.20
Nodes (14): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+6 more)

### Community 95 - "RoomCamera.tsx"
Cohesion: 0.36
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 96 - "continue-access-only-plan.ts"
Cohesion: 0.54
Nodes (6): Document, document(), isAccessOnlyPlan(), settledAccessOnlyState(), continueAccessOnlyPlan(), entryExists()

### Community 97 - ".constructor"
Cohesion: 0.33
Nodes (5): leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), markCaptureStart()

### Community 98 - "cec/workflow.ts"
Cohesion: 0.22
Nodes (10): applyIntakeObservation(), qaPlanEvidenceGap(), MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), nextStage(), safeWebUrl(), officeValidation() (+2 more)

### Community 100 - "desktopSessions"
Cohesion: 0.36
Nodes (6): codexDaemonProcesses(), idleExecServers(), isExecServer(), ProcessTable, processTable(), desktopSessions()

### Community 102 - "qualify.ts"
Cohesion: 0.16
Nodes (23): Execute, adoptDependabot(), closesIssue(), linkPR(), DEPENDABOT, dependabotPR(), openDependabotPulls(), readRepo() (+15 more)

### Community 103 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 104 - "run-accounting.ts"
Cohesion: 0.21
Nodes (13): BoundedRead, backfillClaudeCost(), CompletionReader, COMPLETION_MAX_BYTES, completionAccounting(), readCompletion(), RECONCILE_GRACE_MS, reconcileUncapturedRuns() (+5 more)

### Community 105 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (7): CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility, overlayEntranceDelays(), SceneOverlay()

### Community 106 - "cost-totals.ts"
Cohesion: 0.38
Nodes (6): awaitingEvidence(), boardUsd(), CaptureContext, inCostWindow(), TicketCost, ticketCosts()

### Community 107 - "knowledge-views.ts"
Cohesion: 0.16
Nodes (16): KnowledgeActivity, KnowledgeEdge, KnowledgeMap, KnowledgeNode, ConstellationView, ConstellationRuntime, DisplayNode, included() (+8 more)

### Community 108 - "evidence-artifacts.ts"
Cohesion: 0.31
Nodes (11): readEvidence(), ProviderEvidence, canonical(), evidenceDigest(), evidenceHash(), semantic(), stableUrl(), refreshFeatureEvidence() (+3 more)

### Community 109 - "run-cost.ts"
Cohesion: 0.12
Nodes (20): CodexRollout, CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL (+12 more)

### Community 110 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 111 - "pilot-delivery.ts"
Cohesion: 0.21
Nodes (15): continueImplementation(), dispatchNightly(), drainDelivery(), requestDelivery(), resume(), startPilot(), OfficeQAHandoffInput, MISSING_SAVED_PLAN (+7 more)

### Community 112 - "retire-history.ts"
Cohesion: 0.33
Nodes (7): enqueueHistoryRetirement(), historicalRecordDigest(), Intent, records(), retireIncompleteHistory(), HistoryRetirement, HistoryRetirementIntent

### Community 113 - "live-reach.ts"
Cohesion: 0.47
Nodes (5): GIT_NETWORK, LIVE_PROVIDERS, liveReach(), networkUrl(), remoteUrls()

### Community 116 - "install-service.mjs"
Cohesion: 0.29
Nodes (4): file, folder, logs, root

### Community 117 - "harnessEffect"
Cohesion: 0.23
Nodes (14): activeEffectId(), HarnessEffect, harnessEffect(), linkedBody(), park(), Execute, officeMergeProvenance(), reconcileMergeScannerRetry() (+6 more)

### Community 119 - "run-evidence.ts"
Cohesion: 0.47
Nodes (4): comparable(), EvidenceOutcome, recordRunEvidence(), RunAccounting

### Community 120 - "highestStableAtLeast"
Cohesion: 0.83
Nodes (3): compare(), highestStableAtLeast(), parts()

## Knowledge Gaps
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `rootArtifact`, `github-readiness.ts`, `Inspector.tsx`, `outbox.ts`, `App.tsx`, `enrollment-gate.ts`, `features/workflow.ts`, `ref_node_crypto`, `authorize.ts`, `ref_node_path`, `Role`, `agents.ts`, `worker-runtime.ts`, `record-trigger.ts`, `github-delivery.ts`, `TimeBook.tsx`, `run-retrospective.ts`, `.emit`, `sanitize`, `cec/issue-publication.ts`, `features.ts`, `notifications.ts`, `shared.ts`, `run-accounting.ts`, `candidate.ts`, `OfficeSnapshot`, `Conversation.tsx`, `.save`, `TicketJob`, `outbox.ts`, `telemetry.ts`, `scope-repair-resume.ts`, `command`, `OfficeScene.tsx`, `index.ts`, `Store`, `resume-provider-review.ts`, `coordination.ts`, `ticket-evidence.ts`, `Effects`, `work.ts`, `disposition-store.ts`, `admit-improvement.ts`, `harnessEffect`, `it-specialist.ts`, `offices.ts`, `record-push.ts`, `JiraIssuePublisher`, `daily-cto.ts`, `cec/issue-publication.ts`, `assignment-poll.ts`, `delivery-authority.ts`, `stopped-base-validation.ts`, `intent.ts`, `daily-cto.ts`, `lesson-selection.ts`, `learning-events.ts`, `Store`, `coordination.ts`, `time-readback.ts`, `it-specialist.ts`, `record-push.ts`, `config.ts`, `engine.ts`, `session-bridge.ts`, `retire-external-delivery.ts`, `continue-access-only-plan.ts`, `.constructor`, `ProjectProgress`, `qualify.ts`, `run-accounting.ts`, `evidence-artifacts.ts`, `pilot-delivery.ts`, `retire-history.ts`, `harnessEffect`, `run-evidence.ts`?**
  _High betweenness centrality (0.094) - this node is a cross-community bridge._
- **Should `rootArtifact` be split into smaller, more focused modules?**
  _Cohesion score 0.0546984572230014 - nodes in this community are weakly interconnected._
- **Why does `command()` connect `command` to `github-readiness.ts`, `Inspector.tsx`, `outbox.ts`, `App.tsx`, `authorize.ts`, `ref_node_path`, `agents.ts`, `github-delivery.ts`, `TimeBook.tsx`, `GitHubDelivery`, `.emit`, `sanitize`, `notifications.ts`, `run-accounting.ts`, `candidate.ts`, `Conversation.tsx`, `.save`, `OfficeScene.tsx`, `ticket-evidence.ts`, `Effects`, `work.ts`, `admit-improvement.ts`, `it-specialist.ts`, `record-push.ts`, `daily-cto.ts`, `cec/issue-publication.ts`, `assignment-poll.ts`, `stopped-base-validation.ts`, `intent.ts`, `lesson-selection.ts`, `Store`, `coordination.ts`, `time-readback.ts`, `it-specialist.ts`, `record-push.ts`, `engine.ts`, `session-bridge.ts`, `report.ts`, `continue-access-only-plan.ts`, `ProjectProgress`, `live-reach.ts`, `harnessEffect`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Should `github-readiness.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10048076923076923 - nodes in this community are weakly interconnected._
- **Why does `Coordinator` connect `daily-cto.ts` to `.constructor`, `assignment-poll.ts`, `App.tsx`, `Role`, `coordination.ts`, `index.ts`, `record-trigger.ts`, `session-bridge.ts`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Should `Inspector.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05910364145658263 - nodes in this community are weakly interconnected._
- **Should `agents.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09726775956284153 - nodes in this community are weakly interconnected._