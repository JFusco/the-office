# Graph Report - office-followup-clarity-nov13  (2026-11-13)

## Corpus Check
- 762 files · ~313,842 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3885 nodes · 18207 edges · 97 communities (93 shown, 4 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 590 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `559e341f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ref_node_path
- github-delivery.ts
- workKey
- agents.ts
- MapView.tsx
- Store
- Inspector.tsx
- cec/workflow.ts
- source-amendment.ts
- features/workflow.ts
- shared.ts
- App.tsx
- session-bridge.ts
- knowledge.ts
- features.ts
- scheduled-captures.ts
- digest
- record-trigger.ts
- delivery-recoveries.ts
- lesson-selection.ts
- PeoplePanel.tsx
- index.ts
- conversations/conversations.ts
- github-readiness.ts
- QuestionStepper.tsx
- post-conflict-preparation.ts
- recovery/stopped-base-update.ts
- azure.ts
- maintenance/maintenance.ts
- TimeBook.tsx
- accept-stage-result.ts
- run-retrospective.ts
- demand-facts.ts
- assignments.ts
- time-scope.ts
- dependencies.ts
- index.tsx
- requests.ts
- worker-runtime.ts
- outbox.ts
- owned-artifact.ts
- run.ts
- retrospective-subject.ts
- it-specialist.ts
- OfficeScene.tsx
- contract.ts
- cost-ledger.ts
- engine.ts
- dependency-bots/adopt.ts
- api-routes.ts
- cec/issue-publication.ts
- ledger.ts
- admit-improvement.ts
- run-accounting.ts
- .emit
- weekly-rollup.ts
- telemetry.ts
- Outbox.tsx
- scheduler.ts
- scheduled-work.ts
- Goals.tsx
- blocker-followups.ts
- remove-candidate.ts
- service-health.ts
- jira-time.ts
- .save
- coordination.ts
- constellation-runtime.ts
- coordination-tick.ts
- fact-bounds.ts
- goal-reviews.ts
- .transaction
- Coordinator
- ref_node_crypto
- local-config.ts
- work.ts
- control-store.ts
- assignment-poll.ts
- normalize-question.ts
- delivery-task.ts
- node-visuals.ts
- json
- report.ts
- scene-motion.ts
- codex-rollout.ts
- install-service.mjs
- RoomCamera.tsx
- ref_zod
- createConstellation
- conversations/slack.ts
- Offices
- pre-push-boundary.ts
- CommittedBrain
- CommandRegistry
- handover-cms.ts
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
- `projectOutbox()` --calls--> `parkedProviderWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts
- `projectOutbox()` --calls--> `readinessWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts
- `replacementContext()` --calls--> `slackMessageUrl()`  [EXTRACTED]
  server/conversations/slack/supersession-proof.ts → src/shared.ts
- `pump()` --calls--> `deferredPickup()`  [EXTRACTED]
  server/conversations/team-conversation-pump.ts → src/work/pickup-state.ts
- `DeliveryAuthorityInput` --references--> `HarnessRequest`  [EXTRACTED]
  server/delivery/harness/delivery-authority.ts → src/contracts/work.ts

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

## Communities (97 total, 4 thin omitted)

### Community 0 - "ref_node_path"
Cohesion: 0.05
Nodes (114): ref_node_fs, ref_node_os, ref_node_path, ref_node_util, closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim() (+106 more)

### Community 1 - "github-delivery.ts"
Cohesion: 0.05
Nodes (82): Execute, installDependencies(), major(), removeAdoptedClone(), harnessCloseout(), PASSING, verifyMergeActions(), namedRepairIds() (+74 more)

### Community 2 - "workKey"
Cohesion: 0.06
Nodes (94): recordJobApproach(), completedPRReviews(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash (+86 more)

### Community 3 - "agents.ts"
Cohesion: 0.06
Nodes (55): IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), intakeMembership(), projectListScope(), cecPrompt(), cecIntakePrompt() (+47 more)

### Community 4 - "MapView.tsx"
Cohesion: 0.07
Nodes (61): ref_react_markdown, ref_remark_gfm, ref_yaml, KnowledgeActivity, KnowledgeEdge, KnowledgeMap, KnowledgeNode, Activity() (+53 more)

### Community 5 - "Store"
Cohesion: 0.03
Nodes (44): GitHubFeaturePublisher, JiraFeaturePublisher, QuestionNotifications, GitHubMonitor, Assign, Board, Content, queueLessonIssueCheck() (+36 more)

### Community 6 - "Inspector.tsx"
Cohesion: 0.12
Nodes (59): ServiceHealthPanel(), followUp(), labels, ServiceHealthRow(), BlockerFollowups(), LearningCoverage(), LessonsPanel(), when() (+51 more)

### Community 7 - "cec/workflow.ts"
Cohesion: 0.11
Nodes (37): applyIntakeObservation(), checkMail(), drainMail(), requestMail(), parksInJira(), MISSING_INTAKE, reconcileMailbox(), unusedMailbox() (+29 more)

### Community 8 - "source-amendment.ts"
Cohesion: 0.06
Nodes (71): ref_node_async_hooks, adoptCandidate(), reported, Scope, directionContract(), scopeRepairDirection(), approvedText(), assert() (+63 more)

### Community 9 - "features/workflow.ts"
Cohesion: 0.08
Nodes (57): approveFeature(), commandFeature(), featureById(), mutation(), reviewQuestions(), assertFeatureDependencyOrder(), featureDependencyEdges(), key() (+49 more)

### Community 10 - "shared.ts"
Cohesion: 0.04
Nodes (61): fields, PreferencesPatch, StoredBody, ProjectReadiness, DailyCTOSummary, PackedPublicationRepair, SlackReplacementRequest, SlackSupersession (+53 more)

### Community 11 - "App.tsx"
Cohesion: 0.06
Nodes (54): ref_lucide_react, ref_motion, ref_react_dom, BrainDrawer(), themeColor, App(), BrainWorkspace, CONNECTION (+46 more)

### Community 12 - "session-bridge.ts"
Cohesion: 0.07
Nodes (45): ref_ws, claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexDaemonProcesses(), accountCodexProcesses(), codexProcessInventory (+37 more)

### Community 13 - "knowledge.ts"
Cohesion: 0.04
Nodes (59): ref_node_stream, ref_node_timers, args, [cmd,...rawArgs], commands, key, projectIndex, normalizeStatement() (+51 more)

### Community 14 - "features.ts"
Cohesion: 0.06
Nodes (74): featureItemComplete(), reconcileFeatureCompletion(), currentApproval(), automaticIntakeWait(), helperTelemetry(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS (+66 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.15
Nodes (45): createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest, captureRequests() (+37 more)

### Community 16 - "digest"
Cohesion: 0.09
Nodes (59): activeEffectId(), harnessEffect, retryRead(), draftReadHeadMatches(), assertDraftClaimHistory(), linkDraftIssue(), protectedOriginalClaim(), admitPRMetadata() (+51 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.10
Nodes (40): baselineLearning(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences(), clip(), maintenanceBlockedId(), MaintenanceCandidate (+32 more)

### Community 18 - "delivery-recoveries.ts"
Cohesion: 0.15
Nodes (24): deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), deliveryIntakeBlocker(), gateRegisteredDelivery(), resolveDeliveryWork(), HANDS_OFF_PROJECTS, handsOff() (+16 more)

### Community 19 - "lesson-selection.ts"
Cohesion: 0.12
Nodes (23): INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), LessonSelection, MAINTENANCE, MAX_LESSONS (+15 more)

### Community 20 - "PeoplePanel.tsx"
Cohesion: 0.10
Nodes (42): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+34 more)

### Community 21 - "index.ts"
Cohesion: 0.11
Nodes (19): ref_hono_node_server, ref_node_http, ref_vite, close(), config, itSpecialist, loadedRevision, offices (+11 more)

### Community 22 - "conversations/conversations.ts"
Cohesion: 0.08
Nodes (40): assertConversationReadback(), Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff(), saveGoals() (+32 more)

### Community 23 - "github-readiness.ts"
Cohesion: 0.09
Nodes (54): findingsBlock(), hasUncertainEffects(), observe(), assertAutomationEffects(), automationMergePolicy(), observeAutomationMerge(), routeAutomationMerge(), checksFailed() (+46 more)

### Community 24 - "QuestionStepper.tsx"
Cohesion: 0.19
Nodes (18): FeatureQuestionProjection, OutboxQuestionRound(), send(), draftKey(), readDraft(), saveDraft(), nextQuestion(), orderedQuestions() (+10 more)

### Community 25 - "post-conflict-preparation.ts"
Cohesion: 0.10
Nodes (40): assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), reconcileCompletedConflictDraft(), routeReadyPostConflictPublication(), verifyInitialDraftConflictPreparation() (+32 more)

### Community 26 - "recovery/stopped-base-update.ts"
Cohesion: 0.12
Nodes (29): pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), assertStoppedBaseAudit(), AuditRow, CoverageRow, Hash, Kind, stoppedBaseAuditMarker (+21 more)

### Community 27 - "azure.ts"
Cohesion: 0.15
Nodes (21): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+13 more)

### Community 28 - "maintenance/maintenance.ts"
Cohesion: 0.08
Nodes (34): maintenancePolicies(), completeNativeCheckpoint(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice(), candidateOwner() (+26 more)

### Community 29 - "TimeBook.tsx"
Cohesion: 0.10
Nodes (39): AzureBuild, src_shared_liveanchor, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens(), usd() (+31 more)

### Community 30 - "accept-stage-result.ts"
Cohesion: 0.14
Nodes (29): containedFile(), acceptStageResult(), acceptConflictRepair(), pendingPreparationCheck(), METADATA_FINDING, mergeAuthorized(), continuationReviewArtifacts(), reconcileContinuationReview() (+21 more)

### Community 31 - "run-retrospective.ts"
Cohesion: 0.09
Nodes (47): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, blockingTrigger, isBlocking(), brainOverlap (+39 more)

### Community 32 - "demand-facts.ts"
Cohesion: 0.11
Nodes (23): clip(), DEMAND_LIMIT, demandFacts(), DemandSection, key(), LessonKey, notes(), clip() (+15 more)

### Community 33 - "assignments.ts"
Cohesion: 0.09
Nodes (36): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, GraphNode (+28 more)

### Community 34 - "time-scope.ts"
Cohesion: 0.12
Nodes (31): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), server_telemetry_billable_work_issue_key, isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence() (+23 more)

### Community 35 - "dependencies.ts"
Cohesion: 0.18
Nodes (19): Admission, admit(), IntakeContext, WAIT_STATUSES, compatible(), dependencyCompletionKey(), dependencyEligibility(), DependencyStores (+11 more)

### Community 36 - "index.tsx"
Cohesion: 0.12
Nodes (43): ref_react, LinkedFeatures(), SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), loadOfficeConfig(), OfficeConfigSection() (+35 more)

### Community 37 - "requests.ts"
Cohesion: 0.12
Nodes (35): DeliveryAuthorityInput, accounting, DeliverySubject, nonDelivery, originalReads, HarnessControl, withHarnessWork(), hasSavedPrerequisiteResult() (+27 more)

### Community 38 - "worker-runtime.ts"
Cohesion: 0.07
Nodes (38): candidateWorkspaceEnvironment(), ApproachSchema, GITHUB_ISSUE_SKILL, assignmentSubject(), assertBriefingScope(), assertModelOverrides(), CODEX_DEFAULT_EFFORT, CODEX_DEFAULT_MODEL (+30 more)

### Community 39 - "outbox.ts"
Cohesion: 0.10
Nodes (28): ctoInputRecovered(), projectOutbox(), syncOutbox(), projectSlackDeliveries(), settleRequestedSlackReplacement(), Input, supersedeSlackDelivery(), replacementContext() (+20 more)

### Community 40 - "owned-artifact.ts"
Cohesion: 0.25
Nodes (13): investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_SOURCE_PATHS, officeSource(), done(), readBoundedNoFollow() (+5 more)

### Community 41 - "run.ts"
Cohesion: 0.18
Nodes (15): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, OFFICE_FIX_PROMPT, OfficeFixResult, validateOfficeFix(), investigationReady(), requeueInvestigationEvidence(), InvestigationOptions (+7 more)

### Community 42 - "retrospective-subject.ts"
Cohesion: 0.14
Nodes (20): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+12 more)

### Community 43 - "it-specialist.ts"
Cohesion: 0.25
Nodes (12): savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), ITContext, publishITReport(), delays, recoverAttempt() (+4 more)

### Community 44 - "OfficeScene.tsx"
Cohesion: 0.17
Nodes (32): Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk(), ElevatorStage() (+24 more)

### Community 45 - "contract.ts"
Cohesion: 0.23
Nodes (11): At, errno, GroupInventory, GroupProbe, LifecycleDiagnostic, Phase, Pid, groupInventory() (+3 more)

### Community 46 - "cost-ledger.ts"
Cohesion: 0.14
Nodes (29): captureCost(), server_telemetry_cost_entries_costcoveragesummary, costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress() (+21 more)

### Community 47 - "engine.ts"
Cohesion: 0.15
Nodes (22): dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), resume(), startPilot(), MISSING_SAVED_PLAN, recoverSavedPlan() (+14 more)

### Community 48 - "dependency-bots/adopt.ts"
Cohesion: 0.06
Nodes (74): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard, projectCards() (+66 more)

### Community 49 - "api-routes.ts"
Cohesion: 0.22
Nodes (10): diagnosticSnapshot(), nativeDeliveryResolved(), goalHistory(), apiRoute(), projectReadiness(), serviceBusy(), refreshWithin(), SESSION_READ_WAIT (+2 more)

### Community 50 - "cec/issue-publication.ts"
Cohesion: 0.10
Nodes (19): CommentPage, commentReadback(), Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), Transition (+11 more)

### Community 51 - "ledger.ts"
Cohesion: 0.33
Nodes (9): investigationCandidates(), investigationId(), investigationFollowUps(), investigationResolution(), syncInvestigations(), NOTIFY_HELPER, notifyHelperResolution(), retriedReadResolution() (+1 more)

### Community 52 - "admit-improvement.ts"
Cohesion: 0.23
Nodes (14): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+6 more)

### Community 53 - "run-accounting.ts"
Cohesion: 0.14
Nodes (26): BoundedRead, codexHome(), createdAt(), dayDirs(), header(), readCodexRollout(), ROLLOUT_MAX_BYTES, RolloutScan (+18 more)

### Community 54 - ".emit"
Cohesion: 0.19
Nodes (22): configureChannelNotices(), configureNotices(), retryRecipientLookup(), recoverCTOInput(), enqueueGreen156(), failedWorker(), requeueWaitedImplement(), enqueueMetadataRecovery() (+14 more)

### Community 55 - "weekly-rollup.ts"
Cohesion: 0.08
Nodes (35): learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), retire(), RollupResult, harperFolder() (+27 more)

### Community 56 - "telemetry.ts"
Cohesion: 0.09
Nodes (28): CodexRollout, CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL (+20 more)

### Community 57 - "Outbox.tsx"
Cohesion: 0.12
Nodes (30): Conversation(), LessonDecisionAction, lessonDecisionState(), readLessonDecision(), Outbox(), ctoInputFailure(), OutboxCTOInput(), recover() (+22 more)

### Community 58 - "scheduler.ts"
Cohesion: 0.16
Nodes (14): ROLES, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch(), deliveryOccupied() (+6 more)

### Community 59 - "scheduled-work.ts"
Cohesion: 0.15
Nodes (21): deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), metadataRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), requestPriority() (+13 more)

### Community 60 - "Goals.tsx"
Cohesion: 0.08
Nodes (38): GoalProgress, SendMessage, OutboxSavedPlan(), reconcile(), FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace() (+30 more)

### Community 61 - "blocker-followups.ts"
Cohesion: 0.28
Nodes (13): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), readBackConversations(), handoff(), reconcileBlockerFollowups(), clearUnblockBrief() (+5 more)

### Community 62 - "remove-candidate.ts"
Cohesion: 0.18
Nodes (18): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot() (+10 more)

### Community 63 - "service-health.ts"
Cohesion: 0.22
Nodes (8): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, ServiceHealth

### Community 64 - "jira-time.ts"
Cohesion: 0.15
Nodes (20): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+12 more)

### Community 65 - ".save"
Cohesion: 0.12
Nodes (34): correlatedBuild(), BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue(), readIssues() (+26 more)

### Community 66 - "coordination.ts"
Cohesion: 0.13
Nodes (18): PrerequisitesSchema, checkpointWindow(), coordination(), dueAt(), hours, localDay(), ReviewResult, deferNonReady() (+10 more)

### Community 67 - "constellation-runtime.ts"
Cohesion: 0.15
Nodes (17): ref_3d_force_graph, ref_three, CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point (+9 more)

### Community 68 - "coordination-tick.ts"
Cohesion: 0.21
Nodes (11): reconcileNoticeConfirmations(), brainCheckpointCompletion(), reconcileCompletedCheckpoints(), legacy, reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION (+3 more)

### Community 69 - "fact-bounds.ts"
Cohesion: 0.20
Nodes (17): leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance() (+9 more)

### Community 70 - "goal-reviews.ts"
Cohesion: 0.11
Nodes (18): applyGoalReview(), DailyResultSchema, EvidenceRefSchema, FreshDailyResultSchema, GoalEvidenceRequestSchema, statusAllowed(), workEvidence(), GoalInput (+10 more)

### Community 71 - ".transaction"
Cohesion: 0.17
Nodes (12): publishFeature(), reconcilePublication(), uncertainPublications(), reserveIdentity(), GitHubOperations, fileLessonIssue(), lessonIssueBody(), lessonIssueMarker() (+4 more)

### Community 73 - "ref_node_crypto"
Cohesion: 0.11
Nodes (32): ref_node_crypto, ref_node_string_decoder, assetDownloader(), attachmentKind(), evidenceDirectory(), readEvidence(), storeEvidence(), blankEvidence() (+24 more)

### Community 74 - "local-config.ts"
Cohesion: 0.30
Nodes (10): AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), goalEvidencePath(), OfficeConfigInputs, officeConfigRoute(), officeConfigSummary(), CECBinding, localBindings (+2 more)

### Community 75 - "work.ts"
Cohesion: 0.12
Nodes (16): historicalRecordDigest(), Intent, records(), retireIncompleteHistory(), HistoryRetirement, HistoryRetirementIntent, AssignmentResult, CompletionCondition (+8 more)

### Community 76 - "control-store.ts"
Cohesion: 0.17
Nodes (11): ref_node_sqlite, Clock, applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, statementCache(), initialSnapshot() (+3 more)

### Community 77 - "assignment-poll.ts"
Cohesion: 0.13
Nodes (21): channelNoticeAuthorized(), ChannelSettings, notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR, plainSlackText() (+13 more)

### Community 78 - "normalize-question.ts"
Cohesion: 0.29
Nodes (9): FeatureHarnessOption, FeatureOption, FeatureQuestion, FeatureRoundAuthor, folded(), normalizeQuestion(), optionId(), RawQuestion (+1 more)

### Community 79 - "delivery-task.ts"
Cohesion: 0.36
Nodes (6): APPROACH_GUIDANCE, deliveryTask(), DeliveryTaskInput, DISCOVERY_GUIDANCE, compactSteps(), featureDeliveryContext()

### Community 80 - "node-visuals.ts"
Cohesion: 0.20
Nodes (13): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+5 more)

### Community 81 - "json"
Cohesion: 0.22
Nodes (9): preferencesRoute(), PreferencesRouteContext, fileResponse(), json(), staticRoute(), PreferencesStore, validTicket(), telemetryRoute() (+1 more)

### Community 82 - "report.ts"
Cohesion: 0.33
Nodes (11): Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked(), row() (+3 more)

### Community 83 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 84 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 85 - "install-service.mjs"
Cohesion: 0.16
Nodes (11): ref_node_child_process, ref_node_url, file, folder, logs, root, GIT_NETWORK, LIVE_PROVIDERS (+3 more)

### Community 86 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (10): ref_react_three_drei, ref_react_three_fiber, ref_three_stdlib, CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility (+2 more)

### Community 87 - "ref_zod"
Cohesion: 0.14
Nodes (17): ref_zod, Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership (+9 more)

### Community 88 - "createConstellation"
Cohesion: 0.19
Nodes (5): ConstellationRuntime, createConstellation(), enter(), finishTap(), move()

### Community 89 - "conversations/slack.ts"
Cohesion: 0.17
Nodes (9): slackVerifyPrompt(), comparableSlackText(), SlackMessages, SlackRequestSchema, SlackResultSchema, SlackVerificationSchema, maintenanceNoticeAuthorized(), sendMaintenanceNotice() (+1 more)

### Community 91 - "pre-push-boundary.ts"
Cohesion: 0.43
Nodes (5): Event, one(), prePushRejection(), PushIdentity, settledPushBoundary()

### Community 94 - "handover-cms.ts"
Cohesion: 0.40
Nodes (4): ref_smol_toml, file, project, root

### Community 97 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (6): ref_mammoth, ref_pdfjs_dist, bounded(), extract(), fail(), [path,kind]

### Community 99 - "helper-evidence.py"
Cohesion: 0.33
Nodes (5): importlib_util, json, pathlib, Read-only protocol adapter for the installed review helper. No model dispatch., sys

## Knowledge Gaps
- **478 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+473 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 607 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `ref_node_path`, `github-delivery.ts`, `workKey`, `agents.ts`, `source-amendment.ts`, `features/workflow.ts`, `shared.ts`, `session-bridge.ts`, `knowledge.ts`, `features.ts`, `scheduled-captures.ts`, `digest`, `record-trigger.ts`, `delivery-recoveries.ts`, `lesson-selection.ts`, `conversations/conversations.ts`, `github-readiness.ts`, `post-conflict-preparation.ts`, `recovery/stopped-base-update.ts`, `azure.ts`, `maintenance/maintenance.ts`, `accept-stage-result.ts`, `run-retrospective.ts`, `demand-facts.ts`, `assignments.ts`, `time-scope.ts`, `dependencies.ts`, `requests.ts`, `worker-runtime.ts`, `outbox.ts`, `owned-artifact.ts`, `run.ts`, `retrospective-subject.ts`, `it-specialist.ts`, `cost-ledger.ts`, `engine.ts`, `dependency-bots/adopt.ts`, `api-routes.ts`, `cec/issue-publication.ts`, `ledger.ts`, `admit-improvement.ts`, `run-accounting.ts`, `.emit`, `weekly-rollup.ts`, `scheduler.ts`, `scheduled-work.ts`, `blocker-followups.ts`, `remove-candidate.ts`, `jira-time.ts`, `.save`, `coordination.ts`, `coordination-tick.ts`, `fact-bounds.ts`, `goal-reviews.ts`, `.transaction`, `ref_node_crypto`, `work.ts`, `control-store.ts`, `assignment-poll.ts`, `delivery-task.ts`, `json`, `ref_zod`, `conversations/slack.ts`?**
  _High betweenness centrality (0.115) - this node is a cross-community bridge._
- **Why does `command()` connect `Store` to `ref_node_path`, `github-delivery.ts`, `workKey`, `agents.ts`, `features/workflow.ts`, `session-bridge.ts`, `features.ts`, `digest`, `github-readiness.ts`, `azure.ts`, `maintenance/maintenance.ts`, `assignments.ts`, `dependencies.ts`, `requests.ts`, `worker-runtime.ts`, `contract.ts`, `cost-ledger.ts`, `engine.ts`, `dependency-bots/adopt.ts`, `cec/issue-publication.ts`, `weekly-rollup.ts`, `scheduled-work.ts`, `remove-candidate.ts`, `service-health.ts`, `jira-time.ts`, `.save`, `coordination.ts`, `ref_node_crypto`, `assignment-poll.ts`, `install-service.mjs`, `CommandRegistry`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `workKey()` connect `workKey` to `ref_node_path`, `github-delivery.ts`, `Store`, `source-amendment.ts`, `features/workflow.ts`, `shared.ts`, `digest`, `delivery-recoveries.ts`, `github-readiness.ts`, `post-conflict-preparation.ts`, `recovery/stopped-base-update.ts`, `dependencies.ts`, `requests.ts`, `owned-artifact.ts`, `dependency-bots/adopt.ts`, `api-routes.ts`, `scheduler.ts`, `scheduled-work.ts`, `remove-candidate.ts`, `coordination-tick.ts`, `.transaction`, `work.ts`, `ref_zod`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _478 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ref_node_path` be split into smaller, more focused modules?**
  _Cohesion score 0.05242154906584437 - nodes in this community are weakly interconnected._
- **Should `github-delivery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.04604980678402748 - nodes in this community are weakly interconnected._
- **Should `workKey` be split into smaller, more focused modules?**
  _Cohesion score 0.0601067887109077 - nodes in this community are weakly interconnected._