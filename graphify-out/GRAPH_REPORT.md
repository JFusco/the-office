# Graph Report - the-office  (2026-11-16)

## Corpus Check
- 837 files · ~330,667 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4090 nodes · 18828 edges · 107 communities (105 shown, 2 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 608 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `18f278f1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- mutedCopy
- PeoplePanel.tsx
- dependency-bots/adopt.ts
- .transaction
- Inspector.tsx
- requests.ts
- session-bridge.ts
- ref_react
- agents.ts
- Store
- worker-runtime.ts
- shared.ts
- App.tsx
- features/workflow.ts
- reader.ts
- enrollment-gate.ts
- run-retrospective.ts
- record-trigger.ts
- assignment-poll.ts
- workKey
- config.ts
- github-delivery.ts
- index.tsx
- dependencies.ts
- lessons-view.ts
- maintenance/maintenance.ts
- cost-ledger.ts
- artifact
- jira-operations.ts
- jira-time.ts
- digest
- owned-artifact.ts
- conversations/conversations.ts
- Conversation.tsx
- azure.ts
- StageResult
- scheduled-work.ts
- scheduler.ts
- closeout-recovery.ts
- QAResultsCard.tsx
- remove-candidate.ts
- time-scope.ts
- atmosphere.ts
- run-accounting.ts
- intent.ts
- Coordinator
- OfficeScene.tsx
- engine.ts
- pilot-delivery.ts
- knowledge.ts
- .emit
- scene-motion.ts
- validate-stage.ts
- codex-rollout.ts
- work.ts
- weekly-rollup.ts
- github-context.ts
- TimeBook.tsx
- RoomCamera.tsx
- store.ts
- retrospective-subject.ts
- run.ts
- conversations/slack.ts
- TicketJob
- ticket-evidence.ts
- harness-baseline.ts
- QuestionStepper.tsx
- daily-cto.ts
- continue-unsealed-qa.ts
- JiraIssuePublisher
- constellation-runtime.ts
- process.ts
- Offices
- report.ts
- CEC
- admit-improvement.ts
- time-readback.ts
- work-summary.ts
- Effects
- telemetry.ts
- cli.ts
- lesson-selection.ts
- inspect-closed-plan.ts
- office/readiness.ts
- outbox.ts
- projects.ts
- it-specialist.ts
- index.ts
- delivery-ownership.ts
- evidence-digest.ts
- cec/workflow.ts
- highestStableAtLeast
- extraction.ts
- features.ts
- capture-session-clone.py
- OfficeSnapshot
- .save
- retire-history.ts
- ledger.ts
- stopped-base-validation.ts
- extract-worker.mjs
- coordination.ts
- prompts/conversations.ts
- resume-reconciliation.ts
- command-registry.ts
- pre-push-boundary.ts

## God Nodes (most connected - your core abstractions)
1. `Store` - 367 edges
2. `TicketJob` - 172 edges
3. `digest()` - 150 edges
4. `GitHubDelivery` - 116 edges
5. `command()` - 116 edges
6. `artifact()` - 114 edges
7. `workKey()` - 96 edges
8. `OfficeSnapshot` - 88 edges
9. `currentAssignment()` - 88 edges
10. `cx()` - 88 edges

## Surprising Connections (you probably didn't know these)
- `Admission` --references--> `AssignmentReview`  [EXTRACTED]
  server/delivery/intake/admission.ts → src/shared.ts
- `LessonBrainOverlap` --references--> `Lesson`  [EXTRACTED]
  server/knowledge/lesson-brain-audit.ts → src/contracts/knowledge.ts
- `apply()` --indirect_call--> `note()`  [INFERRED]
  src/conversations/OutboxSavedImplementation.tsx → server/cec/parking/resume-parked.ts
- `StagePromptInput` --references--> `TicketJob`  [EXTRACTED]
  server/delivery/pipeline/stage-prompts.ts → src/shared.ts
- `ScopePreview` --references--> `WorkTime`  [EXTRACTED]
  server/time/time-scope.ts → src/shared.ts

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

## Communities (107 total, 2 thin omitted)

### Community 0 - "mutedCopy"
Cohesion: 0.16
Nodes (31): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS, PickupForm(), acceptPreferences() (+23 more)

### Community 1 - "PeoplePanel.tsx"
Cohesion: 0.12
Nodes (35): Department, DEPARTMENTS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS, Directory() (+27 more)

### Community 2 - "dependency-bots/adopt.ts"
Cohesion: 0.10
Nodes (42): Execute, readBackOrThrow(), adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR (+34 more)

### Community 3 - ".transaction"
Cohesion: 0.10
Nodes (36): featureItemComplete(), reconcileFeatureCompletion(), readEvidence(), helperTelemetry(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS, reserveReplacement() (+28 more)

### Community 4 - "Inspector.tsx"
Cohesion: 0.11
Nodes (64): SendMessage, blockedSummary(), itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps(), ServiceHealthPanel(), followUp() (+56 more)

### Community 5 - "requests.ts"
Cohesion: 0.05
Nodes (76): ATTEMPT_DELAYS_MS, nextAttemptAt(), restartStoppedWriters(), unchangedSinceAccepted(), NOT_RETRYABLE, WRITER_STAGES, writerRestartCandidate, writerRestarted() (+68 more)

### Community 6 - "session-bridge.ts"
Cohesion: 0.05
Nodes (58): ref_node_perf_hooks, ref_node_url, ref_ws, file, folder, logs, root, claudeSessionContext() (+50 more)

### Community 7 - "ref_react"
Cohesion: 0.07
Nodes (60): ref_react, ref_react_markdown, ref_remark_gfm, ref_yaml, KnowledgeActivity, KnowledgeEdge, KnowledgeMap, KnowledgeNode (+52 more)

### Community 8 - "agents.ts"
Cohesion: 0.07
Nodes (46): ref_zod, implementationWorkerContext(), cecPrompt(), resolvedDecisionNote(), stageInstructions, qaRunDirectory(), CECReadbackSchema, READBACK_OWNER_SCOPE (+38 more)

### Community 9 - "Store"
Cohesion: 0.11
Nodes (6): GitHubFeaturePublisher, JiraFeaturePublisher, FeatureReviewRunner, Store, command(), OfficeEvent

### Community 10 - "worker-runtime.ts"
Cohesion: 0.05
Nodes (49): candidateWorkspaceEnvironment(), server_delivery_harness_delivery_authority_resolvedeliverywork, assignmentSubject(), dispatchExposure(), prepareExposure(), lessonPurpose(), LessonSelection, catalogLine() (+41 more)

### Community 11 - "shared.ts"
Cohesion: 0.05
Nodes (42): seedProjectLessons(), GoalInput, saveGoal(), queueGoalNotice(), BrainStatusSchema, coverageSchema, followupSchema, verified (+34 more)

### Community 12 - "App.tsx"
Cohesion: 0.06
Nodes (51): ref_lucide_react, ref_motion, ref_react_dom, itAgent(), itDiagnostics(), BrainDrawer(), themeColor, App() (+43 more)

### Community 13 - "features/workflow.ts"
Cohesion: 0.07
Nodes (57): approveFeature(), featureById(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), discoveryPrompt(), planPrompt() (+49 more)

### Community 14 - "reader.ts"
Cohesion: 0.08
Nodes (39): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, CommittedBrain (+31 more)

### Community 15 - "enrollment-gate.ts"
Cohesion: 0.13
Nodes (50): createFeature(), approvedDelivery(), bindDelivery(), featureDeliveryContext(), featureEffectGate(), assertEnrollable(), bindFeature(), enrolled() (+42 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.09
Nodes (46): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, blockingTrigger, isBlocking(), brainOverlap (+38 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.13
Nodes (33): baselineLearning(), LEARNING_BASELINES, maintainLearning(), configureKnowledge(), clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates() (+25 more)

### Community 18 - "assignment-poll.ts"
Cohesion: 0.11
Nodes (23): channelNoticeAuthorized(), ChannelSettings, notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR, plainSlackText() (+15 more)

### Community 19 - "workKey"
Cohesion: 0.06
Nodes (72): boardPreflightCandidate(), partialLocalCleanupCandidate(), completedPRReviews(), implementationRecoveryCandidate(), candidateInput(), children, oldAdoptionBasis(), savedCandidateAdmission (+64 more)

### Community 20 - "config.ts"
Cohesion: 0.12
Nodes (29): ref_node_crypto, packedConsumerPnpmRepair(), sha256(), commandFeature(), reviewQuestions(), applyHarnessAction(), HarnessActionInput, recoveryPreconditions() (+21 more)

### Community 21 - "github-delivery.ts"
Cohesion: 0.05
Nodes (72): containedFile(), writerRestartInstruction(), ProjectProgress, findingsBlock(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery() (+64 more)

### Community 22 - "index.tsx"
Cohesion: 0.08
Nodes (33): FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), send(), phases, LinkedFeatures(), buttonClasses() (+25 more)

### Community 23 - "dependencies.ts"
Cohesion: 0.09
Nodes (34): reconcileNoticeConfirmations(), deliveryIntakeBlocker(), Admission, admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, compatible() (+26 more)

### Community 24 - "lessons-view.ts"
Cohesion: 0.13
Nodes (17): CONSOLIDATED, CONSOLIDATED_AT, SEEDS, SEEDS, OfficeProposal, RetrospectiveRecord, WeeklyRollup, lessonsView (+9 more)

### Community 25 - "maintenance/maintenance.ts"
Cohesion: 0.08
Nodes (35): maintenancePolicies(), captureLearning(), learningDigest(), recordLearningOpportunity(), expireLearningPackets(), packetReferences(), captureMaintenanceStep(), reconcileNativeDelivery() (+27 more)

### Community 26 - "cost-ledger.ts"
Cohesion: 0.15
Nodes (27): captureCost(), server_telemetry_cost_entries_costcoveragesummary, costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId() (+19 more)

### Community 27 - "artifact"
Cohesion: 0.06
Nodes (118): ref_node_os, recordJobApproach(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash (+110 more)

### Community 28 - "jira-operations.ts"
Cohesion: 0.25
Nodes (10): CommentPage, commentReadback(), JiraOperations, plain(), jiraRecord(), unpack(), metadataDigest(), verifiedTransition() (+2 more)

### Community 29 - "jira-time.ts"
Cohesion: 0.14
Nodes (20): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+12 more)

### Community 30 - "digest"
Cohesion: 0.11
Nodes (51): ref_node_util, interruptedImplementation(), ownershipReadHistory(), activeEffectId(), retryRead(), admitPRMetadata(), assessPRMetadata(), captureAssessment() (+43 more)

### Community 31 - "owned-artifact.ts"
Cohesion: 0.24
Nodes (13): investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_SOURCE_PATHS, officeSource(), done(), readBoundedNoFollow() (+5 more)

### Community 32 - "conversations/conversations.ts"
Cohesion: 0.10
Nodes (25): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+17 more)

### Community 33 - "Conversation.tsx"
Cohesion: 0.14
Nodes (25): Conversation(), LessonDecisionAction, lessonDecisionState(), readLessonDecision(), OutboxLessonDecision(), act(), readStatus(), slackMessageStatus() (+17 more)

### Community 34 - "azure.ts"
Cohesion: 0.10
Nodes (31): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+23 more)

### Community 35 - "StageResult"
Cohesion: 0.11
Nodes (42): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), ProjectCard, projectCards(), projectGraphql() (+34 more)

### Community 36 - "scheduled-work.ts"
Cohesion: 0.10
Nodes (37): freshOwnershipRead(), deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), withAmendmentOwnership(), metadataRequestResolved(), preparationRequestResolved(), gateFeatureWork() (+29 more)

### Community 37 - "scheduler.ts"
Cohesion: 0.12
Nodes (16): ROLES, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch(), deliveryOccupied() (+8 more)

### Community 38 - "closeout-recovery.ts"
Cohesion: 0.11
Nodes (39): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+31 more)

### Community 39 - "QAResultsCard.tsx"
Cohesion: 0.40
Nodes (7): qaResultChanges(), QA_STAGES, qaResults(), qaStatus(), artifact(), QAResultsCard(), Report()

### Community 40 - "remove-candidate.ts"
Cohesion: 0.18
Nodes (18): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot() (+10 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.12
Nodes (32): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), server_telemetry_billable_work_issue_key, isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence() (+24 more)

### Community 42 - "atmosphere.ts"
Cohesion: 0.38
Nodes (8): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), domainAnchor(), stableHash(), stablePosition()

### Community 43 - "run-accounting.ts"
Cohesion: 0.13
Nodes (26): BoundedRead, CompletionReader, codexHome(), createdAt(), dayDirs(), header(), readCodexRollout(), ROLLOUT_MAX_BYTES (+18 more)

### Community 44 - "intent.ts"
Cohesion: 0.11
Nodes (27): GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles(), ContinuationIO (+19 more)

### Community 45 - "Coordinator"
Cohesion: 0.08
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 46 - "OfficeScene.tsx"
Cohesion: 0.16
Nodes (34): withoutElapsed(), Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk() (+26 more)

### Community 47 - "engine.ts"
Cohesion: 0.07
Nodes (12): correlatedBuild(), requestMail(), enableNightly(), GitHubMonitor, drainMaintenance(), reconcileMaintenance(), requestMaintenance(), Engine (+4 more)

### Community 48 - "pilot-delivery.ts"
Cohesion: 0.10
Nodes (30): candidateBranchMoved(), dispatchNightly(), drainDelivery(), requestDelivery(), resume(), startPilot(), Document, isAccessOnlyPlan() (+22 more)

### Community 49 - "knowledge.ts"
Cohesion: 0.08
Nodes (34): clip(), DEMAND_LIMIT, demandFacts(), key(), LessonKey, notes(), assignmentLookups, Binding (+26 more)

### Community 50 - ".emit"
Cohesion: 0.13
Nodes (28): decideImplementation(), requestQAPlanRetry(), configureChannelNotices(), configureNotices(), retryRecipientLookup(), recoverCTOInput(), enqueueMetadataRecovery(), normalizeStatement() (+20 more)

### Community 51 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 52 - "validate-stage.ts"
Cohesion: 0.15
Nodes (19): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+11 more)

### Community 53 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 54 - "work.ts"
Cohesion: 0.13
Nodes (21): classifyStop(), stopReason(), incompleteReadOutput(), IntakeResult, planReadRetry(), temporaryReadFailure(), ProjectReadiness, AssignmentResult (+13 more)

### Community 55 - "weekly-rollup.ts"
Cohesion: 0.08
Nodes (39): learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), BRAIN_SCOPE (+31 more)

### Community 56 - "github-context.ts"
Cohesion: 0.10
Nodes (42): resumeProviderReviews(), observe(), checksFailed(), checksPassed(), checksPending(), CurrentChecksWait, currentMergeChecks(), pass() (+34 more)

### Community 57 - "TimeBook.tsx"
Cohesion: 0.16
Nodes (25): TelemetryReport, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens(), usd(), KpiTiles() (+17 more)

### Community 58 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (10): ref_react_three_drei, ref_react_three_fiber, ref_three_stdlib, CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility (+2 more)

### Community 59 - "store.ts"
Cohesion: 0.12
Nodes (20): ref_node_sqlite, Clock, DATA, applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, comparable() (+12 more)

### Community 60 - "retrospective-subject.ts"
Cohesion: 0.14
Nodes (21): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+13 more)

### Community 61 - "run.ts"
Cohesion: 0.17
Nodes (16): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, OFFICE_FIX_PROMPT, OfficeFixResult, validateOfficeFix(), investigationReady(), requeueInvestigationEvidence(), InvestigationOptions (+8 more)

### Community 62 - "conversations/slack.ts"
Cohesion: 0.13
Nodes (11): comparableSlackText(), SlackMessages, SlackRequestSchema, SlackResultSchema, SlackVerificationSchema, goalNoticeAuthorized(), maintenanceNoticeAuthorized(), bindGitHubQA() (+3 more)

### Community 63 - "TicketJob"
Cohesion: 0.07
Nodes (57): ref_node_fs, ref_node_path, removeAdoptedClone(), namedRepairIds(), pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), StageContext, GitHubDelivery (+49 more)

### Community 64 - "ticket-evidence.ts"
Cohesion: 0.20
Nodes (17): attachmentKind(), evidenceDirectory(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS, EvidenceAttachment, EvidenceReadContext (+9 more)

### Community 65 - "harness-baseline.ts"
Cohesion: 0.15
Nodes (20): baselineReport, BaselineSource, baselineText(), millions(), row(), share(), add(), BaselineState (+12 more)

### Community 66 - "QuestionStepper.tsx"
Cohesion: 0.19
Nodes (18): FeatureQuestionProjection, OutboxQuestionRound(), send(), draftKey(), readDraft(), saveDraft(), QuestionRound(), nextQuestion() (+10 more)

### Community 67 - "daily-cto.ts"
Cohesion: 0.06
Nodes (44): leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), collectCTOFacts(), DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts (+36 more)

### Community 68 - "continue-unsealed-qa.ts"
Cohesion: 0.18
Nodes (17): continueOwnershipRead(), entry(), expiredOwnershipRead(), handoffOwnership(), ReadbackOwnerDecision, ownershipReadGate(), ownershipReadState(), ownershipReadSource() (+9 more)

### Community 69 - "JiraIssuePublisher"
Cohesion: 0.24
Nodes (5): JiraIssuePublisher, keyOf(), descriptionPreimage(), plain(), publicationDescription()

### Community 70 - "constellation-runtime.ts"
Cohesion: 0.09
Nodes (22): ref_3d_force_graph, ref_three, CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point (+14 more)

### Community 71 - "process.ts"
Cohesion: 0.21
Nodes (13): inactivityWatch(), At, errno, GroupInventory, GroupProbe, LifecycleDiagnostic, Phase, Pid (+5 more)

### Community 73 - "report.ts"
Cohesion: 0.29
Nodes (12): Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked(), row() (+4 more)

### Community 74 - "CEC"
Cohesion: 0.11
Nodes (22): syncOutbox(), projectSlackDeliveries(), settleRequestedSlackReplacement(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint(), slackRequestSettled() (+14 more)

### Community 75 - "admit-improvement.ts"
Cohesion: 0.22
Nodes (16): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+8 more)

### Community 76 - "time-readback.ts"
Cohesion: 0.36
Nodes (5): TimeLedger, Readback, READBACK_INTERVAL_MS, readBackTime(), SETTLE_MS

### Community 77 - "work-summary.ts"
Cohesion: 0.10
Nodes (35): displayAgentTask(), LiveAgentTask(), Props, RunningTask(), text(), AzureBuild, src_shared_liveanchor, lastWall (+27 more)

### Community 78 - "Effects"
Cohesion: 0.08
Nodes (28): Assignment, Content, jiraText(), Transition, FeaturePublisher, PublicationReceipt, publishFeature(), GitHubOperations (+20 more)

### Community 79 - "telemetry.ts"
Cohesion: 0.09
Nodes (28): CodexRollout, CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL (+20 more)

### Community 80 - "cli.ts"
Cohesion: 0.17
Nodes (10): ref_node_stream, ref_node_timers, args, [cmd,...rawArgs], commands, key, projectIndex, lessonBrainAudit (+2 more)

### Community 81 - "lesson-selection.ts"
Cohesion: 0.17
Nodes (14): INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, MAINTENANCE, MAX_LESSONS, normalPath(), PURPOSES (+6 more)

### Community 82 - "inspect-closed-plan.ts"
Cohesion: 0.23
Nodes (9): closedReadonlyPlan(), Document, entryExists(), inspectClosedQAPlan(), reviewedPlanGuidance, reviewedPlanGuideDigest, QAPlanRetry, QAPlanRetryProof (+1 more)

### Community 83 - "office/readiness.ts"
Cohesion: 0.36
Nodes (6): BLOCKED_CAUSES, blockedCauses(), projectReadiness(), ProgressionItem, src_shared_progressionitem, src_shared_projectreadiness

### Community 84 - "outbox.ts"
Cohesion: 0.09
Nodes (34): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), ctoInputIdentityMatches(), ctoInputRecovered(), ADOPTION_STALLED_MS, conversationResolved(), projectOutbox() (+26 more)

### Community 85 - "projects.ts"
Cohesion: 0.11
Nodes (26): ref_smol_toml, IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), intakeMembership(), projectListScope(), cecIntakePrompt() (+18 more)

### Community 86 - "it-specialist.ts"
Cohesion: 0.26
Nodes (12): savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), ITContext, publishITReport(), delays, recoverAttempt() (+4 more)

### Community 87 - "index.ts"
Cohesion: 0.08
Nodes (42): ref_hono_node_server, ref_node_http, ref_vite, implementationContinuationRoute(), qaPlanRetryRoute(), assertQuestionVisibility(), close(), config (+34 more)

### Community 88 - "delivery-ownership.ts"
Cohesion: 0.33
Nodes (5): ref_node_async_hooks, Ownership, ownershipContext, refreshDeliveryOwnership(), RefreshOwnership

### Community 89 - "evidence-digest.ts"
Cohesion: 0.73
Nodes (5): canonical(), evidenceDigest(), evidenceHash(), semantic(), stableUrl()

### Community 90 - "cec/workflow.ts"
Cohesion: 0.11
Nodes (36): applyIntakeObservation(), checkMail(), drainMail(), parksInJira(), qaPlanEvidenceGap(), MISSING_INTAKE, reconcileMailbox(), unusedMailbox() (+28 more)

### Community 92 - "highestStableAtLeast"
Cohesion: 0.83
Nodes (3): compare(), highestStableAtLeast(), parts()

### Community 93 - "extraction.ts"
Cohesion: 0.18
Nodes (10): ref_node_child_process, ref_node_string_decoder, extractDocument, Extraction, Extractor, GIT_NETWORK, LIVE_PROVIDERS, liveReach() (+2 more)

### Community 94 - "features.ts"
Cohesion: 0.13
Nodes (27): currentApproval(), automaticIntakeWait(), deliveryPreflight, handoffBinding(), readHandoff(), sameBinding(), uncertainPublications(), scheduledFeatures() (+19 more)

### Community 95 - "capture-session-clone.py"
Cohesion: 0.15
Nodes (10): ctypes, errno, importlib_util, json, os, pathlib, Copy a coherent macOS clone of inherited reader fd3 to anonymous target fd4. No…, Read-only protocol adapter for the installed review helper. No model dispatch. (+2 more)

### Community 97 - "OfficeSnapshot"
Cohesion: 0.08
Nodes (42): knowledgeOutbox(), DAYS, dueLessonDecisions(), easternWeek(), LESSON_DIGEST, LessonDecision, PARTS, pendingLessonDecisions() (+34 more)

### Community 98 - ".save"
Cohesion: 0.19
Nodes (29): jiraCollection(), BLOCKED, findComment(), LiveIssue, readIssue(), readIssues(), Execute, jira() (+21 more)

### Community 100 - "retire-history.ts"
Cohesion: 0.33
Nodes (7): readHistoryScope(), historicalRecordDigest(), Intent, records(), retireIncompleteHistory(), HistoryRetirement, HistoryRetirementIntent

### Community 101 - "ledger.ts"
Cohesion: 0.26
Nodes (12): partialLocalCleanupKey(), investigationCandidates(), investigationId(), ctoReplacementResolution(), investigationFollowUps(), implementationReplacementResolution(), investigationResolution(), syncInvestigations() (+4 more)

### Community 103 - "stopped-base-validation.ts"
Cohesion: 0.42
Nodes (8): continuationNativeReview(), assertStoppedBaseApproach(), stoppedBaseNextStage(), stoppedBasePackedCommands(), assertAcceptedFiles(), assertStoppedBaseMergeReady(), assertStoppedBaseValidation(), stoppedBaseStageProof()

### Community 105 - "extract-worker.mjs"
Cohesion: 0.43
Nodes (6): ref_mammoth, ref_pdfjs_dist, bounded(), extract(), fail(), [path,kind]

### Community 106 - "coordination.ts"
Cohesion: 0.19
Nodes (17): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation(), checkpointWindow(), dueAt() (+9 more)

### Community 108 - "prompts/conversations.ts"
Cohesion: 0.09
Nodes (26): cecChatPrompt(), ctoChatPrompt(), itChatPrompt(), slackSendPrompt(), slackVerifyPrompt(), interruptAdoptions(), PICKUP_CHAT, PickupSchema (+18 more)

### Community 110 - "resume-reconciliation.ts"
Cohesion: 0.39
Nodes (6): Attempt, needsResumeReconciliation(), stoppedInSetup(), ownReceipts(), Receipt, supersededReceipt()

### Community 111 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 113 - "pre-push-boundary.ts"
Cohesion: 0.43
Nodes (5): Event, one(), prePushRejection(), PushIdentity, settledPushBoundary()

## Knowledge Gaps
- **489 isolated node(s):** `BROWSER_QA_LIMIT_MS`, `EvidenceSchema`, `ReceiptSchema`, `LegacyResultSchema`, `ResolutionSchema` (+484 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 629 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `dependency-bots/adopt.ts`, `.transaction`, `requests.ts`, `session-bridge.ts`, `agents.ts`, `worker-runtime.ts`, `shared.ts`, `features/workflow.ts`, `reader.ts`, `enrollment-gate.ts`, `run-retrospective.ts`, `record-trigger.ts`, `assignment-poll.ts`, `workKey`, `config.ts`, `github-delivery.ts`, `dependencies.ts`, `maintenance/maintenance.ts`, `cost-ledger.ts`, `artifact`, `jira-operations.ts`, `jira-time.ts`, `digest`, `owned-artifact.ts`, `conversations/conversations.ts`, `azure.ts`, `StageResult`, `scheduled-work.ts`, `scheduler.ts`, `closeout-recovery.ts`, `remove-candidate.ts`, `time-scope.ts`, `run-accounting.ts`, `intent.ts`, `engine.ts`, `pilot-delivery.ts`, `knowledge.ts`, `.emit`, `validate-stage.ts`, `work.ts`, `weekly-rollup.ts`, `github-context.ts`, `store.ts`, `retrospective-subject.ts`, `run.ts`, `conversations/slack.ts`, `TicketJob`, `ticket-evidence.ts`, `daily-cto.ts`, `continue-unsealed-qa.ts`, `Offices`, `CEC`, `admit-improvement.ts`, `time-readback.ts`, `Effects`, `lesson-selection.ts`, `inspect-closed-plan.ts`, `outbox.ts`, `projects.ts`, `it-specialist.ts`, `index.ts`, `cec/workflow.ts`, `features.ts`, `OfficeSnapshot`, `.save`, `retire-history.ts`, `ledger.ts`, `stopped-base-validation.ts`, `coordination.ts`, `prompts/conversations.ts`?**
  _High betweenness centrality (0.104) - this node is a cross-community bridge._
- **Why does `Role` connect `worker-runtime.ts` to `PeoplePanel.tsx`, `Inspector.tsx`, `agents.ts`, `shared.ts`, `App.tsx`, `github-delivery.ts`, `maintenance/maintenance.ts`, `conversations/conversations.ts`, `Conversation.tsx`, `scheduler.ts`, `run-accounting.ts`, `OfficeScene.tsx`, `.emit`, `scene-motion.ts`, `validate-stage.ts`, `work.ts`, `github-context.ts`, `store.ts`, `retrospective-subject.ts`, `conversations/slack.ts`, `TicketJob`, `Effects`, `outbox.ts`, `projects.ts`, `cec/workflow.ts`, `OfficeSnapshot`, `prompts/conversations.ts`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Why does `OfficeSnapshot` connect `OfficeSnapshot` to `mutedCopy`, `PeoplePanel.tsx`, `Inspector.tsx`, `ref_react`, `Store`, `worker-runtime.ts`, `shared.ts`, `App.tsx`, `index.tsx`, `maintenance/maintenance.ts`, `Conversation.tsx`, `azure.ts`, `QAResultsCard.tsx`, `OfficeScene.tsx`, `scene-motion.ts`, `work.ts`, `TimeBook.tsx`, `store.ts`, `harness-baseline.ts`, `daily-cto.ts`, `CEC`, `work-summary.ts`, `office/readiness.ts`, `outbox.ts`, `index.ts`, `cec/workflow.ts`, `ledger.ts`, `prompts/conversations.ts`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **What connects `BROWSER_QA_LIMIT_MS`, `EvidenceSchema`, `ReceiptSchema` to the rest of the system?**
  _489 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `PeoplePanel.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12292358803986711 - nodes in this community are weakly interconnected._
- **Should `dependency-bots/adopt.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09764309764309764 - nodes in this community are weakly interconnected._
- **Should `.transaction` be split into smaller, more focused modules?**
  _Cohesion score 0.09887005649717515 - nodes in this community are weakly interconnected._