# Graph Report - the-office  (2026-11-17)

## Corpus Check
- 851 files · ~336,130 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4146 nodes · 19049 edges · 115 communities (110 shown, 5 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 612 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `02982d10`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- index.tsx
- PeoplePanel.tsx
- dependency-bots/adopt.ts
- Store
- Inspector.tsx
- .activeClaims
- session-bridge.ts
- MapView.tsx
- ref_node_path
- engine.ts
- worker-runtime.ts
- accept-stage-result.ts
- App.tsx
- features.ts
- assignments.ts
- scheduled-captures.ts
- run-retrospective.ts
- record-trigger.ts
- http/commands.ts
- preparation-readback.ts
- resume-provider-review.ts
- github-delivery.ts
- QuestionStepper.tsx
- run-cost.ts
- lesson-selection.ts
- maintenance/maintenance.ts
- cost-ledger.ts
- workKey
- knowledge.ts
- jira-time.ts
- TicketJob
- agents.ts
- .emit
- Goals.tsx
- security.ts
- outbox.ts
- scheduled-work.ts
- scheduler.ts
- digest
- cec-reads.ts
- remove-candidate.ts
- WorkTime
- fact-bounds.ts
- ledger.ts
- intent.ts
- harness-baseline.ts
- OfficeScene.tsx
- coordination-tick.ts
- discovery-recovery.ts
- demand-facts.ts
- MaintenanceRun
- reader.ts
- blocker-followups.ts
- cec.ts
- work.ts
- weekly-rollup.ts
- retrospective-subject.ts
- TimeBook.tsx
- JiraIssuePublisher
- control-store.ts
- store.ts
- processGroupAlive
- conversations/slack.ts
- refresh-evidence.ts
- CEC
- owned-artifact.ts
- tracking-issue.ts
- telemetry.ts
- continue-ownership-read.ts
- it-specialist.ts
- constellation-runtime.ts
- process.ts
- continue-unsealed-qa.ts
- report.ts
- service-health.ts
- Offices
- jira-transport.ts
- ControlStore
- github/issue-publication.ts
- create-candidate.ts
- unverified-prior-runs.ts
- brain-maintenance.ts
- inspect-closed-plan.ts
- Effects
- OfficeSnapshot
- run-accounting.ts
- src_shared_workkey
- index.ts
- interrupted-work-recovery.ts
- retire-history.ts
- pilot-delivery.ts
- ticket-stage-runner.ts
- checkpoint-completion.ts
- assignment-poll.ts
- features/commands.ts
- capture-session-clone.py
- shared.ts
- OutboxLessonDecision.tsx
- park-ticket.ts
- codex-rollout.ts
- packed-consumer-pnpm.ts
- leadership.ts
- run-usage.ts
- codex-rollout-file.ts
- continue-access-only-plan.ts
- extract-worker.mjs
- lesson-exits.ts
- .save
- slack-supersession.ts
- coordination.ts
- Coordinator
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
9. `currentAssignment()` - 88 edges
10. `cx()` - 88 edges

## Surprising Connections (you probably didn't know these)
- `StageResult` --references--> `UnrecordedResult`  [EXTRACTED]
  src/shared.ts → server/cec/unrecorded-result.ts
- `HarnessRequest` --references--> `DeliveryAuthorityInput`  [EXTRACTED]
  src/contracts/work.ts → server/delivery/harness/delivery-authority.ts
- `apply()` --indirect_call--> `note()`  [INFERRED]
  src/conversations/OutboxSavedImplementation.tsx → server/cec/parking/resume-parked.ts
- `DeliverySlot` --references--> `Role`  [EXTRACTED]
  server/office/projects.ts → src/shared.ts
- `Role` --references--> `StageContext`  [EXTRACTED]
  src/shared.ts → server/delivery/pipeline/accept-stage-result.ts

## Import Cycles
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/review-wait.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/parking/resume-provider-review.ts -> server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/parking/resume-provider-review.ts`
- 3-file cycle: `server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts`
- 4-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/readiness/review-wait.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 4-file cycle: `server/delivery/recovery/stopped-base-review.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/stopped-base-review.ts`
- 4-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 4-file cycle: `server/delivery/recovery/implementation/activation-recovery.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/implementation/activation-recovery.ts`
- 4-file cycle: `server/delivery/recovery/implementation/saved-prerequisite-handoff.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/implementation/saved-prerequisite-handoff.ts`
- 4-file cycle: `server/delivery/recovery/validation/validation-readback.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/validation/validation-readback.ts`
- 4-file cycle: `server/features/delivery-binding.ts -> server/features/enrollment-gate.ts -> server/features/progression/failure.ts -> server/store/effects.ts -> server/features/delivery-binding.ts`
- 5-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/stage-reconciliation.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 5-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 5-file cycle: `server/delivery/recovery/implementation/continuation-evidence.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/recovery/implementation/continuation-evidence.ts`
- 5-file cycle: `server/delivery/recovery/implementation/saved-prerequisite-handoff.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/recovery/implementation/saved-prerequisite-handoff.ts`
- 5-file cycle: `server/delivery/recovery/scope-repair/scope-repair-readback.ts -> server/delivery/recovery/scope-repair/scope-repair-resume.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/scope-repair/scope-repair-readback.ts`
- 5-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/scope-repair/scope-repair-resume.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 5-file cycle: `server/delivery/recovery/implementation/continuation-evidence.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/implementation/implementation-recovery.ts -> server/delivery/recovery/implementation/continuation-evidence.ts`
- 5-file cycle: `server/delivery/recovery/implementation/continuation-evidence.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/preparation/post-conflict-preparation.ts -> server/delivery/recovery/implementation/continuation-evidence.ts`

## Communities (115 total, 5 thin omitted)

### Community 0 - "index.tsx"
Cohesion: 0.08
Nodes (61): ref_react, SendMessage, ctoInputFailure(), OutboxCTOInput(), recover(), OutboxMaintenanceStatus(), OutboxSavedImplementation(), apply() (+53 more)

### Community 1 - "PeoplePanel.tsx"
Cohesion: 0.09
Nodes (45): label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+37 more)

### Community 2 - "dependency-bots/adopt.ts"
Cohesion: 0.16
Nodes (23): Execute, adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR, openDependabotPulls() (+15 more)

### Community 3 - "Store"
Cohesion: 0.11
Nodes (30): featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS, reserveReplacement(), stageBudget() (+22 more)

### Community 4 - "Inspector.tsx"
Cohesion: 0.10
Nodes (73): Conversation(), Outbox(), SlackDeliveryCard(), blockedSummary(), ServiceHealthPanel(), followUp(), labels, ServiceHealthRow() (+65 more)

### Community 5 - ".activeClaims"
Cohesion: 0.07
Nodes (53): nextAttemptAt(), NOT_RETRYABLE, WRITER_STAGES, writerRestartCandidate, writerRestarted(), writerRestartPending(), deliveryAdmission(), assessDeliveryAuthority() (+45 more)

### Community 6 - "session-bridge.ts"
Cohesion: 0.06
Nodes (53): ref_node_perf_hooks, ref_ws, claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexDaemonProcesses(), accountCodexProcesses() (+45 more)

### Community 7 - "MapView.tsx"
Cohesion: 0.06
Nodes (68): ref_motion, ref_react_markdown, ref_remark_gfm, ref_yaml, KnowledgeActivity, KnowledgeActivityPage, KnowledgeEdge, KnowledgeMap (+60 more)

### Community 8 - "ref_node_path"
Cohesion: 0.07
Nodes (90): ref_node_fs, ref_node_os, ref_node_path, ref_node_util, ownershipReadHistory(), recoverCTOInput(), allowed, continuationNativeReview() (+82 more)

### Community 9 - "engine.ts"
Cohesion: 0.07
Nodes (12): applyIntakeObservation(), checkMail(), drainMail(), requestMail(), enableNightly(), ingest(), GitHubMonitor, drainMaintenance() (+4 more)

### Community 10 - "worker-runtime.ts"
Cohesion: 0.06
Nodes (41): itChatPrompt(), candidateWorkspaceEnvironment(), assignmentDiagnostics(), diagnosticContext(), assignmentSubject(), catalogLine(), assertBriefingScope(), contextPacket() (+33 more)

### Community 11 - "accept-stage-result.ts"
Cohesion: 0.07
Nodes (71): containedFile(), removeAdoptedClone(), findingsBlock(), namedRepairIds(), DECISION_KINDS, needsDecision(), acceptStageResult(), acceptConflictRepair() (+63 more)

### Community 12 - "App.tsx"
Cohesion: 0.06
Nodes (47): ref_lucide_react, ref_react_dom, BrainDrawer(), themeColor, App(), CONNECTION, CONNECTION_DOT, dockItemVariants (+39 more)

### Community 13 - "features.ts"
Cohesion: 0.06
Nodes (75): ref_node_crypto, Assignment, Content, jiraText(), Transition, descriptionPreimage(), plain(), approveFeature() (+67 more)

### Community 14 - "assignments.ts"
Cohesion: 0.10
Nodes (32): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), guidanceExcerpt(), KnowledgeContext, digest(), knowledgeSnapshot() (+24 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.15
Nodes (42): createFeature(), assertEnrollable(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest, captureRequests(), failCapture() (+34 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.11
Nodes (35): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, blockingTrigger, brainOverlap, brainOverlapQuery() (+27 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.09
Nodes (44): isBlocking(), baselineLearning(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences(), busyMaintenanceIds(), clip() (+36 more)

### Community 18 - "http/commands.ts"
Cohesion: 0.17
Nodes (21): requestQAPlanRetry(), enqueueMetadataRecovery(), normalizeStatement(), configureKnowledge(), declineLessonIssue(), reactivateLesson(), retireLesson(), decideOfficeProposal() (+13 more)

### Community 19 - "preparation-readback.ts"
Cohesion: 0.12
Nodes (28): assertPostConflictOwnership(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), routeReadyPostConflictPublication(), verifyInitialDraftConflictPreparation(), bindPreparationBoardOrigins(), claimSchema, eventSchema (+20 more)

### Community 20 - "resume-provider-review.ts"
Cohesion: 0.23
Nodes (22): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), ProjectCard, projectCards(), projectGraphql() (+14 more)

### Community 21 - "github-delivery.ts"
Cohesion: 0.05
Nodes (78): writerRestartInstruction(), restartStoppedWriters(), unchangedSinceAccepted(), Execute, SalvageRetry, salvageWorktree(), BOARD_RULE, conflictRefreshInstruction() (+70 more)

### Community 22 - "QuestionStepper.tsx"
Cohesion: 0.19
Nodes (18): FeatureQuestionProjection, OutboxQuestionRound(), send(), draftKey(), readDraft(), saveDraft(), QuestionRound(), nextQuestion() (+10 more)

### Community 23 - "run-cost.ts"
Cohesion: 0.18
Nodes (14): CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL, Rates (+6 more)

### Community 24 - "lesson-selection.ts"
Cohesion: 0.07
Nodes (36): ref_node_stream, ref_node_timers, args, [cmd,...rawArgs], commands, key, projectIndex, lessonIssueBody() (+28 more)

### Community 25 - "maintenance/maintenance.ts"
Cohesion: 0.14
Nodes (17): candidateOwner(), SETTLED, skipOwnedCandidate(), Skipped, skippedCandidateLedger(), CmsFollowUpContext, cmsFollowUpInstructions(), GitHubMaintenance (+9 more)

### Community 26 - "cost-ledger.ts"
Cohesion: 0.13
Nodes (31): captureCost(), server_telemetry_cost_entries_costcoveragesummary, costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress() (+23 more)

### Community 27 - "workKey"
Cohesion: 0.05
Nodes (85): pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), completedPRReviews(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation() (+77 more)

### Community 28 - "knowledge.ts"
Cohesion: 0.07
Nodes (35): curateLesson(), Curation, CurationAction, mergeEvidence(), BRAIN_SCOPE, SUBJECT, Kind, RetrospectiveResult (+27 more)

### Community 29 - "jira-time.ts"
Cohesion: 0.16
Nodes (18): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+10 more)

### Community 30 - "TicketJob"
Cohesion: 0.06
Nodes (89): harnessCloseout(), PASSING, verifyMergeActions(), requireDeliveryAuthority(), activeEffectId(), harnessEffect, assertDeliveryMayMutate(), HarnessControl (+81 more)

### Community 31 - "agents.ts"
Cohesion: 0.05
Nodes (50): ref_zod, implementationWorkerContext(), CECReadbackSchema, READBACK_OWNER_SCOPE, savedStageCompletion(), assertContinuableWorktree(), CONTINUABLE, continuationPrompt() (+42 more)

### Community 32 - ".emit"
Cohesion: 0.07
Nodes (44): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+36 more)

### Community 33 - "Goals.tsx"
Cohesion: 0.14
Nodes (19): CTOReview(), goalState, DailyCTO(), GoalHistory(), load(), reportDate(), reviewStatus, blank() (+11 more)

### Community 34 - "security.ts"
Cohesion: 0.09
Nodes (35): az(), AzureMonitor, base, buildUrl(), correlatedBuild(), prUrl(), readInPairs(), ProviderPR (+27 more)

### Community 35 - "outbox.ts"
Cohesion: 0.16
Nodes (16): ctoInputIdentityMatches(), ctoInputRecovered(), ADOPTION_STALLED_MS, projectOutbox(), syncOutbox(), projectSlackDeliveries(), Input, supersedeSlackDelivery() (+8 more)

### Community 36 - "scheduled-work.ts"
Cohesion: 0.08
Nodes (41): ref_node_async_hooks, freshOwnershipRead(), deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), Ownership, ownershipContext, refreshDeliveryOwnership() (+33 more)

### Community 37 - "scheduler.ts"
Cohesion: 0.16
Nodes (14): ROLES, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch(), deliveryOccupied() (+6 more)

### Community 38 - "digest"
Cohesion: 0.09
Nodes (56): accounting, DeliverySubject, nonDelivery, originalReads, closeoutReceipt(), boardPreflightCandidate(), Ownership, reconcileBoardPreflight() (+48 more)

### Community 39 - "cec-reads.ts"
Cohesion: 0.14
Nodes (22): IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), intakeMembership(), projectListScope(), cecIntakePrompt(), cecReadbackPrompt() (+14 more)

### Community 40 - "remove-candidate.ts"
Cohesion: 0.18
Nodes (18): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot() (+10 more)

### Community 41 - "WorkTime"
Cohesion: 0.13
Nodes (33): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), server_telemetry_billable_work_issue_key, isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence() (+25 more)

### Community 42 - "fact-bounds.ts"
Cohesion: 0.17
Nodes (20): leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance() (+12 more)

### Community 43 - "ledger.ts"
Cohesion: 0.20
Nodes (15): acceptedCompletionResolution(), investigationCandidates(), investigationId(), ctoReplacementResolution(), finishedSubjectResolution(), investigationFollowUps(), implementationReplacementResolution(), investigationResolution() (+7 more)

### Community 44 - "intent.ts"
Cohesion: 0.13
Nodes (25): GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles(), ContinuationIO (+17 more)

### Community 45 - "harness-baseline.ts"
Cohesion: 0.16
Nodes (19): baselineReport, BaselineSource, baselineText(), millions(), row(), share(), add(), BaselineState (+11 more)

### Community 46 - "OfficeScene.tsx"
Cohesion: 0.07
Nodes (65): ref_react_three_drei, ref_react_three_fiber, ref_three_stdlib, itAgent(), itDiagnostics(), displayAgentTask(), githubStageLabels, withoutElapsed() (+57 more)

### Community 47 - "coordination-tick.ts"
Cohesion: 0.13
Nodes (13): BrainFollowup, Result, brainCheckpointCompletion(), reconcileCompletedCheckpoints(), legacy, reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS (+5 more)

### Community 48 - "discovery-recovery.ts"
Cohesion: 0.26
Nodes (11): Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership, rawHash() (+3 more)

### Community 49 - "demand-facts.ts"
Cohesion: 0.14
Nodes (21): clip(), DEMAND_LIMIT, demandFacts(), key(), LessonKey, notes(), clip(), MISSED_QUERY_LIMIT (+13 more)

### Community 50 - "MaintenanceRun"
Cohesion: 0.29
Nodes (10): checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), repeatedVendorReviewBlock(), stoppedInVendorReview(), maintenanceSuperseded(), REOBSERVED, ReconciliationRequest (+2 more)

### Community 51 - "reader.ts"
Cohesion: 0.13
Nodes (9): BrainGraph, BrainNote, BrainReader, CommittedBrain, GraphNode, GraphPage, hash, Note (+1 more)

### Community 52 - "blocker-followups.ts"
Cohesion: 0.28
Nodes (13): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), readBackConversations(), handoff(), reconcileBlockerFollowups(), clearUnblockBrief() (+5 more)

### Community 53 - "cec.ts"
Cohesion: 0.10
Nodes (31): cecPrompt(), resolvedDecisionNote(), stageInstructions, settledReceiptNote(), ticketForWorker(), APPROACH_GUIDANCE, reviewInstructions(), deliveryTask() (+23 more)

### Community 54 - "work.ts"
Cohesion: 0.11
Nodes (23): BLOCKED_CAUSES, blockedCauses(), projectReadiness(), ProjectReadiness, AssignmentResult, BlockedCause, CompletionCondition, DeliveryAdmission (+15 more)

### Community 55 - "weekly-rollup.ts"
Cohesion: 0.14
Nodes (24): learningMetrics(), RollupResult, RETROSPECTIVE_TIMEOUT, lastFriday(), ROLLUP_HISTORY, rollupDue(), RollupHooks, rollupPrompt() (+16 more)

### Community 56 - "retrospective-subject.ts"
Cohesion: 0.17
Nodes (16): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+8 more)

### Community 57 - "TimeBook.tsx"
Cohesion: 0.10
Nodes (38): TelemetryReport, AzureBuild, src_shared_liveanchor, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens() (+30 more)

### Community 58 - "JiraIssuePublisher"
Cohesion: 0.26
Nodes (3): JiraIssuePublisher, keyOf(), publicationDescription()

### Community 59 - "control-store.ts"
Cohesion: 0.13
Nodes (11): ref_node_sqlite, Clock, applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, statementCache(), initialSnapshot() (+3 more)

### Community 60 - "store.ts"
Cohesion: 0.06
Nodes (42): ref_node_url, ref_smol_toml, QuestionNotifications, admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident() (+34 more)

### Community 61 - "processGroupAlive"
Cohesion: 0.13
Nodes (24): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_FIX_PROMPT, OfficeFixResult (+16 more)

### Community 62 - "conversations/slack.ts"
Cohesion: 0.20
Nodes (8): comparableSlackText(), SlackMessages, SlackRequestSchema, SlackResultSchema, SlackVerificationSchema, goalNoticeAuthorized(), maintenanceNoticeAuthorized(), MergeNotice

### Community 63 - "refresh-evidence.ts"
Cohesion: 0.27
Nodes (12): evidenceDirectory(), readEvidence(), ProviderEvidence, canonical(), evidenceDigest(), evidenceHash(), semantic(), stableUrl() (+4 more)

### Community 64 - "CEC"
Cohesion: 0.09
Nodes (31): ref_node_string_decoder, CommentPage, commentReadback(), JiraOperations, plain(), jiraRecord(), unpack(), metadataDigest() (+23 more)

### Community 65 - "owned-artifact.ts"
Cohesion: 0.21
Nodes (14): BoundedRead, done(), readBoundedNoFollow(), readBoundedNoFollowSync(), reasonOf(), backfillClaudeCost(), CompletionReader, codexHome() (+6 more)

### Community 66 - "tracking-issue.ts"
Cohesion: 0.15
Nodes (20): readBackOrThrow(), retryRead(), ensureTrackingIssue(), findTrackingIssue(), ownTracking(), TrackingIssue, trackingIssueBody(), trackingIssueTitle() (+12 more)

### Community 67 - "telemetry.ts"
Cohesion: 0.14
Nodes (14): comparable(), EvidenceOutcome, recordRunEvidence(), CostCompleteness, CostComponent, CostLedgerState, ProviderBasis, RunAccounting (+6 more)

### Community 68 - "continue-ownership-read.ts"
Cohesion: 0.25
Nodes (11): continueOwnershipRead(), expiredOwnershipRead(), ownershipReadGate(), ownershipReadState(), ownershipReadSource(), ReadOwnershipView, scheduledOwnershipRead(), LiveSession (+3 more)

### Community 69 - "it-specialist.ts"
Cohesion: 0.16
Nodes (17): savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), ITContext, diagnosticSnapshot(), informationalRecovery(), publishITReport() (+9 more)

### Community 70 - "constellation-runtime.ts"
Cohesion: 0.07
Nodes (35): ref_3d_force_graph, ref_three, ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), CameraPose (+27 more)

### Community 71 - "process.ts"
Cohesion: 0.08
Nodes (30): ref_node_child_process, file, folder, logs, root, Event, one(), prePushRejection() (+22 more)

### Community 72 - "continue-unsealed-qa.ts"
Cohesion: 0.24
Nodes (11): continueUnsealedQA(), entry(), handoffOwnership(), ReadbackOwnerDecision, readOwnershipCandidate, qaPlanEvidenceGap(), qaRunDirectory(), OfficeQAHandoff (+3 more)

### Community 73 - "report.ts"
Cohesion: 0.29
Nodes (12): Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked(), row() (+4 more)

### Community 74 - "service-health.ts"
Cohesion: 0.16
Nodes (11): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, slackHealth() (+3 more)

### Community 76 - "jira-transport.ts"
Cohesion: 0.38
Nodes (8): document(), transitionWithComment(), jiraAccount(), jiraCredential, KEYCHAIN_SERVICE, jiraRest(), quoted(), Execute

### Community 77 - "ControlStore"
Cohesion: 0.17
Nodes (6): DailyCTO, EvidenceRequestConflict, Briefing, saveReviewBriefing(), ControlStore, DailyCTOReport

### Community 78 - "github/issue-publication.ts"
Cohesion: 0.19
Nodes (9): PublicationReceipt, Assign, Board, Content, GitHubIssuePublisher, number(), same(), FeatureManifestItem (+1 more)

### Community 79 - "create-candidate.ts"
Cohesion: 0.31
Nodes (9): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+1 more)

### Community 80 - "unverified-prior-runs.ts"
Cohesion: 0.29
Nodes (6): maintenancePolicies(), BrainMaintenance, easternDate(), weeklyDue(), supersedablePriorRuns(), unverifiedPriorRunNote()

### Community 81 - "brain-maintenance.ts"
Cohesion: 0.26
Nodes (10): completeNativeCheckpoint(), BRAIN_DEPENDENCY_MERGES, BrainResult, capped(), queueMaintenanceNotice(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance() (+2 more)

### Community 82 - "inspect-closed-plan.ts"
Cohesion: 0.18
Nodes (11): OwnershipRead, closedReadonlyPlan(), Document, entryExists(), inspectClosedQAPlan(), Decision, reviewedPlanGuidance, reviewedPlanGuideDigest (+3 more)

### Community 83 - "Effects"
Cohesion: 0.25
Nodes (7): GitHubOperations, fileLessonIssue(), Assessment, closeNativeRefresh(), fingerprint(), Effects, EffectIntent

### Community 84 - "OfficeSnapshot"
Cohesion: 0.12
Nodes (30): knowledgeOutbox(), DAYS, dueLessonDecisions(), easternWeek(), LESSON_DIGEST, LessonDecision, PARTS, pendingLessonDecisions() (+22 more)

### Community 85 - "run-accounting.ts"
Cohesion: 0.25
Nodes (10): readCodexRollout(), codexAccounting(), COMPLETION_MAX_BYTES, merge(), RECONCILE_GRACE_MS, reconciling, Source, TerminalWork (+2 more)

### Community 87 - "index.ts"
Cohesion: 0.08
Nodes (41): ref_hono_node_server, ref_node_http, ref_vite, implementationPreview(), implementationContinuationRoute(), qaPlanRetryRoute(), close(), config (+33 more)

### Community 88 - "interrupted-work-recovery.ts"
Cohesion: 0.36
Nodes (7): interruptAdoptions(), legacy(), REMOVED_FIELDS, retireLegacyRecovery(), goalNoticeNeverDispatched(), maintenanceNoticeNeverDispatched(), recover()

### Community 89 - "retire-history.ts"
Cohesion: 0.31
Nodes (8): readHistoryScope(), enqueueHistoryRetirement(), historicalRecordDigest(), Intent, records(), retireIncompleteHistory(), HistoryRetirement, HistoryRetirementIntent

### Community 90 - "pilot-delivery.ts"
Cohesion: 0.10
Nodes (29): candidateBranchMoved(), continueImplementation(), drainDelivery(), resume(), startPilot(), consumeQAPlanRetry(), OfficeQAHandoffInput, confirmSetupStopCap() (+21 more)

### Community 91 - "ticket-stage-runner.ts"
Cohesion: 0.17
Nodes (25): parksInJira(), run(), verifiedTransition(), UnrecordedResult, unrecordedStageResult(), publicationEvidenceGap(), qaEvidenceGap(), stageResultGap() (+17 more)

### Community 92 - "checkpoint-completion.ts"
Cohesion: 0.28
Nodes (5): BrainStatusSchema, identity, coverageSchema, followupSchema, verified

### Community 93 - "assignment-poll.ts"
Cohesion: 0.09
Nodes (31): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice() (+23 more)

### Community 94 - "features/commands.ts"
Cohesion: 0.08
Nodes (39): commandFeature(), featureById(), mutation(), reviewQuestions(), automaticIntakeWait(), Link, linkFeature(), FeaturePublisher (+31 more)

### Community 95 - "capture-session-clone.py"
Cohesion: 0.15
Nodes (10): ctypes, errno, importlib_util, json, os, pathlib, Copy a coherent macOS clone of inherited reader fd3 to anonymous target fd4. No…, Read-only protocol adapter for the installed review helper. No model dispatch. (+2 more)

### Community 96 - "shared.ts"
Cohesion: 0.05
Nodes (40): PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, OfficeQAReport, QAPlanContinuation, WriterRestart (+32 more)

### Community 97 - "OutboxLessonDecision.tsx"
Cohesion: 0.35
Nodes (10): LessonDecisionAction, lessonDecisionState(), readLessonDecision(), OutboxLessonDecision(), act(), readStatus(), Evidence(), LessonCard() (+2 more)

### Community 98 - "park-ticket.ts"
Cohesion: 0.15
Nodes (35): resolveBlockedTransition(), jiraCollection(), BLOCKED, server_cec_parking_jira_issue_execute, findComment(), server_cec_parking_jira_issue_jira, LiveIssue, readIssue() (+27 more)

### Community 99 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 101 - "leadership.ts"
Cohesion: 0.25
Nodes (7): DailyCTOBriefing, DailyCTOResult, DailyGoalUpdate, GoalEvidenceRef, GoalEvidenceRequest, GoalProgress, GoalStatus

### Community 102 - "run-usage.ts"
Cohesion: 0.38
Nodes (5): CodexRollout, claudeCrashZero(), claudeUsage(), count(), RunUsage

### Community 103 - "codex-rollout-file.ts"
Cohesion: 0.43
Nodes (6): createdAt(), dayDirs(), header(), ROLLOUT_MAX_BYTES, RolloutScan, scanCodexRollouts()

### Community 104 - "continue-access-only-plan.ts"
Cohesion: 0.57
Nodes (5): Document, isAccessOnlyPlan(), settledAccessOnlyState(), continueAccessOnlyPlan(), entryExists()

### Community 105 - "extract-worker.mjs"
Cohesion: 0.43
Nodes (6): ref_mammoth, ref_pdfjs_dist, bounded(), extract(), fail(), [path,kind]

### Community 106 - "lesson-exits.ts"
Cohesion: 0.60
Nodes (5): expireLessons(), expiring(), graduateLessons(), graduating(), retire()

### Community 107 - ".save"
Cohesion: 0.30
Nodes (3): ProjectProgress, sendGoalNotice(), sendMaintenanceNotice()

### Community 108 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 110 - "coordination.ts"
Cohesion: 0.07
Nodes (62): dispatchNightly(), requestDelivery(), eligibility(), MergeNotifications, ATTEMPT_DELAYS_MS, Admission, admit(), IntakeContext (+54 more)

### Community 111 - "Coordinator"
Cohesion: 0.08
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 112 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 116 - "highestStableAtLeast"
Cohesion: 0.83
Nodes (3): compare(), highestStableAtLeast(), parts()

## Knowledge Gaps
- **494 isolated node(s):** `ButtonProps`, `People`, `OrgTree`, `ChartProps`, `Tab` (+489 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 635 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `dependency-bots/adopt.ts`, `.activeClaims`, `session-bridge.ts`, `ref_node_path`, `engine.ts`, `worker-runtime.ts`, `accept-stage-result.ts`, `features.ts`, `assignments.ts`, `scheduled-captures.ts`, `run-retrospective.ts`, `record-trigger.ts`, `http/commands.ts`, `preparation-readback.ts`, `resume-provider-review.ts`, `github-delivery.ts`, `lesson-selection.ts`, `maintenance/maintenance.ts`, `cost-ledger.ts`, `workKey`, `jira-time.ts`, `TicketJob`, `agents.ts`, `.emit`, `security.ts`, `outbox.ts`, `scheduled-work.ts`, `scheduler.ts`, `digest`, `cec-reads.ts`, `remove-candidate.ts`, `WorkTime`, `fact-bounds.ts`, `ledger.ts`, `intent.ts`, `coordination-tick.ts`, `discovery-recovery.ts`, `demand-facts.ts`, `blocker-followups.ts`, `cec.ts`, `weekly-rollup.ts`, `retrospective-subject.ts`, `JiraIssuePublisher`, `control-store.ts`, `store.ts`, `processGroupAlive`, `conversations/slack.ts`, `refresh-evidence.ts`, `CEC`, `owned-artifact.ts`, `tracking-issue.ts`, `telemetry.ts`, `continue-ownership-read.ts`, `it-specialist.ts`, `process.ts`, `continue-unsealed-qa.ts`, `Offices`, `github/issue-publication.ts`, `create-candidate.ts`, `unverified-prior-runs.ts`, `brain-maintenance.ts`, `inspect-closed-plan.ts`, `Effects`, `OfficeSnapshot`, `run-accounting.ts`, `index.ts`, `interrupted-work-recovery.ts`, `retire-history.ts`, `pilot-delivery.ts`, `ticket-stage-runner.ts`, `checkpoint-completion.ts`, `assignment-poll.ts`, `features/commands.ts`, `park-ticket.ts`, `continue-access-only-plan.ts`, `lesson-exits.ts`, `.save`, `coordination.ts`, `Coordinator`?**
  _High betweenness centrality (0.115) - this node is a cross-community bridge._
- **Why does `command()` connect `process.ts` to `Store`, `session-bridge.ts`, `ref_node_path`, `engine.ts`, `worker-runtime.ts`, `accept-stage-result.ts`, `features.ts`, `resume-provider-review.ts`, `github-delivery.ts`, `lesson-selection.ts`, `maintenance/maintenance.ts`, `cost-ledger.ts`, `workKey`, `jira-time.ts`, `TicketJob`, `agents.ts`, `security.ts`, `digest`, `remove-candidate.ts`, `intent.ts`, `coordination-tick.ts`, `reader.ts`, `JiraIssuePublisher`, `store.ts`, `CEC`, `tracking-issue.ts`, `continue-ownership-read.ts`, `continue-unsealed-qa.ts`, `service-health.ts`, `jira-transport.ts`, `github/issue-publication.ts`, `create-candidate.ts`, `unverified-prior-runs.ts`, `brain-maintenance.ts`, `inspect-closed-plan.ts`, `Effects`, `pilot-delivery.ts`, `assignment-poll.ts`, `continue-access-only-plan.ts`, `lesson-exits.ts`, `.save`, `coordination.ts`, `Coordinator`, `command-registry.ts`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `Button` connect `index.tsx` to `shared.ts`, `OutboxLessonDecision.tsx`, `Goals.tsx`, `Inspector.tsx`, `MapView.tsx`, `App.tsx`, `QuestionStepper.tsx`, `TimeBook.tsx`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **What connects `ButtonProps`, `People`, `OrgTree` to the rest of the system?**
  _494 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `index.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07946069994262765 - nodes in this community are weakly interconnected._
- **Should `PeoplePanel.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09224318658280922 - nodes in this community are weakly interconnected._
- **Should `Store` be split into smaller, more focused modules?**
  _Cohesion score 0.10552061495457722 - nodes in this community are weakly interconnected._