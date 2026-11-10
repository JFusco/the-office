# Graph Report - office-session-visibility  (2026-11-10)

## Corpus Check
- 682 files · ~282,854 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3498 nodes · 15441 edges · 109 communities (104 shown, 5 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 96 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `cb250aab`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- github-delivery.ts
- source-amendment.ts
- index.tsx
- artifact
- digest
- TicketJob
- workKey
- Store
- App.tsx
- OfficeScene.tsx
- record-trigger.ts
- shared.ts
- agents.ts
- knowledge/routes.ts
- worker-runtime.ts
- Library.tsx
- Button
- dependency-bots/adopt.ts
- scheduled-work.ts
- sourceVisible
- offices.ts
- schedule.ts
- maintenance.ts
- slack-intake/run.ts
- constellation-runtime.ts
- session-bridge.ts
- conversations/conversations.ts
- dependencies.ts
- daily-cto.ts
- knowledge/learning-events.ts
- coordination.ts
- .emit
- digest
- harnessEffect
- investigations/run.ts
- run-retrospective.ts
- time-scope.ts
- office/config.ts
- features.ts
- process.ts
- index.ts
- IntakeLedger
- OfficeSnapshot
- board-preflight.ts
- knowledge.ts
- cec/issue-publication.ts
- assignments.ts
- slack-intake/report.ts
- it-specialist.ts
- useOfficePreferences.ts
- scheduler.ts
- lesson-selection.ts
- slack-intake/config.ts
- Engine
- .transaction
- jira-time.ts
- goal-reporting.ts
- remove-candidate.ts
- Coordinator
- FeatureWorkspace.tsx
- TelemetryPanel.tsx
- ticket-stage-runner.ts
- investigations/ledger.ts
- Role
- outbox.ts
- GitHubIssuePublisher
- .getEffect
- engine.ts
- goal-reviews.ts
- azure.ts
- reader-attempts.ts
- assignment-poll.ts
- codex-rollout.ts
- features/workflow.ts
- .now
- telemetry/report.ts
- run-cost.ts
- publish-pr.ts
- admit-improvement.ts
- api-routes.ts
- fact-bounds.ts
- run-accounting.ts
- publication.ts
- captures.ts
- checkpoint-completion.ts
- control-store.ts
- blocker-followups.ts
- .pump
- .value
- telemetry.ts
- DailyCTO.tsx
- create-candidate.ts
- approach.ts
- command-registry.ts
- cec/workflow.ts
- SlackMessages
- delivery-task.ts
- cli.ts
- owned-artifact.ts
- CommittedBrain
- documentText
- codex-rollout-file.ts
- OfficeConfigView.tsx
- helper-usage.ts
- extract-worker.mjs
- SlackIntakeStatus.tsx
- slack-supersession.ts
- helper-evidence.py

## God Nodes (most connected - your core abstractions)
1. `Store` - 316 edges
2. `TicketJob` - 134 edges
3. `GitHubDelivery` - 122 edges
4. `command()` - 103 edges
5. `artifact()` - 89 edges
6. `cx()` - 88 edges
7. `digest()` - 86 edges
8. `workKey()` - 85 edges
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
- 3-file cycle: `src/knowledge/map/Constellation.tsx -> src/knowledge/map/constellation-runtime.ts -> src/knowledge/map/node-visuals.ts -> src/knowledge/map/Constellation.tsx`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/stage-reconciliation.ts -> server/delivery/recovery/implementation/continuation-review-readback.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/preparation/post-conflict-preparation.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts`
- 3-file cycle: `server/conversations/notifications.ts -> server/conversations/slack.ts -> server/knowledge/digests/outbound.ts -> server/conversations/notifications.ts`
- 3-file cycle: `server/conversations/notifications.ts -> server/knowledge/digests/send-notice.ts -> server/knowledge/digests/outbound.ts -> server/conversations/notifications.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-guard.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/queue-repairs.ts -> server/delivery/repairs/reconcile-ci-diagnosis.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/parking/resume-provider-review.ts -> server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/parking/resume-provider-review.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-publication.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/conversations/conversations.ts -> server/conversations/slack.ts -> server/workers/agents.ts -> server/conversations/conversations.ts`
- 3-file cycle: `server/conversations/slack.ts -> server/workers/agents.ts -> server/workers/worker-runtime.ts -> server/conversations/slack.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/scope-repair/scope-repair-resume.ts -> server/delivery/recovery/validation/validation-provider-context.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/recovery/retire-external-delivery.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/conversations/conversations.ts -> server/scheduling/engine.ts -> server/workers/agents.ts -> server/conversations/conversations.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/stage-prompts.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-checkout.ts -> server/delivery/pipeline/github-delivery.ts`

## Communities (109 total, 5 thin omitted)

### Community 0 - "github-delivery.ts"
Cohesion: 0.06
Nodes (87): findingsBlock(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery(), BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE (+79 more)

### Community 1 - "source-amendment.ts"
Cohesion: 0.05
Nodes (100): containedFile(), adoptCandidate(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related (+92 more)

### Community 2 - "index.tsx"
Cohesion: 0.06
Nodes (79): Conversation(), Outbox(), SendMessage, slackMessageStatus(), SlackDeliveryCard(), currentServices(), ServiceHealthPanel(), labels (+71 more)

### Community 3 - "artifact"
Cohesion: 0.07
Nodes (85): PrerequisitesSchema, activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal (+77 more)

### Community 4 - "digest"
Cohesion: 0.06
Nodes (81): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+73 more)

### Community 5 - "TicketJob"
Cohesion: 0.07
Nodes (50): removeAdoptedClone(), namedRepairIds(), HarnessControl, withHarnessWork(), runHarnessStage(), Check, harnessChecks(), harnessValidate() (+42 more)

### Community 6 - "workKey"
Cohesion: 0.07
Nodes (57): boardPreflightCandidate(), hasSavedPrerequisiteResult(), assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), reconcileCompletedConflictDraft() (+49 more)

### Community 7 - "Store"
Cohesion: 0.08
Nodes (45): channelNoticeAuthorized(), notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR, plainSlackText(), section() (+37 more)

### Community 8 - "App.tsx"
Cohesion: 0.05
Nodes (62): themeColor, App(), BrainWorkspace, CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants, ElevatorPhase (+54 more)

### Community 9 - "OfficeScene.tsx"
Cohesion: 0.06
Nodes (61): itAgent(), itDiagnostics(), displayAgentTask(), githubStageLabels, withoutElapsed(), CameraBookmark, restoreBookmark(), LiveAgentTask() (+53 more)

### Community 10 - "record-trigger.ts"
Cohesion: 0.07
Nodes (55): deliveryMetrics(), median(), baselineLearning(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences(), maintenanceSubject() (+47 more)

### Community 11 - "shared.ts"
Cohesion: 0.07
Nodes (51): ProjectReadiness, DailyCTOSummary, Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+43 more)

### Community 12 - "agents.ts"
Cohesion: 0.07
Nodes (39): cecPrompt(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), resolvedDecisionNote(), stageInstructions, cecChatPrompt() (+31 more)

### Community 13 - "knowledge/routes.ts"
Cohesion: 0.08
Nodes (39): intakeActivity(), knowledgeActivityPage(), committedNotePage(), BrainGraph, BrainNote, BrainReader, GraphNode, GraphPage (+31 more)

### Community 14 - "worker-runtime.ts"
Cohesion: 0.08
Nodes (37): candidateWorkspaceEnvironment(), assignmentSubject(), prepareExposure(), assertRetainedDispatchScope(), CODEX_DEFAULT_EFFORT, CODEX_DEFAULT_MODEL, CODEX_EFFORTS, CODEX_ROLES (+29 more)

### Community 15 - "Library.tsx"
Cohesion: 0.09
Nodes (33): KnowledgeCapturePage, KnowledgeActivity, KnowledgeActivityPage, KnowledgeEdge, Activity(), ActivityStatus(), AssignmentKnowledge(), BrainWorkspace() (+25 more)

### Community 16 - "Button"
Cohesion: 0.12
Nodes (35): KnowledgeSourceSummary, empty, filterNames, initial, AddPublicSource(), AddSourceForm(), SourceConnection, SourceCard() (+27 more)

### Community 17 - "dependency-bots/adopt.ts"
Cohesion: 0.11
Nodes (40): Execute, readBackOrThrow(), adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR (+32 more)

### Community 18 - "scheduled-work.ts"
Cohesion: 0.11
Nodes (39): deliverySlot(), closeoutRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), deterministicActions, eligible(), requestResolved() (+31 more)

### Community 19 - "sourceVisible"
Cohesion: 0.14
Nodes (34): Accepted, normalizeStatement(), RETROSPECTIVE_HISTORY, knowledgeActivity(), knowledgeSnapshot(), officeKnowledgeSnapshot(), publicReference(), lookupSummaryVisible() (+26 more)

### Community 20 - "offices.ts"
Cohesion: 0.10
Nodes (26): Config, configDigest(), IntakeConfig, readConfig(), Command, sourceCommand(), configDigestForSeed(), copyRecords() (+18 more)

### Community 21 - "schedule.ts"
Cohesion: 0.13
Nodes (31): learningMetrics(), lessonsNeedingReview(), RollupResultSchema, KnowledgeRunner, retryDelay(), reconcileIntakeStatus(), LinkResult, PublicReadPolicy (+23 more)

### Community 22 - "maintenance.ts"
Cohesion: 0.10
Nodes (28): maintenancePolicies(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice(), candidateOwner(), SETTLED (+20 more)

### Community 23 - "slack-intake/run.ts"
Cohesion: 0.12
Nodes (29): independentIntakeResult(), captureProposal(), effectId(), CaptureReceipt, IntakeResult, IntakeResultValue, Observation, Message (+21 more)

### Community 24 - "constellation-runtime.ts"
Cohesion: 0.09
Nodes (29): KnowledgeMap, KnowledgeNode, CameraPose, flightPose(), cameraTarget(), Point, Constellation(), ConstellationView (+21 more)

### Community 25 - "session-bridge.ts"
Cohesion: 0.10
Nodes (28): claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexSessionContext(), readRollout, claudeSessions(), codexSessions() (+20 more)

### Community 26 - "conversations/conversations.ts"
Cohesion: 0.10
Nodes (24): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+16 more)

### Community 27 - "dependencies.ts"
Cohesion: 0.10
Nodes (31): Admission, admit(), IntakeContext, resumeParked(), compatible(), dependencyCompletionKey(), dependencyEligibility(), DependencyStores (+23 more)

### Community 28 - "daily-cto.ts"
Cohesion: 0.11
Nodes (16): mirror(), runWeeklyResearch(), scheduledResearch(), DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), reviewWeekday() (+8 more)

### Community 29 - "knowledge/learning-events.ts"
Cohesion: 0.11
Nodes (26): retainedArtifactScope(), eventSourceBindings(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementIntakeGate(), captureLearning() (+18 more)

### Community 30 - "coordination.ts"
Cohesion: 0.10
Nodes (26): reconcileNoticeConfirmations(), completeNativeCheckpoint(), BrainFollowup, Result, queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint() (+18 more)

### Community 31 - ".emit"
Cohesion: 0.13
Nodes (28): ChannelSettings, configureChannelNotices(), configureNotices(), NoticeSettings, retryRecipientLookup(), Assessment, bindDiscoveryResume(), diagnosticProof() (+20 more)

### Community 32 - "digest"
Cohesion: 0.18
Nodes (23): comparableSlackText(), createExtractor(), extractDocument, Extraction, Extractor, uploadArtifact(), AuthoredDigest, reconcileDigestAuthorship() (+15 more)

### Community 33 - "harnessEffect"
Cohesion: 0.16
Nodes (26): harnessCloseout(), PASSING, verifyMergeActions(), activeEffectId(), harnessEffect, assertMayMutate(), harnessStageResult(), receipt() (+18 more)

### Community 34 - "investigations/run.ts"
Cohesion: 0.12
Nodes (25): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_FIX_PROMPT, OfficeFixResult (+17 more)

### Community 35 - "run-retrospective.ts"
Cohesion: 0.12
Nodes (28): acceptRetrospective(), appendLearningFacts(), freezeLearningPacket(), ARTIFACT_LIMIT, clip(), LEDGER_STEPS, MAINTENANCE_LIMIT, maintenanceFacts() (+20 more)

### Community 36 - "time-scope.ts"
Cohesion: 0.14
Nodes (30): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence(), CaptureContext (+22 more)

### Community 37 - "office/config.ts"
Cohesion: 0.17
Nodes (27): JiraOperations, plain(), unpack(), BLOCKED, Execute, findComment(), jira(), LiveIssue (+19 more)

### Community 38 - "features.ts"
Cohesion: 0.15
Nodes (27): approveFeature(), assertRetainedItems(), commandFeature(), createFeature(), mutation(), reviewQuestions(), assertFeatureDependencyOrder(), featureDependencyEdges() (+19 more)

### Community 39 - "process.ts"
Cohesion: 0.11
Nodes (23): Assessment, Readback, READBACK_INTERVAL_MS, SETTLE_MS, At, Errno, GroupInventory, GroupProbe (+15 more)

### Community 40 - "index.ts"
Cohesion: 0.11
Nodes (25): close(), config, itSpecialist, loadedRevision, offices, releaseLock, server, serviceHealth (+17 more)

### Community 41 - "IntakeLedger"
Cohesion: 0.15
Nodes (21): newTask(), recordObservation(), settlePage(), ChannelProgress, LIMITS, DERIVED, IntakeLedger, acceptProposals() (+13 more)

### Community 42 - "OfficeSnapshot"
Cohesion: 0.11
Nodes (24): recommendedReply(), SnapshotAcceptance, demoSnapshot(), tourStages, AzureBuild, OfficeSnapshot, STAGE_ROLE, lastWall (+16 more)

### Community 43 - "board-preflight.ts"
Cohesion: 0.20
Nodes (25): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), ProjectCard, projectCards(), projectGraphql() (+17 more)

### Community 44 - "knowledge.ts"
Cohesion: 0.08
Nodes (28): Kind, RetrospectiveResult, RollupResult, Stage, SEEDS, RollupHooks, KnowledgeOptions, BlockerFollowup (+20 more)

### Community 45 - "cec/issue-publication.ts"
Cohesion: 0.19
Nodes (8): Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), plainDescription(), Transition, JiraFeaturePublisher

### Community 46 - "assignments.ts"
Cohesion: 0.15
Nodes (16): assignmentKnowledge(), AssignmentLookups, Binding, lookupInstructions(), decodeLookupJournal(), lookupJournal, readLookupJournal(), referenceVisible() (+8 more)

### Community 47 - "slack-intake/report.ts"
Cohesion: 0.19
Nodes (22): Proposal, ReadTask, isStoppingFor(), intakeProgress(), terminalDeferred(), unitKey(), verifiedCapture(), LinkRecord (+14 more)

### Community 48 - "it-specialist.ts"
Cohesion: 0.15
Nodes (15): ITContext, publishITReport(), delays, recoverAttempt(), listenerHealth(), providers, ProviderStatusChecks, summary (+7 more)

### Community 49 - "useOfficePreferences.ts"
Cohesion: 0.11
Nodes (20): PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, acceptPreferences(), PreferenceCandidate, PreferenceState (+12 more)

### Community 50 - "scheduler.ts"
Cohesion: 0.16
Nodes (12): ROLES, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch(), foreignWork() (+4 more)

### Community 51 - "lesson-selection.ts"
Cohesion: 0.15
Nodes (21): knowledgeContext(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), MAINTENANCE, MAX_LESSONS (+13 more)

### Community 52 - "slack-intake/config.ts"
Cohesion: 0.13
Nodes (20): privateFile(), readLocalIntakeReport(), exactly(), Message, nativeReadPayload(), pagination(), nativeFile(), Fields (+12 more)

### Community 53 - "Engine"
Cohesion: 0.09
Nodes (5): correlatedBuild(), Engine, observe(), observeParked(), parkedReadError

### Community 54 - ".transaction"
Cohesion: 0.16
Nodes (13): featureItemComplete(), reconcileFeatureCompletion(), GitHubFeaturePublisher, recoverFeatures(), EvidenceSchema, helperInstallation(), readReview(), ReviewEvidence (+5 more)

### Community 55 - "jira-time.ts"
Cohesion: 0.15
Nodes (17): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+9 more)

### Community 56 - "goal-reporting.ts"
Cohesion: 0.16
Nodes (16): GitHubMonitor, githubPRDescription(), azureGoalFacts(), azurePRDescription(), boundedEvidence(), collectAzureGoalDocuments(), EvidenceStore, GOAL_EVIDENCE_LIMITS (+8 more)

### Community 57 - "remove-candidate.ts"
Cohesion: 0.20
Nodes (16): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+8 more)

### Community 59 - "FeatureWorkspace.tsx"
Cohesion: 0.15
Nodes (16): FeatureRound, FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures(), draftKey() (+8 more)

### Community 60 - "TelemetryPanel.tsx"
Cohesion: 0.22
Nodes (17): TelemetryReport, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens(), usd(), KpiTiles() (+9 more)

### Community 61 - "ticket-stage-runner.ts"
Cohesion: 0.24
Nodes (18): parksInJira(), run(), publicationEvidenceGap(), qaEvidenceGap(), resultGate(), stageResultGap(), approachFingerprint(), jiraRepairable() (+10 more)

### Community 62 - "investigations/ledger.ts"
Cohesion: 0.25
Nodes (14): projectSlackDeliveries(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint(), supersedingDelivery(), investigationCandidates(), investigationId() (+6 more)

### Community 63 - "Role"
Cohesion: 0.14
Nodes (16): AUTO_ADOPT_BOTS, seedProjectLessons(), goalEvidencePath(), LOCAL_BINDINGS, localBindings, contextPacket(), DeliverySlot, officeCapacity (+8 more)

### Community 64 - "outbox.ts"
Cohesion: 0.20
Nodes (15): conversationResolved(), projectOutbox(), syncOutbox(), slackRequestSettled(), knowledgeOutbox(), checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup() (+7 more)

### Community 65 - "GitHubIssuePublisher"
Cohesion: 0.25
Nodes (7): PublicationReceipt, Assign, Board, GitHubIssuePublisher, number(), same(), label()

### Community 66 - ".getEffect"
Cohesion: 0.24
Nodes (7): GitHubOperations, fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), closeNativeRefresh(), fingerprint(), EffectIntent

### Community 67 - "engine.ts"
Cohesion: 0.23
Nodes (16): checkMail(), drainMail(), requestMail(), dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), resume() (+8 more)

### Community 68 - "goal-reviews.ts"
Cohesion: 0.15
Nodes (15): applyGoalReview(), EvidenceRefSchema, statusAllowed(), workEvidence(), GoalInput, saveGoal(), queueGoalNotice(), DailyCTOBriefing (+7 more)

### Community 69 - "azure.ts"
Cohesion: 0.20
Nodes (14): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+6 more)

### Community 70 - "reader-attempts.ts"
Cohesion: 0.22
Nodes (15): document(), featureRoot(), DiscoverySchema, identity, manifestFromPlan(), ManifestSchema, PlanSchema, text (+7 more)

### Community 71 - "assignment-poll.ts"
Cohesion: 0.20
Nodes (13): noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), admitReadyCards(), WAIT_STATUSES, pinCourier, due(), unparkReleasedWaits() (+5 more)

### Community 72 - "codex-rollout.ts"
Cohesion: 0.17
Nodes (15): add(), CodexRequest, CodexRollout, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens() (+7 more)

### Community 73 - "features/workflow.ts"
Cohesion: 0.25
Nodes (8): featureById(), discoveryPrompt(), planPrompt(), Link, linkFeature(), beginReader(), featureRoute(), FeatureWorkflow

### Community 74 - ".now"
Cohesion: 0.16
Nodes (7): helperTelemetry(), dispatchExposure(), checkpointMeasurement(), HEARTBEAT_GAP_MS, HEARTBEAT_MS, startMeasurement(), WorkOutcome

### Community 75 - "telemetry/report.ts"
Cohesion: 0.23
Nodes (15): validTicket(), telemetryRoute(), Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount() (+7 more)

### Community 76 - "run-cost.ts"
Cohesion: 0.18
Nodes (14): CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL, Rates (+6 more)

### Community 77 - "publish-pr.ts"
Cohesion: 0.24
Nodes (13): retryRead(), developerPRContent(), Execute, lintPRContent(), officePRContent(), prContent, assertCandidate(), Candidate (+5 more)

### Community 78 - "admit-improvement.ts"
Cohesion: 0.28
Nodes (10): admitImprovement(), improvementEligible(), improvementManifest(), improvementMarker(), improvementProvider(), linkedRepairGap(), improvementDigest(), queueImprovements() (+2 more)

### Community 79 - "api-routes.ts"
Cohesion: 0.30
Nodes (10): eventVisible(), leadershipContext(), leadershipEntries(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), goalHistory(), apiRoute() (+2 more)

### Community 80 - "fact-bounds.ts"
Cohesion: 0.30
Nodes (13): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+5 more)

### Community 81 - "run-accounting.ts"
Cohesion: 0.21
Nodes (13): BoundedRead, backfillClaudeCost(), CompletionReader, COMPLETION_MAX_BYTES, completionAccounting(), readCompletion(), RECONCILE_GRACE_MS, reconcileUncapturedRuns() (+5 more)

### Community 82 - "publication.ts"
Cohesion: 0.27
Nodes (6): FeaturePublisher, publishFeature(), reserveIdentity(), EffectUncertainError, FeatureManifestItem, FeatureOperation

### Community 83 - "captures.ts"
Cohesion: 0.25
Nodes (11): captureAfter(), CaptureMetadata, capturePage(), cursor(), key(), captureIdentityMatches(), BrainCaptureReceipt, hash (+3 more)

### Community 84 - "checkpoint-completion.ts"
Cohesion: 0.21
Nodes (9): BrainStatusSchema, identity, brainCheckpointCompletion(), coverageSchema, followupSchema, verified, reconcileCompletedCheckpoints(), ReconciliationRequest (+1 more)

### Community 85 - "control-store.ts"
Cohesion: 0.23
Nodes (7): DATA, applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, statementCache(), initialSnapshot()

### Community 86 - "blocker-followups.ts"
Cohesion: 0.40
Nodes (8): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), readBackConversations(), diagnosticSnapshot(), nativeDeliveryResolved(), handoff(), reconcileBlockerFollowups()

### Community 88 - ".value"
Cohesion: 0.24
Nodes (6): file, folder, logs, root, xml(), ProjectProgress

### Community 89 - "telemetry.ts"
Cohesion: 0.17
Nodes (11): CostCompleteness, CostComponent, CostLedgerState, ProviderBasis, RunCost, RunUsage, TelemetryRow, TelemetrySync (+3 more)

### Community 90 - "DailyCTO.tsx"
Cohesion: 0.26
Nodes (8): CTOReview(), goalState, DailyCTO(), GoalHistory(), reportDate(), reviewStatus, reviewExcerpt(), ReviewText()

### Community 91 - "create-candidate.ts"
Cohesion: 0.31
Nodes (9): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+1 more)

### Community 92 - "approach.ts"
Cohesion: 0.44
Nodes (10): afterDraft(), ApproachSchema, firstBuildStage(), missingApproachStage(), plannedNext(), recordApproach(), reroute(), stageNeeded() (+2 more)

### Community 93 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 94 - "cec/workflow.ts"
Cohesion: 0.33
Nodes (6): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), advance(), nextStage(), safeWebUrl()

### Community 96 - "delivery-task.ts"
Cohesion: 0.33
Nodes (6): deliveryTask(), DeliveryTaskInput, DISCOVERY_GUIDANCE, compactSteps(), AMENDMENT_REVIEW_PROOF, featureDeliveryContext()

### Community 97 - "cli.ts"
Cohesion: 0.25
Nodes (6): args, [cmd,...rawArgs], commands, key, projectIndex, PORT

### Community 98 - "owned-artifact.ts"
Cohesion: 0.54
Nodes (6): ghLogCacheEvidence(), done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf()

### Community 100 - "documentText"
Cohesion: 0.39
Nodes (5): guidanceExcerpt(), DocumentMetadata, documentText(), KnowledgeDocumentText, DocumentPreview()

### Community 101 - "codex-rollout-file.ts"
Cohesion: 0.36
Nodes (7): createdAt(), dayDirs(), header(), readCodexRollout(), ROLLOUT_MAX_BYTES, RolloutScan, scanCodexRollouts()

### Community 102 - "OfficeConfigView.tsx"
Cohesion: 0.48
Nodes (5): loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView(), OfficeConfigSummary

### Community 103 - "helper-usage.ts"
Cohesion: 0.47
Nodes (5): codexHome(), HELPER_STDOUT_MAX_BYTES, helperAccounting(), claudeAccounting(), withReason()

### Community 104 - "extract-worker.mjs"
Cohesion: 0.70
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 105 - "SlackIntakeStatus.tsx"
Cohesion: 0.60
Nodes (4): format, labels, SlackIntakeStatus(), time()

### Community 106 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

## Knowledge Gaps
- **387 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+382 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `github-delivery.ts`, `source-amendment.ts`, `artifact`, `digest`, `TicketJob`, `workKey`, `record-trigger.ts`, `agents.ts`, `knowledge/routes.ts`, `worker-runtime.ts`, `dependency-bots/adopt.ts`, `scheduled-work.ts`, `sourceVisible`, `offices.ts`, `schedule.ts`, `maintenance.ts`, `slack-intake/run.ts`, `session-bridge.ts`, `conversations/conversations.ts`, `dependencies.ts`, `knowledge/learning-events.ts`, `coordination.ts`, `.emit`, `digest`, `harnessEffect`, `investigations/run.ts`, `run-retrospective.ts`, `time-scope.ts`, `office/config.ts`, `features.ts`, `process.ts`, `IntakeLedger`, `OfficeSnapshot`, `board-preflight.ts`, `knowledge.ts`, `cec/issue-publication.ts`, `assignments.ts`, `slack-intake/report.ts`, `it-specialist.ts`, `scheduler.ts`, `lesson-selection.ts`, `slack-intake/config.ts`, `Engine`, `.transaction`, `jira-time.ts`, `goal-reporting.ts`, `remove-candidate.ts`, `ticket-stage-runner.ts`, `investigations/ledger.ts`, `Role`, `GitHubIssuePublisher`, `.getEffect`, `engine.ts`, `goal-reviews.ts`, `azure.ts`, `reader-attempts.ts`, `features/workflow.ts`, `.now`, `telemetry/report.ts`, `publish-pr.ts`, `admit-improvement.ts`, `api-routes.ts`, `run-accounting.ts`, `publication.ts`, `checkpoint-completion.ts`, `control-store.ts`, `blocker-followups.ts`, `.pump`, `.value`, `create-candidate.ts`, `SlackMessages`, `delivery-task.ts`?**
  _High betweenness centrality (0.132) - this node is a cross-community bridge._
- **Why does `command()` connect `process.ts` to `github-delivery.ts`, `artifact`, `digest`, `TicketJob`, `workKey`, `Store`, `agents.ts`, `knowledge/routes.ts`, `worker-runtime.ts`, `scheduled-work.ts`, `maintenance.ts`, `slack-intake/run.ts`, `session-bridge.ts`, `dependencies.ts`, `coordination.ts`, `digest`, `harnessEffect`, `office/config.ts`, `features.ts`, `board-preflight.ts`, `cec/issue-publication.ts`, `it-specialist.ts`, `Engine`, `.transaction`, `jira-time.ts`, `goal-reporting.ts`, `remove-candidate.ts`, `ticket-stage-runner.ts`, `Role`, `GitHubIssuePublisher`, `.getEffect`, `engine.ts`, `azure.ts`, `reader-attempts.ts`, `features/workflow.ts`, `publish-pr.ts`, `admit-improvement.ts`, `.value`, `create-candidate.ts`, `command-registry.ts`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `Role` connect `Role` to `github-delivery.ts`, `index.tsx`, `TicketJob`, `Store`, `App.tsx`, `OfficeScene.tsx`, `record-trigger.ts`, `shared.ts`, `agents.ts`, `worker-runtime.ts`, `maintenance.ts`, `conversations/conversations.ts`, `dependencies.ts`, `knowledge/learning-events.ts`, `.emit`, `OfficeSnapshot`, `scheduler.ts`, `outbox.ts`, `.now`, `run-accounting.ts`, `approach.ts`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `command()` (e.g. with `.constructor()` and `executeRequest()`) actually correct?**
  _`command()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _387 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `github-delivery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05982053838484546 - nodes in this community are weakly interconnected._
- **Should `source-amendment.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05104253544620517 - nodes in this community are weakly interconnected._