# Graph Report - the-office  (2026-11-16)

## Corpus Check
- 832 files · ~328,966 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4072 nodes · 18753 edges · 113 communities (112 shown, 1 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 608 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9a58fe97`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- index.tsx
- ref_node_path
- dependency-bots/adopt.ts
- .transaction
- Inspector.tsx
- recovery/stopped-base-update.ts
- session-bridge.ts
- ref_react
- agents.ts
- Store
- local-config.ts
- slack-supersession.ts
- App.tsx
- features/workflow.ts
- reader.ts
- scheduled-captures.ts
- run-retrospective.ts
- record-trigger.ts
- read-retries.ts
- digest
- features.ts
- delivery-repairs.ts
- Role
- enrollment-gate.ts
- knowledge.ts
- maintenance/maintenance.ts
- cost-ledger.ts
- currentAssignment
- coordination.ts
- jira-time.ts
- assignment-context.ts
- preferences-store.ts
- ref_zod
- Conversation.tsx
- azure.ts
- cec-reads.ts
- scheduled-work.ts
- scheduler.ts
- requests.ts
- accept-stage-result.ts
- assignment-poll.ts
- time-scope.ts
- node-visuals.ts
- run-accounting.ts
- session-context-file.ts
- executeRequest
- OfficeScene.tsx
- Engine
- ref_node_crypto
- assignments.ts
- .emit
- scene-motion.ts
- SlackMessages
- cec.ts
- work.ts
- weekly-rollup.ts
- shared.ts
- TimeBook.tsx
- RoomCamera.tsx
- control-store.ts
- retrospective-subject.ts
- run.ts
- .getEffect
- remove-candidate.ts
- ticket-evidence.ts
- harness-baseline.ts
- QuestionStepper.tsx
- ControlStore
- session-scope.ts
- cec/workflow.ts
- constellation-runtime.ts
- contract.ts
- offices.ts
- report.ts
- service-health.ts
- admit-improvement.ts
- daily-cto.ts
- workKey
- store.ts
- telemetry.ts
- cli.ts
- lesson-selection.ts
- evidence.ts
- install-service.mjs
- outbox.ts
- ledger.ts
- it-specialist.ts
- index.ts
- packed-consumer-pnpm.ts
- easternDay
- ticket-stage-runner.ts
- fact-bounds.ts
- blocker-followups.ts
- extraction.ts
- recovery-ledger.ts
- capture-session-clone.py
- useOfficePreferences.ts
- OfficeSnapshot
- .save
- create-candidate.ts
- price-table.ts
- codex-rollout.ts
- time-readback.ts
- work-summary.ts
- codex-rollout-file.ts
- extract-worker.mjs
- owned-artifact.ts
- run-evidence.ts
- delivery-ownership.ts
- it-agent.ts
- codexAccounting
- command-registry.ts
- salvage-worktree.ts

## God Nodes (most connected - your core abstractions)
1. `Store` - 366 edges
2. `TicketJob` - 172 edges
3. `digest()` - 150 edges
4. `GitHubDelivery` - 116 edges
5. `command()` - 116 edges
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
- `writerRestartCandidate` --calls--> `workKey()`  [EXTRACTED]
  server/delivery/attempts/restart-writer.ts → src/contracts/work.ts
- `writerRestartCandidate` --references--> `WorkTime`  [EXTRACTED]
  server/delivery/attempts/restart-writer.ts → src/shared.ts
- `DeliveryAuthorityInput` --references--> `HarnessRequest`  [EXTRACTED]
  server/delivery/harness/delivery-authority.ts → src/contracts/work.ts

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

## Communities (113 total, 1 thin omitted)

### Community 0 - "index.tsx"
Cohesion: 0.13
Nodes (40): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView() (+32 more)

### Community 1 - "ref_node_path"
Cohesion: 0.06
Nodes (71): ref_node_fs, ref_node_os, ref_node_path, ref_node_util, GitRead, nativeGitRead(), patchArgs, savedImplementation() (+63 more)

### Community 2 - "dependency-bots/adopt.ts"
Cohesion: 0.08
Nodes (63): resolveLane(), cardStatus(), Execute, ProjectCard, projectCards(), projectGraphql(), setCardStatus(), statusField (+55 more)

### Community 3 - ".transaction"
Cohesion: 0.07
Nodes (44): interruptAdoptions(), legacy(), REMOVED_FIELDS, retireLegacyRecovery(), featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), DELAYS (+36 more)

### Community 4 - "Inspector.tsx"
Cohesion: 0.11
Nodes (64): Outbox(), blockedSummary(), ServiceHealthPanel(), followUp(), labels, ServiceHealthRow(), BlockerFollowups(), LessonsPanel() (+56 more)

### Community 5 - "recovery/stopped-base-update.ts"
Cohesion: 0.11
Nodes (33): nextAttemptAt(), NOT_RETRYABLE, WRITER_STAGES, writerRestartCandidate, writerRestarted(), writerRestartPending(), deliveryAdmission(), assessDeliveryAuthority() (+25 more)

### Community 6 - "session-bridge.ts"
Cohesion: 0.13
Nodes (23): ref_ws, claudeSessionContext(), codexDaemonProcesses(), accountCodexProcesses(), codexProcessInventory, DesktopSessions, unaccountedProcesses(), codexSessionContext() (+15 more)

### Community 7 - "ref_react"
Cohesion: 0.08
Nodes (59): ref_react, ref_react_markdown, ref_remark_gfm, ref_yaml, KnowledgeActivity, KnowledgeEdge, KnowledgeMap, KnowledgeNode (+51 more)

### Community 8 - "agents.ts"
Cohesion: 0.06
Nodes (51): cecChatPrompt(), ctoChatPrompt(), itChatPrompt(), slackSendPrompt(), slackVerifyPrompt(), SlackResultSchema, SlackVerificationSchema, candidateWorkspaceEnvironment() (+43 more)

### Community 9 - "Store"
Cohesion: 0.08
Nodes (19): CommentPage, commentReadback(), JiraOperations, plain(), jiraRecord(), unpack(), metadataDigest(), verifyAlreadyAtStatus() (+11 more)

### Community 10 - "local-config.ts"
Cohesion: 0.14
Nodes (20): AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), goalEvidencePath(), OfficeConfigInputs, officeConfigRoute(), officeConfigSummary(), CECBinding, localBindings (+12 more)

### Community 11 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 12 - "App.tsx"
Cohesion: 0.06
Nodes (53): ref_lucide_react, ref_motion, ref_react_dom, BrainDrawer(), themeColor, App(), BrainWorkspace, CONNECTION (+45 more)

### Community 13 - "features/workflow.ts"
Cohesion: 0.08
Nodes (58): approveFeature(), commandFeature(), featureById(), mutation(), reviewQuestions(), discoveryPrompt(), planPrompt(), artifactPath() (+50 more)

### Community 14 - "reader.ts"
Cohesion: 0.07
Nodes (38): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, CommittedBrain (+30 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.15
Nodes (45): createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest, captureRequests() (+37 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.09
Nodes (45): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, blockingTrigger, isBlocking(), brainOverlap (+37 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.11
Nodes (39): baselineLearning(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences(), configureKnowledge(), clip(), maintenanceBlockedId() (+31 more)

### Community 18 - "read-retries.ts"
Cohesion: 0.38
Nodes (7): ATTEMPT_DELAYS_MS, classifyStop(), stopReason(), incompleteReadOutput(), IntakeResult, planReadRetry(), temporaryReadFailure()

### Community 19 - "digest"
Cohesion: 0.07
Nodes (93): ownershipReadHistory(), verifiedCloseoutCleanupRequest(), partialLocalCleanupCandidate(), partialLocalCleanupKey(), savedActivationFailure(), adoptCandidate(), reported, Scope (+85 more)

### Community 20 - "features.ts"
Cohesion: 0.09
Nodes (37): confirmBrief(), FeaturePlanningBindings, assertQuestionVisibility(), applyHarnessAction(), HarnessActionInput, recoveryPreconditions(), recoveryTarget(), pendingQuestions() (+29 more)

### Community 21 - "delivery-repairs.ts"
Cohesion: 0.14
Nodes (26): removeAdoptedClone(), namedRepairIds(), stoppedBasePackageInstruction(), adoptedReviewCandidate(), ciCheckout(), finishCISetup(), verifyCIHooks(), CIFailure (+18 more)

### Community 22 - "Role"
Cohesion: 0.10
Nodes (43): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+35 more)

### Community 23 - "enrollment-gate.ts"
Cohesion: 0.12
Nodes (34): Admission, admit(), IntakeContext, WAIT_STATUSES, compatible(), dependencyEligibility(), DependencyStores, issueKey() (+26 more)

### Community 24 - "knowledge.ts"
Cohesion: 0.06
Nodes (47): normalizeStatement(), lessonBrainAudit, LessonBrainOverlap, decideOfficeProposal(), mirrorOfficeKnowledge(), now(), OfficeKnowledgeStore, proposeOfficeLessons() (+39 more)

### Community 25 - "maintenance/maintenance.ts"
Cohesion: 0.06
Nodes (49): ApproachSchema, maintenancePolicies(), completeNativeCheckpoint(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, BrainStatusSchema, identity (+41 more)

### Community 26 - "cost-ledger.ts"
Cohesion: 0.16
Nodes (27): captureCost(), server_telemetry_cost_entries_costcoveragesummary, costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress() (+19 more)

### Community 27 - "currentAssignment"
Cohesion: 0.07
Nodes (73): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+65 more)

### Community 28 - "coordination.ts"
Cohesion: 0.10
Nodes (24): reconcileNoticeConfirmations(), dependencyCompletionKey(), BrainFollowup, brainCheckpointCompletion(), coverageSchema, followupSchema, verified, reconcileCompletedCheckpoints() (+16 more)

### Community 29 - "jira-time.ts"
Cohesion: 0.14
Nodes (21): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+13 more)

### Community 30 - "assignment-context.ts"
Cohesion: 0.07
Nodes (68): moveLane(), Execute, installDependencies(), major(), harnessCloseout(), PASSING, verifyMergeActions(), activeEffectId() (+60 more)

### Community 31 - "preferences-store.ts"
Cohesion: 0.19
Nodes (9): PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS, OfficePreferences (+1 more)

### Community 32 - "ref_zod"
Cohesion: 0.07
Nodes (42): ref_zod, assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO() (+34 more)

### Community 33 - "Conversation.tsx"
Cohesion: 0.13
Nodes (23): Conversation(), LessonDecisionAction, lessonDecisionState(), readLessonDecision(), isLessonDecision(), OutboxLessonDecision(), act(), readStatus() (+15 more)

### Community 34 - "azure.ts"
Cohesion: 0.09
Nodes (32): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+24 more)

### Community 35 - "cec-reads.ts"
Cohesion: 0.11
Nodes (17): implementationWorkerContext(), IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), intakeMembership(), projectListScope(), cecIntakePrompt() (+9 more)

### Community 36 - "scheduled-work.ts"
Cohesion: 0.10
Nodes (35): freshOwnershipRead(), deliverySlot(), withAmendmentOwnership(), preparationRequestResolved(), gateFeatureWork(), requestPriority(), closedTicketReport(), closedTicketRequest() (+27 more)

### Community 37 - "scheduler.ts"
Cohesion: 0.12
Nodes (18): Clock, officeCapacity, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch() (+10 more)

### Community 38 - "requests.ts"
Cohesion: 0.10
Nodes (46): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+38 more)

### Community 39 - "accept-stage-result.ts"
Cohesion: 0.17
Nodes (22): park(), acceptStageResult(), assertDraftClaimHistory(), linkDraftIssue(), protectedOriginalClaim(), METADATA_FINDING, publicationReadArgs(), Read (+14 more)

### Community 40 - "assignment-poll.ts"
Cohesion: 0.11
Nodes (25): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), channelNoticeAuthorized(), ChannelSettings, notices(), queueChannelNotice(), clamp() (+17 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.13
Nodes (30): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), server_telemetry_billable_work_issue_key, isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence() (+22 more)

### Community 42 - "node-visuals.ts"
Cohesion: 0.19
Nodes (14): ref_three, ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels() (+6 more)

### Community 43 - "run-accounting.ts"
Cohesion: 0.18
Nodes (16): BoundedRead, CompletionReader, HELPER_STDOUT_MAX_BYTES, helperAccounting(), claudeAccounting(), COMPLETION_MAX_BYTES, completionAccounting(), readCompletion() (+8 more)

### Community 44 - "session-context-file.ts"
Cohesion: 0.21
Nodes (13): ref_node_perf_hooks, contextFoldPrefix, SessionContextCheckpoint, captureSessionContextClone(), ContextReadPhase, SessionContextDeadline, sessionContextFile(), ContextReadChanged (+5 more)

### Community 45 - "executeRequest"
Cohesion: 0.07
Nodes (3): coordination(), Coordinator, executeRequest()

### Community 46 - "OfficeScene.tsx"
Cohesion: 0.16
Nodes (34): withoutElapsed(), Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk() (+26 more)

### Community 47 - "Engine"
Cohesion: 0.10
Nodes (5): correlatedBuild(), Engine, observe(), observeParked(), parkedReadError

### Community 48 - "ref_node_crypto"
Cohesion: 0.10
Nodes (33): ref_node_crypto, candidateBranchMoved(), continueImplementation(), checkMail(), drainMail(), requestMail(), dispatchNightly(), drainDelivery() (+25 more)

### Community 49 - "assignments.ts"
Cohesion: 0.10
Nodes (26): clip(), DEMAND_LIMIT, demandFacts(), DemandSection, key(), LessonKey, notes(), assignmentLookups (+18 more)

### Community 50 - ".emit"
Cohesion: 0.16
Nodes (24): decideImplementation(), requestQAPlanRetry(), configureChannelNotices(), configureNotices(), retryRecipientLookup(), recoverCTOInput(), DiscoveryResumeInput, declineLessonIssue() (+16 more)

### Community 51 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 52 - "SlackMessages"
Cohesion: 0.18
Nodes (8): MergeNotifications, comparableSlackText(), SlackMessages, goalNoticeAuthorized(), sendGoalNotice(), maintenanceNoticeAuthorized(), sendMaintenanceNotice(), MergeNotice

### Community 53 - "cec.ts"
Cohesion: 0.11
Nodes (26): cecPrompt(), resolvedDecisionNote(), stageInstructions, reviewedPlanGuidance, reviewedPlanGuideDigest, stagePrompt(), StagePromptInput, METADATA_FINDING_GUIDANCE (+18 more)

### Community 54 - "work.ts"
Cohesion: 0.10
Nodes (24): BLOCKED_CAUSES, blockedCauses(), projectReadiness(), ProjectReadiness, AssignmentResult, BlockedCause, CompletionCondition, DeliveryAdmission (+16 more)

### Community 55 - "weekly-rollup.ts"
Cohesion: 0.21
Nodes (16): learningMetrics(), BRAIN_SCOPE, RollupResult, harperFolder(), RETROSPECTIVE_TIMEOUT, lastFriday(), ROLLUP_HISTORY, rollupDue() (+8 more)

### Community 56 - "shared.ts"
Cohesion: 0.04
Nodes (141): writerRestartInstruction(), restartStoppedWriters(), unchangedSinceAccepted(), initialManualStart(), Lane, MOVABLE, ProjectProgress, findingsBlock() (+133 more)

### Community 57 - "TimeBook.tsx"
Cohesion: 0.09
Nodes (42): displayAgentTask(), LiveAgentTask(), Props, RunningTask(), text(), AzureBuild, src_shared_liveanchor, ROLE_NAMES (+34 more)

### Community 58 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (10): ref_react_three_drei, ref_react_three_fiber, ref_three_stdlib, CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility (+2 more)

### Community 59 - "control-store.ts"
Cohesion: 0.17
Nodes (10): ref_node_sqlite, applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, statementCache(), initialSnapshot(), initializeStoreSchema() (+2 more)

### Community 60 - "retrospective-subject.ts"
Cohesion: 0.19
Nodes (15): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+7 more)

### Community 61 - "run.ts"
Cohesion: 0.18
Nodes (14): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, OFFICE_FIX_PROMPT, OfficeFixResult, validateOfficeFix(), investigationReady(), requeueInvestigationEvidence(), InvestigationOptions (+6 more)

### Community 62 - ".getEffect"
Cohesion: 0.18
Nodes (14): bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), ownedArtifact(), rawHash(), recoverDiscovery(), scopeNote(), GitHubOperations (+6 more)

### Community 63 - "remove-candidate.ts"
Cohesion: 0.19
Nodes (15): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+7 more)

### Community 64 - "ticket-evidence.ts"
Cohesion: 0.14
Nodes (28): assetDownloader(), attachmentKind(), evidenceDirectory(), readEvidence(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS (+20 more)

### Community 65 - "harness-baseline.ts"
Cohesion: 0.15
Nodes (20): baselineReport, BaselineSource, baselineText(), millions(), row(), share(), add(), BaselineState (+12 more)

### Community 66 - "QuestionStepper.tsx"
Cohesion: 0.19
Nodes (18): FeatureQuestionProjection, OutboxQuestionRound(), send(), draftKey(), readDraft(), saveDraft(), QuestionRound(), nextQuestion() (+10 more)

### Community 67 - "ControlStore"
Cohesion: 0.17
Nodes (6): DailyCTO, EvidenceRequestConflict, Briefing, saveReviewBriefing(), ControlStore, DailyCTOReport

### Community 68 - "session-scope.ts"
Cohesion: 0.16
Nodes (17): readTranscript, root, claudeSessionScope(), readRollout, LiveSession, ContextProject, ContextReader, retainSessionMessage() (+9 more)

### Community 69 - "cec/workflow.ts"
Cohesion: 0.18
Nodes (18): applyIntakeObservation(), containedFile(), unresolvedVerification(), closeoutRequestResolved(), metadataRequestResolved(), Ownership, reconcileScopeRepairReadback(), scopeRepairRequestResolved() (+10 more)

### Community 70 - "constellation-runtime.ts"
Cohesion: 0.10
Nodes (21): ref_3d_force_graph, CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point, ConstellationRuntime (+13 more)

### Community 71 - "contract.ts"
Cohesion: 0.15
Nodes (16): Event, one(), prePushRejection(), PushIdentity, settledPushBoundary(), At, errno, GroupInventory (+8 more)

### Community 72 - "offices.ts"
Cohesion: 0.10
Nodes (14): ref_smol_toml, QuestionNotifications, leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), DELIVERY_CONCURRENCY, file (+6 more)

### Community 73 - "report.ts"
Cohesion: 0.29
Nodes (12): Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked(), row() (+4 more)

### Community 74 - "service-health.ts"
Cohesion: 0.18
Nodes (9): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, slackHealth(), HealthReport (+1 more)

### Community 75 - "admit-improvement.ts"
Cohesion: 0.20
Nodes (17): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+9 more)

### Community 76 - "daily-cto.ts"
Cohesion: 0.12
Nodes (19): evidenceRequestConflicts, dailyReviewPrompt(), applyGoalReview(), DailyResultSchema, EvidenceRefSchema, FreshDailyResultSchema, GoalEvidenceRequestSchema, statusAllowed() (+11 more)

### Community 77 - "workKey"
Cohesion: 0.30
Nodes (9): completedPRReviews(), eligible(), mergedByOwner(), ownerSettles(), retireExternalDeliveries(), settledExternalRepair(), nativeDeliveryReadbackCandidate(), reconcileNativeDelivery() (+1 more)

### Community 78 - "store.ts"
Cohesion: 0.08
Nodes (27): Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), Transition, descriptionPreimage(), plain() (+19 more)

### Community 79 - "telemetry.ts"
Cohesion: 0.13
Nodes (19): CodexRollout, basisOf(), claudeCost(), toMicroUsd(), claudeCrashZero(), claudeUsage(), count(), CostCompleteness (+11 more)

### Community 80 - "cli.ts"
Cohesion: 0.17
Nodes (8): ref_node_stream, ref_node_timers, args, [cmd,...rawArgs], commands, key, projectIndex, PORT

### Community 81 - "lesson-selection.ts"
Cohesion: 0.13
Nodes (18): INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), LessonSelection, MAINTENANCE, MAX_LESSONS (+10 more)

### Community 82 - "evidence.ts"
Cohesion: 0.19
Nodes (13): investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_SOURCE_PATHS, officeSource(), ROOT, LaunchPolicy (+5 more)

### Community 83 - "install-service.mjs"
Cohesion: 0.29
Nodes (5): ref_node_url, file, folder, logs, root

### Community 84 - "outbox.ts"
Cohesion: 0.19
Nodes (11): ctoInputIdentityMatches(), ctoInputRecovered(), ADOPTION_STALLED_MS, conversationResolved(), projectOutbox(), slackRequestSettled(), checkpointSuperseded(), isSavedPlanFollowup() (+3 more)

### Community 85 - "ledger.ts"
Cohesion: 0.29
Nodes (10): investigationCandidates(), investigationId(), investigationFollowUps(), investigationResolution(), syncInvestigations(), NOTIFY_HELPER, notifyHelperResolution(), retriedReadResolution() (+2 more)

### Community 86 - "it-specialist.ts"
Cohesion: 0.25
Nodes (12): ITContext, publishITReport(), delays, recoverAttempt(), ServiceHealthChecks, itFollowUpView(), sessionVisibilityCopy(), date() (+4 more)

### Community 87 - "index.ts"
Cohesion: 0.08
Nodes (39): ref_hono_node_server, ref_node_http, ref_vite, implementationPreview(), implementationContinuationRoute(), qaPlanRetryRoute(), close(), config (+31 more)

### Community 89 - "easternDay"
Cohesion: 0.21
Nodes (13): expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), dailyReviewDate(), reviewWeekday() (+5 more)

### Community 90 - "ticket-stage-runner.ts"
Cohesion: 0.05
Nodes (66): ContinuationIO, nativeIO, assertOwnership(), ImplementationDecision, OwnershipRead, assertCandidateIdle(), parksInJira(), closedReadonlyPlan() (+58 more)

### Community 91 - "fact-bounds.ts"
Cohesion: 0.25
Nodes (15): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+7 more)

### Community 92 - "blocker-followups.ts"
Cohesion: 0.18
Nodes (19): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), canFileGithubIssue(), readBackConversations(), handoff(), reconcileBlockerFollowups(), improvementIntakeGate() (+11 more)

### Community 93 - "extraction.ts"
Cohesion: 0.14
Nodes (11): ref_node_child_process, ref_node_string_decoder, Read, extractDocument, Extraction, Extractor, GIT_NETWORK, LIVE_PROVIDERS (+3 more)

### Community 94 - "recovery-ledger.ts"
Cohesion: 0.24
Nodes (10): savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), assignmentDiagnostics(), diagnosticContext(), diagnosticSnapshot(), nativeDeliveryResolved() (+2 more)

### Community 95 - "capture-session-clone.py"
Cohesion: 0.15
Nodes (10): ctypes, errno, importlib_util, json, os, pathlib, Copy a coherent macOS clone of inherited reader fd3 to anonymous target fd4. No…, Read-only protocol adapter for the installed review helper. No model dispatch. (+2 more)

### Community 96 - "useOfficePreferences.ts"
Cohesion: 0.26
Nodes (10): acceptPreferences(), PreferenceCandidate, strip(), UNKNOWN_PREFERENCES, OfficePreferencesController, PreferenceFeedback, PreferenceField, requestPreferences() (+2 more)

### Community 97 - "OfficeSnapshot"
Cohesion: 0.06
Nodes (55): knowledgeOutbox(), SendMessage, DAYS, dueLessonDecisions(), easternWeek(), LESSON_DIGEST, LessonDecision, PARTS (+47 more)

### Community 98 - ".save"
Cohesion: 0.17
Nodes (31): jiraCollection(), BLOCKED, findComment(), LiveIssue, readIssue(), readIssues(), Execute, jira() (+23 more)

### Community 99 - "create-candidate.ts"
Cohesion: 0.27
Nodes (6): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf()

### Community 100 - "price-table.ts"
Cohesion: 0.18
Nodes (9): CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL, Rates (+1 more)

### Community 101 - "codex-rollout.ts"
Cohesion: 0.29
Nodes (9): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO (+1 more)

### Community 102 - "time-readback.ts"
Cohesion: 0.36
Nodes (5): TimeLedger, Readback, READBACK_INTERVAL_MS, readBackTime(), SETTLE_MS

### Community 103 - "work-summary.ts"
Cohesion: 0.18
Nodes (19): compactSteps(), deliveryRepairProjection(), ACTIVE, maintenanceUpdate(), PMQueueItem, pmQueueItems(), deliveryChanges(), following (+11 more)

### Community 104 - "codex-rollout-file.ts"
Cohesion: 0.36
Nodes (7): codexHome(), createdAt(), dayDirs(), header(), ROLLOUT_MAX_BYTES, RolloutScan, scanCodexRollouts()

### Community 105 - "extract-worker.mjs"
Cohesion: 0.43
Nodes (6): ref_mammoth, ref_pdfjs_dist, bounded(), extract(), fail(), [path,kind]

### Community 106 - "owned-artifact.ts"
Cohesion: 0.57
Nodes (6): ghLogCacheEvidence(), done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf()

### Community 107 - "run-evidence.ts"
Cohesion: 0.38
Nodes (5): comparable(), EvidenceOutcome, recordRunEvidence(), backfillClaudeCost(), RunAccounting

### Community 108 - "delivery-ownership.ts"
Cohesion: 0.33
Nodes (5): ref_node_async_hooks, Ownership, ownershipContext, refreshDeliveryOwnership(), RefreshOwnership

### Community 109 - "it-agent.ts"
Cohesion: 0.47
Nodes (3): itAgent(), itDiagnostics(), Agent

### Community 110 - "codexAccounting"
Cohesion: 0.50
Nodes (5): readCodexRollout(), codexAccounting(), codexCost(), unpriced(), codexUsage()

### Community 111 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 112 - "salvage-worktree.ts"
Cohesion: 0.67
Nodes (3): Execute, SalvageRetry, salvageWorktree()

## Knowledge Gaps
- **486 isolated node(s):** `WRITER_STAGES`, `NOT_RETRYABLE`, `Execute`, `WriterRestart`, `NoticePolicy` (+481 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 625 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `ref_node_path`, `dependency-bots/adopt.ts`, `.transaction`, `recovery/stopped-base-update.ts`, `session-bridge.ts`, `agents.ts`, `features/workflow.ts`, `reader.ts`, `scheduled-captures.ts`, `run-retrospective.ts`, `record-trigger.ts`, `read-retries.ts`, `digest`, `features.ts`, `delivery-repairs.ts`, `enrollment-gate.ts`, `knowledge.ts`, `maintenance/maintenance.ts`, `cost-ledger.ts`, `currentAssignment`, `coordination.ts`, `jira-time.ts`, `assignment-context.ts`, `ref_zod`, `azure.ts`, `cec-reads.ts`, `scheduled-work.ts`, `scheduler.ts`, `requests.ts`, `accept-stage-result.ts`, `assignment-poll.ts`, `time-scope.ts`, `run-accounting.ts`, `ref_node_crypto`, `assignments.ts`, `.emit`, `SlackMessages`, `cec.ts`, `weekly-rollup.ts`, `shared.ts`, `control-store.ts`, `retrospective-subject.ts`, `run.ts`, `.getEffect`, `remove-candidate.ts`, `ticket-evidence.ts`, `cec/workflow.ts`, `offices.ts`, `admit-improvement.ts`, `daily-cto.ts`, `workKey`, `store.ts`, `lesson-selection.ts`, `evidence.ts`, `ledger.ts`, `it-specialist.ts`, `index.ts`, `easternDay`, `ticket-stage-runner.ts`, `blocker-followups.ts`, `recovery-ledger.ts`, `OfficeSnapshot`, `.save`, `create-candidate.ts`, `time-readback.ts`, `run-evidence.ts`, `it-agent.ts`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **Why does `command()` connect `Store` to `ref_node_path`, `dependency-bots/adopt.ts`, `session-bridge.ts`, `agents.ts`, `features/workflow.ts`, `reader.ts`, `delivery-repairs.ts`, `enrollment-gate.ts`, `maintenance/maintenance.ts`, `cost-ledger.ts`, `currentAssignment`, `coordination.ts`, `jira-time.ts`, `assignment-context.ts`, `azure.ts`, `requests.ts`, `accept-stage-result.ts`, `assignment-poll.ts`, `executeRequest`, `Engine`, `ref_node_crypto`, `shared.ts`, `.getEffect`, `remove-candidate.ts`, `ticket-evidence.ts`, `contract.ts`, `service-health.ts`, `store.ts`, `easternDay`, `ticket-stage-runner.ts`, `extraction.ts`, `.save`, `create-candidate.ts`, `time-readback.ts`, `command-registry.ts`, `salvage-worktree.ts`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `Role` connect `Role` to `Inspector.tsx`, `agents.ts`, `local-config.ts`, `App.tsx`, `maintenance/maintenance.ts`, `assignment-context.ts`, `ref_zod`, `Conversation.tsx`, `cec-reads.ts`, `scheduler.ts`, `accept-stage-result.ts`, `run-accounting.ts`, `OfficeScene.tsx`, `.emit`, `scene-motion.ts`, `cec.ts`, `work.ts`, `shared.ts`, `retrospective-subject.ts`, `store.ts`, `outbox.ts`, `index.ts`, `recovery-ledger.ts`, `OfficeSnapshot`, `it-agent.ts`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **What connects `WRITER_STAGES`, `NOT_RETRYABLE`, `Execute` to the rest of the system?**
  _486 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `index.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1278825995807128 - nodes in this community are weakly interconnected._
- **Should `ref_node_path` be split into smaller, more focused modules?**
  _Cohesion score 0.057871692366266894 - nodes in this community are weakly interconnected._
- **Should `dependency-bots/adopt.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07530864197530865 - nodes in this community are weakly interconnected._