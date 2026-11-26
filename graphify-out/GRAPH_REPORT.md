# Graph Report - the-office  (2026-11-26)

## Corpus Check
- 1246 files · ~528,141 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 6463 nodes · 28335 edges · 174 communities (165 shown, 9 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 1028 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `25a5bf5a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- redactEvidence
- OrgChart.tsx
- worker-runtime.ts
- features/workflow.ts
- cx
- ControlStore
- projects.ts
- holdReason
- github-check-selection.ts
- TelemetryPanel.tsx
- .transaction
- pass.ts
- App.tsx
- admit-improvement.ts
- park-writes.ts
- scheduled-captures.ts
- run-retrospective.ts
- record-trigger.ts
- deploy-command.ts
- OfficeSnapshot
- artifact
- dependency-bots/adopt.ts
- retrospective-subject.ts
- jira-time.ts
- advance-metadata-park.ts
- Outbox.tsx
- agents.ts
- closeout-recovery.ts
- store.ts
- GitHubDelivery
- digest
- coordination.ts
- index.ts
- remove-candidate.ts
- call-scope.ts
- common.cjs
- scheduled-work.ts
- routing.cjs
- redact-evidence.ts
- knowledge.ts
- deployed-fixes.ts
- time-scope.ts
- process.ts
- jiraBinding
- Offices
- harness-baseline.ts
- OfficeScene.tsx
- Ticket
- assignment.ts
- intent.ts
- index.tsx
- ledger.ts
- ref_zod
- state-parts.ts
- cec/issue-publication.ts
- ref_node_child_process
- features.ts
- deploy.ts
- ref_node_path
- jira-attempts.ts
- cost-ledger.ts
- time-ledger.ts
- maintenance/maintenance.ts
- Button
- judge-resumes.ts
- validate_pr_body.cjs
- audit-plan-candidates.cjs
- office-client.ts
- ref_node_crypto
- ticket-evidence.ts
- constellation-runtime.ts
- setup-stop-cap.ts
- session-context-file.ts
- knowledge/routes.ts
- session-scope.ts
- service-health.ts
- sanitize
- daily-cto.ts
- incidents.ts
- fact-bounds.ts
- session-bridge.ts
- offices.ts
- office-config.ts
- brain-maintenance.ts
- viewer.js
- weekly-rollup.ts
- stopped-record.ts
- conversations/conversations.ts
- conversations/slack.ts
- spawn-command.ts
- provider-observation.ts
- readable-jira-comment.ts
- session-context-client.ts
- plans.cjs
- timed-statements.ts
- capture-session-clone.py
- control-store.ts
- copy.ts
- pilot-delivery.ts
- archive-plan.cjs
- notifications.ts
- shared.ts
- read-retries.ts
- on-merge-sync.cjs
- backup-stores.ts
- extract-worker.mjs
- deploy-plan.ts
- work.ts
- DeploymentFence
- engine.ts
- blocker-followups.ts
- report.ts
- outbox.ts
- checkpoint-completion.ts
- slack-supersession.ts
- telemetry.ts
- qa.ts
- qa-plan-continuation.ts
- writer-restart.ts
- call-outcome.ts
- DailyCTO.tsx
- project-bindings-config.ts
- resume-control.ts
- knowledge-views.ts
- refresh-issue-state.cjs
- lesson-selection.ts
- .activeClaims
- accessibility-sources.ts
- node-visuals.ts
- call-ledger.ts
- pre-push-boundary.ts
- it-specialist.ts
- diagnostic-snapshot.ts
- run-accounting.ts
- MaintenanceRun
- controller-runtime.ts
- assignment-poll.ts
- Effects
- run.ts
- featureById
- session-snapshot-cleanup.ts
- scene-motion.ts
- Store
- production.ts
- reconcile-merges.cjs
- preferences-store.ts
- http/commands.ts
- metadata-park-words.ts
- supersedingDelivery
- harnessEffect
- repoRoot
- TicketDetail.tsx
- SessionBridge
- qa-plan-retry.ts
- resume-outcome.ts
- office-lessons.ts
- restart-stopped-writers.ts
- ProjectProgress
- JiraWorklogTransport
- routing.js
- packed-consumer-pnpm.ts
- codex-rollout.ts
- command-registry.ts
- interrupted-work-recovery.ts
- owned-artifact.ts
- restoreInPlace
- ITFollowUps.tsx
- continue-access-only-plan.ts
- run-evidence.ts
- codex-rollout-file.ts
- run-usage.ts
- unblock-brief.ts
- helper-usage.ts
- handover-cms.ts

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
- `Admission` --references--> `AssignmentReview`  [EXTRACTED]
  server/delivery/intake/admission.ts → src/shared.ts

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

## Communities (174 total, 9 thin omitted)

### Community 0 - "redactEvidence"
Cohesion: 0.08
Nodes (39): citationFault(), CitationSchema, SourceVersions, sourceVersions(), dismiss(), DISMISSAL_REASON, DismissalFacts, DismissalRequest (+31 more)

### Community 1 - "OrgChart.tsx"
Cohesion: 0.11
Nodes (39): label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+31 more)

### Community 2 - "worker-runtime.ts"
Cohesion: 0.06
Nodes (47): candidateWorkspaceEnvironment(), assignmentSubject(), prepareExposure(), lessonPurpose(), selectLessons(), catalogLine(), assertBriefingScope(), contextPacket() (+39 more)

### Community 3 - "features/workflow.ts"
Cohesion: 0.08
Nodes (52): approveFeature(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), discoveryPrompt(), planPrompt(), artifactPath() (+44 more)

### Community 4 - "cx"
Cohesion: 0.09
Nodes (65): blockedSummary(), ServiceHealthPanel(), followUp(), labels, ServiceHealthRow(), BlockerFollowups(), LearningCoverage(), lessonsView() (+57 more)

### Community 5 - "ControlStore"
Cohesion: 0.12
Nodes (11): DailyCTO, EvidenceRequestConflict, reviewWeekday(), queueGoalEvidenceRequest(), Briefing, saveReviewBriefing(), SeenReports, WAITING (+3 more)

### Community 6 - "projects.ts"
Cohesion: 0.10
Nodes (24): cecReconcilePrompt(), ctoChatPrompt(), READABLE_REPLY, slackSendPrompt(), PICKUP_CHAT, PickupSchema, boundedCTOContext(), project() (+16 more)

### Community 7 - "holdReason"
Cohesion: 0.05
Nodes (84): boardPreflightCandidate(), Ownership, reconcileBoardPreflight(), partialLocalCleanupCandidate(), continuationScope(), continuationWorktree(), continuationGuard(), Assessment (+76 more)

### Community 8 - "github-check-selection.ts"
Cohesion: 0.08
Nodes (54): resumeProviderReviews(), observe(), CheckJobAgreement, checkJobAgreement(), isKnownCheckStatus(), positive(), STATE, UNFINISHED (+46 more)

### Community 9 - "TelemetryPanel.tsx"
Cohesion: 0.09
Nodes (42): TelemetryReport, displayAgentTask(), LiveAgentTask(), Props, RunningTask(), text(), Agent, AzureBuild (+34 more)

### Community 10 - ".transaction"
Cohesion: 0.12
Nodes (34): featureItemComplete(), reconcileFeatureCompletion(), GitHubFeaturePublisher, readEvidence(), helperTelemetry(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS (+26 more)

### Community 11 - "pass.ts"
Cohesion: 0.05
Nodes (92): systemClock, guardPresent(), overseerCommand(), resolveCliRoot(), runnerStatus(), DEFAULT_OFFICE_URL, LOOPBACK, officeUrl() (+84 more)

### Community 12 - "App.tsx"
Cohesion: 0.04
Nodes (76): createConversationDrafts(), BrainDrawer(), themeColor, App(), BrainWorkspace, CONNECTION, CONNECTION_DOT, dockItemVariants (+68 more)

### Community 13 - "admit-improvement.ts"
Cohesion: 0.21
Nodes (17): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+9 more)

### Community 14 - "park-writes.ts"
Cohesion: 0.14
Nodes (37): activeMetadataPark(), finishMetadataPark(), startMetadataParkReadBack(), advanceHistoricalPark(), inspectMetadataPark(), recordMetadataParkIssueStop(), idle(), intentState() (+29 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.14
Nodes (50): dispatchNightly(), requestDelivery(), createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture() (+42 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.09
Nodes (42): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, BlockingTrigger, blockingTrigger(), isBlocking() (+34 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.12
Nodes (36): baselined(), baselineLearning(), LEARNING_BASELINES, maintainLearning(), configureKnowledge(), clip(), maintenanceBlockedId(), MaintenanceCandidate (+28 more)

### Community 18 - "deploy-command.ts"
Cohesion: 0.09
Nodes (34): [cmd,...rawArgs], CONTROLLER_ENTRY, ControllerPin, Pin, pinnedController(), readControllerPin(), writeControllerPin(), controllerOf() (+26 more)

### Community 19 - "OfficeSnapshot"
Cohesion: 0.08
Nodes (55): jiraQueueProgress(), nextStage(), deliveryRoles, JiraQueueProgress, TicketProgress, BARE_UUID, COMPOSITE, strip() (+47 more)

### Community 20 - "artifact"
Cohesion: 0.05
Nodes (131): containedFile(), closeoutRecoveryCandidate(), CloseoutRecoveryKind, activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation() (+123 more)

### Community 21 - "dependency-bots/adopt.ts"
Cohesion: 0.07
Nodes (61): Execute, readBackOrThrow(), adoptDependabot(), AlertIssue, alertIssueBody(), alertIssueTitle(), alertMarker(), closeAlertIssue() (+53 more)

### Community 22 - "retrospective-subject.ts"
Cohesion: 0.20
Nodes (14): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+6 more)

### Community 23 - "jira-time.ts"
Cohesion: 0.11
Nodes (38): unresolvedAttempts(), bindingOf(), connectWith(), data(), envelope(), finishVerifiedEffects(), JiraWorklogs, locks (+30 more)

### Community 24 - "advance-metadata-park.ts"
Cohesion: 0.13
Nodes (37): ProjectCard, advanceMetadataPark(), Parked, releaseWords(), sentAnything(), cardResumeRoute(), effectiveParkPickup(), PICKUP_ASSIGNEE (+29 more)

### Community 25 - "Outbox.tsx"
Cohesion: 0.05
Nodes (68): knowledgeOutbox(), Conversation(), ConversationDraft, SendMessage, LessonDecisionAction, lessonDecisionState(), readLessonDecision(), DAYS (+60 more)

### Community 26 - "agents.ts"
Cohesion: 0.07
Nodes (35): implementationWorkerContext(), RefusedQAResult, savedStageCompletion(), assertContinuableWorktree(), CONTINUABLE, continuationPrompt(), MAX_CONTINUATIONS, recordedContinuation() (+27 more)

### Community 27 - "closeout-recovery.ts"
Cohesion: 0.11
Nodes (39): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+31 more)

### Community 28 - "store.ts"
Cohesion: 0.04
Nodes (126): writerRestartInstruction(), findingsBlock(), QA_STAGES, reviewAdvisoryIds(), Reviewed, withoutReviewAdvisories(), assertDeliveryMayMutate(), handsOff() (+118 more)

### Community 29 - "GitHubDelivery"
Cohesion: 0.11
Nodes (19): harnessCloseout(), PASSING, verifyMergeActions(), HarnessControl, withHarnessWork(), runHarnessStage(), harnessStageResult(), receipt() (+11 more)

### Community 30 - "digest"
Cohesion: 0.07
Nodes (70): interruptedImplementation(), recoverCTOInput(), assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema, savedMetadataAssessment(), validateSaved() (+62 more)

### Community 31 - "coordination.ts"
Cohesion: 0.07
Nodes (62): startPilot(), eligibility(), MergeNotifications, reconcileNoticeConfirmations(), Admission, admit(), admitReadyCards(), IntakeContext (+54 more)

### Community 32 - "index.ts"
Cohesion: 0.06
Nodes (61): implementationContinuationRoute(), qaPlanRetryRoute(), Link, linkFeature(), featureRoute(), DISMISSAL_CITATIONS, dismissalRequest(), PACKET_EVENTS (+53 more)

### Community 33 - "remove-candidate.ts"
Cohesion: 0.15
Nodes (22): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), maintenanceCandidate(), moveAside(), moveBack(), purgeRemoved(), purging (+14 more)

### Community 34 - "call-scope.ts"
Cohesion: 0.14
Nodes (19): bindGitHubRunner(), boundGitHubRunner(), currentGitHubProject(), currentGitHubSource(), githubCli(), Runner, scopes, STAGES (+11 more)

### Community 35 - "common.cjs"
Cohesion: 0.16
Nodes (25): fromArgs(), connections(), fs, main(), path, atomicWrite(), crypto, digest() (+17 more)

### Community 36 - "scheduled-work.ts"
Cohesion: 0.08
Nodes (43): freshOwnershipRead(), conversationResolved(), deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), Ownership, ownershipContext, refreshDeliveryOwnership() (+35 more)

### Community 37 - "routing.cjs"
Cohesion: 0.11
Nodes (33): fs, main(), path, { spawnSync }, frontmatterProblems(), main(), parseArgs(), usage() (+25 more)

### Community 38 - "redact-evidence.ts"
Cohesion: 0.11
Nodes (18): AFTER_LABEL, ASSIGNMENT, AWS_KEY_ID, BARE_CREDENTIAL, BARE_UNIT, BARE_VALUE, CAMEL_START, CONTROL_ESCAPE (+10 more)

### Community 39 - "knowledge.ts"
Cohesion: 0.08
Nodes (35): clip(), DEMAND_LIMIT, demandFacts(), DemandSection, key(), LessonKey, notes(), dropPendingLessons() (+27 more)

### Community 40 - "deployed-fixes.ts"
Cohesion: 0.14
Nodes (27): inHistoryOf(), CompareMemory, compareMemory(), COMPARES_PER_PASS, comparison(), DeployedFixes, DeployedFixesInput, recordDeployedFixes() (+19 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.17
Nodes (24): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), ticketUnresolved(), midnight() (+16 more)

### Community 42 - "process.ts"
Cohesion: 0.07
Nodes (12): AzureMonitor, GitHubMonitor, ResumeProject, Result, Assessment, DeployCommandOptions, ControllerLaunch, Engine (+4 more)

### Community 43 - "jiraBinding"
Cohesion: 0.10
Nodes (54): resolveBlockedTransition(), document(), transitionWithComment(), jiraAccount(), jiraCollection(), JiraCredential, jiraCredential(), KEYCHAIN_SERVICE (+46 more)

### Community 44 - "Offices"
Cohesion: 0.16
Nodes (3): QuestionNotifications, projectById(), Offices

### Community 45 - "harness-baseline.ts"
Cohesion: 0.16
Nodes (22): BaselineReport, baselineReport(), BaselineSource, baselineText(), millions(), row(), share(), add() (+14 more)

### Community 46 - "OfficeScene.tsx"
Cohesion: 0.11
Nodes (40): withoutElapsed(), CameraBookmark, restoreBookmark(), Avatar(), AzureWall(), Box(), Chair(), Coworker() (+32 more)

### Community 47 - "Ticket"
Cohesion: 0.07
Nodes (40): carriedNotRepeated(), changeScopeNote(), Scoped, intakeMembership(), JiraOperations, movedHeadNote(), cecPrompt(), cecTransitionPrompt() (+32 more)

### Community 48 - "assignment.ts"
Cohesion: 0.13
Nodes (23): latestQA(), notPassedInLatestQA(), QACoverage, qaCoverage(), same(), Tested, safeWebUrl(), officeValidation() (+15 more)

### Community 49 - "intent.ts"
Cohesion: 0.17
Nodes (11): assertOwnership(), ImplementationDecision, OwnershipRead, Decision, requestQAPlanRetry(), Admission, AdmissionKind, ImplementationContinuation (+3 more)

### Community 50 - "index.tsx"
Cohesion: 0.07
Nodes (45): FeatureQuestionProjection, OutboxQuestionRound(), send(), FeatureDelivery(), FeatureDocuments(), views, FeatureReading(), FeatureWorkspace() (+37 more)

### Community 51 - "ledger.ts"
Cohesion: 0.17
Nodes (19): ctoInputIdentityMatches(), ctoInputRecovered(), acceptedCompletionResolution(), investigationCandidates(), investigationId(), ctoReplacementResolution(), finishedSubjectResolution(), investigationFollowUps() (+11 more)

### Community 52 - "ref_zod"
Cohesion: 0.11
Nodes (32): AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), goalEvidencePath(), azureSchema, deploymentSchema, jiraSchema, ownJiraSchema, promptSchema (+24 more)

### Community 53 - "state-parts.ts"
Cohesion: 0.13
Nodes (16): readSavedState(), LARGE_KEY_CHARS, plain(), RedactedEntries, RedactedEntry, redactEntries(), joinParts(), PartRow (+8 more)

### Community 54 - "cec/issue-publication.ts"
Cohesion: 0.08
Nodes (21): escaped(), IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), projectListScope(), Assignment, contentSchema() (+13 more)

### Community 55 - "ref_node_child_process"
Cohesion: 0.08
Nodes (27): changedPaths(), { execFileSync }, files, isMapInput(), mapOnly(), { execFileSync }, git(), publish() (+19 more)

### Community 56 - "features.ts"
Cohesion: 0.09
Nodes (39): commandFeature(), reviewQuestions(), FeaturePlanningBindings, assertQuestionVisibility(), applyHarnessAction(), HarnessActionInput, recoveryPreconditions(), recoveryTarget() (+31 more)

### Community 57 - "deploy.ts"
Cohesion: 0.10
Nodes (50): abandon(), advance(), deploy(), exclusively(), unfinishedDeployments(), Commit, DEPLOY_STEPS, DeployFacts (+42 more)

### Community 58 - "ref_node_path"
Cohesion: 0.08
Nodes (49): applyIntakeObservation(), MISSING_SAVED_PLAN, candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf() (+41 more)

### Community 59 - "jira-attempts.ts"
Cohesion: 0.14
Nodes (19): attempted(), attemptState(), bound(), covers(), JiraAttempt, jiraAttempts(), JiraAttemptState, open() (+11 more)

### Community 60 - "cost-ledger.ts"
Cohesion: 0.14
Nodes (29): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress(), effectId() (+21 more)

### Community 61 - "time-ledger.ts"
Cohesion: 0.17
Nodes (17): publishableEntry(), settlementPending(), superseded(), syncing, TimeLedger, missedSinceVerified(), readBackTime(), clearUnsent() (+9 more)

### Community 62 - "maintenance/maintenance.ts"
Cohesion: 0.10
Nodes (26): maintenancePolicies(), captureMaintenanceStep(), accessibilitySources(), sourceFindings, sourceReview(), SETTLED, skipOwnedCandidate(), Skipped (+18 more)

### Community 63 - "Button"
Cohesion: 0.08
Nodes (49): ChatMarkdown(), ChatMarkdown, MessageText(), Activity(), ActivityTimeline(), AssignmentKnowledge(), Lookup(), BrainWorkspace() (+41 more)

### Community 64 - "judge-resumes.ts"
Cohesion: 0.08
Nodes (34): PacketInput, absent(), IncidentChange, IncidentLedger, isOpen(), Recorded, replayed(), judgeResumes() (+26 more)

### Community 65 - "validate_pr_body.cjs"
Cohesion: 0.36
Nodes (8): fs, main(), readableText(), REQUIRED_CHECKS, REQUIRED_SECTIONS, sections(), validatePullRequestBody(), withoutComments()

### Community 66 - "audit-plan-candidates.cjs"
Cohesion: 0.14
Nodes (31): audit(), branchIssueNumbers(), classify(), distinctiveTitleWords(), { execFileSync }, extractPaths(), findPrForMergeSubject(), fmtCommit() (+23 more)

### Community 67 - "office-client.ts"
Cohesion: 0.22
Nodes (12): bodyWithin(), bounded(), Envelope, HealthReading, officeReader(), OfficeReadError, Release, RESET (+4 more)

### Community 68 - "ref_node_crypto"
Cohesion: 0.12
Nodes (61): DeliveryAuthorityInput, canonical(), assessResumes(), Standing, CheckpointEligibility, checkpointEligibility(), admitAssignmentResume(), forAssignment() (+53 more)

### Community 69 - "ticket-evidence.ts"
Cohesion: 0.09
Nodes (39): cecIntakePrompt(), Connection, twgConnection(), twgProfile(), assetDownloader(), attachmentKind(), evidenceDirectory(), storeEvidence() (+31 more)

### Community 70 - "constellation-runtime.ts"
Cohesion: 0.10
Nodes (20): CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point, createConstellation(), enter() (+12 more)

### Community 71 - "setup-stop-cap.ts"
Cohesion: 0.11
Nodes (30): cecReadbackPrompt(), plainResume(), readbackDispatchGuidance(), currentEnvironmentWait(), environmentWait(), rerunsInterruptedQA(), officeRefusedQA(), confirmSetupStopCap() (+22 more)

### Community 72 - "session-context-file.ts"
Cohesion: 0.22
Nodes (13): unpackContextFailure(), ContextFoldPrefix, contextFoldPrefix(), SessionContextCheckpoint, captureSessionContextClone(), ContextReadPhase, SessionContextDeadline, sessionContextFile() (+5 more)

### Community 73 - "knowledge/routes.ts"
Cohesion: 0.08
Nodes (36): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainOverlap, BrainGraph, BrainNote, BrainReader (+28 more)

### Community 74 - "session-scope.ts"
Cohesion: 0.19
Nodes (17): Bound, claudeScopeParser(), claudeSessionScope(), CODEX_ROLLOUTS, contextReaders(), retainSessionMessage(), SessionConversation, escaped() (+9 more)

### Community 75 - "service-health.ts"
Cohesion: 0.11
Nodes (22): withGitHubSource(), ClaudeLoginRefusal, claudeLoginRefusal(), claudeRefusalWords(), RECORDED_REFUSALS, refusedClaudeRow(), listenerHealth(), providers (+14 more)

### Community 76 - "sanitize"
Cohesion: 0.08
Nodes (46): az(), buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs(), fullActivePRs(), observation() (+38 more)

### Community 77 - "daily-cto.ts"
Cohesion: 0.11
Nodes (24): currentCitations(), Fact, NOT_CURRENT, PROVIDER_ERROR, evidenceRequestConflicts, dailyReviewPrompt(), applyGoalReview(), DailyResultSchema (+16 more)

### Community 78 - "incidents.ts"
Cohesion: 0.09
Nodes (48): attributedRecords(), foldsItsRun(), groupCandidates(), ObservedIncident, ObservedSubject, incidentId(), mailboxFreeze(), details() (+40 more)

### Community 79 - "fact-bounds.ts"
Cohesion: 0.26
Nodes (14): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+6 more)

### Community 80 - "session-bridge.ts"
Cohesion: 0.11
Nodes (28): codexDaemonProcesses(), accountCodexProcesses(), CodexProcessInventory, codexProcessInventory(), DesktopSessions, unaccountedProcesses(), codexThreadMetadata(), METADATA_CHUNK (+20 more)

### Community 81 - "offices.ts"
Cohesion: 0.07
Nodes (8): leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), DELIVERY_CONCURRENCY, InFlightOperations, coordination(), Coordinator

### Community 82 - "office-config.ts"
Cohesion: 0.14
Nodes (14): ServiceContext, OfficeConfigInputs, officeConfigSummary(), projectSettingsSummary(), CECBinding, DelayHistogram, LOOP_SAMPLE_MS, LoopDelay (+6 more)

### Community 83 - "brain-maintenance.ts"
Cohesion: 0.19
Nodes (12): BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, brainResultStop(), GateMark, gateMark(), MAX_START_RETRIES, neverStarted() (+4 more)

### Community 84 - "viewer.js"
Cohesion: 0.19
Nodes (25): addMetaLink(), addMetaRow(), addRelationship(), applyView(), buildIndexes(), buildLegend(), buildModel(), buildRenderer() (+17 more)

### Community 85 - "weekly-rollup.ts"
Cohesion: 0.08
Nodes (39): expireLearningPackets(), packetReferences(), learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck() (+31 more)

### Community 86 - "stopped-record.ts"
Cohesion: 0.07
Nodes (66): boundedEvidence(), expectedWait(), StopFacts, digest(), fingerprint(), FailedMailCheck, lastFailedMailCheck(), lastMailCheckOutcome() (+58 more)

### Community 87 - "conversations/conversations.ts"
Cohesion: 0.09
Nodes (26): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+18 more)

### Community 88 - "conversations/slack.ts"
Cohesion: 0.09
Nodes (19): channelNoticeAuthorized(), slackVerifyPrompt(), comparableSlackText(), labelIsUrl(), dueSlackReread(), rereadUncertainSlack(), runningRevision(), settleRequestedSlackReplacement() (+11 more)

### Community 89 - "spawn-command.ts"
Cohesion: 0.12
Nodes (24): exitFailure(), inactivityWatch(), At, Errno, errno(), GroupInventory, GroupProbe, LifecycleDiagnostic (+16 more)

### Community 90 - "provider-observation.ts"
Cohesion: 0.08
Nodes (44): correlatedBuild(), hasPendingDelivery(), resumeAfterSignIn(), signInWait(), MAX_SIGN_IN_UNPARKS, unparkSignedIn(), waitingStep(), Azure (+36 more)

### Community 91 - "readable-jira-comment.ts"
Cohesion: 0.12
Nodes (31): CommentPage, commentReadback(), devUpdate(), HEADLINE, jiraRecord(), unpack(), parksInJira(), postDevUpdate() (+23 more)

### Community 92 - "session-context-client.ts"
Cohesion: 0.11
Nodes (19): claudeSessionContext(), readTranscript, codexSessionContext(), readRollout, packContextFailure(), PackedContextFailure, ContextThread, contextThread() (+11 more)

### Community 93 - "plans.cjs"
Cohesion: 0.19
Nodes (19): walk(), association(), auditedDigests(), candidate(), cleanCursor(), collapseByTitle(), discover(), fromMarkdown() (+11 more)

### Community 94 - "timed-statements.ts"
Cohesion: 0.18
Nodes (14): StoreTiming, StoreTimings, storeTimings(), NAMED, rowsText(), rowText(), SQL_TOKEN, statementName() (+6 more)

### Community 96 - "control-store.ts"
Cohesion: 0.17
Nodes (9): applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, statementCache(), initialSnapshot(), initializeStoreSchema(), DailyCTOSummary (+1 more)

### Community 97 - "copy.ts"
Cohesion: 0.17
Nodes (18): GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles(), ContinuationIO (+10 more)

### Community 98 - "pilot-delivery.ts"
Cohesion: 0.07
Nodes (66): candidateBranchMoved(), applyChangeScope(), endChangeScope(), levels(), MAX_CHECKS, owedUnderScope(), scopeBase(), scopeOutgrown() (+58 more)

### Community 99 - "archive-plan.cjs"
Cohesion: 0.13
Nodes (29): fs, main(), parse(), path, archive(), cell(), ensureIndex(), fs (+21 more)

### Community 100 - "notifications.ts"
Cohesion: 0.16
Nodes (16): ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR, plainSlackText() (+8 more)

### Community 101 - "shared.ts"
Cohesion: 0.05
Nodes (59): closedReadonlyPlan(), Document, document(), continueOwnershipRead(), continueUnsealedQA(), entry(), expiredOwnershipRead(), handoffOwnership() (+51 more)

### Community 102 - "read-retries.ts"
Cohesion: 0.30
Nodes (10): ATTEMPT_DELAYS_MS, PrerequisitesSchema, classifyStop(), incompleteReadOutput(), planReadRetry(), readOnlyStageJob(), readRetryPending(), reconcileReadRetries() (+2 more)

### Community 103 - "on-merge-sync.cjs"
Cohesion: 0.19
Nodes (22): fieldSpan(), keyPattern(), list(), parseListLiteral(), quote(), render(), scalar(), splitFrontmatter() (+14 more)

### Community 104 - "backup-stores.ts"
Cohesion: 0.10
Nodes (36): absentAdmission(), AdmissionComparison, AdmissionSnapshot, compareAdmissions(), snapshotAdmissions(), BackupEntry, BackupInput, BackupInventory (+28 more)

### Community 105 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 106 - "deploy-plan.ts"
Cohesion: 0.09
Nodes (51): runningRevision(), runningRevision(), Body, DeploymentFenceState, fenceTokenDigest(), releaseIdentity(), runtimeRevision(), ActiveRelease (+43 more)

### Community 107 - "work.ts"
Cohesion: 0.09
Nodes (34): admitRepairWaits(), Covered, COVERING, expiryEvent(), expiryId(), lastProgress(), progressOf(), RepairWaitPass (+26 more)

### Community 108 - "DeploymentFence"
Cohesion: 0.33
Nodes (4): assertToken(), DeploymentFence, DeploymentFenceGateContext, DeploymentFenceRouteContext

### Community 109 - "engine.ts"
Cohesion: 0.20
Nodes (14): enumerateIntakeList(), inPickupOrder(), Intake, text(), checkMail(), drainMail(), requestMail(), jiraResponse() (+6 more)

### Community 110 - "blocker-followups.ts"
Cohesion: 0.10
Nodes (53): conversationReadbackReady(), followupOf(), pendingReadback(), queueConversationReadback(), readbackEnding(), uncertainConversations(), readBackConversations(), followupRecord() (+45 more)

### Community 111 - "report.ts"
Cohesion: 0.22
Nodes (15): TelemetryRow, TelemetrySync, Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount() (+7 more)

### Community 112 - "outbox.ts"
Cohesion: 0.11
Nodes (24): capabilityBlockedReviews(), latestReviews(), metadataParkAction(), ADOPTION_STALLED_MS, projectOutbox(), item(), syncOutbox(), OwnerStepItem (+16 more)

### Community 113 - "checkpoint-completion.ts"
Cohesion: 0.18
Nodes (11): BrainStatusSchema, identity, brainCheckpointCompletion(), coverageSchema, verified, PublishedPR, publishedWorkCleanedUp(), nativeChecks (+3 more)

### Community 114 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 115 - "telemetry.ts"
Cohesion: 0.12
Nodes (20): CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL, Rates (+12 more)

### Community 119 - "call-outcome.ts"
Cohesion: 0.18
Nodes (16): failed(), githubAuthError(), noCalls(), refusedByRateLimit(), revalidated, slurpedPages(), succeeded(), endpoint() (+8 more)

### Community 120 - "DailyCTO.tsx"
Cohesion: 0.17
Nodes (17): CTOReview(), goalState, DailyCTO(), reportDate(), reviewStatus, goalKey(), GoalList(), card() (+9 more)

### Community 121 - "project-bindings-config.ts"
Cohesion: 0.15
Nodes (22): awaitingJiraStatus(), awaitingProduction(), FOLLOW_DAYS, followed(), isFollowed(), Azure, AzureRead, containedIn() (+14 more)

### Community 122 - "resume-control.ts"
Cohesion: 0.24
Nodes (9): ResumeArrivalsInput, absent(), NEVER_ENABLED, ResumeControl, stated(), Stored, unreadable(), IncidentsRouteContext (+1 more)

### Community 123 - "knowledge-views.ts"
Cohesion: 0.15
Nodes (19): KnowledgeActivity, KnowledgeEdge, KnowledgeMap, KnowledgeNode, connectionSummary(), ConstellationView, ConstellationRuntime, DisplayNode (+11 more)

### Community 124 - "refresh-issue-state.cjs"
Cohesion: 0.20
Nodes (19): advanceFence(), closingIssues(), githubRefs(), key(), normalizeGithubQuery(), normalizeRepository(), parseGithubQuery(), ref() (+11 more)

### Community 125 - "lesson-selection.ts"
Cohesion: 0.07
Nodes (32): curateLesson(), Curation, CurationAction, mergeEvidence(), LessonBrainAudit, LessonBrainOverlap, INSTALLED, installedLesson() (+24 more)

### Community 126 - ".activeClaims"
Cohesion: 0.05
Nodes (66): nextAttemptAt(), NOT_RETRYABLE, StoppedWriter, stoppedWriter(), WRITER_STAGES, WriterRestartCandidate, writerRestarted(), writerRestartPending() (+58 more)

### Community 127 - "accessibility-sources.ts"
Cohesion: 0.25
Nodes (17): actionable(), closingPull(), Finding, handoffIssue(), issueLines(), issueSource(), observation, reconcileSourceEffects() (+9 more)

### Community 128 - "node-visuals.ts"
Cohesion: 0.20
Nodes (14): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+6 more)

### Community 129 - "call-ledger.ts"
Cohesion: 0.25
Nodes (9): add(), addSource(), busiest(), CallLedger, Entry, sourceRows(), Sources, CallCounts (+1 more)

### Community 130 - "pre-push-boundary.ts"
Cohesion: 0.26
Nodes (10): Event, exactCommand(), Invocation, localHookCommand(), one(), prePushRejection(), PushIdentity, retirementBoundary() (+2 more)

### Community 131 - "it-specialist.ts"
Cohesion: 0.19
Nodes (14): replacedReadback(), heldFor(), ITContext, recoveryHeld(), recoveryWait(), informationalRecovery(), ITSpecialist, ownAzureCheck() (+6 more)

### Community 132 - "diagnostic-snapshot.ts"
Cohesion: 0.19
Nodes (15): itChatPrompt(), assignmentDiagnostics(), diagnosticContext(), diagnosticSnapshot(), followUpPicture(), publishITReport(), archiveOldReports(), RETAINED_REPORTS (+7 more)

### Community 133 - "run-accounting.ts"
Cohesion: 0.18
Nodes (16): readCodexRollout(), codexAccounting(), COMPLETION_MAX_BYTES, markCaptureStart(), merge(), readCompletion(), RECONCILE_GRACE_MS, reconcileUncapturedRuns() (+8 more)

### Community 134 - "MaintenanceRun"
Cohesion: 0.22
Nodes (14): checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), repeatedVendorReviewBlock(), stoppedInVendorReview(), leftToNextRun(), NEXT_RUN_DUE_MS, night() (+6 more)

### Community 135 - "controller-runtime.ts"
Cohesion: 0.09
Nodes (32): projectData(), StoreDatabase, ControllerEffects, controllerEffects(), DEPLOY_PROJECT, alive(), ControllerMachine, option() (+24 more)

### Community 136 - "assignment-poll.ts"
Cohesion: 0.10
Nodes (26): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), confirmedGone(), goneQuery() (+18 more)

### Community 137 - "Effects"
Cohesion: 0.13
Nodes (22): NOT_LANDED_SETTLE_MS, settleNotLanded(), dispatchedMetadataEffect(), GitHubOperations, assignedToJoe(), fileLessonIssue(), lessonIssueBody(), lessonIssueMarker() (+14 more)

### Community 138 - "run.ts"
Cohesion: 0.13
Nodes (23): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, syncInvestigations(), OFFICE_FIX_PROMPT (+15 more)

### Community 139 - "featureById"
Cohesion: 0.14
Nodes (9): featureById(), FeaturePublisher, publishFeature(), reconcilePublication(), uncertainPublications(), reserveIdentity(), FeatureReviewRunner, FeatureWorkflow (+1 more)

### Community 140 - "session-snapshot-cleanup.ts"
Cohesion: 0.40
Nodes (5): SNAPSHOT_PREFIX, removeStaleSessionSnapshots(), SNAPSHOT_SWEEP_MS, STALE_SNAPSHOT_MS, sweepStaleSessionSnapshots()

### Community 141 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 142 - "Store"
Cohesion: 0.08
Nodes (23): RepairWaitEntry, Clock, PROJECT_LOCAL, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork() (+15 more)

### Community 144 - "reconcile-merges.cjs"
Cohesion: 0.21
Nodes (15): remoteSlug(), collectPulls(), copyWikiForDryRun(), { execFileSync }, flattenPages(), fs, githubRequest(), isWikiBotPull() (+7 more)

### Community 145 - "preferences-store.ts"
Cohesion: 0.19
Nodes (9): PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS, OfficePreferences (+1 more)

### Community 146 - "http/commands.ts"
Cohesion: 0.25
Nodes (13): decideImplementation(), requeueWaitedImplement(), enqueueMetadataRecovery(), declineLessonIssue(), reactivateLesson(), retireLesson(), configureGoalNotices(), Settings (+5 more)

### Community 147 - "metadata-park-words.ts"
Cohesion: 0.42
Nodes (9): field(), FIELDS, MetadataField, metadataFields(), metadataParkWords(), metadataStopWords(), needed(), sentence() (+1 more)

### Community 148 - "supersedingDelivery"
Cohesion: 0.31
Nodes (9): currentOutbox(), finishSupersededReadback(), projectSlackDeliveries(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint(), supersedingDelivery() (+1 more)

### Community 149 - "harnessEffect"
Cohesion: 0.14
Nodes (39): BLOCK, harnessBlockMove(), harnessParkedCard(), noted(), effectKey(), LaneOperation, laneWrite(), moveCardOnce() (+31 more)

### Community 150 - "repoRoot"
Cohesion: 0.13
Nodes (18): fs, main(), parse(), path, repoRoot(), substantive(), main(), path (+10 more)

### Community 151 - "TicketDetail.tsx"
Cohesion: 0.15
Nodes (31): Camera, FileText, GitPullRequest, Card(), Count(), Notice(), noticeIcon, summary (+23 more)

### Community 152 - "SessionBridge"
Cohesion: 0.40
Nodes (3): claudeSessions(), SessionBridge, sessionInventoryFailureDetail()

### Community 153 - "qa-plan-retry.ts"
Cohesion: 0.67
Nodes (3): QAPlanRetry, QAPlanRetryProof, QAPlanRetryRequest

### Community 154 - "resume-outcome.ts"
Cohesion: 0.08
Nodes (33): FLAGS, incidentCommand(), IncidentCommandIO, option(), USAGE, whole(), boundaryCrossed(), Crossing (+25 more)

### Community 155 - "office-lessons.ts"
Cohesion: 0.26
Nodes (9): normalizeStatement(), decideOfficeProposal(), mirrorOfficeKnowledge(), OfficeKnowledgeStore, proposeOfficeLessons(), retireOfficeLesson(), Input, promoteNoteLesson() (+1 more)

### Community 156 - "restart-stopped-writers.ts"
Cohesion: 0.30
Nodes (10): restartStoppedWriters(), unchangedSinceAccepted(), releaseFunds(), writerRestartCandidate(), Execute, keptWork(), Read, refObject() (+2 more)

### Community 161 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 162 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 163 - "interrupted-work-recovery.ts"
Cohesion: 0.27
Nodes (9): interruptAdoptions(), legacy(), REMOVED_FIELDS, retireLegacyRecovery(), goalNoticeNeverDispatched(), maintenanceNoticeNeverDispatched(), checkpointOutcome(), Outcome (+1 more)

### Community 164 - "owned-artifact.ts"
Cohesion: 0.42
Nodes (7): BoundedRead, done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf(), CompletionReader

### Community 165 - "restoreInPlace"
Cohesion: 0.60
Nodes (5): identity(), Json, plain(), restorable(), restoreInPlace()

### Community 166 - "ITFollowUps.tsx"
Cohesion: 0.67
Nodes (4): itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps()

### Community 167 - "continue-access-only-plan.ts"
Cohesion: 0.54
Nodes (6): Document, document(), isAccessOnlyPlan(), settledAccessOnlyState(), continueAccessOnlyPlan(), entryExists()

### Community 168 - "run-evidence.ts"
Cohesion: 0.38
Nodes (5): comparable(), EvidenceOutcome, recordRunEvidence(), backfillClaudeCost(), RunAccounting

### Community 169 - "codex-rollout-file.ts"
Cohesion: 0.36
Nodes (7): codexHome(), createdAt(), dayDirs(), header(), ROLLOUT_MAX_BYTES, RolloutScan, scanCodexRollouts()

### Community 170 - "run-usage.ts"
Cohesion: 0.38
Nodes (5): CodexRollout, claudeCrashZero(), claudeUsage(), count(), RunUsage

### Community 171 - "unblock-brief.ts"
Cohesion: 0.53
Nodes (5): clearUnblockBrief(), key(), saveUnblockBrief(), UnblockBrief, unblockBrief()

### Community 172 - "helper-usage.ts"
Cohesion: 0.53
Nodes (5): HELPER_STDOUT_MAX_BYTES, helperAccounting(), claudeAccounting(), completionAccounting(), withReason()

### Community 173 - "handover-cms.ts"
Cohesion: 0.40
Nodes (3): file, project, root

## Knowledge Gaps
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `worker-runtime.ts`, `features/workflow.ts`, `projects.ts`, `holdReason`, `github-check-selection.ts`, `.transaction`, `admit-improvement.ts`, `park-writes.ts`, `scheduled-captures.ts`, `run-retrospective.ts`, `record-trigger.ts`, `OfficeSnapshot`, `artifact`, `dependency-bots/adopt.ts`, `retrospective-subject.ts`, `jira-time.ts`, `advance-metadata-park.ts`, `agents.ts`, `closeout-recovery.ts`, `store.ts`, `GitHubDelivery`, `digest`, `coordination.ts`, `index.ts`, `remove-candidate.ts`, `scheduled-work.ts`, `knowledge.ts`, `time-scope.ts`, `process.ts`, `jiraBinding`, `Offices`, `Ticket`, `intent.ts`, `ledger.ts`, `state-parts.ts`, `cec/issue-publication.ts`, `features.ts`, `ref_node_path`, `jira-attempts.ts`, `cost-ledger.ts`, `time-ledger.ts`, `maintenance/maintenance.ts`, `judge-resumes.ts`, `ref_node_crypto`, `ticket-evidence.ts`, `setup-stop-cap.ts`, `knowledge/routes.ts`, `sanitize`, `daily-cto.ts`, `session-bridge.ts`, `offices.ts`, `brain-maintenance.ts`, `weekly-rollup.ts`, `stopped-record.ts`, `conversations/conversations.ts`, `conversations/slack.ts`, `provider-observation.ts`, `readable-jira-comment.ts`, `control-store.ts`, `copy.ts`, `pilot-delivery.ts`, `notifications.ts`, `shared.ts`, `read-retries.ts`, `work.ts`, `engine.ts`, `blocker-followups.ts`, `outbox.ts`, `checkpoint-completion.ts`, `project-bindings-config.ts`, `lesson-selection.ts`, `.activeClaims`, `accessibility-sources.ts`, `it-specialist.ts`, `diagnostic-snapshot.ts`, `run-accounting.ts`, `controller-runtime.ts`, `assignment-poll.ts`, `Effects`, `run.ts`, `featureById`, `http/commands.ts`, `supersedingDelivery`, `harnessEffect`, `SessionBridge`, `resume-outcome.ts`, `office-lessons.ts`, `ProjectProgress`, `interrupted-work-recovery.ts`, `owned-artifact.ts`, `continue-access-only-plan.ts`, `run-evidence.ts`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **Should `redactEvidence` be split into smaller, more focused modules?**
  _Cohesion score 0.08163265306122448 - nodes in this community are weakly interconnected._
- **Why does `Engine` connect `process.ts` to `holdReason`, `featureById`, `scheduled-captures.ts`, `store.ts`, `coordination.ts`, `scheduled-work.ts`, `Offices`, `Ticket`, `maintenance/maintenance.ts`, `ref_node_crypto`, `offices.ts`, `conversations/conversations.ts`, `conversations/slack.ts`, `provider-observation.ts`, `copy.ts`, `pilot-delivery.ts`, `notifications.ts`, `shared.ts`, `engine.ts`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Should `OrgChart.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10815602836879433 - nodes in this community are weakly interconnected._
- **Why does `OfficeSnapshot` connect `OfficeSnapshot` to `OrgChart.tsx`, `it-specialist.ts`, `diagnostic-snapshot.ts`, `cx`, `MaintenanceRun`, `holdReason`, `assignment-poll.ts`, `TelemetryPanel.tsx`, `App.tsx`, `scene-motion.ts`, `Store`, `record-trigger.ts`, `supersedingDelivery`, `TicketDetail.tsx`, `Outbox.tsx`, `resume-outcome.ts`, `store.ts`, `coordination.ts`, `index.ts`, `interrupted-work-recovery.ts`, `harness-baseline.ts`, `OfficeScene.tsx`, `index.tsx`, `ledger.ts`, `state-parts.ts`, `ref_node_path`, `maintenance/maintenance.ts`, `Button`, `judge-resumes.ts`, `ref_node_crypto`, `service-health.ts`, `sanitize`, `incidents.ts`, `offices.ts`, `stopped-record.ts`, `control-store.ts`, `shared.ts`, `work.ts`, `outbox.ts`, `DailyCTO.tsx`, `.activeClaims`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Should `worker-runtime.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05706760316066725 - nodes in this community are weakly interconnected._
- **Should `features/workflow.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0837138508371385 - nodes in this community are weakly interconnected._