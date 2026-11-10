# Graph Report - the-office  (2026-11-10)

## Corpus Check
- 741 files · ~299,753 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3739 nodes · 16966 edges · 106 communities (102 shown, 4 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 100 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0ade8008`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- dependency-bots/adopt.ts
- record-trigger.ts
- App.tsx
- source-amendment-scope.ts
- command
- post-conflict-preparation.ts
- conversations/conversations.ts
- source-amendment.ts
- OfficeScene.tsx
- worker-runtime.ts
- index.tsx
- github-delivery.ts
- index.ts
- ticket-evidence.ts
- digest
- agents.ts
- Button
- harnessEffect
- mutedCopy
- .transaction
- engine.ts
- currentAssignment
- lesson-selection.ts
- constellation-runtime.ts
- SourceRegistry
- PeoplePanel.tsx
- work-summary.ts
- TelemetryPanel.tsx
- azure.ts
- maintenance/maintenance.ts
- TicketJob
- .emit
- features.ts
- features/workflow.ts
- enrollment-gate.ts
- policy.ts
- session-bridge.ts
- cec/issue-publication.ts
- goal-reviews.ts
- slack-intake/config.ts
- run-accounting.ts
- telemetry.ts
- cec/workflow.ts
- tracking-issue.ts
- github/issue-publication.ts
- http/commands.ts
- cost-ledger.ts
- process.ts
- run-retrospective.ts
- .get
- api-routes.ts
- it-specialist.ts
- digest
- park-ticket.ts
- workKey
- jira-time.ts
- WorkTime
- Coordinator
- service-health.ts
- knowledge/routes.ts
- recovery-ledger.ts
- local-config.ts
- assignment-poll.ts
- dependencies.ts
- remove-candidate.ts
- slack-intake/report.ts
- documentText
- goal-reporting.ts
- coordination.ts
- Goals.tsx
- weekly-rollup.ts
- artifact
- cost-totals.ts
- notifications.ts
- accept-stage-result.ts
- knowledge/learning-events.ts
- easternDay
- outbox.ts
- brain-followup.ts
- knowledge.ts
- .pump
- preferences-store.ts
- shared.ts
- Store
- evidence-digest.ts
- codex-rollout.ts
- slack-intake/run.ts
- telemetry/report.ts
- supersedingDelivery
- run-evidence.ts
- scheduled-captures.ts
- discovery-recovery.ts
- reader.ts
- work.ts
- extraction.ts
- knowledge-sources.ts
- SlackIntakeStatus.tsx
- command-registry.ts
- highestStableAtLeast
- extract-worker.mjs
- slack-supersession.ts
- helper-evidence.py
- .save
- offices.ts
- cli.ts

## God Nodes (most connected - your core abstractions)
1. `Store` - 339 edges
2. `TicketJob` - 144 edges
3. `GitHubDelivery` - 135 edges
4. `command()` - 108 edges
5. `digest()` - 105 edges
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

## Communities (106 total, 4 thin omitted)

### Community 0 - "dependency-bots/adopt.ts"
Cohesion: 0.18
Nodes (22): Execute, adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR, inPickupLane() (+14 more)

### Community 1 - "record-trigger.ts"
Cohesion: 0.10
Nodes (39): baselineLearning(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences(), clip(), maintenanceBlockedId(), MaintenanceCandidate (+31 more)

### Community 2 - "App.tsx"
Cohesion: 0.05
Nodes (40): themeColor, BrainWorkspace, CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants, ElevatorPhase, floorVariants (+32 more)

### Community 3 - "source-amendment-scope.ts"
Cohesion: 0.08
Nodes (39): approvedText(), assert(), assert(), normalize(), officialUrls, ReleaseCapture, verifyReleaseCaptures(), amendmentCaptureObservation() (+31 more)

### Community 4 - "command"
Cohesion: 0.07
Nodes (8): correlatedBuild(), JiraOperations, Engine, observe(), observeParked(), parkedReadError, command(), workerFailure()

### Community 5 - "post-conflict-preparation.ts"
Cohesion: 0.09
Nodes (57): candidateInput(), children, oldAdoptionBasis(), savedCandidateAdmission, assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence() (+49 more)

### Community 6 - "conversations/conversations.ts"
Cohesion: 0.12
Nodes (23): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+15 more)

### Community 7 - "source-amendment.ts"
Cohesion: 0.08
Nodes (63): stagePrompt(), StagePromptInput, METADATA_FINDING_GUIDANCE, adoptCandidate(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent() (+55 more)

### Community 8 - "OfficeScene.tsx"
Cohesion: 0.06
Nodes (54): itAgent(), itDiagnostics(), withoutElapsed(), CameraBookmark, restoreBookmark(), Avatar(), AzureWall(), Chair() (+46 more)

### Community 9 - "worker-runtime.ts"
Cohesion: 0.05
Nodes (52): SlackVerificationSchema, candidateWorkspaceEnvironment(), assignmentSubject(), dispatchExposure(), prepareExposure(), LessonSelection, assertRetainedDispatchScope(), LOCAL_BINDINGS (+44 more)

### Community 10 - "index.tsx"
Cohesion: 0.06
Nodes (72): Conversation(), Outbox(), SendMessage, slackMessageStatus(), SlackDeliveryCard(), currentServices(), ServiceHealthPanel(), labels (+64 more)

### Community 11 - "github-delivery.ts"
Cohesion: 0.06
Nodes (86): containedFile(), removeAdoptedClone(), findingsBlock(), namedRepairIds(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery() (+78 more)

### Community 12 - "index.ts"
Cohesion: 0.15
Nodes (21): close(), config, itSpecialist, loadedRevision, offices, releaseLock, server, serviceHealth (+13 more)

### Community 13 - "ticket-evidence.ts"
Cohesion: 0.18
Nodes (22): assetDownloader(), attachmentKind(), evidenceDirectory(), readEvidence(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS (+14 more)

### Community 14 - "digest"
Cohesion: 0.09
Nodes (52): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+44 more)

### Community 15 - "agents.ts"
Cohesion: 0.06
Nodes (45): cecPrompt(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), resolvedDecisionNote(), stageInstructions, cecChatPrompt() (+37 more)

### Community 16 - "Button"
Cohesion: 0.10
Nodes (33): KnowledgeCapturePage, KnowledgeActivityPage, Activity(), ActivityStatus(), AssignmentKnowledge(), CaptureReviewDetail(), CaptureReviews(), empty (+25 more)

### Community 17 - "harnessEffect"
Cohesion: 0.18
Nodes (23): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), projectCards(), statusField, harnessEffect (+15 more)

### Community 18 - "mutedCopy"
Cohesion: 0.12
Nodes (34): KnowledgeSourceSummary, AddPublicSource(), AddSourceForm(), SourceConnection, SourceCard(), Sources(), supported, UploadSource() (+26 more)

### Community 19 - ".transaction"
Cohesion: 0.18
Nodes (11): publishFeature(), reconcilePublication(), uncertainPublications(), GitHubOperations, fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), Assessment (+3 more)

### Community 20 - "engine.ts"
Cohesion: 0.14
Nodes (14): checkMail(), drainMail(), requestMail(), enableNightly(), MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), ingest() (+6 more)

### Community 21 - "currentAssignment"
Cohesion: 0.08
Nodes (65): harnessCloseout(), PASSING, verifyMergeActions(), activeEffectId(), assertMayMutate(), retryRead(), runHarnessStage(), harnessStageResult() (+57 more)

### Community 22 - "lesson-selection.ts"
Cohesion: 0.13
Nodes (24): knowledgeContext(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), MAINTENANCE, MAX_LESSONS (+16 more)

### Community 23 - "constellation-runtime.ts"
Cohesion: 0.08
Nodes (38): KnowledgeActivity, KnowledgeEdge, KnowledgeIntakeStatus, KnowledgeMap, KnowledgeNode, CameraPose, flightPose(), cameraTarget() (+30 more)

### Community 24 - "SourceRegistry"
Cohesion: 0.10
Nodes (30): KnowledgeRunner, captureProposal(), effectId(), CaptureReceipt, SlackReadAuthority, scheduledSlackIntake(), sourceWork(), collectionAllowed() (+22 more)

### Community 25 - "PeoplePanel.tsx"
Cohesion: 0.10
Nodes (40): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+32 more)

### Community 26 - "work-summary.ts"
Cohesion: 0.15
Nodes (26): App(), envelopeCard, deliveryRepairProjection(), DependencyNotice(), card, InboxQueue(), ACTIVE, maintenanceUpdate() (+18 more)

### Community 27 - "TelemetryPanel.tsx"
Cohesion: 0.08
Nodes (42): displayAgentTask(), githubStageLabels, LiveAgentTask(), Props, RunningTask(), text(), AzureBuild, BreakdownTable() (+34 more)

### Community 28 - "azure.ts"
Cohesion: 0.20
Nodes (14): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+6 more)

### Community 29 - "maintenance/maintenance.ts"
Cohesion: 0.09
Nodes (28): maintenancePolicies(), captureMaintenanceStep(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice(), candidateOwner() (+20 more)

### Community 30 - "TicketJob"
Cohesion: 0.07
Nodes (35): dependabotReviewGuidance(), StageContext, GitHubDelivery, stageRole(), checksFailed(), reconcileBoardPreflight(), implementationContinuationInstruction(), providerFacts() (+27 more)

### Community 31 - ".emit"
Cohesion: 0.14
Nodes (20): deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), metadataRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), deterministicActions (+12 more)

### Community 32 - "features.ts"
Cohesion: 0.08
Nodes (52): reviewQuestions(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), artifactPath(), digest(), document(), featureRoot() (+44 more)

### Community 33 - "features/workflow.ts"
Cohesion: 0.13
Nodes (20): approveFeature(), commandFeature(), createFeature(), featureById(), mutation(), discoveryPrompt(), planPrompt(), assertEnrollable() (+12 more)

### Community 34 - "enrollment-gate.ts"
Cohesion: 0.17
Nodes (24): dispatchNightly(), drainDelivery(), requestDelivery(), resume(), startPilot(), eligibility(), featureEffectGate(), assertFeatureGate() (+16 more)

### Community 35 - "policy.ts"
Cohesion: 0.15
Nodes (27): featureItemComplete(), reconcileFeatureCompletion(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS, reserveReplacement(), stageBudget(), classifyFeatureFailure() (+19 more)

### Community 36 - "session-bridge.ts"
Cohesion: 0.11
Nodes (27): claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexSessionContext(), readRollout, claudeSessions(), codexSessions() (+19 more)

### Community 37 - "cec/issue-publication.ts"
Cohesion: 0.23
Nodes (8): Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), plainDescription(), Transition, PublicationReceipt

### Community 38 - "goal-reviews.ts"
Cohesion: 0.14
Nodes (15): applyGoalReview(), EvidenceRefSchema, FreshDailyResultSchema, goalHistory(), statusAllowed(), workEvidence(), GoalInput, saveGoal() (+7 more)

### Community 39 - "slack-intake/config.ts"
Cohesion: 0.21
Nodes (15): Config, configDigest(), IntakeConfig, readConfig(), Fields, PublicHosts, SlackAppId, SlackChannel (+7 more)

### Community 40 - "run-accounting.ts"
Cohesion: 0.12
Nodes (30): BoundedRead, done(), readBoundedNoFollow(), reasonOf(), CompletionReader, codexHome(), createdAt(), dayDirs() (+22 more)

### Community 41 - "telemetry.ts"
Cohesion: 0.09
Nodes (30): CodexRollout, CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL (+22 more)

### Community 42 - "cec/workflow.ts"
Cohesion: 0.15
Nodes (31): parksInJira(), run(), advance(), nextStage(), publicationEvidenceGap(), qaEvidenceGap(), resultGate(), stageResultGap() (+23 more)

### Community 43 - "tracking-issue.ts"
Cohesion: 0.17
Nodes (21): ProjectCard, projectGraphql(), setCardStatus(), readBackOrThrow(), ensureReviewCards(), ensureTrackingIssue(), findTrackingIssue(), ownTracking() (+13 more)

### Community 44 - "github/issue-publication.ts"
Cohesion: 0.17
Nodes (10): FeaturePublisher, Assign, Board, Content, GitHubIssuePublisher, number(), same(), label() (+2 more)

### Community 45 - "http/commands.ts"
Cohesion: 0.15
Nodes (26): retryRecipientLookup(), enqueueMetadataRecovery(), normalizeStatement(), configureDigestDelivery(), DigestSettings, configureKnowledge(), declineLessonIssue(), demoteLesson() (+18 more)

### Community 46 - "cost-ledger.ts"
Cohesion: 0.18
Nodes (24): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId(), OutsideEdit (+16 more)

### Community 47 - "process.ts"
Cohesion: 0.05
Nodes (62): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+54 more)

### Community 48 - "run-retrospective.ts"
Cohesion: 0.08
Nodes (46): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, appendLearningFacts(), freezeLearningPacket(), ARTIFACT_LIMIT, clip(), LEDGER_STEPS (+38 more)

### Community 49 - ".get"
Cohesion: 0.16
Nodes (23): newTask(), recordObservation(), settlePage(), ChannelProgress, acceptProposals(), linkKey(), runSlackLinks(), queueReconsideration() (+15 more)

### Community 50 - "api-routes.ts"
Cohesion: 0.44
Nodes (6): eventVisible(), knowledgeOfficeState(), knowledgePromptStore(), deniedAssignments(), revokedSubjects(), projectReadiness()

### Community 51 - "it-specialist.ts"
Cohesion: 0.25
Nodes (11): ITContext, publishITReport(), delays, recoverAttempt(), itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps() (+3 more)

### Community 52 - "digest"
Cohesion: 0.17
Nodes (19): comparableSlackText(), uploadArtifact(), AuthoredDigest, reconcileDigestAuthorship(), unitAuthorship(), annotateAuthoredUnits(), independentIntakeResult(), reconcileAuthoredEvidence() (+11 more)

### Community 53 - "park-ticket.ts"
Cohesion: 0.18
Nodes (26): plain(), unpack(), BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue() (+18 more)

### Community 54 - "workKey"
Cohesion: 0.30
Nodes (9): completedPRReviews(), eligible(), mergedByOwner(), ownerSettles(), retireExternalDeliveries(), settledExternalRepair(), nativeDeliveryReadbackCandidate(), reconcileNativeDelivery() (+1 more)

### Community 55 - "jira-time.ts"
Cohesion: 0.16
Nodes (17): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+9 more)

### Community 56 - "WorkTime"
Cohesion: 0.19
Nodes (23): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), scopeSelector(), midnight(), TicketDay, ticketDayTotals(), captureTime(), timeLedger() (+15 more)

### Community 58 - "service-health.ts"
Cohesion: 0.13
Nodes (13): ITSpecialist, ROOT, RequestContext, ServiceContext, listenerHealth(), providers, ProviderStatusChecks, summary (+5 more)

### Community 59 - "knowledge/routes.ts"
Cohesion: 0.12
Nodes (46): intakeActivity(), knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), KnowledgeContext, independentDigestEvidence(), digestKnowledge(), prepareDigestBodies() (+38 more)

### Community 60 - "recovery-ledger.ts"
Cohesion: 0.28
Nodes (9): itChatPrompt(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), diagnosticContext(), diagnosticSnapshot(), nativeDeliveryResolved() (+1 more)

### Community 61 - "local-config.ts"
Cohesion: 0.33
Nodes (9): AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), FeaturePlanningBindings, OfficeConfigInputs, CECBinding, localBindings, assertModelOverrides(), ModelOverrides (+1 more)

### Community 62 - "assignment-poll.ts"
Cohesion: 0.19
Nodes (7): pinCourier, wikiSync, due(), unparkReleasedWaits(), poll(), readAssignments(), AssignedIssue

### Community 63 - "dependencies.ts"
Cohesion: 0.21
Nodes (20): Admission, admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, resumeParked(), compatible(), dependencyCompletionKey() (+12 more)

### Community 64 - "remove-candidate.ts"
Cohesion: 0.20
Nodes (16): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+8 more)

### Community 65 - "slack-intake/report.ts"
Cohesion: 0.19
Nodes (23): Proposal, isStoppingFor(), reconcileIntakeStatus(), intakeProgress(), terminalDeferred(), unitKey(), verifiedCapture(), LinkRecord (+15 more)

### Community 66 - "documentText"
Cohesion: 0.39
Nodes (5): guidanceExcerpt(), DocumentMetadata, documentText(), KnowledgeDocumentText, DocumentPreview()

### Community 67 - "goal-reporting.ts"
Cohesion: 0.13
Nodes (28): githubPRDescription(), collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB (+20 more)

### Community 68 - "coordination.ts"
Cohesion: 0.24
Nodes (13): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation(), maintenanceSuperseded(), REOBSERVED (+5 more)

### Community 69 - "Goals.tsx"
Cohesion: 0.08
Nodes (32): GoalProgress, FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures(), draftKey() (+24 more)

### Community 70 - "weekly-rollup.ts"
Cohesion: 0.14
Nodes (19): deliveryMetrics(), median(), learningMetrics(), lessonsNeedingReview(), RollupResult, RollupResultSchema, harperFolder(), RETROSPECTIVE_TIMEOUT (+11 more)

### Community 71 - "artifact"
Cohesion: 0.08
Nodes (66): boardPreflightCandidate(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal (+58 more)

### Community 72 - "cost-totals.ts"
Cohesion: 0.33
Nodes (9): isModelWork(), isTicketModelWork(), ScopePolicy, awaitingEvidence(), CaptureContext, inCostWindow(), TicketCost, ticketCosts() (+1 more)

### Community 73 - "notifications.ts"
Cohesion: 0.08
Nodes (38): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR (+30 more)

### Community 74 - "accept-stage-result.ts"
Cohesion: 0.12
Nodes (40): acceptStageResult(), METADATA_FINDING, mergeAuthorized(), allowed, continuationArtifacts(), continuationNativeReview(), continuationReviewArtifacts(), continuationWorkerProof() (+32 more)

### Community 75 - "knowledge/learning-events.ts"
Cohesion: 0.13
Nodes (20): retainedArtifactScope(), eventSourceBindings(), improvementIntakeGate(), learningDigest(), recordLearningOpportunity(), exposureBindings(), requestSourceBindings(), acceptedSourceBindings() (+12 more)

### Community 76 - "easternDay"
Cohesion: 0.08
Nodes (24): retryDelay(), mirror(), ResearchResult, runWeeklyResearch(), scheduledResearch(), DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts (+16 more)

### Community 77 - "outbox.ts"
Cohesion: 0.18
Nodes (18): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), projectOutbox(), readBackConversations(), handoff(), reconcileBlockerFollowups() (+10 more)

### Community 79 - "knowledge.ts"
Cohesion: 0.09
Nodes (33): AssignmentLookups, Binding, lookupInstructions(), lookupJournal, citations(), recordAcceptedKnowledge(), stageName(), knowledgeCitation() (+25 more)

### Community 81 - "preferences-store.ts"
Cohesion: 0.21
Nodes (9): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS (+1 more)

### Community 82 - "shared.ts"
Cohesion: 0.06
Nodes (43): ProjectReadiness, DailyCTOSummary, ProgressionItem, SchedulerState, recommendedReply(), loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState (+35 more)

### Community 83 - "Store"
Cohesion: 0.08
Nodes (30): helperTelemetry(), admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest() (+22 more)

### Community 84 - "evidence-digest.ts"
Cohesion: 0.44
Nodes (7): canonical(), evidenceDigest(), evidenceHash(), semantic(), stableUrl(), requirementDrift(), RequirementPostimage

### Community 85 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 86 - "slack-intake/run.ts"
Cohesion: 0.14
Nodes (27): IntakeResult, IntakeResultValue, LIMITS, Observation, ReadKind, ReadTask, SourceUnit, exactly() (+19 more)

### Community 87 - "telemetry/report.ts"
Cohesion: 0.29
Nodes (12): Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked(), row() (+4 more)

### Community 88 - "supersedingDelivery"
Cohesion: 0.28
Nodes (11): syncOutbox(), finishSupersededReadback(), projectSlackDeliveries(), settleRequestedSlackReplacement(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint() (+3 more)

### Community 89 - "run-evidence.ts"
Cohesion: 0.38
Nodes (5): comparable(), EvidenceOutcome, recordRunEvidence(), backfillClaudeCost(), RunAccounting

### Community 90 - "scheduled-captures.ts"
Cohesion: 0.13
Nodes (51): enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest, captureRequests(), failCapture(), requestCapture() (+43 more)

### Community 91 - "discovery-recovery.ts"
Cohesion: 0.12
Nodes (21): Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership, rawHash() (+13 more)

### Community 92 - "reader.ts"
Cohesion: 0.08
Nodes (21): captureAfter(), CaptureMetadata, capturePage(), cursor(), key(), captureIdentityMatches(), BrainCaptureReceipt, hash (+13 more)

### Community 93 - "work.ts"
Cohesion: 0.10
Nodes (24): reconcileNoticeConfirmations(), PrerequisitesSchema, legacy, reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION, tick() (+16 more)

### Community 94 - "extraction.ts"
Cohesion: 0.50
Nodes (4): createExtractor(), extractDocument, Extraction, Extractor

### Community 95 - "knowledge-sources.ts"
Cohesion: 0.25
Nodes (6): sourceList(), KnowledgeCadence, KnowledgeDestination, KnowledgeSourceKind, KnowledgeSourceState, SourceSubscription

### Community 96 - "SlackIntakeStatus.tsx"
Cohesion: 0.60
Nodes (4): format, labels, SlackIntakeStatus(), time()

### Community 97 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 98 - "highestStableAtLeast"
Cohesion: 0.83
Nodes (3): compare(), highestStableAtLeast(), parts()

### Community 103 - "extract-worker.mjs"
Cohesion: 0.70
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 104 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 108 - ".save"
Cohesion: 0.16
Nodes (8): file, folder, logs, root, xml(), MergeNotifications, ProjectProgress, sendDigestNotice()

### Community 112 - "offices.ts"
Cohesion: 0.13
Nodes (19): ROLES, leadershipContext(), leadershipEntries(), knowledgeEntries(), privateFile(), readLocalIntakeReport(), readIntakeReport(), DELIVERY_CONCURRENCY (+11 more)

### Community 114 - "cli.ts"
Cohesion: 0.25
Nodes (6): args, [cmd,...rawArgs], commands, key, projectIndex, PORT

## Knowledge Gaps
- **410 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+405 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `dependency-bots/adopt.ts`, `record-trigger.ts`, `command`, `post-conflict-preparation.ts`, `conversations/conversations.ts`, `source-amendment.ts`, `worker-runtime.ts`, `github-delivery.ts`, `index.ts`, `ticket-evidence.ts`, `digest`, `agents.ts`, `harnessEffect`, `.transaction`, `engine.ts`, `currentAssignment`, `lesson-selection.ts`, `SourceRegistry`, `azure.ts`, `maintenance/maintenance.ts`, `TicketJob`, `.emit`, `features.ts`, `features/workflow.ts`, `enrollment-gate.ts`, `policy.ts`, `session-bridge.ts`, `cec/issue-publication.ts`, `goal-reviews.ts`, `slack-intake/config.ts`, `run-accounting.ts`, `cec/workflow.ts`, `tracking-issue.ts`, `github/issue-publication.ts`, `http/commands.ts`, `cost-ledger.ts`, `process.ts`, `run-retrospective.ts`, `api-routes.ts`, `it-specialist.ts`, `digest`, `park-ticket.ts`, `workKey`, `jira-time.ts`, `WorkTime`, `Coordinator`, `knowledge/routes.ts`, `recovery-ledger.ts`, `dependencies.ts`, `remove-candidate.ts`, `slack-intake/report.ts`, `goal-reporting.ts`, `coordination.ts`, `weekly-rollup.ts`, `artifact`, `notifications.ts`, `accept-stage-result.ts`, `knowledge/learning-events.ts`, `easternDay`, `outbox.ts`, `brain-followup.ts`, `knowledge.ts`, `shared.ts`, `slack-intake/run.ts`, `supersedingDelivery`, `run-evidence.ts`, `scheduled-captures.ts`, `discovery-recovery.ts`, `work.ts`, `.save`, `offices.ts`?**
  _High betweenness centrality (0.134) - this node is a cross-community bridge._
- **Why does `Engine` connect `command` to `conversations/conversations.ts`, `github-delivery.ts`, `digest`, `agents.ts`, `.transaction`, `engine.ts`, `azure.ts`, `maintenance/maintenance.ts`, `.emit`, `features/workflow.ts`, `enrollment-gate.ts`, `cec/workflow.ts`, `Coordinator`, `coordination.ts`, `notifications.ts`, `brain-followup.ts`, `scheduled-captures.ts`, `.save`, `offices.ts`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `Role` connect `worker-runtime.ts` to `App.tsx`, `conversations/conversations.ts`, `OfficeScene.tsx`, `index.tsx`, `github-delivery.ts`, `agents.ts`, `PeoplePanel.tsx`, `maintenance/maintenance.ts`, `TicketJob`, `.emit`, `run-accounting.ts`, `cec/workflow.ts`, `http/commands.ts`, `process.ts`, `run-retrospective.ts`, `accept-stage-result.ts`, `knowledge/learning-events.ts`, `outbox.ts`, `shared.ts`, `Store`, `work.ts`, `offices.ts`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `command()` (e.g. with `.constructor()` and `executeRequest()`) actually correct?**
  _`command()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _410 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `record-trigger.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09951690821256039 - nodes in this community are weakly interconnected._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0549645390070922 - nodes in this community are weakly interconnected._