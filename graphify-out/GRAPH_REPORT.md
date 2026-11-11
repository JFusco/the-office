# Graph Report - office-stopped-handoff  (2026-11-11)

## Corpus Check
- 787 files · ~314,745 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3906 nodes · 18002 edges · 113 communities (111 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 107 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `41146d3a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- github-delivery.ts
- index.tsx
- activation-recovery.ts
- source-amendment.ts
- currentAssignment
- artifact
- agents.ts
- requests.ts
- weekly-research.ts
- OfficeScene.tsx
- Store
- digest
- OfficeSnapshot
- record-trigger.ts
- Button
- shared.ts
- IntakeLedger
- worker-runtime.ts
- SourceRegistry
- conversations/conversations.ts
- scheduled-captures.ts
- .transaction
- index.ts
- features/commands.ts
- constellation-runtime.ts
- scheduled-work.ts
- workKey
- mutedCopy
- App.tsx
- maintenance/maintenance.ts
- PeoplePanel.tsx
- it-specialist.ts
- knowledge/routes.ts
- .emit
- GitHubDelivery
- investigations/run.ts
- task-briefing.ts
- schedule.ts
- digest
- run-accounting.ts
- run-retrospective.ts
- session-bridge.ts
- enrollment-gate.ts
- ticket-evidence.ts
- deliveryInputSha256
- reader.ts
- dependency-bots/adopt.ts
- accept-stage-result.ts
- features.ts
- telemetry.ts
- cost-ledger.ts
- TelemetryPanel.tsx
- notifications.ts
- github/issue-publication.ts
- knowledge/learning-events.ts
- scope-repair-resume.ts
- .getEffect
- resume-provider-review.ts
- knowledge.ts
- .get
- jira-time.ts
- Coordinator
- azure.ts
- .save
- delivery-repairs.ts
- office/config.ts
- WorkTime
- remove-candidate.ts
- intake/admission.ts
- Engine
- admit-improvement.ts
- JiraIssuePublisher
- blocker-followups.ts
- coordination-tick.ts
- outbox.ts
- fact-bounds.ts
- store.ts
- featureById
- reader-attempts.ts
- slack-intake/run.ts
- coordination.ts
- knowledge-snapshot.ts
- time-ledger.ts
- tracking-issue.ts
- model-routes.ts
- lesson-selection.ts
- contract.ts
- outbound.ts
- FeatureWorkspace.tsx
- assignment-poll.ts
- telemetry/report.ts
- cec/workflow.ts
- work.ts
- discovery-recovery.ts
- DailyCTO.tsx
- .value
- engine.ts
- stopped-base-provider.ts
- github.ts
- documentText
- command-registry.ts
- QuestionDialogHost.tsx
- codex-rollout.ts
- effects.ts
- merge-summary.ts
- create-candidate.ts
- brain-followup.ts
- needsDecision
- extract-worker.mjs
- SlackIntakeStatus.tsx
- slack-supersession.ts
- helper-evidence.py

## God Nodes (most connected - your core abstractions)
1. `Store` - 359 edges
2. `TicketJob` - 162 edges
3. `GitHubDelivery` - 141 edges
4. `digest()` - 130 edges
5. `artifact()` - 114 edges
6. `command()` - 108 edges
7. `workKey()` - 95 edges
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

## Communities (113 total, 2 thin omitted)

### Community 0 - "github-delivery.ts"
Cohesion: 0.05
Nodes (92): containedFile(), findingsBlock(), assertDeliveryMayMutate(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery(), BOARD_RULE (+84 more)

### Community 1 - "index.tsx"
Cohesion: 0.06
Nodes (83): Conversation(), Outbox(), SendMessage, slackMessageStatus(), SlackDeliveryCard(), currentServices(), ServiceHealthPanel(), labels (+75 more)

### Community 2 - "activation-recovery.ts"
Cohesion: 0.07
Nodes (66): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+58 more)

### Community 3 - "source-amendment.ts"
Cohesion: 0.06
Nodes (69): DeliveryTaskInput, DISCOVERY_GUIDANCE, adoptCandidate(), reported, Scope, approvedText(), assert(), AMENDMENT_REVIEW_PROOF (+61 more)

### Community 4 - "currentAssignment"
Cohesion: 0.10
Nodes (56): activeEffectId(), harnessEffect, retryRead(), linkDraftIssue(), protectedOriginalClaim(), admitPRMetadata(), assessPRMetadata(), captureAssessment() (+48 more)

### Community 5 - "artifact"
Cohesion: 0.10
Nodes (56): savedActivationFailure(), allowed, continuationNativeReview(), continuationWorkerProof(), negativeWorker(), candidateInput(), children, oldAdoptionBasis() (+48 more)

### Community 6 - "agents.ts"
Cohesion: 0.06
Nodes (45): cecPrompt(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), resolvedDecisionNote(), stageInstructions, ConversationResultSchema (+37 more)

### Community 7 - "requests.ts"
Cohesion: 0.07
Nodes (55): deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, requireDeliveryAuthority(), accounting, DeliverySubject, nonDelivery (+47 more)

### Community 8 - "weekly-research.ts"
Cohesion: 0.06
Nodes (36): retryDelay(), mirror(), ResearchResult, runWeeklyResearch(), scheduledResearch(), DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts (+28 more)

### Community 9 - "OfficeScene.tsx"
Cohesion: 0.06
Nodes (56): itAgent(), itDiagnostics(), CameraBookmark, restoreBookmark(), Avatar(), AzureWall(), Chair(), Coworker() (+48 more)

### Community 10 - "Store"
Cohesion: 0.07
Nodes (29): Content, jiraText(), approveFeature(), FeatureCommandSchema, GitHubFeaturePublisher, JiraFeaturePublisher, compareBaseline(), prepareBaseline() (+21 more)

### Community 11 - "digest"
Cohesion: 0.09
Nodes (55): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+47 more)

### Community 12 - "OfficeSnapshot"
Cohesion: 0.07
Nodes (49): compactSteps(), App(), SnapshotAcceptance, demoSnapshot(), tourStages, useOffice(), displayAgentTask(), LiveAgentTask() (+41 more)

### Community 13 - "record-trigger.ts"
Cohesion: 0.07
Nodes (52): deliveryMetrics(), median(), baselineLearning(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences(), maintenanceSubject() (+44 more)

### Community 14 - "Button"
Cohesion: 0.09
Nodes (38): KnowledgeCapturePage, KnowledgeActivity, KnowledgeActivityPage, Activity(), ActivityStatus(), AssignmentKnowledge(), CaptureReviewDetail(), CaptureReviews() (+30 more)

### Community 15 - "shared.ts"
Cohesion: 0.05
Nodes (45): fields, PreferencesPatch, StoredBody, ProjectReadiness, DailyCTOSummary, GoalProgress, SchedulerState, recommendedReply() (+37 more)

### Community 16 - "IntakeLedger"
Cohesion: 0.13
Nodes (37): privateFile(), CaptureReceipt, ChannelProgress, IntakeResult, IntakeResultValue, LIMITS, Proposal, ReadKind (+29 more)

### Community 17 - "worker-runtime.ts"
Cohesion: 0.07
Nodes (40): candidateWorkspaceEnvironment(), assignmentSubject(), dispatchExposure(), prepareExposure(), assertRetainedDispatchScope(), contextPacket(), ModelRoute, resolveModelRoute() (+32 more)

### Community 18 - "SourceRegistry"
Cohesion: 0.09
Nodes (31): Config, configDigest(), IntakeConfig, readConfig(), SlackReadAuthority, readAuthority(), Command, sourceCommand() (+23 more)

### Community 19 - "conversations/conversations.ts"
Cohesion: 0.10
Nodes (34): assertConversationReadback(), Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff(), saveGoals() (+26 more)

### Community 20 - "scheduled-captures.ts"
Cohesion: 0.16
Nodes (43): createFeature(), assertEnrollable(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest, captureRequests(), failCapture() (+35 more)

### Community 21 - ".transaction"
Cohesion: 0.11
Nodes (30): featureItemComplete(), reconcileFeatureCompletion(), discoveryPrompt(), planPrompt(), helperTelemetry(), reserveReplacement(), stageBudget(), classifyFeatureFailure() (+22 more)

### Community 22 - "index.ts"
Cohesion: 0.09
Nodes (40): assertAssessmentVisibility(), assertQuestionVisibility(), pendingQuestions(), close(), config, itSpecialist, loadedRevision, offices (+32 more)

### Community 23 - "features/commands.ts"
Cohesion: 0.11
Nodes (34): commandFeature(), mutation(), reviewQuestions(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), artifactPath(), digest() (+26 more)

### Community 24 - "constellation-runtime.ts"
Cohesion: 0.08
Nodes (35): KnowledgeMap, KnowledgeNode, CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point (+27 more)

### Community 25 - "scheduled-work.ts"
Cohesion: 0.09
Nodes (32): gateRegisteredDelivery(), deliverySlot(), metadataRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), busyMaintenanceIds(), RollupResult, busySubjects() (+24 more)

### Community 26 - "workKey"
Cohesion: 0.09
Nodes (38): deliveryIntakeBlocker(), boardPreflightCandidate(), reconcileBoardPreflight(), completedPRReviews(), implementationRecoveryCandidate(), assertPostConflictOwnership(), bindPreparationBoardOrigins(), claimSchema (+30 more)

### Community 27 - "mutedCopy"
Cohesion: 0.13
Nodes (31): KnowledgeSourceSummary, AddPublicSource(), AddSourceForm(), SourceConnection, SourceCard(), UploadSource(), WithdrawSource(), SaveFeedback() (+23 more)

### Community 28 - "App.tsx"
Cohesion: 0.06
Nodes (38): BrainDrawer(), themeColor, BrainWorkspace, CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants, ElevatorPhase (+30 more)

### Community 29 - "maintenance/maintenance.ts"
Cohesion: 0.09
Nodes (29): maintenancePolicies(), captureMaintenanceStep(), reconcileNativeDelivery(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice() (+21 more)

### Community 30 - "PeoplePanel.tsx"
Cohesion: 0.11
Nodes (36): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+28 more)

### Community 31 - "it-specialist.ts"
Cohesion: 0.09
Nodes (21): ITContext, publishITReport(), delays, recoverAttempt(), CEC, listenerHealth(), providers, ProviderStatusChecks (+13 more)

### Community 32 - "knowledge/routes.ts"
Cohesion: 0.15
Nodes (27): intakeActivity(), knowledgeActivityPage(), KnowledgeContext, independentDigestEvidence(), prepareDigestBodies(), retainDigestBody(), publicSearch(), bounded() (+19 more)

### Community 33 - ".emit"
Cohesion: 0.12
Nodes (29): configureNotices(), retryRecipientLookup(), failedWorker(), requeueWaitedImplement(), normalizeStatement(), configureDigestDelivery(), DigestSettings, configureKnowledge() (+21 more)

### Community 34 - "GitHubDelivery"
Cohesion: 0.10
Nodes (23): moveLane(), Execute, installDependencies(), major(), harnessCloseout(), PASSING, verifyMergeActions(), HarnessControl (+15 more)

### Community 35 - "investigations/run.ts"
Cohesion: 0.12
Nodes (28): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationCandidates(), investigationId(), investigationEvidence(), investigationFollowUps(), INVOCATION_SOURCE_REFS, invocationSource() (+20 more)

### Community 36 - "task-briefing.ts"
Cohesion: 0.10
Nodes (24): assignmentKnowledge(), LessonSelection, AssignmentLookups, Binding, lookupInstructions(), decodeLookupJournal(), lookupJournal, readLookupJournal() (+16 more)

### Community 37 - "schedule.ts"
Cohesion: 0.14
Nodes (29): learningMetrics(), lessonsNeedingReview(), RollupResultSchema, KnowledgeRunner, newTask(), reconcileIntakeStatus(), scheduledSlackIntake(), sourceWork() (+21 more)

### Community 38 - "digest"
Cohesion: 0.12
Nodes (30): comparableSlackText(), createExtractor(), extractDocument, Extraction, Extractor, uploadArtifact(), AuthoredDigest, reconcileDigestAuthorship() (+22 more)

### Community 39 - "run-accounting.ts"
Cohesion: 0.11
Nodes (34): ghLogCacheEvidence(), BoundedRead, done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf(), backfillClaudeCost() (+26 more)

### Community 40 - "run-retrospective.ts"
Cohesion: 0.12
Nodes (30): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, appendLearningFacts(), freezeLearningPacket(), ARTIFACT_LIMIT, clip(), LEDGER_STEPS (+22 more)

### Community 41 - "session-bridge.ts"
Cohesion: 0.11
Nodes (27): claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexSessionContext(), readRollout, claudeSessions(), codexSessions() (+19 more)

### Community 42 - "enrollment-gate.ts"
Cohesion: 0.18
Nodes (30): dispatchNightly(), drainDelivery(), requestDelivery(), resume(), startPilot(), eligibility(), approvedDelivery(), bindDelivery() (+22 more)

### Community 43 - "ticket-evidence.ts"
Cohesion: 0.14
Nodes (29): assetDownloader(), attachmentKind(), evidenceDirectory(), readEvidence(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS (+21 more)

### Community 44 - "deliveryInputSha256"
Cohesion: 0.16
Nodes (25): removeAdoptedClone(), stoppedBaseCheckout(), assertStoppedBaseApproach(), stoppedBaseNextStage(), stoppedBaseReviewContext(), adoptedReviewCandidate(), ciCheckout(), finishCISetup() (+17 more)

### Community 45 - "reader.ts"
Cohesion: 0.08
Nodes (21): captureAfter(), CaptureMetadata, capturePage(), cursor(), key(), captureIdentityMatches(), BrainCaptureReceipt, hash (+13 more)

### Community 46 - "dependency-bots/adopt.ts"
Cohesion: 0.15
Nodes (29): Execute, readBackOrThrow(), adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR (+21 more)

### Community 47 - "accept-stage-result.ts"
Cohesion: 0.13
Nodes (31): park(), acceptStageResult(), PrerequisitesSchema, METADATA_FINDING, mergeAuthorized(), continuationReviewArtifacts(), reconcileContinuationReview(), savedNegativeContinuationReview() (+23 more)

### Community 48 - "features.ts"
Cohesion: 0.11
Nodes (27): normalizeRound(), FeatureApproval, FeatureAuthority, FeatureBaseline, FeatureDocument, FeatureHandoff, FeatureHarnessAction, FeatureHarnessOption (+19 more)

### Community 49 - "telemetry.ts"
Cohesion: 0.10
Nodes (27): CodexRollout, CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL (+19 more)

### Community 50 - "cost-ledger.ts"
Cohesion: 0.16
Nodes (26): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress(), effectId() (+18 more)

### Community 51 - "TelemetryPanel.tsx"
Cohesion: 0.14
Nodes (24): TelemetryReport, withoutElapsed(), BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens(), usd() (+16 more)

### Community 52 - "notifications.ts"
Cohesion: 0.14
Nodes (15): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), Identity, MergeNotifications, NoticeSettings (+7 more)

### Community 53 - "github/issue-publication.ts"
Cohesion: 0.17
Nodes (11): FeaturePublisher, PublicationReceipt, Assign, Board, Content, GitHubIssuePublisher, number(), same() (+3 more)

### Community 54 - "knowledge/learning-events.ts"
Cohesion: 0.15
Nodes (20): retainedArtifactScope(), eventSourceBindings(), captureLearning(), recordLearningOpportunity(), exposureBindings(), requestSourceBindings(), citations(), recordAcceptedKnowledge() (+12 more)

### Community 55 - "scope-repair-resume.ts"
Cohesion: 0.16
Nodes (27): Assessment, outsideScanSources(), Ownership, reconcileScopeRepairReadback(), requireThat(), scopeRepairReadbackCandidate(), scopeRepairRequestResolved(), sha (+19 more)

### Community 56 - ".getEffect"
Cohesion: 0.17
Nodes (13): publishFeature(), GitHubOperations, digestNoticeNeverDispatched(), fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), goalNoticeNeverDispatched(), closeNativeRefresh() (+5 more)

### Community 57 - "resume-provider-review.ts"
Cohesion: 0.22
Nodes (22): Lane, MOVABLE, resolveLane(), cardStatus(), ProjectCard, projectCards(), projectGraphql(), setCardStatus() (+14 more)

### Community 58 - "knowledge.ts"
Cohesion: 0.11
Nodes (24): publicTopicSafe(), researchTopics(), TEMPLATES, Kind, RetrospectiveResult, Stage, ImprovementGrant, KnowledgeRetry (+16 more)

### Community 59 - ".get"
Cohesion: 0.17
Nodes (20): captureProposal(), effectId(), recordObservation(), settlePage(), DERIVED, acceptProposals(), runSlackLinks(), queueReconsideration() (+12 more)

### Community 60 - "jira-time.ts"
Cohesion: 0.14
Nodes (20): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+12 more)

### Community 61 - "Coordinator"
Cohesion: 0.08
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 62 - "azure.ts"
Cohesion: 0.15
Nodes (20): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+12 more)

### Community 63 - ".save"
Cohesion: 0.26
Nodes (22): BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue(), readIssues(), commentDecision() (+14 more)

### Community 64 - "delivery-repairs.ts"
Cohesion: 0.21
Nodes (22): run(), advance(), namedRepairIds(), afterDraft(), ApproachSchema, firstBuildStage(), missingApproachStage(), plannedNext() (+14 more)

### Community 65 - "office/config.ts"
Cohesion: 0.13
Nodes (17): args, [cmd,...rawArgs], commands, key, projectIndex, readLocalIntakeReport(), DELIVERY_CONCURRENCY, LOCAL_BINDINGS (+9 more)

### Community 66 - "WorkTime"
Cohesion: 0.17
Nodes (22): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence(), CaptureContext (+14 more)

### Community 67 - "remove-candidate.ts"
Cohesion: 0.20
Nodes (17): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+9 more)

### Community 68 - "intake/admission.ts"
Cohesion: 0.21
Nodes (19): Admission, admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, resumeParked(), compatible(), dependencyCompletionKey() (+11 more)

### Community 69 - "Engine"
Cohesion: 0.10
Nodes (5): correlatedBuild(), Engine, observe(), observeParked(), parkedReadError

### Community 70 - "admit-improvement.ts"
Cohesion: 0.21
Nodes (17): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+9 more)

### Community 71 - "JiraIssuePublisher"
Cohesion: 0.27
Nodes (5): Assignment, JiraIssuePublisher, keyOf(), plainDescription(), Transition

### Community 72 - "blocker-followups.ts"
Cohesion: 0.21
Nodes (15): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved() (+7 more)

### Community 73 - "coordination-tick.ts"
Cohesion: 0.15
Nodes (14): reconcileNoticeConfirmations(), BrainStatusSchema, identity, brainCheckpointCompletion(), coverageSchema, followupSchema, verified, reconcileCompletedCheckpoints() (+6 more)

### Community 74 - "outbox.ts"
Cohesion: 0.20
Nodes (15): projectOutbox(), knowledgeOutbox(), checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), repeatedVendorReviewBlock(), stoppedInVendorReview(), checkpointSuperseded() (+7 more)

### Community 75 - "fact-bounds.ts"
Cohesion: 0.21
Nodes (18): leadershipContext(), leadershipEntries(), knowledgeEntries(), collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime() (+10 more)

### Community 76 - "store.ts"
Cohesion: 0.15
Nodes (13): GoalInput, saveGoal(), queueGoalNotice(), resolveProjectLabel(), comparable(), EvidenceOutcome, recordRunEvidence(), initializeStoreSchema() (+5 more)

### Community 77 - "featureById"
Cohesion: 0.22
Nodes (9): featureById(), Link, linkFeature(), reconcilePublication(), uncertainPublications(), reserveIdentity(), featureRoute(), FeatureWorkflow (+1 more)

### Community 78 - "reader-attempts.ts"
Cohesion: 0.18
Nodes (18): document(), featureRoot(), DiscoverySchema, HarnessCommand, identity, manifestFromPlan(), ManifestSchema, PlanSchema (+10 more)

### Community 79 - "slack-intake/run.ts"
Cohesion: 0.21
Nodes (14): Observation, Message, observeRead(), Page, readArguments(), readMethod(), ReadUnavailable, intakePrompt() (+6 more)

### Community 80 - "coordination.ts"
Cohesion: 0.16
Nodes (18): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation(), checkpointWindow(), dueAt() (+10 more)

### Community 81 - "knowledge-snapshot.ts"
Cohesion: 0.37
Nodes (14): knowledgeActivity(), knowledgeSnapshot(), officeKnowledgeSnapshot(), publicReference(), lookupSummaryVisible(), publicLookupSummary(), outcomeVisible(), publicOutcome() (+6 more)

### Community 82 - "time-ledger.ts"
Cohesion: 0.21
Nodes (12): captureTime(), timeLedger(), artifact(), correctRecoveryClassification(), digest(), timeClassificationDigest(), TimeClassificationInput, syncing (+4 more)

### Community 83 - "tracking-issue.ts"
Cohesion: 0.20
Nodes (13): ensureTrackingIssue(), findTrackingIssue(), ownTracking(), TrackingIssue, trackingIssueBody(), trackingIssueTitle(), trackingMarker(), centralCompanionHandoff() (+5 more)

### Community 84 - "model-routes.ts"
Cohesion: 0.20
Nodes (15): AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), goalEvidencePath(), OfficeConfigInputs, CECBinding, localBindings, assertModelOverrides(), CODEX_DEFAULT_EFFORT (+7 more)

### Community 85 - "lesson-selection.ts"
Cohesion: 0.21
Nodes (15): knowledgeContext(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), MAINTENANCE, MAX_LESSONS (+7 more)

### Community 86 - "contract.ts"
Cohesion: 0.22
Nodes (11): At, Errno, GroupInventory, GroupProbe, LifecycleDiagnostic, Phase, Pid, groupInventory() (+3 more)

### Community 87 - "outbound.ts"
Cohesion: 0.23
Nodes (10): assertDigestDispatch(), outboundBody(), retainOutboundBody(), digestNoticeRequest(), queueOutboundDigests(), digestKnowledge(), sendDigestNotice(), Target (+2 more)

### Community 88 - "FeatureWorkspace.tsx"
Cohesion: 0.19
Nodes (10): FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures(), TicketPlanningAction(), officeUrl() (+2 more)

### Community 89 - "assignment-poll.ts"
Cohesion: 0.26
Nodes (10): noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), due(), unparkReleasedWaits(), compare(), highestStableAtLeast(), parts() (+2 more)

### Community 90 - "telemetry/report.ts"
Cohesion: 0.24
Nodes (14): TelemetryRow, TelemetrySync, Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount() (+6 more)

### Community 91 - "cec/workflow.ts"
Cohesion: 0.26
Nodes (11): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), nextStage(), publicationEvidenceGap(), qaEvidenceGap(), resultGate(), stageResultGap() (+3 more)

### Community 92 - "work.ts"
Cohesion: 0.15
Nodes (12): AssignmentResult, CompletionCondition, Continuation, DeliveryAdmission, DependencyObservation, EligibilityState, FailureCategory, ReconciliationAction (+4 more)

### Community 93 - "discovery-recovery.ts"
Cohesion: 0.29
Nodes (10): Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership, rawHash() (+2 more)

### Community 94 - "DailyCTO.tsx"
Cohesion: 0.26
Nodes (8): CTOReview(), goalState, DailyCTO(), GoalHistory(), reportDate(), reviewStatus, reviewExcerpt(), ReviewText()

### Community 95 - ".value"
Cohesion: 0.27
Nodes (6): file, folder, logs, root, xml(), ProjectProgress

### Community 96 - "engine.ts"
Cohesion: 0.33
Nodes (8): checkMail(), drainMail(), requestMail(), enableNightly(), ingest(), drainMaintenance(), reconcileMaintenance(), requestMaintenance()

### Community 97 - "stopped-base-provider.ts"
Cohesion: 0.33
Nodes (8): pinCourier, pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), discussion(), pages(), pullIdentity(), readStoppedBaseProviderContext(), reviewThreads()

### Community 98 - "github.ts"
Cohesion: 0.29
Nodes (6): GitHubMonitor, githubPRDescription(), GOAL_EVIDENCE_LIMITS, GitHubBoard, GitHubPR, GitHubState

### Community 99 - "documentText"
Cohesion: 0.33
Nodes (6): guidanceExcerpt(), evidenceTitle(), DocumentMetadata, documentText(), KnowledgeDocumentText, DocumentPreview()

### Community 100 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 101 - "QuestionDialogHost.tsx"
Cohesion: 0.44
Nodes (7): FeatureQuestionProjection, nextQuestion(), orderedQuestions(), questionKey(), QuestionDialogHost(), readSuppressed(), Dialog()

### Community 102 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 103 - "effects.ts"
Cohesion: 0.36
Nodes (5): JiraOperations, plain(), unpack(), EffectOperation, WorkRef

### Community 104 - "merge-summary.ts"
Cohesion: 0.36
Nodes (7): clamp(), LIMITS, MergedPR, plainSlackText(), section(), shippedSummary(), mergeText()

### Community 105 - "create-candidate.ts"
Cohesion: 0.48
Nodes (6): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf()

### Community 107 - "needsDecision"
Cohesion: 0.70
Nodes (3): parksInJira(), DECISION_KINDS, needsDecision()

### Community 108 - "extract-worker.mjs"
Cohesion: 0.70
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 109 - "SlackIntakeStatus.tsx"
Cohesion: 0.60
Nodes (4): format, labels, SlackIntakeStatus(), time()

### Community 110 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

## Knowledge Gaps
- **428 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+423 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `github-delivery.ts`, `activation-recovery.ts`, `source-amendment.ts`, `currentAssignment`, `artifact`, `agents.ts`, `requests.ts`, `weekly-research.ts`, `digest`, `OfficeSnapshot`, `record-trigger.ts`, `IntakeLedger`, `worker-runtime.ts`, `SourceRegistry`, `conversations/conversations.ts`, `scheduled-captures.ts`, `.transaction`, `index.ts`, `features/commands.ts`, `scheduled-work.ts`, `workKey`, `maintenance/maintenance.ts`, `it-specialist.ts`, `knowledge/routes.ts`, `.emit`, `GitHubDelivery`, `investigations/run.ts`, `task-briefing.ts`, `schedule.ts`, `digest`, `run-accounting.ts`, `run-retrospective.ts`, `session-bridge.ts`, `enrollment-gate.ts`, `ticket-evidence.ts`, `deliveryInputSha256`, `dependency-bots/adopt.ts`, `accept-stage-result.ts`, `cost-ledger.ts`, `notifications.ts`, `github/issue-publication.ts`, `knowledge/learning-events.ts`, `scope-repair-resume.ts`, `.getEffect`, `resume-provider-review.ts`, `knowledge.ts`, `jira-time.ts`, `azure.ts`, `.save`, `delivery-repairs.ts`, `office/config.ts`, `WorkTime`, `remove-candidate.ts`, `intake/admission.ts`, `admit-improvement.ts`, `blocker-followups.ts`, `coordination-tick.ts`, `store.ts`, `featureById`, `reader-attempts.ts`, `slack-intake/run.ts`, `coordination.ts`, `time-ledger.ts`, `tracking-issue.ts`, `lesson-selection.ts`, `outbound.ts`, `discovery-recovery.ts`, `engine.ts`, `stopped-base-provider.ts`, `github.ts`, `effects.ts`, `create-candidate.ts`, `brain-followup.ts`?**
  _High betweenness centrality (0.143) - this node is a cross-community bridge._
- **Why does `command()` connect `Store` to `github-delivery.ts`, `activation-recovery.ts`, `currentAssignment`, `agents.ts`, `requests.ts`, `digest`, `IntakeLedger`, `worker-runtime.ts`, `.transaction`, `features/commands.ts`, `maintenance/maintenance.ts`, `it-specialist.ts`, `GitHubDelivery`, `digest`, `session-bridge.ts`, `ticket-evidence.ts`, `deliveryInputSha256`, `reader.ts`, `cost-ledger.ts`, `notifications.ts`, `github/issue-publication.ts`, `.getEffect`, `resume-provider-review.ts`, `jira-time.ts`, `azure.ts`, `.save`, `delivery-repairs.ts`, `remove-candidate.ts`, `intake/admission.ts`, `Engine`, `admit-improvement.ts`, `coordination.ts`, `time-ledger.ts`, `contract.ts`, `engine.ts`, `github.ts`, `command-registry.ts`, `effects.ts`, `create-candidate.ts`, `brain-followup.ts`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `Coordinator` connect `Coordinator` to `office/config.ts`, `activation-recovery.ts`, `intake/admission.ts`, `requests.ts`, `coordination-tick.ts`, `Store`, `enrollment-gate.ts`, `coordination.ts`, `scheduled-captures.ts`, `assignment-poll.ts`, `scheduled-work.ts`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _428 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `github-delivery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.054139433551198254 - nodes in this community are weakly interconnected._
- **Should `index.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05945945945945946 - nodes in this community are weakly interconnected._
- **Should `activation-recovery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06775067750677506 - nodes in this community are weakly interconnected._