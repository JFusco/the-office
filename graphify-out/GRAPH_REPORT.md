# Graph Report - office-publication-recovery  (2026-11-11)

## Corpus Check
- 815 files · ~323,317 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3993 nodes · 18330 edges · 92 communities (89 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 110 edges (avg confidence: 0.74)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3a7f79f5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- github-delivery.ts
- artifact
- currentAssignment
- registry.ts
- TicketJob
- shared.ts
- SourceRegistry
- digest
- run-retrospective.ts
- process.ts
- Inspector.tsx
- retrospective-triggers.ts
- OfficeScene.tsx
- store.ts
- App.tsx
- agents.ts
- index.tsx
- MapView.tsx
- scheduled-captures.ts
- authorize.ts
- worker-runtime.ts
- Store
- daily-cto.ts
- source-amendment.ts
- conversations/conversations.ts
- Library.tsx
- workKey
- digest
- cec/issue-publication.ts
- knowledge.ts
- session-bridge.ts
- index.ts
- .save
- closeout-recovery.ts
- blocker-followups.ts
- scheduler.ts
- cec/workflow.ts
- offices.ts
- TelemetryPanel.tsx
- source-amendment-scope.ts
- investigations/run.ts
- azure.ts
- features.ts
- run-accounting.ts
- telemetry.ts
- slack-intake/config.ts
- cost-ledger.ts
- .emit
- WorkTime
- harnessEffect
- scheduled-work.ts
- features/workflow.ts
- outbox.ts
- features/commands.ts
- jira-time.ts
- Coordinator
- maintenance/maintenance.ts
- LessonsPanel.tsx
- remove-candidate.ts
- .getEffect
- intake/admission.ts
- ticket-evidence.ts
- MaintenanceRun
- dependency-bots/adopt.ts
- packed165-admission.ts
- useOfficePreferences.ts
- tracking-issue.ts
- coordination.ts
- office/config.ts
- brain-maintenance.ts
- assignment-poll.ts
- coordination-tick.ts
- telemetry/report.ts
- work.ts
- DailyCTO.tsx
- jira-operations.ts
- release-unpark.ts
- stopped-base-validation.ts
- command-registry.ts
- QuestionDialogHost.tsx
- evidence-digest.ts
- codex-rollout.ts
- cli.ts
- owned-artifact.ts
- OfficeConfigView.tsx
- extract-worker.mjs
- extraction.ts
- BrainFollowup
- slack-supersession.ts
- helper-evidence.py
- packed-publication-repair.ts

## God Nodes (most connected - your core abstractions)
1. `Store` - 364 edges
2. `TicketJob` - 172 edges
3. `GitHubDelivery` - 147 edges
4. `digest()` - 145 edges
5. `artifact()` - 123 edges
6. `command()` - 110 edges
7. `workKey()` - 99 edges
8. `cx()` - 88 edges
9. `currentAssignment()` - 82 edges
10. `OfficeSnapshot` - 71 edges

## Surprising Connections (you probably didn't know these)
- `readAzurePRs()` --indirect_call--> `row()`  [INFERRED]
  server/cec/observed-prs.ts → src/telemetry/report.ts
- `rows()` --indirect_call--> `row()`  [INFERRED]
  server/delivery/recovery/source-amendment/source-amendment-held.ts → src/telemetry/report.ts
- `proveOutsideAmendmentUnchanged()` --indirect_call--> `row()`  [INFERRED]
  server/delivery/recovery/source-amendment/source-amendment-held.ts → src/telemetry/report.ts
- `rows()` --indirect_call--> `row()`  [INFERRED]
  server/delivery/recovery/source-amendment/source-amendment-scope.ts → src/telemetry/report.ts
- `readStoppedBaseProviderContext()` --indirect_call--> `row()`  [INFERRED]
  server/delivery/recovery/stopped-base-provider.ts → src/telemetry/report.ts

## Import Cycles
- 3-file cycle: `src/knowledge/map/Constellation.tsx -> src/knowledge/map/constellation-runtime.ts -> src/knowledge/map/node-visuals.ts -> src/knowledge/map/Constellation.tsx`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/stage-reconciliation.ts -> server/delivery/recovery/implementation/continuation-review-readback.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/preparation/post-conflict-preparation.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/stopped-base-review.ts -> server/delivery/recovery/stopped-base-checkout.ts -> server/delivery/pipeline/github-delivery.ts`
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

## Communities (92 total, 3 thin omitted)

### Community 0 - "github-delivery.ts"
Cohesion: 0.05
Nodes (111): containedFile(), findingsBlock(), namedRepairIds(), assertDeliveryMayMutate(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery() (+103 more)

### Community 1 - "artifact"
Cohesion: 0.05
Nodes (103): admitGreen156(), GREEN156, green156Subject(), retainedGreen156Audit(), assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence() (+95 more)

### Community 2 - "currentAssignment"
Cohesion: 0.06
Nodes (105): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+97 more)

### Community 3 - "registry.ts"
Cohesion: 0.07
Nodes (73): intakeActivity(), knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), BrainGraph, KnowledgeContext, independentDigestEvidence(), digestKnowledge() (+65 more)

### Community 4 - "TicketJob"
Cohesion: 0.05
Nodes (59): removeAdoptedClone(), harnessCloseout(), PASSING, verifyMergeActions(), HarnessControl, withHarnessWork(), runHarnessStage(), harnessStageResult() (+51 more)

### Community 5 - "shared.ts"
Cohesion: 0.04
Nodes (80): ProjectReadiness, DailyCTOSummary, GoalProgress, Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId (+72 more)

### Community 6 - "SourceRegistry"
Cohesion: 0.06
Nodes (65): knowledgeScopeRevision(), learningMetrics(), RollupResult, RollupResultSchema, harperFolder(), KnowledgeRunner, RETROSPECTIVE_TIMEOUT, ChannelProgress (+57 more)

### Community 7 - "digest"
Cohesion: 0.08
Nodes (61): comparableSlackText(), uploadArtifact(), AuthoredDigest, reconcileDigestAuthorship(), unitAuthorship(), annotateAuthoredUnits(), reconcileAuthoredEvidence(), newTask() (+53 more)

### Community 8 - "run-retrospective.ts"
Cohesion: 0.05
Nodes (69): Accepted, acceptRetrospective(), BLOCKED, normalizeStatement(), RETROSPECTIVE_HISTORY, Shared, curateLesson(), Curation (+61 more)

### Community 9 - "process.ts"
Cohesion: 0.04
Nodes (41): correlatedBuild(), enableNightly(), Event, one(), prePushRejection(), PushIdentity, Candidate, settledPushBoundary() (+33 more)

### Community 10 - "Inspector.tsx"
Cohesion: 0.08
Nodes (58): Conversation(), Outbox(), SendMessage, recommendedReply(), slackMessageStatus(), SlackDeliveryCard(), currentServices(), ServiceHealthPanel() (+50 more)

### Community 11 - "retrospective-triggers.ts"
Cohesion: 0.05
Nodes (63): deliveryMetrics(), median(), dropLessonGrading(), dropLessonGradingFields(), dropReportFields(), LEARNING, Stored, REPOSITORY_ISSUES (+55 more)

### Community 12 - "OfficeScene.tsx"
Cohesion: 0.05
Nodes (63): itAgent(), itDiagnostics(), displayAgentTask(), githubStageLabels, withoutElapsed(), CameraBookmark, restoreBookmark(), LiveAgentTask() (+55 more)

### Community 13 - "store.ts"
Cohesion: 0.06
Nodes (44): channelNoticeAuthorized(), clamp(), LIMITS, MergedPR, plainSlackText(), section(), shippedSummary(), Identity (+36 more)

### Community 14 - "App.tsx"
Cohesion: 0.05
Nodes (59): compactSteps(), themeColor, App(), BrainWorkspace, CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants (+51 more)

### Community 15 - "agents.ts"
Cohesion: 0.06
Nodes (46): cecPrompt(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), resolvedDecisionNote(), stageInstructions, ConversationResultSchema (+38 more)

### Community 16 - "index.tsx"
Cohesion: 0.08
Nodes (53): KnowledgeCadence, KnowledgeSourceKind, KnowledgeSourceState, KnowledgeSourceSummary, AddPublicSource(), AddSourceForm(), SourceConnection, SourceCard() (+45 more)

### Community 17 - "MapView.tsx"
Cohesion: 0.06
Nodes (51): KnowledgeActivity, KnowledgeEdge, KnowledgeIntakeStatus, KnowledgeMap, KnowledgeNode, EvidenceDetail(), CameraPose, flightPose() (+43 more)

### Community 18 - "scheduled-captures.ts"
Cohesion: 0.13
Nodes (53): dispatchNightly(), drainDelivery(), requestDelivery(), resume(), startPilot(), eligibility(), approvedDelivery(), bindDelivery() (+45 more)

### Community 19 - "authorize.ts"
Cohesion: 0.08
Nodes (45): approveFeature(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), artifactPath(), digest(), document() (+37 more)

### Community 20 - "worker-runtime.ts"
Cohesion: 0.06
Nodes (46): candidateWorkspaceEnvironment(), AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), assignmentSubject(), assertRetainedDispatchScope(), goalEvidencePath(), localBindings, contextPacket() (+38 more)

### Community 21 - "Store"
Cohesion: 0.09
Nodes (36): featureItemComplete(), reconcileFeatureCompletion(), readEvidence(), helperTelemetry(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS, requestReplan() (+28 more)

### Community 22 - "daily-cto.ts"
Cohesion: 0.06
Nodes (38): collectCTOFacts(), DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), reviewWeekday(), boundedIntake(), boundedJobs() (+30 more)

### Community 23 - "source-amendment.ts"
Cohesion: 0.07
Nodes (57): deliveryTask(), DeliveryTaskInput, DISCOVERY_GUIDANCE, stagePrompt(), StagePromptInput, METADATA_FINDING_GUIDANCE, adoptCandidate(), reported (+49 more)

### Community 24 - "conversations/conversations.ts"
Cohesion: 0.07
Nodes (38): assertConversationReadback(), Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff(), saveGoals() (+30 more)

### Community 25 - "Library.tsx"
Cohesion: 0.08
Nodes (36): guidanceExcerpt(), evidenceTitle(), KnowledgeActivityPage, Activity(), ActivityStatus(), ActivityTimeline(), AssignmentKnowledge(), DocumentMetadata (+28 more)

### Community 26 - "workKey"
Cohesion: 0.08
Nodes (44): deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, requireDeliveryAuthority(), deliveryIntakeBlocker(), gateRegisteredDelivery(), accounting (+36 more)

### Community 27 - "digest"
Cohesion: 0.12
Nodes (46): retryRead(), admitPRMetadata(), assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema, savedMetadataAssessment(), validateSaved() (+38 more)

### Community 28 - "cec/issue-publication.ts"
Cohesion: 0.10
Nodes (21): Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), Transition, descriptionPreimage(), plain() (+13 more)

### Community 29 - "knowledge.ts"
Cohesion: 0.08
Nodes (36): eventSourceBindings(), captureLearning(), recordLearningOpportunity(), AssignmentLookups, Binding, exposureBindings(), requestSourceBindings(), lookupInstructions() (+28 more)

### Community 30 - "session-bridge.ts"
Cohesion: 0.08
Nodes (37): claudeSessionContext(), readTranscript, root, claudeSessionScope(), accountCodexProcesses(), codexProcessInventory, DesktopSessions, unaccountedProcesses() (+29 more)

### Community 31 - "index.ts"
Cohesion: 0.08
Nodes (37): assertAssessmentVisibility(), assertQuestionVisibility(), close(), config, itSpecialist, loadedRevision, offices, releaseLock (+29 more)

### Community 32 - ".save"
Cohesion: 0.10
Nodes (38): file, folder, logs, root, xml(), BLOCKED, Execute, findComment() (+30 more)

### Community 33 - "closeout-recovery.ts"
Cohesion: 0.11
Nodes (44): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+36 more)

### Community 34 - "blocker-followups.ts"
Cohesion: 0.12
Nodes (32): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), ITContext (+24 more)

### Community 35 - "scheduler.ts"
Cohesion: 0.09
Nodes (24): busyMaintenanceIds(), busySubjects(), sourceSchema(), Clock, EASTERN, easternDayFormatter, easternPartsFormatter, systemClock (+16 more)

### Community 36 - "cec/workflow.ts"
Cohesion: 0.12
Nodes (35): applyIntakeObservation(), checkMail(), drainMail(), requestMail(), parksInJira(), MISSING_INTAKE, reconcileMailbox(), unusedMailbox() (+27 more)

### Community 37 - "offices.ts"
Cohesion: 0.09
Nodes (24): leadershipContext(), leadershipEntries(), baselineLearning(), maintainLearning(), expireLessons(), expiring(), graduateLessons(), graduating() (+16 more)

### Community 38 - "TelemetryPanel.tsx"
Cohesion: 0.11
Nodes (34): AzureBuild, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens(), usd(), KpiTiles() (+26 more)

### Community 39 - "source-amendment-scope.ts"
Cohesion: 0.08
Nodes (38): approvedText(), assert(), assert(), normalize(), officialUrls, ReleaseCapture, verifyReleaseCaptures(), amendmentCaptureObservation() (+30 more)

### Community 40 - "investigations/run.ts"
Cohesion: 0.11
Nodes (27): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_FIX_PROMPT, OfficeFixResult (+19 more)

### Community 41 - "azure.ts"
Cohesion: 0.11
Nodes (25): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+17 more)

### Community 42 - "features.ts"
Cohesion: 0.10
Nodes (29): normalizeRound(), FeatureApproval, FeatureAttempt, FeatureAuthority, FeatureDocument, FeatureHandoff, FeatureHarnessAction, FeatureHarnessOption (+21 more)

### Community 43 - "run-accounting.ts"
Cohesion: 0.11
Nodes (30): BoundedRead, backfillClaudeCost(), CompletionReader, codexHome(), createdAt(), dayDirs(), header(), readCodexRollout() (+22 more)

### Community 44 - "telemetry.ts"
Cohesion: 0.09
Nodes (29): CodexRollout, CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL (+21 more)

### Community 45 - "slack-intake/config.ts"
Cohesion: 0.09
Nodes (20): committedNotePage(), BrainNote, BrainReader, CommittedBrain, GraphNode, GraphPage, hash, Note (+12 more)

### Community 46 - "cost-ledger.ts"
Cohesion: 0.16
Nodes (25): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId(), OutsideEdit (+17 more)

### Community 47 - ".emit"
Cohesion: 0.14
Nodes (25): ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), retryRecipientLookup(), enqueueGreen156(), bindDiscoveryResume(), DiscoveryResumeInput (+17 more)

### Community 48 - "WorkTime"
Cohesion: 0.16
Nodes (26): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence(), CaptureContext (+18 more)

### Community 49 - "harnessEffect"
Cohesion: 0.21
Nodes (24): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), ProjectCard, projectCards(), projectGraphql() (+16 more)

### Community 50 - "scheduled-work.ts"
Cohesion: 0.12
Nodes (25): deliverySlot(), ROLES, closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), metadataRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork() (+17 more)

### Community 51 - "features/workflow.ts"
Cohesion: 0.15
Nodes (13): featureById(), discoveryPrompt(), planPrompt(), FeaturePublisher, publishFeature(), beginReader(), reconcilePublication(), uncertainPublications() (+5 more)

### Community 52 - "outbox.ts"
Cohesion: 0.14
Nodes (19): conversationResolved(), projectOutbox(), syncOutbox(), projectSlackDeliveries(), settleRequestedSlackReplacement(), Input, supersedeSlackDelivery(), replacementContext() (+11 more)

### Community 53 - "features/commands.ts"
Cohesion: 0.20
Nodes (20): commandFeature(), createFeature(), reviewQuestions(), assertEnrollable(), FeatureCommandSchema, applyHarnessAction(), HarnessActionInput, harnessQuestion() (+12 more)

### Community 54 - "jira-time.ts"
Cohesion: 0.14
Nodes (21): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+13 more)

### Community 55 - "Coordinator"
Cohesion: 0.08
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 56 - "maintenance/maintenance.ts"
Cohesion: 0.14
Nodes (18): captureMaintenanceStep(), candidateOwner(), SETTLED, skipOwnedCandidate(), Skipped, skippedCandidateLedger(), CmsFollowUpContext, cmsFollowUpInstructions() (+10 more)

### Community 57 - "LessonsPanel.tsx"
Cohesion: 0.12
Nodes (19): OfficeProposal, RetrospectiveRecord, WeeklyRollup, BlockerFollowups(), IntakeSummary(), lessonsView, newest(), ROLLUP_ROWS (+11 more)

### Community 58 - "remove-candidate.ts"
Cohesion: 0.18
Nodes (18): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot() (+10 more)

### Community 59 - ".getEffect"
Cohesion: 0.19
Nodes (10): GitHubOperations, admitImprovement(), improvementManifest(), improvementMarker(), improvementProvider(), linkedRepairGap(), closeNativeRefresh(), fingerprint() (+2 more)

### Community 60 - "intake/admission.ts"
Cohesion: 0.20
Nodes (19): Admission, admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, resumeParked(), compatible(), dependencyCompletionKey() (+11 more)

### Community 61 - "ticket-evidence.ts"
Cohesion: 0.20
Nodes (19): assetDownloader(), attachmentKind(), evidenceDirectory(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS, EvidenceAttachment (+11 more)

### Community 62 - "MaintenanceRun"
Cohesion: 0.15
Nodes (17): BrainStatusSchema, identity, brainCheckpointCompletion(), coverageSchema, followupSchema, verified, reconcileCompletedCheckpoints(), checkpointHasMaintenanceAlert() (+9 more)

### Community 63 - "dependency-bots/adopt.ts"
Cohesion: 0.23
Nodes (19): Execute, adoptDependabot(), closesIssue(), linkedBody(), linkPR(), dependabotPR, openDependabotPulls(), readRepo() (+11 more)

### Community 64 - "packed165-admission.ts"
Cohesion: 0.25
Nodes (16): admitPacked165(), history(), makePacked165Candidate(), packed165CandidateIdentity(), packed165Subject(), retainedPacked165Effect(), assertPacked165Original(), enqueuePacked165() (+8 more)

### Community 65 - "useOfficePreferences.ts"
Cohesion: 0.12
Nodes (18): fields, PreferencesPatch, StoredBody, acceptPreferences(), PreferenceCandidate, PreferenceState, strip(), UNKNOWN_PREFERENCES (+10 more)

### Community 66 - "tracking-issue.ts"
Cohesion: 0.19
Nodes (17): readBackOrThrow(), ensureTrackingIssue(), findTrackingIssue(), ownTracking(), TrackingIssue, trackingIssueBody(), trackingIssueTitle(), trackingMarker() (+9 more)

### Community 67 - "coordination.ts"
Cohesion: 0.17
Nodes (17): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation(), checkpointWindow(), dueAt() (+9 more)

### Community 68 - "office/config.ts"
Cohesion: 0.35
Nodes (12): currentApproval(), featureGate(), predecessorComplete(), recoveryHeld(), deliveryPreflight, handoffBinding(), readHandoff(), sameBinding() (+4 more)

### Community 69 - "brain-maintenance.ts"
Cohesion: 0.21
Nodes (10): maintenancePolicies(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice(), easternDate(), weeklyDue() (+2 more)

### Community 70 - "assignment-poll.ts"
Cohesion: 0.20
Nodes (11): configureNotices(), NoticeSettings, noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), pinCourier, ACTIONS, OWNER (+3 more)

### Community 71 - "coordination-tick.ts"
Cohesion: 0.23
Nodes (11): PrerequisitesSchema, legacy, reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION, tick(), incompleteReadOutput() (+3 more)

### Community 72 - "telemetry/report.ts"
Cohesion: 0.27
Nodes (13): telemetryRoute(), Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked() (+5 more)

### Community 73 - "work.ts"
Cohesion: 0.15
Nodes (12): AssignmentResult, CompletionCondition, Continuation, DeliveryAdmission, DependencyObservation, EligibilityState, FailureCategory, ReconciliationAction (+4 more)

### Community 74 - "DailyCTO.tsx"
Cohesion: 0.23
Nodes (9): CTOReview(), goalState, DailyCTO(), GoalHistory(), reportDate(), reviewStatus, reviewExcerpt(), ReviewText() (+1 more)

### Community 75 - "jira-operations.ts"
Cohesion: 0.30
Nodes (6): CommentPage, commentReadback(), JiraOperations, plain(), unpack(), jiraRecord()

### Community 76 - "release-unpark.ts"
Cohesion: 0.31
Nodes (9): due(), MAX_RELEASE_UNPARKS, RELEASE_CHECK_MS, returnToPickup(), unparkReleasedWaits(), unreadLaneWrite(), compare(), highestStableAtLeast() (+1 more)

### Community 77 - "stopped-base-validation.ts"
Cohesion: 0.42
Nodes (8): continuationNativeReview(), assertStoppedBaseApproach(), stoppedBaseNextStage(), stoppedBasePackedCommands(), assertAcceptedFiles(), assertStoppedBaseMergeReady(), assertStoppedBaseValidation(), stoppedBaseStageProof()

### Community 78 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 79 - "QuestionDialogHost.tsx"
Cohesion: 0.44
Nodes (7): FeatureQuestionProjection, nextQuestion(), orderedQuestions(), questionKey(), QuestionDialogHost(), readSuppressed(), Dialog()

### Community 80 - "evidence-digest.ts"
Cohesion: 0.44
Nodes (7): canonical(), evidenceDigest(), evidenceHash(), semantic(), stableUrl(), requirementDrift(), RequirementPostimage

### Community 81 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 82 - "cli.ts"
Cohesion: 0.25
Nodes (6): args, [cmd,...rawArgs], commands, key, projectIndex, PORT

### Community 83 - "owned-artifact.ts"
Cohesion: 0.54
Nodes (6): ghLogCacheEvidence(), done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf()

### Community 84 - "OfficeConfigView.tsx"
Cohesion: 0.48
Nodes (5): loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView(), OfficeConfigSummary

### Community 85 - "extract-worker.mjs"
Cohesion: 0.70
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 86 - "extraction.ts"
Cohesion: 0.50
Nodes (4): createExtractor(), extractDocument, Extraction, Extractor

### Community 88 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

## Knowledge Gaps
- **440 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+435 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `github-delivery.ts`, `artifact`, `currentAssignment`, `registry.ts`, `TicketJob`, `shared.ts`, `SourceRegistry`, `digest`, `run-retrospective.ts`, `process.ts`, `retrospective-triggers.ts`, `store.ts`, `agents.ts`, `scheduled-captures.ts`, `authorize.ts`, `worker-runtime.ts`, `daily-cto.ts`, `source-amendment.ts`, `conversations/conversations.ts`, `workKey`, `digest`, `cec/issue-publication.ts`, `knowledge.ts`, `session-bridge.ts`, `index.ts`, `.save`, `closeout-recovery.ts`, `blocker-followups.ts`, `scheduler.ts`, `cec/workflow.ts`, `offices.ts`, `investigations/run.ts`, `azure.ts`, `run-accounting.ts`, `slack-intake/config.ts`, `cost-ledger.ts`, `.emit`, `WorkTime`, `harnessEffect`, `scheduled-work.ts`, `features/workflow.ts`, `outbox.ts`, `features/commands.ts`, `jira-time.ts`, `Coordinator`, `maintenance/maintenance.ts`, `remove-candidate.ts`, `.getEffect`, `intake/admission.ts`, `ticket-evidence.ts`, `MaintenanceRun`, `dependency-bots/adopt.ts`, `packed165-admission.ts`, `tracking-issue.ts`, `coordination.ts`, `office/config.ts`, `brain-maintenance.ts`, `coordination-tick.ts`, `telemetry/report.ts`, `jira-operations.ts`, `release-unpark.ts`, `stopped-base-validation.ts`, `BrainFollowup`?**
  _High betweenness centrality (0.138) - this node is a cross-community bridge._
- **Why does `command()` connect `process.ts` to `github-delivery.ts`, `artifact`, `currentAssignment`, `TicketJob`, `digest`, `store.ts`, `agents.ts`, `authorize.ts`, `worker-runtime.ts`, `Store`, `digest`, `cec/issue-publication.ts`, `session-bridge.ts`, `index.ts`, `.save`, `closeout-recovery.ts`, `cec/workflow.ts`, `offices.ts`, `azure.ts`, `slack-intake/config.ts`, `cost-ledger.ts`, `harnessEffect`, `scheduled-work.ts`, `features/workflow.ts`, `outbox.ts`, `jira-time.ts`, `Coordinator`, `maintenance/maintenance.ts`, `remove-candidate.ts`, `.getEffect`, `intake/admission.ts`, `ticket-evidence.ts`, `coordination.ts`, `brain-maintenance.ts`, `jira-operations.ts`, `command-registry.ts`, `BrainFollowup`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `TicketJob` connect `TicketJob` to `github-delivery.ts`, `artifact`, `currentAssignment`, `shared.ts`, `process.ts`, `Inspector.tsx`, `retrospective-triggers.ts`, `App.tsx`, `scheduled-captures.ts`, `worker-runtime.ts`, `daily-cto.ts`, `source-amendment.ts`, `workKey`, `digest`, `.save`, `closeout-recovery.ts`, `blocker-followups.ts`, `cec/workflow.ts`, `harnessEffect`, `scheduled-work.ts`, `remove-candidate.ts`, `intake/admission.ts`, `MaintenanceRun`, `dependency-bots/adopt.ts`, `packed165-admission.ts`, `tracking-issue.ts`, `release-unpark.ts`, `stopped-base-validation.ts`, `owned-artifact.ts`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _440 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `github-delivery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05044874822862541 - nodes in this community are weakly interconnected._
- **Should `artifact` be split into smaller, more focused modules?**
  _Cohesion score 0.05319268320053866 - nodes in this community are weakly interconnected._
- **Should `currentAssignment` be split into smaller, more focused modules?**
  _Cohesion score 0.05511111111111111 - nodes in this community are weakly interconnected._