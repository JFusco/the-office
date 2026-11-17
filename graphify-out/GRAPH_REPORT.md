# Graph Report - the-office  (2026-11-17)

## Corpus Check
- 855 files · ~337,185 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4161 nodes · 19091 edges · 112 communities (108 shown, 4 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 615 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `663d1769`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- conversations/slack.ts
- Role
- dependency-bots/adopt.ts
- config.ts
- Inspector.tsx
- recovery/stopped-base-update.ts
- session-bridge.ts
- Button
- candidate.ts
- engine.ts
- worker-runtime.ts
- scope-repair-resume.ts
- App.tsx
- .transaction
- assignments.ts
- scheduled-captures.ts
- run-retrospective.ts
- record-trigger.ts
- http/commands.ts
- GitHubDelivery
- .getEffect
- github-delivery.ts
- index.tsx
- telemetry.ts
- lesson-selection.ts
- maintenance/maintenance.ts
- cost-ledger.ts
- ref_node_path
- knowledge.ts
- jira-time.ts
- digest
- agents.ts
- sanitize
- Goals.tsx
- azure.ts
- features.ts
- scheduled-work.ts
- scheduler.ts
- Ticket
- local-config.ts
- inspect-closed-plan.ts
- time-scope.ts
- fact-bounds.ts
- ledger.ts
- shared.ts
- harness-baseline.ts
- OfficeScene.tsx
- time-readback.ts
- currentAssignment
- demand-facts.ts
- learningDigest
- daily-cto.ts
- outbox.ts
- cec.ts
- interrupted-work-recovery.ts
- weekly-rollup.ts
- retrospective-subject.ts
- TimeBook.tsx
- JiraIssuePublisher
- control-store.ts
- Store
- run.ts
- knowledge-views.ts
- evidence-digest.ts
- ticket-evidence.ts
- run-accounting.ts
- .now
- security.ts
- continue-unsealed-qa.ts
- service-health.ts
- constellation-runtime.ts
- contract.ts
- work.ts
- report.ts
- goal-evidence.ts
- offices.ts
- node-visuals.ts
- ControlStore
- scene-motion.ts
- create-candidate.ts
- index.ts
- workKey
- activation-recovery.ts
- evidence.ts
- Outbox.tsx
- RoomCamera.tsx
- src_shared_workkey
- api-routes.ts
- it-specialist.ts
- recovery-ledger.ts
- superseded-receipts.ts
- jira-operations.ts
- delivery-task.ts
- assignment-poll.ts
- qa-comment.ts
- capture-session-clone.py
- preferences-store.ts
- delivery-ownership.ts
- .save
- codex-rollout.ts
- diagnostic-context.ts
- ITFollowUps.tsx
- slack-supersession.ts
- pilot-delivery.ts
- extract-worker.mjs
- coordination.ts
- .emit
- CommandRegistry
- cli.ts
- server_delivery_harness_delivery_authority_resolvedeliverywork
- server_delivery_recovery_stopped_base_audit_native
- restoreInPlace

## God Nodes (most connected - your core abstractions)
1. `Store` - 372 edges
2. `TicketJob` - 172 edges
3. `digest()` - 150 edges
4. `command()` - 117 edges
5. `GitHubDelivery` - 116 edges
6. `artifact()` - 114 edges
7. `workKey()` - 97 edges
8. `OfficeSnapshot` - 88 edges
9. `cx()` - 88 edges
10. `currentAssignment()` - 88 edges

## Surprising Connections (you probably didn't know these)
- `DeliverySlot` --references--> `Role`  [EXTRACTED]
  server/office/projects.ts → src/shared.ts
- `UnrecordedResult` --references--> `StageResult`  [EXTRACTED]
  server/cec/unrecorded-result.ts → src/shared.ts
- `apply()` --indirect_call--> `note()`  [INFERRED]
  src/conversations/OutboxSavedImplementation.tsx → server/cec/parking/resume-parked.ts
- `officeCapacity` --references--> `Role`  [EXTRACTED]
  server/office/projects.ts → src/shared.ts
- `StageContext` --references--> `Role`  [EXTRACTED]
  server/delivery/pipeline/accept-stage-result.ts → src/shared.ts

## Import Cycles
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/review-wait.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/parking/resume-provider-review.ts -> server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/parking/resume-provider-review.ts`
- 3-file cycle: `server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts`
- 4-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/readiness/review-wait.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
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
- 5-file cycle: `server/delivery/recovery/implementation/continuation-evidence.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/preparation/post-conflict-preparation.ts -> server/delivery/recovery/implementation/continuation-evidence.ts`

## Communities (112 total, 4 thin omitted)

### Community 0 - "conversations/slack.ts"
Cohesion: 0.17
Nodes (15): channelNoticeAuthorized(), assertConversationReadback(), MergeNotifications, SlackMessages, pump(), savePickup(), harperHandoff(), goalNoticeAuthorized() (+7 more)

### Community 1 - "Role"
Cohesion: 0.09
Nodes (46): label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+38 more)

### Community 2 - "dependency-bots/adopt.ts"
Cohesion: 0.05
Nodes (89): initialManualStart(), Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard (+81 more)

### Community 3 - "config.ts"
Cohesion: 0.13
Nodes (28): featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS, requestReplan(), reserveReplacement() (+20 more)

### Community 4 - "Inspector.tsx"
Cohesion: 0.11
Nodes (66): Outbox(), blockedSummary(), ServiceHealthPanel(), followUp(), labels, ServiceHealthRow(), BlockerFollowups(), LearningCoverage() (+58 more)

### Community 5 - "recovery/stopped-base-update.ts"
Cohesion: 0.08
Nodes (47): NOT_RETRYABLE, WRITER_STAGES, writerRestarted(), writerRestartPending(), deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput (+39 more)

### Community 6 - "session-bridge.ts"
Cohesion: 0.06
Nodes (53): ref_node_perf_hooks, ref_ws, claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexDaemonProcesses(), accountCodexProcesses() (+45 more)

### Community 7 - "Button"
Cohesion: 0.07
Nodes (70): ref_react, ref_react_markdown, ref_remark_gfm, ref_yaml, Activity(), ActivityTimeline(), AssignmentKnowledge(), Lookup() (+62 more)

### Community 8 - "candidate.ts"
Cohesion: 0.08
Nodes (32): ref_node_child_process, ref_node_url, file, folder, logs, root, GitRead, nativeGitRead() (+24 more)

### Community 9 - "engine.ts"
Cohesion: 0.08
Nodes (13): correlatedBuild(), checkMail(), drainMail(), requestMail(), enableNightly(), ingest(), drainMaintenance(), reconcileMaintenance() (+5 more)

### Community 10 - "worker-runtime.ts"
Cohesion: 0.07
Nodes (42): candidateWorkspaceEnvironment(), assignmentSubject(), dispatchExposure(), prepareExposure(), lessonPurpose(), selectLessons(), catalogLine(), assertBriefingScope() (+34 more)

### Community 11 - "scope-repair-resume.ts"
Cohesion: 0.31
Nodes (14): containedFile(), Ownership, reconcileScopeRepairReadback(), scopeRepairRequestResolved(), assertScopeRepairResumeFindings(), certain(), effects(), originalClaim() (+6 more)

### Community 12 - "App.tsx"
Cohesion: 0.04
Nodes (85): ref_lucide_react, ref_motion, ref_react_dom, itAgent(), itDiagnostics(), BrainDrawer(), themeColor, App() (+77 more)

### Community 13 - ".transaction"
Cohesion: 0.08
Nodes (56): approveFeature(), featureById(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), discoveryPrompt(), planPrompt() (+48 more)

### Community 14 - "assignments.ts"
Cohesion: 0.08
Nodes (36): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, GraphNode (+28 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.16
Nodes (44): requestDelivery(), createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest (+36 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.09
Nodes (44): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, blockingTrigger, isBlocking(), brainOverlap (+36 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.11
Nodes (38): baselineLearning(), LEARNING_BASELINES, maintainLearning(), configureKnowledge(), clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates() (+30 more)

### Community 18 - "http/commands.ts"
Cohesion: 0.12
Nodes (26): assertOwnership(), decideImplementation(), ImplementationDecision, OwnershipRead, Decision, requestQAPlanRetry(), bindDiscoveryResume(), DiscoveryResumeInput (+18 more)

### Community 19 - "GitHubDelivery"
Cohesion: 0.05
Nodes (74): deliveryIntakeBlocker(), GitHubDelivery, boardPreflightCandidate(), Ownership, savedActivationFailure(), adoptCandidate(), reported, Scope (+66 more)

### Community 20 - ".getEffect"
Cohesion: 0.18
Nodes (15): diagnosticProof(), ownedArtifact(), rawHash(), recoverDiscovery(), scopeNote(), publishFeature(), GitHubOperations, admitImprovement() (+7 more)

### Community 21 - "github-delivery.ts"
Cohesion: 0.04
Nodes (107): writerRestartInstruction(), restartStoppedWriters(), unchangedSinceAccepted(), writerRestartCandidate, Execute, SalvageRetry, salvageWorktree(), findingsBlock() (+99 more)

### Community 22 - "index.tsx"
Cohesion: 0.08
Nodes (40): FeatureQuestionProjection, FeatureRound, OutboxQuestionRound(), send(), FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace() (+32 more)

### Community 23 - "telemetry.ts"
Cohesion: 0.10
Nodes (26): CodexRollout, CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL (+18 more)

### Community 24 - "lesson-selection.ts"
Cohesion: 0.13
Nodes (19): INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, LessonSelection, MAINTENANCE, MAX_LESSONS, normalPath() (+11 more)

### Community 25 - "maintenance/maintenance.ts"
Cohesion: 0.06
Nodes (48): maintenancePolicies(), captureMaintenanceStep(), completeNativeCheckpoint(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, BrainStatusSchema, brainCheckpointCompletion() (+40 more)

### Community 26 - "cost-ledger.ts"
Cohesion: 0.15
Nodes (27): server_telemetry_cost_entries_costcoveragesummary, costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId(), OutsideEdit (+19 more)

### Community 27 - "ref_node_path"
Cohesion: 0.06
Nodes (103): ref_node_fs, ref_node_os, ref_node_path, closeoutReceipt(), Candidate, assertCoreCloseoutCoverage(), Assessment, closeoutClaim() (+95 more)

### Community 28 - "knowledge.ts"
Cohesion: 0.07
Nodes (39): curateLesson(), Curation, CurationAction, mergeEvidence(), lessonBrainAudit, LessonBrainOverlap, Kind, RetrospectiveResultSchema (+31 more)

### Community 29 - "jira-time.ts"
Cohesion: 0.16
Nodes (18): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+10 more)

### Community 30 - "digest"
Cohesion: 0.11
Nodes (54): ref_node_util, retryRead(), admitPRMetadata(), assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema, savedMetadataAssessment() (+46 more)

### Community 31 - "agents.ts"
Cohesion: 0.06
Nodes (46): IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), intakeMembership(), projectListScope(), cecIntakePrompt(), cecReadbackPrompt() (+38 more)

### Community 32 - "sanitize"
Cohesion: 0.07
Nodes (32): ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, pumpCTO(), queueCTOHandoff(), saveGoals(), pumpIT() (+24 more)

### Community 33 - "Goals.tsx"
Cohesion: 0.09
Nodes (32): ctoInputFailure(), OutboxCTOInput(), recover(), OutboxSavedImplementation(), apply(), review(), OutboxSavedPlan(), reconcile() (+24 more)

### Community 34 - "azure.ts"
Cohesion: 0.16
Nodes (20): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+12 more)

### Community 35 - "features.ts"
Cohesion: 0.08
Nodes (46): ref_node_crypto, packedConsumerPnpmRepair(), sha256(), commandFeature(), reviewQuestions(), automaticIntakeWait(), automaticTicketIntakeWait(), confirmBrief() (+38 more)

### Community 36 - "scheduled-work.ts"
Cohesion: 0.10
Nodes (34): freshOwnershipRead(), deliverySlot(), withAmendmentOwnership(), metadataRequestResolved(), preparationRequestResolved(), gateFeatureWork(), requestPriority(), closedTicketReport() (+26 more)

### Community 37 - "scheduler.ts"
Cohesion: 0.18
Nodes (13): officeCapacity, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch(), deliveryOccupied() (+5 more)

### Community 38 - "Ticket"
Cohesion: 0.15
Nodes (16): implementationWorkerContext(), confirmSetupStopCap(), consecutiveSetupStops(), SETUP_STOP_CAP, setupStop(), savedStageCompletion(), assertContinuableWorktree(), CONTINUABLE (+8 more)

### Community 39 - "local-config.ts"
Cohesion: 0.28
Nodes (11): AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), FeaturePlanningBindings, goalEvidencePath(), OfficeConfigInputs, officeConfigRoute(), officeConfigSummary(), CECBinding (+3 more)

### Community 40 - "inspect-closed-plan.ts"
Cohesion: 0.13
Nodes (17): Document, isAccessOnlyPlan(), settledAccessOnlyState(), closedReadonlyPlan(), Document, continueAccessOnlyPlan(), entryExists(), entryExists() (+9 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.13
Nodes (31): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), server_telemetry_billable_work_issue_key, isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence() (+23 more)

### Community 42 - "fact-bounds.ts"
Cohesion: 0.25
Nodes (15): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+7 more)

### Community 43 - "ledger.ts"
Cohesion: 0.23
Nodes (13): acceptedCompletionResolution(), investigationCandidates(), investigationId(), ctoReplacementResolution(), finishedSubjectResolution(), investigationFollowUps(), implementationReplacementResolution(), investigationResolution() (+5 more)

### Community 44 - "shared.ts"
Cohesion: 0.05
Nodes (74): removeAdoptedClone(), namedRepairIds(), activeEffectId(), pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), stoppedBaseCheckout(), saveStoppedBaseArtifact(), stoppedBaseHandoffResolved() (+66 more)

### Community 45 - "harness-baseline.ts"
Cohesion: 0.15
Nodes (20): baselineReport, BaselineSource, baselineText(), millions(), row(), share(), add(), BaselineState (+12 more)

### Community 46 - "OfficeScene.tsx"
Cohesion: 0.17
Nodes (33): withoutElapsed(), Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk() (+25 more)

### Community 47 - "time-readback.ts"
Cohesion: 0.33
Nodes (6): TimeLedger, dueReadback(), Readback, READBACK_INTERVAL_MS, readBackTime(), SETTLE_MS

### Community 48 - "currentAssignment"
Cohesion: 0.12
Nodes (28): Execute, installDependencies(), major(), harnessCloseout(), PASSING, verifyMergeActions(), HarnessControl, withHarnessWork() (+20 more)

### Community 49 - "demand-facts.ts"
Cohesion: 0.13
Nodes (22): clip(), DEMAND_LIMIT, demandFacts(), DemandSection, key(), LessonKey, notes(), clip() (+14 more)

### Community 50 - "learningDigest"
Cohesion: 0.26
Nodes (12): distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementIntakeGate(), learningDigest(), expireLearningPackets(), packetReferences() (+4 more)

### Community 51 - "daily-cto.ts"
Cohesion: 0.12
Nodes (19): evidenceRequestConflicts, dailyReviewPrompt(), applyGoalReview(), DailyResultSchema, EvidenceRefSchema, FreshDailyResultSchema, GoalEvidenceRequestSchema, statusAllowed() (+11 more)

### Community 52 - "outbox.ts"
Cohesion: 0.11
Nodes (29): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), ctoInputIdentityMatches(), ctoInputRecovered(), ADOPTION_STALLED_MS, conversationResolved(), projectOutbox() (+21 more)

### Community 53 - "cec.ts"
Cohesion: 0.11
Nodes (30): cecPrompt(), resolvedDecisionNote(), stageInstructions, settledReceiptNote(), stagePrompt(), StagePromptInput, METADATA_FINDING_GUIDANCE, conflictApprovalGuidance() (+22 more)

### Community 54 - "interrupted-work-recovery.ts"
Cohesion: 0.36
Nodes (7): interruptAdoptions(), legacy(), REMOVED_FIELDS, retireLegacyRecovery(), goalNoticeNeverDispatched(), maintenanceNoticeNeverDispatched(), recover()

### Community 55 - "weekly-rollup.ts"
Cohesion: 0.14
Nodes (27): learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), RollupResult (+19 more)

### Community 56 - "retrospective-subject.ts"
Cohesion: 0.16
Nodes (15): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, maintenanceKey(), azurePrUrl(), findSubject(), jobSubject() (+7 more)

### Community 57 - "TimeBook.tsx"
Cohesion: 0.09
Nodes (42): TelemetryReport, LiveAnchor, AzureBuild, src_shared_liveanchor, ROLE_NAMES, BreakdownTable(), CostBar(), coverage() (+34 more)

### Community 58 - "JiraIssuePublisher"
Cohesion: 0.11
Nodes (12): JiraIssuePublisher, keyOf(), descriptionPreimage(), plain(), publicationDescription(), FeaturePublisher, PublicationReceipt, GitHubIssuePublisher (+4 more)

### Community 59 - "control-store.ts"
Cohesion: 0.17
Nodes (11): ref_node_sqlite, systemClock, applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, statementCache(), initialSnapshot() (+3 more)

### Community 60 - "Store"
Cohesion: 0.05
Nodes (40): ref_zod, Assignment, Content, jiraText(), Transition, GitHubFeaturePublisher, JiraFeaturePublisher, reconcilePublication() (+32 more)

### Community 61 - "run.ts"
Cohesion: 0.18
Nodes (15): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, OFFICE_FIX_PROMPT, OfficeFixResult, validateOfficeFix(), investigationReady(), InvestigationOptions, InvestigationReport (+7 more)

### Community 62 - "knowledge-views.ts"
Cohesion: 0.17
Nodes (18): KnowledgeActivity, KnowledgeActivityPage, KnowledgeEdge, KnowledgeMap, KnowledgeNode, connectionSummary(), ConstellationView, DisplayNode (+10 more)

### Community 63 - "evidence-digest.ts"
Cohesion: 0.44
Nodes (7): canonical(), evidenceDigest(), evidenceHash(), semantic(), stableUrl(), requirementDrift(), RequirementPostimage

### Community 64 - "ticket-evidence.ts"
Cohesion: 0.15
Nodes (23): ref_node_string_decoder, assetDownloader(), attachmentKind(), evidenceDirectory(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS (+15 more)

### Community 65 - "run-accounting.ts"
Cohesion: 0.12
Nodes (33): BoundedRead, done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf(), backfillClaudeCost(), CompletionReader (+25 more)

### Community 66 - ".now"
Cohesion: 0.14
Nodes (9): Clock, checkpointMeasurement(), HEARTBEAT_GAP_MS, HEARTBEAT_MS, startMeasurement(), WorkOutcome, ExecutionLane, WorkClaim (+1 more)

### Community 67 - "security.ts"
Cohesion: 0.26
Nodes (8): snapshot(), safeOrigin(), sanitizeObject(), comparable(), EvidenceOutcome, recordRunEvidence(), parseWorkerResult(), RunAccounting

### Community 68 - "continue-unsealed-qa.ts"
Cohesion: 0.15
Nodes (21): continueOwnershipRead(), continueUnsealedQA(), entry(), expiredOwnershipRead(), handoffOwnership(), ReadbackOwnerDecision, ownershipReadGate(), ownershipReadState() (+13 more)

### Community 69 - "service-health.ts"
Cohesion: 0.21
Nodes (8): listenerHealth(), ProviderStatusChecks, Probe, probes, ServiceHealthChecks, DailyCTOSummary, HealthReport, ServiceHealth

### Community 70 - "constellation-runtime.ts"
Cohesion: 0.10
Nodes (22): ref_3d_force_graph, ref_three, CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point (+14 more)

### Community 71 - "contract.ts"
Cohesion: 0.17
Nodes (15): Event, one(), prePushRejection(), PushIdentity, settledPushBoundary(), At, errno, GroupInventory (+7 more)

### Community 72 - "work.ts"
Cohesion: 0.11
Nodes (21): BLOCKED_CAUSES, blockedCauses(), projectReadiness(), ProjectReadiness, HistoryRetirement, HistoryRetirementIntent, AssignmentResult, BlockedCause (+13 more)

### Community 73 - "report.ts"
Cohesion: 0.29
Nodes (12): Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked(), row() (+4 more)

### Community 74 - "goal-evidence.ts"
Cohesion: 0.19
Nodes (12): GitHubMonitor, githubPRDescription(), azureGoalFacts(), azurePRDescription(), boundedEvidence(), collectAzureGoalDocuments(), EvidenceStore, GOAL_EVIDENCE_LIMITS (+4 more)

### Community 75 - "offices.ts"
Cohesion: 0.08
Nodes (16): ref_smol_toml, QuestionNotifications, CommittedBrain, leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), seedOfficeLessons() (+8 more)

### Community 76 - "node-visuals.ts"
Cohesion: 0.20
Nodes (13): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+5 more)

### Community 77 - "ControlStore"
Cohesion: 0.18
Nodes (7): DailyCTO, EvidenceRequestConflict, reviewWeekday(), Briefing, saveReviewBriefing(), ControlStore, DailyCTOReport

### Community 78 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 79 - "create-candidate.ts"
Cohesion: 0.48
Nodes (6): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf()

### Community 80 - "index.ts"
Cohesion: 0.12
Nodes (20): ref_hono_node_server, ref_node_http, ref_vite, close(), config, itSpecialist, loadedRevision, offices (+12 more)

### Community 81 - "workKey"
Cohesion: 0.06
Nodes (57): interruptedImplementation(), recoverCTOInput(), recordJobApproach(), completedPRReviews(), continuationScope(), continuationGuard(), Assessment, discoveryRecoveryCandidate() (+49 more)

### Community 82 - "activation-recovery.ts"
Cohesion: 0.13
Nodes (30): ATTEMPT_DELAYS_MS, nextAttemptAt(), PrerequisitesSchema, classifyStop(), stopReason(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration() (+22 more)

### Community 83 - "evidence.ts"
Cohesion: 0.27
Nodes (9): investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_SOURCE_PATHS, officeSource(), requeueInvestigationEvidence(), launchPolicyFacts() (+1 more)

### Community 84 - "Outbox.tsx"
Cohesion: 0.09
Nodes (38): knowledgeOutbox(), Conversation(), SendMessage, LessonDecisionAction, lessonDecisionState(), readLessonDecision(), DAYS, dueLessonDecisions() (+30 more)

### Community 85 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (10): ref_react_three_drei, ref_react_three_fiber, ref_three_stdlib, CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility (+2 more)

### Community 87 - "api-routes.ts"
Cohesion: 0.17
Nodes (20): implementationPreview(), implementationContinuationRoute(), qaPlanRetryRoute(), featureRoute(), goalHistory(), DATA, LOCAL_BINDINGS, apiRoute() (+12 more)

### Community 88 - "it-specialist.ts"
Cohesion: 0.33
Nodes (8): ITContext, informationalRecovery(), publishITReport(), delays, recoverAttempt(), ITFollowUp, ITReport, ITState

### Community 89 - "recovery-ledger.ts"
Cohesion: 0.35
Nodes (8): savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), diagnosticSnapshot(), nativeDeliveryResolved(), reconcileRecoveryLedger(), stoppedBaseUpdateUnresolved()

### Community 90 - "superseded-receipts.ts"
Cohesion: 0.27
Nodes (8): Attempt, needsResumeReconciliation(), REVIEW_STAGES, stoppedInSetup(), Receipt, Settled, SETTLED_RECEIPT_NOTE, supersededReceipt()

### Community 91 - "jira-operations.ts"
Cohesion: 0.21
Nodes (13): CommentPage, commentReadback(), JiraOperations, jiraRecord(), unpack(), metadataDigest(), verifiedTransition(), verifyAlreadyAtStatus() (+5 more)

### Community 92 - "delivery-task.ts"
Cohesion: 0.31
Nodes (7): APPROACH_GUIDANCE, reviewInstructions(), deliveryTask(), DeliveryTaskInput, DISCOVERY_GUIDANCE, compactSteps(), featureDeliveryContext()

### Community 93 - "assignment-poll.ts"
Cohesion: 0.11
Nodes (27): ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR, plainSlackText() (+19 more)

### Community 94 - "qa-comment.ts"
Cohesion: 0.33
Nodes (7): OUTCOME, qaComment(), remote(), STAGE, plainWords(), tidy(), ReadableComment

### Community 95 - "capture-session-clone.py"
Cohesion: 0.15
Nodes (10): ctypes, errno, importlib_util, json, os, pathlib, Copy a coherent macOS clone of inherited reader fd3 to anonymous target fd4. No…, Read-only protocol adapter for the installed review helper. No model dispatch. (+2 more)

### Community 96 - "preferences-store.ts"
Cohesion: 0.21
Nodes (8): PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS, OfficePreferences

### Community 97 - "delivery-ownership.ts"
Cohesion: 0.33
Nodes (5): ref_node_async_hooks, Ownership, ownershipContext, refreshDeliveryOwnership(), RefreshOwnership

### Community 98 - ".save"
Cohesion: 0.12
Nodes (44): resolveBlockedTransition(), document(), transitionWithComment(), jiraAccount(), jiraCollection(), jiraCredential, KEYCHAIN_SERVICE, BLOCKED (+36 more)

### Community 99 - "codex-rollout.ts"
Cohesion: 0.29
Nodes (9): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO (+1 more)

### Community 100 - "diagnostic-context.ts"
Cohesion: 0.60
Nodes (3): assignmentDiagnostics(), diagnosticContext(), currentServices()

### Community 101 - "ITFollowUps.tsx"
Cohesion: 0.67
Nodes (4): itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps()

### Community 102 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 104 - "pilot-delivery.ts"
Cohesion: 0.10
Nodes (44): candidateBranchMoved(), continueImplementation(), applyIntakeObservation(), parksInJira(), dispatchNightly(), drainDelivery(), resume(), startPilot() (+36 more)

### Community 105 - "extract-worker.mjs"
Cohesion: 0.43
Nodes (6): ref_mammoth, ref_pdfjs_dist, bounded(), extract(), fail(), [path,kind]

### Community 110 - "coordination.ts"
Cohesion: 0.10
Nodes (41): Admission, admit(), IntakeContext, WAIT_STATUSES, compatible(), dependencyEligibility(), DependencyStores, issueKey() (+33 more)

### Community 111 - ".emit"
Cohesion: 0.06
Nodes (14): reconcileNoticeConfirmations(), comparableSlackText(), dependencyCompletionKey(), BrainFollowup, reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION (+6 more)

### Community 113 - "cli.ts"
Cohesion: 0.20
Nodes (8): ref_node_stream, ref_node_timers, args, [cmd,...rawArgs], commands, key, projectIndex, PORT

### Community 121 - "restoreInPlace"
Cohesion: 0.60
Nodes (5): identity(), Json, plain(), restorable(), restoreInPlace()

## Knowledge Gaps
- **496 isolated node(s):** `STAGE`, `OUTCOME`, `PreferenceCandidate`, `ButtonProps`, `People` (+491 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 639 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `conversations/slack.ts`, `dependency-bots/adopt.ts`, `config.ts`, `recovery/stopped-base-update.ts`, `session-bridge.ts`, `candidate.ts`, `engine.ts`, `worker-runtime.ts`, `scope-repair-resume.ts`, `App.tsx`, `.transaction`, `assignments.ts`, `scheduled-captures.ts`, `run-retrospective.ts`, `record-trigger.ts`, `http/commands.ts`, `GitHubDelivery`, `.getEffect`, `github-delivery.ts`, `lesson-selection.ts`, `maintenance/maintenance.ts`, `cost-ledger.ts`, `ref_node_path`, `jira-time.ts`, `digest`, `agents.ts`, `sanitize`, `azure.ts`, `features.ts`, `scheduled-work.ts`, `scheduler.ts`, `Ticket`, `inspect-closed-plan.ts`, `time-scope.ts`, `ledger.ts`, `shared.ts`, `time-readback.ts`, `currentAssignment`, `demand-facts.ts`, `learningDigest`, `daily-cto.ts`, `outbox.ts`, `cec.ts`, `interrupted-work-recovery.ts`, `weekly-rollup.ts`, `retrospective-subject.ts`, `control-store.ts`, `run.ts`, `ticket-evidence.ts`, `run-accounting.ts`, `.now`, `security.ts`, `continue-unsealed-qa.ts`, `goal-evidence.ts`, `offices.ts`, `create-candidate.ts`, `workKey`, `activation-recovery.ts`, `evidence.ts`, `api-routes.ts`, `it-specialist.ts`, `recovery-ledger.ts`, `jira-operations.ts`, `delivery-task.ts`, `assignment-poll.ts`, `.save`, `diagnostic-context.ts`, `pilot-delivery.ts`, `coordination.ts`, `.emit`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Why does `command()` connect `Store` to `dependency-bots/adopt.ts`, `config.ts`, `session-bridge.ts`, `candidate.ts`, `engine.ts`, `worker-runtime.ts`, `.transaction`, `assignments.ts`, `GitHubDelivery`, `github-delivery.ts`, `maintenance/maintenance.ts`, `cost-ledger.ts`, `ref_node_path`, `jira-time.ts`, `digest`, `agents.ts`, `azure.ts`, `Ticket`, `inspect-closed-plan.ts`, `shared.ts`, `time-readback.ts`, `currentAssignment`, `weekly-rollup.ts`, `ticket-evidence.ts`, `continue-unsealed-qa.ts`, `service-health.ts`, `contract.ts`, `goal-evidence.ts`, `create-candidate.ts`, `workKey`, `jira-operations.ts`, `assignment-poll.ts`, `.save`, `pilot-delivery.ts`, `coordination.ts`, `CommandRegistry`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `TicketJob` connect `github-delivery.ts` to `dependency-bots/adopt.ts`, `Inspector.tsx`, `recovery/stopped-base-update.ts`, `scope-repair-resume.ts`, `App.tsx`, `record-trigger.ts`, `GitHubDelivery`, `maintenance/maintenance.ts`, `ref_node_path`, `digest`, `scheduled-work.ts`, `scheduler.ts`, `fact-bounds.ts`, `shared.ts`, `currentAssignment`, `cec.ts`, `interrupted-work-recovery.ts`, `retrospective-subject.ts`, `create-candidate.ts`, `workKey`, `activation-recovery.ts`, `it-specialist.ts`, `delivery-task.ts`, `pilot-delivery.ts`, `coordination.ts`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `STAGE`, `OUTCOME`, `PreferenceCandidate` to the rest of the system?**
  _496 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Role` be split into smaller, more focused modules?**
  _Cohesion score 0.09427609427609428 - nodes in this community are weakly interconnected._
- **Should `dependency-bots/adopt.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.050826446280991734 - nodes in this community are weakly interconnected._
- **Should `config.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13429951690821257 - nodes in this community are weakly interconnected._