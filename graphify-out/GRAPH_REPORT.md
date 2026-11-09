# Graph Report - office  (2026-11-09)

## Corpus Check
- 526 files · ~249,300 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2966 nodes · 12594 edges · 96 communities (95 shown, 1 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 68 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `068179a4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- github-delivery.ts
- artifact
- .transaction
- source-amendment.ts
- shared.ts
- GitHubDelivery
- index.tsx
- activation-recovery.ts
- Inspector.tsx
- OfficeScene.tsx
- daily-cto.ts
- schedule.ts
- Store
- index.ts
- store.ts
- record-trigger.ts
- TimeBook.tsx
- maintenance.ts
- SettingsPanel.tsx
- requests.ts
- conversations/conversations.ts
- work-summary.ts
- run-retrospective.ts
- executeRequest
- cost-ledger.ts
- session-bridge.ts
- it-specialist.ts
- digest
- github/issue-publication.ts
- worker-runtime.ts
- knowledge.ts
- notifications.ts
- offices.ts
- tracking-issue.ts
- weekly-rollup.ts
- dependency-bots/adopt.ts
- http/commands.ts
- .getEffect
- telemetry.ts
- cec/issue-publication.ts
- .save
- ticket-stage-runner.ts
- scheduler.ts
- agents.ts
- .emit
- investigations/run.ts
- remove-candidate.ts
- dependencies.ts
- goal-evidence.ts
- scheduled-work.ts
- observations.ts
- time-scope.ts
- Engine
- publish-pr.ts
- validate-stage.ts
- engine.ts
- assignment-poll.ts
- outbox.ts
- coordination-tick.ts
- saved-prerequisite-handoff.ts
- coordination.ts
- run-accounting.ts
- Button
- effects.ts
- jira-time.ts
- WorkTime
- azure.ts
- TeamMessage
- investigations/ledger.ts
- admit-improvement.ts
- retrospective-subject.ts
- lesson-selection.ts
- codex-rollout.ts
- Ticket
- contract.ts
- checkpoint-completion.ts
- preferences-store.ts
- cec/workflow.ts
- blocker-followups.ts
- closeout.ts
- workKey
- evidence.ts
- weekly-research.ts
- cost-totals.ts
- work.ts
- DailyCTO.tsx
- .value
- recovery-ledger.ts
- command-registry.ts
- diagnostic-context.ts
- codex-rollout-file.ts
- model-routes.ts
- OfficeConfigView.tsx
- slack-supersession.ts
- helper-evidence.py

## God Nodes (most connected - your core abstractions)
1. `Store` - 278 edges
2. `TicketJob` - 124 edges
3. `GitHubDelivery` - 119 edges
4. `command()` - 99 edges
5. `artifact()` - 87 edges
6. `digest()` - 84 edges
7. `cx()` - 77 edges
8. `workKey()` - 75 edges
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
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/recovery/retire-external-delivery.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-guard.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/queue-repairs.ts -> server/delivery/repairs/reconcile-ci-diagnosis.ts -> server/delivery/pipeline/github-delivery.ts`
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

## Communities (96 total, 1 thin omitted)

### Community 0 - "github-delivery.ts"
Cohesion: 0.06
Nodes (83): containedFile(), findingsBlock(), namedRepairIds(), assertMayMutate(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery() (+75 more)

### Community 1 - "artifact"
Cohesion: 0.07
Nodes (88): closeoutCheckpoint(), closeoutRecoveryCandidate(), CloseoutRecoveryKind, coreCloseoutNative(), partialLocalCleanupCandidate(), savedActivationFailure(), allowed, continuationArtifacts() (+80 more)

### Community 2 - ".transaction"
Cohesion: 0.08
Nodes (61): approveFeature(), assertRetainedItems(), commandFeature(), createFeature(), featureById(), mutation(), reviewQuestions(), discoveryPrompt() (+53 more)

### Community 3 - "source-amendment.ts"
Cohesion: 0.06
Nodes (73): deliveryTask(), DeliveryTaskInput, DISCOVERY_GUIDANCE, compactSteps(), adoptCandidate(), reported, Scope, approvedText() (+65 more)

### Community 4 - "shared.ts"
Cohesion: 0.06
Nodes (64): ProjectReadiness, DailyCTOSummary, GoalProgress, Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId (+56 more)

### Community 5 - "GitHubDelivery"
Cohesion: 0.08
Nodes (47): GitHubDelivery, observe(), stageRole(), checksFailed(), checksPassed(), checksPending(), CurrentChecksWait, currentMergeChecks() (+39 more)

### Community 6 - "index.tsx"
Cohesion: 0.08
Nodes (52): Conversation(), recommendedReply(), slackMessageStatus(), SlackDeliveryCard(), labels, ServiceHealthRow(), BlockerFollowups(), IntakeSummary() (+44 more)

### Community 7 - "activation-recovery.ts"
Cohesion: 0.09
Nodes (58): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+50 more)

### Community 8 - "Inspector.tsx"
Cohesion: 0.05
Nodes (58): SendMessage, blank(), goalInput, Goals(), CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants (+50 more)

### Community 9 - "OfficeScene.tsx"
Cohesion: 0.06
Nodes (57): displayAgentTask(), withoutElapsed(), LiveAgentTask(), Props, RunningTask(), text(), Avatar(), AzureWall() (+49 more)

### Community 10 - "daily-cto.ts"
Cohesion: 0.06
Nodes (39): collectCTOFacts(), DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), boundedIntake(), boundedJobs(), boundedMaintenance() (+31 more)

### Community 11 - "schedule.ts"
Cohesion: 0.12
Nodes (46): KnowledgeRunner, captureProposal(), effectId(), newTask(), recordObservation(), settlePage(), Config, configDigest() (+38 more)

### Community 12 - "Store"
Cohesion: 0.08
Nodes (14): JiraOperations, plain(), Assessment, Store, probeProcessGroup(), GIT_NETWORK, LIVE_PROVIDERS, liveReach() (+6 more)

### Community 13 - "index.ts"
Cohesion: 0.08
Nodes (38): args, [cmd,...rawArgs], commands, key, projectIndex, close(), config, itSpecialist (+30 more)

### Community 14 - "store.ts"
Cohesion: 0.08
Nodes (25): featureItemComplete(), reconcileFeatureCompletion(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), helperTelemetry(), recoverFeatures(), dispatchExposure() (+17 more)

### Community 15 - "record-trigger.ts"
Cohesion: 0.09
Nodes (43): baselineLearning(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences(), busyMaintenanceIds(), clip(), maintenanceBlockedId() (+35 more)

### Community 16 - "TimeBook.tsx"
Cohesion: 0.10
Nodes (35): TelemetryReport, AzureBuild, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens(), usd() (+27 more)

### Community 17 - "maintenance.ts"
Cohesion: 0.10
Nodes (28): maintenancePolicies(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice(), candidateOwner(), SETTLED (+20 more)

### Community 18 - "SettingsPanel.tsx"
Cohesion: 0.11
Nodes (32): FeatureWorkspace(), SaveFeedback(), GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS, PickupForm(), acceptPreferences() (+24 more)

### Community 19 - "requests.ts"
Cohesion: 0.12
Nodes (38): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutProviderEvidence() (+30 more)

### Community 20 - "conversations/conversations.ts"
Cohesion: 0.10
Nodes (25): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+17 more)

### Community 21 - "work-summary.ts"
Cohesion: 0.11
Nodes (32): Outbox(), themeColor, App(), usePanelFocus(), TicketDetail(), useOffice(), envelopeCard, deliveryRepairProjection() (+24 more)

### Community 22 - "run-retrospective.ts"
Cohesion: 0.12
Nodes (28): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, learningDigest(), appendLearningFacts(), freezeLearningPacket(), ARTIFACT_LIMIT, clip() (+20 more)

### Community 23 - "executeRequest"
Cohesion: 0.07
Nodes (4): coordination(), Coordinator, executeRequest(), AssignedIssue

### Community 24 - "cost-ledger.ts"
Cohesion: 0.14
Nodes (27): EffectUncertainError, captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId() (+19 more)

### Community 25 - "session-bridge.ts"
Cohesion: 0.13
Nodes (23): claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexSessionContext(), readRollout, claudeSessions(), codexSessions() (+15 more)

### Community 26 - "it-specialist.ts"
Cohesion: 0.12
Nodes (18): partialLocalCleanupKey(), ITContext, publishITReport(), ITSpecialist, delays, recoverAttempt(), ServiceContext, listenerHealth() (+10 more)

### Community 27 - "digest"
Cohesion: 0.17
Nodes (30): Assessment, outsideScanSources(), Ownership, reconcileScopeRepairReadback(), requireThat(), scopeRepairReadbackCandidate(), scopeRepairRequestResolved(), sha (+22 more)

### Community 28 - "github/issue-publication.ts"
Cohesion: 0.17
Nodes (11): FeaturePublisher, PublicationReceipt, Assign, Board, Content, GitHubIssuePublisher, number(), same() (+3 more)

### Community 29 - "worker-runtime.ts"
Cohesion: 0.14
Nodes (21): assignmentSubject(), claudeArguments(), ClaudeStream, DEVELOPER_EFFORT, DEVELOPER_MODEL, codexArguments(), personaContext(), recordWorkerFailure() (+13 more)

### Community 30 - "knowledge.ts"
Cohesion: 0.09
Nodes (28): Kind, Stage, SEEDS, BlockerFollowup, ImprovementGrant, KnowledgeRetry, KnowledgeState, LearningMetrics (+20 more)

### Community 31 - "notifications.ts"
Cohesion: 0.13
Nodes (19): clamp(), LIMITS, MergedPR, plainSlackText(), section(), shippedSummary(), configureNotices(), Identity (+11 more)

### Community 32 - "offices.ts"
Cohesion: 0.13
Nodes (12): projectSlackDeliveries(), readLocalIntakeReport(), DELIVERY_CONCURRENCY, LOCAL_BINDINGS, file, project, root, DeliverySlot (+4 more)

### Community 33 - "tracking-issue.ts"
Cohesion: 0.20
Nodes (24): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard, projectCards() (+16 more)

### Community 34 - "weekly-rollup.ts"
Cohesion: 0.14
Nodes (22): learningMetrics(), lessonsNeedingReview(), RollupResult, RollupResultSchema, harperFolder(), RETROSPECTIVE_TIMEOUT, ROLLUP_HISTORY, rollupDue() (+14 more)

### Community 35 - "dependency-bots/adopt.ts"
Cohesion: 0.19
Nodes (22): adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR, inPickupLane(), openDependabotPulls() (+14 more)

### Community 36 - "http/commands.ts"
Cohesion: 0.18
Nodes (20): retryRecipientLookup(), normalizeStatement(), configureKnowledge(), declineLessonIssue(), demoteLesson(), reactivateLesson(), retireLesson(), decideOfficeProposal() (+12 more)

### Community 37 - ".getEffect"
Cohesion: 0.17
Nodes (14): Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership, rawHash() (+6 more)

### Community 38 - "telemetry.ts"
Cohesion: 0.11
Nodes (24): CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL, Rates (+16 more)

### Community 39 - "cec/issue-publication.ts"
Cohesion: 0.22
Nodes (8): Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), plainDescription(), Transition, JiraFeaturePublisher

### Community 40 - ".save"
Cohesion: 0.24
Nodes (23): unpack(), BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue(), readIssues() (+15 more)

### Community 41 - "ticket-stage-runner.ts"
Cohesion: 0.19
Nodes (22): parksInJira(), run(), afterDraft(), ApproachSchema, firstBuildStage(), missingApproachStage(), plannedNext(), recordApproach() (+14 more)

### Community 42 - "scheduler.ts"
Cohesion: 0.16
Nodes (13): ROLES, officeCapacity, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch() (+5 more)

### Community 43 - "agents.ts"
Cohesion: 0.12
Nodes (21): cecPrompt(), resolvedDecisionNote(), stageInstructions, HANDS_OFF_RESOLUTION_GUIDANCE, RESOLUTION_GUIDANCE, reviewInstructions(), SKILLS, labels (+13 more)

### Community 44 - ".emit"
Cohesion: 0.16
Nodes (13): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), reconcileNoticeConfirmations(), comparableSlackText(), settleRequestedSlackReplacement() (+5 more)

### Community 45 - "investigations/run.ts"
Cohesion: 0.14
Nodes (18): OFFICE_FIX_PROMPT, OfficeFixResult, validateOfficeFix(), investigationReady(), INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, InvestigationOptions, InvestigationReport (+10 more)

### Community 46 - "remove-candidate.ts"
Cohesion: 0.19
Nodes (17): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), removeAdoptedClone() (+9 more)

### Community 47 - "dependencies.ts"
Cohesion: 0.21
Nodes (19): Admission, admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, resumeParked(), compatible(), dependencyCompletionKey() (+11 more)

### Community 48 - "goal-evidence.ts"
Cohesion: 0.15
Nodes (17): AUTO_ADOPT_BOTS, GitHubMonitor, githubPRDescription(), azureGoalFacts(), azurePRDescription(), boundedEvidence(), collectAzureGoalDocuments(), EvidenceStore (+9 more)

### Community 49 - "scheduled-work.ts"
Cohesion: 0.16
Nodes (19): deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), scheduledSlackIntake(), deterministicActions (+11 more)

### Community 50 - "observations.ts"
Cohesion: 0.15
Nodes (18): exactly(), Message, nativeReadPayload(), pagination(), nativeFile(), Message, observeRead(), Page (+10 more)

### Community 51 - "time-scope.ts"
Cohesion: 0.21
Nodes (20): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), scopeSelector(), midnight(), TicketDay, ticketDayTotals(), captureTime(), timeLedger() (+12 more)

### Community 52 - "Engine"
Cohesion: 0.10
Nodes (5): correlatedBuild(), Engine, observe(), observeParked(), parkedReadError

### Community 53 - "publish-pr.ts"
Cohesion: 0.17
Nodes (19): harnessEffect, readBackOrThrow(), retryRead(), ensureTrackingIssue(), trackingIssueTitle(), developerPRContent(), Execute, lintPRContent() (+11 more)

### Community 54 - "validate-stage.ts"
Cohesion: 0.16
Nodes (17): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+9 more)

### Community 55 - "engine.ts"
Cohesion: 0.21
Nodes (17): checkMail(), drainMail(), requestMail(), dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), resume() (+9 more)

### Community 56 - "assignment-poll.ts"
Cohesion: 0.16
Nodes (14): noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), pinCourier, ACTIONS, OWNER, wikiSync, due() (+6 more)

### Community 57 - "outbox.ts"
Cohesion: 0.20
Nodes (15): conversationResolved(), projectOutbox(), syncOutbox(), slackRequestSettled(), knowledgeOutbox(), checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup() (+7 more)

### Community 58 - "coordination-tick.ts"
Cohesion: 0.14
Nodes (13): PrerequisitesSchema, BrainFollowup, Result, legacy, reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION (+5 more)

### Community 59 - "saved-prerequisite-handoff.ts"
Cohesion: 0.20
Nodes (18): continuationWorktree(), dependencyVersion(), handoffSavedPrerequisites(), hasSavedPrerequisiteResult(), Ownership, qualified(), readDependencies(), requireSavedPrerequisites() (+10 more)

### Community 60 - "coordination.ts"
Cohesion: 0.18
Nodes (18): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation(), checkpointWindow(), dueAt() (+10 more)

### Community 61 - "run-accounting.ts"
Cohesion: 0.18
Nodes (17): BoundedRead, backfillClaudeCost(), CompletionReader, HELPER_STDOUT_MAX_BYTES, helperAccounting(), claudeAccounting(), COMPLETION_MAX_BYTES, completionAccounting() (+9 more)

### Community 62 - "Button"
Cohesion: 0.19
Nodes (14): FeatureRound, FeatureDelivery(), FeatureDocuments(), views, phases, LinkedFeatures(), draftKey(), readDraft() (+6 more)

### Community 63 - "effects.ts"
Cohesion: 0.22
Nodes (14): activeEffectId(), officeMergeProvenance(), reconcileMergeScannerRetry(), Retry, retryMergeScanner(), retryReadBack(), runIdentity(), savedRetry() (+6 more)

### Community 64 - "jira-time.ts"
Cohesion: 0.21
Nodes (13): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+5 more)

### Community 65 - "WorkTime"
Cohesion: 0.18
Nodes (18): ConfirmedSegment, LiveAnchor, ObservationGap, SnapshotOrdering, TimeLedgerState, WorkTime, Acc, bump() (+10 more)

### Community 66 - "azure.ts"
Cohesion: 0.20
Nodes (14): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+6 more)

### Community 67 - "TeamMessage"
Cohesion: 0.18
Nodes (13): cecChatPrompt(), ctoChatPrompt(), itChatPrompt(), slackVerifyPrompt(), PICKUP_CHAT, canFileGithubIssue(), githubFollowupPrompt(), knowledgeChatPrompt() (+5 more)

### Community 68 - "investigations/ledger.ts"
Cohesion: 0.30
Nodes (12): Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint(), supersedingDelivery(), investigationCandidates(), investigationId(), investigationFollowUps() (+4 more)

### Community 69 - "admit-improvement.ts"
Cohesion: 0.26
Nodes (14): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+6 more)

### Community 70 - "retrospective-subject.ts"
Cohesion: 0.19
Nodes (15): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+7 more)

### Community 71 - "lesson-selection.ts"
Cohesion: 0.19
Nodes (16): knowledgeContext(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), LessonSelection, MAINTENANCE (+8 more)

### Community 72 - "codex-rollout.ts"
Cohesion: 0.16
Nodes (15): add(), CodexRequest, CodexRollout, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens() (+7 more)

### Community 73 - "Ticket"
Cohesion: 0.23
Nodes (8): cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), slackSendPrompt(), Agents, SlackDelivery, Ticket

### Community 74 - "contract.ts"
Cohesion: 0.22
Nodes (11): At, Errno, GroupInventory, GroupProbe, LifecycleDiagnostic, Phase, Pid, groupInventory() (+3 more)

### Community 75 - "checkpoint-completion.ts"
Cohesion: 0.20
Nodes (10): BrainStatusSchema, identity, parseBrainStatus(), brainCheckpointCompletion(), coverageSchema, followupSchema, verified, reconcileCompletedCheckpoints() (+2 more)

### Community 76 - "preferences-store.ts"
Cohesion: 0.21
Nodes (9): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS (+1 more)

### Community 77 - "cec/workflow.ts"
Cohesion: 0.26
Nodes (11): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), nextStage(), publicationEvidenceGap(), qaEvidenceGap(), resultGate(), stageResultGap() (+3 more)

### Community 78 - "blocker-followups.ts"
Cohesion: 0.34
Nodes (9): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), readBackConversations(), handoff(), reconcileBlockerFollowups(), queueImprovements(), startServiceTicks() (+1 more)

### Community 79 - "closeout.ts"
Cohesion: 0.38
Nodes (9): harnessCloseout(), PASSING, verifyMergeActions(), runHarnessStage(), harnessStageResult(), receipt(), harnessDraft(), harnessPrepare() (+1 more)

### Community 80 - "workKey"
Cohesion: 0.30
Nodes (9): completedPRReviews(), eligible(), mergedByOwner(), ownerSettles(), retireExternalDeliveries(), settledExternalRepair(), nativeDeliveryReadbackCandidate(), reconcileNativeDelivery() (+1 more)

### Community 81 - "evidence.ts"
Cohesion: 0.30
Nodes (10): investigationEvidence(), OFFICE_SOURCE_PATHS, officeSource(), ROOT, done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact() (+2 more)

### Community 82 - "weekly-research.ts"
Cohesion: 0.32
Nodes (9): publicTopicSafe(), researchTopics(), TEMPLATES, retryDelay(), mirror(), ResearchResult, runWeeklyResearch(), scheduledResearch() (+1 more)

### Community 83 - "cost-totals.ts"
Cohesion: 0.29
Nodes (10): isModelWork(), isTicketModelWork(), ScopePolicy, awaitingEvidence(), boardUsd(), CaptureContext, inCostWindow(), TicketCost (+2 more)

### Community 84 - "work.ts"
Cohesion: 0.17
Nodes (11): AssignmentResult, CompletionCondition, Continuation, DependencyObservation, EligibilityState, FailureCategory, ReconciliationAction, WorkAssignment (+3 more)

### Community 85 - "DailyCTO.tsx"
Cohesion: 0.26
Nodes (8): CTOReview(), goalState, DailyCTO(), GoalHistory(), reportDate(), reviewStatus, reviewExcerpt(), ReviewText()

### Community 86 - ".value"
Cohesion: 0.27
Nodes (6): file, folder, logs, root, xml(), ProjectProgress

### Community 87 - "recovery-ledger.ts"
Cohesion: 0.38
Nodes (7): savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), diagnosticSnapshot(), nativeDeliveryResolved(), reconcileRecoveryLedger()

### Community 88 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 89 - "diagnostic-context.ts"
Cohesion: 0.42
Nodes (5): diagnosticContext(), itAgent(), itDiagnostics(), currentServices(), ServiceHealthPanel()

### Community 90 - "codex-rollout-file.ts"
Cohesion: 0.31
Nodes (8): codexHome(), createdAt(), dayDirs(), header(), readCodexRollout(), ROLLOUT_MAX_BYTES, RolloutScan, scanCodexRollouts()

### Community 91 - "model-routes.ts"
Cohesion: 0.28
Nodes (8): CODEX_DEFAULT_EFFORT, CODEX_DEFAULT_MODEL, CODEX_EFFORTS, CODEX_ROLES, ModelRoute, qaPolicyRoute(), resolveModelRoute(), validModelSetting()

### Community 92 - "OfficeConfigView.tsx"
Cohesion: 0.48
Nodes (5): loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView(), OfficeConfigSummary

### Community 93 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

## Knowledge Gaps
- **353 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+348 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `github-delivery.ts`, `artifact`, `.transaction`, `source-amendment.ts`, `shared.ts`, `GitHubDelivery`, `activation-recovery.ts`, `daily-cto.ts`, `schedule.ts`, `index.ts`, `store.ts`, `record-trigger.ts`, `maintenance.ts`, `requests.ts`, `conversations/conversations.ts`, `run-retrospective.ts`, `cost-ledger.ts`, `session-bridge.ts`, `it-specialist.ts`, `digest`, `github/issue-publication.ts`, `worker-runtime.ts`, `notifications.ts`, `offices.ts`, `tracking-issue.ts`, `weekly-rollup.ts`, `dependency-bots/adopt.ts`, `http/commands.ts`, `.getEffect`, `cec/issue-publication.ts`, `.save`, `ticket-stage-runner.ts`, `scheduler.ts`, `agents.ts`, `.emit`, `investigations/run.ts`, `remove-candidate.ts`, `dependencies.ts`, `goal-evidence.ts`, `scheduled-work.ts`, `time-scope.ts`, `publish-pr.ts`, `validate-stage.ts`, `engine.ts`, `coordination-tick.ts`, `saved-prerequisite-handoff.ts`, `coordination.ts`, `run-accounting.ts`, `effects.ts`, `jira-time.ts`, `azure.ts`, `TeamMessage`, `investigations/ledger.ts`, `admit-improvement.ts`, `retrospective-subject.ts`, `lesson-selection.ts`, `Ticket`, `checkpoint-completion.ts`, `blocker-followups.ts`, `workKey`, `evidence.ts`, `weekly-research.ts`, `recovery-ledger.ts`, `diagnostic-context.ts`?**
  _High betweenness centrality (0.124) - this node is a cross-community bridge._
- **Why does `Role` connect `shared.ts` to `github-delivery.ts`, `GitHubDelivery`, `index.tsx`, `Inspector.tsx`, `OfficeScene.tsx`, `store.ts`, `maintenance.ts`, `conversations/conversations.ts`, `worker-runtime.ts`, `offices.ts`, `http/commands.ts`, `scheduler.ts`, `agents.ts`, `.emit`, `validate-stage.ts`, `outbox.ts`, `run-accounting.ts`, `TeamMessage`, `retrospective-subject.ts`, `Ticket`, `work.ts`, `model-routes.ts`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `command()` connect `Store` to `github-delivery.ts`, `.transaction`, `GitHubDelivery`, `schedule.ts`, `maintenance.ts`, `requests.ts`, `executeRequest`, `cost-ledger.ts`, `session-bridge.ts`, `it-specialist.ts`, `github/issue-publication.ts`, `worker-runtime.ts`, `notifications.ts`, `tracking-issue.ts`, `cec/issue-publication.ts`, `.save`, `ticket-stage-runner.ts`, `agents.ts`, `remove-candidate.ts`, `dependencies.ts`, `goal-evidence.ts`, `scheduled-work.ts`, `Engine`, `publish-pr.ts`, `validate-stage.ts`, `engine.ts`, `coordination-tick.ts`, `coordination.ts`, `effects.ts`, `jira-time.ts`, `azure.ts`, `admit-improvement.ts`, `contract.ts`, `command-registry.ts`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `command()` (e.g. with `.constructor()` and `executeRequest()`) actually correct?**
  _`command()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _353 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `github-delivery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06491754122938531 - nodes in this community are weakly interconnected._
- **Should `artifact` be split into smaller, more focused modules?**
  _Cohesion score 0.07043959847698165 - nodes in this community are weakly interconnected._