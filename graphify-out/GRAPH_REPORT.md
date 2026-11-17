# Graph Report - the-office  (2026-11-16)

## Corpus Check
- 846 files · ~335,315 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4120 nodes · 18937 edges · 107 communities (105 shown, 2 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 608 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `09ea3f5a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- index.tsx
- Role
- dependency-bots/adopt.ts
- config.ts
- Inspector.tsx
- requests.ts
- session-bridge.ts
- Button
- implementation-recovery.ts
- Store
- worker-runtime.ts
- github-delivery.ts
- App.tsx
- features/workflow.ts
- reader.ts
- scheduled-captures.ts
- run-retrospective.ts
- record-trigger.ts
- .emit
- workKey
- cec-reads.ts
- github-context.ts
- FeatureWorkspace.tsx
- coordination-pump.ts
- knowledge.ts
- maintenance/maintenance.ts
- cost-ledger.ts
- activation-recovery.ts
- jira-operations.ts
- jira-time.ts
- digest
- Ticket
- sanitize
- Goals.tsx
- azure.ts
- accept-stage-result.ts
- scheduled-work.ts
- scheduler.ts
- artifact
- knowledge-views.ts
- assignment-poll.ts
- time-scope.ts
- node-visuals.ts
- run-accounting.ts
- currentAssignment
- executeRequest
- OfficeScene.tsx
- github.ts
- dependencies.ts
- assignments.ts
- outbox.ts
- scene-motion.ts
- metadata-context.ts
- assignment.ts
- work.ts
- weekly-rollup.ts
- shared.ts
- ServiceHealthPanel.tsx
- retrospective-subject.ts
- store.ts
- offices.ts
- ledger.ts
- ref_zod
- verifyRepairCandidate
- ticket-evidence.ts
- harness-baseline.ts
- agents.ts
- Agents
- .activeClaims
- read-retries.ts
- constellation-runtime.ts
- process.ts
- learning-events.ts
- report.ts
- it-specialist.ts
- admit-improvement.ts
- useOfficePreferences.ts
- daily-cto.ts
- cec/issue-publication.ts
- superseded-receipts.ts
- prompts/conversations.ts
- lesson-selection.ts
- ref_node_path
- Effects
- OfficeSnapshot
- coordination.ts
- restart-writer.ts
- index.ts
- time-readback.ts
- merge-scanner-retry.ts
- StageResult
- OfficeConfigView.tsx
- delivery-ownership.ts
- install-service.mjs
- features.ts
- capture-session-clone.py
- preferences-store.ts
- Outbox.tsx
- .save
- HOLDS
- packed-consumer-pnpm.ts
- model-routes.ts
- extract-worker.mjs
- blocker-followups.ts
- unblock-brief.ts
- pilot-delivery.ts
- CommandRegistry

## God Nodes (most connected - your core abstractions)
1. `Store` - 370 edges
2. `TicketJob` - 172 edges
3. `digest()` - 150 edges
4. `command()` - 117 edges
5. `GitHubDelivery` - 116 edges
6. `artifact()` - 114 edges
7. `workKey()` - 96 edges
8. `OfficeSnapshot` - 88 edges
9. `cx()` - 88 edges
10. `currentAssignment()` - 88 edges

## Surprising Connections (you probably didn't know these)
- `DeliveryAuthorityInput` --references--> `HarnessRequest`  [EXTRACTED]
  server/delivery/harness/delivery-authority.ts → src/contracts/work.ts
- `apply()` --indirect_call--> `note()`  [INFERRED]
  src/conversations/OutboxSavedImplementation.tsx → server/cec/parking/resume-parked.ts
- `DeliverySlot` --references--> `Role`  [EXTRACTED]
  server/office/projects.ts → src/shared.ts
- `officeCapacity` --references--> `Role`  [EXTRACTED]
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
- 4-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 4-file cycle: `server/delivery/recovery/stopped-base-review.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/stopped-base-review.ts`
- 4-file cycle: `server/delivery/recovery/implementation/activation-recovery.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/implementation/activation-recovery.ts`
- 4-file cycle: `server/delivery/recovery/implementation/saved-prerequisite-handoff.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/implementation/saved-prerequisite-handoff.ts`
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

## Communities (107 total, 2 thin omitted)

### Community 0 - "index.tsx"
Cohesion: 0.12
Nodes (39): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS, PickupForm(), ProjectForms() (+31 more)

### Community 1 - "Role"
Cohesion: 0.11
Nodes (40): DeliverySlot, Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona (+32 more)

### Community 2 - "dependency-bots/adopt.ts"
Cohesion: 0.08
Nodes (71): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard, projectCards() (+63 more)

### Community 3 - "config.ts"
Cohesion: 0.11
Nodes (35): ref_node_url, featureItemComplete(), reconcileFeatureCompletion(), discoveryPrompt(), planPrompt(), readEvidence(), helperTelemetry(), DELAYS (+27 more)

### Community 4 - "Inspector.tsx"
Cohesion: 0.12
Nodes (59): itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps(), followUp(), labels, ServiceHealthRow(), BlockerFollowups() (+51 more)

### Community 5 - "requests.ts"
Cohesion: 0.09
Nodes (44): pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), assertStoppedBaseAudit(), AuditRow, CoverageRow, Hash, Kind, server_delivery_recovery_stopped_base_audit_native (+36 more)

### Community 6 - "session-bridge.ts"
Cohesion: 0.06
Nodes (53): ref_node_perf_hooks, ref_ws, claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexDaemonProcesses(), accountCodexProcesses() (+45 more)

### Community 7 - "Button"
Cohesion: 0.10
Nodes (42): ref_react, ref_react_markdown, ref_remark_gfm, ref_yaml, TicketPlanningAction(), Activity(), ActivityTimeline(), AssignmentKnowledge() (+34 more)

### Community 8 - "implementation-recovery.ts"
Cohesion: 0.14
Nodes (24): continuationScope(), brainImplementationCandidate(), BrainReadback, digest(), implementationRecoveryCandidate(), Ownership, Readback, recoverBrainImplementation() (+16 more)

### Community 9 - "Store"
Cohesion: 0.06
Nodes (12): AzureMonitor, correlatedBuild(), Result, Assessment, Engine, observe(), observeParked(), parkedReadError (+4 more)

### Community 10 - "worker-runtime.ts"
Cohesion: 0.09
Nodes (26): SlackResultSchema, SlackVerificationSchema, candidateWorkspaceEnvironment(), server_delivery_harness_delivery_authority_resolvedeliverywork, ApproachSchema, assignmentSubject(), assertBriefingScope(), LOCAL_BINDINGS (+18 more)

### Community 11 - "github-delivery.ts"
Cohesion: 0.07
Nodes (35): writerRestartInstruction(), restartStoppedWriters(), unchangedSinceAccepted(), Execute, SalvageRetry, salvageWorktree(), ProjectProgress, BOARD_RULE (+27 more)

### Community 12 - "App.tsx"
Cohesion: 0.06
Nodes (52): ref_lucide_react, ref_react_dom, BrainDrawer(), themeColor, App(), BrainWorkspace, CONNECTION, CONNECTION_DOT (+44 more)

### Community 13 - "features/workflow.ts"
Cohesion: 0.07
Nodes (56): approveFeature(), featureById(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), artifactPath(), digest() (+48 more)

### Community 14 - "reader.ts"
Cohesion: 0.09
Nodes (30): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, CommittedBrain (+22 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.15
Nodes (46): requestDelivery(), createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest (+38 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.09
Nodes (42): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, blockingTrigger, isBlocking(), brainOverlap (+34 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.13
Nodes (31): LEARNING_BASELINES, maintainLearning(), clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates(), maintenanceCompletedId(), maintenanceKey() (+23 more)

### Community 18 - ".emit"
Cohesion: 0.11
Nodes (29): requestQAPlanRetry(), configureChannelNotices(), assertConversationReadback(), configureNotices(), retryRecipientLookup(), finishSupersededReadback(), pump(), savePickup() (+21 more)

### Community 19 - "workKey"
Cohesion: 0.12
Nodes (36): assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), reconcileCompletedConflictDraft(), within(), bindPreparationBoardOrigins() (+28 more)

### Community 20 - "cec-reads.ts"
Cohesion: 0.13
Nodes (21): IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), intakeMembership(), projectListScope(), cecIntakePrompt(), cecReadbackPrompt() (+13 more)

### Community 21 - "github-context.ts"
Cohesion: 0.11
Nodes (40): resumeProviderReviews(), reviewInstructions(), deliveryTask(), DeliveryTaskInput, observe(), DISCOVERY_GUIDANCE, checksFailed(), checksPassed() (+32 more)

### Community 22 - "FeatureWorkspace.tsx"
Cohesion: 0.11
Nodes (27): FeatureQuestionProjection, OutboxQuestionRound(), send(), FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases (+19 more)

### Community 23 - "coordination-pump.ts"
Cohesion: 0.17
Nodes (17): MergeNotifications, reconcileNoticeConfirmations(), admit(), dependencyCompletionKey(), dependencyEligibility(), issueKey(), observePrerequisites(), validatePrerequisites() (+9 more)

### Community 24 - "knowledge.ts"
Cohesion: 0.06
Nodes (43): normalizeStatement(), curateLesson(), Curation, CurationAction, mergeEvidence(), decideOfficeProposal(), now(), OfficeKnowledgeStore (+35 more)

### Community 25 - "maintenance/maintenance.ts"
Cohesion: 0.09
Nodes (27): maintenancePolicies(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice(), candidateOwner(), SETTLED (+19 more)

### Community 26 - "cost-ledger.ts"
Cohesion: 0.14
Nodes (29): captureCost(), server_telemetry_cost_entries_costcoveragesummary, costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress() (+21 more)

### Community 27 - "activation-recovery.ts"
Cohesion: 0.07
Nodes (77): recordedPush(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal (+69 more)

### Community 28 - "jira-operations.ts"
Cohesion: 0.24
Nodes (9): CommentPage, commentReadback(), JiraOperations, plain(), jiraRecord(), unpack(), metadataDigest(), verifiedTransition() (+1 more)

### Community 29 - "jira-time.ts"
Cohesion: 0.15
Nodes (19): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+11 more)

### Community 30 - "digest"
Cohesion: 0.26
Nodes (25): assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema, savedMetadataAssessment(), validateSaved(), metadataClaim(), assertMetadataBinding() (+17 more)

### Community 31 - "Ticket"
Cohesion: 0.15
Nodes (19): implementationWorkerContext(), cecPrompt(), resolvedDecisionNote(), stageInstructions, reviewedPlanGuidance, reviewedPlanGuideDigest, assertContinuableWorktree(), CONTINUABLE (+11 more)

### Community 32 - "sanitize"
Cohesion: 0.10
Nodes (24): ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff(), saveGoals() (+16 more)

### Community 33 - "Goals.tsx"
Cohesion: 0.14
Nodes (19): SendMessage, CTOReview(), goalState, DailyCTO(), GoalHistory(), load(), reportDate(), reviewStatus (+11 more)

### Community 34 - "azure.ts"
Cohesion: 0.14
Nodes (25): az(), base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs(), fullActivePRs() (+17 more)

### Community 35 - "accept-stage-result.ts"
Cohesion: 0.09
Nodes (60): containedFile(), findingsBlock(), namedRepairIds(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery(), needsDecision() (+52 more)

### Community 36 - "scheduled-work.ts"
Cohesion: 0.10
Nodes (34): freshOwnershipRead(), deliverySlot(), withAmendmentOwnership(), metadataRequestResolved(), preparationRequestResolved(), gateFeatureWork(), requestPriority(), closedTicketReport() (+26 more)

### Community 37 - "scheduler.ts"
Cohesion: 0.14
Nodes (16): officeCapacity, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch(), deliveryOccupied() (+8 more)

### Community 38 - "artifact"
Cohesion: 0.07
Nodes (75): assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint(), closeoutProviderEvidence() (+67 more)

### Community 39 - "knowledge-views.ts"
Cohesion: 0.16
Nodes (19): ref_motion, KnowledgeActivity, KnowledgeActivityPage, KnowledgeEdge, KnowledgeMap, KnowledgeNode, connectionSummary(), ConstellationView (+11 more)

### Community 40 - "assignment-poll.ts"
Cohesion: 0.08
Nodes (34): noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack() (+26 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.13
Nodes (30): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), server_telemetry_billable_work_issue_key, isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence() (+22 more)

### Community 42 - "node-visuals.ts"
Cohesion: 0.20
Nodes (13): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+5 more)

### Community 43 - "run-accounting.ts"
Cohesion: 0.05
Nodes (71): BoundedRead, done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf(), comparable(), EvidenceOutcome (+63 more)

### Community 44 - "currentAssignment"
Cohesion: 0.11
Nodes (29): GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles(), ContinuationIO (+21 more)

### Community 45 - "executeRequest"
Cohesion: 0.07
Nodes (3): coordination(), Coordinator, executeRequest()

### Community 46 - "OfficeScene.tsx"
Cohesion: 0.11
Nodes (43): ref_react_three_drei, ref_react_three_fiber, ref_three, withoutElapsed(), CameraBookmark, restoreBookmark(), Avatar(), AzureWall() (+35 more)

### Community 47 - "github.ts"
Cohesion: 0.26
Nodes (6): GitHubMonitor, githubPRDescription(), GOAL_EVIDENCE_LIMITS, GitHubBoard, GitHubPR, GitHubState

### Community 48 - "dependencies.ts"
Cohesion: 0.14
Nodes (15): Admission, IntakeContext, WAIT_STATUSES, compatible(), DependencyStores, PrerequisiteSchema, Continuation, DependencyObservation (+7 more)

### Community 49 - "assignments.ts"
Cohesion: 0.10
Nodes (26): clip(), DEMAND_LIMIT, demandFacts(), DemandSection, key(), LessonKey, notes(), assignmentLookups (+18 more)

### Community 50 - "outbox.ts"
Cohesion: 0.08
Nodes (34): ctoInputIdentityMatches(), ctoInputRecovered(), ADOPTION_STALLED_MS, conversationResolved(), projectOutbox(), syncOutbox(), slackRequestSettled(), interruptAdoptions() (+26 more)

### Community 51 - "scene-motion.ts"
Cohesion: 0.29
Nodes (15): Handoff(), avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay() (+7 more)

### Community 52 - "metadata-context.ts"
Cohesion: 0.07
Nodes (50): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+42 more)

### Community 53 - "assignment.ts"
Cohesion: 0.21
Nodes (15): stagePrompt(), StagePromptInput, METADATA_FINDING_GUIDANCE, conflictApprovalGuidance(), safeWebUrl(), officePreviewGuidance, officeQADirectory(), officeQAGuidance() (+7 more)

### Community 54 - "work.ts"
Cohesion: 0.14
Nodes (18): BLOCKED_CAUSES, blockedCauses(), projectReadiness(), ProjectReadiness, AssignmentResult, BlockedCause, CompletionCondition, DeliveryAdmission (+10 more)

### Community 55 - "weekly-rollup.ts"
Cohesion: 0.14
Nodes (27): expireLearningPackets(), packetReferences(), learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck() (+19 more)

### Community 56 - "shared.ts"
Cohesion: 0.07
Nodes (27): completedPRReviews(), ContinuationDecision, eligible(), mergedByOwner(), ownerSettles(), retireExternalDeliveries(), settledExternalRepair(), persistReaderAnalysis() (+19 more)

### Community 57 - "ServiceHealthPanel.tsx"
Cohesion: 0.10
Nodes (36): TelemetryReport, TelemetryRow, LiveAnchor, blockedSummary(), itAgent(), itDiagnostics(), ServiceHealthPanel(), LessonsView() (+28 more)

### Community 58 - "retrospective-subject.ts"
Cohesion: 0.18
Nodes (15): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+7 more)

### Community 59 - "store.ts"
Cohesion: 0.13
Nodes (20): ref_node_sqlite, Clock, EASTERN, easternDayFormatter, easternPartsFormatter, systemClock, DATA, applyConnectionSettings() (+12 more)

### Community 60 - "offices.ts"
Cohesion: 0.09
Nodes (15): ref_smol_toml, QuestionNotifications, improvementEligible(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), queueImprovements(), DELIVERY_CONCURRENCY (+7 more)

### Community 61 - "ledger.ts"
Cohesion: 0.08
Nodes (38): server_it_investigations_accepted_completion_resolution, server_it_investigations_accepted_completion_resolution_acceptedcompletionresolution, INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationCandidates(), investigationId(), investigationEvidence(), finishedSubjectResolution() (+30 more)

### Community 62 - "ref_zod"
Cohesion: 0.10
Nodes (24): ref_zod, channelNoticeAuthorized(), ChannelSettings, notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR (+16 more)

### Community 63 - "verifyRepairCandidate"
Cohesion: 0.15
Nodes (24): removeAdoptedClone(), stoppedBaseCheckout(), assertStoppedBaseApproach(), stoppedBaseNextStage(), adoptedReviewCandidate(), ciCheckout(), finishCISetup(), verifyCIHooks() (+16 more)

### Community 64 - "ticket-evidence.ts"
Cohesion: 0.11
Nodes (30): ref_node_string_decoder, assetDownloader(), attachmentKind(), evidenceDirectory(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS (+22 more)

### Community 65 - "harness-baseline.ts"
Cohesion: 0.15
Nodes (20): baselineReport, BaselineSource, baselineText(), millions(), row(), share(), add(), BaselineState (+12 more)

### Community 66 - "agents.ts"
Cohesion: 0.09
Nodes (26): savedStageCompletion(), HANDS_OFF_RESOLUTION_GUIDANCE, RESOLUTION_GUIDANCE, knowledgeChatPrompt(), CurrentOfficeQAReportSchema, LegacyOfficeQAReportSchema, OfficeQAReportSchema, text (+18 more)

### Community 67 - "Agents"
Cohesion: 0.22
Nodes (6): cecChatPrompt(), canFileGithubIssue(), githubFollowupPrompt(), bindGitHubQA(), Agents, WorkerRuntime

### Community 68 - ".activeClaims"
Cohesion: 0.22
Nodes (14): OwnershipRead, continueOwnershipRead(), expiredOwnershipRead(), handoffOwnership(), ReadbackOwnerDecision, ownershipReadGate(), ownershipReadState(), ownershipReadHistory() (+6 more)

### Community 69 - "read-retries.ts"
Cohesion: 0.23
Nodes (12): PrerequisitesSchema, classifyStop(), stopReason(), incompleteReadOutput(), IntakeResult, planReadRetry(), reconcileReadRetries(), temporaryReadFailure() (+4 more)

### Community 70 - "constellation-runtime.ts"
Cohesion: 0.09
Nodes (22): ref_3d_force_graph, ref_three_stdlib, CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point (+14 more)

### Community 71 - "process.ts"
Cohesion: 0.12
Nodes (23): ref_node_child_process, Event, one(), prePushRejection(), PushIdentity, settledPushBoundary(), inactivityWatch(), At (+15 more)

### Community 72 - "learning-events.ts"
Cohesion: 0.31
Nodes (9): captureLearning(), recordLearningOpportunity(), captureMaintenanceStep(), citations(), recordAcceptedKnowledge(), stageName(), knowledgeCitation(), lessonCitation() (+1 more)

### Community 73 - "report.ts"
Cohesion: 0.29
Nodes (12): Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked(), row() (+4 more)

### Community 74 - "it-specialist.ts"
Cohesion: 0.13
Nodes (17): ITContext, informationalRecovery(), publishITReport(), delays, recoverAttempt(), listenerHealth(), providers, ProviderStatusChecks (+9 more)

### Community 75 - "admit-improvement.ts"
Cohesion: 0.24
Nodes (13): distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker(), improvementProvider(), linkedRepairGap() (+5 more)

### Community 76 - "useOfficePreferences.ts"
Cohesion: 0.26
Nodes (10): acceptPreferences(), PreferenceCandidate, strip(), UNKNOWN_PREFERENCES, OfficePreferencesController, PreferenceFeedback, PreferenceField, requestPreferences() (+2 more)

### Community 77 - "daily-cto.ts"
Cohesion: 0.05
Nodes (49): leadershipContext(), collectCTOFacts(), DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), boundedIntake(), boundedJobs() (+41 more)

### Community 78 - "cec/issue-publication.ts"
Cohesion: 0.08
Nodes (22): Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), Transition, descriptionPreimage(), plain() (+14 more)

### Community 79 - "superseded-receipts.ts"
Cohesion: 0.27
Nodes (8): Attempt, needsResumeReconciliation(), REVIEW_STAGES, stoppedInSetup(), Receipt, Settled, SETTLED_RECEIPT_NOTE, supersededReceipt()

### Community 80 - "prompts/conversations.ts"
Cohesion: 0.15
Nodes (12): ctoChatPrompt(), itChatPrompt(), slackSendPrompt(), PICKUP_CHAT, PickupSchema, assignmentDiagnostics(), diagnosticContext(), boundedCTOContext() (+4 more)

### Community 81 - "lesson-selection.ts"
Cohesion: 0.06
Nodes (38): ref_node_stream, ref_node_timers, args, [cmd,...rawArgs], commands, key, projectIndex, lessonIssueBody() (+30 more)

### Community 82 - "ref_node_path"
Cohesion: 0.07
Nodes (54): ref_node_crypto, ref_node_fs, ref_node_os, ref_node_path, ref_node_util, Document, isAccessOnlyPlan(), settledAccessOnlyState() (+46 more)

### Community 83 - "Effects"
Cohesion: 0.16
Nodes (17): Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership, rawHash() (+9 more)

### Community 84 - "OfficeSnapshot"
Cohesion: 0.09
Nodes (42): compactSteps(), displayAgentTask(), LiveAgentTask(), Props, RunningTask(), text(), Agent, AzureBuild (+34 more)

### Community 85 - "coordination.ts"
Cohesion: 0.14
Nodes (19): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), legacy, validateNativeContinuation(), checkpointWindow() (+11 more)

### Community 86 - "restart-writer.ts"
Cohesion: 0.31
Nodes (7): ATTEMPT_DELAYS_MS, nextAttemptAt(), NOT_RETRYABLE, WRITER_STAGES, writerRestartCandidate, writerRestarted(), src_shared_workkey

### Community 87 - "index.ts"
Cohesion: 0.08
Nodes (42): ref_hono_node_server, ref_node_http, ref_vite, implementationContinuationRoute(), qaPlanRetryRoute(), close(), config, itSpecialist (+34 more)

### Community 88 - "time-readback.ts"
Cohesion: 0.36
Nodes (5): TimeLedger, Readback, READBACK_INTERVAL_MS, readBackTime(), SETTLE_MS

### Community 89 - "merge-scanner-retry.ts"
Cohesion: 0.40
Nodes (9): officeMergeProvenance(), reconcileMergeScannerRetry(), Retry, retryMergeScanner(), retryReadBack(), runIdentity(), savedRetry(), transientScannerJobs() (+1 more)

### Community 90 - "StageResult"
Cohesion: 0.10
Nodes (38): applyIntakeObservation(), checkMail(), drainMail(), requestMail(), parksInJira(), MISSING_INTAKE, reconcileMailbox(), unusedMailbox() (+30 more)

### Community 91 - "OfficeConfigView.tsx"
Cohesion: 0.43
Nodes (6): loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView(), OfficeConfigSummary, errorText

### Community 92 - "delivery-ownership.ts"
Cohesion: 0.33
Nodes (5): ref_node_async_hooks, Ownership, ownershipContext, refreshDeliveryOwnership(), RefreshOwnership

### Community 93 - "install-service.mjs"
Cohesion: 0.33
Nodes (4): file, folder, logs, root

### Community 94 - "features.ts"
Cohesion: 0.10
Nodes (38): commandFeature(), reviewQuestions(), assertQuestionVisibility(), applyHarnessAction(), HarnessActionInput, recoveryPreconditions(), recoveryTarget(), normalizeRound() (+30 more)

### Community 95 - "capture-session-clone.py"
Cohesion: 0.15
Nodes (10): ctypes, errno, importlib_util, json, os, pathlib, Copy a coherent macOS clone of inherited reader fd3 to anonymous target fd4. No…, Read-only protocol adapter for the installed review helper. No model dispatch. (+2 more)

### Community 96 - "preferences-store.ts"
Cohesion: 0.21
Nodes (8): fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS, OfficePreferences, OfficePreferencesPatch

### Community 97 - "Outbox.tsx"
Cohesion: 0.07
Nodes (48): knowledgeOutbox(), Conversation(), LessonDecisionAction, lessonDecisionState(), readLessonDecision(), DAYS, dueLessonDecisions(), easternWeek() (+40 more)

### Community 98 - ".save"
Cohesion: 0.15
Nodes (36): jiraCollection(), BLOCKED, server_cec_parking_jira_issue_execute, findComment(), LiveIssue, readIssue(), readIssues(), Execute (+28 more)

### Community 99 - "HOLDS"
Cohesion: 0.10
Nodes (35): writerRestartPending(), deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, requireDeliveryAuthority(), deliveryIntakeBlocker(), gateRegisteredDelivery() (+27 more)

### Community 101 - "model-routes.ts"
Cohesion: 0.23
Nodes (10): assertModelOverrides(), CODEX_DEFAULT_EFFORT, CODEX_DEFAULT_MODEL, CODEX_EFFORTS, CODEX_ROLES, ModelRoute, qaPolicyRoute(), resolveModelRoute() (+2 more)

### Community 105 - "extract-worker.mjs"
Cohesion: 0.43
Nodes (6): ref_mammoth, ref_pdfjs_dist, bounded(), extract(), fail(), [path,kind]

### Community 107 - "blocker-followups.ts"
Cohesion: 0.35
Nodes (9): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), readBackConversations(), diagnosticSnapshot(), nativeDeliveryResolved(), handoff(), reconcileBlockerFollowups() (+1 more)

### Community 109 - "unblock-brief.ts"
Cohesion: 0.53
Nodes (5): clearUnblockBrief(), key(), saveUnblockBrief(), unblockBrief, src_shared_learningsubject

### Community 110 - "pilot-delivery.ts"
Cohesion: 0.11
Nodes (37): candidateBranchMoved(), dispatchNightly(), drainDelivery(), enableNightly(), resume(), startPilot(), consumeQAPlanRetry(), OfficeQAHandoffInput (+29 more)

## Knowledge Gaps
- **493 isolated node(s):** `PreferenceCandidate`, `People`, `OrgTree`, `ChartProps`, `Tab` (+488 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 641 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `dependency-bots/adopt.ts`, `config.ts`, `requests.ts`, `session-bridge.ts`, `implementation-recovery.ts`, `worker-runtime.ts`, `github-delivery.ts`, `features/workflow.ts`, `reader.ts`, `scheduled-captures.ts`, `run-retrospective.ts`, `record-trigger.ts`, `.emit`, `workKey`, `cec-reads.ts`, `github-context.ts`, `coordination-pump.ts`, `knowledge.ts`, `maintenance/maintenance.ts`, `cost-ledger.ts`, `activation-recovery.ts`, `jira-operations.ts`, `jira-time.ts`, `digest`, `Ticket`, `sanitize`, `azure.ts`, `accept-stage-result.ts`, `scheduled-work.ts`, `scheduler.ts`, `artifact`, `assignment-poll.ts`, `time-scope.ts`, `run-accounting.ts`, `currentAssignment`, `github.ts`, `dependencies.ts`, `assignments.ts`, `outbox.ts`, `metadata-context.ts`, `assignment.ts`, `weekly-rollup.ts`, `shared.ts`, `retrospective-subject.ts`, `store.ts`, `offices.ts`, `ledger.ts`, `ref_zod`, `verifyRepairCandidate`, `ticket-evidence.ts`, `agents.ts`, `.activeClaims`, `read-retries.ts`, `learning-events.ts`, `it-specialist.ts`, `admit-improvement.ts`, `daily-cto.ts`, `cec/issue-publication.ts`, `prompts/conversations.ts`, `lesson-selection.ts`, `ref_node_path`, `Effects`, `OfficeSnapshot`, `coordination.ts`, `restart-writer.ts`, `index.ts`, `time-readback.ts`, `StageResult`, `features.ts`, `.save`, `HOLDS`, `blocker-followups.ts`, `pilot-delivery.ts`?**
  _High betweenness centrality (0.113) - this node is a cross-community bridge._
- **Why does `Role` connect `Role` to `Inspector.tsx`, `worker-runtime.ts`, `github-delivery.ts`, `App.tsx`, `.emit`, `cec-reads.ts`, `github-context.ts`, `maintenance/maintenance.ts`, `Ticket`, `sanitize`, `accept-stage-result.ts`, `scheduler.ts`, `run-accounting.ts`, `OfficeScene.tsx`, `outbox.ts`, `scene-motion.ts`, `metadata-context.ts`, `work.ts`, `shared.ts`, `retrospective-subject.ts`, `store.ts`, `agents.ts`, `Agents`, `prompts/conversations.ts`, `index.ts`, `StageResult`, `Outbox.tsx`, `model-routes.ts`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `Coordinator` connect `executeRequest` to `scheduled-work.ts`, `requests.ts`, `assignment-poll.ts`, `Store`, `scheduled-captures.ts`, `dependencies.ts`, `coordination.ts`, `coordination-pump.ts`, `activation-recovery.ts`, `offices.ts`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **What connects `PreferenceCandidate`, `People`, `OrgTree` to the rest of the system?**
  _493 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `index.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12392156862745098 - nodes in this community are weakly interconnected._
- **Should `Role` be split into smaller, more focused modules?**
  _Cohesion score 0.1096938775510204 - nodes in this community are weakly interconnected._
- **Should `dependency-bots/adopt.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07690387016229713 - nodes in this community are weakly interconnected._