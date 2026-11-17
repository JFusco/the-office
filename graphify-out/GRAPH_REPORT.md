# Graph Report - the-office  (2026-11-17)

## Corpus Check
- 866 files · ~340,060 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4201 nodes · 19284 edges · 131 communities (125 shown, 6 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 675 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8bf35b8e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- TimeBook.tsx
- OrgChart.tsx
- dependency-bots/adopt.ts
- .transaction
- Inspector.tsx
- accept-stage-result.ts
- session-bridge.ts
- ref_react
- candidate.ts
- github-readiness.ts
- worker-runtime.ts
- .getEffect
- App.tsx
- features/workflow.ts
- reader.ts
- scheduled-captures.ts
- run-retrospective.ts
- record-trigger.ts
- fact-bounds.ts
- artifact
- index.tsx
- create-candidate.ts
- scope-repair-resume.ts
- telemetry.ts
- lesson-selection.ts
- maintenance/maintenance.ts
- cost-ledger.ts
- ITFollowUps.tsx
- knowledge.ts
- jira-time.ts
- metadata-assessment.ts
- agents.ts
- conversations/conversations.ts
- closeout-recovery.ts
- github.ts
- features.ts
- scheduled-work.ts
- Store
- setup-stop-cap.ts
- index.ts
- continue-ownership-read.ts
- time-scope.ts
- ticket-stage-runner.ts
- ledger.ts
- Role
- harness-baseline.ts
- OfficeScene.tsx
- time-readback.ts
- command
- Outbox.tsx
- notifications.ts
- github-context.ts
- coordination-pump.ts
- inspect-closed-plan.ts
- harnessEffect
- weekly-rollup.ts
- effects.ts
- ref_node_path
- sanitize
- blocker-followups.ts
- coordination.ts
- http/commands.ts
- install-service.mjs
- requeue-waited-implement.ts
- ticket-evidence.ts
- run-accounting.ts
- remove-candidate.ts
- retrospective-subject.ts
- GitHubDelivery
- service-health.ts
- constellation-runtime.ts
- contract.ts
- work.ts
- report.ts
- api-routes.ts
- Offices
- node-visuals.ts
- daily-cto.ts
- scene-motion.ts
- run.ts
- intent.ts
- activation-recovery.ts
- outbox.ts
- agents.ts
- Goals.tsx
- RoomCamera.tsx
- workKey
- delivery-binding.ts
- stopped-base-validation.ts
- it-specialist.ts
- shared.ts
- config.ts
- github-delivery.ts
- conversations/slack.ts
- github/issue-publication.ts
- capture-session-clone.py
- preferences-store.ts
- knowledge-views.ts
- park-ticket.ts
- codex-rollout.ts
- useOfficePreferences.ts
- delivery-authority.ts
- workKey
- owned-artifact.ts
- ticket-stage-runner.ts
- extract-worker.mjs
- ProjectProgress
- Role
- engine.ts
- office-qa-handoff.ts
- highestStableAtLeast
- Coordinator
- CommandRegistry
- admit-improvement.ts
- slack-supersession.ts
- cli.ts
- qa.ts
- qa-plan-continuation.ts
- writer-restart.ts
- read-retries.ts
- GitHubIssuePublisher
- scheduled-features.ts
- brain-maintenance.ts
- approach.ts
- delivery-ownership.ts
- features.ts
- restoreInPlace
- CommittedBrain
- cost-totals.ts
- cec-implementation-continuation.ts
- project-policy.ts

## God Nodes (most connected - your core abstractions)
1. `Store` - 379 edges
2. `TicketJob` - 172 edges
3. `digest()` - 151 edges
4. `command()` - 120 edges
5. `GitHubDelivery` - 116 edges
6. `artifact()` - 114 edges
7. `workKey()` - 98 edges
8. `OfficeSnapshot` - 88 edges
9. `cx()` - 88 edges
10. `currentAssignment()` - 88 edges

## Surprising Connections (you probably didn't know these)
- `DeliveryAuthorityInput` --references--> `HarnessRequest`  [EXTRACTED]
  server/delivery/harness/delivery-authority.ts → src/contracts/work.ts
- `LessonBrainOverlap` --references--> `Lesson`  [EXTRACTED]
  server/knowledge/lesson-brain-audit.ts → src/contracts/knowledge.ts
- `UnrecordedResult` --references--> `StageResult`  [EXTRACTED]
  server/cec/unrecorded-result.ts → src/shared.ts
- `apply()` --indirect_call--> `note()`  [INFERRED]
  src/conversations/OutboxSavedImplementation.tsx → server/cec/parking/resume-parked.ts
- `Store` --references--> `OfficeSnapshot`  [EXTRACTED]
  server/store/store.ts → src/shared.ts

## Import Cycles
- 2-file cycle: `server/scheduling/coordination-pump.ts -> server/scheduling/coordination.ts -> server/scheduling/coordination-pump.ts`
- 2-file cycle: `server/scheduling/coordination-tick.ts -> server/scheduling/coordination.ts -> server/scheduling/coordination-tick.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/track-adopted-review.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/stage-reconciliation.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/publication/metadata-context.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/accept-stage-result.ts -> server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/accept-stage-result.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/implementation/saved-prerequisite-handoff.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/refresh-merge-review.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/closeout/github-closeout.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/queue-repairs.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/knowledge/lesson-exits.ts -> server/scheduling/requests.ts -> server/knowledge/lesson-exits.ts`
- 2-file cycle: `server/conversations/conversations.ts -> server/conversations/cto-conversations.ts -> server/conversations/conversations.ts`
- 2-file cycle: `server/conversations/notifications.ts -> server/conversations/slack.ts -> server/conversations/notifications.ts`
- 2-file cycle: `src/contracts/work.ts -> src/shared.ts -> src/contracts/work.ts`
- 2-file cycle: `src/contracts/people.ts -> src/shared.ts -> src/contracts/people.ts`
- 2-file cycle: `src/contracts/timing.ts -> src/shared.ts -> src/contracts/timing.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-guard.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`

## Communities (131 total, 6 thin omitted)

### Community 0 - "TimeBook.tsx"
Cohesion: 0.16
Nodes (26): TelemetryReport, ROLE_NAMES, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens(), usd() (+18 more)

### Community 1 - "OrgChart.tsx"
Cohesion: 0.11
Nodes (38): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+30 more)

### Community 2 - "dependency-bots/adopt.ts"
Cohesion: 0.12
Nodes (32): Execute, admitReadyCards(), adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, DependabotPR (+24 more)

### Community 3 - ".transaction"
Cohesion: 0.12
Nodes (30): featureItemComplete(), reconcileFeatureCompletion(), discoveryPrompt(), planPrompt(), readEvidence(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS (+22 more)

### Community 4 - "Inspector.tsx"
Cohesion: 0.13
Nodes (53): blockedSummary(), ServiceHealthPanel(), labels, ServiceHealthRow(), GoalList(), card(), reviewExcerpt(), EvidenceCard() (+45 more)

### Community 5 - "accept-stage-result.ts"
Cohesion: 0.14
Nodes (30): acceptStageResult(), assertDraftClaimHistory(), linkDraftIssue(), protectedOriginalClaim(), METADATA_FINDING, publicationReadArgs(), Read, readPublication() (+22 more)

### Community 6 - "session-bridge.ts"
Cohesion: 0.05
Nodes (56): claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexDaemonProcesses(), accountCodexProcesses(), CodexProcessInventory, codexProcessInventory() (+48 more)

### Community 7 - "ref_react"
Cohesion: 0.10
Nodes (37): Activity(), ActivityTimeline(), AssignmentKnowledge(), Lookup(), BrainWorkspace(), DocumentMetadata, documentText(), KnowledgeDocumentText (+29 more)

### Community 8 - "candidate.ts"
Cohesion: 0.23
Nodes (16): GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles(), ContinuationIO (+8 more)

### Community 9 - "github-readiness.ts"
Cohesion: 0.09
Nodes (52): harnessCloseout(), verifyMergeActions(), findingsBlock(), resumeProviderReviews(), observe(), assertAutomationEffects(), automationMergePolicy(), observeAutomationMerge() (+44 more)

### Community 10 - "worker-runtime.ts"
Cohesion: 0.06
Nodes (42): savedStageCompletion(), candidateWorkspaceEnvironment(), assignmentSubject(), LessonSelection, catalogLine(), assertBriefingScope(), contextPacket(), CODEX_DEFAULT_EFFORT (+34 more)

### Community 11 - ".getEffect"
Cohesion: 0.20
Nodes (12): settleDevUpdate(), settleDevUpdates(), GitHubOperations, fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), lessonText(), Assessment (+4 more)

### Community 12 - "App.tsx"
Cohesion: 0.06
Nodes (49): itAgent(), itDiagnostics(), BrainDrawer(), themeColor, App(), BrainWorkspace, CONNECTION, CONNECTION_DOT (+41 more)

### Community 13 - "features/workflow.ts"
Cohesion: 0.08
Nodes (62): approveFeature(), commandFeature(), featureById(), mutation(), reviewQuestions(), assertFeatureDependencyOrder(), featureDependencyEdges(), key() (+54 more)

### Community 14 - "reader.ts"
Cohesion: 0.06
Nodes (49): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, GraphNode (+41 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.11
Nodes (63): continueImplementation(), dispatchNightly(), drainDelivery(), requestDelivery(), startPilot(), OfficeQAHandoffInput, eligibility(), admit() (+55 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.07
Nodes (55): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, BlockingTrigger, blockingTrigger(), isBlocking() (+47 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.12
Nodes (37): baselineLearning(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences(), configureKnowledge(), clip(), maintenanceBlockedId() (+29 more)

### Community 18 - "fact-bounds.ts"
Cohesion: 0.25
Nodes (15): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+7 more)

### Community 19 - "artifact"
Cohesion: 0.06
Nodes (82): boardPreflightCandidate(), Ownership, reconcileBoardPreflight(), partialLocalCleanupCandidate(), candidateInput(), children, oldAdoptionBasis(), SavedCandidateAdmission (+74 more)

### Community 20 - "index.tsx"
Cohesion: 0.11
Nodes (44): MapBrowser(), MapView(), SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), loadOfficeConfig(), OfficeConfigSection() (+36 more)

### Community 21 - "create-candidate.ts"
Cohesion: 0.31
Nodes (9): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+1 more)

### Community 22 - "scope-repair-resume.ts"
Cohesion: 0.32
Nodes (12): Ownership, reconcileScopeRepairReadback(), scopeRepairRequestResolved(), assertScopeRepairResumeFindings(), certain(), effects(), originalClaim(), Ownership (+4 more)

### Community 23 - "telemetry.ts"
Cohesion: 0.10
Nodes (26): CodexRollout, CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL (+18 more)

### Community 24 - "lesson-selection.ts"
Cohesion: 0.15
Nodes (19): INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), MAINTENANCE, MAX_LESSONS, normalPath() (+11 more)

### Community 25 - "maintenance/maintenance.ts"
Cohesion: 0.13
Nodes (18): captureLearning(), captureMaintenanceStep(), candidateOwner(), SETTLED, skipOwnedCandidate(), Skipped, skippedCandidateLedger(), CmsFollowUpContext (+10 more)

### Community 26 - "cost-ledger.ts"
Cohesion: 0.16
Nodes (26): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId(), OutsideEdit (+18 more)

### Community 27 - "ITFollowUps.tsx"
Cohesion: 0.67
Nodes (4): itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps()

### Community 28 - "knowledge.ts"
Cohesion: 0.07
Nodes (36): curateLesson(), Curation, CurationAction, mergeEvidence(), Input, Kind, RetrospectiveResult, RetrospectiveResultSchema (+28 more)

### Community 29 - "jira-time.ts"
Cohesion: 0.14
Nodes (21): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+13 more)

### Community 30 - "metadata-assessment.ts"
Cohesion: 0.08
Nodes (60): activeEffectId(), retryRead(), admitPRMetadata(), assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema, savedMetadataAssessment() (+52 more)

### Community 31 - "agents.ts"
Cohesion: 0.08
Nodes (45): implementationWorkerContext(), cecPrompt(), resolvedDecisionNote(), stageInstructions, capacityInterruptedRun(), providerSaid(), rerunsInterruptedQA(), applies() (+37 more)

### Community 32 - "conversations/conversations.ts"
Cohesion: 0.09
Nodes (28): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+20 more)

### Community 33 - "closeout-recovery.ts"
Cohesion: 0.12
Nodes (40): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+32 more)

### Community 34 - "github.ts"
Cohesion: 0.26
Nodes (6): GitHubMonitor, githubPRDescription(), GOAL_EVIDENCE_LIMITS, GitHubBoard, GitHubPR, GitHubState

### Community 35 - "features.ts"
Cohesion: 0.19
Nodes (18): FeatureQuestionProjection, OutboxQuestionRound(), send(), draftKey(), readDraft(), saveDraft(), QuestionRound(), nextQuestion() (+10 more)

### Community 36 - "scheduled-work.ts"
Cohesion: 0.10
Nodes (37): freshOwnershipRead(), deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), withAmendmentOwnership(), metadataRequestResolved(), preparationRequestResolved(), gateFeatureWork() (+29 more)

### Community 37 - "Store"
Cohesion: 0.05
Nodes (48): candidateBranchMoved(), decideImplementation(), interruptedImplementation(), resume(), Document, document(), isAccessOnlyPlan(), settledAccessOnlyState() (+40 more)

### Community 38 - "setup-stop-cap.ts"
Cohesion: 0.60
Nodes (4): confirmSetupStopCap(), consecutiveSetupStops(), SETUP_STOP_CAP, setupStop()

### Community 39 - "index.ts"
Cohesion: 0.10
Nodes (21): close(), config, itSpecialist, loadedRevision, offices, releaseLock, server, serviceHealth (+13 more)

### Community 40 - "continue-ownership-read.ts"
Cohesion: 0.30
Nodes (11): continueOwnershipRead(), expiredOwnershipRead(), handoffOwnership(), ownershipReadGate(), ownershipReadState(), ownershipReadHistory(), ownershipReadSource(), ReadOwnershipCandidate (+3 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.19
Nodes (21): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), midnight(), TicketDay (+13 more)

### Community 42 - "ticket-stage-runner.ts"
Cohesion: 0.32
Nodes (12): run(), UnrecordedResult, unrecordedStageResult(), approachFingerprint(), enqueueRepairDiagnosis(), githubRepairEligible(), jiraRepairable(), repairFindingIds() (+4 more)

### Community 43 - "ledger.ts"
Cohesion: 0.21
Nodes (15): diagnosticSnapshot(), acceptedCompletionResolution(), investigationCandidates(), investigationId(), ctoReplacementResolution(), finishedSubjectResolution(), investigationFollowUps(), implementationReplacementResolution() (+7 more)

### Community 44 - "Role"
Cohesion: 0.11
Nodes (27): IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), projectListScope(), cecIntakePrompt(), AUTO_ADOPT_BOTS, assertFeaturePlanningConfig() (+19 more)

### Community 45 - "harness-baseline.ts"
Cohesion: 0.15
Nodes (22): BaselineReport, baselineReport(), BaselineSource, baselineText(), millions(), row(), share(), add() (+14 more)

### Community 46 - "OfficeScene.tsx"
Cohesion: 0.16
Nodes (34): withoutElapsed(), Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk() (+26 more)

### Community 47 - "time-readback.ts"
Cohesion: 0.29
Nodes (6): TimeLedger, dueReadback(), Readback, READBACK_INTERVAL_MS, readBackTime(), SETTLE_MS

### Community 48 - "command"
Cohesion: 0.07
Nodes (7): correlatedBuild(), Engine, observe(), observeParked(), parkedReadError, command(), workerFailure()

### Community 49 - "Outbox.tsx"
Cohesion: 0.10
Nodes (38): Conversation(), Outbox(), ctoInputFailure(), OutboxCTOInput(), OutboxLessonDecision(), act(), OutboxLessonDigest(), OutboxMaintenanceStatus() (+30 more)

### Community 50 - "notifications.ts"
Cohesion: 0.18
Nodes (16): ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR, plainSlackText() (+8 more)

### Community 51 - "github-context.ts"
Cohesion: 0.17
Nodes (29): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), ProjectCard, projectCards(), projectGraphql() (+21 more)

### Community 52 - "coordination-pump.ts"
Cohesion: 0.15
Nodes (17): reconcileNoticeConfirmations(), compatible(), dependencyCompletionKey(), dependencyEligibility(), issueKey(), observePrerequisites(), PrerequisiteSchema, validatePrerequisites() (+9 more)

### Community 53 - "inspect-closed-plan.ts"
Cohesion: 0.20
Nodes (11): closedReadonlyPlan(), Document, document(), entryExists(), inspectClosedQAPlan(), qaPlanRetryRoute(), reviewedPlanGuidance, reviewedPlanGuideDigest (+3 more)

### Community 54 - "harnessEffect"
Cohesion: 0.19
Nodes (17): readBackOrThrow(), ensureTrackingIssue(), findTrackingIssue(), ownTracking(), TrackingIssue, trackingIssueBody(), trackingIssueTitle(), trackingMarker() (+9 more)

### Community 55 - "weekly-rollup.ts"
Cohesion: 0.12
Nodes (29): learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), BRAIN_SCOPE (+21 more)

### Community 56 - "effects.ts"
Cohesion: 0.26
Nodes (6): FeaturePublisher, publishFeature(), reconcilePublication(), uncertainPublications(), reserveIdentity(), EffectUncertainError

### Community 57 - "ref_node_path"
Cohesion: 0.06
Nodes (61): removeAdoptedClone(), namedRepairIds(), pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), assertStoppedBaseAudit(), AuditRow, readStoppedBaseAuditCompletion(), StoppedBaseAuditReader (+53 more)

### Community 58 - "sanitize"
Cohesion: 0.12
Nodes (29): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+21 more)

### Community 59 - "blocker-followups.ts"
Cohesion: 0.26
Nodes (13): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), canFileGithubIssue(), readBackConversations(), nativeDeliveryResolved(), handoff(), reconcileBlockerFollowups() (+5 more)

### Community 60 - "coordination.ts"
Cohesion: 0.13
Nodes (21): IntakeContext, DependencyStores, completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation() (+13 more)

### Community 61 - "http/commands.ts"
Cohesion: 0.12
Nodes (24): configureNotices(), retryRecipientLookup(), bindDiscoveryResume(), DiscoveryResumeInput, failedWorker(), requeueWaitedImplement(), enqueueMetadataRecovery(), normalizeStatement() (+16 more)

### Community 62 - "install-service.mjs"
Cohesion: 0.14
Nodes (10): file, folder, logs, root, Read, GIT_NETWORK, LIVE_PROVIDERS, liveReach() (+2 more)

### Community 63 - "requeue-waited-implement.ts"
Cohesion: 0.21
Nodes (11): devUpdate(), HEADLINE, parksInJira(), OUTCOME, qaComment(), remote(), STAGE, plainWords() (+3 more)

### Community 64 - "ticket-evidence.ts"
Cohesion: 0.10
Nodes (29): assetDownloader(), attachmentKind(), evidenceDirectory(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS, EvidenceAttachment (+21 more)

### Community 65 - "run-accounting.ts"
Cohesion: 0.13
Nodes (26): BoundedRead, CompletionReader, codexHome(), createdAt(), dayDirs(), header(), readCodexRollout(), ROLLOUT_MAX_BYTES (+18 more)

### Community 66 - "remove-candidate.ts"
Cohesion: 0.18
Nodes (18): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot() (+10 more)

### Community 67 - "retrospective-subject.ts"
Cohesion: 0.15
Nodes (19): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, maintenanceKey(), azurePrUrl(), findSubject(), jobSubject() (+11 more)

### Community 68 - "GitHubDelivery"
Cohesion: 0.15
Nodes (10): GitHubDelivery, adoptCandidate(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related (+2 more)

### Community 69 - "service-health.ts"
Cohesion: 0.18
Nodes (10): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, DailyCTOSummary (+2 more)

### Community 70 - "constellation-runtime.ts"
Cohesion: 0.10
Nodes (20): CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point, createConstellation(), enter() (+12 more)

### Community 71 - "contract.ts"
Cohesion: 0.14
Nodes (20): Event, one(), prePushRejection(), PushIdentity, Candidate, recordedPush(), settledPushBoundary(), At (+12 more)

### Community 72 - "work.ts"
Cohesion: 0.10
Nodes (24): Admission, BLOCKED_CAUSES, blockedCauses(), projectReadiness(), ProjectReadiness, AssignmentResult, BlockedCause, CompletionCondition (+16 more)

### Community 73 - "report.ts"
Cohesion: 0.26
Nodes (13): TelemetryRow, TelemetrySync, Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount() (+5 more)

### Community 74 - "api-routes.ts"
Cohesion: 0.18
Nodes (16): implementationPreview(), implementationContinuationRoute(), goalHistory(), apiRoute(), RequestContext, preferencesRoute(), fileResponse(), json() (+8 more)

### Community 75 - "Offices"
Cohesion: 0.22
Nodes (3): QuestionNotifications, projectById(), Offices

### Community 76 - "node-visuals.ts"
Cohesion: 0.20
Nodes (14): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+6 more)

### Community 77 - "daily-cto.ts"
Cohesion: 0.06
Nodes (30): DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), applyGoalReview(), DailyResultSchema, EvidenceRefSchema, FreshDailyResultSchema (+22 more)

### Community 78 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 79 - "run.ts"
Cohesion: 0.20
Nodes (14): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, OFFICE_FIX_PROMPT, OfficeFixResult, validateOfficeFix(), investigationReady(), requeueInvestigationEvidence(), InvestigationOptions (+6 more)

### Community 80 - "intent.ts"
Cohesion: 0.25
Nodes (9): assertOwnership(), ImplementationDecision, OwnershipRead, entry(), ReadbackOwnerDecision, Decision, requestQAPlanRetry(), QAOwnershipReadContinuation (+1 more)

### Community 81 - "activation-recovery.ts"
Cohesion: 0.07
Nodes (77): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+69 more)

### Community 82 - "outbox.ts"
Cohesion: 0.29
Nodes (10): syncOutbox(), finishSupersededReadback(), projectSlackDeliveries(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint(), slackRequestSettled() (+2 more)

### Community 83 - "agents.ts"
Cohesion: 0.05
Nodes (50): intakeMembership(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), readbackDispatchGuidance(), CECReadbackSchema, READBACK_OWNER_SCOPE, Attempt (+42 more)

### Community 84 - "Goals.tsx"
Cohesion: 0.07
Nodes (42): SendMessage, LessonDecisionAction, lessonDecisionState(), readLessonDecision(), recover(), readStatus(), OutboxSavedImplementation(), apply() (+34 more)

### Community 85 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (7): CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility, overlayEntranceDelays(), SceneOverlay()

### Community 86 - "workKey"
Cohesion: 0.19
Nodes (15): completedPRReviews(), Assessment, diagnosticProof(), discoveryRecoveryCandidate(), ownedArtifact(), Ownership, rawHash(), recoverDiscovery() (+7 more)

### Community 87 - "delivery-binding.ts"
Cohesion: 0.33
Nodes (6): APPROACH_GUIDANCE, deliveryTask(), DeliveryTaskInput, DISCOVERY_GUIDANCE, compactSteps(), featureDeliveryContext()

### Community 88 - "stopped-base-validation.ts"
Cohesion: 0.42
Nodes (8): continuationNativeReview(), assertStoppedBaseApproach(), stoppedBaseNextStage(), stoppedBasePackedCommands(), assertAcceptedFiles(), assertStoppedBaseMergeReady(), assertStoppedBaseValidation(), stoppedBaseStageProof()

### Community 89 - "it-specialist.ts"
Cohesion: 0.21
Nodes (14): partialLocalCleanupKey(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), ITContext, informationalRecovery(), publishITReport() (+6 more)

### Community 90 - "shared.ts"
Cohesion: 0.05
Nodes (76): ctoInputIdentityMatches(), ctoInputRecovered(), ADOPTION_STALLED_MS, conversationResolved(), projectOutbox(), knowledgeOutbox(), checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup() (+68 more)

### Community 91 - "config.ts"
Cohesion: 0.14
Nodes (22): CommentPage, commentReadback(), JiraOperations, jiraRecord(), unpack(), postDevUpdate(), commentPayload(), JiraCommentIntent (+14 more)

### Community 92 - "github-delivery.ts"
Cohesion: 0.06
Nodes (67): containedFile(), writerRestartInstruction(), assertDeliveryMayMutate(), HarnessControl, withHarnessWork(), runHarnessStage(), handsOff(), harnessDelivers() (+59 more)

### Community 93 - "conversations/slack.ts"
Cohesion: 0.08
Nodes (23): channelNoticeAuthorized(), MergeNotifications, comparableSlackText(), settleRequestedSlackReplacement(), SlackMessages, SlackRequestSchema, SlackResultSchema, SlackVerificationSchema (+15 more)

### Community 94 - "github/issue-publication.ts"
Cohesion: 0.15
Nodes (12): Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), Transition, descriptionPreimage(), plain() (+4 more)

### Community 96 - "preferences-store.ts"
Cohesion: 0.19
Nodes (9): PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS, OfficePreferences (+1 more)

### Community 97 - "knowledge-views.ts"
Cohesion: 0.16
Nodes (18): KnowledgeActivity, KnowledgeEdge, KnowledgeMap, KnowledgeNode, connectionSummary(), ConstellationView, ConstellationRuntime, DisplayNode (+10 more)

### Community 98 - "park-ticket.ts"
Cohesion: 0.12
Nodes (42): resolveBlockedTransition(), document(), transitionWithComment(), jiraAccount(), jiraCollection(), JiraCredential, jiraCredential(), KEYCHAIN_SERVICE (+34 more)

### Community 99 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 100 - "useOfficePreferences.ts"
Cohesion: 0.26
Nodes (10): acceptPreferences(), PreferenceCandidate, strip(), UNKNOWN_PREFERENCES, OfficePreferencesController, PreferenceFeedback, PreferenceField, requestPreferences() (+2 more)

### Community 101 - "delivery-authority.ts"
Cohesion: 0.19
Nodes (16): deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, requireDeliveryAuthority(), deliveryIntakeBlocker(), gateRegisteredDelivery(), accounting (+8 more)

### Community 102 - "workKey"
Cohesion: 0.21
Nodes (13): ATTEMPT_DELAYS_MS, nextAttemptAt(), restartStoppedWriters(), unchangedSinceAccepted(), NOT_RETRYABLE, WRITER_STAGES, WriterRestartCandidate, writerRestartCandidate() (+5 more)

### Community 103 - "owned-artifact.ts"
Cohesion: 0.22
Nodes (14): investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_SOURCE_PATHS, officeSource(), ROOT, done() (+6 more)

### Community 104 - "ticket-stage-runner.ts"
Cohesion: 0.16
Nodes (17): applyIntakeObservation(), checkMail(), drainMail(), requestMail(), qaPlanEvidenceGap(), MISSING_INTAKE, reconcileMailbox(), unusedMailbox() (+9 more)

### Community 105 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 107 - "Role"
Cohesion: 0.22
Nodes (13): ROLES, DeliverySlot, OfficeCapacity, fifo(), selectWork(), admitsWork(), canDispatch(), deliveryOccupied() (+5 more)

### Community 108 - "engine.ts"
Cohesion: 0.18
Nodes (6): enableNightly(), FeatureReviewRunner, FeatureWorkflow, drainMaintenance(), reconcileMaintenance(), requestMaintenance()

### Community 109 - "office-qa-handoff.ts"
Cohesion: 0.60
Nodes (4): OfficeQAHandoff, OfficeQAHandoffInput, OfficeQAHandoffRequest, QAOwnershipProof

### Community 110 - "highestStableAtLeast"
Cohesion: 0.83
Nodes (3): compare(), highestStableAtLeast(), parts()

### Community 111 - "Coordinator"
Cohesion: 0.08
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 112 - "CommandRegistry"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 113 - "admit-improvement.ts"
Cohesion: 0.21
Nodes (17): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+9 more)

### Community 114 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 115 - "cli.ts"
Cohesion: 0.16
Nodes (9): args, [cmd,...rawArgs], commands, key, projectIndex, LessonBrainAudit, lessonBrainAudit(), LessonBrainOverlap (+1 more)

### Community 119 - "read-retries.ts"
Cohesion: 0.36
Nodes (8): PrerequisitesSchema, classifyStop(), ReviewWait, incompleteReadOutput(), planReadRetry(), reconcileReadRetries(), temporaryReadFailure(), StopKind

### Community 120 - "GitHubIssuePublisher"
Cohesion: 0.31
Nodes (3): GitHubIssuePublisher, number(), same()

### Community 121 - "scheduled-features.ts"
Cohesion: 0.48
Nodes (11): currentApproval(), featureGate(), predecessorComplete(), automaticIntakeWait(), DeliveryPreflight, deliveryPreflight(), handoffBinding(), readHandoff() (+3 more)

### Community 122 - "brain-maintenance.ts"
Cohesion: 0.19
Nodes (12): maintenancePolicies(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice(), easternDate(), GitHubMaintenance (+4 more)

### Community 123 - "approach.ts"
Cohesion: 0.42
Nodes (10): afterDraft(), ApproachSchema, firstBuildStage(), missingApproachStage(), plannedNext(), recordApproach(), reroute(), stageNeeded() (+2 more)

### Community 124 - "delivery-ownership.ts"
Cohesion: 0.33
Nodes (4): Ownership, ownershipContext, refreshDeliveryOwnership(), RefreshOwnership

### Community 125 - "features.ts"
Cohesion: 0.08
Nodes (42): packedConsumerPnpmRepair(), sha256(), assertQuestionVisibility(), applyHarnessAction(), HarnessActionInput, recoveryPreconditions(), recoveryTarget(), normalizeRound() (+34 more)

### Community 126 - "restoreInPlace"
Cohesion: 0.60
Nodes (5): identity(), Json, plain(), restorable(), restoreInPlace()

### Community 128 - "cost-totals.ts"
Cohesion: 0.32
Nodes (7): awaitingEvidence(), boardUsd(), CaptureContext, inCostWindow(), TicketCost, ticketCosts(), ISSUE_KEY

### Community 129 - "cec-implementation-continuation.ts"
Cohesion: 0.40
Nodes (4): ImplementationContinuation, ImplementationContinuationInput, ImplementationContinuationRequest, SavedImplementationProof

### Community 131 - "project-policy.ts"
Cohesion: 0.19
Nodes (11): approveMerge(), assertHarnessMayMerge(), HUMAN_MERGE, BEFORE_POLICY, Project, ProjectPolicy, projectPolicy(), resolveProjectPolicy() (+3 more)

## Knowledge Gaps
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `dependency-bots/adopt.ts`, `.transaction`, `accept-stage-result.ts`, `session-bridge.ts`, `candidate.ts`, `github-readiness.ts`, `worker-runtime.ts`, `.getEffect`, `features/workflow.ts`, `reader.ts`, `scheduled-captures.ts`, `run-retrospective.ts`, `record-trigger.ts`, `artifact`, `create-candidate.ts`, `scope-repair-resume.ts`, `lesson-selection.ts`, `maintenance/maintenance.ts`, `cost-ledger.ts`, `knowledge.ts`, `jira-time.ts`, `metadata-assessment.ts`, `agents.ts`, `conversations/conversations.ts`, `closeout-recovery.ts`, `github.ts`, `scheduled-work.ts`, `continue-ownership-read.ts`, `time-scope.ts`, `ticket-stage-runner.ts`, `ledger.ts`, `time-readback.ts`, `command`, `notifications.ts`, `github-context.ts`, `coordination-pump.ts`, `inspect-closed-plan.ts`, `harnessEffect`, `weekly-rollup.ts`, `effects.ts`, `ref_node_path`, `sanitize`, `blocker-followups.ts`, `coordination.ts`, `http/commands.ts`, `ticket-evidence.ts`, `run-accounting.ts`, `remove-candidate.ts`, `retrospective-subject.ts`, `GitHubDelivery`, `contract.ts`, `api-routes.ts`, `Offices`, `daily-cto.ts`, `run.ts`, `intent.ts`, `activation-recovery.ts`, `outbox.ts`, `agents.ts`, `workKey`, `delivery-binding.ts`, `stopped-base-validation.ts`, `it-specialist.ts`, `shared.ts`, `config.ts`, `github-delivery.ts`, `conversations/slack.ts`, `github/issue-publication.ts`, `park-ticket.ts`, `delivery-authority.ts`, `workKey`, `owned-artifact.ts`, `ticket-stage-runner.ts`, `ProjectProgress`, `Role`, `engine.ts`, `Coordinator`, `admit-improvement.ts`, `read-retries.ts`, `GitHubIssuePublisher`, `scheduled-features.ts`, `brain-maintenance.ts`, `features.ts`, `project-policy.ts`?**
  _High betweenness centrality (0.109) - this node is a cross-community bridge._
- **Should `OrgChart.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11100832562442182 - nodes in this community are weakly interconnected._
- **Why does `Engine` connect `command` to `candidate.ts`, `github-readiness.ts`, `.getEffect`, `scheduled-captures.ts`, `artifact`, `conversations/conversations.ts`, `github.ts`, `scheduled-work.ts`, `Store`, `continue-ownership-read.ts`, `ticket-stage-runner.ts`, `notifications.ts`, `coordination-pump.ts`, `sanitize`, `coordination.ts`, `config.ts`, `github-delivery.ts`, `conversations/slack.ts`, `ticket-stage-runner.ts`, `engine.ts`, `Coordinator`, `brain-maintenance.ts`, `features.ts`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Should `dependency-bots/adopt.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11627906976744186 - nodes in this community are weakly interconnected._
- **Why does `Coordinator` connect `Coordinator` to `dependency-bots/adopt.ts`, `scheduled-work.ts`, `Store`, `session-bridge.ts`, `scheduled-captures.ts`, `artifact`, `coordination-pump.ts`, `coordination.ts`, `features.ts`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Should `.transaction` be split into smaller, more focused modules?**
  _Cohesion score 0.12077294685990338 - nodes in this community are weakly interconnected._
- **Should `Inspector.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12915601023017903 - nodes in this community are weakly interconnected._