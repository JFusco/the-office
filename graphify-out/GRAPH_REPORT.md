# Graph Report - office-draft-link-recovery  (2026-11-11)

## Corpus Check
- 786 files · ~313,548 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3862 nodes · 17631 edges · 100 communities (98 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 104 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7267a8e6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- github-delivery.ts
- index.tsx
- features/workflow.ts
- SourceRegistry
- workKey
- Button
- cec/issue-publication.ts
- knowledge.ts
- conversations/slack.ts
- worker-runtime.ts
- artifact
- OfficeScene.tsx
- record-trigger.ts
- github-readiness.ts
- easternDay
- shared.ts
- source-amendment.ts
- digest
- constellation-runtime.ts
- packed165-admission.ts
- github-context.ts
- scheduled-captures.ts
- session-bridge.ts
- OfficeSnapshot
- Role
- App.tsx
- TelemetryPanel.tsx
- index.ts
- requests.ts
- Store
- agents.ts
- coordination.ts
- accept-stage-result.ts
- source-amendment-scope.ts
- conversations/conversations.ts
- run-accounting.ts
- readback-evidence.ts
- weekly-rollup.ts
- maintenance/maintenance.ts
- it-specialist.ts
- .transaction
- task-briefing.ts
- SettingsPanel.tsx
- engine.ts
- .emit
- api-routes.ts
- features.ts
- remove-candidate.ts
- run.ts
- telemetry.ts
- cec/workflow.ts
- assignment-poll.ts
- store.ts
- WorkTime
- cost-ledger.ts
- outbox.ts
- sanitize
- interrupted-work-recovery.ts
- dependency-bots/adopt.ts
- github/issue-publication.ts
- scheduler.ts
- process.ts
- failure.ts
- brain-maintenance.ts
- .getEffect
- .save
- Coordinator
- scheduled-work.ts
- admit-improvement.ts
- investigations/ledger.ts
- .pump
- jira-time.ts
- report.ts
- reader.ts
- validate-stage.ts
- tracking-issue.ts
- harnessEffect
- service-health.ts
- fact-bounds.ts
- refresh-evidence.ts
- delivery-task.ts
- sources/retained-scope.ts
- processGroupAlive
- DailyCTO.tsx
- .value
- mailbox.ts
- codex-rollout.ts
- command-registry.ts
- QuestionDialogHost.tsx
- merge-scanner-retry.ts
- cli.ts
- OfficeConfigView.tsx
- liveReach
- extract-worker.mjs
- launch-policy.ts
- highestStableAtLeast
- slack-supersession.ts
- helper-evidence.py
- packed-publication-repair.ts

## God Nodes (most connected - your core abstractions)
1. `Store` - 362 edges
2. `TicketJob` - 174 edges
3. `digest()` - 152 edges
4. `GitHubDelivery` - 149 edges
5. `artifact()` - 129 edges
6. `command()` - 110 edges
7. `workKey()` - 99 edges
8. `cx()` - 86 edges
9. `currentAssignment()` - 82 edges
10. `OfficeSnapshot` - 71 edges

## Surprising Connections (you probably didn't know these)
- `readAzurePRs()` --indirect_call--> `row()`  [INFERRED]
  server/cec/observed-prs.ts → src/telemetry/report.ts
- `DeliveryAuthorityInput` --references--> `HarnessRequest`  [EXTRACTED]
  server/delivery/harness/delivery-authority.ts → src/contracts/work.ts
- `rows()` --indirect_call--> `row()`  [INFERRED]
  server/delivery/recovery/source-amendment/source-amendment-held.ts → src/telemetry/report.ts
- `proveOutsideAmendmentUnchanged()` --indirect_call--> `row()`  [INFERRED]
  server/delivery/recovery/source-amendment/source-amendment-held.ts → src/telemetry/report.ts
- `rows()` --indirect_call--> `row()`  [INFERRED]
  server/delivery/recovery/source-amendment/source-amendment-scope.ts → src/telemetry/report.ts

## Import Cycles
- 3-file cycle: `src/knowledge/map/Constellation.tsx -> src/knowledge/map/constellation-runtime.ts -> src/knowledge/map/node-visuals.ts -> src/knowledge/map/Constellation.tsx`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/stage-reconciliation.ts -> server/delivery/recovery/implementation/continuation-review-readback.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/preparation/post-conflict-preparation.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/stopped-base-review.ts -> server/delivery/recovery/stopped-base-checkout.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/parking/resume-provider-review.ts -> server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/parking/resume-provider-review.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/recovery/packed165-draft-link.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/recovery/retire-external-delivery.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/stage-prompts.ts -> server/delivery/publication/metadata-admission.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/stage-prompts.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/publication/metadata-review.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/implementation/activation-recovery.ts -> server/delivery/recovery/validation/validation-provider-context.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/implementation/continuation-guard.ts -> server/delivery/recovery/validation/validation-provider-context.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/implementation/saved-prerequisite-handoff.ts -> server/delivery/recovery/validation/validation-provider-context.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/preparation/post-conflict-preparation.ts -> server/delivery/recovery/preparation/preparation-provider-context.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/preparation/post-conflict-preparation.ts -> server/delivery/recovery/validation/validation-provider-context.ts -> server/delivery/pipeline/github-delivery.ts`

## Communities (100 total, 2 thin omitted)

### Community 0 - "github-delivery.ts"
Cohesion: 0.05
Nodes (72): removeAdoptedClone(), namedRepairIds(), assertDeliveryMayMutate(), runHarnessStage(), harnessDelivers(), legacyRecovery(), BOARD_RULE, conflictRefreshInstruction() (+64 more)

### Community 1 - "index.tsx"
Cohesion: 0.06
Nodes (79): Conversation(), Outbox(), SendMessage, recommendedReply(), slackMessageStatus(), SlackDeliveryCard(), ServiceHealthPanel(), labels (+71 more)

### Community 2 - "features/workflow.ts"
Cohesion: 0.06
Nodes (64): approveFeature(), featureById(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), discoveryPrompt(), planPrompt() (+56 more)

### Community 3 - "SourceRegistry"
Cohesion: 0.06
Nodes (47): createExtractor(), extractDocument, Extraction, Extractor, uploadArtifact(), KnowledgeRunner, admitUnits(), checkedReceipt() (+39 more)

### Community 4 - "workKey"
Cohesion: 0.06
Nodes (78): recordJobApproach(), completedPRReviews(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash (+70 more)

### Community 5 - "Button"
Cohesion: 0.06
Nodes (57): guidanceExcerpt(), evidenceTitle(), KnowledgeDigest, KnowledgeDigestDelivery, KnowledgeDigestDetail, KnowledgeSourceSummary, KnowledgeActivity, Activity() (+49 more)

### Community 6 - "cec/issue-publication.ts"
Cohesion: 0.06
Nodes (42): CommentPage, commentReadback(), Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), Transition (+34 more)

### Community 7 - "knowledge.ts"
Cohesion: 0.06
Nodes (65): Accepted, acceptRetrospective(), BLOCKED, RETROSPECTIVE_HISTORY, Shared, curateLesson(), Curation, CurationAction (+57 more)

### Community 8 - "conversations/slack.ts"
Cohesion: 0.11
Nodes (50): SlackResultSchema, SlackVerificationSchema, knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, KnowledgeContext (+42 more)

### Community 9 - "worker-runtime.ts"
Cohesion: 0.05
Nodes (55): candidateWorkspaceEnvironment(), assignmentSubject(), dispatchExposure(), prepareExposure(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT (+47 more)

### Community 10 - "artifact"
Cohesion: 0.09
Nodes (62): candidateInput(), children, oldAdoptionBasis(), savedCandidateAdmission, assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence() (+54 more)

### Community 11 - "OfficeScene.tsx"
Cohesion: 0.06
Nodes (59): labels, displayAgentTask(), githubStageLabels, withoutElapsed(), CameraBookmark, restoreBookmark(), LiveAgentTask(), Props (+51 more)

### Community 12 - "record-trigger.ts"
Cohesion: 0.06
Nodes (57): deliveryMetrics(), median(), LEARNING_BASELINES, maintainLearning(), maintenanceSubject(), MaintenanceSubjectFacts, clip(), maintenanceBlockedId() (+49 more)

### Community 13 - "github-readiness.ts"
Cohesion: 0.09
Nodes (52): containedFile(), findingsBlock(), HANDS_OFF_PROJECTS, handsOff(), acceptConflictRepair(), hasUncertainEffects(), observe(), checksFailed() (+44 more)

### Community 14 - "easternDay"
Cohesion: 0.07
Nodes (31): expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), DailyCTO, EvidenceRequestConflict (+23 more)

### Community 15 - "shared.ts"
Cohesion: 0.05
Nodes (51): Admission, GitHubMonitor, githubPRDescription(), GOAL_EVIDENCE_LIMITS, PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore (+43 more)

### Community 16 - "source-amendment.ts"
Cohesion: 0.09
Nodes (58): adoptCandidate(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat() (+50 more)

### Community 17 - "digest"
Cohesion: 0.13
Nodes (45): admitPRMetadata(), assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema, savedMetadataAssessment(), validateSaved(), metadataClaim() (+37 more)

### Community 18 - "constellation-runtime.ts"
Cohesion: 0.07
Nodes (41): KnowledgeActivityPage, KnowledgeEdge, KnowledgeMap, KnowledgeNode, CameraPose, flightPose(), cameraTarget(), focusDistance (+33 more)

### Community 19 - "packed165-admission.ts"
Cohesion: 0.10
Nodes (43): accounting, DeliverySubject, nonDelivery, originalReads, HarnessControl, assertAutomationEffects(), automationMergePolicy(), observeAutomationMerge() (+35 more)

### Community 20 - "github-context.ts"
Cohesion: 0.09
Nodes (52): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+44 more)

### Community 21 - "scheduled-captures.ts"
Cohesion: 0.15
Nodes (44): createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest, captureRequests() (+36 more)

### Community 22 - "session-bridge.ts"
Cohesion: 0.08
Nodes (37): claudeSessionContext(), readTranscript, root, claudeSessionScope(), accountCodexProcesses(), codexProcessInventory, DesktopSessions, unaccountedProcesses() (+29 more)

### Community 23 - "OfficeSnapshot"
Cohesion: 0.08
Nodes (39): FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures(), TicketPlanningAction(), App() (+31 more)

### Community 24 - "Role"
Cohesion: 0.09
Nodes (43): DeliverySlot, label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId (+35 more)

### Community 25 - "App.tsx"
Cohesion: 0.05
Nodes (44): BrainDrawer(), themeColor, BrainWorkspace, CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants, ElevatorPhase (+36 more)

### Community 26 - "TelemetryPanel.tsx"
Cohesion: 0.09
Nodes (40): cecChatPrompt(), TelemetryReport, LiveAnchor, AzureBuild, ROLE_NAMES, BreakdownTable(), CostBar(), coverage() (+32 more)

### Community 27 - "index.ts"
Cohesion: 0.08
Nodes (39): AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), close(), config, itSpecialist, loadedRevision, offices, releaseLock (+31 more)

### Community 28 - "requests.ts"
Cohesion: 0.11
Nodes (35): deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, requireDeliveryAuthority(), deliveryIntakeBlocker(), gateRegisteredDelivery(), resolveDeliveryWork() (+27 more)

### Community 29 - "Store"
Cohesion: 0.07
Nodes (9): correlatedBuild(), Result, Engine, observe(), observeParked(), parkedReadError, Store, command() (+1 more)

### Community 30 - "agents.ts"
Cohesion: 0.08
Nodes (30): cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), ctoChatPrompt(), itChatPrompt(), slackSendPrompt(), slackVerifyPrompt() (+22 more)

### Community 31 - "coordination.ts"
Cohesion: 0.10
Nodes (36): reconcileNoticeConfirmations(), admit(), IntakeContext, compatible(), dependencyCompletionKey(), dependencyEligibility(), DependencyStores, issueKey() (+28 more)

### Community 32 - "accept-stage-result.ts"
Cohesion: 0.12
Nodes (36): park(), acceptStageResult(), pendingPreparationCheck(), METADATA_FINDING, mergeAuthorized(), allowed, continuationArtifacts(), continuationNativeReview() (+28 more)

### Community 33 - "source-amendment-scope.ts"
Cohesion: 0.08
Nodes (39): approvedText(), assert(), assert(), normalize(), officialUrls, ReleaseCapture, verifyReleaseCaptures(), amendmentCaptureObservation() (+31 more)

### Community 34 - "conversations/conversations.ts"
Cohesion: 0.10
Nodes (24): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+16 more)

### Community 35 - "run-accounting.ts"
Cohesion: 0.11
Nodes (35): ghLogCacheEvidence(), BoundedRead, done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf(), backfillClaudeCost() (+27 more)

### Community 36 - "readback-evidence.ts"
Cohesion: 0.13
Nodes (30): assertStoppedBaseAudit(), AuditRow, readStoppedBaseAuditCompletion(), StoppedBaseAuditReader, CoverageRow, Hash, Kind, readStoppedBaseAuditNative() (+22 more)

### Community 37 - "weekly-rollup.ts"
Cohesion: 0.10
Nodes (34): captureLearning(), learningDigest(), recordLearningOpportunity(), expireLearningPackets(), packetReferences(), learningMetrics(), readAcceptedResult(), retainAcceptedResult() (+26 more)

### Community 38 - "maintenance/maintenance.ts"
Cohesion: 0.11
Nodes (25): maintenancePolicies(), captureMaintenanceStep(), BrainMaintenance, candidateOwner(), SETTLED, skipOwnedCandidate(), Skipped, skippedCandidateLedger() (+17 more)

### Community 39 - "it-specialist.ts"
Cohesion: 0.11
Nodes (25): partialLocalCleanupKey(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), ITContext, diagnosticContext(), diagnosticSnapshot() (+17 more)

### Community 40 - ".transaction"
Cohesion: 0.14
Nodes (21): featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), automaticEnabled(), automaticFeature(), FeaturePlanningBindings, FeaturePlanningConfig, POLICY_VERSION (+13 more)

### Community 41 - "task-briefing.ts"
Cohesion: 0.12
Nodes (23): AssignmentLookups, Binding, lookupInstructions(), lookupJournal, citations(), recordAcceptedKnowledge(), stageName(), knowledgeCitation() (+15 more)

### Community 42 - "SettingsPanel.tsx"
Cohesion: 0.13
Nodes (26): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS, PickupForm(), acceptPreferences() (+18 more)

### Community 43 - "engine.ts"
Cohesion: 0.16
Nodes (28): dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), resume(), startPilot(), eligibility(), approvedDelivery() (+20 more)

### Community 44 - ".emit"
Cohesion: 0.14
Nodes (26): retryRecipientLookup(), enqueueGreen156(), enqueueMetadataRecovery(), normalizeStatement(), configureDigestDelivery(), DigestSettings, baselineLearning(), configureKnowledge() (+18 more)

### Community 45 - "api-routes.ts"
Cohesion: 0.11
Nodes (26): assertAssessmentVisibility(), assertQuestionVisibility(), eventVisible(), knowledgeOfficeState(), knowledgePromptStore(), applyGoalReview(), EvidenceRefSchema, FreshDailyResultSchema (+18 more)

### Community 46 - "features.ts"
Cohesion: 0.11
Nodes (28): normalizeRound(), pendingQuestions(), FeatureApproval, FeatureAuthority, FeatureBaseline, FeatureDocument, FeatureHandoff, FeatureHarnessAction (+20 more)

### Community 47 - "remove-candidate.ts"
Cohesion: 0.14
Nodes (24): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot() (+16 more)

### Community 48 - "run.ts"
Cohesion: 0.14
Nodes (23): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_FIX_PROMPT, OfficeFixResult (+15 more)

### Community 49 - "telemetry.ts"
Cohesion: 0.09
Nodes (28): CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL, Rates (+20 more)

### Community 50 - "cec/workflow.ts"
Cohesion: 0.17
Nodes (26): parksInJira(), run(), advance(), nextStage(), publicationEvidenceGap(), qaEvidenceGap(), resultGate(), stageResultGap() (+18 more)

### Community 51 - "assignment-poll.ts"
Cohesion: 0.12
Nodes (26): ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR, plainSlackText() (+18 more)

### Community 52 - "store.ts"
Cohesion: 0.10
Nodes (18): QuestionNotifications, systemClock, DATA, DELIVERY_CONCURRENCY, LOCAL_BINDINGS, file, project, root (+10 more)

### Community 53 - "WorkTime"
Cohesion: 0.16
Nodes (27): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence(), CaptureContext (+19 more)

### Community 54 - "cost-ledger.ts"
Cohesion: 0.17
Nodes (25): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress(), effectId() (+17 more)

### Community 55 - "outbox.ts"
Cohesion: 0.15
Nodes (22): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), projectOutbox(), syncOutbox(), slackRequestSettled(), readBackConversations() (+14 more)

### Community 56 - "sanitize"
Cohesion: 0.14
Nodes (22): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+14 more)

### Community 57 - "interrupted-work-recovery.ts"
Cohesion: 0.13
Nodes (14): channelNoticeAuthorized(), MergeNotifications, comparableSlackText(), SlackMessages, SlackRequestSchema, digestNoticeNeverDispatched(), goalNoticeAuthorized(), goalNoticeNeverDispatched() (+6 more)

### Community 58 - "dependency-bots/adopt.ts"
Cohesion: 0.19
Nodes (23): Execute, adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR, openDependabotPulls() (+15 more)

### Community 59 - "github/issue-publication.ts"
Cohesion: 0.22
Nodes (24): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), ProjectCard, projectCards(), projectGraphql() (+16 more)

### Community 60 - "scheduler.ts"
Cohesion: 0.14
Nodes (15): ROLES, officeCapacity, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch() (+7 more)

### Community 61 - "process.ts"
Cohesion: 0.14
Nodes (19): Event, one(), prePushRejection(), PushIdentity, Candidate, settledPushBoundary(), inactivityWatch(), At (+11 more)

### Community 62 - "failure.ts"
Cohesion: 0.19
Nodes (21): commandFeature(), reviewQuestions(), reserveReplacement(), stageBudget(), classifyFeatureFailure(), FeatureErrorCode, RecoveryDecision, recoverFailure() (+13 more)

### Community 63 - "brain-maintenance.ts"
Cohesion: 0.12
Nodes (19): completeNativeCheckpoint(), BRAIN_DEPENDENCY_MERGES, BrainResult, BrainStatusSchema, identity, parseBrainStatus(), brainCheckpointCompletion(), coverageSchema (+11 more)

### Community 64 - ".getEffect"
Cohesion: 0.18
Nodes (10): dispatchedMetadataEffect(), GitHubOperations, fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), Assessment, closeNativeRefresh(), fingerprint() (+2 more)

### Community 65 - ".save"
Cohesion: 0.24
Nodes (23): BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue(), readIssues(), commentDecision() (+15 more)

### Community 66 - "Coordinator"
Cohesion: 0.08
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 67 - "scheduled-work.ts"
Cohesion: 0.17
Nodes (16): deliverySlot(), verifiedCloseoutCleanupRequest(), withAmendmentOwnership(), gateFeatureWork(), requestPriority(), deterministicActions, eligible(), KnowledgeOptions (+8 more)

### Community 68 - "admit-improvement.ts"
Cohesion: 0.21
Nodes (17): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+9 more)

### Community 69 - "investigations/ledger.ts"
Cohesion: 0.24
Nodes (14): projectSlackDeliveries(), settleRequestedSlackReplacement(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint(), supersedingDelivery(), investigationCandidates() (+6 more)

### Community 70 - ".pump"
Cohesion: 0.20
Nodes (6): leadershipContext(), leadershipEntries(), knowledgeEntries(), seedOfficeLessons(), Offices, markCaptureStart()

### Community 71 - "jira-time.ts"
Cohesion: 0.21
Nodes (13): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+5 more)

### Community 72 - "report.ts"
Cohesion: 0.17
Nodes (18): ScopeRow, ConfirmedSegment, ObservationGap, SnapshotOrdering, TimeLedgerState, TimeEntry, Acc, bump() (+10 more)

### Community 73 - "reader.ts"
Cohesion: 0.14
Nodes (8): BrainNote, BrainReader, CommittedBrain, GraphNode, GraphPage, hash, Note, sha

### Community 74 - "validate-stage.ts"
Cohesion: 0.20
Nodes (15): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+7 more)

### Community 75 - "tracking-issue.ts"
Cohesion: 0.20
Nodes (13): ensureTrackingIssue(), findTrackingIssue(), ownTracking(), TrackingIssue, trackingIssueBody(), trackingIssueTitle(), trackingMarker(), centralCompanionHandoff() (+5 more)

### Community 76 - "harnessEffect"
Cohesion: 0.23
Nodes (12): activeEffectId(), harnessEffect, readBackOrThrow(), retryRead(), editorMatches(), relinkPinCourier(), sha(), MISSING_NATIVE_LINK (+4 more)

### Community 77 - "service-health.ts"
Cohesion: 0.19
Nodes (8): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, ServiceHealth

### Community 78 - "fact-bounds.ts"
Cohesion: 0.26
Nodes (15): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+7 more)

### Community 79 - "refresh-evidence.ts"
Cohesion: 0.29
Nodes (12): evidenceDirectory(), readEvidence(), ProviderEvidence, canonical(), evidenceDigest(), evidenceHash(), semantic(), stableUrl() (+4 more)

### Community 80 - "delivery-task.ts"
Cohesion: 0.21
Nodes (11): cecPrompt(), resolvedDecisionNote(), stageInstructions, APPROACH_GUIDANCE, reviewInstructions(), deliveryTask(), DeliveryTaskInput, DISCOVERY_GUIDANCE (+3 more)

### Community 81 - "sources/retained-scope.ts"
Cohesion: 0.32
Nodes (8): retainedArtifactScope(), eventSourceBindings(), exposureBindings(), requestSourceBindings(), acceptedSourceBindings(), deniedAssignments(), revokedSubjects(), knowledgeSessionVisibility()

### Community 82 - "processGroupAlive"
Cohesion: 0.28
Nodes (11): Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership, rawHash() (+3 more)

### Community 83 - "DailyCTO.tsx"
Cohesion: 0.26
Nodes (8): CTOReview(), goalState, DailyCTO(), GoalHistory(), reportDate(), reviewStatus, reviewExcerpt(), ReviewText()

### Community 84 - ".value"
Cohesion: 0.27
Nodes (6): file, folder, logs, root, xml(), ProjectProgress

### Community 85 - "mailbox.ts"
Cohesion: 0.24
Nodes (8): applyIntakeObservation(), checkMail(), drainMail(), requestMail(), MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), ingest()

### Community 86 - "codex-rollout.ts"
Cohesion: 0.29
Nodes (9): add(), CodexRequest, CodexRollout, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens() (+1 more)

### Community 87 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 88 - "QuestionDialogHost.tsx"
Cohesion: 0.44
Nodes (7): FeatureQuestionProjection, nextQuestion(), orderedQuestions(), questionKey(), QuestionDialogHost(), readSuppressed(), Dialog()

### Community 89 - "merge-scanner-retry.ts"
Cohesion: 0.50
Nodes (8): officeMergeProvenance(), reconcileMergeScannerRetry(), Retry, retryMergeScanner(), retryReadBack(), runIdentity(), savedRetry(), transientScannerJobs()

### Community 90 - "cli.ts"
Cohesion: 0.29
Nodes (5): args, [cmd,...rawArgs], commands, key, projectIndex

### Community 91 - "OfficeConfigView.tsx"
Cohesion: 0.48
Nodes (5): loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView(), OfficeConfigSummary

### Community 92 - "liveReach"
Cohesion: 0.60
Nodes (5): GIT_NETWORK, LIVE_PROVIDERS, liveReach(), networkUrl(), remoteUrls()

### Community 93 - "extract-worker.mjs"
Cohesion: 0.70
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 94 - "launch-policy.ts"
Cohesion: 0.60
Nodes (4): LaunchPolicy, launchPolicyFacts(), LaunchPolicyReceipt, retainLaunchPolicy()

### Community 95 - "highestStableAtLeast"
Cohesion: 0.83
Nodes (3): compare(), highestStableAtLeast(), parts()

### Community 96 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

## Knowledge Gaps
- **429 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+424 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `github-delivery.ts`, `features/workflow.ts`, `SourceRegistry`, `workKey`, `cec/issue-publication.ts`, `knowledge.ts`, `conversations/slack.ts`, `worker-runtime.ts`, `artifact`, `OfficeScene.tsx`, `record-trigger.ts`, `github-readiness.ts`, `easternDay`, `shared.ts`, `source-amendment.ts`, `digest`, `packed165-admission.ts`, `github-context.ts`, `scheduled-captures.ts`, `session-bridge.ts`, `OfficeSnapshot`, `TelemetryPanel.tsx`, `index.ts`, `requests.ts`, `agents.ts`, `coordination.ts`, `accept-stage-result.ts`, `conversations/conversations.ts`, `run-accounting.ts`, `readback-evidence.ts`, `weekly-rollup.ts`, `maintenance/maintenance.ts`, `it-specialist.ts`, `.transaction`, `task-briefing.ts`, `engine.ts`, `.emit`, `api-routes.ts`, `features.ts`, `remove-candidate.ts`, `run.ts`, `cec/workflow.ts`, `assignment-poll.ts`, `store.ts`, `WorkTime`, `cost-ledger.ts`, `outbox.ts`, `sanitize`, `interrupted-work-recovery.ts`, `dependency-bots/adopt.ts`, `github/issue-publication.ts`, `scheduler.ts`, `process.ts`, `failure.ts`, `brain-maintenance.ts`, `.getEffect`, `.save`, `scheduled-work.ts`, `admit-improvement.ts`, `investigations/ledger.ts`, `.pump`, `jira-time.ts`, `validate-stage.ts`, `tracking-issue.ts`, `harnessEffect`, `refresh-evidence.ts`, `delivery-task.ts`, `sources/retained-scope.ts`, `processGroupAlive`?**
  _High betweenness centrality (0.133) - this node is a cross-community bridge._
- **Why does `OfficeSnapshot` connect `OfficeSnapshot` to `index.tsx`, `Button`, `OfficeScene.tsx`, `record-trigger.ts`, `shared.ts`, `Role`, `App.tsx`, `TelemetryPanel.tsx`, `Store`, `maintenance/maintenance.ts`, `it-specialist.ts`, `SettingsPanel.tsx`, `api-routes.ts`, `cec/workflow.ts`, `store.ts`, `outbox.ts`, `sanitize`, `investigations/ledger.ts`, `service-health.ts`, `sources/retained-scope.ts`, `DailyCTO.tsx`, `mailbox.ts`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `command()` connect `Store` to `github-delivery.ts`, `features/workflow.ts`, `SourceRegistry`, `workKey`, `cec/issue-publication.ts`, `worker-runtime.ts`, `github-readiness.ts`, `easternDay`, `shared.ts`, `digest`, `packed165-admission.ts`, `github-context.ts`, `session-bridge.ts`, `requests.ts`, `agents.ts`, `coordination.ts`, `maintenance/maintenance.ts`, `.transaction`, `engine.ts`, `remove-candidate.ts`, `cec/workflow.ts`, `assignment-poll.ts`, `cost-ledger.ts`, `sanitize`, `github/issue-publication.ts`, `process.ts`, `brain-maintenance.ts`, `.getEffect`, `.save`, `scheduled-work.ts`, `admit-improvement.ts`, `jira-time.ts`, `reader.ts`, `validate-stage.ts`, `harnessEffect`, `service-health.ts`, `command-registry.ts`, `liveReach`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _429 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `github-delivery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05393548387096774 - nodes in this community are weakly interconnected._
- **Should `index.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06277552459883619 - nodes in this community are weakly interconnected._
- **Should `features/workflow.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06431663574520717 - nodes in this community are weakly interconnected._