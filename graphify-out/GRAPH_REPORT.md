# Graph Report - persona-role-names  (2026-11-06)

## Corpus Check
- 403 files · ~199,958 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2394 nodes · 10195 edges · 82 communities (81 shown, 1 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 51 edges (avg confidence: 0.74)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c8a969c9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- github-delivery.ts
- GitHubDelivery
- .emit
- source-amendment.ts
- artifact
- post-conflict-preparation.ts
- OfficeScene.tsx
- features.ts
- shared.ts
- Inspector.tsx
- workKey
- digest
- Store
- Role
- App.tsx
- index.ts
- offices.ts
- run-retrospective.ts
- conversations/slack.ts
- agents.ts
- retrospective-triggers.ts
- scheduler.ts
- LessonsPanel.tsx
- github-publication.ts
- store.ts
- scope-repair-resume.ts
- Ticket
- .transaction
- maintenance.ts
- sanitize
- notifications.ts
- conversations/conversations.ts
- TimeBook.tsx
- http/commands.ts
- Coordinator
- MaintenanceRun
- remove-candidate.ts
- publish-pr.ts
- dependency-bots/adopt.ts
- it-specialist.ts
- jira-publication.ts
- tracking-issue.ts
- validate-stage.ts
- dependencies.ts
- projects.ts
- FeatureWorkspace.tsx
- Engine
- engine.ts
- coordination.ts
- delivery-repairs.ts
- run-ci-repair.ts
- service-health.ts
- retrospective-subject.ts
- knowledge.ts
- coordination-tick.ts
- prompts/conversations.ts
- weekly-rollup.ts
- fact-bounds.ts
- preferences-store.ts
- Goals.tsx
- delivery-task.ts
- goal-reporting.ts
- cec/workflow.ts
- closeout.ts
- goal-reviews.ts
- scheduled-work.ts
- config.ts
- session-bridge.ts
- handsOff
- discovery-recovery.ts
- delivery-binding.ts
- knowledge-context.ts
- useOfficePreferences.ts
- approach.ts
- github.ts
- command-registry.ts
- cli.ts
- merge-summary.ts
- needsDecision
- dependency-edges.ts
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
- `DeliverySlot` --references--> `Role`  [EXTRACTED]
  server/office/projects.ts → src/shared.ts
- `projectOutbox()` --calls--> `deferredPickup()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/pickup-state.ts
- `cecChatPrompt()` --calls--> `timeReport()`  [EXTRACTED]
  server/conversations/prompts/conversations.ts → src/timing/timing.ts
- `pump()` --calls--> `deferredPickup()`  [EXTRACTED]
  server/conversations/team-conversation-pump.ts → src/work/pickup-state.ts
- `IntakeContext` --references--> `Coordination`  [EXTRACTED]
  server/delivery/intake/admission.ts → src/shared.ts

## Import Cycles
- 3-file cycle: `server/conversations/conversations.ts -> server/conversations/slack.ts -> server/workers/agents.ts -> server/conversations/conversations.ts`
- 3-file cycle: `server/conversations/conversation-recovery.ts -> server/conversations/conversations.ts -> server/conversations/team-conversation-pump.ts -> server/conversations/conversation-recovery.ts`
- 3-file cycle: `server/conversations/conversations.ts -> server/scheduling/engine.ts -> server/workers/agents.ts -> server/conversations/conversations.ts`
- 3-file cycle: `server/scheduling/coordination-tick.ts -> server/scheduling/requests.ts -> server/scheduling/coordination.ts -> server/scheduling/coordination-tick.ts`
- 3-file cycle: `server/scheduling/coordination-pump.ts -> server/scheduling/requests.ts -> server/scheduling/coordination.ts -> server/scheduling/coordination-pump.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/stage-prompts.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/preparation/post-conflict-preparation.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/queue-repairs.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/scope-repair/scope-repair-resume.ts -> server/delivery/recovery/validation/validation-provider-context.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/implementation/activation-recovery.ts -> server/delivery/recovery/validation/validation-provider-context.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/implementation/continuation-guard.ts -> server/delivery/recovery/validation/validation-provider-context.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/implementation/saved-prerequisite-handoff.ts -> server/delivery/recovery/validation/validation-provider-context.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/preparation/post-conflict-preparation.ts -> server/delivery/recovery/validation/validation-provider-context.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/queue-repairs.ts -> server/delivery/repairs/ci-admission.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/queue-repairs.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/recovery/retire-external-delivery.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`

## Communities (82 total, 1 thin omitted)

### Community 0 - "github-delivery.ts"
Cohesion: 0.07
Nodes (58): containedFile(), findingsBlock(), harnessDelivers(), BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction(), dependabotReviewGuidance() (+50 more)

### Community 1 - "GitHubDelivery"
Cohesion: 0.10
Nodes (25): GitHubDelivery, bindPreparationBoardOrigins(), claimSchema, eventSchema, PreparationBoardOrigin, readPreparationBoardOrigins(), timestamp, updateSchema (+17 more)

### Community 2 - ".emit"
Cohesion: 0.07
Nodes (53): file, folder, logs, root, xml(), unpack(), BLOCKED, Execute (+45 more)

### Community 3 - "source-amendment.ts"
Cohesion: 0.07
Nodes (66): adoptCandidate(), reported, Scope, approvedText(), assert(), amendmentInstruction(), amendmentIssueSha256(), authorizeSourceAmendment() (+58 more)

### Community 4 - "artifact"
Cohesion: 0.11
Nodes (58): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+50 more)

### Community 5 - "post-conflict-preparation.ts"
Cohesion: 0.13
Nodes (39): candidateInput(), children, oldAdoptionBasis(), savedCandidateAdmission, assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence() (+31 more)

### Community 6 - "OfficeScene.tsx"
Cohesion: 0.07
Nodes (48): Avatar(), AzureWall(), Chair(), Coworker(), CTORoom(), Desk(), Floor, Furnishings (+40 more)

### Community 7 - "features.ts"
Cohesion: 0.11
Nodes (39): approveFeature(), assertRetainedItems(), commandFeature(), createFeature(), featureById(), mutation(), discoveryPrompt(), planPrompt() (+31 more)

### Community 8 - "shared.ts"
Cohesion: 0.07
Nodes (37): ProjectReadiness, DailyCTOSummary, ConfirmedSegment, LiveAnchor, ObservationGap, SnapshotOrdering, TimeLedgerState, Continuation (+29 more)

### Community 9 - "Inspector.tsx"
Cohesion: 0.06
Nodes (77): Conversation(), Outbox(), recommendedReply(), ServiceHealthPanel(), labels, ServiceHealthRow(), EvidenceCard(), PORTRAIT (+69 more)

### Community 10 - "workKey"
Cohesion: 0.08
Nodes (51): recordJobApproach(), advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat(), continuationScope(), brainImplementationCandidate() (+43 more)

### Community 11 - "digest"
Cohesion: 0.13
Nodes (44): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+36 more)

### Community 12 - "Store"
Cohesion: 0.09
Nodes (14): JiraOperations, plain(), Result, Assessment, Store, GIT_NETWORK, LIVE_PROVIDERS, liveReach() (+6 more)

### Community 13 - "Role"
Cohesion: 0.11
Nodes (37): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+29 more)

### Community 14 - "App.tsx"
Cohesion: 0.06
Nodes (52): conversationResolved(), projectOutbox(), compactSteps(), knowledgeOutbox(), checkpointSuperseded(), themeColor, App(), CONNECTION (+44 more)

### Community 15 - "index.ts"
Cohesion: 0.10
Nodes (33): close(), config, itSpecialist, loadedRevision, offices, releaseLock, server, serviceHealth (+25 more)

### Community 16 - "offices.ts"
Cohesion: 0.11
Nodes (19): DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), dailyReviewDate(), reviewWeekday(), DailyResultSchema, Briefing (+11 more)

### Community 17 - "run-retrospective.ts"
Cohesion: 0.10
Nodes (33): Accepted, acceptRetrospective(), normalizeStatement(), RETROSPECTIVE_HISTORY, ARTIFACT_LIMIT, clip(), LEDGER_STEPS, MAINTENANCE_LIMIT (+25 more)

### Community 18 - "conversations/slack.ts"
Cohesion: 0.12
Nodes (19): GitHubOperations, fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), goalNoticeAuthorized(), goalNoticeNeverDispatched(), sendGoalNotice(), closeNativeRefresh() (+11 more)

### Community 19 - "agents.ts"
Cohesion: 0.10
Nodes (26): SlackResultSchema, SlackVerificationSchema, HANDS_OFF_RESOLUTION_GUIDANCE, RESOLUTION_GUIDANCE, GOAL_REPORT_GUIDANCE, labels, toolActivity(), workerActivity() (+18 more)

### Community 20 - "retrospective-triggers.ts"
Cohesion: 0.11
Nodes (33): clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates(), maintenanceCompletedId(), maintenanceKey(), visibleMaintenanceTriggerIds(), clip() (+25 more)

### Community 21 - "scheduler.ts"
Cohesion: 0.10
Nodes (23): ROLES, officeCapacity, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch() (+15 more)

### Community 22 - "LessonsPanel.tsx"
Cohesion: 0.17
Nodes (24): LessonsPanel(), when(), SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS (+16 more)

### Community 23 - "github-publication.ts"
Cohesion: 0.17
Nodes (13): Assign, Board, Content, GitHubFeaturePublisher, number(), same(), FeaturePublisher, publishFeature() (+5 more)

### Community 24 - "store.ts"
Cohesion: 0.11
Nodes (14): Clock, applyConnectionSettings(), closeConnection(), optimizeOnOpen(), statementCache(), initialSnapshot(), initializeStoreSchema(), checkpointMeasurement() (+6 more)

### Community 25 - "scope-repair-resume.ts"
Cohesion: 0.16
Nodes (28): Assessment, outsideScanSources(), Ownership, reconcileScopeRepairReadback(), requireThat(), scopeRepairReadbackCandidate(), scopeRepairRequestResolved(), sha (+20 more)

### Community 26 - "Ticket"
Cohesion: 0.13
Nodes (13): cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), slackSendPrompt(), slackVerifyPrompt(), comparableSlackText(), SlackMessages (+5 more)

### Community 27 - ".transaction"
Cohesion: 0.15
Nodes (16): reviewQuestions(), featureItemComplete(), reconcileFeatureCompletion(), document(), featureRoot(), helperTelemetry(), recoverFeatures(), EvidenceSchema (+8 more)

### Community 28 - "maintenance.ts"
Cohesion: 0.10
Nodes (27): maintenancePolicies(), BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice(), candidateOwner(), SETTLED, skipOwnedCandidate() (+19 more)

### Community 29 - "sanitize"
Cohesion: 0.15
Nodes (22): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+14 more)

### Community 30 - "notifications.ts"
Cohesion: 0.14
Nodes (20): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), configureNotices(), Identity, MergeNotifications (+12 more)

### Community 31 - "conversations/conversations.ts"
Cohesion: 0.13
Nodes (14): ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff(), saveGoals() (+6 more)

### Community 32 - "TimeBook.tsx"
Cohesion: 0.15
Nodes (23): displayAgentTask(), LiveAgentTask(), Props, RunningTask(), text(), AzureBuild, ROLE_NAMES, lastWall (+15 more)

### Community 33 - "http/commands.ts"
Cohesion: 0.17
Nodes (19): retryRecipientLookup(), configureKnowledge(), declineLessonIssue(), reactivateLesson(), retireLesson(), decideOfficeProposal(), mirrorOfficeKnowledge(), now() (+11 more)

### Community 34 - "Coordinator"
Cohesion: 0.08
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 35 - "MaintenanceRun"
Cohesion: 0.14
Nodes (18): BrainStatusSchema, identity, parseBrainStatus(), brainCheckpointCompletion(), coverageSchema, followupSchema, verified, reconcileCompletedCheckpoints() (+10 more)

### Community 36 - "remove-candidate.ts"
Cohesion: 0.19
Nodes (17): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+9 more)

### Community 37 - "publish-pr.ts"
Cohesion: 0.16
Nodes (19): activeEffectId(), harnessEffect, readBackOrThrow(), retryRead(), park(), developerPRContent(), Execute, officePRContent() (+11 more)

### Community 38 - "dependency-bots/adopt.ts"
Cohesion: 0.25
Nodes (19): Execute, adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR, openDependabotPulls() (+11 more)

### Community 39 - "it-specialist.ts"
Cohesion: 0.18
Nodes (16): partialLocalCleanupKey(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), ITContext, diagnosticSnapshot(), publishITReport() (+8 more)

### Community 40 - "jira-publication.ts"
Cohesion: 0.25
Nodes (8): Assignment, Content, JiraFeaturePublisher, jiraText(), keyOf(), plainDescription(), Transition, PublicationReceipt

### Community 41 - "tracking-issue.ts"
Cohesion: 0.24
Nodes (19): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), ProjectCard, projectCards(), projectGraphql() (+11 more)

### Community 42 - "validate-stage.ts"
Cohesion: 0.16
Nodes (17): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+9 more)

### Community 43 - "dependencies.ts"
Cohesion: 0.23
Nodes (16): Admission, admit(), IntakeContext, compatible(), dependencyCompletionKey(), dependencyEligibility(), DependencyStores, issueKey() (+8 more)

### Community 44 - "projects.ts"
Cohesion: 0.14
Nodes (9): DATA, LOCAL_BINDINGS, file, project, root, DeliverySlot, projectById(), projectData() (+1 more)

### Community 45 - "FeatureWorkspace.tsx"
Cohesion: 0.18
Nodes (15): FeatureRound, FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures(), draftKey() (+7 more)

### Community 46 - "Engine"
Cohesion: 0.11
Nodes (5): correlatedBuild(), Engine, observe(), observeParked(), parkedReadError

### Community 47 - "engine.ts"
Cohesion: 0.21
Nodes (16): checkMail(), drainMail(), requestMail(), dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), resume() (+8 more)

### Community 48 - "coordination.ts"
Cohesion: 0.18
Nodes (18): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation(), checkpointWindow(), dueAt() (+10 more)

### Community 49 - "delivery-repairs.ts"
Cohesion: 0.26
Nodes (17): run(), qaEvidenceGap(), namedRepairIds(), approachFingerprint(), enqueueRepairDiagnosis(), githubRepairEligible(), jiraRepairable(), REPAIR_DIAGNOSIS (+9 more)

### Community 50 - "run-ci-repair.ts"
Cohesion: 0.27
Nodes (13): lintPRContent(), ciCheckout(), verifyCIHooks(), CIFailure, guardCIRepair(), prepareCIMetadataRepair(), publishCIRepair(), rewordCommits() (+5 more)

### Community 51 - "service-health.ts"
Cohesion: 0.18
Nodes (9): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, slackHealth() (+1 more)

### Community 52 - "retrospective-subject.ts"
Cohesion: 0.19
Nodes (15): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+7 more)

### Community 53 - "knowledge.ts"
Cohesion: 0.16
Nodes (16): SEEDS, KnowledgeRetry, KnowledgeState, Lesson, LESSON_KINDS, LessonKind, LessonRecurrence, OfficeProposal (+8 more)

### Community 54 - "coordination-tick.ts"
Cohesion: 0.18
Nodes (14): reconcileNoticeConfirmations(), PrerequisitesSchema, legacy, reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION, tick() (+6 more)

### Community 55 - "prompts/conversations.ts"
Cohesion: 0.21
Nodes (13): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), cecChatPrompt(), ctoChatPrompt(), itChatPrompt(), canFileGithubIssue(), githubFollowupPrompt() (+5 more)

### Community 56 - "weekly-rollup.ts"
Cohesion: 0.21
Nodes (16): RollupResult, RollupResultSchema, harperFolder(), RETROSPECTIVE_TIMEOUT, retryDelay(), ineffectiveLessons(), lastFriday(), ROLLUP_HISTORY (+8 more)

### Community 57 - "fact-bounds.ts"
Cohesion: 0.26
Nodes (15): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+7 more)

### Community 58 - "preferences-store.ts"
Cohesion: 0.18
Nodes (11): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, SettingsPanel() (+3 more)

### Community 59 - "Goals.tsx"
Cohesion: 0.14
Nodes (17): SendMessage, CTOReview(), goalState, DailyCTO(), GoalHistory(), reportDate(), reviewStatus, GoalList() (+9 more)

### Community 60 - "delivery-task.ts"
Cohesion: 0.21
Nodes (11): cecPrompt(), resolvedDecisionNote(), stageInstructions, APPROACH_GUIDANCE, reviewInstructions(), deliveryTask(), DeliveryTaskInput, DISCOVERY_GUIDANCE (+3 more)

### Community 61 - "goal-reporting.ts"
Cohesion: 0.27
Nodes (11): assertConversationReadback(), pump(), PickupSchema, savePickup(), acceptedGoalReport(), GoalReport, GoalReportSchema, permitsGoalEvidenceReturn() (+3 more)

### Community 62 - "cec/workflow.ts"
Cohesion: 0.28
Nodes (10): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), advance(), nextStage(), publicationEvidenceGap(), resultGate(), stageResultGap() (+2 more)

### Community 63 - "closeout.ts"
Cohesion: 0.38
Nodes (9): harnessCloseout(), PASSING, verifyMergeActions(), runHarnessStage(), harnessStageResult(), receipt(), harnessDraft(), harnessPrepare() (+1 more)

### Community 64 - "goal-reviews.ts"
Cohesion: 0.18
Nodes (12): applyGoalReview(), EvidenceRefSchema, FreshDailyResultSchema, statusAllowed(), workEvidence(), DailyCTOBriefing, DailyCTOResult, DailyGoalUpdate (+4 more)

### Community 65 - "scheduled-work.ts"
Cohesion: 0.28
Nodes (12): deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), deterministicActions, eligible() (+4 more)

### Community 66 - "config.ts"
Cohesion: 0.19
Nodes (21): checksFailed(), checksPassed(), checksPending(), CurrentChecksWait, currentMergeChecks(), pass(), pending(), requireThat() (+13 more)

### Community 67 - "session-bridge.ts"
Cohesion: 0.23
Nodes (9): claudeSessions(), codexSessions(), desktopSessions(), guardianReview(), LiveSession, loadedCodexSession(), openRollouts(), SessionBridge (+1 more)

### Community 68 - "handsOff"
Cohesion: 0.27
Nodes (8): HANDS_OFF_PROJECTS, handsOff(), legacyRecovery(), discover(), refreshDependencies(), routeExisting(), openPullInventory(), supersedablePriorRuns()

### Community 69 - "discovery-recovery.ts"
Cohesion: 0.29
Nodes (10): Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership, rawHash() (+2 more)

### Community 70 - "delivery-binding.ts"
Cohesion: 0.38
Nodes (8): featureEffectGate(), bindFeature(), currentApproval(), enrolled(), featureGate(), predecessorComplete(), scheduledFeatures(), FeatureBinding

### Community 71 - "knowledge-context.ts"
Cohesion: 0.21
Nodes (11): Bucket, knowledgeContext(), LESSON_LIMIT, lessonPurpose(), MAINTENANCE, MAX_LESSONS, PURPOSES, render() (+3 more)

### Community 72 - "useOfficePreferences.ts"
Cohesion: 0.26
Nodes (10): acceptPreferences(), PreferenceCandidate, strip(), UNKNOWN_PREFERENCES, OfficePreferencesController, PreferenceFeedback, PreferenceField, requestPreferences() (+2 more)

### Community 73 - "approach.ts"
Cohesion: 0.44
Nodes (10): afterDraft(), ApproachSchema, firstBuildStage(), missingApproachStage(), plannedNext(), recordApproach(), reroute(), stageNeeded() (+2 more)

### Community 74 - "github.ts"
Cohesion: 0.29
Nodes (6): GitHubMonitor, githubPRDescription(), GOAL_EVIDENCE_LIMITS, GitHubBoard, GitHubPR, GitHubState

### Community 76 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 77 - "cli.ts"
Cohesion: 0.25
Nodes (6): args, [cmd,...rawArgs], commands, key, projectIndex, PORT

### Community 78 - "merge-summary.ts"
Cohesion: 0.43
Nodes (6): clamp(), LIMITS, MergedPR, plainSlackText(), section(), shippedSummary()

### Community 79 - "needsDecision"
Cohesion: 0.70
Nodes (3): parksInJira(), DECISION_KINDS, needsDecision()

### Community 81 - "dependency-edges.ts"
Cohesion: 1.00
Nodes (3): assertFeatureDependencyOrder(), featureDependencyEdges(), key()

## Knowledge Gaps
- **286 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+281 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `github-delivery.ts`, `GitHubDelivery`, `.emit`, `source-amendment.ts`, `artifact`, `post-conflict-preparation.ts`, `features.ts`, `shared.ts`, `workKey`, `digest`, `offices.ts`, `run-retrospective.ts`, `conversations/slack.ts`, `agents.ts`, `retrospective-triggers.ts`, `scheduler.ts`, `github-publication.ts`, `store.ts`, `scope-repair-resume.ts`, `Ticket`, `.transaction`, `maintenance.ts`, `sanitize`, `notifications.ts`, `conversations/conversations.ts`, `http/commands.ts`, `MaintenanceRun`, `remove-candidate.ts`, `publish-pr.ts`, `dependency-bots/adopt.ts`, `it-specialist.ts`, `jira-publication.ts`, `tracking-issue.ts`, `validate-stage.ts`, `dependencies.ts`, `projects.ts`, `engine.ts`, `coordination.ts`, `delivery-repairs.ts`, `retrospective-subject.ts`, `coordination-tick.ts`, `prompts/conversations.ts`, `weekly-rollup.ts`, `delivery-task.ts`, `goal-reporting.ts`, `goal-reviews.ts`, `scheduled-work.ts`, `session-bridge.ts`, `handsOff`, `discovery-recovery.ts`, `delivery-binding.ts`, `knowledge-context.ts`, `github.ts`, `dependency-edges.ts`?**
  _High betweenness centrality (0.112) - this node is a cross-community bridge._
- **Why does `Engine` connect `Engine` to `github-delivery.ts`, `GitHubDelivery`, `scheduled-work.ts`, `features.ts`, `github.ts`, `Store`, `engine.ts`, `coordination.ts`, `delivery-repairs.ts`, `offices.ts`, `Ticket`, `maintenance.ts`, `sanitize`, `notifications.ts`, `conversations/conversations.ts`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `command()` connect `Store` to `github-delivery.ts`, `GitHubDelivery`, `.emit`, `features.ts`, `workKey`, `digest`, `conversations/slack.ts`, `agents.ts`, `github-publication.ts`, `.transaction`, `maintenance.ts`, `sanitize`, `notifications.ts`, `remove-candidate.ts`, `publish-pr.ts`, `jira-publication.ts`, `tracking-issue.ts`, `validate-stage.ts`, `dependencies.ts`, `Engine`, `engine.ts`, `coordination.ts`, `delivery-repairs.ts`, `run-ci-repair.ts`, `service-health.ts`, `session-bridge.ts`, `github.ts`, `command-registry.ts`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `command()` (e.g. with `.constructor()` and `executeRequest()`) actually correct?**
  _`command()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _286 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `github-delivery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06635318704284221 - nodes in this community are weakly interconnected._
- **Should `GitHubDelivery` be split into smaller, more focused modules?**
  _Cohesion score 0.09745293466223699 - nodes in this community are weakly interconnected._