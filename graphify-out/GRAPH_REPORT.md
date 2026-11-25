# Graph Report - the-office  (2026-11-25)

## Corpus Check
- 1223 files · ~517,519 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 6273 nodes · 27748 edges · 161 communities (152 shown, 9 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 1011 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4c678ae3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- incidents/routes.ts
- OrgChart.tsx
- worker-runtime.ts
- features/workflow.ts
- cx
- daily-cto.ts
- workKey
- index.tsx
- holdReason
- TelemetryPanel.tsx
- review-run.ts
- Store
- App.tsx
- admit-improvement.ts
- advance-metadata-park.ts
- scheduled-captures.ts
- work-summary.ts
- record-trigger.ts
- deploy-command.ts
- requests.ts
- artifact
- harnessEffect
- weekly-rollup.ts
- jira-time.ts
- ref_zod
- GitHubDelivery
- agents.ts
- owner-merged-stopped.ts
- github-delivery.ts
- Goals.tsx
- ref_node_util
- deployed-fixes.ts
- index.ts
- remove-candidate.ts
- api-routes.ts
- wiki-graph.cjs
- scheduled-work.ts
- routing.cjs
- redact-evidence.ts
- run-retrospective.ts
- http/commands.ts
- time-scope.ts
- Ticket
- .save
- Offices
- harness-baseline.ts
- OfficeScene.tsx
- features/commands.ts
- assignment.ts
- pilot-delivery.ts
- project-binding-blocks.ts
- brain-maintenance.ts
- local-config.ts
- sanitizeObject
- jiraBinding
- ref_node_child_process
- features.ts
- deploy.ts
- ref_node_path
- jira-attempts.ts
- cost-ledger.ts
- time-ledger.ts
- maintenance/maintenance.ts
- ref_react
- resume-outcome.ts
- validate_pr_body.cjs
- audit-plan-candidates.cjs
- alert-issue.ts
- .emit
- ticket-evidence.ts
- constellation-runtime.ts
- cec.ts
- session-context-file.ts
- assignments.ts
- session-scope.ts
- service-health.ts
- project-bindings.ts
- diagnostic-snapshot.ts
- incidents.ts
- fact-bounds.ts
- session-bridge.ts
- Coordinator
- release-unpark.ts
- timed-statements.ts
- viewer.js
- release-floor.ts
- stopped-record.ts
- sanitize
- shared.ts
- process.ts
- provider-observation.ts
- cec/issue-publication.ts
- session-context-client.ts
- plans.cjs
- report.ts
- capture-session-clone.py
- sign-in-unpark.ts
- salvage-worktree.ts
- cec/workflow.ts
- archive-plan.cjs
- notifications.ts
- digest
- coordination-tick.ts
- on-merge-sync.cjs
- backup-stores.ts
- extract-worker.mjs
- deploy-plan.ts
- work.ts
- DeploymentFence
- goal-evidence.ts
- blocker-followups.ts
- assignment-poll.ts
- outbox.ts
- checkpoint-completion.ts
- slack-supersession.ts
- run-accounting.ts
- qa.ts
- qa-plan-continuation.ts
- writer-restart.ts
- github/issue-publication.ts
- lesson-selection.ts
- follow-production.ts
- resume-control.ts
- createConstellation
- refresh-issue-state.cjs
- knowledge.ts
- route-head.ts
- offices.ts
- node-visuals.ts
- accessibility-sources.ts
- pre-push-boundary.ts
- it-specialist.ts
- interrupted-work-recovery.ts
- judge-resumes.ts
- MaintenanceRun
- controller-runtime.ts
- enrollment-gate.ts
- Effects
- ledger.ts
- FeatureWorkflow
- session-snapshot-cleanup.ts
- scene-motion.ts
- scheduler.ts
- production.ts
- reconcile-merges.cjs
- preferences-store.ts
- RoomCamera.tsx
- metadata-park-words.ts
- ProjectProgress
- harness-parked-card.ts
- common.cjs
- Conversation.tsx
- coordination.ts
- qa-plan-retry.ts
- install-service.mjs
- validate_wiki_pr_body.cjs
- delivery-ownership.ts
- unblock-brief.ts
- SceneOverlay.tsx
- routing.js
- packed-consumer-pnpm.ts

## God Nodes (most connected - your core abstractions)
1. `Store` - 451 edges
2. `TicketJob` - 216 edges
3. `command()` - 161 edges
4. `digest()` - 160 edges
5. `holdReason()` - 141 edges
6. `GitHubDelivery` - 129 edges
7. `OfficeSnapshot` - 123 edges
8. `artifact()` - 114 edges
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
- `DeliverySlot` --references--> `Role`  [EXTRACTED]
  server/office/projects.ts → src/shared.ts

## Import Cycles
- 2-file cycle: `server/scheduling/coordination-pump.ts -> server/scheduling/coordination.ts -> server/scheduling/coordination-pump.ts`
- 2-file cycle: `server/scheduling/coordination-tick.ts -> server/scheduling/coordination.ts -> server/scheduling/coordination-tick.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/track-adopted-review.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/stage-reconciliation.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/accept-stage-result.ts -> server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/accept-stage-result.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/publication/metadata-context.ts -> server/delivery/pipeline/github-delivery.ts`
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
- 2-file cycle: `server/workers/exit-failure.ts -> server/workers/process.ts -> server/workers/exit-failure.ts`
- 3-file cycle: `server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-guard.ts -> server/delivery/pipeline/github-delivery.ts`

## Communities (161 total, 9 thin omitted)

### Community 0 - "incidents/routes.ts"
Cohesion: 0.06
Nodes (65): citationFault(), CitationSchema, SourceVersions, sourceVersions(), dismiss(), DISMISSAL_CITATIONS, DISMISSAL_REASON, DismissalFacts (+57 more)

### Community 1 - "OrgChart.tsx"
Cohesion: 0.12
Nodes (38): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+30 more)

### Community 2 - "worker-runtime.ts"
Cohesion: 0.07
Nodes (37): savedStageCompletion(), candidateWorkspaceEnvironment(), assignmentSubject(), catalogLine(), assertBriefingScope(), assertModelOverrides(), CODEX_DEFAULT_EFFORT, CODEX_DEFAULT_MODEL (+29 more)

### Community 3 - "features/workflow.ts"
Cohesion: 0.08
Nodes (53): approveFeature(), featureById(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), discoveryPrompt(), planPrompt() (+45 more)

### Community 4 - "cx"
Cohesion: 0.09
Nodes (86): Outbox(), blockedSummary(), currentServices(), ServiceHealthPanel(), followUp(), labels, ServiceHealthRow(), BlockerFollowups() (+78 more)

### Community 5 - "daily-cto.ts"
Cohesion: 0.07
Nodes (33): currentCitations(), Fact, NOT_CURRENT, PROVIDER_ERROR, DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt() (+25 more)

### Community 6 - "workKey"
Cohesion: 0.06
Nodes (74): boardPreflightCandidate(), implementationRecoveryCandidate(), candidateInput(), children, oldAdoptionBasis(), SavedCandidateAdmission, savedCandidateAdmission(), assertPostConflictFiles() (+66 more)

### Community 7 - "index.tsx"
Cohesion: 0.11
Nodes (46): LearningCoverage(), when(), LessonsView(), SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), loadOfficeConfig() (+38 more)

### Community 8 - "holdReason"
Cohesion: 0.06
Nodes (72): idle(), intentState(), METADATA_PARKS_PER_OBSERVATION, observeMetadataParks(), sentState(), resumeParked(), observe(), approveMerge() (+64 more)

### Community 9 - "TelemetryPanel.tsx"
Cohesion: 0.09
Nodes (44): TelemetryReport, LiveAnchor, displayAgentTask(), LiveAgentTask(), Props, RunningTask(), text(), Agent (+36 more)

### Community 10 - "review-run.ts"
Cohesion: 0.15
Nodes (28): featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS, reserveReplacement(), stageBudget() (+20 more)

### Community 11 - "Store"
Cohesion: 0.08
Nodes (23): Clock, checkpointLabel(), applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, identity(), Json (+15 more)

### Community 12 - "App.tsx"
Cohesion: 0.06
Nodes (60): createConversationDrafts(), BrainDrawer(), themeColor, App(), BrainWorkspace, CONNECTION, CONNECTION_DOT, dockItemVariants (+52 more)

### Community 13 - "admit-improvement.ts"
Cohesion: 0.19
Nodes (19): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+11 more)

### Community 14 - "advance-metadata-park.ts"
Cohesion: 0.10
Nodes (60): ProjectCard, advanceMetadataPark(), Parked, releaseWords(), sentAnything(), CardResumeRoute, cardResumeRoute(), effectiveParkPickup() (+52 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.13
Nodes (52): requestDelivery(), accounting, DeliverySubject, nonDelivery, originalReads, createFeature(), assertEnrollable(), enrolled() (+44 more)

### Community 16 - "work-summary.ts"
Cohesion: 0.09
Nodes (42): jiraQueueProgress(), nextStage(), deliveryRoles, JiraQueueProgress, TicketProgress, ROLE_NAMES, STAGE_LABELS, STAGE_ROLE (+34 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.09
Nodes (47): baselined(), baselineLearning(), LEARNING_BASELINES, maintainLearning(), maintenanceSubject(), MaintenanceSubjectFacts, clip(), maintenanceBlockedId() (+39 more)

### Community 18 - "deploy-command.ts"
Cohesion: 0.12
Nodes (41): CONTROLLER_ENTRY, ControllerPin, Pin, pinnedController(), readControllerPin(), writeControllerPin(), controllerOf(), deployCommand() (+33 more)

### Community 19 - "requests.ts"
Cohesion: 0.09
Nodes (45): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+37 more)

### Community 20 - "artifact"
Cohesion: 0.05
Nodes (134): containedFile(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal (+126 more)

### Community 21 - "harnessEffect"
Cohesion: 0.09
Nodes (68): effectKey(), LaneOperation, laneWrite(), moveCardOnce(), Lane, MOVABLE, moveLane(), resolveLane() (+60 more)

### Community 22 - "weekly-rollup.ts"
Cohesion: 0.14
Nodes (24): deliveryMetrics(), median(), learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck() (+16 more)

### Community 23 - "jira-time.ts"
Cohesion: 0.10
Nodes (37): unresolvedAttempts(), bindingOf(), connectWith(), data(), envelope(), finishVerifiedEffects(), JiraWorklogs, locks (+29 more)

### Community 24 - "ref_zod"
Cohesion: 0.12
Nodes (17): Body, DeploymentFenceState, append(), assertNext(), DeployJournalView, DeployStepState, Entry, Header (+9 more)

### Community 25 - "GitHubDelivery"
Cohesion: 0.10
Nodes (19): GitHubDelivery, adoptCandidate(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related (+11 more)

### Community 26 - "agents.ts"
Cohesion: 0.05
Nodes (52): implementationWorkerContext(), RefusedQAResult, assertContinuableWorktree(), CONTINUABLE, continuationPrompt(), MAX_CONTINUATIONS, recordedContinuation(), StageContinuation (+44 more)

### Community 27 - "owner-merged-stopped.ts"
Cohesion: 0.15
Nodes (20): notOwned(), mergedByOwner(), closeableIssue(), effectsSettled(), eligible(), officePublished(), ownerMerged(), prerequisitesMet() (+12 more)

### Community 28 - "github-delivery.ts"
Cohesion: 0.05
Nodes (100): writerRestartInstruction(), harnessCloseout(), PASSING, verifyMergeActions(), findingsBlock(), QA_STAGES, reviewAdvisoryIds(), Reviewed (+92 more)

### Community 29 - "Goals.tsx"
Cohesion: 0.07
Nodes (38): GoalProgress, ChatMarkdown(), ChatMarkdown, MessageText(), OutboxSavedImplementation(), apply(), review(), OutboxSavedPlan() (+30 more)

### Community 30 - "ref_node_util"
Cohesion: 0.10
Nodes (53): retryRead(), admitPRMetadata(), evaluatePRMetadata(), MetadataHumanEdit, unbound(), assessPRMetadata(), captureAssessment(), originalProposal() (+45 more)

### Community 31 - "deployed-fixes.ts"
Cohesion: 0.14
Nodes (27): inHistoryOf(), CompareMemory, compareMemory(), COMPARES_PER_PASS, comparison(), DeployedFixes, DeployedFixesInput, recordDeployedFixes() (+19 more)

### Community 32 - "index.ts"
Cohesion: 0.08
Nodes (24): close(), config, itSpecialist, loadedRevision, offices, releaseLock, server, serviceHealth (+16 more)

### Community 33 - "remove-candidate.ts"
Cohesion: 0.14
Nodes (23): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), maintenanceCandidate(), moveAside(), moveBack(), purgeRemoved(), purging (+15 more)

### Community 34 - "api-routes.ts"
Cohesion: 0.17
Nodes (20): implementationContinuationRoute(), qaPlanRetryRoute(), assertQuestionVisibility(), featureRoute(), goalHistory(), saveGoal(), apiRoute(), RequestContext (+12 more)

### Community 35 - "wiki-graph.cjs"
Cohesion: 0.22
Nodes (19): connections(), fs, main(), path, ensureInside(), hasSymlinkComponent(), slash(), collect() (+11 more)

### Community 36 - "scheduled-work.ts"
Cohesion: 0.10
Nodes (35): freshOwnershipRead(), deliverySlot(), withAmendmentOwnership(), metadataRequestResolved(), gateFeatureWork(), RollupResult, RollupHooks, requestPriority() (+27 more)

### Community 37 - "routing.cjs"
Cohesion: 0.11
Nodes (31): fs, main(), path, { spawnSync }, digest(), frontmatterProblems(), adjacency(), edgeCost() (+23 more)

### Community 38 - "redact-evidence.ts"
Cohesion: 0.08
Nodes (41): attributedRecords(), foldsItsRun(), groupCandidates(), FailedMailCheck, lastFailedMailCheck(), lastMailCheckOutcome(), MailCheckOutcome, mailboxFreeze() (+33 more)

### Community 39 - "run-retrospective.ts"
Cohesion: 0.08
Nodes (50): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, BlockingTrigger, blockingTrigger(), isBlocking() (+42 more)

### Community 40 - "http/commands.ts"
Cohesion: 0.11
Nodes (29): configureNotices(), PrerequisitesSchema, classifyStop(), bindDiscoveryResume(), DiscoveryResumeInput, scopeNote(), requeueWaitedImplement(), normalizeStatement() (+21 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.18
Nodes (22): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), midnight(), TicketDay (+14 more)

### Community 42 - "Ticket"
Cohesion: 0.06
Nodes (23): AzureMonitor, carriedNotRepeated(), changeScopeNote(), Scoped, applyIntakeObservation(), JiraOperations, checkMail(), drainMail() (+15 more)

### Community 43 - ".save"
Cohesion: 0.09
Nodes (59): enumerateIntakeList(), inPickupOrder(), Intake, text(), resolveBlockedTransition(), document(), transitionWithComment(), jiraAccount() (+51 more)

### Community 44 - "Offices"
Cohesion: 0.13
Nodes (4): QuestionNotifications, mirrorOfficeKnowledge(), Offices, OfficeKnowledge

### Community 45 - "harness-baseline.ts"
Cohesion: 0.15
Nodes (22): BaselineReport, baselineReport(), BaselineSource, baselineText(), millions(), row(), share(), add() (+14 more)

### Community 46 - "OfficeScene.tsx"
Cohesion: 0.16
Nodes (34): withoutElapsed(), Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk() (+26 more)

### Community 47 - "features/commands.ts"
Cohesion: 0.20
Nodes (20): commandFeature(), reviewQuestions(), FeatureCommandSchema, automaticIntakeWait(), IntakeView, applyHarnessAction(), HarnessActionInput, recoveryPreconditions() (+12 more)

### Community 48 - "assignment.ts"
Cohesion: 0.11
Nodes (29): latestQA(), notPassedInLatestQA(), QACoverage, qaCoverage(), same(), Tested, stagePrompt(), StagePromptInput (+21 more)

### Community 49 - "pilot-delivery.ts"
Cohesion: 0.07
Nodes (61): candidateBranchMoved(), applyChangeScope(), endChangeScope(), levels(), MAX_CHECKS, owedUnderScope(), scopeBase(), scopeOutgrown() (+53 more)

### Community 50 - "project-binding-blocks.ts"
Cohesion: 0.18
Nodes (19): azureSchema, deploymentSchema, jiraSchema, ownJiraSchema, promptSchema, DEFAULT_STAGE_STATUSES, intakeStatus, resolvedStatuses() (+11 more)

### Community 51 - "brain-maintenance.ts"
Cohesion: 0.15
Nodes (16): maintenancePolicies(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, brainResultStop(), GateMark, gateMark(), MAX_START_RETRIES (+8 more)

### Community 52 - "local-config.ts"
Cohesion: 0.12
Nodes (26): AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), FeaturePlanningBindings, goalEvidencePath(), OfficeConfigInputs, officeConfigRoute(), officeConfigSummary(), projectSettingsSummary() (+18 more)

### Community 53 - "sanitizeObject"
Cohesion: 0.14
Nodes (17): sanitizeObject(), readSavedState(), LARGE_KEY_CHARS, plain(), RedactedEntries, RedactedEntry, redactEntries(), joinParts() (+9 more)

### Community 54 - "jiraBinding"
Cohesion: 0.20
Nodes (6): contentSchema(), JiraIssuePublisher, descriptionPreimage(), plain(), publicationDescription(), jiraBinding()

### Community 55 - "ref_node_child_process"
Cohesion: 0.13
Nodes (18): changedPaths(), { execFileSync }, files, isMapInput(), mapOnly(), { execFileSync }, git(), publish() (+10 more)

### Community 56 - "features.ts"
Cohesion: 0.08
Nodes (42): normalizeRound(), FeatureApproval, FeatureAttempt, FeatureAuthority, FeatureDocument, FeatureHandoff, FeatureHarnessAction, FeatureHarnessOption (+34 more)

### Community 57 - "deploy.ts"
Cohesion: 0.11
Nodes (46): fenceTokenDigest(), ControllerEffects, DEPLOY_PROJECT, abandon(), advance(), DeployContext, DeployTimings, Commit (+38 more)

### Community 58 - "ref_node_path"
Cohesion: 0.05
Nodes (73): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+65 more)

### Community 59 - "jira-attempts.ts"
Cohesion: 0.10
Nodes (29): attempted(), attemptState(), bound(), covers(), JiraAttempt, jiraAttempts(), JiraAttemptState, open() (+21 more)

### Community 60 - "cost-ledger.ts"
Cohesion: 0.13
Nodes (32): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress(), effectId() (+24 more)

### Community 61 - "time-ledger.ts"
Cohesion: 0.20
Nodes (14): publishableEntry(), settlementPending(), superseded(), ticketUnresolved(), syncing, TimeLedger, clearUnsent(), dueUnsent() (+6 more)

### Community 62 - "maintenance/maintenance.ts"
Cohesion: 0.12
Nodes (23): captureMaintenanceStep(), accessibilitySources(), sourceReview(), candidateOwner(), SETTLED, skipOwnedCandidate(), Skipped, skippedCandidateLedger() (+15 more)

### Community 63 - "ref_react"
Cohesion: 0.07
Nodes (59): KnowledgeActivity, KnowledgeActivityPage, KnowledgeEdge, KnowledgeMap, KnowledgeNode, Activity(), ActivityTimeline(), AssignmentKnowledge() (+51 more)

### Community 64 - "resume-outcome.ts"
Cohesion: 0.09
Nodes (30): FLAGS, incidentCommand(), IncidentCommandIO, option(), USAGE, whole(), boundaryCrossed(), Crossing (+22 more)

### Community 65 - "validate_pr_body.cjs"
Cohesion: 0.36
Nodes (8): fs, main(), readableText(), REQUIRED_CHECKS, REQUIRED_SECTIONS, sections(), validatePullRequestBody(), withoutComments()

### Community 66 - "audit-plan-candidates.cjs"
Cohesion: 0.14
Nodes (31): audit(), branchIssueNumbers(), classify(), distinctiveTitleWords(), { execFileSync }, extractPaths(), findPrForMergeSubject(), fmtCommit() (+23 more)

### Community 67 - "alert-issue.ts"
Cohesion: 0.14
Nodes (24): AlertIssue, alertIssueBody(), alertIssueTitle(), alertMarker(), closeAlertIssue(), ensureAlertIssue(), findAlertIssue(), Guard (+16 more)

### Community 68 - ".emit"
Cohesion: 0.08
Nodes (76): restartStoppedWriters(), unchangedSinceAccepted(), DeliveryAuthorityInput, canonical(), assessResumes(), Standing, CheckpointEligibility, checkpointEligibility() (+68 more)

### Community 69 - "ticket-evidence.ts"
Cohesion: 0.11
Nodes (33): assetDownloader(), attachmentKind(), evidenceDirectory(), readEvidence(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS (+25 more)

### Community 70 - "constellation-runtime.ts"
Cohesion: 0.15
Nodes (16): CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point, focusOverlayMotion(), FocusOverlayLayout (+8 more)

### Community 71 - "cec.ts"
Cohesion: 0.06
Nodes (49): escaped(), IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), intakeMembership(), projectListScope(), movedHeadNote() (+41 more)

### Community 72 - "session-context-file.ts"
Cohesion: 0.20
Nodes (14): ContextFoldPrefix, contextFoldPrefix(), SessionContextCheckpoint, captureSessionContextClone(), ContextReadPhase, SessionContextDeadline, sessionContextFile(), ContextReadChanged (+6 more)

### Community 73 - "assignments.ts"
Cohesion: 0.06
Nodes (53): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, CommittedBrain (+45 more)

### Community 74 - "session-scope.ts"
Cohesion: 0.18
Nodes (17): Bound, claudeScopeParser(), claudeSessionScope(), CLAUDE_TRANSCRIPTS, CODEX_ROLLOUTS, contextReaders(), retainSessionMessage(), SessionConversation (+9 more)

### Community 75 - "service-health.ts"
Cohesion: 0.13
Nodes (21): ClaudeLoginRefusal, claudeLoginRefusal(), claudeRefusalWords(), RECORDED_REFUSALS, refusedClaudeRow(), listenerHealth(), providers, ProviderStatusChecks (+13 more)

### Community 76 - "project-bindings.ts"
Cohesion: 0.12
Nodes (32): az(), buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs(), fullActivePRs(), observation() (+24 more)

### Community 77 - "diagnostic-snapshot.ts"
Cohesion: 0.17
Nodes (17): assignmentDiagnostics(), diagnosticContext(), diagnosticSnapshot(), followUpPicture(), publishITReport(), archiveOldReports(), RETAINED_REPORTS, archiveByMonth() (+9 more)

### Community 78 - "incidents.ts"
Cohesion: 0.10
Nodes (39): ObservedIncident, ObservedSubject, digest(), fingerprint(), incidentId(), details(), planSync(), Provenance (+31 more)

### Community 79 - "fact-bounds.ts"
Cohesion: 0.19
Nodes (18): leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance() (+10 more)

### Community 80 - "session-bridge.ts"
Cohesion: 0.10
Nodes (30): claudeSessionContext(), codexDaemonProcesses(), accountCodexProcesses(), CodexProcessInventory, codexProcessInventory(), DesktopSessions, unaccountedProcesses(), codexSessionContext() (+22 more)

### Community 82 - "release-unpark.ts"
Cohesion: 0.36
Nodes (6): MAX_RELEASE_UNPARKS, RELEASE_CHECK_MS, returnToPickup(), compare(), highestStableAtLeast(), parts()

### Community 83 - "timed-statements.ts"
Cohesion: 0.17
Nodes (14): StoreTiming, StoreTimings, storeTimings(), NAMED, rowsText(), rowText(), SQL_TOKEN, statementName() (+6 more)

### Community 84 - "viewer.js"
Cohesion: 0.19
Nodes (25): addMetaLink(), addMetaRow(), addRelationship(), applyView(), buildIndexes(), buildLegend(), buildModel(), buildRenderer() (+17 more)

### Community 85 - "release-floor.ts"
Cohesion: 0.33
Nodes (6): AS_COMMITTED, Execute, FloorReading, message(), readReleaseFloor(), RELEASE_FLOOR

### Community 86 - "stopped-record.ts"
Cohesion: 0.08
Nodes (55): capabilityBlockedReviews(), latestReviews(), Admission, boundedEvidence(), expectedWait(), StopFacts, normalizeCause(), IncidentCollector (+47 more)

### Community 87 - "sanitize"
Cohesion: 0.07
Nodes (39): assertConversationReadback(), Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff(), saveGoals() (+31 more)

### Community 88 - "shared.ts"
Cohesion: 0.04
Nodes (63): DailyCTOSummary, ProgressionItem, SendMessage, DAYS, dueLessonDecisions(), easternWeek(), LESSON_DIGEST, LessonDecision (+55 more)

### Community 89 - "process.ts"
Cohesion: 0.08
Nodes (27): jiraText(), GitHubFeaturePublisher, JiraFeaturePublisher, DeployCommandOptions, ControllerLaunch, CommandRegistry, CommandScope, inside() (+19 more)

### Community 90 - "provider-observation.ts"
Cohesion: 0.12
Nodes (27): correlatedBuild(), Azure, azurePipelines(), outcome(), Read, RUNS_PER_PIPELINE, Api, githubWorkflows() (+19 more)

### Community 91 - "cec/issue-publication.ts"
Cohesion: 0.10
Nodes (37): CommentPage, commentReadback(), devUpdate(), HEADLINE, Assignment, Transition, jiraRecord(), unpack() (+29 more)

### Community 92 - "session-context-client.ts"
Cohesion: 0.13
Nodes (18): readTranscript, readRollout, packContextFailure(), PackedContextFailure, unpackContextFailure(), LiveSession, ContextThread, contextThread() (+10 more)

### Community 93 - "plans.cjs"
Cohesion: 0.20
Nodes (18): walk(), association(), auditedDigests(), candidate(), collapseByTitle(), discover(), fromMarkdown(), fs (+10 more)

### Community 94 - "report.ts"
Cohesion: 0.24
Nodes (14): TelemetryRow, TelemetrySync, Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount() (+6 more)

### Community 96 - "sign-in-unpark.ts"
Cohesion: 0.10
Nodes (33): readbackDispatchGuidance(), currentEnvironmentWait(), environmentWait(), waitText(), hasPendingDelivery(), resumeAfterSignIn(), signInWait(), confirmSetupStopCap() (+25 more)

### Community 97 - "salvage-worktree.ts"
Cohesion: 0.48
Nodes (6): Execute, keptWork(), Read, refObject(), SalvageRetry, salvageWorktree()

### Community 98 - "cec/workflow.ts"
Cohesion: 0.19
Nodes (16): Carried, findingsOwedToRetest(), missingRetestDispositions(), publicationEvidenceGap(), stageResultGap(), unresolvedVerification(), officeMergeProvenance(), reconcileMergeScannerRetry() (+8 more)

### Community 99 - "archive-plan.cjs"
Cohesion: 0.12
Nodes (31): fs, main(), parse(), path, archive(), cell(), ensureIndex(), fromArgs() (+23 more)

### Community 100 - "notifications.ts"
Cohesion: 0.10
Nodes (26): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR (+18 more)

### Community 101 - "digest"
Cohesion: 0.05
Nodes (71): GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles(), ContinuationIO (+63 more)

### Community 102 - "coordination-tick.ts"
Cohesion: 0.14
Nodes (12): reconcileNoticeConfirmations(), BrainFollowup, Result, checkpointOutcome(), Outcome, legacy, reconcileContinuations(), pruneCompletedReads() (+4 more)

### Community 103 - "on-merge-sync.cjs"
Cohesion: 0.18
Nodes (23): slugify(), fieldSpan(), keyPattern(), list(), parseListLiteral(), quote(), render(), scalar() (+15 more)

### Community 104 - "backup-stores.ts"
Cohesion: 0.10
Nodes (36): absentAdmission(), AdmissionComparison, AdmissionSnapshot, compareAdmissions(), snapshotAdmissions(), BackupEntry, BackupInput, BackupInventory (+28 more)

### Community 105 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 106 - "deploy-plan.ts"
Cohesion: 0.11
Nodes (42): runningRevision(), runningRevision(), ROOT, releaseIdentity(), runtimeRevision(), ActiveRelease, readActiveRelease(), BUILD_ENV (+34 more)

### Community 107 - "work.ts"
Cohesion: 0.08
Nodes (29): ATTEMPT_DELAYS_MS, nextAttemptAt(), NOT_RETRYABLE, releaseFunds(), StoppedWriter, WRITER_STAGES, WriterRestartCandidate, writerRestartCandidate() (+21 more)

### Community 108 - "DeploymentFence"
Cohesion: 0.18
Nodes (10): assertToken(), DeploymentFence, declaredWithin(), deploymentFenceGate(), DeploymentFenceGateContext, STOPPING_COMMANDS, stoppingCommand(), Action (+2 more)

### Community 109 - "goal-evidence.ts"
Cohesion: 0.17
Nodes (13): GitHubMonitor, githubPRDescription(), azureGoalFacts(), azurePRDescription(), boundedEvidence(), EvidenceStore, GOAL_EVIDENCE_LIMITS, projectPRFacts() (+5 more)

### Community 110 - "blocker-followups.ts"
Cohesion: 0.12
Nodes (46): conversationReadbackReady(), followupOf(), pendingReadback(), queueConversationReadback(), readbackEnding(), uncertainConversations(), readBackConversations(), followupRecord() (+38 more)

### Community 111 - "assignment-poll.ts"
Cohesion: 0.12
Nodes (22): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), admitReadyCards(), confirmedGone() (+14 more)

### Community 112 - "outbox.ts"
Cohesion: 0.13
Nodes (24): currentOutbox(), metadataParkAction(), ADOPTION_STALLED_MS, conversationResolved(), projectOutbox(), item(), syncOutbox(), sameOwnerSteps() (+16 more)

### Community 113 - "checkpoint-completion.ts"
Cohesion: 0.18
Nodes (11): BrainStatusSchema, identity, brainCheckpointCompletion(), coverageSchema, verified, PublishedPR, publishedWorkCleanedUp(), nativeChecks (+3 more)

### Community 114 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 115 - "run-accounting.ts"
Cohesion: 0.05
Nodes (64): BoundedRead, done(), readBoundedNoFollow(), backfillClaudeCost(), CompletionReader, add(), CodexRequest, CodexRollout (+56 more)

### Community 119 - "github/issue-publication.ts"
Cohesion: 0.15
Nodes (10): FeaturePublisher, PublicationReceipt, Assign, Board, Content, GitHubIssuePublisher, number(), same() (+2 more)

### Community 120 - "lesson-selection.ts"
Cohesion: 0.16
Nodes (15): INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), LessonSelection, MAINTENANCE, MAX_LESSONS (+7 more)

### Community 121 - "follow-production.ts"
Cohesion: 0.20
Nodes (17): awaitingJiraStatus(), awaitingProduction(), FOLLOW_DAYS, followed(), isFollowed(), Azure, AzureRead, containedIn() (+9 more)

### Community 122 - "resume-control.ts"
Cohesion: 0.24
Nodes (9): ResumeArrivalsInput, absent(), NEVER_ENABLED, ResumeControl, stated(), Stored, unreadable(), IncidentsRouteContext (+1 more)

### Community 123 - "createConstellation"
Cohesion: 0.18
Nodes (5): ConstellationRuntime, createConstellation(), enter(), finishTap(), move()

### Community 124 - "refresh-issue-state.cjs"
Cohesion: 0.20
Nodes (19): advanceFence(), closingIssues(), githubRefs(), key(), normalizeGithubQuery(), normalizeRepository(), parseGithubQuery(), ref() (+11 more)

### Community 125 - "knowledge.ts"
Cohesion: 0.06
Nodes (37): curateLesson(), Curation, CurationAction, mergeEvidence(), LessonBrainOverlap, BRAIN_SCOPE, SUBJECT, Kind (+29 more)

### Community 126 - "route-head.ts"
Cohesion: 0.07
Nodes (50): stoppedWriter(), writerRestarted(), writerRestartPending(), deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), requireDeliveryAuthority(), gateRegisteredDelivery() (+42 more)

### Community 127 - "offices.ts"
Cohesion: 0.06
Nodes (31): args, [cmd,...rawArgs], commands, key, projectIndex, PICKUP_CHAT, LessonBrainAudit, lessonBrainAudit() (+23 more)

### Community 128 - "node-visuals.ts"
Cohesion: 0.20
Nodes (14): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+6 more)

### Community 129 - "accessibility-sources.ts"
Cohesion: 0.25
Nodes (17): deliveryIntakeBlocker(), actionable(), closingPull(), Finding, handoffIssue(), issueLines(), issueSource(), observation (+9 more)

### Community 130 - "pre-push-boundary.ts"
Cohesion: 0.27
Nodes (10): Event, exactCommand(), Invocation, localHookCommand(), one(), prePushRejection(), PushIdentity, retirementBoundary() (+2 more)

### Community 131 - "it-specialist.ts"
Cohesion: 0.11
Nodes (27): replacedReadback(), OwnerStepItem, ownerStepItems(), signIn(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved() (+19 more)

### Community 132 - "interrupted-work-recovery.ts"
Cohesion: 0.36
Nodes (7): interruptAdoptions(), legacy(), REMOVED_FIELDS, retireLegacyRecovery(), goalNoticeNeverDispatched(), maintenanceNoticeNeverDispatched(), recover()

### Community 133 - "judge-resumes.ts"
Cohesion: 0.08
Nodes (32): PacketInput, absent(), IncidentChange, IncidentLedger, isOpen(), Recorded, judgeResumes(), JudgeResumesInput (+24 more)

### Community 134 - "MaintenanceRun"
Cohesion: 0.22
Nodes (14): checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), repeatedVendorReviewBlock(), stoppedInVendorReview(), leftToNextRun(), NEXT_RUN_DUE_MS, night() (+6 more)

### Community 135 - "controller-runtime.ts"
Cohesion: 0.13
Nodes (15): StoreDatabase, controllerEffects(), alive(), ControllerMachine, option(), realMachine(), runController(), DEFAULT_TIMINGS (+7 more)

### Community 136 - "enrollment-gate.ts"
Cohesion: 0.15
Nodes (33): dispatchNightly(), eligibility(), admit(), IntakeContext, WAIT_STATUSES, compatible(), dependencyCompletionKey(), dependencyEligibility() (+25 more)

### Community 137 - "Effects"
Cohesion: 0.11
Nodes (24): publishFeature(), reconcilePublication(), uncertainPublications(), reserveIdentity(), GitHubOperations, assignedToJoe(), fileLessonIssue(), lessonIssueBody() (+16 more)

### Community 138 - "ledger.ts"
Cohesion: 0.06
Nodes (54): ctoInputIdentityMatches(), ctoInputRecovered(), acceptedCompletionResolution(), INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationCandidates(), investigationId(), ctoReplacementResolution() (+46 more)

### Community 139 - "FeatureWorkflow"
Cohesion: 0.17
Nodes (3): FeatureReviewRunner, FeatureWorkflow, WorkerRuntime

### Community 140 - "session-snapshot-cleanup.ts"
Cohesion: 0.40
Nodes (5): SNAPSHOT_PREFIX, removeStaleSessionSnapshots(), SNAPSHOT_SWEEP_MS, STALE_SNAPSHOT_MS, sweepStaleSessionSnapshots()

### Community 141 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 142 - "scheduler.ts"
Cohesion: 0.15
Nodes (15): systemClock, PROJECT_LOCAL, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch() (+7 more)

### Community 144 - "reconcile-merges.cjs"
Cohesion: 0.21
Nodes (15): remoteSlug(), collectPulls(), copyWikiForDryRun(), { execFileSync }, flattenPages(), fs, githubRequest(), isWikiBotPull() (+7 more)

### Community 145 - "preferences-store.ts"
Cohesion: 0.19
Nodes (9): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS (+1 more)

### Community 146 - "RoomCamera.tsx"
Cohesion: 0.36
Nodes (3): CameraBookmark, restoreBookmark(), RoomCamera()

### Community 147 - "metadata-park-words.ts"
Cohesion: 0.42
Nodes (9): field(), FIELDS, MetadataField, metadataFields(), metadataParkWords(), metadataStopWords(), needed(), sentence() (+1 more)

### Community 149 - "harness-parked-card.ts"
Cohesion: 0.60
Nodes (4): BLOCK, harnessBlockMove(), harnessParkedCard(), noted()

### Community 150 - "common.cjs"
Cohesion: 0.11
Nodes (24): fs, main(), parse(), path, atomicWrite(), crypto, { execFileSync }, fs (+16 more)

### Community 151 - "Conversation.tsx"
Cohesion: 0.13
Nodes (26): Conversation(), ConversationDraft, LessonDecisionAction, lessonDecisionState(), readLessonDecision(), isLessonDecision(), OutboxLessonDecision(), act() (+18 more)

### Community 152 - "coordination.ts"
Cohesion: 0.17
Nodes (17): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation(), checkpointWindow(), dueAt() (+9 more)

### Community 153 - "qa-plan-retry.ts"
Cohesion: 0.67
Nodes (3): QAPlanRetry, QAPlanRetryProof, QAPlanRetryRequest

### Community 154 - "install-service.mjs"
Cohesion: 0.29
Nodes (4): file, folder, logs, root

### Community 155 - "validate_wiki_pr_body.cjs"
Cohesion: 0.33
Nodes (5): { execFileSync }, hasCanonicalWikiBody(), maintenanceBodies, matchesMaintenanceBody(), { readFileSync }

### Community 156 - "delivery-ownership.ts"
Cohesion: 0.33
Nodes (4): Ownership, ownershipContext, refreshDeliveryOwnership(), RefreshOwnership

### Community 157 - "unblock-brief.ts"
Cohesion: 0.53
Nodes (5): clearUnblockBrief(), key(), saveUnblockBrief(), UnblockBrief, unblockBrief()

### Community 158 - "SceneOverlay.tsx"
Cohesion: 0.67
Nodes (3): entranceDelayClasses, overlayEntranceDelays(), SceneOverlay()

## Knowledge Gaps
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `incidents/routes.ts`, `worker-runtime.ts`, `features/workflow.ts`, `daily-cto.ts`, `workKey`, `holdReason`, `TelemetryPanel.tsx`, `review-run.ts`, `admit-improvement.ts`, `advance-metadata-park.ts`, `scheduled-captures.ts`, `record-trigger.ts`, `requests.ts`, `artifact`, `harnessEffect`, `weekly-rollup.ts`, `jira-time.ts`, `GitHubDelivery`, `agents.ts`, `owner-merged-stopped.ts`, `github-delivery.ts`, `ref_node_util`, `remove-candidate.ts`, `api-routes.ts`, `scheduled-work.ts`, `redact-evidence.ts`, `run-retrospective.ts`, `http/commands.ts`, `time-scope.ts`, `Ticket`, `.save`, `Offices`, `features/commands.ts`, `assignment.ts`, `pilot-delivery.ts`, `brain-maintenance.ts`, `sanitizeObject`, `jiraBinding`, `deploy.ts`, `ref_node_path`, `jira-attempts.ts`, `cost-ledger.ts`, `time-ledger.ts`, `maintenance/maintenance.ts`, `alert-issue.ts`, `.emit`, `ticket-evidence.ts`, `cec.ts`, `assignments.ts`, `project-bindings.ts`, `diagnostic-snapshot.ts`, `fact-bounds.ts`, `session-bridge.ts`, `Coordinator`, `release-unpark.ts`, `sanitize`, `shared.ts`, `process.ts`, `provider-observation.ts`, `cec/issue-publication.ts`, `sign-in-unpark.ts`, `notifications.ts`, `digest`, `coordination-tick.ts`, `work.ts`, `goal-evidence.ts`, `blocker-followups.ts`, `outbox.ts`, `checkpoint-completion.ts`, `run-accounting.ts`, `github/issue-publication.ts`, `lesson-selection.ts`, `follow-production.ts`, `route-head.ts`, `offices.ts`, `accessibility-sources.ts`, `it-specialist.ts`, `interrupted-work-recovery.ts`, `judge-resumes.ts`, `controller-runtime.ts`, `enrollment-gate.ts`, `Effects`, `ledger.ts`, `FeatureWorkflow`, `scheduler.ts`, `ProjectProgress`, `coordination.ts`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `command()` (e.g. with `startServiceTicks()` and `realMachine()`) actually correct?**
  _`command()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Should `incidents/routes.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05561105561105561 - nodes in this community are weakly interconnected._
- **Why does `command()` connect `process.ts` to `incidents/routes.ts`, `accessibility-sources.ts`, `worker-runtime.ts`, `features/workflow.ts`, `controller-runtime.ts`, `enrollment-gate.ts`, `holdReason`, `review-run.ts`, `FeatureWorkflow`, `Effects`, `admit-improvement.ts`, `ledger.ts`, `deploy-command.ts`, `requests.ts`, `ProjectProgress`, `harnessEffect`, `artifact`, `weekly-rollup.ts`, `coordination.ts`, `GitHubDelivery`, `agents.ts`, `jira-time.ts`, `github-delivery.ts`, `ref_node_util`, `deployed-fixes.ts`, `remove-candidate.ts`, `Ticket`, `.save`, `pilot-delivery.ts`, `brain-maintenance.ts`, `jiraBinding`, `deploy.ts`, `ref_node_path`, `jira-attempts.ts`, `cost-ledger.ts`, `time-ledger.ts`, `maintenance/maintenance.ts`, `ticket-evidence.ts`, `assignments.ts`, `service-health.ts`, `project-bindings.ts`, `session-bridge.ts`, `Coordinator`, `release-floor.ts`, `sanitize`, `provider-observation.ts`, `cec/issue-publication.ts`, `salvage-worktree.ts`, `notifications.ts`, `digest`, `coordination-tick.ts`, `deploy-plan.ts`, `goal-evidence.ts`, `checkpoint-completion.ts`, `github/issue-publication.ts`, `resume-control.ts`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Should `OrgChart.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11655874190564293 - nodes in this community are weakly interconnected._
- **Why does `OfficeSnapshot` connect `shared.ts` to `OrgChart.tsx`, `it-specialist.ts`, `interrupted-work-recovery.ts`, `judge-resumes.ts`, `MaintenanceRun`, `index.tsx`, `cx`, `TelemetryPanel.tsx`, `ledger.ts`, `Store`, `App.tsx`, `scene-motion.ts`, `work-summary.ts`, `record-trigger.ts`, `Conversation.tsx`, `Goals.tsx`, `api-routes.ts`, `redact-evidence.ts`, `harness-baseline.ts`, `OfficeScene.tsx`, `features/commands.ts`, `sanitizeObject`, `maintenance/maintenance.ts`, `ref_react`, `resume-outcome.ts`, `.emit`, `service-health.ts`, `project-bindings.ts`, `diagnostic-snapshot.ts`, `fact-bounds.ts`, `stopped-record.ts`, `sanitize`, `cec/workflow.ts`, `work.ts`, `assignment-poll.ts`, `outbox.ts`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Should `worker-runtime.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07474600870827286 - nodes in this community are weakly interconnected._