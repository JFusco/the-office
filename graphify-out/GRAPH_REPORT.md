# Graph Report - the-office  (2026-11-15)

## Corpus Check
- 842 files · ~339,014 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4153 nodes · 19365 edges · 113 communities (111 shown, 2 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 629 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1a4f5036`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- implementation-recovery.ts
- requests.ts
- dependency-bots/adopt.ts
- github-delivery.ts
- Inspector.tsx
- TicketJob
- session-bridge.ts
- ref_react
- agents.ts
- .transaction
- source-amendment-scope.ts
- api-routes.ts
- App.tsx
- features/workflow.ts
- reader.ts
- scheduled-captures.ts
- run-retrospective.ts
- record-trigger.ts
- worker-runtime.ts
- artifact
- features.ts
- cec.ts
- PeoplePanel.tsx
- tracking-issue.ts
- knowledge.ts
- maintenance/maintenance.ts
- coordination.ts
- activation-recovery.ts
- Coordinator
- GitHubDelivery
- digest
- index.tsx
- sanitize
- lesson-selection.ts
- sanitizeObject
- harnessEffect
- cost-ledger.ts
- telemetry.ts
- continueUnsealedQA
- run-accounting.ts
- retrospective-subject.ts
- time-scope.ts
- office-state-view.ts
- .save
- scheduled-work.ts
- ref_zod
- OfficeScene.tsx
- .getEffect
- engine.ts
- assignments.ts
- .emit
- Ticket
- Effects
- ticket-stage-runner.ts
- work.ts
- weekly-rollup.ts
- github-context.ts
- TimeBook.tsx
- candidate.ts
- Role
- record-push.ts
- continue-ownership-read.ts
- OfficeSnapshot
- remove-candidate.ts
- ref_node_crypto
- fact-bounds.ts
- QuestionStepper.tsx
- ControlStore
- daily-cto.ts
- AssignmentKnowledge.tsx
- constellation-runtime.ts
- Store
- JiraIssuePublisher
- report.ts
- index.ts
- admit-improvement.ts
- intent.ts
- workKey
- reconcile-publication.ts
- jira-time.ts
- control-store.ts
- scene-motion.ts
- node-visuals.ts
- preferences-store.ts
- outbox.ts
- ledger.ts
- qualify.ts
- goal-reviews.ts
- codex-rollout.ts
- cec-reads.ts
- coordination-tick.ts
- RoomCamera.tsx
- Engine
- ITFollowUps.tsx
- projects.ts
- capture-session-clone.py
- createConstellation
- Outbox.tsx
- queueMergeNotice
- time-readback.ts
- merge-scanner-retry.ts
- shared.ts
- retire-history.ts
- source-amendment.ts
- install-service.mjs
- extract-worker.mjs
- unblock-brief.ts
- create-candidate.ts
- live-reach.ts
- ProjectProgress
- highestStableAtLeast
- CommandRegistry
- qa-plan-retry.ts

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
10. `OfficeSnapshot` - 85 edges

## Surprising Connections (you probably didn't know these)
- `apply()` --indirect_call--> `note()`  [INFERRED]
  src/conversations/OutboxSavedImplementation.tsx → server/cec/parking/resume-parked.ts
- `projectOutbox()` --calls--> `parkedProviderWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts
- `projectOutbox()` --calls--> `readinessWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts
- `replacementContext()` --calls--> `slackMessageUrl()`  [EXTRACTED]
  server/conversations/slack/supersession-proof.ts → src/shared.ts
- `pump()` --calls--> `deferredPickup()`  [EXTRACTED]
  server/conversations/team-conversation-pump.ts → src/work/pickup-state.ts

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

## Communities (113 total, 2 thin omitted)

### Community 0 - "implementation-recovery.ts"
Cohesion: 0.08
Nodes (45): pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat(), continuationScope() (+37 more)

### Community 1 - "requests.ts"
Cohesion: 0.06
Nodes (69): ref_node_async_hooks, deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, deliveryIntakeBlocker(), gateRegisteredDelivery(), accounting (+61 more)

### Community 2 - "dependency-bots/adopt.ts"
Cohesion: 0.17
Nodes (23): readBackOrThrow(), closesIssue(), linkedBody(), linkPR(), dependabotPR, adoptDependencyBot(), adoptOne(), Guard (+15 more)

### Community 3 - "github-delivery.ts"
Cohesion: 0.06
Nodes (84): containedFile(), findingsBlock(), requireDeliveryAuthority(), assertDeliveryMayMutate(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery() (+76 more)

### Community 4 - "Inspector.tsx"
Cohesion: 0.10
Nodes (68): DailyCTOSummary, blockedSummary(), currentServices(), ServiceHealthPanel(), followUp(), labels, ServiceHealthRow(), BlockerFollowups() (+60 more)

### Community 5 - "TicketJob"
Cohesion: 0.11
Nodes (37): ref_node_fs, ref_node_os, ref_node_path, Execute, installDependencies(), major(), removeAdoptedClone(), namedRepairIds() (+29 more)

### Community 6 - "session-bridge.ts"
Cohesion: 0.05
Nodes (57): ref_node_perf_hooks, ref_node_string_decoder, ref_ws, extractDocument, Extraction, Extractor, claudeSessionContext(), readTranscript (+49 more)

### Community 7 - "ref_react"
Cohesion: 0.10
Nodes (44): ref_react, KnowledgeActivity, KnowledgeActivityPage, KnowledgeEdge, KnowledgeMap, KnowledgeNode, Activity(), ActivityTimeline() (+36 more)

### Community 8 - "agents.ts"
Cohesion: 0.09
Nodes (30): stageInstructions, cecChatPrompt(), ctoChatPrompt(), slackSendPrompt(), slackVerifyPrompt(), HANDS_OFF_RESOLUTION_GUIDANCE, RESOLUTION_GUIDANCE, PICKUP_CHAT (+22 more)

### Community 9 - ".transaction"
Cohesion: 0.10
Nodes (38): interruptAdoptions(), featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS, reserveReplacement() (+30 more)

### Community 10 - "source-amendment-scope.ts"
Cohesion: 0.08
Nodes (35): approvedText(), assert(), assert(), normalize(), officialUrls, ReleaseCapture, verifyReleaseCaptures(), capture (+27 more)

### Community 11 - "api-routes.ts"
Cohesion: 0.09
Nodes (29): ref_node_stream, ref_node_timers, implementationPreview(), implementationContinuationRoute(), closedReadonlyPlan(), Document, entryExists(), inspectClosedQAPlan() (+21 more)

### Community 12 - "App.tsx"
Cohesion: 0.05
Nodes (67): ref_lucide_react, ref_motion, ref_react_dom, BrainDrawer(), themeColor, App(), BrainWorkspace, CONNECTION (+59 more)

### Community 13 - "features/workflow.ts"
Cohesion: 0.08
Nodes (54): approveFeature(), featureById(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), discoveryPrompt(), planPrompt() (+46 more)

### Community 14 - "reader.ts"
Cohesion: 0.11
Nodes (21): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, CommittedBrain (+13 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.15
Nodes (46): createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest, captureRequests() (+38 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.09
Nodes (44): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, blockingTrigger, isBlocking(), brainOverlap (+36 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.11
Nodes (37): LEARNING_BASELINES, maintainLearning(), clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates(), maintenanceCompletedId(), maintenanceKey() (+29 more)

### Community 18 - "worker-runtime.ts"
Cohesion: 0.08
Nodes (32): candidateWorkspaceEnvironment(), ApproachSchema, assignmentSubject(), assertModelOverrides(), CODEX_DEFAULT_EFFORT, CODEX_DEFAULT_MODEL, CODEX_EFFORTS, CODEX_ROLES (+24 more)

### Community 19 - "artifact"
Cohesion: 0.07
Nodes (84): partialLocalCleanupCandidate(), continuationNativeReview(), candidateInput(), children, oldAdoptionBasis(), savedCandidateAdmission, assertPostConflictFiles(), assertPostConflictOwnership() (+76 more)

### Community 20 - "features.ts"
Cohesion: 0.08
Nodes (54): commandFeature(), reviewQuestions(), bindFeature(), currentApproval(), featureGate(), predecessorComplete(), automaticIntakeWait(), recoveryHeld() (+46 more)

### Community 21 - "cec.ts"
Cohesion: 0.17
Nodes (19): cecPrompt(), resolvedDecisionNote(), reviewedPlanGuidance, reviewedPlanGuideDigest, qaPlanEvidenceGap(), qaRunDirectory(), safeWebUrl(), isQAStage() (+11 more)

### Community 22 - "PeoplePanel.tsx"
Cohesion: 0.09
Nodes (44): label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+36 more)

### Community 23 - "tracking-issue.ts"
Cohesion: 0.33
Nodes (10): ensureTrackingIssue(), findTrackingIssue(), ownTracking(), TrackingIssue, trackingIssueBody(), trackingIssueTitle(), trackingMarker(), centralCompanionHandoff() (+2 more)

### Community 24 - "knowledge.ts"
Cohesion: 0.06
Nodes (45): normalizeStatement(), LessonBrainOverlap, decideOfficeProposal(), now(), OfficeKnowledgeStore, proposeOfficeLessons(), retireOfficeLesson(), Input (+37 more)

### Community 25 - "maintenance/maintenance.ts"
Cohesion: 0.09
Nodes (30): maintenancePolicies(), captureLearning(), captureMaintenanceStep(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice() (+22 more)

### Community 26 - "coordination.ts"
Cohesion: 0.11
Nodes (31): admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, resumeParked(), compatible(), dependencyEligibility(), DependencyStores (+23 more)

### Community 27 - "activation-recovery.ts"
Cohesion: 0.07
Nodes (85): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+77 more)

### Community 28 - "Coordinator"
Cohesion: 0.07
Nodes (3): coordination(), Coordinator, markCaptureStart()

### Community 29 - "GitHubDelivery"
Cohesion: 0.11
Nodes (25): HarnessControl, GitHubDelivery, admitPacked165(), history(), makePacked165Candidate(), packed165CandidateIdentity(), packed165Subject(), retainedPacked165Effect() (+17 more)

### Community 30 - "digest"
Cohesion: 0.09
Nodes (57): ref_node_util, harnessCloseout(), PASSING, verifyMergeActions(), retryRead(), runHarnessStage(), harnessStageResult(), receipt() (+49 more)

### Community 31 - "index.tsx"
Cohesion: 0.09
Nodes (51): TicketPlanningAction(), SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState (+43 more)

### Community 32 - "sanitize"
Cohesion: 0.09
Nodes (33): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+25 more)

### Community 33 - "lesson-selection.ts"
Cohesion: 0.08
Nodes (38): guidanceExcerpt(), lessonIssueBody(), lessonIssueMarker(), officeKnowledgeSnapshot(), lessonForProject(), INSTALLED, installedLesson(), Bucket (+30 more)

### Community 34 - "sanitizeObject"
Cohesion: 0.08
Nodes (35): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+27 more)

### Community 35 - "harnessEffect"
Cohesion: 0.24
Nodes (23): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), ProjectCard, projectCards(), projectGraphql() (+15 more)

### Community 36 - "cost-ledger.ts"
Cohesion: 0.15
Nodes (28): captureCost(), server_telemetry_cost_entries_costcoveragesummary, costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress() (+20 more)

### Community 37 - "telemetry.ts"
Cohesion: 0.11
Nodes (24): CodexRollout, CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL (+16 more)

### Community 38 - "continueUnsealedQA"
Cohesion: 0.27
Nodes (8): continueUnsealedQA(), entry(), handoffOwnership(), ReadbackOwnerDecision, OfficeQAHandoff, OfficeQAHandoffInput, OfficeQAHandoffRequest, QAOwnershipProof

### Community 39 - "run-accounting.ts"
Cohesion: 0.12
Nodes (32): BoundedRead, done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf(), CompletionReader, codexHome() (+24 more)

### Community 40 - "retrospective-subject.ts"
Cohesion: 0.19
Nodes (17): maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject, SubjectStepResult, ticketSubject() (+9 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.13
Nodes (29): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), server_telemetry_billable_work_issue_key, isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence() (+21 more)

### Community 42 - "office-state-view.ts"
Cohesion: 0.60
Nodes (4): leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore()

### Community 43 - ".save"
Cohesion: 0.18
Nodes (30): jiraCollection(), BLOCKED, findComment(), LiveIssue, readIssue(), readIssues(), Execute, jira() (+22 more)

### Community 44 - "scheduled-work.ts"
Cohesion: 0.12
Nodes (28): freshOwnershipRead(), deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), metadataRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork() (+20 more)

### Community 45 - "ref_zod"
Cohesion: 0.10
Nodes (26): ref_zod, completeNativeCheckpoint(), BrainStatusSchema, identity, brainCheckpointCompletion(), coverageSchema, followupSchema, verified (+18 more)

### Community 46 - "OfficeScene.tsx"
Cohesion: 0.17
Nodes (33): withoutElapsed(), Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk() (+25 more)

### Community 47 - ".getEffect"
Cohesion: 0.23
Nodes (10): dispatchedMetadataEffect(), diagnosticProof(), ownedArtifact(), rawHash(), recoverDiscovery(), scopeNote(), GitHubOperations, fileLessonIssue() (+2 more)

### Community 48 - "engine.ts"
Cohesion: 0.12
Nodes (26): continueImplementation(), checkMail(), drainMail(), requestMail(), dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery() (+18 more)

### Community 49 - "assignments.ts"
Cohesion: 0.11
Nodes (24): clip(), DEMAND_LIMIT, demandFacts(), DemandSection, key(), LessonKey, notes(), assignmentLookups (+16 more)

### Community 50 - ".emit"
Cohesion: 0.17
Nodes (24): requestQAPlanRetry(), configureChannelNotices(), configureNotices(), retryRecipientLookup(), recoverCTOInput(), enqueueGreen156(), bindDiscoveryResume(), DiscoveryResumeInput (+16 more)

### Community 51 - "Ticket"
Cohesion: 0.15
Nodes (8): implementationWorkerContext(), applyIntakeObservation(), MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), bindGitHubQA(), Agents, Ticket

### Community 52 - "Effects"
Cohesion: 0.14
Nodes (18): channelNoticeAuthorized(), ChannelSettings, notices(), queueChannelNotice(), Identity, MergeNotifications, NoticeSettings, comparableSlackText() (+10 more)

### Community 53 - "ticket-stage-runner.ts"
Cohesion: 0.15
Nodes (28): parksInJira(), run(), publicationEvidenceGap(), qaEvidenceGap(), resultGate(), stageResultGap(), afterDraft(), firstBuildStage() (+20 more)

### Community 54 - "work.ts"
Cohesion: 0.05
Nodes (52): Admission, classifyStop(), stopReason(), BLOCKED_CAUSES, blockedCauses(), projectReadiness(), incompleteReadOutput(), planReadRetry() (+44 more)

### Community 55 - "weekly-rollup.ts"
Cohesion: 0.11
Nodes (28): deliveryMetrics(), median(), learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), retire() (+20 more)

### Community 56 - "github-context.ts"
Cohesion: 0.11
Nodes (33): reviewInstructions(), deliveryTask(), DeliveryTaskInput, observe(), DISCOVERY_GUIDANCE, compactSteps(), checksFailed(), checksPassed() (+25 more)

### Community 57 - "TimeBook.tsx"
Cohesion: 0.09
Nodes (44): TelemetryReport, displayAgentTask(), LiveAgentTask(), Props, RunningTask(), text(), AzureBuild, src_shared_liveanchor (+36 more)

### Community 58 - "candidate.ts"
Cohesion: 0.18
Nodes (18): ref_node_child_process, GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles() (+10 more)

### Community 59 - "Role"
Cohesion: 0.14
Nodes (18): ROLES, DeliverySlot, officeCapacity, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork() (+10 more)

### Community 60 - "record-push.ts"
Cohesion: 0.15
Nodes (17): Event, one(), prePushRejection(), PushIdentity, Candidate, recordedPush(), settledPushBoundary(), At (+9 more)

### Community 61 - "continue-ownership-read.ts"
Cohesion: 0.30
Nodes (11): continueOwnershipRead(), expiredOwnershipRead(), ownershipReadGate(), ownershipReadState(), ownershipReadHistory(), ownershipReadSource(), readOwnershipCandidate, ReadOwnershipView (+3 more)

### Community 62 - "OfficeSnapshot"
Cohesion: 0.08
Nodes (37): recover(), OutboxSavedImplementation(), apply(), review(), OutboxSavedPlan(), reconcile(), FeatureDelivery(), FeatureDocuments() (+29 more)

### Community 63 - "remove-candidate.ts"
Cohesion: 0.18
Nodes (18): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot() (+10 more)

### Community 64 - "ref_node_crypto"
Cohesion: 0.09
Nodes (39): ref_node_crypto, CommentPage, commentReadback(), JiraOperations, plain(), jiraRecord(), unpack(), metadataDigest() (+31 more)

### Community 65 - "fact-bounds.ts"
Cohesion: 0.25
Nodes (15): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+7 more)

### Community 66 - "QuestionStepper.tsx"
Cohesion: 0.19
Nodes (18): FeatureQuestionProjection, OutboxQuestionRound(), send(), draftKey(), readDraft(), saveDraft(), QuestionRound(), nextQuestion() (+10 more)

### Community 67 - "ControlStore"
Cohesion: 0.16
Nodes (7): DailyCTO, EvidenceRequestConflict, queueGoalEvidenceRequest(), Briefing, saveReviewBriefing(), ControlStore, DailyCTOReport

### Community 68 - "daily-cto.ts"
Cohesion: 0.25
Nodes (8): evidenceRequestConflicts, dailyReviewPrompt(), dailyReviewDate(), reviewWeekday(), DailyResultSchema, FreshDailyResultSchema, GoalEvidenceRequestSchema, src_shared_dailyctoresult

### Community 69 - "AssignmentKnowledge.tsx"
Cohesion: 0.16
Nodes (20): ref_react_markdown, ref_remark_gfm, ref_yaml, AssignmentKnowledge(), Lookup(), DocumentMetadata, documentText(), KnowledgeDocumentText (+12 more)

### Community 70 - "constellation-runtime.ts"
Cohesion: 0.15
Nodes (17): ref_3d_force_graph, ref_three, CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point (+9 more)

### Community 71 - "Store"
Cohesion: 0.04
Nodes (46): ref_node_url, Assignment, Content, Transition, Document, isAccessOnlyPlan(), settledAccessOnlyState(), continueAccessOnlyPlan() (+38 more)

### Community 72 - "JiraIssuePublisher"
Cohesion: 0.22
Nodes (6): JiraIssuePublisher, jiraText(), keyOf(), descriptionPreimage(), plain(), publicationDescription()

### Community 73 - "report.ts"
Cohesion: 0.24
Nodes (14): TelemetryRow, TelemetrySync, Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount() (+6 more)

### Community 74 - "index.ts"
Cohesion: 0.07
Nodes (29): ref_hono_node_server, ref_node_http, ref_vite, AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), close(), config, itSpecialist (+21 more)

### Community 75 - "admit-improvement.ts"
Cohesion: 0.17
Nodes (21): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+13 more)

### Community 76 - "intent.ts"
Cohesion: 0.16
Nodes (13): assertOwnership(), decideImplementation(), ImplementationDecision, OwnershipRead, interruptedImplementation(), consumeQAPlanRetry(), Decision, itChatPrompt() (+5 more)

### Community 77 - "workKey"
Cohesion: 0.15
Nodes (22): completedPRReviews(), discoveryRecoveryCandidate(), dependencyVersion(), handoffSavedPrerequisites(), hasSavedPrerequisiteResult(), Ownership, qualified(), readDependencies() (+14 more)

### Community 78 - "reconcile-publication.ts"
Cohesion: 0.14
Nodes (11): FeaturePublisher, PublicationReceipt, publishFeature(), reconcilePublication(), uncertainPublications(), reserveIdentity(), GitHubIssuePublisher, number() (+3 more)

### Community 79 - "jira-time.ts"
Cohesion: 0.14
Nodes (22): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+14 more)

### Community 80 - "control-store.ts"
Cohesion: 0.11
Nodes (15): ref_node_sqlite, Clock, applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, statementCache(), initialSnapshot() (+7 more)

### Community 81 - "scene-motion.ts"
Cohesion: 0.25
Nodes (15): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+7 more)

### Community 82 - "node-visuals.ts"
Cohesion: 0.20
Nodes (13): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+5 more)

### Community 83 - "preferences-store.ts"
Cohesion: 0.19
Nodes (9): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS (+1 more)

### Community 84 - "outbox.ts"
Cohesion: 0.12
Nodes (22): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), ctoInputIdentityMatches(), ctoInputRecovered(), ADOPTION_STALLED_MS, conversationResolved(), projectOutbox() (+14 more)

### Community 85 - "ledger.ts"
Cohesion: 0.09
Nodes (37): projectSlackDeliveries(), slackRequestSettled(), supersedingDelivery(), INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationCandidates(), investigationId(), investigationEvidence() (+29 more)

### Community 86 - "qualify.ts"
Cohesion: 0.20
Nodes (11): Execute, adoptDependabot(), DEPENDABOT, openDependabotPulls(), readRepo(), refusal(), DependencyBot, pinCourier (+3 more)

### Community 87 - "goal-reviews.ts"
Cohesion: 0.13
Nodes (17): applyGoalReview(), EvidenceRefSchema, statusAllowed(), workEvidence(), GoalInput, saveGoal(), queueGoalNotice(), DailyCTOBriefing (+9 more)

### Community 88 - "codex-rollout.ts"
Cohesion: 0.29
Nodes (9): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO (+1 more)

### Community 89 - "cec-reads.ts"
Cohesion: 0.22
Nodes (12): IntakeBinding, intakeEnumeration(), intakeJql(), intakeMembership(), projectListScope(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt() (+4 more)

### Community 90 - "coordination-tick.ts"
Cohesion: 0.18
Nodes (11): reconcileNoticeConfirmations(), dependencyCompletionKey(), BrainFollowup, reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION, checkpointWindow() (+3 more)

### Community 91 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (10): ref_react_three_drei, ref_react_three_fiber, ref_three_stdlib, CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility (+2 more)

### Community 92 - "Engine"
Cohesion: 0.09
Nodes (5): correlatedBuild(), Engine, observe(), observeParked(), parkedReadError

### Community 93 - "ITFollowUps.tsx"
Cohesion: 0.67
Nodes (4): itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps()

### Community 94 - "projects.ts"
Cohesion: 0.22
Nodes (9): ref_smol_toml, intakeLocation(), LOCAL_BINDINGS, file, project, root, contextPacket(), PROJECTS (+1 more)

### Community 95 - "capture-session-clone.py"
Cohesion: 0.15
Nodes (10): ctypes, errno, importlib_util, json, os, pathlib, Copy a coherent macOS clone of inherited reader fd3 to anonymous target fd4. No…, Read-only protocol adapter for the installed review helper. No model dispatch. (+2 more)

### Community 96 - "createConstellation"
Cohesion: 0.19
Nodes (5): ConstellationRuntime, createConstellation(), enter(), finishTap(), move()

### Community 97 - "Outbox.tsx"
Cohesion: 0.12
Nodes (29): Conversation(), SendMessage, LessonDecisionAction, lessonDecisionState(), readLessonDecision(), Outbox(), ctoInputFailure(), OutboxCTOInput() (+21 more)

### Community 98 - "queueMergeNotice"
Cohesion: 0.26
Nodes (10): clamp(), LIMITS, MergedPR, plainSlackText(), section(), shippedSummary(), mergeText(), noticeState() (+2 more)

### Community 99 - "time-readback.ts"
Cohesion: 0.35
Nodes (7): timeLedger(), TimeLedger, dueReadback(), Readback, READBACK_INTERVAL_MS, readBackTime(), SETTLE_MS

### Community 100 - "merge-scanner-retry.ts"
Cohesion: 0.44
Nodes (8): officeMergeProvenance(), reconcileMergeScannerRetry(), Retry, retryMergeScanner(), retryReadBack(), runIdentity(), savedRetry(), transientScannerJobs()

### Community 101 - "shared.ts"
Cohesion: 0.06
Nodes (46): partialLocalCleanupKey(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), assignmentDiagnostics(), ITContext, diagnosticContext() (+38 more)

### Community 102 - "retire-history.ts"
Cohesion: 0.33
Nodes (7): readHistoryScope(), historicalRecordDigest(), Intent, records(), retireIncompleteHistory(), HistoryRetirement, HistoryRetirementIntent

### Community 103 - "source-amendment.ts"
Cohesion: 0.08
Nodes (58): stagePrompt(), StagePromptInput, METADATA_FINDING_GUIDANCE, adoptCandidate(), reported, Scope, Assessment, outsideScanSources() (+50 more)

### Community 104 - "install-service.mjs"
Cohesion: 0.33
Nodes (4): file, folder, logs, root

### Community 105 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (6): ref_mammoth, ref_pdfjs_dist, bounded(), extract(), fail(), [path,kind]

### Community 106 - "unblock-brief.ts"
Cohesion: 0.53
Nodes (5): clearUnblockBrief(), key(), saveUnblockBrief(), unblockBrief, src_shared_learningsubject

### Community 107 - "create-candidate.ts"
Cohesion: 0.48
Nodes (6): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf()

### Community 108 - "live-reach.ts"
Cohesion: 0.47
Nodes (5): GIT_NETWORK, LIVE_PROVIDERS, liveReach(), networkUrl(), remoteUrls()

### Community 110 - "highestStableAtLeast"
Cohesion: 0.83
Nodes (3): compare(), highestStableAtLeast(), parts()

### Community 112 - "qa-plan-retry.ts"
Cohesion: 0.67
Nodes (3): QAPlanRetry, QAPlanRetryProof, QAPlanRetryRequest

## Knowledge Gaps
- **503 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+498 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 642 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `implementation-recovery.ts`, `requests.ts`, `dependency-bots/adopt.ts`, `github-delivery.ts`, `TicketJob`, `session-bridge.ts`, `agents.ts`, `.transaction`, `api-routes.ts`, `features/workflow.ts`, `reader.ts`, `scheduled-captures.ts`, `run-retrospective.ts`, `record-trigger.ts`, `worker-runtime.ts`, `artifact`, `features.ts`, `cec.ts`, `tracking-issue.ts`, `knowledge.ts`, `maintenance/maintenance.ts`, `coordination.ts`, `activation-recovery.ts`, `Coordinator`, `GitHubDelivery`, `digest`, `sanitize`, `lesson-selection.ts`, `sanitizeObject`, `harnessEffect`, `cost-ledger.ts`, `continueUnsealedQA`, `run-accounting.ts`, `retrospective-subject.ts`, `time-scope.ts`, `office-state-view.ts`, `.save`, `scheduled-work.ts`, `ref_zod`, `.getEffect`, `engine.ts`, `assignments.ts`, `.emit`, `Ticket`, `Effects`, `ticket-stage-runner.ts`, `work.ts`, `weekly-rollup.ts`, `github-context.ts`, `candidate.ts`, `Role`, `record-push.ts`, `continue-ownership-read.ts`, `OfficeSnapshot`, `remove-candidate.ts`, `ref_node_crypto`, `admit-improvement.ts`, `intent.ts`, `workKey`, `reconcile-publication.ts`, `jira-time.ts`, `control-store.ts`, `scene-motion.ts`, `outbox.ts`, `ledger.ts`, `qualify.ts`, `goal-reviews.ts`, `cec-reads.ts`, `time-readback.ts`, `shared.ts`, `retire-history.ts`, `source-amendment.ts`, `create-candidate.ts`?**
  _High betweenness centrality (0.105) - this node is a cross-community bridge._
- **Why does `TicketJob` connect `TicketJob` to `implementation-recovery.ts`, `requests.ts`, `dependency-bots/adopt.ts`, `github-delivery.ts`, `Inspector.tsx`, `App.tsx`, `record-trigger.ts`, `artifact`, `coordination.ts`, `activation-recovery.ts`, `GitHubDelivery`, `digest`, `harnessEffect`, `retrospective-subject.ts`, `ticket-stage-runner.ts`, `work.ts`, `github-context.ts`, `Role`, `record-push.ts`, `remove-candidate.ts`, `fact-bounds.ts`, `workKey`, `qualify.ts`, `merge-scanner-retry.ts`, `shared.ts`, `source-amendment.ts`, `create-candidate.ts`, `ProjectProgress`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `Role` connect `Role` to `github-delivery.ts`, `Inspector.tsx`, `agents.ts`, `App.tsx`, `worker-runtime.ts`, `cec.ts`, `PeoplePanel.tsx`, `maintenance/maintenance.ts`, `GitHubDelivery`, `sanitize`, `run-accounting.ts`, `retrospective-subject.ts`, `OfficeScene.tsx`, `.emit`, `Ticket`, `work.ts`, `github-context.ts`, `OfficeSnapshot`, `Store`, `scene-motion.ts`, `outbox.ts`, `cec-reads.ts`, `projects.ts`, `Outbox.tsx`, `shared.ts`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _503 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `implementation-recovery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08020050125313283 - nodes in this community are weakly interconnected._
- **Should `requests.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06226203807390818 - nodes in this community are weakly interconnected._
- **Should `github-delivery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.055177928828468614 - nodes in this community are weakly interconnected._