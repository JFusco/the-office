# Graph Report - the-office  (2026-11-16)

## Corpus Check
- 835 files · ~329,841 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4082 nodes · 18781 edges · 116 communities (112 shown, 4 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 608 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d44e6b3c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- index.tsx
- ref_node_path
- dependency-bots/adopt.ts
- offices.ts
- Inspector.tsx
- discovery-recovery.ts
- session-bridge.ts
- Button
- agents.ts
- Store
- worker-runtime.ts
- shared.ts
- App.tsx
- config.ts
- assignments.ts
- .transaction
- run-retrospective.ts
- record-trigger.ts
- read-retries.ts
- requests.ts
- features/commands.ts
- TicketJob
- PeoplePanel.tsx
- dependencies.ts
- knowledge.ts
- maintenance/maintenance.ts
- cost-ledger.ts
- artifact
- coordination.ts
- jira-time.ts
- digest
- useOfficePreferences.ts
- sanitize
- Conversation.tsx
- security.ts
- cec-reads.ts
- scheduled-work.ts
- Role
- closeout-recovery.ts
- ref_zod
- assignment-poll.ts
- time-scope.ts
- node-visuals.ts
- run-accounting.ts
- intent.ts
- Coordinator
- OfficeScene.tsx
- engine.ts
- pilot-delivery.ts
- demand-facts.ts
- .emit
- scene-motion.ts
- delivery-repairs.ts
- Ticket
- work.ts
- weekly-rollup.ts
- github-delivery.ts
- TimeBook.tsx
- RoomCamera.tsx
- control-store.ts
- retrospective-subject.ts
- ledger.ts
- Effects
- coordination-tick.ts
- ticket-evidence.ts
- harness-baseline.ts
- FeatureWorkspace.tsx
- ControlStore
- continue-ownership-read.ts
- cec/workflow.ts
- constellation-runtime.ts
- contract.ts
- Offices
- report.ts
- service-health.ts
- admit-improvement.ts
- daily-cto.ts
- deferredPickup
- FeatureError
- telemetry.ts
- cli.ts
- lesson-selection.ts
- continue-unsealed-qa.ts
- office-lessons.ts
- outbox.ts
- goal-evidence.ts
- it-specialist.ts
- index.ts
- packed-consumer-pnpm.ts
- ScheduledWork
- ticket-stage-runner.ts
- fact-bounds.ts
- blocker-followups.ts
- install-service.mjs
- .ticket
- capture-session-clone.py
- QAResultsCard.tsx
- OfficeSnapshot
- .save
- create-candidate.ts
- retire-history.ts
- codex-rollout.ts
- time-readback.ts
- delivery-task.ts
- codex-rollout-file.ts
- extract-worker.mjs
- owned-artifact.ts
- run-evidence.ts
- delivery-ownership.ts
- agent-activity.ts
- resume-reconciliation.ts
- CommandRegistry
- restart-writer.ts
- CommittedBrain
- run-usage.ts
- handover-cms.ts

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
- `apply()` --indirect_call--> `note()`  [INFERRED]
  src/conversations/OutboxSavedImplementation.tsx → server/cec/parking/resume-parked.ts
- `StageContext` --references--> `Role`  [EXTRACTED]
  server/delivery/pipeline/accept-stage-result.ts → src/shared.ts
- `MaintenanceSubjectFacts` --references--> `Role`  [EXTRACTED]
  server/knowledge/maintenance-subject.ts → src/shared.ts
- `DeliverySlot` --references--> `Role`  [EXTRACTED]
  server/office/projects.ts → src/shared.ts
- `localBindings` --references--> `OfficeProject`  [EXTRACTED]
  server/office/local-config.ts → src/shared.ts

## Import Cycles
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/review-wait.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/parking/resume-provider-review.ts -> server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/parking/resume-provider-review.ts`
- 3-file cycle: `server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts`
- 4-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/readiness/review-wait.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 4-file cycle: `server/delivery/recovery/stopped-base-review.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/stopped-base-review.ts`
- 4-file cycle: `server/delivery/recovery/implementation/activation-recovery.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/implementation/activation-recovery.ts`
- 4-file cycle: `server/delivery/recovery/implementation/saved-prerequisite-handoff.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/implementation/saved-prerequisite-handoff.ts`
- 4-file cycle: `server/delivery/recovery/validation/validation-readback.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/validation/validation-readback.ts`
- 4-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 4-file cycle: `server/features/delivery-binding.ts -> server/features/enrollment-gate.ts -> server/features/progression/failure.ts -> server/store/effects.ts -> server/features/delivery-binding.ts`
- 5-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/stage-reconciliation.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 5-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 5-file cycle: `server/delivery/recovery/implementation/continuation-evidence.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/recovery/implementation/continuation-evidence.ts`
- 5-file cycle: `server/delivery/recovery/implementation/saved-prerequisite-handoff.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/recovery/implementation/saved-prerequisite-handoff.ts`
- 5-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/scope-repair/scope-repair-resume.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 5-file cycle: `server/delivery/recovery/scope-repair/scope-repair-readback.ts -> server/delivery/recovery/scope-repair/scope-repair-resume.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/scope-repair/scope-repair-readback.ts`
- 5-file cycle: `server/delivery/recovery/implementation/continuation-evidence.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/implementation/implementation-recovery.ts -> server/delivery/recovery/implementation/continuation-evidence.ts`
- 5-file cycle: `server/delivery/recovery/implementation/continuation-evidence.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/stopped-base-review.ts -> server/delivery/recovery/implementation/continuation-evidence.ts`

## Communities (116 total, 4 thin omitted)

### Community 0 - "index.tsx"
Cohesion: 0.15
Nodes (33): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS, PickupForm(), ProjectForms() (+25 more)

### Community 1 - "ref_node_path"
Cohesion: 0.08
Nodes (52): ref_node_fs, ref_node_os, ref_node_path, ref_node_util, verifyContinuationPreservation(), adoptCandidate(), reported, Scope (+44 more)

### Community 2 - "dependency-bots/adopt.ts"
Cohesion: 0.05
Nodes (86): initialManualStart(), Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard (+78 more)

### Community 3 - "offices.ts"
Cohesion: 0.07
Nodes (28): featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), reserveReplacement(), stageBudget(), wakeFeature(), assertQuestionVisibility(), pendingQuestions() (+20 more)

### Community 4 - "Inspector.tsx"
Cohesion: 0.10
Nodes (68): Outbox(), blockedSummary(), ServiceHealthPanel(), followUp(), labels, ServiceHealthRow(), BlockerFollowups(), LearningCoverage() (+60 more)

### Community 5 - "discovery-recovery.ts"
Cohesion: 0.09
Nodes (32): writerRestartPending(), DeliveryAuthorityInput, accounting, DeliverySubject, nonDelivery, originalReads, Assessment, Ownership (+24 more)

### Community 6 - "session-bridge.ts"
Cohesion: 0.06
Nodes (53): ref_node_perf_hooks, ref_ws, claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexDaemonProcesses(), accountCodexProcesses() (+45 more)

### Community 7 - "Button"
Cohesion: 0.06
Nodes (68): ref_react, ref_react_markdown, ref_remark_gfm, ref_yaml, KnowledgeActivity, KnowledgeActivityPage, KnowledgeEdge, KnowledgeMap (+60 more)

### Community 8 - "agents.ts"
Cohesion: 0.08
Nodes (30): cecReconcilePrompt(), cecChatPrompt(), ctoChatPrompt(), slackSendPrompt(), slackVerifyPrompt(), HANDS_OFF_RESOLUTION_GUIDANCE, RESOLUTION_GUIDANCE, PICKUP_CHAT (+22 more)

### Community 9 - "Store"
Cohesion: 0.05
Nodes (44): ref_node_crypto, CommentPage, commentReadback(), Assignment, Content, jiraText(), Transition, JiraOperations (+36 more)

### Community 10 - "worker-runtime.ts"
Cohesion: 0.08
Nodes (35): candidateWorkspaceEnvironment(), assignmentDiagnostics(), diagnosticContext(), assignmentSubject(), assertBriefingScope(), LOCAL_BINDINGS, contextPacket(), CODEX_DEFAULT_EFFORT (+27 more)

### Community 11 - "shared.ts"
Cohesion: 0.07
Nodes (27): ctoInputIdentityMatches(), ctoInputRecovered(), Admission, OfficeQAReport, QAPlanContinuation, QAPlanRetry, QAPlanRetryProof, QAPlanRetryRequest (+19 more)

### Community 12 - "App.tsx"
Cohesion: 0.05
Nodes (61): ref_lucide_react, ref_motion, ref_react_dom, BrainDrawer(), LessonsView(), themeColor, App(), BrainWorkspace (+53 more)

### Community 13 - "config.ts"
Cohesion: 0.06
Nodes (93): ref_node_url, approveFeature(), featureById(), discoveryPrompt(), planPrompt(), artifactPath(), digest(), document() (+85 more)

### Community 14 - "assignments.ts"
Cohesion: 0.09
Nodes (36): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, GraphNode (+28 more)

### Community 15 - ".transaction"
Cohesion: 0.13
Nodes (48): createFeature(), featureEffectGate(), assertEnrollable(), assertFeatureGate(), bindFeature(), enrolled(), assessmentSignal(), AssessmentSignals (+40 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.10
Nodes (34): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, brainOverlap, brainOverlapQuery(), clip(), fits() (+26 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.09
Nodes (47): BLOCKING, blockingTrigger, isBlocking(), baselineLearning(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences() (+39 more)

### Community 18 - "read-retries.ts"
Cohesion: 0.46
Nodes (6): PrerequisitesSchema, classifyStop(), incompleteReadOutput(), IntakeResult, planReadRetry(), temporaryReadFailure()

### Community 19 - "requests.ts"
Cohesion: 0.07
Nodes (61): boardPreflightCandidate(), Ownership, reconcileBoardPreflight(), partialLocalCleanupCandidate(), completedPRReviews(), assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate() (+53 more)

### Community 20 - "features/commands.ts"
Cohesion: 0.11
Nodes (30): commandFeature(), mutation(), reviewQuestions(), Link, linkFeature(), applyHarnessAction(), HarnessActionInput, recoveryPreconditions() (+22 more)

### Community 21 - "TicketJob"
Cohesion: 0.06
Nodes (61): writerRestartInstruction(), removeAdoptedClone(), deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), requireDeliveryAuthority(), deliveryIntakeBlocker(), gateRegisteredDelivery() (+53 more)

### Community 22 - "PeoplePanel.tsx"
Cohesion: 0.09
Nodes (42): label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+34 more)

### Community 23 - "dependencies.ts"
Cohesion: 0.19
Nodes (19): MergeNotifications, admit(), IntakeContext, WAIT_STATUSES, compatible(), dependencyCompletionKey(), dependencyEligibility(), DependencyStores (+11 more)

### Community 24 - "knowledge.ts"
Cohesion: 0.07
Nodes (34): curateLesson(), Curation, CurationAction, mergeEvidence(), lessonBrainAudit, LessonBrainOverlap, Kind, RetrospectiveResult (+26 more)

### Community 25 - "maintenance/maintenance.ts"
Cohesion: 0.11
Nodes (23): ApproachSchema, maintenancePolicies(), BrainMaintenance, candidateOwner(), SETTLED, skipOwnedCandidate(), Skipped, skippedCandidateLedger() (+15 more)

### Community 26 - "cost-ledger.ts"
Cohesion: 0.16
Nodes (26): captureCost(), server_telemetry_cost_entries_costcoveragesummary, costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId() (+18 more)

### Community 27 - "artifact"
Cohesion: 0.06
Nodes (118): interruptedImplementation(), containedFile(), acceptStageResult(), METADATA_FINDING, mergeAuthorized(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration() (+110 more)

### Community 28 - "coordination.ts"
Cohesion: 0.13
Nodes (21): completeNativeCheckpoint(), BRAIN_DEPENDENCY_MERGES, BrainResult, capped(), queueMaintenanceNotice(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance() (+13 more)

### Community 29 - "jira-time.ts"
Cohesion: 0.14
Nodes (21): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+13 more)

### Community 30 - "digest"
Cohesion: 0.07
Nodes (69): harnessCloseout(), PASSING, verifyMergeActions(), activeEffectId(), retryRead(), runHarnessStage(), harnessStageResult(), receipt() (+61 more)

### Community 31 - "useOfficePreferences.ts"
Cohesion: 0.13
Nodes (17): fields, PreferencesPatch, PreferencesStore, StoredBody, acceptPreferences(), PreferenceCandidate, PreferenceState, strip() (+9 more)

### Community 32 - "sanitize"
Cohesion: 0.09
Nodes (31): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+23 more)

### Community 33 - "Conversation.tsx"
Cohesion: 0.17
Nodes (20): Conversation(), LessonDecisionAction, lessonDecisionState(), readLessonDecision(), OutboxLessonDecision(), act(), readStatus(), OutboxLessonDigest() (+12 more)

### Community 34 - "security.ts"
Cohesion: 0.14
Nodes (23): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+15 more)

### Community 35 - "cec-reads.ts"
Cohesion: 0.15
Nodes (18): IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), intakeMembership(), projectListScope(), cecIntakePrompt(), cecReadbackPrompt() (+10 more)

### Community 36 - "scheduled-work.ts"
Cohesion: 0.10
Nodes (37): freshOwnershipRead(), deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), withAmendmentOwnership(), metadataRequestResolved(), preparationRequestResolved(), gateFeatureWork() (+29 more)

### Community 37 - "Role"
Cohesion: 0.15
Nodes (18): ROLES, DeliverySlot, officeCapacity, fifo(), selectWork(), admitsWork(), canDispatch(), deliveryOccupied() (+10 more)

### Community 38 - "closeout-recovery.ts"
Cohesion: 0.12
Nodes (40): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+32 more)

### Community 39 - "ref_zod"
Cohesion: 0.14
Nodes (18): ref_zod, BrainStatusSchema, identity, brainCheckpointCompletion(), coverageSchema, followupSchema, verified, reconcileCompletedCheckpoints() (+10 more)

### Community 40 - "assignment-poll.ts"
Cohesion: 0.13
Nodes (22): ChannelSettings, notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR, plainSlackText(), section() (+14 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.14
Nodes (29): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), server_telemetry_billable_work_issue_key, isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence() (+21 more)

### Community 42 - "node-visuals.ts"
Cohesion: 0.20
Nodes (13): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+5 more)

### Community 43 - "run-accounting.ts"
Cohesion: 0.18
Nodes (18): readCodexRollout(), HELPER_STDOUT_MAX_BYTES, helperAccounting(), claudeAccounting(), codexAccounting(), COMPLETION_MAX_BYTES, completionAccounting(), merge() (+10 more)

### Community 44 - "intent.ts"
Cohesion: 0.16
Nodes (21): GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles(), ContinuationIO (+13 more)

### Community 45 - "Coordinator"
Cohesion: 0.08
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 46 - "OfficeScene.tsx"
Cohesion: 0.18
Nodes (31): Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk(), ElevatorStage() (+23 more)

### Community 47 - "engine.ts"
Cohesion: 0.07
Nodes (14): correlatedBuild(), checkMail(), drainMail(), requestMail(), enableNightly(), GitHubMonitor, drainMaintenance(), reconcileMaintenance() (+6 more)

### Community 48 - "pilot-delivery.ts"
Cohesion: 0.14
Nodes (22): candidateBranchMoved(), continueImplementation(), assertOwnership(), dispatchNightly(), drainDelivery(), requestDelivery(), resume(), startPilot() (+14 more)

### Community 49 - "demand-facts.ts"
Cohesion: 0.13
Nodes (20): clip(), DEMAND_LIMIT, demandFacts(), DemandSection, key(), LessonKey, notes(), clip() (+12 more)

### Community 50 - ".emit"
Cohesion: 0.18
Nodes (20): decideImplementation(), requestQAPlanRetry(), configureChannelNotices(), configureNotices(), retryRecipientLookup(), recoverCTOInput(), DiscoveryResumeInput, enqueueMetadataRecovery() (+12 more)

### Community 51 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 52 - "delivery-repairs.ts"
Cohesion: 0.14
Nodes (20): Execute, installDependencies(), major(), namedRepairIds(), HarnessControl, withHarnessWork(), Check, harnessChecks() (+12 more)

### Community 53 - "Ticket"
Cohesion: 0.12
Nodes (25): implementationWorkerContext(), cecPrompt(), resolvedDecisionNote(), stageInstructions, reviewedPlanGuidance, reviewedPlanGuideDigest, qaPlanEvidenceGap(), qaRunDirectory() (+17 more)

### Community 54 - "work.ts"
Cohesion: 0.14
Nodes (17): BLOCKED_CAUSES, ProjectReadiness, AssignmentResult, BlockedCause, CompletionCondition, DeliveryAdmission, DependencyObservation, EligibilityState (+9 more)

### Community 55 - "weekly-rollup.ts"
Cohesion: 0.15
Nodes (24): learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), retire(), RollupResult, harperFolder() (+16 more)

### Community 56 - "github-delivery.ts"
Cohesion: 0.06
Nodes (88): findingsBlock(), handsOff(), BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction(), pinCourier, wikiSync (+80 more)

### Community 57 - "TimeBook.tsx"
Cohesion: 0.10
Nodes (38): TelemetryReport, AzureBuild, src_shared_liveanchor, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens() (+30 more)

### Community 58 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (10): ref_react_three_drei, ref_react_three_fiber, ref_three_stdlib, CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility (+2 more)

### Community 59 - "control-store.ts"
Cohesion: 0.16
Nodes (11): ref_node_sqlite, Clock, applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, statementCache(), initialSnapshot() (+3 more)

### Community 60 - "retrospective-subject.ts"
Cohesion: 0.14
Nodes (20): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+12 more)

### Community 61 - "ledger.ts"
Cohesion: 0.10
Nodes (34): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationCandidates(), investigationId(), ctoReplacementResolution(), investigationEvidence(), investigationFollowUps(), implementationReplacementResolution() (+26 more)

### Community 62 - "Effects"
Cohesion: 0.09
Nodes (25): plain(), channelNoticeAuthorized(), comparableSlackText(), SlackMessages, SlackRequestSchema, SlackResultSchema, SlackVerificationSchema, bindDiscoveryResume() (+17 more)

### Community 63 - "coordination-tick.ts"
Cohesion: 0.17
Nodes (10): reconcileNoticeConfirmations(), BrainFollowup, legacy, reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION, tick() (+2 more)

### Community 64 - "ticket-evidence.ts"
Cohesion: 0.13
Nodes (30): assetDownloader(), attachmentKind(), evidenceDirectory(), readEvidence(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS (+22 more)

### Community 65 - "harness-baseline.ts"
Cohesion: 0.15
Nodes (20): baselineReport, BaselineSource, baselineText(), millions(), row(), share(), add(), BaselineState (+12 more)

### Community 66 - "FeatureWorkspace.tsx"
Cohesion: 0.11
Nodes (28): FeatureQuestionProjection, OutboxQuestionRound(), send(), FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases (+20 more)

### Community 67 - "ControlStore"
Cohesion: 0.16
Nodes (7): DailyCTO, reviewWeekday(), Briefing, saveReviewBriefing(), ControlStore, OfficeKnowledge, DailyCTOReport

### Community 68 - "continue-ownership-read.ts"
Cohesion: 0.28
Nodes (12): continueOwnershipRead(), expiredOwnershipRead(), ownershipReadGate(), ownershipReadState(), ownershipReadHistory(), ownershipReadSource(), readOwnershipCandidate, ReadOwnershipView (+4 more)

### Community 69 - "cec/workflow.ts"
Cohesion: 0.33
Nodes (6): applyIntakeObservation(), MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), ingest(), nextStage()

### Community 70 - "constellation-runtime.ts"
Cohesion: 0.10
Nodes (22): ref_3d_force_graph, ref_three, CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point (+14 more)

### Community 71 - "contract.ts"
Cohesion: 0.15
Nodes (16): Event, one(), prePushRejection(), PushIdentity, settledPushBoundary(), At, errno, GroupInventory (+8 more)

### Community 73 - "report.ts"
Cohesion: 0.24
Nodes (14): telemetryRoute(), Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked() (+6 more)

### Community 74 - "service-health.ts"
Cohesion: 0.18
Nodes (10): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, slackHealth() (+2 more)

### Community 75 - "admit-improvement.ts"
Cohesion: 0.20
Nodes (17): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+9 more)

### Community 76 - "daily-cto.ts"
Cohesion: 0.12
Nodes (20): EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), applyGoalReview(), DailyResultSchema, EvidenceRefSchema, FreshDailyResultSchema, GoalEvidenceRequestSchema (+12 more)

### Community 77 - "deferredPickup"
Cohesion: 0.22
Nodes (11): knowledgeOutbox(), DAYS, dueLessonDecisions(), easternWeek(), isLessonDecision(), LESSON_DIGEST, LessonDecision, PARTS (+3 more)

### Community 78 - "FeatureError"
Cohesion: 0.11
Nodes (13): JiraIssuePublisher, keyOf(), descriptionPreimage(), plain(), publicationDescription(), FeatureError, FeaturePublisher, PublicationReceipt (+5 more)

### Community 79 - "telemetry.ts"
Cohesion: 0.11
Nodes (24): CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL, Rates (+16 more)

### Community 80 - "cli.ts"
Cohesion: 0.17
Nodes (8): ref_node_stream, ref_node_timers, args, [cmd,...rawArgs], commands, key, projectIndex, PORT

### Community 81 - "lesson-selection.ts"
Cohesion: 0.09
Nodes (29): INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), LessonSelection, MAINTENANCE, MAX_LESSONS (+21 more)

### Community 82 - "continue-unsealed-qa.ts"
Cohesion: 0.23
Nodes (10): OwnershipRead, continueUnsealedQA(), entry(), handoffOwnership(), ReadbackOwnerDecision, Decision, OfficeQAHandoff, OfficeQAHandoffInput (+2 more)

### Community 83 - "office-lessons.ts"
Cohesion: 0.29
Nodes (10): normalizeStatement(), decideOfficeProposal(), now(), OfficeKnowledgeStore, proposeOfficeLessons(), retireOfficeLesson(), Input, promoteNoteLesson() (+2 more)

### Community 84 - "outbox.ts"
Cohesion: 0.16
Nodes (18): ADOPTION_STALLED_MS, projectOutbox(), syncOutbox(), projectSlackDeliveries(), settleRequestedSlackReplacement(), Input, supersedeSlackDelivery(), replacementContext() (+10 more)

### Community 85 - "goal-evidence.ts"
Cohesion: 0.29
Nodes (10): githubPRDescription(), azureGoalFacts(), azurePRDescription(), boundedEvidence(), collectAzureGoalDocuments(), EvidenceStore, GOAL_EVIDENCE_LIMITS, projectPRFacts() (+2 more)

### Community 86 - "it-specialist.ts"
Cohesion: 0.16
Nodes (19): partialLocalCleanupKey(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), ITContext, diagnosticSnapshot(), publishITReport() (+11 more)

### Community 87 - "index.ts"
Cohesion: 0.06
Nodes (48): ref_hono_node_server, ref_node_http, ref_vite, implementationContinuationRoute(), closedReadonlyPlan(), Document, entryExists(), inspectClosedQAPlan() (+40 more)

### Community 89 - "ScheduledWork"
Cohesion: 0.33
Nodes (3): ScheduledWork, Scheduler, QueueTiming

### Community 90 - "ticket-stage-runner.ts"
Cohesion: 0.18
Nodes (25): parksInJira(), run(), verifiedTransition(), publicationEvidenceGap(), qaEvidenceGap(), resultGate(), stageResultGap(), DECISION_KINDS (+17 more)

### Community 91 - "fact-bounds.ts"
Cohesion: 0.19
Nodes (18): leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance() (+10 more)

### Community 92 - "blocker-followups.ts"
Cohesion: 0.18
Nodes (19): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), canFileGithubIssue(), readBackConversations(), handoff(), reconcileBlockerFollowups() (+11 more)

### Community 93 - "install-service.mjs"
Cohesion: 0.10
Nodes (15): ref_node_child_process, ref_node_string_decoder, file, folder, logs, root, Read, extractDocument (+7 more)

### Community 94 - ".ticket"
Cohesion: 0.24
Nodes (7): Document, isAccessOnlyPlan(), settledAccessOnlyState(), continueAccessOnlyPlan(), entryExists(), itChatPrompt(), send()

### Community 95 - "capture-session-clone.py"
Cohesion: 0.15
Nodes (10): ctypes, errno, importlib_util, json, os, pathlib, Copy a coherent macOS clone of inherited reader fd3 to anonymous target fd4. No…, Read-only protocol adapter for the installed review helper. No model dispatch. (+2 more)

### Community 96 - "QAResultsCard.tsx"
Cohesion: 0.40
Nodes (7): qaResultChanges(), QA_STAGES, qaResults(), qaStatus(), artifact(), QAResultsCard(), Report()

### Community 97 - "OfficeSnapshot"
Cohesion: 0.07
Nodes (42): SendMessage, ctoInputFailure(), OutboxCTOInput(), recover(), OutboxMaintenanceStatus(), OutboxSavedImplementation(), apply(), review() (+34 more)

### Community 98 - ".save"
Cohesion: 0.17
Nodes (31): unpack(), jiraCollection(), BLOCKED, findComment(), LiveIssue, readIssue(), readIssues(), Execute (+23 more)

### Community 99 - "create-candidate.ts"
Cohesion: 0.48
Nodes (6): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf()

### Community 100 - "retire-history.ts"
Cohesion: 0.33
Nodes (7): readHistoryScope(), historicalRecordDigest(), Intent, records(), retireIncompleteHistory(), HistoryRetirement, HistoryRetirementIntent

### Community 101 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 102 - "time-readback.ts"
Cohesion: 0.36
Nodes (5): TimeLedger, Readback, READBACK_INTERVAL_MS, readBackTime(), SETTLE_MS

### Community 103 - "delivery-task.ts"
Cohesion: 0.31
Nodes (7): APPROACH_GUIDANCE, reviewInstructions(), deliveryTask(), DeliveryTaskInput, DISCOVERY_GUIDANCE, compactSteps(), featureDeliveryContext()

### Community 104 - "codex-rollout-file.ts"
Cohesion: 0.36
Nodes (7): codexHome(), createdAt(), dayDirs(), header(), ROLLOUT_MAX_BYTES, RolloutScan, scanCodexRollouts()

### Community 105 - "extract-worker.mjs"
Cohesion: 0.43
Nodes (6): ref_mammoth, ref_pdfjs_dist, bounded(), extract(), fail(), [path,kind]

### Community 106 - "owned-artifact.ts"
Cohesion: 0.42
Nodes (7): BoundedRead, done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf(), CompletionReader

### Community 107 - "run-evidence.ts"
Cohesion: 0.38
Nodes (5): comparable(), EvidenceOutcome, recordRunEvidence(), backfillClaudeCost(), RunAccounting

### Community 108 - "delivery-ownership.ts"
Cohesion: 0.33
Nodes (5): ref_node_async_hooks, Ownership, ownershipContext, refreshDeliveryOwnership(), RefreshOwnership

### Community 109 - "agent-activity.ts"
Cohesion: 0.25
Nodes (9): itAgent(), itDiagnostics(), displayAgentTask(), withoutElapsed(), LiveAgentTask(), Props, RunningTask(), text() (+1 more)

### Community 110 - "resume-reconciliation.ts"
Cohesion: 0.39
Nodes (6): Attempt, needsResumeReconciliation(), stoppedInSetup(), ownReceipts(), Receipt, supersededReceipt()

### Community 112 - "restart-writer.ts"
Cohesion: 0.21
Nodes (12): ATTEMPT_DELAYS_MS, nextAttemptAt(), restartStoppedWriters(), unchangedSinceAccepted(), NOT_RETRYABLE, WRITER_STAGES, writerRestartCandidate, writerRestarted() (+4 more)

### Community 114 - "run-usage.ts"
Cohesion: 0.38
Nodes (5): CodexRollout, claudeCrashZero(), claudeUsage(), count(), RunUsage

### Community 115 - "handover-cms.ts"
Cohesion: 0.40
Nodes (4): ref_smol_toml, file, project, root

## Knowledge Gaps
- **488 isolated node(s):** `SETUP_STOP_CAP`, `Attempt`, `Receipt`, `NoticePolicy`, `NoticeEntry` (+483 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 627 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `ref_node_path`, `dependency-bots/adopt.ts`, `offices.ts`, `discovery-recovery.ts`, `session-bridge.ts`, `agents.ts`, `worker-runtime.ts`, `config.ts`, `assignments.ts`, `.transaction`, `run-retrospective.ts`, `record-trigger.ts`, `read-retries.ts`, `requests.ts`, `features/commands.ts`, `TicketJob`, `dependencies.ts`, `maintenance/maintenance.ts`, `cost-ledger.ts`, `artifact`, `coordination.ts`, `jira-time.ts`, `digest`, `sanitize`, `security.ts`, `cec-reads.ts`, `scheduled-work.ts`, `Role`, `closeout-recovery.ts`, `ref_zod`, `assignment-poll.ts`, `time-scope.ts`, `run-accounting.ts`, `intent.ts`, `engine.ts`, `pilot-delivery.ts`, `demand-facts.ts`, `.emit`, `delivery-repairs.ts`, `Ticket`, `weekly-rollup.ts`, `github-delivery.ts`, `control-store.ts`, `retrospective-subject.ts`, `ledger.ts`, `Effects`, `coordination-tick.ts`, `ticket-evidence.ts`, `continue-ownership-read.ts`, `report.ts`, `admit-improvement.ts`, `daily-cto.ts`, `lesson-selection.ts`, `continue-unsealed-qa.ts`, `office-lessons.ts`, `outbox.ts`, `goal-evidence.ts`, `it-specialist.ts`, `index.ts`, `ScheduledWork`, `fact-bounds.ts`, `blocker-followups.ts`, `.ticket`, `OfficeSnapshot`, `.save`, `create-candidate.ts`, `retire-history.ts`, `time-readback.ts`, `delivery-task.ts`, `owned-artifact.ts`, `run-evidence.ts`, `agent-activity.ts`, `restart-writer.ts`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **Why does `command()` connect `Store` to `dependency-bots/adopt.ts`, `session-bridge.ts`, `agents.ts`, `worker-runtime.ts`, `config.ts`, `assignments.ts`, `requests.ts`, `TicketJob`, `dependencies.ts`, `maintenance/maintenance.ts`, `cost-ledger.ts`, `artifact`, `coordination.ts`, `jira-time.ts`, `digest`, `security.ts`, `closeout-recovery.ts`, `assignment-poll.ts`, `intent.ts`, `engine.ts`, `delivery-repairs.ts`, `weekly-rollup.ts`, `github-delivery.ts`, `ticket-evidence.ts`, `continue-ownership-read.ts`, `contract.ts`, `service-health.ts`, `continue-unsealed-qa.ts`, `install-service.mjs`, `.save`, `create-candidate.ts`, `time-readback.ts`, `CommandRegistry`, `restart-writer.ts`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `Role` connect `Role` to `Inspector.tsx`, `agents.ts`, `Store`, `worker-runtime.ts`, `shared.ts`, `App.tsx`, `PeoplePanel.tsx`, `maintenance/maintenance.ts`, `artifact`, `digest`, `sanitize`, `Conversation.tsx`, `cec-reads.ts`, `run-accounting.ts`, `OfficeScene.tsx`, `.emit`, `scene-motion.ts`, `delivery-repairs.ts`, `Ticket`, `work.ts`, `github-delivery.ts`, `retrospective-subject.ts`, `deferredPickup`, `outbox.ts`, `index.ts`, `ticket-stage-runner.ts`, `OfficeSnapshot`, `agent-activity.ts`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **What connects `SETUP_STOP_CAP`, `Attempt`, `Receipt` to the rest of the system?**
  _488 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ref_node_path` be split into smaller, more focused modules?**
  _Cohesion score 0.07816455696202532 - nodes in this community are weakly interconnected._
- **Should `dependency-bots/adopt.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.051515151515151514 - nodes in this community are weakly interconnected._
- **Should `offices.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0653061224489796 - nodes in this community are weakly interconnected._