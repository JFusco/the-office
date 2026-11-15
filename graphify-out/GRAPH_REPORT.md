# Graph Report - office-shared-handoff-nov15  (2026-11-15)

## Corpus Check
- 834 files · ~337,133 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4118 nodes · 19265 edges · 95 communities (93 shown, 2 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 629 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8ee99bd6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- currentAssignment
- ref_node_path
- dependency-bots/adopt.ts
- github-delivery.ts
- Inspector.tsx
- TicketJob
- session-bridge.ts
- ref_react
- agents.ts
- .transaction
- source-amendment-scope.ts
- config.ts
- App.tsx
- features/workflow.ts
- assignments.ts
- scheduled-captures.ts
- run-retrospective.ts
- record-trigger.ts
- worker-runtime.ts
- artifact
- publication.ts
- OfficeSnapshot
- PeoplePanel.tsx
- tracking-issue.ts
- knowledge.ts
- maintenance/maintenance.ts
- office-lessons.ts
- closeout-recovery.ts
- coordination.ts
- packed165-admission.ts
- digest
- index.tsx
- conversations/conversations.ts
- lesson-selection.ts
- CEC
- github/issue-publication.ts
- cost-ledger.ts
- run-accounting.ts
- office-qa-handoff.ts
- discovery-recovery.ts
- time-readback.ts
- time-scope.ts
- offices.ts
- .save
- scheduled-work.ts
- supersedingDelivery
- OfficeScene.tsx
- Effects
- pilot-delivery.ts
- demand-facts.ts
- .emit
- assignment-poll.ts
- merge-summary.ts
- cec/workflow.ts
- cost-totals.ts
- weekly-rollup.ts
- unblock-brief.ts
- TimeBook.tsx
- ref_node_crypto
- Store
- process.ts
- processGroupAlive
- DailyCTO.tsx
- harnessEffect
- ticket-evidence.ts
- highestStableAtLeast
- features.ts
- daily-cto.ts
- work.ts
- constellation-runtime.ts
- engine.ts
- it-specialist.ts
- WorkTime
- Offices
- admit-improvement.ts
- shared.ts
- cec/issue-publication.ts
- jira-time.ts
- store.ts
- blocker-followups.ts
- ledger.ts
- cto-input-resolution.ts
- node-visuals.ts
- scene-motion.ts
- jira-operations.ts
- capture-session-clone.py
- RoomCamera.tsx
- LessonsPanel.tsx
- createConstellation
- service-health.ts
- source-amendment.ts
- extract-worker.mjs
- create-candidate.ts
- CommittedBrain
- command-registry.ts

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
10. `Button` - 84 edges

## Surprising Connections (you probably didn't know these)
- `apply()` --indirect_call--> `note()`  [INFERRED]
  src/conversations/OutboxSavedImplementation.tsx → server/cec/parking/resume-parked.ts
- `projectOutbox()` --calls--> `isSavedPlanFollowup()`  [EXTRACTED]
  server/conversations/outbox.ts → src/conversations/saved-plan-followup.ts
- `projectOutbox()` --calls--> `parkedProviderWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts
- `projectOutbox()` --calls--> `readinessNeedsFollowup()`  [EXTRACTED]
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

## Communities (95 total, 2 thin omitted)

### Community 0 - "currentAssignment"
Cohesion: 0.06
Nodes (97): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+89 more)

### Community 1 - "ref_node_path"
Cohesion: 0.06
Nodes (68): ref_node_fs, ref_node_os, ref_node_path, ref_node_util, pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), GREEN156, candidateInput() (+60 more)

### Community 2 - "dependency-bots/adopt.ts"
Cohesion: 0.15
Nodes (28): Execute, readBackOrThrow(), adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR (+20 more)

### Community 3 - "github-delivery.ts"
Cohesion: 0.05
Nodes (113): containedFile(), findingsBlock(), assertDeliveryMayMutate(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery(), BOARD_RULE (+105 more)

### Community 4 - "Inspector.tsx"
Cohesion: 0.12
Nodes (51): ServiceHealthPanel(), GoalList(), card(), blank(), Goals(), resetDraft(), save(), reviewExcerpt() (+43 more)

### Community 5 - "TicketJob"
Cohesion: 0.09
Nodes (26): harnessCloseout(), PASSING, verifyMergeActions(), withHarnessWork(), runHarnessStage(), harnessStageResult(), receipt(), Check (+18 more)

### Community 6 - "session-bridge.ts"
Cohesion: 0.05
Nodes (58): ref_node_perf_hooks, ref_node_url, ref_ws, file, folder, logs, root, claudeSessionContext() (+50 more)

### Community 7 - "ref_react"
Cohesion: 0.06
Nodes (74): ref_react, ref_react_markdown, ref_remark_gfm, ref_yaml, KnowledgeActivity, KnowledgeActivityPage, KnowledgeEdge, KnowledgeMap (+66 more)

### Community 8 - "agents.ts"
Cohesion: 0.06
Nodes (52): implementationWorkerContext(), intakeMembership(), cecPrompt(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), resolvedDecisionNote() (+44 more)

### Community 9 - ".transaction"
Cohesion: 0.10
Nodes (32): featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS, reserveReplacement(), confirmBrief() (+24 more)

### Community 10 - "source-amendment-scope.ts"
Cohesion: 0.08
Nodes (34): approvedText(), assert(), assert(), normalize(), officialUrls, ReleaseCapture, verifyReleaseCaptures(), capture (+26 more)

### Community 11 - "config.ts"
Cohesion: 0.06
Nodes (58): ref_hono_node_server, ref_node_http, ref_vite, implementationPreview(), implementationContinuationRoute(), qaPlanRetryRoute(), settleRequestedSlackReplacement(), AUTO_ADOPT_BOTS (+50 more)

### Community 12 - "App.tsx"
Cohesion: 0.06
Nodes (49): ref_lucide_react, ref_motion, ref_react_dom, BrainDrawer(), themeColor, App(), BrainWorkspace, CONNECTION (+41 more)

### Community 13 - "features/workflow.ts"
Cohesion: 0.07
Nodes (62): approveFeature(), commandFeature(), featureById(), mutation(), reviewQuestions(), assertFeatureDependencyOrder(), featureDependencyEdges(), key() (+54 more)

### Community 14 - "assignments.ts"
Cohesion: 0.08
Nodes (33): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, GraphNode (+25 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.12
Nodes (53): createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest, captureRequests() (+45 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.12
Nodes (33): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, blockingTrigger, brainOverlap, brainOverlapQuery() (+25 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.07
Nodes (53): isBlocking(), deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, busyMaintenanceIds(), clip(), maintenanceBlockedId() (+45 more)

### Community 18 - "worker-runtime.ts"
Cohesion: 0.06
Nodes (45): ref_zod, itChatPrompt(), candidateWorkspaceEnvironment(), assignmentDiagnostics(), diagnosticContext(), assignmentSubject(), dispatchExposure(), prepareExposure() (+37 more)

### Community 19 - "artifact"
Cohesion: 0.07
Nodes (72): partialLocalCleanupCandidate(), continuationNativeReview(), assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), reconcileCompletedConflictDraft() (+64 more)

### Community 20 - "publication.ts"
Cohesion: 0.27
Nodes (6): FeaturePublisher, publishFeature(), reconcilePublication(), uncertainPublications(), reserveIdentity(), EffectUncertainError

### Community 21 - "OfficeSnapshot"
Cohesion: 0.07
Nodes (56): compactSteps(), Conversation(), send(), SendMessage, Outbox(), ctoInputFailure(), OutboxCTOInput(), recover() (+48 more)

### Community 22 - "PeoplePanel.tsx"
Cohesion: 0.10
Nodes (38): label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+30 more)

### Community 23 - "tracking-issue.ts"
Cohesion: 0.19
Nodes (13): ensureTrackingIssue(), findTrackingIssue(), ownTracking(), TrackingIssue, trackingIssueBody(), trackingIssueTitle(), trackingMarker(), centralCompanionHandoff() (+5 more)

### Community 24 - "knowledge.ts"
Cohesion: 0.07
Nodes (32): ref_node_stream, ref_node_timers, args, [cmd,...rawArgs], commands, key, projectIndex, curateLesson() (+24 more)

### Community 25 - "maintenance/maintenance.ts"
Cohesion: 0.06
Nodes (48): maintenancePolicies(), completeNativeCheckpoint(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, BrainStatusSchema, identity, coverageSchema (+40 more)

### Community 26 - "office-lessons.ts"
Cohesion: 0.22
Nodes (11): normalizeStatement(), decideOfficeProposal(), now(), OfficeKnowledgeStore, proposeOfficeLessons(), retireOfficeLesson(), Input, promoteNoteLesson() (+3 more)

### Community 27 - "closeout-recovery.ts"
Cohesion: 0.12
Nodes (39): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+31 more)

### Community 28 - "coordination.ts"
Cohesion: 0.04
Nodes (54): MergeNotifications, Admission, admit(), IntakeContext, WAIT_STATUSES, compatible(), dependencyCompletionKey(), dependencyEligibility() (+46 more)

### Community 29 - "packed165-admission.ts"
Cohesion: 0.07
Nodes (60): deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, requireDeliveryAuthority(), deliveryIntakeBlocker(), gateRegisteredDelivery(), accounting (+52 more)

### Community 30 - "digest"
Cohesion: 0.11
Nodes (50): activeEffectId(), retryRead(), admitPRMetadata(), assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema, savedMetadataAssessment() (+42 more)

### Community 31 - "index.tsx"
Cohesion: 0.10
Nodes (47): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView() (+39 more)

### Community 32 - "conversations/conversations.ts"
Cohesion: 0.07
Nodes (33): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+25 more)

### Community 33 - "lesson-selection.ts"
Cohesion: 0.09
Nodes (29): lessonIssueBody(), lessonIssueMarker(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, LessonSelection, lessonText() (+21 more)

### Community 34 - "CEC"
Cohesion: 0.16
Nodes (21): az(), base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs(), fullActivePRs() (+13 more)

### Community 35 - "github/issue-publication.ts"
Cohesion: 0.18
Nodes (27): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), ProjectCard, projectCards(), projectGraphql() (+19 more)

### Community 36 - "cost-ledger.ts"
Cohesion: 0.17
Nodes (25): captureCost(), server_telemetry_cost_entries_costcoveragesummary, costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId() (+17 more)

### Community 37 - "run-accounting.ts"
Cohesion: 0.05
Nodes (70): BoundedRead, done(), readBoundedNoFollow(), readOwnedSessionArtifact(), reasonOf(), backfillClaudeCost(), CompletionReader, add() (+62 more)

### Community 38 - "office-qa-handoff.ts"
Cohesion: 0.25
Nodes (7): OfficeQAHandoff, OfficeQAHandoffInput, OfficeQAHandoffRequest, QAOwnershipProof, SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 39 - "discovery-recovery.ts"
Cohesion: 0.26
Nodes (11): Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership, rawHash() (+3 more)

### Community 40 - "time-readback.ts"
Cohesion: 0.31
Nodes (5): TimeLedger, Readback, READBACK_INTERVAL_MS, readBackTime(), SETTLE_MS

### Community 41 - "time-scope.ts"
Cohesion: 0.16
Nodes (25): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), midnight(), TicketDay (+17 more)

### Community 42 - "offices.ts"
Cohesion: 0.13
Nodes (16): ref_smol_toml, leadershipContext(), queueLessonIssueCheck(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), queueImprovements(), seedOfficeLessons() (+8 more)

### Community 43 - ".save"
Cohesion: 0.19
Nodes (29): jiraCollection(), BLOCKED, findComment(), LiveIssue, readIssue(), readIssues(), Execute, jira() (+21 more)

### Community 44 - "scheduled-work.ts"
Cohesion: 0.11
Nodes (30): freshOwnershipRead(), deliverySlot(), ROLES, closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), metadataRequestResolved(), preparationRequestResolved(), withAmendmentOwnership() (+22 more)

### Community 45 - "supersedingDelivery"
Cohesion: 0.23
Nodes (14): projectSlackDeliveries(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint(), slackRequestSettled(), supersedingDelivery(), investigationCandidates() (+6 more)

### Community 46 - "OfficeScene.tsx"
Cohesion: 0.16
Nodes (34): Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk(), ElevatorStage() (+26 more)

### Community 47 - "Effects"
Cohesion: 0.21
Nodes (8): GitHubOperations, fileLessonIssue(), sendGoalNotice(), Assessment, closeNativeRefresh(), fingerprint(), sendMaintenanceNotice(), Effects

### Community 48 - "pilot-delivery.ts"
Cohesion: 0.16
Nodes (26): continueImplementation(), dispatchNightly(), drainDelivery(), requestDelivery(), resume(), startPilot(), OfficeQAHandoffInput, Attempt (+18 more)

### Community 49 - "demand-facts.ts"
Cohesion: 0.13
Nodes (22): clip(), DEMAND_LIMIT, demandFacts(), DemandSection, key(), LessonKey, notes(), clip() (+14 more)

### Community 50 - ".emit"
Cohesion: 0.07
Nodes (42): assertOwnership(), decideImplementation(), consumeQAPlanRetry(), Decision, requestQAPlanRetry(), channelNoticeAuthorized(), ChannelSettings, configureChannelNotices() (+34 more)

### Community 51 - "assignment-poll.ts"
Cohesion: 0.30
Nodes (10): noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), syncOutbox(), admitReadyCards(), due(), unparkReleasedWaits(), resumeParked() (+2 more)

### Community 52 - "merge-summary.ts"
Cohesion: 0.36
Nodes (7): clamp(), LIMITS, MergedPR, plainSlackText(), section(), shippedSummary(), mergeText()

### Community 53 - "cec/workflow.ts"
Cohesion: 0.06
Nodes (65): applyIntakeObservation(), parksInJira(), qaPlanEvidenceGap(), MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), recoverSavedPlan(), run() (+57 more)

### Community 54 - "cost-totals.ts"
Cohesion: 0.32
Nodes (7): server_telemetry_billable_work_issue_key, awaitingEvidence(), boardUsd(), CaptureContext, inCostWindow(), TicketCost, ticketCosts()

### Community 55 - "weekly-rollup.ts"
Cohesion: 0.10
Nodes (31): learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), retire(), BRAIN_SCOPE, SUBJECT (+23 more)

### Community 56 - "unblock-brief.ts"
Cohesion: 0.53
Nodes (5): clearUnblockBrief(), key(), saveUnblockBrief(), unblockBrief, src_shared_learningsubject

### Community 57 - "TimeBook.tsx"
Cohesion: 0.11
Nodes (37): TelemetryReport, AzureBuild, src_shared_liveanchor, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens() (+29 more)

### Community 58 - "ref_node_crypto"
Cohesion: 0.14
Nodes (24): ref_node_crypto, GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles() (+16 more)

### Community 59 - "Store"
Cohesion: 0.09
Nodes (23): officeCapacity, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch(), deliveryOccupied() (+15 more)

### Community 60 - "process.ts"
Cohesion: 0.08
Nodes (27): ref_node_child_process, Read, Event, one(), prePushRejection(), PushIdentity, Candidate, settledPushBoundary() (+19 more)

### Community 61 - "processGroupAlive"
Cohesion: 0.07
Nodes (42): OwnershipRead, interruptedImplementation(), Document, isAccessOnlyPlan(), settledAccessOnlyState(), closedReadonlyPlan(), Document, continueAccessOnlyPlan() (+34 more)

### Community 62 - "DailyCTO.tsx"
Cohesion: 0.26
Nodes (10): CTOReview(), goalState, DailyCTO(), GoalHistory(), load(), reportDate(), reviewStatus, InlineText() (+2 more)

### Community 63 - "harnessEffect"
Cohesion: 0.14
Nodes (21): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot() (+13 more)

### Community 64 - "ticket-evidence.ts"
Cohesion: 0.11
Nodes (31): ref_node_string_decoder, assetDownloader(), attachmentKind(), evidenceDirectory(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS (+23 more)

### Community 65 - "highestStableAtLeast"
Cohesion: 0.83
Nodes (3): compare(), highestStableAtLeast(), parts()

### Community 66 - "features.ts"
Cohesion: 0.09
Nodes (40): FeatureApproval, FeatureAttempt, FeatureAuthority, FeatureBaseline, FeatureDocument, FeatureHandoff, FeatureHarnessOption, FeatureOption (+32 more)

### Community 67 - "daily-cto.ts"
Cohesion: 0.05
Nodes (54): githubPRDescription(), collectCTOFacts(), DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), dailyReviewDate(), reviewWeekday() (+46 more)

### Community 69 - "work.ts"
Cohesion: 0.09
Nodes (25): BLOCKED_CAUSES, blockedCauses(), projectReadiness(), explanation(), LABELS, stoppedReason(), ProjectReadiness, HistoryRetirement (+17 more)

### Community 70 - "constellation-runtime.ts"
Cohesion: 0.15
Nodes (17): ref_3d_force_graph, ref_three, CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point (+9 more)

### Community 71 - "engine.ts"
Cohesion: 0.06
Nodes (19): AzureMonitor, correlatedBuild(), checkMail(), drainMail(), requestMail(), enableNightly(), ingest(), GitHubMonitor (+11 more)

### Community 72 - "it-specialist.ts"
Cohesion: 0.20
Nodes (14): partialLocalCleanupKey(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), ITContext, publishITReport(), nativeDeliveryResolved() (+6 more)

### Community 73 - "WorkTime"
Cohesion: 0.16
Nodes (20): ConfirmedSegment, LiveAnchor, ObservationGap, SnapshotOrdering, TimeLedgerState, TimePublication, WorkTime, Acc (+12 more)

### Community 75 - "admit-improvement.ts"
Cohesion: 0.13
Nodes (26): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementIntakeGate(), improvementManifest() (+18 more)

### Community 76 - "shared.ts"
Cohesion: 0.05
Nodes (54): PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, GoalProgress, PackedPublicationRepair, OfficeQAReport (+46 more)

### Community 78 - "cec/issue-publication.ts"
Cohesion: 0.09
Nodes (21): IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), projectListScope(), Assignment, Content, JiraIssuePublisher (+13 more)

### Community 79 - "jira-time.ts"
Cohesion: 0.22
Nodes (13): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+5 more)

### Community 80 - "store.ts"
Cohesion: 0.12
Nodes (22): ref_node_sqlite, Clock, EASTERN, easternDayFormatter, easternPartsFormatter, systemClock, DATA, applyConnectionSettings() (+14 more)

### Community 84 - "blocker-followups.ts"
Cohesion: 0.40
Nodes (9): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), readBackConversations(), handoff(), reconcileBlockerFollowups(), BlockerFollowup (+1 more)

### Community 85 - "ledger.ts"
Cohesion: 0.12
Nodes (26): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationEvidence(), INVOCATION_SOURCE_REFS, NOTIFY_HELPER, notifyHelperResolution(), OFFICE_FIX_PROMPT, OfficeFixResult (+18 more)

### Community 86 - "cto-input-resolution.ts"
Cohesion: 0.60
Nodes (3): ctoInputIdentityMatches(), ctoInputRecovered(), ctoReplacementResolution()

### Community 87 - "node-visuals.ts"
Cohesion: 0.20
Nodes (13): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+5 more)

### Community 91 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 92 - "jira-operations.ts"
Cohesion: 0.24
Nodes (9): CommentPage, commentReadback(), JiraOperations, plain(), jiraRecord(), unpack(), metadataDigest(), verifiedTransition() (+1 more)

### Community 95 - "capture-session-clone.py"
Cohesion: 0.15
Nodes (10): ctypes, errno, importlib_util, json, os, pathlib, Copy a coherent macOS clone of inherited reader fd3 to anonymous target fd4. No…, Read-only protocol adapter for the installed review helper. No model dispatch. (+2 more)

### Community 96 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (10): ref_react_three_drei, ref_react_three_fiber, ref_three_stdlib, CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility (+2 more)

### Community 97 - "LessonsPanel.tsx"
Cohesion: 0.18
Nodes (23): LessonDecisionAction, lessonDecisionState(), readLessonDecision(), OutboxLessonDecision(), act(), readStatus(), SlackDeliveryCard(), labels (+15 more)

### Community 98 - "createConstellation"
Cohesion: 0.19
Nodes (5): ConstellationRuntime, createConstellation(), enter(), finishTap(), move()

### Community 101 - "service-health.ts"
Cohesion: 0.20
Nodes (8): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, ServiceHealth

### Community 103 - "source-amendment.ts"
Cohesion: 0.08
Nodes (55): ref_node_async_hooks, DISCOVERY_GUIDANCE, stagePrompt(), StagePromptInput, METADATA_FINDING_GUIDANCE, adoptCandidate(), reported, Scope (+47 more)

### Community 105 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (6): ref_mammoth, ref_pdfjs_dist, bounded(), extract(), fail(), [path,kind]

### Community 107 - "create-candidate.ts"
Cohesion: 0.18
Nodes (11): ProjectProgress, candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute (+3 more)

### Community 111 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

## Knowledge Gaps
- **498 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+493 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 636 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `currentAssignment`, `ref_node_path`, `dependency-bots/adopt.ts`, `github-delivery.ts`, `TicketJob`, `session-bridge.ts`, `agents.ts`, `.transaction`, `config.ts`, `features/workflow.ts`, `assignments.ts`, `scheduled-captures.ts`, `run-retrospective.ts`, `record-trigger.ts`, `worker-runtime.ts`, `artifact`, `publication.ts`, `OfficeSnapshot`, `tracking-issue.ts`, `maintenance/maintenance.ts`, `office-lessons.ts`, `closeout-recovery.ts`, `coordination.ts`, `packed165-admission.ts`, `digest`, `conversations/conversations.ts`, `lesson-selection.ts`, `CEC`, `github/issue-publication.ts`, `cost-ledger.ts`, `run-accounting.ts`, `discovery-recovery.ts`, `time-readback.ts`, `time-scope.ts`, `offices.ts`, `.save`, `scheduled-work.ts`, `supersedingDelivery`, `Effects`, `pilot-delivery.ts`, `demand-facts.ts`, `.emit`, `cec/workflow.ts`, `weekly-rollup.ts`, `ref_node_crypto`, `process.ts`, `processGroupAlive`, `harnessEffect`, `ticket-evidence.ts`, `daily-cto.ts`, `engine.ts`, `it-specialist.ts`, `Offices`, `admit-improvement.ts`, `cec/issue-publication.ts`, `jira-time.ts`, `store.ts`, `blocker-followups.ts`, `ledger.ts`, `jira-operations.ts`, `source-amendment.ts`, `create-candidate.ts`?**
  _High betweenness centrality (0.104) - this node is a cross-community bridge._
- **Why does `GitHubDelivery` connect `TicketJob` to `currentAssignment`, `ref_node_path`, `github-delivery.ts`, `github/issue-publication.ts`, `source-amendment.ts`, `discovery-recovery.ts`, `process.ts`, `pilot-delivery.ts`, `assignment-poll.ts`, `artifact`, `cec/workflow.ts`, `closeout-recovery.ts`, `coordination.ts`, `packed165-admission.ts`, `digest`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Why does `Role` connect `worker-runtime.ts` to `github-delivery.ts`, `Inspector.tsx`, `TicketJob`, `agents.ts`, `config.ts`, `App.tsx`, `record-trigger.ts`, `OfficeSnapshot`, `PeoplePanel.tsx`, `maintenance/maintenance.ts`, `packed165-admission.ts`, `conversations/conversations.ts`, `run-accounting.ts`, `scheduled-work.ts`, `OfficeScene.tsx`, `.emit`, `Store`, `work.ts`, `shared.ts`, `store.ts`, `scene-motion.ts`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _498 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `currentAssignment` be split into smaller, more focused modules?**
  _Cohesion score 0.060698247138925104 - nodes in this community are weakly interconnected._
- **Should `ref_node_path` be split into smaller, more focused modules?**
  _Cohesion score 0.05898989898989899 - nodes in this community are weakly interconnected._
- **Should `github-delivery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05071043606075453 - nodes in this community are weakly interconnected._