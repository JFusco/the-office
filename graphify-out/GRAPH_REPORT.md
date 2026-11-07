# Graph Report - the-office  (2026-11-06)

## Corpus Check
- 402 files · ~199,467 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2387 nodes · 10180 edges · 81 communities (79 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 51 edges (avg confidence: 0.74)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `fe2008f6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- source-amendment.ts
- OfficeScene.tsx
- shared.ts
- App.tsx
- index.ts
- worker-runtime.ts
- index.tsx
- published-draft-conflict.ts
- conversations/conversations.ts
- saved-prerequisite-handoff.ts
- cec/workflow.ts
- digest
- approval.ts
- .emit
- PeoplePanel.tsx
- azure.ts
- service-health.ts
- deliveryInputSha256
- activation-recovery.ts
- FeatureWorkspace.tsx
- Inspector.tsx
- LessonsPanel.tsx
- artifact
- control-store.ts
- Store
- ControlStore
- jira-publication.ts
- agents.ts
- features.ts
- validate-stage.ts
- .transaction
- maintenance.ts
- run-retrospective.ts
- scheduler.ts
- github-delivery.ts
- requests.ts
- .getEffect
- TimeBook.tsx
- .save
- dependency-bots/adopt.ts
- github-publication.ts
- Coordinator
- accept-stage-result.ts
- jira-time.ts
- tracking-issue.ts
- dependencies.ts
- scheduled-work.ts
- retrospective-triggers.ts
- store.ts
- create-candidate.ts
- features/workflow.ts
- coordination.ts
- coordination-tick.ts
- outbox.ts
- retrospective-subject.ts
- assignment-poll.ts
- remove-candidate.ts
- it-specialist.ts
- preferences-store.ts
- Offices
- run-ci-repair.ts
- knowledge.ts
- publish-pr.ts
- weekly-rollup.ts
- fact-bounds.ts
- discovery-recovery.ts
- recovery-ledger.ts
- DailyCTO.tsx
- daily-cto.ts
- useOfficePreferences.ts
- retrospective-facts.ts
- checkpoint-completion.ts
- cli.ts
- office-lessons.ts
- knowledge-context.ts
- liveReach
- command-registry.ts
- session-bridge.ts
- maintenance-triggers.ts
- helper-evidence.py

## God Nodes (most connected - your core abstractions)
1. `Store` - 221 edges
2. `TicketJob` - 114 edges
3. `GitHubDelivery` - 112 edges
4. `command()` - 86 edges
5. `artifact()` - 85 edges
6. `digest()` - 82 edges
7. `workKey()` - 69 edges
8. `cx()` - 69 edges
9. `StageResult` - 63 edges
10. `OfficeSnapshot` - 63 edges

## Surprising Connections (you probably didn't know these)
- `projectOutbox()` --calls--> `deferredPickup()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/pickup-state.ts
- `projectOutbox()` --calls--> `parkedProviderWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts
- `projectOutbox()` --calls--> `readinessWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts
- `IntakeContext` --references--> `PickupPolicy`  [EXTRACTED]
  server/delivery/intake/admission.ts → src/shared.ts
- `needsReconciliation()` --calls--> `workKey()`  [EXTRACTED]
  server/delivery/parking/retire-backlogged.ts → src/contracts/work.ts

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

## Communities (81 total, 2 thin omitted)

### Community 0 - "source-amendment.ts"
Cohesion: 0.06
Nodes (73): deliveryTask(), DeliveryTaskInput, DISCOVERY_GUIDANCE, compactSteps(), adoptCandidate(), reported, Scope, approvedText() (+65 more)

### Community 1 - "OfficeScene.tsx"
Cohesion: 0.06
Nodes (59): displayAgentTask(), githubStageLabels, withoutElapsed(), LiveAgentTask(), Props, RunningTask(), text(), Avatar() (+51 more)

### Community 2 - "shared.ts"
Cohesion: 0.06
Nodes (39): ProjectReadiness, DailyCTOSummary, ConfirmedSegment, LiveAnchor, ObservationGap, SnapshotOrdering, TimeLedgerState, AssignmentResult (+31 more)

### Community 3 - "App.tsx"
Cohesion: 0.05
Nodes (48): themeColor, App(), CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants, ElevatorPhase, floorVariants (+40 more)

### Community 4 - "index.ts"
Cohesion: 0.11
Nodes (28): close(), config, itSpecialist, loadedRevision, offices, releaseLock, server, serviceHealth (+20 more)

### Community 5 - "worker-runtime.ts"
Cohesion: 0.09
Nodes (26): SlackResultSchema, SlackVerificationSchema, systemClock, DELIVERY_CONCURRENCY, file, project, root, contextPacket() (+18 more)

### Community 6 - "index.tsx"
Cohesion: 0.09
Nodes (49): Conversation(), Outbox(), SendMessage, recommendedReply(), ServiceHealthPanel(), labels, ServiceHealthRow(), GoalList() (+41 more)

### Community 7 - "published-draft-conflict.ts"
Cohesion: 0.15
Nodes (20): guard(), initialDraftConflictAnchor(), mergeInitialSourceLock(), originalPublication(), Ownership, reconcilePublishedDraftConflict(), verifyInitialDraftConflictDelta(), preparedHop() (+12 more)

### Community 8 - "conversations/conversations.ts"
Cohesion: 0.09
Nodes (32): assertConversationReadback(), Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff(), saveGoals() (+24 more)

### Community 9 - "saved-prerequisite-handoff.ts"
Cohesion: 0.36
Nodes (12): continuationWorktree(), dependencyVersion(), handoffSavedPrerequisites(), hasSavedPrerequisiteResult(), Ownership, qualified(), readDependencies(), requireSavedPrerequisites() (+4 more)

### Community 10 - "cec/workflow.ts"
Cohesion: 0.08
Nodes (54): checkMail(), drainMail(), requestMail(), parksInJira(), dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery() (+46 more)

### Community 11 - "digest"
Cohesion: 0.10
Nodes (54): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+46 more)

### Community 12 - "approval.ts"
Cohesion: 0.23
Nodes (18): approveFeature(), assertRetainedItems(), commandFeature(), createFeature(), featureById(), mutation(), reviewQuestions(), artifactPath() (+10 more)

### Community 13 - ".emit"
Cohesion: 0.18
Nodes (17): ChannelSettings, configureChannelNotices(), configureNotices(), NoticeSettings, retryRecipientLookup(), configureKnowledge(), declineLessonIssue(), reactivateLesson() (+9 more)

### Community 14 - "PeoplePanel.tsx"
Cohesion: 0.10
Nodes (38): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+30 more)

### Community 15 - "azure.ts"
Cohesion: 0.10
Nodes (28): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+20 more)

### Community 16 - "service-health.ts"
Cohesion: 0.18
Nodes (9): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, slackHealth() (+1 more)

### Community 17 - "deliveryInputSha256"
Cohesion: 0.18
Nodes (18): advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat(), candidateInput(), children, oldAdoptionBasis() (+10 more)

### Community 18 - "activation-recovery.ts"
Cohesion: 0.09
Nodes (61): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+53 more)

### Community 19 - "FeatureWorkspace.tsx"
Cohesion: 0.18
Nodes (15): FeatureRound, FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures(), draftKey() (+7 more)

### Community 20 - "Inspector.tsx"
Cohesion: 0.13
Nodes (31): PORTRAIT, STEP, STEP_MARK, TicketDetail(), SettingsPanel(), OfficeSnapshot, Count(), envelopeCard (+23 more)

### Community 21 - "LessonsPanel.tsx"
Cohesion: 0.13
Nodes (29): LessonsPanel(), when(), SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), loadOfficeConfig(), OfficeConfigSection() (+21 more)

### Community 22 - "artifact"
Cohesion: 0.16
Nodes (34): containedFile(), Assessment, outsideScanSources(), Ownership, reconcileScopeRepairReadback(), requireThat(), scopeRepairReadbackCandidate(), scopeRepairRequestResolved() (+26 more)

### Community 23 - "control-store.ts"
Cohesion: 0.12
Nodes (14): Clock, EASTERN, easternDayFormatter, easternPartsFormatter, applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration (+6 more)

### Community 24 - "Store"
Cohesion: 0.06
Nodes (24): correlatedBuild(), JiraOperations, plain(), APPROACH_GUIDANCE, reconcileCloseout(), GITHUB_ISSUE_SKILL, Result, Assessment (+16 more)

### Community 25 - "ControlStore"
Cohesion: 0.16
Nodes (6): DailyCTO, Briefing, saveReviewBriefing(), ControlStore, OfficeKnowledge, DailyCTOReport

### Community 26 - "jira-publication.ts"
Cohesion: 0.17
Nodes (12): unpack(), Assignment, Content, JiraFeaturePublisher, jiraText(), keyOf(), plainDescription(), Transition (+4 more)

### Community 27 - "agents.ts"
Cohesion: 0.07
Nodes (41): cecPrompt(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), resolvedDecisionNote(), stageInstructions, ConversationResultSchema (+33 more)

### Community 28 - "features.ts"
Cohesion: 0.13
Nodes (19): assertFeatureDependencyOrder(), featureDependencyEdges(), key(), bindFeature(), currentApproval(), enrolled(), featureGate(), predecessorComplete() (+11 more)

### Community 29 - "validate-stage.ts"
Cohesion: 0.20
Nodes (15): HarnessControl, withHarnessWork(), runHarnessStage(), harnessStageResult(), receipt(), Check, harnessChecks(), harnessValidate() (+7 more)

### Community 30 - ".transaction"
Cohesion: 0.18
Nodes (13): featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), recoverFeatures(), EvidenceSchema, helperInstallation(), readReview(), ReviewEvidence (+5 more)

### Community 31 - "maintenance.ts"
Cohesion: 0.13
Nodes (24): maintenancePolicies(), BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice(), candidateOwner(), SETTLED, skipOwnedCandidate() (+16 more)

### Community 32 - "run-retrospective.ts"
Cohesion: 0.20
Nodes (15): acceptRetrospective(), busyMaintenanceIds(), retrospectivePrompt(), SUBJECT, RetrospectiveResultSchema, triggerJobId(), KnowledgeRunner, KnowledgeRunOptions (+7 more)

### Community 33 - "scheduler.ts"
Cohesion: 0.17
Nodes (12): ROLES, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch(), foreignWork() (+4 more)

### Community 34 - "github-delivery.ts"
Cohesion: 0.06
Nodes (54): BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction(), dependabotReviewGuidance(), discover(), refreshDependencies(), routeExisting() (+46 more)

### Community 35 - "requests.ts"
Cohesion: 0.09
Nodes (43): assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), reconcileCompletedConflictDraft(), routeReadyPostConflictPublication(), verifyInitialDraftConflictPreparation() (+35 more)

### Community 36 - ".getEffect"
Cohesion: 0.27
Nodes (7): GitHubOperations, fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), closeNativeRefresh(), fingerprint(), EffectIntent

### Community 37 - "TimeBook.tsx"
Cohesion: 0.18
Nodes (17): AzureBuild, lastWall, sample(), subscribe(), subscribers, useLiveClock(), liveBuildTiming(), liveTiming() (+9 more)

### Community 38 - ".save"
Cohesion: 0.15
Nodes (29): file, folder, logs, root, xml(), BLOCKED, Execute, findComment() (+21 more)

### Community 39 - "dependency-bots/adopt.ts"
Cohesion: 0.22
Nodes (20): Execute, adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR, openDependabotPulls() (+12 more)

### Community 40 - "github-publication.ts"
Cohesion: 0.29
Nodes (8): Assign, Board, Content, GitHubFeaturePublisher, number(), same(), PublicationReceipt, label()

### Community 41 - "Coordinator"
Cohesion: 0.08
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 42 - "accept-stage-result.ts"
Cohesion: 0.12
Nodes (43): findingsBlock(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery(), acceptStageResult(), acceptConflictRepair(), recordJobApproach() (+35 more)

### Community 43 - "jira-time.ts"
Cohesion: 0.19
Nodes (17): easternDay(), easternInstant(), data(), JiraWorklogs, localId(), locks, matches(), publishJiraTime() (+9 more)

### Community 44 - "tracking-issue.ts"
Cohesion: 0.24
Nodes (19): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), ProjectCard, projectCards(), projectGraphql() (+11 more)

### Community 45 - "dependencies.ts"
Cohesion: 0.28
Nodes (15): Admission, admit(), IntakeContext, compatible(), dependencyCompletionKey(), dependencyEligibility(), DependencyStores, issueKey() (+7 more)

### Community 46 - "scheduled-work.ts"
Cohesion: 0.16
Nodes (18): deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), deterministicActions, eligible() (+10 more)

### Community 47 - "retrospective-triggers.ts"
Cohesion: 0.20
Nodes (20): clip(), JobLike, recordCIBudget(), recordParked(), recordRepairBudget(), recordTicketParked(), recordTrigger(), subjectOf() (+12 more)

### Community 48 - "store.ts"
Cohesion: 0.13
Nodes (20): channelNoticeAuthorized(), notices(), queueChannelNotice(), Identity, MergeNotifications, reconcileNoticeConfirmations(), comparableSlackText(), SlackMessages (+12 more)

### Community 49 - "create-candidate.ts"
Cohesion: 0.31
Nodes (9): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+1 more)

### Community 50 - "features/workflow.ts"
Cohesion: 0.20
Nodes (18): discoveryPrompt(), planPrompt(), document(), featureRoot(), DiscoverySchema, identity, manifestFromPlan(), ManifestSchema (+10 more)

### Community 51 - "coordination.ts"
Cohesion: 0.16
Nodes (19): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), legacy, validateNativeContinuation(), checkpointWindow() (+11 more)

### Community 52 - "coordination-tick.ts"
Cohesion: 0.25
Nodes (11): PrerequisitesSchema, reconcileCompletedCheckpoints(), reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION, tick(), incompleteReadOutput() (+3 more)

### Community 53 - "outbox.ts"
Cohesion: 0.21
Nodes (14): conversationResolved(), projectOutbox(), syncOutbox(), knowledgeOutbox(), checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), repeatedVendorReviewBlock() (+6 more)

### Community 54 - "retrospective-subject.ts"
Cohesion: 0.20
Nodes (14): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+6 more)

### Community 55 - "assignment-poll.ts"
Cohesion: 0.27
Nodes (10): mergeText(), noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), admitReadyCards(), WAIT_STATUSES, pinCourier, resumeParked() (+2 more)

### Community 56 - "remove-candidate.ts"
Cohesion: 0.17
Nodes (20): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+12 more)

### Community 57 - "it-specialist.ts"
Cohesion: 0.28
Nodes (11): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), partialLocalCleanupKey(), ITContext, readBackConversations(), publishITReport(), delays (+3 more)

### Community 58 - "preferences-store.ts"
Cohesion: 0.19
Nodes (10): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS (+2 more)

### Community 60 - "run-ci-repair.ts"
Cohesion: 0.29
Nodes (10): ciCheckout(), verifyCIHooks(), CIFailure, prepareCIMetadataRepair(), publishCIRepair(), rewordCommits(), CIPlanSchema, runCIRepair() (+2 more)

### Community 61 - "knowledge.ts"
Cohesion: 0.13
Nodes (20): Kind, Stage, seedProjectLessons(), SEEDS, KnowledgeRetry, KnowledgeState, Lesson, LESSON_KINDS (+12 more)

### Community 62 - "publish-pr.ts"
Cohesion: 0.17
Nodes (18): activeEffectId(), harnessEffect, readBackOrThrow(), retryRead(), park(), developerPRContent(), Execute, lintPRContent() (+10 more)

### Community 63 - "weekly-rollup.ts"
Cohesion: 0.23
Nodes (15): RollupResult, RollupResultSchema, harperFolder(), retryDelay(), ineffectiveLessons(), lastFriday(), ROLLUP_HISTORY, rollupDue() (+7 more)

### Community 64 - "fact-bounds.ts"
Cohesion: 0.30
Nodes (13): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+5 more)

### Community 65 - "discovery-recovery.ts"
Cohesion: 0.29
Nodes (10): Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership, rawHash() (+2 more)

### Community 66 - "recovery-ledger.ts"
Cohesion: 0.22
Nodes (11): savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), diagnosticContext(), diagnosticSnapshot(), nativeDeliveryResolved(), reconcileRecoveryLedger() (+3 more)

### Community 67 - "DailyCTO.tsx"
Cohesion: 0.26
Nodes (8): CTOReview(), goalState, DailyCTO(), GoalHistory(), reportDate(), reviewStatus, reviewExcerpt(), ReviewText()

### Community 68 - "daily-cto.ts"
Cohesion: 0.13
Nodes (18): EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), dailyReviewDate(), reviewWeekday(), applyGoalReview(), DailyResultSchema, EvidenceRefSchema (+10 more)

### Community 69 - "useOfficePreferences.ts"
Cohesion: 0.26
Nodes (10): acceptPreferences(), PreferenceCandidate, strip(), UNKNOWN_PREFERENCES, OfficePreferencesController, PreferenceFeedback, PreferenceField, requestPreferences() (+2 more)

### Community 70 - "retrospective-facts.ts"
Cohesion: 0.17
Nodes (15): Accepted, RETROSPECTIVE_HISTORY, ARTIFACT_LIMIT, clip(), LEDGER_STEPS, MAINTENANCE_LIMIT, maintenanceFacts(), MaintenancePacketSection (+7 more)

### Community 71 - "checkpoint-completion.ts"
Cohesion: 0.23
Nodes (8): BrainStatusSchema, identity, parseBrainStatus(), brainCheckpointCompletion(), coverageSchema, followupSchema, verified, DailyCheckpoint

### Community 72 - "cli.ts"
Cohesion: 0.25
Nodes (6): args, [cmd,...rawArgs], commands, key, projectIndex, PORT

### Community 73 - "office-lessons.ts"
Cohesion: 0.50
Nodes (6): normalizeStatement(), decideOfficeProposal(), now(), OfficeKnowledgeStore, proposeOfficeLessons(), retireOfficeLesson()

### Community 74 - "knowledge-context.ts"
Cohesion: 0.24
Nodes (10): Bucket, knowledgeContext(), LESSON_LIMIT, lessonPurpose(), MAINTENANCE, MAX_LESSONS, PURPOSES, render() (+2 more)

### Community 75 - "liveReach"
Cohesion: 0.60
Nodes (5): GIT_NETWORK, LIVE_PROVIDERS, liveReach(), networkUrl(), remoteUrls()

### Community 77 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 78 - "session-bridge.ts"
Cohesion: 0.33
Nodes (8): claudeSessions(), codexSessions(), desktopSessions(), guardianReview(), LiveSession, loadedCodexSession(), openRollouts(), SessionInventory

### Community 81 - "maintenance-triggers.ts"
Cohesion: 0.36
Nodes (9): clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates(), maintenanceCompletedId(), maintenanceKey(), visibleMaintenanceTriggerIds(), TerminalCandidate (+1 more)

## Knowledge Gaps
- **285 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+280 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `source-amendment.ts`, `worker-runtime.ts`, `published-draft-conflict.ts`, `conversations/conversations.ts`, `saved-prerequisite-handoff.ts`, `cec/workflow.ts`, `digest`, `approval.ts`, `.emit`, `azure.ts`, `deliveryInputSha256`, `activation-recovery.ts`, `Inspector.tsx`, `artifact`, `control-store.ts`, `jira-publication.ts`, `agents.ts`, `features.ts`, `.transaction`, `maintenance.ts`, `run-retrospective.ts`, `scheduler.ts`, `github-delivery.ts`, `requests.ts`, `.getEffect`, `.save`, `dependency-bots/adopt.ts`, `github-publication.ts`, `accept-stage-result.ts`, `jira-time.ts`, `tracking-issue.ts`, `dependencies.ts`, `scheduled-work.ts`, `retrospective-triggers.ts`, `store.ts`, `create-candidate.ts`, `features/workflow.ts`, `coordination.ts`, `coordination-tick.ts`, `retrospective-subject.ts`, `remove-candidate.ts`, `it-specialist.ts`, `Offices`, `publish-pr.ts`, `weekly-rollup.ts`, `discovery-recovery.ts`, `recovery-ledger.ts`, `daily-cto.ts`, `retrospective-facts.ts`, `checkpoint-completion.ts`, `office-lessons.ts`, `knowledge-context.ts`, `session-bridge.ts`?**
  _High betweenness centrality (0.120) - this node is a cross-community bridge._
- **Why does `GitHubDelivery` connect `github-delivery.ts` to `source-amendment.ts`, `published-draft-conflict.ts`, `saved-prerequisite-handoff.ts`, `cec/workflow.ts`, `digest`, `deliveryInputSha256`, `activation-recovery.ts`, `artifact`, `Store`, `validate-stage.ts`, `requests.ts`, `Coordinator`, `accept-stage-result.ts`, `dependencies.ts`, `assignment-poll.ts`, `remove-candidate.ts`, `run-ci-repair.ts`, `publish-pr.ts`, `discovery-recovery.ts`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `Role` connect `worker-runtime.ts` to `OfficeScene.tsx`, `shared.ts`, `App.tsx`, `index.tsx`, `conversations/conversations.ts`, `cec/workflow.ts`, `.emit`, `PeoplePanel.tsx`, `Inspector.tsx`, `Store`, `agents.ts`, `validate-stage.ts`, `maintenance.ts`, `scheduler.ts`, `github-delivery.ts`, `accept-stage-result.ts`, `store.ts`, `outbox.ts`, `retrospective-subject.ts`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `command()` (e.g. with `.constructor()` and `executeRequest()`) actually correct?**
  _`command()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _285 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `source-amendment.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.059018367961457395 - nodes in this community are weakly interconnected._
- **Should `OfficeScene.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._