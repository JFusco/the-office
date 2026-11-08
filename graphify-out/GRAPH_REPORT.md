# Graph Report - the-office  (2026-11-08)

## Corpus Check
- 476 files · ~225,549 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2744 nodes · 11456 edges · 94 communities (90 shown, 4 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 66 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `75c7403c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- remove-candidate.ts
- scheduler.ts
- engine.ts
- approval.ts
- source-amendment.ts
- TicketJob
- PeoplePanel.tsx
- App.tsx
- cost-ledger.ts
- Inspector.tsx
- github-delivery.ts
- OfficeScene.tsx
- publication.ts
- digest
- brain-maintenance.ts
- telemetry.ts
- jira-publication.ts
- index.ts
- report.ts
- LessonsPanel.tsx
- conversations/conversations.ts
- activation-recovery.ts
- azure.ts
- artifact
- outbox.ts
- work-summary.ts
- scheduled-work.ts
- TimeBook.tsx
- closeout.ts
- retrospective-subject.ts
- knowledge.ts
- .save
- workKey
- store.ts
- notifications.ts
- Coordinator
- sanitizeObject
- OfficeSnapshot
- cec/workflow.ts
- time-scope.ts
- supersedingDelivery
- .run
- assignment-poll.ts
- github-check-selection.ts
- Store
- requests.ts
- coordination.ts
- .getEffect
- process.ts
- features.ts
- retrospective-facts.ts
- run-retrospective.ts
- dependencies.ts
- dependency-bots/adopt.ts
- service-health.ts
- Role
- DailyCTO.tsx
- weekly-rollup.ts
- control-store.ts
- goal-reviews.ts
- Offices
- jira-time.ts
- command-registry.ts
- read-retries.ts
- delivery-binding.ts
- run.ts
- knowledge-context.ts
- recovery-ledger.ts
- session-bridge.ts
- run-ci-repair.ts
- http/commands.ts
- it-specialist.ts
- validate-stage.ts
- helper-evidence.py
- admission.ts
- fact-bounds.ts
- discovery-recovery.ts
- BrainFollowup
- evidence.ts
- checkpoint-completion.ts
- tracking-issue.ts
- closeout-supervision-proof.ts
- retrospective-triggers.ts
- github-publication.ts
- run-usage.ts
- preparation-readback.ts
- deferredPickup
- shared.ts
- publish-pr.ts
- offices.ts
- codex-rollout.ts
- slack-supersession.ts
- codex-rollout-file.ts

## God Nodes (most connected - your core abstractions)
1. `Store` - 248 edges
2. `TicketJob` - 117 edges
3. `GitHubDelivery` - 112 edges
4. `command()` - 90 edges
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

## Communities (94 total, 4 thin omitted)

### Community 0 - "remove-candidate.ts"
Cohesion: 0.20
Nodes (16): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+8 more)

### Community 1 - "scheduler.ts"
Cohesion: 0.17
Nodes (12): ROLES, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch(), foreignWork() (+4 more)

### Community 2 - "engine.ts"
Cohesion: 0.07
Nodes (19): JiraOperations, plain(), checkMail(), drainMail(), requestMail(), dispatchNightly(), drainDelivery(), enableNightly() (+11 more)

### Community 3 - "approval.ts"
Cohesion: 0.16
Nodes (23): approveFeature(), assertRetainedItems(), commandFeature(), createFeature(), featureById(), mutation(), reviewQuestions(), assertFeatureDependencyOrder() (+15 more)

### Community 4 - "source-amendment.ts"
Cohesion: 0.07
Nodes (62): approvedText(), assert(), amendmentIssueSha256(), authorizeSourceAmendment(), Binding, assert(), normalize(), officialUrls (+54 more)

### Community 5 - "TicketJob"
Cohesion: 0.10
Nodes (14): dependabotReviewGuidance(), StageContext, GitHubDelivery, stagePrompt(), StagePromptInput, implementationContinuationInstruction(), reconcileValidation(), conflictApprovalGuidance() (+6 more)

### Community 6 - "PeoplePanel.tsx"
Cohesion: 0.10
Nodes (38): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+30 more)

### Community 7 - "App.tsx"
Cohesion: 0.06
Nodes (44): SendMessage, blank(), goalInput, Goals(), CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants (+36 more)

### Community 8 - "cost-ledger.ts"
Cohesion: 0.16
Nodes (24): EffectUncertainError, captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId() (+16 more)

### Community 9 - "Inspector.tsx"
Cohesion: 0.08
Nodes (62): Conversation(), Outbox(), slackMessageStatus(), SlackDeliveryCard(), ServiceHealthPanel(), labels, ServiceHealthRow(), GoalList() (+54 more)

### Community 10 - "github-delivery.ts"
Cohesion: 0.08
Nodes (55): findingsBlock(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery(), BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE (+47 more)

### Community 11 - "OfficeScene.tsx"
Cohesion: 0.06
Nodes (57): displayAgentTask(), githubStageLabels, withoutElapsed(), LiveAgentTask(), Props, RunningTask(), text(), Avatar() (+49 more)

### Community 12 - "publication.ts"
Cohesion: 0.18
Nodes (11): Assign, Board, GitHubFeaturePublisher, number(), same(), FeaturePublisher, PublicationReceipt, label() (+3 more)

### Community 13 - "digest"
Cohesion: 0.09
Nodes (64): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+56 more)

### Community 14 - "brain-maintenance.ts"
Cohesion: 0.12
Nodes (20): maintenancePolicies(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice(), candidateOwner(), SETTLED (+12 more)

### Community 15 - "telemetry.ts"
Cohesion: 0.11
Nodes (22): CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL, Rates (+14 more)

### Community 16 - "jira-publication.ts"
Cohesion: 0.24
Nodes (8): unpack(), Assignment, Content, JiraFeaturePublisher, jiraText(), keyOf(), plainDescription(), Transition

### Community 17 - "index.ts"
Cohesion: 0.06
Nodes (46): args, [cmd,...rawArgs], commands, key, projectIndex, close(), config, itSpecialist (+38 more)

### Community 18 - "report.ts"
Cohesion: 0.27
Nodes (13): TimeLedgerState, Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked() (+5 more)

### Community 19 - "LessonsPanel.tsx"
Cohesion: 0.13
Nodes (30): LessonsPanel(), when(), SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), loadOfficeConfig(), OfficeConfigSection() (+22 more)

### Community 20 - "conversations/conversations.ts"
Cohesion: 0.10
Nodes (29): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+21 more)

### Community 21 - "activation-recovery.ts"
Cohesion: 0.16
Nodes (26): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+18 more)

### Community 22 - "azure.ts"
Cohesion: 0.10
Nodes (26): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+18 more)

### Community 23 - "artifact"
Cohesion: 0.14
Nodes (42): containedFile(), savedActivationFailure(), continuationWorkerProof(), negativeWorker(), originalPublication(), Assessment, outsideScanSources(), Ownership (+34 more)

### Community 24 - "outbox.ts"
Cohesion: 0.20
Nodes (15): conversationResolved(), projectOutbox(), syncOutbox(), slackRequestSettled(), knowledgeOutbox(), checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup() (+7 more)

### Community 25 - "work-summary.ts"
Cohesion: 0.15
Nodes (24): compactSteps(), themeColor, App(), deliveryRepairProjection(), card, InboxQueue(), ACTIVE, maintenanceUpdate() (+16 more)

### Community 26 - "scheduled-work.ts"
Cohesion: 0.15
Nodes (19): deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), deterministicActions, eligible() (+11 more)

### Community 27 - "TimeBook.tsx"
Cohesion: 0.09
Nodes (38): TelemetryReport, LiveAnchor, AzureBuild, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens() (+30 more)

### Community 28 - "closeout.ts"
Cohesion: 0.38
Nodes (9): harnessCloseout(), PASSING, verifyMergeActions(), runHarnessStage(), harnessStageResult(), receipt(), harnessDraft(), harnessPrepare() (+1 more)

### Community 29 - "retrospective-subject.ts"
Cohesion: 0.20
Nodes (14): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+6 more)

### Community 30 - "knowledge.ts"
Cohesion: 0.13
Nodes (20): Kind, RetrospectiveResult, Stage, SEEDS, KnowledgeRetry, KnowledgeState, Lesson, LESSON_KINDS (+12 more)

### Community 31 - ".save"
Cohesion: 0.11
Nodes (33): file, folder, logs, root, xml(), correlatedBuild(), BLOCKED, Execute (+25 more)

### Community 32 - "workKey"
Cohesion: 0.08
Nodes (41): completedPRReviews(), continuationScope(), brainImplementationCandidate(), BrainReadback, digest(), implementationRecoveryCandidate(), Ownership, Readback (+33 more)

### Community 33 - "store.ts"
Cohesion: 0.07
Nodes (55): cecPrompt(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), resolvedDecisionNote(), stageInstructions, cecChatPrompt() (+47 more)

### Community 34 - "notifications.ts"
Cohesion: 0.09
Nodes (28): channelNoticeAuthorized(), notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR, plainSlackText(), section() (+20 more)

### Community 35 - "Coordinator"
Cohesion: 0.08
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 36 - "sanitizeObject"
Cohesion: 0.15
Nodes (11): DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), dailyReviewDate(), reviewWeekday(), DailyResultSchema, easternDay() (+3 more)

### Community 37 - "OfficeSnapshot"
Cohesion: 0.08
Nodes (32): FeatureRound, FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures(), draftKey() (+24 more)

### Community 38 - "cec/workflow.ts"
Cohesion: 0.11
Nodes (37): parksInJira(), MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), run(), advance(), nextStage(), publicationEvidenceGap() (+29 more)

### Community 39 - "time-scope.ts"
Cohesion: 0.16
Nodes (27): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence(), CaptureContext (+19 more)

### Community 40 - "supersedingDelivery"
Cohesion: 0.29
Nodes (12): finishSupersededReadback(), projectSlackDeliveries(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint(), supersedingDelivery(), investigationCandidates() (+4 more)

### Community 41 - ".run"
Cohesion: 0.09
Nodes (19): AUTO_ADOPT_BOTS, goalEvidencePath(), localBindings, assertModelOverrides(), CODEX_DEFAULT_EFFORT, CODEX_DEFAULT_MODEL, CODEX_EFFORTS, CODEX_ROLES (+11 more)

### Community 42 - "assignment-poll.ts"
Cohesion: 0.26
Nodes (11): noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), pinCourier, due(), unparkReleasedWaits(), compare(), highestStableAtLeast() (+3 more)

### Community 43 - "github-check-selection.ts"
Cohesion: 0.19
Nodes (20): checksFailed(), checksPassed(), checksPending(), CurrentChecksWait, currentMergeChecks(), pass(), pending(), requireThat() (+12 more)

### Community 44 - "Store"
Cohesion: 0.11
Nodes (19): featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), recoverFeatures(), EvidenceSchema, helperInstallation(), readReview(), ReviewEvidence (+11 more)

### Community 45 - "requests.ts"
Cohesion: 0.12
Nodes (40): adoptCandidate(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat() (+32 more)

### Community 46 - "coordination.ts"
Cohesion: 0.17
Nodes (20): hasUncertainEffects(), reconcileCloseout(), completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation() (+12 more)

### Community 47 - ".getEffect"
Cohesion: 0.20
Nodes (9): publishFeature(), GitHubOperations, fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), Assessment, closeNativeRefresh(), fingerprint() (+1 more)

### Community 48 - "process.ts"
Cohesion: 0.14
Nodes (19): At, Errno, GroupInventory, GroupProbe, LifecycleDiagnostic, Phase, Pid, lifecycleFacts() (+11 more)

### Community 49 - "features.ts"
Cohesion: 0.14
Nodes (23): discoveryPrompt(), planPrompt(), document(), featureRoot(), DiscoverySchema, identity, PlanSchema, text (+15 more)

### Community 50 - "retrospective-facts.ts"
Cohesion: 0.22
Nodes (12): ARTIFACT_LIMIT, clip(), LEDGER_STEPS, MAINTENANCE_LIMIT, maintenanceFacts(), MaintenancePacketSection, clip(), PACKET_LIMIT (+4 more)

### Community 51 - "run-retrospective.ts"
Cohesion: 0.21
Nodes (14): busyMaintenanceIds(), retrospectivePrompt(), SUBJECT, RetrospectiveResultSchema, triggerJobId(), KnowledgeRunner, KnowledgeRunOptions, RetrospectiveRunner (+6 more)

### Community 52 - "dependencies.ts"
Cohesion: 0.19
Nodes (19): reconcileNoticeConfirmations(), admit(), resumeParked(), compatible(), dependencyCompletionKey(), dependencyEligibility(), DependencyStores, issueKey() (+11 more)

### Community 53 - "dependency-bots/adopt.ts"
Cohesion: 0.21
Nodes (20): adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR, openDependabotPulls(), readRepo() (+12 more)

### Community 54 - "service-health.ts"
Cohesion: 0.15
Nodes (11): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, slackHealth() (+3 more)

### Community 55 - "Role"
Cohesion: 0.11
Nodes (22): acceptConflictRepair(), APPROACH_GUIDANCE, ApproachSchema, nextJobStage(), reviewInstructions(), DeliveryTaskInput, DISCOVERY_GUIDANCE, AMENDMENT_REVIEW_PROOF (+14 more)

### Community 56 - "DailyCTO.tsx"
Cohesion: 0.26
Nodes (8): CTOReview(), goalState, DailyCTO(), GoalHistory(), reportDate(), reviewStatus, reviewExcerpt(), ReviewText()

### Community 57 - "weekly-rollup.ts"
Cohesion: 0.14
Nodes (23): RollupResult, RollupResultSchema, harperFolder(), RETROSPECTIVE_TIMEOUT, retryDelay(), ineffectiveLessons(), lastFriday(), ROLLUP_HISTORY (+15 more)

### Community 58 - "control-store.ts"
Cohesion: 0.11
Nodes (15): Briefing, saveReviewBriefing(), Clock, applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, statementCache() (+7 more)

### Community 59 - "goal-reviews.ts"
Cohesion: 0.14
Nodes (16): applyGoalReview(), EvidenceRefSchema, FreshDailyResultSchema, statusAllowed(), workEvidence(), GoalInput, saveGoal(), queueGoalNotice() (+8 more)

### Community 61 - "jira-time.ts"
Cohesion: 0.24
Nodes (12): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+4 more)

### Community 62 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 63 - "read-retries.ts"
Cohesion: 0.53
Nodes (5): PrerequisitesSchema, incompleteReadOutput(), IntakeResult, planReadRetry(), reconcileReadRetries()

### Community 64 - "delivery-binding.ts"
Cohesion: 0.25
Nodes (13): approvedDelivery(), assertFeatureApproach(), bindDelivery(), featureDeliveryContext(), featureEffectGate(), assertFeatureGate(), bindFeature(), currentApproval() (+5 more)

### Community 65 - "run.ts"
Cohesion: 0.22
Nodes (14): OFFICE_FIX_PROMPT, OfficeFixResult, validateOfficeFix(), investigationReady(), INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, InvestigationOptions, InvestigationReport (+6 more)

### Community 66 - "knowledge-context.ts"
Cohesion: 0.24
Nodes (10): Bucket, knowledgeContext(), LESSON_LIMIT, lessonPurpose(), MAINTENANCE, MAX_LESSONS, PURPOSES, render() (+2 more)

### Community 67 - "recovery-ledger.ts"
Cohesion: 0.20
Nodes (11): savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), diagnosticSnapshot(), nativeDeliveryResolved(), reconcileRecoveryLedger(), itAgent() (+3 more)

### Community 68 - "session-bridge.ts"
Cohesion: 0.12
Nodes (23): claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexSessionContext(), readRollout, claudeSessions(), codexSessions() (+15 more)

### Community 69 - "run-ci-repair.ts"
Cohesion: 0.31
Nodes (11): ciCheckout(), verifyCIHooks(), CIFailure, guardCIRepair(), prepareCIMetadataRepair(), publishCIRepair(), rewordCommits(), CIPlanSchema (+3 more)

### Community 70 - "http/commands.ts"
Cohesion: 0.11
Nodes (32): ChannelSettings, configureChannelNotices(), configureNotices(), NoticeSettings, retryRecipientLookup(), bindDiscoveryResume(), DiscoveryResumeInput, Accepted (+24 more)

### Community 71 - "it-specialist.ts"
Cohesion: 0.29
Nodes (10): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), ITContext, readBackConversations(), publishITReport(), delays, recoverAttempt() (+2 more)

### Community 72 - "validate-stage.ts"
Cohesion: 0.16
Nodes (17): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+9 more)

### Community 75 - "admission.ts"
Cohesion: 0.25
Nodes (9): Admission, admitReadyCards(), IntakeContext, WAIT_STATUSES, Continuation, Prerequisite, AssignmentReview, Coordination (+1 more)

### Community 76 - "fact-bounds.ts"
Cohesion: 0.26
Nodes (15): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+7 more)

### Community 77 - "discovery-recovery.ts"
Cohesion: 0.31
Nodes (8): Assessment, diagnosticProof(), discoveryRecoveryCandidate(), ownedArtifact(), Ownership, rawHash(), recoverDiscovery(), scopeNote()

### Community 79 - "evidence.ts"
Cohesion: 0.40
Nodes (8): investigationEvidence(), OFFICE_SOURCE_PATHS, officeSource(), done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf()

### Community 80 - "checkpoint-completion.ts"
Cohesion: 0.23
Nodes (8): BrainStatusSchema, identity, parseBrainStatus(), brainCheckpointCompletion(), coverageSchema, followupSchema, verified, reconcileCompletedCheckpoints()

### Community 81 - "tracking-issue.ts"
Cohesion: 0.22
Nodes (10): ensureTrackingIssue(), findTrackingIssue(), ownTracking(), TrackingIssue, trackingIssueBody(), trackingIssueTitle(), trackingMarker(), ACTIONS (+2 more)

### Community 82 - "closeout-supervision-proof.ts"
Cohesion: 0.26
Nodes (11): CloseoutSupervisionProofRef, Envelope, hash, head, identity, instant(), known, pid (+3 more)

### Community 83 - "retrospective-triggers.ts"
Cohesion: 0.13
Nodes (32): clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates(), maintenanceCompletedId(), maintenanceKey(), visibleMaintenanceTriggerIds(), clip() (+24 more)

### Community 84 - "github-publication.ts"
Cohesion: 0.24
Nodes (20): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard, projectCards() (+12 more)

### Community 85 - "run-usage.ts"
Cohesion: 0.32
Nodes (6): CodexRollout, claudeCrashZero(), claudeUsage(), codexUsage(), count(), RunUsage

### Community 86 - "preparation-readback.ts"
Cohesion: 0.12
Nodes (28): assertPostConflictOwnership(), bindPreparationBoardOrigins(), claimSchema, eventSchema, PreparationBoardOrigin, readPreparationBoardOrigins(), timestamp, updateSchema (+20 more)

### Community 88 - "shared.ts"
Cohesion: 0.08
Nodes (32): ProjectReadiness, ConfirmedSegment, ObservationGap, SnapshotOrdering, AssignmentResult, CompletionCondition, DependencyObservation, EligibilityState (+24 more)

### Community 89 - "publish-pr.ts"
Cohesion: 0.17
Nodes (20): activeEffectId(), harnessEffect, assertMayMutate(), readBackOrThrow(), retryRead(), park(), developerPRContent(), Execute (+12 more)

### Community 90 - "offices.ts"
Cohesion: 0.15
Nodes (20): DELIVERY_CONCURRENCY, BoundedRead, backfillClaudeCost(), CompletionReader, HELPER_STDOUT_MAX_BYTES, helperAccounting(), claudeAccounting(), COMPLETION_MAX_BYTES (+12 more)

### Community 93 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 95 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 98 - "codex-rollout-file.ts"
Cohesion: 0.22
Nodes (12): codexHome(), createdAt(), dayDirs(), header(), readCodexRollout(), ROLLOUT_MAX_BYTES, RolloutScan, scanCodexRollouts() (+4 more)

## Knowledge Gaps
- **346 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+341 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `remove-candidate.ts`, `scheduler.ts`, `engine.ts`, `approval.ts`, `source-amendment.ts`, `TicketJob`, `cost-ledger.ts`, `github-delivery.ts`, `publication.ts`, `digest`, `brain-maintenance.ts`, `jira-publication.ts`, `index.ts`, `conversations/conversations.ts`, `activation-recovery.ts`, `azure.ts`, `artifact`, `scheduled-work.ts`, `retrospective-subject.ts`, `.save`, `workKey`, `store.ts`, `notifications.ts`, `Coordinator`, `OfficeSnapshot`, `cec/workflow.ts`, `time-scope.ts`, `supersedingDelivery`, `.run`, `requests.ts`, `coordination.ts`, `.getEffect`, `process.ts`, `features.ts`, `retrospective-facts.ts`, `run-retrospective.ts`, `dependencies.ts`, `dependency-bots/adopt.ts`, `Role`, `weekly-rollup.ts`, `control-store.ts`, `goal-reviews.ts`, `Offices`, `jira-time.ts`, `read-retries.ts`, `delivery-binding.ts`, `run.ts`, `knowledge-context.ts`, `recovery-ledger.ts`, `session-bridge.ts`, `http/commands.ts`, `it-specialist.ts`, `validate-stage.ts`, `admission.ts`, `discovery-recovery.ts`, `BrainFollowup`, `evidence.ts`, `checkpoint-completion.ts`, `tracking-issue.ts`, `closeout-supervision-proof.ts`, `retrospective-triggers.ts`, `github-publication.ts`, `preparation-readback.ts`, `publish-pr.ts`, `offices.ts`?**
  _High betweenness centrality (0.104) - this node is a cross-community bridge._
- **Why does `command()` connect `process.ts` to `remove-candidate.ts`, `engine.ts`, `approval.ts`, `TicketJob`, `cost-ledger.ts`, `github-delivery.ts`, `digest`, `brain-maintenance.ts`, `jira-publication.ts`, `activation-recovery.ts`, `azure.ts`, `scheduled-work.ts`, `.save`, `store.ts`, `notifications.ts`, `Coordinator`, `cec/workflow.ts`, `time-scope.ts`, `.run`, `Store`, `requests.ts`, `coordination.ts`, `.getEffect`, `features.ts`, `dependencies.ts`, `service-health.ts`, `Role`, `jira-time.ts`, `command-registry.ts`, `session-bridge.ts`, `run-ci-repair.ts`, `validate-stage.ts`, `BrainFollowup`, `github-publication.ts`, `publish-pr.ts`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `TicketJob` connect `TicketJob` to `remove-candidate.ts`, `scheduler.ts`, `source-amendment.ts`, `Inspector.tsx`, `github-delivery.ts`, `digest`, `activation-recovery.ts`, `artifact`, `work-summary.ts`, `closeout.ts`, `retrospective-subject.ts`, `.save`, `workKey`, `cec/workflow.ts`, `github-check-selection.ts`, `requests.ts`, `dependencies.ts`, `dependency-bots/adopt.ts`, `Role`, `delivery-binding.ts`, `run-ci-repair.ts`, `it-specialist.ts`, `validate-stage.ts`, `admission.ts`, `fact-bounds.ts`, `discovery-recovery.ts`, `closeout-supervision-proof.ts`, `retrospective-triggers.ts`, `github-publication.ts`, `preparation-readback.ts`, `shared.ts`, `publish-pr.ts`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `command()` (e.g. with `.constructor()` and `executeRequest()`) actually correct?**
  _`command()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _346 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `engine.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0707070707070707 - nodes in this community are weakly interconnected._
- **Should `source-amendment.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07146087743102668 - nodes in this community are weakly interconnected._