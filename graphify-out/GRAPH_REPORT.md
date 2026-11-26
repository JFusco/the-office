# Graph Report - the-office  (2026-11-26)

## Corpus Check
- 1258 files · ~536,439 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 6559 nodes · 28698 edges · 181 communities (171 shown, 10 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 1033 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1d4470e1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- incidents/routes.ts
- OrgChart.tsx
- worker-runtime.ts
- features.ts
- cx
- daily-cto.ts
- hasUncertainEffects
- index.tsx
- github/issue-publication.ts
- TelemetryPanel.tsx
- office/config.ts
- kill-switch.ts
- App.tsx
- admit-improvement.ts
- advance-metadata-park.ts
- scheduled-captures.ts
- run-retrospective.ts
- record-trigger.ts
- sign-in-unpark.ts
- github-delivery.ts
- accept-stage-result.ts
- dependency-bots/adopt.ts
- retrospective-subject.ts
- jira-time.ts
- TicketJob
- Outbox.tsx
- ref_node_path
- goal-reporting.ts
- github-readiness.ts
- digest
- harnessEffect
- artifact
- index.ts
- shared.ts
- rate-limit-samples.ts
- common.cjs
- scheduled-work.ts
- routing.cjs
- resume-control.ts
- assignments.ts
- observe-github-merges.ts
- time-scope.ts
- Engine
- .save
- Offices
- harness-baseline.ts
- OfficeScene.tsx
- lesson-selection.ts
- carried-checks.ts
- .emit
- QuestionStepper.tsx
- ledger.ts
- projects.ts
- state-parts.ts
- jiraBinding
- ref_node_child_process
- pilot-delivery.ts
- pass.ts
- store.ts
- jira-attempts.ts
- cost-ledger.ts
- unsent-time.ts
- maintenance-readback.ts
- MapView.tsx
- command
- validate_pr_body.cjs
- audit-plan-candidates.cjs
- office-client.ts
- resume-arrivals.ts
- ticket-evidence.ts
- constellation-runtime.ts
- agents.ts
- session-context-file.ts
- knowledge/routes.ts
- session-scope.ts
- service-health.ts
- project-bindings.ts
- requests.ts
- incidents.ts
- runner-state.ts
- session-bridge.ts
- Coordinator
- OfficeSnapshot
- brain-maintenance.ts
- viewer.js
- weekly-rollup.ts
- stopped-record.ts
- sanitize
- notifications.ts
- process.ts
- provider-observation.ts
- readable-jira-comment.ts
- session-context-client.ts
- plans.cjs
- timed-statements.ts
- capture-session-clone.py
- control-store.ts
- controller-runtime.ts
- ticket-stage-runner.ts
- archive-plan.cjs
- call-scope.ts
- workKey
- team-conversation-pump.ts
- on-merge-sync.cjs
- backup-stores.ts
- extract-worker.mjs
- deploy-plan.ts
- remove-candidate.ts
- deployment-fence.ts
- engine.ts
- blocker-followups.ts
- report.ts
- outbox.ts
- work.ts
- slack-supersession.ts
- run-cost.ts
- qa.ts
- qa-plan-continuation.ts
- writer-restart.ts
- deploy.ts
- features/workflow.ts
- follow-production.ts
- RoomCamera.tsx
- deploy-command.ts
- refresh-issue-state.cjs
- knowledge.ts
- GitHubDelivery
- accessibility-sources.ts
- atmosphere.ts
- call-ledger.ts
- record-push.ts
- it-specialist.ts
- it-report.ts
- run-accounting.ts
- MaintenanceRun
- dates.cjs
- task-briefing.ts
- Effects
- run.ts
- Store
- session-snapshot-cleanup.ts
- scene-motion.ts
- scheduler.ts
- production.ts
- reconcile-merges.cjs
- preferences-store.ts
- rootArtifact
- metadata-admission.ts
- runner-root.ts
- project-graphql.ts
- serve-graph.cjs
- inspector-props.ts
- evidence-artifacts.ts
- goal-reviews.ts
- judge-resumes.ts
- recorded-gh-command.ts
- restart-stopped-writers.ts
- change-scope.ts
- resume-step.ts
- routing.js
- packed-consumer-pnpm.ts
- offices.ts
- command-registry.ts
- restoreInPlace
- validate_wiki_pr_body.cjs
- incident-command.ts
- resume-moved-head.ts
- create-candidate.ts
- merge-scanner-retry.ts
- operationPaths
- setup-stop-cap.ts
- codex-rollout.ts
- QAResultsCard.tsx
- normalize-question.ts
- delivery-ownership.ts
- gate-refused-pass.ts
- unblock-brief.ts
- live-reach.ts
- wait-idle.ts
- JiraWorklogTransport
- diagnostic-snapshot.ts

## God Nodes (most connected - your core abstractions)
1. `Store` - 457 edges
2. `TicketJob` - 221 edges
3. `digest()` - 175 edges
4. `command()` - 155 edges
5. `holdReason()` - 141 edges
6. `GitHubDelivery` - 131 edges
7. `OfficeSnapshot` - 123 edges
8. `artifact()` - 116 edges
9. `workKey()` - 110 edges
10. `StageResult` - 110 edges

## Surprising Connections (you probably didn't know these)
- `publish()` --indirect_call--> `title()`  [INFERRED]
  scripts/graphify/publish-refresh.cjs → src/knowledge/map/grouping.ts
- `BreakdownTable()` --indirect_call--> `cell()`  [INFERRED]
  src/telemetry/BreakdownTable.tsx → scripts/wiki/archive-plan.cjs
- `apply()` --indirect_call--> `note()`  [INFERRED]
  src/conversations/OutboxSavedImplementation.tsx → server/cec/parking/resume-parked.ts
- `Write` --references--> `EffectIntent`  [EXTRACTED]
  server/delivery/publication/own-description.ts → src/contracts/work.ts
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

## Communities (181 total, 10 thin omitted)

### Community 0 - "incidents/routes.ts"
Cohesion: 0.07
Nodes (53): citationFault(), CitationSchema, SourceVersions, sourceVersions(), dismiss(), DISMISSAL_CITATIONS, DISMISSAL_REASON, DismissalFacts (+45 more)

### Community 1 - "OrgChart.tsx"
Cohesion: 0.11
Nodes (39): label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+31 more)

### Community 2 - "worker-runtime.ts"
Cohesion: 0.05
Nodes (55): comparableSlackText(), labelIsUrl(), settleRequestedSlackReplacement(), SlackResultSchema, SlackVerificationSchema, candidateWorkspaceEnvironment(), assessDeliveryAuthority(), redact() (+47 more)

### Community 3 - "features.ts"
Cohesion: 0.05
Nodes (66): assertFeatureDependencyOrder(), featureDependencyEdges(), key(), artifactPath(), digest(), document(), featureRoot(), DiscoverySchema (+58 more)

### Community 4 - "cx"
Cohesion: 0.08
Nodes (98): Outbox(), blockedSummary(), itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps(), currentServices(), ServiceHealthPanel() (+90 more)

### Community 5 - "daily-cto.ts"
Cohesion: 0.10
Nodes (16): DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), reviewWeekday(), queueGoalEvidenceRequest(), DailyResultSchema, FreshDailyResultSchema (+8 more)

### Community 6 - "hasUncertainEffects"
Cohesion: 0.22
Nodes (13): hasUncertainEffects(), reconcileCloseout(), redispatchSavedAssessment(), redispatchableAssessment(), requeueUndispatchedAssessments(), conflictAssessmentArtifact(), conflictFindingClassification(), conflictOnlyAssessment() (+5 more)

### Community 7 - "index.tsx"
Cohesion: 0.06
Nodes (79): OutboxSavedImplementation(), apply(), review(), OutboxSavedPlan(), reconcile(), FeatureDelivery(), FeatureDocuments(), views (+71 more)

### Community 8 - "github/issue-publication.ts"
Cohesion: 0.15
Nodes (10): FeaturePublisher, PublicationReceipt, Assign, Board, Content, GitHubIssuePublisher, number(), same() (+2 more)

### Community 9 - "TelemetryPanel.tsx"
Cohesion: 0.14
Nodes (29): CostCompleteness, TelemetryReport, TelemetryRow, TelemetrySync, UsageCompleteness, UsageSource, ValuationSource, BreakdownTable() (+21 more)

### Community 10 - "office/config.ts"
Cohesion: 0.18
Nodes (25): automaticIntakeWait(), reserveReplacement(), stageBudget(), confirmBrief(), classifyFeatureFailure(), automaticEnabled(), automaticFeature(), FeaturePlanningBindings (+17 more)

### Community 11 - "kill-switch.ts"
Cohesion: 0.18
Nodes (20): guardPresent(), overseerCommand(), resolveCliRoot(), runnerStatus(), bounded(), ControlRead, Halt, Pause (+12 more)

### Community 12 - "App.tsx"
Cohesion: 0.06
Nodes (58): BrainDrawer(), themeColor, App(), BrainWorkspace, CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants (+50 more)

### Community 13 - "admit-improvement.ts"
Cohesion: 0.21
Nodes (17): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+9 more)

### Community 14 - "advance-metadata-park.ts"
Cohesion: 0.12
Nodes (52): advanceMetadataPark(), Parked, releaseWords(), sentAnything(), effectiveParkPickup(), REVIEWABLE, startMetadataParkReadBack(), advanceHistoricalPark() (+44 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.13
Nodes (53): accounting, DeliverySubject, nonDelivery, originalReads, createFeature(), assertEnrollable(), enrolled(), assessmentSignal() (+45 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.10
Nodes (40): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, BlockingTrigger, blockingTrigger(), isBlocking() (+32 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.11
Nodes (36): baselined(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences(), clip(), maintenanceBlockedId(), MaintenanceCandidate (+28 more)

### Community 18 - "sign-in-unpark.ts"
Cohesion: 0.18
Nodes (19): hasPendingDelivery(), resumeAfterSignIn(), signInWait(), MAX_SIGN_IN_UNPARKS, unparkSignedIn(), waitingStep(), BrowserPage, browserPages() (+11 more)

### Community 19 - "github-delivery.ts"
Cohesion: 0.05
Nodes (57): writerRestartInstruction(), findingsBlock(), metadataCarriedAdvisoryIds(), ownedBefore(), QA_STAGES, reviewAdvisoryIds(), Reviewed, withoutReviewAdvisories() (+49 more)

### Community 20 - "accept-stage-result.ts"
Cohesion: 0.07
Nodes (88): acceptStageResult(), PrerequisitesSchema, mergeAuthorized(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation() (+80 more)

### Community 21 - "dependency-bots/adopt.ts"
Cohesion: 0.07
Nodes (64): readBackOrThrow(), adoptDependabot(), AlertIssue, alertIssueBody(), alertIssueTitle(), alertMarker(), closeAlertIssue(), ensureAlertIssue() (+56 more)

### Community 22 - "retrospective-subject.ts"
Cohesion: 0.20
Nodes (14): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+6 more)

### Community 23 - "jira-time.ts"
Cohesion: 0.11
Nodes (38): twgProfile(), unresolvedAttempts(), bindingOf(), connectWith(), data(), envelope(), finishVerifiedEffects(), JiraWorklogs (+30 more)

### Community 24 - "TicketJob"
Cohesion: 0.07
Nodes (50): ATTEMPT_DELAYS_MS, nextAttemptAt(), NOT_RETRYABLE, StoppedWriter, WRITER_STAGES, WriterRestartCandidate, ProjectProgress, deliveryAdmission() (+42 more)

### Community 25 - "Outbox.tsx"
Cohesion: 0.06
Nodes (54): knowledgeOutbox(), ChatMarkdown(), Conversation(), send(), ConversationDraft, createConversationDrafts(), LessonDecisionAction, lessonDecisionState() (+46 more)

### Community 26 - "ref_node_path"
Cohesion: 0.08
Nodes (32): MISSING_SAVED_PLAN, savedStageCompletion(), verifiedCloseoutCleanupRequest(), contentTypes, readStoppedClaudeNative(), recordTypes, DraftProvenance, draftStep() (+24 more)

### Community 27 - "goal-reporting.ts"
Cohesion: 0.10
Nodes (30): GitHubMonitor, githubPRDescription(), collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip() (+22 more)

### Community 28 - "github-readiness.ts"
Cohesion: 0.06
Nodes (72): queueMergeNotice(), pinCourier, wikiSync, assertParkDecision(), resume(), resumeProviderReviews(), deliveryTask(), DeliveryTaskInput (+64 more)

### Community 29 - "digest"
Cohesion: 0.07
Nodes (47): Document, document(), isAccessOnlyPlan(), settledAccessOnlyState(), continueAccessOnlyPlan(), entryExists(), continueOwnershipRead(), continueUnsealedQA() (+39 more)

### Community 30 - "harnessEffect"
Cohesion: 0.10
Nodes (56): activeEffectId(), HarnessEffect, harnessEffect(), retryRead(), createdContentSha256(), assertDraftClaimHistory(), linkDraftIssue(), protectedOriginalClaim() (+48 more)

### Community 31 - "artifact"
Cohesion: 0.08
Nodes (59): containedFile(), writerRestartPending(), closeoutRequestResolved(), completedPreparation(), preparationRequestResolved(), Ownership, reconcileScopeRepairReadback(), scopeRepairRequestResolved() (+51 more)

### Community 32 - "index.ts"
Cohesion: 0.07
Nodes (45): implementationContinuationRoute(), qaPlanRetryRoute(), close(), config, itSpecialist, loadedRevision, offices, releaseLock (+37 more)

### Community 33 - "shared.ts"
Cohesion: 0.05
Nodes (65): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), MergeNotifications, BLOCK, harnessBlockMove(), noted(), Admission (+57 more)

### Community 34 - "rate-limit-samples.ts"
Cohesion: 0.15
Nodes (13): CallLedger, bindGitHubRunner(), Runner, GitHubCalls, iso(), RateLimitSamples, Reading, reading() (+5 more)

### Community 35 - "common.cjs"
Cohesion: 0.18
Nodes (22): connections(), fs, main(), path, crypto, ensureInside(), { execFileSync }, fs (+14 more)

### Community 36 - "scheduled-work.ts"
Cohesion: 0.09
Nodes (40): freshOwnershipRead(), dueSlackReread(), rereadUncertainSlack(), runningRevision(), deliverySlot(), withAmendmentOwnership(), metadataRequestResolved(), gateFeatureWork() (+32 more)

### Community 37 - "routing.cjs"
Cohesion: 0.14
Nodes (27): main(), parseArgs(), usage(), adjacency(), edgeCost(), edgeKey(), edgeType(), EVIDENCE_TYPE_PRIORITY (+19 more)

### Community 38 - "resume-control.ts"
Cohesion: 0.29
Nodes (7): absent(), NEVER_ENABLED, ResumeControl, stated(), Stored, unreadable(), ResumeSwitch

### Community 39 - "assignments.ts"
Cohesion: 0.11
Nodes (23): clip(), DEMAND_LIMIT, demandFacts(), DemandSection, key(), LessonKey, notes(), AssignmentLookups (+15 more)

### Community 40 - "observe-github-merges.ts"
Cohesion: 0.30
Nodes (14): clearCooldown(), coolDown(), coolingDown(), MERGE_NOTICE_RECHECK_MS, waitKey(), waits, isMergeCommit(), issueOf() (+6 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.14
Nodes (27): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence(), CaptureContext (+19 more)

### Community 43 - ".save"
Cohesion: 0.11
Nodes (49): resolveBlockedTransition(), document(), transitionWithComment(), jiraAccount(), jiraCollection(), JiraCredential, jiraCredential(), KEYCHAIN_SERVICE (+41 more)

### Community 44 - "Offices"
Cohesion: 0.13
Nodes (6): file, project, root, projectById(), Offices, SessionBridge

### Community 45 - "harness-baseline.ts"
Cohesion: 0.15
Nodes (22): BaselineReport, baselineReport(), BaselineSource, baselineText(), millions(), row(), share(), add() (+14 more)

### Community 46 - "OfficeScene.tsx"
Cohesion: 0.17
Nodes (33): withoutElapsed(), Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk() (+25 more)

### Community 47 - "lesson-selection.ts"
Cohesion: 0.19
Nodes (13): INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, MAINTENANCE, MAX_LESSONS, normalPath(), PURPOSES (+5 more)

### Community 48 - "carried-checks.ts"
Cohesion: 0.22
Nodes (16): latestQA(), notPassedInLatestQA(), QACoverage, qaCoverage(), same(), Tested, safeWebUrl(), officeValidation() (+8 more)

### Community 49 - ".emit"
Cohesion: 0.12
Nodes (31): requestQAPlanRetry(), configureChannelNotices(), configureNotices(), noticeState(), retryRecipientLookup(), recoverCTOInput(), bindDiscoveryResume(), DiscoveryResumeInput (+23 more)

### Community 50 - "QuestionStepper.tsx"
Cohesion: 0.19
Nodes (18): FeatureQuestionProjection, OutboxQuestionRound(), send(), draftKey(), readDraft(), saveDraft(), QuestionRound(), nextQuestion() (+10 more)

### Community 51 - "ledger.ts"
Cohesion: 0.12
Nodes (28): finishSupersededReadback(), projectSlackDeliveries(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint(), supersedingDelivery(), acceptedCompletionResolution() (+20 more)

### Community 52 - "projects.ts"
Cohesion: 0.06
Nodes (64): escaped(), IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), projectListScope(), AUTO_ADOPT_BOTS, IntakeView (+56 more)

### Community 53 - "state-parts.ts"
Cohesion: 0.13
Nodes (16): readSavedState(), LARGE_KEY_CHARS, plain(), RedactedEntries, RedactedEntry, redactEntries(), joinParts(), PartRow (+8 more)

### Community 54 - "jiraBinding"
Cohesion: 0.17
Nodes (9): Assignment, contentSchema(), JiraIssuePublisher, jiraText(), Transition, descriptionPreimage(), plain(), publicationDescription() (+1 more)

### Community 55 - "ref_node_child_process"
Cohesion: 0.10
Nodes (22): changedPaths(), { execFileSync }, files, isMapInput(), mapOnly(), { execFileSync }, git(), publish() (+14 more)

### Community 56 - "pilot-delivery.ts"
Cohesion: 0.14
Nodes (28): candidateBranchMoved(), continueImplementation(), dispatchNightly(), drainDelivery(), requestDelivery(), startPilot(), OfficeQAHandoffInput, eligibility() (+20 more)

### Community 57 - "pass.ts"
Cohesion: 0.13
Nodes (30): RunnerLimits, appendFailureLine(), Evidence, FAILURE_ID, FailureEvent, failureLine(), JournalRefused, JournalView (+22 more)

### Community 58 - "store.ts"
Cohesion: 0.05
Nodes (58): GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles(), ContinuationIO (+50 more)

### Community 59 - "jira-attempts.ts"
Cohesion: 0.10
Nodes (27): attempted(), attemptState(), bound(), covers(), JiraAttempt, jiraAttempts(), JiraAttemptState, open() (+19 more)

### Community 60 - "cost-ledger.ts"
Cohesion: 0.15
Nodes (27): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress(), effectId() (+19 more)

### Community 61 - "unsent-time.ts"
Cohesion: 0.18
Nodes (14): publishableEntry(), settlementPending(), superseded(), ticketUnresolved(), TimeLedger, readBackTime(), clearUnsent(), dueUnsent() (+6 more)

### Community 62 - "maintenance-readback.ts"
Cohesion: 0.25
Nodes (8): Hash, MAINTENANCE_NATIVE_GUIDANCE, maintenanceCoveragePassed(), maintenanceCoverageSchema(), MaintenanceReadback, names, Receipt, Text

### Community 63 - "MapView.tsx"
Cohesion: 0.06
Nodes (68): KnowledgeActivity, KnowledgeEdge, KnowledgeMap, KnowledgeNode, Activity(), ActivityTimeline(), AssignmentKnowledge(), Lookup() (+60 more)

### Community 64 - "command"
Cohesion: 0.07
Nodes (45): inHistoryOf(), CompareMemory, compareMemory(), COMPARES_PER_PASS, comparison(), DeployedFixes, DeployedFixesInput, recordDeployedFixes() (+37 more)

### Community 65 - "validate_pr_body.cjs"
Cohesion: 0.36
Nodes (8): fs, main(), readableText(), REQUIRED_CHECKS, REQUIRED_SECTIONS, sections(), validatePullRequestBody(), withoutComments()

### Community 66 - "audit-plan-candidates.cjs"
Cohesion: 0.14
Nodes (31): audit(), branchIssueNumbers(), classify(), distinctiveTitleWords(), { execFileSync }, extractPaths(), findPrForMergeSubject(), fmtCommit() (+23 more)

### Community 67 - "office-client.ts"
Cohesion: 0.13
Nodes (18): systemClock, RUNNER_DEFAULTS, officeDataRoot, realMachine(), bodyWithin(), bounded(), Envelope, HealthReading (+10 more)

### Community 68 - "resume-arrivals.ts"
Cohesion: 0.12
Nodes (59): DeliveryAuthorityInput, canonical(), checkpointEligibility(), admitAssignmentResume(), forAssignment(), admitCheckpointResume(), forCheckpoint(), admitResume() (+51 more)

### Community 69 - "ticket-evidence.ts"
Cohesion: 0.15
Nodes (21): Connection, twgConnection(), assetDownloader(), attachmentKind(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS (+13 more)

### Community 70 - "constellation-runtime.ts"
Cohesion: 0.09
Nodes (21): CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point, ConstellationRuntime, createConstellation() (+13 more)

### Community 71 - "agents.ts"
Cohesion: 0.04
Nodes (99): implementationWorkerContext(), applyIntakeObservation(), intakeMembership(), JiraOperations, movedHeadNote(), cecPrompt(), cecIntakePrompt(), cecReadbackPrompt() (+91 more)

### Community 72 - "session-context-file.ts"
Cohesion: 0.20
Nodes (14): ContextFoldPrefix, contextFoldPrefix(), SessionContextCheckpoint, captureSessionContextClone(), ContextReadPhase, SessionContextDeadline, sessionContextFile(), ContextReadChanged (+6 more)

### Community 73 - "knowledge/routes.ts"
Cohesion: 0.10
Nodes (21): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), BrainGraph, BrainNote, BrainReader, CommittedBrain, GraphNode (+13 more)

### Community 74 - "session-scope.ts"
Cohesion: 0.18
Nodes (17): Bound, claudeScopeParser(), claudeSessionScope(), CLAUDE_TRANSCRIPTS, CODEX_ROLLOUTS, contextReaders(), retainSessionMessage(), SessionConversation (+9 more)

### Community 75 - "service-health.ts"
Cohesion: 0.12
Nodes (21): ClaudeLoginRefusal, claudeLoginRefusal(), claudeRefusalWords(), RECORDED_REFUSALS, refusedClaudeRow(), listenerHealth(), PROJECT_BINDINGS, providers (+13 more)

### Community 76 - "project-bindings.ts"
Cohesion: 0.11
Nodes (31): AzureMonitor, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs(), fullActivePRs(), observation() (+23 more)

### Community 77 - "requests.ts"
Cohesion: 0.09
Nodes (53): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+45 more)

### Community 78 - "incidents.ts"
Cohesion: 0.08
Nodes (53): attributedRecords(), foldsItsRun(), groupCandidates(), ObservedIncident, ObservedSubject, digest(), fingerprint(), incidentId() (+45 more)

### Community 79 - "runner-state.ts"
Cohesion: 0.14
Nodes (19): at, EMPTY_STATE, IncidentSample, IncidentSummary, InFlight, Intent, JournalIntent, PASS_OUTCOMES (+11 more)

### Community 80 - "session-bridge.ts"
Cohesion: 0.10
Nodes (30): claudeSessionContext(), codexDaemonProcesses(), accountCodexProcesses(), CodexProcessInventory, codexProcessInventory(), DesktopSessions, unaccountedProcesses(), codexSessionContext() (+22 more)

### Community 81 - "Coordinator"
Cohesion: 0.08
Nodes (3): withGitHubSource(), coordination(), Coordinator

### Community 82 - "OfficeSnapshot"
Cohesion: 0.06
Nodes (63): jiraQueueProgress(), nextStage(), DailyCTOSummary, deliveryRoles, JiraQueueProgress, TicketProgress, SnapshotAcceptance, tourStages (+55 more)

### Community 83 - "brain-maintenance.ts"
Cohesion: 0.07
Nodes (35): maintenancePolicies(), sourceReview(), completeNativeCheckpoint(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, brainResultStop(), GateMark (+27 more)

### Community 84 - "viewer.js"
Cohesion: 0.19
Nodes (25): addMetaLink(), addMetaRow(), addRelationship(), applyView(), buildIndexes(), buildLegend(), buildModel(), buildRenderer() (+17 more)

### Community 85 - "weekly-rollup.ts"
Cohesion: 0.13
Nodes (27): learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), RollupResult (+19 more)

### Community 86 - "stopped-record.ts"
Cohesion: 0.07
Nodes (65): capabilityBlockedReviews(), latestReviews(), boundedEvidence(), expectedWait(), StopFacts, FailedMailCheck, lastFailedMailCheck(), lastMailCheckOutcome() (+57 more)

### Community 87 - "sanitize"
Cohesion: 0.05
Nodes (42): ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff(), saveGoals() (+34 more)

### Community 88 - "notifications.ts"
Cohesion: 0.08
Nodes (31): channelNoticeAuthorized(), ChannelSettings, notices(), queueChannelNotice(), currentOutbox(), clamp(), LIMITS, MergedPR (+23 more)

### Community 89 - "process.ts"
Cohesion: 0.19
Nodes (17): exitFailure(), inactivityWatch(), At, Errno, errno(), GroupInventory, GroupProbe, Phase (+9 more)

### Community 90 - "provider-observation.ts"
Cohesion: 0.13
Nodes (26): az(), correlatedBuild(), Azure, azurePipelines(), outcome(), Read, RUNS_PER_PIPELINE, Api (+18 more)

### Community 91 - "readable-jira-comment.ts"
Cohesion: 0.11
Nodes (32): CommentPage, commentReadback(), devUpdate(), HEADLINE, jiraRecord(), unpack(), parksInJira(), postDevUpdate() (+24 more)

### Community 92 - "session-context-client.ts"
Cohesion: 0.13
Nodes (18): readTranscript, readRollout, packContextFailure(), PackedContextFailure, unpackContextFailure(), LiveSession, ContextThread, contextThread() (+10 more)

### Community 93 - "plans.cjs"
Cohesion: 0.12
Nodes (27): fs, main(), parse(), path, atomicWrite(), substantive(), walk(), association() (+19 more)

### Community 94 - "timed-statements.ts"
Cohesion: 0.14
Nodes (17): snapshot(), snapshotText(), redactedText(), StoreTiming, StoreTimings, storeTimings(), NAMED, rowsText() (+9 more)

### Community 96 - "control-store.ts"
Cohesion: 0.20
Nodes (8): checkpointLabel(), applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, statementCache(), initialSnapshot(), initializeStoreSchema()

### Community 97 - "controller-runtime.ts"
Cohesion: 0.08
Nodes (35): [cmd,...rawArgs], DATA, projectData(), StoreDatabase, ControllerEffects, controllerEffects(), DEPLOY_PROJECT, alive() (+27 more)

### Community 98 - "ticket-stage-runner.ts"
Cohesion: 0.15
Nodes (30): endChangeScope(), scopeOutgrown(), confirmsMovedHead(), Moved, movedHeadUnconfirmed(), recordConfirmedHead(), routeConfirmedHead(), resume() (+22 more)

### Community 99 - "archive-plan.cjs"
Cohesion: 0.17
Nodes (22): fs, main(), parse(), path, archive(), cell(), ensureIndex(), fromArgs() (+14 more)

### Community 100 - "call-scope.ts"
Cohesion: 0.14
Nodes (23): failed(), githubAuthError(), refusedByRateLimit(), revalidated, slurpedPages(), succeeded(), boundGitHubRunner(), currentGitHubProject() (+15 more)

### Community 101 - "workKey"
Cohesion: 0.10
Nodes (27): resumeLinkedDelivery(), mergedByOwner(), closeableIssue(), effectsSettled(), eligible(), officePublished(), ownerMerged(), prerequisitesMet() (+19 more)

### Community 102 - "team-conversation-pump.ts"
Cohesion: 0.19
Nodes (18): assertConversationReadback(), pump(), defaultPickupStatus(), savePickup(), APPROACH_GUARD_REJECTION, classifyStop(), stopReason(), harperHandoff() (+10 more)

### Community 103 - "on-merge-sync.cjs"
Cohesion: 0.15
Nodes (28): fs, main(), path, { spawnSync }, fieldSpan(), frontmatterProblems(), keyPattern(), list() (+20 more)

### Community 104 - "backup-stores.ts"
Cohesion: 0.10
Nodes (36): absentAdmission(), AdmissionComparison, AdmissionSnapshot, compareAdmissions(), snapshotAdmissions(), BackupEntry, BackupInput, BackupInventory (+28 more)

### Community 105 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 106 - "deploy-plan.ts"
Cohesion: 0.10
Nodes (43): runningRevision(), runningRevision(), releaseIdentity(), runtimeRevision(), ActiveRelease, readActiveRelease(), BUILD_ENV, buildRelease() (+35 more)

### Community 107 - "remove-candidate.ts"
Cohesion: 0.09
Nodes (38): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), maintenanceCandidate(), moveAside(), moveBack(), purgeRemoved(), purging (+30 more)

### Community 108 - "deployment-fence.ts"
Cohesion: 0.15
Nodes (13): resumeSwitch(), assertToken(), Body, DeploymentFence, DeploymentFenceState, declaredWithin(), deploymentFenceGate(), DeploymentFenceGateContext (+5 more)

### Community 109 - "engine.ts"
Cohesion: 0.20
Nodes (14): enumerateIntakeList(), inPickupOrder(), Intake, text(), checkMail(), drainMail(), requestMail(), jiraResponse() (+6 more)

### Community 110 - "blocker-followups.ts"
Cohesion: 0.10
Nodes (53): conversationReadbackReady(), followupOf(), pendingReadback(), queueConversationReadback(), readbackEnding(), uncertainConversations(), readBackConversations(), followupRecord() (+45 more)

### Community 111 - "report.ts"
Cohesion: 0.26
Nodes (13): CostEntry, Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked() (+5 more)

### Community 112 - "outbox.ts"
Cohesion: 0.12
Nodes (22): metadataParkAction(), ADOPTION_STALLED_MS, conversationResolved(), projectOutbox(), item(), syncOutbox(), OwnerStepItem, ownerStepItems() (+14 more)

### Community 113 - "work.ts"
Cohesion: 0.07
Nodes (39): admitRepairWaits(), Covered, COVERING, expiryEvent(), expiryId(), lastProgress(), progressOf(), RepairWaitEntry (+31 more)

### Community 114 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 115 - "run-cost.ts"
Cohesion: 0.11
Nodes (23): CodexRollout, CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL (+15 more)

### Community 119 - "deploy.ts"
Cohesion: 0.11
Nodes (44): abandon(), advance(), deploy(), exclusively(), unfinishedDeployments(), Commit, DEPLOY_STEPS, DeployFacts (+36 more)

### Community 120 - "features/workflow.ts"
Cohesion: 0.12
Nodes (27): approveFeature(), commandFeature(), featureById(), mutation(), reviewQuestions(), discoveryPrompt(), planPrompt(), Link (+19 more)

### Community 121 - "follow-production.ts"
Cohesion: 0.20
Nodes (17): awaitingJiraStatus(), awaitingProduction(), FOLLOW_DAYS, followed(), isFollowed(), Azure, AzureRead, containedIn() (+9 more)

### Community 122 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (7): CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility, overlayEntranceDelays(), SceneOverlay()

### Community 123 - "deploy-command.ts"
Cohesion: 0.10
Nodes (34): CONTROLLER_ENTRY, ControllerPin, Pin, pinnedController(), readControllerPin(), writeControllerPin(), controllerOf(), deployCommand() (+26 more)

### Community 124 - "refresh-issue-state.cjs"
Cohesion: 0.20
Nodes (19): advanceFence(), closingIssues(), githubRefs(), key(), normalizeGithubQuery(), normalizeRepository(), parseGithubQuery(), ref() (+11 more)

### Community 125 - "knowledge.ts"
Cohesion: 0.06
Nodes (36): curateLesson(), Curation, CurationAction, mergeEvidence(), LessonBrainAudit, LessonBrainOverlap, BRAIN_SCOPE, SUBJECT (+28 more)

### Community 126 - "GitHubDelivery"
Cohesion: 0.08
Nodes (42): removeAdoptedClone(), namedRepairIds(), pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), GitHubDelivery, stoppedBaseCheckout(), assertStoppedBaseCurrent(), originalVersion() (+34 more)

### Community 127 - "accessibility-sources.ts"
Cohesion: 0.23
Nodes (18): accessibilitySources(), actionable(), closingPull(), Finding, handoffIssue(), issueLines(), issueSource(), observation (+10 more)

### Community 128 - "atmosphere.ts"
Cohesion: 0.27
Nodes (8): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), SCENE_COLOR_TOKENS, SceneColors, TOKENS

### Community 129 - "call-ledger.ts"
Cohesion: 0.27
Nodes (9): add(), addSource(), busiest(), Entry, sourceRows(), Sources, CallCounts, noCalls() (+1 more)

### Community 130 - "record-push.ts"
Cohesion: 0.19
Nodes (14): Event, exactCommand(), Invocation, localHookCommand(), one(), prePushRejection(), PushIdentity, retirementBoundary() (+6 more)

### Community 131 - "it-specialist.ts"
Cohesion: 0.18
Nodes (16): replacedReadback(), heldFor(), recoverBoardPreflights(), ITContext, recoveryHeld(), recoveryWait(), informationalRecovery(), ITSpecialist (+8 more)

### Community 132 - "it-report.ts"
Cohesion: 0.20
Nodes (14): followUpPicture(), publishITReport(), archiveOldReports(), RETAINED_REPORTS, archiveByMonth(), archiveHistory(), archiveMonth(), archiveOldTaskDetail() (+6 more)

### Community 133 - "run-accounting.ts"
Cohesion: 0.13
Nodes (30): BoundedRead, done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf(), codexHome(), createdAt() (+22 more)

### Community 134 - "MaintenanceRun"
Cohesion: 0.12
Nodes (22): CheckpointEligibility, brainCheckpointCompletion(), PublishedPR, publishedWorkCleanedUp(), nativeChecks, outcomeKnown(), reconcileCompletedCheckpoints(), settledRun() (+14 more)

### Community 135 - "dates.cjs"
Cohesion: 0.31
Nodes (12): today(), dateFromPlanBasename(), dateFromSessionPath(), evidenceDates(), fileMtimeDate(), fs, gitCommitDate(), inferPlanDate() (+4 more)

### Community 136 - "task-briefing.ts"
Cohesion: 0.14
Nodes (21): committedNotePage(), guidanceExcerpt(), digest(), citations(), recordAcceptedKnowledge(), stageName(), knowledgeCitation(), lessonCitation() (+13 more)

### Community 137 - "Effects"
Cohesion: 0.10
Nodes (28): NOT_LANDED_SETTLE_MS, settleNotLanded(), diagnosticProof(), recoverDiscovery(), publishFeature(), GitHubOperations, validateGitHubIssue(), assignedToJoe() (+20 more)

### Community 138 - "run.ts"
Cohesion: 0.14
Nodes (21): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_FIX_PROMPT, OfficeFixResult (+13 more)

### Community 139 - "Store"
Cohesion: 0.10
Nodes (21): featureItemComplete(), reconcileFeatureCompletion(), GitHubFeaturePublisher, helperTelemetry(), JiraFeaturePublisher, helperInstallation(), observeHelperGroups(), stopHelperGroups() (+13 more)

### Community 140 - "session-snapshot-cleanup.ts"
Cohesion: 0.40
Nodes (5): SNAPSHOT_PREFIX, removeStaleSessionSnapshots(), SNAPSHOT_SWEEP_MS, STALE_SNAPSHOT_MS, sweepStaleSessionSnapshots()

### Community 141 - "scene-motion.ts"
Cohesion: 0.25
Nodes (15): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+7 more)

### Community 142 - "scheduler.ts"
Cohesion: 0.13
Nodes (15): Clock, OfficeCapacity, PROJECT_LOCAL, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork() (+7 more)

### Community 144 - "reconcile-merges.cjs"
Cohesion: 0.22
Nodes (14): collectPulls(), copyWikiForDryRun(), { execFileSync }, flattenPages(), fs, githubRequest(), isWikiBotPull(), main() (+6 more)

### Community 145 - "preferences-store.ts"
Cohesion: 0.21
Nodes (8): fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS, OfficePreferences, OfficePreferencesPatch

### Community 146 - "rootArtifact"
Cohesion: 0.07
Nodes (73): savedActivationFailure(), continuationNativeReview(), candidateInput(), children, oldAdoptionBasis(), savedAdmissionUnresolved(), SavedCandidateAdmission, savedCandidateAdmission() (+65 more)

### Community 147 - "metadata-admission.ts"
Cohesion: 0.10
Nodes (41): field(), FIELDS, MetadataField, metadataFields(), metadataParkWords(), metadataStopWords(), needed(), sentence() (+33 more)

### Community 148 - "runner-root.ts"
Cohesion: 0.22
Nodes (16): DEFAULT_OFFICE_URL, LOOPBACK, officeUrl(), privateDirectories(), RunnerPaths, runnerPaths(), ancestry(), assertDirectoryOrAbsent() (+8 more)

### Community 149 - "project-graphql.ts"
Cohesion: 0.14
Nodes (36): harnessParkedCard(), effectKey(), LaneOperation, laneWrite(), moveCardOnce(), Lane, MOVABLE, moveLane() (+28 more)

### Community 150 - "serve-graph.cjs"
Cohesion: 0.24
Nodes (9): createServer(), fs, http, listen(), attempt(), main(), path, resolveRequest() (+1 more)

### Community 151 - "inspector-props.ts"
Cohesion: 0.22
Nodes (11): SendMessage, acceptPreferences(), PreferenceCandidate, strip(), UNKNOWN_PREFERENCES, OfficePreferencesController, PreferenceFeedback, PreferenceField (+3 more)

### Community 152 - "evidence-artifacts.ts"
Cohesion: 0.31
Nodes (10): evidenceDirectory(), readEvidence(), ProviderEvidence, canonical(), evidenceDigest(), evidenceHash(), semantic(), stableUrl() (+2 more)

### Community 153 - "goal-reviews.ts"
Cohesion: 0.14
Nodes (19): currentCitations(), Fact, NOT_CURRENT, PROVIDER_ERROR, applyGoalReview(), DeliveryJob, EvidenceRefSchema, jobAccepted() (+11 more)

### Community 154 - "judge-resumes.ts"
Cohesion: 0.08
Nodes (43): boundaryCrossed(), Crossing, Progress, CheckpointProgress, checkpointProgress(), names(), nativeProof(), Step (+35 more)

### Community 155 - "recorded-gh-command.ts"
Cohesion: 0.19
Nodes (20): assignments(), changeDirectory(), closing(), CREATE, createGuard(), flags(), named(), read() (+12 more)

### Community 156 - "restart-stopped-writers.ts"
Cohesion: 0.26
Nodes (12): restartStoppedWriters(), unchangedSinceAccepted(), releaseFunds(), stoppedWriter(), writerRestartCandidate(), writerRestarted(), Execute, keptWork() (+4 more)

### Community 157 - "change-scope.ts"
Cohesion: 0.22
Nodes (14): carriedNotRepeated(), applyChangeScope(), levels(), MAX_CHECKS, changeScopeNote(), Scoped, owedUnderScope(), scopeBase() (+6 more)

### Community 158 - "resume-step.ts"
Cohesion: 0.22
Nodes (14): rerunsInterruptedQA(), officeRefusedQA(), Attempt, LOCAL_STAGES, needsResumeReconciliation(), REVIEW_STAGES, stoppedInSetup(), decidedResumeStep() (+6 more)

### Community 161 - "offices.ts"
Cohesion: 0.22
Nodes (8): leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), DELIVERY_CONCURRENCY, InFlightOperations, backfillClaudeCost(), CompletionReader

### Community 162 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 163 - "restoreInPlace"
Cohesion: 0.60
Nodes (5): identity(), Json, plain(), restorable(), restoreInPlace()

### Community 164 - "validate_wiki_pr_body.cjs"
Cohesion: 0.33
Nodes (5): { execFileSync }, hasCanonicalWikiBody(), maintenanceBodies, matchesMaintenanceBody(), { readFileSync }

### Community 165 - "incident-command.ts"
Cohesion: 0.38
Nodes (6): FLAGS, incidentCommand(), IncidentCommandIO, option(), USAGE, whole()

### Community 166 - "resume-moved-head.ts"
Cohesion: 0.35
Nodes (9): draftHeadMovedForward(), git(), movedHeadEvent(), recordMovedHead(), resumeMovedHead(), publicationEvidenceGap(), resultGate(), stageResultGap() (+1 more)

### Community 167 - "create-candidate.ts"
Cohesion: 0.31
Nodes (9): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+1 more)

### Community 168 - "merge-scanner-retry.ts"
Cohesion: 0.40
Nodes (9): officeMergeProvenance(), reconcileMergeScannerRetry(), Retry, retryMergeScanner(), retryReadBack(), runIdentity(), savedRetry(), transientScannerJobs() (+1 more)

### Community 169 - "operationPaths"
Cohesion: 0.49
Nodes (7): fenceTokenDigest(), operationPaths(), createDeployToken(), readDeployToken(), removeDeployToken(), endDeployment(), holdFence()

### Community 170 - "setup-stop-cap.ts"
Cohesion: 0.42
Nodes (8): confirmSetupStopCap(), consecutiveSetupStops(), Counted, isSetupStop(), SETUP_STOP_CAP, setupStopCapConfirmed(), setupStopOn(), shownFor()

### Community 171 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 172 - "QAResultsCard.tsx"
Cohesion: 0.42
Nodes (6): qaResultChanges(), QA_STAGES, qaResults(), qaStatus(), artifact(), Report()

### Community 173 - "normalize-question.ts"
Cohesion: 0.57
Nodes (5): normalizeRound(), folded(), normalizeQuestion(), optionId(), RawQuestion

### Community 174 - "delivery-ownership.ts"
Cohesion: 0.33
Nodes (4): Ownership, ownershipContext, refreshDeliveryOwnership(), RefreshOwnership

### Community 175 - "gate-refused-pass.ts"
Cohesion: 0.40
Nodes (5): GATE_REFUSED, gateRefusedPass(), QA_STAGES, qaEvidenceGap(), QA_GATE_REFUSALS

### Community 176 - "unblock-brief.ts"
Cohesion: 0.53
Nodes (5): clearUnblockBrief(), key(), saveUnblockBrief(), UnblockBrief, unblockBrief()

### Community 177 - "live-reach.ts"
Cohesion: 0.47
Nodes (5): GIT_NETWORK, LIVE_PROVIDERS, liveReach(), networkUrl(), remoteUrls()

### Community 178 - "wait-idle.ts"
Cohesion: 0.40
Nodes (4): Health, IdleObservation, IdleResult, WaitIdleInput

## Knowledge Gaps
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `worker-runtime.ts`, `features.ts`, `daily-cto.ts`, `hasUncertainEffects`, `github/issue-publication.ts`, `office/config.ts`, `admit-improvement.ts`, `advance-metadata-park.ts`, `scheduled-captures.ts`, `run-retrospective.ts`, `record-trigger.ts`, `sign-in-unpark.ts`, `github-delivery.ts`, `accept-stage-result.ts`, `dependency-bots/adopt.ts`, `retrospective-subject.ts`, `jira-time.ts`, `TicketJob`, `ref_node_path`, `goal-reporting.ts`, `github-readiness.ts`, `digest`, `harnessEffect`, `artifact`, `index.ts`, `shared.ts`, `scheduled-work.ts`, `assignments.ts`, `observe-github-merges.ts`, `time-scope.ts`, `Engine`, `.save`, `Offices`, `lesson-selection.ts`, `.emit`, `ledger.ts`, `state-parts.ts`, `jiraBinding`, `pilot-delivery.ts`, `store.ts`, `jira-attempts.ts`, `cost-ledger.ts`, `unsent-time.ts`, `maintenance-readback.ts`, `command`, `resume-arrivals.ts`, `ticket-evidence.ts`, `agents.ts`, `knowledge/routes.ts`, `project-bindings.ts`, `requests.ts`, `session-bridge.ts`, `Coordinator`, `OfficeSnapshot`, `brain-maintenance.ts`, `weekly-rollup.ts`, `stopped-record.ts`, `sanitize`, `notifications.ts`, `provider-observation.ts`, `readable-jira-comment.ts`, `control-store.ts`, `controller-runtime.ts`, `workKey`, `team-conversation-pump.ts`, `remove-candidate.ts`, `engine.ts`, `blocker-followups.ts`, `work.ts`, `features/workflow.ts`, `follow-production.ts`, `GitHubDelivery`, `accessibility-sources.ts`, `record-push.ts`, `it-specialist.ts`, `run-accounting.ts`, `MaintenanceRun`, `task-briefing.ts`, `Effects`, `run.ts`, `scene-motion.ts`, `scheduler.ts`, `rootArtifact`, `metadata-admission.ts`, `project-graphql.ts`, `evidence-artifacts.ts`, `goal-reviews.ts`, `judge-resumes.ts`, `resume-step.ts`, `offices.ts`, `resume-moved-head.ts`, `create-candidate.ts`, `gate-refused-pass.ts`, `diagnostic-snapshot.ts`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **Should `incidents/routes.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06784260515603799 - nodes in this community are weakly interconnected._
- **Why does `command()` connect `command` to `incidents/routes.ts`, `record-push.ts`, `features.ts`, `worker-runtime.ts`, `MaintenanceRun`, `github/issue-publication.ts`, `Effects`, `Store`, `admit-improvement.ts`, `github-delivery.ts`, `accept-stage-result.ts`, `project-graphql.ts`, `jira-time.ts`, `TicketJob`, `ref_node_path`, `goal-reporting.ts`, `restart-stopped-writers.ts`, `digest`, `change-scope.ts`, `harnessEffect`, `github-readiness.ts`, `shared.ts`, `command-registry.ts`, `resume-moved-head.ts`, `create-candidate.ts`, `Engine`, `.save`, `Offices`, `jiraBinding`, `pilot-delivery.ts`, `store.ts`, `jira-attempts.ts`, `cost-ledger.ts`, `unsent-time.ts`, `ticket-evidence.ts`, `agents.ts`, `knowledge/routes.ts`, `service-health.ts`, `project-bindings.ts`, `requests.ts`, `session-bridge.ts`, `Coordinator`, `brain-maintenance.ts`, `weekly-rollup.ts`, `notifications.ts`, `process.ts`, `provider-observation.ts`, `readable-jira-comment.ts`, `controller-runtime.ts`, `ticket-stage-runner.ts`, `call-scope.ts`, `deploy-plan.ts`, `remove-candidate.ts`, `engine.ts`, `features/workflow.ts`, `deploy-command.ts`, `GitHubDelivery`, `accessibility-sources.ts`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Should `OrgChart.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1099290780141844 - nodes in this community are weakly interconnected._
- **Why does `workKey()` connect `workKey` to `features.ts`, `hasUncertainEffects`, `MaintenanceRun`, `Effects`, `run.ts`, `scheduler.ts`, `rootArtifact`, `metadata-admission.ts`, `accept-stage-result.ts`, `dependency-bots/adopt.ts`, `github-delivery.ts`, `TicketJob`, `restart-stopped-writers.ts`, `github-readiness.ts`, `digest`, `harnessEffect`, `artifact`, `shared.ts`, `scheduled-work.ts`, `diagnostic-snapshot.ts`, `store.ts`, `requests.ts`, `stopped-record.ts`, `notifications.ts`, `remove-candidate.ts`, `work.ts`, `GitHubDelivery`, `accessibility-sources.ts`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Should `worker-runtime.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.045769346582354715 - nodes in this community are weakly interconnected._
- **Should `features.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05143570536828964 - nodes in this community are weakly interconnected._