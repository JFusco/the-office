# Graph Report - the-office  (2026-11-28)

## Corpus Check
- 1434 files · ~665,756 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 8276 nodes · 34994 edges · 209 communities (198 shown, 11 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 1130 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `64e61b84`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- run-model.ts
- PeoplePanel.tsx
- agents.ts
- features.ts
- cx
- marker-correction.ts
- budget-ledger.ts
- ref_react
- record-event.ts
- timing/timing.ts
- pass.ts
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
- ref_zod
- index.ts
- sanitize
- shared.ts
- advance-metadata-park.ts
- knowledge/routes.ts
- metadata-context.ts
- identity-runtime.ts
- ref_node_crypto
- artifact
- incidents.ts
- common.cjs
- pr-observation-shape.ts
- routing.cjs
- entry.ts
- lesson-selection.ts
- OfficeSnapshot
- time-scope.ts
- accessibility-sources.ts
- .save
- Offices
- harness-baseline.ts
- credential-spans.ts
- rate-limit-samples.ts
- digest
- DeploymentFence
- QuestionStepper.tsx
- activation-recovery.ts
- investigations/ledger.ts
- trial-comment.ts
- local-config.ts
- weekly-rollup.ts
- runner-root.ts
- brain-audit-reuse.ts
- fact-bounds.ts
- redactEvidence
- cost-ledger.ts
- assignments.ts
- Conversation.tsx
- deployed-fixes.ts
- constellation-runtime.ts
- validate_pr_body.cjs
- audit-plan-candidates.cjs
- office-client.ts
- resume-arrivals.ts
- App.tsx
- OfficeScene.tsx
- spawn-command.ts
- session-context-file.ts
- projects.ts
- session-scope.ts
- service-health.ts
- project-bindings.ts
- closeout-recovery.ts
- record-runner-failure.ts
- cec.ts
- session-bridge.ts
- github-delivery.ts
- interrupted-work-recovery.ts
- owner-merged-stopped.ts
- viewer.js
- maintenance/maintenance.ts
- stopped-record.ts
- bare-value.ts
- superseded-wiki-pr.ts
- ref_node_child_process
- Engine
- ticket-evidence.ts
- session-context-client.ts
- plans.cjs
- .emit
- capture-session-clone.py
- enrollment-gate.ts
- cec/issue-publication.ts
- StageResult
- archive-plan.cjs
- call-scope.ts
- jira-attempts.ts
- blocker-followups.ts
- on-merge-sync.cjs
- backup-stores.ts
- extract-worker.mjs
- controller-runtime.ts
- .getEffect
- judge-resumes.ts
- pr-observation-graphql.ts
- conversation-recovery.ts
- follow-production.ts
- brain-maintenance.ts
- index.tsx
- slack-supersession.ts
- telemetry.ts
- qa.ts
- qa-plan-continuation.ts
- writer-restart.ts
- timed-statements.ts
- MaintenanceRun
- write-boundary.ts
- daily-cto.ts
- deploy-command.ts
- refresh-issue-state.cjs
- http/commands.ts
- office-qa-handoff.ts
- sign-in-unpark.ts
- commit-object.ts
- ref_node_path
- retry-binding.ts
- follow-up-alerts.ts
- release-marker-stop.ts
- work.ts
- state-parts.ts
- triage.ts
- knowledge.ts
- it-specialist.ts
- operationPaths
- scheduled-work.ts
- indeterminate
- metadata-park-words.ts
- scheduler.ts
- production.ts
- reconcile-merges.cjs
- draft-provenance.ts
- requests.ts
- store.ts
- reader-profiles.ts
- resume-control.ts
- serve-graph.cjs
- read-retries.ts
- incidents/routes.ts
- Store
- QuotaGovernor
- recorded-gh-command.ts
- publish-pr.ts
- observe-github-merges.ts
- push-destination.ts
- routing.js
- diagnostic-snapshot.ts
- office-authors.ts
- github-check-selection.ts
- original-git.ts
- telemetry/report.ts
- GitHubOperations
- launch.mjs
- release-marker-policy.ts
- admit-improvement.ts
- continue-access-only-plan.ts
- it-report.ts
- deploy-plan.ts
- goal-reviews.ts
- security.ts
- player.ts
- credential-patterns.ts
- EffectIntent
- inspect-closed-plan.ts
- saved-state.ts
- restart-writer.ts
- preferences-store.ts
- reconcileGitHubWrite
- time-ledger.ts
- session-snapshot-cleanup.ts
- quota-governor.ts
- useLiveTiming.ts
- deploy.ts
- TicketJob
- return-marked-candidate.ts
- evidence-artifacts.ts
- assignment-context.ts
- evidence.ts
- validate_wiki_pr_body.cjs
- owner-step-items.ts
- proof-comment.ts
- DailyCTO.tsx
- OfficeConfigView.tsx
- ITFollowUps.tsx
- checkpoint-retry.ts
- wait-idle.ts
- packed-consumer-pnpm.ts
- provider-limit-resolution.ts
- seeded-office-lessons.ts
- cli.ts
- stop-evidence.ts
- salvage-worktree.ts
- unblock-brief.ts
- JiraWorklogTransport
- evidenceText

## God Nodes (most connected - your core abstractions)
1. `Store` - 504 edges
2. `TicketJob` - 263 edges
3. `digest()` - 183 edges
4. `command()` - 167 edges
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

## Communities (209 total, 11 thin omitted)

### Community 0 - "run-model.ts"
Cohesion: 0.04
Nodes (128): AttributedFailure, InvocationResult, NotDispatched, claudeGeneration(), ClaudeSignIn, normalizeClaudeToken(), readClaudeSignIn(), claimText() (+120 more)

### Community 1 - "PeoplePanel.tsx"
Cohesion: 0.11
Nodes (38): label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+30 more)

### Community 2 - "agents.ts"
Cohesion: 0.04
Nodes (86): implementationWorkerContext(), intakeMembership(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), plainResume(), savedStageCompletion(), assertContinuableWorktree() (+78 more)

### Community 3 - "features.ts"
Cohesion: 0.05
Nodes (79): approveFeature(), createFeature(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), artifactPath(), digest() (+71 more)

### Community 4 - "cx"
Cohesion: 0.07
Nodes (114): FeatureReading(), FeatureWorkspace(), blockedSummary(), currentServices(), ServiceHealthPanel(), followUp(), labels, ServiceHealthRow() (+106 more)

### Community 5 - "marker-correction.ts"
Cohesion: 0.10
Nodes (33): ClassifyInput, correctionChecks(), HISTORY_SENSITIVE, HISTORY_UNRUNNABLE, REQUIRED_HISTORY_CHECKS, requiredScripts(), applyCorrection(), moveBranch() (+25 more)

### Community 6 - "budget-ledger.ts"
Cohesion: 0.06
Nodes (58): abandonExpired(), Admission, admit(), admitDeployment(), balance(), bindEvidence(), count(), errcode() (+50 more)

### Community 7 - "ref_react"
Cohesion: 0.07
Nodes (58): KnowledgeActivity, KnowledgeActivityPage, KnowledgeEdge, KnowledgeMap, KnowledgeNode, Activity(), ActivityTimeline(), AssignmentKnowledge() (+50 more)

### Community 8 - "record-event.ts"
Cohesion: 0.06
Nodes (56): citationFault(), CitationSchema, ClaimedRange, ResolvedRange, SourceVersions, sourceVersions(), dismiss(), DISMISSAL_REASON (+48 more)

### Community 9 - "timing/timing.ts"
Cohesion: 0.22
Nodes (15): BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens(), usd(), KpiTiles(), command() (+7 more)

### Community 10 - "pass.ts"
Cohesion: 0.04
Nodes (70): FailureEvent, failureLine(), FailureReceipt, haltCondition(), LINE_LIMIT, RunnerLimits, appendFailureLine(), JournalRefused (+62 more)

### Community 11 - "route-activation.ts"
Cohesion: 0.15
Nodes (29): ActiveEntry, RollbackEntry, RouteEntry, appHistory(), bindingMatches(), configuredBinding(), held(), promoteRoute() (+21 more)

### Community 12 - "outbox.ts"
Cohesion: 0.19
Nodes (16): metadataParkAction(), ADOPTION_STALLED_MS, projectOutbox(), item(), syncOutbox(), sameOwnerSteps(), settledSlackReadback(), slackRequestSettled() (+8 more)

### Community 13 - "api-routes.ts"
Cohesion: 0.18
Nodes (16): implementationContinuationRoute(), qaPlanRetryRoute(), servedOutbox(), isNotice(), readNotices(), goalHistory(), apiRoute(), fileResponse() (+8 more)

### Community 14 - "github-readiness.ts"
Cohesion: 0.07
Nodes (78): refusal(), MISSING_NATIVE_LINK, stopReason(), approveMerge(), AdoptionBinding, assertAutomationAuthority(), observeAutomationConflict(), VERB (+70 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.13
Nodes (50): accounting, DeliverySubject, nonDelivery, originalReads, enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture() (+42 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.09
Nodes (45): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, BlockingTrigger, blockingTrigger(), isBlocking() (+37 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.11
Nodes (39): bindLegacyRetries(), LEGACY_LIMIT, baselined(), baselineLearning(), LEARNING_BASELINES, maintainLearning(), configureKnowledge(), clip() (+31 more)

### Community 18 - "app-config.ts"
Cohesion: 0.14
Nodes (22): effectId(), entry(), fail(), KnownProject, only(), parseGitHubApp(), positive(), record() (+14 more)

### Community 19 - "sandbox-qualification.ts"
Cohesion: 0.04
Nodes (103): timeoutsValid(), errorCode(), prepareReaderInput(), ReaderFiles, readerFiles(), writeExclusive(), ReaderAuthentication, RunDirectories (+95 more)

### Community 20 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 21 - "overseer-launch.mjs"
Cohesion: 0.07
Nodes (80): acquireLauncherLock(), alone(), ancestry(), assertDirectoryOrAbsent(), attemptRecord(), bounded(), boundedString(), checkOwnedFile() (+72 more)

### Community 22 - "delivery-retry.ts"
Cohesion: 0.20
Nodes (22): DeliveryRetryDecision, deliveryRetryDecision(), readOnlyStageJob(), retryable(), RetryStore, UnsettledRead, BOARD_STOP, boardOnly() (+14 more)

### Community 23 - "jira-time.ts"
Cohesion: 0.11
Nodes (37): unresolvedAttempts(), bindingOf(), connectWith(), data(), envelope(), finishVerifiedEffects(), JiraWorklogs, locks (+29 more)

### Community 24 - "ref_zod"
Cohesion: 0.19
Nodes (12): Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership, rawHash() (+4 more)

### Community 25 - "index.ts"
Cohesion: 0.07
Nodes (29): close(), config, itSpecialist, loadedRevision, offices, releaseLock, respond(), server (+21 more)

### Community 26 - "sanitize"
Cohesion: 0.04
Nodes (75): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), assertConversationReadback(), ConversationResultSchema, Conversations (+67 more)

### Community 27 - "shared.ts"
Cohesion: 0.08
Nodes (43): carriedNotRepeated(), applyChangeScope(), levels(), MAX_CHECKS, changeScopeNote(), Scoped, owedUnderScope(), scopeBase() (+35 more)

### Community 28 - "advance-metadata-park.ts"
Cohesion: 0.07
Nodes (79): ProjectCard, advanceMetadataPark(), Parked, releaseWords(), sentAnything(), CardResumeRoute, cardResumeRoute(), effectiveParkPickup() (+71 more)

### Community 29 - "knowledge/routes.ts"
Cohesion: 0.10
Nodes (27): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, CommittedBrain (+19 more)

### Community 30 - "metadata-context.ts"
Cohesion: 0.09
Nodes (59): Binding, historyBeforeWrite(), matchesBoundDescription(), DescriptionEdit, DescriptionHistory, DescriptionHistoryUnavailable, descriptionRevision(), readDescriptionHistory() (+51 more)

### Community 31 - "identity-runtime.ts"
Cohesion: 0.10
Nodes (22): KeychainKeySource, appJwt(), base64url(), signingKey(), AppKeySource, Execute, keychainKeySource(), bound (+14 more)

### Community 32 - "ref_node_crypto"
Cohesion: 0.11
Nodes (41): commandFeature(), reviewQuestions(), featureItemComplete(), reconcileFeatureCompletion(), discoveryPrompt(), planPrompt(), automaticIntakeWait(), reserveReplacement() (+33 more)

### Community 33 - "artifact"
Cohesion: 0.06
Nodes (84): boardPreflightCandidate(), savedActivationFailure(), continuationNativeReview(), continuationWorkerProof(), candidateInput(), children, oldAdoptionBasis(), savedAdmissionUnresolved() (+76 more)

### Community 34 - "incidents.ts"
Cohesion: 0.06
Nodes (60): Admission, ObservedIncident, ObservedSubject, digest(), fingerprint(), incidentId(), FLAGS, incidentCommand() (+52 more)

### Community 35 - "common.cjs"
Cohesion: 0.15
Nodes (27): connections(), fs, main(), path, crypto, ensureInside(), { execFileSync }, fs (+19 more)

### Community 36 - "pr-observation-shape.ts"
Cohesion: 0.21
Nodes (19): githubPRDescription(), closingDirectives(), ObservedPR, enumValue(), fail(), graphqlPR(), mapped(), member() (+11 more)

### Community 37 - "routing.cjs"
Cohesion: 0.12
Nodes (28): fs, main(), path, { spawnSync }, frontmatterProblems(), adjacency(), edgeCost(), edgeKey() (+20 more)

### Community 38 - "entry.ts"
Cohesion: 0.08
Nodes (30): LessonSelection, EntryRead, EntrySchema, ID_MAX, parseEntry(), PATH_MAX, PATHS_MAX, PLAYBOOK_KINDS (+22 more)

### Community 39 - "lesson-selection.ts"
Cohesion: 0.13
Nodes (19): assignedToJoe(), fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), tryReadyLessonIssue(), Wait, INSTALLED, installedLesson() (+11 more)

### Community 40 - "OfficeSnapshot"
Cohesion: 0.07
Nodes (48): knowledgeOutbox(), DailyCTOSummary, LessonDecisionAction, lessonDecisionState(), readLessonDecision(), DAYS, dueLessonDecisions(), easternWeek() (+40 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.18
Nodes (22): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), midnight(), TicketDay (+14 more)

### Community 42 - "accessibility-sources.ts"
Cohesion: 0.27
Nodes (16): actionable(), closingPull(), Finding, handoffIssue(), issueLines(), issueSource(), observation, reconcileSourceEffects() (+8 more)

### Community 43 - ".save"
Cohesion: 0.09
Nodes (62): enumerateIntakeList(), inPickupOrder(), Intake, text(), resolveBlockedTransition(), document(), transitionWithComment(), jiraAccount() (+54 more)

### Community 45 - "harness-baseline.ts"
Cohesion: 0.15
Nodes (22): BaselineReport, baselineReport(), BaselineSource, baselineText(), millions(), row(), share(), add() (+14 more)

### Community 46 - "credential-spans.ts"
Cohesion: 0.11
Nodes (33): queryValue(), separatorEscapeAt(), apostropheEnd(), BARE, bareSpans(), credentialSpans(), genuineGap(), HEADER_VALUE (+25 more)

### Community 47 - "rate-limit-samples.ts"
Cohesion: 0.09
Nodes (26): GraphqlAnswer, graphqlAnswer(), responseBody(), AppReadiness, serviceAppPrincipals, AMBIENT_TOKENS, ChildCredential, CREDENTIAL_TRACING (+18 more)

### Community 48 - "digest"
Cohesion: 0.11
Nodes (34): OwnershipRead, interruptedImplementation(), continueOwnershipRead(), expiredOwnershipRead(), handoffOwnership(), ReadbackOwnerDecision, ownershipReadGate(), ownershipReadState() (+26 more)

### Community 49 - "DeploymentFence"
Cohesion: 0.23
Nodes (7): assertToken(), DeploymentFence, deploymentFenceGate(), DeploymentFenceGateContext, STOPPING_COMMANDS, stoppingCommand(), DeploymentFenceRouteContext

### Community 50 - "QuestionStepper.tsx"
Cohesion: 0.19
Nodes (18): FeatureQuestionProjection, OutboxQuestionRound(), send(), draftKey(), readDraft(), saveDraft(), QuestionRound(), nextQuestion() (+10 more)

### Community 51 - "activation-recovery.ts"
Cohesion: 0.11
Nodes (35): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+27 more)

### Community 52 - "investigations/ledger.ts"
Cohesion: 0.12
Nodes (27): acceptedCompletionResolution(), INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationCandidates(), investigationId(), finishedSubjectResolution(), investigationFollowUps(), interruptedQARerunResolution() (+19 more)

### Community 53 - "trial-comment.ts"
Cohesion: 0.16
Nodes (29): ProofComment, dispatchSecond(), issueUrl(), proofCommentQualification(), QualifyEntry, assertSavedTrial(), isTrialWriter(), TRIAL_AUTHORIZATION (+21 more)

### Community 54 - "local-config.ts"
Cohesion: 0.13
Nodes (27): AUTO_ADOPT_BOTS, AutoAdoptBot, EffectiveAutoAdopt, effectiveAutoAdopt(), assertFeaturePlanningConfig(), GitHubAppConfig, goalEvidencePath(), OfficeConfigInputs (+19 more)

### Community 55 - "weekly-rollup.ts"
Cohesion: 0.12
Nodes (29): expireLearningPackets(), packetReferences(), learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck() (+21 more)

### Community 56 - "runner-root.ts"
Cohesion: 0.05
Nodes (82): guardPresent(), overseerCommand(), reconcileArgs(), resolveCliRoot(), runnerStatus(), DEFAULT_OFFICE_URL, LOOPBACK, officeUrl() (+74 more)

### Community 57 - "brain-audit-reuse.ts"
Cohesion: 0.21
Nodes (12): bindBrainAuditEffects(), Effect, Known, brainAuditRetryFingerprint(), Context, jsonAfter(), nativeSessionPath(), readPriorBrainAudit() (+4 more)

### Community 58 - "fact-bounds.ts"
Cohesion: 0.18
Nodes (19): leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance() (+11 more)

### Community 59 - "redactEvidence"
Cohesion: 0.08
Nodes (52): deliveryRetryDecisions(), attributedRecords(), foldsItsRun(), groupCandidates(), clip(), clipLapse(), evidencePacket(), ordered() (+44 more)

### Community 60 - "cost-ledger.ts"
Cohesion: 0.13
Nodes (31): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress(), effectId() (+23 more)

### Community 61 - "assignments.ts"
Cohesion: 0.11
Nodes (23): clip(), DEMAND_LIMIT, demandFacts(), DemandSection, key(), LessonKey, notes(), AssignmentLookups (+15 more)

### Community 62 - "Conversation.tsx"
Cohesion: 0.10
Nodes (34): ChatMarkdown(), Conversation(), ConversationDraft, createConversationDrafts(), SendMessage, isLessonDecision(), ChatMarkdown, MessageText() (+26 more)

### Community 63 - "deployed-fixes.ts"
Cohesion: 0.16
Nodes (24): inHistoryOf(), CompareMemory, compareMemory(), COMPARES_PER_PASS, comparison(), DeployedFixes, DeployedFixesInput, recordDeployedFixes() (+16 more)

### Community 64 - "constellation-runtime.ts"
Cohesion: 0.07
Nodes (35): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), CameraPose, flightPose(), cameraTarget() (+27 more)

### Community 65 - "validate_pr_body.cjs"
Cohesion: 0.36
Nodes (8): fs, main(), readableText(), REQUIRED_CHECKS, REQUIRED_SECTIONS, sections(), validatePullRequestBody(), withoutComments()

### Community 66 - "audit-plan-candidates.cjs"
Cohesion: 0.14
Nodes (31): audit(), branchIssueNumbers(), classify(), distinctiveTitleWords(), { execFileSync }, extractPaths(), findPrForMergeSubject(), fmtCommit() (+23 more)

### Community 67 - "office-client.ts"
Cohesion: 0.09
Nodes (28): FailureAnswer, HaltAnswer, RUNNER_DEFAULTS, officeDataRoot, realMachine(), bodyWithin(), bounded(), Envelope (+20 more)

### Community 68 - "resume-arrivals.ts"
Cohesion: 0.10
Nodes (65): SETUP_STOP_CAP, restartStoppedWriters(), unchangedSinceAccepted(), DeliveryAuthorityInput, canonical(), CheckpointEligibility, checkpointEligibility(), admitAssignmentResume() (+57 more)

### Community 69 - "App.tsx"
Cohesion: 0.04
Nodes (87): compactSteps(), BrainDrawer(), App(), BrainWorkspace, CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants (+79 more)

### Community 70 - "OfficeScene.tsx"
Cohesion: 0.08
Nodes (58): withoutElapsed(), CameraBookmark, restoreBookmark(), LiveAgentTask(), Props, RunningTask(), text(), Avatar() (+50 more)

### Community 71 - "spawn-command.ts"
Cohesion: 0.09
Nodes (35): Event, exactCommand(), Invocation, localHookCommand(), one(), prePushRejection(), PushIdentity, retirementBoundary() (+27 more)

### Community 72 - "session-context-file.ts"
Cohesion: 0.20
Nodes (14): ContextFoldPrefix, contextFoldPrefix(), SessionContextCheckpoint, captureSessionContextClone(), ContextReadPhase, SessionContextDeadline, sessionContextFile(), ContextReadChanged (+6 more)

### Community 73 - "projects.ts"
Cohesion: 0.08
Nodes (39): escaped(), IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), projectListScope(), azureSchema, deploymentSchema (+31 more)

### Community 74 - "session-scope.ts"
Cohesion: 0.18
Nodes (17): Bound, claudeScopeParser(), claudeSessionScope(), CLAUDE_TRANSCRIPTS, CODEX_ROLLOUTS, contextReaders(), retainSessionMessage(), SessionConversation (+9 more)

### Community 75 - "service-health.ts"
Cohesion: 0.12
Nodes (22): ClaudeLoginRefusal, claudeLoginRefusal(), claudeRefusalWords(), RECORDED_REFUSALS, refusedClaudeRow(), providers, ProviderStatusChecks, summary (+14 more)

### Community 76 - "project-bindings.ts"
Cohesion: 0.09
Nodes (39): AzureMonitor, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs(), fullActivePRs(), observation() (+31 more)

### Community 77 - "closeout-recovery.ts"
Cohesion: 0.11
Nodes (41): assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint(), closeoutProviderEvidence() (+33 more)

### Community 78 - "record-runner-failure.ts"
Cohesion: 0.08
Nodes (30): incidentNotices(), NOTICE_KINDS, STATUS, classify(), isRestoration(), KEY, newer(), record() (+22 more)

### Community 79 - "cec.ts"
Cohesion: 0.09
Nodes (29): movedHeadNote(), cecPrompt(), resolvedDecisionNote(), stageInstructions, stageInstructionsFor(), REVIEW_FINDINGS_RULE, capacityInterruptedRun(), providerSaid() (+21 more)

### Community 80 - "session-bridge.ts"
Cohesion: 0.10
Nodes (30): claudeSessionContext(), codexDaemonProcesses(), accountCodexProcesses(), CodexProcessInventory, codexProcessInventory(), DesktopSessions, unaccountedProcesses(), codexSessionContext() (+22 more)

### Community 81 - "github-delivery.ts"
Cohesion: 0.05
Nodes (85): writerRestartInstruction(), assertNoModelFallback(), findingsBlock(), metadataCarriedAdvisoryIds(), ownedBefore(), QA_STAGES, reviewAdvisoryIds(), Reviewed (+77 more)

### Community 82 - "interrupted-work-recovery.ts"
Cohesion: 0.27
Nodes (9): interruptAdoptions(), legacy(), REMOVED_FIELDS, retireLegacyRecovery(), goalNoticeNeverDispatched(), maintenanceNoticeNeverDispatched(), checkpointOutcome(), Outcome (+1 more)

### Community 83 - "owner-merged-stopped.ts"
Cohesion: 0.08
Nodes (42): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), maintenanceCandidate(), moveAside(), moveBack(), purgeRemoved(), purging (+34 more)

### Community 84 - "viewer.js"
Cohesion: 0.19
Nodes (25): addMetaLink(), addMetaRow(), addRelationship(), applyView(), buildIndexes(), buildLegend(), buildModel(), buildRenderer() (+17 more)

### Community 85 - "maintenance/maintenance.ts"
Cohesion: 0.12
Nodes (23): accessibilitySources(), sourceFindings, sourceReview(), SETTLED, skipOwnedCandidate(), Skipped, skippedCandidateLedger(), CmsFollowUpContext (+15 more)

### Community 86 - "stopped-record.ts"
Cohesion: 0.08
Nodes (54): capabilityBlockedReviews(), latestReviews(), boundedEvidence(), expectedWait(), StopFacts, normalizeCause(), IncidentCollector, COLLECTORS (+46 more)

### Community 87 - "bare-value.ts"
Cohesion: 0.16
Nodes (18): BareValue, bareValue(), deeperValueEnd(), ENDS, isSeparator(), plainEscape(), SIMPLE, Unit (+10 more)

### Community 88 - "superseded-wiki-pr.ts"
Cohesion: 0.12
Nodes (46): abandon(), assertOpenSnapshot(), awaitingContainment(), closeIssue(), CloseRevalidationError, closeSuperseded(), comment(), CommentStep (+38 more)

### Community 89 - "ref_node_child_process"
Cohesion: 0.13
Nodes (18): changedPaths(), { execFileSync }, files, isMapInput(), mapOnly(), { execFileSync }, git(), publish() (+10 more)

### Community 90 - "Engine"
Cohesion: 0.06
Nodes (30): az(), correlatedBuild(), ResumeProject, Azure, azurePipelines(), outcome(), Read, RUNS_PER_PIPELINE (+22 more)

### Community 91 - "ticket-evidence.ts"
Cohesion: 0.06
Nodes (57): CommentPage, commentReadback(), devUpdate(), HEADLINE, jiraRecord(), unpack(), parksInJira(), postDevUpdate() (+49 more)

### Community 92 - "session-context-client.ts"
Cohesion: 0.13
Nodes (18): readTranscript, readRollout, packContextFailure(), PackedContextFailure, unpackContextFailure(), LiveSession, ContextThread, contextThread() (+10 more)

### Community 93 - "plans.cjs"
Cohesion: 0.13
Nodes (27): fs, main(), parse(), path, repoRoot(), substantive(), walk(), association() (+19 more)

### Community 94 - ".emit"
Cohesion: 0.04
Nodes (83): currentOutbox(), BLOCK, harnessBlockMove(), harnessParkedCard(), noted(), retryCandidateCleanup(), admit(), admitReadyCards() (+75 more)

### Community 96 - "enrollment-gate.ts"
Cohesion: 0.38
Nodes (12): currentApproval(), featureGate(), predecessorComplete(), DeliveryPreflight, deliveryPreflight(), handoffBinding(), readHandoff(), sameBinding() (+4 more)

### Community 97 - "cec/issue-publication.ts"
Cohesion: 0.08
Nodes (24): Assignment, contentSchema(), JiraIssuePublisher, jiraText(), Transition, descriptionPreimage(), plain(), publicationDescription() (+16 more)

### Community 98 - "StageResult"
Cohesion: 0.04
Nodes (98): candidateBranchMoved(), endChangeScope(), scopeOutgrown(), confirmsMovedHead(), Moved, movedHeadUnconfirmed(), recordConfirmedHead(), routeConfirmedHead() (+90 more)

### Community 99 - "archive-plan.cjs"
Cohesion: 0.12
Nodes (33): fs, main(), parse(), path, archive(), cell(), ensureIndex(), fromArgs() (+25 more)

### Community 100 - "call-scope.ts"
Cohesion: 0.07
Nodes (44): add(), addSource(), busiest(), CallLedger, Entry, sourceRows(), Sources, CallCounts (+36 more)

### Community 101 - "jira-attempts.ts"
Cohesion: 0.11
Nodes (25): attempted(), attemptState(), bound(), covers(), JiraAttempt, jiraAttempts(), JiraAttemptState, open() (+17 more)

### Community 102 - "blocker-followups.ts"
Cohesion: 0.10
Nodes (47): followupRecord(), handoff(), heldForRepair(), reconcileBlockerFollowups(), actionKey(), bindHandoff(), bindings(), bound() (+39 more)

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
Nodes (21): projectData(), StoreDatabase, ControllerEffects, controllerEffects(), DEPLOY_PROJECT, alive(), ControllerMachine, option() (+13 more)

### Community 107 - ".getEffect"
Cohesion: 0.05
Nodes (108): effectKey(), LaneOperation, laneWrite(), moveCardOnce(), Lane, MOVABLE, moveLane(), resolveLane() (+100 more)

### Community 108 - "judge-resumes.ts"
Cohesion: 0.09
Nodes (27): absent(), IncidentLedger, judgeResumes(), JudgeResumesInput, Open, openSubjects(), checkpointRetried(), movedByHand() (+19 more)

### Community 109 - "pr-observation-graphql.ts"
Cohesion: 0.13
Nodes (29): ChildRequest, headCheckRuns(), includeBody(), readOpenPRs(), commitOf(), ConnectionPages, embeddedHead(), fail() (+21 more)

### Community 110 - "conversation-recovery.ts"
Cohesion: 0.64
Nodes (7): conversationReadbackReady(), followupOf(), pendingReadback(), queueConversationReadback(), readbackEnding(), uncertainConversations(), readBackConversations()

### Community 111 - "follow-production.ts"
Cohesion: 0.14
Nodes (23): awaitingJiraStatus(), awaitingProduction(), FOLLOW_DAYS, followed(), isFollowed(), Azure, AzureRead, containedIn() (+15 more)

### Community 112 - "brain-maintenance.ts"
Cohesion: 0.15
Nodes (15): maintenancePolicies(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, brainResultStop(), GateMark, gateMark(), MAX_START_RETRIES (+7 more)

### Community 113 - "index.tsx"
Cohesion: 0.08
Nodes (55): phases, LinkedFeatures(), SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS (+47 more)

### Community 114 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 115 - "telemetry.ts"
Cohesion: 0.07
Nodes (37): add(), CodexRequest, CodexRollout, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens() (+29 more)

### Community 119 - "timed-statements.ts"
Cohesion: 0.22
Nodes (12): StoreTimings, NAMED, rowsText(), rowText(), SQL_TOKEN, statementName(), text(), timed() (+4 more)

### Community 120 - "MaintenanceRun"
Cohesion: 0.14
Nodes (20): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, maintenanceKey(), azurePrUrl(), findSubject(), jobSubject() (+12 more)

### Community 121 - "write-boundary.ts"
Cohesion: 0.15
Nodes (20): appCredential(), operatorRollbackCredential(), GitHubIdentityRuntime, appToken(), bindingOf(), changeDigest(), claimRefusal(), executeGitHubWrite() (+12 more)

### Community 122 - "daily-cto.ts"
Cohesion: 0.11
Nodes (16): DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), reviewWeekday(), queueGoalEvidenceRequest(), DailyResultSchema, FreshDailyResultSchema (+8 more)

### Community 123 - "deploy-command.ts"
Cohesion: 0.08
Nodes (46): CONTROLLER_ENTRY, ControllerPin, Pin, pinnedController(), readControllerPin(), writeControllerPin(), controllerStartFailure(), controllerOf() (+38 more)

### Community 124 - "refresh-issue-state.cjs"
Cohesion: 0.19
Nodes (20): atomicWrite(), advanceFence(), closingIssues(), githubRefs(), key(), normalizeGithubQuery(), normalizeRepository(), parseGithubQuery() (+12 more)

### Community 125 - "http/commands.ts"
Cohesion: 0.17
Nodes (16): configureNotices(), retryRecipientLookup(), normalizeStatement(), declineLessonIssue(), reactivateLesson(), retireLesson(), decideOfficeProposal(), mirrorOfficeKnowledge() (+8 more)

### Community 126 - "office-qa-handoff.ts"
Cohesion: 0.60
Nodes (4): OfficeQAHandoff, OfficeQAHandoffInput, OfficeQAHandoffRequest, QAOwnershipProof

### Community 127 - "sign-in-unpark.ts"
Cohesion: 0.07
Nodes (46): readbackDispatchGuidance(), currentEnvironmentWait(), environmentWait(), waitText(), rerunsInterruptedQA(), officeRefusedQA(), hasPendingDelivery(), resumeAfterSignIn() (+38 more)

### Community 128 - "commit-object.ts"
Cohesion: 0.38
Nodes (9): CommitObject, commitOid(), MAX_SUFFIX, parseCommit(), readCommit(), readSuffix(), withFinalLF(), verifyReword() (+1 more)

### Community 129 - "ref_node_path"
Cohesion: 0.06
Nodes (65): file, folder, logs, root, ctoInputIdentityMatches(), ctoInputRecovered(), writerRestartPending(), removeAdoptedClone() (+57 more)

### Community 130 - "retry-binding.ts"
Cohesion: 0.21
Nodes (16): iso(), planDeliveryRetry(), bindRetry(), freshRetry(), queuedDetail(), scopedRetry(), withdrawRetry(), QUOTA_FALLBACK_MS (+8 more)

### Community 131 - "follow-up-alerts.ts"
Cohesion: 0.21
Nodes (13): checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), repeatedVendorReviewBlock(), stoppedInVendorReview(), leftToNextRun(), NEXT_RUN_DUE_MS, night() (+5 more)

### Community 132 - "release-marker-stop.ts"
Cohesion: 0.15
Nodes (22): Classification, attachCheckout(), interruptCorrectionAtStartup(), interruptedCorrection(), observeCorrectionCheckout(), observeInterruptedCorrections(), pendingOf(), persistMarkerStop() (+14 more)

### Community 133 - "work.ts"
Cohesion: 0.10
Nodes (22): effectiveCause(), REPLACED, NO_RECORD, BLOCKED_CAUSES, blockedCauses(), NONE, projectReadiness(), READ_OPERATIONS (+14 more)

### Community 134 - "state-parts.ts"
Cohesion: 0.19
Nodes (9): LARGE_KEY_CHARS, plain(), RedactedEntries, RedactedEntry, redactEntries(), PartRow, partSize(), StateParts (+1 more)

### Community 135 - "triage.ts"
Cohesion: 0.04
Nodes (94): resolveRange(), Agreement, agreement(), anchor(), compare(), disposition(), factsKey(), file() (+86 more)

### Community 136 - "knowledge.ts"
Cohesion: 0.07
Nodes (40): LessonBrainAudit, LessonBrainOverlap, citations(), recordAcceptedKnowledge(), stageName(), knowledgeCitation(), lessonCitation(), Input (+32 more)

### Community 137 - "it-specialist.ts"
Cohesion: 0.20
Nodes (14): replacedReadback(), heldFor(), ITContext, recoveryHeld(), recoveryWait(), informationalRecovery(), ITSpecialist, ownAzureCheck() (+6 more)

### Community 138 - "operationPaths"
Cohesion: 0.34
Nodes (10): Body, DeploymentFenceState, fenceTokenDigest(), operationPaths(), createDeployToken(), readDeployToken(), removeDeployToken(), endDeployment() (+2 more)

### Community 139 - "scheduled-work.ts"
Cohesion: 0.07
Nodes (43): freshOwnershipRead(), conversationResolved(), deliverySlot(), Ownership, ownershipContext, refreshDeliveryOwnership(), RefreshOwnership, withAmendmentOwnership() (+35 more)

### Community 140 - "indeterminate"
Cohesion: 0.12
Nodes (33): classifyMarkedCommits(), assertSingleRoot(), Inventory, npmEnvironment(), NpmTool, PACK_FLAGS, packInventory(), parsePack() (+25 more)

### Community 141 - "metadata-park-words.ts"
Cohesion: 0.42
Nodes (9): field(), FIELDS, MetadataField, metadataFields(), metadataParkWords(), metadataStopWords(), needed(), sentence() (+1 more)

### Community 142 - "scheduler.ts"
Cohesion: 0.12
Nodes (15): OfficeCapacity, PROJECT_LOCAL, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch() (+7 more)

### Community 144 - "reconcile-merges.cjs"
Cohesion: 0.22
Nodes (14): collectPulls(), copyWikiForDryRun(), { execFileSync }, flattenPages(), fs, githubRequest(), isWikiBotPull(), main() (+6 more)

### Community 145 - "draft-provenance.ts"
Cohesion: 0.14
Nodes (22): readRejection(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), metadataRequestResolved(), preparationRequestResolved(), DraftProvenance, draftStep(), draftWorker() (+14 more)

### Community 146 - "requests.ts"
Cohesion: 0.08
Nodes (77): containedFile(), assertContinuationWorker(), continuationReviewArtifacts(), continuationScope(), continuationWorktree(), negativeWorker(), continuationGuard(), reconcileContinuationReview() (+69 more)

### Community 147 - "store.ts"
Cohesion: 0.05
Nodes (56): Clock, systemClock, DELIVERY_CONCURRENCY, InFlightOperations, projectById(), checkpointLabel(), applyConnectionSettings(), closeConnection() (+48 more)

### Community 148 - "reader-profiles.ts"
Cohesion: 0.14
Nodes (17): CODEX_LAST_MESSAGE_ARGUMENT, CODEX_SCHEMA_ARGUMENT, CLAUDE_EFFORTS, CLAUDE_TOOLS, claudePieces(), claudeReader(), CODEX_EFFORTS, CODEX_TOOLS (+9 more)

### Community 149 - "resume-control.ts"
Cohesion: 0.29
Nodes (7): absent(), NEVER_ENABLED, ResumeControl, stated(), Stored, unreadable(), ResumeSwitch

### Community 150 - "serve-graph.cjs"
Cohesion: 0.24
Nodes (9): createServer(), fs, http, listen(), attempt(), main(), path, resolveRequest() (+1 more)

### Community 151 - "read-retries.ts"
Cohesion: 0.23
Nodes (12): APPROACH_GUARD_REJECTION, PrerequisitesSchema, classifyStop(), planReadRetry(), reconcileReadRetries(), RETRY_PLAN_GRACE_MS, ghServerError(), ghStatus() (+4 more)

### Community 152 - "incidents/routes.ts"
Cohesion: 0.13
Nodes (30): DISMISSAL_CITATIONS, dismissalRequest(), PACKET_EVENTS, REPAIR_SUBJECTS, ResolvedWrite, SubjectFixSchema, WriteRequest, readRepairIssue() (+22 more)

### Community 153 - "Store"
Cohesion: 0.05
Nodes (34): ExistingPublicationConflict, GitHubFeaturePublisher, helperTelemetry(), JiraFeaturePublisher, helperInstallation(), observeHelperGroups(), stopHelperGroups(), FeatureReviewRunner (+26 more)

### Community 155 - "recorded-gh-command.ts"
Cohesion: 0.19
Nodes (20): assignments(), changeDirectory(), closing(), CREATE, createGuard(), flags(), named(), read() (+12 more)

### Community 156 - "publish-pr.ts"
Cohesion: 0.10
Nodes (34): retryRead(), createdContentSha256(), assertExistingPublication(), Candidate, checkAdoption(), checkContinuationAdoption(), checkWriterAdoption(), Owner (+26 more)

### Community 157 - "observe-github-merges.ts"
Cohesion: 0.16
Nodes (22): clearCooldown(), coolDown(), coolingDown(), MERGE_NOTICE_RECHECK_MS, waitKey(), waits, isMergeCommit(), issueOf() (+14 more)

### Community 158 - "push-destination.ts"
Cohesion: 0.42
Nodes (8): digest(), Execute, file(), PUSH_HOOKS, pushHookChain(), inspect(), unresolved(), CommandOptions

### Community 160 - "diagnostic-snapshot.ts"
Cohesion: 0.41
Nodes (7): assignmentDiagnostics(), diagnosticContext(), diagnosticSnapshot(), itAgent(), itDiagnostics(), followUpStatus(), outstandingFollowUps()

### Community 161 - "office-authors.ts"
Cohesion: 0.30
Nodes (12): harnessMergeAttempted(), mergeEffects(), officeMerge(), githubIdentity(), appSelected(), discoveredAuthor(), discoveryAuthors(), expectedAuthor() (+4 more)

### Community 162 - "github-check-selection.ts"
Cohesion: 0.08
Nodes (51): resumeProviderReviews(), observe(), CheckJobAgreement, checkJobAgreement(), isKnownCheckStatus(), positive(), STATE, UNFINISHED (+43 more)

### Community 163 - "original-git.ts"
Cohesion: 0.34
Nodes (14): Git, hasCommit(), isSha(), Options, shallowBoundaries(), unreadable(), walkCommits(), WalkedCommit (+6 more)

### Community 164 - "telemetry/report.ts"
Cohesion: 0.25
Nodes (14): TimeLedgerState, Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked() (+6 more)

### Community 165 - "GitHubOperations"
Cohesion: 0.47
Nodes (3): GitHubOperations, closeNativeRefresh(), fingerprint()

### Community 166 - "launch.mjs"
Cohesion: 0.06
Nodes (101): RFC-9562, BANNER, builtin(), bundleLauncher(), LAUNCHER_BUNDLE, LAUNCHER_ENTRY, launcherChunk(), REPOSITORY (+93 more)

### Community 167 - "release-marker-policy.ts"
Cohesion: 0.21
Nodes (11): active(), ACTIVE_ANALYZER, ACTIVE_FILTER, count(), readReleasePolicy(), ReleasePolicy, SELECTS_ANALYZER, RELEASE_MARKER (+3 more)

### Community 168 - "admit-improvement.ts"
Cohesion: 0.18
Nodes (19): writerRefused(), writerSuccessor(), admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey() (+11 more)

### Community 169 - "continue-access-only-plan.ts"
Cohesion: 0.54
Nodes (6): Document, document(), isAccessOnlyPlan(), settledAccessOnlyState(), continueAccessOnlyPlan(), entryExists()

### Community 170 - "it-report.ts"
Cohesion: 0.27
Nodes (10): followUpPicture(), publishITReport(), archiveOldReports(), RETAINED_REPORTS, archiveByMonth(), archiveHistory(), archiveMonth(), archiveOldTaskDetail() (+2 more)

### Community 171 - "deploy-plan.ts"
Cohesion: 0.10
Nodes (43): runningRevision(), runningRevision(), releaseIdentity(), runtimeRevision(), ActiveRelease, readActiveRelease(), BUILD_ENV, buildRelease() (+35 more)

### Community 172 - "goal-reviews.ts"
Cohesion: 0.14
Nodes (19): currentCitations(), Fact, NOT_CURRENT, PROVIDER_ERROR, applyGoalReview(), DeliveryJob, EvidenceRefSchema, jobAccepted() (+11 more)

### Community 173 - "security.ts"
Cohesion: 0.14
Nodes (16): redactCredentials(), redactUnquoted(), AFTER_JSON_ESCAPE, BEARER_CREDENTIAL, escapedAt(), HEADER_CREDENTIAL, HEADER_OPERAND, HEADER_PREFIX (+8 more)

### Community 174 - "player.ts"
Cohesion: 0.14
Nodes (10): releaseSoundEvents, themeColor, bindSoundInteractions(), control(), hoverable(), sceneHover, officeSound, recordings (+2 more)

### Community 175 - "credential-patterns.ts"
Cohesion: 0.11
Nodes (17): AFTER_LABEL, BARE_CREDENTIAL, BARE_LABEL, BARE_UNIT, BARE_VALUE, CAMEL_START, CONTROL_ESCAPE, CREDENTIAL_NAME (+9 more)

### Community 176 - "EffectIntent"
Cohesion: 0.16
Nodes (13): CommentReceipt, Write, AppTrialResult, nextStep(), trialResult(), SelectedWriter, EffectOperation, EffectVerification (+5 more)

### Community 177 - "inspect-closed-plan.ts"
Cohesion: 0.07
Nodes (40): GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles(), ContinuationIO (+32 more)

### Community 178 - "saved-state.ts"
Cohesion: 0.38
Nodes (7): readSavedState(), joinParts(), readSaved(), SavedSelection, SavedStateConflict, savedText(), selectSaved()

### Community 179 - "restart-writer.ts"
Cohesion: 0.31
Nodes (8): ATTEMPT_DELAYS_MS, nextAttemptAt(), NOT_RETRYABLE, releaseFunds(), StoppedWriter, WRITER_STAGES, WriterRestartCandidate, writerRestartCandidate()

### Community 180 - "preferences-store.ts"
Cohesion: 0.12
Nodes (12): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, soundFields, StoredBody, PreferenceState (+4 more)

### Community 181 - "reconcileGitHubWrite"
Cohesion: 0.39
Nodes (10): officeMergeProvenance(), reconcileMergeScannerRetry(), Retry, retryMergeScanner(), retryReadBack(), runIdentity(), savedRetry(), transientScannerJobs() (+2 more)

### Community 182 - "time-ledger.ts"
Cohesion: 0.25
Nodes (13): publishableEntry(), settlementPending(), superseded(), ticketUnresolved(), syncing, clearUnsent(), dueUnsent(), markUnsent() (+5 more)

### Community 183 - "session-snapshot-cleanup.ts"
Cohesion: 0.40
Nodes (5): SNAPSHOT_PREFIX, removeStaleSessionSnapshots(), SNAPSHOT_SWEEP_MS, STALE_SNAPSHOT_MS, sweepStaleSessionSnapshots()

### Community 184 - "quota-governor.ts"
Cohesion: 0.11
Nodes (28): boardReadFailure(), refusedByRateLimit(), withGitHubOperation(), GitHubMonitor, Api, terminalPRs(), backgroundHold(), CORE_RESERVE (+20 more)

### Community 185 - "useLiveTiming.ts"
Cohesion: 0.24
Nodes (13): AzureBuild, lastWall, sample(), subscribe(), subscribers, useLiveClock(), liveBuildTiming(), liveTiming() (+5 more)

### Community 186 - "deploy.ts"
Cohesion: 0.10
Nodes (45): abandon(), advance(), deploy(), DEPLOY_STEPS, DeployFacts, append(), assertNext(), deployJournalPath() (+37 more)

### Community 187 - "TicketJob"
Cohesion: 0.05
Nodes (69): stoppedWriter(), writerRestarted(), enterBoundRetry(), parentPrerequisite(), ProjectProgress, readBackSavedDraftUpdates(), candidateIdentity(), candidateSlug() (+61 more)

### Community 188 - "return-marked-candidate.ts"
Cohesion: 0.30
Nodes (12): originalGit(), recordReturn(), short(), inspectReleaseMarkers(), carriesMarker(), dispatchedCorrection(), MAX_RELEASE_MARKER_RETURNS, pendingReturn() (+4 more)

### Community 189 - "evidence-artifacts.ts"
Cohesion: 0.31
Nodes (11): readEvidence(), ProviderEvidence, canonical(), evidenceDigest(), evidenceHash(), semantic(), stableUrl(), refreshFeatureEvidence() (+3 more)

### Community 190 - "assignment-context.ts"
Cohesion: 0.31
Nodes (9): CARD_READ_ARGS, validCardRead(), assertDraftClaimHistory(), protectedOriginalClaim(), accountRead(), publicationReadArgs(), Read, assignments (+1 more)

### Community 191 - "evidence.ts"
Cohesion: 0.31
Nodes (8): investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_SOURCE_PATHS, officeSource(), launchPolicyFacts(), lifecycleFacts()

### Community 192 - "validate_wiki_pr_body.cjs"
Cohesion: 0.33
Nodes (5): { execFileSync }, hasCanonicalWikiBody(), maintenanceBodies, matchesMaintenanceBody(), { readFileSync }

### Community 193 - "owner-step-items.ts"
Cohesion: 0.27
Nodes (8): OwnerStepItem, ownerStepItems(), signIn(), commands(), SIGN_IN_SERVICE_TROUBLE, signInSteps(), Step, OwnerSteps

### Community 194 - "proof-comment.ts"
Cohesion: 0.53
Nodes (10): commentId(), CommentIntent, conversation(), exact(), findProofComment(), matchesProofComment(), postProofComment(), readCommentId() (+2 more)

### Community 195 - "DailyCTO.tsx"
Cohesion: 0.35
Nodes (7): CTOReview(), goalState, DailyCTO(), reportDate(), reviewStatus, InlineText(), ReviewText()

### Community 196 - "OfficeConfigView.tsx"
Cohesion: 0.33
Nodes (9): loadOfficeConfig(), OfficeConfigSection(), autoAdoptText(), BOT_NAMES, OfficeConfigState, OfficeConfigView(), policyText(), releaseMarkerText() (+1 more)

### Community 197 - "ITFollowUps.tsx"
Cohesion: 0.67
Nodes (4): itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps()

### Community 198 - "checkpoint-retry.ts"
Cohesion: 0.33
Nodes (8): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), legacy, validateNativeContinuation(), Continuation

### Community 199 - "wait-idle.ts"
Cohesion: 0.40
Nodes (4): Health, IdleObservation, IdleResult, WaitIdleInput

### Community 201 - "provider-limit-resolution.ts"
Cohesion: 0.39
Nodes (6): investigatesLimitRefusal(), PROVIDER_RECOVERED, providerLimitResolution(), refusedAtLimit(), MONTHS, providerLimit()

### Community 202 - "seeded-office-lessons.ts"
Cohesion: 0.32
Nodes (5): CONSOLIDATED, CONSOLIDATED_AT, SEEDS, seedOfficeLessons(), SEEDS

### Community 204 - "stop-evidence.ts"
Cohesion: 0.62
Nodes (6): inScope(), applyLateWindow(), endDeliveryQuota(), iso(), noteDeliveryStop(), stopFailure()

### Community 205 - "salvage-worktree.ts"
Cohesion: 0.48
Nodes (6): Execute, keptWork(), Read, refObject(), SalvageRetry, salvageWorktree()

### Community 206 - "unblock-brief.ts"
Cohesion: 0.53
Nodes (5): clearUnblockBrief(), key(), saveUnblockBrief(), UnblockBrief, unblockBrief()

### Community 208 - "evidenceText"
Cohesion: 0.80
Nodes (4): evidenceText(), field(), jsonString(), opening()

## Knowledge Gaps
- **1 isolated node(s):** `RFC-9562`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 1451 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `agents.ts`, `features.ts`, `marker-correction.ts`, `record-event.ts`, `route-activation.ts`, `api-routes.ts`, `github-readiness.ts`, `scheduled-captures.ts`, `run-retrospective.ts`, `record-trigger.ts`, `delivery-retry.ts`, `jira-time.ts`, `ref_zod`, `sanitize`, `advance-metadata-park.ts`, `knowledge/routes.ts`, `metadata-context.ts`, `identity-runtime.ts`, `ref_node_crypto`, `artifact`, `entry.ts`, `lesson-selection.ts`, `OfficeSnapshot`, `time-scope.ts`, `accessibility-sources.ts`, `.save`, `Offices`, `digest`, `activation-recovery.ts`, `investigations/ledger.ts`, `trial-comment.ts`, `weekly-rollup.ts`, `brain-audit-reuse.ts`, `fact-bounds.ts`, `redactEvidence`, `cost-ledger.ts`, `assignments.ts`, `resume-arrivals.ts`, `project-bindings.ts`, `closeout-recovery.ts`, `cec.ts`, `session-bridge.ts`, `github-delivery.ts`, `interrupted-work-recovery.ts`, `owner-merged-stopped.ts`, `maintenance/maintenance.ts`, `superseded-wiki-pr.ts`, `Engine`, `ticket-evidence.ts`, `.emit`, `enrollment-gate.ts`, `cec/issue-publication.ts`, `StageResult`, `jira-attempts.ts`, `blocker-followups.ts`, `controller-runtime.ts`, `.getEffect`, `judge-resumes.ts`, `pr-observation-graphql.ts`, `conversation-recovery.ts`, `follow-production.ts`, `brain-maintenance.ts`, `MaintenanceRun`, `write-boundary.ts`, `http/commands.ts`, `sign-in-unpark.ts`, `ref_node_path`, `release-marker-stop.ts`, `state-parts.ts`, `knowledge.ts`, `it-specialist.ts`, `scheduled-work.ts`, `indeterminate`, `scheduler.ts`, `draft-provenance.ts`, `requests.ts`, `store.ts`, `read-retries.ts`, `incidents/routes.ts`, `publish-pr.ts`, `observe-github-merges.ts`, `diagnostic-snapshot.ts`, `office-authors.ts`, `github-check-selection.ts`, `admit-improvement.ts`, `continue-access-only-plan.ts`, `goal-reviews.ts`, `EffectIntent`, `inspect-closed-plan.ts`, `restart-writer.ts`, `time-ledger.ts`, `quota-governor.ts`, `TicketJob`, `return-marked-candidate.ts`, `evidence-artifacts.ts`, `assignment-context.ts`, `evidence.ts`, `proof-comment.ts`, `checkpoint-retry.ts`, `provider-limit-resolution.ts`, `stop-evidence.ts`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **What connects `RFC-9562` to the rest of the system?**
  _1 weakly-connected nodes found - possible missing edges._
- **Should `run-model.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.03755868544600939 - nodes in this community are weakly interconnected._
- **Why does `TicketJob` connect `TicketJob` to `ref_node_path`, `retry-binding.ts`, `agents.ts`, `release-marker-stop.ts`, `marker-correction.ts`, `follow-up-alerts.ts`, `cx`, `it-specialist.ts`, `scheduled-work.ts`, `outbox.ts`, `github-readiness.ts`, `scheduled-captures.ts`, `scheduler.ts`, `record-trigger.ts`, `requests.ts`, `draft-provenance.ts`, `delivery-retry.ts`, `read-retries.ts`, `ref_zod`, `Store`, `shared.ts`, `advance-metadata-park.ts`, `observe-github-merges.ts`, `publish-pr.ts`, `metadata-context.ts`, `office-authors.ts`, `github-check-selection.ts`, `artifact`, `release-marker-policy.ts`, `digest`, `inspect-closed-plan.ts`, `restart-writer.ts`, `activation-recovery.ts`, `reconcileGitHubWrite`, `brain-audit-reuse.ts`, `fact-bounds.ts`, `redactEvidence`, `return-marked-candidate.ts`, `assignment-context.ts`, `proof-comment.ts`, `resume-arrivals.ts`, `App.tsx`, `stop-evidence.ts`, `closeout-recovery.ts`, `github-delivery.ts`, `interrupted-work-recovery.ts`, `owner-merged-stopped.ts`, `stopped-record.ts`, `superseded-wiki-pr.ts`, `ticket-evidence.ts`, `.emit`, `StageResult`, `call-scope.ts`, `.getEffect`, `follow-production.ts`, `MaintenanceRun`, `sign-in-unpark.ts`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Should `PeoplePanel.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10823311748381129 - nodes in this community are weakly interconnected._
- **Why does `command()` connect `Store` to `ref_node_path`, `agents.ts`, `features.ts`, `marker-correction.ts`, `record-event.ts`, `github-readiness.ts`, `requests.ts`, `sandbox-qualification.ts`, `command-registry.ts`, `jira-time.ts`, `incidents/routes.ts`, `index.ts`, `sanitize`, `shared.ts`, `publish-pr.ts`, `knowledge/routes.ts`, `metadata-context.ts`, `identity-runtime.ts`, `ref_node_crypto`, `original-git.ts`, `lesson-selection.ts`, `admit-improvement.ts`, `continue-access-only-plan.ts`, `accessibility-sources.ts`, `.save`, `deploy-plan.ts`, `rate-limit-samples.ts`, `digest`, `inspect-closed-plan.ts`, `time-ledger.ts`, `weekly-rollup.ts`, `quota-governor.ts`, `deploy.ts`, `TicketJob`, `cost-ledger.ts`, `assignment-context.ts`, `deployed-fixes.ts`, `service-health.ts`, `project-bindings.ts`, `salvage-worktree.ts`, `closeout-recovery.ts`, `record-runner-failure.ts`, `session-bridge.ts`, `github-delivery.ts`, `owner-merged-stopped.ts`, `maintenance/maintenance.ts`, `Engine`, `ticket-evidence.ts`, `.emit`, `cec/issue-publication.ts`, `StageResult`, `jira-attempts.ts`, `controller-runtime.ts`, `.getEffect`, `brain-maintenance.ts`, `deploy-command.ts`, `http/commands.ts`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Should `agents.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.03716129032258064 - nodes in this community are weakly interconnected._