# Graph Report - office-fresh156  (2026-11-11)

## Corpus Check
- 800 files · ~317,902 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3943 nodes · 18163 edges · 109 communities (106 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 110 edges (avg confidence: 0.74)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c5cc698f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- github-delivery.ts
- requests.ts
- artifact
- move-lane.ts
- schedule.ts
- Inspector.tsx
- knowledge.ts
- features/workflow.ts
- readback-evidence.ts
- knowledge/routes.ts
- cec/workflow.ts
- OfficeScene.tsx
- digest
- SourceRegistry
- effects.ts
- source-amendment.ts
- index.tsx
- Store
- constellation-runtime.ts
- Button
- agents.ts
- cost-ledger.ts
- scheduled-captures.ts
- worker-runtime.ts
- shared.ts
- read-links.ts
- ticket-evidence.ts
- it-specialist.ts
- record-trigger.ts
- OfficeSnapshot
- store.ts
- maintenance/maintenance.ts
- App.tsx
- JiraIssuePublisher
- Role
- features.ts
- conversations/conversations.ts
- time-scope.ts
- engine.ts
- index.ts
- conversations/slack.ts
- azure.ts
- .emit
- digest
- task-briefing.ts
- CommittedBrain
- run-cost.ts
- GitHubDelivery
- easternDay
- scheduler.ts
- run-accounting.ts
- outbox.ts
- coordination.ts
- run-retrospective.ts
- accept-stage-result.ts
- QuestionStepper.tsx
- sourceVisible
- preferences-store.ts
- processGroupAlive
- assignment-poll.ts
- lesson-selection.ts
- remove-candidate.ts
- .getEffect
- TelemetryPanel.tsx
- Coordinator
- session-bridge.ts
- api-routes.ts
- Offices
- coordination-tick.ts
- jira-time.ts
- sanitize
- fact-bounds.ts
- contract.ts
- owned-artifact.ts
- slack-intake/report.ts
- offices.ts
- .save
- WorkTime
- scheduled-work.ts
- DailyCTO.tsx
- create-candidate.ts
- notifications.ts
- command-registry.ts
- codex-rollout.ts
- tracking-issue.ts
- Agents
- model-routes.ts
- OfficeConfigView.tsx
- extract-worker.mjs
- dependency-bots/adopt.ts
- slack-supersession.ts
- helper-evidence.py
- office-lessons.ts
- slack-intake/config.ts
- delivery-task.ts
- workKey
- discovery-recovery.ts
- telemetry.ts
- .value
- mailbox.ts
- private-result.ts
- harnessEffect
- interrupted-work-recovery.ts
- codex-rollout-file.ts
- documentText
- run-usage.ts
- liveReach
- improvement-incident.ts

## God Nodes (most connected - your core abstractions)
1. `Store` - 362 edges
2. `TicketJob` - 165 edges
3. `GitHubDelivery` - 144 edges
4. `digest()` - 134 edges
5. `artifact()` - 117 edges
6. `command()` - 109 edges
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

## Communities (109 total, 3 thin omitted)

### Community 0 - "github-delivery.ts"
Cohesion: 0.05
Nodes (102): containedFile(), removeAdoptedClone(), harnessCloseout(), PASSING, verifyMergeActions(), findingsBlock(), namedRepairIds(), requireDeliveryAuthority() (+94 more)

### Community 1 - "requests.ts"
Cohesion: 0.05
Nodes (112): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+104 more)

### Community 2 - "artifact"
Cohesion: 0.05
Nodes (119): recordJobApproach(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal (+111 more)

### Community 3 - "move-lane.ts"
Cohesion: 0.15
Nodes (30): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard, projectCards() (+22 more)

### Community 4 - "schedule.ts"
Cohesion: 0.10
Nodes (38): captureProposal(), effectId(), newTask(), recordObservation(), settlePage(), CaptureReceipt, ChannelProgress, LIMITS (+30 more)

### Community 5 - "Inspector.tsx"
Cohesion: 0.07
Nodes (62): Conversation(), Outbox(), SendMessage, recommendedReply(), slackMessageStatus(), SlackDeliveryCard(), labels, BlockerFollowups() (+54 more)

### Community 6 - "knowledge.ts"
Cohesion: 0.07
Nodes (44): learningMetrics(), lessonsNeedingReview(), publicTopicSafe(), researchTopics(), TEMPLATES, Kind, RetrospectiveResult, RollupResult (+36 more)

### Community 7 - "features/workflow.ts"
Cohesion: 0.07
Nodes (50): approveFeature(), mutation(), discoveryPrompt(), planPrompt(), artifactPath(), digest(), document(), featureRoot() (+42 more)

### Community 8 - "readback-evidence.ts"
Cohesion: 0.06
Nodes (66): deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, deliveryIntakeBlocker(), gateRegisteredDelivery(), accounting, DeliverySubject (+58 more)

### Community 9 - "knowledge/routes.ts"
Cohesion: 0.09
Nodes (37): captureAfter(), CaptureMetadata, capturePage(), cursor(), key(), intakeActivity(), knowledgeActivityPage(), captureIdentityMatches() (+29 more)

### Community 10 - "cec/workflow.ts"
Cohesion: 0.17
Nodes (27): correlatedBuild(), parksInJira(), run(), advance(), nextStage(), publicationEvidenceGap(), qaEvidenceGap(), resultGate() (+19 more)

### Community 11 - "OfficeScene.tsx"
Cohesion: 0.06
Nodes (58): displayAgentTask(), withoutElapsed(), CameraBookmark, restoreBookmark(), LiveAgentTask(), Props, RunningTask(), text() (+50 more)

### Community 12 - "digest"
Cohesion: 0.14
Nodes (42): retryRead(), admitPRMetadata(), assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema, savedMetadataAssessment(), validateSaved() (+34 more)

### Community 13 - "SourceRegistry"
Cohesion: 0.10
Nodes (29): Config, configDigest(), IntakeConfig, readConfig(), SlackReadAuthority, readAuthority(), Command, sourceCommand() (+21 more)

### Community 14 - "effects.ts"
Cohesion: 0.10
Nodes (26): Content, jiraText(), descriptionPreimage(), plain(), featureById(), FeaturePublisher, publishFeature(), reconcilePublication() (+18 more)

### Community 15 - "source-amendment.ts"
Cohesion: 0.07
Nodes (66): adoptCandidate(), reported, Scope, approvedText(), assert(), amendmentInstruction(), amendmentIssueSha256(), authorizeSourceAmendment() (+58 more)

### Community 16 - "index.tsx"
Cohesion: 0.08
Nodes (51): KnowledgeSourceSummary, AddPublicSource(), AddSourceForm(), SourceConnection, SourceCard(), supported, UploadSource(), WithdrawSource() (+43 more)

### Community 17 - "Store"
Cohesion: 0.05
Nodes (18): GitHubFeaturePublisher, JiraFeaturePublisher, GitHubMonitor, Result, Assessment, Engine, observe(), observeParked() (+10 more)

### Community 18 - "constellation-runtime.ts"
Cohesion: 0.07
Nodes (41): KnowledgeActivity, KnowledgeEdge, KnowledgeIntakeStatus, KnowledgeMap, KnowledgeNode, CameraPose, flightPose(), cameraTarget() (+33 more)

### Community 19 - "Button"
Cohesion: 0.10
Nodes (34): KnowledgeCapturePage, KnowledgeActivityPage, Activity(), ActivityStatus(), AssignmentKnowledge(), CaptureReviewDetail(), CaptureReviews(), empty (+26 more)

### Community 20 - "agents.ts"
Cohesion: 0.08
Nodes (29): cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), cecChatPrompt(), ctoChatPrompt(), slackSendPrompt(), slackVerifyPrompt() (+21 more)

### Community 21 - "cost-ledger.ts"
Cohesion: 0.16
Nodes (26): validTicket(), captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId() (+18 more)

### Community 22 - "scheduled-captures.ts"
Cohesion: 0.16
Nodes (43): createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest, captureRequests() (+35 more)

### Community 23 - "worker-runtime.ts"
Cohesion: 0.09
Nodes (28): SlackResultSchema, SlackVerificationSchema, candidateWorkspaceEnvironment(), LOCAL_BINDINGS, contextPacket(), DeliverySlot, ModelRoute, ClaudeStream (+20 more)

### Community 24 - "shared.ts"
Cohesion: 0.04
Nodes (71): Admission, diagnosticContext(), listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes (+63 more)

### Community 25 - "read-links.ts"
Cohesion: 0.22
Nodes (9): KnowledgeRunner, retryDelay(), LinkResult, PublicReadPolicy, mirror(), ResearchResult, runWeeklyResearch(), scheduledResearch() (+1 more)

### Community 26 - "ticket-evidence.ts"
Cohesion: 0.13
Nodes (31): unpack(), jiraRecord(), assetDownloader(), attachmentKind(), evidenceDirectory(), readEvidence(), storeEvidence(), blankEvidence() (+23 more)

### Community 27 - "it-specialist.ts"
Cohesion: 0.17
Nodes (15): partialLocalCleanupKey(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), ITContext, publishITReport(), delays (+7 more)

### Community 28 - "record-trigger.ts"
Cohesion: 0.06
Nodes (66): deliveryMetrics(), median(), baselineLearning(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences(), maintenanceSubject() (+58 more)

### Community 29 - "OfficeSnapshot"
Cohesion: 0.09
Nodes (38): FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures(), TicketPlanningAction(), App() (+30 more)

### Community 30 - "store.ts"
Cohesion: 0.12
Nodes (18): CommentPage, commentReadback(), JiraOperations, plain(), itChatPrompt(), PICKUP_CHAT, assignmentSubject(), assertRetainedDispatchScope() (+10 more)

### Community 31 - "maintenance/maintenance.ts"
Cohesion: 0.06
Nodes (51): ApproachSchema, maintenancePolicies(), completeNativeCheckpoint(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, BrainStatusSchema, identity (+43 more)

### Community 32 - "App.tsx"
Cohesion: 0.05
Nodes (41): themeColor, BrainWorkspace, CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants, ElevatorPhase, floorVariants (+33 more)

### Community 33 - "JiraIssuePublisher"
Cohesion: 0.14
Nodes (13): Assignment, JiraIssuePublisher, keyOf(), Transition, publicationDescription(), PublicationReceipt, Assign, Board (+5 more)

### Community 34 - "Role"
Cohesion: 0.10
Nodes (41): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+33 more)

### Community 35 - "features.ts"
Cohesion: 0.07
Nodes (62): commandFeature(), reviewQuestions(), featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS (+54 more)

### Community 36 - "conversations/conversations.ts"
Cohesion: 0.08
Nodes (33): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+25 more)

### Community 37 - "time-scope.ts"
Cohesion: 0.14
Nodes (29): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence(), CaptureContext (+21 more)

### Community 38 - "engine.ts"
Cohesion: 0.16
Nodes (26): dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), resume(), startPilot(), eligibility(), approvedDelivery() (+18 more)

### Community 39 - "index.ts"
Cohesion: 0.08
Nodes (34): args, [cmd,...rawArgs], commands, key, projectIndex, redact(), close(), config (+26 more)

### Community 40 - "conversations/slack.ts"
Cohesion: 0.33
Nodes (8): assertDigestDispatch(), outboundBody(), retainOutboundBody(), digestNoticeRequest(), queueOutboundDigests(), sendDigestNotice(), Target, knowledgeScopeRevision()

### Community 41 - "azure.ts"
Cohesion: 0.11
Nodes (29): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+21 more)

### Community 42 - ".emit"
Cohesion: 0.14
Nodes (22): configureNotices(), NoticeSettings, retryRecipientLookup(), PrerequisitesSchema, enqueueGreen156(), enqueueMetadataRecovery(), configureDigestDelivery(), DigestSettings (+14 more)

### Community 43 - "digest"
Cohesion: 0.11
Nodes (37): comparableSlackText(), createExtractor(), extractDocument, Extraction, Extractor, uploadArtifact(), AuthoredDigest, reconcileDigestAuthorship() (+29 more)

### Community 44 - "task-briefing.ts"
Cohesion: 0.12
Nodes (24): assignmentKnowledge(), AssignmentLookups, Binding, lookupInstructions(), decodeLookupJournal(), lookupJournal, readLookupJournal(), referenceVisible() (+16 more)

### Community 46 - "run-cost.ts"
Cohesion: 0.18
Nodes (14): CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL, Rates (+6 more)

### Community 47 - "GitHubDelivery"
Cohesion: 0.07
Nodes (46): Execute, installDependencies(), major(), GitHubDelivery, observe(), checksFailed(), checksPassed(), checksPending() (+38 more)

### Community 48 - "easternDay"
Cohesion: 0.08
Nodes (24): DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), dailyReviewDate(), reviewWeekday(), DailyResultSchema, Briefing (+16 more)

### Community 49 - "scheduler.ts"
Cohesion: 0.18
Nodes (12): ROLES, officeCapacity, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch() (+4 more)

### Community 50 - "run-accounting.ts"
Cohesion: 0.16
Nodes (18): BoundedRead, EvidenceOutcome, CompletionReader, HELPER_STDOUT_MAX_BYTES, helperAccounting(), claudeAccounting(), COMPLETION_MAX_BYTES, completionAccounting() (+10 more)

### Community 51 - "outbox.ts"
Cohesion: 0.22
Nodes (15): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), projectOutbox(), slackRequestSettled(), canFileGithubIssue(), readBackConversations() (+7 more)

### Community 52 - "coordination.ts"
Cohesion: 0.14
Nodes (26): admit(), IntakeContext, compatible(), dependencyEligibility(), DependencyStores, issueKey(), observePrerequisites(), PrerequisiteSchema (+18 more)

### Community 53 - "run-retrospective.ts"
Cohesion: 0.09
Nodes (38): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, improvementIntakeGate(), captureLearning(), learningDigest(), recordLearningOpportunity(), appendLearningFacts() (+30 more)

### Community 54 - "accept-stage-result.ts"
Cohesion: 0.11
Nodes (31): park(), acceptStageResult(), StageContext, linkDraftIssue(), protectedOriginalClaim(), METADATA_FINDING, publicationReadArgs(), Read (+23 more)

### Community 55 - "QuestionStepper.tsx"
Cohesion: 0.15
Nodes (20): FeatureHarnessOption, FeatureOption, FeatureQuestion, FeatureQuestionProjection, draftKey(), readDraft(), saveDraft(), QuestionRound() (+12 more)

### Community 56 - "sourceVisible"
Cohesion: 0.22
Nodes (24): knowledgeActivity(), knowledgeSnapshot(), officeKnowledgeSnapshot(), publicReference(), lookupSummaryVisible(), publicLookupSummary(), evidenceTitle(), knowledgeMap() (+16 more)

### Community 57 - "preferences-store.ts"
Cohesion: 0.21
Nodes (9): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS (+1 more)

### Community 58 - "processGroupAlive"
Cohesion: 0.13
Nodes (28): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationCandidates(), investigationId(), investigationEvidence(), investigationFollowUps(), INVOCATION_SOURCE_REFS, invocationSource() (+20 more)

### Community 59 - "assignment-poll.ts"
Cohesion: 0.19
Nodes (13): noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), syncOutbox(), admitReadyCards(), WAIT_STATUSES, pinCourier, ACTIONS (+5 more)

### Community 60 - "lesson-selection.ts"
Cohesion: 0.15
Nodes (21): knowledgeContext(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), LessonSelection, MAINTENANCE (+13 more)

### Community 61 - "remove-candidate.ts"
Cohesion: 0.20
Nodes (17): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+9 more)

### Community 62 - ".getEffect"
Cohesion: 0.27
Nodes (7): GitHubOperations, fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), closeNativeRefresh(), fingerprint(), Effects

### Community 63 - "TelemetryPanel.tsx"
Cohesion: 0.11
Nodes (34): AzureBuild, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens(), usd(), KpiTiles() (+26 more)

### Community 64 - "Coordinator"
Cohesion: 0.08
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 65 - "session-bridge.ts"
Cohesion: 0.08
Nodes (37): claudeSessionContext(), readTranscript, root, claudeSessionScope(), accountCodexProcesses(), codexProcessInventory, DesktopSessions, unaccountedProcesses() (+29 more)

### Community 66 - "api-routes.ts"
Cohesion: 0.23
Nodes (13): assertAssessmentVisibility(), assertQuestionVisibility(), pendingQuestions(), diagnosticSnapshot(), nativeDeliveryResolved(), eventVisible(), knowledgeOfficeState(), knowledgePromptStore() (+5 more)

### Community 68 - "coordination-tick.ts"
Cohesion: 0.33
Nodes (8): dependencyCompletionKey(), brainCheckpointCompletion(), reconcileCompletedCheckpoints(), reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION, tick()

### Community 69 - "jira-time.ts"
Cohesion: 0.22
Nodes (12): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+4 more)

### Community 70 - "sanitize"
Cohesion: 0.26
Nodes (10): projectSlackDeliveries(), settleRequestedSlackReplacement(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint(), supersedingDelivery(), sanitize() (+2 more)

### Community 71 - "fact-bounds.ts"
Cohesion: 0.16
Nodes (21): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+13 more)

### Community 72 - "contract.ts"
Cohesion: 0.21
Nodes (11): At, Errno, GroupInventory, GroupProbe, LifecycleDiagnostic, Phase, Pid, lifecycleFacts() (+3 more)

### Community 73 - "owned-artifact.ts"
Cohesion: 0.54
Nodes (6): ghLogCacheEvidence(), done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf()

### Community 74 - "slack-intake/report.ts"
Cohesion: 0.18
Nodes (25): Proposal, ReadTask, isStoppingFor(), reconcileIntakeStatus(), intakeProgress(), terminalDeferred(), unitKey(), verifiedCapture() (+17 more)

### Community 75 - "offices.ts"
Cohesion: 0.17
Nodes (14): leadershipContext(), leadershipEntries(), knowledgeEntries(), privateFile(), readLocalIntakeReport(), readIntakeReport(), DELIVERY_CONCURRENCY, file (+6 more)

### Community 76 - ".save"
Cohesion: 0.26
Nodes (22): BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue(), readIssues(), commentDecision() (+14 more)

### Community 77 - "WorkTime"
Cohesion: 0.16
Nodes (20): telemetryRoute(), ConfirmedSegment, LiveAnchor, ObservationGap, SnapshotOrdering, TimeLedgerState, WorkTime, Acc (+12 more)

### Community 78 - "scheduled-work.ts"
Cohesion: 0.14
Nodes (21): deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), metadataRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), requestPriority() (+13 more)

### Community 79 - "DailyCTO.tsx"
Cohesion: 0.26
Nodes (8): CTOReview(), goalState, DailyCTO(), GoalHistory(), reportDate(), reviewStatus, reviewExcerpt(), ReviewText()

### Community 80 - "create-candidate.ts"
Cohesion: 0.48
Nodes (6): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf()

### Community 81 - "notifications.ts"
Cohesion: 0.16
Nodes (17): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR (+9 more)

### Community 82 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 83 - "codex-rollout.ts"
Cohesion: 0.27
Nodes (10): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO (+2 more)

### Community 84 - "tracking-issue.ts"
Cohesion: 0.19
Nodes (17): readBackOrThrow(), ensureTrackingIssue(), findTrackingIssue(), ownTracking(), TrackingIssue, trackingIssueBody(), trackingIssueTitle(), trackingMarker() (+9 more)

### Community 85 - "Agents"
Cohesion: 0.20
Nodes (5): reconcileNoticeConfirmations(), SlackMessages, SlackRequestSchema, Agents, SlackDelivery

### Community 86 - "model-routes.ts"
Cohesion: 0.22
Nodes (11): assertModelOverrides(), CODEX_DEFAULT_EFFORT, CODEX_DEFAULT_MODEL, CODEX_EFFORTS, CODEX_ROLES, qaPolicyRoute(), resolveModelRoute(), validModelSetting() (+3 more)

### Community 87 - "OfficeConfigView.tsx"
Cohesion: 0.48
Nodes (5): loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView(), OfficeConfigSummary

### Community 88 - "extract-worker.mjs"
Cohesion: 0.70
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 89 - "dependency-bots/adopt.ts"
Cohesion: 0.28
Nodes (16): closesIssue(), linkedBody(), linkPR(), dependabotPR, readRepo(), adoptDependencyBot(), adoptOne(), DependencyBot (+8 more)

### Community 90 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 93 - "office-lessons.ts"
Cohesion: 0.25
Nodes (11): normalizeStatement(), decideOfficeProposal(), mirrorOfficeKnowledge(), now(), OfficeKnowledgeStore, proposeOfficeLessons(), retireOfficeLesson(), Input (+3 more)

### Community 94 - "slack-intake/config.ts"
Cohesion: 0.23
Nodes (12): exactly(), Message, nativeReadPayload(), pagination(), nativeFile(), Fields, PublicHosts, SlackAppId (+4 more)

### Community 95 - "delivery-task.ts"
Cohesion: 0.22
Nodes (11): cecPrompt(), resolvedDecisionNote(), stageInstructions, APPROACH_GUIDANCE, reviewInstructions(), deliveryTask(), DeliveryTaskInput, DISCOVERY_GUIDANCE (+3 more)

### Community 96 - "workKey"
Cohesion: 0.30
Nodes (9): completedPRReviews(), eligible(), mergedByOwner(), ownerSettles(), retireExternalDeliveries(), settledExternalRepair(), nativeDeliveryReadbackCandidate(), reconcileNativeDelivery() (+1 more)

### Community 97 - "discovery-recovery.ts"
Cohesion: 0.29
Nodes (10): Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership, rawHash() (+2 more)

### Community 98 - "telemetry.ts"
Cohesion: 0.17
Nodes (11): CostCompleteness, CostComponent, CostLedgerState, ProviderBasis, RunCost, TelemetryReport, TelemetryRow, TelemetrySync (+3 more)

### Community 99 - ".value"
Cohesion: 0.27
Nodes (6): file, folder, logs, root, xml(), ProjectProgress

### Community 100 - "mailbox.ts"
Cohesion: 0.24
Nodes (8): applyIntakeObservation(), checkMail(), drainMail(), requestMail(), MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), ingest()

### Community 101 - "private-result.ts"
Cohesion: 0.42
Nodes (6): retainedArtifactScope(), eventSourceBindings(), exposureBindings(), requestSourceBindings(), acceptedSourceBindings(), knowledgeSessionVisibility()

### Community 102 - "harnessEffect"
Cohesion: 0.42
Nodes (7): activeEffectId(), harnessEffect, resume(), resumeProviderReviews(), Execute, deliveryResearchContext(), deliveryResearchSha256()

### Community 103 - "interrupted-work-recovery.ts"
Cohesion: 0.39
Nodes (6): digestNoticeNeverDispatched(), goalNoticeNeverDispatched(), maintenanceNoticeAuthorized(), maintenanceNoticeNeverDispatched(), sendMaintenanceNotice(), recover()

### Community 104 - "codex-rollout-file.ts"
Cohesion: 0.31
Nodes (8): codexHome(), createdAt(), dayDirs(), header(), readCodexRollout(), ROLLOUT_MAX_BYTES, RolloutScan, scanCodexRollouts()

### Community 105 - "documentText"
Cohesion: 0.39
Nodes (5): guidanceExcerpt(), DocumentMetadata, documentText(), KnowledgeDocumentText, DocumentPreview()

### Community 106 - "run-usage.ts"
Cohesion: 0.32
Nodes (6): CodexRollout, claudeCrashZero(), claudeUsage(), codexUsage(), count(), RunUsage

### Community 107 - "liveReach"
Cohesion: 0.60
Nodes (5): GIT_NETWORK, LIVE_PROVIDERS, liveReach(), networkUrl(), remoteUrls()

### Community 108 - "improvement-incident.ts"
Cohesion: 0.90
Nodes (4): distinct(), identity(), improvementIncident(), improvementIncidentKey()

## Knowledge Gaps
- **431 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+426 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `github-delivery.ts`, `requests.ts`, `artifact`, `move-lane.ts`, `schedule.ts`, `knowledge.ts`, `features/workflow.ts`, `readback-evidence.ts`, `knowledge/routes.ts`, `digest`, `SourceRegistry`, `effects.ts`, `source-amendment.ts`, `agents.ts`, `cost-ledger.ts`, `scheduled-captures.ts`, `worker-runtime.ts`, `shared.ts`, `read-links.ts`, `ticket-evidence.ts`, `it-specialist.ts`, `record-trigger.ts`, `OfficeSnapshot`, `store.ts`, `maintenance/maintenance.ts`, `features.ts`, `conversations/conversations.ts`, `time-scope.ts`, `engine.ts`, `index.ts`, `conversations/slack.ts`, `azure.ts`, `.emit`, `digest`, `task-briefing.ts`, `GitHubDelivery`, `easternDay`, `scheduler.ts`, `run-accounting.ts`, `outbox.ts`, `coordination.ts`, `run-retrospective.ts`, `accept-stage-result.ts`, `processGroupAlive`, `lesson-selection.ts`, `remove-candidate.ts`, `.getEffect`, `session-bridge.ts`, `api-routes.ts`, `coordination-tick.ts`, `jira-time.ts`, `sanitize`, `slack-intake/report.ts`, `offices.ts`, `.save`, `WorkTime`, `scheduled-work.ts`, `create-candidate.ts`, `notifications.ts`, `tracking-issue.ts`, `Agents`, `dependency-bots/adopt.ts`, `office-lessons.ts`, `slack-intake/config.ts`, `delivery-task.ts`, `workKey`, `discovery-recovery.ts`, `private-result.ts`, `harnessEffect`, `interrupted-work-recovery.ts`, `improvement-incident.ts`?**
  _High betweenness centrality (0.137) - this node is a cross-community bridge._
- **Why does `TicketJob` connect `github-delivery.ts` to `requests.ts`, `artifact`, `move-lane.ts`, `Inspector.tsx`, `readback-evidence.ts`, `cec/workflow.ts`, `digest`, `source-amendment.ts`, `worker-runtime.ts`, `shared.ts`, `it-specialist.ts`, `record-trigger.ts`, `OfficeSnapshot`, `maintenance/maintenance.ts`, `engine.ts`, `GitHubDelivery`, `scheduler.ts`, `coordination.ts`, `accept-stage-result.ts`, `remove-candidate.ts`, `fact-bounds.ts`, `owned-artifact.ts`, `create-candidate.ts`, `tracking-issue.ts`, `dependency-bots/adopt.ts`, `delivery-task.ts`, `workKey`, `discovery-recovery.ts`, `.value`, `harnessEffect`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `OfficeSnapshot` connect `OfficeSnapshot` to `Inspector.tsx`, `cec/workflow.ts`, `OfficeScene.tsx`, `index.tsx`, `Store`, `Button`, `shared.ts`, `it-specialist.ts`, `record-trigger.ts`, `store.ts`, `maintenance/maintenance.ts`, `App.tsx`, `Role`, `azure.ts`, `outbox.ts`, `sourceVisible`, `processGroupAlive`, `TelemetryPanel.tsx`, `api-routes.ts`, `sanitize`, `DailyCTO.tsx`, `mailbox.ts`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _431 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `github-delivery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.04985555866182089 - nodes in this community are weakly interconnected._
- **Should `requests.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.04695813092759658 - nodes in this community are weakly interconnected._
- **Should `artifact` be split into smaller, more focused modules?**
  _Cohesion score 0.05394066526820498 - nodes in this community are weakly interconnected._