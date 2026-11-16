# Graph Report - the-office  (2026-11-16)

## Corpus Check
- 841 files · ~332,974 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4106 nodes · 18882 edges · 115 communities (112 shown, 3 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 608 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `cbad8d3f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ref_react
- PeoplePanel.tsx
- dependency-bots/adopt.ts
- ref_node_crypto
- Inspector.tsx
- requests.ts
- session-bridge.ts
- Button
- accept-stage-result.ts
- Store
- worker-runtime.ts
- github-delivery.ts
- App.tsx
- features/workflow.ts
- reader.ts
- scheduled-captures.ts
- run-retrospective.ts
- record-trigger.ts
- assignment-poll.ts
- artifact
- cec-reads.ts
- github-check-selection.ts
- QuestionStepper.tsx
- coordination.ts
- knowledge.ts
- maintenance/maintenance.ts
- cost-ledger.ts
- saved-prerequisite-handoff.ts
- jira-operations.ts
- jira-time.ts
- metadata-assessment.ts
- index.tsx
- ref_zod
- Goals.tsx
- sanitizeObject
- github-readiness.ts
- scheduled-work.ts
- scheduler.ts
- closeout-recovery.ts
- fact-bounds.ts
- remove-candidate.ts
- time-scope.ts
- node-visuals.ts
- run-accounting.ts
- intent.ts
- Coordinator
- OfficeScene.tsx
- engine.ts
- digest
- assignments.ts
- outbox.ts
- scene-motion.ts
- link-draft-issue.ts
- codex-rollout.ts
- work.ts
- weekly-rollup.ts
- shared.ts
- TimeBook.tsx
- RoomCamera.tsx
- control-store.ts
- Offices
- run.ts
- conversations/slack.ts
- run-ci-repair.ts
- ticket-evidence.ts
- harness-baseline.ts
- agents.ts
- ControlStore
- continue-ownership-read.ts
- ledger.ts
- constellation-runtime.ts
- contract.ts
- knowledge-retrieval.ts
- report.ts
- service-health.ts
- admit-improvement.ts
- interrupted-work-recovery.ts
- daily-cto.ts
- .transaction
- .constructor
- diagnostic-context.ts
- lesson-selection.ts
- ref_node_path
- Effects
- work-summary.ts
- brain-maintenance.ts
- it-specialist.ts
- http/commands.ts
- easternDay
- .verifyPR
- cec/workflow.ts
- evidence-digest.ts
- GitHubDelivery
- live-reach.ts
- features.ts
- capture-session-clone.py
- preferences-store.ts
- OfficeSnapshot
- config.ts
- activation-recovery.ts
- .pump
- local-config.ts
- ScheduledWork
- agent-activity.ts
- offices.ts
- extract-worker.mjs
- cto-replacement-resolution.ts
- blocker-followups.ts
- office/readiness.ts
- unblock-brief.ts
- .emit
- ITFollowUps.tsx
- command-registry.ts
- work-time.ts
- cms-follow-up-instructions.ts

## God Nodes (most connected - your core abstractions)
1. `Store` - 368 edges
2. `TicketJob` - 172 edges
3. `digest()` - 150 edges
4. `command()` - 117 edges
5. `GitHubDelivery` - 116 edges
6. `artifact()` - 114 edges
7. `workKey()` - 96 edges
8. `OfficeSnapshot` - 88 edges
9. `cx()` - 88 edges
10. `currentAssignment()` - 88 edges

## Surprising Connections (you probably didn't know these)
- `apply()` --indirect_call--> `note()`  [INFERRED]
  src/conversations/OutboxSavedImplementation.tsx → server/cec/parking/resume-parked.ts
- `stageContinuation` --references--> `WorkTime`  [EXTRACTED]
  server/cec/stage-continuation.ts → src/shared.ts
- `DeliverySlot` --references--> `Role`  [EXTRACTED]
  server/office/projects.ts → src/shared.ts
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
- 5-file cycle: `server/delivery/recovery/implementation/continuation-evidence.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/recovery/implementation/continuation-evidence.ts`
- 5-file cycle: `server/delivery/recovery/implementation/saved-prerequisite-handoff.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/recovery/implementation/saved-prerequisite-handoff.ts`
- 5-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/scope-repair/scope-repair-resume.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 5-file cycle: `server/delivery/recovery/scope-repair/scope-repair-readback.ts -> server/delivery/recovery/scope-repair/scope-repair-resume.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/scope-repair/scope-repair-readback.ts`
- 5-file cycle: `server/delivery/recovery/implementation/continuation-evidence.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/implementation/implementation-recovery.ts -> server/delivery/recovery/implementation/continuation-evidence.ts`
- 5-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/closeout/github-closeout.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`

## Communities (115 total, 3 thin omitted)

### Community 0 - "ref_react"
Cohesion: 0.15
Nodes (32): ref_react, SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS, PickupForm() (+24 more)

### Community 1 - "PeoplePanel.tsx"
Cohesion: 0.10
Nodes (41): label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+33 more)

### Community 2 - "dependency-bots/adopt.ts"
Cohesion: 0.07
Nodes (73): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard, projectCards() (+65 more)

### Community 3 - "ref_node_crypto"
Cohesion: 0.09
Nodes (46): ref_node_crypto, packedConsumerPnpmRepair(), sha256(), featureItemComplete(), reconcileFeatureCompletion(), readEvidence(), ProviderEvidence, DELAYS (+38 more)

### Community 4 - "Inspector.tsx"
Cohesion: 0.11
Nodes (66): Outbox(), blockedSummary(), ServiceHealthPanel(), followUp(), labels, ServiceHealthRow(), BlockerFollowups(), LearningCoverage() (+58 more)

### Community 5 - "requests.ts"
Cohesion: 0.05
Nodes (73): NOT_RETRYABLE, WRITER_STAGES, writerRestarted(), writerRestartPending(), deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput (+65 more)

### Community 6 - "session-bridge.ts"
Cohesion: 0.05
Nodes (58): ref_node_perf_hooks, ref_node_url, ref_ws, file, folder, logs, root, claudeSessionContext() (+50 more)

### Community 7 - "Button"
Cohesion: 0.07
Nodes (65): ref_react_markdown, ref_remark_gfm, ref_yaml, KnowledgeActivity, KnowledgeActivityPage, KnowledgeEdge, KnowledgeMap, KnowledgeNode (+57 more)

### Community 8 - "accept-stage-result.ts"
Cohesion: 0.10
Nodes (52): containedFile(), acceptStageResult(), acceptConflictRepair(), pendingPreparationCheck(), acceptMetadataReview(), requireMetadataReview(), verdict(), resumeReviewedMerge() (+44 more)

### Community 9 - "Store"
Cohesion: 0.06
Nodes (31): Assignment, Content, jiraText(), Transition, GitHubFeaturePublisher, helperTelemetry(), JiraFeaturePublisher, Assign (+23 more)

### Community 10 - "worker-runtime.ts"
Cohesion: 0.06
Nodes (45): ref_smol_toml, SlackResultSchema, SlackVerificationSchema, candidateWorkspaceEnvironment(), server_delivery_harness_delivery_authority_resolvedeliverywork, ApproachSchema, GITHUB_ISSUE_SKILL, assignmentSubject() (+37 more)

### Community 11 - "github-delivery.ts"
Cohesion: 0.06
Nodes (43): writerRestartInstruction(), ProjectProgress, BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction(), dependabotReviewGuidance(), discover() (+35 more)

### Community 12 - "App.tsx"
Cohesion: 0.06
Nodes (58): ref_lucide_react, ref_motion, ref_react_dom, Conversation(), slackMessageStatus(), SlackDeliveryCard(), BrainDrawer(), themeColor (+50 more)

### Community 13 - "features/workflow.ts"
Cohesion: 0.07
Nodes (63): approveFeature(), commandFeature(), featureById(), mutation(), reviewQuestions(), assertFeatureDependencyOrder(), featureDependencyEdges(), key() (+55 more)

### Community 14 - "reader.ts"
Cohesion: 0.13
Nodes (11): committedNotePage(), BrainGraph, BrainNote, BrainReader, CommittedBrain, GraphNode, GraphPage, hash (+3 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.15
Nodes (46): requestDelivery(), createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest (+38 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.09
Nodes (45): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, blockingTrigger, isBlocking(), brainOverlap (+37 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.08
Nodes (50): baselineLearning(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences(), maintenanceSubject(), MaintenanceSubjectFacts, clip() (+42 more)

### Community 18 - "assignment-poll.ts"
Cohesion: 0.10
Nodes (25): ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR, plainSlackText() (+17 more)

### Community 19 - "artifact"
Cohesion: 0.09
Nodes (56): assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), reconcileCompletedConflictDraft(), routeReadyPostConflictPublication(), verifyInitialDraftConflictPreparation() (+48 more)

### Community 20 - "cec-reads.ts"
Cohesion: 0.07
Nodes (34): IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), intakeMembership(), projectListScope(), cecIntakePrompt(), cecReadbackPrompt() (+26 more)

### Community 21 - "github-check-selection.ts"
Cohesion: 0.14
Nodes (28): resumeProviderReviews(), observe(), checksFailed(), checksPassed(), checksPending(), CurrentChecksWait, currentMergeChecks(), pass() (+20 more)

### Community 22 - "QuestionStepper.tsx"
Cohesion: 0.21
Nodes (17): FeatureQuestionProjection, OutboxQuestionRound(), send(), draftKey(), readDraft(), saveDraft(), nextQuestion(), orderedQuestions() (+9 more)

### Community 23 - "coordination.ts"
Cohesion: 0.07
Nodes (49): MergeNotifications, reconcileNoticeConfirmations(), Admission, admit(), IntakeContext, WAIT_STATUSES, compatible(), dependencyCompletionKey() (+41 more)

### Community 24 - "knowledge.ts"
Cohesion: 0.06
Nodes (49): normalizeStatement(), lessonBrainAudit, LessonBrainOverlap, decideOfficeProposal(), now(), OfficeKnowledgeStore, proposeOfficeLessons(), retireOfficeLesson() (+41 more)

### Community 25 - "maintenance/maintenance.ts"
Cohesion: 0.18
Nodes (13): captureMaintenanceStep(), candidateOwner(), SETTLED, skipOwnedCandidate(), Skipped, skippedCandidateLedger(), MaintenanceSchema, MAINTENANCE_NATIVE_GUIDANCE (+5 more)

### Community 26 - "cost-ledger.ts"
Cohesion: 0.12
Nodes (31): captureCost(), server_telemetry_cost_entries_costcoveragesummary, costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId() (+23 more)

### Community 27 - "saved-prerequisite-handoff.ts"
Cohesion: 0.07
Nodes (56): recordJobApproach(), continuationScope(), continuationWorktree(), continuationGuard(), Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate() (+48 more)

### Community 28 - "jira-operations.ts"
Cohesion: 0.27
Nodes (9): CommentPage, commentReadback(), JiraOperations, plain(), jiraRecord(), unpack(), metadataDigest(), verifiedTransition() (+1 more)

### Community 29 - "jira-time.ts"
Cohesion: 0.15
Nodes (18): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+10 more)

### Community 30 - "metadata-assessment.ts"
Cohesion: 0.12
Nodes (43): admitPRMetadata(), METADATA_FINDING, assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema, savedMetadataAssessment(), validateSaved() (+35 more)

### Community 31 - "index.tsx"
Cohesion: 0.10
Nodes (27): FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), send(), phases, LinkedFeatures(), QuestionRound() (+19 more)

### Community 32 - "ref_zod"
Cohesion: 0.07
Nodes (43): ref_zod, assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO() (+35 more)

### Community 33 - "Goals.tsx"
Cohesion: 0.15
Nodes (18): CTOReview(), goalState, DailyCTO(), reportDate(), reviewStatus, GoalList(), card(), blank() (+10 more)

### Community 34 - "sanitizeObject"
Cohesion: 0.12
Nodes (23): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+15 more)

### Community 35 - "github-readiness.ts"
Cohesion: 0.13
Nodes (29): findingsBlock(), requireDeliveryAuthority(), assertDeliveryMayMutate(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery(), DECISION_KINDS (+21 more)

### Community 36 - "scheduled-work.ts"
Cohesion: 0.08
Nodes (41): ref_node_async_hooks, freshOwnershipRead(), deliverySlot(), verifiedCloseoutCleanupRequest(), Ownership, ownershipContext, refreshDeliveryOwnership(), RefreshOwnership (+33 more)

### Community 37 - "scheduler.ts"
Cohesion: 0.22
Nodes (12): fifo(), Scheduler, selectWork(), admitsWork(), canDispatch(), deliveryOccupied(), foreignWork(), WorkSlot (+4 more)

### Community 38 - "closeout-recovery.ts"
Cohesion: 0.10
Nodes (46): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+38 more)

### Community 39 - "fact-bounds.ts"
Cohesion: 0.26
Nodes (14): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+6 more)

### Community 40 - "remove-candidate.ts"
Cohesion: 0.18
Nodes (18): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot() (+10 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.12
Nodes (32): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), server_telemetry_billable_work_issue_key, isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence() (+24 more)

### Community 42 - "node-visuals.ts"
Cohesion: 0.20
Nodes (13): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+5 more)

### Community 43 - "run-accounting.ts"
Cohesion: 0.06
Nodes (54): BoundedRead, backfillClaudeCost(), CompletionReader, CodexRollout, codexHome(), createdAt(), dayDirs(), header() (+46 more)

### Community 44 - "intent.ts"
Cohesion: 0.14
Nodes (23): ref_node_child_process, GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles() (+15 more)

### Community 46 - "OfficeScene.tsx"
Cohesion: 0.18
Nodes (31): Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk(), ElevatorStage() (+23 more)

### Community 47 - "engine.ts"
Cohesion: 0.08
Nodes (14): correlatedBuild(), checkMail(), drainMail(), requestMail(), enableNightly(), ingest(), GitHubMonitor, drainMaintenance() (+6 more)

### Community 48 - "digest"
Cohesion: 0.21
Nodes (16): ownershipReadHistory(), adoptCandidate(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related (+8 more)

### Community 49 - "assignments.ts"
Cohesion: 0.09
Nodes (28): assignmentKnowledge(), clip(), DEMAND_LIMIT, demandFacts(), key(), LessonKey, notes(), assignmentLookups (+20 more)

### Community 50 - "outbox.ts"
Cohesion: 0.13
Nodes (24): ADOPTION_STALLED_MS, projectOutbox(), syncOutbox(), projectSlackDeliveries(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint() (+16 more)

### Community 51 - "scene-motion.ts"
Cohesion: 0.29
Nodes (15): Handoff(), avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay() (+7 more)

### Community 52 - "link-draft-issue.ts"
Cohesion: 0.10
Nodes (31): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+23 more)

### Community 53 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 54 - "work.ts"
Cohesion: 0.14
Nodes (16): ProjectReadiness, HistoryRetirement, HistoryRetirementIntent, AssignmentResult, BlockedCause, CompletionCondition, DeliveryAdmission, DependencyObservation (+8 more)

### Community 55 - "weekly-rollup.ts"
Cohesion: 0.16
Nodes (18): deliveryMetrics(), median(), learningMetrics(), RollupResult, harperFolder(), RETROSPECTIVE_TIMEOUT, lastFriday(), ROLLUP_HISTORY (+10 more)

### Community 56 - "shared.ts"
Cohesion: 0.08
Nodes (24): completedPRReviews(), eligible(), mergedByOwner(), ownerSettles(), retireExternalDeliveries(), settledExternalRepair(), OfficeQAReport, QAPlanContinuation (+16 more)

### Community 57 - "TimeBook.tsx"
Cohesion: 0.11
Nodes (35): TelemetryReport, AzureBuild, src_shared_liveanchor, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens() (+27 more)

### Community 58 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (10): ref_react_three_drei, ref_react_three_fiber, ref_three_stdlib, CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility (+2 more)

### Community 59 - "control-store.ts"
Cohesion: 0.13
Nodes (11): ref_node_sqlite, Clock, applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, statementCache(), initialSnapshot() (+3 more)

### Community 60 - "Offices"
Cohesion: 0.17
Nodes (3): QuestionNotifications, officeKnowledgeSnapshot(), Offices

### Community 61 - "run.ts"
Cohesion: 0.11
Nodes (29): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, NOTIFY_HELPER, notifyHelperResolution() (+21 more)

### Community 62 - "conversations/slack.ts"
Cohesion: 0.13
Nodes (11): channelNoticeAuthorized(), comparableSlackText(), SlackMessages, goalNoticeAuthorized(), sendGoalNotice(), maintenanceNoticeAuthorized(), sendMaintenanceNotice(), Agents (+3 more)

### Community 63 - "run-ci-repair.ts"
Cohesion: 0.21
Nodes (15): ciCheckout(), verifyCIHooks(), CIFailure, guardCIRepair(), prepareCIMetadataRepair(), CI_METADATA_CONSUMED, publishCIRepair(), rewordCommits() (+7 more)

### Community 64 - "ticket-evidence.ts"
Cohesion: 0.15
Nodes (22): ref_node_string_decoder, assetDownloader(), attachmentKind(), evidenceDirectory(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS (+14 more)

### Community 65 - "harness-baseline.ts"
Cohesion: 0.15
Nodes (20): baselineReport, BaselineSource, baselineText(), millions(), row(), share(), add(), BaselineState (+12 more)

### Community 66 - "agents.ts"
Cohesion: 0.06
Nodes (52): implementationWorkerContext(), cecPrompt(), resolvedDecisionNote(), stageInstructions, qaPlanEvidenceGap(), qaRunDirectory(), savedStageCompletion(), assertContinuableWorktree() (+44 more)

### Community 67 - "ControlStore"
Cohesion: 0.16
Nodes (6): DailyCTO, EvidenceRequestConflict, Briefing, saveReviewBriefing(), ControlStore, DailyCTOReport

### Community 68 - "continue-ownership-read.ts"
Cohesion: 0.20
Nodes (16): continueOwnershipRead(), expiredOwnershipRead(), handoffOwnership(), ReadbackOwnerDecision, ownershipReadGate(), ownershipReadState(), ownershipReadSource(), readOwnershipCandidate (+8 more)

### Community 69 - "ledger.ts"
Cohesion: 0.31
Nodes (10): diagnosticSnapshot(), investigationCandidates(), investigationId(), investigationFollowUps(), implementationReplacementResolution(), investigationResolution(), syncInvestigations(), requeueInvestigationEvidence() (+2 more)

### Community 70 - "constellation-runtime.ts"
Cohesion: 0.10
Nodes (22): ref_3d_force_graph, ref_three, CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point (+14 more)

### Community 71 - "contract.ts"
Cohesion: 0.15
Nodes (16): Event, one(), prePushRejection(), PushIdentity, settledPushBoundary(), At, errno, GroupInventory (+8 more)

### Community 72 - "knowledge-retrieval.ts"
Cohesion: 0.39
Nodes (6): knowledgeActivity(), knowledgeActivityPage(), knowledgeSnapshot(), bounded(), committedKnowledgeMap(), knowledgeMap()

### Community 73 - "report.ts"
Cohesion: 0.21
Nodes (16): TelemetryRow, TelemetrySync, TimeLedgerState, Acc, bump(), EASTERN, easternDay(), modelShares() (+8 more)

### Community 74 - "service-health.ts"
Cohesion: 0.19
Nodes (10): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, slackHealth() (+2 more)

### Community 75 - "admit-improvement.ts"
Cohesion: 0.20
Nodes (17): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+9 more)

### Community 76 - "interrupted-work-recovery.ts"
Cohesion: 0.36
Nodes (7): interruptAdoptions(), legacy(), REMOVED_FIELDS, retireLegacyRecovery(), goalNoticeNeverDispatched(), maintenanceNoticeNeverDispatched(), recover()

### Community 77 - "daily-cto.ts"
Cohesion: 0.10
Nodes (24): evidenceRequestConflicts, dailyReviewPrompt(), applyGoalReview(), DailyResultSchema, EvidenceRefSchema, FreshDailyResultSchema, GoalEvidenceRequestSchema, statusAllowed() (+16 more)

### Community 78 - ".transaction"
Cohesion: 0.09
Nodes (17): JiraIssuePublisher, keyOf(), descriptionPreimage(), plain(), publicationDescription(), FeaturePublisher, PublicationReceipt, publishFeature() (+9 more)

### Community 79 - ".constructor"
Cohesion: 0.31
Nodes (5): maintenancePolicies(), BrainMaintenance, easternDate(), weeklyDue(), supersedablePriorRuns()

### Community 80 - "diagnostic-context.ts"
Cohesion: 0.38
Nodes (5): assignmentDiagnostics(), diagnosticContext(), itAgent(), itDiagnostics(), currentServices()

### Community 81 - "lesson-selection.ts"
Cohesion: 0.10
Nodes (29): guidanceExcerpt(), lessonForProject(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, LessonSelection, lessonText() (+21 more)

### Community 82 - "ref_node_path"
Cohesion: 0.08
Nodes (48): ref_node_fs, ref_node_os, ref_node_path, ref_node_util, interruptedImplementation(), verifyContinuationPreservation(), MISSING_SAVED_PLAN, recoverCTOInput() (+40 more)

### Community 83 - "Effects"
Cohesion: 0.26
Nodes (8): GitHubOperations, fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), closeNativeRefresh(), fingerprint(), Effects, EffectIntent

### Community 84 - "work-summary.ts"
Cohesion: 0.16
Nodes (23): envelopeCard, deliveryRepairProjection(), card, ACTIVE, maintenanceUpdate(), PMQueueItem, pmQueueItems(), prerequisiteKeys() (+15 more)

### Community 85 - "brain-maintenance.ts"
Cohesion: 0.23
Nodes (11): completeNativeCheckpoint(), reconcileNativeDelivery(), BRAIN_DEPENDENCY_MERGES, BrainResult, capped(), queueMaintenanceNotice(), queueCheckpointRetry(), readBackCheckpoint() (+3 more)

### Community 86 - "it-specialist.ts"
Cohesion: 0.22
Nodes (14): savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), ITContext, publishITReport(), ITSpecialist, delays (+6 more)

### Community 87 - "http/commands.ts"
Cohesion: 0.05
Nodes (64): ref_hono_node_server, ref_node_http, ref_node_stream, ref_node_timers, ref_vite, implementationContinuationRoute(), closedReadonlyPlan(), Document (+56 more)

### Community 88 - "easternDay"
Cohesion: 0.22
Nodes (14): expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), dailyReviewDate(), reviewWeekday() (+6 more)

### Community 89 - ".verifyPR"
Cohesion: 0.19
Nodes (15): restartStoppedWriters(), unchangedSinceAccepted(), writerRestartCandidate, Execute, SalvageRetry, salvageWorktree(), officeMergeProvenance(), reconcileMergeScannerRetry() (+7 more)

### Community 90 - "cec/workflow.ts"
Cohesion: 0.14
Nodes (31): applyIntakeObservation(), parksInJira(), MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), ownReceipts(), run(), publicationEvidenceGap() (+23 more)

### Community 91 - "evidence-digest.ts"
Cohesion: 0.44
Nodes (7): canonical(), evidenceDigest(), evidenceHash(), semantic(), stableUrl(), requirementDrift(), RequirementPostimage

### Community 92 - "GitHubDelivery"
Cohesion: 0.21
Nodes (4): StageContext, GitHubDelivery, executeRequest(), StageResult

### Community 93 - "live-reach.ts"
Cohesion: 0.47
Nodes (5): GIT_NETWORK, LIVE_PROVIDERS, liveReach(), networkUrl(), remoteUrls()

### Community 94 - "features.ts"
Cohesion: 0.11
Nodes (35): assertFeatureGate(), bindFeature(), currentApproval(), featureGate(), predecessorComplete(), automaticIntakeWait(), deliveryPreflight, handoffBinding() (+27 more)

### Community 95 - "capture-session-clone.py"
Cohesion: 0.15
Nodes (10): ctypes, errno, importlib_util, json, os, pathlib, Copy a coherent macOS clone of inherited reader fd3 to anonymous target fd4. No…, Read-only protocol adapter for the installed review helper. No model dispatch. (+2 more)

### Community 96 - "preferences-store.ts"
Cohesion: 0.21
Nodes (8): fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS, OfficePreferences, OfficePreferencesPatch

### Community 97 - "OfficeSnapshot"
Cohesion: 0.08
Nodes (39): knowledgeOutbox(), SendMessage, LessonDecisionAction, lessonDecisionState(), readLessonDecision(), DAYS, dueLessonDecisions(), easternWeek() (+31 more)

### Community 98 - "config.ts"
Cohesion: 0.18
Nodes (30): jiraCollection(), BLOCKED, findComment(), LiveIssue, readIssue(), readIssues(), Execute, jira() (+22 more)

### Community 99 - "activation-recovery.ts"
Cohesion: 0.11
Nodes (36): ATTEMPT_DELAYS_MS, nextAttemptAt(), PrerequisitesSchema, activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation() (+28 more)

### Community 100 - ".pump"
Cohesion: 0.36
Nodes (5): GitHubMaintenance, StageYield, partialVendorReview(), partialVendorReviewLedger(), MaintenanceResult

### Community 101 - "local-config.ts"
Cohesion: 0.17
Nodes (18): AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), goalEvidencePath(), OfficeConfigInputs, officeConfigRoute(), officeConfigSummary(), CECBinding, localBindings (+10 more)

### Community 103 - "agent-activity.ts"
Cohesion: 0.38
Nodes (8): displayAgentTask(), githubStageLabels, withoutElapsed(), LiveAgentTask(), Props, RunningTask(), text(), Agent

### Community 104 - "offices.ts"
Cohesion: 0.54
Nodes (5): leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), DELIVERY_CONCURRENCY

### Community 105 - "extract-worker.mjs"
Cohesion: 0.43
Nodes (6): ref_mammoth, ref_pdfjs_dist, bounded(), extract(), fail(), [path,kind]

### Community 106 - "cto-replacement-resolution.ts"
Cohesion: 0.60
Nodes (3): ctoInputIdentityMatches(), ctoInputRecovered(), ctoReplacementResolution()

### Community 107 - "blocker-followups.ts"
Cohesion: 0.31
Nodes (12): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), readBackConversations(), handoff(), reconcileBlockerFollowups(), improvementIntakeGate() (+4 more)

### Community 108 - "office/readiness.ts"
Cohesion: 0.36
Nodes (6): BLOCKED_CAUSES, blockedCauses(), projectReadiness(), ProgressionItem, src_shared_progressionitem, src_shared_projectreadiness

### Community 109 - "unblock-brief.ts"
Cohesion: 0.53
Nodes (5): clearUnblockBrief(), key(), saveUnblockBrief(), unblockBrief, src_shared_learningsubject

### Community 110 - ".emit"
Cohesion: 0.07
Nodes (36): candidateBranchMoved(), continueImplementation(), assertOwnership(), decideImplementation(), OwnershipRead, dispatchNightly(), drainDelivery(), resume() (+28 more)

### Community 111 - "ITFollowUps.tsx"
Cohesion: 0.67
Nodes (4): itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps()

### Community 112 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 113 - "work-time.ts"
Cohesion: 0.50
Nodes (3): HEARTBEAT_GAP_MS, HEARTBEAT_MS, startMeasurement()

## Knowledge Gaps
- **493 isolated node(s):** `CONTINUABLE`, `EvidenceSchema`, `ReceiptSchema`, `LegacyResultSchema`, `ResolutionSchema` (+488 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 636 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `dependency-bots/adopt.ts`, `ref_node_crypto`, `requests.ts`, `session-bridge.ts`, `accept-stage-result.ts`, `worker-runtime.ts`, `github-delivery.ts`, `features/workflow.ts`, `scheduled-captures.ts`, `run-retrospective.ts`, `record-trigger.ts`, `assignment-poll.ts`, `artifact`, `cec-reads.ts`, `github-check-selection.ts`, `coordination.ts`, `knowledge.ts`, `maintenance/maintenance.ts`, `cost-ledger.ts`, `saved-prerequisite-handoff.ts`, `jira-operations.ts`, `jira-time.ts`, `metadata-assessment.ts`, `ref_zod`, `sanitizeObject`, `github-readiness.ts`, `scheduled-work.ts`, `scheduler.ts`, `closeout-recovery.ts`, `remove-candidate.ts`, `time-scope.ts`, `run-accounting.ts`, `intent.ts`, `engine.ts`, `digest`, `assignments.ts`, `outbox.ts`, `link-draft-issue.ts`, `weekly-rollup.ts`, `shared.ts`, `control-store.ts`, `Offices`, `run.ts`, `conversations/slack.ts`, `ticket-evidence.ts`, `agents.ts`, `ControlStore`, `continue-ownership-read.ts`, `ledger.ts`, `admit-improvement.ts`, `interrupted-work-recovery.ts`, `daily-cto.ts`, `.transaction`, `.constructor`, `diagnostic-context.ts`, `lesson-selection.ts`, `ref_node_path`, `Effects`, `brain-maintenance.ts`, `it-specialist.ts`, `http/commands.ts`, `easternDay`, `cec/workflow.ts`, `GitHubDelivery`, `features.ts`, `OfficeSnapshot`, `config.ts`, `activation-recovery.ts`, `ScheduledWork`, `offices.ts`, `cto-replacement-resolution.ts`, `blocker-followups.ts`, `.emit`?**
  _High betweenness centrality (0.116) - this node is a cross-community bridge._
- **Why does `Role` connect `worker-runtime.ts` to `PeoplePanel.tsx`, `Inspector.tsx`, `accept-stage-result.ts`, `Store`, `github-delivery.ts`, `App.tsx`, `record-trigger.ts`, `cec-reads.ts`, `maintenance/maintenance.ts`, `ref_zod`, `github-readiness.ts`, `scheduler.ts`, `closeout-recovery.ts`, `run-accounting.ts`, `OfficeScene.tsx`, `outbox.ts`, `scene-motion.ts`, `link-draft-issue.ts`, `work.ts`, `shared.ts`, `conversations/slack.ts`, `agents.ts`, `diagnostic-context.ts`, `ref_node_path`, `http/commands.ts`, `cec/workflow.ts`, `GitHubDelivery`, `OfficeSnapshot`, `local-config.ts`, `.emit`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Why does `OfficeSnapshot` connect `OfficeSnapshot` to `ref_react`, `PeoplePanel.tsx`, `Inspector.tsx`, `Button`, `Store`, `App.tsx`, `record-trigger.ts`, `cec-reads.ts`, `maintenance/maintenance.ts`, `index.tsx`, `Goals.tsx`, `sanitizeObject`, `OfficeScene.tsx`, `outbox.ts`, `scene-motion.ts`, `work.ts`, `shared.ts`, `TimeBook.tsx`, `control-store.ts`, `harness-baseline.ts`, `ledger.ts`, `service-health.ts`, `interrupted-work-recovery.ts`, `diagnostic-context.ts`, `work-summary.ts`, `http/commands.ts`, `cec/workflow.ts`, `agent-activity.ts`, `offices.ts`, `cto-replacement-resolution.ts`, `office/readiness.ts`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `CONTINUABLE`, `EvidenceSchema`, `ReceiptSchema` to the rest of the system?**
  _493 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `PeoplePanel.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10204081632653061 - nodes in this community are weakly interconnected._
- **Should `dependency-bots/adopt.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06951754385964912 - nodes in this community are weakly interconnected._
- **Should `ref_node_crypto` be split into smaller, more focused modules?**
  _Cohesion score 0.09184149184149185 - nodes in this community are weakly interconnected._