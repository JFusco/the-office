# Graph Report - the-office  (2026-11-27)

## Corpus Check
- 1368 files · ~622,479 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 7735 nodes · 32727 edges · 184 communities (174 shown, 10 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 1100 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `138d736b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- IncidentLedger
- OrgChart.tsx
- worker-runtime.ts
- features/workflow.ts
- cx
- github-delivery.ts
- budget-ledger.ts
- index.tsx
- incidents/routes.ts
- TelemetryPanel.tsx
- scheduled-features.ts
- overseer/commands.ts
- App.tsx
- propose-improvements.ts
- request.ts
- scheduled-captures.ts
- run-retrospective.ts
- record-trigger.ts
- route-activation.ts
- worker-sandbox-run.ts
- coordination-tick.ts
- overseer-launch.mjs
- cec-reads.ts
- jira-time.ts
- post-conflict-preparation.ts
- github.ts
- controller-runtime.ts
- fact-bounds.ts
- advance-metadata-park.ts
- work-summary.ts
- digest
- delivery-authority.ts
- triage.ts
- run.ts
- identity-runtime.ts
- common.cjs
- scheduled-work.ts
- routing.cjs
- link-draft-issue.ts
- .transaction
- knowledge.ts
- time-scope.ts
- assignments.ts
- .save
- Offices
- harness-baseline.ts
- credential-patterns.ts
- rate-limit-samples.ts
- service-plist.ts
- index.ts
- features.ts
- readable-jira-comment.ts
- investigations/ledger.ts
- state-parts.ts
- JiraIssuePublisher
- app-config.ts
- pass.ts
- dependency-bots/adopt.ts
- sandbox-qualification.ts
- packed-consumer-pnpm.ts
- cost-ledger.ts
- demand-facts.ts
- coordination.ts
- MapView.tsx
- constellation-runtime.ts
- validate_pr_body.cjs
- audit-plan-candidates.cjs
- office-client.ts
- ref_node_crypto
- Conversation.tsx
- OfficeScene.tsx
- spawn-command.ts
- session-context-file.ts
- projects.ts
- session-scope.ts
- service-health.ts
- azure.ts
- holdReason
- incidents.ts
- agents.ts
- session-bridge.ts
- Coordinator
- metadata-park-words.ts
- remove-candidate.ts
- viewer.js
- accessibility-sources.ts
- stopped-record.ts
- conversations/conversations.ts
- superseded-wiki-pr.ts
- ref_node_child_process
- provider-observation.ts
- project-bindings.ts
- session-context-client.ts
- plans.cjs
- .emit
- capture-session-clone.py
- Ticket
- process.ts
- ticket-stage-runner.ts
- archive-plan.cjs
- metered-runner.ts
- time-readback.ts
- Store
- on-merge-sync.cjs
- snapshot-stores.ts
- extract-worker.mjs
- deploy.ts
- harnessEffect
- judge-resumes.ts
- pr-observation-graphql.ts
- blocker-followups.ts
- sanitize
- cec.ts
- DailyCTO.tsx
- slack-supersession.ts
- run-accounting.ts
- qa.ts
- qa-plan-continuation.ts
- writer-restart.ts
- control-store.ts
- features/commands.ts
- .getEffect
- daily-cto.ts
- deploy-command.ts
- refresh-issue-state.cjs
- effects.ts
- publication.ts
- resume-after-sign-in.ts
- work.ts
- retrospective-subject.ts
- pre-push-boundary.ts
- contracts/overseer.ts
- http/commands.ts
- pr-observation-shape.ts
- easternDay
- corroborate.ts
- timed-statements.ts
- MaintenanceRun
- engine.ts
- OfficeSnapshot
- TicketJob
- agreement.ts
- scheduler.ts
- production.ts
- reconcile-merges.cjs
- credential-spans.ts
- artifact
- Engine
- runner-root.ts
- redactEvidence
- serve-graph.cjs
- workKey
- record-runner-failure.ts
- bare-value.ts
- DeploymentFence
- recorded-gh-command.ts
- assignment.ts
- observe-github-merges.ts
- halt-report.ts
- routing.js
- push-credentials.ts
- backup-stores.ts
- github-check-selection.ts
- security.ts
- telemetry/report.ts
- proof-comment.ts
- launch.mjs
- offices.ts
- incident-command.ts
- StateParts
- useOfficePreferences.ts
- deploy-plan.ts
- office/readiness.ts
- provider-limit-resolution.ts
- ref_zod
- validate_wiki_pr_body.cjs
- release-unpark.ts
- office-qa-handoff.ts
- CommandRegistry
- parked-card-refusal.ts
- write-boundary.ts
- restoreInPlace
- qa-plan-retry.ts
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

## Communities (184 total, 10 thin omitted)

### Community 0 - "IncidentLedger"
Cohesion: 0.10
Nodes (27): PacketInput, absent(), IncidentChange, IncidentLedger, isOpen(), Recorded, replayed(), admitRepairWaits() (+19 more)

### Community 1 - "OrgChart.tsx"
Cohesion: 0.05
Nodes (76): assignmentDiagnostics(), diagnosticContext(), diagnosticSnapshot(), followUpPicture(), publishITReport(), archiveOldReports(), RETAINED_REPORTS, archiveByMonth() (+68 more)

### Community 2 - "worker-runtime.ts"
Cohesion: 0.04
Nodes (62): SlackResultSchema, SlackVerificationSchema, candidateWorkspaceEnvironment(), assignmentSubject(), dispatchExposure(), prepareExposure(), INSTALLED, installedLesson() (+54 more)

### Community 3 - "features/workflow.ts"
Cohesion: 0.08
Nodes (52): approveFeature(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), artifactPath(), digest(), document() (+44 more)

### Community 4 - "cx"
Cohesion: 0.08
Nodes (101): blockedSummary(), ServiceHealthPanel(), followUp(), labels, ServiceHealthRow(), BlockerFollowups(), LearningCoverage(), lessonsView() (+93 more)

### Community 5 - "github-delivery.ts"
Cohesion: 0.04
Nodes (121): containedFile(), writerRestartInstruction(), ProjectProgress, findingsBlock(), metadataCarriedAdvisoryIds(), ownedBefore(), QA_STAGES, reviewAdvisoryIds() (+113 more)

### Community 6 - "budget-ledger.ts"
Cohesion: 0.06
Nodes (57): abandonExpired(), Admission, admit(), admitDeployment(), balance(), bindEvidence(), count(), errcode() (+49 more)

### Community 7 - "index.tsx"
Cohesion: 0.08
Nodes (54): phases, LinkedFeatures(), DrawerNavigation, SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), loadOfficeConfig() (+46 more)

### Community 8 - "incidents/routes.ts"
Cohesion: 0.08
Nodes (44): citationFault(), CitationSchema, ClaimedRange, ResolvedRange, SourceVersions, dismiss(), DISMISSAL_CITATIONS, DISMISSAL_REASON (+36 more)

### Community 9 - "TelemetryPanel.tsx"
Cohesion: 0.11
Nodes (34): TelemetryReport, AzureBuild, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens(), usd() (+26 more)

### Community 10 - "scheduled-features.ts"
Cohesion: 0.31
Nodes (16): admit(), admitReadyCards(), dependencyEligibility(), validatePrerequisites(), prerequisitesMet(), currentApproval(), featureGate(), predecessorComplete() (+8 more)

### Community 11 - "overseer/commands.ts"
Cohesion: 0.07
Nodes (47): header(), readStanding(), guardPresent(), overseerCommand(), reconcileArgs(), runnerStatus(), Condition, count (+39 more)

### Community 12 - "App.tsx"
Cohesion: 0.05
Nodes (62): SendMessage, BrainDrawer(), themeColor, App(), BrainWorkspace, CONNECTION, CONNECTION_DOT, dockItemVariants (+54 more)

### Community 13 - "propose-improvements.ts"
Cohesion: 0.38
Nodes (8): distinct(), identity(), improvementIncident(), improvementIncidentKey(), IMPROVEMENT_POLICY, improvementDigest(), ImprovementProposal, proposeImprovements()

### Community 14 - "request.ts"
Cohesion: 0.08
Nodes (65): MISSING_NATIVE_LINK, AdoptionBinding, assertAutomationAuthority(), observeAutomationConflict(), VERB, assertAutomationEffects(), automationMergePolicy(), REBASE (+57 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.09
Nodes (68): candidateBranchMoved(), dispatchNightly(), drainDelivery(), requestDelivery(), startPilot(), OfficeQAHandoffInput, eligibility(), Admission (+60 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.06
Nodes (59): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BlockingTrigger, blockingTrigger(), BrainOverlap, brainOverlap() (+51 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.09
Nodes (48): BLOCKING, isBlocking(), baselined(), baselineLearning(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences() (+40 more)

### Community 18 - "route-activation.ts"
Cohesion: 0.11
Nodes (40): ActiveEntry, QualifyEntry, RollbackEntry, RouteEntry, githubIdentity(), appSelected(), discoveredAuthor(), discoveryAuthors() (+32 more)

### Community 19 - "worker-sandbox-run.ts"
Cohesion: 0.06
Nodes (74): timeoutsValid(), assertOwnedDirectory(), checkRunDirectories(), Child, CHILDREN, code(), createRunDirectories(), DIRECTORY_MODES (+66 more)

### Community 20 - "coordination-tick.ts"
Cohesion: 0.09
Nodes (29): IntakeContext, interruptAdoptions(), dependencyCompletionKey(), classifyStop(), legacy(), REMOVED_FIELDS, retireLegacyRecovery(), goalNoticeNeverDispatched() (+21 more)

### Community 21 - "overseer-launch.mjs"
Cohesion: 0.07
Nodes (80): acquireLauncherLock(), alone(), ancestry(), assertDirectoryOrAbsent(), attemptRecord(), bounded(), boundedString(), checkOwnedFile() (+72 more)

### Community 22 - "cec-reads.ts"
Cohesion: 0.09
Nodes (33): cecReadbackPrompt(), plainResume(), readbackDispatchGuidance(), capacityInterruptedRun(), providerSaid(), rerunsInterruptedQA(), officeRefusedQA(), QA_STAGES (+25 more)

### Community 23 - "jira-time.ts"
Cohesion: 0.07
Nodes (54): attempted(), attemptState(), bound(), covers(), JiraAttempt, jiraAttempts(), JiraAttemptState, open() (+46 more)

### Community 24 - "post-conflict-preparation.ts"
Cohesion: 0.08
Nodes (52): assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), reconcileCompletedConflictDraft(), routeReadyPostConflictPublication(), verifyInitialDraftConflictPreparation() (+44 more)

### Community 25 - "github.ts"
Cohesion: 0.13
Nodes (21): boardReadFailure(), withGitHubOperation(), GitHubMonitor, Api, terminalPRs(), backgroundHold(), CORE_RESERVE, GRAPHQL_WORK (+13 more)

### Community 26 - "controller-runtime.ts"
Cohesion: 0.09
Nodes (33): projectData(), StoreDatabase, ControllerEffects, controllerEffects(), alive(), ControllerMachine, option(), realMachine() (+25 more)

### Community 27 - "fact-bounds.ts"
Cohesion: 0.25
Nodes (15): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+7 more)

### Community 28 - "advance-metadata-park.ts"
Cohesion: 0.10
Nodes (60): advanceMetadataPark(), Parked, releaseWords(), sentAnything(), CardResumeRoute, cardResumeRoute(), effectiveParkPickup(), PICKUP_ASSIGNEE (+52 more)

### Community 29 - "work-summary.ts"
Cohesion: 0.10
Nodes (40): jiraQueueProgress(), deliveryRoles, JiraQueueProgress, TicketProgress, ROLE_NAMES, STAGE_LABELS, deliveryRepairProjection(), ACTIVE (+32 more)

### Community 30 - "digest"
Cohesion: 0.05
Nodes (103): retryRead(), createdContentSha256(), Binding, historyBeforeWrite(), matchesBoundDescription(), DescriptionEdit, DescriptionHistory, DescriptionHistoryUnavailable (+95 more)

### Community 31 - "delivery-authority.ts"
Cohesion: 0.05
Nodes (72): ATTEMPT_DELAYS_MS, nextAttemptAt(), NOT_RETRYABLE, releaseFunds(), StoppedWriter, stoppedWriter(), WriterRestartCandidate, writerRestartCandidate() (+64 more)

### Community 32 - "triage.ts"
Cohesion: 0.13
Nodes (26): budgetRequest(), CorroborationRequest, LaunchFacts, collectSecondOpinion(), SecondOpinionRequest, Budgeted, CheckedOpinionInput, collectOpinion() (+18 more)

### Community 33 - "run.ts"
Cohesion: 0.14
Nodes (21): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_FIX_PROMPT, OfficeFixResult (+13 more)

### Community 34 - "identity-runtime.ts"
Cohesion: 0.10
Nodes (22): KeychainKeySource, appJwt(), base64url(), signingKey(), AppKeySource, Execute, keychainKeySource(), bound (+14 more)

### Community 35 - "common.cjs"
Cohesion: 0.15
Nodes (27): connections(), fs, main(), path, crypto, ensureInside(), { execFileSync }, fs (+19 more)

### Community 36 - "scheduled-work.ts"
Cohesion: 0.07
Nodes (45): freshOwnershipRead(), dueSlackReread(), rereadUncertainSlack(), runningRevision(), deliverySlot(), Ownership, ownershipContext, refreshDeliveryOwnership() (+37 more)

### Community 37 - "routing.cjs"
Cohesion: 0.12
Nodes (28): fs, main(), path, { spawnSync }, frontmatterProblems(), adjacency(), edgeCost(), edgeKey() (+20 more)

### Community 38 - "link-draft-issue.ts"
Cohesion: 0.10
Nodes (32): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+24 more)

### Community 39 - ".transaction"
Cohesion: 0.12
Nodes (35): featureItemComplete(), reconcileFeatureCompletion(), discoveryPrompt(), planPrompt(), helperTelemetry(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS (+27 more)

### Community 40 - "knowledge.ts"
Cohesion: 0.09
Nodes (27): curateLesson(), Curation, CurationAction, mergeEvidence(), LessonBrainAudit, LessonBrainOverlap, CONSOLIDATED, CONSOLIDATED_AT (+19 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.16
Nodes (25): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence(), CaptureContext (+17 more)

### Community 42 - "assignments.ts"
Cohesion: 0.08
Nodes (39): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, GraphNode (+31 more)

### Community 43 - ".save"
Cohesion: 0.11
Nodes (51): resolveBlockedTransition(), document(), transitionWithComment(), jiraAccount(), jiraCollection(), JiraCredential, jiraCredential(), KEYCHAIN_SERVICE (+43 more)

### Community 44 - "Offices"
Cohesion: 0.09
Nodes (7): QuestionNotifications, CommittedBrain, file, project, root, projectById(), Offices

### Community 45 - "harness-baseline.ts"
Cohesion: 0.12
Nodes (23): [cmd,...rawArgs], BaselineReport, baselineReport(), BaselineSource, baselineText(), millions(), row(), share() (+15 more)

### Community 46 - "credential-patterns.ts"
Cohesion: 0.11
Nodes (17): AFTER_LABEL, BARE_CREDENTIAL, BARE_LABEL, BARE_UNIT, BARE_VALUE, CAMEL_START, CONTROL_ESCAPE, CREDENTIAL_NAME (+9 more)

### Community 47 - "rate-limit-samples.ts"
Cohesion: 0.08
Nodes (27): bindGitHubRunner(), Runner, GitHubCalls, AppPrincipals, AppReadiness, serviceAppPrincipals, AMBIENT_TOKENS, ChildCredential (+19 more)

### Community 48 - "service-plist.ts"
Cohesion: 0.19
Nodes (16): DEPLOY_PROJECT, bootout(), bootstrap(), Execute, serviceLoaded(), until(), Execute, PlistSchema (+8 more)

### Community 49 - "index.ts"
Cohesion: 0.05
Nodes (56): implementationContinuationRoute(), qaPlanRetryRoute(), servedOutbox(), isNotice(), readNotices(), close(), config, itSpecialist (+48 more)

### Community 50 - "features.ts"
Cohesion: 0.09
Nodes (41): normalizeRound(), FeatureApproval, FeatureAttempt, FeatureAuthority, FeatureEvidenceRef, FeatureHandoff, FeatureHarnessAction, FeatureHarnessOption (+33 more)

### Community 51 - "readable-jira-comment.ts"
Cohesion: 0.11
Nodes (25): CommentPage, commentReadback(), devUpdate(), HEADLINE, JiraOperations, postDevUpdate(), OUTCOME, qaComment() (+17 more)

### Community 52 - "investigations/ledger.ts"
Cohesion: 0.13
Nodes (23): projectSlackDeliveries(), settleRequestedSlackReplacement(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint(), supersedingDelivery(), acceptedCompletionResolution() (+15 more)

### Community 53 - "state-parts.ts"
Cohesion: 0.21
Nodes (13): readSavedState(), LARGE_KEY_CHARS, plain(), RedactedEntries, RedactedEntry, redactEntries(), joinParts(), readSaved() (+5 more)

### Community 54 - "JiraIssuePublisher"
Cohesion: 0.10
Nodes (12): JiraIssuePublisher, jiraText(), descriptionPreimage(), plain(), publicationDescription(), GitHubFeaturePublisher, PublicationReceipt, GitHubIssuePublisher (+4 more)

### Community 55 - "app-config.ts"
Cohesion: 0.14
Nodes (23): effectId(), entry(), fail(), GitHubAppConfig, KnownProject, only(), parseGitHubApp(), positive() (+15 more)

### Community 56 - "pass.ts"
Cohesion: 0.08
Nodes (46): FailureEvent, failureLine(), LINE_LIMIT, RunnerLimits, appendFailureLine(), JournalRefused, JournalView, readFailures() (+38 more)

### Community 57 - "dependency-bots/adopt.ts"
Cohesion: 0.09
Nodes (42): Execute, readBackOrThrow(), closesIssue(), linkedBody(), linkPR(), DependabotPR, dependabotPR(), ensureTrackingIssue() (+34 more)

### Community 58 - "sandbox-qualification.ts"
Cohesion: 0.07
Nodes (39): within(), ALLOW_PROBES, Binding, boundTo(), Cleanup, CLEANUP_PROBES, CleanupProbe, collectProbe() (+31 more)

### Community 60 - "cost-ledger.ts"
Cohesion: 0.11
Nodes (37): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress(), effectId() (+29 more)

### Community 61 - "demand-facts.ts"
Cohesion: 0.12
Nodes (23): clip(), DEMAND_LIMIT, demandFacts(), DemandSection, key(), LessonKey, notes(), clip() (+15 more)

### Community 62 - "coordination.ts"
Cohesion: 0.09
Nodes (28): deliverySource(), scopes, STAGES, completeNativeCheckpoint(), BRAIN_DEPENDENCY_MERGES, BrainFollowup, BrainMaintenance, BrainResult (+20 more)

### Community 63 - "MapView.tsx"
Cohesion: 0.07
Nodes (60): KnowledgeActivity, KnowledgeActivityPage, KnowledgeEdge, KnowledgeMap, KnowledgeNode, ChatMarkdown(), Activity(), ActivityTimeline() (+52 more)

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
Cohesion: 0.10
Nodes (27): FailureAnswer, HaltAnswer, systemClock, RUNNER_DEFAULTS, officeDataRoot, realMachine(), bodyWithin(), bounded() (+19 more)

### Community 68 - "ref_node_crypto"
Cohesion: 0.13
Nodes (53): canonical(), assessResumes(), Standing, CheckpointEligibility, checkpointEligibility(), admitAssignmentResume(), forAssignment(), admitCheckpointResume() (+45 more)

### Community 69 - "Conversation.tsx"
Cohesion: 0.11
Nodes (30): Conversation(), ConversationDraft, createConversationDrafts(), LessonDecisionAction, lessonDecisionState(), readLessonDecision(), isLessonDecision(), ChatMarkdown (+22 more)

### Community 70 - "OfficeScene.tsx"
Cohesion: 0.08
Nodes (60): displayAgentTask(), withoutElapsed(), CameraBookmark, restoreBookmark(), LiveAgentTask(), Props, RunningTask(), text() (+52 more)

### Community 71 - "spawn-command.ts"
Cohesion: 0.14
Nodes (22): childEnvironment(), inactivityWatch(), At, Errno, errno(), GroupInventory, GroupProbe, LifecycleDiagnostic (+14 more)

### Community 72 - "session-context-file.ts"
Cohesion: 0.20
Nodes (14): ContextFoldPrefix, contextFoldPrefix(), SessionContextCheckpoint, captureSessionContextClone(), ContextReadPhase, SessionContextDeadline, sessionContextFile(), ContextReadChanged (+6 more)

### Community 73 - "projects.ts"
Cohesion: 0.05
Nodes (73): escaped(), IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), intakeMembership(), projectListScope(), AUTO_ADOPT_BOTS (+65 more)

### Community 74 - "session-scope.ts"
Cohesion: 0.18
Nodes (17): Bound, claudeScopeParser(), claudeSessionScope(), CLAUDE_TRANSCRIPTS, CODEX_ROLLOUTS, contextReaders(), retainSessionMessage(), SessionConversation (+9 more)

### Community 75 - "service-health.ts"
Cohesion: 0.12
Nodes (22): ClaudeLoginRefusal, claudeLoginRefusal(), claudeRefusalWords(), RECORDED_REFUSALS, refusedClaudeRow(), providers, ProviderStatusChecks, summary (+14 more)

### Community 76 - "azure.ts"
Cohesion: 0.11
Nodes (31): AzureMonitor, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs(), fullActivePRs(), observation() (+23 more)

### Community 77 - "holdReason"
Cohesion: 0.08
Nodes (64): closeoutReceipt(), refreshMergeReview(), boardPreflightCandidate(), Ownership, reconcileBoardPreflight(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim() (+56 more)

### Community 78 - "incidents.ts"
Cohesion: 0.08
Nodes (50): attributedRecords(), foldsItsRun(), groupCandidates(), ObservedIncident, ObservedSubject, digest(), fingerprint(), incidentId() (+42 more)

### Community 79 - "agents.ts"
Cohesion: 0.05
Nodes (53): implementationWorkerContext(), cecIntakePrompt(), cecReconcilePrompt(), cecTransitionPrompt(), RefusedQAResult, savedStageCompletion(), assertContinuableWorktree(), CONTINUABLE (+45 more)

### Community 80 - "session-bridge.ts"
Cohesion: 0.10
Nodes (30): claudeSessionContext(), codexDaemonProcesses(), accountCodexProcesses(), CodexProcessInventory, codexProcessInventory(), DesktopSessions, unaccountedProcesses(), codexSessionContext() (+22 more)

### Community 82 - "metadata-park-words.ts"
Cohesion: 0.42
Nodes (9): field(), FIELDS, MetadataField, metadataFields(), metadataParkWords(), metadataStopWords(), needed(), sentence() (+1 more)

### Community 83 - "remove-candidate.ts"
Cohesion: 0.14
Nodes (22): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), maintenanceCandidate(), moveAside(), moveBack(), purgeRemoved(), purging (+14 more)

### Community 84 - "viewer.js"
Cohesion: 0.19
Nodes (25): addMetaLink(), addMetaRow(), addRelationship(), applyView(), buildIndexes(), buildLegend(), buildModel(), buildRenderer() (+17 more)

### Community 85 - "accessibility-sources.ts"
Cohesion: 0.08
Nodes (43): maintenancePolicies(), captureMaintenanceStep(), accessibilitySources(), actionable(), closingPull(), Finding, handoffIssue(), issueLines() (+35 more)

### Community 86 - "stopped-record.ts"
Cohesion: 0.07
Nodes (61): capabilityBlockedReviews(), latestReviews(), boundedEvidence(), expectedWait(), FailedMailCheck, lastFailedMailCheck(), lastMailCheckOutcome(), MailCheckOutcome (+53 more)

### Community 87 - "conversations/conversations.ts"
Cohesion: 0.08
Nodes (31): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+23 more)

### Community 88 - "superseded-wiki-pr.ts"
Cohesion: 0.13
Nodes (46): abandon(), assertOpenSnapshot(), awaitingContainment(), closeIssue(), CloseRevalidationError, closeSuperseded(), comment(), CommentStep (+38 more)

### Community 89 - "ref_node_child_process"
Cohesion: 0.13
Nodes (18): changedPaths(), { execFileSync }, files, isMapInput(), mapOnly(), { execFileSync }, git(), publish() (+10 more)

### Community 90 - "provider-observation.ts"
Cohesion: 0.13
Nodes (26): az(), correlatedBuild(), Azure, azurePipelines(), outcome(), Read, RUNS_PER_PIPELINE, Api (+18 more)

### Community 91 - "project-bindings.ts"
Cohesion: 0.08
Nodes (46): Assignment, contentSchema(), Transition, jiraRecord(), unpack(), statusHeld(), metadataDigest(), verifiedTransition() (+38 more)

### Community 92 - "session-context-client.ts"
Cohesion: 0.13
Nodes (18): readTranscript, readRollout, packContextFailure(), PackedContextFailure, unpackContextFailure(), LiveSession, ContextThread, contextThread() (+10 more)

### Community 93 - "plans.cjs"
Cohesion: 0.13
Nodes (27): fs, main(), parse(), path, repoRoot(), substantive(), walk(), association() (+19 more)

### Community 94 - ".emit"
Cohesion: 0.09
Nodes (46): currentOutbox(), confirmedGone(), goneQuery(), STOPPED, stoppedReviewKeys(), adoptDependabot(), ALERT_GRACE_MS, DependabotAlert (+38 more)

### Community 96 - "Ticket"
Cohesion: 0.10
Nodes (25): carriedNotRepeated(), changeScopeNote(), Scoped, applyIntakeObservation(), GATE_REFUSED, gateRefusedPass(), QA_STAGES, Carried (+17 more)

### Community 97 - "process.ts"
Cohesion: 0.08
Nodes (50): boundGitHubRunner(), sourceVersions(), inHistoryOf(), CompareMemory, compareMemory(), COMPARES_PER_PASS, comparison(), DeployedFixes (+42 more)

### Community 98 - "ticket-stage-runner.ts"
Cohesion: 0.09
Nodes (51): applyChangeScope(), endChangeScope(), levels(), MAX_CHECKS, owedUnderScope(), scopeBase(), scopeOutgrown(), settled() (+43 more)

### Community 99 - "archive-plan.cjs"
Cohesion: 0.12
Nodes (33): fs, main(), parse(), path, archive(), cell(), ensureIndex(), fromArgs() (+25 more)

### Community 100 - "metered-runner.ts"
Cohesion: 0.09
Nodes (42): add(), addSource(), busiest(), CallLedger, Entry, sourceRows(), Sources, CallCounts (+34 more)

### Community 101 - "time-readback.ts"
Cohesion: 0.16
Nodes (13): Ledger, Read, TimeLedger, missedSinceVerified(), Readback, READBACK_INTERVAL_MS, readBackTime(), SETTLE_MS (+5 more)

### Community 102 - "Store"
Cohesion: 0.04
Nodes (106): GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles(), ContinuationIO (+98 more)

### Community 103 - "on-merge-sync.cjs"
Cohesion: 0.19
Nodes (22): fieldSpan(), keyPattern(), list(), parseListLiteral(), quote(), render(), scalar(), splitFrontmatter() (+14 more)

### Community 104 - "snapshot-stores.ts"
Cohesion: 0.13
Nodes (30): absentAdmission(), AdmissionComparison, AdmissionSnapshot, compareAdmissions(), snapshotAdmissions(), storeMissing(), APPENDED_TABLE, comparableOrder() (+22 more)

### Community 105 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 106 - "deploy.ts"
Cohesion: 0.11
Nodes (44): fenceTokenDigest(), abandon(), advance(), deploy(), exclusively(), DEPLOY_STEPS, append(), assertNext() (+36 more)

### Community 107 - "harnessEffect"
Cohesion: 0.11
Nodes (50): effectKey(), LaneOperation, laneWrite(), moveCardOnce(), Lane, MOVABLE, moveLane(), resolveLane() (+42 more)

### Community 108 - "judge-resumes.ts"
Cohesion: 0.07
Nodes (44): boundaryCrossed(), Crossing, Progress, CheckpointProgress, checkpointProgress(), names(), nativeProof(), Step (+36 more)

### Community 109 - "pr-observation-graphql.ts"
Cohesion: 0.13
Nodes (29): ChildRequest, headCheckRuns(), includeBody(), readOpenPRs(), commitOf(), ConnectionPages, embeddedHead(), fail() (+21 more)

### Community 110 - "blocker-followups.ts"
Cohesion: 0.10
Nodes (53): conversationReadbackReady(), followupOf(), pendingReadback(), queueConversationReadback(), readbackEnding(), uncertainConversations(), readBackConversations(), followupRecord() (+45 more)

### Community 111 - "sanitize"
Cohesion: 0.18
Nodes (19): awaitingJiraStatus(), awaitingProduction(), FOLLOW_DAYS, followed(), isFollowed(), Azure, AzureRead, containedIn() (+11 more)

### Community 112 - "cec.ts"
Cohesion: 0.11
Nodes (27): movedHeadNote(), cecPrompt(), resolvedDecisionNote(), stageInstructions, stageInstructionsFor(), REVIEW_FINDINGS_RULE, waitText(), applies() (+19 more)

### Community 113 - "DailyCTO.tsx"
Cohesion: 0.29
Nodes (9): CTOReview(), goalState, DailyCTO(), reportDate(), reviewStatus, InlineText(), reviewExcerpt(), ReviewText() (+1 more)

### Community 114 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 115 - "run-accounting.ts"
Cohesion: 0.05
Nodes (72): BoundedRead, done(), readBoundedNoFollow(), reasonOf(), comparable(), EvidenceOutcome, recordRunEvidence(), backfillClaudeCost() (+64 more)

### Community 119 - "control-store.ts"
Cohesion: 0.11
Nodes (13): Clock, checkpointLabel(), applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, statementCache(), initialSnapshot() (+5 more)

### Community 120 - "features/commands.ts"
Cohesion: 0.20
Nodes (19): commandFeature(), reviewQuestions(), saveCaptureRequest(), automaticIntakeWait(), FeaturePlanningBindings, assertQuestionVisibility(), applyHarnessAction(), HarnessActionInput (+11 more)

### Community 121 - ".getEffect"
Cohesion: 0.10
Nodes (31): diagnosticProof(), ownedArtifact(), rawHash(), recoverDiscovery(), GitHubOperations, validateGitHubIssue(), reconcileGitHubWrite(), writerRefused() (+23 more)

### Community 122 - "daily-cto.ts"
Cohesion: 0.07
Nodes (34): currentCitations(), Fact, NOT_CURRENT, PROVIDER_ERROR, DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt() (+26 more)

### Community 123 - "deploy-command.ts"
Cohesion: 0.12
Nodes (27): CONTROLLER_ENTRY, ControllerPin, Pin, readControllerPin(), writeControllerPin(), controllerOf(), deployCommand(), report() (+19 more)

### Community 124 - "refresh-issue-state.cjs"
Cohesion: 0.19
Nodes (20): atomicWrite(), advanceFence(), closingIssues(), githubRefs(), key(), normalizeGithubQuery(), normalizeRepository(), parseGithubQuery() (+12 more)

### Community 125 - "effects.ts"
Cohesion: 0.08
Nodes (29): channelNoticeAuthorized(), ChannelSettings, notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR, plainSlackText() (+21 more)

### Community 126 - "publication.ts"
Cohesion: 0.15
Nodes (10): featureById(), FeaturePublisher, publishFeature(), reconcilePublication(), uncertainPublications(), reserveIdentity(), FeatureReviewRunner, featureRoute() (+2 more)

### Community 127 - "resume-after-sign-in.ts"
Cohesion: 0.14
Nodes (21): parksInJira(), currentEnvironmentWait(), environmentWait(), hasPendingDelivery(), resumeAfterSignIn(), signInWait(), isSetupStop(), waitingStep() (+13 more)

### Community 128 - "work.ts"
Cohesion: 0.06
Nodes (47): replacedReadback(), restartStoppedWriters(), unchangedSinceAccepted(), WRITER_STAGES, Execute, keptWork(), Read, refObject() (+39 more)

### Community 129 - "retrospective-subject.ts"
Cohesion: 0.19
Nodes (15): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, maintenanceKey(), azurePrUrl(), findSubject(), jobSubject() (+7 more)

### Community 130 - "pre-push-boundary.ts"
Cohesion: 0.27
Nodes (10): Event, exactCommand(), Invocation, localHookCommand(), one(), prePushRejection(), PushIdentity, retirementBoundary() (+2 more)

### Community 131 - "contracts/overseer.ts"
Cohesion: 0.08
Nodes (23): common, CorrectionCaseSchema, DispositionSchema, EventReferenceSchema, FalsePositive, FileReferenceSchema, HarnessDefect, HarnessDefectResult (+15 more)

### Community 132 - "http/commands.ts"
Cohesion: 0.13
Nodes (22): configureChannelNotices(), configureNotices(), noticeState(), retryRecipientLookup(), bindDiscoveryResume(), DiscoveryResumeInput, scopeNote(), requeueWaitedImplement() (+14 more)

### Community 133 - "pr-observation-shape.ts"
Cohesion: 0.23
Nodes (18): githubPRDescription(), closingDirectives(), ObservedPR, enumValue(), fail(), graphqlPR(), mapped(), member() (+10 more)

### Community 134 - "easternDay"
Cohesion: 0.22
Nodes (14): expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), dailyReviewDate(), EASTERN (+6 more)

### Community 135 - "corroborate.ts"
Cohesion: 0.15
Nodes (21): resolveRange(), subject(), corroborate(), CorroborationOutcome, coverageFault(), evidenceFault(), fallback(), Included (+13 more)

### Community 136 - "timed-statements.ts"
Cohesion: 0.18
Nodes (14): StoreTiming, StoreTimings, storeTimings(), NAMED, rowsText(), rowText(), SQL_TOKEN, statementName() (+6 more)

### Community 137 - "MaintenanceRun"
Cohesion: 0.19
Nodes (13): BrainStatusSchema, identity, brainCheckpointCompletion(), coverageSchema, verified, publishedWorkCleanedUp(), nativeChecks, outcomeKnown() (+5 more)

### Community 138 - "engine.ts"
Cohesion: 0.20
Nodes (14): enumerateIntakeList(), inPickupOrder(), Intake, text(), checkMail(), drainMail(), requestMail(), enableNightly() (+6 more)

### Community 139 - "OfficeSnapshot"
Cohesion: 0.04
Nodes (77): ctoInputIdentityMatches(), ctoInputRecovered(), metadataParkAction(), ADOPTION_STALLED_MS, conversationResolved(), projectOutbox(), item(), syncOutbox() (+69 more)

### Community 140 - "TicketJob"
Cohesion: 0.09
Nodes (37): removeAdoptedClone(), pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), DeliveryTaskInput, GitHubDelivery, stoppedBaseCheckout(), stoppedBasePackageInstruction(), discussion() (+29 more)

### Community 141 - "agreement.ts"
Cohesion: 0.18
Nodes (15): Agreement, agreement(), anchor(), compare(), disposition(), factsKey(), file(), Corroboration (+7 more)

### Community 142 - "scheduler.ts"
Cohesion: 0.16
Nodes (14): PROJECT_LOCAL, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch(), deliveryOccupied() (+6 more)

### Community 144 - "reconcile-merges.cjs"
Cohesion: 0.22
Nodes (14): collectPulls(), copyWikiForDryRun(), { execFileSync }, flattenPages(), fs, githubRequest(), isWikiBotPull(), main() (+6 more)

### Community 145 - "credential-spans.ts"
Cohesion: 0.11
Nodes (33): queryValue(), separatorEscapeAt(), apostropheEnd(), BARE, bareSpans(), credentialSpans(), genuineGap(), HEADER_VALUE (+25 more)

### Community 146 - "artifact"
Cohesion: 0.05
Nodes (128): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+120 more)

### Community 148 - "runner-root.ts"
Cohesion: 0.12
Nodes (33): resolveCliRoot(), DEFAULT_OFFICE_URL, LOOPBACK, officeUrl(), privateDirectories(), RunnerPaths, runnerPaths(), PIN_ENTRY (+25 more)

### Community 149 - "redactEvidence"
Cohesion: 0.13
Nodes (19): mailboxFreeze(), AWS_KEY_ID, JSON_WEB_TOKEN, PROVIDER_TOKEN, redactCredentials(), redactEvidence(), redactUnquoted(), absent() (+11 more)

### Community 150 - "serve-graph.cjs"
Cohesion: 0.24
Nodes (9): createServer(), fs, http, listen(), attempt(), main(), path, resolveRequest() (+1 more)

### Community 151 - "workKey"
Cohesion: 0.13
Nodes (27): notOwned(), observePrerequisites(), mergedByOwner(), harnessMergeAttempted(), mergedByOfficeBot(), mergeEffects(), officeMerge(), closeableIssue() (+19 more)

### Community 152 - "record-runner-failure.ts"
Cohesion: 0.09
Nodes (35): incidentNotices(), NOTICE_KINDS, STATUS, classify(), isRestoration(), KEY, newer(), record() (+27 more)

### Community 153 - "bare-value.ts"
Cohesion: 0.16
Nodes (18): BareValue, bareValue(), deeperValueEnd(), ENDS, isSeparator(), plainEscape(), SIMPLE, Unit (+10 more)

### Community 154 - "DeploymentFence"
Cohesion: 0.33
Nodes (4): assertToken(), DeploymentFence, DeploymentFenceGateContext, DeploymentFenceRouteContext

### Community 155 - "recorded-gh-command.ts"
Cohesion: 0.19
Nodes (20): assignments(), changeDirectory(), closing(), CREATE, createGuard(), flags(), named(), read() (+12 more)

### Community 156 - "assignment.ts"
Cohesion: 0.13
Nodes (23): latestQA(), notPassedInLatestQA(), QACoverage, qaCoverage(), same(), Tested, safeWebUrl(), officeQAGuidance() (+15 more)

### Community 157 - "observe-github-merges.ts"
Cohesion: 0.30
Nodes (14): clearCooldown(), coolDown(), coolingDown(), MERGE_NOTICE_RECHECK_MS, waitKey(), waits, isMergeCommit(), issueOf() (+6 more)

### Community 158 - "halt-report.ts"
Cohesion: 0.08
Nodes (25): FailureReceipt, haltCondition(), forwardFailures(), forwardIntent(), ForwardSummary, Standing, EMPTY_HALT, ForwardCursor (+17 more)

### Community 160 - "push-credentials.ts"
Cohesion: 0.32
Nodes (10): Execute, assertBoundPushDestination(), digest(), Execute, file(), PUSH_HOOKS, pushHookChain(), inspect() (+2 more)

### Community 161 - "backup-stores.ts"
Cohesion: 0.25
Nodes (11): ActiveRelease, readActiveRelease(), BackupEntry, BackupInput, BackupInventory, backupStores(), INVENTORY_FILE, schemaOf() (+3 more)

### Community 162 - "github-check-selection.ts"
Cohesion: 0.07
Nodes (54): queueMergeNotice(), idle(), intentState(), METADATA_PARKS_PER_OBSERVATION, observeMetadataParks(), sentState(), DependencyStores, observe() (+46 more)

### Community 163 - "security.ts"
Cohesion: 0.15
Nodes (13): AFTER_JSON_ESCAPE, BEARER_CREDENTIAL, escapedAt(), HEADER_CREDENTIAL, HEADER_OPERAND, HEADER_PREFIX, POSTGRES_URL, PROVIDER_TOKEN (+5 more)

### Community 164 - "telemetry/report.ts"
Cohesion: 0.29
Nodes (12): Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked(), row() (+4 more)

### Community 165 - "proof-comment.ts"
Cohesion: 0.35
Nodes (13): commentId(), CommentIntent, CommentReceipt, conversation(), exact(), findProofComment(), matchesProofComment(), postProofComment() (+5 more)

### Community 166 - "launch.mjs"
Cohesion: 0.05
Nodes (105): RFC-9562, BANNER, builtin(), bundleLauncher(), LAUNCHER_BUNDLE, LAUNCHER_ENTRY, launcherChunk(), REPOSITORY (+97 more)

### Community 167 - "offices.ts"
Cohesion: 0.28
Nodes (6): leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), DELIVERY_CONCURRENCY, InFlightOperations

### Community 168 - "incident-command.ts"
Cohesion: 0.38
Nodes (6): FLAGS, incidentCommand(), IncidentCommandIO, option(), USAGE, whole()

### Community 169 - "StateParts"
Cohesion: 0.29
Nodes (3): PartRow, partSize(), StateParts

### Community 170 - "useOfficePreferences.ts"
Cohesion: 0.12
Nodes (18): PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, acceptPreferences(), PreferenceCandidate, PreferenceState (+10 more)

### Community 171 - "deploy-plan.ts"
Cohesion: 0.13
Nodes (34): runningRevision(), runningRevision(), runtimeRevision(), BUILD_ENV, buildRelease(), BuildReleaseOptions, Execute, pinnedVersions() (+26 more)

### Community 172 - "office/readiness.ts"
Cohesion: 0.29
Nodes (7): effectiveCause(), REPLACED, BLOCKED_CAUSES, blockedCauses(), NONE, projectReadiness(), BlockedCause

### Community 173 - "provider-limit-resolution.ts"
Cohesion: 0.33
Nodes (7): investigatesLimitRefusal(), PROVIDER_RECOVERED, providerLimitResolution(), refusedAtLimit(), exitFailure(), MONTHS, providerLimit()

### Community 174 - "ref_zod"
Cohesion: 0.22
Nodes (6): Body, DeploymentFenceState, Health, IdleObservation, IdleResult, WaitIdleInput

### Community 175 - "validate_wiki_pr_body.cjs"
Cohesion: 0.33
Nodes (5): { execFileSync }, hasCanonicalWikiBody(), maintenanceBodies, matchesMaintenanceBody(), { readFileSync }

### Community 176 - "release-unpark.ts"
Cohesion: 0.43
Nodes (5): MAX_RELEASE_UNPARKS, RELEASE_CHECK_MS, compare(), highestStableAtLeast(), parts()

### Community 177 - "office-qa-handoff.ts"
Cohesion: 0.60
Nodes (4): OfficeQAHandoff, OfficeQAHandoffInput, OfficeQAHandoffRequest, QAOwnershipProof

### Community 179 - "parked-card-refusal.ts"
Cohesion: 0.60
Nodes (4): BLOCK, harnessBlockMove(), harnessParkedCard(), noted()

### Community 180 - "write-boundary.ts"
Cohesion: 0.14
Nodes (23): appCredential(), operatorRollbackCredential(), GitHubIdentityRuntime, canonicalDigest(), appToken(), bindingOf(), changeDigest(), claimRefusal() (+15 more)

### Community 181 - "restoreInPlace"
Cohesion: 0.60
Nodes (5): identity(), Json, plain(), restorable(), restoreInPlace()

### Community 182 - "qa-plan-retry.ts"
Cohesion: 0.67
Nodes (3): QAPlanRetry, QAPlanRetryProof, QAPlanRetryRequest

### Community 183 - "session-snapshot-cleanup.ts"
Cohesion: 0.40
Nodes (5): SNAPSHOT_PREFIX, removeStaleSessionSnapshots(), SNAPSHOT_SWEEP_MS, STALE_SNAPSHOT_MS, sweepStaleSessionSnapshots()

## Knowledge Gaps
- **1 isolated node(s):** `RFC-9562`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 1330 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `IncidentLedger`, `OrgChart.tsx`, `worker-runtime.ts`, `features/workflow.ts`, `github-delivery.ts`, `scheduled-features.ts`, `propose-improvements.ts`, `request.ts`, `scheduled-captures.ts`, `run-retrospective.ts`, `record-trigger.ts`, `route-activation.ts`, `coordination-tick.ts`, `cec-reads.ts`, `jira-time.ts`, `post-conflict-preparation.ts`, `github.ts`, `controller-runtime.ts`, `advance-metadata-park.ts`, `digest`, `delivery-authority.ts`, `run.ts`, `identity-runtime.ts`, `scheduled-work.ts`, `link-draft-issue.ts`, `.transaction`, `time-scope.ts`, `assignments.ts`, `.save`, `Offices`, `index.ts`, `readable-jira-comment.ts`, `investigations/ledger.ts`, `JiraIssuePublisher`, `dependency-bots/adopt.ts`, `cost-ledger.ts`, `demand-facts.ts`, `coordination.ts`, `ref_node_crypto`, `azure.ts`, `holdReason`, `agents.ts`, `session-bridge.ts`, `remove-candidate.ts`, `accessibility-sources.ts`, `stopped-record.ts`, `conversations/conversations.ts`, `superseded-wiki-pr.ts`, `provider-observation.ts`, `project-bindings.ts`, `.emit`, `Ticket`, `process.ts`, `ticket-stage-runner.ts`, `time-readback.ts`, `harnessEffect`, `judge-resumes.ts`, `pr-observation-graphql.ts`, `blocker-followups.ts`, `sanitize`, `cec.ts`, `run-accounting.ts`, `control-store.ts`, `features/commands.ts`, `.getEffect`, `daily-cto.ts`, `effects.ts`, `publication.ts`, `resume-after-sign-in.ts`, `work.ts`, `retrospective-subject.ts`, `http/commands.ts`, `easternDay`, `MaintenanceRun`, `engine.ts`, `OfficeSnapshot`, `TicketJob`, `scheduler.ts`, `artifact`, `Engine`, `workKey`, `observe-github-merges.ts`, `push-credentials.ts`, `github-check-selection.ts`, `proof-comment.ts`, `offices.ts`, `StateParts`, `provider-limit-resolution.ts`, `release-unpark.ts`, `parked-card-refusal.ts`, `write-boundary.ts`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **What connects `RFC-9562` to the rest of the system?**
  _1 weakly-connected nodes found - possible missing edges._
- **Should `IncidentLedger` be split into smaller, more focused modules?**
  _Cohesion score 0.10359408033826638 - nodes in this community are weakly interconnected._
- **Why does `command()` connect `process.ts` to `work.ts`, `worker-runtime.ts`, `features/workflow.ts`, `github-delivery.ts`, `easternDay`, `incidents/routes.ts`, `MaintenanceRun`, `engine.ts`, `TicketJob`, `scheduled-captures.ts`, `artifact`, `Engine`, `worker-sandbox-run.ts`, `jira-time.ts`, `record-runner-failure.ts`, `github.ts`, `controller-runtime.ts`, `digest`, `identity-runtime.ts`, `link-draft-issue.ts`, `.transaction`, `assignments.ts`, `.save`, `deploy-plan.ts`, `rate-limit-samples.ts`, `service-plist.ts`, `CommandRegistry`, `readable-jira-comment.ts`, `JiraIssuePublisher`, `cost-ledger.ts`, `coordination.ts`, `service-health.ts`, `azure.ts`, `holdReason`, `agents.ts`, `session-bridge.ts`, `remove-candidate.ts`, `accessibility-sources.ts`, `provider-observation.ts`, `project-bindings.ts`, `Ticket`, `ticket-stage-runner.ts`, `time-readback.ts`, `Store`, `deploy.ts`, `harnessEffect`, `.getEffect`, `deploy-command.ts`, `effects.ts`, `publication.ts`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Should `OrgChart.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.04950495049504951 - nodes in this community are weakly interconnected._
- **Why does `TicketJob` connect `TicketJob` to `work.ts`, `retrospective-subject.ts`, `worker-runtime.ts`, `OrgChart.tsx`, `cx`, `github-delivery.ts`, `MaintenanceRun`, `OfficeSnapshot`, `App.tsx`, `request.ts`, `scheduled-captures.ts`, `scheduler.ts`, `record-trigger.ts`, `artifact`, `coordination-tick.ts`, `workKey`, `post-conflict-preparation.ts`, `fact-bounds.ts`, `advance-metadata-park.ts`, `observe-github-merges.ts`, `digest`, `delivery-authority.ts`, `work-summary.ts`, `github-check-selection.ts`, `scheduled-work.ts`, `proof-comment.ts`, `link-draft-issue.ts`, `release-unpark.ts`, `parked-card-refusal.ts`, `dependency-bots/adopt.ts`, `coordination.ts`, `ref_node_crypto`, `holdReason`, `remove-candidate.ts`, `superseded-wiki-pr.ts`, `.emit`, `ticket-stage-runner.ts`, `Store`, `harnessEffect`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Should `worker-runtime.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0438871473354232 - nodes in this community are weakly interconnected._