# Graph Report - the-office  (2026-11-10)

## Corpus Check
- 763 files · ~303,014 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3813 nodes · 17381 edges · 105 communities (103 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 104 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c0e4387f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- dependency-bots/adopt.ts
- retrospective-triggers.ts
- App.tsx
- source-amendment-scope.ts
- Engine
- post-conflict-preparation.ts
- conversations/conversations.ts
- source-amendment.ts
- OfficeScene.tsx
- model-routes.ts
- index.tsx
- queue-repairs.ts
- index.ts
- ticket-evidence.ts
- requests.ts
- agents.ts
- Button
- github/issue-publication.ts
- mutedCopy
- features.ts
- work-summary.ts
- digest
- api-routes.ts
- constellation-runtime.ts
- SourceRegistry
- PeoplePanel.tsx
- delivery-repairs.ts
- TelemetryPanel.tsx
- azure.ts
- maintenance/maintenance.ts
- TicketJob
- features/commands.ts
- process.ts
- featureById
- engine.ts
- office/config.ts
- session-bridge.ts
- cec/issue-publication.ts
- retrospective-subject.ts
- slack-intake/config.ts
- run-accounting.ts
- telemetry.ts
- admit-improvement.ts
- harnessEffect
- GitHubIssuePublisher
- .emit
- scheduled-work.ts
- investigations/run.ts
- run-retrospective.ts
- slack-intake/run.ts
- contract.ts
- blocker-followups.ts
- digest
- .save
- workKey
- jira-time.ts
- time-scope.ts
- Coordinator
- record-trigger.ts
- knowledge/routes.ts
- brain-maintenance.ts
- cec/workflow.ts
- highestStableAtLeast
- dependencies.ts
- assignment-poll.ts
- slack-intake/report.ts
- useOfficePreferences.ts
- fact-bounds.ts
- coordination.ts
- OfficeSnapshot
- weekly-rollup.ts
- artifact
- Store
- conversations/slack.ts
- github-delivery.ts
- knowledge.ts
- weekly-research.ts
- outbox.ts
- approach.ts
- LearningSubject
- .pump
- shared.ts
- preferences-store.ts
- evidence-digest.ts
- DailyCTO.tsx
- codex-rollout.ts
- knowledge-sources.ts
- telemetry/report.ts
- OfficeConfigView.tsx
- ITFollowUps.tsx
- scheduled-captures.ts
- checkpoint-completion.ts
- reader.ts
- coordination-tick.ts
- extraction.ts
- needsDecision
- command-registry.ts
- lessons-view.ts
- notifications.ts
- liveReach
- extract-worker.mjs
- slack-supersession.ts
- helper-evidence.py
- Role

## God Nodes (most connected - your core abstractions)
1. `Store` - 348 edges
2. `TicketJob` - 144 edges
3. `GitHubDelivery` - 135 edges
4. `command()` - 108 edges
5. `digest()` - 105 edges
6. `artifact()` - 98 edges
7. `workKey()` - 91 edges
8. `cx()` - 88 edges
9. `currentAssignment()` - 73 edges
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

## Communities (105 total, 2 thin omitted)

### Community 0 - "dependency-bots/adopt.ts"
Cohesion: 0.14
Nodes (27): Execute, adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR, openDependabotPulls() (+19 more)

### Community 1 - "retrospective-triggers.ts"
Cohesion: 0.12
Nodes (29): maintenanceSubject(), busyMaintenanceIds(), clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates(), maintenanceCompletedId(), maintenanceKey() (+21 more)

### Community 2 - "App.tsx"
Cohesion: 0.05
Nodes (43): blank(), goalInput, Goals(), BrainWorkspace, CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants (+35 more)

### Community 3 - "source-amendment-scope.ts"
Cohesion: 0.08
Nodes (39): approvedText(), assert(), assert(), normalize(), officialUrls, ReleaseCapture, verifyReleaseCaptures(), amendmentCaptureObservation() (+31 more)

### Community 4 - "Engine"
Cohesion: 0.09
Nodes (3): channelNoticeAuthorized(), MergeNotifications, Engine

### Community 5 - "post-conflict-preparation.ts"
Cohesion: 0.11
Nodes (37): assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), reconcileCompletedConflictDraft(), routeReadyPostConflictPublication(), verifyInitialDraftConflictPreparation() (+29 more)

### Community 6 - "conversations/conversations.ts"
Cohesion: 0.09
Nodes (34): assertConversationReadback(), Conversations, GoalChangeSchema, ReplySchema, pumpCTO(), queueCTOHandoff(), saveGoals(), pumpIT() (+26 more)

### Community 7 - "source-amendment.ts"
Cohesion: 0.09
Nodes (60): containedFile(), adoptCandidate(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related (+52 more)

### Community 8 - "OfficeScene.tsx"
Cohesion: 0.06
Nodes (55): itAgent(), itDiagnostics(), CameraBookmark, restoreBookmark(), Avatar(), AzureWall(), Chair(), Coworker() (+47 more)

### Community 9 - "model-routes.ts"
Cohesion: 0.28
Nodes (8): CODEX_DEFAULT_EFFORT, CODEX_DEFAULT_MODEL, CODEX_EFFORTS, CODEX_ROLES, ModelRoute, qaPolicyRoute(), resolveModelRoute(), validModelSetting()

### Community 10 - "index.tsx"
Cohesion: 0.06
Nodes (77): Conversation(), Outbox(), SendMessage, recommendedReply(), slackMessageStatus(), SlackDeliveryCard(), ServiceHealthPanel(), labels (+69 more)

### Community 11 - "queue-repairs.ts"
Cohesion: 0.14
Nodes (29): checksFailed(), checksPassed(), checksPending(), CurrentChecksWait, currentMergeChecks(), pass(), pending(), requireThat() (+21 more)

### Community 12 - "index.ts"
Cohesion: 0.08
Nodes (38): args, [cmd,...rawArgs], commands, key, projectIndex, AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), close() (+30 more)

### Community 13 - "ticket-evidence.ts"
Cohesion: 0.20
Nodes (20): unpack(), assetDownloader(), attachmentKind(), evidenceDirectory(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS (+12 more)

### Community 14 - "requests.ts"
Cohesion: 0.16
Nodes (17): boardPreflightCandidate(), Ownership, reconcileBoardPreflight(), CloseoutSupervisionProofRef, Envelope, hash, head, identity (+9 more)

### Community 15 - "agents.ts"
Cohesion: 0.05
Nodes (64): cecPrompt(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), resolvedDecisionNote(), stageInstructions, ConversationResultSchema (+56 more)

### Community 16 - "Button"
Cohesion: 0.07
Nodes (46): guidanceExcerpt(), evidenceTitle(), KnowledgeCapture, KnowledgeCapturePage, KnowledgeHit, KnowledgeReference, KnowledgeActivityPage, Activity() (+38 more)

### Community 17 - "github/issue-publication.ts"
Cohesion: 0.24
Nodes (22): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), ProjectCard, projectCards(), projectGraphql() (+14 more)

### Community 18 - "mutedCopy"
Cohesion: 0.13
Nodes (32): KnowledgeSourceSummary, AddPublicSource(), AddSourceForm(), SourceConnection, SourceCard(), Sources(), UploadSource(), WithdrawSource() (+24 more)

### Community 19 - "features.ts"
Cohesion: 0.09
Nodes (35): normalizeRound(), pendingQuestions(), FeatureApproval, FeatureAuthority, FeatureBaseline, FeatureDocument, FeatureHandoff, FeatureHarnessAction (+27 more)

### Community 20 - "work-summary.ts"
Cohesion: 0.17
Nodes (20): compactSteps(), themeColor, App(), deliveryRepairProjection(), ACTIVE, maintenanceUpdate(), PMQueueItem, pmQueueItems() (+12 more)

### Community 21 - "digest"
Cohesion: 0.09
Nodes (63): harnessCloseout(), PASSING, verifyMergeActions(), activeEffectId(), assertMayMutate(), runHarnessStage(), harnessDelivers(), harnessStageResult() (+55 more)

### Community 22 - "api-routes.ts"
Cohesion: 0.21
Nodes (14): assertAssessmentVisibility(), assertQuestionVisibility(), retainedArtifactScope(), eventSourceBindings(), eventVisible(), exposureBindings(), requestSourceBindings(), knowledgeOfficeState() (+6 more)

### Community 23 - "constellation-runtime.ts"
Cohesion: 0.08
Nodes (39): KnowledgeActivity, KnowledgeEdge, KnowledgeIntakeStatus, KnowledgeMap, KnowledgeNode, CameraPose, flightPose(), cameraTarget() (+31 more)

### Community 24 - "SourceRegistry"
Cohesion: 0.10
Nodes (35): KnowledgeRunner, Config, configDigest(), IntakeConfig, readConfig(), LIMITS, SlackReadAuthority, LinkRecord (+27 more)

### Community 25 - "PeoplePanel.tsx"
Cohesion: 0.09
Nodes (41): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+33 more)

### Community 26 - "delivery-repairs.ts"
Cohesion: 0.23
Nodes (20): run(), publicationEvidenceGap(), qaEvidenceGap(), resultGate(), stageResultGap(), namedRepairIds(), approachFingerprint(), enqueueRepairDiagnosis() (+12 more)

### Community 27 - "TelemetryPanel.tsx"
Cohesion: 0.09
Nodes (41): TelemetryReport, displayAgentTask(), withoutElapsed(), LiveAgentTask(), Props, RunningTask(), text(), AzureBuild (+33 more)

### Community 28 - "azure.ts"
Cohesion: 0.10
Nodes (26): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+18 more)

### Community 29 - "maintenance/maintenance.ts"
Cohesion: 0.14
Nodes (18): captureMaintenanceStep(), candidateOwner(), SETTLED, skipOwnedCandidate(), Skipped, skippedCandidateLedger(), CmsFollowUpContext, cmsFollowUpInstructions() (+10 more)

### Community 30 - "TicketJob"
Cohesion: 0.07
Nodes (40): Execute, installDependencies(), major(), removeAdoptedClone(), HarnessControl, withHarnessWork(), Check, harnessChecks() (+32 more)

### Community 31 - "features/commands.ts"
Cohesion: 0.31
Nodes (14): commandFeature(), reviewQuestions(), applyHarnessAction(), HarnessActionInput, harnessQuestion(), recoveryPreconditions(), recoveryTarget(), canReleaseOrdinary() (+6 more)

### Community 32 - "process.ts"
Cohesion: 0.07
Nodes (53): approveFeature(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), artifactPath(), digest(), document() (+45 more)

### Community 33 - "featureById"
Cohesion: 0.20
Nodes (10): featureById(), Link, linkFeature(), publishFeature(), reconcilePublication(), uncertainPublications(), reserveIdentity(), featureRoute() (+2 more)

### Community 34 - "engine.ts"
Cohesion: 0.14
Nodes (28): correlatedBuild(), dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), resume(), startPilot(), eligibility() (+20 more)

### Community 35 - "office/config.ts"
Cohesion: 0.09
Nodes (38): featureItemComplete(), reconcileFeatureCompletion(), discoveryPrompt(), planPrompt(), readEvidence(), helperTelemetry(), DELAYS, MAX_EXECUTIONS (+30 more)

### Community 36 - "session-bridge.ts"
Cohesion: 0.10
Nodes (28): claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexSessionContext(), readRollout, claudeSessions(), codexSessions() (+20 more)

### Community 37 - "cec/issue-publication.ts"
Cohesion: 0.16
Nodes (10): Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), plainDescription(), Transition, FeaturePublisher (+2 more)

### Community 38 - "retrospective-subject.ts"
Cohesion: 0.18
Nodes (15): deliveryMetrics(), median(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject, SubjectStepResult (+7 more)

### Community 39 - "slack-intake/config.ts"
Cohesion: 0.13
Nodes (20): privateFile(), readLocalIntakeReport(), exactly(), Message, nativeReadPayload(), pagination(), nativeFile(), Fields (+12 more)

### Community 40 - "run-accounting.ts"
Cohesion: 0.11
Nodes (34): BoundedRead, done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf(), backfillClaudeCost(), CompletionReader (+26 more)

### Community 41 - "telemetry.ts"
Cohesion: 0.09
Nodes (26): CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL, Rates (+18 more)

### Community 42 - "admit-improvement.ts"
Cohesion: 0.22
Nodes (15): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+7 more)

### Community 43 - "harnessEffect"
Cohesion: 0.15
Nodes (22): harnessEffect, readBackOrThrow(), retryRead(), ensureTrackingIssue(), findTrackingIssue(), ownTracking(), TrackingIssue, trackingIssueBody() (+14 more)

### Community 44 - "GitHubIssuePublisher"
Cohesion: 0.25
Nodes (7): PublicationReceipt, Assign, Board, GitHubIssuePublisher, number(), same(), label()

### Community 45 - ".emit"
Cohesion: 0.10
Nodes (36): retryRecipientLookup(), Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership (+28 more)

### Community 46 - "scheduled-work.ts"
Cohesion: 0.10
Nodes (43): deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), metadataRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), deterministicActions (+35 more)

### Community 47 - "investigations/run.ts"
Cohesion: 0.11
Nodes (32): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationCandidates(), investigationId(), investigationEvidence(), investigationFollowUps(), INVOCATION_SOURCE_REFS, invocationSource() (+24 more)

### Community 48 - "run-retrospective.ts"
Cohesion: 0.11
Nodes (30): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, improvementIntakeGate(), learningDigest(), appendLearningFacts(), freezeLearningPacket(), ARTIFACT_LIMIT (+22 more)

### Community 49 - "slack-intake/run.ts"
Cohesion: 0.10
Nodes (41): independentIntakeResult(), recordLearningOpportunity(), captureProposal(), effectId(), newTask(), recordObservation(), settlePage(), ChannelProgress (+33 more)

### Community 50 - "contract.ts"
Cohesion: 0.22
Nodes (11): At, Errno, GroupInventory, GroupProbe, LifecycleDiagnostic, Phase, Pid, lifecycleFacts() (+3 more)

### Community 51 - "blocker-followups.ts"
Cohesion: 0.08
Nodes (37): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), itChatPrompt(), partialLocalCleanupKey(), savedAdmissionUnresolved(), completedConflictDraftUnresolved() (+29 more)

### Community 52 - "digest"
Cohesion: 0.17
Nodes (21): comparableSlackText(), uploadArtifact(), AuthoredDigest, reconcileDigestAuthorship(), unitAuthorship(), annotateAuthoredUnits(), reconcileAuthoredEvidence(), digest() (+13 more)

### Community 53 - ".save"
Cohesion: 0.08
Nodes (43): file, folder, logs, root, xml(), BLOCKED, Execute, findComment() (+35 more)

### Community 54 - "workKey"
Cohesion: 0.07
Nodes (63): partialLocalCleanupCandidate(), completedPRReviews(), continuationJsonArtifact(), continuationScope(), continuationWorktree(), continuationGuard(), brainImplementationCandidate(), BrainReadback (+55 more)

### Community 55 - "jira-time.ts"
Cohesion: 0.21
Nodes (13): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+5 more)

### Community 56 - "time-scope.ts"
Cohesion: 0.16
Nodes (27): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence(), CaptureContext (+19 more)

### Community 57 - "Coordinator"
Cohesion: 0.08
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 58 - "record-trigger.ts"
Cohesion: 0.20
Nodes (16): baselineLearning(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences(), clip(), JobLike, recordCIBudget() (+8 more)

### Community 59 - "knowledge/routes.ts"
Cohesion: 0.07
Nodes (73): intakeActivity(), knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), KnowledgeContext, independentDigestEvidence(), digestKnowledge(), prepareDigestBodies() (+65 more)

### Community 60 - "brain-maintenance.ts"
Cohesion: 0.22
Nodes (10): maintenancePolicies(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice(), easternDate(), weeklyDue() (+2 more)

### Community 61 - "cec/workflow.ts"
Cohesion: 0.23
Nodes (10): checkMail(), drainMail(), requestMail(), MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), advance(), ingest() (+2 more)

### Community 62 - "highestStableAtLeast"
Cohesion: 0.83
Nodes (3): compare(), highestStableAtLeast(), parts()

### Community 63 - "dependencies.ts"
Cohesion: 0.22
Nodes (18): Admission, admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, compatible(), dependencyCompletionKey(), dependencyEligibility() (+10 more)

### Community 64 - "assignment-poll.ts"
Cohesion: 0.14
Nodes (21): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+13 more)

### Community 65 - "slack-intake/report.ts"
Cohesion: 0.18
Nodes (25): Proposal, ReadTask, isStoppingFor(), reconcileIntakeStatus(), intakeProgress(), terminalDeferred(), unitKey(), verifiedCapture() (+17 more)

### Community 66 - "useOfficePreferences.ts"
Cohesion: 0.26
Nodes (10): acceptPreferences(), PreferenceCandidate, strip(), UNKNOWN_PREFERENCES, OfficePreferencesController, PreferenceFeedback, PreferenceField, requestPreferences() (+2 more)

### Community 67 - "fact-bounds.ts"
Cohesion: 0.21
Nodes (18): leadershipContext(), leadershipEntries(), knowledgeEntries(), collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime() (+10 more)

### Community 68 - "coordination.ts"
Cohesion: 0.19
Nodes (17): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation(), checkpointWindow(), dueAt() (+9 more)

### Community 69 - "OfficeSnapshot"
Cohesion: 0.14
Nodes (17): FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures(), TicketPlanningAction(), SnapshotAcceptance (+9 more)

### Community 70 - "weekly-rollup.ts"
Cohesion: 0.13
Nodes (25): learningMetrics(), lessonsNeedingReview(), RollupResult, RollupResultSchema, retryDelay(), ROLLUP_HISTORY, rollupDue(), RollupHooks (+17 more)

### Community 71 - "artifact"
Cohesion: 0.06
Nodes (110): assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint(), closeoutProviderEvidence() (+102 more)

### Community 72 - "Store"
Cohesion: 0.06
Nodes (37): JiraOperations, plain(), APPROACH_GUIDANCE, DeliveryTaskInput, DISCOVERY_GUIDANCE, AMENDMENT_REVIEW_PROOF, featureDeliveryContext(), featureEffectGate() (+29 more)

### Community 73 - "conversations/slack.ts"
Cohesion: 0.11
Nodes (23): settleRequestedSlackReplacement(), SlackMessages, SlackRequestSchema, SlackResultSchema, SlackVerificationSchema, assertDigestDispatch(), outboundBody(), retainOutboundBody() (+15 more)

### Community 74 - "github-delivery.ts"
Cohesion: 0.08
Nodes (55): findingsBlock(), HANDS_OFF_PROJECTS, handsOff(), legacyRecovery(), BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction() (+47 more)

### Community 75 - "knowledge.ts"
Cohesion: 0.09
Nodes (27): acceptedSourceBindings(), readAcceptedResult(), retainAcceptedResult(), publicTopicSafe(), researchTopics(), TEMPLATES, Kind, RetrospectiveResult (+19 more)

### Community 76 - "weekly-research.ts"
Cohesion: 0.13
Nodes (11): mirror(), ResearchResult, runWeeklyResearch(), scheduledResearch(), DailyCTO, dailyReviewPrompt(), DailyResultSchema, Briefing (+3 more)

### Community 77 - "outbox.ts"
Cohesion: 0.13
Nodes (22): MessageInput, projectOutbox(), syncOutbox(), projectSlackDeliveries(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint() (+14 more)

### Community 78 - "approach.ts"
Cohesion: 0.44
Nodes (10): afterDraft(), ApproachSchema, firstBuildStage(), missingApproachStage(), plannedNext(), recordApproach(), reroute(), stageNeeded() (+2 more)

### Community 79 - "LearningSubject"
Cohesion: 0.15
Nodes (16): decodeLookupJournal(), lookupJournal, readLookupJournal(), citations(), recordAcceptedKnowledge(), stageName(), knowledgeCitation(), lessonCitation() (+8 more)

### Community 81 - "shared.ts"
Cohesion: 0.06
Nodes (40): Result, ProjectReadiness, DailyCTOBriefing, DailyCTOResult, DailyCTOSummary, DailyGoalUpdate, GoalEvidenceRef, GoalEvidenceRequest (+32 more)

### Community 82 - "preferences-store.ts"
Cohesion: 0.18
Nodes (11): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, SettingsPanel() (+3 more)

### Community 83 - "evidence-digest.ts"
Cohesion: 0.44
Nodes (7): canonical(), evidenceDigest(), evidenceHash(), semantic(), stableUrl(), requirementDrift(), RequirementPostimage

### Community 84 - "DailyCTO.tsx"
Cohesion: 0.26
Nodes (8): CTOReview(), goalState, DailyCTO(), GoalHistory(), reportDate(), reviewStatus, reviewExcerpt(), ReviewText()

### Community 85 - "codex-rollout.ts"
Cohesion: 0.25
Nodes (10): add(), CodexRequest, CodexRollout, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens() (+2 more)

### Community 86 - "knowledge-sources.ts"
Cohesion: 0.25
Nodes (6): sourceList(), KnowledgeCadence, KnowledgeDestination, KnowledgeSourceKind, KnowledgeSourceState, SourceSubscription

### Community 87 - "telemetry/report.ts"
Cohesion: 0.15
Nodes (20): validTicket(), telemetryRoute(), ConfirmedSegment, LiveAnchor, ObservationGap, SnapshotOrdering, TimeLedgerState, Acc (+12 more)

### Community 88 - "OfficeConfigView.tsx"
Cohesion: 0.48
Nodes (5): loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView(), OfficeConfigSummary

### Community 89 - "ITFollowUps.tsx"
Cohesion: 0.67
Nodes (4): itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps()

### Community 90 - "scheduled-captures.ts"
Cohesion: 0.15
Nodes (49): createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest, captureRequests() (+41 more)

### Community 91 - "checkpoint-completion.ts"
Cohesion: 0.24
Nodes (8): BrainStatusSchema, identity, parseBrainStatus(), brainCheckpointCompletion(), coverageSchema, followupSchema, verified, reconcileCompletedCheckpoints()

### Community 92 - "reader.ts"
Cohesion: 0.08
Nodes (21): captureAfter(), CaptureMetadata, capturePage(), cursor(), key(), captureIdentityMatches(), BrainCaptureReceipt, hash (+13 more)

### Community 93 - "coordination-tick.ts"
Cohesion: 0.14
Nodes (13): reconcileNoticeConfirmations(), PrerequisitesSchema, BrainFollowup, legacy, reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION (+5 more)

### Community 94 - "extraction.ts"
Cohesion: 0.50
Nodes (4): createExtractor(), extractDocument, Extraction, Extractor

### Community 95 - "needsDecision"
Cohesion: 0.70
Nodes (3): parksInJira(), DECISION_KINDS, needsDecision()

### Community 97 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 98 - "lessons-view.ts"
Cohesion: 0.29
Nodes (8): OfficeProposal, RetrospectiveRecord, WeeklyRollup, IntakeSummary(), lessonsView, newest(), ROLLUP_ROWS, TRIGGER_LABEL

### Community 99 - "notifications.ts"
Cohesion: 0.16
Nodes (19): ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR, plainSlackText() (+11 more)

### Community 102 - "liveReach"
Cohesion: 0.60
Nodes (5): GIT_NETWORK, LIVE_PROVIDERS, liveReach(), networkUrl(), remoteUrls()

### Community 103 - "extract-worker.mjs"
Cohesion: 0.70
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 104 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 112 - "Role"
Cohesion: 0.11
Nodes (20): ROLES, LOCAL_BINDINGS, contextPacket(), DeliverySlot, officeCapacity, fifo(), ScheduledWork, Scheduler (+12 more)

## Knowledge Gaps
- **413 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+408 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `dependency-bots/adopt.ts`, `retrospective-triggers.ts`, `Engine`, `post-conflict-preparation.ts`, `conversations/conversations.ts`, `source-amendment.ts`, `ticket-evidence.ts`, `requests.ts`, `agents.ts`, `github/issue-publication.ts`, `features.ts`, `digest`, `api-routes.ts`, `SourceRegistry`, `delivery-repairs.ts`, `azure.ts`, `maintenance/maintenance.ts`, `TicketJob`, `features/commands.ts`, `process.ts`, `featureById`, `engine.ts`, `office/config.ts`, `session-bridge.ts`, `cec/issue-publication.ts`, `retrospective-subject.ts`, `slack-intake/config.ts`, `run-accounting.ts`, `admit-improvement.ts`, `harnessEffect`, `GitHubIssuePublisher`, `.emit`, `scheduled-work.ts`, `investigations/run.ts`, `run-retrospective.ts`, `slack-intake/run.ts`, `blocker-followups.ts`, `digest`, `.save`, `workKey`, `jira-time.ts`, `time-scope.ts`, `record-trigger.ts`, `knowledge/routes.ts`, `dependencies.ts`, `assignment-poll.ts`, `slack-intake/report.ts`, `coordination.ts`, `OfficeSnapshot`, `weekly-rollup.ts`, `artifact`, `conversations/slack.ts`, `github-delivery.ts`, `knowledge.ts`, `weekly-research.ts`, `outbox.ts`, `LearningSubject`, `shared.ts`, `telemetry/report.ts`, `scheduled-captures.ts`, `checkpoint-completion.ts`, `coordination-tick.ts`, `notifications.ts`, `Role`?**
  _High betweenness centrality (0.142) - this node is a cross-community bridge._
- **Why does `Role` connect `Role` to `retrospective-triggers.ts`, `App.tsx`, `conversations/conversations.ts`, `OfficeScene.tsx`, `model-routes.ts`, `index.tsx`, `agents.ts`, `api-routes.ts`, `PeoplePanel.tsx`, `maintenance/maintenance.ts`, `TicketJob`, `retrospective-subject.ts`, `run-accounting.ts`, `.emit`, `OfficeSnapshot`, `Store`, `github-delivery.ts`, `outbox.ts`, `approach.ts`, `shared.ts`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `Engine` connect `Engine` to `conversations/conversations.ts`, `requests.ts`, `agents.ts`, `delivery-repairs.ts`, `azure.ts`, `maintenance/maintenance.ts`, `featureById`, `engine.ts`, `office/config.ts`, `scheduled-work.ts`, `.save`, `cec/workflow.ts`, `coordination.ts`, `Store`, `github-delivery.ts`, `shared.ts`, `scheduled-captures.ts`, `coordination-tick.ts`, `notifications.ts`, `Role`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `command()` (e.g. with `.constructor()` and `executeRequest()`) actually correct?**
  _`command()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _413 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dependency-bots/adopt.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13963963963963963 - nodes in this community are weakly interconnected._
- **Should `retrospective-triggers.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12436974789915967 - nodes in this community are weakly interconnected._