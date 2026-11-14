# Graph Report - office-jira-status-readback-nov14  (2026-11-14)

## Corpus Check
- 784 files · ~321,550 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3980 nodes · 18572 edges · 109 communities (100 shown, 9 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 598 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `87fd5eba`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- github-delivery.ts
- artifact
- ref_node_path
- ref_react
- agents.ts
- coordination.ts
- index.tsx
- run-accounting.ts
- session-bridge.ts
- GitHubDelivery
- authorize.ts
- Inspector.tsx
- App.tsx
- reader.ts
- .transaction
- scheduled-captures.ts
- run-retrospective.ts
- Store
- features.ts
- sanitize
- conversations/conversations.ts
- record-trigger.ts
- worker-runtime.ts
- .activeClaims
- packed165-admission.ts
- TimeBook.tsx
- shared.ts
- it-specialist.ts
- closeout-recovery.ts
- work-summary.ts
- Role
- source-amendment.ts
- ticket-evidence.ts
- scheduler.ts
- retrospective-subject.ts
- outbox.ts
- scheduled-work.ts
- goal-reviews.ts
- run.ts
- telemetry.ts
- cost-ledger.ts
- candidate.ts
- ref_zod
- dependency-bots/adopt.ts
- Coordinator
- config.ts
- OfficeScene.tsx
- time-scope.ts
- store.ts
- .save
- blocker-followups.ts
- file-lesson-issue.ts
- OfficeSnapshot
- Engine
- GitHubIssuePublisher
- Goals.tsx
- accept-retrospective.ts
- assignments.ts
- maintenance/maintenance.ts
- work.ts
- jira-time.ts
- cec/workflow.ts
- weekly-rollup.ts
- remove-candidate.ts
- index.ts
- .emit
- cec/issue-publication.ts
- offices.ts
- QuestionStepper.tsx
- process.ts
- constellation-runtime.ts
- assignment-poll.ts
- knowledge.ts
- .getEffect
- local-config.ts
- owned-artifact.ts
- digest
- engine.ts
- node-visuals.ts
- fact-bounds.ts
- ref_node_crypto
- Ticket
- report.ts
- scene-motion.ts
- publication.ts
- capture-session-clone.py
- RoomCamera.tsx
- ledger.ts
- createConstellation
- Offices
- time-readback.ts
- cli.ts
- github.ts
- command-registry.ts
- Agents
- checkpoint-completion.ts
- retire-history.ts
- extract-worker.mjs
- create-candidate.ts
- codex-rollout.ts
- install-service.mjs
- merge-summary.ts
- server_delivery_harness_delivery_authority_resolvedeliverywork
- server_features_questions_pending_round_pendinground
- server_features_questions_pending_round_pendingrounds
- server_features_questions_pending_round_roundauthor
- src_shared_personas
- src_shared_workkey
- ProjectProgress

## God Nodes (most connected - your core abstractions)
1. `Store` - 353 edges
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
- `LessonBrainOverlap` --references--> `Lesson`  [EXTRACTED]
  server/knowledge/lesson-brain-audit.ts → src/contracts/knowledge.ts
- `DeliverySlot` --references--> `Role`  [EXTRACTED]
  server/office/projects.ts → src/shared.ts
- `projectOutbox()` --calls--> `deferredPickup()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/pickup-state.ts
- `projectOutbox()` --calls--> `parkedProviderWait()`  [EXTRACTED]
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

## Communities (109 total, 9 thin omitted)

### Community 0 - "github-delivery.ts"
Cohesion: 0.05
Nodes (107): findingsBlock(), requireDeliveryAuthority(), assertDeliveryMayMutate(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery(), BOARD_RULE (+99 more)

### Community 1 - "artifact"
Cohesion: 0.05
Nodes (135): containedFile(), acceptStageResult(), recordJobApproach(), mergeAuthorized(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration() (+127 more)

### Community 2 - "ref_node_path"
Cohesion: 0.05
Nodes (96): ref_node_fs, ref_node_os, ref_node_path, ref_node_util, interruptedImplementation(), Assessment, discoveryRecoveryCandidate(), Ownership (+88 more)

### Community 3 - "ref_react"
Cohesion: 0.07
Nodes (62): ref_react, ref_react_markdown, ref_remark_gfm, ref_yaml, KnowledgeActivity, KnowledgeEdge, KnowledgeMap, KnowledgeNode (+54 more)

### Community 4 - "agents.ts"
Cohesion: 0.07
Nodes (43): implementationWorkerContext(), IntakeBinding, intakeEnumeration(), intakeMembership(), cecPrompt(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt() (+35 more)

### Community 5 - "coordination.ts"
Cohesion: 0.07
Nodes (44): Admission, IntakeContext, WAIT_STATUSES, resumeParked(), compatible(), dependencyCompletionKey(), dependencyEligibility(), DependencyStores (+36 more)

### Community 6 - "index.tsx"
Cohesion: 0.10
Nodes (49): FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures(), SaveFeedback(), TONE (+41 more)

### Community 7 - "run-accounting.ts"
Cohesion: 0.11
Nodes (30): BoundedRead, EvidenceOutcome, backfillClaudeCost(), CompletionReader, codexHome(), createdAt(), dayDirs(), header() (+22 more)

### Community 8 - "session-bridge.ts"
Cohesion: 0.07
Nodes (46): ref_ws, claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexDaemonProcesses(), accountCodexProcesses(), codexProcessInventory (+38 more)

### Community 9 - "GitHubDelivery"
Cohesion: 0.07
Nodes (40): removeAdoptedClone(), namedRepairIds(), pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), StageContext, GitHubDelivery, completedPRReviews(), eligible() (+32 more)

### Community 10 - "authorize.ts"
Cohesion: 0.08
Nodes (48): approveFeature(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), artifactPath(), digest(), document() (+40 more)

### Community 11 - "Inspector.tsx"
Cohesion: 0.12
Nodes (59): blockedSummary(), currentServices(), ServiceHealthPanel(), followUp(), labels, ServiceHealthRow(), BlockerFollowups(), LearningCoverage() (+51 more)

### Community 12 - "App.tsx"
Cohesion: 0.06
Nodes (42): ref_lucide_react, ref_motion, ref_react_dom, BrainDrawer(), themeColor, App(), BrainWorkspace, CONNECTION (+34 more)

### Community 13 - "reader.ts"
Cohesion: 0.08
Nodes (34): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, CommittedBrain (+26 more)

### Community 14 - ".transaction"
Cohesion: 0.17
Nodes (14): featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), wakeFeature(), recoverFeatures(), helperInstallation(), observeHelperGroups(), stopHelperGroups() (+6 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.17
Nodes (35): assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest, captureRequests(), failCapture(), requestCapture(), saveCaptureRequest() (+27 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.10
Nodes (39): acceptRetrospective(), BLOCKING, blockingTrigger, isBlocking(), brainOverlap, brainOverlapQuery(), clip(), fits() (+31 more)

### Community 17 - "Store"
Cohesion: 0.10
Nodes (8): GitHubFeaturePublisher, JiraFeaturePublisher, Assessment, Store, command(), WorkerRuntime, Feature, OfficeEvent

### Community 18 - "features.ts"
Cohesion: 0.08
Nodes (46): commandFeature(), reviewQuestions(), assertEnrollable(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS, assertQuestionVisibility(), applyHarnessAction() (+38 more)

### Community 19 - "sanitize"
Cohesion: 0.11
Nodes (31): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+23 more)

### Community 20 - "conversations/conversations.ts"
Cohesion: 0.09
Nodes (27): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+19 more)

### Community 21 - "record-trigger.ts"
Cohesion: 0.12
Nodes (36): expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences(), clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates() (+28 more)

### Community 22 - "worker-runtime.ts"
Cohesion: 0.08
Nodes (35): candidateWorkspaceEnvironment(), assignmentSubject(), dispatchExposure(), prepareExposure(), LessonSelection, catalogLine(), assertBriefingScope(), boundEvidence() (+27 more)

### Community 23 - ".activeClaims"
Cohesion: 0.14
Nodes (24): deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, deliveryIntakeBlocker(), gateRegisteredDelivery(), resolveDeliveryWork(), boardPreflightCandidate() (+16 more)

### Community 24 - "packed165-admission.ts"
Cohesion: 0.08
Nodes (48): accounting, DeliverySubject, nonDelivery, originalReads, HarnessControl, draftReadHeadMatches(), assertDraftClaimHistory(), linkDraftIssue() (+40 more)

### Community 25 - "TimeBook.tsx"
Cohesion: 0.17
Nodes (22): src_shared_liveanchor, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens(), usd(), KpiTiles() (+14 more)

### Community 26 - "shared.ts"
Cohesion: 0.05
Nodes (48): fields, PreferencesPatch, PreferencesStore, StoredBody, DailyCTOSummary, PackedPublicationRepair, SlackReplacementRequest, SlackSupersession (+40 more)

### Community 27 - "it-specialist.ts"
Cohesion: 0.11
Nodes (21): partialLocalCleanupKey(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), ITContext, publishITReport(), delays (+13 more)

### Community 28 - "closeout-recovery.ts"
Cohesion: 0.11
Nodes (43): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+35 more)

### Community 29 - "work-summary.ts"
Cohesion: 0.09
Nodes (41): compactSteps(), displayAgentTask(), LiveAgentTask(), Props, RunningTask(), text(), Agent, lastWall (+33 more)

### Community 30 - "Role"
Cohesion: 0.10
Nodes (43): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+35 more)

### Community 31 - "source-amendment.ts"
Cohesion: 0.06
Nodes (75): ref_node_async_hooks, APPROACH_GUIDANCE, deliveryTask(), DeliveryTaskInput, DISCOVERY_GUIDANCE, adoptCandidate(), reported, Scope (+67 more)

### Community 32 - "ticket-evidence.ts"
Cohesion: 0.15
Nodes (22): ref_node_string_decoder, assetDownloader(), attachmentKind(), evidenceDirectory(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS (+14 more)

### Community 33 - "scheduler.ts"
Cohesion: 0.14
Nodes (15): ROLES, officeCapacity, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch() (+7 more)

### Community 34 - "retrospective-subject.ts"
Cohesion: 0.13
Nodes (23): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, maintenanceKey(), azurePrUrl(), findSubject(), jobSubject() (+15 more)

### Community 35 - "outbox.ts"
Cohesion: 0.12
Nodes (24): projectOutbox(), syncOutbox(), projectSlackDeliveries(), settleRequestedSlackReplacement(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint() (+16 more)

### Community 36 - "scheduled-work.ts"
Cohesion: 0.12
Nodes (29): deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), metadataRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), requestPriority() (+21 more)

### Community 37 - "goal-reviews.ts"
Cohesion: 0.14
Nodes (15): applyGoalReview(), DailyResultSchema, EvidenceRefSchema, FreshDailyResultSchema, GoalEvidenceRequestSchema, statusAllowed(), workEvidence(), DailyCTOBriefing (+7 more)

### Community 38 - "run.ts"
Cohesion: 0.18
Nodes (15): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, OFFICE_FIX_PROMPT, OfficeFixResult, validateOfficeFix(), investigationReady(), InvestigationOptions, InvestigationReport (+7 more)

### Community 39 - "telemetry.ts"
Cohesion: 0.09
Nodes (27): CodexRollout, CacheWriteDuration, CODEX_ROWS, ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL, Rates (+19 more)

### Community 40 - "cost-ledger.ts"
Cohesion: 0.15
Nodes (28): captureCost(), server_telemetry_cost_entries_costcoveragesummary, costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId() (+20 more)

### Community 41 - "candidate.ts"
Cohesion: 0.12
Nodes (25): GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles(), ContinuationIO (+17 more)

### Community 42 - "ref_zod"
Cohesion: 0.14
Nodes (18): ref_zod, channelNoticeAuthorized(), ChannelSettings, notices(), queueChannelNotice(), Identity, MergeNotifications, NoticeSettings (+10 more)

### Community 43 - "dependency-bots/adopt.ts"
Cohesion: 0.05
Nodes (89): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard, projectCards() (+81 more)

### Community 44 - "Coordinator"
Cohesion: 0.08
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 45 - "config.ts"
Cohesion: 0.17
Nodes (27): ref_node_url, createFeature(), discoveryPrompt(), planPrompt(), currentApproval(), automaticIntakeWait(), reserveReplacement(), stageBudget() (+19 more)

### Community 46 - "OfficeScene.tsx"
Cohesion: 0.16
Nodes (34): withoutElapsed(), Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk() (+26 more)

### Community 47 - "time-scope.ts"
Cohesion: 0.12
Nodes (33): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), server_telemetry_billable_work_issue_key, isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence() (+25 more)

### Community 48 - "store.ts"
Cohesion: 0.10
Nodes (19): ref_node_sqlite, Clock, systemClock, applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, EffectOperation (+11 more)

### Community 49 - ".save"
Cohesion: 0.26
Nodes (22): BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue(), readIssues(), commentDecision() (+14 more)

### Community 50 - "blocker-followups.ts"
Cohesion: 0.23
Nodes (13): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), assignmentDiagnostics(), readBackConversations(), diagnosticContext(), diagnosticSnapshot() (+5 more)

### Community 51 - "file-lesson-issue.ts"
Cohesion: 0.80
Nodes (4): fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), lessonText()

### Community 52 - "OfficeSnapshot"
Cohesion: 0.09
Nodes (42): Conversation(), SendMessage, LessonDecisionAction, lessonDecisionState(), readLessonDecision(), Outbox(), ctoInputFailure(), OutboxCTOInput() (+34 more)

### Community 53 - "Engine"
Cohesion: 0.09
Nodes (5): correlatedBuild(), Engine, observe(), observeParked(), parkedReadError

### Community 54 - "GitHubIssuePublisher"
Cohesion: 0.19
Nodes (6): FeaturePublisher, GitHubIssuePublisher, number(), same(), FeatureManifestItem, FeatureOperation

### Community 55 - "Goals.tsx"
Cohesion: 0.13
Nodes (21): GoalProgress, CTOReview(), goalState, DailyCTO(), GoalHistory(), load(), reportDate(), reviewStatus (+13 more)

### Community 56 - "accept-retrospective.ts"
Cohesion: 0.13
Nodes (24): Accepted, RETROSPECTIVE_HISTORY, Shared, admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident() (+16 more)

### Community 57 - "assignments.ts"
Cohesion: 0.10
Nodes (26): clip(), DEMAND_LIMIT, demandFacts(), DemandSection, key(), LessonKey, notes(), assignmentLookups (+18 more)

### Community 58 - "maintenance/maintenance.ts"
Cohesion: 0.07
Nodes (39): maintenancePolicies(), captureMaintenanceStep(), completeNativeCheckpoint(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice() (+31 more)

### Community 59 - "work.ts"
Cohesion: 0.11
Nodes (21): BLOCKED_CAUSES, blockedCauses(), projectReadiness(), READ_OPERATIONS, RETAINED_PER_ACTION, ProjectReadiness, AssignmentResult, BlockedCause (+13 more)

### Community 60 - "jira-time.ts"
Cohesion: 0.22
Nodes (13): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+5 more)

### Community 61 - "cec/workflow.ts"
Cohesion: 0.12
Nodes (35): applyIntakeObservation(), parksInJira(), MISSING_SAVED_PLAN, recoverSavedPlan(), run(), verifiedTransition(), advance(), nextStage() (+27 more)

### Community 62 - "weekly-rollup.ts"
Cohesion: 0.08
Nodes (35): learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), retire(), RollupResult, harperFolder() (+27 more)

### Community 63 - "remove-candidate.ts"
Cohesion: 0.18
Nodes (18): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot() (+10 more)

### Community 64 - "index.ts"
Cohesion: 0.06
Nodes (52): ref_hono_node_server, ref_node_http, ref_smol_toml, ref_vite, implementationPreview(), implementationContinuationRoute(), close(), config (+44 more)

### Community 65 - ".emit"
Cohesion: 0.16
Nodes (27): decideImplementation(), configureChannelNotices(), configureNotices(), retryRecipientLookup(), recoverCTOInput(), enqueueGreen156(), bindDiscoveryResume(), DiscoveryResumeInput (+19 more)

### Community 66 - "cec/issue-publication.ts"
Cohesion: 0.17
Nodes (12): intakeJql(), intakeLocation(), Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), Transition (+4 more)

### Community 67 - "offices.ts"
Cohesion: 0.13
Nodes (13): QuestionNotifications, leadershipContext(), queueLessonIssueCheck(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), queueImprovements(), seedOfficeLessons() (+5 more)

### Community 68 - "QuestionStepper.tsx"
Cohesion: 0.19
Nodes (18): FeatureQuestionProjection, OutboxQuestionRound(), send(), draftKey(), readDraft(), saveDraft(), QuestionRound(), nextQuestion() (+10 more)

### Community 69 - "process.ts"
Cohesion: 0.14
Nodes (19): Event, one(), prePushRejection(), PushIdentity, Candidate, settledPushBoundary(), inactivityWatch(), At (+11 more)

### Community 70 - "constellation-runtime.ts"
Cohesion: 0.15
Nodes (17): ref_3d_force_graph, ref_three, CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point (+9 more)

### Community 71 - "assignment-poll.ts"
Cohesion: 0.26
Nodes (12): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), admitReadyCards(), due() (+4 more)

### Community 72 - "knowledge.ts"
Cohesion: 0.04
Nodes (66): normalizeStatement(), curateLesson(), Curation, CurationAction, mergeEvidence(), INSTALLED, installedLesson(), Bucket (+58 more)

### Community 73 - ".getEffect"
Cohesion: 0.19
Nodes (12): diagnosticProof(), ownedArtifact(), rawHash(), recoverDiscovery(), scopeNote(), GitHubOperations, goalNoticeNeverDispatched(), closeNativeRefresh() (+4 more)

### Community 74 - "local-config.ts"
Cohesion: 0.17
Nodes (16): projectListScope(), AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), goalEvidencePath(), localBindings, assertModelOverrides(), CODEX_DEFAULT_EFFORT, CODEX_DEFAULT_MODEL (+8 more)

### Community 75 - "owned-artifact.ts"
Cohesion: 0.25
Nodes (14): investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_SOURCE_PATHS, officeSource(), ROOT, done() (+6 more)

### Community 76 - "digest"
Cohesion: 0.09
Nodes (55): ctoInputRecovered(), Execute, installDependencies(), major(), harnessCloseout(), PASSING, verifyMergeActions(), activeEffectId() (+47 more)

### Community 77 - "engine.ts"
Cohesion: 0.15
Nodes (27): continueImplementation(), checkMail(), drainMail(), requestMail(), dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery() (+19 more)

### Community 78 - "node-visuals.ts"
Cohesion: 0.20
Nodes (13): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+5 more)

### Community 79 - "fact-bounds.ts"
Cohesion: 0.23
Nodes (16): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+8 more)

### Community 80 - "ref_node_crypto"
Cohesion: 0.25
Nodes (14): ref_node_crypto, readEvidence(), ProviderEvidence, canonical(), evidenceDigest(), evidenceHash(), semantic(), stableUrl() (+6 more)

### Community 81 - "Ticket"
Cohesion: 0.26
Nodes (10): CommentPage, commentReadback(), JiraOperations, plain(), jiraRecord(), unpack(), metadataDigest(), verifyAlreadyAtStatus() (+2 more)

### Community 82 - "report.ts"
Cohesion: 0.33
Nodes (11): Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked(), row() (+3 more)

### Community 83 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 84 - "publication.ts"
Cohesion: 0.26
Nodes (7): featureById(), publishFeature(), reconcilePublication(), uncertainPublications(), reserveIdentity(), FeatureWorkflow, EffectUncertainError

### Community 85 - "capture-session-clone.py"
Cohesion: 0.15
Nodes (10): ctypes, errno, importlib_util, json, os, pathlib, Copy a coherent macOS clone of inherited reader fd3 to anonymous target fd4. No…, Read-only protocol adapter for the installed review helper. No model dispatch. (+2 more)

### Community 86 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (10): ref_react_three_drei, ref_react_three_fiber, ref_three_stdlib, CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility (+2 more)

### Community 87 - "ledger.ts"
Cohesion: 0.33
Nodes (10): investigationCandidates(), investigationId(), investigationFollowUps(), investigationResolution(), syncInvestigations(), NOTIFY_HELPER, notifyHelperResolution(), requeueInvestigationEvidence() (+2 more)

### Community 88 - "createConstellation"
Cohesion: 0.19
Nodes (5): ConstellationRuntime, createConstellation(), enter(), finishTap(), move()

### Community 90 - "time-readback.ts"
Cohesion: 0.19
Nodes (10): TimeLedger, Readback, READBACK_INTERVAL_MS, readBackTime(), SETTLE_MS, ConfirmedSegment, LiveAnchor, ObservationGap (+2 more)

### Community 91 - "cli.ts"
Cohesion: 0.17
Nodes (10): ref_node_stream, ref_node_timers, args, [cmd,...rawArgs], commands, key, projectIndex, lessonBrainAudit (+2 more)

### Community 92 - "github.ts"
Cohesion: 0.29
Nodes (6): GitHubMonitor, githubPRDescription(), GOAL_EVIDENCE_LIMITS, GitHubBoard, GitHubPR, GitHubState

### Community 93 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 95 - "checkpoint-completion.ts"
Cohesion: 0.28
Nodes (6): BrainStatusSchema, brainCheckpointCompletion(), coverageSchema, followupSchema, verified, reconcileCompletedCheckpoints()

### Community 96 - "retire-history.ts"
Cohesion: 0.36
Nodes (6): historicalRecordDigest(), Intent, records(), retireIncompleteHistory(), HistoryRetirement, HistoryRetirementIntent

### Community 97 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (6): ref_mammoth, ref_pdfjs_dist, bounded(), extract(), fail(), [path,kind]

### Community 98 - "create-candidate.ts"
Cohesion: 0.48
Nodes (6): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf()

### Community 99 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 100 - "install-service.mjs"
Cohesion: 0.18
Nodes (10): ref_node_child_process, file, folder, logs, root, GIT_NETWORK, LIVE_PROVIDERS, liveReach() (+2 more)

### Community 101 - "merge-summary.ts"
Cohesion: 0.36
Nodes (7): clamp(), LIMITS, MergedPR, plainSlackText(), section(), shippedSummary(), mergeText()

## Knowledge Gaps
- **490 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+485 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 632 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `github-delivery.ts`, `artifact`, `ref_node_path`, `agents.ts`, `coordination.ts`, `run-accounting.ts`, `session-bridge.ts`, `GitHubDelivery`, `authorize.ts`, `reader.ts`, `.transaction`, `scheduled-captures.ts`, `run-retrospective.ts`, `features.ts`, `sanitize`, `conversations/conversations.ts`, `record-trigger.ts`, `worker-runtime.ts`, `.activeClaims`, `packed165-admission.ts`, `it-specialist.ts`, `closeout-recovery.ts`, `source-amendment.ts`, `ticket-evidence.ts`, `scheduler.ts`, `retrospective-subject.ts`, `outbox.ts`, `scheduled-work.ts`, `goal-reviews.ts`, `run.ts`, `cost-ledger.ts`, `candidate.ts`, `ref_zod`, `dependency-bots/adopt.ts`, `config.ts`, `time-scope.ts`, `store.ts`, `.save`, `blocker-followups.ts`, `file-lesson-issue.ts`, `OfficeSnapshot`, `accept-retrospective.ts`, `assignments.ts`, `maintenance/maintenance.ts`, `jira-time.ts`, `cec/workflow.ts`, `weekly-rollup.ts`, `remove-candidate.ts`, `index.ts`, `.emit`, `cec/issue-publication.ts`, `offices.ts`, `process.ts`, `knowledge.ts`, `.getEffect`, `owned-artifact.ts`, `digest`, `engine.ts`, `ref_node_crypto`, `Ticket`, `publication.ts`, `ledger.ts`, `time-readback.ts`, `github.ts`, `checkpoint-completion.ts`, `retire-history.ts`, `create-candidate.ts`?**
  _High betweenness centrality (0.105) - this node is a cross-community bridge._
- **Why does `Engine` connect `Engine` to `github-delivery.ts`, `artifact`, `offices.ts`, `scheduled-work.ts`, `coordination.ts`, `candidate.ts`, `ref_zod`, `engine.ts`, `scheduled-captures.ts`, `Store`, `Ticket`, `sanitize`, `conversations/conversations.ts`, `publication.ts`, `maintenance/maintenance.ts`, `github.ts`, `cec/workflow.ts`, `Agents`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `Role` connect `Role` to `github-delivery.ts`, `artifact`, `agents.ts`, `run-accounting.ts`, `GitHubDelivery`, `Inspector.tsx`, `App.tsx`, `conversations/conversations.ts`, `worker-runtime.ts`, `packed165-admission.ts`, `shared.ts`, `scheduler.ts`, `retrospective-subject.ts`, `outbox.ts`, `OfficeScene.tsx`, `store.ts`, `blocker-followups.ts`, `OfficeSnapshot`, `maintenance/maintenance.ts`, `work.ts`, `cec/workflow.ts`, `index.ts`, `.emit`, `local-config.ts`, `scene-motion.ts`, `Agents`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _490 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `github-delivery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.048232662192393735 - nodes in this community are weakly interconnected._
- **Should `artifact` be split into smaller, more focused modules?**
  _Cohesion score 0.05416666666666667 - nodes in this community are weakly interconnected._
- **Should `ref_node_path` be split into smaller, more focused modules?**
  _Cohesion score 0.049271339347675226 - nodes in this community are weakly interconnected._