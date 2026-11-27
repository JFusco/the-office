# Graph Report - the-office  (2026-11-27)

## Corpus Check
- 1372 files · ~624,835 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 7775 nodes · 32801 edges · 189 communities (181 shown, 8 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 1102 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `248ee057`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- sandbox-qualification.ts
- Role
- worker-runtime.ts
- features.ts
- cx
- github-delivery.ts
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
- worker-sandbox-run.ts
- process.ts
- overseer-launch.mjs
- cec-reads.ts
- jira-time.ts
- holdReason
- accessibility-sources.ts
- controller-runtime.ts
- cec.ts
- advance-metadata-park.ts
- assignments.ts
- digest
- ref_node_path
- triage.ts
- run.ts
- identity-runtime.ts
- common.cjs
- scheduled-work.ts
- routing.cjs
- entry.ts
- ref_node_crypto
- office-lessons.ts
- time-scope.ts
- lesson-selection.ts
- .save
- offices.ts
- harness-baseline.ts
- security.ts
- rate-limit-samples.ts
- goal-reviews.ts
- index.ts
- QuestionStepper.tsx
- Effects
- investigations/ledger.ts
- pilot-delivery.ts
- jiraBinding
- app-config.ts
- pass.ts
- .emit
- cec/workflow.ts
- work.ts
- cost-ledger.ts
- knowledge.ts
- brain-maintenance.ts
- Button
- constellation-runtime.ts
- validate_pr_body.cjs
- audit-plan-candidates.cjs
- office-client.ts
- resume-arrivals.ts
- DrawerTopic.tsx
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
- validate-stage.ts
- MaintenanceRun
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
- notifications.ts
- redactEvidence
- ticket-stage-runner.ts
- archive-plan.cjs
- metered-runner.ts
- time-readback.ts
- continue.ts
- on-merge-sync.cjs
- backup-stores.ts
- extract-worker.mjs
- deploy.ts
- harnessEffect
- judge-resumes.ts
- pr-observation-graphql.ts
- blocker-followups.ts
- follow-production.ts
- project-policy.ts
- Conversation.tsx
- slack-supersession.ts
- run-accounting.ts
- qa.ts
- qa-plan-continuation.ts
- writer-restart.ts
- store.ts
- retrospective-subject.ts
- .getEffect
- daily-cto.ts
- deploy-command.ts
- refresh-issue-state.cjs
- http/commands.ts
- conversations/slack.ts
- sign-in-unpark.ts
- it-specialist.ts
- .activeClaims
- project-bindings.ts
- contracts/overseer.ts
- time-ledger.ts
- office-authors.ts
- state-parts.ts
- corroborate.ts
- weekly-rollup.ts
- dates.cjs
- admit-repair-waits.ts
- shared.ts
- GitHubDelivery
- CorrectionCase
- Store
- production.ts
- reconcile-merges.cjs
- Ticket
- artifact
- engine.ts
- runner-root.ts
- resume-control.ts
- serve-graph.cjs
- workKey
- record-runner-failure.ts
- normalize-question.ts
- Lesson
- recorded-gh-command.ts
- carried-checks.ts
- observe-github-merges.ts
- runner-report.ts
- routing.js
- write-credential-scope.ts
- pre-push-boundary.ts
- github-context.ts
- provider-limit-resolution.ts
- telemetry/report.ts
- connectWith
- launch.mjs
- second-opinion.ts
- conversation-recovery.ts
- claude-session-context.ts
- preferences-store.ts
- deploy-plan.ts
- SessionBridge
- build-release.ts
- continue-access-only-plan.ts
- validate_wiki_pr_body.cjs
- unblock-brief.ts
- continue-ownership-read.ts
- inspect-closed-plan.ts
- salvage-worktree.ts
- write-boundary.ts
- incident-command.ts
- CommittedBrain
- session-snapshot-cleanup.ts
- delivery-ownership.ts
- candidate-ownership.ts
- wait-idle.ts
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

## Communities (189 total, 8 thin omitted)

### Community 0 - "sandbox-qualification.ts"
Cohesion: 0.06
Nodes (41): within(), ALLOW_PROBES, Binding, boundTo(), Cleanup, CLEANUP_PROBES, CleanupProbe, collectProbe() (+33 more)

### Community 1 - "Role"
Cohesion: 0.12
Nodes (37): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+29 more)

### Community 2 - "worker-runtime.ts"
Cohesion: 0.07
Nodes (40): candidateWorkspaceEnvironment(), assignmentSubject(), lessonPurpose(), selectLessons(), catalogLine(), assertBriefingScope(), contextPacket(), sanitizeObject() (+32 more)

### Community 3 - "features.ts"
Cohesion: 0.06
Nodes (70): approveFeature(), featureById(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), artifactPath(), digest() (+62 more)

### Community 4 - "cx"
Cohesion: 0.07
Nodes (103): OfficeProposal, RetrospectiveRecord, WeeklyRollup, Outbox(), blockedSummary(), ServiceHealthPanel(), followUp(), labels (+95 more)

### Community 5 - "github-delivery.ts"
Cohesion: 0.04
Nodes (99): writerRestartInstruction(), ProjectProgress, harnessCloseout(), PASSING, verifyMergeActions(), findingsBlock(), metadataCarriedAdvisoryIds(), ownedBefore() (+91 more)

### Community 6 - "budget-ledger.ts"
Cohesion: 0.06
Nodes (55): abandonExpired(), Admission, admit(), admitDeployment(), balance(), bindEvidence(), count(), errcode() (+47 more)

### Community 7 - "index.tsx"
Cohesion: 0.09
Nodes (50): LessonsView(), SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS, PickupForm() (+42 more)

### Community 8 - "incidents/routes.ts"
Cohesion: 0.05
Nodes (63): citationFault(), CitationSchema, ClaimedRange, ResolvedRange, SourceVersions, dismiss(), DISMISSAL_CITATIONS, DISMISSAL_REASON (+55 more)

### Community 9 - "TelemetryPanel.tsx"
Cohesion: 0.09
Nodes (44): CostCompleteness, CostLedgerState, TelemetryReport, TelemetryRow, UsageCompleteness, UsageSource, ValuationSource, AzureBuild (+36 more)

### Community 10 - "enrollment-gate.ts"
Cohesion: 0.12
Nodes (37): dispatchNightly(), requestDelivery(), eligibility(), Admission, admit(), admitReadyCards(), WAIT_STATUSES, dependencyEligibility() (+29 more)

### Community 11 - "overseer/commands.ts"
Cohesion: 0.08
Nodes (44): guardPresent(), overseerCommand(), reconcileArgs(), runnerStatus(), Condition, count, ForwardingSummary, Halt (+36 more)

### Community 12 - "App.tsx"
Cohesion: 0.04
Nodes (81): jiraQueueProgress(), deliveryRoles, JiraQueueProgress, TicketProgress, themeColor, App(), BrainWorkspace, CONNECTION (+73 more)

### Community 13 - "admit-improvement.ts"
Cohesion: 0.19
Nodes (19): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+11 more)

### Community 14 - "request.ts"
Cohesion: 0.09
Nodes (65): AdoptionBinding, assertAutomationAuthority(), observeAutomationConflict(), VERB, assertAutomationEffects(), automationMergePolicy(), observeAutomationMerge(), REBASE (+57 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.14
Nodes (46): accounting, DeliverySubject, nonDelivery, originalReads, createFeature(), assertEnrollable(), assessmentSignal(), AssessmentSignals (+38 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.08
Nodes (46): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, BlockingTrigger, blockingTrigger(), isBlocking() (+38 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.12
Nodes (35): baselined(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences(), clip(), maintenanceBlockedId(), MaintenanceCandidate (+27 more)

### Community 18 - "route-activation.ts"
Cohesion: 0.13
Nodes (34): ActiveEntry, QualifyEntry, RollbackEntry, RouteEntry, appHistory(), bindingMatches(), configuredBinding(), held() (+26 more)

### Community 19 - "worker-sandbox-run.ts"
Cohesion: 0.06
Nodes (72): timeoutsValid(), assertOwnedDirectory(), checkRunDirectories(), Child, CHILDREN, code(), createRunDirectories(), DIRECTORY_MODES (+64 more)

### Community 20 - "process.ts"
Cohesion: 0.11
Nodes (17): boundGitHubRunner(), credentialOptions(), PULL, OFFICE_REPOSITORY, readGitHub(), Result, ControllerMachine, CONTROLLER_RUNTIME (+9 more)

### Community 21 - "overseer-launch.mjs"
Cohesion: 0.07
Nodes (80): acquireLauncherLock(), alone(), ancestry(), assertDirectoryOrAbsent(), attemptRecord(), bounded(), boundedString(), checkOwnedFile() (+72 more)

### Community 22 - "cec-reads.ts"
Cohesion: 0.09
Nodes (37): intakeMembership(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), plainResume(), readbackDispatchGuidance(), capacityInterruptedRun(), providerSaid() (+29 more)

### Community 23 - "jira-time.ts"
Cohesion: 0.09
Nodes (41): attempted(), attemptState(), bound(), covers(), jiraAttempts(), JiraAttemptState, open(), provenNeverSent() (+33 more)

### Community 24 - "holdReason"
Cohesion: 0.07
Nodes (72): boardPreflightCandidate(), Ownership, reconcileBoardPreflight(), partialLocalCleanupCandidate(), candidateInput(), children, oldAdoptionBasis(), SavedCandidateAdmission (+64 more)

### Community 25 - "accessibility-sources.ts"
Cohesion: 0.25
Nodes (17): actionable(), closingPull(), Finding, handoffIssue(), issueLines(), issueSource(), observation, reconcileSourceEffects() (+9 more)

### Community 26 - "controller-runtime.ts"
Cohesion: 0.18
Nodes (11): controllerEffects(), alive(), option(), realMachine(), runController(), deploy(), resumeDeploy(), launchDomain() (+3 more)

### Community 27 - "cec.ts"
Cohesion: 0.11
Nodes (27): confirmsMovedHead(), Moved, movedHeadUnconfirmed(), recordConfirmedHead(), movedHeadNote(), cecPrompt(), resolvedDecisionNote(), stageInstructions (+19 more)

### Community 28 - "advance-metadata-park.ts"
Cohesion: 0.08
Nodes (71): advanceMetadataPark(), Parked, releaseWords(), sentAnything(), cardResumeRoute(), effectiveParkPickup(), PICKUP_ASSIGNEE, REVIEWABLE (+63 more)

### Community 29 - "assignments.ts"
Cohesion: 0.09
Nodes (35): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, GraphNode (+27 more)

### Community 30 - "digest"
Cohesion: 0.07
Nodes (81): createdContentSha256(), Binding, historyBeforeWrite(), matchesBoundDescription(), DescriptionEdit, DescriptionHistory, DescriptionHistoryUnavailable, descriptionRevision() (+73 more)

### Community 31 - "ref_node_path"
Cohesion: 0.06
Nodes (63): GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles(), absent() (+55 more)

### Community 32 - "triage.ts"
Cohesion: 0.12
Nodes (26): budgetRequest(), BudgetedInvocation, BudgetedOutcome, InvocationResult, CheckedOpinionInput, collectOpinion(), collectTriage(), excludedSource() (+18 more)

### Community 33 - "run.ts"
Cohesion: 0.14
Nodes (21): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_FIX_PROMPT, OfficeFixResult (+13 more)

### Community 34 - "identity-runtime.ts"
Cohesion: 0.10
Nodes (24): KeychainKeySource, appJwt(), base64url(), signingKey(), AppKeySource, Execute, keychainKeySource(), AppReadiness (+16 more)

### Community 35 - "common.cjs"
Cohesion: 0.16
Nodes (23): connections(), fs, main(), path, atomicWrite(), crypto, { execFileSync }, fs (+15 more)

### Community 36 - "scheduled-work.ts"
Cohesion: 0.09
Nodes (40): freshOwnershipRead(), deliverySlot(), verifiedCloseoutCleanupRequest(), withAmendmentOwnership(), gateFeatureWork(), requestPriority(), closedTicketReport(), closedTicketRequest() (+32 more)

### Community 37 - "routing.cjs"
Cohesion: 0.15
Nodes (24): adjacency(), edgeCost(), edgeKey(), edgeType(), EVIDENCE_TYPE_PRIORITY, formatBytes(), formatGithubRef(), formatRoute() (+16 more)

### Community 38 - "entry.ts"
Cohesion: 0.08
Nodes (30): LessonSelection, EntryRead, EntrySchema, ID_MAX, parseEntry(), PATH_MAX, PATHS_MAX, PLAYBOOK_KINDS (+22 more)

### Community 39 - "ref_node_crypto"
Cohesion: 0.10
Nodes (45): commandFeature(), reviewQuestions(), featureItemComplete(), reconcileFeatureCompletion(), discoveryPrompt(), planPrompt(), GitHubFeaturePublisher, readEvidence() (+37 more)

### Community 40 - "office-lessons.ts"
Cohesion: 0.24
Nodes (8): normalizeStatement(), decideOfficeProposal(), OfficeKnowledgeStore, proposeOfficeLessons(), retireOfficeLesson(), Input, promoteNoteLesson(), OfficeKnowledge

### Community 41 - "time-scope.ts"
Cohesion: 0.17
Nodes (24): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), JiraWorklogAttempt, midnight() (+16 more)

### Community 42 - "lesson-selection.ts"
Cohesion: 0.15
Nodes (17): INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, MAINTENANCE, MAX_LESSONS, normalPath(), PURPOSES (+9 more)

### Community 43 - ".save"
Cohesion: 0.10
Nodes (54): enumerateIntakeList(), inPickupOrder(), Intake, text(), resolveBlockedTransition(), document(), transitionWithComment(), jiraAccount() (+46 more)

### Community 44 - "offices.ts"
Cohesion: 0.06
Nodes (33): QuestionNotifications, leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), queueImprovements(), seedOfficeLessons(), collectCTOFacts() (+25 more)

### Community 45 - "harness-baseline.ts"
Cohesion: 0.15
Nodes (22): BaselineReport, baselineReport(), BaselineSource, baselineText(), millions(), row(), share(), add() (+14 more)

### Community 46 - "security.ts"
Cohesion: 0.04
Nodes (88): BareValue, bareValue(), deeperValueEnd(), ENDS, isSeparator(), plainEscape(), queryValue(), separatorEscapeAt() (+80 more)

### Community 47 - "rate-limit-samples.ts"
Cohesion: 0.12
Nodes (14): CallLedger, bindGitHubRunner(), Runner, GitHubCalls, AppPrincipals, QuotaGovernor, iso(), of() (+6 more)

### Community 48 - "goal-reviews.ts"
Cohesion: 0.13
Nodes (21): currentCitations(), Fact, NOT_CURRENT, PROVIDER_ERROR, applyGoalReview(), DailyResultSchema, DeliveryJob, EvidenceRefSchema (+13 more)

### Community 49 - "index.ts"
Cohesion: 0.05
Nodes (60): implementationPreview(), implementationContinuationRoute(), qaPlanRetryRoute(), servedOutbox(), isNotice(), readNotices(), close(), config (+52 more)

### Community 50 - "QuestionStepper.tsx"
Cohesion: 0.19
Nodes (18): FeatureQuestionProjection, OutboxQuestionRound(), send(), draftKey(), readDraft(), saveDraft(), QuestionRound(), nextQuestion() (+10 more)

### Community 51 - "Effects"
Cohesion: 0.09
Nodes (40): CommentPage, commentReadback(), devUpdate(), HEADLINE, jiraRecord(), unpack(), postDevUpdate(), OUTCOME (+32 more)

### Community 52 - "investigations/ledger.ts"
Cohesion: 0.16
Nodes (20): failureOutranks(), acceptedCompletionResolution(), investigationCandidates(), investigationId(), ctoReplacementResolution(), finishedSubjectResolution(), investigationFollowUps(), investigationHeld() (+12 more)

### Community 53 - "pilot-delivery.ts"
Cohesion: 0.15
Nodes (22): candidateBranchMoved(), endChangeScope(), scopeOutgrown(), draftHeadMovedForward(), git(), movedHeadEvent(), recordMovedHead(), continueImplementation() (+14 more)

### Community 54 - "jiraBinding"
Cohesion: 0.09
Nodes (16): Assignment, contentSchema(), JiraIssuePublisher, jiraText(), Transition, descriptionPreimage(), plain(), publicationDescription() (+8 more)

### Community 55 - "app-config.ts"
Cohesion: 0.14
Nodes (23): effectId(), entry(), fail(), GitHubAppConfig, KnownProject, only(), parseGitHubApp(), positive() (+15 more)

### Community 56 - "pass.ts"
Cohesion: 0.07
Nodes (53): FailureEvent, failureLine(), RunnerLimits, RunnerPaths, appendFailureLine(), JournalRefused, JournalView, readFailures() (+45 more)

### Community 57 - ".emit"
Cohesion: 0.05
Nodes (75): Execute, readBackOrThrow(), AlertIssue, alertIssueBody(), alertIssueTitle(), alertMarker(), closeAlertIssue(), ensureAlertIssue() (+67 more)

### Community 58 - "cec/workflow.ts"
Cohesion: 0.13
Nodes (19): applyIntakeObservation(), GATE_REFUSED, gateRefusedPass(), QA_STAGES, Carried, findingsOwedToRetest(), missingRetestDispositions(), qaPlanEvidenceGap() (+11 more)

### Community 59 - "work.ts"
Cohesion: 0.13
Nodes (19): effectiveCause(), REPLACED, BLOCKED_CAUSES, blockedCauses(), NONE, projectReadiness(), ProjectReadiness, AssignmentResult (+11 more)

### Community 60 - "cost-ledger.ts"
Cohesion: 0.14
Nodes (30): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress(), effectId() (+22 more)

### Community 61 - "knowledge.ts"
Cohesion: 0.09
Nodes (31): clip(), DEMAND_LIMIT, demandFacts(), DemandSection, key(), LessonKey, notes(), clip() (+23 more)

### Community 62 - "brain-maintenance.ts"
Cohesion: 0.15
Nodes (16): maintenancePolicies(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, brainResultStop(), GateMark, gateMark(), MAX_START_RETRIES (+8 more)

### Community 63 - "Button"
Cohesion: 0.07
Nodes (65): KnowledgeActivity, KnowledgeActivityPage, KnowledgeEdge, KnowledgeMap, KnowledgeNode, Activity(), ActivityTimeline(), AssignmentKnowledge() (+57 more)

### Community 64 - "constellation-runtime.ts"
Cohesion: 0.07
Nodes (33): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), CameraPose, flightPose(), cameraTarget() (+25 more)

### Community 65 - "validate_pr_body.cjs"
Cohesion: 0.36
Nodes (8): fs, main(), readableText(), REQUIRED_CHECKS, REQUIRED_SECTIONS, sections(), validatePullRequestBody(), withoutComments()

### Community 66 - "audit-plan-candidates.cjs"
Cohesion: 0.14
Nodes (31): audit(), branchIssueNumbers(), classify(), distinctiveTitleWords(), { execFileSync }, extractPaths(), findPrForMergeSubject(), fmtCommit() (+23 more)

### Community 67 - "office-client.ts"
Cohesion: 0.10
Nodes (26): FailureAnswer, HaltAnswer, RUNNER_DEFAULTS, officeDataRoot, realMachine(), bodyWithin(), bounded(), Envelope (+18 more)

### Community 68 - "resume-arrivals.ts"
Cohesion: 0.10
Nodes (66): restartStoppedWriters(), unchangedSinceAccepted(), WRITER_STAGES, canonical(), assessResumes(), Standing, CheckpointEligibility, checkpointEligibility() (+58 more)

### Community 69 - "DrawerTopic.tsx"
Cohesion: 0.11
Nodes (28): createConversationDrafts(), FeatureDelivery(), FeatureDocuments(), views, FeatureReading(), FeatureWorkspace(), phases, LinkedFeatures() (+20 more)

### Community 70 - "OfficeScene.tsx"
Cohesion: 0.08
Nodes (59): displayAgentTask(), withoutElapsed(), CameraBookmark, restoreBookmark(), LiveAgentTask(), Props, RunningTask(), text() (+51 more)

### Community 71 - "spawn-command.ts"
Cohesion: 0.13
Nodes (22): childEnvironment(), inactivityWatch(), At, Errno, errno(), GroupInventory, GroupProbe, LifecycleDiagnostic (+14 more)

### Community 72 - "session-context-file.ts"
Cohesion: 0.27
Nodes (12): ContextFoldPrefix, contextFoldPrefix(), SessionContextCheckpoint, captureSessionContextClone(), sessionContextFile(), ContextReadChanged, MAX_CONTEXT_READ_MS, sameContextFile() (+4 more)

### Community 73 - "projects.ts"
Cohesion: 0.07
Nodes (53): escaped(), IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), projectListScope(), cecIntakePrompt(), assertFeaturePlanningConfig() (+45 more)

### Community 74 - "session-scope.ts"
Cohesion: 0.20
Nodes (16): Bound, claudeScopeParser(), claudeSessionScope(), CODEX_ROLLOUTS, contextReaders(), retainSessionMessage(), SessionConversation, escaped() (+8 more)

### Community 75 - "service-health.ts"
Cohesion: 0.10
Nodes (25): commands(), SIGN_IN_SERVICE_TROUBLE, signInSteps(), Step, ClaudeLoginRefusal, claudeLoginRefusal(), claudeRefusalWords(), RECORDED_REFUSALS (+17 more)

### Community 76 - "OfficeProject"
Cohesion: 0.08
Nodes (42): AzureMonitor, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs(), fullActivePRs(), observation() (+34 more)

### Community 77 - "requests.ts"
Cohesion: 0.07
Nodes (58): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+50 more)

### Community 78 - "incidents.ts"
Cohesion: 0.06
Nodes (66): attributedRecords(), foldsItsRun(), groupCandidates(), ObservedIncident, ObservedSubject, digest(), fingerprint(), incidentId() (+58 more)

### Community 79 - "agents.ts"
Cohesion: 0.05
Nodes (47): implementationWorkerContext(), RefusedQAResult, savedStageCompletion(), assertContinuableWorktree(), CONTINUABLE, continuationPrompt(), MAX_CONTINUATIONS, recordedContinuation() (+39 more)

### Community 80 - "session-bridge.ts"
Cohesion: 0.14
Nodes (21): codexDaemonProcesses(), accountCodexProcesses(), CodexProcessInventory, codexProcessInventory(), unaccountedProcesses(), codexThreadMetadata(), METADATA_CHUNK, BARE (+13 more)

### Community 81 - "validate-stage.ts"
Cohesion: 0.17
Nodes (17): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+9 more)

### Community 82 - "MaintenanceRun"
Cohesion: 0.17
Nodes (14): BrainStatusSchema, identity, brainCheckpointCompletion(), coverageSchema, verified, PublishedPR, publishedWorkCleanedUp(), nativeChecks (+6 more)

### Community 83 - "remove-candidate.ts"
Cohesion: 0.14
Nodes (23): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), maintenanceCandidate(), moveAside(), moveBack(), purgeRemoved(), purging (+15 more)

### Community 84 - "viewer.js"
Cohesion: 0.19
Nodes (25): addMetaLink(), addMetaRow(), addRelationship(), applyView(), buildIndexes(), buildLegend(), buildModel(), buildRenderer() (+17 more)

### Community 85 - "maintenance/maintenance.ts"
Cohesion: 0.14
Nodes (19): captureMaintenanceStep(), accessibilitySources(), sourceFindings, sourceReview(), CmsFollowUpContext, cmsFollowUpInstructions(), easternDate(), GitHubMaintenance (+11 more)

### Community 86 - "stopped-record.ts"
Cohesion: 0.09
Nodes (48): capabilityBlockedReviews(), latestReviews(), boundedEvidence(), expectedWait(), StopFacts, normalizeCause(), IncidentCollector, improvements() (+40 more)

### Community 87 - "sanitize"
Cohesion: 0.07
Nodes (42): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+34 more)

### Community 88 - "superseded-wiki-pr.ts"
Cohesion: 0.10
Nodes (58): commentId(), CommentIntent, CommentReceipt, conversation(), exact(), findProofComment(), matchesProofComment(), postProofComment() (+50 more)

### Community 89 - "ref_node_child_process"
Cohesion: 0.12
Nodes (20): changedPaths(), { execFileSync }, files, isMapInput(), mapOnly(), { execFileSync }, git(), publish() (+12 more)

### Community 90 - "provider-observation.ts"
Cohesion: 0.13
Nodes (26): az(), correlatedBuild(), Azure, azurePipelines(), outcome(), Read, RUNS_PER_PIPELINE, Api (+18 more)

### Community 91 - "ticket-evidence.ts"
Cohesion: 0.11
Nodes (32): Connection, twgConnection(), twgProfile(), assetDownloader(), attachmentKind(), evidenceDirectory(), storeEvidence(), blankEvidence() (+24 more)

### Community 92 - "session-context-client.ts"
Cohesion: 0.14
Nodes (15): packContextFailure(), PackedContextFailure, unpackContextFailure(), ContextThread, contextThread(), postedProjects(), THREAD_ANSWER_MS, THREAD_STOPPED (+7 more)

### Community 93 - "plans.cjs"
Cohesion: 0.13
Nodes (26): fs, main(), parse(), path, substantive(), walk(), association(), auditedDigests() (+18 more)

### Community 94 - "assignment-poll.ts"
Cohesion: 0.03
Nodes (97): currentOutbox(), reconcileNoticeConfirmations(), IntakeContext, confirmedGone(), goneQuery(), STOPPED, stoppedReviewKeys(), adoptDependabot() (+89 more)

### Community 96 - "notifications.ts"
Cohesion: 0.17
Nodes (15): ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR, plainSlackText() (+7 more)

### Community 97 - "redactEvidence"
Cohesion: 0.12
Nodes (35): sourceVersions(), inHistoryOf(), CompareMemory, compareMemory(), COMPARES_PER_PASS, comparison(), DeployedFixes, DeployedFixesInput (+27 more)

### Community 98 - "ticket-stage-runner.ts"
Cohesion: 0.12
Nodes (36): applyChangeScope(), levels(), MAX_CHECKS, owedUnderScope(), scopeBase(), settled(), statedApproach(), verifiedCandidate() (+28 more)

### Community 99 - "archive-plan.cjs"
Cohesion: 0.16
Nodes (23): fs, main(), parse(), path, archive(), cell(), ensureIndex(), fromArgs() (+15 more)

### Community 100 - "metered-runner.ts"
Cohesion: 0.08
Nodes (44): boardReadFailure(), add(), addSource(), busiest(), Entry, sourceRows(), Sources, CallCounts (+36 more)

### Community 101 - "time-readback.ts"
Cohesion: 0.13
Nodes (16): JiraAttempt, JiraWorklogExpected, JiraWorklogReconcile, Ledger, Read, TimeLedger, missedSinceVerified(), Readback (+8 more)

### Community 102 - "continue.ts"
Cohesion: 0.38
Nodes (4): ContinuationIO, nativeIO, assertCandidateIdle(), Read

### Community 103 - "on-merge-sync.cjs"
Cohesion: 0.14
Nodes (33): fs, main(), path, { spawnSync }, hasSymlinkComponent(), fieldSpan(), frontmatterProblems(), keyPattern() (+25 more)

### Community 104 - "backup-stores.ts"
Cohesion: 0.14
Nodes (27): absentAdmission(), AdmissionComparison, AdmissionSnapshot, compareAdmissions(), snapshotAdmissions(), BackupEntry, BackupInput, BackupInventory (+19 more)

### Community 105 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 106 - "deploy.ts"
Cohesion: 0.10
Nodes (45): StoreDatabase, ControllerEffects, DEPLOY_PROJECT, abandon(), advance(), DEFAULT_TIMINGS, DeployContext, DeployTimings (+37 more)

### Community 107 - "harnessEffect"
Cohesion: 0.10
Nodes (50): BLOCK, harnessBlockMove(), harnessParkedCard(), noted(), effectKey(), LaneOperation, laneWrite(), moveCardOnce() (+42 more)

### Community 108 - "judge-resumes.ts"
Cohesion: 0.07
Nodes (45): eventId(), boundaryCrossed(), Crossing, Progress, CheckpointProgress, checkpointProgress(), names(), nativeProof() (+37 more)

### Community 109 - "pr-observation-graphql.ts"
Cohesion: 0.08
Nodes (48): githubPRDescription(), ChildRequest, headCheckRuns(), closingDirectives(), includeBody(), ObservedPR, readOpenPRs(), commitOf() (+40 more)

### Community 110 - "blocker-followups.ts"
Cohesion: 0.10
Nodes (43): NO_RECORD, recoveryRecord(), followupRecord(), handoff(), heldForRepair(), reconcileBlockerFollowups(), actionKey(), bindHandoff() (+35 more)

### Community 111 - "follow-production.ts"
Cohesion: 0.20
Nodes (17): awaitingJiraStatus(), awaitingProduction(), FOLLOW_DAYS, followed(), isFollowed(), Azure, AzureRead, containedIn() (+9 more)

### Community 112 - "project-policy.ts"
Cohesion: 0.14
Nodes (18): AUTO_ADOPT_BOTS, AutoAdoptBot, EffectiveAutoAdopt, effectiveAutoAdopt(), OfficeConfigInputs, officeConfigRoute(), officeConfigSummary(), projectSettingsSummary() (+10 more)

### Community 113 - "Conversation.tsx"
Cohesion: 0.08
Nodes (37): GoalProgress, ChatMarkdown(), Conversation(), ConversationDraft, SendMessage, isLessonDecision(), ChatMarkdown, MessageText() (+29 more)

### Community 114 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 115 - "run-accounting.ts"
Cohesion: 0.06
Nodes (58): BoundedRead, done(), readBoundedNoFollow(), reasonOf(), add(), CodexRequest, CodexRollout, CodexTokens (+50 more)

### Community 119 - "store.ts"
Cohesion: 0.07
Nodes (40): Clock, EASTERN, easternDayFormatter, easternPartsFormatter, systemClock, DATA, checkpointLabel(), applyConnectionSettings() (+32 more)

### Community 120 - "retrospective-subject.ts"
Cohesion: 0.20
Nodes (14): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, maintenanceKey(), azurePrUrl(), findSubject(), jobSubject() (+6 more)

### Community 121 - ".getEffect"
Cohesion: 0.12
Nodes (21): publishFeature(), GitHubOperations, validateGitHubIssue(), executeGitHubWrite(), reconcileGitHubWrite(), withWriteCredential(), writerRefused(), writerSuccessor() (+13 more)

### Community 122 - "daily-cto.ts"
Cohesion: 0.12
Nodes (14): DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), dailyReviewDate(), reviewWeekday(), queueGoalEvidenceRequest(), Briefing (+6 more)

### Community 123 - "deploy-command.ts"
Cohesion: 0.10
Nodes (47): CONTROLLER_ENTRY, ControllerPin, Pin, pinnedController(), readControllerPin(), writeControllerPin(), controllerStartFailure(), controllerOf() (+39 more)

### Community 124 - "refresh-issue-state.cjs"
Cohesion: 0.22
Nodes (14): advanceFence(), githubRefs(), key(), withoutFencedCode(), { execFileSync }, fs, issueRefs(), main() (+6 more)

### Community 125 - "http/commands.ts"
Cohesion: 0.18
Nodes (18): configureNotices(), noticeState(), DiscoveryResumeInput, requeueWaitedImplement(), enqueueMetadataRecovery(), baselineLearning(), configureKnowledge(), declineLessonIssue() (+10 more)

### Community 126 - "conversations/slack.ts"
Cohesion: 0.11
Nodes (22): channelNoticeAuthorized(), MergeNotifications, comparableSlackText(), labelIsUrl(), SlackMessages, SlackRequestSchema, SlackResultSchema, SlackVerificationSchema (+14 more)

### Community 127 - "sign-in-unpark.ts"
Cohesion: 0.15
Nodes (22): parksInJira(), currentEnvironmentWait(), environmentWait(), hasPendingDelivery(), resumeAfterSignIn(), signInWait(), isSetupStop(), MAX_SIGN_IN_UNPARKS (+14 more)

### Community 128 - "it-specialist.ts"
Cohesion: 0.28
Nodes (10): replacedReadback(), heldFor(), ITContext, recoveryHeld(), recoveryWait(), informationalRecovery(), ownAzureCheck(), delays (+2 more)

### Community 129 - ".activeClaims"
Cohesion: 0.06
Nodes (57): ownershipReadHistory(), ATTEMPT_DELAYS_MS, nextAttemptAt(), NOT_RETRYABLE, releaseFunds(), StoppedWriter, stoppedWriter(), WriterRestartCandidate (+49 more)

### Community 130 - "project-bindings.ts"
Cohesion: 0.21
Nodes (11): cecChatPrompt(), ctoChatPrompt(), READABLE_REPLY, defaultPickupStatus(), boundedCTOContext(), project(), bindings(), Project (+3 more)

### Community 131 - "contracts/overseer.ts"
Cohesion: 0.08
Nodes (23): common, CorrectionCaseSchema, DispositionSchema, EventReferenceSchema, FalsePositive, FileReferenceSchema, HarnessDefect, HarnessDefectResult (+15 more)

### Community 132 - "time-ledger.ts"
Cohesion: 0.24
Nodes (13): publishableEntry(), settlementPending(), superseded(), ticketUnresolved(), syncing, clearUnsent(), dueUnsent(), markUnsent() (+5 more)

### Community 133 - "office-authors.ts"
Cohesion: 0.28
Nodes (12): mergeEffects(), officeMerge(), officeMergeProvenance(), githubIdentity(), appSelected(), discoveredAuthor(), discoveryAuthors(), expectedAuthor() (+4 more)

### Community 134 - "state-parts.ts"
Cohesion: 0.08
Nodes (26): [cmd,...rawArgs], APPENDED_TABLE, comparableRow(), START_EVENT_KINDS, START_STATE_SHAPES, withoutStartValue(), withoutStartValues(), readSavedState() (+18 more)

### Community 135 - "corroborate.ts"
Cohesion: 0.13
Nodes (26): resolveRange(), Agreement, agreement(), anchor(), compare(), disposition(), factsKey(), file() (+18 more)

### Community 136 - "weekly-rollup.ts"
Cohesion: 0.10
Nodes (31): learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), BRAIN_SCOPE (+23 more)

### Community 137 - "dates.cjs"
Cohesion: 0.31
Nodes (12): today(), dateFromPlanBasename(), dateFromSessionPath(), evidenceDates(), fileMtimeDate(), fs, gitCommitDate(), inferPlanDate() (+4 more)

### Community 138 - "admit-repair-waits.ts"
Cohesion: 0.26
Nodes (12): admitRepairWaits(), COVERING, expiryEvent(), expiryId(), lastProgress(), progressOf(), RepairWaitEntry, RepairWaitPass (+4 more)

### Community 139 - "shared.ts"
Cohesion: 0.03
Nodes (112): ctoInputIdentityMatches(), ctoInputRecovered(), metadataParkAction(), ADOPTION_STALLED_MS, conversationResolved(), projectOutbox(), item(), syncOutbox() (+104 more)

### Community 140 - "GitHubDelivery"
Cohesion: 0.08
Nodes (47): removeAdoptedClone(), namedRepairIds(), pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), GitHubDelivery, stoppedBaseCheckout(), saveStoppedBaseArtifact(), stoppedBaseHandoffResolved() (+39 more)

### Community 141 - "CorrectionCase"
Cohesion: 0.40
Nodes (5): Corroboration, RequirementExample, CorrectionCase, SourceRange, SubjectReference

### Community 142 - "Store"
Cohesion: 0.06
Nodes (31): helperTelemetry(), observeHelperGroups(), stopHelperGroups(), FeatureReviewRunner, stopReview(), FeatureWorkflow, dispatchExposure(), prepareExposure() (+23 more)

### Community 144 - "reconcile-merges.cjs"
Cohesion: 0.21
Nodes (15): remoteSlug(), collectPulls(), copyWikiForDryRun(), { execFileSync }, flattenPages(), fs, githubRequest(), isWikiBotPull() (+7 more)

### Community 145 - "Ticket"
Cohesion: 0.27
Nodes (5): carriedNotRepeated(), changeScopeNote(), Scoped, JiraOperations, Ticket

### Community 146 - "artifact"
Cohesion: 0.05
Nodes (120): containedFile(), acceptStageResult(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash (+112 more)

### Community 147 - "engine.ts"
Cohesion: 0.07
Nodes (11): checkMail(), drainMail(), requestMail(), enableNightly(), ingest(), noQuotaHold, ResumeProject, drainMaintenance() (+3 more)

### Community 148 - "runner-root.ts"
Cohesion: 0.15
Nodes (26): resolveCliRoot(), DEFAULT_OFFICE_URL, LOOPBACK, officeUrl(), privateDirectories(), runnerPaths(), PIN_ENTRY, pinCommand() (+18 more)

### Community 149 - "resume-control.ts"
Cohesion: 0.29
Nodes (7): absent(), NEVER_ENABLED, ResumeControl, stated(), Stored, unreadable(), ResumeSwitch

### Community 150 - "serve-graph.cjs"
Cohesion: 0.24
Nodes (10): ensureInside(), createServer(), fs, http, listen(), attempt(), main(), path (+2 more)

### Community 151 - "workKey"
Cohesion: 0.09
Nodes (35): notOwned(), mergedByOwner(), harnessMergeAttempted(), mergedByOfficeBot(), closeableIssue(), effectsSettled(), eligible(), officePublished() (+27 more)

### Community 152 - "record-runner-failure.ts"
Cohesion: 0.10
Nodes (30): incidentNotices(), NOTICE_KINDS, STATUS, classify(), isRestoration(), KEY, newer(), record() (+22 more)

### Community 153 - "normalize-question.ts"
Cohesion: 0.27
Nodes (10): normalizeRound(), FeatureHarnessOption, FeatureOption, FeatureQuestion, FeatureRoundAuthor, folded(), normalizeQuestion(), optionId() (+2 more)

### Community 154 - "Lesson"
Cohesion: 0.23
Nodes (7): LessonBrainAudit, LessonBrainOverlap, CONSOLIDATED, CONSOLIDATED_AT, SEEDS, SEEDS, Lesson

### Community 155 - "recorded-gh-command.ts"
Cohesion: 0.19
Nodes (20): assignments(), changeDirectory(), closing(), CREATE, createGuard(), flags(), named(), read() (+12 more)

### Community 156 - "carried-checks.ts"
Cohesion: 0.18
Nodes (18): latestQA(), notPassedInLatestQA(), QACoverage, qaCoverage(), same(), Tested, safeWebUrl(), officeValidation() (+10 more)

### Community 157 - "observe-github-merges.ts"
Cohesion: 0.28
Nodes (15): clearCooldown(), coolDown(), coolingDown(), MERGE_NOTICE_RECHECK_MS, waitKey(), waits, isMergeCommit(), issueOf() (+7 more)

### Community 158 - "runner-report.ts"
Cohesion: 0.07
Nodes (31): Digest, Evidence, FAILURE_ID, failureDigest(), FailureReceipt, haltCondition(), HaltReport, LINE_LIMIT (+23 more)

### Community 160 - "write-credential-scope.ts"
Cohesion: 0.25
Nodes (12): Execute, assertBoundPushDestination(), digest(), Execute, file(), PUSH_HOOKS, pushHookChain(), inspect() (+4 more)

### Community 161 - "pre-push-boundary.ts"
Cohesion: 0.27
Nodes (10): Event, exactCommand(), Invocation, localHookCommand(), one(), prePushRejection(), PushIdentity, retirementBoundary() (+2 more)

### Community 162 - "github-context.ts"
Cohesion: 0.06
Nodes (68): resumeProviderReviews(), observe(), maintenanceVerifiedDraft(), returnDraftToPromotion(), CheckJobAgreement, checkJobAgreement(), isKnownCheckStatus(), positive() (+60 more)

### Community 163 - "provider-limit-resolution.ts"
Cohesion: 0.33
Nodes (7): investigatesLimitRefusal(), PROVIDER_RECOVERED, providerLimitResolution(), refusedAtLimit(), exitFailure(), MONTHS, providerLimit()

### Community 164 - "telemetry/report.ts"
Cohesion: 0.23
Nodes (15): TelemetrySync, TimeLedgerState, Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount() (+7 more)

### Community 165 - "connectWith"
Cohesion: 0.38
Nodes (5): connectWith(), data(), envelope(), JiraWorklogs, WorklogSave

### Community 166 - "launch.mjs"
Cohesion: 0.05
Nodes (105): RFC-9562, BANNER, builtin(), bundleLauncher(), LAUNCHER_BUNDLE, LAUNCHER_ENTRY, launcherChunk(), REPOSITORY (+97 more)

### Community 167 - "second-opinion.ts"
Cohesion: 0.29
Nodes (10): CorroborationRequest, LaunchFacts, collectSecondOpinion(), SecondOpinionRequest, Budgeted, FrozenInput, Opinion, otherProvider() (+2 more)

### Community 168 - "conversation-recovery.ts"
Cohesion: 0.64
Nodes (7): conversationReadbackReady(), followupOf(), pendingReadback(), queueConversationReadback(), readbackEnding(), uncertainConversations(), readBackConversations()

### Community 169 - "claude-session-context.ts"
Cohesion: 0.22
Nodes (6): claudeSessionContext(), readTranscript, codexSessionContext(), readRollout, ContextReader, CLAUDE_TRANSCRIPTS

### Community 170 - "preferences-store.ts"
Cohesion: 0.21
Nodes (8): PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS, OfficePreferences

### Community 171 - "deploy-plan.ts"
Cohesion: 0.12
Nodes (36): runningRevision(), runningRevision(), Body, DeploymentFenceState, fenceTokenDigest(), runtimeRevision(), operationPaths(), planDeployment() (+28 more)

### Community 172 - "SessionBridge"
Cohesion: 0.19
Nodes (10): DesktopSessions, claudeSessions(), LiveSession, SessionBridge, completeSessionCoverage(), desktopCoverageGap(), knownActivity(), Report (+2 more)

### Community 173 - "build-release.ts"
Cohesion: 0.14
Nodes (20): ActiveRelease, BUILD_ENV, buildRelease(), BuildReleaseOptions, Execute, pinnedVersions(), compare(), parts() (+12 more)

### Community 174 - "continue-access-only-plan.ts"
Cohesion: 0.54
Nodes (6): Document, document(), isAccessOnlyPlan(), settledAccessOnlyState(), continueAccessOnlyPlan(), entryExists()

### Community 175 - "validate_wiki_pr_body.cjs"
Cohesion: 0.33
Nodes (5): { execFileSync }, hasCanonicalWikiBody(), maintenanceBodies, matchesMaintenanceBody(), { readFileSync }

### Community 176 - "unblock-brief.ts"
Cohesion: 0.53
Nodes (5): clearUnblockBrief(), key(), saveUnblockBrief(), UnblockBrief, unblockBrief()

### Community 177 - "continue-ownership-read.ts"
Cohesion: 0.25
Nodes (13): continueOwnershipRead(), expiredOwnershipRead(), handoffOwnership(), ReadbackOwnerDecision, ownershipReadGate(), ownershipReadState(), ownershipReadSource(), ReadOwnershipCandidate (+5 more)

### Community 178 - "inspect-closed-plan.ts"
Cohesion: 0.10
Nodes (23): assertOwnership(), decideImplementation(), ImplementationDecision, OwnershipRead, closedReadonlyPlan(), Document, document(), entryExists() (+15 more)

### Community 179 - "salvage-worktree.ts"
Cohesion: 0.48
Nodes (6): Execute, keptWork(), Read, refObject(), SalvageRetry, salvageWorktree()

### Community 180 - "write-boundary.ts"
Cohesion: 0.09
Nodes (31): Write, AMBIENT_TOKENS, appCredential(), ChildCredential, CREDENTIAL_TRACING, GIT_HELPER, operatorRollbackCredential(), PROMPTS (+23 more)

### Community 181 - "incident-command.ts"
Cohesion: 0.38
Nodes (6): FLAGS, incidentCommand(), IncidentCommandIO, option(), USAGE, whole()

### Community 183 - "session-snapshot-cleanup.ts"
Cohesion: 0.40
Nodes (5): SNAPSHOT_PREFIX, removeStaleSessionSnapshots(), SNAPSHOT_SWEEP_MS, STALE_SNAPSHOT_MS, sweepStaleSessionSnapshots()

### Community 184 - "delivery-ownership.ts"
Cohesion: 0.33
Nodes (4): Ownership, ownershipContext, refreshDeliveryOwnership(), RefreshOwnership

### Community 185 - "candidate-ownership.ts"
Cohesion: 0.40
Nodes (4): SETTLED, skipOwnedCandidate(), Skipped, skippedCandidateLedger()

### Community 186 - "wait-idle.ts"
Cohesion: 0.40
Nodes (4): Health, IdleObservation, IdleResult, WaitIdleInput

### Community 187 - "office-qa-handoff.ts"
Cohesion: 0.60
Nodes (4): OfficeQAHandoff, OfficeQAHandoffInput, OfficeQAHandoffRequest, QAOwnershipProof

## Knowledge Gaps
- **1 isolated node(s):** `RFC-9562`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 1353 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `worker-runtime.ts`, `features.ts`, `github-delivery.ts`, `enrollment-gate.ts`, `admit-improvement.ts`, `request.ts`, `scheduled-captures.ts`, `run-retrospective.ts`, `record-trigger.ts`, `route-activation.ts`, `process.ts`, `cec-reads.ts`, `jira-time.ts`, `holdReason`, `accessibility-sources.ts`, `controller-runtime.ts`, `cec.ts`, `advance-metadata-park.ts`, `assignments.ts`, `digest`, `ref_node_path`, `run.ts`, `identity-runtime.ts`, `scheduled-work.ts`, `entry.ts`, `ref_node_crypto`, `office-lessons.ts`, `time-scope.ts`, `lesson-selection.ts`, `.save`, `offices.ts`, `goal-reviews.ts`, `index.ts`, `Effects`, `investigations/ledger.ts`, `pilot-delivery.ts`, `jiraBinding`, `.emit`, `cec/workflow.ts`, `cost-ledger.ts`, `knowledge.ts`, `brain-maintenance.ts`, `resume-arrivals.ts`, `OfficeProject`, `requests.ts`, `incidents.ts`, `agents.ts`, `session-bridge.ts`, `validate-stage.ts`, `MaintenanceRun`, `remove-candidate.ts`, `maintenance/maintenance.ts`, `sanitize`, `superseded-wiki-pr.ts`, `provider-observation.ts`, `ticket-evidence.ts`, `assignment-poll.ts`, `notifications.ts`, `redactEvidence`, `ticket-stage-runner.ts`, `time-readback.ts`, `deploy.ts`, `harnessEffect`, `judge-resumes.ts`, `pr-observation-graphql.ts`, `blocker-followups.ts`, `follow-production.ts`, `run-accounting.ts`, `store.ts`, `retrospective-subject.ts`, `.getEffect`, `http/commands.ts`, `conversations/slack.ts`, `sign-in-unpark.ts`, `it-specialist.ts`, `.activeClaims`, `project-bindings.ts`, `time-ledger.ts`, `office-authors.ts`, `state-parts.ts`, `weekly-rollup.ts`, `admit-repair-waits.ts`, `shared.ts`, `GitHubDelivery`, `Ticket`, `artifact`, `engine.ts`, `workKey`, `observe-github-merges.ts`, `write-credential-scope.ts`, `github-context.ts`, `provider-limit-resolution.ts`, `conversation-recovery.ts`, `SessionBridge`, `continue-access-only-plan.ts`, `continue-ownership-read.ts`, `inspect-closed-plan.ts`, `write-boundary.ts`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **What connects `RFC-9562` to the rest of the system?**
  _1 weakly-connected nodes found - possible missing edges._
- **Should `sandbox-qualification.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06342494714587738 - nodes in this community are weakly interconnected._
- **Why does `command()` connect `process.ts` to `worker-runtime.ts`, `features.ts`, `time-ledger.ts`, `github-delivery.ts`, `incidents/routes.ts`, `weekly-rollup.ts`, `GitHubDelivery`, `admit-improvement.ts`, `Store`, `Ticket`, `artifact`, `engine.ts`, `worker-sandbox-run.ts`, `jira-time.ts`, `record-runner-failure.ts`, `accessibility-sources.ts`, `controller-runtime.ts`, `cec.ts`, `assignments.ts`, `digest`, `ref_node_path`, `identity-runtime.ts`, `connectWith`, `ref_node_crypto`, `.save`, `deploy-plan.ts`, `build-release.ts`, `continue-access-only-plan.ts`, `SessionBridge`, `continue-ownership-read.ts`, `inspect-closed-plan.ts`, `Effects`, `salvage-worktree.ts`, `pilot-delivery.ts`, `jiraBinding`, `cost-ledger.ts`, `brain-maintenance.ts`, `service-health.ts`, `OfficeProject`, `requests.ts`, `agents.ts`, `session-bridge.ts`, `validate-stage.ts`, `MaintenanceRun`, `remove-candidate.ts`, `maintenance/maintenance.ts`, `provider-observation.ts`, `ticket-evidence.ts`, `assignment-poll.ts`, `notifications.ts`, `redactEvidence`, `ticket-stage-runner.ts`, `time-readback.ts`, `deploy.ts`, `harnessEffect`, `.getEffect`, `deploy-command.ts`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Should `Role` be split into smaller, more focused modules?**
  _Cohesion score 0.12077294685990338 - nodes in this community are weakly interconnected._
- **Why does `Engine` connect `engine.ts` to `github-delivery.ts`, `Store`, `scheduled-captures.ts`, `Ticket`, `process.ts`, `scheduled-work.ts`, `offices.ts`, `continue-ownership-read.ts`, `pilot-delivery.ts`, `resume-arrivals.ts`, `OfficeProject`, `requests.ts`, `agents.ts`, `maintenance/maintenance.ts`, `sanitize`, `provider-observation.ts`, `assignment-poll.ts`, `notifications.ts`, `ticket-stage-runner.ts`, `continue.ts`, `.getEffect`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Should `worker-runtime.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06836055656382335 - nodes in this community are weakly interconnected._