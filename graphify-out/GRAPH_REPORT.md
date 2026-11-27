# Graph Report - the-office  (2026-11-27)

## Corpus Check
- 1380 files · ~634,788 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 7931 nodes · 33320 edges · 183 communities (173 shown, 10 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 1107 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `be53cea3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- run-model.ts
- PeoplePanel.tsx
- worker-runtime.ts
- features/workflow.ts
- cx
- accept-stage-result.ts
- budget-ledger.ts
- index.tsx
- process.ts
- TelemetryPanel.tsx
- pilot-delivery.ts
- .transaction
- OfficeSnapshot
- learning-events.ts
- request.ts
- scheduled-captures.ts
- run-retrospective.ts
- record-trigger.ts
- write-boundary.ts
- sandbox-qualification.ts
- command-registry.ts
- overseer-launch.mjs
- intake-scope.ts
- jira-time.ts
- ref_node_path
- projects.ts
- sanitize
- Ticket
- assertDeliveryMayMutate
- knowledge/routes.ts
- digest
- draft-provenance.ts
- reader-profiles.ts
- run.ts
- Coordinator
- common.cjs
- pr-observation-shape.ts
- routing.cjs
- entry.ts
- pendingRounds
- approach.ts
- time-scope.ts
- lesson-selection.ts
- .save
- Offices
- harness-baseline.ts
- credential-spans.ts
- rate-limit-samples.ts
- goal-reviews.ts
- index.ts
- features.ts
- readable-jira-comment.ts
- investigations/ledger.ts
- timed-statements.ts
- jiraBinding
- easternDay
- pass.ts
- assignment-poll.ts
- fact-bounds.ts
- work.ts
- cost-ledger.ts
- assignments.ts
- call-ledger.ts
- MapView.tsx
- constellation-runtime.ts
- validate_pr_body.cjs
- audit-plan-candidates.cjs
- runner-report.ts
- resume-arrivals.ts
- App.tsx
- OfficeScene.tsx
- spawn-command.ts
- session-context-file.ts
- project-bindings-config.ts
- session-scope.ts
- service-health.ts
- project-bindings.ts
- closeout-recovery.ts
- incidents.ts
- agents.ts
- session-bridge.ts
- ref_node_crypto
- coordination-tick.ts
- remove-candidate.ts
- viewer.js
- maintenance/maintenance.ts
- stopped-record.ts
- conversations/conversations.ts
- superseded-wiki-pr.ts
- ref_node_child_process
- provider-observation.ts
- ticket-evidence.ts
- session-context-client.ts
- plans.cjs
- github.ts
- capture-session-clone.py
- notifications.ts
- bareSpans
- ticket-stage-runner.ts
- archive-plan.cjs
- call-scope.ts
- unsent-time.ts
- intent.ts
- on-merge-sync.cjs
- backup-stores.ts
- extract-worker.mjs
- controller-runtime.ts
- harnessEffect
- judge-resumes.ts
- pr-observation-graphql.ts
- blocker-followups.ts
- follow-production.ts
- json-layers.ts
- Outbox.tsx
- slack-supersession.ts
- run-accounting.ts
- qa.ts
- qa-plan-continuation.ts
- writer-restart.ts
- control-store.ts
- retrospective-subject.ts
- .getEffect
- daily-cto.ts
- deploy-command.ts
- refresh-issue-state.cjs
- .emit
- Store
- sign-in-unpark.ts
- evidence.ts
- requests.ts
- prompts/conversations.ts
- bare-value.ts
- redact-evidence.ts
- http/context.ts
- state-parts.ts
- triage.ts
- knowledge.ts
- dates.cjs
- operationPaths
- shared.ts
- TicketJob
- metadata-park-words.ts
- scheduler.ts
- production.ts
- reconcile-merges.cjs
- delivery-task.ts
- artifact
- engine.ts
- ProjectProgress
- resume-control.ts
- serve-graph.cjs
- workKey
- restoreInPlace
- live-reach.ts
- offices.ts
- recorded-gh-command.ts
- assignment.ts
- observe-github-merges.ts
- ForwardingState
- routing.js
- push-destination.ts
- pre-push-boundary.ts
- github-delivery.ts
- exit-failure.ts
- telemetry/report.ts
- handover-cms.ts
- launch.mjs
- preferences-store.ts
- deploy-plan.ts
- release-floor.ts
- holdReason
- validate_wiki_pr_body.cjs
- unblock-brief.ts
- continue-ownership-read.ts
- inspect-closed-plan.ts
- restart-writer.ts
- EffectIntent
- CommittedBrain
- session-snapshot-cleanup.ts
- delivery-ownership.ts
- deploy.ts
- office-qa-handoff.ts
- packed-consumer-pnpm.ts

## God Nodes (most connected - your core abstractions)
1. `Store` - 479 edges
2. `TicketJob` - 233 edges
3. `digest()` - 175 edges
4. `command()` - 160 edges
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
- 2-file cycle: `server/workers/process.ts -> server/workers/spawn-command.ts -> server/workers/process.ts`
- 2-file cycle: `src/contracts/people.ts -> src/shared.ts -> src/contracts/people.ts`
- 2-file cycle: `src/contracts/timing.ts -> src/shared.ts -> src/contracts/timing.ts`
- 2-file cycle: `src/contracts/work.ts -> src/shared.ts -> src/contracts/work.ts`
- 3-file cycle: `server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts`

## Communities (183 total, 10 thin omitted)

### Community 0 - "run-model.ts"
Cohesion: 0.04
Nodes (125): LedgerOptions, AttributedFailure, claudeGeneration(), ClaudeSignIn, normalizeClaudeToken(), readClaudeSignIn(), claimText(), codexCanDispatch() (+117 more)

### Community 1 - "PeoplePanel.tsx"
Cohesion: 0.11
Nodes (39): label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+31 more)

### Community 2 - "worker-runtime.ts"
Cohesion: 0.05
Nodes (53): candidateWorkspaceEnvironment(), assignmentSubject(), lessonPurpose(), selectLessons(), catalogLine(), assertBriefingScope(), contextPacket(), DeliverySlot (+45 more)

### Community 3 - "features/workflow.ts"
Cohesion: 0.07
Nodes (62): approveFeature(), commandFeature(), featureById(), mutation(), reviewQuestions(), assertFeatureDependencyOrder(), featureDependencyEdges(), key() (+54 more)

### Community 4 - "cx"
Cohesion: 0.09
Nodes (90): Outbox(), blockedSummary(), itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps(), ServiceHealthPanel(), followUp() (+82 more)

### Community 5 - "accept-stage-result.ts"
Cohesion: 0.10
Nodes (39): OwnershipRead, consumeQAPlanRetry(), metadataCarriedAdvisoryIds(), ownedBefore(), QA_STAGES, reviewAdvisoryIds(), Reviewed, withoutReviewAdvisories() (+31 more)

### Community 6 - "budget-ledger.ts"
Cohesion: 0.05
Nodes (63): abandonExpired(), Admission, admit(), admitDeployment(), balance(), bindEvidence(), count(), errcode() (+55 more)

### Community 7 - "index.tsx"
Cohesion: 0.05
Nodes (86): ctoInputFailure(), OutboxCTOInput(), recover(), OutboxSavedImplementation(), apply(), review(), OutboxSavedPlan(), reconcile() (+78 more)

### Community 8 - "process.ts"
Cohesion: 0.04
Nodes (90): credentialOptions(), citationFault(), CitationSchema, ClaimedRange, ResolvedRange, SourceVersions, sourceVersions(), inHistoryOf() (+82 more)

### Community 9 - "TelemetryPanel.tsx"
Cohesion: 0.10
Nodes (38): TelemetryReport, AzureBuild, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens(), usd() (+30 more)

### Community 10 - "pilot-delivery.ts"
Cohesion: 0.09
Nodes (46): dispatchNightly(), drainDelivery(), requestDelivery(), startPilot(), OfficeQAHandoffInput, RESUME_STEP, eligibility(), Admission (+38 more)

### Community 11 - ".transaction"
Cohesion: 0.11
Nodes (32): featureItemComplete(), reconcileFeatureCompletion(), currentApproval(), automaticIntakeWait(), helperTelemetry(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS (+24 more)

### Community 12 - "OfficeSnapshot"
Cohesion: 0.09
Nodes (44): jiraQueueProgress(), nextStage(), deliveryRoles, JiraQueueProgress, TicketProgress, OfficeSnapshot, ROLE_NAMES, STAGE_LABELS (+36 more)

### Community 13 - "learning-events.ts"
Cohesion: 0.21
Nodes (14): distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementIntakeGate(), captureLearning(), learningDigest(), recordLearningOpportunity() (+6 more)

### Community 14 - "request.ts"
Cohesion: 0.09
Nodes (59): MISSING_NATIVE_LINK, VERB, REBASE, rebaseArgs(), rebaseComment(), belongsTo(), matchesRedo(), prefix() (+51 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.12
Nodes (53): accounting, DeliverySubject, nonDelivery, originalReads, createFeature(), assertEnrollable(), assessmentSignal(), AssessmentSignals (+45 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.11
Nodes (39): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, BlockingTrigger, blockingTrigger(), isBlocking() (+31 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.12
Nodes (32): baselined(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences(), clip(), maintenanceBlockedId(), MaintenanceCandidate (+24 more)

### Community 18 - "write-boundary.ts"
Cohesion: 0.03
Nodes (120): mergeEffects(), officeMerge(), ActiveEntry, effectId(), entry(), fail(), GitHubAppConfig, KeychainKeySource (+112 more)

### Community 19 - "sandbox-qualification.ts"
Cohesion: 0.04
Nodes (97): timeoutsValid(), ReaderAuthentication, DirectoryFacts, RunDirectories, within(), ALLOW_PROBES, BatteryExpected, Binding (+89 more)

### Community 20 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 21 - "overseer-launch.mjs"
Cohesion: 0.07
Nodes (80): acquireLauncherLock(), alone(), ancestry(), assertDirectoryOrAbsent(), attemptRecord(), bounded(), boundedString(), checkOwnedFile() (+72 more)

### Community 22 - "intake-scope.ts"
Cohesion: 0.21
Nodes (14): enumerateIntakeList(), inPickupOrder(), Intake, text(), escaped(), IntakeBinding, intakeEnumeration(), intakeJql() (+6 more)

### Community 23 - "jira-time.ts"
Cohesion: 0.08
Nodes (46): attempted(), attemptState(), bound(), covers(), jiraAttempts(), JiraAttemptState, open(), provenNeverSent() (+38 more)

### Community 24 - "ref_node_path"
Cohesion: 0.06
Nodes (81): continueUnsealedQA(), entry(), MISSING_SAVED_PLAN, assertParkDecision(), related, allowed, candidateInput(), children (+73 more)

### Community 25 - "projects.ts"
Cohesion: 0.09
Nodes (34): implementationContinuationRoute(), qaPlanRetryRoute(), slackSendPrompt(), servedOutbox(), assertQuestionVisibility(), isNotice(), goalHistory(), CEC (+26 more)

### Community 26 - "sanitize"
Cohesion: 0.10
Nodes (21): channelNoticeAuthorized(), slackVerifyPrompt(), comparableSlackText(), labelIsUrl(), dueSlackReread(), rereadUncertainSlack(), runningRevision(), settleRequestedSlackReplacement() (+13 more)

### Community 27 - "Ticket"
Cohesion: 0.10
Nodes (31): carriedNotRepeated(), changeScopeNote(), Scoped, movedHeadNote(), cecPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), resolvedDecisionNote() (+23 more)

### Community 28 - "assertDeliveryMayMutate"
Cohesion: 0.08
Nodes (73): ProjectCard, requireDeliveryAuthority(), assertDeliveryMayMutate(), assertMayMutate(), advanceMetadataPark(), Parked, releaseWords(), sentAnything() (+65 more)

### Community 29 - "knowledge/routes.ts"
Cohesion: 0.12
Nodes (24): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, GraphNode (+16 more)

### Community 30 - "digest"
Cohesion: 0.06
Nodes (84): runHarnessStage(), harnessDelivers(), legacyRecovery(), parkUnadmittedMetadata(), stagePrompt(), StagePromptInput, createdContentSha256(), historyBeforeWrite() (+76 more)

### Community 31 - "draft-provenance.ts"
Cohesion: 0.17
Nodes (20): maintenanceVerifiedDraft(), returnDraftToPromotion(), readRejection(), verifiedCloseoutCleanupRequest(), DraftProvenance, draftStep(), draftWorker(), MaintenanceDraft (+12 more)

### Community 32 - "reader-profiles.ts"
Cohesion: 0.12
Nodes (23): CODEX_LAST_MESSAGE_ARGUMENT, CODEX_SCHEMA_ARGUMENT, errorCode(), prepareReaderInput(), ReaderFiles, readerFiles(), writeExclusive(), CLAUDE_EFFORTS (+15 more)

### Community 33 - "run.ts"
Cohesion: 0.19
Nodes (14): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, OFFICE_FIX_PROMPT, OfficeFixResult, validateOfficeFix(), investigationReady(), InvestigationOptions, InvestigationReport (+6 more)

### Community 34 - "Coordinator"
Cohesion: 0.08
Nodes (4): SettleInputs, coordination(), Coordinator, AssignedIssue

### Community 35 - "common.cjs"
Cohesion: 0.16
Nodes (23): connections(), fs, main(), path, atomicWrite(), crypto, { execFileSync }, fs (+15 more)

### Community 36 - "pr-observation-shape.ts"
Cohesion: 0.21
Nodes (19): githubPRDescription(), closingDirectives(), ObservedPR, enumValue(), fail(), graphqlPR(), mapped(), member() (+11 more)

### Community 37 - "routing.cjs"
Cohesion: 0.15
Nodes (24): adjacency(), edgeCost(), edgeKey(), edgeType(), EVIDENCE_TYPE_PRIORITY, formatBytes(), formatGithubRef(), formatRoute() (+16 more)

### Community 38 - "entry.ts"
Cohesion: 0.08
Nodes (30): LessonSelection, EntryRead, EntrySchema, ID_MAX, parseEntry(), PATH_MAX, PATHS_MAX, PLAYBOOK_KINDS (+22 more)

### Community 39 - "pendingRounds"
Cohesion: 0.24
Nodes (14): confirmBrief(), applyHarnessAction(), HarnessActionInput, harnessQuestion(), recoveryPreconditions(), recoveryTarget(), pendingQuestions(), canReleaseOrdinary() (+6 more)

### Community 40 - "approach.ts"
Cohesion: 0.18
Nodes (17): DECISION_KINDS, needsDecision(), APPROACH_GUARD_REJECTION, recordJobApproach(), Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate() (+9 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.16
Nodes (25): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence(), CaptureContext (+17 more)

### Community 42 - "lesson-selection.ts"
Cohesion: 0.09
Nodes (32): guidanceExcerpt(), digest(), officeKnowledgeSnapshot(), LessonBrainAudit, LessonBrainOverlap, lessonForProject(), INSTALLED, installedLesson() (+24 more)

### Community 43 - ".save"
Cohesion: 0.11
Nodes (50): resolveBlockedTransition(), document(), transitionWithComment(), jiraAccount(), jiraCollection(), JiraCredential, jiraCredential(), KEYCHAIN_SERVICE (+42 more)

### Community 44 - "Offices"
Cohesion: 0.14
Nodes (4): QuestionNotifications, projectById(), Offices, SessionBridge

### Community 45 - "harness-baseline.ts"
Cohesion: 0.15
Nodes (22): BaselineReport, baselineReport(), BaselineSource, baselineText(), millions(), row(), share(), add() (+14 more)

### Community 46 - "credential-spans.ts"
Cohesion: 0.06
Nodes (37): AFTER_LABEL, BARE_LABEL, BARE_UNIT, BARE_VALUE, CAMEL_START, CONTROL_ESCAPE, CREDENTIAL_NAME, GAP (+29 more)

### Community 47 - "rate-limit-samples.ts"
Cohesion: 0.12
Nodes (12): bindGitHubRunner(), Runner, GitHubCalls, AppPrincipals, serviceAppPrincipals, QuotaGovernor, iso(), of() (+4 more)

### Community 48 - "goal-reviews.ts"
Cohesion: 0.12
Nodes (22): currentCitations(), Fact, NOT_CURRENT, PROVIDER_ERROR, applyGoalReview(), DailyResultSchema, DeliveryJob, EvidenceRefSchema (+14 more)

### Community 49 - "index.ts"
Cohesion: 0.05
Nodes (48): IncidentsRouteContext, HaltResult, RunnerReports, failure(), halt(), parse(), readFailure(), REPORT_LIMIT (+40 more)

### Community 50 - "features.ts"
Cohesion: 0.08
Nodes (41): FeatureApproval, FeatureAttempt, FeatureAuthority, FeatureBaseline, FeatureDocument, FeatureHandoff, FeatureHarnessAction, FeatureHarnessOption (+33 more)

### Community 51 - "readable-jira-comment.ts"
Cohesion: 0.10
Nodes (31): CommentPage, commentReadback(), devUpdate(), HEADLINE, JiraOperations, jiraRecord(), unpack(), postDevUpdate() (+23 more)

### Community 52 - "investigations/ledger.ts"
Cohesion: 0.20
Nodes (14): acceptedCompletionResolution(), finishedSubjectResolution(), interruptedQARerunResolution(), investigationResolution(), syncInvestigations(), NOTIFY_HELPER, notifyHelperResolution(), investigatesLimitRefusal() (+6 more)

### Community 53 - "timed-statements.ts"
Cohesion: 0.17
Nodes (14): StoreTiming, StoreTimings, storeTimings(), NAMED, rowsText(), rowText(), SQL_TOKEN, statementName() (+6 more)

### Community 54 - "jiraBinding"
Cohesion: 0.17
Nodes (9): Assignment, contentSchema(), JiraIssuePublisher, jiraText(), Transition, descriptionPreimage(), plain(), publicationDescription() (+1 more)

### Community 55 - "easternDay"
Cohesion: 0.21
Nodes (14): expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), EASTERN, easternDay() (+6 more)

### Community 56 - "pass.ts"
Cohesion: 0.04
Nodes (125): FailureEvent, failureLine(), readCeiling(), parseCeiling(), guardPresent(), overseerCommand(), reconcileArgs(), resolveCliRoot() (+117 more)

### Community 57 - "assignment-poll.ts"
Cohesion: 0.05
Nodes (72): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), BLOCK, harnessBlockMove(), harnessParkedCard(), noted(), admitReadyCards() (+64 more)

### Community 58 - "fact-bounds.ts"
Cohesion: 0.25
Nodes (15): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+7 more)

### Community 59 - "work.ts"
Cohesion: 0.11
Nodes (22): effectiveCause(), REPLACED, BLOCKED_CAUSES, blockedCauses(), NONE, explanation(), LABELS, stoppedReason() (+14 more)

### Community 60 - "cost-ledger.ts"
Cohesion: 0.16
Nodes (27): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress(), effectId() (+19 more)

### Community 61 - "assignments.ts"
Cohesion: 0.10
Nodes (25): clip(), DEMAND_LIMIT, demandFacts(), DemandSection, key(), LessonKey, notes(), AssignmentLookups (+17 more)

### Community 62 - "call-ledger.ts"
Cohesion: 0.25
Nodes (10): add(), addSource(), busiest(), CallLedger, Entry, sourceRows(), Sources, CallCounts (+2 more)

### Community 63 - "MapView.tsx"
Cohesion: 0.06
Nodes (61): KnowledgeActivity, KnowledgeEdge, KnowledgeMap, KnowledgeNode, ChatMarkdown(), ChatMarkdown, MessageText(), Activity() (+53 more)

### Community 64 - "constellation-runtime.ts"
Cohesion: 0.07
Nodes (35): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), CameraPose, flightPose(), cameraTarget() (+27 more)

### Community 65 - "validate_pr_body.cjs"
Cohesion: 0.36
Nodes (8): fs, main(), readableText(), REQUIRED_CHECKS, REQUIRED_SECTIONS, sections(), validatePullRequestBody(), withoutComments()

### Community 66 - "audit-plan-candidates.cjs"
Cohesion: 0.14
Nodes (31): audit(), branchIssueNumbers(), classify(), distinctiveTitleWords(), { execFileSync }, extractPaths(), findPrForMergeSubject(), fmtCommit() (+23 more)

### Community 67 - "runner-report.ts"
Cohesion: 0.05
Nodes (59): Digest, Evidence, FAILURE_ID, FailureAnswer, failureDigest(), FailureReceipt, HaltAnswer, haltCondition() (+51 more)

### Community 68 - "resume-arrivals.ts"
Cohesion: 0.08
Nodes (87): canonical(), redactEvidence(), admitRepairWaits(), Covered, COVERING, expiryEvent(), expiryId(), lastProgress() (+79 more)

### Community 69 - "App.tsx"
Cohesion: 0.04
Nodes (76): createConversationDrafts(), BrainDrawer(), themeColor, App(), BrainWorkspace, CONNECTION, CONNECTION_DOT, dockItemVariants (+68 more)

### Community 70 - "OfficeScene.tsx"
Cohesion: 0.07
Nodes (64): itAgent(), itDiagnostics(), followUpStatus(), outstandingFollowUps(), displayAgentTask(), withoutElapsed(), CameraBookmark, restoreBookmark() (+56 more)

### Community 71 - "spawn-command.ts"
Cohesion: 0.18
Nodes (17): childEnvironment(), inactivityWatch(), At, Errno, errno(), GroupInventory, GroupProbe, LifecycleDiagnostic (+9 more)

### Community 72 - "session-context-file.ts"
Cohesion: 0.20
Nodes (15): ContextFoldPrefix, contextFoldPrefix(), SessionContextCheckpoint, captureSessionContextClone(), ContextReadPhase, SessionContextDeadline, sessionContextFile(), ContextReadChanged (+7 more)

### Community 73 - "project-bindings-config.ts"
Cohesion: 0.07
Nodes (53): AUTO_ADOPT_BOTS, AutoAdoptBot, EffectiveAutoAdopt, effectiveAutoAdopt(), assertFeaturePlanningConfig(), FeaturePlanningBindings, goalEvidencePath(), azureSchema (+45 more)

### Community 74 - "session-scope.ts"
Cohesion: 0.20
Nodes (16): Bound, claudeScopeParser(), claudeSessionScope(), CODEX_ROLLOUTS, contextReaders(), retainSessionMessage(), SessionConversation, escaped() (+8 more)

### Community 75 - "service-health.ts"
Cohesion: 0.05
Nodes (53): savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), withGitHubSource(), heldFor(), ITContext, diagnosticSnapshot() (+45 more)

### Community 76 - "project-bindings.ts"
Cohesion: 0.07
Nodes (45): AzureMonitor, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs(), fullActivePRs(), observation() (+37 more)

### Community 77 - "closeout-recovery.ts"
Cohesion: 0.08
Nodes (53): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+45 more)

### Community 78 - "incidents.ts"
Cohesion: 0.06
Nodes (70): attributedRecords(), foldsItsRun(), groupCandidates(), ObservedIncident, ObservedSubject, digest(), fingerprint(), incidentId() (+62 more)

### Community 79 - "agents.ts"
Cohesion: 0.07
Nodes (40): implementationWorkerContext(), RefusedQAResult, CECReadbackSchema, READBACK_OWNER_SCOPE, savedStageCompletion(), assertContinuableWorktree(), CONTINUABLE, continuationPrompt() (+32 more)

### Community 80 - "session-bridge.ts"
Cohesion: 0.11
Nodes (29): codexDaemonProcesses(), accountCodexProcesses(), CodexProcessInventory, codexProcessInventory(), DesktopSessions, unaccountedProcesses(), codexThreadMetadata(), METADATA_CHUNK (+21 more)

### Community 81 - "ref_node_crypto"
Cohesion: 0.10
Nodes (29): GitRead, nativeGitRead(), patchArgs, sha(), sourceCopyMatches(), sourceFiles(), absent(), candidateParent() (+21 more)

### Community 82 - "coordination-tick.ts"
Cohesion: 0.10
Nodes (27): reconcileNoticeConfirmations(), dependencyCompletionKey(), PrerequisitesSchema, classifyStop(), BrainStatusSchema, identity, brainCheckpointCompletion(), coverageSchema (+19 more)

### Community 83 - "remove-candidate.ts"
Cohesion: 0.13
Nodes (26): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), maintenanceCandidate(), moveAside(), moveBack(), purgeRemoved(), purging (+18 more)

### Community 84 - "viewer.js"
Cohesion: 0.19
Nodes (25): addMetaLink(), addMetaRow(), addRelationship(), applyView(), buildIndexes(), buildLegend(), buildModel(), buildRenderer() (+17 more)

### Community 85 - "maintenance/maintenance.ts"
Cohesion: 0.07
Nodes (38): maintenancePolicies(), accessibilitySources(), sourceFindings, sourceReview(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, brainResultStop() (+30 more)

### Community 86 - "stopped-record.ts"
Cohesion: 0.08
Nodes (57): capabilityBlockedReviews(), latestReviews(), boundedEvidence(), expectedWait(), StopFacts, FailedMailCheck, MailCheckOutcome, normalizeCause() (+49 more)

### Community 87 - "conversations/conversations.ts"
Cohesion: 0.09
Nodes (21): ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff(), saveGoals() (+13 more)

### Community 88 - "superseded-wiki-pr.ts"
Cohesion: 0.09
Nodes (64): commentId(), CommentIntent, CommentReceipt, conversation(), exact(), findProofComment(), matchesProofComment(), postProofComment() (+56 more)

### Community 89 - "ref_node_child_process"
Cohesion: 0.12
Nodes (20): changedPaths(), { execFileSync }, files, isMapInput(), mapOnly(), { execFileSync }, git(), publish() (+12 more)

### Community 90 - "provider-observation.ts"
Cohesion: 0.12
Nodes (29): az(), correlatedBuild(), nativeRead(), Azure, azurePipelines(), outcome(), Read, RUNS_PER_PIPELINE (+21 more)

### Community 91 - "ticket-evidence.ts"
Cohesion: 0.11
Nodes (33): Connection, twgConnection(), twgProfile(), assetDownloader(), attachmentKind(), evidenceDirectory(), storeEvidence(), blankEvidence() (+25 more)

### Community 92 - "session-context-client.ts"
Cohesion: 0.11
Nodes (19): claudeSessionContext(), readTranscript, codexSessionContext(), readRollout, packContextFailure(), PackedContextFailure, unpackContextFailure(), ContextThread (+11 more)

### Community 93 - "plans.cjs"
Cohesion: 0.13
Nodes (26): fs, main(), parse(), path, substantive(), walk(), association(), auditedDigests() (+18 more)

### Community 94 - "github.ts"
Cohesion: 0.15
Nodes (19): withGitHubOperation(), GitHubMonitor, Api, terminalPRs(), backgroundHold(), CORE_RESERVE, GRAPHQL_WORK, PROBE_INTERVAL_MS (+11 more)

### Community 96 - "notifications.ts"
Cohesion: 0.18
Nodes (13): ChannelSettings, notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR, plainSlackText(), section() (+5 more)

### Community 97 - "bareSpans"
Cohesion: 0.21
Nodes (13): apostropheEnd(), bareSpans(), genuineGap(), headerValueEnd(), isQueryLabel(), labelBefore(), nameEnd(), nextAssignmentAt() (+5 more)

### Community 98 - "ticket-stage-runner.ts"
Cohesion: 0.06
Nodes (75): candidateBranchMoved(), applyChangeScope(), endChangeScope(), levels(), MAX_CHECKS, owedUnderScope(), scopeBase(), scopeOutgrown() (+67 more)

### Community 99 - "archive-plan.cjs"
Cohesion: 0.16
Nodes (23): fs, main(), parse(), path, archive(), cell(), ensureIndex(), fromArgs() (+15 more)

### Community 100 - "call-scope.ts"
Cohesion: 0.10
Nodes (39): boardReadFailure(), failed(), githubAuthError(), graphqlCounts(), refusedByRateLimit(), revalidated, slurpedPages(), succeeded() (+31 more)

### Community 101 - "unsent-time.ts"
Cohesion: 0.08
Nodes (32): JiraAttempt, JiraWorklogAttempt, JiraWorklogExpected, JiraWorklogReconcile, publishableEntry(), settlementPending(), superseded(), ticketUnresolved() (+24 more)

### Community 102 - "intent.ts"
Cohesion: 0.14
Nodes (15): savedImplementation(), ContinuationIO, continueImplementation(), nativeIO, assertOwnership(), ImplementationDecision, implementationPreview(), assertCandidateIdle() (+7 more)

### Community 103 - "on-merge-sync.cjs"
Cohesion: 0.14
Nodes (33): fs, main(), path, { spawnSync }, hasSymlinkComponent(), fieldSpan(), frontmatterProblems(), keyPattern() (+25 more)

### Community 104 - "backup-stores.ts"
Cohesion: 0.10
Nodes (36): absentAdmission(), AdmissionComparison, AdmissionSnapshot, compareAdmissions(), snapshotAdmissions(), BackupEntry, BackupInput, BackupInventory (+28 more)

### Community 105 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 106 - "controller-runtime.ts"
Cohesion: 0.09
Nodes (33): projectData(), StoreDatabase, ControllerEffects, controllerEffects(), DEPLOY_PROJECT, alive(), ControllerMachine, option() (+25 more)

### Community 107 - "harnessEffect"
Cohesion: 0.09
Nodes (66): effectKey(), LaneOperation, laneWrite(), moveCardOnce(), Lane, MOVABLE, moveLane(), resolveLane() (+58 more)

### Community 108 - "judge-resumes.ts"
Cohesion: 0.05
Nodes (59): FLAGS, incidentCommand(), IncidentCommandIO, option(), USAGE, whole(), absent(), IncidentChange (+51 more)

### Community 109 - "pr-observation-graphql.ts"
Cohesion: 0.13
Nodes (29): ChildRequest, headCheckRuns(), includeBody(), readOpenPRs(), commitOf(), ConnectionPages, embeddedHead(), fail() (+21 more)

### Community 110 - "blocker-followups.ts"
Cohesion: 0.10
Nodes (52): conversationReadbackReady(), followupOf(), pendingReadback(), queueConversationReadback(), readbackEnding(), replacedReadback(), uncertainConversations(), readBackConversations() (+44 more)

### Community 111 - "follow-production.ts"
Cohesion: 0.20
Nodes (17): awaitingJiraStatus(), awaitingProduction(), FOLLOW_DAYS, followed(), isFollowed(), Azure, AzureRead, containedIn() (+9 more)

### Community 112 - "json-layers.ts"
Cohesion: 0.26
Nodes (9): decode(), decodedIndex(), evenRunBefore(), JsonLayers, LayerString, opensValue(), SIMPLE, strings() (+1 more)

### Community 113 - "Outbox.tsx"
Cohesion: 0.08
Nodes (37): Conversation(), ConversationDraft, SendMessage, LessonDecisionAction, lessonDecisionState(), readLessonDecision(), isLessonDecision(), groups (+29 more)

### Community 114 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 115 - "run-accounting.ts"
Cohesion: 0.05
Nodes (65): BoundedRead, done(), readBoundedNoFollow(), reasonOf(), EvidenceOutcome, backfillClaudeCost(), CompletionReader, add() (+57 more)

### Community 119 - "control-store.ts"
Cohesion: 0.10
Nodes (13): Clock, applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, statementCache(), initialSnapshot(), initializeStoreSchema() (+5 more)

### Community 120 - "retrospective-subject.ts"
Cohesion: 0.16
Nodes (17): ARTIFACT_LIMIT, clip(), LEDGER_STEPS, MAINTENANCE_LIMIT, maintenanceFacts(), maintenanceSubject(), MaintenanceSubjectFacts, maintenanceKey() (+9 more)

### Community 121 - ".getEffect"
Cohesion: 0.09
Nodes (45): officeMergeProvenance(), reconcileMergeScannerRetry(), Retry, retryMergeScanner(), retryReadBack(), runIdentity(), savedRetry(), transientScannerJobs() (+37 more)

### Community 122 - "daily-cto.ts"
Cohesion: 0.12
Nodes (13): DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), dailyReviewDate(), reviewWeekday(), Briefing, saveReviewBriefing() (+5 more)

### Community 123 - "deploy-command.ts"
Cohesion: 0.10
Nodes (42): CONTROLLER_ENTRY, ControllerPin, Pin, pinnedController(), readControllerPin(), writeControllerPin(), controllerStartFailure(), controllerOf() (+34 more)

### Community 124 - "refresh-issue-state.cjs"
Cohesion: 0.22
Nodes (14): advanceFence(), githubRefs(), key(), withoutFencedCode(), { execFileSync }, fs, issueRefs(), main() (+6 more)

### Community 125 - ".emit"
Cohesion: 0.11
Nodes (34): decideImplementation(), Decision, requestQAPlanRetry(), configureChannelNotices(), configureNotices(), noticeState(), retryRecipientLookup(), recoverCTOInput() (+26 more)

### Community 126 - "Store"
Cohesion: 0.07
Nodes (42): rerunsInterruptedQA(), decidedResumeStep(), ResumeStep, resumeStep(), UnrecordedResult, unrecordedStageResult(), currentOutbox(), interruptAdoptions() (+34 more)

### Community 127 - "sign-in-unpark.ts"
Cohesion: 0.18
Nodes (19): hasPendingDelivery(), resumeAfterSignIn(), signInWait(), MAX_SIGN_IN_UNPARKS, unparkSignedIn(), waitingStep(), BrowserPage, browserPages() (+11 more)

### Community 128 - "evidence.ts"
Cohesion: 0.31
Nodes (8): investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_SOURCE_PATHS, officeSource(), launchPolicyFacts(), lifecycleFacts()

### Community 129 - "requests.ts"
Cohesion: 0.09
Nodes (39): writerRestartPending(), closeoutRequestResolved(), metadataRequestResolved(), preparationRequestResolved(), assertStoppedBaseAudit(), AuditRow, AWS_KEY_ID, CoverageRow (+31 more)

### Community 130 - "prompts/conversations.ts"
Cohesion: 0.10
Nodes (26): assertConversationReadback(), cecChatPrompt(), ctoChatPrompt(), itChatPrompt(), READABLE_REPLY, finishSupersededReadback(), pump(), defaultPickupStatus() (+18 more)

### Community 131 - "bare-value.ts"
Cohesion: 0.30
Nodes (11): BareValue, bareValue(), deeperValueEnd(), ENDS, isSeparator(), plainEscape(), queryValue(), separatorEscapeAt() (+3 more)

### Community 132 - "redact-evidence.ts"
Cohesion: 0.23
Nodes (11): BARE_CREDENTIAL, URL_USERINFO, credentialSpans(), ordered(), AWS_KEY_ID, JSON_WEB_TOKEN, PROVIDER_TOKEN, redactCredentials() (+3 more)

### Community 133 - "http/context.ts"
Cohesion: 0.21
Nodes (7): ITSpecialist, ServiceContext, DelayHistogram, LOOP_SAMPLE_MS, LoopDelay, loopDelay(), LoopDelayReport

### Community 134 - "state-parts.ts"
Cohesion: 0.11
Nodes (17): [cmd,...rawArgs], readSavedState(), LARGE_KEY_CHARS, plain(), RedactedEntries, RedactedEntry, redactEntries(), joinParts() (+9 more)

### Community 135 - "triage.ts"
Cohesion: 0.04
Nodes (89): resolveRange(), Agreement, agreement(), anchor(), compare(), disposition(), factsKey(), file() (+81 more)

### Community 136 - "knowledge.ts"
Cohesion: 0.07
Nodes (43): deliveryMetrics(), median(), learningMetrics(), BRAIN_SCOPE, SUBJECT, Kind, RetrospectiveResult, RetrospectiveResultSchema (+35 more)

### Community 137 - "dates.cjs"
Cohesion: 0.31
Nodes (12): today(), dateFromPlanBasename(), dateFromSessionPath(), evidenceDates(), fileMtimeDate(), fs, gitCommitDate(), inferPlanDate() (+4 more)

### Community 138 - "operationPaths"
Cohesion: 0.51
Nodes (8): fenceTokenDigest(), operationPaths(), createDeployToken(), readDeployToken(), removeDeployToken(), endDeployment(), holdFence(), settle()

### Community 139 - "shared.ts"
Cohesion: 0.03
Nodes (110): freshOwnershipRead(), ctoInputIdentityMatches(), ctoInputRecovered(), metadataParkAction(), ADOPTION_STALLED_MS, conversationResolved(), projectOutbox(), item() (+102 more)

### Community 140 - "TicketJob"
Cohesion: 0.07
Nodes (50): removeAdoptedClone(), namedRepairIds(), pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), discover(), hasRoutingRefs(), live(), refreshDependencies() (+42 more)

### Community 141 - "metadata-park-words.ts"
Cohesion: 0.42
Nodes (9): field(), FIELDS, MetadataField, metadataFields(), metadataParkWords(), metadataStopWords(), needed(), sentence() (+1 more)

### Community 142 - "scheduler.ts"
Cohesion: 0.16
Nodes (13): PROJECT_LOCAL, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch(), deliveryOccupied() (+5 more)

### Community 144 - "reconcile-merges.cjs"
Cohesion: 0.21
Nodes (15): remoteSlug(), collectPulls(), copyWikiForDryRun(), { execFileSync }, flattenPages(), fs, githubRequest(), isWikiBotPull() (+7 more)

### Community 145 - "delivery-task.ts"
Cohesion: 0.33
Nodes (6): APPROACH_GUIDANCE, deliveryTask(), DeliveryTaskInput, DISCOVERY_GUIDANCE, compactSteps(), featureDeliveryContext()

### Community 146 - "artifact"
Cohesion: 0.05
Nodes (107): ownershipReadHistory(), containedFile(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash (+99 more)

### Community 147 - "engine.ts"
Cohesion: 0.07
Nodes (14): applyIntakeObservation(), checkMail(), drainMail(), requestMail(), enableNightly(), ingest(), MergeNotifications, noQuotaHold (+6 more)

### Community 149 - "resume-control.ts"
Cohesion: 0.29
Nodes (7): absent(), NEVER_ENABLED, ResumeControl, stated(), Stored, unreadable(), ResumeSwitch

### Community 150 - "serve-graph.cjs"
Cohesion: 0.24
Nodes (10): ensureInside(), createServer(), fs, http, listen(), attempt(), main(), path (+2 more)

### Community 151 - "workKey"
Cohesion: 0.16
Nodes (23): StoppedWriter, mergedByOwner(), harnessMergeAttempted(), mergedByOfficeBot(), closeableIssue(), effectsSettled(), eligible(), officePublished() (+15 more)

### Community 152 - "restoreInPlace"
Cohesion: 0.60
Nodes (5): identity(), Json, plain(), restorable(), restoreInPlace()

### Community 153 - "live-reach.ts"
Cohesion: 0.47
Nodes (5): GIT_NETWORK, LIVE_PROVIDERS, liveReach(), networkUrl(), remoteUrls()

### Community 154 - "offices.ts"
Cohesion: 0.16
Nodes (11): leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), CONSOLIDATED, CONSOLIDATED_AT, SEEDS, seedOfficeLessons() (+3 more)

### Community 155 - "recorded-gh-command.ts"
Cohesion: 0.19
Nodes (20): assignments(), changeDirectory(), closing(), CREATE, createGuard(), flags(), named(), read() (+12 more)

### Community 156 - "assignment.ts"
Cohesion: 0.11
Nodes (27): latestQA(), notPassedInLatestQA(), QACoverage, qaCoverage(), same(), Tested, Carried, findingsOwedToRetest() (+19 more)

### Community 157 - "observe-github-merges.ts"
Cohesion: 0.30
Nodes (14): clearCooldown(), coolDown(), coolingDown(), MERGE_NOTICE_RECHECK_MS, waitKey(), waits, isMergeCommit(), issueOf() (+6 more)

### Community 160 - "push-destination.ts"
Cohesion: 0.42
Nodes (8): assertBoundPushDestination(), digest(), Execute, file(), PUSH_HOOKS, pushHookChain(), inspect(), unresolved()

### Community 161 - "pre-push-boundary.ts"
Cohesion: 0.26
Nodes (10): Event, exactCommand(), Invocation, localHookCommand(), one(), prePushRejection(), PushIdentity, retirementBoundary() (+2 more)

### Community 162 - "github-delivery.ts"
Cohesion: 0.04
Nodes (112): queueMergeNotice(), writerRestartInstruction(), findingsBlock(), BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction(), dependabotReviewGuidance() (+104 more)

### Community 163 - "exit-failure.ts"
Cohesion: 0.60
Nodes (3): exitFailure(), MONTHS, providerLimit()

### Community 164 - "telemetry/report.ts"
Cohesion: 0.19
Nodes (17): telemetryRoute(), TelemetryRow, TelemetrySync, TimeLedgerState, Acc, bump(), EASTERN, easternDay() (+9 more)

### Community 165 - "handover-cms.ts"
Cohesion: 0.40
Nodes (3): file, project, root

### Community 166 - "launch.mjs"
Cohesion: 0.05
Nodes (105): RFC-9562, BANNER, builtin(), bundleLauncher(), LAUNCHER_BUNDLE, LAUNCHER_ENTRY, launcherChunk(), REPOSITORY (+97 more)

### Community 170 - "preferences-store.ts"
Cohesion: 0.19
Nodes (9): PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS, OfficePreferences (+1 more)

### Community 171 - "deploy-plan.ts"
Cohesion: 0.12
Nodes (35): runningRevision(), runningRevision(), runtimeRevision(), ActiveRelease, readActiveRelease(), BUILD_ENV, buildRelease(), BuildReleaseOptions (+27 more)

### Community 173 - "release-floor.ts"
Cohesion: 0.33
Nodes (6): AS_COMMITTED, Execute, FloorReading, message(), readReleaseFloor(), RELEASE_FLOOR

### Community 174 - "holdReason"
Cohesion: 0.08
Nodes (44): interruptedImplementation(), Document, document(), isAccessOnlyPlan(), settledAccessOnlyState(), continueAccessOnlyPlan(), entryExists(), deliveryAdmission() (+36 more)

### Community 175 - "validate_wiki_pr_body.cjs"
Cohesion: 0.33
Nodes (5): { execFileSync }, hasCanonicalWikiBody(), maintenanceBodies, matchesMaintenanceBody(), { readFileSync }

### Community 176 - "unblock-brief.ts"
Cohesion: 0.53
Nodes (5): clearUnblockBrief(), key(), saveUnblockBrief(), UnblockBrief, unblockBrief()

### Community 177 - "continue-ownership-read.ts"
Cohesion: 0.22
Nodes (14): continueOwnershipRead(), expiredOwnershipRead(), handoffOwnership(), ReadbackOwnerDecision, ownershipReadGate(), ownershipReadState(), ownershipReadSource(), ReadOwnershipCandidate (+6 more)

### Community 178 - "inspect-closed-plan.ts"
Cohesion: 0.19
Nodes (12): closedReadonlyPlan(), Document, document(), entryExists(), inspectClosedQAPlan(), reviewedPlanGuidance, reviewedPlanGuideDigest, qaPlanEvidenceGap() (+4 more)

### Community 179 - "restart-writer.ts"
Cohesion: 0.18
Nodes (17): ATTEMPT_DELAYS_MS, nextAttemptAt(), restartStoppedWriters(), unchangedSinceAccepted(), NOT_RETRYABLE, releaseFunds(), stoppedWriter(), WRITER_STAGES (+9 more)

### Community 180 - "EffectIntent"
Cohesion: 0.09
Nodes (19): Write, FeaturePublisher, PublicationReceipt, publishFeature(), reconcilePublication(), uncertainPublications(), reserveIdentity(), GitHubIssuePublisher (+11 more)

### Community 183 - "session-snapshot-cleanup.ts"
Cohesion: 0.40
Nodes (5): SNAPSHOT_PREFIX, removeStaleSessionSnapshots(), SNAPSHOT_SWEEP_MS, STALE_SNAPSHOT_MS, sweepStaleSessionSnapshots()

### Community 184 - "delivery-ownership.ts"
Cohesion: 0.33
Nodes (4): Ownership, ownershipContext, refreshDeliveryOwnership(), RefreshOwnership

### Community 186 - "deploy.ts"
Cohesion: 0.11
Nodes (41): abandon(), advance(), deploy(), DEPLOY_STEPS, DeployFacts, append(), assertNext(), deployJournalPath() (+33 more)

### Community 187 - "office-qa-handoff.ts"
Cohesion: 0.60
Nodes (4): OfficeQAHandoff, OfficeQAHandoffInput, OfficeQAHandoffRequest, QAOwnershipProof

## Knowledge Gaps
- **1 isolated node(s):** `RFC-9562`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 1393 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `worker-runtime.ts`, `features/workflow.ts`, `accept-stage-result.ts`, `process.ts`, `pilot-delivery.ts`, `.transaction`, `OfficeSnapshot`, `learning-events.ts`, `request.ts`, `scheduled-captures.ts`, `run-retrospective.ts`, `record-trigger.ts`, `write-boundary.ts`, `jira-time.ts`, `ref_node_path`, `projects.ts`, `sanitize`, `Ticket`, `assertDeliveryMayMutate`, `knowledge/routes.ts`, `digest`, `draft-provenance.ts`, `run.ts`, `Coordinator`, `entry.ts`, `pendingRounds`, `approach.ts`, `time-scope.ts`, `lesson-selection.ts`, `.save`, `Offices`, `goal-reviews.ts`, `readable-jira-comment.ts`, `investigations/ledger.ts`, `jiraBinding`, `easternDay`, `assignment-poll.ts`, `cost-ledger.ts`, `assignments.ts`, `resume-arrivals.ts`, `service-health.ts`, `project-bindings.ts`, `closeout-recovery.ts`, `agents.ts`, `session-bridge.ts`, `ref_node_crypto`, `coordination-tick.ts`, `remove-candidate.ts`, `maintenance/maintenance.ts`, `conversations/conversations.ts`, `superseded-wiki-pr.ts`, `provider-observation.ts`, `ticket-evidence.ts`, `github.ts`, `notifications.ts`, `ticket-stage-runner.ts`, `unsent-time.ts`, `intent.ts`, `controller-runtime.ts`, `harnessEffect`, `judge-resumes.ts`, `pr-observation-graphql.ts`, `blocker-followups.ts`, `follow-production.ts`, `run-accounting.ts`, `control-store.ts`, `retrospective-subject.ts`, `.getEffect`, `.emit`, `sign-in-unpark.ts`, `evidence.ts`, `requests.ts`, `prompts/conversations.ts`, `state-parts.ts`, `knowledge.ts`, `shared.ts`, `TicketJob`, `scheduler.ts`, `delivery-task.ts`, `artifact`, `engine.ts`, `ProjectProgress`, `workKey`, `offices.ts`, `observe-github-merges.ts`, `github-delivery.ts`, `telemetry/report.ts`, `holdReason`, `continue-ownership-read.ts`, `inspect-closed-plan.ts`, `restart-writer.ts`, `EffectIntent`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **What connects `RFC-9562` to the rest of the system?**
  _1 weakly-connected nodes found - possible missing edges._
- **Should `run-model.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.03805651131268898 - nodes in this community are weakly interconnected._
- **Why does `command()` connect `process.ts` to `requests.ts`, `worker-runtime.ts`, `features/workflow.ts`, `accept-stage-result.ts`, `pilot-delivery.ts`, `shared.ts`, `TicketJob`, `artifact`, `engine.ts`, `ProjectProgress`, `write-boundary.ts`, `sandbox-qualification.ts`, `jira-time.ts`, `ref_node_path`, `command-registry.ts`, `projects.ts`, `assertDeliveryMayMutate`, `knowledge/routes.ts`, `digest`, `github-delivery.ts`, `Coordinator`, `.save`, `deploy-plan.ts`, `release-floor.ts`, `holdReason`, `Offices`, `continue-ownership-read.ts`, `inspect-closed-plan.ts`, `readable-jira-comment.ts`, `restart-writer.ts`, `EffectIntent`, `jiraBinding`, `index.ts`, `easternDay`, `cost-ledger.ts`, `service-health.ts`, `project-bindings.ts`, `closeout-recovery.ts`, `agents.ts`, `session-bridge.ts`, `ref_node_crypto`, `coordination-tick.ts`, `remove-candidate.ts`, `maintenance/maintenance.ts`, `provider-observation.ts`, `ticket-evidence.ts`, `github.ts`, `notifications.ts`, `ticket-stage-runner.ts`, `call-scope.ts`, `unsent-time.ts`, `controller-runtime.ts`, `harnessEffect`, `.getEffect`, `deploy-command.ts`, `Store`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Should `PeoplePanel.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1099290780141844 - nodes in this community are weakly interconnected._
- **Why does `sanitize()` connect `sanitize` to `prompts/conversations.ts`, `worker-runtime.ts`, `redact-evidence.ts`, `process.ts`, `shared.ts`, `projects.ts`, `assertDeliveryMayMutate`, `knowledge/routes.ts`, `digest`, `run.ts`, `index.ts`, `readable-jira-comment.ts`, `EffectIntent`, `pass.ts`, `assignments.ts`, `runner-report.ts`, `resume-arrivals.ts`, `spawn-command.ts`, `service-health.ts`, `project-bindings.ts`, `agents.ts`, `conversations/conversations.ts`, `provider-observation.ts`, `follow-production.ts`, `.emit`, `Store`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Should `worker-runtime.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05225225225225225 - nodes in this community are weakly interconnected._