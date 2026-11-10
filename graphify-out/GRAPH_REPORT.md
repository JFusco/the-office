# Graph Report - the-office  (2026-11-10)

## Corpus Check
- 682 files · ~282,727 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3496 nodes · 15437 edges · 109 communities (107 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 96 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8531503b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- dependency-bots/adopt.ts
- index.tsx
- workKey
- OfficeScene.tsx
- record-trigger.ts
- WorkTime
- implementation-recovery.ts
- App.tsx
- source-amendment.ts
- Activity.tsx
- Button
- run-retrospective.ts
- scheduled-work.ts
- agents.ts
- PeoplePanel.tsx
- shared.ts
- digest
- easternDay
- SourceRegistry
- engine.ts
- conversations/conversations.ts
- worker-runtime.ts
- index.ts
- Store
- artifact
- github-delivery.ts
- TicketJob
- TimeBook.tsx
- azure.ts
- maintenance.ts
- it-specialist.ts
- candidate-child-context.ts
- FeatureWorkspace.tsx
- cec/workflow.ts
- retrospective-subject.ts
- run-accounting.ts
- session-bridge.ts
- notifications.ts
- weekly-digest.ts
- slack-intake/run.ts
- knowledge.ts
- .get
- read-links.ts
- helperTelemetry
- telemetry.ts
- constellation-runtime.ts
- goal-reporting.ts
- github/issue-publication.ts
- IntakeLedger
- brain-maintenance.ts
- .emit
- scheduler.ts
- store.ts
- .getEffect
- sourceVisible
- .save
- merge-scanner-retry.ts
- features.ts
- dependency-edges.ts
- http/commands.ts
- cec/issue-publication.ts
- assertMayMutate
- remove-candidate.ts
- knowledge/routes.ts
- blocker-followups.ts
- schedule.ts
- Coordinator
- harnessEffect
- native-format.ts
- control-store.ts
- jira-time.ts
- weekly-rollup.ts
- fact-bounds.ts
- coordination.ts
- validate-stage.ts
- dependencies.ts
- lesson-selection.ts
- process.ts
- SlackIntakeStatus.tsx
- api-routes.ts
- office/config.ts
- work-summary.ts
- publish-pr.ts
- admit-improvement.ts
- json
- coordination-tick.ts
- preferences-store.ts
- accept-retrospective.ts
- Role
- .pump
- runRetrospective
- digest
- DailyCTO.tsx
- migrations.ts
- telemetry/report.ts
- codex-rollout.ts
- .value
- cli.ts
- windows.ts
- work.ts
- owned-artifact.ts
- run-usage.ts
- extract-worker.mjs
- evidence.ts
- slack-supersession.ts
- helper-evidence.py
- codex-rollout-file.ts
- highestStableAtLeast

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

## Communities (109 total, 2 thin omitted)

### Community 0 - "dependency-bots/adopt.ts"
Cohesion: 0.11
Nodes (37): readBackOrThrow(), adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR, openDependabotPulls() (+29 more)

### Community 1 - "index.tsx"
Cohesion: 0.07
Nodes (74): Conversation(), Outbox(), SendMessage, slackMessageStatus(), SlackDeliveryCard(), currentServices(), ServiceHealthPanel(), labels (+66 more)

### Community 2 - "workKey"
Cohesion: 0.07
Nodes (69): reconcileBoardPreflight(), CloseoutSupervisionProofRef, completedPRReviews(), implementationRecoveryCandidate(), recoveredFindingsResolved(), recoverImplementation(), assertPostConflictFiles(), assertPostConflictOwnership() (+61 more)

### Community 3 - "OfficeScene.tsx"
Cohesion: 0.06
Nodes (54): itAgent(), itDiagnostics(), CameraBookmark, restoreBookmark(), Avatar(), AzureWall(), Chair(), Coworker() (+46 more)

### Community 4 - "record-trigger.ts"
Cohesion: 0.18
Nodes (21): MaintenanceCandidate, clip(), JobLike, recordCIBudget(), recordParked(), recordRepairBudget(), recordTicketParked(), recordTrigger() (+13 more)

### Community 5 - "WorkTime"
Cohesion: 0.12
Nodes (35): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence(), CaptureContext (+27 more)

### Community 6 - "implementation-recovery.ts"
Cohesion: 0.16
Nodes (20): continuationScope(), brainImplementationCandidate(), BrainReadback, digest(), Ownership, Readback, recoverBrainImplementation(), bindBrainAuditEffects() (+12 more)

### Community 7 - "App.tsx"
Cohesion: 0.05
Nodes (44): BrainWorkspace(), Sources(), BrainWorkspace, CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants, ElevatorPhase (+36 more)

### Community 8 - "source-amendment.ts"
Cohesion: 0.05
Nodes (92): guard(), Assessment, outsideScanSources(), Ownership, reconcileScopeRepairReadback(), requireThat(), scopeRepairReadbackCandidate(), scopeRepairRequestResolved() (+84 more)

### Community 9 - "Activity.tsx"
Cohesion: 0.08
Nodes (36): guidanceExcerpt(), KnowledgeAssignment, KnowledgeCapture, KnowledgeCapturePage, LessonExposure, KnowledgeLookupResponse, KnowledgeHit, KnowledgeReference (+28 more)

### Community 10 - "Button"
Cohesion: 0.09
Nodes (43): KnowledgeSourceSummary, displayScene(), selectRecord(), MapBrowser(), filterNames, initial, MapView(), AddPublicSource() (+35 more)

### Community 11 - "run-retrospective.ts"
Cohesion: 0.15
Nodes (19): appendLearningFacts(), freezeLearningPacket(), ARTIFACT_LIMIT, clip(), LEDGER_STEPS, MAINTENANCE_LIMIT, maintenanceFacts(), MaintenancePacketSection (+11 more)

### Community 12 - "scheduled-work.ts"
Cohesion: 0.09
Nodes (44): deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), scheduledInvestigations(), deterministicActions (+36 more)

### Community 13 - "agents.ts"
Cohesion: 0.06
Nodes (47): cecPrompt(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), resolvedDecisionNote(), stageInstructions, ConversationResultSchema (+39 more)

### Community 14 - "PeoplePanel.tsx"
Cohesion: 0.10
Nodes (38): label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+30 more)

### Community 15 - "shared.ts"
Cohesion: 0.06
Nodes (48): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, slackHealth(), ProjectReadiness (+40 more)

### Community 16 - "digest"
Cohesion: 0.12
Nodes (45): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+37 more)

### Community 17 - "easternDay"
Cohesion: 0.08
Nodes (30): mirror(), runWeeklyResearch(), scheduledResearch(), DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), dailyReviewDate() (+22 more)

### Community 18 - "SourceRegistry"
Cohesion: 0.13
Nodes (23): Config, configDigest(), IntakeConfig, readConfig(), Command, sourceCommand(), configDigestForSeed(), copyRecords() (+15 more)

### Community 19 - "engine.ts"
Cohesion: 0.07
Nodes (22): correlatedBuild(), requestMail(), dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), resume(), startPilot() (+14 more)

### Community 20 - "conversations/conversations.ts"
Cohesion: 0.10
Nodes (22): Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff(), saveGoals(), pumpIT() (+14 more)

### Community 21 - "worker-runtime.ts"
Cohesion: 0.10
Nodes (31): candidateWorkspaceEnvironment(), assertDigestDispatch(), assignmentSubject(), prepareExposure(), assertRetainedDispatchScope(), contextPacket(), ModelRoute, labels (+23 more)

### Community 22 - "index.ts"
Cohesion: 0.13
Nodes (19): close(), config, itSpecialist, loadedRevision, offices, releaseLock, server, serviceHealth (+11 more)

### Community 23 - "Store"
Cohesion: 0.10
Nodes (15): MergeNotifications, featureItemComplete(), reconcileFeatureCompletion(), recoverFeatures(), digestNoticeNeverDispatched(), goalNoticeAuthorized(), goalNoticeNeverDispatched(), sendGoalNotice() (+7 more)

### Community 24 - "artifact"
Cohesion: 0.08
Nodes (79): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+71 more)

### Community 25 - "github-delivery.ts"
Cohesion: 0.07
Nodes (81): containedFile(), findingsBlock(), namedRepairIds(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery(), discover() (+73 more)

### Community 26 - "TicketJob"
Cohesion: 0.06
Nodes (42): removeAdoptedClone(), BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction(), dependabotReviewGuidance(), StageContext, GitHubDelivery (+34 more)

### Community 27 - "TimeBook.tsx"
Cohesion: 0.08
Nodes (44): displayAgentTask(), withoutElapsed(), LiveAgentTask(), Props, RunningTask(), text(), Agent, AzureBuild (+36 more)

### Community 28 - "azure.ts"
Cohesion: 0.09
Nodes (27): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+19 more)

### Community 29 - "maintenance.ts"
Cohesion: 0.11
Nodes (21): maintenancePolicies(), BrainMaintenance, candidateOwner(), SETTLED, skipOwnedCandidate(), Skipped, skippedCandidateLedger(), CmsFollowUpContext (+13 more)

### Community 30 - "it-specialist.ts"
Cohesion: 0.19
Nodes (14): partialLocalCleanupKey(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), ITContext, readBackConversations(), publishITReport() (+6 more)

### Community 31 - "candidate-child-context.ts"
Cohesion: 0.27
Nodes (9): adoptCandidate(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat() (+1 more)

### Community 32 - "FeatureWorkspace.tsx"
Cohesion: 0.16
Nodes (17): FeatureRound, FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures(), draftKey() (+9 more)

### Community 33 - "cec/workflow.ts"
Cohesion: 0.12
Nodes (35): checkMail(), drainMail(), parksInJira(), MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), run(), ingest() (+27 more)

### Community 34 - "retrospective-subject.ts"
Cohesion: 0.19
Nodes (15): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+7 more)

### Community 35 - "run-accounting.ts"
Cohesion: 0.22
Nodes (11): BoundedRead, CompletionReader, COMPLETION_MAX_BYTES, readCompletion(), RECONCILE_GRACE_MS, reconcileUncapturedRuns(), reconciling, recordTerminalAccounting() (+3 more)

### Community 36 - "session-bridge.ts"
Cohesion: 0.11
Nodes (26): claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexSessionContext(), readRollout, claudeSessions(), codexSessions() (+18 more)

### Community 37 - "notifications.ts"
Cohesion: 0.11
Nodes (29): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR (+21 more)

### Community 38 - "weekly-digest.ts"
Cohesion: 0.44
Nodes (7): independentDigestEvidence(), prepareDigestBodies(), retainDigestBody(), queueWeeklyDigest(), KnowledgeDigest, KnowledgeDigestDelivery, KnowledgeDigestDetail

### Community 39 - "slack-intake/run.ts"
Cohesion: 0.14
Nodes (26): independentIntakeResult(), effectId(), CaptureReceipt, IntakeResult, IntakeResultValue, Observation, ReadKind, SourceUnit (+18 more)

### Community 40 - "knowledge.ts"
Cohesion: 0.09
Nodes (30): assignmentKnowledge(), AssignmentLookups, Binding, lookupInstructions(), decodeLookupJournal(), lookupJournal, readLookupJournal(), referenceVisible() (+22 more)

### Community 41 - ".get"
Cohesion: 0.21
Nodes (14): annotateAuthoredUnits(), captureProposal(), recordObservation(), settlePage(), DERIVED, acceptProposals(), runSlackLinks(), runIntakeTask() (+6 more)

### Community 42 - "read-links.ts"
Cohesion: 0.18
Nodes (18): createExtractor(), extractDocument, Extraction, Extractor, uploadArtifact(), KnowledgeRunner, LinkResult, PublicReadPolicy (+10 more)

### Community 43 - "helperTelemetry"
Cohesion: 0.23
Nodes (11): helperTelemetry(), dispatchExposure(), EvidenceOutcome, backfillClaudeCost(), codexHome(), HELPER_STDOUT_MAX_BYTES, helperAccounting(), claudeAccounting() (+3 more)

### Community 44 - "telemetry.ts"
Cohesion: 0.10
Nodes (25): CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL, Rates (+17 more)

### Community 45 - "constellation-runtime.ts"
Cohesion: 0.11
Nodes (25): KnowledgeMap, KnowledgeNode, CameraPose, flightPose(), cameraTarget(), Point, Constellation(), ConstellationView (+17 more)

### Community 46 - "goal-reporting.ts"
Cohesion: 0.17
Nodes (14): assertConversationReadback(), finishSupersededReadback(), SlackMessages, SlackRequestSchema, pump(), harperHandoff(), acceptedGoalReport(), GOAL_REPORT_GUIDANCE (+6 more)

### Community 47 - "github/issue-publication.ts"
Cohesion: 0.16
Nodes (11): GitHubFeaturePublisher, FeaturePublisher, PublicationReceipt, Assign, Board, Content, GitHubIssuePublisher, number() (+3 more)

### Community 48 - "IntakeLedger"
Cohesion: 0.24
Nodes (8): newTask(), LIMITS, IntakeLedger, linkKey(), queueReconsideration(), readyReferences(), resourceUnits(), unavailable()

### Community 49 - "brain-maintenance.ts"
Cohesion: 0.10
Nodes (27): completeNativeCheckpoint(), BRAIN_DEPENDENCY_MERGES, BrainResult, BrainStatusSchema, identity, coverageSchema, followupSchema, verified (+19 more)

### Community 50 - ".emit"
Cohesion: 0.10
Nodes (33): projectOutbox(), projectSlackDeliveries(), settleRequestedSlackReplacement(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint(), slackRequestSettled() (+25 more)

### Community 51 - "scheduler.ts"
Cohesion: 0.17
Nodes (12): ROLES, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch(), foreignWork() (+4 more)

### Community 52 - "store.ts"
Cohesion: 0.16
Nodes (14): diagnosticContext(), diagnosticSnapshot(), nativeDeliveryResolved(), initializeStoreSchema(), CODEX_DEFAULT_EFFORT, CODEX_DEFAULT_MODEL, CODEX_EFFORTS, CODEX_ROLES (+6 more)

### Community 53 - ".getEffect"
Cohesion: 0.22
Nodes (8): GitHubOperations, fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), Assessment, closeNativeRefresh(), fingerprint(), EffectIntent

### Community 54 - "sourceVisible"
Cohesion: 0.15
Nodes (31): intakeActivity(), knowledgeActivity(), knowledgeActivityPage(), KnowledgeContext, knowledgeSnapshot(), officeKnowledgeSnapshot(), publicReference(), lookupSummaryVisible() (+23 more)

### Community 55 - ".save"
Cohesion: 0.14
Nodes (29): JiraOperations, plain(), unpack(), BLOCKED, Execute, findComment(), jira(), LiveIssue (+21 more)

### Community 56 - "merge-scanner-retry.ts"
Cohesion: 0.44
Nodes (8): officeMergeProvenance(), reconcileMergeScannerRetry(), Retry, retryMergeScanner(), retryReadBack(), runIdentity(), savedRetry(), transientScannerJobs()

### Community 57 - "features.ts"
Cohesion: 0.08
Nodes (56): approveFeature(), assertRetainedItems(), commandFeature(), createFeature(), featureById(), mutation(), reviewQuestions(), discoveryPrompt() (+48 more)

### Community 58 - "dependency-edges.ts"
Cohesion: 1.00
Nodes (3): assertFeatureDependencyOrder(), featureDependencyEdges(), key()

### Community 59 - "http/commands.ts"
Cohesion: 0.16
Nodes (26): retryRecipientLookup(), bindDiscoveryResume(), DiscoveryResumeInput, normalizeStatement(), configureDigestDelivery(), DigestSettings, configureKnowledge(), declineLessonIssue() (+18 more)

### Community 60 - "cec/issue-publication.ts"
Cohesion: 0.20
Nodes (8): Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), plainDescription(), Transition, JiraFeaturePublisher

### Community 61 - "assertMayMutate"
Cohesion: 0.21
Nodes (17): harnessCloseout(), PASSING, verifyMergeActions(), assertMayMutate(), runHarnessStage(), harnessStageResult(), receipt(), harnessDraft() (+9 more)

### Community 62 - "remove-candidate.ts"
Cohesion: 0.20
Nodes (16): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+8 more)

### Community 63 - "knowledge/routes.ts"
Cohesion: 0.08
Nodes (25): captureAfter(), CaptureMetadata, capturePage(), cursor(), key(), captureIdentityMatches(), BrainCaptureReceipt, hash (+17 more)

### Community 64 - "blocker-followups.ts"
Cohesion: 0.18
Nodes (18): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), handoff(), reconcileBlockerFollowups(), improvementIntakeGate(), captureLearning() (+10 more)

### Community 65 - "schedule.ts"
Cohesion: 0.17
Nodes (27): privateFile(), Proposal, ReadTask, isStoppingFor(), reconcileIntakeStatus(), intakeProgress(), terminalDeferred(), unitKey() (+19 more)

### Community 66 - "Coordinator"
Cohesion: 0.08
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 67 - "harnessEffect"
Cohesion: 0.18
Nodes (27): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard, projectCards() (+19 more)

### Community 68 - "native-format.ts"
Cohesion: 0.52
Nodes (5): exactly(), Message, nativeReadPayload(), pagination(), nativeFile()

### Community 69 - "control-store.ts"
Cohesion: 0.10
Nodes (16): sourceSchema(), Briefing, saveReviewBriefing(), Clock, systemClock, applyConnectionSettings(), closeConnection(), optimizeOnOpen() (+8 more)

### Community 70 - "jira-time.ts"
Cohesion: 0.21
Nodes (13): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+5 more)

### Community 71 - "weekly-rollup.ts"
Cohesion: 0.17
Nodes (18): learningMetrics(), lessonsNeedingReview(), RollupResult, RollupResultSchema, harperFolder(), RETROSPECTIVE_TIMEOUT, retryDelay(), scanCuration() (+10 more)

### Community 72 - "fact-bounds.ts"
Cohesion: 0.20
Nodes (19): leadershipContext(), leadershipEntries(), knowledgeEntries(), collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime() (+11 more)

### Community 73 - "coordination.ts"
Cohesion: 0.24
Nodes (12): checkpointWindow(), dueAt(), hours, localDay(), ReviewResult, deferNonReady(), preparePR(), recheck() (+4 more)

### Community 74 - "validate-stage.ts"
Cohesion: 0.16
Nodes (17): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+9 more)

### Community 75 - "dependencies.ts"
Cohesion: 0.20
Nodes (16): Admission, admit(), IntakeContext, compatible(), dependencyCompletionKey(), dependencyEligibility(), DependencyStores, issueKey() (+8 more)

### Community 76 - "lesson-selection.ts"
Cohesion: 0.12
Nodes (27): knowledgeContext(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), LessonSelection, MAINTENANCE (+19 more)

### Community 77 - "process.ts"
Cohesion: 0.09
Nodes (24): Result, CommandRegistry, CommandScope, inside(), RegisteredCommand, At, Errno, GroupInventory (+16 more)

### Community 78 - "SlackIntakeStatus.tsx"
Cohesion: 0.60
Nodes (4): format, labels, SlackIntakeStatus(), time()

### Community 79 - "api-routes.ts"
Cohesion: 0.22
Nodes (17): retainedArtifactScope(), eventSourceBindings(), eventVisible(), exposureBindings(), requestSourceBindings(), knowledgeOfficeState(), knowledgePromptStore(), acceptedSourceBindings() (+9 more)

### Community 80 - "office/config.ts"
Cohesion: 0.23
Nodes (14): initialDraftConflictAnchor(), mergeInitialSourceLock(), Ownership, verifyInitialDraftConflictDelta(), retainedConflictChain(), Step, verifyConflictChainGit(), within() (+6 more)

### Community 81 - "work-summary.ts"
Cohesion: 0.15
Nodes (24): themeColor, App(), deliveryRepairProjection(), card, InboxQueue(), ACTIVE, maintenanceUpdate(), PMQueueItem (+16 more)

### Community 82 - "publish-pr.ts"
Cohesion: 0.26
Nodes (13): retryRead(), developerPRContent(), Execute, lintPRContent(), officePRContent(), prContent, assertCandidate(), Candidate (+5 more)

### Community 83 - "admit-improvement.ts"
Cohesion: 0.23
Nodes (14): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+6 more)

### Community 84 - "json"
Cohesion: 0.21
Nodes (13): AUTO_ADOPT_BOTS, OfficeConfigInputs, officeConfigRoute(), officeConfigSummary(), json(), CECBinding, localBindings, validTicket() (+5 more)

### Community 85 - "coordination-tick.ts"
Cohesion: 0.18
Nodes (14): reconcileNoticeConfirmations(), PrerequisitesSchema, brainCheckpointCompletion(), reconcileCompletedCheckpoints(), legacy, reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS (+6 more)

### Community 86 - "preferences-store.ts"
Cohesion: 0.18
Nodes (11): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, SettingsPanel() (+3 more)

### Community 87 - "accept-retrospective.ts"
Cohesion: 0.16
Nodes (14): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, improvementDigest(), ImprovementProposal, proposeImprovements(), Kind, RetrospectiveResult (+6 more)

### Community 88 - "Role"
Cohesion: 0.15
Nodes (12): readLocalIntakeReport(), LOCAL_BINDINGS, file, project, root, DeliverySlot, officeCapacity, projectById() (+4 more)

### Community 90 - "runRetrospective"
Cohesion: 0.25
Nodes (12): baselineLearning(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences(), busyMaintenanceIds(), terminalCandidates(), triggerJobId() (+4 more)

### Community 91 - "digest"
Cohesion: 0.18
Nodes (21): comparableSlackText(), AuthoredDigest, reconcileDigestAuthorship(), unitAuthorship(), outboundBody(), retainOutboundBody(), digestNoticeRequest(), queueOutboundDigests() (+13 more)

### Community 92 - "DailyCTO.tsx"
Cohesion: 0.26
Nodes (8): CTOReview(), goalState, DailyCTO(), GoalHistory(), reportDate(), reviewStatus, reviewExcerpt(), ReviewText()

### Community 93 - "migrations.ts"
Cohesion: 0.28
Nodes (10): clip(), maintenanceBlockedId(), maintenanceCandidates(), maintenanceCompletedId(), maintenanceKey(), visibleMaintenanceTriggerIds(), seedProjectLessons(), SEEDS (+2 more)

### Community 94 - "telemetry/report.ts"
Cohesion: 0.33
Nodes (11): Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked(), row() (+3 more)

### Community 95 - "codex-rollout.ts"
Cohesion: 0.27
Nodes (10): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO (+2 more)

### Community 96 - ".value"
Cohesion: 0.24
Nodes (6): file, folder, logs, root, xml(), ProjectProgress

### Community 97 - "cli.ts"
Cohesion: 0.29
Nodes (5): args, [cmd,...rawArgs], commands, key, projectIndex

### Community 98 - "windows.ts"
Cohesion: 0.42
Nodes (9): ChannelProgress, compareTs(), micros(), nowTs(), overlapTs(), timestamp(), initialize(), refresh() (+1 more)

### Community 99 - "work.ts"
Cohesion: 0.20
Nodes (9): AssignmentResult, CompletionCondition, Continuation, DependencyObservation, EligibilityState, FailureCategory, ReconciliationAction, WorkAssignment (+1 more)

### Community 100 - "owned-artifact.ts"
Cohesion: 0.54
Nodes (6): ghLogCacheEvidence(), done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf()

### Community 101 - "run-usage.ts"
Cohesion: 0.32
Nodes (6): CodexRollout, claudeCrashZero(), claudeUsage(), codexUsage(), count(), RunUsage

### Community 102 - "extract-worker.mjs"
Cohesion: 0.70
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 103 - "evidence.ts"
Cohesion: 0.20
Nodes (12): investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_SOURCE_PATHS, officeSource(), ROOT, LaunchPolicy (+4 more)

### Community 104 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 107 - "codex-rollout-file.ts"
Cohesion: 0.36
Nodes (7): createdAt(), dayDirs(), header(), readCodexRollout(), ROLLOUT_MAX_BYTES, RolloutScan, scanCodexRollouts()

### Community 108 - "highestStableAtLeast"
Cohesion: 0.83
Nodes (3): compare(), highestStableAtLeast(), parts()

## Knowledge Gaps
- **387 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+382 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `dependency-bots/adopt.ts`, `workKey`, `record-trigger.ts`, `WorkTime`, `implementation-recovery.ts`, `source-amendment.ts`, `run-retrospective.ts`, `scheduled-work.ts`, `agents.ts`, `shared.ts`, `digest`, `easternDay`, `SourceRegistry`, `engine.ts`, `conversations/conversations.ts`, `worker-runtime.ts`, `artifact`, `github-delivery.ts`, `TicketJob`, `azure.ts`, `maintenance.ts`, `it-specialist.ts`, `candidate-child-context.ts`, `cec/workflow.ts`, `retrospective-subject.ts`, `run-accounting.ts`, `session-bridge.ts`, `notifications.ts`, `weekly-digest.ts`, `slack-intake/run.ts`, `knowledge.ts`, `read-links.ts`, `helperTelemetry`, `goal-reporting.ts`, `github/issue-publication.ts`, `IntakeLedger`, `brain-maintenance.ts`, `.emit`, `scheduler.ts`, `store.ts`, `.getEffect`, `sourceVisible`, `.save`, `features.ts`, `dependency-edges.ts`, `http/commands.ts`, `cec/issue-publication.ts`, `assertMayMutate`, `remove-candidate.ts`, `knowledge/routes.ts`, `blocker-followups.ts`, `schedule.ts`, `Coordinator`, `harnessEffect`, `control-store.ts`, `jira-time.ts`, `weekly-rollup.ts`, `fact-bounds.ts`, `coordination.ts`, `validate-stage.ts`, `dependencies.ts`, `lesson-selection.ts`, `process.ts`, `api-routes.ts`, `office/config.ts`, `publish-pr.ts`, `admit-improvement.ts`, `json`, `coordination-tick.ts`, `accept-retrospective.ts`, `Role`, `.pump`, `runRetrospective`, `digest`, `.value`, `evidence.ts`?**
  _High betweenness centrality (0.133) - this node is a cross-community bridge._
- **Why does `cx()` connect `index.tsx` to `OfficeScene.tsx`, `App.tsx`, `Button`, `PeoplePanel.tsx`, `work-summary.ts`, `TimeBook.tsx`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `command()` connect `process.ts` to `workKey`, `scheduled-work.ts`, `agents.ts`, `shared.ts`, `digest`, `engine.ts`, `worker-runtime.ts`, `Store`, `github-delivery.ts`, `TicketJob`, `azure.ts`, `maintenance.ts`, `it-specialist.ts`, `candidate-child-context.ts`, `cec/workflow.ts`, `session-bridge.ts`, `notifications.ts`, `slack-intake/run.ts`, `read-links.ts`, `github/issue-publication.ts`, `brain-maintenance.ts`, `.getEffect`, `.save`, `features.ts`, `cec/issue-publication.ts`, `assertMayMutate`, `remove-candidate.ts`, `knowledge/routes.ts`, `Coordinator`, `harnessEffect`, `jira-time.ts`, `coordination.ts`, `validate-stage.ts`, `dependencies.ts`, `publish-pr.ts`, `admit-improvement.ts`, `Role`, `.value`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `command()` (e.g. with `.constructor()` and `executeRequest()`) actually correct?**
  _`command()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _387 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dependency-bots/adopt.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10775510204081633 - nodes in this community are weakly interconnected._
- **Should `index.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06503591535624151 - nodes in this community are weakly interconnected._