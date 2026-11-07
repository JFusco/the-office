# Graph Report - merge-summary  (2026-11-06)

## Corpus Check
- 403 files · ~199,934 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2394 nodes · 10193 edges · 80 communities (79 shown, 1 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 51 edges (avg confidence: 0.74)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e312306e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- source-amendment.ts
- OfficeScene.tsx
- shared.ts
- Inspector.tsx
- index.ts
- worker-runtime.ts
- index.tsx
- goal-reporting.ts
- conversations/conversations.ts
- saved-prerequisite-handoff.ts
- engine.ts
- digest
- features.ts
- http/commands.ts
- Role
- sanitize
- service-health.ts
- delivery-task.ts
- workKey
- FeatureWorkspace.tsx
- OfficeSnapshot
- SettingsPanel.tsx
- scope-repair-resume.ts
- store.ts
- Store
- daily-cto.ts
- jira-publication.ts
- agents.ts
- delivery-binding.ts
- validate-stage.ts
- .transaction
- maintenance.ts
- run-retrospective.ts
- scheduler.ts
- github-delivery.ts
- GitHubDelivery
- conversations/slack.ts
- TimeBook.tsx
- .save
- dependency-bots/adopt.ts
- github-publication.ts
- Coordinator
- artifact
- jira-time.ts
- tracking-issue.ts
- dependencies.ts
- scheduled-work.ts
- retrospective-triggers.ts
- SlackMessages
- closeout.ts
- offices.ts
- coordination.ts
- .emit
- ProjectProgress
- retrospective-subject.ts
- notifications.ts
- remove-candidate.ts
- it-specialist.ts
- api-routes.ts
- Offices
- run-ci-repair.ts
- knowledge.ts
- publish-pr.ts
- weekly-rollup.ts
- fact-bounds.ts
- discovery-recovery.ts
- recovery-ledger.ts
- DailyCTO.tsx
- goal-reviews.ts
- sanitizeObject
- retrospective-facts.ts
- work.ts
- cli.ts
- dependency-edges.ts
- knowledge-context.ts
- command-registry.ts
- session-bridge.ts
- maintenance-triggers.ts
- helper-evidence.py

## God Nodes (most connected - your core abstractions)
1. `Store` - 221 edges
2. `TicketJob` - 114 edges
3. `GitHubDelivery` - 112 edges
4. `command()` - 86 edges
5. `artifact()` - 85 edges
6. `digest()` - 82 edges
7. `workKey()` - 69 edges
8. `cx()` - 69 edges
9. `StageResult` - 63 edges
10. `OfficeSnapshot` - 63 edges

## Surprising Connections (you probably didn't know these)
- `DeliverySlot` --references--> `Role`  [EXTRACTED]
  server/office/projects.ts → src/shared.ts
- `cecChatPrompt()` --calls--> `timeReport()`  [EXTRACTED]
  server/conversations/prompts/conversations.ts → src/timing/timing.ts
- `pump()` --calls--> `deferredPickup()`  [EXTRACTED]
  server/conversations/team-conversation-pump.ts → src/work/pickup-state.ts
- `IntakeContext` --references--> `Coordination`  [EXTRACTED]
  server/delivery/intake/admission.ts → src/shared.ts
- `needsReconciliation()` --calls--> `workKey()`  [EXTRACTED]
  server/delivery/parking/retire-backlogged.ts → src/contracts/work.ts

## Import Cycles
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/stage-reconciliation.ts -> server/delivery/recovery/implementation/continuation-review-readback.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-guard.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/preparation/post-conflict-preparation.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-publication.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/conversations/conversations.ts -> server/conversations/slack.ts -> server/workers/agents.ts -> server/conversations/conversations.ts`
- 3-file cycle: `server/conversations/slack.ts -> server/workers/agents.ts -> server/workers/worker-runtime.ts -> server/conversations/slack.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/scope-repair/scope-repair-resume.ts -> server/delivery/recovery/validation/validation-provider-context.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/conversations/conversations.ts -> server/scheduling/engine.ts -> server/workers/agents.ts -> server/conversations/conversations.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/stage-prompts.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-checkout.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-evidence.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-preparation.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/conversations/conversation-recovery.ts -> server/conversations/conversations.ts -> server/conversations/team-conversation-pump.ts -> server/conversations/conversation-recovery.ts`
- 3-file cycle: `server/scheduling/coordination-pump.ts -> server/scheduling/requests.ts -> server/scheduling/coordination.ts -> server/scheduling/coordination-pump.ts`
- 3-file cycle: `server/scheduling/coordination-tick.ts -> server/scheduling/requests.ts -> server/scheduling/coordination.ts -> server/scheduling/coordination-tick.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/implementation/activation-recovery.ts -> server/delivery/recovery/validation/validation-provider-context.ts -> server/delivery/pipeline/github-delivery.ts`

## Communities (80 total, 1 thin omitted)

### Community 0 - "source-amendment.ts"
Cohesion: 0.07
Nodes (66): adoptCandidate(), reported, Scope, approvedText(), assert(), amendmentInstruction(), amendmentIssueSha256(), authorizeSourceAmendment() (+58 more)

### Community 1 - "OfficeScene.tsx"
Cohesion: 0.07
Nodes (48): Avatar(), AzureWall(), Chair(), Coworker(), CTORoom(), Desk(), Floor, Furnishings (+40 more)

### Community 2 - "shared.ts"
Cohesion: 0.06
Nodes (45): fields, PreferencesPatch, StoredBody, ProjectReadiness, DailyCTOSummary, ConfirmedSegment, LiveAnchor, ObservationGap (+37 more)

### Community 3 - "Inspector.tsx"
Cohesion: 0.05
Nodes (51): SendMessage, blank(), goalInput, Goals(), themeColor, CONNECTION, CONNECTION_DOT, dockItemVariants (+43 more)

### Community 4 - "index.ts"
Cohesion: 0.15
Nodes (16): close(), config, itSpecialist, loadedRevision, offices, releaseLock, server, serviceHealth (+8 more)

### Community 5 - "worker-runtime.ts"
Cohesion: 0.14
Nodes (16): SlackResultSchema, SlackVerificationSchema, labels, toolActivity(), workerActivity(), claudeArguments(), ClaudeStream, DEVELOPER_EFFORT (+8 more)

### Community 6 - "index.tsx"
Cohesion: 0.09
Nodes (48): Outbox(), ServiceHealthPanel(), labels, ServiceHealthRow(), LessonsPanel(), when(), GoalList(), ArrowRight (+40 more)

### Community 7 - "goal-reporting.ts"
Cohesion: 0.22
Nodes (13): assertConversationReadback(), pump(), PickupSchema, savePickup(), acceptedGoalReport(), GOAL_REPORT_GUIDANCE, GoalReport, goalReportContext() (+5 more)

### Community 8 - "conversations/conversations.ts"
Cohesion: 0.13
Nodes (14): ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff(), saveGoals() (+6 more)

### Community 9 - "saved-prerequisite-handoff.ts"
Cohesion: 0.36
Nodes (12): continuationWorktree(), dependencyVersion(), handoffSavedPrerequisites(), hasSavedPrerequisiteResult(), Ownership, qualified(), readDependencies(), requireSavedPrerequisites() (+4 more)

### Community 10 - "engine.ts"
Cohesion: 0.05
Nodes (61): correlatedBuild(), checkMail(), drainMail(), requestMail(), parksInJira(), dispatchNightly(), drainDelivery(), enableNightly() (+53 more)

### Community 11 - "digest"
Cohesion: 0.12
Nodes (44): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+36 more)

### Community 12 - "features.ts"
Cohesion: 0.11
Nodes (39): approveFeature(), assertRetainedItems(), commandFeature(), createFeature(), featureById(), mutation(), discoveryPrompt(), planPrompt() (+31 more)

### Community 13 - "http/commands.ts"
Cohesion: 0.17
Nodes (18): configureKnowledge(), declineLessonIssue(), reactivateLesson(), retireLesson(), decideOfficeProposal(), mirrorOfficeKnowledge(), now(), OfficeKnowledgeStore (+10 more)

### Community 14 - "Role"
Cohesion: 0.11
Nodes (38): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+30 more)

### Community 15 - "sanitize"
Cohesion: 0.10
Nodes (28): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+20 more)

### Community 16 - "service-health.ts"
Cohesion: 0.18
Nodes (9): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, slackHealth() (+1 more)

### Community 17 - "delivery-task.ts"
Cohesion: 0.22
Nodes (11): cecPrompt(), resolvedDecisionNote(), stageInstructions, APPROACH_GUIDANCE, reviewInstructions(), deliveryTask(), DeliveryTaskInput, DISCOVERY_GUIDANCE (+3 more)

### Community 18 - "workKey"
Cohesion: 0.10
Nodes (40): recordJobApproach(), advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat(), continuationScope(), brainImplementationCandidate() (+32 more)

### Community 19 - "FeatureWorkspace.tsx"
Cohesion: 0.17
Nodes (16): FeatureRound, FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures(), draftKey() (+8 more)

### Community 20 - "OfficeSnapshot"
Cohesion: 0.09
Nodes (39): conversationResolved(), projectOutbox(), compactSteps(), knowledgeOutbox(), checkpointSuperseded(), Conversation(), recommendedReply(), App() (+31 more)

### Community 21 - "SettingsPanel.tsx"
Cohesion: 0.15
Nodes (27): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView() (+19 more)

### Community 22 - "scope-repair-resume.ts"
Cohesion: 0.16
Nodes (28): Assessment, outsideScanSources(), Ownership, reconcileScopeRepairReadback(), requireThat(), scopeRepairReadbackCandidate(), scopeRepairRequestResolved(), sha (+20 more)

### Community 23 - "store.ts"
Cohesion: 0.11
Nodes (14): Clock, applyConnectionSettings(), closeConnection(), optimizeOnOpen(), statementCache(), initialSnapshot(), initializeStoreSchema(), checkpointMeasurement() (+6 more)

### Community 24 - "Store"
Cohesion: 0.09
Nodes (14): JiraOperations, plain(), Result, Assessment, Store, GIT_NETWORK, LIVE_PROVIDERS, liveReach() (+6 more)

### Community 25 - "daily-cto.ts"
Cohesion: 0.15
Nodes (11): DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), dailyReviewDate(), reviewWeekday(), DailyResultSchema, easternDay() (+3 more)

### Community 26 - "jira-publication.ts"
Cohesion: 0.25
Nodes (8): Assignment, Content, JiraFeaturePublisher, jiraText(), keyOf(), plainDescription(), Transition, PublicationReceipt

### Community 27 - "agents.ts"
Cohesion: 0.09
Nodes (30): cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), cecChatPrompt(), ctoChatPrompt(), itChatPrompt(), slackSendPrompt() (+22 more)

### Community 28 - "delivery-binding.ts"
Cohesion: 0.38
Nodes (8): featureEffectGate(), bindFeature(), currentApproval(), enrolled(), featureGate(), predecessorComplete(), scheduledFeatures(), FeatureBinding

### Community 29 - "validate-stage.ts"
Cohesion: 0.16
Nodes (17): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+9 more)

### Community 30 - ".transaction"
Cohesion: 0.15
Nodes (16): reviewQuestions(), featureItemComplete(), reconcileFeatureCompletion(), document(), featureRoot(), helperTelemetry(), recoverFeatures(), EvidenceSchema (+8 more)

### Community 31 - "maintenance.ts"
Cohesion: 0.05
Nodes (53): HANDS_OFF_PROJECTS, handsOff(), legacyRecovery(), discover(), refreshDependencies(), routeExisting(), openPullInventory(), maintenancePolicies() (+45 more)

### Community 32 - "run-retrospective.ts"
Cohesion: 0.15
Nodes (19): busyMaintenanceIds(), retrospectivePrompt(), SUBJECT, Kind, RetrospectiveResultSchema, RollupResultSchema, Stage, triggerJobId() (+11 more)

### Community 33 - "scheduler.ts"
Cohesion: 0.16
Nodes (14): ROLES, officeCapacity, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch() (+6 more)

### Community 34 - "github-delivery.ts"
Cohesion: 0.06
Nodes (84): containedFile(), findingsBlock(), harnessDelivers(), BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction(), dependabotReviewGuidance() (+76 more)

### Community 35 - "GitHubDelivery"
Cohesion: 0.07
Nodes (59): GitHubDelivery, assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), reconcileCompletedConflictDraft(), routeReadyPostConflictPublication() (+51 more)

### Community 36 - "conversations/slack.ts"
Cohesion: 0.12
Nodes (19): GitHubOperations, fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), goalNoticeAuthorized(), goalNoticeNeverDispatched(), sendGoalNotice(), closeNativeRefresh() (+11 more)

### Community 37 - "TimeBook.tsx"
Cohesion: 0.12
Nodes (27): displayAgentTask(), LiveAgentTask(), Props, RunningTask(), text(), OFFICE_CAST, PARTY_DURATION, secretPhrase() (+19 more)

### Community 38 - ".save"
Cohesion: 0.22
Nodes (25): unpack(), BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue(), readIssues() (+17 more)

### Community 39 - "dependency-bots/adopt.ts"
Cohesion: 0.25
Nodes (19): Execute, adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR, openDependabotPulls() (+11 more)

### Community 40 - "github-publication.ts"
Cohesion: 0.17
Nodes (13): Assign, Board, Content, GitHubFeaturePublisher, number(), same(), FeaturePublisher, publishFeature() (+5 more)

### Community 41 - "Coordinator"
Cohesion: 0.09
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 42 - "artifact"
Cohesion: 0.11
Nodes (57): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+49 more)

### Community 43 - "jira-time.ts"
Cohesion: 0.19
Nodes (15): data(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), captureTime(), midnight() (+7 more)

### Community 44 - "tracking-issue.ts"
Cohesion: 0.24
Nodes (19): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), ProjectCard, projectCards(), projectGraphql() (+11 more)

### Community 45 - "dependencies.ts"
Cohesion: 0.23
Nodes (18): Admission, admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, resumeParked(), compatible(), dependencyCompletionKey() (+10 more)

### Community 46 - "scheduled-work.ts"
Cohesion: 0.17
Nodes (18): deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), deterministicActions, eligible() (+10 more)

### Community 47 - "retrospective-triggers.ts"
Cohesion: 0.16
Nodes (23): clip(), JobLike, recordCIBudget(), recordRepairBudget(), recordTicketParked(), recordTrigger(), subjectOf(), ciBudgetId() (+15 more)

### Community 48 - "SlackMessages"
Cohesion: 0.38
Nodes (3): comparableSlackText(), SlackMessages, SlackRequestSchema

### Community 49 - "closeout.ts"
Cohesion: 0.38
Nodes (9): harnessCloseout(), PASSING, verifyMergeActions(), runHarnessStage(), harnessStageResult(), receipt(), harnessDraft(), harnessPrepare() (+1 more)

### Community 50 - "offices.ts"
Cohesion: 0.23
Nodes (8): Briefing, saveReviewBriefing(), EASTERN, easternDayFormatter, easternPartsFormatter, systemClock, DELIVERY_CONCURRENCY, CTOConfiguration

### Community 51 - "coordination.ts"
Cohesion: 0.18
Nodes (18): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation(), checkpointWindow(), dueAt() (+10 more)

### Community 52 - ".emit"
Cohesion: 0.14
Nodes (15): reconcileNoticeConfirmations(), PrerequisitesSchema, BrainFollowup, legacy, reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION (+7 more)

### Community 53 - "ProjectProgress"
Cohesion: 0.27
Nodes (6): file, folder, logs, root, xml(), ProjectProgress

### Community 54 - "retrospective-subject.ts"
Cohesion: 0.18
Nodes (16): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+8 more)

### Community 55 - "notifications.ts"
Cohesion: 0.12
Nodes (24): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR (+16 more)

### Community 56 - "remove-candidate.ts"
Cohesion: 0.19
Nodes (17): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+9 more)

### Community 57 - "it-specialist.ts"
Cohesion: 0.24
Nodes (13): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), partialLocalCleanupKey(), ITContext, readBackConversations(), publishITReport(), delays (+5 more)

### Community 58 - "api-routes.ts"
Cohesion: 0.18
Nodes (13): goalHistory(), GoalInput, saveGoal(), apiRoute(), RequestContext, preferencesRoute(), PreferencesRouteContext, fileResponse() (+5 more)

### Community 59 - "Offices"
Cohesion: 0.19
Nodes (6): file, project, root, projectById(), projectData(), Offices

### Community 60 - "run-ci-repair.ts"
Cohesion: 0.27
Nodes (13): lintPRContent(), ciCheckout(), verifyCIHooks(), CIFailure, guardCIRepair(), prepareCIMetadataRepair(), publishCIRepair(), rewordCommits() (+5 more)

### Community 61 - "knowledge.ts"
Cohesion: 0.19
Nodes (14): SEEDS, KnowledgeRetry, KnowledgeState, Lesson, LessonRecurrence, OfficeProposal, RepositoryInstruction, RetrospectiveEvent (+6 more)

### Community 62 - "publish-pr.ts"
Cohesion: 0.16
Nodes (19): activeEffectId(), harnessEffect, readBackOrThrow(), retryRead(), park(), developerPRContent(), Execute, officePRContent() (+11 more)

### Community 63 - "weekly-rollup.ts"
Cohesion: 0.25
Nodes (15): RollupResult, harperFolder(), retryDelay(), ineffectiveLessons(), lastFriday(), ROLLUP_HISTORY, rollupDue(), RollupHooks (+7 more)

### Community 64 - "fact-bounds.ts"
Cohesion: 0.26
Nodes (15): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+7 more)

### Community 65 - "discovery-recovery.ts"
Cohesion: 0.29
Nodes (10): Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership, rawHash() (+2 more)

### Community 66 - "recovery-ledger.ts"
Cohesion: 0.38
Nodes (7): savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), diagnosticSnapshot(), nativeDeliveryResolved(), reconcileRecoveryLedger()

### Community 67 - "DailyCTO.tsx"
Cohesion: 0.23
Nodes (9): CTOReview(), goalState, DailyCTO(), GoalHistory(), reportDate(), reviewStatus, reviewExcerpt(), ReviewText() (+1 more)

### Community 68 - "goal-reviews.ts"
Cohesion: 0.18
Nodes (12): applyGoalReview(), EvidenceRefSchema, FreshDailyResultSchema, statusAllowed(), workEvidence(), DailyCTOBriefing, DailyCTOResult, DailyGoalUpdate (+4 more)

### Community 69 - "sanitizeObject"
Cohesion: 0.31
Nodes (8): snapshot(), OfficeConfigInputs, officeConfigRoute(), officeConfigSummary(), CECBinding, localBindings, sanitizeObject(), OfficeProject

### Community 70 - "retrospective-facts.ts"
Cohesion: 0.15
Nodes (17): Accepted, acceptRetrospective(), normalizeStatement(), RETROSPECTIVE_HISTORY, ARTIFACT_LIMIT, clip(), LEDGER_STEPS, MAINTENANCE_LIMIT (+9 more)

### Community 71 - "work.ts"
Cohesion: 0.20
Nodes (9): AssignmentResult, CompletionCondition, DependencyObservation, EligibilityState, FailureCategory, ReconciliationAction, WorkAssignment, WorkEligibility (+1 more)

### Community 72 - "cli.ts"
Cohesion: 0.25
Nodes (6): args, [cmd,...rawArgs], commands, key, projectIndex, PORT

### Community 73 - "dependency-edges.ts"
Cohesion: 1.00
Nodes (3): assertFeatureDependencyOrder(), featureDependencyEdges(), key()

### Community 74 - "knowledge-context.ts"
Cohesion: 0.21
Nodes (11): Bucket, knowledgeContext(), LESSON_LIMIT, lessonPurpose(), MAINTENANCE, MAX_LESSONS, PURPOSES, render() (+3 more)

### Community 77 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 78 - "session-bridge.ts"
Cohesion: 0.23
Nodes (9): claudeSessions(), codexSessions(), desktopSessions(), guardianReview(), LiveSession, loadedCodexSession(), openRollouts(), SessionBridge (+1 more)

### Community 81 - "maintenance-triggers.ts"
Cohesion: 0.36
Nodes (9): clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates(), maintenanceCompletedId(), maintenanceKey(), visibleMaintenanceTriggerIds(), TerminalCandidate (+1 more)

## Knowledge Gaps
- **286 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+281 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `source-amendment.ts`, `shared.ts`, `worker-runtime.ts`, `goal-reporting.ts`, `conversations/conversations.ts`, `saved-prerequisite-handoff.ts`, `engine.ts`, `digest`, `features.ts`, `http/commands.ts`, `sanitize`, `delivery-task.ts`, `workKey`, `OfficeSnapshot`, `scope-repair-resume.ts`, `store.ts`, `daily-cto.ts`, `jira-publication.ts`, `agents.ts`, `delivery-binding.ts`, `validate-stage.ts`, `.transaction`, `maintenance.ts`, `run-retrospective.ts`, `scheduler.ts`, `github-delivery.ts`, `GitHubDelivery`, `conversations/slack.ts`, `.save`, `dependency-bots/adopt.ts`, `github-publication.ts`, `artifact`, `jira-time.ts`, `tracking-issue.ts`, `dependencies.ts`, `scheduled-work.ts`, `retrospective-triggers.ts`, `SlackMessages`, `offices.ts`, `coordination.ts`, `.emit`, `retrospective-subject.ts`, `notifications.ts`, `remove-candidate.ts`, `it-specialist.ts`, `api-routes.ts`, `Offices`, `publish-pr.ts`, `weekly-rollup.ts`, `discovery-recovery.ts`, `recovery-ledger.ts`, `goal-reviews.ts`, `retrospective-facts.ts`, `dependency-edges.ts`, `knowledge-context.ts`, `session-bridge.ts`?**
  _High betweenness centrality (0.112) - this node is a cross-community bridge._
- **Why does `Engine` connect `engine.ts` to `github-delivery.ts`, `GitHubDelivery`, `conversations/conversations.ts`, `features.ts`, `scheduled-work.ts`, `sanitize`, `offices.ts`, `coordination.ts`, `notifications.ts`, `Store`, `daily-cto.ts`, `agents.ts`, `maintenance.ts`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `command()` connect `Store` to `worker-runtime.ts`, `engine.ts`, `digest`, `features.ts`, `sanitize`, `service-health.ts`, `workKey`, `jira-publication.ts`, `agents.ts`, `validate-stage.ts`, `.transaction`, `maintenance.ts`, `github-delivery.ts`, `GitHubDelivery`, `conversations/slack.ts`, `.save`, `github-publication.ts`, `jira-time.ts`, `tracking-issue.ts`, `dependencies.ts`, `scheduled-work.ts`, `coordination.ts`, `notifications.ts`, `remove-candidate.ts`, `run-ci-repair.ts`, `publish-pr.ts`, `command-registry.ts`, `session-bridge.ts`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `command()` (e.g. with `.constructor()` and `executeRequest()`) actually correct?**
  _`command()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _286 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `source-amendment.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06964006259780908 - nodes in this community are weakly interconnected._
- **Should `OfficeScene.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06829573934837092 - nodes in this community are weakly interconnected._