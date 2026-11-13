# Graph Report - the-office  (2026-11-13)

## Corpus Check
- 750 files · ~310,530 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3849 nodes · 18015 edges · 109 communities (103 shown, 6 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 583 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3d0183c8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- github-delivery.ts
- config.ts
- dependency-bots/adopt.ts
- Inspector.tsx
- workKey
- ticket-evidence.ts
- cec/issue-publication.ts
- Store
- featureById
- digest
- App.tsx
- agents.ts
- ref_node_path
- artifact
- worker-runtime.ts
- assignments.ts
- ref_react
- session-bridge.ts
- ControlStore
- TicketJob
- maintenance/maintenance.ts
- azure.ts
- run-retrospective.ts
- lesson-selection.ts
- scheduled-captures.ts
- features.ts
- index.ts
- index.tsx
- shared.ts
- github-context.ts
- process.ts
- requests.ts
- demand-facts.ts
- PeoplePanel.tsx
- enrollment-gate.ts
- cec/workflow.ts
- packed165-admission.ts
- TelemetryPanel.tsx
- coordination.ts
- record-trigger.ts
- cost-ledger.ts
- source-amendment-scope.ts
- constellation-runtime.ts
- QuestionStepper.tsx
- control-store.ts
- easternDay
- OfficeScene.tsx
- .emit
- run.ts
- telemetry.ts
- run-accounting.ts
- Goals.tsx
- dependencies.ts
- it-specialist.ts
- jira-time.ts
- scheduled-work.ts
- daily-cto.ts
- retrospective-subject.ts
- useLiveTiming.ts
- Coordinator
- Engine
- knowledge.ts
- time-scope.ts
- source-amendment.ts
- scene-motion.ts
- fact-bounds.ts
- ref_node_crypto
- leadership.ts
- admit-improvement.ts
- outbox.ts
- ref_zod
- node-visuals.ts
- assignment-poll.ts
- Effects
- harnessEffect
- preferences-store.ts
- report.ts
- RoomCamera.tsx
- Conversation.tsx
- office-lessons.ts
- it-agent.ts
- codex-rollout.ts
- CommandRegistry
- engine.ts
- extract-worker.mjs
- helper-evidence.py
- .save
- run-evidence.ts
- remove-candidate.ts
- blocker-followups.ts
- validate-stage.ts
- Role
- service-health.ts
- tracking-issue.ts
- local-config.ts
- refresh-evidence.ts
- jira-operations.ts
- install-service.mjs
- cli.ts
- evidence.ts
- createConstellation
- merge-scanner-retry.ts
- Offices
- useOfficePreferences.ts
- project-progress.ts
- CommittedBrain
- office-state-view.ts
- highestStableAtLeast
- OfficeKnowledge

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
- `LessonBrainOverlap` --references--> `Lesson`  [EXTRACTED]
  server/knowledge/lesson-brain-audit.ts → src/contracts/knowledge.ts
- `StageContext` --references--> `Role`  [EXTRACTED]
  server/delivery/pipeline/accept-stage-result.ts → src/shared.ts
- `StageContext` --references--> `StageResult`  [EXTRACTED]
  server/delivery/pipeline/accept-stage-result.ts → src/shared.ts
- `DeliveryTaskInput` --references--> `TicketJob`  [EXTRACTED]
  server/delivery/pipeline/delivery-task.ts → src/shared.ts
- `ITContext` --references--> `TicketJob`  [EXTRACTED]
  server/it/context.ts → src/shared.ts

## Import Cycles
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/parking/resume-provider-review.ts -> server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/parking/resume-provider-review.ts`
- 3-file cycle: `server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts`
- 4-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 4-file cycle: `server/delivery/recovery/stopped-base-review.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/stopped-base-review.ts`
- 4-file cycle: `server/delivery/recovery/implementation/activation-recovery.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/implementation/activation-recovery.ts`
- 4-file cycle: `server/delivery/recovery/scope-repair/scope-repair-readback.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/scope-repair/scope-repair-readback.ts`
- 4-file cycle: `server/delivery/recovery/implementation/saved-prerequisite-handoff.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/implementation/saved-prerequisite-handoff.ts`
- 4-file cycle: `server/delivery/recovery/source-amendment/source-amendment.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/source-amendment/source-amendment.ts`
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

## Communities (109 total, 6 thin omitted)

### Community 0 - "github-delivery.ts"
Cohesion: 0.06
Nodes (87): containedFile(), findingsBlock(), deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), requireDeliveryAuthority(), deliveryIntakeBlocker(), gateRegisteredDelivery() (+79 more)

### Community 1 - "config.ts"
Cohesion: 0.11
Nodes (34): ref_node_url, featureItemComplete(), reconcileFeatureCompletion(), discoveryPrompt(), planPrompt(), helperTelemetry(), reserveReplacement(), stageBudget() (+26 more)

### Community 2 - "dependency-bots/adopt.ts"
Cohesion: 0.15
Nodes (28): Execute, readBackOrThrow(), adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR (+20 more)

### Community 3 - "Inspector.tsx"
Cohesion: 0.12
Nodes (60): ServiceHealthPanel(), followUp(), labels, ServiceHealthRow(), BlockerFollowups(), LessonsPanel(), EvidenceCard(), Inspector() (+52 more)

### Community 4 - "workKey"
Cohesion: 0.07
Nodes (83): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+75 more)

### Community 5 - "ticket-evidence.ts"
Cohesion: 0.15
Nodes (19): ref_node_string_decoder, assetDownloader(), attachmentKind(), storeEvidence(), CoverageState, EVIDENCE_LIMITS, EvidenceAttachment, EvidenceReadContext (+11 more)

### Community 6 - "cec/issue-publication.ts"
Cohesion: 0.08
Nodes (25): Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), Transition, descriptionPreimage(), plain() (+17 more)

### Community 7 - "Store"
Cohesion: 0.07
Nodes (33): ref_smol_toml, goalNoticeAuthorized(), goalNoticeNeverDispatched(), maintenanceNoticeNeverDispatched(), systemClock, file, project, root (+25 more)

### Community 8 - "featureById"
Cohesion: 0.16
Nodes (10): featureById(), Link, linkFeature(), reconcilePublication(), uncertainPublications(), reserveIdentity(), FeatureReviewRunner, featureRoute() (+2 more)

### Community 9 - "digest"
Cohesion: 0.08
Nodes (66): harnessCloseout(), PASSING, verifyMergeActions(), assertDeliveryMayMutate(), retryRead(), runHarnessStage(), harnessStageResult(), receipt() (+58 more)

### Community 10 - "App.tsx"
Cohesion: 0.05
Nodes (71): ref_lucide_react, ref_motion, ref_react_dom, compactSteps(), BrainDrawer(), themeColor, App(), BrainWorkspace (+63 more)

### Community 11 - "agents.ts"
Cohesion: 0.06
Nodes (48): IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), intakeMembership(), projectListScope(), cecPrompt(), cecIntakePrompt() (+40 more)

### Community 12 - "ref_node_path"
Cohesion: 0.08
Nodes (56): ref_node_fs, ref_node_os, ref_node_path, ref_node_util, allowed, candidateInput(), children, oldAdoptionBasis() (+48 more)

### Community 13 - "artifact"
Cohesion: 0.08
Nodes (67): partialLocalCleanupCandidate(), savedCandidateAdmission, assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), reconcileCompletedConflictDraft() (+59 more)

### Community 14 - "worker-runtime.ts"
Cohesion: 0.07
Nodes (33): SlackResultSchema, candidateWorkspaceEnvironment(), diagnosticContext(), assignmentSubject(), lessonPurpose(), selectLessons(), catalogLine(), assertBriefingScope() (+25 more)

### Community 15 - "assignments.ts"
Cohesion: 0.09
Nodes (34): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, GraphNode (+26 more)

### Community 16 - "ref_react"
Cohesion: 0.07
Nodes (67): ref_react, ref_react_markdown, ref_remark_gfm, ref_yaml, KnowledgeActivity, KnowledgeActivityPage, KnowledgeEdge, KnowledgeMap (+59 more)

### Community 17 - "session-bridge.ts"
Cohesion: 0.07
Nodes (46): ref_ws, claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexDaemonProcesses(), accountCodexProcesses(), codexProcessInventory (+38 more)

### Community 18 - "ControlStore"
Cohesion: 0.20
Nodes (5): DailyCTO, Briefing, saveReviewBriefing(), ControlStore, DailyCTOReport

### Community 19 - "TicketJob"
Cohesion: 0.06
Nodes (50): removeAdoptedClone(), namedRepairIds(), dependabotReviewGuidance(), pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), StageContext, GitHubDelivery, stagePrompt() (+42 more)

### Community 20 - "maintenance/maintenance.ts"
Cohesion: 0.08
Nodes (34): maintenancePolicies(), captureMaintenanceStep(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, BrainStatusSchema, identity, coverageSchema (+26 more)

### Community 21 - "azure.ts"
Cohesion: 0.12
Nodes (26): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+18 more)

### Community 22 - "run-retrospective.ts"
Cohesion: 0.10
Nodes (40): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, blockingTrigger, brainOverlap, brainOverlapQuery() (+32 more)

### Community 23 - "lesson-selection.ts"
Cohesion: 0.11
Nodes (23): lessonIssueBody(), lessonIssueMarker(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, LessonSelection, lessonText() (+15 more)

### Community 24 - "scheduled-captures.ts"
Cohesion: 0.15
Nodes (44): createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest, captureRequests() (+36 more)

### Community 25 - "features.ts"
Cohesion: 0.06
Nodes (62): approveFeature(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), artifactPath(), digest(), document() (+54 more)

### Community 26 - "index.ts"
Cohesion: 0.08
Nodes (38): ref_hono_node_server, ref_node_http, ref_vite, close(), config, itSpecialist, loadedRevision, offices (+30 more)

### Community 27 - "index.tsx"
Cohesion: 0.13
Nodes (41): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS, PickupForm(), ProjectForms() (+33 more)

### Community 28 - "shared.ts"
Cohesion: 0.06
Nodes (40): Admission, ProjectReadiness, HistoryRetirement, HistoryRetirementIntent, PackedPublicationRepair, SlackReplacementRequest, SlackSupersession, SlackSupersessionView (+32 more)

### Community 29 - "github-context.ts"
Cohesion: 0.12
Nodes (35): deliveryTask(), observe(), assertAutomationEffects(), automationMergePolicy(), observeAutomationMerge(), routeAutomationMerge(), checksFailed(), checksPassed() (+27 more)

### Community 30 - "process.ts"
Cohesion: 0.11
Nodes (24): Event, one(), prePushRejection(), PushIdentity, Candidate, recordedPush(), settledPushBoundary(), Result (+16 more)

### Community 31 - "requests.ts"
Cohesion: 0.11
Nodes (42): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+34 more)

### Community 32 - "demand-facts.ts"
Cohesion: 0.11
Nodes (22): clip(), DEMAND_LIMIT, demandFacts(), key(), LessonKey, notes(), clip(), MISSED_QUERY_LIMIT (+14 more)

### Community 33 - "PeoplePanel.tsx"
Cohesion: 0.09
Nodes (42): label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+34 more)

### Community 34 - "enrollment-gate.ts"
Cohesion: 0.15
Nodes (28): dispatchNightly(), drainDelivery(), requestDelivery(), resume(), startPilot(), eligibility(), IntakeContext, WAIT_STATUSES (+20 more)

### Community 35 - "cec/workflow.ts"
Cohesion: 0.09
Nodes (39): applyIntakeObservation(), parksInJira(), MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), run(), advance(), nextStage() (+31 more)

### Community 36 - "packed165-admission.ts"
Cohesion: 0.13
Nodes (31): DeliveryAuthorityInput, accounting, DeliverySubject, nonDelivery, originalReads, HarnessControl, admitPacked165(), history() (+23 more)

### Community 37 - "TelemetryPanel.tsx"
Cohesion: 0.22
Nodes (18): TelemetryReport, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens(), usd(), KpiTiles() (+10 more)

### Community 38 - "coordination.ts"
Cohesion: 0.13
Nodes (20): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), legacy, validateNativeContinuation(), checkpointWindow() (+12 more)

### Community 39 - "record-trigger.ts"
Cohesion: 0.09
Nodes (46): isBlocking(), baselineLearning(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences(), busyMaintenanceIds(), clip() (+38 more)

### Community 40 - "cost-ledger.ts"
Cohesion: 0.17
Nodes (25): captureCost(), server_telemetry_cost_entries_costcoveragesummary, costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress() (+17 more)

### Community 41 - "source-amendment-scope.ts"
Cohesion: 0.08
Nodes (34): approvedText(), assert(), assert(), normalize(), officialUrls, ReleaseCapture, verifyReleaseCaptures(), capture (+26 more)

### Community 42 - "constellation-runtime.ts"
Cohesion: 0.15
Nodes (17): ref_3d_force_graph, ref_three, CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point (+9 more)

### Community 43 - "QuestionStepper.tsx"
Cohesion: 0.15
Nodes (23): FeatureHarnessOption, FeatureOption, FeatureQuestion, FeatureQuestionProjection, draftKey(), readDraft(), saveDraft(), QuestionRound() (+15 more)

### Community 44 - "control-store.ts"
Cohesion: 0.18
Nodes (10): ref_node_sqlite, Clock, applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, statementCache(), initialSnapshot() (+2 more)

### Community 45 - "easternDay"
Cohesion: 0.20
Nodes (14): expireLessons(), expiring(), graduateLessons(), graduating(), retire(), dailyReviewDate(), reviewWeekday(), EASTERN (+6 more)

### Community 46 - "OfficeScene.tsx"
Cohesion: 0.16
Nodes (34): withoutElapsed(), Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk() (+26 more)

### Community 47 - ".emit"
Cohesion: 0.15
Nodes (27): configureChannelNotices(), configureNotices(), retryRecipientLookup(), enqueueGreen156(), bindDiscoveryResume(), DiscoveryResumeInput, failedWorker(), requeueWaitedImplement() (+19 more)

### Community 48 - "run.ts"
Cohesion: 0.15
Nodes (23): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationCandidates(), investigationId(), investigationFollowUps(), investigationResolution(), syncInvestigations(), NOTIFY_HELPER (+15 more)

### Community 49 - "telemetry.ts"
Cohesion: 0.10
Nodes (27): CodexRollout, CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL (+19 more)

### Community 50 - "run-accounting.ts"
Cohesion: 0.12
Nodes (32): BoundedRead, done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf(), CompletionReader, codexHome() (+24 more)

### Community 51 - "Goals.tsx"
Cohesion: 0.08
Nodes (37): SendMessage, FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), send(), phases, LinkedFeatures() (+29 more)

### Community 52 - "dependencies.ts"
Cohesion: 0.11
Nodes (26): MergeNotifications, reconcileNoticeConfirmations(), admit(), admitReadyCards(), compatible(), dependencyCompletionKey(), dependencyEligibility(), issueKey() (+18 more)

### Community 53 - "it-specialist.ts"
Cohesion: 0.16
Nodes (19): partialLocalCleanupKey(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), ITContext, diagnosticSnapshot(), publishITReport() (+11 more)

### Community 54 - "jira-time.ts"
Cohesion: 0.14
Nodes (20): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+12 more)

### Community 55 - "scheduled-work.ts"
Cohesion: 0.15
Nodes (22): deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), metadataRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), requestPriority() (+14 more)

### Community 56 - "daily-cto.ts"
Cohesion: 0.18
Nodes (14): EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), applyGoalReview(), DailyResultSchema, EvidenceRefSchema, FreshDailyResultSchema, GoalEvidenceRequestSchema (+6 more)

### Community 57 - "retrospective-subject.ts"
Cohesion: 0.19
Nodes (17): maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject, SubjectStepResult, ticketSubject() (+9 more)

### Community 58 - "useLiveTiming.ts"
Cohesion: 0.23
Nodes (13): AzureBuild, src_shared_liveanchor, lastWall, sample(), subscribe(), subscribers, useLiveClock(), liveBuildTiming() (+5 more)

### Community 59 - "Coordinator"
Cohesion: 0.08
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 61 - "knowledge.ts"
Cohesion: 0.06
Nodes (49): deliveryMetrics(), median(), learningMetrics(), BRAIN_SCOPE, SUBJECT, Kind, RetrospectiveResult, RetrospectiveResultSchema (+41 more)

### Community 62 - "time-scope.ts"
Cohesion: 0.13
Nodes (28): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), server_telemetry_billable_work_issue_key, isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence() (+20 more)

### Community 63 - "source-amendment.ts"
Cohesion: 0.08
Nodes (60): ref_node_async_hooks, adoptCandidate(), reported, Scope, assertCandidateChildContextCurrent(), Assessment, outsideScanSources(), Ownership (+52 more)

### Community 64 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 65 - "fact-bounds.ts"
Cohesion: 0.23
Nodes (16): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+8 more)

### Community 66 - "ref_node_crypto"
Cohesion: 0.20
Nodes (20): ref_node_crypto, commandFeature(), reviewQuestions(), confirmBrief(), FeaturePlanningBindings, assertQuestionVisibility(), applyHarnessAction(), HarnessActionInput (+12 more)

### Community 67 - "leadership.ts"
Cohesion: 0.18
Nodes (9): DailyCTOBriefing, DailyCTOResult, DailyCTOSummary, DailyGoalUpdate, GoalEvidenceRef, GoalEvidenceRequest, GoalProgress, GoalStatus (+1 more)

### Community 68 - "admit-improvement.ts"
Cohesion: 0.23
Nodes (16): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+8 more)

### Community 69 - "outbox.ts"
Cohesion: 0.12
Nodes (24): conversationResolved(), projectOutbox(), syncOutbox(), finishSupersededReadback(), projectSlackDeliveries(), Input, supersedeSlackDelivery(), replacementContext() (+16 more)

### Community 70 - "ref_zod"
Cohesion: 0.07
Nodes (37): ref_zod, assertConversationReadback(), Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+29 more)

### Community 71 - "node-visuals.ts"
Cohesion: 0.20
Nodes (13): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+5 more)

### Community 72 - "assignment-poll.ts"
Cohesion: 0.11
Nodes (22): channelNoticeAuthorized(), ChannelSettings, notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR, plainSlackText() (+14 more)

### Community 73 - "Effects"
Cohesion: 0.18
Nodes (12): diagnosticProof(), ownedArtifact(), rawHash(), recoverDiscovery(), scopeNote(), GitHubOperations, fileLessonIssue(), sendGoalNotice() (+4 more)

### Community 74 - "harnessEffect"
Cohesion: 0.21
Nodes (24): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), ProjectCard, projectCards(), projectGraphql() (+16 more)

### Community 75 - "preferences-store.ts"
Cohesion: 0.19
Nodes (9): PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS, OfficePreferences (+1 more)

### Community 76 - "report.ts"
Cohesion: 0.26
Nodes (13): TelemetryRow, TelemetrySync, Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount() (+5 more)

### Community 77 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (10): ref_react_three_drei, ref_react_three_fiber, ref_three_stdlib, CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility (+2 more)

### Community 78 - "Conversation.tsx"
Cohesion: 0.16
Nodes (23): Conversation(), Outbox(), LessonDecisionAction, lessonDecisionState(), readLessonDecision(), OutboxLessonDecision(), act(), readStatus() (+15 more)

### Community 79 - "office-lessons.ts"
Cohesion: 0.19
Nodes (13): normalizeStatement(), decideOfficeProposal(), now(), OfficeKnowledgeStore, proposeOfficeLessons(), retireOfficeLesson(), Input, promoteNoteLesson() (+5 more)

### Community 80 - "it-agent.ts"
Cohesion: 0.60
Nodes (3): itAgent(), itDiagnostics(), Agent

### Community 81 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 83 - "engine.ts"
Cohesion: 0.11
Nodes (18): correlatedBuild(), checkMail(), drainMail(), requestMail(), enableNightly(), ingest(), GitHubMonitor, githubPRDescription() (+10 more)

### Community 84 - "extract-worker.mjs"
Cohesion: 0.43
Nodes (6): ref_mammoth, ref_pdfjs_dist, bounded(), extract(), fail(), [path,kind]

### Community 85 - "helper-evidence.py"
Cohesion: 0.33
Nodes (5): importlib_util, json, pathlib, Read-only protocol adapter for the installed review helper. No model dispatch., sys

### Community 86 - ".save"
Cohesion: 0.24
Nodes (23): BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue(), readIssues(), commentDecision() (+15 more)

### Community 87 - "run-evidence.ts"
Cohesion: 0.38
Nodes (5): comparable(), EvidenceOutcome, recordRunEvidence(), backfillClaudeCost(), RunAccounting

### Community 88 - "remove-candidate.ts"
Cohesion: 0.18
Nodes (18): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot() (+10 more)

### Community 89 - "blocker-followups.ts"
Cohesion: 0.23
Nodes (16): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), readBackConversations(), handoff(), reconcileBlockerFollowups(), improvementIntakeGate(), captureLearning() (+8 more)

### Community 90 - "validate-stage.ts"
Cohesion: 0.18
Nodes (16): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+8 more)

### Community 91 - "Role"
Cohesion: 0.17
Nodes (11): ROLES, LOCAL_BINDINGS, DeliverySlot, officeCapacity, PROJECTS, withCECGoalEvidence(), WorkSlot, ExecutionLane (+3 more)

### Community 92 - "service-health.ts"
Cohesion: 0.19
Nodes (9): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, slackHealth() (+1 more)

### Community 93 - "tracking-issue.ts"
Cohesion: 0.19
Nodes (13): ensureTrackingIssue(), findTrackingIssue(), ownTracking(), TrackingIssue, trackingIssueBody(), trackingIssueTitle(), trackingMarker(), centralCompanionHandoff() (+5 more)

### Community 94 - "local-config.ts"
Cohesion: 0.22
Nodes (13): AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), goalEvidencePath(), localBindings, assertModelOverrides(), CODEX_DEFAULT_EFFORT, CODEX_DEFAULT_MODEL, CODEX_EFFORTS (+5 more)

### Community 95 - "refresh-evidence.ts"
Cohesion: 0.31
Nodes (11): evidenceDirectory(), readEvidence(), ProviderEvidence, canonical(), evidenceDigest(), evidenceHash(), semantic(), stableUrl() (+3 more)

### Community 96 - "jira-operations.ts"
Cohesion: 0.27
Nodes (8): CommentPage, commentReadback(), JiraOperations, plain(), unpack(), jiraRecord(), blankEvidence(), jiraEvidence()

### Community 97 - "install-service.mjs"
Cohesion: 0.18
Nodes (10): ref_node_child_process, file, folder, logs, root, GIT_NETWORK, LIVE_PROVIDERS, liveReach() (+2 more)

### Community 98 - "cli.ts"
Cohesion: 0.17
Nodes (10): ref_node_stream, ref_node_timers, args, [cmd,...rawArgs], commands, key, projectIndex, lessonBrainAudit (+2 more)

### Community 99 - "evidence.ts"
Cohesion: 0.26
Nodes (9): investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_SOURCE_PATHS, officeSource(), ROOT, launchPolicyFacts() (+1 more)

### Community 100 - "createConstellation"
Cohesion: 0.19
Nodes (5): ConstellationRuntime, createConstellation(), enter(), finishTap(), move()

### Community 101 - "merge-scanner-retry.ts"
Cohesion: 0.36
Nodes (10): activeEffectId(), dispatchedMetadataEffect(), officeMergeProvenance(), reconcileMergeScannerRetry(), Retry, retryMergeScanner(), retryReadBack(), runIdentity() (+2 more)

### Community 103 - "useOfficePreferences.ts"
Cohesion: 0.26
Nodes (10): acceptPreferences(), PreferenceCandidate, strip(), UNKNOWN_PREFERENCES, OfficePreferencesController, PreferenceFeedback, PreferenceField, requestPreferences() (+2 more)

### Community 106 - "office-state-view.ts"
Cohesion: 0.60
Nodes (4): leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore()

### Community 107 - "highestStableAtLeast"
Cohesion: 0.83
Nodes (3): compare(), highestStableAtLeast(), parts()

## Knowledge Gaps
- **476 isolated node(s):** `filterNames`, `ATMOSPHERE`, `Particle`, `TOKENS`, `SCENE_COLOR_TOKENS` (+471 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 603 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `github-delivery.ts`, `config.ts`, `dependency-bots/adopt.ts`, `workKey`, `ticket-evidence.ts`, `cec/issue-publication.ts`, `featureById`, `digest`, `App.tsx`, `agents.ts`, `ref_node_path`, `artifact`, `worker-runtime.ts`, `assignments.ts`, `session-bridge.ts`, `TicketJob`, `maintenance/maintenance.ts`, `azure.ts`, `run-retrospective.ts`, `lesson-selection.ts`, `scheduled-captures.ts`, `features.ts`, `index.ts`, `github-context.ts`, `process.ts`, `requests.ts`, `demand-facts.ts`, `enrollment-gate.ts`, `cec/workflow.ts`, `packed165-admission.ts`, `coordination.ts`, `record-trigger.ts`, `cost-ledger.ts`, `control-store.ts`, `easternDay`, `.emit`, `run.ts`, `run-accounting.ts`, `dependencies.ts`, `it-specialist.ts`, `jira-time.ts`, `scheduled-work.ts`, `daily-cto.ts`, `retrospective-subject.ts`, `Engine`, `knowledge.ts`, `time-scope.ts`, `source-amendment.ts`, `ref_node_crypto`, `admit-improvement.ts`, `outbox.ts`, `ref_zod`, `assignment-poll.ts`, `Effects`, `harnessEffect`, `office-lessons.ts`, `engine.ts`, `.save`, `run-evidence.ts`, `remove-candidate.ts`, `blocker-followups.ts`, `validate-stage.ts`, `Role`, `tracking-issue.ts`, `refresh-evidence.ts`, `jira-operations.ts`, `evidence.ts`, `project-progress.ts`, `office-state-view.ts`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Why does `Role` connect `Role` to `github-delivery.ts`, `Inspector.tsx`, `Store`, `App.tsx`, `agents.ts`, `worker-runtime.ts`, `TicketJob`, `maintenance/maintenance.ts`, `shared.ts`, `github-context.ts`, `PeoplePanel.tsx`, `cec/workflow.ts`, `packed165-admission.ts`, `OfficeScene.tsx`, `.emit`, `run-accounting.ts`, `retrospective-subject.ts`, `scene-motion.ts`, `outbox.ts`, `ref_zod`, `Conversation.tsx`, `local-config.ts`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `command()` connect `process.ts` to `github-delivery.ts`, `config.ts`, `workKey`, `ticket-evidence.ts`, `cec/issue-publication.ts`, `Store`, `featureById`, `digest`, `agents.ts`, `worker-runtime.ts`, `assignments.ts`, `session-bridge.ts`, `TicketJob`, `maintenance/maintenance.ts`, `azure.ts`, `lesson-selection.ts`, `features.ts`, `requests.ts`, `enrollment-gate.ts`, `cec/workflow.ts`, `packed165-admission.ts`, `coordination.ts`, `cost-ledger.ts`, `easternDay`, `dependencies.ts`, `jira-time.ts`, `scheduled-work.ts`, `Engine`, `assignment-poll.ts`, `Effects`, `harnessEffect`, `CommandRegistry`, `engine.ts`, `.save`, `remove-candidate.ts`, `validate-stage.ts`, `Role`, `service-health.ts`, `jira-operations.ts`, `install-service.mjs`, `project-progress.ts`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **What connects `filterNames`, `ATMOSPHERE`, `Particle` to the rest of the system?**
  _476 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `github-delivery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.056022408963585436 - nodes in this community are weakly interconnected._
- **Should `config.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1119177253478524 - nodes in this community are weakly interconnected._
- **Should `Inspector.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11688311688311688 - nodes in this community are weakly interconnected._