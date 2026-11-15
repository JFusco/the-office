# Graph Report - office-access-only-qa-continuation-nov14  (2026-11-14)

## Corpus Check
- 797 files · ~326,126 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4021 nodes · 18740 edges · 111 communities (102 shown, 9 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 605 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a63b8fcd`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- requests.ts
- github-delivery.ts
- features.ts
- store.ts
- workKey
- artifact
- source-amendment-scope.ts
- harnessEffect
- session-bridge.ts
- Inspector.tsx
- App.tsx
- JiraIssuePublisher
- digest
- agents.ts
- TicketJob
- daily-cto.ts
- .emit
- ref_react
- config.ts
- Button
- index.tsx
- scheduled-captures.ts
- assignments.ts
- useLiveTiming.ts
- ref_node_path
- index.ts
- lesson-selection.ts
- PeoplePanel.tsx
- record-trigger.ts
- demand-facts.ts
- intent.ts
- run-retrospective.ts
- OfficeScene.tsx
- worker-runtime.ts
- pilot-delivery.ts
- maintenance/maintenance.ts
- dependency-bots/adopt.ts
- constellation-runtime.ts
- .save
- notifications.ts
- resume-provider-review.ts
- time-scope.ts
- run.ts
- QuestionStepper.tsx
- http/commands.ts
- knowledge.ts
- run-accounting.ts
- scheduled-work.ts
- packed165-admission.ts
- weekly-rollup.ts
- dependencies.ts
- scheduler.ts
- blocker-followups.ts
- remove-candidate.ts
- admit-improvement.ts
- telemetry.ts
- jira-time.ts
- Goals.tsx
- local-config.ts
- azure.ts
- source-amendment.ts
- shared.ts
- process.ts
- work.ts
- outbox.ts
- coordination-tick.ts
- Coordinator
- engine.ts
- Offices
- cec/workflow.ts
- ticket-evidence.ts
- tracking-issue.ts
- owned-artifact.ts
- accept-stage-result.ts
- node-visuals.ts
- .getEffect
- ref_node_crypto
- Ticket
- it-specialist.ts
- coordination.ts
- work-summary.ts
- scene-motion.ts
- TelemetryPanel.tsx
- fact-bounds.ts
- display-scene.ts
- capture-session-clone.py
- github/issue-publication.ts
- control-store.ts
- preferences-store.ts
- codex-rollout.ts
- publication.ts
- refresh-evidence.ts
- checkpoint-completion.ts
- assignment-poll.ts
- extract-worker.mjs
- create-candidate.ts
- retire-history.ts
- command-registry.ts
- ITFollowUps.tsx
- CommittedBrain
- RoomCamera.tsx
- ProjectProgress
- Store
- highestStableAtLeast
- run-evidence.ts
- server_delivery_harness_delivery_authority_resolvedeliverywork
- server_features_questions_pending_round_pendinground
- server_features_questions_pending_round_pendingrounds
- server_features_questions_pending_round_roundauthor
- src_shared_personas
- src_shared_workkey

## God Nodes (most connected - your core abstractions)
1. `Store` - 355 edges
2. `TicketJob` - 174 edges
3. `digest()` - 165 edges
4. `artifact()` - 129 edges
5. `GitHubDelivery` - 122 edges
6. `command()` - 111 edges
7. `workKey()` - 101 edges
8. `cx()` - 88 edges
9. `currentAssignment()` - 84 edges
10. `Button` - 84 edges

## Surprising Connections (you probably didn't know these)
- `apply()` --indirect_call--> `note()`  [INFERRED]
  src/conversations/OutboxSavedImplementation.tsx → server/cec/parking/resume-parked.ts
- `projectOutbox()` --calls--> `parkedProviderWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts
- `projectOutbox()` --calls--> `readinessWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts
- `cecChatPrompt()` --calls--> `timeReport()`  [EXTRACTED]
  server/conversations/prompts/conversations.ts → src/timing/timing.ts
- `replacementContext()` --calls--> `slackMessageUrl()`  [EXTRACTED]
  server/conversations/slack/supersession-proof.ts → src/shared.ts

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

## Communities (111 total, 9 thin omitted)

### Community 0 - "requests.ts"
Cohesion: 0.08
Nodes (54): deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, accounting, DeliverySubject, nonDelivery, originalReads (+46 more)

### Community 1 - "github-delivery.ts"
Cohesion: 0.05
Nodes (87): harnessCloseout(), PASSING, verifyMergeActions(), findingsBlock(), gateRegisteredDelivery(), assertDeliveryMayMutate(), runHarnessStage(), HANDS_OFF_PROJECTS (+79 more)

### Community 2 - "features.ts"
Cohesion: 0.06
Nodes (65): approveFeature(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), artifactPath(), digest(), document() (+57 more)

### Community 3 - "store.ts"
Cohesion: 0.09
Nodes (23): Document, isAccessOnlyPlan(), settledAccessOnlyState(), continueAccessOnlyPlan(), entryExists(), SlackMessages, goalNoticeAuthorized(), goalNoticeNeverDispatched() (+15 more)

### Community 4 - "workKey"
Cohesion: 0.06
Nodes (82): completedPRReviews(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal (+74 more)

### Community 5 - "artifact"
Cohesion: 0.08
Nodes (72): deliveryIntakeBlocker(), savedActivationFailure(), savedCandidateAdmission, assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts() (+64 more)

### Community 6 - "source-amendment-scope.ts"
Cohesion: 0.08
Nodes (34): approvedText(), assert(), assert(), normalize(), officialUrls, ReleaseCapture, verifyReleaseCaptures(), capture (+26 more)

### Community 7 - "harnessEffect"
Cohesion: 0.31
Nodes (11): activeEffectId(), harnessEffect, park(), officeMergeProvenance(), reconcileMergeScannerRetry(), Retry, retryMergeScanner(), retryReadBack() (+3 more)

### Community 8 - "session-bridge.ts"
Cohesion: 0.06
Nodes (54): ref_node_perf_hooks, ref_ws, claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexDaemonProcesses(), accountCodexProcesses() (+46 more)

### Community 9 - "Inspector.tsx"
Cohesion: 0.11
Nodes (66): Conversation(), Outbox(), SlackDeliveryCard(), blockedSummary(), ServiceHealthPanel(), followUp(), labels, ServiceHealthRow() (+58 more)

### Community 10 - "App.tsx"
Cohesion: 0.07
Nodes (38): ref_lucide_react, ref_react_dom, itAgent(), itDiagnostics(), BrainDrawer(), themeColor, App(), CONNECTION (+30 more)

### Community 11 - "JiraIssuePublisher"
Cohesion: 0.19
Nodes (8): JiraIssuePublisher, jiraText(), keyOf(), descriptionPreimage(), plain(), publicationDescription(), FeatureManifestItem, FeatureOperation

### Community 12 - "digest"
Cohesion: 0.13
Nodes (45): admitPRMetadata(), assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema, savedMetadataAssessment(), validateSaved(), metadataClaim() (+37 more)

### Community 13 - "agents.ts"
Cohesion: 0.05
Nodes (53): implementationWorkerContext(), intakeEnumeration(), intakeMembership(), cecPrompt(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt() (+45 more)

### Community 14 - "TicketJob"
Cohesion: 0.07
Nodes (42): removeAdoptedClone(), namedRepairIds(), Check, harnessChecks(), harnessValidate(), harnessValidationEligible(), scriptExit(), pinCourierIdentityRefusal() (+34 more)

### Community 15 - "daily-cto.ts"
Cohesion: 0.14
Nodes (11): DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), reviewWeekday(), Briefing, saveReviewBriefing(), ControlStore (+3 more)

### Community 16 - ".emit"
Cohesion: 0.07
Nodes (45): ref_zod, assertConversationReadback(), Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+37 more)

### Community 17 - "ref_react"
Cohesion: 0.07
Nodes (60): ref_motion, ref_react, ref_react_markdown, ref_remark_gfm, ref_yaml, Activity(), ActivityTimeline(), AssignmentKnowledge() (+52 more)

### Community 18 - "config.ts"
Cohesion: 0.13
Nodes (35): ref_node_url, featureItemComplete(), reconcileFeatureCompletion(), discoveryPrompt(), planPrompt(), helperTelemetry(), DELAYS, MAX_EXECUTIONS (+27 more)

### Community 19 - "Button"
Cohesion: 0.16
Nodes (32): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS, PickupForm(), acceptPreferences() (+24 more)

### Community 20 - "index.tsx"
Cohesion: 0.05
Nodes (59): SendMessage, LessonDecisionAction, lessonDecisionState(), readLessonDecision(), ctoInputFailure(), OutboxCTOInput(), recover(), OutboxLessonDecision() (+51 more)

### Community 21 - "scheduled-captures.ts"
Cohesion: 0.16
Nodes (42): enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest, captureRequests(), failCapture(), requestCapture() (+34 more)

### Community 22 - "assignments.ts"
Cohesion: 0.08
Nodes (39): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, GraphNode (+31 more)

### Community 23 - "useLiveTiming.ts"
Cohesion: 0.15
Nodes (21): displayAgentTask(), githubStageLabels, withoutElapsed(), LiveAgentTask(), Props, RunningTask(), text(), Agent (+13 more)

### Community 24 - "ref_node_path"
Cohesion: 0.06
Nodes (89): ref_node_fs, ref_node_os, ref_node_path, ref_node_util, GitRead, patchArgs, sourceCopyMatches(), interruptedImplementation() (+81 more)

### Community 25 - "index.ts"
Cohesion: 0.09
Nodes (38): ref_hono_node_server, ref_node_http, ref_vite, implementationContinuationRoute(), close(), config, itSpecialist, loadedRevision (+30 more)

### Community 26 - "lesson-selection.ts"
Cohesion: 0.06
Nodes (36): ref_node_stream, ref_node_timers, args, [cmd,...rawArgs], commands, key, projectIndex, lessonBrainAudit (+28 more)

### Community 27 - "PeoplePanel.tsx"
Cohesion: 0.10
Nodes (42): label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+34 more)

### Community 28 - "record-trigger.ts"
Cohesion: 0.07
Nodes (56): isBlocking(), LEARNING_BASELINES, maintainLearning(), maintenanceSubject(), MaintenanceSubjectFacts, busyMaintenanceIds(), clip(), maintenanceBlockedId() (+48 more)

### Community 29 - "demand-facts.ts"
Cohesion: 0.11
Nodes (22): clip(), DEMAND_LIMIT, demandFacts(), key(), LessonKey, notes(), clip(), MISSED_QUERY_LIMIT (+14 more)

### Community 30 - "intent.ts"
Cohesion: 0.09
Nodes (28): ref_node_child_process, file, folder, logs, root, nativeGitRead(), savedImplementation(), sha() (+20 more)

### Community 31 - "run-retrospective.ts"
Cohesion: 0.10
Nodes (39): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, blockingTrigger, brainOverlap, brainOverlapQuery() (+31 more)

### Community 32 - "OfficeScene.tsx"
Cohesion: 0.17
Nodes (32): Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk(), ElevatorStage() (+24 more)

### Community 33 - "worker-runtime.ts"
Cohesion: 0.07
Nodes (38): SlackResultSchema, SlackVerificationSchema, candidateWorkspaceEnvironment(), ApproachSchema, assignmentSubject(), dispatchExposure(), prepareExposure(), lessonPurpose() (+30 more)

### Community 34 - "pilot-delivery.ts"
Cohesion: 0.18
Nodes (26): continueImplementation(), dispatchNightly(), drainDelivery(), requestDelivery(), startPilot(), Attempt, needsResumeReconciliation(), eligibility() (+18 more)

### Community 35 - "maintenance/maintenance.ts"
Cohesion: 0.09
Nodes (29): maintenancePolicies(), captureMaintenanceStep(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice(), candidateOwner() (+21 more)

### Community 36 - "dependency-bots/adopt.ts"
Cohesion: 0.16
Nodes (23): Execute, adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR, openDependabotPulls() (+15 more)

### Community 37 - "constellation-runtime.ts"
Cohesion: 0.11
Nodes (20): ref_3d_force_graph, CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point, createConstellation() (+12 more)

### Community 38 - ".save"
Cohesion: 0.18
Nodes (31): jiraCollection(), BLOCKED, findComment(), LiveIssue, readIssue(), readIssues(), Execute, jira() (+23 more)

### Community 39 - "notifications.ts"
Cohesion: 0.19
Nodes (14): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR (+6 more)

### Community 40 - "resume-provider-review.ts"
Cohesion: 0.21
Nodes (24): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), ProjectCard, projectCards(), projectGraphql() (+16 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.07
Nodes (53): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), server_telemetry_billable_work_issue_key, isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence() (+45 more)

### Community 42 - "run.ts"
Cohesion: 0.15
Nodes (23): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationCandidates(), investigationId(), investigationFollowUps(), investigationResolution(), syncInvestigations(), OFFICE_FIX_PROMPT (+15 more)

### Community 43 - "QuestionStepper.tsx"
Cohesion: 0.19
Nodes (18): FeatureQuestionProjection, OutboxQuestionRound(), send(), draftKey(), readDraft(), saveDraft(), QuestionRound(), nextQuestion() (+10 more)

### Community 44 - "http/commands.ts"
Cohesion: 0.17
Nodes (21): configureNotices(), retryRecipientLookup(), recoverCTOInput(), enqueueGreen156(), bindDiscoveryResume(), DiscoveryResumeInput, enqueueMetadataRecovery(), baselineLearning() (+13 more)

### Community 45 - "knowledge.ts"
Cohesion: 0.08
Nodes (36): normalizeStatement(), decideOfficeProposal(), now(), OfficeKnowledgeStore, proposeOfficeLessons(), retireOfficeLesson(), Input, promoteNoteLesson() (+28 more)

### Community 46 - "run-accounting.ts"
Cohesion: 0.13
Nodes (27): BoundedRead, CompletionReader, codexHome(), createdAt(), dayDirs(), header(), readCodexRollout(), ROLLOUT_MAX_BYTES (+19 more)

### Community 47 - "scheduled-work.ts"
Cohesion: 0.07
Nodes (58): deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), metadataRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), requestPriority() (+50 more)

### Community 48 - "packed165-admission.ts"
Cohesion: 0.16
Nodes (27): requireDeliveryAuthority(), HarnessControl, withHarnessWork(), admitPacked165(), history(), makePacked165Candidate(), packed165CandidateIdentity(), packed165Admitted() (+19 more)

### Community 49 - "weekly-rollup.ts"
Cohesion: 0.09
Nodes (34): deliveryMetrics(), median(), learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck() (+26 more)

### Community 50 - "dependencies.ts"
Cohesion: 0.17
Nodes (20): MergeNotifications, Admission, admit(), IntakeContext, WAIT_STATUSES, compatible(), dependencyCompletionKey(), dependencyEligibility() (+12 more)

### Community 51 - "scheduler.ts"
Cohesion: 0.12
Nodes (17): ROLES, systemClock, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch() (+9 more)

### Community 52 - "blocker-followups.ts"
Cohesion: 0.19
Nodes (18): conversationReadbackReady(), queueConversationReadback(), handoff(), reconcileBlockerFollowups(), improvementIntakeGate(), captureLearning(), learningDigest(), recordLearningOpportunity() (+10 more)

### Community 53 - "remove-candidate.ts"
Cohesion: 0.18
Nodes (18): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot() (+10 more)

### Community 54 - "admit-improvement.ts"
Cohesion: 0.21
Nodes (17): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+9 more)

### Community 55 - "telemetry.ts"
Cohesion: 0.10
Nodes (27): CodexRollout, CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL (+19 more)

### Community 56 - "jira-time.ts"
Cohesion: 0.32
Nodes (8): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent()

### Community 57 - "Goals.tsx"
Cohesion: 0.13
Nodes (22): CTOReview(), goalState, DailyCTO(), GoalHistory(), load(), reportDate(), reviewStatus, GoalList() (+14 more)

### Community 58 - "local-config.ts"
Cohesion: 0.18
Nodes (16): IntakeBinding, intakeJql(), intakeLocation(), projectListScope(), AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), localBindings, assertModelOverrides() (+8 more)

### Community 59 - "azure.ts"
Cohesion: 0.11
Nodes (30): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+22 more)

### Community 60 - "source-amendment.ts"
Cohesion: 0.07
Nodes (69): ref_node_async_hooks, containedFile(), stagePrompt(), StagePromptInput, METADATA_FINDING_GUIDANCE, adoptCandidate(), reported, Scope (+61 more)

### Community 61 - "shared.ts"
Cohesion: 0.05
Nodes (39): assignmentDiagnostics(), diagnosticContext(), listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes (+31 more)

### Community 62 - "process.ts"
Cohesion: 0.11
Nodes (24): Event, one(), prePushRejection(), PushIdentity, Candidate, settledPushBoundary(), inactivityWatch(), At (+16 more)

### Community 63 - "work.ts"
Cohesion: 0.11
Nodes (22): BLOCKED_CAUSES, blockedCauses(), projectReadiness(), explanation(), LABELS, stoppedReason(), ProjectReadiness, AssignmentResult (+14 more)

### Community 64 - "outbox.ts"
Cohesion: 0.10
Nodes (27): ctoInputRecovered(), conversationResolved(), projectOutbox(), syncOutbox(), projectSlackDeliveries(), Input, supersedeSlackDelivery(), replacementContext() (+19 more)

### Community 65 - "coordination-tick.ts"
Cohesion: 0.11
Nodes (19): PrerequisitesSchema, BrainFollowup, Result, brainCheckpointCompletion(), reconcileCompletedCheckpoints(), legacy, reconcileContinuations(), pruneCompletedReads() (+11 more)

### Community 67 - "engine.ts"
Cohesion: 0.08
Nodes (11): correlatedBuild(), enableNightly(), GitHubMonitor, drainMaintenance(), reconcileMaintenance(), requestMaintenance(), Engine, observe() (+3 more)

### Community 68 - "Offices"
Cohesion: 0.13
Nodes (10): ref_smol_toml, seedOfficeLessons(), file, project, root, projectById(), projectData(), Offices (+2 more)

### Community 69 - "cec/workflow.ts"
Cohesion: 0.08
Nodes (44): applyIntakeObservation(), checkMail(), drainMail(), requestMail(), parksInJira(), resume(), MISSING_INTAKE, reconcileMailbox() (+36 more)

### Community 70 - "ticket-evidence.ts"
Cohesion: 0.14
Nodes (22): ref_node_string_decoder, assetDownloader(), attachmentKind(), evidenceDirectory(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS (+14 more)

### Community 71 - "tracking-issue.ts"
Cohesion: 0.15
Nodes (20): readBackOrThrow(), retryRead(), ensureTrackingIssue(), findTrackingIssue(), ownTracking(), TrackingIssue, trackingIssueBody(), trackingIssueTitle() (+12 more)

### Community 72 - "owned-artifact.ts"
Cohesion: 0.19
Nodes (16): investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, NOTIFY_HELPER, notifyHelperResolution(), OFFICE_SOURCE_PATHS, officeSource() (+8 more)

### Community 73 - "accept-stage-result.ts"
Cohesion: 0.14
Nodes (29): acceptStageResult(), acceptConflictRepair(), draftReadHeadMatches(), assertDraftClaimHistory(), linkDraftIssue(), protectedOriginalClaim(), METADATA_FINDING, publicationReadArgs() (+21 more)

### Community 74 - "node-visuals.ts"
Cohesion: 0.19
Nodes (14): ref_three, ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels() (+6 more)

### Community 75 - ".getEffect"
Cohesion: 0.21
Nodes (9): GitHubOperations, validateGitHubIssue(), fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), Assessment, closeNativeRefresh(), fingerprint() (+1 more)

### Community 76 - "ref_node_crypto"
Cohesion: 0.16
Nodes (27): ref_node_crypto, commandFeature(), createFeature(), reviewQuestions(), assertEnrollable(), applyHarnessAction(), HarnessActionInput, recoveryPreconditions() (+19 more)

### Community 77 - "Ticket"
Cohesion: 0.21
Nodes (13): CommentPage, commentReadback(), Assignment, Content, Transition, JiraOperations, plain(), jiraRecord() (+5 more)

### Community 78 - "it-specialist.ts"
Cohesion: 0.18
Nodes (17): partialLocalCleanupKey(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), ITContext, readBackConversations(), diagnosticSnapshot() (+9 more)

### Community 79 - "coordination.ts"
Cohesion: 0.17
Nodes (17): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation(), checkpointWindow(), dueAt() (+9 more)

### Community 80 - "work-summary.ts"
Cohesion: 0.16
Nodes (23): envelopeCard, deliveryRepairProjection(), card, ACTIVE, maintenanceUpdate(), PMQueueItem, pmQueueItems(), prerequisiteKeys() (+15 more)

### Community 81 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 82 - "TelemetryPanel.tsx"
Cohesion: 0.22
Nodes (18): TelemetryReport, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens(), usd(), KpiTiles() (+10 more)

### Community 83 - "fact-bounds.ts"
Cohesion: 0.18
Nodes (19): leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance() (+11 more)

### Community 84 - "display-scene.ts"
Cohesion: 0.20
Nodes (12): KnowledgeNode, Constellation(), ConstellationView, ConstellationRuntime, DisplayNode, initialSelection, MapSelection, FocusOverlay() (+4 more)

### Community 85 - "capture-session-clone.py"
Cohesion: 0.15
Nodes (10): ctypes, errno, importlib_util, json, os, pathlib, Copy a coherent macOS clone of inherited reader fd3 to anonymous target fd4. No…, Read-only protocol adapter for the installed review helper. No model dispatch. (+2 more)

### Community 86 - "github/issue-publication.ts"
Cohesion: 0.23
Nodes (7): PublicationReceipt, Assign, Board, Content, GitHubIssuePublisher, number(), same()

### Community 87 - "control-store.ts"
Cohesion: 0.18
Nodes (10): ref_node_sqlite, Clock, applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, statementCache(), initialSnapshot() (+2 more)

### Community 88 - "preferences-store.ts"
Cohesion: 0.17
Nodes (10): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS (+2 more)

### Community 89 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 90 - "publication.ts"
Cohesion: 0.14
Nodes (12): featureById(), Link, linkFeature(), FeaturePublisher, publishFeature(), reconcilePublication(), uncertainPublications(), reserveIdentity() (+4 more)

### Community 91 - "refresh-evidence.ts"
Cohesion: 0.31
Nodes (11): readEvidence(), ProviderEvidence, canonical(), evidenceDigest(), evidenceHash(), semantic(), stableUrl(), refreshFeatureEvidence() (+3 more)

### Community 92 - "checkpoint-completion.ts"
Cohesion: 0.28
Nodes (5): BrainStatusSchema, identity, coverageSchema, followupSchema, verified

### Community 93 - "assignment-poll.ts"
Cohesion: 0.20
Nodes (11): noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), admitReadyCards(), pinCourier, due(), unparkReleasedWaits(), resumeParked() (+3 more)

### Community 94 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (6): ref_mammoth, ref_pdfjs_dist, bounded(), extract(), fail(), [path,kind]

### Community 95 - "create-candidate.ts"
Cohesion: 0.31
Nodes (9): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+1 more)

### Community 96 - "retire-history.ts"
Cohesion: 0.33
Nodes (7): enqueueHistoryRetirement(), historicalRecordDigest(), Intent, records(), retireIncompleteHistory(), HistoryRetirement, HistoryRetirementIntent

### Community 97 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 98 - "ITFollowUps.tsx"
Cohesion: 0.67
Nodes (4): itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps()

### Community 100 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (10): ref_react_three_drei, ref_react_three_fiber, ref_three_stdlib, CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility (+2 more)

### Community 102 - "Store"
Cohesion: 0.11
Nodes (5): GitHubFeaturePublisher, JiraFeaturePublisher, Store, command(), OfficeEvent

### Community 103 - "highestStableAtLeast"
Cohesion: 0.83
Nodes (3): compare(), highestStableAtLeast(), parts()

### Community 104 - "run-evidence.ts"
Cohesion: 0.47
Nodes (4): comparable(), EvidenceOutcome, recordRunEvidence(), RunAccounting

## Knowledge Gaps
- **492 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+487 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 636 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `requests.ts`, `github-delivery.ts`, `features.ts`, `store.ts`, `workKey`, `artifact`, `harnessEffect`, `session-bridge.ts`, `digest`, `agents.ts`, `TicketJob`, `.emit`, `config.ts`, `index.tsx`, `scheduled-captures.ts`, `assignments.ts`, `ref_node_path`, `index.ts`, `lesson-selection.ts`, `record-trigger.ts`, `demand-facts.ts`, `intent.ts`, `run-retrospective.ts`, `worker-runtime.ts`, `pilot-delivery.ts`, `maintenance/maintenance.ts`, `dependency-bots/adopt.ts`, `.save`, `notifications.ts`, `resume-provider-review.ts`, `time-scope.ts`, `run.ts`, `http/commands.ts`, `knowledge.ts`, `run-accounting.ts`, `scheduled-work.ts`, `packed165-admission.ts`, `weekly-rollup.ts`, `dependencies.ts`, `scheduler.ts`, `blocker-followups.ts`, `remove-candidate.ts`, `admit-improvement.ts`, `jira-time.ts`, `azure.ts`, `source-amendment.ts`, `shared.ts`, `process.ts`, `outbox.ts`, `coordination-tick.ts`, `engine.ts`, `Offices`, `cec/workflow.ts`, `ticket-evidence.ts`, `tracking-issue.ts`, `owned-artifact.ts`, `accept-stage-result.ts`, `.getEffect`, `ref_node_crypto`, `Ticket`, `it-specialist.ts`, `coordination.ts`, `fact-bounds.ts`, `github/issue-publication.ts`, `control-store.ts`, `publication.ts`, `refresh-evidence.ts`, `checkpoint-completion.ts`, `assignment-poll.ts`, `create-candidate.ts`, `retire-history.ts`, `run-evidence.ts`?**
  _High betweenness centrality (0.106) - this node is a cross-community bridge._
- **Why does `Coordinator` connect `Coordinator` to `requests.ts`, `coordination-tick.ts`, `Offices`, `Store`, `session-bridge.ts`, `coordination.ts`, `scheduled-work.ts`, `dependencies.ts`, `config.ts`, `scheduled-captures.ts`, `assignment-poll.ts`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `Role` connect `worker-runtime.ts` to `github-delivery.ts`, `store.ts`, `Inspector.tsx`, `App.tsx`, `agents.ts`, `TicketJob`, `.emit`, `index.tsx`, `ref_node_path`, `PeoplePanel.tsx`, `record-trigger.ts`, `OfficeScene.tsx`, `maintenance/maintenance.ts`, `http/commands.ts`, `run-accounting.ts`, `packed165-admission.ts`, `scheduler.ts`, `local-config.ts`, `shared.ts`, `work.ts`, `outbox.ts`, `cec/workflow.ts`, `accept-stage-result.ts`, `scene-motion.ts`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _492 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `requests.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08169014084507042 - nodes in this community are weakly interconnected._
- **Should `github-delivery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.054838709677419356 - nodes in this community are weakly interconnected._
- **Should `features.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0559244126659857 - nodes in this community are weakly interconnected._