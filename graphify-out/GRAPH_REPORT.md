# Graph Report - the-office  (2026-11-17)

## Corpus Check
- 870 files · ~341,261 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4228 nodes · 19368 edges · 115 communities (110 shown, 5 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 675 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `203a4865`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- TimeBook.tsx
- OrgChart.tsx
- copy.ts
- Store
- Inspector.tsx
- sanitize
- session-bridge.ts
- ref_react
- digest
- github-delivery.ts
- agents.ts
- lesson-selection.ts
- App.tsx
- features.ts
- reader.ts
- scheduled-captures.ts
- run-retrospective.ts
- record-trigger.ts
- goal-reporting.ts
- artifact
- index.tsx
- shared.ts
- superseded-receipts.ts
- goal-reviews.ts
- task-briefing.ts
- maintenance/maintenance.ts
- cost-ledger.ts
- api-routes.ts
- knowledge.ts
- jira-time.ts
- metadata-assessment.ts
- agents.ts
- azure.ts
- closeout-recovery.ts
- cec-reads.ts
- JiraIssuePublisher
- scheduled-work.ts
- run-accounting.ts
- dependency-bots/adopt.ts
- index.ts
- projects.ts
- time-scope.ts
- github-delivery.ts
- ledger.ts
- cec-reads.ts
- harness-baseline.ts
- OfficeScene.tsx
- time-readback.ts
- command
- node-visuals.ts
- control-store.ts
- resume-provider-review.ts
- assignments.ts
- inspect-closed-plan.ts
- cli.ts
- weekly-rollup.ts
- features/workflow.ts
- requests.ts
- DailyCTO.tsx
- scene-motion.ts
- .emit
- http/commands.ts
- RoomCamera.tsx
- report-evidence.ts
- ticket-evidence.ts
- telemetry.ts
- remove-candidate.ts
- retrospective-subject.ts
- createConstellation
- owned-artifact.ts
- constellation-runtime.ts
- process.ts
- work.ts
- report.ts
- codex-rollout.ts
- offices.ts
- codex-rollout-file.ts
- ControlStore
- scheduler.ts
- run-evidence.ts
- ref_node_path
- artifact
- run-usage.ts
- evidenceText
- index.tsx
- .getEffect
- publish-pr.ts
- OfficeSnapshot
- config.ts
- restart-writer.ts
- conversations/slack.ts
- github/issue-publication.ts
- capture-session-clone.py
- .save
- accept-stage-result.ts
- Store
- worker-runtime.ts
- pilot-delivery.ts
- extract-worker.mjs
- retire-history.ts
- continueAccessOnlyPlan
- pre-push-boundary.ts
- coordination.ts
- CommandRegistry
- admit-improvement.ts
- slack-supersession.ts
- office-qa-handoff.ts
- qa.ts
- qa-plan-continuation.ts
- writer-restart.ts
- ci-preparation.ts
- ProjectProgress
- pilot-delivery.ts
- delivery-ownership.ts
- setup-stop-cap.ts

## God Nodes (most connected - your core abstractions)
1. `Store` - 379 edges
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
- `EffectOperation` --references--> `WorkRef`  [EXTRACTED]
  server/store/effects.ts → src/contracts/work.ts
- `apply()` --indirect_call--> `note()`  [INFERRED]
  src/conversations/OutboxSavedImplementation.tsx → server/cec/parking/resume-parked.ts

## Import Cycles
- 2-file cycle: `server/scheduling/coordination-pump.ts -> server/scheduling/coordination.ts -> server/scheduling/coordination-pump.ts`
- 2-file cycle: `server/scheduling/coordination-tick.ts -> server/scheduling/coordination.ts -> server/scheduling/coordination-tick.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/track-adopted-review.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/stage-reconciliation.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/publication/metadata-context.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/accept-stage-result.ts -> server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/accept-stage-result.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/implementation/saved-prerequisite-handoff.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/refresh-merge-review.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/closeout/github-closeout.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/queue-repairs.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/knowledge/lesson-exits.ts -> server/scheduling/requests.ts -> server/knowledge/lesson-exits.ts`
- 2-file cycle: `server/conversations/conversations.ts -> server/conversations/cto-conversations.ts -> server/conversations/conversations.ts`
- 2-file cycle: `server/conversations/notifications.ts -> server/conversations/slack.ts -> server/conversations/notifications.ts`
- 2-file cycle: `src/contracts/work.ts -> src/shared.ts -> src/contracts/work.ts`
- 2-file cycle: `src/contracts/people.ts -> src/shared.ts -> src/contracts/people.ts`
- 2-file cycle: `src/contracts/timing.ts -> src/shared.ts -> src/contracts/timing.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-guard.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`

## Communities (115 total, 5 thin omitted)

### Community 0 - "TimeBook.tsx"
Cohesion: 0.08
Nodes (45): TelemetryReport, displayAgentTask(), withoutElapsed(), LiveAgentTask(), Props, RunningTask(), text(), Agent (+37 more)

### Community 1 - "OrgChart.tsx"
Cohesion: 0.12
Nodes (39): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+31 more)

### Community 2 - "copy.ts"
Cohesion: 0.10
Nodes (22): file, folder, logs, root, nativeGitRead(), savedImplementation(), sha(), sourceFiles() (+14 more)

### Community 3 - "Store"
Cohesion: 0.10
Nodes (30): packedConsumerPnpmRepair(), sha256(), featureItemComplete(), reconcileFeatureCompletion(), readEvidence(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS (+22 more)

### Community 4 - "Inspector.tsx"
Cohesion: 0.09
Nodes (74): SendMessage, blockedSummary(), ServiceHealthPanel(), followUp(), labels, ServiceHealthRow(), BlockerFollowups(), LearningCoverage() (+66 more)

### Community 5 - "sanitize"
Cohesion: 0.08
Nodes (37): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+29 more)

### Community 6 - "session-bridge.ts"
Cohesion: 0.05
Nodes (56): claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexDaemonProcesses(), accountCodexProcesses(), CodexProcessInventory, codexProcessInventory() (+48 more)

### Community 7 - "ref_react"
Cohesion: 0.08
Nodes (56): KnowledgeActivity, KnowledgeActivityPage, KnowledgeEdge, KnowledgeMap, KnowledgeNode, Activity(), ActivityTimeline(), AssignmentKnowledge() (+48 more)

### Community 8 - "digest"
Cohesion: 0.09
Nodes (41): ImplementationDecision, OwnershipRead, interruptedImplementation(), continueOwnershipRead(), continueUnsealedQA(), entry(), expiredOwnershipRead(), handoffOwnership() (+33 more)

### Community 9 - "github-delivery.ts"
Cohesion: 0.09
Nodes (55): deliveryIntakeBlocker(), resumeProviderReviews(), hasUncertainEffects(), observe(), assertAutomationEffects(), automationMergePolicy(), observeAutomationMerge(), checksFailed() (+47 more)

### Community 10 - "agents.ts"
Cohesion: 0.09
Nodes (32): implementationWorkerContext(), savedStageCompletion(), assertContinuableWorktree(), CONTINUABLE, continuationPrompt(), MAX_CONTINUATIONS, recordedContinuation(), StageContinuation (+24 more)

### Community 11 - "lesson-selection.ts"
Cohesion: 0.11
Nodes (22): officeKnowledgeSnapshot(), lessonForProject(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), MAINTENANCE (+14 more)

### Community 12 - "App.tsx"
Cohesion: 0.05
Nodes (65): compactSteps(), BrainDrawer(), themeColor, App(), BrainWorkspace, CONNECTION, CONNECTION_DOT, dockItemVariants (+57 more)

### Community 13 - "features.ts"
Cohesion: 0.10
Nodes (39): commandFeature(), reviewQuestions(), confirmBrief(), applyHarnessAction(), HarnessActionInput, recoveryPreconditions(), recoveryTarget(), normalizeRound() (+31 more)

### Community 14 - "reader.ts"
Cohesion: 0.11
Nodes (22): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, CommittedBrain (+14 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.16
Nodes (41): createFeature(), assertEnrollable(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), CaptureRequest, captureRequest(), captureRequests() (+33 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.09
Nodes (44): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, BlockingTrigger, blockingTrigger(), isBlocking() (+36 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.12
Nodes (34): LEARNING_BASELINES, maintainLearning(), clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates(), maintenanceCompletedId(), maintenanceKey() (+26 more)

### Community 18 - "goal-reporting.ts"
Cohesion: 0.11
Nodes (31): githubPRDescription(), leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), collectCTOFacts(), boundedIntake(), boundedJobs() (+23 more)

### Community 19 - "artifact"
Cohesion: 0.08
Nodes (52): completedPRReviews(), assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), reconcileCompletedConflictDraft(), routeReadyPostConflictPublication() (+44 more)

### Community 20 - "index.tsx"
Cohesion: 0.11
Nodes (41): LessonsView(), SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS, PickupForm() (+33 more)

### Community 21 - "shared.ts"
Cohesion: 0.05
Nodes (55): ctoInputIdentityMatches(), ctoInputRecovered(), ADOPTION_STALLED_MS, conversationResolved(), projectOutbox(), checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup() (+47 more)

### Community 22 - "superseded-receipts.ts"
Cohesion: 0.27
Nodes (8): Attempt, needsResumeReconciliation(), REVIEW_STAGES, stoppedInSetup(), Receipt, Settled, SETTLED_RECEIPT_NOTE, supersededReceipt()

### Community 23 - "goal-reviews.ts"
Cohesion: 0.13
Nodes (17): applyGoalReview(), DailyResultSchema, EvidenceRefSchema, FreshDailyResultSchema, statusAllowed(), workEvidence(), GoalInput, saveGoal() (+9 more)

### Community 24 - "task-briefing.ts"
Cohesion: 0.14
Nodes (20): guidanceExcerpt(), citations(), recordAcceptedKnowledge(), stageName(), knowledgeCitation(), lessonCitation(), officeSearch(), retrieve() (+12 more)

### Community 25 - "maintenance/maintenance.ts"
Cohesion: 0.09
Nodes (30): maintenancePolicies(), captureLearning(), captureMaintenanceStep(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice() (+22 more)

### Community 26 - "cost-ledger.ts"
Cohesion: 0.18
Nodes (24): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId(), OutsideEdit (+16 more)

### Community 27 - "api-routes.ts"
Cohesion: 0.16
Nodes (17): implementationPreview(), implementationContinuationRoute(), qaPlanRetryRoute(), goalHistory(), apiRoute(), RequestContext, preferencesRoute(), PreferencesRouteContext (+9 more)

### Community 28 - "knowledge.ts"
Cohesion: 0.09
Nodes (26): BRAIN_SCOPE, SUBJECT, Kind, RetrospectiveResult, RetrospectiveResultSchema, RollupResultSchema, Stage, ImprovementGrant (+18 more)

### Community 29 - "jira-time.ts"
Cohesion: 0.22
Nodes (13): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+5 more)

### Community 30 - "metadata-assessment.ts"
Cohesion: 0.19
Nodes (30): admitPRMetadata(), assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema, savedMetadataAssessment(), validateSaved(), metadataClaim() (+22 more)

### Community 31 - "agents.ts"
Cohesion: 0.18
Nodes (19): cecPrompt(), resolvedDecisionNote(), stageInstructions, applies(), interruptedRunNote(), placeholder(), withoutInterruptedResult(), qaPlanEvidenceGap() (+11 more)

### Community 32 - "azure.ts"
Cohesion: 0.16
Nodes (20): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+12 more)

### Community 33 - "closeout-recovery.ts"
Cohesion: 0.09
Nodes (44): APPROACH_GUIDANCE, reviewInstructions(), deliveryTask(), DeliveryTaskInput, closeoutReceipt(), DISCOVERY_GUIDANCE, assertCoreCloseoutCoverage(), Assessment (+36 more)

### Community 34 - "cec-reads.ts"
Cohesion: 0.18
Nodes (15): IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), intakeMembership(), projectListScope(), cecIntakePrompt(), cecReadbackPrompt() (+7 more)

### Community 35 - "JiraIssuePublisher"
Cohesion: 0.21
Nodes (5): JiraIssuePublisher, jiraText(), descriptionPreimage(), plain(), publicationDescription()

### Community 36 - "scheduled-work.ts"
Cohesion: 0.12
Nodes (32): freshOwnershipRead(), deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), withAmendmentOwnership(), metadataRequestResolved(), preparationRequestResolved(), gateFeatureWork() (+24 more)

### Community 37 - "run-accounting.ts"
Cohesion: 0.18
Nodes (18): readCodexRollout(), HELPER_STDOUT_MAX_BYTES, helperAccounting(), claudeAccounting(), codexAccounting(), COMPLETION_MAX_BYTES, completionAccounting(), merge() (+10 more)

### Community 38 - "dependency-bots/adopt.ts"
Cohesion: 0.10
Nodes (41): Execute, readBackOrThrow(), adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, DependabotPR (+33 more)

### Community 39 - "index.ts"
Cohesion: 0.08
Nodes (24): close(), config, itSpecialist, loadedRevision, offices, releaseLock, server, serviceHealth (+16 more)

### Community 40 - "projects.ts"
Cohesion: 0.08
Nodes (38): AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), goalEvidencePath(), DATA, file, project, root, OfficeConfigInputs (+30 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.10
Nodes (37): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence(), CaptureContext (+29 more)

### Community 42 - "github-delivery.ts"
Cohesion: 0.05
Nodes (54): writerRestartInstruction(), assertDeliveryMayMutate(), HarnessControl, withHarnessWork(), runHarnessStage(), harnessDelivers(), legacyRecovery(), BOARD_RULE (+46 more)

### Community 43 - "ledger.ts"
Cohesion: 0.05
Nodes (68): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), partialLocalCleanupKey(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved() (+60 more)

### Community 44 - "cec-reads.ts"
Cohesion: 0.08
Nodes (21): cecReconcilePrompt(), consumeQAPlanRetry(), cecChatPrompt(), ctoChatPrompt(), itChatPrompt(), slackSendPrompt(), slackVerifyPrompt(), PICKUP_CHAT (+13 more)

### Community 45 - "harness-baseline.ts"
Cohesion: 0.15
Nodes (22): BaselineReport, baselineReport(), BaselineSource, baselineText(), millions(), row(), share(), add() (+14 more)

### Community 46 - "OfficeScene.tsx"
Cohesion: 0.17
Nodes (32): Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk(), ElevatorStage() (+24 more)

### Community 47 - "time-readback.ts"
Cohesion: 0.30
Nodes (7): timeLedger(), TimeLedger, dueReadback(), Readback, READBACK_INTERVAL_MS, readBackTime(), SETTLE_MS

### Community 48 - "command"
Cohesion: 0.07
Nodes (15): correlatedBuild(), checkMail(), drainMail(), requestMail(), enableNightly(), ingest(), GitHubMonitor, drainMaintenance() (+7 more)

### Community 49 - "node-visuals.ts"
Cohesion: 0.20
Nodes (14): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+6 more)

### Community 50 - "control-store.ts"
Cohesion: 0.08
Nodes (31): approveMerge(), assertHarnessMayMerge(), HUMAN_MERGE, Clock, systemClock, BEFORE_POLICY, Project, ProjectPolicy (+23 more)

### Community 51 - "resume-provider-review.ts"
Cohesion: 0.16
Nodes (31): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), ProjectCard, projectCards(), projectGraphql() (+23 more)

### Community 52 - "assignments.ts"
Cohesion: 0.12
Nodes (21): clip(), DEMAND_LIMIT, demandFacts(), key(), LessonKey, notes(), AssignmentLookups, Binding (+13 more)

### Community 53 - "inspect-closed-plan.ts"
Cohesion: 0.22
Nodes (10): closedReadonlyPlan(), Document, document(), entryExists(), inspectClosedQAPlan(), reviewedPlanGuidance, reviewedPlanGuideDigest, QAPlanRetry (+2 more)

### Community 54 - "cli.ts"
Cohesion: 0.14
Nodes (9): args, [cmd,...rawArgs], commands, key, projectIndex, LessonBrainAudit, lessonBrainAudit(), LessonBrainOverlap (+1 more)

### Community 55 - "weekly-rollup.ts"
Cohesion: 0.13
Nodes (26): learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), RollupResult (+18 more)

### Community 56 - "features/workflow.ts"
Cohesion: 0.09
Nodes (52): approveFeature(), featureById(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), discoveryPrompt(), planPrompt() (+44 more)

### Community 57 - "requests.ts"
Cohesion: 0.06
Nodes (64): removeAdoptedClone(), namedRepairIds(), deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, requireDeliveryAuthority(), gateRegisteredDelivery() (+56 more)

### Community 58 - "DailyCTO.tsx"
Cohesion: 0.32
Nodes (8): CTOReview(), goalState, DailyCTO(), reportDate(), reviewStatus, InlineText(), reviewExcerpt(), ReviewText()

### Community 59 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 60 - ".emit"
Cohesion: 0.10
Nodes (30): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), clamp() (+22 more)

### Community 61 - "http/commands.ts"
Cohesion: 0.13
Nodes (26): assertOwnership(), decideImplementation(), Decision, requestQAPlanRetry(), bindDiscoveryResume(), DiscoveryResumeInput, enqueueMetadataRecovery(), normalizeStatement() (+18 more)

### Community 62 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (7): CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility, overlayEntranceDelays(), SceneOverlay()

### Community 63 - "report-evidence.ts"
Cohesion: 0.26
Nodes (10): safeWebUrl(), officeValidation(), qaCriteria(), contained(), officeQAEvidenceGap(), BROWSER_QA_LIMIT_MS, qaTimeLimit(), qaTimeLimitGuidance() (+2 more)

### Community 64 - "ticket-evidence.ts"
Cohesion: 0.10
Nodes (35): assetDownloader(), attachmentKind(), evidenceDirectory(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS, EvidenceAttachment (+27 more)

### Community 65 - "telemetry.ts"
Cohesion: 0.11
Nodes (24): CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL, Rates (+16 more)

### Community 66 - "remove-candidate.ts"
Cohesion: 0.15
Nodes (22): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot() (+14 more)

### Community 67 - "retrospective-subject.ts"
Cohesion: 0.15
Nodes (19): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+11 more)

### Community 68 - "createConstellation"
Cohesion: 0.18
Nodes (5): ConstellationRuntime, createConstellation(), enter(), finishTap(), move()

### Community 69 - "owned-artifact.ts"
Cohesion: 0.42
Nodes (7): BoundedRead, done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf(), CompletionReader

### Community 70 - "constellation-runtime.ts"
Cohesion: 0.15
Nodes (16): CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point, focusOverlayMotion(), FocusOverlayLayout (+8 more)

### Community 71 - "process.ts"
Cohesion: 0.14
Nodes (17): Result, inactivityWatch(), At, Errno, errno(), GroupInventory, GroupProbe, LifecycleDiagnostic (+9 more)

### Community 72 - "work.ts"
Cohesion: 0.09
Nodes (27): ReviewWait, BLOCKED_CAUSES, blockedCauses(), projectReadiness(), READ_OPERATIONS, RETAINED_PER_ACTION, explanation(), LABELS (+19 more)

### Community 73 - "report.ts"
Cohesion: 0.18
Nodes (16): snapshot(), sanitizeObject(), telemetryRoute(), parseWorkerResult(), Acc, bump(), EASTERN, easternDay() (+8 more)

### Community 74 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 75 - "offices.ts"
Cohesion: 0.15
Nodes (3): QuestionNotifications, Offices, markCaptureStart()

### Community 76 - "codex-rollout-file.ts"
Cohesion: 0.36
Nodes (7): codexHome(), createdAt(), dayDirs(), header(), ROLLOUT_MAX_BYTES, RolloutScan, scanCodexRollouts()

### Community 77 - "ControlStore"
Cohesion: 0.13
Nodes (11): DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), dailyReviewDate(), reviewWeekday(), queueGoalEvidenceRequest(), Briefing (+3 more)

### Community 78 - "scheduler.ts"
Cohesion: 0.14
Nodes (15): ROLES, OfficeCapacity, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch() (+7 more)

### Community 79 - "run-evidence.ts"
Cohesion: 0.38
Nodes (5): comparable(), EvidenceOutcome, recordRunEvidence(), backfillClaudeCost(), RunAccounting

### Community 80 - "ref_node_path"
Cohesion: 0.08
Nodes (47): GitRead, patchArgs, sourceCopyMatches(), verifyContinuationPreservation(), adoptCandidate(), reported, Scope, advisoryPM() (+39 more)

### Community 81 - "artifact"
Cohesion: 0.06
Nodes (96): containedFile(), closeoutCheckpoint(), closeoutRecoveryCandidate(), CloseoutRecoveryKind, coreCloseoutNative(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration() (+88 more)

### Community 82 - "run-usage.ts"
Cohesion: 0.38
Nodes (5): CodexRollout, claudeCrashZero(), claudeUsage(), count(), RunUsage

### Community 83 - "evidenceText"
Cohesion: 0.80
Nodes (4): evidenceText(), field(), jsonString(), opening()

### Community 84 - "index.tsx"
Cohesion: 0.11
Nodes (29): FeatureQuestionProjection, OutboxQuestionRound(), send(), FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), send() (+21 more)

### Community 86 - ".getEffect"
Cohesion: 0.15
Nodes (15): diagnosticProof(), ownedArtifact(), rawHash(), recoverDiscovery(), scopeNote(), GitHubOperations, fileLessonIssue(), lessonIssueBody() (+7 more)

### Community 89 - "publish-pr.ts"
Cohesion: 0.12
Nodes (30): activeEffectId(), HarnessEffect, harnessEffect(), retryRead(), dispatchedMetadataEffect(), commitlintRejection(), developerPRContent(), Execute (+22 more)

### Community 90 - "OfficeSnapshot"
Cohesion: 0.08
Nodes (46): knowledgeOutbox(), Conversation(), LessonDecisionAction, lessonDecisionState(), readLessonDecision(), DAYS, dueLessonDecisions(), easternWeek() (+38 more)

### Community 91 - "config.ts"
Cohesion: 0.10
Nodes (35): CommentPage, commentReadback(), devUpdate(), HEADLINE, Assignment, Content, Transition, JiraOperations (+27 more)

### Community 92 - "restart-writer.ts"
Cohesion: 0.25
Nodes (12): nextAttemptAt(), restartStoppedWriters(), unchangedSinceAccepted(), NOT_RETRYABLE, WRITER_STAGES, WriterRestartCandidate, writerRestartCandidate(), writerRestarted() (+4 more)

### Community 93 - "conversations/slack.ts"
Cohesion: 0.13
Nodes (16): channelNoticeAuthorized(), MergeNotifications, comparableSlackText(), SlackMessages, interruptAdoptions(), legacy(), REMOVED_FIELDS, retireLegacyRecovery() (+8 more)

### Community 94 - "github/issue-publication.ts"
Cohesion: 0.18
Nodes (7): FeaturePublisher, PublicationReceipt, GitHubIssuePublisher, number(), same(), FeatureManifestItem, FeatureOperation

### Community 98 - ".save"
Cohesion: 0.12
Nodes (42): resolveBlockedTransition(), document(), transitionWithComment(), jiraAccount(), jiraCollection(), JiraCredential, jiraCredential(), KEYCHAIN_SERVICE (+34 more)

### Community 99 - "accept-stage-result.ts"
Cohesion: 0.09
Nodes (48): findingsBlock(), handsOff(), DECISION_KINDS, needsDecision(), park(), acceptStageResult(), acceptConflictRepair(), nextJobStage() (+40 more)

### Community 100 - "Store"
Cohesion: 0.08
Nodes (24): GitHubFeaturePublisher, helperTelemetry(), JiraFeaturePublisher, publishFeature(), reconcilePublication(), uncertainPublications(), reserveIdentity(), helperInstallation() (+16 more)

### Community 103 - "worker-runtime.ts"
Cohesion: 0.06
Nodes (43): SlackResultSchema, SlackVerificationSchema, candidateWorkspaceEnvironment(), ApproachSchema, assignmentSubject(), LessonSelection, catalogLine(), clearUnblockBrief() (+35 more)

### Community 104 - "pilot-delivery.ts"
Cohesion: 0.10
Nodes (38): candidateBranchMoved(), applyIntakeObservation(), resume(), MISSING_SAVED_PLAN, recoverSavedPlan(), ownReceipts(), run(), verifiedTransition() (+30 more)

### Community 105 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 106 - "retire-history.ts"
Cohesion: 0.31
Nodes (8): readHistoryScope(), enqueueHistoryRetirement(), historicalRecordDigest(), Intent, records(), retireIncompleteHistory(), HistoryRetirement, HistoryRetirementIntent

### Community 108 - "continueAccessOnlyPlan"
Cohesion: 0.54
Nodes (6): Document, document(), isAccessOnlyPlan(), settledAccessOnlyState(), continueAccessOnlyPlan(), entryExists()

### Community 109 - "pre-push-boundary.ts"
Cohesion: 0.43
Nodes (5): Event, one(), prePushRejection(), PushIdentity, settledPushBoundary()

### Community 111 - "coordination.ts"
Cohesion: 0.04
Nodes (48): admit(), IntakeContext, compatible(), dependencyCompletionKey(), dependencyEligibility(), DependencyStores, issueKey(), observePrerequisites() (+40 more)

### Community 112 - "CommandRegistry"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 113 - "admit-improvement.ts"
Cohesion: 0.16
Nodes (22): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementIntakeGate(), improvementManifest() (+14 more)

### Community 114 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 115 - "office-qa-handoff.ts"
Cohesion: 0.60
Nodes (4): OfficeQAHandoff, OfficeQAHandoffInput, OfficeQAHandoffRequest, QAOwnershipProof

### Community 119 - "ci-preparation.ts"
Cohesion: 0.24
Nodes (11): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+3 more)

### Community 121 - "pilot-delivery.ts"
Cohesion: 0.16
Nodes (35): continueImplementation(), dispatchNightly(), drainDelivery(), requestDelivery(), startPilot(), OfficeQAHandoffInput, eligibility(), Admission (+27 more)

### Community 124 - "delivery-ownership.ts"
Cohesion: 0.33
Nodes (4): Ownership, ownershipContext, refreshDeliveryOwnership(), RefreshOwnership

### Community 125 - "setup-stop-cap.ts"
Cohesion: 0.60
Nodes (4): confirmSetupStopCap(), consecutiveSetupStops(), SETUP_STOP_CAP, setupStop()

## Knowledge Gaps
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `TimeBook.tsx`, `copy.ts`, `Store`, `sanitize`, `session-bridge.ts`, `digest`, `github-delivery.ts`, `agents.ts`, `lesson-selection.ts`, `features.ts`, `reader.ts`, `scheduled-captures.ts`, `run-retrospective.ts`, `record-trigger.ts`, `goal-reporting.ts`, `artifact`, `goal-reviews.ts`, `task-briefing.ts`, `maintenance/maintenance.ts`, `cost-ledger.ts`, `api-routes.ts`, `jira-time.ts`, `metadata-assessment.ts`, `agents.ts`, `azure.ts`, `closeout-recovery.ts`, `cec-reads.ts`, `JiraIssuePublisher`, `scheduled-work.ts`, `run-accounting.ts`, `dependency-bots/adopt.ts`, `time-scope.ts`, `github-delivery.ts`, `ledger.ts`, `cec-reads.ts`, `time-readback.ts`, `command`, `control-store.ts`, `resume-provider-review.ts`, `assignments.ts`, `inspect-closed-plan.ts`, `weekly-rollup.ts`, `features/workflow.ts`, `requests.ts`, `.emit`, `http/commands.ts`, `ticket-evidence.ts`, `remove-candidate.ts`, `retrospective-subject.ts`, `owned-artifact.ts`, `process.ts`, `report.ts`, `offices.ts`, `scheduler.ts`, `run-evidence.ts`, `ref_node_path`, `artifact`, `.getEffect`, `publish-pr.ts`, `OfficeSnapshot`, `config.ts`, `restart-writer.ts`, `conversations/slack.ts`, `github/issue-publication.ts`, `.save`, `accept-stage-result.ts`, `worker-runtime.ts`, `pilot-delivery.ts`, `retire-history.ts`, `continueAccessOnlyPlan`, `coordination.ts`, `admit-improvement.ts`, `ci-preparation.ts`, `ProjectProgress`, `pilot-delivery.ts`?**
  _High betweenness centrality (0.109) - this node is a cross-community bridge._
- **Should `TimeBook.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08357685563997662 - nodes in this community are weakly interconnected._
- **Why does `OfficeSnapshot` connect `OfficeSnapshot` to `TimeBook.tsx`, `OrgChart.tsx`, `Inspector.tsx`, `sanitize`, `ref_react`, `App.tsx`, `record-trigger.ts`, `goal-reporting.ts`, `index.tsx`, `shared.ts`, `maintenance/maintenance.ts`, `api-routes.ts`, `azure.ts`, `index.ts`, `ledger.ts`, `harness-baseline.ts`, `OfficeScene.tsx`, `control-store.ts`, `cli.ts`, `DailyCTO.tsx`, `scene-motion.ts`, `.emit`, `work.ts`, `index.tsx`, `conversations/slack.ts`, `Store`, `pilot-delivery.ts`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Should `OrgChart.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11613475177304965 - nodes in this community are weakly interconnected._
- **Why does `Role` connect `OrgChart.tsx` to `TimeBook.tsx`, `Inspector.tsx`, `sanitize`, `github-delivery.ts`, `agents.ts`, `App.tsx`, `shared.ts`, `maintenance/maintenance.ts`, `agents.ts`, `closeout-recovery.ts`, `cec-reads.ts`, `run-accounting.ts`, `projects.ts`, `github-delivery.ts`, `ledger.ts`, `cec-reads.ts`, `OfficeScene.tsx`, `control-store.ts`, `scene-motion.ts`, `.emit`, `http/commands.ts`, `retrospective-subject.ts`, `work.ts`, `scheduler.ts`, `OfficeSnapshot`, `accept-stage-result.ts`, `worker-runtime.ts`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Should `copy.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09655172413793103 - nodes in this community are weakly interconnected._
- **Should `Store` be split into smaller, more focused modules?**
  _Cohesion score 0.1036077705827937 - nodes in this community are weakly interconnected._