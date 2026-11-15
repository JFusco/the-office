# Graph Report - office-simple-qa-handoff-nov15  (2026-11-15)

## Corpus Check
- 817 files · ~332,527 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4078 nodes · 19042 edges · 108 communities
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 619 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7b834285`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- github-delivery.ts
- accept-stage-result.ts
- .save
- ref_node_path
- Store
- Inspector.tsx
- ref_react
- agents.ts
- artifact
- Button
- knowledge.ts
- ref_node_crypto
- source-amendment.ts
- shared.ts
- assignments.ts
- index.ts
- .transaction
- outbox.ts
- publish-pr.ts
- workKey
- worker-runtime.ts
- scheduled-captures.ts
- currentAssignment
- github-readiness.ts
- App.tsx
- cec/workflow.ts
- requests.ts
- features.ts
- digest
- maintenance/maintenance.ts
- index.tsx
- TimeBook.tsx
- run.ts
- run-retrospective.ts
- .emit
- scheduled-work.ts
- cost-ledger.ts
- blocker-followups.ts
- config.ts
- ref_zod
- azure.ts
- record-trigger.ts
- ticket-evidence.ts
- store.ts
- QuestionStepper.tsx
- dependency-bots/adopt.ts
- sanitize
- coordination.ts
- run-accounting.ts
- OfficeScene.tsx
- github/issue-publication.ts
- demand-facts.ts
- Goals.tsx
- retrospective-subject.ts
- jira-time.ts
- assignment-poll.ts
- StageResult
- scheduler.ts
- service-health.ts
- time-scope.ts
- harnessEffect
- Coordinator
- weekly-rollup.ts
- ControlStore
- it-specialist.ts
- useOfficePreferences.ts
- telemetry.ts
- work.ts
- constellation-runtime.ts
- session-context-file.ts
- tracking-issue.ts
- lesson-selection.ts
- intent.ts
- JiraIssuePublisher
- inspect-closed-plan.ts
- contract.ts
- admit-improvement.ts
- control-store.ts
- session-bridge.ts
- codex-rollout.ts
- daily-cto.ts
- node-visuals.ts
- Offices
- fact-bounds.ts
- install-service.mjs
- report.ts
- scene-motion.ts
- learning-events.ts
- claude-session-context.ts
- capture-session-clone.py
- RoomCamera.tsx
- SessionBridge
- createConstellation
- session-scope.ts
- stopped-base-provider.ts
- leadership.ts
- command-registry.ts
- extract-worker.mjs
- checkpoint-completion.ts
- retire-history.ts
- office-qa-handoff.ts
- OfficeConfigView.tsx
- pre-push-boundary.ts
- run-evidence.ts
- office-state-view.ts
- live-reach.ts
- handover-cms.ts
- highestStableAtLeast

## God Nodes (most connected - your core abstractions)
1. `Store` - 361 edges
2. `TicketJob` - 176 edges
3. `digest()` - 165 edges
4. `artifact()` - 129 edges
5. `GitHubDelivery` - 122 edges
6. `command()` - 113 edges
7. `workKey()` - 101 edges
8. `currentAssignment()` - 88 edges
9. `cx()` - 88 edges
10. `Button` - 84 edges

## Surprising Connections (you probably didn't know these)
- `apply()` --indirect_call--> `note()`  [INFERRED]
  src/conversations/OutboxSavedImplementation.tsx → server/cec/parking/resume-parked.ts
- `DeliverySlot` --references--> `Role`  [EXTRACTED]
  server/office/projects.ts → src/shared.ts
- `projectOutbox()` --calls--> `isSavedPlanFollowup()`  [EXTRACTED]
  server/conversations/outbox.ts → src/conversations/saved-plan-followup.ts
- `projectOutbox()` --calls--> `deferredPickup()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/pickup-state.ts
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

## Communities (108 total, 0 thin omitted)

### Community 0 - "github-delivery.ts"
Cohesion: 0.05
Nodes (80): containedFile(), removeAdoptedClone(), namedRepairIds(), BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction(), dependabotReviewGuidance() (+72 more)

### Community 1 - "accept-stage-result.ts"
Cohesion: 0.06
Nodes (99): park(), acceptStageResult(), METADATA_FINDING, mergeAuthorized(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration() (+91 more)

### Community 2 - ".save"
Cohesion: 0.06
Nodes (62): correlatedBuild(), jiraCollection(), BLOCKED, findComment(), LiveIssue, readIssue(), readIssues(), Execute (+54 more)

### Community 3 - "ref_node_path"
Cohesion: 0.06
Nodes (69): ref_node_fs, ref_node_os, ref_node_path, ref_node_util, GitRead, nativeGitRead(), patchArgs, savedImplementation() (+61 more)

### Community 4 - "Store"
Cohesion: 0.05
Nodes (26): CommentPage, commentReadback(), JiraOperations, plain(), jiraRecord(), unpack(), enableNightly(), metadataDigest() (+18 more)

### Community 5 - "Inspector.tsx"
Cohesion: 0.10
Nodes (67): blockedSummary(), itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps(), ServiceHealthPanel(), followUp(), labels (+59 more)

### Community 6 - "ref_react"
Cohesion: 0.07
Nodes (60): ref_react, ref_react_markdown, ref_remark_gfm, ref_yaml, KnowledgeActivity, KnowledgeActivityPage, KnowledgeEdge, KnowledgeMap (+52 more)

### Community 7 - "agents.ts"
Cohesion: 0.06
Nodes (54): implementationWorkerContext(), IntakeBinding, intakeEnumeration(), intakeMembership(), cecPrompt(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt() (+46 more)

### Community 8 - "artifact"
Cohesion: 0.08
Nodes (69): reported, Scope, advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat(), assertPostConflictFiles() (+61 more)

### Community 9 - "Button"
Cohesion: 0.07
Nodes (53): Conversation(), LessonDecisionAction, lessonDecisionState(), readLessonDecision(), Outbox(), ctoInputFailure(), OutboxCTOInput(), recover() (+45 more)

### Community 10 - "knowledge.ts"
Cohesion: 0.05
Nodes (59): ref_node_stream, ref_node_timers, args, [cmd,...rawArgs], commands, key, projectIndex, Accepted (+51 more)

### Community 11 - "ref_node_crypto"
Cohesion: 0.08
Nodes (52): ref_node_crypto, approveFeature(), featureById(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), artifactPath() (+44 more)

### Community 12 - "source-amendment.ts"
Cohesion: 0.07
Nodes (66): ref_node_async_hooks, adoptCandidate(), approvedText(), assert(), AMENDMENT_REVIEW_PROOF, amendmentInstruction(), amendmentIssueSha256(), authorizeSourceAmendment() (+58 more)

### Community 13 - "shared.ts"
Cohesion: 0.07
Nodes (58): Admission, PackedPublicationRepair, Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+50 more)

### Community 14 - "assignments.ts"
Cohesion: 0.07
Nodes (36): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, CommittedBrain (+28 more)

### Community 15 - "index.ts"
Cohesion: 0.08
Nodes (48): ref_hono_node_server, ref_node_http, ref_vite, implementationPreview(), implementationContinuationRoute(), intakeLocation(), qaPlanRetryRoute(), close() (+40 more)

### Community 16 - ".transaction"
Cohesion: 0.09
Nodes (39): featureItemComplete(), reconcileFeatureCompletion(), discoveryPrompt(), planPrompt(), readEvidence(), helperTelemetry(), DELAYS, MAX_EXECUTIONS (+31 more)

### Community 17 - "outbox.ts"
Cohesion: 0.07
Nodes (45): ctoInputRecovered(), conversationResolved(), projectOutbox(), compactSteps(), knowledgeOutbox(), checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup() (+37 more)

### Community 18 - "publish-pr.ts"
Cohesion: 0.08
Nodes (49): accounting, DeliverySubject, nonDelivery, originalReads, draftReadHeadMatches(), assertDraftClaimHistory(), linkDraftIssue(), protectedOriginalClaim() (+41 more)

### Community 19 - "workKey"
Cohesion: 0.07
Nodes (49): resumeLinkedDelivery(), completedPRReviews(), continuationScope(), Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput (+41 more)

### Community 20 - "worker-runtime.ts"
Cohesion: 0.06
Nodes (45): intakeJql(), projectListScope(), candidateWorkspaceEnvironment(), AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), assignmentSubject(), LessonSelection, catalogLine() (+37 more)

### Community 21 - "scheduled-captures.ts"
Cohesion: 0.15
Nodes (45): createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest, captureRequests() (+37 more)

### Community 22 - "currentAssignment"
Cohesion: 0.10
Nodes (39): deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), requireDeliveryAuthority(), deliveryIntakeBlocker(), gateRegisteredDelivery(), resolveDeliveryWork(), assertDeliveryMayMutate() (+31 more)

### Community 23 - "github-readiness.ts"
Cohesion: 0.10
Nodes (42): findingsBlock(), observe(), automationMergePolicy(), observeAutomationMerge(), checksFailed(), checksPassed(), checksPending(), CurrentChecksWait (+34 more)

### Community 24 - "App.tsx"
Cohesion: 0.06
Nodes (45): ref_lucide_react, ref_motion, ref_react_dom, BrainDrawer(), themeColor, App(), BrainWorkspace, CONNECTION (+37 more)

### Community 25 - "cec/workflow.ts"
Cohesion: 0.08
Nodes (45): applyIntakeObservation(), checkMail(), drainMail(), requestMail(), parksInJira(), resume(), MISSING_INTAKE, reconcileMailbox() (+37 more)

### Community 26 - "requests.ts"
Cohesion: 0.10
Nodes (48): DeliveryAuthorityInput, closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2 (+40 more)

### Community 27 - "features.ts"
Cohesion: 0.09
Nodes (40): Assignment, Content, jiraText(), Transition, descriptionPreimage(), plain(), commandFeature(), reviewQuestions() (+32 more)

### Community 28 - "digest"
Cohesion: 0.14
Nodes (39): activeEffectId(), admitPRMetadata(), assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema, savedMetadataAssessment(), validateSaved() (+31 more)

### Community 29 - "maintenance/maintenance.ts"
Cohesion: 0.08
Nodes (34): ApproachSchema, maintenancePolicies(), completeNativeCheckpoint(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice() (+26 more)

### Community 30 - "index.tsx"
Cohesion: 0.12
Nodes (40): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS, PickupForm(), ProjectForms() (+32 more)

### Community 31 - "TimeBook.tsx"
Cohesion: 0.10
Nodes (39): TelemetryReport, AzureBuild, src_shared_liveanchor, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens() (+31 more)

### Community 32 - "run.ts"
Cohesion: 0.10
Nodes (33): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationCandidates(), investigationId(), investigationEvidence(), investigationFollowUps(), INVOCATION_SOURCE_REFS, invocationSource() (+25 more)

### Community 33 - "run-retrospective.ts"
Cohesion: 0.10
Nodes (38): acceptRetrospective(), BLOCKING, blockingTrigger, isBlocking(), brainOverlap, brainOverlapQuery(), clip(), fits() (+30 more)

### Community 34 - ".emit"
Cohesion: 0.11
Nodes (32): decideImplementation(), requestQAPlanRetry(), configureChannelNotices(), configureNotices(), reconcileNoticeConfirmations(), retryRecipientLookup(), recoverCTOInput(), PrerequisitesSchema (+24 more)

### Community 35 - "scheduled-work.ts"
Cohesion: 0.09
Nodes (33): deliverySlot(), packed165SetupReady(), metadataRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), legacy, requestPriority() (+25 more)

### Community 36 - "cost-ledger.ts"
Cohesion: 0.12
Nodes (33): server_telemetry_billable_work_issue_key, captureCost(), server_telemetry_cost_entries_costcoveragesummary, costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled() (+25 more)

### Community 37 - "blocker-followups.ts"
Cohesion: 0.13
Nodes (27): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), ITContext (+19 more)

### Community 38 - "config.ts"
Cohesion: 0.15
Nodes (27): ref_node_url, continueImplementation(), dispatchNightly(), drainDelivery(), requestDelivery(), startPilot(), OfficeQAHandoffInput, eligibility() (+19 more)

### Community 39 - "ref_zod"
Cohesion: 0.09
Nodes (20): ref_zod, ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+12 more)

### Community 40 - "azure.ts"
Cohesion: 0.11
Nodes (29): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+21 more)

### Community 41 - "record-trigger.ts"
Cohesion: 0.12
Nodes (34): LEARNING_BASELINES, clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates(), maintenanceCompletedId(), maintenanceKey(), visibleMaintenanceTriggerIds() (+26 more)

### Community 42 - "ticket-evidence.ts"
Cohesion: 0.14
Nodes (27): assetDownloader(), attachmentKind(), evidenceDirectory(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS, EvidenceAttachment (+19 more)

### Community 43 - "store.ts"
Cohesion: 0.10
Nodes (18): publishFeature(), QuestionNotifications, reconcilePublication(), uncertainPublications(), reserveIdentity(), queueLessonIssueCheck(), queueImprovements(), systemClock (+10 more)

### Community 44 - "QuestionStepper.tsx"
Cohesion: 0.13
Nodes (26): FeatureHarnessOption, FeatureOption, FeatureQuestion, FeatureQuestionProjection, OutboxQuestionRound(), send(), draftKey(), readDraft() (+18 more)

### Community 45 - "dependency-bots/adopt.ts"
Cohesion: 0.14
Nodes (27): Execute, adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR, openDependabotPulls() (+19 more)

### Community 46 - "sanitize"
Cohesion: 0.13
Nodes (23): assertConversationReadback(), syncOutbox(), slackVerifyPrompt(), comparableSlackText(), finishSupersededReadback(), projectSlackDeliveries(), settleRequestedSlackReplacement(), Input (+15 more)

### Community 47 - "coordination.ts"
Cohesion: 0.13
Nodes (28): MergeNotifications, admit(), IntakeContext, WAIT_STATUSES, compatible(), dependencyCompletionKey(), dependencyEligibility(), DependencyStores (+20 more)

### Community 48 - "run-accounting.ts"
Cohesion: 0.13
Nodes (29): BoundedRead, done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf(), CompletionReader, codexHome() (+21 more)

### Community 49 - "OfficeScene.tsx"
Cohesion: 0.17
Nodes (33): Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk(), ElevatorStage() (+25 more)

### Community 50 - "github/issue-publication.ts"
Cohesion: 0.16
Nodes (10): FeaturePublisher, PublicationReceipt, Assign, Board, Content, GitHubIssuePublisher, number(), same() (+2 more)

### Community 51 - "demand-facts.ts"
Cohesion: 0.14
Nodes (21): clip(), DEMAND_LIMIT, demandFacts(), key(), LessonKey, notes(), clip(), MISSED_QUERY_LIMIT (+13 more)

### Community 52 - "Goals.tsx"
Cohesion: 0.13
Nodes (22): SendMessage, CTOReview(), goalState, DailyCTO(), reportDate(), reviewStatus, GoalList(), card() (+14 more)

### Community 53 - "retrospective-subject.ts"
Cohesion: 0.11
Nodes (23): deliveryMetrics(), median(), ARTIFACT_LIMIT, clip(), LEDGER_STEPS, MAINTENANCE_LIMIT, maintenanceFacts(), maintenanceSubject() (+15 more)

### Community 54 - "jira-time.ts"
Cohesion: 0.14
Nodes (21): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+13 more)

### Community 55 - "assignment-poll.ts"
Cohesion: 0.14
Nodes (21): ChannelSettings, notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR, plainSlackText(), section() (+13 more)

### Community 56 - "StageResult"
Cohesion: 0.17
Nodes (20): Execute, installDependencies(), major(), harnessCloseout(), PASSING, verifyMergeActions(), HarnessControl, withHarnessWork() (+12 more)

### Community 57 - "scheduler.ts"
Cohesion: 0.15
Nodes (14): ROLES, officeCapacity, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch() (+6 more)

### Community 58 - "service-health.ts"
Cohesion: 0.13
Nodes (14): assignmentDiagnostics(), diagnosticContext(), listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes (+6 more)

### Community 59 - "time-scope.ts"
Cohesion: 0.18
Nodes (23): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), midnight(), TicketDay (+15 more)

### Community 60 - "harnessEffect"
Cohesion: 0.26
Nodes (21): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), ProjectCard, projectCards(), projectGraphql() (+13 more)

### Community 61 - "Coordinator"
Cohesion: 0.08
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 62 - "weekly-rollup.ts"
Cohesion: 0.16
Nodes (23): learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), retire(), RollupResult, harperFolder() (+15 more)

### Community 63 - "ControlStore"
Cohesion: 0.16
Nodes (7): DailyCTO, EvidenceRequestConflict, Briefing, saveReviewBriefing(), ControlStore, OfficeKnowledge, DailyCTOReport

### Community 64 - "it-specialist.ts"
Cohesion: 0.18
Nodes (18): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot() (+10 more)

### Community 65 - "useOfficePreferences.ts"
Cohesion: 0.11
Nodes (19): PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, acceptPreferences(), PreferenceCandidate, PreferenceState (+11 more)

### Community 66 - "telemetry.ts"
Cohesion: 0.12
Nodes (22): CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL, Rates (+14 more)

### Community 67 - "work.ts"
Cohesion: 0.12
Nodes (20): BLOCKED_CAUSES, blockedCauses(), projectReadiness(), ProjectReadiness, AssignmentResult, BlockedCause, CompletionCondition, Continuation (+12 more)

### Community 68 - "constellation-runtime.ts"
Cohesion: 0.15
Nodes (17): ref_3d_force_graph, ref_three, CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point (+9 more)

### Community 69 - "session-context-file.ts"
Cohesion: 0.21
Nodes (13): ref_node_perf_hooks, contextFoldPrefix, SessionContextCheckpoint, captureSessionContextClone(), ContextReadPhase, SessionContextDeadline, sessionContextFile(), ContextReadChanged (+5 more)

### Community 70 - "tracking-issue.ts"
Cohesion: 0.17
Nodes (19): readBackOrThrow(), retryRead(), ensureTrackingIssue(), findTrackingIssue(), ownTracking(), TrackingIssue, trackingIssueBody(), trackingIssueTitle() (+11 more)

### Community 71 - "lesson-selection.ts"
Cohesion: 0.14
Nodes (20): INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), MAINTENANCE, MAX_LESSONS, normalPath() (+12 more)

### Community 72 - "intent.ts"
Cohesion: 0.18
Nodes (15): ContinuationIO, nativeIO, assertOwnership(), ImplementationDecision, OwnershipRead, assertCandidateIdle(), consumeQAPlanRetry(), continueUnsealedQA() (+7 more)

### Community 73 - "JiraIssuePublisher"
Cohesion: 0.29
Nodes (3): JiraIssuePublisher, keyOf(), publicationDescription()

### Community 74 - "inspect-closed-plan.ts"
Cohesion: 0.15
Nodes (15): Document, isAccessOnlyPlan(), settledAccessOnlyState(), closedReadonlyPlan(), Document, continueAccessOnlyPlan(), entryExists(), entryExists() (+7 more)

### Community 75 - "contract.ts"
Cohesion: 0.19
Nodes (13): NOTIFY_HELPER, At, errno, GroupInventory, GroupProbe, LifecycleDiagnostic, Phase, Pid (+5 more)

### Community 76 - "admit-improvement.ts"
Cohesion: 0.23
Nodes (16): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+8 more)

### Community 77 - "control-store.ts"
Cohesion: 0.18
Nodes (10): ref_node_sqlite, Clock, applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, statementCache(), initialSnapshot() (+2 more)

### Community 78 - "session-bridge.ts"
Cohesion: 0.19
Nodes (14): ref_ws, codexDaemonProcesses(), accountCodexProcesses(), codexProcessInventory, DesktopSessions, unaccountedProcesses(), idleExecServers(), isExecServer() (+6 more)

### Community 79 - "codex-rollout.ts"
Cohesion: 0.16
Nodes (16): add(), CodexRequest, CodexRollout, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens() (+8 more)

### Community 80 - "daily-cto.ts"
Cohesion: 0.18
Nodes (14): evidenceRequestConflicts, dailyReviewPrompt(), GoalReport, queueGoalEvidenceRequest(), applyGoalReview(), DailyResultSchema, EvidenceRefSchema, FreshDailyResultSchema (+6 more)

### Community 81 - "node-visuals.ts"
Cohesion: 0.20
Nodes (13): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+5 more)

### Community 82 - "Offices"
Cohesion: 0.22
Nodes (3): mirrorOfficeKnowledge(), Offices, markCaptureStart()

### Community 83 - "fact-bounds.ts"
Cohesion: 0.25
Nodes (15): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+7 more)

### Community 84 - "install-service.mjs"
Cohesion: 0.12
Nodes (10): ref_node_child_process, ref_node_string_decoder, file, folder, logs, root, Read, extractDocument (+2 more)

### Community 85 - "report.ts"
Cohesion: 0.22
Nodes (15): TelemetryRow, TelemetrySync, Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount() (+7 more)

### Community 86 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 87 - "learning-events.ts"
Cohesion: 0.27
Nodes (10): improvementIntakeGate(), captureLearning(), learningDigest(), recordLearningOpportunity(), baselineLearning(), expireLearningPackets(), maintainLearning(), packetReferences() (+2 more)

### Community 88 - "claude-session-context.ts"
Cohesion: 0.23
Nodes (10): readTranscript, root, claudeSessionScope(), codexSessionContext(), readRollout, LiveSession, ContextProject, ContextReader (+2 more)

### Community 89 - "capture-session-clone.py"
Cohesion: 0.15
Nodes (10): ctypes, errno, importlib_util, json, os, pathlib, Copy a coherent macOS clone of inherited reader fd3 to anonymous target fd4. No…, Read-only protocol adapter for the installed review helper. No model dispatch. (+2 more)

### Community 90 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (10): ref_react_three_drei, ref_react_three_fiber, ref_three_stdlib, CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility (+2 more)

### Community 91 - "SessionBridge"
Cohesion: 0.23
Nodes (9): claudeSessionContext(), claudeSessions(), SessionBridge, completeSessionCoverage(), desktopCoverageGap(), knownActivity(), Report, unexplained() (+1 more)

### Community 92 - "createConstellation"
Cohesion: 0.19
Nodes (5): ConstellationRuntime, createConstellation(), enter(), finishTap(), move()

### Community 93 - "session-scope.ts"
Cohesion: 0.29
Nodes (8): retainSessionMessage(), SessionConversation, jiraCommandIssues(), scopeParser(), ScopeParserState, ScopeProject, sessionScopeParser(), siteHost()

### Community 94 - "stopped-base-provider.ts"
Cohesion: 0.38
Nodes (8): pinCourier, pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), discussion(), pages(), pullIdentity(), readStoppedBaseProviderContext(), reviewThreads()

### Community 95 - "leadership.ts"
Cohesion: 0.20
Nodes (8): DailyCTOBriefing, DailyCTOResult, DailyCTOSummary, DailyGoalUpdate, GoalEvidenceRef, GoalEvidenceRequest, GoalProgress, GoalStatus

### Community 96 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 97 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (6): ref_mammoth, ref_pdfjs_dist, bounded(), extract(), fail(), [path,kind]

### Community 98 - "checkpoint-completion.ts"
Cohesion: 0.28
Nodes (6): BrainStatusSchema, brainCheckpointCompletion(), coverageSchema, followupSchema, verified, reconcileCompletedCheckpoints()

### Community 99 - "retire-history.ts"
Cohesion: 0.36
Nodes (6): historicalRecordDigest(), Intent, records(), retireIncompleteHistory(), HistoryRetirement, HistoryRetirementIntent

### Community 100 - "office-qa-handoff.ts"
Cohesion: 0.29
Nodes (6): OfficeQAHandoff, OfficeQAHandoffInput, OfficeQAHandoffRequest, SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 101 - "OfficeConfigView.tsx"
Cohesion: 0.43
Nodes (6): loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView(), OfficeConfigSummary, errorText

### Community 102 - "pre-push-boundary.ts"
Cohesion: 0.43
Nodes (5): Event, one(), prePushRejection(), PushIdentity, settledPushBoundary()

### Community 103 - "run-evidence.ts"
Cohesion: 0.38
Nodes (5): comparable(), EvidenceOutcome, recordRunEvidence(), backfillClaudeCost(), RunAccounting

### Community 104 - "office-state-view.ts"
Cohesion: 0.60
Nodes (4): leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore()

### Community 105 - "live-reach.ts"
Cohesion: 0.47
Nodes (5): GIT_NETWORK, LIVE_PROVIDERS, liveReach(), networkUrl(), remoteUrls()

### Community 106 - "handover-cms.ts"
Cohesion: 0.40
Nodes (4): ref_smol_toml, file, project, root

### Community 107 - "highestStableAtLeast"
Cohesion: 0.83
Nodes (3): compare(), highestStableAtLeast(), parts()

## Knowledge Gaps
- **497 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+492 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 635 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `github-delivery.ts`, `accept-stage-result.ts`, `.save`, `ref_node_path`, `agents.ts`, `artifact`, `Button`, `knowledge.ts`, `ref_node_crypto`, `source-amendment.ts`, `assignments.ts`, `index.ts`, `.transaction`, `outbox.ts`, `publish-pr.ts`, `workKey`, `worker-runtime.ts`, `scheduled-captures.ts`, `currentAssignment`, `github-readiness.ts`, `cec/workflow.ts`, `requests.ts`, `features.ts`, `digest`, `maintenance/maintenance.ts`, `run.ts`, `run-retrospective.ts`, `.emit`, `scheduled-work.ts`, `cost-ledger.ts`, `blocker-followups.ts`, `config.ts`, `ref_zod`, `azure.ts`, `record-trigger.ts`, `ticket-evidence.ts`, `store.ts`, `dependency-bots/adopt.ts`, `sanitize`, `coordination.ts`, `run-accounting.ts`, `github/issue-publication.ts`, `demand-facts.ts`, `retrospective-subject.ts`, `jira-time.ts`, `assignment-poll.ts`, `scheduler.ts`, `service-health.ts`, `time-scope.ts`, `harnessEffect`, `weekly-rollup.ts`, `it-specialist.ts`, `tracking-issue.ts`, `lesson-selection.ts`, `intent.ts`, `inspect-closed-plan.ts`, `contract.ts`, `admit-improvement.ts`, `control-store.ts`, `session-bridge.ts`, `daily-cto.ts`, `Offices`, `learning-events.ts`, `SessionBridge`, `stopped-base-provider.ts`, `checkpoint-completion.ts`, `retire-history.ts`, `run-evidence.ts`, `office-state-view.ts`?**
  _High betweenness centrality (0.099) - this node is a cross-community bridge._
- **Why does `Role` connect `shared.ts` to `github-delivery.ts`, `accept-stage-result.ts`, `Inspector.tsx`, `agents.ts`, `Button`, `index.ts`, `outbox.ts`, `worker-runtime.ts`, `github-readiness.ts`, `App.tsx`, `maintenance/maintenance.ts`, `.emit`, `ref_zod`, `store.ts`, `run-accounting.ts`, `OfficeScene.tsx`, `retrospective-subject.ts`, `StageResult`, `scheduler.ts`, `service-health.ts`, `work.ts`, `scene-motion.ts`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `command()` connect `Store` to `github-delivery.ts`, `.save`, `ref_node_path`, `agents.ts`, `ref_node_crypto`, `assignments.ts`, `.transaction`, `publish-pr.ts`, `workKey`, `worker-runtime.ts`, `github-readiness.ts`, `requests.ts`, `features.ts`, `digest`, `maintenance/maintenance.ts`, `scheduled-work.ts`, `cost-ledger.ts`, `azure.ts`, `ticket-evidence.ts`, `coordination.ts`, `github/issue-publication.ts`, `jira-time.ts`, `assignment-poll.ts`, `StageResult`, `service-health.ts`, `harnessEffect`, `weekly-rollup.ts`, `it-specialist.ts`, `tracking-issue.ts`, `intent.ts`, `inspect-closed-plan.ts`, `contract.ts`, `session-bridge.ts`, `command-registry.ts`, `live-reach.ts`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _497 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `github-delivery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.04599226091763405 - nodes in this community are weakly interconnected._
- **Should `accept-stage-result.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05853128396211768 - nodes in this community are weakly interconnected._
- **Should `.save` be split into smaller, more focused modules?**
  _Cohesion score 0.05549450549450549 - nodes in this community are weakly interconnected._