# Graph Report - office-it-clarity  (2026-11-10)

## Corpus Check
- 685 files · ~283,454 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3508 nodes · 15473 edges · 112 communities (107 shown, 5 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 96 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `77273e7a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- github-delivery.ts
- Inspector.tsx
- office/config.ts
- shared.ts
- App.tsx
- daily-cto.ts
- Store
- artifact
- record-trigger.ts
- index.tsx
- digest
- .transaction
- knowledge/routes.ts
- OfficeScene.tsx
- TicketJob
- source-amendment.ts
- workKey
- effects.ts
- MapView.tsx
- knowledge.ts
- http/commands.ts
- engine.ts
- accept-stage-result.ts
- Button
- schedule.ts
- worker-runtime.ts
- session-bridge.ts
- index.ts
- conversations/conversations.ts
- IntakeLedger
- SourceRegistry
- sourceVisible
- azure.ts
- store.ts
- delivery-repairs.ts
- run-retrospective.ts
- harnessEffect
- telemetry.ts
- digest
- run-accounting.ts
- tracking-issue.ts
- cec/workflow.ts
- knowledge/learning-events.ts
- cost-ledger.ts
- TelemetryPanel.tsx
- lesson-selection.ts
- maintenance.ts
- slack-intake/config.ts
- .save
- agents.ts
- scheduler.ts
- jira-time.ts
- .emit
- Coordinator
- it-specialist.ts
- offices.ts
- ServiceHealthPanel.tsx
- dependencies.ts
- contracts.ts
- slack-intake/report.ts
- dependency-bots/adopt.ts
- .run
- time-scope.ts
- Agents
- remove-candidate.ts
- scheduled-work.ts
- FeatureWorkspace.tsx
- investigations/run.ts
- notifications.ts
- assignment-poll.ts
- coordination.ts
- outbox.ts
- validate-stage.ts
- evidence.ts
- preferences-store.ts
- relink-pin-courier.ts
- brain-maintenance.ts
- GitHubIssuePublisher
- slack-intake/run.ts
- coordination-tick.ts
- .getEffect
- blocker-followups.ts
- conversations/slack.ts
- contract.ts
- useLiveTiming.ts
- .followup
- telemetry/report.ts
- outbound.ts
- projects.ts
- work.ts
- DailyCTO.tsx
- .value
- OfficeProject
- checkpoint-completion.ts
- cost-totals.ts
- .pump
- command-registry.ts
- SlackMessages
- codex-rollout.ts
- cli.ts
- CommittedBrain
- OfficeConfigView.tsx
- run-evidence.ts
- launch-policy.ts
- provider-observation.ts
- pr-body.ts
- extract-worker.mjs
- SlackIntakeStatus.tsx
- BrainFollowup
- slack-supersession.ts
- helper-evidence.py

## God Nodes (most connected - your core abstractions)
1. `Store` - 316 edges
2. `TicketJob` - 134 edges
3. `GitHubDelivery` - 122 edges
4. `command()` - 103 edges
5. `artifact()` - 89 edges
6. `cx()` - 88 edges
7. `digest()` - 86 edges
8. `workKey()` - 85 edges
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

## Communities (112 total, 5 thin omitted)

### Community 0 - "github-delivery.ts"
Cohesion: 0.07
Nodes (67): findingsBlock(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery(), BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE (+59 more)

### Community 1 - "Inspector.tsx"
Cohesion: 0.07
Nodes (64): Conversation(), Outbox(), SendMessage, slackMessageStatus(), SlackDeliveryCard(), labels, BlockerFollowups(), BrainWorkspace() (+56 more)

### Community 2 - "office/config.ts"
Cohesion: 0.07
Nodes (67): savedActivationFailure(), candidateInput(), children, oldAdoptionBasis(), savedCandidateAdmission, assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate() (+59 more)

### Community 3 - "shared.ts"
Cohesion: 0.06
Nodes (63): ProjectReadiness, DailyCTOSummary, Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+55 more)

### Community 4 - "App.tsx"
Cohesion: 0.05
Nodes (63): compactSteps(), themeColor, App(), BrainWorkspace, CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants (+55 more)

### Community 5 - "daily-cto.ts"
Cohesion: 0.06
Nodes (46): mirror(), runWeeklyResearch(), scheduledResearch(), collectCTOFacts(), DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt() (+38 more)

### Community 6 - "Store"
Cohesion: 0.05
Nodes (16): GitHubFeaturePublisher, Result, Assessment, Engine, OfficeEntry, Store, probeProcessGroup(), GIT_NETWORK (+8 more)

### Community 7 - "artifact"
Cohesion: 0.10
Nodes (64): containedFile(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal (+56 more)

### Community 8 - "record-trigger.ts"
Cohesion: 0.06
Nodes (60): deliveryMetrics(), median(), baselineLearning(), LEARNING_BASELINES, maintainLearning(), maintenanceSubject(), MaintenanceSubjectFacts, busyMaintenanceIds() (+52 more)

### Community 9 - "index.tsx"
Cohesion: 0.08
Nodes (52): KnowledgeSourceSummary, AddPublicSource(), AddSourceForm(), SourceConnection, SourceCard(), Sources(), supported, UploadSource() (+44 more)

### Community 10 - "digest"
Cohesion: 0.09
Nodes (59): closeoutReceipt(), boardPreflightCandidate(), Ownership, reconcileBoardPreflight(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership (+51 more)

### Community 11 - ".transaction"
Cohesion: 0.10
Nodes (49): approveFeature(), assertRetainedItems(), commandFeature(), createFeature(), featureById(), mutation(), reviewQuestions(), discoveryPrompt() (+41 more)

### Community 12 - "knowledge/routes.ts"
Cohesion: 0.08
Nodes (43): captureAfter(), CaptureMetadata, capturePage(), cursor(), key(), intakeActivity(), knowledgeActivityPage(), assignmentKnowledge() (+35 more)

### Community 13 - "OfficeScene.tsx"
Cohesion: 0.06
Nodes (57): displayAgentTask(), withoutElapsed(), CameraBookmark, restoreBookmark(), LiveAgentTask(), Props, RunningTask(), text() (+49 more)

### Community 14 - "TicketJob"
Cohesion: 0.07
Nodes (33): dependabotReviewGuidance(), StageContext, GitHubDelivery, stagePrompt(), StagePromptInput, completedPRReviews(), implementationContinuationInstruction(), providerFacts() (+25 more)

### Community 15 - "source-amendment.ts"
Cohesion: 0.07
Nodes (62): approvedText(), assert(), amendmentIssueSha256(), authorizeSourceAmendment(), Binding, assert(), normalize(), officialUrls (+54 more)

### Community 16 - "workKey"
Cohesion: 0.08
Nodes (52): adoptCandidate(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat() (+44 more)

### Community 17 - "effects.ts"
Cohesion: 0.11
Nodes (22): Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), plainDescription(), Transition, JiraFeaturePublisher (+14 more)

### Community 18 - "MapView.tsx"
Cohesion: 0.08
Nodes (35): KnowledgeActivity, KnowledgeEdge, KnowledgeIntakeStatus, KnowledgeMap, KnowledgeNode, CameraPose, flightPose(), cameraTarget() (+27 more)

### Community 19 - "knowledge.ts"
Cohesion: 0.10
Nodes (32): LessonSelection, AssignmentLookups, Binding, lookupInstructions(), lookupJournal, citations(), recordAcceptedKnowledge(), stageName() (+24 more)

### Community 20 - "http/commands.ts"
Cohesion: 0.10
Nodes (35): retryRecipientLookup(), bindDiscoveryResume(), DiscoveryResumeInput, Accepted, normalizeStatement(), RETROSPECTIVE_HISTORY, configureDigestDelivery(), DigestSettings (+27 more)

### Community 21 - "engine.ts"
Cohesion: 0.10
Nodes (34): JiraOperations, plain(), unpack(), checkMail(), drainMail(), requestMail(), dispatchNightly(), drainDelivery() (+26 more)

### Community 22 - "accept-stage-result.ts"
Cohesion: 0.12
Nodes (39): acceptStageResult(), PrerequisitesSchema, linkDraftIssue(), protectedOriginalClaim(), publicationReadArgs(), Read, readPublication(), mergeAuthorized() (+31 more)

### Community 23 - "Button"
Cohesion: 0.12
Nodes (26): KnowledgeCapturePage, KnowledgeActivityPage, Activity(), ActivityStatus(), AssignmentKnowledge(), CaptureReviewDetail(), CaptureReviews(), empty (+18 more)

### Community 24 - "schedule.ts"
Cohesion: 0.12
Nodes (30): learningMetrics(), lessonsNeedingReview(), RollupResult, RollupResultSchema, KnowledgeRunner, retryDelay(), LinkResult, PublicReadPolicy (+22 more)

### Community 25 - "worker-runtime.ts"
Cohesion: 0.08
Nodes (31): SlackResultSchema, SlackVerificationSchema, candidateWorkspaceEnvironment(), CODEX_DEFAULT_EFFORT, CODEX_DEFAULT_MODEL, CODEX_EFFORTS, CODEX_ROLES, ModelRoute (+23 more)

### Community 26 - "session-bridge.ts"
Cohesion: 0.10
Nodes (28): claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexSessionContext(), readRollout, claudeSessions(), codexSessions() (+20 more)

### Community 27 - "index.ts"
Cohesion: 0.10
Nodes (29): close(), config, itSpecialist, loadedRevision, offices, releaseLock, server, serviceHealth (+21 more)

### Community 28 - "conversations/conversations.ts"
Cohesion: 0.13
Nodes (24): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, ReplySchema, pumpCTO(), queueCTOHandoff(), saveGoals() (+16 more)

### Community 29 - "IntakeLedger"
Cohesion: 0.14
Nodes (27): newTask(), recordObservation(), settlePage(), LIMITS, DERIVED, IntakeLedger, acceptProposals(), linkKey() (+19 more)

### Community 30 - "SourceRegistry"
Cohesion: 0.10
Nodes (21): isStoppingFor(), reconcileIntakeStatus(), reconcileIntakeReports(), scheduledSlackIntake(), Command, sourceCommand(), IntakeBinding, sourceList() (+13 more)

### Community 31 - "sourceVisible"
Cohesion: 0.17
Nodes (27): knowledgeActivity(), guidanceExcerpt(), knowledgeSnapshot(), officeKnowledgeSnapshot(), publicReference(), lookupSummaryVisible(), publicLookupSummary(), evidenceTitle() (+19 more)

### Community 32 - "azure.ts"
Cohesion: 0.10
Nodes (27): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+19 more)

### Community 33 - "store.ts"
Cohesion: 0.10
Nodes (19): assertFeatureDependencyOrder(), featureDependencyEdges(), key(), Clock, applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration (+11 more)

### Community 34 - "delivery-repairs.ts"
Cohesion: 0.16
Nodes (26): removeAdoptedClone(), namedRepairIds(), lintPRContent(), adoptedReviewCandidate(), ciCheckout(), finishCISetup(), verifyCIHooks(), CIFailure (+18 more)

### Community 35 - "run-retrospective.ts"
Cohesion: 0.13
Nodes (27): acceptRetrospective(), appendLearningFacts(), freezeLearningPacket(), ARTIFACT_LIMIT, clip(), LEDGER_STEPS, MAINTENANCE_LIMIT, maintenanceFacts() (+19 more)

### Community 36 - "harnessEffect"
Cohesion: 0.17
Nodes (24): MOVABLE, moveLane(), harnessCloseout(), PASSING, verifyMergeActions(), harnessEffect, assertMayMutate(), retryRead() (+16 more)

### Community 37 - "telemetry.ts"
Cohesion: 0.09
Nodes (28): CodexRollout, CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL (+20 more)

### Community 38 - "digest"
Cohesion: 0.18
Nodes (22): comparableSlackText(), createExtractor(), extractDocument, Extraction, Extractor, uploadArtifact(), AuthoredDigest, reconcileDigestAuthorship() (+14 more)

### Community 39 - "run-accounting.ts"
Cohesion: 0.12
Nodes (29): BoundedRead, backfillClaudeCost(), CompletionReader, codexHome(), createdAt(), dayDirs(), header(), readCodexRollout() (+21 more)

### Community 40 - "tracking-issue.ts"
Cohesion: 0.20
Nodes (25): Lane, resolveLane(), cardStatus(), Execute, ProjectCard, projectCards(), projectGraphql(), setCardStatus() (+17 more)

### Community 41 - "cec/workflow.ts"
Cohesion: 0.18
Nodes (25): parksInJira(), run(), advance(), nextStage(), publicationEvidenceGap(), qaEvidenceGap(), resultGate(), stageResultGap() (+17 more)

### Community 42 - "knowledge/learning-events.ts"
Cohesion: 0.13
Nodes (24): distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementIntakeGate(), captureLearning(), learningDigest(), recordLearningOpportunity() (+16 more)

### Community 43 - "cost-ledger.ts"
Cohesion: 0.18
Nodes (24): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId(), OutsideEdit (+16 more)

### Community 44 - "TelemetryPanel.tsx"
Cohesion: 0.16
Nodes (22): cecChatPrompt(), TelemetryReport, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens(), usd() (+14 more)

### Community 45 - "lesson-selection.ts"
Cohesion: 0.12
Nodes (25): knowledgeContext(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), MAINTENANCE, MAX_LESSONS (+17 more)

### Community 46 - "maintenance.ts"
Cohesion: 0.14
Nodes (18): captureMaintenanceStep(), candidateOwner(), SETTLED, skipOwnedCandidate(), Skipped, skippedCandidateLedger(), CmsFollowUpContext, cmsFollowUpInstructions() (+10 more)

### Community 47 - "slack-intake/config.ts"
Cohesion: 0.14
Nodes (22): Config, configDigest(), IntakeConfig, readConfig(), exactly(), Message, nativeReadPayload(), pagination() (+14 more)

### Community 48 - ".save"
Cohesion: 0.25
Nodes (23): BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue(), readIssues(), commentDecision() (+15 more)

### Community 49 - "agents.ts"
Cohesion: 0.11
Nodes (21): cecPrompt(), resolvedDecisionNote(), stageInstructions, HANDS_OFF_RESOLUTION_GUIDANCE, RESOLUTION_GUIDANCE, reviewInstructions(), GOAL_REPORT_GUIDANCE, labels (+13 more)

### Community 50 - "scheduler.ts"
Cohesion: 0.16
Nodes (13): ROLES, officeCapacity, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch() (+5 more)

### Community 51 - "jira-time.ts"
Cohesion: 0.14
Nodes (19): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+11 more)

### Community 52 - ".emit"
Cohesion: 0.21
Nodes (15): MessageInput, projectSlackDeliveries(), settleRequestedSlackReplacement(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint(), supersedingDelivery() (+7 more)

### Community 53 - "Coordinator"
Cohesion: 0.08
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 54 - "it-specialist.ts"
Cohesion: 0.17
Nodes (17): savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), ITContext, publishITReport(), delays, recoverAttempt() (+9 more)

### Community 55 - "offices.ts"
Cohesion: 0.17
Nodes (15): retainedArtifactScope(), eventSourceBindings(), eventVisible(), leadershipContext(), leadershipEntries(), exposureBindings(), requestSourceBindings(), knowledgeEntries() (+7 more)

### Community 56 - "ServiceHealthPanel.tsx"
Cohesion: 0.13
Nodes (16): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, slackHealth(), itAgent() (+8 more)

### Community 57 - "dependencies.ts"
Cohesion: 0.19
Nodes (19): Admission, admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, resumeParked(), compatible(), dependencyCompletionKey() (+11 more)

### Community 58 - "contracts.ts"
Cohesion: 0.21
Nodes (15): captureProposal(), effectId(), CaptureReceipt, ChannelProgress, IntakeResult, IntakeResultValue, ReadKind, assertProposalScope() (+7 more)

### Community 59 - "slack-intake/report.ts"
Cohesion: 0.22
Nodes (19): Proposal, ReadTask, intakeProgress(), terminalDeferred(), unitKey(), verifiedCapture(), LinkRecord, referenceIndex (+11 more)

### Community 60 - "dependency-bots/adopt.ts"
Cohesion: 0.22
Nodes (19): adoptDependabot(), closesIssue(), linkedBody(), linkPR(), dependabotPR, openDependabotPulls(), readRepo(), refusal() (+11 more)

### Community 61 - ".run"
Cohesion: 0.15
Nodes (13): featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), recoverFeatures(), observeHelperGroups(), stopHelperGroups(), FeatureReviewRunner, assignmentSubject() (+5 more)

### Community 62 - "time-scope.ts"
Cohesion: 0.21
Nodes (20): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), scopeSelector(), midnight(), TicketDay, ticketDayTotals(), captureTime(), timeLedger() (+12 more)

### Community 63 - "Agents"
Cohesion: 0.15
Nodes (12): cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), slackSendPrompt(), slackVerifyPrompt(), PICKUP_CHAT, PickupSchema (+4 more)

### Community 64 - "remove-candidate.ts"
Cohesion: 0.20
Nodes (16): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+8 more)

### Community 65 - "scheduled-work.ts"
Cohesion: 0.17
Nodes (18): deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), deterministicActions, eligible() (+10 more)

### Community 66 - "FeatureWorkspace.tsx"
Cohesion: 0.16
Nodes (16): FeatureRound, FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures(), draftKey() (+8 more)

### Community 67 - "investigations/run.ts"
Cohesion: 0.20
Nodes (15): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, OFFICE_FIX_PROMPT, OfficeFixResult, validateOfficeFix(), investigationReady(), InvestigationOptions, InvestigationReport (+7 more)

### Community 68 - "notifications.ts"
Cohesion: 0.16
Nodes (16): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR (+8 more)

### Community 69 - "assignment-poll.ts"
Cohesion: 0.16
Nodes (14): noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), pinCourier, ACTIONS, OWNER, wikiSync, due() (+6 more)

### Community 70 - "coordination.ts"
Cohesion: 0.18
Nodes (18): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation(), checkpointWindow(), dueAt() (+10 more)

### Community 71 - "outbox.ts"
Cohesion: 0.21
Nodes (14): projectOutbox(), syncOutbox(), slackRequestSettled(), knowledgeOutbox(), checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), repeatedVendorReviewBlock() (+6 more)

### Community 72 - "validate-stage.ts"
Cohesion: 0.17
Nodes (16): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+8 more)

### Community 73 - "evidence.ts"
Cohesion: 0.21
Nodes (14): ghLogCacheEvidence(), investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_SOURCE_PATHS, officeSource(), ROOT (+6 more)

### Community 74 - "preferences-store.ts"
Cohesion: 0.14
Nodes (14): PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, acceptPreferences(), PreferenceCandidate, PreferenceState (+6 more)

### Community 75 - "relink-pin-courier.ts"
Cohesion: 0.18
Nodes (16): readBackOrThrow(), ensureTrackingIssue(), findTrackingIssue(), ownTracking(), trackingIssueBody(), trackingIssueTitle(), trackingMarker(), centralCompanionHandoff() (+8 more)

### Community 76 - "brain-maintenance.ts"
Cohesion: 0.20
Nodes (11): maintenancePolicies(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice(), easternDate(), weeklyDue() (+3 more)

### Community 77 - "GitHubIssuePublisher"
Cohesion: 0.28
Nodes (6): Assign, Board, GitHubIssuePublisher, number(), same(), label()

### Community 78 - "slack-intake/run.ts"
Cohesion: 0.20
Nodes (12): independentIntakeResult(), Observation, Message, observeRead(), Page, readArguments(), readMethod(), ReadUnavailable (+4 more)

### Community 79 - "coordination-tick.ts"
Cohesion: 0.20
Nodes (13): reconcileNoticeConfirmations(), brainCheckpointCompletion(), reconcileCompletedCheckpoints(), legacy, reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION (+5 more)

### Community 80 - ".getEffect"
Cohesion: 0.28
Nodes (6): GitHubOperations, fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), closeNativeRefresh(), fingerprint()

### Community 81 - "blocker-followups.ts"
Cohesion: 0.28
Nodes (11): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), readBackConversations(), diagnosticContext(), diagnosticSnapshot(), nativeDeliveryResolved() (+3 more)

### Community 82 - "conversations/slack.ts"
Cohesion: 0.26
Nodes (10): digestNoticeNeverDispatched(), goalNoticeAuthorized(), goalNoticeNeverDispatched(), sendGoalNotice(), maintenanceNoticeAuthorized(), maintenanceNoticeNeverDispatched(), sendMaintenanceNotice(), Effects (+2 more)

### Community 83 - "contract.ts"
Cohesion: 0.22
Nodes (11): At, Errno, GroupInventory, GroupProbe, LifecycleDiagnostic, Phase, Pid, groupInventory() (+3 more)

### Community 84 - "useLiveTiming.ts"
Cohesion: 0.26
Nodes (12): AzureBuild, lastWall, sample(), subscribe(), subscribers, useLiveClock(), liveBuildTiming(), liveTiming() (+4 more)

### Community 85 - ".followup"
Cohesion: 0.18
Nodes (9): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), ctoChatPrompt(), itChatPrompt(), canFileGithubIssue(), githubFollowupPrompt(), knowledgeChatPrompt() (+1 more)

### Community 86 - "telemetry/report.ts"
Cohesion: 0.29
Nodes (12): Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked(), row() (+4 more)

### Community 87 - "outbound.ts"
Cohesion: 0.32
Nodes (8): assertDigestDispatch(), outboundBody(), retainOutboundBody(), digestNoticeRequest(), queueOutboundDigests(), sendDigestNotice(), Target, knowledgeScopeRevision()

### Community 88 - "projects.ts"
Cohesion: 0.26
Nodes (8): readLocalIntakeReport(), LOCAL_BINDINGS, file, project, root, DeliverySlot, projectById(), projectData()

### Community 89 - "work.ts"
Cohesion: 0.17
Nodes (11): AssignmentResult, CompletionCondition, Continuation, DependencyObservation, EligibilityState, FailureCategory, ReconciliationAction, WorkAssignment (+3 more)

### Community 90 - "DailyCTO.tsx"
Cohesion: 0.26
Nodes (8): CTOReview(), goalState, DailyCTO(), GoalHistory(), reportDate(), reviewStatus, reviewExcerpt(), ReviewText()

### Community 91 - ".value"
Cohesion: 0.27
Nodes (6): file, folder, logs, root, xml(), ProjectProgress

### Community 92 - "OfficeProject"
Cohesion: 0.33
Nodes (9): AUTO_ADOPT_BOTS, OfficeConfigInputs, officeConfigRoute(), officeConfigSummary(), CECBinding, localBindings, assertModelOverrides(), ModelOverrides (+1 more)

### Community 93 - "checkpoint-completion.ts"
Cohesion: 0.24
Nodes (7): BrainStatusSchema, identity, coverageSchema, followupSchema, verified, ReconciliationRequest, DailyCheckpoint

### Community 94 - "cost-totals.ts"
Cohesion: 0.33
Nodes (9): isModelWork(), isTicketModelWork(), ScopePolicy, awaitingEvidence(), CaptureContext, inCostWindow(), TicketCost, ticketCosts() (+1 more)

### Community 96 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 98 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 99 - "cli.ts"
Cohesion: 0.25
Nodes (6): args, [cmd,...rawArgs], commands, key, projectIndex, PORT

### Community 101 - "OfficeConfigView.tsx"
Cohesion: 0.48
Nodes (5): loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView(), OfficeConfigSummary

### Community 102 - "run-evidence.ts"
Cohesion: 0.47
Nodes (4): comparable(), EvidenceOutcome, recordRunEvidence(), RunAccounting

### Community 103 - "launch-policy.ts"
Cohesion: 0.47
Nodes (5): LaunchPolicy, launchPolicyFacts(), LaunchPolicyReceipt, retainLaunchPolicy(), workerLaunchPolicy()

### Community 104 - "provider-observation.ts"
Cohesion: 0.60
Nodes (4): correlatedBuild(), observe(), observeParked(), parkedReadError

### Community 105 - "pr-body.ts"
Cohesion: 0.60
Nodes (4): developerPRContent(), Execute, officePRContent(), prContent

### Community 106 - "extract-worker.mjs"
Cohesion: 0.70
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 107 - "SlackIntakeStatus.tsx"
Cohesion: 0.60
Nodes (4): format, labels, SlackIntakeStatus(), time()

### Community 109 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

## Knowledge Gaps
- **387 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+382 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `github-delivery.ts`, `office/config.ts`, `shared.ts`, `daily-cto.ts`, `artifact`, `record-trigger.ts`, `digest`, `.transaction`, `knowledge/routes.ts`, `TicketJob`, `source-amendment.ts`, `workKey`, `effects.ts`, `knowledge.ts`, `http/commands.ts`, `engine.ts`, `accept-stage-result.ts`, `schedule.ts`, `worker-runtime.ts`, `session-bridge.ts`, `index.ts`, `conversations/conversations.ts`, `SourceRegistry`, `azure.ts`, `store.ts`, `delivery-repairs.ts`, `run-retrospective.ts`, `harnessEffect`, `digest`, `run-accounting.ts`, `tracking-issue.ts`, `knowledge/learning-events.ts`, `cost-ledger.ts`, `TelemetryPanel.tsx`, `lesson-selection.ts`, `maintenance.ts`, `slack-intake/config.ts`, `.save`, `agents.ts`, `scheduler.ts`, `jira-time.ts`, `.emit`, `it-specialist.ts`, `offices.ts`, `dependencies.ts`, `contracts.ts`, `slack-intake/report.ts`, `dependency-bots/adopt.ts`, `.run`, `time-scope.ts`, `Agents`, `remove-candidate.ts`, `scheduled-work.ts`, `investigations/run.ts`, `notifications.ts`, `coordination.ts`, `validate-stage.ts`, `evidence.ts`, `relink-pin-courier.ts`, `brain-maintenance.ts`, `slack-intake/run.ts`, `coordination-tick.ts`, `.getEffect`, `blocker-followups.ts`, `conversations/slack.ts`, `.followup`, `outbound.ts`, `checkpoint-completion.ts`, `SlackMessages`, `run-evidence.ts`?**
  _High betweenness centrality (0.129) - this node is a cross-community bridge._
- **Why does `command()` connect `Store` to `github-delivery.ts`, `digest`, `.transaction`, `knowledge/routes.ts`, `TicketJob`, `workKey`, `effects.ts`, `engine.ts`, `accept-stage-result.ts`, `worker-runtime.ts`, `session-bridge.ts`, `azure.ts`, `delivery-repairs.ts`, `harnessEffect`, `digest`, `tracking-issue.ts`, `cost-ledger.ts`, `maintenance.ts`, `.save`, `agents.ts`, `jira-time.ts`, `it-specialist.ts`, `ServiceHealthPanel.tsx`, `dependencies.ts`, `contracts.ts`, `.run`, `remove-candidate.ts`, `scheduled-work.ts`, `notifications.ts`, `coordination.ts`, `validate-stage.ts`, `brain-maintenance.ts`, `contract.ts`, `command-registry.ts`, `provider-observation.ts`, `pr-body.ts`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `Role` connect `shared.ts` to `github-delivery.ts`, `Inspector.tsx`, `App.tsx`, `record-trigger.ts`, `OfficeScene.tsx`, `TicketJob`, `http/commands.ts`, `accept-stage-result.ts`, `worker-runtime.ts`, `conversations/conversations.ts`, `store.ts`, `run-accounting.ts`, `cec/workflow.ts`, `TelemetryPanel.tsx`, `maintenance.ts`, `agents.ts`, `scheduler.ts`, `.emit`, `offices.ts`, `.run`, `Agents`, `outbox.ts`, `validate-stage.ts`, `.followup`, `projects.ts`, `work.ts`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `command()` (e.g. with `.constructor()` and `executeRequest()`) actually correct?**
  _`command()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _387 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `github-delivery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07116104868913857 - nodes in this community are weakly interconnected._
- **Should `Inspector.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07340823970037454 - nodes in this community are weakly interconnected._