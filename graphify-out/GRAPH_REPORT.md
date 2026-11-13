# Graph Report - the-office  (2026-11-13)

## Corpus Check
- 767 files · ~315,290 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3914 nodes · 18279 edges · 119 communities (108 shown, 11 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 590 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bc32dc0e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- closeout-recovery.ts
- github-delivery.ts
- workKey
- agents.ts
- MapView.tsx
- store.ts
- Inspector.tsx
- cec/workflow.ts
- source-amendment-scope.ts
- features/workflow.ts
- harnessDelivers
- App.tsx
- session-bridge.ts
- office-lessons.ts
- review-run.ts
- scheduled-captures.ts
- metadata-assessment.ts
- record-trigger.ts
- Engine
- lesson-selection.ts
- shared.ts
- index.ts
- conversations/conversations.ts
- TicketJob
- QuestionStepper.tsx
- artifact
- requests.ts
- sanitize
- maintenance/maintenance.ts
- TimeBook.tsx
- ref_node_path
- run-retrospective.ts
- knowledge.ts
- assignments.ts
- time-scope.ts
- dependencies.ts
- index.tsx
- digest
- harnessEffect
- brain-maintenance.ts
- source-amendment.ts
- run.ts
- coordination.ts
- worker-runtime.ts
- OfficeScene.tsx
- process.ts
- cost-ledger.ts
- engine.ts
- dependency-bots/adopt.ts
- weekly-rollup.ts
- JiraIssuePublisher
- GitHubIssuePublisher
- admit-improvement.ts
- run-cost.ts
- .emit
- daily-cto.ts
- features.ts
- Outbox.tsx
- Store
- scheduled-work.ts
- coordination-tick.ts
- outbox.ts
- remove-candidate.ts
- service-health.ts
- jira-time.ts
- .save
- assignment-poll.ts
- constellation-runtime.ts
- cec/issue-publication.ts
- Effects
- validate-stage.ts
- api-routes.ts
- Coordinator
- ticket-evidence.ts
- learning-events.ts
- work.ts
- OfficeSnapshot
- interrupted-work-recovery.ts
- QuestionNotifications
- conversations/slack.ts
- node-visuals.ts
- preferences-store.ts
- report.ts
- scene-motion.ts
- telemetry.ts
- local-config.ts
- RoomCamera.tsx
- github.ts
- it-specialist.ts
- run-accounting.ts
- projects.ts
- publish-pr.ts
- document.ts
- command-registry.ts
- CommittedBrain
- provider-observation.ts
- ProjectProgress
- extract-worker.mjs
- blocker-followups.ts
- helper-evidence.py
- useOfficePreferences.ts
- ITFollowUps.tsx
- server_delivery_harness_delivery_authority_resolvedeliverywork
- server_features_questions_pending_round_pendinground
- server_features_questions_pending_round_pendingrounds
- server_features_questions_pending_round_roundauthor
- src_shared_personas
- src_shared_workkey
- merge-scanner-retry.ts
- time-readback.ts
- cli.ts
- display-scene.ts
- helper-telemetry.ts
- owned-artifact.ts
- codex-rollout.ts
- codex-rollout-file.ts
- run-evidence.ts
- run-usage.ts
- delivery-task.ts

## God Nodes (most connected - your core abstractions)
1. `Store` - 345 edges
2. `TicketJob` - 174 edges
3. `digest()` - 160 edges
4. `artifact()` - 129 edges
5. `GitHubDelivery` - 122 edges
6. `command()` - 108 edges
7. `workKey()` - 101 edges
8. `cx()` - 88 edges
9. `currentAssignment()` - 82 edges
10. `Button` - 82 edges

## Surprising Connections (you probably didn't know these)
- `DeliverySlot` --references--> `Role`  [EXTRACTED]
  server/office/projects.ts → src/shared.ts
- `projectOutbox()` --calls--> `parkedProviderWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts
- `projectOutbox()` --calls--> `readinessNeedsFollowup()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts
- `projectOutbox()` --calls--> `readinessWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts
- `replacementContext()` --calls--> `slackMessageUrl()`  [EXTRACTED]
  server/conversations/slack/supersession-proof.ts → src/shared.ts

## Import Cycles
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/parking/resume-provider-review.ts -> server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/parking/resume-provider-review.ts`
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

## Communities (119 total, 11 thin omitted)

### Community 0 - "closeout-recovery.ts"
Cohesion: 0.11
Nodes (40): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+32 more)

### Community 1 - "github-delivery.ts"
Cohesion: 0.06
Nodes (85): containedFile(), findingsBlock(), HANDS_OFF_PROJECTS, handsOff(), legacyRecovery(), BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE (+77 more)

### Community 2 - "workKey"
Cohesion: 0.06
Nodes (100): deliveryIntakeBlocker(), partialLocalCleanupCandidate(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash (+92 more)

### Community 3 - "agents.ts"
Cohesion: 0.07
Nodes (42): IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), intakeMembership(), projectListScope(), cecPrompt(), cecIntakePrompt() (+34 more)

### Community 4 - "MapView.tsx"
Cohesion: 0.09
Nodes (42): ref_react_markdown, ref_remark_gfm, Activity(), ActivityTimeline(), AssignmentKnowledge(), Lookup(), BrainWorkspace(), DocumentPreview() (+34 more)

### Community 5 - "store.ts"
Cohesion: 0.11
Nodes (24): ref_node_crypto, ref_node_sqlite, Assessment, fingerprint(), Clock, EASTERN, easternDayFormatter, easternPartsFormatter (+16 more)

### Community 6 - "Inspector.tsx"
Cohesion: 0.11
Nodes (66): Outbox(), blockedSummary(), ServiceHealthPanel(), followUp(), labels, ServiceHealthRow(), BlockerFollowups(), LearningCoverage() (+58 more)

### Community 7 - "cec/workflow.ts"
Cohesion: 0.10
Nodes (39): applyIntakeObservation(), checkMail(), drainMail(), requestMail(), parksInJira(), MISSING_INTAKE, reconcileMailbox(), unusedMailbox() (+31 more)

### Community 8 - "source-amendment-scope.ts"
Cohesion: 0.25
Nodes (15): approvedText(), assert(), assert(), boundProfiles, canonical(), Document, ReadSourceFile, releaseAmendmentJournal() (+7 more)

### Community 9 - "features/workflow.ts"
Cohesion: 0.08
Nodes (52): approveFeature(), featureById(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), discoveryPrompt(), planPrompt() (+44 more)

### Community 10 - "harnessDelivers"
Cohesion: 0.26
Nodes (13): harnessCloseout(), PASSING, verifyMergeActions(), requireDeliveryAuthority(), assertDeliveryMayMutate(), runHarnessStage(), harnessDelivers(), harnessStageResult() (+5 more)

### Community 11 - "App.tsx"
Cohesion: 0.05
Nodes (73): ref_lucide_react, ref_motion, ref_react_dom, compactSteps(), itAgent(), itDiagnostics(), BrainDrawer(), themeColor (+65 more)

### Community 12 - "session-bridge.ts"
Cohesion: 0.07
Nodes (45): ref_ws, claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexDaemonProcesses(), accountCodexProcesses(), codexProcessInventory (+37 more)

### Community 13 - "office-lessons.ts"
Cohesion: 0.24
Nodes (10): normalizeStatement(), decideOfficeProposal(), now(), OfficeKnowledgeStore, proposeOfficeLessons(), retireOfficeLesson(), Input, promoteNoteLesson() (+2 more)

### Community 14 - "review-run.ts"
Cohesion: 0.14
Nodes (29): featureItemComplete(), reconcileFeatureCompletion(), readEvidence(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS, requestReplan(), reserveReplacement() (+21 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.15
Nodes (42): createFeature(), assertEnrollable(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest, captureRequests(), failCapture() (+34 more)

### Community 16 - "metadata-assessment.ts"
Cohesion: 0.17
Nodes (32): admitPRMetadata(), METADATA_FINDING, METADATA_FINDING_GUIDANCE, assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema, savedMetadataAssessment() (+24 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.08
Nodes (50): baselineLearning(), LEARNING_BASELINES, maintainLearning(), configureKnowledge(), maintenanceSubject(), MaintenanceSubjectFacts, clip(), maintenanceBlockedId() (+42 more)

### Community 19 - "lesson-selection.ts"
Cohesion: 0.07
Nodes (40): lessonIssueBody(), lessonIssueMarker(), lessonBrainAudit, LessonBrainOverlap, INSTALLED, installedLesson(), Bucket, LESSON_LIMIT (+32 more)

### Community 20 - "shared.ts"
Cohesion: 0.07
Nodes (56): PackedPublicationRepair, Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona (+48 more)

### Community 21 - "index.ts"
Cohesion: 0.10
Nodes (24): ref_hono_node_server, ref_node_http, ref_vite, close(), config, itSpecialist, loadedRevision, offices (+16 more)

### Community 22 - "conversations/conversations.ts"
Cohesion: 0.10
Nodes (25): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+17 more)

### Community 23 - "TicketJob"
Cohesion: 0.05
Nodes (57): removeAdoptedClone(), namedRepairIds(), dependabotReviewGuidance(), pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), StageContext, deliveryTask(), GitHubDelivery (+49 more)

### Community 24 - "QuestionStepper.tsx"
Cohesion: 0.18
Nodes (19): FeatureQuestionProjection, FeatureRound, OutboxQuestionRound(), send(), draftKey(), readDraft(), saveDraft(), QuestionRound() (+11 more)

### Community 25 - "artifact"
Cohesion: 0.09
Nodes (53): assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), reconcileCompletedConflictDraft(), routeReadyPostConflictPublication(), verifyInitialDraftConflictPreparation() (+45 more)

### Community 26 - "requests.ts"
Cohesion: 0.07
Nodes (61): deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, gateRegisteredDelivery(), accounting, DeliverySubject, nonDelivery (+53 more)

### Community 27 - "sanitize"
Cohesion: 0.12
Nodes (29): az(), base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs(), fullActivePRs() (+21 more)

### Community 28 - "maintenance/maintenance.ts"
Cohesion: 0.11
Nodes (23): ApproachSchema, maintenancePolicies(), BrainMaintenance, candidateOwner(), SETTLED, skipOwnedCandidate(), Skipped, skippedCandidateLedger() (+15 more)

### Community 29 - "TimeBook.tsx"
Cohesion: 0.10
Nodes (38): TelemetryReport, AzureBuild, src_shared_liveanchor, ROLE_NAMES, BreakdownTable(), CostBar(), coverage(), pricedLabel() (+30 more)

### Community 30 - "ref_node_path"
Cohesion: 0.08
Nodes (52): ref_node_async_hooks, ref_node_fs, ref_node_os, ref_node_path, ref_node_util, recoverCTOInput(), draftReadHeadMatches(), assertDraftClaimHistory() (+44 more)

### Community 31 - "run-retrospective.ts"
Cohesion: 0.09
Nodes (44): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, blockingTrigger, isBlocking(), brainOverlapQuery() (+36 more)

### Community 32 - "knowledge.ts"
Cohesion: 0.10
Nodes (28): clip(), DEMAND_LIMIT, demandFacts(), key(), LessonKey, notes(), clip(), MISSED_QUERY_LIMIT (+20 more)

### Community 33 - "assignments.ts"
Cohesion: 0.07
Nodes (42): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), brainOverlap, clip(), BrainGraph, BrainNote (+34 more)

### Community 34 - "time-scope.ts"
Cohesion: 0.13
Nodes (31): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), server_telemetry_billable_work_issue_key, isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence() (+23 more)

### Community 35 - "dependencies.ts"
Cohesion: 0.15
Nodes (22): MergeNotifications, Admission, admit(), IntakeContext, WAIT_STATUSES, resumeParked(), compatible(), dependencyCompletionKey() (+14 more)

### Community 36 - "index.tsx"
Cohesion: 0.12
Nodes (44): ref_react, TicketPlanningAction(), SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), loadOfficeConfig(), OfficeConfigSection() (+36 more)

### Community 37 - "digest"
Cohesion: 0.16
Nodes (30): HarnessControl, assertAutomationEffects(), automationMergePolicy(), observeAutomationMerge(), routeAutomationMerge(), admitPacked165(), history(), makePacked165Candidate() (+22 more)

### Community 38 - "harnessEffect"
Cohesion: 0.16
Nodes (32): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), ProjectCard, projectCards(), projectGraphql() (+24 more)

### Community 39 - "brain-maintenance.ts"
Cohesion: 0.13
Nodes (17): completeNativeCheckpoint(), BRAIN_DEPENDENCY_MERGES, BrainResult, BrainStatusSchema, identity, coverageSchema, followupSchema, verified (+9 more)

### Community 40 - "source-amendment.ts"
Cohesion: 0.06
Nodes (74): ref_zod, stagePrompt(), StagePromptInput, adoptCandidate(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent() (+66 more)

### Community 41 - "run.ts"
Cohesion: 0.09
Nodes (35): partialLocalCleanupKey(), INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationCandidates(), investigationId(), investigationEvidence(), investigationFollowUps(), INVOCATION_SOURCE_REFS (+27 more)

### Community 42 - "coordination.ts"
Cohesion: 0.10
Nodes (19): savePickup(), PrerequisitesSchema, checkpointWindow(), coordination(), dueAt(), hours, localDay(), ReviewResult (+11 more)

### Community 43 - "worker-runtime.ts"
Cohesion: 0.08
Nodes (31): candidateWorkspaceEnvironment(), assignmentSubject(), assertBriefingScope(), ModelRoute, labels, toolActivity(), workerActivity(), claudeArguments() (+23 more)

### Community 44 - "OfficeScene.tsx"
Cohesion: 0.17
Nodes (33): Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk(), ElevatorStage() (+25 more)

### Community 45 - "process.ts"
Cohesion: 0.08
Nodes (30): ref_node_child_process, ref_node_url, file, folder, logs, root, Event, one() (+22 more)

### Community 46 - "cost-ledger.ts"
Cohesion: 0.17
Nodes (24): server_telemetry_cost_entries_costcoveragesummary, costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId(), OutsideEdit (+16 more)

### Community 47 - "engine.ts"
Cohesion: 0.14
Nodes (36): dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), resume(), startPilot(), MISSING_SAVED_PLAN, recoverSavedPlan() (+28 more)

### Community 48 - "dependency-bots/adopt.ts"
Cohesion: 0.10
Nodes (42): Execute, adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR, inPickupLane() (+34 more)

### Community 49 - "weekly-rollup.ts"
Cohesion: 0.08
Nodes (39): deliveryMetrics(), median(), learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck() (+31 more)

### Community 50 - "JiraIssuePublisher"
Cohesion: 0.26
Nodes (3): JiraIssuePublisher, keyOf(), publicationDescription()

### Community 51 - "GitHubIssuePublisher"
Cohesion: 0.18
Nodes (7): FeaturePublisher, PublicationReceipt, GitHubIssuePublisher, number(), same(), FeatureManifestItem, FeatureOperation

### Community 52 - "admit-improvement.ts"
Cohesion: 0.21
Nodes (17): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+9 more)

### Community 53 - "run-cost.ts"
Cohesion: 0.17
Nodes (15): CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL, Rates (+7 more)

### Community 54 - ".emit"
Cohesion: 0.17
Nodes (21): configureChannelNotices(), configureNotices(), retryRecipientLookup(), enqueueGreen156(), bindDiscoveryResume(), DiscoveryResumeInput, enqueuePacked165(), enqueueMetadataRecovery() (+13 more)

### Community 55 - "daily-cto.ts"
Cohesion: 0.05
Nodes (49): leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), collectCTOFacts(), DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts (+41 more)

### Community 56 - "features.ts"
Cohesion: 0.10
Nodes (39): commandFeature(), reviewQuestions(), FeaturePlanningBindings, applyHarnessAction(), HarnessActionInput, recoveryPreconditions(), recoveryTarget(), normalizeRound() (+31 more)

### Community 57 - "Outbox.tsx"
Cohesion: 0.13
Nodes (22): Conversation(), LessonDecisionAction, lessonDecisionState(), readLessonDecision(), OutboxLessonDecision(), act(), readStatus(), OutboxMaintenanceStatus() (+14 more)

### Community 58 - "Store"
Cohesion: 0.06
Nodes (27): AzureMonitor, ROLES, verifyFeatureEnhance(), GitHubFeaturePublisher, JiraFeaturePublisher, FeatureReviewRunner, FeatureWorkflow, officeCapacity (+19 more)

### Community 59 - "scheduled-work.ts"
Cohesion: 0.13
Nodes (27): deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), metadataRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), requestPriority() (+19 more)

### Community 60 - "coordination-tick.ts"
Cohesion: 0.14
Nodes (13): reconcileNoticeConfirmations(), BrainFollowup, Result, brainCheckpointCompletion(), reconcileCompletedCheckpoints(), legacy, reconcileContinuations(), pruneCompletedReads() (+5 more)

### Community 61 - "outbox.ts"
Cohesion: 0.14
Nodes (17): ctoInputRecovered(), conversationResolved(), projectOutbox(), slackRequestSettled(), knowledgeOutbox(), checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup() (+9 more)

### Community 62 - "remove-candidate.ts"
Cohesion: 0.18
Nodes (18): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot() (+10 more)

### Community 63 - "service-health.ts"
Cohesion: 0.15
Nodes (10): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, slackHealth(), DailyCTOSummary (+2 more)

### Community 64 - "jira-time.ts"
Cohesion: 0.14
Nodes (20): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+12 more)

### Community 65 - ".save"
Cohesion: 0.24
Nodes (23): BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue(), readIssues(), commentDecision() (+15 more)

### Community 66 - "assignment-poll.ts"
Cohesion: 0.13
Nodes (22): ChannelSettings, notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR, plainSlackText(), section() (+14 more)

### Community 67 - "constellation-runtime.ts"
Cohesion: 0.09
Nodes (23): ref_3d_force_graph, ref_three, CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point (+15 more)

### Community 68 - "cec/issue-publication.ts"
Cohesion: 0.17
Nodes (14): CommentPage, commentReadback(), Assignment, Content, jiraText(), Transition, JiraOperations, plain() (+6 more)

### Community 69 - "Effects"
Cohesion: 0.20
Nodes (10): publishFeature(), reconcilePublication(), uncertainPublications(), reserveIdentity(), GitHubOperations, fileLessonIssue(), closeNativeRefresh(), Effects (+2 more)

### Community 70 - "validate-stage.ts"
Cohesion: 0.18
Nodes (16): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+8 more)

### Community 71 - "api-routes.ts"
Cohesion: 0.21
Nodes (13): Link, linkFeature(), assertQuestionVisibility(), featureRoute(), goalHistory(), apiRoute(), RequestContext, fileResponse() (+5 more)

### Community 73 - "ticket-evidence.ts"
Cohesion: 0.11
Nodes (29): ref_node_string_decoder, assetDownloader(), attachmentKind(), evidenceDirectory(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS (+21 more)

### Community 74 - "learning-events.ts"
Cohesion: 0.22
Nodes (13): improvementIntakeGate(), captureLearning(), learningDigest(), recordLearningOpportunity(), expireLearningPackets(), packetReferences(), captureMaintenanceStep(), citations() (+5 more)

### Community 75 - "work.ts"
Cohesion: 0.11
Nodes (23): BLOCKED_CAUSES, blockedCauses(), projectReadiness(), explanation(), LABELS, stoppedReason(), ProjectReadiness, AssignmentResult (+15 more)

### Community 76 - "OfficeSnapshot"
Cohesion: 0.07
Nodes (41): SendMessage, ctoInputFailure(), OutboxCTOInput(), recover(), OutboxSavedPlan(), reconcile(), FeatureDelivery(), FeatureDocuments() (+33 more)

### Community 77 - "interrupted-work-recovery.ts"
Cohesion: 0.21
Nodes (9): channelNoticeAuthorized(), goalNoticeAuthorized(), goalNoticeNeverDispatched(), sendGoalNotice(), maintenanceNoticeAuthorized(), maintenanceNoticeNeverDispatched(), sendMaintenanceNotice(), recover() (+1 more)

### Community 79 - "conversations/slack.ts"
Cohesion: 0.15
Nodes (13): comparableSlackText(), finishSupersededReadback(), projectSlackDeliveries(), settleRequestedSlackReplacement(), SlackMessages, SlackResultSchema, SlackVerificationSchema, Input (+5 more)

### Community 80 - "node-visuals.ts"
Cohesion: 0.20
Nodes (13): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+5 more)

### Community 81 - "preferences-store.ts"
Cohesion: 0.17
Nodes (10): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS (+2 more)

### Community 82 - "report.ts"
Cohesion: 0.27
Nodes (13): telemetryRoute(), Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked() (+5 more)

### Community 83 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 84 - "telemetry.ts"
Cohesion: 0.16
Nodes (12): RECONCILE_GRACE_MS, CostCompleteness, CostComponent, CostEntry, CostLedgerState, ProviderBasis, RunCost, TelemetryRow (+4 more)

### Community 85 - "local-config.ts"
Cohesion: 0.22
Nodes (13): AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), goalEvidencePath(), localBindings, assertModelOverrides(), CODEX_DEFAULT_EFFORT, CODEX_DEFAULT_MODEL, CODEX_EFFORTS (+5 more)

### Community 86 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (10): ref_react_three_drei, ref_react_three_fiber, ref_three_stdlib, CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility (+2 more)

### Community 87 - "github.ts"
Cohesion: 0.26
Nodes (6): GitHubMonitor, githubPRDescription(), GOAL_EVIDENCE_LIMITS, GitHubBoard, GitHubPR, GitHubState

### Community 88 - "it-specialist.ts"
Cohesion: 0.18
Nodes (16): savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), ITContext, diagnosticContext(), diagnosticSnapshot(), publishITReport() (+8 more)

### Community 89 - "run-accounting.ts"
Cohesion: 0.26
Nodes (11): readCodexRollout(), codexAccounting(), COMPLETION_MAX_BYTES, merge(), readCompletion(), reconcileUncapturedRuns(), reconciling, recordTerminalAccounting() (+3 more)

### Community 90 - "projects.ts"
Cohesion: 0.14
Nodes (11): ref_smol_toml, LOCAL_BINDINGS, file, project, root, DeliverySlot, projectById(), projectData() (+3 more)

### Community 91 - "publish-pr.ts"
Cohesion: 0.16
Nodes (17): readBackOrThrow(), retryRead(), commitlintRejection(), developerPRContent(), Execute, officePRContent(), prContent, assertCandidate() (+9 more)

### Community 92 - "document.ts"
Cohesion: 0.38
Nodes (5): ref_yaml, guidanceExcerpt(), DocumentMetadata, documentText(), KnowledgeDocumentText

### Community 93 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 95 - "provider-observation.ts"
Cohesion: 0.47
Nodes (4): correlatedBuild(), observe(), observeParked(), parkedReadError

### Community 97 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (6): ref_mammoth, ref_pdfjs_dist, bounded(), extract(), fail(), [path,kind]

### Community 98 - "blocker-followups.ts"
Cohesion: 0.30
Nodes (12): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), readBackConversations(), handoff(), reconcileBlockerFollowups(), clearUnblockBrief(), key() (+4 more)

### Community 99 - "helper-evidence.py"
Cohesion: 0.33
Nodes (5): importlib_util, json, pathlib, Read-only protocol adapter for the installed review helper. No model dispatch., sys

### Community 100 - "useOfficePreferences.ts"
Cohesion: 0.26
Nodes (10): acceptPreferences(), PreferenceCandidate, strip(), UNKNOWN_PREFERENCES, OfficePreferencesController, PreferenceFeedback, PreferenceField, requestPreferences() (+2 more)

### Community 101 - "ITFollowUps.tsx"
Cohesion: 0.67
Nodes (4): itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps()

### Community 108 - "merge-scanner-retry.ts"
Cohesion: 0.40
Nodes (9): officeMergeProvenance(), reconcileMergeScannerRetry(), Retry, retryMergeScanner(), retryReadBack(), runIdentity(), savedRetry(), transientScannerJobs() (+1 more)

### Community 109 - "time-readback.ts"
Cohesion: 0.29
Nodes (6): TimeLedger, dueReadback(), Readback, READBACK_INTERVAL_MS, readBackTime(), SETTLE_MS

### Community 110 - "cli.ts"
Cohesion: 0.20
Nodes (8): ref_node_stream, ref_node_timers, args, [cmd,...rawArgs], commands, key, projectIndex, PORT

### Community 111 - "display-scene.ts"
Cohesion: 0.33
Nodes (8): KnowledgeNode, DisplayNode, initialSelection, MapSelection, KnowledgeGroup, knowledgeGroups(), title(), titles

### Community 112 - "helper-telemetry.ts"
Cohesion: 0.39
Nodes (7): helperTelemetry(), dispatchExposure(), HELPER_STDOUT_MAX_BYTES, helperAccounting(), claudeAccounting(), completionAccounting(), withReason()

### Community 113 - "owned-artifact.ts"
Cohesion: 0.42
Nodes (7): BoundedRead, done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf(), CompletionReader

### Community 114 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 115 - "codex-rollout-file.ts"
Cohesion: 0.36
Nodes (7): codexHome(), createdAt(), dayDirs(), header(), ROLLOUT_MAX_BYTES, RolloutScan, scanCodexRollouts()

### Community 116 - "run-evidence.ts"
Cohesion: 0.38
Nodes (5): comparable(), EvidenceOutcome, recordRunEvidence(), backfillClaudeCost(), RunAccounting

### Community 117 - "run-usage.ts"
Cohesion: 0.33
Nodes (5): CodexRollout, claudeUsage(), codexUsage(), count(), RunUsage

### Community 118 - "delivery-task.ts"
Cohesion: 0.40
Nodes (4): APPROACH_GUIDANCE, DeliveryTaskInput, DISCOVERY_GUIDANCE, AMENDMENT_REVIEW_PROOF

## Knowledge Gaps
- **483 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+478 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 618 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `closeout-recovery.ts`, `github-delivery.ts`, `workKey`, `agents.ts`, `store.ts`, `cec/workflow.ts`, `features/workflow.ts`, `harnessDelivers`, `session-bridge.ts`, `office-lessons.ts`, `review-run.ts`, `scheduled-captures.ts`, `metadata-assessment.ts`, `record-trigger.ts`, `Engine`, `lesson-selection.ts`, `shared.ts`, `conversations/conversations.ts`, `TicketJob`, `artifact`, `requests.ts`, `sanitize`, `maintenance/maintenance.ts`, `ref_node_path`, `run-retrospective.ts`, `knowledge.ts`, `assignments.ts`, `time-scope.ts`, `dependencies.ts`, `digest`, `harnessEffect`, `brain-maintenance.ts`, `source-amendment.ts`, `run.ts`, `coordination.ts`, `worker-runtime.ts`, `process.ts`, `cost-ledger.ts`, `engine.ts`, `dependency-bots/adopt.ts`, `weekly-rollup.ts`, `JiraIssuePublisher`, `GitHubIssuePublisher`, `admit-improvement.ts`, `.emit`, `daily-cto.ts`, `features.ts`, `scheduled-work.ts`, `coordination-tick.ts`, `remove-candidate.ts`, `jira-time.ts`, `.save`, `assignment-poll.ts`, `cec/issue-publication.ts`, `Effects`, `validate-stage.ts`, `api-routes.ts`, `ticket-evidence.ts`, `learning-events.ts`, `OfficeSnapshot`, `interrupted-work-recovery.ts`, `QuestionNotifications`, `conversations/slack.ts`, `report.ts`, `telemetry.ts`, `github.ts`, `it-specialist.ts`, `run-accounting.ts`, `publish-pr.ts`, `ProjectProgress`, `blocker-followups.ts`, `time-readback.ts`, `helper-telemetry.ts`, `owned-artifact.ts`, `run-evidence.ts`, `delivery-task.ts`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **Why does `workKey()` connect `workKey` to `closeout-recovery.ts`, `store.ts`, `features/workflow.ts`, `harnessDelivers`, `metadata-assessment.ts`, `shared.ts`, `TicketJob`, `artifact`, `requests.ts`, `ref_node_path`, `dependencies.ts`, `digest`, `harnessEffect`, `source-amendment.ts`, `run.ts`, `dependency-bots/adopt.ts`, `Store`, `scheduled-work.ts`, `coordination-tick.ts`, `remove-candidate.ts`, `Effects`, `work.ts`, `interrupted-work-recovery.ts`, `it-specialist.ts`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `sanitizeObject()` connect `sanitize` to `.save`, `agents.ts`, `store.ts`, `Effects`, `api-routes.ts`, `run.ts`, `worker-runtime.ts`, `office-lessons.ts`, `report.ts`, `run-evidence.ts`, `index.ts`, `conversations/conversations.ts`, `daily-cto.ts`, `artifact`, `requests.ts`, `ref_node_path`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _483 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `closeout-recovery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11313131313131314 - nodes in this community are weakly interconnected._
- **Should `github-delivery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06458624437199192 - nodes in this community are weakly interconnected._
- **Should `workKey` be split into smaller, more focused modules?**
  _Cohesion score 0.058060713233127025 - nodes in this community are weakly interconnected._