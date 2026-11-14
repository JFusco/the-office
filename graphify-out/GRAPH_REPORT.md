# Graph Report - office-jira-parking-comments-nov14  (2026-11-14)

## Corpus Check
- 787 files · ~322,495 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3989 nodes · 18627 edges · 107 communities (100 shown, 7 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 601 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b62d46ca`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- github-delivery.ts
- agents.ts
- closeout-recovery.ts
- recovery/stopped-base-update.ts
- post-conflict-preparation.ts
- github-readiness.ts
- source-amendment.ts
- run.ts
- MapView.tsx
- Inspector.tsx
- App.tsx
- maintenance/maintenance.ts
- features/workflow.ts
- session-bridge.ts
- cec/issue-publication.ts
- coordination.ts
- digest
- scheduled-captures.ts
- assignments.ts
- index.ts
- TimeBook.tsx
- run-accounting.ts
- ref_react
- Effects
- features.ts
- run-retrospective.ts
- Button
- knowledge.ts
- record-trigger.ts
- Role
- .transaction
- sanitize
- shared.ts
- dependency-bots/adopt.ts
- conversations/slack.ts
- candidate.ts
- engine.ts
- cost-ledger.ts
- ref_node_path
- azure.ts
- ticket-stage-runner.ts
- demand-facts.ts
- contract.ts
- time-scope.ts
- scope-repair-resume.ts
- scheduled-work.ts
- index.tsx
- weekly-rollup.ts
- outbox.ts
- lesson-selection.ts
- sceneColors
- constellation-runtime.ts
- .save
- recover-saved-plan.ts
- telemetry.ts
- ticket-evidence.ts
- .emit
- local-config.ts
- config.ts
- goal-reviews.ts
- WorkTime
- retrospective-subject.ts
- blocker-followups.ts
- work-summary.ts
- admit-improvement.ts
- QuestionStepper.tsx
- Coordinator
- scheduled-features.ts
- codex-rollout.ts
- work.ts
- store.ts
- pilot-delivery.ts
- knowledge-views.ts
- intent.ts
- assignment-poll.ts
- artifact
- office-lessons.ts
- OfficeScene.tsx
- offices.ts
- owned-artifact.ts
- time-ledger.ts
- cli.ts
- GitHubDelivery
- ref_node_crypto
- fact-bounds.ts
- scene-motion.ts
- scheduler.ts
- report.ts
- Ticket
- capture-session-clone.py
- create-candidate.ts
- preferences-store.ts
- retire-history.ts
- Store
- install-service.mjs
- pre-push-boundary.ts
- live-reach.ts
- node-visuals.ts
- extract-worker.mjs
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
- `DeliverySlot` --references--> `Role`  [EXTRACTED]
  server/office/projects.ts → src/shared.ts
- `projectOutbox()` --calls--> `parkedProviderWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts
- `projectOutbox()` --calls--> `readinessWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts
- `replacementContext()` --calls--> `slackMessageUrl()`  [EXTRACTED]
  server/conversations/slack/supersession-proof.ts → src/shared.ts

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

## Communities (107 total, 7 thin omitted)

### Community 0 - "github-delivery.ts"
Cohesion: 0.06
Nodes (69): harnessCloseout(), PASSING, verifyMergeActions(), findingsBlock(), requireDeliveryAuthority(), assertDeliveryMayMutate(), withHarnessWork(), runHarnessStage() (+61 more)

### Community 1 - "agents.ts"
Cohesion: 0.04
Nodes (71): ref_zod, implementationWorkerContext(), intakeMembership(), cecPrompt(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt() (+63 more)

### Community 2 - "closeout-recovery.ts"
Cohesion: 0.11
Nodes (42): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+34 more)

### Community 3 - "recovery/stopped-base-update.ts"
Cohesion: 0.08
Nodes (45): deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, gateRegisteredDelivery(), accounting, DeliverySubject, nonDelivery (+37 more)

### Community 4 - "post-conflict-preparation.ts"
Cohesion: 0.09
Nodes (52): assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), reconcileCompletedConflictDraft(), routeReadyPostConflictPublication(), verifyInitialDraftConflictPreparation() (+44 more)

### Community 5 - "github-readiness.ts"
Cohesion: 0.07
Nodes (54): observe(), assertAutomationEffects(), automationMergePolicy(), observeAutomationMerge(), routeAutomationMerge(), checksFailed(), checksPassed(), checksPending() (+46 more)

### Community 6 - "source-amendment.ts"
Cohesion: 0.06
Nodes (69): ref_node_async_hooks, adoptCandidate(), reported, Scope, approvedText(), assert(), AMENDMENT_REVIEW_PROOF, amendmentIssueSha256() (+61 more)

### Community 7 - "run.ts"
Cohesion: 0.11
Nodes (31): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationCandidates(), investigationId(), investigationEvidence(), investigationFollowUps(), INVOCATION_SOURCE_REFS, invocationSource() (+23 more)

### Community 8 - "MapView.tsx"
Cohesion: 0.08
Nodes (47): ref_react_markdown, ref_remark_gfm, ref_yaml, Activity(), ActivityTimeline(), AssignmentKnowledge(), Lookup(), BrainWorkspace() (+39 more)

### Community 9 - "Inspector.tsx"
Cohesion: 0.12
Nodes (56): Outbox(), labels, ServiceHealthRow(), BlockerFollowups(), LearningCoverage(), LessonsPanel(), when(), GoalList() (+48 more)

### Community 10 - "App.tsx"
Cohesion: 0.08
Nodes (39): ref_lucide_react, ref_motion, ref_react_dom, blockedSummary(), ServiceHealthPanel(), followUp(), BrainDrawer(), themeColor (+31 more)

### Community 11 - "maintenance/maintenance.ts"
Cohesion: 0.07
Nodes (41): maintenancePolicies(), captureMaintenanceStep(), completeNativeCheckpoint(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, BrainStatusSchema, brainCheckpointCompletion() (+33 more)

### Community 12 - "features/workflow.ts"
Cohesion: 0.08
Nodes (56): approveFeature(), createFeature(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), discoveryPrompt(), artifactPath() (+48 more)

### Community 13 - "session-bridge.ts"
Cohesion: 0.07
Nodes (46): ref_ws, claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexDaemonProcesses(), accountCodexProcesses(), codexProcessInventory (+38 more)

### Community 14 - "cec/issue-publication.ts"
Cohesion: 0.09
Nodes (19): Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), Transition, descriptionPreimage(), plain() (+11 more)

### Community 15 - "coordination.ts"
Cohesion: 0.07
Nodes (40): MergeNotifications, reconcileNoticeConfirmations(), IntakeContext, resumeParked(), dependencyCompletionKey(), dependencyEligibility(), DependencyStores, observePrerequisites() (+32 more)

### Community 16 - "digest"
Cohesion: 0.10
Nodes (52): ref_node_util, retryRead(), admitPRMetadata(), METADATA_FINDING, assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema (+44 more)

### Community 17 - "scheduled-captures.ts"
Cohesion: 0.17
Nodes (35): assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest, captureRequests(), failCapture(), requestCapture(), saveCaptureRequest() (+27 more)

### Community 18 - "assignments.ts"
Cohesion: 0.06
Nodes (42): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, CommittedBrain (+34 more)

### Community 19 - "index.ts"
Cohesion: 0.08
Nodes (42): ref_hono_node_server, ref_node_http, implementationContinuationRoute(), close(), config, itSpecialist, loadedRevision, offices (+34 more)

### Community 20 - "TimeBook.tsx"
Cohesion: 0.09
Nodes (42): displayAgentTask(), LiveAgentTask(), Props, RunningTask(), text(), AzureBuild, src_shared_liveanchor, ROLE_NAMES (+34 more)

### Community 21 - "run-accounting.ts"
Cohesion: 0.14
Nodes (21): BoundedRead, EvidenceOutcome, backfillClaudeCost(), CompletionReader, codexHome(), HELPER_STDOUT_MAX_BYTES, helperAccounting(), claudeAccounting() (+13 more)

### Community 22 - "ref_react"
Cohesion: 0.13
Nodes (38): ref_react, SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState (+30 more)

### Community 23 - "Effects"
Cohesion: 0.14
Nodes (19): dispatchedMetadataEffect(), diagnosticProof(), ownedArtifact(), rawHash(), recoverDiscovery(), scopeNote(), featureById(), publishFeature() (+11 more)

### Community 24 - "features.ts"
Cohesion: 0.09
Nodes (39): commandFeature(), reviewQuestions(), confirmBrief(), FeaturePlanningBindings, assertQuestionVisibility(), applyHarnessAction(), HarnessActionInput, recoveryPreconditions() (+31 more)

### Community 25 - "run-retrospective.ts"
Cohesion: 0.08
Nodes (48): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, blockingTrigger, isBlocking(), brainOverlap (+40 more)

### Community 26 - "Button"
Cohesion: 0.08
Nodes (43): ctoInputFailure(), OutboxCTOInput(), recover(), OutboxSavedImplementation(), apply(), review(), OutboxSavedPlan(), reconcile() (+35 more)

### Community 27 - "knowledge.ts"
Cohesion: 0.08
Nodes (30): BRAIN_SCOPE, SUBJECT, Kind, RetrospectiveResultSchema, RollupResultSchema, Stage, BlockerFollowup, ImprovementGrant (+22 more)

### Community 28 - "record-trigger.ts"
Cohesion: 0.11
Nodes (38): baselineLearning(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences(), clip(), maintenanceBlockedId(), MaintenanceCandidate (+30 more)

### Community 29 - "Role"
Cohesion: 0.09
Nodes (45): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+37 more)

### Community 30 - ".transaction"
Cohesion: 0.11
Nodes (37): featureItemComplete(), reconcileFeatureCompletion(), planPrompt(), readEvidence(), helperTelemetry(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS (+29 more)

### Community 31 - "sanitize"
Cohesion: 0.09
Nodes (28): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+20 more)

### Community 32 - "shared.ts"
Cohesion: 0.05
Nodes (54): ref_vite, partialLocalCleanupKey(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), assignmentDiagnostics(), ITContext (+46 more)

### Community 33 - "dependency-bots/adopt.ts"
Cohesion: 0.05
Nodes (94): initialManualStart(), Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard (+86 more)

### Community 34 - "conversations/slack.ts"
Cohesion: 0.15
Nodes (14): channelNoticeAuthorized(), ChannelSettings, notices(), queueChannelNotice(), comparableSlackText(), SlackMessages, goalNoticeAuthorized(), goalNoticeNeverDispatched() (+6 more)

### Community 35 - "candidate.ts"
Cohesion: 0.28
Nodes (13): GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles(), absent() (+5 more)

### Community 36 - "engine.ts"
Cohesion: 0.08
Nodes (14): correlatedBuild(), applyIntakeObservation(), checkMail(), drainMail(), requestMail(), enableNightly(), ingest(), drainMaintenance() (+6 more)

### Community 37 - "cost-ledger.ts"
Cohesion: 0.17
Nodes (25): captureCost(), server_telemetry_cost_entries_costcoveragesummary, costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress() (+17 more)

### Community 38 - "ref_node_path"
Cohesion: 0.10
Nodes (45): ref_node_fs, ref_node_path, containedFile(), Execute, installDependencies(), major(), removeAdoptedClone(), namedRepairIds() (+37 more)

### Community 39 - "azure.ts"
Cohesion: 0.09
Nodes (32): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+24 more)

### Community 40 - "ticket-stage-runner.ts"
Cohesion: 0.16
Nodes (27): parksInJira(), run(), verifiedTransition(), publicationEvidenceGap(), qaEvidenceGap(), stageResultGap(), afterDraft(), firstBuildStage() (+19 more)

### Community 41 - "demand-facts.ts"
Cohesion: 0.13
Nodes (22): clip(), DEMAND_LIMIT, demandFacts(), DemandSection, key(), LessonKey, notes(), clip() (+14 more)

### Community 42 - "contract.ts"
Cohesion: 0.23
Nodes (11): At, errno, GroupInventory, GroupProbe, LifecycleDiagnostic, Phase, Pid, groupInventory() (+3 more)

### Community 43 - "time-scope.ts"
Cohesion: 0.12
Nodes (30): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), server_telemetry_billable_work_issue_key, isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence() (+22 more)

### Community 44 - "scope-repair-resume.ts"
Cohesion: 0.22
Nodes (20): assertScopeRepairResumeFindings(), certain(), directionContract(), directionPaths, effects(), originalClaim(), Ownership, requireThat() (+12 more)

### Community 45 - "scheduled-work.ts"
Cohesion: 0.13
Nodes (26): deliverySlot(), closeoutRequestResolved(), metadataRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), requestPriority(), closedTicketRequest() (+18 more)

### Community 46 - "index.tsx"
Cohesion: 0.08
Nodes (42): Conversation(), SendMessage, LessonDecisionAction, lessonDecisionState(), readLessonDecision(), OutboxLessonDecision(), act(), readStatus() (+34 more)

### Community 47 - "weekly-rollup.ts"
Cohesion: 0.09
Nodes (28): learningMetrics(), RollupResult, lastFriday(), ROLLUP_HISTORY, rollupDue(), RollupHooks, rollupPrompt(), runRollup() (+20 more)

### Community 48 - "outbox.ts"
Cohesion: 0.10
Nodes (26): ctoInputRecovered(), projectOutbox(), syncOutbox(), projectSlackDeliveries(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint() (+18 more)

### Community 49 - "lesson-selection.ts"
Cohesion: 0.09
Nodes (28): lessonIssueBody(), lessonIssueMarker(), LessonBrainOverlap, INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose() (+20 more)

### Community 50 - "sceneColors"
Cohesion: 0.26
Nodes (22): Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk(), Furnishings (+14 more)

### Community 51 - "constellation-runtime.ts"
Cohesion: 0.09
Nodes (22): ref_3d_force_graph, ref_three_stdlib, CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point (+14 more)

### Community 52 - ".save"
Cohesion: 0.18
Nodes (30): jiraCollection(), BLOCKED, findComment(), LiveIssue, readIssue(), readIssues(), Execute, jira() (+22 more)

### Community 53 - "recover-saved-plan.ts"
Cohesion: 0.31
Nodes (9): resume(), MISSING_SAVED_PLAN, recoverSavedPlan(), advance(), nextStage(), resultGate(), persistReaderAnalysis(), readerAnalysisReference() (+1 more)

### Community 54 - "telemetry.ts"
Cohesion: 0.11
Nodes (23): CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL, Rates (+15 more)

### Community 55 - "ticket-evidence.ts"
Cohesion: 0.14
Nodes (23): ref_node_string_decoder, assetDownloader(), attachmentKind(), evidenceDirectory(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS (+15 more)

### Community 56 - ".emit"
Cohesion: 0.17
Nodes (24): decideImplementation(), configureChannelNotices(), configureNotices(), retryRecipientLookup(), recoverCTOInput(), enqueueGreen156(), bindDiscoveryResume(), DiscoveryResumeInput (+16 more)

### Community 57 - "local-config.ts"
Cohesion: 0.12
Nodes (23): IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), projectListScope(), AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), goalEvidencePath() (+15 more)

### Community 58 - "config.ts"
Cohesion: 0.05
Nodes (98): interruptedImplementation(), deliveryIntakeBlocker(), boardPreflightCandidate(), Ownership, partialLocalCleanupCandidate(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration() (+90 more)

### Community 59 - "goal-reviews.ts"
Cohesion: 0.10
Nodes (21): saveGoals(), applyGoalReview(), DailyResultSchema, EvidenceRefSchema, FreshDailyResultSchema, GoalEvidenceRequestSchema, statusAllowed(), workEvidence() (+13 more)

### Community 60 - "WorkTime"
Cohesion: 0.14
Nodes (21): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+13 more)

### Community 61 - "retrospective-subject.ts"
Cohesion: 0.14
Nodes (21): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+13 more)

### Community 62 - "blocker-followups.ts"
Cohesion: 0.19
Nodes (18): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), readBackConversations(), handoff(), reconcileBlockerFollowups(), improvementIntakeGate() (+10 more)

### Community 63 - "work-summary.ts"
Cohesion: 0.19
Nodes (19): deliveryRepairProjection(), ACTIVE, maintenanceUpdate(), PMQueueItem, pmQueueItems(), deliveryChanges(), following, phases (+11 more)

### Community 64 - "admit-improvement.ts"
Cohesion: 0.22
Nodes (16): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+8 more)

### Community 65 - "QuestionStepper.tsx"
Cohesion: 0.19
Nodes (18): FeatureQuestionProjection, OutboxQuestionRound(), send(), draftKey(), readDraft(), saveDraft(), QuestionRound(), nextQuestion() (+10 more)

### Community 66 - "Coordinator"
Cohesion: 0.08
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 67 - "scheduled-features.ts"
Cohesion: 0.36
Nodes (12): compatible(), issueKey(), validatePrerequisites(), currentApproval(), automaticIntakeWait(), recoveryHeld(), deliveryPreflight, handoffBinding() (+4 more)

### Community 68 - "codex-rollout.ts"
Cohesion: 0.18
Nodes (13): add(), CodexRequest, CodexRollout, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens() (+5 more)

### Community 69 - "work.ts"
Cohesion: 0.12
Nodes (20): BLOCKED_CAUSES, blockedCauses(), ProjectReadiness, AssignmentResult, BlockedCause, CompletionCondition, DeliveryAdmission, EligibilityState (+12 more)

### Community 70 - "store.ts"
Cohesion: 0.10
Nodes (20): ref_node_sqlite, Clock, systemClock, applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, EffectOperation (+12 more)

### Community 71 - "pilot-delivery.ts"
Cohesion: 0.21
Nodes (21): dispatchNightly(), drainDelivery(), requestDelivery(), startPilot(), eligibility(), Admission, admit(), WAIT_STATUSES (+13 more)

### Community 72 - "knowledge-views.ts"
Cohesion: 0.18
Nodes (18): KnowledgeActivity, KnowledgeEdge, KnowledgeMap, KnowledgeNode, connectionSummary(), Constellation(), ConstellationView, DisplayNode (+10 more)

### Community 73 - "intent.ts"
Cohesion: 0.21
Nodes (11): ref_node_child_process, ContinuationIO, continueImplementation(), nativeIO, assertOwnership(), ImplementationDecision, implementationPreview(), OwnershipRead (+3 more)

### Community 74 - "assignment-poll.ts"
Cohesion: 0.15
Nodes (21): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), clamp(), LIMITS, MergedPR, plainSlackText(), section() (+13 more)

### Community 75 - "artifact"
Cohesion: 0.10
Nodes (64): ref_node_os, acceptStageResult(), draftReadHeadMatches(), assertDraftClaimHistory(), linkDraftIssue(), protectedOriginalClaim(), publicationReadArgs(), Read (+56 more)

### Community 76 - "office-lessons.ts"
Cohesion: 0.30
Nodes (10): normalizeStatement(), decideOfficeProposal(), mirrorOfficeKnowledge(), now(), OfficeKnowledgeStore, proposeOfficeLessons(), retireOfficeLesson(), Input (+2 more)

### Community 77 - "OfficeScene.tsx"
Cohesion: 0.12
Nodes (22): ref_react_three_drei, ref_react_three_fiber, ref_three, withoutElapsed(), CameraBookmark, restoreBookmark(), ElevatorStage(), Floor (+14 more)

### Community 78 - "offices.ts"
Cohesion: 0.09
Nodes (22): ref_smol_toml, QuestionNotifications, leadershipContext(), expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck() (+14 more)

### Community 79 - "owned-artifact.ts"
Cohesion: 0.26
Nodes (12): done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf(), createdAt(), dayDirs(), header() (+4 more)

### Community 80 - "time-ledger.ts"
Cohesion: 0.29
Nodes (8): timeLedger(), syncing, TimeLedger, dueReadback(), Readback, READBACK_INTERVAL_MS, readBackTime(), SETTLE_MS

### Community 81 - "cli.ts"
Cohesion: 0.20
Nodes (8): ref_node_stream, ref_node_timers, args, [cmd,...rawArgs], commands, key, projectIndex, lessonBrainAudit

### Community 82 - "GitHubDelivery"
Cohesion: 0.11
Nodes (30): HarnessControl, GitHubDelivery, reconcileBoardPreflight(), hasSavedPrerequisiteResult(), admitPacked165(), history(), makePacked165Candidate(), packed165CandidateIdentity() (+22 more)

### Community 83 - "ref_node_crypto"
Cohesion: 0.15
Nodes (14): ref_node_crypto, ProviderEvidence, canonical(), evidenceDigest(), evidenceHash(), semantic(), stableUrl(), requirementDrift() (+6 more)

### Community 84 - "fact-bounds.ts"
Cohesion: 0.25
Nodes (15): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+7 more)

### Community 85 - "scene-motion.ts"
Cohesion: 0.28
Nodes (15): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+7 more)

### Community 86 - "scheduler.ts"
Cohesion: 0.19
Nodes (12): ROLES, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch(), deliveryOccupied() (+4 more)

### Community 87 - "report.ts"
Cohesion: 0.20
Nodes (16): CostEntry, TelemetryReport, TelemetryRow, TelemetrySync, Acc, bump(), EASTERN, easternDay() (+8 more)

### Community 88 - "Ticket"
Cohesion: 0.28
Nodes (9): CommentPage, commentReadback(), JiraOperations, plain(), jiraRecord(), unpack(), metadataDigest(), verifyAlreadyAtStatus() (+1 more)

### Community 89 - "capture-session-clone.py"
Cohesion: 0.15
Nodes (10): ctypes, errno, importlib_util, json, os, pathlib, Copy a coherent macOS clone of inherited reader fd3 to anonymous target fd4. No…, Read-only protocol adapter for the installed review helper. No model dispatch. (+2 more)

### Community 90 - "create-candidate.ts"
Cohesion: 0.48
Nodes (6): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf()

### Community 91 - "preferences-store.ts"
Cohesion: 0.19
Nodes (9): PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS, OfficePreferences (+1 more)

### Community 92 - "retire-history.ts"
Cohesion: 0.36
Nodes (6): historicalRecordDigest(), Intent, records(), retireIncompleteHistory(), HistoryRetirement, HistoryRetirementIntent

### Community 93 - "Store"
Cohesion: 0.10
Nodes (9): GitHubFeaturePublisher, JiraFeaturePublisher, Result, Store, inactivityWatch(), probeProcessGroup(), command(), workerFailure() (+1 more)

### Community 94 - "install-service.mjs"
Cohesion: 0.29
Nodes (5): ref_node_url, file, folder, logs, root

### Community 95 - "pre-push-boundary.ts"
Cohesion: 0.43
Nodes (5): Event, one(), prePushRejection(), PushIdentity, settledPushBoundary()

### Community 96 - "live-reach.ts"
Cohesion: 0.47
Nodes (5): GIT_NETWORK, LIVE_PROVIDERS, liveReach(), networkUrl(), remoteUrls()

### Community 97 - "node-visuals.ts"
Cohesion: 0.20
Nodes (13): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+5 more)

### Community 98 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (6): ref_mammoth, ref_pdfjs_dist, bounded(), extract(), fail(), [path,kind]

### Community 100 - "cec-implementation-continuation.ts"
Cohesion: 0.40
Nodes (4): ImplementationContinuation, ImplementationContinuationInput, ImplementationContinuationRequest, SavedImplementationProof

## Knowledge Gaps
- **490 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+485 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 632 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `github-delivery.ts`, `agents.ts`, `closeout-recovery.ts`, `recovery/stopped-base-update.ts`, `post-conflict-preparation.ts`, `github-readiness.ts`, `source-amendment.ts`, `run.ts`, `maintenance/maintenance.ts`, `features/workflow.ts`, `session-bridge.ts`, `cec/issue-publication.ts`, `coordination.ts`, `digest`, `scheduled-captures.ts`, `assignments.ts`, `index.ts`, `run-accounting.ts`, `Effects`, `features.ts`, `run-retrospective.ts`, `Button`, `record-trigger.ts`, `.transaction`, `sanitize`, `shared.ts`, `dependency-bots/adopt.ts`, `conversations/slack.ts`, `candidate.ts`, `engine.ts`, `cost-ledger.ts`, `ref_node_path`, `azure.ts`, `demand-facts.ts`, `time-scope.ts`, `scope-repair-resume.ts`, `scheduled-work.ts`, `weekly-rollup.ts`, `outbox.ts`, `lesson-selection.ts`, `.save`, `recover-saved-plan.ts`, `ticket-evidence.ts`, `.emit`, `config.ts`, `goal-reviews.ts`, `WorkTime`, `retrospective-subject.ts`, `blocker-followups.ts`, `admit-improvement.ts`, `scheduled-features.ts`, `store.ts`, `pilot-delivery.ts`, `intent.ts`, `assignment-poll.ts`, `artifact`, `office-lessons.ts`, `offices.ts`, `time-ledger.ts`, `GitHubDelivery`, `ref_node_crypto`, `scheduler.ts`, `Ticket`, `create-candidate.ts`, `retire-history.ts`?**
  _High betweenness centrality (0.106) - this node is a cross-community bridge._
- **Why does `Engine` connect `engine.ts` to `github-delivery.ts`, `agents.ts`, `github-readiness.ts`, `maintenance/maintenance.ts`, `features/workflow.ts`, `coordination.ts`, `scheduled-captures.ts`, `Effects`, `sanitize`, `conversations/slack.ts`, `ref_node_path`, `azure.ts`, `ticket-stage-runner.ts`, `scheduled-work.ts`, `pilot-delivery.ts`, `intent.ts`, `assignment-poll.ts`, `offices.ts`, `GitHubDelivery`, `Ticket`, `Store`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `OfficeSnapshot` connect `Button` to `run.ts`, `MapView.tsx`, `Inspector.tsx`, `App.tsx`, `maintenance/maintenance.ts`, `TimeBook.tsx`, `ref_react`, `record-trigger.ts`, `Role`, `shared.ts`, `ref_node_path`, `azure.ts`, `index.tsx`, `outbox.ts`, `work-summary.ts`, `work.ts`, `store.ts`, `assignment-poll.ts`, `OfficeScene.tsx`, `offices.ts`, `scene-motion.ts`, `Store`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _490 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `github-delivery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.055078416728902166 - nodes in this community are weakly interconnected._
- **Should `agents.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.04284958561100335 - nodes in this community are weakly interconnected._
- **Should `closeout-recovery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11008325624421832 - nodes in this community are weakly interconnected._