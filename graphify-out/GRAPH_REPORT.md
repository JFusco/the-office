# Graph Report - the-office  (2026-11-10)

## Corpus Check
- 709 files · ~293,292 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3615 nodes · 16172 edges · 122 communities (119 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 96 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5645f591`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- dependency-bots/adopt.ts
- record-trigger.ts
- App.tsx
- source-amendment.ts
- engine.ts
- artifact
- conversations/conversations.ts
- accept-stage-result.ts
- OfficeScene.tsx
- worker-runtime.ts
- Inspector.tsx
- github-readiness.ts
- shared.ts
- store.ts
- office/config.ts
- agents.ts
- Button
- resume-provider-review.ts
- index.tsx
- .getEffect
- knowledge/routes.ts
- digest
- lesson-selection.ts
- MapView.tsx
- offices.ts
- PeoplePanel.tsx
- OfficeSnapshot
- TimeBook.tsx
- azure.ts
- maintenance.ts
- GitHubDelivery
- Store
- retrospective-subject.ts
- authorize.ts
- supersedingDelivery
- features.ts
- session-bridge.ts
- cec/issue-publication.ts
- .transaction
- slack-intake/run.ts
- run-accounting.ts
- telemetry.ts
- approach.ts
- tracking-issue.ts
- merge-summary.ts
- .emit
- cost-ledger.ts
- investigations/run.ts
- run-retrospective.ts
- cost-totals.ts
- api-routes.ts
- knowledge.ts
- slack-intake/config.ts
- .save
- work.ts
- jira-time.ts
- time-scope.ts
- Coordinator
- blocker-followups.ts
- sourceVisible
- weekly-rollup.ts
- index.ts
- assignment-poll.ts
- dependencies.ts
- remove-candidate.ts
- slack-intake/report.ts
- highestStableAtLeast
- evidence.ts
- coordination.ts
- FeatureWorkspace.tsx
- schedule.ts
- workKey
- service-health.ts
- goal-reviews.ts
- activation-recovery.ts
- admit-improvement.ts
- ControlStore
- fact-bounds.ts
- process.ts
- KnowledgeReference
- codex-rollout.ts
- preferences-store.ts
- weekly-research.ts
- Role
- features/workflow.ts
- scheduled-retrospectives.ts
- digest
- WorkTime
- outbox.ts
- DailyCTO.tsx
- scheduled-work.ts
- github/issue-publication.ts
- reader.ts
- coordination-tick.ts
- diagnostic-snapshot.ts
- it-specialist.ts
- .get
- command-registry.ts
- knowledge/learning-events.ts
- read-links.ts
- retrieval.ts
- task-briefing.ts
- captures.ts
- extract-worker.mjs
- slack-supersession.ts
- helper-evidence.py
- useOfficePreferences.ts
- .value
- create-candidate.ts
- weekly-digest.ts
- investigations/ledger.ts
- .pump
- leadership.ts
- cli.ts
- local-config.ts
- daily-cto.ts
- OfficeConfigView.tsx
- reconsider.ts
- brain-followup.ts
- read-retries.ts
- SlackIntakeStatus.tsx

## God Nodes (most connected - your core abstractions)
1. `Store` - 322 edges
2. `TicketJob` - 144 edges
3. `GitHubDelivery` - 135 edges
4. `digest()` - 105 edges
5. `command()` - 105 edges
6. `artifact()` - 98 edges
7. `workKey()` - 91 edges
8. `cx()` - 90 edges
9. `currentAssignment()` - 71 edges
10. `OfficeSnapshot` - 70 edges

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
- 3-file cycle: `server/delivery/parking/resume-provider-review.ts -> server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/parking/resume-provider-review.ts`
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
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/preparation/post-conflict-preparation.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/preparation/post-conflict-preparation.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/pipeline/github-delivery.ts`

## Communities (122 total, 3 thin omitted)

### Community 0 - "dependency-bots/adopt.ts"
Cohesion: 0.16
Nodes (27): Execute, readBackOrThrow(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR, inPickupLane() (+19 more)

### Community 1 - "record-trigger.ts"
Cohesion: 0.10
Nodes (41): baselineLearning(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences(), clip(), maintenanceBlockedId(), MaintenanceCandidate (+33 more)

### Community 2 - "App.tsx"
Cohesion: 0.06
Nodes (47): BrainDrawer(), themeColor, App(), BrainWorkspace, CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants (+39 more)

### Community 3 - "source-amendment.ts"
Cohesion: 0.07
Nodes (62): approvedText(), assert(), amendmentIssueSha256(), authorizeSourceAmendment(), Binding, assert(), normalize(), officialUrls (+54 more)

### Community 4 - "engine.ts"
Cohesion: 0.08
Nodes (23): correlatedBuild(), checkMail(), drainMail(), requestMail(), dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery() (+15 more)

### Community 5 - "artifact"
Cohesion: 0.08
Nodes (68): closeoutRequestResolved(), savedActivationFailure(), continuationNativeReview(), candidateInput(), children, oldAdoptionBasis(), savedCandidateAdmission, assertPostConflictFiles() (+60 more)

### Community 6 - "conversations/conversations.ts"
Cohesion: 0.08
Nodes (33): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+25 more)

### Community 7 - "accept-stage-result.ts"
Cohesion: 0.08
Nodes (70): acceptStageResult(), PrerequisitesSchema, METADATA_FINDING, mergeAuthorized(), allowed, assertContinuationWorker(), continuationArtifacts(), continuationReviewArtifacts() (+62 more)

### Community 8 - "OfficeScene.tsx"
Cohesion: 0.07
Nodes (50): CameraBookmark, restoreBookmark(), Avatar(), AzureWall(), Chair(), Coworker(), CTORoom(), Desk() (+42 more)

### Community 9 - "worker-runtime.ts"
Cohesion: 0.08
Nodes (36): candidateWorkspaceEnvironment(), assertDigestDispatch(), contextPacket(), CODEX_DEFAULT_EFFORT, CODEX_DEFAULT_MODEL, CODEX_EFFORTS, CODEX_ROLES, ModelRoute (+28 more)

### Community 10 - "Inspector.tsx"
Cohesion: 0.06
Nodes (74): Conversation(), Outbox(), SendMessage, recommendedReply(), SlackDeliveryCard(), ServiceHealthPanel(), labels, ServiceHealthRow() (+66 more)

### Community 11 - "github-readiness.ts"
Cohesion: 0.10
Nodes (45): containedFile(), findingsBlock(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery(), acceptConflictRepair(), nextJobStage() (+37 more)

### Community 12 - "shared.ts"
Cohesion: 0.05
Nodes (86): harnessCloseout(), PASSING, verifyMergeActions(), activeEffectId(), harnessEffect, assertMayMutate(), HarnessControl, withHarnessWork() (+78 more)

### Community 13 - "store.ts"
Cohesion: 0.08
Nodes (34): channelNoticeAuthorized(), notices(), queueChannelNotice(), Identity, MergeNotifications, reconcileNoticeConfirmations(), SlackMessages, SlackRequestSchema (+26 more)

### Community 14 - "office/config.ts"
Cohesion: 0.08
Nodes (57): closeoutReceipt(), boardPreflightCandidate(), Ownership, reconcileBoardPreflight(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership (+49 more)

### Community 15 - "agents.ts"
Cohesion: 0.08
Nodes (39): cecPrompt(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), resolvedDecisionNote(), stageInstructions, cecChatPrompt() (+31 more)

### Community 16 - "Button"
Cohesion: 0.12
Nodes (27): KnowledgeCapturePage, KnowledgeHit, KnowledgeActivityPage, Activity(), ActivityStatus(), AssignmentKnowledge(), BrainWorkspace(), CaptureReviewDetail() (+19 more)

### Community 17 - "resume-provider-review.ts"
Cohesion: 0.23
Nodes (23): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), ProjectCard, projectCards(), projectGraphql() (+15 more)

### Community 18 - "index.tsx"
Cohesion: 0.10
Nodes (45): KnowledgeSourceSummary, AddPublicSource(), AddSourceForm(), SourceConnection, SourceCard(), supported, UploadSource(), WithdrawSource() (+37 more)

### Community 19 - ".getEffect"
Cohesion: 0.26
Nodes (7): GitHubOperations, fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), closeNativeRefresh(), fingerprint(), EffectIntent

### Community 20 - "knowledge/routes.ts"
Cohesion: 0.13
Nodes (15): intakeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainReader, KnowledgeContext, AssignmentLookups, Binding (+7 more)

### Community 21 - "digest"
Cohesion: 0.17
Nodes (36): admitPRMetadata(), assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema, savedMetadataAssessment(), validateSaved(), metadataClaim() (+28 more)

### Community 22 - "lesson-selection.ts"
Cohesion: 0.20
Nodes (16): knowledgeContext(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), MAINTENANCE, MAX_LESSONS (+8 more)

### Community 23 - "MapView.tsx"
Cohesion: 0.09
Nodes (33): KnowledgeActivity, KnowledgeEdge, KnowledgeMap, KnowledgeNode, CameraPose, flightPose(), cameraTarget(), Point (+25 more)

### Community 24 - "offices.ts"
Cohesion: 0.09
Nodes (33): leadershipContext(), leadershipEntries(), knowledgeEntries(), Config, configDigest(), IntakeConfig, readConfig(), Command (+25 more)

### Community 25 - "PeoplePanel.tsx"
Cohesion: 0.11
Nodes (37): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+29 more)

### Community 26 - "OfficeSnapshot"
Cohesion: 0.10
Nodes (32): SnapshotAcceptance, displayAgentTask(), githubStageLabels, withoutElapsed(), LiveAgentTask(), Props, RunningTask(), text() (+24 more)

### Community 27 - "TimeBook.tsx"
Cohesion: 0.16
Nodes (23): TelemetryReport, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens(), usd(), KpiTiles() (+15 more)

### Community 28 - "azure.ts"
Cohesion: 0.10
Nodes (26): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+18 more)

### Community 29 - "maintenance.ts"
Cohesion: 0.10
Nodes (26): maintenancePolicies(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice(), candidateOwner(), SETTLED (+18 more)

### Community 30 - "GitHubDelivery"
Cohesion: 0.07
Nodes (50): removeAdoptedClone(), namedRepairIds(), GitHubDelivery, checksFailed(), checksPassed(), checksPending(), CurrentChecksWait, currentMergeChecks() (+42 more)

### Community 31 - "Store"
Cohesion: 0.06
Nodes (15): GitHubFeaturePublisher, Assessment, Clock, OfficeEntry, ScheduledWork, applyConnectionSettings(), closeConnection(), optimizeOnOpen() (+7 more)

### Community 32 - "retrospective-subject.ts"
Cohesion: 0.19
Nodes (15): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+7 more)

### Community 33 - "authorize.ts"
Cohesion: 0.13
Nodes (32): approveFeature(), commandFeature(), createFeature(), featureById(), mutation(), reviewQuestions(), assertFeatureDependencyOrder(), featureDependencyEdges() (+24 more)

### Community 34 - "supersedingDelivery"
Cohesion: 0.26
Nodes (11): finishSupersededReadback(), projectSlackDeliveries(), settleRequestedSlackReplacement(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint(), supersedingDelivery() (+3 more)

### Community 35 - "features.ts"
Cohesion: 0.07
Nodes (30): currentApproval(), featureGate(), predecessorComplete(), FeatureError, FeatureErrorCode, RecoveryDecision, improvementIntakeGate(), EffectUncertainError (+22 more)

### Community 36 - "session-bridge.ts"
Cohesion: 0.10
Nodes (28): claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexSessionContext(), readRollout, claudeSessions(), codexSessions() (+20 more)

### Community 37 - "cec/issue-publication.ts"
Cohesion: 0.14
Nodes (14): Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), plainDescription(), Transition, JiraFeaturePublisher (+6 more)

### Community 38 - ".transaction"
Cohesion: 0.13
Nodes (31): featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS, reserveReplacement(), stageBudget() (+23 more)

### Community 39 - "slack-intake/run.ts"
Cohesion: 0.12
Nodes (32): effectId(), CaptureReceipt, IntakeResult, IntakeResultValue, LIMITS, Observation, ReadKind, ReadTask (+24 more)

### Community 40 - "run-accounting.ts"
Cohesion: 0.11
Nodes (30): BoundedRead, backfillClaudeCost(), CompletionReader, codexHome(), createdAt(), dayDirs(), header(), readCodexRollout() (+22 more)

### Community 41 - "telemetry.ts"
Cohesion: 0.09
Nodes (29): CodexRollout, CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL (+21 more)

### Community 42 - "approach.ts"
Cohesion: 0.12
Nodes (34): parksInJira(), run(), publicationEvidenceGap(), qaEvidenceGap(), resultGate(), stageResultGap(), afterDraft(), APPROACH_GUIDANCE (+26 more)

### Community 43 - "tracking-issue.ts"
Cohesion: 0.20
Nodes (13): ensureTrackingIssue(), findTrackingIssue(), ownTracking(), TrackingIssue, trackingIssueBody(), trackingIssueTitle(), trackingMarker(), centralCompanionHandoff() (+5 more)

### Community 44 - "merge-summary.ts"
Cohesion: 0.36
Nodes (7): clamp(), LIMITS, MergedPR, plainSlackText(), section(), shippedSummary(), mergeText()

### Community 45 - ".emit"
Cohesion: 0.11
Nodes (32): ChannelSettings, configureChannelNotices(), configureNotices(), NoticeSettings, retryRecipientLookup(), bindDiscoveryResume(), DiscoveryResumeInput, normalizeStatement() (+24 more)

### Community 46 - "cost-ledger.ts"
Cohesion: 0.15
Nodes (26): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId(), OutsideEdit (+18 more)

### Community 47 - "investigations/run.ts"
Cohesion: 0.22
Nodes (14): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, OFFICE_FIX_PROMPT, OfficeFixResult, validateOfficeFix(), investigationReady(), InvestigationOptions, InvestigationReport (+6 more)

### Community 48 - "run-retrospective.ts"
Cohesion: 0.12
Nodes (28): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, appendLearningFacts(), freezeLearningPacket(), ARTIFACT_LIMIT, clip(), LEDGER_STEPS (+20 more)

### Community 49 - "cost-totals.ts"
Cohesion: 0.33
Nodes (9): isModelWork(), isTicketModelWork(), ScopePolicy, awaitingEvidence(), CaptureContext, inCostWindow(), TicketCost, ticketCosts() (+1 more)

### Community 50 - "api-routes.ts"
Cohesion: 0.26
Nodes (13): retainedArtifactScope(), eventVisible(), assignmentSubject(), knowledgeOfficeState(), knowledgePromptStore(), assertRetainedDispatchScope(), exposureSourceVisible(), deniedAssignments() (+5 more)

### Community 51 - "knowledge.ts"
Cohesion: 0.10
Nodes (23): Kind, RetrospectiveResult, Stage, BlockerFollowup, ImprovementGrant, KnowledgeRetry, LearningMetrics, LESSON_KINDS (+15 more)

### Community 52 - "slack-intake/config.ts"
Cohesion: 0.12
Nodes (24): createExtractor(), extractDocument, Extraction, Extractor, uploadArtifact(), privateFile(), readLocalIntakeReport(), Fields (+16 more)

### Community 53 - ".save"
Cohesion: 0.19
Nodes (26): JiraOperations, plain(), unpack(), BLOCKED, Execute, findComment(), jira(), LiveIssue (+18 more)

### Community 54 - "work.ts"
Cohesion: 0.18
Nodes (11): ProjectReadiness, AssignmentResult, CompletionCondition, DependencyObservation, EligibilityState, FailureCategory, ProgressionItem, ReconciliationAction (+3 more)

### Community 55 - "jira-time.ts"
Cohesion: 0.21
Nodes (13): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+5 more)

### Community 56 - "time-scope.ts"
Cohesion: 0.21
Nodes (20): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), scopeSelector(), midnight(), TicketDay, ticketDayTotals(), captureTime(), timeLedger() (+12 more)

### Community 57 - "Coordinator"
Cohesion: 0.08
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 58 - "blocker-followups.ts"
Cohesion: 0.29
Nodes (12): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), readBackConversations() (+4 more)

### Community 59 - "sourceVisible"
Cohesion: 0.26
Nodes (18): knowledgeActivity(), knowledgeSnapshot(), officeKnowledgeSnapshot(), publicReference(), lookupSummaryVisible(), publicLookupSummary(), evidenceTitle(), knowledgeMap() (+10 more)

### Community 60 - "weekly-rollup.ts"
Cohesion: 0.20
Nodes (15): learningMetrics(), lessonsNeedingReview(), RollupResult, RollupResultSchema, harperFolder(), RETROSPECTIVE_TIMEOUT, scanCuration(), ROLLUP_HISTORY (+7 more)

### Community 61 - "index.ts"
Cohesion: 0.12
Nodes (24): close(), config, itSpecialist, loadedRevision, offices, releaseLock, server, serviceHealth (+16 more)

### Community 62 - "assignment-poll.ts"
Cohesion: 0.17
Nodes (17): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), syncOutbox(), admitReadyCards() (+9 more)

### Community 63 - "dependencies.ts"
Cohesion: 0.23
Nodes (17): Admission, admit(), IntakeContext, compatible(), dependencyEligibility(), DependencyStores, issueKey(), observePrerequisites() (+9 more)

### Community 64 - "remove-candidate.ts"
Cohesion: 0.20
Nodes (16): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+8 more)

### Community 65 - "slack-intake/report.ts"
Cohesion: 0.16
Nodes (25): key(), ChannelProgress, Proposal, isStoppingFor(), reconcileIntakeStatus(), intakeProgress(), terminalDeferred(), unitKey() (+17 more)

### Community 66 - "highestStableAtLeast"
Cohesion: 0.83
Nodes (3): compare(), highestStableAtLeast(), parts()

### Community 67 - "evidence.ts"
Cohesion: 0.17
Nodes (17): ghLogCacheEvidence(), investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_SOURCE_PATHS, officeSource(), done() (+9 more)

### Community 68 - "coordination.ts"
Cohesion: 0.19
Nodes (17): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation(), checkpointWindow(), dueAt() (+9 more)

### Community 69 - "FeatureWorkspace.tsx"
Cohesion: 0.19
Nodes (14): FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures(), draftKey(), readDraft() (+6 more)

### Community 70 - "schedule.ts"
Cohesion: 0.19
Nodes (15): newTask(), sourceWork(), micros(), nowTs(), overlapTs(), timestamp(), initialize(), refresh() (+7 more)

### Community 71 - "workKey"
Cohesion: 0.07
Nodes (60): recordJobApproach(), completedPRReviews(), adoptCandidate(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext() (+52 more)

### Community 72 - "service-health.ts"
Cohesion: 0.17
Nodes (10): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, slackHealth() (+2 more)

### Community 73 - "goal-reviews.ts"
Cohesion: 0.29
Nodes (8): applyGoalReview(), EvidenceRefSchema, statusAllowed(), workEvidence(), GoalInput, saveGoal(), queueGoalNotice(), ProjectGoal

### Community 74 - "activation-recovery.ts"
Cohesion: 0.19
Nodes (23): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+15 more)

### Community 75 - "admit-improvement.ts"
Cohesion: 0.32
Nodes (9): admitImprovement(), improvementEligible(), improvementManifest(), improvementMarker(), improvementProvider(), linkedRepairGap(), IMPROVEMENT_POLICY, queueImprovements() (+1 more)

### Community 76 - "ControlStore"
Cohesion: 0.17
Nodes (7): DailyCTO, reviewWeekday(), DailyResultSchema, Briefing, saveReviewBriefing(), ControlStore, DailyCTOReport

### Community 77 - "fact-bounds.ts"
Cohesion: 0.26
Nodes (15): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+7 more)

### Community 78 - "process.ts"
Cohesion: 0.16
Nodes (18): At, Errno, GroupInventory, GroupProbe, LifecycleDiagnostic, Phase, Pid, groupInventory() (+10 more)

### Community 79 - "KnowledgeReference"
Cohesion: 0.14
Nodes (16): decodeLookupJournal(), lookupJournal, readLookupJournal(), KnowledgeAssignment, KnowledgeCapture, KnowledgeSourceBinding, LearningSubject, LessonExposure (+8 more)

### Community 80 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 81 - "preferences-store.ts"
Cohesion: 0.19
Nodes (10): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS (+2 more)

### Community 82 - "weekly-research.ts"
Cohesion: 0.17
Nodes (19): distinct(), identity(), improvementIncident(), improvementIncidentKey(), learningDigest(), improvementDigest(), ImprovementProposal, proposeImprovements() (+11 more)

### Community 83 - "Role"
Cohesion: 0.18
Nodes (14): ROLES, LOCAL_BINDINGS, DeliverySlot, officeCapacity, fifo(), Scheduler, selectWork(), admitsWork() (+6 more)

### Community 84 - "features/workflow.ts"
Cohesion: 0.19
Nodes (18): discoveryPrompt(), planPrompt(), document(), featureRoot(), DiscoverySchema, identity, manifestFromPlan(), ManifestSchema (+10 more)

### Community 85 - "scheduled-retrospectives.ts"
Cohesion: 0.48
Nodes (6): busyMaintenanceIds(), triggerJobId(), busySubjects(), scheduledRetrospectives(), status(), WorkEligibility

### Community 86 - "digest"
Cohesion: 0.24
Nodes (11): comparableSlackText(), AuthoredDigest, reconcileDigestAuthorship(), unitAuthorship(), annotateAuthoredUnits(), reconcileAuthoredEvidence(), publicationConnections(), digest() (+3 more)

### Community 87 - "WorkTime"
Cohesion: 0.18
Nodes (18): ConfirmedSegment, LiveAnchor, ObservationGap, SnapshotOrdering, TimeLedgerState, WorkTime, Acc, bump() (+10 more)

### Community 88 - "outbox.ts"
Cohesion: 0.19
Nodes (15): conversationResolved(), projectOutbox(), slackRequestSettled(), knowledgeOutbox(), checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), repeatedVendorReviewBlock() (+7 more)

### Community 89 - "DailyCTO.tsx"
Cohesion: 0.26
Nodes (8): CTOReview(), goalState, DailyCTO(), GoalHistory(), reportDate(), reviewStatus, reviewExcerpt(), ReviewText()

### Community 90 - "scheduled-work.ts"
Cohesion: 0.18
Nodes (18): deliverySlot(), verifiedCloseoutCleanupRequest(), metadataRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), deterministicActions, eligible() (+10 more)

### Community 91 - "github/issue-publication.ts"
Cohesion: 0.26
Nodes (7): Assign, Board, Content, GitHubIssuePublisher, number(), same(), label()

### Community 92 - "reader.ts"
Cohesion: 0.15
Nodes (10): BrainGraph, BrainNote, CommittedBrain, GraphNode, GraphPage, hash, Note, sha (+2 more)

### Community 93 - "coordination-tick.ts"
Cohesion: 0.18
Nodes (12): dependencyCompletionKey(), brainCheckpointCompletion(), coverageSchema, followupSchema, verified, reconcileCompletedCheckpoints(), legacy, reconcileContinuations() (+4 more)

### Community 94 - "diagnostic-snapshot.ts"
Cohesion: 0.38
Nodes (5): diagnosticContext(), diagnosticSnapshot(), itAgent(), itDiagnostics(), currentServices()

### Community 95 - "it-specialist.ts"
Cohesion: 0.25
Nodes (12): ITContext, publishITReport(), delays, recoverAttempt(), itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps() (+4 more)

### Community 96 - ".get"
Cohesion: 0.32
Nodes (12): independentIntakeResult(), captureProposal(), recordObservation(), settlePage(), DERIVED, acceptProposals(), retrySlackIntake(), runIntakeTask() (+4 more)

### Community 97 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 98 - "knowledge/learning-events.ts"
Cohesion: 0.32
Nodes (9): eventSourceBindings(), captureLearning(), recordLearningOpportunity(), exposureBindings(), requestSourceBindings(), captureMaintenanceStep(), acceptedSourceBindings(), retainAcceptedResult() (+1 more)

### Community 99 - "read-links.ts"
Cohesion: 0.34
Nodes (10): KnowledgeRunner, retryDelay(), linkKey(), LinkResult, PublicReadPolicy, runSlackLinks(), collectPublicSource(), collectionAllowed() (+2 more)

### Community 100 - "retrieval.ts"
Cohesion: 0.27
Nodes (9): guidanceExcerpt(), officeSearch(), retrieve(), words(), lessonSourceBindings(), DocumentMetadata, documentText(), KnowledgeDocumentText (+1 more)

### Community 101 - "task-briefing.ts"
Cohesion: 0.29
Nodes (10): LessonSelection, citations(), recordAcceptedKnowledge(), stageName(), knowledgeCitation(), lessonCitation(), boundEvidence(), EvidenceSelection (+2 more)

### Community 102 - "captures.ts"
Cohesion: 0.30
Nodes (9): captureAfter(), CaptureMetadata, capturePage(), cursor(), captureIdentityMatches(), BrainCaptureReceipt, hash, PublishedCaptureNote (+1 more)

### Community 103 - "extract-worker.mjs"
Cohesion: 0.70
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 104 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 107 - "useOfficePreferences.ts"
Cohesion: 0.26
Nodes (10): acceptPreferences(), PreferenceCandidate, strip(), UNKNOWN_PREFERENCES, OfficePreferencesController, PreferenceFeedback, PreferenceField, requestPreferences() (+2 more)

### Community 108 - ".value"
Cohesion: 0.27
Nodes (6): file, folder, logs, root, xml(), ProjectProgress

### Community 109 - "create-candidate.ts"
Cohesion: 0.31
Nodes (9): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+1 more)

### Community 110 - "weekly-digest.ts"
Cohesion: 0.44
Nodes (7): independentDigestEvidence(), prepareDigestBodies(), retainDigestBody(), queueWeeklyDigest(), KnowledgeDigest, KnowledgeDigestDelivery, KnowledgeDigestDetail

### Community 111 - "investigations/ledger.ts"
Cohesion: 0.51
Nodes (6): investigationCandidates(), investigationId(), investigationFollowUps(), investigationResolution(), syncInvestigations(), requeueInvestigationEvidence()

### Community 113 - "leadership.ts"
Cohesion: 0.20
Nodes (8): DailyCTOBriefing, DailyCTOResult, DailyCTOSummary, DailyGoalUpdate, GoalEvidenceRef, GoalEvidenceRequest, GoalProgress, GoalStatus

### Community 114 - "cli.ts"
Cohesion: 0.25
Nodes (6): args, [cmd,...rawArgs], commands, key, projectIndex, PORT

### Community 115 - "local-config.ts"
Cohesion: 0.43
Nodes (7): AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), FeaturePlanningBindings, goalEvidencePath(), localBindings, assertModelOverrides(), ModelOverrides

### Community 116 - "daily-cto.ts"
Cohesion: 0.32
Nodes (6): EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), queueGoalEvidenceRequest(), FreshDailyResultSchema, GoalEvidenceRequestSchema

### Community 117 - "OfficeConfigView.tsx"
Cohesion: 0.48
Nodes (5): loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView(), OfficeConfigSummary

### Community 118 - "reconsider.ts"
Cohesion: 0.67
Nodes (4): queueReconsideration(), readyReferences(), resourceUnits(), unavailable()

### Community 120 - "read-retries.ts"
Cohesion: 0.40
Nodes (5): incompleteReadOutput(), IntakeResult, planReadRetry(), WorkFailure, ReadRetry

### Community 121 - "SlackIntakeStatus.tsx"
Cohesion: 0.60
Nodes (4): format, labels, SlackIntakeStatus(), time()

## Knowledge Gaps
- **402 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+397 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `dependency-bots/adopt.ts`, `record-trigger.ts`, `source-amendment.ts`, `engine.ts`, `artifact`, `conversations/conversations.ts`, `accept-stage-result.ts`, `worker-runtime.ts`, `github-readiness.ts`, `shared.ts`, `store.ts`, `office/config.ts`, `agents.ts`, `resume-provider-review.ts`, `.getEffect`, `knowledge/routes.ts`, `digest`, `lesson-selection.ts`, `offices.ts`, `OfficeSnapshot`, `azure.ts`, `maintenance.ts`, `GitHubDelivery`, `retrospective-subject.ts`, `authorize.ts`, `supersedingDelivery`, `features.ts`, `session-bridge.ts`, `cec/issue-publication.ts`, `.transaction`, `slack-intake/run.ts`, `run-accounting.ts`, `approach.ts`, `tracking-issue.ts`, `.emit`, `cost-ledger.ts`, `investigations/run.ts`, `run-retrospective.ts`, `api-routes.ts`, `slack-intake/config.ts`, `.save`, `jira-time.ts`, `time-scope.ts`, `blocker-followups.ts`, `weekly-rollup.ts`, `assignment-poll.ts`, `dependencies.ts`, `remove-candidate.ts`, `slack-intake/report.ts`, `evidence.ts`, `coordination.ts`, `schedule.ts`, `workKey`, `goal-reviews.ts`, `activation-recovery.ts`, `admit-improvement.ts`, `KnowledgeReference`, `weekly-research.ts`, `Role`, `features/workflow.ts`, `scheduled-retrospectives.ts`, `digest`, `scheduled-work.ts`, `github/issue-publication.ts`, `coordination-tick.ts`, `diagnostic-snapshot.ts`, `it-specialist.ts`, `knowledge/learning-events.ts`, `read-links.ts`, `task-briefing.ts`, `create-candidate.ts`, `weekly-digest.ts`, `investigations/ledger.ts`, `brain-followup.ts`, `read-retries.ts`?**
  _High betweenness centrality (0.142) - this node is a cross-community bridge._
- **Why does `Role` connect `Role` to `App.tsx`, `conversations/conversations.ts`, `accept-stage-result.ts`, `OfficeScene.tsx`, `worker-runtime.ts`, `Inspector.tsx`, `github-readiness.ts`, `shared.ts`, `store.ts`, `agents.ts`, `PeoplePanel.tsx`, `maintenance.ts`, `GitHubDelivery`, `Store`, `retrospective-subject.ts`, `run-accounting.ts`, `approach.ts`, `.emit`, `work.ts`, `outbox.ts`, `knowledge/learning-events.ts`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `OfficeSnapshot` connect `OfficeSnapshot` to `record-trigger.ts`, `App.tsx`, `OfficeScene.tsx`, `Inspector.tsx`, `shared.ts`, `store.ts`, `office/config.ts`, `Button`, `index.tsx`, `PeoplePanel.tsx`, `TimeBook.tsx`, `azure.ts`, `maintenance.ts`, `Store`, `supersedingDelivery`, `api-routes.ts`, `work.ts`, `assignment-poll.ts`, `FeatureWorkspace.tsx`, `service-health.ts`, `outbox.ts`, `DailyCTO.tsx`, `diagnostic-snapshot.ts`, `useOfficePreferences.ts`, `investigations/ledger.ts`, `leadership.ts`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `command()` (e.g. with `.constructor()` and `executeRequest()`) actually correct?**
  _`command()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _402 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `record-trigger.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09805735430157261 - nodes in this community are weakly interconnected._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05565638233514821 - nodes in this community are weakly interconnected._