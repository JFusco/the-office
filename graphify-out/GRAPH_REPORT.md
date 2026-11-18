# Graph Report - the-office  (2026-11-17)

## Corpus Check
- 890 files · ~349,569 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4350 nodes · 20000 edges · 133 communities (127 shown, 6 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 683 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `afc38e41`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- LessonsPanel.tsx
- OrgChart.tsx
- intent.ts
- .transaction
- Inspector.tsx
- ControlStore
- session-bridge.ts
- ref_react
- continue-ownership-read.ts
- github-delivery.ts
- agents.ts
- run.ts
- App.tsx
- index.tsx
- knowledge/routes.ts
- scheduled-captures.ts
- run-retrospective.ts
- record-trigger.ts
- TelemetryPanel.tsx
- artifact
- holdReason
- shared.ts
- config.ts
- jira-time.ts
- index.ts
- maintenance/maintenance.ts
- cost-ledger.ts
- cec.ts
- knowledge.ts
- local-config.ts
- metadata-assessment.ts
- interrupted-run-note.ts
- process.ts
- closeout-recovery.ts
- it-specialist.ts
- cec/issue-publication.ts
- scheduled-work.ts
- telemetry.ts
- dependency-bots/adopt.ts
- lesson-selection.ts
- store.ts
- time-scope.ts
- verifyRepairCandidate
- demand-facts.ts
- features/workflow.ts
- harness-baseline.ts
- OfficeScene.tsx
- work-summary.ts
- Engine
- session-context-file.ts
- Store
- preferences-store.ts
- http/commands.ts
- inspect-closed-plan.ts
- continue-access-only-plan.ts
- weekly-rollup.ts
- FeatureWorkspace.tsx
- .getEffect
- daily-cto.ts
- project-bindings-config.ts
- goal-reporting.ts
- assignment-poll.ts
- run.ts
- knowledge-views.ts
- ticket-evidence.ts
- price-table.ts
- remove-candidate.ts
- pilot-delivery.ts
- session-context-file.ts
- ref_node_crypto
- constellation-runtime.ts
- session-scope.ts
- work.ts
- report.ts
- projects.ts
- Offices
- .emit
- owned-artifact.ts
- service-health.ts
- StageResult
- learning-events.ts
- artifact
- workKey
- command-registry.ts
- tracking-issue.ts
- accept-stage-result.ts
- Goals.tsx
- outbox.ts
- mutedCopy
- api-routes.ts
- project-binding-blocks.ts
- readable-jira-comment.ts
- cec/workflow.ts
- ledger.ts
- goal-reporting.ts
- capture-session-clone.py
- GitHubDelivery
- process.ts
- .save
- coordination-tick.ts
- ticket-stage-runner.ts
- projectOutbox
- Conversation.tsx
- worker-runtime.ts
- Coordinator
- extract-worker.mjs
- prompts/conversations.ts
- diagnostic-context.ts
- leadership.ts
- run-accounting.ts
- connectWith
- featureById
- codex-rollout.ts
- admit-improvement.ts
- slack-supersession.ts
- blocker-followups.ts
- qa.ts
- qa-plan-continuation.ts
- writer-restart.ts
- OfficeConfigView.tsx
- easternDay
- delivery-ownership.ts
- time-readback.ts
- extraction.ts
- office-qa-handoff.ts
- wiki-sync.ts
- contract.ts
- office-state-view.ts
- run-cost.ts
- unblock-brief.ts
- restoreInPlace
- setup-stop-cap.ts
- highestStableAtLeast

## God Nodes (most connected - your core abstractions)
1. `Store` - 384 edges
2. `TicketJob` - 172 edges
3. `digest()` - 151 edges
4. `holdReason()` - 126 edges
5. `command()` - 123 edges
6. `GitHubDelivery` - 116 edges
7. `artifact()` - 114 edges
8. `workKey()` - 98 edges
9. `OfficeSnapshot` - 88 edges
10. `currentAssignment()` - 88 edges

## Surprising Connections (you probably didn't know these)
- `DeliverySlot` --references--> `Role`  [EXTRACTED]
  server/office/projects.ts → src/shared.ts
- `UnrecordedResult` --references--> `StageResult`  [EXTRACTED]
  server/cec/unrecorded-result.ts → src/shared.ts
- `apply()` --indirect_call--> `note()`  [INFERRED]
  src/conversations/OutboxSavedImplementation.tsx → server/cec/parking/resume-parked.ts
- `SettleInputs` --references--> `AssignedIssue`  [EXTRACTED]
  server/delivery/intake/settle-stopped-reviews.ts → src/shared.ts
- `Store` --references--> `OfficeSnapshot`  [EXTRACTED]
  server/store/store.ts → src/shared.ts

## Import Cycles
- 2-file cycle: `server/scheduling/coordination-pump.ts -> server/scheduling/coordination.ts -> server/scheduling/coordination-pump.ts`
- 2-file cycle: `server/scheduling/coordination-tick.ts -> server/scheduling/coordination.ts -> server/scheduling/coordination-tick.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/track-adopted-review.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/stage-reconciliation.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/publication/metadata-context.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/closeout/github-closeout.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/queue-repairs.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/implementation/saved-prerequisite-handoff.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/accept-stage-result.ts -> server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/accept-stage-result.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/refresh-merge-review.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/knowledge/lesson-exits.ts -> server/scheduling/requests.ts -> server/knowledge/lesson-exits.ts`
- 2-file cycle: `server/conversations/conversations.ts -> server/conversations/cto-conversations.ts -> server/conversations/conversations.ts`
- 2-file cycle: `server/conversations/notifications.ts -> server/conversations/slack.ts -> server/conversations/notifications.ts`
- 2-file cycle: `src/contracts/work.ts -> src/shared.ts -> src/contracts/work.ts`
- 2-file cycle: `src/contracts/people.ts -> src/shared.ts -> src/contracts/people.ts`
- 2-file cycle: `src/contracts/timing.ts -> src/shared.ts -> src/contracts/timing.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-guard.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/review-wait.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`

## Communities (133 total, 6 thin omitted)

### Community 0 - "LessonsPanel.tsx"
Cohesion: 0.17
Nodes (21): LessonDecisionAction, lessonDecisionState(), readLessonDecision(), OutboxLessonDecision(), act(), readStatus(), evidenceText(), field() (+13 more)

### Community 1 - "OrgChart.tsx"
Cohesion: 0.12
Nodes (37): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+29 more)

### Community 2 - "intent.ts"
Cohesion: 0.11
Nodes (28): GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles(), ContinuationIO (+20 more)

### Community 3 - ".transaction"
Cohesion: 0.12
Nodes (37): featureItemComplete(), reconcileFeatureCompletion(), discoveryPrompt(), planPrompt(), helperTelemetry(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS (+29 more)

### Community 4 - "Inspector.tsx"
Cohesion: 0.11
Nodes (66): blockedSummary(), itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps(), ServiceHealthPanel(), followUp(), labels (+58 more)

### Community 5 - "ControlStore"
Cohesion: 0.13
Nodes (7): DailyCTO, EvidenceRequestConflict, queueGoalEvidenceRequest(), Briefing, saveReviewBriefing(), ControlStore, DailyCTOReport

### Community 6 - "session-bridge.ts"
Cohesion: 0.13
Nodes (22): codexDaemonProcesses(), accountCodexProcesses(), CodexProcessInventory, codexProcessInventory(), DesktopSessions, unaccountedProcesses(), idleExecServers(), isExecServer() (+14 more)

### Community 7 - "ref_react"
Cohesion: 0.10
Nodes (39): Activity(), ActivityTimeline(), AssignmentKnowledge(), Lookup(), BrainWorkspace(), DocumentMetadata, documentText(), KnowledgeDocumentText (+31 more)

### Community 8 - "continue-ownership-read.ts"
Cohesion: 0.25
Nodes (13): continueOwnershipRead(), expiredOwnershipRead(), handoffOwnership(), ReadbackOwnerDecision, ownershipReadGate(), ownershipReadState(), ownershipReadSource(), ReadOwnershipCandidate (+5 more)

### Community 9 - "github-delivery.ts"
Cohesion: 0.06
Nodes (82): writerRestartInstruction(), findingsBlock(), BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction(), refusal(), dependabotReviewGuidance() (+74 more)

### Community 10 - "agents.ts"
Cohesion: 0.06
Nodes (38): implementationWorkerContext(), stageInstructions, assertContinuableWorktree(), CONTINUABLE, continuationPrompt(), MAX_CONTINUATIONS, recordedContinuation(), StageContinuation (+30 more)

### Community 11 - "run.ts"
Cohesion: 0.13
Nodes (23): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_FIX_PROMPT, OfficeFixResult (+15 more)

### Community 12 - "App.tsx"
Cohesion: 0.06
Nodes (50): BrainDrawer(), themeColor, App(), BrainWorkspace, CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants (+42 more)

### Community 13 - "index.tsx"
Cohesion: 0.06
Nodes (52): Outbox(), ctoInputFailure(), OutboxCTOInput(), recover(), OutboxLessonDigest(), OutboxMaintenanceStatus(), OutboxSavedImplementation(), apply() (+44 more)

### Community 14 - "knowledge/routes.ts"
Cohesion: 0.07
Nodes (45): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, CommittedBrain (+37 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.16
Nodes (42): createFeature(), assertEnrollable(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), CaptureRequest, captureRequest(), captureRequests() (+34 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.11
Nodes (35): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, BlockingTrigger, blockingTrigger(), BrainOverlap (+27 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.08
Nodes (52): isBlocking(), LEARNING_BASELINES, maintenanceSubject(), MaintenanceSubjectFacts, busyMaintenanceIds(), clip(), maintenanceBlockedId(), MaintenanceCandidate (+44 more)

### Community 18 - "TelemetryPanel.tsx"
Cohesion: 0.10
Nodes (35): TelemetryReport, displayAgentTask(), LiveAgentTask(), Props, RunningTask(), text(), AzureBuild, BreakdownTable() (+27 more)

### Community 19 - "artifact"
Cohesion: 0.08
Nodes (64): assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), reconcileCompletedConflictDraft(), routeReadyPostConflictPublication(), verifyInitialDraftConflictPreparation() (+56 more)

### Community 20 - "holdReason"
Cohesion: 0.07
Nodes (60): ATTEMPT_DELAYS_MS, nextAttemptAt(), restartStoppedWriters(), unchangedSinceAccepted(), NOT_RETRYABLE, WRITER_STAGES, WriterRestartCandidate, writerRestartCandidate() (+52 more)

### Community 21 - "shared.ts"
Cohesion: 0.06
Nodes (77): initialManualStart(), Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), ProjectCard, projectCards() (+69 more)

### Community 22 - "config.ts"
Cohesion: 0.10
Nodes (38): commandFeature(), reviewQuestions(), assertQuestionVisibility(), applyHarnessAction(), HarnessActionInput, recoveryPreconditions(), recoveryTarget(), normalizeRound() (+30 more)

### Community 23 - "jira-time.ts"
Cohesion: 0.07
Nodes (58): attempted(), attemptState(), bound(), covers(), JiraAttempt, jiraAttempts(), JiraAttemptState, open() (+50 more)

### Community 24 - "index.ts"
Cohesion: 0.11
Nodes (19): close(), config, itSpecialist, loadedRevision, offices, releaseLock, server, serviceHealth (+11 more)

### Community 25 - "maintenance/maintenance.ts"
Cohesion: 0.06
Nodes (46): ApproachSchema, maintenancePolicies(), completeNativeCheckpoint(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, brainResultStop(), BrainStatusSchema (+38 more)

### Community 26 - "cost-ledger.ts"
Cohesion: 0.16
Nodes (26): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId(), OutsideEdit (+18 more)

### Community 27 - "cec.ts"
Cohesion: 0.13
Nodes (26): cecPrompt(), resolvedDecisionNote(), stageInstructionsFor(), reviewInstructions(), stagePrompt(), StagePromptInput, METADATA_FINDING_GUIDANCE, safeWebUrl() (+18 more)

### Community 28 - "knowledge.ts"
Cohesion: 0.06
Nodes (39): curateLesson(), Curation, CurationAction, mergeEvidence(), LessonBrainAudit, lessonBrainAudit(), LessonBrainOverlap, BRAIN_SCOPE (+31 more)

### Community 29 - "local-config.ts"
Cohesion: 0.11
Nodes (32): AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), goalEvidencePath(), OfficeConfigInputs, officeConfigRoute(), officeConfigSummary(), projectSettingsSummary(), assertUniqueProjectKeys() (+24 more)

### Community 30 - "metadata-assessment.ts"
Cohesion: 0.12
Nodes (46): admitPRMetadata(), assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema, savedMetadataAssessment(), validateSaved(), metadataClaim() (+38 more)

### Community 31 - "interrupted-run-note.ts"
Cohesion: 0.46
Nodes (6): capacityInterruptedRun(), providerSaid(), applies(), interruptedRunNote(), placeholder(), withoutInterruptedResult()

### Community 32 - "process.ts"
Cohesion: 0.06
Nodes (47): az(), buildUrl(), prUrl(), readInPairs(), candidateBranchMoved(), ProviderPR, readAzurePRs(), postDevUpdate() (+39 more)

### Community 33 - "closeout-recovery.ts"
Cohesion: 0.09
Nodes (44): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+36 more)

### Community 34 - "it-specialist.ts"
Cohesion: 0.16
Nodes (17): savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), ITContext, diagnosticSnapshot(), informationalRecovery(), publishITReport() (+9 more)

### Community 35 - "cec/issue-publication.ts"
Cohesion: 0.09
Nodes (16): Assignment, contentSchema(), JiraIssuePublisher, jiraText(), Transition, descriptionPreimage(), plain(), publicationDescription() (+8 more)

### Community 36 - "scheduled-work.ts"
Cohesion: 0.11
Nodes (33): freshOwnershipRead(), deliverySlot(), withAmendmentOwnership(), metadataRequestResolved(), preparationRequestResolved(), gateFeatureWork(), requestPriority(), closedTicketReport() (+25 more)

### Community 37 - "telemetry.ts"
Cohesion: 0.18
Nodes (11): comparable(), EvidenceOutcome, recordRunEvidence(), CostCompleteness, CostComponent, ProviderBasis, RunAccounting, RunCost (+3 more)

### Community 38 - "dependency-bots/adopt.ts"
Cohesion: 0.22
Nodes (20): Execute, adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, DependabotPR, dependabotPR() (+12 more)

### Community 39 - "lesson-selection.ts"
Cohesion: 0.18
Nodes (14): INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), MAINTENANCE, MAX_LESSONS, normalPath() (+6 more)

### Community 40 - "store.ts"
Cohesion: 0.12
Nodes (21): Clock, EASTERN, easternDayFormatter, easternPartsFormatter, systemClock, DATA, DELIVERY_CONCURRENCY, LEGACY_AUTOMATION (+13 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.14
Nodes (28): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence(), boardUsd() (+20 more)

### Community 42 - "verifyRepairCandidate"
Cohesion: 0.12
Nodes (32): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+24 more)

### Community 43 - "demand-facts.ts"
Cohesion: 0.14
Nodes (20): clip(), DEMAND_LIMIT, demandFacts(), DemandSection, key(), LessonKey, notes(), clip() (+12 more)

### Community 44 - "features/workflow.ts"
Cohesion: 0.08
Nodes (50): approveFeature(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), artifactPath(), digest(), document() (+42 more)

### Community 45 - "harness-baseline.ts"
Cohesion: 0.15
Nodes (22): BaselineReport, baselineReport(), BaselineSource, baselineText(), millions(), row(), share(), add() (+14 more)

### Community 46 - "OfficeScene.tsx"
Cohesion: 0.17
Nodes (33): withoutElapsed(), Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk() (+25 more)

### Community 47 - "work-summary.ts"
Cohesion: 0.11
Nodes (30): compactSteps(), knowledgeOutbox(), DAYS, dueLessonDecisions(), easternWeek(), LESSON_DIGEST, LessonDecision, PARTS (+22 more)

### Community 48 - "Engine"
Cohesion: 0.07
Nodes (14): AzureMonitor, GitHubMonitor, githubPRDescription(), azureGoalFacts(), azurePRDescription(), boundedEvidence(), collectAzureGoalDocuments(), EvidenceStore (+6 more)

### Community 49 - "session-context-file.ts"
Cohesion: 0.20
Nodes (14): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+6 more)

### Community 50 - "Store"
Cohesion: 0.09
Nodes (18): GitHubFeaturePublisher, OfficeCapacity, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch() (+10 more)

### Community 51 - "preferences-store.ts"
Cohesion: 0.17
Nodes (10): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS (+2 more)

### Community 52 - "http/commands.ts"
Cohesion: 0.14
Nodes (22): approveMerge(), assertHarnessMayMerge(), HUMAN_MERGE, failedWorker(), requeueWaitedImplement(), enqueueMetadataRecovery(), normalizeStatement(), baselineLearning() (+14 more)

### Community 53 - "inspect-closed-plan.ts"
Cohesion: 0.19
Nodes (12): closedReadonlyPlan(), Document, document(), entryExists(), inspectClosedQAPlan(), reviewedPlanGuidance, reviewedPlanGuideDigest, qaPlanEvidenceGap() (+4 more)

### Community 54 - "continue-access-only-plan.ts"
Cohesion: 0.44
Nodes (7): Document, document(), isAccessOnlyPlan(), settledAccessOnlyState(), continueAccessOnlyPlan(), entryExists(), SKILLS

### Community 55 - "weekly-rollup.ts"
Cohesion: 0.17
Nodes (18): deliveryMetrics(), median(), learningMetrics(), RollupResult, KnowledgeRunner, RETROSPECTIVE_TIMEOUT, lastFriday(), ROLLUP_HISTORY (+10 more)

### Community 56 - "FeatureWorkspace.tsx"
Cohesion: 0.21
Nodes (17): FeatureQuestionProjection, OutboxQuestionRound(), send(), draftKey(), readDraft(), saveDraft(), nextQuestion(), orderedQuestions() (+9 more)

### Community 57 - ".getEffect"
Cohesion: 0.08
Nodes (27): MergeNotifications, slackVerifyPrompt(), comparableSlackText(), SlackMessages, interruptAdoptions(), legacy(), REMOVED_FIELDS, retireLegacyRecovery() (+19 more)

### Community 58 - "daily-cto.ts"
Cohesion: 0.23
Nodes (11): evidenceRequestConflicts, dailyReviewPrompt(), dailyReviewDate(), reviewWeekday(), applyGoalReview(), DailyResultSchema, EvidenceRefSchema, FreshDailyResultSchema (+3 more)

### Community 59 - "project-bindings-config.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 60 - "goal-reporting.ts"
Cohesion: 0.25
Nodes (15): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+7 more)

### Community 61 - "assignment-poll.ts"
Cohesion: 0.17
Nodes (13): recordCandidateCleanup(), retryCandidateCleanup(), assertMayMutate(), admitReadyCards(), SettleInputs, settleStoppedReviews(), due(), unparkReleasedWaits() (+5 more)

### Community 62 - "run.ts"
Cohesion: 0.22
Nodes (7): CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility, overlayEntranceDelays(), SceneOverlay()

### Community 63 - "knowledge-views.ts"
Cohesion: 0.16
Nodes (18): KnowledgeActivity, KnowledgeEdge, KnowledgeMap, KnowledgeNode, connectionSummary(), ConstellationView, ConstellationRuntime, DisplayNode (+10 more)

### Community 64 - "ticket-evidence.ts"
Cohesion: 0.20
Nodes (14): assetDownloader(), blankEvidence(), CoverageState, EVIDENCE_LIMITS, EvidenceAttachment, EvidenceReadContext, EvidenceSection, failedCoverage() (+6 more)

### Community 65 - "price-table.ts"
Cohesion: 0.20
Nodes (8): CacheWriteDuration, CODEX_ROWS, ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL, Rates, PriceRef

### Community 66 - "remove-candidate.ts"
Cohesion: 0.21
Nodes (13): interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval, Execute (+5 more)

### Community 67 - "pilot-delivery.ts"
Cohesion: 0.09
Nodes (53): continueImplementation(), dispatchNightly(), drainDelivery(), requestDelivery(), startPilot(), OfficeQAHandoffInput, eligibility(), Admission (+45 more)

### Community 68 - "session-context-file.ts"
Cohesion: 0.20
Nodes (13): ContextFoldPrefix, contextFoldPrefix(), SessionContextCheckpoint, captureSessionContextClone(), ContextReadPhase, SessionContextDeadline, sessionContextFile(), ContextReadChanged (+5 more)

### Community 69 - "ref_node_crypto"
Cohesion: 0.14
Nodes (22): enableNightly(), packedConsumerPnpmRepair(), sha256(), attachmentKind(), evidenceDirectory(), readEvidence(), storeEvidence(), ProviderEvidence (+14 more)

### Community 70 - "constellation-runtime.ts"
Cohesion: 0.10
Nodes (20): CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point, createConstellation(), enter() (+12 more)

### Community 71 - "session-scope.ts"
Cohesion: 0.14
Nodes (21): claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexSessionContext(), readRollout, LiveSession, ContextProject (+13 more)

### Community 72 - "work.ts"
Cohesion: 0.09
Nodes (26): ReviewWait, BLOCKED_CAUSES, blockedCauses(), projectReadiness(), explanation(), LABELS, stoppedReason(), ProjectReadiness (+18 more)

### Community 73 - "report.ts"
Cohesion: 0.24
Nodes (14): TelemetryRow, TelemetrySync, Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount() (+6 more)

### Community 74 - "projects.ts"
Cohesion: 0.08
Nodes (21): args, [cmd,...rawArgs], commands, key, projectIndex, CEC, LOCAL_BINDINGS, file (+13 more)

### Community 76 - ".emit"
Cohesion: 0.14
Nodes (21): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR (+13 more)

### Community 77 - "owned-artifact.ts"
Cohesion: 0.22
Nodes (13): done(), readBoundedNoFollow(), reasonOf(), codexHome(), createdAt(), dayDirs(), header(), ROLLOUT_MAX_BYTES (+5 more)

### Community 78 - "service-health.ts"
Cohesion: 0.18
Nodes (9): listenerHealth(), PROJECT_BINDINGS, providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks (+1 more)

### Community 79 - "StageResult"
Cohesion: 0.09
Nodes (34): escaped(), IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), intakeMembership(), projectListScope(), cecIntakePrompt() (+26 more)

### Community 80 - "learning-events.ts"
Cohesion: 0.29
Nodes (9): improvementIntakeGate(), captureLearning(), learningDigest(), recordLearningOpportunity(), expireLearningPackets(), maintainLearning(), packetReferences(), captureMaintenanceStep() (+1 more)

### Community 81 - "artifact"
Cohesion: 0.05
Nodes (108): interruptedImplementation(), continueUnsealedQA(), entry(), ownershipReadHistory(), recoverCTOInput(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration() (+100 more)

### Community 82 - "workKey"
Cohesion: 0.14
Nodes (19): completedPRReviews(), Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership (+11 more)

### Community 83 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 84 - "tracking-issue.ts"
Cohesion: 0.19
Nodes (17): readBackOrThrow(), ensureTrackingIssue(), findTrackingIssue(), ownTracking(), TrackingIssue, trackingIssueBody(), trackingIssueTitle(), trackingMarker() (+9 more)

### Community 85 - "accept-stage-result.ts"
Cohesion: 0.10
Nodes (46): containedFile(), needsDecision(), acceptStageResult(), recordJobApproach(), assertDraftClaimHistory(), linkDraftIssue(), protectedOriginalClaim(), METADATA_FINDING (+38 more)

### Community 86 - "Goals.tsx"
Cohesion: 0.15
Nodes (18): SendMessage, CTOReview(), goalState, DailyCTO(), reportDate(), reviewStatus, GoalList(), card() (+10 more)

### Community 87 - "outbox.ts"
Cohesion: 0.10
Nodes (18): ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff(), saveGoals() (+10 more)

### Community 88 - "mutedCopy"
Cohesion: 0.16
Nodes (31): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS, PickupForm(), acceptPreferences() (+23 more)

### Community 89 - "api-routes.ts"
Cohesion: 0.23
Nodes (14): implementationPreview(), implementationContinuationRoute(), qaPlanRetryRoute(), goalHistory(), apiRoute(), fileResponse(), json(), staticRoute() (+6 more)

### Community 90 - "project-binding-blocks.ts"
Cohesion: 0.19
Nodes (19): azureSchema, deploymentSchema, jiraSchema, ownJiraSchema, promptSchema, DEFAULT_STAGE_STATUSES, intakeStatus, resolvedStatuses() (+11 more)

### Community 91 - "readable-jira-comment.ts"
Cohesion: 0.10
Nodes (27): CommentPage, commentReadback(), devUpdate(), HEADLINE, JiraOperations, jiraRecord(), unpack(), parksInJira() (+19 more)

### Community 92 - "cec/workflow.ts"
Cohesion: 0.16
Nodes (15): applyIntakeObservation(), checkMail(), drainMail(), requestMail(), MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), MISSING_SAVED_PLAN (+7 more)

### Community 93 - "ledger.ts"
Cohesion: 0.25
Nodes (12): acceptedCompletionResolution(), investigationCandidates(), investigationId(), finishedSubjectResolution(), investigationFollowUps(), interruptedQARerunResolution(), investigationResolution(), syncInvestigations() (+4 more)

### Community 94 - "goal-reporting.ts"
Cohesion: 0.27
Nodes (12): assertConversationReadback(), finishSupersededReadback(), pump(), savePickup(), harperHandoff(), acceptedGoalReport(), GOAL_REPORT_GUIDANCE, GoalReport (+4 more)

### Community 96 - "GitHubDelivery"
Cohesion: 0.06
Nodes (47): DeliveryAuthorityInput, pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), GitHubDelivery, adoptCandidate(), reported, Scope, advisoryPM() (+39 more)

### Community 97 - "process.ts"
Cohesion: 0.15
Nodes (17): Event, one(), prePushRejection(), PushIdentity, At, Errno, errno(), GroupInventory (+9 more)

### Community 98 - ".save"
Cohesion: 0.13
Nodes (43): resolveBlockedTransition(), document(), transitionWithComment(), jiraAccount(), jiraCollection(), JiraCredential, jiraCredential(), KEYCHAIN_SERVICE (+35 more)

### Community 99 - "coordination-tick.ts"
Cohesion: 0.20
Nodes (12): reconcileNoticeConfirmations(), legacy, reconcileContinuations(), projectPolicy(), pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION, checkpointWindow() (+4 more)

### Community 100 - "ticket-stage-runner.ts"
Cohesion: 0.13
Nodes (37): correlatedBuild(), ownReceipts(), run(), verifiedTransition(), publicationEvidenceGap(), qaEvidenceGap(), resultGate(), stageResultGap() (+29 more)

### Community 101 - "projectOutbox"
Cohesion: 0.11
Nodes (27): ctoInputIdentityMatches(), ctoInputRecovered(), ADOPTION_STALLED_MS, conversationResolved(), projectOutbox(), syncOutbox(), projectSlackDeliveries(), Input (+19 more)

### Community 102 - "Conversation.tsx"
Cohesion: 0.30
Nodes (10): Conversation(), isLessonDecision(), recommendedReply(), slackMessageStatus(), SlackDeliveryCard(), slackMessageUrl(), ArrowRight, focusRing (+2 more)

### Community 103 - "worker-runtime.ts"
Cohesion: 0.07
Nodes (41): savedStageCompletion(), SlackResultSchema, SlackVerificationSchema, candidateWorkspaceEnvironment(), assignmentSubject(), LessonSelection, catalogLine(), sanitizeObject() (+33 more)

### Community 105 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 106 - "prompts/conversations.ts"
Cohesion: 0.20
Nodes (14): cecChatPrompt(), ctoChatPrompt(), defaultPickupStatus(), PrerequisitesSchema, classifyStop(), stopReason(), boundedCTOContext(), project() (+6 more)

### Community 107 - "diagnostic-context.ts"
Cohesion: 0.29
Nodes (6): assignmentDiagnostics(), diagnosticContext(), itAgent(), itDiagnostics(), currentServices(), Agent

### Community 108 - "leadership.ts"
Cohesion: 0.18
Nodes (9): DailyCTOBriefing, DailyCTOResult, DailyCTOSummary, DailyGoalUpdate, GoalEvidenceRef, GoalEvidenceRequest, GoalProgress, GoalStatus (+1 more)

### Community 109 - "run-accounting.ts"
Cohesion: 0.18
Nodes (17): BoundedRead, backfillClaudeCost(), CompletionReader, readCodexRollout(), codexAccounting(), COMPLETION_MAX_BYTES, completionAccounting(), markCaptureStart() (+9 more)

### Community 110 - "connectWith"
Cohesion: 0.38
Nodes (5): connectWith(), data(), envelope(), JiraWorklogs, WorklogSave

### Community 111 - "featureById"
Cohesion: 0.19
Nodes (8): featureById(), publishFeature(), reconcilePublication(), uncertainPublications(), reserveIdentity(), FeatureReviewRunner, FeatureWorkflow, EffectUncertainError

### Community 112 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 113 - "admit-improvement.ts"
Cohesion: 0.21
Nodes (16): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+8 more)

### Community 114 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 115 - "blocker-followups.ts"
Cohesion: 0.53
Nodes (7): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), readBackConversations(), handoff(), reconcileBlockerFollowups(), BlockerFollowup

### Community 119 - "OfficeConfigView.tsx"
Cohesion: 0.39
Nodes (7): loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView(), policyText(), OfficeConfigSummary, errorText

### Community 120 - "easternDay"
Cohesion: 0.50
Nodes (7): expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), easternDay()

### Community 121 - "delivery-ownership.ts"
Cohesion: 0.33
Nodes (4): Ownership, ownershipContext, refreshDeliveryOwnership(), RefreshOwnership

### Community 122 - "time-readback.ts"
Cohesion: 0.29
Nodes (6): TimeLedger, dueReadback(), Readback, READBACK_INTERVAL_MS, readBackTime(), SETTLE_MS

### Community 123 - "extraction.ts"
Cohesion: 0.33
Nodes (3): extractDocument, Extraction, Extractor

### Community 124 - "office-qa-handoff.ts"
Cohesion: 0.60
Nodes (4): OfficeQAHandoff, OfficeQAHandoffInput, OfficeQAHandoffRequest, QAOwnershipProof

### Community 125 - "wiki-sync.ts"
Cohesion: 0.33
Nodes (3): ACTIONS, OWNER, wikiSync

### Community 126 - "contract.ts"
Cohesion: 0.33
Nodes (4): file, folder, logs, root

### Community 127 - "office-state-view.ts"
Cohesion: 0.60
Nodes (4): leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore()

### Community 128 - "run-cost.ts"
Cohesion: 0.24
Nodes (12): CodexRollout, codexPriceRef(), claudeAccounting(), basisOf(), claudeCost(), codexCost(), toMicroUsd(), unpriced() (+4 more)

### Community 129 - "unblock-brief.ts"
Cohesion: 0.53
Nodes (5): clearUnblockBrief(), key(), saveUnblockBrief(), UnblockBrief, unblockBrief()

### Community 130 - "restoreInPlace"
Cohesion: 0.60
Nodes (5): identity(), Json, plain(), restorable(), restoreInPlace()

### Community 131 - "setup-stop-cap.ts"
Cohesion: 0.60
Nodes (4): confirmSetupStopCap(), consecutiveSetupStops(), SETUP_STOP_CAP, setupStop()

### Community 132 - "highestStableAtLeast"
Cohesion: 0.83
Nodes (3): compare(), highestStableAtLeast(), parts()

## Knowledge Gaps
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `intent.ts`, `.transaction`, `session-bridge.ts`, `continue-ownership-read.ts`, `github-delivery.ts`, `agents.ts`, `run.ts`, `index.tsx`, `knowledge/routes.ts`, `scheduled-captures.ts`, `run-retrospective.ts`, `record-trigger.ts`, `artifact`, `holdReason`, `shared.ts`, `config.ts`, `jira-time.ts`, `maintenance/maintenance.ts`, `cost-ledger.ts`, `cec.ts`, `metadata-assessment.ts`, `interrupted-run-note.ts`, `process.ts`, `closeout-recovery.ts`, `it-specialist.ts`, `cec/issue-publication.ts`, `scheduled-work.ts`, `telemetry.ts`, `dependency-bots/adopt.ts`, `lesson-selection.ts`, `store.ts`, `time-scope.ts`, `verifyRepairCandidate`, `demand-facts.ts`, `features/workflow.ts`, `Engine`, `http/commands.ts`, `inspect-closed-plan.ts`, `continue-access-only-plan.ts`, `weekly-rollup.ts`, `.getEffect`, `daily-cto.ts`, `assignment-poll.ts`, `ticket-evidence.ts`, `remove-candidate.ts`, `pilot-delivery.ts`, `ref_node_crypto`, `Offices`, `.emit`, `StageResult`, `learning-events.ts`, `artifact`, `workKey`, `tracking-issue.ts`, `accept-stage-result.ts`, `outbox.ts`, `api-routes.ts`, `readable-jira-comment.ts`, `cec/workflow.ts`, `ledger.ts`, `goal-reporting.ts`, `GitHubDelivery`, `.save`, `coordination-tick.ts`, `ticket-stage-runner.ts`, `projectOutbox`, `worker-runtime.ts`, `Coordinator`, `prompts/conversations.ts`, `diagnostic-context.ts`, `run-accounting.ts`, `featureById`, `admit-improvement.ts`, `blocker-followups.ts`, `easternDay`, `time-readback.ts`, `office-state-view.ts`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **Should `OrgChart.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1178743961352657 - nodes in this community are weakly interconnected._
- **Why does `TicketJob` connect `shared.ts` to `Inspector.tsx`, `github-delivery.ts`, `App.tsx`, `index.tsx`, `record-trigger.ts`, `artifact`, `holdReason`, `cec.ts`, `metadata-assessment.ts`, `closeout-recovery.ts`, `it-specialist.ts`, `scheduled-work.ts`, `dependency-bots/adopt.ts`, `verifyRepairCandidate`, `work-summary.ts`, `.getEffect`, `goal-reporting.ts`, `assignment-poll.ts`, `remove-candidate.ts`, `pilot-delivery.ts`, `artifact`, `workKey`, `tracking-issue.ts`, `accept-stage-result.ts`, `GitHubDelivery`, `ticket-stage-runner.ts`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Should `intent.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10661268556005399 - nodes in this community are weakly interconnected._
- **Why does `GitHubDelivery` connect `GitHubDelivery` to `process.ts`, `closeout-recovery.ts`, `pilot-delivery.ts`, `github-delivery.ts`, `verifyRepairCandidate`, `.emit`, `artifact`, `workKey`, `artifact`, `holdReason`, `shared.ts`, `accept-stage-result.ts`, `http/commands.ts`, `assignment-poll.ts`, `metadata-assessment.ts`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Should `.transaction` be split into smaller, more focused modules?**
  _Cohesion score 0.11818181818181818 - nodes in this community are weakly interconnected._
- **Should `Inspector.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10696444313840729 - nodes in this community are weakly interconnected._