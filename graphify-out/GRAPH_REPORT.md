# Graph Report - the-office  (2026-11-15)

## Corpus Check
- 825 files · ~325,901 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4039 nodes · 18633 edges · 108 communities (105 shown, 3 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 604 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a1105897`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Goals.tsx
- delivery-recoveries.ts
- dependency-bots/adopt.ts
- read-retries.ts
- Inspector.tsx
- ref_node_path
- session-bridge.ts
- MapView.tsx
- agents.ts
- .transaction
- worker-runtime.ts
- shared.ts
- App.tsx
- config.ts
- reader.ts
- scheduled-captures.ts
- run-retrospective.ts
- record-trigger.ts
- features/routes.ts
- artifact
- github-check-selection.ts
- Ticket
- PeoplePanel.tsx
- knowledge-views.ts
- knowledge.ts
- maintenance/maintenance.ts
- cost-ledger.ts
- activation-recovery.ts
- dependencies.ts
- jira-time.ts
- digest
- index.tsx
- ref_zod
- lesson-selection.ts
- azure.ts
- Role
- scheduled-work.ts
- run-cost.ts
- requests.ts
- owned-artifact.ts
- assignment-poll.ts
- time-scope.ts
- candidate.ts
- run-accounting.ts
- intent.ts
- Coordinator
- OfficeScene.tsx
- Store
- pilot-delivery.ts
- assignments.ts
- .emit
- harness-baseline.ts
- leadership.ts
- ticket-stage-runner.ts
- work.ts
- weekly-rollup.ts
- github-delivery.ts
- TimeBook.tsx
- .activeClaims
- scheduler.ts
- retrospective-subject.ts
- run.ts
- admission.ts
- remove-candidate.ts
- ticket-evidence.ts
- fact-bounds.ts
- QuestionStepper.tsx
- ControlStore
- checkpoint-completion.ts
- coordination.ts
- constellation-runtime.ts
- contract.ts
- Offices
- report.ts
- index.ts
- admit-improvement.ts
- pre-push-boundary.ts
- TicketJob
- effects.ts
- run-usage.ts
- control-store.ts
- scene-motion.ts
- node-visuals.ts
- preferences-store.ts
- outbox.ts
- ledger.ts
- local-config.ts
- daily-cto.ts
- unblock-brief.ts
- live-reach.ts
- cec-implementation-continuation.ts
- RoomCamera.tsx
- blocker-followups.ts
- it-specialist.ts
- packed-consumer-pnpm.ts
- capture-session-clone.py
- OfficeSnapshot
- .save
- service-health.ts
- telemetry.ts
- work-summary.ts
- install-service.mjs
- extract-worker.mjs
- extraction.ts
- CommandRegistry
- codex-rollout.ts
- retire-history.ts
- notifications.ts

## God Nodes (most connected - your core abstractions)
1. `Store` - 365 edges
2. `TicketJob` - 167 edges
3. `digest()` - 150 edges
4. `command()` - 115 edges
5. `GitHubDelivery` - 114 edges
6. `artifact()` - 114 edges
7. `workKey()` - 95 edges
8. `OfficeSnapshot` - 88 edges
9. `cx()` - 88 edges
10. `currentAssignment()` - 86 edges

## Surprising Connections (you probably didn't know these)
- `apply()` --indirect_call--> `note()`  [INFERRED]
  src/conversations/OutboxSavedImplementation.tsx → server/cec/parking/resume-parked.ts
- `projectOutbox()` --calls--> `deferredPickup()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/pickup-state.ts
- `projectOutbox()` --calls--> `parkedProviderWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts
- `projectOutbox()` --calls--> `readinessNeedsFollowup()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts
- `projectOutbox()` --calls--> `readinessWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts

## Import Cycles
- 3-file cycle: `server/delivery/parking/resume-provider-review.ts -> server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/parking/resume-provider-review.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts`
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
- 5-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/implementation/activation-recovery.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 5-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/implementation/saved-prerequisite-handoff.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`

## Communities (108 total, 3 thin omitted)

### Community 0 - "Goals.tsx"
Cohesion: 0.09
Nodes (34): recover(), OutboxSavedImplementation(), apply(), review(), reconcile(), FeatureDelivery(), FeatureDocuments(), views (+26 more)

### Community 1 - "delivery-recoveries.ts"
Cohesion: 0.10
Nodes (32): deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, requireDeliveryAuthority(), deliveryIntakeBlocker(), gateRegisteredDelivery(), accounting (+24 more)

### Community 2 - "dependency-bots/adopt.ts"
Cohesion: 0.07
Nodes (65): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard, projectCards() (+57 more)

### Community 3 - "read-retries.ts"
Cohesion: 0.29
Nodes (9): SourceClosed, classifyStop(), incompleteReadOutput(), IntakeResult, planReadRetry(), reconcileReadRetries(), temporaryReadFailure(), StopKind (+1 more)

### Community 4 - "Inspector.tsx"
Cohesion: 0.12
Nodes (56): blockedSummary(), ServiceHealthPanel(), labels, ServiceHealthRow(), GoalList(), card(), reviewExcerpt(), EvidenceCard() (+48 more)

### Community 5 - "ref_node_path"
Cohesion: 0.06
Nodes (73): ref_node_fs, ref_node_os, ref_node_path, ref_node_util, Execute, installDependencies(), major(), removeAdoptedClone() (+65 more)

### Community 6 - "session-bridge.ts"
Cohesion: 0.06
Nodes (52): ref_node_perf_hooks, ref_ws, claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexDaemonProcesses(), accountCodexProcesses() (+44 more)

### Community 7 - "MapView.tsx"
Cohesion: 0.07
Nodes (57): ref_motion, ref_react_markdown, ref_remark_gfm, ref_yaml, Activity(), ActivityTimeline(), AssignmentKnowledge(), Lookup() (+49 more)

### Community 8 - "agents.ts"
Cohesion: 0.07
Nodes (39): cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), stageInstructions, readbackDispatchGuidance(), CECReadbackSchema, READBACK_OWNER_SCOPE (+31 more)

### Community 9 - ".transaction"
Cohesion: 0.11
Nodes (17): featureItemComplete(), reconcileFeatureCompletion(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), helperTelemetry(), stopReview(), queueLessonIssueCheck() (+9 more)

### Community 10 - "worker-runtime.ts"
Cohesion: 0.07
Nodes (36): candidateWorkspaceEnvironment(), ApproachSchema, assignmentSubject(), dispatchExposure(), prepareExposure(), lessonPurpose(), LessonSelection, catalogLine() (+28 more)

### Community 11 - "shared.ts"
Cohesion: 0.07
Nodes (23): applyIntakeObservation(), OfficeQAReport, QAPlanContinuation, QAPlanRetry, QAPlanRetryProof, QAPlanRetryRequest, SlackReplacementRequest, SlackSupersession (+15 more)

### Community 12 - "App.tsx"
Cohesion: 0.06
Nodes (42): ref_lucide_react, ref_react_dom, itAgent(), itDiagnostics(), BrainDrawer(), themeColor, App(), CONNECTION (+34 more)

### Community 13 - "config.ts"
Cohesion: 0.06
Nodes (106): ref_node_crypto, ref_node_url, approveFeature(), commandFeature(), mutation(), reviewQuestions(), discoveryPrompt(), planPrompt() (+98 more)

### Community 14 - "reader.ts"
Cohesion: 0.09
Nodes (30): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, CommittedBrain (+22 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.15
Nodes (44): createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest, captureRequests() (+36 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.10
Nodes (41): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, blockingTrigger, isBlocking(), brainOverlap (+33 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.10
Nodes (41): baselineLearning(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences(), clip(), maintenanceBlockedId(), MaintenanceCandidate (+33 more)

### Community 18 - "features/routes.ts"
Cohesion: 0.23
Nodes (5): Link, linkFeature(), FeatureReviewRunner, featureRoute(), FeatureWorkflow

### Community 19 - "artifact"
Cohesion: 0.05
Nodes (98): completedPRReviews(), adoptCandidate(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related (+90 more)

### Community 20 - "github-check-selection.ts"
Cohesion: 0.22
Nodes (18): checksFailed(), checksPassed(), checksPending(), CurrentChecksWait, currentMergeChecks(), pass(), pending(), requireThat() (+10 more)

### Community 21 - "Ticket"
Cohesion: 0.10
Nodes (29): implementationWorkerContext(), cecPrompt(), resolvedDecisionNote(), qaPlanEvidenceGap(), qaRunDirectory(), APPROACH_GUIDANCE, reviewInstructions(), deliveryTask() (+21 more)

### Community 22 - "PeoplePanel.tsx"
Cohesion: 0.09
Nodes (45): label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+37 more)

### Community 23 - "knowledge-views.ts"
Cohesion: 0.19
Nodes (15): KnowledgeActivity, KnowledgeEdge, KnowledgeMap, KnowledgeNode, ConstellationView, DisplayNode, initialSelection, MapSelection (+7 more)

### Community 24 - "knowledge.ts"
Cohesion: 0.05
Nodes (49): ref_node_stream, ref_node_timers, args, [cmd,...rawArgs], commands, key, projectIndex, normalizeStatement() (+41 more)

### Community 25 - "maintenance/maintenance.ts"
Cohesion: 0.10
Nodes (29): maintenancePolicies(), captureLearning(), captureMaintenanceStep(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice() (+21 more)

### Community 26 - "cost-ledger.ts"
Cohesion: 0.15
Nodes (27): captureCost(), server_telemetry_cost_entries_costcoveragesummary, costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress() (+19 more)

### Community 27 - "activation-recovery.ts"
Cohesion: 0.08
Nodes (64): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+56 more)

### Community 28 - "dependencies.ts"
Cohesion: 0.12
Nodes (23): MergeNotifications, reconcileNoticeConfirmations(), admit(), compatible(), dependencyCompletionKey(), dependencyEligibility(), issueKey(), observePrerequisites() (+15 more)

### Community 29 - "jira-time.ts"
Cohesion: 0.14
Nodes (20): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+12 more)

### Community 30 - "digest"
Cohesion: 0.07
Nodes (76): harnessCloseout(), PASSING, verifyMergeActions(), activeEffectId(), harnessEffect, HarnessControl, withHarnessWork(), retryRead() (+68 more)

### Community 31 - "index.tsx"
Cohesion: 0.10
Nodes (48): ref_react, TicketPlanningAction(), SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS (+40 more)

### Community 32 - "ref_zod"
Cohesion: 0.09
Nodes (34): ref_zod, assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO() (+26 more)

### Community 33 - "lesson-selection.ts"
Cohesion: 0.15
Nodes (19): INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, MAINTENANCE, MAX_LESSONS, normalPath(), PURPOSES (+11 more)

### Community 34 - "azure.ts"
Cohesion: 0.10
Nodes (32): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+24 more)

### Community 35 - "Role"
Cohesion: 0.15
Nodes (11): ref_smol_toml, LOCAL_BINDINGS, file, project, root, DeliverySlot, officeCapacity, PROJECTS (+3 more)

### Community 36 - "scheduled-work.ts"
Cohesion: 0.09
Nodes (36): ref_node_async_hooks, freshOwnershipRead(), deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), Ownership, ownershipContext, refreshDeliveryOwnership() (+28 more)

### Community 37 - "run-cost.ts"
Cohesion: 0.12
Nodes (20): CodexRollout, CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL (+12 more)

### Community 38 - "requests.ts"
Cohesion: 0.09
Nodes (51): closeoutReceipt(), stopReason(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2 (+43 more)

### Community 39 - "owned-artifact.ts"
Cohesion: 0.20
Nodes (15): done(), readBoundedNoFollow(), readBoundedNoFollowSync(), reasonOf(), codexHome(), createdAt(), dayDirs(), header() (+7 more)

### Community 40 - "assignment-poll.ts"
Cohesion: 0.16
Nodes (15): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), admitReadyCards(), pinCourier (+7 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.13
Nodes (31): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), server_telemetry_billable_work_issue_key, isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence() (+23 more)

### Community 42 - "candidate.ts"
Cohesion: 0.28
Nodes (13): GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles(), absent() (+5 more)

### Community 43 - "run-accounting.ts"
Cohesion: 0.21
Nodes (13): BoundedRead, CompletionReader, COMPLETION_MAX_BYTES, completionAccounting(), readCompletion(), RECONCILE_GRACE_MS, reconcileUncapturedRuns(), reconciling (+5 more)

### Community 44 - "intent.ts"
Cohesion: 0.24
Nodes (8): ref_node_child_process, ContinuationIO, nativeIO, ImplementationDecision, implementationPreview(), interruptedImplementation(), assertCandidateIdle(), Read

### Community 45 - "Coordinator"
Cohesion: 0.08
Nodes (4): seedOfficeLessons(), coordination(), Coordinator, markCaptureStart()

### Community 46 - "OfficeScene.tsx"
Cohesion: 0.17
Nodes (33): Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk(), ElevatorStage() (+25 more)

### Community 47 - "Store"
Cohesion: 0.04
Nodes (39): correlatedBuild(), checkMail(), drainMail(), requestMail(), enableNightly(), Document, isAccessOnlyPlan(), settledAccessOnlyState() (+31 more)

### Community 48 - "pilot-delivery.ts"
Cohesion: 0.18
Nodes (21): continueImplementation(), dispatchNightly(), drainDelivery(), requestDelivery(), startPilot(), OfficeQAHandoffInput, eligibility(), featureEffectGate() (+13 more)

### Community 49 - "assignments.ts"
Cohesion: 0.10
Nodes (26): clip(), DEMAND_LIMIT, demandFacts(), DemandSection, key(), LessonKey, notes(), assignmentLookups (+18 more)

### Community 50 - ".emit"
Cohesion: 0.17
Nodes (23): assertOwnership(), decideImplementation(), Decision, requestQAPlanRetry(), configureChannelNotices(), configureNotices(), retryRecipientLookup(), recoverCTOInput() (+15 more)

### Community 51 - "harness-baseline.ts"
Cohesion: 0.15
Nodes (20): baselineReport, BaselineSource, baselineText(), millions(), row(), share(), add(), BaselineState (+12 more)

### Community 52 - "leadership.ts"
Cohesion: 0.18
Nodes (9): DailyCTOBriefing, DailyCTOResult, DailyCTOSummary, DailyGoalUpdate, GoalEvidenceRef, GoalEvidenceRequest, GoalProgress, GoalStatus (+1 more)

### Community 53 - "ticket-stage-runner.ts"
Cohesion: 0.11
Nodes (34): candidateBranchMoved(), parksInJira(), resume(), MISSING_SAVED_PLAN, recoverSavedPlan(), Attempt, needsResumeReconciliation(), run() (+26 more)

### Community 54 - "work.ts"
Cohesion: 0.11
Nodes (23): BLOCKED_CAUSES, blockedCauses(), projectReadiness(), explanation(), LABELS, stoppedReason(), ProjectReadiness, AssignmentResult (+15 more)

### Community 55 - "weekly-rollup.ts"
Cohesion: 0.09
Nodes (36): learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), retire(), BRAIN_SCOPE, SUBJECT (+28 more)

### Community 56 - "github-delivery.ts"
Cohesion: 0.06
Nodes (93): containedFile(), findingsBlock(), namedRepairIds(), assertDeliveryMayMutate(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery() (+85 more)

### Community 57 - "TimeBook.tsx"
Cohesion: 0.11
Nodes (37): TelemetryReport, AzureBuild, src_shared_liveanchor, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens() (+29 more)

### Community 58 - ".activeClaims"
Cohesion: 0.10
Nodes (29): OwnershipRead, closedReadonlyPlan(), Document, consumeQAPlanRetry(), continueOwnershipRead(), continueUnsealedQA(), entry(), expiredOwnershipRead() (+21 more)

### Community 59 - "scheduler.ts"
Cohesion: 0.15
Nodes (15): ROLES, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch(), deliveryOccupied() (+7 more)

### Community 60 - "retrospective-subject.ts"
Cohesion: 0.20
Nodes (14): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+6 more)

### Community 61 - "run.ts"
Cohesion: 0.14
Nodes (21): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_FIX_PROMPT, OfficeFixResult (+13 more)

### Community 62 - "admission.ts"
Cohesion: 0.33
Nodes (8): Admission, IntakeContext, WAIT_STATUSES, DependencyStores, Continuation, Prerequisite, AssignmentReview, Coordination

### Community 63 - "remove-candidate.ts"
Cohesion: 0.18
Nodes (18): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot() (+10 more)

### Community 64 - "ticket-evidence.ts"
Cohesion: 0.09
Nodes (38): CommentPage, commentReadback(), JiraOperations, plain(), jiraRecord(), unpack(), metadataDigest(), verifyAlreadyAtStatus() (+30 more)

### Community 65 - "fact-bounds.ts"
Cohesion: 0.19
Nodes (18): leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance() (+10 more)

### Community 66 - "QuestionStepper.tsx"
Cohesion: 0.13
Nodes (26): FeatureHarnessOption, FeatureOption, FeatureQuestion, FeatureQuestionProjection, OutboxQuestionRound(), send(), draftKey(), readDraft() (+18 more)

### Community 67 - "ControlStore"
Cohesion: 0.17
Nodes (7): DailyCTO, EvidenceRequestConflict, queueGoalEvidenceRequest(), Briefing, saveReviewBriefing(), ControlStore, DailyCTOReport

### Community 68 - "checkpoint-completion.ts"
Cohesion: 0.28
Nodes (5): BrainStatusSchema, identity, coverageSchema, followupSchema, verified

### Community 69 - "coordination.ts"
Cohesion: 0.17
Nodes (17): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), legacy, validateNativeContinuation(), hours (+9 more)

### Community 70 - "constellation-runtime.ts"
Cohesion: 0.10
Nodes (22): ref_3d_force_graph, ref_three, CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point (+14 more)

### Community 71 - "contract.ts"
Cohesion: 0.24
Nodes (10): At, errno, GroupInventory, GroupProbe, LifecycleDiagnostic, Phase, Pid, groupInventory() (+2 more)

### Community 73 - "report.ts"
Cohesion: 0.29
Nodes (12): Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked(), row() (+4 more)

### Community 74 - "index.ts"
Cohesion: 0.08
Nodes (40): ref_hono_node_server, ref_node_http, ref_vite, implementationContinuationRoute(), qaPlanRetryRoute(), close(), config, itSpecialist (+32 more)

### Community 75 - "admit-improvement.ts"
Cohesion: 0.18
Nodes (19): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+11 more)

### Community 76 - "pre-push-boundary.ts"
Cohesion: 0.43
Nodes (5): Event, one(), prePushRejection(), PushIdentity, settledPushBoundary()

### Community 77 - "TicketJob"
Cohesion: 0.07
Nodes (32): BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction(), dependabotReviewGuidance(), GitHubDelivery, stagePrompt(), StagePromptInput (+24 more)

### Community 78 - "effects.ts"
Cohesion: 0.08
Nodes (28): Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), Transition, descriptionPreimage(), plain() (+20 more)

### Community 79 - "run-usage.ts"
Cohesion: 0.38
Nodes (5): claudeCrashZero(), claudeUsage(), codexUsage(), count(), RunUsage

### Community 80 - "control-store.ts"
Cohesion: 0.12
Nodes (14): ref_node_sqlite, Clock, applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, statementCache(), initialSnapshot() (+6 more)

### Community 81 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 82 - "node-visuals.ts"
Cohesion: 0.22
Nodes (11): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), stableHash() (+3 more)

### Community 83 - "preferences-store.ts"
Cohesion: 0.19
Nodes (9): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS (+1 more)

### Community 84 - "outbox.ts"
Cohesion: 0.12
Nodes (24): ADOPTION_STALLED_MS, projectOutbox(), syncOutbox(), projectSlackDeliveries(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint() (+16 more)

### Community 85 - "ledger.ts"
Cohesion: 0.20
Nodes (15): ctoInputIdentityMatches(), ctoInputRecovered(), investigationCandidates(), investigationId(), ctoReplacementResolution(), investigationFollowUps(), implementationReplacementResolution(), investigationResolution() (+7 more)

### Community 86 - "local-config.ts"
Cohesion: 0.16
Nodes (18): IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), intakeMembership(), projectListScope(), AUTO_ADOPT_BOTS, assertFeaturePlanningConfig() (+10 more)

### Community 87 - "daily-cto.ts"
Cohesion: 0.15
Nodes (16): evidenceRequestConflicts, dailyReviewPrompt(), applyGoalReview(), DailyResultSchema, EvidenceRefSchema, FreshDailyResultSchema, GoalEvidenceRequestSchema, statusAllowed() (+8 more)

### Community 88 - "unblock-brief.ts"
Cohesion: 0.43
Nodes (6): clearUnblockBrief(), key(), saveUnblockBrief(), unblockBrief, src_shared_knowledgestate, src_shared_learningsubject

### Community 89 - "live-reach.ts"
Cohesion: 0.47
Nodes (5): GIT_NETWORK, LIVE_PROVIDERS, liveReach(), networkUrl(), remoteUrls()

### Community 90 - "cec-implementation-continuation.ts"
Cohesion: 0.40
Nodes (4): ImplementationContinuation, ImplementationContinuationInput, ImplementationContinuationRequest, SavedImplementationProof

### Community 91 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (10): ref_react_three_drei, ref_react_three_fiber, ref_three_stdlib, CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility (+2 more)

### Community 92 - "blocker-followups.ts"
Cohesion: 0.25
Nodes (11): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), readBackConversations(), diagnosticSnapshot(), nativeDeliveryResolved(), handoff() (+3 more)

### Community 93 - "it-specialist.ts"
Cohesion: 0.24
Nodes (13): partialLocalCleanupKey(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), ITContext, publishITReport(), delays (+5 more)

### Community 95 - "capture-session-clone.py"
Cohesion: 0.15
Nodes (10): ctypes, errno, importlib_util, json, os, pathlib, Copy a coherent macOS clone of inherited reader fd3 to anonymous target fd4. No…, Read-only protocol adapter for the installed review helper. No model dispatch. (+2 more)

### Community 97 - "OfficeSnapshot"
Cohesion: 0.07
Nodes (56): knowledgeOutbox(), Conversation(), SendMessage, LessonDecisionAction, lessonDecisionState(), readLessonDecision(), DAYS, dueLessonDecisions() (+48 more)

### Community 98 - ".save"
Cohesion: 0.06
Nodes (64): jiraCollection(), BLOCKED, findComment(), LiveIssue, readIssue(), readIssues(), Execute, jira() (+56 more)

### Community 101 - "service-health.ts"
Cohesion: 0.20
Nodes (8): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, ServiceHealth

### Community 102 - "telemetry.ts"
Cohesion: 0.16
Nodes (12): comparable(), EvidenceOutcome, recordRunEvidence(), backfillClaudeCost(), CostCompleteness, CostLedgerState, RunAccounting, TelemetryRow (+4 more)

### Community 103 - "work-summary.ts"
Cohesion: 0.11
Nodes (31): compactSteps(), displayAgentTask(), githubStageLabels, withoutElapsed(), LiveAgentTask(), Props, RunningTask(), text() (+23 more)

### Community 104 - "install-service.mjs"
Cohesion: 0.33
Nodes (4): file, folder, logs, root

### Community 105 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (6): ref_mammoth, ref_pdfjs_dist, bounded(), extract(), fail(), [path,kind]

### Community 109 - "extraction.ts"
Cohesion: 0.33
Nodes (4): ref_node_string_decoder, extractDocument, Extraction, Extractor

### Community 113 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 114 - "retire-history.ts"
Cohesion: 0.33
Nodes (7): readHistoryScope(), historicalRecordDigest(), Intent, records(), retireIncompleteHistory(), HistoryRetirement, HistoryRetirementIntent

### Community 115 - "notifications.ts"
Cohesion: 0.21
Nodes (12): ChannelSettings, notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR, plainSlackText(), section() (+4 more)

## Knowledge Gaps
- **478 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+473 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 617 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `delivery-recoveries.ts`, `dependency-bots/adopt.ts`, `read-retries.ts`, `ref_node_path`, `session-bridge.ts`, `agents.ts`, `.transaction`, `worker-runtime.ts`, `config.ts`, `reader.ts`, `scheduled-captures.ts`, `run-retrospective.ts`, `record-trigger.ts`, `features/routes.ts`, `artifact`, `Ticket`, `knowledge.ts`, `maintenance/maintenance.ts`, `cost-ledger.ts`, `activation-recovery.ts`, `dependencies.ts`, `jira-time.ts`, `digest`, `ref_zod`, `lesson-selection.ts`, `azure.ts`, `Role`, `scheduled-work.ts`, `requests.ts`, `assignment-poll.ts`, `time-scope.ts`, `candidate.ts`, `run-accounting.ts`, `intent.ts`, `Coordinator`, `pilot-delivery.ts`, `assignments.ts`, `.emit`, `ticket-stage-runner.ts`, `weekly-rollup.ts`, `github-delivery.ts`, `.activeClaims`, `scheduler.ts`, `retrospective-subject.ts`, `run.ts`, `admission.ts`, `remove-candidate.ts`, `ticket-evidence.ts`, `fact-bounds.ts`, `checkpoint-completion.ts`, `coordination.ts`, `index.ts`, `admit-improvement.ts`, `TicketJob`, `effects.ts`, `control-store.ts`, `outbox.ts`, `ledger.ts`, `daily-cto.ts`, `blocker-followups.ts`, `it-specialist.ts`, `OfficeSnapshot`, `.save`, `telemetry.ts`, `retire-history.ts`, `notifications.ts`?**
  _High betweenness centrality (0.119) - this node is a cross-community bridge._
- **Why does `TicketJob` connect `TicketJob` to `delivery-recoveries.ts`, `dependency-bots/adopt.ts`, `Inspector.tsx`, `ref_node_path`, `MapView.tsx`, `worker-runtime.ts`, `shared.ts`, `record-trigger.ts`, `artifact`, `github-check-selection.ts`, `Ticket`, `activation-recovery.ts`, `digest`, `requests.ts`, `assignment-poll.ts`, `pilot-delivery.ts`, `github-delivery.ts`, `scheduler.ts`, `retrospective-subject.ts`, `admission.ts`, `remove-candidate.ts`, `fact-bounds.ts`, `outbox.ts`, `it-specialist.ts`, `.save`, `work-summary.ts`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `GitHubDelivery` connect `TicketJob` to `delivery-recoveries.ts`, `dependency-bots/adopt.ts`, `ref_node_path`, `requests.ts`, `assignment-poll.ts`, `Store`, `artifact`, `github-check-selection.ts`, `digest`, `github-delivery.ts`, `activation-recovery.ts`, `dependencies.ts`, `admission.ts`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _478 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Goals.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08792270531400966 - nodes in this community are weakly interconnected._
- **Should `delivery-recoveries.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09595959595959595 - nodes in this community are weakly interconnected._
- **Should `dependency-bots/adopt.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07001044932079414 - nodes in this community are weakly interconnected._