# Graph Report - the-office  (2026-11-27)

## Corpus Check
- 1371 files · ~624,416 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 7770 nodes · 32789 edges · 183 communities (176 shown, 7 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 1102 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `93fee790`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- judge-resumes.ts
- Role
- agents.ts
- features/workflow.ts
- cx
- shared.ts
- budget-ledger.ts
- index.tsx
- incidents/routes.ts
- TelemetryPanel.tsx
- enrollment-gate.ts
- overseer/commands.ts
- App.tsx
- admit-improvement.ts
- request.ts
- scheduled-captures.ts
- run-retrospective.ts
- record-trigger.ts
- route-activation.ts
- sandbox-qualification.ts
- process.ts
- overseer-launch.mjs
- cec-reads.ts
- jira-time.ts
- holdReason
- accessibility-sources.ts
- controller-runtime.ts
- goal-reporting.ts
- advance-metadata-park.ts
- reader.ts
- digest
- ref_node_path
- triage.ts
- run.ts
- identity-runtime.ts
- common.cjs
- scheduled-work.ts
- routing.cjs
- entry.ts
- features.ts
- knowledge.ts
- time-scope.ts
- lesson-selection.ts
- .getEffect
- Offices
- harness-baseline.ts
- credential-spans.ts
- QuotaGovernor
- goal-reviews.ts
- index.ts
- QuestionStepper.tsx
- metadata-park-words.ts
- investigations/ledger.ts
- saved-state.ts
- JiraIssuePublisher
- app-config.ts
- pass.ts
- dependency-bots/adopt.ts
- api-routes.ts
- diagnostic-snapshot.ts
- cost-ledger.ts
- assignments.ts
- brain-maintenance.ts
- Button
- constellation-runtime.ts
- validate_pr_body.cjs
- audit-plan-candidates.cjs
- office-client.ts
- resume-arrivals.ts
- Conversation.tsx
- OfficeScene.tsx
- spawn-command.ts
- session-context-file.ts
- project-binding-blocks.ts
- session-scope.ts
- service-health.ts
- sanitize
- closeout-recovery.ts
- incidents.ts
- Ticket
- session-bridge.ts
- local-config.ts
- alert-issue.ts
- effect.ts
- viewer.js
- cec/workflow.ts
- stopped-record.ts
- conversations/conversations.ts
- superseded-wiki-pr.ts
- ref_node_child_process
- provider-observation.ts
- jiraBinding
- session-context-client.ts
- plans.cjs
- assignment-poll.ts
- capture-session-clone.py
- outbox.ts
- admit-repair-waits.ts
- pilot-delivery.ts
- archive-plan.cjs
- call-scope.ts
- jira-attempts.ts
- intent.ts
- on-merge-sync.cjs
- backup-stores.ts
- extract-worker.mjs
- deploy.ts
- harnessEffect
- work.ts
- pr-observation-graphql.ts
- blocker-followups.ts
- follow-production.ts
- project-policy.ts
- OfficeSnapshot
- slack-supersession.ts
- run-accounting.ts
- qa.ts
- qa-plan-continuation.ts
- writer-restart.ts
- store.ts
- projects.ts
- reconcileGitHubWrite
- daily-cto.ts
- deploy-command.ts
- refresh-issue-state.cjs
- .emit
- EffectIntent
- sign-in-unpark.ts
- it/context.ts
- restart-writer.ts
- draft-provenance.ts
- contracts/overseer.ts
- GitHubDelivery
- publish-pr.ts
- state-parts.ts
- corroborate.ts
- weekly-rollup.ts
- supersedingDelivery
- mailbox.ts
- Outbox.tsx
- delivery-repairs.ts
- CorrectionCase
- scheduler.ts
- production.ts
- reconcile-merges.cjs
- bareSpans
- artifact
- Store
- runner-root.ts
- redact-evidence.ts
- serve-graph.cjs
- owner-merged-stopped.ts
- sanitizeObject
- bare-value.ts
- DeploymentFence
- recorded-gh-command.ts
- assignment.ts
- observe-github-merges.ts
- halt-report.ts
- routing.js
- push-credentials.ts
- build-overseer-launcher.mjs
- github-check-selection.ts
- security.ts
- telemetry/report.ts
- proof-comment.ts
- launch.mjs
- second-opinion.ts
- QAResultsCard.tsx
- StateParts
- preferences-store.ts
- deploy-plan.ts
- session-coverage.ts
- release-floor.ts
- operationPaths
- validate_wiki_pr_body.cjs
- unblock-brief.ts
- continue-ownership-read.ts
- ref_node_crypto
- ITFollowUps.tsx
- write-boundary.ts
- restoreInPlace
- session-snapshot-cleanup.ts

## God Nodes (most connected - your core abstractions)
1. `Store` - 479 edges
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
- `publish()` --indirect_call--> `title()`  [INFERRED]
  scripts/graphify/publish-refresh.cjs → src/knowledge/map/grouping.ts
- `BreakdownTable()` --indirect_call--> `cell()`  [INFERRED]
  src/telemetry/BreakdownTable.tsx → scripts/wiki/archive-plan.cjs
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
- 2-file cycle: `server/workers/process.ts -> server/workers/spawn-command.ts -> server/workers/process.ts`
- 2-file cycle: `src/contracts/people.ts -> src/shared.ts -> src/contracts/people.ts`
- 2-file cycle: `src/contracts/timing.ts -> src/shared.ts -> src/contracts/timing.ts`
- 2-file cycle: `src/contracts/work.ts -> src/shared.ts -> src/contracts/work.ts`
- 3-file cycle: `server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts`

## Communities (183 total, 7 thin omitted)

### Community 0 - "judge-resumes.ts"
Cohesion: 0.08
Nodes (27): absent(), IncidentLedger, isOpen(), judgeResumes(), JudgeResumesInput, Open, openSubjects(), checkpointRetried() (+19 more)

### Community 1 - "Role"
Cohesion: 0.11
Nodes (40): label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+32 more)

### Community 2 - "agents.ts"
Cohesion: 0.05
Nodes (58): slackSendPrompt(), slackVerifyPrompt(), SlackResultSchema, SlackVerificationSchema, candidateWorkspaceEnvironment(), HANDS_OFF_RESOLUTION_GUIDANCE, RESOLUTION_GUIDANCE, PICKUP_CHAT (+50 more)

### Community 3 - "features/workflow.ts"
Cohesion: 0.07
Nodes (60): approveFeature(), commandFeature(), featureById(), mutation(), reviewQuestions(), assertFeatureDependencyOrder(), featureDependencyEdges(), key() (+52 more)

### Community 4 - "cx"
Cohesion: 0.08
Nodes (97): Conversation(), Outbox(), SlackDeliveryCard(), blockedSummary(), ServiceHealthPanel(), followUp(), labels, ServiceHealthRow() (+89 more)

### Community 5 - "shared.ts"
Cohesion: 0.03
Nodes (146): writerRestartInstruction(), findingsBlock(), metadataCarriedAdvisoryIds(), ownedBefore(), QA_STAGES, reviewAdvisoryIds(), Reviewed, withoutReviewAdvisories() (+138 more)

### Community 6 - "budget-ledger.ts"
Cohesion: 0.06
Nodes (56): abandonExpired(), Admission, admit(), admitDeployment(), balance(), bindEvidence(), count(), errcode() (+48 more)

### Community 7 - "index.tsx"
Cohesion: 0.13
Nodes (37): LessonsView(), SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS, PickupForm() (+29 more)

### Community 8 - "incidents/routes.ts"
Cohesion: 0.06
Nodes (50): citationFault(), CitationSchema, ClaimedRange, ResolvedRange, SourceVersions, dismiss(), DISMISSAL_CITATIONS, DISMISSAL_REASON (+42 more)

### Community 9 - "TelemetryPanel.tsx"
Cohesion: 0.10
Nodes (41): TelemetryReport, TelemetryRow, AzureBuild, ROLE_NAMES, BreakdownTable(), CostBar(), coverage(), pricedLabel() (+33 more)

### Community 10 - "enrollment-gate.ts"
Cohesion: 0.13
Nodes (31): dispatchNightly(), eligibility(), admit(), IntakeContext, WAIT_STATUSES, compatible(), dependencyEligibility(), validatePrerequisites() (+23 more)

### Community 11 - "overseer/commands.ts"
Cohesion: 0.06
Nodes (61): header(), readStanding(), reconcile(), BILLING_MODE, guardPresent(), overseerCommand(), reconcileArgs(), resolveCliRoot() (+53 more)

### Community 12 - "App.tsx"
Cohesion: 0.05
Nodes (74): jiraQueueProgress(), nextStage(), deliveryRoles, JiraQueueProgress, TicketProgress, themeColor, App(), BrainWorkspace (+66 more)

### Community 13 - "admit-improvement.ts"
Cohesion: 0.24
Nodes (15): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+7 more)

### Community 14 - "request.ts"
Cohesion: 0.08
Nodes (62): MISSING_NATIVE_LINK, observeAutomationConflict(), VERB, automationMergePolicy(), REBASE, rebaseArgs(), rebaseComment(), belongsTo() (+54 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.11
Nodes (61): requestDelivery(), createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), CaptureRequest (+53 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.08
Nodes (45): Accepted, acceptRetrospective(), normalizeStatement(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, BlockingTrigger, blockingTrigger() (+37 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.08
Nodes (47): deliveryMetrics(), median(), baselined(), baselineLearning(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences() (+39 more)

### Community 18 - "route-activation.ts"
Cohesion: 0.09
Nodes (46): ActiveEntry, GitHubAppConfig, RouteEntry, githubIdentity(), appSelected(), discoveredAuthor(), discoveryAuthors(), expectedAuthor() (+38 more)

### Community 19 - "sandbox-qualification.ts"
Cohesion: 0.04
Nodes (101): checkRunDirectories(), DirectoryFacts, RunDirectories, ValidatedRunnerPaths, within(), ALLOW_PROBES, BatteryExpected, Binding (+93 more)

### Community 20 - "process.ts"
Cohesion: 0.13
Nodes (23): interruptAdoptions(), legacy(), REMOVED_FIELDS, retireLegacyRecovery(), featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), wakeFeature() (+15 more)

### Community 21 - "overseer-launch.mjs"
Cohesion: 0.07
Nodes (80): acquireLauncherLock(), alone(), ancestry(), assertDirectoryOrAbsent(), attemptRecord(), bounded(), boundedString(), checkOwnedFile() (+72 more)

### Community 22 - "cec-reads.ts"
Cohesion: 0.09
Nodes (35): intakeMembership(), parksInJira(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), plainResume(), readbackDispatchGuidance(), currentEnvironmentWait() (+27 more)

### Community 23 - "jira-time.ts"
Cohesion: 0.09
Nodes (39): unresolvedAttempts(), bindingOf(), connectWith(), data(), envelope(), finishVerifiedEffects(), JiraWorklogs, locks (+31 more)

### Community 24 - "holdReason"
Cohesion: 0.07
Nodes (70): StoppedWriter, partialLocalCleanupCandidate(), SavedCandidateAdmission, savedCandidateAdmission(), assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence() (+62 more)

### Community 25 - "accessibility-sources.ts"
Cohesion: 0.12
Nodes (24): PublicationReceipt, GitHubIssuePublisher, number(), same(), accessibilitySources(), actionable(), closingPull(), Finding (+16 more)

### Community 26 - "controller-runtime.ts"
Cohesion: 0.09
Nodes (32): [cmd,...rawArgs], projectData(), StoreDatabase, ControllerEffects, controllerEffects(), DEPLOY_PROJECT, alive(), ControllerMachine (+24 more)

### Community 27 - "goal-reporting.ts"
Cohesion: 0.13
Nodes (27): assertConversationReadback(), finishSupersededReadback(), pump(), savePickup(), harperHandoff(), collectCTOFacts(), boundedIntake(), boundedJobs() (+19 more)

### Community 28 - "advance-metadata-park.ts"
Cohesion: 0.10
Nodes (59): ProjectCard, advanceMetadataPark(), Parked, releaseWords(), sentAnything(), effectiveParkPickup(), PICKUP_ASSIGNEE, REVIEWABLE (+51 more)

### Community 29 - "reader.ts"
Cohesion: 0.09
Nodes (21): knowledgeActivity(), knowledgeActivityPage(), BrainGraph, BrainNote, BrainReader, CommittedBrain, GraphNode, GraphPage (+13 more)

### Community 30 - "digest"
Cohesion: 0.09
Nodes (68): activeEffectId(), Binding, historyBeforeWrite(), matchesBoundDescription(), DescriptionEdit, DescriptionHistory, DescriptionHistoryUnavailable, descriptionRevision() (+60 more)

### Community 31 - "ref_node_path"
Cohesion: 0.05
Nodes (72): deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, deliveryIntakeBlocker(), gateRegisteredDelivery(), accounting, DeliverySubject (+64 more)

### Community 32 - "triage.ts"
Cohesion: 0.15
Nodes (22): budgetRequest(), CheckedOpinionInput, collectOpinion(), collectTriage(), excludedSource(), FrozenSource, INSTRUCTIONS, OpinionEnvelope (+14 more)

### Community 33 - "run.ts"
Cohesion: 0.12
Nodes (24): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, syncInvestigations(), OFFICE_FIX_PROMPT (+16 more)

### Community 34 - "identity-runtime.ts"
Cohesion: 0.09
Nodes (27): KeychainKeySource, appJwt(), base64url(), signingKey(), AppKeySource, Execute, keychainKeySource(), AppReadiness (+19 more)

### Community 35 - "common.cjs"
Cohesion: 0.15
Nodes (27): connections(), fs, main(), path, crypto, ensureInside(), { execFileSync }, fs (+19 more)

### Community 36 - "scheduled-work.ts"
Cohesion: 0.06
Nodes (54): freshOwnershipRead(), conversationResolved(), dueSlackReread(), rereadUncertainSlack(), runningRevision(), deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest() (+46 more)

### Community 37 - "routing.cjs"
Cohesion: 0.12
Nodes (28): fs, main(), path, { spawnSync }, frontmatterProblems(), adjacency(), edgeCost(), edgeKey() (+20 more)

### Community 38 - "entry.ts"
Cohesion: 0.08
Nodes (30): LessonSelection, EntryRead, EntrySchema, ID_MAX, parseEntry(), PATH_MAX, PATHS_MAX, PLAYBOOK_KINDS (+22 more)

### Community 39 - "features.ts"
Cohesion: 0.07
Nodes (54): DELAYS, MAX_EXECUTIONS, MAX_REPLANS, reserveReplacement(), stageBudget(), confirmBrief(), classifyFeatureFailure(), automaticEnabled() (+46 more)

### Community 40 - "knowledge.ts"
Cohesion: 0.07
Nodes (32): OfficeKnowledgeStore, Input, Kind, RetrospectiveResult, RetrospectiveResultSchema, RollupResultSchema, Stage, CONSOLIDATED (+24 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.12
Nodes (36): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), publishableEntry(), settlementPending() (+28 more)

### Community 42 - "lesson-selection.ts"
Cohesion: 0.09
Nodes (35): assignmentKnowledge(), committedNotePage(), guidanceExcerpt(), digest(), LessonBrainAudit, LessonBrainOverlap, lessonForProject(), INSTALLED (+27 more)

### Community 43 - ".getEffect"
Cohesion: 0.08
Nodes (56): Intake, resolveBlockedTransition(), document(), transitionWithComment(), jiraAccount(), jiraCollection(), JiraCredential, jiraCredential() (+48 more)

### Community 44 - "Offices"
Cohesion: 0.11
Nodes (5): QuestionNotifications, mirrorOfficeKnowledge(), InFlightOperations, Offices, SessionBridge

### Community 45 - "harness-baseline.ts"
Cohesion: 0.15
Nodes (23): BaselineReport, baselineReport(), BaselineSource, baselineText(), millions(), row(), share(), add() (+15 more)

### Community 46 - "credential-spans.ts"
Cohesion: 0.08
Nodes (33): AFTER_LABEL, BARE_CREDENTIAL, BARE_LABEL, BARE_UNIT, BARE_VALUE, CAMEL_START, CONTROL_ESCAPE, CREDENTIAL_NAME (+25 more)

### Community 48 - "goal-reviews.ts"
Cohesion: 0.09
Nodes (27): currentCitations(), Fact, NOT_CURRENT, PROVIDER_ERROR, applyGoalReview(), DailyResultSchema, DeliveryJob, EvidenceRefSchema (+19 more)

### Community 49 - "index.ts"
Cohesion: 0.07
Nodes (26): close(), config, itSpecialist, loadedRevision, offices, releaseLock, respond(), server (+18 more)

### Community 50 - "QuestionStepper.tsx"
Cohesion: 0.19
Nodes (18): FeatureQuestionProjection, OutboxQuestionRound(), send(), draftKey(), readDraft(), saveDraft(), QuestionRound(), nextQuestion() (+10 more)

### Community 51 - "metadata-park-words.ts"
Cohesion: 0.16
Nodes (19): devUpdate(), HEADLINE, OUTCOME, qaComment(), remote(), STAGE, JiraCommentIntent, plainWords() (+11 more)

### Community 52 - "investigations/ledger.ts"
Cohesion: 0.15
Nodes (22): ctoInputIdentityMatches(), ctoInputRecovered(), acceptedCompletionResolution(), investigationCandidates(), investigationId(), ctoReplacementResolution(), finishedSubjectResolution(), investigationFollowUps() (+14 more)

### Community 53 - "saved-state.ts"
Cohesion: 0.38
Nodes (7): readSavedState(), joinParts(), readSaved(), SavedSelection, SavedStateConflict, savedText(), selectSaved()

### Community 54 - "JiraIssuePublisher"
Cohesion: 0.19
Nodes (6): contentSchema(), JiraIssuePublisher, jiraText(), descriptionPreimage(), plain(), publicationDescription()

### Community 55 - "app-config.ts"
Cohesion: 0.26
Nodes (16): effectId(), entry(), fail(), KnownProject, only(), parseGitHubApp(), positive(), QualifyEntry (+8 more)

### Community 56 - "pass.ts"
Cohesion: 0.07
Nodes (54): Digest, Evidence, FAILURE_ID, FailureEvent, failureLine(), LINE_LIMIT, LOOPBACK, RUNNER_DEFAULTS (+46 more)

### Community 57 - "dependency-bots/adopt.ts"
Cohesion: 0.08
Nodes (42): closesIssue(), linkedBody(), linkPR(), DependabotPR, dependabotPR(), ensureTrackingIssue(), findTrackingIssue(), issueTarget() (+34 more)

### Community 58 - "api-routes.ts"
Cohesion: 0.16
Nodes (21): implementationContinuationRoute(), qaPlanRetryRoute(), servedOutbox(), isNotice(), knowledgeRoute(), goalHistory(), ROOT, apiRoute() (+13 more)

### Community 59 - "diagnostic-snapshot.ts"
Cohesion: 0.15
Nodes (19): assignmentDiagnostics(), diagnosticContext(), diagnosticSnapshot(), followUpPicture(), publishITReport(), nativeDeliveryResolved(), archiveOldReports(), RETAINED_REPORTS (+11 more)

### Community 60 - "cost-ledger.ts"
Cohesion: 0.14
Nodes (30): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress(), effectId() (+22 more)

### Community 61 - "assignments.ts"
Cohesion: 0.10
Nodes (27): clip(), DEMAND_LIMIT, demandFacts(), DemandSection, key(), LessonKey, notes(), AssignmentLookups (+19 more)

### Community 62 - "brain-maintenance.ts"
Cohesion: 0.08
Nodes (37): completeNativeCheckpoint(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, brainResultStop(), BrainStatusSchema, GateMark, gateMark() (+29 more)

### Community 63 - "Button"
Cohesion: 0.07
Nodes (54): ChatMarkdown(), ChatMarkdown, MessageText(), Activity(), ActivityTimeline(), AssignmentKnowledge(), Lookup(), BrainWorkspace() (+46 more)

### Community 64 - "constellation-runtime.ts"
Cohesion: 0.06
Nodes (49): KnowledgeNode, ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), CameraPose, flightPose() (+41 more)

### Community 65 - "validate_pr_body.cjs"
Cohesion: 0.36
Nodes (8): fs, main(), readableText(), REQUIRED_CHECKS, REQUIRED_SECTIONS, sections(), validatePullRequestBody(), withoutComments()

### Community 66 - "audit-plan-candidates.cjs"
Cohesion: 0.14
Nodes (31): audit(), branchIssueNumbers(), classify(), distinctiveTitleWords(), { execFileSync }, extractPaths(), findPrForMergeSubject(), fmtCommit() (+23 more)

### Community 67 - "office-client.ts"
Cohesion: 0.10
Nodes (25): FailureAnswer, HaltAnswer, realMachine(), bodyWithin(), bounded(), Envelope, HealthReading, ObservationSkipped (+17 more)

### Community 68 - "resume-arrivals.ts"
Cohesion: 0.10
Nodes (67): stoppedWriter(), canonical(), assessResumes(), Standing, CheckpointEligibility, checkpointEligibility(), admitAssignmentResume(), forAssignment() (+59 more)

### Community 69 - "Conversation.tsx"
Cohesion: 0.08
Nodes (38): ConversationDraft, createConversationDrafts(), SendMessage, isLessonDecision(), blocker(), recommendedReply(), slackMessageStatus(), BrainDrawer() (+30 more)

### Community 70 - "OfficeScene.tsx"
Cohesion: 0.08
Nodes (61): displayAgentTask(), githubStageLabels, withoutElapsed(), CameraBookmark, restoreBookmark(), LiveAgentTask(), Props, RunningTask() (+53 more)

### Community 71 - "spawn-command.ts"
Cohesion: 0.09
Nodes (34): Event, exactCommand(), Invocation, localHookCommand(), one(), prePushRejection(), PushIdentity, retirementBoundary() (+26 more)

### Community 72 - "session-context-file.ts"
Cohesion: 0.21
Nodes (14): ContextFoldPrefix, contextFoldPrefix(), SessionContextCheckpoint, captureSessionContextClone(), ContextReadPhase, SessionContextDeadline, sessionContextFile(), ContextReadChanged (+6 more)

### Community 73 - "project-binding-blocks.ts"
Cohesion: 0.19
Nodes (18): azureSchema, deploymentSchema, jiraSchema, ownJiraSchema, promptSchema, DEFAULT_STAGE_STATUSES, intakeStatus, resolvedStatuses() (+10 more)

### Community 74 - "session-scope.ts"
Cohesion: 0.20
Nodes (16): Bound, claudeScopeParser(), claudeSessionScope(), CODEX_ROLLOUTS, contextReaders(), retainSessionMessage(), SessionConversation, escaped() (+8 more)

### Community 75 - "service-health.ts"
Cohesion: 0.10
Nodes (26): quotaLow(), quotaDeferred(), ClaudeLoginRefusal, claudeLoginRefusal(), claudeRefusalWords(), RECORDED_REFUSALS, refusedClaudeRow(), listenerHealth() (+18 more)

### Community 76 - "sanitize"
Cohesion: 0.12
Nodes (30): AzureMonitor, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs(), fullActivePRs(), observation() (+22 more)

### Community 77 - "closeout-recovery.ts"
Cohesion: 0.11
Nodes (45): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+37 more)

### Community 78 - "incidents.ts"
Cohesion: 0.07
Nodes (66): attributedRecords(), foldsItsRun(), groupCandidates(), ObservedIncident, ObservedSubject, digest(), fingerprint(), incidentId() (+58 more)

### Community 79 - "Ticket"
Cohesion: 0.05
Nodes (51): carriedNotRepeated(), changeScopeNote(), Scoped, implementationWorkerContext(), JiraOperations, movedHeadNote(), cecPrompt(), resolvedDecisionNote() (+43 more)

### Community 80 - "session-bridge.ts"
Cohesion: 0.13
Nodes (22): codexDaemonProcesses(), accountCodexProcesses(), CodexProcessInventory, codexProcessInventory(), DesktopSessions, unaccountedProcesses(), codexThreadMetadata(), METADATA_CHUNK (+14 more)

### Community 81 - "local-config.ts"
Cohesion: 0.13
Nodes (26): escaped(), IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), projectListScope(), cecIntakePrompt(), assertFeaturePlanningConfig() (+18 more)

### Community 82 - "alert-issue.ts"
Cohesion: 0.17
Nodes (23): AlertIssue, alertIssueBody(), alertIssueTitle(), alertMarker(), closeAlertIssue(), ensureAlertIssue(), findAlertIssue(), Guard (+15 more)

### Community 83 - "effect.ts"
Cohesion: 0.11
Nodes (30): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), maintenanceCandidate(), moveAside(), moveBack(), purgeRemoved(), purging (+22 more)

### Community 84 - "viewer.js"
Cohesion: 0.19
Nodes (25): addMetaLink(), addMetaRow(), addRelationship(), applyView(), buildIndexes(), buildLegend(), buildModel(), buildRenderer() (+17 more)

### Community 85 - "cec/workflow.ts"
Cohesion: 0.07
Nodes (31): applyIntakeObservation(), Carried, findingsOwedToRetest(), missingRetestDispositions(), qaPlanEvidenceGap(), maintenancePolicies(), sourceReview(), SETTLED (+23 more)

### Community 86 - "stopped-record.ts"
Cohesion: 0.07
Nodes (62): boundedEvidence(), expectedWait(), StopFacts, FailedMailCheck, lastFailedMailCheck(), lastMailCheckOutcome(), MailCheckOutcome, normalizeCause() (+54 more)

### Community 87 - "conversations/conversations.ts"
Cohesion: 0.11
Nodes (16): ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff(), saveGoals() (+8 more)

### Community 88 - "superseded-wiki-pr.ts"
Cohesion: 0.12
Nodes (50): abandon(), assertOpenSnapshot(), awaitingContainment(), closeIssue(), CloseRevalidationError, closeSuperseded(), comment(), CommentStep (+42 more)

### Community 89 - "ref_node_child_process"
Cohesion: 0.13
Nodes (18): changedPaths(), { execFileSync }, files, isMapInput(), mapOnly(), { execFileSync }, git(), publish() (+10 more)

### Community 90 - "provider-observation.ts"
Cohesion: 0.13
Nodes (26): az(), correlatedBuild(), Azure, azurePipelines(), outcome(), Read, RUNS_PER_PIPELINE, Api (+18 more)

### Community 91 - "jiraBinding"
Cohesion: 0.07
Nodes (58): CommentPage, commentReadback(), Assignment, Transition, jiraRecord(), unpack(), postDevUpdate(), statusHeld() (+50 more)

### Community 92 - "session-context-client.ts"
Cohesion: 0.11
Nodes (21): claudeSessionContext(), readTranscript, codexSessionContext(), readRollout, packContextFailure(), PackedContextFailure, unpackContextFailure(), LiveSession (+13 more)

### Community 93 - "plans.cjs"
Cohesion: 0.13
Nodes (27): fs, main(), parse(), path, repoRoot(), substantive(), walk(), association() (+19 more)

### Community 94 - "assignment-poll.ts"
Cohesion: 0.04
Nodes (63): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), currentOutbox(), retryCandidateCleanup(), admitReadyCards(), confirmedGone(), goneQuery() (+55 more)

### Community 96 - "outbox.ts"
Cohesion: 0.17
Nodes (17): capabilityBlockedReviews(), latestReviews(), metadataParkAction(), ADOPTION_STALLED_MS, projectOutbox(), item(), syncOutbox(), OwnerStepItem (+9 more)

### Community 97 - "admit-repair-waits.ts"
Cohesion: 0.08
Nodes (55): sourceVersions(), inHistoryOf(), CompareMemory, compareMemory(), COMPARES_PER_PASS, comparison(), DeployedFixes, DeployedFixesInput (+47 more)

### Community 98 - "pilot-delivery.ts"
Cohesion: 0.07
Nodes (66): candidateBranchMoved(), applyChangeScope(), endChangeScope(), levels(), MAX_CHECKS, owedUnderScope(), scopeBase(), scopeOutgrown() (+58 more)

### Community 99 - "archive-plan.cjs"
Cohesion: 0.12
Nodes (33): fs, main(), parse(), path, archive(), cell(), ensureIndex(), fromArgs() (+25 more)

### Community 100 - "call-scope.ts"
Cohesion: 0.05
Nodes (64): boardReadFailure(), add(), addSource(), busiest(), CallLedger, Entry, sourceRows(), Sources (+56 more)

### Community 101 - "jira-attempts.ts"
Cohesion: 0.13
Nodes (21): attempted(), attemptState(), bound(), covers(), JiraAttempt, jiraAttempts(), JiraAttemptState, open() (+13 more)

### Community 102 - "intent.ts"
Cohesion: 0.13
Nodes (24): GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles(), ContinuationIO (+16 more)

### Community 103 - "on-merge-sync.cjs"
Cohesion: 0.19
Nodes (22): fieldSpan(), keyPattern(), list(), parseListLiteral(), quote(), render(), scalar(), splitFrontmatter() (+14 more)

### Community 104 - "backup-stores.ts"
Cohesion: 0.11
Nodes (30): absentAdmission(), AdmissionComparison, AdmissionSnapshot, compareAdmissions(), snapshotAdmissions(), BackupEntry, BackupInput, BackupInventory (+22 more)

### Community 105 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 106 - "deploy.ts"
Cohesion: 0.08
Nodes (47): advance(), deploy(), Commit, DEPLOY_STEPS, DeployFacts, DeployStatus, Digest, RollbackFacts (+39 more)

### Community 107 - "harnessEffect"
Cohesion: 0.10
Nodes (47): BLOCK, harnessBlockMove(), harnessParkedCard(), noted(), effectKey(), LaneOperation, laneWrite(), moveCardOnce() (+39 more)

### Community 108 - "work.ts"
Cohesion: 0.05
Nodes (56): Admission, FLAGS, incidentCommand(), IncidentCommandIO, option(), USAGE, whole(), boundaryCrossed() (+48 more)

### Community 109 - "pr-observation-graphql.ts"
Cohesion: 0.08
Nodes (52): withGitHubOperation(), responseBody(), githubPRDescription(), ChildRequest, headCheckRuns(), closingDirectives(), includeBody(), ObservedPR (+44 more)

### Community 110 - "blocker-followups.ts"
Cohesion: 0.11
Nodes (50): conversationReadbackReady(), followupOf(), pendingReadback(), queueConversationReadback(), readbackEnding(), replacedReadback(), uncertainConversations(), readBackConversations() (+42 more)

### Community 111 - "follow-production.ts"
Cohesion: 0.20
Nodes (17): awaitingJiraStatus(), awaitingProduction(), FOLLOW_DAYS, followed(), isFollowed(), Azure, AzureRead, containedIn() (+9 more)

### Community 112 - "project-policy.ts"
Cohesion: 0.14
Nodes (19): AUTO_ADOPT_BOTS, AutoAdoptBot, EffectiveAutoAdopt, effectiveAutoAdopt(), OfficeConfigInputs, officeConfigRoute(), officeConfigSummary(), projectSettingsSummary() (+11 more)

### Community 113 - "OfficeSnapshot"
Cohesion: 0.07
Nodes (39): OutboxSavedImplementation(), review(), OutboxSavedPlan(), reconcile(), FeatureDelivery(), FeatureDocuments(), views, FeatureReading() (+31 more)

### Community 114 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 115 - "run-accounting.ts"
Cohesion: 0.06
Nodes (58): BoundedRead, add(), CodexRequest, CodexRollout, CodexTokens, FIELDS, codexHome(), createdAt() (+50 more)

### Community 119 - "store.ts"
Cohesion: 0.04
Nodes (53): leadershipContext(), expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), proposeOfficeLessons() (+45 more)

### Community 120 - "projects.ts"
Cohesion: 0.10
Nodes (19): CEC, DATA, file, project, root, legacyCecPrompt(), ProjectInput, ownProjectBindings() (+11 more)

### Community 121 - "reconcileGitHubWrite"
Cohesion: 0.23
Nodes (11): GitHubOperations, reconcileGitHubWrite(), assignedToJoe(), fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), tryReadyLessonIssue(), Wait (+3 more)

### Community 122 - "daily-cto.ts"
Cohesion: 0.10
Nodes (21): DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), dailyReviewDate(), reviewWeekday(), queueGoalEvidenceRequest(), Briefing (+13 more)

### Community 123 - "deploy-command.ts"
Cohesion: 0.11
Nodes (35): CONTROLLER_ENTRY, ControllerPin, Pin, pinnedController(), readControllerPin(), writeControllerPin(), controllerOf(), deployCommand() (+27 more)

### Community 124 - "refresh-issue-state.cjs"
Cohesion: 0.19
Nodes (20): atomicWrite(), advanceFence(), closingIssues(), githubRefs(), key(), normalizeGithubQuery(), normalizeRepository(), parseGithubQuery() (+12 more)

### Community 125 - ".emit"
Cohesion: 0.06
Nodes (55): decideImplementation(), say(), requestQAPlanRetry(), channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice() (+47 more)

### Community 126 - "EffectIntent"
Cohesion: 0.13
Nodes (15): comparableSlackText(), labelIsUrl(), Write, FeaturePublisher, publishFeature(), reconcilePublication(), uncertainPublications(), reserveIdentity() (+7 more)

### Community 127 - "sign-in-unpark.ts"
Cohesion: 0.18
Nodes (18): hasPendingDelivery(), resumeAfterSignIn(), signInWait(), MAX_SIGN_IN_UNPARKS, waitingStep(), BrowserPage, browserPages(), ReadPages (+10 more)

### Community 128 - "it/context.ts"
Cohesion: 0.12
Nodes (23): savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), heldFor(), ITContext, recoveryHeld(), recoveryWait() (+15 more)

### Community 129 - "restart-writer.ts"
Cohesion: 0.18
Nodes (17): ATTEMPT_DELAYS_MS, nextAttemptAt(), restartStoppedWriters(), unchangedSinceAccepted(), NOT_RETRYABLE, releaseFunds(), WRITER_STAGES, WriterRestartCandidate (+9 more)

### Community 130 - "draft-provenance.ts"
Cohesion: 0.22
Nodes (16): maintenanceVerifiedDraft(), DraftProvenance, draftStep(), draftWorker(), MaintenanceDraft, maintenanceDraftProvenance(), nativeBash(), need() (+8 more)

### Community 131 - "contracts/overseer.ts"
Cohesion: 0.08
Nodes (23): common, CorrectionCaseSchema, DispositionSchema, EventReferenceSchema, FalsePositive, FileReferenceSchema, HarnessDefect, HarnessDefectResult (+15 more)

### Community 132 - "GitHubDelivery"
Cohesion: 0.05
Nodes (49): issueKey(), observePrerequisites(), PrerequisiteSchema, PrerequisitesSchema, GitHubDelivery, SourceClosed, classifyStop(), stopReason() (+41 more)

### Community 133 - "publish-pr.ts"
Cohesion: 0.20
Nodes (14): retryRead(), createdContentSha256(), developerPRContent(), officePRContent(), prContent(), assertCandidate(), Candidate, Execute (+6 more)

### Community 134 - "state-parts.ts"
Cohesion: 0.20
Nodes (14): comparableRow(), START_EVENT_KINDS, START_STATE_SHAPES, withoutStartValue(), withoutStartValues(), LARGE_KEY_CHARS, plain(), RedactedEntries (+6 more)

### Community 135 - "corroborate.ts"
Cohesion: 0.13
Nodes (26): resolveRange(), Agreement, agreement(), anchor(), compare(), disposition(), factsKey(), file() (+18 more)

### Community 136 - "weekly-rollup.ts"
Cohesion: 0.20
Nodes (16): learningMetrics(), BRAIN_SCOPE, RollupResult, harperFolder(), RETROSPECTIVE_TIMEOUT, retryDelay(), lastFriday(), ROLLUP_HISTORY (+8 more)

### Community 137 - "supersedingDelivery"
Cohesion: 0.32
Nodes (9): projectSlackDeliveries(), settleRequestedSlackReplacement(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint(), supersedingDelivery(), slackHealth() (+1 more)

### Community 138 - "mailbox.ts"
Cohesion: 0.39
Nodes (7): enumerateIntakeList(), inPickupOrder(), text(), checkMail(), drainMail(), requestMail(), ingest()

### Community 139 - "Outbox.tsx"
Cohesion: 0.07
Nodes (38): knowledgeOutbox(), LessonDecisionAction, lessonDecisionState(), readLessonDecision(), DAYS, dueLessonDecisions(), easternWeek(), LESSON_DIGEST (+30 more)

### Community 140 - "delivery-repairs.ts"
Cohesion: 0.07
Nodes (55): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+47 more)

### Community 141 - "CorrectionCase"
Cohesion: 0.40
Nodes (5): Corroboration, RequirementExample, CorrectionCase, SourceRange, SubjectReference

### Community 142 - "scheduler.ts"
Cohesion: 0.15
Nodes (15): OfficeCapacity, PROJECT_LOCAL, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch() (+7 more)

### Community 144 - "reconcile-merges.cjs"
Cohesion: 0.22
Nodes (14): collectPulls(), copyWikiForDryRun(), { execFileSync }, flattenPages(), fs, githubRequest(), isWikiBotPull(), main() (+6 more)

### Community 145 - "bareSpans"
Cohesion: 0.19
Nodes (15): apostropheEnd(), bareSpans(), credentialSpans(), genuineGap(), headerValueEnd(), isQueryLabel(), labelBefore(), nameEnd() (+7 more)

### Community 146 - "artifact"
Cohesion: 0.05
Nodes (132): interruptedImplementation(), verifyContinuationPreservation(), ownershipReadHistory(), containedFile(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration() (+124 more)

### Community 147 - "Store"
Cohesion: 0.04
Nodes (24): GitHubFeaturePublisher, JiraFeaturePublisher, ResumeProject, Result, Assessment, brainCheckpointCompletion(), coverageSchema, verified (+16 more)

### Community 148 - "runner-root.ts"
Cohesion: 0.13
Nodes (32): privateDirectories(), runnerPaths(), PIN_ENTRY, pinCommand(), assertOwnedDirectory(), Child, CHILDREN, code() (+24 more)

### Community 149 - "redact-evidence.ts"
Cohesion: 0.12
Nodes (14): AWS_KEY_ID, JSON_WEB_TOKEN, PROVIDER_TOKEN, absent(), NEVER_ENABLED, ResumeControl, stated(), Stored (+6 more)

### Community 150 - "serve-graph.cjs"
Cohesion: 0.24
Nodes (9): createServer(), fs, http, listen(), attempt(), main(), path, resolveRequest() (+1 more)

### Community 151 - "owner-merged-stopped.ts"
Cohesion: 0.15
Nodes (23): notOwned(), mergedByOwner(), harnessMergeAttempted(), mergedByOfficeBot(), mergeEffects(), officeMerge(), closeableIssue(), effectsSettled() (+15 more)

### Community 152 - "sanitizeObject"
Cohesion: 0.19
Nodes (17): incidentsRoute(), resumeSwitch(), failure(), halt(), parse(), readFailure(), REPORT_LIMIT, runnerRoute() (+9 more)

### Community 153 - "bare-value.ts"
Cohesion: 0.16
Nodes (20): BareValue, bareValue(), deeperValueEnd(), ENDS, isSeparator(), plainEscape(), queryValue(), separatorEscapeAt() (+12 more)

### Community 154 - "DeploymentFence"
Cohesion: 0.25
Nodes (6): assertToken(), DeploymentFence, deploymentFenceGate(), DeploymentFenceGateContext, STOPPING_COMMANDS, stoppingCommand()

### Community 155 - "recorded-gh-command.ts"
Cohesion: 0.19
Nodes (20): assignments(), changeDirectory(), closing(), CREATE, createGuard(), flags(), named(), read() (+12 more)

### Community 156 - "assignment.ts"
Cohesion: 0.16
Nodes (20): latestQA(), notPassedInLatestQA(), QACoverage, qaCoverage(), same(), Tested, safeWebUrl(), officePreviewGuidance (+12 more)

### Community 157 - "observe-github-merges.ts"
Cohesion: 0.28
Nodes (15): clearCooldown(), coolDown(), coolingDown(), MERGE_NOTICE_RECHECK_MS, waitKey(), waits, isMergeCommit(), issueOf() (+7 more)

### Community 158 - "halt-report.ts"
Cohesion: 0.08
Nodes (26): failureDigest(), FailureReceipt, haltCondition(), HaltReport, forwardFailures(), forwardIntent(), ForwardSummary, Standing (+18 more)

### Community 160 - "push-credentials.ts"
Cohesion: 0.33
Nodes (10): assertPushCredential(), Execute, assertBoundPushDestination(), digest(), Execute, file(), PUSH_HOOKS, pushHookChain() (+2 more)

### Community 161 - "build-overseer-launcher.mjs"
Cohesion: 0.22
Nodes (8): BANNER, builtin(), bundleLauncher(), LAUNCHER_BUNDLE, LAUNCHER_ENTRY, launcherChunk(), REPOSITORY, SCRIPT

### Community 162 - "github-check-selection.ts"
Cohesion: 0.09
Nodes (44): assertParkDecision(), CheckJobAgreement, checkJobAgreement(), isKnownCheckStatus(), positive(), STATE, UNFINISHED, checksFailed() (+36 more)

### Community 163 - "security.ts"
Cohesion: 0.14
Nodes (16): redactCredentials(), redactUnquoted(), AFTER_JSON_ESCAPE, BEARER_CREDENTIAL, escapedAt(), HEADER_CREDENTIAL, HEADER_OPERAND, HEADER_PREFIX (+8 more)

### Community 164 - "telemetry/report.ts"
Cohesion: 0.26
Nodes (13): Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked(), row() (+5 more)

### Community 165 - "proof-comment.ts"
Cohesion: 0.38
Nodes (12): commentId(), CommentIntent, CommentReceipt, conversation(), exact(), findProofComment(), matchesProofComment(), postProofComment() (+4 more)

### Community 166 - "launch.mjs"
Cohesion: 0.06
Nodes (97): RFC-9562, CHECKOUT, DEFAULT_DEADLINE_MS, existingPlist(), installOverseer(), LABEL, LAUNCHER_SOURCE, renderPlist() (+89 more)

### Community 167 - "second-opinion.ts"
Cohesion: 0.29
Nodes (10): CorroborationRequest, LaunchFacts, collectSecondOpinion(), SecondOpinionRequest, Budgeted, FrozenInput, Opinion, otherProvider() (+2 more)

### Community 168 - "QAResultsCard.tsx"
Cohesion: 0.40
Nodes (7): qaResultChanges(), QA_STAGES, qaResults(), qaStatus(), artifact(), QAResultsCard(), Report()

### Community 169 - "StateParts"
Cohesion: 0.26
Nodes (3): PartRow, partSize(), StateParts

### Community 170 - "preferences-store.ts"
Cohesion: 0.17
Nodes (10): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS (+2 more)

### Community 171 - "deploy-plan.ts"
Cohesion: 0.11
Nodes (38): runningRevision(), runningRevision(), runtimeRevision(), ActiveRelease, BUILD_ENV, buildRelease(), BuildReleaseOptions, Execute (+30 more)

### Community 172 - "session-coverage.ts"
Cohesion: 0.43
Nodes (6): claudeSessions(), completeSessionCoverage(), desktopCoverageGap(), knownActivity(), Report, unexplained()

### Community 173 - "release-floor.ts"
Cohesion: 0.33
Nodes (6): AS_COMMITTED, Execute, FloorReading, message(), readReleaseFloor(), RELEASE_FLOOR

### Community 174 - "operationPaths"
Cohesion: 0.35
Nodes (9): Body, DeploymentFenceState, fenceTokenDigest(), abandon(), operationPaths(), createDeployToken(), readDeployToken(), removeDeployToken() (+1 more)

### Community 175 - "validate_wiki_pr_body.cjs"
Cohesion: 0.33
Nodes (5): { execFileSync }, hasCanonicalWikiBody(), maintenanceBodies, matchesMaintenanceBody(), { readFileSync }

### Community 176 - "unblock-brief.ts"
Cohesion: 0.53
Nodes (5): clearUnblockBrief(), key(), saveUnblockBrief(), UnblockBrief, unblockBrief()

### Community 177 - "continue-ownership-read.ts"
Cohesion: 0.18
Nodes (17): continueOwnershipRead(), expiredOwnershipRead(), handoffOwnership(), ReadbackOwnerDecision, ownershipReadGate(), ownershipReadState(), ownershipReadSource(), ReadOwnershipCandidate (+9 more)

### Community 178 - "ref_node_crypto"
Cohesion: 0.08
Nodes (25): OwnershipRead, Document, document(), isAccessOnlyPlan(), settledAccessOnlyState(), closedReadonlyPlan(), Document, document() (+17 more)

### Community 179 - "ITFollowUps.tsx"
Cohesion: 0.67
Nodes (4): itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps()

### Community 180 - "write-boundary.ts"
Cohesion: 0.11
Nodes (29): AMBIENT_TOKENS, appCredential(), ChildCredential, CREDENTIAL_TRACING, GIT_HELPER, operatorRollbackCredential(), PROMPTS, GitHubIdentityRuntime (+21 more)

### Community 181 - "restoreInPlace"
Cohesion: 0.60
Nodes (5): identity(), Json, plain(), restorable(), restoreInPlace()

### Community 183 - "session-snapshot-cleanup.ts"
Cohesion: 0.40
Nodes (5): SNAPSHOT_PREFIX, removeStaleSessionSnapshots(), SNAPSHOT_SWEEP_MS, STALE_SNAPSHOT_MS, sweepStaleSessionSnapshots()

## Knowledge Gaps
- **1 isolated node(s):** `RFC-9562`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 1351 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `judge-resumes.ts`, `agents.ts`, `features/workflow.ts`, `shared.ts`, `enrollment-gate.ts`, `admit-improvement.ts`, `request.ts`, `scheduled-captures.ts`, `run-retrospective.ts`, `record-trigger.ts`, `route-activation.ts`, `process.ts`, `cec-reads.ts`, `jira-time.ts`, `holdReason`, `accessibility-sources.ts`, `controller-runtime.ts`, `goal-reporting.ts`, `advance-metadata-park.ts`, `reader.ts`, `digest`, `ref_node_path`, `run.ts`, `identity-runtime.ts`, `scheduled-work.ts`, `entry.ts`, `features.ts`, `knowledge.ts`, `time-scope.ts`, `lesson-selection.ts`, `.getEffect`, `Offices`, `goal-reviews.ts`, `investigations/ledger.ts`, `dependency-bots/adopt.ts`, `api-routes.ts`, `diagnostic-snapshot.ts`, `cost-ledger.ts`, `assignments.ts`, `brain-maintenance.ts`, `resume-arrivals.ts`, `sanitize`, `closeout-recovery.ts`, `Ticket`, `session-bridge.ts`, `alert-issue.ts`, `effect.ts`, `cec/workflow.ts`, `stopped-record.ts`, `conversations/conversations.ts`, `superseded-wiki-pr.ts`, `provider-observation.ts`, `jiraBinding`, `assignment-poll.ts`, `admit-repair-waits.ts`, `pilot-delivery.ts`, `jira-attempts.ts`, `intent.ts`, `harnessEffect`, `pr-observation-graphql.ts`, `blocker-followups.ts`, `follow-production.ts`, `OfficeSnapshot`, `run-accounting.ts`, `store.ts`, `reconcileGitHubWrite`, `daily-cto.ts`, `.emit`, `EffectIntent`, `sign-in-unpark.ts`, `it/context.ts`, `restart-writer.ts`, `draft-provenance.ts`, `GitHubDelivery`, `publish-pr.ts`, `weekly-rollup.ts`, `supersedingDelivery`, `delivery-repairs.ts`, `scheduler.ts`, `artifact`, `owner-merged-stopped.ts`, `observe-github-merges.ts`, `push-credentials.ts`, `proof-comment.ts`, `StateParts`, `continue-ownership-read.ts`, `ref_node_crypto`, `write-boundary.ts`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **What connects `RFC-9562` to the rest of the system?**
  _1 weakly-connected nodes found - possible missing edges._
- **Should `judge-resumes.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08325624421831637 - nodes in this community are weakly interconnected._
- **Why does `OfficeSnapshot` connect `OfficeSnapshot` to `judge-resumes.ts`, `restart-writer.ts`, `it/context.ts`, `Role`, `GitHubDelivery`, `cx`, `shared.ts`, `index.tsx`, `supersedingDelivery`, `enrollment-gate.ts`, `Outbox.tsx`, `App.tsx`, `TelemetryPanel.tsx`, `record-trigger.ts`, `Store`, `process.ts`, `QAResultsCard.tsx`, `harness-baseline.ts`, `goal-reviews.ts`, `investigations/ledger.ts`, `saved-state.ts`, `api-routes.ts`, `diagnostic-snapshot.ts`, `brain-maintenance.ts`, `Button`, `resume-arrivals.ts`, `Conversation.tsx`, `OfficeScene.tsx`, `service-health.ts`, `sanitize`, `incidents.ts`, `cec/workflow.ts`, `stopped-record.ts`, `jiraBinding`, `assignment-poll.ts`, `outbox.ts`, `work.ts`, `store.ts`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Should `Role` be split into smaller, more focused modules?**
  _Cohesion score 0.11224489795918367 - nodes in this community are weakly interconnected._
- **Why does `command()` connect `Store` to `restart-writer.ts`, `agents.ts`, `features/workflow.ts`, `GitHubDelivery`, `shared.ts`, `publish-pr.ts`, `incidents/routes.ts`, `delivery-repairs.ts`, `admit-improvement.ts`, `artifact`, `sandbox-qualification.ts`, `process.ts`, `redact-evidence.ts`, `jira-time.ts`, `accessibility-sources.ts`, `controller-runtime.ts`, `reader.ts`, `digest`, `ref_node_path`, `identity-runtime.ts`, `time-scope.ts`, `.getEffect`, `deploy-plan.ts`, `release-floor.ts`, `continue-ownership-read.ts`, `ref_node_crypto`, `cost-ledger.ts`, `brain-maintenance.ts`, `service-health.ts`, `sanitize`, `closeout-recovery.ts`, `Ticket`, `session-bridge.ts`, `effect.ts`, `cec/workflow.ts`, `provider-observation.ts`, `jiraBinding`, `assignment-poll.ts`, `admit-repair-waits.ts`, `pilot-delivery.ts`, `call-scope.ts`, `jira-attempts.ts`, `intent.ts`, `harnessEffect`, `store.ts`, `reconcileGitHubWrite`, `deploy-command.ts`, `.emit`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Should `agents.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.048426812585499315 - nodes in this community are weakly interconnected._