# Graph Report - the-office  (2026-11-18)

## Corpus Check
- 891 files · ~350,153 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4354 nodes · 20012 edges · 124 communities (116 shown, 8 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 683 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5fc6f8fc`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- retrospective-subject.ts
- OrgChart.tsx
- intent.ts
- ref_node_crypto
- Inspector.tsx
- ControlStore
- session-bridge.ts
- ref_react
- continue-ownership-read.ts
- github-delivery.ts
- agents.ts
- run.ts
- App.tsx
- OfficeSnapshot
- knowledge/routes.ts
- scheduled-captures.ts
- run-retrospective.ts
- record-trigger.ts
- shortSummary
- GitHubDelivery
- holdReason
- harnessEffect
- QuestionStepper.tsx
- jira-time.ts
- projects.ts
- maintenance/maintenance.ts
- cost-ledger.ts
- TicketJob
- office-lessons.ts
- ref_zod
- metadata-assessment.ts
- work-summary.ts
- project-bindings.ts
- ref_node_path
- it-specialist.ts
- cec/issue-publication.ts
- scheduled-work.ts
- Offices
- github/issue-publication.ts
- notifications.ts
- GitHubDelivery
- time-scope.ts
- TicketJob
- knowledge.ts
- features/workflow.ts
- harness-baseline.ts
- OfficeScene.tsx
- ProjectProgress
- engine.ts
- session-context-file.ts
- scheduler.ts
- shared.ts
- .emit
- harnessEffect
- maintenance/maintenance.ts
- index.tsx
- cec-reads.ts
- .getEffect
- .getEffect
- project-bindings-config.ts
- daily-cto.ts
- blocker-followups.ts
- run.ts
- createConstellation
- jira-attempts.ts
- office-lessons.ts
- remove-candidate.ts
- coordination.ts
- goal-reporting.ts
- ticket-evidence.ts
- constellation-runtime.ts
- shared.ts
- work.ts
- report.ts
- cli.ts
- useOfficePreferences.ts
- evidence-artifacts.ts
- owned-artifact.ts
- brain-maintenance.ts
- setup-stop-cap.ts
- tracking-issue.ts
- digest
- create-candidate.ts
- features.ts
- merge-scanner-retry.ts
- accept-stage-result.ts
- Goals.tsx
- sanitize
- index.tsx
- contract.ts
- DailyCTO.tsx
- readable-jira-comment.ts
- cec/workflow.ts
- assignment-poll.ts
- qa-plan-retry.ts
- capture-session-clone.py
- requests.ts
- Store
- .save
- coordination.ts
- ticket-stage-runner.ts
- MaintenanceRun
- codex-rollout.ts
- worker-runtime.ts
- Coordinator
- extract-worker.mjs
- CommittedBrain
- merge-ceiling.ts
- SceneOverlay.tsx
- run-accounting.ts
- packed-consumer-pnpm.ts
- FeatureWorkflow
- admit-improvement.ts
- slack-supersession.ts
- blocker-followups.ts
- qa.ts
- qa-plan-continuation.ts
- writer-restart.ts
- packed-consumer-pnpm.ts
- install-service.mjs
- telemetry.ts
- unblock-brief.ts
- restoreInPlace
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
9. `currentAssignment()` - 88 edges
10. `OfficeSnapshot` - 88 edges

## Surprising Connections (you probably didn't know these)
- `apply()` --indirect_call--> `note()`  [INFERRED]
  src/conversations/OutboxSavedImplementation.tsx → server/cec/parking/resume-parked.ts
- `UnrecordedResult` --references--> `StageResult`  [EXTRACTED]
  server/cec/unrecorded-result.ts → src/shared.ts
- `LessonBrainOverlap` --references--> `Lesson`  [EXTRACTED]
  server/knowledge/lesson-brain-audit.ts → src/contracts/knowledge.ts
- `DeliverySlot` --references--> `Role`  [EXTRACTED]
  server/office/projects.ts → src/shared.ts
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
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-guard.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`

## Communities (124 total, 8 thin omitted)

### Community 0 - "retrospective-subject.ts"
Cohesion: 0.15
Nodes (19): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, maintenanceKey(), azurePrUrl(), findSubject(), jobSubject() (+11 more)

### Community 1 - "OrgChart.tsx"
Cohesion: 0.11
Nodes (40): label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+32 more)

### Community 2 - "intent.ts"
Cohesion: 0.11
Nodes (26): GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles(), ContinuationIO (+18 more)

### Community 3 - "ref_node_crypto"
Cohesion: 0.15
Nodes (27): featureItemComplete(), reconcileFeatureCompletion(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS, reserveReplacement(), stageBudget(), classifyFeatureFailure() (+19 more)

### Community 4 - "Inspector.tsx"
Cohesion: 0.11
Nodes (62): DailyCTOSummary, blockedSummary(), currentServices(), ServiceHealthPanel(), followUp(), labels, ServiceHealthRow(), BlockerFollowups() (+54 more)

### Community 5 - "ControlStore"
Cohesion: 0.14
Nodes (7): DailyCTO, EvidenceRequestConflict, dailyReviewPrompt(), Briefing, saveReviewBriefing(), ControlStore, DailyCTOReport

### Community 6 - "session-bridge.ts"
Cohesion: 0.13
Nodes (22): codexDaemonProcesses(), accountCodexProcesses(), CodexProcessInventory, codexProcessInventory(), DesktopSessions, unaccountedProcesses(), codexSessionContext(), idleExecServers() (+14 more)

### Community 7 - "ref_react"
Cohesion: 0.07
Nodes (61): KnowledgeActivity, KnowledgeActivityPage, KnowledgeEdge, KnowledgeMap, KnowledgeNode, Activity(), ActivityTimeline(), AssignmentKnowledge() (+53 more)

### Community 8 - "continue-ownership-read.ts"
Cohesion: 0.23
Nodes (14): continueOwnershipRead(), expiredOwnershipRead(), handoffOwnership(), ReadbackOwnerDecision, ownershipReadGate(), ownershipReadState(), ownershipReadSource(), ReadOwnershipCandidate (+6 more)

### Community 9 - "github-delivery.ts"
Cohesion: 0.05
Nodes (104): writerRestartInstruction(), harnessCloseout(), PASSING, verifyMergeActions(), findingsBlock(), assertDeliveryMayMutate(), runHarnessStage(), BOARD_RULE (+96 more)

### Community 10 - "agents.ts"
Cohesion: 0.05
Nodes (59): implementationWorkerContext(), escaped(), IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), intakeMembership(), projectListScope() (+51 more)

### Community 11 - "run.ts"
Cohesion: 0.20
Nodes (14): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, OFFICE_FIX_PROMPT, OfficeFixResult, validateOfficeFix(), investigationReady(), InvestigationOptions, InvestigationReport (+6 more)

### Community 12 - "App.tsx"
Cohesion: 0.06
Nodes (51): itAgent(), itDiagnostics(), BrainDrawer(), themeColor, App(), BrainWorkspace, CONNECTION, CONNECTION_DOT (+43 more)

### Community 13 - "OfficeSnapshot"
Cohesion: 0.07
Nodes (45): knowledgeOutbox(), Conversation(), LessonDecisionAction, lessonDecisionState(), readLessonDecision(), DAYS, dueLessonDecisions(), easternWeek() (+37 more)

### Community 14 - "knowledge/routes.ts"
Cohesion: 0.09
Nodes (36): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, GraphNode (+28 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.16
Nodes (42): createFeature(), assertEnrollable(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), CaptureRequest, captureRequest(), captureRequests() (+34 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.10
Nodes (41): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, BlockingTrigger, blockingTrigger(), isBlocking() (+33 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.11
Nodes (36): improvementIntakeGate(), learningDigest(), recordLearningOpportunity(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences(), clip() (+28 more)

### Community 18 - "shortSummary"
Cohesion: 0.08
Nodes (45): TelemetryReport, displayAgentTask(), githubStageLabels, withoutElapsed(), LiveAgentTask(), Props, RunningTask(), text() (+37 more)

### Community 19 - "GitHubDelivery"
Cohesion: 0.07
Nodes (41): GitHubDelivery, completedPRReviews(), Assessment, diagnosticProof(), discoveryRecoveryCandidate(), ownedArtifact(), Ownership, rawHash() (+33 more)

### Community 20 - "holdReason"
Cohesion: 0.07
Nodes (59): interruptedImplementation(), ATTEMPT_DELAYS_MS, nextAttemptAt(), restartStoppedWriters(), unchangedSinceAccepted(), NOT_RETRYABLE, WRITER_STAGES, WriterRestartCandidate (+51 more)

### Community 21 - "harnessEffect"
Cohesion: 0.19
Nodes (27): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), ProjectCard, projectCards(), projectGraphql() (+19 more)

### Community 22 - "QuestionStepper.tsx"
Cohesion: 0.22
Nodes (18): commandFeature(), reviewQuestions(), automaticIntakeWait(), confirmBrief(), FeaturePlanningBindings, assertQuestionVisibility(), applyHarnessAction(), HarnessActionInput (+10 more)

### Community 23 - "jira-time.ts"
Cohesion: 0.09
Nodes (39): twgProfile(), unresolvedAttempts(), bindingOf(), connectWith(), data(), envelope(), finishVerifiedEffects(), JiraWorklogs (+31 more)

### Community 24 - "projects.ts"
Cohesion: 0.07
Nodes (40): implementationPreview(), implementationContinuationRoute(), qaPlanRetryRoute(), close(), config, itSpecialist, loadedRevision, offices (+32 more)

### Community 25 - "maintenance/maintenance.ts"
Cohesion: 0.08
Nodes (37): maintenancePolicies(), captureLearning(), captureMaintenanceStep(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, brainResultStop(), capped() (+29 more)

### Community 26 - "cost-ledger.ts"
Cohesion: 0.13
Nodes (31): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress(), effectId() (+23 more)

### Community 27 - "TicketJob"
Cohesion: 0.08
Nodes (41): cecPrompt(), resolvedDecisionNote(), stageInstructions, stageInstructionsFor(), applies(), interruptedRunNote(), placeholder(), withoutInterruptedResult() (+33 more)

### Community 28 - "office-lessons.ts"
Cohesion: 0.08
Nodes (31): curateLesson(), Curation, CurationAction, mergeEvidence(), BRAIN_SCOPE, SUBJECT, Kind, RetrospectiveResult (+23 more)

### Community 29 - "ref_zod"
Cohesion: 0.07
Nodes (54): AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), goalEvidencePath(), azureSchema, deploymentSchema, jiraSchema, ownJiraSchema, promptSchema (+46 more)

### Community 30 - "metadata-assessment.ts"
Cohesion: 0.10
Nodes (55): activeEffectId(), assertDraftClaimHistory(), linkDraftIssue(), protectedOriginalClaim(), admitPRMetadata(), assessPRMetadata(), captureAssessment(), originalProposal() (+47 more)

### Community 31 - "work-summary.ts"
Cohesion: 0.18
Nodes (21): envelopeCard, deliveryRepairProjection(), ACTIVE, maintenanceUpdate(), PMQueueItem, pmQueueItems(), prerequisiteKeys(), projectRows() (+13 more)

### Community 32 - "project-bindings.ts"
Cohesion: 0.14
Nodes (26): az(), buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs(), fullActivePRs(), observation() (+18 more)

### Community 33 - "ref_node_path"
Cohesion: 0.06
Nodes (114): ownershipReadHistory(), MISSING_SAVED_PLAN, closeoutReceipt(), Candidate, assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership (+106 more)

### Community 34 - "it-specialist.ts"
Cohesion: 0.16
Nodes (18): partialLocalCleanupKey(), ITContext, informationalRecovery(), investigationCandidates(), investigationId(), investigationFollowUps(), syncInvestigations(), publishITReport() (+10 more)

### Community 35 - "cec/issue-publication.ts"
Cohesion: 0.19
Nodes (6): contentSchema(), JiraIssuePublisher, jiraText(), descriptionPreimage(), plain(), publicationDescription()

### Community 36 - "scheduled-work.ts"
Cohesion: 0.08
Nodes (39): freshOwnershipRead(), deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), Ownership, ownershipContext, refreshDeliveryOwnership(), RefreshOwnership (+31 more)

### Community 37 - "Offices"
Cohesion: 0.15
Nodes (5): QuestionNotifications, mirrorOfficeKnowledge(), Offices, claudeSessions(), SessionBridge

### Community 38 - "github/issue-publication.ts"
Cohesion: 0.20
Nodes (21): Execute, adoptDependabot(), closesIssue(), DEPENDABOT, dependabotPR(), inPickupLane(), openDependabotPulls(), readRepo() (+13 more)

### Community 39 - "notifications.ts"
Cohesion: 0.12
Nodes (23): lessonIssueBody(), lessonIssueMarker(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), LessonSelection (+15 more)

### Community 40 - "GitHubDelivery"
Cohesion: 0.06
Nodes (41): itChatPrompt(), helperTelemetry(), assignmentDiagnostics(), diagnosticContext(), diagnosticSnapshot(), leadershipContext(), knowledgeEntries(), knowledgeOfficeState() (+33 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.14
Nodes (27): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence(), CaptureContext (+19 more)

### Community 42 - "TicketJob"
Cohesion: 0.11
Nodes (35): Execute, installDependencies(), major(), removeAdoptedClone(), namedRepairIds(), HarnessControl, withHarnessWork(), Check (+27 more)

### Community 43 - "knowledge.ts"
Cohesion: 0.12
Nodes (22): clip(), DEMAND_LIMIT, demandFacts(), key(), LessonKey, notes(), clip(), MISSED_QUERY_LIMIT (+14 more)

### Community 44 - "features/workflow.ts"
Cohesion: 0.08
Nodes (54): approveFeature(), featureById(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), artifactPath(), digest() (+46 more)

### Community 45 - "harness-baseline.ts"
Cohesion: 0.15
Nodes (22): BaselineReport, baselineReport(), BaselineSource, baselineText(), millions(), row(), share(), add() (+14 more)

### Community 46 - "OfficeScene.tsx"
Cohesion: 0.17
Nodes (33): Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk(), ElevatorStage() (+25 more)

### Community 48 - "engine.ts"
Cohesion: 0.08
Nodes (14): AzureMonitor, correlatedBuild(), checkMail(), drainMail(), requestMail(), enableNightly(), ingest(), drainMaintenance() (+6 more)

### Community 49 - "session-context-file.ts"
Cohesion: 0.20
Nodes (14): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+6 more)

### Community 50 - "scheduler.ts"
Cohesion: 0.16
Nodes (13): ROLES, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch(), deliveryOccupied() (+5 more)

### Community 51 - "shared.ts"
Cohesion: 0.19
Nodes (9): PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS, OfficePreferences (+1 more)

### Community 52 - ".emit"
Cohesion: 0.18
Nodes (22): decideImplementation(), requestQAPlanRetry(), configureChannelNotices(), configureNotices(), retryRecipientLookup(), recoverCTOInput(), bindDiscoveryResume(), DiscoveryResumeInput (+14 more)

### Community 53 - "harnessEffect"
Cohesion: 0.26
Nodes (9): closedReadonlyPlan(), Document, document(), continueUnsealedQA(), entry(), entryExists(), inspectClosedQAPlan(), qaPlanEvidenceGap() (+1 more)

### Community 54 - "maintenance/maintenance.ts"
Cohesion: 0.54
Nodes (6): Document, document(), isAccessOnlyPlan(), settledAccessOnlyState(), continueAccessOnlyPlan(), entryExists()

### Community 55 - "index.tsx"
Cohesion: 0.15
Nodes (24): learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), RollupResult (+16 more)

### Community 56 - "cec-reads.ts"
Cohesion: 0.09
Nodes (41): normalizeRound(), FeatureApproval, FeatureAttempt, FeatureAuthority, FeatureDocument, FeatureHandoff, FeatureHarnessAction, FeatureHarnessOption (+33 more)

### Community 57 - ".getEffect"
Cohesion: 0.09
Nodes (30): channelNoticeAuthorized(), ChannelSettings, notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR, plainSlackText() (+22 more)

### Community 58 - ".getEffect"
Cohesion: 0.10
Nodes (20): Assignment, Transition, FeaturePublisher, PublicationReceipt, publishFeature(), reconcilePublication(), uncertainPublications(), reserveIdentity() (+12 more)

### Community 59 - "project-bindings-config.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 60 - "daily-cto.ts"
Cohesion: 0.08
Nodes (42): githubPRDescription(), collectCTOFacts(), evidenceRequestConflicts, boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip() (+34 more)

### Community 61 - "blocker-followups.ts"
Cohesion: 0.24
Nodes (13): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), admitReadyCards(), settleStoppedReviews() (+5 more)

### Community 62 - "run.ts"
Cohesion: 0.36
Nodes (3): CameraBookmark, restoreBookmark(), RoomCamera()

### Community 63 - "createConstellation"
Cohesion: 0.18
Nodes (5): ConstellationRuntime, createConstellation(), enter(), finishTap(), move()

### Community 64 - "jira-attempts.ts"
Cohesion: 0.13
Nodes (23): attempted(), attemptState(), bound(), covers(), JiraAttempt, jiraAttempts(), JiraAttemptState, open() (+15 more)

### Community 65 - "office-lessons.ts"
Cohesion: 0.14
Nodes (13): normalizeStatement(), decideOfficeProposal(), OfficeKnowledgeStore, proposeOfficeLessons(), retireOfficeLesson(), Input, promoteNoteLesson(), CONSOLIDATED (+5 more)

### Community 66 - "remove-candidate.ts"
Cohesion: 0.18
Nodes (18): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot() (+10 more)

### Community 67 - "coordination.ts"
Cohesion: 0.12
Nodes (43): dispatchNightly(), drainDelivery(), requestDelivery(), startPilot(), consumeQAPlanRetry(), OfficeQAHandoffInput, recoverSavedPlan(), eligibility() (+35 more)

### Community 68 - "goal-reporting.ts"
Cohesion: 0.20
Nodes (13): ContextFoldPrefix, contextFoldPrefix(), SessionContextCheckpoint, captureSessionContextClone(), ContextReadPhase, SessionContextDeadline, sessionContextFile(), ContextReadChanged (+5 more)

### Community 69 - "ticket-evidence.ts"
Cohesion: 0.15
Nodes (20): jiraRecord(), assetDownloader(), attachmentKind(), evidenceDirectory(), storeEvidence(), blankEvidence(), EVIDENCE_LIMITS, EvidenceReadContext (+12 more)

### Community 70 - "constellation-runtime.ts"
Cohesion: 0.15
Nodes (16): CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point, focusOverlayMotion(), FocusOverlayLayout (+8 more)

### Community 71 - "shared.ts"
Cohesion: 0.15
Nodes (20): claudeSessionContext(), readTranscript, root, claudeSessionScope(), readRollout, LiveSession, ContextProject, ContextReader (+12 more)

### Community 72 - "work.ts"
Cohesion: 0.12
Nodes (21): BLOCKED_CAUSES, blockedCauses(), projectReadiness(), explanation(), LABELS, stoppedReason(), ProjectReadiness, AssignmentResult (+13 more)

### Community 73 - "report.ts"
Cohesion: 0.29
Nodes (12): Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked(), row() (+4 more)

### Community 74 - "cli.ts"
Cohesion: 0.15
Nodes (8): args, [cmd,...rawArgs], commands, key, projectIndex, LessonBrainAudit, lessonBrainAudit(), LessonBrainOverlap

### Community 75 - "useOfficePreferences.ts"
Cohesion: 0.26
Nodes (10): acceptPreferences(), PreferenceCandidate, strip(), UNKNOWN_PREFERENCES, OfficePreferencesController, PreferenceFeedback, PreferenceField, requestPreferences() (+2 more)

### Community 76 - "evidence-artifacts.ts"
Cohesion: 0.19
Nodes (16): discoveryPrompt(), planPrompt(), readEvidence(), CoverageState, EvidenceAttachment, EvidenceSection, ProviderEvidence, canonical() (+8 more)

### Community 77 - "owned-artifact.ts"
Cohesion: 0.24
Nodes (13): investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_SOURCE_PATHS, officeSource(), done(), readBoundedNoFollow() (+5 more)

### Community 78 - "brain-maintenance.ts"
Cohesion: 0.18
Nodes (9): listenerHealth(), PROJECT_BINDINGS, providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks (+1 more)

### Community 79 - "setup-stop-cap.ts"
Cohesion: 0.60
Nodes (4): confirmSetupStopCap(), consecutiveSetupStops(), SETUP_STOP_CAP, setupStop()

### Community 80 - "tracking-issue.ts"
Cohesion: 0.19
Nodes (13): ensureTrackingIssue(), findTrackingIssue(), ownTracking(), TrackingIssue, trackingIssueBody(), trackingIssueTitle(), trackingMarker(), centralCompanionHandoff() (+5 more)

### Community 81 - "digest"
Cohesion: 0.06
Nodes (76): pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), recordJobApproach(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation() (+68 more)

### Community 82 - "create-candidate.ts"
Cohesion: 0.48
Nodes (6): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf()

### Community 83 - "features.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 84 - "merge-scanner-retry.ts"
Cohesion: 0.21
Nodes (15): HarnessEffect, harnessEffect(), readBackOrThrow(), retryRead(), linkedBody(), linkPR(), DependabotPR, editorMatches() (+7 more)

### Community 85 - "accept-stage-result.ts"
Cohesion: 0.14
Nodes (31): park(), acceptStageResult(), pendingPreparationCheck(), METADATA_FINDING, mergeAuthorized(), continuationReviewArtifacts(), reconcileContinuationReview(), savedNegativeContinuationReview() (+23 more)

### Community 86 - "Goals.tsx"
Cohesion: 0.09
Nodes (33): SendMessage, OutboxSavedImplementation(), apply(), review(), OutboxSavedPlan(), reconcile(), FeatureDelivery(), FeatureDocuments() (+25 more)

### Community 87 - "sanitize"
Cohesion: 0.06
Nodes (51): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+43 more)

### Community 88 - "index.tsx"
Cohesion: 0.13
Nodes (37): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS, PickupForm(), ProjectForms() (+29 more)

### Community 89 - "contract.ts"
Cohesion: 0.16
Nodes (16): Event, one(), prePushRejection(), PushIdentity, settledPushBoundary(), At, Errno, errno() (+8 more)

### Community 90 - "DailyCTO.tsx"
Cohesion: 0.32
Nodes (8): CTOReview(), goalState, DailyCTO(), reportDate(), reviewStatus, InlineText(), ReviewText(), LoadingMark()

### Community 91 - "readable-jira-comment.ts"
Cohesion: 0.11
Nodes (30): CommentPage, commentReadback(), devUpdate(), HEADLINE, JiraOperations, unpack(), parksInJira(), postDevUpdate() (+22 more)

### Community 92 - "cec/workflow.ts"
Cohesion: 0.15
Nodes (23): applyIntakeObservation(), containedFile(), Ownership, reconcileScopeRepairReadback(), scopeRepairRequestResolved(), assertScopeRepairResumeFindings(), certain(), effects() (+15 more)

### Community 93 - "assignment-poll.ts"
Cohesion: 0.20
Nodes (13): ctoInputIdentityMatches(), ctoInputRecovered(), acceptedCompletionResolution(), ctoReplacementResolution(), finishedSubjectResolution(), implementationReplacementResolution(), interruptedQARerunResolution(), investigationResolution() (+5 more)

### Community 94 - "qa-plan-retry.ts"
Cohesion: 0.67
Nodes (3): QAPlanRetry, QAPlanRetryProof, QAPlanRetryRequest

### Community 96 - "requests.ts"
Cohesion: 0.09
Nodes (37): DeliveryAuthorityInput, assertStoppedBaseAudit(), AuditRow, CoverageRow, Hash, Kind, stoppedBaseAuditMarker, Original (+29 more)

### Community 97 - "Store"
Cohesion: 0.05
Nodes (30): GitHubFeaturePublisher, JiraFeaturePublisher, GitHubMonitor, Result, Assessment, BrainStatusSchema, identity, brainCheckpointCompletion() (+22 more)

### Community 98 - ".save"
Cohesion: 0.09
Nodes (55): candidateBranchMoved(), resolveBlockedTransition(), document(), transitionWithComment(), jiraAccount(), jiraCollection(), JiraCredential, jiraCredential() (+47 more)

### Community 99 - "coordination.ts"
Cohesion: 0.09
Nodes (29): IntakeContext, dependencyCompletionKey(), DependencyStores, completeNativeCheckpoint(), BrainFollowup, queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance() (+21 more)

### Community 100 - "ticket-stage-runner.ts"
Cohesion: 0.08
Nodes (46): readbackDispatchGuidance(), capacityInterruptedRun(), providerSaid(), rerunsInterruptedQA(), CECReadbackSchema, READBACK_OWNER_SCOPE, Attempt, needsResumeReconciliation() (+38 more)

### Community 101 - "MaintenanceRun"
Cohesion: 0.29
Nodes (9): checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), repeatedVendorReviewBlock(), stoppedInVendorReview(), maintenanceSuperseded(), REOBSERVED, ReconciliationRequest (+1 more)

### Community 102 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 103 - "worker-runtime.ts"
Cohesion: 0.06
Nodes (43): savedStageCompletion(), candidateWorkspaceEnvironment(), assignmentSubject(), dispatchExposure(), catalogLine(), assertBriefingScope(), contextPacket(), OfficeCapacity (+35 more)

### Community 104 - "Coordinator"
Cohesion: 0.08
Nodes (4): SettleInputs, coordination(), Coordinator, AssignedIssue

### Community 105 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 107 - "merge-ceiling.ts"
Cohesion: 0.47
Nodes (4): approveMerge(), assertHarnessMayMerge(), HUMAN_MERGE, recheckPR()

### Community 108 - "SceneOverlay.tsx"
Cohesion: 0.67
Nodes (3): entranceDelayClasses, overlayEntranceDelays(), SceneOverlay()

### Community 109 - "run-accounting.ts"
Cohesion: 0.13
Nodes (26): BoundedRead, codexHome(), createdAt(), dayDirs(), header(), readCodexRollout(), ROLLOUT_MAX_BYTES, RolloutScan (+18 more)

### Community 113 - "admit-improvement.ts"
Cohesion: 0.21
Nodes (17): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+9 more)

### Community 114 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 115 - "blocker-followups.ts"
Cohesion: 0.23
Nodes (15): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved() (+7 more)

### Community 124 - "packed-consumer-pnpm.ts"
Cohesion: 0.60
Nodes (4): OfficeQAHandoff, OfficeQAHandoffInput, OfficeQAHandoffRequest, QAOwnershipProof

### Community 126 - "install-service.mjs"
Cohesion: 0.29
Nodes (4): file, folder, logs, root

### Community 128 - "telemetry.ts"
Cohesion: 0.09
Nodes (28): CodexRollout, CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL (+20 more)

### Community 129 - "unblock-brief.ts"
Cohesion: 0.53
Nodes (5): clearUnblockBrief(), key(), saveUnblockBrief(), UnblockBrief, unblockBrief()

### Community 130 - "restoreInPlace"
Cohesion: 0.60
Nodes (5): identity(), Json, plain(), restorable(), restoreInPlace()

### Community 132 - "highestStableAtLeast"
Cohesion: 0.83
Nodes (3): compare(), highestStableAtLeast(), parts()

## Knowledge Gaps
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `retrospective-subject.ts`, `intent.ts`, `ref_node_crypto`, `session-bridge.ts`, `continue-ownership-read.ts`, `github-delivery.ts`, `agents.ts`, `run.ts`, `knowledge/routes.ts`, `scheduled-captures.ts`, `run-retrospective.ts`, `record-trigger.ts`, `GitHubDelivery`, `holdReason`, `harnessEffect`, `QuestionStepper.tsx`, `jira-time.ts`, `projects.ts`, `maintenance/maintenance.ts`, `cost-ledger.ts`, `TicketJob`, `metadata-assessment.ts`, `project-bindings.ts`, `ref_node_path`, `it-specialist.ts`, `scheduled-work.ts`, `Offices`, `github/issue-publication.ts`, `notifications.ts`, `GitHubDelivery`, `time-scope.ts`, `TicketJob`, `knowledge.ts`, `features/workflow.ts`, `engine.ts`, `scheduler.ts`, `.emit`, `harnessEffect`, `maintenance/maintenance.ts`, `index.tsx`, `.getEffect`, `.getEffect`, `daily-cto.ts`, `jira-attempts.ts`, `office-lessons.ts`, `remove-candidate.ts`, `coordination.ts`, `ticket-evidence.ts`, `evidence-artifacts.ts`, `owned-artifact.ts`, `tracking-issue.ts`, `digest`, `create-candidate.ts`, `merge-scanner-retry.ts`, `accept-stage-result.ts`, `Goals.tsx`, `sanitize`, `readable-jira-comment.ts`, `cec/workflow.ts`, `assignment-poll.ts`, `requests.ts`, `.save`, `coordination.ts`, `ticket-stage-runner.ts`, `worker-runtime.ts`, `merge-ceiling.ts`, `run-accounting.ts`, `FeatureWorkflow`, `admit-improvement.ts`, `blocker-followups.ts`?**
  _High betweenness centrality (0.123) - this node is a cross-community bridge._
- **Should `OrgChart.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10714285714285714 - nodes in this community are weakly interconnected._
- **Why does `TicketJob` connect `github-delivery.ts` to `retrospective-subject.ts`, `Inspector.tsx`, `App.tsx`, `record-trigger.ts`, `GitHubDelivery`, `holdReason`, `harnessEffect`, `TicketJob`, `metadata-assessment.ts`, `work-summary.ts`, `ref_node_path`, `it-specialist.ts`, `scheduled-work.ts`, `github/issue-publication.ts`, `TicketJob`, `ProjectProgress`, `scheduler.ts`, `.getEffect`, `daily-cto.ts`, `remove-candidate.ts`, `coordination.ts`, `digest`, `create-candidate.ts`, `merge-scanner-retry.ts`, `accept-stage-result.ts`, `cec/workflow.ts`, `requests.ts`, `MaintenanceRun`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Should `intent.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11428571428571428 - nodes in this community are weakly interconnected._
- **Why does `command()` connect `Store` to `intent.ts`, `ref_node_crypto`, `session-bridge.ts`, `continue-ownership-read.ts`, `github-delivery.ts`, `agents.ts`, `knowledge/routes.ts`, `GitHubDelivery`, `holdReason`, `harnessEffect`, `jira-time.ts`, `maintenance/maintenance.ts`, `cost-ledger.ts`, `metadata-assessment.ts`, `project-bindings.ts`, `ref_node_path`, `notifications.ts`, `TicketJob`, `features/workflow.ts`, `engine.ts`, `harnessEffect`, `maintenance/maintenance.ts`, `index.tsx`, `.getEffect`, `.getEffect`, `remove-candidate.ts`, `coordination.ts`, `ticket-evidence.ts`, `evidence-artifacts.ts`, `brain-maintenance.ts`, `digest`, `create-candidate.ts`, `features.ts`, `merge-scanner-retry.ts`, `contract.ts`, `readable-jira-comment.ts`, `requests.ts`, `.save`, `coordination.ts`, `worker-runtime.ts`, `FeatureWorkflow`, `admit-improvement.ts`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Should `ref_node_crypto` be split into smaller, more focused modules?**
  _Cohesion score 0.14545454545454545 - nodes in this community are weakly interconnected._
- **Should `Inspector.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10538994278831677 - nodes in this community are weakly interconnected._