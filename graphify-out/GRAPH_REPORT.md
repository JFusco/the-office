# Graph Report - the-office  (2026-11-10)

## Corpus Check
- 680 files · ~281,245 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3489 nodes · 15372 edges · 112 communities (109 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 95 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3a8bb0d5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- engine.ts
- digest
- github-delivery.ts
- GitHubDelivery
- github-context.ts
- knowledge/routes.ts
- outbox.ts
- OfficeScene.tsx
- cec/workflow.ts
- record-trigger.ts
- Activity.tsx
- Inspector.tsx
- App.tsx
- agents.ts
- scope-repair-resume.ts
- worker-runtime.ts
- features.ts
- TimeBook.tsx
- notifications.ts
- slack-intake/report.ts
- requests.ts
- weekly-rollup.ts
- dependencies.ts
- ControlStore
- run-retrospective.ts
- index.tsx
- maintenance.ts
- offices.ts
- conversations/conversations.ts
- observations.ts
- azure.ts
- .emit
- source-amendment.ts
- index.ts
- PeoplePanel.tsx
- .save
- session-bridge.ts
- schedule.ts
- http/commands.ts
- dependency-bots/adopt.ts
- reader.ts
- time-scope.ts
- validate-stage.ts
- artifact
- cost-ledger.ts
- workKey
- Store
- IntakeLedger
- github/issue-publication.ts
- investigations/run.ts
- OfficeSnapshot
- cec/issue-publication.ts
- delivery-repairs.ts
- Coordinator
- scheduler.ts
- useOfficePreferences.ts
- knowledge.ts
- lesson-selection.ts
- jira-time.ts
- api-routes.ts
- assignment-poll.ts
- leadership.ts
- intake/admission.ts
- .getEffect
- coordination.ts
- MapView.tsx
- admit-improvement.ts
- service-health.ts
- blocker-followups.ts
- owned-artifact.ts
- digest
- fact-bounds.ts
- process.ts
- assertMayMutate
- slack-intake/config.ts
- run-accounting.ts
- telemetry.ts
- control-store.ts
- shared.ts
- telemetry/report.ts
- contracts.ts
- TicketJob
- .pump
- codex-rollout.ts
- adopted-review-candidate.ts
- command-registry.ts
- accept-stage-result.ts
- office-lessons.ts
- install-service.mjs
- continuation-evidence.ts
- extract-worker.mjs
- scheduled-work.ts
- slack-supersession.ts
- helper-evidence.py
- daily-cto.ts
- retrospective-subject.ts
- observe-prs.ts
- evidence.ts
- SlackIntakeStatus.tsx
- highestStableAtLeast
- store.ts
- work.ts
- brain-maintenance.ts
- captures.ts
- it-specialist.ts
- approach.ts
- merge-scanner-retry.ts
- investigations/ledger.ts
- OfficeConfigView.tsx
- scheduledResearch
- checkpoint-completion.ts

## God Nodes (most connected - your core abstractions)
1. `Store` - 314 edges
2. `TicketJob` - 132 edges
3. `GitHubDelivery` - 121 edges
4. `command()` - 102 edges
5. `cx()` - 88 edges
6. `artifact()` - 87 edges
7. `digest()` - 86 edges
8. `workKey()` - 83 edges
9. `OfficeSnapshot` - 70 edges
10. `digest()` - 66 edges

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
- 3-file cycle: `server/conversations/notifications.ts -> server/conversations/slack.ts -> server/knowledge/digests/outbound.ts -> server/conversations/notifications.ts`
- 3-file cycle: `server/conversations/notifications.ts -> server/knowledge/digests/send-notice.ts -> server/knowledge/digests/outbound.ts -> server/conversations/notifications.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-guard.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/queue-repairs.ts -> server/delivery/repairs/reconcile-ci-diagnosis.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/parking/resume-provider-review.ts -> server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/parking/resume-provider-review.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-publication.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/conversations/conversations.ts -> server/conversations/slack.ts -> server/workers/agents.ts -> server/conversations/conversations.ts`
- 3-file cycle: `server/conversations/slack.ts -> server/workers/agents.ts -> server/workers/worker-runtime.ts -> server/conversations/slack.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/scope-repair/scope-repair-resume.ts -> server/delivery/recovery/validation/validation-provider-context.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/recovery/retire-external-delivery.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/conversations/conversations.ts -> server/scheduling/engine.ts -> server/workers/agents.ts -> server/conversations/conversations.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/stage-prompts.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-checkout.ts -> server/delivery/pipeline/github-delivery.ts`

## Communities (112 total, 3 thin omitted)

### Community 0 - "engine.ts"
Cohesion: 0.18
Nodes (19): checkMail(), drainMail(), requestMail(), dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), resume() (+11 more)

### Community 1 - "digest"
Cohesion: 0.12
Nodes (46): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+38 more)

### Community 2 - "github-delivery.ts"
Cohesion: 0.11
Nodes (37): findingsBlock(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery(), BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE (+29 more)

### Community 3 - "GitHubDelivery"
Cohesion: 0.09
Nodes (27): StageContext, GitHubDelivery, bindPreparationBoardOrigins(), claimSchema, eventSchema, PreparationBoardOrigin, readPreparationBoardOrigins(), timestamp (+19 more)

### Community 4 - "github-context.ts"
Cohesion: 0.17
Nodes (22): checksFailed(), checksPassed(), checksPending(), CurrentChecksWait, currentMergeChecks(), pass(), pending(), requireThat() (+14 more)

### Community 5 - "knowledge/routes.ts"
Cohesion: 0.08
Nodes (51): knowledgeActivity(), assignmentKnowledge(), committedNotePage(), BrainReader, guidanceExcerpt(), KnowledgeContext, independentDigestEvidence(), prepareDigestBodies() (+43 more)

### Community 6 - "outbox.ts"
Cohesion: 0.21
Nodes (11): knowledgeOutbox(), checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), repeatedVendorReviewBlock(), stoppedInVendorReview(), checkpointSuperseded(), maintenanceSuperseded() (+3 more)

### Community 7 - "OfficeScene.tsx"
Cohesion: 0.06
Nodes (52): itAgent(), itDiagnostics(), CameraBookmark, restoreBookmark(), Avatar(), AzureWall(), Chair(), Coworker() (+44 more)

### Community 8 - "cec/workflow.ts"
Cohesion: 0.25
Nodes (11): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), nextStage(), publicationEvidenceGap(), qaEvidenceGap(), resultGate(), stageResultGap() (+3 more)

### Community 9 - "record-trigger.ts"
Cohesion: 0.10
Nodes (42): expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences(), busyMaintenanceIds(), clip(), maintenanceBlockedId(), MaintenanceCandidate (+34 more)

### Community 10 - "Activity.tsx"
Cohesion: 0.12
Nodes (24): KnowledgeCapturePage, KnowledgeActivityPage, Activity(), ActivityStatus(), AssignmentKnowledge(), CaptureReviewDetail(), CaptureReviews(), empty (+16 more)

### Community 11 - "Inspector.tsx"
Cohesion: 0.08
Nodes (57): Conversation(), Outbox(), SendMessage, slackMessageStatus(), SlackDeliveryCard(), ServiceHealthPanel(), labels, ServiceHealthRow() (+49 more)

### Community 12 - "App.tsx"
Cohesion: 0.05
Nodes (64): themeColor, App(), BrainWorkspace, CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants, ElevatorPhase (+56 more)

### Community 13 - "agents.ts"
Cohesion: 0.06
Nodes (53): cecPrompt(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), resolvedDecisionNote(), stageInstructions, ConversationResultSchema (+45 more)

### Community 14 - "scope-repair-resume.ts"
Cohesion: 0.15
Nodes (30): containedFile(), Assessment, outsideScanSources(), Ownership, requireThat(), scopeRepairRequestResolved(), sha, assertScopeRepairResumeFindings() (+22 more)

### Community 15 - "worker-runtime.ts"
Cohesion: 0.07
Nodes (43): candidateWorkspaceEnvironment(), diagnosticContext(), assignmentSubject(), dispatchExposure(), prepareExposure(), assertRetainedDispatchScope(), contextPacket(), assertModelOverrides() (+35 more)

### Community 16 - "features.ts"
Cohesion: 0.09
Nodes (47): approveFeature(), assertRetainedItems(), commandFeature(), createFeature(), featureById(), mutation(), reviewQuestions(), assertFeatureDependencyOrder() (+39 more)

### Community 17 - "TimeBook.tsx"
Cohesion: 0.09
Nodes (40): TelemetryReport, displayAgentTask(), withoutElapsed(), LiveAgentTask(), Props, RunningTask(), text(), AzureBuild (+32 more)

### Community 18 - "notifications.ts"
Cohesion: 0.08
Nodes (37): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR (+29 more)

### Community 19 - "slack-intake/report.ts"
Cohesion: 0.25
Nodes (17): ReadTask, isStoppingFor(), intakeProgress(), terminalDeferred(), unitKey(), verifiedCapture(), referenceIndex, byWeek() (+9 more)

### Community 20 - "requests.ts"
Cohesion: 0.12
Nodes (39): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutProviderEvidence() (+31 more)

### Community 21 - "weekly-rollup.ts"
Cohesion: 0.20
Nodes (15): learningMetrics(), lessonsNeedingReview(), RollupResult, RollupResultSchema, harperFolder(), RETROSPECTIVE_TIMEOUT, scanCuration(), ROLLUP_HISTORY (+7 more)

### Community 22 - "dependencies.ts"
Cohesion: 0.21
Nodes (15): reconcileNoticeConfirmations(), compatible(), dependencyCompletionKey(), dependencyEligibility(), DependencyStores, issueKey(), observePrerequisites(), PrerequisiteSchema (+7 more)

### Community 23 - "ControlStore"
Cohesion: 0.27
Nodes (4): Briefing, saveReviewBriefing(), ControlStore, DailyCTOReport

### Community 24 - "run-retrospective.ts"
Cohesion: 0.07
Nodes (47): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, improvementIntakeGate(), learningDigest(), recordLearningOpportunity(), appendLearningFacts(), freezeLearningPacket() (+39 more)

### Community 25 - "index.tsx"
Cohesion: 0.08
Nodes (50): KnowledgeSourceSummary, BlockerFollowups(), IntakeSummary(), LessonsPanel(), when(), ResearchSummary(), completedTime, SlackSeedStatus() (+42 more)

### Community 26 - "maintenance.ts"
Cohesion: 0.14
Nodes (18): candidateOwner(), SETTLED, skipOwnedCandidate(), Skipped, skippedCandidateLedger(), CmsFollowUpContext, cmsFollowUpInstructions(), GitHubMaintenance (+10 more)

### Community 27 - "offices.ts"
Cohesion: 0.10
Nodes (27): leadershipContext(), leadershipEntries(), knowledgeEntries(), Config, configDigest(), IntakeConfig, readConfig(), Command (+19 more)

### Community 28 - "conversations/conversations.ts"
Cohesion: 0.08
Nodes (38): assertConversationReadback(), Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff(), saveGoals() (+30 more)

### Community 29 - "observations.ts"
Cohesion: 0.18
Nodes (16): ChannelProgress, Message, observeRead(), Page, readArguments(), readMethod(), ReadUnavailable, intakePrompt() (+8 more)

### Community 30 - "azure.ts"
Cohesion: 0.10
Nodes (27): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+19 more)

### Community 31 - ".emit"
Cohesion: 0.10
Nodes (23): featureItemComplete(), reconcileFeatureCompletion(), currentApproval(), helperTelemetry(), beginReader(), recoverFeatures(), EvidenceSchema, helperInstallation() (+15 more)

### Community 32 - "source-amendment.ts"
Cohesion: 0.07
Nodes (67): adoptCandidate(), reported, Scope, approvedText(), assert(), AMENDMENT_REVIEW_PROOF, amendmentInstruction(), amendmentIssueSha256() (+59 more)

### Community 33 - "index.ts"
Cohesion: 0.08
Nodes (31): args, [cmd,...rawArgs], commands, key, projectIndex, AUTO_ADOPT_BOTS, close(), config (+23 more)

### Community 34 - "PeoplePanel.tsx"
Cohesion: 0.10
Nodes (40): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+32 more)

### Community 35 - ".save"
Cohesion: 0.16
Nodes (29): JiraOperations, plain(), unpack(), BLOCKED, Execute, findComment(), jira(), LiveIssue (+21 more)

### Community 36 - "session-bridge.ts"
Cohesion: 0.11
Nodes (26): claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexSessionContext(), readRollout, claudeSessions(), codexSessions() (+18 more)

### Community 37 - "schedule.ts"
Cohesion: 0.13
Nodes (31): KnowledgeRunner, retryDelay(), LIMITS, reconcileIntakeStatus(), linkKey(), LinkRecord, LinkResult, PublicReadPolicy (+23 more)

### Community 38 - "http/commands.ts"
Cohesion: 0.22
Nodes (17): retryRecipientLookup(), bindDiscoveryResume(), DiscoveryResumeInput, configureDigestDelivery(), DigestSettings, baselineLearning(), configureKnowledge(), declineLessonIssue() (+9 more)

### Community 39 - "dependency-bots/adopt.ts"
Cohesion: 0.08
Nodes (68): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard, projectCards() (+60 more)

### Community 40 - "reader.ts"
Cohesion: 0.17
Nodes (8): BrainGraph, BrainNote, CommittedBrain, GraphNode, GraphPage, hash, Note, sha

### Community 41 - "time-scope.ts"
Cohesion: 0.14
Nodes (29): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence(), CaptureContext (+21 more)

### Community 42 - "validate-stage.ts"
Cohesion: 0.16
Nodes (17): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+9 more)

### Community 43 - "artifact"
Cohesion: 0.10
Nodes (58): advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat(), candidateInput(), children, oldAdoptionBasis() (+50 more)

### Community 44 - "cost-ledger.ts"
Cohesion: 0.14
Nodes (28): EffectUncertainError, captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId() (+20 more)

### Community 45 - "workKey"
Cohesion: 0.08
Nodes (45): recordJobApproach(), savedActivationFailure(), continuationScope(), Assessment, diagnosticProof(), discoveryRecoveryCandidate(), ownedArtifact(), Ownership (+37 more)

### Community 46 - "Store"
Cohesion: 0.06
Nodes (6): Engine, OfficeEntry, Store, command(), WorkerRuntime, OfficeEvent

### Community 47 - "IntakeLedger"
Cohesion: 0.19
Nodes (17): independentIntakeResult(), captureProposal(), newTask(), recordObservation(), settlePage(), Observation, DERIVED, IntakeLedger (+9 more)

### Community 48 - "github/issue-publication.ts"
Cohesion: 0.16
Nodes (14): FeaturePublisher, PublicationReceipt, publishFeature(), reserveIdentity(), Assign, Board, Content, GitHubIssuePublisher (+6 more)

### Community 49 - "investigations/run.ts"
Cohesion: 0.20
Nodes (14): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, OFFICE_FIX_PROMPT, OfficeFixResult, validateOfficeFix(), investigationReady(), InvestigationOptions, InvestigationReport (+6 more)

### Community 50 - "OfficeSnapshot"
Cohesion: 0.08
Nodes (33): FeatureRound, FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures(), draftKey() (+25 more)

### Community 51 - "cec/issue-publication.ts"
Cohesion: 0.22
Nodes (8): Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), plainDescription(), Transition, JiraFeaturePublisher

### Community 52 - "delivery-repairs.ts"
Cohesion: 0.21
Nodes (19): correlatedBuild(), run(), namedRepairIds(), approachFingerprint(), enqueueRepairDiagnosis(), githubRepairEligible(), jiraRepairable(), REPAIR_DIAGNOSIS (+11 more)

### Community 54 - "scheduler.ts"
Cohesion: 0.15
Nodes (13): fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch(), foreignWork(), WorkSlot (+5 more)

### Community 55 - "useOfficePreferences.ts"
Cohesion: 0.11
Nodes (20): PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, acceptPreferences(), PreferenceCandidate, PreferenceState (+12 more)

### Community 56 - "knowledge.ts"
Cohesion: 0.11
Nodes (24): AssignmentLookups, Binding, lookupInstructions(), decodeLookupJournal(), lookupJournal, readLookupJournal(), KnowledgeAssignment, BlockerFollowup (+16 more)

### Community 57 - "lesson-selection.ts"
Cohesion: 0.19
Nodes (16): knowledgeContext(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), LessonSelection, MAINTENANCE (+8 more)

### Community 58 - "jira-time.ts"
Cohesion: 0.21
Nodes (13): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+5 more)

### Community 59 - "api-routes.ts"
Cohesion: 0.18
Nodes (16): retainedArtifactScope(), eventSourceBindings(), eventVisible(), exposureBindings(), requestSourceBindings(), knowledgeOfficeState(), knowledgePromptStore(), deniedAssignments() (+8 more)

### Community 60 - "assignment-poll.ts"
Cohesion: 0.13
Nodes (24): noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved() (+16 more)

### Community 61 - "leadership.ts"
Cohesion: 0.20
Nodes (8): DailyCTOBriefing, DailyCTOResult, DailyCTOSummary, DailyGoalUpdate, GoalEvidenceRef, GoalEvidenceRequest, GoalProgress, GoalStatus

### Community 62 - "intake/admission.ts"
Cohesion: 0.23
Nodes (11): Admission, admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, Prerequisite, WorkFailure, AssignmentReview (+3 more)

### Community 63 - ".getEffect"
Cohesion: 0.23
Nodes (8): GitHubOperations, fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), Assessment, closeNativeRefresh(), fingerprint(), EffectIntent

### Community 64 - "coordination.ts"
Cohesion: 0.15
Nodes (20): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), legacy, validateNativeContinuation(), checkpointWindow() (+12 more)

### Community 65 - "MapView.tsx"
Cohesion: 0.08
Nodes (38): KnowledgeActivity, KnowledgeEdge, KnowledgeIntakeStatus, KnowledgeMap, KnowledgeNode, BrainWorkspace(), Library(), CameraPose (+30 more)

### Community 66 - "admit-improvement.ts"
Cohesion: 0.25
Nodes (13): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+5 more)

### Community 67 - "service-health.ts"
Cohesion: 0.13
Nodes (14): ITSpecialist, RequestContext, ServiceContext, listenerHealth(), providers, ProviderStatusChecks, summary, runtimeRevision() (+6 more)

### Community 68 - "blocker-followups.ts"
Cohesion: 0.34
Nodes (10): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), projectOutbox(), readBackConversations(), diagnosticSnapshot(), nativeDeliveryResolved() (+2 more)

### Community 69 - "owned-artifact.ts"
Cohesion: 0.30
Nodes (11): ghLogCacheEvidence(), citations(), recordAcceptedKnowledge(), stageName(), knowledgeCitation(), lessonCitation(), done(), readBoundedNoFollow() (+3 more)

### Community 70 - "digest"
Cohesion: 0.16
Nodes (23): comparableSlackText(), intakeActivity(), knowledgeActivityPage(), createExtractor(), extractDocument, Extraction, Extractor, uploadArtifact() (+15 more)

### Community 71 - "fact-bounds.ts"
Cohesion: 0.26
Nodes (15): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+7 more)

### Community 72 - "process.ts"
Cohesion: 0.16
Nodes (18): At, Errno, GroupInventory, GroupProbe, LifecycleDiagnostic, Phase, Pid, groupInventory() (+10 more)

### Community 73 - "assertMayMutate"
Cohesion: 0.16
Nodes (24): harnessCloseout(), PASSING, verifyMergeActions(), assertMayMutate(), retryRead(), runHarnessStage(), harnessStageResult(), receipt() (+16 more)

### Community 74 - "slack-intake/config.ts"
Cohesion: 0.23
Nodes (12): exactly(), Message, nativeReadPayload(), pagination(), nativeFile(), Fields, PublicHosts, SlackAppId (+4 more)

### Community 75 - "run-accounting.ts"
Cohesion: 0.12
Nodes (28): BoundedRead, backfillClaudeCost(), CompletionReader, codexHome(), createdAt(), dayDirs(), header(), readCodexRollout() (+20 more)

### Community 76 - "telemetry.ts"
Cohesion: 0.10
Nodes (26): CodexRollout, CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL (+18 more)

### Community 77 - "control-store.ts"
Cohesion: 0.19
Nodes (7): Clock, applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, statementCache(), initialSnapshot()

### Community 78 - "shared.ts"
Cohesion: 0.11
Nodes (21): parksInJira(), DECISION_KINDS, needsDecision(), APPROACH_GUARD_REJECTION, failedWorker(), requeueWaitedImplement(), ReconciliationRequest, BoardUpdate (+13 more)

### Community 79 - "telemetry/report.ts"
Cohesion: 0.14
Nodes (22): validTicket(), telemetryRoute(), TelemetryRow, TelemetrySync, ConfirmedSegment, LiveAnchor, ObservationGap, SnapshotOrdering (+14 more)

### Community 80 - "contracts.ts"
Cohesion: 0.16
Nodes (20): effectId(), CaptureReceipt, IntakeResult, IntakeResultValue, Proposal, ReadKind, assertProposalScope(), SlackReadAuthority (+12 more)

### Community 81 - "TicketJob"
Cohesion: 0.12
Nodes (12): ProjectProgress, dependabotReviewGuidance(), deliveryTask(), DeliveryTaskInput, DISCOVERY_GUIDANCE, stagePrompt(), StagePromptInput, ROLES (+4 more)

### Community 83 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 84 - "adopted-review-candidate.ts"
Cohesion: 0.21
Nodes (17): removeAdoptedClone(), adoptedReviewCandidate(), ciCheckout(), finishCISetup(), verifyCIHooks(), CIFailure, guardCIRepair(), prepareCIMetadataRepair() (+9 more)

### Community 85 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 86 - "accept-stage-result.ts"
Cohesion: 0.17
Nodes (24): acceptStageResult(), PrerequisitesSchema, mergeAuthorized(), discoveryReviewSatisfied(), recoveredFindingsResolved(), dependencyVersion(), handoffSavedPrerequisites(), hasSavedPrerequisiteResult() (+16 more)

### Community 87 - "office-lessons.ts"
Cohesion: 0.16
Nodes (20): normalizeStatement(), decideOfficeProposal(), mirrorOfficeKnowledge(), now(), OfficeKnowledgeStore, proposeOfficeLessons(), retireOfficeLesson(), Input (+12 more)

### Community 88 - "install-service.mjs"
Cohesion: 0.33
Nodes (5): file, folder, logs, root, xml()

### Community 89 - "continuation-evidence.ts"
Cohesion: 0.22
Nodes (19): closeoutCheckpoint(), closeoutRecoveryCandidate(), CloseoutRecoveryKind, completedClaim(), coreCloseoutNative(), verifiedCloseoutCleanupRequest(), allowed, continuationArtifacts() (+11 more)

### Community 90 - "extract-worker.mjs"
Cohesion: 0.70
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 91 - "scheduled-work.ts"
Cohesion: 0.17
Nodes (17): deliverySlot(), closeoutRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), deterministicActions, eligible(), requestResolved() (+9 more)

### Community 92 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 95 - "daily-cto.ts"
Cohesion: 0.18
Nodes (12): DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), reviewWeekday(), applyGoalReview(), DailyResultSchema, EvidenceRefSchema (+4 more)

### Community 96 - "retrospective-subject.ts"
Cohesion: 0.19
Nodes (15): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, maintenanceKey(), azurePrUrl(), findSubject(), jobSubject() (+7 more)

### Community 97 - "observe-prs.ts"
Cohesion: 0.22
Nodes (13): resumeProviderReviews(), observe(), completedPRReviews(), eligible(), mergedByOwner(), ownerSettles(), retireExternalDeliveries(), retireInactiveDeliveries() (+5 more)

### Community 98 - "evidence.ts"
Cohesion: 0.23
Nodes (11): investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_SOURCE_PATHS, officeSource(), LaunchPolicy, launchPolicyFacts() (+3 more)

### Community 99 - "SlackIntakeStatus.tsx"
Cohesion: 0.60
Nodes (4): format, labels, SlackIntakeStatus(), time()

### Community 100 - "highestStableAtLeast"
Cohesion: 0.83
Nodes (3): compare(), highestStableAtLeast(), parts()

### Community 101 - "store.ts"
Cohesion: 0.19
Nodes (11): sanitizeObject(), comparable(), EvidenceOutcome, recordRunEvidence(), initializeStoreSchema(), checkpointMeasurement(), HEARTBEAT_GAP_MS, HEARTBEAT_MS (+3 more)

### Community 102 - "work.ts"
Cohesion: 0.14
Nodes (14): pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION, ProjectReadiness, AssignmentResult, CompletionCondition, Continuation, DependencyObservation (+6 more)

### Community 103 - "brain-maintenance.ts"
Cohesion: 0.23
Nodes (8): maintenancePolicies(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice(), easternDate(), weeklyDue()

### Community 104 - "captures.ts"
Cohesion: 0.25
Nodes (11): captureAfter(), CaptureMetadata, capturePage(), cursor(), key(), captureIdentityMatches(), BrainCaptureReceipt, hash (+3 more)

### Community 105 - "it-specialist.ts"
Cohesion: 0.36
Nodes (7): ITContext, publishITReport(), delays, recoverAttempt(), ITFollowUp, ITReport, ITState

### Community 106 - "approach.ts"
Cohesion: 0.44
Nodes (10): afterDraft(), ApproachSchema, firstBuildStage(), missingApproachStage(), plannedNext(), recordApproach(), reroute(), stageNeeded() (+2 more)

### Community 107 - "merge-scanner-retry.ts"
Cohesion: 0.40
Nodes (9): officeMergeProvenance(), reconcileMergeScannerRetry(), Retry, retryMergeScanner(), retryReadBack(), runIdentity(), savedRetry(), transientScannerJobs() (+1 more)

### Community 108 - "investigations/ledger.ts"
Cohesion: 0.47
Nodes (7): investigationCandidates(), investigationId(), investigationFollowUps(), investigationResolution(), syncInvestigations(), requeueInvestigationEvidence(), ITInvestigation

### Community 109 - "OfficeConfigView.tsx"
Cohesion: 0.48
Nodes (5): loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView(), OfficeConfigSummary

### Community 110 - "scheduledResearch"
Cohesion: 0.60
Nodes (3): mirror(), runWeeklyResearch(), scheduledResearch()

### Community 111 - "checkpoint-completion.ts"
Cohesion: 0.40
Nodes (3): coverageSchema, followupSchema, verified

## Knowledge Gaps
- **386 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+381 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `engine.ts`, `digest`, `github-delivery.ts`, `GitHubDelivery`, `github-context.ts`, `knowledge/routes.ts`, `cec/workflow.ts`, `record-trigger.ts`, `agents.ts`, `scope-repair-resume.ts`, `worker-runtime.ts`, `features.ts`, `notifications.ts`, `slack-intake/report.ts`, `requests.ts`, `weekly-rollup.ts`, `dependencies.ts`, `run-retrospective.ts`, `maintenance.ts`, `offices.ts`, `conversations/conversations.ts`, `azure.ts`, `.emit`, `source-amendment.ts`, `.save`, `session-bridge.ts`, `schedule.ts`, `http/commands.ts`, `dependency-bots/adopt.ts`, `time-scope.ts`, `validate-stage.ts`, `artifact`, `cost-ledger.ts`, `workKey`, `IntakeLedger`, `github/issue-publication.ts`, `investigations/run.ts`, `OfficeSnapshot`, `cec/issue-publication.ts`, `delivery-repairs.ts`, `scheduler.ts`, `knowledge.ts`, `lesson-selection.ts`, `jira-time.ts`, `api-routes.ts`, `assignment-poll.ts`, `intake/admission.ts`, `.getEffect`, `coordination.ts`, `admit-improvement.ts`, `blocker-followups.ts`, `owned-artifact.ts`, `digest`, `assertMayMutate`, `slack-intake/config.ts`, `run-accounting.ts`, `control-store.ts`, `shared.ts`, `telemetry/report.ts`, `contracts.ts`, `TicketJob`, `adopted-review-candidate.ts`, `accept-stage-result.ts`, `office-lessons.ts`, `continuation-evidence.ts`, `scheduled-work.ts`, `daily-cto.ts`, `retrospective-subject.ts`, `observe-prs.ts`, `evidence.ts`, `store.ts`, `brain-maintenance.ts`, `it-specialist.ts`, `investigations/ledger.ts`, `checkpoint-completion.ts`?**
  _High betweenness centrality (0.108) - this node is a cross-community bridge._
- **Why does `command()` connect `Store` to `engine.ts`, `github-delivery.ts`, `GitHubDelivery`, `github-context.ts`, `cec/workflow.ts`, `agents.ts`, `worker-runtime.ts`, `features.ts`, `notifications.ts`, `requests.ts`, `dependencies.ts`, `maintenance.ts`, `azure.ts`, `.emit`, `source-amendment.ts`, `.save`, `session-bridge.ts`, `schedule.ts`, `dependency-bots/adopt.ts`, `reader.ts`, `validate-stage.ts`, `cost-ledger.ts`, `github/issue-publication.ts`, `cec/issue-publication.ts`, `delivery-repairs.ts`, `jira-time.ts`, `assignment-poll.ts`, `.getEffect`, `coordination.ts`, `admit-improvement.ts`, `service-health.ts`, `process.ts`, `assertMayMutate`, `shared.ts`, `contracts.ts`, `adopted-review-candidate.ts`, `command-registry.ts`, `scheduled-work.ts`, `brain-maintenance.ts`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `TicketJob` connect `TicketJob` to `digest`, `github-delivery.ts`, `GitHubDelivery`, `github-context.ts`, `record-trigger.ts`, `Inspector.tsx`, `App.tsx`, `scope-repair-resume.ts`, `worker-runtime.ts`, `requests.ts`, `source-amendment.ts`, `dependency-bots/adopt.ts`, `validate-stage.ts`, `artifact`, `workKey`, `delivery-repairs.ts`, `scheduler.ts`, `assignment-poll.ts`, `intake/admission.ts`, `owned-artifact.ts`, `fact-bounds.ts`, `assertMayMutate`, `shared.ts`, `adopted-review-candidate.ts`, `accept-stage-result.ts`, `continuation-evidence.ts`, `retrospective-subject.ts`, `observe-prs.ts`, `it-specialist.ts`, `approach.ts`, `merge-scanner-retry.ts`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `command()` (e.g. with `.constructor()` and `executeRequest()`) actually correct?**
  _`command()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _386 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `digest` be split into smaller, more focused modules?**
  _Cohesion score 0.1243885394828791 - nodes in this community are weakly interconnected._
- **Should `github-delivery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10885341074020319 - nodes in this community are weakly interconnected._