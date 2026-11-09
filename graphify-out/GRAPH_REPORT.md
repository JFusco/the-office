# Graph Report - the-office  (2026-11-09)

## Corpus Check
- 527 files · ~249,015 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2972 nodes · 12612 edges · 102 communities (100 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 68 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c745dd8b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- source-amendment.ts
- github-delivery.ts
- artifact
- features/workflow.ts
- index.tsx
- OfficeScene.tsx
- TicketJob
- workKey
- PeoplePanel.tsx
- Inspector.tsx
- maintenance.ts
- requests.ts
- OfficeSnapshot
- digest
- index.ts
- engine.ts
- .run
- .getEffect
- conversations/conversations.ts
- schedule.ts
- work-summary.ts
- agents.ts
- it-specialist.ts
- cec/issue-publication.ts
- SettingsPanel.tsx
- http/commands.ts
- azure.ts
- review-run.ts
- run-retrospective.ts
- knowledge.ts
- run-cost.ts
- session-bridge.ts
- run-accounting.ts
- projects.ts
- cec/workflow.ts
- FeatureWorkspace.tsx
- .save
- source-amendment-scope.ts
- accept-retrospective.ts
- time-scope.ts
- dependency-bots/adopt.ts
- cost-ledger.ts
- remove-candidate.ts
- preferences-store.ts
- .emit
- Store
- daily-cto.ts
- coordination-tick.ts
- Coordinator
- harnessEffect
- brain-maintenance.ts
- .transaction
- tracking-issue.ts
- retrospective-triggers.ts
- notifications.ts
- dependencies.ts
- goal-reporting.ts
- learningDigest
- retrospective-subject.ts
- github/issue-publication.ts
- publish-pr.ts
- investigations/run.ts
- goal-reviews.ts
- weekly-rollup.ts
- outbox.ts
- validate-stage.ts
- service-health.ts
- effects.ts
- contract.ts
- delivery-task.ts
- assignment-poll.ts
- investigations/ledger.ts
- discovery-recovery.ts
- store.ts
- scheduled-work.ts
- TelemetryPanel.tsx
- maintenance-triggers.ts
- coordination.ts
- observations.ts
- github-check-selection.ts
- shared.ts
- Agents
- telemetry.ts
- record-trigger.ts
- offices.ts
- DailyCTO.tsx
- time-readback.ts
- evidence.ts
- fact-bounds.ts
- local-config.ts
- command-registry.ts
- codex-rollout.ts
- cli.ts
- scheduled-retrospectives.ts
- checkpoint-completion.ts
- slack-supersession.ts
- helper-evidence.py
- BrainFollowup
- time-classification.ts
- OfficeConfigView.tsx
- codex-rollout-file.ts

## God Nodes (most connected - your core abstractions)
1. `Store` - 277 edges
2. `TicketJob` - 122 edges
3. `GitHubDelivery` - 118 edges
4. `command()` - 99 edges
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
- 3-file cycle: `server/knowledge/slack-intake/progress.ts -> server/knowledge/slack-intake/read-links.ts -> server/knowledge/slack-intake/seed-status.ts -> server/knowledge/slack-intake/progress.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/stage-reconciliation.ts -> server/delivery/recovery/implementation/continuation-review-readback.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/recovery/retire-external-delivery.ts -> server/delivery/pipeline/github-delivery.ts`
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

## Communities (102 total, 2 thin omitted)

### Community 0 - "source-amendment.ts"
Cohesion: 0.09
Nodes (57): adoptCandidate(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat() (+49 more)

### Community 1 - "github-delivery.ts"
Cohesion: 0.09
Nodes (64): containedFile(), findingsBlock(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery(), discover(), refreshDependencies() (+56 more)

### Community 2 - "artifact"
Cohesion: 0.12
Nodes (49): savedActivationFailure(), allowed, continuationArtifacts(), continuationNativeReview(), continuationReviewArtifacts(), continuationWorkerProof(), continuationWorktree(), negativeWorker() (+41 more)

### Community 3 - "features/workflow.ts"
Cohesion: 0.13
Nodes (35): approveFeature(), assertRetainedItems(), commandFeature(), createFeature(), featureById(), mutation(), reviewQuestions(), discoveryPrompt() (+27 more)

### Community 4 - "index.tsx"
Cohesion: 0.09
Nodes (54): Conversation(), slackMessageStatus(), SlackDeliveryCard(), ServiceHealthPanel(), labels, ServiceHealthRow(), BlockerFollowups(), LessonsPanel() (+46 more)

### Community 5 - "OfficeScene.tsx"
Cohesion: 0.06
Nodes (55): diagnosticContext(), itAgent(), itDiagnostics(), currentServices(), Avatar(), AzureWall(), Chair(), Coworker() (+47 more)

### Community 6 - "TicketJob"
Cohesion: 0.07
Nodes (24): BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction(), dependabotReviewGuidance(), StageContext, GitHubDelivery, stagePrompt() (+16 more)

### Community 7 - "workKey"
Cohesion: 0.08
Nodes (62): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+54 more)

### Community 8 - "PeoplePanel.tsx"
Cohesion: 0.11
Nodes (37): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+29 more)

### Community 9 - "Inspector.tsx"
Cohesion: 0.05
Nodes (54): SendMessage, blank(), goalInput, Goals(), CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants (+46 more)

### Community 10 - "maintenance.ts"
Cohesion: 0.14
Nodes (18): captureMaintenanceStep(), candidateOwner(), SETTLED, skipOwnedCandidate(), Skipped, skippedCandidateLedger(), CmsFollowUpContext, cmsFollowUpInstructions() (+10 more)

### Community 11 - "requests.ts"
Cohesion: 0.10
Nodes (47): assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), reconcileCompletedConflictDraft(), routeReadyPostConflictPublication(), verifyInitialDraftConflictPreparation() (+39 more)

### Community 12 - "OfficeSnapshot"
Cohesion: 0.10
Nodes (30): SnapshotAcceptance, demoSnapshot(), tourStages, useOffice(), displayAgentTask(), withoutElapsed(), LiveAgentTask(), Props (+22 more)

### Community 13 - "digest"
Cohesion: 0.10
Nodes (52): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+44 more)

### Community 14 - "index.ts"
Cohesion: 0.09
Nodes (38): pumpKnowledge(), queuedKnowledgeMessage(), close(), config, itSpecialist, loadedRevision, offices, releaseLock (+30 more)

### Community 15 - "engine.ts"
Cohesion: 0.08
Nodes (21): correlatedBuild(), checkMail(), drainMail(), requestMail(), dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery() (+13 more)

### Community 16 - ".run"
Cohesion: 0.11
Nodes (23): assignmentSubject(), CODEX_DEFAULT_EFFORT, CODEX_DEFAULT_MODEL, CODEX_EFFORTS, CODEX_ROLES, ModelRoute, qaPolicyRoute(), resolveModelRoute() (+15 more)

### Community 17 - ".getEffect"
Cohesion: 0.22
Nodes (8): GitHubOperations, fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), Assessment, closeNativeRefresh(), fingerprint(), EffectIntent

### Community 18 - "conversations/conversations.ts"
Cohesion: 0.11
Nodes (21): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+13 more)

### Community 19 - "schedule.ts"
Cohesion: 0.12
Nodes (50): captureProposal(), effectId(), newTask(), recordObservation(), settlePage(), Config, configDigest(), IntakeConfig (+42 more)

### Community 20 - "work-summary.ts"
Cohesion: 0.13
Nodes (27): Outbox(), themeColor, App(), usePanelFocus(), TicketDetail(), deliveryRepairProjection(), card, InboxQueue() (+19 more)

### Community 21 - "agents.ts"
Cohesion: 0.10
Nodes (37): cecChatPrompt(), ctoChatPrompt(), itChatPrompt(), HANDS_OFF_RESOLUTION_GUIDANCE, RESOLUTION_GUIDANCE, PICKUP_CHAT, canFileGithubIssue(), githubFollowupPrompt() (+29 more)

### Community 22 - "it-specialist.ts"
Cohesion: 0.23
Nodes (13): partialLocalCleanupKey(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), ITContext, publishITReport(), delays (+5 more)

### Community 23 - "cec/issue-publication.ts"
Cohesion: 0.22
Nodes (8): Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), plainDescription(), Transition, JiraFeaturePublisher

### Community 24 - "SettingsPanel.tsx"
Cohesion: 0.13
Nodes (31): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS, PickupForm(), acceptPreferences() (+23 more)

### Community 25 - "http/commands.ts"
Cohesion: 0.22
Nodes (16): configureNotices(), NoticeSettings, retryRecipientLookup(), configureKnowledge(), declineLessonIssue(), demoteLesson(), reactivateLesson(), retireLesson() (+8 more)

### Community 26 - "azure.ts"
Cohesion: 0.20
Nodes (14): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+6 more)

### Community 27 - "review-run.ts"
Cohesion: 0.16
Nodes (17): featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), recoverFeatures(), EvidenceSchema, helperInstallation(), readReview(), ReviewEvidence (+9 more)

### Community 28 - "run-retrospective.ts"
Cohesion: 0.10
Nodes (30): appendLearningFacts(), freezeLearningPacket(), ARTIFACT_LIMIT, clip(), LEDGER_STEPS, MAINTENANCE_LIMIT, maintenanceFacts(), MaintenancePacketSection (+22 more)

### Community 29 - "knowledge.ts"
Cohesion: 0.08
Nodes (28): SEEDS, Completion, BlockerFollowup, ImprovementGrant, KnowledgeRetry, KnowledgeState, LearningMetrics, LearningOpportunity (+20 more)

### Community 30 - "run-cost.ts"
Cohesion: 0.14
Nodes (17): CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL, Rates (+9 more)

### Community 31 - "session-bridge.ts"
Cohesion: 0.13
Nodes (23): claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexSessionContext(), readRollout, claudeSessions(), codexSessions() (+15 more)

### Community 32 - "run-accounting.ts"
Cohesion: 0.12
Nodes (24): BoundedRead, EvidenceOutcome, backfillClaudeCost(), CompletionReader, readCodexRollout(), HELPER_STDOUT_MAX_BYTES, helperAccounting(), claudeAccounting() (+16 more)

### Community 33 - "projects.ts"
Cohesion: 0.07
Nodes (36): ROLES, knowledgeContext(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), LessonSelection (+28 more)

### Community 34 - "cec/workflow.ts"
Cohesion: 0.12
Nodes (37): parksInJira(), MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), run(), advance(), nextStage(), publicationEvidenceGap() (+29 more)

### Community 35 - "FeatureWorkspace.tsx"
Cohesion: 0.18
Nodes (15): FeatureRound, FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures(), draftKey() (+7 more)

### Community 36 - ".save"
Cohesion: 0.14
Nodes (30): file, folder, logs, root, xml(), unpack(), BLOCKED, Execute (+22 more)

### Community 37 - "source-amendment-scope.ts"
Cohesion: 0.08
Nodes (39): approvedText(), assert(), assert(), normalize(), officialUrls, ReleaseCapture, verifyReleaseCaptures(), amendmentCaptureObservation() (+31 more)

### Community 38 - "accept-retrospective.ts"
Cohesion: 0.16
Nodes (17): Accepted, acceptRetrospective(), normalizeStatement(), RETROSPECTIVE_HISTORY, decideOfficeProposal(), now(), OfficeKnowledgeStore, proposeOfficeLessons() (+9 more)

### Community 39 - "time-scope.ts"
Cohesion: 0.18
Nodes (21): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence(), CaptureContext (+13 more)

### Community 40 - "dependency-bots/adopt.ts"
Cohesion: 0.14
Nodes (26): readBackOrThrow(), adoptDependabot(), closesIssue(), linkedBody(), linkPR(), dependabotPR, openDependabotPulls(), readRepo() (+18 more)

### Community 41 - "cost-ledger.ts"
Cohesion: 0.20
Nodes (21): costLedger(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId(), OutsideEdit, publishCost(), publishing (+13 more)

### Community 42 - "remove-candidate.ts"
Cohesion: 0.19
Nodes (17): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), removeAdoptedClone() (+9 more)

### Community 43 - "preferences-store.ts"
Cohesion: 0.19
Nodes (10): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS (+2 more)

### Community 44 - ".emit"
Cohesion: 0.13
Nodes (21): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+13 more)

### Community 45 - "Store"
Cohesion: 0.08
Nodes (15): JiraOperations, plain(), GitHubFeaturePublisher, Result, Store, probeProcessGroup(), GIT_NETWORK, LIVE_PROVIDERS (+7 more)

### Community 46 - "daily-cto.ts"
Cohesion: 0.12
Nodes (12): DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), reviewWeekday(), DailyResultSchema, FreshDailyResultSchema, Briefing (+4 more)

### Community 47 - "coordination-tick.ts"
Cohesion: 0.21
Nodes (12): PrerequisitesSchema, legacy, reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION, tick(), incompleteReadOutput() (+4 more)

### Community 48 - "Coordinator"
Cohesion: 0.08
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 49 - "harnessEffect"
Cohesion: 0.21
Nodes (17): harnessCloseout(), PASSING, verifyMergeActions(), activeEffectId(), harnessEffect, assertMayMutate(), runHarnessStage(), harnessStageResult() (+9 more)

### Community 50 - "brain-maintenance.ts"
Cohesion: 0.20
Nodes (11): maintenancePolicies(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice(), easternDate(), weeklyDue() (+3 more)

### Community 51 - ".transaction"
Cohesion: 0.13
Nodes (19): approvedDelivery(), bindDelivery(), featureEffectGate(), bindFeature(), currentApproval(), enrolled(), featureGate(), predecessorComplete() (+11 more)

### Community 52 - "tracking-issue.ts"
Cohesion: 0.20
Nodes (24): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard, projectCards() (+16 more)

### Community 53 - "retrospective-triggers.ts"
Cohesion: 0.21
Nodes (17): baselineLearning(), LEARNING_BASELINES, maintainLearning(), completedId(), JobRef, repairBudgetId(), retiredId(), TerminalCandidate (+9 more)

### Community 54 - "notifications.ts"
Cohesion: 0.10
Nodes (26): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR (+18 more)

### Community 55 - "dependencies.ts"
Cohesion: 0.18
Nodes (20): Admission, admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, compatible(), dependencyCompletionKey(), dependencyEligibility() (+12 more)

### Community 56 - "goal-reporting.ts"
Cohesion: 0.16
Nodes (17): GitHubMonitor, githubPRDescription(), azureGoalFacts(), azurePRDescription(), boundedEvidence(), collectAzureGoalDocuments(), EvidenceStore, GOAL_REPORT_GUIDANCE (+9 more)

### Community 57 - "learningDigest"
Cohesion: 0.18
Nodes (17): distinct(), identity(), improvementIncident(), improvementIncidentKey(), learningDigest(), expireLearningPackets(), packetReferences(), IMPROVEMENT_POLICY (+9 more)

### Community 58 - "retrospective-subject.ts"
Cohesion: 0.16
Nodes (17): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+9 more)

### Community 59 - "github/issue-publication.ts"
Cohesion: 0.16
Nodes (13): FeaturePublisher, PublicationReceipt, publishFeature(), reserveIdentity(), Assign, Board, Content, GitHubIssuePublisher (+5 more)

### Community 60 - "publish-pr.ts"
Cohesion: 0.15
Nodes (22): retryRead(), developerPRContent(), Execute, lintPRContent(), officePRContent(), prContent, assertCandidate(), Candidate (+14 more)

### Community 61 - "investigations/run.ts"
Cohesion: 0.22
Nodes (13): OFFICE_FIX_PROMPT, OfficeFixResult, validateOfficeFix(), investigationReady(), INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, InvestigationOptions, InvestigationReport (+5 more)

### Community 62 - "goal-reviews.ts"
Cohesion: 0.16
Nodes (14): applyGoalReview(), EvidenceRefSchema, statusAllowed(), workEvidence(), GoalInput, queueGoalNotice(), DailyCTOBriefing, DailyCTOResult (+6 more)

### Community 63 - "weekly-rollup.ts"
Cohesion: 0.16
Nodes (22): learningMetrics(), lessonsNeedingReview(), RollupResult, RollupResultSchema, harperFolder(), RETROSPECTIVE_TIMEOUT, lastFriday(), ROLLUP_HISTORY (+14 more)

### Community 64 - "outbox.ts"
Cohesion: 0.13
Nodes (15): projectOutbox(), knowledgeOutbox(), checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), repeatedVendorReviewBlock(), stoppedInVendorReview(), checkpointSuperseded() (+7 more)

### Community 65 - "validate-stage.ts"
Cohesion: 0.16
Nodes (17): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+9 more)

### Community 66 - "service-health.ts"
Cohesion: 0.19
Nodes (8): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, ServiceHealth

### Community 67 - "effects.ts"
Cohesion: 0.18
Nodes (14): assertFeatureDependencyOrder(), featureDependencyEdges(), key(), admitImprovement(), improvementEligible(), improvementManifest(), improvementMarker(), improvementProvider() (+6 more)

### Community 68 - "contract.ts"
Cohesion: 0.22
Nodes (11): At, Errno, GroupInventory, GroupProbe, LifecycleDiagnostic, Phase, Pid, groupInventory() (+3 more)

### Community 69 - "delivery-task.ts"
Cohesion: 0.20
Nodes (12): cecPrompt(), resolvedDecisionNote(), stageInstructions, APPROACH_GUIDANCE, reviewInstructions(), deliveryTask(), DeliveryTaskInput, DISCOVERY_GUIDANCE (+4 more)

### Community 70 - "assignment-poll.ts"
Cohesion: 0.22
Nodes (12): noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), pinCourier, due(), unparkReleasedWaits(), compare(), highestStableAtLeast() (+4 more)

### Community 71 - "investigations/ledger.ts"
Cohesion: 0.24
Nodes (15): syncOutbox(), settleRequestedSlackReplacement(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint(), slackRequestSettled(), supersedingDelivery() (+7 more)

### Community 72 - "discovery-recovery.ts"
Cohesion: 0.29
Nodes (10): Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership, rawHash() (+2 more)

### Community 73 - "store.ts"
Cohesion: 0.12
Nodes (16): Clock, systemClock, applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, statementCache(), initialSnapshot() (+8 more)

### Community 74 - "scheduled-work.ts"
Cohesion: 0.27
Nodes (13): deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), scheduledSlackIntake(), deterministicActions (+5 more)

### Community 75 - "TelemetryPanel.tsx"
Cohesion: 0.16
Nodes (20): TelemetryReport, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens(), usd(), KpiTiles() (+12 more)

### Community 76 - "maintenance-triggers.ts"
Cohesion: 0.46
Nodes (7): clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates(), maintenanceCompletedId(), maintenanceKey(), visibleMaintenanceTriggerIds()

### Community 77 - "coordination.ts"
Cohesion: 0.18
Nodes (18): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation(), checkpointWindow(), dueAt() (+10 more)

### Community 78 - "observations.ts"
Cohesion: 0.16
Nodes (18): digest(), exactly(), Message, nativeReadPayload(), pagination(), nativeFile(), Message, observeRead() (+10 more)

### Community 79 - "github-check-selection.ts"
Cohesion: 0.23
Nodes (16): checksFailed(), checksPassed(), checksPending(), currentMergeChecks(), pass(), pending(), requireThat(), resumeReviewedMerge() (+8 more)

### Community 80 - "shared.ts"
Cohesion: 0.07
Nodes (37): DECISION_KINDS, needsDecision(), ProjectReadiness, DailyCTOSummary, AssignmentResult, CompletionCondition, Continuation, EligibilityState (+29 more)

### Community 81 - "Agents"
Cohesion: 0.20
Nodes (7): cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), slackSendPrompt(), slackVerifyPrompt(), Agents

### Community 82 - "telemetry.ts"
Cohesion: 0.14
Nodes (21): captureCost(), summary(), CostCompleteness, CostEntry, CostLedgerState, TelemetryRow, TelemetrySync, UsageCompleteness (+13 more)

### Community 83 - "record-trigger.ts"
Cohesion: 0.27
Nodes (12): park(), clip(), JobLike, recordCIBudget(), recordParked(), recordRepairBudget(), recordTicketParked(), recordTrigger() (+4 more)

### Community 84 - "offices.ts"
Cohesion: 0.27
Nodes (11): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), projectSlackDeliveries(), readBackConversations(), diagnosticSnapshot(), nativeDeliveryResolved() (+3 more)

### Community 85 - "DailyCTO.tsx"
Cohesion: 0.26
Nodes (8): CTOReview(), goalState, DailyCTO(), GoalHistory(), reportDate(), reviewStatus, reviewExcerpt(), ReviewText()

### Community 86 - "time-readback.ts"
Cohesion: 0.33
Nodes (7): timeLedger(), TimeLedger, dueReadback(), Readback, READBACK_INTERVAL_MS, readBackTime(), SETTLE_MS

### Community 87 - "evidence.ts"
Cohesion: 0.33
Nodes (9): investigationEvidence(), OFFICE_SOURCE_PATHS, officeSource(), done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf() (+1 more)

### Community 88 - "fact-bounds.ts"
Cohesion: 0.30
Nodes (13): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+5 more)

### Community 89 - "local-config.ts"
Cohesion: 0.43
Nodes (6): AUTO_ADOPT_BOTS, GOAL_EVIDENCE_LIMITS, goalEvidencePath(), localBindings, assertModelOverrides(), ModelOverrides

### Community 90 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 91 - "codex-rollout.ts"
Cohesion: 0.18
Nodes (13): add(), CodexRequest, CodexRollout, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens() (+5 more)

### Community 92 - "cli.ts"
Cohesion: 0.25
Nodes (6): args, [cmd,...rawArgs], commands, key, projectIndex, PORT

### Community 93 - "scheduled-retrospectives.ts"
Cohesion: 0.48
Nodes (6): busyMaintenanceIds(), triggerJobId(), busySubjects(), scheduledRetrospectives(), status(), WorkEligibility

### Community 94 - "checkpoint-completion.ts"
Cohesion: 0.23
Nodes (8): BrainStatusSchema, identity, parseBrainStatus(), brainCheckpointCompletion(), coverageSchema, followupSchema, verified, reconcileCompletedCheckpoints()

### Community 95 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 99 - "time-classification.ts"
Cohesion: 0.62
Nodes (6): captureTime(), artifact(), correctRecoveryClassification(), digest(), timeClassificationDigest(), TimeClassificationInput

### Community 100 - "OfficeConfigView.tsx"
Cohesion: 0.48
Nodes (5): loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView(), OfficeConfigSummary

### Community 103 - "codex-rollout-file.ts"
Cohesion: 0.36
Nodes (7): codexHome(), createdAt(), dayDirs(), header(), ROLLOUT_MAX_BYTES, RolloutScan, scanCodexRollouts()

## Knowledge Gaps
- **354 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+349 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `source-amendment.ts`, `github-delivery.ts`, `artifact`, `features/workflow.ts`, `OfficeScene.tsx`, `TicketJob`, `workKey`, `maintenance.ts`, `requests.ts`, `OfficeSnapshot`, `digest`, `index.ts`, `engine.ts`, `.getEffect`, `conversations/conversations.ts`, `schedule.ts`, `agents.ts`, `it-specialist.ts`, `cec/issue-publication.ts`, `http/commands.ts`, `azure.ts`, `review-run.ts`, `run-retrospective.ts`, `session-bridge.ts`, `run-accounting.ts`, `projects.ts`, `cec/workflow.ts`, `.save`, `accept-retrospective.ts`, `time-scope.ts`, `dependency-bots/adopt.ts`, `cost-ledger.ts`, `remove-candidate.ts`, `.emit`, `daily-cto.ts`, `coordination-tick.ts`, `harnessEffect`, `brain-maintenance.ts`, `.transaction`, `tracking-issue.ts`, `retrospective-triggers.ts`, `notifications.ts`, `dependencies.ts`, `goal-reporting.ts`, `learningDigest`, `retrospective-subject.ts`, `github/issue-publication.ts`, `publish-pr.ts`, `investigations/run.ts`, `goal-reviews.ts`, `weekly-rollup.ts`, `validate-stage.ts`, `effects.ts`, `delivery-task.ts`, `investigations/ledger.ts`, `discovery-recovery.ts`, `store.ts`, `scheduled-work.ts`, `coordination.ts`, `telemetry.ts`, `record-trigger.ts`, `offices.ts`, `time-readback.ts`, `evidence.ts`, `scheduled-retrospectives.ts`, `checkpoint-completion.ts`, `time-classification.ts`?**
  _High betweenness centrality (0.114) - this node is a cross-community bridge._
- **Why does `command()` connect `Store` to `github-delivery.ts`, `features/workflow.ts`, `TicketJob`, `workKey`, `maintenance.ts`, `requests.ts`, `digest`, `engine.ts`, `.run`, `.getEffect`, `schedule.ts`, `agents.ts`, `cec/issue-publication.ts`, `azure.ts`, `review-run.ts`, `session-bridge.ts`, `cec/workflow.ts`, `.save`, `cost-ledger.ts`, `remove-candidate.ts`, `.emit`, `harnessEffect`, `brain-maintenance.ts`, `.transaction`, `tracking-issue.ts`, `notifications.ts`, `dependencies.ts`, `goal-reporting.ts`, `github/issue-publication.ts`, `publish-pr.ts`, `validate-stage.ts`, `service-health.ts`, `effects.ts`, `contract.ts`, `coordination.ts`, `time-readback.ts`, `command-registry.ts`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `Role` connect `agents.ts` to `github-delivery.ts`, `index.tsx`, `OfficeScene.tsx`, `TicketJob`, `PeoplePanel.tsx`, `Inspector.tsx`, `maintenance.ts`, `OfficeSnapshot`, `.run`, `conversations/conversations.ts`, `http/commands.ts`, `run-accounting.ts`, `projects.ts`, `cec/workflow.ts`, `.emit`, `retrospective-subject.ts`, `outbox.ts`, `validate-stage.ts`, `delivery-task.ts`, `store.ts`, `shared.ts`, `Agents`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `command()` (e.g. with `.constructor()` and `executeRequest()`) actually correct?**
  _`command()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _354 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `source-amendment.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08653353814644137 - nodes in this community are weakly interconnected._
- **Should `github-delivery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09273772204806688 - nodes in this community are weakly interconnected._