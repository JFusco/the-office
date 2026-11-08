# Graph Report - fix-wiki-adoption  (2026-11-08)

## Corpus Check
- 460 files · ~221,370 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2687 nodes · 11290 edges · 99 communities (96 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 64 edges (avg confidence: 0.74)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `71ca3246`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- remove-candidate.ts
- dependency-bots/adopt.ts
- Engine
- shared.ts
- source-amendment-scope.ts
- artifact
- PeoplePanel.tsx
- App.tsx
- cost-ledger.ts
- Inspector.tsx
- github-delivery.ts
- OfficeScene.tsx
- run-ci-repair.ts
- digest
- maintenance.ts
- closeout.ts
- scheduled-work.ts
- api-routes.ts
- report.ts
- SettingsPanel.tsx
- conversations/conversations.ts
- GitHubFeaturePublisher
- goal-reporting.ts
- source-amendment.ts
- OfficeSnapshot
- work-summary.ts
- accept-stage-result.ts
- TimeBook.tsx
- preferences-store.ts
- retrospective-subject.ts
- knowledge.ts
- park-ticket.ts
- TicketJob
- agents.ts
- it-specialist.ts
- Coordinator
- daily-cto.ts
- Role
- ticket-stage-runner.ts
- time-scope.ts
- assignment-poll.ts
- retrospective-triggers.ts
- run-accounting.ts
- store.ts
- run-retrospective.ts
- office-lessons.ts
- coordination.ts
- ledger.ts
- azure.ts
- outbox.ts
- workKey
- publish-pr.ts
- dependencies.ts
- tracking-issue.ts
- engine.ts
- .save
- coordination-tick.ts
- weekly-rollup.ts
- control-store.ts
- work.ts
- Offices
- jira-time.ts
- retrospective-facts.ts
- .transaction
- http/context.ts
- discovery-recovery.ts
- knowledge-context.ts
- Store
- session-bridge.ts
- cli.ts
- cec/workflow.ts
- activation-recovery.ts
- create-candidate.ts
- helper-evidence.py
- worker-runtime.ts
- jira-publication.ts
- .emit
- checkpoint-completion.ts
- index.ts
- .getEffect
- .value
- review-run.ts
- command-registry.ts
- features.ts
- approach.ts
- featureById
- merge-summary.ts
- recovery-ledger.ts
- maintenance-triggers.ts
- WorkTime
- read-retries.ts
- JiraOperations
- DailyCTO.tsx
- sanitizeObject
- slack-supersession.ts
- needsDecision
- BrainFollowup
- highestStableAtLeast

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

## Communities (99 total, 3 thin omitted)

### Community 0 - "remove-candidate.ts"
Cohesion: 0.20
Nodes (16): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+8 more)

### Community 1 - "dependency-bots/adopt.ts"
Cohesion: 0.19
Nodes (22): adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR, inPickupLane(), openDependabotPulls() (+14 more)

### Community 2 - "Engine"
Cohesion: 0.09
Nodes (5): correlatedBuild(), Engine, observe(), observeParked(), parkedReadError

### Community 3 - "shared.ts"
Cohesion: 0.09
Nodes (25): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, slackHealth() (+17 more)

### Community 4 - "source-amendment-scope.ts"
Cohesion: 0.08
Nodes (39): approvedText(), assert(), assert(), normalize(), officialUrls, ReleaseCapture, verifyReleaseCaptures(), amendmentCaptureObservation() (+31 more)

### Community 5 - "artifact"
Cohesion: 0.10
Nodes (60): assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), reconcileCompletedConflictDraft(), routeReadyPostConflictPublication(), verifyInitialDraftConflictPreparation() (+52 more)

### Community 6 - "PeoplePanel.tsx"
Cohesion: 0.11
Nodes (36): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+28 more)

### Community 7 - "App.tsx"
Cohesion: 0.04
Nodes (68): SendMessage, blank(), goalInput, Goals(), themeColor, App(), CONNECTION, CONNECTION_DOT (+60 more)

### Community 8 - "cost-ledger.ts"
Cohesion: 0.18
Nodes (24): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId(), OutsideEdit (+16 more)

### Community 9 - "Inspector.tsx"
Cohesion: 0.08
Nodes (66): Conversation(), Outbox(), slackMessageStatus(), SlackDeliveryCard(), ServiceHealthPanel(), labels, ServiceHealthRow(), LessonsPanel() (+58 more)

### Community 10 - "github-delivery.ts"
Cohesion: 0.07
Nodes (74): containedFile(), findingsBlock(), namedRepairIds(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery(), discover() (+66 more)

### Community 11 - "OfficeScene.tsx"
Cohesion: 0.06
Nodes (58): itAgent(), itDiagnostics(), displayAgentTask(), withoutElapsed(), LiveAgentTask(), Props, RunningTask(), text() (+50 more)

### Community 12 - "run-ci-repair.ts"
Cohesion: 0.29
Nodes (12): ciCheckout(), verifyCIHooks(), CIFailure, guardCIRepair(), prepareCIMetadataRepair(), publishCIRepair(), rewordCommits(), CIPlanSchema (+4 more)

### Community 13 - "digest"
Cohesion: 0.11
Nodes (50): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+42 more)

### Community 14 - "maintenance.ts"
Cohesion: 0.08
Nodes (33): maintenancePolicies(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice(), candidateOwner(), SETTLED (+25 more)

### Community 15 - "closeout.ts"
Cohesion: 0.24
Nodes (15): harnessCloseout(), PASSING, verifyMergeActions(), withHarnessWork(), runHarnessStage(), harnessStageResult(), receipt(), Check (+7 more)

### Community 16 - "scheduled-work.ts"
Cohesion: 0.16
Nodes (18): deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), deterministicActions, eligible() (+10 more)

### Community 17 - "api-routes.ts"
Cohesion: 0.30
Nodes (10): goalHistory(), apiRoute(), RequestContext, fileResponse(), json(), staticRoute(), validTicket(), projectReadiness() (+2 more)

### Community 18 - "report.ts"
Cohesion: 0.26
Nodes (13): TelemetryRow, TelemetrySync, Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount() (+5 more)

### Community 19 - "SettingsPanel.tsx"
Cohesion: 0.15
Nodes (28): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView() (+20 more)

### Community 20 - "conversations/conversations.ts"
Cohesion: 0.11
Nodes (21): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+13 more)

### Community 21 - "GitHubFeaturePublisher"
Cohesion: 0.26
Nodes (8): Assign, Board, GitHubFeaturePublisher, number(), same(), PublicationReceipt, label(), personaContext()

### Community 22 - "goal-reporting.ts"
Cohesion: 0.12
Nodes (22): AUTO_ADOPT_BOTS, GitHubMonitor, githubPRDescription(), azureGoalFacts(), azurePRDescription(), boundedEvidence(), EvidenceStore, GOAL_EVIDENCE_LIMITS (+14 more)

### Community 23 - "source-amendment.ts"
Cohesion: 0.10
Nodes (53): adoptCandidate(), reported, Scope, Assessment, outsideScanSources(), Ownership, reconcileScopeRepairReadback(), requireThat() (+45 more)

### Community 24 - "OfficeSnapshot"
Cohesion: 0.13
Nodes (18): FeatureRound, recommendedReply(), FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures() (+10 more)

### Community 25 - "work-summary.ts"
Cohesion: 0.20
Nodes (18): compactSteps(), deliveryRepairProjection(), ACTIVE, maintenanceUpdate(), PMQueueItem, pmQueueItems(), deliveryChanges(), following (+10 more)

### Community 26 - "accept-stage-result.ts"
Cohesion: 0.15
Nodes (34): acceptStageResult(), mergeAuthorized(), allowed, assertContinuationWorker(), continuationNativeReview(), continuationReviewArtifacts(), continuationWorktree(), negativeWorker() (+26 more)

### Community 27 - "TimeBook.tsx"
Cohesion: 0.10
Nodes (35): TelemetryReport, AzureBuild, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens(), usd() (+27 more)

### Community 28 - "preferences-store.ts"
Cohesion: 0.19
Nodes (10): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS (+2 more)

### Community 29 - "retrospective-subject.ts"
Cohesion: 0.18
Nodes (16): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+8 more)

### Community 30 - "knowledge.ts"
Cohesion: 0.19
Nodes (14): SEEDS, KnowledgeRetry, KnowledgeState, Lesson, LessonRecurrence, OfficeProposal, RepositoryInstruction, RetrospectiveEvent (+6 more)

### Community 31 - "park-ticket.ts"
Cohesion: 0.21
Nodes (25): unpack(), BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue(), readIssues() (+17 more)

### Community 32 - "TicketJob"
Cohesion: 0.07
Nodes (23): BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction(), dependabotReviewGuidance(), StageContext, GitHubDelivery, stagePrompt() (+15 more)

### Community 33 - "agents.ts"
Cohesion: 0.08
Nodes (36): cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), cecChatPrompt(), ctoChatPrompt(), itChatPrompt(), slackSendPrompt() (+28 more)

### Community 34 - "it-specialist.ts"
Cohesion: 0.30
Nodes (11): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), ITContext, readBackConversations(), publishITReport(), delays, recoverAttempt() (+3 more)

### Community 35 - "Coordinator"
Cohesion: 0.10
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 36 - "daily-cto.ts"
Cohesion: 0.06
Nodes (44): collectCTOFacts(), DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), dailyReviewDate(), reviewWeekday(), boundedIntake() (+36 more)

### Community 37 - "Role"
Cohesion: 0.10
Nodes (24): ROLES, DELIVERY_CONCURRENCY, LOCAL_BINDINGS, file, project, root, DeliverySlot, officeCapacity (+16 more)

### Community 38 - "ticket-stage-runner.ts"
Cohesion: 0.23
Nodes (19): run(), publicationEvidenceGap(), qaEvidenceGap(), resultGate(), stageResultGap(), approachFingerprint(), enqueueRepairDiagnosis(), jiraRepairable() (+11 more)

### Community 39 - "time-scope.ts"
Cohesion: 0.25
Nodes (19): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), ticketDayTotals(), captureTime() (+11 more)

### Community 40 - "assignment-poll.ts"
Cohesion: 0.18
Nodes (12): noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), pinCourier, ACTIONS, OWNER, wikiSync, due() (+4 more)

### Community 41 - "retrospective-triggers.ts"
Cohesion: 0.18
Nodes (22): clip(), JobLike, recordCIBudget(), recordParked(), recordRepairBudget(), recordTicketParked(), recordTrigger(), subjectOf() (+14 more)

### Community 42 - "run-accounting.ts"
Cohesion: 0.05
Nodes (69): BoundedRead, done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf(), backfillClaudeCost(), CompletionReader (+61 more)

### Community 43 - "store.ts"
Cohesion: 0.13
Nodes (22): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), Identity, NoticeSettings, SlackMessages (+14 more)

### Community 44 - "run-retrospective.ts"
Cohesion: 0.20
Nodes (16): acceptRetrospective(), busyMaintenanceIds(), retrospectivePrompt(), SUBJECT, RetrospectiveResultSchema, triggerJobId(), harperFolder(), KnowledgeRunner (+8 more)

### Community 45 - "office-lessons.ts"
Cohesion: 0.16
Nodes (14): Accepted, normalizeStatement(), RETROSPECTIVE_HISTORY, decideOfficeProposal(), now(), OfficeKnowledgeStore, proposeOfficeLessons(), retireOfficeLesson() (+6 more)

### Community 46 - "coordination.ts"
Cohesion: 0.19
Nodes (17): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation(), checkpointWindow(), dueAt() (+9 more)

### Community 47 - "ledger.ts"
Cohesion: 0.18
Nodes (17): partialLocalCleanupKey(), investigationCandidates(), investigationId(), investigationEvidence(), investigationFollowUps(), investigationResolution(), syncInvestigations(), investigationReady() (+9 more)

### Community 48 - "azure.ts"
Cohesion: 0.20
Nodes (14): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+6 more)

### Community 49 - "outbox.ts"
Cohesion: 0.15
Nodes (22): conversationResolved(), projectOutbox(), syncOutbox(), projectSlackDeliveries(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint() (+14 more)

### Community 50 - "workKey"
Cohesion: 0.10
Nodes (36): savedActivationFailure(), continuationScope(), continuationWorkerProof(), brainImplementationCandidate(), BrainReadback, digest(), implementationRecoveryCandidate(), Ownership (+28 more)

### Community 51 - "publish-pr.ts"
Cohesion: 0.17
Nodes (20): activeEffectId(), harnessEffect, assertMayMutate(), readBackOrThrow(), retryRead(), park(), developerPRContent(), Execute (+12 more)

### Community 52 - "dependencies.ts"
Cohesion: 0.22
Nodes (19): Admission, admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, compatible(), dependencyCompletionKey(), dependencyEligibility() (+11 more)

### Community 53 - "tracking-issue.ts"
Cohesion: 0.19
Nodes (26): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard, projectCards() (+18 more)

### Community 54 - "engine.ts"
Cohesion: 0.21
Nodes (16): checkMail(), drainMail(), requestMail(), dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), resume() (+8 more)

### Community 55 - ".save"
Cohesion: 0.11
Nodes (11): MergeNotifications, featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), recoverFeatures(), checkpointMeasurement(), HEARTBEAT_GAP_MS, HEARTBEAT_MS (+3 more)

### Community 56 - "coordination-tick.ts"
Cohesion: 0.33
Nodes (7): reconcileNoticeConfirmations(), legacy, reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION, tick()

### Community 57 - "weekly-rollup.ts"
Cohesion: 0.16
Nodes (21): RollupResult, RollupResultSchema, RETROSPECTIVE_TIMEOUT, ineffectiveLessons(), lastFriday(), ROLLUP_HISTORY, rollupDue(), RollupHooks (+13 more)

### Community 58 - "control-store.ts"
Cohesion: 0.21
Nodes (8): Clock, systemClock, applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, statementCache(), initialSnapshot()

### Community 59 - "work.ts"
Cohesion: 0.18
Nodes (10): AssignmentResult, CompletionCondition, Continuation, DependencyObservation, EligibilityState, FailureCategory, ReconciliationAction, ReconciliationRequest (+2 more)

### Community 60 - "Offices"
Cohesion: 0.28
Nodes (3): mirrorOfficeKnowledge(), Offices, markCaptureStart()

### Community 61 - "jira-time.ts"
Cohesion: 0.24
Nodes (10): data(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), publishableEntry(), settlementPending() (+2 more)

### Community 62 - "retrospective-facts.ts"
Cohesion: 0.22
Nodes (12): ARTIFACT_LIMIT, clip(), LEDGER_STEPS, MAINTENANCE_LIMIT, maintenanceFacts(), MaintenancePacketSection, clip(), PACKET_LIMIT (+4 more)

### Community 63 - ".transaction"
Cohesion: 0.20
Nodes (18): discoveryPrompt(), planPrompt(), document(), featureRoot(), DiscoverySchema, identity, manifestFromPlan(), ManifestSchema (+10 more)

### Community 64 - "http/context.ts"
Cohesion: 0.26
Nodes (9): ITSpecialist, ROOT, ServiceContext, OfficeConfigInputs, officeConfigRoute(), officeConfigSummary(), CECBinding, runtimeRevision() (+1 more)

### Community 65 - "discovery-recovery.ts"
Cohesion: 0.29
Nodes (10): Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership, rawHash() (+2 more)

### Community 66 - "knowledge-context.ts"
Cohesion: 0.21
Nodes (11): Bucket, knowledgeContext(), LESSON_LIMIT, lessonPurpose(), MAINTENANCE, MAX_LESSONS, PURPOSES, render() (+3 more)

### Community 67 - "Store"
Cohesion: 0.11
Nodes (13): Result, Assessment, Store, GIT_NETWORK, LIVE_PROVIDERS, liveReach(), networkUrl(), remoteUrls() (+5 more)

### Community 68 - "session-bridge.ts"
Cohesion: 0.23
Nodes (9): claudeSessions(), codexSessions(), desktopSessions(), guardianReview(), LiveSession, loadedCodexSession(), openRollouts(), SessionBridge (+1 more)

### Community 69 - "cli.ts"
Cohesion: 0.25
Nodes (6): args, [cmd,...rawArgs], commands, key, projectIndex, PORT

### Community 70 - "cec/workflow.ts"
Cohesion: 0.33
Nodes (6): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), advance(), nextStage(), safeWebUrl()

### Community 71 - "activation-recovery.ts"
Cohesion: 0.12
Nodes (38): HarnessControl, activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal (+30 more)

### Community 72 - "create-candidate.ts"
Cohesion: 0.31
Nodes (9): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+1 more)

### Community 75 - "worker-runtime.ts"
Cohesion: 0.11
Nodes (23): SlackResultSchema, SlackVerificationSchema, CODEX_DEFAULT_EFFORT, CODEX_DEFAULT_MODEL, CODEX_EFFORTS, CODEX_ROLES, ModelRoute, qaPolicyRoute() (+15 more)

### Community 76 - "jira-publication.ts"
Cohesion: 0.16
Nodes (11): Assignment, Content, JiraFeaturePublisher, jiraText(), keyOf(), plainDescription(), Transition, FeaturePublisher (+3 more)

### Community 77 - ".emit"
Cohesion: 0.19
Nodes (18): configureNotices(), retryRecipientLookup(), failedWorker(), requeueWaitedImplement(), configureKnowledge(), declineLessonIssue(), reactivateLesson(), retireLesson() (+10 more)

### Community 78 - "checkpoint-completion.ts"
Cohesion: 0.23
Nodes (8): BrainStatusSchema, identity, parseBrainStatus(), brainCheckpointCompletion(), coverageSchema, followupSchema, verified, reconcileCompletedCheckpoints()

### Community 79 - "index.ts"
Cohesion: 0.21
Nodes (10): close(), config, itSpecialist, loadedRevision, offices, releaseLock, server, serviceHealth (+2 more)

### Community 80 - ".getEffect"
Cohesion: 0.24
Nodes (7): GitHubOperations, fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), closeNativeRefresh(), fingerprint(), EffectIntent

### Community 81 - ".value"
Cohesion: 0.27
Nodes (6): file, folder, logs, root, xml(), ProjectProgress

### Community 82 - "review-run.ts"
Cohesion: 0.21
Nodes (11): currentApproval(), featureGate(), predecessorComplete(), EvidenceSchema, helperInstallation(), readReview(), ReviewEvidence, observeHelperGroups() (+3 more)

### Community 83 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 84 - "features.ts"
Cohesion: 0.15
Nodes (27): approveFeature(), assertRetainedItems(), commandFeature(), createFeature(), mutation(), reviewQuestions(), assertFeatureDependencyOrder(), featureDependencyEdges() (+19 more)

### Community 85 - "approach.ts"
Cohesion: 0.16
Nodes (20): cecPrompt(), resolvedDecisionNote(), stageInstructions, afterDraft(), APPROACH_GUIDANCE, ApproachSchema, firstBuildStage(), missingApproachStage() (+12 more)

### Community 86 - "featureById"
Cohesion: 0.47
Nodes (5): featureById(), Link, linkFeature(), featureRoute(), FeatureWorkflow

### Community 87 - "merge-summary.ts"
Cohesion: 0.36
Nodes (7): clamp(), LIMITS, MergedPR, plainSlackText(), section(), shippedSummary(), mergeText()

### Community 88 - "recovery-ledger.ts"
Cohesion: 0.38
Nodes (7): savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), diagnosticSnapshot(), nativeDeliveryResolved(), reconcileRecoveryLedger()

### Community 89 - "maintenance-triggers.ts"
Cohesion: 0.36
Nodes (9): clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates(), maintenanceCompletedId(), maintenanceKey(), visibleMaintenanceTriggerIds(), TerminalCandidate (+1 more)

### Community 90 - "WorkTime"
Cohesion: 0.16
Nodes (15): awaitingEvidence(), CaptureContext, inCostWindow(), TicketCost, ticketCosts(), ScopeRow, ConfirmedSegment, LiveAnchor (+7 more)

### Community 91 - "read-retries.ts"
Cohesion: 0.36
Nodes (7): PrerequisitesSchema, incompleteReadOutput(), IntakeResult, planReadRetry(), reconcileReadRetries(), WorkFailure, ReadRetry

### Community 93 - "DailyCTO.tsx"
Cohesion: 0.26
Nodes (8): CTOReview(), goalState, DailyCTO(), GoalHistory(), reportDate(), reviewStatus, reviewExcerpt(), ReviewText()

### Community 94 - "sanitizeObject"
Cohesion: 0.47
Nodes (5): snapshot(), sanitizeObject(), comparable(), EvidenceOutcome, recordRunEvidence()

### Community 95 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 96 - "needsDecision"
Cohesion: 0.70
Nodes (3): parksInJira(), DECISION_KINDS, needsDecision()

### Community 98 - "highestStableAtLeast"
Cohesion: 0.83
Nodes (3): compare(), highestStableAtLeast(), parts()

## Knowledge Gaps
- **337 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+332 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `remove-candidate.ts`, `dependency-bots/adopt.ts`, `Engine`, `shared.ts`, `artifact`, `cost-ledger.ts`, `github-delivery.ts`, `digest`, `maintenance.ts`, `scheduled-work.ts`, `api-routes.ts`, `conversations/conversations.ts`, `GitHubFeaturePublisher`, `goal-reporting.ts`, `source-amendment.ts`, `OfficeSnapshot`, `accept-stage-result.ts`, `retrospective-subject.ts`, `park-ticket.ts`, `TicketJob`, `agents.ts`, `it-specialist.ts`, `daily-cto.ts`, `Role`, `ticket-stage-runner.ts`, `time-scope.ts`, `retrospective-triggers.ts`, `run-accounting.ts`, `store.ts`, `run-retrospective.ts`, `office-lessons.ts`, `coordination.ts`, `ledger.ts`, `azure.ts`, `outbox.ts`, `workKey`, `publish-pr.ts`, `dependencies.ts`, `tracking-issue.ts`, `engine.ts`, `.save`, `coordination-tick.ts`, `weekly-rollup.ts`, `control-store.ts`, `Offices`, `jira-time.ts`, `retrospective-facts.ts`, `.transaction`, `discovery-recovery.ts`, `knowledge-context.ts`, `session-bridge.ts`, `activation-recovery.ts`, `create-candidate.ts`, `worker-runtime.ts`, `jira-publication.ts`, `.emit`, `checkpoint-completion.ts`, `.getEffect`, `review-run.ts`, `features.ts`, `approach.ts`, `featureById`, `recovery-ledger.ts`, `read-retries.ts`, `JiraOperations`, `sanitizeObject`, `BrainFollowup`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **Why does `TicketJob` connect `TicketJob` to `remove-candidate.ts`, `dependency-bots/adopt.ts`, `shared.ts`, `artifact`, `Inspector.tsx`, `github-delivery.ts`, `run-ci-repair.ts`, `digest`, `closeout.ts`, `source-amendment.ts`, `work-summary.ts`, `accept-stage-result.ts`, `retrospective-subject.ts`, `it-specialist.ts`, `daily-cto.ts`, `Role`, `ticket-stage-runner.ts`, `retrospective-triggers.ts`, `workKey`, `publish-pr.ts`, `dependencies.ts`, `tracking-issue.ts`, `work.ts`, `discovery-recovery.ts`, `Store`, `activation-recovery.ts`, `create-candidate.ts`, `.value`, `approach.ts`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `command()` connect `Store` to `remove-candidate.ts`, `Engine`, `shared.ts`, `artifact`, `cost-ledger.ts`, `github-delivery.ts`, `run-ci-repair.ts`, `digest`, `maintenance.ts`, `scheduled-work.ts`, `GitHubFeaturePublisher`, `goal-reporting.ts`, `source-amendment.ts`, `park-ticket.ts`, `TicketJob`, `agents.ts`, `ticket-stage-runner.ts`, `store.ts`, `coordination.ts`, `azure.ts`, `publish-pr.ts`, `dependencies.ts`, `tracking-issue.ts`, `engine.ts`, `jira-time.ts`, `.transaction`, `session-bridge.ts`, `create-candidate.ts`, `worker-runtime.ts`, `jira-publication.ts`, `.getEffect`, `review-run.ts`, `command-registry.ts`, `features.ts`, `JiraOperations`, `BrainFollowup`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `command()` (e.g. with `.constructor()` and `executeRequest()`) actually correct?**
  _`command()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _337 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Engine` be split into smaller, more focused modules?**
  _Cohesion score 0.09420289855072464 - nodes in this community are weakly interconnected._
- **Should `shared.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09309309309309309 - nodes in this community are weakly interconnected._