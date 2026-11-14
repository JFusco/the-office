# Graph Report - office-session-capture-nov13  (2026-11-13)

## Corpus Check
- 768 files · ~315,248 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3915 nodes · 18267 edges · 110 communities (100 shown, 10 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 590 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4803b20f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- source-amendment.ts
- dependency-bots/adopt.ts
- Button
- features.ts
- session-scope.ts
- assignments.ts
- workKey
- agents.ts
- Inspector.tsx
- ControlStore
- mutedCopy
- github-readiness.ts
- publish-pr.ts
- App.tsx
- effects.ts
- requests.ts
- worker-runtime.ts
- github-delivery.ts
- completedExecution
- run-retrospective.ts
- config.ts
- knowledge.ts
- work.ts
- TicketJob
- packed165-admission.ts
- TimeBook.tsx
- closeout-recovery.ts
- Store
- PeoplePanel.tsx
- index.ts
- index.tsx
- ref_zod
- maintenance/maintenance.ts
- dependencies.ts
- weekly-rollup.ts
- adopted-review-candidate.ts
- ref_node_path
- ticket-evidence.ts
- it-specialist.ts
- artifact
- github-check-selection.ts
- engine.ts
- record-trigger.ts
- OfficeScene.tsx
- scheduled-captures.ts
- Role
- QuestionStepper.tsx
- .save
- outbox.ts
- time-scope.ts
- cost-ledger.ts
- run-accounting.ts
- .emit
- knowledge-views.ts
- run.ts
- demand-facts.ts
- sanitizeObject
- shared.ts
- ref_node_crypto
- lesson-selection.ts
- local-config.ts
- blocker-followups.ts
- link-draft-issue.ts
- digest
- Goals.tsx
- Coordinator
- scheduled-work.ts
- service-health.ts
- remove-candidate.ts
- constellation-runtime.ts
- Engine
- cec/issue-publication.ts
- cec/workflow.ts
- fact-bounds.ts
- daily-cto.ts
- accept-retrospective.ts
- control-store.ts
- Offices
- retrospective-subject.ts
- jira-time.ts
- owned-artifact.ts
- node-visuals.ts
- session-bridge.ts
- contract.ts
- scene-motion.ts
- session-context-file.ts
- assignment-poll.ts
- preferences-store.ts
- capture-session-clone.py
- cli.ts
- RoomCamera.tsx
- validate-stage.ts
- coordination.ts
- install-service.mjs
- report.ts
- session-coverage.ts
- command-registry.ts
- leadership.ts
- checkpoint-completion.ts
- CommittedBrain
- office-state-view.ts
- extract-worker.mjs
- live-reach.ts
- queue-maintenance-notice.ts
- server_delivery_harness_delivery_authority_resolvedeliverywork
- server_features_questions_pending_round_pendinground
- server_features_questions_pending_round_pendingrounds
- server_features_questions_pending_round_roundauthor
- src_shared_personas
- src_shared_workkey

## God Nodes (most connected - your core abstractions)
1. `Store` - 345 edges
2. `TicketJob` - 174 edges
3. `digest()` - 160 edges
4. `artifact()` - 129 edges
5. `GitHubDelivery` - 122 edges
6. `command()` - 108 edges
7. `workKey()` - 99 edges
8. `cx()` - 88 edges
9. `currentAssignment()` - 82 edges
10. `Button` - 82 edges

## Surprising Connections (you probably didn't know these)
- `DeliveryAuthorityInput` --references--> `HarnessRequest`  [EXTRACTED]
  server/delivery/harness/delivery-authority.ts → src/contracts/work.ts
- `LessonBrainOverlap` --references--> `Lesson`  [EXTRACTED]
  server/knowledge/lesson-brain-audit.ts → src/contracts/knowledge.ts
- `projectOutbox()` --calls--> `parkedProviderWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts
- `projectOutbox()` --calls--> `readinessWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts
- `replacementContext()` --calls--> `slackMessageUrl()`  [EXTRACTED]
  server/conversations/slack/supersession-proof.ts → src/shared.ts

## Import Cycles
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/parking/resume-provider-review.ts -> server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/parking/resume-provider-review.ts`
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

## Communities (110 total, 10 thin omitted)

### Community 0 - "source-amendment.ts"
Cohesion: 0.05
Nodes (97): adoptCandidate(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat() (+89 more)

### Community 1 - "dependency-bots/adopt.ts"
Cohesion: 0.07
Nodes (59): cardStatus(), Execute, ProjectCard, projectCards(), projectGraphql(), setCardStatus(), statusField, readBackOrThrow() (+51 more)

### Community 2 - "Button"
Cohesion: 0.08
Nodes (57): ref_lucide_react, ref_react, ref_react_markdown, ref_remark_gfm, ref_yaml, Activity(), ActivityTimeline(), AssignmentKnowledge() (+49 more)

### Community 3 - "features.ts"
Cohesion: 0.06
Nodes (65): approveFeature(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), artifactPath(), digest(), document() (+57 more)

### Community 4 - "session-scope.ts"
Cohesion: 0.17
Nodes (14): readTranscript, root, claudeSessionScope(), readRollout, ContextProject, ContextReader, retainSessionMessage(), SessionConversation (+6 more)

### Community 5 - "assignments.ts"
Cohesion: 0.07
Nodes (43): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, GraphNode (+35 more)

### Community 6 - "workKey"
Cohesion: 0.08
Nodes (47): containedFile(), recordJobApproach(), continuationScope(), continuationGuard(), Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate() (+39 more)

### Community 7 - "agents.ts"
Cohesion: 0.08
Nodes (41): intakeMembership(), cecPrompt(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), resolvedDecisionNote(), stageInstructions (+33 more)

### Community 8 - "Inspector.tsx"
Cohesion: 0.15
Nodes (51): blockedSummary(), ServiceHealthPanel(), followUp(), labels, ServiceHealthRow(), BlockerFollowups(), LearningCoverage(), LessonsPanel() (+43 more)

### Community 9 - "ControlStore"
Cohesion: 0.18
Nodes (5): DailyCTO, Briefing, saveReviewBriefing(), ControlStore, DailyCTOReport

### Community 10 - "mutedCopy"
Cohesion: 0.16
Nodes (31): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS, PickupForm(), acceptPreferences() (+23 more)

### Community 11 - "github-readiness.ts"
Cohesion: 0.08
Nodes (48): findingsBlock(), resume(), resumeProviderReviews(), acceptConflictRepair(), APPROACH_GUIDANCE, nextJobStage(), reviewInstructions(), deliveryTask() (+40 more)

### Community 12 - "publish-pr.ts"
Cohesion: 0.11
Nodes (50): activeEffectId(), harnessEffect, retryRead(), runHarnessStage(), admitPRMetadata(), METADATA_FINDING, assessPRMetadata(), captureAssessment() (+42 more)

### Community 13 - "App.tsx"
Cohesion: 0.05
Nodes (71): ref_motion, ref_react_dom, itAgent(), itDiagnostics(), BrainDrawer(), themeColor, App(), BrainWorkspace (+63 more)

### Community 14 - "effects.ts"
Cohesion: 0.13
Nodes (15): featureById(), Link, linkFeature(), FeaturePublisher, publishFeature(), reconcilePublication(), uncertainPublications(), reserveIdentity() (+7 more)

### Community 15 - "requests.ts"
Cohesion: 0.10
Nodes (48): boardPreflightCandidate(), reconcileBoardPreflight(), savedActivationFailure(), savedCandidateAdmission, hasSavedPrerequisiteResult(), beginPacked165Setup(), packed165SetupReady(), assertPostConflictFiles() (+40 more)

### Community 16 - "worker-runtime.ts"
Cohesion: 0.06
Nodes (46): candidateWorkspaceEnvironment(), ApproachSchema, assignmentSubject(), dispatchExposure(), prepareExposure(), lessonPurpose(), selectLessons(), catalogLine() (+38 more)

### Community 17 - "github-delivery.ts"
Cohesion: 0.09
Nodes (37): Lane, MOVABLE, moveLane(), resolveLane(), ProjectProgress, deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility() (+29 more)

### Community 18 - "completedExecution"
Cohesion: 0.09
Nodes (44): closeoutRequestResolved(), admitGreen156(), GREEN156, green156Admitted(), green156Subject(), retainedGreen156Audit(), savedAdmissionUnresolved(), completedConflictDraftUnresolved() (+36 more)

### Community 19 - "run-retrospective.ts"
Cohesion: 0.11
Nodes (34): BLOCKING, blockingTrigger, isBlocking(), brainOverlap, brainOverlapQuery(), clip(), fits(), withBrainOverlap() (+26 more)

### Community 20 - "config.ts"
Cohesion: 0.11
Nodes (32): ref_node_url, featureItemComplete(), reconcileFeatureCompletion(), discoveryPrompt(), planPrompt(), helperTelemetry(), reserveReplacement(), stageBudget() (+24 more)

### Community 21 - "knowledge.ts"
Cohesion: 0.08
Nodes (32): BRAIN_SCOPE, SUBJECT, Kind, RetrospectiveResult, RetrospectiveResultSchema, RollupResultSchema, Stage, BlockerFollowup (+24 more)

### Community 22 - "work.ts"
Cohesion: 0.11
Nodes (21): BLOCKED_CAUSES, blockedCauses(), projectReadiness(), ProjectReadiness, HistoryRetirement, HistoryRetirementIntent, AssignmentResult, BlockedCause (+13 more)

### Community 23 - "TicketJob"
Cohesion: 0.10
Nodes (12): dependabotReviewGuidance(), StageContext, GitHubDelivery, stageRole(), implementationContinuationInstruction(), retireInactiveDeliveries(), retireUnstartedDelivery(), unstartedDelivery() (+4 more)

### Community 24 - "packed165-admission.ts"
Cohesion: 0.14
Nodes (29): accounting, DeliverySubject, nonDelivery, originalReads, HarnessControl, withHarnessWork(), admitPacked165(), history() (+21 more)

### Community 25 - "TimeBook.tsx"
Cohesion: 0.10
Nodes (38): AzureBuild, src_shared_liveanchor, ROLE_NAMES, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens() (+30 more)

### Community 26 - "closeout-recovery.ts"
Cohesion: 0.09
Nodes (52): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+44 more)

### Community 27 - "Store"
Cohesion: 0.05
Nodes (38): verifyFeatureEnhance(), approvedDelivery(), featureDeliveryContext(), GitHubFeaturePublisher, JiraFeaturePublisher, FeatureErrorCode, RecoveryDecision, QuestionNotifications (+30 more)

### Community 28 - "PeoplePanel.tsx"
Cohesion: 0.11
Nodes (38): Department, DEPARTMENTS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS, Directory() (+30 more)

### Community 29 - "index.ts"
Cohesion: 0.08
Nodes (36): ref_hono_node_server, ref_node_http, ref_vite, close(), config, itSpecialist, loadedRevision, offices (+28 more)

### Community 30 - "index.tsx"
Cohesion: 0.08
Nodes (46): Conversation(), SendMessage, LessonDecisionAction, lessonDecisionState(), readLessonDecision(), Outbox(), ctoInputFailure(), OutboxCTOInput() (+38 more)

### Community 31 - "ref_zod"
Cohesion: 0.08
Nodes (32): ref_zod, assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO() (+24 more)

### Community 32 - "maintenance/maintenance.ts"
Cohesion: 0.10
Nodes (27): maintenancePolicies(), captureMaintenanceStep(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, candidateOwner(), SETTLED, skipOwnedCandidate() (+19 more)

### Community 33 - "dependencies.ts"
Cohesion: 0.12
Nodes (18): reconcileNoticeConfirmations(), compatible(), dependencyCompletionKey(), issueKey(), observePrerequisites(), PrerequisiteSchema, PrerequisitesSchema, validatePrerequisites() (+10 more)

### Community 34 - "weekly-rollup.ts"
Cohesion: 0.14
Nodes (25): learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), retire(), RETROSPECTIVE_TIMEOUT, lastFriday() (+17 more)

### Community 35 - "adopted-review-candidate.ts"
Cohesion: 0.18
Nodes (18): removeAdoptedClone(), adoptedReviewCandidate(), ciCheckout(), finishCISetup(), verifyCIHooks(), CIFailure, guardCIRepair(), prepareCIMetadataRepair() (+10 more)

### Community 36 - "ref_node_path"
Cohesion: 0.09
Nodes (48): ref_node_fs, ref_node_os, ref_node_path, ref_node_util, allowed, continuationNativeReview(), continuationWorkerProof(), negativeWorker() (+40 more)

### Community 37 - "ticket-evidence.ts"
Cohesion: 0.14
Nodes (28): assetDownloader(), attachmentKind(), evidenceDirectory(), readEvidence(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS (+20 more)

### Community 38 - "it-specialist.ts"
Cohesion: 0.25
Nodes (11): ITContext, publishITReport(), delays, recoverAttempt(), itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps() (+3 more)

### Community 39 - "artifact"
Cohesion: 0.12
Nodes (45): ref_node_async_hooks, acceptStageResult(), mergeAuthorized(), verifiedCloseoutCleanupRequest(), assertContinuationWorker(), continuationReviewArtifacts(), continuationWorktree(), reconcileContinuationReview() (+37 more)

### Community 40 - "github-check-selection.ts"
Cohesion: 0.14
Nodes (28): checksFailed(), checksPassed(), checksPending(), CurrentChecksWait, currentMergeChecks(), pass(), pending(), requireThat() (+20 more)

### Community 41 - "engine.ts"
Cohesion: 0.14
Nodes (30): dispatchNightly(), drainDelivery(), enableNightly(), resume(), startPilot(), MISSING_SAVED_PLAN, recoverSavedPlan(), advance() (+22 more)

### Community 42 - "record-trigger.ts"
Cohesion: 0.10
Nodes (40): baselineLearning(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences(), clip(), maintenanceBlockedId(), MaintenanceCandidate (+32 more)

### Community 43 - "OfficeScene.tsx"
Cohesion: 0.17
Nodes (32): Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk(), ElevatorStage() (+24 more)

### Community 44 - "scheduled-captures.ts"
Cohesion: 0.15
Nodes (46): requestDelivery(), createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest (+38 more)

### Community 45 - "Role"
Cohesion: 0.10
Nodes (24): ref_smol_toml, ROLES, file, project, root, DeliverySlot, officeCapacity, PROJECTS (+16 more)

### Community 46 - "QuestionStepper.tsx"
Cohesion: 0.19
Nodes (18): FeatureQuestionProjection, OutboxQuestionRound(), send(), draftKey(), readDraft(), saveDraft(), QuestionRound(), nextQuestion() (+10 more)

### Community 47 - ".save"
Cohesion: 0.06
Nodes (55): BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue(), readIssues(), commentDecision() (+47 more)

### Community 48 - "outbox.ts"
Cohesion: 0.09
Nodes (30): ctoInputRecovered(), conversationResolved(), projectOutbox(), syncOutbox(), finishSupersededReadback(), projectSlackDeliveries(), Input, supersedeSlackDelivery() (+22 more)

### Community 49 - "time-scope.ts"
Cohesion: 0.20
Nodes (22): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), ticketDayTotals(), captureTime() (+14 more)

### Community 50 - "cost-ledger.ts"
Cohesion: 0.13
Nodes (31): server_telemetry_billable_work_issue_key, captureCost(), server_telemetry_cost_entries_costcoveragesummary, costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress() (+23 more)

### Community 51 - "run-accounting.ts"
Cohesion: 0.06
Nodes (56): BoundedRead, add(), CodexRequest, CodexRollout, CodexTokens, FIELDS, codexHome(), createdAt() (+48 more)

### Community 52 - ".emit"
Cohesion: 0.13
Nodes (30): configureChannelNotices(), configureNotices(), noticeState(), retryRecipientLookup(), recoverCTOInput(), enqueueGreen156(), DiscoveryResumeInput, enqueueMetadataRecovery() (+22 more)

### Community 53 - "knowledge-views.ts"
Cohesion: 0.19
Nodes (17): KnowledgeActivity, KnowledgeEdge, KnowledgeMap, KnowledgeNode, connectionSummary(), ConstellationView, DisplayNode, displayScene() (+9 more)

### Community 54 - "run.ts"
Cohesion: 0.15
Nodes (23): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationCandidates(), investigationId(), investigationFollowUps(), investigationResolution(), syncInvestigations(), OFFICE_FIX_PROMPT (+15 more)

### Community 55 - "demand-facts.ts"
Cohesion: 0.13
Nodes (20): clip(), DEMAND_LIMIT, demandFacts(), DemandSection, key(), LessonKey, notes(), clip() (+12 more)

### Community 56 - "sanitizeObject"
Cohesion: 0.09
Nodes (33): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+25 more)

### Community 57 - "shared.ts"
Cohesion: 0.08
Nodes (33): Admission, IntakeContext, WAIT_STATUSES, DependencyStores, completedPRReviews(), eligible(), mergedByOwner(), ownerSettles() (+25 more)

### Community 58 - "ref_node_crypto"
Cohesion: 0.16
Nodes (26): ref_node_crypto, commandFeature(), reviewQuestions(), assertQuestionVisibility(), applyHarnessAction(), HarnessActionInput, recoveryPreconditions(), recoveryTarget() (+18 more)

### Community 59 - "lesson-selection.ts"
Cohesion: 0.10
Nodes (26): fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, LessonSelection (+18 more)

### Community 60 - "local-config.ts"
Cohesion: 0.25
Nodes (12): IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), projectListScope(), AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), goalEvidencePath() (+4 more)

### Community 61 - "blocker-followups.ts"
Cohesion: 0.23
Nodes (16): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), readBackConversations(), handoff(), reconcileBlockerFollowups(), improvementIntakeGate(), captureLearning() (+8 more)

### Community 62 - "link-draft-issue.ts"
Cohesion: 0.26
Nodes (14): draftReadHeadMatches(), harnessDraft(), assertDraftClaimHistory(), linkDraftIssue(), protectedOriginalClaim(), publicationReadArgs(), Read, readPublication() (+6 more)

### Community 63 - "digest"
Cohesion: 0.10
Nodes (41): pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), Candidate, recordedPush(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration() (+33 more)

### Community 64 - "Goals.tsx"
Cohesion: 0.08
Nodes (36): recover(), OutboxSavedPlan(), reconcile(), FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), send() (+28 more)

### Community 66 - "scheduled-work.ts"
Cohesion: 0.13
Nodes (23): deliverySlot(), withAmendmentOwnership(), gateFeatureWork(), RollupResult, RollupHooks, requestPriority(), deterministicActions, eligible() (+15 more)

### Community 67 - "service-health.ts"
Cohesion: 0.13
Nodes (14): assignmentDiagnostics(), diagnosticContext(), diagnosticSnapshot(), nativeDeliveryResolved(), listenerHealth(), providers, ProviderStatusChecks, summary (+6 more)

### Community 68 - "remove-candidate.ts"
Cohesion: 0.13
Nodes (24): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot() (+16 more)

### Community 69 - "constellation-runtime.ts"
Cohesion: 0.10
Nodes (22): ref_3d_force_graph, ref_three, CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point (+14 more)

### Community 70 - "Engine"
Cohesion: 0.09
Nodes (5): correlatedBuild(), Engine, observe(), observeParked(), parkedReadError

### Community 71 - "cec/issue-publication.ts"
Cohesion: 0.13
Nodes (16): CommentPage, commentReadback(), Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), Transition (+8 more)

### Community 72 - "cec/workflow.ts"
Cohesion: 0.11
Nodes (38): applyIntakeObservation(), checkMail(), drainMail(), requestMail(), parksInJira(), MISSING_INTAKE, reconcileMailbox(), unusedMailbox() (+30 more)

### Community 73 - "fact-bounds.ts"
Cohesion: 0.25
Nodes (15): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+7 more)

### Community 74 - "daily-cto.ts"
Cohesion: 0.16
Nodes (15): EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), queueGoalEvidenceRequest(), applyGoalReview(), DailyResultSchema, EvidenceRefSchema, FreshDailyResultSchema (+7 more)

### Community 75 - "accept-retrospective.ts"
Cohesion: 0.13
Nodes (25): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, admitImprovement(), improvementEligible(), curateLesson(), Curation (+17 more)

### Community 76 - "control-store.ts"
Cohesion: 0.18
Nodes (10): ref_node_sqlite, Clock, applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, statementCache(), initialSnapshot() (+2 more)

### Community 78 - "retrospective-subject.ts"
Cohesion: 0.16
Nodes (18): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, maintenanceKey(), azurePrUrl(), findSubject(), jobSubject() (+10 more)

### Community 79 - "jira-time.ts"
Cohesion: 0.14
Nodes (20): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+12 more)

### Community 80 - "owned-artifact.ts"
Cohesion: 0.20
Nodes (15): investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, NOTIFY_HELPER, notifyHelperResolution(), OFFICE_SOURCE_PATHS, officeSource() (+7 more)

### Community 81 - "node-visuals.ts"
Cohesion: 0.20
Nodes (13): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+5 more)

### Community 82 - "session-bridge.ts"
Cohesion: 0.19
Nodes (14): ref_ws, claudeSessionContext(), codexDaemonProcesses(), codexSessionContext(), idleExecServers(), isExecServer(), processTable, claudeSessions() (+6 more)

### Community 83 - "contract.ts"
Cohesion: 0.16
Nodes (16): Event, one(), prePushRejection(), PushIdentity, settledPushBoundary(), At, errno, GroupInventory (+8 more)

### Community 84 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 85 - "session-context-file.ts"
Cohesion: 0.34
Nodes (8): captureSessionContextClone(), sessionContextFile(), ContextReadChanged, MAX_CONTEXT_READ_MS, sameContextFile(), sessionContextLines(), SessionContextParser, withSessionContextSnapshot()

### Community 86 - "assignment-poll.ts"
Cohesion: 0.13
Nodes (19): queueMergeNotice(), observeGitHubMergeNotices(), admit(), admitReadyCards(), pinCourier, wikiSync, due(), MAX_RELEASE_UNPARKS (+11 more)

### Community 87 - "preferences-store.ts"
Cohesion: 0.19
Nodes (9): PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS, OfficePreferences (+1 more)

### Community 88 - "capture-session-clone.py"
Cohesion: 0.15
Nodes (10): ctypes, errno, importlib_util, json, os, pathlib, Copy a coherent macOS clone of inherited reader fd3 to anonymous target fd4. No…, Read-only protocol adapter for the installed review helper. No model dispatch. (+2 more)

### Community 89 - "cli.ts"
Cohesion: 0.18
Nodes (9): ref_node_stream, ref_node_timers, args, [cmd,...rawArgs], commands, key, projectIndex, lessonBrainAudit (+1 more)

### Community 90 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (10): ref_react_three_drei, ref_react_three_fiber, ref_three_stdlib, CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility (+2 more)

### Community 91 - "validate-stage.ts"
Cohesion: 0.21
Nodes (14): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+6 more)

### Community 92 - "coordination.ts"
Cohesion: 0.16
Nodes (19): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), legacy, validateNativeContinuation(), checkpointWindow() (+11 more)

### Community 93 - "install-service.mjs"
Cohesion: 0.15
Nodes (9): ref_node_child_process, ref_node_string_decoder, file, folder, logs, root, extractDocument, Extraction (+1 more)

### Community 94 - "report.ts"
Cohesion: 0.22
Nodes (15): TelemetryReport, TelemetryRow, TelemetrySync, Acc, bump(), EASTERN, easternDay(), modelShares() (+7 more)

### Community 95 - "session-coverage.ts"
Cohesion: 0.27
Nodes (10): accountCodexProcesses(), codexProcessInventory, DesktopSessions, unaccountedProcesses(), LiveSession, completeSessionCoverage(), desktopCoverageGap(), knownActivity() (+2 more)

### Community 96 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 97 - "leadership.ts"
Cohesion: 0.20
Nodes (8): DailyCTOBriefing, DailyCTOResult, DailyCTOSummary, DailyGoalUpdate, GoalEvidenceRef, GoalEvidenceRequest, GoalProgress, GoalStatus

### Community 98 - "checkpoint-completion.ts"
Cohesion: 0.23
Nodes (7): BrainStatusSchema, identity, brainCheckpointCompletion(), coverageSchema, followupSchema, verified, reconcileCompletedCheckpoints()

### Community 100 - "office-state-view.ts"
Cohesion: 0.60
Nodes (4): leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore()

### Community 101 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (6): ref_mammoth, ref_pdfjs_dist, bounded(), extract(), fail(), [path,kind]

### Community 102 - "live-reach.ts"
Cohesion: 0.47
Nodes (5): GIT_NETWORK, LIVE_PROVIDERS, liveReach(), networkUrl(), remoteUrls()

## Knowledge Gaps
- **481 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+476 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 621 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `source-amendment.ts`, `dependency-bots/adopt.ts`, `features.ts`, `assignments.ts`, `workKey`, `agents.ts`, `github-readiness.ts`, `publish-pr.ts`, `App.tsx`, `effects.ts`, `requests.ts`, `worker-runtime.ts`, `github-delivery.ts`, `completedExecution`, `run-retrospective.ts`, `config.ts`, `TicketJob`, `packed165-admission.ts`, `closeout-recovery.ts`, `index.ts`, `ref_zod`, `maintenance/maintenance.ts`, `dependencies.ts`, `weekly-rollup.ts`, `ref_node_path`, `ticket-evidence.ts`, `it-specialist.ts`, `artifact`, `engine.ts`, `record-trigger.ts`, `scheduled-captures.ts`, `Role`, `.save`, `outbox.ts`, `time-scope.ts`, `cost-ledger.ts`, `run-accounting.ts`, `.emit`, `run.ts`, `demand-facts.ts`, `sanitizeObject`, `shared.ts`, `ref_node_crypto`, `lesson-selection.ts`, `blocker-followups.ts`, `link-draft-issue.ts`, `digest`, `Coordinator`, `scheduled-work.ts`, `service-health.ts`, `remove-candidate.ts`, `Engine`, `cec/issue-publication.ts`, `cec/workflow.ts`, `daily-cto.ts`, `accept-retrospective.ts`, `control-store.ts`, `Offices`, `retrospective-subject.ts`, `jira-time.ts`, `owned-artifact.ts`, `session-bridge.ts`, `assignment-poll.ts`, `validate-stage.ts`, `coordination.ts`, `checkpoint-completion.ts`, `office-state-view.ts`, `queue-maintenance-notice.ts`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **Why does `sanitizeObject()` connect `sanitizeObject` to `ref_node_path`, `agents.ts`, `artifact`, `ControlStore`, `control-store.ts`, `.save`, `owned-artifact.ts`, `worker-runtime.ts`, `completedExecution`, `Store`, `index.ts`, `ref_zod`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Why does `Role` connect `Role` to `agents.ts`, `Inspector.tsx`, `github-readiness.ts`, `App.tsx`, `worker-runtime.ts`, `github-delivery.ts`, `work.ts`, `TicketJob`, `packed165-admission.ts`, `Store`, `PeoplePanel.tsx`, `index.tsx`, `ref_zod`, `maintenance/maintenance.ts`, `artifact`, `OfficeScene.tsx`, `outbox.ts`, `run-accounting.ts`, `.emit`, `shared.ts`, `service-health.ts`, `cec/workflow.ts`, `retrospective-subject.ts`, `scene-motion.ts`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _481 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `source-amendment.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.04919767236818903 - nodes in this community are weakly interconnected._
- **Should `dependency-bots/adopt.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06869254341164453 - nodes in this community are weakly interconnected._
- **Should `Button` be split into smaller, more focused modules?**
  _Cohesion score 0.07777777777777778 - nodes in this community are weakly interconnected._