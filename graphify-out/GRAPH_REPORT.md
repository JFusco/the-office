# Graph Report - the-office  (2026-11-09)

## Corpus Check
- 658 files · ~274,291 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3410 nodes · 15055 edges · 108 communities (106 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 92 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `24292f7e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- github-delivery.ts
- Inspector.tsx
- .transaction
- OfficeScene.tsx
- saved-prerequisite-handoff.ts
- App.tsx
- knowledge/routes.ts
- source-amendment.ts
- agents.ts
- artifact
- TicketJob
- digest
- index.tsx
- worker-runtime.ts
- requests.ts
- conversations/conversations.ts
- run-retrospective.ts
- store.ts
- TimeBook.tsx
- Store
- slack-intake/run.ts
- record-trigger.ts
- maintenance.ts
- dependency-bots/adopt.ts
- offices.ts
- easternDay
- OrgChart.tsx
- cec/workflow.ts
- SettingsPanel.tsx
- command
- cec/issue-publication.ts
- knowledge.ts
- task-briefing.ts
- SourceRegistry
- scope-repair-resume.ts
- engine.ts
- digest
- schedule.ts
- IntakeLedger
- shared.ts
- sourceVisible
- cost-ledger.ts
- Role
- telemetry.ts
- .save
- run-accounting.ts
- .emit
- tracking-issue.ts
- slack-intake/report.ts
- time-scope.ts
- OfficeSnapshot
- .getEffect
- outbox.ts
- scheduled-work.ts
- investigations/ledger.ts
- closeout.ts
- investigations/run.ts
- Coordinator
- it-specialist.ts
- process.ts
- remove-candidate.ts
- dependencies.ts
- coordination.ts
- jira-time.ts
- discovery-recovery.ts
- retrospective-subject.ts
- claude-session-context.ts
- azure.ts
- GitHubIssuePublisher
- lesson-selection.ts
- telemetry/report.ts
- workKey
- service-health.ts
- coordination-tick.ts
- admit-improvement.ts
- api-routes.ts
- outbound.ts
- knowledge/learning-events.ts
- json
- publish-pr.ts
- owned-artifact.ts
- fact-bounds.ts
- project-progress.ts
- index.ts
- weekly-research.ts
- goal-reviews.ts
- session-bridge.ts
- assignment-poll.ts
- harnessEffect
- http/context.ts
- blocker-followups.ts
- goal-evidence.ts
- goal-reporting.ts
- DailyCTO.tsx
- create-candidate.ts
- command-registry.ts
- codex-rollout.ts
- windows.ts
- cli.ts
- OfficeConfigView.tsx
- extract-worker.mjs
- BrainFollowup
- static-files.ts
- SlackIntakeStatus.tsx
- highestStableAtLeast
- slack-supersession.ts
- helper-evidence.py

## God Nodes (most connected - your core abstractions)
1. `Store` - 313 edges
2. `TicketJob` - 129 edges
3. `GitHubDelivery` - 119 edges
4. `command()` - 102 edges
5. `artifact()` - 87 edges
6. `digest()` - 84 edges
7. `cx()` - 84 edges
8. `workKey()` - 79 edges
9. `OfficeSnapshot` - 70 edges
10. `digest()` - 66 edges

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
- 3-file cycle: `server/conversations/notifications.ts -> server/conversations/slack.ts -> server/knowledge/digests/outbound.ts -> server/conversations/notifications.ts`
- 3-file cycle: `server/conversations/notifications.ts -> server/knowledge/digests/send-notice.ts -> server/knowledge/digests/outbound.ts -> server/conversations/notifications.ts`
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
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/recovery/retire-external-delivery.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/conversations/conversations.ts -> server/scheduling/engine.ts -> server/workers/agents.ts -> server/conversations/conversations.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/stage-prompts.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-checkout.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-evidence.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-preparation.ts -> server/delivery/pipeline/github-delivery.ts`

## Communities (108 total, 2 thin omitted)

### Community 0 - "github-delivery.ts"
Cohesion: 0.06
Nodes (84): containedFile(), findingsBlock(), assertMayMutate(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery(), BOARD_RULE (+76 more)

### Community 1 - "Inspector.tsx"
Cohesion: 0.06
Nodes (76): Conversation(), Outbox(), SendMessage, SlackDeliveryCard(), itDiagnostics(), ServiceHealthPanel(), labels, ServiceHealthRow() (+68 more)

### Community 2 - ".transaction"
Cohesion: 0.08
Nodes (55): approveFeature(), assertRetainedItems(), commandFeature(), createFeature(), featureById(), mutation(), reviewQuestions(), assertFeatureDependencyOrder() (+47 more)

### Community 3 - "OfficeScene.tsx"
Cohesion: 0.05
Nodes (64): itAgent(), Constellation(), sectors, focusPosition(), stableHash(), stablePosition(), displayAgentTask(), withoutElapsed() (+56 more)

### Community 4 - "saved-prerequisite-handoff.ts"
Cohesion: 0.07
Nodes (59): reported, Scope, advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat(), continuationScope() (+51 more)

### Community 5 - "App.tsx"
Cohesion: 0.05
Nodes (59): compactSteps(), BrainWorkspace(), themeColor, App(), CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants (+51 more)

### Community 6 - "knowledge/routes.ts"
Cohesion: 0.07
Nodes (39): captureAfter(), CaptureMetadata, capturePage(), cursor(), key(), intakeActivity(), knowledgeActivityPage(), assignmentKnowledge() (+31 more)

### Community 7 - "source-amendment.ts"
Cohesion: 0.07
Nodes (63): adoptCandidate(), approvedText(), assert(), amendmentIssueSha256(), authorizeSourceAmendment(), Binding, assert(), normalize() (+55 more)

### Community 8 - "agents.ts"
Cohesion: 0.06
Nodes (41): cecPrompt(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), resolvedDecisionNote(), stageInstructions, ConversationResultSchema (+33 more)

### Community 9 - "artifact"
Cohesion: 0.11
Nodes (55): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+47 more)

### Community 10 - "TicketJob"
Cohesion: 0.09
Nodes (28): removeAdoptedClone(), namedRepairIds(), StageContext, GitHubDelivery, stageRole(), adoptedReviewCandidate(), ciCheckout(), finishCISetup() (+20 more)

### Community 11 - "digest"
Cohesion: 0.09
Nodes (54): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+46 more)

### Community 12 - "index.tsx"
Cohesion: 0.09
Nodes (40): KnowledgeCapturePage, KnowledgeSourceSummary, Activity(), ActivityStatus(), AssignmentKnowledge(), CaptureReviewDetail(), CaptureReviews(), DigestDetail() (+32 more)

### Community 13 - "worker-runtime.ts"
Cohesion: 0.07
Nodes (43): SlackVerificationSchema, candidateWorkspaceEnvironment(), assertDigestDispatch(), assignmentSubject(), prepareExposure(), assertRetainedDispatchScope(), CODEX_DEFAULT_EFFORT, CODEX_DEFAULT_MODEL (+35 more)

### Community 14 - "requests.ts"
Cohesion: 0.10
Nodes (48): assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), reconcileCompletedConflictDraft(), routeReadyPostConflictPublication(), verifyInitialDraftConflictPreparation() (+40 more)

### Community 15 - "conversations/conversations.ts"
Cohesion: 0.09
Nodes (27): assertConversationReadback(), Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff(), saveGoals() (+19 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.09
Nodes (39): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, improvementIntakeGate(), learningDigest(), appendLearningFacts(), baselineLearning(), expireLearningPackets() (+31 more)

### Community 17 - "store.ts"
Cohesion: 0.10
Nodes (25): channelNoticeAuthorized(), notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR, plainSlackText(), section() (+17 more)

### Community 18 - "TimeBook.tsx"
Cohesion: 0.10
Nodes (38): TelemetryReport, LiveAnchor, AzureBuild, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens() (+30 more)

### Community 19 - "Store"
Cohesion: 0.08
Nodes (24): featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), recoverFeatures(), dispatchExposure(), Clock, DATA, applyConnectionSettings() (+16 more)

### Community 20 - "slack-intake/run.ts"
Cohesion: 0.13
Nodes (31): independentIntakeResult(), newTask(), recordObservation(), settlePage(), IntakeResult, IntakeResultValue, LIMITS, Observation (+23 more)

### Community 21 - "record-trigger.ts"
Cohesion: 0.10
Nodes (40): busyMaintenanceIds(), clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates(), maintenanceCompletedId(), maintenanceKey(), visibleMaintenanceTriggerIds() (+32 more)

### Community 22 - "maintenance.ts"
Cohesion: 0.10
Nodes (27): maintenancePolicies(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice(), candidateOwner(), SETTLED (+19 more)

### Community 23 - "dependency-bots/adopt.ts"
Cohesion: 0.12
Nodes (33): readBackOrThrow(), adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR, openDependabotPulls() (+25 more)

### Community 24 - "offices.ts"
Cohesion: 0.10
Nodes (24): normalizeStatement(), leadershipContext(), leadershipEntries(), decideOfficeProposal(), mirrorOfficeKnowledge(), now(), OfficeKnowledgeStore, proposeOfficeLessons() (+16 more)

### Community 25 - "easternDay"
Cohesion: 0.11
Nodes (18): DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), dailyReviewDate(), reviewWeekday(), DailyResultSchema, Briefing (+10 more)

### Community 26 - "OrgChart.tsx"
Cohesion: 0.11
Nodes (34): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+26 more)

### Community 27 - "cec/workflow.ts"
Cohesion: 0.13
Nodes (34): parksInJira(), MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), run(), advance(), nextStage(), publicationEvidenceGap() (+26 more)

### Community 28 - "SettingsPanel.tsx"
Cohesion: 0.12
Nodes (29): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS, PickupForm(), acceptPreferences() (+21 more)

### Community 29 - "command"
Cohesion: 0.06
Nodes (12): correlatedBuild(), JiraOperations, GitHubMonitor, Engine, observe(), observeParked(), parkedReadError, command() (+4 more)

### Community 30 - "cec/issue-publication.ts"
Cohesion: 0.14
Nodes (13): Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), plainDescription(), Transition, JiraFeaturePublisher (+5 more)

### Community 31 - "knowledge.ts"
Cohesion: 0.09
Nodes (35): learningMetrics(), lessonsNeedingReview(), Kind, RetrospectiveResult, RollupResult, RollupResultSchema, Stage, harperFolder() (+27 more)

### Community 32 - "task-briefing.ts"
Cohesion: 0.11
Nodes (25): LessonSelection, AssignmentLookups, Binding, lookupInstructions(), decodeLookupJournal(), lookupJournal, readLookupJournal(), officeSearch() (+17 more)

### Community 33 - "SourceRegistry"
Cohesion: 0.12
Nodes (22): effectId(), CaptureReceipt, SlackReadAuthority, collectionPolicy, readAuthority(), Command, sourceCommand(), assertIntakeBinding() (+14 more)

### Community 34 - "scope-repair-resume.ts"
Cohesion: 0.13
Nodes (34): deliveryTask(), stagePrompt(), StagePromptInput, Assessment, outsideScanSources(), Ownership, reconcileScopeRepairReadback(), requireThat() (+26 more)

### Community 35 - "engine.ts"
Cohesion: 0.13
Nodes (28): checkMail(), drainMail(), requestMail(), dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), resume() (+20 more)

### Community 36 - "digest"
Cohesion: 0.14
Nodes (28): comparableSlackText(), AuthoredDigest, reconcileDigestAuthorship(), unitAuthorship(), annotateAuthoredUnits(), outboundBody(), reconcileAuthoredEvidence(), Config (+20 more)

### Community 37 - "schedule.ts"
Cohesion: 0.17
Nodes (19): KnowledgeRunner, captureProposal(), isStoppingFor(), reconcileIntakeStatus(), runSlackLinks(), reconcileIntakeReports(), retrySlackIntake(), scheduledSlackIntake() (+11 more)

### Community 38 - "IntakeLedger"
Cohesion: 0.14
Nodes (18): createExtractor(), extractDocument, Extraction, Extractor, uploadArtifact(), DERIVED, IntakeLedger, LinkResult (+10 more)

### Community 39 - "shared.ts"
Cohesion: 0.09
Nodes (30): ProjectReadiness, DailyCTOSummary, ConfirmedSegment, ObservationGap, SnapshotOrdering, AssignmentResult, CompletionCondition, Continuation (+22 more)

### Community 40 - "sourceVisible"
Cohesion: 0.24
Nodes (22): knowledgeActivity(), eventVisible(), knowledgeSnapshot(), officeKnowledgeSnapshot(), publicReference(), lookupSummaryVisible(), publicLookupSummary(), knowledgeMap() (+14 more)

### Community 41 - "cost-ledger.ts"
Cohesion: 0.16
Nodes (25): EffectUncertainError, captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId() (+17 more)

### Community 42 - "Role"
Cohesion: 0.13
Nodes (17): ROLES, LOCAL_BINDINGS, contextPacket(), DeliverySlot, officeCapacity, fifo(), ScheduledWork, Scheduler (+9 more)

### Community 43 - "telemetry.ts"
Cohesion: 0.10
Nodes (27): CodexRollout, CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL (+19 more)

### Community 44 - ".save"
Cohesion: 0.19
Nodes (26): plain(), unpack(), BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue() (+18 more)

### Community 45 - "run-accounting.ts"
Cohesion: 0.12
Nodes (28): BoundedRead, backfillClaudeCost(), CompletionReader, codexHome(), createdAt(), dayDirs(), header(), readCodexRollout() (+20 more)

### Community 46 - ".emit"
Cohesion: 0.15
Nodes (23): ChannelSettings, configureChannelNotices(), configureNotices(), NoticeSettings, retryRecipientLookup(), failedWorker(), requeueWaitedImplement(), configureDigestDelivery() (+15 more)

### Community 47 - "tracking-issue.ts"
Cohesion: 0.20
Nodes (24): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard, projectCards() (+16 more)

### Community 48 - "slack-intake/report.ts"
Cohesion: 0.16
Nodes (23): privateFile(), ChannelProgress, Proposal, intakeProgress(), terminalDeferred(), unitKey(), verifiedCapture(), LinkRecord (+15 more)

### Community 49 - "time-scope.ts"
Cohesion: 0.17
Nodes (25): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence(), CaptureContext (+17 more)

### Community 50 - "OfficeSnapshot"
Cohesion: 0.13
Nodes (19): FeatureRound, FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures(), draftKey() (+11 more)

### Community 51 - ".getEffect"
Cohesion: 0.17
Nodes (12): GitHubOperations, digestNoticeNeverDispatched(), fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), goalNoticeNeverDispatched(), Assessment, closeNativeRefresh() (+4 more)

### Community 52 - "outbox.ts"
Cohesion: 0.15
Nodes (19): projectOutbox(), syncOutbox(), slackRequestSettled(), knowledgeOutbox(), Result, checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup() (+11 more)

### Community 53 - "scheduled-work.ts"
Cohesion: 0.13
Nodes (23): deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), preparationRequestResolved(), withAmendmentOwnership(), rollupDue(), scheduledRollup(), status() (+15 more)

### Community 54 - "investigations/ledger.ts"
Cohesion: 0.21
Nodes (16): projectSlackDeliveries(), settleRequestedSlackReplacement(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint(), supersedingDelivery(), investigationCandidates() (+8 more)

### Community 55 - "closeout.ts"
Cohesion: 0.18
Nodes (18): harnessCloseout(), PASSING, verifyMergeActions(), HarnessControl, withHarnessWork(), runHarnessStage(), harnessStageResult(), receipt() (+10 more)

### Community 56 - "investigations/run.ts"
Cohesion: 0.18
Nodes (17): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationEvidence(), OFFICE_FIX_PROMPT, OfficeFixResult, validateOfficeFix(), investigationReady(), InvestigationOptions (+9 more)

### Community 57 - "Coordinator"
Cohesion: 0.09
Nodes (4): coordination(), Coordinator, OfficeEntry, AssignedIssue

### Community 58 - "it-specialist.ts"
Cohesion: 0.18
Nodes (16): savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), ITContext, diagnosticContext(), diagnosticSnapshot(), publishITReport() (+8 more)

### Community 59 - "process.ts"
Cohesion: 0.17
Nodes (17): At, Errno, GroupInventory, GroupProbe, LifecycleDiagnostic, Phase, Pid, groupInventory() (+9 more)

### Community 60 - "remove-candidate.ts"
Cohesion: 0.20
Nodes (16): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+8 more)

### Community 61 - "dependencies.ts"
Cohesion: 0.21
Nodes (17): Admission, admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, compatible(), dependencyCompletionKey(), dependencyEligibility() (+9 more)

### Community 62 - "coordination.ts"
Cohesion: 0.16
Nodes (19): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), legacy, validateNativeContinuation(), checkpointWindow() (+11 more)

### Community 63 - "jira-time.ts"
Cohesion: 0.19
Nodes (15): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+7 more)

### Community 64 - "discovery-recovery.ts"
Cohesion: 0.15
Nodes (16): Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership, rawHash() (+8 more)

### Community 65 - "retrospective-subject.ts"
Cohesion: 0.18
Nodes (16): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+8 more)

### Community 66 - "claude-session-context.ts"
Cohesion: 0.23
Nodes (13): readTranscript, root, claudeSessionScope(), readRollout, LiveSession, ContextProject, ContextReader, sessionContextFile() (+5 more)

### Community 67 - "azure.ts"
Cohesion: 0.20
Nodes (14): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+6 more)

### Community 68 - "GitHubIssuePublisher"
Cohesion: 0.28
Nodes (6): Assign, Board, GitHubIssuePublisher, number(), same(), label()

### Community 69 - "lesson-selection.ts"
Cohesion: 0.20
Nodes (16): knowledgeContext(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), MAINTENANCE, MAX_LESSONS (+8 more)

### Community 70 - "telemetry/report.ts"
Cohesion: 0.19
Nodes (17): validTicket(), telemetryRoute(), TelemetryRow, TelemetrySync, Acc, bump(), EASTERN, easternDay() (+9 more)

### Community 71 - "workKey"
Cohesion: 0.23
Nodes (12): completedPRReviews(), eligible(), mergedByOwner(), ownerSettles(), retireExternalDeliveries(), retireInactiveDeliveries(), retireUnstartedDelivery(), unstartedDelivery() (+4 more)

### Community 72 - "service-health.ts"
Cohesion: 0.20
Nodes (9): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, slackHealth() (+1 more)

### Community 73 - "coordination-tick.ts"
Cohesion: 0.21
Nodes (13): reconcileNoticeConfirmations(), PrerequisitesSchema, brainCheckpointCompletion(), reconcileCompletedCheckpoints(), reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION (+5 more)

### Community 74 - "admit-improvement.ts"
Cohesion: 0.27
Nodes (12): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+4 more)

### Community 75 - "api-routes.ts"
Cohesion: 0.28
Nodes (11): retainedArtifactScope(), eventSourceBindings(), exposureBindings(), requestSourceBindings(), knowledgePromptStore(), acceptedSourceBindings(), knowledgeSessionVisibility(), goalHistory() (+3 more)

### Community 76 - "outbound.ts"
Cohesion: 0.26
Nodes (12): independentDigestEvidence(), retainOutboundBody(), digestNoticeRequest(), queueOutboundDigests(), digestKnowledge(), prepareDigestBodies(), retainDigestBody(), knowledgeScopeRevision() (+4 more)

### Community 77 - "knowledge/learning-events.ts"
Cohesion: 0.24
Nodes (12): captureLearning(), recordLearningOpportunity(), captureMaintenanceStep(), citations(), recordAcceptedKnowledge(), stageName(), knowledgeCitation(), lessonCitation() (+4 more)

### Community 78 - "json"
Cohesion: 0.19
Nodes (10): preferencesRoute(), PreferencesRouteContext, json(), fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState (+2 more)

### Community 79 - "publish-pr.ts"
Cohesion: 0.26
Nodes (13): retryRead(), developerPRContent(), Execute, lintPRContent(), officePRContent(), prContent, assertCandidate(), Candidate (+5 more)

### Community 80 - "owned-artifact.ts"
Cohesion: 0.25
Nodes (11): ghLogCacheEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_SOURCE_PATHS, officeSource(), ROOT, done() (+3 more)

### Community 81 - "fact-bounds.ts"
Cohesion: 0.30
Nodes (13): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+5 more)

### Community 82 - "project-progress.ts"
Cohesion: 0.20
Nodes (7): file, folder, logs, root, xml(), ProjectProgress, BoardUpdate

### Community 83 - "index.ts"
Cohesion: 0.18
Nodes (12): close(), config, itSpecialist, loadedRevision, offices, releaseLock, server, serviceHealth (+4 more)

### Community 84 - "weekly-research.ts"
Cohesion: 0.27
Nodes (10): publicTopicSafe(), researchTopics(), TEMPLATES, mirror(), ResearchResult, runWeeklyResearch(), scheduledResearch(), PREVIOUS_RESEARCH_PROFILE_UNAVAILABLE (+2 more)

### Community 85 - "goal-reviews.ts"
Cohesion: 0.18
Nodes (12): applyGoalReview(), EvidenceRefSchema, FreshDailyResultSchema, statusAllowed(), workEvidence(), DailyCTOBriefing, DailyCTOResult, DailyGoalUpdate (+4 more)

### Community 86 - "session-bridge.ts"
Cohesion: 0.22
Nodes (10): claudeSessionContext(), codexSessionContext(), claudeSessions(), codexSessions(), desktopSessions(), guardianReview(), loadedCodexSession(), openRollouts() (+2 more)

### Community 87 - "assignment-poll.ts"
Cohesion: 0.31
Nodes (9): noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), pinCourier, due(), unparkReleasedWaits(), resumeParked(), poll() (+1 more)

### Community 88 - "harnessEffect"
Cohesion: 0.37
Nodes (10): activeEffectId(), harnessEffect, officeMergeProvenance(), reconcileMergeScannerRetry(), Retry, retryMergeScanner(), retryReadBack(), runIdentity() (+2 more)

### Community 89 - "http/context.ts"
Cohesion: 0.26
Nodes (8): ITSpecialist, ServiceContext, OfficeConfigInputs, officeConfigRoute(), officeConfigSummary(), CECBinding, runtimeRevision(), startServiceTicks()

### Community 90 - "blocker-followups.ts"
Cohesion: 0.42
Nodes (9): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), canFileGithubIssue(), readBackConversations(), handoff(), reconcileBlockerFollowups() (+1 more)

### Community 91 - "goal-evidence.ts"
Cohesion: 0.27
Nodes (10): AUTO_ADOPT_BOTS, collectAzureGoalDocuments(), EvidenceStore, GOAL_EVIDENCE_LIMITS, goalEvidencePath(), localBindings, assertModelOverrides(), ModelOverrides (+2 more)

### Community 92 - "goal-reporting.ts"
Cohesion: 0.32
Nodes (10): githubPRDescription(), azureGoalFacts(), azurePRDescription(), boundedEvidence(), GOAL_REPORT_GUIDANCE, goalEvidenceFingerprint(), GoalReport, projectPRFacts() (+2 more)

### Community 93 - "DailyCTO.tsx"
Cohesion: 0.26
Nodes (8): CTOReview(), goalState, DailyCTO(), GoalHistory(), reportDate(), reviewStatus, reviewExcerpt(), ReviewText()

### Community 94 - "create-candidate.ts"
Cohesion: 0.31
Nodes (9): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+1 more)

### Community 95 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 96 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 97 - "windows.ts"
Cohesion: 0.61
Nodes (6): compareTs(), micros(), nowTs(), overlapTs(), timestamp(), refresh()

### Community 98 - "cli.ts"
Cohesion: 0.29
Nodes (5): args, [cmd,...rawArgs], commands, key, projectIndex

### Community 99 - "OfficeConfigView.tsx"
Cohesion: 0.48
Nodes (5): loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView(), OfficeConfigSummary

### Community 100 - "extract-worker.mjs"
Cohesion: 0.70
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 102 - "static-files.ts"
Cohesion: 0.50
Nodes (4): PORT, RequestContext, fileResponse(), staticRoute()

### Community 103 - "SlackIntakeStatus.tsx"
Cohesion: 0.60
Nodes (4): format, labels, SlackIntakeStatus(), time()

### Community 104 - "highestStableAtLeast"
Cohesion: 0.83
Nodes (3): compare(), highestStableAtLeast(), parts()

### Community 105 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

## Knowledge Gaps
- **377 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+372 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `github-delivery.ts`, `.transaction`, `saved-prerequisite-handoff.ts`, `knowledge/routes.ts`, `source-amendment.ts`, `agents.ts`, `artifact`, `TicketJob`, `digest`, `worker-runtime.ts`, `requests.ts`, `conversations/conversations.ts`, `run-retrospective.ts`, `store.ts`, `slack-intake/run.ts`, `record-trigger.ts`, `maintenance.ts`, `dependency-bots/adopt.ts`, `offices.ts`, `easternDay`, `cec/workflow.ts`, `command`, `cec/issue-publication.ts`, `knowledge.ts`, `task-briefing.ts`, `SourceRegistry`, `scope-repair-resume.ts`, `engine.ts`, `digest`, `schedule.ts`, `IntakeLedger`, `sourceVisible`, `cost-ledger.ts`, `Role`, `.save`, `run-accounting.ts`, `.emit`, `tracking-issue.ts`, `slack-intake/report.ts`, `time-scope.ts`, `OfficeSnapshot`, `.getEffect`, `outbox.ts`, `scheduled-work.ts`, `investigations/ledger.ts`, `closeout.ts`, `investigations/run.ts`, `Coordinator`, `it-specialist.ts`, `remove-candidate.ts`, `dependencies.ts`, `coordination.ts`, `jira-time.ts`, `discovery-recovery.ts`, `retrospective-subject.ts`, `azure.ts`, `lesson-selection.ts`, `telemetry/report.ts`, `workKey`, `coordination-tick.ts`, `admit-improvement.ts`, `api-routes.ts`, `outbound.ts`, `knowledge/learning-events.ts`, `publish-pr.ts`, `project-progress.ts`, `weekly-research.ts`, `goal-reviews.ts`, `session-bridge.ts`, `harnessEffect`, `blocker-followups.ts`, `goal-evidence.ts`, `goal-reporting.ts`, `create-candidate.ts`, `BrainFollowup`?**
  _High betweenness centrality (0.113) - this node is a cross-community bridge._
- **Why does `Role` connect `Role` to `github-delivery.ts`, `Inspector.tsx`, `OfficeScene.tsx`, `App.tsx`, `agents.ts`, `TicketJob`, `worker-runtime.ts`, `conversations/conversations.ts`, `store.ts`, `Store`, `maintenance.ts`, `OrgChart.tsx`, `cec/workflow.ts`, `shared.ts`, `run-accounting.ts`, `.emit`, `OfficeSnapshot`, `outbox.ts`, `closeout.ts`, `retrospective-subject.ts`, `api-routes.ts`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `TicketJob` connect `TicketJob` to `github-delivery.ts`, `Inspector.tsx`, `saved-prerequisite-handoff.ts`, `App.tsx`, `source-amendment.ts`, `agents.ts`, `artifact`, `digest`, `worker-runtime.ts`, `requests.ts`, `record-trigger.ts`, `dependency-bots/adopt.ts`, `cec/workflow.ts`, `scope-repair-resume.ts`, `engine.ts`, `shared.ts`, `Role`, `tracking-issue.ts`, `outbox.ts`, `closeout.ts`, `it-specialist.ts`, `remove-candidate.ts`, `dependencies.ts`, `discovery-recovery.ts`, `retrospective-subject.ts`, `workKey`, `publish-pr.ts`, `owned-artifact.ts`, `fact-bounds.ts`, `project-progress.ts`, `harnessEffect`, `create-candidate.ts`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `command()` (e.g. with `.constructor()` and `executeRequest()`) actually correct?**
  _`command()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _377 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `github-delivery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.064030131826742 - nodes in this community are weakly interconnected._
- **Should `Inspector.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.061239731142643763 - nodes in this community are weakly interconnected._