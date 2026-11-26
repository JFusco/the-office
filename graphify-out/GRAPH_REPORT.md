# Graph Report - the-office  (2026-11-26)

## Corpus Check
- 1245 files · ~527,874 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 6460 nodes · 28322 edges · 169 communities (158 shown, 11 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 1028 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2728d913`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- incidents/routes.ts
- OrgChart.tsx
- worker-runtime.ts
- features/workflow.ts
- cx
- daily-cto.ts
- projects.ts
- GitHubDelivery
- holdReason
- TelemetryPanel.tsx
- ref_node_crypto
- pass.ts
- OfficeSnapshot
- admit-improvement.ts
- advance-metadata-park.ts
- scheduled-captures.ts
- run-retrospective.ts
- record-trigger.ts
- deploy-command.ts
- Conversation.tsx
- artifact
- dependency-bots/adopt.ts
- retrospective-subject.ts
- jira-time.ts
- deploy-plan.ts
- Outbox.tsx
- agents.ts
- owner-merged-stopped.ts
- github-delivery.ts
- index.tsx
- ref_node_util
- enrollment-gate.ts
- index.ts
- remove-candidate.ts
- call-scope.ts
- wiki-graph.cjs
- scheduled-work.ts
- routing.cjs
- redact-evidence.ts
- knowledge.ts
- lesson-selection.ts
- time-scope.ts
- Engine
- .save
- Offices
- harness-baseline.ts
- OfficeScene.tsx
- cec.ts
- kill-switch.ts
- shared.ts
- FeatureWorkspace.tsx
- coordination.ts
- local-config.ts
- control-store.ts
- jiraBinding
- publish-refresh.cjs
- offices.ts
- deploy.ts
- ref_node_path
- time-readback.ts
- cost-ledger.ts
- unsent-time.ts
- maintenance/maintenance.ts
- MapView.tsx
- judge-resumes.ts
- validate_pr_body.cjs
- audit-plan-candidates.cjs
- office-client.ts
- resume-arrivals.ts
- ticket-evidence.ts
- constellation-runtime.ts
- setup-stop-cap.ts
- session-context-file.ts
- assignments.ts
- session-scope.ts
- service-health.ts
- azure.ts
- it-report.ts
- incidents.ts
- goal-reporting.ts
- session-bridge.ts
- Coordinator
- release-unpark.ts
- alert-issue.ts
- viewer.js
- weekly-rollup.ts
- stopped-record.ts
- sanitize
- conversations/slack.ts
- spawn-command.ts
- provider-observation.ts
- readable-jira-comment.ts
- session-context-client.ts
- plans.cjs
- useLiveTiming.ts
- capture-session-clone.py
- sign-in-unpark.ts
- copy.ts
- Ticket
- archive-plan.cjs
- .emit
- store.ts
- coordination-pump.ts
- on-merge-sync.cjs
- backup-stores.ts
- extract-worker.mjs
- ref_zod
- work.ts
- DeploymentFence
- contract.ts
- blocker-followups.ts
- report.ts
- outbox.ts
- process.ts
- slack-supersession.ts
- telemetry.ts
- qa.ts
- qa-plan-continuation.ts
- writer-restart.ts
- GitHubIssuePublisher
- Goals.tsx
- project-bindings-config.ts
- resume-control.ts
- createConstellation
- refresh-issue-state.cjs
- office-lessons.ts
- delivery-recoveries.ts
- lesson-issue-ready.ts
- node-visuals.ts
- call-ledger.ts
- pre-push-boundary.ts
- it-specialist.ts
- diagnostic-snapshot.ts
- run-accounting.ts
- follow-up-alerts.ts
- controller-runtime.ts
- assignment-poll.ts
- .getEffect
- run.ts
- featureById
- session-snapshot-cleanup.ts
- scene-motion.ts
- Store
- production.ts
- reconcile-merges.cjs
- preferences-store.ts
- RoomCamera.tsx
- metadata-park-words.ts
- ref_node_child_process
- harnessEffect
- common.cjs
- QAResultsCard.tsx
- SessionBridge
- qa-plan-retry.ts
- resume-outcome.ts
- runner-root.ts
- connectWith
- ProjectProgress
- JiraWorklogTransport
- routing.js
- packed-consumer-pnpm.ts
- codex-rollout.ts
- claude-session-context.ts
- interrupted-work-recovery.ts
- delivery-ownership.ts
- restoreInPlace
- ITFollowUps.tsx
- bounded-session-refresh.ts
- run-evidence.ts

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
- `Admission` --references--> `AssignmentReview`  [EXTRACTED]
  server/delivery/intake/admission.ts → src/shared.ts
- `DeliverySlot` --references--> `Role`  [EXTRACTED]
  server/office/projects.ts → src/shared.ts

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

## Communities (169 total, 11 thin omitted)

### Community 0 - "incidents/routes.ts"
Cohesion: 0.06
Nodes (57): citationFault(), CitationSchema, SourceVersions, sourceVersions(), dismiss(), DISMISSAL_CITATIONS, DISMISSAL_REASON, DismissalFacts (+49 more)

### Community 1 - "OrgChart.tsx"
Cohesion: 0.12
Nodes (38): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+30 more)

### Community 2 - "worker-runtime.ts"
Cohesion: 0.07
Nodes (37): candidateWorkspaceEnvironment(), assignmentSubject(), DATA, contextPacket(), sanitizeObject(), CODEX_DEFAULT_EFFORT, CODEX_DEFAULT_MODEL, CODEX_EFFORTS (+29 more)

### Community 3 - "features/workflow.ts"
Cohesion: 0.09
Nodes (45): approveFeature(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), artifactPath(), digest(), document() (+37 more)

### Community 4 - "cx"
Cohesion: 0.09
Nodes (91): Conversation(), Outbox(), SlackDeliveryCard(), blockedSummary(), currentServices(), ServiceHealthPanel(), followUp(), labels (+83 more)

### Community 5 - "daily-cto.ts"
Cohesion: 0.06
Nodes (35): currentCitations(), Fact, NOT_CURRENT, PROVIDER_ERROR, DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt() (+27 more)

### Community 6 - "projects.ts"
Cohesion: 0.11
Nodes (28): intakeLocation(), IntakeView, CEC, LOCAL_BINDINGS, OfficeConfigInputs, officeConfigRoute(), officeConfigSummary(), projectSettingsSummary() (+20 more)

### Community 7 - "GitHubDelivery"
Cohesion: 0.04
Nodes (121): containedFile(), recordJobApproach(), GitHubDelivery, boardPreflightCandidate(), Ownership, reconcileBoardPreflight(), adoptCandidate(), reported (+113 more)

### Community 8 - "holdReason"
Cohesion: 0.06
Nodes (81): observe(), settleOwnerMergedStopped(), hasUncertainEffects(), approveMerge(), assertAutomationEffects(), automationMergePolicy(), observeAutomationMerge(), CheckJobAgreement (+73 more)

### Community 9 - "TelemetryPanel.tsx"
Cohesion: 0.14
Nodes (25): TelemetryReport, loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView(), policyText(), OfficeConfigSummary, BreakdownTable() (+17 more)

### Community 10 - "ref_node_crypto"
Cohesion: 0.12
Nodes (36): featureItemComplete(), reconcileFeatureCompletion(), discoveryPrompt(), planPrompt(), helperTelemetry(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS (+28 more)

### Community 11 - "pass.ts"
Cohesion: 0.10
Nodes (39): appendFailureLine(), Evidence, FAILURE_ID, FailureEvent, failureLine(), JournalRefused, JournalView, readFailures() (+31 more)

### Community 12 - "OfficeSnapshot"
Cohesion: 0.04
Nodes (99): jiraQueueProgress(), nextStage(), compactSteps(), DailyCTOSummary, deliveryRoles, JiraQueueProgress, TicketProgress, BrainDrawer() (+91 more)

### Community 13 - "admit-improvement.ts"
Cohesion: 0.21
Nodes (16): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+8 more)

### Community 14 - "advance-metadata-park.ts"
Cohesion: 0.08
Nodes (72): ProjectCard, advanceMetadataPark(), Parked, releaseWords(), sentAnything(), cardResumeRoute(), effectiveParkPickup(), PICKUP_ASSIGNEE (+64 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.13
Nodes (53): requestDelivery(), accounting, DeliverySubject, nonDelivery, originalReads, createFeature(), assertEnrollable(), enrolled() (+45 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.08
Nodes (47): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, BlockingTrigger, blockingTrigger(), isBlocking() (+39 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.12
Nodes (36): baselined(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences(), clip(), maintenanceBlockedId(), MaintenanceCandidate (+28 more)

### Community 18 - "deploy-command.ts"
Cohesion: 0.11
Nodes (39): readControllerPin(), writeControllerPin(), controllerOf(), deployCommand(), report(), status(), deploy(), exclusively() (+31 more)

### Community 19 - "Conversation.tsx"
Cohesion: 0.12
Nodes (28): ConversationDraft, createConversationDrafts(), SendMessage, isLessonDecision(), blocker(), recommendedReply(), slackMessageStatus(), DrawerNavigation (+20 more)

### Community 20 - "artifact"
Cohesion: 0.05
Nodes (137): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+129 more)

### Community 21 - "dependency-bots/adopt.ts"
Cohesion: 0.10
Nodes (40): Execute, adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DependabotPR, dependabotPR(), inPickupLane() (+32 more)

### Community 22 - "retrospective-subject.ts"
Cohesion: 0.19
Nodes (15): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, maintenanceKey(), azurePrUrl(), findSubject(), jobSubject() (+7 more)

### Community 23 - "jira-time.ts"
Cohesion: 0.09
Nodes (49): attempted(), attemptState(), bound(), covers(), JiraAttempt, jiraAttempts(), JiraAttemptState, open() (+41 more)

### Community 24 - "deploy-plan.ts"
Cohesion: 0.29
Nodes (13): Body, DeploymentFenceState, fenceTokenDigest(), operationPaths(), planDeployment(), createDeployToken(), readDeployToken(), removeDeployToken() (+5 more)

### Community 25 - "Outbox.tsx"
Cohesion: 0.08
Nodes (33): LessonDecisionAction, lessonDecisionState(), readLessonDecision(), DAYS, dueLessonDecisions(), easternWeek(), LESSON_DIGEST, LessonDecision (+25 more)

### Community 26 - "agents.ts"
Cohesion: 0.04
Nodes (68): implementationWorkerContext(), IntakeBinding, intakeEnumeration(), intakeJql(), intakeMembership(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt() (+60 more)

### Community 27 - "owner-merged-stopped.ts"
Cohesion: 0.16
Nodes (19): notOwned(), mergedByOwner(), closeableIssue(), effectsSettled(), eligible(), officePublished(), ownerMerged(), prerequisitesMet() (+11 more)

### Community 28 - "github-delivery.ts"
Cohesion: 0.05
Nodes (94): writerRestartInstruction(), harnessCloseout(), PASSING, verifyMergeActions(), findingsBlock(), QA_STAGES, reviewAdvisoryIds(), Reviewed (+86 more)

### Community 29 - "index.tsx"
Cohesion: 0.10
Nodes (48): LinkedFeatures(), SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS, PickupForm() (+40 more)

### Community 30 - "ref_node_util"
Cohesion: 0.11
Nodes (43): assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema, savedMetadataAssessment(), validateSaved(), metadataClaim(), assertMetadataBinding() (+35 more)

### Community 31 - "enrollment-gate.ts"
Cohesion: 0.16
Nodes (29): dispatchNightly(), eligibility(), Admission, admit(), IntakeContext, WAIT_STATUSES, dependencyEligibility(), DependencyStores (+21 more)

### Community 32 - "index.ts"
Cohesion: 0.07
Nodes (46): implementationContinuationRoute(), qaPlanRetryRoute(), close(), config, itSpecialist, loadedRevision, offices, releaseLock (+38 more)

### Community 33 - "remove-candidate.ts"
Cohesion: 0.14
Nodes (24): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), maintenanceCandidate(), moveAside(), moveBack(), purgeRemoved(), purging (+16 more)

### Community 34 - "call-scope.ts"
Cohesion: 0.11
Nodes (27): bindGitHubRunner(), boundGitHubRunner(), currentGitHubProject(), currentGitHubSource(), githubCli(), Runner, scopes, STAGES (+19 more)

### Community 35 - "wiki-graph.cjs"
Cohesion: 0.18
Nodes (22): connections(), fs, main(), path, ensureInside(), hasSymlinkComponent(), slash(), splitFrontmatter() (+14 more)

### Community 36 - "scheduled-work.ts"
Cohesion: 0.09
Nodes (41): freshOwnershipRead(), dueSlackReread(), rereadUncertainSlack(), runningRevision(), deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), withAmendmentOwnership() (+33 more)

### Community 37 - "routing.cjs"
Cohesion: 0.14
Nodes (29): closingIssues(), githubRefs(), normalizeGithubQuery(), normalizeRepository(), parseGithubQuery(), ref(), withoutFencedCode(), adjacency() (+21 more)

### Community 38 - "redact-evidence.ts"
Cohesion: 0.11
Nodes (18): AFTER_LABEL, ASSIGNMENT, AWS_KEY_ID, BARE_CREDENTIAL, BARE_UNIT, BARE_VALUE, CAMEL_START, CONTROL_ESCAPE (+10 more)

### Community 39 - "knowledge.ts"
Cohesion: 0.08
Nodes (34): clip(), DEMAND_LIMIT, demandFacts(), key(), LessonKey, notes(), clip(), MISSED_QUERY_LIMIT (+26 more)

### Community 40 - "lesson-selection.ts"
Cohesion: 0.11
Nodes (26): improvementIntakeGate(), captureLearning(), learningDigest(), recordLearningOpportunity(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT (+18 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.16
Nodes (25): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence(), CaptureContext (+17 more)

### Community 43 - ".save"
Cohesion: 0.09
Nodes (56): enumerateIntakeList(), inPickupOrder(), Intake, text(), resolveBlockedTransition(), document(), transitionWithComment(), jiraAccount() (+48 more)

### Community 44 - "Offices"
Cohesion: 0.08
Nodes (8): QuestionNotifications, CommittedBrain, file, project, root, InFlightOperations, projectById(), Offices

### Community 45 - "harness-baseline.ts"
Cohesion: 0.15
Nodes (22): BaselineReport, baselineReport(), BaselineSource, baselineText(), millions(), row(), share(), add() (+14 more)

### Community 46 - "OfficeScene.tsx"
Cohesion: 0.17
Nodes (32): Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk(), ElevatorStage() (+24 more)

### Community 47 - "cec.ts"
Cohesion: 0.08
Nodes (40): cecPrompt(), resolvedDecisionNote(), stageInstructions, stageInstructionsFor(), REVIEW_FINDINGS_RULE, latestQA(), notPassedInLatestQA(), QACoverage (+32 more)

### Community 48 - "kill-switch.ts"
Cohesion: 0.13
Nodes (29): guardPresent(), overseerCommand(), resolveCliRoot(), runnerStatus(), bounded(), ControlRead, Halt, Pause (+21 more)

### Community 49 - "shared.ts"
Cohesion: 0.05
Nodes (77): applyIntakeObservation(), parksInJira(), GATE_REFUSED, gateRefusedPass(), QA_STAGES, refusedQA(), refusedQABlocker(), Carried (+69 more)

### Community 50 - "FeatureWorkspace.tsx"
Cohesion: 0.11
Nodes (28): FeatureQuestionProjection, OutboxQuestionRound(), send(), FeatureDelivery(), FeatureDocuments(), views, FeatureReading(), FeatureWorkspace() (+20 more)

### Community 51 - "coordination.ts"
Cohesion: 0.16
Nodes (17): completeNativeCheckpoint(), BrainStatusSchema, identity, queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation() (+9 more)

### Community 52 - "local-config.ts"
Cohesion: 0.12
Nodes (33): escaped(), projectListScope(), AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), goalEvidencePath(), azureSchema, deploymentSchema, jiraSchema (+25 more)

### Community 53 - "control-store.ts"
Cohesion: 0.06
Nodes (38): systemClock, applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, readSavedState(), LARGE_KEY_CHARS, plain() (+30 more)

### Community 54 - "jiraBinding"
Cohesion: 0.11
Nodes (24): Assignment, contentSchema(), JiraIssuePublisher, jiraText(), Transition, jiraRecord(), unpack(), descriptionPreimage() (+16 more)

### Community 55 - "publish-refresh.cjs"
Cohesion: 0.14
Nodes (18): changedPaths(), { execFileSync }, files, isMapInput(), mapOnly(), { execFileSync }, git(), publish() (+10 more)

### Community 56 - "offices.ts"
Cohesion: 0.08
Nodes (49): commandFeature(), reviewQuestions(), confirmBrief(), FeaturePlanningBindings, assertQuestionVisibility(), applyHarnessAction(), HarnessActionInput, recoveryPreconditions() (+41 more)

### Community 57 - "deploy.ts"
Cohesion: 0.12
Nodes (37): abandon(), advance(), Commit, DEPLOY_STEPS, DeployFacts, DeployStatus, Digest, RollbackFacts (+29 more)

### Community 58 - "ref_node_path"
Cohesion: 0.07
Nodes (52): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+44 more)

### Community 59 - "time-readback.ts"
Cohesion: 0.22
Nodes (9): Ledger, Read, TimeLedger, dueReadback(), missedSinceVerified(), Readback, READBACK_INTERVAL_MS, readBackTime() (+1 more)

### Community 60 - "cost-ledger.ts"
Cohesion: 0.14
Nodes (30): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress(), effectId() (+22 more)

### Community 61 - "unsent-time.ts"
Cohesion: 0.29
Nodes (10): publishableEntry(), settlementPending(), superseded(), ticketUnresolved(), dueUnsent(), releaseUnsent(), UNSENT_RETRY_MAX_MS, UNSENT_RETRY_MS (+2 more)

### Community 62 - "maintenance/maintenance.ts"
Cohesion: 0.08
Nodes (39): maintenancePolicies(), captureMaintenanceStep(), accessibilitySources(), reconcileSourceScan(), sourceFindings, sourceReview(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance (+31 more)

### Community 63 - "MapView.tsx"
Cohesion: 0.06
Nodes (59): KnowledgeActivity, KnowledgeActivityPage, KnowledgeEdge, KnowledgeMap, KnowledgeNode, ChatMarkdown(), ChatMarkdown, MessageText() (+51 more)

### Community 64 - "judge-resumes.ts"
Cohesion: 0.06
Nodes (53): inHistoryOf(), CompareMemory, compareMemory(), COMPARES_PER_PASS, comparison(), DeployedFixes, DeployedFixesInput, recordDeployedFixes() (+45 more)

### Community 65 - "validate_pr_body.cjs"
Cohesion: 0.36
Nodes (8): fs, main(), readableText(), REQUIRED_CHECKS, REQUIRED_SECTIONS, sections(), validatePullRequestBody(), withoutComments()

### Community 66 - "audit-plan-candidates.cjs"
Cohesion: 0.14
Nodes (31): audit(), branchIssueNumbers(), classify(), distinctiveTitleWords(), { execFileSync }, extractPaths(), findPrForMergeSubject(), fmtCommit() (+23 more)

### Community 67 - "office-client.ts"
Cohesion: 0.12
Nodes (23): DEFAULT_OFFICE_URL, LOOPBACK, officeUrl(), RUNNER_DEFAULTS, RunnerLimits, RunnerPaths, officeDataRoot, realMachine() (+15 more)

### Community 68 - "resume-arrivals.ts"
Cohesion: 0.11
Nodes (64): WRITER_STAGES, DeliveryAuthorityInput, canonical(), assessResumes(), Standing, CheckpointEligibility, checkpointEligibility(), admitAssignmentResume() (+56 more)

### Community 69 - "ticket-evidence.ts"
Cohesion: 0.12
Nodes (28): assetDownloader(), attachmentKind(), evidenceDirectory(), readEvidence(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS (+20 more)

### Community 70 - "constellation-runtime.ts"
Cohesion: 0.15
Nodes (16): CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point, focusOverlayMotion(), FocusOverlayLayout (+8 more)

### Community 71 - "setup-stop-cap.ts"
Cohesion: 0.09
Nodes (34): readbackDispatchGuidance(), currentEnvironmentWait(), environmentWait(), waitText(), capacityInterruptedRun(), providerSaid(), rerunsInterruptedQA(), officeRefusedQA() (+26 more)

### Community 72 - "session-context-file.ts"
Cohesion: 0.27
Nodes (12): ContextFoldPrefix, contextFoldPrefix(), SessionContextCheckpoint, captureSessionContextClone(), sessionContextFile(), ContextReadChanged, MAX_CONTEXT_READ_MS, sameContextFile() (+4 more)

### Community 73 - "assignments.ts"
Cohesion: 0.08
Nodes (36): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, GraphNode (+28 more)

### Community 74 - "session-scope.ts"
Cohesion: 0.20
Nodes (16): Bound, claudeScopeParser(), claudeSessionScope(), CODEX_ROLLOUTS, contextReaders(), retainSessionMessage(), SessionConversation, escaped() (+8 more)

### Community 75 - "service-health.ts"
Cohesion: 0.08
Nodes (34): failed(), githubAuthError(), refusedByRateLimit(), revalidated, slurpedPages(), succeeded(), commands(), SIGN_IN_SERVICE_TROUBLE (+26 more)

### Community 76 - "azure.ts"
Cohesion: 0.14
Nodes (24): az(), AzureMonitor, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs(), fullActivePRs() (+16 more)

### Community 77 - "it-report.ts"
Cohesion: 0.27
Nodes (10): followUpPicture(), publishITReport(), archiveOldReports(), RETAINED_REPORTS, archiveByMonth(), archiveHistory(), archiveMonth(), archiveOldTaskDetail() (+2 more)

### Community 78 - "incidents.ts"
Cohesion: 0.06
Nodes (65): attributedRecords(), foldsItsRun(), groupCandidates(), ObservedIncident, ObservedSubject, digest(), fingerprint(), incidentId() (+57 more)

### Community 79 - "goal-reporting.ts"
Cohesion: 0.10
Nodes (30): GitHubMonitor, githubPRDescription(), collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip() (+22 more)

### Community 80 - "session-bridge.ts"
Cohesion: 0.14
Nodes (21): codexDaemonProcesses(), accountCodexProcesses(), CodexProcessInventory, codexProcessInventory(), unaccountedProcesses(), codexThreadMetadata(), METADATA_CHUNK, BARE (+13 more)

### Community 82 - "release-unpark.ts"
Cohesion: 0.36
Nodes (6): MAX_RELEASE_UNPARKS, RELEASE_CHECK_MS, returnToPickup(), compare(), highestStableAtLeast(), parts()

### Community 83 - "alert-issue.ts"
Cohesion: 0.15
Nodes (23): readBackOrThrow(), retryRead(), AlertIssue, alertIssueBody(), alertIssueTitle(), alertMarker(), closeAlertIssue(), ensureAlertIssue() (+15 more)

### Community 84 - "viewer.js"
Cohesion: 0.19
Nodes (25): addMetaLink(), addMetaRow(), addRelationship(), applyView(), buildIndexes(), buildLegend(), buildModel(), buildRenderer() (+17 more)

### Community 85 - "weekly-rollup.ts"
Cohesion: 0.14
Nodes (26): learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), BRAIN_SCOPE (+18 more)

### Community 86 - "stopped-record.ts"
Cohesion: 0.08
Nodes (53): capabilityBlockedReviews(), latestReviews(), boundedEvidence(), expectedWait(), StopFacts, normalizeCause(), IncidentCollector, improvements() (+45 more)

### Community 87 - "sanitize"
Cohesion: 0.07
Nodes (35): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+27 more)

### Community 88 - "conversations/slack.ts"
Cohesion: 0.17
Nodes (11): channelNoticeAuthorized(), comparableSlackText(), labelIsUrl(), SlackMessages, SlackResultSchema, SlackVerificationSchema, goalNoticeAuthorized(), sendGoalNotice() (+3 more)

### Community 89 - "spawn-command.ts"
Cohesion: 0.19
Nodes (13): exitFailure(), inactivityWatch(), probeProcessGroup(), GIT_NETWORK, LIVE_PROVIDERS, liveReach(), networkUrl(), remoteUrls() (+5 more)

### Community 90 - "provider-observation.ts"
Cohesion: 0.13
Nodes (25): correlatedBuild(), Azure, azurePipelines(), outcome(), Read, RUNS_PER_PIPELINE, Api, githubWorkflows() (+17 more)

### Community 91 - "readable-jira-comment.ts"
Cohesion: 0.14
Nodes (24): CommentPage, commentReadback(), devUpdate(), HEADLINE, postDevUpdate(), OUTCOME, qaComment(), remote() (+16 more)

### Community 92 - "session-context-client.ts"
Cohesion: 0.14
Nodes (15): packContextFailure(), PackedContextFailure, unpackContextFailure(), ContextThread, contextThread(), postedProjects(), THREAD_ANSWER_MS, THREAD_STOPPED (+7 more)

### Community 93 - "plans.cjs"
Cohesion: 0.19
Nodes (19): remoteSlug(), walk(), association(), auditedDigests(), candidate(), collapseByTitle(), discover(), fromMarkdown() (+11 more)

### Community 94 - "useLiveTiming.ts"
Cohesion: 0.16
Nodes (19): LiveAnchor, LiveAgentTask(), Props, RunningTask(), text(), Agent, AzureBuild, lastWall (+11 more)

### Community 96 - "sign-in-unpark.ts"
Cohesion: 0.18
Nodes (19): hasPendingDelivery(), resumeAfterSignIn(), signInWait(), MAX_SIGN_IN_UNPARKS, unparkSignedIn(), waitingStep(), BrowserPage, browserPages() (+11 more)

### Community 97 - "copy.ts"
Cohesion: 0.19
Nodes (14): nativeGitRead(), savedImplementation(), sha(), sourceFiles(), ContinuationIO, nativeIO, absent(), candidateParent() (+6 more)

### Community 98 - "Ticket"
Cohesion: 0.06
Nodes (51): candidateBranchMoved(), carriedNotRepeated(), applyChangeScope(), endChangeScope(), levels(), MAX_CHECKS, changeScopeNote(), Scoped (+43 more)

### Community 99 - "archive-plan.cjs"
Cohesion: 0.12
Nodes (33): fs, main(), parse(), path, archive(), cell(), ensureIndex(), fromArgs() (+25 more)

### Community 100 - ".emit"
Cohesion: 0.11
Nodes (35): assertOwnership(), decideImplementation(), consumeQAPlanRetry(), requestQAPlanRetry(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice() (+27 more)

### Community 101 - "store.ts"
Cohesion: 0.06
Nodes (62): GitRead, patchArgs, sourceCopyMatches(), ImplementationDecision, OwnershipRead, interruptedImplementation(), verifyContinuationPreservation(), closedReadonlyPlan() (+54 more)

### Community 102 - "coordination-pump.ts"
Cohesion: 0.08
Nodes (31): MergeNotifications, reconcileNoticeConfirmations(), ATTEMPT_DELAYS_MS, compatible(), dependencyCompletionKey(), issueKey(), observePrerequisites(), PrerequisiteSchema (+23 more)

### Community 103 - "on-merge-sync.cjs"
Cohesion: 0.14
Nodes (27): fs, main(), path, { spawnSync }, fieldSpan(), frontmatterProblems(), keyPattern(), list() (+19 more)

### Community 104 - "backup-stores.ts"
Cohesion: 0.10
Nodes (36): absentAdmission(), AdmissionComparison, AdmissionSnapshot, compareAdmissions(), snapshotAdmissions(), BackupEntry, BackupInput, BackupInventory (+28 more)

### Community 105 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 106 - "ref_zod"
Cohesion: 0.08
Nodes (45): runningRevision(), runningRevision(), releaseIdentity(), runtimeRevision(), ActiveRelease, readActiveRelease(), BUILD_ENV, buildRelease() (+37 more)

### Community 107 - "work.ts"
Cohesion: 0.08
Nodes (35): admitRepairWaits(), COVERING, expiryEvent(), expiryId(), lastProgress(), progressOf(), RepairWaitEntry, RepairWaitPass (+27 more)

### Community 108 - "DeploymentFence"
Cohesion: 0.38
Nodes (3): assertToken(), DeploymentFence, DeploymentFenceRouteContext

### Community 109 - "contract.ts"
Cohesion: 0.23
Nodes (12): At, Errno, errno(), GroupInventory, GroupProbe, LifecycleDiagnostic, Phase, Pid (+4 more)

### Community 110 - "blocker-followups.ts"
Cohesion: 0.10
Nodes (50): conversationReadbackReady(), followupOf(), pendingReadback(), queueConversationReadback(), readbackEnding(), replacedReadback(), uncertainConversations(), readBackConversations() (+42 more)

### Community 111 - "report.ts"
Cohesion: 0.22
Nodes (15): TelemetryRow, TelemetrySync, Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount() (+7 more)

### Community 112 - "outbox.ts"
Cohesion: 0.09
Nodes (31): ctoInputIdentityMatches(), ctoInputRecovered(), metadataParkAction(), ADOPTION_STALLED_MS, conversationResolved(), projectOutbox(), item(), syncOutbox() (+23 more)

### Community 113 - "process.ts"
Cohesion: 0.08
Nodes (25): verifyFeatureEnhance(), GitHubFeaturePublisher, JiraFeaturePublisher, FixIdentity, PULL, OFFICE_REPOSITORY, readGitHub(), Result (+17 more)

### Community 114 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 115 - "telemetry.ts"
Cohesion: 0.10
Nodes (26): CodexRollout, CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL (+18 more)

### Community 119 - "GitHubIssuePublisher"
Cohesion: 0.18
Nodes (7): FeaturePublisher, PublicationReceipt, GitHubIssuePublisher, number(), same(), FeatureManifestItem, FeatureOperation

### Community 120 - "Goals.tsx"
Cohesion: 0.09
Nodes (33): ctoInputFailure(), OutboxCTOInput(), recover(), OutboxSavedImplementation(), apply(), review(), OutboxSavedPlan(), reconcile() (+25 more)

### Community 121 - "project-bindings-config.ts"
Cohesion: 0.15
Nodes (22): awaitingJiraStatus(), awaitingProduction(), FOLLOW_DAYS, followed(), isFollowed(), Azure, AzureRead, containedIn() (+14 more)

### Community 122 - "resume-control.ts"
Cohesion: 0.24
Nodes (9): ResumeArrivalsInput, absent(), NEVER_ENABLED, ResumeControl, stated(), Stored, unreadable(), IncidentsRouteContext (+1 more)

### Community 123 - "createConstellation"
Cohesion: 0.18
Nodes (5): ConstellationRuntime, createConstellation(), enter(), finishTap(), move()

### Community 124 - "refresh-issue-state.cjs"
Cohesion: 0.23
Nodes (12): advanceFence(), key(), { execFileSync }, fs, issueRefs(), main(), markClosed(), openThreadLineIndexes() (+4 more)

### Community 125 - "office-lessons.ts"
Cohesion: 0.06
Nodes (36): normalizeStatement(), LessonBrainAudit, LessonBrainOverlap, decideOfficeProposal(), mirrorOfficeKnowledge(), OfficeKnowledgeStore, proposeOfficeLessons(), retireOfficeLesson() (+28 more)

### Community 126 - "delivery-recoveries.ts"
Cohesion: 0.05
Nodes (67): nextAttemptAt(), restartStoppedWriters(), unchangedSinceAccepted(), NOT_RETRYABLE, releaseFunds(), StoppedWriter, stoppedWriter(), WriterRestartCandidate (+59 more)

### Community 127 - "lesson-issue-ready.ts"
Cohesion: 0.26
Nodes (13): assignedToJoe(), fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), firstLane(), instruction(), LaneMove, move() (+5 more)

### Community 128 - "node-visuals.ts"
Cohesion: 0.18
Nodes (16): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), ConstellationView, DisplayNode, LabelRectangle (+8 more)

### Community 129 - "call-ledger.ts"
Cohesion: 0.25
Nodes (10): add(), addSource(), busiest(), CallLedger, Entry, sourceRows(), Sources, CallCounts (+2 more)

### Community 130 - "pre-push-boundary.ts"
Cohesion: 0.26
Nodes (10): Event, exactCommand(), Invocation, localHookCommand(), one(), prePushRejection(), PushIdentity, retirementBoundary() (+2 more)

### Community 131 - "it-specialist.ts"
Cohesion: 0.14
Nodes (23): partialLocalCleanupKey(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), heldFor(), ITContext, recoveryHeld() (+15 more)

### Community 132 - "diagnostic-snapshot.ts"
Cohesion: 0.34
Nodes (8): assignmentDiagnostics(), diagnosticContext(), diagnosticSnapshot(), nativeDeliveryResolved(), itAgent(), itDiagnostics(), followUpStatus(), outstandingFollowUps()

### Community 133 - "run-accounting.ts"
Cohesion: 0.11
Nodes (34): BoundedRead, done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf(), backfillClaudeCost(), CompletionReader (+26 more)

### Community 134 - "follow-up-alerts.ts"
Cohesion: 0.21
Nodes (13): checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), repeatedVendorReviewBlock(), stoppedInVendorReview(), leftToNextRun(), NEXT_RUN_DUE_MS, night() (+5 more)

### Community 135 - "controller-runtime.ts"
Cohesion: 0.08
Nodes (33): [cmd,...rawArgs], projectData(), StoreDatabase, ControllerEffects, controllerEffects(), DEPLOY_PROJECT, alive(), ControllerMachine (+25 more)

### Community 136 - "assignment-poll.ts"
Cohesion: 0.12
Nodes (21): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), admitReadyCards(), confirmedGone(), goneQuery(), STOPPED, stoppedReviewKeys() (+13 more)

### Community 137 - ".getEffect"
Cohesion: 0.14
Nodes (19): dispatchedMetadataEffect(), GitHubOperations, actionable(), closingPull(), Finding, handoffIssue(), issueLines(), issueSource() (+11 more)

### Community 138 - "run.ts"
Cohesion: 0.13
Nodes (22): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_FIX_PROMPT, OfficeFixResult (+14 more)

### Community 139 - "featureById"
Cohesion: 0.15
Nodes (11): featureById(), Link, linkFeature(), publishFeature(), reconcilePublication(), uncertainPublications(), reserveIdentity(), FeatureReviewRunner (+3 more)

### Community 140 - "session-snapshot-cleanup.ts"
Cohesion: 0.40
Nodes (5): SNAPSHOT_PREFIX, removeStaleSessionSnapshots(), SNAPSHOT_SWEEP_MS, STALE_SNAPSHOT_MS, sweepStaleSessionSnapshots()

### Community 141 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 142 - "Store"
Cohesion: 0.07
Nodes (23): Clock, PROJECT_LOCAL, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch() (+15 more)

### Community 144 - "reconcile-merges.cjs"
Cohesion: 0.22
Nodes (14): collectPulls(), copyWikiForDryRun(), { execFileSync }, flattenPages(), fs, githubRequest(), isWikiBotPull(), main() (+6 more)

### Community 145 - "preferences-store.ts"
Cohesion: 0.21
Nodes (8): PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS, OfficePreferences

### Community 146 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (7): CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility, overlayEntranceDelays(), SceneOverlay()

### Community 147 - "metadata-park-words.ts"
Cohesion: 0.42
Nodes (9): field(), FIELDS, MetadataField, metadataFields(), metadataParkWords(), metadataStopWords(), needed(), sentence() (+1 more)

### Community 148 - "ref_node_child_process"
Cohesion: 0.15
Nodes (9): file, folder, logs, root, { execFileSync }, hasCanonicalWikiBody(), maintenanceBodies, matchesMaintenanceBody() (+1 more)

### Community 149 - "harnessEffect"
Cohesion: 0.15
Nodes (37): BLOCK, harnessBlockMove(), harnessParkedCard(), noted(), effectKey(), LaneOperation, laneWrite(), moveCardOnce() (+29 more)

### Community 150 - "common.cjs"
Cohesion: 0.11
Nodes (24): fs, main(), parse(), path, atomicWrite(), crypto, { execFileSync }, fs (+16 more)

### Community 151 - "QAResultsCard.tsx"
Cohesion: 0.42
Nodes (6): qaResultChanges(), QA_STAGES, qaResults(), qaStatus(), artifact(), Report()

### Community 152 - "SessionBridge"
Cohesion: 0.19
Nodes (10): DesktopSessions, claudeSessions(), LiveSession, SessionBridge, completeSessionCoverage(), desktopCoverageGap(), knownActivity(), Report (+2 more)

### Community 153 - "qa-plan-retry.ts"
Cohesion: 0.67
Nodes (3): QAPlanRetry, QAPlanRetryProof, QAPlanRetryRequest

### Community 154 - "resume-outcome.ts"
Cohesion: 0.09
Nodes (32): FLAGS, incidentCommand(), IncidentCommandIO, option(), USAGE, whole(), boundaryCrossed(), Crossing (+24 more)

### Community 155 - "runner-root.ts"
Cohesion: 0.31
Nodes (12): privateDirectories(), runnerPaths(), ancestry(), assertDirectoryOrAbsent(), CHECKOUT, code(), MARKERS, physicalPath() (+4 more)

### Community 156 - "connectWith"
Cohesion: 0.38
Nodes (5): connectWith(), data(), envelope(), JiraWorklogs, WorklogSave

### Community 161 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 162 - "claude-session-context.ts"
Cohesion: 0.22
Nodes (6): claudeSessionContext(), readTranscript, codexSessionContext(), readRollout, ContextReader, CLAUDE_TRANSCRIPTS

### Community 163 - "interrupted-work-recovery.ts"
Cohesion: 0.25
Nodes (10): currentOutbox(), interruptAdoptions(), legacy(), REMOVED_FIELDS, retireLegacyRecovery(), goalNoticeNeverDispatched(), maintenanceNoticeNeverDispatched(), checkpointOutcome() (+2 more)

### Community 164 - "delivery-ownership.ts"
Cohesion: 0.33
Nodes (4): Ownership, ownershipContext, refreshDeliveryOwnership(), RefreshOwnership

### Community 165 - "restoreInPlace"
Cohesion: 0.60
Nodes (5): identity(), Json, plain(), restorable(), restoreInPlace()

### Community 166 - "ITFollowUps.tsx"
Cohesion: 0.67
Nodes (4): itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps()

### Community 167 - "bounded-session-refresh.ts"
Cohesion: 0.50
Nodes (4): refreshUntilComplete(), refreshWithin(), SESSION_COMPLETE_WAIT, SESSION_READ_WAIT

### Community 168 - "run-evidence.ts"
Cohesion: 0.67
Nodes (3): comparable(), EvidenceOutcome, recordRunEvidence()

## Knowledge Gaps
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `worker-runtime.ts`, `features/workflow.ts`, `daily-cto.ts`, `GitHubDelivery`, `holdReason`, `ref_node_crypto`, `OfficeSnapshot`, `admit-improvement.ts`, `advance-metadata-park.ts`, `scheduled-captures.ts`, `run-retrospective.ts`, `record-trigger.ts`, `artifact`, `dependency-bots/adopt.ts`, `retrospective-subject.ts`, `jira-time.ts`, `agents.ts`, `owner-merged-stopped.ts`, `github-delivery.ts`, `ref_node_util`, `enrollment-gate.ts`, `index.ts`, `remove-candidate.ts`, `scheduled-work.ts`, `knowledge.ts`, `lesson-selection.ts`, `time-scope.ts`, `Engine`, `.save`, `Offices`, `cec.ts`, `shared.ts`, `coordination.ts`, `control-store.ts`, `jiraBinding`, `offices.ts`, `ref_node_path`, `time-readback.ts`, `cost-ledger.ts`, `unsent-time.ts`, `maintenance/maintenance.ts`, `judge-resumes.ts`, `resume-arrivals.ts`, `ticket-evidence.ts`, `setup-stop-cap.ts`, `assignments.ts`, `azure.ts`, `incidents.ts`, `goal-reporting.ts`, `session-bridge.ts`, `release-unpark.ts`, `alert-issue.ts`, `weekly-rollup.ts`, `sanitize`, `conversations/slack.ts`, `provider-observation.ts`, `readable-jira-comment.ts`, `sign-in-unpark.ts`, `copy.ts`, `Ticket`, `.emit`, `store.ts`, `coordination-pump.ts`, `work.ts`, `blocker-followups.ts`, `outbox.ts`, `process.ts`, `GitHubIssuePublisher`, `project-bindings-config.ts`, `office-lessons.ts`, `delivery-recoveries.ts`, `lesson-issue-ready.ts`, `it-specialist.ts`, `diagnostic-snapshot.ts`, `run-accounting.ts`, `controller-runtime.ts`, `.getEffect`, `run.ts`, `featureById`, `harnessEffect`, `SessionBridge`, `ProjectProgress`, `interrupted-work-recovery.ts`, `run-evidence.ts`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **Should `incidents/routes.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06436487638533675 - nodes in this community are weakly interconnected._
- **Why does `Engine` connect `Engine` to `GitHubDelivery`, `holdReason`, `featureById`, `scheduled-captures.ts`, `artifact`, `agents.ts`, `github-delivery.ts`, `scheduled-work.ts`, `Offices`, `shared.ts`, `coordination.ts`, `offices.ts`, `maintenance/maintenance.ts`, `resume-arrivals.ts`, `azure.ts`, `goal-reporting.ts`, `sanitize`, `conversations/slack.ts`, `provider-observation.ts`, `copy.ts`, `Ticket`, `.emit`, `store.ts`, `coordination-pump.ts`, `process.ts`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Should `OrgChart.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11655874190564293 - nodes in this community are weakly interconnected._
- **Why does `command()` connect `process.ts` to `incidents/routes.ts`, `worker-runtime.ts`, `features/workflow.ts`, `GitHubDelivery`, `holdReason`, `.getEffect`, `ref_node_crypto`, `featureById`, `controller-runtime.ts`, `admit-improvement.ts`, `Store`, `deploy-command.ts`, `artifact`, `harnessEffect`, `jira-time.ts`, `SessionBridge`, `agents.ts`, `github-delivery.ts`, `ProjectProgress`, `ref_node_util`, `connectWith`, `remove-candidate.ts`, `call-scope.ts`, `Engine`, `.save`, `shared.ts`, `coordination.ts`, `jiraBinding`, `ref_node_path`, `time-readback.ts`, `cost-ledger.ts`, `maintenance/maintenance.ts`, `judge-resumes.ts`, `ticket-evidence.ts`, `assignments.ts`, `service-health.ts`, `azure.ts`, `goal-reporting.ts`, `session-bridge.ts`, `alert-issue.ts`, `weekly-rollup.ts`, `provider-observation.ts`, `readable-jira-comment.ts`, `copy.ts`, `Ticket`, `.emit`, `store.ts`, `coordination-pump.ts`, `ref_zod`, `GitHubIssuePublisher`, `resume-control.ts`, `delivery-recoveries.ts`, `lesson-issue-ready.ts`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Should `worker-runtime.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07058001397624039 - nodes in this community are weakly interconnected._
- **Should `features/workflow.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09370199692780339 - nodes in this community are weakly interconnected._