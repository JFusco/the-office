# Graph Report - the-office  (2026-11-24)

## Corpus Check
- 1187 files · ~497,940 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 6055 nodes · 26635 edges · 160 communities (150 shown, 10 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 970 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0a336f0e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- incidents/routes.ts
- OrgChart.tsx
- GitHubDelivery
- features/workflow.ts
- Inspector.tsx
- daily-cto.ts
- holdReason
- Button
- http/commands.ts
- TimeBook.tsx
- continue-access-only-plan.ts
- Store
- App.tsx
- admit-improvement.ts
- demand-facts.ts
- scheduled-captures.ts
- OfficeSnapshot
- record-trigger.ts
- command
- ref_node_path
- artifact
- harnessEffect
- weekly-rollup.ts
- jira-time.ts
- deploy.ts
- accessibility-sources.ts
- worker-runtime.ts
- agents.ts
- shared.ts
- ServiceHealthPanel.tsx
- digest
- accept-stage-result.ts
- index.ts
- remove-candidate.ts
- ledger.ts
- common.cjs
- scheduled-work.ts
- routing.cjs
- enrollment-gate.ts
- run-retrospective.ts
- outbox.ts
- time-scope.ts
- Engine
- owned-artifact.ts
- ref_node_crypto
- harness-baseline.ts
- OfficeScene.tsx
- brain-maintenance.ts
- api-routes.ts
- pilot-delivery.ts
- copy.ts
- restart-writer.ts
- ref_zod
- ref_node_sqlite
- jiraBinding
- create-candidate.ts
- FeatureWorkspace.tsx
- controller-runtime.ts
- recovery/stopped-base-update.ts
- retrospective-subject.ts
- cost-ledger.ts
- time-ledger.ts
- coordination.ts
- goal-reviews.ts
- judge-resumes.ts
- validate_pr_body.cjs
- audit-plan-candidates.cjs
- telemetry.ts
- resume-arrivals.ts
- assignment-poll.ts
- constellation-runtime.ts
- setup-stop-cap.ts
- session-context-lines.ts
- assignments.ts
- session-scope.ts
- service-health.ts
- azure.ts
- it-report.ts
- redactEvidence
- cec.ts
- session-bridge.ts
- service-ticks.ts
- Offices
- dependency-bots/adopt.ts
- viewer.js
- github-readiness.ts
- incidents.ts
- .emit
- Outbox.tsx
- process.ts
- github-workflows.ts
- Ticket
- session-context-file.ts
- plans.cjs
- report.ts
- capture-session-clone.py
- index.tsx
- owner-merged-stopped.ts
- .save
- archive-plan.cjs
- Effects
- continue-ownership-read.ts
- continue-unsealed-qa.ts
- on-merge-sync.cjs
- backup-stores.ts
- extract-worker.mjs
- service-plist.ts
- work.ts
- engine.ts
- release-unpark.ts
- blocker-followups.ts
- notifications.ts
- fact-bounds.ts
- deploy-plan.ts
- slack-supersession.ts
- sign-in-unpark.ts
- qa.ts
- qa-plan-continuation.ts
- writer-restart.ts
- inspect-closed-plan.ts
- lesson-selection.ts
- follow-production.ts
- session-coverage.ts
- admit-repair-waits.ts
- refresh-issue-state.cjs
- knowledge.ts
- run.ts
- DeploymentFence
- node-visuals.ts
- ref_node_child_process
- command-registry.ts
- it-specialist.ts
- run-accounting.ts
- intent.ts
- resume-control.ts
- checkpoint-completion.ts
- evidence-artifacts.ts
- GitHubIssuePublisher
- lesson-issue-ready.ts
- store.ts
- session-snapshot-cleanup.ts
- scene-motion.ts
- packed-consumer-pnpm.ts
- production.ts
- reconcile-merges.cjs
- preferences-store.ts
- RoomCamera.tsx
- dates.cjs
- pre-push-boundary.ts
- recovery-ledger.ts
- serve-graph.cjs
- history-archive.ts
- ITFollowUp
- incident-command.ts
- context-failure-transport.ts
- CommandFailure
- ProjectProgress
- InFlightOperations
- office-qa-handoff.ts
- routing.js

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
- `BreakdownTable()` --indirect_call--> `cell()`  [INFERRED]
  src/telemetry/BreakdownTable.tsx → scripts/wiki/archive-plan.cjs
- `apply()` --indirect_call--> `note()`  [INFERRED]
  src/conversations/OutboxSavedImplementation.tsx → server/cec/parking/resume-parked.ts
- `UnrecordedResult` --references--> `StageResult`  [EXTRACTED]
  server/cec/unrecorded-result.ts → src/shared.ts
- `DeliverySlot` --references--> `Role`  [EXTRACTED]
  server/office/projects.ts → src/shared.ts
- `EffectOperation` --references--> `WorkRef`  [EXTRACTED]
  server/store/effects.ts → src/contracts/work.ts

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

## Communities (160 total, 10 thin omitted)

### Community 0 - "incidents/routes.ts"
Cohesion: 0.08
Nodes (40): citationFault(), CitationSchema, SourceVersions, inHistoryOf(), dismiss(), DISMISSAL_CITATIONS, DISMISSAL_REASON, DismissalFacts (+32 more)

### Community 1 - "OrgChart.tsx"
Cohesion: 0.10
Nodes (41): label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+33 more)

### Community 2 - "GitHubDelivery"
Cohesion: 0.07
Nodes (54): removeAdoptedClone(), namedRepairIds(), pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), StageContext, GitHubDelivery, hasUncertainEffects(), checksFailed() (+46 more)

### Community 3 - "features/workflow.ts"
Cohesion: 0.08
Nodes (53): approveFeature(), featureById(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), discoveryPrompt(), planPrompt() (+45 more)

### Community 4 - "Inspector.tsx"
Cohesion: 0.10
Nodes (68): ServiceHealthPanel(), followUp(), labels, ServiceHealthRow(), BlockerFollowups(), LearningCoverage(), LessonsPanel(), when() (+60 more)

### Community 5 - "daily-cto.ts"
Cohesion: 0.11
Nodes (15): DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), reviewWeekday(), DailyResultSchema, FreshDailyResultSchema, GoalEvidenceRequestSchema (+7 more)

### Community 6 - "holdReason"
Cohesion: 0.05
Nodes (90): boardPreflightCandidate(), Ownership, reconcileBoardPreflight(), blob(), Execute, inspectPartialWorktree(), partialLocalCleanupCandidate(), partialLocalCleanupKey() (+82 more)

### Community 7 - "Button"
Cohesion: 0.08
Nodes (56): KnowledgeActivity, KnowledgeActivityPage, KnowledgeEdge, KnowledgeMap, KnowledgeNode, Activity(), ActivityTimeline(), AssignmentKnowledge() (+48 more)

### Community 8 - "http/commands.ts"
Cohesion: 0.14
Nodes (22): configureNotices(), DiscoveryResumeInput, requeueWaitedImplement(), enqueueMetadataRecovery(), normalizeStatement(), baselineLearning(), configureKnowledge(), declineLessonIssue() (+14 more)

### Community 9 - "TimeBook.tsx"
Cohesion: 0.09
Nodes (41): TelemetryReport, displayAgentTask(), githubStageLabels, withoutElapsed(), LiveAgentTask(), Props, RunningTask(), text() (+33 more)

### Community 10 - "continue-access-only-plan.ts"
Cohesion: 0.44
Nodes (7): Document, document(), isAccessOnlyPlan(), settledAccessOnlyState(), continueAccessOnlyPlan(), entryExists(), SKILLS

### Community 11 - "Store"
Cohesion: 0.06
Nodes (32): GitHubFeaturePublisher, helperTelemetry(), JiraFeaturePublisher, helperInstallation(), observeHelperGroups(), stopHelperGroups(), FeatureReviewRunner, stopReview() (+24 more)

### Community 12 - "App.tsx"
Cohesion: 0.05
Nodes (48): BrainDrawer(), themeColor, App(), BrainWorkspace, CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants (+40 more)

### Community 13 - "admit-improvement.ts"
Cohesion: 0.26
Nodes (14): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+6 more)

### Community 14 - "demand-facts.ts"
Cohesion: 0.11
Nodes (24): clip(), DEMAND_LIMIT, demandFacts(), DemandSection, key(), LessonKey, notes(), Binding (+16 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.13
Nodes (52): requestDelivery(), accounting, DeliverySubject, nonDelivery, originalReads, createFeature(), assertEnrollable(), enrolled() (+44 more)

### Community 16 - "OfficeSnapshot"
Cohesion: 0.09
Nodes (42): jiraQueueProgress(), nextStage(), deliveryRoles, JiraQueueProgress, TicketProgress, SnapshotAcceptance, demoSnapshot(), tourStages (+34 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.12
Nodes (33): LEARNING_BASELINES, clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates(), maintenanceCompletedId(), visibleMaintenanceTriggerIds(), clip() (+25 more)

### Community 18 - "command"
Cohesion: 0.09
Nodes (44): readControllerPin(), writeControllerPin(), ControllerMachine, controllerOf(), deployCommand(), DeployCommandOptions, report(), status() (+36 more)

### Community 19 - "ref_node_path"
Cohesion: 0.06
Nodes (72): recoverCTOInput(), closeoutReceipt(), readRejection(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment (+64 more)

### Community 20 - "artifact"
Cohesion: 0.06
Nodes (108): containedFile(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal (+100 more)

### Community 21 - "harnessEffect"
Cohesion: 0.15
Nodes (38): BLOCK, harnessBlockMove(), harnessParkedCard(), noted(), effectKey(), LaneOperation, laneWrite(), moveCardOnce() (+30 more)

### Community 22 - "weekly-rollup.ts"
Cohesion: 0.16
Nodes (23): learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), retire(), RollupResult, harperFolder() (+15 more)

### Community 23 - "jira-time.ts"
Cohesion: 0.06
Nodes (60): attempted(), attemptState(), bound(), covers(), JiraAttempt, jiraAttempts(), JiraAttemptState, open() (+52 more)

### Community 24 - "deploy.ts"
Cohesion: 0.10
Nodes (40): abandon(), advance(), Commit, DEPLOY_STEPS, DeployFacts, DeployStatus, Digest, RollbackFacts (+32 more)

### Community 25 - "accessibility-sources.ts"
Cohesion: 0.09
Nodes (39): deliveryIntakeBlocker(), captureMaintenanceStep(), accessibilitySources(), actionable(), closingPull(), Finding, handoffIssue(), issueLines() (+31 more)

### Community 26 - "worker-runtime.ts"
Cohesion: 0.06
Nodes (46): candidateWorkspaceEnvironment(), assessDeliveryAuthority(), requireDeliveryAuthority(), assignmentSubject(), dispatchExposure(), prepareExposure(), LessonSelection, catalogLine() (+38 more)

### Community 27 - "agents.ts"
Cohesion: 0.05
Nodes (53): implementationWorkerContext(), intakeMembership(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), plainResume(), stageInstructions (+45 more)

### Community 28 - "shared.ts"
Cohesion: 0.04
Nodes (93): applyIntakeObservation(), QA_STAGES, Carried, findingsOwedToRetest(), missingRetestDispositions(), writerRestartInstruction(), harnessCloseout(), PASSING (+85 more)

### Community 29 - "ServiceHealthPanel.tsx"
Cohesion: 0.08
Nodes (40): DailyCTOSummary, blockedSummary(), itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps(), currentServices(), LessonsView() (+32 more)

### Community 30 - "digest"
Cohesion: 0.09
Nodes (58): retryRead(), admitPRMetadata(), assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema, savedMetadataAssessment(), validateSaved() (+50 more)

### Community 31 - "accept-stage-result.ts"
Cohesion: 0.08
Nodes (52): findingsBlock(), handsOff(), DECISION_KINDS, needsDecision(), acceptStageResult(), acceptConflictRepair(), APPROACH_GUARD_REJECTION, recordJobApproach() (+44 more)

### Community 32 - "index.ts"
Cohesion: 0.07
Nodes (25): close(), config, itSpecialist, loadedRevision, offices, releaseLock, server, serviceHealth (+17 more)

### Community 33 - "remove-candidate.ts"
Cohesion: 0.15
Nodes (23): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), maintenanceCandidate(), moveAside(), moveBack(), purgeRemoved(), purging (+15 more)

### Community 34 - "ledger.ts"
Cohesion: 0.15
Nodes (21): ctoInputIdentityMatches(), ctoInputRecovered(), acceptedCompletionResolution(), investigationCandidates(), investigationId(), ctoReplacementResolution(), finishedSubjectResolution(), investigationFollowUps() (+13 more)

### Community 35 - "common.cjs"
Cohesion: 0.12
Nodes (30): main(), parse(), connections(), fs, main(), path, fs, main() (+22 more)

### Community 36 - "scheduled-work.ts"
Cohesion: 0.09
Nodes (37): freshOwnershipRead(), deliverySlot(), Ownership, ownershipContext, refreshDeliveryOwnership(), RefreshOwnership, withAmendmentOwnership(), metadataRequestResolved() (+29 more)

### Community 37 - "routing.cjs"
Cohesion: 0.11
Nodes (30): fs, main(), path, { spawnSync }, frontmatterProblems(), adjacency(), edgeCost(), edgeKey() (+22 more)

### Community 38 - "enrollment-gate.ts"
Cohesion: 0.14
Nodes (23): dispatchNightly(), eligibility(), assertFeatureGate(), bindFeature(), currentApproval(), featureGate(), predecessorComplete(), automaticIntakeWait() (+15 more)

### Community 39 - "run-retrospective.ts"
Cohesion: 0.09
Nodes (45): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, BlockingTrigger, blockingTrigger(), isBlocking() (+37 more)

### Community 40 - "outbox.ts"
Cohesion: 0.09
Nodes (35): ADOPTION_STALLED_MS, conversationResolved(), projectOutbox(), item(), syncOutbox(), sameOwnerSteps(), settledSlackReadback(), slackRequestSettled() (+27 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.11
Nodes (32): HandlerRules, CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence() (+24 more)

### Community 43 - "owned-artifact.ts"
Cohesion: 0.24
Nodes (13): investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_SOURCE_PATHS, officeSource(), done(), readBoundedNoFollow() (+5 more)

### Community 44 - "ref_node_crypto"
Cohesion: 0.07
Nodes (64): commandFeature(), reviewQuestions(), featureItemComplete(), reconcileFeatureCompletion(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS, reserveReplacement() (+56 more)

### Community 45 - "harness-baseline.ts"
Cohesion: 0.15
Nodes (23): BaselineReport, baselineReport(), BaselineSource, baselineText(), millions(), row(), share(), add() (+15 more)

### Community 46 - "OfficeScene.tsx"
Cohesion: 0.17
Nodes (32): Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk(), ElevatorStage() (+24 more)

### Community 47 - "brain-maintenance.ts"
Cohesion: 0.15
Nodes (18): maintenancePolicies(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, brainResultStop(), GateMark, gateMark(), MAX_START_RETRIES (+10 more)

### Community 48 - "api-routes.ts"
Cohesion: 0.15
Nodes (20): implementationPreview(), implementationContinuationRoute(), qaPlanRetryRoute(), goalHistory(), apiRoute(), RequestContext, ServiceContext, preferencesRoute() (+12 more)

### Community 49 - "pilot-delivery.ts"
Cohesion: 0.07
Nodes (62): candidateBranchMoved(), applyChangeScope(), endChangeScope(), levels(), MAX_CHECKS, owedUnderScope(), scopeBase(), scopeOutgrown() (+54 more)

### Community 50 - "copy.ts"
Cohesion: 0.28
Nodes (13): GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles(), absent() (+5 more)

### Community 51 - "restart-writer.ts"
Cohesion: 0.17
Nodes (19): ATTEMPT_DELAYS_MS, nextAttemptAt(), restartStoppedWriters(), unchangedSinceAccepted(), NOT_RETRYABLE, releaseFunds(), StoppedWriter, stoppedWriter() (+11 more)

### Community 52 - "ref_zod"
Cohesion: 0.07
Nodes (63): escaped(), IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), projectListScope(), AUTO_ADOPT_BOTS, IntakeView (+55 more)

### Community 53 - "ref_node_sqlite"
Cohesion: 0.08
Nodes (28): readSavedState(), LARGE_KEY_CHARS, plain(), RedactedEntries, RedactedEntry, redactEntries(), joinParts(), PartRow (+20 more)

### Community 54 - "jiraBinding"
Cohesion: 0.09
Nodes (26): Assignment, contentSchema(), JiraIssuePublisher, jiraText(), Transition, descriptionPreimage(), plain(), publicationDescription() (+18 more)

### Community 55 - "create-candidate.ts"
Cohesion: 0.31
Nodes (9): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+1 more)

### Community 56 - "FeatureWorkspace.tsx"
Cohesion: 0.11
Nodes (28): FeatureQuestionProjection, OutboxQuestionRound(), send(), FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases (+20 more)

### Community 57 - "controller-runtime.ts"
Cohesion: 0.08
Nodes (33): file, project, root, projectData(), StoreDatabase, ControllerEffects, controllerEffects(), DEPLOY_PROJECT (+25 more)

### Community 58 - "recovery/stopped-base-update.ts"
Cohesion: 0.13
Nodes (28): deliveryAdmission(), assessDeliveryEligibility(), gateRegisteredDelivery(), resolveDeliveryWork(), assertStoppedBaseAudit(), AuditRow, CoverageRow, Hash (+20 more)

### Community 59 - "retrospective-subject.ts"
Cohesion: 0.21
Nodes (13): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, maintenanceKey(), azurePrUrl(), findSubject(), jobSubject() (+5 more)

### Community 60 - "cost-ledger.ts"
Cohesion: 0.18
Nodes (24): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress(), effectId() (+16 more)

### Community 61 - "time-ledger.ts"
Cohesion: 0.18
Nodes (19): publishableEntry(), settlementPending(), superseded(), ticketUnresolved(), timeLedger(), syncing, TimeLedger, dueReadback() (+11 more)

### Community 62 - "coordination.ts"
Cohesion: 0.05
Nodes (46): MergeNotifications, Admission, admit(), IntakeContext, WAIT_STATUSES, SettleInputs, compatible(), dependencyCompletionKey() (+38 more)

### Community 63 - "goal-reviews.ts"
Cohesion: 0.11
Nodes (22): currentCitations(), Fact, NOT_CURRENT, PROVIDER_ERROR, applyGoalReview(), DeliveryJob, EvidenceRefSchema, jobAccepted() (+14 more)

### Community 64 - "judge-resumes.ts"
Cohesion: 0.08
Nodes (40): boundaryCrossed(), Crossing, Progress, CheckpointProgress, checkpointProgress(), names(), nativeProof(), Step (+32 more)

### Community 65 - "validate_pr_body.cjs"
Cohesion: 0.36
Nodes (8): fs, main(), readableText(), REQUIRED_CHECKS, REQUIRED_SECTIONS, sections(), validatePullRequestBody(), withoutComments()

### Community 66 - "audit-plan-candidates.cjs"
Cohesion: 0.14
Nodes (29): audit(), branchIssueNumbers(), classify(), distinctiveTitleWords(), { execFileSync }, extractPaths(), findPrForMergeSubject(), fmtCommit() (+21 more)

### Community 67 - "telemetry.ts"
Cohesion: 0.10
Nodes (25): CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL, Rates (+17 more)

### Community 68 - "resume-arrivals.ts"
Cohesion: 0.11
Nodes (59): canonical(), assessResumes(), Standing, CheckpointEligibility, checkpointEligibility(), admitCheckpointResume(), forCheckpoint(), admitResume() (+51 more)

### Community 69 - "assignment-poll.ts"
Cohesion: 0.08
Nodes (42): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), Connection, twgConnection(), twgProfile(), admitReadyCards(), confirmedGone() (+34 more)

### Community 70 - "constellation-runtime.ts"
Cohesion: 0.09
Nodes (21): CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point, ConstellationRuntime, createConstellation() (+13 more)

### Community 71 - "setup-stop-cap.ts"
Cohesion: 0.10
Nodes (30): readbackDispatchGuidance(), currentEnvironmentWait(), waitText(), capacityInterruptedRun(), providerSaid(), rerunsInterruptedQA(), officeRefusedQA(), confirmSetupStopCap() (+22 more)

### Community 72 - "session-context-lines.ts"
Cohesion: 0.25
Nodes (11): Bound, ContextFoldPrefix, contextFoldPrefix(), SessionContextCheckpoint, captureSessionContextClone(), sessionContextFile(), ContextReadChanged, sameContextFile() (+3 more)

### Community 73 - "assignments.ts"
Cohesion: 0.07
Nodes (37): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, CommittedBrain (+29 more)

### Community 74 - "session-scope.ts"
Cohesion: 0.20
Nodes (16): claudeScopeParser(), claudeSessionScope(), CLAUDE_TRANSCRIPTS, CODEX_ROLLOUTS, contextReaders(), retainSessionMessage(), SessionConversation, escaped() (+8 more)

### Community 75 - "service-health.ts"
Cohesion: 0.12
Nodes (21): ClaudeLoginRefusal, claudeLoginRefusal(), claudeRefusalWords(), RECORDED_REFUSALS, refusedClaudeRow(), listenerHealth(), providers, ProviderStatusChecks (+13 more)

### Community 76 - "azure.ts"
Cohesion: 0.12
Nodes (29): az(), AzureMonitor, buildUrl(), correlatedBuild(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+21 more)

### Community 77 - "it-report.ts"
Cohesion: 0.31
Nodes (9): assignmentDiagnostics(), diagnosticContext(), followUpPicture(), publishITReport(), archiveOldReports(), itAgent(), itDiagnostics(), followUpStatus() (+1 more)

### Community 78 - "redactEvidence"
Cohesion: 0.09
Nodes (40): attributedRecords(), foldsItsRun(), groupCandidates(), incidentId(), FailedMailCheck, lastFailedMailCheck(), lastMailCheckOutcome(), MailCheckOutcome (+32 more)

### Community 79 - "cec.ts"
Cohesion: 0.08
Nodes (39): movedHeadNote(), cecPrompt(), resolvedDecisionNote(), stageInstructionsFor(), REVIEW_FINDINGS_RULE, latestQA(), notPassedInLatestQA(), QACoverage (+31 more)

### Community 80 - "session-bridge.ts"
Cohesion: 0.13
Nodes (22): codexDaemonProcesses(), accountCodexProcesses(), CodexProcessInventory, codexProcessInventory(), DesktopSessions, unaccountedProcesses(), codexThreadMetadata(), METADATA_CHUNK (+14 more)

### Community 81 - "service-ticks.ts"
Cohesion: 0.08
Nodes (45): sourceVersions(), CompareMemory, compareMemory(), COMPARES_PER_PASS, comparison(), DeployedFixes, DeployedFixesInput, recordDeployedFixes() (+37 more)

### Community 82 - "Offices"
Cohesion: 0.15
Nodes (3): QuestionNotifications, Offices, SessionBridge

### Community 83 - "dependency-bots/adopt.ts"
Cohesion: 0.07
Nodes (57): readBackOrThrow(), adoptDependabot(), AlertIssue, alertIssueBody(), alertIssueTitle(), alertMarker(), closeAlertIssue(), ensureAlertIssue() (+49 more)

### Community 84 - "viewer.js"
Cohesion: 0.19
Nodes (25): addMetaLink(), addMetaRow(), addRelationship(), applyView(), buildIndexes(), buildLegend(), buildModel(), buildRenderer() (+17 more)

### Community 85 - "github-readiness.ts"
Cohesion: 0.06
Nodes (67): queueMergeNotice(), observeGitHubMergeNotices(), APPROACH_GUIDANCE, nextJobStage(), reviewInstructions(), deliveryTask(), DeliveryTaskInput, observe() (+59 more)

### Community 86 - "incidents.ts"
Cohesion: 0.06
Nodes (75): capabilityBlockedReviews(), latestReviews(), boundedEvidence(), ObservedIncident, ObservedSubject, expectedWait(), StopFacts, digest() (+67 more)

### Community 87 - ".emit"
Cohesion: 0.06
Nodes (48): channelNoticeAuthorized(), assertConversationReadback(), Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+40 more)

### Community 88 - "Outbox.tsx"
Cohesion: 0.05
Nodes (66): knowledgeOutbox(), ChatMarkdown(), Conversation(), SendMessage, LessonDecisionAction, lessonDecisionState(), readLessonDecision(), DAYS (+58 more)

### Community 89 - "process.ts"
Cohesion: 0.15
Nodes (19): inactivityWatch(), At, Errno, errno(), GroupInventory, GroupProbe, LifecycleDiagnostic, Phase (+11 more)

### Community 90 - "github-workflows.ts"
Cohesion: 0.13
Nodes (24): Azure, azurePipelines(), outcome(), Read, RUNS_PER_PIPELINE, Api, githubWorkflows(), outcome() (+16 more)

### Community 91 - "Ticket"
Cohesion: 0.09
Nodes (37): carriedNotRepeated(), changeScopeNote(), Scoped, CommentPage, commentReadback(), devUpdate(), HEADLINE, JiraOperations (+29 more)

### Community 92 - "session-context-file.ts"
Cohesion: 0.12
Nodes (19): claudeSessionContext(), readTranscript, codexSessionContext(), readRollout, packContextFailure(), PackedContextFailure, ContextThread, contextThread() (+11 more)

### Community 93 - "plans.cjs"
Cohesion: 0.14
Nodes (24): remoteSlug(), substantive(), walk(), association(), auditedDigests(), candidate(), cleanCursor(), collapseByTitle() (+16 more)

### Community 94 - "report.ts"
Cohesion: 0.24
Nodes (14): telemetryRoute(), Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked() (+6 more)

### Community 96 - "index.tsx"
Cohesion: 0.12
Nodes (41): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView() (+33 more)

### Community 97 - "owner-merged-stopped.ts"
Cohesion: 0.15
Nodes (19): DependencyStores, mergedByOwner(), closeableIssue(), effectsSettled(), eligible(), officePublished(), ownerMerged(), settle() (+11 more)

### Community 98 - ".save"
Cohesion: 0.11
Nodes (50): resolveBlockedTransition(), document(), transitionWithComment(), jiraAccount(), jiraCollection(), JiraCredential, jiraCredential(), KEYCHAIN_SERVICE (+42 more)

### Community 99 - "archive-plan.cjs"
Cohesion: 0.17
Nodes (22): fs, main(), parse(), path, archive(), cell(), ensureIndex(), fromArgs() (+14 more)

### Community 100 - "Effects"
Cohesion: 0.09
Nodes (26): HarnessEffect, NOT_LANDED_SETTLE_MS, settleNotLanded(), interruptAdoptions(), Execute, legacy(), REMOVED_FIELDS, retireLegacyRecovery() (+18 more)

### Community 101 - "continue-ownership-read.ts"
Cohesion: 0.24
Nodes (13): continueOwnershipRead(), expiredOwnershipRead(), ownershipReadGate(), ownershipReadState(), ownershipReadHistory(), ownershipReadSource(), ReadOwnershipCandidate, readOwnershipCandidate() (+5 more)

### Community 102 - "continue-unsealed-qa.ts"
Cohesion: 0.27
Nodes (8): continueUnsealedQA(), entry(), handoffOwnership(), ReadbackOwnerDecision, qaPlanEvidenceGap(), qaRunDirectory(), itChatPrompt(), send()

### Community 103 - "on-merge-sync.cjs"
Cohesion: 0.19
Nodes (22): fieldSpan(), keyPattern(), list(), parseListLiteral(), quote(), render(), scalar(), splitFrontmatter() (+14 more)

### Community 104 - "backup-stores.ts"
Cohesion: 0.09
Nodes (38): absentAdmission(), AdmissionComparison, AdmissionSnapshot, compareAdmissions(), snapshotAdmissions(), BackupEntry, BackupInput, BackupInventory (+30 more)

### Community 105 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 106 - "service-plist.ts"
Cohesion: 0.09
Nodes (40): runningRevision(), runningRevision(), DATA, ROOT, runtimeRevision(), ActiveRelease, readActiveRelease(), BUILD_ENV (+32 more)

### Community 107 - "work.ts"
Cohesion: 0.10
Nodes (26): DeliveryAuthorityInput, effectiveCause(), REPLACED, ITContext, BLOCKED_CAUSES, blockedCauses(), NONE, projectReadiness() (+18 more)

### Community 108 - "engine.ts"
Cohesion: 0.21
Nodes (13): enumerateIntakeList(), inPickupOrder(), Intake, text(), checkMail(), drainMail(), requestMail(), enableNightly() (+5 more)

### Community 109 - "release-unpark.ts"
Cohesion: 0.33
Nodes (8): due(), MAX_RELEASE_UNPARKS, RELEASE_CHECK_MS, returnToPickup(), unparkReleasedWaits(), compare(), highestStableAtLeast(), parts()

### Community 110 - "blocker-followups.ts"
Cohesion: 0.12
Nodes (46): conversationReadbackReady(), followupOf(), pendingReadback(), queueConversationReadback(), readbackEnding(), uncertainConversations(), readBackConversations(), followupRecord() (+38 more)

### Community 111 - "notifications.ts"
Cohesion: 0.14
Nodes (18): ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR, plainSlackText() (+10 more)

### Community 112 - "fact-bounds.ts"
Cohesion: 0.11
Nodes (27): GitHubMonitor, githubPRDescription(), collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip() (+19 more)

### Community 113 - "deploy-plan.ts"
Cohesion: 0.26
Nodes (16): Body, DeploymentFenceState, fenceTokenDigest(), operationPaths(), planDeployment(), createDeployToken(), readDeployToken(), removeDeployToken() (+8 more)

### Community 114 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 115 - "sign-in-unpark.ts"
Cohesion: 0.18
Nodes (19): hasPendingDelivery(), resumeAfterSignIn(), signInWait(), MAX_SIGN_IN_UNPARKS, unparkSignedIn(), waitingStep(), BrowserPage, browserPages() (+11 more)

### Community 119 - "inspect-closed-plan.ts"
Cohesion: 0.16
Nodes (15): assertOwnership(), OwnershipRead, closedReadonlyPlan(), Document, document(), consumeQAPlanRetry(), entryExists(), inspectClosedQAPlan() (+7 more)

### Community 120 - "lesson-selection.ts"
Cohesion: 0.15
Nodes (19): INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), MAINTENANCE, MAX_LESSONS, normalPath() (+11 more)

### Community 121 - "follow-production.ts"
Cohesion: 0.20
Nodes (17): awaitingJiraStatus(), awaitingProduction(), FOLLOW_DAYS, followed(), isFollowed(), Azure, AzureRead, containedIn() (+9 more)

### Community 122 - "session-coverage.ts"
Cohesion: 0.36
Nodes (7): claudeSessions(), completeSessionCoverage(), desktopCoverageGap(), knownActivity(), Report, unexplained(), sessionInventoryFailureDetail()

### Community 123 - "admit-repair-waits.ts"
Cohesion: 0.11
Nodes (26): clip(), clipLapse(), evidencePacket(), ordered(), PACKET_BYTES, PACKET_EVENTS, PACKET_RECORDS, PACKET_SUBJECTS (+18 more)

### Community 124 - "refresh-issue-state.cjs"
Cohesion: 0.20
Nodes (19): advanceFence(), closingIssues(), githubRefs(), key(), normalizeGithubQuery(), normalizeRepository(), parseGithubQuery(), ref() (+11 more)

### Community 125 - "knowledge.ts"
Cohesion: 0.05
Nodes (43): args, [cmd,...rawArgs], commands, key, projectIndex, curateLesson(), Curation, CurationAction (+35 more)

### Community 126 - "run.ts"
Cohesion: 0.20
Nodes (14): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, OFFICE_FIX_PROMPT, OfficeFixResult, validateOfficeFix(), investigationReady(), requeueInvestigationEvidence(), InvestigationOptions (+6 more)

### Community 127 - "DeploymentFence"
Cohesion: 0.18
Nodes (10): assertToken(), DeploymentFence, declaredWithin(), deploymentFenceGate(), DeploymentFenceGateContext, STOPPING_COMMANDS, stoppingCommand(), Action (+2 more)

### Community 128 - "node-visuals.ts"
Cohesion: 0.20
Nodes (14): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+6 more)

### Community 129 - "ref_node_child_process"
Cohesion: 0.15
Nodes (7): file, folder, logs, root, { execFileSync }, maintenanceBodies, { readFileSync }

### Community 130 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 131 - "it-specialist.ts"
Cohesion: 0.24
Nodes (11): replacedReadback(), heldFor(), recoveryHeld(), recoveryWait(), informationalRecovery(), ITSpecialist, ownAzureCheck(), delays (+3 more)

### Community 132 - "run-accounting.ts"
Cohesion: 0.07
Nodes (45): BoundedRead, comparable(), EvidenceOutcome, recordRunEvidence(), backfillClaudeCost(), CompletionReader, add(), CodexRequest (+37 more)

### Community 133 - "intent.ts"
Cohesion: 0.17
Nodes (11): ContinuationIO, nativeIO, decideImplementation(), ImplementationDecision, interruptedImplementation(), assertCandidateIdle(), Read, ImplementationContinuation (+3 more)

### Community 134 - "resume-control.ts"
Cohesion: 0.24
Nodes (9): ResumeArrivalsInput, absent(), NEVER_ENABLED, ResumeControl, stated(), Stored, unreadable(), IncidentsRouteContext (+1 more)

### Community 135 - "checkpoint-completion.ts"
Cohesion: 0.18
Nodes (12): BrainStatusSchema, identity, brainCheckpointCompletion(), coverageSchema, verified, PublishedPR, publishedWorkCleanedUp(), nativeChecks (+4 more)

### Community 136 - "evidence-artifacts.ts"
Cohesion: 0.29
Nodes (12): readEvidence(), ProviderEvidence, canonical(), evidenceDigest(), evidenceHash(), semantic(), stableUrl(), requestReplan() (+4 more)

### Community 137 - "GitHubIssuePublisher"
Cohesion: 0.31
Nodes (3): GitHubIssuePublisher, number(), same()

### Community 138 - "lesson-issue-ready.ts"
Cohesion: 0.26
Nodes (13): assignedToJoe(), fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), firstLane(), instruction(), LaneMove, move() (+5 more)

### Community 139 - "store.ts"
Cohesion: 0.06
Nodes (41): diagnosticSnapshot(), nativeDeliveryResolved(), improvementIntakeGate(), leadershipContext(), captureLearning(), learningDigest(), recordLearningOpportunity(), baselined() (+33 more)

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
Cohesion: 0.19
Nodes (9): PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS, OfficePreferences (+1 more)

### Community 146 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (7): CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility, overlayEntranceDelays(), SceneOverlay()

### Community 147 - "dates.cjs"
Cohesion: 0.31
Nodes (12): today(), dateFromPlanBasename(), dateFromSessionPath(), evidenceDates(), fileMtimeDate(), fs, gitCommitDate(), inferPlanDate() (+4 more)

### Community 148 - "pre-push-boundary.ts"
Cohesion: 0.26
Nodes (10): Event, exactCommand(), Invocation, localHookCommand(), one(), prePushRejection(), PushIdentity, retirementBoundary() (+2 more)

### Community 149 - "recovery-ledger.ts"
Cohesion: 0.31
Nodes (9): savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), reconcileRecoveryLedger(), commands(), SIGN_IN_SERVICE_TROUBLE, signInSteps() (+1 more)

### Community 150 - "serve-graph.cjs"
Cohesion: 0.24
Nodes (9): createServer(), fs, http, listen(), attempt(), main(), path, resolveRequest() (+1 more)

### Community 151 - "history-archive.ts"
Cohesion: 0.36
Nodes (7): RETAINED_REPORTS, archiveByMonth(), archiveHistory(), archiveMonth(), archiveOldTaskDetail(), TASK_DETAIL_DAYS, ITReport

### Community 152 - "ITFollowUp"
Cohesion: 0.48
Nodes (5): OwnerStepItem, ownerStepItems(), signIn(), OwnerSteps, ITFollowUp

### Community 153 - "incident-command.ts"
Cohesion: 0.38
Nodes (6): FLAGS, incidentCommand(), IncidentCommandIO, option(), USAGE, whole()

### Community 154 - "context-failure-transport.ts"
Cohesion: 0.48
Nodes (3): unpackContextFailure(), ContextReadPhase, SessionContextDeadline

### Community 155 - "CommandFailure"
Cohesion: 0.43
Nodes (4): exitFailure(), CommandFailure, MONTHS, providerLimit()

### Community 158 - "office-qa-handoff.ts"
Cohesion: 0.60
Nodes (4): OfficeQAHandoff, OfficeQAHandoffInput, OfficeQAHandoffRequest, QAOwnershipProof

## Knowledge Gaps
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `GitHubDelivery`, `features/workflow.ts`, `holdReason`, `http/commands.ts`, `continue-access-only-plan.ts`, `admit-improvement.ts`, `demand-facts.ts`, `scheduled-captures.ts`, `OfficeSnapshot`, `record-trigger.ts`, `command`, `ref_node_path`, `artifact`, `harnessEffect`, `weekly-rollup.ts`, `jira-time.ts`, `accessibility-sources.ts`, `worker-runtime.ts`, `agents.ts`, `shared.ts`, `digest`, `accept-stage-result.ts`, `remove-candidate.ts`, `ledger.ts`, `scheduled-work.ts`, `enrollment-gate.ts`, `run-retrospective.ts`, `outbox.ts`, `time-scope.ts`, `Engine`, `owned-artifact.ts`, `ref_node_crypto`, `brain-maintenance.ts`, `api-routes.ts`, `pilot-delivery.ts`, `copy.ts`, `restart-writer.ts`, `ref_node_sqlite`, `jiraBinding`, `create-candidate.ts`, `controller-runtime.ts`, `recovery/stopped-base-update.ts`, `retrospective-subject.ts`, `cost-ledger.ts`, `time-ledger.ts`, `coordination.ts`, `goal-reviews.ts`, `judge-resumes.ts`, `resume-arrivals.ts`, `assignment-poll.ts`, `setup-stop-cap.ts`, `assignments.ts`, `azure.ts`, `it-report.ts`, `redactEvidence`, `cec.ts`, `session-bridge.ts`, `service-ticks.ts`, `Offices`, `dependency-bots/adopt.ts`, `github-readiness.ts`, `.emit`, `github-workflows.ts`, `Ticket`, `report.ts`, `owner-merged-stopped.ts`, `.save`, `Effects`, `continue-ownership-read.ts`, `continue-unsealed-qa.ts`, `work.ts`, `engine.ts`, `release-unpark.ts`, `blocker-followups.ts`, `notifications.ts`, `fact-bounds.ts`, `sign-in-unpark.ts`, `inspect-closed-plan.ts`, `lesson-selection.ts`, `follow-production.ts`, `admit-repair-waits.ts`, `run.ts`, `run-accounting.ts`, `intent.ts`, `checkpoint-completion.ts`, `evidence-artifacts.ts`, `GitHubIssuePublisher`, `lesson-issue-ready.ts`, `store.ts`, `ProjectProgress`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `command()` (e.g. with `startServiceTicks()` and `realMachine()`) actually correct?**
  _`command()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Should `incidents/routes.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08244897959183674 - nodes in this community are weakly interconnected._
- **Why does `command()` connect `command` to `incidents/routes.ts`, `GitHubDelivery`, `features/workflow.ts`, `command-registry.ts`, `holdReason`, `resume-control.ts`, `checkpoint-completion.ts`, `GitHubIssuePublisher`, `continue-access-only-plan.ts`, `Store`, `lesson-issue-ready.ts`, `admit-improvement.ts`, `artifact`, `harnessEffect`, `weekly-rollup.ts`, `jira-time.ts`, `accessibility-sources.ts`, `worker-runtime.ts`, `agents.ts`, `ProjectProgress`, `shared.ts`, `digest`, `accept-stage-result.ts`, `CommandFailure`, `remove-candidate.ts`, `Engine`, `brain-maintenance.ts`, `pilot-delivery.ts`, `copy.ts`, `restart-writer.ts`, `jiraBinding`, `create-candidate.ts`, `controller-runtime.ts`, `cost-ledger.ts`, `time-ledger.ts`, `coordination.ts`, `assignment-poll.ts`, `assignments.ts`, `service-health.ts`, `azure.ts`, `session-bridge.ts`, `service-ticks.ts`, `Offices`, `github-readiness.ts`, `process.ts`, `Ticket`, `.save`, `Effects`, `continue-ownership-read.ts`, `continue-unsealed-qa.ts`, `service-plist.ts`, `engine.ts`, `notifications.ts`, `fact-bounds.ts`, `inspect-closed-plan.ts`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Should `OrgChart.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10204081632653061 - nodes in this community are weakly interconnected._
- **Why does `OfficeSnapshot` connect `OfficeSnapshot` to `OrgChart.tsx`, `it-specialist.ts`, `Inspector.tsx`, `holdReason`, `Button`, `TimeBook.tsx`, `store.ts`, `Store`, `App.tsx`, `scene-motion.ts`, `record-trigger.ts`, `history-archive.ts`, `accessibility-sources.ts`, `shared.ts`, `ServiceHealthPanel.tsx`, `ledger.ts`, `enrollment-gate.ts`, `outbox.ts`, `harness-baseline.ts`, `OfficeScene.tsx`, `api-routes.ts`, `restart-writer.ts`, `ref_zod`, `ref_node_sqlite`, `FeatureWorkspace.tsx`, `judge-resumes.ts`, `resume-arrivals.ts`, `assignment-poll.ts`, `service-health.ts`, `azure.ts`, `it-report.ts`, `redactEvidence`, `incidents.ts`, `.emit`, `Outbox.tsx`, `index.tsx`, `Effects`, `work.ts`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Should `GitHubDelivery` be split into smaller, more focused modules?**
  _Cohesion score 0.06816479400749063 - nodes in this community are weakly interconnected._