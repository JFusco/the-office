# Graph Report - the-office  (2026-11-10)

## Corpus Check
- 699 files · ~290,622 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3560 nodes · 15909 edges · 94 communities (93 shown, 1 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 96 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `79c92af2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- dependency-bots/adopt.ts
- record-trigger.ts
- App.tsx
- source-amendment.ts
- engine.ts
- office/config.ts
- .emit
- artifact
- cx
- worker-runtime.ts
- Inspector.tsx
- delivery-task.ts
- github-delivery.ts
- conversations/slack.ts
- requests.ts
- agents.ts
- Button
- resume-provider-review.ts
- index.tsx
- .transaction
- IntakeLedger
- digest
- lesson-selection.ts
- MapView.tsx
- SourceRegistry
- PeoplePanel.tsx
- Conversation.tsx
- TimeBook.tsx
- azure.ts
- maintenance.ts
- GitHubDelivery
- Store
- retrospective-subject.ts
- features.ts
- investigations/ledger.ts
- github-check-selection.ts
- session-bridge.ts
- github/issue-publication.ts
- store.ts
- schedule.ts
- run-accounting.ts
- telemetry.ts
- cec/workflow.ts
- tracking-issue.ts
- notifications.ts
- http/commands.ts
- scheduled-work.ts
- investigations/run.ts
- run-retrospective.ts
- cost-totals.ts
- offices.ts
- LessonsPanel.tsx
- digest
- .save
- work.ts
- jira-time.ts
- time-scope.ts
- Coordinator
- blocker-followups.ts
- knowledge.ts
- weekly-rollup.ts
- index.ts
- assignment-poll.ts
- dependencies.ts
- remove-candidate.ts
- release-unpark.ts
- owned-artifact.ts
- coordination.ts
- OfficeSnapshot
- Role
- retire-external-delivery.ts
- it-specialist.ts
- goal-reviews.ts
- discovery-recovery.ts
- admit-improvement.ts
- ControlStore
- fact-bounds.ts
- contract.ts
- maintenance-triggers.ts
- codex-rollout.ts
- useOfficePreferences.ts
- learningDigest
- scheduler.ts
- maintenance-facts.ts
- scheduled-retrospectives.ts
- WorkTime
- MaintenanceRun
- DailyCTO.tsx
- shared.ts
- command-registry.ts
- extract-worker.mjs
- slack-supersession.ts
- helper-evidence.py

## God Nodes (most connected - your core abstractions)
1. `Store` - 318 edges
2. `TicketJob` - 144 edges
3. `GitHubDelivery` - 135 edges
4. `digest()` - 105 edges
5. `command()` - 103 edges
6. `artifact()` - 98 edges
7. `workKey()` - 91 edges
8. `cx()` - 90 edges
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
- `tree()` --indirect_call--> `row()`  [INFERRED]
  server/features/planning-baseline.ts → src/telemetry/report.ts

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

## Communities (94 total, 1 thin omitted)

### Community 0 - "dependency-bots/adopt.ts"
Cohesion: 0.20
Nodes (20): readBackOrThrow(), closesIssue(), linkedBody(), linkPR(), dependabotPR, adoptDependencyBot(), adoptOne(), DependencyBot (+12 more)

### Community 1 - "record-trigger.ts"
Cohesion: 0.15
Nodes (26): baselineLearning(), LEARNING_BASELINES, maintainLearning(), clip(), JobLike, recordCIBudget(), recordParked(), recordRepairBudget() (+18 more)

### Community 2 - "App.tsx"
Cohesion: 0.05
Nodes (47): SendMessage, BrainDrawer(), GoalList(), blank(), goalInput, Goals(), themeColor, BrainWorkspace (+39 more)

### Community 3 - "source-amendment.ts"
Cohesion: 0.07
Nodes (63): adoptCandidate(), approvedText(), assert(), amendmentIssueSha256(), authorizeSourceAmendment(), Binding, assert(), normalize() (+55 more)

### Community 4 - "engine.ts"
Cohesion: 0.12
Nodes (29): checkMail(), drainMail(), requestMail(), dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), resume() (+21 more)

### Community 5 - "office/config.ts"
Cohesion: 0.06
Nodes (76): stagePrompt(), StagePromptInput, METADATA_FINDING_GUIDANCE, partialLocalCleanupCandidate(), savedAdmissionUnresolved(), assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate() (+68 more)

### Community 6 - ".emit"
Cohesion: 0.09
Nodes (30): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+22 more)

### Community 7 - "artifact"
Cohesion: 0.05
Nodes (126): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+118 more)

### Community 8 - "cx"
Cohesion: 0.06
Nodes (62): BrainWorkspace(), EvidenceCard(), TicketHeading(), displayAgentTask(), githubStageLabels, withoutElapsed(), CameraBookmark, restoreBookmark() (+54 more)

### Community 9 - "worker-runtime.ts"
Cohesion: 0.09
Nodes (33): candidateWorkspaceEnvironment(), assignmentSubject(), lessonPurpose(), MAINTENANCE, assertRetainedDispatchScope(), ROOT, ModelRoute, labels (+25 more)

### Community 10 - "Inspector.tsx"
Cohesion: 0.11
Nodes (35): labels, PORTRAIT, STEP, STEP_MARK, TicketDetail(), hasDesk(), personName(), Person() (+27 more)

### Community 11 - "delivery-task.ts"
Cohesion: 0.21
Nodes (11): cecPrompt(), resolvedDecisionNote(), stageInstructions, APPROACH_GUIDANCE, reviewInstructions(), deliveryTask(), DeliveryTaskInput, DISCOVERY_GUIDANCE (+3 more)

### Community 12 - "github-delivery.ts"
Cohesion: 0.05
Nodes (102): containedFile(), harnessCloseout(), PASSING, verifyMergeActions(), findingsBlock(), namedRepairIds(), assertMayMutate(), HarnessControl (+94 more)

### Community 13 - "conversations/slack.ts"
Cohesion: 0.16
Nodes (11): channelNoticeAuthorized(), MergeNotifications, SlackMessages, SlackRequestSchema, SlackResultSchema, SlackVerificationSchema, goalNoticeAuthorized(), sendGoalNotice() (+3 more)

### Community 14 - "requests.ts"
Cohesion: 0.09
Nodes (51): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+43 more)

### Community 15 - "agents.ts"
Cohesion: 0.09
Nodes (36): cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), cecChatPrompt(), ctoChatPrompt(), itChatPrompt(), slackSendPrompt() (+28 more)

### Community 16 - "Button"
Cohesion: 0.09
Nodes (33): guidanceExcerpt(), evidenceTitle(), KnowledgeCapturePage, KnowledgeDigestDelivery, KnowledgeActivityPage, Activity(), ActivityStatus(), AssignmentKnowledge() (+25 more)

### Community 17 - "resume-provider-review.ts"
Cohesion: 0.22
Nodes (23): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), ProjectCard, projectCards(), projectGraphql() (+15 more)

### Community 18 - "index.tsx"
Cohesion: 0.09
Nodes (47): KnowledgeCadence, KnowledgeDestination, KnowledgeSourceKind, KnowledgeSourceState, KnowledgeSourceSummary, AddPublicSource(), AddSourceForm(), SourceConnection (+39 more)

### Community 19 - ".transaction"
Cohesion: 0.14
Nodes (15): featureItemComplete(), reconcileFeatureCompletion(), recoverFeatures(), GitHubOperations, digestNoticeNeverDispatched(), fileLessonIssue(), lessonIssueBody(), lessonIssueMarker() (+7 more)

### Community 20 - "IntakeLedger"
Cohesion: 0.07
Nodes (36): captureAfter(), CaptureMetadata, capturePage(), cursor(), key(), intakeActivity(), knowledgeActivityPage(), createExtractor() (+28 more)

### Community 21 - "digest"
Cohesion: 0.11
Nodes (54): activeEffectId(), harnessEffect, retryRead(), linkDraftIssue(), protectedOriginalClaim(), admitPRMetadata(), METADATA_FINDING, assessPRMetadata() (+46 more)

### Community 22 - "lesson-selection.ts"
Cohesion: 0.21
Nodes (14): knowledgeContext(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, LessonSelection, MAX_LESSONS, normalPath() (+6 more)

### Community 23 - "MapView.tsx"
Cohesion: 0.09
Nodes (34): KnowledgeActivity, KnowledgeEdge, KnowledgeIntakeStatus, KnowledgeMap, KnowledgeNode, CameraPose, flightPose(), cameraTarget() (+26 more)

### Community 24 - "SourceRegistry"
Cohesion: 0.09
Nodes (25): Config, configDigest(), IntakeConfig, readConfig(), SlackReadAuthority, readAuthority(), Command, sourceCommand() (+17 more)

### Community 25 - "PeoplePanel.tsx"
Cohesion: 0.10
Nodes (34): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+26 more)

### Community 26 - "Conversation.tsx"
Cohesion: 0.08
Nodes (44): projectOutbox(), slackRequestSettled(), knowledgeOutbox(), checkpointSuperseded(), Conversation(), Outbox(), recommendedReply(), slackMessageStatus() (+36 more)

### Community 27 - "TimeBook.tsx"
Cohesion: 0.09
Nodes (41): TelemetryReport, AzureBuild, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens(), usd() (+33 more)

### Community 28 - "azure.ts"
Cohesion: 0.10
Nodes (27): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+19 more)

### Community 29 - "maintenance.ts"
Cohesion: 0.09
Nodes (32): maintenancePolicies(), captureLearning(), recordLearningOpportunity(), captureMaintenanceStep(), retainAcceptedResult(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult (+24 more)

### Community 30 - "GitHubDelivery"
Cohesion: 0.09
Nodes (33): removeAdoptedClone(), GitHubDelivery, boardPreflightCandidate(), Ownership, reconcileBoardPreflight(), reported, Scope, advisoryPM() (+25 more)

### Community 31 - "Store"
Cohesion: 0.05
Nodes (21): correlatedBuild(), JiraOperations, plain(), unpack(), GitHubFeaturePublisher, Result, Assessment, Engine (+13 more)

### Community 32 - "retrospective-subject.ts"
Cohesion: 0.15
Nodes (19): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+11 more)

### Community 33 - "features.ts"
Cohesion: 0.09
Nodes (54): approveFeature(), assertRetainedItems(), commandFeature(), createFeature(), featureById(), mutation(), reviewQuestions(), assertFeatureDependencyOrder() (+46 more)

### Community 34 - "investigations/ledger.ts"
Cohesion: 0.31
Nodes (12): projectSlackDeliveries(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint(), supersedingDelivery(), investigationCandidates(), investigationId() (+4 more)

### Community 35 - "github-check-selection.ts"
Cohesion: 0.25
Nodes (15): checksFailed(), checksPassed(), checksPending(), CurrentChecksWait, currentMergeChecks(), pass(), pending(), requireThat() (+7 more)

### Community 36 - "session-bridge.ts"
Cohesion: 0.11
Nodes (28): claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexSessionContext(), readRollout, claudeSessions(), codexSessions() (+20 more)

### Community 37 - "github/issue-publication.ts"
Cohesion: 0.10
Nodes (21): Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), plainDescription(), Transition, JiraFeaturePublisher (+13 more)

### Community 38 - "store.ts"
Cohesion: 0.09
Nodes (18): helperTelemetry(), dispatchExposure(), Clock, applyConnectionSettings(), closeConnection(), optimizeOnOpen(), EffectOperation, EffectUncertainError (+10 more)

### Community 39 - "schedule.ts"
Cohesion: 0.07
Nodes (81): independentIntakeResult(), captureProposal(), effectId(), newTask(), recordObservation(), settlePage(), privateFile(), CaptureReceipt (+73 more)

### Community 40 - "run-accounting.ts"
Cohesion: 0.12
Nodes (29): BoundedRead, EvidenceOutcome, backfillClaudeCost(), CompletionReader, codexHome(), createdAt(), dayDirs(), header() (+21 more)

### Community 41 - "telemetry.ts"
Cohesion: 0.09
Nodes (28): CodexRollout, CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL (+20 more)

### Community 42 - "cec/workflow.ts"
Cohesion: 0.13
Nodes (32): parksInJira(), MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), run(), advance(), nextStage(), publicationEvidenceGap() (+24 more)

### Community 43 - "tracking-issue.ts"
Cohesion: 0.36
Nodes (10): ensureTrackingIssue(), findTrackingIssue(), ownTracking(), TrackingIssue, trackingIssueBody(), trackingIssueTitle(), trackingMarker(), centralCompanionHandoff() (+2 more)

### Community 44 - "notifications.ts"
Cohesion: 0.16
Nodes (19): ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR, plainSlackText() (+11 more)

### Community 45 - "http/commands.ts"
Cohesion: 0.25
Nodes (15): retryRecipientLookup(), bindDiscoveryResume(), DiscoveryResumeInput, configureDigestDelivery(), DigestSettings, configureKnowledge(), declineLessonIssue(), demoteLesson() (+7 more)

### Community 46 - "scheduled-work.ts"
Cohesion: 0.10
Nodes (44): deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), metadataRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), deterministicActions, eligible() (+36 more)

### Community 47 - "investigations/run.ts"
Cohesion: 0.18
Nodes (17): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationEvidence(), OFFICE_FIX_PROMPT, OfficeFixResult, validateOfficeFix(), investigationReady(), InvestigationOptions (+9 more)

### Community 48 - "run-retrospective.ts"
Cohesion: 0.18
Nodes (20): acceptRetrospective(), appendLearningFacts(), freezeLearningPacket(), MaintenancePacketSection, readAcceptedResult(), clip(), PACKET_LIMIT, retrospectiveFacts() (+12 more)

### Community 49 - "cost-totals.ts"
Cohesion: 0.26
Nodes (11): CURRENT_SCOPE_POLICY, isModelWork(), isTicketModelWork(), ScopePolicy, awaitingEvidence(), CaptureContext, inCostWindow(), TicketCost (+3 more)

### Community 50 - "offices.ts"
Cohesion: 0.07
Nodes (46): Accepted, normalizeStatement(), RETROSPECTIVE_HISTORY, retainedArtifactScope(), eventSourceBindings(), eventVisible(), leadershipContext(), leadershipEntries() (+38 more)

### Community 51 - "LessonsPanel.tsx"
Cohesion: 0.13
Nodes (18): OfficeProposal, RetrospectiveRecord, WeeklyRollup, BlockerFollowups(), IntakeSummary(), lessonsView, newest(), ROLLUP_ROWS (+10 more)

### Community 52 - "digest"
Cohesion: 0.13
Nodes (28): comparableSlackText(), AuthoredDigest, reconcileDigestAuthorship(), unitAuthorship(), assertDigestDispatch(), annotateAuthoredUnits(), outboundBody(), retainOutboundBody() (+20 more)

### Community 53 - ".save"
Cohesion: 0.10
Nodes (38): file, folder, logs, root, xml(), BLOCKED, Execute, findComment() (+30 more)

### Community 54 - "work.ts"
Cohesion: 0.12
Nodes (16): pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION, AssignmentResult, CompletionCondition, DependencyObservation, EligibilityState, FailureCategory (+8 more)

### Community 55 - "jira-time.ts"
Cohesion: 0.21
Nodes (13): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+5 more)

### Community 56 - "time-scope.ts"
Cohesion: 0.25
Nodes (17): isLegacyTicketWork(), scopeSelector(), midnight(), TicketDay, ticketDayTotals(), captureTime(), timeLedger(), artifact() (+9 more)

### Community 57 - "Coordinator"
Cohesion: 0.08
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 58 - "blocker-followups.ts"
Cohesion: 0.47
Nodes (8): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), readBackConversations(), handoff(), reconcileBlockerFollowups(), BlockerFollowup

### Community 59 - "knowledge.ts"
Cohesion: 0.07
Nodes (67): knowledgeActivity(), assignmentKnowledge(), independentDigestEvidence(), prepareDigestBodies(), retainDigestBody(), knowledgeSnapshot(), officeKnowledgeSnapshot(), AssignmentLookups (+59 more)

### Community 60 - "weekly-rollup.ts"
Cohesion: 0.09
Nodes (38): learningMetrics(), lessonsNeedingReview(), RollupResult, RollupResultSchema, harperFolder(), KnowledgeRunner, RETROSPECTIVE_TIMEOUT, retryDelay() (+30 more)

### Community 61 - "index.ts"
Cohesion: 0.07
Nodes (41): args, [cmd,...rawArgs], commands, key, projectIndex, AUTO_ADOPT_BOTS, close(), config (+33 more)

### Community 62 - "assignment-poll.ts"
Cohesion: 0.14
Nodes (17): syncOutbox(), Execute, admitReadyCards(), WAIT_STATUSES, adoptDependabot(), DEPENDABOT, openDependabotPulls(), readRepo() (+9 more)

### Community 63 - "dependencies.ts"
Cohesion: 0.16
Nodes (23): reconcileNoticeConfirmations(), Admission, admit(), IntakeContext, compatible(), dependencyCompletionKey(), dependencyEligibility(), DependencyStores (+15 more)

### Community 64 - "remove-candidate.ts"
Cohesion: 0.20
Nodes (16): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+8 more)

### Community 66 - "release-unpark.ts"
Cohesion: 0.31
Nodes (8): due(), MAX_RELEASE_UNPARKS, RELEASE_CHECK_MS, unparkReleasedWaits(), unreadLaneWrite(), compare(), highestStableAtLeast(), parts()

### Community 67 - "owned-artifact.ts"
Cohesion: 0.26
Nodes (11): ghLogCacheEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_SOURCE_PATHS, officeSource(), done(), readBoundedNoFollow() (+3 more)

### Community 68 - "coordination.ts"
Cohesion: 0.15
Nodes (20): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), legacy, validateNativeContinuation(), checkpointWindow() (+12 more)

### Community 69 - "OfficeSnapshot"
Cohesion: 0.13
Nodes (20): FeatureRound, FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures(), draftKey() (+12 more)

### Community 70 - "Role"
Cohesion: 0.09
Nodes (17): LOCAL_BINDINGS, file, project, root, contextPacket(), DeliverySlot, officeCapacity, PROJECTS (+9 more)

### Community 71 - "retire-external-delivery.ts"
Cohesion: 0.44
Nodes (6): completedPRReviews(), eligible(), mergedByOwner(), ownerSettles(), retireExternalDeliveries(), settledExternalRepair()

### Community 72 - "it-specialist.ts"
Cohesion: 0.13
Nodes (16): partialLocalCleanupKey(), ITContext, publishITReport(), delays, recoverAttempt(), listenerHealth(), providers, ProviderStatusChecks (+8 more)

### Community 73 - "goal-reviews.ts"
Cohesion: 0.13
Nodes (18): applyGoalReview(), EvidenceRefSchema, FreshDailyResultSchema, GoalEvidenceRequestSchema, statusAllowed(), workEvidence(), GoalInput, saveGoal() (+10 more)

### Community 74 - "discovery-recovery.ts"
Cohesion: 0.33
Nodes (7): Assessment, diagnosticProof(), ownedArtifact(), Ownership, rawHash(), recoverDiscovery(), scopeNote()

### Community 75 - "admit-improvement.ts"
Cohesion: 0.22
Nodes (16): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+8 more)

### Community 76 - "ControlStore"
Cohesion: 0.15
Nodes (10): mirror(), runWeeklyResearch(), scheduledResearch(), DailyCTO, dailyReviewPrompt(), DailyResultSchema, Briefing, saveReviewBriefing() (+2 more)

### Community 77 - "fact-bounds.ts"
Cohesion: 0.26
Nodes (15): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+7 more)

### Community 78 - "contract.ts"
Cohesion: 0.22
Nodes (11): At, Errno, GroupInventory, GroupProbe, LifecycleDiagnostic, Phase, Pid, groupInventory() (+3 more)

### Community 79 - "maintenance-triggers.ts"
Cohesion: 0.42
Nodes (8): clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates(), maintenanceCompletedId(), maintenanceKey(), visibleMaintenanceTriggerIds(), RetrospectiveTrigger

### Community 80 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 81 - "useOfficePreferences.ts"
Cohesion: 0.11
Nodes (21): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, acceptPreferences(), PreferenceCandidate (+13 more)

### Community 82 - "learningDigest"
Cohesion: 0.43
Nodes (7): learningDigest(), expireLearningPackets(), packetReferences(), publicTopicSafe(), researchTopics(), TEMPLATES, ResearchTopic

### Community 83 - "scheduler.ts"
Cohesion: 0.17
Nodes (12): ROLES, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch(), foreignWork() (+4 more)

### Community 84 - "maintenance-facts.ts"
Cohesion: 0.33
Nodes (5): ARTIFACT_LIMIT, clip(), LEDGER_STEPS, MAINTENANCE_LIMIT, maintenanceFacts()

### Community 85 - "scheduled-retrospectives.ts"
Cohesion: 0.60
Nodes (5): busyMaintenanceIds(), triggerJobId(), busySubjects(), scheduledRetrospectives(), status()

### Community 87 - "WorkTime"
Cohesion: 0.18
Nodes (18): ConfirmedSegment, LiveAnchor, ObservationGap, SnapshotOrdering, TimeLedgerState, WorkTime, Acc, bump() (+10 more)

### Community 88 - "MaintenanceRun"
Cohesion: 0.15
Nodes (17): BrainStatusSchema, identity, brainCheckpointCompletion(), coverageSchema, followupSchema, verified, reconcileCompletedCheckpoints(), checkpointHasMaintenanceAlert() (+9 more)

### Community 89 - "DailyCTO.tsx"
Cohesion: 0.26
Nodes (8): CTOReview(), goalState, DailyCTO(), GoalHistory(), reportDate(), reviewStatus, reviewExcerpt(), ReviewText()

### Community 94 - "shared.ts"
Cohesion: 0.08
Nodes (35): diagnosticContext(), diagnosticSnapshot(), nativeDeliveryResolved(), ProjectReadiness, DailyCTOSummary, SchedulerState, itAgent(), itDiagnostics() (+27 more)

### Community 97 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 103 - "extract-worker.mjs"
Cohesion: 0.70
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 104 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

## Knowledge Gaps
- **389 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+384 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `dependency-bots/adopt.ts`, `record-trigger.ts`, `source-amendment.ts`, `engine.ts`, `office/config.ts`, `.emit`, `artifact`, `worker-runtime.ts`, `delivery-task.ts`, `github-delivery.ts`, `conversations/slack.ts`, `requests.ts`, `agents.ts`, `resume-provider-review.ts`, `.transaction`, `IntakeLedger`, `digest`, `lesson-selection.ts`, `SourceRegistry`, `azure.ts`, `maintenance.ts`, `GitHubDelivery`, `retrospective-subject.ts`, `features.ts`, `investigations/ledger.ts`, `session-bridge.ts`, `github/issue-publication.ts`, `store.ts`, `schedule.ts`, `run-accounting.ts`, `cec/workflow.ts`, `tracking-issue.ts`, `notifications.ts`, `http/commands.ts`, `scheduled-work.ts`, `investigations/run.ts`, `run-retrospective.ts`, `offices.ts`, `digest`, `.save`, `jira-time.ts`, `time-scope.ts`, `blocker-followups.ts`, `knowledge.ts`, `weekly-rollup.ts`, `index.ts`, `assignment-poll.ts`, `dependencies.ts`, `remove-candidate.ts`, `release-unpark.ts`, `coordination.ts`, `OfficeSnapshot`, `Role`, `retire-external-delivery.ts`, `it-specialist.ts`, `goal-reviews.ts`, `discovery-recovery.ts`, `admit-improvement.ts`, `learningDigest`, `scheduler.ts`, `scheduled-retrospectives.ts`, `MaintenanceRun`, `shared.ts`?**
  _High betweenness centrality (0.115) - this node is a cross-community bridge._
- **Why does `Engine` connect `Store` to `features.ts`, `engine.ts`, `coordination.ts`, `.emit`, `cec/workflow.ts`, `github-delivery.ts`, `notifications.ts`, `conversations/slack.ts`, `agents.ts`, `requests.ts`, `scheduled-work.ts`, `offices.ts`, `azure.ts`, `maintenance.ts`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `OfficeSnapshot` connect `OfficeSnapshot` to `record-trigger.ts`, `App.tsx`, `cx`, `Inspector.tsx`, `Button`, `index.tsx`, `PeoplePanel.tsx`, `Conversation.tsx`, `TimeBook.tsx`, `azure.ts`, `maintenance.ts`, `Store`, `investigations/ledger.ts`, `store.ts`, `cec/workflow.ts`, `offices.ts`, `LessonsPanel.tsx`, `work.ts`, `it-specialist.ts`, `useOfficePreferences.ts`, `MaintenanceRun`, `DailyCTO.tsx`, `shared.ts`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `command()` (e.g. with `.constructor()` and `executeRequest()`) actually correct?**
  _`command()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _389 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `record-trigger.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14838709677419354 - nodes in this community are weakly interconnected._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05012531328320802 - nodes in this community are weakly interconnected._