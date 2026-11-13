# Graph Report - office-cec-pr-detail-nov13  (2026-11-13)

## Corpus Check
- 744 files · ~306,580 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3825 nodes · 17909 edges · 101 communities (100 shown, 1 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 582 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d3234605`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- queue-repairs.ts
- closeout-recovery.ts
- Inspector.tsx
- Button
- coordination.ts
- workKey
- agents.ts
- requests.ts
- publish-pr.ts
- authorize.ts
- OfficeScene.tsx
- source-amendment.ts
- daily-cto.ts
- packed165-admission.ts
- session-bridge.ts
- shared.ts
- maintenance/maintenance.ts
- adopted-review-candidate.ts
- reader.ts
- run-retrospective.ts
- ref_node_path
- assignment-poll.ts
- Store
- mutedCopy
- App.tsx
- ref_zod
- .transaction
- PeoplePanel.tsx
- constellation-runtime.ts
- local-config.ts
- OfficeSnapshot
- TimeBook.tsx
- knowledge.ts
- cec/workflow.ts
- accept-retrospective.ts
- enrollment-gate.ts
- retrospective-subject.ts
- github-delivery.ts
- accept-stage-result.ts
- outbox.ts
- azure.ts
- dependency-bots/adopt.ts
- scheduler.ts
- assignments.ts
- store.ts
- weekly-rollup.ts
- Goals.tsx
- telemetry.ts
- process.ts
- ticket-evidence.ts
- run.ts
- cost-ledger.ts
- StageResult
- index.ts
- digest
- .save
- harnessEffect
- features.ts
- lesson-selection.ts
- run-accounting.ts
- blocker-followups.ts
- remove-candidate.ts
- time-scope.ts
- notifications.ts
- interrupted-work-recovery.ts
- service-health.ts
- validate-stage.ts
- scheduled-work.ts
- .emit
- github/issue-publication.ts
- JiraIssuePublisher
- tracking-issue.ts
- admit-improvement.ts
- .getEffect
- Coordinator
- it-specialist.ts
- Offices
- currentAssignment
- github-readiness.ts
- scope-repair-resume.ts
- index.tsx
- preferences-store.ts
- jira-time.ts
- knowledge-views.ts
- report.ts
- scene-motion.ts
- RoomCamera.tsx
- cli.ts
- WorkTime
- command-registry.ts
- evidence-digest.ts
- codex-rollout.ts
- stopped-base-provider.ts
- cost-totals.ts
- extract-worker.mjs
- node-visuals.ts
- document.ts
- helper-evidence.py
- extraction.ts
- ITFollowUps.tsx
- highestStableAtLeast

## God Nodes (most connected - your core abstractions)
1. `Store` - 341 edges
2. `TicketJob` - 174 edges
3. `digest()` - 156 edges
4. `artifact()` - 129 edges
5. `GitHubDelivery` - 122 edges
6. `command()` - 108 edges
7. `workKey()` - 99 edges
8. `cx()` - 87 edges
9. `currentAssignment()` - 82 edges
10. `Button` - 77 edges

## Surprising Connections (you probably didn't know these)
- `MaintenanceCandidate` --references--> `RetrospectiveTrigger`  [EXTRACTED]
  server/knowledge/maintenance-triggers.ts → src/contracts/knowledge.ts
- `projectOutbox()` --calls--> `parkedProviderWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts
- `projectOutbox()` --calls--> `readinessWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts
- `replacementContext()` --calls--> `slackMessageUrl()`  [EXTRACTED]
  server/conversations/slack/supersession-proof.ts → src/shared.ts
- `pump()` --calls--> `deferredPickup()`  [EXTRACTED]
  server/conversations/team-conversation-pump.ts → src/work/pickup-state.ts

## Import Cycles
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/parking/resume-provider-review.ts -> server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/parking/resume-provider-review.ts`
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

## Communities (101 total, 1 thin omitted)

### Community 0 - "queue-repairs.ts"
Cohesion: 0.14
Nodes (29): checksFailed(), checksPassed(), checksPending(), CurrentChecksWait, currentMergeChecks(), pass(), pending(), requireThat() (+21 more)

### Community 1 - "closeout-recovery.ts"
Cohesion: 0.10
Nodes (47): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+39 more)

### Community 2 - "Inspector.tsx"
Cohesion: 0.11
Nodes (62): Outbox(), currentServices(), ServiceHealthPanel(), followUp(), labels, ServiceHealthRow(), BlockerFollowups(), LearningCoverage() (+54 more)

### Community 3 - "Button"
Cohesion: 0.11
Nodes (41): ref_react, ref_react_markdown, ref_remark_gfm, Activity(), ActivityTimeline(), AssignmentKnowledge(), Lookup(), BrainWorkspace() (+33 more)

### Community 4 - "coordination.ts"
Cohesion: 0.08
Nodes (41): reconcileNoticeConfirmations(), resumeParked(), compatible(), dependencyCompletionKey(), dependencyEligibility(), DependencyStores, issueKey(), observePrerequisites() (+33 more)

### Community 5 - "workKey"
Cohesion: 0.08
Nodes (73): containedFile(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal (+65 more)

### Community 6 - "agents.ts"
Cohesion: 0.05
Nodes (80): intakeMembership(), cecPrompt(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), resolvedDecisionNote(), stageInstructions (+72 more)

### Community 7 - "requests.ts"
Cohesion: 0.08
Nodes (56): hasSavedPrerequisiteResult(), beginPacked165Setup(), packed165SetupReady(), assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts() (+48 more)

### Community 8 - "publish-pr.ts"
Cohesion: 0.12
Nodes (44): activeEffectId(), runHarnessStage(), admitPRMetadata(), assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema, savedMetadataAssessment() (+36 more)

### Community 9 - "authorize.ts"
Cohesion: 0.07
Nodes (51): approveFeature(), featureById(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), artifactPath(), digest() (+43 more)

### Community 10 - "OfficeScene.tsx"
Cohesion: 0.17
Nodes (33): withoutElapsed(), Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk() (+25 more)

### Community 11 - "source-amendment.ts"
Cohesion: 0.06
Nodes (73): ref_node_async_hooks, adoptCandidate(), reported, Scope, approvedText(), assert(), amendmentInstruction(), amendmentIssueSha256() (+65 more)

### Community 12 - "daily-cto.ts"
Cohesion: 0.05
Nodes (48): leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), collectCTOFacts(), DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts (+40 more)

### Community 13 - "packed165-admission.ts"
Cohesion: 0.13
Nodes (30): DeliveryAuthorityInput, requireDeliveryAuthority(), accounting, DeliverySubject, nonDelivery, originalReads, HarnessControl, admitPacked165() (+22 more)

### Community 14 - "session-bridge.ts"
Cohesion: 0.07
Nodes (43): ref_ws, claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexDaemonProcesses(), accountCodexProcesses(), codexProcessInventory (+35 more)

### Community 15 - "shared.ts"
Cohesion: 0.05
Nodes (42): Admission, ProjectReadiness, HistoryRetirement, HistoryRetirementIntent, PackedPublicationRepair, SlackReplacementRequest, SlackSupersession, SlackSupersessionView (+34 more)

### Community 16 - "maintenance/maintenance.ts"
Cohesion: 0.08
Nodes (34): maintenancePolicies(), captureMaintenanceStep(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, BrainStatusSchema, identity, coverageSchema (+26 more)

### Community 17 - "adopted-review-candidate.ts"
Cohesion: 0.16
Nodes (22): removeAdoptedClone(), stoppedBaseCheckout(), assertStoppedBaseApproach(), stoppedBaseNextStage(), adoptedReviewCandidate(), ciCheckout(), finishCISetup(), verifyCIHooks() (+14 more)

### Community 18 - "reader.ts"
Cohesion: 0.09
Nodes (29): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, CommittedBrain (+21 more)

### Community 19 - "run-retrospective.ts"
Cohesion: 0.10
Nodes (47): acceptRetrospective(), BLOCKING, blockingTrigger, isBlocking(), withDemand(), appendLearningFacts(), baselineLearning(), maintainLearning() (+39 more)

### Community 20 - "ref_node_path"
Cohesion: 0.08
Nodes (44): ref_node_fs, ref_node_os, ref_node_path, ref_node_util, AuditRow, readStoppedBaseAuditCompletion(), StoppedBaseAuditReader, CoverageRow (+36 more)

### Community 21 - "assignment-poll.ts"
Cohesion: 0.13
Nodes (50): admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, createFeature(), assertEnrollable(), enrolled(), assessmentSignal() (+42 more)

### Community 22 - "Store"
Cohesion: 0.04
Nodes (30): correlatedBuild(), CommentPage, commentReadback(), Assignment, Content, jiraText(), Transition, JiraOperations (+22 more)

### Community 23 - "mutedCopy"
Cohesion: 0.16
Nodes (31): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS, PickupForm(), acceptPreferences() (+23 more)

### Community 24 - "App.tsx"
Cohesion: 0.06
Nodes (51): ref_lucide_react, ref_motion, ref_react_dom, itAgent(), itDiagnostics(), BrainDrawer(), themeColor, App() (+43 more)

### Community 25 - "ref_zod"
Cohesion: 0.09
Nodes (37): ref_zod, assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO() (+29 more)

### Community 26 - ".transaction"
Cohesion: 0.12
Nodes (34): ref_node_crypto, featureItemComplete(), reconcileFeatureCompletion(), discoveryPrompt(), planPrompt(), readEvidence(), helperTelemetry(), requestReplan() (+26 more)

### Community 27 - "PeoplePanel.tsx"
Cohesion: 0.10
Nodes (43): label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+35 more)

### Community 28 - "constellation-runtime.ts"
Cohesion: 0.10
Nodes (22): ref_3d_force_graph, ref_three, CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point (+14 more)

### Community 29 - "local-config.ts"
Cohesion: 0.12
Nodes (22): IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), projectListScope(), AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), goalEvidencePath() (+14 more)

### Community 30 - "OfficeSnapshot"
Cohesion: 0.12
Nodes (28): DailyCTOSummary, SnapshotAcceptance, tourStages, useOffice(), displayAgentTask(), LiveAgentTask(), Props, RunningTask() (+20 more)

### Community 31 - "TimeBook.tsx"
Cohesion: 0.11
Nodes (37): TelemetryReport, AzureBuild, src_shared_liveanchor, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens() (+29 more)

### Community 32 - "knowledge.ts"
Cohesion: 0.06
Nodes (43): curateLesson(), Curation, CurationAction, mergeEvidence(), SUBJECT, Kind, RetrospectiveResult, RetrospectiveResultSchema (+35 more)

### Community 33 - "cec/workflow.ts"
Cohesion: 0.12
Nodes (39): applyIntakeObservation(), MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), run(), advance(), nextStage(), publicationEvidenceGap() (+31 more)

### Community 34 - "accept-retrospective.ts"
Cohesion: 0.12
Nodes (25): Accepted, RETROSPECTIVE_HISTORY, Shared, improvementIntakeGate(), captureLearning(), learningDigest(), recordLearningOpportunity(), expireLearningPackets() (+17 more)

### Community 35 - "enrollment-gate.ts"
Cohesion: 0.13
Nodes (28): dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), resume(), startPilot(), eligibility(), featureEffectGate() (+20 more)

### Community 36 - "retrospective-subject.ts"
Cohesion: 0.11
Nodes (27): deliveryMetrics(), median(), LEARNING_BASELINES, maintenanceSubject(), MaintenanceSubjectFacts, clip(), maintenanceBlockedId(), MaintenanceCandidate (+19 more)

### Community 37 - "github-delivery.ts"
Cohesion: 0.06
Nodes (37): ProjectProgress, BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction(), dependabotReviewGuidance(), discover(), refreshDependencies() (+29 more)

### Community 38 - "accept-stage-result.ts"
Cohesion: 0.10
Nodes (42): parksInJira(), findingsBlock(), gateRegisteredDelivery(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery(), DECISION_KINDS (+34 more)

### Community 39 - "outbox.ts"
Cohesion: 0.10
Nodes (26): projectOutbox(), syncOutbox(), finishSupersededReadback(), projectSlackDeliveries(), settleRequestedSlackReplacement(), Input, supersedeSlackDelivery(), replacementContext() (+18 more)

### Community 40 - "azure.ts"
Cohesion: 0.15
Nodes (21): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+13 more)

### Community 41 - "dependency-bots/adopt.ts"
Cohesion: 0.17
Nodes (23): Execute, adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR, openDependabotPulls() (+15 more)

### Community 42 - "scheduler.ts"
Cohesion: 0.14
Nodes (16): ROLES, systemClock, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch() (+8 more)

### Community 43 - "assignments.ts"
Cohesion: 0.09
Nodes (29): clip(), DEMAND_LIMIT, demandFacts(), DemandSection, key(), LessonKey, notes(), assignmentLookups (+21 more)

### Community 44 - "store.ts"
Cohesion: 0.07
Nodes (33): ref_node_sqlite, ref_smol_toml, Assessment, Clock, file, project, root, projectById() (+25 more)

### Community 45 - "weekly-rollup.ts"
Cohesion: 0.12
Nodes (29): learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), RollupResult (+21 more)

### Community 46 - "Goals.tsx"
Cohesion: 0.07
Nodes (45): FeatureQuestionProjection, SendMessage, FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), send(), phases (+37 more)

### Community 47 - "telemetry.ts"
Cohesion: 0.09
Nodes (28): CodexRollout, CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL (+20 more)

### Community 48 - "process.ts"
Cohesion: 0.08
Nodes (32): ref_node_child_process, ref_node_url, file, folder, logs, root, Event, one() (+24 more)

### Community 49 - "ticket-evidence.ts"
Cohesion: 0.18
Nodes (21): assetDownloader(), attachmentKind(), evidenceDirectory(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS, EvidenceAttachment (+13 more)

### Community 50 - "run.ts"
Cohesion: 0.11
Nodes (31): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationCandidates(), investigationId(), investigationEvidence(), investigationFollowUps(), INVOCATION_SOURCE_REFS, invocationSource() (+23 more)

### Community 51 - "cost-ledger.ts"
Cohesion: 0.17
Nodes (25): captureCost(), server_telemetry_cost_entries_costcoveragesummary, costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId() (+17 more)

### Community 52 - "StageResult"
Cohesion: 0.14
Nodes (34): allowed, continuationNativeReview(), continuationReviewArtifacts(), continuationWorkerProof(), negativeWorker(), savedNegativeContinuationReview(), ContinuationDecision, implementationContinuationDecision() (+26 more)

### Community 53 - "index.ts"
Cohesion: 0.08
Nodes (36): ref_hono_node_server, ref_node_http, ref_vite, close(), config, itSpecialist, loadedRevision, offices (+28 more)

### Community 54 - "digest"
Cohesion: 0.15
Nodes (33): closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), admitGreen156(), enqueueGreen156(), GREEN156, green156Admitted(), green156Subject(), retainedGreen156Audit() (+25 more)

### Community 55 - ".save"
Cohesion: 0.22
Nodes (24): BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue(), readIssues(), commentDecision() (+16 more)

### Community 56 - "harnessEffect"
Cohesion: 0.19
Nodes (26): initialManualStart(), Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), ProjectCard, projectCards() (+18 more)

### Community 57 - "features.ts"
Cohesion: 0.09
Nodes (44): commandFeature(), reviewQuestions(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS, FeaturePlanningBindings, assertQuestionVisibility(), applyHarnessAction() (+36 more)

### Community 58 - "lesson-selection.ts"
Cohesion: 0.15
Nodes (19): INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, MAINTENANCE, MAX_LESSONS, normalPath(), PURPOSES (+11 more)

### Community 59 - "run-accounting.ts"
Cohesion: 0.11
Nodes (33): BoundedRead, done(), readBoundedNoFollow(), reasonOf(), backfillClaudeCost(), CompletionReader, codexHome(), createdAt() (+25 more)

### Community 60 - "blocker-followups.ts"
Cohesion: 0.28
Nodes (13): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), readBackConversations(), handoff(), reconcileBlockerFollowups(), clearUnblockBrief() (+5 more)

### Community 61 - "remove-candidate.ts"
Cohesion: 0.19
Nodes (17): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+9 more)

### Community 62 - "time-scope.ts"
Cohesion: 0.16
Nodes (25): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), midnight(), TicketDay (+17 more)

### Community 63 - "notifications.ts"
Cohesion: 0.14
Nodes (18): channelNoticeAuthorized(), ChannelSettings, notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR, plainSlackText() (+10 more)

### Community 64 - "interrupted-work-recovery.ts"
Cohesion: 0.18
Nodes (11): MergeNotifications, comparableSlackText(), SlackMessages, goalNoticeAuthorized(), goalNoticeNeverDispatched(), sendGoalNotice(), maintenanceNoticeAuthorized(), maintenanceNoticeNeverDispatched() (+3 more)

### Community 65 - "service-health.ts"
Cohesion: 0.22
Nodes (6): listenerHealth(), ProviderStatusChecks, Probe, probes, slackHealth(), ServiceHealth

### Community 66 - "validate-stage.ts"
Cohesion: 0.14
Nodes (21): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+13 more)

### Community 67 - "scheduled-work.ts"
Cohesion: 0.19
Nodes (16): deliverySlot(), metadataRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), requestPriority(), deterministicActions, eligible() (+8 more)

### Community 68 - ".emit"
Cohesion: 0.12
Nodes (28): configureChannelNotices(), configureNotices(), retryRecipientLookup(), bindDiscoveryResume(), DiscoveryResumeInput, normalizeStatement(), declineLessonIssue(), reactivateLesson() (+20 more)

### Community 69 - "github/issue-publication.ts"
Cohesion: 0.20
Nodes (9): PublicationReceipt, Assign, Board, Content, GitHubIssuePublisher, number(), same(), FeatureManifestItem (+1 more)

### Community 70 - "JiraIssuePublisher"
Cohesion: 0.24
Nodes (5): JiraIssuePublisher, keyOf(), descriptionPreimage(), plain(), publicationDescription()

### Community 71 - "tracking-issue.ts"
Cohesion: 0.15
Nodes (20): readBackOrThrow(), retryRead(), ensureTrackingIssue(), findTrackingIssue(), ownTracking(), TrackingIssue, trackingIssueBody(), trackingIssueTitle() (+12 more)

### Community 72 - "admit-improvement.ts"
Cohesion: 0.27
Nodes (12): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+4 more)

### Community 73 - ".getEffect"
Cohesion: 0.21
Nodes (11): diagnosticProof(), recoverDiscovery(), scopeNote(), GitHubOperations, fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), lessonText() (+3 more)

### Community 74 - "Coordinator"
Cohesion: 0.07
Nodes (3): coordination(), Coordinator, markCaptureStart()

### Community 75 - "it-specialist.ts"
Cohesion: 0.21
Nodes (14): savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), ITContext, diagnosticSnapshot(), publishITReport(), nativeDeliveryResolved() (+6 more)

### Community 77 - "currentAssignment"
Cohesion: 0.12
Nodes (25): deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), deliveryIntakeBlocker(), resolveDeliveryWork(), PrerequisitesSchema, Read, boardPreflightCandidate() (+17 more)

### Community 78 - "github-readiness.ts"
Cohesion: 0.19
Nodes (22): assertDeliveryMayMutate(), observe(), draftReadHeadMatches(), harnessDraft(), assertDraftClaimHistory(), linkDraftIssue(), protectedOriginalClaim(), publicationReadArgs() (+14 more)

### Community 79 - "scope-repair-resume.ts"
Cohesion: 0.19
Nodes (20): Assessment, outsideScanSources(), Ownership, requireThat(), scopeRepairRequestResolved(), sha, assertScopeRepairResumeFindings(), certain() (+12 more)

### Community 80 - "index.tsx"
Cohesion: 0.08
Nodes (39): Conversation(), LessonDecisionAction, lessonDecisionState(), readLessonDecision(), OutboxLessonDecision(), act(), readStatus(), OutboxMaintenanceStatus() (+31 more)

### Community 81 - "preferences-store.ts"
Cohesion: 0.17
Nodes (10): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS (+2 more)

### Community 82 - "jira-time.ts"
Cohesion: 0.22
Nodes (13): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+5 more)

### Community 83 - "knowledge-views.ts"
Cohesion: 0.20
Nodes (15): KnowledgeActivity, KnowledgeEdge, KnowledgeMap, KnowledgeNode, connectionSummary(), ConstellationView, DisplayNode, displayScene() (+7 more)

### Community 84 - "report.ts"
Cohesion: 0.29
Nodes (12): Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked(), row() (+4 more)

### Community 85 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 86 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (10): ref_react_three_drei, ref_react_three_fiber, ref_three_stdlib, CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility (+2 more)

### Community 87 - "cli.ts"
Cohesion: 0.20
Nodes (8): ref_node_stream, ref_node_timers, args, [cmd,...rawArgs], commands, key, projectIndex, PORT

### Community 88 - "WorkTime"
Cohesion: 0.19
Nodes (11): Readback, READBACK_INTERVAL_MS, SETTLE_MS, ConfirmedSegment, LiveAnchor, ObservationGap, SnapshotOrdering, TimeLedgerState (+3 more)

### Community 89 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 90 - "evidence-digest.ts"
Cohesion: 0.44
Nodes (7): canonical(), evidenceDigest(), evidenceHash(), semantic(), stableUrl(), requirementDrift(), RequirementPostimage

### Community 91 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 92 - "stopped-base-provider.ts"
Cohesion: 0.33
Nodes (8): pinCourier, pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), discussion(), pages(), pullIdentity(), readStoppedBaseProviderContext(), reviewThreads()

### Community 93 - "cost-totals.ts"
Cohesion: 0.38
Nodes (6): server_telemetry_billable_work_issue_key, awaitingEvidence(), CaptureContext, inCostWindow(), TicketCost, ticketCosts()

### Community 94 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (6): ref_mammoth, ref_pdfjs_dist, bounded(), extract(), fail(), [path,kind]

### Community 95 - "node-visuals.ts"
Cohesion: 0.29
Nodes (7): LabelRectangle, visibleLabels(), stableHash(), stablePosition(), nodeVisuals(), SCENE_COLOR_TOKENS, TOKENS

### Community 96 - "document.ts"
Cohesion: 0.38
Nodes (5): ref_yaml, guidanceExcerpt(), DocumentMetadata, documentText(), KnowledgeDocumentText

### Community 97 - "helper-evidence.py"
Cohesion: 0.33
Nodes (5): importlib_util, json, pathlib, Read-only protocol adapter for the installed review helper. No model dispatch., sys

### Community 98 - "extraction.ts"
Cohesion: 0.33
Nodes (4): ref_node_string_decoder, extractDocument, Extraction, Extractor

### Community 100 - "ITFollowUps.tsx"
Cohesion: 0.67
Nodes (4): itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps()

### Community 101 - "highestStableAtLeast"
Cohesion: 0.83
Nodes (3): compare(), highestStableAtLeast(), parts()

## Knowledge Gaps
- **476 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+471 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 605 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `closeout-recovery.ts`, `coordination.ts`, `workKey`, `agents.ts`, `requests.ts`, `publish-pr.ts`, `authorize.ts`, `source-amendment.ts`, `daily-cto.ts`, `packed165-admission.ts`, `session-bridge.ts`, `maintenance/maintenance.ts`, `adopted-review-candidate.ts`, `reader.ts`, `run-retrospective.ts`, `ref_node_path`, `assignment-poll.ts`, `ref_zod`, `.transaction`, `OfficeSnapshot`, `cec/workflow.ts`, `accept-retrospective.ts`, `enrollment-gate.ts`, `retrospective-subject.ts`, `github-delivery.ts`, `accept-stage-result.ts`, `outbox.ts`, `azure.ts`, `dependency-bots/adopt.ts`, `scheduler.ts`, `assignments.ts`, `store.ts`, `weekly-rollup.ts`, `process.ts`, `ticket-evidence.ts`, `run.ts`, `cost-ledger.ts`, `StageResult`, `digest`, `.save`, `harnessEffect`, `features.ts`, `lesson-selection.ts`, `run-accounting.ts`, `blocker-followups.ts`, `remove-candidate.ts`, `time-scope.ts`, `notifications.ts`, `interrupted-work-recovery.ts`, `validate-stage.ts`, `scheduled-work.ts`, `.emit`, `github/issue-publication.ts`, `tracking-issue.ts`, `admit-improvement.ts`, `.getEffect`, `Coordinator`, `it-specialist.ts`, `currentAssignment`, `github-readiness.ts`, `scope-repair-resume.ts`, `jira-time.ts`, `WorkTime`, `stopped-base-provider.ts`?**
  _High betweenness centrality (0.099) - this node is a cross-community bridge._
- **Why does `command()` connect `Store` to `closeout-recovery.ts`, `coordination.ts`, `workKey`, `agents.ts`, `requests.ts`, `publish-pr.ts`, `authorize.ts`, `packed165-admission.ts`, `session-bridge.ts`, `maintenance/maintenance.ts`, `adopted-review-candidate.ts`, `reader.ts`, `.transaction`, `cec/workflow.ts`, `github-delivery.ts`, `azure.ts`, `store.ts`, `weekly-rollup.ts`, `process.ts`, `ticket-evidence.ts`, `cost-ledger.ts`, `.save`, `harnessEffect`, `remove-candidate.ts`, `notifications.ts`, `service-health.ts`, `validate-stage.ts`, `github/issue-publication.ts`, `tracking-issue.ts`, `admit-improvement.ts`, `.getEffect`, `currentAssignment`, `github-readiness.ts`, `jira-time.ts`, `WorkTime`, `command-registry.ts`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `TicketJob` connect `github-delivery.ts` to `queue-repairs.ts`, `closeout-recovery.ts`, `Inspector.tsx`, `coordination.ts`, `workKey`, `agents.ts`, `requests.ts`, `publish-pr.ts`, `source-amendment.ts`, `daily-cto.ts`, `packed165-admission.ts`, `shared.ts`, `adopted-review-candidate.ts`, `run-retrospective.ts`, `ref_node_path`, `Store`, `OfficeSnapshot`, `cec/workflow.ts`, `enrollment-gate.ts`, `retrospective-subject.ts`, `accept-stage-result.ts`, `dependency-bots/adopt.ts`, `scheduler.ts`, `process.ts`, `StageResult`, `digest`, `harnessEffect`, `remove-candidate.ts`, `validate-stage.ts`, `tracking-issue.ts`, `it-specialist.ts`, `currentAssignment`, `github-readiness.ts`, `scope-repair-resume.ts`, `stopped-base-provider.ts`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _476 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `queue-repairs.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14102564102564102 - nodes in this community are weakly interconnected._
- **Should `closeout-recovery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10159651669085631 - nodes in this community are weakly interconnected._
- **Should `Inspector.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11072862880091795 - nodes in this community are weakly interconnected._