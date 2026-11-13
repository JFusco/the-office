# Graph Report - the-office  (2026-11-13)

## Corpus Check
- 748 files · ~309,651 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3847 nodes · 17998 edges · 104 communities (101 shown, 3 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 583 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5e635150`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- GitHubDelivery
- closeout-recovery.ts
- Inspector.tsx
- ref_react
- coordination.ts
- implementation-recovery.ts
- agents.ts
- workKey
- readback-evidence.ts
- features.ts
- OfficeScene.tsx
- source-amendment.ts
- ControlStore
- digest
- session-bridge.ts
- work.ts
- maintenance/maintenance.ts
- process.ts
- reader.ts
- record-trigger.ts
- worker-runtime.ts
- scheduled-captures.ts
- Engine
- index.tsx
- App.tsx
- ref_zod
- config.ts
- OrgChart.tsx
- constellation-runtime.ts
- model-routes.ts
- work-summary.ts
- TelemetryPanel.tsx
- knowledge.ts
- cec/workflow.ts
- run-retrospective.ts
- engine.ts
- retrospective-subject.ts
- github-delivery.ts
- harnessDelivers
- .emit
- azure.ts
- dependency-bots/adopt.ts
- scheduler.ts
- assignments.ts
- control-store.ts
- weekly-rollup.ts
- Goals.tsx
- telemetry.ts
- contract.ts
- ticket-evidence.ts
- run.ts
- cost-ledger.ts
- artifact
- index.ts
- recovery-ledger.ts
- .save
- github/issue-publication.ts
- features/commands.ts
- lesson-selection.ts
- run-accounting.ts
- blocker-followups.ts
- remove-candidate.ts
- time-scope.ts
- OfficeSnapshot
- http/commands.ts
- fact-bounds.ts
- harnessEffect
- scheduled-work.ts
- office-lessons.ts
- GitHubIssuePublisher
- JiraIssuePublisher
- tracking-issue.ts
- admit-improvement.ts
- Effects
- cec/issue-publication.ts
- shared.ts
- Offices
- Store
- accept-stage-result.ts
- scope-repair-resume.ts
- Conversation.tsx
- preferences-store.ts
- jira-time.ts
- knowledge-views.ts
- report.ts
- scene-motion.ts
- RoomCamera.tsx
- cli.ts
- easternDay
- command-registry.ts
- task-briefing.ts
- codex-rollout.ts
- daily-cto.ts
- normalize-question.ts
- extract-worker.mjs
- atmosphere.ts
- useOfficePreferences.ts
- helper-evidence.py
- merge-scanner-retry.ts
- leadership.ts
- unblock-brief.ts
- highestStableAtLeast
- ProjectProgress
- QuestionNotifications

## God Nodes (most connected - your core abstractions)
1. `Store` - 341 edges
2. `TicketJob` - 174 edges
3. `digest()` - 156 edges
4. `artifact()` - 129 edges
5. `GitHubDelivery` - 122 edges
6. `command()` - 108 edges
7. `workKey()` - 99 edges
8. `cx()` - 87 edges
9. `currentAssignment()` - 82 edges
10. `Button` - 77 edges

## Surprising Connections (you probably didn't know these)
- `DeliveryAuthorityInput` --references--> `HarnessRequest`  [EXTRACTED]
  server/delivery/harness/delivery-authority.ts → src/contracts/work.ts
- `projectOutbox()` --calls--> `deferredPickup()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/pickup-state.ts
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

## Communities (104 total, 3 thin omitted)

### Community 0 - "GitHubDelivery"
Cohesion: 0.11
Nodes (23): StageContext, GitHubDelivery, checksFailed(), checksPassed(), checksPending(), CurrentChecksWait, currentMergeChecks(), pass() (+15 more)

### Community 1 - "closeout-recovery.ts"
Cohesion: 0.12
Nodes (40): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+32 more)

### Community 2 - "Inspector.tsx"
Cohesion: 0.12
Nodes (60): ServiceHealthPanel(), labels, ServiceHealthRow(), BlockerFollowups(), LearningCoverage(), Evidence(), LessonCard(), LessonShape() (+52 more)

### Community 3 - "ref_react"
Cohesion: 0.09
Nodes (44): ref_react, ref_react_markdown, ref_remark_gfm, ref_yaml, Activity(), ActivityTimeline(), AssignmentKnowledge(), Lookup() (+36 more)

### Community 4 - "coordination.ts"
Cohesion: 0.05
Nodes (46): retryCandidateCleanup(), admit(), admitReadyCards(), resumeParked(), compatible(), dependencyCompletionKey(), dependencyEligibility(), issueKey() (+38 more)

### Community 5 - "implementation-recovery.ts"
Cohesion: 0.08
Nodes (48): pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), recordJobApproach(), advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat() (+40 more)

### Community 6 - "agents.ts"
Cohesion: 0.06
Nodes (50): IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), intakeMembership(), projectListScope(), cecPrompt(), cecIntakePrompt() (+42 more)

### Community 7 - "workKey"
Cohesion: 0.07
Nodes (53): boardPreflightCandidate(), Ownership, reconcileBoardPreflight(), partialLocalCleanupCandidate(), completedPRReviews(), Assessment, diagnosticProof(), discoveryRecoveryCandidate() (+45 more)

### Community 8 - "readback-evidence.ts"
Cohesion: 0.10
Nodes (49): ref_node_util, activeEffectId(), retryRead(), admitPRMetadata(), assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema (+41 more)

### Community 9 - "features.ts"
Cohesion: 0.07
Nodes (59): approveFeature(), discoveryPrompt(), planPrompt(), artifactPath(), digest(), document(), featureRoot(), DiscoverySchema (+51 more)

### Community 10 - "OfficeScene.tsx"
Cohesion: 0.16
Nodes (34): withoutElapsed(), Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk() (+26 more)

### Community 11 - "source-amendment.ts"
Cohesion: 0.06
Nodes (67): ref_node_async_hooks, adoptCandidate(), reported, Scope, approvedText(), assert(), amendmentInstruction(), amendmentIssueSha256() (+59 more)

### Community 12 - "ControlStore"
Cohesion: 0.20
Nodes (5): DailyCTO, Briefing, saveReviewBriefing(), ControlStore, DailyCTOReport

### Community 13 - "digest"
Cohesion: 0.07
Nodes (70): HarnessControl, withHarnessWork(), assertAutomationEffects(), automationMergePolicy(), observeAutomationMerge(), routeAutomationMerge(), admitGreen156(), enqueueGreen156() (+62 more)

### Community 14 - "session-bridge.ts"
Cohesion: 0.07
Nodes (44): ref_ws, claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexDaemonProcesses(), accountCodexProcesses(), codexProcessInventory (+36 more)

### Community 15 - "work.ts"
Cohesion: 0.10
Nodes (19): ProjectReadiness, HistoryRetirement, HistoryRetirementIntent, AssignmentResult, CompletionCondition, DeliveryAdmission, DependencyObservation, EligibilityState (+11 more)

### Community 16 - "maintenance/maintenance.ts"
Cohesion: 0.07
Nodes (37): ApproachSchema, maintenancePolicies(), completeNativeCheckpoint(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice() (+29 more)

### Community 17 - "process.ts"
Cohesion: 0.10
Nodes (18): GitHubFeaturePublisher, helperTelemetry(), JiraFeaturePublisher, EvidenceSchema, helperInstallation(), ReviewEvidence, observeHelperGroups(), stopHelperGroups() (+10 more)

### Community 18 - "reader.ts"
Cohesion: 0.09
Nodes (25): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, CommittedBrain (+17 more)

### Community 19 - "record-trigger.ts"
Cohesion: 0.11
Nodes (37): baselineLearning(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences(), clip(), maintenanceBlockedId(), MaintenanceCandidate (+29 more)

### Community 20 - "worker-runtime.ts"
Cohesion: 0.11
Nodes (24): candidateWorkspaceEnvironment(), assignmentSubject(), dispatchExposure(), prepareExposure(), LOCAL_BINDINGS, contextPacket(), labels, toolActivity() (+16 more)

### Community 21 - "scheduled-captures.ts"
Cohesion: 0.16
Nodes (39): createFeature(), assertEnrollable(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest, captureRequests(), failCapture() (+31 more)

### Community 23 - "index.tsx"
Cohesion: 0.10
Nodes (46): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView() (+38 more)

### Community 24 - "App.tsx"
Cohesion: 0.06
Nodes (48): ref_lucide_react, ref_motion, ref_react_dom, itAgent(), itDiagnostics(), BrainDrawer(), themeColor, App() (+40 more)

### Community 25 - "ref_zod"
Cohesion: 0.07
Nodes (37): ref_zod, assertConversationReadback(), Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+29 more)

### Community 26 - "config.ts"
Cohesion: 0.13
Nodes (30): ref_node_crypto, ref_node_url, featureItemComplete(), reconcileFeatureCompletion(), reserveReplacement(), stageBudget(), confirmBrief(), classifyFeatureFailure() (+22 more)

### Community 27 - "OrgChart.tsx"
Cohesion: 0.10
Nodes (37): label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+29 more)

### Community 28 - "constellation-runtime.ts"
Cohesion: 0.10
Nodes (22): ref_3d_force_graph, ref_three, CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point (+14 more)

### Community 29 - "model-routes.ts"
Cohesion: 0.24
Nodes (9): CODEX_DEFAULT_EFFORT, CODEX_DEFAULT_MODEL, CODEX_EFFORTS, CODEX_ROLES, ModelRoute, qaPolicyRoute(), resolveModelRoute(), validModelSetting() (+1 more)

### Community 30 - "work-summary.ts"
Cohesion: 0.12
Nodes (28): itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps(), followUp(), BARE_UUID, COMPOSITE, strip() (+20 more)

### Community 31 - "TelemetryPanel.tsx"
Cohesion: 0.22
Nodes (18): TelemetryReport, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens(), usd(), KpiTiles() (+10 more)

### Community 32 - "knowledge.ts"
Cohesion: 0.10
Nodes (27): curateLesson(), Curation, CurationAction, mergeEvidence(), officeKnowledgeSnapshot(), LessonBrainOverlap, lessonForProject(), BlockerFollowup (+19 more)

### Community 33 - "cec/workflow.ts"
Cohesion: 0.10
Nodes (40): correlatedBuild(), applyIntakeObservation(), checkMail(), drainMail(), requestMail(), parksInJira(), MISSING_INTAKE, reconcileMailbox() (+32 more)

### Community 34 - "run-retrospective.ts"
Cohesion: 0.09
Nodes (43): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, blockingTrigger, isBlocking(), brainOverlap (+35 more)

### Community 35 - "engine.ts"
Cohesion: 0.14
Nodes (34): dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), resume(), startPilot(), eligibility(), Admission (+26 more)

### Community 36 - "retrospective-subject.ts"
Cohesion: 0.17
Nodes (16): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+8 more)

### Community 37 - "github-delivery.ts"
Cohesion: 0.05
Nodes (98): ref_node_fs, ref_node_path, containedFile(), removeAdoptedClone(), findingsBlock(), namedRepairIds(), BOARD_RULE, conflictRefreshInstruction() (+90 more)

### Community 38 - "harnessDelivers"
Cohesion: 0.17
Nodes (20): deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, requireDeliveryAuthority(), deliveryIntakeBlocker(), gateRegisteredDelivery(), resolveDeliveryWork() (+12 more)

### Community 39 - ".emit"
Cohesion: 0.12
Nodes (26): reconcileNoticeConfirmations(), projectOutbox(), syncOutbox(), projectSlackDeliveries(), settleRequestedSlackReplacement(), Input, supersedeSlackDelivery(), replacementContext() (+18 more)

### Community 40 - "azure.ts"
Cohesion: 0.07
Nodes (40): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+32 more)

### Community 41 - "dependency-bots/adopt.ts"
Cohesion: 0.15
Nodes (28): Execute, readBackOrThrow(), adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR (+20 more)

### Community 42 - "scheduler.ts"
Cohesion: 0.13
Nodes (16): ROLES, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch(), deliveryOccupied() (+8 more)

### Community 43 - "assignments.ts"
Cohesion: 0.09
Nodes (27): clip(), DEMAND_LIMIT, demandFacts(), DemandSection, key(), LessonKey, notes(), assignmentLookups (+19 more)

### Community 44 - "control-store.ts"
Cohesion: 0.16
Nodes (11): ref_node_sqlite, Clock, applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, statementCache(), initialSnapshot() (+3 more)

### Community 45 - "weekly-rollup.ts"
Cohesion: 0.12
Nodes (25): learningMetrics(), BRAIN_SCOPE, SUBJECT, Kind, RetrospectiveResult, RetrospectiveResultSchema, RollupResult, RollupResultSchema (+17 more)

### Community 46 - "Goals.tsx"
Cohesion: 0.07
Nodes (45): FeatureQuestionProjection, SendMessage, FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), send(), phases (+37 more)

### Community 47 - "telemetry.ts"
Cohesion: 0.10
Nodes (26): CodexRollout, CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL (+18 more)

### Community 48 - "contract.ts"
Cohesion: 0.09
Nodes (24): ref_node_child_process, file, folder, logs, root, Event, one(), prePushRejection() (+16 more)

### Community 49 - "ticket-evidence.ts"
Cohesion: 0.08
Nodes (44): ref_node_string_decoder, candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute (+36 more)

### Community 50 - "run.ts"
Cohesion: 0.10
Nodes (33): Candidate, INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationCandidates(), investigationId(), investigationEvidence(), investigationFollowUps(), invocationSource() (+25 more)

### Community 51 - "cost-ledger.ts"
Cohesion: 0.16
Nodes (26): captureCost(), server_telemetry_cost_entries_costcoveragesummary, costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId() (+18 more)

### Community 52 - "artifact"
Cohesion: 0.07
Nodes (95): ref_node_os, activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal (+87 more)

### Community 53 - "index.ts"
Cohesion: 0.08
Nodes (38): ref_hono_node_server, ref_node_http, ref_vite, close(), config, itSpecialist, loadedRevision, offices (+30 more)

### Community 54 - "recovery-ledger.ts"
Cohesion: 0.35
Nodes (9): savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), stoppedBaseReassessmentReady(), stoppedBaseUpdateCandidate(), repeatConflictRepairUnresolved(), reconcileRecoveryLedger(), recoverStoppedBaseUpdates() (+1 more)

### Community 55 - ".save"
Cohesion: 0.19
Nodes (26): BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue(), readIssues(), commentDecision() (+18 more)

### Community 56 - "github/issue-publication.ts"
Cohesion: 0.18
Nodes (27): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), ProjectCard, projectCards(), projectGraphql() (+19 more)

### Community 57 - "features/commands.ts"
Cohesion: 0.11
Nodes (25): commandFeature(), featureById(), mutation(), reviewQuestions(), FeatureCommandSchema, Link, linkFeature(), FeaturePublisher (+17 more)

### Community 58 - "lesson-selection.ts"
Cohesion: 0.14
Nodes (17): INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), LessonSelection, MAINTENANCE, MAX_LESSONS (+9 more)

### Community 59 - "run-accounting.ts"
Cohesion: 0.12
Nodes (29): BoundedRead, readBoundedNoFollow(), backfillClaudeCost(), CompletionReader, codexHome(), createdAt(), dayDirs(), header() (+21 more)

### Community 60 - "blocker-followups.ts"
Cohesion: 0.25
Nodes (14): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), canFileGithubIssue(), readBackConversations(), handoff(), reconcileBlockerFollowups() (+6 more)

### Community 61 - "remove-candidate.ts"
Cohesion: 0.19
Nodes (15): initialManualStart(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+7 more)

### Community 62 - "time-scope.ts"
Cohesion: 0.12
Nodes (32): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), server_telemetry_billable_work_issue_key, isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence() (+24 more)

### Community 63 - "OfficeSnapshot"
Cohesion: 0.11
Nodes (27): SnapshotAcceptance, tourStages, useOffice(), displayAgentTask(), LiveAgentTask(), Props, RunningTask(), text() (+19 more)

### Community 64 - "http/commands.ts"
Cohesion: 0.07
Nodes (48): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR (+40 more)

### Community 65 - "fact-bounds.ts"
Cohesion: 0.18
Nodes (19): leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance() (+11 more)

### Community 66 - "harnessEffect"
Cohesion: 0.17
Nodes (21): harnessCloseout(), PASSING, verifyMergeActions(), harnessEffect, assertDeliveryMayMutate(), assertMayMutate(), runHarnessStage(), harnessStageResult() (+13 more)

### Community 67 - "scheduled-work.ts"
Cohesion: 0.14
Nodes (21): deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), metadataRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), requestPriority() (+13 more)

### Community 68 - "office-lessons.ts"
Cohesion: 0.15
Nodes (15): normalizeStatement(), decideOfficeProposal(), now(), OfficeKnowledgeStore, proposeOfficeLessons(), retireOfficeLesson(), Input, promoteNoteLesson() (+7 more)

### Community 69 - "GitHubIssuePublisher"
Cohesion: 0.23
Nodes (6): PublicationReceipt, GitHubIssuePublisher, number(), same(), FeatureManifestItem, FeatureOperation

### Community 70 - "JiraIssuePublisher"
Cohesion: 0.26
Nodes (3): JiraIssuePublisher, keyOf(), publicationDescription()

### Community 71 - "tracking-issue.ts"
Cohesion: 0.19
Nodes (13): ensureTrackingIssue(), findTrackingIssue(), ownTracking(), TrackingIssue, trackingIssueBody(), trackingIssueTitle(), trackingMarker(), centralCompanionHandoff() (+5 more)

### Community 72 - "admit-improvement.ts"
Cohesion: 0.21
Nodes (17): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+9 more)

### Community 73 - "Effects"
Cohesion: 0.20
Nodes (10): GitHubOperations, fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), lessonText(), Assessment, closeNativeRefresh(), fingerprint() (+2 more)

### Community 74 - "cec/issue-publication.ts"
Cohesion: 0.17
Nodes (12): CommentPage, commentReadback(), Assignment, Content, jiraText(), Transition, JiraOperations, plain() (+4 more)

### Community 75 - "shared.ts"
Cohesion: 0.07
Nodes (36): partialLocalCleanupKey(), ITContext, diagnosticContext(), diagnosticSnapshot(), publishITReport(), nativeDeliveryResolved(), delays, recoverAttempt() (+28 more)

### Community 76 - "Offices"
Cohesion: 0.14
Nodes (10): ref_smol_toml, mirrorOfficeKnowledge(), seedOfficeLessons(), file, project, root, projectById(), projectData() (+2 more)

### Community 77 - "Store"
Cohesion: 0.07
Nodes (31): recordCandidateCleanup(), accounting, DeliverySubject, nonDelivery, originalReads, BrainStatusSchema, brainCheckpointCompletion(), coverageSchema (+23 more)

### Community 78 - "accept-stage-result.ts"
Cohesion: 0.11
Nodes (36): acceptStageResult(), draftReadHeadMatches(), assertDraftClaimHistory(), linkDraftIssue(), protectedOriginalClaim(), METADATA_FINDING, publicationReadArgs(), Read (+28 more)

### Community 79 - "scope-repair-resume.ts"
Cohesion: 0.15
Nodes (26): Assessment, outsideScanSources(), Ownership, requireThat(), scopeRepairRequestResolved(), sha, assertScopeRepairResumeFindings(), certain() (+18 more)

### Community 80 - "Conversation.tsx"
Cohesion: 0.21
Nodes (17): Conversation(), Outbox(), LessonDecisionAction, lessonDecisionState(), readLessonDecision(), OutboxLessonDecision(), act(), readStatus() (+9 more)

### Community 81 - "preferences-store.ts"
Cohesion: 0.21
Nodes (8): fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS, OfficePreferences, OfficePreferencesPatch

### Community 82 - "jira-time.ts"
Cohesion: 0.14
Nodes (20): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+12 more)

### Community 83 - "knowledge-views.ts"
Cohesion: 0.15
Nodes (22): KnowledgeActivity, KnowledgeEdge, KnowledgeMap, KnowledgeNode, connectionSummary(), ConstellationView, DisplayNode, displayScene() (+14 more)

### Community 84 - "report.ts"
Cohesion: 0.24
Nodes (14): TelemetryRow, TelemetrySync, Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount() (+6 more)

### Community 85 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 86 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (10): ref_react_three_drei, ref_react_three_fiber, ref_three_stdlib, CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility (+2 more)

### Community 87 - "cli.ts"
Cohesion: 0.18
Nodes (9): ref_node_stream, ref_node_timers, args, [cmd,...rawArgs], commands, key, projectIndex, lessonBrainAudit (+1 more)

### Community 88 - "easternDay"
Cohesion: 0.26
Nodes (11): expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), EASTERN, easternDay() (+3 more)

### Community 89 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 90 - "task-briefing.ts"
Cohesion: 0.29
Nodes (10): citations(), recordAcceptedKnowledge(), stageName(), knowledgeCitation(), lessonCitation(), assertBriefingScope(), boundEvidence(), EvidenceSelection (+2 more)

### Community 91 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 92 - "daily-cto.ts"
Cohesion: 0.22
Nodes (10): EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), dailyReviewDate(), reviewWeekday(), DailyResultSchema, FreshDailyResultSchema, GoalEvidenceRequestSchema (+2 more)

### Community 93 - "normalize-question.ts"
Cohesion: 0.27
Nodes (10): normalizeRound(), FeatureHarnessOption, FeatureOption, FeatureQuestion, FeatureRoundAuthor, folded(), normalizeQuestion(), optionId() (+2 more)

### Community 94 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (6): ref_mammoth, ref_pdfjs_dist, bounded(), extract(), fail(), [path,kind]

### Community 95 - "atmosphere.ts"
Cohesion: 0.28
Nodes (7): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), SCENE_COLOR_TOKENS, TOKENS

### Community 96 - "useOfficePreferences.ts"
Cohesion: 0.26
Nodes (10): acceptPreferences(), PreferenceCandidate, strip(), UNKNOWN_PREFERENCES, OfficePreferencesController, PreferenceFeedback, PreferenceField, requestPreferences() (+2 more)

### Community 97 - "helper-evidence.py"
Cohesion: 0.33
Nodes (5): importlib_util, json, pathlib, Read-only protocol adapter for the installed review helper. No model dispatch., sys

### Community 98 - "merge-scanner-retry.ts"
Cohesion: 0.40
Nodes (9): officeMergeProvenance(), reconcileMergeScannerRetry(), Retry, retryMergeScanner(), retryReadBack(), runIdentity(), savedRetry(), transientScannerJobs() (+1 more)

### Community 99 - "leadership.ts"
Cohesion: 0.20
Nodes (8): DailyCTOBriefing, DailyCTOResult, DailyCTOSummary, DailyGoalUpdate, GoalEvidenceRef, GoalEvidenceRequest, GoalProgress, GoalStatus

### Community 100 - "unblock-brief.ts"
Cohesion: 0.43
Nodes (6): clearUnblockBrief(), key(), saveUnblockBrief(), unblockBrief, src_shared_knowledgestate, src_shared_learningsubject

### Community 101 - "highestStableAtLeast"
Cohesion: 0.83
Nodes (3): compare(), highestStableAtLeast(), parts()

## Knowledge Gaps
- **477 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+472 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 606 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `GitHubDelivery`, `closeout-recovery.ts`, `coordination.ts`, `implementation-recovery.ts`, `agents.ts`, `workKey`, `readback-evidence.ts`, `features.ts`, `source-amendment.ts`, `digest`, `session-bridge.ts`, `maintenance/maintenance.ts`, `process.ts`, `reader.ts`, `record-trigger.ts`, `worker-runtime.ts`, `scheduled-captures.ts`, `ref_zod`, `config.ts`, `cec/workflow.ts`, `run-retrospective.ts`, `engine.ts`, `retrospective-subject.ts`, `github-delivery.ts`, `harnessDelivers`, `.emit`, `azure.ts`, `dependency-bots/adopt.ts`, `scheduler.ts`, `assignments.ts`, `control-store.ts`, `weekly-rollup.ts`, `ticket-evidence.ts`, `run.ts`, `cost-ledger.ts`, `artifact`, `index.ts`, `.save`, `github/issue-publication.ts`, `features/commands.ts`, `lesson-selection.ts`, `run-accounting.ts`, `blocker-followups.ts`, `remove-candidate.ts`, `time-scope.ts`, `OfficeSnapshot`, `http/commands.ts`, `fact-bounds.ts`, `harnessEffect`, `scheduled-work.ts`, `office-lessons.ts`, `GitHubIssuePublisher`, `JiraIssuePublisher`, `tracking-issue.ts`, `admit-improvement.ts`, `Effects`, `cec/issue-publication.ts`, `shared.ts`, `Offices`, `accept-stage-result.ts`, `scope-repair-resume.ts`, `jira-time.ts`, `easternDay`, `task-briefing.ts`, `ProjectProgress`, `QuestionNotifications`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **Why does `TicketJob` connect `github-delivery.ts` to `GitHubDelivery`, `closeout-recovery.ts`, `Inspector.tsx`, `coordination.ts`, `implementation-recovery.ts`, `workKey`, `readback-evidence.ts`, `source-amendment.ts`, `digest`, `record-trigger.ts`, `worker-runtime.ts`, `work-summary.ts`, `cec/workflow.ts`, `engine.ts`, `retrospective-subject.ts`, `harnessDelivers`, `dependency-bots/adopt.ts`, `scheduler.ts`, `ticket-evidence.ts`, `run.ts`, `artifact`, `github/issue-publication.ts`, `remove-candidate.ts`, `fact-bounds.ts`, `harnessEffect`, `shared.ts`, `Store`, `accept-stage-result.ts`, `scope-repair-resume.ts`, `merge-scanner-retry.ts`, `ProjectProgress`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `Role` connect `agents.ts` to `GitHubDelivery`, `Inspector.tsx`, `OfficeScene.tsx`, `digest`, `work.ts`, `maintenance/maintenance.ts`, `worker-runtime.ts`, `App.tsx`, `ref_zod`, `OrgChart.tsx`, `model-routes.ts`, `cec/workflow.ts`, `retrospective-subject.ts`, `github-delivery.ts`, `.emit`, `scheduler.ts`, `run-accounting.ts`, `OfficeSnapshot`, `http/commands.ts`, `shared.ts`, `Store`, `accept-stage-result.ts`, `Conversation.tsx`, `scene-motion.ts`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _477 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `GitHubDelivery` be split into smaller, more focused modules?**
  _Cohesion score 0.11033681765389082 - nodes in this community are weakly interconnected._
- **Should `closeout-recovery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11515151515151516 - nodes in this community are weakly interconnected._
- **Should `Inspector.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11604938271604938 - nodes in this community are weakly interconnected._