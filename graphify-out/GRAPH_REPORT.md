# Graph Report - the-office  (2026-11-09)

## Corpus Check
- 533 files · ~252,732 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2998 nodes · 12784 edges · 99 communities (95 shown, 4 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 70 edges (avg confidence: 0.74)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a5b479a8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- schedule.ts
- artifact
- Inspector.tsx
- github-delivery.ts
- requests.ts
- workKey
- source-amendment.ts
- time-scope.ts
- OfficeScene.tsx
- .emit
- scheduled-work.ts
- index.ts
- shared.ts
- TicketJob
- Store
- PeoplePanel.tsx
- TimeBook.tsx
- github-context.ts
- App.tsx
- worker-runtime.ts
- run-retrospective.ts
- azure.ts
- OfficeSnapshot
- record-trigger.ts
- notifications.ts
- features.ts
- mutedCopy
- github/issue-publication.ts
- assertMayMutate
- telemetry.ts
- dependency-bots/adopt.ts
- process.ts
- session-bridge.ts
- http/commands.ts
- tracking-issue.ts
- Role
- Ticket
- it-specialist.ts
- maintenance.ts
- .save
- .getEffect
- Engine
- knowledge.ts
- publish-pr.ts
- approval.ts
- .transaction
- admit-improvement.ts
- Coordinator
- JiraIssuePublisher
- agents.ts
- FeatureWorkspace.tsx
- dependencies.ts
- scope-repair-resume.ts
- lesson-selection.ts
- validate-stage.ts
- ControlStore
- goal-reviews.ts
- coordination.ts
- outbox.ts
- run-accounting.ts
- engine.ts
- delivery-binding.ts
- investigations/run.ts
- retrospective-subject.ts
- office/config.ts
- brain-maintenance.ts
- offices.ts
- service-health.ts
- fact-bounds.ts
- contract.ts
- delivery-repairs.ts
- coordination-tick.ts
- cec/workflow.ts
- weekly-research.ts
- preferences-store.ts
- prompts/conversations.ts
- closeout-supervision-proof.ts
- evidence.ts
- .value
- discovery-recovery.ts
- merge-scanner-retry.ts
- checkpoint-completion.ts
- work.ts
- approach.ts
- codex-rollout-file.ts
- command-registry.ts
- requeue-waited-implement.ts
- daily-cto.ts
- codex-rollout.ts
- brain-followup.ts
- CTOReview.tsx
- run-evidence.ts
- SlackIntakeStatus.tsx
- highestStableAtLeast
- dependency-edges.ts
- slack-supersession.ts
- save-review-briefing.ts
- helper-evidence.py

## God Nodes (most connected - your core abstractions)
1. `Store` - 280 edges
2. `TicketJob` - 125 edges
3. `GitHubDelivery` - 119 edges
4. `command()` - 100 edges
5. `artifact()` - 87 edges
6. `digest()` - 84 edges
7. `cx()` - 77 edges
8. `workKey()` - 75 edges
9. `OfficeSnapshot` - 66 edges
10. `StageResult` - 64 edges

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
- 3-file cycle: `server/knowledge/slack-intake/progress.ts -> server/knowledge/slack-intake/read-links.ts -> server/knowledge/slack-intake/seed-status.ts -> server/knowledge/slack-intake/progress.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/stage-reconciliation.ts -> server/delivery/recovery/implementation/continuation-review-readback.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/recovery/retire-external-delivery.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-guard.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/queue-repairs.ts -> server/delivery/repairs/reconcile-ci-diagnosis.ts -> server/delivery/pipeline/github-delivery.ts`
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

## Communities (99 total, 4 thin omitted)

### Community 0 - "schedule.ts"
Cohesion: 0.05
Nodes (108): learningMetrics(), lessonsNeedingReview(), RollupResult, RollupResultSchema, harperFolder(), KnowledgeRunner, RETROSPECTIVE_TIMEOUT, captureProposal() (+100 more)

### Community 1 - "artifact"
Cohesion: 0.08
Nodes (90): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+82 more)

### Community 2 - "Inspector.tsx"
Cohesion: 0.06
Nodes (78): Conversation(), Outbox(), SendMessage, slackMessageStatus(), SlackDeliveryCard(), labels, ServiceHealthRow(), BlockerFollowups() (+70 more)

### Community 3 - "github-delivery.ts"
Cohesion: 0.07
Nodes (67): containedFile(), findingsBlock(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery(), BOARD_RULE, conflictRefreshInstruction() (+59 more)

### Community 4 - "requests.ts"
Cohesion: 0.08
Nodes (60): continuationNativeReview(), savedCandidateAdmission, assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), reconcileCompletedConflictDraft() (+52 more)

### Community 5 - "workKey"
Cohesion: 0.07
Nodes (57): PrerequisitesSchema, completedPRReviews(), continuationScope(), brainImplementationCandidate(), BrainReadback, digest(), implementationRecoveryCandidate(), Ownership (+49 more)

### Community 6 - "source-amendment.ts"
Cohesion: 0.07
Nodes (67): adoptCandidate(), reported, Scope, approvedText(), assert(), AMENDMENT_REVIEW_PROOF, amendmentInstruction(), amendmentIssueSha256() (+59 more)

### Community 7 - "time-scope.ts"
Cohesion: 0.07
Nodes (58): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence(), CaptureContext (+50 more)

### Community 8 - "OfficeScene.tsx"
Cohesion: 0.06
Nodes (58): itAgent(), itDiagnostics(), ServiceHealthPanel(), displayAgentTask(), withoutElapsed(), LiveAgentTask(), Props, RunningTask() (+50 more)

### Community 9 - ".emit"
Cohesion: 0.09
Nodes (35): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+27 more)

### Community 10 - "scheduled-work.ts"
Cohesion: 0.10
Nodes (43): deliverySlot(), closeoutRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), deterministicActions, eligible(), requestResolved(), scheduledWork() (+35 more)

### Community 11 - "index.ts"
Cohesion: 0.08
Nodes (38): args, [cmd,...rawArgs], commands, key, projectIndex, close(), config, itSpecialist (+30 more)

### Community 12 - "shared.ts"
Cohesion: 0.07
Nodes (38): maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), repeatedVendorReviewBlock(), stoppedInVendorReview(), maintenanceSuperseded(), REOBSERVED, ProjectReadiness, DailyCTOSummary (+30 more)

### Community 13 - "TicketJob"
Cohesion: 0.10
Nodes (21): removeAdoptedClone(), dependabotReviewGuidance(), StageContext, GitHubDelivery, implementationContinuationInstruction(), adoptedReviewCandidate(), ciCheckout(), finishCISetup() (+13 more)

### Community 14 - "Store"
Cohesion: 0.09
Nodes (20): DeliveryTaskInput, Clock, Scheduler, applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, EffectOperation (+12 more)

### Community 15 - "PeoplePanel.tsx"
Cohesion: 0.10
Nodes (39): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+31 more)

### Community 16 - "TimeBook.tsx"
Cohesion: 0.10
Nodes (37): TelemetryReport, AzureBuild, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens(), usd() (+29 more)

### Community 17 - "github-context.ts"
Cohesion: 0.11
Nodes (33): reviewInstructions(), deliveryTask(), observe(), DISCOVERY_GUIDANCE, checksFailed(), checksPassed(), checksPending(), currentMergeChecks() (+25 more)

### Community 18 - "App.tsx"
Cohesion: 0.06
Nodes (38): themeColor, CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants, ElevatorPhase, floorVariants, leftDoor (+30 more)

### Community 19 - "worker-runtime.ts"
Cohesion: 0.10
Nodes (33): SlackResultSchema, IntakeConfig, CODEX_DEFAULT_EFFORT, CODEX_DEFAULT_MODEL, CODEX_EFFORTS, CODEX_ROLES, ModelRoute, qaPolicyRoute() (+25 more)

### Community 20 - "run-retrospective.ts"
Cohesion: 0.10
Nodes (34): acceptRetrospective(), improvementIntakeGate(), learningDigest(), recordLearningOpportunity(), appendLearningFacts(), expireLearningPackets(), packetReferences(), freezeLearningPacket() (+26 more)

### Community 21 - "azure.ts"
Cohesion: 0.09
Nodes (31): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+23 more)

### Community 22 - "OfficeSnapshot"
Cohesion: 0.11
Nodes (32): compactSteps(), App(), SnapshotAcceptance, demoSnapshot(), tourStages, OfficeSnapshot, STAGE_ROLE, deliveryRepairProjection() (+24 more)

### Community 23 - "record-trigger.ts"
Cohesion: 0.10
Nodes (37): LEARNING_BASELINES, maintainLearning(), clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates(), maintenanceCompletedId(), maintenanceKey() (+29 more)

### Community 24 - "notifications.ts"
Cohesion: 0.12
Nodes (24): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR (+16 more)

### Community 25 - "features.ts"
Cohesion: 0.12
Nodes (29): discoveryPrompt(), planPrompt(), document(), featureRoot(), DiscoverySchema, identity, manifestFromPlan(), ManifestSchema (+21 more)

### Community 26 - "mutedCopy"
Cohesion: 0.15
Nodes (26): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView() (+18 more)

### Community 27 - "github/issue-publication.ts"
Cohesion: 0.15
Nodes (14): FeaturePublisher, PublicationReceipt, publishFeature(), reserveIdentity(), Assign, Board, Content, GitHubIssuePublisher (+6 more)

### Community 28 - "assertMayMutate"
Cohesion: 0.15
Nodes (24): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+16 more)

### Community 29 - "telemetry.ts"
Cohesion: 0.09
Nodes (30): CodexRollout, CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL (+22 more)

### Community 30 - "dependency-bots/adopt.ts"
Cohesion: 0.13
Nodes (28): readBackOrThrow(), adoptDependabot(), closesIssue(), linkedBody(), linkPR(), dependabotPR, openDependabotPulls(), readRepo() (+20 more)

### Community 31 - "process.ts"
Cohesion: 0.11
Nodes (20): Content, jiraText(), JiraOperations, plain(), unpack(), candidateIdentity(), candidateSlug(), createCandidate() (+12 more)

### Community 32 - "session-bridge.ts"
Cohesion: 0.12
Nodes (23): claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexSessionContext(), readRollout, claudeSessions(), codexSessions() (+15 more)

### Community 33 - "http/commands.ts"
Cohesion: 0.14
Nodes (26): configureNotices(), NoticeSettings, retryRecipientLookup(), normalizeStatement(), baselineLearning(), configureKnowledge(), declineLessonIssue(), demoteLesson() (+18 more)

### Community 34 - "tracking-issue.ts"
Cohesion: 0.18
Nodes (27): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard, projectCards() (+19 more)

### Community 35 - "Role"
Cohesion: 0.11
Nodes (20): ROLES, stageRole(), systemClock, DATA, LOCAL_BINDINGS, DeliverySlot, officeCapacity, fifo() (+12 more)

### Community 36 - "Ticket"
Cohesion: 0.13
Nodes (13): cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), slackSendPrompt(), slackVerifyPrompt(), PICKUP_CHAT, PickupSchema (+5 more)

### Community 37 - "it-specialist.ts"
Cohesion: 0.18
Nodes (18): savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), ITContext, investigationCandidates(), investigationId(), investigationFollowUps() (+10 more)

### Community 38 - "maintenance.ts"
Cohesion: 0.14
Nodes (18): captureMaintenanceStep(), candidateOwner(), SETTLED, skipOwnedCandidate(), Skipped, skippedCandidateLedger(), CmsFollowUpContext, cmsFollowUpInstructions() (+10 more)

### Community 39 - ".save"
Cohesion: 0.23
Nodes (24): BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue(), readIssues(), commentDecision() (+16 more)

### Community 40 - ".getEffect"
Cohesion: 0.17
Nodes (11): GitHubOperations, fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), goalNoticeNeverDispatched(), Assessment, closeNativeRefresh(), fingerprint() (+3 more)

### Community 41 - "Engine"
Cohesion: 0.08
Nodes (5): correlatedBuild(), Engine, observe(), observeParked(), parkedReadError

### Community 42 - "knowledge.ts"
Cohesion: 0.11
Nodes (24): Kind, Stage, BlockerFollowup, ImprovementGrant, KnowledgeRetry, LearningMetrics, LearningOpportunity, Lesson (+16 more)

### Community 43 - "publish-pr.ts"
Cohesion: 0.16
Nodes (19): Execute, installDependencies(), major(), retryRead(), developerPRContent(), Execute, lintPRContent(), officePRContent() (+11 more)

### Community 44 - "approval.ts"
Cohesion: 0.23
Nodes (16): approveFeature(), assertRetainedItems(), commandFeature(), createFeature(), featureById(), mutation(), reviewQuestions(), artifactPath() (+8 more)

### Community 45 - ".transaction"
Cohesion: 0.18
Nodes (15): featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), recoverFeatures(), EvidenceSchema, helperInstallation(), readReview(), ReviewEvidence (+7 more)

### Community 46 - "admit-improvement.ts"
Cohesion: 0.17
Nodes (19): Accepted, RETROSPECTIVE_HISTORY, admitImprovement(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest() (+11 more)

### Community 48 - "JiraIssuePublisher"
Cohesion: 0.25
Nodes (5): Assignment, JiraIssuePublisher, keyOf(), plainDescription(), Transition

### Community 49 - "agents.ts"
Cohesion: 0.12
Nodes (18): cecPrompt(), resolvedDecisionNote(), stageInstructions, SlackVerificationSchema, HANDS_OFF_RESOLUTION_GUIDANCE, RESOLUTION_GUIDANCE, REPAIR_DIAGNOSIS, knowledgeChatPrompt() (+10 more)

### Community 50 - "FeatureWorkspace.tsx"
Cohesion: 0.17
Nodes (16): FeatureRound, FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures(), draftKey() (+8 more)

### Community 51 - "dependencies.ts"
Cohesion: 0.22
Nodes (17): Admission, admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, compatible(), dependencyCompletionKey(), dependencyEligibility() (+9 more)

### Community 52 - "scope-repair-resume.ts"
Cohesion: 0.21
Nodes (20): assertScopeRepairResumeFindings(), certain(), directionContract(), directionPaths, effects(), originalClaim(), Ownership, requireThat() (+12 more)

### Community 53 - "lesson-selection.ts"
Cohesion: 0.16
Nodes (18): knowledgeContext(), assignmentSubject(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), LessonSelection (+10 more)

### Community 54 - "validate-stage.ts"
Cohesion: 0.21
Nodes (14): HarnessControl, withHarnessWork(), runHarnessStage(), harnessStageResult(), receipt(), Check, harnessChecks(), harnessValidate() (+6 more)

### Community 55 - "ControlStore"
Cohesion: 0.23
Nodes (3): DailyCTO, ControlStore, DailyCTOReport

### Community 56 - "goal-reviews.ts"
Cohesion: 0.14
Nodes (16): applyGoalReview(), EvidenceRefSchema, FreshDailyResultSchema, statusAllowed(), workEvidence(), GoalInput, saveGoal(), queueGoalNotice() (+8 more)

### Community 57 - "coordination.ts"
Cohesion: 0.18
Nodes (18): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation(), checkpointWindow(), dueAt() (+10 more)

### Community 58 - "outbox.ts"
Cohesion: 0.24
Nodes (14): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), projectOutbox(), syncOutbox(), slackRequestSettled(), readBackConversations() (+6 more)

### Community 59 - "run-accounting.ts"
Cohesion: 0.17
Nodes (18): BoundedRead, backfillClaudeCost(), CompletionReader, readCodexRollout(), codexAccounting(), COMPLETION_MAX_BYTES, completionAccounting(), merge() (+10 more)

### Community 60 - "engine.ts"
Cohesion: 0.23
Nodes (15): checkMail(), drainMail(), requestMail(), dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), resume() (+7 more)

### Community 61 - "delivery-binding.ts"
Cohesion: 0.25
Nodes (14): approvedDelivery(), bindDelivery(), featureDeliveryContext(), featureEffectGate(), assertFeatureGate(), bindFeature(), currentApproval(), enrolled() (+6 more)

### Community 62 - "investigations/run.ts"
Cohesion: 0.22
Nodes (14): OFFICE_FIX_PROMPT, OfficeFixResult, validateOfficeFix(), investigationReady(), INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, InvestigationOptions, InvestigationReport (+6 more)

### Community 63 - "retrospective-subject.ts"
Cohesion: 0.19
Nodes (15): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+7 more)

### Community 64 - "office/config.ts"
Cohesion: 0.23
Nodes (11): noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), resumeParked(), candidateInput(), children, oldAdoptionBasis(), HOLDS (+3 more)

### Community 65 - "brain-maintenance.ts"
Cohesion: 0.20
Nodes (11): maintenancePolicies(), reconcileNativeDelivery(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice(), easternDate() (+3 more)

### Community 66 - "offices.ts"
Cohesion: 0.20
Nodes (5): improvementEligible(), queueImprovements(), DELIVERY_CONCURRENCY, Offices, markCaptureStart()

### Community 67 - "service-health.ts"
Cohesion: 0.19
Nodes (8): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, ServiceHealth

### Community 68 - "fact-bounds.ts"
Cohesion: 0.26
Nodes (15): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+7 more)

### Community 69 - "contract.ts"
Cohesion: 0.22
Nodes (11): At, Errno, GroupInventory, GroupProbe, LifecycleDiagnostic, Phase, Pid, groupInventory() (+3 more)

### Community 70 - "delivery-repairs.ts"
Cohesion: 0.34
Nodes (13): run(), namedRepairIds(), approachFingerprint(), enqueueRepairDiagnosis(), githubRepairEligible(), jiraRepairable(), repairFindingIds(), reserveRepair() (+5 more)

### Community 71 - "coordination-tick.ts"
Cohesion: 0.20
Nodes (12): legacy, reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION, tick(), incompleteReadOutput(), IntakeResult (+4 more)

### Community 72 - "cec/workflow.ts"
Cohesion: 0.25
Nodes (12): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), advance(), nextStage(), publicationEvidenceGap(), qaEvidenceGap(), resultGate() (+4 more)

### Community 73 - "weekly-research.ts"
Cohesion: 0.26
Nodes (10): publicTopicSafe(), researchTopics(), TEMPLATES, mirror(), ResearchResult, runWeeklyResearch(), scheduledResearch(), OfficeKnowledge (+2 more)

### Community 74 - "preferences-store.ts"
Cohesion: 0.21
Nodes (9): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS (+1 more)

### Community 75 - "prompts/conversations.ts"
Cohesion: 0.27
Nodes (8): cecChatPrompt(), ctoChatPrompt(), itChatPrompt(), canFileGithubIssue(), githubFollowupPrompt(), diagnosticContext(), currentServices(), timeReport()

### Community 76 - "closeout-supervision-proof.ts"
Cohesion: 0.24
Nodes (12): CloseoutSupervisionProofRef, Envelope, hash, head, identity, instant(), known, pid (+4 more)

### Community 77 - "evidence.ts"
Cohesion: 0.33
Nodes (9): investigationEvidence(), OFFICE_SOURCE_PATHS, officeSource(), done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf() (+1 more)

### Community 78 - ".value"
Cohesion: 0.24
Nodes (6): file, folder, logs, root, xml(), ProjectProgress

### Community 79 - "discovery-recovery.ts"
Cohesion: 0.29
Nodes (10): Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership, rawHash() (+2 more)

### Community 80 - "merge-scanner-retry.ts"
Cohesion: 0.42
Nodes (9): activeEffectId(), officeMergeProvenance(), reconcileMergeScannerRetry(), Retry, retryMergeScanner(), retryReadBack(), runIdentity(), savedRetry() (+1 more)

### Community 81 - "checkpoint-completion.ts"
Cohesion: 0.25
Nodes (7): BrainStatusSchema, identity, brainCheckpointCompletion(), coverageSchema, followupSchema, verified, reconcileCompletedCheckpoints()

### Community 82 - "work.ts"
Cohesion: 0.18
Nodes (10): AssignmentResult, CompletionCondition, Continuation, DependencyObservation, EligibilityState, FailureCategory, ReconciliationAction, WorkAssignment (+2 more)

### Community 83 - "approach.ts"
Cohesion: 0.49
Nodes (9): afterDraft(), ApproachSchema, firstBuildStage(), missingApproachStage(), plannedNext(), recordApproach(), reroute(), stageNeeded() (+1 more)

### Community 84 - "codex-rollout-file.ts"
Cohesion: 0.29
Nodes (8): codexHome(), createdAt(), dayDirs(), header(), ROLLOUT_MAX_BYTES, RolloutScan, scanCodexRollouts(), HELPER_STDOUT_MAX_BYTES

### Community 85 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 86 - "requeue-waited-implement.ts"
Cohesion: 0.39
Nodes (6): parksInJira(), DECISION_KINDS, needsDecision(), APPROACH_GUARD_REJECTION, failedWorker(), requeueWaitedImplement()

### Community 87 - "daily-cto.ts"
Cohesion: 0.28
Nodes (7): EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), queueGoalEvidenceRequest(), DailyResultSchema, GoalEvidenceRequestSchema, OfficeEntry

### Community 88 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 90 - "CTOReview.tsx"
Cohesion: 0.38
Nodes (4): CTOReview(), goalState, reviewExcerpt(), ReviewText()

### Community 91 - "run-evidence.ts"
Cohesion: 0.47
Nodes (4): comparable(), EvidenceOutcome, recordRunEvidence(), RunAccounting

### Community 92 - "SlackIntakeStatus.tsx"
Cohesion: 0.60
Nodes (4): format, labels, SlackIntakeStatus(), time()

### Community 93 - "highestStableAtLeast"
Cohesion: 0.83
Nodes (3): compare(), highestStableAtLeast(), parts()

### Community 94 - "dependency-edges.ts"
Cohesion: 1.00
Nodes (3): assertFeatureDependencyOrder(), featureDependencyEdges(), key()

### Community 95 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

## Knowledge Gaps
- **357 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+352 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `schedule.ts`, `artifact`, `github-delivery.ts`, `requests.ts`, `workKey`, `source-amendment.ts`, `time-scope.ts`, `.emit`, `scheduled-work.ts`, `index.ts`, `shared.ts`, `TicketJob`, `github-context.ts`, `worker-runtime.ts`, `run-retrospective.ts`, `azure.ts`, `OfficeSnapshot`, `record-trigger.ts`, `notifications.ts`, `features.ts`, `github/issue-publication.ts`, `assertMayMutate`, `dependency-bots/adopt.ts`, `process.ts`, `session-bridge.ts`, `http/commands.ts`, `tracking-issue.ts`, `Role`, `Ticket`, `it-specialist.ts`, `maintenance.ts`, `.save`, `.getEffect`, `Engine`, `publish-pr.ts`, `approval.ts`, `.transaction`, `admit-improvement.ts`, `Coordinator`, `JiraIssuePublisher`, `agents.ts`, `dependencies.ts`, `scope-repair-resume.ts`, `lesson-selection.ts`, `goal-reviews.ts`, `coordination.ts`, `outbox.ts`, `run-accounting.ts`, `engine.ts`, `delivery-binding.ts`, `investigations/run.ts`, `retrospective-subject.ts`, `office/config.ts`, `brain-maintenance.ts`, `offices.ts`, `delivery-repairs.ts`, `coordination-tick.ts`, `weekly-research.ts`, `prompts/conversations.ts`, `closeout-supervision-proof.ts`, `evidence.ts`, `.value`, `discovery-recovery.ts`, `checkpoint-completion.ts`, `requeue-waited-implement.ts`, `daily-cto.ts`, `brain-followup.ts`, `run-evidence.ts`, `dependency-edges.ts`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **Why does `Role` connect `Role` to `Inspector.tsx`, `github-delivery.ts`, `OfficeScene.tsx`, `.emit`, `shared.ts`, `TicketJob`, `Store`, `PeoplePanel.tsx`, `github-context.ts`, `App.tsx`, `worker-runtime.ts`, `OfficeSnapshot`, `http/commands.ts`, `Ticket`, `maintenance.ts`, `agents.ts`, `validate-stage.ts`, `outbox.ts`, `run-accounting.ts`, `retrospective-subject.ts`, `prompts/conversations.ts`, `work.ts`, `approach.ts`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `GitHubDelivery` connect `TicketJob` to `office/config.ts`, `artifact`, `github-delivery.ts`, `requests.ts`, `workKey`, `source-amendment.ts`, `Engine`, `.emit`, `publish-pr.ts`, `discovery-recovery.ts`, `merge-scanner-retry.ts`, `github-context.ts`, `dependencies.ts`, `scope-repair-resume.ts`, `validate-stage.ts`, `assertMayMutate`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `command()` (e.g. with `.constructor()` and `executeRequest()`) actually correct?**
  _`command()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _357 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `schedule.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05283605283605284 - nodes in this community are weakly interconnected._
- **Should `artifact` be split into smaller, more focused modules?**
  _Cohesion score 0.08345780433159074 - nodes in this community are weakly interconnected._