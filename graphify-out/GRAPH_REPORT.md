# Graph Report - the-office  (2026-11-16)

## Corpus Check
- 840 files · ~331,991 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4099 nodes · 18860 edges · 113 communities
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 608 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `31ce255a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Button
- Role
- dependency-bots/adopt.ts
- review-run.ts
- Inspector.tsx
- completedExecution
- session-bridge.ts
- ref_react
- agents.ts
- Store
- worker-runtime.ts
- shared.ts
- App.tsx
- config.ts
- reader.ts
- scheduled-captures.ts
- run-retrospective.ts
- record-trigger.ts
- assignment-poll.ts
- artifact
- features.ts
- github-delivery.ts
- index.tsx
- dependencies.ts
- knowledge.ts
- maintenance/maintenance.ts
- cost-ledger.ts
- workKey
- Ticket
- jira-time.ts
- digest
- owned-artifact.ts
- conversations/conversations.ts
- DailyCTO.tsx
- azure.ts
- .activeClaims
- scheduled-work.ts
- scheduler.ts
- ref_node_path
- goal-reporting.ts
- remove-candidate.ts
- time-scope.ts
- node-visuals.ts
- run-accounting.ts
- intent.ts
- Coordinator
- OfficeScene.tsx
- ref_node_crypto
- setup-stop-cap.ts
- assignments.ts
- .emit
- scene-motion.ts
- create-candidate.ts
- codex-rollout.ts
- work.ts
- weekly-rollup.ts
- candidate-adoption.ts
- TimeBook.tsx
- RoomCamera.tsx
- control-store.ts
- retrospective-subject.ts
- processGroupAlive
- interrupted-work-recovery.ts
- GitHubDelivery
- ticket-evidence.ts
- harness-baseline.ts
- cec.ts
- ControlStore
- continue-ownership-read.ts
- FeatureError
- constellation-runtime.ts
- contract.ts
- Offices
- report.ts
- service-health.ts
- admit-improvement.ts
- sanitize
- daily-cto.ts
- effects.ts
- telemetry.ts
- cli.ts
- lesson-selection.ts
- inspect-closed-plan.ts
- .getEffect
- outbox.ts
- cec-reads.ts
- it-specialist.ts
- index.ts
- Agents
- evidence-artifacts.ts
- ticket-stage-runner.ts
- ref_zod
- continue-unsealed-qa.ts
- install-service.mjs
- enrollment-gate.ts
- capture-session-clone.py
- preferences-store.ts
- OfficeSnapshot
- .save
- scope-repair-resume.ts
- copy.ts
- local-config.ts
- delivery-task.ts
- diagnostic-context.ts
- office-state-view.ts
- extract-worker.mjs
- coordination.ts
- unblock-brief.ts
- prompts/conversations.ts
- ITFollowUps.tsx
- resume-reconciliation.ts
- handover-cms.ts
- slack-supersession.ts

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
- `DeliverySlot` --references--> `Role`  [EXTRACTED]
  server/office/projects.ts → src/shared.ts
- `apply()` --indirect_call--> `note()`  [INFERRED]
  src/conversations/OutboxSavedImplementation.tsx → server/cec/parking/resume-parked.ts
- `stageContinuation` --references--> `WorkTime`  [EXTRACTED]
  server/cec/stage-continuation.ts → src/shared.ts
- `officeCapacity` --references--> `Role`  [EXTRACTED]
  server/office/projects.ts → src/shared.ts
- `StageContext` --references--> `Role`  [EXTRACTED]
  server/delivery/pipeline/accept-stage-result.ts → src/shared.ts

## Import Cycles
- 3-file cycle: `server/delivery/parking/resume-provider-review.ts -> server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/parking/resume-provider-review.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/review-wait.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts`
- 4-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/readiness/review-wait.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 4-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 4-file cycle: `server/delivery/recovery/implementation/activation-recovery.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/implementation/activation-recovery.ts`
- 4-file cycle: `server/delivery/recovery/implementation/saved-prerequisite-handoff.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/implementation/saved-prerequisite-handoff.ts`
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
- 5-file cycle: `server/delivery/recovery/implementation/continuation-evidence.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/preparation/post-conflict-preparation.ts -> server/delivery/recovery/implementation/continuation-evidence.ts`

## Communities (113 total, 0 thin omitted)

### Community 0 - "Button"
Cohesion: 0.13
Nodes (38): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView() (+30 more)

### Community 1 - "Role"
Cohesion: 0.11
Nodes (40): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+32 more)

### Community 2 - "dependency-bots/adopt.ts"
Cohesion: 0.08
Nodes (64): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard, projectCards() (+56 more)

### Community 3 - "review-run.ts"
Cohesion: 0.13
Nodes (29): featureItemComplete(), reconcileFeatureCompletion(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS, reserveReplacement(), stageBudget(), classifyFeatureFailure() (+21 more)

### Community 4 - "Inspector.tsx"
Cohesion: 0.08
Nodes (79): SendMessage, blockedSummary(), currentServices(), ServiceHealthPanel(), followUp(), labels, ServiceHealthRow(), ActivityTimeline() (+71 more)

### Community 5 - "completedExecution"
Cohesion: 0.09
Nodes (43): writerRestartPending(), DeliveryAuthorityInput, pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), assertStoppedBaseAudit(), AuditRow, CoverageRow, Hash (+35 more)

### Community 6 - "session-bridge.ts"
Cohesion: 0.06
Nodes (53): ref_node_perf_hooks, ref_ws, claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexDaemonProcesses(), accountCodexProcesses() (+45 more)

### Community 7 - "ref_react"
Cohesion: 0.08
Nodes (58): ref_react, ref_react_markdown, ref_remark_gfm, ref_yaml, KnowledgeActivity, KnowledgeActivityPage, KnowledgeEdge, KnowledgeMap (+50 more)

### Community 8 - "agents.ts"
Cohesion: 0.10
Nodes (28): implementationWorkerContext(), savedStageCompletion(), assertContinuableWorktree(), CONTINUABLE, continuationPrompt(), MAX_CONTINUATIONS, recordedContinuation(), stageContinuation (+20 more)

### Community 9 - "Store"
Cohesion: 0.05
Nodes (29): GitHubFeaturePublisher, helperTelemetry(), Assign, Board, Content, captureLearning(), recordLearningOpportunity(), queueLessonIssueCheck() (+21 more)

### Community 10 - "worker-runtime.ts"
Cohesion: 0.07
Nodes (40): SlackResultSchema, SlackVerificationSchema, candidateWorkspaceEnvironment(), server_delivery_harness_delivery_authority_resolvedeliverywork, assignmentSubject(), LessonSelection, catalogLine(), assertBriefingScope() (+32 more)

### Community 11 - "shared.ts"
Cohesion: 0.06
Nodes (61): applyIntakeObservation(), containedFile(), ProjectProgress, assertDeliveryMayMutate(), DECISION_KINDS, needsDecision(), park(), acceptStageResult() (+53 more)

### Community 12 - "App.tsx"
Cohesion: 0.05
Nodes (64): ref_lucide_react, ref_motion, ref_react_dom, BrainDrawer(), LessonsView(), themeColor, App(), BrainWorkspace (+56 more)

### Community 13 - "config.ts"
Cohesion: 0.06
Nodes (55): ref_node_url, assertFeatureDependencyOrder(), featureDependencyEdges(), key(), discoveryPrompt(), planPrompt(), artifactPath(), digest() (+47 more)

### Community 14 - "reader.ts"
Cohesion: 0.10
Nodes (23): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, CommittedBrain (+15 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.15
Nodes (45): createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest, captureRequests() (+37 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.09
Nodes (44): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, blockingTrigger, isBlocking(), brainOverlap (+36 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.11
Nodes (39): baselineLearning(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences(), configureKnowledge(), clip(), maintenanceBlockedId() (+31 more)

### Community 18 - "assignment-poll.ts"
Cohesion: 0.13
Nodes (23): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), ChannelSettings, notices(), queueChannelNotice(), clamp(), LIMITS (+15 more)

### Community 19 - "artifact"
Cohesion: 0.08
Nodes (61): partialLocalCleanupCandidate(), assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), reconcileCompletedConflictDraft(), routeReadyPostConflictPublication() (+53 more)

### Community 20 - "features.ts"
Cohesion: 0.11
Nodes (39): commandFeature(), reviewQuestions(), automaticIntakeWait(), confirmBrief(), FeaturePlanningBindings, assertQuestionVisibility(), applyHarnessAction(), HarnessActionInput (+31 more)

### Community 21 - "github-delivery.ts"
Cohesion: 0.07
Nodes (70): writerRestartInstruction(), findingsBlock(), BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction(), dependabotReviewGuidance(), resume() (+62 more)

### Community 22 - "index.tsx"
Cohesion: 0.07
Nodes (43): FeatureQuestionProjection, OutboxQuestionRound(), send(), FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases (+35 more)

### Community 23 - "dependencies.ts"
Cohesion: 0.12
Nodes (24): MergeNotifications, ATTEMPT_DELAYS_MS, Admission, admit(), IntakeContext, WAIT_STATUSES, resumeParked(), compatible() (+16 more)

### Community 24 - "knowledge.ts"
Cohesion: 0.05
Nodes (52): normalizeStatement(), curateLesson(), Curation, CurationAction, mergeEvidence(), lessonBrainAudit, LessonBrainOverlap, decideOfficeProposal() (+44 more)

### Community 25 - "maintenance/maintenance.ts"
Cohesion: 0.10
Nodes (29): ApproachSchema, maintenancePolicies(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice(), candidateOwner() (+21 more)

### Community 26 - "cost-ledger.ts"
Cohesion: 0.12
Nodes (33): captureCost(), server_telemetry_cost_entries_costcoveragesummary, costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId() (+25 more)

### Community 27 - "workKey"
Cohesion: 0.07
Nodes (74): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+66 more)

### Community 28 - "Ticket"
Cohesion: 0.26
Nodes (11): CommentPage, commentReadback(), JiraOperations, plain(), jiraRecord(), unpack(), metadataDigest(), verifyAlreadyAtStatus() (+3 more)

### Community 29 - "jira-time.ts"
Cohesion: 0.16
Nodes (19): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+11 more)

### Community 30 - "digest"
Cohesion: 0.08
Nodes (69): harnessCloseout(), PASSING, verifyMergeActions(), activeEffectId(), harnessEffect, retryRead(), runHarnessStage(), harnessStageResult() (+61 more)

### Community 31 - "owned-artifact.ts"
Cohesion: 0.26
Nodes (12): done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf(), createdAt(), dayDirs(), header() (+4 more)

### Community 32 - "conversations/conversations.ts"
Cohesion: 0.11
Nodes (18): ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff(), saveGoals() (+10 more)

### Community 33 - "DailyCTO.tsx"
Cohesion: 0.20
Nodes (12): CTOReview(), goalState, DailyCTO(), GoalHistory(), load(), reportDate(), reviewStatus, InlineText() (+4 more)

### Community 34 - "azure.ts"
Cohesion: 0.16
Nodes (20): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+12 more)

### Community 35 - ".activeClaims"
Cohesion: 0.09
Nodes (36): nextAttemptAt(), restartStoppedWriters(), unchangedSinceAccepted(), NOT_RETRYABLE, WRITER_STAGES, writerRestartCandidate, writerRestarted(), Execute (+28 more)

### Community 36 - "scheduled-work.ts"
Cohesion: 0.08
Nodes (45): ref_node_async_hooks, freshOwnershipRead(), deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), Ownership, ownershipContext, refreshDeliveryOwnership() (+37 more)

### Community 37 - "scheduler.ts"
Cohesion: 0.12
Nodes (20): ROLES, BLOCKED_CAUSES, blockedCauses(), officeCapacity, projectReadiness(), fifo(), ScheduledWork, Scheduler (+12 more)

### Community 38 - "ref_node_path"
Cohesion: 0.06
Nodes (91): ref_node_fs, ref_node_os, ref_node_path, ref_node_util, interruptedImplementation(), closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment (+83 more)

### Community 39 - "goal-reporting.ts"
Cohesion: 0.10
Nodes (32): GitHubMonitor, githubPRDescription(), collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip() (+24 more)

### Community 40 - "remove-candidate.ts"
Cohesion: 0.18
Nodes (18): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot() (+10 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.14
Nodes (29): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), server_telemetry_billable_work_issue_key, isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence() (+21 more)

### Community 42 - "node-visuals.ts"
Cohesion: 0.20
Nodes (13): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+5 more)

### Community 43 - "run-accounting.ts"
Cohesion: 0.14
Nodes (21): BoundedRead, EvidenceOutcome, backfillClaudeCost(), CompletionReader, codexHome(), HELPER_STDOUT_MAX_BYTES, helperAccounting(), claudeAccounting() (+13 more)

### Community 44 - "intent.ts"
Cohesion: 0.16
Nodes (17): ref_node_child_process, GitRead, savedImplementation(), sha(), sourceFiles(), ContinuationIO, continueImplementation(), nativeIO (+9 more)

### Community 45 - "Coordinator"
Cohesion: 0.10
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 46 - "OfficeScene.tsx"
Cohesion: 0.17
Nodes (33): withoutElapsed(), Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk() (+25 more)

### Community 47 - "ref_node_crypto"
Cohesion: 0.06
Nodes (31): ref_node_crypto, correlatedBuild(), candidateBranchMoved(), checkMail(), drainMail(), requestMail(), dispatchNightly(), drainDelivery() (+23 more)

### Community 48 - "setup-stop-cap.ts"
Cohesion: 0.60
Nodes (4): confirmSetupStopCap(), consecutiveSetupStops(), SETUP_STOP_CAP, setupStop()

### Community 49 - "assignments.ts"
Cohesion: 0.08
Nodes (35): guidanceExcerpt(), clip(), DEMAND_LIMIT, demandFacts(), DemandSection, key(), LessonKey, notes() (+27 more)

### Community 50 - ".emit"
Cohesion: 0.14
Nodes (26): decideImplementation(), requestQAPlanRetry(), configureChannelNotices(), configureNotices(), retryRecipientLookup(), recoverCTOInput(), DiscoveryResumeInput, enqueueMetadataRecovery() (+18 more)

### Community 51 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 52 - "create-candidate.ts"
Cohesion: 0.48
Nodes (6): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf()

### Community 53 - "codex-rollout.ts"
Cohesion: 0.18
Nodes (13): add(), CodexRequest, CodexRollout, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens() (+5 more)

### Community 54 - "work.ts"
Cohesion: 0.12
Nodes (23): classifyStop(), stopReason(), incompleteReadOutput(), planReadRetry(), temporaryReadFailure(), ProjectReadiness, AssignmentResult, BlockedCause (+15 more)

### Community 55 - "weekly-rollup.ts"
Cohesion: 0.13
Nodes (27): learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), retire(), BRAIN_SCOPE, RollupResult (+19 more)

### Community 56 - "candidate-adoption.ts"
Cohesion: 0.20
Nodes (13): completedPRReviews(), adoptCandidate(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), requireThat() (+5 more)

### Community 57 - "TimeBook.tsx"
Cohesion: 0.09
Nodes (44): TelemetryReport, displayAgentTask(), LiveAgentTask(), Props, RunningTask(), text(), AzureBuild, src_shared_liveanchor (+36 more)

### Community 58 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (10): ref_react_three_drei, ref_react_three_fiber, ref_three_stdlib, CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility (+2 more)

### Community 59 - "control-store.ts"
Cohesion: 0.13
Nodes (14): ref_node_sqlite, Clock, applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, statementCache(), initialSnapshot() (+6 more)

### Community 60 - "retrospective-subject.ts"
Cohesion: 0.14
Nodes (20): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+12 more)

### Community 61 - "processGroupAlive"
Cohesion: 0.10
Nodes (32): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, ctoReplacementResolution(), investigationEvidence(), implementationReplacementResolution(), INVOCATION_SOURCE_REFS, invocationSource(), sections (+24 more)

### Community 62 - "interrupted-work-recovery.ts"
Cohesion: 0.12
Nodes (15): channelNoticeAuthorized(), comparableSlackText(), SlackMessages, interruptAdoptions(), legacy(), REMOVED_FIELDS, retireLegacyRecovery(), goalNoticeAuthorized() (+7 more)

### Community 63 - "GitHubDelivery"
Cohesion: 0.07
Nodes (36): Execute, installDependencies(), major(), removeAdoptedClone(), namedRepairIds(), HarnessControl, withHarnessWork(), Check (+28 more)

### Community 64 - "ticket-evidence.ts"
Cohesion: 0.15
Nodes (20): ref_node_string_decoder, assetDownloader(), attachmentKind(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS, EvidenceAttachment (+12 more)

### Community 65 - "harness-baseline.ts"
Cohesion: 0.15
Nodes (20): baselineReport, BaselineSource, baselineText(), millions(), row(), share(), add(), BaselineState (+12 more)

### Community 66 - "cec.ts"
Cohesion: 0.13
Nodes (24): cecPrompt(), resolvedDecisionNote(), stageInstructions, reviewedPlanGuidance, reviewedPlanGuideDigest, stagePrompt(), StagePromptInput, METADATA_FINDING_GUIDANCE (+16 more)

### Community 67 - "ControlStore"
Cohesion: 0.16
Nodes (5): DailyCTO, Briefing, saveReviewBriefing(), ControlStore, DailyCTOReport

### Community 68 - "continue-ownership-read.ts"
Cohesion: 0.30
Nodes (11): continueOwnershipRead(), expiredOwnershipRead(), ownershipReadGate(), ownershipReadState(), ownershipReadHistory(), ownershipReadSource(), readOwnershipCandidate, ReadOwnershipView (+3 more)

### Community 69 - "FeatureError"
Cohesion: 0.17
Nodes (12): Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), Transition, descriptionPreimage(), plain() (+4 more)

### Community 70 - "constellation-runtime.ts"
Cohesion: 0.10
Nodes (22): ref_3d_force_graph, ref_three, CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point (+14 more)

### Community 71 - "contract.ts"
Cohesion: 0.15
Nodes (16): Event, one(), prePushRejection(), PushIdentity, settledPushBoundary(), At, errno, GroupInventory (+8 more)

### Community 72 - "Offices"
Cohesion: 0.23
Nodes (3): seedOfficeLessons(), Offices, markCaptureStart()

### Community 73 - "report.ts"
Cohesion: 0.26
Nodes (13): Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked(), row() (+5 more)

### Community 74 - "service-health.ts"
Cohesion: 0.20
Nodes (8): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, ServiceHealth

### Community 75 - "admit-improvement.ts"
Cohesion: 0.22
Nodes (16): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+8 more)

### Community 76 - "sanitize"
Cohesion: 0.15
Nodes (22): assertConversationReadback(), syncOutbox(), finishSupersededReadback(), projectSlackDeliveries(), settleRequestedSlackReplacement(), SlackRequestSchema, Input, supersedeSlackDelivery() (+14 more)

### Community 77 - "daily-cto.ts"
Cohesion: 0.12
Nodes (20): EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), applyGoalReview(), DailyResultSchema, EvidenceRefSchema, FreshDailyResultSchema, GoalEvidenceRequestSchema (+12 more)

### Community 78 - "effects.ts"
Cohesion: 0.10
Nodes (18): approveFeature(), featureById(), mutation(), Link, linkFeature(), FeaturePublisher, publishFeature(), reconcilePublication() (+10 more)

### Community 79 - "telemetry.ts"
Cohesion: 0.11
Nodes (24): CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL, Rates (+16 more)

### Community 80 - "cli.ts"
Cohesion: 0.18
Nodes (7): ref_node_stream, ref_node_timers, args, [cmd,...rawArgs], commands, key, projectIndex

### Community 81 - "lesson-selection.ts"
Cohesion: 0.12
Nodes (24): fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose() (+16 more)

### Community 82 - "inspect-closed-plan.ts"
Cohesion: 0.17
Nodes (10): closedReadonlyPlan(), Document, entryExists(), inspectClosedQAPlan(), Decision, itChatPrompt(), QAPlanRetry, QAPlanRetryProof (+2 more)

### Community 83 - ".getEffect"
Cohesion: 0.21
Nodes (11): bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), ownedArtifact(), rawHash(), recoverDiscovery(), scopeNote(), GitHubOperations (+3 more)

### Community 84 - "outbox.ts"
Cohesion: 0.13
Nodes (24): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), ctoInputIdentityMatches(), ctoInputRecovered(), ADOPTION_STALLED_MS, conversationResolved(), projectOutbox() (+16 more)

### Community 85 - "cec-reads.ts"
Cohesion: 0.23
Nodes (12): IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), intakeMembership(), projectListScope(), cecIntakePrompt(), cecReadbackPrompt() (+4 more)

### Community 86 - "it-specialist.ts"
Cohesion: 0.16
Nodes (19): partialLocalCleanupKey(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), ITContext, diagnosticSnapshot(), investigationCandidates() (+11 more)

### Community 87 - "index.ts"
Cohesion: 0.08
Nodes (45): ref_hono_node_server, ref_node_http, ref_vite, implementationContinuationRoute(), qaPlanRetryRoute(), close(), config, itSpecialist (+37 more)

### Community 88 - "Agents"
Cohesion: 0.20
Nodes (6): cecReconcilePrompt(), slackVerifyPrompt(), canFileGithubIssue(), githubFollowupPrompt(), knowledgeChatPrompt(), Agents

### Community 89 - "evidence-artifacts.ts"
Cohesion: 0.35
Nodes (9): evidenceDirectory(), readEvidence(), ProviderEvidence, canonical(), evidenceDigest(), evidenceHash(), semantic(), stableUrl() (+1 more)

### Community 90 - "ticket-stage-runner.ts"
Cohesion: 0.13
Nodes (33): parksInJira(), MISSING_SAVED_PLAN, recoverSavedPlan(), run(), verifiedTransition(), advance(), nextStage(), publicationEvidenceGap() (+25 more)

### Community 91 - "ref_zod"
Cohesion: 0.20
Nodes (10): ref_zod, BrainStatusSchema, identity, brainCheckpointCompletion(), coverageSchema, followupSchema, verified, reconcileCompletedCheckpoints() (+2 more)

### Community 92 - "continue-unsealed-qa.ts"
Cohesion: 0.24
Nodes (11): OwnershipRead, continueUnsealedQA(), entry(), handoffOwnership(), ReadbackOwnerDecision, qaPlanEvidenceGap(), qaRunDirectory(), OfficeQAHandoff (+3 more)

### Community 93 - "install-service.mjs"
Cohesion: 0.18
Nodes (9): file, folder, logs, root, GIT_NETWORK, LIVE_PROVIDERS, liveReach(), networkUrl() (+1 more)

### Community 94 - "enrollment-gate.ts"
Cohesion: 0.26
Nodes (16): featureEffectGate(), assertFeatureGate(), bindFeature(), currentApproval(), featureGate(), predecessorComplete(), recoveryHeld(), deliveryPreflight (+8 more)

### Community 95 - "capture-session-clone.py"
Cohesion: 0.15
Nodes (10): ctypes, errno, importlib_util, json, os, pathlib, Copy a coherent macOS clone of inherited reader fd3 to anonymous target fd4. No…, Read-only protocol adapter for the installed review helper. No model dispatch. (+2 more)

### Community 96 - "preferences-store.ts"
Cohesion: 0.19
Nodes (9): PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS, OfficePreferences (+1 more)

### Community 97 - "OfficeSnapshot"
Cohesion: 0.07
Nodes (53): knowledgeOutbox(), DailyCTOSummary, Conversation(), LessonDecisionAction, lessonDecisionState(), readLessonDecision(), DAYS, dueLessonDecisions() (+45 more)

### Community 98 - ".save"
Cohesion: 0.18
Nodes (30): jiraCollection(), BLOCKED, findComment(), LiveIssue, readIssue(), readIssues(), Execute, jira() (+22 more)

### Community 99 - "scope-repair-resume.ts"
Cohesion: 0.36
Nodes (11): Ownership, reconcileScopeRepairReadback(), assertScopeRepairResumeFindings(), certain(), effects(), originalClaim(), Ownership, requireThat() (+3 more)

### Community 100 - "copy.ts"
Cohesion: 0.35
Nodes (9): nativeGitRead(), patchArgs, sourceCopyMatches(), absent(), candidateParent(), copySavedImplementation(), Saved, sha() (+1 more)

### Community 101 - "local-config.ts"
Cohesion: 0.33
Nodes (9): AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), goalEvidencePath(), OfficeConfigInputs, CECBinding, localBindings, assertModelOverrides(), ModelOverrides (+1 more)

### Community 102 - "delivery-task.ts"
Cohesion: 0.31
Nodes (7): APPROACH_GUIDANCE, reviewInstructions(), deliveryTask(), DeliveryTaskInput, DISCOVERY_GUIDANCE, compactSteps(), featureDeliveryContext()

### Community 103 - "diagnostic-context.ts"
Cohesion: 0.33
Nodes (5): assignmentDiagnostics(), diagnosticContext(), itAgent(), itDiagnostics(), Agent

### Community 104 - "office-state-view.ts"
Cohesion: 0.60
Nodes (4): leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore()

### Community 105 - "extract-worker.mjs"
Cohesion: 0.43
Nodes (6): ref_mammoth, ref_pdfjs_dist, bounded(), extract(), fail(), [path,kind]

### Community 106 - "coordination.ts"
Cohesion: 0.09
Nodes (28): reconcileNoticeConfirmations(), dependencyCompletionKey(), completeNativeCheckpoint(), BrainFollowup, Result, queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance() (+20 more)

### Community 107 - "unblock-brief.ts"
Cohesion: 0.53
Nodes (5): clearUnblockBrief(), key(), saveUnblockBrief(), unblockBrief, src_shared_learningsubject

### Community 108 - "prompts/conversations.ts"
Cohesion: 0.24
Nodes (9): cecChatPrompt(), ctoChatPrompt(), slackSendPrompt(), PICKUP_CHAT, PickupSchema, boundedCTOContext(), project(), SKILLS (+1 more)

### Community 109 - "ITFollowUps.tsx"
Cohesion: 0.67
Nodes (4): itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps()

### Community 110 - "resume-reconciliation.ts"
Cohesion: 0.39
Nodes (6): Attempt, needsResumeReconciliation(), stoppedInSetup(), ownReceipts(), Receipt, supersededReceipt()

### Community 111 - "handover-cms.ts"
Cohesion: 0.40
Nodes (4): ref_smol_toml, file, project, root

### Community 112 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

## Knowledge Gaps
- **490 isolated node(s):** `CONTINUABLE`, `EvidenceSchema`, `ReceiptSchema`, `LegacyResultSchema`, `ResolutionSchema` (+485 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 631 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `dependency-bots/adopt.ts`, `review-run.ts`, `completedExecution`, `session-bridge.ts`, `agents.ts`, `worker-runtime.ts`, `shared.ts`, `config.ts`, `reader.ts`, `scheduled-captures.ts`, `run-retrospective.ts`, `record-trigger.ts`, `assignment-poll.ts`, `artifact`, `features.ts`, `github-delivery.ts`, `dependencies.ts`, `knowledge.ts`, `maintenance/maintenance.ts`, `cost-ledger.ts`, `workKey`, `Ticket`, `jira-time.ts`, `digest`, `conversations/conversations.ts`, `azure.ts`, `.activeClaims`, `scheduled-work.ts`, `scheduler.ts`, `ref_node_path`, `goal-reporting.ts`, `remove-candidate.ts`, `time-scope.ts`, `run-accounting.ts`, `intent.ts`, `ref_node_crypto`, `assignments.ts`, `.emit`, `create-candidate.ts`, `work.ts`, `weekly-rollup.ts`, `candidate-adoption.ts`, `control-store.ts`, `retrospective-subject.ts`, `processGroupAlive`, `interrupted-work-recovery.ts`, `GitHubDelivery`, `ticket-evidence.ts`, `cec.ts`, `continue-ownership-read.ts`, `FeatureError`, `Offices`, `admit-improvement.ts`, `sanitize`, `daily-cto.ts`, `effects.ts`, `lesson-selection.ts`, `inspect-closed-plan.ts`, `.getEffect`, `outbox.ts`, `cec-reads.ts`, `it-specialist.ts`, `index.ts`, `evidence-artifacts.ts`, `ticket-stage-runner.ts`, `ref_zod`, `continue-unsealed-qa.ts`, `enrollment-gate.ts`, `OfficeSnapshot`, `.save`, `scope-repair-resume.ts`, `copy.ts`, `delivery-task.ts`, `diagnostic-context.ts`, `office-state-view.ts`, `coordination.ts`, `prompts/conversations.ts`?**
  _High betweenness centrality (0.105) - this node is a cross-community bridge._
- **Why does `createConstellation()` connect `constellation-runtime.ts` to `node-visuals.ts`, `OfficeScene.tsx`, `ref_react`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Why does `sceneColors` connect `OfficeScene.tsx` to `node-visuals.ts`, `constellation-runtime.ts`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **What connects `CONTINUABLE`, `EvidenceSchema`, `ReceiptSchema` to the rest of the system?**
  _490 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Button` be split into smaller, more focused modules?**
  _Cohesion score 0.1297134238310709 - nodes in this community are weakly interconnected._
- **Should `Role` be split into smaller, more focused modules?**
  _Cohesion score 0.11054421768707483 - nodes in this community are weakly interconnected._
- **Should `dependency-bots/adopt.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07522774022920953 - nodes in this community are weakly interconnected._