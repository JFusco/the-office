# Graph Report - office-followup-clarity-nov13  (2026-11-13)

## Corpus Check
- 762 files · ~313,630 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3885 nodes · 18206 edges · 89 communities (85 shown, 4 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 590 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ba1d763a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- github-readiness.ts
- ref_node_path
- ref_react
- Inspector.tsx
- workKey
- source-amendment.ts
- index.ts
- scheduler.ts
- agents.ts
- reader.ts
- brain-maintenance.ts
- session-bridge.ts
- delivery-recoveries.ts
- github-delivery.ts
- App.tsx
- digest
- features/workflow.ts
- index.tsx
- recovery/stopped-base-update.ts
- local-config.ts
- post-conflict-preparation.ts
- scheduled-captures.ts
- ref_zod
- .save
- coordination.ts
- maintenance/maintenance.ts
- PeoplePanel.tsx
- fact-bounds.ts
- .run
- record-trigger.ts
- run-retrospective.ts
- knowledge.ts
- contract.ts
- Store
- cec/issue-publication.ts
- Outbox.tsx
- azure.ts
- engine.ts
- ticket-evidence.ts
- .transaction
- it-specialist.ts
- requests.ts
- .getEffect
- run.ts
- discovery-recovery.ts
- run-accounting.ts
- .emit
- dependency-bots/adopt.ts
- outbox.ts
- telemetry.ts
- cost-ledger.ts
- OfficeScene.tsx
- lesson-selection.ts
- accept-stage-result.ts
- assignments.ts
- weekly-rollup.ts
- remove-candidate.ts
- time-scope.ts
- admit-improvement.ts
- TimeBook.tsx
- control-store.ts
- Goals.tsx
- cli.ts
- conversations/slack.ts
- report.ts
- ledger.ts
- Coordinator
- createConstellation
- jira-time.ts
- QuestionStepper.tsx
- scheduled-work.ts
- constellation-runtime.ts
- blocker-followups.ts
- service-health.ts
- assignment-poll.ts
- PreferencesStore
- Offices
- evidence.ts
- retrospective-subject.ts
- node-visuals.ts
- work.ts
- scene-motion.ts
- RoomCamera.tsx
- handover-cms.ts
- features.ts
- shared.ts
- CommandRegistry
- extract-worker.mjs
- helper-evidence.py

## God Nodes (most connected - your core abstractions)
1. `Store` - 344 edges
2. `TicketJob` - 174 edges
3. `digest()` - 160 edges
4. `artifact()` - 129 edges
5. `GitHubDelivery` - 122 edges
6. `command()` - 108 edges
7. `workKey()` - 99 edges
8. `cx()` - 88 edges
9. `currentAssignment()` - 82 edges
10. `Button` - 82 edges

## Surprising Connections (you probably didn't know these)
- `LessonBrainOverlap` --references--> `Lesson`  [EXTRACTED]
  server/knowledge/lesson-brain-audit.ts → src/contracts/knowledge.ts
- `projectOutbox()` --calls--> `deferredPickup()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/pickup-state.ts
- `projectOutbox()` --calls--> `parkedProviderWait()`  [EXTRACTED]
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

## Communities (89 total, 4 thin omitted)

### Community 0 - "github-readiness.ts"
Cohesion: 0.09
Nodes (54): findingsBlock(), hasUncertainEffects(), observe(), assertAutomationEffects(), automationMergePolicy(), observeAutomationMerge(), routeAutomationMerge(), checksFailed() (+46 more)

### Community 1 - "ref_node_path"
Cohesion: 0.05
Nodes (114): ref_node_fs, ref_node_os, ref_node_path, ref_node_util, closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim() (+106 more)

### Community 2 - "ref_react"
Cohesion: 0.06
Nodes (73): ref_lucide_react, ref_react, ref_react_markdown, ref_remark_gfm, ref_yaml, KnowledgeActivity, KnowledgeEdge, KnowledgeMap (+65 more)

### Community 3 - "Inspector.tsx"
Cohesion: 0.13
Nodes (56): Outbox(), ServiceHealthPanel(), followUp(), labels, ServiceHealthRow(), BlockerFollowups(), LearningCoverage(), LessonsPanel() (+48 more)

### Community 4 - "workKey"
Cohesion: 0.06
Nodes (94): recordJobApproach(), completedPRReviews(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash (+86 more)

### Community 5 - "source-amendment.ts"
Cohesion: 0.06
Nodes (71): ref_node_async_hooks, adoptCandidate(), reported, Scope, directionContract(), scopeRepairDirection(), approvedText(), assert() (+63 more)

### Community 6 - "index.ts"
Cohesion: 0.07
Nodes (45): ref_hono_node_server, ref_node_http, ref_vite, close(), config, itSpecialist, loadedRevision, offices (+37 more)

### Community 7 - "scheduler.ts"
Cohesion: 0.16
Nodes (14): ROLES, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch(), deliveryOccupied() (+6 more)

### Community 8 - "agents.ts"
Cohesion: 0.07
Nodes (56): intakeMembership(), cecPrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), resolvedDecisionNote(), stageInstructions, cecChatPrompt() (+48 more)

### Community 9 - "reader.ts"
Cohesion: 0.08
Nodes (39): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, CommittedBrain (+31 more)

### Community 10 - "brain-maintenance.ts"
Cohesion: 0.08
Nodes (35): maintenancePolicies(), completeNativeCheckpoint(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice(), candidateOwner() (+27 more)

### Community 11 - "session-bridge.ts"
Cohesion: 0.07
Nodes (45): ref_ws, claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexDaemonProcesses(), accountCodexProcesses(), codexProcessInventory (+37 more)

### Community 12 - "delivery-recoveries.ts"
Cohesion: 0.15
Nodes (24): deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), deliveryIntakeBlocker(), gateRegisteredDelivery(), resolveDeliveryWork(), HANDS_OFF_PROJECTS, handsOff() (+16 more)

### Community 13 - "github-delivery.ts"
Cohesion: 0.05
Nodes (82): Execute, installDependencies(), major(), removeAdoptedClone(), harnessCloseout(), PASSING, verifyMergeActions(), namedRepairIds() (+74 more)

### Community 14 - "App.tsx"
Cohesion: 0.05
Nodes (68): ref_motion, ref_react_dom, FeatureDelivery(), FeatureDocuments(), views, BrainDrawer(), themeColor, App() (+60 more)

### Community 15 - "digest"
Cohesion: 0.09
Nodes (59): activeEffectId(), harnessEffect, retryRead(), draftReadHeadMatches(), assertDraftClaimHistory(), linkDraftIssue(), protectedOriginalClaim(), admitPRMetadata() (+51 more)

### Community 16 - "features/workflow.ts"
Cohesion: 0.08
Nodes (53): approveFeature(), featureById(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), artifactPath(), digest() (+45 more)

### Community 17 - "index.tsx"
Cohesion: 0.11
Nodes (44): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView() (+36 more)

### Community 18 - "recovery/stopped-base-update.ts"
Cohesion: 0.12
Nodes (29): pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), assertStoppedBaseAudit(), AuditRow, CoverageRow, Hash, Kind, stoppedBaseAuditMarker (+21 more)

### Community 19 - "local-config.ts"
Cohesion: 0.13
Nodes (20): IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), projectListScope(), cecIntakePrompt(), AUTO_ADOPT_BOTS, assertFeaturePlanningConfig() (+12 more)

### Community 20 - "post-conflict-preparation.ts"
Cohesion: 0.10
Nodes (40): assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), reconcileCompletedConflictDraft(), routeReadyPostConflictPublication(), verifyInitialDraftConflictPreparation() (+32 more)

### Community 21 - "scheduled-captures.ts"
Cohesion: 0.15
Nodes (46): createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest, captureRequests() (+38 more)

### Community 22 - "ref_zod"
Cohesion: 0.08
Nodes (37): ref_zod, assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO() (+29 more)

### Community 23 - ".save"
Cohesion: 0.06
Nodes (70): correlatedBuild(), applyIntakeObservation(), checkMail(), drainMail(), requestMail(), BLOCKED, Execute, findComment() (+62 more)

### Community 24 - "coordination.ts"
Cohesion: 0.08
Nodes (44): reconcileNoticeConfirmations(), Admission, admit(), IntakeContext, WAIT_STATUSES, compatible(), dependencyCompletionKey(), dependencyEligibility() (+36 more)

### Community 25 - "maintenance/maintenance.ts"
Cohesion: 0.14
Nodes (16): APPROACH_GUIDANCE, ApproachSchema, reviewInstructions(), deliveryTask(), DeliveryTaskInput, DISCOVERY_GUIDANCE, compactSteps(), featureDeliveryContext() (+8 more)

### Community 26 - "PeoplePanel.tsx"
Cohesion: 0.10
Nodes (43): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+35 more)

### Community 27 - "fact-bounds.ts"
Cohesion: 0.12
Nodes (25): leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance() (+17 more)

### Community 28 - ".run"
Cohesion: 0.09
Nodes (17): candidateWorkspaceEnvironment(), assignmentSubject(), assertBriefingScope(), ClaudeStream, codexNotifyArguments(), LaunchPolicy, LaunchPolicyReceipt, retainLaunchPolicy() (+9 more)

### Community 29 - "record-trigger.ts"
Cohesion: 0.11
Nodes (38): baselineLearning(), LEARNING_BASELINES, maintainLearning(), clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates(), maintenanceCompletedId() (+30 more)

### Community 30 - "run-retrospective.ts"
Cohesion: 0.06
Nodes (66): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, blockingTrigger, isBlocking(), brainOverlap (+58 more)

### Community 31 - "knowledge.ts"
Cohesion: 0.09
Nodes (28): normalizeStatement(), decideOfficeProposal(), now(), OfficeKnowledgeStore, proposeOfficeLessons(), retireOfficeLesson(), Input, promoteNoteLesson() (+20 more)

### Community 32 - "contract.ts"
Cohesion: 0.08
Nodes (27): ref_node_child_process, ref_node_url, file, folder, logs, root, Event, one() (+19 more)

### Community 33 - "Store"
Cohesion: 0.03
Nodes (43): GitHubFeaturePublisher, JiraFeaturePublisher, QuestionNotifications, GitHubMonitor, Assign, Board, Content, queueLessonIssueCheck() (+35 more)

### Community 34 - "cec/issue-publication.ts"
Cohesion: 0.10
Nodes (19): CommentPage, commentReadback(), Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), Transition (+11 more)

### Community 35 - "Outbox.tsx"
Cohesion: 0.11
Nodes (29): Conversation(), SendMessage, LessonDecisionAction, lessonDecisionState(), readLessonDecision(), ctoInputFailure(), OutboxCTOInput(), recover() (+21 more)

### Community 36 - "azure.ts"
Cohesion: 0.10
Nodes (30): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+22 more)

### Community 37 - "engine.ts"
Cohesion: 0.13
Nodes (32): dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), resume(), startPilot(), MISSING_SAVED_PLAN, recoverSavedPlan() (+24 more)

### Community 38 - "ticket-evidence.ts"
Cohesion: 0.12
Nodes (32): ref_node_string_decoder, assetDownloader(), attachmentKind(), evidenceDirectory(), readEvidence(), storeEvidence(), blankEvidence(), CoverageState (+24 more)

### Community 39 - ".transaction"
Cohesion: 0.09
Nodes (40): ref_node_crypto, featureItemComplete(), reconcileFeatureCompletion(), discoveryPrompt(), planPrompt(), helperTelemetry(), DELAYS, MAX_EXECUTIONS (+32 more)

### Community 40 - "it-specialist.ts"
Cohesion: 0.24
Nodes (12): savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), ITContext, publishITReport(), delays, recoverAttempt() (+4 more)

### Community 41 - "requests.ts"
Cohesion: 0.12
Nodes (35): DeliveryAuthorityInput, accounting, DeliverySubject, nonDelivery, originalReads, HarnessControl, withHarnessWork(), hasSavedPrerequisiteResult() (+27 more)

### Community 42 - ".getEffect"
Cohesion: 0.19
Nodes (12): publishFeature(), reconcilePublication(), uncertainPublications(), reserveIdentity(), GitHubOperations, fileLessonIssue(), lessonIssueBody(), lessonIssueMarker() (+4 more)

### Community 43 - "run.ts"
Cohesion: 0.18
Nodes (15): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, OFFICE_FIX_PROMPT, OfficeFixResult, validateOfficeFix(), investigationReady(), InvestigationOptions, InvestigationReport (+7 more)

### Community 44 - "discovery-recovery.ts"
Cohesion: 0.13
Nodes (18): Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership, rawHash() (+10 more)

### Community 45 - "run-accounting.ts"
Cohesion: 0.09
Nodes (41): BoundedRead, done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf(), add(), CodexRequest (+33 more)

### Community 46 - ".emit"
Cohesion: 0.14
Nodes (27): configureChannelNotices(), configureNotices(), retryRecipientLookup(), recoverCTOInput(), enqueueGreen156(), failedWorker(), requeueWaitedImplement(), enqueueMetadataRecovery() (+19 more)

### Community 47 - "dependency-bots/adopt.ts"
Cohesion: 0.06
Nodes (74): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard, projectCards() (+66 more)

### Community 48 - "outbox.ts"
Cohesion: 0.16
Nodes (17): ctoInputRecovered(), conversationResolved(), projectOutbox(), syncOutbox(), finishSupersededReadback(), projectSlackDeliveries(), settleRequestedSlackReplacement(), Input (+9 more)

### Community 49 - "telemetry.ts"
Cohesion: 0.10
Nodes (26): CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL, Rates (+18 more)

### Community 50 - "cost-ledger.ts"
Cohesion: 0.15
Nodes (28): captureCost(), server_telemetry_cost_entries_costcoveragesummary, costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId() (+20 more)

### Community 51 - "OfficeScene.tsx"
Cohesion: 0.17
Nodes (32): Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk(), ElevatorStage() (+24 more)

### Community 52 - "lesson-selection.ts"
Cohesion: 0.14
Nodes (17): INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), LessonSelection, MAINTENANCE, MAX_LESSONS (+9 more)

### Community 53 - "accept-stage-result.ts"
Cohesion: 0.14
Nodes (29): containedFile(), acceptStageResult(), acceptConflictRepair(), pendingPreparationCheck(), METADATA_FINDING, mergeAuthorized(), continuationReviewArtifacts(), reconcileContinuationReview() (+21 more)

### Community 54 - "assignments.ts"
Cohesion: 0.10
Nodes (26): clip(), DEMAND_LIMIT, demandFacts(), DemandSection, key(), LessonKey, notes(), assignmentLookups (+18 more)

### Community 55 - "weekly-rollup.ts"
Cohesion: 0.08
Nodes (35): learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), retire(), RollupResult, harperFolder() (+27 more)

### Community 56 - "remove-candidate.ts"
Cohesion: 0.18
Nodes (18): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot() (+10 more)

### Community 57 - "time-scope.ts"
Cohesion: 0.13
Nodes (32): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), server_telemetry_billable_work_issue_key, isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence() (+24 more)

### Community 58 - "admit-improvement.ts"
Cohesion: 0.14
Nodes (24): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+16 more)

### Community 59 - "TimeBook.tsx"
Cohesion: 0.09
Nodes (41): displayAgentTask(), githubStageLabels, withoutElapsed(), LiveAgentTask(), Props, RunningTask(), text(), Agent (+33 more)

### Community 60 - "control-store.ts"
Cohesion: 0.20
Nodes (10): ref_node_sqlite, Clock, applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, statementCache(), initialSnapshot() (+2 more)

### Community 61 - "Goals.tsx"
Cohesion: 0.10
Nodes (28): GoalProgress, OutboxSavedPlan(), reconcile(), send(), TicketPlanningAction(), CTOReview(), goalState, DailyCTO() (+20 more)

### Community 62 - "cli.ts"
Cohesion: 0.17
Nodes (10): ref_node_stream, ref_node_timers, args, [cmd,...rawArgs], commands, key, projectIndex, lessonBrainAudit (+2 more)

### Community 63 - "conversations/slack.ts"
Cohesion: 0.15
Nodes (11): slackSendPrompt(), slackVerifyPrompt(), comparableSlackText(), SlackMessages, SlackRequestSchema, SlackResultSchema, SlackVerificationSchema, maintenanceNoticeAuthorized() (+3 more)

### Community 64 - "report.ts"
Cohesion: 0.18
Nodes (17): ConfirmedSegment, LiveAnchor, ObservationGap, SnapshotOrdering, TimeLedgerState, Acc, bump(), EASTERN (+9 more)

### Community 65 - "ledger.ts"
Cohesion: 0.30
Nodes (10): investigationCandidates(), investigationId(), investigationFollowUps(), investigationResolution(), syncInvestigations(), NOTIFY_HELPER, notifyHelperResolution(), requeueInvestigationEvidence() (+2 more)

### Community 67 - "createConstellation"
Cohesion: 0.19
Nodes (5): ConstellationRuntime, createConstellation(), enter(), finishTap(), move()

### Community 68 - "jira-time.ts"
Cohesion: 0.22
Nodes (13): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+5 more)

### Community 69 - "QuestionStepper.tsx"
Cohesion: 0.19
Nodes (18): FeatureQuestionProjection, OutboxQuestionRound(), send(), draftKey(), readDraft(), saveDraft(), QuestionRound(), nextQuestion() (+10 more)

### Community 70 - "scheduled-work.ts"
Cohesion: 0.14
Nodes (22): deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), metadataRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), requestPriority() (+14 more)

### Community 71 - "constellation-runtime.ts"
Cohesion: 0.15
Nodes (17): ref_3d_force_graph, ref_three, CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point (+9 more)

### Community 72 - "blocker-followups.ts"
Cohesion: 0.35
Nodes (9): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), readBackConversations(), diagnosticSnapshot(), nativeDeliveryResolved(), handoff(), reconcileBlockerFollowups() (+1 more)

### Community 73 - "service-health.ts"
Cohesion: 0.19
Nodes (9): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, slackHealth() (+1 more)

### Community 74 - "assignment-poll.ts"
Cohesion: 0.12
Nodes (22): channelNoticeAuthorized(), ChannelSettings, notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR, plainSlackText() (+14 more)

### Community 78 - "evidence.ts"
Cohesion: 0.31
Nodes (8): investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_SOURCE_PATHS, officeSource(), launchPolicyFacts(), lifecycleFacts()

### Community 79 - "retrospective-subject.ts"
Cohesion: 0.14
Nodes (21): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, maintenanceKey(), azurePrUrl(), findSubject(), jobSubject() (+13 more)

### Community 80 - "node-visuals.ts"
Cohesion: 0.20
Nodes (13): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+5 more)

### Community 81 - "work.ts"
Cohesion: 0.14
Nodes (12): READ_OPERATIONS, RETAINED_PER_ACTION, AssignmentResult, CompletionCondition, DeliveryAdmission, DependencyObservation, EligibilityState, FailureCategory (+4 more)

### Community 82 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 83 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (10): ref_react_three_drei, ref_react_three_fiber, ref_three_stdlib, CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility (+2 more)

### Community 84 - "handover-cms.ts"
Cohesion: 0.40
Nodes (4): ref_smol_toml, file, project, root

### Community 88 - "features.ts"
Cohesion: 0.10
Nodes (36): commandFeature(), reviewQuestions(), assertQuestionVisibility(), applyHarnessAction(), HarnessActionInput, recoveryPreconditions(), recoveryTarget(), normalizeRound() (+28 more)

### Community 90 - "shared.ts"
Cohesion: 0.05
Nodes (48): fields, PreferencesPatch, StoredBody, ProjectReadiness, DailyCTOSummary, PackedPublicationRepair, SlackReplacementRequest, SlackSupersession (+40 more)

### Community 95 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (6): ref_mammoth, ref_pdfjs_dist, bounded(), extract(), fail(), [path,kind]

### Community 97 - "helper-evidence.py"
Cohesion: 0.33
Nodes (5): importlib_util, json, pathlib, Read-only protocol adapter for the installed review helper. No model dispatch., sys

## Knowledge Gaps
- **479 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+474 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 608 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `github-readiness.ts`, `ref_node_path`, `workKey`, `source-amendment.ts`, `index.ts`, `scheduler.ts`, `agents.ts`, `reader.ts`, `brain-maintenance.ts`, `session-bridge.ts`, `delivery-recoveries.ts`, `github-delivery.ts`, `App.tsx`, `digest`, `features/workflow.ts`, `recovery/stopped-base-update.ts`, `post-conflict-preparation.ts`, `scheduled-captures.ts`, `ref_zod`, `.save`, `coordination.ts`, `maintenance/maintenance.ts`, `fact-bounds.ts`, `record-trigger.ts`, `run-retrospective.ts`, `knowledge.ts`, `cec/issue-publication.ts`, `azure.ts`, `engine.ts`, `ticket-evidence.ts`, `.transaction`, `it-specialist.ts`, `requests.ts`, `.getEffect`, `run.ts`, `discovery-recovery.ts`, `run-accounting.ts`, `.emit`, `dependency-bots/adopt.ts`, `outbox.ts`, `cost-ledger.ts`, `lesson-selection.ts`, `accept-stage-result.ts`, `assignments.ts`, `weekly-rollup.ts`, `remove-candidate.ts`, `time-scope.ts`, `admit-improvement.ts`, `control-store.ts`, `conversations/slack.ts`, `ledger.ts`, `jira-time.ts`, `scheduled-work.ts`, `blocker-followups.ts`, `assignment-poll.ts`, `evidence.ts`, `retrospective-subject.ts`, `features.ts`, `shared.ts`?**
  _High betweenness centrality (0.115) - this node is a cross-community bridge._
- **Why does `command()` connect `Store` to `github-readiness.ts`, `ref_node_path`, `workKey`, `agents.ts`, `reader.ts`, `brain-maintenance.ts`, `session-bridge.ts`, `github-delivery.ts`, `digest`, `features/workflow.ts`, `.save`, `coordination.ts`, `maintenance/maintenance.ts`, `.run`, `contract.ts`, `cec/issue-publication.ts`, `azure.ts`, `engine.ts`, `ticket-evidence.ts`, `.transaction`, `requests.ts`, `dependency-bots/adopt.ts`, `cost-ledger.ts`, `weekly-rollup.ts`, `remove-candidate.ts`, `jira-time.ts`, `scheduled-work.ts`, `service-health.ts`, `assignment-poll.ts`, `CommandRegistry`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `workKey()` connect `workKey` to `github-readiness.ts`, `ref_node_path`, `source-amendment.ts`, `scheduler.ts`, `delivery-recoveries.ts`, `github-delivery.ts`, `digest`, `features/workflow.ts`, `recovery/stopped-base-update.ts`, `post-conflict-preparation.ts`, `coordination.ts`, `Store`, `requests.ts`, `.getEffect`, `discovery-recovery.ts`, `dependency-bots/adopt.ts`, `remove-candidate.ts`, `scheduled-work.ts`, `blocker-followups.ts`, `evidence.ts`, `work.ts`, `shared.ts`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _479 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `github-readiness.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09360730593607305 - nodes in this community are weakly interconnected._
- **Should `ref_node_path` be split into smaller, more focused modules?**
  _Cohesion score 0.05242154906584437 - nodes in this community are weakly interconnected._
- **Should `ref_react` be split into smaller, more focused modules?**
  _Cohesion score 0.060073260073260075 - nodes in this community are weakly interconnected._