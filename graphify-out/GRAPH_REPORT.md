# Graph Report - pin-courier-companion-map  (2026-11-10)

## Corpus Check
- 683 files · ~283,000 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3502 nodes · 15452 edges · 106 communities (103 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 96 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1499572c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- github-delivery.ts
- source-amendment-scope.ts
- Inspector.tsx
- artifact
- requests.ts
- TicketJob
- preparation-readback.ts
- interrupted-work-recovery.ts
- App.tsx
- OfficeScene.tsx
- record-trigger.ts
- Role
- agents.ts
- knowledge/routes.ts
- worker-runtime.ts
- Library.tsx
- index.tsx
- dependency-bots/adopt.ts
- scheduled-work.ts
- sourceVisible
- offices.ts
- schedule.ts
- maintenance.ts
- slack-intake/run.ts
- MapView.tsx
- session-bridge.ts
- conversations/conversations.ts
- dependencies.ts
- easternDay
- knowledge.ts
- coordination.ts
- .emit
- sources/admission.ts
- harnessEffect
- investigations/run.ts
- run-retrospective.ts
- WorkTime
- park-ticket.ts
- features.ts
- process.ts
- index.ts
- IntakeLedger
- workKey
- resume-provider-review.ts
- accept-retrospective.ts
- github/issue-publication.ts
- assignments.ts
- slack-intake/report.ts
- service-health.ts
- preferences-store.ts
- scheduler.ts
- lesson-selection.ts
- digest
- activation-recovery.ts
- recovery.ts
- jira-time.ts
- shared.ts
- remove-candidate.ts
- Coordinator
- OfficeSnapshot
- TimeBook.tsx
- cec/workflow.ts
- investigations/ledger.ts
- model-routes.ts
- outbox.ts
- knowledge/context.ts
- .transaction
- engine.ts
- goal-reviews.ts
- azure.ts
- weekly-rollup.ts
- notifications.ts
- codex-rollout.ts
- tracking-issue.ts
- Store
- telemetry/report.ts
- telemetry.ts
- publish-pr.ts
- admit-improvement.ts
- github-check-selection.ts
- fact-bounds.ts
- run-accounting.ts
- Ticket
- projects.ts
- MaintenanceRun
- clock.ts
- blocker-followups.ts
- .pump
- .save
- run-usage.ts
- DailyCTO.tsx
- validate-stage.ts
- coordination-tick.ts
- command-registry.ts
- migration.ts
- useOfficePreferences.ts
- source-amendment.ts
- diagnostic-context.ts
- owned-artifact.ts
- launch-policy.ts
- codex-rollout-file.ts
- extract-worker.mjs
- SlackIntakeStatus.tsx
- slack-supersession.ts
- helper-evidence.py

## God Nodes (most connected - your core abstractions)
1. `Store` - 316 edges
2. `TicketJob` - 134 edges
3. `GitHubDelivery` - 122 edges
4. `command()` - 103 edges
5. `artifact()` - 89 edges
6. `cx()` - 88 edges
7. `digest()` - 86 edges
8. `workKey()` - 85 edges
9. `OfficeSnapshot` - 70 edges
10. `digest()` - 66 edges

## Surprising Connections (you probably didn't know these)
- `readAzurePRs()` --indirect_call--> `row()`  [INFERRED]
  server/cec/observed-prs.ts → src/telemetry/report.ts
- `rows()` --indirect_call--> `row()`  [INFERRED]
  server/delivery/recovery/source-amendment/source-amendment-held.ts → src/telemetry/report.ts
- `proveOutsideAmendmentUnchanged()` --indirect_call--> `row()`  [INFERRED]
  server/delivery/recovery/source-amendment/source-amendment-held.ts → src/telemetry/report.ts
- `rows()` --indirect_call--> `row()`  [INFERRED]
  server/delivery/recovery/source-amendment/source-amendment-scope.ts → src/telemetry/report.ts
- `tree()` --indirect_call--> `row()`  [INFERRED]
  server/features/planning-baseline.ts → src/telemetry/report.ts

## Import Cycles
- 3-file cycle: `src/knowledge/map/Constellation.tsx -> src/knowledge/map/constellation-runtime.ts -> src/knowledge/map/node-visuals.ts -> src/knowledge/map/Constellation.tsx`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/stage-reconciliation.ts -> server/delivery/recovery/implementation/continuation-review-readback.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/preparation/post-conflict-preparation.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts`
- 3-file cycle: `server/conversations/notifications.ts -> server/conversations/slack.ts -> server/knowledge/digests/outbound.ts -> server/conversations/notifications.ts`
- 3-file cycle: `server/conversations/notifications.ts -> server/knowledge/digests/send-notice.ts -> server/knowledge/digests/outbound.ts -> server/conversations/notifications.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/recovery/retire-external-delivery.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-guard.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/queue-repairs.ts -> server/delivery/repairs/reconcile-ci-diagnosis.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/parking/resume-provider-review.ts -> server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/parking/resume-provider-review.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-publication.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/conversations/conversations.ts -> server/conversations/slack.ts -> server/workers/agents.ts -> server/conversations/conversations.ts`
- 3-file cycle: `server/conversations/slack.ts -> server/workers/agents.ts -> server/workers/worker-runtime.ts -> server/conversations/slack.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/scope-repair/scope-repair-resume.ts -> server/delivery/recovery/validation/validation-provider-context.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/conversations/conversations.ts -> server/scheduling/engine.ts -> server/workers/agents.ts -> server/conversations/conversations.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/stage-prompts.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-checkout.ts -> server/delivery/pipeline/github-delivery.ts`

## Communities (106 total, 3 thin omitted)

### Community 0 - "github-delivery.ts"
Cohesion: 0.06
Nodes (66): containedFile(), findingsBlock(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery(), BOARD_RULE, conflictRefreshInstruction() (+58 more)

### Community 1 - "source-amendment-scope.ts"
Cohesion: 0.08
Nodes (38): approvedText(), assert(), assert(), normalize(), officialUrls, ReleaseCapture, verifyReleaseCaptures(), amendmentCaptureObservation() (+30 more)

### Community 2 - "Inspector.tsx"
Cohesion: 0.06
Nodes (73): Conversation(), Outbox(), SendMessage, recommendedReply(), slackMessageStatus(), SlackDeliveryCard(), ServiceHealthPanel(), labels (+65 more)

### Community 3 - "artifact"
Cohesion: 0.08
Nodes (98): PrerequisitesSchema, verifiedCloseoutCleanupRequest(), advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat(), allowed (+90 more)

### Community 4 - "requests.ts"
Cohesion: 0.08
Nodes (55): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+47 more)

### Community 5 - "TicketJob"
Cohesion: 0.09
Nodes (54): removeAdoptedClone(), namedRepairIds(), StageContext, GitHubDelivery, hasUncertainEffects(), checksFailed(), refreshMergeReview(), Ownership (+46 more)

### Community 6 - "preparation-readback.ts"
Cohesion: 0.09
Nodes (29): hasSavedPrerequisiteResult(), assertPostConflictOwnership(), bindPreparationBoardOrigins(), claimSchema, eventSchema, PreparationBoardOrigin, readPreparationBoardOrigins(), timestamp (+21 more)

### Community 7 - "interrupted-work-recovery.ts"
Cohesion: 0.14
Nodes (13): channelNoticeAuthorized(), MergeNotifications, SlackMessages, SlackRequestSchema, digestNoticeNeverDispatched(), goalNoticeAuthorized(), goalNoticeNeverDispatched(), sendGoalNotice() (+5 more)

### Community 8 - "App.tsx"
Cohesion: 0.05
Nodes (59): compactSteps(), themeColor, App(), BrainWorkspace, CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants (+51 more)

### Community 9 - "OfficeScene.tsx"
Cohesion: 0.06
Nodes (57): displayAgentTask(), githubStageLabels, withoutElapsed(), CameraBookmark, restoreBookmark(), LiveAgentTask(), Props, RunningTask() (+49 more)

### Community 10 - "record-trigger.ts"
Cohesion: 0.11
Nodes (37): baselineLearning(), LEARNING_BASELINES, maintainLearning(), clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates(), maintenanceCompletedId() (+29 more)

### Community 11 - "Role"
Cohesion: 0.10
Nodes (41): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+33 more)

### Community 12 - "agents.ts"
Cohesion: 0.08
Nodes (34): cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), MessageInput, cecChatPrompt(), ctoChatPrompt(), itChatPrompt() (+26 more)

### Community 13 - "knowledge/routes.ts"
Cohesion: 0.10
Nodes (17): committedNotePage(), BrainGraph, BrainNote, BrainReader, CommittedBrain, GraphNode, GraphPage, hash (+9 more)

### Community 14 - "worker-runtime.ts"
Cohesion: 0.10
Nodes (30): candidateWorkspaceEnvironment(), assertDigestDispatch(), dispatchExposure(), prepareExposure(), contextPacket(), resolveModelRoute(), labels, toolActivity() (+22 more)

### Community 15 - "Library.tsx"
Cohesion: 0.10
Nodes (30): KnowledgeCapturePage, KnowledgeActivity, KnowledgeActivityPage, KnowledgeEdge, KnowledgeIntakeStatus, Activity(), ActivityStatus(), AssignmentKnowledge() (+22 more)

### Community 16 - "index.tsx"
Cohesion: 0.08
Nodes (54): KnowledgeCadence, KnowledgeDestination, KnowledgeSourceKind, KnowledgeSourceState, KnowledgeSourceSummary, empty, AddPublicSource(), AddSourceForm() (+46 more)

### Community 17 - "dependency-bots/adopt.ts"
Cohesion: 0.15
Nodes (24): adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR, openDependabotPulls(), readRepo() (+16 more)

### Community 18 - "scheduled-work.ts"
Cohesion: 0.09
Nodes (44): deliverySlot(), closeoutRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), validTicket(), deterministicActions, eligible() (+36 more)

### Community 19 - "sourceVisible"
Cohesion: 0.18
Nodes (27): knowledgeActivity(), guidanceExcerpt(), knowledgeSnapshot(), officeKnowledgeSnapshot(), publicReference(), lookupSummaryVisible(), publicLookupSummary(), evidenceTitle() (+19 more)

### Community 20 - "offices.ts"
Cohesion: 0.10
Nodes (27): diagnosticSnapshot(), retainedArtifactScope(), eventVisible(), leadershipContext(), leadershipEntries(), assignmentSubject(), knowledgeEntries(), knowledgeOfficeState() (+19 more)

### Community 21 - "schedule.ts"
Cohesion: 0.15
Nodes (23): KnowledgeRunner, captureProposal(), effectId(), CaptureReceipt, LIMITS, SlackReadAuthority, LinkResult, PublicReadPolicy (+15 more)

### Community 22 - "maintenance.ts"
Cohesion: 0.10
Nodes (27): maintenancePolicies(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice(), candidateOwner(), SETTLED (+19 more)

### Community 23 - "slack-intake/run.ts"
Cohesion: 0.15
Nodes (21): ChannelProgress, IntakeResult, IntakeResultValue, ReadKind, SourceUnit, Message, observeRead(), Page (+13 more)

### Community 24 - "MapView.tsx"
Cohesion: 0.09
Nodes (32): KnowledgeMap, KnowledgeNode, CameraPose, flightPose(), cameraTarget(), Point, Constellation(), ConstellationView (+24 more)

### Community 25 - "session-bridge.ts"
Cohesion: 0.10
Nodes (28): claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexSessionContext(), readRollout, claudeSessions(), codexSessions() (+20 more)

### Community 26 - "conversations/conversations.ts"
Cohesion: 0.11
Nodes (27): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, ReplySchema, pumpCTO(), queueCTOHandoff(), saveGoals() (+19 more)

### Community 27 - "dependencies.ts"
Cohesion: 0.18
Nodes (18): Admission, admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, resumeParked(), compatible(), dependencyCompletionKey() (+10 more)

### Community 28 - "easternDay"
Cohesion: 0.11
Nodes (22): retryDelay(), mirror(), ResearchResult, runWeeklyResearch(), scheduledResearch(), DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts (+14 more)

### Community 29 - "knowledge.ts"
Cohesion: 0.10
Nodes (34): eventSourceBindings(), improvementIntakeGate(), captureLearning(), learningDigest(), recordLearningOpportunity(), exposureBindings(), requestSourceBindings(), captureMaintenanceStep() (+26 more)

### Community 30 - "coordination.ts"
Cohesion: 0.18
Nodes (15): checkpointWindow(), dueAt(), hours, localDay(), ReviewResult, deferNonReady(), preparePR(), recheck() (+7 more)

### Community 31 - ".emit"
Cohesion: 0.19
Nodes (20): ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), configureNotices(), retryRecipientLookup(), bindDiscoveryResume(), DiscoveryResumeInput (+12 more)

### Community 32 - "sources/admission.ts"
Cohesion: 0.26
Nodes (10): createExtractor(), extractDocument, Extraction, Extractor, uploadArtifact(), privateFile(), readIntakeReport(), checkedReceipt() (+2 more)

### Community 33 - "harnessEffect"
Cohesion: 0.18
Nodes (22): MOVABLE, moveLane(), harnessCloseout(), PASSING, verifyMergeActions(), activeEffectId(), harnessEffect, assertMayMutate() (+14 more)

### Community 34 - "investigations/run.ts"
Cohesion: 0.14
Nodes (22): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_FIX_PROMPT, OfficeFixResult (+14 more)

### Community 35 - "run-retrospective.ts"
Cohesion: 0.09
Nodes (38): appendLearningFacts(), freezeLearningPacket(), ARTIFACT_LIMIT, clip(), LEDGER_STEPS, MAINTENANCE_LIMIT, maintenanceFacts(), MaintenancePacketSection (+30 more)

### Community 36 - "WorkTime"
Cohesion: 0.12
Nodes (34): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence(), CaptureContext (+26 more)

### Community 37 - "park-ticket.ts"
Cohesion: 0.15
Nodes (30): JiraOperations, plain(), unpack(), BLOCKED, Execute, findComment(), jira(), LiveIssue (+22 more)

### Community 38 - "features.ts"
Cohesion: 0.10
Nodes (49): approveFeature(), assertRetainedItems(), commandFeature(), createFeature(), featureById(), mutation(), reviewQuestions(), discoveryPrompt() (+41 more)

### Community 39 - "process.ts"
Cohesion: 0.15
Nodes (18): At, Errno, GroupInventory, GroupProbe, LifecycleDiagnostic, Phase, Pid, groupInventory() (+10 more)

### Community 40 - "index.ts"
Cohesion: 0.08
Nodes (34): args, [cmd,...rawArgs], commands, key, projectIndex, close(), config, itSpecialist (+26 more)

### Community 41 - "IntakeLedger"
Cohesion: 0.15
Nodes (25): independentIntakeResult(), newTask(), recordObservation(), settlePage(), Observation, DERIVED, IntakeLedger, acceptProposals() (+17 more)

### Community 42 - "workKey"
Cohesion: 0.08
Nodes (45): completedPRReviews(), continuationScope(), Assessment, diagnosticProof(), discoveryRecoveryCandidate(), ownedArtifact(), Ownership, rawHash() (+37 more)

### Community 43 - "resume-provider-review.ts"
Cohesion: 0.17
Nodes (27): Lane, resolveLane(), cardStatus(), Execute, ProjectCard, projectCards(), projectGraphql(), setCardStatus() (+19 more)

### Community 44 - "accept-retrospective.ts"
Cohesion: 0.11
Nodes (30): Accepted, acceptRetrospective(), normalizeStatement(), RETROSPECTIVE_HISTORY, decideOfficeProposal(), mirrorOfficeKnowledge(), now(), OfficeKnowledgeStore (+22 more)

### Community 45 - "github/issue-publication.ts"
Cohesion: 0.11
Nodes (18): Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), plainDescription(), Transition, FeaturePublisher (+10 more)

### Community 46 - "assignments.ts"
Cohesion: 0.17
Nodes (12): assignmentKnowledge(), AssignmentLookups, Binding, lookupInstructions(), decodeLookupJournal(), lookupJournal, readLookupJournal(), referenceVisible() (+4 more)

### Community 47 - "slack-intake/report.ts"
Cohesion: 0.18
Nodes (25): Proposal, ReadTask, isStoppingFor(), reconcileIntakeStatus(), intakeProgress(), terminalDeferred(), unitKey(), verifiedCapture() (+17 more)

### Community 48 - "service-health.ts"
Cohesion: 0.19
Nodes (8): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, ServiceHealth

### Community 49 - "preferences-store.ts"
Cohesion: 0.19
Nodes (10): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS (+2 more)

### Community 50 - "scheduler.ts"
Cohesion: 0.15
Nodes (13): ROLES, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch(), foreignWork() (+5 more)

### Community 51 - "lesson-selection.ts"
Cohesion: 0.12
Nodes (27): knowledgeContext(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), LessonSelection, MAINTENANCE (+19 more)

### Community 52 - "digest"
Cohesion: 0.15
Nodes (26): comparableSlackText(), AuthoredDigest, reconcileDigestAuthorship(), unitAuthorship(), annotateAuthoredUnits(), outboundBody(), retainOutboundBody(), digestNoticeRequest() (+18 more)

### Community 53 - "activation-recovery.ts"
Cohesion: 0.14
Nodes (30): boardPreflightCandidate(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal (+22 more)

### Community 54 - "recovery.ts"
Cohesion: 0.24
Nodes (8): featureItemComplete(), reconcileFeatureCompletion(), currentApproval(), recoverFeatures(), observeHelperGroups(), stopHelperGroups(), FeatureReviewRunner, scheduledFeatures()

### Community 55 - "jira-time.ts"
Cohesion: 0.21
Nodes (13): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+5 more)

### Community 56 - "shared.ts"
Cohesion: 0.09
Nodes (28): ProjectReadiness, DailyCTOSummary, AssignmentResult, CompletionCondition, Continuation, DependencyObservation, EligibilityState, FailureCategory (+20 more)

### Community 57 - "remove-candidate.ts"
Cohesion: 0.21
Nodes (15): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+7 more)

### Community 59 - "OfficeSnapshot"
Cohesion: 0.13
Nodes (20): FeatureRound, FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures(), draftKey() (+12 more)

### Community 60 - "TimeBook.tsx"
Cohesion: 0.10
Nodes (35): TelemetryReport, LiveAnchor, AzureBuild, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens() (+27 more)

### Community 61 - "cec/workflow.ts"
Cohesion: 0.13
Nodes (33): correlatedBuild(), parksInJira(), MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), run(), advance(), nextStage() (+25 more)

### Community 62 - "investigations/ledger.ts"
Cohesion: 0.23
Nodes (15): projectSlackDeliveries(), settleRequestedSlackReplacement(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint(), supersedingDelivery(), investigationCandidates() (+7 more)

### Community 63 - "model-routes.ts"
Cohesion: 0.23
Nodes (10): assertModelOverrides(), CODEX_DEFAULT_EFFORT, CODEX_DEFAULT_MODEL, CODEX_EFFORTS, CODEX_ROLES, ModelRoute, qaPolicyRoute(), validModelSetting() (+2 more)

### Community 64 - "outbox.ts"
Cohesion: 0.21
Nodes (13): projectOutbox(), syncOutbox(), slackRequestSettled(), knowledgeOutbox(), checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), repeatedVendorReviewBlock() (+5 more)

### Community 65 - "knowledge/context.ts"
Cohesion: 0.21
Nodes (14): intakeActivity(), knowledgeActivityPage(), KnowledgeContext, independentDigestEvidence(), prepareDigestBodies(), retainDigestBody(), publicationConnections(), evidenceRead() (+6 more)

### Community 66 - ".transaction"
Cohesion: 0.14
Nodes (14): publishFeature(), reserveIdentity(), GitHubOperations, fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), Assessment, closeNativeRefresh() (+6 more)

### Community 67 - "engine.ts"
Cohesion: 0.08
Nodes (25): checkMail(), drainMail(), requestMail(), dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), resume() (+17 more)

### Community 68 - "goal-reviews.ts"
Cohesion: 0.14
Nodes (16): applyGoalReview(), EvidenceRefSchema, FreshDailyResultSchema, statusAllowed(), workEvidence(), GoalInput, saveGoal(), queueGoalNotice() (+8 more)

### Community 69 - "azure.ts"
Cohesion: 0.09
Nodes (31): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+23 more)

### Community 70 - "weekly-rollup.ts"
Cohesion: 0.13
Nodes (21): deliveryMetrics(), median(), expireLearningPackets(), packetReferences(), learningMetrics(), lessonsNeedingReview(), RollupResult, RollupResultSchema (+13 more)

### Community 71 - "notifications.ts"
Cohesion: 0.18
Nodes (15): clamp(), LIMITS, MergedPR, plainSlackText(), section(), shippedSummary(), Identity, mergeText() (+7 more)

### Community 72 - "codex-rollout.ts"
Cohesion: 0.27
Nodes (10): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO (+2 more)

### Community 73 - "tracking-issue.ts"
Cohesion: 0.19
Nodes (17): readBackOrThrow(), ensureTrackingIssue(), findTrackingIssue(), ownTracking(), TrackingIssue, trackingIssueBody(), trackingIssueTitle(), trackingMarker() (+9 more)

### Community 74 - "Store"
Cohesion: 0.07
Nodes (16): GitHubFeaturePublisher, helperTelemetry(), JiraFeaturePublisher, Result, officeCapacity, initializeStoreSchema(), Store, checkpointMeasurement() (+8 more)

### Community 75 - "telemetry/report.ts"
Cohesion: 0.29
Nodes (12): Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked(), row() (+4 more)

### Community 76 - "telemetry.ts"
Cohesion: 0.11
Nodes (24): CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL, Rates (+16 more)

### Community 77 - "publish-pr.ts"
Cohesion: 0.26
Nodes (13): retryRead(), developerPRContent(), Execute, lintPRContent(), officePRContent(), prContent, assertCandidate(), Candidate (+5 more)

### Community 78 - "admit-improvement.ts"
Cohesion: 0.23
Nodes (14): assertFeatureDependencyOrder(), featureDependencyEdges(), key(), admitImprovement(), distinct(), identity(), improvementIncident(), improvementIncidentKey() (+6 more)

### Community 79 - "github-check-selection.ts"
Cohesion: 0.26
Nodes (15): checksPassed(), checksPending(), CurrentChecksWait, currentMergeChecks(), pass(), pending(), requireThat(), resumeReviewedMerge() (+7 more)

### Community 80 - "fact-bounds.ts"
Cohesion: 0.26
Nodes (15): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+7 more)

### Community 81 - "run-accounting.ts"
Cohesion: 0.16
Nodes (18): BoundedRead, EvidenceOutcome, backfillClaudeCost(), CompletionReader, HELPER_STDOUT_MAX_BYTES, helperAccounting(), claudeAccounting(), COMPLETION_MAX_BYTES (+10 more)

### Community 82 - "Ticket"
Cohesion: 0.22
Nodes (7): cecPrompt(), resolvedDecisionNote(), stageInstructions, reviewInstructions(), Agents, Stage, Ticket

### Community 83 - "projects.ts"
Cohesion: 0.13
Nodes (19): captureAfter(), CaptureMetadata, capturePage(), cursor(), key(), captureIdentityMatches(), BrainCaptureReceipt, hash (+11 more)

### Community 84 - "MaintenanceRun"
Cohesion: 0.16
Nodes (16): completeNativeCheckpoint(), BrainStatusSchema, identity, coverageSchema, followupSchema, verified, queueCheckpointRetry(), readBackCheckpoint() (+8 more)

### Community 85 - "clock.ts"
Cohesion: 0.14
Nodes (11): Clock, EASTERN, easternDayFormatter, easternPartsFormatter, systemClock, applyConnectionSettings(), closeConnection(), optimizeOnOpen() (+3 more)

### Community 86 - "blocker-followups.ts"
Cohesion: 0.16
Nodes (21): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved() (+13 more)

### Community 88 - ".save"
Cohesion: 0.26
Nodes (6): file, folder, logs, root, xml(), ProjectProgress

### Community 89 - "run-usage.ts"
Cohesion: 0.32
Nodes (6): CodexRollout, claudeCrashZero(), claudeUsage(), codexUsage(), count(), RunUsage

### Community 90 - "DailyCTO.tsx"
Cohesion: 0.26
Nodes (8): CTOReview(), goalState, DailyCTO(), GoalHistory(), reportDate(), reviewStatus, reviewExcerpt(), ReviewText()

### Community 91 - "validate-stage.ts"
Cohesion: 0.16
Nodes (17): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+9 more)

### Community 92 - "coordination-tick.ts"
Cohesion: 0.27
Nodes (9): reconcileNoticeConfirmations(), brainCheckpointCompletion(), reconcileCompletedCheckpoints(), legacy, reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION (+1 more)

### Community 93 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 94 - "migration.ts"
Cohesion: 0.30
Nodes (8): Config, configDigest(), IntakeConfig, readConfig(), configDigestForSeed(), copyRecords(), Cutover, migrateIntake()

### Community 95 - "useOfficePreferences.ts"
Cohesion: 0.26
Nodes (10): acceptPreferences(), PreferenceCandidate, strip(), UNKNOWN_PREFERENCES, OfficePreferencesController, PreferenceFeedback, PreferenceField, requestPreferences() (+2 more)

### Community 96 - "source-amendment.ts"
Cohesion: 0.11
Nodes (35): deliveryTask(), DeliveryTaskInput, DISCOVERY_GUIDANCE, stagePrompt(), StagePromptInput, adoptCandidate(), reported, Scope (+27 more)

### Community 97 - "diagnostic-context.ts"
Cohesion: 0.46
Nodes (4): diagnosticContext(), itAgent(), itDiagnostics(), currentServices()

### Community 98 - "owned-artifact.ts"
Cohesion: 0.54
Nodes (6): ghLogCacheEvidence(), done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf()

### Community 99 - "launch-policy.ts"
Cohesion: 0.60
Nodes (4): LaunchPolicy, launchPolicyFacts(), LaunchPolicyReceipt, retainLaunchPolicy()

### Community 101 - "codex-rollout-file.ts"
Cohesion: 0.31
Nodes (8): codexHome(), createdAt(), dayDirs(), header(), readCodexRollout(), ROLLOUT_MAX_BYTES, RolloutScan, scanCodexRollouts()

### Community 104 - "extract-worker.mjs"
Cohesion: 0.70
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 105 - "SlackIntakeStatus.tsx"
Cohesion: 0.60
Nodes (4): format, labels, SlackIntakeStatus(), time()

### Community 106 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

## Knowledge Gaps
- **387 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+382 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `github-delivery.ts`, `artifact`, `requests.ts`, `TicketJob`, `preparation-readback.ts`, `interrupted-work-recovery.ts`, `record-trigger.ts`, `agents.ts`, `knowledge/routes.ts`, `worker-runtime.ts`, `dependency-bots/adopt.ts`, `scheduled-work.ts`, `offices.ts`, `schedule.ts`, `maintenance.ts`, `slack-intake/run.ts`, `session-bridge.ts`, `conversations/conversations.ts`, `dependencies.ts`, `easternDay`, `knowledge.ts`, `coordination.ts`, `.emit`, `sources/admission.ts`, `harnessEffect`, `investigations/run.ts`, `run-retrospective.ts`, `WorkTime`, `park-ticket.ts`, `features.ts`, `index.ts`, `IntakeLedger`, `workKey`, `resume-provider-review.ts`, `accept-retrospective.ts`, `github/issue-publication.ts`, `assignments.ts`, `slack-intake/report.ts`, `scheduler.ts`, `lesson-selection.ts`, `digest`, `activation-recovery.ts`, `recovery.ts`, `jira-time.ts`, `remove-candidate.ts`, `OfficeSnapshot`, `investigations/ledger.ts`, `knowledge/context.ts`, `.transaction`, `engine.ts`, `goal-reviews.ts`, `azure.ts`, `weekly-rollup.ts`, `notifications.ts`, `tracking-issue.ts`, `publish-pr.ts`, `admit-improvement.ts`, `run-accounting.ts`, `Ticket`, `MaintenanceRun`, `clock.ts`, `blocker-followups.ts`, `.pump`, `.save`, `validate-stage.ts`, `coordination-tick.ts`, `migration.ts`, `source-amendment.ts`, `diagnostic-context.ts`?**
  _High betweenness centrality (0.133) - this node is a cross-community bridge._
- **Why does `OfficeSnapshot` connect `OfficeSnapshot` to `Inspector.tsx`, `App.tsx`, `OfficeScene.tsx`, `record-trigger.ts`, `Role`, `Library.tsx`, `index.tsx`, `offices.ts`, `maintenance.ts`, `service-health.ts`, `scheduler.ts`, `shared.ts`, `TimeBook.tsx`, `cec/workflow.ts`, `investigations/ledger.ts`, `outbox.ts`, `azure.ts`, `Store`, `MaintenanceRun`, `DailyCTO.tsx`, `useOfficePreferences.ts`, `diagnostic-context.ts`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `command()` connect `Store` to `github-delivery.ts`, `requests.ts`, `TicketJob`, `preparation-readback.ts`, `agents.ts`, `knowledge/routes.ts`, `worker-runtime.ts`, `scheduled-work.ts`, `schedule.ts`, `maintenance.ts`, `session-bridge.ts`, `dependencies.ts`, `coordination.ts`, `sources/admission.ts`, `harnessEffect`, `park-ticket.ts`, `features.ts`, `process.ts`, `resume-provider-review.ts`, `github/issue-publication.ts`, `service-health.ts`, `jira-time.ts`, `remove-candidate.ts`, `.transaction`, `engine.ts`, `azure.ts`, `notifications.ts`, `publish-pr.ts`, `admit-improvement.ts`, `validate-stage.ts`, `command-registry.ts`, `source-amendment.ts`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `command()` (e.g. with `.constructor()` and `executeRequest()`) actually correct?**
  _`command()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _387 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `github-delivery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06478578892371996 - nodes in this community are weakly interconnected._
- **Should `source-amendment-scope.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08478513356562137 - nodes in this community are weakly interconnected._