# Graph Report - the-office  (2026-11-09)

## Corpus Check
- 527 files · ~248,829 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2970 nodes · 12596 edges · 104 communities (100 shown, 4 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 68 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `068179a4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- source-amendment.ts
- github-delivery.ts
- post-conflict-preparation.ts
- features/workflow.ts
- index.tsx
- OfficeScene.tsx
- run-ci-repair.ts
- activation-recovery.ts
- PeoplePanel.tsx
- Inspector.tsx
- maintenance.ts
- GitHubDelivery
- TimeBook.tsx
- artifact
- index.ts
- jira-operations.ts
- worker-runtime.ts
- .getEffect
- conversations/conversations.ts
- schedule.ts
- work-summary.ts
- agents.ts
- it-specialist.ts
- cec/issue-publication.ts
- mutedCopy
- .emit
- azure.ts
- .transaction
- retrospective-facts.ts
- knowledge.ts
- telemetry.ts
- session-bridge.ts
- run-accounting.ts
- Role
- engine.ts
- shared.ts
- .save
- source-amendment-scope.ts
- accept-retrospective.ts
- time-scope.ts
- dependency-bots/adopt.ts
- cost-ledger.ts
- remove-candidate.ts
- preferences-store.ts
- jira-time.ts
- Store
- daily-cto.ts
- coordination-tick.ts
- Coordinator
- assertMayMutate
- brain-maintenance.ts
- delivery-binding.ts
- tracking-issue.ts
- record-trigger.ts
- notifications.ts
- dependencies.ts
- goal-reporting.ts
- propose-improvements.ts
- retrospective-subject.ts
- GitHubIssuePublisher
- publish-pr.ts
- investigations/run.ts
- goal-reviews.ts
- lesson-selection.ts
- follow-up-alerts.ts
- create-candidate.ts
- service-health.ts
- features.ts
- process.ts
- delivery-task.ts
- assignment-poll.ts
- offices.ts
- discovery-recovery.ts
- store.ts
- scheduled-work.ts
- run-retrospective.ts
- scheduled-retrospectives.ts
- coordination.ts
- lessons-view.ts
- saved-prerequisite-handoff.ts
- work.ts
- projects.ts
- WorkTime
- Offices
- blocker-followups.ts
- DailyCTO.tsx
- recovery-ledger.ts
- evidence.ts
- fact-bounds.ts
- OfficeProject
- command-registry.ts
- codex-rollout.ts
- .value
- cost-totals.ts
- checkpoint-completion.ts
- slack-supersession.ts
- helper-evidence.py
- brain-followup.ts
- harnessEffect
- merge-summary.ts
- github.ts
- run-usage.ts
- codex-rollout-file.ts

## God Nodes (most connected - your core abstractions)
1. `Store` - 277 edges
2. `TicketJob` - 122 edges
3. `GitHubDelivery` - 118 edges
4. `command()` - 99 edges
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

## Communities (104 total, 4 thin omitted)

### Community 0 - "source-amendment.ts"
Cohesion: 0.09
Nodes (58): containedFile(), adoptCandidate(), reported, Scope, Assessment, outsideScanSources(), Ownership, reconcileScopeRepairReadback() (+50 more)

### Community 1 - "github-delivery.ts"
Cohesion: 0.05
Nodes (100): findingsBlock(), HarnessControl, HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery(), BOARD_RULE, conflictRefreshInstruction() (+92 more)

### Community 2 - "post-conflict-preparation.ts"
Cohesion: 0.13
Nodes (35): continuationNativeReview(), candidateInput(), children, oldAdoptionBasis(), savedCandidateAdmission, assertPostConflictFiles(), readPostConflictPreparationFacts(), reconcileCompletedConflictDraft() (+27 more)

### Community 3 - "features/workflow.ts"
Cohesion: 0.12
Nodes (39): approveFeature(), assertRetainedItems(), commandFeature(), featureById(), mutation(), reviewQuestions(), discoveryPrompt(), planPrompt() (+31 more)

### Community 4 - "index.tsx"
Cohesion: 0.08
Nodes (52): Conversation(), recommendedReply(), slackMessageStatus(), SlackDeliveryCard(), ServiceHealthPanel(), labels, ServiceHealthRow(), BlockerFollowups() (+44 more)

### Community 5 - "OfficeScene.tsx"
Cohesion: 0.05
Nodes (60): itAgent(), itDiagnostics(), displayAgentTask(), githubStageLabels, withoutElapsed(), LiveAgentTask(), Props, RunningTask() (+52 more)

### Community 6 - "run-ci-repair.ts"
Cohesion: 0.27
Nodes (12): ciCheckout(), verifyCIHooks(), CIFailure, prepareCIMetadataRepair(), publishCIRepair(), rewordCommits(), CIPlanSchema, runCIRepair() (+4 more)

### Community 7 - "activation-recovery.ts"
Cohesion: 0.10
Nodes (58): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+50 more)

### Community 8 - "PeoplePanel.tsx"
Cohesion: 0.11
Nodes (37): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+29 more)

### Community 9 - "Inspector.tsx"
Cohesion: 0.05
Nodes (60): SendMessage, blank(), goalInput, Goals(), CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants (+52 more)

### Community 10 - "maintenance.ts"
Cohesion: 0.11
Nodes (23): captureMaintenanceStep(), candidateOwner(), SETTLED, skipOwnedCandidate(), Skipped, skippedCandidateLedger(), CmsFollowUpContext, cmsFollowUpInstructions() (+15 more)

### Community 11 - "GitHubDelivery"
Cohesion: 0.06
Nodes (51): GitHubDelivery, completedPRReviews(), implementationRecoveryCandidate(), recoveredFindingsResolved(), recoverImplementation(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence() (+43 more)

### Community 12 - "TimeBook.tsx"
Cohesion: 0.10
Nodes (35): TelemetryReport, AzureBuild, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens(), usd() (+27 more)

### Community 13 - "artifact"
Cohesion: 0.11
Nodes (54): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+46 more)

### Community 14 - "index.ts"
Cohesion: 0.08
Nodes (37): args, [cmd,...rawArgs], commands, key, projectIndex, featureRoute(), close(), config (+29 more)

### Community 16 - "worker-runtime.ts"
Cohesion: 0.08
Nodes (36): assignmentSubject(), dispatchExposure(), prepareExposure(), LessonSelection, CODEX_DEFAULT_EFFORT, CODEX_DEFAULT_MODEL, CODEX_EFFORTS, CODEX_ROLES (+28 more)

### Community 17 - ".getEffect"
Cohesion: 0.19
Nodes (11): GitHubOperations, fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), goalNoticeNeverDispatched(), Assessment, closeNativeRefresh(), fingerprint() (+3 more)

### Community 18 - "conversations/conversations.ts"
Cohesion: 0.10
Nodes (24): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+16 more)

### Community 19 - "schedule.ts"
Cohesion: 0.05
Nodes (102): expireLearningPackets(), packetReferences(), learningMetrics(), lessonsNeedingReview(), RollupResult, RollupResultSchema, harperFolder(), KnowledgeRunner (+94 more)

### Community 20 - "work-summary.ts"
Cohesion: 0.11
Nodes (32): Outbox(), themeColor, App(), TicketDetail(), envelopeCard, deliveryRepairProjection(), DependencyNotice(), card (+24 more)

### Community 21 - "agents.ts"
Cohesion: 0.08
Nodes (36): cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), cecChatPrompt(), ctoChatPrompt(), itChatPrompt(), slackSendPrompt() (+28 more)

### Community 22 - "it-specialist.ts"
Cohesion: 0.26
Nodes (12): ITContext, investigationCandidates(), investigationId(), investigationFollowUps(), investigationResolution(), syncInvestigations(), publishITReport(), delays (+4 more)

### Community 23 - "cec/issue-publication.ts"
Cohesion: 0.15
Nodes (14): Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), plainDescription(), Transition, assertEnrollable() (+6 more)

### Community 24 - "mutedCopy"
Cohesion: 0.15
Nodes (27): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView() (+19 more)

### Community 25 - ".emit"
Cohesion: 0.16
Nodes (22): ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), configureNotices(), NoticeSettings, reconcileNoticeConfirmations(), retryRecipientLookup() (+14 more)

### Community 26 - "azure.ts"
Cohesion: 0.19
Nodes (15): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+7 more)

### Community 27 - ".transaction"
Cohesion: 0.16
Nodes (8): createFeature(), featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), recoverFeatures(), observeHelperGroups(), stopHelperGroups(), FeatureReviewRunner

### Community 28 - "retrospective-facts.ts"
Cohesion: 0.22
Nodes (12): ARTIFACT_LIMIT, clip(), LEDGER_STEPS, MAINTENANCE_LIMIT, maintenanceFacts(), MaintenancePacketSection, clip(), PACKET_LIMIT (+4 more)

### Community 29 - "knowledge.ts"
Cohesion: 0.10
Nodes (23): Input, retrospectivePrompt(), SUBJECT, Kind, RetrospectiveResult, Stage, BlockerFollowup, ImprovementGrant (+15 more)

### Community 30 - "telemetry.ts"
Cohesion: 0.11
Nodes (23): CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL, Rates (+15 more)

### Community 31 - "session-bridge.ts"
Cohesion: 0.13
Nodes (23): claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexSessionContext(), readRollout, claudeSessions(), codexSessions() (+15 more)

### Community 32 - "run-accounting.ts"
Cohesion: 0.14
Nodes (22): BoundedRead, EvidenceOutcome, backfillClaudeCost(), CompletionReader, readCodexRollout(), HELPER_STDOUT_MAX_BYTES, helperAccounting(), claudeAccounting() (+14 more)

### Community 33 - "Role"
Cohesion: 0.16
Nodes (14): ROLES, officeCapacity, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch() (+6 more)

### Community 34 - "engine.ts"
Cohesion: 0.05
Nodes (56): correlatedBuild(), checkMail(), drainMail(), requestMail(), parksInJira(), dispatchNightly(), drainDelivery(), enableNightly() (+48 more)

### Community 35 - "shared.ts"
Cohesion: 0.06
Nodes (45): FeatureRound, DailyCTOSummary, FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures() (+37 more)

### Community 36 - ".save"
Cohesion: 0.23
Nodes (24): unpack(), BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue(), readIssues() (+16 more)

### Community 37 - "source-amendment-scope.ts"
Cohesion: 0.08
Nodes (39): approvedText(), assert(), assert(), normalize(), officialUrls, ReleaseCapture, verifyReleaseCaptures(), amendmentCaptureObservation() (+31 more)

### Community 38 - "accept-retrospective.ts"
Cohesion: 0.23
Nodes (12): Accepted, acceptRetrospective(), normalizeStatement(), RETROSPECTIVE_HISTORY, decideOfficeProposal(), now(), OfficeKnowledgeStore, proposeOfficeLessons() (+4 more)

### Community 39 - "time-scope.ts"
Cohesion: 0.25
Nodes (18): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), scopeSelector(), ticketDayTotals(), captureTime(), timeLedger(), artifact(), correctRecoveryClassification() (+10 more)

### Community 40 - "dependency-bots/adopt.ts"
Cohesion: 0.14
Nodes (28): readBackOrThrow(), adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR, inPickupLane() (+20 more)

### Community 41 - "cost-ledger.ts"
Cohesion: 0.13
Nodes (29): EffectUncertainError, captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress() (+21 more)

### Community 42 - "remove-candidate.ts"
Cohesion: 0.18
Nodes (17): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), removeAdoptedClone() (+9 more)

### Community 43 - "preferences-store.ts"
Cohesion: 0.19
Nodes (10): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS (+2 more)

### Community 44 - "jira-time.ts"
Cohesion: 0.21
Nodes (13): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+5 more)

### Community 45 - "Store"
Cohesion: 0.15
Nodes (4): JiraFeaturePublisher, Store, command(), OfficeEvent

### Community 46 - "daily-cto.ts"
Cohesion: 0.13
Nodes (12): DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), reviewWeekday(), DailyResultSchema, FreshDailyResultSchema, Briefing (+4 more)

### Community 47 - "coordination-tick.ts"
Cohesion: 0.21
Nodes (13): PrerequisitesSchema, brainCheckpointCompletion(), reconcileCompletedCheckpoints(), reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION, tick() (+5 more)

### Community 48 - "Coordinator"
Cohesion: 0.10
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 49 - "assertMayMutate"
Cohesion: 0.20
Nodes (18): harnessCloseout(), PASSING, verifyMergeActions(), assertMayMutate(), withHarnessWork(), runHarnessStage(), harnessStageResult(), receipt() (+10 more)

### Community 50 - "brain-maintenance.ts"
Cohesion: 0.20
Nodes (11): maintenancePolicies(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice(), easternDate(), weeklyDue() (+3 more)

### Community 51 - "delivery-binding.ts"
Cohesion: 0.25
Nodes (13): approvedDelivery(), bindDelivery(), featureEffectGate(), assertFeatureGate(), bindFeature(), currentApproval(), enrolled(), featureGate() (+5 more)

### Community 52 - "tracking-issue.ts"
Cohesion: 0.19
Nodes (24): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard, projectCards() (+16 more)

### Community 53 - "record-trigger.ts"
Cohesion: 0.15
Nodes (25): park(), LEARNING_BASELINES, maintainLearning(), clip(), JobLike, recordCIBudget(), recordParked(), recordRepairBudget() (+17 more)

### Community 54 - "notifications.ts"
Cohesion: 0.18
Nodes (11): channelNoticeAuthorized(), Identity, MergeNotifications, SlackMessages, SlackRequestSchema, goalNoticeAuthorized(), sendGoalNotice(), maintenanceNoticeAuthorized() (+3 more)

### Community 55 - "dependencies.ts"
Cohesion: 0.22
Nodes (19): Admission, admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, compatible(), dependencyCompletionKey(), dependencyEligibility() (+11 more)

### Community 56 - "goal-reporting.ts"
Cohesion: 0.25
Nodes (13): githubPRDescription(), azureGoalFacts(), azurePRDescription(), boundedEvidence(), EvidenceStore, GOAL_EVIDENCE_LIMITS, GOAL_REPORT_GUIDANCE, goalEvidenceFingerprint() (+5 more)

### Community 57 - "propose-improvements.ts"
Cohesion: 0.47
Nodes (7): distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementDigest(), proposeImprovements(), LearningSubject

### Community 58 - "retrospective-subject.ts"
Cohesion: 0.19
Nodes (15): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+7 more)

### Community 59 - "GitHubIssuePublisher"
Cohesion: 0.28
Nodes (6): Assign, Board, GitHubIssuePublisher, number(), same(), label()

### Community 60 - "publish-pr.ts"
Cohesion: 0.24
Nodes (13): retryRead(), developerPRContent(), Execute, lintPRContent(), officePRContent(), prContent, assertCandidate(), Candidate (+5 more)

### Community 61 - "investigations/run.ts"
Cohesion: 0.20
Nodes (15): OFFICE_FIX_PROMPT, OfficeFixResult, validateOfficeFix(), investigationReady(), INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, InvestigationOptions, InvestigationReport (+7 more)

### Community 62 - "goal-reviews.ts"
Cohesion: 0.16
Nodes (14): applyGoalReview(), EvidenceRefSchema, statusAllowed(), workEvidence(), GoalInput, queueGoalNotice(), DailyCTOBriefing, DailyCTOResult (+6 more)

### Community 63 - "lesson-selection.ts"
Cohesion: 0.20
Nodes (15): knowledgeContext(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), MAINTENANCE, MAX_LESSONS (+7 more)

### Community 64 - "follow-up-alerts.ts"
Cohesion: 0.38
Nodes (7): checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), repeatedVendorReviewBlock(), stoppedInVendorReview(), maintenanceSuperseded(), REOBSERVED

### Community 65 - "create-candidate.ts"
Cohesion: 0.31
Nodes (9): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+1 more)

### Community 66 - "service-health.ts"
Cohesion: 0.19
Nodes (8): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, ServiceHealth

### Community 67 - "features.ts"
Cohesion: 0.14
Nodes (20): assertFeatureDependencyOrder(), featureDependencyEdges(), key(), admitImprovement(), improvementEligible(), improvementManifest(), improvementMarker(), improvementProvider() (+12 more)

### Community 68 - "process.ts"
Cohesion: 0.16
Nodes (18): At, Errno, GroupInventory, GroupProbe, LifecycleDiagnostic, Phase, Pid, groupInventory() (+10 more)

### Community 69 - "delivery-task.ts"
Cohesion: 0.20
Nodes (12): cecPrompt(), resolvedDecisionNote(), stageInstructions, APPROACH_GUIDANCE, reviewInstructions(), deliveryTask(), DeliveryTaskInput, DISCOVERY_GUIDANCE (+4 more)

### Community 70 - "assignment-poll.ts"
Cohesion: 0.20
Nodes (13): noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), pinCourier, wikiSync, due(), unparkReleasedWaits(), compare() (+5 more)

### Community 71 - "offices.ts"
Cohesion: 0.20
Nodes (14): projectOutbox(), syncOutbox(), projectSlackDeliveries(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint(), slackRequestSettled() (+6 more)

### Community 72 - "discovery-recovery.ts"
Cohesion: 0.27
Nodes (11): Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership, rawHash() (+3 more)

### Community 73 - "store.ts"
Cohesion: 0.13
Nodes (16): Clock, systemClock, applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, statementCache(), initialSnapshot() (+8 more)

### Community 74 - "scheduled-work.ts"
Cohesion: 0.16
Nodes (18): deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), scheduledSlackIntake(), deterministicActions (+10 more)

### Community 75 - "run-retrospective.ts"
Cohesion: 0.25
Nodes (12): learningDigest(), recordLearningOpportunity(), appendLearningFacts(), freezeLearningPacket(), publicTopicSafe(), researchTopics(), TEMPLATES, RetrospectiveResultSchema (+4 more)

### Community 76 - "scheduled-retrospectives.ts"
Cohesion: 0.23
Nodes (14): busyMaintenanceIds(), clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates(), maintenanceCompletedId(), maintenanceKey(), visibleMaintenanceTriggerIds() (+6 more)

### Community 77 - "coordination.ts"
Cohesion: 0.16
Nodes (19): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), legacy, validateNativeContinuation(), checkpointWindow() (+11 more)

### Community 78 - "lessons-view.ts"
Cohesion: 0.26
Nodes (10): SEEDS, KnowledgeState, Lesson, OfficeProposal, RetrospectiveRecord, WeeklyRollup, lessonsView, newest() (+2 more)

### Community 79 - "saved-prerequisite-handoff.ts"
Cohesion: 0.30
Nodes (13): continuationWorktree(), dependencyVersion(), handoffSavedPrerequisites(), hasSavedPrerequisiteResult(), Ownership, qualified(), readDependencies(), requireSavedPrerequisites() (+5 more)

### Community 80 - "work.ts"
Cohesion: 0.12
Nodes (16): EffectOperation, ProjectReadiness, AssignmentResult, CompletionCondition, Continuation, DependencyObservation, EligibilityState, FailureCategory (+8 more)

### Community 81 - "projects.ts"
Cohesion: 0.26
Nodes (8): readLocalIntakeReport(), LOCAL_BINDINGS, file, project, root, DeliverySlot, projectById(), projectData()

### Community 82 - "WorkTime"
Cohesion: 0.18
Nodes (18): ConfirmedSegment, LiveAnchor, ObservationGap, SnapshotOrdering, TimeLedgerState, WorkTime, Acc, bump() (+10 more)

### Community 84 - "blocker-followups.ts"
Cohesion: 0.56
Nodes (7): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), readBackConversations(), handoff(), reconcileBlockerFollowups()

### Community 85 - "DailyCTO.tsx"
Cohesion: 0.26
Nodes (8): CTOReview(), goalState, DailyCTO(), GoalHistory(), reportDate(), reviewStatus, reviewExcerpt(), ReviewText()

### Community 86 - "recovery-ledger.ts"
Cohesion: 0.27
Nodes (9): savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), diagnosticContext(), diagnosticSnapshot(), nativeDeliveryResolved(), reconcileRecoveryLedger() (+1 more)

### Community 87 - "evidence.ts"
Cohesion: 0.30
Nodes (10): investigationEvidence(), OFFICE_SOURCE_PATHS, officeSource(), ROOT, done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact() (+2 more)

### Community 88 - "fact-bounds.ts"
Cohesion: 0.30
Nodes (13): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+5 more)

### Community 89 - "OfficeProject"
Cohesion: 0.30
Nodes (10): AUTO_ADOPT_BOTS, goalEvidencePath(), OfficeConfigInputs, officeConfigRoute(), officeConfigSummary(), CECBinding, localBindings, assertModelOverrides() (+2 more)

### Community 90 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 91 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 92 - ".value"
Cohesion: 0.27
Nodes (6): file, folder, logs, root, xml(), ProjectProgress

### Community 93 - "cost-totals.ts"
Cohesion: 0.33
Nodes (9): isModelWork(), isTicketModelWork(), ScopePolicy, awaitingEvidence(), CaptureContext, inCostWindow(), TicketCost, ticketCosts() (+1 more)

### Community 94 - "checkpoint-completion.ts"
Cohesion: 0.24
Nodes (7): BrainStatusSchema, identity, coverageSchema, followupSchema, verified, ReconciliationRequest, DailyCheckpoint

### Community 95 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 99 - "harnessEffect"
Cohesion: 0.47
Nodes (6): activeEffectId(), harnessEffect, officeMergeProvenance(), retryMergeScanner(), runIdentity(), transientScannerJobs()

### Community 100 - "merge-summary.ts"
Cohesion: 0.36
Nodes (7): clamp(), LIMITS, MergedPR, plainSlackText(), section(), shippedSummary(), mergeText()

### Community 101 - "github.ts"
Cohesion: 0.36
Nodes (4): GitHubMonitor, GitHubBoard, GitHubPR, GitHubState

### Community 102 - "run-usage.ts"
Cohesion: 0.32
Nodes (6): CodexRollout, claudeCrashZero(), claudeUsage(), codexUsage(), count(), RunUsage

### Community 103 - "codex-rollout-file.ts"
Cohesion: 0.36
Nodes (7): codexHome(), createdAt(), dayDirs(), header(), ROLLOUT_MAX_BYTES, RolloutScan, scanCodexRollouts()

## Knowledge Gaps
- **354 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+349 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `source-amendment.ts`, `github-delivery.ts`, `post-conflict-preparation.ts`, `features/workflow.ts`, `OfficeScene.tsx`, `activation-recovery.ts`, `maintenance.ts`, `GitHubDelivery`, `artifact`, `index.ts`, `jira-operations.ts`, `worker-runtime.ts`, `.getEffect`, `conversations/conversations.ts`, `schedule.ts`, `agents.ts`, `it-specialist.ts`, `cec/issue-publication.ts`, `.emit`, `azure.ts`, `.transaction`, `retrospective-facts.ts`, `knowledge.ts`, `session-bridge.ts`, `run-accounting.ts`, `Role`, `engine.ts`, `shared.ts`, `.save`, `accept-retrospective.ts`, `time-scope.ts`, `dependency-bots/adopt.ts`, `cost-ledger.ts`, `remove-candidate.ts`, `jira-time.ts`, `daily-cto.ts`, `coordination-tick.ts`, `assertMayMutate`, `brain-maintenance.ts`, `delivery-binding.ts`, `tracking-issue.ts`, `record-trigger.ts`, `notifications.ts`, `dependencies.ts`, `goal-reporting.ts`, `propose-improvements.ts`, `retrospective-subject.ts`, `publish-pr.ts`, `investigations/run.ts`, `goal-reviews.ts`, `lesson-selection.ts`, `create-candidate.ts`, `features.ts`, `delivery-task.ts`, `offices.ts`, `discovery-recovery.ts`, `store.ts`, `scheduled-work.ts`, `run-retrospective.ts`, `scheduled-retrospectives.ts`, `coordination.ts`, `saved-prerequisite-handoff.ts`, `Offices`, `blocker-followups.ts`, `recovery-ledger.ts`, `evidence.ts`, `checkpoint-completion.ts`, `brain-followup.ts`, `harnessEffect`, `github.ts`?**
  _High betweenness centrality (0.107) - this node is a cross-community bridge._
- **Why does `Role` connect `Role` to `github-delivery.ts`, `index.tsx`, `OfficeScene.tsx`, `PeoplePanel.tsx`, `Inspector.tsx`, `maintenance.ts`, `worker-runtime.ts`, `conversations/conversations.ts`, `agents.ts`, `.emit`, `run-accounting.ts`, `engine.ts`, `shared.ts`, `retrospective-subject.ts`, `delivery-task.ts`, `offices.ts`, `store.ts`, `work.ts`, `projects.ts`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `OfficeSnapshot` connect `shared.ts` to `index.tsx`, `OfficeScene.tsx`, `PeoplePanel.tsx`, `Inspector.tsx`, `maintenance.ts`, `TimeBook.tsx`, `work-summary.ts`, `it-specialist.ts`, `mutedCopy`, `azure.ts`, `engine.ts`, `Store`, `record-trigger.ts`, `follow-up-alerts.ts`, `service-health.ts`, `offices.ts`, `store.ts`, `work.ts`, `DailyCTO.tsx`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `command()` (e.g. with `.constructor()` and `executeRequest()`) actually correct?**
  _`command()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _354 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `source-amendment.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09182692307692308 - nodes in this community are weakly interconnected._
- **Should `github-delivery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.052527161076995746 - nodes in this community are weakly interconnected._