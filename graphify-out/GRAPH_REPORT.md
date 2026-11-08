# Graph Report - the-office  (2026-11-08)

## Corpus Check
- 475 files · ~225,422 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2741 nodes · 11449 edges · 87 communities (85 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 66 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `30d7c931`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- remove-candidate.ts
- Store
- engine.ts
- useOfficePreferences.ts
- source-amendment.ts
- TicketJob
- PeoplePanel.tsx
- App.tsx
- cost-ledger.ts
- Inspector.tsx
- github-delivery.ts
- OfficeScene.tsx
- github-publication.ts
- continuation-evidence.ts
- maintenance.ts
- telemetry.ts
- jira-publication.ts
- index.ts
- WorkTime
- LessonsPanel.tsx
- conversations/conversations.ts
- Engine
- azure.ts
- digest
- outbox.ts
- work-summary.ts
- scheduled-work.ts
- TimeBook.tsx
- harnessEffect
- retrospective-subject.ts
- knowledge.ts
- .save
- activation-recovery.ts
- agents.ts
- notifications.ts
- Coordinator
- daily-cto.ts
- FeatureWorkspace.tsx
- cec/workflow.ts
- time-scope.ts
- supersedingDelivery
- .run
- assignment-poll.ts
- time-classification.ts
- .transaction
- workKey
- coordination.ts
- Ticket
- process.ts
- features.ts
- retrospective-facts.ts
- run-retrospective.ts
- dependencies.ts
- dependency-bots/adopt.ts
- it-specialist.ts
- Role
- DailyCTO.tsx
- weekly-rollup.ts
- store.ts
- migrations.ts
- Offices
- jira-time.ts
- command-registry.ts
- read-retries.ts
- effects.ts
- run.ts
- knowledge-context.ts
- run-evidence.ts
- session-bridge.ts
- office-lessons.ts
- validate-stage.ts
- helper-evidence.py
- work.ts
- .emit
- coordination-tick.ts
- evidence.ts
- MaintenanceRun
- retrospective-triggers.ts
- tracking-issue.ts
- artifact
- shared.ts
- publish-pr.ts
- run-accounting.ts
- codex-rollout.ts
- slack-supersession.ts
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

## Communities (87 total, 2 thin omitted)

### Community 0 - "remove-candidate.ts"
Cohesion: 0.20
Nodes (16): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+8 more)

### Community 1 - "Store"
Cohesion: 0.07
Nodes (21): JiraOperations, plain(), unpack(), StagePromptInput, assertFeatureDependencyOrder(), featureDependencyEdges(), key(), Assessment (+13 more)

### Community 2 - "engine.ts"
Cohesion: 0.15
Nodes (25): checkMail(), drainMail(), requestMail(), dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), resume() (+17 more)

### Community 3 - "useOfficePreferences.ts"
Cohesion: 0.11
Nodes (20): PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, acceptPreferences(), PreferenceCandidate, PreferenceState (+12 more)

### Community 4 - "source-amendment.ts"
Cohesion: 0.06
Nodes (74): deliveryTask(), DeliveryTaskInput, DISCOVERY_GUIDANCE, stagePrompt(), compactSteps(), adoptCandidate(), reported, Scope (+66 more)

### Community 5 - "TicketJob"
Cohesion: 0.07
Nodes (35): dependabotReviewGuidance(), StageContext, GitHubDelivery, stageRole(), checksFailed(), checksPassed(), checksPending(), CurrentChecksWait (+27 more)

### Community 6 - "PeoplePanel.tsx"
Cohesion: 0.11
Nodes (37): label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+29 more)

### Community 7 - "App.tsx"
Cohesion: 0.05
Nodes (47): SendMessage, blank(), goalInput, Goals(), CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants (+39 more)

### Community 8 - "cost-ledger.ts"
Cohesion: 0.16
Nodes (26): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress(), effectId() (+18 more)

### Community 9 - "Inspector.tsx"
Cohesion: 0.08
Nodes (65): Conversation(), Outbox(), slackMessageStatus(), SlackDeliveryCard(), ServiceHealthPanel(), labels, ServiceHealthRow(), GoalList() (+57 more)

### Community 10 - "github-delivery.ts"
Cohesion: 0.09
Nodes (56): containedFile(), findingsBlock(), namedRepairIds(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery(), BOARD_RULE (+48 more)

### Community 11 - "OfficeScene.tsx"
Cohesion: 0.06
Nodes (58): displayAgentTask(), githubStageLabels, withoutElapsed(), LiveAgentTask(), Props, RunningTask(), text(), Avatar() (+50 more)

### Community 12 - "github-publication.ts"
Cohesion: 0.18
Nodes (13): Assign, Board, Content, GitHubFeaturePublisher, number(), same(), FeaturePublisher, PublicationReceipt (+5 more)

### Community 13 - "continuation-evidence.ts"
Cohesion: 0.07
Nodes (66): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+58 more)

### Community 14 - "maintenance.ts"
Cohesion: 0.10
Nodes (27): maintenancePolicies(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice(), candidateOwner(), SETTLED (+19 more)

### Community 15 - "telemetry.ts"
Cohesion: 0.11
Nodes (24): CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL, Rates (+16 more)

### Community 16 - "jira-publication.ts"
Cohesion: 0.26
Nodes (7): Assignment, Content, JiraFeaturePublisher, jiraText(), keyOf(), plainDescription(), Transition

### Community 17 - "index.ts"
Cohesion: 0.08
Nodes (37): args, [cmd,...rawArgs], commands, key, projectIndex, MessageInput, close(), config (+29 more)

### Community 18 - "WorkTime"
Cohesion: 0.16
Nodes (19): ConfirmedSegment, LiveAnchor, ObservationGap, SnapshotOrdering, TimeLedgerState, WorkTime, Acc, bump() (+11 more)

### Community 19 - "LessonsPanel.tsx"
Cohesion: 0.17
Nodes (24): LessonsPanel(), when(), SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS (+16 more)

### Community 20 - "conversations/conversations.ts"
Cohesion: 0.08
Nodes (31): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, ReplySchema, pumpCTO(), queueCTOHandoff(), saveGoals() (+23 more)

### Community 21 - "Engine"
Cohesion: 0.11
Nodes (5): correlatedBuild(), Engine, observe(), observeParked(), parkedReadError

### Community 22 - "azure.ts"
Cohesion: 0.08
Nodes (32): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+24 more)

### Community 23 - "digest"
Cohesion: 0.17
Nodes (30): Assessment, outsideScanSources(), Ownership, reconcileScopeRepairReadback(), requireThat(), scopeRepairReadbackCandidate(), scopeRepairRequestResolved(), sha (+22 more)

### Community 24 - "outbox.ts"
Cohesion: 0.20
Nodes (15): conversationResolved(), projectOutbox(), syncOutbox(), slackRequestSettled(), knowledgeOutbox(), checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup() (+7 more)

### Community 25 - "work-summary.ts"
Cohesion: 0.15
Nodes (23): themeColor, App(), usePanelFocus(), demoSnapshot(), deliveryRepairProjection(), card, InboxQueue(), ACTIVE (+15 more)

### Community 26 - "scheduled-work.ts"
Cohesion: 0.29
Nodes (11): deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), deterministicActions, eligible() (+3 more)

### Community 27 - "TimeBook.tsx"
Cohesion: 0.10
Nodes (35): TelemetryReport, AzureBuild, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens(), usd() (+27 more)

### Community 28 - "harnessEffect"
Cohesion: 0.24
Nodes (15): harnessCloseout(), PASSING, verifyMergeActions(), activeEffectId(), harnessEffect, assertMayMutate(), runHarnessStage(), harnessStageResult() (+7 more)

### Community 29 - "retrospective-subject.ts"
Cohesion: 0.21
Nodes (14): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, maintenanceKey(), azurePrUrl(), findSubject(), jobSubject() (+6 more)

### Community 30 - "knowledge.ts"
Cohesion: 0.11
Nodes (24): retrospectivePrompt(), SUBJECT, Kind, RetrospectiveResultSchema, Stage, SEEDS, DeliveryMetrics, KnowledgeRetry (+16 more)

### Community 31 - ".save"
Cohesion: 0.09
Nodes (35): file, folder, logs, root, xml(), BLOCKED, Execute, findComment() (+27 more)

### Community 32 - "activation-recovery.ts"
Cohesion: 0.08
Nodes (60): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+52 more)

### Community 33 - "agents.ts"
Cohesion: 0.10
Nodes (31): cecPrompt(), resolvedDecisionNote(), stageInstructions, SlackResultSchema, SlackVerificationSchema, HANDS_OFF_RESOLUTION_GUIDANCE, RESOLUTION_GUIDANCE, APPROACH_GUIDANCE (+23 more)

### Community 34 - "notifications.ts"
Cohesion: 0.11
Nodes (23): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR (+15 more)

### Community 35 - "Coordinator"
Cohesion: 0.08
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 36 - "daily-cto.ts"
Cohesion: 0.06
Nodes (45): collectCTOFacts(), DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), dailyReviewDate(), reviewWeekday(), boundedIntake() (+37 more)

### Community 37 - "FeatureWorkspace.tsx"
Cohesion: 0.18
Nodes (15): FeatureRound, FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures(), draftKey() (+7 more)

### Community 38 - "cec/workflow.ts"
Cohesion: 0.14
Nodes (28): parksInJira(), MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), run(), advance(), nextStage(), publicationEvidenceGap() (+20 more)

### Community 39 - "time-scope.ts"
Cohesion: 0.16
Nodes (24): easternDay(), easternInstant(), CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector() (+16 more)

### Community 40 - "supersedingDelivery"
Cohesion: 0.26
Nodes (13): projectSlackDeliveries(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint(), supersedingDelivery(), diagnosticSnapshot(), investigationCandidates() (+5 more)

### Community 41 - ".run"
Cohesion: 0.15
Nodes (13): CODEX_DEFAULT_EFFORT, CODEX_DEFAULT_MODEL, CODEX_EFFORTS, CODEX_ROLES, ModelRoute, qaPolicyRoute(), resolveModelRoute(), validModelSetting() (+5 more)

### Community 42 - "assignment-poll.ts"
Cohesion: 0.19
Nodes (14): noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), admitReadyCards(), WAIT_STATUSES, pinCourier, due(), unparkReleasedWaits() (+6 more)

### Community 43 - "time-classification.ts"
Cohesion: 0.20
Nodes (13): captureTime(), timeLedger(), artifact(), correctRecoveryClassification(), digest(), timeClassificationDigest(), TimeClassificationInput, TimeLedger (+5 more)

### Community 44 - ".transaction"
Cohesion: 0.28
Nodes (7): featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), recoverFeatures(), observeHelperGroups(), stopHelperGroups(), FeatureReviewRunner

### Community 45 - "workKey"
Cohesion: 0.17
Nodes (21): completedPRReviews(), continuationWorktree(), dependencyVersion(), handoffSavedPrerequisites(), hasSavedPrerequisiteResult(), Ownership, qualified(), readDependencies() (+13 more)

### Community 46 - "coordination.ts"
Cohesion: 0.18
Nodes (18): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation(), checkpointWindow(), dueAt() (+10 more)

### Community 47 - "Ticket"
Cohesion: 0.12
Nodes (19): cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), cecChatPrompt(), ctoChatPrompt(), itChatPrompt(), slackSendPrompt() (+11 more)

### Community 48 - "process.ts"
Cohesion: 0.16
Nodes (18): At, Errno, GroupInventory, GroupProbe, LifecycleDiagnostic, Phase, Pid, groupInventory() (+10 more)

### Community 49 - "features.ts"
Cohesion: 0.10
Nodes (47): approveFeature(), assertRetainedItems(), commandFeature(), createFeature(), featureById(), mutation(), reviewQuestions(), discoveryPrompt() (+39 more)

### Community 50 - "retrospective-facts.ts"
Cohesion: 0.22
Nodes (12): ARTIFACT_LIMIT, clip(), LEDGER_STEPS, MAINTENANCE_LIMIT, maintenanceFacts(), MaintenancePacketSection, clip(), PACKET_LIMIT (+4 more)

### Community 51 - "run-retrospective.ts"
Cohesion: 0.30
Nodes (10): busyMaintenanceIds(), triggerJobId(), KnowledgeRunner, KnowledgeRunOptions, RETROSPECTIVE_TIMEOUT, RetrospectiveRunner, runRetrospective(), busySubjects() (+2 more)

### Community 52 - "dependencies.ts"
Cohesion: 0.26
Nodes (16): Admission, admit(), IntakeContext, compatible(), dependencyCompletionKey(), dependencyEligibility(), DependencyStores, issueKey() (+8 more)

### Community 53 - "dependency-bots/adopt.ts"
Cohesion: 0.13
Nodes (27): readBackOrThrow(), adoptDependabot(), closesIssue(), linkedBody(), linkPR(), dependabotPR, openDependabotPulls(), readRepo() (+19 more)

### Community 54 - "it-specialist.ts"
Cohesion: 0.12
Nodes (22): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), partialLocalCleanupKey(), ITContext, readBackConversations(), publishITReport(), delays (+14 more)

### Community 55 - "Role"
Cohesion: 0.12
Nodes (20): ROLES, DATA, DELIVERY_CONCURRENCY, LOCAL_BINDINGS, file, project, root, contextPacket() (+12 more)

### Community 56 - "DailyCTO.tsx"
Cohesion: 0.26
Nodes (8): CTOReview(), goalState, DailyCTO(), GoalHistory(), reportDate(), reviewStatus, reviewExcerpt(), ReviewText()

### Community 57 - "weekly-rollup.ts"
Cohesion: 0.23
Nodes (15): RollupResult, RollupResultSchema, harperFolder(), retryDelay(), ineffectiveLessons(), lastFriday(), ROLLUP_HISTORY, rollupDue() (+7 more)

### Community 58 - "store.ts"
Cohesion: 0.13
Nodes (18): Clock, EASTERN, easternDayFormatter, easternPartsFormatter, systemClock, applyConnectionSettings(), closeConnection(), optimizeOnOpen() (+10 more)

### Community 59 - "migrations.ts"
Cohesion: 0.35
Nodes (9): clip(), maintenanceBlockedId(), maintenanceCandidates(), maintenanceCompletedId(), visibleMaintenanceTriggerIds(), seedProjectLessons(), migrateSnapshot(), resolveProjectLabel() (+1 more)

### Community 61 - "jira-time.ts"
Cohesion: 0.21
Nodes (13): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+5 more)

### Community 62 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 63 - "read-retries.ts"
Cohesion: 0.36
Nodes (7): PrerequisitesSchema, incompleteReadOutput(), IntakeResult, planReadRetry(), reconcileReadRetries(), WorkFailure, ReadRetry

### Community 64 - "effects.ts"
Cohesion: 0.38
Nodes (4): EffectOperation, Effects, EffectUncertainError, WorkRef

### Community 65 - "run.ts"
Cohesion: 0.20
Nodes (15): OFFICE_FIX_PROMPT, OfficeFixResult, validateOfficeFix(), investigationReady(), INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, InvestigationOptions, InvestigationReport (+7 more)

### Community 66 - "knowledge-context.ts"
Cohesion: 0.24
Nodes (10): Bucket, knowledgeContext(), LESSON_LIMIT, lessonPurpose(), MAINTENANCE, MAX_LESSONS, PURPOSES, render() (+2 more)

### Community 67 - "run-evidence.ts"
Cohesion: 0.67
Nodes (3): comparable(), EvidenceOutcome, recordRunEvidence()

### Community 68 - "session-bridge.ts"
Cohesion: 0.14
Nodes (21): claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexSessionContext(), readRollout, claudeSessions(), codexSessions() (+13 more)

### Community 70 - "office-lessons.ts"
Cohesion: 0.22
Nodes (13): Accepted, acceptRetrospective(), normalizeStatement(), RETROSPECTIVE_HISTORY, decideOfficeProposal(), now(), OfficeKnowledgeStore, proposeOfficeLessons() (+5 more)

### Community 72 - "validate-stage.ts"
Cohesion: 0.17
Nodes (16): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+8 more)

### Community 75 - "work.ts"
Cohesion: 0.20
Nodes (9): AssignmentResult, CompletionCondition, Continuation, DependencyObservation, EligibilityState, FailureCategory, ReconciliationAction, WorkAssignment (+1 more)

### Community 77 - ".emit"
Cohesion: 0.15
Nodes (23): configureNotices(), retryRecipientLookup(), Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact() (+15 more)

### Community 78 - "coordination-tick.ts"
Cohesion: 0.16
Nodes (12): reconcileNoticeConfirmations(), BrainFollowup, Result, brainCheckpointCompletion(), reconcileCompletedCheckpoints(), legacy, reconcileContinuations(), pruneCompletedReads() (+4 more)

### Community 79 - "evidence.ts"
Cohesion: 0.33
Nodes (9): investigationEvidence(), OFFICE_SOURCE_PATHS, officeSource(), done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf() (+1 more)

### Community 80 - "MaintenanceRun"
Cohesion: 0.21
Nodes (9): BrainStatusSchema, identity, parseBrainStatus(), coverageSchema, followupSchema, verified, ReconciliationRequest, DailyCheckpoint (+1 more)

### Community 83 - "retrospective-triggers.ts"
Cohesion: 0.16
Nodes (24): configureKnowledge(), MaintenanceCandidate, clip(), JobLike, recordCIBudget(), recordParked(), recordRepairBudget(), recordTicketParked() (+16 more)

### Community 84 - "tracking-issue.ts"
Cohesion: 0.19
Nodes (25): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard, projectCards() (+17 more)

### Community 86 - "artifact"
Cohesion: 0.07
Nodes (86): partialLocalCleanupCandidate(), savedActivationFailure(), advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat(), candidateInput() (+78 more)

### Community 88 - "shared.ts"
Cohesion: 0.08
Nodes (30): ProjectReadiness, DailyCTOSummary, SchedulerState, recommendedReply(), itAgent(), itDiagnostics(), currentServices(), loadOfficeConfig() (+22 more)

### Community 89 - "publish-pr.ts"
Cohesion: 0.16
Nodes (19): retryRead(), developerPRContent(), Execute, lintPRContent(), officePRContent(), prContent, assertCandidate(), Candidate (+11 more)

### Community 90 - "run-accounting.ts"
Cohesion: 0.14
Nodes (20): BoundedRead, backfillClaudeCost(), CompletionReader, codexHome(), HELPER_STDOUT_MAX_BYTES, helperAccounting(), claudeAccounting(), COMPLETION_MAX_BYTES (+12 more)

### Community 93 - "codex-rollout.ts"
Cohesion: 0.16
Nodes (16): add(), CodexRequest, CodexRollout, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens() (+8 more)

### Community 95 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 98 - "codex-rollout-file.ts"
Cohesion: 0.36
Nodes (7): createdAt(), dayDirs(), header(), readCodexRollout(), ROLLOUT_MAX_BYTES, RolloutScan, scanCodexRollouts()

## Knowledge Gaps
- **346 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+341 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `remove-candidate.ts`, `engine.ts`, `source-amendment.ts`, `TicketJob`, `cost-ledger.ts`, `github-delivery.ts`, `github-publication.ts`, `continuation-evidence.ts`, `maintenance.ts`, `jira-publication.ts`, `index.ts`, `WorkTime`, `conversations/conversations.ts`, `azure.ts`, `digest`, `scheduled-work.ts`, `harnessEffect`, `retrospective-subject.ts`, `.save`, `activation-recovery.ts`, `agents.ts`, `notifications.ts`, `Coordinator`, `daily-cto.ts`, `cec/workflow.ts`, `time-scope.ts`, `supersedingDelivery`, `.run`, `time-classification.ts`, `.transaction`, `workKey`, `coordination.ts`, `Ticket`, `features.ts`, `retrospective-facts.ts`, `run-retrospective.ts`, `dependencies.ts`, `dependency-bots/adopt.ts`, `it-specialist.ts`, `Role`, `weekly-rollup.ts`, `store.ts`, `jira-time.ts`, `read-retries.ts`, `effects.ts`, `run.ts`, `knowledge-context.ts`, `run-evidence.ts`, `session-bridge.ts`, `office-lessons.ts`, `validate-stage.ts`, `.emit`, `coordination-tick.ts`, `evidence.ts`, `MaintenanceRun`, `retrospective-triggers.ts`, `tracking-issue.ts`, `artifact`, `shared.ts`, `publish-pr.ts`, `run-accounting.ts`?**
  _High betweenness centrality (0.104) - this node is a cross-community bridge._
- **Why does `command()` connect `Store` to `remove-candidate.ts`, `engine.ts`, `TicketJob`, `cost-ledger.ts`, `github-delivery.ts`, `github-publication.ts`, `continuation-evidence.ts`, `maintenance.ts`, `jira-publication.ts`, `Engine`, `azure.ts`, `harnessEffect`, `.save`, `activation-recovery.ts`, `agents.ts`, `notifications.ts`, `Coordinator`, `cec/workflow.ts`, `.run`, `time-classification.ts`, `coordination.ts`, `Ticket`, `process.ts`, `features.ts`, `dependencies.ts`, `it-specialist.ts`, `Role`, `jira-time.ts`, `command-registry.ts`, `effects.ts`, `session-bridge.ts`, `validate-stage.ts`, `coordination-tick.ts`, `tracking-issue.ts`, `artifact`, `publish-pr.ts`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `TicketJob` connect `TicketJob` to `remove-candidate.ts`, `Store`, `engine.ts`, `source-amendment.ts`, `Inspector.tsx`, `github-delivery.ts`, `continuation-evidence.ts`, `digest`, `work-summary.ts`, `harnessEffect`, `retrospective-subject.ts`, `.save`, `activation-recovery.ts`, `agents.ts`, `daily-cto.ts`, `workKey`, `dependencies.ts`, `dependency-bots/adopt.ts`, `it-specialist.ts`, `Role`, `validate-stage.ts`, `.emit`, `MaintenanceRun`, `retrospective-triggers.ts`, `tracking-issue.ts`, `artifact`, `shared.ts`, `publish-pr.ts`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `command()` (e.g. with `.constructor()` and `executeRequest()`) actually correct?**
  _`command()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _346 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Store` be split into smaller, more focused modules?**
  _Cohesion score 0.07482993197278912 - nodes in this community are weakly interconnected._
- **Should `engine.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14772727272727273 - nodes in this community are weakly interconnected._