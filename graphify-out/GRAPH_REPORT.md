# Graph Report - the-office  (2026-11-08)

## Corpus Check
- 460 files · ~221,597 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2689 nodes · 11298 edges · 99 communities (95 shown, 4 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 64 edges (avg confidence: 0.74)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `daffe4fa`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- remove-candidate.ts
- github-check-selection.ts
- Engine
- useOfficePreferences.ts
- source-amendment.ts
- artifact
- PeoplePanel.tsx
- Inspector.tsx
- cost-ledger.ts
- index.tsx
- github-delivery.ts
- OfficeScene.tsx
- run-ci-repair.ts
- continuation-evidence.ts
- maintenance.ts
- telemetry.ts
- time-readback.ts
- index.ts
- report.ts
- LessonsPanel.tsx
- conversations/conversations.ts
- github-publication.ts
- azure.ts
- scope-repair-resume.ts
- features/workflow.ts
- work-summary.ts
- accept-stage-result.ts
- TimeBook.tsx
- requests.ts
- retrospective-subject.ts
- knowledge.ts
- .save
- workKey
- agents.ts
- goal-reporting.ts
- Coordinator
- daily-cto.ts
- OfficeSnapshot
- engine.ts
- time-scope.ts
- assignment-poll.ts
- retrospective-triggers.ts
- run-accounting.ts
- command
- goal-reviews.ts
- saved-prerequisite-handoff.ts
- coordination.ts
- supersedingDelivery
- ledger.ts
- outbox.ts
- fact-bounds.ts
- publish-pr.ts
- dependencies.ts
- dependency-bots/adopt.ts
- it-specialist.ts
- Store
- coordination-tick.ts
- scheduled-work.ts
- store.ts
- discovery-recovery.ts
- Offices
- jira-time.ts
- run-retrospective.ts
- .emit
- owned-artifact.ts
- codex-rollout.ts
- knowledge-context.ts
- command-registry.ts
- session-bridge.ts
- helper-usage.ts
- office-lessons.ts
- activation-recovery.ts
- validate-stage.ts
- helper-evidence.py
- worker-runtime.ts
- JiraFeaturePublisher
- http/commands.ts
- checkpoint-completion.ts
- codex-rollout-file.ts
- .getEffect
- install-service.mjs
- review-run.ts
- record-trigger.ts
- time-classification.ts
- .value
- preparation-readback.ts
- features.ts
- shared.ts
- TicketJob
- github-context.ts
- run-usage.ts
- retrospective-facts.ts
- DailyCTO.tsx
- delivery-task.ts
- slack-supersession.ts
- maintenance-triggers.ts
- saved-candidate-admission.ts
- provider-observation.ts

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

## Communities (99 total, 4 thin omitted)

### Community 0 - "remove-candidate.ts"
Cohesion: 0.22
Nodes (14): interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval, Execute (+6 more)

### Community 1 - "github-check-selection.ts"
Cohesion: 0.18
Nodes (22): checksFailed(), checksPassed(), checksPending(), CurrentChecksWait, currentMergeChecks(), pass(), pending(), requireThat() (+14 more)

### Community 2 - "Engine"
Cohesion: 0.09
Nodes (3): channelNoticeAuthorized(), MergeNotifications, Engine

### Community 3 - "useOfficePreferences.ts"
Cohesion: 0.23
Nodes (11): acceptPreferences(), PreferenceCandidate, strip(), UNKNOWN_PREFERENCES, OfficePreferencesController, PreferenceFeedback, PreferenceField, requestPreferences() (+3 more)

### Community 4 - "source-amendment.ts"
Cohesion: 0.07
Nodes (68): adoptCandidate(), reported, Scope, approvedText(), assert(), AMENDMENT_REVIEW_PROOF, amendmentInstruction(), amendmentIssueSha256() (+60 more)

### Community 5 - "artifact"
Cohesion: 0.15
Nodes (41): verifiedCloseoutCleanupRequest(), advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat(), assertPostConflictFiles(), assertPostConflictOwnership() (+33 more)

### Community 6 - "PeoplePanel.tsx"
Cohesion: 0.10
Nodes (39): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+31 more)

### Community 7 - "Inspector.tsx"
Cohesion: 0.05
Nodes (55): SendMessage, blank(), goalInput, Goals(), CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants (+47 more)

### Community 8 - "cost-ledger.ts"
Cohesion: 0.14
Nodes (27): EffectUncertainError, captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId() (+19 more)

### Community 9 - "index.tsx"
Cohesion: 0.09
Nodes (50): Conversation(), Outbox(), recommendedReply(), slackMessageStatus(), SlackDeliveryCard(), ServiceHealthPanel(), labels, ServiceHealthRow() (+42 more)

### Community 10 - "github-delivery.ts"
Cohesion: 0.10
Nodes (41): findingsBlock(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery(), BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE (+33 more)

### Community 11 - "OfficeScene.tsx"
Cohesion: 0.06
Nodes (58): itAgent(), itDiagnostics(), displayAgentTask(), withoutElapsed(), LiveAgentTask(), Props, RunningTask(), text() (+50 more)

### Community 12 - "run-ci-repair.ts"
Cohesion: 0.31
Nodes (11): ciCheckout(), verifyCIHooks(), CIFailure, guardCIRepair(), prepareCIMetadataRepair(), publishCIRepair(), rewordCommits(), CIPlanSchema (+3 more)

### Community 13 - "continuation-evidence.ts"
Cohesion: 0.11
Nodes (46): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+38 more)

### Community 14 - "maintenance.ts"
Cohesion: 0.09
Nodes (28): ApproachSchema, GITHUB_ISSUE_SKILL, maintenancePolicies(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice() (+20 more)

### Community 15 - "telemetry.ts"
Cohesion: 0.11
Nodes (23): CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL, Rates (+15 more)

### Community 16 - "time-readback.ts"
Cohesion: 0.29
Nodes (7): timeLedger(), TimeLedger, dueReadback(), Readback, READBACK_INTERVAL_MS, readBackTime(), SETTLE_MS

### Community 17 - "index.ts"
Cohesion: 0.05
Nodes (53): args, [cmd,...rawArgs], commands, key, projectIndex, AUTO_ADOPT_BOTS, close(), config (+45 more)

### Community 18 - "report.ts"
Cohesion: 0.33
Nodes (11): Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked(), row() (+3 more)

### Community 19 - "LessonsPanel.tsx"
Cohesion: 0.13
Nodes (29): LessonsPanel(), when(), SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), loadOfficeConfig(), OfficeConfigSection() (+21 more)

### Community 20 - "conversations/conversations.ts"
Cohesion: 0.08
Nodes (32): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, ReplySchema, pumpCTO(), queueCTOHandoff(), saveGoals() (+24 more)

### Community 21 - "github-publication.ts"
Cohesion: 0.15
Nodes (16): Assign, Board, Content, GitHubFeaturePublisher, number(), same(), Content, jiraText() (+8 more)

### Community 22 - "azure.ts"
Cohesion: 0.19
Nodes (15): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+7 more)

### Community 23 - "scope-repair-resume.ts"
Cohesion: 0.16
Nodes (29): containedFile(), Assessment, outsideScanSources(), Ownership, reconcileScopeRepairReadback(), requireThat(), scopeRepairReadbackCandidate(), scopeRepairRequestResolved() (+21 more)

### Community 24 - "features/workflow.ts"
Cohesion: 0.21
Nodes (16): discoveryPrompt(), planPrompt(), DiscoverySchema, identity, manifestFromPlan(), ManifestSchema, PlanSchema, text (+8 more)

### Community 25 - "work-summary.ts"
Cohesion: 0.15
Nodes (26): TicketDetail(), envelopeCard, deliveryRepairProjection(), DependencyNotice(), InboxQueue(), ACTIVE, maintenanceUpdate(), PMQueueItem (+18 more)

### Community 26 - "accept-stage-result.ts"
Cohesion: 0.32
Nodes (13): acceptStageResult(), mergeAuthorized(), continuationReviewArtifacts(), reconcileContinuationReview(), savedNegativeContinuationReview(), discoveryReviewSatisfied(), implementationContinuationDecision(), negativeTechnicalReview() (+5 more)

### Community 27 - "TimeBook.tsx"
Cohesion: 0.10
Nodes (35): TelemetryReport, AzureBuild, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens(), usd() (+27 more)

### Community 28 - "requests.ts"
Cohesion: 0.16
Nodes (23): CloseoutSupervisionProofRef, Envelope, hash, head, identity, instant(), known, pid (+15 more)

### Community 29 - "retrospective-subject.ts"
Cohesion: 0.18
Nodes (16): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+8 more)

### Community 30 - "knowledge.ts"
Cohesion: 0.13
Nodes (21): Accepted, RETROSPECTIVE_HISTORY, Kind, RetrospectiveResult, Stage, KnowledgeRetry, Lesson, LESSON_KINDS (+13 more)

### Community 31 - ".save"
Cohesion: 0.24
Nodes (22): unpack(), BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue(), readIssues() (+14 more)

### Community 32 - "workKey"
Cohesion: 0.13
Nodes (33): continuationScope(), continuationGuard(), brainImplementationCandidate(), BrainReadback, digest(), implementationRecoveryCandidate(), Ownership, Readback (+25 more)

### Community 33 - "agents.ts"
Cohesion: 0.08
Nodes (32): cecPrompt(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), resolvedDecisionNote(), stageInstructions, slackSendPrompt() (+24 more)

### Community 34 - "goal-reporting.ts"
Cohesion: 0.16
Nodes (15): GitHubMonitor, githubPRDescription(), azureGoalFacts(), azurePRDescription(), boundedEvidence(), EvidenceStore, GOAL_EVIDENCE_LIMITS, GOAL_REPORT_GUIDANCE (+7 more)

### Community 36 - "daily-cto.ts"
Cohesion: 0.13
Nodes (13): DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), queueGoalEvidenceRequest(), DailyResultSchema, FreshDailyResultSchema, GoalEvidenceRequestSchema (+5 more)

### Community 37 - "OfficeSnapshot"
Cohesion: 0.11
Nodes (23): FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures(), draftKey(), readDraft() (+15 more)

### Community 38 - "engine.ts"
Cohesion: 0.08
Nodes (61): checkMail(), drainMail(), requestMail(), parksInJira(), dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery() (+53 more)

### Community 39 - "time-scope.ts"
Cohesion: 0.13
Nodes (29): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence(), CaptureContext (+21 more)

### Community 40 - "assignment-poll.ts"
Cohesion: 0.16
Nodes (19): clamp(), LIMITS, MergedPR, plainSlackText(), section(), shippedSummary(), configureNotices(), Identity (+11 more)

### Community 41 - "retrospective-triggers.ts"
Cohesion: 0.19
Nodes (17): ciBudgetId(), completedId(), JobRef, parkedId(), repairBudgetId(), retiredId(), terminalCandidates(), ticketCompletedId() (+9 more)

### Community 42 - "run-accounting.ts"
Cohesion: 0.24
Nodes (12): readCodexRollout(), codexAccounting(), COMPLETION_MAX_BYTES, merge(), readCompletion(), reconcileUncapturedRuns(), reconciling, recordTerminalAccounting() (+4 more)

### Community 43 - "command"
Cohesion: 0.18
Nodes (10): Result, providers, summary, GIT_NETWORK, LIVE_PROVIDERS, liveReach(), networkUrl(), remoteUrls() (+2 more)

### Community 44 - "goal-reviews.ts"
Cohesion: 0.16
Nodes (14): applyGoalReview(), EvidenceRefSchema, statusAllowed(), workEvidence(), GoalInput, queueGoalNotice(), DailyCTOBriefing, DailyCTOResult (+6 more)

### Community 45 - "saved-prerequisite-handoff.ts"
Cohesion: 0.39
Nodes (11): PrerequisitesSchema, continuationWorktree(), dependencyVersion(), handoffSavedPrerequisites(), Ownership, qualified(), readDependencies(), requireSavedPrerequisites() (+3 more)

### Community 46 - "coordination.ts"
Cohesion: 0.18
Nodes (18): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation(), checkpointWindow(), dueAt() (+10 more)

### Community 47 - "supersedingDelivery"
Cohesion: 0.23
Nodes (11): MessageInput, syncOutbox(), projectSlackDeliveries(), settleRequestedSlackReplacement(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint() (+3 more)

### Community 48 - "ledger.ts"
Cohesion: 0.20
Nodes (16): investigationCandidates(), investigationId(), investigationEvidence(), investigationFollowUps(), investigationResolution(), syncInvestigations(), investigationReady(), INVESTIGATION_ATTEMPTS (+8 more)

### Community 49 - "outbox.ts"
Cohesion: 0.19
Nodes (16): conversationResolved(), projectOutbox(), knowledgeOutbox(), checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), repeatedVendorReviewBlock(), stoppedInVendorReview() (+8 more)

### Community 50 - "fact-bounds.ts"
Cohesion: 0.30
Nodes (13): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+5 more)

### Community 51 - "publish-pr.ts"
Cohesion: 0.13
Nodes (29): recordCandidateCleanup(), retryCandidateCleanup(), harnessCloseout(), PASSING, verifyMergeActions(), activeEffectId(), harnessEffect, assertMayMutate() (+21 more)

### Community 52 - "dependencies.ts"
Cohesion: 0.20
Nodes (15): Admission, admit(), IntakeContext, compatible(), dependencyCompletionKey(), dependencyEligibility(), DependencyStores, issueKey() (+7 more)

### Community 53 - "dependency-bots/adopt.ts"
Cohesion: 0.08
Nodes (56): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard, projectCards() (+48 more)

### Community 54 - "it-specialist.ts"
Cohesion: 0.14
Nodes (15): ITContext, publishITReport(), delays, recoverAttempt(), listenerHealth(), ProviderStatusChecks, Probe, probes (+7 more)

### Community 55 - "Store"
Cohesion: 0.08
Nodes (30): DeliverySlot, officeCapacity, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch() (+22 more)

### Community 56 - "coordination-tick.ts"
Cohesion: 0.22
Nodes (12): reconcileNoticeConfirmations(), legacy, reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION, tick(), incompleteReadOutput() (+4 more)

### Community 57 - "scheduled-work.ts"
Cohesion: 0.13
Nodes (31): deliverySlot(), closeoutRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), RollupResult, RollupResultSchema, retryDelay(), ineffectiveLessons() (+23 more)

### Community 58 - "store.ts"
Cohesion: 0.07
Nodes (29): JiraOperations, plain(), Clock, systemClock, CEC, DATA, DELIVERY_CONCURRENCY, LOCAL_BINDINGS (+21 more)

### Community 59 - "discovery-recovery.ts"
Cohesion: 0.29
Nodes (10): Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership, rawHash() (+2 more)

### Community 61 - "jira-time.ts"
Cohesion: 0.21
Nodes (13): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+5 more)

### Community 62 - "run-retrospective.ts"
Cohesion: 0.21
Nodes (14): busyMaintenanceIds(), retrospectivePrompt(), SUBJECT, RetrospectiveResultSchema, triggerJobId(), KnowledgeRunner, KnowledgeRunOptions, RETROSPECTIVE_TIMEOUT (+6 more)

### Community 63 - ".emit"
Cohesion: 0.16
Nodes (24): approveFeature(), assertRetainedItems(), commandFeature(), createFeature(), featureById(), mutation(), reviewQuestions(), artifactPath() (+16 more)

### Community 64 - "owned-artifact.ts"
Cohesion: 0.42
Nodes (7): BoundedRead, done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf(), CompletionReader

### Community 65 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 66 - "knowledge-context.ts"
Cohesion: 0.24
Nodes (10): Bucket, knowledgeContext(), LESSON_LIMIT, lessonPurpose(), MAINTENANCE, MAX_LESSONS, PURPOSES, render() (+2 more)

### Community 67 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 68 - "session-bridge.ts"
Cohesion: 0.21
Nodes (9): claudeSessions(), codexSessions(), desktopSessions(), guardianReview(), LiveSession, loadedCodexSession(), openRollouts(), SessionBridge (+1 more)

### Community 69 - "helper-usage.ts"
Cohesion: 0.21
Nodes (9): EvidenceOutcome, backfillClaudeCost(), HELPER_STDOUT_MAX_BYTES, helperAccounting(), claudeAccounting(), completionAccounting(), markCaptureStart(), withReason() (+1 more)

### Community 70 - "office-lessons.ts"
Cohesion: 0.32
Nodes (7): normalizeStatement(), decideOfficeProposal(), now(), OfficeKnowledgeStore, proposeOfficeLessons(), retireOfficeLesson(), OfficeKnowledge

### Community 71 - "activation-recovery.ts"
Cohesion: 0.23
Nodes (22): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+14 more)

### Community 72 - "validate-stage.ts"
Cohesion: 0.16
Nodes (17): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+9 more)

### Community 75 - "worker-runtime.ts"
Cohesion: 0.11
Nodes (24): SlackResultSchema, SlackVerificationSchema, contextPacket(), CODEX_DEFAULT_EFFORT, CODEX_DEFAULT_MODEL, CODEX_EFFORTS, CODEX_ROLES, ModelRoute (+16 more)

### Community 76 - "JiraFeaturePublisher"
Cohesion: 0.33
Nodes (4): Assignment, JiraFeaturePublisher, keyOf(), Transition

### Community 77 - "http/commands.ts"
Cohesion: 0.19
Nodes (18): ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), retryRecipientLookup(), configureKnowledge(), declineLessonIssue(), reactivateLesson() (+10 more)

### Community 78 - "checkpoint-completion.ts"
Cohesion: 0.24
Nodes (7): BrainStatusSchema, identity, brainCheckpointCompletion(), coverageSchema, followupSchema, verified, reconcileCompletedCheckpoints()

### Community 79 - "codex-rollout-file.ts"
Cohesion: 0.36
Nodes (7): codexHome(), createdAt(), dayDirs(), header(), ROLLOUT_MAX_BYTES, RolloutScan, scanCodexRollouts()

### Community 80 - ".getEffect"
Cohesion: 0.22
Nodes (8): GitHubOperations, fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), Assessment, closeNativeRefresh(), fingerprint(), EffectIntent

### Community 81 - "install-service.mjs"
Cohesion: 0.33
Nodes (5): file, folder, logs, root, xml()

### Community 82 - "review-run.ts"
Cohesion: 0.19
Nodes (12): featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), recoverFeatures(), EvidenceSchema, helperInstallation(), readReview(), ReviewEvidence (+4 more)

### Community 83 - "record-trigger.ts"
Cohesion: 0.48
Nodes (6): clip(), JobLike, recordParked(), recordRepairBudget(), recordTrigger(), subjectOf()

### Community 84 - "time-classification.ts"
Cohesion: 0.62
Nodes (6): captureTime(), artifact(), correctRecoveryClassification(), digest(), timeClassificationDigest(), TimeClassificationInput

### Community 86 - "preparation-readback.ts"
Cohesion: 0.10
Nodes (38): continuationNativeReview(), bindPreparationBoardOrigins(), claimSchema, eventSchema, PreparationBoardOrigin, readPreparationBoardOrigins(), timestamp, updateSchema (+30 more)

### Community 87 - "features.ts"
Cohesion: 0.19
Nodes (11): assertFeatureDependencyOrder(), featureDependencyEdges(), key(), FeatureApproval, FeatureAttempt, FeatureBaseline, FeaturePhase, FeaturePublicationItem (+3 more)

### Community 88 - "shared.ts"
Cohesion: 0.09
Nodes (25): DECISION_KINDS, needsDecision(), completedPRReviews(), ContinuationDecision, eligible(), mergedByOwner(), ownerSettles(), retireExternalDeliveries() (+17 more)

### Community 89 - "TicketJob"
Cohesion: 0.08
Nodes (14): dependabotReviewGuidance(), StageContext, GitHubDelivery, stagePrompt(), StagePromptInput, ROLES, stageRole(), implementationContinuationInstruction() (+6 more)

### Community 90 - "github-context.ts"
Cohesion: 0.15
Nodes (16): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), cecChatPrompt(), ctoChatPrompt(), itChatPrompt(), PICKUP_CHAT, PickupSchema (+8 more)

### Community 91 - "run-usage.ts"
Cohesion: 0.38
Nodes (5): CodexRollout, claudeCrashZero(), claudeUsage(), count(), RunUsage

### Community 92 - "retrospective-facts.ts"
Cohesion: 0.23
Nodes (11): ARTIFACT_LIMIT, clip(), LEDGER_STEPS, MAINTENANCE_LIMIT, maintenanceFacts(), MaintenancePacketSection, clip(), PACKET_LIMIT (+3 more)

### Community 93 - "DailyCTO.tsx"
Cohesion: 0.20
Nodes (10): CTOReview(), goalState, DailyCTO(), GoalHistory(), reportDate(), reviewStatus, GoalList(), reviewExcerpt() (+2 more)

### Community 94 - "delivery-task.ts"
Cohesion: 0.36
Nodes (6): deliveryTask(), DeliveryTaskInput, DISCOVERY_GUIDANCE, compactSteps(), featureDeliveryContext(), deliveryResearchContext()

### Community 95 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 97 - "maintenance-triggers.ts"
Cohesion: 0.42
Nodes (8): clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates(), maintenanceCompletedId(), maintenanceKey(), visibleMaintenanceTriggerIds(), RetrospectiveTrigger

### Community 99 - "saved-candidate-admission.ts"
Cohesion: 0.27
Nodes (10): candidateInput(), children, oldAdoptionBasis(), savedAdmissionUnresolved(), savedCandidateAdmission, completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved() (+2 more)

### Community 103 - "provider-observation.ts"
Cohesion: 0.33
Nodes (7): correlatedBuild(), followResume(), note(), reconcileAndResumeParked(), observe(), observeParked(), parkedReadError

## Knowledge Gaps
- **337 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+332 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `remove-candidate.ts`, `Engine`, `source-amendment.ts`, `artifact`, `cost-ledger.ts`, `github-delivery.ts`, `continuation-evidence.ts`, `maintenance.ts`, `time-readback.ts`, `index.ts`, `conversations/conversations.ts`, `github-publication.ts`, `azure.ts`, `scope-repair-resume.ts`, `features/workflow.ts`, `accept-stage-result.ts`, `requests.ts`, `retrospective-subject.ts`, `knowledge.ts`, `.save`, `workKey`, `agents.ts`, `goal-reporting.ts`, `Coordinator`, `daily-cto.ts`, `OfficeSnapshot`, `engine.ts`, `time-scope.ts`, `assignment-poll.ts`, `retrospective-triggers.ts`, `run-accounting.ts`, `command`, `goal-reviews.ts`, `saved-prerequisite-handoff.ts`, `coordination.ts`, `supersedingDelivery`, `ledger.ts`, `publish-pr.ts`, `dependencies.ts`, `dependency-bots/adopt.ts`, `it-specialist.ts`, `coordination-tick.ts`, `scheduled-work.ts`, `store.ts`, `discovery-recovery.ts`, `jira-time.ts`, `run-retrospective.ts`, `.emit`, `owned-artifact.ts`, `knowledge-context.ts`, `session-bridge.ts`, `helper-usage.ts`, `office-lessons.ts`, `activation-recovery.ts`, `validate-stage.ts`, `worker-runtime.ts`, `http/commands.ts`, `checkpoint-completion.ts`, `.getEffect`, `review-run.ts`, `record-trigger.ts`, `time-classification.ts`, `.value`, `preparation-readback.ts`, `features.ts`, `shared.ts`, `TicketJob`, `github-context.ts`, `retrospective-facts.ts`, `delivery-task.ts`, `saved-candidate-admission.ts`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **Why does `TicketJob` connect `TicketJob` to `remove-candidate.ts`, `github-check-selection.ts`, `source-amendment.ts`, `artifact`, `index.tsx`, `github-delivery.ts`, `run-ci-repair.ts`, `continuation-evidence.ts`, `scope-repair-resume.ts`, `work-summary.ts`, `accept-stage-result.ts`, `requests.ts`, `retrospective-subject.ts`, `workKey`, `engine.ts`, `retrospective-triggers.ts`, `saved-prerequisite-handoff.ts`, `outbox.ts`, `fact-bounds.ts`, `publish-pr.ts`, `dependency-bots/adopt.ts`, `it-specialist.ts`, `Store`, `discovery-recovery.ts`, `activation-recovery.ts`, `validate-stage.ts`, `record-trigger.ts`, `.value`, `preparation-readback.ts`, `shared.ts`, `delivery-task.ts`, `saved-candidate-admission.ts`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `command()` connect `command` to `remove-candidate.ts`, `Engine`, `source-amendment.ts`, `cost-ledger.ts`, `github-delivery.ts`, `continuation-evidence.ts`, `maintenance.ts`, `time-readback.ts`, `conversations/conversations.ts`, `github-publication.ts`, `azure.ts`, `features/workflow.ts`, `requests.ts`, `.save`, `workKey`, `agents.ts`, `goal-reporting.ts`, `Coordinator`, `engine.ts`, `assignment-poll.ts`, `coordination.ts`, `publish-pr.ts`, `dependencies.ts`, `dependency-bots/adopt.ts`, `it-specialist.ts`, `Store`, `store.ts`, `jira-time.ts`, `.emit`, `command-registry.ts`, `session-bridge.ts`, `validate-stage.ts`, `worker-runtime.ts`, `.getEffect`, `review-run.ts`, `.value`, `provider-observation.ts`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `command()` (e.g. with `.constructor()` and `executeRequest()`) actually correct?**
  _`command()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _337 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Engine` be split into smaller, more focused modules?**
  _Cohesion score 0.08666666666666667 - nodes in this community are weakly interconnected._
- **Should `source-amendment.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06630630630630631 - nodes in this community are weakly interconnected._