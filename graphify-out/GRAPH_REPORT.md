# Graph Report - the-office  (2026-11-27)

## Corpus Check
- 1399 files · ~645,955 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 8053 nodes · 33910 edges · 182 communities (172 shown, 10 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 1115 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `49ab906f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- run-model.ts
- Role
- worker-runtime.ts
- features/workflow.ts
- cx
- link-draft-issue.ts
- budget-ledger.ts
- index.tsx
- incidents/routes.ts
- TelemetryPanel.tsx
- coordination.ts
- offices.ts
- shared.ts
- process.ts
- request.ts
- scheduled-captures.ts
- run-retrospective.ts
- record-trigger.ts
- route-activation.ts
- sandbox-qualification.ts
- command-registry.ts
- overseer-launch.mjs
- delivery-retry.ts
- jira-time.ts
- ref_node_path
- index.ts
- conversations/slack.ts
- cec.ts
- advance-metadata-park.ts
- reader.ts
- digest
- identity-runtime.ts
- features/commands.ts
- run.ts
- Coordinator
- common.cjs
- pr-observation-shape.ts
- routing.cjs
- entry.ts
- lesson-selection.ts
- runner-root.ts
- time-scope.ts
- accessibility-sources.ts
- .save
- Offices
- harness-baseline.ts
- credential-spans.ts
- github-calls.ts
- daily-cto.ts
- DeploymentFence
- features.ts
- project-bindings.ts
- investigations/ledger.ts
- timed-statements.ts
- alert-issue.ts
- weekly-rollup.ts
- overseer/commands.ts
- dependency-bots/adopt.ts
- fact-bounds.ts
- redact-evidence.ts
- cost-ledger.ts
- assignments.ts
- TicketTimeline.tsx
- OfficeConfigView.tsx
- constellation-runtime.ts
- validate_pr_body.cjs
- audit-plan-candidates.cjs
- pass.ts
- ref_node_crypto
- App.tsx
- OfficeScene.tsx
- spawn-command.ts
- session-context-file.ts
- projects.ts
- session-scope.ts
- service-health.ts
- OfficeProject
- requests.ts
- incidents.ts
- agents.ts
- session-bridge.ts
- github-delivery.ts
- coordination-tick.ts
- remove-candidate.ts
- viewer.js
- maintenance/maintenance.ts
- stopped-record.ts
- sanitize
- superseded-wiki-pr.ts
- ref_node_child_process
- provider-observation.ts
- ticket-evidence.ts
- session-context-client.ts
- plans.cjs
- assignment-poll.ts
- capture-session-clone.py
- enrollment-gate.ts
- jiraBinding
- pilot-delivery.ts
- archive-plan.cjs
- call-scope.ts
- jira-attempts.ts
- continue-ownership-read.ts
- on-merge-sync.cjs
- ref_node_sqlite
- extract-worker.mjs
- controller-runtime.ts
- harnessEffect
- judge-resumes.ts
- pr-observation-graphql.ts
- blocker-followups.ts
- follow-production.ts
- brain-maintenance.ts
- OfficeSnapshot
- slack-supersession.ts
- run-accounting.ts
- qa.ts
- qa-plan-continuation.ts
- writer-restart.ts
- Store
- retrospective-subject.ts
- .getEffect
- ControlStore
- deploy-command.ts
- refresh-issue-state.cjs
- .emit
- Ticket
- resume-after-sign-in.ts
- security.ts
- recovery/stopped-base-update.ts
- runner-state.ts
- MaintenanceRun
- IncidentLedger
- work.ts
- state-parts.ts
- triage.ts
- knowledge.ts
- notifications.ts
- deploy-plan.ts
- scheduled-work.ts
- delivery-repairs.ts
- metadata-park-words.ts
- scheduler.ts
- production.ts
- reconcile-merges.cjs
- owned-artifact.ts
- artifact
- engine.ts
- ref_zod
- resume-control.ts
- serve-graph.cjs
- workKey
- JiraWorklogTransport
- checkpoint-completion.ts
- seeded-office-lessons.ts
- recorded-gh-command.ts
- carried-checks.ts
- observe-github-merges.ts
- write-credential-scope.ts
- routing.js
- bareSpans
- record-push.ts
- holdReason
- json-layers.ts
- telemetry/report.ts
- handover-cms.ts
- launch.mjs
- bare-value.ts
- codex-rollout.ts
- continue-access-only-plan.ts
- useOfficePreferences.ts
- release-manifest.ts
- validate_wiki_pr_body.cjs
- codex-rollout-file.ts
- delivery-ownership.ts
- QuestionNotifications
- intent.ts
- restart-writer.ts
- session-snapshot-cleanup.ts
- quota-governor.ts
- deploy.ts
- packed-consumer-pnpm.ts

## God Nodes (most connected - your core abstractions)
1. `Store` - 486 edges
2. `TicketJob` - 248 edges
3. `digest()` - 175 edges
4. `command()` - 163 edges
5. `GitHubDelivery` - 145 edges
6. `holdReason()` - 143 edges
7. `OfficeSnapshot` - 123 edges
8. `artifact()` - 116 edges
9. `StageResult` - 111 edges
10. `workKey()` - 110 edges

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

## Communities (182 total, 10 thin omitted)

### Community 0 - "run-model.ts"
Cohesion: 0.04
Nodes (125): LedgerOptions, AttributedFailure, NotDispatched, claudeGeneration(), ClaudeSignIn, normalizeClaudeToken(), readClaudeSignIn(), claimText() (+117 more)

### Community 1 - "Role"
Cohesion: 0.12
Nodes (37): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+29 more)

### Community 2 - "worker-runtime.ts"
Cohesion: 0.06
Nodes (51): savedStageCompletion(), candidateWorkspaceEnvironment(), assignmentSubject(), dispatchExposure(), prepareExposure(), lessonPurpose(), LessonSelection, catalogLine() (+43 more)

### Community 3 - "features/workflow.ts"
Cohesion: 0.08
Nodes (54): approveFeature(), featureById(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), discoveryPrompt(), planPrompt() (+46 more)

### Community 4 - "cx"
Cohesion: 0.08
Nodes (103): Outbox(), blockedSummary(), ServiceHealthPanel(), followUp(), labels, ServiceHealthRow(), BlockerFollowups(), LearningCoverage() (+95 more)

### Community 5 - "link-draft-issue.ts"
Cohesion: 0.11
Nodes (25): CARD_STATUS_QUERY, cardStatusFrom(), candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf() (+17 more)

### Community 6 - "budget-ledger.ts"
Cohesion: 0.06
Nodes (54): abandonExpired(), Admission, admit(), admitDeployment(), balance(), bindEvidence(), count(), errcode() (+46 more)

### Community 7 - "index.tsx"
Cohesion: 0.05
Nodes (95): FeatureDelivery(), FeatureDocuments(), views, FeatureReading(), FeatureWorkspace(), send(), phases, LinkedFeatures() (+87 more)

### Community 8 - "incidents/routes.ts"
Cohesion: 0.07
Nodes (51): citationFault(), CitationSchema, ClaimedRange, ResolvedRange, SourceVersions, sourceVersions(), dismiss(), DISMISSAL_CITATIONS (+43 more)

### Community 9 - "TelemetryPanel.tsx"
Cohesion: 0.11
Nodes (35): TelemetryReport, LiveAnchor, AzureBuild, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens() (+27 more)

### Community 10 - "coordination.ts"
Cohesion: 0.09
Nodes (28): compatible(), issueKey(), observePrerequisites(), PrerequisiteSchema, PrerequisitesSchema, deliverySource(), captureGitHubFailures(), completeNativeCheckpoint() (+20 more)

### Community 11 - "offices.ts"
Cohesion: 0.11
Nodes (23): featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), automaticEnabled(), automaticFeature(), FeaturePlanningConfig, POLICY_VERSION, recoveryHeld() (+15 more)

### Community 12 - "shared.ts"
Cohesion: 0.05
Nodes (58): jiraQueueProgress(), OwnerStepItem, ownerStepItems(), signIn(), assignmentDiagnostics(), diagnosticContext(), diagnosticSnapshot(), followUpPicture() (+50 more)

### Community 13 - "process.ts"
Cohesion: 0.08
Nodes (45): credentialOptions(), inHistoryOf(), CompareMemory, compareMemory(), COMPARES_PER_PASS, comparison(), DeployedFixes, DeployedFixesInput (+37 more)

### Community 14 - "request.ts"
Cohesion: 0.09
Nodes (57): requireDeliveryAuthority(), AdoptionBinding, REBASE, rebaseArgs(), rebaseComment(), belongsTo(), botOf(), matchesRedo() (+49 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.14
Nodes (45): accounting, DeliverySubject, nonDelivery, originalReads, createFeature(), assertEnrollable(), assessmentSignal(), AssessmentSignals (+37 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.09
Nodes (44): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, BlockingTrigger, blockingTrigger(), isBlocking() (+36 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.11
Nodes (34): distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementIntakeGate(), learningDigest(), recordLearningOpportunity(), baselined() (+26 more)

### Community 18 - "route-activation.ts"
Cohesion: 0.07
Nodes (65): ActiveEntry, effectId(), entry(), fail(), KnownProject, only(), parseGitHubApp(), positive() (+57 more)

### Community 19 - "sandbox-qualification.ts"
Cohesion: 0.03
Nodes (112): timeoutsValid(), CODEX_LAST_MESSAGE_ARGUMENT, CODEX_SCHEMA_ARGUMENT, errorCode(), prepareReaderInput(), ReaderFiles, readerFiles(), writeExclusive() (+104 more)

### Community 20 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 21 - "overseer-launch.mjs"
Cohesion: 0.07
Nodes (80): acquireLauncherLock(), alone(), ancestry(), assertDirectoryOrAbsent(), attemptRecord(), bounded(), boundedString(), checkOwnedFile() (+72 more)

### Community 22 - "delivery-retry.ts"
Cohesion: 0.08
Nodes (63): DeliveryRetryDecision, deliveryRetryDecision(), readOnlyStageJob(), retryable(), RetryStore, UnsettledRead, BOARD_STOP, boardOnly() (+55 more)

### Community 23 - "jira-time.ts"
Cohesion: 0.11
Nodes (37): unresolvedAttempts(), bindingOf(), connectWith(), data(), envelope(), finishVerifiedEffects(), JiraWorklogs, locks (+29 more)

### Community 24 - "ref_node_path"
Cohesion: 0.04
Nodes (109): interruptedImplementation(), continueUnsealedQA(), entry(), readRejection(), adoptCandidate(), reported, Scope, advisoryPM() (+101 more)

### Community 25 - "index.ts"
Cohesion: 0.05
Nodes (68): implementationContinuationRoute(), qaPlanRetryRoute(), servedOutbox(), assertQuestionVisibility(), isNotice(), incidentsRoute(), resumeSwitch(), failure() (+60 more)

### Community 26 - "conversations/slack.ts"
Cohesion: 0.10
Nodes (22): channelNoticeAuthorized(), MergeNotifications, comparableSlackText(), labelIsUrl(), SlackMessages, SlackRequestSchema, SlackResultSchema, SlackVerificationSchema (+14 more)

### Community 27 - "cec.ts"
Cohesion: 0.09
Nodes (34): OwnershipRead, movedHeadNote(), cecPrompt(), resolvedDecisionNote(), stageInstructions, stageInstructionsFor(), REVIEW_FINDINGS_RULE, closedReadonlyPlan() (+26 more)

### Community 28 - "advance-metadata-park.ts"
Cohesion: 0.09
Nodes (68): ProjectCard, advanceMetadataPark(), Parked, releaseWords(), sentAnything(), cardResumeRoute(), effectiveParkPickup(), PICKUP_ASSIGNEE (+60 more)

### Community 29 - "reader.ts"
Cohesion: 0.09
Nodes (26): knowledgeActivity(), knowledgeActivityPage(), committedNotePage(), BrainOverlap, BrainGraph, BrainNote, BrainReader, CommittedBrain (+18 more)

### Community 30 - "digest"
Cohesion: 0.07
Nodes (81): retryRead(), createdContentSha256(), Binding, historyBeforeWrite(), matchesBoundDescription(), DescriptionEdit, DescriptionHistory, DescriptionHistoryUnavailable (+73 more)

### Community 31 - "identity-runtime.ts"
Cohesion: 0.10
Nodes (22): KeychainKeySource, appJwt(), base64url(), signingKey(), AppKeySource, Execute, keychainKeySource(), bound (+14 more)

### Community 32 - "features/commands.ts"
Cohesion: 0.16
Nodes (28): commandFeature(), reviewQuestions(), readEvidence(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS, requestReplan(), reserveReplacement() (+20 more)

### Community 33 - "run.ts"
Cohesion: 0.21
Nodes (13): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, OFFICE_FIX_PROMPT, OfficeFixResult, validateOfficeFix(), investigationReady(), InvestigationOptions, InvestigationReport (+5 more)

### Community 35 - "common.cjs"
Cohesion: 0.15
Nodes (27): connections(), fs, main(), path, crypto, ensureInside(), { execFileSync }, fs (+19 more)

### Community 36 - "pr-observation-shape.ts"
Cohesion: 0.18
Nodes (22): withGitHubOperation(), githubPRDescription(), closingDirectives(), ObservedPR, enumValue(), fail(), graphqlPR(), mapped() (+14 more)

### Community 37 - "routing.cjs"
Cohesion: 0.12
Nodes (28): fs, main(), path, { spawnSync }, frontmatterProblems(), adjacency(), edgeCost(), edgeKey() (+20 more)

### Community 38 - "entry.ts"
Cohesion: 0.08
Nodes (29): EntryRead, EntrySchema, ID_MAX, parseEntry(), PATH_MAX, PATHS_MAX, PLAYBOOK_KINDS, PLAYBOOK_STAGES (+21 more)

### Community 39 - "lesson-selection.ts"
Cohesion: 0.16
Nodes (18): INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, MAINTENANCE, MAX_LESSONS, normalPath(), PURPOSES (+10 more)

### Community 40 - "runner-root.ts"
Cohesion: 0.12
Nodes (33): resolveCliRoot(), privateDirectories(), runnerPaths(), PIN_ENTRY, pinCommand(), storageOverlaps(), readRunnerPin(), RunnerPin (+25 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.09
Nodes (42): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence(), CaptureContext (+34 more)

### Community 42 - "accessibility-sources.ts"
Cohesion: 0.14
Nodes (20): PublicationReceipt, GitHubIssuePublisher, number(), same(), actionable(), closingPull(), Finding, handoffIssue() (+12 more)

### Community 43 - ".save"
Cohesion: 0.09
Nodes (57): Intake, resolveBlockedTransition(), document(), transitionWithComment(), jiraAccount(), jiraCollection(), JiraCredential, jiraCredential() (+49 more)

### Community 44 - "Offices"
Cohesion: 0.15
Nodes (4): projectById(), Offices, markCaptureStart(), SessionBridge

### Community 45 - "harness-baseline.ts"
Cohesion: 0.15
Nodes (22): BaselineReport, baselineReport(), BaselineSource, baselineText(), millions(), row(), share(), add() (+14 more)

### Community 46 - "credential-spans.ts"
Cohesion: 0.06
Nodes (39): AFTER_LABEL, BARE_CREDENTIAL, BARE_LABEL, BARE_UNIT, BARE_VALUE, CAMEL_START, CONTROL_ESCAPE, CREDENTIAL_NAME (+31 more)

### Community 47 - "github-calls.ts"
Cohesion: 0.09
Nodes (22): add(), addSource(), busiest(), CallLedger, Entry, sourceRows(), Sources, CallCounts (+14 more)

### Community 48 - "daily-cto.ts"
Cohesion: 0.12
Nodes (23): currentCitations(), Fact, NOT_CURRENT, PROVIDER_ERROR, evidenceRequestConflicts, dailyReviewPrompt(), applyGoalReview(), DailyResultSchema (+15 more)

### Community 49 - "DeploymentFence"
Cohesion: 0.38
Nodes (3): assertToken(), DeploymentFence, DeploymentFenceRouteContext

### Community 50 - "features.ts"
Cohesion: 0.08
Nodes (41): normalizeRound(), FeatureApproval, FeatureAttempt, FeatureAuthority, FeatureBaseline, FeatureDocument, FeatureHandoff, FeatureHarnessAction (+33 more)

### Community 51 - "project-bindings.ts"
Cohesion: 0.10
Nodes (37): CommentPage, commentReadback(), devUpdate(), HEADLINE, Assignment, Transition, jiraRecord(), unpack() (+29 more)

### Community 52 - "investigations/ledger.ts"
Cohesion: 0.18
Nodes (18): acceptedCompletionResolution(), investigationCandidates(), investigationId(), finishedSubjectResolution(), investigationFollowUps(), interruptedQARerunResolution(), investigationResolution(), syncInvestigations() (+10 more)

### Community 53 - "timed-statements.ts"
Cohesion: 0.18
Nodes (14): StoreTiming, StoreTimings, storeTimings(), NAMED, rowsText(), rowText(), SQL_TOKEN, statementName() (+6 more)

### Community 54 - "alert-issue.ts"
Cohesion: 0.19
Nodes (21): AlertIssue, alertIssueBody(), alertIssueTitle(), alertMarker(), closeAlertIssue(), ensureAlertIssue(), findAlertIssue(), Guard (+13 more)

### Community 55 - "weekly-rollup.ts"
Cohesion: 0.14
Nodes (27): learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), RollupResult (+19 more)

### Community 56 - "overseer/commands.ts"
Cohesion: 0.07
Nodes (43): header(), readStanding(), guardPresent(), overseerCommand(), reconcileArgs(), runnerStatus(), DEFAULT_OFFICE_URL, Condition (+35 more)

### Community 57 - "dependency-bots/adopt.ts"
Cohesion: 0.09
Nodes (36): IntakeContext, closesIssue(), linkedBody(), linkPR(), DependabotPR, dependabotPR(), openDependabotPulls(), refusal() (+28 more)

### Community 58 - "fact-bounds.ts"
Cohesion: 0.18
Nodes (19): leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance() (+11 more)

### Community 59 - "redact-evidence.ts"
Cohesion: 0.18
Nodes (15): deliveryRetryDecisions(), lastFailedMailCheck(), lastMailCheckOutcome(), LANES, observeProjects(), OfficeObservation, Projected, AWS_KEY_ID (+7 more)

### Community 60 - "cost-ledger.ts"
Cohesion: 0.17
Nodes (25): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId(), OutsideEdit (+17 more)

### Community 61 - "assignments.ts"
Cohesion: 0.08
Nodes (33): assignmentKnowledge(), clip(), DEMAND_LIMIT, demandFacts(), DemandSection, key(), LessonKey, notes() (+25 more)

### Community 62 - "TicketTimeline.tsx"
Cohesion: 0.11
Nodes (22): CTOReview(), goalState, DailyCTO(), reportDate(), reviewStatus, InlineText(), reviewExcerpt(), ReviewText() (+14 more)

### Community 63 - "OfficeConfigView.tsx"
Cohesion: 0.31
Nodes (9): loadOfficeConfig(), OfficeConfigSection(), autoAdoptText(), BOT_NAMES, OfficeConfigState, OfficeConfigView(), policyText(), OfficeConfigSummary (+1 more)

### Community 64 - "constellation-runtime.ts"
Cohesion: 0.06
Nodes (49): KnowledgeActivity, KnowledgeEdge, KnowledgeMap, KnowledgeNode, ATMOSPHERE, mapAtmosphere(), Particle, system() (+41 more)

### Community 65 - "validate_pr_body.cjs"
Cohesion: 0.36
Nodes (8): fs, main(), readableText(), REQUIRED_CHECKS, REQUIRED_SECTIONS, sections(), validatePullRequestBody(), withoutComments()

### Community 66 - "audit-plan-candidates.cjs"
Cohesion: 0.14
Nodes (31): audit(), branchIssueNumbers(), classify(), distinctiveTitleWords(), { execFileSync }, extractPaths(), findPrForMergeSubject(), fmtCommit() (+23 more)

### Community 67 - "pass.ts"
Cohesion: 0.03
Nodes (99): Digest, Evidence, FAILURE_ID, FailureAnswer, failureDigest(), FailureEvent, failureLine(), FailureReceipt (+91 more)

### Community 68 - "ref_node_crypto"
Cohesion: 0.11
Nodes (65): DeliveryAuthorityInput, canonical(), assessResumes(), Standing, CheckpointEligibility, checkpointEligibility(), admitAssignmentResume(), forAssignment() (+57 more)

### Community 69 - "App.tsx"
Cohesion: 0.05
Nodes (79): BrainDrawer(), App(), BrainWorkspace, CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants, ElevatorPhase (+71 more)

### Community 70 - "OfficeScene.tsx"
Cohesion: 0.07
Nodes (60): labels, githubStageLabels, withoutElapsed(), CameraBookmark, restoreBookmark(), LiveAgentTask(), Props, RunningTask() (+52 more)

### Community 71 - "spawn-command.ts"
Cohesion: 0.12
Nodes (25): childEnvironment(), exitFailure(), inactivityWatch(), At, Errno, errno(), GroupInventory, GroupProbe (+17 more)

### Community 72 - "session-context-file.ts"
Cohesion: 0.20
Nodes (15): ContextFoldPrefix, contextFoldPrefix(), SessionContextCheckpoint, captureSessionContextClone(), ContextReadPhase, SessionContextDeadline, sessionContextFile(), ContextReadChanged (+7 more)

### Community 73 - "projects.ts"
Cohesion: 0.06
Nodes (64): escaped(), IntakeBinding, intakeJql(), intakeLocation(), projectListScope(), AUTO_ADOPT_BOTS, AutoAdoptBot, EffectiveAutoAdopt (+56 more)

### Community 74 - "session-scope.ts"
Cohesion: 0.20
Nodes (16): Bound, claudeScopeParser(), claudeSessionScope(), CODEX_ROLLOUTS, contextReaders(), retainSessionMessage(), SessionConversation, escaped() (+8 more)

### Community 75 - "service-health.ts"
Cohesion: 0.12
Nodes (22): ClaudeLoginRefusal, claudeLoginRefusal(), claudeRefusalWords(), RECORDED_REFUSALS, refusedClaudeRow(), providers, ProviderStatusChecks, summary (+14 more)

### Community 76 - "OfficeProject"
Cohesion: 0.12
Nodes (31): buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs(), fullActivePRs(), observation(), PRRead (+23 more)

### Community 77 - "requests.ts"
Cohesion: 0.09
Nodes (48): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+40 more)

### Community 78 - "incidents.ts"
Cohesion: 0.10
Nodes (45): attributedRecords(), foldsItsRun(), groupCandidates(), ObservedIncident, ObservedSubject, incidentId(), mailboxFreeze(), details() (+37 more)

### Community 79 - "agents.ts"
Cohesion: 0.06
Nodes (55): implementationWorkerContext(), intakeEnumeration(), intakeMembership(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), plainResume() (+47 more)

### Community 80 - "session-bridge.ts"
Cohesion: 0.11
Nodes (28): codexDaemonProcesses(), accountCodexProcesses(), CodexProcessInventory, codexProcessInventory(), DesktopSessions, unaccountedProcesses(), codexThreadMetadata(), METADATA_CHUNK (+20 more)

### Community 81 - "github-delivery.ts"
Cohesion: 0.04
Nodes (118): writerRestartInstruction(), harnessCloseout(), PASSING, verifyMergeActions(), findingsBlock(), metadataCarriedAdvisoryIds(), ownedBefore(), QA_STAGES (+110 more)

### Community 82 - "coordination-tick.ts"
Cohesion: 0.23
Nodes (10): reconcileNoticeConfirmations(), dependencyCompletionKey(), legacy, reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION, tick() (+2 more)

### Community 83 - "remove-candidate.ts"
Cohesion: 0.14
Nodes (22): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), maintenanceCandidate(), moveAside(), moveBack(), purgeRemoved(), purging (+14 more)

### Community 84 - "viewer.js"
Cohesion: 0.19
Nodes (25): addMetaLink(), addMetaRow(), addRelationship(), applyView(), buildIndexes(), buildLegend(), buildModel(), buildRenderer() (+17 more)

### Community 85 - "maintenance/maintenance.ts"
Cohesion: 0.12
Nodes (23): captureMaintenanceStep(), accessibilitySources(), reconcileSourceScan(), sourceFindings, sourceReview(), candidateOwner(), SETTLED, skipOwnedCandidate() (+15 more)

### Community 86 - "stopped-record.ts"
Cohesion: 0.06
Nodes (69): capabilityBlockedReviews(), latestReviews(), projectOutbox(), item(), syncOutbox(), sameOwnerSteps(), decidedFor(), deliveryRetryPending() (+61 more)

### Community 87 - "sanitize"
Cohesion: 0.06
Nodes (47): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+39 more)

### Community 88 - "superseded-wiki-pr.ts"
Cohesion: 0.10
Nodes (60): commentId(), CommentIntent, CommentReceipt, conversation(), exact(), findProofComment(), matchesProofComment(), postProofComment() (+52 more)

### Community 89 - "ref_node_child_process"
Cohesion: 0.13
Nodes (18): changedPaths(), { execFileSync }, files, isMapInput(), mapOnly(), { execFileSync }, git(), publish() (+10 more)

### Community 90 - "provider-observation.ts"
Cohesion: 0.13
Nodes (26): az(), correlatedBuild(), Azure, azurePipelines(), outcome(), Read, RUNS_PER_PIPELINE, Api (+18 more)

### Community 91 - "ticket-evidence.ts"
Cohesion: 0.11
Nodes (29): assetDownloader(), attachmentKind(), evidenceDirectory(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS, EvidenceAttachment (+21 more)

### Community 92 - "session-context-client.ts"
Cohesion: 0.11
Nodes (19): claudeSessionContext(), readTranscript, codexSessionContext(), readRollout, packContextFailure(), PackedContextFailure, unpackContextFailure(), ContextThread (+11 more)

### Community 93 - "plans.cjs"
Cohesion: 0.13
Nodes (27): fs, main(), parse(), path, repoRoot(), substantive(), walk(), association() (+19 more)

### Community 94 - "assignment-poll.ts"
Cohesion: 0.10
Nodes (36): currentOutbox(), BLOCK, harnessBlockMove(), harnessParkedCard(), noted(), admitReadyCards(), confirmedGone(), goneQuery() (+28 more)

### Community 96 - "enrollment-gate.ts"
Cohesion: 0.16
Nodes (33): dispatchNightly(), requestDelivery(), eligibility(), Admission, admit(), WAIT_STATUSES, dependencyEligibility(), validatePrerequisites() (+25 more)

### Community 97 - "jiraBinding"
Cohesion: 0.18
Nodes (7): contentSchema(), JiraIssuePublisher, jiraText(), descriptionPreimage(), plain(), publicationDescription(), jiraBinding()

### Community 98 - "pilot-delivery.ts"
Cohesion: 0.07
Nodes (68): candidateBranchMoved(), applyChangeScope(), endChangeScope(), levels(), MAX_CHECKS, owedUnderScope(), scopeBase(), scopeOutgrown() (+60 more)

### Community 99 - "archive-plan.cjs"
Cohesion: 0.12
Nodes (33): fs, main(), parse(), path, archive(), cell(), ensureIndex(), fromArgs() (+25 more)

### Community 100 - "call-scope.ts"
Cohesion: 0.09
Nodes (44): failed(), githubAuthError(), graphqlCounts(), noCalls(), refusedByRateLimit(), revalidated, slurpedPages(), succeeded() (+36 more)

### Community 101 - "jira-attempts.ts"
Cohesion: 0.11
Nodes (23): attempted(), attemptState(), bound(), covers(), JiraAttempt, jiraAttempts(), JiraAttemptState, open() (+15 more)

### Community 102 - "continue-ownership-read.ts"
Cohesion: 0.18
Nodes (18): continueOwnershipRead(), expiredOwnershipRead(), handoffOwnership(), ReadbackOwnerDecision, ownershipReadGate(), ownershipReadState(), ownershipReadSource(), ReadOwnershipCandidate (+10 more)

### Community 103 - "on-merge-sync.cjs"
Cohesion: 0.19
Nodes (22): fieldSpan(), keyPattern(), list(), parseListLiteral(), quote(), render(), scalar(), splitFrontmatter() (+14 more)

### Community 104 - "ref_node_sqlite"
Cohesion: 0.09
Nodes (38): absentAdmission(), AdmissionComparison, AdmissionSnapshot, compareAdmissions(), snapshotAdmissions(), BackupEntry, BackupInput, BackupInventory (+30 more)

### Community 105 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 106 - "controller-runtime.ts"
Cohesion: 0.12
Nodes (18): projectData(), StoreDatabase, ControllerEffects, controllerEffects(), DEPLOY_PROJECT, alive(), ControllerMachine, option() (+10 more)

### Community 107 - "harnessEffect"
Cohesion: 0.07
Nodes (68): effectKey(), LaneOperation, laneWrite(), moveCardOnce(), Lane, MOVABLE, moveLane(), resolveLane() (+60 more)

### Community 108 - "judge-resumes.ts"
Cohesion: 0.06
Nodes (48): FLAGS, incidentCommand(), IncidentCommandIO, option(), USAGE, whole(), boundaryCrossed(), Crossing (+40 more)

### Community 109 - "pr-observation-graphql.ts"
Cohesion: 0.13
Nodes (30): responseBody(), ChildRequest, headCheckRuns(), includeBody(), readOpenPRs(), commitOf(), ConnectionPages, embeddedHead() (+22 more)

### Community 110 - "blocker-followups.ts"
Cohesion: 0.11
Nodes (49): conversationReadbackReady(), followupOf(), pendingReadback(), queueConversationReadback(), readbackEnding(), uncertainConversations(), conversationResolved(), readBackConversations() (+41 more)

### Community 111 - "follow-production.ts"
Cohesion: 0.20
Nodes (17): awaitingJiraStatus(), awaitingProduction(), FOLLOW_DAYS, followed(), isFollowed(), Azure, AzureRead, containedIn() (+9 more)

### Community 112 - "brain-maintenance.ts"
Cohesion: 0.15
Nodes (15): maintenancePolicies(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, brainResultStop(), gateMark(), neverStarted(), unstartedCandidate() (+7 more)

### Community 113 - "OfficeSnapshot"
Cohesion: 0.05
Nodes (69): ctoInputIdentityMatches(), ctoInputRecovered(), metadataParkAction(), ADOPTION_STALLED_MS, knowledgeOutbox(), ChatMarkdown(), Conversation(), ConversationDraft (+61 more)

### Community 114 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 115 - "run-accounting.ts"
Cohesion: 0.06
Nodes (54): BoundedRead, comparable(), EvidenceOutcome, recordRunEvidence(), backfillClaudeCost(), CompletionReader, CodexRollout, codexHome() (+46 more)

### Community 119 - "Store"
Cohesion: 0.06
Nodes (33): harnessMergeAttempted(), mergeEffects(), officeMerge(), approveMerge(), assertHarnessMayMerge(), HUMAN_MERGE, GitHubFeaturePublisher, RepairWaitEntry (+25 more)

### Community 120 - "retrospective-subject.ts"
Cohesion: 0.13
Nodes (23): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates() (+15 more)

### Community 121 - ".getEffect"
Cohesion: 0.05
Nodes (61): FeaturePublisher, publishFeature(), reconcilePublication(), reserveIdentity(), GitHubOperations, AMBIENT_TOKENS, appCredential(), ChildCredential (+53 more)

### Community 122 - "ControlStore"
Cohesion: 0.13
Nodes (10): DailyCTO, EvidenceRequestConflict, reviewWeekday(), Briefing, saveReviewBriefing(), SeenReports, WAITING, waitingReport() (+2 more)

### Community 123 - "deploy-command.ts"
Cohesion: 0.07
Nodes (59): CONTROLLER_ENTRY, ControllerPin, Pin, pinnedController(), readControllerPin(), writeControllerPin(), controllerStartFailure(), controllerOf() (+51 more)

### Community 124 - "refresh-issue-state.cjs"
Cohesion: 0.19
Nodes (20): atomicWrite(), advanceFence(), closingIssues(), githubRefs(), key(), normalizeGithubQuery(), normalizeRepository(), parseGithubQuery() (+12 more)

### Community 125 - ".emit"
Cohesion: 0.11
Nodes (35): assertOwnership(), decideImplementation(), consumeQAPlanRetry(), Decision, requestQAPlanRetry(), configureChannelNotices(), configureNotices(), noticeState() (+27 more)

### Community 126 - "Ticket"
Cohesion: 0.06
Nodes (41): carriedNotRepeated(), changeScopeNote(), Scoped, JiraOperations, currentEnvironmentWait(), environmentWait(), capacityInterruptedRun(), providerSaid() (+33 more)

### Community 127 - "resume-after-sign-in.ts"
Cohesion: 0.18
Nodes (16): hasPendingDelivery(), resumeAfterSignIn(), signInWait(), BrowserPage, browserPages(), ReadPages, SignInState, signInState() (+8 more)

### Community 128 - "security.ts"
Cohesion: 0.16
Nodes (16): archiveOldReports(), RETAINED_REPORTS, snapshotText(), escapedAt(), HEADER_CREDENTIAL, PROVIDER_TOKEN, QUERY_CREDENTIAL, redactedText() (+8 more)

### Community 129 - "recovery/stopped-base-update.ts"
Cohesion: 0.08
Nodes (39): writerRestartPending(), closeoutRequestResolved(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), preparationRequestResolved(), publishedDraftConflictUnresolved(), assertStoppedBaseAudit(), AuditRow (+31 more)

### Community 130 - "runner-state.ts"
Cohesion: 0.14
Nodes (19): at, EMPTY_STATE, IncidentSample, IncidentSummary, InFlight, Intent, JournalIntent, PASS_OUTCOMES (+11 more)

### Community 131 - "MaintenanceRun"
Cohesion: 0.20
Nodes (15): checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), repeatedVendorReviewBlock(), stoppedInVendorReview(), leftToNextRun(), NEXT_RUN_DUE_MS, night() (+7 more)

### Community 132 - "IncidentLedger"
Cohesion: 0.06
Nodes (44): PacketInput, absent(), IncidentChange, IncidentLedger, isOpen(), incidentNotices(), NOTICE_KINDS, readNotices() (+36 more)

### Community 133 - "work.ts"
Cohesion: 0.08
Nodes (31): replacedReadback(), heldFor(), effectiveCause(), REPLACED, ITContext, recoveryHeld(), recoveryWait(), informationalRecovery() (+23 more)

### Community 134 - "state-parts.ts"
Cohesion: 0.11
Nodes (17): [cmd,...rawArgs], readSavedState(), LARGE_KEY_CHARS, plain(), RedactedEntries, RedactedEntry, redactEntries(), joinParts() (+9 more)

### Community 135 - "triage.ts"
Cohesion: 0.04
Nodes (96): resolveRange(), Agreement, agreement(), anchor(), compare(), disposition(), factsKey(), file() (+88 more)

### Community 136 - "knowledge.ts"
Cohesion: 0.10
Nodes (25): BRAIN_SCOPE, SUBJECT, Kind, RetrospectiveResult, RetrospectiveResultSchema, RollupResultSchema, Stage, ImprovementGrant (+17 more)

### Community 137 - "notifications.ts"
Cohesion: 0.18
Nodes (13): ChannelSettings, notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR, plainSlackText(), section() (+5 more)

### Community 138 - "deploy-plan.ts"
Cohesion: 0.14
Nodes (29): Body, DeploymentFenceState, fenceTokenDigest(), ActiveRelease, readActiveRelease(), operationPaths(), planDeployment(), createDeployToken() (+21 more)

### Community 139 - "scheduled-work.ts"
Cohesion: 0.08
Nodes (44): freshOwnershipRead(), settledSlackReadback(), slackRequestSettled(), deliverySlot(), withAmendmentOwnership(), metadataRequestResolved(), gateFeatureWork(), itRecoveryRequest() (+36 more)

### Community 140 - "delivery-repairs.ts"
Cohesion: 0.09
Nodes (48): removeAdoptedClone(), namedRepairIds(), pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), stoppedBaseCheckout(), saveStoppedBaseArtifact(), stoppedBaseUpdateResolved(), stoppedBasePackageInstruction() (+40 more)

### Community 141 - "metadata-park-words.ts"
Cohesion: 0.19
Nodes (16): parksInJira(), OUTCOME, qaComment(), remote(), STAGE, plainWords(), tidy(), field() (+8 more)

### Community 142 - "scheduler.ts"
Cohesion: 0.12
Nodes (16): OfficeCapacity, PROJECT_LOCAL, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch() (+8 more)

### Community 144 - "reconcile-merges.cjs"
Cohesion: 0.22
Nodes (14): collectPulls(), copyWikiForDryRun(), { execFileSync }, flattenPages(), fs, githubRequest(), isWikiBotPull(), main() (+6 more)

### Community 145 - "owned-artifact.ts"
Cohesion: 0.22
Nodes (12): investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_SOURCE_PATHS, officeSource(), done(), readBoundedNoFollow() (+4 more)

### Community 146 - "artifact"
Cohesion: 0.05
Nodes (125): containedFile(), partialLocalCleanupCandidate(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash (+117 more)

### Community 147 - "engine.ts"
Cohesion: 0.06
Nodes (20): AzureMonitor, enumerateIntakeList(), inPickupOrder(), text(), applyIntakeObservation(), checkMail(), drainMail(), requestMail() (+12 more)

### Community 148 - "ref_zod"
Cohesion: 0.33
Nodes (4): Health, IdleObservation, IdleResult, WaitIdleInput

### Community 149 - "resume-control.ts"
Cohesion: 0.26
Nodes (8): ResumeArrivalsInput, absent(), NEVER_ENABLED, ResumeControl, stated(), Stored, unreadable(), ResumeSwitch

### Community 150 - "serve-graph.cjs"
Cohesion: 0.24
Nodes (9): createServer(), fs, http, listen(), attempt(), main(), path, resolveRequest() (+1 more)

### Community 151 - "workKey"
Cohesion: 0.09
Nodes (35): StoppedWriter, notOwned(), mergedByOwner(), mergedByOfficeBot(), closeableIssue(), effectsSettled(), eligible(), officePublished() (+27 more)

### Community 153 - "checkpoint-completion.ts"
Cohesion: 0.18
Nodes (11): BrainStatusSchema, identity, brainCheckpointCompletion(), coverageSchema, verified, PublishedPR, publishedWorkCleanedUp(), nativeChecks (+3 more)

### Community 154 - "seeded-office-lessons.ts"
Cohesion: 0.28
Nodes (6): CONSOLIDATED, CONSOLIDATED_AT, seedProjectLessons(), SEEDS, seedOfficeLessons(), SEEDS

### Community 155 - "recorded-gh-command.ts"
Cohesion: 0.19
Nodes (20): assignments(), changeDirectory(), closing(), CREATE, createGuard(), flags(), named(), read() (+12 more)

### Community 156 - "carried-checks.ts"
Cohesion: 0.15
Nodes (22): latestQA(), notPassedInLatestQA(), QACoverage, qaCoverage(), same(), Tested, safeWebUrl(), officeValidation() (+14 more)

### Community 157 - "observe-github-merges.ts"
Cohesion: 0.28
Nodes (15): clearCooldown(), coolDown(), coolingDown(), MERGE_NOTICE_RECHECK_MS, waitKey(), waits, isMergeCommit(), issueOf() (+7 more)

### Community 158 - "write-credential-scope.ts"
Cohesion: 0.25
Nodes (13): assertPushCredential(), Execute, assertBoundPushDestination(), digest(), Execute, file(), PUSH_HOOKS, pushHookChain() (+5 more)

### Community 160 - "bareSpans"
Cohesion: 0.19
Nodes (15): apostropheEnd(), bareSpans(), credentialSpans(), genuineGap(), headerValueEnd(), isQueryLabel(), labelBefore(), nameEnd() (+7 more)

### Community 161 - "record-push.ts"
Cohesion: 0.18
Nodes (13): Event, exactCommand(), Invocation, localHookCommand(), one(), prePushRejection(), PushIdentity, retirementBoundary() (+5 more)

### Community 162 - "holdReason"
Cohesion: 0.05
Nodes (93): ownershipReadHistory(), deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), deliveryIntakeBlocker(), gateRegisteredDelivery(), resolveDeliveryWork(), idle() (+85 more)

### Community 163 - "json-layers.ts"
Cohesion: 0.26
Nodes (9): decode(), decodedIndex(), evenRunBefore(), JsonLayers, LayerString, opensValue(), SIMPLE, strings() (+1 more)

### Community 164 - "telemetry/report.ts"
Cohesion: 0.26
Nodes (13): Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked(), row() (+5 more)

### Community 165 - "handover-cms.ts"
Cohesion: 0.40
Nodes (3): file, project, root

### Community 166 - "launch.mjs"
Cohesion: 0.05
Nodes (108): RFC-9562, BANNER, builtin(), bundleLauncher(), LAUNCHER_BUNDLE, LAUNCHER_ENTRY, launcherChunk(), REPOSITORY (+100 more)

### Community 167 - "bare-value.ts"
Cohesion: 0.30
Nodes (11): BareValue, bareValue(), deeperValueEnd(), ENDS, isSeparator(), plainEscape(), queryValue(), separatorEscapeAt() (+3 more)

### Community 168 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 169 - "continue-access-only-plan.ts"
Cohesion: 0.54
Nodes (6): Document, document(), isAccessOnlyPlan(), settledAccessOnlyState(), continueAccessOnlyPlan(), entryExists()

### Community 170 - "useOfficePreferences.ts"
Cohesion: 0.06
Nodes (26): PreferencesRouteContext, PreferencesStore, SendMessage, releaseSoundEvents, themeColor, acceptPreferences(), PreferenceCandidate, PreferenceState (+18 more)

### Community 171 - "release-manifest.ts"
Cohesion: 0.15
Nodes (19): runningRevision(), runningRevision(), runtimeRevision(), BUILD_ENV, buildRelease(), BuildReleaseOptions, Execute, pinnedVersions() (+11 more)

### Community 172 - "validate_wiki_pr_body.cjs"
Cohesion: 0.33
Nodes (5): { execFileSync }, hasCanonicalWikiBody(), maintenanceBodies, matchesMaintenanceBody(), { readFileSync }

### Community 173 - "codex-rollout-file.ts"
Cohesion: 0.43
Nodes (6): createdAt(), dayDirs(), header(), ROLLOUT_MAX_BYTES, RolloutScan, scanCodexRollouts()

### Community 174 - "delivery-ownership.ts"
Cohesion: 0.33
Nodes (4): Ownership, ownershipContext, refreshDeliveryOwnership(), RefreshOwnership

### Community 177 - "intent.ts"
Cohesion: 0.14
Nodes (23): GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles(), ContinuationIO (+15 more)

### Community 179 - "restart-writer.ts"
Cohesion: 0.18
Nodes (17): ATTEMPT_DELAYS_MS, nextAttemptAt(), restartStoppedWriters(), unchangedSinceAccepted(), NOT_RETRYABLE, releaseFunds(), stoppedWriter(), WRITER_STAGES (+9 more)

### Community 183 - "session-snapshot-cleanup.ts"
Cohesion: 0.40
Nodes (5): SNAPSHOT_PREFIX, removeStaleSessionSnapshots(), SNAPSHOT_SWEEP_MS, STALE_SNAPSHOT_MS, sweepStaleSessionSnapshots()

### Community 184 - "quota-governor.ts"
Cohesion: 0.12
Nodes (17): boardReadFailure(), GitHubMonitor, CORE_RESERVE, GRAPHQL_WORK, PROBE_INTERVAL_MS, QuotaGate, QuotaGovernor, QuotaHold (+9 more)

### Community 186 - "deploy.ts"
Cohesion: 0.14
Nodes (37): abandon(), advance(), DeployContext, DeployTimings, DEPLOY_STEPS, DeployFacts, readDeployJournal(), startDeployJournal() (+29 more)

## Knowledge Gaps
- **1 isolated node(s):** `RFC-9562`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 1417 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `worker-runtime.ts`, `features/workflow.ts`, `link-draft-issue.ts`, `coordination.ts`, `offices.ts`, `shared.ts`, `process.ts`, `request.ts`, `scheduled-captures.ts`, `run-retrospective.ts`, `record-trigger.ts`, `route-activation.ts`, `delivery-retry.ts`, `jira-time.ts`, `ref_node_path`, `index.ts`, `conversations/slack.ts`, `cec.ts`, `advance-metadata-park.ts`, `reader.ts`, `digest`, `identity-runtime.ts`, `features/commands.ts`, `run.ts`, `Coordinator`, `entry.ts`, `lesson-selection.ts`, `time-scope.ts`, `accessibility-sources.ts`, `.save`, `Offices`, `daily-cto.ts`, `project-bindings.ts`, `investigations/ledger.ts`, `alert-issue.ts`, `weekly-rollup.ts`, `dependency-bots/adopt.ts`, `fact-bounds.ts`, `redact-evidence.ts`, `cost-ledger.ts`, `assignments.ts`, `ref_node_crypto`, `OfficeScene.tsx`, `OfficeProject`, `requests.ts`, `agents.ts`, `session-bridge.ts`, `github-delivery.ts`, `coordination-tick.ts`, `remove-candidate.ts`, `maintenance/maintenance.ts`, `sanitize`, `superseded-wiki-pr.ts`, `provider-observation.ts`, `ticket-evidence.ts`, `assignment-poll.ts`, `enrollment-gate.ts`, `jiraBinding`, `pilot-delivery.ts`, `jira-attempts.ts`, `continue-ownership-read.ts`, `controller-runtime.ts`, `harnessEffect`, `judge-resumes.ts`, `pr-observation-graphql.ts`, `blocker-followups.ts`, `follow-production.ts`, `brain-maintenance.ts`, `OfficeSnapshot`, `run-accounting.ts`, `retrospective-subject.ts`, `.getEffect`, `.emit`, `Ticket`, `resume-after-sign-in.ts`, `recovery/stopped-base-update.ts`, `IncidentLedger`, `work.ts`, `state-parts.ts`, `notifications.ts`, `scheduled-work.ts`, `delivery-repairs.ts`, `scheduler.ts`, `owned-artifact.ts`, `artifact`, `engine.ts`, `workKey`, `checkpoint-completion.ts`, `observe-github-merges.ts`, `write-credential-scope.ts`, `record-push.ts`, `holdReason`, `continue-access-only-plan.ts`, `QuestionNotifications`, `intent.ts`, `restart-writer.ts`, `quota-governor.ts`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **What connects `RFC-9562` to the rest of the system?**
  _1 weakly-connected nodes found - possible missing edges._
- **Should `run-model.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.03753518923991242 - nodes in this community are weakly interconnected._
- **Why does `command()` connect `process.ts` to `worker-runtime.ts`, `features/workflow.ts`, `IncidentLedger`, `link-draft-issue.ts`, `incidents/routes.ts`, `notifications.ts`, `coordination.ts`, `offices.ts`, `delivery-repairs.ts`, `deploy-plan.ts`, `scheduler.ts`, `artifact`, `engine.ts`, `sandbox-qualification.ts`, `command-registry.ts`, `delivery-retry.ts`, `jira-time.ts`, `ref_node_path`, `checkpoint-completion.ts`, `conversations/slack.ts`, `cec.ts`, `reader.ts`, `digest`, `identity-runtime.ts`, `record-push.ts`, `holdReason`, `Coordinator`, `launch.mjs`, `continue-access-only-plan.ts`, `accessibility-sources.ts`, `.save`, `release-manifest.ts`, `Offices`, `intent.ts`, `project-bindings.ts`, `restart-writer.ts`, `weekly-rollup.ts`, `quota-governor.ts`, `deploy.ts`, `cost-ledger.ts`, `service-health.ts`, `OfficeProject`, `requests.ts`, `agents.ts`, `session-bridge.ts`, `github-delivery.ts`, `remove-candidate.ts`, `maintenance/maintenance.ts`, `provider-observation.ts`, `ticket-evidence.ts`, `jiraBinding`, `pilot-delivery.ts`, `call-scope.ts`, `jira-attempts.ts`, `continue-ownership-read.ts`, `controller-runtime.ts`, `harnessEffect`, `brain-maintenance.ts`, `Store`, `.getEffect`, `deploy-command.ts`, `Ticket`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Should `Role` be split into smaller, more focused modules?**
  _Cohesion score 0.11884057971014493 - nodes in this community are weakly interconnected._
- **Why does `TicketJob` connect `github-delivery.ts` to `recovery/stopped-base-update.ts`, `MaintenanceRun`, `cx`, `link-draft-issue.ts`, `work.ts`, `scheduled-work.ts`, `delivery-repairs.ts`, `shared.ts`, `request.ts`, `scheduled-captures.ts`, `scheduler.ts`, `record-trigger.ts`, `artifact`, `delivery-retry.ts`, `workKey`, `ref_node_path`, `conversations/slack.ts`, `advance-metadata-park.ts`, `observe-github-merges.ts`, `digest`, `record-push.ts`, `holdReason`, `restart-writer.ts`, `alert-issue.ts`, `dependency-bots/adopt.ts`, `fact-bounds.ts`, `TicketTimeline.tsx`, `ref_node_crypto`, `App.tsx`, `requests.ts`, `remove-candidate.ts`, `stopped-record.ts`, `sanitize`, `superseded-wiki-pr.ts`, `assignment-poll.ts`, `enrollment-gate.ts`, `call-scope.ts`, `harnessEffect`, `OfficeSnapshot`, `Store`, `retrospective-subject.ts`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Should `worker-runtime.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.057902973395931145 - nodes in this community are weakly interconnected._