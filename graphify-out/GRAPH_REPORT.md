# Graph Report - the-office  (2026-11-28)

## Corpus Check
- 1426 files · ~662,222 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 8239 nodes · 34799 edges · 201 communities (193 shown, 8 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 1127 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3c532fee`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- codex-handoff.ts
- PeoplePanel.tsx
- worker-runtime.ts
- process.ts
- cx
- marker-correction.ts
- budget-ledger.ts
- MapView.tsx
- redactEvidence
- TelemetryPanel.tsx
- halt-report.ts
- route-activation.ts
- outbox.ts
- api-routes.ts
- github-readiness.ts
- scheduled-captures.ts
- run-retrospective.ts
- record-trigger.ts
- app-config.ts
- sandbox-qualification.ts
- command-registry.ts
- overseer-launch.mjs
- delivery-retry.ts
- jira-time.ts
- workKey
- index.ts
- notifications.ts
- cec.ts
- assertDeliveryMayMutate
- assignments.ts
- digest
- identity-runtime.ts
- .transaction
- ref_node_path
- Coordinator
- common.cjs
- pr-observation-shape.ts
- routing.cjs
- entry.ts
- lesson-selection.ts
- Outbox.tsx
- time-scope.ts
- accessibility-sources.ts
- .save
- Offices
- harness-baseline.ts
- credential-spans.ts
- quota-governor.ts
- runner-root.ts
- DeploymentFence
- QuestionStepper.tsx
- readable-jira-comment.ts
- Store
- run-model.ts
- stopped-base-validation.ts
- weekly-rollup.ts
- pass.ts
- brain-audit-reuse.ts
- goal-reporting.ts
- observation.ts
- cost-ledger.ts
- demand-facts.ts
- OfficeSnapshot
- sanitize
- constellation-runtime.ts
- validate_pr_body.cjs
- audit-plan-candidates.cjs
- overseer/config.ts
- resume-arrivals.ts
- App.tsx
- OfficeScene.tsx
- spawn-command.ts
- session-context-file.ts
- projects.ts
- session-scope.ts
- service-health.ts
- project-bindings.ts
- activation-recovery.ts
- incidents.ts
- agents.ts
- session-bridge.ts
- shared.ts
- interrupted-work-recovery.ts
- remove-candidate.ts
- viewer.js
- maintenance/maintenance.ts
- stopped-record.ts
- conversations/conversations.ts
- superseded-wiki-pr.ts
- ref_node_child_process
- provider-observation.ts
- OfficeProject
- session-context-client.ts
- plans.cjs
- assignment-poll.ts
- capture-session-clone.py
- enrollment-gate.ts
- JiraIssuePublisher
- command
- archive-plan.cjs
- call-scope.ts
- jira-attempts.ts
- handoff-admission.ts
- on-merge-sync.cjs
- backup-stores.ts
- extract-worker.mjs
- controller-runtime.ts
- harnessEffect
- judge-resumes.ts
- pr-observation-graphql.ts
- blocker-followups.ts
- follow-production.ts
- brain-maintenance.ts
- index.tsx
- slack-supersession.ts
- telemetry.ts
- qa.ts
- qa-plan-continuation.ts
- writer-restart.ts
- timed-statements.ts
- retrospective-subject.ts
- write-boundary.ts
- daily-cto.ts
- deploy-command.ts
- refresh-issue-state.cjs
- .emit
- StageResult
- sign-in-unpark.ts
- indeterminate
- requests.ts
- retry-binding.ts
- MaintenanceRun
- release-marker-stop.ts
- work.ts
- StateParts
- triage.ts
- knowledge.ts
- it-specialist.ts
- deploy-plan.ts
- scheduled-work.ts
- classify-marked-commits.ts
- metadata-park-words.ts
- scheduler.ts
- production.ts
- reconcile-merges.cjs
- owned-artifact.ts
- GitHubDelivery
- run-accounting.ts
- reader-profiles.ts
- resume-control.ts
- serve-graph.cjs
- coordination.ts
- redact-evidence.ts
- checkpoint-completion.ts
- refusal-capture.ts
- recorded-gh-command.ts
- marker-adoption.ts
- observe-github-merges.ts
- write-credential-scope.ts
- routing.js
- diagnostic-snapshot.ts
- office-authors.ts
- github-check-selection.ts
- original-git.ts
- telemetry/report.ts
- reconcileGitHubWrite
- launch.mjs
- release-marker-policy.ts
- admit-improvement.ts
- holdReason
- it-report.ts
- ref_zod
- npm-inventory.ts
- security.ts
- call-ledger.ts
- control-store.ts
- .getEffect
- ref_node_crypto
- saved-state.ts
- restart-writer.ts
- ref_node_sqlite
- merge-scanner-retry.ts
- codex-rollout.ts
- session-snapshot-cleanup.ts
- github.ts
- features/commands.ts
- deploy.ts
- create-candidate.ts
- correction-checks.ts
- state-parts.ts
- run-usage.ts
- SoundPlayer
- validate_wiki_pr_body.cjs
- release-floor.ts
- run-evidence.ts
- StoreTimings
- restoreInPlace
- ITFollowUps.tsx
- follow-ups.ts
- wait-idle.ts
- packed-consumer-pnpm.ts

## God Nodes (most connected - your core abstractions)
1. `Store` - 501 edges
2. `TicketJob` - 263 edges
3. `digest()` - 183 edges
4. `command()` - 165 edges
5. `GitHubDelivery` - 149 edges
6. `holdReason()` - 143 edges
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
- `CurrentMark()` --indirect_call--> `marker()`  [INFERRED]
  src/work/timeline/TicketTimeline.tsx → server/delivery/closeout/superseded-wiki-pr.ts
- `TicketTimeline()` --indirect_call--> `marker()`  [INFERRED]
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

## Communities (201 total, 8 thin omitted)

### Community 0 - "codex-handoff.ts"
Cohesion: 0.06
Nodes (81): claimText(), codexCanDispatch(), CodexEnvelope, codexGeneration(), CodexIdentity, CodexRefusal, Envelope, finishCodex() (+73 more)

### Community 1 - "PeoplePanel.tsx"
Cohesion: 0.11
Nodes (37): label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+29 more)

### Community 2 - "worker-runtime.ts"
Cohesion: 0.06
Nodes (45): candidateWorkspaceEnvironment(), assignmentSubject(), dispatchExposure(), prepareExposure(), LessonSelection, catalogLine(), assertBriefingScope(), clearUnblockBrief() (+37 more)

### Community 3 - "process.ts"
Cohesion: 0.06
Nodes (69): Assignment, jiraText(), Transition, descriptionPreimage(), plain(), approveFeature(), mutation(), assertFeatureDependencyOrder() (+61 more)

### Community 4 - "cx"
Cohesion: 0.09
Nodes (92): Outbox(), blockedSummary(), ServiceHealthPanel(), followUp(), labels, ServiceHealthRow(), BlockerFollowups(), LearningCoverage() (+84 more)

### Community 5 - "marker-correction.ts"
Cohesion: 0.12
Nodes (36): applyCorrection(), moveBranch(), CorrectionInput, CorrectionOutcome, retain(), assertCorrectionCheckout(), assertMappedCheckout(), bindCorrectionClaim() (+28 more)

### Community 6 - "budget-ledger.ts"
Cohesion: 0.06
Nodes (58): abandonExpired(), Admission, admit(), admitDeployment(), balance(), bindEvidence(), count(), errcode() (+50 more)

### Community 7 - "MapView.tsx"
Cohesion: 0.06
Nodes (61): guidanceExcerpt(), KnowledgeActivity, KnowledgeActivityPage, KnowledgeEdge, KnowledgeMap, KnowledgeNode, Activity(), ActivityTimeline() (+53 more)

### Community 8 - "redactEvidence"
Cohesion: 0.06
Nodes (67): citationFault(), CitationSchema, ClaimedRange, ResolvedRange, SourceVersions, sourceVersions(), inHistoryOf(), CompareMemory (+59 more)

### Community 9 - "TelemetryPanel.tsx"
Cohesion: 0.08
Nodes (48): TelemetryReport, LiveAnchor, loadOfficeConfig(), OfficeConfigSection(), autoAdoptText(), BOT_NAMES, OfficeConfigState, OfficeConfigView() (+40 more)

### Community 10 - "halt-report.ts"
Cohesion: 0.09
Nodes (24): FailureReceipt, haltCondition(), forwardFailures(), forwardIntent(), ForwardSummary, Standing, EMPTY_HALT, ForwardCursor (+16 more)

### Community 11 - "route-activation.ts"
Cohesion: 0.14
Nodes (32): ActiveEntry, GitHubAppConfig, RouteEntry, appHistory(), bindingMatches(), configuredBinding(), held(), promoteRoute() (+24 more)

### Community 12 - "outbox.ts"
Cohesion: 0.12
Nodes (24): capabilityBlockedReviews(), latestReviews(), metadataParkAction(), ADOPTION_STALLED_MS, conversationResolved(), projectOutbox(), item(), syncOutbox() (+16 more)

### Community 13 - "api-routes.ts"
Cohesion: 0.12
Nodes (21): implementationContinuationRoute(), qaPlanRetryRoute(), servedOutbox(), isNotice(), readNotices(), ITSpecialist, goalHistory(), PORT (+13 more)

### Community 14 - "github-readiness.ts"
Cohesion: 0.07
Nodes (78): findingsBlock(), refusal(), MISSING_NATIVE_LINK, approveMerge(), AdoptionBinding, assertAutomationAuthority(), observeAutomationConflict(), VERB (+70 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.16
Nodes (42): createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), CaptureRequest, captureRequest() (+34 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.09
Nodes (44): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, BlockingTrigger, blockingTrigger(), isBlocking() (+36 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.10
Nodes (38): bindLegacyRetries(), LEGACY_LIMIT, baselined(), baselineLearning(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences() (+30 more)

### Community 18 - "app-config.ts"
Cohesion: 0.13
Nodes (23): effectId(), entry(), fail(), KnownProject, only(), parseGitHubApp(), positive(), QualifyEntry (+15 more)

### Community 19 - "sandbox-qualification.ts"
Cohesion: 0.04
Nodes (92): timeoutsValid(), ReaderAuthentication, checkRunDirectories(), layout(), RunDirectories, within(), ALLOW_PROBES, BatteryExpected (+84 more)

### Community 20 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 21 - "overseer-launch.mjs"
Cohesion: 0.07
Nodes (80): acquireLauncherLock(), alone(), ancestry(), assertDirectoryOrAbsent(), attemptRecord(), bounded(), boundedString(), checkOwnedFile() (+72 more)

### Community 22 - "delivery-retry.ts"
Cohesion: 0.13
Nodes (37): DeliveryRetryDecision, deliveryRetryDecision(), readOnlyStageJob(), retryable(), RetryStore, UnsettledRead, BOARD_STOP, boardOnly() (+29 more)

### Community 23 - "jira-time.ts"
Cohesion: 0.09
Nodes (38): unresolvedAttempts(), bindingOf(), connectWith(), data(), envelope(), finishVerifiedEffects(), JiraWorklogs, locks (+30 more)

### Community 24 - "workKey"
Cohesion: 0.15
Nodes (22): mergedByOfficeBot(), completedPRReview(), completedPRReviews(), completedPreparation(), Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate() (+14 more)

### Community 25 - "index.ts"
Cohesion: 0.06
Nodes (57): readRepairIssue(), incidentsRoute(), IncidentsRouteContext, packetOf(), resumeSwitch(), SwitchChange, Write, writeEvent() (+49 more)

### Community 26 - "notifications.ts"
Cohesion: 0.09
Nodes (26): channelNoticeAuthorized(), ChannelSettings, notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR, plainSlackText() (+18 more)

### Community 27 - "cec.ts"
Cohesion: 0.08
Nodes (45): movedHeadNote(), cecPrompt(), resolvedDecisionNote(), stageInstructionsFor(), REVIEW_FINDINGS_RULE, latestQA(), notPassedInLatestQA(), QACoverage (+37 more)

### Community 28 - "assertDeliveryMayMutate"
Cohesion: 0.07
Nodes (79): ProjectCard, assertDeliveryMayMutate(), advanceMetadataPark(), Parked, releaseWords(), sentAnything(), CardResumeRoute, cardResumeRoute() (+71 more)

### Community 29 - "assignments.ts"
Cohesion: 0.09
Nodes (37): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, GraphNode (+29 more)

### Community 30 - "digest"
Cohesion: 0.06
Nodes (95): retryRead(), CARD_READ_ARGS, validCardRead(), createdContentSha256(), Binding, historyBeforeWrite(), matchesBoundDescription(), DescriptionEdit (+87 more)

### Community 31 - "identity-runtime.ts"
Cohesion: 0.09
Nodes (24): KeychainKeySource, appJwt(), base64url(), signingKey(), AppKeySource, Execute, keychainKeySource(), AppReadiness (+16 more)

### Community 32 - ".transaction"
Cohesion: 0.09
Nodes (39): featureItemComplete(), reconcileFeatureCompletion(), discoveryPrompt(), planPrompt(), readEvidence(), helperTelemetry(), DELAYS, MAX_EXECUTIONS (+31 more)

### Community 33 - "ref_node_path"
Cohesion: 0.06
Nodes (87): MISSING_SAVED_PLAN, Candidate, readRejection(), settledPushBoundary(), verifiedCloseoutCleanupRequest(), assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate() (+79 more)

### Community 34 - "Coordinator"
Cohesion: 0.09
Nodes (3): withGitHubSource(), coordination(), Coordinator

### Community 35 - "common.cjs"
Cohesion: 0.15
Nodes (27): connections(), fs, main(), path, crypto, ensureInside(), { execFileSync }, fs (+19 more)

### Community 36 - "pr-observation-shape.ts"
Cohesion: 0.33
Nodes (14): ObservedPR, enumValue(), fail(), graphqlPR(), mapped(), member(), MERGEABLE, PR_STATES (+6 more)

### Community 37 - "routing.cjs"
Cohesion: 0.12
Nodes (28): fs, main(), path, { spawnSync }, frontmatterProblems(), adjacency(), edgeCost(), edgeKey() (+20 more)

### Community 38 - "entry.ts"
Cohesion: 0.08
Nodes (29): EntryRead, EntrySchema, ID_MAX, parseEntry(), PATH_MAX, PATHS_MAX, PLAYBOOK_KINDS, PLAYBOOK_STAGES (+21 more)

### Community 39 - "lesson-selection.ts"
Cohesion: 0.15
Nodes (19): INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), MAINTENANCE, MAX_LESSONS, normalPath() (+11 more)

### Community 40 - "Outbox.tsx"
Cohesion: 0.06
Nodes (50): knowledgeOutbox(), ChatMarkdown(), Conversation(), send(), ConversationDraft, SendMessage, LessonDecisionAction, lessonDecisionState() (+42 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.12
Nodes (31): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence(), CaptureContext (+23 more)

### Community 42 - "accessibility-sources.ts"
Cohesion: 0.24
Nodes (17): accessibilitySources(), actionable(), closingPull(), Finding, handoffIssue(), issueLines(), issueSource(), observation (+9 more)

### Community 43 - ".save"
Cohesion: 0.09
Nodes (62): enumerateIntakeList(), inPickupOrder(), Intake, text(), resolveBlockedTransition(), document(), transitionWithComment(), jiraAccount() (+54 more)

### Community 44 - "Offices"
Cohesion: 0.08
Nodes (12): QuestionNotifications, CommittedBrain, leadershipContext(), mirrorOfficeKnowledge(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), file (+4 more)

### Community 45 - "harness-baseline.ts"
Cohesion: 0.15
Nodes (22): BaselineReport, baselineReport(), BaselineSource, baselineText(), millions(), row(), share(), add() (+14 more)

### Community 46 - "credential-spans.ts"
Cohesion: 0.06
Nodes (68): BareValue, bareValue(), deeperValueEnd(), ENDS, isSeparator(), plainEscape(), queryValue(), separatorEscapeAt() (+60 more)

### Community 47 - "quota-governor.ts"
Cohesion: 0.10
Nodes (21): bindGitHubRunner(), Runner, GitHubCalls, AppPrincipals, serviceAppPrincipals, credentialOptions(), CORE_RESERVE, noQuotaHold (+13 more)

### Community 48 - "runner-root.ts"
Cohesion: 0.10
Nodes (28): privateDirectories(), claudeGeneration(), ClaudeSignIn, normalizeClaudeToken(), readClaudeSignIn(), Child, CHILDREN, DIRECTORY_MODES (+20 more)

### Community 49 - "DeploymentFence"
Cohesion: 0.33
Nodes (4): assertToken(), DeploymentFence, DeploymentFenceGateContext, DeploymentFenceRouteContext

### Community 50 - "QuestionStepper.tsx"
Cohesion: 0.19
Nodes (18): FeatureQuestionProjection, OutboxQuestionRound(), send(), draftKey(), readDraft(), saveDraft(), QuestionRound(), nextQuestion() (+10 more)

### Community 51 - "readable-jira-comment.ts"
Cohesion: 0.13
Nodes (24): CommentPage, commentReadback(), devUpdate(), HEADLINE, jiraRecord(), OUTCOME, qaComment(), remote() (+16 more)

### Community 52 - "Store"
Cohesion: 0.07
Nodes (46): ctoInputIdentityMatches(), ctoInputRecovered(), acceptedCompletionResolution(), INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, ctoReplacementResolution(), investigationEvidence(), finishedSubjectResolution() (+38 more)

### Community 53 - "run-model.ts"
Cohesion: 0.08
Nodes (39): LedgerOptions, AttributedFailure, InvocationResult, NotDispatched, GroupState, groupState(), RotationEvidence, StagedCodex (+31 more)

### Community 54 - "stopped-base-validation.ts"
Cohesion: 0.47
Nodes (8): continuationNativeReview(), assertStoppedBaseApproach(), stoppedBaseNextStage(), stoppedBasePackedCommands(), assertAcceptedFiles(), assertStoppedBaseMergeReady(), assertStoppedBaseValidation(), stoppedBaseStageProof()

### Community 55 - "weekly-rollup.ts"
Cohesion: 0.14
Nodes (26): learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), RollupResult (+18 more)

### Community 56 - "pass.ts"
Cohesion: 0.04
Nodes (106): [cmd,...rawArgs], FailureEvent, failureLine(), LINE_LIMIT, reconcile(), guardPresent(), overseerCommand(), reconcileArgs() (+98 more)

### Community 57 - "brain-audit-reuse.ts"
Cohesion: 0.20
Nodes (13): bindBrainAuditEffects(), Effect, Known, assertPriorBrainAudit(), brainAuditRetryFingerprint(), Context, jsonAfter(), nativeSessionPath() (+5 more)

### Community 58 - "goal-reporting.ts"
Cohesion: 0.14
Nodes (26): githubPRDescription(), collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB (+18 more)

### Community 59 - "observation.ts"
Cohesion: 0.17
Nodes (20): deliveryRetryDecisions(), Bot, intakeUnderWay(), FailedMailCheck, lastFailedMailCheck(), lastMailCheckOutcome(), MailCheckOutcome, ProjectObservation (+12 more)

### Community 60 - "cost-ledger.ts"
Cohesion: 0.11
Nodes (38): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId(), OutsideEdit (+30 more)

### Community 61 - "demand-facts.ts"
Cohesion: 0.14
Nodes (19): clip(), DEMAND_LIMIT, demandFacts(), key(), LessonKey, notes(), clip(), MISSED_QUERY_LIMIT (+11 more)

### Community 62 - "OfficeSnapshot"
Cohesion: 0.08
Nodes (48): jiraQueueProgress(), nextStage(), deliveryRoles, JiraQueueProgress, TicketProgress, SnapshotAcceptance, tourStages, useOffice() (+40 more)

### Community 63 - "sanitize"
Cohesion: 0.15
Nodes (21): assertConversationReadback(), finishSupersededReadback(), projectSlackDeliveries(), dueSlackReread(), rereadUncertainSlack(), runningRevision(), settleRequestedSlackReplacement(), Input (+13 more)

### Community 64 - "constellation-runtime.ts"
Cohesion: 0.07
Nodes (35): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), CameraPose, flightPose(), cameraTarget() (+27 more)

### Community 65 - "validate_pr_body.cjs"
Cohesion: 0.36
Nodes (8): fs, main(), readableText(), REQUIRED_CHECKS, REQUIRED_SECTIONS, sections(), validatePullRequestBody(), withoutComments()

### Community 66 - "audit-plan-candidates.cjs"
Cohesion: 0.14
Nodes (31): audit(), branchIssueNumbers(), classify(), distinctiveTitleWords(), { execFileSync }, extractPaths(), findPrForMergeSubject(), fmtCommit() (+23 more)

### Community 67 - "overseer/config.ts"
Cohesion: 0.08
Nodes (36): FailureAnswer, HaltAnswer, DEFAULT_OFFICE_URL, LOOPBACK, RUNNER_DEFAULTS, RunnerLimits, runnerPaths(), officeDataRoot (+28 more)

### Community 68 - "resume-arrivals.ts"
Cohesion: 0.12
Nodes (57): canonical(), assessResumes(), Standing, CheckpointEligibility, checkpointEligibility(), admitAssignmentResume(), forAssignment(), admitCheckpointResume() (+49 more)

### Community 69 - "App.tsx"
Cohesion: 0.05
Nodes (70): createConversationDrafts(), BrainDrawer(), releaseSoundEvents, themeColor, App(), BrainWorkspace, CONNECTION, CONNECTION_DOT (+62 more)

### Community 70 - "OfficeScene.tsx"
Cohesion: 0.08
Nodes (60): displayAgentTask(), withoutElapsed(), CameraBookmark, restoreBookmark(), LiveAgentTask(), Props, RunningTask(), text() (+52 more)

### Community 71 - "spawn-command.ts"
Cohesion: 0.09
Nodes (34): Event, exactCommand(), Invocation, localHookCommand(), one(), prePushRejection(), PushIdentity, retirementBoundary() (+26 more)

### Community 72 - "session-context-file.ts"
Cohesion: 0.20
Nodes (14): ContextFoldPrefix, contextFoldPrefix(), SessionContextCheckpoint, captureSessionContextClone(), ContextReadPhase, SessionContextDeadline, sessionContextFile(), ContextReadChanged (+6 more)

### Community 73 - "projects.ts"
Cohesion: 0.05
Nodes (61): AUTO_ADOPT_BOTS, AutoAdoptBot, EffectiveAutoAdopt, effectiveAutoAdopt(), assertFeaturePlanningConfig(), goalEvidencePath(), azureSchema, deploymentSchema (+53 more)

### Community 74 - "session-scope.ts"
Cohesion: 0.18
Nodes (17): Bound, claudeScopeParser(), claudeSessionScope(), CLAUDE_TRANSCRIPTS, CODEX_ROLLOUTS, contextReaders(), retainSessionMessage(), SessionConversation (+9 more)

### Community 75 - "service-health.ts"
Cohesion: 0.10
Nodes (25): ClaudeLoginRefusal, claudeLoginRefusal(), claudeRefusalWords(), RECORDED_REFUSALS, refusedClaudeRow(), listenerHealth(), providers, ProviderStatusChecks (+17 more)

### Community 76 - "project-bindings.ts"
Cohesion: 0.13
Nodes (28): az(), buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs(), fullActivePRs(), observation() (+20 more)

### Community 77 - "activation-recovery.ts"
Cohesion: 0.06
Nodes (85): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+77 more)

### Community 78 - "incidents.ts"
Cohesion: 0.06
Nodes (69): attributedRecords(), foldsItsRun(), groupCandidates(), ObservedIncident, ObservedSubject, incidentId(), incidentNotices(), NOTICE_KINDS (+61 more)

### Community 79 - "agents.ts"
Cohesion: 0.05
Nodes (57): implementationWorkerContext(), escaped(), IntakeBinding, intakeEnumeration(), intakeLocation(), intakeMembership(), projectListScope(), cecIntakePrompt() (+49 more)

### Community 80 - "session-bridge.ts"
Cohesion: 0.10
Nodes (30): claudeSessionContext(), codexDaemonProcesses(), accountCodexProcesses(), CodexProcessInventory, codexProcessInventory(), DesktopSessions, unaccountedProcesses(), codexSessionContext() (+22 more)

### Community 81 - "shared.ts"
Cohesion: 0.03
Nodes (109): NOT_AT_TARGET, writerRestartInstruction(), assertNoModelFallback(), enterBoundRetry(), parentPrerequisite(), ProjectProgress, readBackSavedDraftUpdates(), metadataCarriedAdvisoryIds() (+101 more)

### Community 82 - "interrupted-work-recovery.ts"
Cohesion: 0.25
Nodes (10): currentOutbox(), interruptAdoptions(), legacy(), REMOVED_FIELDS, retireLegacyRecovery(), goalNoticeNeverDispatched(), maintenanceNoticeNeverDispatched(), checkpointOutcome() (+2 more)

### Community 83 - "remove-candidate.ts"
Cohesion: 0.08
Nodes (39): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), maintenanceCandidate(), moveAside(), moveBack(), purgeRemoved(), purging (+31 more)

### Community 84 - "viewer.js"
Cohesion: 0.19
Nodes (25): addMetaLink(), addMetaRow(), addRelationship(), applyView(), buildIndexes(), buildLegend(), buildModel(), buildRenderer() (+17 more)

### Community 85 - "maintenance/maintenance.ts"
Cohesion: 0.04
Nodes (42): AzureMonitor, checkMail(), drainMail(), requestMail(), enableNightly(), ingest(), APPROACH_GUIDANCE, ApproachSchema (+34 more)

### Community 86 - "stopped-record.ts"
Cohesion: 0.08
Nodes (56): boundedEvidence(), expectedWait(), StopFacts, digest(), fingerprint(), normalizeCause(), IncidentCollector, failureOutranks() (+48 more)

### Community 87 - "conversations/conversations.ts"
Cohesion: 0.09
Nodes (17): ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff(), saveGoals() (+9 more)

### Community 88 - "superseded-wiki-pr.ts"
Cohesion: 0.10
Nodes (60): commentId(), CommentIntent, CommentReceipt, conversation(), exact(), findProofComment(), matchesProofComment(), postProofComment() (+52 more)

### Community 89 - "ref_node_child_process"
Cohesion: 0.13
Nodes (18): changedPaths(), { execFileSync }, files, isMapInput(), mapOnly(), { execFileSync }, git(), publish() (+10 more)

### Community 90 - "provider-observation.ts"
Cohesion: 0.12
Nodes (27): correlatedBuild(), Azure, azurePipelines(), outcome(), Read, RUNS_PER_PIPELINE, Api, githubWorkflows() (+19 more)

### Community 91 - "OfficeProject"
Cohesion: 0.09
Nodes (38): Connection, twgConnection(), twgProfile(), assetDownloader(), attachmentKind(), evidenceDirectory(), storeEvidence(), blankEvidence() (+30 more)

### Community 92 - "session-context-client.ts"
Cohesion: 0.13
Nodes (18): readTranscript, readRollout, packContextFailure(), PackedContextFailure, unpackContextFailure(), LiveSession, ContextThread, contextThread() (+10 more)

### Community 93 - "plans.cjs"
Cohesion: 0.13
Nodes (27): fs, main(), parse(), path, repoRoot(), substantive(), walk(), association() (+19 more)

### Community 94 - "assignment-poll.ts"
Cohesion: 0.05
Nodes (70): BLOCK, harnessBlockMove(), harnessParkedCard(), noted(), retryCandidateCleanup(), handsOff(), admitReadyCards(), confirmedGone() (+62 more)

### Community 96 - "enrollment-gate.ts"
Cohesion: 0.43
Nodes (12): currentApproval(), featureGate(), predecessorComplete(), automaticIntakeWait(), recoveryHeld(), DeliveryPreflight, deliveryPreflight(), handoffBinding() (+4 more)

### Community 97 - "JiraIssuePublisher"
Cohesion: 0.10
Nodes (11): intakeJql(), contentSchema(), JiraIssuePublisher, publicationDescription(), FeaturePublisher, PublicationReceipt, GitHubIssuePublisher, number() (+3 more)

### Community 98 - "command"
Cohesion: 0.06
Nodes (78): candidateBranchMoved(), applyChangeScope(), endChangeScope(), levels(), MAX_CHECKS, owedUnderScope(), scopeBase(), scopeOutgrown() (+70 more)

### Community 99 - "archive-plan.cjs"
Cohesion: 0.12
Nodes (33): fs, main(), parse(), path, archive(), cell(), ensureIndex(), fromArgs() (+25 more)

### Community 100 - "call-scope.ts"
Cohesion: 0.11
Nodes (35): boardReadFailure(), failed(), githubAuthError(), graphqlCounts(), refusedByRateLimit(), revalidated, slurpedPages(), succeeded() (+27 more)

### Community 101 - "jira-attempts.ts"
Cohesion: 0.13
Nodes (21): attempted(), attemptState(), bound(), covers(), JiraAttempt, jiraAttempts(), JiraAttemptState, open() (+13 more)

### Community 102 - "handoff-admission.ts"
Cohesion: 0.13
Nodes (27): actionKey(), CATEGORIZED, claimed(), Entry, episodeAt(), executing(), Execution, exit() (+19 more)

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
Cohesion: 0.12
Nodes (18): projectData(), StoreDatabase, ControllerEffects, controllerEffects(), DEPLOY_PROJECT, alive(), ControllerMachine, option() (+10 more)

### Community 107 - "harnessEffect"
Cohesion: 0.07
Nodes (84): effectKey(), LaneOperation, laneWrite(), moveCardOnce(), Lane, MOVABLE, moveLane(), resolveLane() (+76 more)

### Community 108 - "judge-resumes.ts"
Cohesion: 0.05
Nodes (63): PacketInput, FLAGS, incidentCommand(), IncidentCommandIO, option(), USAGE, whole(), absent() (+55 more)

### Community 109 - "pr-observation-graphql.ts"
Cohesion: 0.13
Nodes (29): ChildRequest, headCheckRuns(), includeBody(), readOpenPRs(), commitOf(), ConnectionPages, embeddedHead(), fail() (+21 more)

### Community 110 - "blocker-followups.ts"
Cohesion: 0.18
Nodes (27): conversationReadbackReady(), followupOf(), pendingReadback(), queueConversationReadback(), readbackEnding(), replacedReadback(), uncertainConversations(), readBackConversations() (+19 more)

### Community 111 - "follow-production.ts"
Cohesion: 0.20
Nodes (17): awaitingJiraStatus(), awaitingProduction(), FOLLOW_DAYS, followed(), isFollowed(), Azure, AzureRead, containedIn() (+9 more)

### Community 112 - "brain-maintenance.ts"
Cohesion: 0.15
Nodes (17): completeNativeCheckpoint(), BRAIN_DEPENDENCY_MERGES, BrainResult, BrainStatusSchema, identity, GateMark, MAX_START_RETRIES, neverStarted() (+9 more)

### Community 113 - "index.tsx"
Cohesion: 0.05
Nodes (93): ctoInputFailure(), OutboxCTOInput(), recover(), OutboxSavedImplementation(), apply(), review(), OutboxSavedPlan(), reconcile() (+85 more)

### Community 114 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 115 - "telemetry.ts"
Cohesion: 0.13
Nodes (18): CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL, Rates (+10 more)

### Community 119 - "timed-statements.ts"
Cohesion: 0.32
Nodes (11): NAMED, rowsText(), rowText(), SQL_TOKEN, statementName(), text(), timed(), timedRun() (+3 more)

### Community 120 - "retrospective-subject.ts"
Cohesion: 0.20
Nodes (14): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, maintenanceKey(), azurePrUrl(), findSubject(), jobSubject() (+6 more)

### Community 121 - "write-boundary.ts"
Cohesion: 0.10
Nodes (29): AMBIENT_TOKENS, appCredential(), ChildCredential, CREDENTIAL_TRACING, GIT_HELPER, operatorRollbackCredential(), PROMPTS, WriteCredential (+21 more)

### Community 122 - "daily-cto.ts"
Cohesion: 0.07
Nodes (34): currentCitations(), Fact, NOT_CURRENT, PROVIDER_ERROR, DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt() (+26 more)

### Community 123 - "deploy-command.ts"
Cohesion: 0.09
Nodes (46): CONTROLLER_ENTRY, ControllerPin, Pin, pinnedController(), readControllerPin(), writeControllerPin(), CONTROLLER_RUNTIME, ControllerStartCheck (+38 more)

### Community 124 - "refresh-issue-state.cjs"
Cohesion: 0.19
Nodes (20): atomicWrite(), advanceFence(), closingIssues(), githubRefs(), key(), normalizeGithubQuery(), normalizeRepository(), parseGithubQuery() (+12 more)

### Community 125 - ".emit"
Cohesion: 0.13
Nodes (26): requestQAPlanRetry(), configureChannelNotices(), configureNotices(), noticeState(), retryRecipientLookup(), recoverCTOInput(), DiscoveryResumeInput, requeueWaitedImplement() (+18 more)

### Community 126 - "StageResult"
Cohesion: 0.06
Nodes (45): carriedNotRepeated(), changeScopeNote(), Scoped, JiraOperations, unpack(), cecReadbackPrompt(), plainResume(), capacityInterruptedRun() (+37 more)

### Community 127 - "sign-in-unpark.ts"
Cohesion: 0.10
Nodes (35): parksInJira(), readbackDispatchGuidance(), currentEnvironmentWait(), environmentWait(), waitText(), hasPendingDelivery(), resumeAfterSignIn(), signInWait() (+27 more)

### Community 128 - "indeterminate"
Cohesion: 0.21
Nodes (19): CommitObject, commitOid(), MAX_SUFFIX, parseCommit(), readCommit(), readSuffix(), withFinalLF(), Git (+11 more)

### Community 129 - "requests.ts"
Cohesion: 0.05
Nodes (80): writerRestartPending(), removeAdoptedClone(), pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), boardPreflightCandidate(), Ownership, reconcileBoardPreflight(), closeoutRequestResolved() (+72 more)

### Community 130 - "retry-binding.ts"
Cohesion: 0.22
Nodes (16): freshRetry(), inScope(), queuedDetail(), queuedRetry(), scopedRetry(), applyLateWindow(), endDeliveryQuota(), iso() (+8 more)

### Community 131 - "MaintenanceRun"
Cohesion: 0.22
Nodes (14): checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), repeatedVendorReviewBlock(), stoppedInVendorReview(), leftToNextRun(), NEXT_RUN_DUE_MS, night() (+6 more)

### Community 132 - "release-marker-stop.ts"
Cohesion: 0.16
Nodes (17): attachCheckout(), interruptCorrectionAtStartup(), observeCorrectionCheckout(), observeInterruptedCorrections(), pendingOf(), persistMarkerStop(), blockOnReleaseMarker(), releaseMarkerStop() (+9 more)

### Community 133 - "work.ts"
Cohesion: 0.09
Nodes (35): admitRepairWaits(), Covered, COVERING, expiryEvent(), expiryId(), lastProgress(), progressOf(), RepairWaitEntry (+27 more)

### Community 134 - "StateParts"
Cohesion: 0.29
Nodes (3): PartRow, partSize(), StateParts

### Community 135 - "triage.ts"
Cohesion: 0.04
Nodes (90): resolveRange(), Agreement, agreement(), anchor(), compare(), disposition(), factsKey(), file() (+82 more)

### Community 136 - "knowledge.ts"
Cohesion: 0.07
Nodes (36): curateLesson(), Curation, CurationAction, mergeEvidence(), LessonBrainAudit, LessonBrainOverlap, Kind, RetrospectiveResult (+28 more)

### Community 137 - "it-specialist.ts"
Cohesion: 0.16
Nodes (20): savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), heldFor(), ITContext, recoveryHeld(), recoveryWait() (+12 more)

### Community 138 - "deploy-plan.ts"
Cohesion: 0.25
Nodes (16): Body, DeploymentFenceState, fenceTokenDigest(), operationPaths(), planDeployment(), createDeployToken(), readDeployToken(), removeDeployToken() (+8 more)

### Community 139 - "scheduled-work.ts"
Cohesion: 0.09
Nodes (37): freshOwnershipRead(), deliverySlot(), withAmendmentOwnership(), metadataRequestResolved(), gateFeatureWork(), requestPriority(), closedTicketReport(), closedTicketRequest() (+29 more)

### Community 140 - "classify-marked-commits.ts"
Cohesion: 0.19
Nodes (17): Classification, classifyMarkedCommits(), originalGit(), Change, commitChanges(), Impact, Inventories, namedEntries() (+9 more)

### Community 141 - "metadata-park-words.ts"
Cohesion: 0.42
Nodes (9): field(), FIELDS, MetadataField, metadataFields(), metadataParkWords(), metadataStopWords(), needed(), sentence() (+1 more)

### Community 142 - "scheduler.ts"
Cohesion: 0.10
Nodes (19): Clock, PROJECT_LOCAL, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch() (+11 more)

### Community 144 - "reconcile-merges.cjs"
Cohesion: 0.22
Nodes (14): collectPulls(), copyWikiForDryRun(), { execFileSync }, flattenPages(), fs, githubRequest(), isWikiBotPull(), main() (+6 more)

### Community 145 - "owned-artifact.ts"
Cohesion: 0.16
Nodes (16): NOTIFY_HELPER, notifyHelperResolution(), BoundedRead, done(), readBoundedNoFollow(), readOwnedSessionArtifact(), reasonOf(), CompletionReader (+8 more)

### Community 146 - "GitHubDelivery"
Cohesion: 0.05
Nodes (86): containedFile(), acceptStageResult(), StageContext, acceptConflictRepair(), recordJobApproach(), deliveryNextStage(), GitHubDelivery, pendingPreparationCheck() (+78 more)

### Community 147 - "run-accounting.ts"
Cohesion: 0.18
Nodes (18): HELPER_STDOUT_MAX_BYTES, helperAccounting(), claudeAccounting(), codexAccounting(), COMPLETION_MAX_BYTES, completionAccounting(), markCaptureStart(), merge() (+10 more)

### Community 148 - "reader-profiles.ts"
Cohesion: 0.13
Nodes (21): CODEX_LAST_MESSAGE_ARGUMENT, CODEX_SCHEMA_ARGUMENT, errorCode(), prepareReaderInput(), ReaderFiles, readerFiles(), writeExclusive(), CLAUDE_EFFORTS (+13 more)

### Community 149 - "resume-control.ts"
Cohesion: 0.29
Nodes (7): absent(), NEVER_ENABLED, ResumeControl, stated(), Stored, unreadable(), ResumeSwitch

### Community 150 - "serve-graph.cjs"
Cohesion: 0.24
Nodes (9): createServer(), fs, http, listen(), attempt(), main(), path, resolveRequest() (+1 more)

### Community 151 - "coordination.ts"
Cohesion: 0.08
Nodes (50): dispatchNightly(), requestDelivery(), reconcileNoticeConfirmations(), deliveryIntakeBlocker(), admit(), IntakeContext, WAIT_STATUSES, compatible() (+42 more)

### Community 152 - "redact-evidence.ts"
Cohesion: 0.15
Nodes (16): clip(), clipLapse(), evidencePacket(), ordered(), PACKET_BYTES, PACKET_EVENTS, PACKET_RECORDS, PACKET_SUBJECTS (+8 more)

### Community 153 - "checkpoint-completion.ts"
Cohesion: 0.23
Nodes (9): brainCheckpointCompletion(), coverageSchema, verified, PublishedPR, publishedWorkCleanedUp(), nativeChecks, outcomeKnown(), reconcileCompletedCheckpoints() (+1 more)

### Community 154 - "refusal-capture.ts"
Cohesion: 0.17
Nodes (10): Ownership, ownershipContext, refreshDeliveryOwnership(), RefreshOwnership, QuotaGovernor, Resource, CapturedFailure, captureGitHubFailures() (+2 more)

### Community 155 - "recorded-gh-command.ts"
Cohesion: 0.19
Nodes (20): assignments(), changeDirectory(), closing(), CREATE, createGuard(), flags(), named(), read() (+12 more)

### Community 156 - "marker-adoption.ts"
Cohesion: 0.23
Nodes (16): ClassifyInput, Candidate, checkAdoption(), checkContinuationAdoption(), checkWriterAdoption(), Owner, admitMarkedPush(), Candidate (+8 more)

### Community 157 - "observe-github-merges.ts"
Cohesion: 0.30
Nodes (14): clearCooldown(), coolDown(), coolingDown(), MERGE_NOTICE_RECHECK_MS, waitKey(), waits, isMergeCommit(), issueOf() (+6 more)

### Community 158 - "write-credential-scope.ts"
Cohesion: 0.25
Nodes (13): assertPushCredential(), Execute, assertBoundPushDestination(), digest(), Execute, file(), PUSH_HOOKS, pushHookChain() (+5 more)

### Community 160 - "diagnostic-snapshot.ts"
Cohesion: 0.29
Nodes (9): assignmentDiagnostics(), diagnosticContext(), diagnosticSnapshot(), nativeDeliveryResolved(), itAgent(), itDiagnostics(), followUpStatus(), outstandingFollowUps() (+1 more)

### Community 161 - "office-authors.ts"
Cohesion: 0.28
Nodes (12): mergeEffects(), officeMerge(), officeMergeProvenance(), githubIdentity(), appSelected(), discoveredAuthor(), discoveryAuthors(), expectedAuthor() (+4 more)

### Community 162 - "github-check-selection.ts"
Cohesion: 0.10
Nodes (45): queueMergeNotice(), resumeProviderReviews(), observe(), CheckJobAgreement, checkJobAgreement(), isKnownCheckStatus(), positive(), STATE (+37 more)

### Community 163 - "original-git.ts"
Cohesion: 0.37
Nodes (13): hasCommit(), isSha(), Options, shallowBoundaries(), unreadable(), walkCommits(), WalkedCommit, ancestor() (+5 more)

### Community 164 - "telemetry/report.ts"
Cohesion: 0.21
Nodes (15): TelemetryRow, TelemetrySync, Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount() (+7 more)

### Community 165 - "reconcileGitHubWrite"
Cohesion: 0.18
Nodes (15): GitHubOperations, executeGitHubWrite(), reconcileGitHubWrite(), withWriteCredential(), writerRefused(), writerSuccessor(), assignedToJoe(), fileLessonIssue() (+7 more)

### Community 166 - "launch.mjs"
Cohesion: 0.05
Nodes (105): RFC-9562, BANNER, builtin(), bundleLauncher(), LAUNCHER_BUNDLE, LAUNCHER_ENTRY, launcherChunk(), REPOSITORY (+97 more)

### Community 167 - "release-marker-policy.ts"
Cohesion: 0.21
Nodes (11): active(), ACTIVE_ANALYZER, ACTIVE_FILTER, count(), readReleasePolicy(), ReleasePolicy, SELECTS_ANALYZER, RELEASE_MARKER (+3 more)

### Community 168 - "admit-improvement.ts"
Cohesion: 0.25
Nodes (15): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+7 more)

### Community 169 - "holdReason"
Cohesion: 0.11
Nodes (31): Document, document(), isAccessOnlyPlan(), settledAccessOnlyState(), continueAccessOnlyPlan(), entryExists(), checksFailed(), partialLocalCleanupCandidate() (+23 more)

### Community 170 - "it-report.ts"
Cohesion: 0.27
Nodes (10): followUpPicture(), publishITReport(), archiveOldReports(), RETAINED_REPORTS, archiveByMonth(), archiveHistory(), archiveMonth(), archiveOldTaskDetail() (+2 more)

### Community 171 - "ref_zod"
Cohesion: 0.10
Nodes (40): runningRevision(), runningRevision(), DATA, ROOT, releaseIdentity(), runtimeRevision(), ActiveRelease, readActiveRelease() (+32 more)

### Community 172 - "npm-inventory.ts"
Cohesion: 0.24
Nodes (13): assertSingleRoot(), Inventory, npmEnvironment(), NpmTool, PACK_FLAGS, packInventory(), parsePack(), relative() (+5 more)

### Community 173 - "security.ts"
Cohesion: 0.17
Nodes (12): AFTER_JSON_ESCAPE, BEARER_CREDENTIAL, escapedAt(), HEADER_CREDENTIAL, HEADER_OPERAND, HEADER_PREFIX, POSTGRES_URL, PROVIDER_TOKEN (+4 more)

### Community 174 - "call-ledger.ts"
Cohesion: 0.25
Nodes (10): add(), addSource(), busiest(), CallLedger, Entry, sourceRows(), Sources, CallCounts (+2 more)

### Community 175 - "control-store.ts"
Cohesion: 0.26
Nodes (6): systemClock, applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, statementCache()

### Community 176 - ".getEffect"
Cohesion: 0.11
Nodes (17): featureById(), artifactPath(), Link, linkFeature(), publishFeature(), reconcilePublication(), uncertainPublications(), reserveIdentity() (+9 more)

### Community 177 - "ref_node_crypto"
Cohesion: 0.05
Nodes (67): GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles(), ContinuationIO (+59 more)

### Community 178 - "saved-state.ts"
Cohesion: 0.38
Nodes (7): readSavedState(), joinParts(), readSaved(), SavedSelection, SavedStateConflict, savedText(), selectSaved()

### Community 179 - "restart-writer.ts"
Cohesion: 0.16
Nodes (19): ATTEMPT_DELAYS_MS, nextAttemptAt(), restartStoppedWriters(), unchangedSinceAccepted(), NOT_RETRYABLE, releaseFunds(), StoppedWriter, stoppedWriter() (+11 more)

### Community 180 - "ref_node_sqlite"
Cohesion: 0.17
Nodes (9): PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, soundFields, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS (+1 more)

### Community 181 - "merge-scanner-retry.ts"
Cohesion: 0.50
Nodes (8): reconcileMergeScannerRetry(), Retry, retryMergeScanner(), retryReadBack(), runIdentity(), savedRetry(), transientScannerJobs(), recoverMergeCI()

### Community 182 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 183 - "session-snapshot-cleanup.ts"
Cohesion: 0.40
Nodes (5): SNAPSHOT_PREFIX, removeStaleSessionSnapshots(), SNAPSHOT_SWEEP_MS, STALE_SNAPSHOT_MS, sweepStaleSessionSnapshots()

### Community 184 - "github.ts"
Cohesion: 0.14
Nodes (19): withGitHubOperation(), GitHubMonitor, closingDirectives(), restPR(), Api, terminalPRs(), backgroundHold(), GRAPHQL_WORK (+11 more)

### Community 185 - "features/commands.ts"
Cohesion: 0.15
Nodes (26): commandFeature(), reviewQuestions(), assertQuestionVisibility(), applyHarnessAction(), HarnessActionInput, recoveryPreconditions(), recoveryTarget(), normalizeRound() (+18 more)

### Community 186 - "deploy.ts"
Cohesion: 0.10
Nodes (45): abandon(), advance(), DeployContext, DeployTimings, DEPLOY_STEPS, append(), assertNext(), DeployJournalView (+37 more)

### Community 187 - "create-candidate.ts"
Cohesion: 0.31
Nodes (9): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+1 more)

### Community 188 - "correction-checks.ts"
Cohesion: 0.29
Nodes (7): correctionChecks(), HISTORY_SENSITIVE, HISTORY_UNRUNNABLE, REQUIRED_HISTORY_CHECKS, requiredScripts(), VerifiedMapping, Evidence

### Community 189 - "state-parts.ts"
Cohesion: 0.43
Nodes (6): LARGE_KEY_CHARS, plain(), RedactedEntries, RedactedEntry, redactEntries(), WrittenPart

### Community 190 - "run-usage.ts"
Cohesion: 0.32
Nodes (6): CodexRollout, claudeCrashZero(), claudeUsage(), codexUsage(), count(), RunUsage

### Community 192 - "validate_wiki_pr_body.cjs"
Cohesion: 0.33
Nodes (5): { execFileSync }, hasCanonicalWikiBody(), maintenanceBodies, matchesMaintenanceBody(), { readFileSync }

### Community 193 - "release-floor.ts"
Cohesion: 0.33
Nodes (6): AS_COMMITTED, Execute, FloorReading, message(), readReleaseFloor(), RELEASE_FLOOR

### Community 194 - "run-evidence.ts"
Cohesion: 0.38
Nodes (5): comparable(), EvidenceOutcome, recordRunEvidence(), backfillClaudeCost(), RunAccounting

### Community 195 - "StoreTimings"
Cohesion: 0.29
Nodes (3): StoreTiming, StoreTimings, storeTimings()

### Community 196 - "restoreInPlace"
Cohesion: 0.60
Nodes (5): identity(), Json, plain(), restorable(), restoreInPlace()

### Community 197 - "ITFollowUps.tsx"
Cohesion: 0.67
Nodes (4): itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps()

### Community 198 - "follow-ups.ts"
Cohesion: 0.80
Nodes (3): investigationCandidates(), investigationId(), investigationFollowUps()

### Community 199 - "wait-idle.ts"
Cohesion: 0.40
Nodes (4): Health, IdleObservation, IdleResult, WaitIdleInput

## Knowledge Gaps
- **1 isolated node(s):** `RFC-9562`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 1445 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `worker-runtime.ts`, `process.ts`, `marker-correction.ts`, `route-activation.ts`, `api-routes.ts`, `github-readiness.ts`, `scheduled-captures.ts`, `run-retrospective.ts`, `record-trigger.ts`, `delivery-retry.ts`, `jira-time.ts`, `workKey`, `notifications.ts`, `cec.ts`, `assertDeliveryMayMutate`, `assignments.ts`, `digest`, `identity-runtime.ts`, `.transaction`, `ref_node_path`, `entry.ts`, `lesson-selection.ts`, `time-scope.ts`, `accessibility-sources.ts`, `.save`, `Offices`, `readable-jira-comment.ts`, `stopped-base-validation.ts`, `weekly-rollup.ts`, `brain-audit-reuse.ts`, `goal-reporting.ts`, `observation.ts`, `cost-ledger.ts`, `demand-facts.ts`, `OfficeSnapshot`, `sanitize`, `resume-arrivals.ts`, `OfficeScene.tsx`, `projects.ts`, `project-bindings.ts`, `activation-recovery.ts`, `agents.ts`, `session-bridge.ts`, `shared.ts`, `interrupted-work-recovery.ts`, `remove-candidate.ts`, `maintenance/maintenance.ts`, `stopped-record.ts`, `conversations/conversations.ts`, `superseded-wiki-pr.ts`, `provider-observation.ts`, `OfficeProject`, `assignment-poll.ts`, `enrollment-gate.ts`, `JiraIssuePublisher`, `command`, `jira-attempts.ts`, `controller-runtime.ts`, `harnessEffect`, `judge-resumes.ts`, `pr-observation-graphql.ts`, `blocker-followups.ts`, `follow-production.ts`, `brain-maintenance.ts`, `retrospective-subject.ts`, `write-boundary.ts`, `daily-cto.ts`, `.emit`, `StageResult`, `sign-in-unpark.ts`, `indeterminate`, `requests.ts`, `retry-binding.ts`, `release-marker-stop.ts`, `work.ts`, `StateParts`, `it-specialist.ts`, `scheduled-work.ts`, `classify-marked-commits.ts`, `scheduler.ts`, `owned-artifact.ts`, `GitHubDelivery`, `run-accounting.ts`, `coordination.ts`, `checkpoint-completion.ts`, `marker-adoption.ts`, `observe-github-merges.ts`, `write-credential-scope.ts`, `diagnostic-snapshot.ts`, `office-authors.ts`, `github-check-selection.ts`, `telemetry/report.ts`, `reconcileGitHubWrite`, `admit-improvement.ts`, `holdReason`, `control-store.ts`, `.getEffect`, `ref_node_crypto`, `restart-writer.ts`, `github.ts`, `features/commands.ts`, `create-candidate.ts`, `correction-checks.ts`, `run-evidence.ts`, `follow-ups.ts`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **What connects `RFC-9562` to the rest of the system?**
  _1 weakly-connected nodes found - possible missing edges._
- **Should `codex-handoff.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05995410212277682 - nodes in this community are weakly interconnected._
- **Why does `command()` connect `command` to `requests.ts`, `worker-runtime.ts`, `process.ts`, `marker-correction.ts`, `redactEvidence`, `scheduled-work.ts`, `github-readiness.ts`, `GitHubDelivery`, `sandbox-qualification.ts`, `command-registry.ts`, `coordination.ts`, `jira-time.ts`, `index.ts`, `notifications.ts`, `checkpoint-completion.ts`, `assignments.ts`, `digest`, `identity-runtime.ts`, `.transaction`, `ref_node_path`, `original-git.ts`, `reconcileGitHubWrite`, `holdReason`, `accessibility-sources.ts`, `.save`, `ref_zod`, `quota-governor.ts`, `.getEffect`, `ref_node_crypto`, `readable-jira-comment.ts`, `restart-writer.ts`, `weekly-rollup.ts`, `github.ts`, `deploy.ts`, `create-candidate.ts`, `cost-ledger.ts`, `release-floor.ts`, `service-health.ts`, `project-bindings.ts`, `activation-recovery.ts`, `agents.ts`, `session-bridge.ts`, `shared.ts`, `remove-candidate.ts`, `maintenance/maintenance.ts`, `provider-observation.ts`, `OfficeProject`, `JiraIssuePublisher`, `call-scope.ts`, `jira-attempts.ts`, `controller-runtime.ts`, `harnessEffect`, `brain-maintenance.ts`, `deploy-command.ts`, `StageResult`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Should `PeoplePanel.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1072463768115942 - nodes in this community are weakly interconnected._
- **Why does `TicketJob` connect `shared.ts` to `requests.ts`, `retry-binding.ts`, `worker-runtime.ts`, `release-marker-stop.ts`, `marker-correction.ts`, `MaintenanceRun`, `cx`, `it-specialist.ts`, `scheduled-work.ts`, `outbox.ts`, `classify-marked-commits.ts`, `github-readiness.ts`, `scheduler.ts`, `record-trigger.ts`, `GitHubDelivery`, `delivery-retry.ts`, `coordination.ts`, `workKey`, `assertDeliveryMayMutate`, `observe-github-merges.ts`, `digest`, `marker-adoption.ts`, `office-authors.ts`, `ref_node_path`, `github-check-selection.ts`, `release-marker-policy.ts`, `holdReason`, `ref_node_crypto`, `restart-writer.ts`, `merge-scanner-retry.ts`, `stopped-base-validation.ts`, `brain-audit-reuse.ts`, `goal-reporting.ts`, `observation.ts`, `create-candidate.ts`, `OfficeSnapshot`, `resume-arrivals.ts`, `activation-recovery.ts`, `interrupted-work-recovery.ts`, `remove-candidate.ts`, `maintenance/maintenance.ts`, `superseded-wiki-pr.ts`, `assignment-poll.ts`, `command`, `call-scope.ts`, `harnessEffect`, `retrospective-subject.ts`, `StageResult`, `sign-in-unpark.ts`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Should `worker-runtime.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.060153776571687016 - nodes in this community are weakly interconnected._