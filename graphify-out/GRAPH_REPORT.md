# Graph Report - office-session-context-incremental-nov14  (2026-11-14)

## Corpus Check
- 789 files · ~323,495 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3997 nodes · 18656 edges · 113 communities (103 shown, 10 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 601 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `052efa1a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Effects
- .save
- Inspector.tsx
- App.tsx
- Store
- artifact
- features.ts
- ref_node_path
- workKey
- Button
- requests.ts
- agents.ts
- daily-cto.ts
- source-amendment.ts
- session-bridge.ts
- config.ts
- index.tsx
- index.ts
- cec/issue-publication.ts
- currentAssignment
- reader.ts
- ref_zod
- github-delivery.ts
- accept-stage-result.ts
- worker-runtime.ts
- knowledge.ts
- PeoplePanel.tsx
- digest
- record-trigger.ts
- TimeBook.tsx
- run-retrospective.ts
- metadata-assessment.ts
- .transaction
- weekly-rollup.ts
- mutedCopy
- features/workflow.ts
- notifications.ts
- outbox.ts
- brain-maintenance.ts
- constellation-runtime.ts
- packed165-admission.ts
- lesson-selection.ts
- dependencies.ts
- publish-pr.ts
- process.ts
- enrollment-gate.ts
- run-accounting.ts
- time-scope.ts
- telemetry.ts
- OfficeScene.tsx
- CEC
- cost-ledger.ts
- ref_node_crypto
- shared.ts
- it-specialist.ts
- run.ts
- cec-reads.ts
- ticket-evidence.ts
- adopted-review-candidate.ts
- jira-time.ts
- work.ts
- .emit
- scheduled-work.ts
- blocker-followups.ts
- remove-candidate.ts
- queue-repairs.ts
- office-lessons.ts
- QuestionStepper.tsx
- Conversation.tsx
- activation-recovery.ts
- coordination.ts
- engine.ts
- Engine
- Coordinator
- validate-stage.ts
- assignment-poll.ts
- recovery-ledger.ts
- retrospective-subject.ts
- Offices
- node-visuals.ts
- jira-operations.ts
- candidate.ts
- ledger.ts
- scene-motion.ts
- intent.ts
- refresh-evidence.ts
- DailyCTO.tsx
- preferences-store.ts
- capture-session-clone.py
- RoomCamera.tsx
- report.ts
- cli.ts
- checkpoint-completion.ts
- merge-scanner-retry.ts
- time-readback.ts
- command-registry.ts
- display-scene.ts
- extract-worker.mjs
- codex-rollout.ts
- read-retries.ts
- pre-push-boundary.ts
- CommittedBrain
- run-evidence.ts
- install-service.mjs
- ProjectProgress
- unblock-brief.ts
- ITFollowUps.tsx
- server_delivery_harness_delivery_authority_resolvedeliverywork
- server_features_questions_pending_round_pendinground
- server_features_questions_pending_round_pendingrounds
- server_features_questions_pending_round_roundauthor
- src_shared_personas
- src_shared_workkey

## God Nodes (most connected - your core abstractions)
1. `Store` - 354 edges
2. `TicketJob` - 174 edges
3. `digest()` - 165 edges
4. `artifact()` - 129 edges
5. `GitHubDelivery` - 122 edges
6. `command()` - 110 edges
7. `workKey()` - 101 edges
8. `cx()` - 88 edges
9. `currentAssignment()` - 84 edges
10. `Button` - 84 edges

## Surprising Connections (you probably didn't know these)
- `apply()` --indirect_call--> `note()`  [INFERRED]
  src/conversations/OutboxSavedImplementation.tsx → server/cec/parking/resume-parked.ts
- `LessonBrainOverlap` --references--> `Lesson`  [EXTRACTED]
  server/knowledge/lesson-brain-audit.ts → src/contracts/knowledge.ts
- `DeliverySlot` --references--> `Role`  [EXTRACTED]
  server/office/projects.ts → src/shared.ts
- `projectOutbox()` --calls--> `deferredPickup()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/pickup-state.ts
- `projectOutbox()` --calls--> `parkedProviderWait()`  [EXTRACTED]
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

## Communities (113 total, 10 thin omitted)

### Community 0 - "Effects"
Cohesion: 0.06
Nodes (71): Lane, MOVABLE, resolveLane(), cardStatus(), Execute, ProjectCard, projectCards(), projectGraphql() (+63 more)

### Community 1 - ".save"
Cohesion: 0.06
Nodes (77): correlatedBuild(), applyIntakeObservation(), checkMail(), drainMail(), requestMail(), jiraCollection(), BLOCKED, findComment() (+69 more)

### Community 2 - "Inspector.tsx"
Cohesion: 0.10
Nodes (69): SendMessage, Outbox(), blockedSummary(), ServiceHealthPanel(), followUp(), labels, ServiceHealthRow(), BlockerFollowups() (+61 more)

### Community 3 - "App.tsx"
Cohesion: 0.05
Nodes (73): ref_lucide_react, ref_react_dom, compactSteps(), itAgent(), BrainDrawer(), themeColor, App(), BrainWorkspace (+65 more)

### Community 4 - "Store"
Cohesion: 0.05
Nodes (50): ref_node_sqlite, ref_smol_toml, admitImprovement(), improvementEligible(), improvementManifest(), improvementMarker(), improvementProvider(), linkedRepairGap() (+42 more)

### Community 5 - "artifact"
Cohesion: 0.07
Nodes (77): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+69 more)

### Community 6 - "features.ts"
Cohesion: 0.05
Nodes (66): ref_node_url, approveFeature(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), artifactPath(), digest() (+58 more)

### Community 7 - "ref_node_path"
Cohesion: 0.07
Nodes (60): ref_node_fs, ref_node_os, ref_node_path, ref_node_util, interruptedImplementation(), MISSING_SAVED_PLAN, allowed, candidateInput() (+52 more)

### Community 8 - "workKey"
Cohesion: 0.06
Nodes (68): recordJobApproach(), advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat(), continuationScope(), continuationWorktree() (+60 more)

### Community 9 - "Button"
Cohesion: 0.08
Nodes (54): ref_motion, ref_react, ref_react_markdown, ref_remark_gfm, ref_yaml, guidanceExcerpt(), Activity(), ActivityTimeline() (+46 more)

### Community 10 - "requests.ts"
Cohesion: 0.06
Nodes (56): boardPreflightCandidate(), Ownership, reconcileBoardPreflight(), savedActivationFailure(), beginPacked165Setup(), packed165SetupReady(), assertPostConflictFiles(), assertPostConflictOwnership() (+48 more)

### Community 11 - "agents.ts"
Cohesion: 0.06
Nodes (51): implementationWorkerContext(), cecPrompt(), resolvedDecisionNote(), stageInstructions, cecChatPrompt(), ctoChatPrompt(), itChatPrompt(), slackSendPrompt() (+43 more)

### Community 12 - "daily-cto.ts"
Cohesion: 0.05
Nodes (49): leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), collectCTOFacts(), DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts (+41 more)

### Community 13 - "source-amendment.ts"
Cohesion: 0.06
Nodes (68): ref_node_async_hooks, adoptCandidate(), reported, Scope, approvedText(), assert(), AMENDMENT_REVIEW_PROOF, amendmentInstruction() (+60 more)

### Community 14 - "session-bridge.ts"
Cohesion: 0.07
Nodes (50): ref_ws, claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexDaemonProcesses(), accountCodexProcesses(), codexProcessInventory (+42 more)

### Community 15 - "config.ts"
Cohesion: 0.12
Nodes (53): createFeature(), discoveryPrompt(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest (+45 more)

### Community 16 - "index.tsx"
Cohesion: 0.06
Nodes (47): ctoInputFailure(), OutboxCTOInput(), recover(), OutboxMaintenanceStatus(), OutboxSavedImplementation(), apply(), review(), OutboxSavedPlan() (+39 more)

### Community 17 - "index.ts"
Cohesion: 0.07
Nodes (46): ref_hono_node_server, ref_node_http, ref_vite, implementationPreview(), implementationContinuationRoute(), intakeLocation(), close(), config (+38 more)

### Community 18 - "cec/issue-publication.ts"
Cohesion: 0.09
Nodes (21): Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), Transition, descriptionPreimage(), plain() (+13 more)

### Community 19 - "currentAssignment"
Cohesion: 0.10
Nodes (43): deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), deliveryIntakeBlocker(), gateRegisteredDelivery(), resolveDeliveryWork(), resumeProviderReviews(), observe() (+35 more)

### Community 20 - "reader.ts"
Cohesion: 0.09
Nodes (35): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, GraphNode (+27 more)

### Community 21 - "ref_zod"
Cohesion: 0.08
Nodes (34): ref_zod, assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO() (+26 more)

### Community 22 - "github-delivery.ts"
Cohesion: 0.08
Nodes (30): HANDS_OFF_PROJECTS, harnessDelivers(), legacyRecovery(), BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction(), dependabotReviewGuidance() (+22 more)

### Community 23 - "accept-stage-result.ts"
Cohesion: 0.10
Nodes (46): containedFile(), findingsBlock(), handsOff(), acceptStageResult(), acceptConflictRepair(), deliveryNextStage(), hasUncertainEffects(), pendingPreparationCheck() (+38 more)

### Community 24 - "worker-runtime.ts"
Cohesion: 0.07
Nodes (36): candidateWorkspaceEnvironment(), assignmentSubject(), lessonPurpose(), selectLessons(), catalogLine(), assertBriefingScope(), CODEX_DEFAULT_EFFORT, CODEX_DEFAULT_MODEL (+28 more)

### Community 25 - "knowledge.ts"
Cohesion: 0.08
Nodes (36): clip(), DEMAND_LIMIT, demandFacts(), DemandSection, key(), LessonKey, notes(), Binding (+28 more)

### Community 26 - "PeoplePanel.tsx"
Cohesion: 0.10
Nodes (42): label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+34 more)

### Community 27 - "digest"
Cohesion: 0.12
Nodes (39): removeAdoptedClone(), pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), assertStoppedBaseAudit(), AuditRow, CoverageRow, Hash, Kind (+31 more)

### Community 28 - "record-trigger.ts"
Cohesion: 0.10
Nodes (42): BLOCKING, isBlocking(), baselineLearning(), LEARNING_BASELINES, maintainLearning(), busyMaintenanceIds(), clip(), maintenanceBlockedId() (+34 more)

### Community 29 - "TimeBook.tsx"
Cohesion: 0.10
Nodes (38): TelemetryReport, LiveAnchor, AzureBuild, src_shared_liveanchor, BreakdownTable(), CostBar(), coverage(), pricedLabel() (+30 more)

### Community 30 - "run-retrospective.ts"
Cohesion: 0.10
Nodes (37): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, blockingTrigger, brainOverlap, brainOverlapQuery(), clip() (+29 more)

### Community 31 - "metadata-assessment.ts"
Cohesion: 0.15
Nodes (34): activeEffectId(), admitPRMetadata(), assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema, savedMetadataAssessment(), validateSaved() (+26 more)

### Community 32 - ".transaction"
Cohesion: 0.12
Nodes (26): featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS, requestReplan(), reserveReplacement() (+18 more)

### Community 33 - "weekly-rollup.ts"
Cohesion: 0.09
Nodes (36): expireLearningPackets(), packetReferences(), learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), retire() (+28 more)

### Community 34 - "mutedCopy"
Cohesion: 0.16
Nodes (31): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS, PickupForm(), acceptPreferences() (+23 more)

### Community 35 - "features/workflow.ts"
Cohesion: 0.11
Nodes (18): featureById(), planPrompt(), Link, linkFeature(), FeatureErrorCode, RecoveryDecision, FeaturePublisher, publishFeature() (+10 more)

### Community 36 - "notifications.ts"
Cohesion: 0.10
Nodes (23): channelNoticeAuthorized(), ChannelSettings, notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR, plainSlackText() (+15 more)

### Community 37 - "outbox.ts"
Cohesion: 0.11
Nodes (27): ctoInputRecovered(), conversationResolved(), projectOutbox(), syncOutbox(), projectSlackDeliveries(), settleRequestedSlackReplacement(), Input, supersedeSlackDelivery() (+19 more)

### Community 38 - "brain-maintenance.ts"
Cohesion: 0.09
Nodes (23): BRAIN_DEPENDENCY_MERGES, Result, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice(), candidateOwner(), SETTLED (+15 more)

### Community 39 - "constellation-runtime.ts"
Cohesion: 0.09
Nodes (23): ref_3d_force_graph, ref_three, CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point (+15 more)

### Community 40 - "packed165-admission.ts"
Cohesion: 0.14
Nodes (28): DeliveryAuthorityInput, accounting, DeliverySubject, nonDelivery, originalReads, HarnessControl, admitPacked165(), history() (+20 more)

### Community 41 - "lesson-selection.ts"
Cohesion: 0.08
Nodes (29): lessonIssueBody(), lessonIssueMarker(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, LessonSelection, lessonText() (+21 more)

### Community 42 - "dependencies.ts"
Cohesion: 0.12
Nodes (28): MergeNotifications, reconcileNoticeConfirmations(), Admission, admit(), IntakeContext, WAIT_STATUSES, compatible(), dependencyCompletionKey() (+20 more)

### Community 43 - "publish-pr.ts"
Cohesion: 0.16
Nodes (26): moveLane(), harnessCloseout(), PASSING, verifyMergeActions(), requireDeliveryAuthority(), harnessEffect, assertDeliveryMayMutate(), retryRead() (+18 more)

### Community 44 - "process.ts"
Cohesion: 0.11
Nodes (21): ref_node_child_process, Read, inactivityWatch(), At, errno, GroupInventory, GroupProbe, LifecycleDiagnostic (+13 more)

### Community 45 - "enrollment-gate.ts"
Cohesion: 0.17
Nodes (26): dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), startPilot(), eligibility(), approvedDelivery(), bindDelivery() (+18 more)

### Community 46 - "run-accounting.ts"
Cohesion: 0.12
Nodes (31): BoundedRead, done(), readBoundedNoFollow(), readBoundedNoFollowSync(), reasonOf(), CompletionReader, codexHome(), createdAt() (+23 more)

### Community 47 - "time-scope.ts"
Cohesion: 0.14
Nodes (29): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), server_telemetry_billable_work_issue_key, isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence() (+21 more)

### Community 48 - "telemetry.ts"
Cohesion: 0.09
Nodes (29): CodexRollout, CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL (+21 more)

### Community 49 - "OfficeScene.tsx"
Cohesion: 0.16
Nodes (34): withoutElapsed(), Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk() (+26 more)

### Community 50 - "CEC"
Cohesion: 0.13
Nodes (27): az(), base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs(), fullActivePRs() (+19 more)

### Community 51 - "cost-ledger.ts"
Cohesion: 0.16
Nodes (26): captureCost(), server_telemetry_cost_entries_costcoveragesummary, costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress() (+18 more)

### Community 52 - "ref_node_crypto"
Cohesion: 0.19
Nodes (22): ref_node_crypto, commandFeature(), reviewQuestions(), assertQuestionVisibility(), applyHarnessAction(), HarnessActionInput, recoveryPreconditions(), recoveryTarget() (+14 more)

### Community 53 - "shared.ts"
Cohesion: 0.09
Nodes (22): DECISION_KINDS, needsDecision(), completedPRReviews(), APPROACH_GUARD_REJECTION, eligible(), mergedByOwner(), ownerSettles(), retireExternalDeliveries() (+14 more)

### Community 54 - "it-specialist.ts"
Cohesion: 0.13
Nodes (18): ITContext, publishITReport(), ITSpecialist, delays, recoverAttempt(), listenerHealth(), providers, ProviderStatusChecks (+10 more)

### Community 55 - "run.ts"
Cohesion: 0.13
Nodes (23): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_FIX_PROMPT, OfficeFixResult (+15 more)

### Community 56 - "cec-reads.ts"
Cohesion: 0.12
Nodes (18): IntakeBinding, intakeEnumeration(), intakeJql(), intakeMembership(), projectListScope(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt() (+10 more)

### Community 57 - "ticket-evidence.ts"
Cohesion: 0.16
Nodes (21): ref_node_string_decoder, assetDownloader(), attachmentKind(), evidenceDirectory(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS (+13 more)

### Community 58 - "adopted-review-candidate.ts"
Cohesion: 0.18
Nodes (17): adoptedReviewCandidate(), ciCheckout(), finishCISetup(), verifyCIHooks(), CIFailure, guardCIRepair(), prepareCIMetadataRepair(), CI_METADATA_CONSUMED (+9 more)

### Community 59 - "jira-time.ts"
Cohesion: 0.14
Nodes (21): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+13 more)

### Community 60 - "work.ts"
Cohesion: 0.11
Nodes (22): BLOCKED_CAUSES, blockedCauses(), projectReadiness(), ProjectReadiness, HistoryRetirement, HistoryRetirementIntent, AssignmentResult, BlockedCause (+14 more)

### Community 61 - ".emit"
Cohesion: 0.18
Nodes (22): decideImplementation(), configureChannelNotices(), configureNotices(), retryRecipientLookup(), recoverCTOInput(), enqueueGreen156(), failedWorker(), requeueWaitedImplement() (+14 more)

### Community 62 - "scheduled-work.ts"
Cohesion: 0.15
Nodes (22): deliverySlot(), withAmendmentOwnership(), gateFeatureWork(), requestPriority(), closedTicketRequest(), REOBSERVED, retiredFollowup(), STOPPED (+14 more)

### Community 63 - "blocker-followups.ts"
Cohesion: 0.18
Nodes (19): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), readBackConversations(), handoff(), reconcileBlockerFollowups(), distinct(), identity() (+11 more)

### Community 64 - "remove-candidate.ts"
Cohesion: 0.18
Nodes (18): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot() (+10 more)

### Community 65 - "queue-repairs.ts"
Cohesion: 0.21
Nodes (19): checksFailed(), checksPassed(), checksPending(), CurrentChecksWait, currentMergeChecks(), pass(), pending(), requireThat() (+11 more)

### Community 66 - "office-lessons.ts"
Cohesion: 0.13
Nodes (20): normalizeStatement(), decideOfficeProposal(), now(), OfficeKnowledgeStore, proposeOfficeLessons(), retireOfficeLesson(), Input, promoteNoteLesson() (+12 more)

### Community 67 - "QuestionStepper.tsx"
Cohesion: 0.19
Nodes (18): FeatureQuestionProjection, OutboxQuestionRound(), send(), draftKey(), readDraft(), saveDraft(), QuestionRound(), nextQuestion() (+10 more)

### Community 68 - "Conversation.tsx"
Cohesion: 0.19
Nodes (19): Conversation(), LessonDecisionAction, lessonDecisionState(), readLessonDecision(), OutboxLessonDecision(), act(), readStatus(), slackMessageStatus() (+11 more)

### Community 69 - "activation-recovery.ts"
Cohesion: 0.22
Nodes (23): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+15 more)

### Community 70 - "coordination.ts"
Cohesion: 0.16
Nodes (19): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), legacy, validateNativeContinuation(), checkpointWindow() (+11 more)

### Community 71 - "engine.ts"
Cohesion: 0.14
Nodes (11): AzureMonitor, GitHubMonitor, githubPRDescription(), GOAL_EVIDENCE_LIMITS, drainMaintenance(), reconcileMaintenance(), requestMaintenance(), officeCapacity (+3 more)

### Community 74 - "validate-stage.ts"
Cohesion: 0.18
Nodes (16): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+8 more)

### Community 75 - "assignment-poll.ts"
Cohesion: 0.20
Nodes (11): noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), admitReadyCards(), pinCourier, due(), unparkReleasedWaits(), resumeParked() (+3 more)

### Community 76 - "recovery-ledger.ts"
Cohesion: 0.20
Nodes (12): savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), assignmentDiagnostics(), diagnosticContext(), diagnosticSnapshot(), nativeDeliveryResolved() (+4 more)

### Community 77 - "retrospective-subject.ts"
Cohesion: 0.20
Nodes (14): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+6 more)

### Community 78 - "Offices"
Cohesion: 0.20
Nodes (4): mirrorOfficeKnowledge(), seedOfficeLessons(), Offices, markCaptureStart()

### Community 79 - "node-visuals.ts"
Cohesion: 0.20
Nodes (13): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+5 more)

### Community 80 - "jira-operations.ts"
Cohesion: 0.24
Nodes (9): CommentPage, commentReadback(), JiraOperations, plain(), jiraRecord(), unpack(), metadataDigest(), verifiedTransition() (+1 more)

### Community 81 - "candidate.ts"
Cohesion: 0.28
Nodes (13): GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles(), absent() (+5 more)

### Community 82 - "ledger.ts"
Cohesion: 0.33
Nodes (9): investigationCandidates(), investigationId(), investigationFollowUps(), investigationResolution(), syncInvestigations(), NOTIFY_HELPER, notifyHelperResolution(), retriedReadResolution() (+1 more)

### Community 83 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 84 - "intent.ts"
Cohesion: 0.19
Nodes (12): ContinuationIO, continueImplementation(), nativeIO, assertOwnership(), ImplementationDecision, OwnershipRead, assertCandidateIdle(), ImplementationContinuation (+4 more)

### Community 85 - "refresh-evidence.ts"
Cohesion: 0.30
Nodes (11): readEvidence(), ProviderEvidence, canonical(), evidenceDigest(), evidenceHash(), semantic(), stableUrl(), server_features_questions_recovery_question_recoveryquestion (+3 more)

### Community 86 - "DailyCTO.tsx"
Cohesion: 0.25
Nodes (11): CTOReview(), goalState, DailyCTO(), GoalHistory(), load(), reportDate(), reviewStatus, InlineText() (+3 more)

### Community 87 - "preferences-store.ts"
Cohesion: 0.19
Nodes (9): PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS, OfficePreferences (+1 more)

### Community 88 - "capture-session-clone.py"
Cohesion: 0.15
Nodes (10): ctypes, errno, importlib_util, json, os, pathlib, Copy a coherent macOS clone of inherited reader fd3 to anonymous target fd4. No…, Read-only protocol adapter for the installed review helper. No model dispatch. (+2 more)

### Community 89 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (10): ref_react_three_drei, ref_react_three_fiber, ref_three_stdlib, CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility (+2 more)

### Community 90 - "report.ts"
Cohesion: 0.29
Nodes (12): Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked(), row() (+4 more)

### Community 91 - "cli.ts"
Cohesion: 0.18
Nodes (9): ref_node_stream, ref_node_timers, args, [cmd,...rawArgs], commands, key, projectIndex, lessonBrainAudit (+1 more)

### Community 92 - "checkpoint-completion.ts"
Cohesion: 0.23
Nodes (7): BrainStatusSchema, identity, brainCheckpointCompletion(), coverageSchema, followupSchema, verified, reconcileCompletedCheckpoints()

### Community 93 - "merge-scanner-retry.ts"
Cohesion: 0.40
Nodes (9): officeMergeProvenance(), reconcileMergeScannerRetry(), Retry, retryMergeScanner(), retryReadBack(), runIdentity(), savedRetry(), transientScannerJobs() (+1 more)

### Community 94 - "time-readback.ts"
Cohesion: 0.29
Nodes (6): TimeLedger, dueReadback(), Readback, READBACK_INTERVAL_MS, readBackTime(), SETTLE_MS

### Community 95 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 96 - "display-scene.ts"
Cohesion: 0.33
Nodes (8): KnowledgeNode, DisplayNode, initialSelection, MapSelection, KnowledgeGroup, knowledgeGroups(), title(), titles

### Community 97 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (6): ref_mammoth, ref_pdfjs_dist, bounded(), extract(), fail(), [path,kind]

### Community 98 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 99 - "read-retries.ts"
Cohesion: 0.32
Nodes (7): PrerequisitesSchema, incompleteReadOutput(), IntakeResult, planReadRetry(), temporaryReadFailure(), WorkFailure, ReadRetry

### Community 100 - "pre-push-boundary.ts"
Cohesion: 0.43
Nodes (5): Event, one(), prePushRejection(), PushIdentity, settledPushBoundary()

### Community 102 - "run-evidence.ts"
Cohesion: 0.38
Nodes (5): comparable(), EvidenceOutcome, recordRunEvidence(), backfillClaudeCost(), RunAccounting

### Community 103 - "install-service.mjs"
Cohesion: 0.33
Nodes (4): file, folder, logs, root

### Community 105 - "unblock-brief.ts"
Cohesion: 0.53
Nodes (5): clearUnblockBrief(), key(), saveUnblockBrief(), unblockBrief, src_shared_learningsubject

### Community 106 - "ITFollowUps.tsx"
Cohesion: 0.67
Nodes (4): itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps()

## Knowledge Gaps
- **490 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+485 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 632 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `Effects`, `.save`, `artifact`, `features.ts`, `ref_node_path`, `workKey`, `requests.ts`, `agents.ts`, `daily-cto.ts`, `source-amendment.ts`, `session-bridge.ts`, `config.ts`, `index.tsx`, `index.ts`, `cec/issue-publication.ts`, `currentAssignment`, `reader.ts`, `ref_zod`, `github-delivery.ts`, `accept-stage-result.ts`, `worker-runtime.ts`, `knowledge.ts`, `digest`, `record-trigger.ts`, `run-retrospective.ts`, `metadata-assessment.ts`, `.transaction`, `weekly-rollup.ts`, `features/workflow.ts`, `notifications.ts`, `outbox.ts`, `brain-maintenance.ts`, `packed165-admission.ts`, `lesson-selection.ts`, `dependencies.ts`, `publish-pr.ts`, `process.ts`, `enrollment-gate.ts`, `run-accounting.ts`, `time-scope.ts`, `CEC`, `cost-ledger.ts`, `ref_node_crypto`, `shared.ts`, `it-specialist.ts`, `run.ts`, `cec-reads.ts`, `ticket-evidence.ts`, `jira-time.ts`, `.emit`, `scheduled-work.ts`, `blocker-followups.ts`, `remove-candidate.ts`, `office-lessons.ts`, `activation-recovery.ts`, `coordination.ts`, `engine.ts`, `Engine`, `validate-stage.ts`, `assignment-poll.ts`, `recovery-ledger.ts`, `retrospective-subject.ts`, `Offices`, `jira-operations.ts`, `candidate.ts`, `ledger.ts`, `intent.ts`, `refresh-evidence.ts`, `checkpoint-completion.ts`, `time-readback.ts`, `read-retries.ts`, `run-evidence.ts`, `ProjectProgress`?**
  _High betweenness centrality (0.104) - this node is a cross-community bridge._
- **Why does `Engine` connect `Engine` to `Effects`, `.save`, `Store`, `requests.ts`, `agents.ts`, `config.ts`, `ref_zod`, `github-delivery.ts`, `accept-stage-result.ts`, `features/workflow.ts`, `notifications.ts`, `brain-maintenance.ts`, `enrollment-gate.ts`, `cec-reads.ts`, `scheduled-work.ts`, `coordination.ts`, `engine.ts`, `Offices`, `jira-operations.ts`, `intent.ts`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `TicketJob` connect `github-delivery.ts` to `Effects`, `.save`, `App.tsx`, `Store`, `artifact`, `ref_node_path`, `workKey`, `Button`, `requests.ts`, `agents.ts`, `daily-cto.ts`, `source-amendment.ts`, `currentAssignment`, `accept-stage-result.ts`, `worker-runtime.ts`, `digest`, `record-trigger.ts`, `metadata-assessment.ts`, `packed165-admission.ts`, `dependencies.ts`, `publish-pr.ts`, `enrollment-gate.ts`, `shared.ts`, `it-specialist.ts`, `adopted-review-candidate.ts`, `remove-candidate.ts`, `queue-repairs.ts`, `activation-recovery.ts`, `validate-stage.ts`, `assignment-poll.ts`, `retrospective-subject.ts`, `merge-scanner-retry.ts`, `ProjectProgress`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _490 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Effects` be split into smaller, more focused modules?**
  _Cohesion score 0.05819079527420208 - nodes in this community are weakly interconnected._
- **Should `.save` be split into smaller, more focused modules?**
  _Cohesion score 0.05948295584534431 - nodes in this community are weakly interconnected._
- **Should `Inspector.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09630668536699392 - nodes in this community are weakly interconnected._