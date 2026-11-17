# Graph Report - the-office  (2026-11-16)

## Corpus Check
- 846 files · ~335,346 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4132 nodes · 18999 edges · 114 communities (107 shown, 7 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 612 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `fab37aff`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Button
- PeoplePanel.tsx
- dependency-bots/adopt.ts
- ref_node_crypto
- Inspector.tsx
- requests.ts
- session-bridge.ts
- ref_react
- ref_node_path
- Engine
- worker-runtime.ts
- github-delivery.ts
- App.tsx
- features/workflow.ts
- assignments.ts
- scheduled-captures.ts
- run-retrospective.ts
- record-trigger.ts
- .emit
- config.ts
- harnessEffect
- GitHubDelivery
- QuestionStepper.tsx
- telemetry.ts
- knowledge.ts
- maintenance/maintenance.ts
- cost-ledger.ts
- activation-recovery.ts
- index.tsx
- jira-time.ts
- digest
- agents.ts
- conversations/conversations.ts
- DailyCTO.tsx
- azure.ts
- continuation-review-readback.ts
- scheduled-work.ts
- Role
- closeout-recovery.ts
- projects.ts
- assignment-poll.ts
- time-scope.ts
- node-visuals.ts
- ledger.ts
- intent.ts
- knowledge-views.ts
- OfficeScene.tsx
- github.ts
- workKey
- demand-facts.ts
- MaintenanceRun
- scene-motion.ts
- blocker-followups.ts
- cec.ts
- work.ts
- weekly-rollup.ts
- cec/issue-publication.ts
- TimeBook.tsx
- JiraIssuePublisher
- Store
- offices.ts
- run.ts
- interrupted-work-recovery.ts
- delivery-repairs.ts
- ticket-evidence.ts
- run-accounting.ts
- tracking-issue.ts
- pilot-delivery.ts
- continue-ownership-read.ts
- it-specialist.ts
- constellation-runtime.ts
- contract.ts
- RoomCamera.tsx
- report.ts
- service-health.ts
- admit-improvement.ts
- .transaction
- daily-cto.ts
- github/issue-publication.ts
- superseded-receipts.ts
- cli.ts
- brain-maintenance.ts
- qa-plan-retry.ts
- .getEffect
- shared.ts
- engine.ts
- src_shared_workkey
- index.ts
- time-readback.ts
- retire-history.ts
- recover-saved-plan.ts
- ticket-stage-runner.ts
- delivery-ownership.ts
- merge-summary.ts
- features.ts
- capture-session-clone.py
- preferences-store.ts
- Outbox.tsx
- .save
- unblock-brief.ts
- packed-consumer-pnpm.ts
- delivery-task.ts
- continue-access-only-plan.ts
- extract-worker.mjs
- ProjectProgress
- restoreInPlace
- coordination.ts
- process.ts
- CommandRegistry
- ServiceHealthPanel.tsx
- highestStableAtLeast
- server_cec_parking_jira_issue_execute
- server_delivery_harness_delivery_authority_resolvedeliverywork
- server_delivery_recovery_stopped_base_audit_native

## God Nodes (most connected - your core abstractions)
1. `Store` - 372 edges
2. `TicketJob` - 172 edges
3. `digest()` - 150 edges
4. `command()` - 117 edges
5. `GitHubDelivery` - 116 edges
6. `artifact()` - 114 edges
7. `workKey()` - 97 edges
8. `OfficeSnapshot` - 88 edges
9. `cx()` - 88 edges
10. `currentAssignment()` - 88 edges

## Surprising Connections (you probably didn't know these)
- `UnrecordedResult` --references--> `StageResult`  [EXTRACTED]
  server/cec/unrecorded-result.ts → src/shared.ts
- `apply()` --indirect_call--> `note()`  [INFERRED]
  src/conversations/OutboxSavedImplementation.tsx → server/cec/parking/resume-parked.ts
- `DeliveryTaskInput` --references--> `TicketJob`  [EXTRACTED]
  server/delivery/pipeline/delivery-task.ts → src/shared.ts
- `StageContext` --references--> `Role`  [EXTRACTED]
  server/delivery/pipeline/accept-stage-result.ts → src/shared.ts
- `StagePromptInput` --references--> `TicketJob`  [EXTRACTED]
  server/delivery/pipeline/stage-prompts.ts → src/shared.ts

## Import Cycles
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/review-wait.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/parking/resume-provider-review.ts -> server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/parking/resume-provider-review.ts`
- 3-file cycle: `server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts`
- 4-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/readiness/review-wait.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 4-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 4-file cycle: `server/delivery/recovery/implementation/saved-prerequisite-handoff.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/implementation/saved-prerequisite-handoff.ts`
- 4-file cycle: `server/delivery/recovery/validation/validation-readback.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/validation/validation-readback.ts`
- 4-file cycle: `server/delivery/recovery/implementation/activation-recovery.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/implementation/activation-recovery.ts`
- 4-file cycle: `server/delivery/recovery/stopped-base-review.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/stopped-base-review.ts`
- 4-file cycle: `server/features/delivery-binding.ts -> server/features/enrollment-gate.ts -> server/features/progression/failure.ts -> server/store/effects.ts -> server/features/delivery-binding.ts`
- 5-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/stage-reconciliation.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 5-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 5-file cycle: `server/delivery/recovery/implementation/continuation-evidence.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/recovery/implementation/continuation-evidence.ts`
- 5-file cycle: `server/delivery/recovery/implementation/saved-prerequisite-handoff.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/recovery/implementation/saved-prerequisite-handoff.ts`
- 5-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/scope-repair/scope-repair-resume.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 5-file cycle: `server/delivery/recovery/scope-repair/scope-repair-readback.ts -> server/delivery/recovery/scope-repair/scope-repair-resume.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/scope-repair/scope-repair-readback.ts`
- 5-file cycle: `server/delivery/recovery/implementation/continuation-evidence.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/implementation/implementation-recovery.ts -> server/delivery/recovery/implementation/continuation-evidence.ts`
- 5-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/closeout/github-closeout.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`

## Communities (114 total, 7 thin omitted)

### Community 0 - "Button"
Cohesion: 0.13
Nodes (37): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView() (+29 more)

### Community 1 - "PeoplePanel.tsx"
Cohesion: 0.10
Nodes (42): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+34 more)

### Community 2 - "dependency-bots/adopt.ts"
Cohesion: 0.14
Nodes (30): Execute, readBackOrThrow(), adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR (+22 more)

### Community 3 - "ref_node_crypto"
Cohesion: 0.11
Nodes (45): ref_node_crypto, featureItemComplete(), reconcileFeatureCompletion(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS, reserveReplacement(), stageBudget() (+37 more)

### Community 4 - "Inspector.tsx"
Cohesion: 0.11
Nodes (61): labels, ServiceHealthRow(), BlockerFollowups(), LearningCoverage(), LessonsPanel(), when(), EvidenceCard(), Inspector() (+53 more)

### Community 5 - "requests.ts"
Cohesion: 0.07
Nodes (57): ownershipReadHistory(), nextAttemptAt(), NOT_RETRYABLE, WRITER_STAGES, writerRestartCandidate, writerRestarted(), writerRestartPending(), deliveryAdmission() (+49 more)

### Community 6 - "session-bridge.ts"
Cohesion: 0.05
Nodes (58): ref_node_perf_hooks, ref_node_url, ref_ws, file, folder, logs, root, claudeSessionContext() (+50 more)

### Community 7 - "ref_react"
Cohesion: 0.09
Nodes (43): ref_react, ref_react_markdown, ref_remark_gfm, ref_yaml, Activity(), ActivityTimeline(), AssignmentKnowledge(), Lookup() (+35 more)

### Community 8 - "ref_node_path"
Cohesion: 0.06
Nodes (68): ref_node_fs, ref_node_os, ref_node_path, ref_node_util, GitRead, patchArgs, interruptedImplementation(), continueUnsealedQA() (+60 more)

### Community 9 - "Engine"
Cohesion: 0.08
Nodes (3): AzureMonitor, JiraOperations, Engine

### Community 10 - "worker-runtime.ts"
Cohesion: 0.07
Nodes (39): ref_zod, savedStageCompletion(), candidateWorkspaceEnvironment(), GITHUB_ISSUE_SKILL, assignmentSubject(), assertBriefingScope(), Result, assertModelOverrides() (+31 more)

### Community 11 - "github-delivery.ts"
Cohesion: 0.05
Nodes (92): writerRestartInstruction(), moveLane(), harnessCloseout(), PASSING, verifyMergeActions(), findingsBlock(), assertDeliveryMayMutate(), runHarnessStage() (+84 more)

### Community 12 - "App.tsx"
Cohesion: 0.07
Nodes (43): ref_lucide_react, ref_motion, ref_react_dom, BrainDrawer(), blank(), goalInput, Goals(), resetDraft() (+35 more)

### Community 13 - "features/workflow.ts"
Cohesion: 0.09
Nodes (55): approveFeature(), commandFeature(), featureById(), mutation(), reviewQuestions(), discoveryPrompt(), planPrompt(), artifactPath() (+47 more)

### Community 14 - "assignments.ts"
Cohesion: 0.07
Nodes (41): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, CommittedBrain (+33 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.15
Nodes (45): createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest, captureRequests() (+37 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.08
Nodes (47): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, blockingTrigger, isBlocking(), brainOverlap (+39 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.08
Nodes (48): baselineLearning(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences(), configureKnowledge(), maintenanceSubject(), MaintenanceSubjectFacts (+40 more)

### Community 18 - ".emit"
Cohesion: 0.11
Nodes (34): decideImplementation(), requestQAPlanRetry(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), configureNotices(), Identity (+26 more)

### Community 19 - "config.ts"
Cohesion: 0.08
Nodes (65): partialLocalCleanupCandidate(), savedCandidateAdmission, assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), reconcileCompletedConflictDraft() (+57 more)

### Community 20 - "harnessEffect"
Cohesion: 0.25
Nodes (20): Lane, MOVABLE, resolveLane(), cardStatus(), ProjectCard, projectCards(), projectGraphql(), setCardStatus() (+12 more)

### Community 21 - "GitHubDelivery"
Cohesion: 0.07
Nodes (49): restartStoppedWriters(), unchangedSinceAccepted(), Execute, SalvageRetry, salvageWorktree(), resumeProviderReviews(), GitHubDelivery, observe() (+41 more)

### Community 22 - "QuestionStepper.tsx"
Cohesion: 0.19
Nodes (18): FeatureQuestionProjection, OutboxQuestionRound(), send(), draftKey(), readDraft(), saveDraft(), QuestionRound(), nextQuestion() (+10 more)

### Community 23 - "telemetry.ts"
Cohesion: 0.08
Nodes (35): add(), CodexRequest, CodexRollout, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens() (+27 more)

### Community 24 - "knowledge.ts"
Cohesion: 0.05
Nodes (56): officeKnowledgeSnapshot(), lessonBrainAudit, LessonBrainOverlap, lessonForProject(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT (+48 more)

### Community 25 - "maintenance/maintenance.ts"
Cohesion: 0.10
Nodes (24): ApproachSchema, maintenancePolicies(), BrainMaintenance, candidateOwner(), SETTLED, skipOwnedCandidate(), Skipped, skippedCandidateLedger() (+16 more)

### Community 26 - "cost-ledger.ts"
Cohesion: 0.15
Nodes (27): captureCost(), server_telemetry_cost_entries_costcoveragesummary, costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId() (+19 more)

### Community 27 - "activation-recovery.ts"
Cohesion: 0.07
Nodes (71): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+63 more)

### Community 28 - "index.tsx"
Cohesion: 0.09
Nodes (29): FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures(), LessonsView(), ButtonLayout (+21 more)

### Community 29 - "jira-time.ts"
Cohesion: 0.14
Nodes (22): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+14 more)

### Community 30 - "digest"
Cohesion: 0.14
Nodes (43): activeEffectId(), retryRead(), admitPRMetadata(), assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema, savedMetadataAssessment() (+35 more)

### Community 31 - "agents.ts"
Cohesion: 0.06
Nodes (44): implementationWorkerContext(), cecReconcilePrompt(), assertContinuableWorktree(), CONTINUABLE, continuationPrompt(), MAX_CONTINUATIONS, recordedContinuation(), stageContinuation (+36 more)

### Community 32 - "conversations/conversations.ts"
Cohesion: 0.08
Nodes (32): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+24 more)

### Community 33 - "DailyCTO.tsx"
Cohesion: 0.21
Nodes (13): CTOReview(), goalState, DailyCTO(), reportDate(), reviewStatus, GoalList(), card(), InlineText() (+5 more)

### Community 34 - "azure.ts"
Cohesion: 0.12
Nodes (28): az(), base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs(), fullActivePRs() (+20 more)

### Community 35 - "continuation-review-readback.ts"
Cohesion: 0.22
Nodes (16): continuationNativeReview(), continuationReviewArtifacts(), negativeWorker(), reconcileContinuationReview(), savedNegativeContinuationReview(), ContinuationDecision, implementationContinuationDecision(), negativeTechnicalReview() (+8 more)

### Community 36 - "scheduled-work.ts"
Cohesion: 0.09
Nodes (39): freshOwnershipRead(), slackRequestSettled(), deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), withAmendmentOwnership(), metadataRequestResolved(), preparationRequestResolved() (+31 more)

### Community 37 - "Role"
Cohesion: 0.11
Nodes (19): ROLES, DeliverySlot, officeCapacity, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork() (+11 more)

### Community 38 - "closeout-recovery.ts"
Cohesion: 0.11
Nodes (41): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+33 more)

### Community 39 - "projects.ts"
Cohesion: 0.13
Nodes (22): IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), intakeMembership(), projectListScope(), cecIntakePrompt(), cecReadbackPrompt() (+14 more)

### Community 40 - "assignment-poll.ts"
Cohesion: 0.10
Nodes (31): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), syncOutbox(), initialManualStart() (+23 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.13
Nodes (30): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), server_telemetry_billable_work_issue_key, isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence() (+22 more)

### Community 42 - "node-visuals.ts"
Cohesion: 0.20
Nodes (13): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+5 more)

### Community 43 - "ledger.ts"
Cohesion: 0.19
Nodes (15): ctoInputIdentityMatches(), ctoInputRecovered(), acceptedCompletionResolution(), investigationCandidates(), investigationId(), ctoReplacementResolution(), finishedSubjectResolution(), investigationFollowUps() (+7 more)

### Community 44 - "intent.ts"
Cohesion: 0.11
Nodes (26): ref_node_child_process, nativeGitRead(), savedImplementation(), sha(), sourceCopyMatches(), sourceFiles(), ContinuationIO, nativeIO (+18 more)

### Community 45 - "knowledge-views.ts"
Cohesion: 0.16
Nodes (19): KnowledgeActivity, KnowledgeEdge, KnowledgeMap, KnowledgeNode, connectionSummary(), Constellation(), ConstellationView, DisplayNode (+11 more)

### Community 46 - "OfficeScene.tsx"
Cohesion: 0.17
Nodes (33): withoutElapsed(), Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk() (+25 more)

### Community 47 - "github.ts"
Cohesion: 0.31
Nodes (4): GitHubMonitor, GitHubBoard, GitHubPR, GitHubState

### Community 48 - "workKey"
Cohesion: 0.14
Nodes (19): completedPRReviews(), Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership (+11 more)

### Community 49 - "demand-facts.ts"
Cohesion: 0.16
Nodes (19): clip(), DEMAND_LIMIT, demandFacts(), DemandSection, key(), LessonKey, notes(), clip() (+11 more)

### Community 50 - "MaintenanceRun"
Cohesion: 0.14
Nodes (17): BrainStatusSchema, identity, brainCheckpointCompletion(), coverageSchema, followupSchema, verified, reconcileCompletedCheckpoints(), checkpointHasMaintenanceAlert() (+9 more)

### Community 51 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 52 - "blocker-followups.ts"
Cohesion: 0.19
Nodes (18): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), canFileGithubIssue(), readBackConversations(), handoff(), reconcileBlockerFollowups() (+10 more)

### Community 53 - "cec.ts"
Cohesion: 0.10
Nodes (31): cecPrompt(), resolvedDecisionNote(), stageInstructions, reviewedPlanGuidance, reviewedPlanGuideDigest, settledReceiptNote(), stageResultGap(), stagePrompt() (+23 more)

### Community 54 - "work.ts"
Cohesion: 0.05
Nodes (50): ATTEMPT_DELAYS_MS, SourceClosed, classifyStop(), reviewWait, BLOCKED_CAUSES, blockedCauses(), projectReadiness(), incompleteReadOutput() (+42 more)

### Community 55 - "weekly-rollup.ts"
Cohesion: 0.09
Nodes (35): deliveryMetrics(), median(), learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck() (+27 more)

### Community 56 - "cec/issue-publication.ts"
Cohesion: 0.19
Nodes (13): CommentPage, commentReadback(), Assignment, Content, jiraText(), Transition, plain(), jiraRecord() (+5 more)

### Community 57 - "TimeBook.tsx"
Cohesion: 0.13
Nodes (29): TelemetryReport, TelemetryRow, OFFICE_CAST, PARTY_DURATION, secretPhrase(), useOfficeEasterEggs(), ROLE_NAMES, BreakdownTable() (+21 more)

### Community 58 - "JiraIssuePublisher"
Cohesion: 0.29
Nodes (3): JiraIssuePublisher, keyOf(), publicationDescription()

### Community 59 - "Store"
Cohesion: 0.08
Nodes (25): ref_node_sqlite, assignmentDiagnostics(), diagnosticContext(), diagnosticSnapshot(), nativeDeliveryResolved(), Assessment, Clock, applyConnectionSettings() (+17 more)

### Community 60 - "offices.ts"
Cohesion: 0.09
Nodes (18): ref_smol_toml, QuestionNotifications, improvementEligible(), leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), queueImprovements() (+10 more)

### Community 61 - "run.ts"
Cohesion: 0.13
Nodes (24): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, syncInvestigations(), OFFICE_FIX_PROMPT (+16 more)

### Community 62 - "interrupted-work-recovery.ts"
Cohesion: 0.12
Nodes (15): channelNoticeAuthorized(), comparableSlackText(), SlackMessages, interruptAdoptions(), legacy(), REMOVED_FIELDS, retireLegacyRecovery(), goalNoticeAuthorized() (+7 more)

### Community 63 - "delivery-repairs.ts"
Cohesion: 0.12
Nodes (34): removeAdoptedClone(), namedRepairIds(), pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), stoppedBaseCheckout(), discussion(), pages(), pullIdentity() (+26 more)

### Community 64 - "ticket-evidence.ts"
Cohesion: 0.07
Nodes (49): ref_node_string_decoder, candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute (+41 more)

### Community 65 - "run-accounting.ts"
Cohesion: 0.12
Nodes (32): BoundedRead, done(), readBoundedNoFollow(), readOwnedSessionArtifact(), reasonOf(), backfillClaudeCost(), CompletionReader, codexHome() (+24 more)

### Community 66 - "tracking-issue.ts"
Cohesion: 0.21
Nodes (12): ensureTrackingIssue(), findTrackingIssue(), ownTracking(), TrackingIssue, trackingIssueBody(), trackingIssueTitle(), trackingMarker(), centralCompanionHandoff() (+4 more)

### Community 67 - "pilot-delivery.ts"
Cohesion: 0.18
Nodes (22): continueImplementation(), dispatchNightly(), drainDelivery(), requestDelivery(), startPilot(), OfficeQAHandoffInput, eligibility(), approvedDelivery() (+14 more)

### Community 68 - "continue-ownership-read.ts"
Cohesion: 0.15
Nodes (18): continueOwnershipRead(), expiredOwnershipRead(), handoffOwnership(), ReadbackOwnerDecision, ownershipReadGate(), ownershipReadState(), ownershipReadSource(), readOwnershipCandidate (+10 more)

### Community 69 - "it-specialist.ts"
Cohesion: 0.22
Nodes (13): savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), ITContext, informationalRecovery(), publishITReport(), delays (+5 more)

### Community 70 - "constellation-runtime.ts"
Cohesion: 0.10
Nodes (22): ref_3d_force_graph, ref_three, CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point (+14 more)

### Community 71 - "contract.ts"
Cohesion: 0.14
Nodes (17): Event, one(), prePushRejection(), PushIdentity, settledPushBoundary(), At, errno, GroupInventory (+9 more)

### Community 72 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (10): ref_react_three_drei, ref_react_three_fiber, ref_three_stdlib, CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility (+2 more)

### Community 73 - "report.ts"
Cohesion: 0.29
Nodes (12): Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked(), row() (+4 more)

### Community 74 - "service-health.ts"
Cohesion: 0.14
Nodes (15): projectSlackDeliveries(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint(), supersedingDelivery(), listenerHealth(), providers (+7 more)

### Community 75 - "admit-improvement.ts"
Cohesion: 0.25
Nodes (13): admitImprovement(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker(), improvementProvider() (+5 more)

### Community 76 - ".transaction"
Cohesion: 0.20
Nodes (8): helperTelemetry(), publishFeature(), reconcilePublication(), uncertainPublications(), reserveIdentity(), dispatchExposure(), prepareExposure(), EffectUncertainError

### Community 77 - "daily-cto.ts"
Cohesion: 0.06
Nodes (40): collectCTOFacts(), DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), boundedIntake(), boundedJobs(), boundedMaintenance() (+32 more)

### Community 78 - "github/issue-publication.ts"
Cohesion: 0.15
Nodes (10): FeaturePublisher, PublicationReceipt, Assign, Board, Content, GitHubIssuePublisher, number(), same() (+2 more)

### Community 79 - "superseded-receipts.ts"
Cohesion: 0.27
Nodes (8): Attempt, needsResumeReconciliation(), REVIEW_STAGES, stoppedInSetup(), Receipt, Settled, SETTLED_RECEIPT_NOTE, supersededReceipt()

### Community 80 - "cli.ts"
Cohesion: 0.22
Nodes (7): ref_node_stream, ref_node_timers, args, [cmd,...rawArgs], commands, key, projectIndex

### Community 81 - "brain-maintenance.ts"
Cohesion: 0.21
Nodes (12): completeNativeCheckpoint(), BRAIN_DEPENDENCY_MERGES, BrainResult, capped(), queueMaintenanceNotice(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance() (+4 more)

### Community 82 - "qa-plan-retry.ts"
Cohesion: 0.67
Nodes (3): QAPlanRetry, QAPlanRetryProof, QAPlanRetryRequest

### Community 83 - ".getEffect"
Cohesion: 0.25
Nodes (8): GitHubOperations, fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), lessonText(), closeNativeRefresh(), fingerprint(), EffectIntent

### Community 84 - "shared.ts"
Cohesion: 0.04
Nodes (72): ADOPTION_STALLED_MS, projectOutbox(), knowledgeOutbox(), checkpointSuperseded(), DailyCTOSummary, OfficeQAReport, QAPlanContinuation, SlackReplacementRequest (+64 more)

### Community 85 - "engine.ts"
Cohesion: 0.17
Nodes (13): correlatedBuild(), applyIntakeObservation(), checkMail(), drainMail(), requestMail(), enableNightly(), ingest(), drainMaintenance() (+5 more)

### Community 87 - "index.ts"
Cohesion: 0.07
Nodes (50): ref_hono_node_server, ref_node_http, ref_vite, implementationContinuationRoute(), closedReadonlyPlan(), Document, entryExists(), inspectClosedQAPlan() (+42 more)

### Community 88 - "time-readback.ts"
Cohesion: 0.29
Nodes (6): TimeLedger, dueReadback(), Readback, READBACK_INTERVAL_MS, readBackTime(), SETTLE_MS

### Community 89 - "retire-history.ts"
Cohesion: 0.33
Nodes (7): readHistoryScope(), historicalRecordDigest(), Intent, records(), retireIncompleteHistory(), HistoryRetirement, HistoryRetirementIntent

### Community 90 - "recover-saved-plan.ts"
Cohesion: 0.18
Nodes (14): candidateBranchMoved(), resume(), confirmSetupStopCap(), consecutiveSetupStops(), SETUP_STOP_CAP, setupStop(), MISSING_SAVED_PLAN, recoverSavedPlan() (+6 more)

### Community 91 - "ticket-stage-runner.ts"
Cohesion: 0.19
Nodes (23): parksInJira(), ownReceipts(), run(), verifiedTransition(), unrecordedStageResult(), publicationEvidenceGap(), qaEvidenceGap(), DECISION_KINDS (+15 more)

### Community 92 - "delivery-ownership.ts"
Cohesion: 0.33
Nodes (5): ref_node_async_hooks, Ownership, ownershipContext, refreshDeliveryOwnership(), RefreshOwnership

### Community 93 - "merge-summary.ts"
Cohesion: 0.36
Nodes (7): clamp(), LIMITS, MergedPR, plainSlackText(), section(), shippedSummary(), mergeText()

### Community 94 - "features.ts"
Cohesion: 0.11
Nodes (24): automaticIntakeWait(), assertQuestionVisibility(), normalizeRound(), pendingQuestions(), FeatureApproval, FeatureAuthority, FeatureDocument, FeatureHandoff (+16 more)

### Community 95 - "capture-session-clone.py"
Cohesion: 0.15
Nodes (10): ctypes, errno, importlib_util, json, os, pathlib, Copy a coherent macOS clone of inherited reader fd3 to anonymous target fd4. No…, Read-only protocol adapter for the installed review helper. No model dispatch. (+2 more)

### Community 96 - "preferences-store.ts"
Cohesion: 0.19
Nodes (9): PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS, OfficePreferences (+1 more)

### Community 97 - "Outbox.tsx"
Cohesion: 0.09
Nodes (40): Conversation(), SendMessage, LessonDecisionAction, lessonDecisionState(), readLessonDecision(), isLessonDecision(), Outbox(), ctoInputFailure() (+32 more)

### Community 98 - ".save"
Cohesion: 0.16
Nodes (35): jiraCollection(), BLOCKED, findComment(), LiveIssue, readIssue(), readIssues(), Execute, jira() (+27 more)

### Community 99 - "unblock-brief.ts"
Cohesion: 0.53
Nodes (5): clearUnblockBrief(), key(), saveUnblockBrief(), unblockBrief, src_shared_learningsubject

### Community 103 - "delivery-task.ts"
Cohesion: 0.31
Nodes (7): APPROACH_GUIDANCE, reviewInstructions(), deliveryTask(), DeliveryTaskInput, DISCOVERY_GUIDANCE, compactSteps(), featureDeliveryContext()

### Community 104 - "continue-access-only-plan.ts"
Cohesion: 0.57
Nodes (5): Document, isAccessOnlyPlan(), settledAccessOnlyState(), continueAccessOnlyPlan(), entryExists()

### Community 105 - "extract-worker.mjs"
Cohesion: 0.43
Nodes (6): ref_mammoth, ref_pdfjs_dist, bounded(), extract(), fail(), [path,kind]

### Community 109 - "restoreInPlace"
Cohesion: 0.60
Nodes (5): identity(), Json, plain(), restorable(), restoreInPlace()

### Community 110 - "coordination.ts"
Cohesion: 0.05
Nodes (47): MergeNotifications, reconcileNoticeConfirmations(), Admission, admit(), IntakeContext, WAIT_STATUSES, compatible(), dependencyCompletionKey() (+39 more)

### Community 111 - "process.ts"
Cohesion: 0.07
Nodes (15): externalPlanGap(), verifyFeatureEnhance(), GitHubFeaturePublisher, JiraFeaturePublisher, FeatureReviewRunner, FeatureWorkflow, inactivityWatch(), GIT_NETWORK (+7 more)

### Community 113 - "ServiceHealthPanel.tsx"
Cohesion: 0.20
Nodes (14): blockedSummary(), itAgent(), itDiagnostics(), itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps(), currentServices() (+6 more)

### Community 116 - "highestStableAtLeast"
Cohesion: 0.83
Nodes (3): compare(), highestStableAtLeast(), parts()

## Knowledge Gaps
- **493 isolated node(s):** `PreferenceCandidate`, `People`, `OrgTree`, `ChartProps`, `Tab` (+488 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 635 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `dependency-bots/adopt.ts`, `ref_node_crypto`, `requests.ts`, `session-bridge.ts`, `ref_node_path`, `Engine`, `worker-runtime.ts`, `github-delivery.ts`, `features/workflow.ts`, `assignments.ts`, `scheduled-captures.ts`, `run-retrospective.ts`, `record-trigger.ts`, `.emit`, `config.ts`, `harnessEffect`, `GitHubDelivery`, `knowledge.ts`, `maintenance/maintenance.ts`, `cost-ledger.ts`, `activation-recovery.ts`, `jira-time.ts`, `digest`, `agents.ts`, `conversations/conversations.ts`, `azure.ts`, `continuation-review-readback.ts`, `scheduled-work.ts`, `Role`, `closeout-recovery.ts`, `projects.ts`, `assignment-poll.ts`, `time-scope.ts`, `ledger.ts`, `intent.ts`, `github.ts`, `workKey`, `demand-facts.ts`, `MaintenanceRun`, `blocker-followups.ts`, `cec.ts`, `work.ts`, `weekly-rollup.ts`, `cec/issue-publication.ts`, `offices.ts`, `run.ts`, `interrupted-work-recovery.ts`, `delivery-repairs.ts`, `ticket-evidence.ts`, `run-accounting.ts`, `tracking-issue.ts`, `pilot-delivery.ts`, `continue-ownership-read.ts`, `it-specialist.ts`, `service-health.ts`, `admit-improvement.ts`, `.transaction`, `daily-cto.ts`, `github/issue-publication.ts`, `brain-maintenance.ts`, `.getEffect`, `shared.ts`, `engine.ts`, `index.ts`, `time-readback.ts`, `retire-history.ts`, `recover-saved-plan.ts`, `features.ts`, `.save`, `delivery-task.ts`, `continue-access-only-plan.ts`, `ProjectProgress`, `coordination.ts`, `process.ts`?**
  _High betweenness centrality (0.096) - this node is a cross-community bridge._
- **Why does `Coordinator` connect `coordination.ts` to `scheduled-work.ts`, `requests.ts`, `assignment-poll.ts`, `process.ts`, `scheduled-captures.ts`, `brain-maintenance.ts`, `activation-recovery.ts`, `offices.ts`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Why does `command()` connect `process.ts` to `requests.ts`, `session-bridge.ts`, `ref_node_path`, `Engine`, `worker-runtime.ts`, `github-delivery.ts`, `features/workflow.ts`, `assignments.ts`, `.emit`, `harnessEffect`, `GitHubDelivery`, `maintenance/maintenance.ts`, `cost-ledger.ts`, `activation-recovery.ts`, `jira-time.ts`, `digest`, `agents.ts`, `azure.ts`, `closeout-recovery.ts`, `assignment-poll.ts`, `intent.ts`, `github.ts`, `weekly-rollup.ts`, `cec/issue-publication.ts`, `Store`, `delivery-repairs.ts`, `ticket-evidence.ts`, `continue-ownership-read.ts`, `contract.ts`, `service-health.ts`, `admit-improvement.ts`, `github/issue-publication.ts`, `brain-maintenance.ts`, `.getEffect`, `engine.ts`, `time-readback.ts`, `.save`, `continue-access-only-plan.ts`, `ProjectProgress`, `coordination.ts`, `CommandRegistry`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `PreferenceCandidate`, `People`, `OrgTree` to the rest of the system?**
  _493 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Button` be split into smaller, more focused modules?**
  _Cohesion score 0.13411764705882354 - nodes in this community are weakly interconnected._
- **Should `PeoplePanel.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0988235294117647 - nodes in this community are weakly interconnected._
- **Should `dependency-bots/adopt.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1422475106685633 - nodes in this community are weakly interconnected._