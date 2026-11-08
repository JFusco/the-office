# Graph Report - the-office  (2026-11-08)

## Corpus Check
- 469 files · ~223,735 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2721 nodes · 11387 edges · 101 communities (100 shown, 1 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 64 edges (avg confidence: 0.74)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2acaefa0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- remove-candidate.ts
- GitHubDelivery
- Engine
- preferences-store.ts
- source-amendment-scope.ts
- dependency-bots/adopt.ts
- PeoplePanel.tsx
- Inspector.tsx
- cost-ledger.ts
- index.tsx
- github-delivery.ts
- OfficeScene.tsx
- outbox.ts
- digest
- maintenance.ts
- telemetry.ts
- engine.ts
- index.ts
- WorkTime
- SettingsPanel.tsx
- conversations/conversations.ts
- GitHubFeaturePublisher
- azure.ts
- source-amendment.ts
- features/workflow.ts
- work-summary.ts
- scheduled-work.ts
- TimeBook.tsx
- publish-pr.ts
- retrospective-subject.ts
- knowledge.ts
- .save
- implementation-recovery.ts
- agents.ts
- sanitizeObject
- Coordinator
- ControlStore
- OfficeSnapshot
- delivery-repairs.ts
- time-scope.ts
- assignment-poll.ts
- api-routes.ts
- run-accounting.ts
- liveReach
- daily-cto.ts
- accept-stage-result.ts
- coordination.ts
- notifications.ts
- process.ts
- features.ts
- fact-bounds.ts
- closeout.ts
- dependencies.ts
- tracking-issue.ts
- it-specialist.ts
- scheduler.ts
- offices.ts
- weekly-rollup.ts
- Store
- discovery-recovery.ts
- Offices
- jira-time.ts
- run-retrospective.ts
- featureById
- .getEffect
- run.ts
- knowledge-context.ts
- command
- session-bridge.ts
- cec/workflow.ts
- office-lessons.ts
- artifact
- create-candidate.ts
- helper-evidence.py
- worker-runtime.ts
- jira-publication.ts
- .emit
- coordination-tick.ts
- evidence.ts
- checkpoint-completion.ts
- DailyCTO.tsx
- .transaction
- retrospective-triggers.ts
- .value
- github.ts
- requests.ts
- follow-up-alerts.ts
- shared.ts
- run-ci-repair.ts
- .constructor
- delivery-binding.ts
- retrospective-facts.ts
- codex-rollout.ts
- cli.ts
- slack-supersession.ts
- run-usage.ts
- maintenance-triggers.ts
- codex-rollout-file.ts
- leadership.ts
- needsDecision

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

## Communities (101 total, 1 thin omitted)

### Community 0 - "remove-candidate.ts"
Cohesion: 0.20
Nodes (16): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+8 more)

### Community 1 - "GitHubDelivery"
Cohesion: 0.08
Nodes (42): GitHubDelivery, observe(), checksFailed(), checksPassed(), checksPending(), CurrentChecksWait, currentMergeChecks(), pass() (+34 more)

### Community 2 - "Engine"
Cohesion: 0.11
Nodes (5): correlatedBuild(), Engine, observe(), observeParked(), parkedReadError

### Community 3 - "preferences-store.ts"
Cohesion: 0.14
Nodes (14): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, acceptPreferences(), PreferenceCandidate (+6 more)

### Community 4 - "source-amendment-scope.ts"
Cohesion: 0.08
Nodes (39): approvedText(), assert(), assert(), normalize(), officialUrls, ReleaseCapture, verifyReleaseCaptures(), amendmentCaptureObservation() (+31 more)

### Community 5 - "dependency-bots/adopt.ts"
Cohesion: 0.15
Nodes (23): readBackOrThrow(), closesIssue(), linkedBody(), linkPR(), dependabotPR, readRepo(), ensureTrackingIssue(), findTrackingIssue() (+15 more)

### Community 6 - "PeoplePanel.tsx"
Cohesion: 0.09
Nodes (41): label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+33 more)

### Community 7 - "Inspector.tsx"
Cohesion: 0.05
Nodes (57): diagnosticContext(), SendMessage, itAgent(), itDiagnostics(), currentServices(), ServiceHealthPanel(), ServiceHealthRow(), GoalList() (+49 more)

### Community 8 - "cost-ledger.ts"
Cohesion: 0.16
Nodes (25): EffectUncertainError, captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId() (+17 more)

### Community 9 - "index.tsx"
Cohesion: 0.09
Nodes (47): Conversation(), slackMessageStatus(), SlackDeliveryCard(), labels, LessonsPanel(), when(), EvidenceCard(), Inspector() (+39 more)

### Community 10 - "github-delivery.ts"
Cohesion: 0.07
Nodes (55): findingsBlock(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery(), BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE (+47 more)

### Community 11 - "OfficeScene.tsx"
Cohesion: 0.06
Nodes (55): displayAgentTask(), withoutElapsed(), LiveAgentTask(), Props, RunningTask(), text(), Avatar(), AzureWall() (+47 more)

### Community 12 - "outbox.ts"
Cohesion: 0.16
Nodes (17): projectOutbox(), syncOutbox(), finishSupersededReadback(), projectSlackDeliveries(), settleRequestedSlackReplacement(), Input, supersedeSlackDelivery(), replacementContext() (+9 more)

### Community 13 - "digest"
Cohesion: 0.09
Nodes (66): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+58 more)

### Community 14 - "maintenance.ts"
Cohesion: 0.08
Nodes (33): maintenancePolicies(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice(), candidateOwner(), SETTLED (+25 more)

### Community 15 - "telemetry.ts"
Cohesion: 0.11
Nodes (22): CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL, Rates (+14 more)

### Community 16 - "engine.ts"
Cohesion: 0.21
Nodes (18): checkMail(), drainMail(), requestMail(), dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), resume() (+10 more)

### Community 17 - "index.ts"
Cohesion: 0.15
Nodes (16): close(), config, itSpecialist, loadedRevision, offices, releaseLock, server, serviceHealth (+8 more)

### Community 18 - "WorkTime"
Cohesion: 0.15
Nodes (21): ScopeRow, ConfirmedSegment, LiveAnchor, ObservationGap, SnapshotOrdering, TimeLedgerState, TimeEntry, WorkTime (+13 more)

### Community 19 - "SettingsPanel.tsx"
Cohesion: 0.12
Nodes (33): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView() (+25 more)

### Community 20 - "conversations/conversations.ts"
Cohesion: 0.11
Nodes (23): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+15 more)

### Community 21 - "GitHubFeaturePublisher"
Cohesion: 0.18
Nodes (9): Assign, Board, GitHubFeaturePublisher, number(), same(), FeaturePublisher, publishFeature(), FeatureManifestItem (+1 more)

### Community 22 - "azure.ts"
Cohesion: 0.15
Nodes (20): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+12 more)

### Community 23 - "source-amendment.ts"
Cohesion: 0.08
Nodes (68): containedFile(), HarnessControl, adoptCandidate(), reported, Scope, Assessment, outsideScanSources(), Ownership (+60 more)

### Community 24 - "features/workflow.ts"
Cohesion: 0.17
Nodes (20): discoveryPrompt(), planPrompt(), document(), featureRoot(), DiscoverySchema, identity, manifestFromPlan(), ManifestSchema (+12 more)

### Community 25 - "work-summary.ts"
Cohesion: 0.13
Nodes (29): compactSteps(), Outbox(), envelopeCard, deliveryRepairProjection(), DependencyNotice(), InboxQueue(), ACTIVE, maintenanceUpdate() (+21 more)

### Community 26 - "scheduled-work.ts"
Cohesion: 0.14
Nodes (20): conversationResolved(), deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), deterministicActions (+12 more)

### Community 27 - "TimeBook.tsx"
Cohesion: 0.11
Nodes (35): TelemetryReport, AzureBuild, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens(), usd() (+27 more)

### Community 28 - "publish-pr.ts"
Cohesion: 0.18
Nodes (18): activeEffectId(), harnessEffect, assertMayMutate(), retryRead(), park(), developerPRContent(), Execute, lintPRContent() (+10 more)

### Community 29 - "retrospective-subject.ts"
Cohesion: 0.19
Nodes (15): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, maintenanceKey(), azurePrUrl(), findSubject(), jobSubject() (+7 more)

### Community 30 - "knowledge.ts"
Cohesion: 0.11
Nodes (24): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Kind, RetrospectiveResult, Stage, SEEDS, KnowledgeRetry (+16 more)

### Community 31 - ".save"
Cohesion: 0.24
Nodes (23): BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue(), readIssues(), commentDecision() (+15 more)

### Community 32 - "implementation-recovery.ts"
Cohesion: 0.13
Nodes (25): continuationScope(), brainImplementationCandidate(), BrainReadback, digest(), implementationRecoveryCandidate(), Ownership, Readback, recoverBrainImplementation() (+17 more)

### Community 33 - "agents.ts"
Cohesion: 0.07
Nodes (42): JiraOperations, plain(), cecPrompt(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), resolvedDecisionNote() (+34 more)

### Community 34 - "sanitizeObject"
Cohesion: 0.25
Nodes (12): AUTO_ADOPT_BOTS, snapshot(), goalEvidencePath(), OfficeConfigInputs, officeConfigRoute(), officeConfigSummary(), CECBinding, localBindings (+4 more)

### Community 35 - "Coordinator"
Cohesion: 0.08
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 36 - "ControlStore"
Cohesion: 0.19
Nodes (5): DailyCTO, Briefing, saveReviewBriefing(), ControlStore, DailyCTOReport

### Community 37 - "OfficeSnapshot"
Cohesion: 0.09
Nodes (28): FeatureRound, FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures(), draftKey() (+20 more)

### Community 38 - "delivery-repairs.ts"
Cohesion: 0.24
Nodes (20): run(), advance(), namedRepairIds(), afterDraft(), ApproachSchema, firstBuildStage(), missingApproachStage(), plannedNext() (+12 more)

### Community 39 - "time-scope.ts"
Cohesion: 0.16
Nodes (27): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence(), CaptureContext (+19 more)

### Community 40 - "assignment-poll.ts"
Cohesion: 0.20
Nodes (13): queueMergeNotice(), observeGitHubMergeNotices(), adoptDependabot(), openDependabotPulls(), refusal(), pinCourier, due(), unparkReleasedWaits() (+5 more)

### Community 41 - "api-routes.ts"
Cohesion: 0.25
Nodes (11): goalHistory(), GoalInput, saveGoal(), apiRoute(), RequestContext, fileResponse(), json(), staticRoute() (+3 more)

### Community 42 - "run-accounting.ts"
Cohesion: 0.16
Nodes (21): BoundedRead, CompletionReader, readCodexRollout(), HELPER_STDOUT_MAX_BYTES, helperAccounting(), claudeAccounting(), codexAccounting(), COMPLETION_MAX_BYTES (+13 more)

### Community 43 - "liveReach"
Cohesion: 0.60
Nodes (5): GIT_NETWORK, LIVE_PROVIDERS, liveReach(), networkUrl(), remoteUrls()

### Community 44 - "daily-cto.ts"
Cohesion: 0.18
Nodes (16): EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), dailyReviewDate(), reviewWeekday(), queueGoalEvidenceRequest(), applyGoalReview(), DailyResultSchema (+8 more)

### Community 45 - "accept-stage-result.ts"
Cohesion: 0.14
Nodes (28): acceptStageResult(), mergeAuthorized(), continuationReviewArtifacts(), continuationWorktree(), reconcileContinuationReview(), savedNegativeContinuationReview(), discoveryReviewSatisfied(), ContinuationDecision (+20 more)

### Community 46 - "coordination.ts"
Cohesion: 0.17
Nodes (19): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation(), checkpointWindow(), dueAt() (+11 more)

### Community 47 - "notifications.ts"
Cohesion: 0.12
Nodes (20): channelNoticeAuthorized(), notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR, plainSlackText(), section() (+12 more)

### Community 48 - "process.ts"
Cohesion: 0.23
Nodes (12): At, Errno, GroupInventory, GroupProbe, LifecycleDiagnostic, Phase, Pid, groupInventory() (+4 more)

### Community 49 - "features.ts"
Cohesion: 0.17
Nodes (19): assertFeatureDependencyOrder(), featureDependencyEdges(), key(), assertEnrollable(), currentApproval(), reserveIdentity(), EvidenceSchema, readReview() (+11 more)

### Community 50 - "fact-bounds.ts"
Cohesion: 0.26
Nodes (15): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+7 more)

### Community 51 - "closeout.ts"
Cohesion: 0.23
Nodes (16): harnessCloseout(), PASSING, verifyMergeActions(), withHarnessWork(), runHarnessStage(), harnessStageResult(), receipt(), Check (+8 more)

### Community 52 - "dependencies.ts"
Cohesion: 0.18
Nodes (20): Admission, admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, resumeParked(), compatible(), dependencyCompletionKey() (+12 more)

### Community 53 - "tracking-issue.ts"
Cohesion: 0.18
Nodes (26): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard, projectCards() (+18 more)

### Community 54 - "it-specialist.ts"
Cohesion: 0.09
Nodes (33): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), partialLocalCleanupKey(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved() (+25 more)

### Community 55 - "scheduler.ts"
Cohesion: 0.17
Nodes (11): ROLES, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch(), foreignWork() (+3 more)

### Community 56 - "offices.ts"
Cohesion: 0.15
Nodes (12): Clock, EASTERN, easternDayFormatter, easternPartsFormatter, systemClock, DELIVERY_CONCURRENCY, applyConnectionSettings(), closeConnection() (+4 more)

### Community 57 - "weekly-rollup.ts"
Cohesion: 0.21
Nodes (16): RollupResult, RollupResultSchema, harperFolder(), RETROSPECTIVE_TIMEOUT, retryDelay(), ineffectiveLessons(), lastFriday(), ROLLUP_HISTORY (+8 more)

### Community 58 - "Store"
Cohesion: 0.10
Nodes (19): featureItemComplete(), reconcileFeatureCompletion(), recoverFeatures(), goalNoticeNeverDispatched(), Assessment, maintenanceNoticeNeverDispatched(), EffectOperation, Effects (+11 more)

### Community 59 - "discovery-recovery.ts"
Cohesion: 0.31
Nodes (9): Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), ownedArtifact(), Ownership, rawHash(), recoverDiscovery() (+1 more)

### Community 60 - "Offices"
Cohesion: 0.18
Nodes (6): file, project, root, projectById(), projectData(), Offices

### Community 61 - "jira-time.ts"
Cohesion: 0.21
Nodes (13): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+5 more)

### Community 62 - "run-retrospective.ts"
Cohesion: 0.23
Nodes (13): busyMaintenanceIds(), retrospectivePrompt(), SUBJECT, RetrospectiveResultSchema, triggerJobId(), KnowledgeRunner, KnowledgeRunOptions, RetrospectiveRunner (+5 more)

### Community 63 - "featureById"
Cohesion: 0.24
Nodes (13): approveFeature(), assertRetainedItems(), commandFeature(), createFeature(), featureById(), mutation(), artifactPath(), digest() (+5 more)

### Community 64 - ".getEffect"
Cohesion: 0.25
Nodes (7): GitHubOperations, fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), closeNativeRefresh(), fingerprint(), EffectIntent

### Community 65 - "run.ts"
Cohesion: 0.20
Nodes (15): OFFICE_FIX_PROMPT, OfficeFixResult, validateOfficeFix(), investigationReady(), INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, InvestigationOptions, InvestigationReport (+7 more)

### Community 66 - "knowledge-context.ts"
Cohesion: 0.24
Nodes (10): Bucket, knowledgeContext(), LESSON_LIMIT, lessonPurpose(), MAINTENANCE, MAX_LESSONS, PURPOSES, render() (+2 more)

### Community 67 - "command"
Cohesion: 0.15
Nodes (6): CommandRegistry, CommandScope, inside(), RegisteredCommand, command(), workerFailure()

### Community 68 - "session-bridge.ts"
Cohesion: 0.23
Nodes (9): claudeSessions(), codexSessions(), desktopSessions(), guardianReview(), LiveSession, loadedCodexSession(), openRollouts(), SessionBridge (+1 more)

### Community 69 - "cec/workflow.ts"
Cohesion: 0.21
Nodes (13): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), nextStage(), publicationEvidenceGap(), qaEvidenceGap(), resultGate(), stageResultGap() (+5 more)

### Community 70 - "office-lessons.ts"
Cohesion: 0.27
Nodes (9): normalizeStatement(), decideOfficeProposal(), now(), OfficeKnowledgeStore, proposeOfficeLessons(), retireOfficeLesson(), Input, promoteNoteLesson() (+1 more)

### Community 71 - "artifact"
Cohesion: 0.19
Nodes (28): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+20 more)

### Community 72 - "create-candidate.ts"
Cohesion: 0.24
Nodes (10): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+2 more)

### Community 75 - "worker-runtime.ts"
Cohesion: 0.09
Nodes (28): SlackResultSchema, SlackVerificationSchema, LOCAL_BINDINGS, DeliverySlot, officeCapacity, CODEX_DEFAULT_EFFORT, CODEX_DEFAULT_MODEL, CODEX_EFFORTS (+20 more)

### Community 76 - "jira-publication.ts"
Cohesion: 0.24
Nodes (9): unpack(), Assignment, Content, JiraFeaturePublisher, jiraText(), keyOf(), plainDescription(), Transition (+1 more)

### Community 77 - ".emit"
Cohesion: 0.19
Nodes (20): ChannelSettings, configureChannelNotices(), configureNotices(), NoticeSettings, noticeState(), retryRecipientLookup(), DiscoveryResumeInput, configureKnowledge() (+12 more)

### Community 78 - "coordination-tick.ts"
Cohesion: 0.17
Nodes (9): reconcileNoticeConfirmations(), BrainFollowup, Result, legacy, reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION (+1 more)

### Community 79 - "evidence.ts"
Cohesion: 0.33
Nodes (9): investigationEvidence(), OFFICE_SOURCE_PATHS, officeSource(), done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf() (+1 more)

### Community 80 - "checkpoint-completion.ts"
Cohesion: 0.23
Nodes (8): BrainStatusSchema, identity, parseBrainStatus(), brainCheckpointCompletion(), coverageSchema, followupSchema, verified, reconcileCompletedCheckpoints()

### Community 81 - "DailyCTO.tsx"
Cohesion: 0.23
Nodes (9): CTOReview(), goalState, DailyCTO(), GoalHistory(), reportDate(), reviewStatus, reviewExcerpt(), ReviewText() (+1 more)

### Community 82 - ".transaction"
Cohesion: 0.27
Nodes (8): reviewQuestions(), helperTelemetry(), helperInstallation(), ReviewEvidence, observeHelperGroups(), stopHelperGroups(), FeatureReviewRunner, importReview()

### Community 83 - "retrospective-triggers.ts"
Cohesion: 0.15
Nodes (26): clip(), JobLike, recordCIBudget(), recordParked(), recordRepairBudget(), recordTicketParked(), recordTrigger(), subjectOf() (+18 more)

### Community 84 - ".value"
Cohesion: 0.24
Nodes (6): file, folder, logs, root, xml(), ProjectProgress

### Community 85 - "github.ts"
Cohesion: 0.26
Nodes (6): GitHubMonitor, githubPRDescription(), GOAL_EVIDENCE_LIMITS, GitHubBoard, GitHubPR, GitHubState

### Community 86 - "requests.ts"
Cohesion: 0.08
Nodes (59): partialLocalCleanupCandidate(), assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), reconcileCompletedConflictDraft(), routeReadyPostConflictPublication() (+51 more)

### Community 87 - "follow-up-alerts.ts"
Cohesion: 0.38
Nodes (7): checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), repeatedVendorReviewBlock(), stoppedInVendorReview(), maintenanceSuperseded(), REOBSERVED

### Community 88 - "shared.ts"
Cohesion: 0.08
Nodes (31): ProjectReadiness, DailyCTOSummary, AssignmentResult, CompletionCondition, Continuation, DependencyObservation, EligibilityState, FailureCategory (+23 more)

### Community 89 - "run-ci-repair.ts"
Cohesion: 0.29
Nodes (12): ciCheckout(), verifyCIHooks(), CIFailure, guardCIRepair(), prepareCIMetadataRepair(), publishCIRepair(), rewordCommits(), CIPlanSchema (+4 more)

### Community 90 - ".constructor"
Cohesion: 0.24
Nodes (6): comparable(), EvidenceOutcome, recordRunEvidence(), backfillClaudeCost(), markCaptureStart(), RunAccounting

### Community 91 - "delivery-binding.ts"
Cohesion: 0.44
Nodes (7): approvedDelivery(), bindDelivery(), featureDeliveryContext(), featureEffectGate(), bindFeature(), enrolled(), acceptFeatureReview()

### Community 92 - "retrospective-facts.ts"
Cohesion: 0.23
Nodes (11): ARTIFACT_LIMIT, clip(), LEDGER_STEPS, MAINTENANCE_LIMIT, maintenanceFacts(), MaintenancePacketSection, clip(), PACKET_LIMIT (+3 more)

### Community 93 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 94 - "cli.ts"
Cohesion: 0.25
Nodes (6): args, [cmd,...rawArgs], commands, key, projectIndex, PORT

### Community 95 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 96 - "run-usage.ts"
Cohesion: 0.32
Nodes (6): CodexRollout, claudeCrashZero(), claudeUsage(), codexUsage(), count(), RunUsage

### Community 97 - "maintenance-triggers.ts"
Cohesion: 0.46
Nodes (7): clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates(), maintenanceCompletedId(), visibleMaintenanceTriggerIds(), RetrospectiveTrigger

### Community 98 - "codex-rollout-file.ts"
Cohesion: 0.36
Nodes (7): codexHome(), createdAt(), dayDirs(), header(), ROLLOUT_MAX_BYTES, RolloutScan, scanCodexRollouts()

### Community 99 - "leadership.ts"
Cohesion: 0.25
Nodes (7): DailyCTOBriefing, DailyCTOResult, DailyGoalUpdate, GoalEvidenceRef, GoalEvidenceRequest, GoalProgress, GoalStatus

### Community 100 - "needsDecision"
Cohesion: 0.70
Nodes (3): parksInJira(), DECISION_KINDS, needsDecision()

## Knowledge Gaps
- **344 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+339 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `remove-candidate.ts`, `GitHubDelivery`, `dependency-bots/adopt.ts`, `Inspector.tsx`, `cost-ledger.ts`, `github-delivery.ts`, `outbox.ts`, `digest`, `maintenance.ts`, `engine.ts`, `conversations/conversations.ts`, `GitHubFeaturePublisher`, `azure.ts`, `source-amendment.ts`, `features/workflow.ts`, `scheduled-work.ts`, `publish-pr.ts`, `retrospective-subject.ts`, `knowledge.ts`, `.save`, `implementation-recovery.ts`, `agents.ts`, `Coordinator`, `OfficeSnapshot`, `delivery-repairs.ts`, `time-scope.ts`, `assignment-poll.ts`, `api-routes.ts`, `run-accounting.ts`, `daily-cto.ts`, `accept-stage-result.ts`, `coordination.ts`, `notifications.ts`, `features.ts`, `dependencies.ts`, `tracking-issue.ts`, `it-specialist.ts`, `scheduler.ts`, `offices.ts`, `weekly-rollup.ts`, `discovery-recovery.ts`, `jira-time.ts`, `run-retrospective.ts`, `featureById`, `.getEffect`, `run.ts`, `knowledge-context.ts`, `command`, `session-bridge.ts`, `cec/workflow.ts`, `office-lessons.ts`, `artifact`, `create-candidate.ts`, `worker-runtime.ts`, `jira-publication.ts`, `.emit`, `coordination-tick.ts`, `evidence.ts`, `checkpoint-completion.ts`, `.transaction`, `retrospective-triggers.ts`, `.value`, `github.ts`, `requests.ts`, `.constructor`, `delivery-binding.ts`, `retrospective-facts.ts`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Why does `Role` connect `worker-runtime.ts` to `agents.ts`, `OfficeSnapshot`, `PeoplePanel.tsx`, `Inspector.tsx`, `index.tsx`, `github-delivery.ts`, `run-accounting.ts`, `outbox.ts`, `accept-stage-result.ts`, `maintenance.ts`, `.emit`, `OfficeScene.tsx`, `conversations/conversations.ts`, `scheduler.ts`, `source-amendment.ts`, `shared.ts`, `Store`, `retrospective-subject.ts`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `TicketJob` connect `github-delivery.ts` to `remove-candidate.ts`, `GitHubDelivery`, `dependency-bots/adopt.ts`, `index.tsx`, `digest`, `source-amendment.ts`, `work-summary.ts`, `publish-pr.ts`, `retrospective-subject.ts`, `implementation-recovery.ts`, `delivery-repairs.ts`, `assignment-poll.ts`, `accept-stage-result.ts`, `fact-bounds.ts`, `closeout.ts`, `dependencies.ts`, `tracking-issue.ts`, `it-specialist.ts`, `scheduler.ts`, `Store`, `discovery-recovery.ts`, `artifact`, `create-candidate.ts`, `retrospective-triggers.ts`, `.value`, `requests.ts`, `shared.ts`, `run-ci-repair.ts`, `delivery-binding.ts`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `command()` (e.g. with `.constructor()` and `executeRequest()`) actually correct?**
  _`command()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _344 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `GitHubDelivery` be split into smaller, more focused modules?**
  _Cohesion score 0.07587382779198636 - nodes in this community are weakly interconnected._
- **Should `Engine` be split into smaller, more focused modules?**
  _Cohesion score 0.10952380952380952 - nodes in this community are weakly interconnected._