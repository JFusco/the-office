# Graph Report - office  (2026-11-09)

## Corpus Check
- 541 files · ~255,289 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3022 nodes · 12907 edges · 96 communities (92 shown, 4 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 71 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e437b3d3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- github-delivery.ts
- Inspector.tsx
- store.ts
- schedule.ts
- artifact
- knowledge.ts
- workKey
- App.tsx
- OfficeScene.tsx
- brain-maintenance.ts
- .emit
- conversations/conversations.ts
- source-amendment.ts
- digest
- .save
- record-trigger.ts
- weekly-rollup.ts
- Store
- weekly-research.ts
- PeoplePanel.tsx
- cec/workflow.ts
- TimeBook.tsx
- goal-reporting.ts
- engine.ts
- .getEffect
- TicketJob
- index.ts
- activation-recovery.ts
- process.ts
- scope-repair-resume.ts
- shared.ts
- .run
- github/issue-publication.ts
- publish-pr.ts
- session-bridge.ts
- mutedCopy
- dependencies.ts
- cost-ledger.ts
- OfficeSnapshot
- dependency-bots/adopt.ts
- investigations/run.ts
- maintenance.ts
- assignment-poll.ts
- http/commands.ts
- release-unpark.ts
- remove-candidate.ts
- useOfficePreferences.ts
- Coordinator
- scheduled-work.ts
- telemetry.ts
- cec/issue-publication.ts
- time-scope.ts
- observations.ts
- closeout.ts
- features.ts
- outbox.ts
- offices.ts
- migrations.ts
- Goals.tsx
- harnessEffect
- run-accounting.ts
- WorkTime
- it-specialist.ts
- lesson-selection.ts
- jira-time.ts
- tracking-issue.ts
- source-amendment-scope.ts
- service-health.ts
- coordination.ts
- model-routes.ts
- evidence.ts
- blocker-followups.ts
- sanitizeObject
- work.ts
- discovery-recovery.ts
- time-readback.ts
- delivery-task.ts
- codex-rollout.ts
- command-registry.ts
- Offices
- cost-totals.ts
- cli.ts
- read-retries.ts
- owned-artifact.ts
- codex-rollout-file.ts
- run-usage.ts
- SlackIntakeStatus.tsx
- channel-notice.ts
- BrainFollowup
- codexAccounting
- helper-usage.ts
- highestStableAtLeast
- dependency-edges.ts
- slack-supersession.ts
- helper-evidence.py

## God Nodes (most connected - your core abstractions)
1. `Store` - 283 edges
2. `TicketJob` - 129 edges
3. `GitHubDelivery` - 119 edges
4. `command()` - 100 edges
5. `artifact()` - 87 edges
6. `digest()` - 84 edges
7. `workKey()` - 79 edges
8. `cx()` - 77 edges
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

## Communities (96 total, 4 thin omitted)

### Community 0 - "github-delivery.ts"
Cohesion: 0.07
Nodes (83): findingsBlock(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery(), BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE (+75 more)

### Community 1 - "Inspector.tsx"
Cohesion: 0.06
Nodes (75): Conversation(), Outbox(), recommendedReply(), slackMessageStatus(), SlackDeliveryCard(), labels, BlockerFollowups(), IntakeSummary() (+67 more)

### Community 2 - "store.ts"
Cohesion: 0.07
Nodes (56): JiraOperations, plain(), cecPrompt(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), resolvedDecisionNote() (+48 more)

### Community 3 - "schedule.ts"
Cohesion: 0.10
Nodes (62): KnowledgeRunner, captureProposal(), effectId(), newTask(), recordObservation(), settlePage(), Config, configDigest() (+54 more)

### Community 4 - "artifact"
Cohesion: 0.09
Nodes (69): partialLocalCleanupCandidate(), savedActivationFailure(), continuationWorkerProof(), candidateInput(), children, oldAdoptionBasis(), savedCandidateAdmission, assertPostConflictFiles() (+61 more)

### Community 5 - "knowledge.ts"
Cohesion: 0.05
Nodes (65): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, improvementIntakeGate(), learningDigest(), recordLearningOpportunity(), appendLearningFacts(), expireLearningPackets() (+57 more)

### Community 6 - "workKey"
Cohesion: 0.07
Nodes (61): HarnessControl, completedPRReviews(), continuationScope(), continuationWorktree(), continuationGuard(), brainImplementationCandidate(), BrainReadback, digest() (+53 more)

### Community 7 - "App.tsx"
Cohesion: 0.06
Nodes (55): themeColor, App(), CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants, ElevatorPhase, floorVariants (+47 more)

### Community 8 - "OfficeScene.tsx"
Cohesion: 0.06
Nodes (56): displayAgentTask(), githubStageLabels, withoutElapsed(), LiveAgentTask(), Props, RunningTask(), text(), Avatar() (+48 more)

### Community 9 - "brain-maintenance.ts"
Cohesion: 0.06
Nodes (46): maintenancePolicies(), collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB (+38 more)

### Community 10 - ".emit"
Cohesion: 0.11
Nodes (40): approveFeature(), assertRetainedItems(), commandFeature(), createFeature(), featureById(), mutation(), reviewQuestions(), discoveryPrompt() (+32 more)

### Community 11 - "conversations/conversations.ts"
Cohesion: 0.08
Nodes (32): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, ReplySchema, pumpCTO(), queueCTOHandoff(), saveGoals() (+24 more)

### Community 12 - "source-amendment.ts"
Cohesion: 0.08
Nodes (55): adoptCandidate(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat() (+47 more)

### Community 13 - "digest"
Cohesion: 0.10
Nodes (52): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+44 more)

### Community 14 - ".save"
Cohesion: 0.09
Nodes (38): file, folder, logs, root, xml(), unpack(), BLOCKED, Execute (+30 more)

### Community 15 - "record-trigger.ts"
Cohesion: 0.09
Nodes (47): maintenanceSubject(), MaintenanceSubjectFacts, busyMaintenanceIds(), clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates(), maintenanceCompletedId() (+39 more)

### Community 16 - "weekly-rollup.ts"
Cohesion: 0.07
Nodes (40): deliveryMetrics(), median(), learningMetrics(), lessonsNeedingReview(), RollupResult, RollupResultSchema, harperFolder(), RETROSPECTIVE_TIMEOUT (+32 more)

### Community 17 - "Store"
Cohesion: 0.08
Nodes (15): featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), JiraFeaturePublisher, observeHelperGroups(), stopHelperGroups(), FeatureReviewRunner, fifo() (+7 more)

### Community 18 - "weekly-research.ts"
Cohesion: 0.09
Nodes (19): mirror(), ResearchResult, runWeeklyResearch(), scheduledResearch(), DailyCTO, dailyReviewPrompt(), Briefing, saveReviewBriefing() (+11 more)

### Community 19 - "PeoplePanel.tsx"
Cohesion: 0.10
Nodes (40): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+32 more)

### Community 20 - "cec/workflow.ts"
Cohesion: 0.11
Nodes (38): parksInJira(), MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), run(), advance(), nextStage(), publicationEvidenceGap() (+30 more)

### Community 21 - "TimeBook.tsx"
Cohesion: 0.10
Nodes (36): TelemetryReport, AzureBuild, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens(), usd() (+28 more)

### Community 22 - "goal-reporting.ts"
Cohesion: 0.09
Nodes (30): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+22 more)

### Community 23 - "engine.ts"
Cohesion: 0.08
Nodes (21): correlatedBuild(), checkMail(), drainMail(), requestMail(), dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery() (+13 more)

### Community 24 - ".getEffect"
Cohesion: 0.11
Nodes (21): publishFeature(), recoverFeatures(), GitHubOperations, fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), goalNoticeAuthorized(), goalNoticeNeverDispatched() (+13 more)

### Community 25 - "TicketJob"
Cohesion: 0.09
Nodes (16): dependabotReviewGuidance(), StageContext, GitHubDelivery, stagePrompt(), StagePromptInput, stageRole(), implementationContinuationInstruction(), retireInactiveDeliveries() (+8 more)

### Community 26 - "index.ts"
Cohesion: 0.11
Nodes (31): close(), config, itSpecialist, loadedRevision, offices, releaseLock, server, serviceHealth (+23 more)

### Community 27 - "activation-recovery.ts"
Cohesion: 0.14
Nodes (34): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+26 more)

### Community 28 - "process.ts"
Cohesion: 0.10
Nodes (23): Execute, GITHUB_ISSUE_SKILL, Result, Assessment, At, Errno, GroupInventory, GroupProbe (+15 more)

### Community 29 - "scope-repair-resume.ts"
Cohesion: 0.15
Nodes (32): containedFile(), assertContinuationWorker(), Assessment, outsideScanSources(), Ownership, reconcileScopeRepairReadback(), requireThat(), scopeRepairReadbackCandidate() (+24 more)

### Community 30 - "shared.ts"
Cohesion: 0.10
Nodes (27): diagnosticContext(), ProjectReadiness, DailyCTOSummary, SchedulerState, itAgent(), itDiagnostics(), currentServices(), ServiceHealthPanel() (+19 more)

### Community 31 - ".run"
Cohesion: 0.09
Nodes (22): candidateWorkspaceEnvironment(), assignmentSubject(), dispatchExposure(), prepareExposure(), ClaudeStream, codexArguments(), LaunchPolicy, LaunchPolicyReceipt (+14 more)

### Community 32 - "github/issue-publication.ts"
Cohesion: 0.16
Nodes (13): GitHubFeaturePublisher, FeaturePublisher, PublicationReceipt, Assign, Board, Content, GitHubIssuePublisher, number() (+5 more)

### Community 33 - "publish-pr.ts"
Cohesion: 0.14
Nodes (26): retryRead(), developerPRContent(), Execute, lintPRContent(), officePRContent(), prContent, assertCandidate(), Candidate (+18 more)

### Community 34 - "session-bridge.ts"
Cohesion: 0.12
Nodes (23): claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexSessionContext(), readRollout, claudeSessions(), codexSessions() (+15 more)

### Community 35 - "mutedCopy"
Cohesion: 0.20
Nodes (22): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS, PickupForm(), channelSettingsProblem() (+14 more)

### Community 36 - "dependencies.ts"
Cohesion: 0.16
Nodes (25): reconcileNoticeConfirmations(), Admission, admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, resumeParked(), compatible() (+17 more)

### Community 37 - "cost-ledger.ts"
Cohesion: 0.17
Nodes (25): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress(), effectId() (+17 more)

### Community 38 - "OfficeSnapshot"
Cohesion: 0.12
Nodes (22): FeatureRound, ProgressionItem, FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures() (+14 more)

### Community 39 - "dependency-bots/adopt.ts"
Cohesion: 0.16
Nodes (22): adoptDependabot(), closesIssue(), linkedBody(), linkPR(), dependabotPR, openDependabotPulls(), readRepo(), refusal() (+14 more)

### Community 40 - "investigations/run.ts"
Cohesion: 0.17
Nodes (20): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationCandidates(), investigationId(), investigationFollowUps(), investigationResolution(), syncInvestigations(), OFFICE_FIX_PROMPT (+12 more)

### Community 41 - "maintenance.ts"
Cohesion: 0.14
Nodes (18): captureMaintenanceStep(), candidateOwner(), SETTLED, skipOwnedCandidate(), Skipped, skippedCandidateLedger(), CmsFollowUpContext, cmsFollowUpInstructions() (+10 more)

### Community 42 - "assignment-poll.ts"
Cohesion: 0.14
Nodes (21): clamp(), LIMITS, MergedPR, plainSlackText(), section(), shippedSummary(), configureNotices(), Identity (+13 more)

### Community 43 - "http/commands.ts"
Cohesion: 0.18
Nodes (21): normalizeStatement(), baselineLearning(), configureKnowledge(), declineLessonIssue(), demoteLesson(), reactivateLesson(), retireLesson(), decideOfficeProposal() (+13 more)

### Community 44 - "release-unpark.ts"
Cohesion: 0.21
Nodes (21): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard, projectCards() (+13 more)

### Community 45 - "remove-candidate.ts"
Cohesion: 0.17
Nodes (18): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), removeAdoptedClone() (+10 more)

### Community 46 - "useOfficePreferences.ts"
Cohesion: 0.11
Nodes (20): PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, acceptPreferences(), PreferenceCandidate, PreferenceState (+12 more)

### Community 48 - "scheduled-work.ts"
Cohesion: 0.16
Nodes (20): deliverySlot(), ROLES, closeoutRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), scheduledSlackIntake(), officeCapacity (+12 more)

### Community 49 - "telemetry.ts"
Cohesion: 0.11
Nodes (22): CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL, Rates (+14 more)

### Community 50 - "cec/issue-publication.ts"
Cohesion: 0.24
Nodes (7): Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), plainDescription(), Transition

### Community 51 - "time-scope.ts"
Cohesion: 0.21
Nodes (20): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), ScopePolicy, scopeSelector(), midnight(), TicketDay, ticketDayTotals(), captureTime() (+12 more)

### Community 52 - "observations.ts"
Cohesion: 0.15
Nodes (18): exactly(), Message, nativeReadPayload(), pagination(), nativeFile(), Message, observeRead(), Page (+10 more)

### Community 53 - "closeout.ts"
Cohesion: 0.21
Nodes (17): installDependencies(), major(), harnessCloseout(), PASSING, verifyMergeActions(), withHarnessWork(), runHarnessStage(), harnessStageResult() (+9 more)

### Community 54 - "features.ts"
Cohesion: 0.16
Nodes (19): bindDelivery(), featureEffectGate(), assertEnrollable(), bindFeature(), currentApproval(), enrolled(), featureGate(), predecessorComplete() (+11 more)

### Community 55 - "outbox.ts"
Cohesion: 0.20
Nodes (14): MessageInput, projectOutbox(), syncOutbox(), projectSlackDeliveries(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint() (+6 more)

### Community 56 - "offices.ts"
Cohesion: 0.19
Nodes (15): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+7 more)

### Community 57 - "migrations.ts"
Cohesion: 0.14
Nodes (15): LEARNING_BASELINES, seedProjectLessons(), readLocalIntakeReport(), GoalInput, saveGoal(), queueGoalNotice(), file, project (+7 more)

### Community 58 - "Goals.tsx"
Cohesion: 0.14
Nodes (16): GoalProgress, SendMessage, CTOReview(), goalState, DailyCTO(), GoalHistory(), reportDate(), reviewStatus (+8 more)

### Community 59 - "harnessEffect"
Cohesion: 0.25
Nodes (14): activeEffectId(), harnessEffect, assertMayMutate(), park(), Execute, promoteReady(), officeMergeProvenance(), reconcileMergeScannerRetry() (+6 more)

### Community 60 - "run-accounting.ts"
Cohesion: 0.16
Nodes (15): BoundedRead, backfillClaudeCost(), CompletionReader, COMPLETION_MAX_BYTES, completionAccounting(), markCaptureStart(), readCompletion(), RECONCILE_GRACE_MS (+7 more)

### Community 61 - "WorkTime"
Cohesion: 0.18
Nodes (18): ConfirmedSegment, LiveAnchor, ObservationGap, SnapshotOrdering, TimeLedgerState, WorkTime, Acc, bump() (+10 more)

### Community 62 - "it-specialist.ts"
Cohesion: 0.23
Nodes (13): partialLocalCleanupKey(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), ITContext, publishITReport(), delays (+5 more)

### Community 63 - "lesson-selection.ts"
Cohesion: 0.19
Nodes (16): knowledgeContext(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), LessonSelection, MAINTENANCE (+8 more)

### Community 64 - "jira-time.ts"
Cohesion: 0.22
Nodes (12): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+4 more)

### Community 65 - "tracking-issue.ts"
Cohesion: 0.22
Nodes (14): readBackOrThrow(), ensureTrackingIssue(), findTrackingIssue(), ownTracking(), TrackingIssue, trackingIssueBody(), trackingIssueTitle(), trackingMarker() (+6 more)

### Community 66 - "source-amendment-scope.ts"
Cohesion: 0.26
Nodes (15): approvedText(), assert(), assert(), boundProfiles, canonical(), Document, ReadSourceFile, releaseAmendmentJournal() (+7 more)

### Community 67 - "service-health.ts"
Cohesion: 0.19
Nodes (8): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, ServiceHealth

### Community 68 - "coordination.ts"
Cohesion: 0.20
Nodes (13): checkpointWindow(), coordination(), dueAt(), hours, localDay(), ReviewResult, deferNonReady(), preparePR() (+5 more)

### Community 69 - "model-routes.ts"
Cohesion: 0.21
Nodes (13): AUTO_ADOPT_BOTS, goalEvidencePath(), localBindings, assertModelOverrides(), CODEX_DEFAULT_EFFORT, CODEX_DEFAULT_MODEL, CODEX_EFFORTS, CODEX_ROLES (+5 more)

### Community 70 - "evidence.ts"
Cohesion: 0.29
Nodes (9): investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_SOURCE_PATHS, officeSource(), ROOT, launchPolicyFacts() (+1 more)

### Community 71 - "blocker-followups.ts"
Cohesion: 0.36
Nodes (9): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), readBackConversations(), diagnosticSnapshot(), nativeDeliveryResolved(), handoff() (+1 more)

### Community 72 - "sanitizeObject"
Cohesion: 0.18
Nodes (9): sanitizeObject(), comparable(), EvidenceOutcome, recordRunEvidence(), checkpointMeasurement(), HEARTBEAT_GAP_MS, HEARTBEAT_MS, startMeasurement() (+1 more)

### Community 73 - "work.ts"
Cohesion: 0.17
Nodes (11): pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION, AssignmentResult, CompletionCondition, DependencyObservation, EligibilityState, FailureCategory (+3 more)

### Community 74 - "discovery-recovery.ts"
Cohesion: 0.29
Nodes (10): Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership, rawHash() (+2 more)

### Community 75 - "time-readback.ts"
Cohesion: 0.24
Nodes (7): TimeLedger, dueReadback(), Readback, READBACK_INTERVAL_MS, readBackTime(), SETTLE_MS, TimePublication

### Community 76 - "delivery-task.ts"
Cohesion: 0.31
Nodes (7): deliveryTask(), DeliveryTaskInput, DISCOVERY_GUIDANCE, compactSteps(), AMENDMENT_REVIEW_PROOF, featureDeliveryContext(), deliveryResearchContext()

### Community 77 - "codex-rollout.ts"
Cohesion: 0.29
Nodes (9): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO (+1 more)

### Community 78 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 80 - "cost-totals.ts"
Cohesion: 0.36
Nodes (8): isModelWork(), isTicketModelWork(), awaitingEvidence(), CaptureContext, inCostWindow(), TicketCost, ticketCosts(), ISSUE_KEY

### Community 81 - "cli.ts"
Cohesion: 0.25
Nodes (6): args, [cmd,...rawArgs], commands, key, projectIndex, PORT

### Community 82 - "read-retries.ts"
Cohesion: 0.32
Nodes (7): PrerequisitesSchema, incompleteReadOutput(), IntakeResult, planReadRetry(), reconcileReadRetries(), WorkFailure, ReadRetry

### Community 83 - "owned-artifact.ts"
Cohesion: 0.54
Nodes (6): ghLogCacheEvidence(), done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf()

### Community 84 - "codex-rollout-file.ts"
Cohesion: 0.36
Nodes (7): codexHome(), createdAt(), dayDirs(), header(), ROLLOUT_MAX_BYTES, RolloutScan, scanCodexRollouts()

### Community 85 - "run-usage.ts"
Cohesion: 0.38
Nodes (5): CodexRollout, claudeCrashZero(), claudeUsage(), count(), RunUsage

### Community 86 - "SlackIntakeStatus.tsx"
Cohesion: 0.47
Nodes (5): SlackIntakeStatus, format, labels, SlackIntakeStatus(), time()

### Community 87 - "channel-notice.ts"
Cohesion: 0.70
Nodes (4): ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice()

### Community 89 - "codexAccounting"
Cohesion: 0.50
Nodes (5): readCodexRollout(), codexAccounting(), codexCost(), unpriced(), codexUsage()

### Community 90 - "helper-usage.ts"
Cohesion: 0.60
Nodes (4): HELPER_STDOUT_MAX_BYTES, helperAccounting(), claudeAccounting(), withReason()

### Community 91 - "highestStableAtLeast"
Cohesion: 0.83
Nodes (3): compare(), highestStableAtLeast(), parts()

### Community 92 - "dependency-edges.ts"
Cohesion: 1.00
Nodes (3): assertFeatureDependencyOrder(), featureDependencyEdges(), key()

### Community 93 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

## Knowledge Gaps
- **357 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+352 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `github-delivery.ts`, `store.ts`, `schedule.ts`, `artifact`, `knowledge.ts`, `workKey`, `brain-maintenance.ts`, `.emit`, `conversations/conversations.ts`, `source-amendment.ts`, `digest`, `.save`, `record-trigger.ts`, `weekly-rollup.ts`, `weekly-research.ts`, `cec/workflow.ts`, `goal-reporting.ts`, `engine.ts`, `.getEffect`, `TicketJob`, `index.ts`, `activation-recovery.ts`, `process.ts`, `scope-repair-resume.ts`, `shared.ts`, `.run`, `github/issue-publication.ts`, `publish-pr.ts`, `session-bridge.ts`, `dependencies.ts`, `cost-ledger.ts`, `OfficeSnapshot`, `dependency-bots/adopt.ts`, `investigations/run.ts`, `maintenance.ts`, `assignment-poll.ts`, `http/commands.ts`, `release-unpark.ts`, `remove-candidate.ts`, `Coordinator`, `scheduled-work.ts`, `cec/issue-publication.ts`, `time-scope.ts`, `features.ts`, `outbox.ts`, `offices.ts`, `migrations.ts`, `harnessEffect`, `run-accounting.ts`, `it-specialist.ts`, `lesson-selection.ts`, `jira-time.ts`, `tracking-issue.ts`, `coordination.ts`, `evidence.ts`, `blocker-followups.ts`, `sanitizeObject`, `discovery-recovery.ts`, `time-readback.ts`, `delivery-task.ts`, `read-retries.ts`, `channel-notice.ts`, `BrainFollowup`, `dependency-edges.ts`?**
  _High betweenness centrality (0.105) - this node is a cross-community bridge._
- **Why does `Role` connect `store.ts` to `github-delivery.ts`, `Inspector.tsx`, `workKey`, `App.tsx`, `OfficeScene.tsx`, `.emit`, `conversations/conversations.ts`, `record-trigger.ts`, `Store`, `PeoplePanel.tsx`, `TicketJob`, `shared.ts`, `.run`, `OfficeSnapshot`, `maintenance.ts`, `http/commands.ts`, `scheduled-work.ts`, `outbox.ts`, `run-accounting.ts`, `model-routes.ts`, `work.ts`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `TicketJob` connect `TicketJob` to `github-delivery.ts`, `Inspector.tsx`, `store.ts`, `artifact`, `workKey`, `App.tsx`, `brain-maintenance.ts`, `source-amendment.ts`, `digest`, `.save`, `record-trigger.ts`, `cec/workflow.ts`, `activation-recovery.ts`, `scope-repair-resume.ts`, `shared.ts`, `.run`, `publish-pr.ts`, `dependencies.ts`, `dependency-bots/adopt.ts`, `release-unpark.ts`, `remove-candidate.ts`, `scheduled-work.ts`, `closeout.ts`, `features.ts`, `harnessEffect`, `it-specialist.ts`, `tracking-issue.ts`, `discovery-recovery.ts`, `delivery-task.ts`, `owned-artifact.ts`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `command()` (e.g. with `.constructor()` and `executeRequest()`) actually correct?**
  _`command()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _357 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `github-delivery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06805671392827356 - nodes in this community are weakly interconnected._
- **Should `Inspector.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05711022272986865 - nodes in this community are weakly interconnected._