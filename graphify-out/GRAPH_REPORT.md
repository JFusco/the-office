# Graph Report - office-cec-implementation-continuation-nov14  (2026-11-13)

## Corpus Check
- 782 files · ~320,938 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3974 nodes · 18533 edges · 116 communities (110 shown, 6 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 598 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8f4a48e0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- github-delivery.ts
- closeout-recovery.ts
- features/commands.ts
- digest
- coordination.ts
- requests.ts
- Button
- Inspector.tsx
- Goals.tsx
- session-bridge.ts
- workKey
- cec/workflow.ts
- Ticket
- publish-pr.ts
- currentAssignment
- process.ts
- scheduled-captures.ts
- .transaction
- features.ts
- OfficeSnapshot
- App.tsx
- agents.ts
- harnessDelivers
- it-specialist.ts
- PeoplePanel.tsx
- maintenance/maintenance.ts
- ControlStore
- run-retrospective.ts
- record-trigger.ts
- ref_zod
- demand-facts.ts
- notifications.ts
- index.tsx
- outbox.ts
- ref_node_crypto
- Effects
- sanitize
- .emit
- JiraIssuePublisher
- Role
- lesson-selection.ts
- constellation-runtime.ts
- artifact
- source-amendment.ts
- Conversation.tsx
- scheduled-work.ts
- assignments.ts
- Store
- ticket-evidence.ts
- OfficeScene.tsx
- assignment-poll.ts
- run.ts
- cost-ledger.ts
- candidate.ts
- reader.ts
- accept-stage-result.ts
- config.ts
- weekly-rollup.ts
- daily-cto.ts
- work.ts
- TimeBook.tsx
- .save
- retrospective-subject.ts
- remove-candidate.ts
- knowledge-views.ts
- time-scope.ts
- effects.ts
- enrollment-gate.ts
- offices.ts
- rootArtifact
- supersedingDelivery
- run-accounting.ts
- jira-time.ts
- checkpoint-completion.ts
- node-visuals.ts
- MaintenanceRun
- goal-reporting.ts
- create-candidate.ts
- scene-motion.ts
- GitHubIssuePublisher
- ledger.ts
- TicketJob
- delivery-repairs.ts
- report.ts
- preferences-store.ts
- blocker-followups.ts
- capture-session-clone.py
- RoomCamera.tsx
- recovery-ledger.ts
- evidence.ts
- it-agent.ts
- github-check-selection.ts
- QuestionStepper.tsx
- shared.ts
- OfficeConfigView.tsx
- github-readiness.ts
- candidate-child-context.ts
- command
- ownedPath
- admit-improvement.ts
- knowledge.ts
- extract-worker.mjs
- cec/issue-publication.ts
- ITFollowUps.tsx
- slack-supersession.ts
- server_delivery_harness_delivery_authority_resolvedeliverywork
- server_features_questions_pending_round_pendinground
- server_features_questions_pending_round_pendingrounds
- server_features_questions_pending_round_roundauthor
- src_shared_personas
- src_shared_workkey
- brain-maintenance.ts
- createConstellation
- discovery-recovery.ts
- maintenancePolicies
- pre-push-boundary.ts

## God Nodes (most connected - your core abstractions)
1. `Store` - 352 edges
2. `TicketJob` - 174 edges
3. `digest()` - 165 edges
4. `artifact()` - 129 edges
5. `GitHubDelivery` - 122 edges
6. `command()` - 109 edges
7. `workKey()` - 101 edges
8. `cx()` - 88 edges
9. `currentAssignment()` - 84 edges
10. `Button` - 84 edges

## Surprising Connections (you probably didn't know these)
- `apply()` --indirect_call--> `note()`  [INFERRED]
  src/conversations/OutboxSavedImplementation.tsx → server/cec/parking/resume-parked.ts
- `DeliveryAuthorityInput` --references--> `HarnessRequest`  [EXTRACTED]
  server/delivery/harness/delivery-authority.ts → src/contracts/work.ts
- `projectOutbox()` --calls--> `deferredPickup()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/pickup-state.ts
- `projectOutbox()` --calls--> `parkedProviderWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts
- `projectOutbox()` --calls--> `readinessWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts

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

## Communities (116 total, 6 thin omitted)

### Community 0 - "github-delivery.ts"
Cohesion: 0.06
Nodes (33): containedFile(), findingsBlock(), BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction(), dependabotReviewGuidance(), discover() (+25 more)

### Community 1 - "closeout-recovery.ts"
Cohesion: 0.08
Nodes (52): assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint(), closeoutProviderEvidence() (+44 more)

### Community 2 - "features/commands.ts"
Cohesion: 0.09
Nodes (48): approveFeature(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), artifactPath(), digest(), document() (+40 more)

### Community 3 - "digest"
Cohesion: 0.08
Nodes (60): ref_node_fs, ref_node_os, ref_node_path, ref_node_util, HarnessControl, pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), admitGreen156() (+52 more)

### Community 4 - "coordination.ts"
Cohesion: 0.05
Nodes (50): reconcileNoticeConfirmations(), Admission, admit(), IntakeContext, WAIT_STATUSES, compatible(), dependencyCompletionKey(), dependencyEligibility() (+42 more)

### Community 5 - "requests.ts"
Cohesion: 0.12
Nodes (32): accounting, DeliverySubject, nonDelivery, originalReads, hasSavedPrerequisiteResult(), admitPacked165(), history(), makePacked165Candidate() (+24 more)

### Community 6 - "Button"
Cohesion: 0.08
Nodes (60): ref_react, ref_react_markdown, ref_remark_gfm, ref_yaml, KnowledgeNode, TicketPlanningAction(), Activity(), ActivityTimeline() (+52 more)

### Community 7 - "Inspector.tsx"
Cohesion: 0.14
Nodes (51): blockedSummary(), ServiceHealthPanel(), labels, ServiceHealthRow(), BlockerFollowups(), LessonsPanel(), EvidenceCard(), Inspector() (+43 more)

### Community 8 - "Goals.tsx"
Cohesion: 0.08
Nodes (38): OutboxSavedImplementation(), apply(), review(), reconcile(), FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace() (+30 more)

### Community 9 - "session-bridge.ts"
Cohesion: 0.06
Nodes (51): ref_node_url, ref_ws, file, folder, logs, root, claudeSessionContext(), readTranscript (+43 more)

### Community 10 - "workKey"
Cohesion: 0.07
Nodes (76): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+68 more)

### Community 11 - "cec/workflow.ts"
Cohesion: 0.11
Nodes (37): applyIntakeObservation(), parksInJira(), MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), MISSING_SAVED_PLAN, recoverSavedPlan(), run() (+29 more)

### Community 12 - "Ticket"
Cohesion: 0.11
Nodes (23): implementationWorkerContext(), IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), intakeMembership(), projectListScope(), cecPrompt() (+15 more)

### Community 13 - "publish-pr.ts"
Cohesion: 0.13
Nodes (43): activeEffectId(), retryRead(), admitPRMetadata(), assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema, savedMetadataAssessment() (+35 more)

### Community 14 - "currentAssignment"
Cohesion: 0.11
Nodes (35): withHarnessWork(), guard(), Assessment, outsideScanSources(), Ownership, reconcileScopeRepairReadback(), requireThat(), scopeRepairReadbackCandidate() (+27 more)

### Community 15 - "process.ts"
Cohesion: 0.16
Nodes (18): ref_node_child_process, inactivityWatch(), At, errno, GroupInventory, GroupProbe, LifecycleDiagnostic, Phase (+10 more)

### Community 16 - "scheduled-captures.ts"
Cohesion: 0.16
Nodes (42): createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest, captureRequests() (+34 more)

### Community 17 - ".transaction"
Cohesion: 0.10
Nodes (36): jiraText(), featureItemComplete(), reconcileFeatureCompletion(), discoveryPrompt(), planPrompt(), GitHubFeaturePublisher, helperTelemetry(), JiraFeaturePublisher (+28 more)

### Community 18 - "features.ts"
Cohesion: 0.09
Nodes (40): commandFeature(), reviewQuestions(), saveCaptureRequest(), confirmBrief(), FeaturePlanningBindings, applyHarnessAction(), HarnessActionInput, recoveryPreconditions() (+32 more)

### Community 19 - "OfficeSnapshot"
Cohesion: 0.10
Nodes (41): Outbox(), ctoInputFailure(), OutboxCTOInput(), recover(), OutboxMaintenanceStatus(), OutboxSavedPlan(), savedImplementationFollowup(), followUp() (+33 more)

### Community 20 - "App.tsx"
Cohesion: 0.05
Nodes (48): ref_lucide_react, ref_motion, ref_react_dom, BrainDrawer(), themeColor, App(), BrainWorkspace, CONNECTION (+40 more)

### Community 21 - "agents.ts"
Cohesion: 0.05
Nodes (55): cecChatPrompt(), candidateWorkspaceEnvironment(), HANDS_OFF_RESOLUTION_GUIDANCE, RESOLUTION_GUIDANCE, ApproachSchema, canFileGithubIssue(), githubFollowupPrompt(), knowledgeChatPrompt() (+47 more)

### Community 22 - "harnessDelivers"
Cohesion: 0.16
Nodes (22): deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, requireDeliveryAuthority(), gateRegisteredDelivery(), resolveDeliveryWork(), HANDS_OFF_PROJECTS (+14 more)

### Community 23 - "it-specialist.ts"
Cohesion: 0.14
Nodes (16): ITContext, publishITReport(), delays, recoverAttempt(), listenerHealth(), providers, ProviderStatusChecks, summary (+8 more)

### Community 24 - "PeoplePanel.tsx"
Cohesion: 0.09
Nodes (45): label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+37 more)

### Community 25 - "maintenance/maintenance.ts"
Cohesion: 0.14
Nodes (17): candidateOwner(), SETTLED, skipOwnedCandidate(), Skipped, skippedCandidateLedger(), CmsFollowUpContext, cmsFollowUpInstructions(), GitHubMaintenance (+9 more)

### Community 26 - "ControlStore"
Cohesion: 0.14
Nodes (7): DailyCTO, dailyReviewPrompt(), Briefing, saveReviewBriefing(), ControlStore, DailyCTOReport, DailyCTOSummary

### Community 27 - "run-retrospective.ts"
Cohesion: 0.10
Nodes (38): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, blockingTrigger, brainOverlap, brainOverlapQuery() (+30 more)

### Community 28 - "record-trigger.ts"
Cohesion: 0.09
Nodes (45): isBlocking(), baselineLearning(), LEARNING_BASELINES, maintainLearning(), busyMaintenanceIds(), clip(), maintenanceBlockedId(), MaintenanceCandidate (+37 more)

### Community 29 - "ref_zod"
Cohesion: 0.09
Nodes (28): ref_zod, assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO() (+20 more)

### Community 30 - "demand-facts.ts"
Cohesion: 0.12
Nodes (25): assignmentKnowledge(), clip(), DEMAND_LIMIT, demandFacts(), DemandSection, key(), LessonKey, notes() (+17 more)

### Community 31 - "notifications.ts"
Cohesion: 0.10
Nodes (26): channelNoticeAuthorized(), ChannelSettings, notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR, plainSlackText() (+18 more)

### Community 32 - "index.tsx"
Cohesion: 0.12
Nodes (39): LessonsView(), SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS, PickupForm() (+31 more)

### Community 33 - "outbox.ts"
Cohesion: 0.21
Nodes (10): ctoInputRecovered(), conversationResolved(), projectOutbox(), knowledgeOutbox(), checkpointSuperseded(), isSavedPlanFollowup(), savedPlanFollowup(), HumanAction (+2 more)

### Community 34 - "ref_node_crypto"
Cohesion: 0.08
Nodes (21): ref_node_crypto, continueImplementation(), nativeIO, assertOwnership(), checkMail(), drainMail(), requestMail(), dispatchNightly() (+13 more)

### Community 35 - "Effects"
Cohesion: 0.21
Nodes (11): publishFeature(), GitHubOperations, fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), lessonText(), Assessment, closeNativeRefresh() (+3 more)

### Community 36 - "sanitize"
Cohesion: 0.11
Nodes (28): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+20 more)

### Community 37 - ".emit"
Cohesion: 0.13
Nodes (30): decideImplementation(), configureChannelNotices(), configureNotices(), retryRecipientLookup(), recoverCTOInput(), enqueueGreen156(), enqueueMetadataRecovery(), normalizeStatement() (+22 more)

### Community 38 - "JiraIssuePublisher"
Cohesion: 0.29
Nodes (3): JiraIssuePublisher, keyOf(), publicationDescription()

### Community 39 - "Role"
Cohesion: 0.13
Nodes (19): ROLES, DeliverySlot, officeCapacity, PROJECTS, withCECGoalEvidence(), fifo(), ScheduledWork, Scheduler (+11 more)

### Community 40 - "lesson-selection.ts"
Cohesion: 0.06
Nodes (30): ref_node_stream, ref_node_timers, args, [cmd,...rawArgs], commands, key, projectIndex, lessonBrainAudit (+22 more)

### Community 41 - "constellation-runtime.ts"
Cohesion: 0.15
Nodes (17): ref_3d_force_graph, ref_three, CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point (+9 more)

### Community 42 - "artifact"
Cohesion: 0.09
Nodes (54): deliveryIntakeBlocker(), boardPreflightCandidate(), partialLocalCleanupCandidate(), savedActivationFailure(), assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence() (+46 more)

### Community 43 - "source-amendment.ts"
Cohesion: 0.06
Nodes (68): ref_node_async_hooks, adoptCandidate(), reported, Scope, approvedText(), assert(), AMENDMENT_REVIEW_PROOF, amendmentInstruction() (+60 more)

### Community 44 - "Conversation.tsx"
Cohesion: 0.15
Nodes (22): Conversation(), SendMessage, LessonDecisionAction, lessonDecisionState(), readLessonDecision(), OutboxLessonDecision(), act(), readStatus() (+14 more)

### Community 45 - "scheduled-work.ts"
Cohesion: 0.10
Nodes (29): deliverySlot(), metadataRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), requestPriority(), closedTicketRequest(), REOBSERVED, retiredFollowup() (+21 more)

### Community 46 - "assignments.ts"
Cohesion: 0.12
Nodes (20): committedNotePage(), guidanceExcerpt(), digest(), assignmentLookups, Binding, lookupInstructions(), lookupJournal, citations() (+12 more)

### Community 47 - "Store"
Cohesion: 0.08
Nodes (29): ref_node_sqlite, ctoChatPrompt(), itChatPrompt(), assignmentDiagnostics(), diagnosticContext(), diagnosticSnapshot(), nativeDeliveryResolved(), boundedCTOContext() (+21 more)

### Community 48 - "ticket-evidence.ts"
Cohesion: 0.10
Nodes (35): ref_node_string_decoder, assetDownloader(), attachmentKind(), evidenceDirectory(), readEvidence(), storeEvidence(), blankEvidence(), CoverageState (+27 more)

### Community 49 - "OfficeScene.tsx"
Cohesion: 0.16
Nodes (34): withoutElapsed(), Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk() (+26 more)

### Community 50 - "assignment-poll.ts"
Cohesion: 0.06
Nodes (77): noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), Lane, MOVABLE, resolveLane(), cardStatus(), Execute (+69 more)

### Community 51 - "run.ts"
Cohesion: 0.17
Nodes (17): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, INVOCATION_SOURCE_REFS, NOTIFY_HELPER, OFFICE_FIX_PROMPT, OfficeFixResult, validateOfficeFix(), OFFICE_SOURCE_PATHS (+9 more)

### Community 52 - "cost-ledger.ts"
Cohesion: 0.14
Nodes (29): captureCost(), server_telemetry_cost_entries_costcoveragesummary, costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress() (+21 more)

### Community 53 - "candidate.ts"
Cohesion: 0.12
Nodes (23): GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles(), ContinuationIO (+15 more)

### Community 54 - "reader.ts"
Cohesion: 0.13
Nodes (9): BrainGraph, BrainNote, BrainReader, CommittedBrain, GraphNode, GraphPage, hash, Note (+1 more)

### Community 55 - "accept-stage-result.ts"
Cohesion: 0.17
Nodes (19): acceptStageResult(), acceptConflictRepair(), draftReadHeadMatches(), assertDraftClaimHistory(), linkDraftIssue(), protectedOriginalClaim(), METADATA_FINDING, publicationReadArgs() (+11 more)

### Community 56 - "config.ts"
Cohesion: 0.06
Nodes (52): ref_hono_node_server, ref_node_http, ref_vite, implementationPreview(), implementationContinuationRoute(), AUTO_ADOPT_BOTS, Link, linkFeature() (+44 more)

### Community 57 - "weekly-rollup.ts"
Cohesion: 0.12
Nodes (29): learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), BRAIN_SCOPE (+21 more)

### Community 58 - "daily-cto.ts"
Cohesion: 0.09
Nodes (34): collectCTOFacts(), EvidenceRequestConflict, evidenceRequestConflicts, boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip() (+26 more)

### Community 59 - "work.ts"
Cohesion: 0.11
Nodes (22): BLOCKED_CAUSES, blockedCauses(), projectReadiness(), ProjectReadiness, HistoryRetirement, HistoryRetirementIntent, AssignmentResult, BlockedCause (+14 more)

### Community 60 - "TimeBook.tsx"
Cohesion: 0.09
Nodes (40): TelemetryReport, displayAgentTask(), LiveAgentTask(), Props, RunningTask(), text(), AzureBuild, src_shared_liveanchor (+32 more)

### Community 61 - ".save"
Cohesion: 0.24
Nodes (23): BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue(), readIssues(), commentDecision() (+15 more)

### Community 62 - "retrospective-subject.ts"
Cohesion: 0.17
Nodes (16): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+8 more)

### Community 63 - "remove-candidate.ts"
Cohesion: 0.16
Nodes (19): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot() (+11 more)

### Community 64 - "knowledge-views.ts"
Cohesion: 0.22
Nodes (13): knowledgeActivity(), knowledgeActivityPage(), KnowledgeContext, knowledgeSnapshot(), officeKnowledgeSnapshot(), lessonForProject(), bounded(), committedKnowledgeMap() (+5 more)

### Community 65 - "time-scope.ts"
Cohesion: 0.13
Nodes (31): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), server_telemetry_billable_work_issue_key, isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence() (+23 more)

### Community 66 - "effects.ts"
Cohesion: 0.20
Nodes (10): featureById(), featureEffectGate(), reconcilePublication(), uncertainPublications(), reserveIdentity(), FeatureWorkflow, EffectOperation, EffectUncertainError (+2 more)

### Community 67 - "enrollment-gate.ts"
Cohesion: 0.32
Nodes (14): bindFeature(), currentApproval(), featureGate(), predecessorComplete(), automaticIntakeWait(), recoveryHeld(), deliveryPreflight, handoffBinding() (+6 more)

### Community 68 - "offices.ts"
Cohesion: 0.10
Nodes (13): ref_smol_toml, QuestionNotifications, leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), file, project (+5 more)

### Community 69 - "rootArtifact"
Cohesion: 0.17
Nodes (24): interruptedImplementation(), allowed, continuationNativeReview(), continuationReviewArtifacts(), continuationWorkerProof(), negativeWorker(), savedNegativeContinuationReview(), ContinuationDecision (+16 more)

### Community 70 - "supersedingDelivery"
Cohesion: 0.29
Nodes (10): syncOutbox(), finishSupersededReadback(), projectSlackDeliveries(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint(), slackRequestSettled() (+2 more)

### Community 71 - "run-accounting.ts"
Cohesion: 0.05
Nodes (68): BoundedRead, done(), readBoundedNoFollow(), reasonOf(), EvidenceOutcome, backfillClaudeCost(), CompletionReader, add() (+60 more)

### Community 72 - "jira-time.ts"
Cohesion: 0.15
Nodes (18): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+10 more)

### Community 73 - "checkpoint-completion.ts"
Cohesion: 0.28
Nodes (5): BrainStatusSchema, identity, coverageSchema, followupSchema, verified

### Community 74 - "node-visuals.ts"
Cohesion: 0.20
Nodes (13): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+5 more)

### Community 75 - "MaintenanceRun"
Cohesion: 0.26
Nodes (10): checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), repeatedVendorReviewBlock(), stoppedInVendorReview(), maintenanceSuperseded(), REOBSERVED, ReconciliationRequest (+2 more)

### Community 76 - "goal-reporting.ts"
Cohesion: 0.15
Nodes (16): GitHubMonitor, githubPRDescription(), azureGoalFacts(), azurePRDescription(), boundedEvidence(), collectAzureGoalDocuments(), EvidenceStore, GOAL_EVIDENCE_LIMITS (+8 more)

### Community 77 - "create-candidate.ts"
Cohesion: 0.31
Nodes (9): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+1 more)

### Community 78 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 79 - "GitHubIssuePublisher"
Cohesion: 0.19
Nodes (7): FeaturePublisher, PublicationReceipt, GitHubIssuePublisher, number(), same(), FeatureManifestItem, FeatureOperation

### Community 80 - "ledger.ts"
Cohesion: 0.41
Nodes (8): investigationCandidates(), investigationId(), investigationFollowUps(), investigationResolution(), syncInvestigations(), notifyHelperResolution(), requeueInvestigationEvidence(), retriedReadResolution()

### Community 81 - "TicketJob"
Cohesion: 0.14
Nodes (24): moveLane(), ProjectProgress, harnessCloseout(), PASSING, verifyMergeActions(), harnessEffect, assertDeliveryMayMutate(), runHarnessStage() (+16 more)

### Community 82 - "delivery-repairs.ts"
Cohesion: 0.13
Nodes (30): namedRepairIds(), stoppedBasePackageInstruction(), adoptedReviewCandidate(), ciCheckout(), finishCISetup(), verifyCIHooks(), CIFailure, guardCIRepair() (+22 more)

### Community 83 - "report.ts"
Cohesion: 0.25
Nodes (14): TimeLedgerState, Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked() (+6 more)

### Community 84 - "preferences-store.ts"
Cohesion: 0.17
Nodes (10): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS (+2 more)

### Community 85 - "blocker-followups.ts"
Cohesion: 0.14
Nodes (24): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), readBackConversations(), handoff(), reconcileBlockerFollowups(), improvementIntakeGate(), captureLearning() (+16 more)

### Community 86 - "capture-session-clone.py"
Cohesion: 0.15
Nodes (10): ctypes, errno, importlib_util, json, os, pathlib, Copy a coherent macOS clone of inherited reader fd3 to anonymous target fd4. No…, Read-only protocol adapter for the installed review helper. No model dispatch. (+2 more)

### Community 87 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (10): ref_react_three_drei, ref_react_three_fiber, ref_three_stdlib, CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility (+2 more)

### Community 88 - "recovery-ledger.ts"
Cohesion: 0.22
Nodes (14): closeoutRequestResolved(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), preparationRequestResolved(), publishedDraftConflictUnresolved(), scopeRepairRequestResolved(), stoppedBaseHandoffResolved(), stoppedBaseReassessmentReady() (+6 more)

### Community 89 - "evidence.ts"
Cohesion: 0.36
Nodes (6): investigationEvidence(), officeSource(), LaunchPolicy, launchPolicyFacts(), LaunchPolicyReceipt, lifecycleFacts()

### Community 90 - "it-agent.ts"
Cohesion: 0.60
Nodes (3): itAgent(), itDiagnostics(), Agent

### Community 91 - "github-check-selection.ts"
Cohesion: 0.21
Nodes (18): checksFailed(), checksPassed(), checksPending(), CurrentChecksWait, currentMergeChecks(), pass(), pending(), requireThat() (+10 more)

### Community 92 - "QuestionStepper.tsx"
Cohesion: 0.19
Nodes (18): FeatureQuestionProjection, OutboxQuestionRound(), send(), draftKey(), readDraft(), saveDraft(), QuestionRound(), nextQuestion() (+10 more)

### Community 93 - "shared.ts"
Cohesion: 0.13
Nodes (18): completedPRReviews(), eligible(), mergedByOwner(), ownerSettles(), retireExternalDeliveries(), settledExternalRepair(), PackedPublicationRepair, BoardUpdate (+10 more)

### Community 94 - "OfficeConfigView.tsx"
Cohesion: 0.52
Nodes (5): loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView(), OfficeConfigSummary

### Community 95 - "github-readiness.ts"
Cohesion: 0.11
Nodes (44): resume(), resumeProviderReviews(), APPROACH_GUIDANCE, reviewInstructions(), deliveryTask(), DeliveryTaskInput, closeoutReceipt(), hasUncertainEffects() (+36 more)

### Community 96 - "candidate-child-context.ts"
Cohesion: 0.60
Nodes (5): advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat()

### Community 97 - "command"
Cohesion: 0.11
Nodes (10): correlatedBuild(), observe(), observeParked(), parkedReadError, CommandRegistry, CommandScope, inside(), RegisteredCommand (+2 more)

### Community 98 - "ownedPath"
Cohesion: 0.31
Nodes (8): Candidate, recordedPush(), assertHistoricalArtifactPath(), HistoricalArtifactPath, Owner, within(), ownedPath(), retiredInstallationAlias()

### Community 99 - "admit-improvement.ts"
Cohesion: 0.25
Nodes (13): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+5 more)

### Community 100 - "knowledge.ts"
Cohesion: 0.09
Nodes (28): SUBJECT, Kind, RetrospectiveResult, RetrospectiveResultSchema, Stage, BlockerFollowup, ImprovementGrant, KnowledgeRetry (+20 more)

### Community 101 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (6): ref_mammoth, ref_pdfjs_dist, bounded(), extract(), fail(), [path,kind]

### Community 102 - "cec/issue-publication.ts"
Cohesion: 0.20
Nodes (12): CommentPage, commentReadback(), Assignment, Content, Transition, JiraOperations, plain(), unpack() (+4 more)

### Community 105 - "ITFollowUps.tsx"
Cohesion: 0.67
Nodes (4): itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps()

### Community 107 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 114 - "brain-maintenance.ts"
Cohesion: 0.26
Nodes (10): completeNativeCheckpoint(), BRAIN_DEPENDENCY_MERGES, BrainResult, capped(), queueMaintenanceNotice(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance() (+2 more)

### Community 116 - "createConstellation"
Cohesion: 0.19
Nodes (5): ConstellationRuntime, createConstellation(), enter(), finishTap(), move()

### Community 117 - "discovery-recovery.ts"
Cohesion: 0.27
Nodes (10): Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership, rawHash() (+2 more)

### Community 118 - "maintenancePolicies"
Cohesion: 0.33
Nodes (5): maintenancePolicies(), BrainMaintenance, easternDate(), weeklyDue(), unverifiedPriorRunNote()

### Community 120 - "pre-push-boundary.ts"
Cohesion: 0.43
Nodes (5): Event, one(), prePushRejection(), PushIdentity, settledPushBoundary()

## Knowledge Gaps
- **490 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+485 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 632 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `github-delivery.ts`, `closeout-recovery.ts`, `features/commands.ts`, `digest`, `coordination.ts`, `requests.ts`, `session-bridge.ts`, `workKey`, `cec/workflow.ts`, `Ticket`, `publish-pr.ts`, `currentAssignment`, `scheduled-captures.ts`, `.transaction`, `features.ts`, `OfficeSnapshot`, `agents.ts`, `harnessDelivers`, `it-specialist.ts`, `maintenance/maintenance.ts`, `run-retrospective.ts`, `record-trigger.ts`, `ref_zod`, `demand-facts.ts`, `notifications.ts`, `ref_node_crypto`, `Effects`, `sanitize`, `.emit`, `Role`, `lesson-selection.ts`, `artifact`, `source-amendment.ts`, `scheduled-work.ts`, `assignments.ts`, `ticket-evidence.ts`, `assignment-poll.ts`, `run.ts`, `cost-ledger.ts`, `candidate.ts`, `accept-stage-result.ts`, `config.ts`, `weekly-rollup.ts`, `daily-cto.ts`, `.save`, `retrospective-subject.ts`, `remove-candidate.ts`, `knowledge-views.ts`, `time-scope.ts`, `effects.ts`, `enrollment-gate.ts`, `offices.ts`, `rootArtifact`, `supersedingDelivery`, `run-accounting.ts`, `jira-time.ts`, `checkpoint-completion.ts`, `goal-reporting.ts`, `create-candidate.ts`, `ledger.ts`, `TicketJob`, `delivery-repairs.ts`, `blocker-followups.ts`, `evidence.ts`, `shared.ts`, `github-readiness.ts`, `candidate-child-context.ts`, `command`, `ownedPath`, `admit-improvement.ts`, `cec/issue-publication.ts`, `brain-maintenance.ts`, `discovery-recovery.ts`?**
  _High betweenness centrality (0.113) - this node is a cross-community bridge._
- **Why does `workKey()` connect `workKey` to `github-delivery.ts`, `closeout-recovery.ts`, `features/commands.ts`, `digest`, `coordination.ts`, `requests.ts`, `publish-pr.ts`, `currentAssignment`, `notifications.ts`, `Effects`, `Role`, `artifact`, `source-amendment.ts`, `scheduled-work.ts`, `Store`, `assignment-poll.ts`, `accept-stage-result.ts`, `work.ts`, `remove-candidate.ts`, `effects.ts`, `TicketJob`, `evidence.ts`, `shared.ts`, `github-readiness.ts`, `discovery-recovery.ts`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `Role` connect `Role` to `github-delivery.ts`, `Inspector.tsx`, `cec/workflow.ts`, `Ticket`, `currentAssignment`, `OfficeSnapshot`, `App.tsx`, `agents.ts`, `PeoplePanel.tsx`, `maintenance/maintenance.ts`, `ref_zod`, `outbox.ts`, `.emit`, `Conversation.tsx`, `Store`, `OfficeScene.tsx`, `accept-stage-result.ts`, `work.ts`, `retrospective-subject.ts`, `run-accounting.ts`, `scene-motion.ts`, `TicketJob`, `shared.ts`, `github-readiness.ts`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _490 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `github-delivery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.061955965181771634 - nodes in this community are weakly interconnected._
- **Should `closeout-recovery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07740112994350283 - nodes in this community are weakly interconnected._
- **Should `features/commands.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08701923076923077 - nodes in this community are weakly interconnected._