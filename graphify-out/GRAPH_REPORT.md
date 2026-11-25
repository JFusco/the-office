# Graph Report - the-office  (2026-11-25)

## Corpus Check
- 1192 files · ~499,506 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 6102 nodes · 26718 edges · 153 communities (141 shown, 12 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 980 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1ad60e89`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- incidents/routes.ts
- OrgChart.tsx
- ref_node_path
- ref_node_crypto
- Inspector.tsx
- daily-cto.ts
- holdReason
- MapView.tsx
- retrospective-subject.ts
- TelemetryPanel.tsx
- continue-access-only-plan.ts
- scheduler.ts
- App.tsx
- learningDigest
- assignments.ts
- scheduled-captures.ts
- OfficeSnapshot
- record-trigger.ts
- deploy-command.ts
- github-context.ts
- artifact
- harnessEffect
- weekly-rollup.ts
- jira-time.ts
- deploy.ts
- accessibility-sources.ts
- worker-runtime.ts
- agents.ts
- github-delivery.ts
- Goals.tsx
- ref_node_util
- TicketJob
- index.ts
- remove-candidate.ts
- ledger.ts
- wiki-graph.cjs
- scheduled-work.ts
- routing.cjs
- redact-evidence.ts
- run-retrospective.ts
- .emit
- time-scope.ts
- Store
- .save
- Offices
- harness-baseline.ts
- OfficeScene.tsx
- knowledge-views.ts
- Ticket
- pilot-delivery.ts
- task-briefing.ts
- restart-writer.ts
- projects.ts
- control-store.ts
- jiraBinding
- ref_node_child_process
- QuestionStepper.tsx
- controller-runtime.ts
- requests.ts
- owned-artifact.ts
- cost-ledger.ts
- unsent-time.ts
- coordination.ts
- timed-statements.ts
- resume-outcome.ts
- validate_pr_body.cjs
- audit-plan-candidates.cjs
- alert-issue.ts
- resume-arrivals.ts
- ticket-evidence.ts
- constellation-runtime.ts
- resume-step.ts
- session-context-lines.ts
- knowledge/routes.ts
- session-scope.ts
- service-health.ts
- sanitizeObject
- diagnostic-snapshot.ts
- incidents.ts
- cec.ts
- session-bridge.ts
- judge-resumes.ts
- Coordinator
- dependency-bots/adopt.ts
- viewer.js
- goal-evidence.ts
- stopped-record.ts
- sanitize
- Outbox.tsx
- contract.ts
- sign-in-unpark.ts
- project-bindings.ts
- session-context-file.ts
- common.cjs
- report.ts
- capture-session-clone.py
- index.tsx
- shared.ts
- cli.ts
- archive-plan.cjs
- notifications.ts
- digest
- dates.cjs
- on-merge-sync.cjs
- backup-stores.ts
- extract-worker.mjs
- deploy-plan.ts
- work.ts
- useOfficePreferences.ts
- release-unpark.ts
- blocker-followups.ts
- assignment-poll.ts
- fact-bounds.ts
- ref_zod
- slack-supersession.ts
- connectWith
- qa.ts
- qa-plan-continuation.ts
- writer-restart.ts
- session-coverage.ts
- lesson-selection.ts
- follow-production.ts
- outbox.ts
- read-retries.ts
- refresh-issue-state.cjs
- knowledge.ts
- seeded-office-lessons.ts
- DeploymentFence
- node-visuals.ts
- context-failure-transport.ts
- CommandRegistry
- it-specialist.ts
- run-accounting.ts
- wait-idle.ts
- resume-control.ts
- restoreInPlace
- config.ts
- Effects
- exit-failure.ts
- session-snapshot-cleanup.ts
- scene-motion.ts
- packed-consumer-pnpm.ts
- production.ts
- reconcile-merges.cjs
- preferences-store.ts
- RoomCamera.tsx
- lesson-issue-ready.ts
- serve-graph.cjs
- owner-step-items.ts
- ProjectProgress
- JiraWorklogTransport
- routing.js
- qa-plan-retry.ts

## God Nodes (most connected - your core abstractions)
1. `Store` - 441 edges
2. `TicketJob` - 199 edges
3. `command()` - 161 edges
4. `digest()` - 153 edges
5. `holdReason()` - 139 edges
6. `GitHubDelivery` - 121 edges
7. `OfficeSnapshot` - 119 edges
8. `artifact()` - 114 edges
9. `workKey()` - 110 edges
10. `StageResult` - 109 edges

## Surprising Connections (you probably didn't know these)
- `publish()` --indirect_call--> `title()`  [INFERRED]
  scripts/graphify/publish-refresh.cjs → src/knowledge/map/grouping.ts
- `BreakdownTable()` --indirect_call--> `cell()`  [INFERRED]
  src/telemetry/BreakdownTable.tsx → scripts/wiki/archive-plan.cjs
- `apply()` --indirect_call--> `note()`  [INFERRED]
  src/conversations/OutboxSavedImplementation.tsx → server/cec/parking/resume-parked.ts
- `UnrecordedResult` --references--> `StageResult`  [EXTRACTED]
  server/cec/unrecorded-result.ts → src/shared.ts
- `LessonBrainOverlap` --references--> `Lesson`  [EXTRACTED]
  server/knowledge/lesson-brain-audit.ts → src/contracts/knowledge.ts

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

## Communities (153 total, 12 thin omitted)

### Community 0 - "incidents/routes.ts"
Cohesion: 0.06
Nodes (53): CitationSchema, SourceVersions, inHistoryOf(), DISMISSAL_CITATIONS, DISMISSAL_REASON, DismissalFacts, DismissalRequest, dismissalRequest() (+45 more)

### Community 1 - "OrgChart.tsx"
Cohesion: 0.10
Nodes (42): label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+34 more)

### Community 2 - "ref_node_path"
Cohesion: 0.07
Nodes (47): applyIntakeObservation(), MISSING_SAVED_PLAN, removeAdoptedClone(), namedRepairIds(), pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), stoppedBaseCheckout(), discussion() (+39 more)

### Community 3 - "ref_node_crypto"
Cohesion: 0.05
Nodes (102): approveFeature(), commandFeature(), featureById(), mutation(), reviewQuestions(), assertFeatureDependencyOrder(), featureDependencyEdges(), key() (+94 more)

### Community 4 - "Inspector.tsx"
Cohesion: 0.11
Nodes (66): Outbox(), blockedSummary(), ServiceHealthPanel(), followUp(), labels, ServiceHealthRow(), BlockerFollowups(), LessonsPanel() (+58 more)

### Community 5 - "daily-cto.ts"
Cohesion: 0.07
Nodes (35): currentCitations(), Fact, NOT_CURRENT, PROVIDER_ERROR, DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt() (+27 more)

### Community 6 - "holdReason"
Cohesion: 0.07
Nodes (70): boardPreflightCandidate(), Ownership, reconcileBoardPreflight(), partialLocalCleanupCandidate(), candidateInput(), children, oldAdoptionBasis(), SavedCandidateAdmission (+62 more)

### Community 7 - "MapView.tsx"
Cohesion: 0.06
Nodes (53): ChatMarkdown(), Activity(), ActivityTimeline(), AssignmentKnowledge(), Lookup(), BrainWorkspace(), DocumentMetadata, documentText() (+45 more)

### Community 8 - "retrospective-subject.ts"
Cohesion: 0.20
Nodes (14): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+6 more)

### Community 9 - "TelemetryPanel.tsx"
Cohesion: 0.09
Nodes (43): TelemetryReport, LiveAnchor, displayAgentTask(), LiveAgentTask(), Props, RunningTask(), text(), AzureBuild (+35 more)

### Community 10 - "continue-access-only-plan.ts"
Cohesion: 0.54
Nodes (6): Document, document(), isAccessOnlyPlan(), settledAccessOnlyState(), continueAccessOnlyPlan(), entryExists()

### Community 11 - "scheduler.ts"
Cohesion: 0.10
Nodes (17): Clock, OfficeCapacity, PROJECT_LOCAL, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork() (+9 more)

### Community 12 - "App.tsx"
Cohesion: 0.06
Nodes (48): BrainDrawer(), themeColor, App(), BrainWorkspace, CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants (+40 more)

### Community 13 - "learningDigest"
Cohesion: 0.26
Nodes (12): distinct(), identity(), improvementIncident(), improvementIncidentKey(), learningDigest(), expireLearningPackets(), packetReferences(), IMPROVEMENT_POLICY (+4 more)

### Community 14 - "assignments.ts"
Cohesion: 0.11
Nodes (22): clip(), DEMAND_LIMIT, demandFacts(), DemandSection, key(), LessonKey, notes(), AssignmentLookups (+14 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.12
Nodes (57): requestDelivery(), createFeature(), approvedDelivery(), bindDelivery(), featureEffectGate(), assertEnrollable(), assertFeatureGate(), bindFeature() (+49 more)

### Community 16 - "OfficeSnapshot"
Cohesion: 0.08
Nodes (44): jiraQueueProgress(), nextStage(), deliveryRoles, JiraQueueProgress, TicketProgress, SnapshotAcceptance, tourStages, useOffice() (+36 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.12
Nodes (36): baselined(), baselineLearning(), LEARNING_BASELINES, maintainLearning(), configureKnowledge(), clip(), maintenanceBlockedId(), MaintenanceCandidate (+28 more)

### Community 18 - "deploy-command.ts"
Cohesion: 0.09
Nodes (46): CONTROLLER_ENTRY, ControllerPin, Pin, pinnedController(), readControllerPin(), writeControllerPin(), controllerOf(), deployCommand() (+38 more)

### Community 19 - "github-context.ts"
Cohesion: 0.11
Nodes (40): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+32 more)

### Community 20 - "artifact"
Cohesion: 0.05
Nodes (129): containedFile(), completedPreparation(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash (+121 more)

### Community 21 - "harnessEffect"
Cohesion: 0.18
Nodes (33): effectKey(), LaneOperation, laneWrite(), moveCardOnce(), Lane, MOVABLE, moveLane(), resolveLane() (+25 more)

### Community 22 - "weekly-rollup.ts"
Cohesion: 0.14
Nodes (26): learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), RollupResult (+18 more)

### Community 23 - "jira-time.ts"
Cohesion: 0.09
Nodes (49): attempted(), attemptState(), bound(), covers(), JiraAttempt, jiraAttempts(), JiraAttemptState, open() (+41 more)

### Community 24 - "deploy.ts"
Cohesion: 0.10
Nodes (46): advance(), DeployContext, DeployTimings, Commit, DEPLOY_STEPS, DeployFacts, DeployStatus, Digest (+38 more)

### Community 25 - "accessibility-sources.ts"
Cohesion: 0.09
Nodes (41): ApproachSchema, maintenancePolicies(), accessibilitySources(), actionable(), closingPull(), Finding, handoffIssue(), issueLines() (+33 more)

### Community 26 - "worker-runtime.ts"
Cohesion: 0.06
Nodes (45): candidateWorkspaceEnvironment(), assignmentSubject(), lessonPurpose(), catalogLine(), assertBriefingScope(), taskBriefing(), clearUnblockBrief(), key() (+37 more)

### Community 27 - "agents.ts"
Cohesion: 0.04
Nodes (65): implementationWorkerContext(), escaped(), IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), intakeMembership(), projectListScope() (+57 more)

### Community 28 - "github-delivery.ts"
Cohesion: 0.03
Nodes (139): writerRestartInstruction(), findingsBlock(), QA_STAGES, reviewAdvisoryIds(), Reviewed, withoutReviewAdvisories(), handsOff(), harnessDelivers() (+131 more)

### Community 29 - "Goals.tsx"
Cohesion: 0.09
Nodes (32): SendMessage, OutboxSavedImplementation(), apply(), review(), OutboxSavedPlan(), reconcile(), FeatureDelivery(), FeatureDocuments() (+24 more)

### Community 30 - "ref_node_util"
Cohesion: 0.12
Nodes (46): retryRead(), admitPRMetadata(), assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema, savedMetadataAssessment(), validateSaved() (+38 more)

### Community 31 - "TicketJob"
Cohesion: 0.07
Nodes (44): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+36 more)

### Community 32 - "index.ts"
Cohesion: 0.06
Nodes (51): implementationContinuationRoute(), qaPlanRetryRoute(), close(), config, itSpecialist, loadedRevision, offices, releaseLock (+43 more)

### Community 33 - "remove-candidate.ts"
Cohesion: 0.15
Nodes (22): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), maintenanceCandidate(), moveAside(), moveBack(), purgeRemoved(), purging (+14 more)

### Community 34 - "ledger.ts"
Cohesion: 0.10
Nodes (35): failureOutranks(), acceptedCompletionResolution(), INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationCandidates(), investigationId(), ctoReplacementResolution(), finishedSubjectResolution() (+27 more)

### Community 35 - "wiki-graph.cjs"
Cohesion: 0.23
Nodes (17): connections(), fs, main(), path, slash(), collect(), add(), frontmatterTarget() (+9 more)

### Community 36 - "scheduled-work.ts"
Cohesion: 0.07
Nodes (46): freshOwnershipRead(), dueSlackReread(), rereadUncertainSlack(), runningRevision(), deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), Ownership (+38 more)

### Community 37 - "routing.cjs"
Cohesion: 0.11
Nodes (31): fs, main(), path, { spawnSync }, hasSymlinkComponent(), frontmatterProblems(), adjacency(), edgeCost() (+23 more)

### Community 38 - "redact-evidence.ts"
Cohesion: 0.07
Nodes (44): attributedRecords(), foldsItsRun(), groupCandidates(), FailedMailCheck, lastFailedMailCheck(), lastMailCheckOutcome(), MailCheckOutcome, mailboxFreeze() (+36 more)

### Community 39 - "run-retrospective.ts"
Cohesion: 0.09
Nodes (45): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, BlockingTrigger, blockingTrigger(), isBlocking() (+37 more)

### Community 40 - ".emit"
Cohesion: 0.12
Nodes (29): assertOwnership(), decideImplementation(), consumeQAPlanRetry(), requestQAPlanRetry(), configureChannelNotices(), configureNotices(), retryRecipientLookup(), lookupSentNothing() (+21 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.14
Nodes (27): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence(), CaptureContext (+19 more)

### Community 42 - "Store"
Cohesion: 0.03
Nodes (56): requestMail(), enableNightly(), externalPlanGap(), verifyFeatureEnhance(), GitHubFeaturePublisher, helperTelemetry(), JiraFeaturePublisher, observeHelperGroups() (+48 more)

### Community 43 - ".save"
Cohesion: 0.09
Nodes (59): enumerateIntakeList(), inPickupOrder(), Intake, text(), resolveBlockedTransition(), document(), transitionWithComment(), jiraAccount() (+51 more)

### Community 44 - "Offices"
Cohesion: 0.11
Nodes (6): QuestionNotifications, mirrorOfficeKnowledge(), InFlightOperations, Offices, SessionBridge, OfficeKnowledge

### Community 45 - "harness-baseline.ts"
Cohesion: 0.15
Nodes (23): BaselineReport, baselineReport(), BaselineSource, baselineText(), millions(), row(), share(), add() (+15 more)

### Community 46 - "OfficeScene.tsx"
Cohesion: 0.17
Nodes (33): withoutElapsed(), Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk() (+25 more)

### Community 47 - "knowledge-views.ts"
Cohesion: 0.15
Nodes (19): KnowledgeActivity, KnowledgeActivityPage, KnowledgeEdge, KnowledgeMap, KnowledgeNode, connectionSummary(), ConstellationView, ConstellationRuntime (+11 more)

### Community 48 - "Ticket"
Cohesion: 0.09
Nodes (35): carriedNotRepeated(), applyChangeScope(), levels(), MAX_CHECKS, changeScopeNote(), Scoped, owedUnderScope(), scopeBase() (+27 more)

### Community 49 - "pilot-delivery.ts"
Cohesion: 0.08
Nodes (55): candidateBranchMoved(), endChangeScope(), scopeOutgrown(), confirmsMovedHead(), Moved, movedHeadUnconfirmed(), recordConfirmedHead(), routeConfirmedHead() (+47 more)

### Community 50 - "task-briefing.ts"
Cohesion: 0.20
Nodes (17): guidanceExcerpt(), digest(), citations(), recordAcceptedKnowledge(), stageName(), knowledgeCitation(), lessonCitation(), officeSearch() (+9 more)

### Community 51 - "restart-writer.ts"
Cohesion: 0.18
Nodes (17): ATTEMPT_DELAYS_MS, nextAttemptAt(), restartStoppedWriters(), unchangedSinceAccepted(), NOT_RETRYABLE, releaseFunds(), WRITER_STAGES, WriterRestartCandidate (+9 more)

### Community 52 - "projects.ts"
Cohesion: 0.06
Nodes (57): AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), goalEvidencePath(), azureSchema, deploymentSchema, jiraSchema, ownJiraSchema, promptSchema (+49 more)

### Community 53 - "control-store.ts"
Cohesion: 0.08
Nodes (25): applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, readSavedState(), LARGE_KEY_CHARS, plain(), RedactedEntries (+17 more)

### Community 54 - "jiraBinding"
Cohesion: 0.19
Nodes (8): contentSchema(), JiraIssuePublisher, checkMail(), drainMail(), publicationDescription(), ingest(), bindings(), jiraBinding()

### Community 55 - "ref_node_child_process"
Cohesion: 0.07
Nodes (32): changedPaths(), { execFileSync }, files, isMapInput(), mapOnly(), { execFileSync }, git(), publish() (+24 more)

### Community 56 - "QuestionStepper.tsx"
Cohesion: 0.19
Nodes (18): FeatureQuestionProjection, OutboxQuestionRound(), send(), draftKey(), readDraft(), saveDraft(), QuestionRound(), nextQuestion() (+10 more)

### Community 57 - "controller-runtime.ts"
Cohesion: 0.12
Nodes (18): DATA, projectData(), StoreDatabase, ControllerEffects, controllerEffects(), DEPLOY_PROJECT, alive(), ControllerMachine (+10 more)

### Community 58 - "requests.ts"
Cohesion: 0.08
Nodes (48): deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, requireDeliveryAuthority(), deliveryIntakeBlocker(), gateRegisteredDelivery(), accounting (+40 more)

### Community 59 - "owned-artifact.ts"
Cohesion: 0.24
Nodes (13): investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_SOURCE_PATHS, officeSource(), done(), readBoundedNoFollow() (+5 more)

### Community 60 - "cost-ledger.ts"
Cohesion: 0.19
Nodes (23): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId(), OutsideEdit (+15 more)

### Community 61 - "unsent-time.ts"
Cohesion: 0.13
Nodes (21): publishableEntry(), settlementPending(), superseded(), ticketUnresolved(), Ledger, Read, TimeLedger, dueReadback() (+13 more)

### Community 62 - "coordination.ts"
Cohesion: 0.05
Nodes (60): reconcileNoticeConfirmations(), dependencyCompletionKey(), CheckpointEligibility, captureLearning(), recordLearningOpportunity(), captureMaintenanceStep(), completeNativeCheckpoint(), BRAIN_DEPENDENCY_MERGES (+52 more)

### Community 63 - "timed-statements.ts"
Cohesion: 0.22
Nodes (12): StoreTimings, NAMED, rowsText(), rowText(), SQL_TOKEN, statementName(), text(), timed() (+4 more)

### Community 64 - "resume-outcome.ts"
Cohesion: 0.11
Nodes (26): FLAGS, incidentCommand(), IncidentCommandIO, option(), USAGE, whole(), boundaryCrossed(), Crossing (+18 more)

### Community 65 - "validate_pr_body.cjs"
Cohesion: 0.36
Nodes (8): fs, main(), readableText(), REQUIRED_CHECKS, REQUIRED_SECTIONS, sections(), validatePullRequestBody(), withoutComments()

### Community 66 - "audit-plan-candidates.cjs"
Cohesion: 0.13
Nodes (30): audit(), branchIssueNumbers(), classify(), distinctiveTitleWords(), { execFileSync }, extractPaths(), findPrForMergeSubject(), fmtCommit() (+22 more)

### Community 67 - "alert-issue.ts"
Cohesion: 0.11
Nodes (30): Execute, adoptDependabot(), AlertIssue, alertIssueBody(), alertIssueTitle(), alertMarker(), closeAlertIssue(), ensureAlertIssue() (+22 more)

### Community 68 - "resume-arrivals.ts"
Cohesion: 0.13
Nodes (53): canonical(), checkpointEligibility(), admitCheckpointResume(), forCheckpoint(), admitResume(), ResumeAdmission, ResumeIntent, admitTicketResume() (+45 more)

### Community 69 - "ticket-evidence.ts"
Cohesion: 0.12
Nodes (26): assetDownloader(), attachmentKind(), evidenceDirectory(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS, EvidenceAttachment (+18 more)

### Community 70 - "constellation-runtime.ts"
Cohesion: 0.10
Nodes (20): CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point, createConstellation(), enter() (+12 more)

### Community 71 - "resume-step.ts"
Cohesion: 0.16
Nodes (18): capacityInterruptedRun(), providerSaid(), rerunsInterruptedQA(), officeRefusedQA(), setupStopOn(), Attempt, LOCAL_STAGES, needsResumeReconciliation() (+10 more)

### Community 72 - "session-context-lines.ts"
Cohesion: 0.25
Nodes (11): Bound, ContextFoldPrefix, contextFoldPrefix(), SessionContextCheckpoint, captureSessionContextClone(), sessionContextFile(), ContextReadChanged, sameContextFile() (+3 more)

### Community 73 - "knowledge/routes.ts"
Cohesion: 0.10
Nodes (23): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, CommittedBrain (+15 more)

### Community 74 - "session-scope.ts"
Cohesion: 0.20
Nodes (16): claudeScopeParser(), claudeSessionScope(), CLAUDE_TRANSCRIPTS, CODEX_ROLLOUTS, contextReaders(), retainSessionMessage(), SessionConversation, escaped() (+8 more)

### Community 75 - "service-health.ts"
Cohesion: 0.12
Nodes (21): ClaudeLoginRefusal, claudeLoginRefusal(), claudeRefusalWords(), RECORDED_REFUSALS, refusedClaudeRow(), listenerHealth(), providers, ProviderStatusChecks (+13 more)

### Community 76 - "sanitizeObject"
Cohesion: 0.10
Nodes (37): az(), AzureMonitor, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs(), fullActivePRs() (+29 more)

### Community 77 - "diagnostic-snapshot.ts"
Cohesion: 0.22
Nodes (12): assignmentDiagnostics(), diagnosticContext(), diagnosticSnapshot(), followUpPicture(), publishITReport(), nativeDeliveryResolved(), itAgent(), itDiagnostics() (+4 more)

### Community 78 - "incidents.ts"
Cohesion: 0.10
Nodes (40): ObservedIncident, ObservedSubject, digest(), fingerprint(), incidentId(), details(), planSync(), Provenance (+32 more)

### Community 79 - "cec.ts"
Cohesion: 0.06
Nodes (45): movedHeadNote(), cecPrompt(), resolvedDecisionNote(), stageInstructionsFor(), readbackDispatchGuidance(), REVIEW_FINDINGS_RULE, currentEnvironmentWait(), waitText() (+37 more)

### Community 80 - "session-bridge.ts"
Cohesion: 0.13
Nodes (22): codexDaemonProcesses(), accountCodexProcesses(), CodexProcessInventory, codexProcessInventory(), DesktopSessions, unaccountedProcesses(), codexThreadMetadata(), METADATA_CHUNK (+14 more)

### Community 81 - "judge-resumes.ts"
Cohesion: 0.06
Nodes (63): citationFault(), sourceVersions(), CompareMemory, compareMemory(), COMPARES_PER_PASS, comparison(), DeployedFixes, DeployedFixesInput (+55 more)

### Community 83 - "dependency-bots/adopt.ts"
Cohesion: 0.13
Nodes (32): readBackOrThrow(), closesIssue(), linkedBody(), linkPR(), DependabotPR, dependabotPR(), inPickupLane(), ensureTrackingIssue() (+24 more)

### Community 84 - "viewer.js"
Cohesion: 0.19
Nodes (25): addMetaLink(), addMetaRow(), addRelationship(), applyView(), buildIndexes(), buildLegend(), buildModel(), buildRenderer() (+17 more)

### Community 85 - "goal-evidence.ts"
Cohesion: 0.21
Nodes (10): GitHubMonitor, githubPRDescription(), azureGoalFacts(), boundedEvidence(), EvidenceStore, GOAL_EVIDENCE_LIMITS, AzureGoalDocument, GitHubBoard (+2 more)

### Community 86 - "stopped-record.ts"
Cohesion: 0.09
Nodes (50): capabilityBlockedReviews(), latestReviews(), boundedEvidence(), expectedWait(), StopFacts, normalizeCause(), IncidentCollector, improvements() (+42 more)

### Community 87 - "sanitize"
Cohesion: 0.08
Nodes (37): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+29 more)

### Community 88 - "Outbox.tsx"
Cohesion: 0.06
Nodes (48): knowledgeOutbox(), Conversation(), LessonDecisionAction, lessonDecisionState(), readLessonDecision(), DAYS, dueLessonDecisions(), easternWeek() (+40 more)

### Community 89 - "contract.ts"
Cohesion: 0.12
Nodes (23): Event, exactCommand(), Invocation, localHookCommand(), one(), prePushRejection(), PushIdentity, retirementBoundary() (+15 more)

### Community 90 - "sign-in-unpark.ts"
Cohesion: 0.07
Nodes (47): correlatedBuild(), hasPendingDelivery(), resumeAfterSignIn(), signInWait(), MAX_SIGN_IN_UNPARKS, unparkSignedIn(), waitingStep(), Azure (+39 more)

### Community 91 - "project-bindings.ts"
Cohesion: 0.09
Nodes (41): CommentPage, commentReadback(), devUpdate(), HEADLINE, jiraRecord(), unpack(), postDevUpdate(), OUTCOME (+33 more)

### Community 92 - "session-context-file.ts"
Cohesion: 0.12
Nodes (19): claudeSessionContext(), readTranscript, codexSessionContext(), readRollout, packContextFailure(), PackedContextFailure, ContextThread, contextThread() (+11 more)

### Community 93 - "common.cjs"
Cohesion: 0.12
Nodes (30): crypto, { execFileSync }, fs, git(), path, remoteSlug(), substantive(), walk() (+22 more)

### Community 94 - "report.ts"
Cohesion: 0.24
Nodes (14): TelemetryRow, TelemetrySync, Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount() (+6 more)

### Community 96 - "index.tsx"
Cohesion: 0.12
Nodes (41): LinkedFeatures(), planningAssessable(), TicketPlanningAction(), LearningCoverage(), when(), SaveFeedback(), TONE, GoalNoticeForm() (+33 more)

### Community 97 - "shared.ts"
Cohesion: 0.06
Nodes (46): StoppedWriter, stoppedWriter(), notOwned(), mergedByOwner(), closeableIssue(), effectsSettled(), eligible(), officePublished() (+38 more)

### Community 98 - "cli.ts"
Cohesion: 0.18
Nodes (9): args, [cmd,...rawArgs], commands, key, projectIndex, LessonBrainAudit, lessonBrainAudit(), LessonBrainOverlap (+1 more)

### Community 99 - "archive-plan.cjs"
Cohesion: 0.14
Nodes (25): fs, main(), parse(), path, archive(), cell(), ensureIndex(), fromArgs() (+17 more)

### Community 100 - "notifications.ts"
Cohesion: 0.09
Nodes (30): channelNoticeAuthorized(), ChannelSettings, notices(), queueChannelNotice(), currentOutbox(), clamp(), LIMITS, MergedPR (+22 more)

### Community 101 - "digest"
Cohesion: 0.04
Nodes (82): GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles(), ContinuationIO (+74 more)

### Community 102 - "dates.cjs"
Cohesion: 0.31
Nodes (12): today(), dateFromPlanBasename(), dateFromSessionPath(), evidenceDates(), fileMtimeDate(), fs, gitCommitDate(), inferPlanDate() (+4 more)

### Community 103 - "on-merge-sync.cjs"
Cohesion: 0.17
Nodes (29): fieldSpan(), keyPattern(), list(), parseListLiteral(), quote(), render(), scalar(), splitFrontmatter() (+21 more)

### Community 104 - "backup-stores.ts"
Cohesion: 0.09
Nodes (38): absentAdmission(), AdmissionComparison, AdmissionSnapshot, compareAdmissions(), snapshotAdmissions(), BackupEntry, BackupInput, BackupInventory (+30 more)

### Community 105 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 106 - "deploy-plan.ts"
Cohesion: 0.10
Nodes (45): runningRevision(), runningRevision(), ROOT, releaseIdentity(), runtimeRevision(), ActiveRelease, readActiveRelease(), BUILD_ENV (+37 more)

### Community 107 - "work.ts"
Cohesion: 0.09
Nodes (34): admitRepairWaits(), COVERING, expiryEvent(), expiryId(), lastProgress(), progressOf(), RepairWaitEntry, RepairWaitPass (+26 more)

### Community 108 - "useOfficePreferences.ts"
Cohesion: 0.23
Nodes (11): acceptPreferences(), PreferenceCandidate, strip(), UNKNOWN_PREFERENCES, OfficePreferencesController, PreferenceFeedback, PreferenceField, requestPreferences() (+3 more)

### Community 109 - "release-unpark.ts"
Cohesion: 0.33
Nodes (8): due(), MAX_RELEASE_UNPARKS, RELEASE_CHECK_MS, returnToPickup(), unparkReleasedWaits(), compare(), highestStableAtLeast(), parts()

### Community 110 - "blocker-followups.ts"
Cohesion: 0.11
Nodes (48): conversationReadbackReady(), followupOf(), pendingReadback(), queueConversationReadback(), readbackEnding(), uncertainConversations(), conversationResolved(), readBackConversations() (+40 more)

### Community 111 - "assignment-poll.ts"
Cohesion: 0.11
Nodes (25): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), BLOCK, harnessBlockMove() (+17 more)

### Community 112 - "fact-bounds.ts"
Cohesion: 0.18
Nodes (19): leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance() (+11 more)

### Community 113 - "ref_zod"
Cohesion: 0.26
Nodes (11): Body, DeploymentFenceState, fenceTokenDigest(), abandon(), operationPaths(), createDeployToken(), readDeployToken(), removeDeployToken() (+3 more)

### Community 114 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 115 - "connectWith"
Cohesion: 0.38
Nodes (5): connectWith(), data(), envelope(), JiraWorklogs, WorklogSave

### Community 119 - "session-coverage.ts"
Cohesion: 0.36
Nodes (7): claudeSessions(), completeSessionCoverage(), desktopCoverageGap(), knownActivity(), Report, unexplained(), sessionInventoryFailureDetail()

### Community 120 - "lesson-selection.ts"
Cohesion: 0.17
Nodes (14): INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, LessonSelection, MAINTENANCE, MAX_LESSONS, normalPath() (+6 more)

### Community 121 - "follow-production.ts"
Cohesion: 0.20
Nodes (17): awaitingJiraStatus(), awaitingProduction(), FOLLOW_DAYS, followed(), isFollowed(), Azure, AzureRead, containedIn() (+9 more)

### Community 122 - "outbox.ts"
Cohesion: 0.09
Nodes (35): ctoInputIdentityMatches(), ctoInputRecovered(), ADOPTION_STALLED_MS, projectOutbox(), item(), syncOutbox(), sameOwnerSteps(), projectSlackDeliveries() (+27 more)

### Community 123 - "read-retries.ts"
Cohesion: 0.33
Nodes (10): PrerequisitesSchema, classifyStop(), incompleteReadOutput(), IntakeResult, planReadRetry(), readOnlyStageJob(), readRetryPending(), reconcileReadRetries() (+2 more)

### Community 124 - "refresh-issue-state.cjs"
Cohesion: 0.22
Nodes (13): atomicWrite(), advanceFence(), key(), { execFileSync }, fs, issueRefs(), main(), markClosed() (+5 more)

### Community 125 - "knowledge.ts"
Cohesion: 0.09
Nodes (28): BRAIN_SCOPE, SUBJECT, Kind, RetrospectiveResult, RetrospectiveResultSchema, RollupResultSchema, Stage, BlockerFollowup (+20 more)

### Community 126 - "seeded-office-lessons.ts"
Cohesion: 0.32
Nodes (5): CONSOLIDATED, CONSOLIDATED_AT, SEEDS, seedOfficeLessons(), SEEDS

### Community 128 - "node-visuals.ts"
Cohesion: 0.20
Nodes (14): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+6 more)

### Community 129 - "context-failure-transport.ts"
Cohesion: 0.48
Nodes (3): unpackContextFailure(), ContextReadPhase, SessionContextDeadline

### Community 131 - "it-specialist.ts"
Cohesion: 0.14
Nodes (24): replacedReadback(), partialLocalCleanupKey(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), heldFor(), ITContext (+16 more)

### Community 132 - "run-accounting.ts"
Cohesion: 0.06
Nodes (57): BoundedRead, add(), CodexRequest, CodexRollout, CodexTokens, FIELDS, codexHome(), createdAt() (+49 more)

### Community 133 - "wait-idle.ts"
Cohesion: 0.33
Nodes (5): Health, IdleObservation, IdleResult, waitIdle(), WaitIdleInput

### Community 134 - "resume-control.ts"
Cohesion: 0.26
Nodes (8): absent(), NEVER_ENABLED, ResumeControl, stated(), Stored, unreadable(), IncidentsRouteContext, ResumeSwitch

### Community 135 - "restoreInPlace"
Cohesion: 0.60
Nodes (5): identity(), Json, plain(), restorable(), restoreInPlace()

### Community 136 - "config.ts"
Cohesion: 0.09
Nodes (49): dispatchNightly(), eligibility(), Admission, admit(), IntakeContext, WAIT_STATUSES, compatible(), dependencyEligibility() (+41 more)

### Community 137 - "Effects"
Cohesion: 0.06
Nodes (41): Assignment, jiraText(), Transition, descriptionPreimage(), plain(), NOT_LANDED_SETTLE_MS, settleNotLanded(), FeaturePublisher (+33 more)

### Community 138 - "exit-failure.ts"
Cohesion: 0.60
Nodes (3): exitFailure(), MONTHS, providerLimit()

### Community 140 - "session-snapshot-cleanup.ts"
Cohesion: 0.40
Nodes (5): SNAPSHOT_PREFIX, removeStaleSessionSnapshots(), SNAPSHOT_SWEEP_MS, STALE_SNAPSHOT_MS, sweepStaleSessionSnapshots()

### Community 141 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 144 - "reconcile-merges.cjs"
Cohesion: 0.22
Nodes (14): collectPulls(), copyWikiForDryRun(), { execFileSync }, flattenPages(), fs, githubRequest(), isWikiBotPull(), main() (+6 more)

### Community 145 - "preferences-store.ts"
Cohesion: 0.23
Nodes (7): fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS, OfficePreferences

### Community 146 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (7): CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility, overlayEntranceDelays(), SceneOverlay()

### Community 147 - "lesson-issue-ready.ts"
Cohesion: 0.40
Nodes (7): defaultPickupStatus(), firstLane(), instruction(), LaneMove, move(), readyLessonIssue(), settle()

### Community 150 - "serve-graph.cjs"
Cohesion: 0.24
Nodes (10): ensureInside(), createServer(), fs, http, listen(), attempt(), main(), path (+2 more)

### Community 152 - "owner-step-items.ts"
Cohesion: 0.24
Nodes (9): OwnerStepItem, ownerStepItems(), signIn(), commands(), SIGN_IN_SERVICE_TROUBLE, signInSteps(), Step, OwnerSteps (+1 more)

### Community 160 - "qa-plan-retry.ts"
Cohesion: 0.67
Nodes (3): QAPlanRetry, QAPlanRetryProof, QAPlanRetryRequest

## Knowledge Gaps
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `ref_node_path`, `ref_node_crypto`, `it-specialist.ts`, `daily-cto.ts`, `holdReason`, `run-accounting.ts`, `config.ts`, `Effects`, `continue-access-only-plan.ts`, `retrospective-subject.ts`, `scheduler.ts`, `learningDigest`, `assignments.ts`, `scheduled-captures.ts`, `OfficeSnapshot`, `record-trigger.ts`, `github-context.ts`, `artifact`, `harnessEffect`, `weekly-rollup.ts`, `lesson-issue-ready.ts`, `jira-time.ts`, `accessibility-sources.ts`, `worker-runtime.ts`, `agents.ts`, `github-delivery.ts`, `ref_node_util`, `TicketJob`, `index.ts`, `remove-candidate.ts`, `ledger.ts`, `scheduled-work.ts`, `redact-evidence.ts`, `run-retrospective.ts`, `.emit`, `time-scope.ts`, `.save`, `Offices`, `pilot-delivery.ts`, `task-briefing.ts`, `restart-writer.ts`, `control-store.ts`, `controller-runtime.ts`, `requests.ts`, `owned-artifact.ts`, `cost-ledger.ts`, `unsent-time.ts`, `coordination.ts`, `alert-issue.ts`, `resume-arrivals.ts`, `ticket-evidence.ts`, `resume-step.ts`, `knowledge/routes.ts`, `sanitizeObject`, `diagnostic-snapshot.ts`, `cec.ts`, `session-bridge.ts`, `judge-resumes.ts`, `dependency-bots/adopt.ts`, `goal-evidence.ts`, `sanitize`, `contract.ts`, `sign-in-unpark.ts`, `project-bindings.ts`, `shared.ts`, `notifications.ts`, `digest`, `work.ts`, `release-unpark.ts`, `blocker-followups.ts`, `assignment-poll.ts`, `fact-bounds.ts`, `lesson-selection.ts`, `follow-production.ts`, `outbox.ts`, `read-retries.ts`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `command()` (e.g. with `startServiceTicks()` and `realMachine()`) actually correct?**
  _`command()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Should `incidents/routes.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06057945566286216 - nodes in this community are weakly interconnected._
- **Why does `OfficeSnapshot` connect `OfficeSnapshot` to `OrgChart.tsx`, `ref_node_path`, `it-specialist.ts`, `Inspector.tsx`, `MapView.tsx`, `config.ts`, `TelemetryPanel.tsx`, `App.tsx`, `scene-motion.ts`, `record-trigger.ts`, `accessibility-sources.ts`, `Goals.tsx`, `index.ts`, `ledger.ts`, `redact-evidence.ts`, `Store`, `harness-baseline.ts`, `OfficeScene.tsx`, `restart-writer.ts`, `control-store.ts`, `requests.ts`, `coordination.ts`, `resume-outcome.ts`, `resume-arrivals.ts`, `service-health.ts`, `sanitizeObject`, `diagnostic-snapshot.ts`, `judge-resumes.ts`, `stopped-record.ts`, `Outbox.tsx`, `index.tsx`, `shared.ts`, `notifications.ts`, `work.ts`, `useOfficePreferences.ts`, `assignment-poll.ts`, `fact-bounds.ts`, `outbox.ts`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Should `OrgChart.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10196078431372549 - nodes in this community are weakly interconnected._
- **Why does `GitHubIssuePublisher` connect `Effects` to `accessibility-sources.ts`, `Store`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Should `ref_node_path` be split into smaller, more focused modules?**
  _Cohesion score 0.07425907425907426 - nodes in this community are weakly interconnected._