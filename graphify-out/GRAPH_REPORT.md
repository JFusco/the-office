# Graph Report - office-stopped-provider  (2026-11-10)

## Corpus Check
- 787 files · ~314,568 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3906 nodes · 17995 edges · 109 communities (106 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 107 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `906293a5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- artifact
- github-delivery.ts
- TicketJob
- Inspector.tsx
- StageResult
- workKey
- source-amendment.ts
- App.tsx
- OfficeScene.tsx
- Store
- shared.ts
- digest
- features/workflow.ts
- worker-runtime.ts
- weekly-research.ts
- agents.ts
- index.tsx
- MapView.tsx
- office/config.ts
- record-trigger.ts
- post-conflict-preparation.ts
- IntakeLedger
- SourceRegistry
- conversations/conversations.ts
- scheduled-captures.ts
- closeout-recovery.ts
- PeoplePanel.tsx
- scheduled-work.ts
- Button
- TelemetryPanel.tsx
- knowledge/routes.ts
- .emit
- features/commands.ts
- run-accounting.ts
- task-briefing.ts
- schedule.ts
- digest
- investigations/run.ts
- run-retrospective.ts
- session-bridge.ts
- blocker-followups.ts
- ticket-evidence.ts
- enrollment-gate.ts
- outbox.ts
- offices.ts
- reader.ts
- dependency-bots/adopt.ts
- features.ts
- cec/workflow.ts
- telemetry.ts
- cost-ledger.ts
- notifications.ts
- github/issue-publication.ts
- knowledge/learning-events.ts
- .getEffect
- resume-provider-review.ts
- knowledge.ts
- .get
- jira-time.ts
- Coordinator
- maintenance/maintenance.ts
- azure.ts
- .save
- WorkTime
- remove-candidate.ts
- policy.ts
- Engine
- admit-improvement.ts
- JiraIssuePublisher
- fact-bounds.ts
- slack-intake/run.ts
- coordination.ts
- brain-maintenance.ts
- knowledge-snapshot.ts
- time-ledger.ts
- tracking-issue.ts
- lesson-selection.ts
- contract.ts
- outbound.ts
- engine.ts
- assignment-poll.ts
- telemetry/report.ts
- dependencies.ts
- work.ts
- intake/admission.ts
- discovery-recovery.ts
- checkpoint-completion.ts
- store.ts
- DailyCTO.tsx
- .value
- stopped-base-provider.ts
- github.ts
- Offices
- coordination-tick.ts
- documentText
- command-registry.ts
- QuestionDialogHost.tsx
- codex-rollout.ts
- effects.ts
- merge-summary.ts
- create-candidate.ts
- OfficeConfigView.tsx
- brain-followup.ts
- liveReach
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

## Communities (109 total, 3 thin omitted)

### Community 0 - "artifact"
Cohesion: 0.06
Nodes (101): PrerequisitesSchema, activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal (+93 more)

### Community 1 - "github-delivery.ts"
Cohesion: 0.07
Nodes (81): containedFile(), findingsBlock(), namedRepairIds(), assertDeliveryMayMutate(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery() (+73 more)

### Community 2 - "TicketJob"
Cohesion: 0.05
Nodes (66): activeEffectId(), harnessEffect, dependabotReviewGuidance(), StageContext, GitHubDelivery, stagePrompt(), StagePromptInput, ROLES (+58 more)

### Community 3 - "Inspector.tsx"
Cohesion: 0.07
Nodes (66): Conversation(), Outbox(), SendMessage, recommendedReply(), slackMessageStatus(), SlackDeliveryCard(), currentServices(), ServiceHealthPanel() (+58 more)

### Community 4 - "StageResult"
Cohesion: 0.07
Nodes (68): moveLane(), Execute, installDependencies(), major(), harnessCloseout(), PASSING, verifyMergeActions(), HarnessControl (+60 more)

### Community 5 - "workKey"
Cohesion: 0.06
Nodes (65): deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, requireDeliveryAuthority(), accounting, DeliverySubject, nonDelivery (+57 more)

### Community 6 - "source-amendment.ts"
Cohesion: 0.06
Nodes (69): DeliveryTaskInput, DISCOVERY_GUIDANCE, adoptCandidate(), reported, Scope, approvedText(), assert(), AMENDMENT_REVIEW_PROOF (+61 more)

### Community 7 - "App.tsx"
Cohesion: 0.05
Nodes (61): compactSteps(), themeColor, App(), BrainWorkspace, CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants (+53 more)

### Community 8 - "OfficeScene.tsx"
Cohesion: 0.06
Nodes (61): itAgent(), itDiagnostics(), displayAgentTask(), withoutElapsed(), CameraBookmark, restoreBookmark(), LiveAgentTask(), Props (+53 more)

### Community 9 - "Store"
Cohesion: 0.08
Nodes (26): Content, jiraText(), featureItemComplete(), reconcileFeatureCompletion(), GitHubFeaturePublisher, helperTelemetry(), JiraFeaturePublisher, recoverFeatures() (+18 more)

### Community 10 - "shared.ts"
Cohesion: 0.05
Nodes (54): fields, PreferencesPatch, StoredBody, ProjectReadiness, DailyCTOSummary, GoalProgress, SchedulerState, FeatureDelivery() (+46 more)

### Community 11 - "digest"
Cohesion: 0.09
Nodes (52): removeAdoptedClone(), closeoutRequestResolved(), continuationNativeReview(), preparationRequestResolved(), assertStoppedBaseAudit(), AuditRow, readStoppedBaseAuditCompletion(), StoppedBaseAuditReader (+44 more)

### Community 12 - "features/workflow.ts"
Cohesion: 0.08
Nodes (47): approveFeature(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), discoveryPrompt(), planPrompt(), artifactPath() (+39 more)

### Community 13 - "worker-runtime.ts"
Cohesion: 0.06
Nodes (51): candidateWorkspaceEnvironment(), AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), assignmentSubject(), dispatchExposure(), prepareExposure(), assertRetainedDispatchScope(), goalEvidencePath() (+43 more)

### Community 14 - "weekly-research.ts"
Cohesion: 0.06
Nodes (36): retryDelay(), mirror(), ResearchResult, runWeeklyResearch(), scheduledResearch(), DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts (+28 more)

### Community 15 - "agents.ts"
Cohesion: 0.06
Nodes (41): cecPrompt(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), resolvedDecisionNote(), stageInstructions, cecChatPrompt() (+33 more)

### Community 16 - "index.tsx"
Cohesion: 0.09
Nodes (49): KnowledgeSourceSummary, AddPublicSource(), AddSourceForm(), SourceConnection, SourceCard(), supported, UploadSource(), WithdrawSource() (+41 more)

### Community 17 - "MapView.tsx"
Cohesion: 0.07
Nodes (46): KnowledgeActivity, KnowledgeMap, KnowledgeNode, BrainDrawer(), CameraPose, flightPose(), cameraTarget(), focusDistance (+38 more)

### Community 18 - "office/config.ts"
Cohesion: 0.06
Nodes (42): args, [cmd,...rawArgs], commands, key, projectIndex, close(), config, itSpecialist (+34 more)

### Community 19 - "record-trigger.ts"
Cohesion: 0.07
Nodes (52): deliveryMetrics(), median(), baselineLearning(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences(), maintenanceSubject() (+44 more)

### Community 20 - "post-conflict-preparation.ts"
Cohesion: 0.09
Nodes (50): assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), reconcileCompletedConflictDraft(), routeReadyPostConflictPublication(), verifyInitialDraftConflictPreparation() (+42 more)

### Community 21 - "IntakeLedger"
Cohesion: 0.13
Nodes (37): privateFile(), CaptureReceipt, ChannelProgress, IntakeResult, IntakeResultValue, LIMITS, Proposal, ReadKind (+29 more)

### Community 22 - "SourceRegistry"
Cohesion: 0.09
Nodes (31): Config, configDigest(), IntakeConfig, readConfig(), SlackReadAuthority, readAuthority(), Command, sourceCommand() (+23 more)

### Community 23 - "conversations/conversations.ts"
Cohesion: 0.08
Nodes (33): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+25 more)

### Community 24 - "scheduled-captures.ts"
Cohesion: 0.16
Nodes (42): assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest, captureRequests(), failCapture(), requestCapture(), saveCaptureRequest() (+34 more)

### Community 25 - "closeout-recovery.ts"
Cohesion: 0.10
Nodes (46): deliveryTask(), closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2 (+38 more)

### Community 26 - "PeoplePanel.tsx"
Cohesion: 0.09
Nodes (41): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+33 more)

### Community 27 - "scheduled-work.ts"
Cohesion: 0.09
Nodes (32): gateRegisteredDelivery(), deliverySlot(), metadataRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), busyMaintenanceIds(), RollupResult, busySubjects() (+24 more)

### Community 28 - "Button"
Cohesion: 0.13
Nodes (27): KnowledgeCapturePage, KnowledgeActivityPage, Activity(), ActivityStatus(), AssignmentKnowledge(), CaptureReviewDetail(), CaptureReviews(), empty (+19 more)

### Community 29 - "TelemetryPanel.tsx"
Cohesion: 0.10
Nodes (35): TelemetryReport, AzureBuild, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens(), usd() (+27 more)

### Community 30 - "knowledge/routes.ts"
Cohesion: 0.15
Nodes (27): intakeActivity(), knowledgeActivityPage(), KnowledgeContext, independentDigestEvidence(), prepareDigestBodies(), retainDigestBody(), publicSearch(), bounded() (+19 more)

### Community 31 - ".emit"
Cohesion: 0.12
Nodes (29): configureNotices(), retryRecipientLookup(), failedWorker(), requeueWaitedImplement(), normalizeStatement(), configureDigestDelivery(), DigestSettings, configureKnowledge() (+21 more)

### Community 32 - "features/commands.ts"
Cohesion: 0.14
Nodes (26): commandFeature(), createFeature(), featureById(), reviewQuestions(), assertEnrollable(), FeatureCommandSchema, Link, linkFeature() (+18 more)

### Community 33 - "run-accounting.ts"
Cohesion: 0.10
Nodes (36): ghLogCacheEvidence(), BoundedRead, done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf(), EvidenceOutcome (+28 more)

### Community 34 - "task-briefing.ts"
Cohesion: 0.10
Nodes (24): assignmentKnowledge(), LessonSelection, AssignmentLookups, Binding, lookupInstructions(), decodeLookupJournal(), lookupJournal, readLookupJournal() (+16 more)

### Community 35 - "schedule.ts"
Cohesion: 0.14
Nodes (29): learningMetrics(), lessonsNeedingReview(), RollupResultSchema, KnowledgeRunner, newTask(), reconcileIntakeStatus(), scheduledSlackIntake(), sourceWork() (+21 more)

### Community 36 - "digest"
Cohesion: 0.12
Nodes (30): comparableSlackText(), createExtractor(), extractDocument, Extraction, Extractor, uploadArtifact(), AuthoredDigest, reconcileDigestAuthorship() (+22 more)

### Community 37 - "investigations/run.ts"
Cohesion: 0.13
Nodes (27): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationCandidates(), investigationId(), investigationEvidence(), investigationFollowUps(), INVOCATION_SOURCE_REFS, invocationSource() (+19 more)

### Community 38 - "run-retrospective.ts"
Cohesion: 0.12
Nodes (30): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, appendLearningFacts(), freezeLearningPacket(), ARTIFACT_LIMIT, clip(), LEDGER_STEPS (+22 more)

### Community 39 - "session-bridge.ts"
Cohesion: 0.11
Nodes (27): claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexSessionContext(), readRollout, claudeSessions(), codexSessions() (+19 more)

### Community 40 - "blocker-followups.ts"
Cohesion: 0.13
Nodes (27): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved() (+19 more)

### Community 41 - "ticket-evidence.ts"
Cohesion: 0.14
Nodes (29): assetDownloader(), attachmentKind(), evidenceDirectory(), readEvidence(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS (+21 more)

### Community 42 - "enrollment-gate.ts"
Cohesion: 0.19
Nodes (29): dispatchNightly(), drainDelivery(), requestDelivery(), resume(), startPilot(), eligibility(), approvedDelivery(), bindDelivery() (+21 more)

### Community 43 - "outbox.ts"
Cohesion: 0.12
Nodes (26): projectOutbox(), syncOutbox(), projectSlackDeliveries(), settleRequestedSlackReplacement(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint() (+18 more)

### Community 44 - "offices.ts"
Cohesion: 0.13
Nodes (25): assertAssessmentVisibility(), assertQuestionVisibility(), pendingQuestions(), diagnosticContext(), diagnosticSnapshot(), eventVisible(), knowledgeOfficeState(), knowledgePromptStore() (+17 more)

### Community 45 - "reader.ts"
Cohesion: 0.08
Nodes (21): captureAfter(), CaptureMetadata, capturePage(), cursor(), key(), captureIdentityMatches(), BrainCaptureReceipt, hash (+13 more)

### Community 46 - "dependency-bots/adopt.ts"
Cohesion: 0.15
Nodes (29): Execute, readBackOrThrow(), adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR (+21 more)

### Community 47 - "features.ts"
Cohesion: 0.11
Nodes (28): normalizeRound(), FeatureApproval, FeatureAttempt, FeatureAuthority, FeatureBaseline, FeatureDocument, FeatureHandoff, FeatureHarnessAction (+20 more)

### Community 48 - "cec/workflow.ts"
Cohesion: 0.17
Nodes (27): parksInJira(), run(), advance(), nextStage(), publicationEvidenceGap(), qaEvidenceGap(), resultGate(), stageResultGap() (+19 more)

### Community 49 - "telemetry.ts"
Cohesion: 0.10
Nodes (27): CodexRollout, CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL (+19 more)

### Community 50 - "cost-ledger.ts"
Cohesion: 0.16
Nodes (26): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress(), effectId() (+18 more)

### Community 51 - "notifications.ts"
Cohesion: 0.14
Nodes (15): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), Identity, MergeNotifications, NoticeSettings (+7 more)

### Community 52 - "github/issue-publication.ts"
Cohesion: 0.17
Nodes (11): FeaturePublisher, PublicationReceipt, Assign, Board, Content, GitHubIssuePublisher, number(), same() (+3 more)

### Community 53 - "knowledge/learning-events.ts"
Cohesion: 0.15
Nodes (20): retainedArtifactScope(), eventSourceBindings(), captureLearning(), recordLearningOpportunity(), exposureBindings(), requestSourceBindings(), citations(), recordAcceptedKnowledge() (+12 more)

### Community 54 - ".getEffect"
Cohesion: 0.17
Nodes (13): publishFeature(), GitHubOperations, digestNoticeNeverDispatched(), fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), goalNoticeNeverDispatched(), closeNativeRefresh() (+5 more)

### Community 55 - "resume-provider-review.ts"
Cohesion: 0.22
Nodes (22): Lane, MOVABLE, resolveLane(), cardStatus(), ProjectCard, projectCards(), projectGraphql(), setCardStatus() (+14 more)

### Community 56 - "knowledge.ts"
Cohesion: 0.11
Nodes (24): publicTopicSafe(), researchTopics(), TEMPLATES, Kind, RetrospectiveResult, Stage, ImprovementGrant, KnowledgeRetry (+16 more)

### Community 57 - ".get"
Cohesion: 0.17
Nodes (20): captureProposal(), effectId(), recordObservation(), settlePage(), DERIVED, acceptProposals(), runSlackLinks(), queueReconsideration() (+12 more)

### Community 58 - "jira-time.ts"
Cohesion: 0.14
Nodes (20): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+12 more)

### Community 59 - "Coordinator"
Cohesion: 0.08
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 60 - "maintenance/maintenance.ts"
Cohesion: 0.15
Nodes (18): captureMaintenanceStep(), candidateOwner(), SETTLED, skipOwnedCandidate(), Skipped, skippedCandidateLedger(), CmsFollowUpContext, cmsFollowUpInstructions() (+10 more)

### Community 61 - "azure.ts"
Cohesion: 0.15
Nodes (20): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+12 more)

### Community 62 - ".save"
Cohesion: 0.26
Nodes (22): BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue(), readIssues(), commentDecision() (+14 more)

### Community 63 - "WorkTime"
Cohesion: 0.17
Nodes (22): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence(), CaptureContext (+14 more)

### Community 64 - "remove-candidate.ts"
Cohesion: 0.20
Nodes (17): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+9 more)

### Community 65 - "policy.ts"
Cohesion: 0.19
Nodes (17): DELAYS, MAX_EXECUTIONS, MAX_REPLANS, reserveReplacement(), stageBudget(), confirmBrief(), classifyFeatureFailure(), automaticEnabled() (+9 more)

### Community 66 - "Engine"
Cohesion: 0.10
Nodes (5): correlatedBuild(), Engine, observe(), observeParked(), parkedReadError

### Community 67 - "admit-improvement.ts"
Cohesion: 0.21
Nodes (17): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+9 more)

### Community 68 - "JiraIssuePublisher"
Cohesion: 0.27
Nodes (5): Assignment, JiraIssuePublisher, keyOf(), plainDescription(), Transition

### Community 69 - "fact-bounds.ts"
Cohesion: 0.21
Nodes (18): leadershipContext(), leadershipEntries(), knowledgeEntries(), collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime() (+10 more)

### Community 70 - "slack-intake/run.ts"
Cohesion: 0.21
Nodes (14): Observation, Message, observeRead(), Page, readArguments(), readMethod(), ReadUnavailable, intakePrompt() (+6 more)

### Community 71 - "coordination.ts"
Cohesion: 0.16
Nodes (18): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation(), checkpointWindow(), dueAt() (+10 more)

### Community 72 - "brain-maintenance.ts"
Cohesion: 0.19
Nodes (11): maintenancePolicies(), reconcileNativeDelivery(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice(), easternDate() (+3 more)

### Community 73 - "knowledge-snapshot.ts"
Cohesion: 0.37
Nodes (14): knowledgeActivity(), knowledgeSnapshot(), officeKnowledgeSnapshot(), publicReference(), lookupSummaryVisible(), publicLookupSummary(), outcomeVisible(), publicOutcome() (+6 more)

### Community 74 - "time-ledger.ts"
Cohesion: 0.21
Nodes (12): captureTime(), timeLedger(), artifact(), correctRecoveryClassification(), digest(), timeClassificationDigest(), TimeClassificationInput, syncing (+4 more)

### Community 75 - "tracking-issue.ts"
Cohesion: 0.20
Nodes (13): ensureTrackingIssue(), findTrackingIssue(), ownTracking(), TrackingIssue, trackingIssueBody(), trackingIssueTitle(), trackingMarker(), centralCompanionHandoff() (+5 more)

### Community 76 - "lesson-selection.ts"
Cohesion: 0.21
Nodes (15): knowledgeContext(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), MAINTENANCE, MAX_LESSONS (+7 more)

### Community 77 - "contract.ts"
Cohesion: 0.22
Nodes (11): At, Errno, GroupInventory, GroupProbe, LifecycleDiagnostic, Phase, Pid, groupInventory() (+3 more)

### Community 78 - "outbound.ts"
Cohesion: 0.23
Nodes (10): assertDigestDispatch(), outboundBody(), retainOutboundBody(), digestNoticeRequest(), queueOutboundDigests(), digestKnowledge(), sendDigestNotice(), Target (+2 more)

### Community 79 - "engine.ts"
Cohesion: 0.22
Nodes (11): checkMail(), drainMail(), requestMail(), enableNightly(), MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), ingest() (+3 more)

### Community 80 - "assignment-poll.ts"
Cohesion: 0.26
Nodes (10): noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), due(), unparkReleasedWaits(), compare(), highestStableAtLeast(), parts() (+2 more)

### Community 81 - "telemetry/report.ts"
Cohesion: 0.24
Nodes (14): TelemetryRow, TelemetrySync, Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount() (+6 more)

### Community 82 - "dependencies.ts"
Cohesion: 0.38
Nodes (10): resumeParked(), compatible(), dependencyCompletionKey(), dependencyEligibility(), DependencyStores, issueKey(), observePrerequisites(), PrerequisiteSchema (+2 more)

### Community 83 - "work.ts"
Cohesion: 0.15
Nodes (12): AssignmentResult, CompletionCondition, Continuation, DeliveryAdmission, DependencyObservation, EligibilityState, FailureCategory, ReconciliationAction (+4 more)

### Community 84 - "intake/admission.ts"
Cohesion: 0.29
Nodes (10): deliveryIntakeBlocker(), Admission, admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, Prerequisite, AssignmentReview (+2 more)

### Community 85 - "discovery-recovery.ts"
Cohesion: 0.29
Nodes (10): Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership, rawHash() (+2 more)

### Community 86 - "checkpoint-completion.ts"
Cohesion: 0.24
Nodes (7): BrainStatusSchema, identity, brainCheckpointCompletion(), coverageSchema, followupSchema, verified, reconcileCompletedCheckpoints()

### Community 87 - "store.ts"
Cohesion: 0.26
Nodes (8): comparable(), recordRunEvidence(), initializeStoreSchema(), checkpointMeasurement(), HEARTBEAT_GAP_MS, HEARTBEAT_MS, startMeasurement(), WorkOutcome

### Community 88 - "DailyCTO.tsx"
Cohesion: 0.26
Nodes (8): CTOReview(), goalState, DailyCTO(), GoalHistory(), reportDate(), reviewStatus, reviewExcerpt(), ReviewText()

### Community 89 - ".value"
Cohesion: 0.27
Nodes (6): file, folder, logs, root, xml(), ProjectProgress

### Community 90 - "stopped-base-provider.ts"
Cohesion: 0.33
Nodes (8): pinCourier, pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), discussion(), pages(), pullIdentity(), readStoppedBaseProviderContext(), reviewThreads()

### Community 91 - "github.ts"
Cohesion: 0.29
Nodes (6): GitHubMonitor, githubPRDescription(), GOAL_EVIDENCE_LIMITS, GitHubBoard, GitHubPR, GitHubState

### Community 93 - "coordination-tick.ts"
Cohesion: 0.33
Nodes (7): reconcileNoticeConfirmations(), legacy, reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION, tick()

### Community 94 - "documentText"
Cohesion: 0.33
Nodes (6): guidanceExcerpt(), evidenceTitle(), DocumentMetadata, documentText(), KnowledgeDocumentText, DocumentPreview()

### Community 95 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 96 - "QuestionDialogHost.tsx"
Cohesion: 0.44
Nodes (7): FeatureQuestionProjection, nextQuestion(), orderedQuestions(), questionKey(), QuestionDialogHost(), readSuppressed(), Dialog()

### Community 97 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 98 - "effects.ts"
Cohesion: 0.36
Nodes (5): JiraOperations, plain(), unpack(), EffectOperation, WorkRef

### Community 99 - "merge-summary.ts"
Cohesion: 0.36
Nodes (7): clamp(), LIMITS, MergedPR, plainSlackText(), section(), shippedSummary(), mergeText()

### Community 100 - "create-candidate.ts"
Cohesion: 0.48
Nodes (6): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf()

### Community 101 - "OfficeConfigView.tsx"
Cohesion: 0.48
Nodes (5): loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView(), OfficeConfigSummary

### Community 103 - "liveReach"
Cohesion: 0.60
Nodes (5): GIT_NETWORK, LIVE_PROVIDERS, liveReach(), networkUrl(), remoteUrls()

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
- **428 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+423 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `artifact`, `github-delivery.ts`, `TicketJob`, `StageResult`, `workKey`, `source-amendment.ts`, `shared.ts`, `digest`, `features/workflow.ts`, `worker-runtime.ts`, `weekly-research.ts`, `agents.ts`, `office/config.ts`, `record-trigger.ts`, `post-conflict-preparation.ts`, `IntakeLedger`, `SourceRegistry`, `conversations/conversations.ts`, `scheduled-captures.ts`, `closeout-recovery.ts`, `scheduled-work.ts`, `knowledge/routes.ts`, `.emit`, `features/commands.ts`, `run-accounting.ts`, `task-briefing.ts`, `schedule.ts`, `digest`, `investigations/run.ts`, `run-retrospective.ts`, `session-bridge.ts`, `blocker-followups.ts`, `ticket-evidence.ts`, `enrollment-gate.ts`, `outbox.ts`, `offices.ts`, `dependency-bots/adopt.ts`, `cost-ledger.ts`, `notifications.ts`, `github/issue-publication.ts`, `knowledge/learning-events.ts`, `.getEffect`, `resume-provider-review.ts`, `knowledge.ts`, `jira-time.ts`, `maintenance/maintenance.ts`, `azure.ts`, `.save`, `WorkTime`, `remove-candidate.ts`, `policy.ts`, `admit-improvement.ts`, `slack-intake/run.ts`, `coordination.ts`, `brain-maintenance.ts`, `time-ledger.ts`, `tracking-issue.ts`, `lesson-selection.ts`, `outbound.ts`, `engine.ts`, `dependencies.ts`, `intake/admission.ts`, `discovery-recovery.ts`, `checkpoint-completion.ts`, `store.ts`, `stopped-base-provider.ts`, `github.ts`, `coordination-tick.ts`, `effects.ts`, `create-candidate.ts`, `brain-followup.ts`?**
  _High betweenness centrality (0.142) - this node is a cross-community bridge._
- **Why does `command()` connect `Store` to `artifact`, `github-delivery.ts`, `TicketJob`, `StageResult`, `workKey`, `digest`, `features/workflow.ts`, `worker-runtime.ts`, `agents.ts`, `office/config.ts`, `IntakeLedger`, `closeout-recovery.ts`, `digest`, `session-bridge.ts`, `ticket-evidence.ts`, `reader.ts`, `cost-ledger.ts`, `notifications.ts`, `github/issue-publication.ts`, `.getEffect`, `resume-provider-review.ts`, `jira-time.ts`, `maintenance/maintenance.ts`, `azure.ts`, `.save`, `remove-candidate.ts`, `Engine`, `admit-improvement.ts`, `coordination.ts`, `brain-maintenance.ts`, `time-ledger.ts`, `contract.ts`, `engine.ts`, `dependencies.ts`, `github.ts`, `command-registry.ts`, `effects.ts`, `create-candidate.ts`, `brain-followup.ts`, `liveReach`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `Coordinator` connect `Coordinator` to `artifact`, `workKey`, `coordination.ts`, `Store`, `enrollment-gate.ts`, `offices.ts`, `assignment-poll.ts`, `dependencies.ts`, `scheduled-captures.ts`, `scheduled-work.ts`, `coordination-tick.ts`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _428 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `artifact` be split into smaller, more focused modules?**
  _Cohesion score 0.06117552978808476 - nodes in this community are weakly interconnected._
- **Should `github-delivery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07094594594594594 - nodes in this community are weakly interconnected._
- **Should `TicketJob` be split into smaller, more focused modules?**
  _Cohesion score 0.04987489574645538 - nodes in this community are weakly interconnected._