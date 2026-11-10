# Graph Report - the-office  (2026-11-10)

## Corpus Check
- 714 files · ~294,599 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3635 nodes · 16265 edges · 102 communities (100 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 96 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `fca6e601`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- dependency-bots/adopt.ts
- record-trigger.ts
- App.tsx
- source-amendment-scope.ts
- Engine
- artifact
- index.ts
- requests.ts
- cx
- .run
- index.tsx
- github-delivery.ts
- github-context.ts
- conversations/slack.ts
- continuationWorkerProof
- store.ts
- Button
- harnessEffect
- mutedCopy
- .getEffect
- saved-prerequisite-handoff.ts
- digest
- lesson-selection.ts
- constellation-runtime.ts
- SourceRegistry
- shared.ts
- OfficeSnapshot
- TelemetryPanel.tsx
- azure.ts
- maintenance.ts
- TicketJob
- scheduled-work.ts
- features/workflow.ts
- authorize.ts
- engine.ts
- features.ts
- session-bridge.ts
- cec/issue-publication.ts
- .transaction
- contracts.ts
- run-accounting.ts
- telemetry.ts
- approach.ts
- tracking-issue.ts
- github/issue-publication.ts
- http/commands.ts
- cost-ledger.ts
- investigations/run.ts
- run-retrospective.ts
- slack-intake/run.ts
- api-routes.ts
- outbound.ts
- IntakeLedger
- park-ticket.ts
- work.ts
- jira-time.ts
- WorkTime
- Coordinator
- it-specialist.ts
- knowledge/routes.ts
- discovery-recovery.ts
- model-routes.ts
- assignment-poll.ts
- dependencies.ts
- remove-candidate.ts
- slack-intake/report.ts
- documentText
- goal-evidence.ts
- coordination.ts
- Goals.tsx
- weekly-rollup.ts
- workKey
- SlackMessages
- notifications.ts
- activation-recovery.ts
- knowledge/learning-events.ts
- daily-cto.ts
- .emit
- process.ts
- knowledge.ts
- time-classification.ts
- preferences-store.ts
- OfficeConfigView.tsx
- Store
- delivery-task.ts
- dependency-edges.ts
- digest
- telemetry/report.ts
- outbox.ts
- delivery-binding.ts
- MaintenanceRun
- reader.ts
- coordination-tick.ts
- knowledge-sources.ts
- command-registry.ts
- extract-worker.mjs
- slack-supersession.ts
- helper-evidence.py
- .value
- offices.ts
- cli.ts

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

## Communities (102 total, 2 thin omitted)

### Community 0 - "dependency-bots/adopt.ts"
Cohesion: 0.14
Nodes (28): Execute, ProjectCard, adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR (+20 more)

### Community 1 - "record-trigger.ts"
Cohesion: 0.07
Nodes (56): deliveryMetrics(), median(), baselineLearning(), LEARNING_BASELINES, maintainLearning(), maintenanceSubject(), MaintenanceSubjectFacts, busyMaintenanceIds() (+48 more)

### Community 2 - "App.tsx"
Cohesion: 0.05
Nodes (45): BrainDrawer(), themeColor, BrainWorkspace, CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants, ElevatorPhase (+37 more)

### Community 3 - "source-amendment-scope.ts"
Cohesion: 0.10
Nodes (33): approvedText(), assert(), amendmentCaptureObservation(), capture, generation, GenerationContext, head, ids (+25 more)

### Community 4 - "Engine"
Cohesion: 0.08
Nodes (5): correlatedBuild(), Engine, observe(), observeParked(), parkedReadError

### Community 5 - "artifact"
Cohesion: 0.07
Nodes (76): advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat(), assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate() (+68 more)

### Community 6 - "index.ts"
Cohesion: 0.06
Nodes (37): ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff(), saveGoals() (+29 more)

### Community 7 - "requests.ts"
Cohesion: 0.08
Nodes (63): adoptCandidate(), reported, Scope, Assessment, outsideScanSources(), Ownership, reconcileScopeRepairReadback(), requireThat() (+55 more)

### Community 8 - "cx"
Cohesion: 0.06
Nodes (64): itAgent(), itDiagnostics(), EvidenceCard(), TicketDetail(), TicketHeading(), displayAgentTask(), withoutElapsed(), CameraBookmark (+56 more)

### Community 9 - ".run"
Cohesion: 0.11
Nodes (22): assignmentSubject(), publicTopicSafe(), researchTopics(), TEMPLATES, assertRetainedDispatchScope(), ModelRoute, ClaudeStream, codexArguments() (+14 more)

### Community 10 - "index.tsx"
Cohesion: 0.07
Nodes (62): Outbox(), SendMessage, SlackDeliveryCard(), ServiceHealthPanel(), labels, ServiceHealthRow(), BlockerFollowups(), IntakeSummary() (+54 more)

### Community 11 - "github-delivery.ts"
Cohesion: 0.06
Nodes (76): containedFile(), findingsBlock(), namedRepairIds(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery(), BOARD_RULE (+68 more)

### Community 12 - "github-context.ts"
Cohesion: 0.15
Nodes (27): observe(), checksFailed(), checksPassed(), checksPending(), CurrentChecksWait, currentMergeChecks(), pass(), pending() (+19 more)

### Community 13 - "conversations/slack.ts"
Cohesion: 0.18
Nodes (11): JiraOperations, plain(), Target, goalNoticeAuthorized(), sendGoalNotice(), maintenanceNoticeAuthorized(), sendMaintenanceNotice(), EffectOperation (+3 more)

### Community 14 - "continuationWorkerProof"
Cohesion: 0.10
Nodes (51): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+43 more)

### Community 15 - "store.ts"
Cohesion: 0.06
Nodes (59): cecPrompt(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), resolvedDecisionNote(), stageInstructions, cecChatPrompt() (+51 more)

### Community 16 - "Button"
Cohesion: 0.09
Nodes (38): KnowledgeCapturePage, KnowledgeActivityPage, Activity(), ActivityStatus(), AssignmentKnowledge(), CaptureReviewDetail(), CaptureReviews(), empty (+30 more)

### Community 17 - "harnessEffect"
Cohesion: 0.19
Nodes (24): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), projectCards(), setCardStatus(), statusField (+16 more)

### Community 18 - "mutedCopy"
Cohesion: 0.09
Nodes (43): KnowledgeSourceSummary, AddPublicSource(), AddSourceForm(), SourceConnection, SourceCard(), Sources(), supported, UploadSource() (+35 more)

### Community 19 - ".getEffect"
Cohesion: 0.22
Nodes (8): GitHubOperations, fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), Assessment, closeNativeRefresh(), fingerprint(), EffectIntent

### Community 20 - "saved-prerequisite-handoff.ts"
Cohesion: 0.30
Nodes (13): PrerequisitesSchema, dependencyVersion(), handoffSavedPrerequisites(), hasSavedPrerequisiteResult(), Ownership, qualified(), readDependencies(), requireSavedPrerequisites() (+5 more)

### Community 21 - "digest"
Cohesion: 0.13
Nodes (44): admitPRMetadata(), assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema, savedMetadataAssessment(), validateSaved(), metadataClaim() (+36 more)

### Community 22 - "lesson-selection.ts"
Cohesion: 0.15
Nodes (21): knowledgeContext(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), MAINTENANCE, MAX_LESSONS (+13 more)

### Community 23 - "constellation-runtime.ts"
Cohesion: 0.08
Nodes (36): KnowledgeActivity, KnowledgeEdge, KnowledgeIntakeStatus, KnowledgeMap, KnowledgeNode, CameraPose, flightPose(), cameraTarget() (+28 more)

### Community 24 - "SourceRegistry"
Cohesion: 0.11
Nodes (29): KnowledgeRunner, LIMITS, SlackReadAuthority, LinkRecord, LinkResult, PublicReadPolicy, runSlackLinks(), checkedReceipt() (+21 more)

### Community 25 - "shared.ts"
Cohesion: 0.07
Nodes (53): ProjectReadiness, Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona (+45 more)

### Community 26 - "OfficeSnapshot"
Cohesion: 0.16
Nodes (26): App(), OfficeSnapshot, deliveryRepairProjection(), DependencyNotice(), card, InboxQueue(), ACTIVE, maintenanceUpdate() (+18 more)

### Community 27 - "TelemetryPanel.tsx"
Cohesion: 0.10
Nodes (36): TelemetryReport, LiveAnchor, AzureBuild, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens() (+28 more)

### Community 28 - "azure.ts"
Cohesion: 0.20
Nodes (14): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+6 more)

### Community 29 - "maintenance.ts"
Cohesion: 0.10
Nodes (27): maintenancePolicies(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice(), candidateOwner(), SETTLED (+19 more)

### Community 30 - "TicketJob"
Cohesion: 0.06
Nodes (61): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+53 more)

### Community 31 - "scheduled-work.ts"
Cohesion: 0.15
Nodes (20): deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), metadataRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), deterministicActions (+12 more)

### Community 32 - "features/workflow.ts"
Cohesion: 0.19
Nodes (18): discoveryPrompt(), planPrompt(), document(), featureRoot(), DiscoverySchema, identity, manifestFromPlan(), ManifestSchema (+10 more)

### Community 33 - "authorize.ts"
Cohesion: 0.14
Nodes (30): approveFeature(), commandFeature(), createFeature(), featureById(), mutation(), reviewQuestions(), artifactPath(), digest() (+22 more)

### Community 34 - "engine.ts"
Cohesion: 0.19
Nodes (18): checkMail(), drainMail(), requestMail(), dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), resume() (+10 more)

### Community 35 - "features.ts"
Cohesion: 0.08
Nodes (36): DELAYS, MAX_EXECUTIONS, MAX_REPLANS, reserveReplacement(), stageBudget(), classifyFeatureFailure(), FeatureErrorCode, RecoveryDecision (+28 more)

### Community 36 - "session-bridge.ts"
Cohesion: 0.10
Nodes (28): claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexSessionContext(), readRollout, claudeSessions(), codexSessions() (+20 more)

### Community 37 - "cec/issue-publication.ts"
Cohesion: 0.15
Nodes (11): Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), plainDescription(), Transition, FeaturePublisher (+3 more)

### Community 38 - ".transaction"
Cohesion: 0.14
Nodes (22): featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), automaticEnabled(), automaticFeature(), FeaturePlanningConfig, POLICY_VERSION, recoveryHeld() (+14 more)

### Community 39 - "contracts.ts"
Cohesion: 0.20
Nodes (17): CaptureReceipt, ChannelProgress, IntakeResult, IntakeResultValue, Observation, Proposal, ReadKind, ReadTask (+9 more)

### Community 40 - "run-accounting.ts"
Cohesion: 0.12
Nodes (33): ghLogCacheEvidence(), BoundedRead, done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf(), backfillClaudeCost() (+25 more)

### Community 41 - "telemetry.ts"
Cohesion: 0.08
Nodes (34): add(), CodexRequest, CodexRollout, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens() (+26 more)

### Community 42 - "approach.ts"
Cohesion: 0.20
Nodes (22): parksInJira(), run(), advance(), nextStage(), publicationEvidenceGap(), qaEvidenceGap(), resultGate(), stageResultGap() (+14 more)

### Community 43 - "tracking-issue.ts"
Cohesion: 0.19
Nodes (19): projectGraphql(), readBackOrThrow(), ensureReviewCards(), ensureTrackingIssue(), findTrackingIssue(), ownTracking(), TrackingIssue, trackingIssueBody() (+11 more)

### Community 44 - "github/issue-publication.ts"
Cohesion: 0.24
Nodes (7): Assign, Board, Content, GitHubIssuePublisher, number(), same(), label()

### Community 45 - "http/commands.ts"
Cohesion: 0.15
Nodes (27): retryRecipientLookup(), enqueueMetadataRecovery(), normalizeStatement(), configureDigestDelivery(), DigestSettings, configureKnowledge(), declineLessonIssue(), demoteLesson() (+19 more)

### Community 46 - "cost-ledger.ts"
Cohesion: 0.16
Nodes (26): costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId(), OutsideEdit, publishCost() (+18 more)

### Community 47 - "investigations/run.ts"
Cohesion: 0.11
Nodes (27): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_FIX_PROMPT, OfficeFixResult (+19 more)

### Community 48 - "run-retrospective.ts"
Cohesion: 0.12
Nodes (28): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, appendLearningFacts(), freezeLearningPacket(), ARTIFACT_LIMIT, clip(), LEDGER_STEPS (+20 more)

### Community 49 - "slack-intake/run.ts"
Cohesion: 0.26
Nodes (18): annotateAuthoredUnits(), independentIntakeResult(), retryDelay(), captureProposal(), effectId(), recordObservation(), settlePage(), readMethod() (+10 more)

### Community 50 - "api-routes.ts"
Cohesion: 0.18
Nodes (17): retainedArtifactScope(), eventSourceBindings(), eventVisible(), exposureBindings(), requestSourceBindings(), knowledgeOfficeState(), knowledgePromptStore(), acceptedSourceBindings() (+9 more)

### Community 51 - "outbound.ts"
Cohesion: 0.27
Nodes (10): assertDigestDispatch(), outboundBody(), retainOutboundBody(), digestNoticeNeverDispatched(), digestNoticeRequest(), queueOutboundDigests(), knowledgeScopeRevision(), goalNoticeNeverDispatched() (+2 more)

### Community 52 - "IntakeLedger"
Cohesion: 0.19
Nodes (10): createExtractor(), extractDocument, Extraction, Extractor, uploadArtifact(), privateFile(), DERIVED, IntakeLedger (+2 more)

### Community 53 - "park-ticket.ts"
Cohesion: 0.23
Nodes (24): unpack(), BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue(), readIssues() (+16 more)

### Community 54 - "work.ts"
Cohesion: 0.14
Nodes (13): AssignmentResult, CompletionCondition, Continuation, DependencyObservation, EligibilityState, FailureCategory, ProgressionItem, ReconciliationAction (+5 more)

### Community 55 - "jira-time.ts"
Cohesion: 0.16
Nodes (16): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+8 more)

### Community 56 - "WorkTime"
Cohesion: 0.16
Nodes (25): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence(), CaptureContext (+17 more)

### Community 57 - "Coordinator"
Cohesion: 0.08
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 58 - "it-specialist.ts"
Cohesion: 0.08
Nodes (34): savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), ITContext, diagnosticContext(), diagnosticSnapshot(), publishITReport() (+26 more)

### Community 59 - "knowledge/routes.ts"
Cohesion: 0.10
Nodes (51): intakeActivity(), knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), KnowledgeContext, independentDigestEvidence(), digestKnowledge(), prepareDigestBodies() (+43 more)

### Community 60 - "discovery-recovery.ts"
Cohesion: 0.29
Nodes (10): Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership, rawHash() (+2 more)

### Community 61 - "model-routes.ts"
Cohesion: 0.16
Nodes (19): AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), FeaturePlanningBindings, goalEvidencePath(), OfficeConfigInputs, officeConfigRoute(), officeConfigSummary(), CECBinding (+11 more)

### Community 62 - "assignment-poll.ts"
Cohesion: 0.23
Nodes (12): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), pinCourier, due() (+4 more)

### Community 63 - "dependencies.ts"
Cohesion: 0.23
Nodes (18): Admission, admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, compatible(), dependencyCompletionKey(), dependencyEligibility() (+10 more)

### Community 64 - "remove-candidate.ts"
Cohesion: 0.17
Nodes (19): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+11 more)

### Community 65 - "slack-intake/report.ts"
Cohesion: 0.16
Nodes (23): isStoppingFor(), reconcileIntakeStatus(), intakeProgress(), terminalDeferred(), unitKey(), verifiedCapture(), referenceIndex, byWeek() (+15 more)

### Community 66 - "documentText"
Cohesion: 0.33
Nodes (6): guidanceExcerpt(), evidenceTitle(), DocumentMetadata, documentText(), KnowledgeDocumentText, DocumentPreview()

### Community 67 - "goal-evidence.ts"
Cohesion: 0.17
Nodes (13): GitHubMonitor, githubPRDescription(), azureGoalFacts(), azurePRDescription(), boundedEvidence(), collectAzureGoalDocuments(), EvidenceStore, GOAL_EVIDENCE_LIMITS (+5 more)

### Community 68 - "coordination.ts"
Cohesion: 0.16
Nodes (19): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), legacy, validateNativeContinuation(), checkpointWindow() (+11 more)

### Community 69 - "Goals.tsx"
Cohesion: 0.08
Nodes (31): FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures(), draftKey(), readDraft() (+23 more)

### Community 70 - "weekly-rollup.ts"
Cohesion: 0.10
Nodes (34): learningMetrics(), lessonsNeedingReview(), RollupResult, RollupResultSchema, harperFolder(), RETROSPECTIVE_TIMEOUT, newTask(), sourceWork() (+26 more)

### Community 71 - "workKey"
Cohesion: 0.07
Nodes (49): recordJobApproach(), boardPreflightCandidate(), reconcileBoardPreflight(), completedPRReviews(), savedActivationFailure(), continuationScope(), brainImplementationCandidate(), BrainReadback (+41 more)

### Community 73 - "notifications.ts"
Cohesion: 0.16
Nodes (17): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR (+9 more)

### Community 74 - "activation-recovery.ts"
Cohesion: 0.12
Nodes (36): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+28 more)

### Community 75 - "knowledge/learning-events.ts"
Cohesion: 0.14
Nodes (24): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementIntakeGate(), improvementManifest() (+16 more)

### Community 76 - "daily-cto.ts"
Cohesion: 0.06
Nodes (47): leadershipContext(), leadershipEntries(), knowledgeEntries(), mirror(), runWeeklyResearch(), scheduledResearch(), collectCTOFacts(), DailyCTO (+39 more)

### Community 77 - ".emit"
Cohesion: 0.19
Nodes (20): assertConversationReadback(), conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), finishSupersededReadback(), pump(), savePickup(), readBackConversations() (+12 more)

### Community 78 - "process.ts"
Cohesion: 0.11
Nodes (23): GitHubFeaturePublisher, JiraFeaturePublisher, Result, At, Errno, GroupInventory, GroupProbe, LifecycleDiagnostic (+15 more)

### Community 79 - "knowledge.ts"
Cohesion: 0.07
Nodes (39): decodeLookupJournal(), lookupJournal, readLookupJournal(), Kind, RetrospectiveResult, Stage, KnowledgeAssignment, BlockerFollowup (+31 more)

### Community 80 - "time-classification.ts"
Cohesion: 0.62
Nodes (6): captureTime(), artifact(), correctRecoveryClassification(), digest(), timeClassificationDigest(), TimeClassificationInput

### Community 81 - "preferences-store.ts"
Cohesion: 0.19
Nodes (10): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, SettingsPanel() (+2 more)

### Community 82 - "OfficeConfigView.tsx"
Cohesion: 0.48
Nodes (5): loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView(), OfficeConfigSummary

### Community 83 - "Store"
Cohesion: 0.07
Nodes (27): ROLES, Clock, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch() (+19 more)

### Community 84 - "delivery-task.ts"
Cohesion: 0.33
Nodes (6): deliveryTask(), DeliveryTaskInput, DISCOVERY_GUIDANCE, compactSteps(), AMENDMENT_REVIEW_PROOF, featureDeliveryContext()

### Community 85 - "dependency-edges.ts"
Cohesion: 1.00
Nodes (3): assertFeatureDependencyOrder(), featureDependencyEdges(), key()

### Community 86 - "digest"
Cohesion: 0.10
Nodes (34): comparableSlackText(), AuthoredDigest, reconcileDigestAuthorship(), unitAuthorship(), reconcileAuthoredEvidence(), Config, configDigest(), digest() (+26 more)

### Community 87 - "telemetry/report.ts"
Cohesion: 0.24
Nodes (14): TelemetryRow, TelemetrySync, Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount() (+6 more)

### Community 88 - "outbox.ts"
Cohesion: 0.13
Nodes (25): conversationResolved(), projectOutbox(), syncOutbox(), settleRequestedSlackReplacement(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint() (+17 more)

### Community 90 - "delivery-binding.ts"
Cohesion: 0.36
Nodes (8): externalPlanGap(), verifyFeatureEnhance(), approvedDelivery(), bindDelivery(), featureEffectGate(), bindFeature(), enrolled(), acceptFeatureReview()

### Community 91 - "MaintenanceRun"
Cohesion: 0.11
Nodes (18): BrainFollowup, BrainStatusSchema, identity, brainCheckpointCompletion(), coverageSchema, followupSchema, verified, reconcileCompletedCheckpoints() (+10 more)

### Community 92 - "reader.ts"
Cohesion: 0.08
Nodes (21): captureAfter(), CaptureMetadata, capturePage(), cursor(), key(), captureIdentityMatches(), BrainCaptureReceipt, hash (+13 more)

### Community 93 - "coordination-tick.ts"
Cohesion: 0.25
Nodes (11): reconcileNoticeConfirmations(), reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION, tick(), incompleteReadOutput(), IntakeResult (+3 more)

### Community 95 - "knowledge-sources.ts"
Cohesion: 0.25
Nodes (6): sourceList(), KnowledgeCadence, KnowledgeDestination, KnowledgeSourceKind, KnowledgeSourceState, SourceSubscription

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
Cohesion: 0.24
Nodes (6): file, folder, logs, root, xml(), ProjectProgress

### Community 112 - "offices.ts"
Cohesion: 0.15
Nodes (11): projectSlackDeliveries(), queueImprovements(), readLocalIntakeReport(), DELIVERY_CONCURRENCY, file, project, root, projectById() (+3 more)

### Community 114 - "cli.ts"
Cohesion: 0.25
Nodes (6): args, [cmd,...rawArgs], commands, key, projectIndex, PORT

## Knowledge Gaps
- **404 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+399 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `dependency-bots/adopt.ts`, `record-trigger.ts`, `Engine`, `artifact`, `index.ts`, `requests.ts`, `.run`, `github-delivery.ts`, `github-context.ts`, `conversations/slack.ts`, `continuationWorkerProof`, `store.ts`, `harnessEffect`, `.getEffect`, `saved-prerequisite-handoff.ts`, `digest`, `lesson-selection.ts`, `SourceRegistry`, `OfficeSnapshot`, `azure.ts`, `maintenance.ts`, `TicketJob`, `scheduled-work.ts`, `features/workflow.ts`, `authorize.ts`, `engine.ts`, `features.ts`, `session-bridge.ts`, `cec/issue-publication.ts`, `.transaction`, `contracts.ts`, `run-accounting.ts`, `tracking-issue.ts`, `github/issue-publication.ts`, `http/commands.ts`, `cost-ledger.ts`, `investigations/run.ts`, `run-retrospective.ts`, `slack-intake/run.ts`, `api-routes.ts`, `outbound.ts`, `IntakeLedger`, `park-ticket.ts`, `jira-time.ts`, `WorkTime`, `Coordinator`, `it-specialist.ts`, `knowledge/routes.ts`, `discovery-recovery.ts`, `dependencies.ts`, `remove-candidate.ts`, `slack-intake/report.ts`, `goal-evidence.ts`, `coordination.ts`, `weekly-rollup.ts`, `workKey`, `SlackMessages`, `notifications.ts`, `activation-recovery.ts`, `knowledge/learning-events.ts`, `daily-cto.ts`, `.emit`, `process.ts`, `knowledge.ts`, `time-classification.ts`, `delivery-task.ts`, `dependency-edges.ts`, `digest`, `outbox.ts`, `delivery-binding.ts`, `MaintenanceRun`, `coordination-tick.ts`, `.value`, `offices.ts`?**
  _High betweenness centrality (0.140) - this node is a cross-community bridge._
- **Why does `Role` connect `store.ts` to `record-trigger.ts`, `App.tsx`, `index.ts`, `cx`, `.run`, `index.tsx`, `github-delivery.ts`, `github-context.ts`, `shared.ts`, `maintenance.ts`, `TicketJob`, `run-accounting.ts`, `approach.ts`, `http/commands.ts`, `api-routes.ts`, `work.ts`, `model-routes.ts`, `Goals.tsx`, `.emit`, `Store`, `outbox.ts`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `OfficeSnapshot` connect `OfficeSnapshot` to `record-trigger.ts`, `App.tsx`, `cx`, `index.tsx`, `github-delivery.ts`, `store.ts`, `Button`, `mutedCopy`, `shared.ts`, `TelemetryPanel.tsx`, `azure.ts`, `maintenance.ts`, `api-routes.ts`, `work.ts`, `it-specialist.ts`, `assignment-poll.ts`, `Goals.tsx`, `daily-cto.ts`, `Store`, `outbox.ts`, `MaintenanceRun`, `offices.ts`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `command()` (e.g. with `.constructor()` and `executeRequest()`) actually correct?**
  _`command()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _404 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dependency-bots/adopt.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13765182186234817 - nodes in this community are weakly interconnected._
- **Should `record-trigger.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06965174129353234 - nodes in this community are weakly interconnected._