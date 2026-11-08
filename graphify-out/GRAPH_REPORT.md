# Graph Report - the-office  (2026-11-08)

## Corpus Check
- 472 files · ~224,731 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2732 nodes · 11421 edges · 78 communities (75 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 64 edges (avg confidence: 0.74)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d8daa69a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- remove-candidate.ts
- GitHubDelivery
- continuation-evidence.ts
- useOfficePreferences.ts
- source-amendment.ts
- github-check-selection.ts
- PeoplePanel.tsx
- App.tsx
- cost-ledger.ts
- Inspector.tsx
- github-delivery.ts
- OfficeScene.tsx
- TicketJob
- requests.ts
- maintenance.ts
- telemetry.ts
- useLiveTiming.ts
- index.ts
- WorkTime
- SettingsPanel.tsx
- conversations/conversations.ts
- cost-entries.ts
- azure.ts
- scope-repair-readback.ts
- retire-external-delivery.ts
- work-summary.ts
- scheduled-work.ts
- TelemetryPanel.tsx
- StageResult
- retrospective-subject.ts
- knowledge.ts
- .save
- workKey
- agents.ts
- merge-summary.ts
- Coordinator
- daily-cto.ts
- OfficeSnapshot
- engine.ts
- time-scope.ts
- BrainFollowup
- run-accounting.ts
- accept-stage-result.ts
- coordination.ts
- Agents
- process.ts
- .transaction
- dependencies.ts
- assignment-poll.ts
- outbox.ts
- Role
- weekly-rollup.ts
- Store
- jira-time.ts
- run.ts
- knowledge-context.ts
- session-bridge.ts
- office-lessons.ts
- artifact
- validate-stage.ts
- helper-evidence.py
- work.ts
- .emit
- coordination-tick.ts
- owned-artifact.ts
- checkpoint-completion.ts
- retrospective-triggers.ts
- project-progress.ts
- digest
- shared.ts
- run-ci-repair.ts
- helper-usage.ts
- codex-rollout.ts
- cli.ts
- slack-supersession.ts
- run-usage.ts
- codex-rollout-file.ts

## God Nodes (most connected - your core abstractions)
1. `Store` - 248 edges
2. `TicketJob` - 117 edges
3. `GitHubDelivery` - 112 edges
4. `command()` - 90 edges
5. `artifact()` - 85 edges
6. `digest()` - 82 edges
7. `cx()` - 77 edges
8. `workKey()` - 73 edges
9. `OfficeSnapshot` - 66 edges
10. `StageResult` - 63 edges

## Surprising Connections (you probably didn't know these)
- `readAzurePRs()` --indirect_call--> `row()`  [INFERRED]
  server/cec/observed-prs.ts → src/telemetry/report.ts
- `rows()` --indirect_call--> `row()`  [INFERRED]
  server/delivery/recovery/source-amendment/source-amendment-held.ts → src/telemetry/report.ts
- `proveOutsideAmendmentUnchanged()` --indirect_call--> `row()`  [INFERRED]
  server/delivery/recovery/source-amendment/source-amendment-held.ts → src/telemetry/report.ts
- `rows()` --indirect_call--> `row()`  [INFERRED]
  server/delivery/recovery/source-amendment/source-amendment-scope.ts → src/telemetry/report.ts
- `tree()` --indirect_call--> `row()`  [INFERRED]
  server/features/planning-baseline.ts → src/telemetry/report.ts

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

## Communities (78 total, 3 thin omitted)

### Community 0 - "remove-candidate.ts"
Cohesion: 0.20
Nodes (16): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+8 more)

### Community 1 - "GitHubDelivery"
Cohesion: 0.14
Nodes (11): GitHubDelivery, resumeReviewedMerge(), advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat(), providerFacts() (+3 more)

### Community 2 - "continuation-evidence.ts"
Cohesion: 0.10
Nodes (42): allowed, continuationArtifacts(), continuationNativeReview(), continuationReviewArtifacts(), continuationWorkerProof(), negativeWorker(), reconcileContinuationReview(), savedNegativeContinuationReview() (+34 more)

### Community 3 - "useOfficePreferences.ts"
Cohesion: 0.11
Nodes (20): PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, acceptPreferences(), PreferenceCandidate, PreferenceState (+12 more)

### Community 4 - "source-amendment.ts"
Cohesion: 0.06
Nodes (73): deliveryTask(), DeliveryTaskInput, DISCOVERY_GUIDANCE, stagePrompt(), StagePromptInput, adoptCandidate(), reported, Scope (+65 more)

### Community 5 - "github-check-selection.ts"
Cohesion: 0.21
Nodes (18): checksFailed(), checksPassed(), checksPending(), CurrentChecksWait, currentMergeChecks(), pass(), pending(), requireThat() (+10 more)

### Community 6 - "PeoplePanel.tsx"
Cohesion: 0.11
Nodes (37): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+29 more)

### Community 7 - "App.tsx"
Cohesion: 0.06
Nodes (42): CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants, ElevatorPhase, floorVariants, leftDoor, OfficeScene (+34 more)

### Community 8 - "cost-ledger.ts"
Cohesion: 0.17
Nodes (23): costLedger(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress(), effectId(), OutsideEdit, publishCost() (+15 more)

### Community 9 - "Inspector.tsx"
Cohesion: 0.07
Nodes (70): Conversation(), Outbox(), slackMessageStatus(), SlackDeliveryCard(), labels, LessonsPanel(), when(), GoalList() (+62 more)

### Community 10 - "github-delivery.ts"
Cohesion: 0.10
Nodes (40): findingsBlock(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery(), BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE (+32 more)

### Community 11 - "OfficeScene.tsx"
Cohesion: 0.06
Nodes (56): displayAgentTask(), githubStageLabels, withoutElapsed(), LiveAgentTask(), Props, RunningTask(), text(), Avatar() (+48 more)

### Community 12 - "TicketJob"
Cohesion: 0.16
Nodes (8): dependabotReviewGuidance(), StageContext, stageRole(), implementationContinuationInstruction(), retireInactiveDeliveries(), retireUnstartedDelivery(), unstartedDelivery(), TicketJob

### Community 13 - "requests.ts"
Cohesion: 0.11
Nodes (47): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+39 more)

### Community 14 - "maintenance.ts"
Cohesion: 0.09
Nodes (30): ApproachSchema, maintenancePolicies(), reconcileNativeDelivery(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice() (+22 more)

### Community 15 - "telemetry.ts"
Cohesion: 0.11
Nodes (21): CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL, Rates (+13 more)

### Community 16 - "useLiveTiming.ts"
Cohesion: 0.26
Nodes (12): AzureBuild, lastWall, sample(), subscribe(), subscribers, useLiveClock(), liveBuildTiming(), liveTiming() (+4 more)

### Community 17 - "index.ts"
Cohesion: 0.12
Nodes (31): close(), config, itSpecialist, loadedRevision, offices, releaseLock, server, serviceHealth (+23 more)

### Community 18 - "WorkTime"
Cohesion: 0.17
Nodes (19): ConfirmedSegment, LiveAnchor, ObservationGap, SnapshotOrdering, TimeLedgerState, WorkTime, Acc, bump() (+11 more)

### Community 19 - "SettingsPanel.tsx"
Cohesion: 0.20
Nodes (22): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS, PickupForm(), channelSettingsProblem() (+14 more)

### Community 20 - "conversations/conversations.ts"
Cohesion: 0.10
Nodes (26): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+18 more)

### Community 21 - "cost-entries.ts"
Cohesion: 0.24
Nodes (10): captureCost(), summary(), awaitingEvidence(), CaptureContext, inCostWindow(), TicketCost, ticketCosts(), RECONCILE_GRACE_MS (+2 more)

### Community 22 - "azure.ts"
Cohesion: 0.08
Nodes (34): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+26 more)

### Community 23 - "scope-repair-readback.ts"
Cohesion: 0.22
Nodes (17): containedFile(), Assessment, outsideScanSources(), Ownership, reconcileScopeRepairReadback(), requireThat(), scopeRepairReadbackCandidate(), scopeRepairRequestResolved() (+9 more)

### Community 24 - "retire-external-delivery.ts"
Cohesion: 0.44
Nodes (6): completedPRReviews(), eligible(), mergedByOwner(), ownerSettles(), retireExternalDeliveries(), settledExternalRepair()

### Community 25 - "work-summary.ts"
Cohesion: 0.17
Nodes (22): compactSteps(), themeColor, App(), deliveryRepairProjection(), ACTIVE, maintenanceUpdate(), PMQueueItem, pmQueueItems() (+14 more)

### Community 26 - "scheduled-work.ts"
Cohesion: 0.20
Nodes (16): deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), deterministicActions, eligible() (+8 more)

### Community 27 - "TelemetryPanel.tsx"
Cohesion: 0.20
Nodes (18): TelemetryReport, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens(), usd(), KpiTiles() (+10 more)

### Community 28 - "StageResult"
Cohesion: 0.18
Nodes (23): harnessCloseout(), PASSING, verifyMergeActions(), activeEffectId(), harnessEffect, assertMayMutate(), retryRead(), runHarnessStage() (+15 more)

### Community 29 - "retrospective-subject.ts"
Cohesion: 0.11
Nodes (25): deliveryMetrics(), median(), ARTIFACT_LIMIT, clip(), LEDGER_STEPS, MAINTENANCE_LIMIT, maintenanceFacts(), MaintenancePacketSection (+17 more)

### Community 30 - "knowledge.ts"
Cohesion: 0.22
Nodes (14): KnowledgeRetry, KnowledgeState, Lesson, LessonRecurrence, OfficeProposal, PendingRetrospective, RepositoryInstruction, RetrospectiveEvent (+6 more)

### Community 31 - ".save"
Cohesion: 0.07
Nodes (48): JiraOperations, plain(), unpack(), BLOCKED, Execute, findComment(), jira(), LiveIssue (+40 more)

### Community 32 - "workKey"
Cohesion: 0.08
Nodes (44): recordJobApproach(), continuationScope(), Assessment, diagnosticProof(), discoveryRecoveryCandidate(), ownedArtifact(), Ownership, rawHash() (+36 more)

### Community 33 - "agents.ts"
Cohesion: 0.06
Nodes (63): cecPrompt(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), resolvedDecisionNote(), stageInstructions, cecChatPrompt() (+55 more)

### Community 34 - "merge-summary.ts"
Cohesion: 0.36
Nodes (7): clamp(), LIMITS, MergedPR, plainSlackText(), section(), shippedSummary(), mergeText()

### Community 36 - "daily-cto.ts"
Cohesion: 0.06
Nodes (43): collectCTOFacts(), DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), dailyReviewDate(), reviewWeekday(), boundedIntake() (+35 more)

### Community 37 - "OfficeSnapshot"
Cohesion: 0.07
Nodes (35): FeatureRound, SendMessage, recommendedReply(), FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases (+27 more)

### Community 38 - "engine.ts"
Cohesion: 0.05
Nodes (66): correlatedBuild(), checkMail(), drainMail(), requestMail(), parksInJira(), dispatchNightly(), drainDelivery(), enableNightly() (+58 more)

### Community 39 - "time-scope.ts"
Cohesion: 0.18
Nodes (24): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), midnight(), TicketDay (+16 more)

### Community 42 - "run-accounting.ts"
Cohesion: 0.23
Nodes (13): readCodexRollout(), codexAccounting(), COMPLETION_MAX_BYTES, readCompletion(), reconcileUncapturedRuns(), reconciling, recordTerminalAccounting(), Source (+5 more)

### Community 45 - "accept-stage-result.ts"
Cohesion: 0.13
Nodes (34): acceptStageResult(), PrerequisitesSchema, mergeAuthorized(), continuationWorktree(), discoveryReviewSatisfied(), savedCandidateAdmission, dependencyVersion(), handoffSavedPrerequisites() (+26 more)

### Community 46 - "coordination.ts"
Cohesion: 0.24
Nodes (12): checkpointWindow(), dueAt(), hours, localDay(), ReviewResult, deferNonReady(), preparePR(), recheck() (+4 more)

### Community 47 - "Agents"
Cohesion: 0.15
Nodes (5): comparableSlackText(), SlackMessages, SlackRequestSchema, Agents, WorkerRuntime

### Community 48 - "process.ts"
Cohesion: 0.10
Nodes (23): CommandRegistry, CommandScope, inside(), RegisteredCommand, At, Errno, GroupInventory, GroupProbe (+15 more)

### Community 49 - ".transaction"
Cohesion: 0.05
Nodes (77): approveFeature(), assertRetainedItems(), commandFeature(), createFeature(), featureById(), mutation(), reviewQuestions(), featureItemComplete() (+69 more)

### Community 52 - "dependencies.ts"
Cohesion: 0.22
Nodes (18): Admission, admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, compatible(), dependencyCompletionKey(), dependencyEligibility() (+10 more)

### Community 53 - "assignment-poll.ts"
Cohesion: 0.06
Nodes (72): noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), syncOutbox(), Lane, MOVABLE, moveLane(), resolveLane() (+64 more)

### Community 54 - "outbox.ts"
Cohesion: 0.05
Nodes (52): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), projectOutbox(), projectSlackDeliveries(), Input, supersedeSlackDelivery() (+44 more)

### Community 55 - "Role"
Cohesion: 0.09
Nodes (25): ROLES, DELIVERY_CONCURRENCY, file, project, root, DeliverySlot, officeCapacity, projectById() (+17 more)

### Community 57 - "weekly-rollup.ts"
Cohesion: 0.11
Nodes (33): busyMaintenanceIds(), retrospectivePrompt(), SUBJECT, Kind, RetrospectiveResultSchema, RollupResult, RollupResultSchema, Stage (+25 more)

### Community 58 - "Store"
Cohesion: 0.08
Nodes (26): diagnosticContext(), diagnosticSnapshot(), nativeDeliveryResolved(), Clock, EASTERN, easternDayFormatter, easternPartsFormatter, systemClock (+18 more)

### Community 61 - "jira-time.ts"
Cohesion: 0.20
Nodes (14): easternDay(), data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime() (+6 more)

### Community 65 - "run.ts"
Cohesion: 0.16
Nodes (18): investigationEvidence(), OFFICE_FIX_PROMPT, OfficeFixResult, validateOfficeFix(), OFFICE_SOURCE_PATHS, officeSource(), investigationReady(), INVESTIGATION_ATTEMPTS (+10 more)

### Community 66 - "knowledge-context.ts"
Cohesion: 0.21
Nodes (11): Bucket, knowledgeContext(), LESSON_LIMIT, lessonPurpose(), MAINTENANCE, MAX_LESSONS, PURPOSES, render() (+3 more)

### Community 68 - "session-bridge.ts"
Cohesion: 0.16
Nodes (15): codexSessionContext(), Project, Reader, claudeSessions(), codexSessions(), desktopSessions(), guardianReview(), LiveSession (+7 more)

### Community 70 - "office-lessons.ts"
Cohesion: 0.18
Nodes (14): Accepted, acceptRetrospective(), normalizeStatement(), RETROSPECTIVE_HISTORY, decideOfficeProposal(), now(), OfficeKnowledgeStore, proposeOfficeLessons() (+6 more)

### Community 71 - "artifact"
Cohesion: 0.14
Nodes (42): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+34 more)

### Community 72 - "validate-stage.ts"
Cohesion: 0.16
Nodes (17): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+9 more)

### Community 75 - "work.ts"
Cohesion: 0.17
Nodes (11): AssignmentResult, CompletionCondition, Continuation, DependencyObservation, EligibilityState, FailureCategory, ReconciliationAction, ReconciliationRequest (+3 more)

### Community 77 - ".emit"
Cohesion: 0.17
Nodes (22): ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), configureNotices(), Identity, NoticeSettings, retryRecipientLookup() (+14 more)

### Community 78 - "coordination-tick.ts"
Cohesion: 0.20
Nodes (14): reconcileNoticeConfirmations(), brainCheckpointCompletion(), reconcileCompletedCheckpoints(), reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION, tick() (+6 more)

### Community 79 - "owned-artifact.ts"
Cohesion: 0.42
Nodes (7): BoundedRead, done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf(), CompletionReader

### Community 80 - "checkpoint-completion.ts"
Cohesion: 0.17
Nodes (12): completeNativeCheckpoint(), BrainStatusSchema, identity, coverageSchema, followupSchema, verified, queueCheckpointRetry(), readBackCheckpoint() (+4 more)

### Community 83 - "retrospective-triggers.ts"
Cohesion: 0.11
Nodes (34): clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates(), maintenanceCompletedId(), maintenanceKey(), visibleMaintenanceTriggerIds(), clip() (+26 more)

### Community 84 - "project-progress.ts"
Cohesion: 0.22
Nodes (6): file, folder, logs, root, xml(), ProjectProgress

### Community 86 - "digest"
Cohesion: 0.12
Nodes (39): assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), reconcileCompletedConflictDraft(), routeReadyPostConflictPublication(), verifyInitialDraftConflictPreparation() (+31 more)

### Community 88 - "shared.ts"
Cohesion: 0.09
Nodes (28): ProjectReadiness, DailyCTOSummary, SchedulerState, itAgent(), itDiagnostics(), currentServices(), ServiceHealthPanel(), ServiceHealthRow() (+20 more)

### Community 89 - "run-ci-repair.ts"
Cohesion: 0.21
Nodes (16): developerPRContent(), Execute, lintPRContent(), officePRContent(), prContent, ciCheckout(), verifyCIHooks(), CIFailure (+8 more)

### Community 90 - "helper-usage.ts"
Cohesion: 0.21
Nodes (9): backfillClaudeCost(), codexHome(), HELPER_STDOUT_MAX_BYTES, helperAccounting(), claudeAccounting(), completionAccounting(), markCaptureStart(), withReason() (+1 more)

### Community 93 - "codex-rollout.ts"
Cohesion: 0.29
Nodes (9): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO (+1 more)

### Community 94 - "cli.ts"
Cohesion: 0.29
Nodes (5): args, [cmd,...rawArgs], commands, key, projectIndex

### Community 95 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 96 - "run-usage.ts"
Cohesion: 0.38
Nodes (5): CodexRollout, claudeCrashZero(), claudeUsage(), count(), RunUsage

### Community 98 - "codex-rollout-file.ts"
Cohesion: 0.43
Nodes (6): createdAt(), dayDirs(), header(), ROLLOUT_MAX_BYTES, RolloutScan, scanCodexRollouts()

## Knowledge Gaps
- **345 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+340 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `remove-candidate.ts`, `GitHubDelivery`, `continuation-evidence.ts`, `source-amendment.ts`, `cost-ledger.ts`, `github-delivery.ts`, `TicketJob`, `requests.ts`, `maintenance.ts`, `index.ts`, `conversations/conversations.ts`, `cost-entries.ts`, `azure.ts`, `scope-repair-readback.ts`, `retire-external-delivery.ts`, `scheduled-work.ts`, `StageResult`, `retrospective-subject.ts`, `.save`, `workKey`, `agents.ts`, `Coordinator`, `daily-cto.ts`, `OfficeSnapshot`, `engine.ts`, `time-scope.ts`, `BrainFollowup`, `run-accounting.ts`, `accept-stage-result.ts`, `coordination.ts`, `Agents`, `process.ts`, `.transaction`, `dependencies.ts`, `assignment-poll.ts`, `outbox.ts`, `Role`, `weekly-rollup.ts`, `jira-time.ts`, `run.ts`, `knowledge-context.ts`, `session-bridge.ts`, `office-lessons.ts`, `artifact`, `validate-stage.ts`, `.emit`, `coordination-tick.ts`, `owned-artifact.ts`, `checkpoint-completion.ts`, `retrospective-triggers.ts`, `project-progress.ts`, `digest`, `helper-usage.ts`?**
  _High betweenness centrality (0.104) - this node is a cross-community bridge._
- **Why does `command()` connect `process.ts` to `remove-candidate.ts`, `GitHubDelivery`, `cost-ledger.ts`, `github-delivery.ts`, `requests.ts`, `maintenance.ts`, `azure.ts`, `scheduled-work.ts`, `StageResult`, `.save`, `workKey`, `agents.ts`, `Coordinator`, `engine.ts`, `BrainFollowup`, `coordination.ts`, `Agents`, `.transaction`, `dependencies.ts`, `assignment-poll.ts`, `outbox.ts`, `jira-time.ts`, `session-bridge.ts`, `validate-stage.ts`, `.emit`, `project-progress.ts`, `run-ci-repair.ts`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `TicketJob` connect `TicketJob` to `remove-candidate.ts`, `GitHubDelivery`, `continuation-evidence.ts`, `source-amendment.ts`, `github-check-selection.ts`, `Inspector.tsx`, `github-delivery.ts`, `requests.ts`, `scope-repair-readback.ts`, `retire-external-delivery.ts`, `work-summary.ts`, `StageResult`, `retrospective-subject.ts`, `workKey`, `daily-cto.ts`, `engine.ts`, `accept-stage-result.ts`, `dependencies.ts`, `assignment-poll.ts`, `outbox.ts`, `Role`, `artifact`, `validate-stage.ts`, `work.ts`, `retrospective-triggers.ts`, `project-progress.ts`, `digest`, `shared.ts`, `run-ci-repair.ts`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `command()` (e.g. with `.constructor()` and `executeRequest()`) actually correct?**
  _`command()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _345 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `GitHubDelivery` be split into smaller, more focused modules?**
  _Cohesion score 0.14333333333333334 - nodes in this community are weakly interconnected._
- **Should `continuation-evidence.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10275689223057644 - nodes in this community are weakly interconnected._