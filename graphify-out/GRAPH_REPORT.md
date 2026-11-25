# Graph Report - the-office  (2026-11-25)

## Corpus Check
- 1195 files · ~501,663 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 6113 nodes · 26805 edges · 163 communities (154 shown, 9 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 983 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ddf8d8f0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- incidents/routes.ts
- OrgChart.tsx
- ref_node_path
- features.ts
- Inspector.tsx
- daily-cto.ts
- artifact
- Button
- retrospective-subject.ts
- TelemetryPanel.tsx
- ref_node_crypto
- store.ts
- App.tsx
- accept-retrospective.ts
- demand-facts.ts
- scheduled-captures.ts
- OfficeSnapshot
- record-trigger.ts
- deploy-command.ts
- GitHubDelivery
- currentAssignment
- move-lane.ts
- weekly-rollup.ts
- jira-time.ts
- deploy.ts
- maintenance/maintenance.ts
- worker-runtime.ts
- agents.ts
- github-readiness.ts
- Outbox.tsx
- digest
- github-delivery.ts
- index.ts
- remove-candidate.ts
- run.ts
- common.cjs
- scheduled-work.ts
- routing.cjs
- redact-evidence.ts
- run-retrospective.ts
- .emit
- time-scope.ts
- Store
- jiraBinding
- Offices
- harness-baseline.ts
- OfficeScene.tsx
- .transaction
- change-scope.ts
- ticket-stage-runner.ts
- intent.ts
- effects.ts
- ref_zod
- state-parts.ts
- JiraIssuePublisher
- ref_node_child_process
- FeatureWorkspace.tsx
- controller-runtime.ts
- recovery/stopped-base-update.ts
- owned-artifact.ts
- cost-ledger.ts
- unsent-time.ts
- brain-maintenance.ts
- timed-statements.ts
- judge-resumes.ts
- validate_pr_body.cjs
- audit-plan-candidates.cjs
- alert-issue.ts
- resume-arrivals.ts
- ticket-evidence.ts
- constellation-runtime.ts
- setup-stop-cap.ts
- session-context-file.ts
- assignments.ts
- session-scope.ts
- service-health.ts
- project-bindings.ts
- diagnostic-snapshot.ts
- incidents.ts
- cec.ts
- session-bridge.ts
- IncidentLedger
- goal-reviews.ts
- harnessEffect
- viewer.js
- github.ts
- stopped-record.ts
- sanitize
- Conversation.tsx
- contract.ts
- provider-observation.ts
- readable-jira-comment.ts
- session-context-client.ts
- plans.cjs
- report.ts
- capture-session-clone.py
- index.tsx
- holdReason
- Ticket
- archive-plan.cjs
- notifications.ts
- shared.ts
- control-store.ts
- on-merge-sync.cjs
- backup-stores.ts
- extract-worker.mjs
- deploy-plan.ts
- work.ts
- sign-in-unpark.ts
- release-unpark.ts
- blocker-followups.ts
- assignment-poll.ts
- fact-bounds.ts
- MaintenanceRun
- slack-supersession.ts
- run-accounting.ts
- qa.ts
- qa-plan-continuation.ts
- writer-restart.ts
- GitHubIssuePublisher
- accessibility-sources.ts
- follow-production.ts
- outbox.ts
- enqueueRequest
- refresh-issue-state.cjs
- knowledge.ts
- follow-up-alerts.ts
- interrupted-work-recovery.ts
- node-visuals.ts
- admit-repair-waits.ts
- pre-push-boundary.ts
- it-specialist.ts
- telemetry.ts
- wait-idle.ts
- pending-questions.ts
- history-archive.ts
- coordination.ts
- Effects
- ledger.ts
- checkpoint-retry.ts
- session-snapshot-cleanup.ts
- scene-motion.ts
- slot-policy.ts
- production.ts
- reconcile-merges.cjs
- preferences-store.ts
- RoomCamera.tsx
- codex-rollout.ts
- OfficeConfigView.tsx
- qa-comment.ts
- repoRoot
- codex-rollout-file.ts
- validate_wiki_pr_body.cjs
- incident-command.ts
- CommittedBrain
- run-usage.ts
- ProjectProgress
- lesson-exits.ts
- save-report.ts
- routing.js
- qa-plan-retry.ts
- live-reach.ts
- InFlightOperations

## God Nodes (most connected - your core abstractions)
1. `Store` - 443 edges
2. `TicketJob` - 199 edges
3. `command()` - 161 edges
4. `digest()` - 153 edges
5. `holdReason()` - 139 edges
6. `GitHubDelivery` - 121 edges
7. `OfficeSnapshot` - 120 edges
8. `artifact()` - 114 edges
9. `workKey()` - 110 edges
10. `StageResult` - 109 edges

## Surprising Connections (you probably didn't know these)
- `BreakdownTable()` --indirect_call--> `cell()`  [INFERRED]
  src/telemetry/BreakdownTable.tsx → scripts/wiki/archive-plan.cjs
- `apply()` --indirect_call--> `note()`  [INFERRED]
  src/conversations/OutboxSavedImplementation.tsx → server/cec/parking/resume-parked.ts
- `UnrecordedResult` --references--> `StageResult`  [EXTRACTED]
  server/cec/unrecorded-result.ts → src/shared.ts
- `DeliverySlot` --references--> `Role`  [EXTRACTED]
  server/office/projects.ts → src/shared.ts
- `Ledger` --references--> `TimePublication`  [EXTRACTED]
  server/time/readback-pending.ts → src/contracts/timing.ts

## Import Cycles
- 2-file cycle: `server/scheduling/coordination-pump.ts -> server/scheduling/coordination.ts -> server/scheduling/coordination-pump.ts`
- 2-file cycle: `server/scheduling/coordination-tick.ts -> server/scheduling/coordination.ts -> server/scheduling/coordination-tick.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/track-adopted-review.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/stage-reconciliation.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/accept-stage-result.ts -> server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/accept-stage-result.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/publication/metadata-context.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/refresh-merge-review.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/closeout/github-closeout.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/implementation/saved-prerequisite-handoff.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/queue-repairs.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/knowledge/lesson-exits.ts -> server/scheduling/requests.ts -> server/knowledge/lesson-exits.ts`
- 2-file cycle: `server/conversations/conversations.ts -> server/conversations/cto-conversations.ts -> server/conversations/conversations.ts`
- 2-file cycle: `server/conversations/notifications.ts -> server/conversations/slack.ts -> server/conversations/notifications.ts`
- 2-file cycle: `src/contracts/people.ts -> src/shared.ts -> src/contracts/people.ts`
- 2-file cycle: `src/contracts/timing.ts -> src/shared.ts -> src/contracts/timing.ts`
- 2-file cycle: `src/contracts/work.ts -> src/shared.ts -> src/contracts/work.ts`
- 2-file cycle: `server/workers/exit-failure.ts -> server/workers/process.ts -> server/workers/exit-failure.ts`
- 3-file cycle: `server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-guard.ts -> server/delivery/pipeline/github-delivery.ts`

## Communities (163 total, 9 thin omitted)

### Community 0 - "incidents/routes.ts"
Cohesion: 0.06
Nodes (59): citationFault(), CitationSchema, SourceVersions, sourceVersions(), inHistoryOf(), dismiss(), DISMISSAL_CITATIONS, DISMISSAL_REASON (+51 more)

### Community 1 - "OrgChart.tsx"
Cohesion: 0.12
Nodes (39): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+31 more)

### Community 2 - "ref_node_path"
Cohesion: 0.05
Nodes (78): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+70 more)

### Community 3 - "features.ts"
Cohesion: 0.06
Nodes (66): approveFeature(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), planPrompt(), artifactPath(), digest() (+58 more)

### Community 4 - "Inspector.tsx"
Cohesion: 0.10
Nodes (72): Outbox(), blockedSummary(), itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps(), ServiceHealthPanel(), followUp() (+64 more)

### Community 5 - "daily-cto.ts"
Cohesion: 0.12
Nodes (17): DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), dailyReviewDate(), reviewWeekday(), queueGoalEvidenceRequest(), SeenReports (+9 more)

### Community 6 - "artifact"
Cohesion: 0.06
Nodes (85): completedPreparation(), continuationNativeReview(), assertPostConflictFiles(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), reconcileCompletedConflictDraft(), routeReadyPostConflictPublication() (+77 more)

### Community 7 - "Button"
Cohesion: 0.08
Nodes (56): guidanceExcerpt(), KnowledgeActivity, KnowledgeActivityPage, KnowledgeEdge, KnowledgeMap, KnowledgeNode, Activity(), ActivityTimeline() (+48 more)

### Community 8 - "retrospective-subject.ts"
Cohesion: 0.13
Nodes (19): deliveryMetrics(), median(), ARTIFACT_LIMIT, clip(), LEDGER_STEPS, MAINTENANCE_LIMIT, maintenanceFacts(), MaintenancePacketSection (+11 more)

### Community 9 - "TelemetryPanel.tsx"
Cohesion: 0.09
Nodes (43): displayAgentTask(), withoutElapsed(), LiveAgentTask(), Props, RunningTask(), text(), Agent, AzureBuild (+35 more)

### Community 10 - "ref_node_crypto"
Cohesion: 0.10
Nodes (30): candidateBranchMoved(), continueImplementation(), dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), startPilot(), Document (+22 more)

### Community 11 - "store.ts"
Cohesion: 0.05
Nodes (37): leadershipContext(), queueLessonIssueCheck(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), Clock, systemClock, DELIVERY_CONCURRENCY (+29 more)

### Community 12 - "App.tsx"
Cohesion: 0.06
Nodes (49): BrainDrawer(), themeColor, App(), BrainWorkspace, CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants (+41 more)

### Community 13 - "accept-retrospective.ts"
Cohesion: 0.11
Nodes (31): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, admitImprovement(), improvementEligible(), curateLesson(), Curation (+23 more)

### Community 14 - "demand-facts.ts"
Cohesion: 0.11
Nodes (27): clip(), DEMAND_LIMIT, demandFacts(), DemandSection, key(), LessonKey, notes(), clip() (+19 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.11
Nodes (57): accounting, DeliverySubject, nonDelivery, originalReads, createFeature(), discoveryPrompt(), assertEnrollable(), enrolled() (+49 more)

### Community 16 - "OfficeSnapshot"
Cohesion: 0.09
Nodes (42): jiraQueueProgress(), nextStage(), compactSteps(), deliveryRoles, JiraQueueProgress, TicketProgress, SnapshotAcceptance, tourStages (+34 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.11
Nodes (37): baselined(), baselineLearning(), LEARNING_BASELINES, maintainLearning(), clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates() (+29 more)

### Community 18 - "deploy-command.ts"
Cohesion: 0.09
Nodes (53): CONTROLLER_ENTRY, ControllerPin, Pin, pinnedController(), readControllerPin(), writeControllerPin(), controllerOf(), deployCommand() (+45 more)

### Community 19 - "GitHubDelivery"
Cohesion: 0.06
Nodes (58): closeoutReceipt(), GitHubDelivery, stopReason(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment (+50 more)

### Community 20 - "currentAssignment"
Cohesion: 0.06
Nodes (91): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+83 more)

### Community 21 - "move-lane.ts"
Cohesion: 0.15
Nodes (35): effectKey(), LaneOperation, laneWrite(), moveCardOnce(), Lane, MOVABLE, moveLane(), resolveLane() (+27 more)

### Community 22 - "weekly-rollup.ts"
Cohesion: 0.18
Nodes (17): expireLearningPackets(), packetReferences(), learningMetrics(), RollupResult, harperFolder(), KnowledgeRunner, RETROSPECTIVE_TIMEOUT, lastFriday() (+9 more)

### Community 23 - "jira-time.ts"
Cohesion: 0.07
Nodes (56): twgProfile(), attempted(), attemptState(), bound(), covers(), JiraAttempt, jiraAttempts(), JiraAttemptState (+48 more)

### Community 24 - "deploy.ts"
Cohesion: 0.13
Nodes (34): Body, DeploymentFenceState, fenceTokenDigest(), abandon(), advance(), deploy(), Commit, DEPLOY_STEPS (+26 more)

### Community 25 - "maintenance/maintenance.ts"
Cohesion: 0.13
Nodes (20): captureMaintenanceStep(), sourceReview(), candidateOwner(), SETTLED, skipOwnedCandidate(), Skipped, skippedCandidateLedger(), CmsFollowUpContext (+12 more)

### Community 26 - "worker-runtime.ts"
Cohesion: 0.05
Nodes (54): candidateWorkspaceEnvironment(), assignmentSubject(), dispatchExposure(), prepareExposure(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT (+46 more)

### Community 27 - "agents.ts"
Cohesion: 0.07
Nodes (34): intakeEnumeration(), intakeMembership(), cecIntakePrompt(), cecReconcilePrompt(), cecTransitionPrompt(), ctoChatPrompt(), itChatPrompt(), READABLE_REPLY (+26 more)

### Community 28 - "github-readiness.ts"
Cohesion: 0.06
Nodes (76): resumeProviderReviews(), deliveryTask(), observe(), DISCOVERY_GUIDANCE, stageRole(), maintenanceVerifiedDraft(), returnDraftToPromotion(), approveMerge() (+68 more)

### Community 29 - "Outbox.tsx"
Cohesion: 0.07
Nodes (37): SendMessage, ctoInputFailure(), OutboxCTOInput(), recover(), OutboxMaintenanceStatus(), OutboxOwnerSteps(), OutboxSavedImplementation(), apply() (+29 more)

### Community 30 - "digest"
Cohesion: 0.09
Nodes (52): activeEffectId(), admitPRMetadata(), assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema, savedMetadataAssessment(), validateSaved() (+44 more)

### Community 31 - "github-delivery.ts"
Cohesion: 0.05
Nodes (77): applyIntakeObservation(), qaPlanEvidenceGap(), containedFile(), writerRestartInstruction(), findingsBlock(), QA_STAGES, reviewAdvisoryIds(), Reviewed (+69 more)

### Community 32 - "index.ts"
Cohesion: 0.05
Nodes (48): implementationPreview(), implementationContinuationRoute(), qaPlanRetryRoute(), close(), config, itSpecialist, loadedRevision, offices (+40 more)

### Community 33 - "remove-candidate.ts"
Cohesion: 0.14
Nodes (24): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), maintenanceCandidate(), moveAside(), moveBack(), purgeRemoved(), purging (+16 more)

### Community 34 - "run.ts"
Cohesion: 0.17
Nodes (17): failureOutranks(), INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationHeld(), OFFICE_FIX_PROMPT, OfficeFixResult, validateOfficeFix(), investigationReady() (+9 more)

### Community 35 - "common.cjs"
Cohesion: 0.18
Nodes (21): connections(), fs, main(), path, crypto, ensureInside(), { execFileSync }, fs (+13 more)

### Community 36 - "scheduled-work.ts"
Cohesion: 0.08
Nodes (42): freshOwnershipRead(), deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), Ownership, ownershipContext, refreshDeliveryOwnership(), RefreshOwnership (+34 more)

### Community 37 - "routing.cjs"
Cohesion: 0.13
Nodes (26): main(), parseArgs(), usage(), adjacency(), edgeCost(), edgeKey(), edgeType(), EVIDENCE_TYPE_PRIORITY (+18 more)

### Community 38 - "redact-evidence.ts"
Cohesion: 0.11
Nodes (17): AFTER_LABEL, ASSIGNMENT, AWS_KEY_ID, BARE_CREDENTIAL, BARE_UNIT, BARE_VALUE, CONTROL_ESCAPE, JSON_WEB_TOKEN (+9 more)

### Community 39 - "run-retrospective.ts"
Cohesion: 0.15
Nodes (27): BLOCKING, BlockingTrigger, blockingTrigger(), isBlocking(), BrainOverlap, brainOverlap(), brainOverlapQuery(), clip() (+19 more)

### Community 40 - ".emit"
Cohesion: 0.09
Nodes (35): assertOwnership(), decideImplementation(), consumeQAPlanRetry(), Decision, requestQAPlanRetry(), configureChannelNotices(), configureNotices(), retryRecipientLookup() (+27 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.15
Nodes (26): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence(), CaptureContext (+18 more)

### Community 42 - "Store"
Cohesion: 0.04
Nodes (22): Assignment, jiraText(), Transition, descriptionPreimage(), plain(), JiraFeaturePublisher, ResumeProject, OfficeCapacity (+14 more)

### Community 43 - "jiraBinding"
Cohesion: 0.09
Nodes (60): enumerateIntakeList(), inPickupOrder(), Intake, text(), checkMail(), drainMail(), requestMail(), resolveBlockedTransition() (+52 more)

### Community 44 - "Offices"
Cohesion: 0.15
Nodes (3): QuestionNotifications, Offices, markCaptureStart()

### Community 45 - "harness-baseline.ts"
Cohesion: 0.15
Nodes (23): BaselineReport, baselineReport(), BaselineSource, baselineText(), millions(), row(), share(), add() (+15 more)

### Community 46 - "OfficeScene.tsx"
Cohesion: 0.17
Nodes (32): Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk(), ElevatorStage() (+24 more)

### Community 47 - ".transaction"
Cohesion: 0.09
Nodes (43): commandFeature(), reviewQuestions(), featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS (+35 more)

### Community 48 - "change-scope.ts"
Cohesion: 0.14
Nodes (27): applyChangeScope(), levels(), MAX_CHECKS, owedUnderScope(), scopeBase(), settled(), statedApproach(), verifiedCandidate() (+19 more)

### Community 49 - "ticket-stage-runner.ts"
Cohesion: 0.09
Nodes (51): endChangeScope(), scopeOutgrown(), confirmsMovedHead(), Moved, movedHeadUnconfirmed(), recordConfirmedHead(), routeConfirmedHead(), draftHeadMovedForward() (+43 more)

### Community 50 - "intent.ts"
Cohesion: 0.13
Nodes (23): GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles(), ContinuationIO (+15 more)

### Community 51 - "effects.ts"
Cohesion: 0.14
Nodes (12): NOT_LANDED_SETTLE_MS, featureById(), Link, linkFeature(), FeaturePublisher, publishFeature(), reconcilePublication(), uncertainPublications() (+4 more)

### Community 52 - "ref_zod"
Cohesion: 0.05
Nodes (66): escaped(), IntakeBinding, intakeJql(), intakeLocation(), projectListScope(), AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), goalEvidencePath() (+58 more)

### Community 53 - "state-parts.ts"
Cohesion: 0.13
Nodes (16): readSavedState(), LARGE_KEY_CHARS, plain(), RedactedEntries, RedactedEntry, redactEntries(), joinParts(), PartRow (+8 more)

### Community 54 - "JiraIssuePublisher"
Cohesion: 0.23
Nodes (3): contentSchema(), JiraIssuePublisher, publicationDescription()

### Community 55 - "ref_node_child_process"
Cohesion: 0.08
Nodes (26): changedPaths(), { execFileSync }, files, isMapInput(), mapOnly(), { execFileSync }, git(), publish() (+18 more)

### Community 56 - "FeatureWorkspace.tsx"
Cohesion: 0.11
Nodes (29): FeatureQuestionProjection, OutboxQuestionRound(), send(), FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), send() (+21 more)

### Community 57 - "controller-runtime.ts"
Cohesion: 0.09
Nodes (35): DATA, projectData(), StoreDatabase, ControllerEffects, controllerEffects(), DEPLOY_PROJECT, alive(), ControllerMachine (+27 more)

### Community 58 - "recovery/stopped-base-update.ts"
Cohesion: 0.10
Nodes (36): assertStoppedBaseAudit(), AuditRow, AWS_KEY_ID, readStoppedBaseAuditCompletion(), StoppedBaseAuditReader, CoverageRow, Hash, JSON_WEB_TOKEN (+28 more)

### Community 59 - "owned-artifact.ts"
Cohesion: 0.20
Nodes (15): investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, NOTIFY_HELPER, notifyHelperResolution(), OFFICE_SOURCE_PATHS, officeSource() (+7 more)

### Community 60 - "cost-ledger.ts"
Cohesion: 0.16
Nodes (27): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress(), effectId() (+19 more)

### Community 61 - "unsent-time.ts"
Cohesion: 0.13
Nodes (21): publishableEntry(), settlementPending(), superseded(), ticketUnresolved(), Ledger, Read, TimeLedger, dueReadback() (+13 more)

### Community 62 - "brain-maintenance.ts"
Cohesion: 0.15
Nodes (17): maintenancePolicies(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, brainResultStop(), GateMark, gateMark(), MAX_START_RETRIES (+9 more)

### Community 63 - "timed-statements.ts"
Cohesion: 0.22
Nodes (12): StoreTimings, NAMED, rowsText(), rowText(), SQL_TOKEN, statementName(), text(), timed() (+4 more)

### Community 64 - "judge-resumes.ts"
Cohesion: 0.07
Nodes (47): Admission, eventId(), boundaryCrossed(), Crossing, Progress, CheckpointProgress, checkpointProgress(), names() (+39 more)

### Community 65 - "validate_pr_body.cjs"
Cohesion: 0.36
Nodes (8): fs, main(), readableText(), REQUIRED_CHECKS, REQUIRED_SECTIONS, sections(), validatePullRequestBody(), withoutComments()

### Community 66 - "audit-plan-candidates.cjs"
Cohesion: 0.14
Nodes (31): audit(), branchIssueNumbers(), classify(), distinctiveTitleWords(), { execFileSync }, extractPaths(), findPrForMergeSubject(), fmtCommit() (+23 more)

### Community 67 - "alert-issue.ts"
Cohesion: 0.17
Nodes (24): Execute, adoptDependabot(), AlertIssue, alertIssueBody(), alertIssueTitle(), alertMarker(), closeAlertIssue(), ensureAlertIssue() (+16 more)

### Community 68 - "resume-arrivals.ts"
Cohesion: 0.09
Nodes (73): DeliveryAuthorityInput, canonical(), redactEvidence(), assessResumes(), Standing, checkpointEligibility(), admitAssignmentResume(), forAssignment() (+65 more)

### Community 69 - "ticket-evidence.ts"
Cohesion: 0.11
Nodes (36): jiraRecord(), assetDownloader(), attachmentKind(), evidenceDirectory(), readEvidence(), storeEvidence(), blankEvidence(), CoverageState (+28 more)

### Community 70 - "constellation-runtime.ts"
Cohesion: 0.09
Nodes (21): CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point, ConstellationRuntime, createConstellation() (+13 more)

### Community 71 - "setup-stop-cap.ts"
Cohesion: 0.10
Nodes (28): cecReadbackPrompt(), plainResume(), capacityInterruptedRun(), providerSaid(), rerunsInterruptedQA(), officeRefusedQA(), confirmSetupStopCap(), consecutiveSetupStops() (+20 more)

### Community 72 - "session-context-file.ts"
Cohesion: 0.21
Nodes (14): unpackContextFailure(), ContextFoldPrefix, contextFoldPrefix(), SessionContextCheckpoint, captureSessionContextClone(), ContextReadPhase, SessionContextDeadline, sessionContextFile() (+6 more)

### Community 73 - "assignments.ts"
Cohesion: 0.09
Nodes (35): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, GraphNode (+27 more)

### Community 74 - "session-scope.ts"
Cohesion: 0.20
Nodes (16): Bound, claudeScopeParser(), claudeSessionScope(), CODEX_ROLLOUTS, contextReaders(), retainSessionMessage(), SessionConversation, escaped() (+8 more)

### Community 75 - "service-health.ts"
Cohesion: 0.12
Nodes (22): ClaudeLoginRefusal, claudeLoginRefusal(), claudeRefusalWords(), RECORDED_REFUSALS, refusedClaudeRow(), listenerHealth(), providers, ProviderStatusChecks (+14 more)

### Community 76 - "project-bindings.ts"
Cohesion: 0.09
Nodes (38): az(), AzureMonitor, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs(), fullActivePRs() (+30 more)

### Community 77 - "diagnostic-snapshot.ts"
Cohesion: 0.22
Nodes (12): assignmentDiagnostics(), diagnosticContext(), diagnosticSnapshot(), followUpPicture(), publishITReport(), nativeDeliveryResolved(), itAgent(), itDiagnostics() (+4 more)

### Community 78 - "incidents.ts"
Cohesion: 0.08
Nodes (55): attributedRecords(), foldsItsRun(), groupCandidates(), ObservedIncident, ObservedSubject, digest(), fingerprint(), incidentId() (+47 more)

### Community 79 - "cec.ts"
Cohesion: 0.06
Nodes (53): implementationWorkerContext(), movedHeadNote(), cecPrompt(), resolvedDecisionNote(), stageInstructions, stageInstructionsFor(), readbackDispatchGuidance(), REVIEW_FINDINGS_RULE (+45 more)

### Community 80 - "session-bridge.ts"
Cohesion: 0.10
Nodes (29): codexDaemonProcesses(), accountCodexProcesses(), CodexProcessInventory, codexProcessInventory(), DesktopSessions, unaccountedProcesses(), codexThreadMetadata(), METADATA_CHUNK (+21 more)

### Community 81 - "IncidentLedger"
Cohesion: 0.10
Nodes (32): CompareMemory, compareMemory(), COMPARES_PER_PASS, comparison(), DeployedFixes, DeployedFixesInput, recordDeployedFixes(), sameRelease() (+24 more)

### Community 82 - "goal-reviews.ts"
Cohesion: 0.10
Nodes (25): currentCitations(), Fact, NOT_CURRENT, PROVIDER_ERROR, applyGoalReview(), DailyResultSchema, DeliveryJob, EvidenceRefSchema (+17 more)

### Community 83 - "harnessEffect"
Cohesion: 0.12
Nodes (36): HarnessEffect, harnessEffect(), readBackOrThrow(), retryRead(), closesIssue(), linkedBody(), linkPR(), DependabotPR (+28 more)

### Community 84 - "viewer.js"
Cohesion: 0.19
Nodes (25): addMetaLink(), addMetaRow(), addRelationship(), applyView(), buildIndexes(), buildLegend(), buildModel(), buildRenderer() (+17 more)

### Community 85 - "github.ts"
Cohesion: 0.29
Nodes (6): GitHubMonitor, githubPRDescription(), GOAL_EVIDENCE_LIMITS, GitHubBoard, GitHubPR, GitHubState

### Community 86 - "stopped-record.ts"
Cohesion: 0.07
Nodes (61): boundedEvidence(), expectedWait(), StopFacts, FailedMailCheck, lastFailedMailCheck(), lastMailCheckOutcome(), MailCheckOutcome, normalizeCause() (+53 more)

### Community 87 - "sanitize"
Cohesion: 0.07
Nodes (48): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+40 more)

### Community 88 - "Conversation.tsx"
Cohesion: 0.08
Nodes (40): knowledgeOutbox(), ChatMarkdown(), Conversation(), LessonDecisionAction, lessonDecisionState(), readLessonDecision(), DAYS, dueLessonDecisions() (+32 more)

### Community 89 - "contract.ts"
Cohesion: 0.24
Nodes (12): At, Errno, errno(), GroupInventory, GroupProbe, LifecycleDiagnostic, Phase, Pid (+4 more)

### Community 90 - "provider-observation.ts"
Cohesion: 0.12
Nodes (28): correlatedBuild(), Azure, azurePipelines(), outcome(), Read, RUNS_PER_PIPELINE, Api, githubWorkflows() (+20 more)

### Community 91 - "readable-jira-comment.ts"
Cohesion: 0.20
Nodes (18): CommentPage, commentReadback(), devUpdate(), HEADLINE, postDevUpdate(), commentPayload(), JiraCommentIntent, postReadableComment() (+10 more)

### Community 92 - "session-context-client.ts"
Cohesion: 0.11
Nodes (19): claudeSessionContext(), readTranscript, codexSessionContext(), readRollout, packContextFailure(), PackedContextFailure, ContextThread, contextThread() (+11 more)

### Community 93 - "plans.cjs"
Cohesion: 0.14
Nodes (24): fs, main(), parse(), path, atomicWrite(), remoteSlug(), walk(), association() (+16 more)

### Community 94 - "report.ts"
Cohesion: 0.19
Nodes (17): telemetryRoute(), TelemetryReport, TelemetryRow, TelemetrySync, Acc, bump(), EASTERN, easternDay() (+9 more)

### Community 96 - "index.tsx"
Cohesion: 0.09
Nodes (50): LessonsView(), SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS, PickupForm() (+42 more)

### Community 97 - "holdReason"
Cohesion: 0.05
Nodes (82): interruptedImplementation(), nextAttemptAt(), restartStoppedWriters(), unchangedSinceAccepted(), NOT_RETRYABLE, releaseFunds(), StoppedWriter, stoppedWriter() (+74 more)

### Community 98 - "Ticket"
Cohesion: 0.18
Nodes (13): carriedNotRepeated(), changeScopeNote(), Scoped, JiraOperations, unpack(), Carried, findingsOwedToRetest(), missingRetestDispositions() (+5 more)

### Community 99 - "archive-plan.cjs"
Cohesion: 0.11
Nodes (35): fs, main(), parse(), path, archive(), cell(), ensureIndex(), fromArgs() (+27 more)

### Community 100 - "notifications.ts"
Cohesion: 0.11
Nodes (20): channelNoticeAuthorized(), ChannelSettings, notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR, plainSlackText() (+12 more)

### Community 101 - "shared.ts"
Cohesion: 0.07
Nodes (45): closedReadonlyPlan(), Document, document(), continueOwnershipRead(), continueUnsealedQA(), entry(), expiredOwnershipRead(), handoffOwnership() (+37 more)

### Community 102 - "control-store.ts"
Cohesion: 0.13
Nodes (12): Briefing, saveReviewBriefing(), checkpointLabel(), applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, statementCache() (+4 more)

### Community 103 - "on-merge-sync.cjs"
Cohesion: 0.15
Nodes (27): fs, main(), path, { spawnSync }, fieldSpan(), frontmatterProblems(), keyPattern(), list() (+19 more)

### Community 104 - "backup-stores.ts"
Cohesion: 0.10
Nodes (36): absentAdmission(), AdmissionComparison, AdmissionSnapshot, compareAdmissions(), snapshotAdmissions(), BackupEntry, BackupInput, BackupInventory (+28 more)

### Community 105 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 106 - "deploy-plan.ts"
Cohesion: 0.09
Nodes (45): runningRevision(), runningRevision(), ROOT, releaseIdentity(), runtimeRevision(), ActiveRelease, readActiveRelease(), BUILD_ENV (+37 more)

### Community 107 - "work.ts"
Cohesion: 0.12
Nodes (20): effectiveCause(), REPLACED, NO_RECORD, BLOCKED_CAUSES, blockedCauses(), NONE, projectReadiness(), ProjectReadiness (+12 more)

### Community 108 - "sign-in-unpark.ts"
Cohesion: 0.19
Nodes (18): hasPendingDelivery(), resumeAfterSignIn(), signInWait(), MAX_SIGN_IN_UNPARKS, unparkSignedIn(), BrowserPage, browserPages(), ReadPages (+10 more)

### Community 109 - "release-unpark.ts"
Cohesion: 0.33
Nodes (8): due(), MAX_RELEASE_UNPARKS, RELEASE_CHECK_MS, returnToPickup(), unparkReleasedWaits(), compare(), highestStableAtLeast(), parts()

### Community 110 - "blocker-followups.ts"
Cohesion: 0.11
Nodes (48): conversationReadbackReady(), followupOf(), pendingReadback(), queueConversationReadback(), readbackEnding(), replacedReadback(), uncertainConversations(), readBackConversations() (+40 more)

### Community 111 - "assignment-poll.ts"
Cohesion: 0.08
Nodes (31): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), twgConnection(), noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), BLOCK (+23 more)

### Community 112 - "fact-bounds.ts"
Cohesion: 0.25
Nodes (15): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+7 more)

### Community 113 - "MaintenanceRun"
Cohesion: 0.15
Nodes (15): CheckpointEligibility, BrainStatusSchema, identity, brainCheckpointCompletion(), coverageSchema, verified, PublishedPR, publishedWorkCleanedUp() (+7 more)

### Community 114 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 115 - "run-accounting.ts"
Cohesion: 0.17
Nodes (20): codexHome(), readCodexRollout(), HELPER_STDOUT_MAX_BYTES, helperAccounting(), claudeAccounting(), codexAccounting(), COMPLETION_MAX_BYTES, completionAccounting() (+12 more)

### Community 119 - "GitHubIssuePublisher"
Cohesion: 0.25
Nodes (6): PublicationReceipt, GitHubIssuePublisher, number(), same(), FeatureManifestItem, FeatureOperation

### Community 120 - "accessibility-sources.ts"
Cohesion: 0.24
Nodes (17): accessibilitySources(), actionable(), closingPull(), Finding, handoffIssue(), issueLines(), issueSource(), observation (+9 more)

### Community 121 - "follow-production.ts"
Cohesion: 0.20
Nodes (17): awaitingJiraStatus(), awaitingProduction(), FOLLOW_DAYS, followed(), isFollowed(), Azure, AzureRead, containedIn() (+9 more)

### Community 122 - "outbox.ts"
Cohesion: 0.15
Nodes (20): capabilityBlockedReviews(), latestReviews(), ADOPTION_STALLED_MS, conversationResolved(), projectOutbox(), item(), syncOutbox(), OwnerStepItem (+12 more)

### Community 123 - "enqueueRequest"
Cohesion: 0.12
Nodes (23): reconcileNoticeConfirmations(), ATTEMPT_DELAYS_MS, PrerequisitesSchema, classifyStop(), ReviewWait, reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS (+15 more)

### Community 124 - "refresh-issue-state.cjs"
Cohesion: 0.20
Nodes (19): advanceFence(), closingIssues(), githubRefs(), key(), normalizeGithubQuery(), normalizeRepository(), parseGithubQuery(), ref() (+11 more)

### Community 125 - "knowledge.ts"
Cohesion: 0.05
Nodes (45): args, [cmd,...rawArgs], commands, key, projectIndex, LessonBrainAudit, lessonBrainAudit(), LessonBrainOverlap (+37 more)

### Community 126 - "follow-up-alerts.ts"
Cohesion: 0.25
Nodes (11): checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), repeatedVendorReviewBlock(), stoppedInVendorReview(), leftToNextRun(), NEXT_RUN_DUE_MS, night() (+3 more)

### Community 127 - "interrupted-work-recovery.ts"
Cohesion: 0.25
Nodes (10): currentOutbox(), interruptAdoptions(), legacy(), REMOVED_FIELDS, retireLegacyRecovery(), goalNoticeNeverDispatched(), maintenanceNoticeNeverDispatched(), checkpointOutcome() (+2 more)

### Community 128 - "node-visuals.ts"
Cohesion: 0.20
Nodes (14): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+6 more)

### Community 129 - "admit-repair-waits.ts"
Cohesion: 0.23
Nodes (13): admitRepairWaits(), Covered, COVERING, expiryEvent(), expiryId(), lastProgress(), progressOf(), RepairWaitEntry (+5 more)

### Community 130 - "pre-push-boundary.ts"
Cohesion: 0.24
Nodes (11): Event, exactCommand(), Invocation, localHookCommand(), one(), prePushRejection(), PushIdentity, retirementBoundary() (+3 more)

### Community 131 - "it-specialist.ts"
Cohesion: 0.16
Nodes (21): partialLocalCleanupKey(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), heldFor(), ITContext, recoveryHeld() (+13 more)

### Community 132 - "telemetry.ts"
Cohesion: 0.13
Nodes (19): CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL, Rates (+11 more)

### Community 133 - "wait-idle.ts"
Cohesion: 0.40
Nodes (4): Health, IdleObservation, IdleResult, WaitIdleInput

### Community 134 - "pending-questions.ts"
Cohesion: 0.32
Nodes (8): FeaturePlanningBindings, assertQuestionVisibility(), normalizeRound(), pendingQuestions(), folded(), normalizeQuestion(), optionId(), RawQuestion

### Community 135 - "history-archive.ts"
Cohesion: 0.40
Nodes (7): archiveOldReports(), RETAINED_REPORTS, archiveByMonth(), archiveHistory(), archiveMonth(), archiveOldTaskDetail(), TASK_DETAIL_DAYS

### Community 136 - "coordination.ts"
Cohesion: 0.06
Nodes (46): MergeNotifications, admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, compatible(), dependencyCompletionKey(), dependencyEligibility() (+38 more)

### Community 137 - "Effects"
Cohesion: 0.18
Nodes (13): settleNotLanded(), GitHubOperations, assignedToJoe(), fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), tryReadyLessonIssue(), Wait (+5 more)

### Community 138 - "ledger.ts"
Cohesion: 0.17
Nodes (18): acceptedCompletionResolution(), investigationCandidates(), investigationId(), finishedSubjectResolution(), investigationFollowUps(), implementationReplacementResolution(), interruptedQARerunResolution(), investigationResolution() (+10 more)

### Community 139 - "checkpoint-retry.ts"
Cohesion: 0.33
Nodes (8): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), legacy, validateNativeContinuation(), Continuation

### Community 140 - "session-snapshot-cleanup.ts"
Cohesion: 0.40
Nodes (5): SNAPSHOT_PREFIX, removeStaleSessionSnapshots(), SNAPSHOT_SWEEP_MS, STALE_SNAPSHOT_MS, sweepStaleSessionSnapshots()

### Community 141 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 142 - "slot-policy.ts"
Cohesion: 0.36
Nodes (6): PROJECT_LOCAL, admitsWork(), canDispatch(), deliveryOccupied(), foreignWork(), WorkSlot

### Community 144 - "reconcile-merges.cjs"
Cohesion: 0.22
Nodes (14): collectPulls(), copyWikiForDryRun(), { execFileSync }, flattenPages(), fs, githubRequest(), isWikiBotPull(), main() (+6 more)

### Community 145 - "preferences-store.ts"
Cohesion: 0.19
Nodes (9): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS (+1 more)

### Community 146 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (7): CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility, overlayEntranceDelays(), SceneOverlay()

### Community 147 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 148 - "OfficeConfigView.tsx"
Cohesion: 0.39
Nodes (7): loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView(), policyText(), OfficeConfigSummary, errorText

### Community 149 - "qa-comment.ts"
Cohesion: 0.39
Nodes (6): OUTCOME, qaComment(), remote(), STAGE, plainWords(), tidy()

### Community 150 - "repoRoot"
Cohesion: 0.17
Nodes (14): repoRoot(), substantive(), main(), path, { spawnSync }, createServer(), fs, http (+6 more)

### Community 151 - "codex-rollout-file.ts"
Cohesion: 0.36
Nodes (7): BoundedRead, createdAt(), dayDirs(), header(), ROLLOUT_MAX_BYTES, RolloutScan, scanCodexRollouts()

### Community 152 - "validate_wiki_pr_body.cjs"
Cohesion: 0.33
Nodes (5): { execFileSync }, hasCanonicalWikiBody(), maintenanceBodies, matchesMaintenanceBody(), { readFileSync }

### Community 153 - "incident-command.ts"
Cohesion: 0.38
Nodes (6): FLAGS, incidentCommand(), IncidentCommandIO, option(), USAGE, whole()

### Community 155 - "run-usage.ts"
Cohesion: 0.38
Nodes (5): CodexRollout, claudeCrashZero(), claudeUsage(), count(), RunUsage

### Community 157 - "lesson-exits.ts"
Cohesion: 0.60
Nodes (5): expireLessons(), expiring(), graduateLessons(), graduating(), retire()

### Community 158 - "save-report.ts"
Cohesion: 0.60
Nodes (5): contained(), officeReport(), parsed(), saveQAReport(), settled()

### Community 160 - "qa-plan-retry.ts"
Cohesion: 0.67
Nodes (3): QAPlanRetry, QAPlanRetryProof, QAPlanRetryRequest

### Community 161 - "live-reach.ts"
Cohesion: 0.47
Nodes (5): GIT_NETWORK, LIVE_PROVIDERS, liveReach(), networkUrl(), remoteUrls()

## Knowledge Gaps
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `ref_node_path`, `features.ts`, `artifact`, `retrospective-subject.ts`, `ref_node_crypto`, `store.ts`, `accept-retrospective.ts`, `demand-facts.ts`, `scheduled-captures.ts`, `OfficeSnapshot`, `record-trigger.ts`, `GitHubDelivery`, `currentAssignment`, `move-lane.ts`, `weekly-rollup.ts`, `jira-time.ts`, `maintenance/maintenance.ts`, `worker-runtime.ts`, `agents.ts`, `github-readiness.ts`, `digest`, `github-delivery.ts`, `index.ts`, `remove-candidate.ts`, `run.ts`, `scheduled-work.ts`, `run-retrospective.ts`, `.emit`, `time-scope.ts`, `jiraBinding`, `Offices`, `.transaction`, `ticket-stage-runner.ts`, `intent.ts`, `effects.ts`, `state-parts.ts`, `controller-runtime.ts`, `recovery/stopped-base-update.ts`, `owned-artifact.ts`, `cost-ledger.ts`, `unsent-time.ts`, `brain-maintenance.ts`, `judge-resumes.ts`, `alert-issue.ts`, `resume-arrivals.ts`, `ticket-evidence.ts`, `setup-stop-cap.ts`, `assignments.ts`, `project-bindings.ts`, `diagnostic-snapshot.ts`, `cec.ts`, `session-bridge.ts`, `IncidentLedger`, `goal-reviews.ts`, `harnessEffect`, `github.ts`, `stopped-record.ts`, `sanitize`, `provider-observation.ts`, `readable-jira-comment.ts`, `report.ts`, `holdReason`, `Ticket`, `notifications.ts`, `shared.ts`, `control-store.ts`, `sign-in-unpark.ts`, `release-unpark.ts`, `blocker-followups.ts`, `assignment-poll.ts`, `MaintenanceRun`, `run-accounting.ts`, `accessibility-sources.ts`, `follow-production.ts`, `enqueueRequest`, `interrupted-work-recovery.ts`, `admit-repair-waits.ts`, `it-specialist.ts`, `pending-questions.ts`, `coordination.ts`, `Effects`, `ledger.ts`, `checkpoint-retry.ts`, `lesson-exits.ts`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `command()` (e.g. with `startServiceTicks()` and `realMachine()`) actually correct?**
  _`command()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Should `incidents/routes.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05789473684210526 - nodes in this community are weakly interconnected._
- **Why does `command()` connect `Store` to `incidents/routes.ts`, `ref_node_path`, `features.ts`, `coordination.ts`, `Effects`, `ref_node_crypto`, `accept-retrospective.ts`, `deploy-command.ts`, `GitHubDelivery`, `currentAssignment`, `move-lane.ts`, `jira-time.ts`, `maintenance/maintenance.ts`, `worker-runtime.ts`, `agents.ts`, `github-readiness.ts`, `lesson-exits.ts`, `digest`, `github-delivery.ts`, `remove-candidate.ts`, `live-reach.ts`, `jiraBinding`, `.transaction`, `change-scope.ts`, `ticket-stage-runner.ts`, `intent.ts`, `controller-runtime.ts`, `cost-ledger.ts`, `unsent-time.ts`, `brain-maintenance.ts`, `ticket-evidence.ts`, `assignments.ts`, `service-health.ts`, `project-bindings.ts`, `cec.ts`, `session-bridge.ts`, `IncidentLedger`, `harnessEffect`, `github.ts`, `contract.ts`, `provider-observation.ts`, `readable-jira-comment.ts`, `holdReason`, `Ticket`, `notifications.ts`, `shared.ts`, `deploy-plan.ts`, `MaintenanceRun`, `accessibility-sources.ts`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Should `OrgChart.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11613475177304965 - nodes in this community are weakly interconnected._
- **Why does `OfficeSnapshot` connect `OfficeSnapshot` to `OrgChart.tsx`, `Inspector.tsx`, `history-archive.ts`, `coordination.ts`, `Button`, `ledger.ts`, `store.ts`, `App.tsx`, `TelemetryPanel.tsx`, `scene-motion.ts`, `record-trigger.ts`, `maintenance/maintenance.ts`, `Outbox.tsx`, `github-delivery.ts`, `index.ts`, `run.ts`, `Store`, `harness-baseline.ts`, `OfficeScene.tsx`, `state-parts.ts`, `FeatureWorkspace.tsx`, `judge-resumes.ts`, `resume-arrivals.ts`, `service-health.ts`, `project-bindings.ts`, `diagnostic-snapshot.ts`, `incidents.ts`, `stopped-record.ts`, `sanitize`, `Conversation.tsx`, `index.tsx`, `holdReason`, `shared.ts`, `control-store.ts`, `work.ts`, `assignment-poll.ts`, `MaintenanceRun`, `outbox.ts`, `follow-up-alerts.ts`, `interrupted-work-recovery.ts`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Should `ref_node_path` be split into smaller, more focused modules?**
  _Cohesion score 0.05232646834477498 - nodes in this community are weakly interconnected._