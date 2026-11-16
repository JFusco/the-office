# Graph Report - the-office  (2026-11-16)

## Corpus Check
- 842 files · ~333,170 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4110 nodes · 18899 edges · 119 communities (116 shown, 3 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 608 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d1a89056`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Button
- PeoplePanel.tsx
- github/issue-publication.ts
- review-run.ts
- Inspector.tsx
- requests.ts
- session-bridge.ts
- ref_react
- artifact
- Store
- worker-runtime.ts
- github-delivery.ts
- App.tsx
- authorize.ts
- assignments.ts
- scheduled-captures.ts
- run-retrospective.ts
- record-trigger.ts
- continuation-evidence.ts
- preparation-readback.ts
- features/commands.ts
- github-readiness.ts
- QuestionStepper.tsx
- coordination.ts
- knowledge.ts
- engine.ts
- cost-ledger.ts
- ref_zod
- cec/issue-publication.ts
- jira-time.ts
- metadata-assessment.ts
- cec-reads.ts
- sanitize
- Goals.tsx
- CEC
- index.tsx
- scheduled-work.ts
- scheduler.ts
- closeout-recovery.ts
- api-routes.ts
- remove-candidate.ts
- time-scope.ts
- node-visuals.ts
- run-accounting.ts
- ownedPath
- executeRequest
- OfficeScene.tsx
- Engine
- dependency-bots/adopt.ts
- demand-facts.ts
- http/commands.ts
- scene-motion.ts
- move-lane.ts
- conversations/slack.ts
- work.ts
- weekly-rollup.ts
- shared.ts
- TimeBook.tsx
- RoomCamera.tsx
- store.ts
- retrospective-subject.ts
- run.ts
- assignment-poll.ts
- verifyRepairCandidate
- ticket-evidence.ts
- harness-baseline.ts
- agents.ts
- ControlStore
- digest
- JiraIssuePublisher
- constellation-runtime.ts
- process.ts
- tracking-issue.ts
- report.ts
- it-specialist.ts
- admit-improvement.ts
- .save
- daily-cto.ts
- GitHubIssuePublisher
- run-cost.ts
- cli.ts
- lesson-selection.ts
- ref_node_path
- .transaction
- work-summary.ts
- ledger.ts
- recovery-ledger.ts
- index.ts
- ScheduledWork
- merge-scanner-retry.ts
- delivery-repairs.ts
- .emit
- TicketJob
- extraction.ts
- features.ts
- capture-session-clone.py
- preferences-store.ts
- OfficeSnapshot
- park-ticket.ts
- scope-repair-resume.ts
- Clock
- local-config.ts
- time-readback.ts
- agent-activity.ts
- offices.ts
- extract-worker.mjs
- diagnostic-context.ts
- blocker-followups.ts
- office/readiness.ts
- stopped-base-provider.ts
- setup-stop-cap.ts
- stage-prompts.ts
- CommandRegistry
- delivery-ownership.ts
- evidence-digest.ts
- read-retries.ts
- CommittedBrain
- packed-consumer-pnpm.ts
- qa-plan-retry.ts

## God Nodes (most connected - your core abstractions)
1. `Store` - 369 edges
2. `TicketJob` - 172 edges
3. `digest()` - 150 edges
4. `command()` - 117 edges
5. `GitHubDelivery` - 116 edges
6. `artifact()` - 114 edges
7. `workKey()` - 96 edges
8. `OfficeSnapshot` - 88 edges
9. `cx()` - 88 edges
10. `currentAssignment()` - 88 edges

## Surprising Connections (you probably didn't know these)
- `apply()` --indirect_call--> `note()`  [INFERRED]
  src/conversations/OutboxSavedImplementation.tsx → server/cec/parking/resume-parked.ts
- `investigationResolution()` --calls--> `slackMessageUrl()`  [EXTRACTED]
  server/it/investigations/ledger.ts → src/shared.ts
- `DeliverySlot` --references--> `Role`  [EXTRACTED]
  server/office/projects.ts → src/shared.ts
- `StageContext` --references--> `Role`  [EXTRACTED]
  server/delivery/pipeline/accept-stage-result.ts → src/shared.ts
- `MaintenanceSubjectFacts` --references--> `Role`  [EXTRACTED]
  server/knowledge/maintenance-subject.ts → src/shared.ts

## Import Cycles
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/review-wait.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/parking/resume-provider-review.ts -> server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/parking/resume-provider-review.ts`
- 3-file cycle: `server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts`
- 4-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/readiness/review-wait.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 4-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 4-file cycle: `server/delivery/recovery/implementation/activation-recovery.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/implementation/activation-recovery.ts`
- 4-file cycle: `server/delivery/recovery/implementation/saved-prerequisite-handoff.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/implementation/saved-prerequisite-handoff.ts`
- 4-file cycle: `server/delivery/recovery/stopped-base-review.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/stopped-base-review.ts`
- 4-file cycle: `server/delivery/recovery/validation/validation-readback.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/validation/validation-readback.ts`
- 4-file cycle: `server/features/delivery-binding.ts -> server/features/enrollment-gate.ts -> server/features/progression/failure.ts -> server/store/effects.ts -> server/features/delivery-binding.ts`
- 5-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/stage-reconciliation.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 5-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 5-file cycle: `server/delivery/recovery/implementation/continuation-evidence.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/recovery/implementation/continuation-evidence.ts`
- 5-file cycle: `server/delivery/recovery/implementation/saved-prerequisite-handoff.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/recovery/implementation/saved-prerequisite-handoff.ts`
- 5-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/scope-repair/scope-repair-resume.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 5-file cycle: `server/delivery/recovery/scope-repair/scope-repair-readback.ts -> server/delivery/recovery/scope-repair/scope-repair-resume.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/scope-repair/scope-repair-readback.ts`
- 5-file cycle: `server/delivery/recovery/implementation/continuation-evidence.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/implementation/implementation-recovery.ts -> server/delivery/recovery/implementation/continuation-evidence.ts`
- 5-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/closeout/github-closeout.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`

## Communities (119 total, 3 thin omitted)

### Community 0 - "Button"
Cohesion: 0.13
Nodes (38): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView() (+30 more)

### Community 1 - "PeoplePanel.tsx"
Cohesion: 0.11
Nodes (39): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+31 more)

### Community 2 - "github/issue-publication.ts"
Cohesion: 0.17
Nodes (25): resolveLane(), cardStatus(), ProjectCard, projectCards(), projectGraphql(), setCardStatus(), statusField, ensureReviewCards() (+17 more)

### Community 3 - "review-run.ts"
Cohesion: 0.14
Nodes (31): featureItemComplete(), reconcileFeatureCompletion(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS, requestReplan(), reserveReplacement(), stageBudget() (+23 more)

### Community 4 - "Inspector.tsx"
Cohesion: 0.10
Nodes (64): blockedSummary(), itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps(), ServiceHealthPanel(), followUp(), labels (+56 more)

### Community 5 - "requests.ts"
Cohesion: 0.06
Nodes (69): nextAttemptAt(), NOT_RETRYABLE, WRITER_STAGES, writerRestartCandidate, writerRestarted(), writerRestartPending(), deliveryAdmission(), assessDeliveryAuthority() (+61 more)

### Community 6 - "session-bridge.ts"
Cohesion: 0.05
Nodes (58): ref_node_perf_hooks, ref_node_url, ref_ws, file, folder, logs, root, claudeSessionContext() (+50 more)

### Community 7 - "ref_react"
Cohesion: 0.07
Nodes (62): ref_react, ref_react_markdown, ref_remark_gfm, ref_yaml, KnowledgeActivity, KnowledgeEdge, KnowledgeMap, KnowledgeNode (+54 more)

### Community 8 - "artifact"
Cohesion: 0.07
Nodes (82): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+74 more)

### Community 9 - "Store"
Cohesion: 0.08
Nodes (17): featureById(), discoveryPrompt(), planPrompt(), GitHubFeaturePublisher, JiraFeaturePublisher, Link, linkFeature(), beginReader() (+9 more)

### Community 10 - "worker-runtime.ts"
Cohesion: 0.05
Nodes (50): ref_smol_toml, intakeLocation(), candidateWorkspaceEnvironment(), server_delivery_harness_delivery_authority_resolvedeliverywork, ApproachSchema, LOCAL_BINDINGS, ROOT, file (+42 more)

### Community 11 - "github-delivery.ts"
Cohesion: 0.07
Nodes (53): writerRestartInstruction(), findingsBlock(), assertDeliveryMayMutate(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery(), BOARD_RULE (+45 more)

### Community 12 - "App.tsx"
Cohesion: 0.06
Nodes (51): ref_lucide_react, ref_motion, ref_react_dom, BrainDrawer(), themeColor, App(), BrainWorkspace, CONNECTION (+43 more)

### Community 13 - "authorize.ts"
Cohesion: 0.08
Nodes (47): approveFeature(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), artifactPath(), digest(), document() (+39 more)

### Community 14 - "assignments.ts"
Cohesion: 0.09
Nodes (36): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, GraphNode (+28 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.15
Nodes (45): requestDelivery(), createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest (+37 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.10
Nodes (39): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, blockingTrigger, isBlocking(), brainOverlap (+31 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.11
Nodes (40): baselineLearning(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences(), configureKnowledge(), clip(), maintenanceBlockedId() (+32 more)

### Community 18 - "continuation-evidence.ts"
Cohesion: 0.10
Nodes (32): allowed, continuationNativeReview(), continuationReviewArtifacts(), continuationWorkerProof(), negativeWorker(), savedNegativeContinuationReview(), negativeTechnicalReview(), StoppedBaseAuditReader (+24 more)

### Community 19 - "preparation-readback.ts"
Cohesion: 0.11
Nodes (32): bindPreparationBoardOrigins(), claimSchema, eventSchema, PreparationBoardOrigin, readPreparationBoardOrigins(), timestamp, updateSchema, nativeCompletion() (+24 more)

### Community 20 - "features/commands.ts"
Cohesion: 0.18
Nodes (22): commandFeature(), reviewQuestions(), automaticIntakeWait(), assertQuestionVisibility(), applyHarnessAction(), HarnessActionInput, recoveryPreconditions(), recoveryTarget() (+14 more)

### Community 21 - "github-readiness.ts"
Cohesion: 0.09
Nodes (48): resume(), resumeProviderReviews(), observe(), assertAutomationEffects(), automationMergePolicy(), observeAutomationMerge(), routeAutomationMerge(), checksFailed() (+40 more)

### Community 22 - "QuestionStepper.tsx"
Cohesion: 0.18
Nodes (19): FeatureQuestionProjection, FeatureRound, OutboxQuestionRound(), send(), draftKey(), readDraft(), saveDraft(), QuestionRound() (+11 more)

### Community 23 - "coordination.ts"
Cohesion: 0.10
Nodes (34): MergeNotifications, Admission, admit(), IntakeContext, WAIT_STATUSES, compatible(), dependencyEligibility(), DependencyStores (+26 more)

### Community 24 - "knowledge.ts"
Cohesion: 0.05
Nodes (47): curateLesson(), Curation, CurationAction, mergeEvidence(), lessonBrainAudit, LessonBrainOverlap, LessonSelection, catalogLine() (+39 more)

### Community 25 - "engine.ts"
Cohesion: 0.05
Nodes (56): applyIntakeObservation(), checkMail(), drainMail(), requestMail(), enableNightly(), ingest(), maintenancePolicies(), captureMaintenanceStep() (+48 more)

### Community 26 - "cost-ledger.ts"
Cohesion: 0.15
Nodes (28): captureCost(), server_telemetry_cost_entries_costcoveragesummary, costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId() (+20 more)

### Community 27 - "ref_zod"
Cohesion: 0.10
Nodes (30): ref_zod, continuationScope(), Assessment, discoveryRecoveryCandidate(), ownedArtifact(), Ownership, rawHash(), brainImplementationCandidate() (+22 more)

### Community 28 - "cec/issue-publication.ts"
Cohesion: 0.16
Nodes (15): CommentPage, commentReadback(), Assignment, Content, jiraText(), Transition, JiraOperations, plain() (+7 more)

### Community 29 - "jira-time.ts"
Cohesion: 0.22
Nodes (13): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+5 more)

### Community 30 - "metadata-assessment.ts"
Cohesion: 0.12
Nodes (46): harnessEffect, retryRead(), admitPRMetadata(), assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema, savedMetadataAssessment() (+38 more)

### Community 31 - "cec-reads.ts"
Cohesion: 0.10
Nodes (25): IntakeBinding, intakeEnumeration(), intakeJql(), intakeMembership(), projectListScope(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt() (+17 more)

### Community 32 - "sanitize"
Cohesion: 0.07
Nodes (40): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+32 more)

### Community 33 - "Goals.tsx"
Cohesion: 0.14
Nodes (20): CTOReview(), goalState, DailyCTO(), GoalHistory(), load(), reportDate(), reviewStatus, GoalList() (+12 more)

### Community 34 - "CEC"
Cohesion: 0.15
Nodes (21): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+13 more)

### Community 35 - "index.tsx"
Cohesion: 0.08
Nodes (31): FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), send(), phases, LinkedFeatures(), ButtonLayout (+23 more)

### Community 36 - "scheduled-work.ts"
Cohesion: 0.09
Nodes (38): freshOwnershipRead(), deliverySlot(), verifiedCloseoutCleanupRequest(), withAmendmentOwnership(), metadataRequestResolved(), preparationRequestResolved(), gateFeatureWork(), requestPriority() (+30 more)

### Community 37 - "scheduler.ts"
Cohesion: 0.29
Nodes (10): systemClock, fifo(), Scheduler, selectWork(), admitsWork(), canDispatch(), deliveryOccupied(), foreignWork() (+2 more)

### Community 38 - "closeout-recovery.ts"
Cohesion: 0.11
Nodes (44): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+36 more)

### Community 39 - "api-routes.ts"
Cohesion: 0.24
Nodes (13): implementationContinuationRoute(), qaPlanRetryRoute(), goalHistory(), apiRoute(), RequestContext, fileResponse(), json(), staticRoute() (+5 more)

### Community 40 - "remove-candidate.ts"
Cohesion: 0.18
Nodes (18): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot() (+10 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.13
Nodes (30): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), server_telemetry_billable_work_issue_key, isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence() (+22 more)

### Community 42 - "node-visuals.ts"
Cohesion: 0.20
Nodes (13): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+5 more)

### Community 43 - "run-accounting.ts"
Cohesion: 0.10
Nodes (34): helperTelemetry(), assignmentSubject(), dispatchExposure(), BoundedRead, done(), readBoundedNoFollow(), reasonOf(), EvidenceOutcome (+26 more)

### Community 44 - "ownedPath"
Cohesion: 0.11
Nodes (30): GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles(), ContinuationIO (+22 more)

### Community 45 - "executeRequest"
Cohesion: 0.08
Nodes (3): coordination(), Coordinator, executeRequest()

### Community 46 - "OfficeScene.tsx"
Cohesion: 0.18
Nodes (31): Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk(), ElevatorStage() (+23 more)

### Community 47 - "Engine"
Cohesion: 0.10
Nodes (5): correlatedBuild(), Engine, observe(), observeParked(), parkedReadError

### Community 48 - "dependency-bots/adopt.ts"
Cohesion: 0.15
Nodes (25): Execute, adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR, inPickupLane() (+17 more)

### Community 49 - "demand-facts.ts"
Cohesion: 0.11
Nodes (24): clip(), DEMAND_LIMIT, demandFacts(), DemandSection, key(), LessonKey, notes(), withDemand() (+16 more)

### Community 50 - "http/commands.ts"
Cohesion: 0.16
Nodes (22): requestQAPlanRetry(), bindDiscoveryResume(), DiscoveryResumeInput, scopeNote(), enqueueMetadataRecovery(), normalizeStatement(), declineLessonIssue(), reactivateLesson() (+14 more)

### Community 51 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 52 - "move-lane.ts"
Cohesion: 0.09
Nodes (30): Lane, MOVABLE, moveLane(), ProjectProgress, candidateIdentity(), candidateSlug(), createCandidate(), Execute (+22 more)

### Community 53 - "conversations/slack.ts"
Cohesion: 0.19
Nodes (12): SlackRequestSchema, SlackResultSchema, SlackVerificationSchema, interruptAdoptions(), legacy(), REMOVED_FIELDS, retireLegacyRecovery(), goalNoticeAuthorized() (+4 more)

### Community 54 - "work.ts"
Cohesion: 0.15
Nodes (16): ProjectReadiness, AssignmentResult, BlockedCause, CompletionCondition, DeliveryAdmission, DependencyObservation, EligibilityState, FailureCategory (+8 more)

### Community 55 - "weekly-rollup.ts"
Cohesion: 0.12
Nodes (29): learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), RollupResult (+21 more)

### Community 56 - "shared.ts"
Cohesion: 0.08
Nodes (24): completedPRReviews(), ContinuationDecision, eligible(), mergedByOwner(), ownerSettles(), retireExternalDeliveries(), settledExternalRepair(), OfficeQAReport (+16 more)

### Community 57 - "TimeBook.tsx"
Cohesion: 0.09
Nodes (43): CostCompleteness, TelemetryReport, TelemetryRow, UsageCompleteness, UsageSource, ValuationSource, AzureBuild, src_shared_liveanchor (+35 more)

### Community 58 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (10): ref_react_three_drei, ref_react_three_fiber, ref_three_stdlib, CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility (+2 more)

### Community 59 - "store.ts"
Cohesion: 0.17
Nodes (14): ref_node_sqlite, DATA, sanitizeObject(), applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, comparable() (+6 more)

### Community 60 - "retrospective-subject.ts"
Cohesion: 0.19
Nodes (15): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+7 more)

### Community 61 - "run.ts"
Cohesion: 0.13
Nodes (24): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, syncInvestigations(), OFFICE_FIX_PROMPT (+16 more)

### Community 62 - "assignment-poll.ts"
Cohesion: 0.11
Nodes (28): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice() (+20 more)

### Community 63 - "verifyRepairCandidate"
Cohesion: 0.17
Nodes (24): removeAdoptedClone(), activeEffectId(), stoppedBaseCheckout(), assertStoppedBaseApproach(), stoppedBaseNextStage(), adoptedReviewCandidate(), ciCheckout(), finishCISetup() (+16 more)

### Community 64 - "ticket-evidence.ts"
Cohesion: 0.19
Nodes (21): assetDownloader(), attachmentKind(), evidenceDirectory(), readEvidence(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS (+13 more)

### Community 65 - "harness-baseline.ts"
Cohesion: 0.15
Nodes (20): baselineReport, BaselineSource, baselineText(), millions(), row(), share(), add(), BaselineState (+12 more)

### Community 66 - "agents.ts"
Cohesion: 0.05
Nodes (60): implementationWorkerContext(), cecPrompt(), resolvedDecisionNote(), stageInstructions, reviewedPlanGuidance, reviewedPlanGuideDigest, CECReadbackSchema, READBACK_OWNER_SCOPE (+52 more)

### Community 67 - "ControlStore"
Cohesion: 0.15
Nodes (7): DailyCTO, dailyReviewPrompt(), Briefing, saveReviewBriefing(), ControlStore, OfficeKnowledge, DailyCTOReport

### Community 68 - "digest"
Cohesion: 0.13
Nodes (24): continueOwnershipRead(), expiredOwnershipRead(), handoffOwnership(), ReadbackOwnerDecision, ownershipReadGate(), ownershipReadState(), ownershipReadHistory(), ownershipReadSource() (+16 more)

### Community 69 - "JiraIssuePublisher"
Cohesion: 0.29
Nodes (3): JiraIssuePublisher, keyOf(), publicationDescription()

### Community 70 - "constellation-runtime.ts"
Cohesion: 0.10
Nodes (22): ref_3d_force_graph, ref_three, CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point (+14 more)

### Community 71 - "process.ts"
Cohesion: 0.13
Nodes (19): Event, one(), prePushRejection(), PushIdentity, Candidate, recordedPush(), settledPushBoundary(), inactivityWatch() (+11 more)

### Community 72 - "tracking-issue.ts"
Cohesion: 0.22
Nodes (16): readBackOrThrow(), ensureTrackingIssue(), findTrackingIssue(), ownTracking(), TrackingIssue, trackingIssueBody(), trackingIssueTitle(), trackingMarker() (+8 more)

### Community 73 - "report.ts"
Cohesion: 0.15
Nodes (20): telemetryRoute(), TelemetrySync, ConfirmedSegment, LiveAnchor, ObservationGap, SnapshotOrdering, TimeLedgerState, Acc (+12 more)

### Community 74 - "it-specialist.ts"
Cohesion: 0.14
Nodes (16): ITContext, informationalRecovery(), publishITReport(), delays, recoverAttempt(), listenerHealth(), providers, ProviderStatusChecks (+8 more)

### Community 75 - "admit-improvement.ts"
Cohesion: 0.25
Nodes (13): improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker(), improvementProvider() (+5 more)

### Community 76 - ".save"
Cohesion: 0.18
Nodes (3): comparableSlackText(), SlackMessages, sendGoalNotice()

### Community 77 - "daily-cto.ts"
Cohesion: 0.06
Nodes (49): GitHubMonitor, githubPRDescription(), collectCTOFacts(), EvidenceRequestConflict, evidenceRequestConflicts, boundedIntake(), boundedJobs(), boundedMaintenance() (+41 more)

### Community 78 - "GitHubIssuePublisher"
Cohesion: 0.19
Nodes (7): FeaturePublisher, PublicationReceipt, GitHubIssuePublisher, number(), same(), FeatureManifestItem, FeatureOperation

### Community 79 - "run-cost.ts"
Cohesion: 0.08
Nodes (31): add(), CodexRequest, CodexRollout, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens() (+23 more)

### Community 80 - "cli.ts"
Cohesion: 0.17
Nodes (8): ref_node_stream, ref_node_timers, args, [cmd,...rawArgs], commands, key, projectIndex, PORT

### Community 81 - "lesson-selection.ts"
Cohesion: 0.14
Nodes (20): INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), MAINTENANCE, MAX_LESSONS, normalPath() (+12 more)

### Community 82 - "ref_node_path"
Cohesion: 0.08
Nodes (50): ref_node_crypto, ref_node_fs, ref_node_os, ref_node_path, ref_node_util, candidateBranchMoved(), drainDelivery(), resume() (+42 more)

### Community 83 - ".transaction"
Cohesion: 0.13
Nodes (21): diagnosticProof(), recoverDiscovery(), publishFeature(), reconcilePublication(), uncertainPublications(), reserveIdentity(), GitHubOperations, admitImprovement() (+13 more)

### Community 84 - "work-summary.ts"
Cohesion: 0.20
Nodes (19): deliveryRepairProjection(), ACTIVE, maintenanceUpdate(), PMQueueItem, pmQueueItems(), deliveryChanges(), following, phases (+11 more)

### Community 85 - "ledger.ts"
Cohesion: 0.28
Nodes (10): server_it_investigations_accepted_completion_resolution, server_it_investigations_accepted_completion_resolution_acceptedcompletionresolution, ctoReplacementResolution(), finishedSubjectResolution(), implementationReplacementResolution(), investigationResolution(), NOTIFY_HELPER, notifyHelperResolution() (+2 more)

### Community 86 - "recovery-ledger.ts"
Cohesion: 0.25
Nodes (11): savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), diagnosticSnapshot(), investigationCandidates(), investigationId(), investigationFollowUps() (+3 more)

### Community 87 - "index.ts"
Cohesion: 0.11
Nodes (19): ref_hono_node_server, ref_node_http, ref_vite, close(), config, itSpecialist, loadedRevision, offices (+11 more)

### Community 88 - "ScheduledWork"
Cohesion: 0.27
Nodes (3): ScheduledWork, withAssignment(), QueueTiming

### Community 89 - "merge-scanner-retry.ts"
Cohesion: 0.40
Nodes (9): officeMergeProvenance(), reconcileMergeScannerRetry(), Retry, retryMergeScanner(), retryReadBack(), runIdentity(), savedRetry(), transientScannerJobs() (+1 more)

### Community 90 - "delivery-repairs.ts"
Cohesion: 0.12
Nodes (38): parksInJira(), ownReceipts(), run(), publicationEvidenceGap(), qaEvidenceGap(), resultGate(), stageResultGap(), namedRepairIds() (+30 more)

### Community 91 - ".emit"
Cohesion: 0.15
Nodes (13): reconcileNoticeConfirmations(), dependencyCompletionKey(), brainCheckpointCompletion(), reconcileCompletedCheckpoints(), legacy, reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS (+5 more)

### Community 92 - "TicketJob"
Cohesion: 0.10
Nodes (18): restartStoppedWriters(), unchangedSinceAccepted(), Execute, SalvageRetry, salvageWorktree(), DECISION_KINDS, StageContext, GitHubDelivery (+10 more)

### Community 93 - "extraction.ts"
Cohesion: 0.18
Nodes (10): ref_node_child_process, ref_node_string_decoder, extractDocument, Extraction, Extractor, GIT_NETWORK, LIVE_PROVIDERS, liveReach() (+2 more)

### Community 94 - "features.ts"
Cohesion: 0.12
Nodes (33): dispatchNightly(), eligibility(), assertFeatureGate(), bindFeature(), currentApproval(), featureGate(), predecessorComplete(), recoveryHeld() (+25 more)

### Community 95 - "capture-session-clone.py"
Cohesion: 0.15
Nodes (10): ctypes, errno, importlib_util, json, os, pathlib, Copy a coherent macOS clone of inherited reader fd3 to anonymous target fd4. No…, Read-only protocol adapter for the installed review helper. No model dispatch. (+2 more)

### Community 96 - "preferences-store.ts"
Cohesion: 0.19
Nodes (9): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS (+1 more)

### Community 97 - "OfficeSnapshot"
Cohesion: 0.07
Nodes (56): ADOPTION_STALLED_MS, projectOutbox(), knowledgeOutbox(), checkpointSuperseded(), Conversation(), send(), SendMessage, LessonDecisionAction (+48 more)

### Community 98 - "park-ticket.ts"
Cohesion: 0.18
Nodes (29): jiraCollection(), BLOCKED, findComment(), LiveIssue, readIssue(), readIssues(), Execute, jira() (+21 more)

### Community 99 - "scope-repair-resume.ts"
Cohesion: 0.32
Nodes (13): containedFile(), Ownership, reconcileScopeRepairReadback(), scopeRepairRequestResolved(), assertScopeRepairResumeFindings(), certain(), effects(), originalClaim() (+5 more)

### Community 100 - "Clock"
Cohesion: 0.18
Nodes (7): Clock, checkpointMeasurement(), HEARTBEAT_GAP_MS, HEARTBEAT_MS, startMeasurement(), WorkOutcome, ExecutionLane

### Community 101 - "local-config.ts"
Cohesion: 0.26
Nodes (12): AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), FeaturePlanningBindings, goalEvidencePath(), OfficeConfigInputs, officeConfigRoute(), officeConfigSummary(), CECBinding (+4 more)

### Community 102 - "time-readback.ts"
Cohesion: 0.29
Nodes (7): TimeLedger, dueReadback(), Readback, READBACK_INTERVAL_MS, readBackTime(), SETTLE_MS, TimePublication

### Community 103 - "agent-activity.ts"
Cohesion: 0.23
Nodes (10): itAgent(), itDiagnostics(), displayAgentTask(), githubStageLabels, withoutElapsed(), LiveAgentTask(), Props, RunningTask() (+2 more)

### Community 104 - "offices.ts"
Cohesion: 0.13
Nodes (8): QuestionNotifications, leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), DELIVERY_CONCURRENCY, Offices, markCaptureStart()

### Community 105 - "extract-worker.mjs"
Cohesion: 0.43
Nodes (6): ref_mammoth, ref_pdfjs_dist, bounded(), extract(), fail(), [path,kind]

### Community 106 - "diagnostic-context.ts"
Cohesion: 0.29
Nodes (6): itChatPrompt(), assignmentDiagnostics(), diagnosticContext(), DailyCTOSummary, currentServices(), HealthReport

### Community 107 - "blocker-followups.ts"
Cohesion: 0.21
Nodes (17): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), readBackConversations(), handoff(), reconcileBlockerFollowups(), improvementIntakeGate() (+9 more)

### Community 108 - "office/readiness.ts"
Cohesion: 0.36
Nodes (6): BLOCKED_CAUSES, blockedCauses(), projectReadiness(), ProgressionItem, src_shared_progressionitem, src_shared_projectreadiness

### Community 109 - "stopped-base-provider.ts"
Cohesion: 0.38
Nodes (8): pinCourier, pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), discussion(), pages(), pullIdentity(), readStoppedBaseProviderContext(), reviewThreads()

### Community 110 - "setup-stop-cap.ts"
Cohesion: 0.60
Nodes (4): confirmSetupStopCap(), consecutiveSetupStops(), SETUP_STOP_CAP, setupStop()

### Community 111 - "stage-prompts.ts"
Cohesion: 0.31
Nodes (8): stagePrompt(), StagePromptInput, METADATA_FINDING_GUIDANCE, conflictApprovalGuidance(), officeValidation(), BROWSER_QA_LIMIT_MS, qaTimeLimit(), qaTimeLimitGuidance()

### Community 113 - "delivery-ownership.ts"
Cohesion: 0.33
Nodes (5): ref_node_async_hooks, Ownership, ownershipContext, refreshDeliveryOwnership(), RefreshOwnership

### Community 114 - "evidence-digest.ts"
Cohesion: 0.44
Nodes (7): canonical(), evidenceDigest(), evidenceHash(), semantic(), stableUrl(), requirementDrift(), RequirementPostimage

### Community 115 - "read-retries.ts"
Cohesion: 0.44
Nodes (6): ATTEMPT_DELAYS_MS, classifyStop(), stopReason(), incompleteReadOutput(), planReadRetry(), temporaryReadFailure()

### Community 118 - "qa-plan-retry.ts"
Cohesion: 0.67
Nodes (3): QAPlanRetry, QAPlanRetryProof, QAPlanRetryRequest

## Knowledge Gaps
- **493 isolated node(s):** `base`, `delays`, `ButtonProps`, `People`, `OrgTree` (+488 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 636 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `github/issue-publication.ts`, `review-run.ts`, `requests.ts`, `session-bridge.ts`, `artifact`, `worker-runtime.ts`, `github-delivery.ts`, `authorize.ts`, `assignments.ts`, `scheduled-captures.ts`, `run-retrospective.ts`, `record-trigger.ts`, `continuation-evidence.ts`, `preparation-readback.ts`, `features/commands.ts`, `github-readiness.ts`, `coordination.ts`, `engine.ts`, `cost-ledger.ts`, `ref_zod`, `cec/issue-publication.ts`, `jira-time.ts`, `metadata-assessment.ts`, `cec-reads.ts`, `sanitize`, `CEC`, `scheduled-work.ts`, `scheduler.ts`, `closeout-recovery.ts`, `api-routes.ts`, `remove-candidate.ts`, `time-scope.ts`, `run-accounting.ts`, `ownedPath`, `dependency-bots/adopt.ts`, `demand-facts.ts`, `http/commands.ts`, `move-lane.ts`, `conversations/slack.ts`, `weekly-rollup.ts`, `shared.ts`, `store.ts`, `retrospective-subject.ts`, `run.ts`, `assignment-poll.ts`, `verifyRepairCandidate`, `ticket-evidence.ts`, `agents.ts`, `digest`, `process.ts`, `tracking-issue.ts`, `report.ts`, `it-specialist.ts`, `admit-improvement.ts`, `.save`, `daily-cto.ts`, `lesson-selection.ts`, `ref_node_path`, `.transaction`, `ledger.ts`, `recovery-ledger.ts`, `ScheduledWork`, `delivery-repairs.ts`, `.emit`, `TicketJob`, `features.ts`, `OfficeSnapshot`, `park-ticket.ts`, `scope-repair-resume.ts`, `Clock`, `time-readback.ts`, `agent-activity.ts`, `offices.ts`, `diagnostic-context.ts`, `blocker-followups.ts`, `stopped-base-provider.ts`, `stage-prompts.ts`, `read-retries.ts`?**
  _High betweenness centrality (0.100) - this node is a cross-community bridge._
- **Why does `Role` connect `worker-runtime.ts` to `PeoplePanel.tsx`, `Inspector.tsx`, `github-delivery.ts`, `App.tsx`, `github-readiness.ts`, `engine.ts`, `cec-reads.ts`, `sanitize`, `scheduler.ts`, `run-accounting.ts`, `OfficeScene.tsx`, `http/commands.ts`, `scene-motion.ts`, `move-lane.ts`, `work.ts`, `shared.ts`, `store.ts`, `retrospective-subject.ts`, `agents.ts`, `delivery-repairs.ts`, `.emit`, `TicketJob`, `OfficeSnapshot`, `agent-activity.ts`, `diagnostic-context.ts`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `Offices` connect `offices.ts` to `it-specialist.ts`, `index.ts`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **What connects `base`, `delays`, `ButtonProps` to the rest of the system?**
  _493 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Button` be split into smaller, more focused modules?**
  _Cohesion score 0.13046757164404224 - nodes in this community are weakly interconnected._
- **Should `PeoplePanel.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10815602836879433 - nodes in this community are weakly interconnected._
- **Should `review-run.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13535353535353536 - nodes in this community are weakly interconnected._