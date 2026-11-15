# Graph Report - office-lightweight-qa-nov15  (2026-11-15)

## Corpus Check
- 814 files · ~331,301 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4075 nodes · 18991 edges · 104 communities (94 shown, 10 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 615 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `71294330`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- source-amendment.ts
- ref_react
- Inspector.tsx
- agents.ts
- outbox.ts
- post-conflict-preparation.ts
- ref_node_path
- session-bridge.ts
- App.tsx
- engine.ts
- assignments.ts
- features/workflow.ts
- github/issue-publication.ts
- closeout-recovery.ts
- run.ts
- config.ts
- ref_node_crypto
- OfficeSnapshot
- worker-runtime.ts
- record-trigger.ts
- artifact
- github-delivery.ts
- digest
- StageResult
- pilot-delivery.ts
- TimeBook.tsx
- index.tsx
- Role
- run-retrospective.ts
- dependencies.ts
- .emit
- knowledge.ts
- sanitize
- cec/issue-publication.ts
- features.ts
- reader.ts
- shared.ts
- run-accounting.ts
- inspect-closed-plan.ts
- intent.ts
- Conversation.tsx
- .save
- TicketJob
- maintenance/maintenance.ts
- time-scope.ts
- telemetry.ts
- dependency-bots/adopt.ts
- remove-candidate.ts
- OfficeScene.tsx
- index.ts
- cec/workflow.ts
- resume-provider-review.ts
- coordination.ts
- ticket-evidence.ts
- weekly-rollup.ts
- task-briefing.ts
- work.ts
- scheduled-work.ts
- admit-improvement.ts
- service-health.ts
- Effects
- evidence-artifacts.ts
- Outbox.tsx
- harnessEffect
- it-specialist.ts
- useOfficePreferences.ts
- offices.ts
- record-push.ts
- JiraIssuePublisher
- daily-cto.ts
- QuestionStepper.tsx
- Offices
- constellation-runtime.ts
- stopped-base-validation.ts
- tracking-issue.ts
- codex-rollout.ts
- lesson-selection.ts
- demand-facts.ts
- Store
- store.ts
- highestStableAtLeast
- create-candidate.ts
- CommittedBrain
- run-evidence.ts
- ProjectProgress
- QuestionNotifications
- node-visuals.ts
- unblock-brief.ts
- conversations/conversations.ts
- preferences-store.ts
- scene-motion.ts
- report.ts
- capture-session-clone.py
- RoomCamera.tsx
- createConstellation
- process.ts
- cli.ts
- extract-worker.mjs
- server_delivery_harness_delivery_authority_resolvedeliverywork
- server_features_questions_pending_round_pendinground
- server_features_questions_pending_round_pendingrounds
- server_features_questions_pending_round_roundauthor
- src_shared_personas
- src_shared_workkey

## God Nodes (most connected - your core abstractions)
1. `Store` - 360 edges
2. `TicketJob` - 176 edges
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
- `LessonBrainOverlap` --references--> `Lesson`  [EXTRACTED]
  server/knowledge/lesson-brain-audit.ts → src/contracts/knowledge.ts
- `DeliverySlot` --references--> `Role`  [EXTRACTED]
  server/office/projects.ts → src/shared.ts
- `EffectOperation` --references--> `WorkRef`  [EXTRACTED]
  server/store/effects.ts → src/contracts/work.ts
- `projectOutbox()` --calls--> `parkedProviderWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts

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

## Communities (104 total, 10 thin omitted)

### Community 0 - "source-amendment.ts"
Cohesion: 0.06
Nodes (69): ref_node_async_hooks, adoptCandidate(), reported, Scope, directionContract(), scopeRepairDirection(), approvedText(), assert() (+61 more)

### Community 1 - "ref_react"
Cohesion: 0.08
Nodes (55): ref_motion, ref_react, ref_react_markdown, ref_remark_gfm, ref_yaml, KnowledgeNode, Activity(), ActivityTimeline() (+47 more)

### Community 2 - "Inspector.tsx"
Cohesion: 0.11
Nodes (63): Outbox(), blockedSummary(), ServiceHealthPanel(), followUp(), labels, ServiceHealthRow(), BlockerFollowups(), LearningCoverage() (+55 more)

### Community 3 - "agents.ts"
Cohesion: 0.04
Nodes (67): implementationWorkerContext(), IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), intakeMembership(), projectListScope(), cecPrompt() (+59 more)

### Community 4 - "outbox.ts"
Cohesion: 0.09
Nodes (38): assertConversationReadback(), conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), ctoInputRecovered(), conversationResolved(), projectOutbox(), syncOutbox() (+30 more)

### Community 5 - "post-conflict-preparation.ts"
Cohesion: 0.09
Nodes (53): assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), reconcileCompletedConflictDraft(), routeReadyPostConflictPublication(), verifyInitialDraftConflictPreparation() (+45 more)

### Community 6 - "ref_node_path"
Cohesion: 0.08
Nodes (39): ref_node_fs, ref_node_path, ref_node_util, draftReadHeadMatches(), assertDraftClaimHistory(), linkDraftIssue(), protectedOriginalClaim(), publicationReadArgs() (+31 more)

### Community 7 - "session-bridge.ts"
Cohesion: 0.05
Nodes (58): ref_node_perf_hooks, ref_node_url, ref_ws, file, folder, logs, root, claudeSessionContext() (+50 more)

### Community 8 - "App.tsx"
Cohesion: 0.06
Nodes (49): ref_lucide_react, ref_react_dom, BrainDrawer(), themeColor, App(), BrainWorkspace, CONNECTION, CONNECTION_DOT (+41 more)

### Community 9 - "engine.ts"
Cohesion: 0.07
Nodes (14): correlatedBuild(), checkMail(), drainMail(), requestMail(), enableNightly(), ingest(), Result, drainMaintenance() (+6 more)

### Community 10 - "assignments.ts"
Cohesion: 0.15
Nodes (16): assignmentKnowledge(), assignmentLookups, Binding, lookupInstructions(), clip(), MISSED_QUERY_LIMIT, missedQueries(), decodeLookupJournal() (+8 more)

### Community 11 - "features/workflow.ts"
Cohesion: 0.06
Nodes (60): approveFeature(), featureById(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), discoveryPrompt(), planPrompt() (+52 more)

### Community 12 - "github/issue-publication.ts"
Cohesion: 0.19
Nodes (9): PublicationReceipt, Assign, Board, Content, GitHubIssuePublisher, number(), same(), FeatureManifestItem (+1 more)

### Community 13 - "closeout-recovery.ts"
Cohesion: 0.11
Nodes (41): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+33 more)

### Community 14 - "run.ts"
Cohesion: 0.10
Nodes (31): partialLocalCleanupKey(), INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationCandidates(), investigationId(), investigationEvidence(), investigationFollowUps(), INVOCATION_SOURCE_REFS (+23 more)

### Community 15 - "config.ts"
Cohesion: 0.15
Nodes (24): admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, resumeParked(), dependencyEligibility(), DependencyStores, currentApproval() (+16 more)

### Community 16 - "ref_node_crypto"
Cohesion: 0.14
Nodes (31): ref_node_crypto, featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS, requestReplan() (+23 more)

### Community 17 - "OfficeSnapshot"
Cohesion: 0.11
Nodes (33): FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), send(), phases, LinkedFeatures(), OfficeSnapshot (+25 more)

### Community 18 - "worker-runtime.ts"
Cohesion: 0.08
Nodes (35): SlackResultSchema, SlackVerificationSchema, candidateWorkspaceEnvironment(), assignmentSubject(), CODEX_DEFAULT_EFFORT, CODEX_DEFAULT_MODEL, CODEX_EFFORTS, CODEX_ROLES (+27 more)

### Community 19 - "record-trigger.ts"
Cohesion: 0.12
Nodes (37): baselineLearning(), LEARNING_BASELINES, maintainLearning(), configureKnowledge(), clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates() (+29 more)

### Community 20 - "artifact"
Cohesion: 0.05
Nodes (131): ref_node_os, interruptedImplementation(), deliveryIntakeBlocker(), partialLocalCleanupCandidate(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration() (+123 more)

### Community 21 - "github-delivery.ts"
Cohesion: 0.06
Nodes (93): containedFile(), findingsBlock(), assertDeliveryMayMutate(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery(), discover() (+85 more)

### Community 22 - "digest"
Cohesion: 0.06
Nodes (81): deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, requireDeliveryAuthority(), gateRegisteredDelivery(), accounting, DeliverySubject (+73 more)

### Community 23 - "StageResult"
Cohesion: 0.08
Nodes (64): Execute, installDependencies(), major(), harnessCloseout(), PASSING, verifyMergeActions(), retryRead(), runHarnessStage() (+56 more)

### Community 24 - "pilot-delivery.ts"
Cohesion: 0.11
Nodes (56): continueImplementation(), dispatchNightly(), drainDelivery(), requestDelivery(), startPilot(), Attempt, needsResumeReconciliation(), eligibility() (+48 more)

### Community 25 - "TimeBook.tsx"
Cohesion: 0.09
Nodes (44): LiveAnchor, displayAgentTask(), withoutElapsed(), LiveAgentTask(), Props, RunningTask(), text(), Agent (+36 more)

### Community 26 - "index.tsx"
Cohesion: 0.11
Nodes (45): TicketPlanningAction(), SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState (+37 more)

### Community 27 - "Role"
Cohesion: 0.10
Nodes (42): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+34 more)

### Community 28 - "run-retrospective.ts"
Cohesion: 0.08
Nodes (54): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, blockingTrigger, isBlocking(), brainOverlap (+46 more)

### Community 29 - "dependencies.ts"
Cohesion: 0.13
Nodes (21): compatible(), dependencyCompletionKey(), issueKey(), PrerequisiteSchema, PrerequisitesSchema, validatePrerequisites(), brainCheckpointCompletion(), reconcileCompletedCheckpoints() (+13 more)

### Community 30 - ".emit"
Cohesion: 0.10
Nodes (37): decideImplementation(), requestQAPlanRetry(), configureChannelNotices(), configureNotices(), retryRecipientLookup(), recoverCTOInput(), enqueueGreen156(), bindDiscoveryResume() (+29 more)

### Community 31 - "knowledge.ts"
Cohesion: 0.06
Nodes (39): curateLesson(), Curation, CurationAction, mergeEvidence(), Kind, RetrospectiveResult, RetrospectiveResultSchema, RollupResultSchema (+31 more)

### Community 32 - "sanitize"
Cohesion: 0.14
Nodes (22): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+14 more)

### Community 33 - "cec/issue-publication.ts"
Cohesion: 0.19
Nodes (13): CommentPage, commentReadback(), Assignment, Content, jiraText(), Transition, JiraOperations, plain() (+5 more)

### Community 34 - "features.ts"
Cohesion: 0.10
Nodes (41): commandFeature(), reviewQuestions(), confirmBrief(), applyHarnessAction(), HarnessActionInput, recoveryPreconditions(), recoveryTarget(), normalizeRound() (+33 more)

### Community 35 - "reader.ts"
Cohesion: 0.10
Nodes (25): knowledgeActivity(), knowledgeActivityPage(), committedNotePage(), BrainGraph, BrainNote, BrainReader, GraphNode, GraphPage (+17 more)

### Community 36 - "shared.ts"
Cohesion: 0.05
Nodes (46): Admission, AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), FeaturePlanningBindings, GitHubMonitor, githubPRDescription(), azureGoalFacts(), azurePRDescription() (+38 more)

### Community 37 - "run-accounting.ts"
Cohesion: 0.12
Nodes (32): BoundedRead, done(), readBoundedNoFollow(), readBoundedNoFollowSync(), reasonOf(), CompletionReader, codexHome(), createdAt() (+24 more)

### Community 38 - "inspect-closed-plan.ts"
Cohesion: 0.12
Nodes (17): Document, isAccessOnlyPlan(), settledAccessOnlyState(), closedReadonlyPlan(), Document, continueAccessOnlyPlan(), entryExists(), entryExists() (+9 more)

### Community 39 - "intent.ts"
Cohesion: 0.11
Nodes (29): ref_node_child_process, GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles() (+21 more)

### Community 40 - "Conversation.tsx"
Cohesion: 0.20
Nodes (18): Conversation(), LessonDecisionAction, lessonDecisionState(), readLessonDecision(), OutboxLessonDecision(), act(), readStatus(), slackMessageStatus() (+10 more)

### Community 41 - ".save"
Cohesion: 0.18
Nodes (30): jiraCollection(), BLOCKED, findComment(), LiveIssue, readIssue(), readIssues(), Execute, jira() (+22 more)

### Community 42 - "TicketJob"
Cohesion: 0.05
Nodes (57): removeAdoptedClone(), namedRepairIds(), BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction(), dependabotReviewGuidance(), pinCourierIdentityRefusal() (+49 more)

### Community 43 - "maintenance/maintenance.ts"
Cohesion: 0.06
Nodes (48): ApproachSchema, maintenancePolicies(), completeNativeCheckpoint(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, BrainStatusSchema, coverageSchema (+40 more)

### Community 44 - "time-scope.ts"
Cohesion: 0.07
Nodes (50): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), server_telemetry_billable_work_issue_key, isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence() (+42 more)

### Community 45 - "telemetry.ts"
Cohesion: 0.09
Nodes (28): CodexRollout, CacheWriteDuration, CODEX_ROWS, ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL, Rates (+20 more)

### Community 46 - "dependency-bots/adopt.ts"
Cohesion: 0.12
Nodes (32): Execute, readBackOrThrow(), adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR (+24 more)

### Community 47 - "remove-candidate.ts"
Cohesion: 0.19
Nodes (17): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+9 more)

### Community 48 - "OfficeScene.tsx"
Cohesion: 0.16
Nodes (34): Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk(), ElevatorStage() (+26 more)

### Community 49 - "index.ts"
Cohesion: 0.08
Nodes (42): ref_hono_node_server, ref_node_http, ref_vite, implementationContinuationRoute(), qaPlanRetryRoute(), assertQuestionVisibility(), close(), config (+34 more)

### Community 50 - "cec/workflow.ts"
Cohesion: 0.09
Nodes (45): applyIntakeObservation(), parksInJira(), resume(), MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), MISSING_SAVED_PLAN, recoverSavedPlan() (+37 more)

### Community 51 - "resume-provider-review.ts"
Cohesion: 0.17
Nodes (28): initialManualStart(), Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), ProjectCard, projectCards() (+20 more)

### Community 52 - "coordination.ts"
Cohesion: 0.05
Nodes (20): observePrerequisites(), BrainFollowup, poll(), readAssignments(), checkpointWindow(), coordination(), Coordinator, dueAt() (+12 more)

### Community 53 - "ticket-evidence.ts"
Cohesion: 0.15
Nodes (21): ref_node_string_decoder, assetDownloader(), attachmentKind(), blankEvidence(), CoverageState, EVIDENCE_LIMITS, EvidenceAttachment, EvidenceReadContext (+13 more)

### Community 54 - "weekly-rollup.ts"
Cohesion: 0.10
Nodes (31): deliveryMetrics(), median(), learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck() (+23 more)

### Community 55 - "task-briefing.ts"
Cohesion: 0.17
Nodes (16): citations(), recordAcceptedKnowledge(), stageName(), knowledgeCitation(), lessonCitation(), assertBriefingScope(), boundEvidence(), EvidenceSelection (+8 more)

### Community 56 - "work.ts"
Cohesion: 0.11
Nodes (22): BLOCKED_CAUSES, blockedCauses(), projectReadiness(), ProjectReadiness, HistoryRetirement, HistoryRetirementIntent, AssignmentResult, BlockedCause (+14 more)

### Community 57 - "scheduled-work.ts"
Cohesion: 0.07
Nodes (57): deliverySlot(), verifiedCloseoutCleanupRequest(), withAmendmentOwnership(), gateFeatureWork(), scheduledInvestigations(), requestPriority(), closedTicketRequest(), REOBSERVED (+49 more)

### Community 58 - "admit-improvement.ts"
Cohesion: 0.14
Nodes (23): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementIntakeGate(), improvementManifest() (+15 more)

### Community 59 - "service-health.ts"
Cohesion: 0.19
Nodes (9): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, HealthReport (+1 more)

### Community 60 - "Effects"
Cohesion: 0.18
Nodes (11): GitHubOperations, fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), lessonText(), Assessment, closeNativeRefresh(), fingerprint() (+3 more)

### Community 61 - "evidence-artifacts.ts"
Cohesion: 0.31
Nodes (11): evidenceDirectory(), readEvidence(), storeEvidence(), ProviderEvidence, canonical(), evidenceDigest(), evidenceHash(), semantic() (+3 more)

### Community 62 - "Outbox.tsx"
Cohesion: 0.08
Nodes (36): SendMessage, ctoInputFailure(), OutboxCTOInput(), recover(), OutboxMaintenanceStatus(), OutboxSavedImplementation(), apply(), review() (+28 more)

### Community 63 - "harnessEffect"
Cohesion: 0.37
Nodes (10): activeEffectId(), harnessEffect, officeMergeProvenance(), reconcileMergeScannerRetry(), Retry, retryMergeScanner(), retryReadBack(), runIdentity() (+2 more)

### Community 64 - "it-specialist.ts"
Cohesion: 0.12
Nodes (24): savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), assignmentDiagnostics(), ITContext, diagnosticContext(), diagnosticSnapshot() (+16 more)

### Community 65 - "useOfficePreferences.ts"
Cohesion: 0.26
Nodes (10): acceptPreferences(), PreferenceCandidate, strip(), UNKNOWN_PREFERENCES, OfficePreferencesController, PreferenceFeedback, PreferenceField, requestPreferences() (+2 more)

### Community 66 - "offices.ts"
Cohesion: 0.06
Nodes (36): ref_smol_toml, ROLES, knowledgeSnapshot(), officeKnowledgeSnapshot(), leadershipContext(), lessonForProject(), knowledgeEntries(), knowledgeOfficeState() (+28 more)

### Community 67 - "record-push.ts"
Cohesion: 0.29
Nodes (8): Event, one(), prePushRejection(), PushIdentity, Candidate, recordedPush(), settledPushBoundary(), LifecycleDiagnostic

### Community 68 - "JiraIssuePublisher"
Cohesion: 0.22
Nodes (5): JiraIssuePublisher, keyOf(), descriptionPreimage(), plain(), publicationDescription()

### Community 69 - "daily-cto.ts"
Cohesion: 0.06
Nodes (42): collectCTOFacts(), DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), reviewWeekday(), boundedIntake(), boundedJobs() (+34 more)

### Community 70 - "QuestionStepper.tsx"
Cohesion: 0.19
Nodes (18): FeatureQuestionProjection, OutboxQuestionRound(), send(), draftKey(), readDraft(), saveDraft(), QuestionRound(), nextQuestion() (+10 more)

### Community 72 - "constellation-runtime.ts"
Cohesion: 0.15
Nodes (17): ref_3d_force_graph, ref_three, CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point (+9 more)

### Community 73 - "stopped-base-validation.ts"
Cohesion: 0.47
Nodes (8): continuationNativeReview(), assertStoppedBaseApproach(), stoppedBaseNextStage(), stoppedBasePackedCommands(), assertAcceptedFiles(), assertStoppedBaseMergeReady(), assertStoppedBaseValidation(), stoppedBaseStageProof()

### Community 74 - "tracking-issue.ts"
Cohesion: 0.33
Nodes (10): ensureTrackingIssue(), findTrackingIssue(), ownTracking(), TrackingIssue, trackingIssueBody(), trackingIssueTitle(), trackingMarker(), centralCompanionHandoff() (+2 more)

### Community 75 - "codex-rollout.ts"
Cohesion: 0.29
Nodes (9): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO (+1 more)

### Community 76 - "lesson-selection.ts"
Cohesion: 0.13
Nodes (18): INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), LessonSelection, MAINTENANCE, MAX_LESSONS (+10 more)

### Community 77 - "demand-facts.ts"
Cohesion: 0.33
Nodes (8): clip(), DEMAND_LIMIT, demandFacts(), DemandSection, key(), LessonKey, notes(), MissedQuery

### Community 78 - "Store"
Cohesion: 0.08
Nodes (32): ref_zod, channelNoticeAuthorized(), ChannelSettings, notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR (+24 more)

### Community 79 - "store.ts"
Cohesion: 0.14
Nodes (16): ref_node_sqlite, Clock, systemClock, applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, statementCache() (+8 more)

### Community 80 - "highestStableAtLeast"
Cohesion: 0.83
Nodes (3): compare(), highestStableAtLeast(), parts()

### Community 81 - "create-candidate.ts"
Cohesion: 0.48
Nodes (6): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf()

### Community 83 - "run-evidence.ts"
Cohesion: 0.38
Nodes (5): comparable(), EvidenceOutcome, recordRunEvidence(), backfillClaudeCost(), RunAccounting

### Community 86 - "node-visuals.ts"
Cohesion: 0.20
Nodes (13): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+5 more)

### Community 87 - "unblock-brief.ts"
Cohesion: 0.53
Nodes (5): clearUnblockBrief(), key(), saveUnblockBrief(), unblockBrief, src_shared_learningsubject

### Community 88 - "conversations/conversations.ts"
Cohesion: 0.10
Nodes (19): ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff(), saveGoals() (+11 more)

### Community 89 - "preferences-store.ts"
Cohesion: 0.19
Nodes (9): PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS, OfficePreferences (+1 more)

### Community 91 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 92 - "report.ts"
Cohesion: 0.26
Nodes (13): Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked(), row() (+5 more)

### Community 93 - "capture-session-clone.py"
Cohesion: 0.15
Nodes (10): ctypes, errno, importlib_util, json, os, pathlib, Copy a coherent macOS clone of inherited reader fd3 to anonymous target fd4. No…, Read-only protocol adapter for the installed review helper. No model dispatch. (+2 more)

### Community 95 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (10): ref_react_three_drei, ref_react_three_fiber, ref_three_stdlib, CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility (+2 more)

### Community 97 - "createConstellation"
Cohesion: 0.19
Nodes (5): ConstellationRuntime, createConstellation(), enter(), finishTap(), move()

### Community 102 - "process.ts"
Cohesion: 0.08
Nodes (25): GitHubFeaturePublisher, JiraFeaturePublisher, FeatureReviewRunner, CommandRegistry, CommandScope, inside(), RegisteredCommand, inactivityWatch() (+17 more)

### Community 103 - "cli.ts"
Cohesion: 0.18
Nodes (9): ref_node_stream, ref_node_timers, args, [cmd,...rawArgs], commands, key, projectIndex, lessonBrainAudit (+1 more)

### Community 107 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (6): ref_mammoth, ref_pdfjs_dist, bounded(), extract(), fail(), [path,kind]

## Knowledge Gaps
- **497 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+492 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 641 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `source-amendment.ts`, `agents.ts`, `outbox.ts`, `post-conflict-preparation.ts`, `ref_node_path`, `session-bridge.ts`, `engine.ts`, `assignments.ts`, `features/workflow.ts`, `github/issue-publication.ts`, `closeout-recovery.ts`, `run.ts`, `config.ts`, `ref_node_crypto`, `OfficeSnapshot`, `worker-runtime.ts`, `record-trigger.ts`, `artifact`, `github-delivery.ts`, `digest`, `StageResult`, `pilot-delivery.ts`, `TimeBook.tsx`, `run-retrospective.ts`, `dependencies.ts`, `.emit`, `sanitize`, `cec/issue-publication.ts`, `features.ts`, `reader.ts`, `shared.ts`, `run-accounting.ts`, `inspect-closed-plan.ts`, `intent.ts`, `.save`, `TicketJob`, `maintenance/maintenance.ts`, `time-scope.ts`, `dependency-bots/adopt.ts`, `remove-candidate.ts`, `index.ts`, `cec/workflow.ts`, `resume-provider-review.ts`, `coordination.ts`, `ticket-evidence.ts`, `weekly-rollup.ts`, `task-briefing.ts`, `scheduled-work.ts`, `admit-improvement.ts`, `Effects`, `evidence-artifacts.ts`, `harnessEffect`, `it-specialist.ts`, `offices.ts`, `record-push.ts`, `JiraIssuePublisher`, `daily-cto.ts`, `stopped-base-validation.ts`, `tracking-issue.ts`, `lesson-selection.ts`, `store.ts`, `create-candidate.ts`, `run-evidence.ts`, `ProjectProgress`, `QuestionNotifications`, `conversations/conversations.ts`, `process.ts`?**
  _High betweenness centrality (0.104) - this node is a cross-community bridge._
- **Why does `Engine` connect `engine.ts` to `sanitize`, `cec/issue-publication.ts`, `offices.ts`, `agents.ts`, `shared.ts`, `intent.ts`, `features/workflow.ts`, `maintenance/maintenance.ts`, `Store`, `cec/workflow.ts`, `coordination.ts`, `github-delivery.ts`, `digest`, `pilot-delivery.ts`, `scheduled-work.ts`, `conversations/conversations.ts`, `Effects`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `TicketJob` connect `TicketJob` to `source-amendment.ts`, `Inspector.tsx`, `agents.ts`, `post-conflict-preparation.ts`, `ref_node_path`, `closeout-recovery.ts`, `config.ts`, `OfficeSnapshot`, `record-trigger.ts`, `artifact`, `github-delivery.ts`, `digest`, `StageResult`, `pilot-delivery.ts`, `run-retrospective.ts`, `shared.ts`, `maintenance/maintenance.ts`, `dependency-bots/adopt.ts`, `remove-candidate.ts`, `cec/workflow.ts`, `resume-provider-review.ts`, `harnessEffect`, `it-specialist.ts`, `offices.ts`, `record-push.ts`, `daily-cto.ts`, `stopped-base-validation.ts`, `create-candidate.ts`, `ProjectProgress`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _497 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `source-amendment.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06342342342342343 - nodes in this community are weakly interconnected._
- **Should `ref_react` be split into smaller, more focused modules?**
  _Cohesion score 0.07789678675754626 - nodes in this community are weakly interconnected._
- **Should `Inspector.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10843373493975904 - nodes in this community are weakly interconnected._