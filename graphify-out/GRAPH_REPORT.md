# Graph Report - the-office  (2026-11-15)

## Corpus Check
- 844 files · ~339,463 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4164 nodes · 19405 edges · 114 communities (110 shown, 4 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 629 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2ec0399b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- SessionBridge
- requests.ts
- dependency-bots/adopt.ts
- github-delivery.ts
- Inspector.tsx
- delivery-repairs.ts
- session-bridge.ts
- Button
- agents.ts
- store.ts
- source-amendment-scope.ts
- cli.ts
- App.tsx
- config.ts
- reader.ts
- scheduled-captures.ts
- run-retrospective.ts
- record-trigger.ts
- worker-runtime.ts
- ref_node_path
- features.ts
- Ticket
- shared.ts
- tracking-issue.ts
- knowledge.ts
- maintenance/maintenance.ts
- coordination.ts
- artifact
- Coordinator
- packed165-admission.ts
- digest
- index.tsx
- ref_zod
- lesson-selection.ts
- azure.ts
- board-preflight.ts
- cost-ledger.ts
- telemetry.ts
- closeout-recovery.ts
- run-accounting.ts
- work-summary.ts
- time-scope.ts
- .constructor
- .save
- scheduled-work.ts
- publish-pr.ts
- OfficeScene.tsx
- local-config.ts
- engine.ts
- assignments.ts
- .emit
- harness-baseline.ts
- session-context-file.ts
- cec/workflow.ts
- work.ts
- weekly-rollup.ts
- github-readiness.ts
- TimeBook.tsx
- continue-unsealed-qa.ts
- Role
- record-push.ts
- run.ts
- OfficeSnapshot
- remove-candidate.ts
- ticket-evidence.ts
- fact-bounds.ts
- QuestionStepper.tsx
- ControlStore
- jira-operations.ts
- recovery-ledger.ts
- constellation-runtime.ts
- Store
- Offices
- report.ts
- index.ts
- admit-improvement.ts
- claude-session-context.ts
- accept-stage-result.ts
- effects.ts
- jira-time.ts
- control-store.ts
- scene-motion.ts
- node-visuals.ts
- preferences-store.ts
- outbox.ts
- ledger.ts
- evidence.ts
- daily-cto.ts
- codex-rollout.ts
- session-scope.ts
- coordination-tick.ts
- RoomCamera.tsx
- blocker-followups.ts
- ITFollowUps.tsx
- leadership.ts
- capture-session-clone.py
- owned-artifact.ts
- Outbox.tsx
- assignment-poll.ts
- codex-rollout-file.ts
- delivery-recoveries.ts
- it-specialist.ts
- run-evidence.ts
- source-amendment.ts
- install-service.mjs
- extract-worker.mjs
- run-usage.ts
- create-candidate.ts
- OfficeConfigView.tsx
- extraction.ts
- highestStableAtLeast
- CommandRegistry
- QuestionNotifications
- session-inventory-failure.ts

## God Nodes (most connected - your core abstractions)
1. `Store` - 372 edges
2. `TicketJob` - 176 edges
3. `digest()` - 175 edges
4. `artifact()` - 131 edges
5. `GitHubDelivery` - 122 edges
6. `command()` - 115 edges
7. `workKey()` - 101 edges
8. `currentAssignment()` - 90 edges
9. `cx()` - 88 edges
10. `OfficeSnapshot` - 87 edges

## Surprising Connections (you probably didn't know these)
- `apply()` --indirect_call--> `note()`  [INFERRED]
  src/conversations/OutboxSavedImplementation.tsx → server/cec/parking/resume-parked.ts
- `projectOutbox()` --calls--> `isSavedPlanFollowup()`  [EXTRACTED]
  server/conversations/outbox.ts → src/conversations/saved-plan-followup.ts
- `projectOutbox()` --calls--> `deferredPickup()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/pickup-state.ts
- `projectOutbox()` --calls--> `parkedProviderWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts
- `projectOutbox()` --calls--> `readinessWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts

## Import Cycles
- 3-file cycle: `server/delivery/parking/resume-provider-review.ts -> server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/parking/resume-provider-review.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts`
- 4-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 4-file cycle: `server/delivery/recovery/implementation/activation-recovery.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/implementation/activation-recovery.ts`
- 4-file cycle: `server/delivery/recovery/implementation/saved-prerequisite-handoff.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/implementation/saved-prerequisite-handoff.ts`
- 4-file cycle: `server/delivery/recovery/scope-repair/scope-repair-readback.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/scope-repair/scope-repair-readback.ts`
- 4-file cycle: `server/delivery/recovery/source-amendment/source-amendment.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/source-amendment/source-amendment.ts`
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

## Communities (114 total, 4 thin omitted)

### Community 0 - "SessionBridge"
Cohesion: 0.23
Nodes (9): claudeSessionContext(), codexSessionContext(), claudeSessions(), SessionBridge, completeSessionCoverage(), desktopCoverageGap(), knownActivity(), Report (+1 more)

### Community 1 - "requests.ts"
Cohesion: 0.10
Nodes (43): deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, accounting, DeliverySubject, nonDelivery, originalReads (+35 more)

### Community 2 - "dependency-bots/adopt.ts"
Cohesion: 0.17
Nodes (25): Execute, adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR, openDependabotPulls() (+17 more)

### Community 3 - "github-delivery.ts"
Cohesion: 0.05
Nodes (57): ProjectProgress, harnessCloseout(), PASSING, verifyMergeActions(), runHarnessStage(), BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE (+49 more)

### Community 4 - "Inspector.tsx"
Cohesion: 0.11
Nodes (62): Outbox(), blockedSummary(), ServiceHealthPanel(), followUp(), labels, ServiceHealthRow(), BlockerFollowups(), LearningCoverage() (+54 more)

### Community 5 - "delivery-repairs.ts"
Cohesion: 0.10
Nodes (38): removeAdoptedClone(), namedRepairIds(), pinCourier, pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), stoppedBaseCheckout(), discussion(), pages() (+30 more)

### Community 6 - "session-bridge.ts"
Cohesion: 0.18
Nodes (14): ref_ws, codexDaemonProcesses(), accountCodexProcesses(), codexProcessInventory, DesktopSessions, unaccountedProcesses(), idleExecServers(), isExecServer() (+6 more)

### Community 7 - "Button"
Cohesion: 0.08
Nodes (61): ref_react, ref_react_markdown, ref_remark_gfm, ref_yaml, KnowledgeActivity, KnowledgeActivityPage, KnowledgeEdge, KnowledgeMap (+53 more)

### Community 8 - "agents.ts"
Cohesion: 0.05
Nodes (48): IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), intakeMembership(), projectListScope(), cecIntakePrompt(), cecReadbackPrompt() (+40 more)

### Community 9 - "store.ts"
Cohesion: 0.07
Nodes (41): ref_node_crypto, reviewedPlanGuidance, reviewedPlanGuideDigest, featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), automaticFeature(), FeaturePlanningConfig (+33 more)

### Community 10 - "source-amendment-scope.ts"
Cohesion: 0.08
Nodes (34): approvedText(), assert(), assert(), normalize(), officialUrls, ReleaseCapture, verifyReleaseCaptures(), capture (+26 more)

### Community 11 - "cli.ts"
Cohesion: 0.18
Nodes (9): ref_node_stream, ref_node_timers, args, [cmd,...rawArgs], commands, key, projectIndex, lessonBrainAudit (+1 more)

### Community 12 - "App.tsx"
Cohesion: 0.06
Nodes (51): ref_lucide_react, ref_motion, ref_react_dom, BrainDrawer(), themeColor, App(), BrainWorkspace, CONNECTION (+43 more)

### Community 13 - "config.ts"
Cohesion: 0.07
Nodes (60): approveFeature(), featureById(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), discoveryPrompt(), planPrompt() (+52 more)

### Community 14 - "reader.ts"
Cohesion: 0.10
Nodes (27): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, CommittedBrain (+19 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.15
Nodes (45): requestDelivery(), admit(), createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture() (+37 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.09
Nodes (45): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, blockingTrigger, isBlocking(), brainOverlap (+37 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.07
Nodes (54): deliveryMetrics(), median(), baselineLearning(), LEARNING_BASELINES, maintainLearning(), maintenanceSubject(), MaintenanceSubjectFacts, clip() (+46 more)

### Community 18 - "worker-runtime.ts"
Cohesion: 0.06
Nodes (43): recoverSavedPlan(), candidateWorkspaceEnvironment(), assignmentSubject(), lessonPurpose(), selectLessons(), catalogLine(), assertBriefingScope(), LOCAL_BINDINGS (+35 more)

### Community 19 - "ref_node_path"
Cohesion: 0.06
Nodes (78): ref_node_fs, ref_node_os, ref_node_path, ref_node_util, Assessment, Ownership, candidateInput(), children (+70 more)

### Community 20 - "features.ts"
Cohesion: 0.10
Nodes (36): commandFeature(), reviewQuestions(), saveCaptureRequest(), automaticIntakeWait(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS, reserveReplacement() (+28 more)

### Community 21 - "Ticket"
Cohesion: 0.16
Nodes (19): implementationWorkerContext(), cecPrompt(), resolvedDecisionNote(), stageInstructions, SKILLS, safeWebUrl(), isQAStage(), legacyQA() (+11 more)

### Community 22 - "shared.ts"
Cohesion: 0.06
Nodes (60): label(), personaContext(), PackedPublicationRepair, Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId (+52 more)

### Community 23 - "tracking-issue.ts"
Cohesion: 0.18
Nodes (14): ensureTrackingIssue(), findTrackingIssue(), ownTracking(), TrackingIssue, trackingIssueBody(), trackingIssueTitle(), trackingMarker(), DependencyBot (+6 more)

### Community 24 - "knowledge.ts"
Cohesion: 0.06
Nodes (44): normalizeStatement(), curateLesson(), Curation, CurationAction, mergeEvidence(), LessonBrainOverlap, decideOfficeProposal(), now() (+36 more)

### Community 25 - "maintenance/maintenance.ts"
Cohesion: 0.06
Nodes (49): maintenancePolicies(), captureMaintenanceStep(), completeNativeCheckpoint(), reconcileNativeDelivery(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, BrainStatusSchema (+41 more)

### Community 26 - "coordination.ts"
Cohesion: 0.12
Nodes (28): IntakeContext, WAIT_STATUSES, DependencyStores, currentApproval(), featureGate(), predecessorComplete(), deliveryPreflight, handoffBinding() (+20 more)

### Community 27 - "artifact"
Cohesion: 0.06
Nodes (115): containedFile(), recordJobApproach(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash (+107 more)

### Community 29 - "packed165-admission.ts"
Cohesion: 0.16
Nodes (25): HarnessControl, withHarnessWork(), admitPacked165(), history(), makePacked165Candidate(), packed165CandidateIdentity(), packed165Subject(), retainedPacked165Effect() (+17 more)

### Community 30 - "digest"
Cohesion: 0.22
Nodes (28): activeEffectId(), admitPRMetadata(), assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema, savedMetadataAssessment(), validateSaved() (+20 more)

### Community 31 - "index.tsx"
Cohesion: 0.10
Nodes (46): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS, PickupForm(), acceptPreferences() (+38 more)

### Community 32 - "ref_zod"
Cohesion: 0.09
Nodes (32): ref_zod, assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO() (+24 more)

### Community 33 - "lesson-selection.ts"
Cohesion: 0.10
Nodes (25): fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, LessonSelection (+17 more)

### Community 34 - "azure.ts"
Cohesion: 0.16
Nodes (20): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+12 more)

### Community 35 - "board-preflight.ts"
Cohesion: 0.19
Nodes (27): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), ProjectCard, projectCards(), projectGraphql() (+19 more)

### Community 36 - "cost-ledger.ts"
Cohesion: 0.12
Nodes (32): captureCost(), server_telemetry_cost_entries_costcoveragesummary, costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId() (+24 more)

### Community 37 - "telemetry.ts"
Cohesion: 0.11
Nodes (23): CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL, Rates (+15 more)

### Community 38 - "closeout-recovery.ts"
Cohesion: 0.12
Nodes (38): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+30 more)

### Community 39 - "run-accounting.ts"
Cohesion: 0.21
Nodes (16): readCodexRollout(), HELPER_STDOUT_MAX_BYTES, helperAccounting(), claudeAccounting(), codexAccounting(), COMPLETION_MAX_BYTES, completionAccounting(), readCompletion() (+8 more)

### Community 40 - "work-summary.ts"
Cohesion: 0.17
Nodes (22): compactSteps(), deliveryRepairProjection(), card, ACTIVE, maintenanceUpdate(), PMQueueItem, pmQueueItems(), prerequisiteKeys() (+14 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.13
Nodes (31): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), server_telemetry_billable_work_issue_key, isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence() (+23 more)

### Community 42 - ".constructor"
Cohesion: 0.16
Nodes (10): leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), CONSOLIDATED, CONSOLIDATED_AT, SEEDS, seedOfficeLessons() (+2 more)

### Community 43 - ".save"
Cohesion: 0.06
Nodes (55): correlatedBuild(), jiraCollection(), BLOCKED, findComment(), LiveIssue, readIssue(), readIssues(), Execute (+47 more)

### Community 44 - "scheduled-work.ts"
Cohesion: 0.11
Nodes (32): freshOwnershipRead(), deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), metadataRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork() (+24 more)

### Community 45 - "publish-pr.ts"
Cohesion: 0.16
Nodes (18): harnessEffect, readBackOrThrow(), retryRead(), park(), commitlintRejection(), developerPRContent(), Execute, officePRContent() (+10 more)

### Community 46 - "OfficeScene.tsx"
Cohesion: 0.17
Nodes (33): withoutElapsed(), Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk() (+25 more)

### Community 47 - "local-config.ts"
Cohesion: 0.14
Nodes (18): AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), GitHubMonitor, githubPRDescription(), azureGoalFacts(), azurePRDescription(), boundedEvidence(), collectAzureGoalDocuments() (+10 more)

### Community 48 - "engine.ts"
Cohesion: 0.11
Nodes (28): checkMail(), drainMail(), requestMail(), dispatchNightly(), drainDelivery(), enableNightly(), resume(), startPilot() (+20 more)

### Community 49 - "assignments.ts"
Cohesion: 0.08
Nodes (35): clip(), DEMAND_LIMIT, demandFacts(), key(), LessonKey, notes(), assignmentLookups, Binding (+27 more)

### Community 50 - ".emit"
Cohesion: 0.11
Nodes (33): requestQAPlanRetry(), configureChannelNotices(), configureNotices(), retryRecipientLookup(), recoverCTOInput(), boardPreflightCandidate(), enqueueGreen156(), bindDiscoveryResume() (+25 more)

### Community 51 - "harness-baseline.ts"
Cohesion: 0.15
Nodes (20): baselineReport, BaselineSource, baselineText(), millions(), row(), share(), add(), BaselineState (+12 more)

### Community 52 - "session-context-file.ts"
Cohesion: 0.28
Nodes (11): ref_node_perf_hooks, contextFoldPrefix, SessionContextCheckpoint, captureSessionContextClone(), sessionContextFile(), ContextReadChanged, MAX_CONTEXT_READ_MS, sameContextFile() (+3 more)

### Community 53 - "cec/workflow.ts"
Cohesion: 0.14
Nodes (30): applyIntakeObservation(), parksInJira(), qaPlanEvidenceGap(), run(), verifiedTransition(), advance(), nextStage(), publicationEvidenceGap() (+22 more)

### Community 54 - "work.ts"
Cohesion: 0.07
Nodes (38): Admission, compatible(), issueKey(), observePrerequisites(), PrerequisiteSchema, PrerequisitesSchema, validatePrerequisites(), classifyStop() (+30 more)

### Community 55 - "weekly-rollup.ts"
Cohesion: 0.12
Nodes (30): expireLearningPackets(), learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire() (+22 more)

### Community 56 - "github-readiness.ts"
Cohesion: 0.11
Nodes (51): findingsBlock(), hasUncertainEffects(), observe(), assertAutomationEffects(), automationMergePolicy(), observeAutomationMerge(), routeAutomationMerge(), checksFailed() (+43 more)

### Community 57 - "TimeBook.tsx"
Cohesion: 0.08
Nodes (46): TelemetryReport, LiveAnchor, displayAgentTask(), LiveAgentTask(), Props, RunningTask(), text(), Agent (+38 more)

### Community 58 - "continue-unsealed-qa.ts"
Cohesion: 0.05
Nodes (61): ref_node_child_process, GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles() (+53 more)

### Community 59 - "Role"
Cohesion: 0.12
Nodes (18): ROLES, Clock, DeliverySlot, officeCapacity, fifo(), ScheduledWork, Scheduler, selectWork() (+10 more)

### Community 60 - "record-push.ts"
Cohesion: 0.14
Nodes (17): Event, one(), prePushRejection(), PushIdentity, Candidate, recordedPush(), settledPushBoundary(), At (+9 more)

### Community 61 - "run.ts"
Cohesion: 0.23
Nodes (12): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, OFFICE_FIX_PROMPT, OfficeFixResult, validateOfficeFix(), investigationReady(), InvestigationOptions, InvestigationReport (+4 more)

### Community 62 - "OfficeSnapshot"
Cohesion: 0.07
Nodes (41): SendMessage, ctoInputFailure(), OutboxCTOInput(), recover(), OutboxSavedImplementation(), apply(), review(), OutboxSavedPlan() (+33 more)

### Community 63 - "remove-candidate.ts"
Cohesion: 0.18
Nodes (18): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot() (+10 more)

### Community 64 - "ticket-evidence.ts"
Cohesion: 0.13
Nodes (29): assetDownloader(), attachmentKind(), evidenceDirectory(), readEvidence(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS (+21 more)

### Community 65 - "fact-bounds.ts"
Cohesion: 0.25
Nodes (15): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+7 more)

### Community 66 - "QuestionStepper.tsx"
Cohesion: 0.12
Nodes (28): FeatureHarnessOption, FeatureOption, FeatureQuestion, FeatureQuestionProjection, FeatureRound, FeatureRoundAuthor, OutboxQuestionRound(), send() (+20 more)

### Community 67 - "ControlStore"
Cohesion: 0.20
Nodes (5): DailyCTO, Briefing, saveReviewBriefing(), ControlStore, DailyCTOReport

### Community 68 - "jira-operations.ts"
Cohesion: 0.29
Nodes (8): CommentPage, commentReadback(), JiraOperations, plain(), jiraRecord(), unpack(), metadataDigest(), verifyAlreadyAtStatus()

### Community 69 - "recovery-ledger.ts"
Cohesion: 0.26
Nodes (9): savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), diagnosticSnapshot(), nativeDeliveryResolved(), reconcileRecoveryLedger(), stoppedBaseUpdateUnresolved() (+1 more)

### Community 70 - "constellation-runtime.ts"
Cohesion: 0.10
Nodes (22): ref_3d_force_graph, ref_three, CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point (+14 more)

### Community 71 - "Store"
Cohesion: 0.06
Nodes (9): jiraText(), JiraFeaturePublisher, Result, Assessment, Engine, Store, command(), workerFailure() (+1 more)

### Community 73 - "report.ts"
Cohesion: 0.25
Nodes (14): TimeLedgerState, Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked() (+6 more)

### Community 74 - "index.ts"
Cohesion: 0.07
Nodes (50): ref_hono_node_server, ref_node_http, ref_smol_toml, ref_vite, implementationContinuationRoute(), qaPlanRetryRoute(), assertQuestionVisibility(), close() (+42 more)

### Community 75 - "admit-improvement.ts"
Cohesion: 0.23
Nodes (15): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+7 more)

### Community 76 - "claude-session-context.ts"
Cohesion: 0.26
Nodes (9): readTranscript, root, claudeSessionScope(), readRollout, LiveSession, ContextProject, ContextReader, SessionContext (+1 more)

### Community 77 - "accept-stage-result.ts"
Cohesion: 0.10
Nodes (41): acceptStageResult(), acceptConflictRepair(), deliveryNextStage(), pendingPreparationCheck(), draftReadHeadMatches(), assertDraftClaimHistory(), linkDraftIssue(), protectedOriginalClaim() (+33 more)

### Community 78 - "effects.ts"
Cohesion: 0.07
Nodes (28): Assignment, Content, JiraIssuePublisher, keyOf(), Transition, descriptionPreimage(), plain(), publicationDescription() (+20 more)

### Community 79 - "jira-time.ts"
Cohesion: 0.16
Nodes (17): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+9 more)

### Community 80 - "control-store.ts"
Cohesion: 0.16
Nodes (10): ref_node_sqlite, applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, statementCache(), initialSnapshot(), initializeStoreSchema() (+2 more)

### Community 81 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 82 - "node-visuals.ts"
Cohesion: 0.20
Nodes (13): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+5 more)

### Community 83 - "preferences-store.ts"
Cohesion: 0.21
Nodes (8): PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS, OfficePreferences

### Community 84 - "outbox.ts"
Cohesion: 0.14
Nodes (19): ctoInputIdentityMatches(), ctoInputRecovered(), ADOPTION_STALLED_MS, conversationResolved(), projectOutbox(), syncOutbox(), finishSupersededReadback(), projectSlackDeliveries() (+11 more)

### Community 85 - "ledger.ts"
Cohesion: 0.26
Nodes (13): investigationCandidates(), investigationId(), ctoReplacementResolution(), investigationFollowUps(), implementationReplacementResolution(), investigationResolution(), syncInvestigations(), NOTIFY_HELPER (+5 more)

### Community 86 - "evidence.ts"
Cohesion: 0.27
Nodes (8): investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_SOURCE_PATHS, officeSource(), launchPolicyFacts(), lifecycleFacts()

### Community 87 - "daily-cto.ts"
Cohesion: 0.13
Nodes (18): EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), applyGoalReview(), DailyResultSchema, EvidenceRefSchema, FreshDailyResultSchema, GoalEvidenceRequestSchema (+10 more)

### Community 88 - "codex-rollout.ts"
Cohesion: 0.29
Nodes (9): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO (+1 more)

### Community 89 - "session-scope.ts"
Cohesion: 0.29
Nodes (8): retainSessionMessage(), SessionConversation, jiraCommandIssues(), scopeParser(), ScopeParserState, ScopeProject, sessionScopeParser(), siteHost()

### Community 90 - "coordination-tick.ts"
Cohesion: 0.12
Nodes (16): reconcileNoticeConfirmations(), dependencyCompletionKey(), BrainFollowup, brainCheckpointCompletion(), coverageSchema, followupSchema, verified, reconcileCompletedCheckpoints() (+8 more)

### Community 91 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (10): ref_react_three_drei, ref_react_three_fiber, ref_three_stdlib, CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility (+2 more)

### Community 92 - "blocker-followups.ts"
Cohesion: 0.44
Nodes (8): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), readBackConversations(), handoff(), reconcileBlockerFollowups(), BlockerFollowup, src_shared_blockerfollowup

### Community 93 - "ITFollowUps.tsx"
Cohesion: 0.67
Nodes (4): itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps()

### Community 94 - "leadership.ts"
Cohesion: 0.20
Nodes (8): DailyCTOBriefing, DailyCTOResult, DailyCTOSummary, DailyGoalUpdate, GoalEvidenceRef, GoalEvidenceRequest, GoalProgress, GoalStatus

### Community 95 - "capture-session-clone.py"
Cohesion: 0.15
Nodes (10): ctypes, errno, importlib_util, json, os, pathlib, Copy a coherent macOS clone of inherited reader fd3 to anonymous target fd4. No…, Read-only protocol adapter for the installed review helper. No model dispatch. (+2 more)

### Community 96 - "owned-artifact.ts"
Cohesion: 0.42
Nodes (7): BoundedRead, done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf(), CompletionReader

### Community 97 - "Outbox.tsx"
Cohesion: 0.08
Nodes (38): knowledgeOutbox(), Conversation(), LessonDecisionAction, lessonDecisionState(), readLessonDecision(), DAYS, dueLessonDecisions(), easternWeek() (+30 more)

### Community 98 - "assignment-poll.ts"
Cohesion: 0.12
Nodes (24): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), channelNoticeAuthorized(), ChannelSettings, notices(), queueChannelNotice(), clamp() (+16 more)

### Community 99 - "codex-rollout-file.ts"
Cohesion: 0.36
Nodes (7): codexHome(), createdAt(), dayDirs(), header(), ROLLOUT_MAX_BYTES, RolloutScan, scanCodexRollouts()

### Community 100 - "delivery-recoveries.ts"
Cohesion: 0.11
Nodes (30): requireDeliveryAuthority(), deliveryIntakeBlocker(), gateRegisteredDelivery(), assertDeliveryMayMutate(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery() (+22 more)

### Community 101 - "it-specialist.ts"
Cohesion: 0.14
Nodes (17): partialLocalCleanupKey(), ITContext, publishITReport(), delays, recoverAttempt(), listenerHealth(), providers, ProviderStatusChecks (+9 more)

### Community 102 - "run-evidence.ts"
Cohesion: 0.38
Nodes (5): comparable(), EvidenceOutcome, recordRunEvidence(), backfillClaudeCost(), RunAccounting

### Community 103 - "source-amendment.ts"
Cohesion: 0.08
Nodes (51): ref_node_async_hooks, APPROACH_GUIDANCE, reviewInstructions(), deliveryTask(), DeliveryTaskInput, DISCOVERY_GUIDANCE, adoptCandidate(), reported (+43 more)

### Community 104 - "install-service.mjs"
Cohesion: 0.29
Nodes (5): ref_node_url, file, folder, logs, root

### Community 105 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (6): ref_mammoth, ref_pdfjs_dist, bounded(), extract(), fail(), [path,kind]

### Community 106 - "run-usage.ts"
Cohesion: 0.38
Nodes (5): CodexRollout, claudeCrashZero(), claudeUsage(), count(), RunUsage

### Community 107 - "create-candidate.ts"
Cohesion: 0.26
Nodes (10): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+2 more)

### Community 108 - "OfficeConfigView.tsx"
Cohesion: 0.52
Nodes (5): loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView(), OfficeConfigSummary

### Community 109 - "extraction.ts"
Cohesion: 0.33
Nodes (4): ref_node_string_decoder, extractDocument, Extraction, Extractor

### Community 110 - "highestStableAtLeast"
Cohesion: 0.83
Nodes (3): compare(), highestStableAtLeast(), parts()

### Community 113 - "session-inventory-failure.ts"
Cohesion: 0.40
Nodes (3): ContextReadPhase, SessionContextDeadline, sessionInventoryFailureDetail()

## Knowledge Gaps
- **506 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+501 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 645 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `SessionBridge`, `requests.ts`, `dependency-bots/adopt.ts`, `github-delivery.ts`, `delivery-repairs.ts`, `session-bridge.ts`, `agents.ts`, `store.ts`, `config.ts`, `reader.ts`, `scheduled-captures.ts`, `run-retrospective.ts`, `record-trigger.ts`, `worker-runtime.ts`, `ref_node_path`, `features.ts`, `Ticket`, `tracking-issue.ts`, `knowledge.ts`, `maintenance/maintenance.ts`, `coordination.ts`, `artifact`, `packed165-admission.ts`, `digest`, `ref_zod`, `lesson-selection.ts`, `azure.ts`, `board-preflight.ts`, `cost-ledger.ts`, `closeout-recovery.ts`, `run-accounting.ts`, `time-scope.ts`, `.constructor`, `.save`, `scheduled-work.ts`, `publish-pr.ts`, `local-config.ts`, `engine.ts`, `assignments.ts`, `.emit`, `work.ts`, `weekly-rollup.ts`, `github-readiness.ts`, `continue-unsealed-qa.ts`, `Role`, `record-push.ts`, `run.ts`, `OfficeSnapshot`, `remove-candidate.ts`, `ticket-evidence.ts`, `jira-operations.ts`, `recovery-ledger.ts`, `index.ts`, `admit-improvement.ts`, `accept-stage-result.ts`, `effects.ts`, `jira-time.ts`, `control-store.ts`, `outbox.ts`, `ledger.ts`, `evidence.ts`, `daily-cto.ts`, `coordination-tick.ts`, `blocker-followups.ts`, `owned-artifact.ts`, `assignment-poll.ts`, `delivery-recoveries.ts`, `it-specialist.ts`, `run-evidence.ts`, `source-amendment.ts`, `create-candidate.ts`, `QuestionNotifications`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **Why does `TicketJob` connect `github-delivery.ts` to `requests.ts`, `dependency-bots/adopt.ts`, `Inspector.tsx`, `delivery-repairs.ts`, `App.tsx`, `record-trigger.ts`, `worker-runtime.ts`, `ref_node_path`, `shared.ts`, `maintenance/maintenance.ts`, `artifact`, `packed165-admission.ts`, `digest`, `board-preflight.ts`, `closeout-recovery.ts`, `work-summary.ts`, `.save`, `publish-pr.ts`, `engine.ts`, `cec/workflow.ts`, `work.ts`, `github-readiness.ts`, `Role`, `record-push.ts`, `remove-candidate.ts`, `fact-bounds.ts`, `accept-stage-result.ts`, `delivery-recoveries.ts`, `it-specialist.ts`, `source-amendment.ts`, `create-candidate.ts`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `Role` connect `Role` to `github-delivery.ts`, `Inspector.tsx`, `agents.ts`, `store.ts`, `App.tsx`, `record-trigger.ts`, `worker-runtime.ts`, `Ticket`, `shared.ts`, `maintenance/maintenance.ts`, `packed165-admission.ts`, `ref_zod`, `run-accounting.ts`, `OfficeScene.tsx`, `.emit`, `cec/workflow.ts`, `work.ts`, `github-readiness.ts`, `OfficeSnapshot`, `index.ts`, `accept-stage-result.ts`, `scene-motion.ts`, `outbox.ts`, `Outbox.tsx`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _506 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `requests.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0987012987012987 - nodes in this community are weakly interconnected._
- **Should `github-delivery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.052525252525252523 - nodes in this community are weakly interconnected._
- **Should `Inspector.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11313546870408463 - nodes in this community are weakly interconnected._