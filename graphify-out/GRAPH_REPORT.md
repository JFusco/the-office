# Graph Report - the-office  (2026-11-16)

## Corpus Check
- 840 files · ~332,537 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4104 nodes · 18879 edges · 118 communities (115 shown, 3 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 608 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7c563186`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- index.tsx
- Role
- project-graphql.ts
- review-run.ts
- Inspector.tsx
- completedExecution
- session-bridge.ts
- MapView.tsx
- accept-stage-result.ts
- Store
- agents.ts
- github-delivery.ts
- App.tsx
- features/workflow.ts
- reader.ts
- scheduled-captures.ts
- run-retrospective.ts
- record-trigger.ts
- assignment-poll.ts
- requests.ts
- features/commands.ts
- github-check-selection.ts
- QuestionStepper.tsx
- dependencies.ts
- office-lessons.ts
- maintenance/maintenance.ts
- cost-ledger.ts
- workKey
- jira-operations.ts
- jira-time.ts
- metadata-assessment.ts
- owned-artifact.ts
- sanitize
- Goals.tsx
- azure.ts
- harnessDelivers
- scheduled-work.ts
- scheduler.ts
- continuation-evidence.ts
- fact-bounds.ts
- publish-pr.ts
- time-scope.ts
- atmosphere.ts
- run-accounting.ts
- intent.ts
- Coordinator
- OfficeScene.tsx
- Engine
- dependency-bots/adopt.ts
- assignments.ts
- .emit
- scene-motion.ts
- validate-stage.ts
- codex-rollout.ts
- work.ts
- knowledge.ts
- shared.ts
- TimeBook.tsx
- RoomCamera.tsx
- control-store.ts
- retrospective-subject.ts
- ledger.ts
- notifications.ts
- delivery-repairs.ts
- ticket-evidence.ts
- harness-baseline.ts
- Ticket
- ControlStore
- digest
- JiraIssuePublisher
- constellation-runtime.ts
- process.ts
- tracking-issue.ts
- report.ts
- it-specialist.ts
- admit-improvement.ts
- admission.ts
- goal-reviews.ts
- github/issue-publication.ts
- telemetry.ts
- cli.ts
- lesson-selection.ts
- ref_node_path
- Effects
- outbox.ts
- brain-maintenance.ts
- delivery-recoveries.ts
- index.ts
- daily-cto.ts
- .verifyPR
- cec/workflow.ts
- MaintenanceRun
- TicketJob
- install-service.mjs
- features.ts
- capture-session-clone.py
- preferences-store.ts
- OfficeSnapshot
- .save
- artifact
- useOfficePreferences.ts
- local-config.ts
- time-readback.ts
- agent-activity.ts
- store.ts
- extract-worker.mjs
- coordination.ts
- blocker-followups.ts
- office/readiness.ts
- continue-access-only-plan.ts
- pilot-delivery.ts
- handover-cms.ts
- CommandRegistry
- delivery-ownership.ts
- wiki-sync.ts
- stop-reason.ts
- lesson-exits.ts
- packed-consumer-pnpm.ts

## God Nodes (most connected - your core abstractions)
1. `Store` - 368 edges
2. `TicketJob` - 172 edges
3. `digest()` - 150 edges
4. `command()` - 117 edges
5. `GitHubDelivery` - 116 edges
6. `artifact()` - 114 edges
7. `workKey()` - 96 edges
8. `OfficeSnapshot` - 88 edges
9. `currentAssignment()` - 88 edges
10. `cx()` - 88 edges

## Surprising Connections (you probably didn't know these)
- `DeliveryAuthorityInput` --references--> `HarnessRequest`  [EXTRACTED]
  server/delivery/harness/delivery-authority.ts → src/contracts/work.ts
- `apply()` --indirect_call--> `note()`  [INFERRED]
  src/conversations/OutboxSavedImplementation.tsx → server/cec/parking/resume-parked.ts
- `cecChatPrompt()` --calls--> `timeReport()`  [EXTRACTED]
  server/conversations/prompts/conversations.ts → src/timing/timing.ts
- `StageContext` --references--> `Role`  [EXTRACTED]
  server/delivery/pipeline/accept-stage-result.ts → src/shared.ts
- `MaintenanceSubjectFacts` --references--> `Role`  [EXTRACTED]
  server/knowledge/maintenance-subject.ts → src/shared.ts

## Import Cycles
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/review-wait.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/parking/resume-provider-review.ts -> server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/parking/resume-provider-review.ts`
- 3-file cycle: `server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts`
- 4-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/readiness/review-wait.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 4-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 4-file cycle: `server/delivery/recovery/implementation/activation-recovery.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/implementation/activation-recovery.ts`
- 4-file cycle: `server/delivery/recovery/implementation/saved-prerequisite-handoff.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/implementation/saved-prerequisite-handoff.ts`
- 4-file cycle: `server/delivery/recovery/stopped-base-review.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/stopped-base-review.ts`
- 4-file cycle: `server/delivery/recovery/validation/validation-readback.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/validation/validation-readback.ts`
- 4-file cycle: `server/features/delivery-binding.ts -> server/features/enrollment-gate.ts -> server/features/progression/failure.ts -> server/store/effects.ts -> server/features/delivery-binding.ts`
- 5-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/stage-reconciliation.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 5-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 5-file cycle: `server/delivery/recovery/implementation/saved-prerequisite-handoff.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/recovery/implementation/saved-prerequisite-handoff.ts`
- 5-file cycle: `server/delivery/recovery/implementation/continuation-evidence.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/recovery/implementation/continuation-evidence.ts`
- 5-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/scope-repair/scope-repair-resume.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 5-file cycle: `server/delivery/recovery/scope-repair/scope-repair-readback.ts -> server/delivery/recovery/scope-repair/scope-repair-resume.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/scope-repair/scope-repair-readback.ts`
- 5-file cycle: `server/delivery/recovery/implementation/continuation-evidence.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/implementation/implementation-recovery.ts -> server/delivery/recovery/implementation/continuation-evidence.ts`
- 5-file cycle: `server/delivery/recovery/implementation/continuation-evidence.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/preparation/post-conflict-preparation.ts -> server/delivery/recovery/implementation/continuation-evidence.ts`

## Communities (118 total, 3 thin omitted)

### Community 0 - "index.tsx"
Cohesion: 0.11
Nodes (46): ref_react, SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState (+38 more)

### Community 1 - "Role"
Cohesion: 0.10
Nodes (42): DeliverySlot, Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona (+34 more)

### Community 2 - "project-graphql.ts"
Cohesion: 0.18
Nodes (21): cardStatus(), Execute, ProjectCard, projectCards(), projectGraphql(), statusField, adoptDependabot(), DEPENDABOT (+13 more)

### Community 3 - "review-run.ts"
Cohesion: 0.12
Nodes (32): featureItemComplete(), reconcileFeatureCompletion(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS, requestReplan(), reserveReplacement(), stageBudget() (+24 more)

### Community 4 - "Inspector.tsx"
Cohesion: 0.09
Nodes (70): TicketPlanningAction(), blockedSummary(), itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps(), ServiceHealthPanel(), followUp() (+62 more)

### Community 5 - "completedExecution"
Cohesion: 0.08
Nodes (50): writerRestartPending(), pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), Ownership, closeoutRequestResolved(), preparationRequestResolved(), assertStoppedBaseAudit(), AuditRow (+42 more)

### Community 6 - "session-bridge.ts"
Cohesion: 0.06
Nodes (53): ref_node_perf_hooks, ref_ws, claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexDaemonProcesses(), accountCodexProcesses() (+45 more)

### Community 7 - "MapView.tsx"
Cohesion: 0.07
Nodes (64): ref_motion, ref_react_markdown, ref_remark_gfm, ref_yaml, KnowledgeActivity, KnowledgeEdge, KnowledgeMap, KnowledgeNode (+56 more)

### Community 8 - "accept-stage-result.ts"
Cohesion: 0.10
Nodes (50): acceptStageResult(), linkDraftIssue(), readPublication(), mergeAuthorized(), continuationNativeReview(), continuationReviewArtifacts(), continuationWorkerProof(), negativeWorker() (+42 more)

### Community 9 - "Store"
Cohesion: 0.07
Nodes (19): Assignment, Content, jiraText(), Transition, descriptionPreimage(), plain(), GitHubFeaturePublisher, helperTelemetry() (+11 more)

### Community 10 - "agents.ts"
Cohesion: 0.05
Nodes (63): ref_zod, savedStageCompletion(), ctoChatPrompt(), slackSendPrompt(), slackVerifyPrompt(), SlackResultSchema, SlackVerificationSchema, candidateWorkspaceEnvironment() (+55 more)

### Community 11 - "github-delivery.ts"
Cohesion: 0.08
Nodes (45): findingsBlock(), BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction(), discover(), refreshDependencies(), routeExisting() (+37 more)

### Community 12 - "App.tsx"
Cohesion: 0.06
Nodes (54): ref_lucide_react, ref_react_dom, BrainDrawer(), themeColor, App(), BrainWorkspace, CONNECTION, CONNECTION_DOT (+46 more)

### Community 13 - "features/workflow.ts"
Cohesion: 0.08
Nodes (53): approveFeature(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), discoveryPrompt(), planPrompt(), artifactPath() (+45 more)

### Community 14 - "reader.ts"
Cohesion: 0.11
Nodes (19): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), BrainGraph, BrainNote, BrainReader, CommittedBrain, GraphNode (+11 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.15
Nodes (44): createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest, captureRequests() (+36 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.10
Nodes (38): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, blockingTrigger, brainOverlap, brainOverlapQuery() (+30 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.10
Nodes (42): isBlocking(), baselineLearning(), LEARNING_BASELINES, maintainLearning(), configureKnowledge(), busyMaintenanceIds(), clip(), maintenanceBlockedId() (+34 more)

### Community 18 - "assignment-poll.ts"
Cohesion: 0.35
Nodes (7): noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), syncOutbox(), admitReadyCards(), poll(), readAssignments()

### Community 19 - "requests.ts"
Cohesion: 0.08
Nodes (58): reconcileBoardPreflight(), assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), reconcileCompletedConflictDraft(), routeReadyPostConflictPublication() (+50 more)

### Community 20 - "features/commands.ts"
Cohesion: 0.17
Nodes (21): commandFeature(), featureById(), reviewQuestions(), applyHarnessAction(), HarnessActionInput, recoveryPreconditions(), recoveryTarget(), normalizeRound() (+13 more)

### Community 21 - "github-check-selection.ts"
Cohesion: 0.10
Nodes (43): restartStoppedWriters(), unchangedSinceAccepted(), Execute, SalvageRetry, salvageWorktree(), resume(), resumeProviderReviews(), observe() (+35 more)

### Community 22 - "QuestionStepper.tsx"
Cohesion: 0.13
Nodes (26): FeatureHarnessOption, FeatureOption, FeatureQuestion, FeatureQuestionProjection, OutboxQuestionRound(), send(), draftKey(), readDraft() (+18 more)

### Community 23 - "dependencies.ts"
Cohesion: 0.15
Nodes (19): ATTEMPT_DELAYS_MS, nextAttemptAt(), admit(), compatible(), dependencyCompletionKey(), dependencyEligibility(), issueKey(), observePrerequisites() (+11 more)

### Community 24 - "office-lessons.ts"
Cohesion: 0.09
Nodes (31): normalizeStatement(), lessonBrainAudit, LessonBrainOverlap, INSTALLED, decideOfficeProposal(), mirrorOfficeKnowledge(), now(), OfficeKnowledgeStore (+23 more)

### Community 25 - "maintenance/maintenance.ts"
Cohesion: 0.11
Nodes (23): maintenancePolicies(), BrainMaintenance, candidateOwner(), SETTLED, skipOwnedCandidate(), Skipped, skippedCandidateLedger(), CmsFollowUpContext (+15 more)

### Community 26 - "cost-ledger.ts"
Cohesion: 0.15
Nodes (28): captureCost(), server_telemetry_cost_entries_costcoveragesummary, costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId() (+20 more)

### Community 27 - "workKey"
Cohesion: 0.10
Nodes (44): adoptCandidate(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat() (+36 more)

### Community 28 - "jira-operations.ts"
Cohesion: 0.24
Nodes (9): CommentPage, commentReadback(), JiraOperations, plain(), jiraRecord(), unpack(), metadataDigest(), verifiedTransition() (+1 more)

### Community 29 - "jira-time.ts"
Cohesion: 0.21
Nodes (14): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+6 more)

### Community 30 - "metadata-assessment.ts"
Cohesion: 0.14
Nodes (39): activeEffectId(), runHarnessStage(), admitPRMetadata(), METADATA_FINDING, assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema (+31 more)

### Community 31 - "owned-artifact.ts"
Cohesion: 0.22
Nodes (14): investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_SOURCE_PATHS, officeSource(), ROOT, done() (+6 more)

### Community 32 - "sanitize"
Cohesion: 0.09
Nodes (30): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+22 more)

### Community 33 - "Goals.tsx"
Cohesion: 0.09
Nodes (34): SendMessage, FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures(), LessonsView() (+26 more)

### Community 34 - "azure.ts"
Cohesion: 0.09
Nodes (32): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+24 more)

### Community 35 - "harnessDelivers"
Cohesion: 0.12
Nodes (26): NOT_RETRYABLE, WRITER_STAGES, writerRestartCandidate, writerRestarted(), deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput (+18 more)

### Community 36 - "scheduled-work.ts"
Cohesion: 0.10
Nodes (36): freshOwnershipRead(), deliverySlot(), withAmendmentOwnership(), metadataRequestResolved(), gateFeatureWork(), requestPriority(), closedTicketReport(), closedTicketRequest() (+28 more)

### Community 37 - "scheduler.ts"
Cohesion: 0.17
Nodes (14): officeCapacity, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch(), deliveryOccupied() (+6 more)

### Community 38 - "continuation-evidence.ts"
Cohesion: 0.10
Nodes (52): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+44 more)

### Community 39 - "fact-bounds.ts"
Cohesion: 0.25
Nodes (15): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+7 more)

### Community 40 - "publish-pr.ts"
Cohesion: 0.08
Nodes (46): initialManualStart(), Lane, MOVABLE, moveLane(), resolveLane(), setCardStatus(), ProjectProgress, recordCandidateCleanup() (+38 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.13
Nodes (31): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), server_telemetry_billable_work_issue_key, isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence() (+23 more)

### Community 42 - "atmosphere.ts"
Cohesion: 0.28
Nodes (7): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), SCENE_COLOR_TOKENS, TOKENS

### Community 43 - "run-accounting.ts"
Cohesion: 0.11
Nodes (31): BoundedRead, EvidenceOutcome, backfillClaudeCost(), CompletionReader, codexHome(), createdAt(), dayDirs(), header() (+23 more)

### Community 44 - "intent.ts"
Cohesion: 0.12
Nodes (25): GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles(), ContinuationIO (+17 more)

### Community 46 - "OfficeScene.tsx"
Cohesion: 0.17
Nodes (32): Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk(), ElevatorStage() (+24 more)

### Community 47 - "Engine"
Cohesion: 0.08
Nodes (5): correlatedBuild(), Engine, observe(), observeParked(), parkedReadError

### Community 48 - "dependency-bots/adopt.ts"
Cohesion: 0.19
Nodes (20): closesIssue(), linkedBody(), linkPR(), dependabotPR, readRepo(), adoptDependencyBot(), adoptOne(), DependencyBot (+12 more)

### Community 49 - "assignments.ts"
Cohesion: 0.10
Nodes (25): clip(), DEMAND_LIMIT, demandFacts(), key(), LessonKey, notes(), assignmentLookups, Binding (+17 more)

### Community 50 - ".emit"
Cohesion: 0.09
Nodes (33): decideImplementation(), requestQAPlanRetry(), configureChannelNotices(), configureNotices(), retryRecipientLookup(), itChatPrompt(), recoverCTOInput(), comparableSlackText() (+25 more)

### Community 51 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 52 - "validate-stage.ts"
Cohesion: 0.17
Nodes (17): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+9 more)

### Community 53 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 54 - "work.ts"
Cohesion: 0.14
Nodes (16): ProjectReadiness, HistoryRetirement, HistoryRetirementIntent, AssignmentResult, BlockedCause, CompletionCondition, Continuation, DeliveryAdmission (+8 more)

### Community 55 - "knowledge.ts"
Cohesion: 0.09
Nodes (32): learningMetrics(), BRAIN_SCOPE, SUBJECT, Kind, RetrospectiveResult, RetrospectiveResultSchema, RollupResult, RollupResultSchema (+24 more)

### Community 56 - "shared.ts"
Cohesion: 0.08
Nodes (24): completedPRReviews(), eligible(), mergedByOwner(), ownerSettles(), retireExternalDeliveries(), settledExternalRepair(), OfficeQAReport, QAPlanContinuation (+16 more)

### Community 57 - "TimeBook.tsx"
Cohesion: 0.11
Nodes (33): AzureBuild, src_shared_liveanchor, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens(), usd() (+25 more)

### Community 58 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (10): ref_react_three_drei, ref_react_three_fiber, ref_three_stdlib, CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility (+2 more)

### Community 59 - "control-store.ts"
Cohesion: 0.12
Nodes (14): ref_node_sqlite, Clock, applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, statementCache(), initialSnapshot() (+6 more)

### Community 60 - "retrospective-subject.ts"
Cohesion: 0.19
Nodes (15): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+7 more)

### Community 61 - "ledger.ts"
Cohesion: 0.13
Nodes (27): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationCandidates(), investigationId(), ctoReplacementResolution(), investigationFollowUps(), implementationReplacementResolution(), investigationResolution() (+19 more)

### Community 62 - "notifications.ts"
Cohesion: 0.12
Nodes (22): channelNoticeAuthorized(), ChannelSettings, notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR, plainSlackText() (+14 more)

### Community 63 - "delivery-repairs.ts"
Cohesion: 0.12
Nodes (35): removeAdoptedClone(), namedRepairIds(), stoppedBaseCheckout(), adoptedReviewCandidate(), ciCheckout(), finishCISetup(), verifyCIHooks(), CIFailure (+27 more)

### Community 64 - "ticket-evidence.ts"
Cohesion: 0.12
Nodes (30): ref_node_string_decoder, assetDownloader(), attachmentKind(), evidenceDirectory(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS (+22 more)

### Community 65 - "harness-baseline.ts"
Cohesion: 0.15
Nodes (20): baselineReport, BaselineSource, baselineText(), millions(), row(), share(), add(), BaselineState (+12 more)

### Community 66 - "Ticket"
Cohesion: 0.06
Nodes (48): implementationWorkerContext(), IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), intakeMembership(), projectListScope(), cecPrompt() (+40 more)

### Community 67 - "ControlStore"
Cohesion: 0.17
Nodes (6): DailyCTO, EvidenceRequestConflict, Briefing, saveReviewBriefing(), ControlStore, DailyCTOReport

### Community 68 - "digest"
Cohesion: 0.13
Nodes (25): OwnershipRead, interruptedImplementation(), continueOwnershipRead(), continueUnsealedQA(), entry(), expiredOwnershipRead(), handoffOwnership(), ReadbackOwnerDecision (+17 more)

### Community 69 - "JiraIssuePublisher"
Cohesion: 0.26
Nodes (3): JiraIssuePublisher, keyOf(), publicationDescription()

### Community 70 - "constellation-runtime.ts"
Cohesion: 0.10
Nodes (22): ref_3d_force_graph, ref_three, CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point (+14 more)

### Community 71 - "process.ts"
Cohesion: 0.15
Nodes (17): Event, one(), prePushRejection(), PushIdentity, settledPushBoundary(), inactivityWatch(), At, errno (+9 more)

### Community 72 - "tracking-issue.ts"
Cohesion: 0.22
Nodes (16): readBackOrThrow(), ensureTrackingIssue(), findTrackingIssue(), ownTracking(), TrackingIssue, trackingIssueBody(), trackingIssueTitle(), trackingMarker() (+8 more)

### Community 73 - "report.ts"
Cohesion: 0.17
Nodes (18): ConfirmedSegment, LiveAnchor, ObservationGap, SnapshotOrdering, TimeLedgerState, Acc, bump(), EASTERN (+10 more)

### Community 74 - "it-specialist.ts"
Cohesion: 0.08
Nodes (22): assignmentDiagnostics(), ITContext, diagnosticContext(), diagnosticSnapshot(), publishITReport(), nativeDeliveryResolved(), delays, recoverAttempt() (+14 more)

### Community 75 - "admit-improvement.ts"
Cohesion: 0.20
Nodes (19): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+11 more)

### Community 76 - "admission.ts"
Cohesion: 0.18
Nodes (13): deliveryIntakeBlocker(), Admission, IntakeContext, WAIT_STATUSES, DependencyStores, captureLearning(), recordLearningOpportunity(), captureMaintenanceStep() (+5 more)

### Community 77 - "goal-reviews.ts"
Cohesion: 0.12
Nodes (17): applyGoalReview(), DailyResultSchema, EvidenceRefSchema, FreshDailyResultSchema, GoalEvidenceRequestSchema, statusAllowed(), workEvidence(), DailyCTOBriefing (+9 more)

### Community 78 - "github/issue-publication.ts"
Cohesion: 0.15
Nodes (10): FeaturePublisher, PublicationReceipt, Assign, Board, Content, GitHubIssuePublisher, number(), same() (+2 more)

### Community 79 - "telemetry.ts"
Cohesion: 0.09
Nodes (27): CodexRollout, CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL (+19 more)

### Community 80 - "cli.ts"
Cohesion: 0.18
Nodes (7): ref_node_stream, ref_node_timers, args, [cmd,...rawArgs], commands, key, projectIndex

### Community 81 - "lesson-selection.ts"
Cohesion: 0.09
Nodes (36): committedNotePage(), guidanceExcerpt(), digest(), officeKnowledgeSnapshot(), lessonForProject(), installedLesson(), Bucket, LESSON_LIMIT (+28 more)

### Community 82 - "ref_node_path"
Cohesion: 0.07
Nodes (40): ref_node_crypto, ref_node_fs, ref_node_os, ref_node_path, ref_node_util, Decision, MISSING_SAVED_PLAN, recoverSavedPlan() (+32 more)

### Community 83 - "Effects"
Cohesion: 0.16
Nodes (15): diagnosticProof(), recoverDiscovery(), featureEffectGate(), publishFeature(), GitHubOperations, fileLessonIssue(), lessonIssueBody(), lessonIssueMarker() (+7 more)

### Community 84 - "outbox.ts"
Cohesion: 0.08
Nodes (39): ADOPTION_STALLED_MS, projectOutbox(), interruptAdoptions(), compactSteps(), legacy(), REMOVED_FIELDS, retireLegacyRecovery(), knowledgeOutbox() (+31 more)

### Community 85 - "brain-maintenance.ts"
Cohesion: 0.21
Nodes (12): completeNativeCheckpoint(), BRAIN_DEPENDENCY_MERGES, BrainResult, capped(), queueMaintenanceNotice(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance() (+4 more)

### Community 86 - "delivery-recoveries.ts"
Cohesion: 0.19
Nodes (17): boardPreflightCandidate(), savedActivationFailure(), candidateInput(), children, oldAdoptionBasis(), savedAdmissionUnresolved(), savedCandidateAdmission, completedConflictDraftUnresolved() (+9 more)

### Community 87 - "index.ts"
Cohesion: 0.06
Nodes (55): ref_hono_node_server, ref_node_http, ref_vite, implementationContinuationRoute(), closedReadonlyPlan(), Document, entryExists(), inspectClosedQAPlan() (+47 more)

### Community 88 - "daily-cto.ts"
Cohesion: 0.26
Nodes (11): evidenceRequestConflicts, dailyReviewPrompt(), dailyReviewDate(), reviewWeekday(), addDays(), EASTERN, easternDay(), easternDayFormatter (+3 more)

### Community 89 - ".verifyPR"
Cohesion: 0.36
Nodes (9): officeMergeProvenance(), reconcileMergeScannerRetry(), Retry, retryMergeScanner(), retryReadBack(), runIdentity(), savedRetry(), transientScannerJobs() (+1 more)

### Community 90 - "cec/workflow.ts"
Cohesion: 0.17
Nodes (25): applyIntakeObservation(), parksInJira(), qaPlanEvidenceGap(), MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), run(), advance() (+17 more)

### Community 91 - "MaintenanceRun"
Cohesion: 0.20
Nodes (8): BrainStatusSchema, identity, brainCheckpointCompletion(), coverageSchema, followupSchema, verified, reconcileCompletedCheckpoints(), MaintenanceRun

### Community 92 - "TicketJob"
Cohesion: 0.07
Nodes (21): writerRestartInstruction(), dependabotReviewGuidance(), StageContext, GitHubDelivery, stagePrompt(), StagePromptInput, ROLES, stageRole() (+13 more)

### Community 93 - "install-service.mjs"
Cohesion: 0.18
Nodes (10): ref_node_child_process, file, folder, logs, root, GIT_NETWORK, LIVE_PROVIDERS, liveReach() (+2 more)

### Community 94 - "features.ts"
Cohesion: 0.12
Nodes (30): bindDelivery(), bindFeature(), currentApproval(), featureGate(), predecessorComplete(), automaticIntakeWait(), recoveryHeld(), deliveryPreflight (+22 more)

### Community 95 - "capture-session-clone.py"
Cohesion: 0.15
Nodes (10): ctypes, errno, importlib_util, json, os, pathlib, Copy a coherent macOS clone of inherited reader fd3 to anonymous target fd4. No…, Read-only protocol adapter for the installed review helper. No model dispatch. (+2 more)

### Community 96 - "preferences-store.ts"
Cohesion: 0.21
Nodes (8): fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS, OfficePreferences, OfficePreferencesPatch

### Community 97 - "OfficeSnapshot"
Cohesion: 0.09
Nodes (46): Conversation(), LessonDecisionAction, lessonDecisionState(), readLessonDecision(), DAYS, dueLessonDecisions(), easternWeek(), isLessonDecision() (+38 more)

### Community 98 - ".save"
Cohesion: 0.18
Nodes (30): jiraCollection(), BLOCKED, findComment(), LiveIssue, readIssue(), readIssues(), Execute, jira() (+22 more)

### Community 99 - "artifact"
Cohesion: 0.12
Nodes (42): containedFile(), PrerequisitesSchema, activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash (+34 more)

### Community 100 - "useOfficePreferences.ts"
Cohesion: 0.26
Nodes (10): acceptPreferences(), PreferenceCandidate, strip(), UNKNOWN_PREFERENCES, OfficePreferencesController, PreferenceFeedback, PreferenceField, requestPreferences() (+2 more)

### Community 101 - "local-config.ts"
Cohesion: 0.18
Nodes (15): AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), goalEvidencePath(), localBindings, assertModelOverrides(), CODEX_DEFAULT_EFFORT, CODEX_DEFAULT_MODEL, CODEX_EFFORTS (+7 more)

### Community 102 - "time-readback.ts"
Cohesion: 0.31
Nodes (5): TimeLedger, Readback, READBACK_INTERVAL_MS, readBackTime(), SETTLE_MS

### Community 103 - "agent-activity.ts"
Cohesion: 0.25
Nodes (9): itAgent(), itDiagnostics(), displayAgentTask(), withoutElapsed(), LiveAgentTask(), Props, RunningTask(), text() (+1 more)

### Community 104 - "store.ts"
Cohesion: 0.13
Nodes (14): ref_node_url, assertQuestionVisibility(), pendingQuestions(), QuestionNotifications, leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore() (+6 more)

### Community 105 - "extract-worker.mjs"
Cohesion: 0.43
Nodes (6): ref_mammoth, ref_pdfjs_dist, bounded(), extract(), fail(), [path,kind]

### Community 106 - "coordination.ts"
Cohesion: 0.23
Nodes (12): checkpointWindow(), dueAt(), hours, localDay(), ReviewResult, deferNonReady(), preparePR(), recheck() (+4 more)

### Community 107 - "blocker-followups.ts"
Cohesion: 0.25
Nodes (14): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), readBackConversations(), handoff(), reconcileBlockerFollowups(), clearUnblockBrief() (+6 more)

### Community 108 - "office/readiness.ts"
Cohesion: 0.36
Nodes (6): BLOCKED_CAUSES, blockedCauses(), projectReadiness(), ProgressionItem, src_shared_progressionitem, src_shared_projectreadiness

### Community 109 - "continue-access-only-plan.ts"
Cohesion: 0.57
Nodes (5): Document, isAccessOnlyPlan(), settledAccessOnlyState(), continueAccessOnlyPlan(), entryExists()

### Community 110 - "pilot-delivery.ts"
Cohesion: 0.11
Nodes (29): candidateBranchMoved(), continueImplementation(), checkMail(), drainMail(), requestMail(), dispatchNightly(), drainDelivery(), enableNightly() (+21 more)

### Community 111 - "handover-cms.ts"
Cohesion: 0.40
Nodes (4): ref_smol_toml, file, project, root

### Community 113 - "delivery-ownership.ts"
Cohesion: 0.33
Nodes (5): ref_node_async_hooks, Ownership, ownershipContext, refreshDeliveryOwnership(), RefreshOwnership

### Community 114 - "wiki-sync.ts"
Cohesion: 0.33
Nodes (3): ACTIONS, OWNER, wikiSync

### Community 115 - "stop-reason.ts"
Cohesion: 0.47
Nodes (5): classifyStop(), stopReason(), incompleteReadOutput(), StopKind, StopReason

### Community 116 - "lesson-exits.ts"
Cohesion: 0.60
Nodes (5): expireLessons(), expiring(), graduateLessons(), graduating(), retire()

## Knowledge Gaps
- **493 isolated node(s):** `Attempt`, `REVIEW_STAGES`, `Receipt`, `Settled`, `SETTLED_RECEIPT_NOTE` (+488 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 634 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `project-graphql.ts`, `review-run.ts`, `completedExecution`, `session-bridge.ts`, `accept-stage-result.ts`, `agents.ts`, `github-delivery.ts`, `features/workflow.ts`, `reader.ts`, `scheduled-captures.ts`, `run-retrospective.ts`, `record-trigger.ts`, `requests.ts`, `features/commands.ts`, `github-check-selection.ts`, `dependencies.ts`, `office-lessons.ts`, `maintenance/maintenance.ts`, `cost-ledger.ts`, `workKey`, `jira-operations.ts`, `jira-time.ts`, `metadata-assessment.ts`, `owned-artifact.ts`, `sanitize`, `azure.ts`, `harnessDelivers`, `scheduled-work.ts`, `scheduler.ts`, `continuation-evidence.ts`, `publish-pr.ts`, `time-scope.ts`, `run-accounting.ts`, `intent.ts`, `Coordinator`, `Engine`, `dependency-bots/adopt.ts`, `assignments.ts`, `.emit`, `validate-stage.ts`, `knowledge.ts`, `shared.ts`, `control-store.ts`, `retrospective-subject.ts`, `ledger.ts`, `notifications.ts`, `delivery-repairs.ts`, `ticket-evidence.ts`, `Ticket`, `digest`, `JiraIssuePublisher`, `tracking-issue.ts`, `it-specialist.ts`, `admit-improvement.ts`, `admission.ts`, `goal-reviews.ts`, `github/issue-publication.ts`, `lesson-selection.ts`, `ref_node_path`, `Effects`, `outbox.ts`, `brain-maintenance.ts`, `delivery-recoveries.ts`, `index.ts`, `cec/workflow.ts`, `MaintenanceRun`, `TicketJob`, `features.ts`, `OfficeSnapshot`, `.save`, `artifact`, `time-readback.ts`, `agent-activity.ts`, `store.ts`, `coordination.ts`, `blocker-followups.ts`, `continue-access-only-plan.ts`, `pilot-delivery.ts`, `lesson-exits.ts`?**
  _High betweenness centrality (0.107) - this node is a cross-community bridge._
- **Why does `BrainReader` connect `reader.ts` to `lesson-selection.ts`, `index.ts`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `Coordinator` connect `Coordinator` to `scheduled-work.ts`, `accept-stage-result.ts`, `store.ts`, `coordination.ts`, `admission.ts`, `scheduled-captures.ts`, `assignment-poll.ts`, `requests.ts`, `brain-maintenance.ts`, `dependencies.ts`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **What connects `Attempt`, `REVIEW_STAGES`, `Receipt` to the rest of the system?**
  _493 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `index.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10999471179270227 - nodes in this community are weakly interconnected._
- **Should `Role` be split into smaller, more focused modules?**
  _Cohesion score 0.0988235294117647 - nodes in this community are weakly interconnected._
- **Should `review-run.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12411347517730496 - nodes in this community are weakly interconnected._