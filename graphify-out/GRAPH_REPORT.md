# Graph Report - the-office  (2026-11-26)

## Corpus Check
- 1358 files · ~610,574 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 7541 nodes · 32250 edges · 187 communities (180 shown, 7 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 1095 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d60c075a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- incidents/routes.ts
- OrgChart.tsx
- worker-runtime.ts
- features/workflow.ts
- cx
- github-delivery.ts
- budget-ledger.ts
- index.tsx
- MaintenanceRun
- TelemetryPanel.tsx
- features.ts
- overseer/commands.ts
- App.tsx
- admit-improvement.ts
- request.ts
- scheduled-captures.ts
- run-retrospective.ts
- record-trigger.ts
- write-boundary.ts
- dependency-bots/adopt.ts
- artifact
- overseer-launch.mjs
- cec-reads.ts
- jira-time.ts
- publication.ts
- quota-governor.ts
- controller-runtime.ts
- goal-reporting.ts
- advance-metadata-park.ts
- command-registry.ts
- digest
- GitHubDelivery
- .transaction
- run.ts
- identity-runtime.ts
- common.cjs
- scheduled-work.ts
- routing.cjs
- validate-stage.ts
- lesson-selection.ts
- knowledge.ts
- time-scope.ts
- knowledge/routes.ts
- .save
- Offices
- harness-baseline.ts
- credential-spans.ts
- enrollment-gate.ts
- rollback.ts
- index.ts
- FeatureWorkspace.tsx
- json-layers.ts
- investigations/ledger.ts
- state-parts.ts
- jiraBinding
- app-config.ts
- halt-report.ts
- pass.ts
- coordination-pump.ts
- DrawerTopic.tsx
- cost-ledger.ts
- assignments.ts
- maintenance/maintenance.ts
- ref_react
- constellation-runtime.ts
- validate_pr_body.cjs
- audit-plan-candidates.cjs
- office-client.ts
- .emit
- alert-issue.ts
- OfficeScene.tsx
- spawn-command.ts
- session-context-lines.ts
- local-config.ts
- session-scope.ts
- service-health.ts
- OfficeProject
- closeout-recovery.ts
- incidents.ts
- agents.ts
- session-bridge.ts
- Coordinator
- metadata-park-words.ts
- project-bindings-config.ts
- viewer.js
- harnessDelivers
- stopped-record.ts
- sanitize
- superseded-wiki-pr.ts
- ref_node_child_process
- provider-observation.ts
- process.ts
- session-context-file.ts
- plans.cjs
- assignment-poll.ts
- capture-session-clone.py
- change-scope.ts
- deploy-journal.ts
- ticket-stage-runner.ts
- archive-plan.cjs
- call-scope.ts
- jira-attempts.ts
- shared.ts
- on-merge-sync.cjs
- snapshot-stores.ts
- extract-worker.mjs
- ref_zod
- harnessEffect
- judge-resumes.ts
- pr-observation-graphql.ts
- blocker-followups.ts
- time-ledger.ts
- .getEffect
- Goals
- slack-supersession.ts
- run-accounting.ts
- qa.ts
- qa-plan-continuation.ts
- writer-restart.ts
- control-store.ts
- conversations/slack.ts
- accessibility-sources.ts
- daily-cto.ts
- deploy-command.ts
- refresh-issue-state.cjs
- http/commands.ts
- StageResult
- sign-in-unpark.ts
- it-specialist.ts
- GitHubOperations
- pre-push-boundary.ts
- it-report.ts
- coordination.ts
- offices.ts
- weekly-rollup.ts
- bare-value.ts
- checkpoint-retry.ts
- checkpoint-completion.ts
- goal-reviews.ts
- OfficeSnapshot
- holdReason
- connectWith
- scheduler.ts
- production.ts
- reconcile-merges.cjs
- timed-statements.ts
- post-conflict-preparation.ts
- ref_node_crypto
- runner-root.ts
- session-coverage.ts
- serve-graph.cjs
- work.ts
- record-runner-failure.ts
- projects.ts
- DeploymentFence
- recorded-gh-command.ts
- Ticket
- observe-github-merges.ts
- diagnostic-snapshot.ts
- routing.js
- push-destination.ts
- bareSpans
- workKey
- salvage-worktree.ts
- telemetry/report.ts
- proof-comment.ts
- launch.mjs
- reconcileGitHubWrite
- incident-command.ts
- release-floor.ts
- preferences-store.ts
- deploy-plan.ts
- QAResultsCard.tsx
- validate_wiki_pr_body.cjs
- live-reach.ts
- build-overseer-launcher.mjs
- context-failure-transport.ts
- ITFollowUps.tsx
- ProjectProgress
- evidence-digest.ts
- rate-limit-samples.ts
- unblock-brief.ts
- restoreInPlace
- session-snapshot-cleanup.ts
- evidenceText
- handover-cms.ts
- qa-plan-retry.ts

## God Nodes (most connected - your core abstractions)
1. `Store` - 478 edges
2. `TicketJob` - 233 edges
3. `digest()` - 175 edges
4. `command()` - 157 edges
5. `GitHubDelivery` - 143 edges
6. `holdReason()` - 143 edges
7. `OfficeSnapshot` - 123 edges
8. `artifact()` - 116 edges
9. `workKey()` - 110 edges
10. `StageResult` - 110 edges

## Surprising Connections (you probably didn't know these)
- `BreakdownTable()` --indirect_call--> `cell()`  [INFERRED]
  src/telemetry/BreakdownTable.tsx → scripts/wiki/archive-plan.cjs
- `apply()` --indirect_call--> `note()`  [INFERRED]
  src/conversations/OutboxSavedImplementation.tsx → server/cec/parking/resume-parked.ts
- `UnrecordedResult` --references--> `StageResult`  [EXTRACTED]
  server/cec/unrecorded-result.ts → src/shared.ts
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
- 2-file cycle: `src/contracts/people.ts -> src/shared.ts -> src/contracts/people.ts`
- 2-file cycle: `src/contracts/timing.ts -> src/shared.ts -> src/contracts/timing.ts`
- 2-file cycle: `src/contracts/work.ts -> src/shared.ts -> src/contracts/work.ts`
- 2-file cycle: `server/workers/process.ts -> server/workers/spawn-command.ts -> server/workers/process.ts`
- 3-file cycle: `server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts`

## Communities (187 total, 7 thin omitted)

### Community 0 - "incidents/routes.ts"
Cohesion: 0.04
Nodes (107): citationFault(), CitationSchema, SourceVersions, sourceVersions(), inHistoryOf(), CompareMemory, compareMemory(), COMPARES_PER_PASS (+99 more)

### Community 1 - "OrgChart.tsx"
Cohesion: 0.12
Nodes (38): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+30 more)

### Community 2 - "worker-runtime.ts"
Cohesion: 0.07
Nodes (37): candidateWorkspaceEnvironment(), assignmentSubject(), contextPacket(), sanitizeObject(), comparable(), recordRunEvidence(), CODEX_DEFAULT_EFFORT, CODEX_DEFAULT_MODEL (+29 more)

### Community 3 - "features/workflow.ts"
Cohesion: 0.09
Nodes (45): approveFeature(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), artifactPath(), digest(), document() (+37 more)

### Community 4 - "cx"
Cohesion: 0.07
Nodes (104): Conversation(), ConversationDraft, slackMessageStatus(), SlackDeliveryCard(), blockedSummary(), ServiceHealthPanel(), followUp(), labels (+96 more)

### Community 5 - "github-delivery.ts"
Cohesion: 0.04
Nodes (127): writerRestartInstruction(), removeAdoptedClone(), namedRepairIds(), BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction(), dependabotReviewGuidance() (+119 more)

### Community 6 - "budget-ledger.ts"
Cohesion: 0.06
Nodes (58): abandonExpired(), Admission, admit(), admitDeployment(), balance(), bindEvidence(), count(), errcode() (+50 more)

### Community 7 - "index.tsx"
Cohesion: 0.07
Nodes (62): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView() (+54 more)

### Community 8 - "MaintenanceRun"
Cohesion: 0.22
Nodes (14): checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), repeatedVendorReviewBlock(), stoppedInVendorReview(), leftToNextRun(), NEXT_RUN_DUE_MS, night() (+6 more)

### Community 9 - "TelemetryPanel.tsx"
Cohesion: 0.11
Nodes (34): TelemetryReport, LiveAnchor, AzureBuild, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens() (+26 more)

### Community 10 - "features.ts"
Cohesion: 0.10
Nodes (38): commandFeature(), reviewQuestions(), GitHubFeaturePublisher, assertQuestionVisibility(), applyHarnessAction(), HarnessActionInput, recoveryPreconditions(), recoveryTarget() (+30 more)

### Community 11 - "overseer/commands.ts"
Cohesion: 0.08
Nodes (44): reconcile(), guardPresent(), overseerCommand(), reconcileArgs(), runnerStatus(), Condition, count, ForwardingSummary (+36 more)

### Community 12 - "App.tsx"
Cohesion: 0.04
Nodes (84): jiraQueueProgress(), nextStage(), deliveryRoles, JiraQueueProgress, TicketProgress, themeColor, App(), BrainWorkspace (+76 more)

### Community 13 - "admit-improvement.ts"
Cohesion: 0.21
Nodes (16): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+8 more)

### Community 14 - "request.ts"
Cohesion: 0.09
Nodes (55): NOT_LANDED_SETTLE_MS, REBASE, rebaseArgs(), rebaseComment(), belongsTo(), matchesRedo(), prefix(), redoBase() (+47 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.15
Nodes (47): createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), CaptureRequest, captureRequest() (+39 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.09
Nodes (44): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, BlockingTrigger, blockingTrigger(), isBlocking() (+36 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.08
Nodes (43): deliveryMetrics(), median(), baselined(), baselineLearning(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences() (+35 more)

### Community 18 - "write-boundary.ts"
Cohesion: 0.07
Nodes (61): ActiveEntry, GitHubAppConfig, RouteEntry, appCredential(), operatorRollbackCredential(), githubIdentity(), GitHubIdentityRuntime, appSelected() (+53 more)

### Community 19 - "dependency-bots/adopt.ts"
Cohesion: 0.11
Nodes (24): closesIssue(), linkPR(), dependabotPR(), adoptDependencyBot(), adoptOne(), DependencyBot, Guard, headGuard() (+16 more)

### Community 20 - "artifact"
Cohesion: 0.05
Nodes (116): containedFile(), partialLocalCleanupCandidate(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash (+108 more)

### Community 21 - "overseer-launch.mjs"
Cohesion: 0.07
Nodes (80): acquireLauncherLock(), alone(), ancestry(), assertDirectoryOrAbsent(), attemptRecord(), bounded(), boundedString(), checkOwnedFile() (+72 more)

### Community 22 - "cec-reads.ts"
Cohesion: 0.09
Nodes (35): intakeMembership(), parksInJira(), cecReadbackPrompt(), cecTransitionPrompt(), plainResume(), readbackDispatchGuidance(), currentEnvironmentWait(), environmentWait() (+27 more)

### Community 23 - "jira-time.ts"
Cohesion: 0.12
Nodes (32): unresolvedAttempts(), bindingOf(), finishVerifiedEffects(), locks, matches(), publishJiraTime(), readBack(), readBackEntry() (+24 more)

### Community 24 - "publication.ts"
Cohesion: 0.09
Nodes (18): featureById(), Link, linkFeature(), FeaturePublisher, PublicationReceipt, publishFeature(), reconcilePublication(), uncertainPublications() (+10 more)

### Community 25 - "quota-governor.ts"
Cohesion: 0.25
Nodes (8): CORE_RESERVE, PROBE_INTERVAL_MS, QuotaGovernor, quotaLow(), QuotaRefusal, Resource, ResourceReading, quotaDeferred()

### Community 26 - "controller-runtime.ts"
Cohesion: 0.13
Nodes (16): [cmd,...rawArgs], projectData(), StoreDatabase, ControllerEffects, controllerEffects(), DEPLOY_PROJECT, alive(), ControllerMachine (+8 more)

### Community 27 - "goal-reporting.ts"
Cohesion: 0.18
Nodes (19): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+11 more)

### Community 28 - "advance-metadata-park.ts"
Cohesion: 0.08
Nodes (71): advanceMetadataPark(), Parked, releaseWords(), sentAnything(), CardResumeRoute, cardResumeRoute(), effectiveParkPickup(), PICKUP_ASSIGNEE (+63 more)

### Community 29 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 30 - "digest"
Cohesion: 0.06
Nodes (87): activeEffectId(), retryRead(), runHarnessStage(), harnessStageResult(), receipt(), createdContentSha256(), Binding, historyBeforeWrite() (+79 more)

### Community 31 - "GitHubDelivery"
Cohesion: 0.06
Nodes (47): writerRestartPending(), pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), GitHubDelivery, assertStoppedBaseAudit(), AuditRow, AWS_KEY_ID, CoverageRow (+39 more)

### Community 32 - ".transaction"
Cohesion: 0.07
Nodes (50): featureItemComplete(), reconcileFeatureCompletion(), discoveryPrompt(), planPrompt(), readEvidence(), helperTelemetry(), DELAYS, MAX_EXECUTIONS (+42 more)

### Community 33 - "run.ts"
Cohesion: 0.14
Nodes (21): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_FIX_PROMPT, OfficeFixResult (+13 more)

### Community 34 - "identity-runtime.ts"
Cohesion: 0.09
Nodes (25): KeychainKeySource, appJwt(), base64url(), signingKey(), AppKeySource, Execute, keychainKeySource(), AppReadiness (+17 more)

### Community 35 - "common.cjs"
Cohesion: 0.14
Nodes (28): connections(), fs, main(), path, crypto, { execFileSync }, fs, path (+20 more)

### Community 36 - "scheduled-work.ts"
Cohesion: 0.05
Nodes (64): freshOwnershipRead(), capabilityBlockedReviews(), latestReviews(), ctoInputIdentityMatches(), ctoInputRecovered(), metadataParkAction(), ADOPTION_STALLED_MS, conversationResolved() (+56 more)

### Community 37 - "routing.cjs"
Cohesion: 0.15
Nodes (24): adjacency(), edgeCost(), edgeKey(), edgeType(), EVIDENCE_TYPE_PRIORITY, formatBytes(), formatGithubRef(), formatRoute() (+16 more)

### Community 38 - "validate-stage.ts"
Cohesion: 0.17
Nodes (16): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+8 more)

### Community 39 - "lesson-selection.ts"
Cohesion: 0.09
Nodes (32): INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), LessonSelection, MAINTENANCE, MAX_LESSONS (+24 more)

### Community 40 - "knowledge.ts"
Cohesion: 0.06
Nodes (38): curateLesson(), Curation, CurationAction, mergeEvidence(), LessonBrainAudit, LessonBrainOverlap, BRAIN_SCOPE, SUBJECT (+30 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.18
Nodes (22): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), midnight(), TicketDay (+14 more)

### Community 42 - "knowledge/routes.ts"
Cohesion: 0.09
Nodes (27): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, CommittedBrain (+19 more)

### Community 43 - ".save"
Cohesion: 0.10
Nodes (55): enumerateIntakeList(), inPickupOrder(), Intake, text(), resolveBlockedTransition(), document(), transitionWithComment(), jiraAccount() (+47 more)

### Community 44 - "Offices"
Cohesion: 0.13
Nodes (5): QuestionNotifications, GitHubCalls, projectById(), Offices, SessionBridge

### Community 45 - "harness-baseline.ts"
Cohesion: 0.15
Nodes (22): BaselineReport, baselineReport(), BaselineSource, baselineText(), millions(), row(), share(), add() (+14 more)

### Community 46 - "credential-spans.ts"
Cohesion: 0.06
Nodes (39): AFTER_LABEL, BARE_CREDENTIAL, BARE_LABEL, BARE_UNIT, BARE_VALUE, CAMEL_START, CONTROL_ESCAPE, CREDENTIAL_NAME (+31 more)

### Community 47 - "enrollment-gate.ts"
Cohesion: 0.20
Nodes (22): admit(), IntakeContext, WAIT_STATUSES, DependencyStores, approvedDelivery(), bindDelivery(), featureEffectGate(), assertFeatureGate() (+14 more)

### Community 48 - "rollback.ts"
Cohesion: 0.11
Nodes (30): Body, DeploymentFenceState, fenceTokenDigest(), DeployContext, DeployTimings, readDeployToken(), removeDeployToken(), endDeployment() (+22 more)

### Community 49 - "index.ts"
Cohesion: 0.05
Nodes (57): implementationContinuationRoute(), qaPlanRetryRoute(), servedOutbox(), isNotice(), readNotices(), resumeSwitch(), close(), config (+49 more)

### Community 50 - "FeatureWorkspace.tsx"
Cohesion: 0.11
Nodes (28): FeatureQuestionProjection, OutboxQuestionRound(), send(), FeatureDelivery(), FeatureDocuments(), views, FeatureReading(), FeatureWorkspace() (+20 more)

### Community 51 - "json-layers.ts"
Cohesion: 0.26
Nodes (9): decode(), decodedIndex(), evenRunBefore(), JsonLayers, LayerString, opensValue(), SIMPLE, strings() (+1 more)

### Community 52 - "investigations/ledger.ts"
Cohesion: 0.14
Nodes (23): failureOutranks(), acceptedCompletionResolution(), investigationCandidates(), investigationId(), ctoReplacementResolution(), finishedSubjectResolution(), investigationFollowUps(), investigationHeld() (+15 more)

### Community 53 - "state-parts.ts"
Cohesion: 0.10
Nodes (19): readSavedState(), LARGE_KEY_CHARS, plain(), RedactedEntries, RedactedEntry, redactEntries(), joinParts(), PartRow (+11 more)

### Community 54 - "jiraBinding"
Cohesion: 0.20
Nodes (6): contentSchema(), JiraIssuePublisher, descriptionPreimage(), plain(), publicationDescription(), jiraBinding()

### Community 55 - "app-config.ts"
Cohesion: 0.13
Nodes (23): effectId(), entry(), fail(), KnownProject, only(), parseGitHubApp(), positive(), QualifyEntry (+15 more)

### Community 56 - "halt-report.ts"
Cohesion: 0.08
Nodes (26): FailureReceipt, haltCondition(), forwardFailures(), forwardIntent(), ForwardSummary, Standing, EMPTY_HALT, ForwardCursor (+18 more)

### Community 57 - "pass.ts"
Cohesion: 0.07
Nodes (52): LINE_LIMIT, RunnerLimits, RunnerPaths, appendFailureLine(), JournalRefused, JournalView, readFailures(), syncPath() (+44 more)

### Community 58 - "coordination-pump.ts"
Cohesion: 0.14
Nodes (17): ATTEMPT_DELAYS_MS, maintenancePolicies(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, brainResultStop(), GateMark, gateMark() (+9 more)

### Community 59 - "DrawerTopic.tsx"
Cohesion: 0.17
Nodes (20): createConversationDrafts(), SendMessage, BrainDrawer(), DrawerNavigation, DrawerPage(), InspectorProps, DrawerEntry, DrawerPath (+12 more)

### Community 60 - "cost-ledger.ts"
Cohesion: 0.13
Nodes (32): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress(), effectId() (+24 more)

### Community 61 - "assignments.ts"
Cohesion: 0.11
Nodes (22): clip(), DEMAND_LIMIT, demandFacts(), key(), LessonKey, notes(), AssignmentLookups, assignmentLookups (+14 more)

### Community 62 - "maintenance/maintenance.ts"
Cohesion: 0.12
Nodes (21): ApproachSchema, sourceFindings, sourceReview(), SETTLED, skipOwnedCandidate(), Skipped, skippedCandidateLedger(), CmsFollowUpContext (+13 more)

### Community 63 - "ref_react"
Cohesion: 0.09
Nodes (37): KnowledgeActivity, KnowledgeActivityPage, ChatMarkdown(), ChatMarkdown, MessageText(), Activity(), AssignmentKnowledge(), Lookup() (+29 more)

### Community 64 - "constellation-runtime.ts"
Cohesion: 0.05
Nodes (58): KnowledgeEdge, KnowledgeMap, KnowledgeNode, ATMOSPHERE, mapAtmosphere(), Particle, system(), unit() (+50 more)

### Community 65 - "validate_pr_body.cjs"
Cohesion: 0.36
Nodes (8): fs, main(), readableText(), REQUIRED_CHECKS, REQUIRED_SECTIONS, sections(), validatePullRequestBody(), withoutComments()

### Community 66 - "audit-plan-candidates.cjs"
Cohesion: 0.14
Nodes (31): audit(), branchIssueNumbers(), classify(), distinctiveTitleWords(), { execFileSync }, extractPaths(), findPrForMergeSubject(), fmtCommit() (+23 more)

### Community 67 - "office-client.ts"
Cohesion: 0.10
Nodes (26): FailureAnswer, HaltAnswer, RUNNER_DEFAULTS, officeDataRoot, realMachine(), bodyWithin(), bounded(), Envelope (+18 more)

### Community 68 - ".emit"
Cohesion: 0.11
Nodes (61): settle(), canonical(), CheckpointEligibility, checkpointEligibility(), admitAssignmentResume(), forAssignment(), admitCheckpointResume(), forCheckpoint() (+53 more)

### Community 69 - "alert-issue.ts"
Cohesion: 0.18
Nodes (21): AlertIssue, alertIssueBody(), alertIssueTitle(), alertMarker(), closeAlertIssue(), ensureAlertIssue(), findAlertIssue(), Guard (+13 more)

### Community 70 - "OfficeScene.tsx"
Cohesion: 0.08
Nodes (60): displayAgentTask(), withoutElapsed(), CameraBookmark, restoreBookmark(), LiveAgentTask(), Props, RunningTask(), text() (+52 more)

### Community 71 - "spawn-command.ts"
Cohesion: 0.15
Nodes (20): childEnvironment(), exitFailure(), inactivityWatch(), At, Errno, errno(), GroupInventory, GroupProbe (+12 more)

### Community 72 - "session-context-lines.ts"
Cohesion: 0.25
Nodes (11): Bound, ContextFoldPrefix, contextFoldPrefix(), SessionContextCheckpoint, captureSessionContextClone(), sessionContextFile(), ContextReadChanged, sameContextFile() (+3 more)

### Community 73 - "local-config.ts"
Cohesion: 0.10
Nodes (38): escaped(), IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), projectListScope(), cecIntakePrompt(), AUTO_ADOPT_BOTS (+30 more)

### Community 74 - "session-scope.ts"
Cohesion: 0.20
Nodes (16): claudeScopeParser(), claudeSessionScope(), CLAUDE_TRANSCRIPTS, CODEX_ROLLOUTS, contextReaders(), retainSessionMessage(), SessionConversation, escaped() (+8 more)

### Community 75 - "service-health.ts"
Cohesion: 0.10
Nodes (25): ClaudeLoginRefusal, claudeLoginRefusal(), claudeRefusalWords(), RECORDED_REFUSALS, refusedClaudeRow(), listenerHealth(), providers, ProviderStatusChecks (+17 more)

### Community 76 - "OfficeProject"
Cohesion: 0.11
Nodes (32): az(), buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs(), fullActivePRs(), observation() (+24 more)

### Community 77 - "closeout-recovery.ts"
Cohesion: 0.11
Nodes (40): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+32 more)

### Community 78 - "incidents.ts"
Cohesion: 0.08
Nodes (53): attributedRecords(), foldsItsRun(), groupCandidates(), ObservedIncident, ObservedSubject, digest(), fingerprint(), incidentId() (+45 more)

### Community 79 - "agents.ts"
Cohesion: 0.08
Nodes (37): implementationWorkerContext(), RefusedQAResult, savedStageCompletion(), assertContinuableWorktree(), CONTINUABLE, continuationPrompt(), MAX_CONTINUATIONS, recordedContinuation() (+29 more)

### Community 80 - "session-bridge.ts"
Cohesion: 0.13
Nodes (22): codexDaemonProcesses(), accountCodexProcesses(), CodexProcessInventory, codexProcessInventory(), DesktopSessions, unaccountedProcesses(), codexThreadMetadata(), METADATA_CHUNK (+14 more)

### Community 81 - "Coordinator"
Cohesion: 0.08
Nodes (3): coordination(), Coordinator, PickupPolicy

### Community 82 - "metadata-park-words.ts"
Cohesion: 0.18
Nodes (17): devUpdate(), HEADLINE, OUTCOME, qaComment(), remote(), STAGE, plainWords(), tidy() (+9 more)

### Community 83 - "project-bindings-config.ts"
Cohesion: 0.15
Nodes (22): awaitingJiraStatus(), awaitingProduction(), FOLLOW_DAYS, followed(), isFollowed(), Azure, AzureRead, containedIn() (+14 more)

### Community 84 - "viewer.js"
Cohesion: 0.19
Nodes (25): addMetaLink(), addMetaRow(), addRelationship(), applyView(), buildIndexes(), buildLegend(), buildModel(), buildRenderer() (+17 more)

### Community 85 - "harnessDelivers"
Cohesion: 0.07
Nodes (47): nextAttemptAt(), restartStoppedWriters(), unchangedSinceAccepted(), NOT_RETRYABLE, releaseFunds(), StoppedWriter, stoppedWriter(), WRITER_STAGES (+39 more)

### Community 86 - "stopped-record.ts"
Cohesion: 0.07
Nodes (59): boundedEvidence(), expectedWait(), StopFacts, FailedMailCheck, lastFailedMailCheck(), lastMailCheckOutcome(), MailCheckOutcome, normalizeCause() (+51 more)

### Community 87 - "sanitize"
Cohesion: 0.06
Nodes (48): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+40 more)

### Community 88 - "superseded-wiki-pr.ts"
Cohesion: 0.12
Nodes (49): abandon(), assertOpenSnapshot(), awaitingContainment(), closeIssue(), CloseRevalidationError, closeSuperseded(), comment(), CommentStep (+41 more)

### Community 89 - "ref_node_child_process"
Cohesion: 0.09
Nodes (24): changedPaths(), { execFileSync }, files, isMapInput(), mapOnly(), { execFileSync }, git(), publish() (+16 more)

### Community 90 - "provider-observation.ts"
Cohesion: 0.13
Nodes (25): correlatedBuild(), Azure, azurePipelines(), outcome(), Read, RUNS_PER_PIPELINE, Api, githubWorkflows() (+17 more)

### Community 91 - "process.ts"
Cohesion: 0.06
Nodes (64): CommentPage, commentReadback(), Assignment, jiraText(), Transition, jiraRecord(), unpack(), statusHeld() (+56 more)

### Community 92 - "session-context-file.ts"
Cohesion: 0.12
Nodes (19): claudeSessionContext(), readTranscript, codexSessionContext(), readRollout, packContextFailure(), PackedContextFailure, ContextThread, contextThread() (+11 more)

### Community 93 - "plans.cjs"
Cohesion: 0.16
Nodes (22): fs, main(), parse(), path, walk(), association(), auditedDigests(), candidate() (+14 more)

### Community 94 - "assignment-poll.ts"
Cohesion: 0.07
Nodes (51): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), currentOutbox(), retryCandidateCleanup(), admitReadyCards(), confirmedGone(), goneQuery() (+43 more)

### Community 96 - "change-scope.ts"
Cohesion: 0.14
Nodes (26): applyChangeScope(), levels(), MAX_CHECKS, owedUnderScope(), scopeBase(), settled(), statedApproach(), verifiedCandidate() (+18 more)

### Community 97 - "deploy-journal.ts"
Cohesion: 0.18
Nodes (17): append(), assertNext(), DeployJournalView, DeployStepState, Entry, Header, Id, readDeployJournal() (+9 more)

### Community 98 - "ticket-stage-runner.ts"
Cohesion: 0.08
Nodes (49): candidateBranchMoved(), endChangeScope(), scopeOutgrown(), confirmsMovedHead(), Moved, movedHeadUnconfirmed(), recordConfirmedHead(), routeConfirmedHead() (+41 more)

### Community 99 - "archive-plan.cjs"
Cohesion: 0.11
Nodes (35): fs, main(), parse(), path, archive(), cell(), ensureIndex(), fromArgs() (+27 more)

### Community 100 - "call-scope.ts"
Cohesion: 0.08
Nodes (45): boardReadFailure(), add(), addSource(), busiest(), CallLedger, Entry, sourceRows(), Sources (+37 more)

### Community 101 - "jira-attempts.ts"
Cohesion: 0.12
Nodes (23): attempted(), attemptState(), bound(), covers(), JiraAttempt, jiraAttempts(), JiraAttemptState, open() (+15 more)

### Community 102 - "shared.ts"
Cohesion: 0.03
Nodes (150): GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles(), ContinuationIO (+142 more)

### Community 103 - "on-merge-sync.cjs"
Cohesion: 0.13
Nodes (35): fs, main(), path, { spawnSync }, fieldSpan(), frontmatterProblems(), keyPattern(), list() (+27 more)

### Community 104 - "snapshot-stores.ts"
Cohesion: 0.13
Nodes (30): absentAdmission(), AdmissionComparison, AdmissionSnapshot, compareAdmissions(), snapshotAdmissions(), storeMissing(), APPENDED_TABLE, comparableOrder() (+22 more)

### Community 105 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 106 - "ref_zod"
Cohesion: 0.15
Nodes (19): ActiveRelease, BackupEntry, BackupInput, BackupInventory, backupStores(), INVENTORY_FILE, schemaOf(), abandon() (+11 more)

### Community 107 - "harnessEffect"
Cohesion: 0.09
Nodes (57): BLOCK, harnessBlockMove(), harnessParkedCard(), noted(), effectKey(), LaneOperation, laneWrite(), moveCardOnce() (+49 more)

### Community 108 - "judge-resumes.ts"
Cohesion: 0.06
Nodes (45): Admission, boundaryCrossed(), Crossing, Progress, CheckpointProgress, checkpointProgress(), names(), nativeProof() (+37 more)

### Community 109 - "pr-observation-graphql.ts"
Cohesion: 0.08
Nodes (52): withGitHubOperation(), responseBody(), githubPRDescription(), ChildRequest, headCheckRuns(), closingDirectives(), includeBody(), ObservedPR (+44 more)

### Community 110 - "blocker-followups.ts"
Cohesion: 0.09
Nodes (57): conversationReadbackReady(), followupOf(), pendingReadback(), queueConversationReadback(), readbackEnding(), uncertainConversations(), readBackConversations(), NO_RECORD (+49 more)

### Community 111 - "time-ledger.ts"
Cohesion: 0.17
Nodes (17): publishableEntry(), settlementPending(), superseded(), ticketUnresolved(), syncing, TimeLedger, dueReadback(), missedSinceVerified() (+9 more)

### Community 112 - ".getEffect"
Cohesion: 0.09
Nodes (25): MergeNotifications, settleNotLanded(), interruptAdoptions(), Write, legacy(), REMOVED_FIELDS, retireLegacyRecovery(), goalNoticeAuthorized() (+17 more)

### Community 113 - "Goals"
Cohesion: 0.16
Nodes (15): CTOReview(), goalState, DailyCTO(), GoalHistory(), load(), reportDate(), reviewStatus, blank() (+7 more)

### Community 114 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 115 - "run-accounting.ts"
Cohesion: 0.05
Nodes (69): NOTIFY_HELPER, notifyHelperResolution(), BoundedRead, done(), readBoundedNoFollow(), readOwnedSessionArtifact(), reasonOf(), EvidenceOutcome (+61 more)

### Community 119 - "control-store.ts"
Cohesion: 0.14
Nodes (8): Clock, applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, statementCache(), initialSnapshot(), initializeStoreSchema()

### Community 120 - "conversations/slack.ts"
Cohesion: 0.10
Nodes (14): comparableSlackText(), labelIsUrl(), SlackMessages, SlackRequestSchema, SlackResultSchema, SlackVerificationSchema, canFileGithubIssue(), githubFollowupPrompt() (+6 more)

### Community 121 - "accessibility-sources.ts"
Cohesion: 0.25
Nodes (17): accessibilitySources(), actionable(), closingPull(), Finding, handoffIssue(), issueLines(), issueSource(), observation (+9 more)

### Community 122 - "daily-cto.ts"
Cohesion: 0.13
Nodes (14): DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), reviewWeekday(), DailyResultSchema, FreshDailyResultSchema, Briefing (+6 more)

### Community 123 - "deploy-command.ts"
Cohesion: 0.10
Nodes (41): pinnedController(), readControllerPin(), writeControllerPin(), controllerOf(), deployCommand(), report(), status(), deploy() (+33 more)

### Community 124 - "refresh-issue-state.cjs"
Cohesion: 0.22
Nodes (13): atomicWrite(), advanceFence(), key(), { execFileSync }, fs, issueRefs(), main(), markClosed() (+5 more)

### Community 125 - "http/commands.ts"
Cohesion: 0.08
Nodes (39): requestQAPlanRetry(), channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), clamp(), LIMITS (+31 more)

### Community 126 - "StageResult"
Cohesion: 0.06
Nodes (60): applyIntakeObservation(), findingsBlock(), metadataCarriedAdvisoryIds(), ownedBefore(), QA_STAGES, reviewAdvisoryIds(), Reviewed, withoutReviewAdvisories() (+52 more)

### Community 127 - "sign-in-unpark.ts"
Cohesion: 0.19
Nodes (17): hasPendingDelivery(), resumeAfterSignIn(), signInWait(), MAX_SIGN_IN_UNPARKS, BrowserPage, browserPages(), ReadPages, SignInState (+9 more)

### Community 128 - "it-specialist.ts"
Cohesion: 0.12
Nodes (27): replacedReadback(), OwnerStepItem, ownerStepItems(), signIn(), partialLocalCleanupKey(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved() (+19 more)

### Community 129 - "GitHubOperations"
Cohesion: 0.26
Nodes (6): GitHubOperations, writerRefused(), writerSuccessor(), Assessment, closeNativeRefresh(), fingerprint()

### Community 130 - "pre-push-boundary.ts"
Cohesion: 0.27
Nodes (10): Event, exactCommand(), Invocation, localHookCommand(), one(), prePushRejection(), PushIdentity, retirementBoundary() (+2 more)

### Community 131 - "it-report.ts"
Cohesion: 0.27
Nodes (10): followUpPicture(), publishITReport(), archiveOldReports(), RETAINED_REPORTS, archiveByMonth(), archiveHistory(), archiveMonth(), archiveOldTaskDetail() (+2 more)

### Community 132 - "coordination.ts"
Cohesion: 0.24
Nodes (12): checkpointWindow(), dueAt(), localDay(), ReviewResult, deferNonReady(), preparePR(), recheck(), recheckCandidate() (+4 more)

### Community 133 - "offices.ts"
Cohesion: 0.28
Nodes (6): leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), InFlightOperations, officeCapacity()

### Community 134 - "weekly-rollup.ts"
Cohesion: 0.14
Nodes (26): learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), RollupResult (+18 more)

### Community 135 - "bare-value.ts"
Cohesion: 0.30
Nodes (11): BareValue, bareValue(), deeperValueEnd(), ENDS, isSeparator(), plainEscape(), queryValue(), separatorEscapeAt() (+3 more)

### Community 136 - "checkpoint-retry.ts"
Cohesion: 0.31
Nodes (8): completeNativeCheckpoint(), BrainStatusSchema, identity, queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation()

### Community 137 - "checkpoint-completion.ts"
Cohesion: 0.27
Nodes (8): brainCheckpointCompletion(), coverageSchema, verified, publishedWorkCleanedUp(), nativeChecks, outcomeKnown(), reconcileCompletedCheckpoints(), settledRun()

### Community 138 - "goal-reviews.ts"
Cohesion: 0.14
Nodes (19): currentCitations(), Fact, NOT_CURRENT, PROVIDER_ERROR, applyGoalReview(), DeliveryJob, EvidenceRefSchema, jobAccepted() (+11 more)

### Community 139 - "OfficeSnapshot"
Cohesion: 0.07
Nodes (44): knowledgeOutbox(), LessonDecisionAction, lessonDecisionState(), readLessonDecision(), DAYS, dueLessonDecisions(), easternWeek(), isLessonDecision() (+36 more)

### Community 140 - "holdReason"
Cohesion: 0.06
Nodes (63): deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, requireDeliveryAuthority(), deliveryIntakeBlocker(), gateRegisteredDelivery(), accounting (+55 more)

### Community 141 - "connectWith"
Cohesion: 0.38
Nodes (5): connectWith(), data(), envelope(), JiraWorklogs, WorklogSave

### Community 142 - "scheduler.ts"
Cohesion: 0.15
Nodes (15): systemClock, PROJECT_LOCAL, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch() (+7 more)

### Community 144 - "reconcile-merges.cjs"
Cohesion: 0.22
Nodes (14): collectPulls(), copyWikiForDryRun(), { execFileSync }, flattenPages(), fs, githubRequest(), isWikiBotPull(), main() (+6 more)

### Community 145 - "timed-statements.ts"
Cohesion: 0.32
Nodes (11): NAMED, rowsText(), rowText(), SQL_TOKEN, statementName(), text(), timed(), timedRun() (+3 more)

### Community 146 - "post-conflict-preparation.ts"
Cohesion: 0.09
Nodes (46): assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), reconcileCompletedConflictDraft(), routeReadyPostConflictPublication(), verifyInitialDraftConflictPreparation() (+38 more)

### Community 147 - "ref_node_crypto"
Cohesion: 0.07
Nodes (21): AzureMonitor, checkMail(), drainMail(), requestMail(), dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery() (+13 more)

### Community 148 - "runner-root.ts"
Cohesion: 0.08
Nodes (50): resolveCliRoot(), DEFAULT_OFFICE_URL, LOOPBACK, officeUrl(), privateDirectories(), runnerPaths(), PIN_ENTRY, pinCommand() (+42 more)

### Community 149 - "session-coverage.ts"
Cohesion: 0.36
Nodes (7): claudeSessions(), completeSessionCoverage(), desktopCoverageGap(), knownActivity(), Report, unexplained(), sessionInventoryFailureDetail()

### Community 150 - "serve-graph.cjs"
Cohesion: 0.24
Nodes (9): createServer(), fs, http, listen(), attempt(), main(), path, resolveRequest() (+1 more)

### Community 151 - "work.ts"
Cohesion: 0.06
Nodes (51): reconcileNoticeConfirmations(), compatible(), dependencyCompletionKey(), dependencyEligibility(), issueKey(), observePrerequisites(), PrerequisiteSchema, PrerequisitesSchema (+43 more)

### Community 152 - "record-runner-failure.ts"
Cohesion: 0.06
Nodes (49): incidentNotices(), NOTICE_KINDS, STATUS, classify(), isRestoration(), KEY, newer(), record() (+41 more)

### Community 153 - "projects.ts"
Cohesion: 0.11
Nodes (25): CEC, LOCAL_BINDINGS, OfficeConfigInputs, officeConfigRoute(), officeConfigSummary(), projectSettingsSummary(), CECBinding, ProjectInput (+17 more)

### Community 154 - "DeploymentFence"
Cohesion: 0.33
Nodes (4): assertToken(), DeploymentFence, DeploymentFenceGateContext, DeploymentFenceRouteContext

### Community 155 - "recorded-gh-command.ts"
Cohesion: 0.19
Nodes (20): assignments(), changeDirectory(), closing(), CREATE, createGuard(), flags(), named(), read() (+12 more)

### Community 156 - "Ticket"
Cohesion: 0.06
Nodes (42): carriedNotRepeated(), changeScopeNote(), Scoped, JiraOperations, movedHeadNote(), cecPrompt(), cecReconcilePrompt(), resolvedDecisionNote() (+34 more)

### Community 157 - "observe-github-merges.ts"
Cohesion: 0.30
Nodes (14): clearCooldown(), coolDown(), coolingDown(), MERGE_NOTICE_RECHECK_MS, waitKey(), waits, isMergeCommit(), issueOf() (+6 more)

### Community 158 - "diagnostic-snapshot.ts"
Cohesion: 0.29
Nodes (10): itChatPrompt(), assignmentDiagnostics(), diagnosticContext(), diagnosticSnapshot(), nativeDeliveryResolved(), itAgent(), itDiagnostics(), followUpStatus() (+2 more)

### Community 160 - "push-destination.ts"
Cohesion: 0.50
Nodes (7): digest(), Execute, file(), PUSH_HOOKS, pushHookChain(), inspect(), unresolved()

### Community 161 - "bareSpans"
Cohesion: 0.19
Nodes (15): apostropheEnd(), bareSpans(), credentialSpans(), genuineGap(), headerValueEnd(), isQueryLabel(), labelBefore(), nameEnd() (+7 more)

### Community 162 - "workKey"
Cohesion: 0.08
Nodes (46): recordCandidateCleanup(), interruptedRemoval(), maintenanceCandidate(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot() (+38 more)

### Community 163 - "salvage-worktree.ts"
Cohesion: 0.48
Nodes (6): Execute, keptWork(), Read, refObject(), SalvageRetry, salvageWorktree()

### Community 164 - "telemetry/report.ts"
Cohesion: 0.21
Nodes (16): TelemetryRow, TelemetrySync, TimeLedgerState, Acc, bump(), EASTERN, easternDay(), modelShares() (+8 more)

### Community 165 - "proof-comment.ts"
Cohesion: 0.38
Nodes (12): commentId(), CommentIntent, CommentReceipt, conversation(), exact(), findProofComment(), matchesProofComment(), postProofComment() (+4 more)

### Community 166 - "launch.mjs"
Cohesion: 0.07
Nodes (93): RFC-9562, CHECKOUT, DEFAULT_DEADLINE_MS, existingPlist(), installOverseer(), LABEL, LAUNCHER_SOURCE, renderPlist() (+85 more)

### Community 167 - "reconcileGitHubWrite"
Cohesion: 0.28
Nodes (13): reconcileGitHubWrite(), assignedToJoe(), fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), firstLane(), instruction(), LaneMove (+5 more)

### Community 168 - "incident-command.ts"
Cohesion: 0.38
Nodes (6): FLAGS, incidentCommand(), IncidentCommandIO, option(), USAGE, whole()

### Community 169 - "release-floor.ts"
Cohesion: 0.33
Nodes (6): AS_COMMITTED, Execute, FloorReading, message(), readReleaseFloor(), RELEASE_FLOOR

### Community 170 - "preferences-store.ts"
Cohesion: 0.23
Nodes (7): PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, OFFICE_PREFERENCE_DEFAULTS, OfficePreferences

### Community 171 - "deploy-plan.ts"
Cohesion: 0.10
Nodes (42): runningRevision(), runningRevision(), runtimeRevision(), BUILD_ENV, buildRelease(), BuildReleaseOptions, Execute, pinnedVersions() (+34 more)

### Community 172 - "QAResultsCard.tsx"
Cohesion: 0.42
Nodes (6): qaResultChanges(), QA_STAGES, qaResults(), qaStatus(), artifact(), Report()

### Community 173 - "validate_wiki_pr_body.cjs"
Cohesion: 0.33
Nodes (5): { execFileSync }, hasCanonicalWikiBody(), maintenanceBodies, matchesMaintenanceBody(), { readFileSync }

### Community 174 - "live-reach.ts"
Cohesion: 0.47
Nodes (5): GIT_NETWORK, LIVE_PROVIDERS, liveReach(), networkUrl(), remoteUrls()

### Community 175 - "build-overseer-launcher.mjs"
Cohesion: 0.22
Nodes (8): BANNER, builtin(), bundleLauncher(), LAUNCHER_BUNDLE, LAUNCHER_ENTRY, launcherChunk(), REPOSITORY, SCRIPT

### Community 176 - "context-failure-transport.ts"
Cohesion: 0.48
Nodes (3): unpackContextFailure(), ContextReadPhase, SessionContextDeadline

### Community 177 - "ITFollowUps.tsx"
Cohesion: 0.57
Nodes (5): itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps(), ITState

### Community 179 - "evidence-digest.ts"
Cohesion: 0.44
Nodes (7): canonical(), evidenceDigest(), evidenceHash(), semantic(), stableUrl(), requirementDrift(), RequirementPostimage

### Community 180 - "rate-limit-samples.ts"
Cohesion: 0.09
Nodes (20): AppPrincipals, AMBIENT_TOKENS, ChildCredential, CREDENTIAL_TRACING, GIT_HELPER, PROMPTS, WriteCredential, SelectedWriter (+12 more)

### Community 181 - "unblock-brief.ts"
Cohesion: 0.53
Nodes (5): clearUnblockBrief(), key(), saveUnblockBrief(), UnblockBrief, unblockBrief()

### Community 182 - "restoreInPlace"
Cohesion: 0.60
Nodes (5): identity(), Json, plain(), restorable(), restoreInPlace()

### Community 183 - "session-snapshot-cleanup.ts"
Cohesion: 0.40
Nodes (5): SNAPSHOT_PREFIX, removeStaleSessionSnapshots(), SNAPSHOT_SWEEP_MS, STALE_SNAPSHOT_MS, sweepStaleSessionSnapshots()

### Community 184 - "evidenceText"
Cohesion: 0.80
Nodes (4): evidenceText(), field(), jsonString(), opening()

### Community 185 - "handover-cms.ts"
Cohesion: 0.40
Nodes (3): file, project, root

### Community 186 - "qa-plan-retry.ts"
Cohesion: 0.67
Nodes (3): QAPlanRetry, QAPlanRetryProof, QAPlanRetryRequest

## Knowledge Gaps
- **1 isolated node(s):** `RFC-9562`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 1258 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `shared.ts` to `incidents/routes.ts`, `worker-runtime.ts`, `features/workflow.ts`, `github-delivery.ts`, `features.ts`, `admit-improvement.ts`, `request.ts`, `scheduled-captures.ts`, `run-retrospective.ts`, `record-trigger.ts`, `write-boundary.ts`, `dependency-bots/adopt.ts`, `artifact`, `cec-reads.ts`, `jira-time.ts`, `publication.ts`, `controller-runtime.ts`, `goal-reporting.ts`, `advance-metadata-park.ts`, `digest`, `GitHubDelivery`, `.transaction`, `run.ts`, `identity-runtime.ts`, `scheduled-work.ts`, `validate-stage.ts`, `lesson-selection.ts`, `time-scope.ts`, `knowledge/routes.ts`, `.save`, `Offices`, `enrollment-gate.ts`, `index.ts`, `investigations/ledger.ts`, `state-parts.ts`, `jiraBinding`, `coordination-pump.ts`, `cost-ledger.ts`, `assignments.ts`, `maintenance/maintenance.ts`, `.emit`, `alert-issue.ts`, `OfficeScene.tsx`, `OfficeProject`, `closeout-recovery.ts`, `agents.ts`, `session-bridge.ts`, `Coordinator`, `project-bindings-config.ts`, `harnessDelivers`, `stopped-record.ts`, `sanitize`, `superseded-wiki-pr.ts`, `provider-observation.ts`, `process.ts`, `assignment-poll.ts`, `ticket-stage-runner.ts`, `jira-attempts.ts`, `harnessEffect`, `judge-resumes.ts`, `pr-observation-graphql.ts`, `blocker-followups.ts`, `time-ledger.ts`, `.getEffect`, `run-accounting.ts`, `control-store.ts`, `conversations/slack.ts`, `accessibility-sources.ts`, `http/commands.ts`, `StageResult`, `sign-in-unpark.ts`, `it-specialist.ts`, `GitHubOperations`, `coordination.ts`, `offices.ts`, `weekly-rollup.ts`, `checkpoint-retry.ts`, `checkpoint-completion.ts`, `goal-reviews.ts`, `OfficeSnapshot`, `holdReason`, `scheduler.ts`, `post-conflict-preparation.ts`, `ref_node_crypto`, `work.ts`, `projects.ts`, `Ticket`, `observe-github-merges.ts`, `diagnostic-snapshot.ts`, `workKey`, `proof-comment.ts`, `reconcileGitHubWrite`, `ProjectProgress`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **What connects `RFC-9562` to the rest of the system?**
  _1 weakly-connected nodes found - possible missing edges._
- **Should `incidents/routes.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.040855059434621914 - nodes in this community are weakly interconnected._
- **Why does `command()` connect `process.ts` to `incidents/routes.ts`, `GitHubOperations`, `worker-runtime.ts`, `features/workflow.ts`, `coordination.ts`, `github-delivery.ts`, `weekly-rollup.ts`, `checkpoint-completion.ts`, `features.ts`, `holdReason`, `admit-improvement.ts`, `connectWith`, `ref_node_crypto`, `artifact`, `work.ts`, `publication.ts`, `record-runner-failure.ts`, `controller-runtime.ts`, `jira-time.ts`, `Ticket`, `command-registry.ts`, `digest`, `GitHubDelivery`, `.transaction`, `projects.ts`, `workKey`, `salvage-worktree.ts`, `identity-runtime.ts`, `validate-stage.ts`, `reconcileGitHubWrite`, `release-floor.ts`, `knowledge/routes.ts`, `.save`, `deploy-plan.ts`, `Offices`, `rollback.ts`, `ProjectProgress`, `rate-limit-samples.ts`, `jiraBinding`, `coordination-pump.ts`, `cost-ledger.ts`, `maintenance/maintenance.ts`, `service-health.ts`, `OfficeProject`, `closeout-recovery.ts`, `agents.ts`, `session-bridge.ts`, `Coordinator`, `harnessDelivers`, `provider-observation.ts`, `assignment-poll.ts`, `change-scope.ts`, `ticket-stage-runner.ts`, `call-scope.ts`, `jira-attempts.ts`, `shared.ts`, `harnessEffect`, `time-ledger.ts`, `conversations/slack.ts`, `accessibility-sources.ts`, `deploy-command.ts`, `http/commands.ts`, `StageResult`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Should `OrgChart.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11933395004625347 - nodes in this community are weakly interconnected._
- **Why does `Coordinator` connect `Coordinator` to `coordination.ts`, `offices.ts`, `scheduled-work.ts`, `checkpoint-retry.ts`, `Offices`, `enrollment-gate.ts`, `scheduled-captures.ts`, `work.ts`, `coordination-pump.ts`, `assignment-poll.ts`, `GitHubDelivery`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Should `worker-runtime.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07127882599580712 - nodes in this community are weakly interconnected._