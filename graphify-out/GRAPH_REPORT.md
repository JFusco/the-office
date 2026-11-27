# Graph Report - the-office  (2026-11-27)

## Corpus Check
- 1367 files · ~621,991 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 7730 nodes · 32709 edges · 181 communities (171 shown, 10 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 1099 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `44eec90c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- resume-arrivals.ts
- OrgChart.tsx
- worker-runtime.ts
- features.ts
- InspectorContent.tsx
- github-delivery.ts
- budget-ledger.ts
- index.tsx
- incidents/routes.ts
- TelemetryPanel.tsx
- pilot-delivery.ts
- overseer/commands.ts
- App.tsx
- admit-improvement.ts
- request.ts
- scheduled-captures.ts
- run-retrospective.ts
- record-trigger.ts
- route-activation.ts
- worker-sandbox-run.ts
- activation-recovery.ts
- overseer-launch.mjs
- cec-reads.ts
- jira-time.ts
- GitHubIssuePublisher
- github.ts
- controller-runtime.ts
- fact-bounds.ts
- advance-metadata-park.ts
- work-summary.ts
- digest
- delivery-authority.ts
- corroborate.ts
- run.ts
- installation-token.ts
- common.cjs
- scheduled-work.ts
- routing.cjs
- currentAssignment
- lesson-selection.ts
- knowledge.ts
- time-scope.ts
- knowledge/routes.ts
- .emit
- Offices
- harness-baseline.ts
- credential-spans.ts
- github-calls.ts
- rollback.ts
- index.ts
- FeatureWorkspace.tsx
- Ticket
- investigations/ledger.ts
- state-parts.ts
- effects.ts
- app-config.ts
- pass.ts
- runner-state.ts
- sandbox-qualification.ts
- ref_node_crypto
- cost-ledger.ts
- assignments.ts
- brain-maintenance.ts
- Button
- constellation-runtime.ts
- validate_pr_body.cjs
- audit-plan-candidates.cjs
- office-client.ts
- dispatch-resume.ts
- alert-issue.ts
- cx
- spawn-command.ts
- session-context-file.ts
- ref_zod
- session-scope.ts
- service-health.ts
- project-bindings.ts
- closeout-recovery.ts
- incidents.ts
- agents.ts
- session-bridge.ts
- Coordinator
- metadata-park-words.ts
- remove-candidate.ts
- viewer.js
- maintenance/maintenance.ts
- stopped-record.ts
- sanitize
- superseded-wiki-pr.ts
- publish-refresh.cjs
- provider-observation.ts
- ticket-evidence.ts
- session-context-client.ts
- plans.cjs
- assignment-poll.ts
- capture-session-clone.py
- continue-ownership-read.ts
- deployed-fixes.ts
- ticket-stage-runner.ts
- archive-plan.cjs
- call-scope.ts
- jira-attempts.ts
- ref_node_path
- on-merge-sync.cjs
- backup-stores.ts
- extract-worker.mjs
- deploy.ts
- harnessEffect
- work.ts
- pr-observation-graphql.ts
- blocker-followups.ts
- follow-production.ts
- outbox.ts
- Goals.tsx
- slack-supersession.ts
- run-accounting.ts
- qa.ts
- qa-plan-continuation.ts
- writer-restart.ts
- control-store.ts
- run-directories.ts
- reconcileGitHubWrite
- daily-cto.ts
- deploy-command.ts
- refresh-issue-state.cjs
- .getEffect
- knowledge-views.ts
- sign-in-unpark.ts
- it-specialist.ts
- retrospective-subject.ts
- pre-push-boundary.ts
- ServiceHealthPanel.tsx
- http/commands.ts
- restart-writer.ts
- weekly-rollup.ts
- accessibility-sources.ts
- node-visuals.ts
- checkpoint-completion.ts
- MaintenanceRun
- OfficeSnapshot
- GitHubDelivery
- check.cjs
- Store
- production.ts
- ref_node_child_process
- bareSpans
- holdReason
- process.ts
- runner-root.ts
- resume-control.ts
- repoRoot
- coordination.ts
- record-runner-failure.ts
- json-layers.ts
- DeploymentFence
- recorded-gh-command.ts
- carried-checks.ts
- notifications.ts
- ForwardingState
- routing.js
- push-credentials.ts
- createConstellation
- .step
- bare-value.ts
- telemetry/report.ts
- proof-comment.ts
- launch.mjs
- deploy-journal.ts
- incident-command.ts
- checkpoint-retry.ts
- preferences-store.ts
- deploy-plan.ts
- GitHubOperations
- retire-history.ts
- seeded-office-lessons.ts
- build-overseer-launcher.mjs
- unblock-brief.ts
- office-qa-handoff.ts
- ProjectProgress
- write-boundary.ts
- session-snapshot-cleanup.ts

## God Nodes (most connected - your core abstractions)
1. `Store` - 478 edges
2. `TicketJob` - 233 edges
3. `digest()` - 175 edges
4. `command()` - 158 edges
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

## Communities (181 total, 10 thin omitted)

### Community 0 - "resume-arrivals.ts"
Cohesion: 0.05
Nodes (70): sourceVersions(), invalidateDismissals(), eventId(), PacketInput, absent(), IncidentChange, IncidentLedger, isOpen() (+62 more)

### Community 1 - "OrgChart.tsx"
Cohesion: 0.07
Nodes (56): label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+48 more)

### Community 2 - "worker-runtime.ts"
Cohesion: 0.05
Nodes (53): itChatPrompt(), candidateWorkspaceEnvironment(), assignmentDiagnostics(), diagnosticContext(), assignmentSubject(), lessonPurpose(), catalogLine(), assertBriefingScope() (+45 more)

### Community 3 - "features.ts"
Cohesion: 0.05
Nodes (121): approveFeature(), commandFeature(), featureById(), mutation(), reviewQuestions(), assertFeatureDependencyOrder(), featureDependencyEdges(), key() (+113 more)

### Community 4 - "InspectorContent.tsx"
Cohesion: 0.08
Nodes (89): Conversation(), Outbox(), labels, ServiceHealthRow(), BlockerFollowups(), LearningCoverage(), lessonsView(), LessonsPanel() (+81 more)

### Community 5 - "github-delivery.ts"
Cohesion: 0.04
Nodes (139): containedFile(), writerRestartInstruction(), removeAdoptedClone(), findingsBlock(), namedRepairIds(), metadataCarriedAdvisoryIds(), ownedBefore(), QA_STAGES (+131 more)

### Community 6 - "budget-ledger.ts"
Cohesion: 0.06
Nodes (55): abandonExpired(), Admission, admit(), admitDeployment(), balance(), bindEvidence(), count(), errcode() (+47 more)

### Community 7 - "index.tsx"
Cohesion: 0.15
Nodes (34): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS, PickupForm(), ProjectForms() (+26 more)

### Community 8 - "incidents/routes.ts"
Cohesion: 0.06
Nodes (54): citationFault(), CitationSchema, ClaimedRange, ResolvedRange, SourceVersions, dismiss(), DISMISSAL_CITATIONS, DISMISSAL_REASON (+46 more)

### Community 9 - "TelemetryPanel.tsx"
Cohesion: 0.10
Nodes (39): TelemetryReport, LiveAnchor, AzureBuild, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens() (+31 more)

### Community 10 - "pilot-delivery.ts"
Cohesion: 0.13
Nodes (30): continueImplementation(), dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), startPilot(), OfficeQAHandoffInput, eligibility() (+22 more)

### Community 11 - "overseer/commands.ts"
Cohesion: 0.06
Nodes (53): reconcile(), guardPresent(), overseerCommand(), reconcileArgs(), resolveCliRoot(), runnerStatus(), DEFAULT_OFFICE_URL, officeUrl() (+45 more)

### Community 12 - "App.tsx"
Cohesion: 0.06
Nodes (56): createConversationDrafts(), BrainDrawer(), themeColor, App(), BrainWorkspace, CONNECTION, CONNECTION_DOT, dockItemVariants (+48 more)

### Community 13 - "admit-improvement.ts"
Cohesion: 0.17
Nodes (19): writerRefused(), writerSuccessor(), admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey() (+11 more)

### Community 14 - "request.ts"
Cohesion: 0.09
Nodes (58): MISSING_NATIVE_LINK, REBASE, rebaseArgs(), rebaseComment(), adoptionFor(), belongsTo(), matchesRedo(), prefix() (+50 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.13
Nodes (52): accounting, DeliverySubject, nonDelivery, originalReads, createFeature(), assertEnrollable(), enrolled(), assessmentSignal() (+44 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.11
Nodes (37): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, BlockingTrigger, blockingTrigger(), isBlocking() (+29 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.11
Nodes (38): baselined(), baselineLearning(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences(), clip(), maintenanceBlockedId() (+30 more)

### Community 18 - "route-activation.ts"
Cohesion: 0.08
Nodes (51): harnessMergeAttempted(), mergeEffects(), officeMerge(), ActiveEntry, GitHubAppConfig, RouteEntry, githubIdentity(), appSelected() (+43 more)

### Community 19 - "worker-sandbox-run.ts"
Cohesion: 0.09
Nodes (49): RunDirectories, ValidatedRunnerPaths, matchesPolicy(), profileEligibility(), checkKind(), checkPolicyDirectories(), checkPolicyInputs(), code() (+41 more)

### Community 20 - "activation-recovery.ts"
Cohesion: 0.10
Nodes (41): PrerequisitesSchema, SourceClosed, classifyStop(), stopReason(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration() (+33 more)

### Community 21 - "overseer-launch.mjs"
Cohesion: 0.07
Nodes (80): acquireLauncherLock(), alone(), ancestry(), assertDirectoryOrAbsent(), attemptRecord(), bounded(), boundedString(), checkOwnedFile() (+72 more)

### Community 22 - "cec-reads.ts"
Cohesion: 0.09
Nodes (34): intakeMembership(), cecReadbackPrompt(), cecTransitionPrompt(), plainResume(), readbackDispatchGuidance(), capacityInterruptedRun(), providerSaid(), rerunsInterruptedQA() (+26 more)

### Community 23 - "jira-time.ts"
Cohesion: 0.09
Nodes (38): unresolvedAttempts(), bindingOf(), connectWith(), data(), envelope(), finishVerifiedEffects(), JiraWorklogs, locks (+30 more)

### Community 24 - "GitHubIssuePublisher"
Cohesion: 0.28
Nodes (3): GitHubIssuePublisher, number(), same()

### Community 25 - "github.ts"
Cohesion: 0.10
Nodes (32): boardReadFailure(), withGitHubOperation(), GitHubMonitor, githubPRDescription(), closingDirectives(), ObservedPR, enumValue(), fail() (+24 more)

### Community 26 - "controller-runtime.ts"
Cohesion: 0.12
Nodes (17): [cmd,...rawArgs], file, project, root, projectData(), StoreDatabase, controllerEffects(), alive() (+9 more)

### Community 27 - "fact-bounds.ts"
Cohesion: 0.25
Nodes (15): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+7 more)

### Community 28 - "advance-metadata-park.ts"
Cohesion: 0.08
Nodes (71): ProjectCard, advanceMetadataPark(), Parked, releaseWords(), sentAnything(), cardResumeRoute(), effectiveParkPickup(), PICKUP_ASSIGNEE (+63 more)

### Community 29 - "work-summary.ts"
Cohesion: 0.09
Nodes (41): jiraQueueProgress(), nextStage(), deliveryRoles, JiraQueueProgress, TicketProgress, STAGE_LABELS, STAGE_ROLE, deliveryRepairProjection() (+33 more)

### Community 30 - "digest"
Cohesion: 0.07
Nodes (81): retryRead(), createdContentSha256(), Binding, historyBeforeWrite(), matchesBoundDescription(), DescriptionEdit, DescriptionHistory, DescriptionHistoryUnavailable (+73 more)

### Community 31 - "delivery-authority.ts"
Cohesion: 0.06
Nodes (64): deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, requireDeliveryAuthority(), gateRegisteredDelivery(), resolveDeliveryWork(), pinCourierIdentityRefusal() (+56 more)

### Community 32 - "corroborate.ts"
Cohesion: 0.04
Nodes (91): resolveRange(), Agreement, agreement(), anchor(), compare(), disposition(), factsKey(), file() (+83 more)

### Community 33 - "run.ts"
Cohesion: 0.11
Nodes (25): failureOutranks(), INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationEvidence(), investigationHeld(), INVOCATION_SOURCE_REFS, invocationSource(), sections (+17 more)

### Community 34 - "installation-token.ts"
Cohesion: 0.17
Nodes (14): appJwt(), base64url(), signingKey(), AppKeySource, API_VERSION, HttpsTransport, InstallationToken, InstallationTokens (+6 more)

### Community 35 - "common.cjs"
Cohesion: 0.18
Nodes (23): connections(), fs, main(), path, atomicWrite(), crypto, ensureInside(), { execFileSync } (+15 more)

### Community 36 - "scheduled-work.ts"
Cohesion: 0.06
Nodes (54): freshOwnershipRead(), settledSlackReadback(), slackRequestSettled(), deliverySlot(), closeoutRequestResolved(), Ownership, ownershipContext, refreshDeliveryOwnership() (+46 more)

### Community 37 - "routing.cjs"
Cohesion: 0.13
Nodes (26): main(), parseArgs(), usage(), adjacency(), edgeCost(), edgeKey(), edgeType(), EVIDENCE_TYPE_PRIORITY (+18 more)

### Community 38 - "currentAssignment"
Cohesion: 0.10
Nodes (34): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+26 more)

### Community 39 - "lesson-selection.ts"
Cohesion: 0.10
Nodes (31): LessonBrainAudit, LessonBrainOverlap, lessonForProject(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, LessonSelection (+23 more)

### Community 40 - "knowledge.ts"
Cohesion: 0.09
Nodes (27): BRAIN_SCOPE, retrospectivePrompt(), SUBJECT, Kind, RetrospectiveResult, RetrospectiveResultSchema, RollupResultSchema, Stage (+19 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.16
Nodes (25): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence(), CaptureContext (+17 more)

### Community 42 - "knowledge/routes.ts"
Cohesion: 0.10
Nodes (24): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, CommittedBrain (+16 more)

### Community 43 - ".emit"
Cohesion: 0.08
Nodes (63): enumerateIntakeList(), inPickupOrder(), Intake, text(), checkMail(), drainMail(), requestMail(), resolveBlockedTransition() (+55 more)

### Community 44 - "Offices"
Cohesion: 0.12
Nodes (5): servedOutbox(), QuestionNotifications, isNotice(), InFlightOperations, Offices

### Community 45 - "harness-baseline.ts"
Cohesion: 0.15
Nodes (22): BaselineReport, baselineReport(), BaselineSource, baselineText(), millions(), row(), share(), add() (+14 more)

### Community 46 - "credential-spans.ts"
Cohesion: 0.06
Nodes (39): AFTER_LABEL, BARE_CREDENTIAL, BARE_LABEL, BARE_UNIT, BARE_VALUE, CAMEL_START, CONTROL_ESCAPE, CREDENTIAL_NAME (+31 more)

### Community 47 - "github-calls.ts"
Cohesion: 0.10
Nodes (19): add(), addSource(), busiest(), CallLedger, Entry, sourceRows(), Sources, CallCounts (+11 more)

### Community 48 - "rollback.ts"
Cohesion: 0.10
Nodes (28): ControllerEffects, DEPLOY_PROJECT, DeployContext, DeployTimings, bootout(), bootstrap(), Execute, serviceLoaded() (+20 more)

### Community 49 - "index.ts"
Cohesion: 0.06
Nodes (51): implementationContinuationRoute(), qaPlanRetryRoute(), readNotices(), close(), config, itSpecialist, loadedRevision, offices (+43 more)

### Community 50 - "FeatureWorkspace.tsx"
Cohesion: 0.11
Nodes (29): FeatureQuestionProjection, OutboxQuestionRound(), send(), FeatureDelivery(), FeatureDocuments(), views, FeatureReading(), FeatureWorkspace() (+21 more)

### Community 51 - "Ticket"
Cohesion: 0.08
Nodes (39): carriedNotRepeated(), changeScopeNote(), Scoped, CommentPage, commentReadback(), devUpdate(), HEADLINE, applyIntakeObservation() (+31 more)

### Community 52 - "investigations/ledger.ts"
Cohesion: 0.18
Nodes (19): acceptedCompletionResolution(), investigationCandidates(), investigationId(), ctoReplacementResolution(), finishedSubjectResolution(), investigationFollowUps(), implementationReplacementResolution(), interruptedQARerunResolution() (+11 more)

### Community 53 - "state-parts.ts"
Cohesion: 0.08
Nodes (28): readSavedState(), LARGE_KEY_CHARS, plain(), RedactedEntries, RedactedEntry, redactEntries(), joinParts(), PartRow (+20 more)

### Community 54 - "effects.ts"
Cohesion: 0.11
Nodes (17): Assignment, contentSchema(), JiraIssuePublisher, jiraText(), Transition, descriptionPreimage(), plain(), publicationDescription() (+9 more)

### Community 55 - "app-config.ts"
Cohesion: 0.24
Nodes (17): effectId(), entry(), fail(), KnownProject, only(), parseGitHubApp(), positive(), QualifyEntry (+9 more)

### Community 56 - "pass.ts"
Cohesion: 0.07
Nodes (55): Digest, Evidence, failureDigest(), FailureEvent, failureLine(), FailureReceipt, haltCondition(), HaltReport (+47 more)

### Community 57 - "runner-state.ts"
Cohesion: 0.14
Nodes (19): at, EMPTY_STATE, IncidentSample, IncidentSummary, InFlight, Intent, JournalIntent, PASS_OUTCOMES (+11 more)

### Community 58 - "sandbox-qualification.ts"
Cohesion: 0.06
Nodes (43): within(), ALLOW_PROBES, BatteryExpected, Binding, boundTo(), Cleanup, CLEANUP_PROBES, CleanupProbe (+35 more)

### Community 59 - "ref_node_crypto"
Cohesion: 0.09
Nodes (32): GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles(), ContinuationIO (+24 more)

### Community 60 - "cost-ledger.ts"
Cohesion: 0.11
Nodes (36): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress(), effectId() (+28 more)

### Community 61 - "assignments.ts"
Cohesion: 0.09
Nodes (27): clip(), DEMAND_LIMIT, demandFacts(), DemandSection, key(), LessonKey, notes(), withDemand() (+19 more)

### Community 62 - "brain-maintenance.ts"
Cohesion: 0.13
Nodes (18): maintenancePolicies(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, brainResultStop(), GateMark, gateMark(), MAX_START_RETRIES (+10 more)

### Community 63 - "Button"
Cohesion: 0.08
Nodes (50): guidanceExcerpt(), ChatMarkdown(), ChatMarkdown, MessageText(), Activity(), ActivityTimeline(), AssignmentKnowledge(), Lookup() (+42 more)

### Community 64 - "constellation-runtime.ts"
Cohesion: 0.15
Nodes (16): CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point, focusOverlayMotion(), FocusOverlayLayout (+8 more)

### Community 65 - "validate_pr_body.cjs"
Cohesion: 0.36
Nodes (8): fs, main(), readableText(), REQUIRED_CHECKS, REQUIRED_SECTIONS, sections(), validatePullRequestBody(), withoutComments()

### Community 66 - "audit-plan-candidates.cjs"
Cohesion: 0.14
Nodes (31): audit(), branchIssueNumbers(), classify(), distinctiveTitleWords(), { execFileSync }, extractPaths(), findPrForMergeSubject(), fmtCommit() (+23 more)

### Community 67 - "office-client.ts"
Cohesion: 0.09
Nodes (29): FailureAnswer, HaltAnswer, RUNNER_DEFAULTS, officeDataRoot, realMachine(), bodyWithin(), bounded(), Envelope (+21 more)

### Community 68 - "dispatch-resume.ts"
Cohesion: 0.11
Nodes (56): WRITER_STAGES, canonical(), assessResumes(), Standing, CheckpointEligibility, checkpointEligibility(), admitAssignmentResume(), admitCheckpointResume() (+48 more)

### Community 69 - "alert-issue.ts"
Cohesion: 0.17
Nodes (23): AlertIssue, alertIssueBody(), alertIssueTitle(), alertMarker(), closeAlertIssue(), ensureAlertIssue(), findAlertIssue(), Guard (+15 more)

### Community 70 - "cx"
Cohesion: 0.08
Nodes (60): displayAgentTask(), withoutElapsed(), CameraBookmark, restoreBookmark(), LiveAgentTask(), Props, RunningTask(), text() (+52 more)

### Community 71 - "spawn-command.ts"
Cohesion: 0.12
Nodes (25): childEnvironment(), exitFailure(), inactivityWatch(), At, Errno, errno(), GroupInventory, GroupProbe (+17 more)

### Community 72 - "session-context-file.ts"
Cohesion: 0.20
Nodes (14): ContextFoldPrefix, contextFoldPrefix(), SessionContextCheckpoint, captureSessionContextClone(), ContextReadPhase, SessionContextDeadline, sessionContextFile(), ContextReadChanged (+6 more)

### Community 73 - "ref_zod"
Cohesion: 0.07
Nodes (51): escaped(), IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), projectListScope(), AUTO_ADOPT_BOTS, assertFeaturePlanningConfig() (+43 more)

### Community 74 - "session-scope.ts"
Cohesion: 0.18
Nodes (17): Bound, claudeScopeParser(), claudeSessionScope(), CLAUDE_TRANSCRIPTS, CODEX_ROLLOUTS, contextReaders(), retainSessionMessage(), SessionConversation (+9 more)

### Community 75 - "service-health.ts"
Cohesion: 0.11
Nodes (24): quotaLow(), ClaudeLoginRefusal, claudeLoginRefusal(), claudeRefusalWords(), RECORDED_REFUSALS, refusedClaudeRow(), listenerHealth(), providers (+16 more)

### Community 76 - "project-bindings.ts"
Cohesion: 0.08
Nodes (45): buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs(), fullActivePRs(), observation(), PRRead (+37 more)

### Community 77 - "closeout-recovery.ts"
Cohesion: 0.11
Nodes (43): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+35 more)

### Community 78 - "incidents.ts"
Cohesion: 0.08
Nodes (50): attributedRecords(), foldsItsRun(), groupCandidates(), ObservedIncident, ObservedSubject, digest(), fingerprint(), incidentId() (+42 more)

### Community 79 - "agents.ts"
Cohesion: 0.05
Nodes (61): implementationWorkerContext(), movedHeadNote(), cecPrompt(), cecIntakePrompt(), cecReconcilePrompt(), resolvedDecisionNote(), stageInstructions, stageInstructionsFor() (+53 more)

### Community 80 - "session-bridge.ts"
Cohesion: 0.10
Nodes (30): claudeSessionContext(), codexDaemonProcesses(), accountCodexProcesses(), CodexProcessInventory, codexProcessInventory(), DesktopSessions, unaccountedProcesses(), codexSessionContext() (+22 more)

### Community 82 - "metadata-park-words.ts"
Cohesion: 0.42
Nodes (9): field(), FIELDS, MetadataField, metadataFields(), metadataParkWords(), metadataStopWords(), needed(), sentence() (+1 more)

### Community 83 - "remove-candidate.ts"
Cohesion: 0.14
Nodes (23): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), maintenanceCandidate(), moveAside(), moveBack(), purgeRemoved(), purging (+15 more)

### Community 84 - "viewer.js"
Cohesion: 0.19
Nodes (25): addMetaLink(), addMetaRow(), addRelationship(), applyView(), buildIndexes(), buildLegend(), buildModel(), buildRenderer() (+17 more)

### Community 85 - "maintenance/maintenance.ts"
Cohesion: 0.13
Nodes (18): sourceFindings, sourceReview(), candidateOwner(), SETTLED, skipOwnedCandidate(), Skipped, skippedCandidateLedger(), CmsFollowUpContext (+10 more)

### Community 86 - "stopped-record.ts"
Cohesion: 0.08
Nodes (58): boundedEvidence(), expectedWait(), StopFacts, FailedMailCheck, lastFailedMailCheck(), lastMailCheckOutcome(), MailCheckOutcome, normalizeCause() (+50 more)

### Community 87 - "sanitize"
Cohesion: 0.05
Nodes (65): assertConversationReadback(), Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff(), saveGoals() (+57 more)

### Community 88 - "superseded-wiki-pr.ts"
Cohesion: 0.11
Nodes (51): abandon(), assertOpenSnapshot(), awaitingContainment(), closeIssue(), CloseRevalidationError, closeSuperseded(), comment(), CommentStep (+43 more)

### Community 89 - "publish-refresh.cjs"
Cohesion: 0.12
Nodes (20): changedPaths(), { execFileSync }, files, isMapInput(), mapOnly(), { execFileSync }, git(), publish() (+12 more)

### Community 90 - "provider-observation.ts"
Cohesion: 0.12
Nodes (28): az(), correlatedBuild(), Azure, azurePipelines(), outcome(), Read, RUNS_PER_PIPELINE, Api (+20 more)

### Community 91 - "ticket-evidence.ts"
Cohesion: 0.11
Nodes (31): assetDownloader(), attachmentKind(), evidenceDirectory(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS, EvidenceAttachment (+23 more)

### Community 92 - "session-context-client.ts"
Cohesion: 0.13
Nodes (18): readTranscript, readRollout, packContextFailure(), PackedContextFailure, unpackContextFailure(), LiveSession, ContextThread, contextThread() (+10 more)

### Community 93 - "plans.cjs"
Cohesion: 0.20
Nodes (18): walk(), association(), auditedDigests(), candidate(), collapseByTitle(), discover(), fromMarkdown(), fs (+10 more)

### Community 94 - "assignment-poll.ts"
Cohesion: 0.05
Nodes (69): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), currentOutbox(), BLOCK, harnessBlockMove(), harnessParkedCard(), noted() (+61 more)

### Community 96 - "continue-ownership-read.ts"
Cohesion: 0.20
Nodes (15): consumeQAPlanRetry(), continueOwnershipRead(), expiredOwnershipRead(), handoffOwnership(), ReadbackOwnerDecision, ownershipReadGate(), ownershipReadState(), ownershipReadSource() (+7 more)

### Community 97 - "deployed-fixes.ts"
Cohesion: 0.21
Nodes (21): inHistoryOf(), CompareMemory, compareMemory(), COMPARES_PER_PASS, comparison(), DeployedFixes, DeployedFixesInput, recordDeployedFixes() (+13 more)

### Community 98 - "ticket-stage-runner.ts"
Cohesion: 0.08
Nodes (57): applyChangeScope(), endChangeScope(), levels(), MAX_CHECKS, owedUnderScope(), scopeBase(), scopeOutgrown(), settled() (+49 more)

### Community 99 - "archive-plan.cjs"
Cohesion: 0.12
Nodes (31): fs, main(), parse(), path, archive(), cell(), ensureIndex(), fromArgs() (+23 more)

### Community 100 - "call-scope.ts"
Cohesion: 0.08
Nodes (45): failed(), githubAuthError(), graphqlCounts(), noCalls(), refusedByRateLimit(), revalidated, slurpedPages(), succeeded() (+37 more)

### Community 101 - "jira-attempts.ts"
Cohesion: 0.10
Nodes (27): attempted(), attemptState(), bound(), covers(), JiraAttempt, jiraAttempts(), JiraAttemptState, open() (+19 more)

### Community 102 - "ref_node_path"
Cohesion: 0.05
Nodes (79): OwnershipRead, interruptedImplementation(), closedReadonlyPlan(), Document, document(), continueUnsealedQA(), entry(), entryExists() (+71 more)

### Community 103 - "on-merge-sync.cjs"
Cohesion: 0.21
Nodes (23): slugify(), splitFrontmatter(), closingIssues(), githubRefs(), normalizeGithubQuery(), normalizeRepository(), parseGithubQuery(), ref() (+15 more)

### Community 104 - "backup-stores.ts"
Cohesion: 0.10
Nodes (36): absentAdmission(), AdmissionComparison, AdmissionSnapshot, compareAdmissions(), snapshotAdmissions(), BackupEntry, BackupInput, BackupInventory (+28 more)

### Community 105 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 106 - "deploy.ts"
Cohesion: 0.15
Nodes (27): Body, DeploymentFenceState, fenceTokenDigest(), ActiveRelease, readActiveRelease(), abandon(), advance(), operationPaths() (+19 more)

### Community 107 - "harnessEffect"
Cohesion: 0.10
Nodes (55): effectKey(), LaneOperation, laneWrite(), moveCardOnce(), Lane, MOVABLE, moveLane(), resolveLane() (+47 more)

### Community 108 - "work.ts"
Cohesion: 0.06
Nodes (47): Admission, boundaryCrossed(), Crossing, Progress, CheckpointProgress, checkpointProgress(), names(), nativeProof() (+39 more)

### Community 109 - "pr-observation-graphql.ts"
Cohesion: 0.13
Nodes (29): ChildRequest, headCheckRuns(), includeBody(), readOpenPRs(), commitOf(), ConnectionPages, embeddedHead(), fail() (+21 more)

### Community 110 - "blocker-followups.ts"
Cohesion: 0.10
Nodes (51): conversationReadbackReady(), followupOf(), pendingReadback(), queueConversationReadback(), readbackEnding(), uncertainConversations(), conversationResolved(), readBackConversations() (+43 more)

### Community 111 - "follow-production.ts"
Cohesion: 0.20
Nodes (17): awaitingJiraStatus(), awaitingProduction(), FOLLOW_DAYS, followed(), isFollowed(), Azure, AzureRead, containedIn() (+9 more)

### Community 112 - "outbox.ts"
Cohesion: 0.18
Nodes (17): capabilityBlockedReviews(), latestReviews(), metadataParkAction(), ADOPTION_STALLED_MS, projectOutbox(), item(), syncOutbox(), ownerStepItems() (+9 more)

### Community 113 - "Goals.tsx"
Cohesion: 0.11
Nodes (26): GoalProgress, LessonsView(), CTOReview(), goalState, DailyCTO(), GoalHistory(), load(), reportDate() (+18 more)

### Community 114 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 115 - "run-accounting.ts"
Cohesion: 0.06
Nodes (60): BoundedRead, add(), CodexRequest, CodexRollout, CodexTokens, FIELDS, codexHome(), createdAt() (+52 more)

### Community 119 - "control-store.ts"
Cohesion: 0.22
Nodes (7): applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, statementCache(), initialSnapshot(), initializeStoreSchema()

### Community 120 - "run-directories.ts"
Cohesion: 0.16
Nodes (20): assertOwnedDirectory(), checkRunDirectories(), Child, CHILDREN, code(), createRunDirectories(), DIRECTORY_MODES, DirectoryFacts (+12 more)

### Community 121 - "reconcileGitHubWrite"
Cohesion: 0.18
Nodes (21): officeMergeProvenance(), reconcileMergeScannerRetry(), Retry, retryMergeScanner(), retryReadBack(), runIdentity(), savedRetry(), transientScannerJobs() (+13 more)

### Community 122 - "daily-cto.ts"
Cohesion: 0.07
Nodes (34): currentCitations(), Fact, NOT_CURRENT, PROVIDER_ERROR, DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt() (+26 more)

### Community 123 - "deploy-command.ts"
Cohesion: 0.10
Nodes (45): CONTROLLER_ENTRY, ControllerPin, Pin, pinnedController(), readControllerPin(), writeControllerPin(), controllerOf(), deployCommand() (+37 more)

### Community 124 - "refresh-issue-state.cjs"
Cohesion: 0.23
Nodes (12): advanceFence(), key(), { execFileSync }, fs, issueRefs(), main(), markClosed(), openThreadLineIndexes() (+4 more)

### Community 125 - ".getEffect"
Cohesion: 0.08
Nodes (27): MergeNotifications, comparableSlackText(), labelIsUrl(), SlackMessages, SlackRequestSchema, SlackResultSchema, SlackVerificationSchema, settleNotLanded() (+19 more)

### Community 126 - "knowledge-views.ts"
Cohesion: 0.19
Nodes (16): KnowledgeActivity, KnowledgeEdge, KnowledgeMap, KnowledgeNode, connectionSummary(), ConstellationView, DisplayNode, displayScene() (+8 more)

### Community 127 - "sign-in-unpark.ts"
Cohesion: 0.15
Nodes (22): parksInJira(), currentEnvironmentWait(), environmentWait(), hasPendingDelivery(), resumeAfterSignIn(), signInWait(), isSetupStop(), MAX_SIGN_IN_UNPARKS (+14 more)

### Community 128 - "it-specialist.ts"
Cohesion: 0.15
Nodes (20): replacedReadback(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), heldFor(), ITContext, recoveryHeld() (+12 more)

### Community 129 - "retrospective-subject.ts"
Cohesion: 0.13
Nodes (19): deliveryMetrics(), median(), ARTIFACT_LIMIT, clip(), LEDGER_STEPS, MAINTENANCE_LIMIT, maintenanceFacts(), maintenanceSubject() (+11 more)

### Community 130 - "pre-push-boundary.ts"
Cohesion: 0.26
Nodes (10): Event, exactCommand(), Invocation, localHookCommand(), one(), prePushRejection(), PushIdentity, retirementBoundary() (+2 more)

### Community 131 - "ServiceHealthPanel.tsx"
Cohesion: 0.12
Nodes (24): OwnerStepItem, followUpPicture(), publishITReport(), DailyCTOSummary, OwnerSteps, OutboxOwnerSteps(), blockedSummary(), itAgent() (+16 more)

### Community 132 - "http/commands.ts"
Cohesion: 0.15
Nodes (22): configureNotices(), DiscoveryResumeInput, requeueWaitedImplement(), enqueueMetadataRecovery(), normalizeStatement(), configureKnowledge(), declineLessonIssue(), reactivateLesson() (+14 more)

### Community 133 - "restart-writer.ts"
Cohesion: 0.19
Nodes (17): ATTEMPT_DELAYS_MS, nextAttemptAt(), restartStoppedWriters(), unchangedSinceAccepted(), NOT_RETRYABLE, releaseFunds(), StoppedWriter, WriterRestartCandidate (+9 more)

### Community 134 - "weekly-rollup.ts"
Cohesion: 0.15
Nodes (23): learningMetrics(), RollupResult, harperFolder(), RETROSPECTIVE_TIMEOUT, lastFriday(), ROLLUP_HISTORY, rollupDue(), RollupHooks (+15 more)

### Community 135 - "accessibility-sources.ts"
Cohesion: 0.23
Nodes (18): accessibilitySources(), actionable(), closingPull(), Finding, handoffIssue(), issueLines(), issueSource(), observation (+10 more)

### Community 136 - "node-visuals.ts"
Cohesion: 0.20
Nodes (14): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+6 more)

### Community 137 - "checkpoint-completion.ts"
Cohesion: 0.24
Nodes (9): BrainStatusSchema, brainCheckpointCompletion(), coverageSchema, verified, publishedWorkCleanedUp(), nativeChecks, outcomeKnown(), reconcileCompletedCheckpoints() (+1 more)

### Community 138 - "MaintenanceRun"
Cohesion: 0.22
Nodes (14): checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), repeatedVendorReviewBlock(), stoppedInVendorReview(), leftToNextRun(), NEXT_RUN_DUE_MS, night() (+6 more)

### Community 139 - "OfficeSnapshot"
Cohesion: 0.05
Nodes (62): ConversationDraft, LessonDecisionAction, lessonDecisionState(), readLessonDecision(), DAYS, dueLessonDecisions(), easternWeek(), isLessonDecision() (+54 more)

### Community 140 - "GitHubDelivery"
Cohesion: 0.09
Nodes (21): StageContext, GitHubDelivery, adoptCandidate(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext() (+13 more)

### Community 141 - "check.cjs"
Cohesion: 0.22
Nodes (15): fs, main(), path, { spawnSync }, digest(), fieldSpan(), frontmatterProblems(), keyPattern() (+7 more)

### Community 142 - "Store"
Cohesion: 0.04
Nodes (61): featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), wakeFeature(), recoverFeatures(), observeHelperGroups(), stopReview(), diagnosticSnapshot() (+53 more)

### Community 144 - "ref_node_child_process"
Cohesion: 0.13
Nodes (19): { execFileSync }, hasCanonicalWikiBody(), maintenanceBodies, matchesMaintenanceBody(), { readFileSync }, collectPulls(), copyWikiForDryRun(), { execFileSync } (+11 more)

### Community 145 - "bareSpans"
Cohesion: 0.19
Nodes (15): apostropheEnd(), bareSpans(), credentialSpans(), genuineGap(), headerValueEnd(), isQueryLabel(), labelBefore(), nameEnd() (+7 more)

### Community 146 - "holdReason"
Cohesion: 0.04
Nodes (147): ownershipReadHistory(), stoppedWriter(), deliveryIntakeBlocker(), boardPreflightCandidate(), Ownership, partialLocalCleanupCandidate(), savedActivationFailure(), assertContinuationWorker() (+139 more)

### Community 147 - "process.ts"
Cohesion: 0.04
Nodes (30): AzureMonitor, candidateBranchMoved(), Document, document(), isAccessOnlyPlan(), settledAccessOnlyState(), continueAccessOnlyPlan(), entryExists() (+22 more)

### Community 148 - "runner-root.ts"
Cohesion: 0.14
Nodes (27): LOOPBACK, privateDirectories(), RunnerPaths, runnerPaths(), ancestry(), assertDirectoryOrAbsent(), checkDatabaseFiles(), CHECKOUT (+19 more)

### Community 149 - "resume-control.ts"
Cohesion: 0.29
Nodes (7): absent(), NEVER_ENABLED, ResumeControl, stated(), Stored, unreadable(), ResumeSwitch

### Community 150 - "repoRoot"
Cohesion: 0.13
Nodes (18): fs, main(), parse(), path, repoRoot(), substantive(), main(), path (+10 more)

### Community 151 - "coordination.ts"
Cohesion: 0.10
Nodes (36): reconcileNoticeConfirmations(), admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, compatible(), dependencyCompletionKey(), dependencyEligibility() (+28 more)

### Community 152 - "record-runner-failure.ts"
Cohesion: 0.10
Nodes (29): incidentNotices(), NOTICE_KINDS, STATUS, classify(), isRestoration(), KEY, newer(), record() (+21 more)

### Community 153 - "json-layers.ts"
Cohesion: 0.26
Nodes (9): decode(), decodedIndex(), evenRunBefore(), JsonLayers, LayerString, opensValue(), SIMPLE, strings() (+1 more)

### Community 154 - "DeploymentFence"
Cohesion: 0.33
Nodes (4): assertToken(), DeploymentFence, DeploymentFenceGateContext, DeploymentFenceRouteContext

### Community 155 - "recorded-gh-command.ts"
Cohesion: 0.19
Nodes (20): assignments(), changeDirectory(), closing(), CREATE, createGuard(), flags(), named(), read() (+12 more)

### Community 156 - "carried-checks.ts"
Cohesion: 0.16
Nodes (21): latestQA(), notPassedInLatestQA(), QACoverage, qaCoverage(), same(), Tested, safeWebUrl(), officeValidation() (+13 more)

### Community 157 - "notifications.ts"
Cohesion: 0.11
Nodes (32): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), clearCooldown(), coolDown(), coolingDown() (+24 more)

### Community 160 - "push-credentials.ts"
Cohesion: 0.18
Nodes (15): KeychainKeySource, Execute, keychainKeySource(), assertPushCredential(), Execute, assertBoundPushDestination(), digest(), Execute (+7 more)

### Community 161 - "createConstellation"
Cohesion: 0.18
Nodes (5): ConstellationRuntime, createConstellation(), enter(), finishTap(), move()

### Community 162 - ".step"
Cohesion: 0.06
Nodes (70): notOwned(), reviewInstructions(), deliveryTask(), DeliveryTaskInput, mergedByOwner(), observe(), mergedByOfficeBot(), closeableIssue() (+62 more)

### Community 163 - "bare-value.ts"
Cohesion: 0.30
Nodes (11): BareValue, bareValue(), deeperValueEnd(), ENDS, isSeparator(), plainEscape(), queryValue(), separatorEscapeAt() (+3 more)

### Community 164 - "telemetry/report.ts"
Cohesion: 0.22
Nodes (15): TelemetryRow, TelemetrySync, Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount() (+7 more)

### Community 165 - "proof-comment.ts"
Cohesion: 0.38
Nodes (12): commentId(), CommentIntent, CommentReceipt, conversation(), exact(), findProofComment(), matchesProofComment(), postProofComment() (+4 more)

### Community 166 - "launch.mjs"
Cohesion: 0.06
Nodes (97): RFC-9562, CHECKOUT, DEFAULT_DEADLINE_MS, existingPlist(), installOverseer(), LABEL, LAUNCHER_SOURCE, renderPlist() (+89 more)

### Community 167 - "deploy-journal.ts"
Cohesion: 0.24
Nodes (11): append(), assertNext(), DeployJournalView, DeployStepState, Entry, Header, Id, recordDeployStep() (+3 more)

### Community 168 - "incident-command.ts"
Cohesion: 0.38
Nodes (6): FLAGS, incidentCommand(), IncidentCommandIO, option(), USAGE, whole()

### Community 169 - "checkpoint-retry.ts"
Cohesion: 0.31
Nodes (8): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), legacy, validateNativeContinuation(), Continuation

### Community 170 - "preferences-store.ts"
Cohesion: 0.21
Nodes (8): PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS, OfficePreferences

### Community 171 - "deploy-plan.ts"
Cohesion: 0.09
Nodes (44): runningRevision(), runningRevision(), ROOT, runtimeRevision(), PIN_ENTRY, pinCommand(), BUILD_ENV, buildRelease() (+36 more)

### Community 173 - "retire-history.ts"
Cohesion: 0.33
Nodes (7): readHistoryScope(), historicalRecordDigest(), Intent, records(), retireIncompleteHistory(), HistoryRetirement, HistoryRetirementIntent

### Community 174 - "seeded-office-lessons.ts"
Cohesion: 0.32
Nodes (5): CONSOLIDATED, CONSOLIDATED_AT, SEEDS, seedOfficeLessons(), SEEDS

### Community 175 - "build-overseer-launcher.mjs"
Cohesion: 0.20
Nodes (8): BANNER, builtin(), bundleLauncher(), LAUNCHER_BUNDLE, LAUNCHER_ENTRY, launcherChunk(), REPOSITORY, SCRIPT

### Community 176 - "unblock-brief.ts"
Cohesion: 0.53
Nodes (5): clearUnblockBrief(), key(), saveUnblockBrief(), UnblockBrief, unblockBrief()

### Community 177 - "office-qa-handoff.ts"
Cohesion: 0.60
Nodes (4): OfficeQAHandoff, OfficeQAHandoffInput, OfficeQAHandoffRequest, QAOwnershipProof

### Community 180 - "write-boundary.ts"
Cohesion: 0.08
Nodes (35): AMBIENT_TOKENS, appCredential(), ChildCredential, CREDENTIAL_TRACING, GIT_HELPER, operatorRollbackCredential(), PROMPTS, WriteCredential (+27 more)

### Community 183 - "session-snapshot-cleanup.ts"
Cohesion: 0.40
Nodes (5): SNAPSHOT_PREFIX, removeStaleSessionSnapshots(), SNAPSHOT_SWEEP_MS, STALE_SNAPSHOT_MS, sweepStaleSessionSnapshots()

## Knowledge Gaps
- **1 isolated node(s):** `RFC-9562`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 1330 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `resume-arrivals.ts`, `worker-runtime.ts`, `features.ts`, `github-delivery.ts`, `pilot-delivery.ts`, `admit-improvement.ts`, `request.ts`, `scheduled-captures.ts`, `run-retrospective.ts`, `record-trigger.ts`, `route-activation.ts`, `activation-recovery.ts`, `cec-reads.ts`, `jira-time.ts`, `GitHubIssuePublisher`, `github.ts`, `controller-runtime.ts`, `advance-metadata-park.ts`, `digest`, `delivery-authority.ts`, `run.ts`, `scheduled-work.ts`, `currentAssignment`, `lesson-selection.ts`, `time-scope.ts`, `knowledge/routes.ts`, `.emit`, `Offices`, `rollback.ts`, `index.ts`, `Ticket`, `investigations/ledger.ts`, `state-parts.ts`, `effects.ts`, `ref_node_crypto`, `cost-ledger.ts`, `assignments.ts`, `brain-maintenance.ts`, `dispatch-resume.ts`, `alert-issue.ts`, `project-bindings.ts`, `closeout-recovery.ts`, `agents.ts`, `session-bridge.ts`, `Coordinator`, `remove-candidate.ts`, `maintenance/maintenance.ts`, `stopped-record.ts`, `sanitize`, `superseded-wiki-pr.ts`, `provider-observation.ts`, `ticket-evidence.ts`, `assignment-poll.ts`, `continue-ownership-read.ts`, `ticket-stage-runner.ts`, `jira-attempts.ts`, `ref_node_path`, `harnessEffect`, `pr-observation-graphql.ts`, `blocker-followups.ts`, `follow-production.ts`, `run-accounting.ts`, `control-store.ts`, `reconcileGitHubWrite`, `daily-cto.ts`, `.getEffect`, `sign-in-unpark.ts`, `it-specialist.ts`, `retrospective-subject.ts`, `http/commands.ts`, `restart-writer.ts`, `weekly-rollup.ts`, `accessibility-sources.ts`, `checkpoint-completion.ts`, `OfficeSnapshot`, `GitHubDelivery`, `holdReason`, `process.ts`, `coordination.ts`, `notifications.ts`, `push-credentials.ts`, `.step`, `proof-comment.ts`, `checkpoint-retry.ts`, `GitHubOperations`, `retire-history.ts`, `ProjectProgress`, `write-boundary.ts`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **What connects `RFC-9562` to the rest of the system?**
  _1 weakly-connected nodes found - possible missing edges._
- **Should `resume-arrivals.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05339105339105339 - nodes in this community are weakly interconnected._
- **Why does `command()` connect `process.ts` to `resume-arrivals.ts`, `worker-runtime.ts`, `features.ts`, `restart-writer.ts`, `github-delivery.ts`, `accessibility-sources.ts`, `incidents/routes.ts`, `checkpoint-completion.ts`, `pilot-delivery.ts`, `GitHubDelivery`, `admit-improvement.ts`, `Store`, `holdReason`, `worker-sandbox-run.ts`, `coordination.ts`, `GitHubIssuePublisher`, `github.ts`, `record-runner-failure.ts`, `controller-runtime.ts`, `jira-time.ts`, `notifications.ts`, `digest`, `currentAssignment`, `knowledge/routes.ts`, `.emit`, `GitHubOperations`, `deploy-plan.ts`, `rollback.ts`, `ProjectProgress`, `Ticket`, `write-boundary.ts`, `effects.ts`, `ref_node_crypto`, `cost-ledger.ts`, `brain-maintenance.ts`, `service-health.ts`, `project-bindings.ts`, `closeout-recovery.ts`, `agents.ts`, `session-bridge.ts`, `Coordinator`, `remove-candidate.ts`, `maintenance/maintenance.ts`, `provider-observation.ts`, `ticket-evidence.ts`, `continue-ownership-read.ts`, `deployed-fixes.ts`, `ticket-stage-runner.ts`, `jira-attempts.ts`, `ref_node_path`, `harnessEffect`, `reconcileGitHubWrite`, `deploy-command.ts`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Should `OrgChart.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07033248081841433 - nodes in this community are weakly interconnected._
- **Why does `TicketJob` connect `github-delivery.ts` to `it-specialist.ts`, `retrospective-subject.ts`, `OrgChart.tsx`, `InspectorContent.tsx`, `restart-writer.ts`, `pilot-delivery.ts`, `MaintenanceRun`, `GitHubDelivery`, `request.ts`, `scheduled-captures.ts`, `Store`, `record-trigger.ts`, `route-activation.ts`, `holdReason`, `activation-recovery.ts`, `coordination.ts`, `fact-bounds.ts`, `advance-metadata-park.ts`, `notifications.ts`, `work-summary.ts`, `delivery-authority.ts`, `digest`, `.step`, `scheduled-work.ts`, `proof-comment.ts`, `currentAssignment`, `ProjectProgress`, `dispatch-resume.ts`, `alert-issue.ts`, `closeout-recovery.ts`, `remove-candidate.ts`, `stopped-record.ts`, `superseded-wiki-pr.ts`, `assignment-poll.ts`, `call-scope.ts`, `ref_node_path`, `harnessEffect`, `outbox.ts`, `reconcileGitHubWrite`, `.getEffect`, `sign-in-unpark.ts`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Should `worker-runtime.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05126452494873548 - nodes in this community are weakly interconnected._