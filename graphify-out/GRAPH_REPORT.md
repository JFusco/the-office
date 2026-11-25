# Graph Report - the-office  (2026-11-25)

## Corpus Check
- 1223 files · ~517,483 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 6272 nodes · 27747 edges · 162 communities (154 shown, 8 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 1011 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c314d121`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- incidents/routes.ts
- OrgChart.tsx
- worker-runtime.ts
- features.ts
- cx
- daily-cto.ts
- requests.ts
- index.tsx
- retrospective-subject.ts
- TelemetryPanel.tsx
- .transaction
- Store
- App.tsx
- admit-improvement.ts
- advance-metadata-park.ts
- scheduled-captures.ts
- TicketTimeline.tsx
- record-trigger.ts
- deploy-command.ts
- closeout-recovery.ts
- artifact
- harnessEffect
- weekly-rollup.ts
- jira-time.ts
- deploy.ts
- GitHubDelivery
- agents.ts
- workKey
- github-delivery.ts
- Goals.tsx
- digest
- knowledge/routes.ts
- index.ts
- remove-candidate.ts
- run.ts
- wiki-graph.cjs
- scheduled-work.ts
- routing.cjs
- redact-evidence.ts
- run-retrospective.ts
- http/commands.ts
- time-scope.ts
- Engine
- park-ticket.ts
- Offices
- harness-baseline.ts
- OfficeScene.tsx
- ref_node_crypto
- assignment.ts
- ticket-stage-runner.ts
- sanitize
- brain-maintenance.ts
- projects.ts
- state-parts.ts
- JiraIssuePublisher
- ref_node_child_process
- QuestionStepper.tsx
- deploy-context.ts
- ref_node_path
- time-readback.ts
- cost-ledger.ts
- unsent-time.ts
- maintenance/maintenance.ts
- knowledge-views.ts
- judge-resumes.ts
- validate_pr_body.cjs
- audit-plan-candidates.cjs
- alert-issue.ts
- resume-arrivals.ts
- ticket-evidence.ts
- constellation-runtime.ts
- Ticket
- session-context-file.ts
- learning-events.ts
- session-scope.ts
- service-health.ts
- azure.ts
- diagnostic-snapshot.ts
- incidents.ts
- DrawerTopic.tsx
- session-bridge.ts
- Coordinator
- .emit
- dependency-bots/adopt.ts
- viewer.js
- release-floor.ts
- stopped-record.ts
- conversations/conversations.ts
- Outbox.tsx
- process.ts
- provider-observation.ts
- jiraBinding
- session-context-client.ts
- plans.cjs
- telemetry.ts
- capture-session-clone.py
- sign-in-unpark.ts
- restart-writer.ts
- validate-stage.ts
- archive-plan.cjs
- notifications.ts
- StageResult
- owned-artifact.ts
- on-merge-sync.cjs
- backup-stores.ts
- extract-worker.mjs
- deploy-plan.ts
- work.ts
- deployment-fence.ts
- engine.ts
- handoff-admission.ts
- assignment-poll.ts
- outbox.ts
- checkpoint-completion.ts
- slack-supersession.ts
- run-accounting.ts
- qa.ts
- qa-plan-continuation.ts
- writer-restart.ts
- featureById
- lesson-selection.ts
- follow-production.ts
- blocker-followups.ts
- read-retries.ts
- refresh-issue-state.cjs
- knowledge.ts
- delivery-authority.ts
- offices.ts
- node-visuals.ts
- accessibility-sources.ts
- pre-push-boundary.ts
- it-specialist.ts
- run-cost.ts
- redactEvidence
- MaintenanceRun
- controller-runtime.ts
- pilot-delivery.ts
- Effects
- ledger.ts
- FeatureWorkflow
- session-snapshot-cleanup.ts
- scene-motion.ts
- scheduler.ts
- production.ts
- reconcile-merges.cjs
- inspector-props.ts
- RoomCamera.tsx
- metadata-park-words.ts
- history-archive.ts
- codex-rollout.ts
- common.cjs
- LessonCard.tsx
- checkpoint-retry.ts
- incident-command.ts
- install-service.mjs
- validate_wiki_pr_body.cjs
- delivery-ownership.ts
- unblock-brief.ts
- restoreInPlace
- routing.js
- wait-idle.ts
- exit-failure.ts

## God Nodes (most connected - your core abstractions)
1. `Store` - 451 edges
2. `TicketJob` - 216 edges
3. `command()` - 161 edges
4. `digest()` - 160 edges
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
- `DeliveryAuthorityInput` --references--> `HarnessRequest`  [EXTRACTED]
  server/delivery/harness/delivery-authority.ts → src/contracts/work.ts

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

## Communities (162 total, 8 thin omitted)

### Community 0 - "incidents/routes.ts"
Cohesion: 0.06
Nodes (54): citationFault(), CitationSchema, SourceVersions, dismiss(), DISMISSAL_CITATIONS, DISMISSAL_REASON, DismissalFacts, DismissalRequest (+46 more)

### Community 1 - "OrgChart.tsx"
Cohesion: 0.06
Nodes (62): jiraQueueProgress(), nextStage(), DailyCTOSummary, Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId (+54 more)

### Community 2 - "worker-runtime.ts"
Cohesion: 0.07
Nodes (40): candidateWorkspaceEnvironment(), assignmentSubject(), LessonSelection, catalogLine(), assertBriefingScope(), CODEX_DEFAULT_EFFORT, CODEX_DEFAULT_MODEL, CODEX_EFFORTS (+32 more)

### Community 3 - "features.ts"
Cohesion: 0.06
Nodes (68): approveFeature(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), artifactPath(), digest(), document() (+60 more)

### Community 4 - "cx"
Cohesion: 0.08
Nodes (96): OfficeProposal, RetrospectiveRecord, WeeklyRollup, Outbox(), blockedSummary(), ServiceHealthPanel(), followUp(), labels (+88 more)

### Community 5 - "daily-cto.ts"
Cohesion: 0.07
Nodes (33): currentCitations(), Fact, NOT_CURRENT, PROVIDER_ERROR, DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt() (+25 more)

### Community 6 - "requests.ts"
Cohesion: 0.06
Nodes (78): closeoutCheckpoint(), closeoutRecoveryCandidate(), CloseoutRecoveryKind, coreCloseoutNative(), continuationNativeReview(), candidateInput(), children, oldAdoptionBasis() (+70 more)

### Community 7 - "index.tsx"
Cohesion: 0.06
Nodes (86): LessonDecisionAction, lessonDecisionState(), readLessonDecision(), OutboxLessonDecision(), act(), readStatus(), OutboxLessonDigest(), Activity() (+78 more)

### Community 8 - "retrospective-subject.ts"
Cohesion: 0.21
Nodes (13): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+5 more)

### Community 9 - "TelemetryPanel.tsx"
Cohesion: 0.09
Nodes (43): TelemetryReport, LiveAgentTask(), Props, RunningTask(), text(), AzureBuild, ROLE_NAMES, BreakdownTable() (+35 more)

### Community 10 - ".transaction"
Cohesion: 0.12
Nodes (37): featureItemComplete(), reconcileFeatureCompletion(), discoveryPrompt(), planPrompt(), readEvidence(), helperTelemetry(), DELAYS, MAX_EXECUTIONS (+29 more)

### Community 11 - "Store"
Cohesion: 0.08
Nodes (22): DeliveryTaskInput, Clock, checkpointLabel(), applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, comparable() (+14 more)

### Community 12 - "App.tsx"
Cohesion: 0.05
Nodes (67): compactSteps(), themeColor, App(), BrainWorkspace, CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants (+59 more)

### Community 13 - "admit-improvement.ts"
Cohesion: 0.21
Nodes (17): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+9 more)

### Community 14 - "advance-metadata-park.ts"
Cohesion: 0.08
Nodes (72): requireDeliveryAuthority(), advanceMetadataPark(), Parked, releaseWords(), sentAnything(), cardResumeRoute(), effectiveParkPickup(), PICKUP_ASSIGNEE (+64 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.16
Nodes (42): createFeature(), assertEnrollable(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), CaptureRequest, captureRequest(), captureRequests() (+34 more)

### Community 16 - "TicketTimeline.tsx"
Cohesion: 0.17
Nodes (14): LoadingMark(), MergeApproval(), eventMarks, stageLabel(), ticketHistory(), result(), TimelineEntry, clock() (+6 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.12
Nodes (36): baselined(), baselineLearning(), LEARNING_BASELINES, maintainLearning(), clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates() (+28 more)

### Community 18 - "deploy-command.ts"
Cohesion: 0.11
Nodes (41): CONTROLLER_ENTRY, ControllerPin, Pin, pinnedController(), readControllerPin(), writeControllerPin(), controllerOf(), deployCommand() (+33 more)

### Community 19 - "closeout-recovery.ts"
Cohesion: 0.11
Nodes (36): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutProviderEvidence() (+28 more)

### Community 20 - "artifact"
Cohesion: 0.05
Nodes (143): ownershipReadHistory(), containedFile(), recoverCTOInput(), acceptStageResult(), mergeAuthorized(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration() (+135 more)

### Community 21 - "harnessEffect"
Cohesion: 0.12
Nodes (46): effectKey(), LaneOperation, laneWrite(), moveCardOnce(), Lane, MOVABLE, moveLane(), resolveLane() (+38 more)

### Community 22 - "weekly-rollup.ts"
Cohesion: 0.14
Nodes (26): learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), RollupResult (+18 more)

### Community 23 - "jira-time.ts"
Cohesion: 0.06
Nodes (59): attempted(), attemptState(), bound(), covers(), JiraAttempt, jiraAttempts(), JiraAttemptState, open() (+51 more)

### Community 24 - "deploy.ts"
Cohesion: 0.13
Nodes (36): abandon(), advance(), deploy(), DEPLOY_STEPS, DeployFacts, append(), assertNext(), DeployJournalView (+28 more)

### Community 25 - "GitHubDelivery"
Cohesion: 0.09
Nodes (21): GitHubDelivery, adoptCandidate(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related (+13 more)

### Community 26 - "agents.ts"
Cohesion: 0.05
Nodes (44): implementationWorkerContext(), stageInstructions, RefusedQAResult, CECReadbackSchema, READBACK_OWNER_SCOPE, savedStageCompletion(), assertContinuableWorktree(), CONTINUABLE (+36 more)

### Community 27 - "workKey"
Cohesion: 0.10
Nodes (32): notOwned(), observePrerequisites(), mergedByOwner(), closeableIssue(), effectsSettled(), eligible(), officePublished(), ownerMerged() (+24 more)

### Community 28 - "github-delivery.ts"
Cohesion: 0.03
Nodes (160): writerRestartInstruction(), StoppedWriter, findingsBlock(), QA_STAGES, reviewAdvisoryIds(), Reviewed, withoutReviewAdvisories(), assertDeliveryMayMutate() (+152 more)

### Community 29 - "Goals.tsx"
Cohesion: 0.08
Nodes (37): GoalProgress, OutboxSavedImplementation(), apply(), review(), OutboxSavedPlan(), reconcile(), FeatureDelivery(), FeatureDocuments() (+29 more)

### Community 30 - "digest"
Cohesion: 0.08
Nodes (67): harnessCloseout(), PASSING, verifyMergeActions(), retryRead(), runHarnessStage(), harnessStageResult(), receipt(), harnessDraft() (+59 more)

### Community 31 - "knowledge/routes.ts"
Cohesion: 0.10
Nodes (22): knowledgeActivity(), knowledgeActivityPage(), committedNotePage(), BrainGraph, BrainNote, BrainReader, CommittedBrain, GraphNode (+14 more)

### Community 32 - "index.ts"
Cohesion: 0.05
Nodes (54): implementationContinuationRoute(), qaPlanRetryRoute(), featureRoute(), close(), config, itSpecialist, loadedRevision, offices (+46 more)

### Community 33 - "remove-candidate.ts"
Cohesion: 0.14
Nodes (23): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), maintenanceCandidate(), moveAside(), moveBack(), purgeRemoved(), purging (+15 more)

### Community 34 - "run.ts"
Cohesion: 0.20
Nodes (14): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, OFFICE_FIX_PROMPT, OfficeFixResult, validateOfficeFix(), investigationReady(), requeueInvestigationEvidence(), InvestigationOptions (+6 more)

### Community 35 - "wiki-graph.cjs"
Cohesion: 0.22
Nodes (19): connections(), fs, main(), path, ensureInside(), hasSymlinkComponent(), slash(), collect() (+11 more)

### Community 36 - "scheduled-work.ts"
Cohesion: 0.08
Nodes (41): freshOwnershipRead(), deliverySlot(), withAmendmentOwnership(), metadataRequestResolved(), preparationRequestResolved(), gateFeatureWork(), legacy, requestPriority() (+33 more)

### Community 37 - "routing.cjs"
Cohesion: 0.11
Nodes (31): fs, main(), path, { spawnSync }, digest(), frontmatterProblems(), adjacency(), edgeCost() (+23 more)

### Community 38 - "redact-evidence.ts"
Cohesion: 0.08
Nodes (25): AFTER_LABEL, ASSIGNMENT, AWS_KEY_ID, BARE_CREDENTIAL, BARE_UNIT, BARE_VALUE, CONTROL_ESCAPE, JSON_WEB_TOKEN (+17 more)

### Community 39 - "run-retrospective.ts"
Cohesion: 0.07
Nodes (52): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, BlockingTrigger, blockingTrigger(), isBlocking() (+44 more)

### Community 40 - "http/commands.ts"
Cohesion: 0.18
Nodes (18): configureNotices(), normalizeStatement(), configureKnowledge(), declineLessonIssue(), reactivateLesson(), retireLesson(), decideOfficeProposal(), mirrorOfficeKnowledge() (+10 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.14
Nodes (27): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence(), CaptureContext (+19 more)

### Community 42 - "Engine"
Cohesion: 0.07
Nodes (9): AzureMonitor, GitHubMonitor, githubPRDescription(), ResumeProject, GOAL_EVIDENCE_LIMITS, Engine, GitHubBoard, GitHubPR (+1 more)

### Community 43 - "park-ticket.ts"
Cohesion: 0.10
Nodes (51): resolveBlockedTransition(), document(), transitionWithComment(), jiraAccount(), jiraCollection(), JiraCredential, jiraCredential(), KEYCHAIN_SERVICE (+43 more)

### Community 44 - "Offices"
Cohesion: 0.13
Nodes (6): seedOfficeLessons(), file, project, root, projectById(), Offices

### Community 45 - "harness-baseline.ts"
Cohesion: 0.15
Nodes (22): BaselineReport, baselineReport(), BaselineSource, baselineText(), millions(), row(), share(), add() (+14 more)

### Community 46 - "OfficeScene.tsx"
Cohesion: 0.13
Nodes (38): withoutElapsed(), Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk() (+30 more)

### Community 47 - "ref_node_crypto"
Cohesion: 0.14
Nodes (26): packedConsumerPnpmRepair(), sha256(), commandFeature(), reviewQuestions(), automaticIntakeWait(), assertQuestionVisibility(), applyHarnessAction(), HarnessActionInput (+18 more)

### Community 48 - "assignment.ts"
Cohesion: 0.09
Nodes (36): latestQA(), notPassedInLatestQA(), QACoverage, qaCoverage(), same(), Tested, stagePrompt(), StagePromptInput (+28 more)

### Community 49 - "ticket-stage-runner.ts"
Cohesion: 0.08
Nodes (59): applyChangeScope(), endChangeScope(), levels(), MAX_CHECKS, owedUnderScope(), scopeBase(), scopeOutgrown(), settled() (+51 more)

### Community 50 - "sanitize"
Cohesion: 0.15
Nodes (22): pumpKnowledge(), queuedKnowledgeMessage(), projectSlackDeliveries(), dueSlackReread(), rereadUncertainSlack(), runningRevision(), settleRequestedSlackReplacement(), Input (+14 more)

### Community 51 - "brain-maintenance.ts"
Cohesion: 0.13
Nodes (18): maintenancePolicies(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, brainResultStop(), GateMark, gateMark(), MAX_START_RETRIES (+10 more)

### Community 52 - "projects.ts"
Cohesion: 0.05
Nodes (67): escaped(), IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), projectListScope(), AUTO_ADOPT_BOTS, assertFeaturePlanningConfig() (+59 more)

### Community 53 - "state-parts.ts"
Cohesion: 0.08
Nodes (30): readSavedState(), LARGE_KEY_CHARS, plain(), RedactedEntries, RedactedEntry, redactEntries(), joinParts(), PartRow (+22 more)

### Community 54 - "JiraIssuePublisher"
Cohesion: 0.19
Nodes (5): contentSchema(), JiraIssuePublisher, descriptionPreimage(), plain(), publicationDescription()

### Community 55 - "ref_node_child_process"
Cohesion: 0.13
Nodes (18): changedPaths(), { execFileSync }, files, isMapInput(), mapOnly(), { execFileSync }, git(), publish() (+10 more)

### Community 56 - "QuestionStepper.tsx"
Cohesion: 0.19
Nodes (18): FeatureQuestionProjection, OutboxQuestionRound(), send(), draftKey(), readDraft(), saveDraft(), QuestionRound(), nextQuestion() (+10 more)

### Community 57 - "deploy-context.ts"
Cohesion: 0.12
Nodes (26): fenceTokenDigest(), ControllerEffects, DEPLOY_PROJECT, DeployContext, DeployTimings, operationPaths(), createDeployToken(), readDeployToken() (+18 more)

### Community 58 - "ref_node_path"
Cohesion: 0.05
Nodes (68): MISSING_SAVED_PLAN, writerRestartPending(), removeAdoptedClone(), namedRepairIds(), pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), assertStoppedBaseAudit(), AuditRow (+60 more)

### Community 59 - "time-readback.ts"
Cohesion: 0.21
Nodes (9): hoursReadbackPending(), Ledger, Read, TimeLedger, missedSinceVerified(), Readback, READBACK_INTERVAL_MS, readBackTime() (+1 more)

### Community 60 - "cost-ledger.ts"
Cohesion: 0.16
Nodes (26): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId(), OutsideEdit (+18 more)

### Community 61 - "unsent-time.ts"
Cohesion: 0.29
Nodes (10): publishableEntry(), settlementPending(), superseded(), ticketUnresolved(), dueUnsent(), releaseUnsent(), UNSENT_RETRY_MAX_MS, UNSENT_RETRY_MS (+2 more)

### Community 62 - "maintenance/maintenance.ts"
Cohesion: 0.12
Nodes (21): captureMaintenanceStep(), sourceFindings, sourceReview(), candidateOwner(), SETTLED, skipOwnedCandidate(), Skipped, skippedCandidateLedger() (+13 more)

### Community 63 - "knowledge-views.ts"
Cohesion: 0.15
Nodes (19): KnowledgeActivity, KnowledgeEdge, KnowledgeMap, KnowledgeNode, connectionSummary(), ConstellationView, ConstellationRuntime, DisplayNode (+11 more)

### Community 64 - "judge-resumes.ts"
Cohesion: 0.07
Nodes (42): boundaryCrossed(), Crossing, Progress, CheckpointProgress, checkpointProgress(), names(), nativeProof(), Step (+34 more)

### Community 65 - "validate_pr_body.cjs"
Cohesion: 0.36
Nodes (8): fs, main(), readableText(), REQUIRED_CHECKS, REQUIRED_SECTIONS, sections(), validatePullRequestBody(), withoutComments()

### Community 66 - "audit-plan-candidates.cjs"
Cohesion: 0.14
Nodes (31): audit(), branchIssueNumbers(), classify(), distinctiveTitleWords(), { execFileSync }, extractPaths(), findPrForMergeSubject(), fmtCommit() (+23 more)

### Community 67 - "alert-issue.ts"
Cohesion: 0.17
Nodes (23): adoptDependabot(), AlertIssue, alertIssueBody(), alertIssueTitle(), alertMarker(), closeAlertIssue(), ensureAlertIssue(), findAlertIssue() (+15 more)

### Community 68 - "resume-arrivals.ts"
Cohesion: 0.11
Nodes (62): canonical(), CheckpointEligibility, checkpointEligibility(), admitAssignmentResume(), forAssignment(), admitCheckpointResume(), forCheckpoint(), admitResume() (+54 more)

### Community 69 - "ticket-evidence.ts"
Cohesion: 0.11
Nodes (28): assetDownloader(), attachmentKind(), evidenceDirectory(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS, EvidenceAttachment (+20 more)

### Community 70 - "constellation-runtime.ts"
Cohesion: 0.10
Nodes (20): CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point, createConstellation(), enter() (+12 more)

### Community 71 - "Ticket"
Cohesion: 0.05
Nodes (63): carriedNotRepeated(), changeScopeNote(), Scoped, intakeMembership(), JiraOperations, movedHeadNote(), cecPrompt(), cecReadbackPrompt() (+55 more)

### Community 72 - "session-context-file.ts"
Cohesion: 0.20
Nodes (14): ContextFoldPrefix, contextFoldPrefix(), SessionContextCheckpoint, captureSessionContextClone(), ContextReadPhase, SessionContextDeadline, sessionContextFile(), ContextReadChanged (+6 more)

### Community 73 - "learning-events.ts"
Cohesion: 0.07
Nodes (43): assignmentKnowledge(), BrainOverlap, guidanceExcerpt(), digest(), captureLearning(), recordLearningOpportunity(), AssignmentLookups, Binding (+35 more)

### Community 74 - "session-scope.ts"
Cohesion: 0.18
Nodes (17): Bound, claudeScopeParser(), claudeSessionScope(), CLAUDE_TRANSCRIPTS, CODEX_ROLLOUTS, contextReaders(), retainSessionMessage(), SessionConversation (+9 more)

### Community 75 - "service-health.ts"
Cohesion: 0.12
Nodes (22): ClaudeLoginRefusal, claudeLoginRefusal(), claudeRefusalWords(), RECORDED_REFUSALS, refusedClaudeRow(), listenerHealth(), providers, ProviderStatusChecks (+14 more)

### Community 76 - "azure.ts"
Cohesion: 0.12
Nodes (31): az(), buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs(), fullActivePRs(), observation() (+23 more)

### Community 77 - "diagnostic-snapshot.ts"
Cohesion: 0.14
Nodes (20): OwnerStepItem, assignmentDiagnostics(), diagnosticContext(), diagnosticSnapshot(), followUpPicture(), publishITReport(), OwnerSteps, OutboxOwnerSteps() (+12 more)

### Community 78 - "incidents.ts"
Cohesion: 0.08
Nodes (53): attributedRecords(), foldsItsRun(), groupCandidates(), ObservedIncident, ObservedSubject, digest(), fingerprint(), incidentId() (+45 more)

### Community 79 - "DrawerTopic.tsx"
Cohesion: 0.18
Nodes (19): createConversationDrafts(), BrainDrawer(), DrawerNavigation, DrawerPage(), DrawerEntry, DrawerPath, popPage(), pushPage() (+11 more)

### Community 80 - "session-bridge.ts"
Cohesion: 0.10
Nodes (30): claudeSessionContext(), codexDaemonProcesses(), accountCodexProcesses(), CodexProcessInventory, codexProcessInventory(), DesktopSessions, unaccountedProcesses(), codexSessionContext() (+22 more)

### Community 82 - ".emit"
Cohesion: 0.17
Nodes (12): say(), ProjectProgress, due(), MAX_RELEASE_UNPARKS, RELEASE_CHECK_MS, returnToPickup(), unparkReleasedWaits(), compare() (+4 more)

### Community 83 - "dependency-bots/adopt.ts"
Cohesion: 0.13
Nodes (29): readBackOrThrow(), closesIssue(), linkedBody(), linkPR(), dependabotPR(), ensureTrackingIssue(), findTrackingIssue(), ownTracking() (+21 more)

### Community 84 - "viewer.js"
Cohesion: 0.19
Nodes (25): addMetaLink(), addMetaRow(), addRelationship(), applyView(), buildIndexes(), buildLegend(), buildModel(), buildRenderer() (+17 more)

### Community 85 - "release-floor.ts"
Cohesion: 0.33
Nodes (6): AS_COMMITTED, Execute, FloorReading, message(), readReleaseFloor(), RELEASE_FLOOR

### Community 86 - "stopped-record.ts"
Cohesion: 0.08
Nodes (52): capabilityBlockedReviews(), latestReviews(), boundedEvidence(), expectedWait(), StopFacts, normalizeCause(), IncidentCollector, improvements() (+44 more)

### Community 87 - "conversations/conversations.ts"
Cohesion: 0.07
Nodes (42): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+34 more)

### Community 88 - "Outbox.tsx"
Cohesion: 0.07
Nodes (40): knowledgeOutbox(), ChatMarkdown(), Conversation(), ConversationDraft, DAYS, dueLessonDecisions(), easternWeek(), isLessonDecision() (+32 more)

### Community 89 - "process.ts"
Cohesion: 0.06
Nodes (38): candidateBranchMoved(), jiraText(), Document, document(), isAccessOnlyPlan(), settledAccessOnlyState(), continueAccessOnlyPlan(), entryExists() (+30 more)

### Community 90 - "provider-observation.ts"
Cohesion: 0.13
Nodes (25): correlatedBuild(), Azure, azurePipelines(), outcome(), Read, RUNS_PER_PIPELINE, Api, githubWorkflows() (+17 more)

### Community 91 - "jiraBinding"
Cohesion: 0.07
Nodes (52): CommentPage, commentReadback(), devUpdate(), HEADLINE, Assignment, Transition, jiraRecord(), unpack() (+44 more)

### Community 92 - "session-context-client.ts"
Cohesion: 0.13
Nodes (18): readTranscript, readRollout, packContextFailure(), PackedContextFailure, unpackContextFailure(), LiveSession, ContextThread, contextThread() (+10 more)

### Community 93 - "plans.cjs"
Cohesion: 0.20
Nodes (18): walk(), association(), auditedDigests(), candidate(), collapseByTitle(), discover(), fromMarkdown(), fs (+10 more)

### Community 94 - "telemetry.ts"
Cohesion: 0.15
Nodes (20): CostCompleteness, CostLedgerState, TelemetryRow, TelemetrySync, UsageCompleteness, UsageSource, ValuationSource, Acc (+12 more)

### Community 96 - "sign-in-unpark.ts"
Cohesion: 0.19
Nodes (17): hasPendingDelivery(), resumeAfterSignIn(), signInWait(), MAX_SIGN_IN_UNPARKS, BrowserPage, browserPages(), ReadPages, SignInState (+9 more)

### Community 97 - "restart-writer.ts"
Cohesion: 0.18
Nodes (17): ATTEMPT_DELAYS_MS, nextAttemptAt(), restartStoppedWriters(), unchangedSinceAccepted(), NOT_RETRYABLE, releaseFunds(), stoppedWriter(), WRITER_STAGES (+9 more)

### Community 98 - "validate-stage.ts"
Cohesion: 0.17
Nodes (17): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+9 more)

### Community 99 - "archive-plan.cjs"
Cohesion: 0.12
Nodes (31): fs, main(), parse(), path, archive(), cell(), ensureIndex(), fromArgs() (+23 more)

### Community 100 - "notifications.ts"
Cohesion: 0.07
Nodes (36): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), currentOutbox(), clamp(), LIMITS (+28 more)

### Community 101 - "StageResult"
Cohesion: 0.05
Nodes (58): GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles(), ContinuationIO (+50 more)

### Community 102 - "owned-artifact.ts"
Cohesion: 0.20
Nodes (15): investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, NOTIFY_HELPER, notifyHelperResolution(), OFFICE_SOURCE_PATHS, officeSource() (+7 more)

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
Cohesion: 0.12
Nodes (36): runningRevision(), runningRevision(), runtimeRevision(), BUILD_ENV, buildRelease(), BuildReleaseOptions, Execute, pinnedVersions() (+28 more)

### Community 107 - "work.ts"
Cohesion: 0.08
Nodes (30): FailedMailCheck, lastFailedMailCheck(), lastMailCheckOutcome(), MailCheckOutcome, LANES, observeProjects(), Projected, effectiveCause() (+22 more)

### Community 108 - "deployment-fence.ts"
Cohesion: 0.30
Nodes (4): assertToken(), Body, DeploymentFence, DeploymentFenceState

### Community 109 - "engine.ts"
Cohesion: 0.18
Nodes (14): enumerateIntakeList(), inPickupOrder(), Intake, text(), applyIntakeObservation(), checkMail(), drainMail(), requestMail() (+6 more)

### Community 110 - "handoff-admission.ts"
Cohesion: 0.11
Nodes (38): actionKey(), bindings(), bound(), CATEGORIZED, claimed(), Entry, episodeAt(), executing() (+30 more)

### Community 111 - "assignment-poll.ts"
Cohesion: 0.08
Nodes (30): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), BLOCK, harnessBlockMove() (+22 more)

### Community 112 - "outbox.ts"
Cohesion: 0.19
Nodes (13): ctoInputIdentityMatches(), ctoInputRecovered(), metadataParkAction(), ADOPTION_STALLED_MS, projectOutbox(), item(), syncOutbox(), ownerStepItems() (+5 more)

### Community 113 - "checkpoint-completion.ts"
Cohesion: 0.16
Nodes (13): BrainStatusSchema, identity, brainCheckpointCompletion(), coverageSchema, verified, PublishedPR, publishedWorkCleanedUp(), nativeChecks (+5 more)

### Community 114 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 115 - "run-accounting.ts"
Cohesion: 0.10
Nodes (31): BoundedRead, CompletionReader, CodexRollout, codexHome(), createdAt(), dayDirs(), header(), readCodexRollout() (+23 more)

### Community 119 - "featureById"
Cohesion: 0.13
Nodes (13): featureById(), GitHubFeaturePublisher, FeaturePublisher, PublicationReceipt, publishFeature(), reconcilePublication(), reserveIdentity(), GitHubIssuePublisher (+5 more)

### Community 120 - "lesson-selection.ts"
Cohesion: 0.08
Nodes (27): args, [cmd,...rawArgs], commands, key, projectIndex, LessonBrainAudit, lessonBrainAudit(), LessonBrainOverlap (+19 more)

### Community 121 - "follow-production.ts"
Cohesion: 0.20
Nodes (17): awaitingJiraStatus(), awaitingProduction(), FOLLOW_DAYS, followed(), isFollowed(), Azure, AzureRead, containedIn() (+9 more)

### Community 122 - "blocker-followups.ts"
Cohesion: 0.34
Nodes (14): conversationReadbackReady(), followupOf(), pendingReadback(), queueConversationReadback(), readbackEnding(), uncertainConversations(), conversationResolved(), readBackConversations() (+6 more)

### Community 123 - "read-retries.ts"
Cohesion: 0.38
Nodes (9): classifyStop(), incompleteReadOutput(), planReadRetry(), readOnlyStageJob(), readRetryPending(), reconcileReadRetries(), RETRY_PLAN_GRACE_MS, temporaryReadFailure() (+1 more)

### Community 124 - "refresh-issue-state.cjs"
Cohesion: 0.20
Nodes (19): advanceFence(), closingIssues(), githubRefs(), key(), normalizeGithubQuery(), normalizeRepository(), parseGithubQuery(), ref() (+11 more)

### Community 125 - "knowledge.ts"
Cohesion: 0.13
Nodes (17): BRAIN_SCOPE, SUBJECT, Kind, RetrospectiveResultSchema, RollupResultSchema, Stage, ImprovementGrant, KnowledgeRetry (+9 more)

### Community 126 - "delivery-authority.ts"
Cohesion: 0.22
Nodes (13): deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, deliveryIntakeBlocker(), gateRegisteredDelivery(), accounting, DeliverySubject (+5 more)

### Community 127 - "offices.ts"
Cohesion: 0.18
Nodes (7): QuestionNotifications, leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), InFlightOperations, backfillClaudeCost()

### Community 128 - "node-visuals.ts"
Cohesion: 0.20
Nodes (14): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+6 more)

### Community 129 - "accessibility-sources.ts"
Cohesion: 0.25
Nodes (17): accessibilitySources(), actionable(), closingPull(), Finding, handoffIssue(), issueLines(), issueSource(), observation (+9 more)

### Community 130 - "pre-push-boundary.ts"
Cohesion: 0.27
Nodes (10): Event, exactCommand(), Invocation, localHookCommand(), one(), prePushRejection(), PushIdentity, retirementBoundary() (+2 more)

### Community 131 - "it-specialist.ts"
Cohesion: 0.16
Nodes (20): replacedReadback(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), heldFor(), ITContext, recoveryHeld() (+12 more)

### Community 132 - "run-cost.ts"
Cohesion: 0.14
Nodes (18): CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL, Rates (+10 more)

### Community 133 - "redactEvidence"
Cohesion: 0.06
Nodes (64): sourceVersions(), inHistoryOf(), CompareMemory, compareMemory(), COMPARES_PER_PASS, comparison(), DeployedFixes, DeployedFixesInput (+56 more)

### Community 134 - "MaintenanceRun"
Cohesion: 0.26
Nodes (11): checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), repeatedVendorReviewBlock(), stoppedInVendorReview(), leftToNextRun(), NEXT_RUN_DUE_MS, night() (+3 more)

### Community 135 - "controller-runtime.ts"
Cohesion: 0.23
Nodes (12): projectData(), StoreDatabase, controllerEffects(), alive(), ControllerMachine, option(), realMachine(), runController() (+4 more)

### Community 136 - "pilot-delivery.ts"
Cohesion: 0.07
Nodes (63): dispatchNightly(), drainDelivery(), requestDelivery(), startPilot(), OfficeQAHandoffInput, eligibility(), reconcileNoticeConfirmations(), Admission (+55 more)

### Community 137 - "Effects"
Cohesion: 0.15
Nodes (15): settleDevUpdate(), settleDevUpdates(), GitHubOperations, assignedToJoe(), fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), tryReadyLessonIssue() (+7 more)

### Community 138 - "ledger.ts"
Cohesion: 0.23
Nodes (15): acceptedCompletionResolution(), investigationCandidates(), investigationId(), finishedSubjectResolution(), investigationFollowUps(), interruptedQARerunResolution(), investigationResolution(), syncInvestigations() (+7 more)

### Community 140 - "session-snapshot-cleanup.ts"
Cohesion: 0.40
Nodes (5): SNAPSHOT_PREFIX, removeStaleSessionSnapshots(), SNAPSHOT_SWEEP_MS, STALE_SNAPSHOT_MS, sweepStaleSessionSnapshots()

### Community 141 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 142 - "scheduler.ts"
Cohesion: 0.09
Nodes (31): continueOwnershipRead(), expiredOwnershipRead(), handoffOwnership(), ReadbackOwnerDecision, ownershipReadGate(), ownershipReadState(), ownershipReadSource(), ReadOwnershipCandidate (+23 more)

### Community 144 - "reconcile-merges.cjs"
Cohesion: 0.21
Nodes (15): remoteSlug(), collectPulls(), copyWikiForDryRun(), { execFileSync }, flattenPages(), fs, githubRequest(), isWikiBotPull() (+7 more)

### Community 145 - "inspector-props.ts"
Cohesion: 0.11
Nodes (19): fields, PreferencesPatch, PreferencesStore, StoredBody, SendMessage, acceptPreferences(), PreferenceCandidate, PreferenceState (+11 more)

### Community 146 - "RoomCamera.tsx"
Cohesion: 0.53
Nodes (3): CameraBookmark, restoreBookmark(), RoomCamera()

### Community 147 - "metadata-park-words.ts"
Cohesion: 0.42
Nodes (9): field(), FIELDS, MetadataField, metadataFields(), metadataParkWords(), metadataStopWords(), needed(), sentence() (+1 more)

### Community 148 - "history-archive.ts"
Cohesion: 0.40
Nodes (7): archiveOldReports(), RETAINED_REPORTS, archiveByMonth(), archiveHistory(), archiveMonth(), archiveOldTaskDetail(), TASK_DETAIL_DAYS

### Community 149 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 150 - "common.cjs"
Cohesion: 0.11
Nodes (24): fs, main(), parse(), path, atomicWrite(), crypto, { execFileSync }, fs (+16 more)

### Community 151 - "LessonCard.tsx"
Cohesion: 0.44
Nodes (7): evidenceText(), field(), jsonString(), opening(), Evidence(), LessonCard(), LessonShape()

### Community 152 - "checkpoint-retry.ts"
Cohesion: 0.46
Nodes (7): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation(), maintenanceSuperseded()

### Community 153 - "incident-command.ts"
Cohesion: 0.38
Nodes (6): FLAGS, incidentCommand(), IncidentCommandIO, option(), USAGE, whole()

### Community 154 - "install-service.mjs"
Cohesion: 0.29
Nodes (4): file, folder, logs, root

### Community 155 - "validate_wiki_pr_body.cjs"
Cohesion: 0.33
Nodes (5): { execFileSync }, hasCanonicalWikiBody(), maintenanceBodies, matchesMaintenanceBody(), { readFileSync }

### Community 156 - "delivery-ownership.ts"
Cohesion: 0.33
Nodes (4): Ownership, ownershipContext, refreshDeliveryOwnership(), RefreshOwnership

### Community 157 - "unblock-brief.ts"
Cohesion: 0.53
Nodes (5): clearUnblockBrief(), key(), saveUnblockBrief(), UnblockBrief, unblockBrief()

### Community 158 - "restoreInPlace"
Cohesion: 0.60
Nodes (5): identity(), Json, plain(), restorable(), restoreInPlace()

### Community 160 - "wait-idle.ts"
Cohesion: 0.40
Nodes (4): Health, IdleObservation, IdleResult, WaitIdleInput

### Community 161 - "exit-failure.ts"
Cohesion: 0.60
Nodes (3): exitFailure(), MONTHS, providerLimit()

## Knowledge Gaps
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `OrgChart.tsx`, `worker-runtime.ts`, `features.ts`, `daily-cto.ts`, `requests.ts`, `retrospective-subject.ts`, `.transaction`, `admit-improvement.ts`, `advance-metadata-park.ts`, `scheduled-captures.ts`, `record-trigger.ts`, `closeout-recovery.ts`, `artifact`, `harnessEffect`, `weekly-rollup.ts`, `jira-time.ts`, `GitHubDelivery`, `agents.ts`, `workKey`, `github-delivery.ts`, `digest`, `knowledge/routes.ts`, `index.ts`, `remove-candidate.ts`, `run.ts`, `scheduled-work.ts`, `run-retrospective.ts`, `http/commands.ts`, `time-scope.ts`, `Engine`, `park-ticket.ts`, `Offices`, `ref_node_crypto`, `assignment.ts`, `ticket-stage-runner.ts`, `sanitize`, `brain-maintenance.ts`, `state-parts.ts`, `JiraIssuePublisher`, `deploy-context.ts`, `ref_node_path`, `time-readback.ts`, `cost-ledger.ts`, `unsent-time.ts`, `maintenance/maintenance.ts`, `judge-resumes.ts`, `alert-issue.ts`, `resume-arrivals.ts`, `ticket-evidence.ts`, `Ticket`, `learning-events.ts`, `azure.ts`, `diagnostic-snapshot.ts`, `session-bridge.ts`, `Coordinator`, `.emit`, `dependency-bots/adopt.ts`, `conversations/conversations.ts`, `process.ts`, `provider-observation.ts`, `jiraBinding`, `sign-in-unpark.ts`, `restart-writer.ts`, `validate-stage.ts`, `notifications.ts`, `StageResult`, `owned-artifact.ts`, `work.ts`, `engine.ts`, `handoff-admission.ts`, `assignment-poll.ts`, `checkpoint-completion.ts`, `run-accounting.ts`, `featureById`, `lesson-selection.ts`, `follow-production.ts`, `blocker-followups.ts`, `read-retries.ts`, `delivery-authority.ts`, `offices.ts`, `accessibility-sources.ts`, `it-specialist.ts`, `redactEvidence`, `controller-runtime.ts`, `pilot-delivery.ts`, `Effects`, `ledger.ts`, `FeatureWorkflow`, `scheduler.ts`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `command()` (e.g. with `startServiceTicks()` and `realMachine()`) actually correct?**
  _`command()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Should `incidents/routes.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0625 - nodes in this community are weakly interconnected._
- **Why does `command()` connect `process.ts` to `incidents/routes.ts`, `accessibility-sources.ts`, `worker-runtime.ts`, `features.ts`, `redactEvidence`, `requests.ts`, `controller-runtime.ts`, `pilot-delivery.ts`, `Effects`, `.transaction`, `Store`, `FeatureWorkflow`, `admit-improvement.ts`, `scheduler.ts`, `deploy-command.ts`, `closeout-recovery.ts`, `artifact`, `harnessEffect`, `weekly-rollup.ts`, `jira-time.ts`, `GitHubDelivery`, `agents.ts`, `workKey`, `github-delivery.ts`, `digest`, `knowledge/routes.ts`, `remove-candidate.ts`, `exit-failure.ts`, `redact-evidence.ts`, `Engine`, `park-ticket.ts`, `ticket-stage-runner.ts`, `brain-maintenance.ts`, `JiraIssuePublisher`, `deploy-context.ts`, `ref_node_path`, `time-readback.ts`, `cost-ledger.ts`, `maintenance/maintenance.ts`, `ticket-evidence.ts`, `service-health.ts`, `azure.ts`, `session-bridge.ts`, `Coordinator`, `.emit`, `release-floor.ts`, `provider-observation.ts`, `jiraBinding`, `restart-writer.ts`, `validate-stage.ts`, `notifications.ts`, `StageResult`, `deploy-plan.ts`, `engine.ts`, `checkpoint-completion.ts`, `featureById`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Should `OrgChart.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06288568909785483 - nodes in this community are weakly interconnected._
- **Why does `OfficeSnapshot` connect `OrgChart.tsx` to `cx`, `MaintenanceRun`, `index.tsx`, `TelemetryPanel.tsx`, `ledger.ts`, `Store`, `App.tsx`, `scene-motion.ts`, `TicketTimeline.tsx`, `record-trigger.ts`, `inspector-props.ts`, `history-archive.ts`, `Goals.tsx`, `index.ts`, `harness-baseline.ts`, `OfficeScene.tsx`, `ref_node_crypto`, `sanitize`, `state-parts.ts`, `ref_node_path`, `maintenance/maintenance.ts`, `judge-resumes.ts`, `resume-arrivals.ts`, `service-health.ts`, `azure.ts`, `diagnostic-snapshot.ts`, `incidents.ts`, `DrawerTopic.tsx`, `stopped-record.ts`, `Outbox.tsx`, `restart-writer.ts`, `notifications.ts`, `work.ts`, `assignment-poll.ts`, `outbox.ts`, `offices.ts`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Should `worker-runtime.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0677555958862674 - nodes in this community are weakly interconnected._