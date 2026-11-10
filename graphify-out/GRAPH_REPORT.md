# Graph Report - the-office  (2026-11-10)

## Corpus Check
- 662 files · ~277,248 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3427 nodes · 15187 edges · 95 communities (93 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 93 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e669bcc2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Store
- workKey
- github-delivery.ts
- artifact
- TicketJob
- knowledge/routes.ts
- shared.ts
- cx
- cec/workflow.ts
- record-trigger.ts
- index.tsx
- Inspector.tsx
- App.tsx
- agents.ts
- source-amendment.ts
- worker-runtime.ts
- features.ts
- TimeBook.tsx
- notifications.ts
- IntakeLedger
- requests.ts
- knowledge.ts
- .emit
- control-store.ts
- run-retrospective.ts
- LessonsPanel.tsx
- maintenance.ts
- SourceRegistry
- conversations/conversations.ts
- schedule.ts
- azure.ts
- .transaction
- source-amendment-scope.ts
- index.ts
- PeoplePanel.tsx
- .save
- session-bridge.ts
- digest
- http/commands.ts
- tracking-issue.ts
- reader.ts
- WorkTime
- harnessEffect
- offices.ts
- cost-ledger.ts
- work-summary.ts
- dependency-bots/adopt.ts
- slack-intake/run.ts
- publication.ts
- investigations/run.ts
- OfficeSnapshot
- cec/issue-publication.ts
- approval.ts
- Coordinator
- scheduler.ts
- OfficePreferencesForm.tsx
- assignment-view.ts
- lesson-selection.ts
- jira-time.ts
- office-state-view.ts
- remove-candidate.ts
- goal-reviews.ts
- assignment-poll.ts
- .getEffect
- coordination.ts
- scheduled-work.ts
- admit-improvement.ts
- validate-stage.ts
- it-specialist.ts
- evidence.ts
- recovery-ledger.ts
- fact-bounds.ts
- contract.ts
- publish-pr.ts
- slack-intake/config.ts
- run-accounting.ts
- run-cost.ts
- codex-rollout-file.ts
- work.ts
- telemetry/report.ts
- telemetry.ts
- blocker-followups.ts
- .pump
- codex-rollout.ts
- price-table.ts
- command-registry.ts
- cli.ts
- merge-summary.ts
- owned-artifact.ts
- liveReach
- extract-worker.mjs
- dependency-edges.ts
- slack-supersession.ts
- helper-evidence.py

## God Nodes (most connected - your core abstractions)
1. `Store` - 314 edges
2. `TicketJob` - 132 edges
3. `GitHubDelivery` - 121 edges
4. `command()` - 102 edges
5. `artifact()` - 87 edges
6. `digest()` - 86 edges
7. `cx()` - 84 edges
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
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-evidence.ts -> server/delivery/pipeline/github-delivery.ts`

## Communities (95 total, 2 thin omitted)

### Community 0 - "Store"
Cohesion: 0.04
Nodes (39): correlatedBuild(), JiraOperations, reconcileCloseout(), featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), recoverFeatures(), GITHUB_ISSUE_SKILL (+31 more)

### Community 1 - "workKey"
Cohesion: 0.06
Nodes (73): HarnessControl, boardPreflightCandidate(), reconcileBoardPreflight(), assertContinuationWorker(), continuationScope(), continuationWorktree(), continuationGuard(), Assessment (+65 more)

### Community 2 - "github-delivery.ts"
Cohesion: 0.08
Nodes (68): containedFile(), findingsBlock(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery(), BOARD_RULE, conflictRefreshInstruction() (+60 more)

### Community 3 - "artifact"
Cohesion: 0.08
Nodes (74): partialLocalCleanupCandidate(), continuationWorkerProof(), candidateInput(), children, oldAdoptionBasis(), savedCandidateAdmission, assertPostConflictFiles(), assertPostConflictOwnership() (+66 more)

### Community 4 - "TicketJob"
Cohesion: 0.07
Nodes (51): removeAdoptedClone(), namedRepairIds(), dependabotReviewGuidance(), StageContext, GitHubDelivery, stageRole(), checksFailed(), checksPassed() (+43 more)

### Community 5 - "knowledge/routes.ts"
Cohesion: 0.10
Nodes (54): intakeActivity(), knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), KnowledgeContext, independentDigestEvidence(), digestKnowledge(), prepareDigestBodies() (+46 more)

### Community 6 - "shared.ts"
Cohesion: 0.05
Nodes (54): projectOutbox(), syncOutbox(), finishSupersededReadback(), projectSlackDeliveries(), settleRequestedSlackReplacement(), Input, supersedeSlackDelivery(), replacementContext() (+46 more)

### Community 7 - "cx"
Cohesion: 0.06
Nodes (61): Constellation(), sectors, focusPosition(), stableHash(), stablePosition(), EvidenceCard(), TicketHeading(), withoutElapsed() (+53 more)

### Community 8 - "cec/workflow.ts"
Cohesion: 0.07
Nodes (57): checkMail(), drainMail(), requestMail(), parksInJira(), dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery() (+49 more)

### Community 9 - "record-trigger.ts"
Cohesion: 0.07
Nodes (60): deliveryMetrics(), median(), baselineLearning(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences(), maintenanceSubject() (+52 more)

### Community 10 - "index.tsx"
Cohesion: 0.09
Nodes (45): KnowledgeCapturePage, KnowledgeSourceSummary, Activity(), ActivityStatus(), AssignmentKnowledge(), CaptureReviewDetail(), CaptureReviews(), DigestDetail() (+37 more)

### Community 11 - "Inspector.tsx"
Cohesion: 0.08
Nodes (52): Conversation(), Outbox(), recommendedReply(), slackMessageStatus(), SlackDeliveryCard(), ServiceHealthPanel(), labels, ServiceHealthRow() (+44 more)

### Community 12 - "App.tsx"
Cohesion: 0.04
Nodes (55): SendMessage, BrainWorkspace(), CTOReview(), goalState, DailyCTO(), GoalHistory(), reportDate(), reviewStatus (+47 more)

### Community 13 - "agents.ts"
Cohesion: 0.07
Nodes (41): cecPrompt(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), resolvedDecisionNote(), stageInstructions, ConversationResultSchema (+33 more)

### Community 14 - "source-amendment.ts"
Cohesion: 0.09
Nodes (57): adoptCandidate(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat() (+49 more)

### Community 15 - "worker-runtime.ts"
Cohesion: 0.07
Nodes (40): candidateWorkspaceEnvironment(), prepareExposure(), DATA, LOCAL_BINDINGS, contextPacket(), DeliverySlot, CODEX_DEFAULT_EFFORT, CODEX_DEFAULT_MODEL (+32 more)

### Community 16 - "features.ts"
Cohesion: 0.09
Nodes (39): reviewQuestions(), discoveryPrompt(), planPrompt(), document(), featureRoot(), DiscoverySchema, identity, manifestFromPlan() (+31 more)

### Community 17 - "TimeBook.tsx"
Cohesion: 0.09
Nodes (42): TelemetryReport, displayAgentTask(), githubStageLabels, LiveAgentTask(), Props, RunningTask(), text(), Agent (+34 more)

### Community 18 - "notifications.ts"
Cohesion: 0.09
Nodes (31): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), configureNotices(), Identity, MergeNotifications (+23 more)

### Community 19 - "IntakeLedger"
Cohesion: 0.12
Nodes (35): Config, ChannelProgress, LIMITS, Proposal, ReadKind, ReadTask, SourceUnit, IntakeLedger (+27 more)

### Community 20 - "requests.ts"
Cohesion: 0.10
Nodes (45): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+37 more)

### Community 21 - "knowledge.ts"
Cohesion: 0.07
Nodes (44): learningMetrics(), lessonsNeedingReview(), publicTopicSafe(), researchTopics(), TEMPLATES, Kind, RetrospectiveResult, RollupResult (+36 more)

### Community 22 - ".emit"
Cohesion: 0.09
Nodes (36): reconcileNoticeConfirmations(), Admission, admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, resumeParked(), compatible() (+28 more)

### Community 23 - "control-store.ts"
Cohesion: 0.08
Nodes (20): mirror(), runWeeklyResearch(), scheduledResearch(), DailyCTO, dailyReviewPrompt(), queueGoalEvidenceRequest(), DailyResultSchema, GoalEvidenceRequestSchema (+12 more)

### Community 24 - "run-retrospective.ts"
Cohesion: 0.10
Nodes (37): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, improvementIntakeGate(), learningDigest(), recordLearningOpportunity(), appendLearningFacts(), freezeLearningPacket() (+29 more)

### Community 25 - "LessonsPanel.tsx"
Cohesion: 0.10
Nodes (31): BlockerFollowups(), IntakeSummary(), LessonsPanel(), when(), ResearchSummary(), format, labels, SlackIntakeStatus() (+23 more)

### Community 26 - "maintenance.ts"
Cohesion: 0.10
Nodes (30): ApproachSchema, maintenancePolicies(), captureMaintenanceStep(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice() (+22 more)

### Community 27 - "SourceRegistry"
Cohesion: 0.12
Nodes (24): captureProposal(), effectId(), CaptureReceipt, SlackReadAuthority, collectionAllowed(), collectionPolicy, readAuthority(), Command (+16 more)

### Community 28 - "conversations/conversations.ts"
Cohesion: 0.12
Nodes (24): assertConversationReadback(), Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff(), pumpIT() (+16 more)

### Community 29 - "schedule.ts"
Cohesion: 0.15
Nodes (24): newTask(), reconcileIntakeStatus(), scheduledSlackIntake(), sourceWork(), micros(), nowTs(), overlapTs(), timestamp() (+16 more)

### Community 30 - "azure.ts"
Cohesion: 0.09
Nodes (31): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+23 more)

### Community 31 - ".transaction"
Cohesion: 0.13
Nodes (36): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+28 more)

### Community 32 - "source-amendment-scope.ts"
Cohesion: 0.08
Nodes (39): approvedText(), assert(), assert(), normalize(), officialUrls, ReleaseCapture, verifyReleaseCaptures(), amendmentCaptureObservation() (+31 more)

### Community 33 - "index.ts"
Cohesion: 0.10
Nodes (30): close(), config, itSpecialist, loadedRevision, offices, releaseLock, server, serviceHealth (+22 more)

### Community 34 - "PeoplePanel.tsx"
Cohesion: 0.10
Nodes (34): label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+26 more)

### Community 35 - ".save"
Cohesion: 0.13
Nodes (31): file, folder, logs, root, xml(), plain(), unpack(), BLOCKED (+23 more)

### Community 36 - "session-bridge.ts"
Cohesion: 0.11
Nodes (26): claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexSessionContext(), readRollout, claudeSessions(), codexSessions() (+18 more)

### Community 37 - "digest"
Cohesion: 0.15
Nodes (28): comparableSlackText(), createExtractor(), extractDocument, Extraction, Extractor, uploadArtifact(), AuthoredDigest, reconcileDigestAuthorship() (+20 more)

### Community 38 - "http/commands.ts"
Cohesion: 0.14
Nodes (28): retryRecipientLookup(), bindDiscoveryResume(), DiscoveryResumeInput, normalizeStatement(), configureDigestDelivery(), DigestSettings, configureKnowledge(), declineLessonIssue() (+20 more)

### Community 39 - "tracking-issue.ts"
Cohesion: 0.16
Nodes (29): Lane, resolveLane(), cardStatus(), Execute, ProjectCard, projectCards(), projectGraphql(), setCardStatus() (+21 more)

### Community 40 - "reader.ts"
Cohesion: 0.08
Nodes (21): captureAfter(), CaptureMetadata, capturePage(), cursor(), key(), captureIdentityMatches(), BrainCaptureReceipt, hash (+13 more)

### Community 41 - "WorkTime"
Cohesion: 0.14
Nodes (32): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence(), CaptureContext (+24 more)

### Community 42 - "harnessEffect"
Cohesion: 0.16
Nodes (25): MOVABLE, moveLane(), harnessCloseout(), PASSING, verifyMergeActions(), activeEffectId(), harnessEffect, assertMayMutate() (+17 more)

### Community 43 - "offices.ts"
Cohesion: 0.11
Nodes (20): leadershipContext(), leadershipEntries(), knowledgeEntries(), privateFile(), DERIVED, readLocalIntakeReport(), readIntakeReport(), retrySlackIntake() (+12 more)

### Community 44 - "cost-ledger.ts"
Cohesion: 0.16
Nodes (25): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId(), OutsideEdit (+17 more)

### Community 45 - "work-summary.ts"
Cohesion: 0.13
Nodes (27): themeColor, App(), usePanelFocus(), demoSnapshot(), envelopeCard, deliveryRepairProjection(), DependencyNotice(), ACTIVE (+19 more)

### Community 46 - "dependency-bots/adopt.ts"
Cohesion: 0.16
Nodes (26): readBackOrThrow(), closesIssue(), linkedBody(), linkPR(), dependabotPR, readRepo(), ensureTrackingIssue(), findTrackingIssue() (+18 more)

### Community 47 - "slack-intake/run.ts"
Cohesion: 0.15
Nodes (22): independentIntakeResult(), recordObservation(), settlePage(), IntakeResult, IntakeResultValue, Observation, Message, observeRead() (+14 more)

### Community 48 - "publication.ts"
Cohesion: 0.16
Nodes (9): FeaturePublisher, Assign, Board, GitHubIssuePublisher, number(), same(), EffectUncertainError, FeatureManifestItem (+1 more)

### Community 49 - "investigations/run.ts"
Cohesion: 0.17
Nodes (20): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationCandidates(), investigationId(), investigationFollowUps(), investigationResolution(), syncInvestigations(), OFFICE_FIX_PROMPT (+12 more)

### Community 50 - "OfficeSnapshot"
Cohesion: 0.14
Nodes (19): FeatureRound, FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures(), draftKey() (+11 more)

### Community 51 - "cec/issue-publication.ts"
Cohesion: 0.21
Nodes (9): Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), plainDescription(), Transition, JiraFeaturePublisher (+1 more)

### Community 52 - "approval.ts"
Cohesion: 0.22
Nodes (18): approveFeature(), assertRetainedItems(), commandFeature(), createFeature(), featureById(), mutation(), artifactPath(), digest() (+10 more)

### Community 53 - "Coordinator"
Cohesion: 0.08
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 54 - "scheduler.ts"
Cohesion: 0.16
Nodes (12): ROLES, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch(), foreignWork() (+4 more)

### Community 55 - "OfficePreferencesForm.tsx"
Cohesion: 0.12
Nodes (20): fields, PreferencesPatch, StoredBody, OfficePreferencesForm(), SHORTCUTS, acceptPreferences(), PreferenceCandidate, PreferenceState (+12 more)

### Community 56 - "assignment-view.ts"
Cohesion: 0.15
Nodes (13): AssignmentLookups, lookupInstructions(), decodeLookupJournal(), lookupJournal, readLookupJournal(), KnowledgeAssignment, KnowledgeSourceBinding, LearningSubject (+5 more)

### Community 57 - "lesson-selection.ts"
Cohesion: 0.16
Nodes (20): knowledgeContext(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), MAINTENANCE, MAX_LESSONS (+12 more)

### Community 58 - "jira-time.ts"
Cohesion: 0.15
Nodes (17): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+9 more)

### Community 59 - "office-state-view.ts"
Cohesion: 0.18
Nodes (14): retainedArtifactScope(), eventSourceBindings(), eventVisible(), assignmentSubject(), LessonSelection, exposureBindings(), requestSourceBindings(), knowledgeOfficeState() (+6 more)

### Community 60 - "remove-candidate.ts"
Cohesion: 0.20
Nodes (16): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+8 more)

### Community 61 - "goal-reviews.ts"
Cohesion: 0.13
Nodes (17): saveGoals(), applyGoalReview(), EvidenceRefSchema, FreshDailyResultSchema, statusAllowed(), workEvidence(), GoalInput, saveGoal() (+9 more)

### Community 62 - "assignment-poll.ts"
Cohesion: 0.16
Nodes (15): noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), adoptDependabot(), pinCourier, ACTIONS, OWNER, wikiSync (+7 more)

### Community 63 - ".getEffect"
Cohesion: 0.25
Nodes (8): publishFeature(), GitHubOperations, fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), closeNativeRefresh(), fingerprint(), EffectIntent

### Community 64 - "coordination.ts"
Cohesion: 0.18
Nodes (18): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation(), checkpointWindow(), dueAt() (+10 more)

### Community 65 - "scheduled-work.ts"
Cohesion: 0.19
Nodes (17): deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), deterministicActions, eligible() (+9 more)

### Community 66 - "admit-improvement.ts"
Cohesion: 0.23
Nodes (14): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+6 more)

### Community 67 - "validate-stage.ts"
Cohesion: 0.20
Nodes (15): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+7 more)

### Community 68 - "it-specialist.ts"
Cohesion: 0.23
Nodes (10): partialLocalCleanupKey(), ITContext, publishITReport(), ITSpecialist, delays, recoverAttempt(), ServiceHealthChecks, ITFollowUp (+2 more)

### Community 69 - "evidence.ts"
Cohesion: 0.22
Nodes (12): investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_SOURCE_PATHS, officeSource(), ROOT, LaunchPolicy (+4 more)

### Community 70 - "recovery-ledger.ts"
Cohesion: 0.23
Nodes (11): savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), diagnosticContext(), diagnosticSnapshot(), nativeDeliveryResolved(), reconcileRecoveryLedger() (+3 more)

### Community 71 - "fact-bounds.ts"
Cohesion: 0.26
Nodes (15): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+7 more)

### Community 72 - "contract.ts"
Cohesion: 0.22
Nodes (11): At, Errno, GroupInventory, GroupProbe, LifecycleDiagnostic, Phase, Pid, groupInventory() (+3 more)

### Community 73 - "publish-pr.ts"
Cohesion: 0.24
Nodes (13): retryRead(), developerPRContent(), Execute, lintPRContent(), officePRContent(), prContent, assertCandidate(), Candidate (+5 more)

### Community 74 - "slack-intake/config.ts"
Cohesion: 0.18
Nodes (16): configDigest(), IntakeConfig, readConfig(), exactly(), Message, nativeReadPayload(), pagination(), nativeFile() (+8 more)

### Community 75 - "run-accounting.ts"
Cohesion: 0.21
Nodes (13): BoundedRead, backfillClaudeCost(), CompletionReader, COMPLETION_MAX_BYTES, completionAccounting(), readCompletion(), RECONCILE_GRACE_MS, reconcileUncapturedRuns() (+5 more)

### Community 76 - "run-cost.ts"
Cohesion: 0.24
Nodes (12): CodexRollout, codexPriceRef(), claudeAccounting(), basisOf(), claudeCost(), codexCost(), toMicroUsd(), unpriced() (+4 more)

### Community 77 - "codex-rollout-file.ts"
Cohesion: 0.21
Nodes (12): codexHome(), createdAt(), dayDirs(), header(), readCodexRollout(), ROLLOUT_MAX_BYTES, RolloutScan, scanCodexRollouts() (+4 more)

### Community 78 - "work.ts"
Cohesion: 0.16
Nodes (12): ProjectReadiness, AssignmentResult, CompletionCondition, Continuation, DependencyObservation, EligibilityState, FailureCategory, ReconciliationAction (+4 more)

### Community 79 - "telemetry/report.ts"
Cohesion: 0.29
Nodes (12): Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked(), row() (+4 more)

### Community 80 - "telemetry.ts"
Cohesion: 0.18
Nodes (10): CostCompleteness, CostComponent, CostLedgerState, ProviderBasis, RunCost, TelemetryRow, TelemetrySync, UsageCompleteness (+2 more)

### Community 81 - "blocker-followups.ts"
Cohesion: 0.47
Nodes (8): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), readBackConversations(), handoff(), reconcileBlockerFollowups(), BlockerFollowup

### Community 83 - "codex-rollout.ts"
Cohesion: 0.29
Nodes (9): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO (+1 more)

### Community 84 - "price-table.ts"
Cohesion: 0.20
Nodes (8): CacheWriteDuration, CODEX_ROWS, ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL, Rates, PriceRef

### Community 85 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 86 - "cli.ts"
Cohesion: 0.25
Nodes (6): args, [cmd,...rawArgs], commands, key, projectIndex, PORT

### Community 87 - "merge-summary.ts"
Cohesion: 0.36
Nodes (7): clamp(), LIMITS, MergedPR, plainSlackText(), section(), shippedSummary(), mergeText()

### Community 88 - "owned-artifact.ts"
Cohesion: 0.54
Nodes (6): ghLogCacheEvidence(), done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf()

### Community 89 - "liveReach"
Cohesion: 0.60
Nodes (5): GIT_NETWORK, LIVE_PROVIDERS, liveReach(), networkUrl(), remoteUrls()

### Community 90 - "extract-worker.mjs"
Cohesion: 0.70
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 91 - "dependency-edges.ts"
Cohesion: 1.00
Nodes (3): assertFeatureDependencyOrder(), featureDependencyEdges(), key()

### Community 92 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

## Knowledge Gaps
- **378 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+373 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `workKey`, `github-delivery.ts`, `artifact`, `TicketJob`, `knowledge/routes.ts`, `shared.ts`, `cec/workflow.ts`, `record-trigger.ts`, `agents.ts`, `source-amendment.ts`, `worker-runtime.ts`, `features.ts`, `notifications.ts`, `IntakeLedger`, `requests.ts`, `knowledge.ts`, `.emit`, `control-store.ts`, `run-retrospective.ts`, `maintenance.ts`, `SourceRegistry`, `conversations/conversations.ts`, `schedule.ts`, `azure.ts`, `.transaction`, `.save`, `session-bridge.ts`, `digest`, `http/commands.ts`, `tracking-issue.ts`, `WorkTime`, `harnessEffect`, `offices.ts`, `cost-ledger.ts`, `dependency-bots/adopt.ts`, `slack-intake/run.ts`, `publication.ts`, `investigations/run.ts`, `OfficeSnapshot`, `cec/issue-publication.ts`, `approval.ts`, `scheduler.ts`, `assignment-view.ts`, `lesson-selection.ts`, `jira-time.ts`, `office-state-view.ts`, `remove-candidate.ts`, `goal-reviews.ts`, `.getEffect`, `coordination.ts`, `scheduled-work.ts`, `admit-improvement.ts`, `validate-stage.ts`, `it-specialist.ts`, `evidence.ts`, `recovery-ledger.ts`, `publish-pr.ts`, `slack-intake/config.ts`, `run-accounting.ts`, `blocker-followups.ts`, `dependency-edges.ts`?**
  _High betweenness centrality (0.126) - this node is a cross-community bridge._
- **Why does `command()` connect `Store` to `workKey`, `github-delivery.ts`, `TicketJob`, `shared.ts`, `cec/workflow.ts`, `agents.ts`, `worker-runtime.ts`, `features.ts`, `notifications.ts`, `requests.ts`, `.emit`, `maintenance.ts`, `SourceRegistry`, `azure.ts`, `.save`, `session-bridge.ts`, `digest`, `tracking-issue.ts`, `reader.ts`, `harnessEffect`, `cost-ledger.ts`, `cec/issue-publication.ts`, `approval.ts`, `jira-time.ts`, `remove-candidate.ts`, `coordination.ts`, `scheduled-work.ts`, `admit-improvement.ts`, `validate-stage.ts`, `it-specialist.ts`, `contract.ts`, `publish-pr.ts`, `command-registry.ts`, `liveReach`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `Role` connect `worker-runtime.ts` to `Store`, `workKey`, `github-delivery.ts`, `TicketJob`, `shared.ts`, `cx`, `cec/workflow.ts`, `record-trigger.ts`, `index.tsx`, `Inspector.tsx`, `App.tsx`, `agents.ts`, `.emit`, `maintenance.ts`, `conversations/conversations.ts`, `PeoplePanel.tsx`, `http/commands.ts`, `OfficeSnapshot`, `scheduler.ts`, `office-state-view.ts`, `run-accounting.ts`, `work.ts`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `command()` (e.g. with `.constructor()` and `executeRequest()`) actually correct?**
  _`command()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _378 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Store` be split into smaller, more focused modules?**
  _Cohesion score 0.040455120101137804 - nodes in this community are weakly interconnected._
- **Should `workKey` be split into smaller, more focused modules?**
  _Cohesion score 0.06248600223964166 - nodes in this community are weakly interconnected._