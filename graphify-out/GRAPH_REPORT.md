# Graph Report - the-office  (2026-11-08)

## Corpus Check
- 459 files · ~220,815 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2680 nodes · 11275 edges · 96 communities (93 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 64 edges (avg confidence: 0.74)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f738afef`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- remove-candidate.ts
- dependency-bots/adopt.ts
- Engine
- shared.ts
- source-amendment.ts
- artifact
- PeoplePanel.tsx
- Inspector.tsx
- cost-ledger.ts
- index.tsx
- github-delivery.ts
- OfficeScene.tsx
- ci-preparation.ts
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
- scope-repair-resume.ts
- QuestionRound.tsx
- work-summary.ts
- accept-stage-result.ts
- TelemetryPanel.tsx
- preferences-store.ts
- retrospective-subject.ts
- knowledge.ts
- .save
- TicketJob
- agents.ts
- it-specialist.ts
- Coordinator
- daily-cto.ts
- Role
- delivery-repairs.ts
- time-scope.ts
- assignment-poll.ts
- record-trigger.ts
- run-accounting.ts
- sanitize
- retrospective-triggers.ts
- GitHubMonitor
- coordination.ts
- ledger.ts
- run.ts
- outbox.ts
- implementation-recovery.ts
- publish-pr.ts
- dependencies.ts
- tracking-issue.ts
- engine.ts
- Store
- coordination-tick.ts
- weekly-rollup.ts
- store.ts
- work.ts
- Offices
- jira-time.ts
- retrospective-facts.ts
- features/workflow.ts
- evidence.ts
- codex-rollout.ts
- knowledge-context.ts
- command
- session-bridge.ts
- cli.ts
- cec/workflow.ts
- activation-recovery.ts
- validate-stage.ts
- helper-evidence.py
- worker-runtime.ts
- jira-publication.ts
- http/commands.ts
- MaintenanceRun
- codex-rollout-file.ts
- .getEffect
- .value
- Feature
- TimeBook.tsx
- features.ts
- recordApproach
- delivery-recoveries.ts
- dependency-edges.ts
- recovery-ledger.ts
- maintenance-triggers.ts
- time-readback.ts
- run-usage.ts
- jira-operations.ts
- CTOReview.tsx
- OfficeConfigView.tsx
- slack-supersession.ts

## God Nodes (most connected - your core abstractions)
1. `Store` - 246 edges
2. `TicketJob` - 116 edges
3. `GitHubDelivery` - 112 edges
4. `command()` - 89 edges
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

## Communities (96 total, 3 thin omitted)

### Community 0 - "remove-candidate.ts"
Cohesion: 0.20
Nodes (16): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+8 more)

### Community 1 - "dependency-bots/adopt.ts"
Cohesion: 0.16
Nodes (25): readBackOrThrow(), adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR, openDependabotPulls() (+17 more)

### Community 2 - "Engine"
Cohesion: 0.09
Nodes (5): correlatedBuild(), Engine, observe(), observeParked(), parkedReadError

### Community 3 - "shared.ts"
Cohesion: 0.06
Nodes (42): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, slackHealth(), ProjectReadiness (+34 more)

### Community 4 - "source-amendment.ts"
Cohesion: 0.06
Nodes (68): DeliveryTaskInput, DISCOVERY_GUIDANCE, adoptCandidate(), reported, Scope, approvedText(), assert(), AMENDMENT_REVIEW_PROOF (+60 more)

### Community 5 - "artifact"
Cohesion: 0.09
Nodes (59): advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat(), assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate() (+51 more)

### Community 6 - "PeoplePanel.tsx"
Cohesion: 0.11
Nodes (36): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+28 more)

### Community 7 - "Inspector.tsx"
Cohesion: 0.05
Nodes (57): CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants, ElevatorPhase, floorVariants, leftDoor, OfficeScene (+49 more)

### Community 8 - "cost-ledger.ts"
Cohesion: 0.16
Nodes (25): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId(), OutsideEdit (+17 more)

### Community 9 - "index.tsx"
Cohesion: 0.08
Nodes (59): SendMessage, slackMessageStatus(), SlackDeliveryCard(), phases, LinkedFeatures(), labels, ServiceHealthRow(), LessonsPanel() (+51 more)

### Community 10 - "github-delivery.ts"
Cohesion: 0.07
Nodes (69): findingsBlock(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery(), BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE (+61 more)

### Community 11 - "OfficeScene.tsx"
Cohesion: 0.06
Nodes (54): itAgent(), itDiagnostics(), githubStageLabels, withoutElapsed(), Avatar(), AzureWall(), Chair(), Coworker() (+46 more)

### Community 12 - "ci-preparation.ts"
Cohesion: 0.23
Nodes (11): developerPRContent(), Execute, lintPRContent(), officePRContent(), prContent, ciCheckout(), verifyCIHooks(), prepareCIMetadataRepair() (+3 more)

### Community 13 - "digest"
Cohesion: 0.09
Nodes (55): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+47 more)

### Community 14 - "maintenance.ts"
Cohesion: 0.10
Nodes (26): maintenancePolicies(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice(), candidateOwner(), SETTLED (+18 more)

### Community 15 - "telemetry.ts"
Cohesion: 0.11
Nodes (21): CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL, Rates (+13 more)

### Community 16 - "scheduled-work.ts"
Cohesion: 0.29
Nodes (13): deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), preparationRequestResolved(), withAmendmentOwnership(), deterministicActions, eligible(), requestResolved() (+5 more)

### Community 17 - "index.ts"
Cohesion: 0.09
Nodes (33): close(), config, itSpecialist, loadedRevision, offices, releaseLock, server, serviceHealth (+25 more)

### Community 18 - "report.ts"
Cohesion: 0.33
Nodes (11): Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked(), row() (+3 more)

### Community 19 - "SettingsPanel.tsx"
Cohesion: 0.13
Nodes (30): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS, PickupForm(), acceptPreferences() (+22 more)

### Community 20 - "conversations/conversations.ts"
Cohesion: 0.10
Nodes (27): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, ReplySchema, pumpCTO(), queueCTOHandoff(), saveGoals() (+19 more)

### Community 21 - "github-publication.ts"
Cohesion: 0.18
Nodes (11): Assign, Board, Content, GitHubFeaturePublisher, number(), same(), FeaturePublisher, label() (+3 more)

### Community 22 - "azure.ts"
Cohesion: 0.10
Nodes (31): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+23 more)

### Community 23 - "scope-repair-resume.ts"
Cohesion: 0.16
Nodes (35): containedFile(), continuationWorkerProof(), Assessment, outsideScanSources(), Ownership, reconcileScopeRepairReadback(), requireThat(), scopeRepairReadbackCandidate() (+27 more)

### Community 24 - "QuestionRound.tsx"
Cohesion: 0.57
Nodes (5): FeatureRound, draftKey(), readDraft(), saveDraft(), QuestionRound()

### Community 25 - "work-summary.ts"
Cohesion: 0.11
Nodes (32): compactSteps(), Outbox(), themeColor, App(), TicketDetail(), envelopeCard, deliveryRepairProjection(), DependencyNotice() (+24 more)

### Community 26 - "accept-stage-result.ts"
Cohesion: 0.12
Nodes (38): acceptStageResult(), mergeAuthorized(), allowed, continuationNativeReview(), continuationReviewArtifacts(), continuationWorktree(), negativeWorker(), savedNegativeContinuationReview() (+30 more)

### Community 27 - "TelemetryPanel.tsx"
Cohesion: 0.20
Nodes (18): TelemetryReport, TelemetrySync, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens(), usd() (+10 more)

### Community 28 - "preferences-store.ts"
Cohesion: 0.19
Nodes (10): PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, SettingsPanel(), OFFICE_PREFERENCE_DEFAULTS (+2 more)

### Community 29 - "retrospective-subject.ts"
Cohesion: 0.21
Nodes (13): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+5 more)

### Community 30 - "knowledge.ts"
Cohesion: 0.12
Nodes (23): Accepted, RETROSPECTIVE_HISTORY, Kind, RetrospectiveResult, Stage, SEEDS, KnowledgeRetry, KnowledgeState (+15 more)

### Community 31 - ".save"
Cohesion: 0.24
Nodes (23): BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue(), readIssues(), commentDecision() (+15 more)

### Community 32 - "TicketJob"
Cohesion: 0.08
Nodes (22): dependabotReviewGuidance(), StageContext, GitHubDelivery, stageRole(), completedPRReviews(), implementationContinuationInstruction(), eligible(), mergedByOwner() (+14 more)

### Community 33 - "agents.ts"
Cohesion: 0.08
Nodes (42): cecPrompt(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), resolvedDecisionNote(), stageInstructions, cecChatPrompt() (+34 more)

### Community 34 - "it-specialist.ts"
Cohesion: 0.23
Nodes (12): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), ITContext, readBackConversations(), publishITReport(), delays, recoverAttempt() (+4 more)

### Community 35 - "Coordinator"
Cohesion: 0.08
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 36 - "daily-cto.ts"
Cohesion: 0.07
Nodes (40): collectCTOFacts(), DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), dailyReviewDate(), reviewWeekday(), boundedIntake() (+32 more)

### Community 37 - "Role"
Cohesion: 0.17
Nodes (16): ROLES, DELIVERY_CONCURRENCY, file, project, root, DeliverySlot, officeCapacity, projectById() (+8 more)

### Community 38 - "delivery-repairs.ts"
Cohesion: 0.18
Nodes (21): parksInJira(), run(), namedRepairIds(), DECISION_KINDS, needsDecision(), approachFingerprint(), enqueueRepairDiagnosis(), githubRepairEligible() (+13 more)

### Community 39 - "time-scope.ts"
Cohesion: 0.14
Nodes (31): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence(), CaptureContext (+23 more)

### Community 40 - "assignment-poll.ts"
Cohesion: 0.19
Nodes (14): noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), admitReadyCards(), WAIT_STATUSES, pinCourier, due(), unparkReleasedWaits() (+6 more)

### Community 41 - "record-trigger.ts"
Cohesion: 0.18
Nodes (18): clip(), JobLike, recordCIBudget(), recordParked(), recordRepairBudget(), recordTicketParked(), recordTrigger(), subjectOf() (+10 more)

### Community 42 - "run-accounting.ts"
Cohesion: 0.12
Nodes (24): BoundedRead, backfillClaudeCost(), CompletionReader, readCodexRollout(), HELPER_STDOUT_MAX_BYTES, helperAccounting(), claudeAccounting(), codexAccounting() (+16 more)

### Community 43 - "sanitize"
Cohesion: 0.09
Nodes (32): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR (+24 more)

### Community 44 - "retrospective-triggers.ts"
Cohesion: 0.20
Nodes (18): acceptRetrospective(), busyMaintenanceIds(), RetrospectiveResultSchema, completedId(), JobRef, retiredId(), terminalCandidates(), ticketCompletedId() (+10 more)

### Community 46 - "coordination.ts"
Cohesion: 0.16
Nodes (20): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation(), maintenanceSuperseded(), REOBSERVED (+12 more)

### Community 47 - "ledger.ts"
Cohesion: 0.41
Nodes (7): partialLocalCleanupKey(), investigationCandidates(), investigationId(), investigationFollowUps(), investigationResolution(), syncInvestigations(), ITInvestigation

### Community 48 - "run.ts"
Cohesion: 0.36
Nodes (8): investigationReady(), INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, InvestigationOptions, InvestigationReport, InvestigationRunner, runInvestigation(), scheduledInvestigations()

### Community 49 - "outbox.ts"
Cohesion: 0.16
Nodes (20): MessageInput, conversationResolved(), projectOutbox(), syncOutbox(), projectSlackDeliveries(), Input, supersedeSlackDelivery(), replacementContext() (+12 more)

### Community 50 - "implementation-recovery.ts"
Cohesion: 0.11
Nodes (33): recordJobApproach(), continuationScope(), Assessment, diagnosticProof(), discoveryRecoveryCandidate(), ownedArtifact(), Ownership, rawHash() (+25 more)

### Community 51 - "publish-pr.ts"
Cohesion: 0.18
Nodes (23): harnessCloseout(), PASSING, verifyMergeActions(), activeEffectId(), harnessEffect, assertMayMutate(), retryRead(), runHarnessStage() (+15 more)

### Community 52 - "dependencies.ts"
Cohesion: 0.28
Nodes (15): Admission, admit(), IntakeContext, compatible(), dependencyCompletionKey(), dependencyEligibility(), DependencyStores, issueKey() (+7 more)

### Community 53 - "tracking-issue.ts"
Cohesion: 0.19
Nodes (24): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard, projectCards() (+16 more)

### Community 54 - "engine.ts"
Cohesion: 0.23
Nodes (15): checkMail(), drainMail(), requestMail(), dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), resume() (+7 more)

### Community 55 - "Store"
Cohesion: 0.10
Nodes (15): discoveryPrompt(), planPrompt(), beginReader(), importReview(), reconcileNativeDelivery(), fifo(), ScheduledWork, Scheduler (+7 more)

### Community 56 - "coordination-tick.ts"
Cohesion: 0.16
Nodes (16): PrerequisitesSchema, brainCheckpointCompletion(), reconcileCompletedCheckpoints(), legacy, reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION (+8 more)

### Community 57 - "weekly-rollup.ts"
Cohesion: 0.24
Nodes (14): RollupResult, RollupResultSchema, RETROSPECTIVE_TIMEOUT, ineffectiveLessons(), lastFriday(), ROLLUP_HISTORY, rollupDue(), RollupHooks (+6 more)

### Community 58 - "store.ts"
Cohesion: 0.13
Nodes (20): Clock, EASTERN, easternDayFormatter, easternPartsFormatter, systemClock, sanitizeObject(), applyConnectionSettings(), closeConnection() (+12 more)

### Community 59 - "work.ts"
Cohesion: 0.18
Nodes (10): AssignmentResult, CompletionCondition, Continuation, DependencyObservation, EligibilityState, FailureCategory, ReconciliationAction, WorkAssignment (+2 more)

### Community 61 - "jira-time.ts"
Cohesion: 0.24
Nodes (10): data(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), publishableEntry(), settlementPending() (+2 more)

### Community 62 - "retrospective-facts.ts"
Cohesion: 0.18
Nodes (14): ARTIFACT_LIMIT, clip(), LEDGER_STEPS, MAINTENANCE_LIMIT, maintenanceFacts(), MaintenancePacketSection, clip(), PACKET_LIMIT (+6 more)

### Community 63 - "features/workflow.ts"
Cohesion: 0.15
Nodes (30): approveFeature(), assertRetainedItems(), commandFeature(), createFeature(), featureById(), mutation(), reviewQuestions(), artifactPath() (+22 more)

### Community 64 - "evidence.ts"
Cohesion: 0.54
Nodes (6): investigationEvidence(), done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf()

### Community 65 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 66 - "knowledge-context.ts"
Cohesion: 0.24
Nodes (10): Bucket, knowledgeContext(), LESSON_LIMIT, lessonPurpose(), MAINTENANCE, MAX_LESSONS, PURPOSES, render() (+2 more)

### Community 67 - "command"
Cohesion: 0.14
Nodes (12): Assessment, CommandRegistry, CommandScope, inside(), RegisteredCommand, GIT_NETWORK, LIVE_PROVIDERS, liveReach() (+4 more)

### Community 68 - "session-bridge.ts"
Cohesion: 0.23
Nodes (9): claudeSessions(), codexSessions(), desktopSessions(), guardianReview(), LiveSession, loadedCodexSession(), openRollouts(), SessionBridge (+1 more)

### Community 69 - "cli.ts"
Cohesion: 0.25
Nodes (6): args, [cmd,...rawArgs], commands, key, projectIndex, PORT

### Community 70 - "cec/workflow.ts"
Cohesion: 0.29
Nodes (10): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), publicationEvidenceGap(), qaEvidenceGap(), resultGate(), stageResultGap(), unresolvedVerification() (+2 more)

### Community 71 - "activation-recovery.ts"
Cohesion: 0.14
Nodes (31): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+23 more)

### Community 72 - "validate-stage.ts"
Cohesion: 0.16
Nodes (17): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+9 more)

### Community 75 - "worker-runtime.ts"
Cohesion: 0.09
Nodes (26): SlackResultSchema, SlackVerificationSchema, LOCAL_BINDINGS, contextPacket(), CODEX_DEFAULT_EFFORT, CODEX_DEFAULT_MODEL, CODEX_EFFORTS, CODEX_ROLES (+18 more)

### Community 76 - "jira-publication.ts"
Cohesion: 0.25
Nodes (8): Assignment, Content, JiraFeaturePublisher, jiraText(), keyOf(), plainDescription(), Transition, PublicationReceipt

### Community 77 - "http/commands.ts"
Cohesion: 0.13
Nodes (24): configureNotices(), NoticeSettings, retryRecipientLookup(), bindDiscoveryResume(), DiscoveryResumeInput, normalizeStatement(), configureKnowledge(), declineLessonIssue() (+16 more)

### Community 78 - "MaintenanceRun"
Cohesion: 0.14
Nodes (10): BrainFollowup, Result, BrainStatusSchema, identity, coverageSchema, followupSchema, verified, ReconciliationRequest (+2 more)

### Community 79 - "codex-rollout-file.ts"
Cohesion: 0.36
Nodes (7): codexHome(), createdAt(), dayDirs(), header(), ROLLOUT_MAX_BYTES, RolloutScan, scanCodexRollouts()

### Community 80 - ".getEffect"
Cohesion: 0.22
Nodes (8): publishFeature(), GitHubOperations, fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), closeNativeRefresh(), fingerprint(), EffectIntent

### Community 81 - ".value"
Cohesion: 0.24
Nodes (6): file, folder, logs, root, xml(), ProjectProgress

### Community 82 - "Feature"
Cohesion: 0.18
Nodes (13): featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), recoverFeatures(), EvidenceSchema, helperInstallation(), readReview(), ReviewEvidence (+5 more)

### Community 83 - "TimeBook.tsx"
Cohesion: 0.15
Nodes (22): displayAgentTask(), LiveAgentTask(), Props, RunningTask(), text(), AzureBuild, lastWall, sample() (+14 more)

### Community 84 - "features.ts"
Cohesion: 0.13
Nodes (20): featureEffectGate(), assertEnrollable(), assertFeatureGate(), bindFeature(), currentApproval(), enrolled(), featureGate(), predecessorComplete() (+12 more)

### Community 85 - "recordApproach"
Cohesion: 0.31
Nodes (10): advance(), nextStage(), afterDraft(), firstBuildStage(), missingApproachStage(), plannedNext(), recordApproach(), reroute() (+2 more)

### Community 86 - "delivery-recoveries.ts"
Cohesion: 0.23
Nodes (12): savedActivationFailure(), candidateInput(), children, oldAdoptionBasis(), savedCandidateAdmission, postConflictReadbackCandidate(), preparationReadbackCandidate(), validationReadbackCandidate() (+4 more)

### Community 87 - "dependency-edges.ts"
Cohesion: 1.00
Nodes (3): assertFeatureDependencyOrder(), featureDependencyEdges(), key()

### Community 88 - "recovery-ledger.ts"
Cohesion: 0.38
Nodes (7): savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), diagnosticSnapshot(), nativeDeliveryResolved(), reconcileRecoveryLedger()

### Community 89 - "maintenance-triggers.ts"
Cohesion: 0.36
Nodes (9): clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates(), maintenanceCompletedId(), maintenanceKey(), visibleMaintenanceTriggerIds(), TerminalCandidate (+1 more)

### Community 90 - "time-readback.ts"
Cohesion: 0.22
Nodes (8): Readback, READBACK_INTERVAL_MS, SETTLE_MS, ConfirmedSegment, LiveAnchor, ObservationGap, SnapshotOrdering, TimePublication

### Community 91 - "run-usage.ts"
Cohesion: 0.32
Nodes (6): CodexRollout, claudeCrashZero(), claudeUsage(), codexUsage(), count(), RunUsage

### Community 92 - "jira-operations.ts"
Cohesion: 0.47
Nodes (3): JiraOperations, plain(), unpack()

### Community 93 - "CTOReview.tsx"
Cohesion: 0.38
Nodes (4): CTOReview(), goalState, reviewExcerpt(), ReviewText()

### Community 94 - "OfficeConfigView.tsx"
Cohesion: 0.48
Nodes (5): loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView(), OfficeConfigSummary

### Community 95 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

## Knowledge Gaps
- **335 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+330 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `remove-candidate.ts`, `dependency-bots/adopt.ts`, `Engine`, `shared.ts`, `source-amendment.ts`, `artifact`, `cost-ledger.ts`, `github-delivery.ts`, `digest`, `maintenance.ts`, `scheduled-work.ts`, `index.ts`, `conversations/conversations.ts`, `github-publication.ts`, `azure.ts`, `scope-repair-resume.ts`, `accept-stage-result.ts`, `retrospective-subject.ts`, `knowledge.ts`, `.save`, `TicketJob`, `agents.ts`, `it-specialist.ts`, `Coordinator`, `daily-cto.ts`, `Role`, `delivery-repairs.ts`, `time-scope.ts`, `record-trigger.ts`, `run-accounting.ts`, `sanitize`, `retrospective-triggers.ts`, `GitHubMonitor`, `coordination.ts`, `ledger.ts`, `run.ts`, `outbox.ts`, `implementation-recovery.ts`, `publish-pr.ts`, `dependencies.ts`, `tracking-issue.ts`, `engine.ts`, `coordination-tick.ts`, `weekly-rollup.ts`, `store.ts`, `jira-time.ts`, `retrospective-facts.ts`, `features/workflow.ts`, `evidence.ts`, `knowledge-context.ts`, `command`, `session-bridge.ts`, `activation-recovery.ts`, `validate-stage.ts`, `worker-runtime.ts`, `jira-publication.ts`, `http/commands.ts`, `MaintenanceRun`, `.getEffect`, `.value`, `Feature`, `features.ts`, `delivery-recoveries.ts`, `dependency-edges.ts`, `recovery-ledger.ts`, `time-readback.ts`, `jira-operations.ts`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **Why does `GitHubDelivery` connect `TicketJob` to `agents.ts`, `Engine`, `Coordinator`, `source-amendment.ts`, `artifact`, `activation-recovery.ts`, `assignment-poll.ts`, `validate-stage.ts`, `github-delivery.ts`, `ci-preparation.ts`, `digest`, `implementation-recovery.ts`, `publish-pr.ts`, `dependencies.ts`, `features.ts`, `delivery-recoveries.ts`, `scope-repair-resume.ts`, `accept-stage-result.ts`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `command()` connect `command` to `remove-candidate.ts`, `Engine`, `shared.ts`, `cost-ledger.ts`, `github-delivery.ts`, `ci-preparation.ts`, `digest`, `maintenance.ts`, `github-publication.ts`, `azure.ts`, `.save`, `TicketJob`, `agents.ts`, `it-specialist.ts`, `Coordinator`, `delivery-repairs.ts`, `sanitize`, `GitHubMonitor`, `coordination.ts`, `implementation-recovery.ts`, `publish-pr.ts`, `dependencies.ts`, `tracking-issue.ts`, `engine.ts`, `Store`, `jira-time.ts`, `features/workflow.ts`, `session-bridge.ts`, `activation-recovery.ts`, `validate-stage.ts`, `worker-runtime.ts`, `jira-publication.ts`, `MaintenanceRun`, `.getEffect`, `.value`, `Feature`, `time-readback.ts`, `jira-operations.ts`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `command()` (e.g. with `.constructor()` and `executeRequest()`) actually correct?**
  _`command()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _335 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Engine` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._
- **Should `shared.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0647307924984876 - nodes in this community are weakly interconnected._