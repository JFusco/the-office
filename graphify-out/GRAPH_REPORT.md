# Graph Report - office-session-capture-nov13  (2026-11-13)

## Corpus Check
- 765 files · ~314,696 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3897 nodes · 18235 edges · 107 communities (102 shown, 5 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 590 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `893ca4d4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- github-delivery.ts
- accept-stage-result.ts
- scheduler.ts
- ref_react
- config.ts
- worker-runtime.ts
- daily-cto.ts
- App.tsx
- post-conflict-preparation.ts
- session-bridge.ts
- source-amendment.ts
- TicketJob
- assignments.ts
- TelemetryPanel.tsx
- scheduled-captures.ts
- ref_node_path
- conversations/conversations.ts
- cec/workflow.ts
- run-retrospective.ts
- features.ts
- .transaction
- work-summary.ts
- Role
- demand-facts.ts
- index.tsx
- Button
- maintenance/maintenance.ts
- knowledge.ts
- continuationWorkerProof
- record-trigger.ts
- azure.ts
- enrollment-gate.ts
- publish-pr.ts
- verifyRepairCandidate
- Conversation.tsx
- process.ts
- QuestionStepper.tsx
- Inspector.tsx
- dependency-bots/adopt.ts
- cost-ledger.ts
- OfficeScene.tsx
- outbox.ts
- assignment-poll.ts
- telemetry.ts
- Goals.tsx
- ledger.ts
- coordination.ts
- requests.ts
- projects.ts
- agents.ts
- jira-time.ts
- ticket-evidence.ts
- index.ts
- shared.ts
- workKey
- scope-repair-resume.ts
- .save
- JiraIssuePublisher
- Coordinator
- time-scope.ts
- constellation-runtime.ts
- .emit
- Engine
- fact-bounds.ts
- run-accounting.ts
- Store
- weekly-rollup.ts
- publication.ts
- http/commands.ts
- retrospective-subject.ts
- blocker-followups.ts
- create-candidate.ts
- run.ts
- delivery-recoveries.ts
- activation-recovery.ts
- local-config.ts
- it-specialist.ts
- admit-improvement.ts
- node-visuals.ts
- scheduled-work.ts
- digest
- dependencies.ts
- github-check-selection.ts
- Effects
- StageResult
- artifact
- owned-artifact.ts
- link-draft-issue.ts
- preferences-store.ts
- report.ts
- scene-motion.ts
- cli.ts
- delivery-authority.ts
- capture-session-clone.py
- RoomCamera.tsx
- createConstellation
- offices.ts
- ref_zod
- Offices
- install-service.mjs
- CommittedBrain
- WorkerRuntime
- contract.ts
- codex-rollout.ts
- command-registry.ts
- github-readiness.ts
- extract-worker.mjs

## God Nodes (most connected - your core abstractions)
1. `Store` - 345 edges
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
- `DeliverySlot` --references--> `Role`  [EXTRACTED]
  server/office/projects.ts → src/shared.ts
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

## Communities (107 total, 5 thin omitted)

### Community 0 - "github-delivery.ts"
Cohesion: 0.10
Nodes (37): findingsBlock(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery(), BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE (+29 more)

### Community 1 - "accept-stage-result.ts"
Cohesion: 0.13
Nodes (36): acceptStageResult(), mergeAuthorized(), allowed, continuationReviewArtifacts(), continuationWorktree(), negativeWorker(), reconcileContinuationReview(), savedNegativeContinuationReview() (+28 more)

### Community 2 - "scheduler.ts"
Cohesion: 0.15
Nodes (15): ROLES, officeCapacity, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch() (+7 more)

### Community 3 - "ref_react"
Cohesion: 0.07
Nodes (57): ref_react, ref_react_markdown, ref_remark_gfm, ref_yaml, KnowledgeNode, Activity(), ActivityTimeline(), AssignmentKnowledge() (+49 more)

### Community 4 - "config.ts"
Cohesion: 0.09
Nodes (49): ref_node_url, approveFeature(), mutation(), discoveryPrompt(), planPrompt(), artifactPath(), digest(), document() (+41 more)

### Community 5 - "worker-runtime.ts"
Cohesion: 0.08
Nodes (34): candidateWorkspaceEnvironment(), assignmentSubject(), dispatchExposure(), prepareExposure(), lessonPurpose(), catalogLine(), assertBriefingScope(), CODEX_DEFAULT_EFFORT (+26 more)

### Community 6 - "daily-cto.ts"
Cohesion: 0.07
Nodes (32): DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), dailyReviewDate(), reviewWeekday(), applyGoalReview(), DailyResultSchema (+24 more)

### Community 7 - "App.tsx"
Cohesion: 0.07
Nodes (49): ref_lucide_react, ref_motion, ref_react_dom, BrainDrawer(), themeColor, App(), BrainWorkspace, CONNECTION (+41 more)

### Community 8 - "post-conflict-preparation.ts"
Cohesion: 0.09
Nodes (53): recoverCTOInput(), continuationNativeReview(), assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), reconcileCompletedConflictDraft() (+45 more)

### Community 9 - "session-bridge.ts"
Cohesion: 0.07
Nodes (46): ref_ws, claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexDaemonProcesses(), accountCodexProcesses(), codexProcessInventory (+38 more)

### Community 10 - "source-amendment.ts"
Cohesion: 0.06
Nodes (68): ref_node_async_hooks, adoptCandidate(), reported, Scope, approvedText(), assert(), AMENDMENT_REVIEW_PROOF, amendmentInstruction() (+60 more)

### Community 11 - "TicketJob"
Cohesion: 0.06
Nodes (22): ProjectProgress, dependabotReviewGuidance(), StageContext, GitHubDelivery, stagePrompt(), StagePromptInput, METADATA_FINDING_GUIDANCE, completedPRReviews() (+14 more)

### Community 12 - "assignments.ts"
Cohesion: 0.06
Nodes (49): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, GraphNode (+41 more)

### Community 13 - "TelemetryPanel.tsx"
Cohesion: 0.22
Nodes (18): TelemetryReport, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens(), usd(), KpiTiles() (+10 more)

### Community 14 - "scheduled-captures.ts"
Cohesion: 0.15
Nodes (44): createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest, captureRequests() (+36 more)

### Community 15 - "ref_node_path"
Cohesion: 0.10
Nodes (37): ref_node_fs, ref_node_os, ref_node_path, ref_node_util, Candidate, assertStoppedBaseAudit(), AuditRow, readStoppedBaseAuditCompletion() (+29 more)

### Community 16 - "conversations/conversations.ts"
Cohesion: 0.09
Nodes (31): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+23 more)

### Community 17 - "cec/workflow.ts"
Cohesion: 0.07
Nodes (56): applyIntakeObservation(), checkMail(), drainMail(), requestMail(), parksInJira(), dispatchNightly(), drainDelivery(), enableNightly() (+48 more)

### Community 18 - "run-retrospective.ts"
Cohesion: 0.08
Nodes (48): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, blockingTrigger, isBlocking(), brainOverlap (+40 more)

### Community 19 - "features.ts"
Cohesion: 0.10
Nodes (41): ref_node_crypto, commandFeature(), reviewQuestions(), automaticIntakeWait(), FeaturePlanningBindings, assertQuestionVisibility(), applyHarnessAction(), HarnessActionInput (+33 more)

### Community 20 - ".transaction"
Cohesion: 0.14
Nodes (28): featureItemComplete(), reconcileFeatureCompletion(), readEvidence(), helperTelemetry(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS, requestReplan() (+20 more)

### Community 21 - "work-summary.ts"
Cohesion: 0.10
Nodes (37): displayAgentTask(), LiveAgentTask(), Props, RunningTask(), text(), AzureBuild, src_shared_liveanchor, lastWall (+29 more)

### Community 22 - "Role"
Cohesion: 0.10
Nodes (44): label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+36 more)

### Community 23 - "demand-facts.ts"
Cohesion: 0.13
Nodes (22): clip(), DEMAND_LIMIT, demandFacts(), DemandSection, key(), LessonKey, notes(), withDemand() (+14 more)

### Community 24 - "index.tsx"
Cohesion: 0.07
Nodes (42): ctoInputFailure(), OutboxCTOInput(), recover(), OutboxMaintenanceStatus(), OutboxSavedPlan(), reconcile(), FeatureDelivery(), FeatureDocuments() (+34 more)

### Community 25 - "Button"
Cohesion: 0.13
Nodes (37): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView() (+29 more)

### Community 26 - "maintenance/maintenance.ts"
Cohesion: 0.09
Nodes (30): maintenancePolicies(), captureLearning(), captureMaintenanceStep(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice() (+22 more)

### Community 27 - "knowledge.ts"
Cohesion: 0.05
Nodes (58): curateLesson(), Curation, CurationAction, mergeEvidence(), lessonBrainAudit, LessonBrainOverlap, INSTALLED, installedLesson() (+50 more)

### Community 28 - "continuationWorkerProof"
Cohesion: 0.10
Nodes (45): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+37 more)

### Community 29 - "record-trigger.ts"
Cohesion: 0.11
Nodes (39): baselineLearning(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences(), configureKnowledge(), clip(), maintenanceBlockedId() (+31 more)

### Community 30 - "azure.ts"
Cohesion: 0.10
Nodes (30): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+22 more)

### Community 31 - "enrollment-gate.ts"
Cohesion: 0.19
Nodes (23): approvedDelivery(), bindDelivery(), featureDeliveryContext(), featureEffectGate(), assertFeatureGate(), bindFeature(), currentApproval(), featureGate() (+15 more)

### Community 32 - "publish-pr.ts"
Cohesion: 0.12
Nodes (43): activeEffectId(), retryRead(), admitPRMetadata(), METADATA_FINDING, assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema (+35 more)

### Community 33 - "verifyRepairCandidate"
Cohesion: 0.18
Nodes (22): removeAdoptedClone(), stoppedBaseCheckout(), adoptedReviewCandidate(), ciCheckout(), finishCISetup(), verifyCIHooks(), CIFailure, guardCIRepair() (+14 more)

### Community 34 - "Conversation.tsx"
Cohesion: 0.15
Nodes (21): Conversation(), LessonDecisionAction, lessonDecisionState(), readLessonDecision(), OutboxLessonDecision(), act(), readStatus(), recommendedReply() (+13 more)

### Community 35 - "process.ts"
Cohesion: 0.06
Nodes (27): CommentPage, commentReadback(), Assignment, Content, jiraText(), Transition, JiraOperations, plain() (+19 more)

### Community 36 - "QuestionStepper.tsx"
Cohesion: 0.19
Nodes (18): FeatureQuestionProjection, OutboxQuestionRound(), send(), draftKey(), readDraft(), saveDraft(), QuestionRound(), nextQuestion() (+10 more)

### Community 37 - "Inspector.tsx"
Cohesion: 0.12
Nodes (60): Outbox(), ServiceHealthPanel(), followUp(), labels, ServiceHealthRow(), BlockerFollowups(), LessonsPanel(), EvidenceCard() (+52 more)

### Community 38 - "dependency-bots/adopt.ts"
Cohesion: 0.07
Nodes (67): Lane, MOVABLE, resolveLane(), cardStatus(), Execute, ProjectCard, projectCards(), projectGraphql() (+59 more)

### Community 39 - "cost-ledger.ts"
Cohesion: 0.17
Nodes (25): captureCost(), server_telemetry_cost_entries_costcoveragesummary, costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId() (+17 more)

### Community 40 - "OfficeScene.tsx"
Cohesion: 0.17
Nodes (33): withoutElapsed(), Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk() (+25 more)

### Community 41 - "outbox.ts"
Cohesion: 0.15
Nodes (16): ctoInputRecovered(), conversationResolved(), projectOutbox(), knowledgeOutbox(), checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), repeatedVendorReviewBlock() (+8 more)

### Community 42 - "assignment-poll.ts"
Cohesion: 0.12
Nodes (25): queueMergeNotice(), observeGitHubMergeNotices(), initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved() (+17 more)

### Community 43 - "telemetry.ts"
Cohesion: 0.09
Nodes (28): CodexRollout, CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL (+20 more)

### Community 44 - "Goals.tsx"
Cohesion: 0.13
Nodes (21): SendMessage, CTOReview(), goalState, DailyCTO(), GoalHistory(), load(), reportDate(), reviewStatus (+13 more)

### Community 45 - "ledger.ts"
Cohesion: 0.19
Nodes (18): syncOutbox(), finishSupersededReadback(), projectSlackDeliveries(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint(), slackRequestSettled() (+10 more)

### Community 46 - "coordination.ts"
Cohesion: 0.08
Nodes (36): reconcileNoticeConfirmations(), IntakeContext, dependencyCompletionKey(), DependencyStores, PrerequisitesSchema, completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint() (+28 more)

### Community 47 - "requests.ts"
Cohesion: 0.11
Nodes (39): DeliveryAuthorityInput, HarnessControl, withHarnessWork(), hasSavedPrerequisiteResult(), admitPacked165(), history(), makePacked165Candidate(), packed165CandidateIdentity() (+31 more)

### Community 48 - "projects.ts"
Cohesion: 0.15
Nodes (16): ref_smol_toml, IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), projectListScope(), cecIntakePrompt(), LOCAL_BINDINGS (+8 more)

### Community 49 - "agents.ts"
Cohesion: 0.07
Nodes (41): intakeMembership(), cecPrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), resolvedDecisionNote(), stageInstructions, cecChatPrompt() (+33 more)

### Community 50 - "jira-time.ts"
Cohesion: 0.14
Nodes (21): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+13 more)

### Community 51 - "ticket-evidence.ts"
Cohesion: 0.11
Nodes (30): ref_node_string_decoder, assetDownloader(), attachmentKind(), evidenceDirectory(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS (+22 more)

### Community 52 - "index.ts"
Cohesion: 0.09
Nodes (30): ref_hono_node_server, ref_node_http, ref_vite, close(), config, itSpecialist, loadedRevision, offices (+22 more)

### Community 53 - "shared.ts"
Cohesion: 0.05
Nodes (45): assignmentDiagnostics(), diagnosticContext(), diagnosticSnapshot(), nativeDeliveryResolved(), ProjectReadiness, HistoryRetirement, HistoryRetirementIntent, DailyCTOSummary (+37 more)

### Community 54 - "workKey"
Cohesion: 0.08
Nodes (44): recordJobApproach(), continuationScope(), continuationGuard(), Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput (+36 more)

### Community 55 - "scope-repair-resume.ts"
Cohesion: 0.10
Nodes (46): containedFile(), pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat() (+38 more)

### Community 56 - ".save"
Cohesion: 0.17
Nodes (29): correlatedBuild(), unpack(), BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue() (+21 more)

### Community 57 - "JiraIssuePublisher"
Cohesion: 0.12
Nodes (11): JiraIssuePublisher, keyOf(), descriptionPreimage(), plain(), publicationDescription(), PublicationReceipt, GitHubIssuePublisher, number() (+3 more)

### Community 59 - "time-scope.ts"
Cohesion: 0.14
Nodes (28): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), server_telemetry_billable_work_issue_key, isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence() (+20 more)

### Community 60 - "constellation-runtime.ts"
Cohesion: 0.15
Nodes (17): ref_3d_force_graph, ref_three, CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point (+9 more)

### Community 61 - ".emit"
Cohesion: 0.09
Nodes (28): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR (+20 more)

### Community 62 - "Engine"
Cohesion: 0.09
Nodes (3): GitHubMonitor, Engine, GitHubBoard

### Community 63 - "fact-bounds.ts"
Cohesion: 0.25
Nodes (15): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+7 more)

### Community 64 - "run-accounting.ts"
Cohesion: 0.11
Nodes (30): BoundedRead, backfillClaudeCost(), CompletionReader, codexHome(), createdAt(), dayDirs(), header(), readCodexRollout() (+22 more)

### Community 65 - "Store"
Cohesion: 0.07
Nodes (29): ref_node_sqlite, accounting, DeliverySubject, nonDelivery, originalReads, Clock, sanitizeObject(), applyConnectionSettings() (+21 more)

### Community 66 - "weekly-rollup.ts"
Cohesion: 0.13
Nodes (27): learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), RollupResult (+19 more)

### Community 67 - "publication.ts"
Cohesion: 0.14
Nodes (12): featureById(), Link, linkFeature(), FeaturePublisher, publishFeature(), reconcilePublication(), uncertainPublications(), reserveIdentity() (+4 more)

### Community 68 - "http/commands.ts"
Cohesion: 0.17
Nodes (19): normalizeStatement(), declineLessonIssue(), reactivateLesson(), retireLesson(), decideOfficeProposal(), mirrorOfficeKnowledge(), now(), OfficeKnowledgeStore (+11 more)

### Community 69 - "retrospective-subject.ts"
Cohesion: 0.16
Nodes (17): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+9 more)

### Community 70 - "blocker-followups.ts"
Cohesion: 0.28
Nodes (13): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), canFileGithubIssue(), readBackConversations(), handoff(), reconcileBlockerFollowups(), clearUnblockBrief() (+5 more)

### Community 71 - "create-candidate.ts"
Cohesion: 0.26
Nodes (10): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+2 more)

### Community 72 - "run.ts"
Cohesion: 0.17
Nodes (16): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, OFFICE_FIX_PROMPT, OfficeFixResult, validateOfficeFix(), investigationReady(), InvestigationOptions, InvestigationReport (+8 more)

### Community 73 - "delivery-recoveries.ts"
Cohesion: 0.15
Nodes (20): deliveryIntakeBlocker(), boardPreflightCandidate(), blob(), Execute, inspectPartialWorktree(), partialLocalCleanupCandidate(), partialLocalCleanupKey(), requireProof() (+12 more)

### Community 74 - "activation-recovery.ts"
Cohesion: 0.21
Nodes (23): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+15 more)

### Community 75 - "local-config.ts"
Cohesion: 0.28
Nodes (11): AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), goalEvidencePath(), OfficeConfigInputs, officeConfigRoute(), officeConfigSummary(), CECBinding, localBindings (+3 more)

### Community 76 - "it-specialist.ts"
Cohesion: 0.13
Nodes (19): ITContext, publishITReport(), delays, recoverAttempt(), listenerHealth(), providers, ProviderStatusChecks, summary (+11 more)

### Community 77 - "admit-improvement.ts"
Cohesion: 0.25
Nodes (13): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+5 more)

### Community 78 - "node-visuals.ts"
Cohesion: 0.20
Nodes (13): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+5 more)

### Community 79 - "scheduled-work.ts"
Cohesion: 0.15
Nodes (19): deliverySlot(), closeoutRequestResolved(), metadataRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), requestPriority(), deterministicActions, eligible() (+11 more)

### Community 80 - "digest"
Cohesion: 0.19
Nodes (19): recordedPush(), verifiedCloseoutCleanupRequest(), admitGreen156(), enqueueGreen156(), GREEN156, green156Admitted(), green156Subject(), retainedGreen156Audit() (+11 more)

### Community 81 - "dependencies.ts"
Cohesion: 0.18
Nodes (19): MergeNotifications, Admission, admit(), admitReadyCards(), WAIT_STATUSES, compatible(), dependencyEligibility(), issueKey() (+11 more)

### Community 82 - "github-check-selection.ts"
Cohesion: 0.21
Nodes (18): checksFailed(), checksPassed(), checksPending(), CurrentChecksWait, currentMergeChecks(), pass(), pending(), requireThat() (+10 more)

### Community 83 - "Effects"
Cohesion: 0.25
Nodes (9): GitHubOperations, fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), Assessment, closeNativeRefresh(), fingerprint(), Effects (+1 more)

### Community 84 - "StageResult"
Cohesion: 0.23
Nodes (19): moveLane(), harnessCloseout(), PASSING, verifyMergeActions(), harnessEffect, assertDeliveryMayMutate(), runHarnessStage(), harnessStageResult() (+11 more)

### Community 85 - "artifact"
Cohesion: 0.23
Nodes (18): savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), stoppedBaseHandoffResolved(), stoppedBaseReassessmentReady(), stoppedBaseUpdateResolved(), stoppedBaseReviewContext(), reconcileStoppedBaseHandoff() (+10 more)

### Community 86 - "owned-artifact.ts"
Cohesion: 0.20
Nodes (15): investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, NOTIFY_HELPER, OFFICE_SOURCE_PATHS, officeSource(), ROOT (+7 more)

### Community 87 - "link-draft-issue.ts"
Cohesion: 0.28
Nodes (10): draftReadHeadMatches(), assertDraftClaimHistory(), linkDraftIssue(), protectedOriginalClaim(), publicationReadArgs(), Read, readPublication(), assertWorkerLane() (+2 more)

### Community 88 - "preferences-store.ts"
Cohesion: 0.17
Nodes (10): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS (+2 more)

### Community 89 - "report.ts"
Cohesion: 0.26
Nodes (13): Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked(), row() (+5 more)

### Community 90 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 91 - "cli.ts"
Cohesion: 0.20
Nodes (8): ref_node_stream, ref_node_timers, args, [cmd,...rawArgs], commands, key, projectIndex, PORT

### Community 92 - "delivery-authority.ts"
Cohesion: 0.50
Nodes (6): deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), requireDeliveryAuthority(), gateRegisteredDelivery(), resolveDeliveryWork()

### Community 93 - "capture-session-clone.py"
Cohesion: 0.15
Nodes (10): ctypes, errno, importlib_util, json, os, pathlib, Copy a coherent macOS clone of inherited reader fd3 to anonymous target fd4. No…, Read-only protocol adapter for the installed review helper. No model dispatch. (+2 more)

### Community 94 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (10): ref_react_three_drei, ref_react_three_fiber, ref_three_stdlib, CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility (+2 more)

### Community 95 - "createConstellation"
Cohesion: 0.19
Nodes (5): ConstellationRuntime, createConstellation(), enter(), finishTap(), move()

### Community 97 - "ref_zod"
Cohesion: 0.23
Nodes (8): ref_zod, BrainStatusSchema, identity, brainCheckpointCompletion(), coverageSchema, followupSchema, verified, reconcileCompletedCheckpoints()

### Community 99 - "install-service.mjs"
Cohesion: 0.29
Nodes (5): ref_node_child_process, file, folder, logs, root

### Community 102 - "contract.ts"
Cohesion: 0.17
Nodes (15): Event, one(), prePushRejection(), PushIdentity, settledPushBoundary(), At, errno, GroupInventory (+7 more)

### Community 103 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 104 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 105 - "github-readiness.ts"
Cohesion: 0.11
Nodes (41): resume(), resumeProviderReviews(), APPROACH_GUIDANCE, reviewInstructions(), deliveryTask(), DeliveryTaskInput, hasUncertainEffects(), observe() (+33 more)

### Community 109 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (6): ref_mammoth, ref_pdfjs_dist, bounded(), extract(), fail(), [path,kind]

## Knowledge Gaps
- **478 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+473 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 612 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `github-delivery.ts`, `accept-stage-result.ts`, `scheduler.ts`, `config.ts`, `worker-runtime.ts`, `daily-cto.ts`, `post-conflict-preparation.ts`, `session-bridge.ts`, `source-amendment.ts`, `TicketJob`, `assignments.ts`, `scheduled-captures.ts`, `ref_node_path`, `conversations/conversations.ts`, `cec/workflow.ts`, `run-retrospective.ts`, `features.ts`, `.transaction`, `demand-facts.ts`, `index.tsx`, `maintenance/maintenance.ts`, `knowledge.ts`, `continuationWorkerProof`, `record-trigger.ts`, `azure.ts`, `enrollment-gate.ts`, `publish-pr.ts`, `verifyRepairCandidate`, `process.ts`, `dependency-bots/adopt.ts`, `cost-ledger.ts`, `assignment-poll.ts`, `ledger.ts`, `coordination.ts`, `requests.ts`, `agents.ts`, `jira-time.ts`, `ticket-evidence.ts`, `index.ts`, `shared.ts`, `workKey`, `scope-repair-resume.ts`, `.save`, `JiraIssuePublisher`, `Coordinator`, `time-scope.ts`, `.emit`, `Engine`, `run-accounting.ts`, `weekly-rollup.ts`, `publication.ts`, `http/commands.ts`, `retrospective-subject.ts`, `blocker-followups.ts`, `create-candidate.ts`, `run.ts`, `delivery-recoveries.ts`, `activation-recovery.ts`, `it-specialist.ts`, `admit-improvement.ts`, `scheduled-work.ts`, `digest`, `dependencies.ts`, `Effects`, `owned-artifact.ts`, `link-draft-issue.ts`, `delivery-authority.ts`, `offices.ts`, `ref_zod`, `WorkerRuntime`, `github-readiness.ts`?**
  _High betweenness centrality (0.104) - this node is a cross-community bridge._
- **Why does `sanitizeObject()` connect `Store` to `accept-stage-result.ts`, `http/commands.ts`, `worker-runtime.ts`, `daily-cto.ts`, `post-conflict-preparation.ts`, `delivery-recoveries.ts`, `local-config.ts`, `ref_node_path`, `conversations/conversations.ts`, `agents.ts`, `Effects`, `index.ts`, `owned-artifact.ts`, `scope-repair-resume.ts`, `.save`, `azure.ts`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `Role` connect `Role` to `github-delivery.ts`, `accept-stage-result.ts`, `scheduler.ts`, `worker-runtime.ts`, `App.tsx`, `TicketJob`, `conversations/conversations.ts`, `cec/workflow.ts`, `index.tsx`, `maintenance/maintenance.ts`, `Conversation.tsx`, `Inspector.tsx`, `OfficeScene.tsx`, `outbox.ts`, `requests.ts`, `projects.ts`, `agents.ts`, `shared.ts`, `.emit`, `run-accounting.ts`, `Store`, `http/commands.ts`, `retrospective-subject.ts`, `link-draft-issue.ts`, `scene-motion.ts`, `github-readiness.ts`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _478 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `github-delivery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10196078431372549 - nodes in this community are weakly interconnected._
- **Should `accept-stage-result.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13399778516057587 - nodes in this community are weakly interconnected._
- **Should `scheduler.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1477832512315271 - nodes in this community are weakly interconnected._