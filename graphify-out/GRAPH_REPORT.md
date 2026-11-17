# Graph Report - the-office  (2026-11-17)

## Corpus Check
- 862 files · ~339,111 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4182 nodes · 19202 edges · 130 communities (123 shown, 7 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 674 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f51a1dd4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- TimeBook.tsx
- OrgChart.tsx
- dependency-bots/adopt.ts
- .transaction
- Inspector.tsx
- artifact
- session-context-file.ts
- ref_react
- http/commands.ts
- Engine
- worker-runtime.ts
- .getEffect
- App.tsx
- features/workflow.ts
- reader.ts
- scheduled-captures.ts
- run-retrospective.ts
- record-trigger.ts
- fact-bounds.ts
- artifact
- index.tsx
- GitHubDelivery
- work-summary.ts
- telemetry.ts
- lesson-selection.ts
- maintenance/maintenance.ts
- cost-ledger.ts
- DailyCTO.tsx
- knowledge.ts
- jira-time.ts
- metadata-assessment.ts
- agents.ts
- sanitize
- closeout-recovery.ts
- azure.ts
- features.ts
- scheduled-work.ts
- control-store.ts
- pilot-delivery.ts
- config.ts
- continue-ownership-read.ts
- time-scope.ts
- pendingRounds
- ledger.ts
- Role
- harness-baseline.ts
- OfficeScene.tsx
- time-readback.ts
- Store
- assignments.ts
- assignment-poll.ts
- github-context.ts
- dependencies.ts
- inspect-closed-plan.ts
- harnessEffect
- weekly-rollup.ts
- enrollment-gate.ts
- ITFollowUps.tsx
- cec/issue-publication.ts
- blocker-followups.ts
- coordination.ts
- session-bridge.ts
- install-service.mjs
- requeue-waited-implement.ts
- ticket-evidence.ts
- run-accounting.ts
- remove-candidate.ts
- retrospective-subject.ts
- daily-cto.ts
- service-health.ts
- constellation-runtime.ts
- contract.ts
- work.ts
- report.ts
- cost-entries.ts
- Offices
- node-visuals.ts
- daily-cto.ts
- scene-motion.ts
- evidence.ts
- claude-session-context.ts
- workKey
- outbox.ts
- config.ts
- OfficeSnapshot
- RoomCamera.tsx
- agent-activity.ts
- delivery-binding.ts
- ref_node_path
- it-specialist.ts
- cec/workflow.ts
- config.ts
- github-delivery.ts
- .emit
- github/issue-publication.ts
- capture-session-clone.py
- preferences-store.ts
- OfficeConfigView.tsx
- .save
- codex-rollout.ts
- create-candidate.ts
- requests.ts
- workKey
- engine.ts
- ticket-stage-runner.ts
- extract-worker.mjs
- ProjectProgress
- Conversation.tsx
- recovery-ledger.ts
- office-qa-handoff.ts
- highestStableAtLeast
- Coordinator
- CommandRegistry
- admit-improvement.ts
- slack-supersession.ts
- cli.ts
- qa.ts
- qa-plan-continuation.ts
- writer-restart.ts
- read-retries.ts
- session-scope.ts
- evidence-digest.ts
- session-coverage.ts
- continue-access-only-plan.ts
- delivery-ownership.ts
- pre-push-boundary.ts
- QuestionNotifications
- CommittedBrain
- extraction.ts
- cto-replacement-resolution.ts

## God Nodes (most connected - your core abstractions)
1. `Store` - 378 edges
2. `TicketJob` - 172 edges
3. `digest()` - 151 edges
4. `command()` - 120 edges
5. `GitHubDelivery` - 116 edges
6. `artifact()` - 114 edges
7. `workKey()` - 98 edges
8. `OfficeSnapshot` - 88 edges
9. `cx()` - 88 edges
10. `currentAssignment()` - 88 edges

## Surprising Connections (you probably didn't know these)
- `DeliverySlot` --references--> `Role`  [EXTRACTED]
  server/office/projects.ts → src/shared.ts
- `UnrecordedResult` --references--> `StageResult`  [EXTRACTED]
  server/cec/unrecorded-result.ts → src/shared.ts
- `LessonBrainOverlap` --references--> `Lesson`  [EXTRACTED]
  server/knowledge/lesson-brain-audit.ts → src/contracts/knowledge.ts
- `apply()` --indirect_call--> `note()`  [INFERRED]
  src/conversations/OutboxSavedImplementation.tsx → server/cec/parking/resume-parked.ts
- `investigationResolution()` --calls--> `slackMessageUrl()`  [EXTRACTED]
  server/it/investigations/ledger.ts → src/shared.ts

## Import Cycles
- 2-file cycle: `server/scheduling/coordination-pump.ts -> server/scheduling/coordination.ts -> server/scheduling/coordination-pump.ts`
- 2-file cycle: `server/scheduling/coordination-tick.ts -> server/scheduling/coordination.ts -> server/scheduling/coordination-tick.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/track-adopted-review.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/stage-reconciliation.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/publication/metadata-context.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/accept-stage-result.ts -> server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/accept-stage-result.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/implementation/saved-prerequisite-handoff.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/queue-repairs.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/refresh-merge-review.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/closeout/github-closeout.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/knowledge/lesson-exits.ts -> server/scheduling/requests.ts -> server/knowledge/lesson-exits.ts`
- 2-file cycle: `server/conversations/conversations.ts -> server/conversations/cto-conversations.ts -> server/conversations/conversations.ts`
- 2-file cycle: `server/conversations/notifications.ts -> server/conversations/slack.ts -> server/conversations/notifications.ts`
- 2-file cycle: `src/contracts/work.ts -> src/shared.ts -> src/contracts/work.ts`
- 2-file cycle: `src/contracts/people.ts -> src/shared.ts -> src/contracts/people.ts`
- 2-file cycle: `src/contracts/timing.ts -> src/shared.ts -> src/contracts/timing.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-guard.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`

## Communities (130 total, 7 thin omitted)

### Community 0 - "TimeBook.tsx"
Cohesion: 0.17
Nodes (24): BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens(), usd(), KpiTiles(), command() (+16 more)

### Community 1 - "OrgChart.tsx"
Cohesion: 0.07
Nodes (55): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+47 more)

### Community 2 - "dependency-bots/adopt.ts"
Cohesion: 0.16
Nodes (24): Execute, adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, DependabotPR, dependabotPR() (+16 more)

### Community 3 - ".transaction"
Cohesion: 0.11
Nodes (40): featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS, requestReplan(), reserveReplacement() (+32 more)

### Community 4 - "Inspector.tsx"
Cohesion: 0.10
Nodes (69): Outbox(), blockedSummary(), ServiceHealthPanel(), followUp(), labels, ServiceHealthRow(), BlockerFollowups(), LearningCoverage() (+61 more)

### Community 5 - "artifact"
Cohesion: 0.07
Nodes (65): containedFile(), namedRepairIds(), acceptStageResult(), StageContext, METADATA_FINDING, mergeAuthorized(), closeoutRequestResolved(), allowed (+57 more)

### Community 6 - "session-context-file.ts"
Cohesion: 0.21
Nodes (13): ContextFoldPrefix, contextFoldPrefix(), SessionContextCheckpoint, captureSessionContextClone(), ContextReadPhase, SessionContextDeadline, sessionContextFile(), ContextReadChanged (+5 more)

### Community 7 - "ref_react"
Cohesion: 0.07
Nodes (57): KnowledgeActivity, KnowledgeActivityPage, KnowledgeEdge, KnowledgeMap, KnowledgeNode, Activity(), ActivityTimeline(), AssignmentKnowledge() (+49 more)

### Community 8 - "http/commands.ts"
Cohesion: 0.09
Nodes (35): nativeGitRead(), savedImplementation(), sha(), sourceFiles(), ContinuationIO, nativeIO, absent(), candidateParent() (+27 more)

### Community 9 - "Engine"
Cohesion: 0.09
Nodes (5): correlatedBuild(), Engine, observe(), observeParked(), parkedReadError

### Community 10 - "worker-runtime.ts"
Cohesion: 0.07
Nodes (38): savedStageCompletion(), SlackResultSchema, SlackVerificationSchema, candidateWorkspaceEnvironment(), assignmentSubject(), assertBriefingScope(), CODEX_DEFAULT_EFFORT, CODEX_DEFAULT_MODEL (+30 more)

### Community 11 - ".getEffect"
Cohesion: 0.18
Nodes (12): interruptAdoptions(), legacy(), REMOVED_FIELDS, retireLegacyRecovery(), GitHubOperations, goalNoticeNeverDispatched(), closeNativeRefresh(), fingerprint() (+4 more)

### Community 12 - "App.tsx"
Cohesion: 0.07
Nodes (45): BrainDrawer(), themeColor, App(), BrainWorkspace, CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants (+37 more)

### Community 13 - "features/workflow.ts"
Cohesion: 0.07
Nodes (62): approveFeature(), commandFeature(), featureById(), mutation(), reviewQuestions(), assertFeatureDependencyOrder(), featureDependencyEdges(), key() (+54 more)

### Community 14 - "reader.ts"
Cohesion: 0.09
Nodes (35): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, GraphNode (+27 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.14
Nodes (49): createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), CaptureRequest, captureRequest() (+41 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.13
Nodes (30): BLOCKING, BlockingTrigger, blockingTrigger(), isBlocking(), BrainOverlap, brainOverlap(), brainOverlapQuery(), clip() (+22 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.12
Nodes (36): baselineLearning(), LEARNING_BASELINES, maintainLearning(), clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates(), maintenanceCompletedId() (+28 more)

### Community 18 - "fact-bounds.ts"
Cohesion: 0.19
Nodes (18): leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance() (+10 more)

### Community 19 - "artifact"
Cohesion: 0.08
Nodes (68): savedActivationFailure(), candidateInput(), children, oldAdoptionBasis(), SavedCandidateAdmission, savedCandidateAdmission(), assertPostConflictFiles(), assertPostConflictOwnership() (+60 more)

### Community 20 - "index.tsx"
Cohesion: 0.10
Nodes (46): FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures(), SaveFeedback(), TONE (+38 more)

### Community 21 - "GitHubDelivery"
Cohesion: 0.10
Nodes (23): Execute, installDependencies(), major(), HarnessControl, withHarnessWork(), Check, harnessChecks(), harnessValidate() (+15 more)

### Community 22 - "work-summary.ts"
Cohesion: 0.10
Nodes (37): displayAgentTask(), LiveAgentTask(), Props, RunningTask(), text(), AzureBuild, lastWall, sample() (+29 more)

### Community 23 - "telemetry.ts"
Cohesion: 0.10
Nodes (26): CodexRollout, CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL (+18 more)

### Community 24 - "lesson-selection.ts"
Cohesion: 0.11
Nodes (25): fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose() (+17 more)

### Community 25 - "maintenance/maintenance.ts"
Cohesion: 0.06
Nodes (50): ApproachSchema, maintenancePolicies(), captureMaintenanceStep(), completeNativeCheckpoint(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, BrainStatusSchema (+42 more)

### Community 26 - "cost-ledger.ts"
Cohesion: 0.18
Nodes (23): costLedger(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress(), effectId(), OutsideEdit, publishCost() (+15 more)

### Community 27 - "DailyCTO.tsx"
Cohesion: 0.16
Nodes (15): SendMessage, CTOReview(), goalState, DailyCTO(), reportDate(), reviewStatus, blank(), goalInput (+7 more)

### Community 28 - "knowledge.ts"
Cohesion: 0.05
Nodes (54): Accepted, acceptRetrospective(), normalizeStatement(), RETROSPECTIVE_HISTORY, Shared, curateLesson(), Curation, CurationAction (+46 more)

### Community 29 - "jira-time.ts"
Cohesion: 0.22
Nodes (12): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+4 more)

### Community 30 - "metadata-assessment.ts"
Cohesion: 0.11
Nodes (52): PASSING, activeEffectId(), runHarnessStage(), harnessStageResult(), receipt(), harnessDraft(), admitPRMetadata(), assessPRMetadata() (+44 more)

### Community 31 - "agents.ts"
Cohesion: 0.06
Nodes (54): implementationWorkerContext(), cecPrompt(), resolvedDecisionNote(), stageInstructions, capacityInterruptedRun(), providerSaid(), rerunsInterruptedQA(), applies() (+46 more)

### Community 32 - "sanitize"
Cohesion: 0.10
Nodes (28): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+20 more)

### Community 33 - "closeout-recovery.ts"
Cohesion: 0.09
Nodes (53): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+45 more)

### Community 34 - "azure.ts"
Cohesion: 0.09
Nodes (34): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+26 more)

### Community 35 - "features.ts"
Cohesion: 0.19
Nodes (18): FeatureQuestionProjection, OutboxQuestionRound(), send(), draftKey(), readDraft(), saveDraft(), QuestionRound(), nextQuestion() (+10 more)

### Community 36 - "scheduled-work.ts"
Cohesion: 0.12
Nodes (31): freshOwnershipRead(), deliverySlot(), verifiedCloseoutCleanupRequest(), withAmendmentOwnership(), gateFeatureWork(), requestPriority(), closedTicketReport(), closedTicketRequest() (+23 more)

### Community 37 - "control-store.ts"
Cohesion: 0.07
Nodes (30): packedConsumerPnpmRepair(), sha256(), Clock, systemClock, file, project, root, projectById() (+22 more)

### Community 38 - "pilot-delivery.ts"
Cohesion: 0.11
Nodes (27): candidateBranchMoved(), continueImplementation(), drainDelivery(), resume(), startPilot(), OfficeQAHandoffInput, confirmSetupStopCap(), consecutiveSetupStops() (+19 more)

### Community 39 - "config.ts"
Cohesion: 0.06
Nodes (55): implementationPreview(), implementationContinuationRoute(), intakeLocation(), AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), close(), config, itSpecialist (+47 more)

### Community 40 - "continue-ownership-read.ts"
Cohesion: 0.18
Nodes (18): continueOwnershipRead(), continueUnsealedQA(), entry(), expiredOwnershipRead(), handoffOwnership(), ReadbackOwnerDecision, ownershipReadGate(), ownershipReadState() (+10 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.23
Nodes (18): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), scopeSelector(), midnight(), TicketDay, ticketDayTotals(), captureTime(), timeLedger() (+10 more)

### Community 42 - "pendingRounds"
Cohesion: 0.14
Nodes (25): assertQuestionVisibility(), applyHarnessAction(), HarnessActionInput, recoveryPreconditions(), recoveryTarget(), normalizeRound(), pendingQuestions(), canReleaseOrdinary() (+17 more)

### Community 43 - "ledger.ts"
Cohesion: 0.13
Nodes (25): acceptedCompletionResolution(), investigationCandidates(), investigationId(), finishedSubjectResolution(), investigationFollowUps(), implementationReplacementResolution(), interruptedQARerunResolution(), investigationResolution() (+17 more)

### Community 44 - "Role"
Cohesion: 0.15
Nodes (15): ROLES, OfficeCapacity, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch() (+7 more)

### Community 45 - "harness-baseline.ts"
Cohesion: 0.15
Nodes (22): BaselineReport, baselineReport(), BaselineSource, baselineText(), millions(), row(), share(), add() (+14 more)

### Community 46 - "OfficeScene.tsx"
Cohesion: 0.17
Nodes (33): Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk(), ElevatorStage() (+25 more)

### Community 47 - "time-readback.ts"
Cohesion: 0.31
Nodes (6): TimeLedger, Readback, READBACK_INTERVAL_MS, readBackTime(), SETTLE_MS, TimePublication

### Community 48 - "Store"
Cohesion: 0.07
Nodes (14): GitHubFeaturePublisher, JiraFeaturePublisher, Assessment, EffectOperation, Store, checkpointMeasurement(), WorkOutcome, inactivityWatch() (+6 more)

### Community 49 - "assignments.ts"
Cohesion: 0.11
Nodes (24): clip(), DEMAND_LIMIT, demandFacts(), DemandSection, key(), LessonKey, notes(), Binding (+16 more)

### Community 50 - "assignment-poll.ts"
Cohesion: 0.16
Nodes (18): clamp(), LIMITS, MergedPR, plainSlackText(), section(), shippedSummary(), configureNotices(), Identity (+10 more)

### Community 51 - "github-context.ts"
Cohesion: 0.20
Nodes (26): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), ProjectCard, projectCards(), projectGraphql() (+18 more)

### Community 52 - "dependencies.ts"
Cohesion: 0.16
Nodes (19): Admission, admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, resumeParked(), compatible(), dependencyEligibility() (+11 more)

### Community 53 - "inspect-closed-plan.ts"
Cohesion: 0.20
Nodes (11): closedReadonlyPlan(), Document, document(), entryExists(), inspectClosedQAPlan(), qaPlanRetryRoute(), reviewedPlanGuidance, reviewedPlanGuideDigest (+3 more)

### Community 54 - "harnessEffect"
Cohesion: 0.15
Nodes (23): HarnessEffect, harnessEffect(), readBackOrThrow(), retryRead(), ensureTrackingIssue(), findTrackingIssue(), ownTracking(), TrackingIssue (+15 more)

### Community 55 - "weekly-rollup.ts"
Cohesion: 0.12
Nodes (30): expireLearningPackets(), packetReferences(), learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck() (+22 more)

### Community 56 - "enrollment-gate.ts"
Cohesion: 0.22
Nodes (18): currentApproval(), featureGate(), predecessorComplete(), automaticIntakeWait(), recoveryHeld(), publishFeature(), DeliveryPreflight, deliveryPreflight() (+10 more)

### Community 57 - "ITFollowUps.tsx"
Cohesion: 0.67
Nodes (4): itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps()

### Community 58 - "cec/issue-publication.ts"
Cohesion: 0.26
Nodes (4): JiraIssuePublisher, jiraText(), keyOf(), publicationDescription()

### Community 59 - "blocker-followups.ts"
Cohesion: 0.47
Nodes (8): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), readBackConversations(), handoff(), reconcileBlockerFollowups(), BlockerFollowup

### Community 60 - "coordination.ts"
Cohesion: 0.11
Nodes (25): ATTEMPT_DELAYS_MS, dependencyCompletionKey(), BrainFollowup, Result, brainCheckpointCompletion(), reconcileCompletedCheckpoints(), reconcileContinuations(), pruneCompletedReads() (+17 more)

### Community 61 - "session-bridge.ts"
Cohesion: 0.18
Nodes (15): codexDaemonProcesses(), accountCodexProcesses(), CodexProcessInventory, codexProcessInventory(), DesktopSessions, unaccountedProcesses(), idleExecServers(), isExecServer() (+7 more)

### Community 62 - "install-service.mjs"
Cohesion: 0.13
Nodes (10): file, folder, logs, root, Read, GIT_NETWORK, LIVE_PROVIDERS, liveReach() (+2 more)

### Community 63 - "requeue-waited-implement.ts"
Cohesion: 0.17
Nodes (14): devUpdate(), HEADLINE, parksInJira(), OUTCOME, qaComment(), remote(), STAGE, plainWords() (+6 more)

### Community 64 - "ticket-evidence.ts"
Cohesion: 0.20
Nodes (19): assetDownloader(), attachmentKind(), evidenceDirectory(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS, EvidenceAttachment (+11 more)

### Community 65 - "run-accounting.ts"
Cohesion: 0.13
Nodes (30): BoundedRead, done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf(), codexHome(), createdAt() (+22 more)

### Community 66 - "remove-candidate.ts"
Cohesion: 0.18
Nodes (18): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot() (+10 more)

### Community 67 - "retrospective-subject.ts"
Cohesion: 0.11
Nodes (24): deliveryMetrics(), median(), ARTIFACT_LIMIT, clip(), LEDGER_STEPS, MAINTENANCE_LIMIT, maintenanceFacts(), maintenanceSubject() (+16 more)

### Community 68 - "daily-cto.ts"
Cohesion: 0.15
Nodes (16): evidenceRequestConflicts, dailyReviewPrompt(), applyGoalReview(), DailyResultSchema, EvidenceRefSchema, FreshDailyResultSchema, GoalEvidenceRequestSchema, statusAllowed() (+8 more)

### Community 69 - "service-health.ts"
Cohesion: 0.17
Nodes (11): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, slackHealth() (+3 more)

### Community 70 - "constellation-runtime.ts"
Cohesion: 0.09
Nodes (21): CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point, ConstellationRuntime, createConstellation() (+13 more)

### Community 71 - "contract.ts"
Cohesion: 0.23
Nodes (12): At, Errno, errno(), GroupInventory, GroupProbe, LifecycleDiagnostic, Phase, Pid (+4 more)

### Community 72 - "work.ts"
Cohesion: 0.13
Nodes (19): BLOCKED_CAUSES, blockedCauses(), projectReadiness(), ProjectReadiness, AssignmentResult, BlockedCause, CompletionCondition, DeliveryAdmission (+11 more)

### Community 73 - "report.ts"
Cohesion: 0.14
Nodes (22): TelemetryReport, TelemetryRow, TelemetrySync, ConfirmedSegment, LiveAnchor, ObservationGap, SnapshotOrdering, TimeLedgerState (+14 more)

### Community 74 - "cost-entries.ts"
Cohesion: 0.18
Nodes (14): isModelWork(), isTicketModelWork(), ScopePolicy, captureCost(), summary(), awaitingEvidence(), CaptureContext, inCostWindow() (+6 more)

### Community 75 - "Offices"
Cohesion: 0.20
Nodes (3): Offices, markCaptureStart(), SessionBridge

### Community 76 - "node-visuals.ts"
Cohesion: 0.20
Nodes (14): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+6 more)

### Community 77 - "daily-cto.ts"
Cohesion: 0.17
Nodes (7): DailyCTO, EvidenceRequestConflict, queueGoalEvidenceRequest(), Briefing, saveReviewBriefing(), ControlStore, DailyCTOReport

### Community 78 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 79 - "evidence.ts"
Cohesion: 0.23
Nodes (10): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_SOURCE_PATHS, officeSource() (+2 more)

### Community 80 - "claude-session-context.ts"
Cohesion: 0.18
Nodes (12): claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexSessionContext(), readRollout, LiveSession, ContextProject (+4 more)

### Community 81 - "workKey"
Cohesion: 0.06
Nodes (74): recordJobApproach(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal (+66 more)

### Community 82 - "outbox.ts"
Cohesion: 0.19
Nodes (15): ADOPTION_STALLED_MS, projectOutbox(), syncOutbox(), finishSupersededReadback(), projectSlackDeliveries(), Input, supersedeSlackDelivery(), replacementContext() (+7 more)

### Community 83 - "config.ts"
Cohesion: 0.07
Nodes (31): IntakeBinding, intakeEnumeration(), intakeJql(), intakeMembership(), projectListScope(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt() (+23 more)

### Community 84 - "OfficeSnapshot"
Cohesion: 0.08
Nodes (37): knowledgeOutbox(), LessonDecisionAction, lessonDecisionState(), readLessonDecision(), DAYS, dueLessonDecisions(), easternWeek(), LESSON_DIGEST (+29 more)

### Community 85 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (7): CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility, overlayEntranceDelays(), SceneOverlay()

### Community 86 - "agent-activity.ts"
Cohesion: 0.38
Nodes (4): itAgent(), itDiagnostics(), withoutElapsed(), Agent

### Community 87 - "delivery-binding.ts"
Cohesion: 0.19
Nodes (11): APPROACH_GUIDANCE, reviewInstructions(), deliveryTask(), DeliveryTaskInput, DISCOVERY_GUIDANCE, compactSteps(), featureDeliveryContext(), featureEffectGate() (+3 more)

### Community 88 - "ref_node_path"
Cohesion: 0.06
Nodes (65): GitRead, patchArgs, sourceCopyMatches(), interruptedImplementation(), verifyContinuationPreservation(), removeAdoptedClone(), pinCourierIdentityRefusal(), pinCourierVerifiedCommit() (+57 more)

### Community 89 - "it-specialist.ts"
Cohesion: 0.31
Nodes (8): ITContext, informationalRecovery(), publishITReport(), delays, recoverAttempt(), ITFollowUp, ITReport, ITState

### Community 90 - "cec/workflow.ts"
Cohesion: 0.23
Nodes (9): applyIntakeObservation(), MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), nextStage(), safeWebUrl(), qaCriteria(), contained() (+1 more)

### Community 91 - "config.ts"
Cohesion: 0.12
Nodes (28): CommentPage, commentReadback(), Assignment, Content, Transition, JiraOperations, jiraRecord(), unpack() (+20 more)

### Community 92 - "github-delivery.ts"
Cohesion: 0.05
Nodes (104): writerRestartInstruction(), harnessCloseout(), verifyMergeActions(), findingsBlock(), assertDeliveryMayMutate(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers() (+96 more)

### Community 93 - ".emit"
Cohesion: 0.13
Nodes (18): followResume(), note(), reconcileAndResumeParked(), channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice() (+10 more)

### Community 94 - "github/issue-publication.ts"
Cohesion: 0.19
Nodes (7): FeaturePublisher, PublicationReceipt, GitHubIssuePublisher, number(), same(), FeatureManifestItem, FeatureOperation

### Community 96 - "preferences-store.ts"
Cohesion: 0.11
Nodes (19): PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, acceptPreferences(), PreferenceCandidate, PreferenceState (+11 more)

### Community 97 - "OfficeConfigView.tsx"
Cohesion: 0.43
Nodes (6): loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView(), OfficeConfigSummary, errorText

### Community 98 - ".save"
Cohesion: 0.13
Nodes (39): resolveBlockedTransition(), document(), transitionWithComment(), jiraAccount(), jiraCollection(), JiraCredential, jiraCredential(), KEYCHAIN_SERVICE (+31 more)

### Community 99 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 100 - "create-candidate.ts"
Cohesion: 0.48
Nodes (6): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf()

### Community 101 - "requests.ts"
Cohesion: 0.08
Nodes (39): ownershipReadHistory(), recoverCTOInput(), deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, requireDeliveryAuthority(), deliveryIntakeBlocker() (+31 more)

### Community 102 - "workKey"
Cohesion: 0.14
Nodes (21): nextAttemptAt(), restartStoppedWriters(), unchangedSinceAccepted(), NOT_RETRYABLE, WRITER_STAGES, WriterRestartCandidate, writerRestartCandidate(), writerRestarted() (+13 more)

### Community 103 - "engine.ts"
Cohesion: 0.24
Nodes (12): checkMail(), drainMail(), requestMail(), dispatchNightly(), enableNightly(), requestDelivery(), eligibility(), ingest() (+4 more)

### Community 104 - "ticket-stage-runner.ts"
Cohesion: 0.18
Nodes (26): run(), verifiedTransition(), UnrecordedResult, unrecordedStageResult(), publicationEvidenceGap(), qaEvidenceGap(), stageResultGap(), afterDraft() (+18 more)

### Community 105 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 107 - "Conversation.tsx"
Cohesion: 0.32
Nodes (10): Conversation(), isLessonDecision(), recommendedReply(), slackMessageStatus(), SlackDeliveryCard(), slackMessageUrl(), ExternalLink, focusRing (+2 more)

### Community 108 - "recovery-ledger.ts"
Cohesion: 0.26
Nodes (9): savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), diagnosticSnapshot(), nativeDeliveryResolved(), reconcileRecoveryLedger(), stoppedBaseUpdateUnresolved() (+1 more)

### Community 109 - "office-qa-handoff.ts"
Cohesion: 0.60
Nodes (4): OfficeQAHandoff, OfficeQAHandoffInput, OfficeQAHandoffRequest, QAOwnershipProof

### Community 110 - "highestStableAtLeast"
Cohesion: 0.83
Nodes (3): compare(), highestStableAtLeast(), parts()

### Community 111 - "Coordinator"
Cohesion: 0.08
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 112 - "CommandRegistry"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 113 - "admit-improvement.ts"
Cohesion: 0.17
Nodes (20): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementIntakeGate(), improvementManifest() (+12 more)

### Community 114 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 115 - "cli.ts"
Cohesion: 0.18
Nodes (8): args, [cmd,...rawArgs], commands, key, projectIndex, LessonBrainAudit, lessonBrainAudit(), LessonBrainOverlap

### Community 119 - "read-retries.ts"
Cohesion: 0.31
Nodes (9): classifyStop(), ReviewWait, incompleteReadOutput(), planReadRetry(), reconcileReadRetries(), temporaryReadFailure(), StopKind, WorkFailure (+1 more)

### Community 120 - "session-scope.ts"
Cohesion: 0.29
Nodes (8): retainSessionMessage(), SessionConversation, jiraCommandIssues(), scopeParser(), ScopeParserState, ScopeProject, sessionScopeParser(), siteHost()

### Community 121 - "evidence-digest.ts"
Cohesion: 0.44
Nodes (7): canonical(), evidenceDigest(), evidenceHash(), semantic(), stableUrl(), requirementDrift(), RequirementPostimage

### Community 122 - "session-coverage.ts"
Cohesion: 0.36
Nodes (7): claudeSessions(), completeSessionCoverage(), desktopCoverageGap(), knownActivity(), Report, unexplained(), sessionInventoryFailureDetail()

### Community 123 - "continue-access-only-plan.ts"
Cohesion: 0.54
Nodes (6): Document, document(), isAccessOnlyPlan(), settledAccessOnlyState(), continueAccessOnlyPlan(), entryExists()

### Community 124 - "delivery-ownership.ts"
Cohesion: 0.33
Nodes (4): Ownership, ownershipContext, refreshDeliveryOwnership(), RefreshOwnership

### Community 125 - "pre-push-boundary.ts"
Cohesion: 0.43
Nodes (5): Event, one(), prePushRejection(), PushIdentity, settledPushBoundary()

### Community 128 - "extraction.ts"
Cohesion: 0.33
Nodes (3): extractDocument, Extraction, Extractor

### Community 129 - "cto-replacement-resolution.ts"
Cohesion: 0.60
Nodes (3): ctoInputIdentityMatches(), ctoInputRecovered(), ctoReplacementResolution()

## Knowledge Gaps
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `cto-replacement-resolution.ts`, `dependency-bots/adopt.ts`, `.transaction`, `OrgChart.tsx`, `artifact`, `http/commands.ts`, `worker-runtime.ts`, `.getEffect`, `features/workflow.ts`, `reader.ts`, `scheduled-captures.ts`, `run-retrospective.ts`, `record-trigger.ts`, `fact-bounds.ts`, `artifact`, `lesson-selection.ts`, `maintenance/maintenance.ts`, `cost-ledger.ts`, `knowledge.ts`, `jira-time.ts`, `metadata-assessment.ts`, `agents.ts`, `sanitize`, `closeout-recovery.ts`, `azure.ts`, `scheduled-work.ts`, `control-store.ts`, `pilot-delivery.ts`, `config.ts`, `continue-ownership-read.ts`, `time-scope.ts`, `pendingRounds`, `ledger.ts`, `Role`, `time-readback.ts`, `assignments.ts`, `assignment-poll.ts`, `github-context.ts`, `dependencies.ts`, `inspect-closed-plan.ts`, `harnessEffect`, `weekly-rollup.ts`, `enrollment-gate.ts`, `blocker-followups.ts`, `coordination.ts`, `session-bridge.ts`, `requeue-waited-implement.ts`, `ticket-evidence.ts`, `run-accounting.ts`, `remove-candidate.ts`, `retrospective-subject.ts`, `daily-cto.ts`, `cost-entries.ts`, `Offices`, `evidence.ts`, `workKey`, `outbox.ts`, `config.ts`, `delivery-binding.ts`, `ref_node_path`, `it-specialist.ts`, `config.ts`, `github-delivery.ts`, `.emit`, `.save`, `create-candidate.ts`, `requests.ts`, `workKey`, `engine.ts`, `ticket-stage-runner.ts`, `recovery-ledger.ts`, `admit-improvement.ts`, `read-retries.ts`, `continue-access-only-plan.ts`, `QuestionNotifications`?**
  _High betweenness centrality (0.094) - this node is a cross-community bridge._
- **Should `OrgChart.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07077625570776255 - nodes in this community are weakly interconnected._
- **Why does `OfficeSnapshot` connect `OrgChart.tsx` to `TimeBook.tsx`, `cto-replacement-resolution.ts`, `Inspector.tsx`, `ref_react`, `.getEffect`, `App.tsx`, `record-trigger.ts`, `fact-bounds.ts`, `index.tsx`, `work-summary.ts`, `maintenance/maintenance.ts`, `DailyCTO.tsx`, `azure.ts`, `control-store.ts`, `config.ts`, `ledger.ts`, `harness-baseline.ts`, `OfficeScene.tsx`, `Store`, `service-health.ts`, `work.ts`, `scene-motion.ts`, `outbox.ts`, `OfficeSnapshot`, `agent-activity.ts`, `cec/workflow.ts`, `preferences-store.ts`, `Conversation.tsx`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Should `.transaction` be split into smaller, more focused modules?**
  _Cohesion score 0.10847457627118644 - nodes in this community are weakly interconnected._
- **Why does `Role` connect `OrgChart.tsx` to `Inspector.tsx`, `artifact`, `http/commands.ts`, `worker-runtime.ts`, `App.tsx`, `GitHubDelivery`, `maintenance/maintenance.ts`, `agents.ts`, `sanitize`, `control-store.ts`, `config.ts`, `Role`, `OfficeScene.tsx`, `Store`, `run-accounting.ts`, `retrospective-subject.ts`, `work.ts`, `scene-motion.ts`, `outbox.ts`, `config.ts`, `OfficeSnapshot`, `github-delivery.ts`, `.emit`, `ticket-stage-runner.ts`, `Conversation.tsx`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Should `Inspector.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10237203495630462 - nodes in this community are weakly interconnected._
- **Should `artifact` be split into smaller, more focused modules?**
  _Cohesion score 0.07459207459207459 - nodes in this community are weakly interconnected._