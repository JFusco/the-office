# Graph Report - persona-role-names  (2026-11-06)

## Corpus Check
- 403 files · ~200,000 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2397 nodes · 10198 edges · 72 communities (70 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 51 edges (avg confidence: 0.74)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b911f2c6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- publish-pr.ts
- dependency-bots/adopt.ts
- engine.ts
- outbox.ts
- source-amendment.ts
- artifact
- shared.ts
- Inspector.tsx
- agents.ts
- index.tsx
- github-delivery.ts
- OfficeScene.tsx
- TicketJob
- requests.ts
- maintenance.ts
- digest
- Store
- index.ts
- implementation-recovery.ts
- SettingsPanel.tsx
- conversations/conversations.ts
- approval.ts
- azure.ts
- scope-repair-resume.ts
- OfficeSnapshot
- work-summary.ts
- TimeBook.tsx
- useOfficePreferences.ts
- .transaction
- knowledge.ts
- park-ticket.ts
- .emit
- Ticket
- http/commands.ts
- Coordinator
- ControlStore
- scheduler.ts
- features.ts
- jira-time.ts
- scheduled-work.ts
- retrospective-triggers.ts
- offices.ts
- run-retrospective.ts
- goal-reviews.ts
- coordination.ts
- config.ts
- workKey
- .getEffect
- features/workflow.ts
- notifications.ts
- dependencies.ts
- retrospective-subject.ts
- fact-bounds.ts
- .save
- coordination-tick.ts
- weekly-rollup.ts
- checkpoint-completion.ts
- work.ts
- retrospective-facts.ts
- migrations.ts
- assignment-poll.ts
- ServiceHealthPanel.tsx
- office-lessons.ts
- DailyCTO.tsx
- knowledge-context.ts
- command-registry.ts
- session-bridge.ts
- liveReach
- delivery-metrics.ts
- BrainFollowup
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
- `EffectOperation` --references--> `WorkRef`  [EXTRACTED]
  server/store/effects.ts → src/contracts/work.ts
- `projectOutbox()` --calls--> `deferredPickup()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/pickup-state.ts
- `projectOutbox()` --calls--> `parkedProviderWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts
- `projectOutbox()` --calls--> `readinessWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts
- `cecChatPrompt()` --calls--> `timeReport()`  [EXTRACTED]
  server/conversations/prompts/conversations.ts → src/timing/timing.ts

## Import Cycles
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/preparation/post-conflict-preparation.ts -> server/delivery/recovery/preparation/preparation-provider-context.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/queue-repairs.ts -> server/delivery/repairs/ci-admission.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/queue-repairs.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/queue-repairs.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/scheduling/coordination-pump.ts -> server/scheduling/requests.ts -> server/scheduling/coordination.ts -> server/scheduling/coordination-pump.ts`
- 3-file cycle: `server/scheduling/coordination-tick.ts -> server/scheduling/requests.ts -> server/scheduling/coordination.ts -> server/scheduling/coordination-tick.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/implementation/continuation-guard.ts -> server/delivery/recovery/validation/validation-provider-context.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/conversations/conversation-recovery.ts -> server/conversations/conversations.ts -> server/conversations/team-conversation-pump.ts -> server/conversations/conversation-recovery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-publication.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-checkout.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-evidence.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-guard.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-preparation.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/stage-prompts.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/stage-reconciliation.ts -> server/delivery/recovery/implementation/continuation-review-readback.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/preparation/post-conflict-preparation.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts`

## Communities (72 total, 2 thin omitted)

### Community 0 - "publish-pr.ts"
Cohesion: 0.06
Nodes (68): recordCandidateCleanup(), candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute (+60 more)

### Community 1 - "dependency-bots/adopt.ts"
Cohesion: 0.07
Nodes (56): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard, projectCards() (+48 more)

### Community 2 - "engine.ts"
Cohesion: 0.05
Nodes (58): correlatedBuild(), checkMail(), drainMail(), requestMail(), parksInJira(), dispatchNightly(), drainDelivery(), enableNightly() (+50 more)

### Community 3 - "outbox.ts"
Cohesion: 0.05
Nodes (49): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), projectOutbox(), syncOutbox(), partialLocalCleanupKey(), savedAdmissionUnresolved() (+41 more)

### Community 4 - "source-amendment.ts"
Cohesion: 0.06
Nodes (75): deliveryTask(), DeliveryTaskInput, DISCOVERY_GUIDANCE, compactSteps(), adoptCandidate(), reported, Scope, directionContract() (+67 more)

### Community 5 - "artifact"
Cohesion: 0.10
Nodes (61): assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), reconcileCompletedConflictDraft(), routeReadyPostConflictPublication(), verifyInitialDraftConflictPreparation() (+53 more)

### Community 6 - "shared.ts"
Cohesion: 0.07
Nodes (51): ProjectReadiness, Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona (+43 more)

### Community 7 - "Inspector.tsx"
Cohesion: 0.05
Nodes (54): SendMessage, blank(), goalInput, Goals(), CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants (+46 more)

### Community 8 - "agents.ts"
Cohesion: 0.07
Nodes (42): cecPrompt(), resolvedDecisionNote(), stageInstructions, cecChatPrompt(), ctoChatPrompt(), itChatPrompt(), SlackResultSchema, SlackVerificationSchema (+34 more)

### Community 9 - "index.tsx"
Cohesion: 0.09
Nodes (46): labels, LessonsPanel(), when(), GoalList(), ArrowRight, ChevronDown, Send, ButtonProps (+38 more)

### Community 10 - "github-delivery.ts"
Cohesion: 0.08
Nodes (66): containedFile(), findingsBlock(), harnessDelivers(), BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction(), acceptStageResult() (+58 more)

### Community 11 - "OfficeScene.tsx"
Cohesion: 0.07
Nodes (49): Avatar(), AzureWall(), Chair(), Coworker(), CTORoom(), Desk(), Furnishings, Handoff() (+41 more)

### Community 12 - "TicketJob"
Cohesion: 0.08
Nodes (26): dependabotReviewGuidance(), StageContext, GitHubDelivery, checksFailed(), checksPassed(), checksPending(), currentMergeChecks(), pass() (+18 more)

### Community 13 - "requests.ts"
Cohesion: 0.09
Nodes (54): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+46 more)

### Community 14 - "maintenance.ts"
Cohesion: 0.09
Nodes (31): HANDS_OFF_PROJECTS, handsOff(), legacyRecovery(), discover(), refreshDependencies(), routeExisting(), openPullInventory(), maintenancePolicies() (+23 more)

### Community 15 - "digest"
Cohesion: 0.14
Nodes (36): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+28 more)

### Community 16 - "Store"
Cohesion: 0.08
Nodes (16): JiraOperations, plain(), Content, Result, Assessment, applyConnectionSettings(), closeConnection(), optimizeOnOpen() (+8 more)

### Community 17 - "index.ts"
Cohesion: 0.10
Nodes (33): close(), config, itSpecialist, loadedRevision, offices, releaseLock, server, serviceHealth (+25 more)

### Community 18 - "implementation-recovery.ts"
Cohesion: 0.09
Nodes (36): savedActivationFailure(), brainImplementationCandidate(), BrainReadback, digest(), implementationRecoveryCandidate(), Ownership, Readback, recoverBrainImplementation() (+28 more)

### Community 19 - "SettingsPanel.tsx"
Cohesion: 0.15
Nodes (27): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView() (+19 more)

### Community 20 - "conversations/conversations.ts"
Cohesion: 0.13
Nodes (24): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+16 more)

### Community 21 - "approval.ts"
Cohesion: 0.16
Nodes (21): approveFeature(), assertRetainedItems(), commandFeature(), createFeature(), featureById(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges() (+13 more)

### Community 22 - "azure.ts"
Cohesion: 0.10
Nodes (26): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+18 more)

### Community 23 - "scope-repair-resume.ts"
Cohesion: 0.12
Nodes (34): HarnessControl, continuationWorkerProof(), candidateInput(), children, oldAdoptionBasis(), savedCandidateAdmission, Assessment, outsideScanSources() (+26 more)

### Community 24 - "OfficeSnapshot"
Cohesion: 0.10
Nodes (25): FeatureRound, Conversation(), recommendedReply(), FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases (+17 more)

### Community 25 - "work-summary.ts"
Cohesion: 0.13
Nodes (27): Outbox(), themeColor, App(), usePanelFocus(), TicketDetail(), deliveryRepairProjection(), card, InboxQueue() (+19 more)

### Community 27 - "TimeBook.tsx"
Cohesion: 0.13
Nodes (25): LiveAnchor, displayAgentTask(), githubStageLabels, withoutElapsed(), LiveAgentTask(), Props, RunningTask(), text() (+17 more)

### Community 28 - "useOfficePreferences.ts"
Cohesion: 0.11
Nodes (21): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, acceptPreferences(), PreferenceCandidate (+13 more)

### Community 29 - ".transaction"
Cohesion: 0.16
Nodes (14): reviewQuestions(), featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), recoverFeatures(), EvidenceSchema, helperInstallation(), readReview() (+6 more)

### Community 30 - "knowledge.ts"
Cohesion: 0.13
Nodes (21): Accepted, RETROSPECTIVE_HISTORY, Kind, RetrospectiveResult, Stage, KnowledgeRetry, Lesson, LESSON_KINDS (+13 more)

### Community 31 - "park-ticket.ts"
Cohesion: 0.23
Nodes (24): unpack(), BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue(), readIssues() (+16 more)

### Community 32 - ".emit"
Cohesion: 0.17
Nodes (11): reconcileNoticeConfirmations(), comparableSlackText(), SlackMessages, SlackRequestSchema, goalNoticeAuthorized(), sendGoalNotice(), maintenanceNoticeAuthorized(), EffectOperation (+3 more)

### Community 33 - "Ticket"
Cohesion: 0.15
Nodes (13): cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), slackSendPrompt(), slackVerifyPrompt(), PICKUP_CHAT, PickupSchema (+5 more)

### Community 34 - "http/commands.ts"
Cohesion: 0.17
Nodes (20): retryRecipientLookup(), Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership (+12 more)

### Community 35 - "Coordinator"
Cohesion: 0.08
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 36 - "ControlStore"
Cohesion: 0.15
Nodes (6): dailyReviewPrompt(), DailyResultSchema, Briefing, saveReviewBriefing(), ControlStore, DailyCTOReport

### Community 37 - "scheduler.ts"
Cohesion: 0.09
Nodes (19): ROLES, Clock, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch() (+11 more)

### Community 38 - "features.ts"
Cohesion: 0.15
Nodes (19): approvedDelivery(), bindDelivery(), featureEffectGate(), bindFeature(), currentApproval(), enrolled(), featureGate(), predecessorComplete() (+11 more)

### Community 39 - "jira-time.ts"
Cohesion: 0.18
Nodes (16): data(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), captureTime(), midnight() (+8 more)

### Community 40 - "scheduled-work.ts"
Cohesion: 0.17
Nodes (18): deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), deterministicActions, eligible() (+10 more)

### Community 41 - "retrospective-triggers.ts"
Cohesion: 0.20
Nodes (19): clip(), JobLike, recordCIBudget(), recordParked(), recordRepairBudget(), recordTicketParked(), recordTrigger(), subjectOf() (+11 more)

### Community 42 - "offices.ts"
Cohesion: 0.19
Nodes (14): DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewDate(), reviewWeekday(), EASTERN, easternDay(), easternDayFormatter (+6 more)

### Community 44 - "run-retrospective.ts"
Cohesion: 0.18
Nodes (18): busyMaintenanceIds(), retrospectivePrompt(), SUBJECT, RetrospectiveResultSchema, findSubject(), jobSubject(), triggerJobId(), harperFolder() (+10 more)

### Community 45 - "goal-reviews.ts"
Cohesion: 0.14
Nodes (16): applyGoalReview(), EvidenceRefSchema, FreshDailyResultSchema, statusAllowed(), workEvidence(), GoalInput, saveGoal(), queueGoalNotice() (+8 more)

### Community 46 - "coordination.ts"
Cohesion: 0.18
Nodes (18): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation(), checkpointWindow(), dueAt() (+10 more)

### Community 47 - "config.ts"
Cohesion: 0.13
Nodes (14): args, [cmd,...rawArgs], commands, key, projectIndex, CEC, DATA, LOCAL_BINDINGS (+6 more)

### Community 48 - "workKey"
Cohesion: 0.23
Nodes (17): completedPRReviews(), dependencyVersion(), handoffSavedPrerequisites(), hasSavedPrerequisiteResult(), Ownership, qualified(), readDependencies(), requireSavedPrerequisites() (+9 more)

### Community 49 - ".getEffect"
Cohesion: 0.26
Nodes (7): GitHubOperations, fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), closeNativeRefresh(), fingerprint(), EffectIntent

### Community 50 - "features/workflow.ts"
Cohesion: 0.18
Nodes (19): discoveryPrompt(), planPrompt(), document(), featureRoot(), DiscoverySchema, identity, manifestFromPlan(), ManifestSchema (+11 more)

### Community 51 - "notifications.ts"
Cohesion: 0.19
Nodes (15): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR (+7 more)

### Community 52 - "dependencies.ts"
Cohesion: 0.30
Nodes (14): Admission, admit(), IntakeContext, compatible(), dependencyCompletionKey(), dependencyEligibility(), DependencyStores, issueKey() (+6 more)

### Community 53 - "retrospective-subject.ts"
Cohesion: 0.20
Nodes (15): maintenanceSubject(), MaintenanceSubjectFacts, maintenanceKey(), azurePrUrl(), RetrospectiveSubject, SubjectStepResult, ticketSubject(), CIRepair (+7 more)

### Community 54 - "fact-bounds.ts"
Cohesion: 0.26
Nodes (15): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+7 more)

### Community 55 - ".save"
Cohesion: 0.20
Nodes (8): file, folder, logs, root, xml(), MergeNotifications, ProjectProgress, sendMaintenanceNotice()

### Community 56 - "coordination-tick.ts"
Cohesion: 0.22
Nodes (12): PrerequisitesSchema, legacy, reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION, tick(), incompleteReadOutput() (+4 more)

### Community 57 - "weekly-rollup.ts"
Cohesion: 0.24
Nodes (14): RollupResult, RollupResultSchema, ineffectiveLessons(), lastFriday(), ROLLUP_HISTORY, rollupDue(), RollupHooks, rollupPrompt() (+6 more)

### Community 58 - "checkpoint-completion.ts"
Cohesion: 0.20
Nodes (10): BrainStatusSchema, identity, parseBrainStatus(), brainCheckpointCompletion(), coverageSchema, followupSchema, verified, reconcileCompletedCheckpoints() (+2 more)

### Community 59 - "work.ts"
Cohesion: 0.13
Nodes (14): TimeLedgerState, AssignmentResult, CompletionCondition, Continuation, DependencyObservation, EligibilityState, FailureCategory, ProgressionItem (+6 more)

### Community 60 - "retrospective-facts.ts"
Cohesion: 0.23
Nodes (11): ARTIFACT_LIMIT, clip(), LEDGER_STEPS, MAINTENANCE_LIMIT, maintenanceFacts(), MaintenancePacketSection, clip(), PACKET_LIMIT (+3 more)

### Community 61 - "migrations.ts"
Cohesion: 0.20
Nodes (14): clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates(), maintenanceCompletedId(), visibleMaintenanceTriggerIds(), TerminalCandidate, seedProjectLessons() (+6 more)

### Community 62 - "assignment-poll.ts"
Cohesion: 0.31
Nodes (9): noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), admitReadyCards(), WAIT_STATUSES, pinCourier, resumeParked(), poll() (+1 more)

### Community 63 - "ServiceHealthPanel.tsx"
Cohesion: 0.24
Nodes (9): DailyCTOSummary, itAgent(), itDiagnostics(), currentServices(), ServiceHealthPanel(), ServiceHealthRow(), HealthReport, HeartPulse (+1 more)

### Community 64 - "office-lessons.ts"
Cohesion: 0.32
Nodes (9): acceptRetrospective(), normalizeStatement(), decideOfficeProposal(), mirrorOfficeKnowledge(), now(), OfficeKnowledgeStore, proposeOfficeLessons(), retireOfficeLesson() (+1 more)

### Community 65 - "DailyCTO.tsx"
Cohesion: 0.26
Nodes (8): CTOReview(), goalState, DailyCTO(), GoalHistory(), reportDate(), reviewStatus, reviewExcerpt(), ReviewText()

### Community 66 - "knowledge-context.ts"
Cohesion: 0.24
Nodes (10): Bucket, knowledgeContext(), LESSON_LIMIT, lessonPurpose(), MAINTENANCE, MAX_LESSONS, PURPOSES, render() (+2 more)

### Community 67 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 68 - "session-bridge.ts"
Cohesion: 0.33
Nodes (8): claudeSessions(), codexSessions(), desktopSessions(), guardianReview(), LiveSession, loadedCodexSession(), openRollouts(), SessionInventory

### Community 70 - "liveReach"
Cohesion: 0.60
Nodes (5): GIT_NETWORK, LIVE_PROVIDERS, liveReach(), networkUrl(), remoteUrls()

### Community 71 - "delivery-metrics.ts"
Cohesion: 0.50
Nodes (3): deliveryMetrics(), median(), DeliveryMetrics

## Knowledge Gaps
- **289 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+284 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `publish-pr.ts`, `dependency-bots/adopt.ts`, `engine.ts`, `outbox.ts`, `source-amendment.ts`, `artifact`, `agents.ts`, `github-delivery.ts`, `TicketJob`, `requests.ts`, `maintenance.ts`, `digest`, `implementation-recovery.ts`, `conversations/conversations.ts`, `approval.ts`, `azure.ts`, `scope-repair-resume.ts`, `OfficeSnapshot`, `.transaction`, `knowledge.ts`, `park-ticket.ts`, `.emit`, `Ticket`, `http/commands.ts`, `scheduler.ts`, `features.ts`, `jira-time.ts`, `scheduled-work.ts`, `retrospective-triggers.ts`, `offices.ts`, `run-retrospective.ts`, `goal-reviews.ts`, `coordination.ts`, `workKey`, `.getEffect`, `features/workflow.ts`, `notifications.ts`, `dependencies.ts`, `retrospective-subject.ts`, `.save`, `coordination-tick.ts`, `weekly-rollup.ts`, `checkpoint-completion.ts`, `retrospective-facts.ts`, `office-lessons.ts`, `knowledge-context.ts`, `session-bridge.ts`, `delivery-metrics.ts`?**
  _High betweenness centrality (0.110) - this node is a cross-community bridge._
- **Why does `Engine` connect `engine.ts` to `Ticket`, `scheduled-work.ts`, `github-delivery.ts`, `offices.ts`, `TicketJob`, `requests.ts`, `coordination.ts`, `maintenance.ts`, `Store`, `features/workflow.ts`, `notifications.ts`, `conversations/conversations.ts`, `azure.ts`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `command()` connect `Store` to `publish-pr.ts`, `dependency-bots/adopt.ts`, `engine.ts`, `outbox.ts`, `agents.ts`, `github-delivery.ts`, `TicketJob`, `requests.ts`, `maintenance.ts`, `implementation-recovery.ts`, `approval.ts`, `azure.ts`, `.transaction`, `park-ticket.ts`, `jira-time.ts`, `scheduled-work.ts`, `coordination.ts`, `.getEffect`, `features/workflow.ts`, `notifications.ts`, `dependencies.ts`, `command-registry.ts`, `session-bridge.ts`, `liveReach`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `command()` (e.g. with `.constructor()` and `executeRequest()`) actually correct?**
  _`command()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _289 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `publish-pr.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05570175438596491 - nodes in this community are weakly interconnected._
- **Should `dependency-bots/adopt.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06932052161976665 - nodes in this community are weakly interconnected._