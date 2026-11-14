# Graph Report - office-cec-resume-routing-nov14  (2026-11-14)

## Corpus Check
- 791 files · ~324,077 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4005 nodes · 18674 edges · 104 communities (96 shown, 8 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 601 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `79739e79`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ref_node_path
- github-delivery.ts
- currentAssignment
- completedExecution
- MapView.tsx
- Inspector.tsx
- session-bridge.ts
- Role
- digest
- index.tsx
- features.ts
- .emit
- scheduled-captures.ts
- agents.ts
- worker-runtime.ts
- it-specialist.ts
- goal-reviews.ts
- source-amendment.ts
- reader.ts
- knowledge.ts
- index.ts
- run-retrospective.ts
- Button
- shared.ts
- TimeBook.tsx
- features/commands.ts
- dependencies.ts
- GitHubDelivery
- work-summary.ts
- PeoplePanel.tsx
- OfficeSnapshot
- App.tsx
- cec/issue-publication.ts
- cec/workflow.ts
- config.ts
- sanitizeObject
- scheduled-work.ts
- time-scope.ts
- ref_zod
- source-amendment-scope.ts
- record-trigger.ts
- run.ts
- .save
- OfficeScene.tsx
- maintenance/maintenance.ts
- candidate.ts
- dependency-bots/adopt.ts
- QuestionStepper.tsx
- admit-improvement.ts
- contract.ts
- weekly-rollup.ts
- cost-ledger.ts
- http/commands.ts
- Goals.tsx
- ticket-evidence.ts
- cec-reads.ts
- engine.ts
- assignment-poll.ts
- outbox.ts
- work.ts
- Offices
- remove-candidate.ts
- telemetry.ts
- jira-time.ts
- lesson-selection.ts
- assignments.ts
- constellation-runtime.ts
- Coordinator
- Store
- knowledge-views.ts
- coordination.ts
- offices.ts
- control-store.ts
- Engine
- node-visuals.ts
- blocker-followups.ts
- intent.ts
- scene-motion.ts
- run-accounting.ts
- report.ts
- capture-session-clone.py
- RoomCamera.tsx
- price-table.ts
- time-readback.ts
- channel-notice.ts
- live-reach.ts
- create-candidate.ts
- owned-artifact.ts
- codex-rollout.ts
- codex-rollout-file.ts
- CommandRegistry
- extract-worker.mjs
- record-push.ts
- install-service.mjs
- cec-implementation-continuation.ts
- slack-supersession.ts
- helper-usage.ts
- packed-consumer-pnpm.ts
- server_delivery_harness_delivery_authority_resolvedeliverywork
- server_features_questions_pending_round_pendinground
- server_features_questions_pending_round_pendingrounds
- server_features_questions_pending_round_roundauthor
- src_shared_personas
- src_shared_workkey

## God Nodes (most connected - your core abstractions)
1. `Store` - 354 edges
2. `TicketJob` - 174 edges
3. `digest()` - 165 edges
4. `artifact()` - 129 edges
5. `GitHubDelivery` - 122 edges
6. `command()` - 110 edges
7. `workKey()` - 101 edges
8. `cx()` - 88 edges
9. `currentAssignment()` - 84 edges
10. `Button` - 84 edges

## Surprising Connections (you probably didn't know these)
- `apply()` --indirect_call--> `note()`  [INFERRED]
  src/conversations/OutboxSavedImplementation.tsx → server/cec/parking/resume-parked.ts
- `projectOutbox()` --calls--> `deferredPickup()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/pickup-state.ts
- `projectOutbox()` --calls--> `parkedProviderWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts
- `projectOutbox()` --calls--> `readinessWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts
- `replacementContext()` --calls--> `slackMessageUrl()`  [EXTRACTED]
  server/conversations/slack/supersession-proof.ts → src/shared.ts

## Import Cycles
- 3-file cycle: `server/delivery/parking/resume-provider-review.ts -> server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/parking/resume-provider-review.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts`
- 4-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 4-file cycle: `server/delivery/recovery/implementation/activation-recovery.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/implementation/activation-recovery.ts`
- 4-file cycle: `server/delivery/recovery/implementation/saved-prerequisite-handoff.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/implementation/saved-prerequisite-handoff.ts`
- 4-file cycle: `server/delivery/recovery/scope-repair/scope-repair-readback.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/scope-repair/scope-repair-readback.ts`
- 4-file cycle: `server/delivery/recovery/source-amendment/source-amendment.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/source-amendment/source-amendment.ts`
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

## Communities (104 total, 8 thin omitted)

### Community 0 - "ref_node_path"
Cohesion: 0.04
Nodes (181): ref_node_fs, ref_node_os, ref_node_path, ref_node_util, blob(), Execute, inspectPartialWorktree(), partialLocalCleanupCandidate() (+173 more)

### Community 1 - "github-delivery.ts"
Cohesion: 0.06
Nodes (97): containedFile(), findingsBlock(), namedRepairIds(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery(), discover() (+89 more)

### Community 2 - "currentAssignment"
Cohesion: 0.08
Nodes (53): deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, requireDeliveryAuthority(), deliveryIntakeBlocker(), gateRegisteredDelivery(), accounting (+45 more)

### Community 3 - "completedExecution"
Cohesion: 0.12
Nodes (47): activeEffectId(), retryRead(), admitPRMetadata(), METADATA_FINDING, assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema (+39 more)

### Community 4 - "MapView.tsx"
Cohesion: 0.09
Nodes (43): ref_motion, ref_react_markdown, ref_remark_gfm, Activity(), ActivityTimeline(), AssignmentKnowledge(), Lookup(), BrainWorkspace() (+35 more)

### Community 5 - "Inspector.tsx"
Cohesion: 0.11
Nodes (59): blockedSummary(), itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps(), ServiceHealthPanel(), followUp(), labels (+51 more)

### Community 6 - "session-bridge.ts"
Cohesion: 0.06
Nodes (54): ref_node_perf_hooks, ref_ws, claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexDaemonProcesses(), accountCodexProcesses() (+46 more)

### Community 7 - "Role"
Cohesion: 0.09
Nodes (23): ROLES, Clock, LOCAL_BINDINGS, DeliverySlot, officeCapacity, fifo(), ScheduledWork, Scheduler (+15 more)

### Community 8 - "digest"
Cohesion: 0.08
Nodes (57): ctoInputRecovered(), removeAdoptedClone(), pinCourier, pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), admitGreen156(), enqueueGreen156(), GREEN156 (+49 more)

### Community 9 - "index.tsx"
Cohesion: 0.09
Nodes (29): FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures(), buttonClasses(), ButtonLayout (+21 more)

### Community 10 - "features.ts"
Cohesion: 0.06
Nodes (64): ref_node_crypto, ref_node_url, approveFeature(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), artifactPath() (+56 more)

### Community 11 - ".emit"
Cohesion: 0.07
Nodes (36): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+28 more)

### Community 12 - "scheduled-captures.ts"
Cohesion: 0.15
Nodes (45): requestDelivery(), createFeature(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest, captureRequests() (+37 more)

### Community 13 - "agents.ts"
Cohesion: 0.08
Nodes (33): cecChatPrompt(), ctoChatPrompt(), itChatPrompt(), slackSendPrompt(), slackVerifyPrompt(), SlackResultSchema, SlackVerificationSchema, HANDS_OFF_RESOLUTION_GUIDANCE (+25 more)

### Community 14 - "worker-runtime.ts"
Cohesion: 0.08
Nodes (36): candidateWorkspaceEnvironment(), assignmentSubject(), LessonSelection, catalogLine(), CODEX_DEFAULT_EFFORT, CODEX_DEFAULT_MODEL, CODEX_EFFORTS, CODEX_ROLES (+28 more)

### Community 15 - "it-specialist.ts"
Cohesion: 0.08
Nodes (33): boardPreflightCandidate(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), stoppedBaseUpdateCandidate(), repeatConflictRepairUnresolved(), assignmentDiagnostics(), recoverBoardPreflights() (+25 more)

### Community 16 - "goal-reviews.ts"
Cohesion: 0.09
Nodes (31): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+23 more)

### Community 17 - "source-amendment.ts"
Cohesion: 0.07
Nodes (73): ref_node_async_hooks, adoptCandidate(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related (+65 more)

### Community 18 - "reader.ts"
Cohesion: 0.07
Nodes (40): ref_yaml, knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader (+32 more)

### Community 19 - "knowledge.ts"
Cohesion: 0.05
Nodes (50): ref_node_stream, ref_node_timers, args, [cmd,...rawArgs], commands, key, projectIndex, curateLesson() (+42 more)

### Community 20 - "index.ts"
Cohesion: 0.06
Nodes (50): ref_hono_node_server, ref_node_http, ref_vite, implementationPreview(), implementationContinuationRoute(), AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), close() (+42 more)

### Community 21 - "run-retrospective.ts"
Cohesion: 0.08
Nodes (53): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, blockingTrigger, isBlocking(), brainOverlap (+45 more)

### Community 22 - "Button"
Cohesion: 0.13
Nodes (39): ref_react, TicketPlanningAction(), SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), loadOfficeConfig(), OfficeConfigSection() (+31 more)

### Community 23 - "shared.ts"
Cohesion: 0.04
Nodes (84): Execute, installDependencies(), major(), harnessCloseout(), PASSING, verifyMergeActions(), harnessEffect, assertDeliveryMayMutate() (+76 more)

### Community 24 - "TimeBook.tsx"
Cohesion: 0.09
Nodes (44): TelemetryReport, displayAgentTask(), LiveAgentTask(), Props, RunningTask(), text(), Agent, AzureBuild (+36 more)

### Community 25 - "features/commands.ts"
Cohesion: 0.14
Nodes (24): commandFeature(), featureById(), reviewQuestions(), assertEnrollable(), Link, linkFeature(), FeaturePlanningBindings, assertQuestionVisibility() (+16 more)

### Community 26 - "dependencies.ts"
Cohesion: 0.14
Nodes (22): MergeNotifications, Admission, admit(), IntakeContext, WAIT_STATUSES, compatible(), dependencyCompletionKey(), dependencyEligibility() (+14 more)

### Community 27 - "GitHubDelivery"
Cohesion: 0.08
Nodes (43): closeoutReceipt(), GitHubDelivery, assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2 (+35 more)

### Community 28 - "work-summary.ts"
Cohesion: 0.19
Nodes (19): compactSteps(), deliveryRepairProjection(), ACTIVE, maintenanceUpdate(), PMQueueItem, pmQueueItems(), deliveryChanges(), following (+11 more)

### Community 29 - "PeoplePanel.tsx"
Cohesion: 0.10
Nodes (42): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+34 more)

### Community 30 - "OfficeSnapshot"
Cohesion: 0.11
Nodes (35): Conversation(), LessonDecisionAction, lessonDecisionState(), readLessonDecision(), Outbox(), ctoInputFailure(), OutboxCTOInput(), recover() (+27 more)

### Community 31 - "App.tsx"
Cohesion: 0.07
Nodes (48): ref_lucide_react, ref_react_dom, itAgent(), itDiagnostics(), BrainDrawer(), themeColor, App(), BrainWorkspace (+40 more)

### Community 32 - "cec/issue-publication.ts"
Cohesion: 0.08
Nodes (24): Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), Transition, descriptionPreimage(), plain() (+16 more)

### Community 33 - "cec/workflow.ts"
Cohesion: 0.10
Nodes (35): applyIntakeObservation(), checkMail(), drainMail(), requestMail(), parksInJira(), MISSING_INTAKE, reconcileMailbox(), unusedMailbox() (+27 more)

### Community 34 - "config.ts"
Cohesion: 0.11
Nodes (39): featureItemComplete(), reconcileFeatureCompletion(), discoveryPrompt(), planPrompt(), helperTelemetry(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS (+31 more)

### Community 35 - "sanitizeObject"
Cohesion: 0.11
Nodes (30): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+22 more)

### Community 36 - "scheduled-work.ts"
Cohesion: 0.14
Nodes (26): deliverySlot(), packed165SetupReady(), metadataRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), requestPriority(), closedTicketRequest() (+18 more)

### Community 37 - "time-scope.ts"
Cohesion: 0.14
Nodes (29): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), server_telemetry_billable_work_issue_key, isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence() (+21 more)

### Community 38 - "ref_zod"
Cohesion: 0.11
Nodes (21): ref_zod, reconcileNoticeConfirmations(), PrerequisitesSchema, BrainStatusSchema, identity, brainCheckpointCompletion(), coverageSchema, followupSchema (+13 more)

### Community 39 - "source-amendment-scope.ts"
Cohesion: 0.10
Nodes (28): approvedText(), assert(), capture, generation, GenerationContext, head, ids, Legacy (+20 more)

### Community 40 - "record-trigger.ts"
Cohesion: 0.10
Nodes (40): learningDigest(), baselineLearning(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences(), clip(), maintenanceBlockedId() (+32 more)

### Community 41 - "run.ts"
Cohesion: 0.10
Nodes (33): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationCandidates(), investigationId(), investigationEvidence(), investigationFollowUps(), INVOCATION_SOURCE_REFS, invocationSource() (+25 more)

### Community 42 - ".save"
Cohesion: 0.09
Nodes (42): correlatedBuild(), jiraCollection(), BLOCKED, findComment(), LiveIssue, readIssue(), readIssues(), Execute (+34 more)

### Community 43 - "OfficeScene.tsx"
Cohesion: 0.16
Nodes (34): withoutElapsed(), Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk() (+26 more)

### Community 44 - "maintenance/maintenance.ts"
Cohesion: 0.09
Nodes (31): maintenancePolicies(), captureLearning(), recordLearningOpportunity(), captureMaintenanceStep(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped() (+23 more)

### Community 45 - "candidate.ts"
Cohesion: 0.28
Nodes (13): GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles(), absent() (+5 more)

### Community 46 - "dependency-bots/adopt.ts"
Cohesion: 0.07
Nodes (68): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard, projectCards() (+60 more)

### Community 47 - "QuestionStepper.tsx"
Cohesion: 0.13
Nodes (26): FeatureHarnessOption, FeatureOption, FeatureQuestion, FeatureQuestionProjection, OutboxQuestionRound(), send(), draftKey(), readDraft() (+18 more)

### Community 48 - "admit-improvement.ts"
Cohesion: 0.20
Nodes (17): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+9 more)

### Community 49 - "contract.ts"
Cohesion: 0.29
Nodes (9): At, errno, GroupInventory, GroupProbe, Phase, Pid, groupInventory(), InventoryRunner (+1 more)

### Community 50 - "weekly-rollup.ts"
Cohesion: 0.07
Nodes (40): deliveryMetrics(), median(), learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck() (+32 more)

### Community 51 - "cost-ledger.ts"
Cohesion: 0.16
Nodes (26): captureCost(), server_telemetry_cost_entries_costcoveragesummary, costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress() (+18 more)

### Community 52 - "http/commands.ts"
Cohesion: 0.08
Nodes (37): recoverCTOInput(), Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership (+29 more)

### Community 53 - "Goals.tsx"
Cohesion: 0.14
Nodes (18): SendMessage, CTOReview(), goalState, DailyCTO(), GoalHistory(), load(), reportDate(), reviewStatus (+10 more)

### Community 54 - "ticket-evidence.ts"
Cohesion: 0.10
Nodes (36): CommentPage, commentReadback(), JiraOperations, plain(), jiraRecord(), unpack(), metadataDigest(), verifiedTransition() (+28 more)

### Community 55 - "cec-reads.ts"
Cohesion: 0.14
Nodes (16): implementationWorkerContext(), IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), intakeMembership(), projectListScope(), cecPrompt() (+8 more)

### Community 56 - "engine.ts"
Cohesion: 0.12
Nodes (33): continueImplementation(), dispatchNightly(), drainDelivery(), enableNightly(), resume(), startPilot(), Attempt, needsResumeReconciliation() (+25 more)

### Community 57 - "assignment-poll.ts"
Cohesion: 0.15
Nodes (20): clamp(), LIMITS, MergedPR, plainSlackText(), section(), shippedSummary(), configureNotices(), Identity (+12 more)

### Community 58 - "outbox.ts"
Cohesion: 0.11
Nodes (26): projectOutbox(), syncOutbox(), projectSlackDeliveries(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint(), slackRequestSettled() (+18 more)

### Community 59 - "work.ts"
Cohesion: 0.11
Nodes (22): BLOCKED_CAUSES, blockedCauses(), projectReadiness(), explanation(), LABELS, stoppedReason(), ProjectReadiness, AssignmentResult (+14 more)

### Community 60 - "Offices"
Cohesion: 0.18
Nodes (3): QuestionNotifications, projectById(), Offices

### Community 61 - "remove-candidate.ts"
Cohesion: 0.18
Nodes (18): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot() (+10 more)

### Community 62 - "telemetry.ts"
Cohesion: 0.14
Nodes (19): CodexRollout, basisOf(), claudeCost(), toMicroUsd(), claudeCrashZero(), claudeUsage(), count(), CostCompleteness (+11 more)

### Community 63 - "jira-time.ts"
Cohesion: 0.14
Nodes (22): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+14 more)

### Community 64 - "lesson-selection.ts"
Cohesion: 0.14
Nodes (20): INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), MAINTENANCE, MAX_LESSONS, normalPath() (+12 more)

### Community 65 - "assignments.ts"
Cohesion: 0.10
Nodes (26): clip(), DEMAND_LIMIT, demandFacts(), DemandSection, key(), LessonKey, notes(), assignmentLookups (+18 more)

### Community 66 - "constellation-runtime.ts"
Cohesion: 0.10
Nodes (22): ref_3d_force_graph, ref_three, CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point (+14 more)

### Community 67 - "Coordinator"
Cohesion: 0.08
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 68 - "Store"
Cohesion: 0.07
Nodes (22): GitHubFeaturePublisher, JiraFeaturePublisher, goalNoticeAuthorized(), goalNoticeNeverDispatched(), Result, Assessment, maintenanceNoticeAuthorized(), maintenanceNoticeNeverDispatched() (+14 more)

### Community 69 - "knowledge-views.ts"
Cohesion: 0.19
Nodes (17): KnowledgeActivity, KnowledgeEdge, KnowledgeMap, KnowledgeNode, connectionSummary(), ConstellationView, DisplayNode, displayScene() (+9 more)

### Community 70 - "coordination.ts"
Cohesion: 0.14
Nodes (19): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), legacy, validateNativeContinuation(), checkpointWindow() (+11 more)

### Community 71 - "offices.ts"
Cohesion: 0.16
Nodes (14): ref_smol_toml, leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), seedOfficeLessons(), DELIVERY_CONCURRENCY, file (+6 more)

### Community 72 - "control-store.ts"
Cohesion: 0.17
Nodes (11): ref_node_sqlite, systemClock, DATA, applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, statementCache() (+3 more)

### Community 73 - "Engine"
Cohesion: 0.08
Nodes (7): GitHubMonitor, githubPRDescription(), GOAL_EVIDENCE_LIMITS, Engine, GitHubBoard, GitHubPR, GitHubState

### Community 74 - "node-visuals.ts"
Cohesion: 0.20
Nodes (13): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+5 more)

### Community 75 - "blocker-followups.ts"
Cohesion: 0.28
Nodes (13): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), readBackConversations(), handoff(), reconcileBlockerFollowups(), clearUnblockBrief() (+5 more)

### Community 76 - "intent.ts"
Cohesion: 0.29
Nodes (9): ContinuationIO, nativeIO, assertOwnership(), decideImplementation(), ImplementationDecision, OwnershipRead, interruptedImplementation(), assertCandidateIdle() (+1 more)

### Community 77 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 78 - "run-accounting.ts"
Cohesion: 0.20
Nodes (15): readCodexRollout(), codexAccounting(), COMPLETION_MAX_BYTES, merge(), readCompletion(), RECONCILE_GRACE_MS, reconcileUncapturedRuns(), reconciling (+7 more)

### Community 79 - "report.ts"
Cohesion: 0.27
Nodes (13): telemetryRoute(), Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked() (+5 more)

### Community 80 - "capture-session-clone.py"
Cohesion: 0.15
Nodes (10): ctypes, errno, importlib_util, json, os, pathlib, Copy a coherent macOS clone of inherited reader fd3 to anonymous target fd4. No…, Read-only protocol adapter for the installed review helper. No model dispatch. (+2 more)

### Community 81 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (10): ref_react_three_drei, ref_react_three_fiber, ref_three_stdlib, CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility (+2 more)

### Community 82 - "price-table.ts"
Cohesion: 0.20
Nodes (8): CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL, Rates

### Community 83 - "time-readback.ts"
Cohesion: 0.36
Nodes (5): TimeLedger, Readback, READBACK_INTERVAL_MS, readBackTime(), SETTLE_MS

### Community 84 - "channel-notice.ts"
Cohesion: 0.38
Nodes (5): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice()

### Community 85 - "live-reach.ts"
Cohesion: 0.47
Nodes (5): GIT_NETWORK, LIVE_PROVIDERS, liveReach(), networkUrl(), remoteUrls()

### Community 86 - "create-candidate.ts"
Cohesion: 0.48
Nodes (6): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf()

### Community 87 - "owned-artifact.ts"
Cohesion: 0.35
Nodes (8): ghLogCacheEvidence(), BoundedRead, done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf(), CompletionReader

### Community 88 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 89 - "codex-rollout-file.ts"
Cohesion: 0.43
Nodes (6): createdAt(), dayDirs(), header(), ROLLOUT_MAX_BYTES, RolloutScan, scanCodexRollouts()

### Community 91 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (6): ref_mammoth, ref_pdfjs_dist, bounded(), extract(), fail(), [path,kind]

### Community 92 - "record-push.ts"
Cohesion: 0.31
Nodes (7): Event, one(), prePushRejection(), PushIdentity, Candidate, settledPushBoundary(), LifecycleDiagnostic

### Community 93 - "install-service.mjs"
Cohesion: 0.12
Nodes (10): ref_node_child_process, ref_node_string_decoder, file, folder, logs, root, Read, extractDocument (+2 more)

### Community 94 - "cec-implementation-continuation.ts"
Cohesion: 0.40
Nodes (4): ImplementationContinuation, ImplementationContinuationInput, ImplementationContinuationRequest, SavedImplementationProof

### Community 95 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 96 - "helper-usage.ts"
Cohesion: 0.25
Nodes (9): EvidenceOutcome, backfillClaudeCost(), codexHome(), HELPER_STDOUT_MAX_BYTES, helperAccounting(), claudeAccounting(), completionAccounting(), withReason() (+1 more)

## Knowledge Gaps
- **491 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+486 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 635 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `ref_node_path`, `github-delivery.ts`, `currentAssignment`, `completedExecution`, `session-bridge.ts`, `Role`, `digest`, `features.ts`, `.emit`, `scheduled-captures.ts`, `agents.ts`, `worker-runtime.ts`, `it-specialist.ts`, `goal-reviews.ts`, `source-amendment.ts`, `reader.ts`, `index.ts`, `run-retrospective.ts`, `shared.ts`, `features/commands.ts`, `dependencies.ts`, `GitHubDelivery`, `OfficeSnapshot`, `cec/issue-publication.ts`, `cec/workflow.ts`, `config.ts`, `sanitizeObject`, `scheduled-work.ts`, `time-scope.ts`, `ref_zod`, `record-trigger.ts`, `run.ts`, `.save`, `maintenance/maintenance.ts`, `candidate.ts`, `dependency-bots/adopt.ts`, `admit-improvement.ts`, `weekly-rollup.ts`, `cost-ledger.ts`, `http/commands.ts`, `ticket-evidence.ts`, `cec-reads.ts`, `engine.ts`, `assignment-poll.ts`, `outbox.ts`, `Offices`, `remove-candidate.ts`, `jira-time.ts`, `lesson-selection.ts`, `assignments.ts`, `coordination.ts`, `offices.ts`, `control-store.ts`, `Engine`, `blocker-followups.ts`, `intent.ts`, `run-accounting.ts`, `report.ts`, `time-readback.ts`, `channel-notice.ts`, `create-candidate.ts`, `owned-artifact.ts`, `record-push.ts`, `helper-usage.ts`?**
  _High betweenness centrality (0.110) - this node is a cross-community bridge._
- **Why does `Engine` connect `Engine` to `cec/workflow.ts`, `github-delivery.ts`, `sanitizeObject`, `Store`, `scheduled-work.ts`, `coordination.ts`, `offices.ts`, `.save`, `.emit`, `intent.ts`, `maintenance/maintenance.ts`, `scheduled-captures.ts`, `ticket-evidence.ts`, `cec-reads.ts`, `engine.ts`, `assignment-poll.ts`, `GitHubDelivery`, `features/commands.ts`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `TicketJob` connect `shared.ts` to `ref_node_path`, `github-delivery.ts`, `currentAssignment`, `completedExecution`, `MapView.tsx`, `Role`, `digest`, `it-specialist.ts`, `goal-reviews.ts`, `source-amendment.ts`, `run-retrospective.ts`, `dependencies.ts`, `GitHubDelivery`, `work-summary.ts`, `record-trigger.ts`, `.save`, `dependency-bots/adopt.ts`, `http/commands.ts`, `engine.ts`, `remove-candidate.ts`, `create-candidate.ts`, `owned-artifact.ts`, `record-push.ts`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _491 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ref_node_path` be split into smaller, more focused modules?**
  _Cohesion score 0.03680168414486765 - nodes in this community are weakly interconnected._
- **Should `github-delivery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06153846153846154 - nodes in this community are weakly interconnected._
- **Should `currentAssignment` be split into smaller, more focused modules?**
  _Cohesion score 0.08258408258408259 - nodes in this community are weakly interconnected._