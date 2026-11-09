# Graph Report - the-office  (2026-11-09)

## Corpus Check
- 500 files · ~236,368 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2845 nodes · 11960 edges · 90 communities (87 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 67 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2e0f2155`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- .save
- store.ts
- dependency-bots/adopt.ts
- source-amendment.ts
- http/commands.ts
- Store
- Inspector.tsx
- digest
- requests.ts
- OfficeScene.tsx
- features/workflow.ts
- cec/workflow.ts
- App.tsx
- accept-stage-result.ts
- worker-runtime.ts
- index.tsx
- shared.ts
- work-summary.ts
- PeoplePanel.tsx
- conversations/conversations.ts
- github-delivery.ts
- workKey
- publish-pr.ts
- record-trigger.ts
- it-specialist.ts
- maintenance.ts
- scheduler.ts
- daily-cto.ts
- run-retrospective.ts
- outbox.ts
- github/issue-publication.ts
- goal-reporting.ts
- activation-recovery.ts
- TicketJob
- session-bridge.ts
- scope-repair-resume.ts
- github-readiness.ts
- telemetry.ts
- TimeBook.tsx
- cost-ledger.ts
- run-accounting.ts
- OfficeSnapshot
- offices.ts
- time-scope.ts
- .transaction
- StageResult
- executeRequest
- hasUncertainEffects
- features.ts
- engine.ts
- github-check-selection.ts
- weekly-research.ts
- knowledge.ts
- Coordinator
- JiraIssuePublisher
- goal-reviews.ts
- .emit
- dependencies.ts
- Conversation.tsx
- run.ts
- admit-improvement.ts
- retrospective-subject.ts
- lesson-selection.ts
- MaintenanceRun
- jira-time.ts
- weekly-rollup.ts
- contract.ts
- coordination-tick.ts
- WorkTime
- coordination.ts
- report.ts
- github-context.ts
- office-lessons.ts
- work.ts
- DailyCTO.tsx
- create-candidate.ts
- evidence.ts
- retire-external-delivery.ts
- codex-rollout.ts
- cli.ts
- checkpoint-retry.ts
- checkpoint-completion.ts
- codex-rollout-file.ts
- scheduled-retrospectives.ts
- CommandRegistry
- install-service.mjs
- liveReach
- slack-supersession.ts
- helper-evidence.py

## God Nodes (most connected - your core abstractions)
1. `Store` - 268 edges
2. `TicketJob` - 117 edges
3. `GitHubDelivery` - 112 edges
4. `command()` - 96 edges
5. `artifact()` - 85 edges
6. `digest()` - 82 edges
7. `cx()` - 77 edges
8. `workKey()` - 73 edges
9. `OfficeSnapshot` - 66 edges
10. `StageResult` - 63 edges

## Surprising Connections (you probably didn't know these)
- `readAzurePRs()` --indirect_call--> `row()`  [INFERRED]
  server/cec/observed-prs.ts → src/telemetry/report.ts
- `rows()` --indirect_call--> `row()`  [INFERRED]
  server/delivery/recovery/source-amendment/source-amendment-held.ts → src/telemetry/report.ts
- `proveOutsideAmendmentUnchanged()` --indirect_call--> `row()`  [INFERRED]
  server/delivery/recovery/source-amendment/source-amendment-held.ts → src/telemetry/report.ts
- `rows()` --indirect_call--> `row()`  [INFERRED]
  server/delivery/recovery/source-amendment/source-amendment-scope.ts → src/telemetry/report.ts
- `tree()` --indirect_call--> `row()`  [INFERRED]
  server/features/planning-baseline.ts → src/telemetry/report.ts

## Import Cycles
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/stage-reconciliation.ts -> server/delivery/recovery/implementation/continuation-review-readback.ts -> server/delivery/pipeline/github-delivery.ts`
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
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/implementation/activation-recovery.ts -> server/delivery/recovery/validation/validation-provider-context.ts -> server/delivery/pipeline/github-delivery.ts`

## Communities (90 total, 3 thin omitted)

### Community 0 - ".save"
Cohesion: 0.05
Nodes (64): JiraOperations, plain(), unpack(), BLOCKED, Execute, findComment(), jira(), LiveIssue (+56 more)

### Community 1 - "store.ts"
Cohesion: 0.06
Nodes (55): cecPrompt(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), resolvedDecisionNote(), stageInstructions, cecChatPrompt() (+47 more)

### Community 2 - "dependency-bots/adopt.ts"
Cohesion: 0.08
Nodes (61): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard, projectCards() (+53 more)

### Community 3 - "source-amendment.ts"
Cohesion: 0.06
Nodes (69): adoptCandidate(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat() (+61 more)

### Community 4 - "http/commands.ts"
Cohesion: 0.07
Nodes (51): retryRecipientLookup(), AUTO_ADOPT_BOTS, close(), config, itSpecialist, loadedRevision, offices, releaseLock (+43 more)

### Community 5 - "Store"
Cohesion: 0.05
Nodes (16): correlatedBuild(), Content, jiraText(), JiraFeaturePublisher, Assessment, Engine, observe(), observeParked() (+8 more)

### Community 6 - "Inspector.tsx"
Cohesion: 0.09
Nodes (46): Outbox(), itAgent(), itDiagnostics(), ServiceHealthPanel(), labels, ServiceHealthRow(), BlockerFollowups(), GoalList() (+38 more)

### Community 7 - "digest"
Cohesion: 0.09
Nodes (53): verifiedCloseoutCleanupRequest(), dependencyVersion(), assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), reconcileCompletedConflictDraft() (+45 more)

### Community 8 - "requests.ts"
Cohesion: 0.09
Nodes (55): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+47 more)

### Community 9 - "OfficeScene.tsx"
Cohesion: 0.07
Nodes (48): Avatar(), AzureWall(), Chair(), Coworker(), CTORoom(), Desk(), Furnishings, Handoff() (+40 more)

### Community 10 - "features/workflow.ts"
Cohesion: 0.11
Nodes (38): approveFeature(), assertRetainedItems(), commandFeature(), createFeature(), featureById(), mutation(), reviewQuestions(), assertFeatureDependencyOrder() (+30 more)

### Community 11 - "cec/workflow.ts"
Cohesion: 0.11
Nodes (43): parksInJira(), run(), advance(), nextStage(), publicationEvidenceGap(), qaEvidenceGap(), resultGate(), stageResultGap() (+35 more)

### Community 12 - "App.tsx"
Cohesion: 0.06
Nodes (44): SendMessage, blank(), goalInput, Goals(), CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants (+36 more)

### Community 13 - "accept-stage-result.ts"
Cohesion: 0.13
Nodes (42): acceptStageResult(), PrerequisitesSchema, mergeAuthorized(), allowed, continuationNativeReview(), continuationReviewArtifacts(), continuationWorkerProof(), negativeWorker() (+34 more)

### Community 14 - "worker-runtime.ts"
Cohesion: 0.08
Nodes (34): assignmentSubject(), officeCapacity, assertModelOverrides(), CODEX_DEFAULT_EFFORT, CODEX_DEFAULT_MODEL, CODEX_EFFORTS, CODEX_ROLES, ModelRoute (+26 more)

### Community 15 - "index.tsx"
Cohesion: 0.12
Nodes (35): LessonsPanel(), when(), ResearchSummary(), SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm() (+27 more)

### Community 16 - "shared.ts"
Cohesion: 0.06
Nodes (39): PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, ProjectReadiness, SchedulerState, loadOfficeConfig() (+31 more)

### Community 17 - "work-summary.ts"
Cohesion: 0.08
Nodes (40): themeColor, App(), usePanelFocus(), demoSnapshot(), displayAgentTask(), githubStageLabels, withoutElapsed(), LiveAgentTask() (+32 more)

### Community 18 - "PeoplePanel.tsx"
Cohesion: 0.10
Nodes (38): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+30 more)

### Community 19 - "conversations/conversations.ts"
Cohesion: 0.11
Nodes (26): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+18 more)

### Community 20 - "github-delivery.ts"
Cohesion: 0.09
Nodes (30): findingsBlock(), HANDS_OFF_PROJECTS, handsOff(), legacyRecovery(), BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction() (+22 more)

### Community 21 - "workKey"
Cohesion: 0.11
Nodes (35): savedActivationFailure(), continuationScope(), brainImplementationCandidate(), BrainReadback, digest(), implementationRecoveryCandidate(), Ownership, Readback (+27 more)

### Community 22 - "publish-pr.ts"
Cohesion: 0.10
Nodes (31): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+23 more)

### Community 23 - "record-trigger.ts"
Cohesion: 0.11
Nodes (37): baselineLearning(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences(), clip(), maintenanceBlockedId(), MaintenanceCandidate (+29 more)

### Community 24 - "it-specialist.ts"
Cohesion: 0.10
Nodes (26): itChatPrompt(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), ITContext, diagnosticContext(), diagnosticSnapshot() (+18 more)

### Community 25 - "maintenance.ts"
Cohesion: 0.10
Nodes (26): maintenancePolicies(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice(), candidateOwner(), SETTLED (+18 more)

### Community 26 - "scheduler.ts"
Cohesion: 0.10
Nodes (26): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+18 more)

### Community 27 - "daily-cto.ts"
Cohesion: 0.11
Nodes (18): DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), dailyReviewDate(), reviewWeekday(), queueGoalEvidenceRequest(), DailyResultSchema (+10 more)

### Community 28 - "run-retrospective.ts"
Cohesion: 0.10
Nodes (31): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, appendLearningFacts(), freezeLearningPacket(), ARTIFACT_LIMIT, clip(), LEDGER_STEPS (+23 more)

### Community 29 - "outbox.ts"
Cohesion: 0.14
Nodes (25): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), projectOutbox(), syncOutbox(), projectSlackDeliveries(), Input (+17 more)

### Community 30 - "github/issue-publication.ts"
Cohesion: 0.15
Nodes (15): GitHubFeaturePublisher, FeaturePublisher, PublicationReceipt, publishFeature(), reserveIdentity(), Assign, Board, Content (+7 more)

### Community 31 - "goal-reporting.ts"
Cohesion: 0.11
Nodes (28): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+20 more)

### Community 32 - "activation-recovery.ts"
Cohesion: 0.17
Nodes (32): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+24 more)

### Community 33 - "TicketJob"
Cohesion: 0.17
Nodes (15): StageContext, GitHubDelivery, lintPRContent(), ciCheckout(), verifyCIHooks(), CIFailure, guardCIRepair(), prepareCIMetadataRepair() (+7 more)

### Community 34 - "session-bridge.ts"
Cohesion: 0.13
Nodes (23): claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexSessionContext(), readRollout, claudeSessions(), codexSessions() (+15 more)

### Community 35 - "scope-repair-resume.ts"
Cohesion: 0.17
Nodes (30): containedFile(), Assessment, outsideScanSources(), Ownership, reconcileScopeRepairReadback(), requireThat(), scopeRepairReadbackCandidate(), scopeRepairRequestResolved() (+22 more)

### Community 36 - "github-readiness.ts"
Cohesion: 0.14
Nodes (25): harnessDelivers(), observe(), stagePrompt(), StagePromptInput, resumeReviewedMerge(), finishLeadReview(), merge(), verifyPR() (+17 more)

### Community 37 - "telemetry.ts"
Cohesion: 0.09
Nodes (27): CodexRollout, CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL (+19 more)

### Community 38 - "TimeBook.tsx"
Cohesion: 0.14
Nodes (26): TelemetryReport, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens(), usd(), KpiTiles() (+18 more)

### Community 39 - "cost-ledger.ts"
Cohesion: 0.17
Nodes (25): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId(), OutsideEdit (+17 more)

### Community 40 - "run-accounting.ts"
Cohesion: 0.12
Nodes (25): BoundedRead, backfillClaudeCost(), CompletionReader, readCodexRollout(), HELPER_STDOUT_MAX_BYTES, helperAccounting(), claudeAccounting(), codexAccounting() (+17 more)

### Community 41 - "OfficeSnapshot"
Cohesion: 0.13
Nodes (20): FeatureRound, FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures(), draftKey() (+12 more)

### Community 42 - "offices.ts"
Cohesion: 0.11
Nodes (13): queueImprovements(), DELIVERY_CONCURRENCY, LOCAL_BINDINGS, file, project, root, contextPacket(), DeliverySlot (+5 more)

### Community 43 - "time-scope.ts"
Cohesion: 0.18
Nodes (24): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), midnight(), TicketDay (+16 more)

### Community 44 - ".transaction"
Cohesion: 0.16
Nodes (14): featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), recoverFeatures(), EvidenceSchema, helperInstallation(), readReview(), ReviewEvidence (+6 more)

### Community 45 - "StageResult"
Cohesion: 0.19
Nodes (18): harnessCloseout(), PASSING, verifyMergeActions(), HarnessControl, withHarnessWork(), runHarnessStage(), harnessStageResult(), receipt() (+10 more)

### Community 46 - "executeRequest"
Cohesion: 0.11
Nodes (15): Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership, rawHash() (+7 more)

### Community 47 - "hasUncertainEffects"
Cohesion: 0.16
Nodes (13): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), ProjectProgress, resumeParked() (+5 more)

### Community 48 - "features.ts"
Cohesion: 0.15
Nodes (19): featureEffectGate(), assertFeatureGate(), bindFeature(), currentApproval(), enrolled(), featureGate(), predecessorComplete(), scheduledFeatures() (+11 more)

### Community 49 - "engine.ts"
Cohesion: 0.16
Nodes (17): checkMail(), drainMail(), requestMail(), dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), resume() (+9 more)

### Community 50 - "github-check-selection.ts"
Cohesion: 0.21
Nodes (18): checksFailed(), checksPassed(), checksPending(), CurrentChecksWait, currentMergeChecks(), pass(), pending(), requireThat() (+10 more)

### Community 51 - "weekly-research.ts"
Cohesion: 0.17
Nodes (17): captureLearning(), learningDigest(), recordLearningOpportunity(), captureMaintenanceStep(), publicTopicSafe(), researchTopics(), TEMPLATES, harperFolder() (+9 more)

### Community 52 - "knowledge.ts"
Cohesion: 0.12
Nodes (21): SEEDS, BlockerFollowup, ImprovementGrant, KnowledgeRetry, KnowledgeState, LearningMetrics, Lesson, LessonExposure (+13 more)

### Community 54 - "JiraIssuePublisher"
Cohesion: 0.25
Nodes (5): Assignment, JiraIssuePublisher, keyOf(), plainDescription(), Transition

### Community 55 - "goal-reviews.ts"
Cohesion: 0.13
Nodes (18): applyGoalReview(), EvidenceRefSchema, FreshDailyResultSchema, statusAllowed(), workEvidence(), GoalInput, saveGoal(), queueGoalNotice() (+10 more)

### Community 56 - ".emit"
Cohesion: 0.18
Nodes (16): deliverySlot(), closeoutRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), deterministicActions, eligible(), requestResolved(), scheduledWork() (+8 more)

### Community 57 - "dependencies.ts"
Cohesion: 0.24
Nodes (18): Admission, admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, compatible(), dependencyCompletionKey(), dependencyEligibility() (+10 more)

### Community 58 - "Conversation.tsx"
Cohesion: 0.17
Nodes (16): Conversation(), recommendedReply(), slackMessageStatus(), SlackDeliveryCard(), slackMessageUrl(), ArrowRight, Check, ExternalLink (+8 more)

### Community 59 - "run.ts"
Cohesion: 0.20
Nodes (15): OFFICE_FIX_PROMPT, OfficeFixResult, validateOfficeFix(), investigationReady(), INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, InvestigationOptions, InvestigationReport (+7 more)

### Community 60 - "admit-improvement.ts"
Cohesion: 0.25
Nodes (15): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+7 more)

### Community 61 - "retrospective-subject.ts"
Cohesion: 0.19
Nodes (15): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+7 more)

### Community 62 - "lesson-selection.ts"
Cohesion: 0.19
Nodes (16): knowledgeContext(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), LessonSelection, MAINTENANCE (+8 more)

### Community 63 - "MaintenanceRun"
Cohesion: 0.18
Nodes (12): BrainFollowup, Result, checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), repeatedVendorReviewBlock(), stoppedInVendorReview(), maintenanceSuperseded() (+4 more)

### Community 64 - "jira-time.ts"
Cohesion: 0.22
Nodes (12): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+4 more)

### Community 65 - "weekly-rollup.ts"
Cohesion: 0.22
Nodes (14): learningMetrics(), lessonsNeedingReview(), RollupResult, RollupResultSchema, lastFriday(), ROLLUP_HISTORY, rollupDue(), RollupHooks (+6 more)

### Community 66 - "contract.ts"
Cohesion: 0.22
Nodes (11): At, Errno, GroupInventory, GroupProbe, LifecycleDiagnostic, Phase, Pid, lifecycleFacts() (+3 more)

### Community 67 - "coordination-tick.ts"
Cohesion: 0.24
Nodes (11): reconcileNoticeConfirmations(), legacy, reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION, tick(), incompleteReadOutput() (+3 more)

### Community 68 - "WorkTime"
Cohesion: 0.18
Nodes (13): awaitingEvidence(), CaptureContext, inCostWindow(), TicketCost, ticketCosts(), ConfirmedSegment, LiveAnchor, ObservationGap (+5 more)

### Community 69 - "coordination.ts"
Cohesion: 0.24
Nodes (12): checkpointWindow(), dueAt(), hours, localDay(), ReviewResult, deferNonReady(), preparePR(), recheck() (+4 more)

### Community 70 - "report.ts"
Cohesion: 0.29
Nodes (12): Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked(), row() (+4 more)

### Community 71 - "github-context.ts"
Cohesion: 0.29
Nodes (8): deliveryTask(), DeliveryTaskInput, DISCOVERY_GUIDANCE, compactSteps(), AMENDMENT_REVIEW_PROOF, featureDeliveryContext(), deliveryHumanInputs(), deliveryResearchContext()

### Community 72 - "office-lessons.ts"
Cohesion: 0.33
Nodes (9): normalizeStatement(), decideOfficeProposal(), now(), OfficeKnowledgeStore, proposeOfficeLessons(), retireOfficeLesson(), Input, promoteNoteLesson() (+1 more)

### Community 73 - "work.ts"
Cohesion: 0.17
Nodes (11): AssignmentResult, CompletionCondition, Continuation, DependencyObservation, EligibilityState, FailureCategory, ReconciliationAction, WorkAssignment (+3 more)

### Community 74 - "DailyCTO.tsx"
Cohesion: 0.26
Nodes (8): CTOReview(), goalState, DailyCTO(), GoalHistory(), reportDate(), reviewStatus, reviewExcerpt(), ReviewText()

### Community 75 - "create-candidate.ts"
Cohesion: 0.31
Nodes (9): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+1 more)

### Community 76 - "evidence.ts"
Cohesion: 0.40
Nodes (8): investigationEvidence(), OFFICE_SOURCE_PATHS, officeSource(), done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf()

### Community 77 - "retire-external-delivery.ts"
Cohesion: 0.44
Nodes (6): completedPRReviews(), eligible(), mergedByOwner(), ownerSettles(), retireExternalDeliveries(), settledExternalRepair()

### Community 78 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 79 - "cli.ts"
Cohesion: 0.25
Nodes (6): args, [cmd,...rawArgs], commands, key, projectIndex, PORT

### Community 80 - "checkpoint-retry.ts"
Cohesion: 0.46
Nodes (6): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation()

### Community 81 - "checkpoint-completion.ts"
Cohesion: 0.32
Nodes (5): brainCheckpointCompletion(), coverageSchema, followupSchema, verified, reconcileCompletedCheckpoints()

### Community 82 - "codex-rollout-file.ts"
Cohesion: 0.36
Nodes (7): codexHome(), createdAt(), dayDirs(), header(), ROLLOUT_MAX_BYTES, RolloutScan, scanCodexRollouts()

### Community 83 - "scheduled-retrospectives.ts"
Cohesion: 0.48
Nodes (6): busyMaintenanceIds(), triggerJobId(), KnowledgeRunner, busySubjects(), scheduledRetrospectives(), status()

### Community 85 - "install-service.mjs"
Cohesion: 0.33
Nodes (5): file, folder, logs, root, xml()

### Community 86 - "liveReach"
Cohesion: 0.60
Nodes (5): GIT_NETWORK, LIVE_PROVIDERS, liveReach(), networkUrl(), remoteUrls()

### Community 87 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

## Knowledge Gaps
- **347 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+342 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `.save`, `store.ts`, `dependency-bots/adopt.ts`, `source-amendment.ts`, `http/commands.ts`, `digest`, `requests.ts`, `features/workflow.ts`, `cec/workflow.ts`, `accept-stage-result.ts`, `worker-runtime.ts`, `conversations/conversations.ts`, `github-delivery.ts`, `workKey`, `publish-pr.ts`, `record-trigger.ts`, `it-specialist.ts`, `maintenance.ts`, `scheduler.ts`, `run-retrospective.ts`, `outbox.ts`, `github/issue-publication.ts`, `goal-reporting.ts`, `activation-recovery.ts`, `TicketJob`, `session-bridge.ts`, `scope-repair-resume.ts`, `github-readiness.ts`, `cost-ledger.ts`, `run-accounting.ts`, `OfficeSnapshot`, `offices.ts`, `time-scope.ts`, `.transaction`, `executeRequest`, `hasUncertainEffects`, `features.ts`, `engine.ts`, `weekly-research.ts`, `JiraIssuePublisher`, `goal-reviews.ts`, `.emit`, `dependencies.ts`, `run.ts`, `admit-improvement.ts`, `retrospective-subject.ts`, `lesson-selection.ts`, `MaintenanceRun`, `jira-time.ts`, `weekly-rollup.ts`, `coordination-tick.ts`, `coordination.ts`, `github-context.ts`, `office-lessons.ts`, `create-candidate.ts`, `evidence.ts`, `retire-external-delivery.ts`, `checkpoint-retry.ts`, `checkpoint-completion.ts`, `scheduled-retrospectives.ts`?**
  _High betweenness centrality (0.116) - this node is a cross-community bridge._
- **Why does `Role` connect `worker-runtime.ts` to `store.ts`, `http/commands.ts`, `Inspector.tsx`, `OfficeScene.tsx`, `cec/workflow.ts`, `App.tsx`, `accept-stage-result.ts`, `shared.ts`, `PeoplePanel.tsx`, `conversations/conversations.ts`, `github-delivery.ts`, `maintenance.ts`, `scheduler.ts`, `outbox.ts`, `TicketJob`, `github-readiness.ts`, `run-accounting.ts`, `OfficeSnapshot`, `offices.ts`, `StageResult`, `hasUncertainEffects`, `.emit`, `Conversation.tsx`, `retrospective-subject.ts`, `github-context.ts`, `work.ts`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `TicketJob` connect `TicketJob` to `dependency-bots/adopt.ts`, `source-amendment.ts`, `Inspector.tsx`, `digest`, `requests.ts`, `cec/workflow.ts`, `accept-stage-result.ts`, `shared.ts`, `work-summary.ts`, `github-delivery.ts`, `workKey`, `publish-pr.ts`, `record-trigger.ts`, `it-specialist.ts`, `scheduler.ts`, `activation-recovery.ts`, `scope-repair-resume.ts`, `github-readiness.ts`, `StageResult`, `executeRequest`, `hasUncertainEffects`, `features.ts`, `github-check-selection.ts`, `dependencies.ts`, `retrospective-subject.ts`, `MaintenanceRun`, `github-context.ts`, `create-candidate.ts`, `retire-external-delivery.ts`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `command()` (e.g. with `.constructor()` and `executeRequest()`) actually correct?**
  _`command()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _347 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `.save` be split into smaller, more focused modules?**
  _Cohesion score 0.051018465638682654 - nodes in this community are weakly interconnected._
- **Should `store.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05799373040752351 - nodes in this community are weakly interconnected._