# Graph Report - the-office  (2026-11-15)

## Corpus Check
- 841 files · ~338,836 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4150 nodes · 19358 edges · 105 communities (102 shown, 3 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 629 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `52f90b55`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- currentAssignment
- .activeClaims
- dependency-bots/adopt.ts
- github-delivery.ts
- Inspector.tsx
- TicketJob
- session-bridge.ts
- MapView.tsx
- agents.ts
- store.ts
- source-amendment-scope.ts
- index.ts
- App.tsx
- config.ts
- assignments.ts
- scheduled-captures.ts
- run-retrospective.ts
- record-trigger.ts
- worker-runtime.ts
- ref_node_path
- .transaction
- Ticket
- Role
- tracking-issue.ts
- knowledge.ts
- maintenance/maintenance.ts
- dependencies.ts
- requests.ts
- coordination.ts
- publish-pr.ts
- digest
- index.tsx
- sanitize
- lesson-selection.ts
- sanitizeObject
- harnessEffect
- cost-ledger.ts
- telemetry.ts
- office-qa-handoff.ts
- run-accounting.ts
- retrospective-subject.ts
- time-scope.ts
- office-state-view.ts
- .save
- scheduled-work.ts
- outbox.ts
- OfficeScene.tsx
- Effects
- engine.ts
- demand-facts.ts
- .emit
- assignment-poll.ts
- notifications.ts
- ticket-stage-runner.ts
- harness-baseline.ts
- weekly-rollup.ts
- owned-artifact.ts
- TimeBook.tsx
- candidate.ts
- scheduler.ts
- contract.ts
- continue-unsealed-qa.ts
- officeUrl
- remove-candidate.ts
- cec/issue-publication.ts
- fact-bounds.ts
- QuestionStepper.tsx
- ControlStore
- daily-cto.ts
- work.ts
- constellation-runtime.ts
- Store
- relink-pin-courier.ts
- report.ts
- Offices
- admit-improvement.ts
- shared.ts
- workKey
- github/issue-publication.ts
- jira-time.ts
- control-store.ts
- local-config.ts
- read-retries.ts
- preferences-store.ts
- blocker-followups.ts
- run.ts
- ledger.ts
- leadership.ts
- codex-rollout.ts
- office/readiness.ts
- ScheduledWork
- run-evidence.ts
- provider-observation.ts
- ITFollowUps.tsx
- handover-cms.ts
- capture-session-clone.py
- Prerequisite
- Conversation.tsx
- slack-supersession.ts
- intake-observation.ts
- service-health.ts
- source-amendment.ts
- extract-worker.mjs
- create-candidate.ts
- CommandRegistry

## God Nodes (most connected - your core abstractions)
1. `Store` - 372 edges
2. `TicketJob` - 176 edges
3. `digest()` - 175 edges
4. `artifact()` - 131 edges
5. `GitHubDelivery` - 122 edges
6. `command()` - 115 edges
7. `workKey()` - 101 edges
8. `currentAssignment()` - 90 edges
9. `cx()` - 88 edges
10. `OfficeSnapshot` - 84 edges

## Surprising Connections (you probably didn't know these)
- `apply()` --indirect_call--> `note()`  [INFERRED]
  src/conversations/OutboxSavedImplementation.tsx → server/cec/parking/resume-parked.ts
- `DeliverySlot` --references--> `Role`  [EXTRACTED]
  server/office/projects.ts → src/shared.ts
- `projectOutbox()` --calls--> `deferredPickup()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/pickup-state.ts
- `projectOutbox()` --calls--> `parkedProviderWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts
- `projectOutbox()` --calls--> `readinessWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts

## Import Cycles
- 3-file cycle: `server/delivery/parking/resume-provider-review.ts -> server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/parking/resume-provider-review.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts`
- 4-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 4-file cycle: `server/delivery/recovery/implementation/activation-recovery.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/implementation/activation-recovery.ts`
- 4-file cycle: `server/delivery/recovery/implementation/saved-prerequisite-handoff.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/implementation/saved-prerequisite-handoff.ts`
- 4-file cycle: `server/delivery/recovery/scope-repair/scope-repair-readback.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/scope-repair/scope-repair-readback.ts`
- 4-file cycle: `server/delivery/recovery/source-amendment/source-amendment.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/source-amendment/source-amendment.ts`
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

## Communities (105 total, 3 thin omitted)

### Community 0 - "currentAssignment"
Cohesion: 0.07
Nodes (76): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+68 more)

### Community 1 - ".activeClaims"
Cohesion: 0.06
Nodes (69): deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, requireDeliveryAuthority(), deliveryIntakeBlocker(), gateRegisteredDelivery(), accounting (+61 more)

### Community 2 - "dependency-bots/adopt.ts"
Cohesion: 0.22
Nodes (20): Execute, adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR, openDependabotPulls() (+12 more)

### Community 3 - "github-delivery.ts"
Cohesion: 0.05
Nodes (105): containedFile(), findingsBlock(), HANDS_OFF_PROJECTS, handsOff(), BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction() (+97 more)

### Community 4 - "Inspector.tsx"
Cohesion: 0.11
Nodes (65): SendMessage, Outbox(), blockedSummary(), ServiceHealthPanel(), followUp(), labels, ServiceHealthRow(), BlockerFollowups() (+57 more)

### Community 5 - "TicketJob"
Cohesion: 0.06
Nodes (45): ProjectProgress, removeAdoptedClone(), namedRepairIds(), dependabotReviewGuidance(), pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), StageContext, DeliveryTaskInput (+37 more)

### Community 6 - "session-bridge.ts"
Cohesion: 0.06
Nodes (52): ref_node_perf_hooks, ref_ws, claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexDaemonProcesses(), accountCodexProcesses() (+44 more)

### Community 7 - "MapView.tsx"
Cohesion: 0.08
Nodes (47): ref_react_markdown, ref_remark_gfm, ref_yaml, Activity(), ActivityTimeline(), AssignmentKnowledge(), Lookup(), BrainWorkspace() (+39 more)

### Community 8 - "agents.ts"
Cohesion: 0.06
Nodes (46): ref_zod, IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), intakeMembership(), projectListScope(), cecIntakePrompt() (+38 more)

### Community 9 - "store.ts"
Cohesion: 0.07
Nodes (42): ref_node_crypto, Decision, featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), reserveReplacement(), stageBudget(), server_features_questions_recovery_question_recoveryquestion (+34 more)

### Community 10 - "source-amendment-scope.ts"
Cohesion: 0.08
Nodes (34): approvedText(), assert(), assert(), normalize(), officialUrls, ReleaseCapture, verifyReleaseCaptures(), capture (+26 more)

### Community 11 - "index.ts"
Cohesion: 0.05
Nodes (53): ref_hono_node_server, ref_node_http, ref_node_stream, ref_node_timers, ref_vite, implementationPreview(), implementationContinuationRoute(), closedReadonlyPlan() (+45 more)

### Community 12 - "App.tsx"
Cohesion: 0.06
Nodes (62): ref_lucide_react, ref_motion, ref_react_dom, compactSteps(), BrainDrawer(), themeColor, App(), BrainWorkspace (+54 more)

### Community 13 - "config.ts"
Cohesion: 0.05
Nodes (103): ref_node_url, approveFeature(), commandFeature(), mutation(), reviewQuestions(), assertFeatureDependencyOrder(), featureDependencyEdges(), key() (+95 more)

### Community 14 - "assignments.ts"
Cohesion: 0.07
Nodes (42): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, CommittedBrain (+34 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.16
Nodes (39): assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest, captureRequests(), failCapture(), requestCapture(), saveCaptureRequest() (+31 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.09
Nodes (42): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, blockingTrigger, brainOverlap, brainOverlapQuery(), clip() (+34 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.09
Nodes (46): BLOCKING, isBlocking(), baselineLearning(), LEARNING_BASELINES, maintainLearning(), configureKnowledge(), busyMaintenanceIds(), clip() (+38 more)

### Community 18 - "worker-runtime.ts"
Cohesion: 0.07
Nodes (39): candidateWorkspaceEnvironment(), ApproachSchema, assignmentSubject(), catalogLine(), assertBriefingScope(), CODEX_DEFAULT_EFFORT, CODEX_DEFAULT_MODEL, CODEX_EFFORTS (+31 more)

### Community 19 - "ref_node_path"
Cohesion: 0.06
Nodes (93): ref_node_fs, ref_node_os, ref_node_path, ref_node_util, Candidate, partialLocalCleanupCandidate(), related, allowed (+85 more)

### Community 20 - ".transaction"
Cohesion: 0.15
Nodes (15): createFeature(), featureById(), assertEnrollable(), Link, linkFeature(), publishFeature(), reconcilePublication(), uncertainPublications() (+7 more)

### Community 21 - "Ticket"
Cohesion: 0.13
Nodes (24): implementationWorkerContext(), cecPrompt(), resolvedDecisionNote(), stageInstructions, reviewedPlanGuidance, reviewedPlanGuideDigest, qaPlanEvidenceGap(), qaRunDirectory() (+16 more)

### Community 22 - "Role"
Cohesion: 0.10
Nodes (42): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+34 more)

### Community 23 - "tracking-issue.ts"
Cohesion: 0.19
Nodes (13): ensureTrackingIssue(), findTrackingIssue(), ownTracking(), TrackingIssue, trackingIssueBody(), trackingIssueTitle(), trackingMarker(), centralCompanionHandoff() (+5 more)

### Community 24 - "knowledge.ts"
Cohesion: 0.07
Nodes (41): normalizeStatement(), decideOfficeProposal(), mirrorOfficeKnowledge(), now(), OfficeKnowledgeStore, proposeOfficeLessons(), retireOfficeLesson(), Input (+33 more)

### Community 25 - "maintenance/maintenance.ts"
Cohesion: 0.07
Nodes (41): maintenancePolicies(), captureLearning(), recordLearningOpportunity(), captureMaintenanceStep(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, BrainStatusSchema (+33 more)

### Community 26 - "dependencies.ts"
Cohesion: 0.12
Nodes (22): reconcileNoticeConfirmations(), admit(), compatible(), dependencyCompletionKey(), dependencyEligibility(), issueKey(), observePrerequisites(), PrerequisiteSchema (+14 more)

### Community 27 - "requests.ts"
Cohesion: 0.11
Nodes (41): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+33 more)

### Community 28 - "coordination.ts"
Cohesion: 0.05
Nodes (27): IntakeContext, DependencyStores, completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), legacy (+19 more)

### Community 29 - "publish-pr.ts"
Cohesion: 0.08
Nodes (54): assertDeliveryMayMutate(), HarnessControl, withHarnessWork(), draftReadHeadMatches(), harnessDraft(), assertDraftClaimHistory(), linkDraftIssue(), protectedOriginalClaim() (+46 more)

### Community 30 - "digest"
Cohesion: 0.12
Nodes (47): harnessCloseout(), PASSING, verifyMergeActions(), activeEffectId(), runHarnessStage(), harnessDelivers(), legacyRecovery(), harnessStageResult() (+39 more)

### Community 31 - "index.tsx"
Cohesion: 0.14
Nodes (37): ref_react, TicketPlanningAction(), SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS (+29 more)

### Community 32 - "sanitize"
Cohesion: 0.08
Nodes (31): assertConversationReadback(), Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff(), saveGoals() (+23 more)

### Community 33 - "lesson-selection.ts"
Cohesion: 0.09
Nodes (28): lessonIssueBody(), lessonIssueMarker(), lessonBrainAudit, LessonBrainOverlap, INSTALLED, installedLesson(), Bucket, LESSON_LIMIT (+20 more)

### Community 34 - "sanitizeObject"
Cohesion: 0.08
Nodes (37): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+29 more)

### Community 35 - "harnessEffect"
Cohesion: 0.22
Nodes (25): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), ProjectCard, projectCards(), projectGraphql() (+17 more)

### Community 36 - "cost-ledger.ts"
Cohesion: 0.12
Nodes (32): captureCost(), server_telemetry_cost_entries_costcoveragesummary, costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress() (+24 more)

### Community 37 - "telemetry.ts"
Cohesion: 0.09
Nodes (30): CodexRollout, CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL (+22 more)

### Community 38 - "office-qa-handoff.ts"
Cohesion: 0.60
Nodes (4): OfficeQAHandoff, OfficeQAHandoffInput, OfficeQAHandoffRequest, QAOwnershipProof

### Community 39 - "run-accounting.ts"
Cohesion: 0.13
Nodes (26): BoundedRead, CompletionReader, codexHome(), createdAt(), dayDirs(), header(), readCodexRollout(), ROLLOUT_MAX_BYTES (+18 more)

### Community 40 - "retrospective-subject.ts"
Cohesion: 0.16
Nodes (18): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+10 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.11
Nodes (36): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), server_telemetry_billable_work_issue_key, isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence() (+28 more)

### Community 42 - "office-state-view.ts"
Cohesion: 0.60
Nodes (4): leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore()

### Community 43 - ".save"
Cohesion: 0.19
Nodes (29): jiraCollection(), BLOCKED, findComment(), LiveIssue, readIssue(), readIssues(), Execute, jira() (+21 more)

### Community 44 - "scheduled-work.ts"
Cohesion: 0.11
Nodes (29): freshOwnershipRead(), deliverySlot(), ROLES, closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), metadataRequestResolved(), preparationRequestResolved(), withAmendmentOwnership() (+21 more)

### Community 45 - "outbox.ts"
Cohesion: 0.11
Nodes (26): projectOutbox(), syncOutbox(), finishSupersededReadback(), projectSlackDeliveries(), settleRequestedSlackReplacement(), Input, supersedeSlackDelivery(), replacementContext() (+18 more)

### Community 46 - "OfficeScene.tsx"
Cohesion: 0.07
Nodes (64): ref_react_three_drei, ref_react_three_fiber, itAgent(), itDiagnostics(), displayAgentTask(), withoutElapsed(), CameraBookmark, restoreBookmark() (+56 more)

### Community 47 - "Effects"
Cohesion: 0.18
Nodes (13): bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), ownedArtifact(), rawHash(), recoverDiscovery(), scopeNote(), GitHubOperations (+5 more)

### Community 48 - "engine.ts"
Cohesion: 0.10
Nodes (42): checkMail(), drainMail(), requestMail(), dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), resume() (+34 more)

### Community 49 - "demand-facts.ts"
Cohesion: 0.13
Nodes (22): clip(), DEMAND_LIMIT, demandFacts(), DemandSection, key(), LessonKey, notes(), clip() (+14 more)

### Community 50 - ".emit"
Cohesion: 0.13
Nodes (30): decideImplementation(), requestQAPlanRetry(), configureChannelNotices(), configureNotices(), retryRecipientLookup(), recoverCTOInput(), enqueueGreen156(), DiscoveryResumeInput (+22 more)

### Community 51 - "assignment-poll.ts"
Cohesion: 0.18
Nodes (13): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), admitReadyCards(), pinCourier, due(), unparkReleasedWaits(), compare() (+5 more)

### Community 52 - "notifications.ts"
Cohesion: 0.12
Nodes (21): channelNoticeAuthorized(), ChannelSettings, notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR, plainSlackText() (+13 more)

### Community 53 - "ticket-stage-runner.ts"
Cohesion: 0.11
Nodes (37): parksInJira(), MISSING_SAVED_PLAN, recoverSavedPlan(), run(), verifiedTransition(), advance(), nextStage(), publicationEvidenceGap() (+29 more)

### Community 54 - "harness-baseline.ts"
Cohesion: 0.16
Nodes (19): baselineReport, BaselineSource, baselineText(), millions(), row(), share(), add(), BaselineState (+11 more)

### Community 55 - "weekly-rollup.ts"
Cohesion: 0.12
Nodes (29): expireLearningPackets(), packetReferences(), learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck() (+21 more)

### Community 56 - "owned-artifact.ts"
Cohesion: 0.24
Nodes (13): investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_SOURCE_PATHS, officeSource(), done(), readBoundedNoFollow() (+5 more)

### Community 57 - "TimeBook.tsx"
Cohesion: 0.10
Nodes (39): TelemetryReport, AzureBuild, src_shared_liveanchor, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens() (+31 more)

### Community 58 - "candidate.ts"
Cohesion: 0.07
Nodes (34): ref_node_child_process, ref_node_string_decoder, file, folder, logs, root, GitRead, nativeGitRead() (+26 more)

### Community 59 - "scheduler.ts"
Cohesion: 0.22
Nodes (13): officeCapacity, fifo(), Scheduler, selectWork(), admitsWork(), canDispatch(), deliveryOccupied(), foreignWork() (+5 more)

### Community 60 - "contract.ts"
Cohesion: 0.15
Nodes (16): Event, one(), prePushRejection(), PushIdentity, settledPushBoundary(), NOTIFY_HELPER, At, errno (+8 more)

### Community 61 - "continue-unsealed-qa.ts"
Cohesion: 0.13
Nodes (23): continueImplementation(), nativeIO, assertOwnership(), ImplementationDecision, OwnershipRead, interruptedImplementation(), continueOwnershipRead(), continueUnsealedQA() (+15 more)

### Community 62 - "officeUrl"
Cohesion: 0.09
Nodes (31): OutboxSavedImplementation(), apply(), review(), OutboxSavedPlan(), reconcile(), FeatureDelivery(), FeatureDocuments(), views (+23 more)

### Community 63 - "remove-candidate.ts"
Cohesion: 0.18
Nodes (18): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot() (+10 more)

### Community 64 - "cec/issue-publication.ts"
Cohesion: 0.08
Nodes (42): CommentPage, commentReadback(), Assignment, Content, Transition, JiraOperations, plain(), jiraRecord() (+34 more)

### Community 65 - "fact-bounds.ts"
Cohesion: 0.25
Nodes (15): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+7 more)

### Community 66 - "QuestionStepper.tsx"
Cohesion: 0.13
Nodes (26): FeatureHarnessOption, FeatureOption, FeatureQuestion, FeatureQuestionProjection, OutboxQuestionRound(), send(), draftKey(), readDraft() (+18 more)

### Community 67 - "ControlStore"
Cohesion: 0.17
Nodes (6): DailyCTO, EvidenceRequestConflict, Briefing, saveReviewBriefing(), ControlStore, DailyCTOReport

### Community 68 - "daily-cto.ts"
Cohesion: 0.19
Nodes (13): evidenceRequestConflicts, dailyReviewPrompt(), applyGoalReview(), DailyResultSchema, EvidenceRefSchema, FreshDailyResultSchema, GoalEvidenceRequestSchema, statusAllowed() (+5 more)

### Community 69 - "work.ts"
Cohesion: 0.17
Nodes (14): ProjectReadiness, AssignmentResult, BlockedCause, CompletionCondition, DeliveryAdmission, DependencyObservation, EligibilityState, FailureCategory (+6 more)

### Community 70 - "constellation-runtime.ts"
Cohesion: 0.06
Nodes (53): ref_3d_force_graph, ref_three, ref_three_stdlib, KnowledgeActivity, KnowledgeEdge, KnowledgeMap, KnowledgeNode, ATMOSPHERE (+45 more)

### Community 71 - "Store"
Cohesion: 0.06
Nodes (11): jiraText(), GitHubFeaturePublisher, JiraFeaturePublisher, FeatureReviewRunner, Result, Engine, Store, command() (+3 more)

### Community 72 - "relink-pin-courier.ts"
Cohesion: 0.24
Nodes (10): readBackOrThrow(), retryRead(), editorMatches(), relinkPinCourier(), sha(), MISSING_NATIVE_LINK, resumeLinkedDelivery(), Execute (+2 more)

### Community 73 - "report.ts"
Cohesion: 0.29
Nodes (12): Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked(), row() (+4 more)

### Community 74 - "Offices"
Cohesion: 0.16
Nodes (4): QuestionNotifications, seedOfficeLessons(), Offices, markCaptureStart()

### Community 75 - "admit-improvement.ts"
Cohesion: 0.26
Nodes (13): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+5 more)

### Community 76 - "shared.ts"
Cohesion: 0.05
Nodes (54): GoalProgress, PackedPublicationRepair, OfficeQAReport, QAPlanContinuation, ctoInputFailure(), OutboxCTOInput(), recover(), OutboxMaintenanceStatus() (+46 more)

### Community 77 - "workKey"
Cohesion: 0.30
Nodes (9): completedPRReviews(), eligible(), mergedByOwner(), ownerSettles(), retireExternalDeliveries(), settledExternalRepair(), nativeDeliveryReadbackCandidate(), reconcileNativeDelivery() (+1 more)

### Community 78 - "github/issue-publication.ts"
Cohesion: 0.11
Nodes (13): JiraIssuePublisher, keyOf(), publicationDescription(), FeaturePublisher, PublicationReceipt, Assign, Board, Content (+5 more)

### Community 79 - "jira-time.ts"
Cohesion: 0.17
Nodes (16): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+8 more)

### Community 80 - "control-store.ts"
Cohesion: 0.17
Nodes (10): ref_node_sqlite, Clock, applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, statementCache(), initialSnapshot() (+2 more)

### Community 81 - "local-config.ts"
Cohesion: 0.28
Nodes (11): AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), goalEvidencePath(), OfficeConfigInputs, officeConfigRoute(), officeConfigSummary(), CECBinding, localBindings (+3 more)

### Community 82 - "read-retries.ts"
Cohesion: 0.31
Nodes (8): SourceClosed, classifyStop(), incompleteReadOutput(), IntakeResult, planReadRetry(), temporaryReadFailure(), StopKind, StopReason

### Community 83 - "preferences-store.ts"
Cohesion: 0.25
Nodes (6): fields, PreferencesPatch, PreferencesStore, StoredBody, OFFICE_PREFERENCE_DEFAULTS, OfficePreferences

### Community 84 - "blocker-followups.ts"
Cohesion: 0.16
Nodes (19): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), itChatPrompt(), assignmentDiagnostics(), readBackConversations(), diagnosticContext() (+11 more)

### Community 85 - "run.ts"
Cohesion: 0.21
Nodes (14): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, OFFICE_FIX_PROMPT, OfficeFixResult, validateOfficeFix(), investigationReady(), InvestigationOptions, InvestigationReport (+6 more)

### Community 86 - "ledger.ts"
Cohesion: 0.24
Nodes (12): ctoInputIdentityMatches(), ctoInputRecovered(), investigationCandidates(), investigationId(), ctoReplacementResolution(), investigationFollowUps(), implementationReplacementResolution(), investigationResolution() (+4 more)

### Community 87 - "leadership.ts"
Cohesion: 0.20
Nodes (8): DailyCTOBriefing, DailyCTOResult, DailyCTOSummary, DailyGoalUpdate, GoalEvidenceRef, GoalEvidenceRequest, GoalStatus, HealthReport

### Community 88 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 89 - "office/readiness.ts"
Cohesion: 0.36
Nodes (6): BLOCKED_CAUSES, blockedCauses(), projectReadiness(), ProgressionItem, src_shared_progressionitem, src_shared_projectreadiness

### Community 91 - "run-evidence.ts"
Cohesion: 0.38
Nodes (5): comparable(), EvidenceOutcome, recordRunEvidence(), backfillClaudeCost(), RunAccounting

### Community 92 - "provider-observation.ts"
Cohesion: 0.47
Nodes (4): correlatedBuild(), observe(), observeParked(), parkedReadError

### Community 93 - "ITFollowUps.tsx"
Cohesion: 0.67
Nodes (4): itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps()

### Community 94 - "handover-cms.ts"
Cohesion: 0.40
Nodes (4): ref_smol_toml, file, project, root

### Community 95 - "capture-session-clone.py"
Cohesion: 0.15
Nodes (10): ctypes, errno, importlib_util, json, os, pathlib, Copy a coherent macOS clone of inherited reader fd3 to anonymous target fd4. No…, Read-only protocol adapter for the installed review helper. No model dispatch. (+2 more)

### Community 96 - "Prerequisite"
Cohesion: 0.40
Nodes (5): Admission, Prerequisite, WorkFailure, AssignmentReview, ReadRetry

### Community 97 - "Conversation.tsx"
Cohesion: 0.16
Nodes (22): Conversation(), LessonDecisionAction, lessonDecisionState(), readLessonDecision(), OutboxLessonDecision(), act(), readStatus(), recommendedReply() (+14 more)

### Community 98 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 101 - "service-health.ts"
Cohesion: 0.20
Nodes (9): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, slackHealth() (+1 more)

### Community 103 - "source-amendment.ts"
Cohesion: 0.07
Nodes (65): ref_node_async_hooks, stagePrompt(), StagePromptInput, METADATA_FINDING_GUIDANCE, adoptCandidate(), reported, Scope, advisoryPM() (+57 more)

### Community 105 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (6): ref_mammoth, ref_pdfjs_dist, bounded(), extract(), fail(), [path,kind]

### Community 107 - "create-candidate.ts"
Cohesion: 0.31
Nodes (9): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+1 more)

## Knowledge Gaps
- **502 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+497 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 641 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `currentAssignment`, `.activeClaims`, `dependency-bots/adopt.ts`, `github-delivery.ts`, `TicketJob`, `session-bridge.ts`, `agents.ts`, `store.ts`, `index.ts`, `config.ts`, `assignments.ts`, `scheduled-captures.ts`, `run-retrospective.ts`, `record-trigger.ts`, `worker-runtime.ts`, `ref_node_path`, `.transaction`, `Ticket`, `tracking-issue.ts`, `knowledge.ts`, `maintenance/maintenance.ts`, `dependencies.ts`, `requests.ts`, `coordination.ts`, `publish-pr.ts`, `digest`, `sanitize`, `lesson-selection.ts`, `sanitizeObject`, `harnessEffect`, `cost-ledger.ts`, `run-accounting.ts`, `retrospective-subject.ts`, `time-scope.ts`, `office-state-view.ts`, `.save`, `scheduled-work.ts`, `outbox.ts`, `OfficeScene.tsx`, `Effects`, `engine.ts`, `demand-facts.ts`, `.emit`, `assignment-poll.ts`, `notifications.ts`, `ticket-stage-runner.ts`, `weekly-rollup.ts`, `owned-artifact.ts`, `candidate.ts`, `scheduler.ts`, `contract.ts`, `continue-unsealed-qa.ts`, `remove-candidate.ts`, `cec/issue-publication.ts`, `daily-cto.ts`, `relink-pin-courier.ts`, `Offices`, `admit-improvement.ts`, `shared.ts`, `workKey`, `github/issue-publication.ts`, `jira-time.ts`, `control-store.ts`, `read-retries.ts`, `blocker-followups.ts`, `run.ts`, `ledger.ts`, `ScheduledWork`, `run-evidence.ts`, `source-amendment.ts`, `create-candidate.ts`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **Why does `GitHubDelivery` connect `TicketJob` to `currentAssignment`, `.activeClaims`, `github-delivery.ts`, `harnessEffect`, `Store`, `source-amendment.ts`, `workKey`, `engine.ts`, `assignment-poll.ts`, `notifications.ts`, `ref_node_path`, `dependencies.ts`, `requests.ts`, `coordination.ts`, `publish-pr.ts`, `digest`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `Role` connect `Role` to `github-delivery.ts`, `Inspector.tsx`, `TicketJob`, `agents.ts`, `store.ts`, `index.ts`, `App.tsx`, `worker-runtime.ts`, `Ticket`, `maintenance/maintenance.ts`, `publish-pr.ts`, `sanitize`, `run-accounting.ts`, `retrospective-subject.ts`, `scheduled-work.ts`, `outbox.ts`, `OfficeScene.tsx`, `.emit`, `scheduler.ts`, `work.ts`, `shared.ts`, `blocker-followups.ts`, `Conversation.tsx`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _502 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `currentAssignment` be split into smaller, more focused modules?**
  _Cohesion score 0.07431052093973442 - nodes in this community are weakly interconnected._
- **Should `.activeClaims` be split into smaller, more focused modules?**
  _Cohesion score 0.057195149851292613 - nodes in this community are weakly interconnected._
- **Should `github-delivery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.048659673659673656 - nodes in this community are weakly interconnected._