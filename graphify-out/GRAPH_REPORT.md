# Graph Report - the-office  (2026-11-08)

## Corpus Check
- 467 files · ~222,985 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2712 nodes · 11364 edges · 84 communities (82 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 64 edges (avg confidence: 0.74)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `122da562`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- remove-candidate.ts
- github-context.ts
- .emit
- useOfficePreferences.ts
- source-amendment.ts
- queue-repairs.ts
- PeoplePanel.tsx
- App.tsx
- scheduled-work.ts
- Inspector.tsx
- accept-stage-result.ts
- OfficeScene.tsx
- github-delivery.ts
- digest
- maintenance.ts
- run-accounting.ts
- engine.ts
- index.ts
- report.ts
- index.tsx
- conversations/conversations.ts
- github-publication.ts
- sanitize
- scope-repair-resume.ts
- features.ts
- work-summary.ts
- continuation-evidence.ts
- TimeBook.tsx
- notifications.ts
- retrospective-subject.ts
- knowledge.ts
- .save
- implementation-recovery.ts
- agents.ts
- model-routes.ts
- executeRequest
- ControlStore
- Goals.tsx
- cec/workflow.ts
- time-scope.ts
- assignment-poll.ts
- migrations.ts
- WorkTime
- liveReach
- daily-cto.ts
- workKey
- coordination.ts
- conversations/slack.ts
- process.ts
- enrollment-gate.ts
- fact-bounds.ts
- StageResult
- requests.ts
- dependency-bots/adopt.ts
- it-specialist.ts
- scheduler.ts
- retire-external-delivery.ts
- weekly-rollup.ts
- Store
- discovery-recovery.ts
- Offices
- jira-time.ts
- run-retrospective.ts
- approval.ts
- knowledge-context.ts
- command-registry.ts
- session-bridge.ts
- office-lessons.ts
- activation-recovery.ts
- create-candidate.ts
- helper-evidence.py
- worker-runtime.ts
- jira-publication.ts
- http/commands.ts
- .transaction
- retrospective-triggers.ts
- artifact
- dependency-edges.ts
- shared.ts
- TicketJob
- retrospective-facts.ts
- slack-supersession.ts
- maintenance-triggers.ts

## God Nodes (most connected - your core abstractions)
1. `Store` - 247 edges
2. `TicketJob` - 116 edges
3. `GitHubDelivery` - 112 edges
4. `command()` - 90 edges
5. `artifact()` - 85 edges
6. `digest()` - 82 edges
7. `cx()` - 77 edges
8. `workKey()` - 71 edges
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

## Communities (84 total, 2 thin omitted)

### Community 0 - "remove-candidate.ts"
Cohesion: 0.20
Nodes (16): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+8 more)

### Community 1 - "github-context.ts"
Cohesion: 0.16
Nodes (22): deliveryTask(), DeliveryTaskInput, observe(), DISCOVERY_GUIDANCE, checksPassed(), checksPending(), CurrentChecksWait, currentMergeChecks() (+14 more)

### Community 2 - ".emit"
Cohesion: 0.06
Nodes (11): correlatedBuild(), GitHubMonitor, BrainFollowup, Assessment, Engine, observe(), observeParked(), parkedReadError (+3 more)

### Community 3 - "useOfficePreferences.ts"
Cohesion: 0.11
Nodes (21): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, acceptPreferences(), PreferenceCandidate (+13 more)

### Community 4 - "source-amendment.ts"
Cohesion: 0.06
Nodes (72): adoptCandidate(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat() (+64 more)

### Community 5 - "queue-repairs.ts"
Cohesion: 0.23
Nodes (13): stagePrompt(), StagePromptInput, checksFailed(), conflictApprovalGuidance(), conflictAssessmentArtifact(), conflictFindingClassification(), conflictOnlyAssessment(), legacyConflictIds (+5 more)

### Community 6 - "PeoplePanel.tsx"
Cohesion: 0.10
Nodes (40): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+32 more)

### Community 7 - "App.tsx"
Cohesion: 0.06
Nodes (43): CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants, ElevatorPhase, floorVariants, leftDoor, OfficeScene (+35 more)

### Community 8 - "scheduled-work.ts"
Cohesion: 0.10
Nodes (42): conversationResolved(), deliverySlot(), ROLES, closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), preparationRequestResolved(), withAmendmentOwnership(), eligible() (+34 more)

### Community 9 - "Inspector.tsx"
Cohesion: 0.09
Nodes (51): Conversation(), Outbox(), recommendedReply(), slackMessageStatus(), SlackDeliveryCard(), EvidenceCard(), Inspector(), PORTRAIT (+43 more)

### Community 10 - "accept-stage-result.ts"
Cohesion: 0.11
Nodes (43): containedFile(), findingsBlock(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery(), acceptStageResult(), acceptConflictRepair() (+35 more)

### Community 11 - "OfficeScene.tsx"
Cohesion: 0.07
Nodes (48): Avatar(), AzureWall(), Chair(), Coworker(), CTORoom(), Desk(), Floor, Furnishings (+40 more)

### Community 12 - "github-delivery.ts"
Cohesion: 0.14
Nodes (14): BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction(), dependabotReviewGuidance(), discover(), refreshDependencies(), routeExisting() (+6 more)

### Community 13 - "digest"
Cohesion: 0.10
Nodes (48): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+40 more)

### Community 14 - "maintenance.ts"
Cohesion: 0.06
Nodes (45): maintenancePolicies(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, coverageSchema, followupSchema, verified, capped() (+37 more)

### Community 15 - "run-accounting.ts"
Cohesion: 0.05
Nodes (71): BoundedRead, done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf(), backfillClaudeCost(), CompletionReader (+63 more)

### Community 16 - "engine.ts"
Cohesion: 0.23
Nodes (16): checkMail(), drainMail(), requestMail(), dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), resume() (+8 more)

### Community 17 - "index.ts"
Cohesion: 0.11
Nodes (31): close(), config, itSpecialist, loadedRevision, offices, releaseLock, server, serviceHealth (+23 more)

### Community 18 - "report.ts"
Cohesion: 0.27
Nodes (13): telemetryRoute(), Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked() (+5 more)

### Community 19 - "index.tsx"
Cohesion: 0.11
Nodes (38): LessonsPanel(), when(), SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS (+30 more)

### Community 20 - "conversations/conversations.ts"
Cohesion: 0.09
Nodes (28): assertConversationReadback(), uncertainConversations(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO() (+20 more)

### Community 21 - "github-publication.ts"
Cohesion: 0.29
Nodes (8): Assign, Board, Content, GitHubFeaturePublisher, number(), same(), PublicationReceipt, label()

### Community 22 - "sanitize"
Cohesion: 0.12
Nodes (28): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+20 more)

### Community 23 - "scope-repair-resume.ts"
Cohesion: 0.14
Nodes (33): assertContinuationWorker(), continuationScope(), continuationGuard(), Assessment, outsideScanSources(), Ownership, reconcileScopeRepairReadback(), requireThat() (+25 more)

### Community 24 - "features.ts"
Cohesion: 0.14
Nodes (23): discoveryPrompt(), planPrompt(), document(), featureRoot(), DiscoverySchema, PlanSchema, compareBaseline(), prepareBaseline() (+15 more)

### Community 25 - "work-summary.ts"
Cohesion: 0.11
Nodes (28): compactSteps(), themeColor, App(), usePanelFocus(), displayAgentTask(), githubStageLabels, withoutElapsed(), LiveAgentTask() (+20 more)

### Community 26 - "continuation-evidence.ts"
Cohesion: 0.24
Nodes (17): allowed, continuationNativeReview(), continuationReviewArtifacts(), continuationWorkerProof(), negativeWorker(), reconcileContinuationReview(), savedNegativeContinuationReview(), ContinuationDecision (+9 more)

### Community 27 - "TimeBook.tsx"
Cohesion: 0.10
Nodes (36): TelemetryReport, AzureBuild, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens(), usd() (+28 more)

### Community 28 - "notifications.ts"
Cohesion: 0.19
Nodes (15): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR (+7 more)

### Community 29 - "retrospective-subject.ts"
Cohesion: 0.20
Nodes (14): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+6 more)

### Community 30 - "knowledge.ts"
Cohesion: 0.13
Nodes (21): Accepted, RETROSPECTIVE_HISTORY, Kind, RetrospectiveResult, Stage, KnowledgeRetry, Lesson, LESSON_KINDS (+13 more)

### Community 31 - ".save"
Cohesion: 0.08
Nodes (40): file, folder, logs, root, xml(), unpack(), BLOCKED, Execute (+32 more)

### Community 32 - "implementation-recovery.ts"
Cohesion: 0.10
Nodes (35): savedActivationFailure(), brainImplementationCandidate(), BrainReadback, digest(), implementationRecoveryCandidate(), Ownership, Readback, recoverBrainImplementation() (+27 more)

### Community 33 - "agents.ts"
Cohesion: 0.07
Nodes (39): cecPrompt(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), resolvedDecisionNote(), stageInstructions, cecChatPrompt() (+31 more)

### Community 34 - "model-routes.ts"
Cohesion: 0.22
Nodes (13): AUTO_ADOPT_BOTS, goalEvidencePath(), localBindings, assertModelOverrides(), CODEX_DEFAULT_EFFORT, CODEX_DEFAULT_MODEL, CODEX_EFFORTS, CODEX_ROLES (+5 more)

### Community 35 - "executeRequest"
Cohesion: 0.06
Nodes (4): coordination(), Coordinator, executeRequest(), AssignedIssue

### Community 36 - "ControlStore"
Cohesion: 0.17
Nodes (6): DailyCTO, reviewWeekday(), Briefing, saveReviewBriefing(), ControlStore, DailyCTOReport

### Community 37 - "Goals.tsx"
Cohesion: 0.09
Nodes (29): FeatureRound, SendMessage, FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures() (+21 more)

### Community 38 - "cec/workflow.ts"
Cohesion: 0.12
Nodes (39): run(), advance(), nextStage(), publicationEvidenceGap(), qaEvidenceGap(), resultGate(), stageResultGap(), namedRepairIds() (+31 more)

### Community 39 - "time-scope.ts"
Cohesion: 0.23
Nodes (20): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), ticketDayTotals(), captureTime() (+12 more)

### Community 40 - "assignment-poll.ts"
Cohesion: 0.22
Nodes (13): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), admitReadyCards(), WAIT_STATUSES (+5 more)

### Community 41 - "migrations.ts"
Cohesion: 0.21
Nodes (10): ticketCompletedId(), visibleTicketTriggerIds(), seedProjectLessons(), SEEDS, GoalInput, saveGoal(), migrateSnapshot(), resolveProjectLabel() (+2 more)

### Community 42 - "WorkTime"
Cohesion: 0.20
Nodes (12): awaitingEvidence(), CaptureContext, inCostWindow(), TicketCost, ticketCosts(), ConfirmedSegment, LiveAnchor, ObservationGap (+4 more)

### Community 43 - "liveReach"
Cohesion: 0.60
Nodes (5): GIT_NETWORK, LIVE_PROVIDERS, liveReach(), networkUrl(), remoteUrls()

### Community 44 - "daily-cto.ts"
Cohesion: 0.13
Nodes (18): EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), applyGoalReview(), DailyResultSchema, EvidenceRefSchema, FreshDailyResultSchema, statusAllowed() (+10 more)

### Community 45 - "workKey"
Cohesion: 0.15
Nodes (29): PrerequisitesSchema, continuationWorktree(), savedAdmissionUnresolved(), dependencyVersion(), handoffSavedPrerequisites(), hasSavedPrerequisiteResult(), Ownership, qualified() (+21 more)

### Community 46 - "coordination.ts"
Cohesion: 0.17
Nodes (18): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation(), checkpointWindow(), dueAt() (+10 more)

### Community 47 - "conversations/slack.ts"
Cohesion: 0.18
Nodes (11): settleRequestedSlackReplacement(), SlackMessages, SlackRequestSchema, SlackResultSchema, SlackVerificationSchema, goalNoticeAuthorized(), goalNoticeNeverDispatched(), maintenanceNoticeAuthorized() (+3 more)

### Community 48 - "process.ts"
Cohesion: 0.12
Nodes (23): investigationEvidence(), investigationReady(), INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, InvestigationOptions, InvestigationReport, InvestigationRunner, runInvestigation() (+15 more)

### Community 49 - "enrollment-gate.ts"
Cohesion: 0.29
Nodes (9): assertEnrollable(), bindFeature(), currentApproval(), enrolled(), featureGate(), predecessorComplete(), reserveIdentity(), gateFeatureWork() (+1 more)

### Community 50 - "fact-bounds.ts"
Cohesion: 0.26
Nodes (15): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+7 more)

### Community 51 - "StageResult"
Cohesion: 0.15
Nodes (22): parksInJira(), harnessCloseout(), PASSING, verifyMergeActions(), assertMayMutate(), HarnessControl, withHarnessWork(), runHarnessStage() (+14 more)

### Community 52 - "requests.ts"
Cohesion: 0.10
Nodes (38): reconcileNoticeConfirmations(), Admission, admit(), IntakeContext, compatible(), dependencyCompletionKey(), dependencyEligibility(), DependencyStores (+30 more)

### Community 53 - "dependency-bots/adopt.ts"
Cohesion: 0.06
Nodes (73): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard, projectCards() (+65 more)

### Community 54 - "it-specialist.ts"
Cohesion: 0.09
Nodes (34): conversationReadbackReady(), queueConversationReadback(), syncOutbox(), projectSlackDeliveries(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint() (+26 more)

### Community 55 - "scheduler.ts"
Cohesion: 0.11
Nodes (20): fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch(), foreignWork(), WorkSlot (+12 more)

### Community 56 - "retire-external-delivery.ts"
Cohesion: 0.57
Nodes (5): completedPRReviews(), eligible(), mergedByOwner(), ownerSettles(), retireExternalDeliveries()

### Community 57 - "weekly-rollup.ts"
Cohesion: 0.17
Nodes (21): RollupResult, RollupResultSchema, ineffectiveLessons(), lastFriday(), ROLLUP_HISTORY, rollupDue(), RollupHooks, rollupPrompt() (+13 more)

### Community 58 - "Store"
Cohesion: 0.07
Nodes (27): JiraOperations, plain(), Clock, systemClock, DATA, applyConnectionSettings(), closeConnection(), optimizeOnOpen() (+19 more)

### Community 59 - "discovery-recovery.ts"
Cohesion: 0.29
Nodes (10): Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership, rawHash() (+2 more)

### Community 61 - "jira-time.ts"
Cohesion: 0.21
Nodes (12): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+4 more)

### Community 62 - "run-retrospective.ts"
Cohesion: 0.19
Nodes (18): acceptRetrospective(), busyMaintenanceIds(), retrospectivePrompt(), SUBJECT, RetrospectiveResultSchema, terminalCandidates(), triggerJobId(), harperFolder() (+10 more)

### Community 63 - "approval.ts"
Cohesion: 0.19
Nodes (20): approveFeature(), assertRetainedItems(), commandFeature(), createFeature(), featureById(), mutation(), reviewQuestions(), artifactPath() (+12 more)

### Community 66 - "knowledge-context.ts"
Cohesion: 0.24
Nodes (10): Bucket, knowledgeContext(), LESSON_LIMIT, lessonPurpose(), MAINTENANCE, MAX_LESSONS, PURPOSES, render() (+2 more)

### Community 67 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 68 - "session-bridge.ts"
Cohesion: 0.21
Nodes (9): claudeSessions(), codexSessions(), desktopSessions(), guardianReview(), LiveSession, loadedCodexSession(), openRollouts(), SessionBridge (+1 more)

### Community 70 - "office-lessons.ts"
Cohesion: 0.27
Nodes (9): normalizeStatement(), decideOfficeProposal(), now(), OfficeKnowledgeStore, proposeOfficeLessons(), retireOfficeLesson(), Input, promoteNoteLesson() (+1 more)

### Community 71 - "activation-recovery.ts"
Cohesion: 0.23
Nodes (22): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+14 more)

### Community 72 - "create-candidate.ts"
Cohesion: 0.31
Nodes (9): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+1 more)

### Community 75 - "worker-runtime.ts"
Cohesion: 0.07
Nodes (30): args, [cmd,...rawArgs], commands, key, projectIndex, diagnosticContext(), diagnosticSnapshot(), DELIVERY_CONCURRENCY (+22 more)

### Community 76 - "jira-publication.ts"
Cohesion: 0.17
Nodes (11): Assignment, Content, JiraFeaturePublisher, jiraText(), keyOf(), plainDescription(), Transition, FeaturePublisher (+3 more)

### Community 77 - "http/commands.ts"
Cohesion: 0.24
Nodes (14): retryRecipientLookup(), configureKnowledge(), declineLessonIssue(), reactivateLesson(), retireLesson(), mirrorOfficeKnowledge(), configureGoalNotices(), Settings (+6 more)

### Community 82 - ".transaction"
Cohesion: 0.15
Nodes (13): featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), recoverFeatures(), EvidenceSchema, helperInstallation(), readReview(), ReviewEvidence (+5 more)

### Community 83 - "retrospective-triggers.ts"
Cohesion: 0.22
Nodes (17): clip(), JobLike, recordCIBudget(), recordParked(), recordRepairBudget(), recordTechnicalBudget(), recordTicketParked(), recordTrigger() (+9 more)

### Community 86 - "artifact"
Cohesion: 0.11
Nodes (50): assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), reconcileCompletedConflictDraft(), routeReadyPostConflictPublication(), verifyInitialDraftConflictPreparation() (+42 more)

### Community 87 - "dependency-edges.ts"
Cohesion: 0.53
Nodes (4): assertFeatureDependencyOrder(), featureDependencyEdges(), key(), FeatureManifest

### Community 88 - "shared.ts"
Cohesion: 0.08
Nodes (30): ProjectReadiness, DailyCTOSummary, SchedulerState, itAgent(), itDiagnostics(), currentServices(), ServiceHealthPanel(), labels (+22 more)

### Community 89 - "TicketJob"
Cohesion: 0.13
Nodes (21): StageContext, GitHubDelivery, stageRole(), providerFacts(), retireInactiveDeliveries(), retireUnstartedDelivery(), unstartedDelivery(), queueCIDiagnosis() (+13 more)

### Community 92 - "retrospective-facts.ts"
Cohesion: 0.23
Nodes (11): ARTIFACT_LIMIT, clip(), LEDGER_STEPS, MAINTENANCE_LIMIT, maintenanceFacts(), MaintenancePacketSection, clip(), PACKET_LIMIT (+3 more)

### Community 95 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 97 - "maintenance-triggers.ts"
Cohesion: 0.36
Nodes (9): clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates(), maintenanceCompletedId(), maintenanceKey(), visibleMaintenanceTriggerIds(), TerminalCandidate (+1 more)

## Knowledge Gaps
- **341 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+336 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `remove-candidate.ts`, `github-context.ts`, `.emit`, `source-amendment.ts`, `queue-repairs.ts`, `scheduled-work.ts`, `Inspector.tsx`, `accept-stage-result.ts`, `github-delivery.ts`, `digest`, `maintenance.ts`, `run-accounting.ts`, `engine.ts`, `report.ts`, `conversations/conversations.ts`, `github-publication.ts`, `sanitize`, `scope-repair-resume.ts`, `features.ts`, `continuation-evidence.ts`, `notifications.ts`, `retrospective-subject.ts`, `knowledge.ts`, `.save`, `implementation-recovery.ts`, `agents.ts`, `cec/workflow.ts`, `time-scope.ts`, `migrations.ts`, `daily-cto.ts`, `workKey`, `coordination.ts`, `conversations/slack.ts`, `process.ts`, `enrollment-gate.ts`, `StageResult`, `requests.ts`, `dependency-bots/adopt.ts`, `it-specialist.ts`, `scheduler.ts`, `retire-external-delivery.ts`, `weekly-rollup.ts`, `discovery-recovery.ts`, `Offices`, `jira-time.ts`, `run-retrospective.ts`, `approval.ts`, `knowledge-context.ts`, `session-bridge.ts`, `office-lessons.ts`, `activation-recovery.ts`, `create-candidate.ts`, `worker-runtime.ts`, `jira-publication.ts`, `http/commands.ts`, `.transaction`, `retrospective-triggers.ts`, `artifact`, `dependency-edges.ts`, `TicketJob`, `retrospective-facts.ts`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._
- **Why does `TicketJob` connect `TicketJob` to `remove-candidate.ts`, `github-context.ts`, `source-amendment.ts`, `queue-repairs.ts`, `scheduled-work.ts`, `Inspector.tsx`, `accept-stage-result.ts`, `github-delivery.ts`, `digest`, `maintenance.ts`, `scope-repair-resume.ts`, `work-summary.ts`, `continuation-evidence.ts`, `retrospective-subject.ts`, `.save`, `implementation-recovery.ts`, `cec/workflow.ts`, `workKey`, `fact-bounds.ts`, `StageResult`, `requests.ts`, `dependency-bots/adopt.ts`, `it-specialist.ts`, `scheduler.ts`, `retire-external-delivery.ts`, `discovery-recovery.ts`, `activation-recovery.ts`, `create-candidate.ts`, `retrospective-triggers.ts`, `artifact`, `shared.ts`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `Role` connect `worker-runtime.ts` to `github-context.ts`, `.emit`, `PeoplePanel.tsx`, `App.tsx`, `scheduled-work.ts`, `Inspector.tsx`, `accept-stage-result.ts`, `OfficeScene.tsx`, `github-delivery.ts`, `maintenance.ts`, `run-accounting.ts`, `conversations/conversations.ts`, `retrospective-subject.ts`, `agents.ts`, `model-routes.ts`, `cec/workflow.ts`, `StageResult`, `scheduler.ts`, `Store`, `http/commands.ts`, `shared.ts`, `TicketJob`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `command()` (e.g. with `.constructor()` and `executeRequest()`) actually correct?**
  _`command()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _341 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `.emit` be split into smaller, more focused modules?**
  _Cohesion score 0.06236786469344609 - nodes in this community are weakly interconnected._
- **Should `useOfficePreferences.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10837438423645321 - nodes in this community are weakly interconnected._