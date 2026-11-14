# Graph Report - office-context-fold-throughput-nov14  (2026-11-14)

## Corpus Check
- 790 files · ~323,896 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4002 nodes · 18666 edges · 117 communities (107 shown, 10 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 601 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5cd926d1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- TicketJob
- agents.ts
- scope-repair-resume.ts
- MapView.tsx
- github-context.ts
- session-context-file.ts
- artifact
- MaintenanceRun
- ref_node_crypto
- index.ts
- ControlStore
- Inspector.tsx
- assignments.ts
- Button
- App.tsx
- ref_node_path
- currentAssignment
- pilot-delivery.ts
- .emit
- notifications.ts
- digest
- TimeBook.tsx
- Effects
- ref_react
- maintenance/maintenance.ts
- store.ts
- cec/workflow.ts
- config.ts
- Role
- run-retrospective.ts
- record-trigger.ts
- run.ts
- run-accounting.ts
- azure.ts
- github-delivery.ts
- Engine
- shared.ts
- enrollment-gate.ts
- lessons-view.ts
- index.tsx
- closeout-recovery.ts
- scheduled-work.ts
- source-amendment.ts
- .transaction
- .save
- time-scope.ts
- OfficeScene.tsx
- cost-ledger.ts
- candidate.ts
- weekly-rollup.ts
- Store
- knowledge.ts
- cec/issue-publication.ts
- harnessEffect
- dependency-bots/adopt.ts
- github/issue-publication.ts
- outbox.ts
- lesson-selection.ts
- http/commands.ts
- work.ts
- retrospective-subject.ts
- jira-time.ts
- Coordinator
- dependencies.ts
- ticket-evidence.ts
- assignment-poll.ts
- constellation-runtime.ts
- remove-candidate.ts
- work-summary.ts
- Offices
- process.ts
- pendingRounds
- recovery/stopped-base-update.ts
- coordination.ts
- api-routes.ts
- admit-improvement.ts
- command-registry.ts
- worker-runtime.ts
- command
- atmosphere.ts
- QuestionStepper.tsx
- brain-maintenance.ts
- evidence-digest.ts
- preferences-store.ts
- scene-motion.ts
- session-bridge.ts
- report.ts
- workKey
- capture-session-clone.py
- extraction.ts
- RoomCamera.tsx
- createConstellation
- fact-bounds.ts
- extract-worker.mjs
- daily-cto.ts
- local-config.ts
- ProjectProgress
- claude-session-context.ts
- session-coverage.ts
- server_delivery_harness_delivery_authority_resolvedeliverywork
- server_features_questions_pending_round_pendinground
- server_features_questions_pending_round_pendingrounds
- server_features_questions_pending_round_roundauthor
- src_shared_personas
- src_shared_workkey
- session-scope.ts
- cli.ts
- merge-scanner-retry.ts
- retire-history.ts
- time-readback.ts
- leadership.ts
- install-service.mjs
- goals.ts
- engine.ts
- office-state-view.ts
- highestStableAtLeast
- save-review-briefing.ts

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
- `DeliveryAuthorityInput` --references--> `HarnessRequest`  [EXTRACTED]
  server/delivery/harness/delivery-authority.ts → src/contracts/work.ts
- `DeliverySlot` --references--> `Role`  [EXTRACTED]
  server/office/projects.ts → src/shared.ts
- `projectOutbox()` --calls--> `parkedProviderWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts
- `projectOutbox()` --calls--> `readinessNeedsFollowup()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts

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

## Communities (117 total, 10 thin omitted)

### Community 0 - "TicketJob"
Cohesion: 0.06
Nodes (52): Execute, installDependencies(), major(), removeAdoptedClone(), namedRepairIds(), Check, harnessChecks(), harnessValidate() (+44 more)

### Community 1 - "agents.ts"
Cohesion: 0.06
Nodes (42): IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), intakeMembership(), projectListScope(), cecIntakePrompt(), cecReadbackPrompt() (+34 more)

### Community 2 - "scope-repair-resume.ts"
Cohesion: 0.05
Nodes (100): PrerequisitesSchema, activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal (+92 more)

### Community 3 - "MapView.tsx"
Cohesion: 0.06
Nodes (72): ref_react_markdown, ref_remark_gfm, ref_yaml, KnowledgeActivity, KnowledgeActivityPage, KnowledgeEdge, KnowledgeMap, KnowledgeNode (+64 more)

### Community 4 - "github-context.ts"
Cohesion: 0.11
Nodes (42): deliveryTask(), observe(), assertAutomationEffects(), automationMergePolicy(), observeAutomationMerge(), routeAutomationMerge(), checksFailed(), checksPassed() (+34 more)

### Community 5 - "session-context-file.ts"
Cohesion: 0.21
Nodes (13): ref_node_perf_hooks, contextFoldPrefix, SessionContextCheckpoint, captureSessionContextClone(), ContextReadPhase, SessionContextDeadline, sessionContextFile(), ContextReadChanged (+5 more)

### Community 6 - "artifact"
Cohesion: 0.07
Nodes (86): ref_node_os, partialLocalCleanupCandidate(), savedActivationFailure(), allowed, continuationNativeReview(), continuationWorkerProof(), negativeWorker(), candidateInput() (+78 more)

### Community 7 - "MaintenanceRun"
Cohesion: 0.14
Nodes (17): BrainStatusSchema, identity, brainCheckpointCompletion(), coverageSchema, followupSchema, verified, reconcileCompletedCheckpoints(), checkpointHasMaintenanceAlert() (+9 more)

### Community 8 - "ref_node_crypto"
Cohesion: 0.08
Nodes (59): ref_node_crypto, ref_zod, approveFeature(), featureById(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key() (+51 more)

### Community 9 - "index.ts"
Cohesion: 0.11
Nodes (19): ref_hono_node_server, ref_node_http, ref_vite, close(), config, itSpecialist, loadedRevision, offices (+11 more)

### Community 10 - "ControlStore"
Cohesion: 0.18
Nodes (4): DailyCTO, EvidenceRequestConflict, ControlStore, DailyCTOReport

### Community 11 - "Inspector.tsx"
Cohesion: 0.10
Nodes (68): Conversation(), SlackDeliveryCard(), ServiceHealthPanel(), followUp(), labels, ServiceHealthRow(), BlockerFollowups(), LearningCoverage() (+60 more)

### Community 12 - "assignments.ts"
Cohesion: 0.09
Nodes (35): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, GraphNode (+27 more)

### Community 13 - "Button"
Cohesion: 0.10
Nodes (36): LessonDecisionAction, lessonDecisionState(), readLessonDecision(), Outbox(), ctoInputFailure(), OutboxCTOInput(), recover(), OutboxLessonDecision() (+28 more)

### Community 14 - "App.tsx"
Cohesion: 0.05
Nodes (47): ref_lucide_react, ref_motion, ref_react_dom, BrainDrawer(), blank(), Goals(), resetDraft(), save() (+39 more)

### Community 15 - "ref_node_path"
Cohesion: 0.09
Nodes (43): ref_node_fs, ref_node_path, accounting, DeliverySubject, nonDelivery, originalReads, HarnessControl, withHarnessWork() (+35 more)

### Community 16 - "currentAssignment"
Cohesion: 0.12
Nodes (28): recoverCTOInput(), deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, requireDeliveryAuthority(), deliveryIntakeBlocker(), gateRegisteredDelivery() (+20 more)

### Community 17 - "pilot-delivery.ts"
Cohesion: 0.11
Nodes (59): continueImplementation(), dispatchNightly(), drainDelivery(), requestDelivery(), resume(), startPilot(), eligibility(), admit() (+51 more)

### Community 18 - ".emit"
Cohesion: 0.10
Nodes (33): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+25 more)

### Community 19 - "notifications.ts"
Cohesion: 0.10
Nodes (28): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR (+20 more)

### Community 20 - "digest"
Cohesion: 0.09
Nodes (60): ref_node_util, harnessCloseout(), PASSING, verifyMergeActions(), assertDeliveryMayMutate(), retryRead(), runHarnessStage(), harnessStageResult() (+52 more)

### Community 21 - "TimeBook.tsx"
Cohesion: 0.15
Nodes (28): TelemetryReport, TelemetryRow, ROLE_NAMES, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens() (+20 more)

### Community 22 - "Effects"
Cohesion: 0.14
Nodes (18): dispatchedMetadataEffect(), diagnosticProof(), ownedArtifact(), rawHash(), recoverDiscovery(), scopeNote(), GitHubOperations, fileLessonIssue() (+10 more)

### Community 23 - "ref_react"
Cohesion: 0.17
Nodes (30): ref_react, SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState (+22 more)

### Community 24 - "maintenance/maintenance.ts"
Cohesion: 0.10
Nodes (25): ApproachSchema, maintenancePolicies(), captureMaintenanceStep(), BrainMaintenance, candidateOwner(), SETTLED, skipOwnedCandidate(), Skipped (+17 more)

### Community 25 - "store.ts"
Cohesion: 0.12
Nodes (23): ref_node_sqlite, snapshot(), Clock, EASTERN, easternDayFormatter, easternPartsFormatter, systemClock, DATA (+15 more)

### Community 26 - "cec/workflow.ts"
Cohesion: 0.07
Nodes (54): implementationWorkerContext(), applyIntakeObservation(), checkMail(), drainMail(), requestMail(), parksInJira(), cecPrompt(), resolvedDecisionNote() (+46 more)

### Community 27 - "config.ts"
Cohesion: 0.06
Nodes (41): Admission, WAIT_STATUSES, FeaturePlanningBindings, FeaturePlanningConfig, POLICY_VERSION, normalizeRound(), pendingQuestions(), QuestionNotifications (+33 more)

### Community 28 - "Role"
Cohesion: 0.10
Nodes (43): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+35 more)

### Community 29 - "run-retrospective.ts"
Cohesion: 0.09
Nodes (45): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, blockingTrigger, isBlocking(), brainOverlap (+37 more)

### Community 30 - "record-trigger.ts"
Cohesion: 0.11
Nodes (38): LEARNING_BASELINES, maintainLearning(), clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates(), maintenanceCompletedId(), maintenanceKey() (+30 more)

### Community 31 - "run.ts"
Cohesion: 0.10
Nodes (35): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationCandidates(), investigationId(), investigationEvidence(), investigationFollowUps(), INVOCATION_SOURCE_REFS, invocationSource() (+27 more)

### Community 32 - "run-accounting.ts"
Cohesion: 0.05
Nodes (67): BoundedRead, done(), readBoundedNoFollow(), reasonOf(), EvidenceOutcome, CompletionReader, add(), CodexRequest (+59 more)

### Community 33 - "azure.ts"
Cohesion: 0.09
Nodes (32): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+24 more)

### Community 34 - "github-delivery.ts"
Cohesion: 0.07
Nodes (69): containedFile(), findingsBlock(), handsOff(), BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction(), discover() (+61 more)

### Community 36 - "shared.ts"
Cohesion: 0.06
Nodes (50): partialLocalCleanupKey(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), assignmentDiagnostics(), ITContext, diagnosticContext() (+42 more)

### Community 37 - "enrollment-gate.ts"
Cohesion: 0.21
Nodes (17): currentApproval(), featureGate(), predecessorComplete(), automaticIntakeWait(), publishFeature(), deliveryPreflight, handoffBinding(), readHandoff() (+9 more)

### Community 38 - "lessons-view.ts"
Cohesion: 0.12
Nodes (19): lessonBrainAudit, LessonBrainOverlap, CONSOLIDATED, CONSOLIDATED_AT, SEEDS, SEEDS, Lesson, OfficeProposal (+11 more)

### Community 39 - "index.tsx"
Cohesion: 0.09
Nodes (33): SendMessage, FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), send(), phases, LinkedFeatures() (+25 more)

### Community 40 - "closeout-recovery.ts"
Cohesion: 0.09
Nodes (49): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+41 more)

### Community 41 - "scheduled-work.ts"
Cohesion: 0.15
Nodes (24): deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), metadataRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), requestPriority(), closedTicketRequest() (+16 more)

### Community 42 - "source-amendment.ts"
Cohesion: 0.07
Nodes (63): ref_node_async_hooks, approvedText(), assert(), amendmentIssueSha256(), authorizeSourceAmendment(), Binding, assert(), normalize() (+55 more)

### Community 43 - ".transaction"
Cohesion: 0.14
Nodes (24): featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS, reserveReplacement(), stageBudget() (+16 more)

### Community 44 - ".save"
Cohesion: 0.18
Nodes (30): jiraCollection(), BLOCKED, findComment(), LiveIssue, readIssue(), readIssues(), Execute, jira() (+22 more)

### Community 45 - "time-scope.ts"
Cohesion: 0.13
Nodes (31): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), server_telemetry_billable_work_issue_key, isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence() (+23 more)

### Community 46 - "OfficeScene.tsx"
Cohesion: 0.16
Nodes (33): withoutElapsed(), Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk() (+25 more)

### Community 47 - "cost-ledger.ts"
Cohesion: 0.16
Nodes (26): captureCost(), server_telemetry_cost_entries_costcoveragesummary, costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress() (+18 more)

### Community 48 - "candidate.ts"
Cohesion: 0.12
Nodes (27): GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles(), ContinuationIO (+19 more)

### Community 49 - "weekly-rollup.ts"
Cohesion: 0.10
Nodes (30): expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), BRAIN_SCOPE, SUBJECT (+22 more)

### Community 50 - "Store"
Cohesion: 0.08
Nodes (19): ROLES, GitHubFeaturePublisher, FeatureReviewRunner, officeCapacity, fifo(), ScheduledWork, Scheduler, selectWork() (+11 more)

### Community 51 - "knowledge.ts"
Cohesion: 0.10
Nodes (30): clip(), DEMAND_LIMIT, demandFacts(), DemandSection, key(), LessonKey, notes(), learningMetrics() (+22 more)

### Community 52 - "cec/issue-publication.ts"
Cohesion: 0.17
Nodes (10): Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), Transition, descriptionPreimage(), plain() (+2 more)

### Community 53 - "harnessEffect"
Cohesion: 0.21
Nodes (25): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), ProjectCard, projectCards(), projectGraphql() (+17 more)

### Community 54 - "dependency-bots/adopt.ts"
Cohesion: 0.13
Nodes (36): Execute, readBackOrThrow(), adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR (+28 more)

### Community 55 - "github/issue-publication.ts"
Cohesion: 0.15
Nodes (11): FeaturePublisher, PublicationReceipt, Assign, Board, Content, GitHubIssuePublisher, number(), same() (+3 more)

### Community 56 - "outbox.ts"
Cohesion: 0.12
Nodes (24): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), ctoInputRecovered(), conversationResolved(), projectOutbox(), syncOutbox(), slackRequestSettled() (+16 more)

### Community 57 - "lesson-selection.ts"
Cohesion: 0.13
Nodes (21): INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), MAINTENANCE, MAX_LESSONS, normalPath() (+13 more)

### Community 58 - "http/commands.ts"
Cohesion: 0.12
Nodes (29): configureNotices(), retryRecipientLookup(), enqueueGreen156(), bindDiscoveryResume(), DiscoveryResumeInput, enqueueMetadataRecovery(), normalizeStatement(), baselineLearning() (+21 more)

### Community 59 - "work.ts"
Cohesion: 0.10
Nodes (24): BLOCKED_CAUSES, blockedCauses(), projectReadiness(), explanation(), LABELS, stoppedReason(), ProjectReadiness, AssignmentResult (+16 more)

### Community 60 - "retrospective-subject.ts"
Cohesion: 0.13
Nodes (21): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+13 more)

### Community 61 - "jira-time.ts"
Cohesion: 0.14
Nodes (20): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+12 more)

### Community 63 - "dependencies.ts"
Cohesion: 0.14
Nodes (19): reconcileNoticeConfirmations(), compatible(), dependencyCompletionKey(), dependencyEligibility(), DependencyStores, issueKey(), observePrerequisites(), PrerequisiteSchema (+11 more)

### Community 64 - "ticket-evidence.ts"
Cohesion: 0.11
Nodes (30): CommentPage, commentReadback(), JiraOperations, plain(), jiraRecord(), unpack(), metadataDigest(), verifiedTransition() (+22 more)

### Community 65 - "assignment-poll.ts"
Cohesion: 0.16
Nodes (14): noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), admitReadyCards(), DependencyBot, pinCourier, ACTIONS, OWNER (+6 more)

### Community 66 - "constellation-runtime.ts"
Cohesion: 0.15
Nodes (17): ref_3d_force_graph, ref_three, CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point (+9 more)

### Community 67 - "remove-candidate.ts"
Cohesion: 0.18
Nodes (18): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot() (+10 more)

### Community 68 - "work-summary.ts"
Cohesion: 0.09
Nodes (35): compactSteps(), displayAgentTask(), LiveAgentTask(), Props, RunningTask(), text(), AzureBuild, src_shared_liveanchor (+27 more)

### Community 69 - "Offices"
Cohesion: 0.11
Nodes (10): ref_smol_toml, CommittedBrain, seedOfficeLessons(), file, project, root, projectById(), projectData() (+2 more)

### Community 70 - "process.ts"
Cohesion: 0.14
Nodes (19): Event, one(), prePushRejection(), PushIdentity, Candidate, settledPushBoundary(), inactivityWatch(), At (+11 more)

### Community 71 - "pendingRounds"
Cohesion: 0.23
Nodes (16): commandFeature(), reviewQuestions(), confirmBrief(), recoveryHeld(), applyHarnessAction(), HarnessActionInput, harnessQuestion(), recoveryPreconditions() (+8 more)

### Community 72 - "recovery/stopped-base-update.ts"
Cohesion: 0.12
Nodes (26): assertStoppedBaseAudit(), AuditRow, CoverageRow, Hash, Kind, stoppedBaseAuditMarker, Original, redact() (+18 more)

### Community 73 - "coordination.ts"
Cohesion: 0.12
Nodes (16): IntakeContext, checkpointWindow(), coordination(), dueAt(), hours, localDay(), ReviewResult, deferNonReady() (+8 more)

### Community 74 - "api-routes.ts"
Cohesion: 0.25
Nodes (11): implementationPreview(), implementationContinuationRoute(), assertQuestionVisibility(), goalHistory(), apiRoute(), fileResponse(), json(), staticRoute() (+3 more)

### Community 75 - "admit-improvement.ts"
Cohesion: 0.16
Nodes (22): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+14 more)

### Community 76 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 77 - "worker-runtime.ts"
Cohesion: 0.07
Nodes (39): candidateWorkspaceEnvironment(), assignmentSubject(), LessonSelection, catalogLine(), assertBriefingScope(), contextPacket(), CODEX_DEFAULT_EFFORT, CODEX_DEFAULT_MODEL (+31 more)

### Community 78 - "command"
Cohesion: 0.10
Nodes (14): correlatedBuild(), candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), providers (+6 more)

### Community 79 - "atmosphere.ts"
Cohesion: 0.28
Nodes (7): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), SCENE_COLOR_TOKENS, TOKENS

### Community 80 - "QuestionStepper.tsx"
Cohesion: 0.19
Nodes (18): FeatureQuestionProjection, OutboxQuestionRound(), send(), draftKey(), readDraft(), saveDraft(), QuestionRound(), nextQuestion() (+10 more)

### Community 81 - "brain-maintenance.ts"
Cohesion: 0.19
Nodes (13): completeNativeCheckpoint(), BRAIN_DEPENDENCY_MERGES, BrainResult, capped(), queueMaintenanceNotice(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance() (+5 more)

### Community 82 - "evidence-digest.ts"
Cohesion: 0.44
Nodes (7): canonical(), evidenceDigest(), evidenceHash(), semantic(), stableUrl(), requirementDrift(), RequirementPostimage

### Community 83 - "preferences-store.ts"
Cohesion: 0.13
Nodes (15): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, acceptPreferences(), PreferenceCandidate (+7 more)

### Community 84 - "scene-motion.ts"
Cohesion: 0.29
Nodes (15): Handoff(), avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay() (+7 more)

### Community 85 - "session-bridge.ts"
Cohesion: 0.14
Nodes (15): ref_ws, claudeSessionContext(), codexDaemonProcesses(), codexSessionContext(), idleExecServers(), isExecServer(), processTable, claudeSessions() (+7 more)

### Community 86 - "report.ts"
Cohesion: 0.24
Nodes (14): telemetryRoute(), TelemetrySync, Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount() (+6 more)

### Community 87 - "workKey"
Cohesion: 0.16
Nodes (18): completedPRReviews(), dependencyVersion(), hasSavedPrerequisiteResult(), Ownership, qualified(), readDependencies(), requireSavedPrerequisites(), requireThat() (+10 more)

### Community 88 - "capture-session-clone.py"
Cohesion: 0.15
Nodes (10): ctypes, errno, importlib_util, json, os, pathlib, Copy a coherent macOS clone of inherited reader fd3 to anonymous target fd4. No…, Read-only protocol adapter for the installed review helper. No model dispatch. (+2 more)

### Community 89 - "extraction.ts"
Cohesion: 0.18
Nodes (10): ref_node_child_process, ref_node_string_decoder, extractDocument, Extraction, Extractor, GIT_NETWORK, LIVE_PROVIDERS, liveReach() (+2 more)

### Community 90 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (10): ref_react_three_drei, ref_react_three_fiber, ref_three_stdlib, CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility (+2 more)

### Community 91 - "createConstellation"
Cohesion: 0.19
Nodes (5): ConstellationRuntime, createConstellation(), enter(), finishTap(), move()

### Community 92 - "fact-bounds.ts"
Cohesion: 0.23
Nodes (16): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+8 more)

### Community 93 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (6): ref_mammoth, ref_pdfjs_dist, bounded(), extract(), fail(), [path,kind]

### Community 94 - "daily-cto.ts"
Cohesion: 0.18
Nodes (14): evidenceRequestConflicts, dailyReviewPrompt(), dailyReviewDate(), reviewWeekday(), applyGoalReview(), DailyResultSchema, EvidenceRefSchema, FreshDailyResultSchema (+6 more)

### Community 95 - "local-config.ts"
Cohesion: 0.28
Nodes (11): AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), goalEvidencePath(), OfficeConfigInputs, officeConfigRoute(), officeConfigSummary(), CECBinding, localBindings (+3 more)

### Community 97 - "claude-session-context.ts"
Cohesion: 0.26
Nodes (9): readTranscript, root, claudeSessionScope(), readRollout, LiveSession, ContextProject, ContextReader, SessionContext (+1 more)

### Community 98 - "session-coverage.ts"
Cohesion: 0.29
Nodes (9): accountCodexProcesses(), codexProcessInventory, DesktopSessions, unaccountedProcesses(), completeSessionCoverage(), desktopCoverageGap(), knownActivity(), Report (+1 more)

### Community 105 - "session-scope.ts"
Cohesion: 0.29
Nodes (8): retainSessionMessage(), SessionConversation, jiraCommandIssues(), scopeParser(), ScopeParserState, ScopeProject, sessionScopeParser(), siteHost()

### Community 106 - "cli.ts"
Cohesion: 0.20
Nodes (8): ref_node_stream, ref_node_timers, args, [cmd,...rawArgs], commands, key, projectIndex, PORT

### Community 107 - "merge-scanner-retry.ts"
Cohesion: 0.44
Nodes (8): officeMergeProvenance(), reconcileMergeScannerRetry(), Retry, retryMergeScanner(), retryReadBack(), runIdentity(), savedRetry(), transientScannerJobs()

### Community 108 - "retire-history.ts"
Cohesion: 0.33
Nodes (7): enqueueHistoryRetirement(), historicalRecordDigest(), Intent, records(), retireIncompleteHistory(), HistoryRetirement, HistoryRetirementIntent

### Community 109 - "time-readback.ts"
Cohesion: 0.36
Nodes (5): TimeLedger, Readback, READBACK_INTERVAL_MS, readBackTime(), SETTLE_MS

### Community 110 - "leadership.ts"
Cohesion: 0.25
Nodes (7): DailyCTOBriefing, DailyCTOResult, DailyGoalUpdate, GoalEvidenceRef, GoalEvidenceRequest, GoalProgress, GoalStatus

### Community 111 - "install-service.mjs"
Cohesion: 0.29
Nodes (5): ref_node_url, file, folder, logs, root

### Community 112 - "goals.ts"
Cohesion: 0.43
Nodes (4): GoalInput, saveGoal(), queueGoalNotice(), ProjectGoal

### Community 113 - "engine.ts"
Cohesion: 0.53
Nodes (4): enableNightly(), drainMaintenance(), reconcileMaintenance(), requestMaintenance()

### Community 114 - "office-state-view.ts"
Cohesion: 0.60
Nodes (4): leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore()

### Community 115 - "highestStableAtLeast"
Cohesion: 0.83
Nodes (3): compare(), highestStableAtLeast(), parts()

## Knowledge Gaps
- **490 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+485 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 634 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `TicketJob`, `agents.ts`, `scope-repair-resume.ts`, `github-context.ts`, `artifact`, `MaintenanceRun`, `ref_node_crypto`, `assignments.ts`, `Button`, `ref_node_path`, `currentAssignment`, `pilot-delivery.ts`, `.emit`, `notifications.ts`, `digest`, `Effects`, `maintenance/maintenance.ts`, `store.ts`, `cec/workflow.ts`, `config.ts`, `run-retrospective.ts`, `record-trigger.ts`, `run.ts`, `run-accounting.ts`, `azure.ts`, `github-delivery.ts`, `Engine`, `shared.ts`, `enrollment-gate.ts`, `closeout-recovery.ts`, `scheduled-work.ts`, `source-amendment.ts`, `.transaction`, `.save`, `time-scope.ts`, `cost-ledger.ts`, `candidate.ts`, `weekly-rollup.ts`, `knowledge.ts`, `cec/issue-publication.ts`, `harnessEffect`, `dependency-bots/adopt.ts`, `github/issue-publication.ts`, `outbox.ts`, `lesson-selection.ts`, `http/commands.ts`, `retrospective-subject.ts`, `jira-time.ts`, `dependencies.ts`, `ticket-evidence.ts`, `assignment-poll.ts`, `remove-candidate.ts`, `Offices`, `process.ts`, `pendingRounds`, `recovery/stopped-base-update.ts`, `coordination.ts`, `api-routes.ts`, `admit-improvement.ts`, `worker-runtime.ts`, `command`, `brain-maintenance.ts`, `session-bridge.ts`, `report.ts`, `workKey`, `daily-cto.ts`, `ProjectProgress`, `retire-history.ts`, `time-readback.ts`, `goals.ts`, `engine.ts`, `office-state-view.ts`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **Why does `Engine` connect `Engine` to `agents.ts`, `artifact`, `ref_node_crypto`, `pilot-delivery.ts`, `.emit`, `notifications.ts`, `Effects`, `maintenance/maintenance.ts`, `cec/workflow.ts`, `config.ts`, `azure.ts`, `github-delivery.ts`, `scheduled-work.ts`, `candidate.ts`, `dependencies.ts`, `ticket-evidence.ts`, `Offices`, `coordination.ts`, `command`, `engine.ts`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `TicketJob` connect `TicketJob` to `scope-repair-resume.ts`, `github-context.ts`, `artifact`, `MaintenanceRun`, `Button`, `ref_node_path`, `currentAssignment`, `pilot-delivery.ts`, `digest`, `cec/workflow.ts`, `config.ts`, `record-trigger.ts`, `github-delivery.ts`, `shared.ts`, `closeout-recovery.ts`, `source-amendment.ts`, `Store`, `harnessEffect`, `dependency-bots/adopt.ts`, `retrospective-subject.ts`, `dependencies.ts`, `remove-candidate.ts`, `work-summary.ts`, `process.ts`, `recovery/stopped-base-update.ts`, `command`, `workKey`, `fact-bounds.ts`, `ProjectProgress`, `merge-scanner-retry.ts`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _490 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `TicketJob` be split into smaller, more focused modules?**
  _Cohesion score 0.06139512661251792 - nodes in this community are weakly interconnected._
- **Should `agents.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0629800307219662 - nodes in this community are weakly interconnected._
- **Should `scope-repair-resume.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05083996463306808 - nodes in this community are weakly interconnected._