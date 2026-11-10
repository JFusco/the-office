# Graph Report - the-office  (2026-11-10)

## Corpus Check
- 679 files · ~281,119 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3487 nodes · 15365 edges · 101 communities (99 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 95 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `528c0f1f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- engine.ts
- artifact
- github-delivery.ts
- GitHubDelivery
- office/config.ts
- sourceVisible
- outbox.ts
- cx
- cec/workflow.ts
- record-trigger.ts
- Button
- index.tsx
- App.tsx
- agents.ts
- source-amendment.ts
- worker-runtime.ts
- features.ts
- TimeBook.tsx
- notifications.ts
- slack-intake/report.ts
- closeout-recovery.ts
- weekly-rollup.ts
- dependencies.ts
- easternDay
- run-retrospective.ts
- SettingsPanel.tsx
- maintenance.ts
- offices.ts
- conversations/conversations.ts
- observations.ts
- azure.ts
- Store
- source-amendment-scope.ts
- index.ts
- Role
- .save
- session-bridge.ts
- schedule.ts
- .emit
- tracking-issue.ts
- knowledge/routes.ts
- WorkTime
- closeout.ts
- projects.ts
- scheduled-work.ts
- OfficeSnapshot
- dependency-bots/adopt.ts
- slack-intake/run.ts
- github/issue-publication.ts
- investigations/run.ts
- FeatureWorkspace.tsx
- cec/issue-publication.ts
- delivery-binding.ts
- Coordinator
- scheduler.ts
- preferences-store.ts
- knowledge.ts
- lesson-selection.ts
- jira-time.ts
- api-routes.ts
- remove-candidate.ts
- goal-reviews.ts
- assignment-poll.ts
- .getEffect
- coordination.ts
- constellation-runtime.ts
- admit-improvement.ts
- service-health.ts
- blocker-followups.ts
- owned-artifact.ts
- diagnostic-context.ts
- fact-bounds.ts
- process.ts
- harnessEffect
- digest
- run-accounting.ts
- telemetry.ts
- store.ts
- shared.ts
- telemetry/report.ts
- Sources.tsx
- weekly-digest.ts
- .pump
- codex-rollout.ts
- knowledge/learning-events.ts
- command-registry.ts
- cli.ts
- merge-summary.ts
- .value
- OfficeProject
- extract-worker.mjs
- dependency-edges.ts
- slack-supersession.ts
- helper-evidence.py
- DailyCTO.tsx
- relink-pin-courier.ts
- json
- launch-policy.ts
- SlackIntakeStatus.tsx
- highestStableAtLeast

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

## Communities (101 total, 2 thin omitted)

### Community 0 - "engine.ts"
Cohesion: 0.07
Nodes (21): correlatedBuild(), checkMail(), drainMail(), requestMail(), dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery() (+13 more)

### Community 1 - "artifact"
Cohesion: 0.07
Nodes (106): HarnessControl, PrerequisitesSchema, partialLocalCleanupCandidate(), partialLocalCleanupKey(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration() (+98 more)

### Community 2 - "github-delivery.ts"
Cohesion: 0.05
Nodes (102): parksInJira(), containedFile(), removeAdoptedClone(), findingsBlock(), namedRepairIds(), activeEffectId(), assertMayMutate(), HANDS_OFF_PROJECTS (+94 more)

### Community 3 - "GitHubDelivery"
Cohesion: 0.05
Nodes (78): observePrerequisites(), GitHubDelivery, boardPreflightCandidate(), reconcileBoardPreflight(), completedPRReviews(), Assessment, diagnosticProof(), discoveryRecoveryCandidate() (+70 more)

### Community 4 - "office/config.ts"
Cohesion: 0.09
Nodes (43): resume(), resumeProviderReviews(), deliveryTask(), observe(), DISCOVERY_GUIDANCE, compactSteps(), checksFailed(), checksPassed() (+35 more)

### Community 5 - "sourceVisible"
Cohesion: 0.12
Nodes (42): intakeActivity(), knowledgeActivity(), knowledgeActivityPage(), BrainGraph, guidanceExcerpt(), KnowledgeContext, knowledgeSnapshot(), officeKnowledgeSnapshot() (+34 more)

### Community 6 - "outbox.ts"
Cohesion: 0.15
Nodes (20): projectOutbox(), syncOutbox(), projectSlackDeliveries(), settleRequestedSlackReplacement(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint() (+12 more)

### Community 7 - "cx"
Cohesion: 0.06
Nodes (63): EvidenceCard(), TicketDetail(), TicketHeading(), displayAgentTask(), githubStageLabels, withoutElapsed(), CameraBookmark, restoreBookmark() (+55 more)

### Community 8 - "cec/workflow.ts"
Cohesion: 0.13
Nodes (33): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), run(), advance(), nextStage(), publicationEvidenceGap(), qaEvidenceGap() (+25 more)

### Community 9 - "record-trigger.ts"
Cohesion: 0.10
Nodes (36): expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences(), clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates() (+28 more)

### Community 10 - "Button"
Cohesion: 0.08
Nodes (42): KnowledgeCapturePage, Activity(), ActivityStatus(), AssignmentKnowledge(), BrainWorkspace(), CaptureReviewDetail(), CaptureReviews(), DocumentMetadata (+34 more)

### Community 11 - "index.tsx"
Cohesion: 0.07
Nodes (62): Conversation(), SendMessage, recommendedReply(), slackMessageStatus(), SlackDeliveryCard(), ServiceHealthPanel(), labels, ServiceHealthRow() (+54 more)

### Community 12 - "App.tsx"
Cohesion: 0.05
Nodes (45): themeColor, BrainWorkspace, CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants, ElevatorPhase, floorVariants (+37 more)

### Community 13 - "agents.ts"
Cohesion: 0.08
Nodes (39): cecPrompt(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), resolvedDecisionNote(), stageInstructions, ConversationResultSchema (+31 more)

### Community 14 - "source-amendment.ts"
Cohesion: 0.08
Nodes (60): adoptCandidate(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat() (+52 more)

### Community 15 - "worker-runtime.ts"
Cohesion: 0.08
Nodes (41): candidateWorkspaceEnvironment(), assignmentSubject(), dispatchExposure(), prepareExposure(), assertRetainedDispatchScope(), contextPacket(), CODEX_DEFAULT_EFFORT, CODEX_DEFAULT_MODEL (+33 more)

### Community 16 - "features.ts"
Cohesion: 0.09
Nodes (49): approveFeature(), assertRetainedItems(), commandFeature(), createFeature(), featureById(), mutation(), reviewQuestions(), discoveryPrompt() (+41 more)

### Community 17 - "TimeBook.tsx"
Cohesion: 0.10
Nodes (36): TelemetryReport, LiveAnchor, AzureBuild, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens() (+28 more)

### Community 18 - "notifications.ts"
Cohesion: 0.11
Nodes (23): channelNoticeAuthorized(), Identity, MergeNotifications, NoticeSettings, reconcileNoticeConfirmations(), SlackMessages, SlackRequestSchema, assertDigestDispatch() (+15 more)

### Community 19 - "slack-intake/report.ts"
Cohesion: 0.19
Nodes (24): privateFile(), Proposal, ReadTask, isStoppingFor(), reconcileIntakeStatus(), intakeProgress(), terminalDeferred(), unitKey() (+16 more)

### Community 20 - "closeout-recovery.ts"
Cohesion: 0.12
Nodes (40): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+32 more)

### Community 21 - "weekly-rollup.ts"
Cohesion: 0.10
Nodes (35): Accepted, acceptRetrospective(), normalizeStatement(), RETROSPECTIVE_HISTORY, learningMetrics(), lessonsNeedingReview(), decideOfficeProposal(), now() (+27 more)

### Community 22 - "dependencies.ts"
Cohesion: 0.13
Nodes (22): Admission, admit(), IntakeContext, compatible(), dependencyCompletionKey(), dependencyEligibility(), DependencyStores, issueKey() (+14 more)

### Community 23 - "easternDay"
Cohesion: 0.08
Nodes (33): retryDelay(), scheduledSlackIntake(), sourceWork(), refresh(), publicSourceWork(), mirror(), ResearchResult, runWeeklyResearch() (+25 more)

### Community 24 - "run-retrospective.ts"
Cohesion: 0.08
Nodes (44): deliveryMetrics(), median(), appendLearningFacts(), freezeLearningPacket(), ARTIFACT_LIMIT, clip(), LEDGER_STEPS, MAINTENANCE_LIMIT (+36 more)

### Community 25 - "SettingsPanel.tsx"
Cohesion: 0.11
Nodes (32): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView() (+24 more)

### Community 26 - "maintenance.ts"
Cohesion: 0.08
Nodes (35): maintenancePolicies(), captureLearning(), captureMaintenanceStep(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice() (+27 more)

### Community 27 - "offices.ts"
Cohesion: 0.09
Nodes (29): leadershipContext(), leadershipEntries(), knowledgeEntries(), Config, configDigest(), IntakeConfig, readConfig(), Command (+21 more)

### Community 28 - "conversations/conversations.ts"
Cohesion: 0.09
Nodes (28): assertConversationReadback(), Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff(), saveGoals() (+20 more)

### Community 29 - "observations.ts"
Cohesion: 0.15
Nodes (18): Message, observeRead(), Page, readArguments(), readMethod(), ReadUnavailable, intakePrompt(), IntakeRateLimit (+10 more)

### Community 30 - "azure.ts"
Cohesion: 0.10
Nodes (26): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+18 more)

### Community 31 - "Store"
Cohesion: 0.09
Nodes (15): featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), recoverFeatures(), observeHelperGroups(), stopHelperGroups(), FeatureReviewRunner, Store (+7 more)

### Community 32 - "source-amendment-scope.ts"
Cohesion: 0.08
Nodes (39): approvedText(), assert(), assert(), normalize(), officialUrls, ReleaseCapture, verifyReleaseCaptures(), amendmentCaptureObservation() (+31 more)

### Community 33 - "index.ts"
Cohesion: 0.15
Nodes (16): close(), config, itSpecialist, loadedRevision, offices, releaseLock, server, serviceHealth (+8 more)

### Community 34 - "Role"
Cohesion: 0.12
Nodes (36): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+28 more)

### Community 35 - ".save"
Cohesion: 0.18
Nodes (26): JiraOperations, plain(), unpack(), BLOCKED, Execute, findComment(), jira(), LiveIssue (+18 more)

### Community 36 - "session-bridge.ts"
Cohesion: 0.11
Nodes (26): claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexSessionContext(), readRollout, claudeSessions(), codexSessions() (+18 more)

### Community 37 - "schedule.ts"
Cohesion: 0.15
Nodes (21): KnowledgeRunner, LIMITS, SlackReadAuthority, linkKey(), LinkRecord, LinkResult, PublicReadPolicy, runSlackLinks() (+13 more)

### Community 38 - ".emit"
Cohesion: 0.15
Nodes (24): ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), configureNotices(), retryRecipientLookup(), bindDiscoveryResume(), DiscoveryResumeInput (+16 more)

### Community 39 - "tracking-issue.ts"
Cohesion: 0.19
Nodes (24): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard, projectCards() (+16 more)

### Community 40 - "knowledge/routes.ts"
Cohesion: 0.08
Nodes (25): captureAfter(), CaptureMetadata, capturePage(), cursor(), key(), assignmentKnowledge(), captureIdentityMatches(), BrainCaptureReceipt (+17 more)

### Community 41 - "WorkTime"
Cohesion: 0.14
Nodes (30): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence(), CaptureContext (+22 more)

### Community 42 - "closeout.ts"
Cohesion: 0.23
Nodes (16): harnessCloseout(), PASSING, verifyMergeActions(), withHarnessWork(), runHarnessStage(), harnessStageResult(), receipt(), Check (+8 more)

### Community 43 - "projects.ts"
Cohesion: 0.24
Nodes (9): readLocalIntakeReport(), LOCAL_BINDINGS, file, project, root, DeliverySlot, projectById(), projectData() (+1 more)

### Community 44 - "scheduled-work.ts"
Cohesion: 0.09
Nodes (44): deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), deterministicActions, eligible() (+36 more)

### Community 45 - "OfficeSnapshot"
Cohesion: 0.11
Nodes (34): Outbox(), App(), SnapshotAcceptance, demoSnapshot(), tourStages, OfficeSnapshot, STAGE_ROLE, deliveryRepairProjection() (+26 more)

### Community 46 - "dependency-bots/adopt.ts"
Cohesion: 0.18
Nodes (23): adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR, openDependabotPulls(), readRepo() (+15 more)

### Community 47 - "slack-intake/run.ts"
Cohesion: 0.12
Nodes (34): createExtractor(), extractDocument, Extraction, Extractor, uploadArtifact(), annotateAuthoredUnits(), independentIntakeResult(), captureProposal() (+26 more)

### Community 48 - "github/issue-publication.ts"
Cohesion: 0.16
Nodes (13): FeaturePublisher, PublicationReceipt, publishFeature(), reserveIdentity(), Assign, Board, Content, GitHubIssuePublisher (+5 more)

### Community 49 - "investigations/run.ts"
Cohesion: 0.18
Nodes (17): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationEvidence(), OFFICE_FIX_PROMPT, OfficeFixResult, validateOfficeFix(), investigationReady(), InvestigationOptions (+9 more)

### Community 50 - "FeatureWorkspace.tsx"
Cohesion: 0.16
Nodes (16): FeatureRound, FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures(), draftKey() (+8 more)

### Community 51 - "cec/issue-publication.ts"
Cohesion: 0.22
Nodes (8): Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), plainDescription(), Transition, JiraFeaturePublisher

### Community 52 - "delivery-binding.ts"
Cohesion: 0.31
Nodes (10): bindDelivery(), featureEffectGate(), bindFeature(), currentApproval(), enrolled(), featureGate(), predecessorComplete(), scheduledFeatures() (+2 more)

### Community 54 - "scheduler.ts"
Cohesion: 0.16
Nodes (13): ROLES, officeCapacity, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch() (+5 more)

### Community 55 - "preferences-store.ts"
Cohesion: 0.18
Nodes (11): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, SettingsPanel() (+3 more)

### Community 56 - "knowledge.ts"
Cohesion: 0.08
Nodes (31): LessonSelection, AssignmentLookups, lookupInstructions(), decodeLookupJournal(), lookupJournal, readLookupJournal(), KnowledgeAssignment, ImprovementGrant (+23 more)

### Community 57 - "lesson-selection.ts"
Cohesion: 0.21
Nodes (15): knowledgeContext(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), MAINTENANCE, MAX_LESSONS (+7 more)

### Community 58 - "jira-time.ts"
Cohesion: 0.16
Nodes (18): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+10 more)

### Community 59 - "api-routes.ts"
Cohesion: 0.22
Nodes (14): retainedArtifactScope(), eventSourceBindings(), eventVisible(), exposureBindings(), requestSourceBindings(), knowledgeOfficeState(), knowledgePromptStore(), acceptedSourceBindings() (+6 more)

### Community 60 - "remove-candidate.ts"
Cohesion: 0.20
Nodes (16): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+8 more)

### Community 61 - "goal-reviews.ts"
Cohesion: 0.13
Nodes (18): applyGoalReview(), DailyResultSchema, EvidenceRefSchema, FreshDailyResultSchema, statusAllowed(), workEvidence(), GoalInput, saveGoal() (+10 more)

### Community 62 - "assignment-poll.ts"
Cohesion: 0.19
Nodes (13): noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), admitReadyCards(), WAIT_STATUSES, ACTIONS, OWNER, wikiSync (+5 more)

### Community 63 - ".getEffect"
Cohesion: 0.19
Nodes (11): GitHubOperations, digestNoticeNeverDispatched(), fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), goalNoticeNeverDispatched(), closeNativeRefresh(), fingerprint() (+3 more)

### Community 64 - "coordination.ts"
Cohesion: 0.17
Nodes (19): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation(), checkpointWindow(), dueAt() (+11 more)

### Community 65 - "constellation-runtime.ts"
Cohesion: 0.11
Nodes (25): KnowledgeMap, KnowledgeNode, CameraPose, flightPose(), cameraTarget(), Point, Constellation(), ConstellationView (+17 more)

### Community 66 - "admit-improvement.ts"
Cohesion: 0.23
Nodes (14): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+6 more)

### Community 67 - "service-health.ts"
Cohesion: 0.17
Nodes (10): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, slackHealth() (+2 more)

### Community 68 - "blocker-followups.ts"
Cohesion: 0.13
Nodes (28): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved() (+20 more)

### Community 69 - "owned-artifact.ts"
Cohesion: 0.24
Nodes (12): ghLogCacheEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_SOURCE_PATHS, officeSource(), ROOT, done() (+4 more)

### Community 70 - "diagnostic-context.ts"
Cohesion: 0.46
Nodes (4): diagnosticContext(), itAgent(), itDiagnostics(), currentServices()

### Community 71 - "fact-bounds.ts"
Cohesion: 0.28
Nodes (14): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+6 more)

### Community 72 - "process.ts"
Cohesion: 0.08
Nodes (31): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+23 more)

### Community 73 - "harnessEffect"
Cohesion: 0.20
Nodes (16): harnessEffect, readBackOrThrow(), retryRead(), developerPRContent(), Execute, lintPRContent(), officePRContent(), prContent (+8 more)

### Community 74 - "digest"
Cohesion: 0.19
Nodes (18): comparableSlackText(), AuthoredDigest, reconcileDigestAuthorship(), unitAuthorship(), reconcileAuthoredEvidence(), digest(), exactly(), Message (+10 more)

### Community 75 - "run-accounting.ts"
Cohesion: 0.12
Nodes (29): BoundedRead, backfillClaudeCost(), CompletionReader, codexHome(), createdAt(), dayDirs(), header(), readCodexRollout() (+21 more)

### Community 76 - "telemetry.ts"
Cohesion: 0.09
Nodes (29): CodexRollout, CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL (+21 more)

### Community 77 - "store.ts"
Cohesion: 0.19
Nodes (11): sanitizeObject(), applyConnectionSettings(), closeConnection(), optimizeOnOpen(), comparable(), EvidenceOutcome, recordRunEvidence(), statementCache() (+3 more)

### Community 78 - "shared.ts"
Cohesion: 0.07
Nodes (37): BrainStatusSchema, identity, coverageSchema, followupSchema, verified, ProjectReadiness, AssignmentResult, CompletionCondition (+29 more)

### Community 79 - "telemetry/report.ts"
Cohesion: 0.25
Nodes (14): validTicket(), telemetryRoute(), Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount() (+6 more)

### Community 80 - "Sources.tsx"
Cohesion: 0.22
Nodes (14): KnowledgeSourceSummary, AddPublicSource(), AddSourceForm(), SourceConnection, SourceCard(), supported, UploadSource(), WithdrawSource() (+6 more)

### Community 81 - "weekly-digest.ts"
Cohesion: 0.25
Nodes (13): independentDigestEvidence(), digestKnowledge(), prepareDigestBodies(), retainDigestBody(), citations(), recordAcceptedKnowledge(), stageName(), knowledgeCitation() (+5 more)

### Community 82 - ".pump"
Cohesion: 0.28
Nodes (3): mirrorOfficeKnowledge(), reviewSourceWithdrawals(), Offices

### Community 83 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 84 - "knowledge/learning-events.ts"
Cohesion: 0.21
Nodes (13): improvementIntakeGate(), learningDigest(), recordLearningOpportunity(), readAcceptedResult(), retainAcceptedResult(), improvementDigest(), ImprovementProposal, proposeImprovements() (+5 more)

### Community 85 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 86 - "cli.ts"
Cohesion: 0.25
Nodes (6): args, [cmd,...rawArgs], commands, key, projectIndex, PORT

### Community 87 - "merge-summary.ts"
Cohesion: 0.36
Nodes (7): clamp(), LIMITS, MergedPR, plainSlackText(), section(), shippedSummary(), mergeText()

### Community 88 - ".value"
Cohesion: 0.24
Nodes (6): file, folder, logs, root, xml(), ProjectProgress

### Community 89 - "OfficeProject"
Cohesion: 0.30
Nodes (10): AUTO_ADOPT_BOTS, goalEvidencePath(), OfficeConfigInputs, officeConfigRoute(), officeConfigSummary(), CECBinding, localBindings, assertModelOverrides() (+2 more)

### Community 90 - "extract-worker.mjs"
Cohesion: 0.70
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 91 - "dependency-edges.ts"
Cohesion: 1.00
Nodes (3): assertFeatureDependencyOrder(), featureDependencyEdges(), key()

### Community 92 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 95 - "DailyCTO.tsx"
Cohesion: 0.26
Nodes (8): CTOReview(), goalState, DailyCTO(), GoalHistory(), reportDate(), reviewStatus, reviewExcerpt(), ReviewText()

### Community 96 - "relink-pin-courier.ts"
Cohesion: 0.36
Nodes (7): findTrackingIssue(), editorMatches(), relinkPinCourier(), sha(), MISSING_NATIVE_LINK, resumeLinkedDelivery(), DependabotAdoption

### Community 97 - "json"
Cohesion: 0.60
Nodes (4): RequestContext, fileResponse(), json(), staticRoute()

### Community 98 - "launch-policy.ts"
Cohesion: 0.60
Nodes (4): LaunchPolicy, launchPolicyFacts(), LaunchPolicyReceipt, retainLaunchPolicy()

### Community 99 - "SlackIntakeStatus.tsx"
Cohesion: 0.60
Nodes (4): format, labels, SlackIntakeStatus(), time()

### Community 100 - "highestStableAtLeast"
Cohesion: 0.83
Nodes (3): compare(), highestStableAtLeast(), parts()

## Knowledge Gaps
- **386 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+381 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `engine.ts`, `artifact`, `github-delivery.ts`, `GitHubDelivery`, `office/config.ts`, `sourceVisible`, `outbox.ts`, `cec/workflow.ts`, `record-trigger.ts`, `agents.ts`, `source-amendment.ts`, `worker-runtime.ts`, `features.ts`, `notifications.ts`, `slack-intake/report.ts`, `closeout-recovery.ts`, `weekly-rollup.ts`, `dependencies.ts`, `easternDay`, `run-retrospective.ts`, `maintenance.ts`, `offices.ts`, `conversations/conversations.ts`, `azure.ts`, `.save`, `session-bridge.ts`, `schedule.ts`, `.emit`, `tracking-issue.ts`, `knowledge/routes.ts`, `WorkTime`, `scheduled-work.ts`, `OfficeSnapshot`, `dependency-bots/adopt.ts`, `slack-intake/run.ts`, `github/issue-publication.ts`, `investigations/run.ts`, `cec/issue-publication.ts`, `delivery-binding.ts`, `Coordinator`, `scheduler.ts`, `knowledge.ts`, `lesson-selection.ts`, `jira-time.ts`, `api-routes.ts`, `remove-candidate.ts`, `goal-reviews.ts`, `.getEffect`, `coordination.ts`, `admit-improvement.ts`, `blocker-followups.ts`, `diagnostic-context.ts`, `process.ts`, `harnessEffect`, `digest`, `run-accounting.ts`, `store.ts`, `shared.ts`, `telemetry/report.ts`, `weekly-digest.ts`, `.pump`, `knowledge/learning-events.ts`, `.value`, `dependency-edges.ts`, `relink-pin-courier.ts`?**
  _High betweenness centrality (0.110) - this node is a cross-community bridge._
- **Why does `command()` connect `process.ts` to `engine.ts`, `artifact`, `github-delivery.ts`, `GitHubDelivery`, `cec/workflow.ts`, `agents.ts`, `worker-runtime.ts`, `features.ts`, `notifications.ts`, `closeout-recovery.ts`, `dependencies.ts`, `maintenance.ts`, `azure.ts`, `Store`, `.save`, `session-bridge.ts`, `schedule.ts`, `tracking-issue.ts`, `knowledge/routes.ts`, `scheduled-work.ts`, `slack-intake/run.ts`, `github/issue-publication.ts`, `cec/issue-publication.ts`, `Coordinator`, `jira-time.ts`, `remove-candidate.ts`, `.getEffect`, `coordination.ts`, `admit-improvement.ts`, `service-health.ts`, `harnessEffect`, `command-registry.ts`, `.value`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `Role` connect `Role` to `artifact`, `github-delivery.ts`, `office/config.ts`, `outbox.ts`, `cx`, `cec/workflow.ts`, `index.tsx`, `App.tsx`, `agents.ts`, `worker-runtime.ts`, `run-retrospective.ts`, `maintenance.ts`, `conversations/conversations.ts`, `Store`, `.emit`, `projects.ts`, `OfficeSnapshot`, `scheduler.ts`, `api-routes.ts`, `run-accounting.ts`, `store.ts`, `shared.ts`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `command()` (e.g. with `.constructor()` and `executeRequest()`) actually correct?**
  _`command()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _386 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `engine.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07439613526570048 - nodes in this community are weakly interconnected._
- **Should `artifact` be split into smaller, more focused modules?**
  _Cohesion score 0.06670581327069877 - nodes in this community are weakly interconnected._