# Graph Report - the-office  (2026-11-11)

## Corpus Check
- 795 files · ~316,130 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3928 nodes · 18040 edges · 93 communities (91 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 110 edges (avg confidence: 0.74)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5f6af23a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- github-delivery.ts
- artifact
- GitHubDelivery
- dependency-bots/adopt.ts
- slack-intake/run.ts
- Inspector.tsx
- knowledge.ts
- features/workflow.ts
- requests.ts
- knowledge/routes.ts
- .save
- OfficeScene.tsx
- digest
- offices.ts
- effects.ts
- source-amendment.ts
- index.tsx
- Store
- MapView.tsx
- Button
- agents.ts
- scheduled-work.ts
- scheduled-captures.ts
- worker-runtime.ts
- shared.ts
- schedule.ts
- ticket-evidence.ts
- blocker-followups.ts
- record-trigger.ts
- OfficeSnapshot
- store.ts
- maintenance/maintenance.ts
- App.tsx
- post-conflict-preparation.ts
- Role
- features.ts
- conversations/conversations.ts
- WorkTime
- engine.ts
- index.ts
- conversations/slack.ts
- azure.ts
- .emit
- digest
- scope-repair-resume.ts
- reader.ts
- telemetry.ts
- github-context.ts
- daily-cto.ts
- scheduler.ts
- run-accounting.ts
- outbox.ts
- office/config.ts
- retrospective-subject.ts
- link-draft-issue.ts
- QuestionStepper.tsx
- verifyRepairCandidate
- useOfficePreferences.ts
- investigations/run.ts
- assignment-poll.ts
- lesson-selection.ts
- remove-candidate.ts
- .getEffect
- TelemetryPanel.tsx
- Coordinator
- session-bridge.ts
- api-routes.ts
- .pump
- checkpoint-completion.ts
- jira-time.ts
- service-health.ts
- fact-bounds.ts
- contract.ts
- owned-artifact.ts
- useLiveTiming.ts
- projects.ts
- coordination.ts
- telemetry/report.ts
- claude-session-context.ts
- DailyCTO.tsx
- create-candidate.ts
- session-context-file.ts
- command-registry.ts
- codex-rollout.ts
- cli.ts
- session-scope.ts
- local-config.ts
- OfficeConfigView.tsx
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
6. `command()` - 109 edges
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

## Communities (93 total, 2 thin omitted)

### Community 0 - "github-delivery.ts"
Cohesion: 0.05
Nodes (98): containedFile(), findingsBlock(), namedRepairIds(), assertDeliveryMayMutate(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery() (+90 more)

### Community 1 - "artifact"
Cohesion: 0.07
Nodes (97): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+89 more)

### Community 2 - "GitHubDelivery"
Cohesion: 0.05
Nodes (81): pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), PrerequisitesSchema, GitHubDelivery, completedPRReviews(), reported, Scope, advisoryPM() (+73 more)

### Community 3 - "dependency-bots/adopt.ts"
Cohesion: 0.06
Nodes (78): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard, projectCards() (+70 more)

### Community 4 - "slack-intake/run.ts"
Cohesion: 0.07
Nodes (72): independentIntakeResult(), captureProposal(), effectId(), newTask(), recordObservation(), settlePage(), privateFile(), CaptureReceipt (+64 more)

### Community 5 - "Inspector.tsx"
Cohesion: 0.06
Nodes (75): Conversation(), Outbox(), SendMessage, recommendedReply(), slackMessageStatus(), SlackDeliveryCard(), ServiceHealthPanel(), labels (+67 more)

### Community 6 - "knowledge.ts"
Cohesion: 0.04
Nodes (78): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, assignmentKnowledge(), eventSourceBindings(), learningDigest(), recordLearningOpportunity(), appendLearningFacts() (+70 more)

### Community 7 - "features/workflow.ts"
Cohesion: 0.07
Nodes (65): approveFeature(), commandFeature(), featureById(), mutation(), reviewQuestions(), assertFeatureDependencyOrder(), featureDependencyEdges(), key() (+57 more)

### Community 8 - "requests.ts"
Cohesion: 0.06
Nodes (70): deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, requireDeliveryAuthority(), deliveryIntakeBlocker(), gateRegisteredDelivery(), accounting (+62 more)

### Community 9 - "knowledge/routes.ts"
Cohesion: 0.10
Nodes (53): intakeActivity(), knowledgeActivity(), knowledgeActivityPage(), KnowledgeContext, independentDigestEvidence(), digestKnowledge(), prepareDigestBodies(), retainDigestBody() (+45 more)

### Community 10 - ".save"
Cohesion: 0.06
Nodes (63): file, folder, logs, root, xml(), correlatedBuild(), applyIntakeObservation(), checkMail() (+55 more)

### Community 11 - "OfficeScene.tsx"
Cohesion: 0.05
Nodes (62): itAgent(), itDiagnostics(), displayAgentTask(), githubStageLabels, withoutElapsed(), CameraBookmark, restoreBookmark(), LiveAgentTask() (+54 more)

### Community 12 - "digest"
Cohesion: 0.10
Nodes (55): retryRead(), admitPRMetadata(), METADATA_FINDING, assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema, savedMetadataAssessment() (+47 more)

### Community 13 - "offices.ts"
Cohesion: 0.06
Nodes (45): normalizeStatement(), decideOfficeProposal(), mirrorOfficeKnowledge(), now(), OfficeKnowledgeStore, proposeOfficeLessons(), retireOfficeLesson(), Input (+37 more)

### Community 14 - "effects.ts"
Cohesion: 0.08
Nodes (35): Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), Transition, descriptionPreimage(), plain() (+27 more)

### Community 15 - "source-amendment.ts"
Cohesion: 0.06
Nodes (66): DeliveryTaskInput, DISCOVERY_GUIDANCE, adoptCandidate(), approvedText(), assert(), AMENDMENT_REVIEW_PROOF, amendmentIssueSha256(), authorizeSourceAmendment() (+58 more)

### Community 16 - "index.tsx"
Cohesion: 0.08
Nodes (51): KnowledgeSourceSummary, AddPublicSource(), AddSourceForm(), SourceConnection, SourceCard(), supported, UploadSource(), WithdrawSource() (+43 more)

### Community 17 - "Store"
Cohesion: 0.05
Nodes (17): GitHubFeaturePublisher, JiraFeaturePublisher, QuestionNotifications, Result, Assessment, fingerprint(), Engine, Store (+9 more)

### Community 18 - "MapView.tsx"
Cohesion: 0.07
Nodes (45): KnowledgeActivity, KnowledgeEdge, KnowledgeIntakeStatus, KnowledgeMap, KnowledgeNode, BrainDrawer(), CameraPose, flightPose() (+37 more)

### Community 19 - "Button"
Cohesion: 0.09
Nodes (37): guidanceExcerpt(), evidenceTitle(), KnowledgeCapturePage, KnowledgeDigestDelivery, KnowledgeActivityPage, Activity(), ActivityStatus(), AssignmentKnowledge() (+29 more)

### Community 20 - "agents.ts"
Cohesion: 0.07
Nodes (41): cecPrompt(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), resolvedDecisionNote(), stageInstructions, cecChatPrompt() (+33 more)

### Community 21 - "scheduled-work.ts"
Cohesion: 0.09
Nodes (46): deliverySlot(), ROLES, closeoutRequestResolved(), metadataRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), requestPriority(), deterministicActions (+38 more)

### Community 22 - "scheduled-captures.ts"
Cohesion: 0.15
Nodes (44): createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest, captureRequests() (+36 more)

### Community 23 - "worker-runtime.ts"
Cohesion: 0.08
Nodes (41): candidateWorkspaceEnvironment(), assignmentSubject(), dispatchExposure(), prepareExposure(), assertRetainedDispatchScope(), CODEX_DEFAULT_EFFORT, CODEX_DEFAULT_MODEL, CODEX_EFFORTS (+33 more)

### Community 24 - "shared.ts"
Cohesion: 0.06
Nodes (46): Admission, applyGoalReview(), EvidenceRefSchema, statusAllowed(), workEvidence(), GoalInput, saveGoal(), queueGoalNotice() (+38 more)

### Community 25 - "schedule.ts"
Cohesion: 0.11
Nodes (36): learningMetrics(), lessonsNeedingReview(), RollupResult, RollupResultSchema, KnowledgeRunner, retryDelay(), reconcileIntakeStatus(), linkKey() (+28 more)

### Community 26 - "ticket-evidence.ts"
Cohesion: 0.10
Nodes (38): CommentPage, commentReadback(), JiraOperations, plain(), unpack(), jiraRecord(), assetDownloader(), attachmentKind() (+30 more)

### Community 27 - "blocker-followups.ts"
Cohesion: 0.10
Nodes (35): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), partialLocalCleanupKey(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved() (+27 more)

### Community 28 - "record-trigger.ts"
Cohesion: 0.09
Nodes (44): baselineLearning(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences(), busyMaintenanceIds(), clip(), maintenanceBlockedId() (+36 more)

### Community 29 - "OfficeSnapshot"
Cohesion: 0.09
Nodes (36): compactSteps(), FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures(), TicketPlanningAction() (+28 more)

### Community 30 - "store.ts"
Cohesion: 0.09
Nodes (26): featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), wakeFeature(), recoverFeatures(), observeHelperGroups(), stopHelperGroups(), stopReview() (+18 more)

### Community 31 - "maintenance/maintenance.ts"
Cohesion: 0.10
Nodes (31): ApproachSchema, maintenancePolicies(), captureLearning(), captureMaintenanceStep(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped() (+23 more)

### Community 32 - "App.tsx"
Cohesion: 0.06
Nodes (41): themeColor, BrainWorkspace, CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants, ElevatorPhase, floorVariants (+33 more)

### Community 33 - "post-conflict-preparation.ts"
Cohesion: 0.10
Nodes (40): assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), reconcileCompletedConflictDraft(), routeReadyPostConflictPublication(), verifyInitialDraftConflictPreparation() (+32 more)

### Community 34 - "Role"
Cohesion: 0.11
Nodes (37): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+29 more)

### Community 35 - "features.ts"
Cohesion: 0.10
Nodes (35): DELAYS, MAX_EXECUTIONS, MAX_REPLANS, reserveReplacement(), stageBudget(), classifyFeatureFailure(), recoverFailure(), applyHarnessAction() (+27 more)

### Community 36 - "conversations/conversations.ts"
Cohesion: 0.10
Nodes (25): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+17 more)

### Community 37 - "WorkTime"
Cohesion: 0.12
Nodes (35): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence(), CaptureContext (+27 more)

### Community 38 - "engine.ts"
Cohesion: 0.15
Nodes (30): dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), resume(), startPilot(), eligibility(), approvedDelivery() (+22 more)

### Community 39 - "index.ts"
Cohesion: 0.11
Nodes (29): close(), config, itSpecialist, loadedRevision, offices, releaseLock, server, serviceHealth (+21 more)

### Community 40 - "conversations/slack.ts"
Cohesion: 0.12
Nodes (19): channelNoticeAuthorized(), MergeNotifications, SlackMessages, SlackRequestSchema, SlackResultSchema, SlackVerificationSchema, assertDigestDispatch(), outboundBody() (+11 more)

### Community 41 - "azure.ts"
Cohesion: 0.10
Nodes (26): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+18 more)

### Community 42 - ".emit"
Cohesion: 0.12
Nodes (25): ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), reconcileNoticeConfirmations(), retryRecipientLookup(), bindDiscoveryResume(), DiscoveryResumeInput (+17 more)

### Community 43 - "digest"
Cohesion: 0.14
Nodes (27): comparableSlackText(), uploadArtifact(), AuthoredDigest, reconcileDigestAuthorship(), unitAuthorship(), annotateAuthoredUnits(), reconcileAuthoredEvidence(), digest() (+19 more)

### Community 44 - "scope-repair-resume.ts"
Cohesion: 0.14
Nodes (33): candidateInput(), children, oldAdoptionBasis(), savedCandidateAdmission, Assessment, outsideScanSources(), Ownership, reconcileScopeRepairReadback() (+25 more)

### Community 45 - "reader.ts"
Cohesion: 0.08
Nodes (20): captureAfter(), CaptureMetadata, capturePage(), cursor(), key(), captureIdentityMatches(), BrainCaptureReceipt, hash (+12 more)

### Community 46 - "telemetry.ts"
Cohesion: 0.09
Nodes (29): CodexRollout, CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL (+21 more)

### Community 47 - "github-context.ts"
Cohesion: 0.16
Nodes (24): observe(), checksFailed(), checksPassed(), checksPending(), CurrentChecksWait, currentMergeChecks(), pass(), pending() (+16 more)

### Community 48 - "daily-cto.ts"
Cohesion: 0.13
Nodes (13): DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), reviewWeekday(), queueGoalEvidenceRequest(), DailyResultSchema, FreshDailyResultSchema (+5 more)

### Community 49 - "scheduler.ts"
Cohesion: 0.13
Nodes (16): officeCapacity, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch(), deliveryOccupied() (+8 more)

### Community 50 - "run-accounting.ts"
Cohesion: 0.12
Nodes (28): BoundedRead, backfillClaudeCost(), CompletionReader, codexHome(), createdAt(), dayDirs(), header(), readCodexRollout() (+20 more)

### Community 51 - "outbox.ts"
Cohesion: 0.14
Nodes (22): projectOutbox(), syncOutbox(), projectSlackDeliveries(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint(), slackRequestSettled() (+14 more)

### Community 52 - "office/config.ts"
Cohesion: 0.17
Nodes (23): admit(), IntakeContext, compatible(), dependencyCompletionKey(), dependencyEligibility(), DependencyStores, issueKey(), observePrerequisites() (+15 more)

### Community 53 - "retrospective-subject.ts"
Cohesion: 0.11
Nodes (24): deliveryMetrics(), median(), ARTIFACT_LIMIT, clip(), LEDGER_STEPS, MAINTENANCE_LIMIT, maintenanceFacts(), maintenanceSubject() (+16 more)

### Community 54 - "link-draft-issue.ts"
Cohesion: 0.16
Nodes (20): harnessCloseout(), PASSING, verifyMergeActions(), HarnessControl, withHarnessWork(), runHarnessStage(), harnessStageResult(), receipt() (+12 more)

### Community 55 - "QuestionStepper.tsx"
Cohesion: 0.15
Nodes (20): FeatureHarnessOption, FeatureOption, FeatureQuestion, FeatureQuestionProjection, draftKey(), readDraft(), saveDraft(), QuestionRound() (+12 more)

### Community 56 - "verifyRepairCandidate"
Cohesion: 0.21
Nodes (18): removeAdoptedClone(), stoppedBaseCheckout(), stoppedBaseReviewContext(), reconcileStoppedBaseHandoff(), runStoppedBaseReview(), ciCheckout(), finishCISetup(), verifyCIHooks() (+10 more)

### Community 57 - "useOfficePreferences.ts"
Cohesion: 0.11
Nodes (20): PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, acceptPreferences(), PreferenceCandidate, PreferenceState (+12 more)

### Community 58 - "investigations/run.ts"
Cohesion: 0.18
Nodes (17): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationEvidence(), OFFICE_FIX_PROMPT, OfficeFixResult, validateOfficeFix(), investigationReady(), InvestigationOptions (+9 more)

### Community 59 - "assignment-poll.ts"
Cohesion: 0.16
Nodes (20): clamp(), LIMITS, MergedPR, plainSlackText(), section(), shippedSummary(), configureNotices(), Identity (+12 more)

### Community 60 - "lesson-selection.ts"
Cohesion: 0.16
Nodes (20): knowledgeContext(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), MAINTENANCE, MAX_LESSONS (+12 more)

### Community 61 - "remove-candidate.ts"
Cohesion: 0.20
Nodes (17): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+9 more)

### Community 62 - ".getEffect"
Cohesion: 0.22
Nodes (10): GitHubOperations, digestNoticeNeverDispatched(), fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), goalNoticeNeverDispatched(), closeNativeRefresh(), maintenanceNoticeNeverDispatched() (+2 more)

### Community 63 - "TelemetryPanel.tsx"
Cohesion: 0.21
Nodes (17): BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens(), usd(), KpiTiles(), command() (+9 more)

### Community 65 - "session-bridge.ts"
Cohesion: 0.17
Nodes (17): claudeSessionContext(), accountCodexProcesses(), codexProcessInventory, DesktopSessions, unaccountedProcesses(), codexSessionContext(), claudeSessions(), codexSessions() (+9 more)

### Community 66 - "api-routes.ts"
Cohesion: 0.25
Nodes (14): assertAssessmentVisibility(), assertQuestionVisibility(), pendingQuestions(), retainedArtifactScope(), eventVisible(), knowledgeOfficeState(), knowledgePromptStore(), deniedAssignments() (+6 more)

### Community 67 - ".pump"
Cohesion: 0.21
Nodes (5): leadershipContext(), leadershipEntries(), knowledgeEntries(), Offices, markCaptureStart()

### Community 68 - "checkpoint-completion.ts"
Cohesion: 0.16
Nodes (13): completeNativeCheckpoint(), BrainStatusSchema, identity, brainCheckpointCompletion(), coverageSchema, followupSchema, verified, queueCheckpointRetry() (+5 more)

### Community 69 - "jira-time.ts"
Cohesion: 0.21
Nodes (13): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+5 more)

### Community 70 - "service-health.ts"
Cohesion: 0.20
Nodes (9): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, slackHealth() (+1 more)

### Community 71 - "fact-bounds.ts"
Cohesion: 0.26
Nodes (15): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+7 more)

### Community 72 - "contract.ts"
Cohesion: 0.22
Nodes (11): At, Errno, GroupInventory, GroupProbe, LifecycleDiagnostic, Phase, Pid, groupInventory() (+3 more)

### Community 73 - "owned-artifact.ts"
Cohesion: 0.26
Nodes (11): ghLogCacheEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_SOURCE_PATHS, officeSource(), done(), readBoundedNoFollow() (+3 more)

### Community 74 - "useLiveTiming.ts"
Cohesion: 0.26
Nodes (12): AzureBuild, lastWall, sample(), subscribe(), subscribers, useLiveClock(), liveBuildTiming(), liveTiming() (+4 more)

### Community 75 - "projects.ts"
Cohesion: 0.22
Nodes (10): readLocalIntakeReport(), LOCAL_BINDINGS, file, project, root, contextPacket(), DeliverySlot, projectById() (+2 more)

### Community 76 - "coordination.ts"
Cohesion: 0.23
Nodes (12): checkpointWindow(), dueAt(), hours, localDay(), ReviewResult, deferNonReady(), preparePR(), recheck() (+4 more)

### Community 77 - "telemetry/report.ts"
Cohesion: 0.29
Nodes (12): Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked(), row() (+4 more)

### Community 78 - "claude-session-context.ts"
Cohesion: 0.26
Nodes (8): readTranscript, root, claudeSessionScope(), readRollout, ContextProject, ContextReader, sessionScope, sessionScopeParser()

### Community 79 - "DailyCTO.tsx"
Cohesion: 0.26
Nodes (8): CTOReview(), goalState, DailyCTO(), GoalHistory(), reportDate(), reviewStatus, reviewExcerpt(), ReviewText()

### Community 80 - "create-candidate.ts"
Cohesion: 0.31
Nodes (9): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+1 more)

### Community 81 - "session-context-file.ts"
Cohesion: 0.40
Nodes (7): sessionContextFile(), ContextReadChanged, MAX_CONTEXT_READ_MS, sameContextFile(), sessionContextLines(), SessionContextParser, SessionContext

### Community 82 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 83 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 84 - "cli.ts"
Cohesion: 0.25
Nodes (6): args, [cmd,...rawArgs], commands, key, projectIndex, PORT

### Community 85 - "session-scope.ts"
Cohesion: 0.36
Nodes (5): retainSessionMessage(), SessionConversation, jiraCommandIssues(), ScopeProject, siteHost()

### Community 86 - "local-config.ts"
Cohesion: 0.48
Nodes (6): AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), goalEvidencePath(), localBindings, assertModelOverrides(), ModelOverrides

### Community 87 - "OfficeConfigView.tsx"
Cohesion: 0.48
Nodes (5): loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView(), OfficeConfigSummary

### Community 88 - "extract-worker.mjs"
Cohesion: 0.70
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 89 - "SlackIntakeStatus.tsx"
Cohesion: 0.60
Nodes (4): format, labels, SlackIntakeStatus(), time()

### Community 90 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

## Knowledge Gaps
- **431 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+426 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `github-delivery.ts`, `artifact`, `GitHubDelivery`, `dependency-bots/adopt.ts`, `slack-intake/run.ts`, `knowledge.ts`, `features/workflow.ts`, `requests.ts`, `knowledge/routes.ts`, `.save`, `OfficeScene.tsx`, `digest`, `offices.ts`, `effects.ts`, `source-amendment.ts`, `agents.ts`, `scheduled-work.ts`, `scheduled-captures.ts`, `worker-runtime.ts`, `shared.ts`, `schedule.ts`, `ticket-evidence.ts`, `blocker-followups.ts`, `record-trigger.ts`, `OfficeSnapshot`, `store.ts`, `maintenance/maintenance.ts`, `post-conflict-preparation.ts`, `features.ts`, `conversations/conversations.ts`, `WorkTime`, `engine.ts`, `index.ts`, `conversations/slack.ts`, `azure.ts`, `.emit`, `digest`, `scope-repair-resume.ts`, `github-context.ts`, `scheduler.ts`, `run-accounting.ts`, `outbox.ts`, `office/config.ts`, `retrospective-subject.ts`, `link-draft-issue.ts`, `verifyRepairCandidate`, `investigations/run.ts`, `assignment-poll.ts`, `lesson-selection.ts`, `remove-candidate.ts`, `.getEffect`, `session-bridge.ts`, `api-routes.ts`, `.pump`, `checkpoint-completion.ts`, `jira-time.ts`, `coordination.ts`, `create-candidate.ts`?**
  _High betweenness centrality (0.144) - this node is a cross-community bridge._
- **Why does `Role` connect `Role` to `github-delivery.ts`, `Inspector.tsx`, `knowledge.ts`, `OfficeScene.tsx`, `agents.ts`, `scheduled-work.ts`, `worker-runtime.ts`, `shared.ts`, `OfficeSnapshot`, `store.ts`, `maintenance/maintenance.ts`, `App.tsx`, `conversations/conversations.ts`, `.emit`, `github-context.ts`, `scheduler.ts`, `run-accounting.ts`, `outbox.ts`, `retrospective-subject.ts`, `link-draft-issue.ts`, `projects.ts`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `command()` connect `Store` to `github-delivery.ts`, `artifact`, `GitHubDelivery`, `dependency-bots/adopt.ts`, `slack-intake/run.ts`, `features/workflow.ts`, `requests.ts`, `.save`, `digest`, `effects.ts`, `agents.ts`, `scheduled-work.ts`, `worker-runtime.ts`, `ticket-evidence.ts`, `maintenance/maintenance.ts`, `engine.ts`, `azure.ts`, `digest`, `reader.ts`, `office/config.ts`, `link-draft-issue.ts`, `verifyRepairCandidate`, `assignment-poll.ts`, `remove-candidate.ts`, `.getEffect`, `session-bridge.ts`, `jira-time.ts`, `service-health.ts`, `contract.ts`, `coordination.ts`, `create-candidate.ts`, `command-registry.ts`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _431 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `github-delivery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.054881808838643374 - nodes in this community are weakly interconnected._
- **Should `artifact` be split into smaller, more focused modules?**
  _Cohesion score 0.06626686656671664 - nodes in this community are weakly interconnected._
- **Should `GitHubDelivery` be split into smaller, more focused modules?**
  _Cohesion score 0.04602698650674663 - nodes in this community are weakly interconnected._