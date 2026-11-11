# Graph Report - the-office  (2026-11-11)

## Corpus Check
- 800 files · ~318,500 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4055 nodes · 19513 edges · 97 communities (94 shown, 3 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 785 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `386aba16`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- artifact
- github-readiness.ts
- preparation-readback.ts
- engine.ts
- Inspector.tsx
- digest
- knowledge/routes.ts
- features.ts
- Button
- .transaction
- SourceRegistry
- scheduled-captures.ts
- App.tsx
- index.tsx
- OfficeScene.tsx
- ref_node_util
- requests.ts
- session-bridge.ts
- source-amendment.ts
- PeoplePanel.tsx
- constellation-runtime.ts
- agents.ts
- MapView.tsx
- TelemetryPanel.tsx
- github-delivery.ts
- FeatureError
- maintenance/maintenance.ts
- offices.ts
- knowledge.ts
- digest
- source-amendment-scope.ts
- Effects
- reader.ts
- dependency-bots/adopt.ts
- slack-intake/config.ts
- index.ts
- ticket-evidence.ts
- time-scope.ts
- harnessEffect
- closeout-recovery.ts
- scheduled-work.ts
- telemetry.ts
- office/config.ts
- cec/workflow.ts
- lesson-selection.ts
- .save
- conversations/conversations.ts
- it-specialist.ts
- enrollment-gate.ts
- .pump
- coordination.ts
- run-accounting.ts
- review-run.ts
- worker-runtime.ts
- scheduler.ts
- jira-time.ts
- service-health.ts
- scene-motion.ts
- .emit
- relink-pin-courier.ts
- RoomCamera.tsx
- recoverDiscovery
- record-trigger.ts
- ControlStore
- FeatureWorkspace.tsx
- Store
- remove-candidate.ts
- ref_node_crypto
- local-config.ts
- Coordinator
- azure.ts
- tracking-issue.ts
- investigations/run.ts
- admit-improvement.ts
- useOfficePreferences.ts
- shared.ts
- accept-stage-result.ts
- node-visuals.ts
- extraction.ts
- daily-cto.ts
- assignment-poll.ts
- CommittedBrain
- run-usage.ts
- control-store.ts
- process.ts
- fact-bounds.ts
- codex-rollout-file.ts
- owned-artifact.ts
- preferences-store.ts
- handover-cms.ts
- telemetry/report.ts
- SlackIntakeStatus.tsx
- ProjectProgress
- highestStableAtLeast
- codex-rollout.ts
- extract-worker.mjs
- helper-evidence.py

## God Nodes (most connected - your core abstractions)
1. `Store` - 362 edges
2. `TicketJob` - 165 edges
3. `digest()` - 134 edges
4. `GitHubDelivery` - 117 edges
5. `artifact()` - 117 edges
6. `command()` - 110 edges
7. `workKey()` - 97 edges
8. `Button` - 94 edges
9. `cx()` - 92 edges
10. `currentAssignment()` - 82 edges

## Surprising Connections (you probably didn't know these)
- `DeliverySlot` --references--> `Role`  [EXTRACTED]
  server/office/projects.ts → src/shared.ts
- `projectOutbox()` --calls--> `parkedProviderWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts
- `projectOutbox()` --calls--> `readinessNeedsFollowup()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts
- `projectOutbox()` --calls--> `readinessWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts
- `replacementContext()` --calls--> `slackMessageUrl()`  [EXTRACTED]
  server/conversations/slack/supersession-proof.ts → src/shared.ts

## Import Cycles
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/parking/resume-provider-review.ts -> server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/parking/resume-provider-review.ts`
- 3-file cycle: `server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts`
- 3-file cycle: `server/conversations/notifications.ts -> server/conversations/slack.ts -> server/knowledge/digests/outbound.ts -> server/conversations/notifications.ts`
- 3-file cycle: `server/conversations/notifications.ts -> server/knowledge/digests/send-notice.ts -> server/knowledge/digests/outbound.ts -> server/conversations/notifications.ts`
- 4-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 4-file cycle: `server/delivery/recovery/implementation/activation-recovery.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/implementation/activation-recovery.ts`
- 4-file cycle: `server/delivery/recovery/implementation/saved-prerequisite-handoff.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/implementation/saved-prerequisite-handoff.ts`
- 4-file cycle: `server/delivery/recovery/scope-repair/scope-repair-readback.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/scope-repair/scope-repair-readback.ts`
- 4-file cycle: `server/delivery/recovery/source-amendment/source-amendment.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/source-amendment/source-amendment.ts`
- 4-file cycle: `server/delivery/recovery/stopped-base-review.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/stopped-base-review.ts`
- 4-file cycle: `server/delivery/recovery/validation/validation-readback.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/validation/validation-readback.ts`
- 4-file cycle: `server/conversations/notifications.ts -> server/leadership/send-goal-notice.ts -> server/conversations/slack.ts -> server/knowledge/digests/outbound.ts -> server/conversations/notifications.ts`
- 4-file cycle: `server/conversations/notifications.ts -> server/knowledge/digests/send-notice.ts -> server/conversations/slack.ts -> server/knowledge/digests/outbound.ts -> server/conversations/notifications.ts`
- 4-file cycle: `server/conversations/notifications.ts -> server/maintenance/brain/send-maintenance-notice.ts -> server/conversations/slack.ts -> server/knowledge/digests/outbound.ts -> server/conversations/notifications.ts`
- 4-file cycle: `server/features/delivery-binding.ts -> server/features/enrollment-gate.ts -> server/features/progression/failure.ts -> server/store/effects.ts -> server/features/delivery-binding.ts`
- 5-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/stage-reconciliation.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 5-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 5-file cycle: `server/delivery/recovery/implementation/continuation-evidence.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/recovery/implementation/continuation-evidence.ts`

## Communities (97 total, 3 thin omitted)

### Community 0 - "artifact"
Cohesion: 0.07
Nodes (84): ref_node_os, allowed, continuationNativeReview(), continuationWorkerProof(), negativeWorker(), candidateInput(), children, oldAdoptionBasis() (+76 more)

### Community 1 - "github-readiness.ts"
Cohesion: 0.09
Nodes (51): deliveryTask(), observe(), assertAutomationEffects(), automationMergePolicy(), observeAutomationMerge(), routeAutomationMerge(), checksFailed(), checksPassed() (+43 more)

### Community 2 - "preparation-readback.ts"
Cohesion: 0.15
Nodes (21): bindPreparationBoardOrigins(), claimSchema, eventSchema, PreparationBoardOrigin, readPreparationBoardOrigins(), timestamp, updateSchema, readyOnlyReceiptHistory() (+13 more)

### Community 3 - "engine.ts"
Cohesion: 0.06
Nodes (21): AzureMonitor, correlatedBuild(), CommentPage, commentReadback(), JiraOperations, plain(), checkMail(), drainMail() (+13 more)

### Community 4 - "Inspector.tsx"
Cohesion: 0.09
Nodes (77): ref_lucide_react, Conversation(), send(), Outbox(), SendMessage, recommendedReply(), slackMessageStatus(), SlackDeliveryCard() (+69 more)

### Community 5 - "digest"
Cohesion: 0.09
Nodes (66): comparableSlackText(), uploadArtifact(), AuthoredDigest, reconcileDigestAuthorship(), unitAuthorship(), annotateAuthoredUnits(), independentIntakeResult(), reconcileAuthoredEvidence() (+58 more)

### Community 6 - "knowledge/routes.ts"
Cohesion: 0.09
Nodes (59): intakeActivity(), knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), KnowledgeContext, independentDigestEvidence(), digestKnowledge(), prepareDigestBodies() (+51 more)

### Community 7 - "features.ts"
Cohesion: 0.06
Nodes (65): approveFeature(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), artifactPath(), digest(), document() (+57 more)

### Community 8 - "Button"
Cohesion: 0.09
Nodes (47): ref_react, ref_react_markdown, ref_remark_gfm, ref_yaml, guidanceExcerpt(), evidenceTitle(), KnowledgeCapturePage, KnowledgeDigestDelivery (+39 more)

### Community 9 - ".transaction"
Cohesion: 0.11
Nodes (15): featureById(), discoveryPrompt(), planPrompt(), Link, linkFeature(), publishFeature(), beginReader(), reconcilePublication() (+7 more)

### Community 10 - "SourceRegistry"
Cohesion: 0.08
Nodes (46): Config, configDigest(), readConfig(), readMethod(), isStoppingFor(), reconcileIntakeStatus(), SlackReadAuthority, runSlackLinks() (+38 more)

### Community 11 - "scheduled-captures.ts"
Cohesion: 0.14
Nodes (44): createFeature(), assertEnrollable(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest, captureRequests(), failCapture() (+36 more)

### Community 12 - "App.tsx"
Cohesion: 0.06
Nodes (62): ref_motion, ref_react_dom, itAgent(), itDiagnostics(), BrainDrawer(), themeColor, App(), BrainWorkspace (+54 more)

### Community 13 - "index.tsx"
Cohesion: 0.07
Nodes (65): KnowledgeCadence, KnowledgeDestination, KnowledgeSourceKind, KnowledgeSourceState, KnowledgeSourceSummary, LinkedFeatures(), AddPublicSource(), AddSourceForm() (+57 more)

### Community 14 - "OfficeScene.tsx"
Cohesion: 0.17
Nodes (33): withoutElapsed(), Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk() (+25 more)

### Community 15 - "ref_node_util"
Cohesion: 0.09
Nodes (58): ref_node_async_hooks, ref_node_util, harnessCloseout(), PASSING, verifyMergeActions(), activeEffectId(), runHarnessStage(), harnessStageResult() (+50 more)

### Community 16 - "requests.ts"
Cohesion: 0.08
Nodes (54): deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, deliveryIntakeBlocker(), gateRegisteredDelivery(), resolveDeliveryWork(), HANDS_OFF_PROJECTS (+46 more)

### Community 17 - "session-bridge.ts"
Cohesion: 0.09
Nodes (37): ref_ws, claudeSessionContext(), readTranscript, root, claudeSessionScope(), accountCodexProcesses(), codexProcessInventory, DesktopSessions (+29 more)

### Community 18 - "source-amendment.ts"
Cohesion: 0.07
Nodes (54): adoptCandidate(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat() (+46 more)

### Community 19 - "PeoplePanel.tsx"
Cohesion: 0.10
Nodes (42): label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+34 more)

### Community 20 - "constellation-runtime.ts"
Cohesion: 0.10
Nodes (22): ref_3d_force_graph, ref_three, CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point (+14 more)

### Community 21 - "agents.ts"
Cohesion: 0.08
Nodes (39): cecPrompt(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), resolvedDecisionNote(), stageInstructions, cecChatPrompt() (+31 more)

### Community 22 - "MapView.tsx"
Cohesion: 0.15
Nodes (24): KnowledgeActivity, KnowledgeEdge, KnowledgeIntakeStatus, KnowledgeMap, KnowledgeNode, Constellation(), ConstellationView, DisplayNode (+16 more)

### Community 23 - "TelemetryPanel.tsx"
Cohesion: 0.09
Nodes (40): displayAgentTask(), LiveAgentTask(), Props, RunningTask(), text(), AzureBuild, src_shared_liveanchor, BreakdownTable() (+32 more)

### Community 24 - "github-delivery.ts"
Cohesion: 0.05
Nodes (99): ref_node_fs, ref_node_path, containedFile(), candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate() (+91 more)

### Community 25 - "FeatureError"
Cohesion: 0.09
Nodes (23): Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), Transition, descriptionPreimage(), plain() (+15 more)

### Community 26 - "maintenance/maintenance.ts"
Cohesion: 0.09
Nodes (29): maintenancePolicies(), captureMaintenanceStep(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice(), candidateOwner() (+21 more)

### Community 27 - "offices.ts"
Cohesion: 0.13
Nodes (27): normalizeStatement(), retainedArtifactScope(), queueOutboundDigests(), eventSourceBindings(), eventVisible(), leadershipContext(), leadershipEntries(), assignmentSubject() (+19 more)

### Community 28 - "knowledge.ts"
Cohesion: 0.04
Nodes (97): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, improvementIntakeGate(), knowledgeScopeRevision(), captureLearning(), learningDigest(), recordLearningOpportunity() (+89 more)

### Community 29 - "digest"
Cohesion: 0.06
Nodes (96): pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash (+88 more)

### Community 30 - "source-amendment-scope.ts"
Cohesion: 0.25
Nodes (15): approvedText(), assert(), assert(), boundProfiles, canonical(), Document, ReadSourceFile, releaseAmendmentJournal() (+7 more)

### Community 31 - "Effects"
Cohesion: 0.08
Nodes (35): channelNoticeAuthorized(), ChannelSettings, notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR, plainSlackText() (+27 more)

### Community 32 - "reader.ts"
Cohesion: 0.09
Nodes (24): captureAfter(), CaptureMetadata, capturePage(), cursor(), key(), captureIdentityMatches(), BrainCaptureReceipt, hash (+16 more)

### Community 33 - "dependency-bots/adopt.ts"
Cohesion: 0.21
Nodes (21): Execute, adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR, openDependabotPulls() (+13 more)

### Community 34 - "slack-intake/config.ts"
Cohesion: 0.11
Nodes (28): newTask(), IntakeConfig, exactly(), Message, nativeReadPayload(), pagination(), nativeFile(), Message (+20 more)

### Community 35 - "index.ts"
Cohesion: 0.09
Nodes (35): ref_hono_node_server, ref_node_http, ref_vite, assertAssessmentVisibility(), close(), config, itSpecialist, loadedRevision (+27 more)

### Community 36 - "ticket-evidence.ts"
Cohesion: 0.12
Nodes (30): unpack(), jiraRecord(), assetDownloader(), attachmentKind(), evidenceDirectory(), readEvidence(), storeEvidence(), blankEvidence() (+22 more)

### Community 37 - "time-scope.ts"
Cohesion: 0.13
Nodes (31): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), server_telemetry_billable_work_issue_key, isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence() (+23 more)

### Community 38 - "harnessEffect"
Cohesion: 0.23
Nodes (23): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), ProjectCard, projectCards(), projectGraphql() (+15 more)

### Community 39 - "closeout-recovery.ts"
Cohesion: 0.08
Nodes (52): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+44 more)

### Community 40 - "scheduled-work.ts"
Cohesion: 0.08
Nodes (48): deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), metadataRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), scheduledRollup() (+40 more)

### Community 41 - "telemetry.ts"
Cohesion: 0.12
Nodes (22): CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL, Rates (+14 more)

### Community 42 - "office/config.ts"
Cohesion: 0.11
Nodes (17): ref_node_stream, ref_node_timers, args, [cmd,...rawArgs], commands, key, projectIndex, INVOCATION_SOURCE_REFS (+9 more)

### Community 43 - "cec/workflow.ts"
Cohesion: 0.10
Nodes (39): applyIntakeObservation(), parksInJira(), MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), run(), advance(), nextStage() (+31 more)

### Community 44 - "lesson-selection.ts"
Cohesion: 0.13
Nodes (21): INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), LessonSelection, MAINTENANCE, MAX_LESSONS (+13 more)

### Community 45 - ".save"
Cohesion: 0.24
Nodes (23): BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue(), readIssues(), commentDecision() (+15 more)

### Community 46 - "conversations/conversations.ts"
Cohesion: 0.08
Nodes (37): assertConversationReadback(), uncertainConversations(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO() (+29 more)

### Community 47 - "it-specialist.ts"
Cohesion: 0.15
Nodes (22): conversationReadbackReady(), queueConversationReadback(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), ITContext, readBackConversations() (+14 more)

### Community 48 - "enrollment-gate.ts"
Cohesion: 0.21
Nodes (26): dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), resume(), startPilot(), eligibility(), featureEffectGate() (+18 more)

### Community 50 - "coordination.ts"
Cohesion: 0.05
Nodes (60): Admission, admit(), IntakeContext, WAIT_STATUSES, compatible(), dependencyCompletionKey(), dependencyEligibility(), DependencyStores (+52 more)

### Community 51 - "run-accounting.ts"
Cohesion: 0.15
Nodes (22): BoundedRead, backfillClaudeCost(), CompletionReader, codexHome(), readCodexRollout(), HELPER_STDOUT_MAX_BYTES, helperAccounting(), claudeAccounting() (+14 more)

### Community 52 - "review-run.ts"
Cohesion: 0.17
Nodes (21): featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), reserveReplacement(), stageBudget(), classifyFeatureFailure(), recoverFailure(), wakeFeature() (+13 more)

### Community 53 - "worker-runtime.ts"
Cohesion: 0.06
Nodes (45): candidateWorkspaceEnvironment(), assertDigestDispatch(), contextPacket(), officeCapacity, CODEX_DEFAULT_EFFORT, CODEX_DEFAULT_MODEL, CODEX_EFFORTS, CODEX_ROLES (+37 more)

### Community 54 - "scheduler.ts"
Cohesion: 0.11
Nodes (18): ROLES, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch(), deliveryOccupied() (+10 more)

### Community 55 - "jira-time.ts"
Cohesion: 0.14
Nodes (20): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+12 more)

### Community 56 - "service-health.ts"
Cohesion: 0.20
Nodes (8): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, ServiceHealth

### Community 57 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 58 - ".emit"
Cohesion: 0.15
Nodes (23): configureChannelNotices(), configureNotices(), retryRecipientLookup(), enqueueGreen156(), bindDiscoveryResume(), DiscoveryResumeInput, enqueueMetadataRecovery(), configureDigestDelivery() (+15 more)

### Community 59 - "relink-pin-courier.ts"
Cohesion: 0.24
Nodes (10): readBackOrThrow(), retryRead(), editorMatches(), relinkPinCourier(), sha(), MISSING_NATIVE_LINK, resumeLinkedDelivery(), Execute (+2 more)

### Community 60 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (10): ref_react_three_drei, ref_react_three_fiber, ref_three_stdlib, CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility (+2 more)

### Community 61 - "recoverDiscovery"
Cohesion: 0.24
Nodes (8): diagnosticProof(), ownedArtifact(), rawHash(), recoverDiscovery(), scopeNote(), GitHubOperations, closeNativeRefresh(), fingerprint()

### Community 62 - "record-trigger.ts"
Cohesion: 0.06
Nodes (63): deliveryMetrics(), median(), baselineLearning(), LEARNING_BASELINES, maintainLearning(), configureKnowledge(), maintenanceSubject(), MaintenanceSubjectFacts (+55 more)

### Community 63 - "ControlStore"
Cohesion: 0.18
Nodes (6): DailyCTO, reviewWeekday(), Briefing, saveReviewBriefing(), ControlStore, DailyCTOReport

### Community 64 - "FeatureWorkspace.tsx"
Cohesion: 0.08
Nodes (37): FeatureQuestionProjection, FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), send(), phases, draftKey() (+29 more)

### Community 65 - "Store"
Cohesion: 0.06
Nodes (32): ref_zod, accounting, DeliverySubject, nonDelivery, originalReads, diagnosticContext(), diagnosticSnapshot(), nativeDeliveryResolved() (+24 more)

### Community 66 - "remove-candidate.ts"
Cohesion: 0.19
Nodes (17): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+9 more)

### Community 67 - "ref_node_crypto"
Cohesion: 0.15
Nodes (27): ref_node_crypto, commandFeature(), reviewQuestions(), confirmBrief(), FeaturePlanningBindings, FeaturePlanningConfig, POLICY_VERSION, assertQuestionVisibility() (+19 more)

### Community 68 - "local-config.ts"
Cohesion: 0.28
Nodes (11): AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), goalEvidencePath(), OfficeConfigInputs, officeConfigRoute(), officeConfigSummary(), CECBinding, localBindings (+3 more)

### Community 69 - "Coordinator"
Cohesion: 0.08
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 70 - "azure.ts"
Cohesion: 0.11
Nodes (25): az(), base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs(), GitHubMonitor (+17 more)

### Community 71 - "tracking-issue.ts"
Cohesion: 0.33
Nodes (10): ensureTrackingIssue(), findTrackingIssue(), ownTracking(), TrackingIssue, trackingIssueBody(), trackingIssueTitle(), trackingMarker(), centralCompanionHandoff() (+2 more)

### Community 72 - "investigations/run.ts"
Cohesion: 0.15
Nodes (23): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationCandidates(), investigationId(), investigationEvidence(), investigationFollowUps(), investigationResolution(), syncInvestigations() (+15 more)

### Community 73 - "admit-improvement.ts"
Cohesion: 0.21
Nodes (16): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+8 more)

### Community 74 - "useOfficePreferences.ts"
Cohesion: 0.26
Nodes (10): acceptPreferences(), PreferenceCandidate, strip(), UNKNOWN_PREFERENCES, OfficePreferencesController, PreferenceFeedback, PreferenceField, requestPreferences() (+2 more)

### Community 75 - "shared.ts"
Cohesion: 0.06
Nodes (50): conversationResolved(), projectOutbox(), syncOutbox(), finishSupersededReadback(), projectSlackDeliveries(), settleRequestedSlackReplacement(), Input, supersedeSlackDelivery() (+42 more)

### Community 76 - "accept-stage-result.ts"
Cohesion: 0.13
Nodes (25): DECISION_KINDS, needsDecision(), park(), acceptStageResult(), acceptConflictRepair(), recordJobApproach(), METADATA_FINDING, mergeAuthorized() (+17 more)

### Community 77 - "node-visuals.ts"
Cohesion: 0.29
Nodes (7): LabelRectangle, visibleLabels(), stableHash(), stablePosition(), nodeVisuals(), SCENE_COLOR_TOKENS, TOKENS

### Community 78 - "extraction.ts"
Cohesion: 0.33
Nodes (4): ref_node_string_decoder, extractDocument, Extraction, Extractor

### Community 79 - "daily-cto.ts"
Cohesion: 0.12
Nodes (19): EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), applyGoalReview(), DailyResultSchema, EvidenceRefSchema, FreshDailyResultSchema, GoalEvidenceRequestSchema (+11 more)

### Community 80 - "assignment-poll.ts"
Cohesion: 0.19
Nodes (12): noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), admitReadyCards(), ACTIONS, OWNER, wikiSync, due() (+4 more)

### Community 82 - "run-usage.ts"
Cohesion: 0.38
Nodes (5): CodexRollout, claudeCrashZero(), claudeUsage(), count(), RunUsage

### Community 83 - "control-store.ts"
Cohesion: 0.15
Nodes (11): ref_node_sqlite, sourceSchema(), Clock, applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, statementCache() (+3 more)

### Community 84 - "process.ts"
Cohesion: 0.07
Nodes (30): ref_node_child_process, ref_node_url, file, folder, logs, root, GitHubFeaturePublisher, CommandRegistry (+22 more)

### Community 85 - "fact-bounds.ts"
Cohesion: 0.25
Nodes (15): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+7 more)

### Community 86 - "codex-rollout-file.ts"
Cohesion: 0.43
Nodes (6): createdAt(), dayDirs(), header(), ROLLOUT_MAX_BYTES, RolloutScan, scanCodexRollouts()

### Community 87 - "owned-artifact.ts"
Cohesion: 0.73
Nodes (5): done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf()

### Community 88 - "preferences-store.ts"
Cohesion: 0.17
Nodes (10): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS (+2 more)

### Community 89 - "handover-cms.ts"
Cohesion: 0.40
Nodes (4): ref_smol_toml, file, project, root

### Community 90 - "telemetry/report.ts"
Cohesion: 0.22
Nodes (15): TelemetryReport, TelemetryRow, TelemetrySync, Acc, bump(), EASTERN, easternDay(), modelShares() (+7 more)

### Community 91 - "SlackIntakeStatus.tsx"
Cohesion: 0.60
Nodes (4): format, labels, SlackIntakeStatus(), time()

### Community 93 - "highestStableAtLeast"
Cohesion: 0.83
Nodes (3): compare(), highestStableAtLeast(), parts()

### Community 94 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 103 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (6): ref_mammoth, ref_pdfjs_dist, bounded(), extract(), fail(), [path,kind]

### Community 106 - "helper-evidence.py"
Cohesion: 0.33
Nodes (5): importlib_util, json, pathlib, Read-only protocol adapter for the installed review helper. No model dispatch., sys

## Knowledge Gaps
- **486 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+481 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 623 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `artifact`, `github-readiness.ts`, `preparation-readback.ts`, `engine.ts`, `digest`, `knowledge/routes.ts`, `features.ts`, `.transaction`, `SourceRegistry`, `scheduled-captures.ts`, `App.tsx`, `ref_node_util`, `requests.ts`, `session-bridge.ts`, `source-amendment.ts`, `agents.ts`, `github-delivery.ts`, `FeatureError`, `maintenance/maintenance.ts`, `offices.ts`, `knowledge.ts`, `digest`, `Effects`, `dependency-bots/adopt.ts`, `slack-intake/config.ts`, `index.ts`, `ticket-evidence.ts`, `time-scope.ts`, `harnessEffect`, `closeout-recovery.ts`, `scheduled-work.ts`, `cec/workflow.ts`, `lesson-selection.ts`, `.save`, `conversations/conversations.ts`, `it-specialist.ts`, `enrollment-gate.ts`, `.pump`, `coordination.ts`, `run-accounting.ts`, `review-run.ts`, `worker-runtime.ts`, `scheduler.ts`, `jira-time.ts`, `.emit`, `relink-pin-courier.ts`, `recoverDiscovery`, `record-trigger.ts`, `remove-candidate.ts`, `ref_node_crypto`, `Coordinator`, `azure.ts`, `tracking-issue.ts`, `investigations/run.ts`, `admit-improvement.ts`, `shared.ts`, `accept-stage-result.ts`, `daily-cto.ts`, `control-store.ts`, `process.ts`, `ProjectProgress`?**
  _High betweenness centrality (0.101) - this node is a cross-community bridge._
- **Why does `TicketJob` connect `github-delivery.ts` to `artifact`, `github-readiness.ts`, `preparation-readback.ts`, `engine.ts`, `Inspector.tsx`, `App.tsx`, `ref_node_util`, `requests.ts`, `source-amendment.ts`, `digest`, `Effects`, `dependency-bots/adopt.ts`, `harnessEffect`, `closeout-recovery.ts`, `cec/workflow.ts`, `it-specialist.ts`, `coordination.ts`, `worker-runtime.ts`, `scheduler.ts`, `relink-pin-courier.ts`, `record-trigger.ts`, `Store`, `remove-candidate.ts`, `shared.ts`, `accept-stage-result.ts`, `fact-bounds.ts`, `ProjectProgress`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `Engine` connect `engine.ts` to `github-readiness.ts`, `Store`, `.emit`, `Coordinator`, `azure.ts`, `scheduled-work.ts`, `.transaction`, `cec/workflow.ts`, `scheduled-captures.ts`, `conversations/conversations.ts`, `enrollment-gate.ts`, `requests.ts`, `coordination.ts`, `github-delivery.ts`, `maintenance/maintenance.ts`, `offices.ts`, `Effects`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _486 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `artifact` be split into smaller, more focused modules?**
  _Cohesion score 0.0688230008984726 - nodes in this community are weakly interconnected._
- **Should `github-readiness.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08531187122736418 - nodes in this community are weakly interconnected._
- **Should `engine.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05660377358490566 - nodes in this community are weakly interconnected._