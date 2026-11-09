# Graph Report - office  (2026-11-09)

## Corpus Check
- 504 files · ~238,634 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2857 nodes · 12070 edges · 93 communities (91 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 67 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5a3c1181`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- .transaction
- github-delivery.ts
- Inspector.tsx
- workKey
- source-amendment.ts
- artifact
- shared.ts
- OfficeScene.tsx
- agents.ts
- App.tsx
- blocker-followups.ts
- azure.ts
- conversations/conversations.ts
- digest
- GitHubDelivery
- worker-runtime.ts
- activation-recovery.ts
- index.ts
- TimeBook.tsx
- source-amendment-scope.ts
- maintenance.ts
- PeoplePanel.tsx
- store.ts
- dependency-bots/adopt.ts
- record-trigger.ts
- SettingsPanel.tsx
- Store
- sanitize
- daily-cto.ts
- process.ts
- knowledge.ts
- cost-ledger.ts
- github/issue-publication.ts
- session-bridge.ts
- MaintenanceRun
- publish-pr.ts
- preparation-readback.ts
- .save
- scheduler.ts
- time-scope.ts
- FeatureWorkspace.tsx
- Coordinator
- admit-improvement.ts
- run-retrospective.ts
- work-summary.ts
- Engine
- remove-candidate.ts
- retrospective-subject.ts
- weekly-rollup.ts
- useOfficePreferences.ts
- telemetry.ts
- .emit
- closeout.ts
- .now
- cec/workflow.ts
- dependencies.ts
- .getEffect
- weekly-research.ts
- coordination.ts
- engine.ts
- scheduled-work.ts
- delivery-binding.ts
- config.ts
- jira-time.ts
- GitHubIssuePublisher
- retrospective-facts.ts
- report.ts
- run-accounting.ts
- control-store.ts
- office-lessons.ts
- coordination-tick.ts
- DailyCTO.tsx
- assignment-poll.ts
- OfficeProject
- approach.ts
- owned-artifact.ts
- Offices
- helper-usage.ts
- work.ts
- delivery-task.ts
- time-readback.ts
- command-registry.ts
- requeue-waited-implement.ts
- cost-totals.ts
- codex-rollout.ts
- merge-summary.ts
- run-usage.ts
- codex-rollout-file.ts
- install-service.mjs
- .value
- slack-supersession.ts
- helper-evidence.py

## God Nodes (most connected - your core abstractions)
1. `Store` - 269 edges
2. `TicketJob` - 121 edges
3. `GitHubDelivery` - 117 edges
4. `command()` - 97 edges
5. `artifact()` - 85 edges
6. `digest()` - 82 edges
7. `cx()` - 77 edges
8. `workKey()` - 73 edges
9. `OfficeSnapshot` - 66 edges
10. `StageResult` - 64 edges

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
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/recovery/retire-external-delivery.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/conversations/conversations.ts -> server/scheduling/engine.ts -> server/workers/agents.ts -> server/conversations/conversations.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/stage-prompts.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-checkout.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-evidence.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-preparation.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/conversations/conversation-recovery.ts -> server/conversations/conversations.ts -> server/conversations/team-conversation-pump.ts -> server/conversations/conversation-recovery.ts`
- 3-file cycle: `server/scheduling/coordination-pump.ts -> server/scheduling/requests.ts -> server/scheduling/coordination.ts -> server/scheduling/coordination-pump.ts`
- 3-file cycle: `server/scheduling/coordination-tick.ts -> server/scheduling/requests.ts -> server/scheduling/coordination.ts -> server/scheduling/coordination-tick.ts`

## Communities (93 total, 2 thin omitted)

### Community 0 - ".transaction"
Cohesion: 0.05
Nodes (72): Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), plainDescription(), Transition, unpack() (+64 more)

### Community 1 - "github-delivery.ts"
Cohesion: 0.07
Nodes (81): containedFile(), findingsBlock(), namedRepairIds(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery(), BOARD_RULE (+73 more)

### Community 2 - "Inspector.tsx"
Cohesion: 0.07
Nodes (72): Conversation(), Outbox(), SendMessage, slackMessageStatus(), SlackDeliveryCard(), ServiceHealthPanel(), labels, ServiceHealthRow() (+64 more)

### Community 3 - "workKey"
Cohesion: 0.06
Nodes (56): completedPRReviews(), savedActivationFailure(), continuationScope(), Assessment, diagnosticProof(), discoveryRecoveryCandidate(), ownedArtifact(), Ownership (+48 more)

### Community 4 - "source-amendment.ts"
Cohesion: 0.08
Nodes (64): adoptCandidate(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat() (+56 more)

### Community 5 - "artifact"
Cohesion: 0.12
Nodes (58): PrerequisitesSchema, allowed, assertContinuationWorker(), continuationNativeReview(), continuationReviewArtifacts(), continuationWorkerProof(), continuationWorktree(), negativeWorker() (+50 more)

### Community 6 - "shared.ts"
Cohesion: 0.06
Nodes (45): projectOutbox(), syncOutbox(), projectSlackDeliveries(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint(), slackRequestSettled() (+37 more)

### Community 7 - "OfficeScene.tsx"
Cohesion: 0.06
Nodes (54): displayAgentTask(), githubStageLabels, withoutElapsed(), LiveAgentTask(), Props, RunningTask(), text(), Avatar() (+46 more)

### Community 8 - "agents.ts"
Cohesion: 0.07
Nodes (40): cecPrompt(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), resolvedDecisionNote(), stageInstructions, cecChatPrompt() (+32 more)

### Community 9 - "App.tsx"
Cohesion: 0.05
Nodes (51): blank(), goalInput, Goals(), CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants, ElevatorPhase (+43 more)

### Community 10 - "blocker-followups.ts"
Cohesion: 0.08
Nodes (42): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), partialLocalCleanupKey(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved() (+34 more)

### Community 11 - "azure.ts"
Cohesion: 0.07
Nodes (42): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+34 more)

### Community 12 - "conversations/conversations.ts"
Cohesion: 0.08
Nodes (36): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+28 more)

### Community 13 - "digest"
Cohesion: 0.11
Nodes (48): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+40 more)

### Community 14 - "GitHubDelivery"
Cohesion: 0.10
Nodes (31): GitHubDelivery, checksFailed(), checksPassed(), checksPending(), currentMergeChecks(), pass(), pending(), requireThat() (+23 more)

### Community 15 - "worker-runtime.ts"
Cohesion: 0.07
Nodes (35): SlackResultSchema, SlackVerificationSchema, assignmentSubject(), dispatchExposure(), contextPacket(), DeliverySlot, officeCapacity, CODEX_DEFAULT_EFFORT (+27 more)

### Community 16 - "activation-recovery.ts"
Cohesion: 0.10
Nodes (35): HarnessControl, activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal (+27 more)

### Community 17 - "index.ts"
Cohesion: 0.09
Nodes (30): close(), config, itSpecialist, loadedRevision, offices, releaseLock, server, serviceHealth (+22 more)

### Community 18 - "TimeBook.tsx"
Cohesion: 0.10
Nodes (35): TelemetryReport, AzureBuild, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens(), usd() (+27 more)

### Community 19 - "source-amendment-scope.ts"
Cohesion: 0.08
Nodes (39): approvedText(), assert(), assert(), normalize(), officialUrls, ReleaseCapture, verifyReleaseCaptures(), amendmentCaptureObservation() (+31 more)

### Community 20 - "maintenance.ts"
Cohesion: 0.10
Nodes (27): maintenancePolicies(), captureMaintenanceStep(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice(), candidateOwner() (+19 more)

### Community 21 - "PeoplePanel.tsx"
Cohesion: 0.11
Nodes (35): label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+27 more)

### Community 22 - "store.ts"
Cohesion: 0.13
Nodes (21): channelNoticeAuthorized(), notices(), queueChannelNotice(), Identity, MergeNotifications, reconcileNoticeConfirmations(), comparableSlackText(), SlackMessages (+13 more)

### Community 23 - "dependency-bots/adopt.ts"
Cohesion: 0.13
Nodes (31): Execute, readBackOrThrow(), adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR (+23 more)

### Community 24 - "record-trigger.ts"
Cohesion: 0.11
Nodes (34): baselineLearning(), LEARNING_BASELINES, maintainLearning(), configureKnowledge(), clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates() (+26 more)

### Community 25 - "SettingsPanel.tsx"
Cohesion: 0.15
Nodes (26): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView() (+18 more)

### Community 26 - "Store"
Cohesion: 0.09
Nodes (8): JiraOperations, plain(), Execute, GitHubFeaturePublisher, Result, Store, command(), OfficeEvent

### Community 27 - "sanitize"
Cohesion: 0.10
Nodes (26): settleRequestedSlackReplacement(), investigationEvidence(), OFFICE_FIX_PROMPT, OfficeFixResult, validateOfficeFix(), officeSource(), investigationReady(), INVESTIGATION_ATTEMPTS (+18 more)

### Community 28 - "daily-cto.ts"
Cohesion: 0.10
Nodes (15): DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), Briefing, saveReviewBriefing(), ControlStore, DailyCTOBriefing (+7 more)

### Community 29 - "process.ts"
Cohesion: 0.11
Nodes (24): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, At (+16 more)

### Community 30 - "knowledge.ts"
Cohesion: 0.08
Nodes (30): LessonSelection, Kind, RetrospectiveResult, Stage, SEEDS, BlockerFollowup, ImprovementGrant, KnowledgeRetry (+22 more)

### Community 31 - "cost-ledger.ts"
Cohesion: 0.15
Nodes (26): EffectUncertainError, captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId() (+18 more)

### Community 32 - "github/issue-publication.ts"
Cohesion: 0.16
Nodes (27): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), ProjectCard, projectCards(), projectGraphql() (+19 more)

### Community 33 - "session-bridge.ts"
Cohesion: 0.14
Nodes (22): claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexSessionContext(), readRollout, claudeSessions(), codexSessions() (+14 more)

### Community 34 - "MaintenanceRun"
Cohesion: 0.12
Nodes (18): BrainFollowup, BrainStatusSchema, identity, brainCheckpointCompletion(), coverageSchema, followupSchema, verified, reconcileCompletedCheckpoints() (+10 more)

### Community 35 - "publish-pr.ts"
Cohesion: 0.17
Nodes (21): activeEffectId(), harnessEffect, assertMayMutate(), retryRead(), park(), developerPRContent(), Execute, lintPRContent() (+13 more)

### Community 36 - "preparation-readback.ts"
Cohesion: 0.14
Nodes (24): assertPostConflictOwnership(), bindPreparationBoardOrigins(), claimSchema, eventSchema, PreparationBoardOrigin, readPreparationBoardOrigins(), timestamp, updateSchema (+16 more)

### Community 37 - ".save"
Cohesion: 0.24
Nodes (23): BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue(), readIssues(), commentDecision() (+15 more)

### Community 38 - "scheduler.ts"
Cohesion: 0.16
Nodes (13): ROLES, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch(), foreignWork() (+5 more)

### Community 39 - "time-scope.ts"
Cohesion: 0.20
Nodes (22): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), ScopePolicy, scopeSelector(), midnight(), TicketDay, ticketDayTotals(), captureTime() (+14 more)

### Community 40 - "FeatureWorkspace.tsx"
Cohesion: 0.14
Nodes (19): FeatureRound, FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures(), draftKey() (+11 more)

### Community 41 - "Coordinator"
Cohesion: 0.08
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 42 - "admit-improvement.ts"
Cohesion: 0.18
Nodes (19): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident() (+11 more)

### Community 43 - "run-retrospective.ts"
Cohesion: 0.14
Nodes (21): appendLearningFacts(), freezeLearningPacket(), busyMaintenanceIds(), retrospectivePrompt(), SUBJECT, RetrospectiveResultSchema, terminalCandidates(), triggerJobId() (+13 more)

### Community 44 - "work-summary.ts"
Cohesion: 0.19
Nodes (20): themeColor, App(), ACTIVE, maintenanceUpdate(), PMQueueItem, pmQueueItems(), deliveryChanges(), following (+12 more)

### Community 45 - "Engine"
Cohesion: 0.09
Nodes (5): correlatedBuild(), Engine, observe(), observeParked(), parkedReadError

### Community 46 - "remove-candidate.ts"
Cohesion: 0.19
Nodes (17): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), removeAdoptedClone() (+9 more)

### Community 47 - "retrospective-subject.ts"
Cohesion: 0.15
Nodes (19): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+11 more)

### Community 48 - "weekly-rollup.ts"
Cohesion: 0.18
Nodes (18): learningMetrics(), lessonsNeedingReview(), RollupResult, RollupResultSchema, lastFriday(), ROLLUP_HISTORY, rollupDue(), RollupHooks (+10 more)

### Community 49 - "useOfficePreferences.ts"
Cohesion: 0.12
Nodes (18): fields, PreferencesPatch, StoredBody, acceptPreferences(), PreferenceCandidate, PreferenceState, strip(), UNKNOWN_PREFERENCES (+10 more)

### Community 50 - "telemetry.ts"
Cohesion: 0.12
Nodes (20): CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL, Rates (+12 more)

### Community 51 - ".emit"
Cohesion: 0.19
Nodes (18): ChannelSettings, configureChannelNotices(), configureNotices(), NoticeSettings, retryRecipientLookup(), bindDiscoveryResume(), DiscoveryResumeInput, declineLessonIssue() (+10 more)

### Community 52 - "closeout.ts"
Cohesion: 0.21
Nodes (17): installDependencies(), major(), harnessCloseout(), PASSING, verifyMergeActions(), withHarnessWork(), runHarnessStage(), harnessStageResult() (+9 more)

### Community 53 - ".now"
Cohesion: 0.14
Nodes (10): featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), recoverFeatures(), checkpointMeasurement(), HEARTBEAT_GAP_MS, HEARTBEAT_MS, startMeasurement() (+2 more)

### Community 54 - "cec/workflow.ts"
Cohesion: 0.21
Nodes (17): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), run(), nextStage(), publicationEvidenceGap(), qaEvidenceGap(), resultGate() (+9 more)

### Community 55 - "dependencies.ts"
Cohesion: 0.23
Nodes (18): Admission, admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, compatible(), dependencyCompletionKey(), dependencyEligibility() (+10 more)

### Community 56 - ".getEffect"
Cohesion: 0.23
Nodes (8): GitHubOperations, fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), Assessment, closeNativeRefresh(), fingerprint(), EffectIntent

### Community 57 - "weekly-research.ts"
Cohesion: 0.20
Nodes (15): learningDigest(), recordLearningOpportunity(), expireLearningPackets(), packetReferences(), publicTopicSafe(), researchTopics(), TEMPLATES, retryDelay() (+7 more)

### Community 58 - "coordination.ts"
Cohesion: 0.18
Nodes (18): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation(), checkpointWindow(), dueAt() (+10 more)

### Community 59 - "engine.ts"
Cohesion: 0.22
Nodes (16): checkMail(), drainMail(), requestMail(), dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), resume() (+8 more)

### Community 60 - "scheduled-work.ts"
Cohesion: 0.20
Nodes (15): deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), preparationRequestResolved(), withAmendmentOwnership(), deterministicActions, eligible(), requestResolved() (+7 more)

### Community 61 - "delivery-binding.ts"
Cohesion: 0.24
Nodes (14): approvedDelivery(), bindDelivery(), featureEffectGate(), assertFeatureGate(), bindFeature(), currentApproval(), enrolled(), featureGate() (+6 more)

### Community 62 - "config.ts"
Cohesion: 0.13
Nodes (13): args, [cmd,...rawArgs], commands, key, projectIndex, DATA, LOCAL_BINDINGS, PORT (+5 more)

### Community 63 - "jira-time.ts"
Cohesion: 0.22
Nodes (12): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+4 more)

### Community 64 - "GitHubIssuePublisher"
Cohesion: 0.30
Nodes (5): Assign, Board, GitHubIssuePublisher, number(), same()

### Community 65 - "retrospective-facts.ts"
Cohesion: 0.21
Nodes (12): ARTIFACT_LIMIT, clip(), LEDGER_STEPS, MAINTENANCE_LIMIT, maintenanceFacts(), MaintenancePacketSection, clip(), PACKET_LIMIT (+4 more)

### Community 66 - "report.ts"
Cohesion: 0.21
Nodes (16): TelemetryRow, TelemetrySync, TimeLedgerState, Acc, bump(), EASTERN, easternDay(), modelShares() (+8 more)

### Community 67 - "run-accounting.ts"
Cohesion: 0.20
Nodes (15): readCodexRollout(), codexAccounting(), COMPLETION_MAX_BYTES, merge(), readCompletion(), RECONCILE_GRACE_MS, reconcileUncapturedRuns(), reconciling (+7 more)

### Community 68 - "control-store.ts"
Cohesion: 0.23
Nodes (8): Clock, systemClock, applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, statementCache(), initialSnapshot()

### Community 69 - "office-lessons.ts"
Cohesion: 0.30
Nodes (10): normalizeStatement(), decideOfficeProposal(), mirrorOfficeKnowledge(), now(), OfficeKnowledgeStore, proposeOfficeLessons(), retireOfficeLesson(), Input (+2 more)

### Community 70 - "coordination-tick.ts"
Cohesion: 0.26
Nodes (9): legacy, reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION, tick(), IntakeResult, reconcileReadRetries() (+1 more)

### Community 71 - "DailyCTO.tsx"
Cohesion: 0.26
Nodes (8): CTOReview(), goalState, DailyCTO(), GoalHistory(), reportDate(), reviewStatus, reviewExcerpt(), ReviewText()

### Community 72 - "assignment-poll.ts"
Cohesion: 0.38
Nodes (7): noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), pinCourier, resumeParked(), poll(), readAssignments()

### Community 73 - "OfficeProject"
Cohesion: 0.33
Nodes (9): AUTO_ADOPT_BOTS, OfficeConfigInputs, officeConfigRoute(), officeConfigSummary(), CECBinding, localBindings, assertModelOverrides(), ModelOverrides (+1 more)

### Community 74 - "approach.ts"
Cohesion: 0.44
Nodes (10): afterDraft(), ApproachSchema, firstBuildStage(), missingApproachStage(), plannedNext(), recordApproach(), reroute(), stageNeeded() (+2 more)

### Community 75 - "owned-artifact.ts"
Cohesion: 0.33
Nodes (8): OFFICE_SOURCE_PATHS, BoundedRead, done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf(), CompletionReader

### Community 76 - "Offices"
Cohesion: 0.33
Nodes (3): projectById(), PROJECTS, Offices

### Community 77 - "helper-usage.ts"
Cohesion: 0.24
Nodes (8): backfillClaudeCost(), codexHome(), HELPER_STDOUT_MAX_BYTES, helperAccounting(), claudeAccounting(), completionAccounting(), markCaptureStart(), withReason()

### Community 78 - "work.ts"
Cohesion: 0.18
Nodes (10): AssignmentResult, CompletionCondition, DependencyObservation, EligibilityState, FailureCategory, ReconciliationAction, WorkAssignment, WorkFailure (+2 more)

### Community 79 - "delivery-task.ts"
Cohesion: 0.31
Nodes (7): deliveryTask(), DeliveryTaskInput, DISCOVERY_GUIDANCE, compactSteps(), AMENDMENT_REVIEW_PROOF, featureDeliveryContext(), deliveryResearchContext()

### Community 80 - "time-readback.ts"
Cohesion: 0.22
Nodes (8): Readback, READBACK_INTERVAL_MS, SETTLE_MS, ConfirmedSegment, LiveAnchor, ObservationGap, SnapshotOrdering, TimePublication

### Community 81 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 82 - "requeue-waited-implement.ts"
Cohesion: 0.39
Nodes (6): parksInJira(), DECISION_KINDS, needsDecision(), APPROACH_GUARD_REJECTION, failedWorker(), requeueWaitedImplement()

### Community 83 - "cost-totals.ts"
Cohesion: 0.36
Nodes (8): isModelWork(), isTicketModelWork(), awaitingEvidence(), CaptureContext, inCostWindow(), TicketCost, ticketCosts(), ISSUE_KEY

### Community 84 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 85 - "merge-summary.ts"
Cohesion: 0.36
Nodes (7): clamp(), LIMITS, MergedPR, plainSlackText(), section(), shippedSummary(), mergeText()

### Community 86 - "run-usage.ts"
Cohesion: 0.38
Nodes (5): CodexRollout, claudeCrashZero(), claudeUsage(), count(), RunUsage

### Community 87 - "codex-rollout-file.ts"
Cohesion: 0.43
Nodes (6): createdAt(), dayDirs(), header(), ROLLOUT_MAX_BYTES, RolloutScan, scanCodexRollouts()

### Community 88 - "install-service.mjs"
Cohesion: 0.33
Nodes (5): file, folder, logs, root, xml()

### Community 90 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

## Knowledge Gaps
- **347 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+342 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `.transaction`, `github-delivery.ts`, `workKey`, `source-amendment.ts`, `artifact`, `shared.ts`, `agents.ts`, `blocker-followups.ts`, `azure.ts`, `conversations/conversations.ts`, `digest`, `worker-runtime.ts`, `activation-recovery.ts`, `maintenance.ts`, `store.ts`, `dependency-bots/adopt.ts`, `record-trigger.ts`, `sanitize`, `process.ts`, `knowledge.ts`, `cost-ledger.ts`, `github/issue-publication.ts`, `session-bridge.ts`, `MaintenanceRun`, `publish-pr.ts`, `preparation-readback.ts`, `.save`, `scheduler.ts`, `time-scope.ts`, `admit-improvement.ts`, `run-retrospective.ts`, `remove-candidate.ts`, `retrospective-subject.ts`, `weekly-rollup.ts`, `.emit`, `.now`, `cec/workflow.ts`, `dependencies.ts`, `.getEffect`, `weekly-research.ts`, `coordination.ts`, `engine.ts`, `scheduled-work.ts`, `delivery-binding.ts`, `jira-time.ts`, `retrospective-facts.ts`, `run-accounting.ts`, `control-store.ts`, `office-lessons.ts`, `coordination-tick.ts`, `owned-artifact.ts`, `helper-usage.ts`, `delivery-task.ts`, `time-readback.ts`, `requeue-waited-implement.ts`?**
  _High betweenness centrality (0.118) - this node is a cross-community bridge._
- **Why does `command()` connect `Store` to `.transaction`, `github-delivery.ts`, `source-amendment.ts`, `shared.ts`, `agents.ts`, `azure.ts`, `digest`, `GitHubDelivery`, `worker-runtime.ts`, `index.ts`, `maintenance.ts`, `store.ts`, `sanitize`, `process.ts`, `cost-ledger.ts`, `github/issue-publication.ts`, `session-bridge.ts`, `publish-pr.ts`, `.save`, `admit-improvement.ts`, `Engine`, `remove-candidate.ts`, `cec/workflow.ts`, `dependencies.ts`, `.getEffect`, `coordination.ts`, `engine.ts`, `jira-time.ts`, `time-readback.ts`, `command-registry.ts`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `Engine` connect `Engine` to `.transaction`, `github-delivery.ts`, `coordination.ts`, `shared.ts`, `agents.ts`, `azure.ts`, `conversations/conversations.ts`, `digest`, `maintenance.ts`, `cec/workflow.ts`, `store.ts`, `.getEffect`, `Store`, `engine.ts`, `scheduled-work.ts`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `command()` (e.g. with `.constructor()` and `executeRequest()`) actually correct?**
  _`command()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _347 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `.transaction` be split into smaller, more focused modules?**
  _Cohesion score 0.054550222921584055 - nodes in this community are weakly interconnected._
- **Should `github-delivery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06551724137931035 - nodes in this community are weakly interconnected._