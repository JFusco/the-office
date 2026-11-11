# Graph Report - the-office  (2026-11-11)

## Corpus Check
- 804 files · ~318,972 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3954 nodes · 18198 edges · 102 communities (99 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 111 edges (avg confidence: 0.74)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `fa68f562`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- github-delivery.ts
- activation-recovery.ts
- office/config.ts
- dependency-bots/adopt.ts
- source-amendment.ts
- digest
- assignment-context.ts
- process.ts
- store.ts
- requests.ts
- Inspector.tsx
- OfficeScene.tsx
- github-readiness.ts
- Button
- azure.ts
- agents.ts
- index.tsx
- cec/issue-publication.ts
- scheduled-captures.ts
- index.ts
- constellation-runtime.ts
- Store
- shared.ts
- slack-intake/run.ts
- knowledge/routes.ts
- weekly-research.ts
- scheduled-work.ts
- session-bridge.ts
- Role
- offices.ts
- accept-stage-result.ts
- TelemetryPanel.tsx
- worker-runtime.ts
- closeout-recovery.ts
- ticket-evidence.ts
- coordination.ts
- run-accounting.ts
- knowledge.ts
- weekly-rollup.ts
- conversations/conversations.ts
- .activeClaims
- run-retrospective.ts
- cec/workflow.ts
- App.tsx
- engine.ts
- OfficeSnapshot
- registry.ts
- digest
- assignment-poll.ts
- it-specialist.ts
- SourceRegistry
- .get
- telemetry.ts
- investigations/run.ts
- knowledge-snapshot.ts
- record-trigger.ts
- outbox.ts
- WorkTime
- QuestionStepper.tsx
- .save
- maintenance/maintenance.ts
- KnowledgeReference
- LessonsPanel.tsx
- investigations/ledger.ts
- Coordinator
- http/commands.ts
- remove-candidate.ts
- lesson-selection.ts
- jira-time.ts
- reader.ts
- outbound.ts
- goal-reviews.ts
- checkpoint-completion.ts
- brain-maintenance.ts
- retrospective-subject.ts
- slack-intake/report.ts
- contract.ts
- FeatureWorkspace.tsx
- source-amendment-scope.ts
- knowledge/learning-events.ts
- telemetry/report.ts
- work.ts
- preferences-store.ts
- .emit
- .pump
- DailyCTO.tsx
- useOfficePreferences.ts
- cost-entries.ts
- .value
- SlackMessages
- command-registry.ts
- documentText
- codex-rollout.ts
- maintenance-triggers.ts
- seeded-office-lessons.ts
- scheduled-retrospectives.ts
- diagnostic-snapshot.ts
- liveReach
- extract-worker.mjs
- slack-supersession.ts
- helper-evidence.py

## God Nodes (most connected - your core abstractions)
1. `Store` - 361 edges
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
- `DeliveryAuthorityInput` --references--> `HarnessRequest`  [EXTRACTED]
  server/delivery/harness/delivery-authority.ts → src/contracts/work.ts
- `rows()` --indirect_call--> `row()`  [INFERRED]
  server/delivery/recovery/source-amendment/source-amendment-held.ts → src/telemetry/report.ts
- `proveOutsideAmendmentUnchanged()` --indirect_call--> `row()`  [INFERRED]
  server/delivery/recovery/source-amendment/source-amendment-held.ts → src/telemetry/report.ts
- `rows()` --indirect_call--> `row()`  [INFERRED]
  server/delivery/recovery/source-amendment/source-amendment-scope.ts → src/telemetry/report.ts

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

## Communities (102 total, 3 thin omitted)

### Community 0 - "github-delivery.ts"
Cohesion: 0.05
Nodes (83): containedFile(), removeAdoptedClone(), namedRepairIds(), assertDeliveryMayMutate(), BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction() (+75 more)

### Community 1 - "activation-recovery.ts"
Cohesion: 0.06
Nodes (81): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+73 more)

### Community 2 - "office/config.ts"
Cohesion: 0.08
Nodes (63): commandFeature(), reviewQuestions(), featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS (+55 more)

### Community 3 - "dependency-bots/adopt.ts"
Cohesion: 0.07
Nodes (73): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard, projectCards() (+65 more)

### Community 4 - "source-amendment.ts"
Cohesion: 0.06
Nodes (86): stagePrompt(), StagePromptInput, METADATA_FINDING_GUIDANCE, adoptCandidate(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent() (+78 more)

### Community 5 - "digest"
Cohesion: 0.08
Nodes (76): verifiedCloseoutCleanupRequest(), continuationNativeReview(), candidateInput(), children, oldAdoptionBasis(), savedCandidateAdmission, assertPostConflictFiles(), assertPostConflictOwnership() (+68 more)

### Community 6 - "assignment-context.ts"
Cohesion: 0.08
Nodes (64): Execute, installDependencies(), major(), harnessCloseout(), PASSING, verifyMergeActions(), HarnessControl, withHarnessWork() (+56 more)

### Community 7 - "process.ts"
Cohesion: 0.06
Nodes (55): approveFeature(), featureById(), mutation(), discoveryPrompt(), planPrompt(), artifactPath(), digest(), document() (+47 more)

### Community 8 - "store.ts"
Cohesion: 0.06
Nodes (41): assertFeatureDependencyOrder(), featureDependencyEdges(), key(), publishFeature(), GitHubOperations, admitImprovement(), improvementEligible(), digestNoticeNeverDispatched() (+33 more)

### Community 9 - "requests.ts"
Cohesion: 0.07
Nodes (62): pinCourier, pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), CloseoutSupervisionProofRef, Envelope, hash, head, identity (+54 more)

### Community 10 - "Inspector.tsx"
Cohesion: 0.08
Nodes (55): Conversation(), Outbox(), SendMessage, recommendedReply(), slackMessageStatus(), SlackDeliveryCard(), labels, BrainDrawer() (+47 more)

### Community 11 - "OfficeScene.tsx"
Cohesion: 0.06
Nodes (60): displayAgentTask(), withoutElapsed(), CameraBookmark, restoreBookmark(), LiveAgentTask(), Props, RunningTask(), text() (+52 more)

### Community 12 - "github-readiness.ts"
Cohesion: 0.09
Nodes (53): findingsBlock(), hasUncertainEffects(), observe(), assertAutomationEffects(), automationMergePolicy(), observeAutomationMerge(), routeAutomationMerge(), checksFailed() (+45 more)

### Community 13 - "Button"
Cohesion: 0.08
Nodes (43): KnowledgeCapturePage, KnowledgeActivity, KnowledgeActivityPage, Activity(), ActivityStatus(), ActivityTimeline(), AssignmentKnowledge(), CaptureReviewDetail() (+35 more)

### Community 14 - "azure.ts"
Cohesion: 0.06
Nodes (55): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+47 more)

### Community 15 - "agents.ts"
Cohesion: 0.06
Nodes (43): cecPrompt(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), resolvedDecisionNote(), stageInstructions, ConversationResultSchema (+35 more)

### Community 16 - "index.tsx"
Cohesion: 0.09
Nodes (46): KnowledgeSourceSummary, AddPublicSource(), AddSourceForm(), SourceConnection, SourceCard(), Sources(), supported, UploadSource() (+38 more)

### Community 17 - "cec/issue-publication.ts"
Cohesion: 0.10
Nodes (23): Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), Transition, descriptionPreimage(), plain() (+15 more)

### Community 18 - "scheduled-captures.ts"
Cohesion: 0.15
Nodes (44): createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest, captureRequests() (+36 more)

### Community 19 - "index.ts"
Cohesion: 0.07
Nodes (43): args, [cmd,...rawArgs], commands, key, projectIndex, assertAssessmentVisibility(), assertQuestionVisibility(), pendingQuestions() (+35 more)

### Community 20 - "constellation-runtime.ts"
Cohesion: 0.08
Nodes (39): KnowledgeEdge, KnowledgeIntakeStatus, KnowledgeMap, KnowledgeNode, CameraPose, flightPose(), cameraTarget(), focusDistance (+31 more)

### Community 21 - "Store"
Cohesion: 0.06
Nodes (12): correlatedBuild(), GitHubFeaturePublisher, Result, Engine, observe(), observeParked(), parkedReadError, reconcileStoppingClaims() (+4 more)

### Community 22 - "shared.ts"
Cohesion: 0.06
Nodes (42): ProjectReadiness, DailyCTOSummary, SchedulerState, itAgent(), itDiagnostics(), itFollowUpView(), sessionVisibilityCopy(), date() (+34 more)

### Community 23 - "slack-intake/run.ts"
Cohesion: 0.13
Nodes (33): CaptureReceipt, ChannelProgress, IntakeResult, IntakeResultValue, LIMITS, Observation, ReadKind, ReadTask (+25 more)

### Community 24 - "knowledge/routes.ts"
Cohesion: 0.12
Nodes (29): captureAfter(), CaptureMetadata, capturePage(), cursor(), key(), intakeActivity(), knowledgeActivity(), knowledgeActivityPage() (+21 more)

### Community 25 - "weekly-research.ts"
Cohesion: 0.08
Nodes (22): retryDelay(), mirror(), ResearchResult, runWeeklyResearch(), scheduledResearch(), DailyCTO, dailyReviewPrompt(), queueGoalEvidenceRequest() (+14 more)

### Community 26 - "scheduled-work.ts"
Cohesion: 0.10
Nodes (40): deliverySlot(), metadataRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), requestPriority(), deterministicActions, eligible() (+32 more)

### Community 27 - "session-bridge.ts"
Cohesion: 0.09
Nodes (36): claudeSessionContext(), readTranscript, root, claudeSessionScope(), accountCodexProcesses(), codexProcessInventory, DesktopSessions, unaccountedProcesses() (+28 more)

### Community 28 - "Role"
Cohesion: 0.10
Nodes (41): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+33 more)

### Community 29 - "offices.ts"
Cohesion: 0.08
Nodes (30): leadershipContext(), leadershipEntries(), knowledgeEntries(), seedOfficeLessons(), privateFile(), readLocalIntakeReport(), systemClock, DELIVERY_CONCURRENCY (+22 more)

### Community 30 - "accept-stage-result.ts"
Cohesion: 0.10
Nodes (40): park(), acceptStageResult(), PrerequisitesSchema, linkDraftIssue(), protectedOriginalClaim(), METADATA_FINDING, publicationReadArgs(), Read (+32 more)

### Community 31 - "TelemetryPanel.tsx"
Cohesion: 0.10
Nodes (37): TelemetryReport, LiveAnchor, AzureBuild, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens() (+29 more)

### Community 32 - "worker-runtime.ts"
Cohesion: 0.10
Nodes (32): candidateWorkspaceEnvironment(), assignmentSubject(), dispatchExposure(), prepareExposure(), assertRetainedDispatchScope(), assertBriefingScope(), EvidenceSelection, claudeArguments() (+24 more)

### Community 33 - "closeout-recovery.ts"
Cohesion: 0.11
Nodes (41): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+33 more)

### Community 34 - "ticket-evidence.ts"
Cohesion: 0.11
Nodes (33): CommentPage, commentReadback(), JiraOperations, plain(), unpack(), jiraRecord(), assetDownloader(), attachmentKind() (+25 more)

### Community 35 - "coordination.ts"
Cohesion: 0.11
Nodes (38): reconcileNoticeConfirmations(), Admission, admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, compatible(), dependencyCompletionKey() (+30 more)

### Community 36 - "run-accounting.ts"
Cohesion: 0.09
Nodes (37): ghLogCacheEvidence(), BoundedRead, done(), readBoundedNoFollow(), readBoundedNoFollowSync(), reasonOf(), comparable(), EvidenceOutcome (+29 more)

### Community 37 - "knowledge.ts"
Cohesion: 0.08
Nodes (34): Accepted, normalizeStatement(), RETROSPECTIVE_HISTORY, decideOfficeProposal(), now(), OfficeKnowledgeStore, proposeOfficeLessons(), retireOfficeLesson() (+26 more)

### Community 38 - "weekly-rollup.ts"
Cohesion: 0.11
Nodes (29): knowledgeScopeRevision(), learningMetrics(), lessonsNeedingReview(), RollupResultSchema, reconcileIntakeStatus(), scheduledSlackIntake(), combineIntakeMetrics(), IntakeMetrics (+21 more)

### Community 39 - "conversations/conversations.ts"
Cohesion: 0.12
Nodes (23): assertConversationReadback(), Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff(), saveGoals() (+15 more)

### Community 40 - ".activeClaims"
Cohesion: 0.13
Nodes (27): deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, requireDeliveryAuthority(), deliveryIntakeBlocker(), gateRegisteredDelivery(), accounting (+19 more)

### Community 41 - "run-retrospective.ts"
Cohesion: 0.10
Nodes (32): acceptRetrospective(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), learningDigest(), appendLearningFacts(), freezeLearningPacket() (+24 more)

### Community 42 - "cec/workflow.ts"
Cohesion: 0.13
Nodes (32): applyIntakeObservation(), checkMail(), drainMail(), requestMail(), parksInJira(), MISSING_INTAKE, reconcileMailbox(), unusedMailbox() (+24 more)

### Community 43 - "App.tsx"
Cohesion: 0.07
Nodes (31): themeColor, BrainWorkspace, CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants, ElevatorPhase, floorVariants (+23 more)

### Community 44 - "engine.ts"
Cohesion: 0.15
Nodes (26): dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), resume(), startPilot(), eligibility(), approvedDelivery() (+18 more)

### Community 45 - "OfficeSnapshot"
Cohesion: 0.15
Nodes (28): App(), usePanelFocus(), OfficeSnapshot, Count(), deliveryRepairProjection(), DependencyNotice(), card, InboxQueue() (+20 more)

### Community 46 - "registry.ts"
Cohesion: 0.14
Nodes (19): KnowledgeRunner, LinkRecord, LinkResult, PublicReadPolicy, checkedReceipt(), ScanReceipt, scanText(), SecretScanner (+11 more)

### Community 47 - "digest"
Cohesion: 0.13
Nodes (26): comparableSlackText(), createExtractor(), extractDocument, Extraction, Extractor, uploadArtifact(), AuthoredDigest, reconcileDigestAuthorship() (+18 more)

### Community 48 - "assignment-poll.ts"
Cohesion: 0.12
Nodes (24): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR (+16 more)

### Community 49 - "it-specialist.ts"
Cohesion: 0.12
Nodes (20): savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), ITContext, publishITReport(), delays, recoverAttempt() (+12 more)

### Community 50 - "SourceRegistry"
Cohesion: 0.13
Nodes (17): Config, configDigest(), IntakeConfig, readConfig(), Command, sourceCommand(), IntakeBinding, configDigestForSeed() (+9 more)

### Community 51 - ".get"
Cohesion: 0.16
Nodes (24): captureProposal(), effectId(), newTask(), recordObservation(), settlePage(), DERIVED, acceptProposals(), linkKey() (+16 more)

### Community 52 - "telemetry.ts"
Cohesion: 0.09
Nodes (27): CodexRollout, CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL (+19 more)

### Community 53 - "investigations/run.ts"
Cohesion: 0.15
Nodes (22): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_FIX_PROMPT, OfficeFixResult (+14 more)

### Community 54 - "knowledge-snapshot.ts"
Cohesion: 0.21
Nodes (22): eventVisible(), knowledgeSnapshot(), officeKnowledgeSnapshot(), publicReference(), publicSearch(), lookupSummaryVisible(), publicLookupSummary(), outcomeVisible() (+14 more)

### Community 55 - "record-trigger.ts"
Cohesion: 0.14
Nodes (27): baselineLearning(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences(), clip(), JobLike, recordCIBudget() (+19 more)

### Community 56 - "outbox.ts"
Cohesion: 0.15
Nodes (22): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), projectOutbox(), slackRequestSettled(), readBackConversations(), handoff() (+14 more)

### Community 57 - "WorkTime"
Cohesion: 0.17
Nodes (26): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), ticketUnresolved(), midnight() (+18 more)

### Community 58 - "QuestionStepper.tsx"
Cohesion: 0.15
Nodes (20): FeatureHarnessOption, FeatureOption, FeatureQuestion, FeatureQuestionProjection, draftKey(), readDraft(), saveDraft(), QuestionRound() (+12 more)

### Community 59 - ".save"
Cohesion: 0.25
Nodes (23): BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue(), readIssues(), commentDecision() (+15 more)

### Community 60 - "maintenance/maintenance.ts"
Cohesion: 0.14
Nodes (18): ApproachSchema, candidateOwner(), SETTLED, skipOwnedCandidate(), Skipped, skippedCandidateLedger(), CmsFollowUpContext, cmsFollowUpInstructions() (+10 more)

### Community 61 - "KnowledgeReference"
Cohesion: 0.15
Nodes (16): assignmentKnowledge(), AssignmentLookups, decodeLookupJournal(), lookupJournal, referenceVisible(), readOwnedSessionArtifact(), KnowledgeAssignment, KnowledgeCapture (+8 more)

### Community 62 - "LessonsPanel.tsx"
Cohesion: 0.13
Nodes (18): OfficeProposal, RetrospectiveRecord, WeeklyRollup, BlockerFollowups(), IntakeSummary(), lessonsView, newest(), ROLLUP_ROWS (+10 more)

### Community 63 - "investigations/ledger.ts"
Cohesion: 0.21
Nodes (16): syncOutbox(), finishSupersededReadback(), projectSlackDeliveries(), settleRequestedSlackReplacement(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint() (+8 more)

### Community 64 - "Coordinator"
Cohesion: 0.09
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 65 - "http/commands.ts"
Cohesion: 0.19
Nodes (18): retryRecipientLookup(), bindDiscoveryResume(), DiscoveryResumeInput, configureDigestDelivery(), DigestSettings, configureKnowledge(), declineLessonIssue(), demoteLesson() (+10 more)

### Community 66 - "remove-candidate.ts"
Cohesion: 0.20
Nodes (17): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+9 more)

### Community 67 - "lesson-selection.ts"
Cohesion: 0.14
Nodes (20): INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), LessonSelection, MAINTENANCE, MAX_LESSONS (+12 more)

### Community 68 - "jira-time.ts"
Cohesion: 0.19
Nodes (15): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+7 more)

### Community 69 - "reader.ts"
Cohesion: 0.13
Nodes (12): BrainCaptureReceipt, hash, PublishedCaptureNote, sha, BrainGraph, BrainNote, CommittedBrain, GraphNode (+4 more)

### Community 70 - "outbound.ts"
Cohesion: 0.19
Nodes (15): assertDigestDispatch(), independentDigestEvidence(), outboundBody(), retainOutboundBody(), digestNoticeRequest(), queueOutboundDigests(), digestKnowledge(), prepareDigestBodies() (+7 more)

### Community 71 - "goal-reviews.ts"
Cohesion: 0.14
Nodes (17): applyGoalReview(), EvidenceRefSchema, FreshDailyResultSchema, statusAllowed(), workEvidence(), GoalInput, saveGoal(), queueGoalNotice() (+9 more)

### Community 72 - "checkpoint-completion.ts"
Cohesion: 0.15
Nodes (14): completeNativeCheckpoint(), BrainStatusSchema, identity, brainCheckpointCompletion(), coverageSchema, followupSchema, verified, queueCheckpointRetry() (+6 more)

### Community 73 - "brain-maintenance.ts"
Cohesion: 0.19
Nodes (12): maintenancePolicies(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice(), easternDate(), weeklyDue() (+4 more)

### Community 74 - "retrospective-subject.ts"
Cohesion: 0.18
Nodes (16): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, maintenanceKey(), azurePrUrl(), findSubject(), jobSubject() (+8 more)

### Community 75 - "slack-intake/report.ts"
Cohesion: 0.27
Nodes (16): Proposal, isStoppingFor(), intakeProgress(), terminalDeferred(), unitKey(), verifiedCapture(), byWeek(), IntakeSummary (+8 more)

### Community 76 - "contract.ts"
Cohesion: 0.20
Nodes (12): At, Errno, GroupInventory, GroupProbe, LifecycleDiagnostic, Phase, Pid, lifecycleFacts() (+4 more)

### Community 77 - "FeatureWorkspace.tsx"
Cohesion: 0.18
Nodes (12): FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures(), TicketPlanningAction(), useOffice() (+4 more)

### Community 78 - "source-amendment-scope.ts"
Cohesion: 0.26
Nodes (15): approvedText(), assert(), assert(), boundProfiles, canonical(), Document, ReadSourceFile, releaseAmendmentJournal() (+7 more)

### Community 79 - "knowledge/learning-events.ts"
Cohesion: 0.26
Nodes (10): eventSourceBindings(), captureLearning(), recordLearningOpportunity(), exposureBindings(), requestSourceBindings(), captureMaintenanceStep(), acceptedSourceBindings(), readAcceptedResult() (+2 more)

### Community 80 - "telemetry/report.ts"
Cohesion: 0.25
Nodes (14): validTicket(), telemetryRoute(), Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount() (+6 more)

### Community 81 - "work.ts"
Cohesion: 0.13
Nodes (14): pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION, AssignmentResult, CompletionCondition, Continuation, DeliveryAdmission, DependencyObservation (+6 more)

### Community 82 - "preferences-store.ts"
Cohesion: 0.21
Nodes (9): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS (+1 more)

### Community 83 - ".emit"
Cohesion: 0.20
Nodes (7): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), BrainFollowup

### Community 85 - "DailyCTO.tsx"
Cohesion: 0.23
Nodes (9): CTOReview(), goalState, DailyCTO(), GoalHistory(), reportDate(), reviewStatus, reviewExcerpt(), ReviewText() (+1 more)

### Community 86 - "useOfficePreferences.ts"
Cohesion: 0.23
Nodes (11): acceptPreferences(), PreferenceCandidate, strip(), UNKNOWN_PREFERENCES, OfficePreferencesController, PreferenceFeedback, PreferenceField, requestPreferences() (+3 more)

### Community 87 - "cost-entries.ts"
Cohesion: 0.24
Nodes (10): captureCost(), summary(), awaitingEvidence(), CaptureContext, inCostWindow(), TicketCost, ticketCosts(), RECONCILE_GRACE_MS (+2 more)

### Community 88 - ".value"
Cohesion: 0.27
Nodes (6): file, folder, logs, root, xml(), ProjectProgress

### Community 90 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 91 - "documentText"
Cohesion: 0.33
Nodes (6): guidanceExcerpt(), evidenceTitle(), DocumentMetadata, documentText(), KnowledgeDocumentText, DocumentPreview()

### Community 92 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 93 - "maintenance-triggers.ts"
Cohesion: 0.46
Nodes (7): clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates(), maintenanceCompletedId(), visibleMaintenanceTriggerIds(), RetrospectiveTrigger

### Community 94 - "seeded-office-lessons.ts"
Cohesion: 0.36
Nodes (6): CONSOLIDATED, CONSOLIDATED_AT, seedProjectLessons(), SEEDS, seed(), SEEDS

### Community 95 - "scheduled-retrospectives.ts"
Cohesion: 0.48
Nodes (6): busyMaintenanceIds(), triggerJobId(), busySubjects(), scheduledRetrospectives(), status(), WorkEligibility

### Community 96 - "diagnostic-snapshot.ts"
Cohesion: 0.60
Nodes (3): diagnosticContext(), diagnosticSnapshot(), nativeDeliveryResolved()

### Community 97 - "liveReach"
Cohesion: 0.60
Nodes (5): GIT_NETWORK, LIVE_PROVIDERS, liveReach(), networkUrl(), remoteUrls()

### Community 98 - "extract-worker.mjs"
Cohesion: 0.70
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 99 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

## Knowledge Gaps
- **434 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+429 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `github-delivery.ts`, `activation-recovery.ts`, `office/config.ts`, `dependency-bots/adopt.ts`, `source-amendment.ts`, `digest`, `assignment-context.ts`, `process.ts`, `store.ts`, `requests.ts`, `OfficeScene.tsx`, `github-readiness.ts`, `azure.ts`, `agents.ts`, `cec/issue-publication.ts`, `scheduled-captures.ts`, `index.ts`, `slack-intake/run.ts`, `knowledge/routes.ts`, `weekly-research.ts`, `scheduled-work.ts`, `session-bridge.ts`, `offices.ts`, `accept-stage-result.ts`, `worker-runtime.ts`, `closeout-recovery.ts`, `ticket-evidence.ts`, `coordination.ts`, `run-accounting.ts`, `knowledge.ts`, `weekly-rollup.ts`, `conversations/conversations.ts`, `.activeClaims`, `run-retrospective.ts`, `engine.ts`, `OfficeSnapshot`, `registry.ts`, `digest`, `assignment-poll.ts`, `it-specialist.ts`, `SourceRegistry`, `investigations/run.ts`, `knowledge-snapshot.ts`, `record-trigger.ts`, `outbox.ts`, `WorkTime`, `.save`, `maintenance/maintenance.ts`, `KnowledgeReference`, `investigations/ledger.ts`, `http/commands.ts`, `remove-candidate.ts`, `lesson-selection.ts`, `jira-time.ts`, `outbound.ts`, `goal-reviews.ts`, `checkpoint-completion.ts`, `brain-maintenance.ts`, `retrospective-subject.ts`, `slack-intake/report.ts`, `knowledge/learning-events.ts`, `telemetry/report.ts`, `.emit`, `cost-entries.ts`, `SlackMessages`, `scheduled-retrospectives.ts`, `diagnostic-snapshot.ts`?**
  _High betweenness centrality (0.134) - this node is a cross-community bridge._
- **Why does `command()` connect `Store` to `github-delivery.ts`, `activation-recovery.ts`, `office/config.ts`, `dependency-bots/adopt.ts`, `assignment-context.ts`, `process.ts`, `store.ts`, `requests.ts`, `github-readiness.ts`, `azure.ts`, `agents.ts`, `cec/issue-publication.ts`, `slack-intake/run.ts`, `scheduled-work.ts`, `session-bridge.ts`, `accept-stage-result.ts`, `worker-runtime.ts`, `closeout-recovery.ts`, `ticket-evidence.ts`, `coordination.ts`, `engine.ts`, `registry.ts`, `assignment-poll.ts`, `it-specialist.ts`, `.save`, `maintenance/maintenance.ts`, `remove-candidate.ts`, `jira-time.ts`, `reader.ts`, `brain-maintenance.ts`, `contract.ts`, `.emit`, `command-registry.ts`, `liveReach`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `TicketJob` connect `github-delivery.ts` to `activation-recovery.ts`, `dependency-bots/adopt.ts`, `source-amendment.ts`, `digest`, `assignment-context.ts`, `requests.ts`, `Inspector.tsx`, `github-readiness.ts`, `azure.ts`, `shared.ts`, `accept-stage-result.ts`, `worker-runtime.ts`, `closeout-recovery.ts`, `coordination.ts`, `run-accounting.ts`, `.activeClaims`, `engine.ts`, `OfficeSnapshot`, `it-specialist.ts`, `record-trigger.ts`, `remove-candidate.ts`, `brain-maintenance.ts`, `retrospective-subject.ts`, `work.ts`, `.emit`, `.value`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _434 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `github-delivery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.046145940390544704 - nodes in this community are weakly interconnected._
- **Should `activation-recovery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05898989898989899 - nodes in this community are weakly interconnected._
- **Should `office/config.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07828947368421052 - nodes in this community are weakly interconnected._