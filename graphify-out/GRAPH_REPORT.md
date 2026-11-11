# Graph Report - office-ownership-integration  (2026-11-10)

## Corpus Check
- 767 files · ~305,405 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3831 nodes · 17491 edges · 102 communities (100 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 104 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `31e78860`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- dependency-bots/adopt.ts
- artifact
- coordination.ts
- index.tsx
- cec/workflow.ts
- accept-stage-result.ts
- workKey
- knowledge/routes.ts
- hasUncertainEffects
- github-delivery.ts
- source-amendment.ts
- OfficeScene.tsx
- features/workflow.ts
- shared.ts
- record-trigger.ts
- Button
- post-conflict-preparation.ts
- scheduled-captures.ts
- Store
- worker-runtime.ts
- constellation-runtime.ts
- digest
- knowledge.ts
- store.ts
- notifications.ts
- SourceRegistry
- conversations/conversations.ts
- slack-intake/run.ts
- requests.ts
- run-retrospective.ts
- PeoplePanel.tsx
- mutedCopy
- agents.ts
- easternDay
- TelemetryPanel.tsx
- .emit
- investigations/run.ts
- session-bridge.ts
- digest
- api-routes.ts
- App.tsx
- http/commands.ts
- work-summary.ts
- engine.ts
- reader.ts
- schedule.ts
- slack-intake/report.ts
- command
- features.ts
- delivery-repairs.ts
- cost-ledger.ts
- featureById
- cec/issue-publication.ts
- useOfficePreferences.ts
- assignments.ts
- azure.ts
- ticket-evidence.ts
- scheduled-work.ts
- telemetry.ts
- scheduler.ts
- lesson-selection.ts
- remove-candidate.ts
- features/commands.ts
- fact-bounds.ts
- time-scope.ts
- index.ts
- .getEffect
- WorkTime
- admit-improvement.ts
- service-health.ts
- jira-time.ts
- offices.ts
- process.ts
- it-specialist.ts
- slack-intake/config.ts
- run-accounting.ts
- blocker-followups.ts
- goal-reviews.ts
- local-config.ts
- helperTelemetry
- .pump
- DailyCTO.tsx
- .value
- github.ts
- work.ts
- cost-totals.ts
- evidence-artifacts.ts
- create-candidate.ts
- command-registry.ts
- QuestionDialogHost.tsx
- candidate-child-context.ts
- checkpoint-completion.ts
- codex-rollout.ts
- owned-artifact.ts
- run-usage.ts
- codex-rollout-file.ts
- liveReach
- ITFollowUps.tsx
- extract-worker.mjs
- slack-supersession.ts
- helper-evidence.py

## God Nodes (most connected - your core abstractions)
1. `Store` - 352 edges
2. `TicketJob` - 147 edges
3. `GitHubDelivery` - 133 edges
4. `command()` - 108 edges
5. `digest()` - 107 edges
6. `artifact()` - 98 edges
7. `workKey()` - 91 edges
8. `cx()` - 88 edges
9. `currentAssignment()` - 74 edges
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

## Communities (102 total, 2 thin omitted)

### Community 0 - "dependency-bots/adopt.ts"
Cohesion: 0.06
Nodes (81): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard, projectCards() (+73 more)

### Community 1 - "artifact"
Cohesion: 0.07
Nodes (89): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+81 more)

### Community 2 - "coordination.ts"
Cohesion: 0.05
Nodes (58): Admission, admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, resumeParked(), compatible(), dependencyCompletionKey() (+50 more)

### Community 3 - "index.tsx"
Cohesion: 0.06
Nodes (74): Conversation(), Outbox(), SendMessage, slackMessageStatus(), SlackDeliveryCard(), currentServices(), ServiceHealthPanel(), labels (+66 more)

### Community 4 - "cec/workflow.ts"
Cohesion: 0.05
Nodes (62): checkMail(), drainMail(), requestMail(), parksInJira(), MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), run() (+54 more)

### Community 5 - "accept-stage-result.ts"
Cohesion: 0.07
Nodes (60): containedFile(), findingsBlock(), deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, requireDeliveryAuthority(), deliveryIntakeBlocker() (+52 more)

### Community 6 - "workKey"
Cohesion: 0.07
Nodes (63): continuationScope(), continuationWorktree(), continuationGuard(), Assessment, diagnosticProof(), discoveryRecoveryCandidate(), ownedArtifact(), Ownership (+55 more)

### Community 7 - "knowledge/routes.ts"
Cohesion: 0.10
Nodes (50): intakeActivity(), knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), guidanceExcerpt(), KnowledgeContext, independentDigestEvidence(), digestKnowledge() (+42 more)

### Community 8 - "hasUncertainEffects"
Cohesion: 0.07
Nodes (53): queueMergeNotice(), observeGitHubMergeNotices(), hasUncertainEffects(), observe(), checksFailed(), checksPassed(), checksPending(), CurrentChecksWait (+45 more)

### Community 9 - "github-delivery.ts"
Cohesion: 0.06
Nodes (41): installDependencies(), harnessCloseout(), PASSING, verifyMergeActions(), HarnessControl, withHarnessWork(), runHarnessStage(), BOARD_RULE (+33 more)

### Community 10 - "source-amendment.ts"
Cohesion: 0.06
Nodes (66): DeliveryTaskInput, DISCOVERY_GUIDANCE, adoptCandidate(), approvedText(), assert(), AMENDMENT_REVIEW_PROOF, amendmentIssueSha256(), authorizeSourceAmendment() (+58 more)

### Community 11 - "OfficeScene.tsx"
Cohesion: 0.06
Nodes (60): itAgent(), itDiagnostics(), displayAgentTask(), githubStageLabels, withoutElapsed(), CameraBookmark, restoreBookmark(), LiveAgentTask() (+52 more)

### Community 12 - "features/workflow.ts"
Cohesion: 0.08
Nodes (47): approveFeature(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), discoveryPrompt(), planPrompt(), artifactPath() (+39 more)

### Community 13 - "shared.ts"
Cohesion: 0.05
Nodes (50): listenerHealth(), ProjectReadiness, DailyCTOSummary, GoalProgress, ProgressionItem, SchedulerState, recommendedReply(), FeatureDelivery() (+42 more)

### Community 14 - "record-trigger.ts"
Cohesion: 0.07
Nodes (55): deliveryMetrics(), median(), baselineLearning(), LEARNING_BASELINES, maintainLearning(), maintenanceSubject(), MaintenanceSubjectFacts, busyMaintenanceIds() (+47 more)

### Community 15 - "Button"
Cohesion: 0.09
Nodes (39): KnowledgeCapture, KnowledgeCapturePage, KnowledgeHit, KnowledgeReference, KnowledgeActivityPage, Activity(), ActivityStatus(), AssignmentKnowledge() (+31 more)

### Community 16 - "post-conflict-preparation.ts"
Cohesion: 0.09
Nodes (54): assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), reconcileCompletedConflictDraft(), routeReadyPostConflictPublication(), verifyInitialDraftConflictPreparation() (+46 more)

### Community 17 - "scheduled-captures.ts"
Cohesion: 0.15
Nodes (49): createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest, captureRequests() (+41 more)

### Community 18 - "Store"
Cohesion: 0.09
Nodes (36): featureItemComplete(), reconcileFeatureCompletion(), ProviderEvidence, DELAYS, MAX_EXECUTIONS, MAX_REPLANS, requestReplan(), reserveReplacement() (+28 more)

### Community 19 - "worker-runtime.ts"
Cohesion: 0.07
Nodes (42): candidateWorkspaceEnvironment(), LOCAL_BINDINGS, contextPacket(), DeliverySlot, officeCapacity, CODEX_DEFAULT_EFFORT, CODEX_DEFAULT_MODEL, CODEX_EFFORTS (+34 more)

### Community 20 - "constellation-runtime.ts"
Cohesion: 0.07
Nodes (41): KnowledgeActivity, KnowledgeEdge, KnowledgeIntakeStatus, KnowledgeMap, KnowledgeNode, CameraPose, flightPose(), cameraTarget() (+33 more)

### Community 21 - "digest"
Cohesion: 0.13
Nodes (46): activeEffectId(), admitPRMetadata(), assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema, savedMetadataAssessment(), validateSaved() (+38 more)

### Community 22 - "knowledge.ts"
Cohesion: 0.06
Nodes (51): expireLearningPackets(), packetReferences(), learningMetrics(), lessonsNeedingReview(), publicTopicSafe(), researchTopics(), TEMPLATES, Kind (+43 more)

### Community 23 - "store.ts"
Cohesion: 0.10
Nodes (41): BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue(), readIssues(), commentDecision() (+33 more)

### Community 24 - "notifications.ts"
Cohesion: 0.08
Nodes (35): channelNoticeAuthorized(), notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR, plainSlackText(), section() (+27 more)

### Community 25 - "SourceRegistry"
Cohesion: 0.08
Nodes (30): Config, configDigest(), IntakeConfig, readConfig(), Command, sourceCommand(), configDigestForSeed(), copyRecords() (+22 more)

### Community 26 - "conversations/conversations.ts"
Cohesion: 0.09
Nodes (34): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, ReplySchema, pumpCTO(), queueCTOHandoff(), saveGoals() (+26 more)

### Community 27 - "slack-intake/run.ts"
Cohesion: 0.11
Nodes (36): independentIntakeResult(), captureProposal(), effectId(), newTask(), recordObservation(), settlePage(), ChannelProgress, Observation (+28 more)

### Community 28 - "requests.ts"
Cohesion: 0.11
Nodes (46): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+38 more)

### Community 29 - "run-retrospective.ts"
Cohesion: 0.09
Nodes (38): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, improvementIntakeGate(), captureLearning(), learningDigest(), recordLearningOpportunity(), appendLearningFacts() (+30 more)

### Community 30 - "PeoplePanel.tsx"
Cohesion: 0.09
Nodes (42): label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+34 more)

### Community 31 - "mutedCopy"
Cohesion: 0.12
Nodes (34): KnowledgeSourceSummary, AddPublicSource(), AddSourceForm(), SourceConnection, SourceCard(), Sources(), supported, UploadSource() (+26 more)

### Community 32 - "agents.ts"
Cohesion: 0.07
Nodes (31): cecPrompt(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), resolvedDecisionNote(), stageInstructions, ctoChatPrompt() (+23 more)

### Community 33 - "easternDay"
Cohesion: 0.10
Nodes (23): retryDelay(), mirror(), ResearchResult, runWeeklyResearch(), scheduledResearch(), DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts (+15 more)

### Community 34 - "TelemetryPanel.tsx"
Cohesion: 0.09
Nodes (38): TelemetryReport, AzureBuild, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens(), usd() (+30 more)

### Community 35 - ".emit"
Cohesion: 0.10
Nodes (29): MessageInput, reconcileNoticeConfirmations(), conversationResolved(), projectOutbox(), syncOutbox(), projectSlackDeliveries(), settleRequestedSlackReplacement(), Input (+21 more)

### Community 36 - "investigations/run.ts"
Cohesion: 0.12
Nodes (28): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationCandidates(), investigationId(), investigationEvidence(), investigationFollowUps(), INVOCATION_SOURCE_REFS, invocationSource() (+20 more)

### Community 37 - "session-bridge.ts"
Cohesion: 0.10
Nodes (28): claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexSessionContext(), readRollout, claudeSessions(), codexSessions() (+20 more)

### Community 38 - "digest"
Cohesion: 0.18
Nodes (23): comparableSlackText(), uploadArtifact(), AuthoredDigest, reconcileDigestAuthorship(), unitAuthorship(), annotateAuthoredUnits(), reconcileAuthoredEvidence(), digest() (+15 more)

### Community 39 - "api-routes.ts"
Cohesion: 0.13
Nodes (24): assertAssessmentVisibility(), assertQuestionVisibility(), pendingQuestions(), retainedArtifactScope(), eventSourceBindings(), eventVisible(), assignmentSubject(), LessonSelection (+16 more)

### Community 40 - "App.tsx"
Cohesion: 0.06
Nodes (33): BrainDrawer(), themeColor, BrainWorkspace, CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants, ElevatorPhase (+25 more)

### Community 41 - "http/commands.ts"
Cohesion: 0.13
Nodes (29): ChannelSettings, configureChannelNotices(), configureNotices(), NoticeSettings, retryRecipientLookup(), bindDiscoveryResume(), DiscoveryResumeInput, normalizeStatement() (+21 more)

### Community 42 - "work-summary.ts"
Cohesion: 0.14
Nodes (28): compactSteps(), App(), interactive, deliveryRepairProjection(), DependencyNotice(), card, InboxQueue(), ACTIVE (+20 more)

### Community 43 - "engine.ts"
Cohesion: 0.16
Nodes (28): dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), resume(), startPilot(), eligibility(), approvedDelivery() (+20 more)

### Community 44 - "reader.ts"
Cohesion: 0.08
Nodes (20): captureAfter(), CaptureMetadata, capturePage(), cursor(), key(), captureIdentityMatches(), BrainCaptureReceipt, hash (+12 more)

### Community 45 - "schedule.ts"
Cohesion: 0.14
Nodes (19): KnowledgeRunner, LIMITS, SlackReadAuthority, linkKey(), LinkResult, PublicReadPolicy, runSlackLinks(), retrySlackIntake() (+11 more)

### Community 46 - "slack-intake/report.ts"
Cohesion: 0.17
Nodes (26): Proposal, ReadTask, isStoppingFor(), reconcileIntakeStatus(), intakeProgress(), terminalDeferred(), unitKey(), verifiedCapture() (+18 more)

### Community 47 - "command"
Cohesion: 0.07
Nodes (9): correlatedBuild(), JiraOperations, plain(), Engine, observe(), observeParked(), parkedReadError, command() (+1 more)

### Community 48 - "features.ts"
Cohesion: 0.11
Nodes (28): normalizeRound(), FeatureApproval, FeatureAttempt, FeatureAuthority, FeatureBaseline, FeatureDocument, FeatureHandoff, FeatureHarnessAction (+20 more)

### Community 49 - "delivery-repairs.ts"
Cohesion: 0.17
Nodes (22): removeAdoptedClone(), namedRepairIds(), adoptedReviewCandidate(), ciCheckout(), finishCISetup(), verifyCIHooks(), CIFailure, guardCIRepair() (+14 more)

### Community 50 - "cost-ledger.ts"
Cohesion: 0.16
Nodes (26): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId(), OutsideEdit (+18 more)

### Community 51 - "featureById"
Cohesion: 0.15
Nodes (13): featureById(), Link, linkFeature(), FeaturePublisher, publishFeature(), reconcilePublication(), uncertainPublications(), reserveIdentity() (+5 more)

### Community 52 - "cec/issue-publication.ts"
Cohesion: 0.20
Nodes (10): Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), plainDescription(), Transition, unpack() (+2 more)

### Community 53 - "useOfficePreferences.ts"
Cohesion: 0.11
Nodes (21): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, acceptPreferences(), PreferenceCandidate (+13 more)

### Community 54 - "assignments.ts"
Cohesion: 0.14
Nodes (16): AssignmentLookups, Binding, lookupInstructions(), decodeLookupJournal(), lookupJournal, readLookupJournal(), boundEvidence(), taskBriefing() (+8 more)

### Community 55 - "azure.ts"
Cohesion: 0.15
Nodes (21): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+13 more)

### Community 56 - "ticket-evidence.ts"
Cohesion: 0.18
Nodes (20): assetDownloader(), attachmentKind(), blankEvidence(), CoverageState, EVIDENCE_LIMITS, EvidenceAttachment, EvidenceReadContext, EvidenceSection (+12 more)

### Community 57 - "scheduled-work.ts"
Cohesion: 0.15
Nodes (19): deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), metadataRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), deterministicActions (+11 more)

### Community 58 - "telemetry.ts"
Cohesion: 0.12
Nodes (22): CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL, Rates (+14 more)

### Community 59 - "scheduler.ts"
Cohesion: 0.18
Nodes (12): ROLES, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch(), deliveryOccupied() (+4 more)

### Community 60 - "lesson-selection.ts"
Cohesion: 0.16
Nodes (20): knowledgeContext(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), MAINTENANCE, MAX_LESSONS (+12 more)

### Community 61 - "remove-candidate.ts"
Cohesion: 0.20
Nodes (17): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+9 more)

### Community 62 - "features/commands.ts"
Cohesion: 0.26
Nodes (15): commandFeature(), reviewQuestions(), GitHubFeaturePublisher, applyHarnessAction(), HarnessActionInput, recoveryPreconditions(), recoveryTarget(), canReleaseOrdinary() (+7 more)

### Community 63 - "fact-bounds.ts"
Cohesion: 0.16
Nodes (21): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+13 more)

### Community 64 - "time-scope.ts"
Cohesion: 0.21
Nodes (20): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), scopeSelector(), midnight(), TicketDay, ticketDayTotals(), captureTime(), timeLedger() (+12 more)

### Community 65 - "index.ts"
Cohesion: 0.10
Nodes (19): args, [cmd,...rawArgs], commands, key, projectIndex, close(), config, itSpecialist (+11 more)

### Community 66 - ".getEffect"
Cohesion: 0.22
Nodes (8): GitHubOperations, fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), Assessment, closeNativeRefresh(), fingerprint(), EffectIntent

### Community 67 - "WorkTime"
Cohesion: 0.16
Nodes (20): TelemetrySync, ConfirmedSegment, LiveAnchor, ObservationGap, SnapshotOrdering, TimeLedgerState, WorkTime, Acc (+12 more)

### Community 68 - "admit-improvement.ts"
Cohesion: 0.22
Nodes (14): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+6 more)

### Community 69 - "service-health.ts"
Cohesion: 0.15
Nodes (10): ITSpecialist, RequestContext, ServiceContext, providers, ProviderStatusChecks, summary, runtimeRevision(), Probe (+2 more)

### Community 70 - "jira-time.ts"
Cohesion: 0.21
Nodes (13): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+5 more)

### Community 71 - "offices.ts"
Cohesion: 0.18
Nodes (13): leadershipContext(), leadershipEntries(), knowledgeEntries(), privateFile(), readLocalIntakeReport(), readIntakeReport(), fanoutSourceLearning(), file (+5 more)

### Community 72 - "process.ts"
Cohesion: 0.23
Nodes (12): At, Errno, GroupInventory, GroupProbe, LifecycleDiagnostic, Phase, Pid, groupInventory() (+4 more)

### Community 73 - "it-specialist.ts"
Cohesion: 0.26
Nodes (12): savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), ITContext, publishITReport(), delays, recoverAttempt() (+4 more)

### Community 74 - "slack-intake/config.ts"
Cohesion: 0.23
Nodes (12): exactly(), Message, nativeReadPayload(), pagination(), nativeFile(), Fields, PublicHosts, SlackAppId (+4 more)

### Community 75 - "run-accounting.ts"
Cohesion: 0.20
Nodes (14): BoundedRead, CompletionReader, readCodexRollout(), codexAccounting(), COMPLETION_MAX_BYTES, merge(), readCompletion(), reconcileUncapturedRuns() (+6 more)

### Community 76 - "blocker-followups.ts"
Cohesion: 0.33
Nodes (9): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), readBackConversations(), diagnosticContext(), diagnosticSnapshot(), nativeDeliveryResolved(), handoff() (+1 more)

### Community 77 - "goal-reviews.ts"
Cohesion: 0.22
Nodes (10): applyGoalReview(), EvidenceRefSchema, FreshDailyResultSchema, statusAllowed(), workEvidence(), GoalInput, saveGoal(), queueGoalNotice() (+2 more)

### Community 78 - "local-config.ts"
Cohesion: 0.28
Nodes (11): AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), FeaturePlanningBindings, OfficeConfigInputs, officeConfigRoute(), officeConfigSummary(), CECBinding, localBindings (+3 more)

### Community 79 - "helperTelemetry"
Cohesion: 0.26
Nodes (10): helperTelemetry(), dispatchExposure(), backfillClaudeCost(), codexHome(), HELPER_STDOUT_MAX_BYTES, helperAccounting(), claudeAccounting(), completionAccounting() (+2 more)

### Community 81 - "DailyCTO.tsx"
Cohesion: 0.23
Nodes (9): CTOReview(), goalState, DailyCTO(), GoalHistory(), reportDate(), reviewStatus, reviewExcerpt(), ReviewText() (+1 more)

### Community 82 - ".value"
Cohesion: 0.24
Nodes (6): file, folder, logs, root, xml(), ProjectProgress

### Community 83 - "github.ts"
Cohesion: 0.26
Nodes (6): GitHubMonitor, githubPRDescription(), GOAL_EVIDENCE_LIMITS, GitHubBoard, GitHubPR, GitHubState

### Community 84 - "work.ts"
Cohesion: 0.17
Nodes (10): AssignmentResult, CompletionCondition, DeliveryAdmission, DependencyObservation, EligibilityState, ExecutionLane, FailureCategory, ReconciliationAction (+2 more)

### Community 85 - "cost-totals.ts"
Cohesion: 0.29
Nodes (10): isModelWork(), isTicketModelWork(), ScopePolicy, awaitingEvidence(), boardUsd(), CaptureContext, inCostWindow(), TicketCost (+2 more)

### Community 86 - "evidence-artifacts.ts"
Cohesion: 0.38
Nodes (9): evidenceDirectory(), readEvidence(), storeEvidence(), canonical(), evidenceDigest(), evidenceHash(), semantic(), stableUrl() (+1 more)

### Community 87 - "create-candidate.ts"
Cohesion: 0.29
Nodes (8): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, major()

### Community 88 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 89 - "QuestionDialogHost.tsx"
Cohesion: 0.44
Nodes (7): FeatureQuestionProjection, nextQuestion(), orderedQuestions(), questionKey(), QuestionDialogHost(), readSuppressed(), Dialog()

### Community 90 - "candidate-child-context.ts"
Cohesion: 0.39
Nodes (7): reported, Scope, advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat()

### Community 91 - "checkpoint-completion.ts"
Cohesion: 0.31
Nodes (6): BrainStatusSchema, brainCheckpointCompletion(), coverageSchema, followupSchema, verified, reconcileCompletedCheckpoints()

### Community 92 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 93 - "owned-artifact.ts"
Cohesion: 0.54
Nodes (6): ghLogCacheEvidence(), done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf()

### Community 94 - "run-usage.ts"
Cohesion: 0.38
Nodes (5): CodexRollout, claudeCrashZero(), claudeUsage(), count(), RunUsage

### Community 95 - "codex-rollout-file.ts"
Cohesion: 0.43
Nodes (6): createdAt(), dayDirs(), header(), ROLLOUT_MAX_BYTES, RolloutScan, scanCodexRollouts()

### Community 96 - "liveReach"
Cohesion: 0.60
Nodes (5): GIT_NETWORK, LIVE_PROVIDERS, liveReach(), networkUrl(), remoteUrls()

### Community 97 - "ITFollowUps.tsx"
Cohesion: 0.67
Nodes (4): itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps()

### Community 98 - "extract-worker.mjs"
Cohesion: 0.70
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 99 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

## Knowledge Gaps
- **418 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+413 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `dependency-bots/adopt.ts`, `artifact`, `coordination.ts`, `cec/workflow.ts`, `accept-stage-result.ts`, `workKey`, `knowledge/routes.ts`, `hasUncertainEffects`, `github-delivery.ts`, `source-amendment.ts`, `features/workflow.ts`, `shared.ts`, `record-trigger.ts`, `post-conflict-preparation.ts`, `scheduled-captures.ts`, `worker-runtime.ts`, `digest`, `knowledge.ts`, `store.ts`, `notifications.ts`, `SourceRegistry`, `conversations/conversations.ts`, `slack-intake/run.ts`, `requests.ts`, `run-retrospective.ts`, `agents.ts`, `easternDay`, `.emit`, `investigations/run.ts`, `session-bridge.ts`, `digest`, `api-routes.ts`, `http/commands.ts`, `engine.ts`, `schedule.ts`, `slack-intake/report.ts`, `command`, `delivery-repairs.ts`, `cost-ledger.ts`, `featureById`, `cec/issue-publication.ts`, `assignments.ts`, `azure.ts`, `ticket-evidence.ts`, `scheduled-work.ts`, `scheduler.ts`, `lesson-selection.ts`, `remove-candidate.ts`, `features/commands.ts`, `time-scope.ts`, `.getEffect`, `admit-improvement.ts`, `jira-time.ts`, `offices.ts`, `it-specialist.ts`, `slack-intake/config.ts`, `run-accounting.ts`, `blocker-followups.ts`, `goal-reviews.ts`, `helperTelemetry`, `.value`, `github.ts`, `evidence-artifacts.ts`, `create-candidate.ts`, `candidate-child-context.ts`, `checkpoint-completion.ts`?**
  _High betweenness centrality (0.150) - this node is a cross-community bridge._
- **Why does `OfficeSnapshot` connect `shared.ts` to `index.tsx`, `cec/workflow.ts`, `OfficeScene.tsx`, `record-trigger.ts`, `Button`, `Store`, `store.ts`, `PeoplePanel.tsx`, `mutedCopy`, `TelemetryPanel.tsx`, `.emit`, `investigations/run.ts`, `api-routes.ts`, `App.tsx`, `work-summary.ts`, `useOfficePreferences.ts`, `azure.ts`, `service-health.ts`, `DailyCTO.tsx`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `command()` connect `command` to `dependency-bots/adopt.ts`, `coordination.ts`, `cec/workflow.ts`, `accept-stage-result.ts`, `workKey`, `hasUncertainEffects`, `github-delivery.ts`, `features/workflow.ts`, `Store`, `worker-runtime.ts`, `digest`, `store.ts`, `notifications.ts`, `requests.ts`, `agents.ts`, `session-bridge.ts`, `digest`, `engine.ts`, `reader.ts`, `delivery-repairs.ts`, `cost-ledger.ts`, `featureById`, `cec/issue-publication.ts`, `azure.ts`, `ticket-evidence.ts`, `scheduled-work.ts`, `remove-candidate.ts`, `features/commands.ts`, `.getEffect`, `admit-improvement.ts`, `service-health.ts`, `jira-time.ts`, `process.ts`, `.value`, `github.ts`, `create-candidate.ts`, `command-registry.ts`, `liveReach`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `command()` (e.g. with `.constructor()` and `executeRequest()`) actually correct?**
  _`command()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _418 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dependency-bots/adopt.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05512035322603618 - nodes in this community are weakly interconnected._
- **Should `artifact` be split into smaller, more focused modules?**
  _Cohesion score 0.07234432234432235 - nodes in this community are weakly interconnected._