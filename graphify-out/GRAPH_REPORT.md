# Graph Report - office  (2026-11-09)

## Corpus Check
- 505 files · ~239,049 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2859 nodes · 12081 edges · 90 communities (88 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 67 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `37e27f53`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Inspector.tsx
- activation-recovery.ts
- artifact
- command
- github-delivery.ts
- currentAssignment
- source-amendment.ts
- OfficeScene.tsx
- azure.ts
- cec/issue-publication.ts
- record-trigger.ts
- offices.ts
- time-scope.ts
- TimeBook.tsx
- Store
- worker-runtime.ts
- agents.ts
- conversations/conversations.ts
- digest
- run-retrospective.ts
- daily-cto.ts
- knowledge.ts
- Role
- App.tsx
- maintenance.ts
- TicketJob
- scheduled-work.ts
- source-amendment-scope.ts
- it-specialist.ts
- session-bridge.ts
- shared.ts
- tracking-issue.ts
- OfficeSnapshot
- SettingsPanel.tsx
- store.ts
- remove-candidate.ts
- dependency-bots/adopt.ts
- park-ticket.ts
- dependencies.ts
- work-summary.ts
- index.ts
- Coordinator
- features.ts
- MaintenanceRun
- Engine
- delivery-repairs.ts
- .emit
- validate-stage.ts
- goal-reviews.ts
- api-routes.ts
- engine.ts
- conversations/slack.ts
- ledger.ts
- outbox.ts
- .transaction
- .getEffect
- coordination.ts
- admit-improvement.ts
- lesson-selection.ts
- telemetry.ts
- coordination-tick.ts
- report.ts
- delivery-task.ts
- notifications.ts
- features/workflow.ts
- preferences-store.ts
- approach.ts
- publish-pr.ts
- assignment-poll.ts
- saved-prerequisite-handoff.ts
- evidence.ts
- work.ts
- cec/workflow.ts
- codex-rollout-file.ts
- .value
- harnessEffect
- DailyCTO.tsx
- create-candidate.ts
- codex-rollout.ts
- SlackMessages
- effects.ts
- price-table.ts
- cli.ts
- planning-baseline.ts
- channel-notice.ts
- JiraOperations
- dependency-edges.ts
- slack-supersession.ts
- helper-evidence.py

## God Nodes (most connected - your core abstractions)
1. `Store` - 269 edges
2. `TicketJob` - 122 edges
3. `GitHubDelivery` - 118 edges
4. `command()` - 97 edges
5. `artifact()` - 85 edges
6. `digest()` - 82 edges
7. `cx()` - 77 edges
8. `workKey()` - 73 edges
9. `OfficeSnapshot` - 66 edges
10. `StageResult` - 64 edges

## Surprising Connections (you probably didn't know these)
- `readAzurePRs()` --indirect_call--> `row()`  [INFERRED]
  server/cec/observed-prs.ts → src/telemetry/report.ts
- `rows()` --indirect_call--> `row()`  [INFERRED]
  server/delivery/recovery/source-amendment/source-amendment-scope.ts → src/telemetry/report.ts
- `tree()` --indirect_call--> `row()`  [INFERRED]
  server/features/planning-baseline.ts → src/telemetry/report.ts
- `DeliverySlot` --references--> `Role`  [EXTRACTED]
  server/office/projects.ts → src/shared.ts
- `correctRecoveryClassification()` --indirect_call--> `row()`  [INFERRED]
  server/time/time-classification.ts → src/telemetry/report.ts

## Import Cycles
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/stage-reconciliation.ts -> server/delivery/recovery/implementation/continuation-review-readback.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/recovery/retire-external-delivery.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-guard.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/preparation/post-conflict-preparation.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-publication.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/conversations/conversations.ts -> server/conversations/slack.ts -> server/workers/agents.ts -> server/conversations/conversations.ts`
- 3-file cycle: `server/conversations/slack.ts -> server/workers/agents.ts -> server/workers/worker-runtime.ts -> server/conversations/slack.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/scope-repair/scope-repair-resume.ts -> server/delivery/recovery/validation/validation-provider-context.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/conversations/conversations.ts -> server/scheduling/engine.ts -> server/workers/agents.ts -> server/conversations/conversations.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/stage-prompts.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-checkout.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-evidence.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-preparation.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/conversations/conversation-recovery.ts -> server/conversations/conversations.ts -> server/conversations/team-conversation-pump.ts -> server/conversations/conversation-recovery.ts`
- 3-file cycle: `server/scheduling/coordination-pump.ts -> server/scheduling/requests.ts -> server/scheduling/coordination.ts -> server/scheduling/coordination-pump.ts`
- 3-file cycle: `server/scheduling/coordination-tick.ts -> server/scheduling/requests.ts -> server/scheduling/coordination.ts -> server/scheduling/coordination-tick.ts`

## Communities (90 total, 2 thin omitted)

### Community 0 - "Inspector.tsx"
Cohesion: 0.07
Nodes (74): Conversation(), Outbox(), SendMessage, slackMessageStatus(), SlackDeliveryCard(), ServiceHealthPanel(), labels, ServiceHealthRow() (+66 more)

### Community 1 - "activation-recovery.ts"
Cohesion: 0.07
Nodes (76): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+68 more)

### Community 2 - "artifact"
Cohesion: 0.08
Nodes (72): continuationNativeReview(), discoveryRecoveryCandidate(), implementationRecoveryCandidate(), assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts() (+64 more)

### Community 3 - "command"
Cohesion: 0.05
Nodes (58): GitHubFeaturePublisher, Result, Assessment, captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION (+50 more)

### Community 4 - "github-delivery.ts"
Cohesion: 0.09
Nodes (59): containedFile(), findingsBlock(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery(), BOARD_RULE, conflictRefreshInstruction() (+51 more)

### Community 5 - "currentAssignment"
Cohesion: 0.08
Nodes (48): observe(), lintPRContent(), checksFailed(), checksPassed(), checksPending(), CurrentChecksWait, currentMergeChecks(), pass() (+40 more)

### Community 6 - "source-amendment.ts"
Cohesion: 0.08
Nodes (57): adoptCandidate(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat() (+49 more)

### Community 7 - "OfficeScene.tsx"
Cohesion: 0.06
Nodes (52): itAgent(), itDiagnostics(), Avatar(), AzureWall(), Chair(), Coworker(), CTORoom(), Desk() (+44 more)

### Community 8 - "azure.ts"
Cohesion: 0.07
Nodes (46): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+38 more)

### Community 9 - "cec/issue-publication.ts"
Cohesion: 0.09
Nodes (19): Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), plainDescription(), Transition, JiraFeaturePublisher (+11 more)

### Community 10 - "record-trigger.ts"
Cohesion: 0.07
Nodes (50): deliveryMetrics(), median(), LEARNING_BASELINES, maintenanceSubject(), MaintenanceSubjectFacts, busyMaintenanceIds(), clip(), maintenanceBlockedId() (+42 more)

### Community 11 - "offices.ts"
Cohesion: 0.07
Nodes (37): normalizeStatement(), decideOfficeProposal(), mirrorOfficeKnowledge(), now(), OfficeKnowledgeStore, proposeOfficeLessons(), retireOfficeLesson(), Input (+29 more)

### Community 12 - "time-scope.ts"
Cohesion: 0.09
Nodes (44): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), data(), envelope() (+36 more)

### Community 13 - "TimeBook.tsx"
Cohesion: 0.08
Nodes (43): TelemetryReport, displayAgentTask(), githubStageLabels, withoutElapsed(), LiveAgentTask(), Props, RunningTask(), text() (+35 more)

### Community 14 - "Store"
Cohesion: 0.09
Nodes (22): featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), recoverFeatures(), maintainLearning(), dispatchExposure(), fifo(), ScheduledWork (+14 more)

### Community 15 - "worker-runtime.ts"
Cohesion: 0.07
Nodes (33): assignmentSubject(), DATA, LOCAL_BINDINGS, contextPacket(), DeliverySlot, officeCapacity, assertModelOverrides(), CODEX_DEFAULT_EFFORT (+25 more)

### Community 16 - "agents.ts"
Cohesion: 0.08
Nodes (33): cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), cecChatPrompt(), ctoChatPrompt(), itChatPrompt(), slackSendPrompt() (+25 more)

### Community 17 - "conversations/conversations.ts"
Cohesion: 0.10
Nodes (29): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+21 more)

### Community 18 - "digest"
Cohesion: 0.11
Nodes (44): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+36 more)

### Community 19 - "run-retrospective.ts"
Cohesion: 0.09
Nodes (37): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, improvementIntakeGate(), learningDigest(), recordLearningOpportunity(), appendLearningFacts(), expireLearningPackets() (+29 more)

### Community 20 - "daily-cto.ts"
Cohesion: 0.10
Nodes (23): mirror(), ResearchResult, runWeeklyResearch(), scheduledResearch(), lastFriday(), DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts (+15 more)

### Community 21 - "knowledge.ts"
Cohesion: 0.07
Nodes (42): learningMetrics(), lessonsNeedingReview(), Kind, RetrospectiveResult, RollupResult, RollupResultSchema, Stage, harperFolder() (+34 more)

### Community 22 - "Role"
Cohesion: 0.10
Nodes (39): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+31 more)

### Community 23 - "App.tsx"
Cohesion: 0.06
Nodes (41): CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants, ElevatorPhase, floorVariants, leftDoor, OfficeScene (+33 more)

### Community 24 - "maintenance.ts"
Cohesion: 0.09
Nodes (28): maintenancePolicies(), captureMaintenanceStep(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice(), candidateOwner() (+20 more)

### Community 25 - "TicketJob"
Cohesion: 0.08
Nodes (19): dependabotReviewGuidance(), StageContext, GitHubDelivery, stagePrompt(), StagePromptInput, stageRole(), Assessment, diagnosticProof() (+11 more)

### Community 26 - "scheduled-work.ts"
Cohesion: 0.09
Nodes (33): deliverySlot(), ROLES, closeoutRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), currentApproval(), featureGate(), observeHelperGroups() (+25 more)

### Community 27 - "source-amendment-scope.ts"
Cohesion: 0.08
Nodes (39): approvedText(), assert(), assert(), normalize(), officialUrls, ReleaseCapture, verifyReleaseCaptures(), amendmentCaptureObservation() (+31 more)

### Community 28 - "it-specialist.ts"
Cohesion: 0.10
Nodes (25): savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), ITContext, diagnosticContext(), diagnosticSnapshot(), publishITReport() (+17 more)

### Community 29 - "session-bridge.ts"
Cohesion: 0.12
Nodes (23): claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexSessionContext(), readRollout, claudeSessions(), codexSessions() (+15 more)

### Community 30 - "shared.ts"
Cohesion: 0.09
Nodes (29): ProjectReadiness, SchedulerState, loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView(), acceptPreferences(), PreferenceCandidate (+21 more)

### Community 31 - "tracking-issue.ts"
Cohesion: 0.18
Nodes (26): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard, projectCards() (+18 more)

### Community 32 - "OfficeSnapshot"
Cohesion: 0.11
Nodes (22): FeatureRound, recommendedReply(), FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures() (+14 more)

### Community 33 - "SettingsPanel.tsx"
Cohesion: 0.19
Nodes (22): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS, PickupForm(), SettingsPanel() (+14 more)

### Community 34 - "store.ts"
Cohesion: 0.12
Nodes (20): Clock, systemClock, sanitizeObject(), applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, migrateSnapshot() (+12 more)

### Community 35 - "remove-candidate.ts"
Cohesion: 0.16
Nodes (21): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), removeAdoptedClone() (+13 more)

### Community 36 - "dependency-bots/adopt.ts"
Cohesion: 0.15
Nodes (24): readBackOrThrow(), closesIssue(), linkedBody(), linkPR(), dependabotPR, readRepo(), ensureTrackingIssue(), findTrackingIssue() (+16 more)

### Community 37 - "park-ticket.ts"
Cohesion: 0.21
Nodes (25): unpack(), BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue(), readIssues() (+17 more)

### Community 38 - "dependencies.ts"
Cohesion: 0.15
Nodes (18): Admission, admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, resumeParked(), compatible(), dependencyCompletionKey() (+10 more)

### Community 39 - "work-summary.ts"
Cohesion: 0.17
Nodes (22): themeColor, App(), usePanelFocus(), deliveryRepairProjection(), ACTIVE, maintenanceUpdate(), PMQueueItem, pmQueueItems() (+14 more)

### Community 40 - "index.ts"
Cohesion: 0.12
Nodes (20): close(), config, itSpecialist, loadedRevision, offices, releaseLock, server, serviceHealth (+12 more)

### Community 41 - "Coordinator"
Cohesion: 0.08
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 42 - "features.ts"
Cohesion: 0.14
Nodes (18): artifactPath(), document(), featureRoot(), EvidenceSchema, helperInstallation(), readReview(), ReviewEvidence, stopHelperGroups() (+10 more)

### Community 43 - "MaintenanceRun"
Cohesion: 0.14
Nodes (16): BrainStatusSchema, identity, brainCheckpointCompletion(), coverageSchema, followupSchema, verified, checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup() (+8 more)

### Community 44 - "Engine"
Cohesion: 0.09
Nodes (5): correlatedBuild(), Engine, observe(), observeParked(), parkedReadError

### Community 45 - "delivery-repairs.ts"
Cohesion: 0.23
Nodes (17): run(), namedRepairIds(), approachFingerprint(), enqueueRepairDiagnosis(), githubRepairEligible(), jiraRepairable(), repairFindingIds(), reserveRepair() (+9 more)

### Community 46 - ".emit"
Cohesion: 0.20
Nodes (19): retryRecipientLookup(), bindDiscoveryResume(), DiscoveryResumeInput, failedWorker(), requeueWaitedImplement(), baselineLearning(), configureKnowledge(), declineLessonIssue() (+11 more)

### Community 47 - "validate-stage.ts"
Cohesion: 0.18
Nodes (16): HarnessControl, withHarnessWork(), runHarnessStage(), harnessStageResult(), receipt(), Check, harnessChecks(), harnessValidate() (+8 more)

### Community 48 - "goal-reviews.ts"
Cohesion: 0.12
Nodes (18): applyGoalReview(), EvidenceRefSchema, FreshDailyResultSchema, statusAllowed(), workEvidence(), GoalInput, saveGoal(), queueGoalNotice() (+10 more)

### Community 49 - "api-routes.ts"
Cohesion: 0.22
Nodes (14): featureById(), Link, linkFeature(), featureRoute(), FeatureWorkflow, goalHistory(), apiRoute(), RequestContext (+6 more)

### Community 50 - "engine.ts"
Cohesion: 0.20
Nodes (18): checkMail(), drainMail(), requestMail(), dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), resume() (+10 more)

### Community 51 - "conversations/slack.ts"
Cohesion: 0.19
Nodes (11): channelNoticeAuthorized(), MergeNotifications, goalNoticeAuthorized(), goalNoticeNeverDispatched(), sendGoalNotice(), maintenanceNoticeAuthorized(), maintenanceNoticeNeverDispatched(), sendMaintenanceNotice() (+3 more)

### Community 52 - "ledger.ts"
Cohesion: 0.25
Nodes (13): projectSlackDeliveries(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint(), supersedingDelivery(), investigationCandidates(), investigationId() (+5 more)

### Community 53 - "outbox.ts"
Cohesion: 0.22
Nodes (15): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), projectOutbox(), syncOutbox(), slackRequestSettled(), readBackConversations() (+7 more)

### Community 54 - ".transaction"
Cohesion: 0.25
Nodes (16): approveFeature(), assertRetainedItems(), commandFeature(), createFeature(), mutation(), reviewQuestions(), digest(), assertEnrollable() (+8 more)

### Community 55 - ".getEffect"
Cohesion: 0.24
Nodes (6): publishFeature(), reserveIdentity(), GitHubOperations, closeNativeRefresh(), fingerprint(), EffectIntent

### Community 56 - "coordination.ts"
Cohesion: 0.18
Nodes (18): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation(), checkpointWindow(), dueAt() (+10 more)

### Community 57 - "admit-improvement.ts"
Cohesion: 0.22
Nodes (15): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+7 more)

### Community 58 - "lesson-selection.ts"
Cohesion: 0.19
Nodes (16): knowledgeContext(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), LessonSelection, MAINTENANCE (+8 more)

### Community 59 - "telemetry.ts"
Cohesion: 0.17
Nodes (15): basisOf(), claudeCost(), toMicroUsd(), claudeCrashZero(), claudeUsage(), count(), CostCompleteness, CostComponent (+7 more)

### Community 60 - "coordination-tick.ts"
Cohesion: 0.20
Nodes (14): reconcileNoticeConfirmations(), PrerequisitesSchema, reconcileCompletedCheckpoints(), legacy, reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION (+6 more)

### Community 61 - "report.ts"
Cohesion: 0.20
Nodes (17): proveOutsideAmendmentUnchanged(), requireThat(), rows(), TelemetryRow, TelemetrySync, Acc, bump(), EASTERN (+9 more)

### Community 62 - "delivery-task.ts"
Cohesion: 0.20
Nodes (12): cecPrompt(), resolvedDecisionNote(), stageInstructions, APPROACH_GUIDANCE, reviewInstructions(), deliveryTask(), DeliveryTaskInput, DISCOVERY_GUIDANCE (+4 more)

### Community 63 - "notifications.ts"
Cohesion: 0.24
Nodes (13): clamp(), LIMITS, MergedPR, plainSlackText(), section(), shippedSummary(), configureNotices(), Identity (+5 more)

### Community 64 - "features/workflow.ts"
Cohesion: 0.28
Nodes (11): discoveryPrompt(), planPrompt(), DiscoverySchema, identity, manifestFromPlan(), ManifestSchema, PlanSchema, text (+3 more)

### Community 65 - "preferences-store.ts"
Cohesion: 0.19
Nodes (10): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS (+2 more)

### Community 66 - "approach.ts"
Cohesion: 0.30
Nodes (12): parksInJira(), DECISION_KINDS, needsDecision(), afterDraft(), ApproachSchema, firstBuildStage(), missingApproachStage(), plannedNext() (+4 more)

### Community 67 - "publish-pr.ts"
Cohesion: 0.25
Nodes (12): retryRead(), developerPRContent(), Execute, officePRContent(), prContent, assertCandidate(), Candidate, Execute (+4 more)

### Community 68 - "assignment-poll.ts"
Cohesion: 0.21
Nodes (11): adoptDependabot(), openDependabotPulls(), refusal(), pinCourier, due(), unparkReleasedWaits(), compare(), highestStableAtLeast() (+3 more)

### Community 69 - "saved-prerequisite-handoff.ts"
Cohesion: 0.32
Nodes (13): continuationWorktree(), dependencyVersion(), handoffSavedPrerequisites(), hasSavedPrerequisiteResult(), Ownership, qualified(), readDependencies(), requireSavedPrerequisites() (+5 more)

### Community 70 - "evidence.ts"
Cohesion: 0.30
Nodes (10): investigationEvidence(), OFFICE_SOURCE_PATHS, officeSource(), ROOT, done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact() (+2 more)

### Community 71 - "work.ts"
Cohesion: 0.15
Nodes (13): AssignmentResult, CompletionCondition, Continuation, DependencyObservation, EligibilityState, FailureCategory, Prerequisite, ReconciliationAction (+5 more)

### Community 72 - "cec/workflow.ts"
Cohesion: 0.29
Nodes (10): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), publicationEvidenceGap(), qaEvidenceGap(), resultGate(), stageResultGap(), unresolvedVerification() (+2 more)

### Community 73 - "codex-rollout-file.ts"
Cohesion: 0.22
Nodes (12): createdAt(), dayDirs(), header(), readCodexRollout(), ROLLOUT_MAX_BYTES, RolloutScan, scanCodexRollouts(), codexPriceRef() (+4 more)

### Community 74 - ".value"
Cohesion: 0.24
Nodes (6): file, folder, logs, root, xml(), ProjectProgress

### Community 75 - "harnessEffect"
Cohesion: 0.35
Nodes (8): activeEffectId(), harnessEffect, park(), officeMergeProvenance(), retryMergeScanner(), runIdentity(), transientScannerJobs(), recordParked()

### Community 76 - "DailyCTO.tsx"
Cohesion: 0.26
Nodes (8): CTOReview(), goalState, DailyCTO(), GoalHistory(), reportDate(), reviewStatus, reviewExcerpt(), ReviewText()

### Community 77 - "create-candidate.ts"
Cohesion: 0.31
Nodes (9): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+1 more)

### Community 78 - "codex-rollout.ts"
Cohesion: 0.25
Nodes (10): add(), CodexRequest, CodexRollout, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens() (+2 more)

### Community 79 - "SlackMessages"
Cohesion: 0.38
Nodes (3): comparableSlackText(), SlackMessages, SlackRequestSchema

### Community 80 - "effects.ts"
Cohesion: 0.29
Nodes (7): featureEffectGate(), fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), EffectOperation, EffectUncertainError, WorkRef

### Community 81 - "price-table.ts"
Cohesion: 0.20
Nodes (8): CacheWriteDuration, CODEX_ROWS, ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL, Rates, PriceRef

### Community 82 - "cli.ts"
Cohesion: 0.25
Nodes (6): args, [cmd,...rawArgs], commands, key, projectIndex, PORT

### Community 83 - "planning-baseline.ts"
Cohesion: 0.46
Nodes (6): compareBaseline(), prepareBaseline(), scopePaths(), SourceChanged, tree(), targetObservation()

### Community 84 - "channel-notice.ts"
Cohesion: 0.70
Nodes (4): ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice()

### Community 86 - "dependency-edges.ts"
Cohesion: 1.00
Nodes (3): assertFeatureDependencyOrder(), featureDependencyEdges(), key()

### Community 87 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

## Knowledge Gaps
- **347 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+342 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `activation-recovery.ts`, `artifact`, `command`, `github-delivery.ts`, `currentAssignment`, `source-amendment.ts`, `azure.ts`, `cec/issue-publication.ts`, `record-trigger.ts`, `offices.ts`, `time-scope.ts`, `worker-runtime.ts`, `agents.ts`, `conversations/conversations.ts`, `digest`, `run-retrospective.ts`, `daily-cto.ts`, `knowledge.ts`, `maintenance.ts`, `TicketJob`, `scheduled-work.ts`, `it-specialist.ts`, `session-bridge.ts`, `tracking-issue.ts`, `OfficeSnapshot`, `store.ts`, `remove-candidate.ts`, `dependency-bots/adopt.ts`, `park-ticket.ts`, `dependencies.ts`, `Coordinator`, `features.ts`, `MaintenanceRun`, `Engine`, `delivery-repairs.ts`, `.emit`, `validate-stage.ts`, `goal-reviews.ts`, `api-routes.ts`, `engine.ts`, `conversations/slack.ts`, `ledger.ts`, `outbox.ts`, `.transaction`, `.getEffect`, `coordination.ts`, `admit-improvement.ts`, `lesson-selection.ts`, `coordination-tick.ts`, `delivery-task.ts`, `notifications.ts`, `features/workflow.ts`, `publish-pr.ts`, `assignment-poll.ts`, `saved-prerequisite-handoff.ts`, `evidence.ts`, `.value`, `harnessEffect`, `create-candidate.ts`, `SlackMessages`, `effects.ts`, `planning-baseline.ts`, `channel-notice.ts`, `JiraOperations`, `dependency-edges.ts`?**
  _High betweenness centrality (0.108) - this node is a cross-community bridge._
- **Why does `Engine` connect `Engine` to `artifact`, `command`, `github-delivery.ts`, `azure.ts`, `offices.ts`, `worker-runtime.ts`, `agents.ts`, `conversations/conversations.ts`, `daily-cto.ts`, `maintenance.ts`, `scheduled-work.ts`, `dependencies.ts`, `Coordinator`, `delivery-repairs.ts`, `api-routes.ts`, `engine.ts`, `conversations/slack.ts`, `coordination.ts`, `notifications.ts`, `JiraOperations`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `command()` connect `command` to `artifact`, `github-delivery.ts`, `currentAssignment`, `source-amendment.ts`, `azure.ts`, `cec/issue-publication.ts`, `time-scope.ts`, `worker-runtime.ts`, `agents.ts`, `digest`, `maintenance.ts`, `TicketJob`, `scheduled-work.ts`, `it-specialist.ts`, `session-bridge.ts`, `tracking-issue.ts`, `remove-candidate.ts`, `park-ticket.ts`, `dependencies.ts`, `Coordinator`, `features.ts`, `Engine`, `delivery-repairs.ts`, `validate-stage.ts`, `engine.ts`, `conversations/slack.ts`, `.transaction`, `.getEffect`, `coordination.ts`, `admit-improvement.ts`, `notifications.ts`, `features/workflow.ts`, `publish-pr.ts`, `.value`, `create-candidate.ts`, `effects.ts`, `planning-baseline.ts`, `JiraOperations`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `command()` (e.g. with `.constructor()` and `executeRequest()`) actually correct?**
  _`command()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _347 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Inspector.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07050092764378478 - nodes in this community are weakly interconnected._
- **Should `activation-recovery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0749063670411985 - nodes in this community are weakly interconnected._