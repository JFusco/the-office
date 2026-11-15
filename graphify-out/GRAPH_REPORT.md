# Graph Report - office-map-universe-nov15  (2026-11-15)

## Corpus Check
- 822 files · ~334,103 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4091 nodes · 19114 edges · 112 communities (111 shown, 1 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 620 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a6e99ae1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- packed165-admission.ts
- github-readiness.ts
- post-conflict-preparation.ts
- ticket-evidence.ts
- session-bridge.ts
- shared.ts
- requests.ts
- maintenance/maintenance.ts
- publish-pr.ts
- Inspector.tsx
- process.ts
- time-scope.ts
- closeout-recovery.ts
- candidate.ts
- api-routes.ts
- .transaction
- source-amendment.ts
- agents.ts
- github-delivery.ts
- run.ts
- daily-cto.ts
- scheduled-captures.ts
- Button
- App.tsx
- Store
- TimeBook.tsx
- worker-runtime.ts
- lesson-selection.ts
- config.ts
- office-lessons.ts
- delivery-recoveries.ts
- mutedCopy
- Offices
- Role
- accept-stage-result.ts
- harnessDelivers
- Goals.tsx
- verifyRepairCandidate
- notifications.ts
- pilot-delivery.ts
- record-trigger.ts
- .emit
- run-retrospective.ts
- QuestionStepper.tsx
- index.tsx
- artifact
- azure.ts
- coordination.ts
- ServiceHealthPanel.tsx
- ref_node_path
- enrollment-gate.ts
- weekly-rollup.ts
- constellation-runtime.ts
- .save
- assignments.ts
- Effects
- knowledge.ts
- scheduled-work.ts
- digest
- HOLDS
- cost-ledger.ts
- OfficeScene.tsx
- goal-reporting.ts
- activation-recovery.ts
- ref_zod
- command
- sanitize
- retrospective-subject.ts
- blocker-followups.ts
- work.ts
- jira-time.ts
- remove-candidate.ts
- github-check-selection.ts
- dependency-bots/adopt.ts
- admit-improvement.ts
- run-accounting.ts
- telemetry.ts
- node-visuals.ts
- scene-motion.ts
- .api
- accept-retrospective.ts
- cec/issue-publication.ts
- preferences.ts
- capture-session-clone.py
- RoomCamera.tsx
- owned-artifact.ts
- report.ts
- service-health.ts
- codex-rollout.ts
- index.ts
- command-registry.ts
- jira-operations.ts
- brain-audit-reuse.ts
- http/context.ts
- install-service.mjs
- cli.ts
- extract-worker.mjs
- create-candidate.ts
- intent.ts
- continue-unsealed-qa.ts
- assignment-poll.ts
- engine.ts
- inspect-closed-plan.ts
- createConstellation
- projects.ts
- ledger.ts
- time-readback.ts
- continue-access-only-plan.ts
- evidence-digest.ts
- cost-totals.ts
- QuestionNotifications
- run-evidence.ts

## God Nodes (most connected - your core abstractions)
1. `Store` - 365 edges
2. `TicketJob` - 176 edges
3. `digest()` - 167 edges
4. `artifact()` - 129 edges
5. `GitHubDelivery` - 122 edges
6. `command()` - 113 edges
7. `workKey()` - 101 edges
8. `currentAssignment()` - 88 edges
9. `cx()` - 88 edges
10. `Button` - 84 edges

## Surprising Connections (you probably didn't know these)
- `apply()` --indirect_call--> `note()`  [INFERRED]
  src/conversations/OutboxSavedImplementation.tsx → server/cec/parking/resume-parked.ts
- `DeliveryAuthorityInput` --references--> `HarnessRequest`  [EXTRACTED]
  server/delivery/harness/delivery-authority.ts → src/contracts/work.ts
- `LessonBrainOverlap` --references--> `Lesson`  [EXTRACTED]
  server/knowledge/lesson-brain-audit.ts → src/contracts/knowledge.ts
- `DeliverySlot` --references--> `Role`  [EXTRACTED]
  server/office/projects.ts → src/shared.ts
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

## Communities (112 total, 1 thin omitted)

### Community 0 - "packed165-admission.ts"
Cohesion: 0.14
Nodes (29): accounting, DeliverySubject, nonDelivery, originalReads, HarnessControl, withHarnessWork(), admitPacked165(), history() (+21 more)

### Community 1 - "github-readiness.ts"
Cohesion: 0.10
Nodes (45): findingsBlock(), resumeProviderReviews(), APPROACH_GUIDANCE, reviewInstructions(), deliveryTask(), DeliveryTaskInput, closeoutReceipt(), hasUncertainEffects() (+37 more)

### Community 2 - "post-conflict-preparation.ts"
Cohesion: 0.07
Nodes (62): pinCourier, pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), assertPostConflictFiles(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), routeReadyPostConflictPublication(), verifyInitialDraftConflictPreparation() (+54 more)

### Community 3 - "ticket-evidence.ts"
Cohesion: 0.14
Nodes (22): ref_node_string_decoder, assetDownloader(), attachmentKind(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS, EvidenceAttachment (+14 more)

### Community 4 - "session-bridge.ts"
Cohesion: 0.06
Nodes (54): ref_node_perf_hooks, ref_ws, claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexDaemonProcesses(), accountCodexProcesses() (+46 more)

### Community 5 - "shared.ts"
Cohesion: 0.06
Nodes (30): itChatPrompt(), assignmentDiagnostics(), diagnosticContext(), fields, PreferencesPatch, StoredBody, DailyCTOSummary, PackedPublicationRepair (+22 more)

### Community 6 - "requests.ts"
Cohesion: 0.11
Nodes (46): continuationScope(), continuationWorktree(), continuationGuard(), discoveryRecoveryCandidate(), brainImplementationCandidate(), BrainReadback, digest(), implementationRecoveryCandidate() (+38 more)

### Community 7 - "maintenance/maintenance.ts"
Cohesion: 0.06
Nodes (49): ApproachSchema, maintenancePolicies(), completeNativeCheckpoint(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, BrainStatusSchema, identity (+41 more)

### Community 8 - "publish-pr.ts"
Cohesion: 0.12
Nodes (44): retryRead(), admitPRMetadata(), assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema, savedMetadataAssessment(), validateSaved() (+36 more)

### Community 9 - "Inspector.tsx"
Cohesion: 0.12
Nodes (54): Outbox(), labels, ServiceHealthRow(), BlockerFollowups(), LearningCoverage(), LessonsPanel(), when(), GoalList() (+46 more)

### Community 10 - "process.ts"
Cohesion: 0.14
Nodes (20): Event, one(), prePushRejection(), PushIdentity, Candidate, recordedPush(), settledPushBoundary(), inactivityWatch() (+12 more)

### Community 11 - "time-scope.ts"
Cohesion: 0.16
Nodes (25): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), midnight(), TicketDay (+17 more)

### Community 12 - "closeout-recovery.ts"
Cohesion: 0.11
Nodes (41): assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint(), closeoutProviderEvidence() (+33 more)

### Community 13 - "candidate.ts"
Cohesion: 0.19
Nodes (17): GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles(), ContinuationIO (+9 more)

### Community 14 - "api-routes.ts"
Cohesion: 0.23
Nodes (15): implementationPreview(), implementationContinuationRoute(), qaPlanRetryRoute(), goalHistory(), apiRoute(), RequestContext, fileResponse(), json() (+7 more)

### Community 15 - ".transaction"
Cohesion: 0.07
Nodes (57): ref_node_url, approveFeature(), featureById(), mutation(), discoveryPrompt(), planPrompt(), artifactPath(), digest() (+49 more)

### Community 16 - "source-amendment.ts"
Cohesion: 0.05
Nodes (87): ref_node_async_hooks, adoptCandidate(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related (+79 more)

### Community 17 - "agents.ts"
Cohesion: 0.05
Nodes (57): implementationWorkerContext(), IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), intakeMembership(), projectListScope(), cecPrompt() (+49 more)

### Community 18 - "github-delivery.ts"
Cohesion: 0.05
Nodes (47): ProjectProgress, BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction(), dependabotReviewGuidance(), discover(), refreshDependencies() (+39 more)

### Community 19 - "run.ts"
Cohesion: 0.18
Nodes (16): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, OFFICE_FIX_PROMPT, OfficeFixResult, validateOfficeFix(), investigationReady(), InvestigationOptions, InvestigationReport (+8 more)

### Community 20 - "daily-cto.ts"
Cohesion: 0.12
Nodes (12): DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), dailyReviewDate(), reviewWeekday(), DailyResultSchema, Briefing (+4 more)

### Community 21 - "scheduled-captures.ts"
Cohesion: 0.14
Nodes (49): requestDelivery(), createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest (+41 more)

### Community 22 - "Button"
Cohesion: 0.08
Nodes (61): ref_react, ref_react_markdown, ref_remark_gfm, ref_yaml, KnowledgeActivity, KnowledgeActivityPage, KnowledgeEdge, KnowledgeMap (+53 more)

### Community 23 - "App.tsx"
Cohesion: 0.05
Nodes (77): ref_lucide_react, ref_motion, ref_react_dom, BrainDrawer(), themeColor, App(), BrainWorkspace, CONNECTION (+69 more)

### Community 24 - "Store"
Cohesion: 0.05
Nodes (46): ref_node_sqlite, assertFeatureDependencyOrder(), featureDependencyEdges(), key(), FeatureReviewRunner, queueImprovements(), Clock, EASTERN (+38 more)

### Community 25 - "TimeBook.tsx"
Cohesion: 0.14
Nodes (24): LiveAgentTask(), Props, RunningTask(), text(), Agent, AzureBuild, src_shared_liveanchor, lastWall (+16 more)

### Community 26 - "worker-runtime.ts"
Cohesion: 0.06
Nodes (44): SlackResultSchema, SlackVerificationSchema, candidateWorkspaceEnvironment(), AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), assignmentSubject(), LessonSelection, catalogLine() (+36 more)

### Community 27 - "lesson-selection.ts"
Cohesion: 0.12
Nodes (23): lessonIssueBody(), lessonIssueMarker(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), lessonText() (+15 more)

### Community 28 - "config.ts"
Cohesion: 0.08
Nodes (64): ref_node_crypto, commandFeature(), reviewQuestions(), featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), DELAYS, MAX_EXECUTIONS (+56 more)

### Community 29 - "office-lessons.ts"
Cohesion: 0.15
Nodes (17): normalizeStatement(), decideOfficeProposal(), mirrorOfficeKnowledge(), now(), OfficeKnowledgeStore, proposeOfficeLessons(), retireOfficeLesson(), Input (+9 more)

### Community 30 - "delivery-recoveries.ts"
Cohesion: 0.13
Nodes (28): deliveryIntakeBlocker(), boardPreflightCandidate(), partialLocalCleanupCandidate(), partialLocalCleanupKey(), candidateInput(), children, oldAdoptionBasis(), savedAdmissionUnresolved() (+20 more)

### Community 31 - "mutedCopy"
Cohesion: 0.15
Nodes (32): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS, PickupForm(), acceptPreferences() (+24 more)

### Community 32 - "Offices"
Cohesion: 0.13
Nodes (8): CommittedBrain, leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), seedOfficeLessons(), Offices, markCaptureStart()

### Community 33 - "Role"
Cohesion: 0.11
Nodes (40): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+32 more)

### Community 34 - "accept-stage-result.ts"
Cohesion: 0.08
Nodes (61): parksInJira(), run(), containedFile(), publicationEvidenceGap(), qaEvidenceGap(), stageResultGap(), namedRepairIds(), DECISION_KINDS (+53 more)

### Community 35 - "harnessDelivers"
Cohesion: 0.16
Nodes (21): deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, requireDeliveryAuthority(), gateRegisteredDelivery(), resolveDeliveryWork(), assertDeliveryMayMutate() (+13 more)

### Community 36 - "Goals.tsx"
Cohesion: 0.09
Nodes (32): OutboxSavedImplementation(), apply(), review(), OutboxSavedPlan(), reconcile(), FeatureDelivery(), FeatureDocuments(), views (+24 more)

### Community 37 - "verifyRepairCandidate"
Cohesion: 0.24
Nodes (17): removeAdoptedClone(), stoppedBaseCheckout(), adoptedReviewCandidate(), ciCheckout(), finishCISetup(), verifyCIHooks(), CIFailure, guardCIRepair() (+9 more)

### Community 38 - "notifications.ts"
Cohesion: 0.11
Nodes (25): channelNoticeAuthorized(), ChannelSettings, notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR, plainSlackText() (+17 more)

### Community 39 - "pilot-delivery.ts"
Cohesion: 0.18
Nodes (16): continueImplementation(), drainDelivery(), resume(), startPilot(), OfficeQAHandoffInput, MISSING_SAVED_PLAN, recoverSavedPlan(), Attempt (+8 more)

### Community 40 - "record-trigger.ts"
Cohesion: 0.09
Nodes (46): BLOCKING, blockingTrigger, isBlocking(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences(), busyMaintenanceIds() (+38 more)

### Community 41 - ".emit"
Cohesion: 0.19
Nodes (21): decideImplementation(), requestQAPlanRetry(), configureChannelNotices(), configureNotices(), retryRecipientLookup(), recoverCTOInput(), enqueueGreen156(), bindDiscoveryResume() (+13 more)

### Community 42 - "run-retrospective.ts"
Cohesion: 0.15
Nodes (21): brainOverlap, brainOverlapQuery(), clip(), fits(), withBrainOverlap(), withDemand(), improvementIntakeGate(), captureLearning() (+13 more)

### Community 43 - "QuestionStepper.tsx"
Cohesion: 0.13
Nodes (26): FeatureHarnessOption, FeatureOption, FeatureQuestion, FeatureQuestionProjection, OutboxQuestionRound(), send(), draftKey(), readDraft() (+18 more)

### Community 44 - "index.tsx"
Cohesion: 0.06
Nodes (51): Conversation(), SendMessage, LessonDecisionAction, lessonDecisionState(), readLessonDecision(), ctoInputFailure(), OutboxCTOInput(), recover() (+43 more)

### Community 45 - "artifact"
Cohesion: 0.11
Nodes (44): closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), allowed, continuationNativeReview(), continuationReviewArtifacts(), continuationWorkerProof(), negativeWorker(), reconcileContinuationReview() (+36 more)

### Community 46 - "azure.ts"
Cohesion: 0.17
Nodes (19): az(), base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs(), fullActivePRs() (+11 more)

### Community 47 - "coordination.ts"
Cohesion: 0.08
Nodes (42): Admission, admit(), IntakeContext, WAIT_STATUSES, compatible(), dependencyCompletionKey(), dependencyEligibility(), DependencyStores (+34 more)

### Community 48 - "ServiceHealthPanel.tsx"
Cohesion: 0.11
Nodes (35): TelemetryReport, blockedSummary(), itAgent(), itDiagnostics(), itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps() (+27 more)

### Community 49 - "ref_node_path"
Cohesion: 0.12
Nodes (27): ref_node_fs, ref_node_os, ref_node_path, ref_node_util, interruptedImplementation(), hash, contentTypes, readStoppedClaudeNative() (+19 more)

### Community 50 - "enrollment-gate.ts"
Cohesion: 0.23
Nodes (18): dispatchNightly(), eligibility(), featureEffectGate(), assertFeatureGate(), bindFeature(), currentApproval(), featureGate(), predecessorComplete() (+10 more)

### Community 51 - "weekly-rollup.ts"
Cohesion: 0.10
Nodes (32): learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), BRAIN_SCOPE (+24 more)

### Community 52 - "constellation-runtime.ts"
Cohesion: 0.15
Nodes (17): ref_3d_force_graph, ref_three, CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point (+9 more)

### Community 53 - ".save"
Cohesion: 0.18
Nodes (30): jiraCollection(), BLOCKED, findComment(), LiveIssue, readIssue(), readIssues(), Execute, jira() (+22 more)

### Community 54 - "assignments.ts"
Cohesion: 0.08
Nodes (36): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, GraphNode (+28 more)

### Community 55 - "Effects"
Cohesion: 0.21
Nodes (10): diagnosticProof(), recoverDiscovery(), scopeNote(), GitHubOperations, fileLessonIssue(), Assessment, closeNativeRefresh(), fingerprint() (+2 more)

### Community 56 - "knowledge.ts"
Cohesion: 0.10
Nodes (29): clip(), DEMAND_LIMIT, demandFacts(), key(), LessonKey, notes(), clip(), MISSED_QUERY_LIMIT (+21 more)

### Community 57 - "scheduled-work.ts"
Cohesion: 0.12
Nodes (26): deliverySlot(), ROLES, metadataRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), requestPriority(), closedTicketRequest(), REOBSERVED (+18 more)

### Community 58 - "digest"
Cohesion: 0.15
Nodes (29): admitGreen156(), GREEN156, green156Admitted(), green156Subject(), retainedGreen156Audit(), assertStoppedBaseAudit(), AuditRow, CoverageRow (+21 more)

### Community 59 - "HOLDS"
Cohesion: 0.24
Nodes (23): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), ProjectCard, projectCards(), projectGraphql() (+15 more)

### Community 60 - "cost-ledger.ts"
Cohesion: 0.14
Nodes (29): captureCost(), server_telemetry_cost_entries_costcoveragesummary, costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress() (+21 more)

### Community 61 - "OfficeScene.tsx"
Cohesion: 0.17
Nodes (33): Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk(), ElevatorStage() (+25 more)

### Community 62 - "goal-reporting.ts"
Cohesion: 0.11
Nodes (30): githubPRDescription(), collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB (+22 more)

### Community 63 - "activation-recovery.ts"
Cohesion: 0.14
Nodes (32): PrerequisitesSchema, activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal (+24 more)

### Community 64 - "ref_zod"
Cohesion: 0.11
Nodes (24): ref_zod, pumpCTO(), queueCTOHandoff(), saveGoals(), applyGoalReview(), EvidenceRefSchema, FreshDailyResultSchema, GoalEvidenceRequestSchema (+16 more)

### Community 65 - "command"
Cohesion: 0.07
Nodes (9): AzureMonitor, correlatedBuild(), GitHubMonitor, Engine, observe(), observeParked(), parkedReadError, command() (+1 more)

### Community 66 - "sanitize"
Cohesion: 0.07
Nodes (33): ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, ctoInputIdentityMatches(), ctoInputRecovered(), pumpIT() (+25 more)

### Community 67 - "retrospective-subject.ts"
Cohesion: 0.13
Nodes (22): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+14 more)

### Community 68 - "blocker-followups.ts"
Cohesion: 0.19
Nodes (18): assertConversationReadback(), conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), finishSupersededReadback(), pump(), savePickup(), canFileGithubIssue() (+10 more)

### Community 69 - "work.ts"
Cohesion: 0.11
Nodes (21): BLOCKED_CAUSES, blockedCauses(), projectReadiness(), ProjectReadiness, HistoryRetirement, HistoryRetirementIntent, AssignmentResult, BlockedCause (+13 more)

### Community 70 - "jira-time.ts"
Cohesion: 0.14
Nodes (20): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+12 more)

### Community 71 - "remove-candidate.ts"
Cohesion: 0.18
Nodes (18): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot() (+10 more)

### Community 72 - "github-check-selection.ts"
Cohesion: 0.22
Nodes (18): checksFailed(), checksPassed(), checksPending(), CurrentChecksWait, currentMergeChecks(), pass(), pending(), requireThat() (+10 more)

### Community 73 - "dependency-bots/adopt.ts"
Cohesion: 0.05
Nodes (47): Execute, readBackOrThrow(), adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR (+39 more)

### Community 74 - "admit-improvement.ts"
Cohesion: 0.23
Nodes (15): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+7 more)

### Community 75 - "run-accounting.ts"
Cohesion: 0.12
Nodes (28): BoundedRead, backfillClaudeCost(), CompletionReader, codexHome(), createdAt(), dayDirs(), header(), readCodexRollout() (+20 more)

### Community 76 - "telemetry.ts"
Cohesion: 0.10
Nodes (25): CacheWriteDuration, CODEX_ROWS, ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL, Rates, basisOf() (+17 more)

### Community 77 - "node-visuals.ts"
Cohesion: 0.20
Nodes (13): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+5 more)

### Community 78 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 79 - ".api"
Cohesion: 0.21
Nodes (16): Execute, installDependencies(), major(), harnessCloseout(), PASSING, verifyMergeActions(), runHarnessStage(), harnessStageResult() (+8 more)

### Community 80 - "accept-retrospective.ts"
Cohesion: 0.08
Nodes (39): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, curateLesson(), Curation, CurationAction, mergeEvidence() (+31 more)

### Community 81 - "cec/issue-publication.ts"
Cohesion: 0.08
Nodes (23): Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), Transition, descriptionPreimage(), plain() (+15 more)

### Community 82 - "preferences.ts"
Cohesion: 0.29
Nodes (5): preferencesRoute(), PreferencesRouteContext, PreferencesStore, PreferenceState, OfficePreferences

### Community 83 - "capture-session-clone.py"
Cohesion: 0.15
Nodes (10): ctypes, errno, importlib_util, json, os, pathlib, Copy a coherent macOS clone of inherited reader fd3 to anonymous target fd4. No…, Read-only protocol adapter for the installed review helper. No model dispatch. (+2 more)

### Community 84 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (10): ref_react_three_drei, ref_react_three_fiber, ref_three_stdlib, CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility (+2 more)

### Community 85 - "owned-artifact.ts"
Cohesion: 0.19
Nodes (16): investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, NOTIFY_HELPER, notifyHelperResolution(), OFFICE_SOURCE_PATHS, officeSource() (+8 more)

### Community 86 - "report.ts"
Cohesion: 0.29
Nodes (12): Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked(), row() (+4 more)

### Community 87 - "service-health.ts"
Cohesion: 0.19
Nodes (10): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, slackHealth() (+2 more)

### Community 88 - "codex-rollout.ts"
Cohesion: 0.25
Nodes (10): add(), CodexRequest, CodexRollout, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens() (+2 more)

### Community 89 - "index.ts"
Cohesion: 0.13
Nodes (14): ref_hono_node_server, ref_node_http, close(), config, itSpecialist, loadedRevision, offices, releaseLock (+6 more)

### Community 90 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 91 - "jira-operations.ts"
Cohesion: 0.24
Nodes (9): CommentPage, commentReadback(), JiraOperations, plain(), jiraRecord(), unpack(), metadataDigest(), verifiedTransition() (+1 more)

### Community 92 - "brain-audit-reuse.ts"
Cohesion: 0.20
Nodes (13): bindBrainAuditEffects(), Effect, Known, assertPriorBrainAudit(), brainAuditRetryFingerprint(), Context, jsonAfter(), nativeSessionPath() (+5 more)

### Community 93 - "http/context.ts"
Cohesion: 0.22
Nodes (10): ref_vite, ITSpecialist, ServiceContext, OfficeConfigInputs, officeConfigRoute(), officeConfigSummary(), CECBinding, runtimeRevision() (+2 more)

### Community 94 - "install-service.mjs"
Cohesion: 0.18
Nodes (10): ref_node_child_process, file, folder, logs, root, GIT_NETWORK, LIVE_PROVIDERS, liveReach() (+2 more)

### Community 95 - "cli.ts"
Cohesion: 0.17
Nodes (10): ref_node_stream, ref_node_timers, args, [cmd,...rawArgs], commands, key, projectIndex, lessonBrainAudit (+2 more)

### Community 96 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (6): ref_mammoth, ref_pdfjs_dist, bounded(), extract(), fail(), [path,kind]

### Community 97 - "create-candidate.ts"
Cohesion: 0.48
Nodes (6): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf()

### Community 98 - "intent.ts"
Cohesion: 0.23
Nodes (9): assertOwnership(), ImplementationDecision, consumeQAPlanRetry(), Decision, ImplementationContinuation, ImplementationContinuationInput, ImplementationContinuationRequest, SavedImplementationProof (+1 more)

### Community 99 - "continue-unsealed-qa.ts"
Cohesion: 0.26
Nodes (10): OwnershipRead, continueUnsealedQA(), entry(), handoffOwnership(), ReadbackOwnerDecision, View, OfficeQAHandoff, OfficeQAHandoffInput (+2 more)

### Community 100 - "assignment-poll.ts"
Cohesion: 0.18
Nodes (15): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), admitReadyCards(), due() (+7 more)

### Community 101 - "engine.ts"
Cohesion: 0.26
Nodes (9): applyIntakeObservation(), checkMail(), drainMail(), requestMail(), enableNightly(), ingest(), drainMaintenance(), reconcileMaintenance() (+1 more)

### Community 102 - "inspect-closed-plan.ts"
Cohesion: 0.23
Nodes (9): closedReadonlyPlan(), Document, entryExists(), inspectClosedQAPlan(), reviewedPlanGuidance, reviewedPlanGuideDigest, QAPlanRetry, QAPlanRetryProof (+1 more)

### Community 103 - "createConstellation"
Cohesion: 0.19
Nodes (5): ConstellationRuntime, createConstellation(), enter(), finishTap(), move()

### Community 104 - "projects.ts"
Cohesion: 0.20
Nodes (9): ref_smol_toml, DATA, file, project, root, DeliverySlot, officeCapacity, PROJECTS (+1 more)

### Community 105 - "ledger.ts"
Cohesion: 0.41
Nodes (8): diagnosticSnapshot(), investigationCandidates(), investigationId(), investigationFollowUps(), investigationResolution(), syncInvestigations(), requeueInvestigationEvidence(), retriedReadResolution()

### Community 106 - "time-readback.ts"
Cohesion: 0.31
Nodes (5): TimeLedger, Readback, READBACK_INTERVAL_MS, readBackTime(), SETTLE_MS

### Community 107 - "continue-access-only-plan.ts"
Cohesion: 0.39
Nodes (6): Document, isAccessOnlyPlan(), settledAccessOnlyState(), continueAccessOnlyPlan(), entryExists(), send()

### Community 108 - "evidence-digest.ts"
Cohesion: 0.44
Nodes (7): canonical(), evidenceDigest(), evidenceHash(), semantic(), stableUrl(), requirementDrift(), RequirementPostimage

### Community 109 - "cost-totals.ts"
Cohesion: 0.38
Nodes (6): server_telemetry_billable_work_issue_key, awaitingEvidence(), CaptureContext, inCostWindow(), TicketCost, ticketCosts()

### Community 111 - "run-evidence.ts"
Cohesion: 0.47
Nodes (4): comparable(), EvidenceOutcome, recordRunEvidence(), RunAccounting

## Knowledge Gaps
- **497 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+492 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 635 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `packed165-admission.ts`, `github-readiness.ts`, `post-conflict-preparation.ts`, `ticket-evidence.ts`, `session-bridge.ts`, `shared.ts`, `requests.ts`, `maintenance/maintenance.ts`, `publish-pr.ts`, `process.ts`, `time-scope.ts`, `closeout-recovery.ts`, `candidate.ts`, `api-routes.ts`, `.transaction`, `source-amendment.ts`, `agents.ts`, `github-delivery.ts`, `run.ts`, `scheduled-captures.ts`, `App.tsx`, `worker-runtime.ts`, `lesson-selection.ts`, `config.ts`, `office-lessons.ts`, `delivery-recoveries.ts`, `Offices`, `accept-stage-result.ts`, `harnessDelivers`, `verifyRepairCandidate`, `notifications.ts`, `pilot-delivery.ts`, `record-trigger.ts`, `.emit`, `run-retrospective.ts`, `artifact`, `azure.ts`, `coordination.ts`, `ref_node_path`, `enrollment-gate.ts`, `weekly-rollup.ts`, `.save`, `assignments.ts`, `Effects`, `knowledge.ts`, `scheduled-work.ts`, `digest`, `HOLDS`, `cost-ledger.ts`, `goal-reporting.ts`, `activation-recovery.ts`, `ref_zod`, `command`, `sanitize`, `retrospective-subject.ts`, `blocker-followups.ts`, `jira-time.ts`, `remove-candidate.ts`, `dependency-bots/adopt.ts`, `admit-improvement.ts`, `run-accounting.ts`, `accept-retrospective.ts`, `cec/issue-publication.ts`, `owned-artifact.ts`, `jira-operations.ts`, `brain-audit-reuse.ts`, `create-candidate.ts`, `intent.ts`, `continue-unsealed-qa.ts`, `engine.ts`, `inspect-closed-plan.ts`, `ledger.ts`, `time-readback.ts`, `continue-access-only-plan.ts`, `QuestionNotifications`, `run-evidence.ts`?**
  _High betweenness centrality (0.112) - this node is a cross-community bridge._
- **Why does `Coordinator` connect `dependency-bots/adopt.ts` to `Offices`, `session-bridge.ts`, `assignment-poll.ts`, `requests.ts`, `maintenance/maintenance.ts`, `coordination.ts`, `scheduled-captures.ts`, `Store`, `scheduled-work.ts`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `command()` connect `command` to `packed165-admission.ts`, `github-readiness.ts`, `ticket-evidence.ts`, `session-bridge.ts`, `requests.ts`, `maintenance/maintenance.ts`, `publish-pr.ts`, `process.ts`, `closeout-recovery.ts`, `candidate.ts`, `.transaction`, `agents.ts`, `github-delivery.ts`, `Store`, `worker-runtime.ts`, `lesson-selection.ts`, `config.ts`, `accept-stage-result.ts`, `harnessDelivers`, `verifyRepairCandidate`, `notifications.ts`, `azure.ts`, `coordination.ts`, `ref_node_path`, `weekly-rollup.ts`, `.save`, `assignments.ts`, `Effects`, `HOLDS`, `cost-ledger.ts`, `goal-reporting.ts`, `jira-time.ts`, `remove-candidate.ts`, `dependency-bots/adopt.ts`, `.api`, `cec/issue-publication.ts`, `service-health.ts`, `command-registry.ts`, `jira-operations.ts`, `install-service.mjs`, `create-candidate.ts`, `continue-unsealed-qa.ts`, `engine.ts`, `inspect-closed-plan.ts`, `time-readback.ts`, `continue-access-only-plan.ts`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _497 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `packed165-admission.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13510520487264674 - nodes in this community are weakly interconnected._
- **Should `github-readiness.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1016949152542373 - nodes in this community are weakly interconnected._
- **Should `post-conflict-preparation.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07171171171171171 - nodes in this community are weakly interconnected._