# Graph Report - the-office  (2026-11-26)

## Corpus Check
- 1232 files · ~521,005 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 6348 nodes · 27985 edges · 163 communities (152 shown, 11 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 1024 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9287a89c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- incidents/routes.ts
- OrgChart.tsx
- worker-runtime.ts
- ref_node_crypto
- cx
- ControlStore
- config.ts
- rootArtifact
- shared.ts
- TelemetryPanel.tsx
- .transaction
- control-store.ts
- OfficeSnapshot
- admit-improvement.ts
- advance-metadata-park.ts
- scheduled-captures.ts
- run-retrospective.ts
- record-trigger.ts
- deploy-command.ts
- DrawerTopic.tsx
- holdReason
- dependency-bots/adopt.ts
- retrospective-subject.ts
- jira-time.ts
- deploy-plan.ts
- Outbox.tsx
- agents.ts
- owner-merged-stopped.ts
- accept-stage-result.ts
- index.tsx
- GitHubDelivery
- deployed-fixes.ts
- index.ts
- remove-candidate.ts
- call-scope.ts
- wiki-graph.cjs
- scheduled-work.ts
- routing.cjs
- redact-evidence.ts
- assignments.ts
- stop-reason.ts
- time-scope.ts
- engine.ts
- project-bindings-config.ts
- Offices
- harness-baseline.ts
- OfficeScene.tsx
- assignment.ts
- cec.ts
- pilot-delivery.ts
- QuestionStepper.tsx
- brain-maintenance.ts
- projects.ts
- state-parts.ts
- jiraBinding
- ref_node_child_process
- features.ts
- deploy.ts
- ref_node_path
- time-readback.ts
- cost-ledger.ts
- unsent-time.ts
- maintenance/maintenance.ts
- ref_react
- judge-resumes.ts
- validate_pr_body.cjs
- audit-plan-candidates.cjs
- daily-cto.ts
- resume-arrivals.ts
- ticket-evidence.ts
- constellation-runtime.ts
- setup-stop-cap.ts
- session-context-file.ts
- knowledge/routes.ts
- session-scope.ts
- service-health.ts
- project-bindings.ts
- diagnostic-snapshot.ts
- incidents.ts
- fact-bounds.ts
- session-bridge.ts
- Coordinator
- release-unpark.ts
- alert-issue.ts
- viewer.js
- weekly-rollup.ts
- stopped-record.ts
- ref_zod
- stop-service.ts
- spawn-command.ts
- provider-observation.ts
- readable-jira-comment.ts
- session-context-client.ts
- plans.cjs
- http/commands.ts
- capture-session-clone.py
- sign-in-unpark.ts
- restart-writer.ts
- Ticket
- archive-plan.cjs
- .emit
- digest
- coordination.ts
- on-merge-sync.cjs
- backup-stores.ts
- extract-worker.mjs
- service-plist.ts
- work.ts
- DeploymentFence
- wiki-sync.ts
- blocker-followups.ts
- timed-statements.ts
- outbox.ts
- Store
- slack-supersession.ts
- telemetry.ts
- qa.ts
- qa-plan-continuation.ts
- writer-restart.ts
- github/issue-publication.ts
- GoalList.tsx
- follow-production.ts
- resume-control.ts
- createConstellation
- refresh-issue-state.cjs
- knowledge.ts
- currentAssignment
- lesson-issue-ready.ts
- node-visuals.ts
- accessibility-sources.ts
- pre-push-boundary.ts
- it-specialist.ts
- install-service.mjs
- run-accounting.ts
- project-policy.ts
- controller-runtime.ts
- assignment-poll.ts
- .save
- ledger.ts
- effects.ts
- session-snapshot-cleanup.ts
- scene-motion.ts
- scheduler.ts
- production.ts
- reconcile-merges.cjs
- preferences-store.ts
- RoomCamera.tsx
- metadata-park-words.ts
- validate_wiki_pr_body.cjs
- harnessEffect
- common.cjs
- LessonsPanel.tsx
- parked-card-refusal.ts
- qa-plan-retry.ts
- incident-command.ts
- command-registry.ts
- handover-cms.ts
- ProjectProgress
- JiraWorklogTransport
- routing.js
- packed-consumer-pnpm.ts
- store.ts
- InFlightOperations

## God Nodes (most connected - your core abstractions)
1. `Store` - 451 edges
2. `TicketJob` - 217 edges
3. `digest()` - 160 edges
4. `command()` - 155 edges
5. `holdReason()` - 141 edges
6. `GitHubDelivery` - 129 edges
7. `OfficeSnapshot` - 123 edges
8. `artifact()` - 114 edges
9. `workKey()` - 110 edges
10. `StageResult` - 110 edges

## Surprising Connections (you probably didn't know these)
- `publish()` --indirect_call--> `title()`  [INFERRED]
  scripts/graphify/publish-refresh.cjs → src/knowledge/map/grouping.ts
- `BreakdownTable()` --indirect_call--> `cell()`  [INFERRED]
  src/telemetry/BreakdownTable.tsx → scripts/wiki/archive-plan.cjs
- `apply()` --indirect_call--> `note()`  [INFERRED]
  src/conversations/OutboxSavedImplementation.tsx → server/cec/parking/resume-parked.ts
- `UnrecordedResult` --references--> `StageResult`  [EXTRACTED]
  server/cec/unrecorded-result.ts → src/shared.ts
- `StageContinuation` --references--> `WorkTime`  [EXTRACTED]
  server/cec/stage-continuation.ts → src/shared.ts

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
- 2-file cycle: `server/workers/process.ts -> server/workers/spawn-command.ts -> server/workers/process.ts`
- 3-file cycle: `server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-guard.ts -> server/delivery/pipeline/github-delivery.ts`

## Communities (163 total, 11 thin omitted)

### Community 0 - "incidents/routes.ts"
Cohesion: 0.05
Nodes (65): citationFault(), CitationSchema, SourceVersions, sourceVersions(), dismiss(), DISMISSAL_CITATIONS, DISMISSAL_REASON, DismissalFacts (+57 more)

### Community 1 - "OrgChart.tsx"
Cohesion: 0.11
Nodes (37): label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+29 more)

### Community 2 - "worker-runtime.ts"
Cohesion: 0.05
Nodes (52): candidateWorkspaceEnvironment(), ApproachSchema, assignmentSubject(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose() (+44 more)

### Community 3 - "ref_node_crypto"
Cohesion: 0.09
Nodes (52): approveFeature(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), artifactPath(), digest(), document() (+44 more)

### Community 4 - "cx"
Cohesion: 0.10
Nodes (78): Outbox(), blockedSummary(), itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps(), ServiceHealthPanel(), followUp() (+70 more)

### Community 5 - "ControlStore"
Cohesion: 0.11
Nodes (13): DailyCTO, EvidenceRequestConflict, dailyReviewPrompt(), reviewWeekday(), Briefing, saveReviewBriefing(), SeenReports, WAITING (+5 more)

### Community 6 - "config.ts"
Cohesion: 0.11
Nodes (20): ctoChatPrompt(), READABLE_REPLY, slackSendPrompt(), slackVerifyPrompt(), investigationEvidence(), invocationSource(), sections, officeSource() (+12 more)

### Community 7 - "rootArtifact"
Cohesion: 0.09
Nodes (51): assertPostConflictFiles(), assertPostConflictOwnership(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), reconcileCompletedConflictDraft(), routeReadyPostConflictPublication(), verifyInitialDraftConflictPreparation(), within() (+43 more)

### Community 8 - "shared.ts"
Cohesion: 0.03
Nodes (152): writerRestartInstruction(), requireDeliveryAuthority(), assertDeliveryMayMutate(), assertMayMutate(), harnessDelivers(), legacyRecovery(), BOARD_RULE, conflictRefreshInstruction() (+144 more)

### Community 9 - "TelemetryPanel.tsx"
Cohesion: 0.09
Nodes (43): TelemetryReport, LiveAgentTask(), Props, RunningTask(), text(), Agent, AzureBuild, BreakdownTable() (+35 more)

### Community 10 - ".transaction"
Cohesion: 0.12
Nodes (22): featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS, reserveReplacement(), stageBudget() (+14 more)

### Community 11 - "control-store.ts"
Cohesion: 0.23
Nodes (7): checkpointLabel(), applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, statementCache(), initialSnapshot()

### Community 12 - "OfficeSnapshot"
Cohesion: 0.04
Nodes (91): isFollowed(), jiraQueueProgress(), nextStage(), deliveryRoles, JiraQueueProgress, TicketProgress, themeColor, App() (+83 more)

### Community 13 - "admit-improvement.ts"
Cohesion: 0.18
Nodes (20): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+12 more)

### Community 14 - "advance-metadata-park.ts"
Cohesion: 0.11
Nodes (52): ProjectCard, advanceMetadataPark(), Parked, releaseWords(), sentAnything(), cardResumeRoute(), effectiveParkPickup(), PICKUP_ASSIGNEE (+44 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.11
Nodes (58): dispatchNightly(), requestDelivery(), createFeature(), approvedDelivery(), bindDelivery(), featureDeliveryContext(), featureEffectGate(), assertEnrollable() (+50 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.10
Nodes (40): acceptRetrospective(), BLOCKING, BlockingTrigger, blockingTrigger(), isBlocking(), BrainOverlap, brainOverlap(), brainOverlapQuery() (+32 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.11
Nodes (36): baselined(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences(), clip(), maintenanceBlockedId(), MaintenanceCandidate (+28 more)

### Community 18 - "deploy-command.ts"
Cohesion: 0.11
Nodes (31): CONTROLLER_ENTRY, ControllerPin, Pin, pinnedController(), readControllerPin(), writeControllerPin(), controllerOf(), deployCommand() (+23 more)

### Community 19 - "DrawerTopic.tsx"
Cohesion: 0.11
Nodes (29): createConversationDrafts(), SendMessage, BrainDrawer(), DrawerNavigation, DrawerPage(), DrawerEntry, DrawerPath, popPage() (+21 more)

### Community 20 - "holdReason"
Cohesion: 0.04
Nodes (187): StoppedWriter, closeoutReceipt(), boardPreflightCandidate(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment (+179 more)

### Community 21 - "dependency-bots/adopt.ts"
Cohesion: 0.13
Nodes (31): Execute, adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, DependabotPR, dependabotPR() (+23 more)

### Community 22 - "retrospective-subject.ts"
Cohesion: 0.19
Nodes (15): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+7 more)

### Community 23 - "jira-time.ts"
Cohesion: 0.08
Nodes (52): twgProfile(), attempted(), attemptState(), bound(), covers(), jiraAttempts(), JiraAttemptState, open() (+44 more)

### Community 24 - "deploy-plan.ts"
Cohesion: 0.27
Nodes (14): Body, DeploymentFenceState, fenceTokenDigest(), operationPaths(), planDeployment(), createDeployToken(), readDeployToken(), removeDeployToken() (+6 more)

### Community 25 - "Outbox.tsx"
Cohesion: 0.10
Nodes (23): knowledgeOutbox(), DAYS, dueLessonDecisions(), easternWeek(), isLessonDecision(), LESSON_DIGEST, LessonDecision, PARTS (+15 more)

### Community 26 - "agents.ts"
Cohesion: 0.06
Nodes (45): implementationWorkerContext(), cecReconcilePrompt(), RefusedQAResult, savedStageCompletion(), assertContinuableWorktree(), CONTINUABLE, continuationPrompt(), MAX_CONTINUATIONS (+37 more)

### Community 27 - "owner-merged-stopped.ts"
Cohesion: 0.08
Nodes (38): initialManualStart(), recordCandidateCleanup(), maintenanceCandidate(), notOwned(), removeCandidate(), retryCandidateCleanup(), needsReconciliation(), retireBacklogged() (+30 more)

### Community 28 - "accept-stage-result.ts"
Cohesion: 0.08
Nodes (55): containedFile(), findingsBlock(), QA_STAGES, reviewAdvisoryIds(), Reviewed, withoutReviewAdvisories(), handsOff(), needsDecision() (+47 more)

### Community 29 - "index.tsx"
Cohesion: 0.07
Nodes (70): ctoInputFailure(), OutboxCTOInput(), recover(), OutboxSavedImplementation(), apply(), review(), OutboxSavedPlan(), reconcile() (+62 more)

### Community 30 - "GitHubDelivery"
Cohesion: 0.06
Nodes (66): harnessCloseout(), PASSING, verifyMergeActions(), runHarnessStage(), harnessStageResult(), receipt(), StageContext, GitHubDelivery (+58 more)

### Community 31 - "deployed-fixes.ts"
Cohesion: 0.12
Nodes (30): inHistoryOf(), CompareMemory, compareMemory(), COMPARES_PER_PASS, comparison(), DeployedFixes, DeployedFixesInput, recordDeployedFixes() (+22 more)

### Community 32 - "index.ts"
Cohesion: 0.05
Nodes (60): implementationContinuationRoute(), qaPlanRetryRoute(), incidentsRoute(), packetOf(), resumeSwitch(), writeEvent(), close(), config (+52 more)

### Community 33 - "remove-candidate.ts"
Cohesion: 0.21
Nodes (12): interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval, Execute (+4 more)

### Community 34 - "call-scope.ts"
Cohesion: 0.07
Nodes (43): add(), addSource(), busiest(), CallLedger, Entry, sourceRows(), Sources, CallCounts (+35 more)

### Community 35 - "wiki-graph.cjs"
Cohesion: 0.22
Nodes (19): connections(), fs, main(), path, ensureInside(), hasSymlinkComponent(), slash(), collect() (+11 more)

### Community 36 - "scheduled-work.ts"
Cohesion: 0.08
Nodes (38): freshOwnershipRead(), deliverySlot(), Ownership, ownershipContext, refreshDeliveryOwnership(), RefreshOwnership, withAmendmentOwnership(), metadataRequestResolved() (+30 more)

### Community 37 - "routing.cjs"
Cohesion: 0.11
Nodes (31): fs, main(), path, { spawnSync }, digest(), frontmatterProblems(), adjacency(), edgeCost() (+23 more)

### Community 38 - "redact-evidence.ts"
Cohesion: 0.11
Nodes (18): AFTER_LABEL, ASSIGNMENT, AWS_KEY_ID, BARE_CREDENTIAL, BARE_UNIT, BARE_VALUE, CAMEL_START, CONTROL_ESCAPE (+10 more)

### Community 39 - "assignments.ts"
Cohesion: 0.08
Nodes (35): clip(), DEMAND_LIMIT, demandFacts(), key(), LessonKey, notes(), AssignmentLookups, assignmentLookups (+27 more)

### Community 40 - "stop-reason.ts"
Cohesion: 0.36
Nodes (7): APPROACH_GUARD_REJECTION, SourceClosed, classifyStop(), stopReason(), incompleteReadOutput(), planReadRetry(), temporaryReadFailure()

### Community 41 - "time-scope.ts"
Cohesion: 0.15
Nodes (25): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence(), CaptureContext (+17 more)

### Community 42 - "engine.ts"
Cohesion: 0.08
Nodes (12): applyIntakeObservation(), checkMail(), drainMail(), requestMail(), enableNightly(), ingest(), ResumeProject, drainMaintenance() (+4 more)

### Community 43 - "project-bindings-config.ts"
Cohesion: 0.11
Nodes (36): enumerateIntakeList(), inPickupOrder(), Intake, text(), resolveBlockedTransition(), document(), transitionWithComment(), jiraAccount() (+28 more)

### Community 44 - "Offices"
Cohesion: 0.15
Nodes (3): QuestionNotifications, mirrorOfficeKnowledge(), Offices

### Community 45 - "harness-baseline.ts"
Cohesion: 0.15
Nodes (22): BaselineReport, baselineReport(), BaselineSource, baselineText(), millions(), row(), share(), add() (+14 more)

### Community 46 - "OfficeScene.tsx"
Cohesion: 0.16
Nodes (34): withoutElapsed(), Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk() (+26 more)

### Community 47 - "assignment.ts"
Cohesion: 0.13
Nodes (24): latestQA(), notPassedInLatestQA(), QACoverage, qaCoverage(), same(), Tested, safeWebUrl(), officeQAGuidance() (+16 more)

### Community 48 - "cec.ts"
Cohesion: 0.10
Nodes (31): intakeEnumeration(), intakeMembership(), cecPrompt(), cecIntakePrompt(), cecReadbackPrompt(), cecTransitionPrompt(), plainResume(), resolvedDecisionNote() (+23 more)

### Community 49 - "pilot-delivery.ts"
Cohesion: 0.08
Nodes (59): candidateBranchMoved(), endChangeScope(), scopeOutgrown(), confirmsMovedHead(), Moved, movedHeadUnconfirmed(), recordConfirmedHead(), routeConfirmedHead() (+51 more)

### Community 50 - "QuestionStepper.tsx"
Cohesion: 0.19
Nodes (18): FeatureQuestionProjection, OutboxQuestionRound(), send(), draftKey(), readDraft(), saveDraft(), QuestionRound(), nextQuestion() (+10 more)

### Community 51 - "brain-maintenance.ts"
Cohesion: 0.11
Nodes (22): completeNativeCheckpoint(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, brainResultStop(), BrainStatusSchema, identity, GateMark (+14 more)

### Community 52 - "projects.ts"
Cohesion: 0.08
Nodes (51): escaped(), IntakeBinding, intakeJql(), intakeLocation(), projectListScope(), IntakeView, assertFeaturePlanningConfig(), goalEvidencePath() (+43 more)

### Community 53 - "state-parts.ts"
Cohesion: 0.13
Nodes (16): readSavedState(), LARGE_KEY_CHARS, plain(), RedactedEntries, RedactedEntry, redactEntries(), joinParts(), PartRow (+8 more)

### Community 54 - "jiraBinding"
Cohesion: 0.25
Nodes (4): contentSchema(), JiraIssuePublisher, publicationDescription(), jiraBinding()

### Community 55 - "ref_node_child_process"
Cohesion: 0.13
Nodes (18): changedPaths(), { execFileSync }, files, isMapInput(), mapOnly(), { execFileSync }, git(), publish() (+10 more)

### Community 56 - "features.ts"
Cohesion: 0.07
Nodes (58): commandFeature(), reviewQuestions(), discoveryPrompt(), planPrompt(), automaticIntakeWait(), automaticTicketIntakeWait(), classifyFeatureFailure(), automaticEnabled() (+50 more)

### Community 57 - "deploy.ts"
Cohesion: 0.12
Nodes (34): abandon(), advance(), DEPLOY_STEPS, DeployFacts, append(), assertNext(), deployJournalPath(), DeployJournalView (+26 more)

### Community 58 - "ref_node_path"
Cohesion: 0.05
Nodes (62): closedReadonlyPlan(), Document, document(), qaPlanEvidenceGap(), qaRunDirectory(), MISSING_SAVED_PLAN, recoverSavedPlan(), ctoInputIdentityMatches() (+54 more)

### Community 59 - "time-readback.ts"
Cohesion: 0.15
Nodes (16): JiraAttempt, JiraWorklogExpected, Ledger, Read, TimeLedger, dueReadback(), missedSinceVerified(), Readback (+8 more)

### Community 60 - "cost-ledger.ts"
Cohesion: 0.17
Nodes (25): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress(), effectId() (+17 more)

### Community 61 - "unsent-time.ts"
Cohesion: 0.25
Nodes (12): publishableEntry(), settlementPending(), superseded(), ticketUnresolved(), clearUnsent(), dueUnsent(), markUnsent(), releaseUnsent() (+4 more)

### Community 62 - "maintenance/maintenance.ts"
Cohesion: 0.11
Nodes (26): maintenancePolicies(), sourceFindings, sourceReview(), candidateOwner(), SETTLED, skipOwnedCandidate(), Skipped, skippedCandidateLedger() (+18 more)

### Community 63 - "ref_react"
Cohesion: 0.06
Nodes (65): KnowledgeActivity, KnowledgeActivityPage, KnowledgeEdge, KnowledgeMap, KnowledgeNode, ChatMarkdown(), ConversationDraft, ChatMarkdown (+57 more)

### Community 64 - "judge-resumes.ts"
Cohesion: 0.05
Nodes (52): absent(), IncidentLedger, replayed(), boundaryCrossed(), Crossing, Progress, CheckpointProgress, checkpointProgress() (+44 more)

### Community 65 - "validate_pr_body.cjs"
Cohesion: 0.36
Nodes (8): fs, main(), readableText(), REQUIRED_CHECKS, REQUIRED_SECTIONS, sections(), validatePullRequestBody(), withoutComments()

### Community 66 - "audit-plan-candidates.cjs"
Cohesion: 0.14
Nodes (31): audit(), branchIssueNumbers(), classify(), distinctiveTitleWords(), { execFileSync }, extractPaths(), findPrForMergeSubject(), fmtCommit() (+23 more)

### Community 67 - "daily-cto.ts"
Cohesion: 0.12
Nodes (24): currentCitations(), Fact, NOT_CURRENT, PROVIDER_ERROR, evidenceRequestConflicts, applyGoalReview(), DailyResultSchema, DeliveryJob (+16 more)

### Community 68 - "resume-arrivals.ts"
Cohesion: 0.11
Nodes (65): DeliveryAuthorityInput, canonical(), assessResumes(), Standing, CheckpointEligibility, checkpointEligibility(), admitAssignmentResume(), forAssignment() (+57 more)

### Community 69 - "ticket-evidence.ts"
Cohesion: 0.11
Nodes (32): assetDownloader(), attachmentKind(), evidenceDirectory(), readEvidence(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS (+24 more)

### Community 70 - "constellation-runtime.ts"
Cohesion: 0.15
Nodes (16): CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point, focusOverlayMotion(), FocusOverlayLayout (+8 more)

### Community 71 - "setup-stop-cap.ts"
Cohesion: 0.12
Nodes (24): rerunsInterruptedQA(), officeRefusedQA(), confirmSetupStopCap(), consecutiveSetupStops(), Counted, SETUP_STOP_CAP, setupStopCapConfirmed(), setupStopOn() (+16 more)

### Community 72 - "session-context-file.ts"
Cohesion: 0.21
Nodes (14): unpackContextFailure(), ContextFoldPrefix, contextFoldPrefix(), SessionContextCheckpoint, captureSessionContextClone(), ContextReadPhase, SessionContextDeadline, sessionContextFile() (+6 more)

### Community 73 - "knowledge/routes.ts"
Cohesion: 0.10
Nodes (27): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, CommittedBrain (+19 more)

### Community 74 - "session-scope.ts"
Cohesion: 0.20
Nodes (16): Bound, claudeScopeParser(), claudeSessionScope(), CODEX_ROLLOUTS, contextReaders(), retainSessionMessage(), SessionConversation, escaped() (+8 more)

### Community 75 - "service-health.ts"
Cohesion: 0.12
Nodes (23): ClaudeLoginRefusal, claudeLoginRefusal(), claudeRefusalWords(), RECORDED_REFUSALS, refusedClaudeRow(), listenerHealth(), providers, ProviderStatusChecks (+15 more)

### Community 76 - "project-bindings.ts"
Cohesion: 0.11
Nodes (31): az(), AzureMonitor, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs(), fullActivePRs() (+23 more)

### Community 77 - "diagnostic-snapshot.ts"
Cohesion: 0.16
Nodes (18): assignmentDiagnostics(), diagnosticContext(), diagnosticSnapshot(), followUpPicture(), publishITReport(), archiveOldReports(), RETAINED_REPORTS, archiveByMonth() (+10 more)

### Community 78 - "incidents.ts"
Cohesion: 0.08
Nodes (55): attributedRecords(), foldsItsRun(), groupCandidates(), ObservedIncident, ObservedSubject, PacketInput, digest(), fingerprint() (+47 more)

### Community 79 - "fact-bounds.ts"
Cohesion: 0.11
Nodes (27): GitHubMonitor, githubPRDescription(), collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip() (+19 more)

### Community 80 - "session-bridge.ts"
Cohesion: 0.10
Nodes (29): codexDaemonProcesses(), accountCodexProcesses(), CodexProcessInventory, codexProcessInventory(), DesktopSessions, unaccountedProcesses(), codexThreadMetadata(), METADATA_CHUNK (+21 more)

### Community 82 - "release-unpark.ts"
Cohesion: 0.33
Nodes (8): due(), MAX_RELEASE_UNPARKS, RELEASE_CHECK_MS, returnToPickup(), unparkReleasedWaits(), compare(), highestStableAtLeast(), parts()

### Community 83 - "alert-issue.ts"
Cohesion: 0.16
Nodes (24): readBackOrThrow(), retryRead(), AlertIssue, alertIssueBody(), alertIssueTitle(), alertMarker(), closeAlertIssue(), ensureAlertIssue() (+16 more)

### Community 84 - "viewer.js"
Cohesion: 0.19
Nodes (25): addMetaLink(), addMetaRow(), addRelationship(), applyView(), buildIndexes(), buildLegend(), buildModel(), buildRenderer() (+17 more)

### Community 85 - "weekly-rollup.ts"
Cohesion: 0.17
Nodes (22): learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), RETROSPECTIVE_TIMEOUT (+14 more)

### Community 86 - "stopped-record.ts"
Cohesion: 0.07
Nodes (63): boundedEvidence(), expectedWait(), StopFacts, FailedMailCheck, lastFailedMailCheck(), lastMailCheckOutcome(), MailCheckOutcome, normalizeCause() (+55 more)

### Community 87 - "ref_zod"
Cohesion: 0.08
Nodes (33): assertConversationReadback(), Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff(), saveGoals() (+25 more)

### Community 88 - "stop-service.ts"
Cohesion: 0.21
Nodes (16): ControllerEffects, DEPLOY_PROJECT, installPlist(), bootout(), bootstrap(), Execute, serviceLoaded(), until() (+8 more)

### Community 89 - "spawn-command.ts"
Cohesion: 0.12
Nodes (24): exitFailure(), inactivityWatch(), At, Errno, errno(), GroupInventory, GroupProbe, LifecycleDiagnostic (+16 more)

### Community 90 - "provider-observation.ts"
Cohesion: 0.12
Nodes (27): correlatedBuild(), Azure, azurePipelines(), outcome(), Read, RUNS_PER_PIPELINE, Api, githubWorkflows() (+19 more)

### Community 91 - "readable-jira-comment.ts"
Cohesion: 0.11
Nodes (32): CommentPage, commentReadback(), devUpdate(), HEADLINE, jiraRecord(), unpack(), parksInJira(), postDevUpdate() (+24 more)

### Community 92 - "session-context-client.ts"
Cohesion: 0.11
Nodes (19): claudeSessionContext(), readTranscript, codexSessionContext(), readRollout, packContextFailure(), PackedContextFailure, ContextThread, contextThread() (+11 more)

### Community 93 - "plans.cjs"
Cohesion: 0.20
Nodes (18): walk(), association(), auditedDigests(), candidate(), collapseByTitle(), discover(), fromMarkdown(), fs (+10 more)

### Community 94 - "http/commands.ts"
Cohesion: 0.22
Nodes (14): DiscoveryResumeInput, baselineLearning(), configureKnowledge(), declineLessonIssue(), reactivateLesson(), retireLesson(), decideOfficeProposal(), retireOfficeLesson() (+6 more)

### Community 96 - "sign-in-unpark.ts"
Cohesion: 0.16
Nodes (21): currentEnvironmentWait(), environmentWait(), hasPendingDelivery(), resumeAfterSignIn(), signInWait(), isSetupStop(), MAX_SIGN_IN_UNPARKS, waitingStep() (+13 more)

### Community 97 - "restart-writer.ts"
Cohesion: 0.17
Nodes (18): ATTEMPT_DELAYS_MS, nextAttemptAt(), restartStoppedWriters(), unchangedSinceAccepted(), NOT_RETRYABLE, releaseFunds(), stoppedWriter(), WRITER_STAGES (+10 more)

### Community 98 - "Ticket"
Cohesion: 0.14
Nodes (19): carriedNotRepeated(), applyChangeScope(), levels(), MAX_CHECKS, changeScopeNote(), Scoped, owedUnderScope(), scopeBase() (+11 more)

### Community 99 - "archive-plan.cjs"
Cohesion: 0.12
Nodes (31): fs, main(), parse(), path, archive(), cell(), ensureIndex(), fromArgs() (+23 more)

### Community 100 - ".emit"
Cohesion: 0.07
Nodes (40): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), currentOutbox(), clamp(), LIMITS (+32 more)

### Community 101 - "digest"
Cohesion: 0.05
Nodes (74): GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles(), ContinuationIO (+66 more)

### Community 102 - "coordination.ts"
Cohesion: 0.09
Nodes (42): MergeNotifications, admit(), compatible(), dependencyCompletionKey(), dependencyEligibility(), issueKey(), observePrerequisites(), PrerequisiteSchema (+34 more)

### Community 103 - "on-merge-sync.cjs"
Cohesion: 0.18
Nodes (23): slugify(), fieldSpan(), keyPattern(), list(), parseListLiteral(), quote(), render(), scalar() (+15 more)

### Community 104 - "backup-stores.ts"
Cohesion: 0.10
Nodes (36): absentAdmission(), AdmissionComparison, AdmissionSnapshot, compareAdmissions(), snapshotAdmissions(), BackupEntry, BackupInput, BackupInventory (+28 more)

### Community 105 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 106 - "service-plist.ts"
Cohesion: 0.10
Nodes (37): runningRevision(), runningRevision(), releaseIdentity(), runtimeRevision(), ActiveRelease, readActiveRelease(), BUILD_ENV, buildRelease() (+29 more)

### Community 107 - "work.ts"
Cohesion: 0.14
Nodes (18): effectiveCause(), REPLACED, BLOCKED_CAUSES, blockedCauses(), NONE, projectReadiness(), ProjectReadiness, AssignmentResult (+10 more)

### Community 108 - "DeploymentFence"
Cohesion: 0.38
Nodes (3): assertToken(), DeploymentFence, DeploymentFenceRouteContext

### Community 109 - "wiki-sync.ts"
Cohesion: 0.14
Nodes (12): ensureTrackingIssue(), findTrackingIssue(), ownTracking(), trackingIssueBody(), trackingIssueTitle(), trackingMarker(), centralCompanionHandoff(), centralCompanionIssue() (+4 more)

### Community 110 - "blocker-followups.ts"
Cohesion: 0.11
Nodes (48): conversationReadbackReady(), followupOf(), pendingReadback(), queueConversationReadback(), readbackEnding(), replacedReadback(), uncertainConversations(), conversationResolved() (+40 more)

### Community 111 - "timed-statements.ts"
Cohesion: 0.22
Nodes (12): StoreTimings, NAMED, rowsText(), rowText(), SQL_TOKEN, statementName(), text(), timed() (+4 more)

### Community 112 - "outbox.ts"
Cohesion: 0.11
Nodes (26): capabilityBlockedReviews(), latestReviews(), metadataParkAction(), ADOPTION_STALLED_MS, projectOutbox(), item(), syncOutbox(), OwnerStepItem (+18 more)

### Community 113 - "Store"
Cohesion: 0.06
Nodes (23): Assignment, jiraText(), Transition, descriptionPreimage(), plain(), GitHubFeaturePublisher, JiraFeaturePublisher, FeatureReviewRunner (+15 more)

### Community 114 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 115 - "telemetry.ts"
Cohesion: 0.07
Nodes (42): CodexRollout, CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL (+34 more)

### Community 119 - "github/issue-publication.ts"
Cohesion: 0.20
Nodes (9): PublicationReceipt, Assign, Board, Content, GitHubIssuePublisher, number(), same(), FeatureManifestItem (+1 more)

### Community 120 - "GoalList.tsx"
Cohesion: 0.24
Nodes (11): CTOReview(), goalState, DailyCTO(), reportDate(), goalKey(), GoalList(), card(), InlineText() (+3 more)

### Community 121 - "follow-production.ts"
Cohesion: 0.21
Nodes (16): awaitingJiraStatus(), awaitingProduction(), FOLLOW_DAYS, followed(), Azure, AzureRead, containedIn(), followProduction() (+8 more)

### Community 122 - "resume-control.ts"
Cohesion: 0.26
Nodes (8): absent(), NEVER_ENABLED, ResumeControl, stated(), Stored, unreadable(), IncidentsRouteContext, ResumeSwitch

### Community 123 - "createConstellation"
Cohesion: 0.18
Nodes (5): ConstellationRuntime, createConstellation(), enter(), finishTap(), move()

### Community 124 - "refresh-issue-state.cjs"
Cohesion: 0.20
Nodes (19): advanceFence(), closingIssues(), githubRefs(), key(), normalizeGithubQuery(), normalizeRepository(), parseGithubQuery(), ref() (+11 more)

### Community 125 - "knowledge.ts"
Cohesion: 0.04
Nodes (57): args, [cmd,...rawArgs], commands, key, projectIndex, Accepted, normalizeStatement(), RETROSPECTIVE_HISTORY (+49 more)

### Community 126 - "currentAssignment"
Cohesion: 0.05
Nodes (64): Document, document(), isAccessOnlyPlan(), settledAccessOnlyState(), consumeQAPlanRetry(), continueAccessOnlyPlan(), entryExists(), entryExists() (+56 more)

### Community 127 - "lesson-issue-ready.ts"
Cohesion: 0.40
Nodes (8): firstLane(), instruction(), LaneMove, move(), readyLessonIssue(), readyPendingLessonIssues(), settle(), tryReadyLessonIssue()

### Community 128 - "node-visuals.ts"
Cohesion: 0.20
Nodes (14): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+6 more)

### Community 129 - "accessibility-sources.ts"
Cohesion: 0.26
Nodes (16): accessibilitySources(), actionable(), closingPull(), Finding, handoffIssue(), issueLines(), issueSource(), observation (+8 more)

### Community 130 - "pre-push-boundary.ts"
Cohesion: 0.24
Nodes (11): Event, exactCommand(), Invocation, localHookCommand(), one(), prePushRejection(), PushIdentity, retirementBoundary() (+3 more)

### Community 131 - "it-specialist.ts"
Cohesion: 0.13
Nodes (23): savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), heldFor(), ITContext, recoveryHeld(), recoveryWait() (+15 more)

### Community 132 - "install-service.mjs"
Cohesion: 0.29
Nodes (4): file, folder, logs, root

### Community 133 - "run-accounting.ts"
Cohesion: 0.09
Nodes (41): BoundedRead, done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf(), backfillClaudeCost(), CompletionReader (+33 more)

### Community 134 - "project-policy.ts"
Cohesion: 0.23
Nodes (10): leftToNextRun(), NEXT_RUN_DUE_MS, night(), STOPPED, REOBSERVED, BEFORE_POLICY, Project, ProjectPolicy (+2 more)

### Community 135 - "controller-runtime.ts"
Cohesion: 0.08
Nodes (36): StoreDatabase, controllerEffects(), alive(), ControllerMachine, option(), realMachine(), runController(), DEFAULT_TIMINGS (+28 more)

### Community 136 - "assignment-poll.ts"
Cohesion: 0.09
Nodes (32): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), configureNotices(), noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), Admission (+24 more)

### Community 137 - ".save"
Cohesion: 0.10
Nodes (37): findComment(), readIssue(), commentDecision(), commentRefused(), decisionComment(), effectFields(), moveToBlocked(), parkDecision() (+29 more)

### Community 138 - "ledger.ts"
Cohesion: 0.11
Nodes (33): acceptedCompletionResolution(), INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationCandidates(), investigationId(), finishedSubjectResolution(), investigationFollowUps(), interruptedQARerunResolution() (+25 more)

### Community 139 - "effects.ts"
Cohesion: 0.15
Nodes (11): featureById(), Link, linkFeature(), FeaturePublisher, publishFeature(), reconcilePublication(), uncertainPublications(), reserveIdentity() (+3 more)

### Community 140 - "session-snapshot-cleanup.ts"
Cohesion: 0.40
Nodes (5): SNAPSHOT_PREFIX, removeStaleSessionSnapshots(), SNAPSHOT_SWEEP_MS, STALE_SNAPSHOT_MS, sweepStaleSessionSnapshots()

### Community 141 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 142 - "scheduler.ts"
Cohesion: 0.12
Nodes (15): Clock, PROJECT_LOCAL, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch() (+7 more)

### Community 144 - "reconcile-merges.cjs"
Cohesion: 0.21
Nodes (15): remoteSlug(), collectPulls(), copyWikiForDryRun(), { execFileSync }, flattenPages(), fs, githubRequest(), isWikiBotPull() (+7 more)

### Community 145 - "preferences-store.ts"
Cohesion: 0.19
Nodes (9): PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS, OfficePreferences (+1 more)

### Community 146 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (7): CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility, overlayEntranceDelays(), SceneOverlay()

### Community 147 - "metadata-park-words.ts"
Cohesion: 0.42
Nodes (9): field(), FIELDS, MetadataField, metadataFields(), metadataParkWords(), metadataStopWords(), needed(), sentence() (+1 more)

### Community 148 - "validate_wiki_pr_body.cjs"
Cohesion: 0.33
Nodes (5): { execFileSync }, hasCanonicalWikiBody(), maintenanceBodies, matchesMaintenanceBody(), { readFileSync }

### Community 149 - "harnessEffect"
Cohesion: 0.22
Nodes (29): effectKey(), LaneOperation, laneWrite(), moveCardOnce(), Lane, MOVABLE, moveLane(), resolveLane() (+21 more)

### Community 150 - "common.cjs"
Cohesion: 0.11
Nodes (24): fs, main(), parse(), path, atomicWrite(), crypto, { execFileSync }, fs (+16 more)

### Community 151 - "LessonsPanel.tsx"
Cohesion: 0.08
Nodes (43): Conversation(), send(), LessonDecisionAction, lessonDecisionState(), readLessonDecision(), OutboxLessonDecision(), act(), readStatus() (+35 more)

### Community 152 - "parked-card-refusal.ts"
Cohesion: 0.52
Nodes (5): BLOCK, harnessBlockMove(), harnessParkedCard(), noted(), requeueParkedCardRefusals()

### Community 153 - "qa-plan-retry.ts"
Cohesion: 0.67
Nodes (3): QAPlanRetry, QAPlanRetryProof, QAPlanRetryRequest

### Community 154 - "incident-command.ts"
Cohesion: 0.38
Nodes (6): FLAGS, incidentCommand(), IncidentCommandIO, option(), USAGE, whole()

### Community 155 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 156 - "handover-cms.ts"
Cohesion: 0.33
Nodes (4): file, project, root, projectData()

### Community 163 - "store.ts"
Cohesion: 0.06
Nodes (34): accounting, DeliverySubject, nonDelivery, originalReads, interruptAdoptions(), legacy(), REMOVED_FIELDS, retireLegacyRecovery() (+26 more)

## Knowledge Gaps
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `incidents/routes.ts`, `worker-runtime.ts`, `ref_node_crypto`, `config.ts`, `rootArtifact`, `shared.ts`, `.transaction`, `control-store.ts`, `OfficeSnapshot`, `admit-improvement.ts`, `advance-metadata-park.ts`, `scheduled-captures.ts`, `run-retrospective.ts`, `record-trigger.ts`, `holdReason`, `dependency-bots/adopt.ts`, `retrospective-subject.ts`, `jira-time.ts`, `agents.ts`, `owner-merged-stopped.ts`, `accept-stage-result.ts`, `GitHubDelivery`, `index.ts`, `remove-candidate.ts`, `scheduled-work.ts`, `assignments.ts`, `time-scope.ts`, `engine.ts`, `project-bindings-config.ts`, `Offices`, `cec.ts`, `pilot-delivery.ts`, `brain-maintenance.ts`, `state-parts.ts`, `features.ts`, `ref_node_path`, `time-readback.ts`, `cost-ledger.ts`, `unsent-time.ts`, `maintenance/maintenance.ts`, `judge-resumes.ts`, `daily-cto.ts`, `resume-arrivals.ts`, `ticket-evidence.ts`, `setup-stop-cap.ts`, `knowledge/routes.ts`, `project-bindings.ts`, `diagnostic-snapshot.ts`, `fact-bounds.ts`, `session-bridge.ts`, `release-unpark.ts`, `alert-issue.ts`, `weekly-rollup.ts`, `stopped-record.ts`, `ref_zod`, `stop-service.ts`, `provider-observation.ts`, `readable-jira-comment.ts`, `http/commands.ts`, `sign-in-unpark.ts`, `restart-writer.ts`, `.emit`, `digest`, `coordination.ts`, `blocker-followups.ts`, `outbox.ts`, `github/issue-publication.ts`, `follow-production.ts`, `knowledge.ts`, `currentAssignment`, `lesson-issue-ready.ts`, `accessibility-sources.ts`, `it-specialist.ts`, `run-accounting.ts`, `controller-runtime.ts`, `assignment-poll.ts`, `.save`, `ledger.ts`, `effects.ts`, `scheduler.ts`, `harnessEffect`, `parked-card-refusal.ts`, `store.ts`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Should `incidents/routes.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05348101265822785 - nodes in this community are weakly interconnected._
- **Why does `holdReason()` connect `holdReason` to `project-policy.ts`, `rootArtifact`, `shared.ts`, `.save`, `assignment-poll.ts`, `admit-improvement.ts`, `dependency-bots/adopt.ts`, `harnessEffect`, `parked-card-refusal.ts`, `accept-stage-result.ts`, `GitHubDelivery`, `pilot-delivery.ts`, `ref_node_path`, `resume-arrivals.ts`, `release-unpark.ts`, `readable-jira-comment.ts`, `sign-in-unpark.ts`, `restart-writer.ts`, `digest`, `coordination.ts`, `blocker-followups.ts`, `outbox.ts`, `currentAssignment`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Should `OrgChart.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1072463768115942 - nodes in this community are weakly interconnected._
- **Why does `OfficeSnapshot` connect `OfficeSnapshot` to `incidents/routes.ts`, `OrgChart.tsx`, `it-specialist.ts`, `cx`, `ControlStore`, `project-policy.ts`, `assignment-poll.ts`, `TelemetryPanel.tsx`, `ledger.ts`, `shared.ts`, `scene-motion.ts`, `record-trigger.ts`, `DrawerTopic.tsx`, `LessonsPanel.tsx`, `Outbox.tsx`, `index.tsx`, `index.ts`, `store.ts`, `harness-baseline.ts`, `OfficeScene.tsx`, `projects.ts`, `state-parts.ts`, `features.ts`, `ref_node_path`, `maintenance/maintenance.ts`, `ref_react`, `judge-resumes.ts`, `resume-arrivals.ts`, `service-health.ts`, `project-bindings.ts`, `diagnostic-snapshot.ts`, `incidents.ts`, `stopped-record.ts`, `restart-writer.ts`, `.emit`, `work.ts`, `outbox.ts`, `Store`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Should `worker-runtime.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.053208137715179966 - nodes in this community are weakly interconnected._
- **Should `ref_node_crypto` be split into smaller, more focused modules?**
  _Cohesion score 0.08571428571428572 - nodes in this community are weakly interconnected._