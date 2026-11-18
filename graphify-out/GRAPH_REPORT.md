# Graph Report - the-office  (2026-11-18)

## Corpus Check
- 892 files · ~350,558 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4359 nodes · 20038 edges · 130 communities (122 shown, 8 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 683 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `cbc0cc4a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- retrospective-subject.ts
- OrgChart.tsx
- intent.ts
- Store
- Inspector.tsx
- ControlStore
- session-bridge.ts
- ref_react
- TicketJob
- github-delivery.ts
- prompts/conversations.ts
- run.ts
- App.tsx
- OfficeSnapshot
- knowledge/routes.ts
- scheduled-captures.ts
- run-retrospective.ts
- record-trigger.ts
- shortSummary
- holdReason
- workKey
- harnessEffect
- scheduled-features.ts
- jira-time.ts
- projects.ts
- maintenance/maintenance.ts
- cost-ledger.ts
- agents.ts
- office-lessons.ts
- ref_zod
- metadata-assessment.ts
- work-summary.ts
- project-bindings.ts
- closeout-recovery.ts
- it-specialist.ts
- cec/issue-publication.ts
- scheduled-work.ts
- Offices
- github/issue-publication.ts
- notifications.ts
- store.ts
- time-scope.ts
- TicketJob
- knowledge.ts
- features/workflow.ts
- harness-baseline.ts
- OfficeScene.tsx
- ProjectProgress
- engine.ts
- session-context-file.ts
- scheduler.ts
- shared.ts
- .emit
- ref_node_path
- maintenance/maintenance.ts
- index.tsx
- QuestionStepper.tsx
- .getEffect
- github/issue-publication.ts
- project-bindings-config.ts
- fact-bounds.ts
- blocker-followups.ts
- run.ts
- .getEffect
- MapView.tsx
- process.ts
- remove-candidate.ts
- coordination.ts
- features.ts
- ticket-evidence.ts
- constellation-runtime.ts
- resume-step.ts
- work.ts
- report.ts
- cli.ts
- cec/issue-publication.ts
- evidence-artifacts.ts
- owned-artifact.ts
- goal-evidence.ts
- cec-reads.ts
- jira-transport.ts
- digest
- create-candidate.ts
- features.ts
- merge-scanner-retry.ts
- accept-stage-result.ts
- FeatureWorkspace.tsx
- sanitize
- index.tsx
- contract.ts
- DailyCTO.tsx
- readable-jira-comment.ts
- merge-scanner-retry.ts
- assignment-poll.ts
- qa-plan-retry.ts
- capture-session-clone.py
- requests.ts
- checkpoint-completion.ts
- .save
- coordination.ts
- ticket-stage-runner.ts
- outbox.ts
- codex-rollout.ts
- worker-runtime.ts
- Coordinator
- extract-worker.mjs
- CommittedBrain
- ITFollowUps.tsx
- qa-comment.ts
- run-accounting.ts
- packed-consumer-pnpm.ts
- features/workflow.ts
- connectWith
- learning-maintenance.ts
- slack-supersession.ts
- interrupted-work-recovery.ts
- qa.ts
- qa-plan-continuation.ts
- writer-restart.ts
- candidate-child-context.ts
- admit-improvement.ts
- delivery-task.ts
- document.ts
- pre-push-boundary.ts
- leadership.ts
- delivery-ownership.ts
- install-service.mjs
- JiraOperations
- telemetry.ts
- highestStableAtLeast

## God Nodes (most connected - your core abstractions)
1. `Store` - 385 edges
2. `TicketJob` - 172 edges
3. `digest()` - 151 edges
4. `holdReason()` - 126 edges
5. `command()` - 124 edges
6. `GitHubDelivery` - 116 edges
7. `artifact()` - 114 edges
8. `workKey()` - 98 edges
9. `StageResult` - 89 edges
10. `currentAssignment()` - 88 edges

## Surprising Connections (you probably didn't know these)
- `apply()` --indirect_call--> `note()`  [INFERRED]
  src/conversations/OutboxSavedImplementation.tsx → server/cec/parking/resume-parked.ts
- `UnrecordedResult` --references--> `StageResult`  [EXTRACTED]
  server/cec/unrecorded-result.ts → src/shared.ts
- `LessonBrainOverlap` --references--> `Lesson`  [EXTRACTED]
  server/knowledge/lesson-brain-audit.ts → src/contracts/knowledge.ts
- `DeliverySlot` --references--> `Role`  [EXTRACTED]
  server/office/projects.ts → src/shared.ts
- `ScopeRow` --references--> `TimeEntry`  [EXTRACTED]
  server/time/time-scope.ts → src/shared.ts

## Import Cycles
- 2-file cycle: `server/scheduling/coordination-pump.ts -> server/scheduling/coordination.ts -> server/scheduling/coordination-pump.ts`
- 2-file cycle: `server/scheduling/coordination-tick.ts -> server/scheduling/coordination.ts -> server/scheduling/coordination-tick.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/track-adopted-review.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/stage-reconciliation.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/accept-stage-result.ts -> server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/accept-stage-result.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/publication/metadata-context.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/refresh-merge-review.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/closeout/github-closeout.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/implementation/saved-prerequisite-handoff.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/queue-repairs.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/knowledge/lesson-exits.ts -> server/scheduling/requests.ts -> server/knowledge/lesson-exits.ts`
- 2-file cycle: `server/conversations/conversations.ts -> server/conversations/cto-conversations.ts -> server/conversations/conversations.ts`
- 2-file cycle: `server/conversations/notifications.ts -> server/conversations/slack.ts -> server/conversations/notifications.ts`
- 2-file cycle: `src/contracts/people.ts -> src/shared.ts -> src/contracts/people.ts`
- 2-file cycle: `src/contracts/timing.ts -> src/shared.ts -> src/contracts/timing.ts`
- 2-file cycle: `src/contracts/work.ts -> src/shared.ts -> src/contracts/work.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-guard.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`

## Communities (130 total, 8 thin omitted)

### Community 0 - "retrospective-subject.ts"
Cohesion: 0.14
Nodes (18): deliveryMetrics(), median(), ARTIFACT_LIMIT, clip(), LEDGER_STEPS, MAINTENANCE_LIMIT, maintenanceFacts(), maintenanceSubject() (+10 more)

### Community 1 - "OrgChart.tsx"
Cohesion: 0.12
Nodes (39): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+31 more)

### Community 2 - "intent.ts"
Cohesion: 0.07
Nodes (43): nativeGitRead(), savedImplementation(), sha(), sourceCopyMatches(), sourceFiles(), ContinuationIO, nativeIO, absent() (+35 more)

### Community 3 - "Store"
Cohesion: 0.11
Nodes (23): featureItemComplete(), reconcileFeatureCompletion(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS, reserveReplacement(), stageBudget(), offerOrdinaryRelease() (+15 more)

### Community 4 - "Inspector.tsx"
Cohesion: 0.11
Nodes (64): Outbox(), blockedSummary(), ServiceHealthPanel(), followUp(), labels, ServiceHealthRow(), BlockerFollowups(), LessonsPanel() (+56 more)

### Community 5 - "ControlStore"
Cohesion: 0.08
Nodes (24): expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), DailyCTO, EvidenceRequestConflict (+16 more)

### Community 6 - "session-bridge.ts"
Cohesion: 0.05
Nodes (57): claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexDaemonProcesses(), accountCodexProcesses(), CodexProcessInventory, codexProcessInventory() (+49 more)

### Community 7 - "ref_react"
Cohesion: 0.12
Nodes (32): Activity(), ActivityTimeline(), AssignmentKnowledge(), Lookup(), BrainWorkspace(), DocumentPreview(), empty, EvidencePacket() (+24 more)

### Community 8 - "TicketJob"
Cohesion: 0.08
Nodes (29): harnessCloseout(), PASSING, verifyMergeActions(), HarnessControl, withHarnessWork(), runHarnessStage(), harnessStageResult(), receipt() (+21 more)

### Community 9 - "github-delivery.ts"
Cohesion: 0.06
Nodes (86): writerRestartInstruction(), findingsBlock(), BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction(), dependabotReviewGuidance(), pinCourier (+78 more)

### Community 10 - "prompts/conversations.ts"
Cohesion: 0.08
Nodes (21): cecChatPrompt(), ctoChatPrompt(), itChatPrompt(), slackSendPrompt(), slackVerifyPrompt(), PICKUP_CHAT, PickupSchema, canFileGithubIssue() (+13 more)

### Community 11 - "run.ts"
Cohesion: 0.19
Nodes (14): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, OFFICE_FIX_PROMPT, OfficeFixResult, validateOfficeFix(), investigationReady(), InvestigationOptions, InvestigationReport (+6 more)

### Community 12 - "App.tsx"
Cohesion: 0.06
Nodes (45): BrainDrawer(), blank(), Goals(), resetDraft(), save(), themeColor, App(), BrainWorkspace (+37 more)

### Community 13 - "OfficeSnapshot"
Cohesion: 0.04
Nodes (78): knowledgeOutbox(), DailyCTOSummary, Conversation(), SendMessage, LessonDecisionAction, lessonDecisionState(), readLessonDecision(), DAYS (+70 more)

### Community 14 - "knowledge/routes.ts"
Cohesion: 0.06
Nodes (42): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, GraphNode (+34 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.12
Nodes (50): createFeature(), assertEnrollable(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), CaptureRequest, captureRequest(), captureRequests() (+42 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.10
Nodes (40): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, BlockingTrigger, blockingTrigger(), isBlocking() (+32 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.13
Nodes (32): clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates(), maintenanceCompletedId(), visibleMaintenanceTriggerIds(), clip(), JobLike (+24 more)

### Community 18 - "shortSummary"
Cohesion: 0.08
Nodes (43): TelemetryReport, LiveAnchor, displayAgentTask(), LiveAgentTask(), Props, RunningTask(), text(), Agent (+35 more)

### Community 19 - "holdReason"
Cohesion: 0.07
Nodes (70): deliveryIntakeBlocker(), partialLocalCleanupCandidate(), candidateInput(), children, oldAdoptionBasis(), SavedCandidateAdmission, savedCandidateAdmission(), assertPostConflictFiles() (+62 more)

### Community 20 - "workKey"
Cohesion: 0.17
Nodes (19): nextAttemptAt(), restartStoppedWriters(), unchangedSinceAccepted(), NOT_RETRYABLE, WRITER_STAGES, WriterRestartCandidate, writerRestartCandidate(), writerRestarted() (+11 more)

### Community 21 - "harnessEffect"
Cohesion: 0.25
Nodes (22): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), ProjectCard, projectCards(), projectGraphql() (+14 more)

### Community 22 - "scheduled-features.ts"
Cohesion: 0.15
Nodes (32): dependencyEligibility(), commandFeature(), currentApproval(), automaticIntakeWait(), confirmBrief(), classifyFeatureFailure(), automaticEnabled(), automaticFeature() (+24 more)

### Community 23 - "jira-time.ts"
Cohesion: 0.08
Nodes (53): attempted(), attemptState(), bound(), covers(), JiraAttempt, jiraAttempts(), JiraAttemptState, open() (+45 more)

### Community 24 - "projects.ts"
Cohesion: 0.04
Nodes (61): implementationPreview(), implementationContinuationRoute(), closedReadonlyPlan(), Document, document(), entryExists(), inspectClosedQAPlan(), qaPlanRetryRoute() (+53 more)

### Community 25 - "maintenance/maintenance.ts"
Cohesion: 0.08
Nodes (34): ApproachSchema, maintenancePolicies(), captureLearning(), recordLearningOpportunity(), captureMaintenanceStep(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult (+26 more)

### Community 26 - "cost-ledger.ts"
Cohesion: 0.20
Nodes (21): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress(), effectId() (+13 more)

### Community 27 - "agents.ts"
Cohesion: 0.05
Nodes (68): implementationWorkerContext(), cecPrompt(), resolvedDecisionNote(), stageInstructions, stageInstructionsFor(), capacityInterruptedRun(), providerSaid(), applies() (+60 more)

### Community 28 - "office-lessons.ts"
Cohesion: 0.07
Nodes (33): BRAIN_SCOPE, SUBJECT, Kind, RetrospectiveResult, RetrospectiveResultSchema, RollupResultSchema, Stage, CONSOLIDATED (+25 more)

### Community 29 - "ref_zod"
Cohesion: 0.05
Nodes (69): AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), goalEvidencePath(), azureSchema, deploymentSchema, jiraSchema, ownJiraSchema, promptSchema (+61 more)

### Community 30 - "metadata-assessment.ts"
Cohesion: 0.12
Nodes (48): activeEffectId(), retryRead(), admitPRMetadata(), assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema, savedMetadataAssessment() (+40 more)

### Community 31 - "work-summary.ts"
Cohesion: 0.18
Nodes (20): deliveryRepairProjection(), ACTIVE, maintenanceUpdate(), PMQueueItem, pmQueueItems(), prerequisiteKeys(), projectRows(), deliveryChanges() (+12 more)

### Community 32 - "project-bindings.ts"
Cohesion: 0.17
Nodes (21): az(), AzureMonitor, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs(), fullActivePRs() (+13 more)

### Community 33 - "closeout-recovery.ts"
Cohesion: 0.11
Nodes (42): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+34 more)

### Community 34 - "it-specialist.ts"
Cohesion: 0.16
Nodes (17): partialLocalCleanupKey(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), ITContext, diagnosticSnapshot(), informationalRecovery() (+9 more)

### Community 35 - "cec/issue-publication.ts"
Cohesion: 0.26
Nodes (3): JiraIssuePublisher, publicationDescription(), jiraBinding()

### Community 36 - "scheduled-work.ts"
Cohesion: 0.10
Nodes (35): freshOwnershipRead(), deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), withAmendmentOwnership(), metadataRequestResolved(), preparationRequestResolved(), gateFeatureWork() (+27 more)

### Community 37 - "Offices"
Cohesion: 0.16
Nodes (4): QuestionNotifications, projectById(), Offices, markCaptureStart()

### Community 38 - "github/issue-publication.ts"
Cohesion: 0.15
Nodes (25): Execute, adoptDependabot(), closesIssue(), linkPR(), DEPENDABOT, dependabotPR(), openDependabotPulls(), readRepo() (+17 more)

### Community 39 - "notifications.ts"
Cohesion: 0.13
Nodes (22): lessonIssueBody(), lessonIssueMarker(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), lessonText() (+14 more)

### Community 40 - "store.ts"
Cohesion: 0.12
Nodes (23): Clock, systemClock, ProjectPolicy, checkpointLabel(), applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration (+15 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.13
Nodes (30): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence(), CaptureContext (+22 more)

### Community 42 - "TicketJob"
Cohesion: 0.10
Nodes (42): removeAdoptedClone(), namedRepairIds(), requireDeliveryAuthority(), assertDeliveryMayMutate(), harnessDelivers(), legacyRecovery(), pinCourierIdentityRefusal(), pinCourierVerifiedCommit() (+34 more)

### Community 43 - "knowledge.ts"
Cohesion: 0.19
Nodes (16): clip(), DEMAND_LIMIT, demandFacts(), DemandSection, key(), LessonKey, notes(), clip() (+8 more)

### Community 44 - "features/workflow.ts"
Cohesion: 0.08
Nodes (51): approveFeature(), mutation(), reviewQuestions(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), artifactPath(), digest() (+43 more)

### Community 45 - "harness-baseline.ts"
Cohesion: 0.15
Nodes (22): BaselineReport, baselineReport(), BaselineSource, baselineText(), millions(), row(), share(), add() (+14 more)

### Community 46 - "OfficeScene.tsx"
Cohesion: 0.17
Nodes (33): withoutElapsed(), Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk() (+25 more)

### Community 48 - "engine.ts"
Cohesion: 0.07
Nodes (15): correlatedBuild(), applyIntakeObservation(), checkMail(), drainMail(), requestMail(), enableNightly(), ingest(), drainMaintenance() (+7 more)

### Community 49 - "session-context-file.ts"
Cohesion: 0.20
Nodes (14): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+6 more)

### Community 50 - "scheduler.ts"
Cohesion: 0.16
Nodes (14): ROLES, OfficeCapacity, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch() (+6 more)

### Community 51 - "shared.ts"
Cohesion: 0.11
Nodes (19): PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, acceptPreferences(), PreferenceCandidate, PreferenceState (+11 more)

### Community 52 - ".emit"
Cohesion: 0.14
Nodes (27): decideImplementation(), requestQAPlanRetry(), configureChannelNotices(), configureNotices(), retryRecipientLookup(), recoverCTOInput(), enqueueMetadataRecovery(), normalizeStatement() (+19 more)

### Community 53 - "ref_node_path"
Cohesion: 0.08
Nodes (38): GitRead, patchArgs, interruptedImplementation(), continueUnsealedQA(), entry(), qaPlanEvidenceGap(), qaRunDirectory(), MISSING_SAVED_PLAN (+30 more)

### Community 54 - "maintenance/maintenance.ts"
Cohesion: 0.54
Nodes (6): Document, document(), isAccessOnlyPlan(), settledAccessOnlyState(), continueAccessOnlyPlan(), entryExists()

### Community 55 - "index.tsx"
Cohesion: 0.22
Nodes (15): learningMetrics(), RollupResult, harperFolder(), RETROSPECTIVE_TIMEOUT, retryDelay(), lastFriday(), ROLLUP_HISTORY, rollupDue() (+7 more)

### Community 56 - "QuestionStepper.tsx"
Cohesion: 0.19
Nodes (18): FeatureQuestionProjection, OutboxQuestionRound(), send(), draftKey(), readDraft(), saveDraft(), QuestionRound(), nextQuestion() (+10 more)

### Community 57 - ".getEffect"
Cohesion: 0.10
Nodes (24): channelNoticeAuthorized(), ChannelSettings, notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR, plainSlackText() (+16 more)

### Community 58 - "github/issue-publication.ts"
Cohesion: 0.16
Nodes (10): FeaturePublisher, PublicationReceipt, Assign, Board, Content, GitHubIssuePublisher, number(), same() (+2 more)

### Community 59 - "project-bindings-config.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 60 - "fact-bounds.ts"
Cohesion: 0.19
Nodes (18): leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance() (+10 more)

### Community 61 - "blocker-followups.ts"
Cohesion: 0.29
Nodes (8): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), admitReadyCards(), settleStoppedReviews(), resumeParked(), poll(), readAssignments()

### Community 62 - "run.ts"
Cohesion: 0.22
Nodes (7): CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility, overlayEntranceDelays(), SceneOverlay()

### Community 63 - ".getEffect"
Cohesion: 0.14
Nodes (18): Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership, rawHash() (+10 more)

### Community 64 - "MapView.tsx"
Cohesion: 0.16
Nodes (24): KnowledgeActivity, KnowledgeEdge, KnowledgeMap, KnowledgeNode, connectionSummary(), Constellation(), ConstellationView, DisplayNode (+16 more)

### Community 65 - "process.ts"
Cohesion: 0.14
Nodes (14): Execute, Result, boardItem(), Graphql, numberField(), syncing, TimeLedger, Readback (+6 more)

### Community 66 - "remove-candidate.ts"
Cohesion: 0.18
Nodes (18): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot() (+10 more)

### Community 67 - "coordination.ts"
Cohesion: 0.16
Nodes (27): candidateBranchMoved(), continueImplementation(), dispatchNightly(), drainDelivery(), requestDelivery(), startPilot(), OfficeQAHandoffInput, eligibility() (+19 more)

### Community 68 - "features.ts"
Cohesion: 0.11
Nodes (23): FeaturePlanningConfig, FeatureApproval, FeatureAttempt, FeatureAuthority, FeatureDocument, FeatureHandoff, FeatureHarnessOption, FeatureOption (+15 more)

### Community 69 - "ticket-evidence.ts"
Cohesion: 0.14
Nodes (22): twgConnection(), assetDownloader(), attachmentKind(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS, EvidenceAttachment (+14 more)

### Community 70 - "constellation-runtime.ts"
Cohesion: 0.09
Nodes (21): CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point, ConstellationRuntime, createConstellation() (+13 more)

### Community 71 - "resume-step.ts"
Cohesion: 0.15
Nodes (17): cecReconcilePrompt(), rerunsInterruptedQA(), Attempt, needsResumeReconciliation(), REVIEW_STAGES, stoppedInSetup(), decidedResumeStep(), RESUME_STEP (+9 more)

### Community 72 - "work.ts"
Cohesion: 0.12
Nodes (20): BLOCKED_CAUSES, blockedCauses(), projectReadiness(), explanation(), LABELS, stoppedReason(), ProjectReadiness, AssignmentResult (+12 more)

### Community 73 - "report.ts"
Cohesion: 0.29
Nodes (12): Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked(), row() (+4 more)

### Community 74 - "cli.ts"
Cohesion: 0.18
Nodes (8): args, [cmd,...rawArgs], commands, key, projectIndex, LessonBrainAudit, lessonBrainAudit(), LessonBrainOverlap

### Community 75 - "cec/issue-publication.ts"
Cohesion: 0.21
Nodes (12): Assignment, contentSchema(), jiraText(), Transition, jiraRecord(), unpack(), descriptionPreimage(), plain() (+4 more)

### Community 76 - "evidence-artifacts.ts"
Cohesion: 0.31
Nodes (11): evidenceDirectory(), readEvidence(), ProviderEvidence, canonical(), evidenceDigest(), evidenceHash(), semantic(), stableUrl() (+3 more)

### Community 77 - "owned-artifact.ts"
Cohesion: 0.24
Nodes (13): investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_SOURCE_PATHS, officeSource(), done(), readBoundedNoFollow() (+5 more)

### Community 78 - "goal-evidence.ts"
Cohesion: 0.17
Nodes (13): GitHubMonitor, githubPRDescription(), azureGoalFacts(), azurePRDescription(), boundedEvidence(), collectAzureGoalDocuments(), EvidenceStore, GOAL_EVIDENCE_LIMITS (+5 more)

### Community 79 - "cec-reads.ts"
Cohesion: 0.19
Nodes (15): escaped(), IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), intakeMembership(), projectListScope(), cecIntakePrompt() (+7 more)

### Community 80 - "jira-transport.ts"
Cohesion: 0.31
Nodes (10): document(), transitionWithComment(), jiraAccount(), JiraCredential, KEYCHAIN_SERVICE, jiraRest(), quoted(), Execute (+2 more)

### Community 81 - "digest"
Cohesion: 0.06
Nodes (93): ownershipReadHistory(), containedFile(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash (+85 more)

### Community 82 - "create-candidate.ts"
Cohesion: 0.36
Nodes (8): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), installDependencies(), major()

### Community 83 - "features.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 84 - "merge-scanner-retry.ts"
Cohesion: 0.15
Nodes (22): HarnessEffect, harnessEffect(), readBackOrThrow(), linkedBody(), DependabotPR, ensureTrackingIssue(), findTrackingIssue(), ownTracking() (+14 more)

### Community 85 - "accept-stage-result.ts"
Cohesion: 0.09
Nodes (46): handsOff(), DECISION_KINDS, needsDecision(), park(), acceptStageResult(), acceptConflictRepair(), recordJobApproach(), deliveryNextStage() (+38 more)

### Community 86 - "FeatureWorkspace.tsx"
Cohesion: 0.25
Nodes (10): FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures(), FileText, field (+2 more)

### Community 87 - "sanitize"
Cohesion: 0.07
Nodes (40): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+32 more)

### Community 88 - "index.tsx"
Cohesion: 0.12
Nodes (41): LearningCoverage(), when(), LessonsView(), SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm() (+33 more)

### Community 89 - "contract.ts"
Cohesion: 0.24
Nodes (12): At, Errno, errno(), GroupInventory, GroupProbe, LifecycleDiagnostic, Phase, Pid (+4 more)

### Community 90 - "DailyCTO.tsx"
Cohesion: 0.19
Nodes (14): GoalProgress, CTOReview(), goalState, DailyCTO(), reportDate(), reviewStatus, GoalList(), card() (+6 more)

### Community 91 - "readable-jira-comment.ts"
Cohesion: 0.23
Nodes (16): CommentPage, commentReadback(), postDevUpdate(), commentPayload(), JiraCommentIntent, postReadableComment(), Recorded, recordedWords() (+8 more)

### Community 92 - "merge-scanner-retry.ts"
Cohesion: 0.40
Nodes (9): officeMergeProvenance(), reconcileMergeScannerRetry(), Retry, retryMergeScanner(), retryReadBack(), runIdentity(), savedRetry(), transientScannerJobs() (+1 more)

### Community 93 - "assignment-poll.ts"
Cohesion: 0.22
Nodes (15): acceptedCompletionResolution(), investigationCandidates(), investigationId(), ctoReplacementResolution(), finishedSubjectResolution(), investigationFollowUps(), implementationReplacementResolution(), interruptedQARerunResolution() (+7 more)

### Community 94 - "qa-plan-retry.ts"
Cohesion: 0.67
Nodes (3): QAPlanRetry, QAPlanRetryProof, QAPlanRetryRequest

### Community 96 - "requests.ts"
Cohesion: 0.09
Nodes (47): deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, gateRegisteredDelivery(), accounting, DeliverySubject, nonDelivery (+39 more)

### Community 97 - "checkpoint-completion.ts"
Cohesion: 0.18
Nodes (10): BrainStatusSchema, identity, brainCheckpointCompletion(), coverageSchema, verified, PublishedPR, publishedWorkCleanedUp(), nativeChecks (+2 more)

### Community 98 - ".save"
Cohesion: 0.16
Nodes (32): resolveBlockedTransition(), jiraCollection(), jiraCredential(), findComment(), LiveIssue, readIssue(), readIssues(), jira() (+24 more)

### Community 99 - "coordination.ts"
Cohesion: 0.08
Nodes (39): reconcileNoticeConfirmations(), ATTEMPT_DELAYS_MS, IntakeContext, compatible(), dependencyCompletionKey(), DependencyStores, issueKey(), observePrerequisites() (+31 more)

### Community 100 - "ticket-stage-runner.ts"
Cohesion: 0.14
Nodes (31): resume(), confirmSetupStopCap(), consecutiveSetupStops(), isSetupStop(), SETUP_STOP_CAP, setupStop(), recoverSavedPlan(), ownReceipts() (+23 more)

### Community 101 - "outbox.ts"
Cohesion: 0.12
Nodes (27): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), ctoInputIdentityMatches(), ctoInputRecovered(), ADOPTION_STALLED_MS, conversationResolved(), projectOutbox() (+19 more)

### Community 102 - "codex-rollout.ts"
Cohesion: 0.29
Nodes (9): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO (+1 more)

### Community 103 - "worker-runtime.ts"
Cohesion: 0.06
Nodes (45): candidateWorkspaceEnvironment(), assignmentSubject(), catalogLine(), assertBriefingScope(), clearUnblockBrief(), key(), saveUnblockBrief(), UnblockBrief (+37 more)

### Community 104 - "Coordinator"
Cohesion: 0.08
Nodes (4): SettleInputs, coordination(), Coordinator, AssignedIssue

### Community 105 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 107 - "ITFollowUps.tsx"
Cohesion: 0.26
Nodes (8): itAgent(), itDiagnostics(), itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps(), currentServices(), ITState

### Community 108 - "qa-comment.ts"
Cohesion: 0.26
Nodes (9): devUpdate(), HEADLINE, parksInJira(), OUTCOME, qaComment(), remote(), STAGE, plainWords() (+1 more)

### Community 109 - "run-accounting.ts"
Cohesion: 0.10
Nodes (32): helperTelemetry(), dispatchExposure(), BoundedRead, EvidenceOutcome, backfillClaudeCost(), CompletionReader, codexHome(), createdAt() (+24 more)

### Community 111 - "features/workflow.ts"
Cohesion: 0.14
Nodes (13): featureById(), discoveryPrompt(), planPrompt(), GitHubFeaturePublisher, JiraFeaturePublisher, publishFeature(), beginReader(), reconcilePublication() (+5 more)

### Community 112 - "connectWith"
Cohesion: 0.33
Nodes (6): twgProfile(), connectWith(), data(), envelope(), JiraWorklogs, WorklogSave

### Community 113 - "learning-maintenance.ts"
Cohesion: 0.22
Nodes (13): distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementIntakeGate(), learningDigest(), expireLearningPackets(), LEARNING_BASELINES (+5 more)

### Community 114 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 115 - "interrupted-work-recovery.ts"
Cohesion: 0.36
Nodes (7): interruptAdoptions(), legacy(), REMOVED_FIELDS, retireLegacyRecovery(), goalNoticeNeverDispatched(), maintenanceNoticeNeverDispatched(), recover()

### Community 119 - "candidate-child-context.ts"
Cohesion: 0.38
Nodes (8): adoptCandidate(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat()

### Community 120 - "admit-improvement.ts"
Cohesion: 0.38
Nodes (6): improvementManifest(), improvementMarker(), improvementProvider(), linkedRepairGap(), FeatureManifest, KnowledgeImprovement

### Community 121 - "delivery-task.ts"
Cohesion: 0.33
Nodes (7): APPROACH_GUIDANCE, reviewInstructions(), deliveryTask(), DeliveryTaskInput, DISCOVERY_GUIDANCE, compactSteps(), featureDeliveryContext()

### Community 122 - "document.ts"
Cohesion: 0.38
Nodes (4): guidanceExcerpt(), DocumentMetadata, documentText(), KnowledgeDocumentText

### Community 123 - "pre-push-boundary.ts"
Cohesion: 0.43
Nodes (5): Event, one(), prePushRejection(), PushIdentity, settledPushBoundary()

### Community 124 - "leadership.ts"
Cohesion: 0.29
Nodes (6): DailyCTOBriefing, DailyCTOResult, DailyGoalUpdate, GoalEvidenceRef, GoalEvidenceRequest, GoalStatus

### Community 125 - "delivery-ownership.ts"
Cohesion: 0.33
Nodes (4): Ownership, ownershipContext, refreshDeliveryOwnership(), RefreshOwnership

### Community 126 - "install-service.mjs"
Cohesion: 0.14
Nodes (10): file, folder, logs, root, Read, GIT_NETWORK, LIVE_PROVIDERS, liveReach() (+2 more)

### Community 128 - "telemetry.ts"
Cohesion: 0.09
Nodes (28): CodexRollout, CacheWriteDuration, CODEX_ROWS, ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL, Rates (+20 more)

### Community 132 - "highestStableAtLeast"
Cohesion: 0.83
Nodes (3): compare(), highestStableAtLeast(), parts()

## Knowledge Gaps
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `retrospective-subject.ts`, `intent.ts`, `ControlStore`, `session-bridge.ts`, `TicketJob`, `github-delivery.ts`, `prompts/conversations.ts`, `run.ts`, `OfficeSnapshot`, `knowledge/routes.ts`, `scheduled-captures.ts`, `run-retrospective.ts`, `record-trigger.ts`, `shortSummary`, `holdReason`, `workKey`, `harnessEffect`, `scheduled-features.ts`, `jira-time.ts`, `projects.ts`, `maintenance/maintenance.ts`, `cost-ledger.ts`, `agents.ts`, `metadata-assessment.ts`, `project-bindings.ts`, `closeout-recovery.ts`, `it-specialist.ts`, `cec/issue-publication.ts`, `scheduled-work.ts`, `Offices`, `github/issue-publication.ts`, `notifications.ts`, `store.ts`, `time-scope.ts`, `TicketJob`, `knowledge.ts`, `features/workflow.ts`, `ProjectProgress`, `engine.ts`, `scheduler.ts`, `.emit`, `ref_node_path`, `maintenance/maintenance.ts`, `index.tsx`, `.getEffect`, `github/issue-publication.ts`, `fact-bounds.ts`, `blocker-followups.ts`, `.getEffect`, `process.ts`, `remove-candidate.ts`, `coordination.ts`, `ticket-evidence.ts`, `resume-step.ts`, `cec/issue-publication.ts`, `evidence-artifacts.ts`, `owned-artifact.ts`, `goal-evidence.ts`, `cec-reads.ts`, `digest`, `create-candidate.ts`, `merge-scanner-retry.ts`, `accept-stage-result.ts`, `sanitize`, `readable-jira-comment.ts`, `assignment-poll.ts`, `requests.ts`, `checkpoint-completion.ts`, `.save`, `coordination.ts`, `ticket-stage-runner.ts`, `outbox.ts`, `worker-runtime.ts`, `Coordinator`, `ITFollowUps.tsx`, `run-accounting.ts`, `features/workflow.ts`, `learning-maintenance.ts`, `interrupted-work-recovery.ts`, `candidate-child-context.ts`, `admit-improvement.ts`, `delivery-task.ts`, `JiraOperations`?**
  _High betweenness centrality (0.099) - this node is a cross-community bridge._
- **Should `retrospective-subject.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13768115942028986 - nodes in this community are weakly interconnected._
- **Why does `sceneColors()` connect `OfficeScene.tsx` to `session-context-file.ts`, `constellation-runtime.ts`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Should `OrgChart.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11613475177304965 - nodes in this community are weakly interconnected._
- **Why does `command()` connect `process.ts` to `intent.ts`, `ControlStore`, `session-bridge.ts`, `TicketJob`, `github-delivery.ts`, `prompts/conversations.ts`, `knowledge/routes.ts`, `workKey`, `harnessEffect`, `jira-time.ts`, `projects.ts`, `maintenance/maintenance.ts`, `cost-ledger.ts`, `agents.ts`, `metadata-assessment.ts`, `project-bindings.ts`, `closeout-recovery.ts`, `cec/issue-publication.ts`, `notifications.ts`, `TicketJob`, `features/workflow.ts`, `ProjectProgress`, `engine.ts`, `ref_node_path`, `maintenance/maintenance.ts`, `.getEffect`, `github/issue-publication.ts`, `.getEffect`, `remove-candidate.ts`, `coordination.ts`, `ticket-evidence.ts`, `cec/issue-publication.ts`, `goal-evidence.ts`, `jira-transport.ts`, `digest`, `create-candidate.ts`, `features.ts`, `merge-scanner-retry.ts`, `accept-stage-result.ts`, `contract.ts`, `readable-jira-comment.ts`, `requests.ts`, `checkpoint-completion.ts`, `coordination.ts`, `ticket-stage-runner.ts`, `worker-runtime.ts`, `Coordinator`, `features/workflow.ts`, `connectWith`, `admit-improvement.ts`, `install-service.mjs`, `JiraOperations`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Should `intent.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07188778492109878 - nodes in this community are weakly interconnected._
- **Should `Store` be split into smaller, more focused modules?**
  _Cohesion score 0.10782241014799154 - nodes in this community are weakly interconnected._