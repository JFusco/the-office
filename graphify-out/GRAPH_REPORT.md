# Graph Report - the-office  (2026-11-10)

## Corpus Check
- 712 files · ~294,051 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3629 nodes · 16204 edges · 107 communities (105 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 96 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `43835462`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- dependency-bots/adopt.ts
- record-trigger.ts
- App.tsx
- source-amendment.ts
- engine.ts
- post-conflict-preparation.ts
- conversations/conversations.ts
- scope-repair-resume.ts
- cx
- worker-runtime.ts
- Inspector.tsx
- github-delivery.ts
- harnessEffect
- sanitize
- requests.ts
- agents.ts
- Button
- resume-provider-review.ts
- index.tsx
- .getEffect
- accept-stage-result.ts
- TicketJob
- lesson-selection.ts
- constellation-runtime.ts
- SourceRegistry
- PeoplePanel.tsx
- work-summary.ts
- TimeBook.tsx
- azure.ts
- maintenance.ts
- GitHubDelivery
- Store
- retrospective-subject.ts
- features/workflow.ts
- store.ts
- features.ts
- session-bridge.ts
- cec/issue-publication.ts
- .transaction
- slack-intake/run.ts
- run-accounting.ts
- telemetry.ts
- cec/workflow.ts
- tracking-issue.ts
- merge-summary.ts
- http/commands.ts
- scheduled-work.ts
- investigations/run.ts
- run-retrospective.ts
- observations.ts
- knowledge/routes.ts
- LessonsPanel.tsx
- read-links.ts
- .save
- work.ts
- jira-time.ts
- WorkTime
- Coordinator
- blocker-followups.ts
- sourceVisible
- publish-pr.ts
- index.ts
- notifications.ts
- dependencies.ts
- assertMayMutate
- slack-intake/report.ts
- highestStableAtLeast
- github.ts
- coordination.ts
- OfficeSnapshot
- schedule.ts
- workKey
- service-health.ts
- channel-notice.ts
- digest
- admit-improvement.ts
- ControlStore
- goal-reporting.ts
- process.ts
- knowledge.ts
- codex-rollout.ts
- shared.ts
- knowledge/learning-events.ts
- scheduler.ts
- delivery-task.ts
- scheduled-retrospectives.ts
- digest
- telemetry/report.ts
- outbox.ts
- DailyCTO.tsx
- delivery-binding.ts
- checkpoint-completion.ts
- reader.ts
- .emit
- .now
- knowledge-sources.ts
- command-registry.ts
- extract-worker.mjs
- slack-supersession.ts
- helper-evidence.py
- .value
- create-candidate.ts
- offices.ts
- goal-reviews.ts
- cli.ts
- MaintenanceRun

## God Nodes (most connected - your core abstractions)
1. `Store` - 322 edges
2. `TicketJob` - 144 edges
3. `GitHubDelivery` - 135 edges
4. `digest()` - 105 edges
5. `command()` - 105 edges
6. `artifact()` - 98 edges
7. `workKey()` - 91 edges
8. `cx()` - 88 edges
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

## Communities (107 total, 2 thin omitted)

### Community 0 - "dependency-bots/adopt.ts"
Cohesion: 0.14
Nodes (27): Execute, adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR, openDependabotPulls() (+19 more)

### Community 1 - "record-trigger.ts"
Cohesion: 0.21
Nodes (19): clip(), JobLike, recordCIBudget(), recordParked(), recordRepairBudget(), recordTicketParked(), recordTrigger(), subjectOf() (+11 more)

### Community 2 - "App.tsx"
Cohesion: 0.05
Nodes (47): BrainDrawer(), selectRecord(), MapNodePanel(), filterNames, initial, MapView(), themeColor, BrainWorkspace (+39 more)

### Community 3 - "source-amendment.ts"
Cohesion: 0.07
Nodes (62): approvedText(), assert(), amendmentIssueSha256(), authorizeSourceAmendment(), Binding, assert(), normalize(), officialUrls (+54 more)

### Community 4 - "engine.ts"
Cohesion: 0.07
Nodes (22): correlatedBuild(), JiraOperations, plain(), checkMail(), drainMail(), requestMail(), dispatchNightly(), drainDelivery() (+14 more)

### Community 5 - "post-conflict-preparation.ts"
Cohesion: 0.09
Nodes (52): assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), reconcileCompletedConflictDraft(), routeReadyPostConflictPublication(), verifyInitialDraftConflictPreparation() (+44 more)

### Community 6 - "conversations/conversations.ts"
Cohesion: 0.10
Nodes (25): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+17 more)

### Community 7 - "scope-repair-resume.ts"
Cohesion: 0.17
Nodes (29): Assessment, outsideScanSources(), Ownership, reconcileScopeRepairReadback(), requireThat(), scopeRepairReadbackCandidate(), scopeRepairRequestResolved(), sha (+21 more)

### Community 8 - "cx"
Cohesion: 0.07
Nodes (53): EvidenceCard(), TicketHeading(), CameraBookmark, restoreBookmark(), Avatar(), AzureWall(), Chair(), Coworker() (+45 more)

### Community 9 - "worker-runtime.ts"
Cohesion: 0.07
Nodes (47): candidateWorkspaceEnvironment(), assertDigestDispatch(), assignmentSubject(), dispatchExposure(), prepareExposure(), assertRetainedDispatchScope(), contextPacket(), assertModelOverrides() (+39 more)

### Community 10 - "Inspector.tsx"
Cohesion: 0.08
Nodes (53): Conversation(), Outbox(), SendMessage, recommendedReply(), slackMessageStatus(), SlackDeliveryCard(), labels, ServiceHealthRow() (+45 more)

### Community 11 - "github-delivery.ts"
Cohesion: 0.06
Nodes (72): containedFile(), removeAdoptedClone(), findingsBlock(), namedRepairIds(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery() (+64 more)

### Community 12 - "harnessEffect"
Cohesion: 0.29
Nodes (12): activeEffectId(), harnessEffect, officeMergeProvenance(), reconcileMergeScannerRetry(), Retry, retryMergeScanner(), retryReadBack(), runIdentity() (+4 more)

### Community 13 - "sanitize"
Cohesion: 0.15
Nodes (14): settleRequestedSlackReplacement(), SlackMessages, SlackRequestSchema, goalNoticeAuthorized(), sendGoalNotice(), maintenanceNoticeAuthorized(), sendMaintenanceNotice(), sanitize() (+6 more)

### Community 14 - "requests.ts"
Cohesion: 0.10
Nodes (41): closeoutReceipt(), boardPreflightCandidate(), Ownership, reconcileBoardPreflight(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership (+33 more)

### Community 15 - "agents.ts"
Cohesion: 0.07
Nodes (47): cecPrompt(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), resolvedDecisionNote(), stageInstructions, cecChatPrompt() (+39 more)

### Community 16 - "Button"
Cohesion: 0.09
Nodes (33): guidanceExcerpt(), evidenceTitle(), KnowledgeCapturePage, KnowledgeDigestDelivery, KnowledgeActivityPage, Activity(), ActivityStatus(), AssignmentKnowledge() (+25 more)

### Community 17 - "resume-provider-review.ts"
Cohesion: 0.23
Nodes (23): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), ProjectCard, projectCards(), projectGraphql() (+15 more)

### Community 18 - "index.tsx"
Cohesion: 0.09
Nodes (46): KnowledgeSourceSummary, AddPublicSource(), AddSourceForm(), SourceConnection, SourceCard(), Sources(), supported, UploadSource() (+38 more)

### Community 19 - ".getEffect"
Cohesion: 0.24
Nodes (8): publishFeature(), GitHubOperations, fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), closeNativeRefresh(), fingerprint(), EffectIntent

### Community 20 - "accept-stage-result.ts"
Cohesion: 0.17
Nodes (25): acceptStageResult(), PrerequisitesSchema, METADATA_FINDING, mergeAuthorized(), continuationWorktree(), discoveryReviewSatisfied(), dependencyVersion(), handoffSavedPrerequisites() (+17 more)

### Community 21 - "TicketJob"
Cohesion: 0.11
Nodes (48): HarnessControl, withHarnessWork(), runHarnessStage(), Check, harnessChecks(), harnessValidate(), harnessValidationEligible(), scriptExit() (+40 more)

### Community 22 - "lesson-selection.ts"
Cohesion: 0.15
Nodes (21): knowledgeContext(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), LessonSelection, MAINTENANCE (+13 more)

### Community 23 - "constellation-runtime.ts"
Cohesion: 0.08
Nodes (37): KnowledgeActivity, KnowledgeEdge, KnowledgeIntakeStatus, KnowledgeMap, KnowledgeNode, CameraPose, flightPose(), cameraTarget() (+29 more)

### Community 24 - "SourceRegistry"
Cohesion: 0.13
Nodes (25): captureProposal(), effectId(), Config, configDigest(), IntakeConfig, readConfig(), SlackReadAuthority, collectionAllowed() (+17 more)

### Community 25 - "PeoplePanel.tsx"
Cohesion: 0.10
Nodes (40): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+32 more)

### Community 26 - "work-summary.ts"
Cohesion: 0.14
Nodes (28): App(), usePanelFocus(), TicketDetail(), envelopeCard, deliveryRepairProjection(), DependencyNotice(), card, InboxQueue() (+20 more)

### Community 27 - "TimeBook.tsx"
Cohesion: 0.09
Nodes (42): TelemetryReport, displayAgentTask(), githubStageLabels, withoutElapsed(), LiveAgentTask(), Props, RunningTask(), text() (+34 more)

### Community 28 - "azure.ts"
Cohesion: 0.15
Nodes (20): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+12 more)

### Community 29 - "maintenance.ts"
Cohesion: 0.10
Nodes (27): maintenancePolicies(), reconcileNativeDelivery(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice(), candidateOwner() (+19 more)

### Community 30 - "GitHubDelivery"
Cohesion: 0.09
Nodes (35): GitHubDelivery, checksFailed(), checksPassed(), checksPending(), CurrentChecksWait, currentMergeChecks(), pass(), pending() (+27 more)

### Community 31 - "Store"
Cohesion: 0.13
Nodes (5): GitHubFeaturePublisher, Assessment, Store, command(), OfficeEvent

### Community 32 - "retrospective-subject.ts"
Cohesion: 0.19
Nodes (15): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+7 more)

### Community 33 - "features/workflow.ts"
Cohesion: 0.10
Nodes (45): approveFeature(), commandFeature(), createFeature(), featureById(), mutation(), discoveryPrompt(), planPrompt(), artifactPath() (+37 more)

### Community 34 - "store.ts"
Cohesion: 0.14
Nodes (15): applyConnectionSettings(), closeConnection(), optimizeOnOpen(), comparable(), EvidenceOutcome, recordRunEvidence(), statementCache(), initialSnapshot() (+7 more)

### Community 35 - "features.ts"
Cohesion: 0.10
Nodes (22): assertFeatureDependencyOrder(), featureDependencyEdges(), key(), FeatureApproval, FeatureAuthority, FeatureDocument, FeatureEvidenceRef, FeatureHandoff (+14 more)

### Community 36 - "session-bridge.ts"
Cohesion: 0.11
Nodes (27): claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexSessionContext(), readRollout, claudeSessions(), codexSessions() (+19 more)

### Community 37 - "cec/issue-publication.ts"
Cohesion: 0.10
Nodes (19): Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), plainDescription(), Transition, unpack() (+11 more)

### Community 38 - ".transaction"
Cohesion: 0.10
Nodes (35): reviewQuestions(), featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS, reserveReplacement() (+27 more)

### Community 39 - "slack-intake/run.ts"
Cohesion: 0.14
Nodes (30): annotateAuthoredUnits(), independentIntakeResult(), newTask(), recordObservation(), settlePage(), CaptureReceipt, IntakeResult, IntakeResultValue (+22 more)

### Community 40 - "run-accounting.ts"
Cohesion: 0.11
Nodes (33): ghLogCacheEvidence(), BoundedRead, done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf(), CompletionReader (+25 more)

### Community 41 - "telemetry.ts"
Cohesion: 0.09
Nodes (27): CodexRollout, CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL (+19 more)

### Community 42 - "cec/workflow.ts"
Cohesion: 0.13
Nodes (33): parksInJira(), MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), run(), advance(), nextStage(), publicationEvidenceGap() (+25 more)

### Community 43 - "tracking-issue.ts"
Cohesion: 0.20
Nodes (17): readBackOrThrow(), ensureTrackingIssue(), findTrackingIssue(), ownTracking(), TrackingIssue, trackingIssueBody(), trackingIssueTitle(), trackingMarker() (+9 more)

### Community 44 - "merge-summary.ts"
Cohesion: 0.43
Nodes (6): clamp(), LIMITS, MergedPR, plainSlackText(), section(), shippedSummary()

### Community 45 - "http/commands.ts"
Cohesion: 0.16
Nodes (25): enqueueMetadataRecovery(), normalizeStatement(), configureDigestDelivery(), DigestSettings, configureKnowledge(), declineLessonIssue(), demoteLesson(), reactivateLesson() (+17 more)

### Community 46 - "scheduled-work.ts"
Cohesion: 0.10
Nodes (43): deliverySlot(), ROLES, closeoutRequestResolved(), metadataRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), deterministicActions, eligible() (+35 more)

### Community 47 - "investigations/run.ts"
Cohesion: 0.13
Nodes (26): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationCandidates(), investigationId(), investigationEvidence(), investigationFollowUps(), INVOCATION_SOURCE_REFS, invocationSource() (+18 more)

### Community 48 - "run-retrospective.ts"
Cohesion: 0.07
Nodes (51): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, appendLearningFacts(), learningMetrics(), lessonsNeedingReview(), freezeLearningPacket(), ARTIFACT_LIMIT (+43 more)

### Community 49 - "observations.ts"
Cohesion: 0.18
Nodes (15): ChannelProgress, Observation, Message, observeRead(), Page, readArguments(), ReadUnavailable, IntakeRateLimit (+7 more)

### Community 50 - "knowledge/routes.ts"
Cohesion: 0.13
Nodes (24): diagnosticSnapshot(), retainedArtifactScope(), eventSourceBindings(), eventVisible(), exposureBindings(), requestSourceBindings(), publicSearch(), knowledgeOfficeState() (+16 more)

### Community 51 - "LessonsPanel.tsx"
Cohesion: 0.13
Nodes (18): OfficeProposal, RetrospectiveRecord, WeeklyRollup, BlockerFollowups(), IntakeSummary(), lessonsView, newest(), ROLLUP_ROWS (+10 more)

### Community 52 - "read-links.ts"
Cohesion: 0.16
Nodes (20): createExtractor(), extractDocument, Extraction, Extractor, uploadArtifact(), KnowledgeRunner, retryDelay(), privateFile() (+12 more)

### Community 53 - ".save"
Cohesion: 0.24
Nodes (23): BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue(), readIssues(), commentDecision() (+15 more)

### Community 54 - "work.ts"
Cohesion: 0.18
Nodes (10): AssignmentResult, CompletionCondition, Continuation, DependencyObservation, EligibilityState, FailureCategory, ReconciliationAction, ReconciliationRequest (+2 more)

### Community 55 - "jira-time.ts"
Cohesion: 0.15
Nodes (17): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+9 more)

### Community 56 - "WorkTime"
Cohesion: 0.14
Nodes (31): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence(), CaptureContext (+23 more)

### Community 57 - "Coordinator"
Cohesion: 0.08
Nodes (4): PickupSchema, savePickup(), coordination(), Coordinator

### Community 58 - "blocker-followups.ts"
Cohesion: 0.14
Nodes (25): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved() (+17 more)

### Community 59 - "sourceVisible"
Cohesion: 0.11
Nodes (46): intakeActivity(), knowledgeActivity(), knowledgeActivityPage(), KnowledgeContext, independentDigestEvidence(), retainOutboundBody(), digestNoticeRequest(), queueOutboundDigests() (+38 more)

### Community 60 - "publish-pr.ts"
Cohesion: 0.17
Nodes (16): retryRead(), commitlintRejection(), developerPRContent(), Execute, officePRContent(), prContent, PRContentRejected, assertCandidate() (+8 more)

### Community 61 - "index.ts"
Cohesion: 0.09
Nodes (31): AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), FeaturePlanningBindings, close(), config, itSpecialist, loadedRevision, offices (+23 more)

### Community 62 - "notifications.ts"
Cohesion: 0.17
Nodes (17): configureNotices(), Identity, mergeText(), NoticeSettings, noticeState(), queueMergeNotice(), retryRecipientLookup(), observeGitHubMergeNotices() (+9 more)

### Community 63 - "dependencies.ts"
Cohesion: 0.28
Nodes (15): Admission, admit(), IntakeContext, compatible(), dependencyCompletionKey(), dependencyEligibility(), DependencyStores, issueKey() (+7 more)

### Community 64 - "assertMayMutate"
Cohesion: 0.14
Nodes (25): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+17 more)

### Community 65 - "slack-intake/report.ts"
Cohesion: 0.25
Nodes (18): Proposal, ReadTask, isStoppingFor(), intakeProgress(), terminalDeferred(), unitKey(), verifiedCapture(), LinkRecord (+10 more)

### Community 66 - "highestStableAtLeast"
Cohesion: 0.83
Nodes (3): compare(), highestStableAtLeast(), parts()

### Community 67 - "github.ts"
Cohesion: 0.29
Nodes (6): GitHubMonitor, githubPRDescription(), GOAL_EVIDENCE_LIMITS, GitHubBoard, GitHubPR, GitHubState

### Community 68 - "coordination.ts"
Cohesion: 0.16
Nodes (19): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), legacy, validateNativeContinuation(), checkpointWindow() (+11 more)

### Community 69 - "OfficeSnapshot"
Cohesion: 0.12
Nodes (21): DailyCTOSummary, FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures(), draftKey() (+13 more)

### Community 70 - "schedule.ts"
Cohesion: 0.15
Nodes (20): reconcileIntakeStatus(), scheduledSlackIntake(), sourceWork(), combineIntakeMetrics(), IntakeMetrics, intakeStatusMetrics(), validTime(), IntakeBudget (+12 more)

### Community 71 - "workKey"
Cohesion: 0.07
Nodes (56): completedPRReviews(), adoptCandidate(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related (+48 more)

### Community 72 - "service-health.ts"
Cohesion: 0.18
Nodes (10): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, slackHealth() (+2 more)

### Community 73 - "channel-notice.ts"
Cohesion: 0.29
Nodes (6): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), MergeNotifications

### Community 74 - "digest"
Cohesion: 0.09
Nodes (76): closeoutCheckpoint(), closeoutRecoveryCandidate(), CloseoutRecoveryKind, coreCloseoutNative(), verifiedCloseoutCleanupRequest(), partialLocalCleanupCandidate(), partialLocalCleanupKey(), activationAuditResponseSchema() (+68 more)

### Community 75 - "admit-improvement.ts"
Cohesion: 0.25
Nodes (13): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+5 more)

### Community 76 - "ControlStore"
Cohesion: 0.14
Nodes (10): mirror(), runWeeklyResearch(), scheduledResearch(), DailyCTO, dailyReviewPrompt(), DailyResultSchema, Briefing, saveReviewBriefing() (+2 more)

### Community 77 - "goal-reporting.ts"
Cohesion: 0.17
Nodes (22): collectCTOFacts(), EvidenceRequestConflict, evidenceRequestConflicts, boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip() (+14 more)

### Community 78 - "process.ts"
Cohesion: 0.14
Nodes (19): At, Errno, GroupInventory, GroupProbe, LifecycleDiagnostic, Phase, Pid, lifecycleFacts() (+11 more)

### Community 79 - "knowledge.ts"
Cohesion: 0.10
Nodes (28): assignmentKnowledge(), AssignmentLookups, Binding, lookupInstructions(), decodeLookupJournal(), lookupJournal, readLookupJournal(), referenceVisible() (+20 more)

### Community 80 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 81 - "shared.ts"
Cohesion: 0.05
Nodes (47): diagnosticContext(), preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, ProjectReadiness (+39 more)

### Community 82 - "knowledge/learning-events.ts"
Cohesion: 0.17
Nodes (18): captureLearning(), learningDigest(), recordLearningOpportunity(), baselineLearning(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences() (+10 more)

### Community 83 - "scheduler.ts"
Cohesion: 0.18
Nodes (12): fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch(), foreignWork(), WorkSlot (+4 more)

### Community 84 - "delivery-task.ts"
Cohesion: 0.31
Nodes (7): reviewInstructions(), deliveryTask(), DeliveryTaskInput, DISCOVERY_GUIDANCE, compactSteps(), AMENDMENT_REVIEW_PROOF, featureDeliveryContext()

### Community 85 - "scheduled-retrospectives.ts"
Cohesion: 0.48
Nodes (6): busyMaintenanceIds(), triggerJobId(), busySubjects(), scheduledRetrospectives(), status(), WorkEligibility

### Community 86 - "digest"
Cohesion: 0.18
Nodes (19): comparableSlackText(), AuthoredDigest, reconcileDigestAuthorship(), unitAuthorship(), outboundBody(), reconcileAuthoredEvidence(), digest(), exactly() (+11 more)

### Community 87 - "telemetry/report.ts"
Cohesion: 0.33
Nodes (11): Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked(), row() (+3 more)

### Community 88 - "outbox.ts"
Cohesion: 0.13
Nodes (25): projectOutbox(), syncOutbox(), projectSlackDeliveries(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint(), slackRequestSettled() (+17 more)

### Community 89 - "DailyCTO.tsx"
Cohesion: 0.23
Nodes (9): CTOReview(), goalState, DailyCTO(), GoalHistory(), reportDate(), reviewStatus, reviewExcerpt(), ReviewText() (+1 more)

### Community 90 - "delivery-binding.ts"
Cohesion: 0.22
Nodes (14): bindDelivery(), featureEffectGate(), assertEnrollable(), assertFeatureGate(), bindFeature(), currentApproval(), enrolled(), featureGate() (+6 more)

### Community 91 - "checkpoint-completion.ts"
Cohesion: 0.28
Nodes (5): BrainStatusSchema, identity, coverageSchema, followupSchema, verified

### Community 92 - "reader.ts"
Cohesion: 0.08
Nodes (20): captureAfter(), CaptureMetadata, capturePage(), cursor(), key(), captureIdentityMatches(), BrainCaptureReceipt, hash (+12 more)

### Community 93 - ".emit"
Cohesion: 0.15
Nodes (15): reconcileNoticeConfirmations(), BrainFollowup, Result, brainCheckpointCompletion(), reconcileCompletedCheckpoints(), reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS (+7 more)

### Community 95 - "knowledge-sources.ts"
Cohesion: 0.33
Nodes (5): KnowledgeCadence, KnowledgeDestination, KnowledgeSourceKind, KnowledgeSourceState, SourceSubscription

### Community 97 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 103 - "extract-worker.mjs"
Cohesion: 0.70
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 104 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 108 - ".value"
Cohesion: 0.27
Nodes (6): file, folder, logs, root, xml(), ProjectProgress

### Community 109 - "create-candidate.ts"
Cohesion: 0.31
Nodes (9): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+1 more)

### Community 112 - "offices.ts"
Cohesion: 0.09
Nodes (19): leadershipContext(), leadershipEntries(), knowledgeEntries(), readLocalIntakeReport(), recoverStoppedLaunches(), sourceSchema(), Clock, systemClock (+11 more)

### Community 113 - "goal-reviews.ts"
Cohesion: 0.18
Nodes (12): applyGoalReview(), EvidenceRefSchema, FreshDailyResultSchema, statusAllowed(), workEvidence(), DailyCTOBriefing, DailyCTOResult, DailyGoalUpdate (+4 more)

### Community 114 - "cli.ts"
Cohesion: 0.25
Nodes (6): args, [cmd,...rawArgs], commands, key, projectIndex, PORT

### Community 119 - "MaintenanceRun"
Cohesion: 0.18
Nodes (14): clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates(), maintenanceCompletedId(), maintenanceKey(), visibleMaintenanceTriggerIds(), TerminalCandidate (+6 more)

## Knowledge Gaps
- **403 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+398 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `dependency-bots/adopt.ts`, `record-trigger.ts`, `source-amendment.ts`, `engine.ts`, `post-conflict-preparation.ts`, `conversations/conversations.ts`, `scope-repair-resume.ts`, `worker-runtime.ts`, `github-delivery.ts`, `harnessEffect`, `sanitize`, `requests.ts`, `agents.ts`, `resume-provider-review.ts`, `.getEffect`, `accept-stage-result.ts`, `TicketJob`, `lesson-selection.ts`, `SourceRegistry`, `azure.ts`, `maintenance.ts`, `retrospective-subject.ts`, `features/workflow.ts`, `store.ts`, `features.ts`, `session-bridge.ts`, `cec/issue-publication.ts`, `.transaction`, `slack-intake/run.ts`, `run-accounting.ts`, `cec/workflow.ts`, `tracking-issue.ts`, `http/commands.ts`, `scheduled-work.ts`, `investigations/run.ts`, `run-retrospective.ts`, `knowledge/routes.ts`, `read-links.ts`, `.save`, `jira-time.ts`, `WorkTime`, `blocker-followups.ts`, `sourceVisible`, `publish-pr.ts`, `index.ts`, `notifications.ts`, `dependencies.ts`, `assertMayMutate`, `slack-intake/report.ts`, `github.ts`, `coordination.ts`, `OfficeSnapshot`, `schedule.ts`, `workKey`, `channel-notice.ts`, `digest`, `admit-improvement.ts`, `goal-reporting.ts`, `knowledge.ts`, `shared.ts`, `knowledge/learning-events.ts`, `scheduler.ts`, `delivery-task.ts`, `scheduled-retrospectives.ts`, `digest`, `outbox.ts`, `delivery-binding.ts`, `checkpoint-completion.ts`, `.emit`, `.now`, `create-candidate.ts`, `offices.ts`, `goal-reviews.ts`?**
  _High betweenness centrality (0.139) - this node is a cross-community bridge._
- **Why does `Role` connect `agents.ts` to `App.tsx`, `conversations/conversations.ts`, `cx`, `worker-runtime.ts`, `Inspector.tsx`, `github-delivery.ts`, `accept-stage-result.ts`, `TicketJob`, `PeoplePanel.tsx`, `maintenance.ts`, `retrospective-subject.ts`, `store.ts`, `run-accounting.ts`, `cec/workflow.ts`, `http/commands.ts`, `scheduled-work.ts`, `knowledge/routes.ts`, `work.ts`, `OfficeSnapshot`, `shared.ts`, `scheduler.ts`, `outbox.ts`, `.emit`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `OfficeSnapshot` connect `OfficeSnapshot` to `App.tsx`, `cx`, `Inspector.tsx`, `Button`, `index.tsx`, `PeoplePanel.tsx`, `work-summary.ts`, `TimeBook.tsx`, `azure.ts`, `maintenance.ts`, `Store`, `store.ts`, `cec/workflow.ts`, `investigations/run.ts`, `knowledge/routes.ts`, `LessonsPanel.tsx`, `service-health.ts`, `shared.ts`, `scheduler.ts`, `outbox.ts`, `DailyCTO.tsx`, `MaintenanceRun`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `command()` (e.g. with `.constructor()` and `executeRequest()`) actually correct?**
  _`command()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _403 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dependency-bots/adopt.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.04949874686716792 - nodes in this community are weakly interconnected._