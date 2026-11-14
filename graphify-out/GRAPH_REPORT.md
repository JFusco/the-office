# Graph Report - office-session-capture-nov13  (2026-11-13)

## Corpus Check
- 770 files · ~316,144 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3926 nodes · 18307 edges · 111 communities (101 shown, 10 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 590 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b459cbb5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- activation-recovery.ts
- github-delivery.ts
- agents.ts
- requests.ts
- Inspector.tsx
- ref_react
- ref_node_path
- source-amendment.ts
- digest
- session-bridge.ts
- authorize.ts
- maintenance/maintenance.ts
- conversations/conversations.ts
- index.ts
- it-specialist.ts
- knowledge.ts
- assignments.ts
- TicketJob
- workKey
- sanitize
- Button
- shared.ts
- App.tsx
- scheduled-captures.ts
- config.ts
- Store
- approach.ts
- ControlStore
- PeoplePanel.tsx
- ServiceHealthPanel.tsx
- Goals.tsx
- dependencies.ts
- cec/issue-publication.ts
- record-trigger.ts
- coordination.ts
- closeout-recovery.ts
- Effects
- QuestionStepper.tsx
- run-retrospective.ts
- recovery/stopped-base-update.ts
- time-scope.ts
- constellation-runtime.ts
- .emit
- features/commands.ts
- demand-facts.ts
- OfficeScene.tsx
- scheduled-work.ts
- telemetry.ts
- cost-ledger.ts
- run-accounting.ts
- resume-provider-review.ts
- .run
- Coordinator
- scheduler.ts
- weekly-rollup.ts
- work.ts
- jira-time.ts
- control-store.ts
- .save
- dependency-bots/adopt.ts
- tracking-issue.ts
- worker-runtime.ts
- store.ts
- remove-candidate.ts
- features/workflow.ts
- github/issue-publication.ts
- admit-improvement.ts
- ticket-evidence.ts
- retrospective-subject.ts
- service-health.ts
- coordination-tick.ts
- assignment-poll.ts
- local-config.ts
- ref_zod
- owned-artifact.ts
- node-visuals.ts
- record-push.ts
- scene-motion.ts
- features.ts
- blocker-followups.ts
- capture-session-clone.py
- RoomCamera.tsx
- refresh-evidence.ts
- index.tsx
- fact-bounds.ts
- command-registry.ts
- codex-rollout.ts
- daily-cto.ts
- diagnostic-context.ts
- extract-worker.mjs
- extraction.ts
- create-candidate.ts
- useLiveTiming.ts
- Offices
- createConstellation
- ProjectProgress
- useOfficePreferences.ts
- cli.ts
- server_delivery_harness_delivery_authority_resolvedeliverywork
- server_features_questions_pending_round_pendinground
- server_features_questions_pending_round_pendingrounds
- server_features_questions_pending_round_roundauthor
- src_shared_personas
- src_shared_workkey
- preferences.ts
- leadership.ts
- CommittedBrain
- QuestionNotifications
- office-state-view.ts
- highestStableAtLeast
- slack-supersession.ts

## God Nodes (most connected - your core abstractions)
1. `Store` - 346 edges
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
- `projectOutbox()` --calls--> `isSavedPlanFollowup()`  [EXTRACTED]
  server/conversations/outbox.ts → src/conversations/saved-plan-followup.ts
- `projectOutbox()` --calls--> `deferredPickup()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/pickup-state.ts
- `projectOutbox()` --calls--> `parkedProviderWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts
- `projectOutbox()` --calls--> `readinessNeedsFollowup()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts
- `projectOutbox()` --calls--> `readinessWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts

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

## Communities (111 total, 10 thin omitted)

### Community 0 - "activation-recovery.ts"
Cohesion: 0.06
Nodes (69): pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash (+61 more)

### Community 1 - "github-delivery.ts"
Cohesion: 0.06
Nodes (87): containedFile(), findingsBlock(), BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction(), resumeProviderReviews(), acceptStageResult() (+79 more)

### Community 2 - "agents.ts"
Cohesion: 0.05
Nodes (60): applyIntakeObservation(), IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), intakeMembership(), projectListScope(), cecPrompt() (+52 more)

### Community 3 - "requests.ts"
Cohesion: 0.09
Nodes (44): DeliveryAuthorityInput, accounting, DeliverySubject, nonDelivery, originalReads, HarnessControl, assertAutomationEffects(), automationMergePolicy() (+36 more)

### Community 4 - "Inspector.tsx"
Cohesion: 0.08
Nodes (78): ref_lucide_react, Conversation(), SendMessage, Outbox(), OutboxMaintenanceStatus(), isSavedPlanFollowup(), savedPlanFollowup(), SlackDeliveryCard() (+70 more)

### Community 5 - "ref_react"
Cohesion: 0.07
Nodes (63): ref_motion, ref_react, ref_react_markdown, ref_remark_gfm, ref_yaml, guidanceExcerpt(), KnowledgeActivity, KnowledgeEdge (+55 more)

### Community 6 - "ref_node_path"
Cohesion: 0.06
Nodes (108): ref_node_fs, ref_node_os, ref_node_path, ref_node_util, allowed, assertContinuationWorker(), continuationNativeReview(), continuationWorkerProof() (+100 more)

### Community 7 - "source-amendment.ts"
Cohesion: 0.06
Nodes (64): ref_node_async_hooks, approvedText(), assert(), AMENDMENT_REVIEW_PROOF, amendmentIssueSha256(), authorizeSourceAmendment(), Binding, assert() (+56 more)

### Community 8 - "digest"
Cohesion: 0.07
Nodes (76): harnessCloseout(), PASSING, verifyMergeActions(), activeEffectId(), harnessEffect, assertDeliveryMayMutate(), withHarnessWork(), retryRead() (+68 more)

### Community 9 - "session-bridge.ts"
Cohesion: 0.05
Nodes (58): ref_node_child_process, ref_node_url, ref_ws, file, folder, logs, root, claudeSessionContext() (+50 more)

### Community 10 - "authorize.ts"
Cohesion: 0.08
Nodes (51): approveFeature(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), artifactPath(), digest(), document() (+43 more)

### Community 11 - "maintenance/maintenance.ts"
Cohesion: 0.08
Nodes (36): maintenancePolicies(), captureLearning(), recordLearningOpportunity(), captureMaintenanceStep(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, BrainStatusSchema (+28 more)

### Community 12 - "conversations/conversations.ts"
Cohesion: 0.08
Nodes (28): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+20 more)

### Community 13 - "index.ts"
Cohesion: 0.10
Nodes (28): ref_hono_node_server, ref_node_http, ref_vite, assertQuestionVisibility(), close(), config, itSpecialist, loadedRevision (+20 more)

### Community 14 - "it-specialist.ts"
Cohesion: 0.17
Nodes (19): partialLocalCleanupKey(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), ITContext, publishITReport(), ITSpecialist (+11 more)

### Community 15 - "knowledge.ts"
Cohesion: 0.06
Nodes (48): normalizeStatement(), lessonBrainAudit, LessonBrainOverlap, INSTALLED, decideOfficeProposal(), now(), OfficeKnowledgeStore, proposeOfficeLessons() (+40 more)

### Community 16 - "assignments.ts"
Cohesion: 0.09
Nodes (35): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, GraphNode (+27 more)

### Community 17 - "TicketJob"
Cohesion: 0.08
Nodes (33): removeAdoptedClone(), namedRepairIds(), dependabotReviewGuidance(), deliveryTask(), DeliveryTaskInput, GitHubDelivery, DISCOVERY_GUIDANCE, stageRole() (+25 more)

### Community 18 - "workKey"
Cohesion: 0.08
Nodes (44): completedPRReviews(), Assessment, diagnosticProof(), discoveryRecoveryCandidate(), ownedArtifact(), Ownership, rawHash(), recoverDiscovery() (+36 more)

### Community 19 - "sanitize"
Cohesion: 0.10
Nodes (36): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+28 more)

### Community 20 - "Button"
Cohesion: 0.19
Nodes (29): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView() (+21 more)

### Community 21 - "shared.ts"
Cohesion: 0.07
Nodes (34): ctoInputRecovered(), conversationResolved(), knowledgeOutbox(), checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), repeatedVendorReviewBlock(), stoppedInVendorReview() (+26 more)

### Community 22 - "App.tsx"
Cohesion: 0.05
Nodes (69): ref_react_dom, BrainDrawer(), themeColor, App(), BrainWorkspace, CONNECTION, CONNECTION_DOT, dockItemVariants (+61 more)

### Community 23 - "scheduled-captures.ts"
Cohesion: 0.16
Nodes (42): createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest, captureRequests() (+34 more)

### Community 24 - "config.ts"
Cohesion: 0.12
Nodes (32): ref_node_crypto, featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS, reserveReplacement() (+24 more)

### Community 25 - "Store"
Cohesion: 0.04
Nodes (31): correlatedBuild(), CommentPage, commentReadback(), JiraOperations, checkMail(), drainMail(), requestMail(), ingest() (+23 more)

### Community 26 - "approach.ts"
Cohesion: 0.09
Nodes (47): parksInJira(), dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), resume(), startPilot(), MISSING_SAVED_PLAN (+39 more)

### Community 27 - "ControlStore"
Cohesion: 0.13
Nodes (9): DailyCTO, EvidenceRequestConflict, dailyReviewPrompt(), queueGoalEvidenceRequest(), Briefing, saveReviewBriefing(), ControlStore, OfficeKnowledge (+1 more)

### Community 28 - "PeoplePanel.tsx"
Cohesion: 0.10
Nodes (38): label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+30 more)

### Community 29 - "ServiceHealthPanel.tsx"
Cohesion: 0.12
Nodes (33): TelemetryReport, blockedSummary(), ServiceHealthPanel(), followUp(), src_shared_liveanchor, BreakdownTable(), CostBar(), coverage() (+25 more)

### Community 30 - "Goals.tsx"
Cohesion: 0.15
Nodes (19): CTOReview(), goalState, DailyCTO(), GoalHistory(), load(), reportDate(), reviewStatus, GoalList() (+11 more)

### Community 31 - "dependencies.ts"
Cohesion: 0.14
Nodes (26): Admission, admit(), IntakeContext, WAIT_STATUSES, compatible(), dependencyCompletionKey(), dependencyEligibility(), DependencyStores (+18 more)

### Community 32 - "cec/issue-publication.ts"
Cohesion: 0.18
Nodes (10): Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), Transition, descriptionPreimage(), plain() (+2 more)

### Community 33 - "record-trigger.ts"
Cohesion: 0.09
Nodes (46): isBlocking(), baselineLearning(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences(), busyMaintenanceIds(), clip() (+38 more)

### Community 34 - "coordination.ts"
Cohesion: 0.18
Nodes (18): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation(), checkpointWindow(), dueAt() (+10 more)

### Community 35 - "closeout-recovery.ts"
Cohesion: 0.09
Nodes (56): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+48 more)

### Community 36 - "Effects"
Cohesion: 0.09
Nodes (25): MergeNotifications, comparableSlackText(), SlackMessages, SlackRequestSchema, SlackResultSchema, SlackVerificationSchema, GitHubOperations, admitImprovement() (+17 more)

### Community 37 - "QuestionStepper.tsx"
Cohesion: 0.19
Nodes (18): FeatureQuestionProjection, OutboxQuestionRound(), send(), draftKey(), readDraft(), saveDraft(), QuestionRound(), nextQuestion() (+10 more)

### Community 38 - "run-retrospective.ts"
Cohesion: 0.10
Nodes (41): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, blockingTrigger, brainOverlap, brainOverlapQuery() (+33 more)

### Community 39 - "recovery/stopped-base-update.ts"
Cohesion: 0.14
Nodes (27): admitGreen156(), GREEN156, green156Admitted(), green156Subject(), retainedGreen156Audit(), assertStoppedBaseAudit(), AuditRow, CoverageRow (+19 more)

### Community 40 - "time-scope.ts"
Cohesion: 0.07
Nodes (54): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), server_telemetry_billable_work_issue_key, isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence() (+46 more)

### Community 41 - "constellation-runtime.ts"
Cohesion: 0.15
Nodes (17): ref_3d_force_graph, ref_three, CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point (+9 more)

### Community 42 - ".emit"
Cohesion: 0.10
Nodes (37): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR (+29 more)

### Community 43 - "features/commands.ts"
Cohesion: 0.19
Nodes (21): commandFeature(), reviewQuestions(), automaticIntakeWait(), applyHarnessAction(), HarnessActionInput, recoveryPreconditions(), recoveryTarget(), normalizeRound() (+13 more)

### Community 44 - "demand-facts.ts"
Cohesion: 0.11
Nodes (23): clip(), DEMAND_LIMIT, demandFacts(), DemandSection, key(), LessonKey, notes(), clip() (+15 more)

### Community 45 - "OfficeScene.tsx"
Cohesion: 0.17
Nodes (33): Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk(), ElevatorStage() (+25 more)

### Community 46 - "scheduled-work.ts"
Cohesion: 0.11
Nodes (31): deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), metadataRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), requestPriority() (+23 more)

### Community 47 - "telemetry.ts"
Cohesion: 0.09
Nodes (28): CodexRollout, CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL (+20 more)

### Community 48 - "cost-ledger.ts"
Cohesion: 0.13
Nodes (30): captureCost(), server_telemetry_cost_entries_costcoveragesummary, costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress() (+22 more)

### Community 49 - "run-accounting.ts"
Cohesion: 0.13
Nodes (27): BoundedRead, backfillClaudeCost(), CompletionReader, codexHome(), createdAt(), dayDirs(), header(), readCodexRollout() (+19 more)

### Community 50 - "resume-provider-review.ts"
Cohesion: 0.21
Nodes (24): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), ProjectCard, projectCards(), projectGraphql() (+16 more)

### Community 51 - ".run"
Cohesion: 0.08
Nodes (42): candidateWorkspaceEnvironment(), deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), requireDeliveryAuthority(), deliveryIntakeBlocker(), gateRegisteredDelivery(), resolveDeliveryWork() (+34 more)

### Community 52 - "Coordinator"
Cohesion: 0.08
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 53 - "scheduler.ts"
Cohesion: 0.13
Nodes (17): ROLES, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch(), deliveryOccupied() (+9 more)

### Community 54 - "weekly-rollup.ts"
Cohesion: 0.16
Nodes (23): learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), RollupResult (+15 more)

### Community 55 - "work.ts"
Cohesion: 0.11
Nodes (21): BLOCKED_CAUSES, blockedCauses(), projectReadiness(), ProjectReadiness, HistoryRetirement, HistoryRetirementIntent, AssignmentResult, BlockedCause (+13 more)

### Community 56 - "jira-time.ts"
Cohesion: 0.30
Nodes (9): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+1 more)

### Community 57 - "control-store.ts"
Cohesion: 0.14
Nodes (14): ref_node_sqlite, Clock, EASTERN, easternDayFormatter, easternPartsFormatter, systemClock, applyConnectionSettings(), closeConnection() (+6 more)

### Community 58 - ".save"
Cohesion: 0.23
Nodes (24): BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue(), readIssues(), commentDecision() (+16 more)

### Community 59 - "dependency-bots/adopt.ts"
Cohesion: 0.16
Nodes (24): Execute, adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR, openDependabotPulls() (+16 more)

### Community 60 - "tracking-issue.ts"
Cohesion: 0.19
Nodes (17): readBackOrThrow(), ensureTrackingIssue(), findTrackingIssue(), ownTracking(), TrackingIssue, trackingIssueBody(), trackingIssueTitle(), trackingMarker() (+9 more)

### Community 61 - "worker-runtime.ts"
Cohesion: 0.08
Nodes (35): assignmentSubject(), dispatchExposure(), prepareExposure(), installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), LessonSelection (+27 more)

### Community 62 - "store.ts"
Cohesion: 0.09
Nodes (19): ref_smol_toml, file, project, root, projectData(), comparable(), EvidenceOutcome, recordRunEvidence() (+11 more)

### Community 63 - "remove-candidate.ts"
Cohesion: 0.17
Nodes (18): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot() (+10 more)

### Community 64 - "features/workflow.ts"
Cohesion: 0.17
Nodes (11): featureById(), discoveryPrompt(), planPrompt(), publishFeature(), beginReader(), reconcilePublication(), uncertainPublications(), reserveIdentity() (+3 more)

### Community 65 - "github/issue-publication.ts"
Cohesion: 0.14
Nodes (12): FeaturePublisher, Assign, Board, Content, GitHubIssuePublisher, number(), same(), improvementManifest() (+4 more)

### Community 66 - "admit-improvement.ts"
Cohesion: 0.28
Nodes (9): improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), linkedRepairGap(), IMPROVEMENT_POLICY, queueImprovements() (+1 more)

### Community 67 - "ticket-evidence.ts"
Cohesion: 0.17
Nodes (20): plain(), unpack(), jiraRecord(), assetDownloader(), attachmentKind(), storeEvidence(), blankEvidence(), CoverageState (+12 more)

### Community 68 - "retrospective-subject.ts"
Cohesion: 0.15
Nodes (19): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+11 more)

### Community 69 - "service-health.ts"
Cohesion: 0.16
Nodes (11): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, slackHealth() (+3 more)

### Community 70 - "coordination-tick.ts"
Cohesion: 0.16
Nodes (11): BrainFollowup, brainCheckpointCompletion(), reconcileCompletedCheckpoints(), legacy, reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION (+3 more)

### Community 71 - "assignment-poll.ts"
Cohesion: 0.26
Nodes (11): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), admitReadyCards(), resumeParked() (+3 more)

### Community 72 - "local-config.ts"
Cohesion: 0.14
Nodes (20): AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), goalEvidencePath(), OfficeConfigInputs, officeConfigRoute(), officeConfigSummary(), CECBinding, localBindings (+12 more)

### Community 73 - "ref_zod"
Cohesion: 0.08
Nodes (40): ref_zod, projectOutbox(), syncOutbox(), projectSlackDeliveries(), settleRequestedSlackReplacement(), Input, supersedeSlackDelivery(), replacementContext() (+32 more)

### Community 74 - "owned-artifact.ts"
Cohesion: 0.27
Nodes (11): INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_SOURCE_PATHS, officeSource(), ROOT, done(), readBoundedNoFollow() (+3 more)

### Community 75 - "node-visuals.ts"
Cohesion: 0.20
Nodes (13): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+5 more)

### Community 76 - "record-push.ts"
Cohesion: 0.15
Nodes (17): Event, one(), prePushRejection(), PushIdentity, Candidate, recordedPush(), settledPushBoundary(), At (+9 more)

### Community 77 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 78 - "features.ts"
Cohesion: 0.13
Nodes (30): bindFeature(), currentApproval(), featureGate(), predecessorComplete(), recoveryHeld(), deliveryPreflight, handoffBinding(), readHandoff() (+22 more)

### Community 79 - "blocker-followups.ts"
Cohesion: 0.28
Nodes (13): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), canFileGithubIssue(), readBackConversations(), handoff(), reconcileBlockerFollowups(), clearUnblockBrief() (+5 more)

### Community 80 - "capture-session-clone.py"
Cohesion: 0.15
Nodes (10): ctypes, errno, importlib_util, json, os, pathlib, Copy a coherent macOS clone of inherited reader fd3 to anonymous target fd4. No…, Read-only protocol adapter for the installed review helper. No model dispatch. (+2 more)

### Community 81 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (10): ref_react_three_drei, ref_react_three_fiber, ref_three_stdlib, CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility (+2 more)

### Community 82 - "refresh-evidence.ts"
Cohesion: 0.27
Nodes (13): evidenceDirectory(), readEvidence(), ProviderEvidence, canonical(), evidenceDigest(), evidenceHash(), semantic(), stableUrl() (+5 more)

### Community 83 - "index.tsx"
Cohesion: 0.07
Nodes (40): LessonDecisionAction, lessonDecisionState(), readLessonDecision(), ctoInputFailure(), OutboxCTOInput(), recover(), OutboxLessonDecision(), act() (+32 more)

### Community 84 - "fact-bounds.ts"
Cohesion: 0.26
Nodes (14): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+6 more)

### Community 85 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 86 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 87 - "daily-cto.ts"
Cohesion: 0.20
Nodes (13): evidenceRequestConflicts, dailyReviewDate(), reviewWeekday(), applyGoalReview(), DailyResultSchema, EvidenceRefSchema, FreshDailyResultSchema, GoalEvidenceRequestSchema (+5 more)

### Community 88 - "diagnostic-context.ts"
Cohesion: 0.38
Nodes (5): assignmentDiagnostics(), diagnosticContext(), itAgent(), itDiagnostics(), currentServices()

### Community 89 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (6): ref_mammoth, ref_pdfjs_dist, bounded(), extract(), fail(), [path,kind]

### Community 90 - "extraction.ts"
Cohesion: 0.33
Nodes (4): ref_node_string_decoder, extractDocument, Extraction, Extractor

### Community 91 - "create-candidate.ts"
Cohesion: 0.26
Nodes (10): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+2 more)

### Community 92 - "useLiveTiming.ts"
Cohesion: 0.26
Nodes (12): AzureBuild, lastWall, sample(), subscribe(), subscribers, useLiveClock(), liveBuildTiming(), liveTiming() (+4 more)

### Community 94 - "createConstellation"
Cohesion: 0.19
Nodes (5): ConstellationRuntime, createConstellation(), enter(), finishTap(), move()

### Community 96 - "useOfficePreferences.ts"
Cohesion: 0.26
Nodes (10): acceptPreferences(), PreferenceCandidate, strip(), UNKNOWN_PREFERENCES, OfficePreferencesController, PreferenceFeedback, PreferenceField, requestPreferences() (+2 more)

### Community 97 - "cli.ts"
Cohesion: 0.20
Nodes (8): ref_node_stream, ref_node_timers, args, [cmd,...rawArgs], commands, key, projectIndex, PORT

### Community 104 - "preferences.ts"
Cohesion: 0.29
Nodes (5): preferencesRoute(), PreferencesRouteContext, PreferencesStore, PreferenceState, OfficePreferences

### Community 105 - "leadership.ts"
Cohesion: 0.25
Nodes (7): DailyCTOBriefing, DailyCTOResult, DailyGoalUpdate, GoalEvidenceRef, GoalEvidenceRequest, GoalProgress, GoalStatus

### Community 108 - "office-state-view.ts"
Cohesion: 0.60
Nodes (4): leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore()

### Community 109 - "highestStableAtLeast"
Cohesion: 0.83
Nodes (3): compare(), highestStableAtLeast(), parts()

### Community 110 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

## Knowledge Gaps
- **483 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+478 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 623 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `activation-recovery.ts`, `github-delivery.ts`, `agents.ts`, `requests.ts`, `ref_node_path`, `source-amendment.ts`, `digest`, `session-bridge.ts`, `authorize.ts`, `maintenance/maintenance.ts`, `conversations/conversations.ts`, `index.ts`, `it-specialist.ts`, `knowledge.ts`, `assignments.ts`, `TicketJob`, `workKey`, `sanitize`, `App.tsx`, `scheduled-captures.ts`, `config.ts`, `approach.ts`, `dependencies.ts`, `cec/issue-publication.ts`, `record-trigger.ts`, `coordination.ts`, `closeout-recovery.ts`, `Effects`, `run-retrospective.ts`, `recovery/stopped-base-update.ts`, `time-scope.ts`, `.emit`, `features/commands.ts`, `demand-facts.ts`, `scheduled-work.ts`, `cost-ledger.ts`, `run-accounting.ts`, `resume-provider-review.ts`, `.run`, `scheduler.ts`, `weekly-rollup.ts`, `jira-time.ts`, `control-store.ts`, `.save`, `dependency-bots/adopt.ts`, `tracking-issue.ts`, `worker-runtime.ts`, `store.ts`, `remove-candidate.ts`, `features/workflow.ts`, `github/issue-publication.ts`, `admit-improvement.ts`, `ticket-evidence.ts`, `retrospective-subject.ts`, `coordination-tick.ts`, `ref_zod`, `record-push.ts`, `features.ts`, `blocker-followups.ts`, `refresh-evidence.ts`, `daily-cto.ts`, `diagnostic-context.ts`, `create-candidate.ts`, `QuestionNotifications`, `office-state-view.ts`?**
  _High betweenness centrality (0.096) - this node is a cross-community bridge._
- **Why does `sanitizeObject()` connect `sanitize` to `agents.ts`, `Effects`, `ref_node_path`, `recovery/stopped-base-update.ts`, `local-config.ts`, `ref_zod`, `conversations/conversations.ts`, `index.ts`, `.run`, `control-store.ts`, `.save`, `ControlStore`, `worker-runtime.ts`, `store.ts`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Why does `Engine` connect `Store` to `features/workflow.ts`, `github-delivery.ts`, `coordination.ts`, `agents.ts`, `Effects`, `requests.ts`, `.emit`, `maintenance/maintenance.ts`, `conversations/conversations.ts`, `scheduled-work.ts`, `sanitize`, `scheduled-captures.ts`, `config.ts`, `approach.ts`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _483 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `activation-recovery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06200411401704378 - nodes in this community are weakly interconnected._
- **Should `github-delivery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06341829085457272 - nodes in this community are weakly interconnected._
- **Should `agents.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.04943820224719101 - nodes in this community are weakly interconnected._