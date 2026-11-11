# Graph Report - office-runtime-blockers  (2026-11-11)

## Corpus Check
- 796 files · ~315,904 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3918 nodes · 17957 edges · 107 communities (104 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 104 edges (avg confidence: 0.74)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e79ef927`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- github-delivery.ts
- .save
- index.tsx
- artifact
- Store
- .emit
- activation-recovery.ts
- accept-stage-result.ts
- features.ts
- office/config.ts
- OfficeScene.tsx
- MapView.tsx
- source-amendment.ts
- scheduled-work.ts
- agents.ts
- OfficeSnapshot
- closeout-recovery.ts
- App.tsx
- knowledge/routes.ts
- Button
- Library.tsx
- knowledge.ts
- weekly-rollup.ts
- worker-runtime.ts
- slack-intake/run.ts
- .transaction
- record-trigger.ts
- cec/workflow.ts
- digest
- Role
- TelemetryPanel.tsx
- scheduledWork
- knowledge-snapshot.ts
- offices.ts
- outbox.ts
- ticket-evidence.ts
- task-briefing.ts
- scope-repair-resume.ts
- scheduler.ts
- maintenance/maintenance.ts
- SourceRegistry
- assignment-poll.ts
- conversations/conversations.ts
- shared.ts
- azure.ts
- recovery/stopped-base-update.ts
- digest
- .get
- engine.ts
- dependency-bots/adopt.ts
- investigations/run.ts
- telemetry.ts
- run-retrospective.ts
- operational-status.ts
- conversations/slack.ts
- harnessEffect
- run-accounting.ts
- knowledge/learning-events.ts
- index.ts
- QuestionStepper.tsx
- WorkTime
- remove-candidate.ts
- features/commands.ts
- retrospective-subject.ts
- MaintenanceRun
- Coordinator
- session-bridge.ts
- Engine
- validate-stage.ts
- http/commands.ts
- goal-reviews.ts
- json
- session-scope.ts
- featureById
- service-health.ts
- jira-time.ts
- blocker-followups.ts
- tracking-issue.ts
- telemetry/report.ts
- publish-pr.ts
- fact-bounds.ts
- contract.ts
- model-routes.ts
- api-routes.ts
- retrieval.ts
- coordination.ts
- .pump
- DailyCTO.tsx
- useOfficePreferences.ts
- cost-entries.ts
- codex-rollout.ts
- delivery-task.ts
- candidate-child-context.ts
- merge-scanner-retry.ts
- command-registry.ts
- session-context-file.ts
- sanitizeObject
- cli.ts
- owned-artifact.ts
- liveReach
- extract-worker.mjs
- launch-policy.ts
- SlackIntakeStatus.tsx
- highestStableAtLeast
- slack-supersession.ts
- helper-evidence.py

## God Nodes (most connected - your core abstractions)
1. `Store` - 360 edges
2. `TicketJob` - 166 edges
3. `GitHubDelivery` - 144 edges
4. `digest()` - 134 edges
5. `artifact()` - 117 edges
6. `command()` - 108 edges
7. `workKey()` - 97 edges
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

## Communities (107 total, 3 thin omitted)

### Community 0 - "github-delivery.ts"
Cohesion: 0.06
Nodes (72): harnessCloseout(), PASSING, verifyMergeActions(), assertDeliveryMayMutate(), runHarnessStage(), BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE (+64 more)

### Community 1 - ".save"
Cohesion: 0.05
Nodes (53): file, folder, logs, root, xml(), Assignment, JiraIssuePublisher, keyOf() (+45 more)

### Community 2 - "index.tsx"
Cohesion: 0.06
Nodes (77): Conversation(), Outbox(), SendMessage, slackMessageStatus(), SlackDeliveryCard(), labels, BlockerFollowups(), IntakeSummary() (+69 more)

### Community 3 - "artifact"
Cohesion: 0.07
Nodes (79): linkDraftIssue(), protectedOriginalClaim(), publicationReadArgs(), readPublication(), verifiedCloseoutCleanupRequest(), continuationNativeReview(), assertPostConflictFiles(), assertPostConflictOwnership() (+71 more)

### Community 4 - "Store"
Cohesion: 0.05
Nodes (38): CommentPage, commentReadback(), Content, jiraText(), JiraOperations, plain(), unpack(), jiraRecord() (+30 more)

### Community 5 - ".emit"
Cohesion: 0.06
Nodes (60): reconcileNoticeConfirmations(), admit(), IntakeContext, resumeParked(), compatible(), dependencyCompletionKey(), dependencyEligibility(), DependencyStores (+52 more)

### Community 6 - "activation-recovery.ts"
Cohesion: 0.07
Nodes (67): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+59 more)

### Community 7 - "accept-stage-result.ts"
Cohesion: 0.08
Nodes (63): containedFile(), findingsBlock(), park(), acceptStageResult(), acceptConflictRepair(), nextJobStage(), recordJobApproach(), deliveryNextStage() (+55 more)

### Community 8 - "features.ts"
Cohesion: 0.07
Nodes (59): approveFeature(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), artifactPath(), digest(), document() (+51 more)

### Community 9 - "office/config.ts"
Cohesion: 0.07
Nodes (51): deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, requireDeliveryAuthority(), deliveryIntakeBlocker(), gateRegisteredDelivery(), accounting (+43 more)

### Community 10 - "OfficeScene.tsx"
Cohesion: 0.05
Nodes (61): displayAgentTask(), githubStageLabels, withoutElapsed(), CameraBookmark, restoreBookmark(), LiveAgentTask(), Props, RunningTask() (+53 more)

### Community 11 - "MapView.tsx"
Cohesion: 0.07
Nodes (47): KnowledgeEdge, KnowledgeIntakeStatus, KnowledgeMap, KnowledgeNode, BrainDrawer(), CameraPose, flightPose(), cameraTarget() (+39 more)

### Community 12 - "source-amendment.ts"
Cohesion: 0.07
Nodes (62): approvedText(), assert(), amendmentIssueSha256(), authorizeSourceAmendment(), Binding, assert(), normalize(), officialUrls (+54 more)

### Community 13 - "scheduled-work.ts"
Cohesion: 0.13
Nodes (49): createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest, captureRequests() (+41 more)

### Community 14 - "agents.ts"
Cohesion: 0.07
Nodes (39): cecPrompt(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), resolvedDecisionNote(), stageInstructions, cecChatPrompt() (+31 more)

### Community 15 - "OfficeSnapshot"
Cohesion: 0.07
Nodes (44): FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures(), TicketPlanningAction(), App() (+36 more)

### Community 16 - "closeout-recovery.ts"
Cohesion: 0.09
Nodes (51): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+43 more)

### Community 17 - "App.tsx"
Cohesion: 0.05
Nodes (47): itAgent(), itDiagnostics(), itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps(), ServiceHealthPanel(), ServiceHealthRow() (+39 more)

### Community 18 - "knowledge/routes.ts"
Cohesion: 0.09
Nodes (31): intakeActivity(), knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader (+23 more)

### Community 19 - "Button"
Cohesion: 0.11
Nodes (38): KnowledgeSourceSummary, AddPublicSource(), AddSourceForm(), SourceConnection, SourceCard(), supported, UploadSource(), WithdrawSource() (+30 more)

### Community 20 - "Library.tsx"
Cohesion: 0.09
Nodes (33): KnowledgeDigestDelivery, KnowledgeActivity, KnowledgeActivityPage, Activity(), ActivityStatus(), ActivityTimeline(), AssignmentKnowledge(), empty (+25 more)

### Community 21 - "knowledge.ts"
Cohesion: 0.07
Nodes (45): Accepted, acceptRetrospective(), normalizeStatement(), RETROSPECTIVE_HISTORY, distinct(), identity(), improvementIncident(), improvementIncidentKey() (+37 more)

### Community 22 - "weekly-rollup.ts"
Cohesion: 0.10
Nodes (27): learningMetrics(), lessonsNeedingReview(), RollupResultSchema, retryDelay(), scanCuration(), mirror(), ResearchResult, runWeeklyResearch() (+19 more)

### Community 23 - "worker-runtime.ts"
Cohesion: 0.08
Nodes (36): candidateWorkspaceEnvironment(), assignmentSubject(), dispatchExposure(), prepareExposure(), lessonPurpose(), MAINTENANCE, assertRetainedDispatchScope(), resolveModelRoute() (+28 more)

### Community 24 - "slack-intake/run.ts"
Cohesion: 0.13
Nodes (29): uploadArtifact(), ChannelProgress, Observation, ReadKind, ReadTask, SourceUnit, IntakeLedger, Message (+21 more)

### Community 25 - ".transaction"
Cohesion: 0.12
Nodes (31): featureItemComplete(), reconcileFeatureCompletion(), discoveryPrompt(), planPrompt(), helperTelemetry(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS (+23 more)

### Community 26 - "record-trigger.ts"
Cohesion: 0.09
Nodes (44): busyMaintenanceIds(), clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates(), maintenanceCompletedId(), visibleMaintenanceTriggerIds(), clip() (+36 more)

### Community 27 - "cec/workflow.ts"
Cohesion: 0.11
Nodes (40): applyIntakeObservation(), checkMail(), drainMail(), requestMail(), parksInJira(), MISSING_INTAKE, reconcileMailbox(), unusedMailbox() (+32 more)

### Community 28 - "digest"
Cohesion: 0.17
Nodes (34): admitPRMetadata(), assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema, savedMetadataAssessment(), validateSaved(), metadataClaim() (+26 more)

### Community 29 - "Role"
Cohesion: 0.11
Nodes (36): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+28 more)

### Community 30 - "TelemetryPanel.tsx"
Cohesion: 0.10
Nodes (36): TelemetryReport, LiveAnchor, AzureBuild, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens() (+28 more)

### Community 31 - "scheduledWork"
Cohesion: 0.11
Nodes (35): deliverySlot(), withAmendmentOwnership(), gateFeatureWork(), eligible(), scheduledWork(), withActiveClaims(), costLedger(), COST_FIELD (+27 more)

### Community 32 - "knowledge-snapshot.ts"
Cohesion: 0.14
Nodes (33): retainedArtifactScope(), knowledgeSnapshot(), officeKnowledgeSnapshot(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, MAX_LESSONS (+25 more)

### Community 33 - "offices.ts"
Cohesion: 0.08
Nodes (25): leadershipContext(), leadershipEntries(), knowledgeEntries(), seedOfficeLessons(), recoverStoppedLaunches(), retireBrainSources(), sourceSchema(), Clock (+17 more)

### Community 34 - "outbox.ts"
Cohesion: 0.11
Nodes (28): projectOutbox(), syncOutbox(), finishSupersededReadback(), projectSlackDeliveries(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint() (+20 more)

### Community 35 - "ticket-evidence.ts"
Cohesion: 0.12
Nodes (33): assetDownloader(), attachmentKind(), evidenceDirectory(), readEvidence(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS (+25 more)

### Community 36 - "task-briefing.ts"
Cohesion: 0.11
Nodes (26): LessonSelection, AssignmentLookups, Binding, lookupInstructions(), decodeLookupJournal(), lookupJournal, citations(), recordAcceptedKnowledge() (+18 more)

### Community 37 - "scope-repair-resume.ts"
Cohesion: 0.11
Nodes (38): stagePrompt(), StagePromptInput, METADATA_FINDING_GUIDANCE, closeoutRequestResolved(), metadataRequestResolved(), preparationRequestResolved(), Assessment, outsideScanSources() (+30 more)

### Community 38 - "scheduler.ts"
Cohesion: 0.09
Nodes (21): ROLES, privateFile(), readLocalIntakeReport(), LOCAL_BINDINGS, file, project, root, DeliverySlot (+13 more)

### Community 39 - "maintenance/maintenance.ts"
Cohesion: 0.10
Nodes (26): maintenancePolicies(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice(), candidateOwner(), SETTLED (+18 more)

### Community 40 - "SourceRegistry"
Cohesion: 0.14
Nodes (23): KnowledgeRunner, LIMITS, SlackReadAuthority, LinkResult, PublicReadPolicy, collectionAllowed(), collectionPolicy, readAuthority() (+15 more)

### Community 41 - "assignment-poll.ts"
Cohesion: 0.10
Nodes (29): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR (+21 more)

### Community 42 - "conversations/conversations.ts"
Cohesion: 0.12
Nodes (24): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+16 more)

### Community 43 - "shared.ts"
Cohesion: 0.07
Nodes (35): Admission, pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION, ProjectReadiness, AssignmentResult, CompletionCondition, Continuation (+27 more)

### Community 44 - "azure.ts"
Cohesion: 0.10
Nodes (26): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+18 more)

### Community 45 - "recovery/stopped-base-update.ts"
Cohesion: 0.12
Nodes (30): assertStoppedBaseAudit(), AuditRow, readStoppedBaseAuditCompletion(), StoppedBaseAuditReader, CoverageRow, Hash, Kind, readStoppedBaseAuditNative() (+22 more)

### Community 46 - "digest"
Cohesion: 0.13
Nodes (29): comparableSlackText(), AuthoredDigest, reconcileDigestAuthorship(), unitAuthorship(), assertDigestDispatch(), annotateAuthoredUnits(), outboundBody(), retainOutboundBody() (+21 more)

### Community 47 - ".get"
Cohesion: 0.14
Nodes (21): newTask(), recordObservation(), settlePage(), DERIVED, linkKey(), runSlackLinks(), queueReconsideration(), readyReferences() (+13 more)

### Community 48 - "engine.ts"
Cohesion: 0.16
Nodes (27): dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), resume(), startPilot(), eligibility(), approvedDelivery() (+19 more)

### Community 49 - "dependency-bots/adopt.ts"
Cohesion: 0.16
Nodes (29): Execute, readBackOrThrow(), adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR (+21 more)

### Community 50 - "investigations/run.ts"
Cohesion: 0.14
Nodes (23): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_FIX_PROMPT, OfficeFixResult (+15 more)

### Community 51 - "telemetry.ts"
Cohesion: 0.09
Nodes (28): CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL, Rates (+20 more)

### Community 52 - "run-retrospective.ts"
Cohesion: 0.13
Nodes (25): appendLearningFacts(), freezeLearningPacket(), ARTIFACT_LIMIT, clip(), LEDGER_STEPS, MAINTENANCE_LIMIT, maintenanceFacts(), MaintenancePacketSection (+17 more)

### Community 53 - "operational-status.ts"
Cohesion: 0.16
Nodes (23): isStoppingFor(), reconcileIntakeStatus(), intakeProgress(), terminalDeferred(), unitKey(), LinkRecord, referenceIndex, byWeek() (+15 more)

### Community 54 - "conversations/slack.ts"
Cohesion: 0.14
Nodes (15): settleRequestedSlackReplacement(), SlackMessages, SlackRequestSchema, SlackResultSchema, SlackVerificationSchema, digestNoticeNeverDispatched(), goalNoticeAuthorized(), goalNoticeNeverDispatched() (+7 more)

### Community 55 - "harnessEffect"
Cohesion: 0.23
Nodes (24): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), ProjectCard, projectCards(), projectGraphql() (+16 more)

### Community 56 - "run-accounting.ts"
Cohesion: 0.13
Nodes (26): BoundedRead, EvidenceOutcome, CompletionReader, codexHome(), createdAt(), dayDirs(), header(), readCodexRollout() (+18 more)

### Community 57 - "knowledge/learning-events.ts"
Cohesion: 0.14
Nodes (21): eventSourceBindings(), improvementIntakeGate(), captureLearning(), learningDigest(), recordLearningOpportunity(), baselineLearning(), expireLearningPackets(), LEARNING_BASELINES (+13 more)

### Community 58 - "index.ts"
Cohesion: 0.12
Nodes (21): Read, close(), config, itSpecialist, loadedRevision, offices, releaseLock, server (+13 more)

### Community 59 - "QuestionStepper.tsx"
Cohesion: 0.15
Nodes (20): FeatureHarnessOption, FeatureOption, FeatureQuestion, FeatureQuestionProjection, draftKey(), readDraft(), saveDraft(), QuestionRound() (+12 more)

### Community 60 - "WorkTime"
Cohesion: 0.20
Nodes (23): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), midnight(), TicketDay (+15 more)

### Community 61 - "remove-candidate.ts"
Cohesion: 0.17
Nodes (19): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot() (+11 more)

### Community 62 - "features/commands.ts"
Cohesion: 0.22
Nodes (17): commandFeature(), reviewQuestions(), FeatureCommandSchema, FeaturePlanningBindings, applyHarnessAction(), HarnessActionInput, harnessQuestion(), recoveryPreconditions() (+9 more)

### Community 63 - "retrospective-subject.ts"
Cohesion: 0.14
Nodes (20): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, maintenanceKey(), azurePrUrl(), findSubject(), jobSubject() (+12 more)

### Community 64 - "MaintenanceRun"
Cohesion: 0.14
Nodes (17): completeNativeCheckpoint(), BrainStatusSchema, brainCheckpointCompletion(), coverageSchema, followupSchema, verified, queueCheckpointRetry(), readBackCheckpoint() (+9 more)

### Community 66 - "session-bridge.ts"
Cohesion: 0.16
Nodes (17): claudeSessionContext(), accountCodexProcesses(), codexProcessInventory, DesktopSessions, unaccountedProcesses(), codexSessionContext(), claudeSessions(), codexSessions() (+9 more)

### Community 67 - "Engine"
Cohesion: 0.10
Nodes (5): correlatedBuild(), Engine, observe(), observeParked(), parkedReadError

### Community 68 - "validate-stage.ts"
Cohesion: 0.16
Nodes (17): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+9 more)

### Community 69 - "http/commands.ts"
Cohesion: 0.21
Nodes (17): bindDiscoveryResume(), DiscoveryResumeInput, enqueueMetadataRecovery(), configureDigestDelivery(), DigestSettings, configureKnowledge(), declineLessonIssue(), demoteLesson() (+9 more)

### Community 70 - "goal-reviews.ts"
Cohesion: 0.13
Nodes (17): applyGoalReview(), DailyResultSchema, EvidenceRefSchema, FreshDailyResultSchema, statusAllowed(), workEvidence(), GoalInput, saveGoal() (+9 more)

### Community 71 - "json"
Cohesion: 0.16
Nodes (13): preferencesRoute(), PreferencesRouteContext, fileResponse(), json(), staticRoute(), fields, PreferencesPatch, PreferencesStore (+5 more)

### Community 72 - "session-scope.ts"
Cohesion: 0.17
Nodes (14): readTranscript, root, claudeSessionScope(), readRollout, ContextProject, ContextReader, retainSessionMessage(), SessionConversation (+6 more)

### Community 73 - "featureById"
Cohesion: 0.22
Nodes (9): featureById(), Link, linkFeature(), reconcilePublication(), uncertainPublications(), reserveIdentity(), featureRoute(), FeatureWorkflow (+1 more)

### Community 74 - "service-health.ts"
Cohesion: 0.16
Nodes (10): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, DailyCTOSummary (+2 more)

### Community 75 - "jira-time.ts"
Cohesion: 0.21
Nodes (13): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+5 more)

### Community 76 - "blocker-followups.ts"
Cohesion: 0.25
Nodes (12): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), readBackConversations(), diagnosticContext(), diagnosticSnapshot(), nativeDeliveryResolved() (+4 more)

### Community 77 - "tracking-issue.ts"
Cohesion: 0.20
Nodes (13): ensureTrackingIssue(), findTrackingIssue(), ownTracking(), TrackingIssue, trackingIssueBody(), trackingIssueTitle(), trackingMarker(), centralCompanionHandoff() (+5 more)

### Community 78 - "telemetry/report.ts"
Cohesion: 0.20
Nodes (16): ConfirmedSegment, ObservationGap, SnapshotOrdering, TimeLedgerState, Acc, bump(), EASTERN, easternDay() (+8 more)

### Community 79 - "publish-pr.ts"
Cohesion: 0.21
Nodes (14): retryRead(), commitlintRejection(), developerPRContent(), Execute, officePRContent(), prContent, PRContentRejected, assertCandidate() (+6 more)

### Community 80 - "fact-bounds.ts"
Cohesion: 0.26
Nodes (15): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+7 more)

### Community 81 - "contract.ts"
Cohesion: 0.22
Nodes (11): At, Errno, GroupInventory, GroupProbe, LifecycleDiagnostic, Phase, Pid, groupInventory() (+3 more)

### Community 82 - "model-routes.ts"
Cohesion: 0.20
Nodes (14): AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), goalEvidencePath(), localBindings, assertModelOverrides(), CODEX_DEFAULT_EFFORT, CODEX_DEFAULT_MODEL, CODEX_EFFORTS (+6 more)

### Community 83 - "api-routes.ts"
Cohesion: 0.35
Nodes (10): assertAssessmentVisibility(), assertQuestionVisibility(), pendingQuestions(), eventVisible(), knowledgeOfficeState(), knowledgePromptStore(), goalHistory(), apiRoute() (+2 more)

### Community 84 - "retrieval.ts"
Cohesion: 0.26
Nodes (9): guidanceExcerpt(), evidenceTitle(), officeSearch(), retrieve(), words(), DocumentMetadata, documentText(), KnowledgeDocumentText (+1 more)

### Community 85 - "coordination.ts"
Cohesion: 0.26
Nodes (11): checkpointWindow(), dueAt(), hours, localDay(), ReviewResult, deferNonReady(), preparePR(), recheck() (+3 more)

### Community 87 - "DailyCTO.tsx"
Cohesion: 0.23
Nodes (9): CTOReview(), goalState, DailyCTO(), GoalHistory(), reportDate(), reviewStatus, reviewExcerpt(), ReviewText() (+1 more)

### Community 88 - "useOfficePreferences.ts"
Cohesion: 0.23
Nodes (11): acceptPreferences(), PreferenceCandidate, strip(), UNKNOWN_PREFERENCES, OfficePreferencesController, PreferenceFeedback, PreferenceField, requestPreferences() (+3 more)

### Community 89 - "cost-entries.ts"
Cohesion: 0.24
Nodes (10): captureCost(), summary(), awaitingEvidence(), CaptureContext, inCostWindow(), TicketCost, ticketCosts(), RECONCILE_GRACE_MS (+2 more)

### Community 90 - "codex-rollout.ts"
Cohesion: 0.25
Nodes (10): add(), CodexRequest, CodexRollout, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens() (+2 more)

### Community 91 - "delivery-task.ts"
Cohesion: 0.31
Nodes (7): reviewInstructions(), deliveryTask(), DeliveryTaskInput, DISCOVERY_GUIDANCE, compactSteps(), AMENDMENT_REVIEW_PROOF, featureDeliveryContext()

### Community 92 - "candidate-child-context.ts"
Cohesion: 0.38
Nodes (8): adoptCandidate(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat()

### Community 93 - "merge-scanner-retry.ts"
Cohesion: 0.44
Nodes (8): officeMergeProvenance(), reconcileMergeScannerRetry(), Retry, retryMergeScanner(), retryReadBack(), runIdentity(), savedRetry(), transientScannerJobs()

### Community 94 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 95 - "session-context-file.ts"
Cohesion: 0.42
Nodes (6): sessionContextFile(), ContextReadChanged, MAX_CONTEXT_READ_MS, sameContextFile(), sessionContextLines(), SessionContextParser

### Community 96 - "sanitizeObject"
Cohesion: 0.33
Nodes (7): snapshot(), validTicket(), sanitizeObject(), comparable(), recordRunEvidence(), telemetryRoute(), TelemetryQuery

### Community 97 - "cli.ts"
Cohesion: 0.25
Nodes (6): args, [cmd,...rawArgs], commands, key, projectIndex, PORT

### Community 98 - "owned-artifact.ts"
Cohesion: 0.57
Nodes (5): ghLogCacheEvidence(), done(), readBoundedNoFollow(), readBoundedNoFollowSync(), reasonOf()

### Community 99 - "liveReach"
Cohesion: 0.60
Nodes (5): GIT_NETWORK, LIVE_PROVIDERS, liveReach(), networkUrl(), remoteUrls()

### Community 100 - "extract-worker.mjs"
Cohesion: 0.70
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 101 - "launch-policy.ts"
Cohesion: 0.60
Nodes (4): LaunchPolicy, launchPolicyFacts(), LaunchPolicyReceipt, retainLaunchPolicy()

### Community 102 - "SlackIntakeStatus.tsx"
Cohesion: 0.60
Nodes (4): format, labels, SlackIntakeStatus(), time()

### Community 103 - "highestStableAtLeast"
Cohesion: 0.83
Nodes (3): compare(), highestStableAtLeast(), parts()

### Community 104 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

## Knowledge Gaps
- **431 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+426 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `github-delivery.ts`, `.save`, `artifact`, `.emit`, `activation-recovery.ts`, `accept-stage-result.ts`, `features.ts`, `office/config.ts`, `OfficeScene.tsx`, `source-amendment.ts`, `scheduled-work.ts`, `agents.ts`, `OfficeSnapshot`, `closeout-recovery.ts`, `knowledge/routes.ts`, `knowledge.ts`, `weekly-rollup.ts`, `worker-runtime.ts`, `slack-intake/run.ts`, `.transaction`, `record-trigger.ts`, `cec/workflow.ts`, `digest`, `scheduledWork`, `knowledge-snapshot.ts`, `offices.ts`, `outbox.ts`, `ticket-evidence.ts`, `task-briefing.ts`, `scope-repair-resume.ts`, `scheduler.ts`, `maintenance/maintenance.ts`, `SourceRegistry`, `assignment-poll.ts`, `conversations/conversations.ts`, `azure.ts`, `recovery/stopped-base-update.ts`, `digest`, `engine.ts`, `dependency-bots/adopt.ts`, `investigations/run.ts`, `run-retrospective.ts`, `operational-status.ts`, `conversations/slack.ts`, `harnessEffect`, `run-accounting.ts`, `knowledge/learning-events.ts`, `index.ts`, `WorkTime`, `remove-candidate.ts`, `features/commands.ts`, `retrospective-subject.ts`, `MaintenanceRun`, `session-bridge.ts`, `validate-stage.ts`, `http/commands.ts`, `goal-reviews.ts`, `featureById`, `jira-time.ts`, `blocker-followups.ts`, `tracking-issue.ts`, `publish-pr.ts`, `api-routes.ts`, `coordination.ts`, `cost-entries.ts`, `delivery-task.ts`, `candidate-child-context.ts`, `sanitizeObject`?**
  _High betweenness centrality (0.140) - this node is a cross-community bridge._
- **Why does `Coordinator` connect `Coordinator` to `MaintenanceRun`, `offices.ts`, `session-bridge.ts`, `Store`, `.emit`, `assignment-poll.ts`, `scheduled-work.ts`, `agents.ts`, `coordination.ts`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Why does `TicketJob` connect `github-delivery.ts` to `.save`, `index.tsx`, `artifact`, `Store`, `.emit`, `activation-recovery.ts`, `accept-stage-result.ts`, `office/config.ts`, `source-amendment.ts`, `OfficeSnapshot`, `closeout-recovery.ts`, `worker-runtime.ts`, `record-trigger.ts`, `cec/workflow.ts`, `digest`, `scope-repair-resume.ts`, `scheduler.ts`, `shared.ts`, `recovery/stopped-base-update.ts`, `engine.ts`, `dependency-bots/adopt.ts`, `harnessEffect`, `index.ts`, `remove-candidate.ts`, `retrospective-subject.ts`, `MaintenanceRun`, `validate-stage.ts`, `publish-pr.ts`, `fact-bounds.ts`, `delivery-task.ts`, `candidate-child-context.ts`, `merge-scanner-retry.ts`, `owned-artifact.ts`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _431 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `github-delivery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05934155263514429 - nodes in this community are weakly interconnected._
- **Should `.save` be split into smaller, more focused modules?**
  _Cohesion score 0.05228442728442728 - nodes in this community are weakly interconnected._
- **Should `index.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06105302464525766 - nodes in this community are weakly interconnected._