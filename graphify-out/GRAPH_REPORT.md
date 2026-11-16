# Graph Report - the-office  (2026-11-15)

## Corpus Check
- 825 files · ~325,785 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4038 nodes · 18630 edges · 118 communities (116 shown, 2 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 604 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2915ad64`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- OfficeSnapshot
- requests.ts
- dependency-bots/adopt.ts
- read-retries.ts
- Inspector.tsx
- delivery-repairs.ts
- session-bridge.ts
- MapView.tsx
- agents.ts
- review-run.ts
- workKey
- shared.ts
- App.tsx
- ref_node_crypto
- assignments.ts
- enrollment-gate.ts
- run-retrospective.ts
- record-trigger.ts
- api-routes.ts
- ref_node_path
- features/commands.ts
- cec.ts
- PeoplePanel.tsx
- .transaction
- knowledge.ts
- maintenance/maintenance.ts
- cost-ledger.ts
- accept-stage-result.ts
- dependencies.ts
- jira-time.ts
- digest
- index.tsx
- conversations/conversations.ts
- lesson-selection.ts
- sanitize
- goal-reporting.ts
- scheduled-work.ts
- telemetry.ts
- closeout-recovery.ts
- run-accounting.ts
- assignment-poll.ts
- time-scope.ts
- CommittedBrain
- .save
- scope-repair-resume.ts
- Coordinator
- OfficeScene.tsx
- Store
- engine.ts
- demand-facts.ts
- .emit
- harness-baseline.ts
- session-context-file.ts
- cec/workflow.ts
- work.ts
- weekly-rollup.ts
- github-delivery.ts
- TimeBook.tsx
- continue-unsealed-qa.ts
- scheduler.ts
- retrospective-subject.ts
- run.ts
- stopped-base-validation.ts
- remove-candidate.ts
- ticket-evidence.ts
- fact-bounds.ts
- features.ts
- control-store.ts
- config.ts
- coordination.ts
- constellation-runtime.ts
- contract.ts
- Offices
- report.ts
- index.ts
- admit-improvement.ts
- claude-session-context.ts
- TicketJob
- JiraIssuePublisher
- offices.ts
- .now
- scene-motion.ts
- node-visuals.ts
- preferences-store.ts
- outbox.ts
- ledger.ts
- local-config.ts
- daily-cto.ts
- unblock-brief.ts
- evidence-digest.ts
- coordination-tick.ts
- RoomCamera.tsx
- blocker-followups.ts
- it-specialist.ts
- createConstellation
- capture-session-clone.py
- delivery-ownership.ts
- Outbox.tsx
- store.ts
- scheduled-features.ts
- cost-entries.ts
- service-health.ts
- run-evidence.ts
- work-summary.ts
- install-service.mjs
- extract-worker.mjs
- useOfficePreferences.ts
- create-candidate.ts
- cli.ts
- extraction.ts
- session-scope.ts
- command-registry.ts
- ScheduledWork
- codex-rollout.ts
- retire-history.ts
- merge-summary.ts
- office/readiness.ts
- office-qa-handoff.ts

## God Nodes (most connected - your core abstractions)
1. `Store` - 365 edges
2. `TicketJob` - 166 edges
3. `digest()` - 150 edges
4. `command()` - 115 edges
5. `GitHubDelivery` - 114 edges
6. `artifact()` - 114 edges
7. `workKey()` - 95 edges
8. `OfficeSnapshot` - 88 edges
9. `cx()` - 88 edges
10. `currentAssignment()` - 86 edges

## Surprising Connections (you probably didn't know these)
- `apply()` --indirect_call--> `note()`  [INFERRED]
  src/conversations/OutboxSavedImplementation.tsx → server/cec/parking/resume-parked.ts
- `LessonBrainOverlap` --references--> `Lesson`  [EXTRACTED]
  server/knowledge/lesson-brain-audit.ts → src/contracts/knowledge.ts
- `projectOutbox()` --calls--> `deferredPickup()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/pickup-state.ts
- `projectOutbox()` --calls--> `parkedProviderWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts
- `projectOutbox()` --calls--> `readinessNeedsFollowup()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts

## Import Cycles
- 3-file cycle: `server/delivery/parking/resume-provider-review.ts -> server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/parking/resume-provider-review.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts`
- 4-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 4-file cycle: `server/delivery/recovery/implementation/activation-recovery.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/implementation/activation-recovery.ts`
- 4-file cycle: `server/delivery/recovery/implementation/saved-prerequisite-handoff.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/implementation/saved-prerequisite-handoff.ts`
- 4-file cycle: `server/delivery/recovery/stopped-base-review.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/stopped-base-review.ts`
- 4-file cycle: `server/delivery/recovery/validation/validation-readback.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/validation/validation-readback.ts`
- 4-file cycle: `server/features/delivery-binding.ts -> server/features/enrollment-gate.ts -> server/features/progression/failure.ts -> server/store/effects.ts -> server/features/delivery-binding.ts`
- 5-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/stage-reconciliation.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 5-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 5-file cycle: `server/delivery/recovery/implementation/continuation-evidence.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/recovery/implementation/continuation-evidence.ts`
- 5-file cycle: `server/delivery/recovery/implementation/saved-prerequisite-handoff.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/recovery/implementation/saved-prerequisite-handoff.ts`
- 5-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/scope-repair/scope-repair-resume.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 5-file cycle: `server/delivery/recovery/scope-repair/scope-repair-readback.ts -> server/delivery/recovery/scope-repair/scope-repair-resume.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/scope-repair/scope-repair-readback.ts`
- 5-file cycle: `server/delivery/recovery/implementation/continuation-evidence.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/implementation/implementation-recovery.ts -> server/delivery/recovery/implementation/continuation-evidence.ts`
- 5-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/closeout/github-closeout.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 5-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/implementation/activation-recovery.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 5-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/implementation/saved-prerequisite-handoff.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`

## Communities (118 total, 2 thin omitted)

### Community 0 - "OfficeSnapshot"
Cohesion: 0.08
Nodes (41): OutboxSavedImplementation(), apply(), review(), OutboxSavedPlan(), reconcile(), FeatureDelivery(), FeatureDocuments(), views (+33 more)

### Community 1 - "requests.ts"
Cohesion: 0.08
Nodes (53): deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, deliveryIntakeBlocker(), gateRegisteredDelivery(), accounting, DeliverySubject (+45 more)

### Community 2 - "dependency-bots/adopt.ts"
Cohesion: 0.06
Nodes (75): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard, projectCards() (+67 more)

### Community 3 - "read-retries.ts"
Cohesion: 0.29
Nodes (9): PrerequisitesSchema, SourceClosed, classifyStop(), stopReason(), incompleteReadOutput(), planReadRetry(), temporaryReadFailure(), StopKind (+1 more)

### Community 4 - "Inspector.tsx"
Cohesion: 0.10
Nodes (69): Outbox(), blockedSummary(), currentServices(), ServiceHealthPanel(), followUp(), labels, ServiceHealthRow(), BlockerFollowups() (+61 more)

### Community 5 - "delivery-repairs.ts"
Cohesion: 0.12
Nodes (34): Execute, installDependencies(), major(), removeAdoptedClone(), namedRepairIds(), pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), stoppedBaseCheckout() (+26 more)

### Community 6 - "session-bridge.ts"
Cohesion: 0.13
Nodes (23): ref_ws, claudeSessionContext(), codexDaemonProcesses(), accountCodexProcesses(), codexProcessInventory, DesktopSessions, unaccountedProcesses(), codexSessionContext() (+15 more)

### Community 7 - "MapView.tsx"
Cohesion: 0.06
Nodes (67): ref_react_markdown, ref_remark_gfm, ref_yaml, KnowledgeActivity, KnowledgeActivityPage, KnowledgeEdge, KnowledgeMap, KnowledgeNode (+59 more)

### Community 8 - "agents.ts"
Cohesion: 0.04
Nodes (88): ref_smol_toml, IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), intakeMembership(), projectListScope(), withCECPreflightPRs() (+80 more)

### Community 9 - "review-run.ts"
Cohesion: 0.11
Nodes (34): featureItemComplete(), reconcileFeatureCompletion(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS, requestReplan(), reserveReplacement(), stageBudget() (+26 more)

### Community 10 - "workKey"
Cohesion: 0.18
Nodes (17): completedPRReviews(), Assessment, diagnosticProof(), discoveryRecoveryCandidate(), ownedArtifact(), Ownership, rawHash(), recoverDiscovery() (+9 more)

### Community 11 - "shared.ts"
Cohesion: 0.07
Nodes (25): ctoInputIdentityMatches(), ctoInputRecovered(), OfficeQAReport, QAPlanContinuation, QAPlanRetry, QAPlanRetryProof, QAPlanRetryRequest, SlackReplacementRequest (+17 more)

### Community 12 - "App.tsx"
Cohesion: 0.06
Nodes (52): ref_lucide_react, ref_motion, ref_react_dom, itAgent(), itDiagnostics(), BrainDrawer(), themeColor, App() (+44 more)

### Community 13 - "ref_node_crypto"
Cohesion: 0.07
Nodes (52): ref_node_crypto, packedConsumerPnpmRepair(), sha256(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), artifactPath(), digest() (+44 more)

### Community 14 - "assignments.ts"
Cohesion: 0.09
Nodes (34): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, GraphNode (+26 more)

### Community 15 - "enrollment-gate.ts"
Cohesion: 0.14
Nodes (47): requestDelivery(), createFeature(), assertEnrollable(), bindFeature(), enrolled(), predecessorComplete(), assessmentSignal(), AssessmentSignals (+39 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.09
Nodes (42): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, blockingTrigger, brainOverlap, brainOverlapQuery() (+34 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.10
Nodes (43): isBlocking(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences(), busyMaintenanceIds(), clip(), maintenanceBlockedId() (+35 more)

### Community 18 - "api-routes.ts"
Cohesion: 0.17
Nodes (18): implementationPreview(), implementationContinuationRoute(), qaPlanRetryRoute(), Link, linkFeature(), featureRoute(), goalHistory(), apiRoute() (+10 more)

### Community 19 - "ref_node_path"
Cohesion: 0.06
Nodes (85): ref_node_fs, ref_node_os, ref_node_path, ref_node_util, ownershipReadHistory(), Candidate, adoptCandidate(), reported (+77 more)

### Community 20 - "features/commands.ts"
Cohesion: 0.21
Nodes (19): commandFeature(), mutation(), reviewQuestions(), automaticIntakeWait(), FeatureError, assertQuestionVisibility(), applyHarnessAction(), HarnessActionInput (+11 more)

### Community 21 - "cec.ts"
Cohesion: 0.09
Nodes (30): implementationWorkerContext(), cecPrompt(), resolvedDecisionNote(), stageInstructions, closedReadonlyPlan(), Document, entryExists(), inspectClosedQAPlan() (+22 more)

### Community 22 - "PeoplePanel.tsx"
Cohesion: 0.09
Nodes (42): label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+34 more)

### Community 23 - ".transaction"
Cohesion: 0.13
Nodes (15): approveFeature(), featureById(), discoveryPrompt(), planPrompt(), GitHubFeaturePublisher, FeaturePublisher, publishFeature(), beginReader() (+7 more)

### Community 24 - "knowledge.ts"
Cohesion: 0.08
Nodes (29): BRAIN_SCOPE, SUBJECT, Kind, RetrospectiveResult, RetrospectiveResultSchema, RollupResultSchema, Stage, ImprovementGrant (+21 more)

### Community 25 - "maintenance/maintenance.ts"
Cohesion: 0.07
Nodes (34): maintenancePolicies(), captureMaintenanceStep(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, BrainStatusSchema, identity, coverageSchema (+26 more)

### Community 26 - "cost-ledger.ts"
Cohesion: 0.15
Nodes (20): server_telemetry_cost_entries_costcoveragesummary, COST_FIELD, COST_OPERATION, effectId(), OutsideEdit, publishCost(), publishing, boardItem() (+12 more)

### Community 27 - "accept-stage-result.ts"
Cohesion: 0.05
Nodes (106): park(), acceptStageResult(), recordJobApproach(), assertDraftClaimHistory(), linkDraftIssue(), protectedOriginalClaim(), METADATA_FINDING, publicationReadArgs() (+98 more)

### Community 28 - "dependencies.ts"
Cohesion: 0.17
Nodes (20): Admission, admit(), IntakeContext, WAIT_STATUSES, compatible(), dependencyCompletionKey(), dependencyEligibility(), DependencyStores (+12 more)

### Community 29 - "jira-time.ts"
Cohesion: 0.14
Nodes (20): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+12 more)

### Community 30 - "digest"
Cohesion: 0.13
Nodes (46): retryRead(), admitPRMetadata(), assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema, savedMetadataAssessment(), validateSaved() (+38 more)

### Community 31 - "index.tsx"
Cohesion: 0.14
Nodes (38): ref_react, SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState (+30 more)

### Community 32 - "conversations/conversations.ts"
Cohesion: 0.09
Nodes (18): ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff(), saveGoals() (+10 more)

### Community 33 - "lesson-selection.ts"
Cohesion: 0.09
Nodes (29): INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, LessonSelection, lessonText(), MAINTENANCE, MAX_LESSONS (+21 more)

### Community 34 - "sanitize"
Cohesion: 0.13
Nodes (25): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+17 more)

### Community 35 - "goal-reporting.ts"
Cohesion: 0.15
Nodes (21): assertConversationReadback(), finishSupersededReadback(), pump(), savePickup(), githubPRDescription(), harperHandoff(), azureGoalFacts(), boundedEvidence() (+13 more)

### Community 36 - "scheduled-work.ts"
Cohesion: 0.10
Nodes (37): freshOwnershipRead(), deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), withAmendmentOwnership(), metadataRequestResolved(), preparationRequestResolved(), gateFeatureWork() (+29 more)

### Community 37 - "telemetry.ts"
Cohesion: 0.09
Nodes (28): CodexRollout, CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL (+20 more)

### Community 38 - "closeout-recovery.ts"
Cohesion: 0.09
Nodes (52): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+44 more)

### Community 39 - "run-accounting.ts"
Cohesion: 0.13
Nodes (31): BoundedRead, done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf(), backfillClaudeCost(), CompletionReader (+23 more)

### Community 40 - "assignment-poll.ts"
Cohesion: 0.16
Nodes (14): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), admitReadyCards(), pinCourier (+6 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.16
Nodes (25): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), midnight(), TicketDay (+17 more)

### Community 43 - ".save"
Cohesion: 0.19
Nodes (29): jiraCollection(), BLOCKED, findComment(), LiveIssue, readIssue(), readIssues(), Execute, jira() (+21 more)

### Community 44 - "scope-repair-resume.ts"
Cohesion: 0.32
Nodes (13): containedFile(), Ownership, reconcileScopeRepairReadback(), scopeRepairRequestResolved(), assertScopeRepairResumeFindings(), certain(), effects(), originalClaim() (+5 more)

### Community 46 - "OfficeScene.tsx"
Cohesion: 0.17
Nodes (33): Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk(), ElevatorStage() (+25 more)

### Community 47 - "Store"
Cohesion: 0.05
Nodes (15): correlatedBuild(), reconcileCloseout(), GITHUB_ISSUE_SKILL, GitHubMonitor, Result, Engine, observe(), observeParked() (+7 more)

### Community 48 - "engine.ts"
Cohesion: 0.11
Nodes (27): candidateBranchMoved(), continueImplementation(), checkMail(), drainMail(), requestMail(), dispatchNightly(), drainDelivery(), enableNightly() (+19 more)

### Community 49 - "demand-facts.ts"
Cohesion: 0.14
Nodes (21): clip(), DEMAND_LIMIT, demandFacts(), DemandSection, key(), LessonKey, notes(), clip() (+13 more)

### Community 50 - ".emit"
Cohesion: 0.14
Nodes (29): decideImplementation(), requestQAPlanRetry(), configureChannelNotices(), configureNotices(), retryRecipientLookup(), recoverCTOInput(), bindDiscoveryResume(), DiscoveryResumeInput (+21 more)

### Community 51 - "harness-baseline.ts"
Cohesion: 0.15
Nodes (20): baselineReport, BaselineSource, baselineText(), millions(), row(), share(), add(), BaselineState (+12 more)

### Community 52 - "session-context-file.ts"
Cohesion: 0.22
Nodes (14): ref_node_perf_hooks, contextFoldPrefix, SessionContextCheckpoint, captureSessionContextClone(), ContextReadPhase, SessionContextDeadline, sessionContextFile(), ContextReadChanged (+6 more)

### Community 53 - "cec/workflow.ts"
Cohesion: 0.10
Nodes (38): applyIntakeObservation(), jiraText(), parksInJira(), MISSING_SAVED_PLAN, recoverSavedPlan(), run(), verifiedTransition(), advance() (+30 more)

### Community 54 - "work.ts"
Cohesion: 0.18
Nodes (13): ProjectReadiness, AssignmentResult, BlockedCause, CompletionCondition, DeliveryAdmission, DependencyObservation, EligibilityState, FailureCategory (+5 more)

### Community 55 - "weekly-rollup.ts"
Cohesion: 0.14
Nodes (26): learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), retire(), RollupResult, harperFolder() (+18 more)

### Community 56 - "github-delivery.ts"
Cohesion: 0.05
Nodes (102): findingsBlock(), requireDeliveryAuthority(), assertDeliveryMayMutate(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery(), BOARD_RULE (+94 more)

### Community 57 - "TimeBook.tsx"
Cohesion: 0.11
Nodes (34): TelemetryReport, AzureBuild, src_shared_liveanchor, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens() (+26 more)

### Community 58 - "continue-unsealed-qa.ts"
Cohesion: 0.08
Nodes (42): GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles(), ContinuationIO (+34 more)

### Community 59 - "scheduler.ts"
Cohesion: 0.22
Nodes (12): ROLES, fifo(), Scheduler, selectWork(), admitsWork(), canDispatch(), deliveryOccupied(), foreignWork() (+4 more)

### Community 60 - "retrospective-subject.ts"
Cohesion: 0.14
Nodes (21): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, maintenanceKey(), azurePrUrl(), findSubject(), jobSubject() (+13 more)

### Community 61 - "run.ts"
Cohesion: 0.13
Nodes (23): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_FIX_PROMPT, OfficeFixResult (+15 more)

### Community 62 - "stopped-base-validation.ts"
Cohesion: 0.47
Nodes (8): continuationNativeReview(), assertStoppedBaseApproach(), stoppedBaseNextStage(), stoppedBasePackedCommands(), assertAcceptedFiles(), assertStoppedBaseMergeReady(), assertStoppedBaseValidation(), stoppedBaseStageProof()

### Community 63 - "remove-candidate.ts"
Cohesion: 0.18
Nodes (18): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot() (+10 more)

### Community 64 - "ticket-evidence.ts"
Cohesion: 0.17
Nodes (21): assetDownloader(), attachmentKind(), evidenceDirectory(), readEvidence(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS (+13 more)

### Community 65 - "fact-bounds.ts"
Cohesion: 0.25
Nodes (15): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+7 more)

### Community 66 - "features.ts"
Cohesion: 0.10
Nodes (36): FeatureAttempt, FeatureHandoff, FeatureHarnessAction, FeatureHarnessOption, FeatureOption, FeaturePhase, FeaturePlanningActivation, FeaturePolicyAuthority (+28 more)

### Community 67 - "control-store.ts"
Cohesion: 0.09
Nodes (16): ref_node_sqlite, DailyCTO, Briefing, saveReviewBriefing(), systemClock, applyConnectionSettings(), closeConnection(), optimizeOnOpen() (+8 more)

### Community 68 - "config.ts"
Cohesion: 0.19
Nodes (14): CommentPage, commentReadback(), Assignment, Content, Transition, JiraOperations, plain(), jiraRecord() (+6 more)

### Community 69 - "coordination.ts"
Cohesion: 0.16
Nodes (18): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation(), checkpointWindow(), dueAt() (+10 more)

### Community 70 - "constellation-runtime.ts"
Cohesion: 0.15
Nodes (17): ref_3d_force_graph, ref_three, CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point (+9 more)

### Community 71 - "contract.ts"
Cohesion: 0.16
Nodes (16): Event, one(), prePushRejection(), PushIdentity, settledPushBoundary(), At, errno, GroupInventory (+8 more)

### Community 72 - "Offices"
Cohesion: 0.23
Nodes (3): officeKnowledgeSnapshot(), Offices, markCaptureStart()

### Community 73 - "report.ts"
Cohesion: 0.24
Nodes (14): TelemetryRow, TelemetrySync, Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount() (+6 more)

### Community 74 - "index.ts"
Cohesion: 0.12
Nodes (20): ref_hono_node_server, ref_node_http, ref_vite, close(), config, itSpecialist, loadedRevision, offices (+12 more)

### Community 75 - "admit-improvement.ts"
Cohesion: 0.23
Nodes (14): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+6 more)

### Community 76 - "claude-session-context.ts"
Cohesion: 0.27
Nodes (7): readTranscript, root, claudeSessionScope(), readRollout, ContextProject, ContextReader, sessionScope

### Community 77 - "TicketJob"
Cohesion: 0.09
Nodes (29): harnessCloseout(), PASSING, verifyMergeActions(), HarnessControl, withHarnessWork(), runHarnessStage(), harnessStageResult(), receipt() (+21 more)

### Community 78 - "JiraIssuePublisher"
Cohesion: 0.24
Nodes (5): JiraIssuePublisher, keyOf(), descriptionPreimage(), plain(), publicationDescription()

### Community 79 - "offices.ts"
Cohesion: 0.18
Nodes (8): QuestionNotifications, leadershipContext(), queueLessonIssueCheck(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), DELIVERY_CONCURRENCY, reconcileStoppingClaims()

### Community 80 - ".now"
Cohesion: 0.17
Nodes (8): helperTelemetry(), Clock, initialSnapshot(), checkpointMeasurement(), HEARTBEAT_GAP_MS, HEARTBEAT_MS, startMeasurement(), WorkOutcome

### Community 81 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 82 - "node-visuals.ts"
Cohesion: 0.20
Nodes (13): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+5 more)

### Community 83 - "preferences-store.ts"
Cohesion: 0.19
Nodes (9): PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS, OfficePreferences (+1 more)

### Community 84 - "outbox.ts"
Cohesion: 0.13
Nodes (21): ADOPTION_STALLED_MS, projectOutbox(), syncOutbox(), projectSlackDeliveries(), settleRequestedSlackReplacement(), Input, supersedeSlackDelivery(), replacementContext() (+13 more)

### Community 85 - "ledger.ts"
Cohesion: 0.33
Nodes (9): investigationCandidates(), investigationId(), investigationFollowUps(), investigationResolution(), syncInvestigations(), NOTIFY_HELPER, notifyHelperResolution(), requeueInvestigationEvidence() (+1 more)

### Community 86 - "local-config.ts"
Cohesion: 0.15
Nodes (19): AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), FeaturePlanningBindings, OfficeConfigInputs, officeConfigRoute(), officeConfigSummary(), CECBinding, localBindings (+11 more)

### Community 87 - "daily-cto.ts"
Cohesion: 0.11
Nodes (22): EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), queueGoalEvidenceRequest(), applyGoalReview(), DailyResultSchema, EvidenceRefSchema, FreshDailyResultSchema (+14 more)

### Community 88 - "unblock-brief.ts"
Cohesion: 0.53
Nodes (5): clearUnblockBrief(), key(), saveUnblockBrief(), unblockBrief, src_shared_learningsubject

### Community 89 - "evidence-digest.ts"
Cohesion: 0.73
Nodes (5): canonical(), evidenceDigest(), evidenceHash(), semantic(), stableUrl()

### Community 90 - "coordination-tick.ts"
Cohesion: 0.19
Nodes (10): BrainFollowup, brainCheckpointCompletion(), reconcileCompletedCheckpoints(), legacy, reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION (+2 more)

### Community 91 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (10): ref_react_three_drei, ref_react_three_fiber, ref_three_stdlib, CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility (+2 more)

### Community 92 - "blocker-followups.ts"
Cohesion: 0.41
Nodes (9): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), readBackConversations(), handoff(), reconcileBlockerFollowups(), BlockerFollowup (+1 more)

### Community 93 - "it-specialist.ts"
Cohesion: 0.16
Nodes (18): savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), ITContext, diagnosticSnapshot(), publishITReport(), nativeDeliveryResolved() (+10 more)

### Community 94 - "createConstellation"
Cohesion: 0.19
Nodes (5): ConstellationRuntime, createConstellation(), enter(), finishTap(), move()

### Community 95 - "capture-session-clone.py"
Cohesion: 0.15
Nodes (10): ctypes, errno, importlib_util, json, os, pathlib, Copy a coherent macOS clone of inherited reader fd3 to anonymous target fd4. No…, Read-only protocol adapter for the installed review helper. No model dispatch. (+2 more)

### Community 96 - "delivery-ownership.ts"
Cohesion: 0.33
Nodes (5): ref_node_async_hooks, Ownership, ownershipContext, refreshDeliveryOwnership(), RefreshOwnership

### Community 97 - "Outbox.tsx"
Cohesion: 0.08
Nodes (40): knowledgeOutbox(), Conversation(), send(), SendMessage, LessonDecisionAction, lessonDecisionState(), readLessonDecision(), DAYS (+32 more)

### Community 98 - "store.ts"
Cohesion: 0.07
Nodes (38): ref_zod, channelNoticeAuthorized(), ChannelSettings, notices(), queueChannelNotice(), Identity, MergeNotifications, NoticeSettings (+30 more)

### Community 99 - "scheduled-features.ts"
Cohesion: 0.53
Nodes (9): currentApproval(), recoveryHeld(), deliveryPreflight, handoffBinding(), readHandoff(), sameBinding(), uncertainPublications(), scheduledFeatures() (+1 more)

### Community 100 - "cost-entries.ts"
Cohesion: 0.24
Nodes (10): server_telemetry_billable_work_issue_key, captureCost(), summary(), awaitingEvidence(), boardUsd(), CaptureContext, inCostWindow(), TicketCost (+2 more)

### Community 101 - "service-health.ts"
Cohesion: 0.17
Nodes (10): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, slackHealth() (+2 more)

### Community 102 - "run-evidence.ts"
Cohesion: 0.47
Nodes (4): comparable(), EvidenceOutcome, recordRunEvidence(), RunAccounting

### Community 103 - "work-summary.ts"
Cohesion: 0.13
Nodes (28): compactSteps(), displayAgentTask(), githubStageLabels, withoutElapsed(), LiveAgentTask(), Props, RunningTask(), text() (+20 more)

### Community 104 - "install-service.mjs"
Cohesion: 0.16
Nodes (11): ref_node_child_process, ref_node_url, file, folder, logs, root, GIT_NETWORK, LIVE_PROVIDERS (+3 more)

### Community 105 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (6): ref_mammoth, ref_pdfjs_dist, bounded(), extract(), fail(), [path,kind]

### Community 106 - "useOfficePreferences.ts"
Cohesion: 0.26
Nodes (10): acceptPreferences(), PreferenceCandidate, strip(), UNKNOWN_PREFERENCES, OfficePreferencesController, PreferenceFeedback, PreferenceField, requestPreferences() (+2 more)

### Community 107 - "create-candidate.ts"
Cohesion: 0.48
Nodes (6): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf()

### Community 108 - "cli.ts"
Cohesion: 0.18
Nodes (7): ref_node_stream, ref_node_timers, args, [cmd,...rawArgs], commands, key, projectIndex

### Community 109 - "extraction.ts"
Cohesion: 0.33
Nodes (4): ref_node_string_decoder, extractDocument, Extraction, Extractor

### Community 110 - "session-scope.ts"
Cohesion: 0.29
Nodes (8): retainSessionMessage(), SessionConversation, jiraCommandIssues(), scopeParser(), ScopeParserState, ScopeProject, sessionScopeParser(), siteHost()

### Community 111 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 112 - "ScheduledWork"
Cohesion: 0.31
Nodes (3): ScheduledWork, releaseOrRetain(), QueueTiming

### Community 113 - "codex-rollout.ts"
Cohesion: 0.29
Nodes (9): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO (+1 more)

### Community 114 - "retire-history.ts"
Cohesion: 0.33
Nodes (7): readHistoryScope(), historicalRecordDigest(), Intent, records(), retireIncompleteHistory(), HistoryRetirement, HistoryRetirementIntent

### Community 115 - "merge-summary.ts"
Cohesion: 0.36
Nodes (7): clamp(), LIMITS, MergedPR, plainSlackText(), section(), shippedSummary(), mergeText()

### Community 116 - "office/readiness.ts"
Cohesion: 0.36
Nodes (6): BLOCKED_CAUSES, blockedCauses(), projectReadiness(), ProgressionItem, src_shared_progressionitem, src_shared_projectreadiness

### Community 117 - "office-qa-handoff.ts"
Cohesion: 0.60
Nodes (4): OfficeQAHandoff, OfficeQAHandoffInput, OfficeQAHandoffRequest, QAOwnershipProof

## Knowledge Gaps
- **478 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+473 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 617 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `OfficeSnapshot`, `requests.ts`, `dependency-bots/adopt.ts`, `read-retries.ts`, `delivery-repairs.ts`, `session-bridge.ts`, `agents.ts`, `review-run.ts`, `workKey`, `ref_node_crypto`, `assignments.ts`, `enrollment-gate.ts`, `run-retrospective.ts`, `record-trigger.ts`, `api-routes.ts`, `ref_node_path`, `features/commands.ts`, `cec.ts`, `.transaction`, `maintenance/maintenance.ts`, `cost-ledger.ts`, `accept-stage-result.ts`, `dependencies.ts`, `jira-time.ts`, `digest`, `conversations/conversations.ts`, `lesson-selection.ts`, `sanitize`, `goal-reporting.ts`, `scheduled-work.ts`, `closeout-recovery.ts`, `run-accounting.ts`, `assignment-poll.ts`, `time-scope.ts`, `.save`, `scope-repair-resume.ts`, `engine.ts`, `demand-facts.ts`, `.emit`, `cec/workflow.ts`, `weekly-rollup.ts`, `github-delivery.ts`, `continue-unsealed-qa.ts`, `scheduler.ts`, `retrospective-subject.ts`, `run.ts`, `stopped-base-validation.ts`, `remove-candidate.ts`, `ticket-evidence.ts`, `control-store.ts`, `config.ts`, `coordination.ts`, `Offices`, `admit-improvement.ts`, `TicketJob`, `offices.ts`, `.now`, `outbox.ts`, `ledger.ts`, `daily-cto.ts`, `coordination-tick.ts`, `blocker-followups.ts`, `it-specialist.ts`, `store.ts`, `scheduled-features.ts`, `cost-entries.ts`, `run-evidence.ts`, `create-candidate.ts`, `ScheduledWork`, `retire-history.ts`?**
  _High betweenness centrality (0.131) - this node is a cross-community bridge._
- **Why does `TicketJob` connect `TicketJob` to `requests.ts`, `dependency-bots/adopt.ts`, `Inspector.tsx`, `delivery-repairs.ts`, `workKey`, `shared.ts`, `record-trigger.ts`, `ref_node_path`, `accept-stage-result.ts`, `dependencies.ts`, `digest`, `closeout-recovery.ts`, `assignment-poll.ts`, `scope-repair-resume.ts`, `Store`, `cec/workflow.ts`, `github-delivery.ts`, `scheduler.ts`, `retrospective-subject.ts`, `stopped-base-validation.ts`, `remove-candidate.ts`, `fact-bounds.ts`, `it-specialist.ts`, `work-summary.ts`, `create-candidate.ts`, `ScheduledWork`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `OfficeSnapshot` connect `OfficeSnapshot` to `Inspector.tsx`, `MapView.tsx`, `shared.ts`, `App.tsx`, `record-trigger.ts`, `api-routes.ts`, `PeoplePanel.tsx`, `maintenance/maintenance.ts`, `index.tsx`, `sanitize`, `assignment-poll.ts`, `OfficeScene.tsx`, `Store`, `harness-baseline.ts`, `cec/workflow.ts`, `work.ts`, `TimeBook.tsx`, `control-store.ts`, `offices.ts`, `scene-motion.ts`, `outbox.ts`, `ledger.ts`, `Outbox.tsx`, `store.ts`, `service-health.ts`, `work-summary.ts`, `useOfficePreferences.ts`, `cli.ts`, `office/readiness.ts`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _478 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `OfficeSnapshot` be split into smaller, more focused modules?**
  _Cohesion score 0.0750151240169389 - nodes in this community are weakly interconnected._
- **Should `requests.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08226768968456948 - nodes in this community are weakly interconnected._
- **Should `dependency-bots/adopt.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.057133985405992856 - nodes in this community are weakly interconnected._