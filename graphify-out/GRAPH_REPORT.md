# Graph Report - office-ownership-integration  (2026-11-10)

## Corpus Check
- 747 files · ~302,315 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3762 nodes · 17088 edges · 103 communities (100 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 100 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `583b8e3c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- artifact
- requests.ts
- shared.ts
- index.tsx
- TicketJob
- agents.ts
- github-delivery.ts
- knowledge/routes.ts
- .save
- features/workflow.ts
- features.ts
- admit-improvement.ts
- run-accounting.ts
- Store
- record-trigger.ts
- workKey
- cx
- digest
- scheduled-captures.ts
- constellation-runtime.ts
- worker-runtime.ts
- knowledge.ts
- Button
- .emit
- delivery-recoveries.ts
- mutedCopy
- TelemetryPanel.tsx
- run-retrospective.ts
- SourceRegistry
- App.tsx
- conversations/conversations.ts
- maintenance/maintenance.ts
- cec/workflow.ts
- sourceVisible
- ControlStore
- engine.ts
- closeout-recovery.ts
- ticket-evidence.ts
- digest
- slack-intake/run.ts
- accept-stage-result.ts
- work-summary.ts
- session-bridge.ts
- office/config.ts
- store.ts
- azure.ts
- schedule.ts
- http/commands.ts
- slack-intake/report.ts
- offices.ts
- time-scope.ts
- lesson-selection.ts
- cost-ledger.ts
- reader.ts
- jira-time.ts
- preparation-readback.ts
- .transaction
- useOfficePreferences.ts
- resume-provider-review.ts
- Coordinator
- scheduled-work.ts
- scheduler.ts
- assignment-poll.ts
- remove-candidate.ts
- outbox.ts
- intake/admission.ts
- investigations/run.ts
- FeatureWorkspace.tsx
- IntakeLedger
- dependency-bots/adopt.ts
- harnessEffect
- source-amendment-scope.ts
- it-specialist.ts
- evidence.ts
- fact-bounds.ts
- telemetry/report.ts
- slack-intake/config.ts
- Role
- contract.ts
- coordination-tick.ts
- coordination.ts
- DailyCTO.tsx
- tracking-issue.ts
- work.ts
- blocker-followups.ts
- investigations/ledger.ts
- http/context.ts
- command-registry.ts
- recovery-ledger.ts
- checkpoint-completion.ts
- checkpoint-retry.ts
- .pump
- codex-rollout.ts
- read-retries.ts
- OfficeConfigView.tsx
- knowledge-sources.ts
- documentText
- extract-worker.mjs
- highestStableAtLeast
- BrainFollowup
- slack-supersession.ts
- helper-evidence.py

## God Nodes (most connected - your core abstractions)
1. `Store` - 343 edges
2. `TicketJob` - 147 edges
3. `GitHubDelivery` - 133 edges
4. `command()` - 108 edges
5. `digest()` - 107 edges
6. `artifact()` - 98 edges
7. `workKey()` - 91 edges
8. `cx()` - 88 edges
9. `currentAssignment()` - 72 edges
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
- `githubEvidence()` --indirect_call--> `row()`  [INFERRED]
  server/features/handoff/github-evidence.ts → src/telemetry/report.ts

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

## Communities (103 total, 3 thin omitted)

### Community 0 - "artifact"
Cohesion: 0.07
Nodes (92): closeoutCheckpoint(), closeoutRecoveryCandidate(), CloseoutRecoveryKind, coreCloseoutNative(), verifiedCloseoutCleanupRequest(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration() (+84 more)

### Community 1 - "requests.ts"
Cohesion: 0.05
Nodes (92): deliveryTask(), adoptCandidate(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related (+84 more)

### Community 2 - "shared.ts"
Cohesion: 0.04
Nodes (77): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, slackHealth(), label() (+69 more)

### Community 3 - "index.tsx"
Cohesion: 0.06
Nodes (66): Conversation(), SendMessage, recommendedReply(), slackMessageStatus(), SlackDeliveryCard(), labels, BlockerFollowups(), IntakeSummary() (+58 more)

### Community 4 - "TicketJob"
Cohesion: 0.06
Nodes (50): Execute, installDependencies(), major(), removeAdoptedClone(), harnessCloseout(), PASSING, verifyMergeActions(), assertDeliveryMayMutate() (+42 more)

### Community 5 - "agents.ts"
Cohesion: 0.05
Nodes (55): JiraOperations, plain(), cecPrompt(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), resolvedDecisionNote() (+47 more)

### Community 6 - "github-delivery.ts"
Cohesion: 0.07
Nodes (66): containedFile(), findingsBlock(), BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction(), dependabotReviewGuidance(), discover() (+58 more)

### Community 7 - "knowledge/routes.ts"
Cohesion: 0.07
Nodes (42): intakeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainReader, guidanceExcerpt(), KnowledgeContext, AssignmentLookups (+34 more)

### Community 8 - ".save"
Cohesion: 0.06
Nodes (60): file, folder, logs, root, xml(), BLOCKED, Execute, findComment() (+52 more)

### Community 9 - "features/workflow.ts"
Cohesion: 0.09
Nodes (46): commandFeature(), featureById(), reviewQuestions(), featureItemComplete(), reconcileFeatureCompletion(), discoveryPrompt(), planPrompt(), helperTelemetry() (+38 more)

### Community 10 - "features.ts"
Cohesion: 0.07
Nodes (57): approveFeature(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), artifactPath(), digest(), document() (+49 more)

### Community 11 - "admit-improvement.ts"
Cohesion: 0.08
Nodes (30): Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), plainDescription(), Transition, unpack() (+22 more)

### Community 12 - "run-accounting.ts"
Cohesion: 0.06
Nodes (58): BoundedRead, backfillClaudeCost(), CompletionReader, CodexRollout, codexHome(), createdAt(), dayDirs(), header() (+50 more)

### Community 13 - "Store"
Cohesion: 0.06
Nodes (17): correlatedBuild(), GitHubFeaturePublisher, JiraFeaturePublisher, Assessment, Engine, observe(), observeParked(), parkedReadError (+9 more)

### Community 14 - "record-trigger.ts"
Cohesion: 0.07
Nodes (53): deliveryMetrics(), median(), baselineLearning(), LEARNING_BASELINES, maintainLearning(), maintenanceSubject(), MaintenanceSubjectFacts, busyMaintenanceIds() (+45 more)

### Community 15 - "workKey"
Cohesion: 0.07
Nodes (47): recordJobApproach(), completedPRReviews(), continuationScope(), continuationGuard(), Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate() (+39 more)

### Community 16 - "cx"
Cohesion: 0.07
Nodes (53): withoutElapsed(), CameraBookmark, restoreBookmark(), Avatar(), AzureWall(), Chair(), Coworker(), CTORoom() (+45 more)

### Community 17 - "digest"
Cohesion: 0.13
Nodes (47): activeEffectId(), retryRead(), admitPRMetadata(), assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema, savedMetadataAssessment() (+39 more)

### Community 18 - "scheduled-captures.ts"
Cohesion: 0.14
Nodes (48): createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest, captureRequests() (+40 more)

### Community 19 - "constellation-runtime.ts"
Cohesion: 0.07
Nodes (41): KnowledgeActivity, KnowledgeEdge, KnowledgeIntakeStatus, KnowledgeMap, KnowledgeNode, CameraPose, flightPose(), cameraTarget() (+33 more)

### Community 20 - "worker-runtime.ts"
Cohesion: 0.08
Nodes (39): SlackResultSchema, SlackVerificationSchema, candidateWorkspaceEnvironment(), assertDigestDispatch(), assignmentSubject(), dispatchExposure(), prepareExposure(), assertRetainedDispatchScope() (+31 more)

### Community 21 - "knowledge.ts"
Cohesion: 0.07
Nodes (46): expireLearningPackets(), packetReferences(), learningMetrics(), lessonsNeedingReview(), publicTopicSafe(), researchTopics(), TEMPLATES, Kind (+38 more)

### Community 22 - "Button"
Cohesion: 0.11
Nodes (32): KnowledgeCapturePage, KnowledgeDigestDelivery, KnowledgeActivityPage, Activity(), ActivityStatus(), AssignmentKnowledge(), CaptureReviewDetail(), CaptureReviews() (+24 more)

### Community 23 - ".emit"
Cohesion: 0.10
Nodes (25): MessageInput, reconcileNoticeConfirmations(), finishSupersededReadback(), projectSlackDeliveries(), settleRequestedSlackReplacement(), SlackMessages, SlackRequestSchema, Input (+17 more)

### Community 24 - "delivery-recoveries.ts"
Cohesion: 0.09
Nodes (38): deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, requireDeliveryAuthority(), deliveryIntakeBlocker(), gateRegisteredDelivery(), accounting (+30 more)

### Community 25 - "mutedCopy"
Cohesion: 0.12
Nodes (35): KnowledgeSourceSummary, AddPublicSource(), AddSourceForm(), SourceConnection, SourceCard(), Sources(), supported, UploadSource() (+27 more)

### Community 26 - "TelemetryPanel.tsx"
Cohesion: 0.09
Nodes (41): TelemetryReport, displayAgentTask(), LiveAgentTask(), Props, RunningTask(), text(), AzureBuild, BreakdownTable() (+33 more)

### Community 27 - "run-retrospective.ts"
Cohesion: 0.10
Nodes (37): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, captureLearning(), learningDigest(), recordLearningOpportunity(), appendLearningFacts(), freezeLearningPacket() (+29 more)

### Community 28 - "SourceRegistry"
Cohesion: 0.12
Nodes (28): captureProposal(), effectId(), Config, configDigest(), IntakeConfig, readConfig(), SlackReadAuthority, collectionAllowed() (+20 more)

### Community 29 - "App.tsx"
Cohesion: 0.05
Nodes (41): BrainDrawer(), themeColor, BrainWorkspace, CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants, ElevatorPhase (+33 more)

### Community 30 - "conversations/conversations.ts"
Cohesion: 0.09
Nodes (29): assertConversationReadback(), Conversations, GoalChangeSchema, ReplySchema, pumpCTO(), queueCTOHandoff(), saveGoals(), pumpIT() (+21 more)

### Community 31 - "maintenance/maintenance.ts"
Cohesion: 0.09
Nodes (30): ApproachSchema, maintenancePolicies(), captureMaintenanceStep(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice() (+22 more)

### Community 32 - "cec/workflow.ts"
Cohesion: 0.12
Nodes (36): parksInJira(), MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), run(), advance(), nextStage(), publicationEvidenceGap() (+28 more)

### Community 33 - "sourceVisible"
Cohesion: 0.15
Nodes (30): knowledgeActivity(), independentDigestEvidence(), digestNoticeRequest(), queueOutboundDigests(), digestKnowledge(), prepareDigestBodies(), retainDigestBody(), knowledgeScopeRevision() (+22 more)

### Community 34 - "ControlStore"
Cohesion: 0.09
Nodes (19): mirror(), runWeeklyResearch(), scheduledResearch(), DailyCTO, dailyReviewPrompt(), queueGoalEvidenceRequest(), DailyResultSchema, GoalEvidenceRequestSchema (+11 more)

### Community 35 - "engine.ts"
Cohesion: 0.12
Nodes (31): checkMail(), drainMail(), requestMail(), dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), resume() (+23 more)

### Community 36 - "closeout-recovery.ts"
Cohesion: 0.11
Nodes (38): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutProviderEvidence() (+30 more)

### Community 37 - "ticket-evidence.ts"
Cohesion: 0.12
Nodes (32): assetDownloader(), attachmentKind(), evidenceDirectory(), readEvidence(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS (+24 more)

### Community 38 - "digest"
Cohesion: 0.15
Nodes (25): comparableSlackText(), uploadArtifact(), AuthoredDigest, reconcileDigestAuthorship(), unitAuthorship(), annotateAuthoredUnits(), outboundBody(), retainOutboundBody() (+17 more)

### Community 39 - "slack-intake/run.ts"
Cohesion: 0.14
Nodes (30): independentIntakeResult(), recordObservation(), settlePage(), ChannelProgress, Observation, Message, observeRead(), Page (+22 more)

### Community 40 - "accept-stage-result.ts"
Cohesion: 0.12
Nodes (35): acceptStageResult(), StageContext, PrerequisitesSchema, linkDraftIssue(), protectedOriginalClaim(), METADATA_FINDING, publicationReadArgs(), Read (+27 more)

### Community 41 - "work-summary.ts"
Cohesion: 0.12
Nodes (31): compactSteps(), Outbox(), App(), TicketDetail(), envelopeCard, deliveryRepairProjection(), DependencyNotice(), card (+23 more)

### Community 42 - "session-bridge.ts"
Cohesion: 0.11
Nodes (27): claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexSessionContext(), readRollout, claudeSessions(), codexSessions() (+19 more)

### Community 43 - "office/config.ts"
Cohesion: 0.08
Nodes (32): args, [cmd,...rawArgs], commands, key, projectIndex, AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), FeaturePlanningBindings (+24 more)

### Community 44 - "store.ts"
Cohesion: 0.10
Nodes (21): snapshot(), Clock, DATA, sanitizeObject(), applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration (+13 more)

### Community 45 - "azure.ts"
Cohesion: 0.10
Nodes (26): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+18 more)

### Community 46 - "schedule.ts"
Cohesion: 0.15
Nodes (21): KnowledgeRunner, reconcileIntakeStatus(), runSlackLinks(), scheduledSlackIntake(), sourceWork(), IntakeBudget, Collection, publicSourceWork() (+13 more)

### Community 47 - "http/commands.ts"
Cohesion: 0.15
Nodes (25): enqueueMetadataRecovery(), normalizeStatement(), configureDigestDelivery(), DigestSettings, configureKnowledge(), declineLessonIssue(), demoteLesson(), reactivateLesson() (+17 more)

### Community 48 - "slack-intake/report.ts"
Cohesion: 0.15
Nodes (27): Proposal, ReadTask, isStoppingFor(), intakeProgress(), terminalDeferred(), unitKey(), verifiedCapture(), LinkRecord (+19 more)

### Community 49 - "offices.ts"
Cohesion: 0.17
Nodes (20): diagnosticSnapshot(), retainedArtifactScope(), eventSourceBindings(), eventVisible(), leadershipContext(), leadershipEntries(), exposureBindings(), requestSourceBindings() (+12 more)

### Community 50 - "time-scope.ts"
Cohesion: 0.16
Nodes (27): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence(), CaptureContext (+19 more)

### Community 51 - "lesson-selection.ts"
Cohesion: 0.13
Nodes (25): knowledgeContext(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), LessonSelection, MAINTENANCE (+17 more)

### Community 52 - "cost-ledger.ts"
Cohesion: 0.17
Nodes (25): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress(), effectId() (+17 more)

### Community 53 - "reader.ts"
Cohesion: 0.11
Nodes (19): captureAfter(), CaptureMetadata, capturePage(), cursor(), key(), captureIdentityMatches(), BrainCaptureReceipt, hash (+11 more)

### Community 54 - "jira-time.ts"
Cohesion: 0.14
Nodes (21): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+13 more)

### Community 55 - "preparation-readback.ts"
Cohesion: 0.14
Nodes (25): assertPostConflictOwnership(), readPostConflictPreparationFacts(), routeReadyPostConflictPublication(), verifyInitialDraftConflictPreparation(), bindPreparationBoardOrigins(), claimSchema, eventSchema, PreparationBoardOrigin (+17 more)

### Community 56 - ".transaction"
Cohesion: 0.17
Nodes (9): FeaturePublisher, publishFeature(), GitHubOperations, fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), closeNativeRefresh(), fingerprint() (+1 more)

### Community 57 - "useOfficePreferences.ts"
Cohesion: 0.11
Nodes (21): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, acceptPreferences(), PreferenceCandidate (+13 more)

### Community 58 - "resume-provider-review.ts"
Cohesion: 0.23
Nodes (23): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), ProjectCard, projectCards(), projectGraphql() (+15 more)

### Community 59 - "Coordinator"
Cohesion: 0.08
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 60 - "scheduled-work.ts"
Cohesion: 0.15
Nodes (19): deliverySlot(), ROLES, stageRole(), closeoutRequestResolved(), metadataRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), deterministicActions (+11 more)

### Community 61 - "scheduler.ts"
Cohesion: 0.17
Nodes (11): fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch(), deliveryOccupied(), foreignWork() (+3 more)

### Community 62 - "assignment-poll.ts"
Cohesion: 0.15
Nodes (15): Execute, adoptDependabot(), DEPENDABOT, openDependabotPulls(), readRepo(), refusal(), pinCourier, ACTIONS (+7 more)

### Community 63 - "remove-candidate.ts"
Cohesion: 0.20
Nodes (17): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+9 more)

### Community 64 - "outbox.ts"
Cohesion: 0.17
Nodes (16): projectOutbox(), syncOutbox(), digestNoticeNeverDispatched(), knowledgeOutbox(), goalNoticeNeverDispatched(), maintenanceNoticeNeverDispatched(), checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup() (+8 more)

### Community 65 - "intake/admission.ts"
Cohesion: 0.23
Nodes (17): Admission, admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, compatible(), dependencyCompletionKey(), dependencyEligibility() (+9 more)

### Community 66 - "investigations/run.ts"
Cohesion: 0.22
Nodes (14): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, OFFICE_FIX_PROMPT, OfficeFixResult, validateOfficeFix(), investigationReady(), InvestigationOptions, InvestigationReport (+6 more)

### Community 67 - "FeatureWorkspace.tsx"
Cohesion: 0.19
Nodes (14): FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures(), draftKey(), readDraft() (+6 more)

### Community 68 - "IntakeLedger"
Cohesion: 0.19
Nodes (11): newTask(), LIMITS, IntakeLedger, linkKey(), LinkResult, PublicReadPolicy, queueReconsideration(), readyReferences() (+3 more)

### Community 69 - "dependency-bots/adopt.ts"
Cohesion: 0.27
Nodes (15): closesIssue(), linkPR(), dependabotPR, adoptDependencyBot(), adoptOne(), DependencyBot, Guard, headGuard() (+7 more)

### Community 70 - "harnessEffect"
Cohesion: 0.21
Nodes (11): harnessEffect, readBackOrThrow(), linkedBody(), editorMatches(), relinkPinCourier(), sha(), MISSING_NATIVE_LINK, resumeLinkedDelivery() (+3 more)

### Community 71 - "source-amendment-scope.ts"
Cohesion: 0.26
Nodes (15): approvedText(), assert(), assert(), boundProfiles, canonical(), Document, ReadSourceFile, releaseAmendmentJournal() (+7 more)

### Community 72 - "it-specialist.ts"
Cohesion: 0.26
Nodes (11): ITContext, publishITReport(), delays, recoverAttempt(), itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps() (+3 more)

### Community 73 - "evidence.ts"
Cohesion: 0.20
Nodes (12): investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_SOURCE_PATHS, officeSource(), LaunchPolicy, launchPolicyFacts() (+4 more)

### Community 74 - "fact-bounds.ts"
Cohesion: 0.26
Nodes (15): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+7 more)

### Community 75 - "telemetry/report.ts"
Cohesion: 0.23
Nodes (15): validTicket(), telemetryRoute(), Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount() (+7 more)

### Community 76 - "slack-intake/config.ts"
Cohesion: 0.23
Nodes (12): exactly(), Message, nativeReadPayload(), pagination(), nativeFile(), Fields, PublicHosts, SlackAppId (+4 more)

### Community 77 - "Role"
Cohesion: 0.20
Nodes (11): readLocalIntakeReport(), file, project, root, DeliverySlot, officeCapacity, projectById(), projectData() (+3 more)

### Community 78 - "contract.ts"
Cohesion: 0.26
Nodes (9): At, Errno, GroupInventory, GroupProbe, Phase, Pid, groupInventory(), InventoryRunner (+1 more)

### Community 79 - "coordination-tick.ts"
Cohesion: 0.27
Nodes (9): brainCheckpointCompletion(), reconcileCompletedCheckpoints(), legacy, reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION, tick() (+1 more)

### Community 80 - "coordination.ts"
Cohesion: 0.26
Nodes (11): checkpointWindow(), dueAt(), hours, localDay(), ReviewResult, deferNonReady(), preparePR(), recheck() (+3 more)

### Community 81 - "DailyCTO.tsx"
Cohesion: 0.23
Nodes (9): CTOReview(), goalState, DailyCTO(), GoalHistory(), reportDate(), reviewStatus, reviewExcerpt(), ReviewText() (+1 more)

### Community 82 - "tracking-issue.ts"
Cohesion: 0.36
Nodes (10): ensureTrackingIssue(), findTrackingIssue(), ownTracking(), TrackingIssue, trackingIssueBody(), trackingIssueTitle(), trackingMarker(), centralCompanionHandoff() (+2 more)

### Community 83 - "work.ts"
Cohesion: 0.17
Nodes (11): AssignmentResult, CompletionCondition, Continuation, DeliveryAdmission, DependencyObservation, EligibilityState, FailureCategory, ReconciliationAction (+3 more)

### Community 84 - "blocker-followups.ts"
Cohesion: 0.47
Nodes (8): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), readBackConversations(), handoff(), reconcileBlockerFollowups(), BlockerFollowup

### Community 85 - "investigations/ledger.ts"
Cohesion: 0.51
Nodes (6): investigationCandidates(), investigationId(), investigationFollowUps(), investigationResolution(), syncInvestigations(), requeueInvestigationEvidence()

### Community 86 - "http/context.ts"
Cohesion: 0.31
Nodes (5): ITSpecialist, RequestContext, ServiceContext, runtimeRevision(), ServiceHealthChecks

### Community 87 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 88 - "recovery-ledger.ts"
Cohesion: 0.42
Nodes (6): savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), nativeDeliveryResolved(), reconcileRecoveryLedger()

### Community 89 - "checkpoint-completion.ts"
Cohesion: 0.28
Nodes (5): BrainStatusSchema, identity, coverageSchema, followupSchema, verified

### Community 90 - "checkpoint-retry.ts"
Cohesion: 0.39
Nodes (8): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation(), maintenanceSuperseded(), REOBSERVED

### Community 92 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 93 - "read-retries.ts"
Cohesion: 0.38
Nodes (6): incompleteReadOutput(), IntakeResult, planReadRetry(), reconcileReadRetries(), WorkFailure, ReadRetry

### Community 94 - "OfficeConfigView.tsx"
Cohesion: 0.48
Nodes (5): loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView(), OfficeConfigSummary

### Community 95 - "knowledge-sources.ts"
Cohesion: 0.33
Nodes (5): KnowledgeCadence, KnowledgeDestination, KnowledgeSourceKind, KnowledgeSourceState, SourceSubscription

### Community 96 - "documentText"
Cohesion: 0.47
Nodes (4): DocumentMetadata, documentText(), KnowledgeDocumentText, DocumentPreview()

### Community 97 - "extract-worker.mjs"
Cohesion: 0.70
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 98 - "highestStableAtLeast"
Cohesion: 0.83
Nodes (3): compare(), highestStableAtLeast(), parts()

### Community 100 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

## Knowledge Gaps
- **415 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+410 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `artifact`, `requests.ts`, `shared.ts`, `TicketJob`, `agents.ts`, `github-delivery.ts`, `knowledge/routes.ts`, `.save`, `features/workflow.ts`, `features.ts`, `admit-improvement.ts`, `run-accounting.ts`, `record-trigger.ts`, `workKey`, `digest`, `scheduled-captures.ts`, `worker-runtime.ts`, `knowledge.ts`, `.emit`, `delivery-recoveries.ts`, `run-retrospective.ts`, `SourceRegistry`, `conversations/conversations.ts`, `maintenance/maintenance.ts`, `cec/workflow.ts`, `sourceVisible`, `engine.ts`, `closeout-recovery.ts`, `ticket-evidence.ts`, `digest`, `slack-intake/run.ts`, `accept-stage-result.ts`, `session-bridge.ts`, `store.ts`, `azure.ts`, `schedule.ts`, `http/commands.ts`, `slack-intake/report.ts`, `offices.ts`, `time-scope.ts`, `lesson-selection.ts`, `cost-ledger.ts`, `jira-time.ts`, `preparation-readback.ts`, `.transaction`, `resume-provider-review.ts`, `scheduled-work.ts`, `scheduler.ts`, `assignment-poll.ts`, `remove-candidate.ts`, `outbox.ts`, `intake/admission.ts`, `investigations/run.ts`, `IntakeLedger`, `dependency-bots/adopt.ts`, `harnessEffect`, `it-specialist.ts`, `evidence.ts`, `telemetry/report.ts`, `slack-intake/config.ts`, `coordination-tick.ts`, `coordination.ts`, `tracking-issue.ts`, `blocker-followups.ts`, `investigations/ledger.ts`, `recovery-ledger.ts`, `checkpoint-completion.ts`, `read-retries.ts`?**
  _High betweenness centrality (0.133) - this node is a cross-community bridge._
- **Why does `Role` connect `Role` to `shared.ts`, `index.tsx`, `TicketJob`, `agents.ts`, `github-delivery.ts`, `run-accounting.ts`, `record-trigger.ts`, `cx`, `worker-runtime.ts`, `.emit`, `App.tsx`, `conversations/conversations.ts`, `maintenance/maintenance.ts`, `cec/workflow.ts`, `accept-stage-result.ts`, `store.ts`, `http/commands.ts`, `offices.ts`, `scheduled-work.ts`, `scheduler.ts`, `outbox.ts`, `work.ts`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `command()` connect `Store` to `requests.ts`, `shared.ts`, `TicketJob`, `agents.ts`, `github-delivery.ts`, `.save`, `features/workflow.ts`, `features.ts`, `admit-improvement.ts`, `digest`, `worker-runtime.ts`, `SourceRegistry`, `maintenance/maintenance.ts`, `cec/workflow.ts`, `engine.ts`, `closeout-recovery.ts`, `ticket-evidence.ts`, `digest`, `accept-stage-result.ts`, `session-bridge.ts`, `azure.ts`, `cost-ledger.ts`, `reader.ts`, `jira-time.ts`, `.transaction`, `resume-provider-review.ts`, `scheduled-work.ts`, `remove-candidate.ts`, `intake/admission.ts`, `harnessEffect`, `contract.ts`, `coordination.ts`, `http/context.ts`, `command-registry.ts`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `command()` (e.g. with `.constructor()` and `executeRequest()`) actually correct?**
  _`command()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _415 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `artifact` be split into smaller, more focused modules?**
  _Cohesion score 0.07405682347461574 - nodes in this community are weakly interconnected._
- **Should `requests.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.053211351755041075 - nodes in this community are weakly interconnected._