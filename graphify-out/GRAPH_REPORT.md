# Graph Report - office-session-visibility-nov13  (2026-11-13)

## Corpus Check
- 749 files · ~310,033 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3849 nodes · 18004 edges · 104 communities (98 shown, 6 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 583 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a5735aec`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- artifact
- workKey
- accept-stage-result.ts
- offices.ts
- Inspector.tsx
- digest
- .transaction
- ref_react
- features.ts
- delivery-recoveries.ts
- github-delivery.ts
- App.tsx
- Store
- session-bridge.ts
- currentAssignment
- Button
- config.ts
- cec/workflow.ts
- Goals.tsx
- publish-pr.ts
- knowledge.ts
- ticket-evidence.ts
- scheduled-captures.ts
- run-retrospective.ts
- assignments.ts
- github-readiness.ts
- coordination.ts
- agents.ts
- worker-runtime.ts
- shared.ts
- store.ts
- run.ts
- PeoplePanel.tsx
- TimeBook.tsx
- maintenance/maintenance.ts
- record-trigger.ts
- cost-ledger.ts
- OfficeSnapshot
- record-push.ts
- SlackMessages
- local-config.ts
- source-amendment.ts
- conversations/conversations.ts
- lesson-selection.ts
- time-scope.ts
- outbox.ts
- resume-provider-review.ts
- OfficeScene.tsx
- demand-facts.ts
- engine.ts
- weekly-rollup.ts
- azure.ts
- GitHubDelivery
- jira-time.ts
- retrospective-subject.ts
- .save
- Coordinator
- .emit
- remove-candidate.ts
- index.tsx
- dependency-bots/adopt.ts
- ControlStore
- constellation-runtime.ts
- daily-cto.ts
- Effects
- JiraIssuePublisher
- knowledge-views.ts
- WorkTime
- it-specialist.ts
- validate-stage.ts
- work.ts
- blocker-followups.ts
- run-accounting.ts
- scheduled-work.ts
- telemetry.ts
- QuestionStepper.tsx
- node-visuals.ts
- evidence-artifacts.ts
- service-health.ts
- fact-bounds.ts
- assignment-poll.ts
- scene-motion.ts
- evidence.ts
- preferences-store.ts
- easternDay
- features/routes.ts
- tracking-issue.ts
- Offices
- CommittedBrain
- cost-totals.ts
- QuestionNotifications
- office-state-view.ts
- OfficeKnowledge
- run-evidence.ts
- codex-rollout.ts
- CommandRegistry
- ledger.ts
- OutboxLessonDecision.tsx
- slack-supersession.ts
- extract-worker.mjs
- create-candidate.ts
- helper-evidence.py
- Engine
- ProjectProgress

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

## Communities (104 total, 6 thin omitted)

### Community 0 - "artifact"
Cohesion: 0.05
Nodes (122): ref_node_os, closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2 (+114 more)

### Community 1 - "workKey"
Cohesion: 0.07
Nodes (54): completedPRReviews(), continuationScope(), continuationGuard(), Assessment, diagnosticProof(), discoveryRecoveryCandidate(), ownedArtifact(), Ownership (+46 more)

### Community 2 - "accept-stage-result.ts"
Cohesion: 0.11
Nodes (37): containedFile(), acceptStageResult(), acceptConflictRepair(), nextJobStage(), recordJobApproach(), deliveryNextStage(), pendingPreparationCheck(), METADATA_FINDING (+29 more)

### Community 3 - "offices.ts"
Cohesion: 0.08
Nodes (53): ref_node_crypto, commandFeature(), reviewQuestions(), featureItemComplete(), reconcileFeatureCompletion(), FeatureCommandSchema, helperTelemetry(), DELAYS (+45 more)

### Community 4 - "Inspector.tsx"
Cohesion: 0.13
Nodes (60): Conversation(), Outbox(), slackMessageStatus(), SlackDeliveryCard(), currentServices(), ServiceHealthPanel(), followUp(), labels (+52 more)

### Community 5 - "digest"
Cohesion: 0.06
Nodes (78): accounting, DeliverySubject, nonDelivery, originalReads, HarnessControl, withHarnessWork(), pinCourierIdentityRefusal(), pinCourierVerifiedCommit() (+70 more)

### Community 6 - ".transaction"
Cohesion: 0.10
Nodes (23): featureById(), FeaturePublisher, PublicationReceipt, publishFeature(), reconcilePublication(), reserveIdentity(), Assign, Board (+15 more)

### Community 7 - "ref_react"
Cohesion: 0.10
Nodes (43): ref_react, ref_react_markdown, ref_remark_gfm, ref_yaml, Activity(), ActivityTimeline(), AssignmentKnowledge(), Lookup() (+35 more)

### Community 8 - "features.ts"
Cohesion: 0.07
Nodes (62): approveFeature(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), discoveryPrompt(), planPrompt(), artifactPath() (+54 more)

### Community 9 - "delivery-recoveries.ts"
Cohesion: 0.11
Nodes (32): deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, gateRegisteredDelivery(), resolveDeliveryWork(), HANDS_OFF_PROJECTS, handsOff() (+24 more)

### Community 10 - "github-delivery.ts"
Cohesion: 0.08
Nodes (60): ref_node_fs, ref_node_path, removeAdoptedClone(), BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction(), dependabotReviewGuidance() (+52 more)

### Community 11 - "App.tsx"
Cohesion: 0.06
Nodes (50): ref_lucide_react, ref_motion, ref_react_dom, BrainDrawer(), themeColor, App(), BrainWorkspace, CONNECTION (+42 more)

### Community 12 - "Store"
Cohesion: 0.08
Nodes (15): AzureMonitor, Assignment, Content, jiraText(), Transition, GitHubFeaturePublisher, JiraFeaturePublisher, Assessment (+7 more)

### Community 13 - "session-bridge.ts"
Cohesion: 0.07
Nodes (44): ref_ws, claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexDaemonProcesses(), accountCodexProcesses(), codexProcessInventory (+36 more)

### Community 14 - "currentAssignment"
Cohesion: 0.14
Nodes (38): ref_node_util, admitPRMetadata(), assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema, savedMetadataAssessment(), validateSaved() (+30 more)

### Community 15 - "Button"
Cohesion: 0.16
Nodes (32): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS, PickupForm(), acceptPreferences() (+24 more)

### Community 16 - "config.ts"
Cohesion: 0.09
Nodes (40): ref_hono_node_server, ref_node_http, ref_vite, close(), config, itSpecialist, loadedRevision, offices (+32 more)

### Community 17 - "cec/workflow.ts"
Cohesion: 0.08
Nodes (52): correlatedBuild(), applyIntakeObservation(), checkMail(), drainMail(), requestMail(), parksInJira(), MISSING_INTAKE, reconcileMailbox() (+44 more)

### Community 18 - "Goals.tsx"
Cohesion: 0.08
Nodes (34): GoalProgress, SendMessage, FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), send(), phases (+26 more)

### Community 19 - "publish-pr.ts"
Cohesion: 0.12
Nodes (32): requireDeliveryAuthority(), activeEffectId(), harnessEffect, assertDeliveryMayMutate(), retryRead(), park(), draftReadHeadMatches(), assertDraftClaimHistory() (+24 more)

### Community 20 - "knowledge.ts"
Cohesion: 0.06
Nodes (40): ref_node_stream, ref_node_timers, args, [cmd,...rawArgs], commands, key, projectIndex, curateLesson() (+32 more)

### Community 21 - "ticket-evidence.ts"
Cohesion: 0.12
Nodes (25): ref_node_string_decoder, CommentPage, commentReadback(), JiraOperations, plain(), unpack(), jiraRecord(), assetDownloader() (+17 more)

### Community 22 - "scheduled-captures.ts"
Cohesion: 0.16
Nodes (40): createFeature(), assertEnrollable(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest, captureRequests(), failCapture() (+32 more)

### Community 23 - "run-retrospective.ts"
Cohesion: 0.10
Nodes (41): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, blockingTrigger, isBlocking(), brainOverlap (+33 more)

### Community 24 - "assignments.ts"
Cohesion: 0.07
Nodes (41): knowledgeActivity(), knowledgeActivityPage(), committedNotePage(), BrainGraph, BrainNote, BrainReader, GraphNode, GraphPage (+33 more)

### Community 25 - "github-readiness.ts"
Cohesion: 0.12
Nodes (36): findingsBlock(), observe(), automationMergePolicy(), observeAutomationMerge(), routeAutomationMerge(), checksFailed(), checksPassed(), checksPending() (+28 more)

### Community 26 - "coordination.ts"
Cohesion: 0.07
Nodes (48): reconcileNoticeConfirmations(), deliveryIntakeBlocker(), Admission, admit(), IntakeContext, WAIT_STATUSES, compatible(), dependencyCompletionKey() (+40 more)

### Community 27 - "agents.ts"
Cohesion: 0.05
Nodes (54): IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), intakeMembership(), projectListScope(), cecPrompt(), cecIntakePrompt() (+46 more)

### Community 28 - "worker-runtime.ts"
Cohesion: 0.08
Nodes (34): ref_zod, candidateWorkspaceEnvironment(), assignmentSubject(), lessonPurpose(), selectLessons(), catalogLine(), assertBriefingScope(), taskBriefing() (+26 more)

### Community 29 - "shared.ts"
Cohesion: 0.08
Nodes (31): ProjectReadiness, DailyCTOSummary, PackedPublicationRepair, ProgressionItem, SchedulerState, itDiagnostics(), itFollowUpView(), sessionVisibilityCopy() (+23 more)

### Community 30 - "store.ts"
Cohesion: 0.07
Nodes (33): ref_node_sqlite, ref_smol_toml, Clock, EASTERN, easternDayFormatter, easternPartsFormatter, systemClock, file (+25 more)

### Community 31 - "run.ts"
Cohesion: 0.15
Nodes (17): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, OFFICE_FIX_PROMPT, OfficeFixResult, validateOfficeFix(), investigationReady(), InvestigationOptions, InvestigationReport (+9 more)

### Community 32 - "PeoplePanel.tsx"
Cohesion: 0.10
Nodes (43): label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+35 more)

### Community 33 - "TimeBook.tsx"
Cohesion: 0.09
Nodes (40): TelemetryReport, displayAgentTask(), LiveAgentTask(), Props, RunningTask(), text(), Agent, AzureBuild (+32 more)

### Community 34 - "maintenance/maintenance.ts"
Cohesion: 0.10
Nodes (28): maintenancePolicies(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice(), candidateOwner(), SETTLED (+20 more)

### Community 35 - "record-trigger.ts"
Cohesion: 0.11
Nodes (38): baselineLearning(), LEARNING_BASELINES, maintainLearning(), configureKnowledge(), clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates() (+30 more)

### Community 36 - "cost-ledger.ts"
Cohesion: 0.14
Nodes (29): captureCost(), server_telemetry_cost_entries_costcoveragesummary, costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress() (+21 more)

### Community 37 - "OfficeSnapshot"
Cohesion: 0.16
Nodes (24): compactSteps(), OfficeSnapshot, interactive, deliveryRepairProjection(), card, ACTIVE, maintenanceUpdate(), PMQueueItem (+16 more)

### Community 38 - "record-push.ts"
Cohesion: 0.08
Nodes (29): ref_node_child_process, ref_node_url, file, folder, logs, root, Event, one() (+21 more)

### Community 39 - "SlackMessages"
Cohesion: 0.18
Nodes (8): MergeNotifications, comparableSlackText(), SlackMessages, goalNoticeAuthorized(), sendGoalNotice(), maintenanceNoticeAuthorized(), sendMaintenanceNotice(), MergeNotice

### Community 40 - "local-config.ts"
Cohesion: 0.10
Nodes (27): AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), GitHubMonitor, githubPRDescription(), azureGoalFacts(), azurePRDescription(), boundedEvidence(), collectAzureGoalDocuments() (+19 more)

### Community 41 - "source-amendment.ts"
Cohesion: 0.07
Nodes (63): ref_node_async_hooks, approvedText(), assert(), amendmentIssueSha256(), authorizeSourceAmendment(), Binding, assert(), normalize() (+55 more)

### Community 42 - "conversations/conversations.ts"
Cohesion: 0.10
Nodes (29): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+21 more)

### Community 43 - "lesson-selection.ts"
Cohesion: 0.09
Nodes (28): normalizeStatement(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, LessonSelection, MAINTENANCE, MAX_LESSONS (+20 more)

### Community 44 - "time-scope.ts"
Cohesion: 0.16
Nodes (25): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), midnight(), TicketDay (+17 more)

### Community 45 - "outbox.ts"
Cohesion: 0.14
Nodes (22): conversationResolved(), projectOutbox(), syncOutbox(), projectSlackDeliveries(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint() (+14 more)

### Community 46 - "resume-provider-review.ts"
Cohesion: 0.18
Nodes (27): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), ProjectCard, projectCards(), projectGraphql() (+19 more)

### Community 47 - "OfficeScene.tsx"
Cohesion: 0.11
Nodes (45): ref_react_three_drei, ref_react_three_fiber, ref_three_stdlib, itAgent(), withoutElapsed(), CameraBookmark, restoreBookmark(), Avatar() (+37 more)

### Community 48 - "demand-facts.ts"
Cohesion: 0.15
Nodes (22): assignmentKnowledge(), clip(), DEMAND_LIMIT, demandFacts(), DemandSection, key(), LessonKey, notes() (+14 more)

### Community 49 - "engine.ts"
Cohesion: 0.17
Nodes (30): dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), resume(), startPilot(), eligibility(), assertFeatureGate() (+22 more)

### Community 50 - "weekly-rollup.ts"
Cohesion: 0.20
Nodes (17): learningMetrics(), BRAIN_SCOPE, RollupResult, RollupResultSchema, harperFolder(), RETROSPECTIVE_TIMEOUT, lastFriday(), ROLLUP_HISTORY (+9 more)

### Community 51 - "azure.ts"
Cohesion: 0.17
Nodes (20): az(), base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs(), fullActivePRs() (+12 more)

### Community 52 - "GitHubDelivery"
Cohesion: 0.05
Nodes (76): StageContext, GitHubDelivery, adoptCandidate(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext() (+68 more)

### Community 53 - "jira-time.ts"
Cohesion: 0.22
Nodes (13): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+5 more)

### Community 54 - "retrospective-subject.ts"
Cohesion: 0.18
Nodes (15): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+7 more)

### Community 55 - ".save"
Cohesion: 0.24
Nodes (23): BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue(), readIssues(), commentDecision() (+15 more)

### Community 56 - "Coordinator"
Cohesion: 0.08
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 57 - ".emit"
Cohesion: 0.13
Nodes (27): configureChannelNotices(), configureNotices(), retryRecipientLookup(), PrerequisitesSchema, enqueueGreen156(), bindDiscoveryResume(), DiscoveryResumeInput, failedWorker() (+19 more)

### Community 58 - "remove-candidate.ts"
Cohesion: 0.18
Nodes (18): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot() (+10 more)

### Community 59 - "index.tsx"
Cohesion: 0.10
Nodes (26): OutboxMaintenanceStatus(), recommendedReply(), buttonClasses(), ButtonLayout, ButtonVariant, variants, ChevronDown, ButtonLink (+18 more)

### Community 60 - "dependency-bots/adopt.ts"
Cohesion: 0.15
Nodes (28): Execute, readBackOrThrow(), adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR (+20 more)

### Community 61 - "ControlStore"
Cohesion: 0.16
Nodes (6): DailyCTO, EvidenceRequestConflict, Briefing, saveReviewBriefing(), ControlStore, DailyCTOReport

### Community 62 - "constellation-runtime.ts"
Cohesion: 0.10
Nodes (22): ref_3d_force_graph, ref_three, CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point (+14 more)

### Community 63 - "daily-cto.ts"
Cohesion: 0.13
Nodes (18): evidenceRequestConflicts, dailyReviewPrompt(), applyGoalReview(), DailyResultSchema, EvidenceRefSchema, FreshDailyResultSchema, GoalEvidenceRequestSchema, statusAllowed() (+10 more)

### Community 64 - "Effects"
Cohesion: 0.15
Nodes (18): GitHubOperations, admitImprovement(), improvementEligible(), fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), distinct(), identity() (+10 more)

### Community 65 - "JiraIssuePublisher"
Cohesion: 0.24
Nodes (5): JiraIssuePublisher, keyOf(), descriptionPreimage(), plain(), publicationDescription()

### Community 66 - "knowledge-views.ts"
Cohesion: 0.19
Nodes (17): KnowledgeActivity, KnowledgeEdge, KnowledgeMap, KnowledgeNode, connectionSummary(), Constellation(), ConstellationView, DisplayNode (+9 more)

### Community 67 - "WorkTime"
Cohesion: 0.16
Nodes (20): ConfirmedSegment, LiveAnchor, ObservationGap, SnapshotOrdering, TimeLedgerState, TimePublication, WorkTime, Acc (+12 more)

### Community 68 - "it-specialist.ts"
Cohesion: 0.19
Nodes (15): partialLocalCleanupKey(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), ITContext, diagnosticSnapshot(), publishITReport() (+7 more)

### Community 69 - "validate-stage.ts"
Cohesion: 0.25
Nodes (14): harnessCloseout(), PASSING, verifyMergeActions(), runHarnessStage(), harnessStageResult(), receipt(), Check, harnessChecks() (+6 more)

### Community 70 - "work.ts"
Cohesion: 0.09
Nodes (19): BrainStatusSchema, brainCheckpointCompletion(), coverageSchema, followupSchema, verified, reconcileCompletedCheckpoints(), AssignmentResult, CompletionCondition (+11 more)

### Community 71 - "blocker-followups.ts"
Cohesion: 0.13
Nodes (26): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), readBackConversations(), handoff(), reconcileBlockerFollowups(), improvementIntakeGate(), captureLearning() (+18 more)

### Community 72 - "run-accounting.ts"
Cohesion: 0.11
Nodes (33): BoundedRead, done(), readBoundedNoFollow(), reasonOf(), backfillClaudeCost(), CompletionReader, codexHome(), createdAt() (+25 more)

### Community 73 - "scheduled-work.ts"
Cohesion: 0.12
Nodes (24): deliverySlot(), ROLES, closeoutRequestResolved(), metadataRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), requestPriority(), deterministicActions (+16 more)

### Community 74 - "telemetry.ts"
Cohesion: 0.10
Nodes (26): CodexRollout, CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL (+18 more)

### Community 75 - "QuestionStepper.tsx"
Cohesion: 0.15
Nodes (23): FeatureHarnessOption, FeatureOption, FeatureQuestion, FeatureQuestionProjection, draftKey(), readDraft(), saveDraft(), QuestionRound() (+15 more)

### Community 76 - "node-visuals.ts"
Cohesion: 0.20
Nodes (13): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+5 more)

### Community 77 - "evidence-artifacts.ts"
Cohesion: 0.23
Nodes (14): ghLogCacheEvidence(), evidenceDirectory(), readEvidence(), storeEvidence(), canonical(), evidenceDigest(), evidenceHash(), semantic() (+6 more)

### Community 78 - "service-health.ts"
Cohesion: 0.20
Nodes (9): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, slackHealth() (+1 more)

### Community 79 - "fact-bounds.ts"
Cohesion: 0.23
Nodes (16): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+8 more)

### Community 80 - "assignment-poll.ts"
Cohesion: 0.13
Nodes (22): channelNoticeAuthorized(), ChannelSettings, notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR, plainSlackText() (+14 more)

### Community 81 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 82 - "evidence.ts"
Cohesion: 0.31
Nodes (8): investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_SOURCE_PATHS, officeSource(), launchPolicyFacts(), lifecycleFacts()

### Community 83 - "preferences-store.ts"
Cohesion: 0.19
Nodes (9): PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS, OfficePreferences (+1 more)

### Community 84 - "easternDay"
Cohesion: 0.35
Nodes (9): expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), dailyReviewDate(), reviewWeekday() (+1 more)

### Community 85 - "features/routes.ts"
Cohesion: 0.33
Nodes (4): Link, linkFeature(), featureRoute(), FeatureWorkflow

### Community 86 - "tracking-issue.ts"
Cohesion: 0.19
Nodes (13): ensureTrackingIssue(), findTrackingIssue(), ownTracking(), TrackingIssue, trackingIssueBody(), trackingIssueTitle(), trackingMarker(), centralCompanionHandoff() (+5 more)

### Community 89 - "cost-totals.ts"
Cohesion: 0.38
Nodes (6): server_telemetry_billable_work_issue_key, awaitingEvidence(), CaptureContext, inCostWindow(), TicketCost, ticketCosts()

### Community 91 - "office-state-view.ts"
Cohesion: 0.60
Nodes (4): leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore()

### Community 93 - "run-evidence.ts"
Cohesion: 0.67
Nodes (3): comparable(), EvidenceOutcome, recordRunEvidence()

### Community 94 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 96 - "ledger.ts"
Cohesion: 0.32
Nodes (10): investigationCandidates(), investigationId(), investigationFollowUps(), investigationResolution(), syncInvestigations(), NOTIFY_HELPER, notifyHelperResolution(), requeueInvestigationEvidence() (+2 more)

### Community 97 - "OutboxLessonDecision.tsx"
Cohesion: 0.31
Nodes (11): LessonDecisionAction, lessonDecisionState(), readLessonDecision(), OutboxLessonDecision(), act(), readStatus(), Evidence(), LessonCard() (+3 more)

### Community 98 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 100 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (6): ref_mammoth, ref_pdfjs_dist, bounded(), extract(), fail(), [path,kind]

### Community 101 - "create-candidate.ts"
Cohesion: 0.26
Nodes (10): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+2 more)

### Community 102 - "helper-evidence.py"
Cohesion: 0.33
Nodes (5): importlib_util, json, pathlib, Read-only protocol adapter for the installed review helper. No model dispatch., sys

### Community 103 - "Engine"
Cohesion: 0.10
Nodes (4): Engine, observe(), observeParked(), parkedReadError

## Knowledge Gaps
- **477 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+472 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 606 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `artifact`, `workKey`, `accept-stage-result.ts`, `offices.ts`, `digest`, `.transaction`, `features.ts`, `delivery-recoveries.ts`, `github-delivery.ts`, `session-bridge.ts`, `currentAssignment`, `config.ts`, `cec/workflow.ts`, `publish-pr.ts`, `ticket-evidence.ts`, `scheduled-captures.ts`, `run-retrospective.ts`, `assignments.ts`, `github-readiness.ts`, `coordination.ts`, `agents.ts`, `worker-runtime.ts`, `shared.ts`, `store.ts`, `run.ts`, `maintenance/maintenance.ts`, `record-trigger.ts`, `cost-ledger.ts`, `OfficeSnapshot`, `record-push.ts`, `SlackMessages`, `local-config.ts`, `source-amendment.ts`, `conversations/conversations.ts`, `lesson-selection.ts`, `time-scope.ts`, `outbox.ts`, `resume-provider-review.ts`, `demand-facts.ts`, `engine.ts`, `weekly-rollup.ts`, `azure.ts`, `GitHubDelivery`, `jira-time.ts`, `retrospective-subject.ts`, `.save`, `.emit`, `remove-candidate.ts`, `dependency-bots/adopt.ts`, `daily-cto.ts`, `Effects`, `it-specialist.ts`, `work.ts`, `blocker-followups.ts`, `run-accounting.ts`, `scheduled-work.ts`, `evidence-artifacts.ts`, `assignment-poll.ts`, `evidence.ts`, `easternDay`, `features/routes.ts`, `tracking-issue.ts`, `QuestionNotifications`, `office-state-view.ts`, `run-evidence.ts`, `ledger.ts`, `create-candidate.ts`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **Why does `TicketJob` connect `github-delivery.ts` to `artifact`, `workKey`, `accept-stage-result.ts`, `Inspector.tsx`, `digest`, `delivery-recoveries.ts`, `currentAssignment`, `cec/workflow.ts`, `publish-pr.ts`, `github-readiness.ts`, `coordination.ts`, `worker-runtime.ts`, `shared.ts`, `store.ts`, `record-trigger.ts`, `OfficeSnapshot`, `record-push.ts`, `source-amendment.ts`, `resume-provider-review.ts`, `GitHubDelivery`, `retrospective-subject.ts`, `remove-candidate.ts`, `dependency-bots/adopt.ts`, `it-specialist.ts`, `validate-stage.ts`, `work.ts`, `scheduled-work.ts`, `evidence-artifacts.ts`, `fact-bounds.ts`, `create-candidate.ts`, `ProjectProgress`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `Role` connect `worker-runtime.ts` to `accept-stage-result.ts`, `Inspector.tsx`, `digest`, `github-delivery.ts`, `App.tsx`, `cec/workflow.ts`, `github-readiness.ts`, `agents.ts`, `shared.ts`, `store.ts`, `PeoplePanel.tsx`, `maintenance/maintenance.ts`, `local-config.ts`, `conversations/conversations.ts`, `outbox.ts`, `OfficeScene.tsx`, `GitHubDelivery`, `retrospective-subject.ts`, `.emit`, `index.tsx`, `work.ts`, `run-accounting.ts`, `scheduled-work.ts`, `scene-motion.ts`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _477 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `artifact` be split into smaller, more focused modules?**
  _Cohesion score 0.05416238437821172 - nodes in this community are weakly interconnected._
- **Should `workKey` be split into smaller, more focused modules?**
  _Cohesion score 0.06583850931677018 - nodes in this community are weakly interconnected._
- **Should `accept-stage-result.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10707070707070707 - nodes in this community are weakly interconnected._