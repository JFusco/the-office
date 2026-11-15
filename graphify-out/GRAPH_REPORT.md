# Graph Report - office-qa-owner-refresh-nov15  (2026-11-15)

## Corpus Check
- 831 files · ~336,517 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4110 nodes · 19242 edges · 109 communities (106 shown, 3 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 629 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9154d914`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- github-delivery.ts
- currentAssignment
- artifact
- App.tsx
- ref_node_path
- .save
- Button
- run-accounting.ts
- session-bridge.ts
- Inspector.tsx
- .transaction
- assignments.ts
- digest
- Goals.tsx
- lesson-selection.ts
- Store
- source-amendment.ts
- agents.ts
- scheduled-captures.ts
- index.ts
- ref_zod
- run.ts
- PeoplePanel.tsx
- Conversation.tsx
- workKey
- run-retrospective.ts
- maintenance/maintenance.ts
- ticket-stage-runner.ts
- worker-runtime.ts
- continuation-evidence.ts
- record-trigger.ts
- pilot-delivery.ts
- completedExecution
- index.tsx
- sanitizeObject
- Ticket
- features.ts
- source-amendment-scope.ts
- admit-improvement.ts
- shared.ts
- .emit
- resume-provider-review.ts
- offices.ts
- time-scope.ts
- telemetry.ts
- scheduled-work.ts
- notifications.ts
- dependency-bots/adopt.ts
- .activeClaims
- accept-stage-result.ts
- OfficeScene.tsx
- ticket-evidence.ts
- cec/issue-publication.ts
- OfficeSnapshot
- jira-time.ts
- process.ts
- weekly-rollup.ts
- candidate.ts
- work.ts
- inspect-closed-plan.ts
- run-cost.ts
- normalize-question.ts
- office-lessons.ts
- retrospective-subject.ts
- remove-candidate.ts
- scheduler.ts
- it-specialist.ts
- QuestionStepper.tsx
- local-config.ts
- goal-reviews.ts
- Effects
- constellation-runtime.ts
- reader.ts
- TimeBook.tsx
- continue-ownership-read.ts
- engine.ts
- harnessEffect
- discovery-recovery.ts
- goal-reporting.ts
- outbox.ts
- agent-activity.ts
- diagnostic-snapshot.ts
- tracking-issue.ts
- service-health.ts
- knowledge.ts
- node-visuals.ts
- jira-operations.ts
- ledger.ts
- evidence-digest.ts
- report.ts
- scene-motion.ts
- preferences-store.ts
- record-push.ts
- Offices
- capture-session-clone.py
- RoomCamera.tsx
- merge-summary.ts
- blocker-followups.ts
- time-readback.ts
- command-registry.ts
- retire-history.ts
- continue-access-only-plan.ts
- extract-worker.mjs
- create-candidate.ts
- extraction.ts
- continue-unsealed-qa.ts
- highestStableAtLeast
- ProjectProgress
- intake-observation.ts

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
10. `Button` - 84 edges

## Surprising Connections (you probably didn't know these)
- `apply()` --indirect_call--> `note()`  [INFERRED]
  src/conversations/OutboxSavedImplementation.tsx → server/cec/parking/resume-parked.ts
- `DeliveryAuthorityInput` --references--> `HarnessRequest`  [EXTRACTED]
  server/delivery/harness/delivery-authority.ts → src/contracts/work.ts
- `projectOutbox()` --calls--> `isSavedPlanFollowup()`  [EXTRACTED]
  server/conversations/outbox.ts → src/conversations/saved-plan-followup.ts
- `projectOutbox()` --calls--> `deferredPickup()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/pickup-state.ts
- `replacementContext()` --calls--> `slackMessageUrl()`  [EXTRACTED]
  server/conversations/slack/supersession-proof.ts → src/shared.ts

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

## Communities (109 total, 3 thin omitted)

### Community 0 - "github-delivery.ts"
Cohesion: 0.04
Nodes (98): findingsBlock(), BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction(), dependabotReviewGuidance(), discover(), refreshDependencies() (+90 more)

### Community 1 - "currentAssignment"
Cohesion: 0.05
Nodes (98): pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash (+90 more)

### Community 2 - "artifact"
Cohesion: 0.07
Nodes (76): ref_node_os, verifyContinuationPreservation(), continuationNativeReview(), continuationWorkerProof(), candidateInput(), children, oldAdoptionBasis(), savedCandidateAdmission (+68 more)

### Community 3 - "App.tsx"
Cohesion: 0.06
Nodes (53): ref_lucide_react, ref_motion, ref_react_dom, BrainDrawer(), themeColor, App(), BrainWorkspace, CONNECTION (+45 more)

### Community 4 - "ref_node_path"
Cohesion: 0.10
Nodes (35): ref_node_fs, ref_node_path, ref_node_util, containedFile(), removeAdoptedClone(), namedRepairIds(), stoppedBaseCheckout(), contentTypes (+27 more)

### Community 5 - ".save"
Cohesion: 0.19
Nodes (29): jiraCollection(), BLOCKED, findComment(), LiveIssue, readIssue(), readIssues(), Execute, jira() (+21 more)

### Community 6 - "Button"
Cohesion: 0.08
Nodes (60): ref_react, ref_react_markdown, ref_remark_gfm, ref_yaml, KnowledgeActivity, KnowledgeActivityPage, KnowledgeEdge, KnowledgeMap (+52 more)

### Community 7 - "run-accounting.ts"
Cohesion: 0.08
Nodes (42): BoundedRead, done(), readBoundedNoFollow(), reasonOf(), add(), CodexRequest, CodexRollout, CodexTokens (+34 more)

### Community 8 - "session-bridge.ts"
Cohesion: 0.05
Nodes (57): ref_node_perf_hooks, ref_node_url, ref_ws, file, folder, logs, root, claudeSessionContext() (+49 more)

### Community 9 - "Inspector.tsx"
Cohesion: 0.12
Nodes (59): blockedSummary(), ServiceHealthPanel(), followUp(), labels, ServiceHealthRow(), BlockerFollowups(), LearningCoverage(), LessonsPanel() (+51 more)

### Community 10 - ".transaction"
Cohesion: 0.07
Nodes (55): approveFeature(), featureById(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), discoveryPrompt(), planPrompt() (+47 more)

### Community 11 - "assignments.ts"
Cohesion: 0.09
Nodes (30): assignmentKnowledge(), clip(), DEMAND_LIMIT, demandFacts(), DemandSection, key(), LessonKey, notes() (+22 more)

### Community 12 - "digest"
Cohesion: 0.07
Nodes (68): accounting, DeliverySubject, nonDelivery, originalReads, HarnessControl, withHarnessWork(), pinCourier, assertAutomationEffects() (+60 more)

### Community 13 - "Goals.tsx"
Cohesion: 0.09
Nodes (31): SendMessage, FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), send(), phases, LinkedFeatures() (+23 more)

### Community 14 - "lesson-selection.ts"
Cohesion: 0.06
Nodes (40): ref_node_stream, ref_node_timers, args, [cmd,...rawArgs], commands, key, projectIndex, fileLessonIssue() (+32 more)

### Community 15 - "Store"
Cohesion: 0.04
Nodes (41): ref_node_sqlite, ref_smol_toml, GitHubFeaturePublisher, QuestionNotifications, FeatureReviewRunner, Result, Assessment, Clock (+33 more)

### Community 16 - "source-amendment.ts"
Cohesion: 0.11
Nodes (39): ref_node_async_hooks, adoptCandidate(), reported, Scope, assertCandidateChildContextCurrent(), AMENDMENT_REVIEW_PROOF, amendmentIssueSha256(), authorizeSourceAmendment() (+31 more)

### Community 17 - "agents.ts"
Cohesion: 0.06
Nodes (43): cecReadbackPrompt(), cecReconcilePrompt(), stageInstructions, readbackDispatchGuidance(), CECReadbackSchema, READBACK_OWNER_SCOPE, ConversationResultSchema, cecChatPrompt() (+35 more)

### Community 18 - "scheduled-captures.ts"
Cohesion: 0.15
Nodes (46): requestDelivery(), createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest (+38 more)

### Community 19 - "index.ts"
Cohesion: 0.08
Nodes (39): ref_hono_node_server, ref_node_http, ref_vite, implementationContinuationRoute(), qaPlanRetryRoute(), close(), config, itSpecialist (+31 more)

### Community 20 - "ref_zod"
Cohesion: 0.09
Nodes (30): ref_zod, assertConversationReadback(), Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+22 more)

### Community 21 - "run.ts"
Cohesion: 0.11
Nodes (26): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, NOTIFY_HELPER, notifyHelperResolution() (+18 more)

### Community 22 - "PeoplePanel.tsx"
Cohesion: 0.10
Nodes (42): label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+34 more)

### Community 23 - "Conversation.tsx"
Cohesion: 0.14
Nodes (24): Conversation(), LessonDecisionAction, lessonDecisionState(), readLessonDecision(), OutboxLessonDecision(), act(), readStatus(), slackMessageStatus() (+16 more)

### Community 24 - "workKey"
Cohesion: 0.21
Nodes (18): completedPRReviews(), dependencyVersion(), handoffSavedPrerequisites(), hasSavedPrerequisiteResult(), Ownership, qualified(), readDependencies(), requireSavedPrerequisites() (+10 more)

### Community 25 - "run-retrospective.ts"
Cohesion: 0.09
Nodes (43): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, blockingTrigger, isBlocking(), brainOverlap (+35 more)

### Community 26 - "maintenance/maintenance.ts"
Cohesion: 0.06
Nodes (49): maintenancePolicies(), captureMaintenanceStep(), completeNativeCheckpoint(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, BrainStatusSchema, identity (+41 more)

### Community 27 - "ticket-stage-runner.ts"
Cohesion: 0.21
Nodes (20): parksInJira(), run(), publicationEvidenceGap(), qaEvidenceGap(), stageResultGap(), afterDraft(), firstBuildStage(), missingApproachStage() (+12 more)

### Community 28 - "worker-runtime.ts"
Cohesion: 0.07
Nodes (40): candidateWorkspaceEnvironment(), assignmentSubject(), lessonPurpose(), selectLessons(), catalogLine(), assertBriefingScope(), taskBriefing(), contextPacket() (+32 more)

### Community 29 - "continuation-evidence.ts"
Cohesion: 0.09
Nodes (52): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+44 more)

### Community 30 - "record-trigger.ts"
Cohesion: 0.12
Nodes (37): baselineLearning(), LEARNING_BASELINES, maintainLearning(), configureKnowledge(), clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates() (+29 more)

### Community 31 - "pilot-delivery.ts"
Cohesion: 0.15
Nodes (19): continueImplementation(), dispatchNightly(), drainDelivery(), enableNightly(), resume(), startPilot(), OfficeQAHandoffInput, MISSING_SAVED_PLAN (+11 more)

### Community 32 - "completedExecution"
Cohesion: 0.09
Nodes (56): harnessCloseout(), PASSING, verifyMergeActions(), runHarnessStage(), harnessStageResult(), receipt(), Check, harnessChecks() (+48 more)

### Community 33 - "index.tsx"
Cohesion: 0.09
Nodes (51): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS, PickupForm(), acceptPreferences() (+43 more)

### Community 34 - "sanitizeObject"
Cohesion: 0.15
Nodes (22): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+14 more)

### Community 35 - "Ticket"
Cohesion: 0.15
Nodes (20): implementationWorkerContext(), cecPrompt(), resolvedDecisionNote(), qaPlanEvidenceGap(), qaRunDirectory(), safeWebUrl(), isQAStage(), legacyQA() (+12 more)

### Community 36 - "features.ts"
Cohesion: 0.03
Nodes (86): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), reconcileNoticeConfirmations(), Admission, admit(), admitReadyCards(), IntakeContext (+78 more)

### Community 37 - "source-amendment-scope.ts"
Cohesion: 0.10
Nodes (28): approvedText(), assert(), capture, generation, GenerationContext, head, ids, Legacy (+20 more)

### Community 38 - "admit-improvement.ts"
Cohesion: 0.18
Nodes (19): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementIntakeGate(), improvementManifest() (+11 more)

### Community 39 - "shared.ts"
Cohesion: 0.06
Nodes (29): ctoInputIdentityMatches(), ctoInputRecovered(), DailyCTOBriefing, DailyCTOResult, DailyCTOSummary, DailyGoalUpdate, GoalEvidenceRef, GoalEvidenceRequest (+21 more)

### Community 40 - ".emit"
Cohesion: 0.19
Nodes (21): decideImplementation(), requestQAPlanRetry(), configureChannelNotices(), configureNotices(), retryRecipientLookup(), recoverCTOInput(), enqueueGreen156(), enqueuePacked165() (+13 more)

### Community 41 - "resume-provider-review.ts"
Cohesion: 0.25
Nodes (21): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), ProjectCard, projectCards(), projectGraphql() (+13 more)

### Community 42 - "offices.ts"
Cohesion: 0.08
Nodes (61): ref_node_crypto, commandFeature(), reviewQuestions(), featureItemComplete(), reconcileFeatureCompletion(), document(), featureRoot(), automaticIntakeWait() (+53 more)

### Community 43 - "time-scope.ts"
Cohesion: 0.12
Nodes (34): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), server_telemetry_billable_work_issue_key, isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence() (+26 more)

### Community 44 - "telemetry.ts"
Cohesion: 0.13
Nodes (31): captureCost(), server_telemetry_cost_entries_costcoveragesummary, costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId() (+23 more)

### Community 45 - "scheduled-work.ts"
Cohesion: 0.11
Nodes (30): freshOwnershipRead(), deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), metadataRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork() (+22 more)

### Community 46 - "notifications.ts"
Cohesion: 0.14
Nodes (19): channelNoticeAuthorized(), ChannelSettings, notices(), queueChannelNotice(), Identity, MergeNotifications, NoticeSettings, noticeState() (+11 more)

### Community 47 - "dependency-bots/adopt.ts"
Cohesion: 0.14
Nodes (26): Execute, adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR, openDependabotPulls() (+18 more)

### Community 48 - ".activeClaims"
Cohesion: 0.11
Nodes (35): interruptedImplementation(), ownershipReadHistory(), deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, requireDeliveryAuthority(), deliveryIntakeBlocker() (+27 more)

### Community 49 - "accept-stage-result.ts"
Cohesion: 0.13
Nodes (29): park(), acceptStageResult(), draftReadHeadMatches(), assertDraftClaimHistory(), linkDraftIssue(), protectedOriginalClaim(), METADATA_FINDING, publicationReadArgs() (+21 more)

### Community 50 - "OfficeScene.tsx"
Cohesion: 0.18
Nodes (31): Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk(), ElevatorStage() (+23 more)

### Community 51 - "ticket-evidence.ts"
Cohesion: 0.21
Nodes (18): attachmentKind(), evidenceDirectory(), readEvidence(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS, EvidenceAttachment (+10 more)

### Community 52 - "cec/issue-publication.ts"
Cohesion: 0.08
Nodes (26): Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), Transition, descriptionPreimage(), plain() (+18 more)

### Community 53 - "OfficeSnapshot"
Cohesion: 0.13
Nodes (23): Outbox(), ctoInputFailure(), OutboxCTOInput(), recover(), OutboxMaintenanceStatus(), OutboxSavedImplementation(), apply(), review() (+15 more)

### Community 54 - "jira-time.ts"
Cohesion: 0.22
Nodes (13): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+5 more)

### Community 55 - "process.ts"
Cohesion: 0.15
Nodes (19): ref_node_child_process, inactivityWatch(), At, errno, GroupInventory, GroupProbe, LifecycleDiagnostic, Phase (+11 more)

### Community 56 - "weekly-rollup.ts"
Cohesion: 0.07
Nodes (40): expireLearningPackets(), packetReferences(), learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), retire() (+32 more)

### Community 57 - "candidate.ts"
Cohesion: 0.18
Nodes (17): GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles(), ContinuationIO (+9 more)

### Community 58 - "work.ts"
Cohesion: 0.12
Nodes (20): BLOCKED_CAUSES, blockedCauses(), projectReadiness(), ProjectReadiness, AssignmentResult, BlockedCause, CompletionCondition, DeliveryAdmission (+12 more)

### Community 59 - "inspect-closed-plan.ts"
Cohesion: 0.16
Nodes (13): assertOwnership(), closedReadonlyPlan(), Document, consumeQAPlanRetry(), entryExists(), inspectClosedQAPlan(), Decision, reviewedPlanGuidance (+5 more)

### Community 60 - "run-cost.ts"
Cohesion: 0.14
Nodes (17): CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL, Rates (+9 more)

### Community 61 - "normalize-question.ts"
Cohesion: 0.57
Nodes (5): normalizeRound(), folded(), normalizeQuestion(), optionId(), RawQuestion

### Community 62 - "office-lessons.ts"
Cohesion: 0.27
Nodes (9): normalizeStatement(), decideOfficeProposal(), now(), OfficeKnowledgeStore, proposeOfficeLessons(), retireOfficeLesson(), Input, promoteNoteLesson() (+1 more)

### Community 63 - "retrospective-subject.ts"
Cohesion: 0.12
Nodes (23): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+15 more)

### Community 64 - "remove-candidate.ts"
Cohesion: 0.18
Nodes (18): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot() (+10 more)

### Community 65 - "scheduler.ts"
Cohesion: 0.16
Nodes (14): ROLES, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch(), deliveryOccupied() (+6 more)

### Community 66 - "it-specialist.ts"
Cohesion: 0.19
Nodes (16): partialLocalCleanupKey(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), ITContext, publishITReport(), delays (+8 more)

### Community 67 - "QuestionStepper.tsx"
Cohesion: 0.19
Nodes (18): FeatureQuestionProjection, OutboxQuestionRound(), send(), draftKey(), readDraft(), saveDraft(), QuestionRound(), nextQuestion() (+10 more)

### Community 68 - "local-config.ts"
Cohesion: 0.17
Nodes (17): IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), intakeMembership(), projectListScope(), cecIntakePrompt(), cecTransitionPrompt() (+9 more)

### Community 69 - "goal-reviews.ts"
Cohesion: 0.24
Nodes (9): applyGoalReview(), DailyResultSchema, EvidenceRefSchema, FreshDailyResultSchema, GoalEvidenceRequestSchema, statusAllowed(), workEvidence(), src_shared_dailygoalupdate (+1 more)

### Community 70 - "Effects"
Cohesion: 0.31
Nodes (5): GitHubOperations, closeNativeRefresh(), fingerprint(), Effects, EffectIntent

### Community 71 - "constellation-runtime.ts"
Cohesion: 0.10
Nodes (22): ref_3d_force_graph, ref_three, CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point (+14 more)

### Community 72 - "reader.ts"
Cohesion: 0.08
Nodes (31): knowledgeActivity(), knowledgeActivityPage(), committedNotePage(), BrainGraph, BrainNote, BrainReader, CommittedBrain, GraphNode (+23 more)

### Community 73 - "TimeBook.tsx"
Cohesion: 0.11
Nodes (36): AzureBuild, src_shared_liveanchor, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens(), usd() (+28 more)

### Community 74 - "continue-ownership-read.ts"
Cohesion: 0.29
Nodes (11): continueOwnershipRead(), expiredOwnershipRead(), ownershipReadGate(), ownershipReadState(), ownershipReadSource(), readOwnershipCandidate, ReadOwnershipView, scheduledOwnershipRead() (+3 more)

### Community 75 - "engine.ts"
Cohesion: 0.08
Nodes (12): correlatedBuild(), checkMail(), drainMail(), requestMail(), ingest(), drainMaintenance(), reconcileMaintenance(), requestMaintenance() (+4 more)

### Community 76 - "harnessEffect"
Cohesion: 0.28
Nodes (12): activeEffectId(), harnessEffect, Execute, promoteReady(), officeMergeProvenance(), reconcileMergeScannerRetry(), Retry, retryMergeScanner() (+4 more)

### Community 77 - "discovery-recovery.ts"
Cohesion: 0.26
Nodes (11): Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership, rawHash() (+3 more)

### Community 78 - "goal-reporting.ts"
Cohesion: 0.09
Nodes (35): GitHubMonitor, githubPRDescription(), leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), collectCTOFacts(), boundedIntake() (+27 more)

### Community 79 - "outbox.ts"
Cohesion: 0.14
Nodes (24): projectOutbox(), compactSteps(), knowledgeOutbox(), checkpointSuperseded(), HumanAction, deliveryRepairProjection(), ACTIVE, maintenanceUpdate() (+16 more)

### Community 80 - "agent-activity.ts"
Cohesion: 0.38
Nodes (8): displayAgentTask(), githubStageLabels, withoutElapsed(), LiveAgentTask(), Props, RunningTask(), text(), Agent

### Community 81 - "diagnostic-snapshot.ts"
Cohesion: 0.27
Nodes (7): assignmentDiagnostics(), diagnosticContext(), diagnosticSnapshot(), nativeDeliveryResolved(), itAgent(), itDiagnostics(), currentServices()

### Community 82 - "tracking-issue.ts"
Cohesion: 0.18
Nodes (18): readBackOrThrow(), retryRead(), ensureTrackingIssue(), findTrackingIssue(), ownTracking(), TrackingIssue, trackingIssueBody(), trackingIssueTitle() (+10 more)

### Community 83 - "service-health.ts"
Cohesion: 0.19
Nodes (10): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, slackHealth() (+2 more)

### Community 84 - "knowledge.ts"
Cohesion: 0.08
Nodes (31): BRAIN_SCOPE, retrospectivePrompt(), SUBJECT, Kind, RetrospectiveResultSchema, RollupResultSchema, Stage, BlockerFollowup (+23 more)

### Community 85 - "node-visuals.ts"
Cohesion: 0.20
Nodes (13): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+5 more)

### Community 86 - "jira-operations.ts"
Cohesion: 0.25
Nodes (10): CommentPage, commentReadback(), JiraOperations, plain(), jiraRecord(), unpack(), metadataDigest(), verifiedTransition() (+2 more)

### Community 87 - "ledger.ts"
Cohesion: 0.21
Nodes (18): syncOutbox(), finishSupersededReadback(), projectSlackDeliveries(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint(), slackRequestSettled() (+10 more)

### Community 88 - "evidence-digest.ts"
Cohesion: 0.44
Nodes (7): canonical(), evidenceDigest(), evidenceHash(), semantic(), stableUrl(), requirementDrift(), RequirementPostimage

### Community 89 - "report.ts"
Cohesion: 0.22
Nodes (15): TelemetryReport, TelemetryRow, TelemetrySync, Acc, bump(), EASTERN, easternDay(), modelShares() (+7 more)

### Community 90 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 91 - "preferences-store.ts"
Cohesion: 0.21
Nodes (8): PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS, OfficePreferences

### Community 92 - "record-push.ts"
Cohesion: 0.31
Nodes (7): Event, one(), prePushRejection(), PushIdentity, Candidate, recordedPush(), settledPushBoundary()

### Community 94 - "capture-session-clone.py"
Cohesion: 0.15
Nodes (10): ctypes, errno, importlib_util, json, os, pathlib, Copy a coherent macOS clone of inherited reader fd3 to anonymous target fd4. No…, Read-only protocol adapter for the installed review helper. No model dispatch. (+2 more)

### Community 95 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (10): ref_react_three_drei, ref_react_three_fiber, ref_three_stdlib, CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility (+2 more)

### Community 96 - "merge-summary.ts"
Cohesion: 0.36
Nodes (7): clamp(), LIMITS, MergedPR, plainSlackText(), section(), shippedSummary(), mergeText()

### Community 97 - "blocker-followups.ts"
Cohesion: 0.47
Nodes (8): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), readBackConversations(), handoff(), reconcileBlockerFollowups(), src_shared_blockerfollowup

### Community 98 - "time-readback.ts"
Cohesion: 0.19
Nodes (10): TimeLedger, Readback, READBACK_INTERVAL_MS, readBackTime(), SETTLE_MS, ConfirmedSegment, LiveAnchor, ObservationGap (+2 more)

### Community 99 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 100 - "retire-history.ts"
Cohesion: 0.33
Nodes (7): readHistoryScope(), historicalRecordDigest(), Intent, records(), retireIncompleteHistory(), HistoryRetirement, HistoryRetirementIntent

### Community 101 - "continue-access-only-plan.ts"
Cohesion: 0.57
Nodes (5): Document, isAccessOnlyPlan(), settledAccessOnlyState(), continueAccessOnlyPlan(), entryExists()

### Community 102 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (6): ref_mammoth, ref_pdfjs_dist, bounded(), extract(), fail(), [path,kind]

### Community 103 - "create-candidate.ts"
Cohesion: 0.21
Nodes (12): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+4 more)

### Community 104 - "extraction.ts"
Cohesion: 0.33
Nodes (4): ref_node_string_decoder, extractDocument, Extraction, Extractor

### Community 105 - "continue-unsealed-qa.ts"
Cohesion: 0.17
Nodes (14): ImplementationDecision, OwnershipRead, continueUnsealedQA(), entry(), handoffOwnership(), ReadbackOwnerDecision, ImplementationContinuation, ImplementationContinuationInput (+6 more)

### Community 106 - "highestStableAtLeast"
Cohesion: 0.83
Nodes (3): compare(), highestStableAtLeast(), parts()

## Knowledge Gaps
- **497 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+492 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 635 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `github-delivery.ts`, `currentAssignment`, `artifact`, `ref_node_path`, `.save`, `run-accounting.ts`, `session-bridge.ts`, `.transaction`, `assignments.ts`, `digest`, `lesson-selection.ts`, `source-amendment.ts`, `agents.ts`, `scheduled-captures.ts`, `index.ts`, `ref_zod`, `run.ts`, `workKey`, `run-retrospective.ts`, `maintenance/maintenance.ts`, `worker-runtime.ts`, `continuation-evidence.ts`, `record-trigger.ts`, `pilot-delivery.ts`, `completedExecution`, `sanitizeObject`, `Ticket`, `features.ts`, `admit-improvement.ts`, `.emit`, `resume-provider-review.ts`, `offices.ts`, `time-scope.ts`, `telemetry.ts`, `scheduled-work.ts`, `notifications.ts`, `dependency-bots/adopt.ts`, `.activeClaims`, `accept-stage-result.ts`, `ticket-evidence.ts`, `cec/issue-publication.ts`, `OfficeSnapshot`, `jira-time.ts`, `weekly-rollup.ts`, `candidate.ts`, `inspect-closed-plan.ts`, `office-lessons.ts`, `retrospective-subject.ts`, `remove-candidate.ts`, `scheduler.ts`, `it-specialist.ts`, `goal-reviews.ts`, `Effects`, `reader.ts`, `continue-ownership-read.ts`, `engine.ts`, `harnessEffect`, `discovery-recovery.ts`, `goal-reporting.ts`, `diagnostic-snapshot.ts`, `tracking-issue.ts`, `jira-operations.ts`, `ledger.ts`, `record-push.ts`, `blocker-followups.ts`, `time-readback.ts`, `retire-history.ts`, `continue-access-only-plan.ts`, `create-candidate.ts`, `continue-unsealed-qa.ts`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **Why does `Role` connect `worker-runtime.ts` to `github-delivery.ts`, `App.tsx`, `run-accounting.ts`, `Inspector.tsx`, `digest`, `Store`, `agents.ts`, `index.ts`, `ref_zod`, `PeoplePanel.tsx`, `Conversation.tsx`, `maintenance/maintenance.ts`, `Ticket`, `shared.ts`, `.emit`, `accept-stage-result.ts`, `OfficeScene.tsx`, `OfficeSnapshot`, `work.ts`, `retrospective-subject.ts`, `scheduler.ts`, `outbox.ts`, `diagnostic-snapshot.ts`, `scene-motion.ts`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `GitHubDelivery` connect `github-delivery.ts` to `completedExecution`, `currentAssignment`, `artifact`, `features.ts`, `ref_node_path`, `.emit`, `resume-provider-review.ts`, `digest`, `discovery-recovery.ts`, `notifications.ts`, `Store`, `.activeClaims`, `accept-stage-result.ts`, `source-amendment.ts`, `harnessEffect`, `workKey`, `continuation-evidence.ts`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _497 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `github-delivery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0427807486631016 - nodes in this community are weakly interconnected._
- **Should `currentAssignment` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._
- **Should `artifact` be split into smaller, more focused modules?**
  _Cohesion score 0.07269752220663861 - nodes in this community are weakly interconnected._