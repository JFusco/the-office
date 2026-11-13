# Graph Report - the-office  (2026-11-12)

## Corpus Check
- 741 files · ~305,269 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3809 nodes · 17827 edges · 100 communities (98 shown, 2 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 582 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9e9d38bf`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- source-amendment.ts
- Inspector.tsx
- GitHubIssuePublisher
- harnessEffect
- post-conflict-preparation.ts
- telemetry.ts
- authorize.ts
- artifact
- coordination.ts
- shared.ts
- index.ts
- Store
- github-delivery.ts
- constellation-runtime.ts
- daily-cto.ts
- session-bridge.ts
- store.ts
- requests.ts
- closeout-recovery.ts
- OfficeScene.tsx
- local-config.ts
- scheduled-captures.ts
- cost-ledger.ts
- Button
- assignments.ts
- PeoplePanel.tsx
- recovery/stopped-base-update.ts
- ticket-evidence.ts
- TicketJob
- run.ts
- record-trigger.ts
- ref_react
- agents.ts
- config.ts
- ref_zod
- process.ts
- digest
- work-summary.ts
- TelemetryPanel.tsx
- App.tsx
- GitHubDelivery
- engine.ts
- enrollment-gate.ts
- run-retrospective.ts
- cec/workflow.ts
- scheduled-work.ts
- index.tsx
- time-scope.ts
- .emit
- features.ts
- knowledge.ts
- ref_node_path
- cec/issue-publication.ts
- assignment-poll.ts
- StageResult
- tracking-issue.ts
- fact-bounds.ts
- Coordinator
- Engine
- .transaction
- outbox.ts
- jira-time.ts
- .save
- OfficeSnapshot
- remove-candidate.ts
- pre-push-boundary.ts
- admit-improvement.ts
- lesson-selection.ts
- source-amendment-scope.ts
- office-lessons.ts
- blocker-followups.ts
- TimeBook.tsx
- run-accounting.ts
- .getEffect
- retrospective-subject.ts
- demand-facts.ts
- easternDay
- coordination-tick.ts
- scene-motion.ts
- DailyCTO.tsx
- report.ts
- Offices
- dependency-bots/adopt.ts
- command-registry.ts
- RoomCamera.tsx
- createConstellation
- merge-scanner-retry.ts
- cli.ts
- node-visuals.ts
- evidence-digest.ts
- .value
- codex-rollout.ts
- extract-worker.mjs
- run-usage.ts
- codex-rollout-file.ts
- helper-evidence.py
- unblock-brief.ts
- owned-artifact.ts
- ITFollowUps.tsx
- highestStableAtLeast

## God Nodes (most connected - your core abstractions)
1. `Store` - 340 edges
2. `TicketJob` - 174 edges
3. `digest()` - 156 edges
4. `artifact()` - 129 edges
5. `GitHubDelivery` - 122 edges
6. `command()` - 109 edges
7. `workKey()` - 99 edges
8. `cx()` - 87 edges
9. `currentAssignment()` - 80 edges
10. `Button` - 77 edges

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

## Communities (100 total, 2 thin omitted)

### Community 0 - "source-amendment.ts"
Cohesion: 0.07
Nodes (68): ref_node_async_hooks, stagePrompt(), StagePromptInput, METADATA_FINDING_GUIDANCE, adoptCandidate(), reported, Scope, advisoryPM() (+60 more)

### Community 1 - "Inspector.tsx"
Cohesion: 0.12
Nodes (60): Outbox(), ServiceHealthPanel(), followUp(), labels, ServiceHealthRow(), BlockerFollowups(), LearningCoverage(), LessonsPanel() (+52 more)

### Community 2 - "GitHubIssuePublisher"
Cohesion: 0.19
Nodes (7): FeaturePublisher, PublicationReceipt, GitHubIssuePublisher, number(), same(), FeatureManifestItem, FeatureOperation

### Community 3 - "harnessEffect"
Cohesion: 0.17
Nodes (29): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), ProjectCard, projectCards(), projectGraphql() (+21 more)

### Community 4 - "post-conflict-preparation.ts"
Cohesion: 0.09
Nodes (49): partialLocalCleanupCandidate(), savedCandidateAdmission, assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), reconcileCompletedConflictDraft() (+41 more)

### Community 5 - "telemetry.ts"
Cohesion: 0.12
Nodes (22): CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL, Rates (+14 more)

### Community 6 - "authorize.ts"
Cohesion: 0.08
Nodes (48): ref_node_url, approveFeature(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), artifactPath(), digest() (+40 more)

### Community 7 - "artifact"
Cohesion: 0.06
Nodes (92): ref_node_os, ref_node_util, closeoutRecoveryCandidate(), CloseoutRecoveryKind, ActivationAuditSchema, applySourceConfiguration(), cancelUnusedSourceReservation(), Hash (+84 more)

### Community 8 - "coordination.ts"
Cohesion: 0.12
Nodes (28): MergeNotifications, deliveryIntakeBlocker(), Admission, admit(), IntakeContext, WAIT_STATUSES, compatible(), dependencyEligibility() (+20 more)

### Community 9 - "shared.ts"
Cohesion: 0.03
Nodes (70): applyGoalReview(), DailyResultSchema, EvidenceRefSchema, FreshDailyResultSchema, GoalEvidenceRequestSchema, statusAllowed(), workEvidence(), GoalInput (+62 more)

### Community 10 - "index.ts"
Cohesion: 0.05
Nodes (66): ref_hono_node_server, ref_node_http, ref_vite, assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput (+58 more)

### Community 11 - "Store"
Cohesion: 0.07
Nodes (29): ROLES, helperTelemetry(), assignmentSubject(), dispatchExposure(), prepareExposure(), officeCapacity, fifo(), ScheduledWork (+21 more)

### Community 12 - "github-delivery.ts"
Cohesion: 0.07
Nodes (61): findingsBlock(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery(), BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE (+53 more)

### Community 13 - "constellation-runtime.ts"
Cohesion: 0.15
Nodes (17): ref_3d_force_graph, ref_three, CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point (+9 more)

### Community 14 - "daily-cto.ts"
Cohesion: 0.13
Nodes (11): DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), queueGoalEvidenceRequest(), Briefing, saveReviewBriefing(), ControlStore (+3 more)

### Community 15 - "session-bridge.ts"
Cohesion: 0.07
Nodes (43): ref_ws, claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexDaemonProcesses(), accountCodexProcesses(), codexProcessInventory (+35 more)

### Community 16 - "store.ts"
Cohesion: 0.08
Nodes (30): ref_node_sqlite, channelNoticeAuthorized(), ChannelSettings, comparableSlackText(), SlackMessages, SlackRequestSchema, goalNoticeAuthorized(), goalNoticeNeverDispatched() (+22 more)

### Community 17 - "requests.ts"
Cohesion: 0.07
Nodes (64): completedPRReviews(), activationAuditResponseSchema(), assertSourceConfiguration(), reconcileActivation(), assertContinuationWorker(), continuationJsonArtifact(), continuationScope(), continuationWorktree() (+56 more)

### Community 18 - "closeout-recovery.ts"
Cohesion: 0.11
Nodes (38): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+30 more)

### Community 19 - "OfficeScene.tsx"
Cohesion: 0.17
Nodes (32): Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk(), ElevatorStage() (+24 more)

### Community 20 - "local-config.ts"
Cohesion: 0.17
Nodes (16): AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), goalEvidencePath(), localBindings, assertModelOverrides(), CODEX_DEFAULT_EFFORT, CODEX_DEFAULT_MODEL, CODEX_EFFORTS (+8 more)

### Community 21 - "scheduled-captures.ts"
Cohesion: 0.16
Nodes (43): createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest, captureRequests() (+35 more)

### Community 22 - "cost-ledger.ts"
Cohesion: 0.12
Nodes (31): captureCost(), server_telemetry_cost_entries_costcoveragesummary, costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress() (+23 more)

### Community 23 - "Button"
Cohesion: 0.16
Nodes (32): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS, PickupForm(), acceptPreferences() (+24 more)

### Community 24 - "assignments.ts"
Cohesion: 0.08
Nodes (35): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, CommittedBrain (+27 more)

### Community 25 - "PeoplePanel.tsx"
Cohesion: 0.10
Nodes (42): label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+34 more)

### Community 26 - "recovery/stopped-base-update.ts"
Cohesion: 0.12
Nodes (28): pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), assertStoppedBaseAudit(), AuditRow, CoverageRow, Hash, Kind, stoppedBaseAuditMarker (+20 more)

### Community 27 - "ticket-evidence.ts"
Cohesion: 0.15
Nodes (21): ref_node_string_decoder, assetDownloader(), attachmentKind(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS, EvidenceAttachment (+13 more)

### Community 28 - "TicketJob"
Cohesion: 0.07
Nodes (66): deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, requireDeliveryAuthority(), gateRegisteredDelivery(), accounting, DeliverySubject (+58 more)

### Community 29 - "run.ts"
Cohesion: 0.10
Nodes (35): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationCandidates(), investigationId(), investigationEvidence(), investigationFollowUps(), INVOCATION_SOURCE_REFS, invocationSource() (+27 more)

### Community 30 - "record-trigger.ts"
Cohesion: 0.11
Nodes (37): LEARNING_BASELINES, maintainLearning(), clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates(), maintenanceCompletedId(), visibleMaintenanceTriggerIds() (+29 more)

### Community 31 - "ref_react"
Cohesion: 0.07
Nodes (62): ref_motion, ref_react, ref_react_markdown, ref_remark_gfm, ref_yaml, guidanceExcerpt(), KnowledgeActivity, KnowledgeActivityPage (+54 more)

### Community 32 - "agents.ts"
Cohesion: 0.05
Nodes (72): cecPrompt(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), resolvedDecisionNote(), stageInstructions, cecChatPrompt() (+64 more)

### Community 33 - "config.ts"
Cohesion: 0.10
Nodes (43): ref_node_crypto, featureItemComplete(), reconcileFeatureCompletion(), discoveryPrompt(), planPrompt(), GitHubFeaturePublisher, evidenceDirectory(), readEvidence() (+35 more)

### Community 34 - "ref_zod"
Cohesion: 0.06
Nodes (43): ref_zod, maintenancePolicies(), Settings, completeNativeCheckpoint(), BRAIN_DEPENDENCY_MERGES, Result, BrainMaintenance, BrainResult (+35 more)

### Community 35 - "process.ts"
Cohesion: 0.08
Nodes (24): ref_node_child_process, file, folder, logs, root, inactivityWatch(), At, errno (+16 more)

### Community 36 - "digest"
Cohesion: 0.12
Nodes (46): retryRead(), admitPRMetadata(), assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema, savedMetadataAssessment(), validateSaved() (+38 more)

### Community 37 - "work-summary.ts"
Cohesion: 0.16
Nodes (21): compactSteps(), deliveryRepairProjection(), card, ACTIVE, maintenanceUpdate(), PMQueueItem, pmQueueItems(), deliveryChanges() (+13 more)

### Community 38 - "TelemetryPanel.tsx"
Cohesion: 0.14
Nodes (25): loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView(), OfficeConfigSummary, BreakdownTable(), CostBar(), coverage() (+17 more)

### Community 39 - "App.tsx"
Cohesion: 0.06
Nodes (46): ref_lucide_react, ref_react_dom, itAgent(), itDiagnostics(), BrainDrawer(), blank(), goalInput, Goals() (+38 more)

### Community 40 - "GitHubDelivery"
Cohesion: 0.10
Nodes (26): GitHubDelivery, checksFailed(), checksPassed(), checksPending(), CurrentChecksWait, currentMergeChecks(), pass(), pending() (+18 more)

### Community 41 - "engine.ts"
Cohesion: 0.09
Nodes (29): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+21 more)

### Community 42 - "enrollment-gate.ts"
Cohesion: 0.23
Nodes (22): dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), resume(), startPilot(), eligibility(), assertFeatureGate() (+14 more)

### Community 43 - "run-retrospective.ts"
Cohesion: 0.09
Nodes (42): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, blockingTrigger, isBlocking(), curateLesson() (+34 more)

### Community 44 - "cec/workflow.ts"
Cohesion: 0.09
Nodes (44): applyIntakeObservation(), checkMail(), drainMail(), requestMail(), parksInJira(), MISSING_INTAKE, reconcileMailbox(), unusedMailbox() (+36 more)

### Community 45 - "scheduled-work.ts"
Cohesion: 0.09
Nodes (34): deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), metadataRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), leadershipContext() (+26 more)

### Community 46 - "index.tsx"
Cohesion: 0.09
Nodes (38): Conversation(), SendMessage, LessonDecisionAction, lessonDecisionState(), readLessonDecision(), OutboxLessonDecision(), act(), readStatus() (+30 more)

### Community 47 - "time-scope.ts"
Cohesion: 0.14
Nodes (29): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), server_telemetry_billable_work_issue_key, isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence() (+21 more)

### Community 48 - ".emit"
Cohesion: 0.13
Nodes (28): configureChannelNotices(), configureNotices(), retryRecipientLookup(), enqueueGreen156(), bindDiscoveryResume(), DiscoveryResumeInput, enqueuePacked165(), enqueueMetadataRecovery() (+20 more)

### Community 49 - "features.ts"
Cohesion: 0.09
Nodes (39): commandFeature(), reviewQuestions(), confirmBrief(), assertQuestionVisibility(), applyHarnessAction(), HarnessActionInput, recoveryPreconditions(), recoveryTarget() (+31 more)

### Community 50 - "knowledge.ts"
Cohesion: 0.09
Nodes (28): SUBJECT, Kind, RetrospectiveResult, RetrospectiveResultSchema, RollupResultSchema, Stage, ImprovementGrant, KnowledgeRetry (+20 more)

### Community 51 - "ref_node_path"
Cohesion: 0.12
Nodes (39): ref_node_fs, ref_node_path, containedFile(), removeAdoptedClone(), namedRepairIds(), stoppedBaseCheckout(), saveStoppedBaseArtifact(), stoppedBaseHandoffResolved() (+31 more)

### Community 52 - "cec/issue-publication.ts"
Cohesion: 0.13
Nodes (15): CommentPage, commentReadback(), Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), Transition (+7 more)

### Community 53 - "assignment-poll.ts"
Cohesion: 0.12
Nodes (21): notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR, plainSlackText(), section(), shippedSummary() (+13 more)

### Community 54 - "StageResult"
Cohesion: 0.12
Nodes (24): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+16 more)

### Community 55 - "tracking-issue.ts"
Cohesion: 0.19
Nodes (17): readBackOrThrow(), ensureTrackingIssue(), findTrackingIssue(), ownTracking(), TrackingIssue, trackingIssueBody(), trackingIssueTitle(), trackingMarker() (+9 more)

### Community 56 - "fact-bounds.ts"
Cohesion: 0.25
Nodes (15): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+7 more)

### Community 58 - "Engine"
Cohesion: 0.09
Nodes (5): correlatedBuild(), Engine, observe(), observeParked(), parkedReadError

### Community 59 - ".transaction"
Cohesion: 0.23
Nodes (7): featureById(), publishFeature(), reconcilePublication(), uncertainPublications(), reserveIdentity(), FeatureWorkflow, EffectUncertainError

### Community 60 - "outbox.ts"
Cohesion: 0.12
Nodes (23): projectOutbox(), syncOutbox(), projectSlackDeliveries(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint(), slackRequestSettled() (+15 more)

### Community 61 - "jira-time.ts"
Cohesion: 0.14
Nodes (20): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+12 more)

### Community 62 - ".save"
Cohesion: 0.19
Nodes (26): BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue(), readIssues(), commentDecision() (+18 more)

### Community 63 - "OfficeSnapshot"
Cohesion: 0.10
Nodes (33): FeatureQuestionProjection, FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), send(), phases, LinkedFeatures() (+25 more)

### Community 64 - "remove-candidate.ts"
Cohesion: 0.18
Nodes (18): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot() (+10 more)

### Community 65 - "pre-push-boundary.ts"
Cohesion: 0.43
Nodes (5): Event, one(), prePushRejection(), PushIdentity, settledPushBoundary()

### Community 66 - "admit-improvement.ts"
Cohesion: 0.25
Nodes (13): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+5 more)

### Community 67 - "lesson-selection.ts"
Cohesion: 0.10
Nodes (27): INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, LessonSelection, MAINTENANCE, MAX_LESSONS, normalPath() (+19 more)

### Community 68 - "source-amendment-scope.ts"
Cohesion: 0.08
Nodes (34): approvedText(), assert(), assert(), normalize(), officialUrls, ReleaseCapture, verifyReleaseCaptures(), capture (+26 more)

### Community 69 - "office-lessons.ts"
Cohesion: 0.27
Nodes (9): normalizeStatement(), decideOfficeProposal(), now(), OfficeKnowledgeStore, proposeOfficeLessons(), retireOfficeLesson(), Input, promoteNoteLesson() (+1 more)

### Community 70 - "blocker-followups.ts"
Cohesion: 0.08
Nodes (35): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), partialLocalCleanupKey(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved() (+27 more)

### Community 71 - "TimeBook.tsx"
Cohesion: 0.12
Nodes (27): displayAgentTask(), githubStageLabels, withoutElapsed(), LiveAgentTask(), Props, RunningTask(), text(), Agent (+19 more)

### Community 72 - "run-accounting.ts"
Cohesion: 0.15
Nodes (22): BoundedRead, backfillClaudeCost(), CompletionReader, codexHome(), readCodexRollout(), HELPER_STDOUT_MAX_BYTES, helperAccounting(), claudeAccounting() (+14 more)

### Community 73 - ".getEffect"
Cohesion: 0.23
Nodes (9): GitHubOperations, fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), lessonText(), Assessment, closeNativeRefresh(), fingerprint() (+1 more)

### Community 74 - "retrospective-subject.ts"
Cohesion: 0.13
Nodes (23): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, maintenanceKey(), azurePrUrl(), findSubject(), jobSubject() (+15 more)

### Community 75 - "demand-facts.ts"
Cohesion: 0.13
Nodes (23): clip(), DEMAND_LIMIT, demandFacts(), DemandSection, key(), LessonKey, notes(), clip() (+15 more)

### Community 76 - "easternDay"
Cohesion: 0.18
Nodes (18): expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), lastFriday(), rollupDue() (+10 more)

### Community 77 - "coordination-tick.ts"
Cohesion: 0.15
Nodes (14): reconcileNoticeConfirmations(), dependencyCompletionKey(), PrerequisitesSchema, BrainFollowup, reconcileCompletedCheckpoints(), reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS (+6 more)

### Community 78 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 79 - "DailyCTO.tsx"
Cohesion: 0.26
Nodes (10): CTOReview(), goalState, DailyCTO(), GoalHistory(), load(), reportDate(), reviewStatus, InlineText() (+2 more)

### Community 80 - "report.ts"
Cohesion: 0.22
Nodes (15): TelemetryReport, TelemetryRow, TelemetrySync, Acc, bump(), EASTERN, easternDay(), modelShares() (+7 more)

### Community 81 - "Offices"
Cohesion: 0.14
Nodes (9): ref_smol_toml, seedOfficeLessons(), file, project, root, projectById(), projectData(), Offices (+1 more)

### Community 82 - "dependency-bots/adopt.ts"
Cohesion: 0.14
Nodes (25): Execute, adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR, openDependabotPulls() (+17 more)

### Community 83 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 84 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (10): ref_react_three_drei, ref_react_three_fiber, ref_three_stdlib, CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility (+2 more)

### Community 85 - "createConstellation"
Cohesion: 0.19
Nodes (5): ConstellationRuntime, createConstellation(), enter(), finishTap(), move()

### Community 86 - "merge-scanner-retry.ts"
Cohesion: 0.38
Nodes (10): activeEffectId(), officeMergeProvenance(), reconcileMergeScannerRetry(), Retry, retryMergeScanner(), retryReadBack(), runIdentity(), savedRetry() (+2 more)

### Community 87 - "cli.ts"
Cohesion: 0.20
Nodes (8): ref_node_stream, ref_node_timers, args, [cmd,...rawArgs], commands, key, projectIndex, PORT

### Community 88 - "node-visuals.ts"
Cohesion: 0.29
Nodes (7): LabelRectangle, visibleLabels(), stableHash(), stablePosition(), nodeVisuals(), SCENE_COLOR_TOKENS, TOKENS

### Community 89 - "evidence-digest.ts"
Cohesion: 0.44
Nodes (7): canonical(), evidenceDigest(), evidenceHash(), semantic(), stableUrl(), requirementDrift(), RequirementPostimage

### Community 91 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 92 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (6): ref_mammoth, ref_pdfjs_dist, bounded(), extract(), fail(), [path,kind]

### Community 93 - "run-usage.ts"
Cohesion: 0.38
Nodes (5): CodexRollout, claudeCrashZero(), claudeUsage(), count(), RunUsage

### Community 94 - "codex-rollout-file.ts"
Cohesion: 0.43
Nodes (6): createdAt(), dayDirs(), header(), ROLLOUT_MAX_BYTES, RolloutScan, scanCodexRollouts()

### Community 95 - "helper-evidence.py"
Cohesion: 0.33
Nodes (5): importlib_util, json, pathlib, Read-only protocol adapter for the installed review helper. No model dispatch., sys

### Community 96 - "unblock-brief.ts"
Cohesion: 0.53
Nodes (5): clearUnblockBrief(), key(), saveUnblockBrief(), unblockBrief, src_shared_learningsubject

### Community 97 - "owned-artifact.ts"
Cohesion: 0.73
Nodes (5): done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf()

### Community 98 - "ITFollowUps.tsx"
Cohesion: 0.67
Nodes (4): itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps()

### Community 99 - "highestStableAtLeast"
Cohesion: 0.83
Nodes (3): compare(), highestStableAtLeast(), parts()

## Knowledge Gaps
- **475 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+470 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 604 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `source-amendment.ts`, `harnessEffect`, `post-conflict-preparation.ts`, `authorize.ts`, `artifact`, `coordination.ts`, `shared.ts`, `index.ts`, `github-delivery.ts`, `session-bridge.ts`, `store.ts`, `requests.ts`, `closeout-recovery.ts`, `scheduled-captures.ts`, `cost-ledger.ts`, `assignments.ts`, `recovery/stopped-base-update.ts`, `ticket-evidence.ts`, `TicketJob`, `run.ts`, `record-trigger.ts`, `agents.ts`, `config.ts`, `ref_zod`, `process.ts`, `digest`, `GitHubDelivery`, `engine.ts`, `enrollment-gate.ts`, `run-retrospective.ts`, `cec/workflow.ts`, `scheduled-work.ts`, `time-scope.ts`, `.emit`, `features.ts`, `ref_node_path`, `cec/issue-publication.ts`, `assignment-poll.ts`, `StageResult`, `tracking-issue.ts`, `Coordinator`, `Engine`, `.transaction`, `outbox.ts`, `jira-time.ts`, `.save`, `OfficeSnapshot`, `remove-candidate.ts`, `admit-improvement.ts`, `lesson-selection.ts`, `office-lessons.ts`, `blocker-followups.ts`, `run-accounting.ts`, `.getEffect`, `retrospective-subject.ts`, `demand-facts.ts`, `easternDay`, `coordination-tick.ts`, `Offices`, `dependency-bots/adopt.ts`, `.value`?**
  _High betweenness centrality (0.119) - this node is a cross-community bridge._
- **Why does `TicketJob` connect `TicketJob` to `source-amendment.ts`, `harnessEffect`, `post-conflict-preparation.ts`, `artifact`, `coordination.ts`, `shared.ts`, `Store`, `github-delivery.ts`, `requests.ts`, `closeout-recovery.ts`, `recovery/stopped-base-update.ts`, `record-trigger.ts`, `digest`, `work-summary.ts`, `TelemetryPanel.tsx`, `GitHubDelivery`, `cec/workflow.ts`, `ref_node_path`, `assignment-poll.ts`, `StageResult`, `tracking-issue.ts`, `fact-bounds.ts`, `remove-candidate.ts`, `blocker-followups.ts`, `retrospective-subject.ts`, `dependency-bots/adopt.ts`, `merge-scanner-retry.ts`, `.value`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `OfficeSnapshot` connect `OfficeSnapshot` to `Inspector.tsx`, `shared.ts`, `Store`, `store.ts`, `OfficeScene.tsx`, `Button`, `PeoplePanel.tsx`, `run.ts`, `record-trigger.ts`, `ref_react`, `agents.ts`, `ref_zod`, `work-summary.ts`, `TelemetryPanel.tsx`, `App.tsx`, `engine.ts`, `cec/workflow.ts`, `scheduled-work.ts`, `index.tsx`, `outbox.ts`, `blocker-followups.ts`, `TimeBook.tsx`, `scene-motion.ts`, `DailyCTO.tsx`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _475 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `source-amendment.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._
- **Should `Inspector.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12009087958455048 - nodes in this community are weakly interconnected._
- **Should `post-conflict-preparation.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0853302162478083 - nodes in this community are weakly interconnected._