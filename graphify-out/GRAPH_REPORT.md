# Graph Report - the-office  (2026-11-25)

## Corpus Check
- 1213 files · ~512,212 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 6219 nodes · 27401 edges · 161 communities (153 shown, 8 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 1004 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d18d09c0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- incidents/routes.ts
- OrgChart.tsx
- TicketJob
- features/workflow.ts
- Inspector.tsx
- daily-cto.ts
- artifact
- ref_react
- retrospective-subject.ts
- TelemetryPanel.tsx
- enrollment-gate.ts
- Store
- App.tsx
- admit-improvement.ts
- advance-metadata-park.ts
- scheduled-captures.ts
- work-summary.ts
- record-trigger.ts
- controller-runtime.ts
- github-context.ts
- activation-recovery.ts
- harnessEffect
- weekly-rollup.ts
- jira-time.ts
- deploy.ts
- GitHubDelivery
- agents.ts
- workKey
- github-delivery.ts
- Goals.tsx
- digest
- accept-stage-result.ts
- index.ts
- remove-candidate.ts
- run.ts
- common.cjs
- scheduled-work.ts
- routing.cjs
- redact-evidence.ts
- run-retrospective.ts
- http/commands.ts
- time-scope.ts
- engine.ts
- .save
- Offices
- harness-baseline.ts
- OfficeScene.tsx
- ref_node_crypto
- cec/workflow.ts
- pilot-delivery.ts
- .emit
- effects.ts
- projects.ts
- ref_node_sqlite
- jiraBinding
- ref_node_child_process
- FeatureWorkspace.tsx
- deploy-context.ts
- ref_node_path
- jira-attempts.ts
- cost-ledger.ts
- unsent-time.ts
- maintenance/maintenance.ts
- timed-statements.ts
- judge-resumes.ts
- validate_pr_body.cjs
- audit-plan-candidates.cjs
- alert-issue.ts
- resume-arrivals.ts
- ticket-evidence.ts
- constellation-runtime.ts
- cec-reads.ts
- session-context-file.ts
- assignments.ts
- session-scope.ts
- service-health.ts
- security.ts
- diagnostic-snapshot.ts
- incidents.ts
- Ticket
- session-bridge.ts
- resume-control.ts
- api-routes.ts
- dependency-bots/adopt.ts
- viewer.js
- deploy-command.ts
- outbox.ts
- conversations/conversations.ts
- OfficeSnapshot
- process.ts
- sign-in-unpark.ts
- readable-jira-comment.ts
- session-context-client.ts
- plans.cjs
- report.ts
- capture-session-clone.py
- index.tsx
- holdReason
- validate-stage.ts
- archive-plan.cjs
- Effects
- inspect-closed-plan.ts
- project-binding-blocks.ts
- on-merge-sync.cjs
- snapshot-stores.ts
- extract-worker.mjs
- deploy-plan.ts
- work.ts
- DeploymentFence
- lesson-issue-ready.ts
- blocker-followups.ts
- assignment-poll.ts
- goal-reporting.ts
- MaintenanceRun
- slack-supersession.ts
- run-accounting.ts
- qa.ts
- qa-plan-continuation.ts
- writer-restart.ts
- accessibility-sources.ts
- lesson-selection.ts
- follow-production.ts
- local-config.ts
- read-retries.ts
- refresh-issue-state.cjs
- knowledge.ts
- operationPaths
- interrupted-work-recovery.ts
- node-visuals.ts
- build-release.ts
- pre-push-boundary.ts
- it-specialist.ts
- telemetry.ts
- backup-stores.ts
- useOfficePreferences.ts
- restart-stopped-writers.ts
- coordination.ts
- .getEffect
- ledger.ts
- coordination-tick.ts
- session-snapshot-cleanup.ts
- scene-motion.ts
- scheduler.ts
- production.ts
- reconcile-merges.cjs
- shared.ts
- RoomCamera.tsx
- retire-history.ts
- command-registry.ts
- context-failure-transport.ts
- repoRoot
- park.ts
- merge-summary.ts
- incident-command.ts
- pr-body.ts
- historical-artifact-path.ts
- delivery-ownership.ts
- handover-cms.ts
- JiraWorklogTransport
- routing.js
- packed-consumer-pnpm.ts

## God Nodes (most connected - your core abstractions)
1. `Store` - 451 edges
2. `TicketJob` - 215 edges
3. `command()` - 161 edges
4. `digest()` - 160 edges
5. `holdReason()` - 141 edges
6. `GitHubDelivery` - 129 edges
7. `OfficeSnapshot` - 120 edges
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
- `Admission` --references--> `AssignmentReview`  [EXTRACTED]
  server/delivery/intake/admission.ts → src/shared.ts

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

## Communities (161 total, 8 thin omitted)

### Community 0 - "incidents/routes.ts"
Cohesion: 0.05
Nodes (95): citationFault(), CitationSchema, SourceVersions, sourceVersions(), inHistoryOf(), CompareMemory, compareMemory(), COMPARES_PER_PASS (+87 more)

### Community 1 - "OrgChart.tsx"
Cohesion: 0.11
Nodes (41): label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+33 more)

### Community 2 - "TicketJob"
Cohesion: 0.08
Nodes (45): removeAdoptedClone(), namedRepairIds(), QA_STAGES, reviewAdvisoryIds(), Reviewed, withoutReviewAdvisories(), StageContext, dispatchLeadAssessment() (+37 more)

### Community 3 - "features/workflow.ts"
Cohesion: 0.07
Nodes (59): approveFeature(), featureById(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), discoveryPrompt(), planPrompt() (+51 more)

### Community 4 - "Inspector.tsx"
Cohesion: 0.11
Nodes (68): blockedSummary(), itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps(), ServiceHealthPanel(), followUp(), labels (+60 more)

### Community 5 - "daily-cto.ts"
Cohesion: 0.07
Nodes (34): currentCitations(), Fact, NOT_CURRENT, PROVIDER_ERROR, DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt() (+26 more)

### Community 6 - "artifact"
Cohesion: 0.07
Nodes (77): ownershipReadHistory(), advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat(), continuationNativeReview(), continuationWorkerProof() (+69 more)

### Community 7 - "ref_react"
Cohesion: 0.06
Nodes (63): KnowledgeActivity, KnowledgeActivityPage, KnowledgeEdge, KnowledgeMap, KnowledgeNode, ChatMarkdown(), ChatMarkdown, MessageText() (+55 more)

### Community 8 - "retrospective-subject.ts"
Cohesion: 0.20
Nodes (14): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+6 more)

### Community 9 - "TelemetryPanel.tsx"
Cohesion: 0.10
Nodes (39): TelemetryReport, displayAgentTask(), LiveAgentTask(), Props, RunningTask(), text(), AzureBuild, BreakdownTable() (+31 more)

### Community 10 - "enrollment-gate.ts"
Cohesion: 0.23
Nodes (19): dispatchNightly(), eligibility(), bindDelivery(), featureEffectGate(), assertFeatureGate(), bindFeature(), currentApproval(), featureGate() (+11 more)

### Community 11 - "Store"
Cohesion: 0.04
Nodes (53): GitHubFeaturePublisher, helperTelemetry(), JiraFeaturePublisher, observeHelperGroups(), stopHelperGroups(), stopReview(), leadershipContext(), dispatchExposure() (+45 more)

### Community 12 - "App.tsx"
Cohesion: 0.06
Nodes (50): BrainDrawer(), themeColor, App(), BrainWorkspace, CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants (+42 more)

### Community 13 - "admit-improvement.ts"
Cohesion: 0.24
Nodes (15): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+7 more)

### Community 14 - "advance-metadata-park.ts"
Cohesion: 0.09
Nodes (67): advanceMetadataPark(), Parked, releaseWords(), sentAnything(), cardResumeRoute(), effectiveParkPickup(), PICKUP_ASSIGNEE, REVIEWABLE (+59 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.13
Nodes (52): requestDelivery(), accounting, DeliverySubject, nonDelivery, originalReads, createFeature(), assertEnrollable(), enrolled() (+44 more)

### Community 16 - "work-summary.ts"
Cohesion: 0.09
Nodes (41): jiraQueueProgress(), nextStage(), deliveryRoles, JiraQueueProgress, TicketProgress, STAGE_LABELS, STAGE_ROLE, deliveryRepairProjection() (+33 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.11
Nodes (37): baselined(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences(), clip(), maintenanceBlockedId(), MaintenanceCandidate (+29 more)

### Community 18 - "controller-runtime.ts"
Cohesion: 0.14
Nodes (23): controllerEffects(), alive(), option(), realMachine(), runController(), deploy(), exclusively(), unfinishedDeployments() (+15 more)

### Community 19 - "github-context.ts"
Cohesion: 0.11
Nodes (43): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+35 more)

### Community 20 - "activation-recovery.ts"
Cohesion: 0.08
Nodes (57): pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash (+49 more)

### Community 21 - "harnessEffect"
Cohesion: 0.20
Nodes (31): effectKey(), LaneOperation, laneWrite(), moveCardOnce(), Lane, MOVABLE, moveLane(), resolveLane() (+23 more)

### Community 22 - "weekly-rollup.ts"
Cohesion: 0.14
Nodes (26): learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), RollupResult (+18 more)

### Community 23 - "jira-time.ts"
Cohesion: 0.11
Nodes (38): twgProfile(), unresolvedAttempts(), bindingOf(), connectWith(), data(), envelope(), finishVerifiedEffects(), JiraWorklogs (+30 more)

### Community 24 - "deploy.ts"
Cohesion: 0.10
Nodes (43): advance(), controllerOf(), Commit, DEPLOY_STEPS, DeployFacts, DeployStatus, Digest, RollbackFacts (+35 more)

### Community 25 - "GitHubDelivery"
Cohesion: 0.07
Nodes (40): GitHubDelivery, stopReason(), boardPreflightCandidate(), Ownership, reconcileBoardPreflight(), adoptCandidate(), reported, Scope (+32 more)

### Community 26 - "agents.ts"
Cohesion: 0.03
Nodes (91): implementationWorkerContext(), stageInstructions, savedStageCompletion(), assertContinuableWorktree(), CONTINUABLE, continuationPrompt(), MAX_CONTINUATIONS, recordedContinuation() (+83 more)

### Community 27 - "workKey"
Cohesion: 0.10
Nodes (31): mergedByOwner(), closeableIssue(), effectsSettled(), eligible(), officePublished(), ownerMerged(), prerequisitesMet(), settle() (+23 more)

### Community 28 - "github-delivery.ts"
Cohesion: 0.06
Nodes (67): writerRestartInstruction(), BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction(), dependabotReviewGuidance(), discover(), refreshDependencies() (+59 more)

### Community 29 - "Goals.tsx"
Cohesion: 0.15
Nodes (18): CTOReview(), goalState, DailyCTO(), GoalHistory(), load(), reportDate(), reviewStatus, GoalList() (+10 more)

### Community 30 - "digest"
Cohesion: 0.08
Nodes (60): runHarnessStage(), harnessDelivers(), legacyRecovery(), parkUnadmittedMetadata(), stagePrompt(), StagePromptInput, admitPRMetadata(), evaluatePRMetadata() (+52 more)

### Community 31 - "accept-stage-result.ts"
Cohesion: 0.10
Nodes (49): containedFile(), findingsBlock(), handsOff(), DECISION_KINDS, needsDecision(), acceptStageResult(), acceptConflictRepair(), APPROACH_GUARD_REJECTION (+41 more)

### Community 32 - "index.ts"
Cohesion: 0.07
Nodes (26): close(), config, itSpecialist, loadedRevision, offices, releaseLock, server, serviceHealth (+18 more)

### Community 33 - "remove-candidate.ts"
Cohesion: 0.12
Nodes (29): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), maintenanceCandidate(), moveAside(), moveBack(), purgeRemoved(), purging (+21 more)

### Community 34 - "run.ts"
Cohesion: 0.13
Nodes (22): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_FIX_PROMPT, OfficeFixResult (+14 more)

### Community 35 - "common.cjs"
Cohesion: 0.16
Nodes (25): fromArgs(), connections(), fs, main(), path, atomicWrite(), crypto, digest() (+17 more)

### Community 36 - "scheduled-work.ts"
Cohesion: 0.09
Nodes (40): freshOwnershipRead(), conversationResolved(), dueSlackReread(), rereadUncertainSlack(), runningRevision(), settledSlackReadback(), slackRequestSettled(), deliverySlot() (+32 more)

### Community 37 - "routing.cjs"
Cohesion: 0.11
Nodes (33): fs, main(), path, { spawnSync }, frontmatterProblems(), main(), parseArgs(), usage() (+25 more)

### Community 38 - "redact-evidence.ts"
Cohesion: 0.11
Nodes (18): AFTER_LABEL, ASSIGNMENT, AWS_KEY_ID, BARE_CREDENTIAL, BARE_UNIT, BARE_VALUE, CONTROL_ESCAPE, JSON_WEB_TOKEN (+10 more)

### Community 39 - "run-retrospective.ts"
Cohesion: 0.08
Nodes (51): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, BlockingTrigger, blockingTrigger(), isBlocking() (+43 more)

### Community 40 - "http/commands.ts"
Cohesion: 0.20
Nodes (16): configureNotices(), DiscoveryResumeInput, requeueWaitedImplement(), enqueueMetadataRecovery(), baselineLearning(), configureKnowledge(), declineLessonIssue(), reactivateLesson() (+8 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.15
Nodes (26): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence(), CaptureContext (+18 more)

### Community 42 - "engine.ts"
Cohesion: 0.08
Nodes (11): checkMail(), drainMail(), requestMail(), enableNightly(), ingest(), ResumeProject, drainMaintenance(), reconcileMaintenance() (+3 more)

### Community 43 - ".save"
Cohesion: 0.09
Nodes (55): enumerateIntakeList(), inPickupOrder(), Intake, text(), resolveBlockedTransition(), document(), transitionWithComment(), jiraAccount() (+47 more)

### Community 44 - "Offices"
Cohesion: 0.12
Nodes (4): QuestionNotifications, seedOfficeLessons(), InFlightOperations, Offices

### Community 45 - "harness-baseline.ts"
Cohesion: 0.15
Nodes (23): BaselineReport, baselineReport(), BaselineSource, baselineText(), millions(), row(), share(), add() (+15 more)

### Community 46 - "OfficeScene.tsx"
Cohesion: 0.17
Nodes (33): withoutElapsed(), Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk() (+25 more)

### Community 47 - "ref_node_crypto"
Cohesion: 0.07
Nodes (67): commandFeature(), reviewQuestions(), featureItemComplete(), reconcileFeatureCompletion(), readEvidence(), automaticIntakeWait(), DELAYS, MAX_EXECUTIONS (+59 more)

### Community 48 - "cec/workflow.ts"
Cohesion: 0.12
Nodes (27): applyIntakeObservation(), latestQA(), notPassedInLatestQA(), QACoverage, qaCoverage(), same(), Tested, Carried (+19 more)

### Community 49 - "pilot-delivery.ts"
Cohesion: 0.06
Nodes (73): candidateBranchMoved(), applyChangeScope(), endChangeScope(), levels(), MAX_CHECKS, owedUnderScope(), scopeBase(), scopeOutgrown() (+65 more)

### Community 50 - ".emit"
Cohesion: 0.18
Nodes (19): assertConversationReadback(), finishSupersededReadback(), projectSlackDeliveries(), settleRequestedSlackReplacement(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint() (+11 more)

### Community 51 - "effects.ts"
Cohesion: 0.14
Nodes (12): Assignment, jiraText(), Transition, descriptionPreimage(), plain(), NOT_LANDED_SETTLE_MS, FeaturePublisher, publishFeature() (+4 more)

### Community 52 - "projects.ts"
Cohesion: 0.10
Nodes (29): DATA, LOCAL_BINDINGS, OfficeConfigInputs, officeConfigRoute(), officeConfigSummary(), projectSettingsSummary(), legacyCecPrompt(), CECBinding (+21 more)

### Community 53 - "ref_node_sqlite"
Cohesion: 0.13
Nodes (16): readSavedState(), LARGE_KEY_CHARS, plain(), RedactedEntries, RedactedEntry, redactEntries(), joinParts(), PartRow (+8 more)

### Community 54 - "jiraBinding"
Cohesion: 0.23
Nodes (4): contentSchema(), JiraIssuePublisher, publicationDescription(), jiraBinding()

### Community 55 - "ref_node_child_process"
Cohesion: 0.08
Nodes (27): changedPaths(), { execFileSync }, files, isMapInput(), mapOnly(), { execFileSync }, git(), publish() (+19 more)

### Community 56 - "FeatureWorkspace.tsx"
Cohesion: 0.11
Nodes (28): FeatureQuestionProjection, OutboxQuestionRound(), send(), FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases (+20 more)

### Community 57 - "deploy-context.ts"
Cohesion: 0.11
Nodes (22): StoreDatabase, ControllerEffects, DEPLOY_PROJECT, ControllerMachine, DEFAULT_TIMINGS, DeployContext, DeployTimings, bootout() (+14 more)

### Community 58 - "ref_node_path"
Cohesion: 0.06
Nodes (73): recoverCTOInput(), DeliveryAuthorityInput, closeoutRequestResolved(), allowed, metadataRequestResolved(), preparationRequestResolved(), scopeRepairRequestResolved(), assertStoppedBaseAudit() (+65 more)

### Community 59 - "jira-attempts.ts"
Cohesion: 0.11
Nodes (24): attempted(), attemptState(), bound(), covers(), JiraAttempt, jiraAttempts(), JiraAttemptState, open() (+16 more)

### Community 60 - "cost-ledger.ts"
Cohesion: 0.15
Nodes (28): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress(), effectId() (+20 more)

### Community 61 - "unsent-time.ts"
Cohesion: 0.17
Nodes (15): publishableEntry(), settlementPending(), superseded(), ticketUnresolved(), TimeLedger, missedSinceVerified(), readBackTime(), clearUnsent() (+7 more)

### Community 62 - "maintenance/maintenance.ts"
Cohesion: 0.07
Nodes (38): maintenancePolicies(), accessibilitySources(), sourceFindings, sourceReview(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, brainResultStop() (+30 more)

### Community 63 - "timed-statements.ts"
Cohesion: 0.22
Nodes (12): StoreTimings, NAMED, rowsText(), rowText(), SQL_TOKEN, statementName(), text(), timed() (+4 more)

### Community 64 - "judge-resumes.ts"
Cohesion: 0.05
Nodes (51): absent(), IncidentLedger, isOpen(), boundaryCrossed(), Crossing, Progress, CheckpointProgress, checkpointProgress() (+43 more)

### Community 65 - "validate_pr_body.cjs"
Cohesion: 0.36
Nodes (8): fs, main(), readableText(), REQUIRED_CHECKS, REQUIRED_SECTIONS, sections(), validatePullRequestBody(), withoutComments()

### Community 66 - "audit-plan-candidates.cjs"
Cohesion: 0.14
Nodes (31): audit(), branchIssueNumbers(), classify(), distinctiveTitleWords(), { execFileSync }, extractPaths(), findPrForMergeSubject(), fmtCommit() (+23 more)

### Community 67 - "alert-issue.ts"
Cohesion: 0.12
Nodes (29): Execute, adoptDependabot(), AlertIssue, alertIssueBody(), alertIssueTitle(), alertMarker(), closeAlertIssue(), ensureAlertIssue() (+21 more)

### Community 68 - "resume-arrivals.ts"
Cohesion: 0.14
Nodes (55): canonical(), checkpointEligibility(), admitAssignmentResume(), forAssignment(), admitCheckpointResume(), forCheckpoint(), admitResume(), ResumeAdmission (+47 more)

### Community 69 - "ticket-evidence.ts"
Cohesion: 0.09
Nodes (38): jiraRecord(), unpack(), statusHeld(), metadataDigest(), verifiedTransition(), verifyAlreadyAtStatus(), Connection, twgConnection() (+30 more)

### Community 70 - "constellation-runtime.ts"
Cohesion: 0.09
Nodes (21): CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point, ConstellationRuntime, createConstellation() (+13 more)

### Community 71 - "cec-reads.ts"
Cohesion: 0.07
Nodes (47): escaped(), IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), intakeMembership(), projectListScope(), parksInJira() (+39 more)

### Community 72 - "session-context-file.ts"
Cohesion: 0.27
Nodes (12): ContextFoldPrefix, contextFoldPrefix(), SessionContextCheckpoint, captureSessionContextClone(), sessionContextFile(), ContextReadChanged, MAX_CONTEXT_READ_MS, sameContextFile() (+4 more)

### Community 73 - "assignments.ts"
Cohesion: 0.05
Nodes (54): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, CommittedBrain (+46 more)

### Community 74 - "session-scope.ts"
Cohesion: 0.20
Nodes (16): Bound, claudeScopeParser(), claudeSessionScope(), CODEX_ROLLOUTS, contextReaders(), retainSessionMessage(), SessionConversation, escaped() (+8 more)

### Community 75 - "service-health.ts"
Cohesion: 0.11
Nodes (23): ClaudeLoginRefusal, claudeLoginRefusal(), claudeRefusalWords(), RECORDED_REFUSALS, refusedClaudeRow(), listenerHealth(), providers, ProviderStatusChecks (+15 more)

### Community 76 - "security.ts"
Cohesion: 0.09
Nodes (39): az(), AzureMonitor, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs(), fullActivePRs() (+31 more)

### Community 77 - "diagnostic-snapshot.ts"
Cohesion: 0.14
Nodes (20): itChatPrompt(), assignmentDiagnostics(), diagnosticContext(), diagnosticSnapshot(), followUpPicture(), publishITReport(), nativeDeliveryResolved(), archiveOldReports() (+12 more)

### Community 78 - "incidents.ts"
Cohesion: 0.06
Nodes (63): attributedRecords(), foldsItsRun(), groupCandidates(), ObservedIncident, ObservedSubject, digest(), fingerprint(), incidentId() (+55 more)

### Community 79 - "Ticket"
Cohesion: 0.07
Nodes (41): carriedNotRepeated(), changeScopeNote(), Scoped, confirmsMovedHead(), JiraOperations, movedHeadNote(), cecPrompt(), resolvedDecisionNote() (+33 more)

### Community 80 - "session-bridge.ts"
Cohesion: 0.10
Nodes (30): codexDaemonProcesses(), accountCodexProcesses(), CodexProcessInventory, codexProcessInventory(), DesktopSessions, unaccountedProcesses(), codexThreadMetadata(), METADATA_CHUNK (+22 more)

### Community 81 - "resume-control.ts"
Cohesion: 0.26
Nodes (8): absent(), NEVER_ENABLED, ResumeControl, stated(), Stored, unreadable(), IncidentsRouteContext, ResumeSwitch

### Community 82 - "api-routes.ts"
Cohesion: 0.17
Nodes (19): implementationContinuationRoute(), qaPlanRetryRoute(), goalHistory(), saveGoal(), apiRoute(), preferencesRoute(), PreferencesRouteContext, fileResponse() (+11 more)

### Community 83 - "dependency-bots/adopt.ts"
Cohesion: 0.10
Nodes (37): readBackOrThrow(), retryRead(), closesIssue(), linkedBody(), linkPR(), DependabotPR, dependabotPR(), ensureTrackingIssue() (+29 more)

### Community 84 - "viewer.js"
Cohesion: 0.19
Nodes (25): addMetaLink(), addMetaRow(), addRelationship(), applyView(), buildIndexes(), buildLegend(), buildModel(), buildRenderer() (+17 more)

### Community 85 - "deploy-command.ts"
Cohesion: 0.16
Nodes (22): readControllerPin(), writeControllerPin(), deployCommand(), DeployCommandOptions, report(), status(), deployPaths(), DeployStop (+14 more)

### Community 86 - "outbox.ts"
Cohesion: 0.07
Nodes (64): capabilityBlockedReviews(), latestReviews(), metadataParkAction(), ADOPTION_STALLED_MS, projectOutbox(), item(), syncOutbox(), sameOwnerSteps() (+56 more)

### Community 87 - "conversations/conversations.ts"
Cohesion: 0.10
Nodes (17): ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, pumpCTO(), queueCTOHandoff(), saveGoals(), ctoInputIdentityMatches() (+9 more)

### Community 88 - "OfficeSnapshot"
Cohesion: 0.06
Nodes (60): knowledgeOutbox(), Conversation(), SendMessage, LessonDecisionAction, lessonDecisionState(), readLessonDecision(), DAYS, dueLessonDecisions() (+52 more)

### Community 89 - "process.ts"
Cohesion: 0.12
Nodes (23): Candidate, settledPushBoundary(), Result, inactivityWatch(), At, Errno, errno(), GroupInventory (+15 more)

### Community 90 - "sign-in-unpark.ts"
Cohesion: 0.07
Nodes (47): correlatedBuild(), hasPendingDelivery(), resumeAfterSignIn(), signInWait(), MAX_SIGN_IN_UNPARKS, unparkSignedIn(), waitingStep(), Azure (+39 more)

### Community 91 - "readable-jira-comment.ts"
Cohesion: 0.11
Nodes (32): CommentPage, commentReadback(), devUpdate(), HEADLINE, postDevUpdate(), OUTCOME, qaComment(), remote() (+24 more)

### Community 92 - "session-context-client.ts"
Cohesion: 0.12
Nodes (16): claudeSessionContext(), readTranscript, codexSessionContext(), readRollout, ContextThread, contextThread(), postedProjects(), THREAD_ANSWER_MS (+8 more)

### Community 93 - "plans.cjs"
Cohesion: 0.19
Nodes (19): walk(), association(), auditedDigests(), candidate(), cleanCursor(), collapseByTitle(), discover(), fromMarkdown() (+11 more)

### Community 94 - "report.ts"
Cohesion: 0.26
Nodes (13): Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked(), row() (+5 more)

### Community 96 - "index.tsx"
Cohesion: 0.10
Nodes (49): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView() (+41 more)

### Community 97 - "holdReason"
Cohesion: 0.07
Nodes (52): interruptedImplementation(), continueUnsealedQA(), entry(), ATTEMPT_DELAYS_MS, nextAttemptAt(), NOT_RETRYABLE, releaseFunds(), StoppedWriter (+44 more)

### Community 98 - "validate-stage.ts"
Cohesion: 0.15
Nodes (18): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+10 more)

### Community 99 - "archive-plan.cjs"
Cohesion: 0.13
Nodes (29): fs, main(), parse(), path, archive(), cell(), ensureIndex(), fs (+21 more)

### Community 100 - "Effects"
Cohesion: 0.13
Nodes (20): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), Identity, MergeNotifications, NoticeSettings (+12 more)

### Community 101 - "inspect-closed-plan.ts"
Cohesion: 0.05
Nodes (60): GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles(), ContinuationIO (+52 more)

### Community 102 - "project-binding-blocks.ts"
Cohesion: 0.19
Nodes (18): azureSchema, deploymentSchema, jiraSchema, ownJiraSchema, promptSchema, DEFAULT_STAGE_STATUSES, intakeStatus, resolvedStatuses() (+10 more)

### Community 103 - "on-merge-sync.cjs"
Cohesion: 0.19
Nodes (22): fieldSpan(), keyPattern(), list(), parseListLiteral(), quote(), render(), scalar(), splitFrontmatter() (+14 more)

### Community 104 - "snapshot-stores.ts"
Cohesion: 0.13
Nodes (30): absentAdmission(), AdmissionComparison, AdmissionSnapshot, compareAdmissions(), snapshotAdmissions(), storeMissing(), APPENDED_TABLE, comparableOrder() (+22 more)

### Community 105 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 106 - "deploy-plan.ts"
Cohesion: 0.13
Nodes (32): buildRelease(), pinnedVersions(), CONTROLLER_ENTRY, ControllerPin, Pin, pinnedController(), planDeployment(), createDeployToken() (+24 more)

### Community 107 - "work.ts"
Cohesion: 0.08
Nodes (38): admitRepairWaits(), Covered, COVERING, expiryEvent(), expiryId(), lastProgress(), progressOf(), RepairWaitEntry (+30 more)

### Community 108 - "DeploymentFence"
Cohesion: 0.18
Nodes (10): assertToken(), DeploymentFence, declaredWithin(), deploymentFenceGate(), DeploymentFenceGateContext, STOPPING_COMMANDS, stoppingCommand(), Action (+2 more)

### Community 109 - "lesson-issue-ready.ts"
Cohesion: 0.24
Nodes (14): assignedToJoe(), fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), firstLane(), instruction(), LaneMove, move() (+6 more)

### Community 110 - "blocker-followups.ts"
Cohesion: 0.12
Nodes (46): conversationReadbackReady(), followupOf(), pendingReadback(), queueConversationReadback(), readbackEnding(), uncertainConversations(), readBackConversations(), followupRecord() (+38 more)

### Community 111 - "assignment-poll.ts"
Cohesion: 0.09
Nodes (30): noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), BLOCK, harnessBlockMove(), harnessParkedCard(), noted(), admitReadyCards() (+22 more)

### Community 112 - "goal-reporting.ts"
Cohesion: 0.14
Nodes (25): githubPRDescription(), collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB (+17 more)

### Community 113 - "MaintenanceRun"
Cohesion: 0.09
Nodes (30): CheckpointEligibility, completeNativeCheckpoint(), BrainStatusSchema, identity, brainCheckpointCompletion(), coverageSchema, verified, PublishedPR (+22 more)

### Community 114 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 115 - "run-accounting.ts"
Cohesion: 0.11
Nodes (33): NOTIFY_HELPER, notifyHelperResolution(), BoundedRead, done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf() (+25 more)

### Community 119 - "accessibility-sources.ts"
Cohesion: 0.12
Nodes (24): PublicationReceipt, Assign, Board, Content, GitHubIssuePublisher, number(), same(), actionable() (+16 more)

### Community 120 - "lesson-selection.ts"
Cohesion: 0.17
Nodes (14): INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, LessonSelection, MAINTENANCE, MAX_LESSONS, normalPath() (+6 more)

### Community 121 - "follow-production.ts"
Cohesion: 0.20
Nodes (17): awaitingJiraStatus(), awaitingProduction(), FOLLOW_DAYS, followed(), isFollowed(), Azure, AzureRead, containedIn() (+9 more)

### Community 122 - "local-config.ts"
Cohesion: 0.28
Nodes (13): AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), goalEvidencePath(), assertUniqueProjectKeys(), Entry, LocalBindings, localBindings(), BindingBlocks (+5 more)

### Community 123 - "read-retries.ts"
Cohesion: 0.20
Nodes (14): defaultPickupStatus(), PrerequisitesSchema, SourceClosed, classifyStop(), ReviewWait, incompleteReadOutput(), planReadRetry(), readOnlyStageJob() (+6 more)

### Community 124 - "refresh-issue-state.cjs"
Cohesion: 0.20
Nodes (19): advanceFence(), closingIssues(), githubRefs(), key(), normalizeGithubQuery(), normalizeRepository(), parseGithubQuery(), ref() (+11 more)

### Community 125 - "knowledge.ts"
Cohesion: 0.04
Nodes (54): args, [cmd,...rawArgs], commands, key, projectIndex, normalizeStatement(), curateLesson(), Curation (+46 more)

### Community 126 - "operationPaths"
Cohesion: 0.32
Nodes (10): Body, DeploymentFenceState, fenceTokenDigest(), abandon(), operationPaths(), readDeployToken(), removeDeployToken(), endDeployment() (+2 more)

### Community 127 - "interrupted-work-recovery.ts"
Cohesion: 0.33
Nodes (8): currentOutbox(), interruptAdoptions(), legacy(), REMOVED_FIELDS, retireLegacyRecovery(), goalNoticeNeverDispatched(), maintenanceNoticeNeverDispatched(), recover()

### Community 128 - "node-visuals.ts"
Cohesion: 0.20
Nodes (14): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+6 more)

### Community 129 - "build-release.ts"
Cohesion: 0.22
Nodes (9): runningRevision(), runningRevision(), runtimeRevision(), BUILD_ENV, BuildReleaseOptions, Execute, compare(), parts() (+1 more)

### Community 130 - "pre-push-boundary.ts"
Cohesion: 0.27
Nodes (10): Event, exactCommand(), Invocation, localHookCommand(), one(), prePushRejection(), PushIdentity, retirementBoundary() (+2 more)

### Community 131 - "it-specialist.ts"
Cohesion: 0.12
Nodes (26): replacedReadback(), OwnerStepItem, ownerStepItems(), signIn(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved() (+18 more)

### Community 132 - "telemetry.ts"
Cohesion: 0.08
Nodes (36): add(), CodexRequest, CodexRollout, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens() (+28 more)

### Community 133 - "backup-stores.ts"
Cohesion: 0.26
Nodes (10): ActiveRelease, readActiveRelease(), BackupEntry, BackupInput, BackupInventory, backupStores(), INVENTORY_FILE, schemaOf() (+2 more)

### Community 134 - "useOfficePreferences.ts"
Cohesion: 0.26
Nodes (10): acceptPreferences(), PreferenceCandidate, strip(), UNKNOWN_PREFERENCES, OfficePreferencesController, PreferenceFeedback, PreferenceField, requestPreferences() (+2 more)

### Community 135 - "restart-stopped-writers.ts"
Cohesion: 0.38
Nodes (8): restartStoppedWriters(), unchangedSinceAccepted(), Execute, keptWork(), Read, refObject(), SalvageRetry, salvageWorktree()

### Community 136 - "coordination.ts"
Cohesion: 0.06
Nodes (32): Admission, admit(), IntakeContext, WAIT_STATUSES, compatible(), dependencyCompletionKey(), dependencyEligibility(), DependencyStores (+24 more)

### Community 137 - ".getEffect"
Cohesion: 0.27
Nodes (4): GitHubOperations, closeNativeRefresh(), fingerprint(), EffectIntent

### Community 138 - "ledger.ts"
Cohesion: 0.14
Nodes (23): failureOutranks(), acceptedCompletionResolution(), investigationCandidates(), investigationId(), ctoReplacementResolution(), finishedSubjectResolution(), investigationFollowUps(), investigationHeld() (+15 more)

### Community 139 - "coordination-tick.ts"
Cohesion: 0.23
Nodes (10): checkpointOutcome(), outcomeKnown(), reconcileCompletedCheckpoints(), legacy, reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION (+2 more)

### Community 140 - "session-snapshot-cleanup.ts"
Cohesion: 0.40
Nodes (5): SNAPSHOT_PREFIX, removeStaleSessionSnapshots(), SNAPSHOT_SWEEP_MS, STALE_SNAPSHOT_MS, sweepStaleSessionSnapshots()

### Community 141 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 142 - "scheduler.ts"
Cohesion: 0.14
Nodes (15): OfficeCapacity, PROJECT_LOCAL, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch() (+7 more)

### Community 144 - "reconcile-merges.cjs"
Cohesion: 0.21
Nodes (15): remoteSlug(), collectPulls(), copyWikiForDryRun(), { execFileSync }, flattenPages(), fs, githubRequest(), isWikiBotPull() (+7 more)

### Community 145 - "shared.ts"
Cohesion: 0.09
Nodes (19): GitHubMonitor, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, DeliveryResolution, GitHubBoard (+11 more)

### Community 146 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (7): CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility, overlayEntranceDelays(), SceneOverlay()

### Community 147 - "retire-history.ts"
Cohesion: 0.31
Nodes (8): readHistoryScope(), enqueueHistoryRetirement(), historicalRecordDigest(), Intent, records(), retireIncompleteHistory(), HistoryRetirement, HistoryRetirementIntent

### Community 148 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 149 - "context-failure-transport.ts"
Cohesion: 0.29
Nodes (6): packContextFailure(), PackedContextFailure, unpackContextFailure(), ContextReadPhase, SessionContextDeadline, sessionInventoryFailureDetail()

### Community 150 - "repoRoot"
Cohesion: 0.13
Nodes (18): fs, main(), parse(), path, repoRoot(), substantive(), main(), path (+10 more)

### Community 151 - "park.ts"
Cohesion: 0.50
Nodes (5): decisionMarker(), park(), HarnessPark, recordMetadataPark(), MetadataParkBinding

### Community 152 - "merge-summary.ts"
Cohesion: 0.36
Nodes (7): clamp(), LIMITS, MergedPR, plainSlackText(), section(), shippedSummary(), mergeText()

### Community 153 - "incident-command.ts"
Cohesion: 0.38
Nodes (6): FLAGS, incidentCommand(), IncidentCommandIO, option(), USAGE, whole()

### Community 154 - "pr-body.ts"
Cohesion: 0.38
Nodes (6): commitlintRejection(), developerPRContent(), Execute, officePRContent(), PRContent, prContent()

### Community 155 - "historical-artifact-path.ts"
Cohesion: 0.43
Nodes (6): assertHistoricalArtifactPath(), historicalArtifactPath(), HistoricalArtifactPath, Owner, within(), retiredInstallationAlias()

### Community 156 - "delivery-ownership.ts"
Cohesion: 0.33
Nodes (4): Ownership, ownershipContext, refreshDeliveryOwnership(), RefreshOwnership

### Community 157 - "handover-cms.ts"
Cohesion: 0.40
Nodes (3): file, project, root

## Knowledge Gaps
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `TicketJob`, `features/workflow.ts`, `daily-cto.ts`, `artifact`, `retrospective-subject.ts`, `enrollment-gate.ts`, `admit-improvement.ts`, `advance-metadata-park.ts`, `scheduled-captures.ts`, `record-trigger.ts`, `controller-runtime.ts`, `github-context.ts`, `activation-recovery.ts`, `harnessEffect`, `weekly-rollup.ts`, `jira-time.ts`, `GitHubDelivery`, `agents.ts`, `workKey`, `github-delivery.ts`, `digest`, `accept-stage-result.ts`, `remove-candidate.ts`, `run.ts`, `scheduled-work.ts`, `run-retrospective.ts`, `http/commands.ts`, `time-scope.ts`, `engine.ts`, `.save`, `Offices`, `ref_node_crypto`, `pilot-delivery.ts`, `.emit`, `effects.ts`, `ref_node_sqlite`, `jiraBinding`, `deploy-context.ts`, `ref_node_path`, `jira-attempts.ts`, `cost-ledger.ts`, `unsent-time.ts`, `maintenance/maintenance.ts`, `judge-resumes.ts`, `alert-issue.ts`, `resume-arrivals.ts`, `ticket-evidence.ts`, `cec-reads.ts`, `assignments.ts`, `security.ts`, `diagnostic-snapshot.ts`, `incidents.ts`, `Ticket`, `session-bridge.ts`, `api-routes.ts`, `dependency-bots/adopt.ts`, `outbox.ts`, `conversations/conversations.ts`, `OfficeSnapshot`, `process.ts`, `sign-in-unpark.ts`, `readable-jira-comment.ts`, `holdReason`, `validate-stage.ts`, `Effects`, `inspect-closed-plan.ts`, `work.ts`, `lesson-issue-ready.ts`, `blocker-followups.ts`, `assignment-poll.ts`, `goal-reporting.ts`, `MaintenanceRun`, `run-accounting.ts`, `accessibility-sources.ts`, `lesson-selection.ts`, `follow-production.ts`, `read-retries.ts`, `knowledge.ts`, `interrupted-work-recovery.ts`, `build-release.ts`, `it-specialist.ts`, `coordination.ts`, `.getEffect`, `ledger.ts`, `coordination-tick.ts`, `scheduler.ts`, `shared.ts`, `retire-history.ts`, `historical-artifact-path.ts`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `command()` (e.g. with `startServiceTicks()` and `realMachine()`) actually correct?**
  _`command()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Should `incidents/routes.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.04789915966386555 - nodes in this community are weakly interconnected._
- **Why does `command()` connect `process.ts` to `incidents/routes.ts`, `build-release.ts`, `TicketJob`, `features/workflow.ts`, `restart-stopped-writers.ts`, `coordination.ts`, `.getEffect`, `Store`, `admit-improvement.ts`, `scheduler.ts`, `shared.ts`, `controller-runtime.ts`, `github-context.ts`, `command-registry.ts`, `harnessEffect`, `weekly-rollup.ts`, `jira-time.ts`, `deploy.ts`, `GitHubDelivery`, `agents.ts`, `pr-body.ts`, `github-delivery.ts`, `digest`, `accept-stage-result.ts`, `remove-candidate.ts`, `engine.ts`, `.save`, `pilot-delivery.ts`, `effects.ts`, `jiraBinding`, `deploy-context.ts`, `ref_node_path`, `jira-attempts.ts`, `cost-ledger.ts`, `unsent-time.ts`, `maintenance/maintenance.ts`, `ticket-evidence.ts`, `assignments.ts`, `service-health.ts`, `security.ts`, `Ticket`, `session-bridge.ts`, `resume-control.ts`, `dependency-bots/adopt.ts`, `deploy-command.ts`, `sign-in-unpark.ts`, `readable-jira-comment.ts`, `holdReason`, `validate-stage.ts`, `Effects`, `inspect-closed-plan.ts`, `deploy-plan.ts`, `lesson-issue-ready.ts`, `MaintenanceRun`, `accessibility-sources.ts`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Should `OrgChart.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10938775510204081 - nodes in this community are weakly interconnected._
- **Why does `OfficeSnapshot` connect `OfficeSnapshot` to `OrgChart.tsx`, `it-specialist.ts`, `Inspector.tsx`, `useOfficePreferences.ts`, `ref_react`, `TelemetryPanel.tsx`, `ledger.ts`, `Store`, `App.tsx`, `scene-motion.ts`, `work-summary.ts`, `record-trigger.ts`, `shared.ts`, `GitHubDelivery`, `Goals.tsx`, `scheduled-work.ts`, `harness-baseline.ts`, `OfficeScene.tsx`, `ref_node_crypto`, `cec/workflow.ts`, `.emit`, `ref_node_sqlite`, `FeatureWorkspace.tsx`, `maintenance/maintenance.ts`, `judge-resumes.ts`, `resume-arrivals.ts`, `service-health.ts`, `security.ts`, `diagnostic-snapshot.ts`, `incidents.ts`, `api-routes.ts`, `outbox.ts`, `conversations/conversations.ts`, `index.tsx`, `work.ts`, `MaintenanceRun`, `interrupted-work-recovery.ts`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Should `TicketJob` be split into smaller, more focused modules?**
  _Cohesion score 0.08412483039348712 - nodes in this community are weakly interconnected._