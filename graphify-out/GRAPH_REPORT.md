# Graph Report - the-office  (2026-11-16)

## Corpus Check
- 826 files · ~327,030 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4051 nodes · 18682 edges · 102 communities (99 shown, 3 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 606 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b9adbae8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- index.tsx
- ref_node_path
- dependency-bots/adopt.ts
- config.ts
- Inspector.tsx
- .activeClaims
- session-bridge.ts
- MapView.tsx
- agents.ts
- Store
- worker-runtime.ts
- slack-supersession.ts
- App.tsx
- features/workflow.ts
- reader.ts
- scheduled-captures.ts
- run-retrospective.ts
- record-trigger.ts
- activation-recovery.ts
- artifact
- features.ts
- TicketJob
- Role
- harnessEffect
- knowledge.ts
- maintenance/maintenance.ts
- cost-ledger.ts
- workKey
- coordination.ts
- jira-time.ts
- digest
- useOfficePreferences.ts
- ref_zod
- learning-events.ts
- azure.ts
- Ticket
- scheduled-work.ts
- scheduler.ts
- requests.ts
- Goals.tsx
- assignment-poll.ts
- time-scope.ts
- node-visuals.ts
- run-accounting.ts
- continue-access-only-plan.ts
- Coordinator
- OfficeScene.tsx
- engine.ts
- pilot-delivery.ts
- assignments.ts
- .emit
- scene-motion.ts
- notifications.ts
- cec/workflow.ts
- work.ts
- weekly-rollup.ts
- github-delivery.ts
- TimeBook.tsx
- RoomCamera.tsx
- store.ts
- retrospective-subject.ts
- run.ts
- Effects
- remove-candidate.ts
- ticket-evidence.ts
- JiraIssuePublisher
- QuestionStepper.tsx
- daily-cto.ts
- publication.ts
- checkpoint-retry.ts
- constellation-runtime.ts
- contract.ts
- Offices
- telemetry.ts
- service-health.ts
- admit-improvement.ts
- createConstellation
- GitHubDelivery
- github/issue-publication.ts
- cost-entries.ts
- cli.ts
- checkpoint-completion.ts
- tracking-issue.ts
- install-service.mjs
- outbox.ts
- ledger.ts
- qa-plan-retry.ts
- index.ts
- packed-consumer-pnpm.ts
- interrupted-work-recovery.ts
- intent.ts
- blocker-followups.ts
- capture-session-clone.py
- Outbox.tsx
- .save
- create-candidate.ts
- CommittedBrain
- ProjectProgress
- shared.ts
- highestStableAtLeast
- extract-worker.mjs
- command-registry.ts

## God Nodes (most connected - your core abstractions)
1. `Store` - 365 edges
2. `TicketJob` - 169 edges
3. `digest()` - 150 edges
4. `GitHubDelivery` - 115 edges
5. `command()` - 115 edges
6. `artifact()` - 114 edges
7. `workKey()` - 94 edges
8. `OfficeSnapshot` - 88 edges
9. `currentAssignment()` - 88 edges
10. `cx()` - 88 edges

## Surprising Connections (you probably didn't know these)
- `DeliverySlot` --references--> `Role`  [EXTRACTED]
  server/office/projects.ts → src/shared.ts
- `apply()` --indirect_call--> `note()`  [INFERRED]
  src/conversations/OutboxSavedImplementation.tsx → server/cec/parking/resume-parked.ts
- `EffectOperation` --references--> `WorkRef`  [EXTRACTED]
  server/store/effects.ts → src/contracts/work.ts
- `RetrospectiveSubject` --references--> `QueueTiming`  [EXTRACTED]
  server/knowledge/retrospective-subject.ts → src/contracts/work.ts
- `ScheduledWork` --inherits--> `ProgressionItem`  [EXTRACTED]
  server/scheduling/scheduler.ts → src/contracts/work.ts

## Import Cycles
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/review-wait.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/parking/resume-provider-review.ts -> server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/parking/resume-provider-review.ts`
- 3-file cycle: `server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts`
- 4-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/readiness/review-wait.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 4-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 4-file cycle: `server/delivery/recovery/implementation/saved-prerequisite-handoff.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/implementation/saved-prerequisite-handoff.ts`
- 4-file cycle: `server/delivery/recovery/implementation/activation-recovery.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/implementation/activation-recovery.ts`
- 4-file cycle: `server/delivery/recovery/validation/validation-readback.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/validation/validation-readback.ts`
- 4-file cycle: `server/delivery/recovery/stopped-base-review.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/stopped-base-review.ts`
- 4-file cycle: `server/features/delivery-binding.ts -> server/features/enrollment-gate.ts -> server/features/progression/failure.ts -> server/store/effects.ts -> server/features/delivery-binding.ts`
- 5-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/stage-reconciliation.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 5-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 5-file cycle: `server/delivery/recovery/implementation/continuation-evidence.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/recovery/implementation/continuation-evidence.ts`
- 5-file cycle: `server/delivery/recovery/implementation/saved-prerequisite-handoff.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/recovery/implementation/saved-prerequisite-handoff.ts`
- 5-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/scope-repair/scope-repair-resume.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 5-file cycle: `server/delivery/recovery/scope-repair/scope-repair-readback.ts -> server/delivery/recovery/scope-repair/scope-repair-resume.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/scope-repair/scope-repair-readback.ts`
- 5-file cycle: `server/delivery/recovery/implementation/continuation-evidence.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/implementation/implementation-recovery.ts -> server/delivery/recovery/implementation/continuation-evidence.ts`
- 5-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/closeout/github-closeout.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`

## Communities (102 total, 3 thin omitted)

### Community 0 - "index.tsx"
Cohesion: 0.11
Nodes (46): ref_react, TicketPlanningAction(), SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), loadOfficeConfig(), OfficeConfigSection() (+38 more)

### Community 1 - "ref_node_path"
Cohesion: 0.07
Nodes (69): ref_node_fs, ref_node_os, ref_node_path, ref_node_util, interruptedImplementation(), verifyContinuationPreservation(), continueUnsealedQA(), entry() (+61 more)

### Community 2 - "dependency-bots/adopt.ts"
Cohesion: 0.14
Nodes (27): Execute, adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR, inPickupLane() (+19 more)

### Community 3 - "config.ts"
Cohesion: 0.10
Nodes (42): ref_node_crypto, ref_node_url, featureItemComplete(), reconcileFeatureCompletion(), discoveryPrompt(), planPrompt(), readEvidence(), helperTelemetry() (+34 more)

### Community 4 - "Inspector.tsx"
Cohesion: 0.11
Nodes (63): blockedSummary(), itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps(), ServiceHealthPanel(), followUp(), labels (+55 more)

### Community 5 - ".activeClaims"
Cohesion: 0.07
Nodes (53): ownershipReadHistory(), deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, requireDeliveryAuthority(), deliveryIntakeBlocker(), gateRegisteredDelivery() (+45 more)

### Community 6 - "session-bridge.ts"
Cohesion: 0.06
Nodes (54): ref_node_perf_hooks, ref_ws, claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexDaemonProcesses(), accountCodexProcesses() (+46 more)

### Community 7 - "MapView.tsx"
Cohesion: 0.07
Nodes (58): ref_react_markdown, ref_remark_gfm, ref_yaml, KnowledgeActivity, KnowledgeActivityPage, KnowledgeEdge, KnowledgeMap, KnowledgeNode (+50 more)

### Community 8 - "agents.ts"
Cohesion: 0.05
Nodes (55): IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), intakeMembership(), projectListScope(), cecIntakePrompt(), cecReadbackPrompt() (+47 more)

### Community 9 - "Store"
Cohesion: 0.08
Nodes (16): Execute, GitHubFeaturePublisher, JiraFeaturePublisher, Result, Assessment, officeCapacity, Store, inactivityWatch() (+8 more)

### Community 10 - "worker-runtime.ts"
Cohesion: 0.06
Nodes (46): candidateWorkspaceEnvironment(), ApproachSchema, assignmentSubject(), dispatchExposure(), prepareExposure(), lessonPurpose(), selectLessons(), catalogLine() (+38 more)

### Community 11 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 12 - "App.tsx"
Cohesion: 0.06
Nodes (54): ref_lucide_react, ref_motion, ref_react_dom, assignmentDiagnostics(), diagnosticContext(), itAgent(), itDiagnostics(), currentServices() (+46 more)

### Community 13 - "features/workflow.ts"
Cohesion: 0.08
Nodes (48): approveFeature(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), artifactPath(), digest(), document() (+40 more)

### Community 14 - "reader.ts"
Cohesion: 0.10
Nodes (32): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, GraphNode (+24 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.16
Nodes (44): requestDelivery(), createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest (+36 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.10
Nodes (38): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, blockingTrigger, brainOverlap, brainOverlapQuery() (+30 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.09
Nodes (45): isBlocking(), baselineLearning(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences(), busyMaintenanceIds(), clip() (+37 more)

### Community 18 - "activation-recovery.ts"
Cohesion: 0.15
Nodes (27): SourceClosed, classifyStop(), stopReason(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation() (+19 more)

### Community 19 - "artifact"
Cohesion: 0.08
Nodes (70): containedFile(), partialLocalCleanupCandidate(), savedActivationFailure(), assertContinuationWorker(), assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence() (+62 more)

### Community 20 - "features.ts"
Cohesion: 0.10
Nodes (41): commandFeature(), reviewQuestions(), confirmBrief(), FeaturePlanningBindings, assertQuestionVisibility(), applyHarnessAction(), HarnessActionInput, recoveryPreconditions() (+33 more)

### Community 21 - "TicketJob"
Cohesion: 0.11
Nodes (37): removeAdoptedClone(), namedRepairIds(), StagePromptInput, METADATA_FINDING_GUIDANCE, stoppedBaseCheckout(), assertStoppedBaseApproach(), stoppedBaseNextStage(), stoppedBasePackageInstruction() (+29 more)

### Community 22 - "Role"
Cohesion: 0.10
Nodes (42): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+34 more)

### Community 23 - "harnessEffect"
Cohesion: 0.24
Nodes (22): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), ProjectCard, projectCards(), projectGraphql() (+14 more)

### Community 24 - "knowledge.ts"
Cohesion: 0.05
Nodes (61): normalizeStatement(), LessonBrainOverlap, INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, LessonSelection, MAINTENANCE (+53 more)

### Community 25 - "maintenance/maintenance.ts"
Cohesion: 0.09
Nodes (30): maintenancePolicies(), captureMaintenanceStep(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, BrainStatusSchema, capped(), queueMaintenanceNotice() (+22 more)

### Community 26 - "cost-ledger.ts"
Cohesion: 0.14
Nodes (28): server_telemetry_cost_entries_costcoveragesummary, costLedger(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId(), OutsideEdit, publishCost() (+20 more)

### Community 27 - "workKey"
Cohesion: 0.06
Nodes (66): completedPRReviews(), adoptCandidate(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related (+58 more)

### Community 28 - "coordination.ts"
Cohesion: 0.08
Nodes (41): reconcileNoticeConfirmations(), Admission, admit(), IntakeContext, WAIT_STATUSES, compatible(), dependencyCompletionKey(), dependencyEligibility() (+33 more)

### Community 29 - "jira-time.ts"
Cohesion: 0.14
Nodes (20): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+12 more)

### Community 30 - "digest"
Cohesion: 0.11
Nodes (53): activeEffectId(), retryRead(), assertDraftClaimHistory(), linkDraftIssue(), protectedOriginalClaim(), admitPRMetadata(), assessPRMetadata(), captureAssessment() (+45 more)

### Community 31 - "useOfficePreferences.ts"
Cohesion: 0.11
Nodes (19): PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, acceptPreferences(), PreferenceCandidate, PreferenceState (+11 more)

### Community 32 - "ref_zod"
Cohesion: 0.09
Nodes (27): ref_zod, assertConversationReadback(), Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+19 more)

### Community 33 - "learning-events.ts"
Cohesion: 0.30
Nodes (10): improvementIntakeGate(), captureLearning(), learningDigest(), recordLearningOpportunity(), citations(), recordAcceptedKnowledge(), stageName(), knowledgeCitation() (+2 more)

### Community 34 - "azure.ts"
Cohesion: 0.12
Nodes (27): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+19 more)

### Community 35 - "Ticket"
Cohesion: 0.20
Nodes (13): CommentPage, commentReadback(), Assignment, Content, jiraText(), Transition, JiraOperations, plain() (+5 more)

### Community 36 - "scheduled-work.ts"
Cohesion: 0.07
Nodes (45): ref_node_async_hooks, freshOwnershipRead(), deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), Ownership, ownershipContext, refreshDeliveryOwnership() (+37 more)

### Community 37 - "scheduler.ts"
Cohesion: 0.15
Nodes (15): ROLES, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch(), deliveryOccupied() (+7 more)

### Community 38 - "requests.ts"
Cohesion: 0.09
Nodes (48): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+40 more)

### Community 39 - "Goals.tsx"
Cohesion: 0.14
Nodes (19): SendMessage, CTOReview(), goalState, DailyCTO(), reportDate(), reviewStatus, GoalList(), card() (+11 more)

### Community 40 - "assignment-poll.ts"
Cohesion: 0.36
Nodes (8): noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), admitReadyCards(), resumeParked(), holdAssessmentIntake(), poll(), readAssignments()

### Community 41 - "time-scope.ts"
Cohesion: 0.17
Nodes (24): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), midnight(), TicketDay (+16 more)

### Community 42 - "node-visuals.ts"
Cohesion: 0.20
Nodes (13): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+5 more)

### Community 43 - "run-accounting.ts"
Cohesion: 0.06
Nodes (58): BoundedRead, done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf(), CompletionReader, add() (+50 more)

### Community 44 - "continue-access-only-plan.ts"
Cohesion: 0.57
Nodes (5): Document, isAccessOnlyPlan(), settledAccessOnlyState(), continueAccessOnlyPlan(), entryExists()

### Community 45 - "Coordinator"
Cohesion: 0.08
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 46 - "OfficeScene.tsx"
Cohesion: 0.17
Nodes (32): Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk(), ElevatorStage() (+24 more)

### Community 47 - "engine.ts"
Cohesion: 0.07
Nodes (16): correlatedBuild(), checkMail(), drainMail(), requestMail(), ingest(), GitHubMonitor, GOAL_EVIDENCE_LIMITS, drainMaintenance() (+8 more)

### Community 48 - "pilot-delivery.ts"
Cohesion: 0.14
Nodes (30): candidateBranchMoved(), continueImplementation(), dispatchNightly(), drainDelivery(), enableNightly(), resume(), startPilot(), OfficeQAHandoffInput (+22 more)

### Community 49 - "assignments.ts"
Cohesion: 0.10
Nodes (26): clip(), DEMAND_LIMIT, demandFacts(), DemandSection, key(), LessonKey, notes(), assignmentLookups (+18 more)

### Community 50 - ".emit"
Cohesion: 0.16
Nodes (23): decideImplementation(), requestQAPlanRetry(), configureChannelNotices(), configureNotices(), retryRecipientLookup(), recoverCTOInput(), bindDiscoveryResume(), DiscoveryResumeInput (+15 more)

### Community 51 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 52 - "notifications.ts"
Cohesion: 0.12
Nodes (22): channelNoticeAuthorized(), ChannelSettings, notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR, plainSlackText() (+14 more)

### Community 53 - "cec/workflow.ts"
Cohesion: 0.07
Nodes (52): implementationWorkerContext(), applyIntakeObservation(), parksInJira(), cecPrompt(), resolvedDecisionNote(), stageInstructions, reviewedPlanGuidance, reviewedPlanGuideDigest (+44 more)

### Community 54 - "work.ts"
Cohesion: 0.06
Nodes (44): BLOCKED_CAUSES, blockedCauses(), projectReadiness(), baselineReport, BaselineSource, baselineText(), millions(), row() (+36 more)

### Community 55 - "weekly-rollup.ts"
Cohesion: 0.13
Nodes (28): learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), RollupResult (+20 more)

### Community 56 - "github-delivery.ts"
Cohesion: 0.05
Nodes (107): findingsBlock(), assertDeliveryMayMutate(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery(), BOARD_RULE, conflictRefreshInstruction() (+99 more)

### Community 57 - "TimeBook.tsx"
Cohesion: 0.08
Nodes (46): displayAgentTask(), githubStageLabels, withoutElapsed(), LiveAgentTask(), Props, RunningTask(), text(), Agent (+38 more)

### Community 58 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (10): ref_react_three_drei, ref_react_three_fiber, ref_three_stdlib, CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility (+2 more)

### Community 59 - "store.ts"
Cohesion: 0.08
Nodes (23): ref_node_sqlite, Candidate, recordedPush(), Clock, sanitize(), applyConnectionSettings(), closeConnection(), optimizeOnOpen() (+15 more)

### Community 60 - "retrospective-subject.ts"
Cohesion: 0.14
Nodes (21): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+13 more)

### Community 61 - "run.ts"
Cohesion: 0.12
Nodes (25): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_FIX_PROMPT, OfficeFixResult (+17 more)

### Community 62 - "Effects"
Cohesion: 0.19
Nodes (13): diagnosticProof(), ownedArtifact(), rawHash(), recoverDiscovery(), scopeNote(), GitHubOperations, fileLessonIssue(), lessonIssueBody() (+5 more)

### Community 63 - "remove-candidate.ts"
Cohesion: 0.18
Nodes (18): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot() (+10 more)

### Community 64 - "ticket-evidence.ts"
Cohesion: 0.11
Nodes (31): ref_node_child_process, ref_node_string_decoder, assetDownloader(), attachmentKind(), evidenceDirectory(), storeEvidence(), blankEvidence(), CoverageState (+23 more)

### Community 65 - "JiraIssuePublisher"
Cohesion: 0.24
Nodes (5): JiraIssuePublisher, keyOf(), descriptionPreimage(), plain(), publicationDescription()

### Community 66 - "QuestionStepper.tsx"
Cohesion: 0.19
Nodes (18): FeatureQuestionProjection, OutboxQuestionRound(), send(), draftKey(), readDraft(), saveDraft(), QuestionRound(), nextQuestion() (+10 more)

### Community 67 - "daily-cto.ts"
Cohesion: 0.05
Nodes (50): githubPRDescription(), leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), collectCTOFacts(), DailyCTO, EvidenceRequestConflict (+42 more)

### Community 68 - "publication.ts"
Cohesion: 0.16
Nodes (11): featureById(), Link, linkFeature(), publishFeature(), reconcilePublication(), uncertainPublications(), reserveIdentity(), FeatureReviewRunner (+3 more)

### Community 69 - "checkpoint-retry.ts"
Cohesion: 0.29
Nodes (9): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), legacy, validateNativeContinuation(), Continuation (+1 more)

### Community 70 - "constellation-runtime.ts"
Cohesion: 0.15
Nodes (17): ref_3d_force_graph, ref_three, CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point (+9 more)

### Community 71 - "contract.ts"
Cohesion: 0.16
Nodes (16): Event, one(), prePushRejection(), PushIdentity, settledPushBoundary(), At, errno, GroupInventory (+8 more)

### Community 72 - "Offices"
Cohesion: 0.18
Nodes (7): ref_smol_toml, file, project, root, projectById(), projectData(), Offices

### Community 73 - "telemetry.ts"
Cohesion: 0.15
Nodes (21): CostCompleteness, CostEntry, ISSUE_KEY, TelemetryReport, TelemetryRow, TelemetrySync, UsageCompleteness, UsageSource (+13 more)

### Community 74 - "service-health.ts"
Cohesion: 0.19
Nodes (9): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, slackHealth() (+1 more)

### Community 75 - "admit-improvement.ts"
Cohesion: 0.21
Nodes (16): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+8 more)

### Community 76 - "createConstellation"
Cohesion: 0.19
Nodes (5): ConstellationRuntime, createConstellation(), enter(), finishTap(), move()

### Community 77 - "GitHubDelivery"
Cohesion: 0.10
Nodes (23): harnessCloseout(), PASSING, verifyMergeActions(), HarnessControl, withHarnessWork(), runHarnessStage(), harnessStageResult(), receipt() (+15 more)

### Community 78 - "github/issue-publication.ts"
Cohesion: 0.16
Nodes (10): FeaturePublisher, PublicationReceipt, Assign, Board, Content, GitHubIssuePublisher, number(), same() (+2 more)

### Community 79 - "cost-entries.ts"
Cohesion: 0.24
Nodes (10): server_telemetry_billable_work_issue_key, captureCost(), summary(), awaitingEvidence(), CaptureContext, inCostWindow(), TicketCost, ticketCosts() (+2 more)

### Community 80 - "cli.ts"
Cohesion: 0.20
Nodes (8): ref_node_stream, ref_node_timers, args, [cmd,...rawArgs], commands, key, projectIndex, lessonBrainAudit

### Community 81 - "checkpoint-completion.ts"
Cohesion: 0.32
Nodes (5): brainCheckpointCompletion(), coverageSchema, followupSchema, verified, reconcileCompletedCheckpoints()

### Community 82 - "tracking-issue.ts"
Cohesion: 0.19
Nodes (17): readBackOrThrow(), ensureTrackingIssue(), findTrackingIssue(), ownTracking(), TrackingIssue, trackingIssueBody(), trackingIssueTitle(), trackingMarker() (+9 more)

### Community 83 - "install-service.mjs"
Cohesion: 0.33
Nodes (4): file, folder, logs, root

### Community 84 - "outbox.ts"
Cohesion: 0.12
Nodes (26): ADOPTION_STALLED_MS, projectOutbox(), syncOutbox(), projectSlackDeliveries(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint() (+18 more)

### Community 85 - "ledger.ts"
Cohesion: 0.23
Nodes (13): ctoInputIdentityMatches(), ctoInputRecovered(), investigationCandidates(), investigationId(), ctoReplacementResolution(), investigationFollowUps(), implementationReplacementResolution(), investigationResolution() (+5 more)

### Community 86 - "qa-plan-retry.ts"
Cohesion: 0.67
Nodes (3): QAPlanRetry, QAPlanRetryProof, QAPlanRetryRequest

### Community 87 - "index.ts"
Cohesion: 0.06
Nodes (51): ref_hono_node_server, ref_node_http, ref_vite, implementationPreview(), implementationContinuationRoute(), closedReadonlyPlan(), Document, entryExists() (+43 more)

### Community 89 - "interrupted-work-recovery.ts"
Cohesion: 0.36
Nodes (7): interruptAdoptions(), legacy(), REMOVED_FIELDS, retireLegacyRecovery(), goalNoticeNeverDispatched(), maintenanceNoticeNeverDispatched(), recover()

### Community 90 - "intent.ts"
Cohesion: 0.08
Nodes (41): GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles(), ContinuationIO (+33 more)

### Community 92 - "blocker-followups.ts"
Cohesion: 0.12
Nodes (28): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), partialLocalCleanupKey(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved() (+20 more)

### Community 95 - "capture-session-clone.py"
Cohesion: 0.15
Nodes (10): ctypes, errno, importlib_util, json, os, pathlib, Copy a coherent macOS clone of inherited reader fd3 to anonymous target fd4. No…, Read-only protocol adapter for the installed review helper. No model dispatch. (+2 more)

### Community 97 - "Outbox.tsx"
Cohesion: 0.07
Nodes (46): Conversation(), LessonDecisionAction, lessonDecisionState(), readLessonDecision(), DAYS, dueLessonDecisions(), easternWeek(), isLessonDecision() (+38 more)

### Community 98 - ".save"
Cohesion: 0.18
Nodes (30): jiraCollection(), BLOCKED, findComment(), LiveIssue, readIssue(), readIssues(), Execute, jira() (+22 more)

### Community 99 - "create-candidate.ts"
Cohesion: 0.26
Nodes (10): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+2 more)

### Community 103 - "shared.ts"
Cohesion: 0.06
Nodes (49): compactSteps(), DailyCTOSummary, OfficeQAReport, QAPlanContinuation, FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace() (+41 more)

### Community 104 - "highestStableAtLeast"
Cohesion: 0.83
Nodes (3): compare(), highestStableAtLeast(), parts()

### Community 105 - "extract-worker.mjs"
Cohesion: 0.43
Nodes (6): ref_mammoth, ref_pdfjs_dist, bounded(), extract(), fail(), [path,kind]

### Community 111 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

## Knowledge Gaps
- **482 isolated node(s):** `reviewWait`, `WorkKind`, `DeliveryAdmission`, `CompletionCondition`, `EligibilityState` (+477 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 621 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `ref_node_path`, `dependency-bots/adopt.ts`, `config.ts`, `.activeClaims`, `session-bridge.ts`, `agents.ts`, `worker-runtime.ts`, `App.tsx`, `features/workflow.ts`, `reader.ts`, `scheduled-captures.ts`, `run-retrospective.ts`, `record-trigger.ts`, `activation-recovery.ts`, `artifact`, `features.ts`, `TicketJob`, `harnessEffect`, `knowledge.ts`, `maintenance/maintenance.ts`, `cost-ledger.ts`, `workKey`, `coordination.ts`, `jira-time.ts`, `digest`, `ref_zod`, `learning-events.ts`, `azure.ts`, `Ticket`, `scheduled-work.ts`, `scheduler.ts`, `requests.ts`, `time-scope.ts`, `run-accounting.ts`, `continue-access-only-plan.ts`, `engine.ts`, `pilot-delivery.ts`, `assignments.ts`, `.emit`, `notifications.ts`, `cec/workflow.ts`, `weekly-rollup.ts`, `github-delivery.ts`, `TimeBook.tsx`, `store.ts`, `retrospective-subject.ts`, `run.ts`, `Effects`, `remove-candidate.ts`, `ticket-evidence.ts`, `daily-cto.ts`, `publication.ts`, `checkpoint-retry.ts`, `admit-improvement.ts`, `GitHubDelivery`, `github/issue-publication.ts`, `cost-entries.ts`, `checkpoint-completion.ts`, `tracking-issue.ts`, `outbox.ts`, `ledger.ts`, `index.ts`, `interrupted-work-recovery.ts`, `intent.ts`, `blocker-followups.ts`, `.save`, `create-candidate.ts`, `shared.ts`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Why does `Role` connect `Role` to `Inspector.tsx`, `agents.ts`, `Store`, `worker-runtime.ts`, `App.tsx`, `maintenance/maintenance.ts`, `ref_zod`, `scheduler.ts`, `run-accounting.ts`, `OfficeScene.tsx`, `.emit`, `scene-motion.ts`, `cec/workflow.ts`, `work.ts`, `github-delivery.ts`, `TimeBook.tsx`, `store.ts`, `retrospective-subject.ts`, `GitHubDelivery`, `outbox.ts`, `index.ts`, `Outbox.tsx`, `shared.ts`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `workKey()` connect `workKey` to `ref_node_path`, `.activeClaims`, `features/workflow.ts`, `artifact`, `harnessEffect`, `coordination.ts`, `digest`, `scheduled-work.ts`, `scheduler.ts`, `requests.ts`, `work.ts`, `github-delivery.ts`, `store.ts`, `run.ts`, `Effects`, `remove-candidate.ts`, `GitHubDelivery`, `checkpoint-completion.ts`, `tracking-issue.ts`, `interrupted-work-recovery.ts`, `blocker-followups.ts`, `shared.ts`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **What connects `reviewWait`, `WorkKind`, `DeliveryAdmission` to the rest of the system?**
  _482 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `index.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10906298003072197 - nodes in this community are weakly interconnected._
- **Should `ref_node_path` be split into smaller, more focused modules?**
  _Cohesion score 0.07051282051282051 - nodes in this community are weakly interconnected._
- **Should `dependency-bots/adopt.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1365079365079365 - nodes in this community are weakly interconnected._