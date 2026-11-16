# Graph Report - the-office  (2026-11-15)

## Corpus Check
- 824 files · ~325,363 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4036 nodes · 18620 edges · 111 communities (109 shown, 2 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 604 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `083247d9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ref_node_path
- .activeClaims
- dependency-bots/adopt.ts
- github-delivery.ts
- Inspector.tsx
- TicketJob
- session-bridge.ts
- Button
- agents.ts
- .transaction
- implementation-recovery.ts
- shared.ts
- App.tsx
- features/workflow.ts
- assignments.ts
- scheduled-captures.ts
- run-retrospective.ts
- record-trigger.ts
- worker-runtime.ts
- workKey
- offices.ts
- Ticket
- PeoplePanel.tsx
- publication.ts
- office-lessons.ts
- maintenance/maintenance.ts
- features.ts
- currentAssignment
- coordination.ts
- packed-consumer-pnpm.ts
- metadata-assessment.ts
- index.tsx
- conversations/conversations.ts
- lesson-selection.ts
- sanitize
- requests.ts
- store.ts
- run-cost.ts
- closeout-recovery.ts
- run-accounting.ts
- candidate.ts
- time-scope.ts
- reader.ts
- .save
- artifact
- GitHubIssuePublisher
- OfficeScene.tsx
- engine.ts
- pilot-delivery.ts
- demand-facts.ts
- .emit
- harness-baseline.ts
- session-context-file.ts
- StageResult
- work.ts
- weekly-rollup.ts
- github-readiness.ts
- TimeBook.tsx
- ref_zod
- scheduler.ts
- retrospective-subject.ts
- run.ts
- digest
- assignment-poll.ts
- ticket-evidence.ts
- fact-bounds.ts
- FeatureWorkspace.tsx
- ControlStore
- jira-operations.ts
- recovery-ledger.ts
- constellation-runtime.ts
- Store
- Offices
- report.ts
- config.ts
- knowledge.ts
- session-scope.ts
- harnessDelivers
- JiraIssuePublisher
- cec-reads.ts
- control-store.ts
- scene-motion.ts
- atmosphere.ts
- preferences-store.ts
- outbox.ts
- ledger.ts
- local-config.ts
- daily-cto.ts
- unblock-brief.ts
- evidence-digest.ts
- cec/issue-publication.ts
- RoomCamera.tsx
- blocker-followups.ts
- it-specialist.ts
- diagnostic-context.ts
- capture-session-clone.py
- delivery-ownership.ts
- OfficeSnapshot
- Effects
- it-agent.ts
- merge-scanner-retry.ts
- service-health.ts
- run-evidence.ts
- delivery-task.ts
- install-service.mjs
- extract-worker.mjs
- ProjectProgress
- create-candidate.ts
- OfficeConfigView.tsx
- extraction.ts
- command-registry.ts

## God Nodes (most connected - your core abstractions)
1. `Store` - 364 edges
2. `TicketJob` - 166 edges
3. `digest()` - 150 edges
4. `GitHubDelivery` - 114 edges
5. `artifact()` - 114 edges
6. `command()` - 114 edges
7. `workKey()` - 95 edges
8. `OfficeSnapshot` - 88 edges
9. `cx()` - 88 edges
10. `currentAssignment()` - 86 edges

## Surprising Connections (you probably didn't know these)
- `apply()` --indirect_call--> `note()`  [INFERRED]
  src/conversations/OutboxSavedImplementation.tsx → server/cec/parking/resume-parked.ts
- `Admission` --references--> `AssignmentReview`  [EXTRACTED]
  server/delivery/intake/admission.ts → src/shared.ts
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

## Communities (111 total, 2 thin omitted)

### Community 0 - "ref_node_path"
Cohesion: 0.09
Nodes (28): ref_node_fs, ref_node_path, ref_node_util, Document, isAccessOnlyPlan(), settledAccessOnlyState(), continueAccessOnlyPlan(), entryExists() (+20 more)

### Community 1 - ".activeClaims"
Cohesion: 0.09
Nodes (45): deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, requireDeliveryAuthority(), deliveryIntakeBlocker(), gateRegisteredDelivery(), accounting (+37 more)

### Community 2 - "dependency-bots/adopt.ts"
Cohesion: 0.08
Nodes (67): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard, projectCards() (+59 more)

### Community 3 - "github-delivery.ts"
Cohesion: 0.07
Nodes (45): findingsBlock(), handsOff(), BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction(), dependabotReviewGuidance(), discover() (+37 more)

### Community 4 - "Inspector.tsx"
Cohesion: 0.10
Nodes (70): SendMessage, Outbox(), blockedSummary(), ServiceHealthPanel(), followUp(), labels, ServiceHealthRow(), BlockerFollowups() (+62 more)

### Community 5 - "TicketJob"
Cohesion: 0.10
Nodes (26): removeAdoptedClone(), GitHubDelivery, stoppedBaseCheckout(), assertStoppedBaseApproach(), stoppedBaseNextStage(), stoppedBasePackageInstruction(), adoptedReviewCandidate(), ciCheckout() (+18 more)

### Community 6 - "session-bridge.ts"
Cohesion: 0.13
Nodes (24): ref_ws, claudeSessionContext(), codexDaemonProcesses(), accountCodexProcesses(), codexProcessInventory, DesktopSessions, unaccountedProcesses(), codexSessionContext() (+16 more)

### Community 7 - "Button"
Cohesion: 0.07
Nodes (67): ref_react, ref_react_markdown, ref_remark_gfm, ref_yaml, guidanceExcerpt(), KnowledgeActivity, KnowledgeEdge, KnowledgeMap (+59 more)

### Community 8 - "agents.ts"
Cohesion: 0.07
Nodes (34): cecReconcilePrompt(), cecChatPrompt(), ctoChatPrompt(), slackSendPrompt(), slackVerifyPrompt(), HANDS_OFF_RESOLUTION_GUIDANCE, RESOLUTION_GUIDANCE, PICKUP_CHAT (+26 more)

### Community 9 - ".transaction"
Cohesion: 0.12
Nodes (32): featureItemComplete(), reconcileFeatureCompletion(), readEvidence(), helperTelemetry(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS, requestReplan() (+24 more)

### Community 10 - "implementation-recovery.ts"
Cohesion: 0.09
Nodes (34): continuationScope(), Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership (+26 more)

### Community 11 - "shared.ts"
Cohesion: 0.08
Nodes (27): completedPRReviews(), ContinuationDecision, eligible(), mergedByOwner(), ownerSettles(), retireExternalDeliveries(), settledExternalRepair(), OfficeQAReport (+19 more)

### Community 12 - "App.tsx"
Cohesion: 0.05
Nodes (68): ref_lucide_react, ref_motion, ref_react_dom, BrainDrawer(), themeColor, App(), BrainWorkspace, CONNECTION (+60 more)

### Community 13 - "features/workflow.ts"
Cohesion: 0.08
Nodes (48): approveFeature(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), artifactPath(), digest(), document() (+40 more)

### Community 14 - "assignments.ts"
Cohesion: 0.10
Nodes (28): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), KnowledgeContext, knowledgeSnapshot(), officeKnowledgeSnapshot(), assignmentSubject(), lessonForProject() (+20 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.15
Nodes (46): requestDelivery(), createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest (+38 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.09
Nodes (42): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, blockingTrigger, brainOverlap, brainOverlapQuery() (+34 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.11
Nodes (38): baselineLearning(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences(), configureKnowledge(), clip(), maintenanceBlockedId() (+30 more)

### Community 18 - "worker-runtime.ts"
Cohesion: 0.07
Nodes (41): SlackResultSchema, SlackVerificationSchema, candidateWorkspaceEnvironment(), ApproachSchema, GITHUB_ISSUE_SKILL, contextPacket(), DeliverySlot, CODEX_DEFAULT_EFFORT (+33 more)

### Community 19 - "workKey"
Cohesion: 0.09
Nodes (53): verifyContinuationPreservation(), assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), reconcileCompletedConflictDraft(), routeReadyPostConflictPublication() (+45 more)

### Community 20 - "offices.ts"
Cohesion: 0.15
Nodes (28): ref_node_crypto, commandFeature(), reviewQuestions(), confirmBrief(), FeaturePlanningBindings, FeaturePlanningConfig, POLICY_VERSION, assertQuestionVisibility() (+20 more)

### Community 21 - "Ticket"
Cohesion: 0.12
Nodes (26): implementationWorkerContext(), cecPrompt(), resolvedDecisionNote(), stageInstructions, reviewedPlanGuidance, reviewedPlanGuideDigest, qaRunDirectory(), APPROACH_GUIDANCE (+18 more)

### Community 22 - "PeoplePanel.tsx"
Cohesion: 0.09
Nodes (42): label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+34 more)

### Community 23 - "publication.ts"
Cohesion: 0.15
Nodes (10): featureById(), FeaturePublisher, publishFeature(), reconcilePublication(), uncertainPublications(), reserveIdentity(), FeatureReviewRunner, featureRoute() (+2 more)

### Community 24 - "office-lessons.ts"
Cohesion: 0.08
Nodes (30): normalizeStatement(), lessonBrainAudit, LessonBrainOverlap, INSTALLED, decideOfficeProposal(), now(), OfficeKnowledgeStore, proposeOfficeLessons() (+22 more)

### Community 25 - "maintenance/maintenance.ts"
Cohesion: 0.09
Nodes (32): maintenancePolicies(), captureLearning(), recordLearningOpportunity(), captureMaintenanceStep(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped() (+24 more)

### Community 26 - "features.ts"
Cohesion: 0.10
Nodes (21): discoveryPrompt(), planPrompt(), FeatureApproval, FeatureAttempt, FeatureAuthority, FeatureBaseline, FeatureDocument, FeatureHandoff (+13 more)

### Community 27 - "currentAssignment"
Cohesion: 0.08
Nodes (54): pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash (+46 more)

### Community 28 - "coordination.ts"
Cohesion: 0.04
Nodes (58): Admission, admit(), IntakeContext, WAIT_STATUSES, compatible(), dependencyCompletionKey(), dependencyEligibility(), DependencyStores (+50 more)

### Community 30 - "metadata-assessment.ts"
Cohesion: 0.13
Nodes (44): activeEffectId(), retryRead(), admitPRMetadata(), assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema, savedMetadataAssessment() (+36 more)

### Community 31 - "index.tsx"
Cohesion: 0.12
Nodes (40): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS, PickupForm(), ProjectForms() (+32 more)

### Community 32 - "conversations/conversations.ts"
Cohesion: 0.10
Nodes (19): ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff(), saveGoals() (+11 more)

### Community 33 - "lesson-selection.ts"
Cohesion: 0.16
Nodes (19): installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), MAINTENANCE, MAX_LESSONS, normalPath(), PURPOSES (+11 more)

### Community 34 - "sanitize"
Cohesion: 0.08
Nodes (43): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+35 more)

### Community 35 - "requests.ts"
Cohesion: 0.13
Nodes (28): boardPreflightCandidate(), Ownership, reconcileBoardPreflight(), savedActivationFailure(), candidateInput(), children, oldAdoptionBasis(), savedCandidateAdmission (+20 more)

### Community 36 - "store.ts"
Cohesion: 0.07
Nodes (58): freshOwnershipRead(), deliverySlot(), withAmendmentOwnership(), gateFeatureWork(), requestPriority(), closedTicketRequest(), REOBSERVED, retiredFollowup() (+50 more)

### Community 37 - "run-cost.ts"
Cohesion: 0.14
Nodes (17): CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL, Rates (+9 more)

### Community 38 - "closeout-recovery.ts"
Cohesion: 0.11
Nodes (47): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+39 more)

### Community 39 - "run-accounting.ts"
Cohesion: 0.08
Nodes (43): BoundedRead, done(), readBoundedNoFollow(), reasonOf(), CompletionReader, add(), CodexRequest, CodexRollout (+35 more)

### Community 40 - "candidate.ts"
Cohesion: 0.14
Nodes (20): GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles(), ContinuationIO (+12 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.07
Nodes (50): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), server_telemetry_billable_work_issue_key, isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence() (+42 more)

### Community 42 - "reader.ts"
Cohesion: 0.13
Nodes (11): committedNotePage(), BrainGraph, BrainNote, BrainReader, CommittedBrain, GraphNode, GraphPage, hash (+3 more)

### Community 43 - ".save"
Cohesion: 0.09
Nodes (43): jiraCollection(), BLOCKED, findComment(), LiveIssue, readIssue(), readIssues(), Execute, jira() (+35 more)

### Community 44 - "artifact"
Cohesion: 0.11
Nodes (53): ref_node_os, containedFile(), closeoutRequestResolved(), allowed, assertContinuationWorker(), continuationReviewArtifacts(), continuationWorkerProof(), negativeWorker() (+45 more)

### Community 45 - "GitHubIssuePublisher"
Cohesion: 0.25
Nodes (6): PublicationReceipt, GitHubIssuePublisher, number(), same(), FeatureManifestItem, FeatureOperation

### Community 46 - "OfficeScene.tsx"
Cohesion: 0.16
Nodes (34): withoutElapsed(), Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk() (+26 more)

### Community 47 - "engine.ts"
Cohesion: 0.07
Nodes (16): correlatedBuild(), checkMail(), drainMail(), requestMail(), ingest(), GitHubMonitor, drainMaintenance(), reconcileMaintenance() (+8 more)

### Community 48 - "pilot-delivery.ts"
Cohesion: 0.12
Nodes (34): continueImplementation(), dispatchNightly(), drainDelivery(), enableNightly(), resume(), startPilot(), consumeQAPlanRetry(), OfficeQAHandoffInput (+26 more)

### Community 49 - "demand-facts.ts"
Cohesion: 0.13
Nodes (22): clip(), DEMAND_LIMIT, demandFacts(), DemandSection, key(), LessonKey, notes(), clip() (+14 more)

### Community 50 - ".emit"
Cohesion: 0.14
Nodes (25): decideImplementation(), requestQAPlanRetry(), configureChannelNotices(), configureNotices(), retryRecipientLookup(), recoverCTOInput(), declineLessonIssue(), reactivateLesson() (+17 more)

### Community 51 - "harness-baseline.ts"
Cohesion: 0.15
Nodes (20): baselineReport, BaselineSource, baselineText(), millions(), row(), share(), add(), BaselineState (+12 more)

### Community 52 - "session-context-file.ts"
Cohesion: 0.23
Nodes (13): ref_node_perf_hooks, contextFoldPrefix, SessionContextCheckpoint, captureSessionContextClone(), ContextReadPhase, SessionContextDeadline, sessionContextFile(), ContextReadChanged (+5 more)

### Community 53 - "StageResult"
Cohesion: 0.10
Nodes (39): applyIntakeObservation(), parksInJira(), qaPlanEvidenceGap(), run(), publicationEvidenceGap(), qaEvidenceGap(), resultGate(), stageResultGap() (+31 more)

### Community 54 - "work.ts"
Cohesion: 0.09
Nodes (26): BLOCKED_CAUSES, blockedCauses(), projectReadiness(), explanation(), LABELS, stoppedReason(), ProjectReadiness, HistoryRetirement (+18 more)

### Community 55 - "weekly-rollup.ts"
Cohesion: 0.12
Nodes (30): isBlocking(), learningMetrics(), busyMaintenanceIds(), BRAIN_SCOPE, RollupResult, triggerJobId(), harperFolder(), KnowledgeRunner (+22 more)

### Community 56 - "github-readiness.ts"
Cohesion: 0.10
Nodes (41): resumeProviderReviews(), observe(), assertAutomationEffects(), automationMergePolicy(), observeAutomationMerge(), routeAutomationMerge(), checksFailed(), checksPassed() (+33 more)

### Community 57 - "TimeBook.tsx"
Cohesion: 0.08
Nodes (49): CostCompleteness, TelemetryReport, TelemetryRow, TelemetrySync, UsageCompleteness, UsageSource, ValuationSource, displayAgentTask() (+41 more)

### Community 58 - "ref_zod"
Cohesion: 0.10
Nodes (25): ref_zod, assertOwnership(), ImplementationDecision, OwnershipRead, closedReadonlyPlan(), Document, continueOwnershipRead(), expiredOwnershipRead() (+17 more)

### Community 59 - "scheduler.ts"
Cohesion: 0.17
Nodes (13): fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch(), deliveryOccupied(), foreignWork() (+5 more)

### Community 60 - "retrospective-subject.ts"
Cohesion: 0.17
Nodes (16): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, maintenanceKey(), azurePrUrl(), findSubject(), jobSubject() (+8 more)

### Community 61 - "run.ts"
Cohesion: 0.23
Nodes (12): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, OFFICE_FIX_PROMPT, OfficeFixResult, validateOfficeFix(), investigationReady(), InvestigationOptions, InvestigationReport (+4 more)

### Community 62 - "digest"
Cohesion: 0.24
Nodes (15): interruptedImplementation(), ownershipReadHistory(), verifiedCloseoutCleanupRequest(), continuationNativeReview(), stoppedBasePackedCommands(), assertAcceptedFiles(), assertStoppedBaseMergeReady(), assertStoppedBaseValidation() (+7 more)

### Community 63 - "assignment-poll.ts"
Cohesion: 0.10
Nodes (33): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), initialManualStart(), recordCandidateCleanup() (+25 more)

### Community 64 - "ticket-evidence.ts"
Cohesion: 0.20
Nodes (20): assetDownloader(), attachmentKind(), evidenceDirectory(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS, EvidenceAttachment (+12 more)

### Community 65 - "fact-bounds.ts"
Cohesion: 0.20
Nodes (17): leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance() (+9 more)

### Community 66 - "FeatureWorkspace.tsx"
Cohesion: 0.11
Nodes (28): FeatureQuestionProjection, OutboxQuestionRound(), send(), FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases (+20 more)

### Community 67 - "ControlStore"
Cohesion: 0.19
Nodes (6): DailyCTO, reviewWeekday(), Briefing, saveReviewBriefing(), ControlStore, DailyCTOReport

### Community 68 - "jira-operations.ts"
Cohesion: 0.27
Nodes (9): CommentPage, commentReadback(), JiraOperations, plain(), jiraRecord(), unpack(), metadataDigest(), verifiedTransition() (+1 more)

### Community 69 - "recovery-ledger.ts"
Cohesion: 0.52
Nodes (6): savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), reconcileRecoveryLedger(), stoppedBaseUpdateUnresolved()

### Community 70 - "constellation-runtime.ts"
Cohesion: 0.10
Nodes (22): ref_3d_force_graph, ref_three, CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point (+14 more)

### Community 71 - "Store"
Cohesion: 0.07
Nodes (26): Event, one(), prePushRejection(), PushIdentity, Candidate, settledPushBoundary(), GitHubFeaturePublisher, JiraFeaturePublisher (+18 more)

### Community 72 - "Offices"
Cohesion: 0.27
Nodes (3): queueLessonIssueCheck(), projectById(), Offices

### Community 73 - "report.ts"
Cohesion: 0.33
Nodes (11): Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked(), row() (+3 more)

### Community 74 - "config.ts"
Cohesion: 0.05
Nodes (58): ref_hono_node_server, ref_node_http, ref_node_stream, ref_node_timers, ref_smol_toml, ref_vite, implementationPreview(), implementationContinuationRoute() (+50 more)

### Community 75 - "knowledge.ts"
Cohesion: 0.10
Nodes (29): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+21 more)

### Community 76 - "session-scope.ts"
Cohesion: 0.16
Nodes (16): readTranscript, root, claudeSessionScope(), readRollout, ContextProject, ContextReader, retainSessionMessage(), SessionConversation (+8 more)

### Community 77 - "harnessDelivers"
Cohesion: 0.12
Nodes (27): harnessCloseout(), PASSING, verifyMergeActions(), assertDeliveryMayMutate(), HarnessControl, withHarnessWork(), runHarnessStage(), HANDS_OFF_PROJECTS (+19 more)

### Community 78 - "JiraIssuePublisher"
Cohesion: 0.29
Nodes (3): JiraIssuePublisher, keyOf(), publicationDescription()

### Community 79 - "cec-reads.ts"
Cohesion: 0.23
Nodes (12): IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), intakeMembership(), projectListScope(), cecIntakePrompt(), cecReadbackPrompt() (+4 more)

### Community 80 - "control-store.ts"
Cohesion: 0.09
Nodes (17): ref_node_sqlite, Clock, systemClock, applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, statementCache() (+9 more)

### Community 81 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 82 - "atmosphere.ts"
Cohesion: 0.28
Nodes (7): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), SCENE_COLOR_TOKENS, TOKENS

### Community 83 - "preferences-store.ts"
Cohesion: 0.14
Nodes (13): fields, PreferencesPatch, PreferencesStore, StoredBody, acceptPreferences(), PreferenceCandidate, PreferenceState, strip() (+5 more)

### Community 84 - "outbox.ts"
Cohesion: 0.13
Nodes (23): ADOPTION_STALLED_MS, projectOutbox(), syncOutbox(), projectSlackDeliveries(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint() (+15 more)

### Community 85 - "ledger.ts"
Cohesion: 0.15
Nodes (21): diagnosticSnapshot(), investigationCandidates(), investigationId(), investigationEvidence(), investigationFollowUps(), INVOCATION_SOURCE_REFS, invocationSource(), sections (+13 more)

### Community 86 - "local-config.ts"
Cohesion: 0.28
Nodes (11): AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), goalEvidencePath(), OfficeConfigInputs, officeConfigRoute(), officeConfigSummary(), CECBinding, localBindings (+3 more)

### Community 87 - "daily-cto.ts"
Cohesion: 0.12
Nodes (20): EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), applyGoalReview(), DailyResultSchema, EvidenceRefSchema, FreshDailyResultSchema, GoalEvidenceRequestSchema (+12 more)

### Community 88 - "unblock-brief.ts"
Cohesion: 0.23
Nodes (9): catalogLine(), clearUnblockBrief(), key(), saveUnblockBrief(), unblockBrief, KnowledgeState, LearningMetrics, src_shared_knowledgestate (+1 more)

### Community 89 - "evidence-digest.ts"
Cohesion: 0.44
Nodes (7): canonical(), evidenceDigest(), evidenceHash(), semantic(), stableUrl(), requirementDrift(), RequirementPostimage

### Community 90 - "cec/issue-publication.ts"
Cohesion: 0.32
Nodes (6): Assignment, Content, jiraText(), Transition, descriptionPreimage(), plain()

### Community 91 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (10): ref_react_three_drei, ref_react_three_fiber, ref_three_stdlib, CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility (+2 more)

### Community 92 - "blocker-followups.ts"
Cohesion: 0.38
Nodes (9): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), readBackConversations(), nativeDeliveryResolved(), handoff(), reconcileBlockerFollowups() (+1 more)

### Community 93 - "it-specialist.ts"
Cohesion: 0.23
Nodes (12): ITContext, publishITReport(), ITSpecialist, delays, recoverAttempt(), itFollowUpView(), sessionVisibilityCopy(), date() (+4 more)

### Community 94 - "diagnostic-context.ts"
Cohesion: 0.48
Nodes (4): itChatPrompt(), assignmentDiagnostics(), diagnosticContext(), currentServices()

### Community 95 - "capture-session-clone.py"
Cohesion: 0.15
Nodes (10): ctypes, errno, importlib_util, json, os, pathlib, Copy a coherent macOS clone of inherited reader fd3 to anonymous target fd4. No…, Read-only protocol adapter for the installed review helper. No model dispatch. (+2 more)

### Community 96 - "delivery-ownership.ts"
Cohesion: 0.33
Nodes (5): ref_node_async_hooks, Ownership, ownershipContext, refreshDeliveryOwnership(), RefreshOwnership

### Community 97 - "OfficeSnapshot"
Cohesion: 0.05
Nodes (66): knowledgeOutbox(), Conversation(), LessonDecisionAction, lessonDecisionState(), readLessonDecision(), DAYS, dueLessonDecisions(), easternWeek() (+58 more)

### Community 98 - "Effects"
Cohesion: 0.12
Nodes (23): channelNoticeAuthorized(), ChannelSettings, notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR, plainSlackText() (+15 more)

### Community 99 - "it-agent.ts"
Cohesion: 0.47
Nodes (3): itAgent(), itDiagnostics(), Agent

### Community 100 - "merge-scanner-retry.ts"
Cohesion: 0.40
Nodes (9): officeMergeProvenance(), reconcileMergeScannerRetry(), Retry, retryMergeScanner(), retryReadBack(), runIdentity(), savedRetry(), transientScannerJobs() (+1 more)

### Community 101 - "service-health.ts"
Cohesion: 0.19
Nodes (9): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, HealthReport (+1 more)

### Community 102 - "run-evidence.ts"
Cohesion: 0.47
Nodes (4): comparable(), EvidenceOutcome, recordRunEvidence(), RunAccounting

### Community 103 - "delivery-task.ts"
Cohesion: 0.36
Nodes (6): reviewInstructions(), deliveryTask(), DeliveryTaskInput, DISCOVERY_GUIDANCE, compactSteps(), featureDeliveryContext()

### Community 104 - "install-service.mjs"
Cohesion: 0.16
Nodes (11): ref_node_child_process, ref_node_url, file, folder, logs, root, GIT_NETWORK, LIVE_PROVIDERS (+3 more)

### Community 105 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (6): ref_mammoth, ref_pdfjs_dist, bounded(), extract(), fail(), [path,kind]

### Community 107 - "create-candidate.ts"
Cohesion: 0.26
Nodes (10): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+2 more)

### Community 108 - "OfficeConfigView.tsx"
Cohesion: 0.43
Nodes (6): loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView(), OfficeConfigSummary, errorText

### Community 109 - "extraction.ts"
Cohesion: 0.33
Nodes (4): ref_node_string_decoder, extractDocument, Extraction, Extractor

### Community 111 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

## Knowledge Gaps
- **478 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+473 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 617 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `ref_node_path`, `.activeClaims`, `dependency-bots/adopt.ts`, `github-delivery.ts`, `TicketJob`, `session-bridge.ts`, `agents.ts`, `.transaction`, `implementation-recovery.ts`, `shared.ts`, `features/workflow.ts`, `assignments.ts`, `scheduled-captures.ts`, `run-retrospective.ts`, `record-trigger.ts`, `worker-runtime.ts`, `workKey`, `offices.ts`, `Ticket`, `publication.ts`, `office-lessons.ts`, `maintenance/maintenance.ts`, `currentAssignment`, `coordination.ts`, `metadata-assessment.ts`, `conversations/conversations.ts`, `lesson-selection.ts`, `sanitize`, `requests.ts`, `store.ts`, `closeout-recovery.ts`, `run-accounting.ts`, `candidate.ts`, `time-scope.ts`, `.save`, `artifact`, `engine.ts`, `pilot-delivery.ts`, `demand-facts.ts`, `.emit`, `StageResult`, `weekly-rollup.ts`, `github-readiness.ts`, `ref_zod`, `scheduler.ts`, `retrospective-subject.ts`, `run.ts`, `digest`, `assignment-poll.ts`, `ticket-evidence.ts`, `fact-bounds.ts`, `jira-operations.ts`, `config.ts`, `knowledge.ts`, `harnessDelivers`, `cec-reads.ts`, `control-store.ts`, `outbox.ts`, `ledger.ts`, `daily-cto.ts`, `cec/issue-publication.ts`, `blocker-followups.ts`, `it-specialist.ts`, `diagnostic-context.ts`, `OfficeSnapshot`, `Effects`, `it-agent.ts`, `run-evidence.ts`, `delivery-task.ts`, `create-candidate.ts`?**
  _High betweenness centrality (0.101) - this node is a cross-community bridge._
- **Why does `TicketJob` connect `TicketJob` to `ref_node_path`, `.activeClaims`, `dependency-bots/adopt.ts`, `github-delivery.ts`, `Inspector.tsx`, `Button`, `implementation-recovery.ts`, `shared.ts`, `App.tsx`, `record-trigger.ts`, `workKey`, `Ticket`, `currentAssignment`, `metadata-assessment.ts`, `requests.ts`, `store.ts`, `closeout-recovery.ts`, `artifact`, `pilot-delivery.ts`, `StageResult`, `github-readiness.ts`, `scheduler.ts`, `retrospective-subject.ts`, `digest`, `assignment-poll.ts`, `fact-bounds.ts`, `Store`, `harnessDelivers`, `it-specialist.ts`, `merge-scanner-retry.ts`, `delivery-task.ts`, `ProjectProgress`, `create-candidate.ts`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `command()` connect `Store` to `ref_node_path`, `dependency-bots/adopt.ts`, `github-delivery.ts`, `TicketJob`, `session-bridge.ts`, `agents.ts`, `.transaction`, `shared.ts`, `features/workflow.ts`, `worker-runtime.ts`, `publication.ts`, `maintenance/maintenance.ts`, `currentAssignment`, `coordination.ts`, `metadata-assessment.ts`, `sanitize`, `requests.ts`, `store.ts`, `closeout-recovery.ts`, `candidate.ts`, `time-scope.ts`, `reader.ts`, `.save`, `engine.ts`, `.emit`, `StageResult`, `github-readiness.ts`, `ref_zod`, `assignment-poll.ts`, `ticket-evidence.ts`, `jira-operations.ts`, `knowledge.ts`, `harnessDelivers`, `cec/issue-publication.ts`, `Effects`, `service-health.ts`, `install-service.mjs`, `create-candidate.ts`, `command-registry.ts`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _478 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ref_node_path` be split into smaller, more focused modules?**
  _Cohesion score 0.09351432880844646 - nodes in this community are weakly interconnected._
- **Should `.activeClaims` be split into smaller, more focused modules?**
  _Cohesion score 0.08766803039158387 - nodes in this community are weakly interconnected._
- **Should `dependency-bots/adopt.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07609805924412666 - nodes in this community are weakly interconnected._