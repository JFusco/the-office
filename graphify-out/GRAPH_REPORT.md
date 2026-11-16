# Graph Report - the-office  (2026-11-16)

## Corpus Check
- 836 files · ~330,461 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4086 nodes · 18805 edges · 116 communities (113 shown, 3 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 608 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `86e4f394`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Button
- ref_node_path
- dependency-bots/adopt.ts
- .transaction
- Inspector.tsx
- completedExecution
- session-context-file.ts
- MapView.tsx
- agents.ts
- Store
- worker-runtime.ts
- shared.ts
- App.tsx
- features/workflow.ts
- assignments.ts
- scheduled-captures.ts
- run-retrospective.ts
- record-trigger.ts
- read-retries.ts
- artifact
- features.ts
- github-delivery.ts
- index.tsx
- dependencies.ts
- knowledge.ts
- maintenance/maintenance.ts
- cost-ledger.ts
- currentAssignment
- brain-maintenance.ts
- jira-time.ts
- harnessDelivers
- preferences-store.ts
- conversations/conversations.ts
- LessonsPanel.tsx
- azure.ts
- publish-pr.ts
- scheduled-work.ts
- scheduler.ts
- closeout-recovery.ts
- checkpoint-completion.ts
- assignment-poll.ts
- time-scope.ts
- node-visuals.ts
- run-accounting.ts
- intent.ts
- Coordinator
- OfficeScene.tsx
- Engine
- pilot-delivery.ts
- demand-facts.ts
- .emit
- scene-motion.ts
- validate-stage.ts
- cec.ts
- work.ts
- weekly-rollup.ts
- github-readiness.ts
- TimeBook.tsx
- RoomCamera.tsx
- control-store.ts
- retrospective-subject.ts
- run.ts
- Effects
- delivery-repairs.ts
- ticket-evidence.ts
- harness-baseline.ts
- QuestionStepper.tsx
- ControlStore
- digest
- JiraIssuePublisher
- constellation-runtime.ts
- contract.ts
- Offices
- telemetry.ts
- service-health.ts
- admit-improvement.ts
- daily-cto.ts
- OfficeSnapshot
- effects.ts
- run-cost.ts
- cli.ts
- lesson-selection.ts
- config.ts
- session-scope.ts
- outbox.ts
- goal-reporting.ts
- it-specialist.ts
- index.ts
- packed-consumer-pnpm.ts
- session-bridge.ts
- cec/workflow.ts
- fact-bounds.ts
- blocker-followups.ts
- install-service.mjs
- enrollment-gate.ts
- capture-session-clone.py
- .getEffect
- Goals.tsx
- .save
- easternDay
- requests.ts
- ledger.ts
- scope-repair-resume.ts
- accept-stage-result.ts
- .verifyPR
- extract-worker.mjs
- coordination.ts
- session-coverage.ts
- interrupted-work-recovery.ts
- agent-activity.ts
- resume-reconciliation.ts
- CommandRegistry
- scope.ts
- pre-push-boundary.ts
- ITFollowUps.tsx
- offices.ts

## God Nodes (most connected - your core abstractions)
1. `Store` - 367 edges
2. `TicketJob` - 172 edges
3. `digest()` - 150 edges
4. `command()` - 116 edges
5. `GitHubDelivery` - 116 edges
6. `artifact()` - 114 edges
7. `workKey()` - 96 edges
8. `OfficeSnapshot` - 88 edges
9. `currentAssignment()` - 88 edges
10. `cx()` - 88 edges

## Surprising Connections (you probably didn't know these)
- `DeliverySlot` --references--> `Role`  [EXTRACTED]
  server/office/projects.ts → src/shared.ts
- `DeliveryAuthorityInput` --references--> `HarnessRequest`  [EXTRACTED]
  server/delivery/harness/delivery-authority.ts → src/contracts/work.ts
- `apply()` --indirect_call--> `note()`  [INFERRED]
  src/conversations/OutboxSavedImplementation.tsx → server/cec/parking/resume-parked.ts
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
- 5-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/board-preflight.ts -> server/delivery/pipeline/github-delivery.ts`

## Communities (116 total, 3 thin omitted)

### Community 0 - "Button"
Cohesion: 0.16
Nodes (33): ref_react, SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS, PickupForm() (+25 more)

### Community 1 - "ref_node_path"
Cohesion: 0.12
Nodes (23): ref_node_crypto, ref_node_fs, ref_node_os, ref_node_path, ref_node_util, MISSING_SAVED_PLAN, StoppedBaseAuditReader, readStoppedBaseAuditNative() (+15 more)

### Community 2 - "dependency-bots/adopt.ts"
Cohesion: 0.07
Nodes (71): initialManualStart(), Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard (+63 more)

### Community 3 - ".transaction"
Cohesion: 0.12
Nodes (16): featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), wakeFeature(), recoverFeatures(), observeHelperGroups(), stopHelperGroups(), FeatureReviewRunner (+8 more)

### Community 4 - "Inspector.tsx"
Cohesion: 0.11
Nodes (65): TicketPlanningAction(), blockedSummary(), ServiceHealthPanel(), followUp(), labels, ServiceHealthRow(), BlockerFollowups(), LessonsPanel() (+57 more)

### Community 5 - "completedExecution"
Cohesion: 0.07
Nodes (57): writerRestartPending(), removeAdoptedClone(), accounting, DeliverySubject, nonDelivery, originalReads, pinCourierIdentityRefusal(), pinCourierVerifiedCommit() (+49 more)

### Community 6 - "session-context-file.ts"
Cohesion: 0.21
Nodes (13): ref_node_perf_hooks, contextFoldPrefix, SessionContextCheckpoint, captureSessionContextClone(), ContextReadPhase, SessionContextDeadline, sessionContextFile(), ContextReadChanged (+5 more)

### Community 7 - "MapView.tsx"
Cohesion: 0.06
Nodes (67): ref_react_markdown, ref_remark_gfm, ref_yaml, KnowledgeActivity, KnowledgeActivityPage, KnowledgeEdge, KnowledgeMap, KnowledgeNode (+59 more)

### Community 8 - "agents.ts"
Cohesion: 0.06
Nodes (47): IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), intakeMembership(), projectListScope(), cecIntakePrompt(), cecReadbackPrompt() (+39 more)

### Community 9 - "Store"
Cohesion: 0.07
Nodes (28): CommentPage, commentReadback(), Assignment, Content, jiraText(), Transition, JiraOperations, plain() (+20 more)

### Community 10 - "worker-runtime.ts"
Cohesion: 0.07
Nodes (36): ref_zod, candidateWorkspaceEnvironment(), server_delivery_harness_delivery_authority_resolvedeliverywork, assignmentDiagnostics(), diagnosticContext(), assignmentSubject(), assertBriefingScope(), LOCAL_BINDINGS (+28 more)

### Community 11 - "shared.ts"
Cohesion: 0.06
Nodes (36): Admission, IntakeContext, WAIT_STATUSES, DependencyStores, completedPRReviews(), ContinuationDecision, eligible(), mergedByOwner() (+28 more)

### Community 12 - "App.tsx"
Cohesion: 0.04
Nodes (83): ref_lucide_react, ref_motion, ref_react_dom, Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId (+75 more)

### Community 13 - "features/workflow.ts"
Cohesion: 0.08
Nodes (61): approveFeature(), commandFeature(), featureById(), mutation(), reviewQuestions(), assertFeatureDependencyOrder(), featureDependencyEdges(), key() (+53 more)

### Community 14 - "assignments.ts"
Cohesion: 0.07
Nodes (37): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, CommittedBrain (+29 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.16
Nodes (43): createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest, captureRequests() (+35 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.09
Nodes (45): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, blockingTrigger, isBlocking(), brainOverlap (+37 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.12
Nodes (34): baselineLearning(), maintainLearning(), configureKnowledge(), clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates(), maintenanceCompletedId() (+26 more)

### Community 18 - "read-retries.ts"
Cohesion: 0.26
Nodes (10): ATTEMPT_DELAYS_MS, PrerequisitesSchema, classifyStop(), stopReason(), incompleteReadOutput(), IntakeResult, planReadRetry(), temporaryReadFailure() (+2 more)

### Community 19 - "artifact"
Cohesion: 0.07
Nodes (69): advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat(), candidateInput(), children, oldAdoptionBasis() (+61 more)

### Community 20 - "features.ts"
Cohesion: 0.08
Nodes (46): DELAYS, MAX_EXECUTIONS, MAX_REPLANS, reserveReplacement(), stageBudget(), confirmBrief(), classifyFeatureFailure(), automaticEnabled() (+38 more)

### Community 21 - "github-delivery.ts"
Cohesion: 0.07
Nodes (30): writerRestartInstruction(), ProjectProgress, BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction(), dependabotReviewGuidance(), discover() (+22 more)

### Community 22 - "index.tsx"
Cohesion: 0.09
Nodes (34): Conversation(), isLessonDecision(), Outbox(), ctoInputFailure(), OutboxCTOInput(), OutboxMaintenanceStatus(), recommendedReply(), savedImplementationFollowup() (+26 more)

### Community 23 - "dependencies.ts"
Cohesion: 0.16
Nodes (20): MergeNotifications, reconcileNoticeConfirmations(), admit(), compatible(), dependencyCompletionKey(), dependencyEligibility(), issueKey(), observePrerequisites() (+12 more)

### Community 24 - "knowledge.ts"
Cohesion: 0.06
Nodes (46): normalizeStatement(), lessonBrainAudit, LessonBrainOverlap, decideOfficeProposal(), now(), OfficeKnowledgeStore, proposeOfficeLessons(), retireOfficeLesson() (+38 more)

### Community 25 - "maintenance/maintenance.ts"
Cohesion: 0.11
Nodes (23): maintenancePolicies(), captureMaintenanceStep(), BrainMaintenance, candidateOwner(), SETTLED, skipOwnedCandidate(), Skipped, skippedCandidateLedger() (+15 more)

### Community 26 - "cost-ledger.ts"
Cohesion: 0.12
Nodes (32): captureCost(), server_telemetry_cost_entries_costcoveragesummary, costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId() (+24 more)

### Community 27 - "currentAssignment"
Cohesion: 0.07
Nodes (86): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+78 more)

### Community 28 - "brain-maintenance.ts"
Cohesion: 0.17
Nodes (14): completeNativeCheckpoint(), BRAIN_DEPENDENCY_MERGES, BrainResult, BrainStatusSchema, identity, capped(), queueMaintenanceNotice(), queueCheckpointRetry() (+6 more)

### Community 29 - "jira-time.ts"
Cohesion: 0.15
Nodes (18): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+10 more)

### Community 30 - "harnessDelivers"
Cohesion: 0.15
Nodes (36): runHarnessStage(), harnessDelivers(), admitPRMetadata(), assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema, savedMetadataAssessment() (+28 more)

### Community 31 - "preferences-store.ts"
Cohesion: 0.17
Nodes (10): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS (+2 more)

### Community 32 - "conversations/conversations.ts"
Cohesion: 0.09
Nodes (21): ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, pumpCTO(), queueCTOHandoff(), saveGoals(), pumpIT() (+13 more)

### Community 33 - "LessonsPanel.tsx"
Cohesion: 0.25
Nodes (13): LessonDecisionAction, lessonDecisionState(), readLessonDecision(), OutboxLessonDecision(), act(), readStatus(), LearningCoverage(), Evidence() (+5 more)

### Community 34 - "azure.ts"
Cohesion: 0.16
Nodes (20): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+12 more)

### Community 35 - "publish-pr.ts"
Cohesion: 0.13
Nodes (30): harnessCloseout(), PASSING, verifyMergeActions(), requireDeliveryAuthority(), harnessEffect, assertDeliveryMayMutate(), retryRead(), harnessStageResult() (+22 more)

### Community 36 - "scheduled-work.ts"
Cohesion: 0.08
Nodes (43): ref_node_async_hooks, freshOwnershipRead(), deliverySlot(), closeoutRequestResolved(), Ownership, ownershipContext, refreshDeliveryOwnership(), RefreshOwnership (+35 more)

### Community 37 - "scheduler.ts"
Cohesion: 0.17
Nodes (13): officeCapacity, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch(), deliveryOccupied() (+5 more)

### Community 38 - "closeout-recovery.ts"
Cohesion: 0.09
Nodes (50): assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint(), closeoutProviderEvidence() (+42 more)

### Community 39 - "checkpoint-completion.ts"
Cohesion: 0.32
Nodes (5): brainCheckpointCompletion(), coverageSchema, followupSchema, verified, reconcileCompletedCheckpoints()

### Community 40 - "assignment-poll.ts"
Cohesion: 0.13
Nodes (25): noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved() (+17 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.13
Nodes (29): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), server_telemetry_billable_work_issue_key, isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence() (+21 more)

### Community 42 - "node-visuals.ts"
Cohesion: 0.20
Nodes (13): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+5 more)

### Community 43 - "run-accounting.ts"
Cohesion: 0.12
Nodes (32): BoundedRead, done(), readBoundedNoFollow(), readOwnedSessionArtifact(), reasonOf(), backfillClaudeCost(), CompletionReader, codexHome() (+24 more)

### Community 44 - "intent.ts"
Cohesion: 0.12
Nodes (26): GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles(), ContinuationIO (+18 more)

### Community 46 - "OfficeScene.tsx"
Cohesion: 0.17
Nodes (33): Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk(), ElevatorStage() (+25 more)

### Community 47 - "Engine"
Cohesion: 0.09
Nodes (5): correlatedBuild(), Engine, observe(), observeParked(), parkedReadError

### Community 48 - "pilot-delivery.ts"
Cohesion: 0.12
Nodes (27): candidateBranchMoved(), checkMail(), drainMail(), requestMail(), dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery() (+19 more)

### Community 49 - "demand-facts.ts"
Cohesion: 0.13
Nodes (22): clip(), DEMAND_LIMIT, demandFacts(), DemandSection, key(), LessonKey, notes(), clip() (+14 more)

### Community 50 - ".emit"
Cohesion: 0.11
Nodes (36): decideImplementation(), requestQAPlanRetry(), configureChannelNotices(), assertConversationReadback(), configureNotices(), retryRecipientLookup(), recoverCTOInput(), finishSupersededReadback() (+28 more)

### Community 51 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 52 - "validate-stage.ts"
Cohesion: 0.17
Nodes (17): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+9 more)

### Community 53 - "cec.ts"
Cohesion: 0.13
Nodes (23): implementationWorkerContext(), cecPrompt(), resolvedDecisionNote(), stageInstructions, reviewedPlanGuidance, reviewedPlanGuideDigest, stagePrompt(), StagePromptInput (+15 more)

### Community 54 - "work.ts"
Cohesion: 0.12
Nodes (20): BLOCKED_CAUSES, blockedCauses(), projectReadiness(), ProjectReadiness, HistoryRetirement, HistoryRetirementIntent, AssignmentResult, BlockedCause (+12 more)

### Community 55 - "weekly-rollup.ts"
Cohesion: 0.20
Nodes (17): expireLearningPackets(), packetReferences(), learningMetrics(), RollupResult, harperFolder(), RETROSPECTIVE_TIMEOUT, lastFriday(), ROLLUP_HISTORY (+9 more)

### Community 56 - "github-readiness.ts"
Cohesion: 0.10
Nodes (44): findingsBlock(), observe(), assertAutomationEffects(), automationMergePolicy(), observeAutomationMerge(), routeAutomationMerge(), checksFailed(), checksPassed() (+36 more)

### Community 57 - "TimeBook.tsx"
Cohesion: 0.10
Nodes (38): AzureBuild, src_shared_liveanchor, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens(), usd() (+30 more)

### Community 58 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (10): ref_react_three_drei, ref_react_three_fiber, ref_three_stdlib, CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility (+2 more)

### Community 59 - "control-store.ts"
Cohesion: 0.16
Nodes (10): ref_node_sqlite, Clock, applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, statementCache(), initialSnapshot() (+2 more)

### Community 60 - "retrospective-subject.ts"
Cohesion: 0.18
Nodes (15): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+7 more)

### Community 61 - "run.ts"
Cohesion: 0.12
Nodes (25): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, NOTIFY_HELPER, OFFICE_FIX_PROMPT (+17 more)

### Community 62 - "Effects"
Cohesion: 0.10
Nodes (25): channelNoticeAuthorized(), ChannelSettings, notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR, plainSlackText() (+17 more)

### Community 63 - "delivery-repairs.ts"
Cohesion: 0.14
Nodes (25): namedRepairIds(), activeEffectId(), adoptedReviewCandidate(), ciCheckout(), finishCISetup(), verifyCIHooks(), CIFailure, guardCIRepair() (+17 more)

### Community 64 - "ticket-evidence.ts"
Cohesion: 0.14
Nodes (29): assetDownloader(), attachmentKind(), evidenceDirectory(), readEvidence(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS (+21 more)

### Community 65 - "harness-baseline.ts"
Cohesion: 0.15
Nodes (20): baselineReport, BaselineSource, baselineText(), millions(), row(), share(), add(), BaselineState (+12 more)

### Community 66 - "QuestionStepper.tsx"
Cohesion: 0.13
Nodes (26): FeatureHarnessOption, FeatureOption, FeatureQuestion, FeatureQuestionProjection, OutboxQuestionRound(), send(), draftKey(), readDraft() (+18 more)

### Community 67 - "ControlStore"
Cohesion: 0.15
Nodes (7): DailyCTO, EvidenceRequestConflict, Briefing, saveReviewBriefing(), ControlStore, OfficeKnowledge, DailyCTOReport

### Community 68 - "digest"
Cohesion: 0.30
Nodes (13): continueOwnershipRead(), expiredOwnershipRead(), ownershipReadGate(), ownershipReadState(), ownershipReadHistory(), ownershipReadSource(), readOwnershipCandidate, ReadOwnershipView (+5 more)

### Community 69 - "JiraIssuePublisher"
Cohesion: 0.24
Nodes (5): JiraIssuePublisher, keyOf(), descriptionPreimage(), plain(), publicationDescription()

### Community 70 - "constellation-runtime.ts"
Cohesion: 0.10
Nodes (22): ref_3d_force_graph, ref_three, CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point (+14 more)

### Community 71 - "contract.ts"
Cohesion: 0.23
Nodes (10): At, errno, GroupInventory, GroupProbe, Phase, Pid, groupInventory(), InventoryRunner (+2 more)

### Community 72 - "Offices"
Cohesion: 0.19
Nodes (3): QuestionNotifications, projectById(), Offices

### Community 73 - "telemetry.ts"
Cohesion: 0.14
Nodes (23): CostCompleteness, CostEntry, ISSUE_KEY, TelemetryReport, TelemetryRow, TelemetrySync, UsageCompleteness, UsageSource (+15 more)

### Community 74 - "service-health.ts"
Cohesion: 0.19
Nodes (9): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, slackHealth() (+1 more)

### Community 75 - "admit-improvement.ts"
Cohesion: 0.20
Nodes (17): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+9 more)

### Community 76 - "daily-cto.ts"
Cohesion: 0.10
Nodes (21): evidenceRequestConflicts, dailyReviewPrompt(), applyGoalReview(), DailyResultSchema, EvidenceRefSchema, FreshDailyResultSchema, GoalEvidenceRequestSchema, statusAllowed() (+13 more)

### Community 77 - "OfficeSnapshot"
Cohesion: 0.10
Nodes (29): compactSteps(), knowledgeOutbox(), DAYS, dueLessonDecisions(), easternWeek(), LESSON_DIGEST, LessonDecision, PARTS (+21 more)

### Community 78 - "effects.ts"
Cohesion: 0.12
Nodes (18): FeaturePublisher, PublicationReceipt, publishFeature(), reconcilePublication(), uncertainPublications(), reserveIdentity(), Assign, Board (+10 more)

### Community 79 - "run-cost.ts"
Cohesion: 0.09
Nodes (30): add(), CodexRequest, CodexRollout, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens() (+22 more)

### Community 80 - "cli.ts"
Cohesion: 0.20
Nodes (8): ref_node_stream, ref_node_timers, args, [cmd,...rawArgs], commands, key, projectIndex, PORT

### Community 81 - "lesson-selection.ts"
Cohesion: 0.09
Nodes (29): INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), LessonSelection, MAINTENANCE, MAX_LESSONS (+21 more)

### Community 82 - "config.ts"
Cohesion: 0.12
Nodes (21): OwnershipRead, Document, isAccessOnlyPlan(), settledAccessOnlyState(), closedReadonlyPlan(), Document, continueAccessOnlyPlan(), entryExists() (+13 more)

### Community 83 - "session-scope.ts"
Cohesion: 0.16
Nodes (17): readTranscript, root, claudeSessionScope(), readRollout, LiveSession, ContextProject, ContextReader, retainSessionMessage() (+9 more)

### Community 84 - "outbox.ts"
Cohesion: 0.11
Nodes (24): ctoInputIdentityMatches(), ctoInputRecovered(), ADOPTION_STALLED_MS, conversationResolved(), projectOutbox(), syncOutbox(), slackRequestSettled(), Result (+16 more)

### Community 85 - "goal-reporting.ts"
Cohesion: 0.09
Nodes (31): AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), GitHubMonitor, githubPRDescription(), azureGoalFacts(), azurePRDescription(), boundedEvidence(), collectAzureGoalDocuments() (+23 more)

### Community 86 - "it-specialist.ts"
Cohesion: 0.33
Nodes (8): ITContext, publishITReport(), ITSpecialist, delays, recoverAttempt(), ITFollowUp, ITReport, ITState

### Community 87 - "index.ts"
Cohesion: 0.08
Nodes (45): ref_hono_node_server, ref_node_http, ref_vite, implementationContinuationRoute(), qaPlanRetryRoute(), close(), config, itSpecialist (+37 more)

### Community 89 - "session-bridge.ts"
Cohesion: 0.16
Nodes (15): ref_ws, claudeSessionContext(), codexDaemonProcesses(), codexSessionContext(), idleExecServers(), isExecServer(), processTable, claudeSessions() (+7 more)

### Community 90 - "cec/workflow.ts"
Cohesion: 0.14
Nodes (28): applyIntakeObservation(), parksInJira(), qaPlanEvidenceGap(), MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), run(), verifiedTransition() (+20 more)

### Community 91 - "fact-bounds.ts"
Cohesion: 0.26
Nodes (14): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+6 more)

### Community 92 - "blocker-followups.ts"
Cohesion: 0.30
Nodes (12): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), ReplySchema, readBackConversations(), handoff(), reconcileBlockerFollowups(), improvementIntakeGate() (+4 more)

### Community 93 - "install-service.mjs"
Cohesion: 0.11
Nodes (15): ref_node_child_process, ref_node_string_decoder, ref_node_url, file, folder, logs, root, extractDocument (+7 more)

### Community 94 - "enrollment-gate.ts"
Cohesion: 0.28
Nodes (15): bindDelivery(), featureEffectGate(), bindFeature(), currentApproval(), featureGate(), predecessorComplete(), automaticIntakeWait(), automaticTicketIntakeWait() (+7 more)

### Community 95 - "capture-session-clone.py"
Cohesion: 0.15
Nodes (10): ctypes, errno, importlib_util, json, os, pathlib, Copy a coherent macOS clone of inherited reader fd3 to anonymous target fd4. No…, Read-only protocol adapter for the installed review helper. No model dispatch. (+2 more)

### Community 96 - ".getEffect"
Cohesion: 0.25
Nodes (8): GitHubOperations, fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), Assessment, closeNativeRefresh(), fingerprint(), EffectIntent

### Community 97 - "Goals.tsx"
Cohesion: 0.08
Nodes (42): SendMessage, recover(), OutboxSavedImplementation(), apply(), review(), OutboxSavedPlan(), reconcile(), FeatureDelivery() (+34 more)

### Community 98 - ".save"
Cohesion: 0.18
Nodes (30): jiraCollection(), BLOCKED, findComment(), LiveIssue, readIssue(), readIssues(), Execute, jira() (+22 more)

### Community 99 - "easternDay"
Cohesion: 0.22
Nodes (13): expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), dailyReviewDate(), reviewWeekday() (+5 more)

### Community 100 - "requests.ts"
Cohesion: 0.10
Nodes (38): boardPreflightCandidate(), Ownership, reconcileBoardPreflight(), savedActivationFailure(), adoptCandidate(), reported, Scope, Assessment (+30 more)

### Community 101 - "ledger.ts"
Cohesion: 0.31
Nodes (10): diagnosticSnapshot(), investigationCandidates(), investigationId(), investigationFollowUps(), investigationResolution(), syncInvestigations(), notifyHelperResolution(), requeueInvestigationEvidence() (+2 more)

### Community 102 - "scope-repair-resume.ts"
Cohesion: 0.34
Nodes (12): Ownership, reconcileScopeRepairReadback(), assertScopeRepairResumeFindings(), certain(), effects(), originalClaim(), Ownership, requireThat() (+4 more)

### Community 103 - "accept-stage-result.ts"
Cohesion: 0.11
Nodes (38): containedFile(), handsOff(), DECISION_KINDS, needsDecision(), acceptStageResult(), acceptConflictRepair(), APPROACH_GUIDANCE, nextJobStage() (+30 more)

### Community 104 - ".verifyPR"
Cohesion: 0.32
Nodes (9): officeMergeProvenance(), reconcileMergeScannerRetry(), Retry, retryMergeScanner(), retryReadBack(), runIdentity(), savedRetry(), transientScannerJobs() (+1 more)

### Community 105 - "extract-worker.mjs"
Cohesion: 0.43
Nodes (6): ref_mammoth, ref_pdfjs_dist, bounded(), extract(), fail(), [path,kind]

### Community 106 - "coordination.ts"
Cohesion: 0.26
Nodes (11): checkpointWindow(), dueAt(), hours, localDay(), ReviewResult, deferNonReady(), preparePR(), recheck() (+3 more)

### Community 107 - "session-coverage.ts"
Cohesion: 0.29
Nodes (9): accountCodexProcesses(), codexProcessInventory, DesktopSessions, unaccountedProcesses(), completeSessionCoverage(), desktopCoverageGap(), knownActivity(), Report (+1 more)

### Community 108 - "interrupted-work-recovery.ts"
Cohesion: 0.36
Nodes (7): interruptAdoptions(), legacy(), REMOVED_FIELDS, retireLegacyRecovery(), goalNoticeNeverDispatched(), maintenanceNoticeNeverDispatched(), recover()

### Community 109 - "agent-activity.ts"
Cohesion: 0.25
Nodes (9): itAgent(), itDiagnostics(), displayAgentTask(), withoutElapsed(), LiveAgentTask(), Props, RunningTask(), text() (+1 more)

### Community 110 - "resume-reconciliation.ts"
Cohesion: 0.39
Nodes (6): Attempt, needsResumeReconciliation(), stoppedInSetup(), ownReceipts(), Receipt, supersededReceipt()

### Community 112 - "scope.ts"
Cohesion: 0.14
Nodes (20): nextAttemptAt(), restartStoppedWriters(), unchangedSinceAccepted(), NOT_RETRYABLE, WRITER_STAGES, writerRestartCandidate, writerRestarted(), Execute (+12 more)

### Community 113 - "pre-push-boundary.ts"
Cohesion: 0.43
Nodes (5): Event, one(), prePushRejection(), PushIdentity, settledPushBoundary()

### Community 114 - "ITFollowUps.tsx"
Cohesion: 0.67
Nodes (4): itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps()

### Community 115 - "offices.ts"
Cohesion: 0.18
Nodes (12): ref_smol_toml, leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), seedOfficeLessons(), DELIVERY_CONCURRENCY, file (+4 more)

## Knowledge Gaps
- **488 isolated node(s):** `Attempt`, `EvidenceSchema`, `ReceiptSchema`, `LegacyResultSchema`, `ResolutionSchema` (+483 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 628 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `ref_node_path`, `dependency-bots/adopt.ts`, `.transaction`, `completedExecution`, `agents.ts`, `worker-runtime.ts`, `shared.ts`, `features/workflow.ts`, `assignments.ts`, `scheduled-captures.ts`, `run-retrospective.ts`, `record-trigger.ts`, `read-retries.ts`, `artifact`, `features.ts`, `github-delivery.ts`, `dependencies.ts`, `knowledge.ts`, `maintenance/maintenance.ts`, `cost-ledger.ts`, `currentAssignment`, `brain-maintenance.ts`, `jira-time.ts`, `harnessDelivers`, `conversations/conversations.ts`, `azure.ts`, `publish-pr.ts`, `scheduled-work.ts`, `scheduler.ts`, `closeout-recovery.ts`, `checkpoint-completion.ts`, `assignment-poll.ts`, `time-scope.ts`, `run-accounting.ts`, `intent.ts`, `pilot-delivery.ts`, `demand-facts.ts`, `.emit`, `validate-stage.ts`, `cec.ts`, `weekly-rollup.ts`, `github-readiness.ts`, `control-store.ts`, `retrospective-subject.ts`, `run.ts`, `Effects`, `delivery-repairs.ts`, `ticket-evidence.ts`, `digest`, `Offices`, `admit-improvement.ts`, `daily-cto.ts`, `OfficeSnapshot`, `effects.ts`, `lesson-selection.ts`, `config.ts`, `outbox.ts`, `goal-reporting.ts`, `it-specialist.ts`, `index.ts`, `session-bridge.ts`, `cec/workflow.ts`, `blocker-followups.ts`, `enrollment-gate.ts`, `.getEffect`, `.save`, `easternDay`, `requests.ts`, `ledger.ts`, `scope-repair-resume.ts`, `accept-stage-result.ts`, `coordination.ts`, `interrupted-work-recovery.ts`, `agent-activity.ts`, `scope.ts`, `offices.ts`?**
  _High betweenness centrality (0.120) - this node is a cross-community bridge._
- **Why does `Coordinator` connect `Coordinator` to `requests.ts`, `scheduled-work.ts`, `assignment-poll.ts`, `Store`, `coordination.ts`, `shared.ts`, `scheduled-captures.ts`, `offices.ts`, `dependencies.ts`, `session-bridge.ts`, `brain-maintenance.ts`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `TicketJob` connect `github-delivery.ts` to `ref_node_path`, `dependency-bots/adopt.ts`, `Inspector.tsx`, `completedExecution`, `shared.ts`, `App.tsx`, `record-trigger.ts`, `artifact`, `currentAssignment`, `harnessDelivers`, `publish-pr.ts`, `scheduled-work.ts`, `scheduler.ts`, `closeout-recovery.ts`, `assignment-poll.ts`, `validate-stage.ts`, `cec.ts`, `github-readiness.ts`, `retrospective-subject.ts`, `delivery-repairs.ts`, `OfficeSnapshot`, `outbox.ts`, `it-specialist.ts`, `cec/workflow.ts`, `fact-bounds.ts`, `enrollment-gate.ts`, `requests.ts`, `scope-repair-resume.ts`, `accept-stage-result.ts`, `.verifyPR`, `interrupted-work-recovery.ts`, `scope.ts`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **What connects `Attempt`, `EvidenceSchema`, `ReceiptSchema` to the rest of the system?**
  _488 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ref_node_path` be split into smaller, more focused modules?**
  _Cohesion score 0.12173913043478261 - nodes in this community are weakly interconnected._
- **Should `dependency-bots/adopt.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06808408982322026 - nodes in this community are weakly interconnected._
- **Should `.transaction` be split into smaller, more focused modules?**
  _Cohesion score 0.12380952380952381 - nodes in this community are weakly interconnected._