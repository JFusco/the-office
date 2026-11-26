# Graph Report - the-office  (2026-11-26)

## Corpus Check
- 1249 files · ~529,695 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 6485 nodes · 28423 edges · 169 communities (160 shown, 9 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 1030 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `cd59981f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- incidents/routes.ts
- OrgChart.tsx
- worker-runtime.ts
- features.ts
- cx
- daily-cto.ts
- project-policy.ts
- index.tsx
- github/issue-publication.ts
- ServiceHealthPanel.tsx
- office/config.ts
- kill-switch.ts
- OfficeSnapshot
- admit-improvement.ts
- advance-metadata-park.ts
- scheduled-captures.ts
- run-retrospective.ts
- record-trigger.ts
- sign-in-unpark.ts
- TicketTimeline.tsx
- artifact
- dependency-bots/adopt.ts
- retrospective-subject.ts
- jira-time.ts
- park.ts
- Outbox.tsx
- agents.ts
- goal-reporting.ts
- github-delivery.ts
- continue-ownership-read.ts
- digest
- coordination-pump.ts
- index.ts
- assignment-poll.ts
- rate-limit-samples.ts
- common.cjs
- scheduled-work.ts
- routing.cjs
- redact-evidence.ts
- demand-facts.ts
- observe-github-merges.ts
- time-scope.ts
- Engine
- .save
- offices.ts
- harness-baseline.ts
- OfficeScene.tsx
- lesson-selection.ts
- assignment.ts
- .emit
- QuestionStepper.tsx
- ledger.ts
- projects.ts
- .open
- jiraBinding
- ref_node_child_process
- enrollment-gate.ts
- pass.ts
- ref_node_path
- jira-attempts.ts
- cost-ledger.ts
- time-ledger.ts
- maintenance/maintenance.ts
- MapView.tsx
- redactEvidence
- validate_pr_body.cjs
- audit-plan-candidates.cjs
- office-client.ts
- resume-arrivals.ts
- ticket-evidence.ts
- constellation-runtime.ts
- cec.ts
- session-context-file.ts
- assignments.ts
- session-scope.ts
- service-health.ts
- azure.ts
- alert-issue.ts
- incidents.ts
- runner-state.ts
- session-bridge.ts
- Coordinator
- useLiveTiming.ts
- brain-maintenance.ts
- viewer.js
- weekly-rollup.ts
- stopped-record.ts
- sanitize
- ref_zod
- spawn-command.ts
- provider-observation.ts
- Ticket
- session-context-client.ts
- plans.cjs
- timed-statements.ts
- capture-session-clone.py
- ref_node_sqlite
- coordination.ts
- pilot-delivery.ts
- archive-plan.cjs
- call-scope.ts
- workKey
- read-retries.ts
- on-merge-sync.cjs
- snapshot-stores.ts
- extract-worker.mjs
- deploy.ts
- overseer/config.ts
- DeploymentFence
- engine.ts
- blocker-followups.ts
- report.ts
- outbox.ts
- coordination-tick.ts
- slack-supersession.ts
- telemetry.ts
- qa.ts
- qa-plan-continuation.ts
- writer-restart.ts
- endpoint-family.ts
- store-fingerprint.ts
- follow-production.ts
- RoomCamera.tsx
- createConstellation
- refresh-issue-state.cjs
- knowledge.ts
- GitHubDelivery
- accessibility-sources.ts
- node-visuals.ts
- call-outcome.ts
- pre-push-boundary.ts
- it-specialist.ts
- diagnostic-snapshot.ts
- run-accounting.ts
- projectPolicy
- dates.cjs
- release-unpark.ts
- Effects
- owned-artifact.ts
- Store
- session-snapshot-cleanup.ts
- scene-motion.ts
- scheduler.ts
- production.ts
- reconcile-merges.cjs
- useOfficePreferences.ts
- preparation-board-provenance.ts
- metadata-park-words.ts
- runner-root.ts
- harnessEffect
- serve-graph.cjs
- DrawerTopic.tsx
- evidence-artifacts.ts
- qa-plan-retry.ts
- work.ts
- state-parts.ts
- restart-writer.ts
- ProjectProgress
- candidate-child-context.ts
- routing.js
- packed-consumer-pnpm.ts
- single-flight.ts
- CommandRegistry
- store.ts
- validate_wiki_pr_body.cjs
- incident-command.ts
- office-qa-handoff.ts
- Agents
- engine-range.ts

## God Nodes (most connected - your core abstractions)
1. `Store` - 453 edges
2. `TicketJob` - 218 edges
3. `digest()` - 160 edges
4. `command()` - 155 edges
5. `holdReason()` - 141 edges
6. `GitHubDelivery` - 130 edges
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
- 2-file cycle: `server/workers/process.ts -> server/workers/spawn-command.ts -> server/workers/process.ts`
- 3-file cycle: `server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-guard.ts -> server/delivery/pipeline/github-delivery.ts`

## Communities (169 total, 9 thin omitted)

### Community 0 - "incidents/routes.ts"
Cohesion: 0.06
Nodes (54): citationFault(), CitationSchema, SourceVersions, inHistoryOf(), dismiss(), DISMISSAL_CITATIONS, DISMISSAL_REASON, DismissalFacts (+46 more)

### Community 1 - "OrgChart.tsx"
Cohesion: 0.08
Nodes (50): label(), personaContext(), GoalProgress, Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId (+42 more)

### Community 2 - "worker-runtime.ts"
Cohesion: 0.05
Nodes (48): SlackResultSchema, SlackVerificationSchema, candidateWorkspaceEnvironment(), assignmentSubject(), dispatchExposure(), prepareExposure(), lessonPurpose(), LessonSelection (+40 more)

### Community 3 - "features.ts"
Cohesion: 0.05
Nodes (90): approveFeature(), commandFeature(), mutation(), reviewQuestions(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), artifactPath() (+82 more)

### Community 4 - "cx"
Cohesion: 0.08
Nodes (96): Conversation(), ConversationDraft, slackMessageStatus(), SlackDeliveryCard(), labels, ServiceHealthRow(), BlockerFollowups(), LearningCoverage() (+88 more)

### Community 5 - "daily-cto.ts"
Cohesion: 0.05
Nodes (49): collectCTOFacts(), currentCitations(), Fact, NOT_CURRENT, PROVIDER_ERROR, DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts (+41 more)

### Community 6 - "project-policy.ts"
Cohesion: 0.16
Nodes (12): approveMerge(), assertHarnessMayMerge(), HUMAN_MERGE, BEFORE_POLICY, Project, ProjectPolicy, PROJECT_POLICY_INPUTS, checkpointLabel() (+4 more)

### Community 7 - "index.tsx"
Cohesion: 0.10
Nodes (49): LinkedFeatures(), SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState (+41 more)

### Community 8 - "github/issue-publication.ts"
Cohesion: 0.15
Nodes (10): FeaturePublisher, PublicationReceipt, Assign, Board, Content, GitHubIssuePublisher, number(), same() (+2 more)

### Community 9 - "ServiceHealthPanel.tsx"
Cohesion: 0.10
Nodes (33): DailyCTOSummary, blockedSummary(), itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps(), currentServices(), ServiceHealthPanel() (+25 more)

### Community 10 - "office/config.ts"
Cohesion: 0.13
Nodes (33): featureItemComplete(), reconcileFeatureCompletion(), discoveryPrompt(), planPrompt(), readEvidence(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS (+25 more)

### Community 11 - "kill-switch.ts"
Cohesion: 0.18
Nodes (21): guardPresent(), overseerCommand(), resolveCliRoot(), runnerStatus(), bounded(), ControlRead, Halt, Pause (+13 more)

### Community 12 - "OfficeSnapshot"
Cohesion: 0.04
Nodes (84): jiraQueueProgress(), nextStage(), deliveryRoles, JiraQueueProgress, TicketProgress, ProgressionItem, themeColor, App() (+76 more)

### Community 13 - "admit-improvement.ts"
Cohesion: 0.24
Nodes (15): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+7 more)

### Community 14 - "advance-metadata-park.ts"
Cohesion: 0.10
Nodes (64): advanceMetadataPark(), Parked, releaseWords(), sentAnything(), cardResumeRoute(), effectiveParkPickup(), PICKUP_ASSIGNEE, REVIEWABLE (+56 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.13
Nodes (51): accounting, DeliverySubject, nonDelivery, originalReads, createFeature(), enrolled(), assessmentSignal(), AssessmentSignals (+43 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.09
Nodes (42): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, BlockingTrigger, blockingTrigger(), isBlocking() (+34 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.10
Nodes (41): captureLearning(), learningDigest(), recordLearningOpportunity(), baselined(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences() (+33 more)

### Community 18 - "sign-in-unpark.ts"
Cohesion: 0.18
Nodes (19): hasPendingDelivery(), resumeAfterSignIn(), signInWait(), MAX_SIGN_IN_UNPARKS, unparkSignedIn(), waitingStep(), BrowserPage, browserPages() (+11 more)

### Community 19 - "TicketTimeline.tsx"
Cohesion: 0.12
Nodes (20): CTOReview(), goalState, DailyCTO(), reportDate(), reviewStatus, InlineText(), ReviewText(), LoadingMark() (+12 more)

### Community 20 - "artifact"
Cohesion: 0.03
Nodes (220): ownershipReadHistory(), closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2 (+212 more)

### Community 21 - "dependency-bots/adopt.ts"
Cohesion: 0.08
Nodes (49): Execute, readBackOrThrow(), adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DependabotPR, dependabotPR() (+41 more)

### Community 22 - "retrospective-subject.ts"
Cohesion: 0.15
Nodes (19): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, maintenanceKey(), azurePrUrl(), findSubject(), jobSubject() (+11 more)

### Community 23 - "jira-time.ts"
Cohesion: 0.09
Nodes (38): unresolvedAttempts(), bindingOf(), connectWith(), data(), envelope(), finishVerifiedEffects(), JiraWorklogs, locks (+30 more)

### Community 24 - "park.ts"
Cohesion: 0.50
Nodes (6): decisionMarker(), park(), HarnessPark, recordMetadataPark(), recordParked(), MetadataParkBinding

### Community 25 - "Outbox.tsx"
Cohesion: 0.06
Nodes (57): knowledgeOutbox(), SendMessage, LessonDecisionAction, lessonDecisionState(), readLessonDecision(), DAYS, dueLessonDecisions(), easternWeek() (+49 more)

### Community 26 - "agents.ts"
Cohesion: 0.06
Nodes (45): implementationWorkerContext(), stageInstructions, RefusedQAResult, CECReadbackSchema, READBACK_OWNER_SCOPE, savedStageCompletion(), assertContinuableWorktree(), CONTINUABLE (+37 more)

### Community 27 - "goal-reporting.ts"
Cohesion: 0.16
Nodes (15): GitHubMonitor, githubPRDescription(), azureGoalFacts(), azurePRDescription(), boundedEvidence(), collectAzureGoalDocuments(), EvidenceStore, GOAL_EVIDENCE_LIMITS (+7 more)

### Community 28 - "github-delivery.ts"
Cohesion: 0.04
Nodes (146): containedFile(), writerRestartInstruction(), StoppedWriter, findingsBlock(), QA_STAGES, reviewAdvisoryIds(), Reviewed, withoutReviewAdvisories() (+138 more)

### Community 29 - "continue-ownership-read.ts"
Cohesion: 0.22
Nodes (15): OwnershipRead, continueOwnershipRead(), expiredOwnershipRead(), handoffOwnership(), ReadbackOwnerDecision, ownershipReadGate(), ownershipReadState(), ownershipReadSource() (+7 more)

### Community 30 - "digest"
Cohesion: 0.08
Nodes (68): harnessCloseout(), PASSING, verifyMergeActions(), retryRead(), runHarnessStage(), harnessStageResult(), receipt(), harnessDraft() (+60 more)

### Community 31 - "coordination-pump.ts"
Cohesion: 0.17
Nodes (17): Admission, admit(), IntakeContext, WAIT_STATUSES, compatible(), dependencyCompletionKey(), dependencyEligibility(), DependencyStores (+9 more)

### Community 32 - "index.ts"
Cohesion: 0.05
Nodes (64): implementationContinuationRoute(), qaPlanRetryRoute(), incidentsRoute(), resumeSwitch(), close(), config, itSpecialist, loadedRevision (+56 more)

### Community 33 - "assignment-poll.ts"
Cohesion: 0.08
Nodes (35): BLOCK, harnessBlockMove(), harnessParkedCard(), noted(), initialManualStart(), recordCandidateCleanup(), maintenanceCandidate(), CandidateRemoval (+27 more)

### Community 34 - "rate-limit-samples.ts"
Cohesion: 0.19
Nodes (9): iso(), RateLimitSamples, Reading, reading(), readRateLimitHeaders(), Resource, ResourceReading, Sample (+1 more)

### Community 35 - "common.cjs"
Cohesion: 0.18
Nodes (22): connections(), fs, main(), path, crypto, ensureInside(), { execFileSync }, fs (+14 more)

### Community 36 - "scheduled-work.ts"
Cohesion: 0.08
Nodes (42): freshOwnershipRead(), deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), Ownership, ownershipContext, refreshDeliveryOwnership(), RefreshOwnership (+34 more)

### Community 37 - "routing.cjs"
Cohesion: 0.14
Nodes (27): main(), parseArgs(), usage(), adjacency(), edgeCost(), edgeKey(), edgeType(), EVIDENCE_TYPE_PRIORITY (+19 more)

### Community 38 - "redact-evidence.ts"
Cohesion: 0.08
Nodes (25): AFTER_LABEL, ASSIGNMENT, AWS_KEY_ID, BARE_CREDENTIAL, BARE_UNIT, BARE_VALUE, CAMEL_START, CONTROL_ESCAPE (+17 more)

### Community 39 - "demand-facts.ts"
Cohesion: 0.08
Nodes (33): clip(), DEMAND_LIMIT, demandFacts(), key(), LessonKey, notes(), clip(), MISSED_QUERY_LIMIT (+25 more)

### Community 40 - "observe-github-merges.ts"
Cohesion: 0.19
Nodes (18): clearCooldown(), coolDown(), coolingDown(), MERGE_NOTICE_RECHECK_MS, waitKey(), waits, isMergeCommit(), issueOf() (+10 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.18
Nodes (22): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), midnight(), TicketDay (+14 more)

### Community 42 - "Engine"
Cohesion: 0.09
Nodes (4): GITHUB_ISSUE_SKILL, ResumeProject, Result, Engine

### Community 43 - ".save"
Cohesion: 0.10
Nodes (55): resolveBlockedTransition(), document(), transitionWithComment(), jiraAccount(), jiraCollection(), JiraCredential, jiraCredential(), KEYCHAIN_SERVICE (+47 more)

### Community 44 - "offices.ts"
Cohesion: 0.08
Nodes (18): QuestionNotifications, leadershipContext(), queueLessonIssueCheck(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), queueImprovements(), DELIVERY_CONCURRENCY (+10 more)

### Community 45 - "harness-baseline.ts"
Cohesion: 0.15
Nodes (22): BaselineReport, baselineReport(), BaselineSource, baselineText(), millions(), row(), share(), add() (+14 more)

### Community 46 - "OfficeScene.tsx"
Cohesion: 0.17
Nodes (32): Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk(), ElevatorStage() (+24 more)

### Community 47 - "lesson-selection.ts"
Cohesion: 0.14
Nodes (20): assignedToJoe(), fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), tryReadyLessonIssue(), Wait, INSTALLED, installedLesson() (+12 more)

### Community 48 - "assignment.ts"
Cohesion: 0.10
Nodes (30): latestQA(), notPassedInLatestQA(), QACoverage, qaCoverage(), same(), Tested, stagePrompt(), StagePromptInput (+22 more)

### Community 49 - ".emit"
Cohesion: 0.09
Nodes (38): savedImplementation(), ContinuationIO, nativeIO, assertOwnership(), decideImplementation(), ImplementationDecision, implementationPreview(), assertCandidateIdle() (+30 more)

### Community 50 - "QuestionStepper.tsx"
Cohesion: 0.18
Nodes (19): FeatureQuestionProjection, OutboxQuestionRound(), send(), draftKey(), readDraft(), saveDraft(), nextQuestion(), orderedQuestions() (+11 more)

### Community 51 - "ledger.ts"
Cohesion: 0.10
Nodes (33): acceptedCompletionResolution(), INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationCandidates(), investigationId(), ctoReplacementResolution(), finishedSubjectResolution(), investigationFollowUps() (+25 more)

### Community 52 - "projects.ts"
Cohesion: 0.06
Nodes (55): escaped(), IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), projectListScope(), Assignment, jiraText() (+47 more)

### Community 53 - ".open"
Cohesion: 0.23
Nodes (5): PartRow, partSize(), StateParts, initialSnapshot(), initializeStoreSchema()

### Community 54 - "jiraBinding"
Cohesion: 0.20
Nodes (6): contentSchema(), JiraIssuePublisher, descriptionPreimage(), plain(), publicationDescription(), jiraBinding()

### Community 55 - "ref_node_child_process"
Cohesion: 0.10
Nodes (22): changedPaths(), { execFileSync }, files, isMapInput(), mapOnly(), { execFileSync }, git(), publish() (+14 more)

### Community 56 - "enrollment-gate.ts"
Cohesion: 0.28
Nodes (16): bindFeature(), currentApproval(), featureGate(), predecessorComplete(), automaticIntakeWait(), recoveryHeld(), DeliveryPreflight, deliveryPreflight() (+8 more)

### Community 57 - "pass.ts"
Cohesion: 0.19
Nodes (20): appendFailureLine(), Evidence, FAILURE_ID, FailureEvent, failureLine(), JournalRefused, JournalView, readFailures() (+12 more)

### Community 58 - "ref_node_path"
Cohesion: 0.03
Nodes (93): GitRead, nativeGitRead(), patchArgs, sha(), sourceCopyMatches(), sourceFiles(), absent(), candidateParent() (+85 more)

### Community 59 - "jira-attempts.ts"
Cohesion: 0.10
Nodes (29): attempted(), attemptState(), bound(), covers(), JiraAttempt, jiraAttempts(), JiraAttemptState, open() (+21 more)

### Community 60 - "cost-ledger.ts"
Cohesion: 0.13
Nodes (31): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress(), effectId() (+23 more)

### Community 61 - "time-ledger.ts"
Cohesion: 0.20
Nodes (14): publishableEntry(), settlementPending(), superseded(), ticketUnresolved(), syncing, TimeLedger, clearUnsent(), dueUnsent() (+6 more)

### Community 62 - "maintenance/maintenance.ts"
Cohesion: 0.09
Nodes (26): APPROACH_GUIDANCE, ApproachSchema, reviewInstructions(), deliveryTask(), DeliveryTaskInput, DISCOVERY_GUIDANCE, compactSteps(), featureDeliveryContext() (+18 more)

### Community 63 - "MapView.tsx"
Cohesion: 0.07
Nodes (58): KnowledgeActivity, KnowledgeActivityPage, KnowledgeEdge, KnowledgeMap, KnowledgeNode, ChatMarkdown(), ChatMarkdown, MessageText() (+50 more)

### Community 64 - "redactEvidence"
Cohesion: 0.06
Nodes (60): sourceVersions(), CompareMemory, compareMemory(), COMPARES_PER_PASS, comparison(), DeployedFixes, DeployedFixesInput, recordDeployedFixes() (+52 more)

### Community 65 - "validate_pr_body.cjs"
Cohesion: 0.36
Nodes (8): fs, main(), readableText(), REQUIRED_CHECKS, REQUIRED_SECTIONS, sections(), validatePullRequestBody(), withoutComments()

### Community 66 - "audit-plan-candidates.cjs"
Cohesion: 0.14
Nodes (31): audit(), branchIssueNumbers(), classify(), distinctiveTitleWords(), { execFileSync }, extractPaths(), findPrForMergeSubject(), fmtCommit() (+23 more)

### Community 67 - "office-client.ts"
Cohesion: 0.19
Nodes (14): bodyWithin(), bounded(), Envelope, HealthReading, IncidentRow, officeReader(), OfficeReadError, Release (+6 more)

### Community 68 - "resume-arrivals.ts"
Cohesion: 0.11
Nodes (63): canonical(), CheckpointEligibility, checkpointEligibility(), admitAssignmentResume(), forAssignment(), admitCheckpointResume(), forCheckpoint(), admitResume() (+55 more)

### Community 69 - "ticket-evidence.ts"
Cohesion: 0.15
Nodes (21): assetDownloader(), attachmentKind(), evidenceDirectory(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS, EvidenceAttachment (+13 more)

### Community 70 - "constellation-runtime.ts"
Cohesion: 0.15
Nodes (16): CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point, focusOverlayMotion(), FocusOverlayLayout (+8 more)

### Community 71 - "cec.ts"
Cohesion: 0.05
Nodes (67): intakeMembership(), movedHeadNote(), cecPrompt(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), plainResume() (+59 more)

### Community 72 - "session-context-file.ts"
Cohesion: 0.19
Nodes (15): Bound, ContextFoldPrefix, contextFoldPrefix(), SessionContextCheckpoint, captureSessionContextClone(), ContextReadPhase, SessionContextDeadline, sessionContextFile() (+7 more)

### Community 73 - "assignments.ts"
Cohesion: 0.08
Nodes (32): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, CommittedBrain (+24 more)

### Community 74 - "session-scope.ts"
Cohesion: 0.20
Nodes (16): claudeScopeParser(), claudeSessionScope(), CODEX_ROLLOUTS, contextReaders(), retainSessionMessage(), SessionConversation, escaped(), jiraCommandIssues() (+8 more)

### Community 75 - "service-health.ts"
Cohesion: 0.12
Nodes (23): ClaudeLoginRefusal, claudeLoginRefusal(), claudeRefusalWords(), RECORDED_REFUSALS, refusedClaudeRow(), listenerHealth(), providers, ProviderStatusChecks (+15 more)

### Community 76 - "azure.ts"
Cohesion: 0.12
Nodes (30): AzureMonitor, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs(), fullActivePRs(), observation() (+22 more)

### Community 77 - "alert-issue.ts"
Cohesion: 0.19
Nodes (19): AlertIssue, alertIssueBody(), alertIssueTitle(), alertMarker(), closeAlertIssue(), ensureAlertIssue(), findAlertIssue(), Guard (+11 more)

### Community 78 - "incidents.ts"
Cohesion: 0.09
Nodes (50): attributedRecords(), foldsItsRun(), groupCandidates(), ObservedIncident, ObservedSubject, digest(), fingerprint(), incidentId() (+42 more)

### Community 79 - "runner-state.ts"
Cohesion: 0.14
Nodes (19): at, EMPTY_STATE, IncidentSample, IncidentSummary, InFlight, Intent, JournalIntent, PASS_OUTCOMES (+11 more)

### Community 80 - "session-bridge.ts"
Cohesion: 0.10
Nodes (28): codexDaemonProcesses(), accountCodexProcesses(), CodexProcessInventory, codexProcessInventory(), DesktopSessions, unaccountedProcesses(), codexThreadMetadata(), METADATA_CHUNK (+20 more)

### Community 81 - "Coordinator"
Cohesion: 0.08
Nodes (3): withGitHubSource(), coordination(), Coordinator

### Community 82 - "useLiveTiming.ts"
Cohesion: 0.19
Nodes (17): LiveAgentTask(), Props, RunningTask(), text(), AzureBuild, lastWall, sample(), subscribe() (+9 more)

### Community 83 - "brain-maintenance.ts"
Cohesion: 0.14
Nodes (19): maintenancePolicies(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, brainResultStop(), GateMark, gateMark(), MAX_START_RETRIES (+11 more)

### Community 84 - "viewer.js"
Cohesion: 0.19
Nodes (25): addMetaLink(), addMetaRow(), addRelationship(), applyView(), buildIndexes(), buildLegend(), buildModel(), buildRenderer() (+17 more)

### Community 85 - "weekly-rollup.ts"
Cohesion: 0.13
Nodes (27): learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), retire(), BRAIN_SCOPE, RollupResult (+19 more)

### Community 86 - "stopped-record.ts"
Cohesion: 0.07
Nodes (63): capabilityBlockedReviews(), latestReviews(), boundedEvidence(), expectedWait(), StopFacts, FailedMailCheck, lastFailedMailCheck(), lastMailCheckOutcome() (+55 more)

### Community 87 - "sanitize"
Cohesion: 0.07
Nodes (42): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+34 more)

### Community 88 - "ref_zod"
Cohesion: 0.08
Nodes (28): channelNoticeAuthorized(), ChannelSettings, notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR, plainSlackText() (+20 more)

### Community 89 - "spawn-command.ts"
Cohesion: 0.12
Nodes (24): exitFailure(), inactivityWatch(), At, Errno, errno(), GroupInventory, GroupProbe, LifecycleDiagnostic (+16 more)

### Community 90 - "provider-observation.ts"
Cohesion: 0.13
Nodes (26): az(), correlatedBuild(), Azure, azurePipelines(), outcome(), Read, RUNS_PER_PIPELINE, Api (+18 more)

### Community 91 - "Ticket"
Cohesion: 0.09
Nodes (36): carriedNotRepeated(), changeScopeNote(), Scoped, CommentPage, commentReadback(), devUpdate(), HEADLINE, JiraOperations (+28 more)

### Community 92 - "session-context-client.ts"
Cohesion: 0.11
Nodes (19): claudeSessionContext(), readTranscript, codexSessionContext(), readRollout, packContextFailure(), PackedContextFailure, unpackContextFailure(), ContextThread (+11 more)

### Community 93 - "plans.cjs"
Cohesion: 0.12
Nodes (27): fs, main(), parse(), path, atomicWrite(), substantive(), walk(), association() (+19 more)

### Community 94 - "timed-statements.ts"
Cohesion: 0.22
Nodes (12): StoreTimings, NAMED, rowsText(), rowText(), SQL_TOKEN, statementName(), text(), timed() (+4 more)

### Community 96 - "ref_node_sqlite"
Cohesion: 0.30
Nodes (7): readSavedState(), joinParts(), readSaved(), SavedSelection, SavedStateConflict, savedText(), selectSaved()

### Community 97 - "coordination.ts"
Cohesion: 0.17
Nodes (16): completeNativeCheckpoint(), BrainStatusSchema, identity, queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation() (+8 more)

### Community 98 - "pilot-delivery.ts"
Cohesion: 0.06
Nodes (80): candidateBranchMoved(), applyChangeScope(), endChangeScope(), levels(), MAX_CHECKS, owedUnderScope(), scopeBase(), scopeOutgrown() (+72 more)

### Community 99 - "archive-plan.cjs"
Cohesion: 0.17
Nodes (22): fs, main(), parse(), path, archive(), cell(), ensureIndex(), fromArgs() (+14 more)

### Community 100 - "call-scope.ts"
Cohesion: 0.26
Nodes (11): CallLedger, bindGitHubRunner(), boundGitHubRunner(), currentGitHubProject(), currentGitHubSource(), githubCli(), Runner, scopes (+3 more)

### Community 101 - "workKey"
Cohesion: 0.14
Nodes (23): notOwned(), mergedByOwner(), closeableIssue(), effectsSettled(), eligible(), officePublished(), ownerMerged(), prerequisitesMet() (+15 more)

### Community 102 - "read-retries.ts"
Cohesion: 0.22
Nodes (14): APPROACH_GUARD_REJECTION, PrerequisitesSchema, classifyStop(), ReviewWait, incompleteReadOutput(), IntakeResult, planReadRetry(), readOnlyStageJob() (+6 more)

### Community 103 - "on-merge-sync.cjs"
Cohesion: 0.15
Nodes (28): fs, main(), path, { spawnSync }, fieldSpan(), frontmatterProblems(), keyPattern(), list() (+20 more)

### Community 104 - "snapshot-stores.ts"
Cohesion: 0.26
Nodes (15): absentAdmission(), AdmissionComparison, AdmissionSnapshot, compareAdmissions(), snapshotAdmissions(), storeMissing(), absenceDisagreements(), snapshotGaps() (+7 more)

### Community 105 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 106 - "deploy.ts"
Cohesion: 0.03
Nodes (166): [cmd,...rawArgs], runningRevision(), runningRevision(), Body, DeploymentFenceState, fenceTokenDigest(), runtimeRevision(), ActiveRelease (+158 more)

### Community 107 - "overseer/config.ts"
Cohesion: 0.18
Nodes (12): DEFAULT_OFFICE_URL, LOOPBACK, officeUrl(), RUNNER_DEFAULTS, RunnerLimits, RunnerPaths, officeDataRoot, realMachine() (+4 more)

### Community 108 - "DeploymentFence"
Cohesion: 0.38
Nodes (3): assertToken(), DeploymentFence, DeploymentFenceGateContext

### Community 109 - "engine.ts"
Cohesion: 0.23
Nodes (12): enumerateIntakeList(), inPickupOrder(), Intake, text(), checkMail(), drainMail(), requestMail(), enableNightly() (+4 more)

### Community 110 - "blocker-followups.ts"
Cohesion: 0.11
Nodes (48): conversationReadbackReady(), followupOf(), pendingReadback(), queueConversationReadback(), readbackEnding(), uncertainConversations(), readBackConversations(), followupRecord() (+40 more)

### Community 111 - "report.ts"
Cohesion: 0.22
Nodes (15): TelemetryReport, TelemetryRow, TelemetrySync, Acc, bump(), EASTERN, easternDay(), modelShares() (+7 more)

### Community 112 - "outbox.ts"
Cohesion: 0.14
Nodes (20): ctoInputIdentityMatches(), ctoInputRecovered(), metadataParkAction(), ADOPTION_STALLED_MS, conversationResolved(), projectOutbox(), item(), syncOutbox() (+12 more)

### Community 113 - "coordination-tick.ts"
Cohesion: 0.16
Nodes (15): reconcileNoticeConfirmations(), brainCheckpointCompletion(), checkpointOutcome(), Outcome, nativeChecks, outcomeKnown(), reconcileCompletedCheckpoints(), settledRun() (+7 more)

### Community 114 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 115 - "telemetry.ts"
Cohesion: 0.08
Nodes (33): add(), CodexRequest, CodexRollout, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens() (+25 more)

### Community 119 - "endpoint-family.ts"
Cohesion: 0.38
Nodes (6): endpoint(), GitHubCall, githubCall(), OPAQUE, repositoryFamily(), VALUE_FLAGS

### Community 120 - "store-fingerprint.ts"
Cohesion: 0.24
Nodes (13): APPENDED_TABLE, comparableOrder(), comparableRow(), START_EVENT_KINDS, START_STATE_SHAPES, startEvent(), withoutStartValue(), withoutStartValues() (+5 more)

### Community 121 - "follow-production.ts"
Cohesion: 0.20
Nodes (17): awaitingJiraStatus(), awaitingProduction(), FOLLOW_DAYS, followed(), isFollowed(), Azure, AzureRead, containedIn() (+9 more)

### Community 122 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (7): CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility, overlayEntranceDelays(), SceneOverlay()

### Community 123 - "createConstellation"
Cohesion: 0.18
Nodes (5): ConstellationRuntime, createConstellation(), enter(), finishTap(), move()

### Community 124 - "refresh-issue-state.cjs"
Cohesion: 0.20
Nodes (19): advanceFence(), closingIssues(), githubRefs(), key(), normalizeGithubQuery(), normalizeRepository(), parseGithubQuery(), ref() (+11 more)

### Community 125 - "knowledge.ts"
Cohesion: 0.06
Nodes (44): normalizeStatement(), curateLesson(), Curation, CurationAction, mergeEvidence(), LessonBrainAudit, LessonBrainOverlap, decideOfficeProposal() (+36 more)

### Community 126 - "GitHubDelivery"
Cohesion: 0.05
Nodes (75): removeAdoptedClone(), namedRepairIds(), deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, requireDeliveryAuthority(), deliveryIntakeBlocker() (+67 more)

### Community 127 - "accessibility-sources.ts"
Cohesion: 0.23
Nodes (18): accessibilitySources(), actionable(), closingPull(), Finding, handoffIssue(), issueLines(), issueSource(), observation (+10 more)

### Community 128 - "node-visuals.ts"
Cohesion: 0.20
Nodes (14): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+6 more)

### Community 129 - "call-outcome.ts"
Cohesion: 0.18
Nodes (16): add(), addSource(), busiest(), Entry, sourceRows(), Sources, CallCounts, failed() (+8 more)

### Community 130 - "pre-push-boundary.ts"
Cohesion: 0.27
Nodes (10): Event, exactCommand(), Invocation, localHookCommand(), one(), prePushRejection(), PushIdentity, retirementBoundary() (+2 more)

### Community 131 - "it-specialist.ts"
Cohesion: 0.10
Nodes (28): replacedReadback(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), heldFor(), ITContext, recoveryHeld() (+20 more)

### Community 132 - "diagnostic-snapshot.ts"
Cohesion: 0.17
Nodes (17): assignmentDiagnostics(), diagnosticContext(), diagnosticSnapshot(), followUpPicture(), publishITReport(), archiveOldReports(), RETAINED_REPORTS, archiveByMonth() (+9 more)

### Community 133 - "run-accounting.ts"
Cohesion: 0.11
Nodes (31): helperTelemetry(), BoundedRead, backfillClaudeCost(), CompletionReader, codexHome(), createdAt(), dayDirs(), header() (+23 more)

### Community 134 - "projectPolicy"
Cohesion: 0.20
Nodes (14): checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), repeatedVendorReviewBlock(), stoppedInVendorReview(), leftToNextRun(), NEXT_RUN_DUE_MS, night() (+6 more)

### Community 135 - "dates.cjs"
Cohesion: 0.31
Nodes (12): today(), dateFromPlanBasename(), dateFromSessionPath(), evidenceDates(), fileMtimeDate(), fs, gitCommitDate(), inferPlanDate() (+4 more)

### Community 136 - "release-unpark.ts"
Cohesion: 0.33
Nodes (8): due(), MAX_RELEASE_UNPARKS, RELEASE_CHECK_MS, returnToPickup(), unparkReleasedWaits(), compare(), highestStableAtLeast(), parts()

### Community 137 - "Effects"
Cohesion: 0.23
Nodes (6): GitHubOperations, Assessment, closeNativeRefresh(), fingerprint(), Effects, EffectIntent

### Community 138 - "owned-artifact.ts"
Cohesion: 0.25
Nodes (13): investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_SOURCE_PATHS, officeSource(), done(), readBoundedNoFollow() (+5 more)

### Community 139 - "Store"
Cohesion: 0.09
Nodes (13): featureById(), GitHubFeaturePublisher, JiraFeaturePublisher, publishFeature(), reconcilePublication(), uncertainPublications(), reserveIdentity(), FeatureReviewRunner (+5 more)

### Community 140 - "session-snapshot-cleanup.ts"
Cohesion: 0.40
Nodes (5): SNAPSHOT_PREFIX, removeStaleSessionSnapshots(), SNAPSHOT_SWEEP_MS, STALE_SNAPSHOT_MS, sweepStaleSessionSnapshots()

### Community 141 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 142 - "scheduler.ts"
Cohesion: 0.12
Nodes (16): Clock, systemClock, PROJECT_LOCAL, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork() (+8 more)

### Community 144 - "reconcile-merges.cjs"
Cohesion: 0.22
Nodes (14): collectPulls(), copyWikiForDryRun(), { execFileSync }, flattenPages(), fs, githubRequest(), isWikiBotPull(), main() (+6 more)

### Community 145 - "useOfficePreferences.ts"
Cohesion: 0.11
Nodes (19): PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, acceptPreferences(), PreferenceCandidate, PreferenceState (+11 more)

### Community 146 - "preparation-board-provenance.ts"
Cohesion: 0.18
Nodes (11): claimSchema, eventSchema, PreparationBoardOrigin, readPreparationBoardOrigins(), timestamp, updateSchema, assertPreparationReceiptProviders(), identity() (+3 more)

### Community 147 - "metadata-park-words.ts"
Cohesion: 0.33
Nodes (11): field(), FIELDS, MetadataField, metadataFields(), metadataParkWords(), metadataStopWords(), needed(), sentence() (+3 more)

### Community 148 - "runner-root.ts"
Cohesion: 0.33
Nodes (11): privateDirectories(), runnerPaths(), ancestry(), assertDirectoryOrAbsent(), CHECKOUT, code(), MARKERS, physicalPath() (+3 more)

### Community 149 - "harnessEffect"
Cohesion: 0.16
Nodes (36): effectKey(), LaneOperation, laneWrite(), moveCardOnce(), Lane, MOVABLE, moveLane(), resolveLane() (+28 more)

### Community 150 - "serve-graph.cjs"
Cohesion: 0.24
Nodes (9): createServer(), fs, http, listen(), attempt(), main(), path, resolveRequest() (+1 more)

### Community 151 - "DrawerTopic.tsx"
Cohesion: 0.11
Nodes (28): createConversationDrafts(), FeatureDelivery(), FeatureDocuments(), views, FeatureReading(), FeatureWorkspace(), phases, QuestionRound() (+20 more)

### Community 152 - "evidence-artifacts.ts"
Cohesion: 0.38
Nodes (8): ProviderEvidence, canonical(), evidenceDigest(), evidenceHash(), semantic(), stableUrl(), requirementDrift(), RequirementPostimage

### Community 153 - "qa-plan-retry.ts"
Cohesion: 0.67
Nodes (3): QAPlanRetry, QAPlanRetryProof, QAPlanRetryRequest

### Community 154 - "work.ts"
Cohesion: 0.05
Nodes (61): boundaryCrossed(), Crossing, Progress, CheckpointProgress, checkpointProgress(), names(), nativeProof(), Step (+53 more)

### Community 155 - "state-parts.ts"
Cohesion: 0.31
Nodes (8): LARGE_KEY_CHARS, plain(), RedactedEntries, RedactedEntry, redactEntries(), StartStateKey, startStateKey(), WrittenPart

### Community 156 - "restart-writer.ts"
Cohesion: 0.17
Nodes (18): ATTEMPT_DELAYS_MS, nextAttemptAt(), restartStoppedWriters(), unchangedSinceAccepted(), NOT_RETRYABLE, releaseFunds(), stoppedWriter(), WRITER_STAGES (+10 more)

### Community 158 - "candidate-child-context.ts"
Cohesion: 0.38
Nodes (8): adoptCandidate(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat()

### Community 161 - "single-flight.ts"
Cohesion: 0.33
Nodes (8): ensurePrivateDirectory(), acquirePassLock(), Owner, PassLock, PassOwner, PassRefused, readPassOwner(), same()

### Community 163 - "store.ts"
Cohesion: 0.10
Nodes (23): currentOutbox(), interruptAdoptions(), legacy(), REMOVED_FIELDS, retireLegacyRecovery(), goalNoticeNeverDispatched(), maintenanceNoticeNeverDispatched(), recover() (+15 more)

### Community 164 - "validate_wiki_pr_body.cjs"
Cohesion: 0.33
Nodes (5): { execFileSync }, hasCanonicalWikiBody(), maintenanceBodies, matchesMaintenanceBody(), { readFileSync }

### Community 165 - "incident-command.ts"
Cohesion: 0.38
Nodes (6): FLAGS, incidentCommand(), IncidentCommandIO, option(), USAGE, whole()

### Community 166 - "office-qa-handoff.ts"
Cohesion: 0.60
Nodes (4): OfficeQAHandoff, OfficeQAHandoffInput, OfficeQAHandoffRequest, QAOwnershipProof

### Community 167 - "Agents"
Cohesion: 0.12
Nodes (13): Document, document(), isAccessOnlyPlan(), settledAccessOnlyState(), continueAccessOnlyPlan(), entryExists(), itChatPrompt(), canFileGithubIssue() (+5 more)

### Community 168 - "engine-range.ts"
Cohesion: 0.83
Nodes (3): compare(), parts(), satisfiesRange()

## Knowledge Gaps
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `worker-runtime.ts`, `features.ts`, `daily-cto.ts`, `project-policy.ts`, `github/issue-publication.ts`, `office/config.ts`, `OfficeSnapshot`, `admit-improvement.ts`, `advance-metadata-park.ts`, `scheduled-captures.ts`, `run-retrospective.ts`, `record-trigger.ts`, `sign-in-unpark.ts`, `artifact`, `dependency-bots/adopt.ts`, `retrospective-subject.ts`, `jira-time.ts`, `agents.ts`, `goal-reporting.ts`, `github-delivery.ts`, `continue-ownership-read.ts`, `digest`, `coordination-pump.ts`, `index.ts`, `assignment-poll.ts`, `scheduled-work.ts`, `demand-facts.ts`, `observe-github-merges.ts`, `time-scope.ts`, `Engine`, `.save`, `offices.ts`, `lesson-selection.ts`, `assignment.ts`, `.emit`, `ledger.ts`, `projects.ts`, `.open`, `jiraBinding`, `enrollment-gate.ts`, `ref_node_path`, `jira-attempts.ts`, `cost-ledger.ts`, `time-ledger.ts`, `maintenance/maintenance.ts`, `redactEvidence`, `resume-arrivals.ts`, `ticket-evidence.ts`, `cec.ts`, `assignments.ts`, `azure.ts`, `alert-issue.ts`, `session-bridge.ts`, `Coordinator`, `brain-maintenance.ts`, `weekly-rollup.ts`, `stopped-record.ts`, `sanitize`, `ref_zod`, `provider-observation.ts`, `Ticket`, `coordination.ts`, `pilot-delivery.ts`, `workKey`, `read-retries.ts`, `deploy.ts`, `engine.ts`, `blocker-followups.ts`, `coordination-tick.ts`, `follow-production.ts`, `knowledge.ts`, `GitHubDelivery`, `accessibility-sources.ts`, `it-specialist.ts`, `diagnostic-snapshot.ts`, `run-accounting.ts`, `release-unpark.ts`, `Effects`, `owned-artifact.ts`, `scheduler.ts`, `preparation-board-provenance.ts`, `harnessEffect`, `evidence-artifacts.ts`, `work.ts`, `restart-writer.ts`, `ProjectProgress`, `candidate-child-context.ts`, `store.ts`, `Agents`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **Should `incidents/routes.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06277436347673397 - nodes in this community are weakly interconnected._
- **Why does `OfficeSnapshot` connect `OfficeSnapshot` to `OrgChart.tsx`, `it-specialist.ts`, `diagnostic-snapshot.ts`, `cx`, `projectPolicy`, `index.tsx`, `ServiceHealthPanel.tsx`, `Store`, `scene-motion.ts`, `record-trigger.ts`, `useOfficePreferences.ts`, `TicketTimeline.tsx`, `DrawerTopic.tsx`, `Outbox.tsx`, `work.ts`, `restart-writer.ts`, `index.ts`, `store.ts`, `offices.ts`, `harness-baseline.ts`, `OfficeScene.tsx`, `ledger.ts`, `enrollment-gate.ts`, `maintenance/maintenance.ts`, `MapView.tsx`, `resume-arrivals.ts`, `service-health.ts`, `azure.ts`, `incidents.ts`, `useLiveTiming.ts`, `stopped-record.ts`, `sanitize`, `ref_node_sqlite`, `pilot-delivery.ts`, `outbox.ts`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Should `OrgChart.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08196721311475409 - nodes in this community are weakly interconnected._
- **Why does `Coordinator` connect `Coordinator` to `coordination.ts`, `assignment-poll.ts`, `scheduled-work.ts`, `offices.ts`, `scheduled-captures.ts`, `coordination-tick.ts`, `artifact`, `coordination-pump.ts`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Should `worker-runtime.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05442428730099963 - nodes in this community are weakly interconnected._
- **Should `features.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05266106442577031 - nodes in this community are weakly interconnected._