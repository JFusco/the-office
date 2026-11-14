# Graph Report - office-cec-dispatch-handoff-nov14  (2026-11-14)

## Corpus Check
- 793 files · ~324,520 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4009 nodes · 18686 edges · 115 communities (105 shown, 10 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 601 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9648f59e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- dependency-bots/adopt.ts
- post-conflict-preparation.ts
- github-delivery.ts
- ref_react
- Inspector.tsx
- scheduled-captures.ts
- session-bridge.ts
- App.tsx
- agents.ts
- packed165-admission.ts
- ref_node_crypto
- office-lessons.ts
- TicketJob
- currentAssignment
- admit-improvement.ts
- artifact
- pendingRounds
- digest
- config.ts
- cec/issue-publication.ts
- source-amendment-scope.ts
- daily-cto.ts
- dependencies.ts
- Effects
- Store
- lesson-selection.ts
- requests.ts
- PeoplePanel.tsx
- TimeBook.tsx
- .pump
- Button
- assignments.ts
- run-retrospective.ts
- fact-bounds.ts
- coordination.ts
- ref_zod
- cost-ledger.ts
- Conversation.tsx
- source-amendment.ts
- ticket-evidence.ts
- it-specialist.ts
- worker-runtime.ts
- DailyCTO.tsx
- record-trigger.ts
- time-scope.ts
- shared.ts
- accept-stage-result.ts
- run.ts
- scheduled-work.ts
- OfficeScene.tsx
- index.tsx
- brain-maintenance.ts
- work.ts
- control-store.ts
- sanitizeObject
- assignment-poll.ts
- knowledge.ts
- MaintenanceRun
- supersedingDelivery
- features.ts
- .save
- delivery-repairs.ts
- blocker-followups.ts
- service-health.ts
- jira-time.ts
- executeRequest
- telemetry.ts
- .emit
- QuestionStepper.tsx
- constellation-runtime.ts
- refresh-evidence.ts
- weekly-rollup.ts
- retrospective-subject.ts
- command
- team-conversation-pump.ts
- jira-operations.ts
- owned-artifact.ts
- node-visuals.ts
- run-accounting.ts
- group-inventory.ts
- candidate.ts
- scene-motion.ts
- cec/workflow.ts
- goal-reporting.ts
- maintenance/maintenance.ts
- intent.ts
- checkpoint-retry.ts
- Role
- report.ts
- capture-session-clone.py
- RoomCamera.tsx
- Offices
- createConstellation
- preferences-store.ts
- outbox.ts
- codex-rollout.ts
- command-registry.ts
- FeatureWorkflow
- CommittedBrain
- retire-history.ts
- QuestionNotifications
- extract-worker.mjs
- create-candidate.ts
- record-push.ts
- install-service.mjs
- live-reach.ts
- ITFollowUps.tsx
- ProjectProgress
- cec-implementation-continuation.ts
- server_delivery_harness_delivery_authority_resolvedeliverywork
- server_features_questions_pending_round_pendinground
- server_features_questions_pending_round_pendingrounds
- server_features_questions_pending_round_roundauthor
- src_shared_personas
- src_shared_workkey

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
- `projectOutbox()` --calls--> `deferredPickup()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/pickup-state.ts
- `cecChatPrompt()` --calls--> `timeReport()`  [EXTRACTED]
  server/conversations/prompts/conversations.ts → src/timing/timing.ts
- `replacementContext()` --calls--> `slackMessageUrl()`  [EXTRACTED]
  server/conversations/slack/supersession-proof.ts → src/shared.ts
- `DeliveryAuthorityInput` --references--> `HarnessRequest`  [EXTRACTED]
  server/delivery/harness/delivery-authority.ts → src/contracts/work.ts

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

## Communities (115 total, 10 thin omitted)

### Community 0 - "dependency-bots/adopt.ts"
Cohesion: 0.05
Nodes (92): initialManualStart(), Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard (+84 more)

### Community 1 - "post-conflict-preparation.ts"
Cohesion: 0.08
Nodes (58): assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), reconcileCompletedConflictDraft(), routeReadyPostConflictPublication(), verifyInitialDraftConflictPreparation() (+50 more)

### Community 2 - "github-delivery.ts"
Cohesion: 0.06
Nodes (79): findingsBlock(), deliveryIntakeBlocker(), gateRegisteredDelivery(), assertDeliveryMayMutate(), runHarnessStage(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers() (+71 more)

### Community 3 - "ref_react"
Cohesion: 0.07
Nodes (63): ref_react, ref_react_markdown, ref_remark_gfm, ref_yaml, KnowledgeActivity, KnowledgeActivityPage, KnowledgeEdge, KnowledgeMap (+55 more)

### Community 4 - "Inspector.tsx"
Cohesion: 0.10
Nodes (65): SendMessage, Outbox(), blockedSummary(), ServiceHealthPanel(), followUp(), labels, ServiceHealthRow(), BlockerFollowups() (+57 more)

### Community 5 - "scheduled-captures.ts"
Cohesion: 0.15
Nodes (45): createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest, captureRequests() (+37 more)

### Community 6 - "session-bridge.ts"
Cohesion: 0.06
Nodes (53): ref_node_perf_hooks, ref_ws, claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexDaemonProcesses(), accountCodexProcesses() (+45 more)

### Community 7 - "App.tsx"
Cohesion: 0.06
Nodes (50): ref_lucide_react, ref_motion, ref_react_dom, itAgent(), itDiagnostics(), BrainDrawer(), themeColor, App() (+42 more)

### Community 8 - "agents.ts"
Cohesion: 0.06
Nodes (49): verifyContinuationPreservation(), implementationWorkerContext(), IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), intakeMembership(), projectListScope() (+41 more)

### Community 9 - "packed165-admission.ts"
Cohesion: 0.16
Nodes (23): requireDeliveryAuthority(), HarnessControl, admitPacked165(), history(), makePacked165Candidate(), packed165CandidateIdentity(), packed165Subject(), retainedPacked165Effect() (+15 more)

### Community 10 - "ref_node_crypto"
Cohesion: 0.07
Nodes (71): ref_node_crypto, approveFeature(), featureById(), mutation(), reviewQuestions(), assertFeatureDependencyOrder(), featureDependencyEdges(), key() (+63 more)

### Community 11 - "office-lessons.ts"
Cohesion: 0.07
Nodes (35): normalizeStatement(), LessonBrainOverlap, decideOfficeProposal(), now(), OfficeKnowledgeStore, proposeOfficeLessons(), retireOfficeLesson(), Input (+27 more)

### Community 12 - "TicketJob"
Cohesion: 0.06
Nodes (74): ref_node_fs, ref_node_path, Execute, installDependencies(), major(), removeAdoptedClone(), withHarnessWork(), harnessStageResult() (+66 more)

### Community 13 - "currentAssignment"
Cohesion: 0.08
Nodes (55): deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, accounting, DeliverySubject, nonDelivery, originalReads (+47 more)

### Community 14 - "admit-improvement.ts"
Cohesion: 0.22
Nodes (15): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+7 more)

### Community 15 - "artifact"
Cohesion: 0.05
Nodes (127): ref_node_os, containedFile(), recordJobApproach(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation() (+119 more)

### Community 16 - "pendingRounds"
Cohesion: 0.21
Nodes (17): commandFeature(), confirmBrief(), FeaturePlanningBindings, assertQuestionVisibility(), applyHarnessAction(), HarnessActionInput, harnessQuestion(), recoveryPreconditions() (+9 more)

### Community 17 - "digest"
Cohesion: 0.09
Nodes (57): ref_node_util, interruptedImplementation(), activeEffectId(), retryRead(), receipt(), admitPRMetadata(), assessPRMetadata(), captureAssessment() (+49 more)

### Community 18 - "config.ts"
Cohesion: 0.06
Nodes (52): ref_hono_node_server, ref_node_http, ref_node_stream, ref_node_timers, ref_vite, implementationPreview(), implementationContinuationRoute(), args (+44 more)

### Community 19 - "cec/issue-publication.ts"
Cohesion: 0.09
Nodes (22): Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), Transition, descriptionPreimage(), plain() (+14 more)

### Community 20 - "source-amendment-scope.ts"
Cohesion: 0.08
Nodes (34): approvedText(), assert(), assert(), normalize(), officialUrls, ReleaseCapture, verifyReleaseCaptures(), capture (+26 more)

### Community 21 - "daily-cto.ts"
Cohesion: 0.08
Nodes (28): DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), queueGoalEvidenceRequest(), applyGoalReview(), DailyResultSchema, EvidenceRefSchema (+20 more)

### Community 22 - "dependencies.ts"
Cohesion: 0.18
Nodes (14): admit(), resumeParked(), compatible(), dependencyCompletionKey(), dependencyEligibility(), issueKey(), observePrerequisites(), PrerequisiteSchema (+6 more)

### Community 23 - "Effects"
Cohesion: 0.13
Nodes (21): publishFeature(), reconcilePublication(), uncertainPublications(), reserveIdentity(), GitHubOperations, fileLessonIssue(), lessonIssueBody(), lessonIssueMarker() (+13 more)

### Community 24 - "Store"
Cohesion: 0.06
Nodes (42): ref_smol_toml, featureItemComplete(), reconcileFeatureCompletion(), GitHubFeaturePublisher, helperTelemetry(), reserveReplacement(), stageBudget(), wakeFeature() (+34 more)

### Community 25 - "lesson-selection.ts"
Cohesion: 0.14
Nodes (19): INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, MAINTENANCE, MAX_LESSONS, normalPath(), PURPOSES (+11 more)

### Community 26 - "requests.ts"
Cohesion: 0.11
Nodes (42): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+34 more)

### Community 27 - "PeoplePanel.tsx"
Cohesion: 0.10
Nodes (42): label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+34 more)

### Community 28 - "TimeBook.tsx"
Cohesion: 0.09
Nodes (45): TelemetryReport, displayAgentTask(), githubStageLabels, withoutElapsed(), LiveAgentTask(), Props, RunningTask(), text() (+37 more)

### Community 29 - ".pump"
Cohesion: 0.14
Nodes (13): captureMaintenanceStep(), candidateOwner(), SETTLED, skipOwnedCandidate(), Skipped, skippedCandidateLedger(), GitHubMaintenance, maintenanceCoveragePassed() (+5 more)

### Community 30 - "Button"
Cohesion: 0.13
Nodes (39): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView() (+31 more)

### Community 31 - "assignments.ts"
Cohesion: 0.09
Nodes (31): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, GraphNode (+23 more)

### Community 32 - "run-retrospective.ts"
Cohesion: 0.08
Nodes (50): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, blockingTrigger, isBlocking(), brainOverlap (+42 more)

### Community 33 - "fact-bounds.ts"
Cohesion: 0.18
Nodes (19): leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance() (+11 more)

### Community 34 - "coordination.ts"
Cohesion: 0.10
Nodes (25): reconcileNoticeConfirmations(), PrerequisitesSchema, brainCheckpointCompletion(), reconcileCompletedCheckpoints(), reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION (+17 more)

### Community 35 - "ref_zod"
Cohesion: 0.09
Nodes (25): ref_zod, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff(), saveGoals() (+17 more)

### Community 36 - "cost-ledger.ts"
Cohesion: 0.13
Nodes (30): captureCost(), server_telemetry_cost_entries_costcoveragesummary, costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress() (+22 more)

### Community 37 - "Conversation.tsx"
Cohesion: 0.17
Nodes (19): Conversation(), LessonDecisionAction, lessonDecisionState(), readLessonDecision(), OutboxLessonDecision(), act(), readStatus(), slackMessageStatus() (+11 more)

### Community 38 - "source-amendment.ts"
Cohesion: 0.10
Nodes (41): ref_node_async_hooks, stagePrompt(), StagePromptInput, METADATA_FINDING_GUIDANCE, adoptCandidate(), reported, Scope, advisoryPM() (+33 more)

### Community 39 - "ticket-evidence.ts"
Cohesion: 0.14
Nodes (22): ref_node_string_decoder, assetDownloader(), attachmentKind(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS, EvidenceAttachment (+14 more)

### Community 40 - "it-specialist.ts"
Cohesion: 0.21
Nodes (14): savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), ITContext, diagnosticSnapshot(), publishITReport(), nativeDeliveryResolved() (+6 more)

### Community 41 - "worker-runtime.ts"
Cohesion: 0.08
Nodes (33): candidateWorkspaceEnvironment(), assignmentSubject(), dispatchExposure(), prepareExposure(), lessonPurpose(), LessonSelection, catalogLine(), assertBriefingScope() (+25 more)

### Community 42 - "DailyCTO.tsx"
Cohesion: 0.25
Nodes (11): CTOReview(), goalState, DailyCTO(), GoalHistory(), load(), reportDate(), reviewStatus, InlineText() (+3 more)

### Community 43 - "record-trigger.ts"
Cohesion: 0.12
Nodes (35): LEARNING_BASELINES, maintainLearning(), clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates(), maintenanceCompletedId(), maintenanceKey() (+27 more)

### Community 44 - "time-scope.ts"
Cohesion: 0.12
Nodes (33): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), server_telemetry_billable_work_issue_key, isTicketModelWork(), ScopePolicy, scopeSelector(), CaptureContext (+25 more)

### Community 45 - "shared.ts"
Cohesion: 0.09
Nodes (22): Admission, HistoryRetirement, HistoryRetirementIntent, PackedPublicationRepair, SlackReplacementRequest, SlackSupersession, SlackSupersessionView, Prerequisite (+14 more)

### Community 46 - "accept-stage-result.ts"
Cohesion: 0.09
Nodes (40): acceptStageResult(), draftReadHeadMatches(), assertDraftClaimHistory(), linkDraftIssue(), protectedOriginalClaim(), METADATA_FINDING, publicationReadArgs(), Read (+32 more)

### Community 47 - "run.ts"
Cohesion: 0.14
Nodes (24): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationCandidates(), investigationId(), investigationFollowUps(), investigationResolution(), syncInvestigations(), NOTIFY_HELPER (+16 more)

### Community 48 - "scheduled-work.ts"
Cohesion: 0.09
Nodes (36): deliverySlot(), ROLES, closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), metadataRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork() (+28 more)

### Community 49 - "OfficeScene.tsx"
Cohesion: 0.15
Nodes (35): Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk(), ElevatorStage() (+27 more)

### Community 50 - "index.tsx"
Cohesion: 0.06
Nodes (48): ctoInputFailure(), OutboxCTOInput(), recover(), OutboxMaintenanceStatus(), OutboxSavedImplementation(), apply(), review(), OutboxSavedPlan() (+40 more)

### Community 51 - "brain-maintenance.ts"
Cohesion: 0.21
Nodes (10): maintenancePolicies(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice(), easternDate(), weeklyDue() (+2 more)

### Community 52 - "work.ts"
Cohesion: 0.14
Nodes (18): BLOCKED_CAUSES, blockedCauses(), projectReadiness(), ProjectReadiness, AssignmentResult, BlockedCause, CompletionCondition, DeliveryAdmission (+10 more)

### Community 53 - "control-store.ts"
Cohesion: 0.14
Nodes (13): ref_node_sqlite, Clock, applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, statementCache(), initialSnapshot() (+5 more)

### Community 54 - "sanitizeObject"
Cohesion: 0.15
Nodes (23): az(), base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs(), fullActivePRs() (+15 more)

### Community 55 - "assignment-poll.ts"
Cohesion: 0.11
Nodes (23): channelNoticeAuthorized(), ChannelSettings, notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR, plainSlackText() (+15 more)

### Community 56 - "knowledge.ts"
Cohesion: 0.13
Nodes (26): clip(), DEMAND_LIMIT, demandFacts(), DemandSection, key(), LessonKey, notes(), clip() (+18 more)

### Community 57 - "MaintenanceRun"
Cohesion: 0.20
Nodes (10): BrainStatusSchema, coverageSchema, followupSchema, verified, repeatedVendorReviewBlock(), stoppedInVendorReview(), REOBSERVED, ReconciliationRequest (+2 more)

### Community 58 - "supersedingDelivery"
Cohesion: 0.33
Nodes (9): syncOutbox(), finishSupersededReadback(), projectSlackDeliveries(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint(), slackRequestSettled() (+1 more)

### Community 59 - "features.ts"
Cohesion: 0.11
Nodes (34): IntakeContext, WAIT_STATUSES, DependencyStores, bindFeature(), currentApproval(), featureGate(), predecessorComplete(), automaticIntakeWait() (+26 more)

### Community 60 - ".save"
Cohesion: 0.19
Nodes (29): jiraCollection(), BLOCKED, findComment(), LiveIssue, readIssue(), readIssues(), Execute, jira() (+21 more)

### Community 61 - "delivery-repairs.ts"
Cohesion: 0.13
Nodes (32): parksInJira(), run(), namedRepairIds(), DECISION_KINDS, needsDecision(), afterDraft(), firstBuildStage(), missingApproachStage() (+24 more)

### Community 62 - "blocker-followups.ts"
Cohesion: 0.32
Nodes (10): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), ctoInputRecovered(), conversationResolved(), readBackConversations(), handoff(), reconcileBlockerFollowups() (+2 more)

### Community 63 - "service-health.ts"
Cohesion: 0.19
Nodes (9): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, slackHealth() (+1 more)

### Community 64 - "jira-time.ts"
Cohesion: 0.15
Nodes (20): expireLessons(), expiring(), graduateLessons(), graduating(), retire(), dailyReviewDate(), reviewWeekday(), EASTERN (+12 more)

### Community 65 - "executeRequest"
Cohesion: 0.07
Nodes (3): Coordinator, executeRequest(), AssignedIssue

### Community 66 - "telemetry.ts"
Cohesion: 0.10
Nodes (25): CodexRollout, CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL (+17 more)

### Community 67 - ".emit"
Cohesion: 0.19
Nodes (23): decideImplementation(), configureChannelNotices(), configureNotices(), retryRecipientLookup(), recoverCTOInput(), enqueueGreen156(), bindDiscoveryResume(), DiscoveryResumeInput (+15 more)

### Community 68 - "QuestionStepper.tsx"
Cohesion: 0.13
Nodes (26): FeatureHarnessOption, FeatureOption, FeatureQuestion, FeatureQuestionProjection, OutboxQuestionRound(), send(), draftKey(), readDraft() (+18 more)

### Community 69 - "constellation-runtime.ts"
Cohesion: 0.15
Nodes (17): ref_3d_force_graph, ref_three, CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point (+9 more)

### Community 70 - "refresh-evidence.ts"
Cohesion: 0.28
Nodes (12): evidenceDirectory(), readEvidence(), ProviderEvidence, canonical(), evidenceDigest(), evidenceHash(), semantic(), stableUrl() (+4 more)

### Community 71 - "weekly-rollup.ts"
Cohesion: 0.09
Nodes (28): expireLearningPackets(), packetReferences(), learningMetrics(), BRAIN_SCOPE, SUBJECT, Kind, RetrospectiveResult, RetrospectiveResultSchema (+20 more)

### Community 72 - "retrospective-subject.ts"
Cohesion: 0.14
Nodes (20): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+12 more)

### Community 73 - "command"
Cohesion: 0.07
Nodes (10): AzureMonitor, correlatedBuild(), GitHubMonitor, Engine, observe(), observeParked(), parkedReadError, command() (+2 more)

### Community 74 - "team-conversation-pump.ts"
Cohesion: 0.18
Nodes (11): assertConversationReadback(), comparableSlackText(), SlackMessages, pump(), savePickup(), harperHandoff(), acceptedGoalReport(), permitsGoalEvidenceReturn() (+3 more)

### Community 75 - "jira-operations.ts"
Cohesion: 0.24
Nodes (9): CommentPage, commentReadback(), JiraOperations, plain(), jiraRecord(), unpack(), metadataDigest(), verifiedTransition() (+1 more)

### Community 76 - "owned-artifact.ts"
Cohesion: 0.24
Nodes (13): investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_SOURCE_PATHS, officeSource(), done(), readBoundedNoFollow() (+5 more)

### Community 77 - "node-visuals.ts"
Cohesion: 0.20
Nodes (13): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+5 more)

### Community 78 - "run-accounting.ts"
Cohesion: 0.11
Nodes (31): BoundedRead, EvidenceOutcome, backfillClaudeCost(), CompletionReader, codexHome(), createdAt(), dayDirs(), header() (+23 more)

### Community 79 - "group-inventory.ts"
Cohesion: 0.26
Nodes (9): ref_node_child_process, errno, GroupInventory, GroupProbe, Phase, groupInventory(), InventoryRunner, probeProcessGroup() (+1 more)

### Community 80 - "candidate.ts"
Cohesion: 0.29
Nodes (12): GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles(), absent() (+4 more)

### Community 81 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 82 - "cec/workflow.ts"
Cohesion: 0.09
Nodes (37): continueImplementation(), applyIntakeObservation(), checkMail(), drainMail(), requestMail(), dispatchNightly(), drainDelivery(), enableNightly() (+29 more)

### Community 83 - "goal-reporting.ts"
Cohesion: 0.10
Nodes (28): AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), githubPRDescription(), azureGoalFacts(), azurePRDescription(), boundedEvidence(), collectAzureGoalDocuments(), EvidenceStore (+20 more)

### Community 84 - "maintenance/maintenance.ts"
Cohesion: 0.18
Nodes (9): APPROACH_GUIDANCE, ApproachSchema, GITHUB_ISSUE_SKILL, Result, CmsFollowUpContext, cmsFollowUpInstructions(), MaintenanceSchema, MAINTENANCE_NATIVE_GUIDANCE (+1 more)

### Community 85 - "intent.ts"
Cohesion: 0.26
Nodes (8): ContinuationIO, nativeIO, assertOwnership(), ImplementationDecision, OwnershipRead, assertCandidateIdle(), Read, DeliveryRequest

### Community 86 - "checkpoint-retry.ts"
Cohesion: 0.26
Nodes (10): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), legacy, validateNativeContinuation(), maintenanceSuperseded() (+2 more)

### Community 87 - "Role"
Cohesion: 0.21
Nodes (9): assignmentDiagnostics(), diagnosticContext(), DeliverySlot, officeCapacity, PROJECTS, withCECGoalEvidence(), ExecutionLane, currentServices() (+1 more)

### Community 88 - "report.ts"
Cohesion: 0.13
Nodes (22): CostEntry, TelemetryRow, TelemetrySync, ConfirmedSegment, LiveAnchor, ObservationGap, SnapshotOrdering, TimeLedgerState (+14 more)

### Community 89 - "capture-session-clone.py"
Cohesion: 0.15
Nodes (10): ctypes, errno, importlib_util, json, os, pathlib, Copy a coherent macOS clone of inherited reader fd3 to anonymous target fd4. No…, Read-only protocol adapter for the installed review helper. No model dispatch. (+2 more)

### Community 90 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (10): ref_react_three_drei, ref_react_three_fiber, ref_three_stdlib, CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility (+2 more)

### Community 91 - "Offices"
Cohesion: 0.24
Nodes (3): mirrorOfficeKnowledge(), Offices, markCaptureStart()

### Community 92 - "createConstellation"
Cohesion: 0.19
Nodes (5): ConstellationRuntime, createConstellation(), enter(), finishTap(), move()

### Community 93 - "preferences-store.ts"
Cohesion: 0.23
Nodes (7): fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS, OfficePreferences

### Community 94 - "outbox.ts"
Cohesion: 0.12
Nodes (27): projectOutbox(), compactSteps(), knowledgeOutbox(), checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), checkpointSuperseded(), isSavedPlanFollowup() (+19 more)

### Community 95 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 96 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 99 - "retire-history.ts"
Cohesion: 0.60
Nodes (4): historicalRecordDigest(), Intent, records(), retireIncompleteHistory()

### Community 102 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (6): ref_mammoth, ref_pdfjs_dist, bounded(), extract(), fail(), [path,kind]

### Community 103 - "create-candidate.ts"
Cohesion: 0.48
Nodes (6): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf()

### Community 104 - "record-push.ts"
Cohesion: 0.21
Nodes (10): Event, one(), prePushRejection(), PushIdentity, Candidate, recordedPush(), settledPushBoundary(), At (+2 more)

### Community 106 - "install-service.mjs"
Cohesion: 0.29
Nodes (5): ref_node_url, file, folder, logs, root

### Community 107 - "live-reach.ts"
Cohesion: 0.47
Nodes (5): GIT_NETWORK, LIVE_PROVIDERS, liveReach(), networkUrl(), remoteUrls()

### Community 108 - "ITFollowUps.tsx"
Cohesion: 0.67
Nodes (4): itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps()

### Community 111 - "cec-implementation-continuation.ts"
Cohesion: 0.40
Nodes (4): ImplementationContinuation, ImplementationContinuationInput, ImplementationContinuationRequest, SavedImplementationProof

## Knowledge Gaps
- **490 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+485 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 634 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `dependency-bots/adopt.ts`, `post-conflict-preparation.ts`, `github-delivery.ts`, `scheduled-captures.ts`, `session-bridge.ts`, `agents.ts`, `packed165-admission.ts`, `ref_node_crypto`, `office-lessons.ts`, `TicketJob`, `currentAssignment`, `admit-improvement.ts`, `artifact`, `pendingRounds`, `digest`, `config.ts`, `cec/issue-publication.ts`, `daily-cto.ts`, `dependencies.ts`, `Effects`, `lesson-selection.ts`, `requests.ts`, `.pump`, `assignments.ts`, `run-retrospective.ts`, `fact-bounds.ts`, `coordination.ts`, `ref_zod`, `cost-ledger.ts`, `source-amendment.ts`, `ticket-evidence.ts`, `it-specialist.ts`, `worker-runtime.ts`, `record-trigger.ts`, `time-scope.ts`, `accept-stage-result.ts`, `run.ts`, `scheduled-work.ts`, `index.tsx`, `brain-maintenance.ts`, `control-store.ts`, `sanitizeObject`, `assignment-poll.ts`, `knowledge.ts`, `MaintenanceRun`, `supersedingDelivery`, `features.ts`, `.save`, `delivery-repairs.ts`, `blocker-followups.ts`, `jira-time.ts`, `.emit`, `refresh-evidence.ts`, `weekly-rollup.ts`, `retrospective-subject.ts`, `command`, `team-conversation-pump.ts`, `jira-operations.ts`, `owned-artifact.ts`, `run-accounting.ts`, `candidate.ts`, `cec/workflow.ts`, `goal-reporting.ts`, `maintenance/maintenance.ts`, `intent.ts`, `checkpoint-retry.ts`, `Role`, `Offices`, `FeatureWorkflow`, `retire-history.ts`, `QuestionNotifications`, `create-candidate.ts`, `record-push.ts`, `ProjectProgress`?**
  _High betweenness centrality (0.109) - this node is a cross-community bridge._
- **Why does `command()` connect `command` to `dependency-bots/adopt.ts`, `github-delivery.ts`, `session-bridge.ts`, `agents.ts`, `packed165-admission.ts`, `ref_node_crypto`, `TicketJob`, `artifact`, `digest`, `cec/issue-publication.ts`, `dependencies.ts`, `Effects`, `Store`, `requests.ts`, `.pump`, `assignments.ts`, `coordination.ts`, `cost-ledger.ts`, `ticket-evidence.ts`, `worker-runtime.ts`, `accept-stage-result.ts`, `scheduled-work.ts`, `brain-maintenance.ts`, `sanitizeObject`, `assignment-poll.ts`, `.save`, `delivery-repairs.ts`, `service-health.ts`, `jira-time.ts`, `executeRequest`, `jira-operations.ts`, `group-inventory.ts`, `candidate.ts`, `cec/workflow.ts`, `goal-reporting.ts`, `maintenance/maintenance.ts`, `command-registry.ts`, `FeatureWorkflow`, `create-candidate.ts`, `record-push.ts`, `live-reach.ts`, `ProjectProgress`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `OfficeSnapshot` connect `index.tsx` to `ref_react`, `Inspector.tsx`, `App.tsx`, `config.ts`, `daily-cto.ts`, `Store`, `PeoplePanel.tsx`, `TimeBook.tsx`, `.pump`, `Button`, `fact-bounds.ts`, `Conversation.tsx`, `DailyCTO.tsx`, `record-trigger.ts`, `shared.ts`, `run.ts`, `OfficeScene.tsx`, `work.ts`, `sanitizeObject`, `MaintenanceRun`, `supersedingDelivery`, `blocker-followups.ts`, `service-health.ts`, `team-conversation-pump.ts`, `scene-motion.ts`, `cec/workflow.ts`, `outbox.ts`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _490 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dependency-bots/adopt.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05061631261473905 - nodes in this community are weakly interconnected._
- **Should `post-conflict-preparation.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0772635814889336 - nodes in this community are weakly interconnected._
- **Should `github-delivery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05591771693466609 - nodes in this community are weakly interconnected._