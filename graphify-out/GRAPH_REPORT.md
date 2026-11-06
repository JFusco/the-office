# Graph Report - the-office-sqlite-hygiene  (2026-11-06)

## Corpus Check
- 376 files · ~191,361 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2265 nodes · 9704 edges · 85 communities (81 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 48 edges (avg confidence: 0.74)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bd54a410`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- OfficeScene.tsx
- source-amendment.ts
- store.ts
- index.tsx
- cec/workflow.ts
- .save
- config.ts
- Engine
- Inspector.tsx
- worker-runtime.ts
- dependency-bots/adopt.ts
- digest
- run-ci-repair.ts
- shared.ts
- activation-recovery.ts
- accept-stage-result.ts
- index.ts
- conversations/conversations.ts
- record-trigger.ts
- .emit
- SettingsPanel.tsx
- engine.ts
- scope-repair-resume.ts
- remove-candidate.ts
- discovery-recovery.ts
- cx
- azure.ts
- assignment-poll.ts
- github-delivery.ts
- TeamMessage
- Coordinator
- scheduler.ts
- delivery-repairs.ts
- SlackMessages
- features/workflow.ts
- coordination.ts
- dependencies.ts
- github-check-selection.ts
- daily-cto.ts
- FeatureWorkspace.tsx
- StageResult
- GitHubMonitor
- fact-bounds.ts
- .getEffect
- TicketJob
- service-health.ts
- Ticket
- knowledge.ts
- accept-retrospective.ts
- TimeBook.tsx
- delivery-binding.ts
- publish-pr.ts
- scheduled-work.ts
- run-retrospective.ts
- office-lessons.ts
- preferences-store.ts
- observe-prs.ts
- weekly-rollup.ts
- coordination-tick.ts
- workKey
- session-bridge.ts
- Conversations
- features.ts
- maintenance.ts
- DailyCTO.tsx
- retrospective-subject.ts
- diagnostic-context.ts
- offices.ts
- command-registry.ts
- agents.ts
- prompts/conversations.ts
- artifact
- Role
- GitHubDelivery
- http/commands.ts
- knowledge-context.ts
- helper-evidence.py
- ProjectProgress
- Store
- create-candidate.ts
- OfficeConfigView.tsx
- .followup
- liveReach
- reconcile-mailbox.ts

## God Nodes (most connected - your core abstractions)
1. `Store` - 215 edges
2. `GitHubDelivery` - 110 edges
3. `TicketJob` - 110 edges
4. `artifact()` - 85 edges
5. `command()` - 85 edges
6. `digest()` - 82 edges
7. `workKey()` - 68 edges
8. `StageResult` - 63 edges
9. `cx()` - 63 edges
10. `OfficeSnapshot` - 55 edges

## Surprising Connections (you probably didn't know these)
- `projectOutbox()` --calls--> `parkedProviderWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts
- `projectOutbox()` --calls--> `readinessWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts
- `cecChatPrompt()` --calls--> `timeReport()`  [EXTRACTED]
  server/conversations/prompts/conversations.ts → src/timing/timing.ts
- `pump()` --calls--> `deferredPickup()`  [EXTRACTED]
  server/conversations/team-conversation-pump.ts → src/work/pickup-state.ts
- `IntakeContext` --references--> `Coordination`  [EXTRACTED]
  server/delivery/intake/admission.ts → src/shared.ts

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

## Communities (85 total, 4 thin omitted)

### Community 0 - "OfficeScene.tsx"
Cohesion: 0.06
Nodes (53): displayAgentTask(), withoutElapsed(), LiveAgentTask(), Props, RunningTask(), text(), Avatar(), AzureWall() (+45 more)

### Community 1 - "source-amendment.ts"
Cohesion: 0.06
Nodes (72): deliveryTask(), DeliveryTaskInput, DISCOVERY_GUIDANCE, adoptCandidate(), reported, Scope, approvedText(), assert() (+64 more)

### Community 2 - "store.ts"
Cohesion: 0.13
Nodes (16): goalNoticeAuthorized(), sendGoalNotice(), Clock, systemClock, applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration (+8 more)

### Community 3 - "index.tsx"
Cohesion: 0.09
Nodes (44): labels, ServiceHealthRow(), LessonsPanel(), when(), ArrowRight, ChevronDown, Send, Button (+36 more)

### Community 4 - "cec/workflow.ts"
Cohesion: 0.23
Nodes (21): run(), advance(), nextStage(), publicationEvidenceGap(), qaEvidenceGap(), resultGate(), stageResultGap(), afterDraft() (+13 more)

### Community 5 - ".save"
Cohesion: 0.22
Nodes (25): unpack(), BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue(), readIssues() (+17 more)

### Community 6 - "config.ts"
Cohesion: 0.14
Nodes (37): allowed, continuationNativeReview(), continuationWorkerProof(), negativeWorker(), savedNegativeContinuationReview(), candidateInput(), children, oldAdoptionBasis() (+29 more)

### Community 7 - "Engine"
Cohesion: 0.10
Nodes (6): AzureMonitor, correlatedBuild(), Engine, observe(), observeParked(), parkedReadError

### Community 8 - "Inspector.tsx"
Cohesion: 0.06
Nodes (50): SendMessage, GoalList(), blank(), goalInput, Goals(), themeColor, CONNECTION, CONNECTION_DOT (+42 more)

### Community 9 - "worker-runtime.ts"
Cohesion: 0.14
Nodes (13): SlackResultSchema, SlackVerificationSchema, labels, toolActivity(), workerActivity(), claudeArguments(), ClaudeStream, DEVELOPER_EFFORT (+5 more)

### Community 10 - "dependency-bots/adopt.ts"
Cohesion: 0.06
Nodes (56): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard, projectCards() (+48 more)

### Community 11 - "digest"
Cohesion: 0.09
Nodes (56): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+48 more)

### Community 12 - "run-ci-repair.ts"
Cohesion: 0.26
Nodes (12): ciCheckout(), verifyCIHooks(), CIFailure, guardCIRepair(), prepareCIMetadataRepair(), publishCIRepair(), rewordCommits(), CIPlanSchema (+4 more)

### Community 13 - "shared.ts"
Cohesion: 0.09
Nodes (35): conversationResolved(), projectOutbox(), syncOutbox(), knowledgeOutbox(), checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), checkpointSuperseded() (+27 more)

### Community 14 - "activation-recovery.ts"
Cohesion: 0.22
Nodes (23): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+15 more)

### Community 15 - "accept-stage-result.ts"
Cohesion: 0.14
Nodes (30): acceptStageResult(), recordJobApproach(), mergeAuthorized(), continuationReviewArtifacts(), discoveryReviewSatisfied(), ContinuationDecision, implementationContinuationDecision(), negativeTechnicalReview() (+22 more)

### Community 16 - "index.ts"
Cohesion: 0.08
Nodes (38): args, [cmd,...rawArgs], commands, key, projectIndex, close(), config, itSpecialist (+30 more)

### Community 17 - "conversations/conversations.ts"
Cohesion: 0.14
Nodes (25): assertConversationReadback(), ConversationResultSchema, GoalChangeSchema, MessageInput, pumpCTO(), queueCTOHandoff(), saveGoals(), pumpIT() (+17 more)

### Community 18 - "record-trigger.ts"
Cohesion: 0.16
Nodes (22): clip(), JobLike, recordCIBudget(), recordParked(), recordRepairBudget(), recordTicketParked(), recordTrigger(), subjectOf() (+14 more)

### Community 19 - ".emit"
Cohesion: 0.11
Nodes (12): featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), beginReader(), recoverFeatures(), reconcileNativeDelivery(), checkpointMeasurement(), HEARTBEAT_GAP_MS (+4 more)

### Community 20 - "SettingsPanel.tsx"
Cohesion: 0.12
Nodes (31): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS, PickupForm(), acceptPreferences() (+23 more)

### Community 21 - "engine.ts"
Cohesion: 0.23
Nodes (15): checkMail(), drainMail(), requestMail(), dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), resume() (+7 more)

### Community 22 - "scope-repair-resume.ts"
Cohesion: 0.16
Nodes (29): containedFile(), Assessment, outsideScanSources(), Ownership, reconcileScopeRepairReadback(), requireThat(), scopeRepairReadbackCandidate(), scopeRepairRequestResolved() (+21 more)

### Community 23 - "remove-candidate.ts"
Cohesion: 0.20
Nodes (16): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+8 more)

### Community 24 - "discovery-recovery.ts"
Cohesion: 0.29
Nodes (10): Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership, rawHash() (+2 more)

### Community 25 - "cx"
Cohesion: 0.12
Nodes (33): Outbox(), App(), EvidenceCard(), Inspector(), TicketDetail(), TicketHeading(), RoomLabel(), cx() (+25 more)

### Community 26 - "azure.ts"
Cohesion: 0.13
Nodes (23): az(), base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs(), githubPRDescription() (+15 more)

### Community 27 - "assignment-poll.ts"
Cohesion: 0.14
Nodes (19): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), configureNotices(), Identity, MergeNotifications (+11 more)

### Community 28 - "github-delivery.ts"
Cohesion: 0.13
Nodes (33): findingsBlock(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery(), discover(), refreshDependencies(), routeExisting() (+25 more)

### Community 29 - "TeamMessage"
Cohesion: 0.15
Nodes (21): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), ReplySchema, partialLocalCleanupKey(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved() (+13 more)

### Community 31 - "scheduler.ts"
Cohesion: 0.23
Nodes (7): fifo(), ScheduledWork, Scheduler, selectWork(), withAssignment(), ProgressionItem, QueueTiming

### Community 32 - "delivery-repairs.ts"
Cohesion: 0.31
Nodes (12): namedRepairIds(), amendmentRepairView(), approachFingerprint(), enqueueRepairDiagnosis(), githubRepairEligible(), jiraRepairable(), repairFindingIds(), reserveRepair() (+4 more)

### Community 33 - "SlackMessages"
Cohesion: 0.31
Nodes (4): comparableSlackText(), SlackMessages, SlackRequestSchema, SlackDelivery

### Community 34 - "features/workflow.ts"
Cohesion: 0.11
Nodes (40): approveFeature(), assertRetainedItems(), commandFeature(), createFeature(), featureById(), mutation(), reviewQuestions(), discoveryPrompt() (+32 more)

### Community 35 - "coordination.ts"
Cohesion: 0.14
Nodes (22): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), legacy, validateNativeContinuation(), checkpointWindow() (+14 more)

### Community 36 - "dependencies.ts"
Cohesion: 0.22
Nodes (15): Admission, admit(), IntakeContext, compatible(), dependencyCompletionKey(), dependencyEligibility(), DependencyStores, issueKey() (+7 more)

### Community 37 - "github-check-selection.ts"
Cohesion: 0.21
Nodes (18): checksFailed(), checksPassed(), checksPending(), CurrentChecksWait, currentMergeChecks(), pass(), pending(), requireThat() (+10 more)

### Community 38 - "daily-cto.ts"
Cohesion: 0.05
Nodes (44): DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), dailyReviewDate(), reviewWeekday(), applyGoalReview(), DailyResultSchema (+36 more)

### Community 39 - "FeatureWorkspace.tsx"
Cohesion: 0.17
Nodes (16): FeatureRound, FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures(), draftKey() (+8 more)

### Community 40 - "StageResult"
Cohesion: 0.19
Nodes (19): parksInJira(), harnessCloseout(), PASSING, verifyMergeActions(), activeEffectId(), harnessEffect, assertMayMutate(), runHarnessStage() (+11 more)

### Community 42 - "fact-bounds.ts"
Cohesion: 0.26
Nodes (15): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+7 more)

### Community 43 - ".getEffect"
Cohesion: 0.25
Nodes (8): publishFeature(), GitHubOperations, fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), closeNativeRefresh(), fingerprint(), EffectIntent

### Community 44 - "TicketJob"
Cohesion: 0.13
Nodes (9): BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction(), dependabotReviewGuidance(), stagePrompt(), StagePromptInput, implementationContinuationInstruction() (+1 more)

### Community 45 - "service-health.ts"
Cohesion: 0.17
Nodes (10): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, slackHealth() (+2 more)

### Community 46 - "Ticket"
Cohesion: 0.21
Nodes (7): cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), Agents, WorkerRuntime, Ticket

### Community 47 - "knowledge.ts"
Cohesion: 0.15
Nodes (20): Kind, Stage, KnowledgeRetry, KnowledgeState, Lesson, LESSON_KINDS, LESSON_STAGES, LessonKind (+12 more)

### Community 48 - "accept-retrospective.ts"
Cohesion: 0.23
Nodes (10): Accepted, acceptRetrospective(), normalizeStatement(), RETROSPECTIVE_HISTORY, clip(), PACKET_LIMIT, retrospectiveFacts(), RetrospectivePacket (+2 more)

### Community 49 - "TimeBook.tsx"
Cohesion: 0.13
Nodes (24): goalNoticeNeverDispatched(), recover(), OFFICE_CAST, PARTY_DURATION, secretPhrase(), useOfficeEasterEggs(), AzureBuild, ROLE_NAMES (+16 more)

### Community 50 - "delivery-binding.ts"
Cohesion: 0.22
Nodes (14): approvedDelivery(), bindDelivery(), featureEffectGate(), assertFeatureGate(), bindFeature(), currentApproval(), enrolled(), featureGate() (+6 more)

### Community 51 - "publish-pr.ts"
Cohesion: 0.24
Nodes (13): retryRead(), developerPRContent(), Execute, lintPRContent(), officePRContent(), prContent, assertCandidate(), Candidate (+5 more)

### Community 52 - "scheduled-work.ts"
Cohesion: 0.22
Nodes (13): withAmendmentOwnership(), deterministicActions, eligible(), scheduledWork(), withActiveClaims(), timeLedger(), TimeLedger, dueReadback() (+5 more)

### Community 53 - "run-retrospective.ts"
Cohesion: 0.27
Nodes (12): retrospectivePrompt(), RetrospectiveResultSchema, terminalCandidates(), triggerJobId(), KnowledgeRunner, KnowledgeRunOptions, RETROSPECTIVE_TIMEOUT, RetrospectiveRunner (+4 more)

### Community 54 - "office-lessons.ts"
Cohesion: 0.35
Nodes (6): decideOfficeProposal(), now(), OfficeKnowledgeStore, proposeOfficeLessons(), retireOfficeLesson(), OfficeKnowledge

### Community 55 - "preferences-store.ts"
Cohesion: 0.18
Nodes (11): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, SettingsPanel() (+3 more)

### Community 56 - "observe-prs.ts"
Cohesion: 0.30
Nodes (10): observe(), completedPRReviews(), eligible(), mergedByOwner(), ownerSettles(), retireExternalDeliveries(), retireInactiveDeliveries(), retireUnstartedDelivery() (+2 more)

### Community 57 - "weekly-rollup.ts"
Cohesion: 0.23
Nodes (15): RollupResult, RollupResultSchema, harperFolder(), retryDelay(), ineffectiveLessons(), lastFriday(), ROLLUP_HISTORY, rollupDue() (+7 more)

### Community 58 - "coordination-tick.ts"
Cohesion: 0.17
Nodes (16): reconcileNoticeConfirmations(), PrerequisitesSchema, brainCheckpointCompletion(), reconcileCompletedCheckpoints(), reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION (+8 more)

### Community 59 - "workKey"
Cohesion: 0.09
Nodes (38): advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat(), continuationScope(), continuationGuard(), reconcileContinuationReview() (+30 more)

### Community 60 - "session-bridge.ts"
Cohesion: 0.33
Nodes (8): claudeSessions(), codexSessions(), desktopSessions(), guardianReview(), LiveSession, loadedCodexSession(), openRollouts(), SessionInventory

### Community 62 - "features.ts"
Cohesion: 0.13
Nodes (16): assertFeatureDependencyOrder(), featureDependencyEdges(), key(), Content, reserveIdentity(), EffectUncertainError, FeatureApproval, FeatureAttempt (+8 more)

### Community 63 - "maintenance.ts"
Cohesion: 0.12
Nodes (21): maintenancePolicies(), BrainMaintenance, BrainResult, BrainStatusSchema, identity, parseBrainStatus(), coverageSchema, followupSchema (+13 more)

### Community 64 - "DailyCTO.tsx"
Cohesion: 0.26
Nodes (8): CTOReview(), goalState, DailyCTO(), GoalHistory(), reportDate(), reviewStatus, reviewExcerpt(), ReviewText()

### Community 65 - "retrospective-subject.ts"
Cohesion: 0.23
Nodes (12): deliveryMetrics(), median(), azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject, ticketSubject(), DeliveryMetrics (+4 more)

### Community 66 - "diagnostic-context.ts"
Cohesion: 0.36
Nodes (6): diagnosticContext(), itAgent(), itDiagnostics(), currentServices(), ServiceHealthPanel(), ITDesk()

### Community 67 - "offices.ts"
Cohesion: 0.16
Nodes (10): mirrorOfficeKnowledge(), LOCAL_BINDINGS, file, project, root, officeCapacity, projectById(), projectData() (+2 more)

### Community 68 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 69 - "agents.ts"
Cohesion: 0.16
Nodes (15): cecPrompt(), resolvedDecisionNote(), stageInstructions, HANDS_OFF_RESOLUTION_GUIDANCE, RESOLUTION_GUIDANCE, reviewInstructions(), REPAIR_DIAGNOSIS, GOAL_REPORT_GUIDANCE (+7 more)

### Community 70 - "prompts/conversations.ts"
Cohesion: 0.20
Nodes (10): cecChatPrompt(), ctoChatPrompt(), itChatPrompt(), slackSendPrompt(), slackVerifyPrompt(), PICKUP_CHAT, PickupSchema, savePickup() (+2 more)

### Community 71 - "artifact"
Cohesion: 0.11
Nodes (38): resumeReviewedMerge(), closeoutRequestResolved(), assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), reconcileCompletedConflictDraft() (+30 more)

### Community 72 - "Role"
Cohesion: 0.15
Nodes (13): StageContext, assertWorkerLane(), AssignmentResult, CompletionCondition, DependencyObservation, EligibilityState, ExecutionLane, FailureCategory (+5 more)

### Community 73 - "GitHubDelivery"
Cohesion: 0.14
Nodes (17): GitHubDelivery, implementationRecoveryCandidate(), recoverImplementation(), postConflictReadbackCandidate(), preparationReadbackCandidate(), reconcilePreparationReadback(), guard(), providerFacts() (+9 more)

### Community 74 - "http/commands.ts"
Cohesion: 0.21
Nodes (17): retryRecipientLookup(), configureKnowledge(), declineLessonIssue(), reactivateLesson(), retireLesson(), configureGoalNotices(), Settings, reconcileGoalReportCommand() (+9 more)

### Community 75 - "knowledge-context.ts"
Cohesion: 0.24
Nodes (9): Bucket, knowledgeContext(), LESSON_LIMIT, lessonPurpose(), MAX_LESSONS, PURPOSES, render(), SECTION_LIMIT (+1 more)

### Community 78 - "ProjectProgress"
Cohesion: 0.27
Nodes (6): file, folder, logs, root, xml(), ProjectProgress

### Community 79 - "Store"
Cohesion: 0.11
Nodes (8): JiraOperations, plain(), Result, Assessment, Store, command(), workerFailure(), OfficeEvent

### Community 80 - "create-candidate.ts"
Cohesion: 0.48
Nodes (6): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf()

### Community 81 - "OfficeConfigView.tsx"
Cohesion: 0.48
Nodes (5): loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView(), OfficeConfigSummary

### Community 82 - ".followup"
Cohesion: 0.40
Nodes (4): canFileGithubIssue(), githubFollowupPrompt(), knowledgeChatPrompt(), goalReportContext()

### Community 83 - "liveReach"
Cohesion: 0.60
Nodes (5): GIT_NETWORK, LIVE_PROVIDERS, liveReach(), networkUrl(), remoteUrls()

### Community 84 - "reconcile-mailbox.ts"
Cohesion: 0.67
Nodes (3): MISSING_INTAKE, reconcileMailbox(), unusedMailbox()

## Knowledge Gaps
- **271 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+266 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `source-amendment.ts`, `store.ts`, `cec/workflow.ts`, `.save`, `config.ts`, `Engine`, `worker-runtime.ts`, `dependency-bots/adopt.ts`, `digest`, `shared.ts`, `activation-recovery.ts`, `accept-stage-result.ts`, `conversations/conversations.ts`, `record-trigger.ts`, `.emit`, `engine.ts`, `scope-repair-resume.ts`, `remove-candidate.ts`, `discovery-recovery.ts`, `azure.ts`, `assignment-poll.ts`, `github-delivery.ts`, `TeamMessage`, `scheduler.ts`, `delivery-repairs.ts`, `SlackMessages`, `features/workflow.ts`, `coordination.ts`, `dependencies.ts`, `daily-cto.ts`, `StageResult`, `.getEffect`, `TicketJob`, `Ticket`, `accept-retrospective.ts`, `TimeBook.tsx`, `delivery-binding.ts`, `publish-pr.ts`, `scheduled-work.ts`, `run-retrospective.ts`, `office-lessons.ts`, `observe-prs.ts`, `weekly-rollup.ts`, `coordination-tick.ts`, `workKey`, `session-bridge.ts`, `Conversations`, `features.ts`, `maintenance.ts`, `retrospective-subject.ts`, `diagnostic-context.ts`, `offices.ts`, `agents.ts`, `prompts/conversations.ts`, `artifact`, `Role`, `GitHubDelivery`, `http/commands.ts`, `knowledge-context.ts`, `create-candidate.ts`?**
  _High betweenness centrality (0.114) - this node is a cross-community bridge._
- **Why does `Engine` connect `Engine` to `features/workflow.ts`, `coordination.ts`, `cec/workflow.ts`, `offices.ts`, `GitHubMonitor`, `GitHubDelivery`, `Ticket`, `Store`, `conversations/conversations.ts`, `scheduled-work.ts`, `engine.ts`, `assignment-poll.ts`, `github-delivery.ts`, `Conversations`, `maintenance.ts`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `TicketJob` connect `TicketJob` to `source-amendment.ts`, `index.tsx`, `cec/workflow.ts`, `config.ts`, `dependency-bots/adopt.ts`, `digest`, `run-ci-repair.ts`, `shared.ts`, `activation-recovery.ts`, `accept-stage-result.ts`, `record-trigger.ts`, `.emit`, `scope-repair-resume.ts`, `remove-candidate.ts`, `discovery-recovery.ts`, `cx`, `github-delivery.ts`, `TeamMessage`, `scheduler.ts`, `delivery-repairs.ts`, `dependencies.ts`, `github-check-selection.ts`, `StageResult`, `fact-bounds.ts`, `delivery-binding.ts`, `publish-pr.ts`, `observe-prs.ts`, `workKey`, `retrospective-subject.ts`, `artifact`, `Role`, `ProjectProgress`, `Store`, `create-candidate.ts`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `command()` (e.g. with `.constructor()` and `executeRequest()`) actually correct?**
  _`command()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _271 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `OfficeScene.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06448412698412699 - nodes in this community are weakly interconnected._
- **Should `source-amendment.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.060759493670886074 - nodes in this community are weakly interconnected._