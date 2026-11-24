# Graph Report - the-office  (2026-11-24)

## Corpus Check
- 1192 files · ~499,064 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 6092 nodes · 26704 edges · 161 communities (150 shown, 11 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 980 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e8e0ae6b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- incidents/routes.ts
- OrgChart.tsx
- TicketJob
- features/workflow.ts
- Inspector.tsx
- offices.ts
- ref_node_path
- Button
- shared.ts
- TelemetryPanel.tsx
- .emit
- scheduler.ts
- App.tsx
- admit-improvement.ts
- assignments.ts
- scheduled-captures.ts
- work-summary.ts
- record-trigger.ts
- deploy-command.ts
- closeout-recovery.ts
- currentAssignment
- harnessEffect
- weekly-rollup.ts
- jira-time.ts
- deploy.ts
- maintenance/maintenance.ts
- agents.ts
- cec-reads.ts
- github-delivery.ts
- DailyCTO.tsx
- digest
- qa-comment.ts
- index.ts
- remove-candidate.ts
- store.ts
- wiki-graph.cjs
- scheduled-work.ts
- routing.cjs
- pilot-delivery.ts
- run-retrospective.ts
- MaintenanceRun
- time-scope.ts
- Store
- project-bindings-config.ts
- features.ts
- harness-baseline.ts
- OfficeScene.tsx
- brain-maintenance.ts
- change-scope.ts
- ticket-stage-runner.ts
- copy.ts
- restart-writer.ts
- projects.ts
- ref_node_sqlite
- jiraBinding
- ref_node_child_process
- FeatureWorkspace.tsx
- controller-runtime.ts
- requests.ts
- jira-attempts.ts
- cost-ledger.ts
- unsent-time.ts
- coordination.ts
- goal-reviews.ts
- judge-resumes.ts
- validate_pr_body.cjs
- audit-plan-candidates.cjs
- alert-issue.ts
- ref_node_crypto
- ticket-evidence.ts
- constellation-runtime.ts
- setup-stop-cap.ts
- session-context-file.ts
- knowledge/routes.ts
- session-scope.ts
- service-health.ts
- azure.ts
- it-report.ts
- incidents.ts
- cec.ts
- session-bridge.ts
- admit-repair-waits.ts
- Coordinator
- dependency-bots/adopt.ts
- viewer.js
- github-check-selection.ts
- stopped-record.ts
- sanitize
- OfficeSnapshot
- contract.ts
- provider-observation.ts
- Ticket
- session-context-client.ts
- plans.cjs
- report.ts
- capture-session-clone.py
- index.tsx
- workKey
- .save
- archive-plan.cjs
- http/commands.ts
- intent.ts
- LessonsPanel.tsx
- on-merge-sync.cjs
- backup-stores.ts
- extract-worker.mjs
- deploy-plan.ts
- office/readiness.ts
- intake-enumeration.ts
- release-unpark.ts
- handoff-admission.ts
- assignment-poll.ts
- fact-bounds.ts
- deploy-context.ts
- slack-supersession.ts
- sign-in-unpark.ts
- qa.ts
- qa-plan-continuation.ts
- writer-restart.ts
- closed-readonly-plan.ts
- lesson-selection.ts
- follow-production.ts
- outbox.ts
- read-retries.ts
- refresh-issue-state.cjs
- knowledge.ts
- blocker-followups.ts
- DeploymentFence
- node-visuals.ts
- install-service.mjs
- command-registry.ts
- it-specialist.ts
- run-accounting.ts
- accessibility-sources.ts
- resume-control.ts
- checkpoint-retry.ts
- review-run.ts
- github/issue-publication.ts
- Effects
- candidate-child-context.ts
- session-snapshot-cleanup.ts
- scene-motion.ts
- packed-consumer-pnpm.ts
- production.ts
- reconcile-merges.cjs
- preferences-store.ts
- RoomCamera.tsx
- lesson-issue-ready.ts
- pre-push-boundary.ts
- recovery-ledger.ts
- common.cjs
- OfficeConfigView.tsx
- owner-step-items.ts
- incident-command.ts
- validate_wiki_pr_body.cjs
- unblock-brief.ts
- ProjectProgress
- harness-parked-card.ts
- JiraWorklogTransport
- routing.js
- qa-plan-retry.ts

## God Nodes (most connected - your core abstractions)
1. `Store` - 441 edges
2. `TicketJob` - 199 edges
3. `command()` - 161 edges
4. `digest()` - 153 edges
5. `holdReason()` - 139 edges
6. `GitHubDelivery` - 121 edges
7. `OfficeSnapshot` - 119 edges
8. `artifact()` - 114 edges
9. `workKey()` - 110 edges
10. `StageResult` - 109 edges

## Surprising Connections (you probably didn't know these)
- `publish()` --indirect_call--> `title()`  [INFERRED]
  scripts/graphify/publish-refresh.cjs → src/knowledge/map/grouping.ts
- `BreakdownTable()` --indirect_call--> `cell()`  [INFERRED]
  src/telemetry/BreakdownTable.tsx → scripts/wiki/archive-plan.cjs
- `apply()` --indirect_call--> `note()`  [INFERRED]
  src/conversations/OutboxSavedImplementation.tsx → server/cec/parking/resume-parked.ts
- `UnrecordedResult` --references--> `StageResult`  [EXTRACTED]
  server/cec/unrecorded-result.ts → src/shared.ts
- `EffectOperation` --references--> `WorkRef`  [EXTRACTED]
  server/store/effects.ts → src/contracts/work.ts

## Import Cycles
- 2-file cycle: `server/scheduling/coordination-pump.ts -> server/scheduling/coordination.ts -> server/scheduling/coordination-pump.ts`
- 2-file cycle: `server/scheduling/coordination-tick.ts -> server/scheduling/coordination.ts -> server/scheduling/coordination-tick.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/track-adopted-review.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/stage-reconciliation.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/accept-stage-result.ts -> server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/accept-stage-result.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/publication/metadata-context.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/refresh-merge-review.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/closeout/github-closeout.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/implementation/saved-prerequisite-handoff.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/queue-repairs.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/knowledge/lesson-exits.ts -> server/scheduling/requests.ts -> server/knowledge/lesson-exits.ts`
- 2-file cycle: `server/conversations/conversations.ts -> server/conversations/cto-conversations.ts -> server/conversations/conversations.ts`
- 2-file cycle: `server/conversations/notifications.ts -> server/conversations/slack.ts -> server/conversations/notifications.ts`
- 2-file cycle: `src/contracts/people.ts -> src/shared.ts -> src/contracts/people.ts`
- 2-file cycle: `src/contracts/timing.ts -> src/shared.ts -> src/contracts/timing.ts`
- 2-file cycle: `src/contracts/work.ts -> src/shared.ts -> src/contracts/work.ts`
- 2-file cycle: `server/workers/exit-failure.ts -> server/workers/process.ts -> server/workers/exit-failure.ts`
- 3-file cycle: `server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-guard.ts -> server/delivery/pipeline/github-delivery.ts`

## Communities (161 total, 11 thin omitted)

### Community 0 - "incidents/routes.ts"
Cohesion: 0.07
Nodes (50): citationFault(), CitationSchema, SourceVersions, dismiss(), DISMISSAL_CITATIONS, DISMISSAL_REASON, DismissalFacts, DismissalRequest (+42 more)

### Community 1 - "OrgChart.tsx"
Cohesion: 0.10
Nodes (39): label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+31 more)

### Community 2 - "TicketJob"
Cohesion: 0.07
Nodes (45): writerRestartInstruction(), removeAdoptedClone(), namedRepairIds(), BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction(), dependabotReviewGuidance() (+37 more)

### Community 3 - "features/workflow.ts"
Cohesion: 0.08
Nodes (55): approveFeature(), featureById(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), discoveryPrompt(), planPrompt() (+47 more)

### Community 4 - "Inspector.tsx"
Cohesion: 0.10
Nodes (71): blockedSummary(), itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps(), ServiceHealthPanel(), followUp(), labels (+63 more)

### Community 5 - "offices.ts"
Cohesion: 0.06
Nodes (25): currentOutbox(), QuestionNotifications, leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), DailyCTO, EvidenceRequestConflict (+17 more)

### Community 6 - "ref_node_path"
Cohesion: 0.05
Nodes (116): interruptedImplementation(), ownershipReadHistory(), qaPlanEvidenceGap(), qaRunDirectory(), MISSING_SAVED_PLAN, recoverCTOInput(), completedPreparation(), allowed (+108 more)

### Community 7 - "Button"
Cohesion: 0.07
Nodes (58): KnowledgeActivity, KnowledgeActivityPage, KnowledgeEdge, KnowledgeMap, KnowledgeNode, Activity(), ActivityTimeline(), AssignmentKnowledge() (+50 more)

### Community 8 - "shared.ts"
Cohesion: 0.07
Nodes (36): applyIntakeObservation(), Carried, findingsOwedToRetest(), missingRetestDispositions(), accounting, DeliverySubject, nonDelivery, originalReads (+28 more)

### Community 9 - "TelemetryPanel.tsx"
Cohesion: 0.09
Nodes (41): displayAgentTask(), githubStageLabels, withoutElapsed(), LiveAgentTask(), Props, RunningTask(), text(), Agent (+33 more)

### Community 10 - ".emit"
Cohesion: 0.12
Nodes (19): Document, document(), isAccessOnlyPlan(), settledAccessOnlyState(), continueAccessOnlyPlan(), entryExists(), featureItemComplete(), reconcileFeatureCompletion() (+11 more)

### Community 11 - "scheduler.ts"
Cohesion: 0.08
Nodes (21): Clock, systemClock, PROJECT_LOCAL, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork() (+13 more)

### Community 12 - "App.tsx"
Cohesion: 0.06
Nodes (50): BrainDrawer(), blank(), goalInput, Goals(), resetDraft(), save(), themeColor, App() (+42 more)

### Community 13 - "admit-improvement.ts"
Cohesion: 0.22
Nodes (15): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+7 more)

### Community 14 - "assignments.ts"
Cohesion: 0.09
Nodes (34): guidanceExcerpt(), KnowledgeContext, clip(), DEMAND_LIMIT, demandFacts(), key(), LessonKey, notes() (+26 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.15
Nodes (43): createFeature(), assertEnrollable(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), CaptureRequest, captureRequest(), captureRequests() (+35 more)

### Community 16 - "work-summary.ts"
Cohesion: 0.09
Nodes (43): isFollowed(), jiraQueueProgress(), nextStage(), compactSteps(), deliveryRoles, JiraQueueProgress, TicketProgress, ROLE_NAMES (+35 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.13
Nodes (32): baselined(), LEARNING_BASELINES, maintainLearning(), clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates(), maintenanceCompletedId() (+24 more)

### Community 18 - "deploy-command.ts"
Cohesion: 0.10
Nodes (32): ControllerEffects, controllerEffects(), DEPLOY_PROJECT, readControllerPin(), controllerOf(), deployCommand(), DeployCommandOptions, report() (+24 more)

### Community 19 - "closeout-recovery.ts"
Cohesion: 0.11
Nodes (41): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+33 more)

### Community 20 - "currentAssignment"
Cohesion: 0.06
Nodes (82): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+74 more)

### Community 21 - "harnessEffect"
Cohesion: 0.23
Nodes (28): effectKey(), LaneOperation, laneWrite(), moveCardOnce(), Lane, MOVABLE, moveLane(), resolveLane() (+20 more)

### Community 22 - "weekly-rollup.ts"
Cohesion: 0.13
Nodes (28): expireLearningPackets(), packetReferences(), learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck() (+20 more)

### Community 23 - "jira-time.ts"
Cohesion: 0.11
Nodes (37): unresolvedAttempts(), bindingOf(), connectWith(), data(), envelope(), finishVerifiedEffects(), JiraWorklogs, locks (+29 more)

### Community 24 - "deploy.ts"
Cohesion: 0.09
Nodes (50): abandon(), advance(), deploy(), exclusively(), unfinishedDeployments(), Commit, DEPLOY_STEPS, DeployFacts (+42 more)

### Community 25 - "maintenance/maintenance.ts"
Cohesion: 0.11
Nodes (25): captureMaintenanceStep(), accessibilitySources(), reconcileSourceScan(), sourceFindings, sourceReview(), candidateOwner(), SETTLED, skipOwnedCandidate() (+17 more)

### Community 26 - "agents.ts"
Cohesion: 0.04
Nodes (79): implementationWorkerContext(), RefusedQAResult, savedStageCompletion(), assertContinuableWorktree(), CONTINUABLE, continuationPrompt(), MAX_CONTINUATIONS, recordedContinuation() (+71 more)

### Community 27 - "cec-reads.ts"
Cohesion: 0.13
Nodes (13): intakeEnumeration(), intakeMembership(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), plainResume(), ticketForWorker() (+5 more)

### Community 28 - "github-delivery.ts"
Cohesion: 0.04
Nodes (129): containedFile(), findingsBlock(), QA_STAGES, reviewAdvisoryIds(), Reviewed, withoutReviewAdvisories(), deliveryAdmission(), assessDeliveryAuthority() (+121 more)

### Community 29 - "DailyCTO.tsx"
Cohesion: 0.22
Nodes (12): CTOReview(), goalState, DailyCTO(), reportDate(), reviewStatus, GoalList(), card(), InlineText() (+4 more)

### Community 30 - "digest"
Cohesion: 0.06
Nodes (85): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+77 more)

### Community 31 - "qa-comment.ts"
Cohesion: 0.31
Nodes (7): parksInJira(), OUTCOME, qaComment(), remote(), STAGE, DECISION_KINDS, needsDecision()

### Community 32 - "index.ts"
Cohesion: 0.05
Nodes (65): implementationPreview(), implementationContinuationRoute(), entryExists(), inspectClosedQAPlan(), qaPlanRetryRoute(), args, [cmd,...rawArgs], commands (+57 more)

### Community 33 - "remove-candidate.ts"
Cohesion: 0.14
Nodes (24): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), maintenanceCandidate(), moveAside(), moveBack(), purgeRemoved(), purging (+16 more)

### Community 34 - "store.ts"
Cohesion: 0.06
Nodes (53): diagnosticContext(), diagnosticSnapshot(), acceptedCompletionResolution(), INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationCandidates(), investigationId(), ctoReplacementResolution() (+45 more)

### Community 35 - "wiki-graph.cjs"
Cohesion: 0.22
Nodes (19): connections(), fs, main(), path, ensureInside(), hasSymlinkComponent(), slash(), collect() (+11 more)

### Community 36 - "scheduled-work.ts"
Cohesion: 0.07
Nodes (45): freshOwnershipRead(), dueSlackReread(), rereadUncertainSlack(), runningRevision(), deliverySlot(), Ownership, ownershipContext, refreshDeliveryOwnership() (+37 more)

### Community 37 - "routing.cjs"
Cohesion: 0.11
Nodes (31): fs, main(), path, { spawnSync }, digest(), frontmatterProblems(), adjacency(), edgeCost() (+23 more)

### Community 38 - "pilot-delivery.ts"
Cohesion: 0.12
Nodes (33): continueImplementation(), requestMail(), dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), startPilot(), OfficeQAHandoffInput (+25 more)

### Community 39 - "run-retrospective.ts"
Cohesion: 0.07
Nodes (56): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, BlockingTrigger, blockingTrigger(), isBlocking() (+48 more)

### Community 40 - "MaintenanceRun"
Cohesion: 0.26
Nodes (11): checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), repeatedVendorReviewBlock(), stoppedInVendorReview(), leftToNextRun(), NEXT_RUN_DUE_MS, night() (+3 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.18
Nodes (22): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), midnight(), TicketDay (+14 more)

### Community 42 - "Store"
Cohesion: 0.04
Nodes (33): DeliveryTaskInput, GitHubFeaturePublisher, JiraFeaturePublisher, FeatureReviewRunner, FeatureWorkflow, RepairWaitEntry, ResumeProject, Result (+25 more)

### Community 43 - "project-bindings-config.ts"
Cohesion: 0.15
Nodes (27): document(), transitionWithComment(), jiraAccount(), JiraCredential, jiraCredential(), KEYCHAIN_SERVICE, readFailure(), readIssues() (+19 more)

### Community 44 - "features.ts"
Cohesion: 0.09
Nodes (44): commandFeature(), reviewQuestions(), automaticIntakeWait(), confirmBrief(), assertQuestionVisibility(), applyHarnessAction(), HarnessActionInput, recoveryPreconditions() (+36 more)

### Community 45 - "harness-baseline.ts"
Cohesion: 0.15
Nodes (23): BaselineReport, baselineReport(), BaselineSource, baselineText(), millions(), row(), share(), add() (+15 more)

### Community 46 - "OfficeScene.tsx"
Cohesion: 0.17
Nodes (33): Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk(), ElevatorStage() (+25 more)

### Community 47 - "brain-maintenance.ts"
Cohesion: 0.18
Nodes (13): maintenancePolicies(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, brainResultStop(), GateMark, gateMark(), neverStarted() (+5 more)

### Community 48 - "change-scope.ts"
Cohesion: 0.14
Nodes (27): applyChangeScope(), levels(), MAX_CHECKS, owedUnderScope(), scopeBase(), settled(), statedApproach(), verifiedCandidate() (+19 more)

### Community 49 - "ticket-stage-runner.ts"
Cohesion: 0.09
Nodes (49): candidateBranchMoved(), endChangeScope(), scopeOutgrown(), confirmsMovedHead(), Moved, movedHeadUnconfirmed(), recordConfirmedHead(), routeConfirmedHead() (+41 more)

### Community 50 - "copy.ts"
Cohesion: 0.32
Nodes (10): GitRead, nativeGitRead(), patchArgs, sourceCopyMatches(), absent(), candidateParent(), copySavedImplementation(), Saved (+2 more)

### Community 51 - "restart-writer.ts"
Cohesion: 0.19
Nodes (18): nextAttemptAt(), restartStoppedWriters(), unchangedSinceAccepted(), NOT_RETRYABLE, releaseFunds(), StoppedWriter, stoppedWriter(), WRITER_STAGES (+10 more)

### Community 52 - "projects.ts"
Cohesion: 0.06
Nodes (59): escaped(), IntakeBinding, intakeJql(), intakeLocation(), projectListScope(), AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), FeaturePlanningBindings (+51 more)

### Community 53 - "ref_node_sqlite"
Cohesion: 0.08
Nodes (30): readSavedState(), LARGE_KEY_CHARS, plain(), RedactedEntries, RedactedEntry, redactEntries(), joinParts(), PartRow (+22 more)

### Community 54 - "jiraBinding"
Cohesion: 0.18
Nodes (9): Assignment, contentSchema(), JiraIssuePublisher, jiraText(), Transition, descriptionPreimage(), plain(), publicationDescription() (+1 more)

### Community 55 - "ref_node_child_process"
Cohesion: 0.13
Nodes (18): changedPaths(), { execFileSync }, files, isMapInput(), mapOnly(), { execFileSync }, git(), publish() (+10 more)

### Community 56 - "FeatureWorkspace.tsx"
Cohesion: 0.11
Nodes (28): FeatureQuestionProjection, OutboxQuestionRound(), send(), FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases (+20 more)

### Community 57 - "controller-runtime.ts"
Cohesion: 0.13
Nodes (15): projectData(), StoreDatabase, alive(), ControllerMachine, option(), realMachine(), runController(), DEFAULT_TIMINGS (+7 more)

### Community 58 - "requests.ts"
Cohesion: 0.09
Nodes (42): DeliveryAuthorityInput, pinCourier, pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), assertStoppedBaseAudit(), AuditRow, AWS_KEY_ID, CoverageRow (+34 more)

### Community 59 - "jira-attempts.ts"
Cohesion: 0.11
Nodes (25): attempted(), attemptState(), bound(), covers(), JiraAttempt, jiraAttempts(), JiraAttemptState, open() (+17 more)

### Community 60 - "cost-ledger.ts"
Cohesion: 0.15
Nodes (28): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId(), OutsideEdit (+20 more)

### Community 61 - "unsent-time.ts"
Cohesion: 0.20
Nodes (14): publishableEntry(), settlementPending(), superseded(), ticketUnresolved(), TimeLedger, readBackTime(), clearUnsent(), dueUnsent() (+6 more)

### Community 62 - "coordination.ts"
Cohesion: 0.09
Nodes (44): reconcileNoticeConfirmations(), admit(), compatible(), dependencyCompletionKey(), dependencyEligibility(), issueKey(), observePrerequisites(), PrerequisiteSchema (+36 more)

### Community 63 - "goal-reviews.ts"
Cohesion: 0.09
Nodes (29): seedProjectLessons(), currentCitations(), Fact, NOT_CURRENT, PROVIDER_ERROR, applyGoalReview(), DailyResultSchema, DeliveryJob (+21 more)

### Community 64 - "judge-resumes.ts"
Cohesion: 0.07
Nodes (37): boundaryCrossed(), Crossing, Progress, CheckpointProgress, checkpointProgress(), names(), nativeProof(), Step (+29 more)

### Community 65 - "validate_pr_body.cjs"
Cohesion: 0.36
Nodes (8): fs, main(), readableText(), REQUIRED_CHECKS, REQUIRED_SECTIONS, sections(), validatePullRequestBody(), withoutComments()

### Community 66 - "audit-plan-candidates.cjs"
Cohesion: 0.14
Nodes (31): audit(), branchIssueNumbers(), classify(), distinctiveTitleWords(), { execFileSync }, extractPaths(), findPrForMergeSubject(), fmtCommit() (+23 more)

### Community 67 - "alert-issue.ts"
Cohesion: 0.19
Nodes (21): AlertIssue, alertIssueBody(), alertIssueTitle(), alertMarker(), closeAlertIssue(), ensureAlertIssue(), findAlertIssue(), Guard (+13 more)

### Community 68 - "ref_node_crypto"
Cohesion: 0.10
Nodes (64): canonical(), CheckpointEligibility, checkpointEligibility(), admitCheckpointResume(), forCheckpoint(), admitResume(), ResumeAdmission, ResumeIntent (+56 more)

### Community 69 - "ticket-evidence.ts"
Cohesion: 0.10
Nodes (37): Connection, twgConnection(), twgProfile(), assetDownloader(), attachmentKind(), evidenceDirectory(), storeEvidence(), blankEvidence() (+29 more)

### Community 70 - "constellation-runtime.ts"
Cohesion: 0.09
Nodes (21): CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point, ConstellationRuntime, createConstellation() (+13 more)

### Community 71 - "setup-stop-cap.ts"
Cohesion: 0.09
Nodes (35): readbackDispatchGuidance(), currentEnvironmentWait(), environmentWait(), waitText(), capacityInterruptedRun(), providerSaid(), rerunsInterruptedQA(), officeRefusedQA() (+27 more)

### Community 72 - "session-context-file.ts"
Cohesion: 0.20
Nodes (14): ContextFoldPrefix, contextFoldPrefix(), SessionContextCheckpoint, captureSessionContextClone(), ContextReadPhase, SessionContextDeadline, sessionContextFile(), ContextReadChanged (+6 more)

### Community 73 - "knowledge/routes.ts"
Cohesion: 0.10
Nodes (23): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, CommittedBrain (+15 more)

### Community 74 - "session-scope.ts"
Cohesion: 0.18
Nodes (17): Bound, claudeScopeParser(), claudeSessionScope(), CLAUDE_TRANSCRIPTS, CODEX_ROLLOUTS, contextReaders(), retainSessionMessage(), SessionConversation (+9 more)

### Community 75 - "service-health.ts"
Cohesion: 0.11
Nodes (23): ClaudeLoginRefusal, claudeLoginRefusal(), claudeRefusalWords(), RECORDED_REFUSALS, refusedClaudeRow(), listenerHealth(), providers, ProviderStatusChecks (+15 more)

### Community 76 - "azure.ts"
Cohesion: 0.12
Nodes (28): az(), AzureMonitor, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs(), fullActivePRs() (+20 more)

### Community 77 - "it-report.ts"
Cohesion: 0.20
Nodes (14): followUpPicture(), publishITReport(), archiveOldReports(), RETAINED_REPORTS, archiveByMonth(), archiveHistory(), archiveMonth(), archiveOldTaskDetail() (+6 more)

### Community 78 - "incidents.ts"
Cohesion: 0.06
Nodes (64): attributedRecords(), foldsItsRun(), groupCandidates(), ObservedIncident, ObservedSubject, digest(), fingerprint(), incidentId() (+56 more)

### Community 79 - "cec.ts"
Cohesion: 0.09
Nodes (33): cecPrompt(), resolvedDecisionNote(), stageInstructions, stageInstructionsFor(), REVIEW_FINDINGS_RULE, applies(), interruptedRunNote(), placeholder() (+25 more)

### Community 80 - "session-bridge.ts"
Cohesion: 0.10
Nodes (30): claudeSessionContext(), codexDaemonProcesses(), accountCodexProcesses(), CodexProcessInventory, codexProcessInventory(), DesktopSessions, unaccountedProcesses(), codexSessionContext() (+22 more)

### Community 81 - "admit-repair-waits.ts"
Cohesion: 0.07
Nodes (59): sourceVersions(), inHistoryOf(), CompareMemory, compareMemory(), COMPARES_PER_PASS, comparison(), DeployedFixes, DeployedFixesInput (+51 more)

### Community 83 - "dependency-bots/adopt.ts"
Cohesion: 0.10
Nodes (41): Execute, readBackOrThrow(), adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DependabotPR, dependabotPR() (+33 more)

### Community 84 - "viewer.js"
Cohesion: 0.19
Nodes (25): addMetaLink(), addMetaRow(), addRelationship(), applyView(), buildIndexes(), buildLegend(), buildModel(), buildRenderer() (+17 more)

### Community 85 - "github-check-selection.ts"
Cohesion: 0.14
Nodes (28): CheckJobAgreement, checkJobAgreement(), isKnownCheckStatus(), positive(), STATE, UNFINISHED, checksFailed(), checksPassed() (+20 more)

### Community 86 - "stopped-record.ts"
Cohesion: 0.07
Nodes (63): capabilityBlockedReviews(), latestReviews(), boundedEvidence(), expectedWait(), StopFacts, FailedMailCheck, lastFailedMailCheck(), lastMailCheckOutcome() (+55 more)

### Community 87 - "sanitize"
Cohesion: 0.06
Nodes (55): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+47 more)

### Community 88 - "OfficeSnapshot"
Cohesion: 0.06
Nodes (51): ChatMarkdown(), Conversation(), SendMessage, DAYS, dueLessonDecisions(), easternWeek(), isLessonDecision(), LESSON_DIGEST (+43 more)

### Community 89 - "contract.ts"
Cohesion: 0.24
Nodes (12): At, Errno, errno(), GroupInventory, GroupProbe, LifecycleDiagnostic, Phase, Pid (+4 more)

### Community 90 - "provider-observation.ts"
Cohesion: 0.12
Nodes (28): correlatedBuild(), Azure, azurePipelines(), outcome(), Read, RUNS_PER_PIPELINE, Api, githubWorkflows() (+20 more)

### Community 91 - "Ticket"
Cohesion: 0.09
Nodes (33): carriedNotRepeated(), changeScopeNote(), Scoped, CommentPage, commentReadback(), devUpdate(), HEADLINE, JiraOperations (+25 more)

### Community 92 - "session-context-client.ts"
Cohesion: 0.13
Nodes (18): readTranscript, readRollout, packContextFailure(), PackedContextFailure, unpackContextFailure(), LiveSession, ContextThread, contextThread() (+10 more)

### Community 93 - "plans.cjs"
Cohesion: 0.20
Nodes (18): walk(), association(), auditedDigests(), candidate(), collapseByTitle(), discover(), fromMarkdown(), fs (+10 more)

### Community 94 - "report.ts"
Cohesion: 0.22
Nodes (15): TelemetryReport, TelemetryRow, TelemetrySync, Acc, bump(), EASTERN, easternDay(), modelShares() (+7 more)

### Community 96 - "index.tsx"
Cohesion: 0.10
Nodes (47): LessonsView(), SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS, PickupForm() (+39 more)

### Community 97 - "workKey"
Cohesion: 0.11
Nodes (30): notOwned(), mergedByOwner(), closeableIssue(), effectsSettled(), eligible(), officePublished(), ownerMerged(), prerequisitesMet() (+22 more)

### Community 98 - ".save"
Cohesion: 0.18
Nodes (29): resolveBlockedTransition(), jiraCollection(), findComment(), LiveIssue, readIssue(), commentDecision(), commentRefused(), decisionComment() (+21 more)

### Community 99 - "archive-plan.cjs"
Cohesion: 0.12
Nodes (31): fs, main(), parse(), path, archive(), cell(), ensureIndex(), fromArgs() (+23 more)

### Community 100 - "http/commands.ts"
Cohesion: 0.06
Nodes (47): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR (+39 more)

### Community 101 - "intent.ts"
Cohesion: 0.06
Nodes (49): savedImplementation(), sha(), sourceFiles(), ContinuationIO, nativeIO, assertOwnership(), decideImplementation(), ImplementationDecision (+41 more)

### Community 102 - "LessonsPanel.tsx"
Cohesion: 0.20
Nodes (17): LessonDecisionAction, lessonDecisionState(), readLessonDecision(), OutboxLessonDecision(), act(), readStatus(), evidenceText(), field() (+9 more)

### Community 103 - "on-merge-sync.cjs"
Cohesion: 0.18
Nodes (23): slugify(), fieldSpan(), keyPattern(), list(), parseListLiteral(), quote(), render(), scalar() (+15 more)

### Community 104 - "backup-stores.ts"
Cohesion: 0.10
Nodes (36): absentAdmission(), AdmissionComparison, AdmissionSnapshot, compareAdmissions(), snapshotAdmissions(), BackupEntry, BackupInput, BackupInventory (+28 more)

### Community 105 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 106 - "deploy-plan.ts"
Cohesion: 0.09
Nodes (50): runningRevision(), runningRevision(), releaseIdentity(), runtimeRevision(), ActiveRelease, readActiveRelease(), BUILD_ENV, buildRelease() (+42 more)

### Community 107 - "office/readiness.ts"
Cohesion: 0.20
Nodes (12): effectiveCause(), REPLACED, BLOCKED_CAUSES, blockedCauses(), NONE, projectReadiness(), ProjectReadiness, BlockedCause (+4 more)

### Community 108 - "intake-enumeration.ts"
Cohesion: 0.42
Nodes (7): enumerateIntakeList(), inPickupOrder(), Intake, text(), checkMail(), drainMail(), ingest()

### Community 109 - "release-unpark.ts"
Cohesion: 0.33
Nodes (8): due(), MAX_RELEASE_UNPARKS, RELEASE_CHECK_MS, returnToPickup(), unparkReleasedWaits(), compare(), highestStableAtLeast(), parts()

### Community 110 - "handoff-admission.ts"
Cohesion: 0.12
Nodes (35): actionKey(), bindings(), bound(), CATEGORIZED, claimed(), Entry, episodeAt(), executing() (+27 more)

### Community 111 - "assignment-poll.ts"
Cohesion: 0.13
Nodes (21): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), admitReadyCards(), confirmedGone() (+13 more)

### Community 112 - "fact-bounds.ts"
Cohesion: 0.11
Nodes (27): GitHubMonitor, githubPRDescription(), collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip() (+19 more)

### Community 113 - "deploy-context.ts"
Cohesion: 0.16
Nodes (22): Body, DeploymentFenceState, fenceTokenDigest(), DeployContext, DeployTimings, readDeployToken(), endDeployment(), holdFence() (+14 more)

### Community 114 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 115 - "sign-in-unpark.ts"
Cohesion: 0.18
Nodes (18): hasPendingDelivery(), resumeAfterSignIn(), signInWait(), MAX_SIGN_IN_UNPARKS, waitingStep(), BrowserPage, browserPages(), ReadPages (+10 more)

### Community 119 - "closed-readonly-plan.ts"
Cohesion: 0.67
Nodes (3): closedReadonlyPlan(), Document, document()

### Community 120 - "lesson-selection.ts"
Cohesion: 0.13
Nodes (18): INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, LessonSelection, MAINTENANCE, MAX_LESSONS, normalPath() (+10 more)

### Community 121 - "follow-production.ts"
Cohesion: 0.21
Nodes (16): awaitingJiraStatus(), awaitingProduction(), FOLLOW_DAYS, followed(), Azure, AzureRead, containedIn(), followProduction() (+8 more)

### Community 122 - "outbox.ts"
Cohesion: 0.19
Nodes (16): ctoInputIdentityMatches(), ctoInputRecovered(), ADOPTION_STALLED_MS, conversationResolved(), projectOutbox(), item(), syncOutbox(), sameOwnerSteps() (+8 more)

### Community 123 - "read-retries.ts"
Cohesion: 0.23
Nodes (13): ATTEMPT_DELAYS_MS, APPROACH_GUARD_REJECTION, classifyStop(), stopReason(), ReviewWait, incompleteReadOutput(), planReadRetry(), readOnlyStageJob() (+5 more)

### Community 124 - "refresh-issue-state.cjs"
Cohesion: 0.20
Nodes (19): advanceFence(), closingIssues(), githubRefs(), key(), normalizeGithubQuery(), normalizeRepository(), parseGithubQuery(), ref() (+11 more)

### Community 125 - "knowledge.ts"
Cohesion: 0.05
Nodes (48): normalizeStatement(), curateLesson(), Curation, CurationAction, mergeEvidence(), LessonBrainAudit, lessonBrainAudit(), LessonBrainOverlap (+40 more)

### Community 126 - "blocker-followups.ts"
Cohesion: 0.44
Nodes (12): conversationReadbackReady(), followupOf(), pendingReadback(), queueConversationReadback(), readbackEnding(), uncertainConversations(), readBackConversations(), followupRecord() (+4 more)

### Community 128 - "node-visuals.ts"
Cohesion: 0.20
Nodes (14): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+6 more)

### Community 129 - "install-service.mjs"
Cohesion: 0.29
Nodes (4): file, folder, logs, root

### Community 130 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 131 - "it-specialist.ts"
Cohesion: 0.23
Nodes (13): replacedReadback(), heldFor(), ITContext, recoveryHeld(), recoveryWait(), informationalRecovery(), ownAzureCheck(), delays (+5 more)

### Community 132 - "run-accounting.ts"
Cohesion: 0.05
Nodes (67): BoundedRead, done(), readBoundedNoFollow(), reasonOf(), backfillClaudeCost(), CompletionReader, add(), CodexRequest (+59 more)

### Community 133 - "accessibility-sources.ts"
Cohesion: 0.30
Nodes (14): actionable(), closingPull(), Finding, handoffIssue(), issueLines(), issueSource(), observation, reconcileSourceEffects() (+6 more)

### Community 134 - "resume-control.ts"
Cohesion: 0.24
Nodes (9): ResumeArrivalsInput, absent(), NEVER_ENABLED, ResumeControl, stated(), Stored, unreadable(), IncidentsRouteContext (+1 more)

### Community 135 - "checkpoint-retry.ts"
Cohesion: 0.26
Nodes (10): completeNativeCheckpoint(), BrainStatusSchema, identity, queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation() (+2 more)

### Community 136 - "review-run.ts"
Cohesion: 0.13
Nodes (31): readEvidence(), helperTelemetry(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS, requestReplan(), reserveReplacement(), stageBudget() (+23 more)

### Community 137 - "github/issue-publication.ts"
Cohesion: 0.16
Nodes (10): FeaturePublisher, PublicationReceipt, Assign, Board, Content, GitHubIssuePublisher, number(), same() (+2 more)

### Community 138 - "Effects"
Cohesion: 0.18
Nodes (14): settleDevUpdate(), settleDevUpdates(), GitHubOperations, assignedToJoe(), fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), tryReadyLessonIssue() (+6 more)

### Community 139 - "candidate-child-context.ts"
Cohesion: 0.38
Nodes (8): adoptCandidate(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat()

### Community 140 - "session-snapshot-cleanup.ts"
Cohesion: 0.40
Nodes (5): SNAPSHOT_PREFIX, removeStaleSessionSnapshots(), SNAPSHOT_SWEEP_MS, STALE_SNAPSHOT_MS, sweepStaleSessionSnapshots()

### Community 141 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 144 - "reconcile-merges.cjs"
Cohesion: 0.21
Nodes (15): remoteSlug(), collectPulls(), copyWikiForDryRun(), { execFileSync }, flattenPages(), fs, githubRequest(), isWikiBotPull() (+7 more)

### Community 145 - "preferences-store.ts"
Cohesion: 0.19
Nodes (9): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS (+1 more)

### Community 146 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (7): CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility, overlayEntranceDelays(), SceneOverlay()

### Community 147 - "lesson-issue-ready.ts"
Cohesion: 0.50
Nodes (6): firstLane(), instruction(), LaneMove, move(), readyLessonIssue(), settle()

### Community 148 - "pre-push-boundary.ts"
Cohesion: 0.26
Nodes (10): Event, exactCommand(), Invocation, localHookCommand(), one(), prePushRejection(), PushIdentity, retirementBoundary() (+2 more)

### Community 149 - "recovery-ledger.ts"
Cohesion: 0.29
Nodes (10): savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), reconcileRecoveryLedger(), commands(), SIGN_IN_SERVICE_TROUBLE, signInSteps() (+2 more)

### Community 150 - "common.cjs"
Cohesion: 0.11
Nodes (24): fs, main(), parse(), path, atomicWrite(), crypto, { execFileSync }, fs (+16 more)

### Community 151 - "OfficeConfigView.tsx"
Cohesion: 0.46
Nodes (6): loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView(), policyText(), OfficeConfigSummary

### Community 152 - "owner-step-items.ts"
Cohesion: 0.29
Nodes (7): OwnerStepItem, ownerStepItems(), signIn(), OwnerSteps, ownerStepsFirst(), waitsOnOwner(), HumanAction

### Community 153 - "incident-command.ts"
Cohesion: 0.38
Nodes (6): FLAGS, incidentCommand(), IncidentCommandIO, option(), USAGE, whole()

### Community 154 - "validate_wiki_pr_body.cjs"
Cohesion: 0.33
Nodes (5): { execFileSync }, hasCanonicalWikiBody(), maintenanceBodies, matchesMaintenanceBody(), { readFileSync }

### Community 155 - "unblock-brief.ts"
Cohesion: 0.53
Nodes (5): clearUnblockBrief(), key(), saveUnblockBrief(), UnblockBrief, unblockBrief()

### Community 157 - "harness-parked-card.ts"
Cohesion: 0.60
Nodes (4): BLOCK, harnessBlockMove(), harnessParkedCard(), noted()

### Community 160 - "qa-plan-retry.ts"
Cohesion: 0.67
Nodes (3): QAPlanRetry, QAPlanRetryProof, QAPlanRetryRequest

## Knowledge Gaps
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `TicketJob`, `features/workflow.ts`, `offices.ts`, `ref_node_path`, `shared.ts`, `.emit`, `scheduler.ts`, `admit-improvement.ts`, `assignments.ts`, `scheduled-captures.ts`, `record-trigger.ts`, `deploy-command.ts`, `closeout-recovery.ts`, `currentAssignment`, `harnessEffect`, `weekly-rollup.ts`, `jira-time.ts`, `maintenance/maintenance.ts`, `agents.ts`, `cec-reads.ts`, `github-delivery.ts`, `digest`, `index.ts`, `remove-candidate.ts`, `store.ts`, `scheduled-work.ts`, `pilot-delivery.ts`, `run-retrospective.ts`, `time-scope.ts`, `project-bindings-config.ts`, `features.ts`, `brain-maintenance.ts`, `ticket-stage-runner.ts`, `copy.ts`, `restart-writer.ts`, `ref_node_sqlite`, `jiraBinding`, `requests.ts`, `jira-attempts.ts`, `cost-ledger.ts`, `unsent-time.ts`, `coordination.ts`, `goal-reviews.ts`, `judge-resumes.ts`, `alert-issue.ts`, `ref_node_crypto`, `ticket-evidence.ts`, `setup-stop-cap.ts`, `knowledge/routes.ts`, `azure.ts`, `cec.ts`, `session-bridge.ts`, `admit-repair-waits.ts`, `dependency-bots/adopt.ts`, `stopped-record.ts`, `sanitize`, `OfficeSnapshot`, `provider-observation.ts`, `Ticket`, `workKey`, `.save`, `http/commands.ts`, `intent.ts`, `release-unpark.ts`, `fact-bounds.ts`, `sign-in-unpark.ts`, `lesson-selection.ts`, `follow-production.ts`, `read-retries.ts`, `knowledge.ts`, `blocker-followups.ts`, `it-specialist.ts`, `run-accounting.ts`, `accessibility-sources.ts`, `checkpoint-retry.ts`, `review-run.ts`, `github/issue-publication.ts`, `Effects`, `candidate-child-context.ts`, `lesson-issue-ready.ts`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `command()` (e.g. with `startServiceTicks()` and `realMachine()`) actually correct?**
  _`command()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Should `incidents/routes.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06547619047619048 - nodes in this community are weakly interconnected._
- **Why does `GitHubIssuePublisher` connect `github/issue-publication.ts` to `Store`, `admit-improvement.ts`, `accessibility-sources.ts`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Should `OrgChart.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10017730496453901 - nodes in this community are weakly interconnected._
- **Why does `workKey()` connect `workKey` to `TicketJob`, `features/workflow.ts`, `accessibility-sources.ts`, `ref_node_path`, `shared.ts`, `Effects`, `scheduler.ts`, `closeout-recovery.ts`, `currentAssignment`, `harnessEffect`, `github-delivery.ts`, `digest`, `remove-candidate.ts`, `store.ts`, `scheduled-work.ts`, `Store`, `restart-writer.ts`, `requests.ts`, `coordination.ts`, `ref_node_crypto`, `dependency-bots/adopt.ts`, `stopped-record.ts`, `Ticket`, `http/commands.ts`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Should `TicketJob` be split into smaller, more focused modules?**
  _Cohesion score 0.06712564543889846 - nodes in this community are weakly interconnected._