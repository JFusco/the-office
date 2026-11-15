# Graph Report - office-failed-qa-plan-continuation-nov15  (2026-11-14)

## Corpus Check
- 804 files · ~328,632 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4041 nodes · 18847 edges · 108 communities (100 shown, 8 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 613 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `93428a09`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ref_node_path
- accept-stage-result.ts
- features/workflow.ts
- implementation-recovery.ts
- publish-pr.ts
- metadata-assessment.ts
- run-accounting.ts
- index.tsx
- agents.ts
- .transaction
- Inspector.tsx
- session-bridge.ts
- Button
- digest
- config.ts
- dependencies.ts
- Engine
- shared.ts
- github-context.ts
- App.tsx
- OfficeSnapshot
- record-trigger.ts
- closeout-recovery.ts
- scheduled-captures.ts
- PeoplePanel.tsx
- TimeBook.tsx
- ref_zod
- GitHubDelivery
- lesson-selection.ts
- interrupted-work-recovery.ts
- worker-runtime.ts
- maintenance/maintenance.ts
- ticket-evidence.ts
- intent.ts
- currentAssignment
- run-retrospective.ts
- time-scope.ts
- daily-cto.ts
- effects.ts
- .emit
- .save
- outbox.ts
- dependency-bots/adopt.ts
- cost-ledger.ts
- source-amendment.ts
- demand-facts.ts
- knowledge.ts
- .activeClaims
- remove-candidate.ts
- process.ts
- OfficeScene.tsx
- assignment-poll.ts
- ref_node_crypto
- features.ts
- scope-repair-resume.ts
- scheduled-work.ts
- assignments.ts
- retrospective-subject.ts
- store.ts
- Store
- CEC
- delivery-repairs.ts
- work.ts
- FeatureWorkspace.tsx
- cec/issue-publication.ts
- constellation-runtime.ts
- learning-events.ts
- cec/workflow.ts
- engine.ts
- artifact
- accept-retrospective.ts
- Coordinator
- adopted-review-candidate.ts
- Effects
- refresh-evidence.ts
- validate-stage.ts
- CommittedBrain
- preparation-readback.ts
- knowledge-views.ts
- office-lessons.ts
- node-visuals.ts
- it-specialist.ts
- preferences-store.ts
- coordination.ts
- useOfficePreferences.ts
- time-readback.ts
- scene-motion.ts
- recordedPush
- report.ts
- provider-observation.ts
- jira-time.ts
- capture-session-clone.py
- RoomCamera.tsx
- weekly-rollup.ts
- ITFollowUps.tsx
- retire-unstarted-delivery.ts
- command-registry.ts
- inspect-closed-plan.ts
- extract-worker.mjs
- continue-access-only-plan.ts
- github-delivery.ts
- highestStableAtLeast
- server_delivery_harness_delivery_authority_resolvedeliverywork
- server_features_questions_pending_round_pendinground
- server_features_questions_pending_round_pendingrounds
- server_features_questions_pending_round_roundauthor
- src_shared_personas
- src_shared_workkey

## God Nodes (most connected - your core abstractions)
1. `Store` - 359 edges
2. `TicketJob` - 174 edges
3. `digest()` - 165 edges
4. `artifact()` - 129 edges
5. `GitHubDelivery` - 122 edges
6. `command()` - 112 edges
7. `workKey()` - 101 edges
8. `cx()` - 88 edges
9. `currentAssignment()` - 86 edges
10. `Button` - 84 edges

## Surprising Connections (you probably didn't know these)
- `apply()` --indirect_call--> `note()`  [INFERRED]
  src/conversations/OutboxSavedImplementation.tsx → server/cec/parking/resume-parked.ts
- `DeliveryAuthorityInput` --references--> `HarnessRequest`  [EXTRACTED]
  server/delivery/harness/delivery-authority.ts → src/contracts/work.ts
- `Admission` --references--> `AssignmentReview`  [EXTRACTED]
  server/delivery/intake/admission.ts → src/shared.ts
- `projectOutbox()` --calls--> `isSavedPlanFollowup()`  [EXTRACTED]
  server/conversations/outbox.ts → src/conversations/saved-plan-followup.ts
- `projectOutbox()` --calls--> `deferredPickup()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/pickup-state.ts

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

## Communities (108 total, 8 thin omitted)

### Community 0 - "ref_node_path"
Cohesion: 0.09
Nodes (54): ref_node_fs, ref_node_os, ref_node_path, ref_node_util, interruptedImplementation(), recoverCTOInput(), allowed, continuationNativeReview() (+46 more)

### Community 1 - "accept-stage-result.ts"
Cohesion: 0.08
Nodes (58): findingsBlock(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery(), DECISION_KINDS, needsDecision(), acceptStageResult() (+50 more)

### Community 2 - "features/workflow.ts"
Cohesion: 0.08
Nodes (56): approveFeature(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), discoveryPrompt(), planPrompt(), artifactPath() (+48 more)

### Community 3 - "implementation-recovery.ts"
Cohesion: 0.08
Nodes (42): containedFile(), reported, Scope, continuationScope(), Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate() (+34 more)

### Community 4 - "publish-pr.ts"
Cohesion: 0.11
Nodes (34): assertDeliveryMayMutate(), retryRead(), harnessStageResult(), receipt(), park(), draftReadHeadMatches(), harnessDraft(), assertDraftClaimHistory() (+26 more)

### Community 5 - "metadata-assessment.ts"
Cohesion: 0.15
Nodes (34): runHarnessStage(), assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema, savedMetadataAssessment(), validateSaved(), metadataClaim() (+26 more)

### Community 6 - "run-accounting.ts"
Cohesion: 0.06
Nodes (56): BoundedRead, add(), CodexRequest, CodexRollout, CodexTokens, FIELDS, codexHome(), createdAt() (+48 more)

### Community 7 - "index.tsx"
Cohesion: 0.11
Nodes (43): LessonsView(), SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS, PickupForm() (+35 more)

### Community 8 - "agents.ts"
Cohesion: 0.05
Nodes (53): ref_smol_toml, implementationWorkerContext(), IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), intakeMembership(), projectListScope() (+45 more)

### Community 9 - ".transaction"
Cohesion: 0.11
Nodes (28): featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS, reserveReplacement(), stageBudget() (+20 more)

### Community 10 - "Inspector.tsx"
Cohesion: 0.08
Nodes (76): FeatureWorkspace(), TicketPlanningAction(), blockedSummary(), ServiceHealthPanel(), followUp(), labels, ServiceHealthRow(), BlockerFollowups() (+68 more)

### Community 11 - "session-bridge.ts"
Cohesion: 0.06
Nodes (53): ref_node_perf_hooks, ref_ws, claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexDaemonProcesses(), accountCodexProcesses() (+45 more)

### Community 12 - "Button"
Cohesion: 0.10
Nodes (46): ref_react, ref_react_markdown, ref_remark_gfm, ref_yaml, Activity(), ActivityTimeline(), AssignmentKnowledge(), Lookup() (+38 more)

### Community 13 - "digest"
Cohesion: 0.07
Nodes (59): ctoInputRecovered(), pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), closeoutRequestResolved(), admitGreen156(), GREEN156, green156Admitted(), green156Subject() (+51 more)

### Community 14 - "config.ts"
Cohesion: 0.07
Nodes (55): ref_hono_node_server, ref_node_http, ref_vite, implementationPreview(), implementationContinuationRoute(), qaPlanRetryRoute(), AUTO_ADOPT_BOTS, assertFeaturePlanningConfig() (+47 more)

### Community 15 - "dependencies.ts"
Cohesion: 0.11
Nodes (32): MergeNotifications, reconcileNoticeConfirmations(), Admission, admit(), IntakeContext, WAIT_STATUSES, compatible(), dependencyCompletionKey() (+24 more)

### Community 16 - "Engine"
Cohesion: 0.08
Nodes (3): GitHubMonitor, Engine, GitHubBoard

### Community 17 - "shared.ts"
Cohesion: 0.09
Nodes (25): completedPRReviews(), eligible(), mergedByOwner(), ownerSettles(), retireExternalDeliveries(), settledExternalRepair(), PackedPublicationRepair, QAPlanContinuation (+17 more)

### Community 18 - "github-context.ts"
Cohesion: 0.12
Nodes (30): resumeProviderReviews(), reviewInstructions(), deliveryTask(), DeliveryTaskInput, observe(), DISCOVERY_GUIDANCE, compactSteps(), checksFailed() (+22 more)

### Community 19 - "App.tsx"
Cohesion: 0.05
Nodes (71): ref_lucide_react, ref_motion, ref_react_dom, itAgent(), itDiagnostics(), BrainDrawer(), themeColor, App() (+63 more)

### Community 20 - "OfficeSnapshot"
Cohesion: 0.09
Nodes (44): Conversation(), SendMessage, LessonDecisionAction, lessonDecisionState(), readLessonDecision(), Outbox(), ctoInputFailure(), OutboxCTOInput() (+36 more)

### Community 21 - "record-trigger.ts"
Cohesion: 0.09
Nodes (46): BLOCKING, blockingTrigger, isBlocking(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences(), busyMaintenanceIds() (+38 more)

### Community 22 - "closeout-recovery.ts"
Cohesion: 0.11
Nodes (43): assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint(), closeoutProviderEvidence() (+35 more)

### Community 23 - "scheduled-captures.ts"
Cohesion: 0.15
Nodes (44): createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest, captureRequests() (+36 more)

### Community 24 - "PeoplePanel.tsx"
Cohesion: 0.09
Nodes (44): label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+36 more)

### Community 25 - "TimeBook.tsx"
Cohesion: 0.09
Nodes (45): CostCompleteness, CostLedgerState, TelemetryReport, TelemetryRow, TelemetrySync, UsageCompleteness, UsageSource, ValuationSource (+37 more)

### Community 26 - "ref_zod"
Cohesion: 0.07
Nodes (41): ref_zod, assertConversationReadback(), Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+33 more)

### Community 27 - "GitHubDelivery"
Cohesion: 0.09
Nodes (36): accounting, DeliverySubject, nonDelivery, originalReads, HarnessControl, withHarnessWork(), GitHubDelivery, admitPacked165() (+28 more)

### Community 28 - "lesson-selection.ts"
Cohesion: 0.07
Nodes (34): ref_node_stream, ref_node_timers, args, [cmd,...rawArgs], commands, key, projectIndex, lessonIssueBody() (+26 more)

### Community 29 - "interrupted-work-recovery.ts"
Cohesion: 0.16
Nodes (11): channelNoticeAuthorized(), comparableSlackText(), SlackMessages, goalNoticeAuthorized(), goalNoticeNeverDispatched(), sendGoalNotice(), maintenanceNoticeAuthorized(), maintenanceNoticeNeverDispatched() (+3 more)

### Community 30 - "worker-runtime.ts"
Cohesion: 0.06
Nodes (40): candidateWorkspaceEnvironment(), ApproachSchema, assignmentSubject(), dispatchExposure(), prepareExposure(), lessonPurpose(), catalogLine(), assertBriefingScope() (+32 more)

### Community 31 - "maintenance/maintenance.ts"
Cohesion: 0.06
Nodes (47): maintenancePolicies(), captureMaintenanceStep(), completeNativeCheckpoint(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, BrainStatusSchema, identity (+39 more)

### Community 32 - "ticket-evidence.ts"
Cohesion: 0.06
Nodes (51): ref_node_string_decoder, Candidate, attachmentKind(), evidenceDirectory(), storeEvidence(), boundRetainedEvidence(), captureTicketEvidence(), INVESTIGATION_ATTEMPTS (+43 more)

### Community 33 - "intent.ts"
Cohesion: 0.08
Nodes (35): ref_node_child_process, ref_node_url, file, folder, logs, root, GitRead, nativeGitRead() (+27 more)

### Community 34 - "currentAssignment"
Cohesion: 0.11
Nodes (39): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+31 more)

### Community 35 - "run-retrospective.ts"
Cohesion: 0.11
Nodes (31): brainOverlap, brainOverlapQuery(), clip(), fits(), withBrainOverlap(), DemandSection, withDemand(), appendLearningFacts() (+23 more)

### Community 36 - "time-scope.ts"
Cohesion: 0.13
Nodes (31): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), server_telemetry_billable_work_issue_key, isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence() (+23 more)

### Community 37 - "daily-cto.ts"
Cohesion: 0.05
Nodes (45): collectCTOFacts(), DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), boundedIntake(), boundedJobs(), boundedMaintenance() (+37 more)

### Community 38 - "effects.ts"
Cohesion: 0.13
Nodes (13): featureById(), Link, linkFeature(), publishFeature(), reconcilePublication(), uncertainPublications(), reserveIdentity(), FeatureReviewRunner (+5 more)

### Community 39 - ".emit"
Cohesion: 0.16
Nodes (21): ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), configureNotices(), retryRecipientLookup(), enqueueGreen156(), enqueueMetadataRecovery() (+13 more)

### Community 40 - ".save"
Cohesion: 0.18
Nodes (28): jiraCollection(), BLOCKED, findComment(), LiveIssue, readIssue(), readIssues(), Execute, jira() (+20 more)

### Community 41 - "outbox.ts"
Cohesion: 0.13
Nodes (24): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), projectOutbox(), syncOutbox(), projectSlackDeliveries(), settleRequestedSlackReplacement() (+16 more)

### Community 42 - "dependency-bots/adopt.ts"
Cohesion: 0.09
Nodes (63): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard, projectCards() (+55 more)

### Community 43 - "cost-ledger.ts"
Cohesion: 0.16
Nodes (26): captureCost(), server_telemetry_cost_entries_costcoveragesummary, costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress() (+18 more)

### Community 44 - "source-amendment.ts"
Cohesion: 0.07
Nodes (66): ref_node_async_hooks, adoptCandidate(), approvedText(), assert(), AMENDMENT_REVIEW_PROOF, amendmentInstruction(), amendmentIssueSha256(), authorizeSourceAmendment() (+58 more)

### Community 45 - "demand-facts.ts"
Cohesion: 0.14
Nodes (21): clip(), DEMAND_LIMIT, demandFacts(), key(), LessonKey, notes(), clip(), MISSED_QUERY_LIMIT (+13 more)

### Community 46 - "knowledge.ts"
Cohesion: 0.09
Nodes (27): Kind, RetrospectiveResult, RetrospectiveResultSchema, RollupResultSchema, Stage, BlockerFollowup, ImprovementGrant, KnowledgeRetry (+19 more)

### Community 47 - ".activeClaims"
Cohesion: 0.14
Nodes (25): deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, requireDeliveryAuthority(), deliveryIntakeBlocker(), gateRegisteredDelivery(), resolveDeliveryWork() (+17 more)

### Community 48 - "remove-candidate.ts"
Cohesion: 0.15
Nodes (22): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot() (+14 more)

### Community 49 - "process.ts"
Cohesion: 0.12
Nodes (18): inactivityWatch(), At, errno, GroupInventory, GroupProbe, Phase, Pid, groupInventory() (+10 more)

### Community 50 - "OfficeScene.tsx"
Cohesion: 0.17
Nodes (33): Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk(), ElevatorStage() (+25 more)

### Community 51 - "assignment-poll.ts"
Cohesion: 0.12
Nodes (23): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), clamp(), LIMITS, MergedPR, plainSlackText(), section() (+15 more)

### Community 52 - "ref_node_crypto"
Cohesion: 0.18
Nodes (23): ref_node_crypto, commandFeature(), reviewQuestions(), assertQuestionVisibility(), applyHarnessAction(), HarnessActionInput, recoveryPreconditions(), recoveryTarget() (+15 more)

### Community 53 - "features.ts"
Cohesion: 0.14
Nodes (27): currentApproval(), featureGate(), predecessorComplete(), automaticIntakeWait(), deliveryPreflight, handoffBinding(), readHandoff(), sameBinding() (+19 more)

### Community 54 - "scope-repair-resume.ts"
Cohesion: 0.15
Nodes (26): Assessment, outsideScanSources(), Ownership, reconcileScopeRepairReadback(), requireThat(), sha, assertScopeRepairResumeFindings(), certain() (+18 more)

### Community 55 - "scheduled-work.ts"
Cohesion: 0.14
Nodes (24): deliverySlot(), metadataRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), requestPriority(), closedTicketRequest(), REOBSERVED, retiredFollowup() (+16 more)

### Community 56 - "assignments.ts"
Cohesion: 0.08
Nodes (32): knowledgeActivity(), knowledgeActivityPage(), committedNotePage(), BrainGraph, BrainNote, BrainReader, GraphNode, GraphPage (+24 more)

### Community 57 - "retrospective-subject.ts"
Cohesion: 0.19
Nodes (15): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+7 more)

### Community 58 - "store.ts"
Cohesion: 0.11
Nodes (21): ref_node_sqlite, assignmentDiagnostics(), diagnosticContext(), diagnosticSnapshot(), nativeDeliveryResolved(), Clock, DATA, applyConnectionSettings() (+13 more)

### Community 59 - "Store"
Cohesion: 0.07
Nodes (29): GitHubFeaturePublisher, JiraFeaturePublisher, QuestionNotifications, leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), seedOfficeLessons() (+21 more)

### Community 60 - "CEC"
Cohesion: 0.15
Nodes (21): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+13 more)

### Community 61 - "delivery-repairs.ts"
Cohesion: 0.16
Nodes (27): parksInJira(), run(), namedRepairIds(), afterDraft(), firstBuildStage(), missingApproachStage(), plannedNext(), recordApproach() (+19 more)

### Community 62 - "work.ts"
Cohesion: 0.11
Nodes (21): BLOCKED_CAUSES, blockedCauses(), projectReadiness(), ProjectReadiness, HistoryRetirement, HistoryRetirementIntent, AssignmentResult, BlockedCause (+13 more)

### Community 63 - "FeatureWorkspace.tsx"
Cohesion: 0.12
Nodes (26): FeatureQuestionProjection, OutboxQuestionRound(), send(), FeatureDelivery(), FeatureDocuments(), views, phases, LinkedFeatures() (+18 more)

### Community 64 - "cec/issue-publication.ts"
Cohesion: 0.05
Nodes (42): CommentPage, commentReadback(), Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), Transition (+34 more)

### Community 65 - "constellation-runtime.ts"
Cohesion: 0.10
Nodes (22): ref_3d_force_graph, ref_three, CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point (+14 more)

### Community 66 - "learning-events.ts"
Cohesion: 0.26
Nodes (11): improvementIntakeGate(), captureLearning(), learningDigest(), recordLearningOpportunity(), freezeLearningPacket(), citations(), recordAcceptedKnowledge(), stageName() (+3 more)

### Community 67 - "cec/workflow.ts"
Cohesion: 0.19
Nodes (15): applyIntakeObservation(), MISSING_SAVED_PLAN, recoverSavedPlan(), advance(), nextStage(), publicationEvidenceGap(), qaEvidenceGap(), resultGate() (+7 more)

### Community 68 - "engine.ts"
Cohesion: 0.16
Nodes (20): continueImplementation(), checkMail(), drainMail(), requestMail(), parkingUnconfirmed(), dispatchNightly(), drainDelivery(), enableNightly() (+12 more)

### Community 69 - "artifact"
Cohesion: 0.13
Nodes (45): verifiedCloseoutCleanupRequest(), continuationWorktree(), savedAdmissionUnresolved(), dependencyVersion(), handoffSavedPrerequisites(), hasSavedPrerequisiteResult(), Ownership, qualified() (+37 more)

### Community 70 - "accept-retrospective.ts"
Cohesion: 0.11
Nodes (30): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, admitImprovement(), improvementEligible(), curateLesson(), Curation (+22 more)

### Community 72 - "adopted-review-candidate.ts"
Cohesion: 0.20
Nodes (17): adoptedReviewCandidate(), ciCheckout(), finishCISetup(), verifyCIHooks(), CIFailure, guardCIRepair(), prepareCIMetadataRepair(), CI_METADATA_CONSUMED (+9 more)

### Community 73 - "Effects"
Cohesion: 0.24
Nodes (8): settleParking(), GitHubOperations, fileLessonIssue(), Assessment, closeNativeRefresh(), fingerprint(), Effects, EffectIntent

### Community 74 - "refresh-evidence.ts"
Cohesion: 0.31
Nodes (11): readEvidence(), ProviderEvidence, canonical(), evidenceDigest(), evidenceHash(), semantic(), stableUrl(), refreshFeatureEvidence() (+3 more)

### Community 75 - "validate-stage.ts"
Cohesion: 0.21
Nodes (14): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+6 more)

### Community 77 - "preparation-readback.ts"
Cohesion: 0.15
Nodes (20): bindPreparationBoardOrigins(), claimSchema, eventSchema, PreparationBoardOrigin, readPreparationBoardOrigins(), timestamp, updateSchema, readyOnlyReceiptHistory() (+12 more)

### Community 78 - "knowledge-views.ts"
Cohesion: 0.19
Nodes (17): KnowledgeActivity, KnowledgeEdge, KnowledgeMap, KnowledgeNode, connectionSummary(), ConstellationView, DisplayNode, displayScene() (+9 more)

### Community 79 - "office-lessons.ts"
Cohesion: 0.30
Nodes (10): normalizeStatement(), decideOfficeProposal(), mirrorOfficeKnowledge(), now(), OfficeKnowledgeStore, proposeOfficeLessons(), retireOfficeLesson(), Input (+2 more)

### Community 80 - "node-visuals.ts"
Cohesion: 0.20
Nodes (13): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+5 more)

### Community 81 - "it-specialist.ts"
Cohesion: 0.10
Nodes (19): ITContext, publishITReport(), delays, recoverAttempt(), listenerHealth(), projectById(), providers, ProviderStatusChecks (+11 more)

### Community 82 - "preferences-store.ts"
Cohesion: 0.19
Nodes (9): PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS, OfficePreferences (+1 more)

### Community 83 - "coordination.ts"
Cohesion: 0.23
Nodes (12): checkpointWindow(), dueAt(), hours, localDay(), ReviewResult, deferNonReady(), preparePR(), recheck() (+4 more)

### Community 84 - "useOfficePreferences.ts"
Cohesion: 0.26
Nodes (10): acceptPreferences(), PreferenceCandidate, strip(), UNKNOWN_PREFERENCES, OfficePreferencesController, PreferenceFeedback, PreferenceField, requestPreferences() (+2 more)

### Community 85 - "time-readback.ts"
Cohesion: 0.36
Nodes (5): TimeLedger, Readback, READBACK_INTERVAL_MS, readBackTime(), SETTLE_MS

### Community 86 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 87 - "recordedPush"
Cohesion: 0.31
Nodes (6): Event, one(), prePushRejection(), PushIdentity, recordedPush(), settledPushBoundary()

### Community 88 - "report.ts"
Cohesion: 0.25
Nodes (14): TimeLedgerState, Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked() (+6 more)

### Community 89 - "provider-observation.ts"
Cohesion: 0.47
Nodes (4): correlatedBuild(), observe(), observeParked(), parkedReadError

### Community 90 - "jira-time.ts"
Cohesion: 0.16
Nodes (18): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+10 more)

### Community 91 - "capture-session-clone.py"
Cohesion: 0.15
Nodes (10): ctypes, errno, importlib_util, json, os, pathlib, Copy a coherent macOS clone of inherited reader fd3 to anonymous target fd4. No…, Read-only protocol adapter for the installed review helper. No model dispatch. (+2 more)

### Community 92 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (10): ref_react_three_drei, ref_react_three_fiber, ref_three_stdlib, CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility (+2 more)

### Community 93 - "weekly-rollup.ts"
Cohesion: 0.14
Nodes (26): learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), RollupResult (+18 more)

### Community 94 - "ITFollowUps.tsx"
Cohesion: 0.67
Nodes (4): itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps()

### Community 95 - "retire-unstarted-delivery.ts"
Cohesion: 1.00
Nodes (3): retireInactiveDeliveries(), retireUnstartedDelivery(), unstartedDelivery()

### Community 98 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 101 - "inspect-closed-plan.ts"
Cohesion: 0.16
Nodes (15): cecPrompt(), resolvedDecisionNote(), stageInstructions, closedReadonlyPlan(), Document, entryExists(), inspectClosedQAPlan(), reviewedPlanGuidance (+7 more)

### Community 102 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (6): ref_mammoth, ref_pdfjs_dist, bounded(), extract(), fail(), [path,kind]

### Community 104 - "continue-access-only-plan.ts"
Cohesion: 0.57
Nodes (5): Document, isAccessOnlyPlan(), settledAccessOnlyState(), continueAccessOnlyPlan(), entryExists()

### Community 106 - "github-delivery.ts"
Cohesion: 0.08
Nodes (31): ProjectProgress, BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction(), dependabotReviewGuidance(), discover(), refreshDependencies() (+23 more)

### Community 107 - "highestStableAtLeast"
Cohesion: 0.83
Nodes (3): compare(), highestStableAtLeast(), parts()

## Knowledge Gaps
- **494 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+489 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 638 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `ref_node_path`, `accept-stage-result.ts`, `features/workflow.ts`, `implementation-recovery.ts`, `publish-pr.ts`, `metadata-assessment.ts`, `run-accounting.ts`, `agents.ts`, `.transaction`, `session-bridge.ts`, `digest`, `config.ts`, `dependencies.ts`, `Engine`, `shared.ts`, `github-context.ts`, `OfficeSnapshot`, `record-trigger.ts`, `closeout-recovery.ts`, `scheduled-captures.ts`, `ref_zod`, `GitHubDelivery`, `lesson-selection.ts`, `interrupted-work-recovery.ts`, `worker-runtime.ts`, `maintenance/maintenance.ts`, `ticket-evidence.ts`, `intent.ts`, `currentAssignment`, `run-retrospective.ts`, `time-scope.ts`, `daily-cto.ts`, `effects.ts`, `.emit`, `.save`, `outbox.ts`, `dependency-bots/adopt.ts`, `cost-ledger.ts`, `source-amendment.ts`, `demand-facts.ts`, `.activeClaims`, `remove-candidate.ts`, `process.ts`, `assignment-poll.ts`, `ref_node_crypto`, `features.ts`, `scope-repair-resume.ts`, `scheduled-work.ts`, `assignments.ts`, `retrospective-subject.ts`, `store.ts`, `CEC`, `delivery-repairs.ts`, `cec/issue-publication.ts`, `learning-events.ts`, `cec/workflow.ts`, `engine.ts`, `artifact`, `accept-retrospective.ts`, `Effects`, `refresh-evidence.ts`, `validate-stage.ts`, `preparation-readback.ts`, `office-lessons.ts`, `it-specialist.ts`, `coordination.ts`, `time-readback.ts`, `recordedPush`, `jira-time.ts`, `weekly-rollup.ts`, `retire-unstarted-delivery.ts`, `inspect-closed-plan.ts`, `continue-access-only-plan.ts`, `github-delivery.ts`?**
  _High betweenness centrality (0.115) - this node is a cross-community bridge._
- **Why does `sceneColors` connect `OfficeScene.tsx` to `node-visuals.ts`, `constellation-runtime.ts`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Why does `Role` connect `agents.ts` to `accept-stage-result.ts`, `run-accounting.ts`, `Inspector.tsx`, `shared.ts`, `github-context.ts`, `App.tsx`, `OfficeSnapshot`, `PeoplePanel.tsx`, `ref_zod`, `GitHubDelivery`, `worker-runtime.ts`, `maintenance/maintenance.ts`, `.emit`, `outbox.ts`, `OfficeScene.tsx`, `retrospective-subject.ts`, `store.ts`, `Store`, `work.ts`, `scene-motion.ts`, `inspect-closed-plan.ts`, `github-delivery.ts`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _494 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ref_node_path` be split into smaller, more focused modules?**
  _Cohesion score 0.08885850991114148 - nodes in this community are weakly interconnected._
- **Should `accept-stage-result.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07858807858807859 - nodes in this community are weakly interconnected._
- **Should `features/workflow.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07859649122807018 - nodes in this community are weakly interconnected._