# Graph Report - the-office  (2026-11-16)

## Corpus Check
- 851 files · ~336,099 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4146 nodes · 19045 edges · 109 communities (102 shown, 7 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 612 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `fff0a8ac`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- index.tsx
- PeoplePanel.tsx
- dependency-bots/adopt.ts
- config.ts
- Inspector.tsx
- .activeClaims
- session-bridge.ts
- ref_react
- agents.ts
- engine.ts
- worker-runtime.ts
- outbox.ts
- App.tsx
- authorize.ts
- assignments.ts
- scheduled-captures.ts
- run-retrospective.ts
- record-trigger.ts
- assignment-poll.ts
- ref_node_path
- github/issue-publication.ts
- github-delivery.ts
- QuestionStepper.tsx
- run-cost.ts
- http/commands.ts
- maintenance/maintenance.ts
- cost-ledger.ts
- workKey
- preparation-readback.ts
- jira-time.ts
- TicketJob
- Ticket
- .emit
- SectionTitle
- security.ts
- accept-stage-result.ts
- scheduled-work.ts
- Store
- digest
- effects.ts
- remove-candidate.ts
- WorkTime
- weekly-rollup.ts
- codex-rollout.ts
- intent.ts
- Coordinator
- cx
- github.ts
- ledger.ts
- knowledge.ts
- interrupted-work-recovery.ts
- blocker-followups.ts
- create-candidate.ts
- cec.ts
- work.ts
- daily-cto.ts
- coordination-tick.ts
- TimeBook.tsx
- retrospective-subject.ts
- store.ts
- Offices
- processGroupAlive
- conversations/slack.ts
- service-health.ts
- ticket-evidence.ts
- owned-artifact.ts
- tracking-issue.ts
- ticket-stage-runner.ts
- continue-ownership-read.ts
- run-accounting.ts
- constellation-runtime.ts
- process.ts
- CEC
- report.ts
- it-specialist.ts
- admit-improvement.ts
- GitHubIssuePublisher
- fact-bounds.ts
- JiraIssuePublisher
- checkpoint-completion.ts
- cli.ts
- lesson-selection.ts
- inspect-closed-plan.ts
- Effects
- work-summary.ts
- telemetry.ts
- src_shared_workkey
- index.ts
- discovery-recovery.ts
- continue-unsealed-qa.ts
- pilot-delivery.ts
- cec/issue-publication.ts
- lesson-digest.ts
- retire-history.ts
- run-usage.ts
- capture-session-clone.py
- shared.ts
- OfficeSnapshot
- .save
- CommittedBrain
- packed-consumer-pnpm.ts
- refresh-evidence.ts
- extract-worker.mjs
- ProjectProgress
- features.ts
- command-registry.ts
- highestStableAtLeast
- server_delivery_harness_delivery_authority_resolvedeliverywork
- server_delivery_recovery_stopped_base_audit_native

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
- `UnrecordedResult` --references--> `StageResult`  [EXTRACTED]
  server/cec/unrecorded-result.ts → src/shared.ts
- `DeliveryAuthorityInput` --references--> `HarnessRequest`  [EXTRACTED]
  server/delivery/harness/delivery-authority.ts → src/contracts/work.ts
- `apply()` --indirect_call--> `note()`  [INFERRED]
  src/conversations/OutboxSavedImplementation.tsx → server/cec/parking/resume-parked.ts
- `DeliveryTaskInput` --references--> `TicketJob`  [EXTRACTED]
  server/delivery/pipeline/delivery-task.ts → src/shared.ts
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
- 4-file cycle: `server/delivery/recovery/implementation/saved-prerequisite-handoff.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/implementation/saved-prerequisite-handoff.ts`
- 4-file cycle: `server/delivery/recovery/validation/validation-readback.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/validation/validation-readback.ts`
- 4-file cycle: `server/delivery/recovery/implementation/activation-recovery.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/implementation/activation-recovery.ts`
- 4-file cycle: `server/delivery/recovery/stopped-base-review.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/stopped-base-review.ts`
- 4-file cycle: `server/features/delivery-binding.ts -> server/features/enrollment-gate.ts -> server/features/progression/failure.ts -> server/store/effects.ts -> server/features/delivery-binding.ts`
- 5-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/stage-reconciliation.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 5-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 5-file cycle: `server/delivery/recovery/implementation/continuation-evidence.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/recovery/implementation/continuation-evidence.ts`
- 5-file cycle: `server/delivery/recovery/implementation/saved-prerequisite-handoff.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/recovery/implementation/saved-prerequisite-handoff.ts`
- 5-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/scope-repair/scope-repair-resume.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 5-file cycle: `server/delivery/recovery/scope-repair/scope-repair-readback.ts -> server/delivery/recovery/scope-repair/scope-repair-resume.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/scope-repair/scope-repair-readback.ts`
- 5-file cycle: `server/delivery/recovery/implementation/continuation-evidence.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/implementation/implementation-recovery.ts -> server/delivery/recovery/implementation/continuation-evidence.ts`
- 5-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/closeout/github-closeout.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`

## Communities (109 total, 7 thin omitted)

### Community 0 - "index.tsx"
Cohesion: 0.11
Nodes (46): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView() (+38 more)

### Community 1 - "PeoplePanel.tsx"
Cohesion: 0.10
Nodes (41): label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+33 more)

### Community 2 - "dependency-bots/adopt.ts"
Cohesion: 0.15
Nodes (23): adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR, openDependabotPulls(), readRepo() (+15 more)

### Community 3 - "config.ts"
Cohesion: 0.11
Nodes (44): ref_node_crypto, commandFeature(), reviewQuestions(), featureItemComplete(), reconcileFeatureCompletion(), discoveryPrompt(), planPrompt(), GitHubFeaturePublisher (+36 more)

### Community 4 - "Inspector.tsx"
Cohesion: 0.08
Nodes (67): LessonDecisionAction, lessonDecisionState(), readLessonDecision(), OutboxLessonDecision(), act(), readStatus(), FeatureWorkspace(), blockedSummary() (+59 more)

### Community 5 - ".activeClaims"
Cohesion: 0.07
Nodes (53): nextAttemptAt(), NOT_RETRYABLE, WRITER_STAGES, writerRestartCandidate, writerRestarted(), writerRestartPending(), deliveryAdmission(), assessDeliveryAuthority() (+45 more)

### Community 6 - "session-bridge.ts"
Cohesion: 0.06
Nodes (53): ref_node_perf_hooks, ref_ws, claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexDaemonProcesses(), accountCodexProcesses() (+45 more)

### Community 7 - "ref_react"
Cohesion: 0.08
Nodes (58): ref_react, ref_react_markdown, ref_remark_gfm, ref_yaml, KnowledgeActivity, KnowledgeActivityPage, KnowledgeEdge, KnowledgeMap (+50 more)

### Community 8 - "agents.ts"
Cohesion: 0.07
Nodes (33): implementationWorkerContext(), savedStageCompletion(), assertContinuableWorktree(), CONTINUABLE, continuationPrompt(), MAX_CONTINUATIONS, recordedContinuation(), stageContinuation (+25 more)

### Community 9 - "engine.ts"
Cohesion: 0.08
Nodes (10): applyIntakeObservation(), checkMail(), drainMail(), requestMail(), enableNightly(), ingest(), drainMaintenance(), reconcileMaintenance() (+2 more)

### Community 10 - "worker-runtime.ts"
Cohesion: 0.06
Nodes (40): itChatPrompt(), candidateWorkspaceEnvironment(), ApproachSchema, assignmentDiagnostics(), diagnosticContext(), assignmentSubject(), catalogLine(), assertBriefingScope() (+32 more)

### Community 11 - "outbox.ts"
Cohesion: 0.13
Nodes (22): ADOPTION_STALLED_MS, projectOutbox(), syncOutbox(), projectSlackDeliveries(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint() (+14 more)

### Community 12 - "App.tsx"
Cohesion: 0.05
Nodes (64): ref_lucide_react, ref_motion, ref_react_dom, Conversation(), SlackDeliveryCard(), BrainDrawer(), themeColor, App() (+56 more)

### Community 13 - "authorize.ts"
Cohesion: 0.06
Nodes (61): ref_node_url, approveFeature(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), artifactPath(), digest() (+53 more)

### Community 14 - "assignments.ts"
Cohesion: 0.09
Nodes (35): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, GraphNode (+27 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.15
Nodes (43): createFeature(), assertEnrollable(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest, captureRequests(), failCapture() (+35 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.09
Nodes (42): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, blockingTrigger, brainOverlap, brainOverlapQuery() (+34 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.09
Nodes (46): isBlocking(), baselineLearning(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences(), busyMaintenanceIds(), clip() (+38 more)

### Community 18 - "assignment-poll.ts"
Cohesion: 0.10
Nodes (30): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice() (+22 more)

### Community 19 - "ref_node_path"
Cohesion: 0.07
Nodes (90): ref_node_fs, ref_node_os, ref_node_path, ref_node_util, ownershipReadHistory(), recoverCTOInput(), allowed, continuationNativeReview() (+82 more)

### Community 20 - "github/issue-publication.ts"
Cohesion: 0.19
Nodes (26): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard, projectCards() (+18 more)

### Community 21 - "github-delivery.ts"
Cohesion: 0.05
Nodes (78): writerRestartInstruction(), restartStoppedWriters(), unchangedSinceAccepted(), Execute, SalvageRetry, salvageWorktree(), BOARD_RULE, conflictRefreshInstruction() (+70 more)

### Community 22 - "QuestionStepper.tsx"
Cohesion: 0.13
Nodes (26): FeatureHarnessOption, FeatureOption, FeatureQuestion, FeatureQuestionProjection, OutboxQuestionRound(), send(), draftKey(), readDraft() (+18 more)

### Community 23 - "run-cost.ts"
Cohesion: 0.17
Nodes (15): CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL, Rates (+7 more)

### Community 24 - "http/commands.ts"
Cohesion: 0.17
Nodes (21): requestQAPlanRetry(), enqueueMetadataRecovery(), normalizeStatement(), configureKnowledge(), declineLessonIssue(), reactivateLesson(), retireLesson(), decideOfficeProposal() (+13 more)

### Community 25 - "maintenance/maintenance.ts"
Cohesion: 0.10
Nodes (28): maintenancePolicies(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice(), candidateOwner(), SETTLED (+20 more)

### Community 26 - "cost-ledger.ts"
Cohesion: 0.13
Nodes (31): captureCost(), server_telemetry_cost_entries_costcoveragesummary, costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress() (+23 more)

### Community 27 - "workKey"
Cohesion: 0.05
Nodes (85): pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), completedPRReviews(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation() (+77 more)

### Community 28 - "preparation-readback.ts"
Cohesion: 0.12
Nodes (28): assertPostConflictOwnership(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), routeReadyPostConflictPublication(), verifyInitialDraftConflictPreparation(), bindPreparationBoardOrigins(), claimSchema, eventSchema (+20 more)

### Community 29 - "jira-time.ts"
Cohesion: 0.16
Nodes (18): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+10 more)

### Community 30 - "TicketJob"
Cohesion: 0.06
Nodes (89): harnessCloseout(), PASSING, verifyMergeActions(), requireDeliveryAuthority(), activeEffectId(), harnessEffect, assertDeliveryMayMutate(), HarnessControl (+81 more)

### Community 31 - "Ticket"
Cohesion: 0.09
Nodes (30): IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), intakeMembership(), projectListScope(), cecIntakePrompt(), cecReadbackPrompt() (+22 more)

### Community 32 - ".emit"
Cohesion: 0.11
Nodes (29): ref_zod, assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO() (+21 more)

### Community 33 - "SectionTitle"
Cohesion: 0.10
Nodes (33): SendMessage, labels, ServiceHealthRow(), CTOReview(), goalState, DailyCTO(), reportDate(), reviewStatus (+25 more)

### Community 34 - "security.ts"
Cohesion: 0.10
Nodes (33): az(), AzureMonitor, base, buildUrl(), correlatedBuild(), prUrl(), readInPairs(), ProviderPR (+25 more)

### Community 35 - "accept-stage-result.ts"
Cohesion: 0.07
Nodes (71): containedFile(), removeAdoptedClone(), findingsBlock(), namedRepairIds(), DECISION_KINDS, needsDecision(), acceptStageResult(), acceptConflictRepair() (+63 more)

### Community 36 - "scheduled-work.ts"
Cohesion: 0.08
Nodes (41): ref_node_async_hooks, freshOwnershipRead(), deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), Ownership, ownershipContext, refreshDeliveryOwnership() (+33 more)

### Community 37 - "Store"
Cohesion: 0.07
Nodes (29): ROLES, helperTelemetry(), observeHelperGroups(), stopHelperGroups(), FeatureReviewRunner, stopReview(), dispatchExposure(), prepareExposure() (+21 more)

### Community 38 - "digest"
Cohesion: 0.09
Nodes (56): accounting, DeliverySubject, nonDelivery, originalReads, closeoutReceipt(), boardPreflightCandidate(), Ownership, reconcileBoardPreflight() (+48 more)

### Community 39 - "effects.ts"
Cohesion: 0.14
Nodes (14): featureById(), Link, linkFeature(), FeaturePublisher, publishFeature(), reconcilePublication(), uncertainPublications(), reserveIdentity() (+6 more)

### Community 40 - "remove-candidate.ts"
Cohesion: 0.18
Nodes (18): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot() (+10 more)

### Community 41 - "WorkTime"
Cohesion: 0.13
Nodes (33): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), server_telemetry_billable_work_issue_key, isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence() (+25 more)

### Community 42 - "weekly-rollup.ts"
Cohesion: 0.13
Nodes (27): learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), retire(), BRAIN_SCOPE, RollupResult (+19 more)

### Community 43 - "codex-rollout.ts"
Cohesion: 0.27
Nodes (10): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO (+2 more)

### Community 44 - "intent.ts"
Cohesion: 0.13
Nodes (25): GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles(), ContinuationIO (+17 more)

### Community 45 - "Coordinator"
Cohesion: 0.08
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 46 - "cx"
Cohesion: 0.08
Nodes (64): ref_react_three_drei, ref_react_three_fiber, ref_three_stdlib, displayAgentTask(), githubStageLabels, withoutElapsed(), CameraBookmark, restoreBookmark() (+56 more)

### Community 47 - "github.ts"
Cohesion: 0.26
Nodes (6): GitHubMonitor, githubPRDescription(), GOAL_EVIDENCE_LIMITS, GitHubBoard, GitHubPR, GitHubState

### Community 48 - "ledger.ts"
Cohesion: 0.18
Nodes (16): ctoInputIdentityMatches(), ctoInputRecovered(), acceptedCompletionResolution(), investigationCandidates(), investigationId(), ctoReplacementResolution(), finishedSubjectResolution(), investigationFollowUps() (+8 more)

### Community 49 - "knowledge.ts"
Cohesion: 0.07
Nodes (40): clip(), DEMAND_LIMIT, demandFacts(), DemandSection, key(), LessonKey, notes(), clip() (+32 more)

### Community 50 - "interrupted-work-recovery.ts"
Cohesion: 0.36
Nodes (7): interruptAdoptions(), legacy(), REMOVED_FIELDS, retireLegacyRecovery(), goalNoticeNeverDispatched(), maintenanceNoticeNeverDispatched(), recover()

### Community 51 - "blocker-followups.ts"
Cohesion: 0.19
Nodes (18): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), readBackConversations(), handoff(), reconcileBlockerFollowups(), improvementIntakeGate() (+10 more)

### Community 52 - "create-candidate.ts"
Cohesion: 0.31
Nodes (9): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+1 more)

### Community 53 - "cec.ts"
Cohesion: 0.10
Nodes (30): cecPrompt(), resolvedDecisionNote(), stageInstructions, settledReceiptNote(), APPROACH_GUIDANCE, reviewInstructions(), deliveryTask(), DeliveryTaskInput (+22 more)

### Community 54 - "work.ts"
Cohesion: 0.07
Nodes (40): BLOCKED_CAUSES, blockedCauses(), projectReadiness(), baselineReport, BaselineSource, baselineText(), millions(), row() (+32 more)

### Community 55 - "daily-cto.ts"
Cohesion: 0.07
Nodes (30): DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), applyGoalReview(), DailyResultSchema, EvidenceRefSchema, FreshDailyResultSchema (+22 more)

### Community 56 - "coordination-tick.ts"
Cohesion: 0.13
Nodes (13): BrainFollowup, Result, brainCheckpointCompletion(), reconcileCompletedCheckpoints(), legacy, reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS (+5 more)

### Community 57 - "TimeBook.tsx"
Cohesion: 0.11
Nodes (36): TelemetryReport, AzureBuild, src_shared_liveanchor, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens() (+28 more)

### Community 58 - "retrospective-subject.ts"
Cohesion: 0.18
Nodes (15): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+7 more)

### Community 59 - "store.ts"
Cohesion: 0.09
Nodes (29): ref_node_sqlite, ref_smol_toml, queueLessonIssueCheck(), queueImprovements(), Clock, systemClock, DELIVERY_CONCURRENCY, file (+21 more)

### Community 61 - "processGroupAlive"
Cohesion: 0.13
Nodes (25): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, syncInvestigations(), OFFICE_FIX_PROMPT (+17 more)

### Community 62 - "conversations/slack.ts"
Cohesion: 0.17
Nodes (10): reconcileNoticeConfirmations(), comparableSlackText(), settleRequestedSlackReplacement(), SlackMessages, SlackRequestSchema, SlackResultSchema, SlackVerificationSchema, goalNoticeAuthorized() (+2 more)

### Community 63 - "service-health.ts"
Cohesion: 0.17
Nodes (11): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, slackHealth() (+3 more)

### Community 64 - "ticket-evidence.ts"
Cohesion: 0.14
Nodes (22): ref_node_string_decoder, assetDownloader(), attachmentKind(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS, EvidenceAttachment (+14 more)

### Community 65 - "owned-artifact.ts"
Cohesion: 0.20
Nodes (15): done(), readBoundedNoFollow(), readBoundedNoFollowSync(), reasonOf(), codexHome(), createdAt(), dayDirs(), header() (+7 more)

### Community 66 - "tracking-issue.ts"
Cohesion: 0.15
Nodes (20): readBackOrThrow(), retryRead(), ensureTrackingIssue(), findTrackingIssue(), ownTracking(), TrackingIssue, trackingIssueBody(), trackingIssueTitle() (+12 more)

### Community 67 - "ticket-stage-runner.ts"
Cohesion: 0.17
Nodes (25): parksInJira(), ownReceipts(), run(), UnrecordedResult, unrecordedStageResult(), publicationEvidenceGap(), qaEvidenceGap(), stageResultGap() (+17 more)

### Community 68 - "continue-ownership-read.ts"
Cohesion: 0.25
Nodes (11): continueOwnershipRead(), expiredOwnershipRead(), ownershipReadGate(), ownershipReadState(), ownershipReadSource(), ReadOwnershipView, scheduledOwnershipRead(), LiveSession (+3 more)

### Community 69 - "run-accounting.ts"
Cohesion: 0.17
Nodes (12): BoundedRead, backfillClaudeCost(), CompletionReader, COMPLETION_MAX_BYTES, completionAccounting(), markCaptureStart(), readCompletion(), RECONCILE_GRACE_MS (+4 more)

### Community 70 - "constellation-runtime.ts"
Cohesion: 0.07
Nodes (35): ref_3d_force_graph, ref_three, ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), CameraPose (+27 more)

### Community 71 - "process.ts"
Cohesion: 0.08
Nodes (30): ref_node_child_process, file, folder, logs, root, Event, one(), prePushRejection() (+22 more)

### Community 72 - "CEC"
Cohesion: 0.21
Nodes (10): CommentPage, commentReadback(), JiraOperations, plain(), jiraRecord(), unpack(), metadataDigest(), verifiedTransition() (+2 more)

### Community 73 - "report.ts"
Cohesion: 0.29
Nodes (12): Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked(), row() (+4 more)

### Community 74 - "it-specialist.ts"
Cohesion: 0.17
Nodes (16): savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), ITContext, diagnosticSnapshot(), informationalRecovery(), publishITReport() (+8 more)

### Community 75 - "admit-improvement.ts"
Cohesion: 0.29
Nodes (12): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+4 more)

### Community 76 - "GitHubIssuePublisher"
Cohesion: 0.28
Nodes (4): PublicationReceipt, GitHubIssuePublisher, number(), same()

### Community 77 - "fact-bounds.ts"
Cohesion: 0.18
Nodes (19): leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance() (+11 more)

### Community 78 - "JiraIssuePublisher"
Cohesion: 0.22
Nodes (5): JiraIssuePublisher, keyOf(), publicationDescription(), FeatureManifestItem, FeatureOperation

### Community 79 - "checkpoint-completion.ts"
Cohesion: 0.17
Nodes (13): completeNativeCheckpoint(), BrainStatusSchema, identity, coverageSchema, followupSchema, verified, queueCheckpointRetry(), readBackCheckpoint() (+5 more)

### Community 80 - "cli.ts"
Cohesion: 0.17
Nodes (8): ref_node_stream, ref_node_timers, args, [cmd,...rawArgs], commands, key, projectIndex, lessonBrainAudit

### Community 81 - "lesson-selection.ts"
Cohesion: 0.06
Nodes (45): lessonIssueBody(), lessonIssueMarker(), LessonBrainOverlap, INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose() (+37 more)

### Community 82 - "inspect-closed-plan.ts"
Cohesion: 0.18
Nodes (11): OwnershipRead, closedReadonlyPlan(), Document, entryExists(), inspectClosedQAPlan(), Decision, reviewedPlanGuidance, reviewedPlanGuideDigest (+3 more)

### Community 83 - "Effects"
Cohesion: 0.19
Nodes (9): GitHubOperations, fileLessonIssue(), sendGoalNotice(), Assessment, closeNativeRefresh(), fingerprint(), sendMaintenanceNotice(), Effects (+1 more)

### Community 84 - "work-summary.ts"
Cohesion: 0.16
Nodes (24): envelopeCard, eyebrow, deliveryRepairProjection(), DependencyNotice(), ACTIVE, maintenanceUpdate(), PMQueueItem, pmQueueItems() (+16 more)

### Community 85 - "telemetry.ts"
Cohesion: 0.14
Nodes (12): EvidenceOutcome, CostCompleteness, CostComponent, CostLedgerState, ProviderBasis, RunAccounting, RunCost, TelemetryRow (+4 more)

### Community 87 - "index.ts"
Cohesion: 0.06
Nodes (52): ref_hono_node_server, ref_node_http, ref_vite, implementationPreview(), implementationContinuationRoute(), qaPlanRetryRoute(), AUTO_ADOPT_BOTS, assertFeaturePlanningConfig() (+44 more)

### Community 88 - "discovery-recovery.ts"
Cohesion: 0.26
Nodes (11): Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership, rawHash() (+3 more)

### Community 89 - "continue-unsealed-qa.ts"
Cohesion: 0.24
Nodes (11): continueUnsealedQA(), entry(), handoffOwnership(), ReadbackOwnerDecision, readOwnershipCandidate, qaPlanEvidenceGap(), qaRunDirectory(), OfficeQAHandoff (+3 more)

### Community 90 - "pilot-delivery.ts"
Cohesion: 0.09
Nodes (33): candidateBranchMoved(), continueImplementation(), drainDelivery(), resume(), startPilot(), Document, isAccessOnlyPlan(), settledAccessOnlyState() (+25 more)

### Community 91 - "cec/issue-publication.ts"
Cohesion: 0.23
Nodes (7): Assignment, Content, jiraText(), Transition, descriptionPreimage(), plain(), JiraFeaturePublisher

### Community 92 - "lesson-digest.ts"
Cohesion: 0.31
Nodes (8): knowledgeOutbox(), DAYS, dueLessonDecisions(), easternWeek(), LESSON_DIGEST, LessonDecision, PARTS, pendingLessonDecisions()

### Community 93 - "retire-history.ts"
Cohesion: 0.31
Nodes (8): readHistoryScope(), enqueueHistoryRetirement(), historicalRecordDigest(), Intent, records(), retireIncompleteHistory(), HistoryRetirement, HistoryRetirementIntent

### Community 94 - "run-usage.ts"
Cohesion: 0.29
Nodes (6): CodexRollout, claudeAccounting(), claudeUsage(), codexUsage(), count(), RunUsage

### Community 95 - "capture-session-clone.py"
Cohesion: 0.15
Nodes (10): ctypes, errno, importlib_util, json, os, pathlib, Copy a coherent macOS clone of inherited reader fd3 to anonymous target fd4. No…, Read-only protocol adapter for the installed review helper. No model dispatch. (+2 more)

### Community 96 - "shared.ts"
Cohesion: 0.06
Nodes (28): PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, OfficeQAReport, QAPlanContinuation, SlackReplacementRequest (+20 more)

### Community 97 - "OfficeSnapshot"
Cohesion: 0.09
Nodes (32): Outbox(), ctoInputFailure(), OutboxCTOInput(), recover(), OutboxLessonDigest(), OutboxMaintenanceStatus(), OutboxSavedImplementation(), apply() (+24 more)

### Community 98 - ".save"
Cohesion: 0.12
Nodes (43): resolveBlockedTransition(), document(), transitionWithComment(), jiraAccount(), jiraCollection(), jiraCredential, KEYCHAIN_SERVICE, BLOCKED (+35 more)

### Community 102 - "refresh-evidence.ts"
Cohesion: 0.33
Nodes (10): evidenceDirectory(), readEvidence(), ProviderEvidence, canonical(), evidenceDigest(), evidenceHash(), semantic(), stableUrl() (+2 more)

### Community 105 - "extract-worker.mjs"
Cohesion: 0.43
Nodes (6): ref_mammoth, ref_pdfjs_dist, bounded(), extract(), fail(), [path,kind]

### Community 110 - "features.ts"
Cohesion: 0.07
Nodes (60): dispatchNightly(), requestDelivery(), eligibility(), MergeNotifications, ATTEMPT_DELAYS_MS, Admission, admit(), IntakeContext (+52 more)

### Community 112 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 116 - "highestStableAtLeast"
Cohesion: 0.83
Nodes (3): compare(), highestStableAtLeast(), parts()

## Knowledge Gaps
- **494 isolated node(s):** `KEYCHAIN_SERVICE`, `PreferenceCandidate`, `People`, `OrgTree`, `ChartProps` (+489 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 635 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `dependency-bots/adopt.ts`, `config.ts`, `.activeClaims`, `session-bridge.ts`, `agents.ts`, `engine.ts`, `worker-runtime.ts`, `outbox.ts`, `authorize.ts`, `assignments.ts`, `scheduled-captures.ts`, `run-retrospective.ts`, `record-trigger.ts`, `assignment-poll.ts`, `ref_node_path`, `github/issue-publication.ts`, `github-delivery.ts`, `http/commands.ts`, `maintenance/maintenance.ts`, `cost-ledger.ts`, `workKey`, `preparation-readback.ts`, `jira-time.ts`, `TicketJob`, `Ticket`, `.emit`, `security.ts`, `accept-stage-result.ts`, `scheduled-work.ts`, `digest`, `effects.ts`, `remove-candidate.ts`, `WorkTime`, `weekly-rollup.ts`, `intent.ts`, `Coordinator`, `github.ts`, `ledger.ts`, `knowledge.ts`, `interrupted-work-recovery.ts`, `blocker-followups.ts`, `create-candidate.ts`, `cec.ts`, `daily-cto.ts`, `coordination-tick.ts`, `retrospective-subject.ts`, `store.ts`, `processGroupAlive`, `conversations/slack.ts`, `ticket-evidence.ts`, `tracking-issue.ts`, `ticket-stage-runner.ts`, `continue-ownership-read.ts`, `run-accounting.ts`, `process.ts`, `CEC`, `it-specialist.ts`, `admit-improvement.ts`, `GitHubIssuePublisher`, `fact-bounds.ts`, `JiraIssuePublisher`, `checkpoint-completion.ts`, `lesson-selection.ts`, `inspect-closed-plan.ts`, `Effects`, `telemetry.ts`, `index.ts`, `discovery-recovery.ts`, `continue-unsealed-qa.ts`, `pilot-delivery.ts`, `cec/issue-publication.ts`, `retire-history.ts`, `OfficeSnapshot`, `.save`, `refresh-evidence.ts`, `ProjectProgress`, `features.ts`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **Why does `Role` connect `worker-runtime.ts` to `PeoplePanel.tsx`, `Inspector.tsx`, `agents.ts`, `outbox.ts`, `App.tsx`, `github-delivery.ts`, `http/commands.ts`, `maintenance/maintenance.ts`, `TicketJob`, `Ticket`, `.emit`, `accept-stage-result.ts`, `Store`, `cx`, `cec.ts`, `work.ts`, `retrospective-subject.ts`, `store.ts`, `run-accounting.ts`, `index.ts`, `shared.ts`, `OfficeSnapshot`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `OfficeSnapshot` connect `OfficeSnapshot` to `index.tsx`, `PeoplePanel.tsx`, `Inspector.tsx`, `ref_react`, `agents.ts`, `outbox.ts`, `App.tsx`, `assignment-poll.ts`, `maintenance/maintenance.ts`, `Ticket`, `SectionTitle`, `security.ts`, `accept-stage-result.ts`, `Store`, `cx`, `ledger.ts`, `interrupted-work-recovery.ts`, `work.ts`, `TimeBook.tsx`, `store.ts`, `service-health.ts`, `fact-bounds.ts`, `cli.ts`, `work-summary.ts`, `index.ts`, `lesson-digest.ts`, `shared.ts`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **What connects `KEYCHAIN_SERVICE`, `PreferenceCandidate`, `People` to the rest of the system?**
  _494 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `index.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10677966101694915 - nodes in this community are weakly interconnected._
- **Should `PeoplePanel.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10285714285714286 - nodes in this community are weakly interconnected._
- **Should `config.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1057945566286216 - nodes in this community are weakly interconnected._