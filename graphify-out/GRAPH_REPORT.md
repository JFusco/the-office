# Graph Report - fix-it-investigations  (2026-11-07)

## Corpus Check
- 450 files · ~219,191 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2656 nodes · 11146 edges · 83 communities (81 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 64 edges (avg confidence: 0.74)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9cd37f77`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- remove-candidate.ts
- dependency-bots/adopt.ts
- Store
- service-health.ts
- source-amendment-scope.ts
- artifact
- shared.ts
- App.tsx
- cost-ledger.ts
- Inspector.tsx
- github-delivery.ts
- OfficeScene.tsx
- run-ci-repair.ts
- digest
- maintenance.ts
- telemetry.ts
- scheduled-work.ts
- index.ts
- report.ts
- SettingsPanel.tsx
- conversations/conversations.ts
- github-publication.ts
- azure.ts
- source-amendment.ts
- Goals.tsx
- OfficeSnapshot
- accept-stage-result.ts
- TimeBook.tsx
- preferences-store.ts
- retrospective-subject.ts
- office-lessons.ts
- .save
- knowledge.ts
- agents.ts
- it-specialist.ts
- Coordinator
- daily-cto.ts
- scheduler.ts
- cec/workflow.ts
- time-scope.ts
- release-unpark.ts
- retrospective-triggers.ts
- run-accounting.ts
- notifications.ts
- run-retrospective.ts
- assignment-poll.ts
- coordination.ts
- ledger.ts
- run.ts
- follow-up-alerts.ts
- .transaction
- publish-pr.ts
- dependencies.ts
- retrospective-facts.ts
- helper-usage.ts
- recovery-ledger.ts
- coordination-tick.ts
- weekly-rollup.ts
- store.ts
- work.ts
- Offices
- publishJiraTime
- merge-summary.ts
- time-readback.ts
- owned-artifact.ts
- codex-rollout.ts
- knowledge-context.ts
- command-registry.ts
- session-bridge.ts
- cli.ts
- liveReach
- activation-recovery.ts
- validate-stage.ts
- helper-evidence.py
- model-routes.ts
- run-usage.ts
- .emit
- discovery-recovery.ts
- codex-rollout-file.ts
- saved-candidate-admission.ts
- publishable.ts
- ServiceHealthPanel.tsx

## God Nodes (most connected - your core abstractions)
1. `Store` - 243 edges
2. `TicketJob` - 116 edges
3. `GitHubDelivery` - 112 edges
4. `command()` - 89 edges
5. `artifact()` - 85 edges
6. `digest()` - 82 edges
7. `cx()` - 75 edges
8. `workKey()` - 71 edges
9. `OfficeSnapshot` - 64 edges
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

## Communities (83 total, 2 thin omitted)

### Community 0 - "remove-candidate.ts"
Cohesion: 0.20
Nodes (16): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+8 more)

### Community 1 - "dependency-bots/adopt.ts"
Cohesion: 0.15
Nodes (29): Execute, readBackOrThrow(), adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR (+21 more)

### Community 2 - "Store"
Cohesion: 0.05
Nodes (23): correlatedBuild(), JiraOperations, plain(), unpack(), APPROACH_GUIDANCE, reconcileCloseout(), Content, GITHUB_ISSUE_SKILL (+15 more)

### Community 3 - "service-health.ts"
Cohesion: 0.18
Nodes (9): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, slackHealth() (+1 more)

### Community 4 - "source-amendment-scope.ts"
Cohesion: 0.08
Nodes (39): approvedText(), assert(), assert(), normalize(), officialUrls, ReleaseCapture, verifyReleaseCaptures(), amendmentCaptureObservation() (+31 more)

### Community 5 - "artifact"
Cohesion: 0.08
Nodes (71): advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat(), assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate() (+63 more)

### Community 6 - "shared.ts"
Cohesion: 0.06
Nodes (61): ProjectReadiness, Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona (+53 more)

### Community 7 - "App.tsx"
Cohesion: 0.07
Nodes (35): themeColor, CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants, ElevatorPhase, floorVariants, leftDoor (+27 more)

### Community 8 - "cost-ledger.ts"
Cohesion: 0.15
Nodes (26): EffectUncertainError, captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress() (+18 more)

### Community 9 - "Inspector.tsx"
Cohesion: 0.07
Nodes (63): Conversation(), Outbox(), SendMessage, recommendedReply(), labels, LessonsPanel(), when(), GoalList() (+55 more)

### Community 10 - "github-delivery.ts"
Cohesion: 0.05
Nodes (74): harnessDelivers(), legacyRecovery(), BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction(), dependabotReviewGuidance(), discover() (+66 more)

### Community 11 - "OfficeScene.tsx"
Cohesion: 0.06
Nodes (58): displayAgentTask(), githubStageLabels, withoutElapsed(), LiveAgentTask(), Props, RunningTask(), text(), Avatar() (+50 more)

### Community 12 - "run-ci-repair.ts"
Cohesion: 0.21
Nodes (15): developerPRContent(), Execute, lintPRContent(), officePRContent(), prContent, ciCheckout(), verifyCIHooks(), CIFailure (+7 more)

### Community 13 - "digest"
Cohesion: 0.09
Nodes (55): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+47 more)

### Community 14 - "maintenance.ts"
Cohesion: 0.10
Nodes (28): maintenancePolicies(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice(), candidateOwner(), SETTLED (+20 more)

### Community 15 - "telemetry.ts"
Cohesion: 0.11
Nodes (24): CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL, Rates (+16 more)

### Community 16 - "scheduled-work.ts"
Cohesion: 0.20
Nodes (15): conversationResolved(), deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), deterministicActions (+7 more)

### Community 17 - "index.ts"
Cohesion: 0.12
Nodes (26): close(), config, itSpecialist, loadedRevision, offices, releaseLock, server, serviceHealth (+18 more)

### Community 18 - "report.ts"
Cohesion: 0.16
Nodes (21): isModelWork(), isTicketModelWork(), awaitingEvidence(), CaptureContext, inCostWindow(), TicketCost, ticketCosts(), ISSUE_KEY (+13 more)

### Community 19 - "SettingsPanel.tsx"
Cohesion: 0.13
Nodes (33): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS, PickupForm(), acceptPreferences() (+25 more)

### Community 20 - "conversations/conversations.ts"
Cohesion: 0.09
Nodes (30): assertConversationReadback(), uncertainConversations(), Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+22 more)

### Community 21 - "github-publication.ts"
Cohesion: 0.29
Nodes (7): Assign, Board, Content, GitHubFeaturePublisher, number(), same(), label()

### Community 22 - "azure.ts"
Cohesion: 0.11
Nodes (26): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+18 more)

### Community 23 - "source-amendment.ts"
Cohesion: 0.10
Nodes (56): adoptCandidate(), reported, Scope, continuationWorktree(), Assessment, outsideScanSources(), Ownership, reconcileScopeRepairReadback() (+48 more)

### Community 24 - "Goals.tsx"
Cohesion: 0.10
Nodes (26): FeatureRound, FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures(), draftKey() (+18 more)

### Community 25 - "OfficeSnapshot"
Cohesion: 0.11
Nodes (31): DailyCTOSummary, App(), usePanelFocus(), TicketDetail(), SnapshotAcceptance, demoSnapshot(), tourStages, useOffice() (+23 more)

### Community 26 - "accept-stage-result.ts"
Cohesion: 0.12
Nodes (44): containedFile(), findingsBlock(), HANDS_OFF_PROJECTS, handsOff(), acceptStageResult(), acceptConflictRepair(), recordJobApproach(), deliveryNextStage() (+36 more)

### Community 27 - "TimeBook.tsx"
Cohesion: 0.10
Nodes (36): TelemetryReport, AzureBuild, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens(), usd() (+28 more)

### Community 28 - "preferences-store.ts"
Cohesion: 0.21
Nodes (9): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS (+1 more)

### Community 29 - "retrospective-subject.ts"
Cohesion: 0.19
Nodes (15): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, maintenanceKey(), azurePrUrl(), findSubject(), jobSubject() (+7 more)

### Community 30 - "office-lessons.ts"
Cohesion: 0.17
Nodes (15): Accepted, normalizeStatement(), RETROSPECTIVE_HISTORY, decideOfficeProposal(), mirrorOfficeKnowledge(), now(), OfficeKnowledgeStore, proposeOfficeLessons() (+7 more)

### Community 31 - ".save"
Cohesion: 0.10
Nodes (35): file, folder, logs, root, xml(), BLOCKED, Execute, findComment() (+27 more)

### Community 32 - "knowledge.ts"
Cohesion: 0.19
Nodes (15): SEEDS, KnowledgeRetry, KnowledgeState, Lesson, LessonRecurrence, OfficeProposal, PendingRetrospective, RepositoryInstruction (+7 more)

### Community 33 - "agents.ts"
Cohesion: 0.05
Nodes (59): cecPrompt(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), resolvedDecisionNote(), stageInstructions, ConversationResultSchema (+51 more)

### Community 34 - "it-specialist.ts"
Cohesion: 0.30
Nodes (10): conversationReadbackReady(), queueConversationReadback(), ITContext, readBackConversations(), publishITReport(), delays, recoverAttempt(), ITFollowUp (+2 more)

### Community 35 - "Coordinator"
Cohesion: 0.08
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 36 - "daily-cto.ts"
Cohesion: 0.06
Nodes (45): collectCTOFacts(), DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), dailyReviewDate(), reviewWeekday(), boundedIntake() (+37 more)

### Community 37 - "scheduler.ts"
Cohesion: 0.18
Nodes (11): ROLES, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch(), foreignWork() (+3 more)

### Community 38 - "cec/workflow.ts"
Cohesion: 0.07
Nodes (59): checkMail(), drainMail(), requestMail(), parksInJira(), dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery() (+51 more)

### Community 39 - "time-scope.ts"
Cohesion: 0.20
Nodes (22): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), ScopePolicy, scopeSelector(), midnight(), TicketDay, ticketDayTotals(), captureTime() (+14 more)

### Community 40 - "release-unpark.ts"
Cohesion: 0.19
Nodes (23): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), ProjectCard, projectCards(), projectGraphql() (+15 more)

### Community 41 - "retrospective-triggers.ts"
Cohesion: 0.13
Nodes (30): clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates(), maintenanceCompletedId(), visibleMaintenanceTriggerIds(), clip(), JobLike (+22 more)

### Community 42 - "run-accounting.ts"
Cohesion: 0.22
Nodes (13): readCodexRollout(), codexAccounting(), COMPLETION_MAX_BYTES, merge(), readCompletion(), RECONCILE_GRACE_MS, reconcileUncapturedRuns(), reconciling (+5 more)

### Community 43 - "notifications.ts"
Cohesion: 0.11
Nodes (20): channelNoticeAuthorized(), notices(), queueChannelNotice(), Identity, MergeNotifications, SlackMessages, SlackRequestSchema, goalNoticeAuthorized() (+12 more)

### Community 44 - "run-retrospective.ts"
Cohesion: 0.22
Nodes (15): acceptRetrospective(), busyMaintenanceIds(), retrospectivePrompt(), SUBJECT, RetrospectiveResultSchema, terminalCandidates(), triggerJobId(), KnowledgeRunner (+7 more)

### Community 45 - "assignment-poll.ts"
Cohesion: 0.35
Nodes (7): noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), syncOutbox(), pinCourier, poll(), readAssignments()

### Community 46 - "coordination.ts"
Cohesion: 0.18
Nodes (18): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation(), checkpointWindow(), dueAt() (+10 more)

### Community 47 - "ledger.ts"
Cohesion: 0.42
Nodes (7): investigationCandidates(), investigationId(), investigationFollowUps(), investigationResolution(), syncInvestigations(), ITInvestigation, slackMessageUrl()

### Community 48 - "run.ts"
Cohesion: 0.33
Nodes (9): investigationEvidence(), investigationReady(), INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, InvestigationOptions, InvestigationReport, InvestigationRunner, runInvestigation() (+1 more)

### Community 49 - "follow-up-alerts.ts"
Cohesion: 0.30
Nodes (9): checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), repeatedVendorReviewBlock(), stoppedInVendorReview(), maintenanceSuperseded(), REOBSERVED, ReconciliationRequest (+1 more)

### Community 50 - ".transaction"
Cohesion: 0.05
Nodes (77): approveFeature(), assertRetainedItems(), commandFeature(), createFeature(), featureById(), mutation(), reviewQuestions(), featureEffectGate() (+69 more)

### Community 51 - "publish-pr.ts"
Cohesion: 0.18
Nodes (23): harnessCloseout(), PASSING, verifyMergeActions(), activeEffectId(), harnessEffect, assertMayMutate(), retryRead(), runHarnessStage() (+15 more)

### Community 52 - "dependencies.ts"
Cohesion: 0.21
Nodes (17): Admission, admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, resumeParked(), compatible(), dependencyCompletionKey() (+9 more)

### Community 53 - "retrospective-facts.ts"
Cohesion: 0.23
Nodes (11): ARTIFACT_LIMIT, clip(), LEDGER_STEPS, MAINTENANCE_LIMIT, maintenanceFacts(), MaintenancePacketSection, clip(), PACKET_LIMIT (+3 more)

### Community 54 - "helper-usage.ts"
Cohesion: 0.24
Nodes (8): backfillClaudeCost(), codexHome(), HELPER_STDOUT_MAX_BYTES, helperAccounting(), claudeAccounting(), completionAccounting(), markCaptureStart(), withReason()

### Community 55 - "recovery-ledger.ts"
Cohesion: 0.38
Nodes (7): savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), diagnosticSnapshot(), nativeDeliveryResolved(), reconcileRecoveryLedger()

### Community 56 - "coordination-tick.ts"
Cohesion: 0.22
Nodes (12): reconcileNoticeConfirmations(), PrerequisitesSchema, legacy, reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION, tick() (+4 more)

### Community 57 - "weekly-rollup.ts"
Cohesion: 0.21
Nodes (16): RollupResult, RollupResultSchema, harperFolder(), RETROSPECTIVE_TIMEOUT, retryDelay(), ineffectiveLessons(), lastFriday(), ROLLUP_HISTORY (+8 more)

### Community 58 - "store.ts"
Cohesion: 0.06
Nodes (39): featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), recoverFeatures(), Clock, EASTERN, easternDayFormatter, easternPartsFormatter (+31 more)

### Community 59 - "work.ts"
Cohesion: 0.14
Nodes (14): AssignmentResult, CompletionCondition, Continuation, DependencyObservation, EligibilityState, FailureCategory, Prerequisite, ReconciliationAction (+6 more)

### Community 61 - "publishJiraTime"
Cohesion: 0.36
Nodes (5): data(), JiraWorklogs, localId(), matches(), publishJiraTime()

### Community 62 - "merge-summary.ts"
Cohesion: 0.36
Nodes (7): clamp(), LIMITS, MergedPR, plainSlackText(), section(), shippedSummary(), mergeText()

### Community 63 - "time-readback.ts"
Cohesion: 0.22
Nodes (8): Readback, READBACK_INTERVAL_MS, SETTLE_MS, ConfirmedSegment, LiveAnchor, ObservationGap, SnapshotOrdering, TimePublication

### Community 64 - "owned-artifact.ts"
Cohesion: 0.42
Nodes (7): BoundedRead, done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf(), CompletionReader

### Community 65 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 66 - "knowledge-context.ts"
Cohesion: 0.21
Nodes (11): Bucket, knowledgeContext(), LESSON_LIMIT, lessonPurpose(), MAINTENANCE, MAX_LESSONS, PURPOSES, render() (+3 more)

### Community 67 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 68 - "session-bridge.ts"
Cohesion: 0.33
Nodes (8): claudeSessions(), codexSessions(), desktopSessions(), guardianReview(), LiveSession, loadedCodexSession(), openRollouts(), SessionInventory

### Community 69 - "cli.ts"
Cohesion: 0.25
Nodes (6): args, [cmd,...rawArgs], commands, key, projectIndex, PORT

### Community 70 - "liveReach"
Cohesion: 0.60
Nodes (5): GIT_NETWORK, LIVE_PROVIDERS, liveReach(), networkUrl(), remoteUrls()

### Community 71 - "activation-recovery.ts"
Cohesion: 0.07
Nodes (61): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+53 more)

### Community 72 - "validate-stage.ts"
Cohesion: 0.17
Nodes (16): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+8 more)

### Community 75 - "model-routes.ts"
Cohesion: 0.16
Nodes (17): AUTO_ADOPT_BOTS, OfficeConfigInputs, officeConfigRoute(), officeConfigSummary(), CECBinding, localBindings, assertModelOverrides(), CODEX_DEFAULT_EFFORT (+9 more)

### Community 76 - "run-usage.ts"
Cohesion: 0.38
Nodes (5): CodexRollout, claudeCrashZero(), claudeUsage(), count(), RunUsage

### Community 77 - ".emit"
Cohesion: 0.15
Nodes (20): ChannelSettings, configureChannelNotices(), configureNotices(), NoticeSettings, retryRecipientLookup(), APPROACH_GUARD_REJECTION, failedWorker(), requeueWaitedImplement() (+12 more)

### Community 78 - "discovery-recovery.ts"
Cohesion: 0.13
Nodes (18): Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership, rawHash() (+10 more)

### Community 79 - "codex-rollout-file.ts"
Cohesion: 0.43
Nodes (6): createdAt(), dayDirs(), header(), ROLLOUT_MAX_BYTES, RolloutScan, scanCodexRollouts()

### Community 80 - "saved-candidate-admission.ts"
Cohesion: 0.60
Nodes (4): candidateInput(), children, oldAdoptionBasis(), savedCandidateAdmission

### Community 81 - "publishable.ts"
Cohesion: 0.70
Nodes (4): publishableEntry(), settlementPending(), superseded(), ticketUnresolved()

### Community 83 - "ServiceHealthPanel.tsx"
Cohesion: 0.27
Nodes (8): itAgent(), itDiagnostics(), currentServices(), ServiceHealthPanel(), ServiceHealthRow(), HealthReport, RefreshCw, PanelIcon()

## Knowledge Gaps
- **332 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+327 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `remove-candidate.ts`, `dependency-bots/adopt.ts`, `artifact`, `cost-ledger.ts`, `github-delivery.ts`, `digest`, `maintenance.ts`, `scheduled-work.ts`, `index.ts`, `conversations/conversations.ts`, `github-publication.ts`, `azure.ts`, `source-amendment.ts`, `OfficeSnapshot`, `accept-stage-result.ts`, `retrospective-subject.ts`, `office-lessons.ts`, `.save`, `agents.ts`, `it-specialist.ts`, `daily-cto.ts`, `scheduler.ts`, `cec/workflow.ts`, `time-scope.ts`, `release-unpark.ts`, `retrospective-triggers.ts`, `run-accounting.ts`, `notifications.ts`, `run-retrospective.ts`, `coordination.ts`, `ledger.ts`, `run.ts`, `.transaction`, `publish-pr.ts`, `dependencies.ts`, `retrospective-facts.ts`, `helper-usage.ts`, `recovery-ledger.ts`, `coordination-tick.ts`, `weekly-rollup.ts`, `store.ts`, `time-readback.ts`, `owned-artifact.ts`, `knowledge-context.ts`, `session-bridge.ts`, `activation-recovery.ts`, `validate-stage.ts`, `.emit`, `discovery-recovery.ts`, `saved-candidate-admission.ts`?**
  _High betweenness centrality (0.118) - this node is a cross-community bridge._
- **Why does `TicketJob` connect `github-delivery.ts` to `remove-candidate.ts`, `dependency-bots/adopt.ts`, `Store`, `artifact`, `shared.ts`, `Inspector.tsx`, `run-ci-repair.ts`, `digest`, `source-amendment.ts`, `OfficeSnapshot`, `accept-stage-result.ts`, `retrospective-subject.ts`, `.save`, `it-specialist.ts`, `daily-cto.ts`, `scheduler.ts`, `cec/workflow.ts`, `release-unpark.ts`, `retrospective-triggers.ts`, `follow-up-alerts.ts`, `.transaction`, `publish-pr.ts`, `dependencies.ts`, `work.ts`, `activation-recovery.ts`, `validate-stage.ts`, `.emit`, `discovery-recovery.ts`, `saved-candidate-admission.ts`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Why does `command()` connect `Store` to `remove-candidate.ts`, `service-health.ts`, `cost-ledger.ts`, `github-delivery.ts`, `run-ci-repair.ts`, `digest`, `maintenance.ts`, `github-publication.ts`, `azure.ts`, `.save`, `agents.ts`, `cec/workflow.ts`, `release-unpark.ts`, `notifications.ts`, `coordination.ts`, `.transaction`, `publish-pr.ts`, `dependencies.ts`, `publishJiraTime`, `time-readback.ts`, `command-registry.ts`, `session-bridge.ts`, `liveReach`, `activation-recovery.ts`, `validate-stage.ts`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `command()` (e.g. with `.constructor()` and `executeRequest()`) actually correct?**
  _`command()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _332 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Store` be split into smaller, more focused modules?**
  _Cohesion score 0.054945054945054944 - nodes in this community are weakly interconnected._
- **Should `source-amendment-scope.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08305647840531562 - nodes in this community are weakly interconnected._