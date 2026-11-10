# Graph Report - office-final-recovery  (2026-11-09)

## Corpus Check
- 544 files · ~257,622 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3032 nodes · 13019 edges · 90 communities (88 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 71 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `188f192d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- github-delivery.ts
- cec/workflow.ts
- Inspector.tsx
- run-accounting.ts
- TicketJob
- maintenance.ts
- schedule.ts
- source-amendment.ts
- artifact
- digest
- OfficeScene.tsx
- .emit
- azure.ts
- worker-runtime.ts
- agents.ts
- index.ts
- run-retrospective.ts
- requests.ts
- workKey
- shared.ts
- Role
- daily-cto.ts
- TimeBook.tsx
- store.ts
- knowledge.ts
- investigations/run.ts
- App.tsx
- record-trigger.ts
- work-summary.ts
- it-specialist.ts
- scope-repair-resume.ts
- weekly-rollup.ts
- Store
- session-bridge.ts
- configDigest
- mutedCopy
- dependency-bots/adopt.ts
- cost-ledger.ts
- resume-provider-review.ts
- useOfficePreferences.ts
- Coordinator
- process.ts
- .save
- assertMayMutate
- accept-stage-result.ts
- .transaction
- time-scope.ts
- scheduled-work.ts
- features/workflow.ts
- github/issue-publication.ts
- projects.ts
- dependencies.ts
- features.ts
- remove-candidate.ts
- approval.ts
- .getEffect
- FeatureWorkspace.tsx
- JiraIssuePublisher
- command
- coordination-tick.ts
- WorkTime
- cec/issue-publication.ts
- jira-time.ts
- http/commands.ts
- conversations/slack.ts
- tracking-issue.ts
- lesson-selection.ts
- coordination.ts
- retrospective-subject.ts
- harnessEffect
- publish-pr.ts
- blocker-followups.ts
- office-lessons.ts
- delivery-task.ts
- assignment-poll.ts
- .value
- notifications.ts
- discovery-recovery.ts
- DailyCTO.tsx
- channel-notice.ts
- create-candidate.ts
- cost-totals.ts
- work.ts
- SlackMessages
- command-registry.ts
- brain-followup.ts
- highestStableAtLeast
- slack-supersession.ts
- helper-evidence.py

## God Nodes (most connected - your core abstractions)
1. `Store` - 284 edges
2. `TicketJob` - 132 edges
3. `GitHubDelivery` - 121 edges
4. `command()` - 100 edges
5. `artifact()` - 87 edges
6. `digest()` - 86 edges
7. `workKey()` - 83 edges
8. `cx()` - 77 edges
9. `OfficeSnapshot` - 66 edges
10. `StageResult` - 64 edges

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
- 3-file cycle: `server/knowledge/slack-intake/progress.ts -> server/knowledge/slack-intake/read-links.ts -> server/knowledge/slack-intake/seed-status.ts -> server/knowledge/slack-intake/progress.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/stage-reconciliation.ts -> server/delivery/recovery/implementation/continuation-review-readback.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/recovery/retire-external-delivery.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-guard.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/queue-repairs.ts -> server/delivery/repairs/reconcile-ci-diagnosis.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/parking/resume-provider-review.ts -> server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/parking/resume-provider-review.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/preparation/post-conflict-preparation.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-publication.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/conversations/conversations.ts -> server/conversations/slack.ts -> server/workers/agents.ts -> server/conversations/conversations.ts`
- 3-file cycle: `server/conversations/slack.ts -> server/workers/agents.ts -> server/workers/worker-runtime.ts -> server/conversations/slack.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/scope-repair/scope-repair-resume.ts -> server/delivery/recovery/validation/validation-provider-context.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/conversations/conversations.ts -> server/scheduling/engine.ts -> server/workers/agents.ts -> server/conversations/conversations.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/stage-prompts.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-checkout.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-evidence.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-preparation.ts -> server/delivery/pipeline/github-delivery.ts`

## Communities (90 total, 2 thin omitted)

### Community 0 - "github-delivery.ts"
Cohesion: 0.08
Nodes (71): findingsBlock(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery(), discover(), refreshDependencies(), routeExisting() (+63 more)

### Community 1 - "cec/workflow.ts"
Cohesion: 0.05
Nodes (64): correlatedBuild(), checkMail(), drainMail(), requestMail(), parksInJira(), dispatchNightly(), drainDelivery(), enableNightly() (+56 more)

### Community 2 - "Inspector.tsx"
Cohesion: 0.06
Nodes (74): Conversation(), Outbox(), SendMessage, recommendedReply(), slackMessageStatus(), SlackDeliveryCard(), labels, BlockerFollowups() (+66 more)

### Community 3 - "run-accounting.ts"
Cohesion: 0.05
Nodes (70): ghLogCacheEvidence(), BoundedRead, done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf(), CompletionReader (+62 more)

### Community 4 - "TicketJob"
Cohesion: 0.06
Nodes (43): containedFile(), removeAdoptedClone(), namedRepairIds(), BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction(), dependabotReviewGuidance() (+35 more)

### Community 5 - "maintenance.ts"
Cohesion: 0.05
Nodes (51): maintenancePolicies(), captureMaintenanceStep(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, BrainStatusSchema, identity, parseBrainStatus() (+43 more)

### Community 6 - "schedule.ts"
Cohesion: 0.09
Nodes (51): Config, digest(), IntakeConfig, privateFile(), readConfig(), ToolNames, CaptureReceipt, ChannelProgress (+43 more)

### Community 7 - "source-amendment.ts"
Cohesion: 0.07
Nodes (67): adoptCandidate(), reported, Scope, approvedText(), assert(), amendmentInstruction(), amendmentIssueSha256(), authorizeSourceAmendment() (+59 more)

### Community 8 - "artifact"
Cohesion: 0.11
Nodes (58): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+50 more)

### Community 9 - "digest"
Cohesion: 0.08
Nodes (60): advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat(), continuationNativeReview(), assertPostConflictOwnership(), postConflictPreparationEvidence() (+52 more)

### Community 10 - "OfficeScene.tsx"
Cohesion: 0.06
Nodes (56): displayAgentTask(), withoutElapsed(), LiveAgentTask(), Props, RunningTask(), text(), Avatar(), AzureWall() (+48 more)

### Community 11 - ".emit"
Cohesion: 0.08
Nodes (39): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+31 more)

### Community 12 - "azure.ts"
Cohesion: 0.07
Nodes (46): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+38 more)

### Community 13 - "worker-runtime.ts"
Cohesion: 0.07
Nodes (42): SlackResultSchema, SlackVerificationSchema, candidateWorkspaceEnvironment(), assignmentSubject(), prepareExposure(), contextPacket(), CODEX_DEFAULT_EFFORT, CODEX_DEFAULT_MODEL (+34 more)

### Community 14 - "agents.ts"
Cohesion: 0.08
Nodes (36): cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), cecChatPrompt(), ctoChatPrompt(), itChatPrompt(), slackSendPrompt() (+28 more)

### Community 15 - "index.ts"
Cohesion: 0.07
Nodes (40): args, [cmd,...rawArgs], commands, key, projectIndex, featureRoute(), close(), config (+32 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.08
Nodes (43): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, learningDigest(), appendLearningFacts(), expireLearningPackets(), packetReferences(), freezeLearningPacket() (+35 more)

### Community 17 - "requests.ts"
Cohesion: 0.10
Nodes (45): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+37 more)

### Community 18 - "workKey"
Cohesion: 0.09
Nodes (38): partialLocalCleanupCandidate(), completedPRReviews(), savedActivationFailure(), continuationScope(), brainImplementationCandidate(), BrainReadback, digest(), implementationRecoveryCandidate() (+30 more)

### Community 19 - "shared.ts"
Cohesion: 0.08
Nodes (37): diagnosticContext(), ProjectReadiness, DailyCTOSummary, GoalProgress, ProgressionItem, SchedulerState, itAgent(), itDiagnostics() (+29 more)

### Community 20 - "Role"
Cohesion: 0.10
Nodes (40): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+32 more)

### Community 21 - "daily-cto.ts"
Cohesion: 0.09
Nodes (24): DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), reviewWeekday(), queueGoalEvidenceRequest(), applyGoalReview(), DailyResultSchema (+16 more)

### Community 22 - "TimeBook.tsx"
Cohesion: 0.10
Nodes (38): TelemetryReport, AzureBuild, ROLE_NAMES, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens() (+30 more)

### Community 23 - "store.ts"
Cohesion: 0.09
Nodes (28): snapshot(), Clock, EASTERN, easternDayFormatter, easternPartsFormatter, systemClock, DELIVERY_CONCURRENCY, sanitizeObject() (+20 more)

### Community 24 - "knowledge.ts"
Cohesion: 0.07
Nodes (37): distinct(), identity(), improvementIncident(), improvementIncidentKey(), LessonSelection, SEEDS, Completion, BlockerFollowup (+29 more)

### Community 25 - "investigations/run.ts"
Cohesion: 0.12
Nodes (29): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationCandidates(), investigationId(), investigationEvidence(), investigationFollowUps(), INVOCATION_SOURCE_REFS, invocationSource() (+21 more)

### Community 26 - "App.tsx"
Cohesion: 0.07
Nodes (35): themeColor, CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants, ElevatorPhase, floorVariants, leftDoor (+27 more)

### Community 27 - "record-trigger.ts"
Cohesion: 0.11
Nodes (36): baselineLearning(), LEARNING_BASELINES, maintainLearning(), clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates(), maintenanceCompletedId() (+28 more)

### Community 28 - "work-summary.ts"
Cohesion: 0.15
Nodes (26): compactSteps(), App(), deliveryRepairProjection(), DependencyNotice(), card, InboxQueue(), ACTIVE, maintenanceUpdate() (+18 more)

### Community 29 - "it-specialist.ts"
Cohesion: 0.12
Nodes (21): partialLocalCleanupKey(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), ITContext, publishITReport(), ITSpecialist (+13 more)

### Community 30 - "scope-repair-resume.ts"
Cohesion: 0.14
Nodes (31): candidateInput(), children, oldAdoptionBasis(), savedCandidateAdmission, Assessment, outsideScanSources(), Ownership, reconcileScopeRepairReadback() (+23 more)

### Community 31 - "weekly-rollup.ts"
Cohesion: 0.12
Nodes (27): learningMetrics(), lessonsNeedingReview(), publicTopicSafe(), researchTopics(), TEMPLATES, RollupResult, RollupResultSchema, harperFolder() (+19 more)

### Community 32 - "Store"
Cohesion: 0.12
Nodes (14): ROLES, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch(), foreignWork() (+6 more)

### Community 33 - "session-bridge.ts"
Cohesion: 0.12
Nodes (23): claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexSessionContext(), readRollout, claudeSessions(), codexSessions() (+15 more)

### Community 34 - "configDigest"
Cohesion: 0.17
Nodes (28): captureProposal(), effectId(), newTask(), recordObservation(), settlePage(), configDigest(), DERIVED, isStoppingFor() (+20 more)

### Community 35 - "mutedCopy"
Cohesion: 0.20
Nodes (22): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS, PickupForm(), channelSettingsProblem() (+14 more)

### Community 36 - "dependency-bots/adopt.ts"
Cohesion: 0.16
Nodes (23): adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR, openDependabotPulls(), readRepo() (+15 more)

### Community 37 - "cost-ledger.ts"
Cohesion: 0.16
Nodes (25): EffectUncertainError, captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress() (+17 more)

### Community 38 - "resume-provider-review.ts"
Cohesion: 0.20
Nodes (24): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard, projectCards() (+16 more)

### Community 39 - "useOfficePreferences.ts"
Cohesion: 0.11
Nodes (21): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, acceptPreferences(), PreferenceCandidate (+13 more)

### Community 40 - "Coordinator"
Cohesion: 0.08
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 41 - "process.ts"
Cohesion: 0.15
Nodes (18): At, Errno, GroupInventory, GroupProbe, LifecycleDiagnostic, Phase, Pid, lifecycleFacts() (+10 more)

### Community 42 - ".save"
Cohesion: 0.26
Nodes (22): BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue(), readIssues(), commentDecision() (+14 more)

### Community 43 - "assertMayMutate"
Cohesion: 0.20
Nodes (18): harnessCloseout(), PASSING, verifyMergeActions(), assertMayMutate(), withHarnessWork(), runHarnessStage(), harnessStageResult(), receipt() (+10 more)

### Community 44 - "accept-stage-result.ts"
Cohesion: 0.18
Nodes (20): HarnessControl, acceptStageResult(), mergeAuthorized(), continuationReviewArtifacts(), reconcileContinuationReview(), savedNegativeContinuationReview(), discoveryReviewSatisfied(), ContinuationDecision (+12 more)

### Community 45 - ".transaction"
Cohesion: 0.18
Nodes (14): featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), recoverFeatures(), EvidenceSchema, helperInstallation(), readReview(), ReviewEvidence (+6 more)

### Community 46 - "time-scope.ts"
Cohesion: 0.19
Nodes (21): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), scopeSelector(), midnight(), TicketDay, ticketDayTotals(), captureTime(), timeLedger() (+13 more)

### Community 47 - "scheduled-work.ts"
Cohesion: 0.15
Nodes (18): deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), deterministicActions, eligible() (+10 more)

### Community 48 - "features/workflow.ts"
Cohesion: 0.19
Nodes (18): discoveryPrompt(), planPrompt(), document(), featureRoot(), DiscoverySchema, identity, manifestFromPlan(), ManifestSchema (+10 more)

### Community 49 - "github/issue-publication.ts"
Cohesion: 0.21
Nodes (9): GitHubFeaturePublisher, PublicationReceipt, Assign, Board, Content, GitHubIssuePublisher, number(), same() (+1 more)

### Community 50 - "projects.ts"
Cohesion: 0.14
Nodes (10): readLocalIntakeReport(), LOCAL_BINDINGS, file, project, root, DeliverySlot, projectById(), projectData() (+2 more)

### Community 51 - "dependencies.ts"
Cohesion: 0.20
Nodes (18): Admission, admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, compatible(), dependencyCompletionKey(), dependencyEligibility() (+10 more)

### Community 52 - "features.ts"
Cohesion: 0.14
Nodes (18): assertFeatureDependencyOrder(), featureDependencyEdges(), key(), admitImprovement(), improvementManifest(), improvementMarker(), improvementProvider(), linkedRepairGap() (+10 more)

### Community 53 - "remove-candidate.ts"
Cohesion: 0.20
Nodes (16): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+8 more)

### Community 54 - "approval.ts"
Cohesion: 0.24
Nodes (15): approveFeature(), assertRetainedItems(), commandFeature(), createFeature(), featureById(), mutation(), reviewQuestions(), artifactPath() (+7 more)

### Community 55 - ".getEffect"
Cohesion: 0.22
Nodes (8): GitHubOperations, fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), Assessment, closeNativeRefresh(), fingerprint(), EffectIntent

### Community 56 - "FeatureWorkspace.tsx"
Cohesion: 0.17
Nodes (16): FeatureRound, FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures(), draftKey() (+8 more)

### Community 57 - "JiraIssuePublisher"
Cohesion: 0.27
Nodes (4): Assignment, JiraIssuePublisher, keyOf(), Transition

### Community 58 - "command"
Cohesion: 0.12
Nodes (10): JiraOperations, plain(), unpack(), officeCapacity, providers, ProviderStatusChecks, summary, command() (+2 more)

### Community 59 - "coordination-tick.ts"
Cohesion: 0.15
Nodes (16): PrerequisitesSchema, legacy, reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION, checkpointWindow(), dueAt() (+8 more)

### Community 60 - "WorkTime"
Cohesion: 0.18
Nodes (18): ConfirmedSegment, LiveAnchor, ObservationGap, SnapshotOrdering, TimeLedgerState, WorkTime, Acc, bump() (+10 more)

### Community 61 - "cec/issue-publication.ts"
Cohesion: 0.20
Nodes (9): Content, jiraText(), plainDescription(), JiraFeaturePublisher, FeaturePublisher, publishFeature(), reserveIdentity(), FeatureManifestItem (+1 more)

### Community 62 - "jira-time.ts"
Cohesion: 0.22
Nodes (12): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+4 more)

### Community 63 - "http/commands.ts"
Cohesion: 0.25
Nodes (14): retryRecipientLookup(), configureKnowledge(), declineLessonIssue(), demoteLesson(), reactivateLesson(), retireLesson(), mirrorOfficeKnowledge(), configureGoalNotices() (+6 more)

### Community 64 - "conversations/slack.ts"
Cohesion: 0.25
Nodes (9): goalNoticeAuthorized(), goalNoticeNeverDispatched(), sendGoalNotice(), maintenanceNoticeAuthorized(), maintenanceNoticeNeverDispatched(), sendMaintenanceNotice(), Effects, recover() (+1 more)

### Community 65 - "tracking-issue.ts"
Cohesion: 0.22
Nodes (14): readBackOrThrow(), ensureTrackingIssue(), findTrackingIssue(), ownTracking(), TrackingIssue, trackingIssueBody(), trackingIssueTitle(), trackingMarker() (+6 more)

### Community 66 - "lesson-selection.ts"
Cohesion: 0.20
Nodes (15): knowledgeContext(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), MAINTENANCE, MAX_LESSONS (+7 more)

### Community 67 - "coordination.ts"
Cohesion: 0.22
Nodes (15): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation(), hours, ReviewResult (+7 more)

### Community 68 - "retrospective-subject.ts"
Cohesion: 0.21
Nodes (13): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, findSubject(), jobSubject(), RetrospectiveSubject, SubjectStepResult (+5 more)

### Community 69 - "harnessEffect"
Cohesion: 0.31
Nodes (11): activeEffectId(), harnessEffect, park(), officeMergeProvenance(), reconcileMergeScannerRetry(), Retry, retryMergeScanner(), retryReadBack() (+3 more)

### Community 70 - "publish-pr.ts"
Cohesion: 0.26
Nodes (13): retryRead(), developerPRContent(), Execute, lintPRContent(), officePRContent(), prContent, assertCandidate(), Candidate (+5 more)

### Community 71 - "blocker-followups.ts"
Cohesion: 0.36
Nodes (9): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), readBackConversations(), diagnosticSnapshot(), nativeDeliveryResolved(), handoff() (+1 more)

### Community 72 - "office-lessons.ts"
Cohesion: 0.29
Nodes (10): normalizeStatement(), decideOfficeProposal(), now(), OfficeKnowledgeStore, proposeOfficeLessons(), retireOfficeLesson(), Input, promoteNoteLesson() (+2 more)

### Community 73 - "delivery-task.ts"
Cohesion: 0.23
Nodes (10): cecPrompt(), resolvedDecisionNote(), stageInstructions, APPROACH_GUIDANCE, reviewInstructions(), deliveryTask(), DeliveryTaskInput, DISCOVERY_GUIDANCE (+2 more)

### Community 74 - "assignment-poll.ts"
Cohesion: 0.31
Nodes (9): noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), pinCourier, due(), unparkReleasedWaits(), resumeParked(), poll() (+1 more)

### Community 75 - ".value"
Cohesion: 0.24
Nodes (6): file, folder, logs, root, xml(), ProjectProgress

### Community 76 - "notifications.ts"
Cohesion: 0.27
Nodes (10): clamp(), LIMITS, MergedPR, plainSlackText(), section(), shippedSummary(), configureNotices(), Identity (+2 more)

### Community 77 - "discovery-recovery.ts"
Cohesion: 0.29
Nodes (10): Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership, rawHash() (+2 more)

### Community 78 - "DailyCTO.tsx"
Cohesion: 0.26
Nodes (8): CTOReview(), goalState, DailyCTO(), GoalHistory(), reportDate(), reviewStatus, reviewExcerpt(), ReviewText()

### Community 79 - "channel-notice.ts"
Cohesion: 0.25
Nodes (6): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), MergeNotifications

### Community 80 - "create-candidate.ts"
Cohesion: 0.31
Nodes (9): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+1 more)

### Community 81 - "cost-totals.ts"
Cohesion: 0.33
Nodes (9): isModelWork(), isTicketModelWork(), ScopePolicy, awaitingEvidence(), CaptureContext, inCostWindow(), TicketCost, ticketCosts() (+1 more)

### Community 82 - "work.ts"
Cohesion: 0.18
Nodes (10): AssignmentResult, CompletionCondition, Continuation, DependencyObservation, EligibilityState, FailureCategory, ReconciliationAction, WorkAssignment (+2 more)

### Community 83 - "SlackMessages"
Cohesion: 0.38
Nodes (4): reconcileNoticeConfirmations(), comparableSlackText(), SlackMessages, SlackRequestSchema

### Community 84 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 86 - "highestStableAtLeast"
Cohesion: 0.83
Nodes (3): compare(), highestStableAtLeast(), parts()

### Community 87 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

## Knowledge Gaps
- **358 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+353 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `github-delivery.ts`, `cec/workflow.ts`, `run-accounting.ts`, `TicketJob`, `maintenance.ts`, `schedule.ts`, `source-amendment.ts`, `artifact`, `digest`, `OfficeScene.tsx`, `.emit`, `azure.ts`, `worker-runtime.ts`, `agents.ts`, `index.ts`, `run-retrospective.ts`, `requests.ts`, `workKey`, `shared.ts`, `daily-cto.ts`, `store.ts`, `knowledge.ts`, `investigations/run.ts`, `record-trigger.ts`, `it-specialist.ts`, `scope-repair-resume.ts`, `weekly-rollup.ts`, `session-bridge.ts`, `dependency-bots/adopt.ts`, `cost-ledger.ts`, `resume-provider-review.ts`, `Coordinator`, `.save`, `assertMayMutate`, `accept-stage-result.ts`, `.transaction`, `time-scope.ts`, `scheduled-work.ts`, `features/workflow.ts`, `github/issue-publication.ts`, `projects.ts`, `dependencies.ts`, `features.ts`, `remove-candidate.ts`, `approval.ts`, `.getEffect`, `JiraIssuePublisher`, `command`, `coordination-tick.ts`, `cec/issue-publication.ts`, `jira-time.ts`, `http/commands.ts`, `conversations/slack.ts`, `tracking-issue.ts`, `lesson-selection.ts`, `coordination.ts`, `retrospective-subject.ts`, `harnessEffect`, `publish-pr.ts`, `blocker-followups.ts`, `office-lessons.ts`, `delivery-task.ts`, `.value`, `notifications.ts`, `discovery-recovery.ts`, `channel-notice.ts`, `create-candidate.ts`, `brain-followup.ts`?**
  _High betweenness centrality (0.109) - this node is a cross-community bridge._
- **Why does `command()` connect `command` to `github-delivery.ts`, `cec/workflow.ts`, `TicketJob`, `maintenance.ts`, `schedule.ts`, `artifact`, `azure.ts`, `worker-runtime.ts`, `agents.ts`, `requests.ts`, `it-specialist.ts`, `session-bridge.ts`, `cost-ledger.ts`, `resume-provider-review.ts`, `Coordinator`, `process.ts`, `.save`, `assertMayMutate`, `.transaction`, `time-scope.ts`, `scheduled-work.ts`, `features/workflow.ts`, `github/issue-publication.ts`, `dependencies.ts`, `features.ts`, `remove-candidate.ts`, `approval.ts`, `.getEffect`, `JiraIssuePublisher`, `cec/issue-publication.ts`, `jira-time.ts`, `conversations/slack.ts`, `coordination.ts`, `publish-pr.ts`, `.value`, `notifications.ts`, `channel-notice.ts`, `create-candidate.ts`, `command-registry.ts`, `brain-followup.ts`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `GitHubDelivery` connect `TicketJob` to `github-delivery.ts`, `cec/workflow.ts`, `harnessEffect`, `resume-provider-review.ts`, `source-amendment.ts`, `artifact`, `Coordinator`, `assignment-poll.ts`, `assertMayMutate`, `accept-stage-result.ts`, `digest`, `discovery-recovery.ts`, `requests.ts`, `workKey`, `dependencies.ts`, `scope-repair-resume.ts`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `command()` (e.g. with `.constructor()` and `executeRequest()`) actually correct?**
  _`command()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _358 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `github-delivery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0756545042259328 - nodes in this community are weakly interconnected._
- **Should `cec/workflow.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05259835893120135 - nodes in this community are weakly interconnected._