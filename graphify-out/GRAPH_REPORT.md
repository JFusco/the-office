# Graph Report - the-office  (2026-11-28)

## Corpus Check
- 1435 files · ~666,673 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 8293 nodes · 35031 edges · 186 communities (177 shown, 9 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 1130 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2c42baf8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- run-model.ts
- pendingRounds
- agents.ts
- features.ts
- cx
- marker-correction.ts
- budget-ledger.ts
- Button
- incidents/routes.ts
- ServiceHealthPanel.tsx
- pass.ts
- write-boundary.ts
- outbox.ts
- PeoplePanel.tsx
- request.ts
- scheduled-captures.ts
- run-retrospective.ts
- record-trigger.ts
- constellation-runtime.ts
- sandbox-qualification.ts
- command-registry.ts
- overseer-launch.mjs
- delivery-retry.ts
- jira-time.ts
- service-ticks.ts
- index.ts
- conversations/slack.ts
- carried-checks.ts
- advance-metadata-park.ts
- assignments.ts
- digest
- requests.ts
- offices.ts
- post-conflict-preparation.ts
- resume-outcome.ts
- common.cjs
- pr-observation-shape.ts
- routing.cjs
- entry.ts
- maintenance/maintenance.ts
- Outbox.tsx
- time-scope.ts
- demand-facts.ts
- .save
- Offices
- harness-baseline.ts
- credential-spans.ts
- rate-limit-samples.ts
- currentAssignment
- deploy-plan.ts
- FeatureWorkspace.tsx
- sanitize
- investigations/ledger.ts
- trial-comment.ts
- build-overseer-launcher.mjs
- alert-issue.ts
- runner-root.ts
- weekly-rollup.ts
- lesson-selection.ts
- incidents.ts
- cost-ledger.ts
- supersedingDelivery
- OfficeConfigView.tsx
- judge-resumes.ts
- follow-production.ts
- validate_pr_body.cjs
- audit-plan-candidates.cjs
- run.ts
- ref_node_crypto
- App.tsx
- OfficeScene.tsx
- spawn-command.ts
- session-context-file.ts
- projects.ts
- session-scope.ts
- service-health.ts
- project-bindings.ts
- ref_node_path
- call-ledger.ts
- dates.cjs
- session-bridge.ts
- Store
- interrupted-work-recovery.ts
- workKey
- viewer.js
- learning-events.ts
- stopped-record.ts
- halt-report.ts
- superseded-wiki-pr.ts
- ref_node_child_process
- sign-in-unpark.ts
- process.ts
- session-context-client.ts
- plans.cjs
- assignment-poll.ts
- capture-session-clone.py
- unsent-time.ts
- publication.ts
- shared.ts
- archive-plan.cjs
- call-scope.ts
- jira-attempts.ts
- blocker-followups.ts
- on-merge-sync.cjs
- backup-stores.ts
- extract-worker.mjs
- controller-runtime.ts
- dependency-bots/adopt.ts
- bareSpans
- pr-observation-graphql.ts
- create-candidate.ts
- OfficeSnapshot
- brain-maintenance.ts
- index.tsx
- slack-supersession.ts
- pre-push-boundary.ts
- qa.ts
- qa-plan-continuation.ts
- writer-restart.ts
- timed-statements.ts
- useLiveTiming.ts
- npm-inventory.ts
- daily-cto.ts
- deploy-command.ts
- refresh-issue-state.cjs
- .emit
- json-layers.ts
- cec.ts
- indeterminate
- route-head.ts
- discovery-recovery.ts
- bare-value.ts
- release-marker-stop.ts
- coordination.ts
- control-store.ts
- triage.ts
- knowledge.ts
- it-specialist.ts
- release-unpark.ts
- scheduled-work.ts
- classify-marked-commits.ts
- metadata-park-words.ts
- scheduler.ts
- production.ts
- reconcile-merges.cjs
- restoreInPlace
- artifact
- run-accounting.ts
- reader-profiles.ts
- redactEvidence
- repoRoot
- shipped-paths.ts
- record-runner-failure.ts
- .transaction
- delivery-ownership.ts
- recorded-gh-command.ts
- retry-label.ts
- observe-github-merges.ts
- push-credentials.ts
- routing.js
- work.ts
- unblock-brief.ts
- github-check-selection.ts
- original-git.ts
- telemetry/report.ts
- accessibility-sources.ts
- launch.mjs
- release-marker-policy.ts
- admit-improvement.ts
- JiraWorklogTransport
- it-report.ts
- service-plist.ts
- goal-reviews.ts
- qa-plan-retry.ts
- restart-writer.ts
- preferences-store.ts
- session-snapshot-cleanup.ts
- deploy.ts
- github-delivery.ts
- marker-adoption.ts
- packed-consumer-pnpm.ts
- harnessEffect
- Goals.tsx
- ref_zod
- cli.ts
- evidenceText

## God Nodes (most connected - your core abstractions)
1. `Store` - 505 edges
2. `TicketJob` - 263 edges
3. `digest()` - 183 edges
4. `command()` - 168 edges
5. `GitHubDelivery` - 149 edges
6. `holdReason()` - 145 edges
7. `OfficeSnapshot` - 123 edges
8. `artifact()` - 121 edges
9. `StageResult` - 117 edges
10. `workKey()` - 112 edges

## Surprising Connections (you probably didn't know these)
- `publish()` --indirect_call--> `title()`  [INFERRED]
  scripts/graphify/publish-refresh.cjs → src/knowledge/map/grouping.ts
- `BreakdownTable()` --indirect_call--> `cell()`  [INFERRED]
  src/telemetry/BreakdownTable.tsx → scripts/wiki/archive-plan.cjs
- `apply()` --indirect_call--> `note()`  [INFERRED]
  src/conversations/OutboxSavedImplementation.tsx → server/cec/parking/resume-parked.ts
- `UnrecordedResult` --references--> `StageResult`  [EXTRACTED]
  server/cec/unrecorded-result.ts → src/shared.ts
- `CurrentMark()` --indirect_call--> `marker()`  [INFERRED]
  src/work/timeline/TicketTimeline.tsx → server/delivery/closeout/superseded-wiki-pr.ts

## Import Cycles
- 2-file cycle: `server/scheduling/coordination-pump.ts -> server/scheduling/coordination.ts -> server/scheduling/coordination-pump.ts`
- 2-file cycle: `server/scheduling/coordination-tick.ts -> server/scheduling/coordination.ts -> server/scheduling/coordination-tick.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/track-adopted-review.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/stage-reconciliation.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/readiness/automation-conflict.ts -> server/delivery/readiness/automation-merge.ts -> server/delivery/readiness/automation-conflict.ts`
- 2-file cycle: `server/delivery/pipeline/accept-stage-result.ts -> server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/accept-stage-result.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/publication/metadata-context.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/refresh-merge-review.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/closeout/github-closeout.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/implementation/saved-prerequisite-handoff.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/queue-repairs.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/knowledge/lesson-exits.ts -> server/scheduling/requests.ts -> server/knowledge/lesson-exits.ts`
- 2-file cycle: `server/conversations/conversations.ts -> server/conversations/cto-conversations.ts -> server/conversations/conversations.ts`
- 2-file cycle: `server/conversations/notifications.ts -> server/conversations/slack.ts -> server/conversations/notifications.ts`
- 2-file cycle: `server/workers/process.ts -> server/workers/spawn-command.ts -> server/workers/process.ts`
- 2-file cycle: `src/contracts/people.ts -> src/shared.ts -> src/contracts/people.ts`
- 2-file cycle: `src/contracts/timing.ts -> src/shared.ts -> src/contracts/timing.ts`
- 2-file cycle: `src/contracts/work.ts -> src/shared.ts -> src/contracts/work.ts`
- 3-file cycle: `server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts`

## Communities (186 total, 9 thin omitted)

### Community 0 - "run-model.ts"
Cohesion: 0.03
Nodes (136): AttributedFailure, InvocationResult, NotDispatched, claudeGeneration(), ClaudeSignIn, normalizeClaudeToken(), readClaudeSignIn(), claimText() (+128 more)

### Community 1 - "pendingRounds"
Cohesion: 0.11
Nodes (29): automaticIntakeWait(), IntakeView, confirmBrief(), FeaturePlanningBindings, assertQuestionVisibility(), applyHarnessAction(), HarnessActionInput, harnessQuestion() (+21 more)

### Community 2 - "agents.ts"
Cohesion: 0.04
Nodes (80): implementationWorkerContext(), RefusedQAResult, savedStageCompletion(), assertContinuableWorktree(), CONTINUABLE, continuationPrompt(), MAX_CONTINUATIONS, recordedContinuation() (+72 more)

### Community 3 - "features.ts"
Cohesion: 0.06
Nodes (74): approveFeature(), commandFeature(), featureById(), mutation(), reviewQuestions(), assertFeatureDependencyOrder(), featureDependencyEdges(), key() (+66 more)

### Community 4 - "cx"
Cohesion: 0.09
Nodes (87): labels, ServiceHealthRow(), BlockerFollowups(), LearningCoverage(), Evidence(), LessonCard(), LessonShape(), lessonsView() (+79 more)

### Community 5 - "marker-correction.ts"
Cohesion: 0.13
Nodes (25): correctionChecks(), HISTORY_SENSITIVE, HISTORY_UNRUNNABLE, REQUIRED_HISTORY_CHECKS, requiredScripts(), CorrectionInput, CorrectionOutcome, retain() (+17 more)

### Community 6 - "budget-ledger.ts"
Cohesion: 0.06
Nodes (56): abandonExpired(), Admission, admit(), admitDeployment(), balance(), bindEvidence(), count(), errcode() (+48 more)

### Community 7 - "Button"
Cohesion: 0.07
Nodes (63): KnowledgeActivity, KnowledgeActivityPage, KnowledgeEdge, KnowledgeMap, KnowledgeNode, Activity(), ActivityTimeline(), AssignmentKnowledge() (+55 more)

### Community 8 - "incidents/routes.ts"
Cohesion: 0.08
Nodes (50): citationFault(), CitationSchema, SourceVersions, dismiss(), DISMISSAL_CITATIONS, DISMISSAL_REASON, DismissalFacts, DismissalRequest (+42 more)

### Community 9 - "ServiceHealthPanel.tsx"
Cohesion: 0.10
Nodes (34): DailyCTOSummary, TelemetryReport, blockedSummary(), itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps(), currentServices() (+26 more)

### Community 10 - "pass.ts"
Cohesion: 0.04
Nodes (89): FailureAnswer, failureLine(), HaltAnswer, LINE_LIMIT, DEFAULT_OFFICE_URL, LOOPBACK, officeUrl(), RUNNER_DEFAULTS (+81 more)

### Community 11 - "write-boundary.ts"
Cohesion: 0.04
Nodes (110): ActiveEntry, effectId(), entry(), fail(), GitHubAppConfig, KeychainKeySource, KnownProject, only() (+102 more)

### Community 12 - "outbox.ts"
Cohesion: 0.10
Nodes (30): capabilityBlockedReviews(), latestReviews(), metadataParkAction(), ADOPTION_STALLED_MS, conversationResolved(), projectOutbox(), item(), syncOutbox() (+22 more)

### Community 13 - "PeoplePanel.tsx"
Cohesion: 0.10
Nodes (41): label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+33 more)

### Community 14 - "request.ts"
Cohesion: 0.08
Nodes (70): refusal(), observeAutomationConflict(), VERB, assertAutomationEffects(), automationMergePolicy(), observeAutomationMerge(), REBASE, rebaseArgs() (+62 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.12
Nodes (52): createFeature(), discoveryPrompt(), assertEnrollable(), bindFeature(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture() (+44 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.10
Nodes (42): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, BlockingTrigger, blockingTrigger(), isBlocking() (+34 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.11
Nodes (37): bindLegacyRetries(), LEGACY_LIMIT, baselined(), baselineLearning(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences() (+29 more)

### Community 18 - "constellation-runtime.ts"
Cohesion: 0.07
Nodes (29): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), CameraPose, flightPose(), cameraTarget() (+21 more)

### Community 19 - "sandbox-qualification.ts"
Cohesion: 0.04
Nodes (89): timeoutsValid(), ReaderAuthentication, RunDirectories, within(), ALLOW_PROBES, BatteryExpected, Binding, boundTo() (+81 more)

### Community 20 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 21 - "overseer-launch.mjs"
Cohesion: 0.07
Nodes (80): acquireLauncherLock(), alone(), ancestry(), assertDirectoryOrAbsent(), attemptRecord(), bounded(), boundedString(), checkOwnedFile() (+72 more)

### Community 22 - "delivery-retry.ts"
Cohesion: 0.08
Nodes (60): DeliveryRetryDecision, deliveryRetryDecision(), deliveryRetryDecisions(), readOnlyStageJob(), retryable(), RetryStore, UnsettledRead, BOARD_STOP (+52 more)

### Community 23 - "jira-time.ts"
Cohesion: 0.10
Nodes (43): unresolvedAttempts(), bindingOf(), connectWith(), data(), envelope(), finishVerifiedEffects(), JiraWorklogs, locks (+35 more)

### Community 24 - "service-ticks.ts"
Cohesion: 0.12
Nodes (32): sourceVersions(), inHistoryOf(), CompareMemory, compareMemory(), COMPARES_PER_PASS, comparison(), DeployedFixes, DeployedFixesInput (+24 more)

### Community 25 - "index.ts"
Cohesion: 0.04
Nodes (66): implementationContinuationRoute(), qaPlanRetryRoute(), servedOutbox(), isNotice(), readNotices(), resumeSwitch(), failure(), halt() (+58 more)

### Community 26 - "conversations/slack.ts"
Cohesion: 0.09
Nodes (19): cecReconcilePrompt(), channelNoticeAuthorized(), slackVerifyPrompt(), comparableSlackText(), labelIsUrl(), dueSlackReread(), rereadUncertainSlack(), runningRevision() (+11 more)

### Community 27 - "carried-checks.ts"
Cohesion: 0.15
Nodes (22): latestQA(), notPassedInLatestQA(), QACoverage, qaCoverage(), same(), Tested, safeWebUrl(), officeValidation() (+14 more)

### Community 28 - "advance-metadata-park.ts"
Cohesion: 0.08
Nodes (72): advanceMetadataPark(), Parked, releaseWords(), sentAnything(), cardResumeRoute(), effectiveParkPickup(), PICKUP_ASSIGNEE, REVIEWABLE (+64 more)

### Community 29 - "assignments.ts"
Cohesion: 0.07
Nodes (42): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, CommittedBrain (+34 more)

### Community 30 - "digest"
Cohesion: 0.07
Nodes (87): retryRead(), createdContentSha256(), Binding, historyBeforeWrite(), matchesBoundDescription(), DescriptionEdit, DescriptionHistory, DescriptionHistoryUnavailable (+79 more)

### Community 31 - "requests.ts"
Cohesion: 0.13
Nodes (36): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+28 more)

### Community 32 - "offices.ts"
Cohesion: 0.28
Nodes (6): leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), DELIVERY_CONCURRENCY, InFlightOperations

### Community 33 - "post-conflict-preparation.ts"
Cohesion: 0.07
Nodes (63): candidateInput(), children, oldAdoptionBasis(), SavedCandidateAdmission, savedCandidateAdmission(), assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate() (+55 more)

### Community 34 - "resume-outcome.ts"
Cohesion: 0.09
Nodes (30): FLAGS, incidentCommand(), IncidentCommandIO, option(), USAGE, whole(), boundaryCrossed(), Crossing (+22 more)

### Community 35 - "common.cjs"
Cohesion: 0.15
Nodes (26): connections(), fs, main(), path, crypto, ensureInside(), { execFileSync }, fs (+18 more)

### Community 36 - "pr-observation-shape.ts"
Cohesion: 0.19
Nodes (20): withGitHubOperation(), closingDirectives(), ObservedPR, enumValue(), fail(), graphqlPR(), mapped(), member() (+12 more)

### Community 37 - "routing.cjs"
Cohesion: 0.12
Nodes (28): fs, main(), path, { spawnSync }, frontmatterProblems(), adjacency(), edgeCost(), edgeKey() (+20 more)

### Community 38 - "entry.ts"
Cohesion: 0.11
Nodes (22): EntryRead, EntrySchema, ID_MAX, parseEntry(), PATH_MAX, PATHS_MAX, PLAYBOOK_KINDS, PLAYBOOK_STAGES (+14 more)

### Community 39 - "maintenance/maintenance.ts"
Cohesion: 0.04
Nodes (34): AzureMonitor, checkMail(), drainMail(), requestMail(), enableNightly(), APPROACH_GUIDANCE, reviewInstructions(), deliveryTask() (+26 more)

### Community 40 - "Outbox.tsx"
Cohesion: 0.06
Nodes (52): knowledgeOutbox(), ChatMarkdown(), Conversation(), send(), ConversationDraft, SendMessage, LessonDecisionAction, lessonDecisionState() (+44 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.21
Nodes (20): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), ticketDayTotals(), captureTime() (+12 more)

### Community 42 - "demand-facts.ts"
Cohesion: 0.12
Nodes (23): clip(), DEMAND_LIMIT, demandFacts(), DemandSection, key(), LessonKey, notes(), clip() (+15 more)

### Community 43 - ".save"
Cohesion: 0.07
Nodes (67): enumerateIntakeList(), inPickupOrder(), Intake, text(), resolveBlockedTransition(), document(), transitionWithComment(), jiraAccount() (+59 more)

### Community 44 - "Offices"
Cohesion: 0.11
Nodes (8): QuestionNotifications, mirrorOfficeKnowledge(), file, project, root, projectById(), Offices, markCaptureStart()

### Community 45 - "harness-baseline.ts"
Cohesion: 0.15
Nodes (22): BaselineReport, baselineReport(), BaselineSource, baselineText(), millions(), row(), share(), add() (+14 more)

### Community 46 - "credential-spans.ts"
Cohesion: 0.06
Nodes (39): AFTER_LABEL, BARE_CREDENTIAL, BARE_LABEL, BARE_UNIT, BARE_VALUE, CAMEL_START, CONTROL_ESCAPE, CREDENTIAL_NAME (+31 more)

### Community 47 - "rate-limit-samples.ts"
Cohesion: 0.10
Nodes (19): bindGitHubRunner(), Runner, GitHubCalls, AppPrincipals, WriteCredential, SelectedWriter, credentialOptions(), currentPrincipal() (+11 more)

### Community 48 - "currentAssignment"
Cohesion: 0.05
Nodes (66): savedImplementation(), ContinuationIO, nativeIO, assertOwnership(), decideImplementation(), ImplementationDecision, implementationPreview(), OwnershipRead (+58 more)

### Community 49 - "deploy-plan.ts"
Cohesion: 0.17
Nodes (22): runningRevision(), runningRevision(), ROOT, Body, DeploymentFenceState, fenceTokenDigest(), runtimeRevision(), operationPaths() (+14 more)

### Community 50 - "FeatureWorkspace.tsx"
Cohesion: 0.11
Nodes (29): FeatureQuestionProjection, OutboxQuestionRound(), send(), FeatureDelivery(), FeatureDocuments(), views, FeatureReading(), FeatureWorkspace() (+21 more)

### Community 51 - "sanitize"
Cohesion: 0.05
Nodes (63): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+55 more)

### Community 52 - "investigations/ledger.ts"
Cohesion: 0.13
Nodes (21): diagnosticSnapshot(), acceptedCompletionResolution(), investigationCandidates(), investigationId(), finishedSubjectResolution(), investigationFollowUps(), implementationReplacementResolution(), interruptedQARerunResolution() (+13 more)

### Community 53 - "trial-comment.ts"
Cohesion: 0.08
Nodes (59): commentId(), CommentIntent, CommentReceipt, conversation(), exact(), findProofComment(), matchesProofComment(), postProofComment() (+51 more)

### Community 54 - "build-overseer-launcher.mjs"
Cohesion: 0.20
Nodes (8): BANNER, builtin(), bundleLauncher(), LAUNCHER_BUNDLE, LAUNCHER_ENTRY, launcherChunk(), REPOSITORY, SCRIPT

### Community 55 - "alert-issue.ts"
Cohesion: 0.18
Nodes (19): AlertIssue, alertIssueBody(), alertIssueTitle(), alertMarker(), ensureAlertIssue(), findAlertIssue(), Guard, issueTarget() (+11 more)

### Community 56 - "runner-root.ts"
Cohesion: 0.07
Nodes (64): header(), readStanding(), guardPresent(), overseerCommand(), reconcileArgs(), resolveCliRoot(), runnerStatus(), privateDirectories() (+56 more)

### Community 57 - "weekly-rollup.ts"
Cohesion: 0.11
Nodes (27): deliveryMetrics(), median(), learningMetrics(), maintenanceSubject(), MaintenanceSubjectFacts, RollupResult, azurePrUrl(), findSubject() (+19 more)

### Community 58 - "lesson-selection.ts"
Cohesion: 0.11
Nodes (21): INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, LessonSelection, MAINTENANCE, MAX_LESSONS, normalPath() (+13 more)

### Community 59 - "incidents.ts"
Cohesion: 0.08
Nodes (44): ObservedIncident, ObservedSubject, ClaimedRange, ResolvedRange, eventId(), digest(), fingerprint(), incidentId() (+36 more)

### Community 60 - "cost-ledger.ts"
Cohesion: 0.13
Nodes (31): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress(), effectId() (+23 more)

### Community 61 - "supersedingDelivery"
Cohesion: 0.40
Nodes (7): projectSlackDeliveries(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint(), supersedingDelivery(), slackHealth()

### Community 62 - "OfficeConfigView.tsx"
Cohesion: 0.33
Nodes (9): loadOfficeConfig(), OfficeConfigSection(), autoAdoptText(), BOT_NAMES, OfficeConfigState, OfficeConfigView(), policyText(), releaseMarkerText() (+1 more)

### Community 63 - "judge-resumes.ts"
Cohesion: 0.08
Nodes (34): PacketInput, absent(), IncidentChange, IncidentLedger, isOpen(), Recorded, judgeResumes(), JudgeResumesInput (+26 more)

### Community 64 - "follow-production.ts"
Cohesion: 0.21
Nodes (16): awaitingJiraStatus(), awaitingProduction(), FOLLOW_DAYS, followed(), Azure, AzureRead, containedIn(), followProduction() (+8 more)

### Community 65 - "validate_pr_body.cjs"
Cohesion: 0.36
Nodes (8): fs, main(), readableText(), REQUIRED_CHECKS, REQUIRED_SECTIONS, sections(), validatePullRequestBody(), withoutComments()

### Community 66 - "audit-plan-candidates.cjs"
Cohesion: 0.14
Nodes (31): audit(), branchIssueNumbers(), classify(), distinctiveTitleWords(), { execFileSync }, extractPaths(), findPrForMergeSubject(), fmtCommit() (+23 more)

### Community 67 - "run.ts"
Cohesion: 0.13
Nodes (23): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, syncInvestigations(), OFFICE_FIX_PROMPT (+15 more)

### Community 68 - "ref_node_crypto"
Cohesion: 0.11
Nodes (62): SETUP_STOP_CAP, admissible(), OWN_RECONCILIATION, STOPPED, canonical(), CheckpointEligibility, checkpointEligibility(), admitAssignmentResume() (+54 more)

### Community 69 - "App.tsx"
Cohesion: 0.05
Nodes (63): createConversationDrafts(), BrainDrawer(), releaseSoundEvents, themeColor, App(), BrainWorkspace, CONNECTION, CONNECTION_DOT (+55 more)

### Community 70 - "OfficeScene.tsx"
Cohesion: 0.07
Nodes (62): planningAssessable(), TicketPlanningAction(), displayAgentTask(), githubStageLabels, withoutElapsed(), CameraBookmark, restoreBookmark(), LiveAgentTask() (+54 more)

### Community 71 - "spawn-command.ts"
Cohesion: 0.14
Nodes (22): childEnvironment(), inactivityWatch(), At, Errno, errno(), GroupInventory, GroupProbe, LifecycleDiagnostic (+14 more)

### Community 72 - "session-context-file.ts"
Cohesion: 0.20
Nodes (14): ContextFoldPrefix, contextFoldPrefix(), SessionContextCheckpoint, captureSessionContextClone(), ContextReadPhase, SessionContextDeadline, sessionContextFile(), ContextReadChanged (+6 more)

### Community 73 - "projects.ts"
Cohesion: 0.06
Nodes (69): escaped(), IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), intakeMembership(), projectListScope(), cecIntakePrompt() (+61 more)

### Community 74 - "session-scope.ts"
Cohesion: 0.18
Nodes (17): Bound, claudeScopeParser(), claudeSessionScope(), CLAUDE_TRANSCRIPTS, CODEX_ROLLOUTS, contextReaders(), retainSessionMessage(), SessionConversation (+9 more)

### Community 75 - "service-health.ts"
Cohesion: 0.15
Nodes (18): ClaudeLoginRefusal, claudeLoginRefusal(), claudeRefusalWords(), RECORDED_REFUSALS, refusedClaudeRow(), ProviderStatusChecks, claudeSignedOut(), claudeStatus() (+10 more)

### Community 76 - "project-bindings.ts"
Cohesion: 0.06
Nodes (57): az(), buildUrl(), correlatedBuild(), prUrl(), readInPairs(), ProviderPR, readAzurePRs(), fullActivePRs() (+49 more)

### Community 77 - "ref_node_path"
Cohesion: 0.06
Nodes (57): GitRead, nativeGitRead(), patchArgs, sha(), sourceCopyMatches(), sourceFiles(), absent(), candidateParent() (+49 more)

### Community 78 - "call-ledger.ts"
Cohesion: 0.25
Nodes (9): add(), addSource(), busiest(), CallLedger, Entry, sourceRows(), Sources, CallCounts (+1 more)

### Community 79 - "dates.cjs"
Cohesion: 0.31
Nodes (12): today(), dateFromPlanBasename(), dateFromSessionPath(), evidenceDates(), fileMtimeDate(), fs, gitCommitDate(), inferPlanDate() (+4 more)

### Community 80 - "session-bridge.ts"
Cohesion: 0.10
Nodes (30): claudeSessionContext(), codexDaemonProcesses(), accountCodexProcesses(), CodexProcessInventory, codexProcessInventory(), DesktopSessions, unaccountedProcesses(), codexSessionContext() (+22 more)

### Community 81 - "Store"
Cohesion: 0.06
Nodes (70): findingsBlock(), metadataCarriedAdvisoryIds(), ownedBefore(), QA_STAGES, reviewAdvisoryIds(), Reviewed, withoutReviewAdvisories(), handsOff() (+62 more)

### Community 82 - "interrupted-work-recovery.ts"
Cohesion: 0.36
Nodes (7): interruptAdoptions(), legacy(), REMOVED_FIELDS, retireLegacyRecovery(), goalNoticeNeverDispatched(), maintenanceNoticeNeverDispatched(), recover()

### Community 83 - "workKey"
Cohesion: 0.07
Nodes (54): StoppedWriter, initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), maintenanceCandidate(), moveAside(), moveBack(), purgeRemoved() (+46 more)

### Community 84 - "viewer.js"
Cohesion: 0.19
Nodes (25): addMetaLink(), addMetaRow(), addRelationship(), applyView(), buildIndexes(), buildLegend(), buildModel(), buildRenderer() (+17 more)

### Community 85 - "learning-events.ts"
Cohesion: 0.42
Nodes (6): improvementIntakeGate(), captureLearning(), learningDigest(), recordLearningOpportunity(), captureMaintenanceStep(), LearningOpportunity

### Community 86 - "stopped-record.ts"
Cohesion: 0.07
Nodes (63): boundedEvidence(), expectedWait(), StopFacts, FailedMailCheck, lastFailedMailCheck(), lastMailCheckOutcome(), MailCheckOutcome, normalizeCause() (+55 more)

### Community 87 - "halt-report.ts"
Cohesion: 0.09
Nodes (24): FailureReceipt, haltCondition(), forwardFailures(), forwardIntent(), ForwardSummary, Standing, EMPTY_HALT, ForwardCursor (+16 more)

### Community 88 - "superseded-wiki-pr.ts"
Cohesion: 0.11
Nodes (51): abandon(), assertOpenSnapshot(), awaitingContainment(), closeIssue(), CloseRevalidationError, closeSuperseded(), comment(), CommentStep (+43 more)

### Community 89 - "ref_node_child_process"
Cohesion: 0.07
Nodes (30): changedPaths(), { execFileSync }, files, isMapInput(), mapOnly(), { execFileSync }, git(), publish() (+22 more)

### Community 90 - "sign-in-unpark.ts"
Cohesion: 0.18
Nodes (19): hasPendingDelivery(), resumeAfterSignIn(), signInWait(), MAX_SIGN_IN_UNPARKS, unparkSignedIn(), waitingStep(), BrowserPage, browserPages() (+11 more)

### Community 91 - "process.ts"
Cohesion: 0.05
Nodes (71): carriedNotRepeated(), changeScopeNote(), Scoped, CommentPage, commentReadback(), devUpdate(), HEADLINE, Assignment (+63 more)

### Community 92 - "session-context-client.ts"
Cohesion: 0.13
Nodes (18): readTranscript, readRollout, packContextFailure(), PackedContextFailure, unpackContextFailure(), LiveSession, ContextThread, contextThread() (+10 more)

### Community 93 - "plans.cjs"
Cohesion: 0.19
Nodes (20): remoteSlug(), walk(), association(), auditedDigests(), candidate(), cleanCursor(), collapseByTitle(), discover() (+12 more)

### Community 94 - "assignment-poll.ts"
Cohesion: 0.05
Nodes (50): currentOutbox(), confirmedGone(), goneQuery(), STOPPED, stoppedReviewKeys(), adoptDependabot(), openDependabotPulls(), trackDependabotAlerts() (+42 more)

### Community 96 - "unsent-time.ts"
Cohesion: 0.19
Nodes (13): publishableEntry(), settlementPending(), superseded(), ticketUnresolved(), TimeLedger, clearUnsent(), dueUnsent(), markUnsent() (+5 more)

### Community 97 - "publication.ts"
Cohesion: 0.08
Nodes (17): contentSchema(), JiraIssuePublisher, descriptionPreimage(), plain(), publicationDescription(), FeaturePublisher, PublicationReceipt, publishFeature() (+9 more)

### Community 98 - "shared.ts"
Cohesion: 0.05
Nodes (98): candidateBranchMoved(), applyChangeScope(), endChangeScope(), levels(), MAX_CHECKS, owedUnderScope(), scopeBase(), scopeOutgrown() (+90 more)

### Community 99 - "archive-plan.cjs"
Cohesion: 0.17
Nodes (21): fs, main(), parse(), path, archive(), cell(), ensureIndex(), fromArgs() (+13 more)

### Community 100 - "call-scope.ts"
Cohesion: 0.09
Nodes (43): boardReadFailure(), failed(), githubAuthError(), graphqlCounts(), noCalls(), refusedByRateLimit(), revalidated, slurpedPages() (+35 more)

### Community 101 - "jira-attempts.ts"
Cohesion: 0.12
Nodes (23): attempted(), attemptState(), bound(), covers(), JiraAttempt, jiraAttempts(), JiraAttemptState, open() (+15 more)

### Community 102 - "blocker-followups.ts"
Cohesion: 0.11
Nodes (49): conversationReadbackReady(), followupOf(), pendingReadback(), queueConversationReadback(), readbackEnding(), uncertainConversations(), readBackConversations(), followupRecord() (+41 more)

### Community 103 - "on-merge-sync.cjs"
Cohesion: 0.19
Nodes (22): fieldSpan(), keyPattern(), list(), parseListLiteral(), quote(), render(), scalar(), splitFrontmatter() (+14 more)

### Community 104 - "backup-stores.ts"
Cohesion: 0.10
Nodes (36): absentAdmission(), AdmissionComparison, AdmissionSnapshot, compareAdmissions(), snapshotAdmissions(), BackupEntry, BackupInput, BackupInventory (+28 more)

### Community 105 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 106 - "controller-runtime.ts"
Cohesion: 0.13
Nodes (17): projectData(), StoreDatabase, ControllerEffects, controllerEffects(), DEPLOY_PROJECT, alive(), ControllerMachine, option() (+9 more)

### Community 107 - "dependency-bots/adopt.ts"
Cohesion: 0.09
Nodes (40): Execute, closesIssue(), linkedBody(), linkPR(), DependabotPR, dependabotPR(), ensureTrackingIssue(), findTrackingIssue() (+32 more)

### Community 108 - "bareSpans"
Cohesion: 0.18
Nodes (16): apostropheEnd(), bareSpans(), credentialSpans(), genuineGap(), headerValueEnd(), isQueryLabel(), labelBefore(), nameEnd() (+8 more)

### Community 109 - "pr-observation-graphql.ts"
Cohesion: 0.13
Nodes (29): ChildRequest, headCheckRuns(), includeBody(), readOpenPRs(), commitOf(), ConnectionPages, embeddedHead(), fail() (+21 more)

### Community 110 - "create-candidate.ts"
Cohesion: 0.31
Nodes (9): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+1 more)

### Community 111 - "OfficeSnapshot"
Cohesion: 0.09
Nodes (42): compactSteps(), TicketProgress, OfficeSnapshot, ROLE_NAMES, deliveryRepairProjection(), card, ACTIVE, maintenanceUpdate() (+34 more)

### Community 112 - "brain-maintenance.ts"
Cohesion: 0.06
Nodes (49): maintenancePolicies(), completeNativeCheckpoint(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, brainResultStop(), BrainStatusSchema, identity (+41 more)

### Community 113 - "index.tsx"
Cohesion: 0.07
Nodes (60): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS, PickupForm(), acceptPreferences() (+52 more)

### Community 114 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 115 - "pre-push-boundary.ts"
Cohesion: 0.24
Nodes (11): Event, exactCommand(), Invocation, localHookCommand(), one(), prePushRejection(), PushIdentity, retirementBoundary() (+3 more)

### Community 119 - "timed-statements.ts"
Cohesion: 0.17
Nodes (14): StoreTiming, StoreTimings, storeTimings(), NAMED, rowsText(), rowText(), SQL_TOKEN, statementName() (+6 more)

### Community 120 - "useLiveTiming.ts"
Cohesion: 0.26
Nodes (12): lastWall, sample(), subscribe(), subscribers, useLiveClock(), liveBuildTiming(), liveTiming(), LiveWorkerDisplay (+4 more)

### Community 121 - "npm-inventory.ts"
Cohesion: 0.24
Nodes (13): assertSingleRoot(), Inventory, npmEnvironment(), NpmTool, PACK_FLAGS, packInventory(), parsePack(), relative() (+5 more)

### Community 122 - "daily-cto.ts"
Cohesion: 0.08
Nodes (31): expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), DailyCTO, EvidenceRequestConflict (+23 more)

### Community 123 - "deploy-command.ts"
Cohesion: 0.07
Nodes (58): CONTROLLER_ENTRY, ControllerPin, Pin, pinnedController(), readControllerPin(), writeControllerPin(), CONTROLLER_RUNTIME, ControllerStartCheck (+50 more)

### Community 124 - "refresh-issue-state.cjs"
Cohesion: 0.20
Nodes (19): advanceFence(), closingIssues(), githubRefs(), key(), normalizeGithubQuery(), normalizeRepository(), parseGithubQuery(), ref() (+11 more)

### Community 125 - ".emit"
Cohesion: 0.08
Nodes (38): requestQAPlanRetry(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR (+30 more)

### Community 126 - "json-layers.ts"
Cohesion: 0.26
Nodes (9): decode(), decodedIndex(), evenRunBefore(), JsonLayers, LayerString, opensValue(), SIMPLE, strings() (+1 more)

### Community 127 - "cec.ts"
Cohesion: 0.05
Nodes (61): movedHeadNote(), cecPrompt(), resolvedDecisionNote(), stageInstructions, stageInstructionsFor(), readbackDispatchGuidance(), REVIEW_FINDINGS_RULE, currentEnvironmentWait() (+53 more)

### Community 128 - "indeterminate"
Cohesion: 0.32
Nodes (15): CommitObject, commitOid(), MAX_SUFFIX, parseCommit(), readCommit(), readSuffix(), withFinalLF(), applyCorrection() (+7 more)

### Community 129 - "route-head.ts"
Cohesion: 0.05
Nodes (73): writerRestartPending(), deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, requireDeliveryAuthority(), deliveryIntakeBlocker(), gateRegisteredDelivery() (+65 more)

### Community 130 - "discovery-recovery.ts"
Cohesion: 0.27
Nodes (10): Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership, rawHash() (+2 more)

### Community 131 - "bare-value.ts"
Cohesion: 0.30
Nodes (11): BareValue, bareValue(), deeperValueEnd(), ENDS, isSeparator(), plainEscape(), queryValue(), separatorEscapeAt() (+3 more)

### Community 132 - "release-marker-stop.ts"
Cohesion: 0.13
Nodes (23): Classification, attachCheckout(), interruptCorrectionAtStartup(), interruptedCorrection(), observeCorrectionCheckout(), observeInterruptedCorrections(), pendingOf(), persistMarkerStop() (+15 more)

### Community 133 - "coordination.ts"
Cohesion: 0.07
Nodes (61): MergeNotifications, reconcileNoticeConfirmations(), Admission, admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, compatible() (+53 more)

### Community 134 - "control-store.ts"
Cohesion: 0.09
Nodes (23): applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, readSavedState(), LARGE_KEY_CHARS, plain(), RedactedEntries (+15 more)

### Community 135 - "triage.ts"
Cohesion: 0.04
Nodes (93): resolveRange(), Agreement, agreement(), anchor(), compare(), disposition(), factsKey(), file() (+85 more)

### Community 136 - "knowledge.ts"
Cohesion: 0.06
Nodes (36): curateLesson(), Curation, CurationAction, mergeEvidence(), LessonBrainAudit, LessonBrainOverlap, BRAIN_SCOPE, SUBJECT (+28 more)

### Community 137 - "it-specialist.ts"
Cohesion: 0.21
Nodes (10): replacedReadback(), heldFor(), recoveryWait(), informationalRecovery(), ITSpecialist, ownAzureCheck(), delays, recoverAttempt() (+2 more)

### Community 138 - "release-unpark.ts"
Cohesion: 0.33
Nodes (8): due(), MAX_RELEASE_UNPARKS, RELEASE_CHECK_MS, returnToPickup(), unparkReleasedWaits(), compare(), highestStableAtLeast(), parts()

### Community 139 - "scheduled-work.ts"
Cohesion: 0.09
Nodes (36): freshOwnershipRead(), Bot, deliverySlot(), verifiedCloseoutCleanupRequest(), withAmendmentOwnership(), itRecoveryRequest(), requestPriority(), closedTicketReport() (+28 more)

### Community 140 - "classify-marked-commits.ts"
Cohesion: 0.20
Nodes (16): ClassifyInput, classifyMarkedCommits(), originalGit(), WalkedCommit, Change, commitChanges(), Impact, Inventories (+8 more)

### Community 141 - "metadata-park-words.ts"
Cohesion: 0.42
Nodes (9): field(), FIELDS, MetadataField, metadataFields(), metadataParkWords(), metadataStopWords(), needed(), sentence() (+1 more)

### Community 142 - "scheduler.ts"
Cohesion: 0.09
Nodes (20): Clock, PROJECT_LOCAL, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch() (+12 more)

### Community 144 - "reconcile-merges.cjs"
Cohesion: 0.22
Nodes (14): collectPulls(), copyWikiForDryRun(), { execFileSync }, flattenPages(), fs, githubRequest(), isWikiBotPull(), main() (+6 more)

### Community 145 - "restoreInPlace"
Cohesion: 0.60
Nodes (5): identity(), Json, plain(), restorable(), restoreInPlace()

### Community 146 - "artifact"
Cohesion: 0.05
Nodes (125): blob(), Execute, inspectPartialWorktree(), partialLocalCleanupCandidate(), partialLocalCleanupKey(), requireProof(), statIdentity(), activationAuditResponseSchema() (+117 more)

### Community 147 - "run-accounting.ts"
Cohesion: 0.05
Nodes (72): BoundedRead, done(), readBoundedNoFollow(), readOwnedSessionArtifact(), reasonOf(), comparable(), EvidenceOutcome, recordRunEvidence() (+64 more)

### Community 148 - "reader-profiles.ts"
Cohesion: 0.12
Nodes (23): CODEX_LAST_MESSAGE_ARGUMENT, CODEX_SCHEMA_ARGUMENT, errorCode(), prepareReaderInput(), ReaderFiles, readerFiles(), writeExclusive(), CLAUDE_EFFORTS (+15 more)

### Community 149 - "redactEvidence"
Cohesion: 0.11
Nodes (23): attributedRecords(), foldsItsRun(), groupCandidates(), mailboxFreeze(), frozenKey(), AWS_KEY_ID, JSON_WEB_TOKEN, PROVIDER_TOKEN (+15 more)

### Community 150 - "repoRoot"
Cohesion: 0.13
Nodes (18): fs, main(), parse(), path, repoRoot(), substantive(), main(), path (+10 more)

### Community 151 - "shipped-paths.ts"
Cohesion: 0.39
Nodes (7): blob(), exportSnapshot(), MODES, treeEntries(), TreeEntry, verifySnapshot(), walk()

### Community 152 - "record-runner-failure.ts"
Cohesion: 0.10
Nodes (28): incidentNotices(), NOTICE_KINDS, STATUS, classify(), isRestoration(), KEY, newer(), record() (+20 more)

### Community 153 - ".transaction"
Cohesion: 0.12
Nodes (22): featureItemComplete(), reconcileFeatureCompletion(), planPrompt(), helperTelemetry(), reserveReplacement(), stageBudget(), classifyFeatureFailure(), automaticEnabled() (+14 more)

### Community 154 - "delivery-ownership.ts"
Cohesion: 0.33
Nodes (4): Ownership, ownershipContext, refreshDeliveryOwnership(), RefreshOwnership

### Community 155 - "recorded-gh-command.ts"
Cohesion: 0.19
Nodes (20): assignments(), changeDirectory(), closing(), CREATE, createGuard(), flags(), named(), read() (+12 more)

### Community 156 - "retry-label.ts"
Cohesion: 0.43
Nodes (6): QUOTA_EPISODE_MS, retryNext(), RetryPlan, retryPlan(), retryQueued(), retryWork()

### Community 157 - "observe-github-merges.ts"
Cohesion: 0.30
Nodes (14): clearCooldown(), coolDown(), coolingDown(), MERGE_NOTICE_RECHECK_MS, waitKey(), waits, isMergeCommit(), issueOf() (+6 more)

### Community 158 - "push-credentials.ts"
Cohesion: 0.31
Nodes (11): assertPushCredential(), Execute, assertBoundPushDestination(), digest(), Execute, file(), PUSH_HOOKS, pushHookChain() (+3 more)

### Community 160 - "work.ts"
Cohesion: 0.09
Nodes (35): admitRepairWaits(), COVERING, expiryEvent(), expiryId(), lastProgress(), progressOf(), RepairWaitEntry, RepairWaitPass (+27 more)

### Community 161 - "unblock-brief.ts"
Cohesion: 0.53
Nodes (5): clearUnblockBrief(), key(), saveUnblockBrief(), UnblockBrief, unblockBrief()

### Community 162 - "github-check-selection.ts"
Cohesion: 0.10
Nodes (40): queueMergeNotice(), resumeProviderReviews(), observe(), returnDraftToPromotion(), CheckJobAgreement, checkJobAgreement(), isKnownCheckStatus(), positive() (+32 more)

### Community 163 - "original-git.ts"
Cohesion: 0.31
Nodes (15): Git, hasCommit(), isSha(), localGitRunner(), Options, shallowBoundaries(), unreadable(), walkCommits() (+7 more)

### Community 164 - "telemetry/report.ts"
Cohesion: 0.29
Nodes (12): Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked(), row() (+4 more)

### Community 165 - "accessibility-sources.ts"
Cohesion: 0.10
Nodes (34): GitHubOperations, reconcileGitHubWrite(), writerRefused(), writerSuccessor(), assignedToJoe(), fileLessonIssue(), lessonIssueBody(), lessonIssueMarker() (+26 more)

### Community 166 - "launch.mjs"
Cohesion: 0.07
Nodes (93): RFC-9562, CHECKOUT, DEFAULT_DEADLINE_MS, existingPlist(), installOverseer(), LABEL, LAUNCHER_SOURCE, renderPlist() (+85 more)

### Community 167 - "release-marker-policy.ts"
Cohesion: 0.20
Nodes (11): active(), ACTIVE_ANALYZER, ACTIVE_FILTER, count(), readReleasePolicy(), ReleasePolicy, SELECTS_ANALYZER, RELEASE_MARKER (+3 more)

### Community 168 - "admit-improvement.ts"
Cohesion: 0.23
Nodes (16): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+8 more)

### Community 170 - "it-report.ts"
Cohesion: 0.20
Nodes (14): followUpPicture(), publishITReport(), archiveOldReports(), RETAINED_REPORTS, archiveByMonth(), archiveHistory(), archiveMonth(), archiveOldTaskDetail() (+6 more)

### Community 171 - "service-plist.ts"
Cohesion: 0.13
Nodes (27): ActiveRelease, readActiveRelease(), BUILD_ENV, buildRelease(), BuildReleaseOptions, Execute, pinnedVersions(), compare() (+19 more)

### Community 172 - "goal-reviews.ts"
Cohesion: 0.11
Nodes (23): currentCitations(), Fact, NOT_CURRENT, PROVIDER_ERROR, applyGoalReview(), DeliveryJob, EvidenceRefSchema, jobAccepted() (+15 more)

### Community 173 - "qa-plan-retry.ts"
Cohesion: 0.67
Nodes (3): QAPlanRetry, QAPlanRetryProof, QAPlanRetryRequest

### Community 179 - "restart-writer.ts"
Cohesion: 0.18
Nodes (17): ATTEMPT_DELAYS_MS, nextAttemptAt(), restartStoppedWriters(), unchangedSinceAccepted(), NOT_RETRYABLE, releaseFunds(), stoppedWriter(), WRITER_STAGES (+9 more)

### Community 180 - "preferences-store.ts"
Cohesion: 0.12
Nodes (11): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, soundFields, StoredBody, SoundPlayer (+3 more)

### Community 183 - "session-snapshot-cleanup.ts"
Cohesion: 0.40
Nodes (5): SNAPSHOT_PREFIX, removeStaleSessionSnapshots(), SNAPSHOT_SWEEP_MS, STALE_SNAPSHOT_MS, sweepStaleSessionSnapshots()

### Community 186 - "deploy.ts"
Cohesion: 0.14
Nodes (33): abandon(), advance(), DeployContext, DEPLOY_STEPS, ROLLED_BACK, installPlist(), bootout(), bootstrap() (+25 more)

### Community 187 - "github-delivery.ts"
Cohesion: 0.04
Nodes (127): containedFile(), writerRestartInstruction(), removeAdoptedClone(), harnessCloseout(), PASSING, verifyMergeActions(), namedRepairIds(), assertDeliveryMayMutate() (+119 more)

### Community 188 - "marker-adoption.ts"
Cohesion: 0.23
Nodes (17): Candidate, checkAdoption(), checkContinuationAdoption(), checkWriterAdoption(), Owner, admitMarkedPush(), Candidate, MarkerObservation (+9 more)

### Community 190 - "harnessEffect"
Cohesion: 0.09
Nodes (55): BLOCK, harnessBlockMove(), harnessParkedCard(), noted(), effectKey(), LaneOperation, laneWrite(), moveCardOnce() (+47 more)

### Community 195 - "Goals.tsx"
Cohesion: 0.14
Nodes (21): CTOReview(), goalState, DailyCTO(), reportDate(), reviewStatus, goalKey(), GoalList(), card() (+13 more)

### Community 199 - "ref_zod"
Cohesion: 0.14
Nodes (15): append(), assertNext(), DeployJournalView, DeployStepState, Entry, Header, Id, recordDeployStep() (+7 more)

### Community 208 - "evidenceText"
Cohesion: 0.80
Nodes (4): evidenceText(), field(), jsonString(), opening()

## Knowledge Gaps
- **1 isolated node(s):** `RFC-9562`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 1462 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `pendingRounds`, `agents.ts`, `features.ts`, `marker-correction.ts`, `write-boundary.ts`, `outbox.ts`, `request.ts`, `scheduled-captures.ts`, `run-retrospective.ts`, `record-trigger.ts`, `delivery-retry.ts`, `jira-time.ts`, `index.ts`, `conversations/slack.ts`, `advance-metadata-park.ts`, `assignments.ts`, `digest`, `requests.ts`, `offices.ts`, `post-conflict-preparation.ts`, `maintenance/maintenance.ts`, `time-scope.ts`, `demand-facts.ts`, `.save`, `Offices`, `currentAssignment`, `sanitize`, `investigations/ledger.ts`, `trial-comment.ts`, `alert-issue.ts`, `weekly-rollup.ts`, `lesson-selection.ts`, `cost-ledger.ts`, `supersedingDelivery`, `judge-resumes.ts`, `follow-production.ts`, `run.ts`, `ref_node_crypto`, `projects.ts`, `project-bindings.ts`, `ref_node_path`, `session-bridge.ts`, `interrupted-work-recovery.ts`, `workKey`, `learning-events.ts`, `stopped-record.ts`, `superseded-wiki-pr.ts`, `sign-in-unpark.ts`, `process.ts`, `assignment-poll.ts`, `unsent-time.ts`, `publication.ts`, `shared.ts`, `jira-attempts.ts`, `blocker-followups.ts`, `controller-runtime.ts`, `dependency-bots/adopt.ts`, `pr-observation-graphql.ts`, `create-candidate.ts`, `OfficeSnapshot`, `brain-maintenance.ts`, `daily-cto.ts`, `.emit`, `cec.ts`, `route-head.ts`, `discovery-recovery.ts`, `release-marker-stop.ts`, `coordination.ts`, `control-store.ts`, `release-unpark.ts`, `scheduled-work.ts`, `classify-marked-commits.ts`, `scheduler.ts`, `artifact`, `run-accounting.ts`, `shipped-paths.ts`, `.transaction`, `observe-github-merges.ts`, `push-credentials.ts`, `work.ts`, `github-check-selection.ts`, `accessibility-sources.ts`, `admit-improvement.ts`, `goal-reviews.ts`, `restart-writer.ts`, `github-delivery.ts`, `marker-adoption.ts`, `harnessEffect`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **What connects `RFC-9562` to the rest of the system?**
  _1 weakly-connected nodes found - possible missing edges._
- **Should `run-model.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.034613686534216336 - nodes in this community are weakly interconnected._
- **Why does `command()` connect `process.ts` to `agents.ts`, `features.ts`, `coordination.ts`, `incidents/routes.ts`, `write-boundary.ts`, `request.ts`, `artifact`, `sandbox-qualification.ts`, `command-registry.ts`, `delivery-retry.ts`, `jira-time.ts`, `service-ticks.ts`, `.transaction`, `record-runner-failure.ts`, `index.ts`, `conversations/slack.ts`, `assignments.ts`, `digest`, `requests.ts`, `original-git.ts`, `accessibility-sources.ts`, `maintenance/maintenance.ts`, `admit-improvement.ts`, `.save`, `service-plist.ts`, `rate-limit-samples.ts`, `currentAssignment`, `restart-writer.ts`, `deploy.ts`, `github-delivery.ts`, `cost-ledger.ts`, `harnessEffect`, `service-health.ts`, `project-bindings.ts`, `ref_node_path`, `session-bridge.ts`, `Store`, `workKey`, `assignment-poll.ts`, `unsent-time.ts`, `publication.ts`, `shared.ts`, `call-scope.ts`, `jira-attempts.ts`, `controller-runtime.ts`, `create-candidate.ts`, `brain-maintenance.ts`, `daily-cto.ts`, `deploy-command.ts`, `.emit`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Should `pendingRounds` be split into smaller, more focused modules?**
  _Cohesion score 0.1073170731707317 - nodes in this community are weakly interconnected._
- **Why does `IncidentLedger` connect `judge-resumes.ts` to `work.ts`, `offices.ts`, `ref_node_crypto`, `incidents/routes.ts`, `redactEvidence`, `service-ticks.ts`, `record-runner-failure.ts`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Should `agents.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.03874904652936689 - nodes in this community are weakly interconnected._