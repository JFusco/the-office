# Graph Report - office-session-snapshot-nov13  (2026-11-13)

## Corpus Check
- 750 files · ~310,365 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3851 nodes · 18016 edges · 86 communities
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 583 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e5249af6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- github-delivery.ts
- Store
- dependency-bots/adopt.ts
- Inspector.tsx
- workKey
- ticket-evidence.ts
- cec/issue-publication.ts
- Role
- features/workflow.ts
- digest
- App.tsx
- agents.ts
- ref_node_path
- post-conflict-preparation.ts
- worker-runtime.ts
- reader.ts
- Button
- session-bridge.ts
- ControlStore
- currentAssignment
- maintenance/maintenance.ts
- conversations/conversations.ts
- run-retrospective.ts
- lesson-selection.ts
- scheduled-captures.ts
- features.ts
- index.ts
- mutedCopy
- shared.ts
- github-readiness.ts
- record-push.ts
- artifact
- assignments.ts
- PeoplePanel.tsx
- policy.ts
- .save
- requests.ts
- ServiceHealthPanel.tsx
- brain-maintenance.ts
- record-trigger.ts
- cost-ledger.ts
- source-amendment.ts
- constellation-runtime.ts
- index.tsx
- control-store.ts
- easternDay
- OfficeScene.tsx
- http/commands.ts
- ref_zod
- telemetry.ts
- run-accounting.ts
- Goals.tsx
- coordination.ts
- blocker-followups.ts
- jira-time.ts
- config.ts
- daily-cto.ts
- retrospective-subject.ts
- TimeBook.tsx
- assignment-poll.ts
- engine.ts
- knowledge.ts
- time-scope.ts
- knowledge-views.ts
- scene-motion.ts
- fact-bounds.ts
- normalize-question.ts
- leadership.ts
- admit-improvement.ts
- lessons-view.ts
- .emit
- node-visuals.ts
- stopped-base-validation.ts
- store.ts
- cost-totals.ts
- preferences-store.ts
- report.ts
- RoomCamera.tsx
- OutboxLessonDecision.tsx
- seeded-office-lessons.ts
- it-agent.ts
- codex-rollout.ts
- command-registry.ts
- extract-worker.mjs
- helper-evidence.py
- run-evidence.ts

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
- `DeliveryAuthorityInput` --references--> `HarnessRequest`  [EXTRACTED]
  server/delivery/harness/delivery-authority.ts → src/contracts/work.ts
- `LessonBrainOverlap` --references--> `Lesson`  [EXTRACTED]
  server/knowledge/lesson-brain-audit.ts → src/contracts/knowledge.ts
- `projectOutbox()` --calls--> `parkedProviderWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts
- `projectOutbox()` --calls--> `readinessWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts
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

## Communities (86 total, 0 thin omitted)

### Community 0 - "github-delivery.ts"
Cohesion: 0.04
Nodes (103): harnessCloseout(), PASSING, verifyMergeActions(), findingsBlock(), assertDeliveryMayMutate(), runHarnessStage(), HANDS_OFF_PROJECTS, handsOff() (+95 more)

### Community 1 - "Store"
Cohesion: 0.05
Nodes (38): ref_node_child_process, ref_node_crypto, ref_node_url, file, folder, logs, root, jiraText() (+30 more)

### Community 2 - "dependency-bots/adopt.ts"
Cohesion: 0.05
Nodes (90): initialManualStart(), Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard (+82 more)

### Community 3 - "Inspector.tsx"
Cohesion: 0.12
Nodes (60): Conversation(), Outbox(), SendMessage, OutboxMaintenanceStatus(), SlackDeliveryCard(), labels, ServiceHealthRow(), BlockerFollowups() (+52 more)

### Community 4 - "workKey"
Cohesion: 0.07
Nodes (63): completedPRReviews(), adoptCandidate(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related (+55 more)

### Community 5 - "ticket-evidence.ts"
Cohesion: 0.11
Nodes (33): ref_node_string_decoder, assetDownloader(), attachmentKind(), evidenceDirectory(), readEvidence(), storeEvidence(), blankEvidence(), CoverageState (+25 more)

### Community 6 - "cec/issue-publication.ts"
Cohesion: 0.08
Nodes (26): CommentPage, commentReadback(), Assignment, Content, JiraIssuePublisher, keyOf(), Transition, JiraOperations (+18 more)

### Community 7 - "Role"
Cohesion: 0.10
Nodes (25): ref_smol_toml, ROLES, file, project, root, DeliverySlot, officeCapacity, projectData() (+17 more)

### Community 8 - "features/workflow.ts"
Cohesion: 0.11
Nodes (28): approveFeature(), discoveryPrompt(), planPrompt(), document(), featureRoot(), DiscoverySchema, FeatureCommandSchema, HarnessCommand (+20 more)

### Community 9 - "digest"
Cohesion: 0.13
Nodes (44): ref_node_util, activeEffectId(), admitPRMetadata(), assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema, savedMetadataAssessment() (+36 more)

### Community 10 - "App.tsx"
Cohesion: 0.05
Nodes (67): ref_lucide_react, ref_motion, ref_react_dom, compactSteps(), BrainDrawer(), themeColor, App(), BrainWorkspace (+59 more)

### Community 11 - "agents.ts"
Cohesion: 0.06
Nodes (46): IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), intakeMembership(), projectListScope(), cecPrompt(), cecIntakePrompt() (+38 more)

### Community 12 - "ref_node_path"
Cohesion: 0.07
Nodes (64): ref_node_fs, ref_node_path, Execute, installDependencies(), major(), removeAdoptedClone(), namedRepairIds(), Check (+56 more)

### Community 13 - "post-conflict-preparation.ts"
Cohesion: 0.08
Nodes (59): assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), reconcileCompletedConflictDraft(), routeReadyPostConflictPublication(), verifyInitialDraftConflictPreparation() (+51 more)

### Community 14 - "worker-runtime.ts"
Cohesion: 0.07
Nodes (38): candidateWorkspaceEnvironment(), ApproachSchema, assignmentSubject(), lessonPurpose(), selectLessons(), catalogLine(), assertBriefingScope(), LOCAL_BINDINGS (+30 more)

### Community 15 - "reader.ts"
Cohesion: 0.10
Nodes (20): knowledgeActivity(), knowledgeActivityPage(), committedNotePage(), BrainGraph, BrainNote, BrainReader, CommittedBrain, GraphNode (+12 more)

### Community 16 - "Button"
Cohesion: 0.09
Nodes (49): ref_react, ref_react_markdown, ref_remark_gfm, ref_yaml, TicketPlanningAction(), Activity(), ActivityTimeline(), AssignmentKnowledge() (+41 more)

### Community 17 - "session-bridge.ts"
Cohesion: 0.07
Nodes (46): ref_ws, claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexDaemonProcesses(), accountCodexProcesses(), codexProcessInventory (+38 more)

### Community 18 - "ControlStore"
Cohesion: 0.20
Nodes (5): DailyCTO, Briefing, saveReviewBriefing(), ControlStore, DailyCTOReport

### Community 19 - "currentAssignment"
Cohesion: 0.13
Nodes (27): deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, requireDeliveryAuthority(), deliveryIntakeBlocker(), gateRegisteredDelivery(), resolveDeliveryWork() (+19 more)

### Community 20 - "maintenance/maintenance.ts"
Cohesion: 0.11
Nodes (24): maintenancePolicies(), captureMaintenanceStep(), BrainMaintenance, candidateOwner(), SETTLED, skipOwnedCandidate(), Skipped, skippedCandidateLedger() (+16 more)

### Community 21 - "conversations/conversations.ts"
Cohesion: 0.06
Nodes (50): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+42 more)

### Community 22 - "run-retrospective.ts"
Cohesion: 0.10
Nodes (40): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, blockingTrigger, brainOverlap, brainOverlapQuery() (+32 more)

### Community 23 - "lesson-selection.ts"
Cohesion: 0.10
Nodes (31): guidanceExcerpt(), digest(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, LessonSelection, lessonText() (+23 more)

### Community 24 - "scheduled-captures.ts"
Cohesion: 0.17
Nodes (40): enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest, captureRequests(), failCapture(), requestCapture() (+32 more)

### Community 25 - "features.ts"
Cohesion: 0.07
Nodes (62): commandFeature(), createFeature(), featureById(), mutation(), reviewQuestions(), assertFeatureDependencyOrder(), featureDependencyEdges(), key() (+54 more)

### Community 26 - "index.ts"
Cohesion: 0.04
Nodes (61): ref_hono_node_server, ref_node_http, ref_node_stream, ref_node_timers, ref_vite, args, [cmd,...rawArgs], commands (+53 more)

### Community 27 - "mutedCopy"
Cohesion: 0.18
Nodes (28): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS, PickupForm(), ProjectForms() (+20 more)

### Community 28 - "shared.ts"
Cohesion: 0.05
Nodes (51): conversationResolved(), projectOutbox(), knowledgeOutbox(), checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), repeatedVendorReviewBlock(), stoppedInVendorReview() (+43 more)

### Community 29 - "github-readiness.ts"
Cohesion: 0.11
Nodes (41): deliveryTask(), observe(), assertAutomationEffects(), automationMergePolicy(), observeAutomationMerge(), routeAutomationMerge(), checksPassed(), checksPending() (+33 more)

### Community 30 - "record-push.ts"
Cohesion: 0.14
Nodes (17): Event, one(), prePushRejection(), PushIdentity, Candidate, recordedPush(), settledPushBoundary(), At (+9 more)

### Community 31 - "artifact"
Cohesion: 0.06
Nodes (116): ref_node_os, containedFile(), closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment (+108 more)

### Community 32 - "assignments.ts"
Cohesion: 0.09
Nodes (29): assignmentKnowledge(), clip(), DEMAND_LIMIT, demandFacts(), DemandSection, key(), LessonKey, notes() (+21 more)

### Community 33 - "PeoplePanel.tsx"
Cohesion: 0.09
Nodes (45): label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+37 more)

### Community 34 - "policy.ts"
Cohesion: 0.17
Nodes (26): featureItemComplete(), reconcileFeatureCompletion(), currentApproval(), reserveReplacement(), stageBudget(), confirmBrief(), classifyFeatureFailure(), automaticEnabled() (+18 more)

### Community 35 - ".save"
Cohesion: 0.07
Nodes (63): correlatedBuild(), applyIntakeObservation(), BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue() (+55 more)

### Community 36 - "requests.ts"
Cohesion: 0.07
Nodes (53): accounting, DeliverySubject, nonDelivery, originalReads, HarnessControl, withHarnessWork(), CloseoutSupervisionProofRef, Envelope (+45 more)

### Community 37 - "ServiceHealthPanel.tsx"
Cohesion: 0.12
Nodes (31): TelemetryReport, ServiceHealthPanel(), followUp(), loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView(), OfficeConfigSummary (+23 more)

### Community 38 - "brain-maintenance.ts"
Cohesion: 0.11
Nodes (19): completeNativeCheckpoint(), BRAIN_DEPENDENCY_MERGES, BrainResult, BrainStatusSchema, identity, brainCheckpointCompletion(), coverageSchema, followupSchema (+11 more)

### Community 39 - "record-trigger.ts"
Cohesion: 0.10
Nodes (44): isBlocking(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences(), busyMaintenanceIds(), clip(), maintenanceBlockedId() (+36 more)

### Community 40 - "cost-ledger.ts"
Cohesion: 0.12
Nodes (33): captureCost(), server_telemetry_cost_entries_costcoveragesummary, costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress() (+25 more)

### Community 41 - "source-amendment.ts"
Cohesion: 0.06
Nodes (67): ref_node_async_hooks, DeliveryTaskInput, DISCOVERY_GUIDANCE, approvedText(), assert(), AMENDMENT_REVIEW_PROOF, amendmentIssueSha256(), authorizeSourceAmendment() (+59 more)

### Community 42 - "constellation-runtime.ts"
Cohesion: 0.10
Nodes (22): ref_3d_force_graph, ref_three, CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point (+14 more)

### Community 43 - "index.tsx"
Cohesion: 0.08
Nodes (36): FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), send(), phases, LinkedFeatures(), draftKey() (+28 more)

### Community 44 - "control-store.ts"
Cohesion: 0.14
Nodes (14): ref_node_sqlite, Clock, applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, statementCache(), initialSnapshot() (+6 more)

### Community 45 - "easternDay"
Cohesion: 0.19
Nodes (16): expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), dailyReviewDate(), reviewWeekday() (+8 more)

### Community 46 - "OfficeScene.tsx"
Cohesion: 0.16
Nodes (34): Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk(), ElevatorStage() (+26 more)

### Community 47 - "http/commands.ts"
Cohesion: 0.07
Nodes (49): ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR, plainSlackText() (+41 more)

### Community 48 - "ref_zod"
Cohesion: 0.08
Nodes (43): ref_zod, syncOutbox(), projectSlackDeliveries(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint(), slackRequestSettled() (+35 more)

### Community 49 - "telemetry.ts"
Cohesion: 0.10
Nodes (26): CodexRollout, CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL (+18 more)

### Community 50 - "run-accounting.ts"
Cohesion: 0.12
Nodes (30): BoundedRead, done(), readBoundedNoFollow(), readBoundedNoFollowSync(), reasonOf(), CompletionReader, codexHome(), createdAt() (+22 more)

### Community 51 - "Goals.tsx"
Cohesion: 0.11
Nodes (28): FeatureQuestionProjection, nextQuestion(), orderedQuestions(), questionKey(), QuestionDialogHost(), send(), suppress(), readSuppressed() (+20 more)

### Community 52 - "coordination.ts"
Cohesion: 0.07
Nodes (48): MergeNotifications, Admission, admit(), IntakeContext, WAIT_STATUSES, compatible(), dependencyCompletionKey(), dependencyEligibility() (+40 more)

### Community 53 - "blocker-followups.ts"
Cohesion: 0.07
Nodes (36): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), QuestionNotifications (+28 more)

### Community 54 - "jira-time.ts"
Cohesion: 0.14
Nodes (21): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+13 more)

### Community 55 - "config.ts"
Cohesion: 0.13
Nodes (22): deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), metadataRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), leadershipContext(), knowledgeEntries() (+14 more)

### Community 56 - "daily-cto.ts"
Cohesion: 0.13
Nodes (18): EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), applyGoalReview(), DailyResultSchema, EvidenceRefSchema, FreshDailyResultSchema, GoalEvidenceRequestSchema (+10 more)

### Community 57 - "retrospective-subject.ts"
Cohesion: 0.18
Nodes (18): maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject, SubjectStepResult, ticketSubject() (+10 more)

### Community 58 - "TimeBook.tsx"
Cohesion: 0.18
Nodes (19): AzureBuild, src_shared_liveanchor, lastWall, sample(), subscribe(), subscribers, useLiveClock(), liveBuildTiming() (+11 more)

### Community 59 - "assignment-poll.ts"
Cohesion: 0.07
Nodes (10): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), admitReadyCards(), resumeParked(), poll(), readAssignments(), coordination() (+2 more)

### Community 60 - "engine.ts"
Cohesion: 0.08
Nodes (20): checkMail(), drainMail(), requestMail(), dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), resume() (+12 more)

### Community 61 - "knowledge.ts"
Cohesion: 0.07
Nodes (39): deliveryMetrics(), median(), learningMetrics(), lessonBrainAudit, LessonBrainOverlap, BRAIN_SCOPE, SUBJECT, Kind (+31 more)

### Community 62 - "time-scope.ts"
Cohesion: 0.20
Nodes (22): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), ticketDayTotals(), captureTime() (+14 more)

### Community 63 - "knowledge-views.ts"
Cohesion: 0.20
Nodes (16): KnowledgeActivity, KnowledgeEdge, KnowledgeMap, KnowledgeNode, connectionSummary(), ConstellationView, DisplayNode, displayScene() (+8 more)

### Community 64 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 65 - "fact-bounds.ts"
Cohesion: 0.26
Nodes (14): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+6 more)

### Community 66 - "normalize-question.ts"
Cohesion: 0.27
Nodes (10): normalizeRound(), FeatureHarnessOption, FeatureOption, FeatureQuestion, FeatureRoundAuthor, folded(), normalizeQuestion(), optionId() (+2 more)

### Community 67 - "leadership.ts"
Cohesion: 0.20
Nodes (8): DailyCTOBriefing, DailyCTOResult, DailyCTOSummary, DailyGoalUpdate, GoalEvidenceRef, GoalEvidenceRequest, GoalProgress, GoalStatus

### Community 68 - "admit-improvement.ts"
Cohesion: 0.16
Nodes (21): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+13 more)

### Community 69 - "lessons-view.ts"
Cohesion: 0.23
Nodes (11): OfficeProposal, RetrospectiveRecord, WeeklyRollup, lessonsView, newest(), ROLLUP_ROWS, TRIGGER_LABEL, src_shared_officeknowledge (+3 more)

### Community 70 - ".emit"
Cohesion: 0.14
Nodes (18): channelNoticeAuthorized(), assertConversationReadback(), reconcileNoticeConfirmations(), comparableSlackText(), finishSupersededReadback(), settleRequestedSlackReplacement(), SlackMessages, SlackRequestSchema (+10 more)

### Community 71 - "node-visuals.ts"
Cohesion: 0.20
Nodes (13): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+5 more)

### Community 72 - "stopped-base-validation.ts"
Cohesion: 0.42
Nodes (8): continuationNativeReview(), assertStoppedBaseApproach(), stoppedBaseNextStage(), stoppedBasePackedCommands(), assertAcceptedFiles(), assertStoppedBaseMergeReady(), assertStoppedBaseValidation(), stoppedBaseStageProof()

### Community 73 - "store.ts"
Cohesion: 0.11
Nodes (24): publishFeature(), reconcilePublication(), GitHubOperations, validateGitHubIssue(), fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), improvementIntakeGate() (+16 more)

### Community 74 - "cost-totals.ts"
Cohesion: 0.32
Nodes (7): server_telemetry_billable_work_issue_key, awaitingEvidence(), boardUsd(), CaptureContext, inCostWindow(), TicketCost, ticketCosts()

### Community 75 - "preferences-store.ts"
Cohesion: 0.13
Nodes (15): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, acceptPreferences(), PreferenceCandidate (+7 more)

### Community 76 - "report.ts"
Cohesion: 0.29
Nodes (12): Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked(), row() (+4 more)

### Community 77 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (10): ref_react_three_drei, ref_react_three_fiber, ref_three_stdlib, CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility (+2 more)

### Community 78 - "OutboxLessonDecision.tsx"
Cohesion: 0.35
Nodes (10): LessonDecisionAction, lessonDecisionState(), readLessonDecision(), OutboxLessonDecision(), act(), readStatus(), Evidence(), LessonCard() (+2 more)

### Community 79 - "seeded-office-lessons.ts"
Cohesion: 0.38
Nodes (4): CONSOLIDATED, CONSOLIDATED_AT, SEEDS, SEEDS

### Community 80 - "it-agent.ts"
Cohesion: 0.60
Nodes (3): itAgent(), itDiagnostics(), Agent

### Community 81 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 82 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 84 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (6): ref_mammoth, ref_pdfjs_dist, bounded(), extract(), fail(), [path,kind]

### Community 85 - "helper-evidence.py"
Cohesion: 0.33
Nodes (5): importlib_util, json, pathlib, Read-only protocol adapter for the installed review helper. No model dispatch., sys

### Community 87 - "run-evidence.ts"
Cohesion: 0.38
Nodes (5): comparable(), EvidenceOutcome, recordRunEvidence(), backfillClaudeCost(), RunAccounting

## Knowledge Gaps
- **477 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+472 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 606 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `github-delivery.ts`, `dependency-bots/adopt.ts`, `workKey`, `ticket-evidence.ts`, `cec/issue-publication.ts`, `Role`, `features/workflow.ts`, `digest`, `App.tsx`, `agents.ts`, `ref_node_path`, `post-conflict-preparation.ts`, `worker-runtime.ts`, `reader.ts`, `session-bridge.ts`, `currentAssignment`, `maintenance/maintenance.ts`, `conversations/conversations.ts`, `run-retrospective.ts`, `lesson-selection.ts`, `scheduled-captures.ts`, `features.ts`, `index.ts`, `github-readiness.ts`, `record-push.ts`, `artifact`, `assignments.ts`, `policy.ts`, `.save`, `requests.ts`, `brain-maintenance.ts`, `record-trigger.ts`, `cost-ledger.ts`, `source-amendment.ts`, `control-store.ts`, `easternDay`, `http/commands.ts`, `ref_zod`, `run-accounting.ts`, `coordination.ts`, `blocker-followups.ts`, `jira-time.ts`, `config.ts`, `daily-cto.ts`, `retrospective-subject.ts`, `assignment-poll.ts`, `engine.ts`, `knowledge.ts`, `time-scope.ts`, `admit-improvement.ts`, `.emit`, `stopped-base-validation.ts`, `store.ts`, `run-evidence.ts`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **Why does `Role` connect `Role` to `github-delivery.ts`, `Inspector.tsx`, `App.tsx`, `agents.ts`, `worker-runtime.ts`, `maintenance/maintenance.ts`, `conversations/conversations.ts`, `shared.ts`, `github-readiness.ts`, `PeoplePanel.tsx`, `.save`, `requests.ts`, `OfficeScene.tsx`, `http/commands.ts`, `run-accounting.ts`, `retrospective-subject.ts`, `scene-motion.ts`, `.emit`, `store.ts`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `TicketJob` connect `github-delivery.ts` to `Store`, `dependency-bots/adopt.ts`, `Inspector.tsx`, `workKey`, `Role`, `digest`, `App.tsx`, `ref_node_path`, `post-conflict-preparation.ts`, `worker-runtime.ts`, `currentAssignment`, `features.ts`, `shared.ts`, `github-readiness.ts`, `record-push.ts`, `artifact`, `.save`, `requests.ts`, `record-trigger.ts`, `source-amendment.ts`, `coordination.ts`, `blocker-followups.ts`, `retrospective-subject.ts`, `assignment-poll.ts`, `fact-bounds.ts`, `stopped-base-validation.ts`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _477 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `github-delivery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.04317153592515911 - nodes in this community are weakly interconnected._
- **Should `Store` be split into smaller, more focused modules?**
  _Cohesion score 0.049689440993788817 - nodes in this community are weakly interconnected._
- **Should `dependency-bots/adopt.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05168067226890756 - nodes in this community are weakly interconnected._