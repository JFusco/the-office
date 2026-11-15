# Graph Report - the-office  (2026-11-15)

## Corpus Check
- 839 files · ~338,330 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4138 nodes · 19317 edges · 123 communities (119 shown, 4 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 681 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ad26eacc`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- workKey
- digest
- dependency-bots/adopt.ts
- accept-stage-result.ts
- Inspector.tsx
- github-delivery.ts
- session-bridge.ts
- ref_react
- agents.ts
- ref_node_path
- source-amendment-scope.ts
- index.ts
- App.tsx
- features/workflow.ts
- reader.ts
- scheduled-captures.ts
- run-retrospective.ts
- record-trigger.ts
- worker-runtime.ts
- requests.ts
- featureById
- outbox.ts
- PeoplePanel.tsx
- harnessDelivers
- knowledge.ts
- maintenance/maintenance.ts
- office-lessons.ts
- artifact
- coordination.ts
- packed165-admission.ts
- digest
- index.tsx
- conversations/conversations.ts
- queue-repairs.ts
- CEC
- ITFollowUps.tsx
- cost-ledger.ts
- run-accounting.ts
- Store
- .getEffect
- verifyRepairCandidate
- time-scope.ts
- harnessEffect
- .save
- scheduled-work.ts
- activation-recovery.ts
- OfficeScene.tsx
- features/commands.ts
- pilot-delivery.ts
- demand-facts.ts
- .emit
- assignment-poll.ts
- notifications.ts
- cec/workflow.ts
- ref_zod
- weekly-rollup.ts
- unblock-brief.ts
- TimeBook.tsx
- Coordinator
- scheduler.ts
- process.ts
- continue-unsealed-qa.ts
- Goals.tsx
- harnessEffect
- ticket-evidence.ts
- ref_zod
- features.ts
- ControlStore
- coordination-tick.ts
- work.ts
- constellation-runtime.ts
- Store
- saved-candidate-admission.ts
- WorkTime
- Agents
- admit-improvement.ts
- shared.ts
- JiraIssuePublisher
- GitHubIssuePublisher
- harness-baseline.ts
- control-store.ts
- retrospective-subject.ts
- cli.ts
- local-config.ts
- blocker-followups.ts
- ledger.ts
- ledger.ts
- node-visuals.ts
- tracking-issue.ts
- lesson-selection.ts
- preferences-store.ts
- scene-motion.ts
- jira-operations.ts
- learning-events.ts
- api-routes.ts
- capture-session-clone.py
- RoomCamera.tsx
- Outbox.tsx
- useOfficePreferences.ts
- fact-bounds.ts
- coordination.ts
- it-specialist.ts
- retire-history.ts
- scope-repair-resume.ts
- Ticket
- extract-worker.mjs
- .activeClaims
- .api
- knowledge-views.ts
- candidate.ts
- brain-audit-reuse.ts
- command-registry.ts
- model-routes.ts
- Offices
- github-context.ts
- cost-totals.ts
- stopped-base-provider.ts
- Role
- .now
- accepted.ts
- QuestionNotifications
- qa-results.ts
- stopped-reason.ts

## God Nodes (most connected - your core abstractions)
1. `Store` - 372 edges
2. `TicketJob` - 176 edges
3. `digest()` - 176 edges
4. `artifact()` - 131 edges
5. `GitHubDelivery` - 122 edges
6. `command()` - 115 edges
7. `workKey()` - 101 edges
8. `currentAssignment()` - 90 edges
9. `cx()` - 88 edges
10. `OfficeSnapshot` - 84 edges

## Surprising Connections (you probably didn't know these)
- `LessonBrainOverlap` --references--> `Lesson`  [EXTRACTED]
  server/knowledge/lesson-brain-audit.ts → src/contracts/knowledge.ts
- `DeliveryAuthorityInput` --references--> `HarnessRequest`  [EXTRACTED]
  server/delivery/harness/delivery-authority.ts → src/contracts/work.ts
- `apply()` --indirect_call--> `note()`  [INFERRED]
  src/conversations/OutboxSavedImplementation.tsx → server/cec/parking/resume-parked.ts
- `Store` --references--> `OfficeSnapshot`  [EXTRACTED]
  server/store/store.ts → src/shared.ts
- `ScopePreview` --references--> `WorkTime`  [EXTRACTED]
  server/time/time-scope.ts → src/shared.ts

## Import Cycles
- 2-file cycle: `server/scheduling/coordination-pump.ts -> server/scheduling/coordination.ts -> server/scheduling/coordination-pump.ts`
- 2-file cycle: `server/scheduling/coordination-tick.ts -> server/scheduling/coordination.ts -> server/scheduling/coordination-tick.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/track-adopted-review.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/stage-reconciliation.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/source-amendment/source-amendment.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/accept-stage-result.ts -> server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/accept-stage-result.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/publication/metadata-context.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/refresh-merge-review.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/closeout/github-closeout.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/implementation/saved-prerequisite-handoff.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/queue-repairs.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/knowledge/lesson-exits.ts -> server/scheduling/requests.ts -> server/knowledge/lesson-exits.ts`
- 2-file cycle: `server/delivery/recovery/implementation/candidate-adoption.ts -> server/delivery/recovery/source-amendment/source-amendment.ts -> server/delivery/recovery/implementation/candidate-adoption.ts`
- 2-file cycle: `server/delivery/recovery/source-amendment/source-amendment-held.ts -> server/delivery/recovery/source-amendment/source-amendment.ts -> server/delivery/recovery/source-amendment/source-amendment-held.ts`
- 2-file cycle: `server/conversations/conversations.ts -> server/conversations/cto-conversations.ts -> server/conversations/conversations.ts`
- 2-file cycle: `server/conversations/notifications.ts -> server/conversations/slack.ts -> server/conversations/notifications.ts`
- 2-file cycle: `src/contracts/people.ts -> src/shared.ts -> src/contracts/people.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-guard.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`

## Communities (123 total, 4 thin omitted)

### Community 0 - "workKey"
Cohesion: 0.10
Nodes (47): PrerequisitesSchema, continuationScope(), continuationWorktree(), continuationGuard(), brainImplementationCandidate(), BrainReadback, digest(), implementationRecoveryCandidate() (+39 more)

### Community 1 - "digest"
Cohesion: 0.09
Nodes (55): ownershipReadHistory(), recordedPush(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), admitGreen156(), GREEN156, green156Admitted(), green156Subject() (+47 more)

### Community 2 - "dependency-bots/adopt.ts"
Cohesion: 0.15
Nodes (25): Execute, adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, DependabotPR, dependabotPR() (+17 more)

### Community 3 - "accept-stage-result.ts"
Cohesion: 0.10
Nodes (49): containedFile(), findingsBlock(), handsOff(), needsDecision(), park(), acceptStageResult(), acceptConflictRepair(), APPROACH_GUIDANCE (+41 more)

### Community 4 - "Inspector.tsx"
Cohesion: 0.10
Nodes (69): Outbox(), blockedSummary(), ServiceHealthPanel(), followUp(), labels, ServiceHealthRow(), BlockerFollowups(), LearningCoverage() (+61 more)

### Community 5 - "github-delivery.ts"
Cohesion: 0.06
Nodes (35): ProjectProgress, candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), BOARD_RULE (+27 more)

### Community 6 - "session-bridge.ts"
Cohesion: 0.06
Nodes (55): claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexDaemonProcesses(), accountCodexProcesses(), CodexProcessInventory, codexProcessInventory() (+47 more)

### Community 7 - "ref_react"
Cohesion: 0.06
Nodes (61): guidanceExcerpt(), KnowledgeNode, Activity(), ActivityTimeline(), AssignmentKnowledge(), Lookup(), BrainWorkspace(), DocumentMetadata (+53 more)

### Community 8 - "agents.ts"
Cohesion: 0.08
Nodes (36): cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), readbackDispatchGuidance(), CECReadbackSchema, READBACK_OWNER_SCOPE, cecChatPrompt() (+28 more)

### Community 9 - "ref_node_path"
Cohesion: 0.13
Nodes (21): interruptedImplementation(), ctoInputIdentityMatches(), ctoInputRecovered(), StoppedBaseAuditReader, readStoppedBaseAuditNative(), contentTypes, readStoppedClaudeNative(), recordTypes (+13 more)

### Community 10 - "source-amendment-scope.ts"
Cohesion: 0.06
Nodes (67): adoptCandidate(), reported, Scope, approvedText(), assert(), AMENDMENT_REVIEW_PROOF, amendmentInstruction(), amendmentIssueSha256() (+59 more)

### Community 11 - "index.ts"
Cohesion: 0.10
Nodes (20): close(), config, itSpecialist, loadedRevision, offices, releaseLock, server, serviceHealth (+12 more)

### Community 12 - "App.tsx"
Cohesion: 0.05
Nodes (61): itAgent(), itDiagnostics(), BrainDrawer(), themeColor, App(), CONNECTION, CONNECTION_DOT, dockItemVariants (+53 more)

### Community 13 - "features/workflow.ts"
Cohesion: 0.08
Nodes (56): approveFeature(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), discoveryPrompt(), planPrompt(), artifactPath() (+48 more)

### Community 14 - "reader.ts"
Cohesion: 0.13
Nodes (11): committedNotePage(), BrainGraph, BrainNote, BrainReader, CommittedBrain, GraphNode, GraphPage, hash (+3 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.16
Nodes (41): createFeature(), assertEnrollable(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), CaptureRequest, captureRequest(), captureRequests() (+33 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.15
Nodes (26): acceptRetrospective(), BLOCKING, BlockingTrigger, blockingTrigger(), isBlocking(), BrainOverlap, brainOverlap(), brainOverlapQuery() (+18 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.11
Nodes (39): baselineLearning(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences(), configureKnowledge(), clip(), maintenanceBlockedId() (+31 more)

### Community 18 - "worker-runtime.ts"
Cohesion: 0.08
Nodes (33): SlackResultSchema, SlackVerificationSchema, candidateWorkspaceEnvironment(), ApproachSchema, assignmentSubject(), dispatchExposure(), prepareExposure(), LessonSelection (+25 more)

### Community 19 - "requests.ts"
Cohesion: 0.09
Nodes (49): beginPacked165Setup(), assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), reconcileCompletedConflictDraft(), routeReadyPostConflictPublication() (+41 more)

### Community 20 - "featureById"
Cohesion: 0.18
Nodes (10): featureById(), Link, linkFeature(), publishFeature(), reconcilePublication(), uncertainPublications(), reserveIdentity(), featureRoute() (+2 more)

### Community 21 - "outbox.ts"
Cohesion: 0.17
Nodes (16): conversationResolved(), projectOutbox(), knowledgeOutbox(), checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), repeatedVendorReviewBlock(), stoppedInVendorReview() (+8 more)

### Community 22 - "PeoplePanel.tsx"
Cohesion: 0.10
Nodes (42): label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+34 more)

### Community 23 - "harnessDelivers"
Cohesion: 0.22
Nodes (14): deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, requireDeliveryAuthority(), gateRegisteredDelivery(), resolveDeliveryWork(), assertDeliveryMayMutate() (+6 more)

### Community 24 - "knowledge.ts"
Cohesion: 0.06
Nodes (46): Accepted, RETROSPECTIVE_HISTORY, Shared, curateLesson(), Curation, CurationAction, mergeEvidence(), ARTIFACT_LIMIT (+38 more)

### Community 25 - "maintenance/maintenance.ts"
Cohesion: 0.10
Nodes (29): maintenancePolicies(), captureMaintenanceStep(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice(), candidateOwner() (+21 more)

### Community 26 - "office-lessons.ts"
Cohesion: 0.13
Nodes (14): normalizeStatement(), decideOfficeProposal(), OfficeKnowledgeStore, proposeOfficeLessons(), retireOfficeLesson(), Input, promoteNoteLesson(), CONSOLIDATED (+6 more)

### Community 27 - "artifact"
Cohesion: 0.08
Nodes (56): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+48 more)

### Community 28 - "coordination.ts"
Cohesion: 0.15
Nodes (30): Admission, admit(), IntakeContext, WAIT_STATUSES, compatible(), dependencyCompletionKey(), dependencyEligibility(), DependencyStores (+22 more)

### Community 29 - "packed165-admission.ts"
Cohesion: 0.10
Nodes (40): accounting, DeliverySubject, nonDelivery, originalReads, observe(), draftReadHeadMatches(), assertDraftClaimHistory(), linkDraftIssue() (+32 more)

### Community 30 - "digest"
Cohesion: 0.12
Nodes (44): activeEffectId(), admitPRMetadata(), METADATA_FINDING, assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema, savedMetadataAssessment() (+36 more)

### Community 31 - "index.tsx"
Cohesion: 0.09
Nodes (56): ctoInputFailure(), OutboxCTOInput(), recover(), OutboxSavedImplementation(), apply(), review(), OutboxSavedPlan(), reconcile() (+48 more)

### Community 32 - "conversations/conversations.ts"
Cohesion: 0.05
Nodes (47): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+39 more)

### Community 33 - "queue-repairs.ts"
Cohesion: 0.14
Nodes (28): checksFailed(), checksPassed(), checksPending(), CurrentChecksWait, currentMergeChecks(), pass(), pending(), requireThat() (+20 more)

### Community 34 - "CEC"
Cohesion: 0.09
Nodes (33): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+25 more)

### Community 35 - "ITFollowUps.tsx"
Cohesion: 0.67
Nodes (4): itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps()

### Community 36 - "cost-ledger.ts"
Cohesion: 0.09
Nodes (39): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId(), OutsideEdit (+31 more)

### Community 37 - "run-accounting.ts"
Cohesion: 0.05
Nodes (70): BoundedRead, done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf(), backfillClaudeCost(), CompletionReader (+62 more)

### Community 38 - "Store"
Cohesion: 0.11
Nodes (26): featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS, reserveReplacement(), stageBudget() (+18 more)

### Community 39 - ".getEffect"
Cohesion: 0.12
Nodes (22): Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership, rawHash() (+14 more)

### Community 40 - "verifyRepairCandidate"
Cohesion: 0.16
Nodes (25): installDependencies(), major(), removeAdoptedClone(), stoppedBaseCheckout(), assertStoppedBaseApproach(), stoppedBaseNextStage(), adoptedReviewCandidate(), ciCheckout() (+17 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.17
Nodes (23): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), scopeSelector(), settlementPending(), superseded(), ticketUnresolved(), midnight(), TicketDay (+15 more)

### Community 42 - "harnessEffect"
Cohesion: 0.21
Nodes (27): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), ProjectCard, projectCards(), projectGraphql() (+19 more)

### Community 43 - ".save"
Cohesion: 0.17
Nodes (31): jiraCollection(), BLOCKED, findComment(), LiveIssue, readIssue(), readIssues(), Execute, jira() (+23 more)

### Community 44 - "scheduled-work.ts"
Cohesion: 0.14
Nodes (24): freshOwnershipRead(), deliverySlot(), metadataRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), requestPriority(), closedTicketRequest(), REOBSERVED (+16 more)

### Community 45 - "activation-recovery.ts"
Cohesion: 0.17
Nodes (27): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+19 more)

### Community 46 - "OfficeScene.tsx"
Cohesion: 0.17
Nodes (32): Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk(), ElevatorStage() (+24 more)

### Community 47 - "features/commands.ts"
Cohesion: 0.10
Nodes (42): commandFeature(), reviewQuestions(), confirmBrief(), FeaturePlanningBindings, FeaturePlanningConfig, POLICY_VERSION, assertQuestionVisibility(), applyHarnessAction() (+34 more)

### Community 48 - "pilot-delivery.ts"
Cohesion: 0.13
Nodes (33): continueImplementation(), dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), resume(), startPilot(), consumeQAPlanRetry() (+25 more)

### Community 49 - "demand-facts.ts"
Cohesion: 0.09
Nodes (31): assignmentKnowledge(), KnowledgeContext, clip(), DEMAND_LIMIT, demandFacts(), DemandSection, key(), LessonKey (+23 more)

### Community 50 - ".emit"
Cohesion: 0.10
Nodes (31): assertOwnership(), decideImplementation(), ImplementationDecision, implementationPreview(), OwnershipRead, closedReadonlyPlan(), Document, document() (+23 more)

### Community 51 - "assignment-poll.ts"
Cohesion: 0.18
Nodes (13): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), syncOutbox(), admitReadyCards(), due(), unparkReleasedWaits(), compare() (+5 more)

### Community 52 - "notifications.ts"
Cohesion: 0.10
Nodes (24): channelNoticeAuthorized(), ChannelSettings, notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR, plainSlackText() (+16 more)

### Community 53 - "cec/workflow.ts"
Cohesion: 0.10
Nodes (41): applyIntakeObservation(), parksInJira(), run(), verifiedTransition(), nextStage(), publicationEvidenceGap(), qaEvidenceGap(), stageResultGap() (+33 more)

### Community 54 - "ref_zod"
Cohesion: 0.14
Nodes (18): EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewDate(), reviewWeekday(), applyGoalReview(), DailyResultSchema, EvidenceRefSchema, FreshDailyResultSchema (+10 more)

### Community 55 - "weekly-rollup.ts"
Cohesion: 0.13
Nodes (26): learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), RollupResult (+18 more)

### Community 56 - "unblock-brief.ts"
Cohesion: 0.53
Nodes (5): clearUnblockBrief(), key(), saveUnblockBrief(), UnblockBrief, unblockBrief()

### Community 57 - "TimeBook.tsx"
Cohesion: 0.09
Nodes (42): TelemetryReport, displayAgentTask(), githubStageLabels, withoutElapsed(), LiveAgentTask(), Props, RunningTask(), text() (+34 more)

### Community 59 - "scheduler.ts"
Cohesion: 0.19
Nodes (12): fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch(), deliveryOccupied(), foreignWork() (+4 more)

### Community 60 - "process.ts"
Cohesion: 0.16
Nodes (17): Event, one(), prePushRejection(), PushIdentity, Candidate, settledPushBoundary(), At, Errno (+9 more)

### Community 61 - "continue-unsealed-qa.ts"
Cohesion: 0.11
Nodes (28): Document, document(), isAccessOnlyPlan(), settledAccessOnlyState(), continueAccessOnlyPlan(), entryExists(), continueOwnershipRead(), continueUnsealedQA() (+20 more)

### Community 62 - "Goals.tsx"
Cohesion: 0.14
Nodes (20): CTOReview(), goalState, DailyCTO(), reportDate(), reviewStatus, GoalList(), card(), blank() (+12 more)

### Community 63 - "harnessEffect"
Cohesion: 0.18
Nodes (17): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot() (+9 more)

### Community 64 - "ticket-evidence.ts"
Cohesion: 0.11
Nodes (29): assetDownloader(), attachmentKind(), evidenceDirectory(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS, EvidenceAttachment (+21 more)

### Community 65 - "ref_zod"
Cohesion: 0.29
Nodes (5): BrainStatusSchema, identity, coverageSchema, followupSchema, verified

### Community 66 - "features.ts"
Cohesion: 0.19
Nodes (18): FeatureQuestionProjection, OutboxQuestionRound(), send(), draftKey(), readDraft(), saveDraft(), QuestionRound(), nextQuestion() (+10 more)

### Community 67 - "ControlStore"
Cohesion: 0.16
Nodes (6): DailyCTO, dailyReviewPrompt(), Briefing, saveReviewBriefing(), ControlStore, DailyCTOReport

### Community 68 - "coordination-tick.ts"
Cohesion: 0.18
Nodes (10): BrainFollowup, brainCheckpointCompletion(), reconcileCompletedCheckpoints(), legacy, reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION (+2 more)

### Community 69 - "work.ts"
Cohesion: 0.11
Nodes (21): BLOCKED_CAUSES, blockedCauses(), projectReadiness(), ProjectReadiness, HistoryRetirement, HistoryRetirementIntent, AssignmentResult, BlockedCause (+13 more)

### Community 70 - "constellation-runtime.ts"
Cohesion: 0.09
Nodes (22): CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point, ConstellationView, ConstellationRuntime (+14 more)

### Community 71 - "Store"
Cohesion: 0.05
Nodes (26): correlatedBuild(), checkMail(), drainMail(), requestMail(), ingest(), Execute, GitHubFeaturePublisher, JiraFeaturePublisher (+18 more)

### Community 72 - "saved-candidate-admission.ts"
Cohesion: 0.16
Nodes (20): advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat(), candidateInput(), children, oldAdoptionBasis() (+12 more)

### Community 73 - "WorkTime"
Cohesion: 0.16
Nodes (19): telemetryRoute(), ConfirmedSegment, LiveAnchor, ObservationGap, SnapshotOrdering, TimeLedgerState, Acc, bump() (+11 more)

### Community 74 - "Agents"
Cohesion: 0.22
Nodes (4): knowledgeChatPrompt(), goalReportContext(), Agents, WorkerRuntime

### Community 75 - "admit-improvement.ts"
Cohesion: 0.33
Nodes (9): admitImprovement(), improvementEligible(), improvementManifest(), improvementMarker(), improvementProvider(), linkedRepairGap(), queueImprovements(), retryDelay() (+1 more)

### Community 76 - "shared.ts"
Cohesion: 0.08
Nodes (24): completedPRReviews(), eligible(), mergedByOwner(), ownerSettles(), retireExternalDeliveries(), settledExternalRepair(), PackedPublicationRepair, OfficeQAReport (+16 more)

### Community 77 - "JiraIssuePublisher"
Cohesion: 0.24
Nodes (5): JiraIssuePublisher, keyOf(), descriptionPreimage(), plain(), publicationDescription()

### Community 78 - "GitHubIssuePublisher"
Cohesion: 0.16
Nodes (10): FeaturePublisher, PublicationReceipt, Assign, Board, Content, GitHubIssuePublisher, number(), same() (+2 more)

### Community 79 - "harness-baseline.ts"
Cohesion: 0.15
Nodes (23): BaselineReport, baselineReport(), BaselineSource, baselineText(), millions(), row(), share(), add() (+15 more)

### Community 80 - "control-store.ts"
Cohesion: 0.20
Nodes (8): Clock, applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, statementCache(), initialSnapshot(), initializeStoreSchema()

### Community 81 - "retrospective-subject.ts"
Cohesion: 0.19
Nodes (15): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+7 more)

### Community 82 - "cli.ts"
Cohesion: 0.14
Nodes (9): args, [cmd,...rawArgs], commands, key, projectIndex, LessonBrainAudit, lessonBrainAudit(), LessonBrainOverlap (+1 more)

### Community 83 - "local-config.ts"
Cohesion: 0.20
Nodes (16): IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), intakeMembership(), projectListScope(), AUTO_ADOPT_BOTS, assertFeaturePlanningConfig() (+8 more)

### Community 84 - "blocker-followups.ts"
Cohesion: 0.40
Nodes (8): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), readBackConversations(), diagnosticSnapshot(), nativeDeliveryResolved(), handoff(), reconcileBlockerFollowups()

### Community 85 - "ledger.ts"
Cohesion: 0.14
Nodes (21): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_FIX_PROMPT, OfficeFixResult (+13 more)

### Community 86 - "ledger.ts"
Cohesion: 0.19
Nodes (18): projectSlackDeliveries(), supersedeSlackDelivery(), replacementContext(), slackFingerprint(), slackRequestSettled(), supersedingDelivery(), investigationCandidates(), investigationId() (+10 more)

### Community 87 - "node-visuals.ts"
Cohesion: 0.20
Nodes (14): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+6 more)

### Community 88 - "tracking-issue.ts"
Cohesion: 0.17
Nodes (19): readBackOrThrow(), retryRead(), ensureTrackingIssue(), findTrackingIssue(), ownTracking(), TrackingIssue, trackingIssueBody(), trackingIssueTitle() (+11 more)

### Community 89 - "lesson-selection.ts"
Cohesion: 0.15
Nodes (19): lessonForProject(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), lessonText(), MAINTENANCE (+11 more)

### Community 90 - "preferences-store.ts"
Cohesion: 0.17
Nodes (10): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS (+2 more)

### Community 91 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 92 - "jira-operations.ts"
Cohesion: 0.20
Nodes (12): CommentPage, commentReadback(), Assignment, Content, jiraText(), Transition, JiraOperations, plain() (+4 more)

### Community 93 - "learning-events.ts"
Cohesion: 0.26
Nodes (12): distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementIntakeGate(), captureLearning(), learningDigest(), recordLearningOpportunity() (+4 more)

### Community 94 - "api-routes.ts"
Cohesion: 0.22
Nodes (15): implementationContinuationRoute(), qaPlanRetryRoute(), knowledgeRoute(), goalHistory(), saveGoal(), apiRoute(), RequestContext, fileResponse() (+7 more)

### Community 96 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (7): CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility, overlayEntranceDelays(), SceneOverlay()

### Community 97 - "Outbox.tsx"
Cohesion: 0.12
Nodes (26): Conversation(), SendMessage, LessonDecisionAction, lessonDecisionState(), readLessonDecision(), OutboxLessonDecision(), act(), readStatus() (+18 more)

### Community 98 - "useOfficePreferences.ts"
Cohesion: 0.26
Nodes (10): acceptPreferences(), PreferenceCandidate, strip(), UNKNOWN_PREFERENCES, OfficePreferencesController, PreferenceFeedback, PreferenceField, requestPreferences() (+2 more)

### Community 99 - "fact-bounds.ts"
Cohesion: 0.20
Nodes (17): leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance() (+9 more)

### Community 100 - "coordination.ts"
Cohesion: 0.16
Nodes (18): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation(), checkpointWindow(), dueAt() (+10 more)

### Community 101 - "it-specialist.ts"
Cohesion: 0.11
Nodes (19): ITContext, publishITReport(), delays, recoverAttempt(), listenerHealth(), providers, ProviderStatusChecks, summary (+11 more)

### Community 102 - "retire-history.ts"
Cohesion: 0.53
Nodes (5): readHistoryScope(), historicalRecordDigest(), Intent, records(), retireIncompleteHistory()

### Community 103 - "scope-repair-resume.ts"
Cohesion: 0.15
Nodes (26): Assessment, outsideScanSources(), Ownership, reconcileScopeRepairReadback(), requireThat(), sha, assertScopeRepairResumeFindings(), certain() (+18 more)

### Community 104 - "Ticket"
Cohesion: 0.18
Nodes (13): implementationWorkerContext(), cecPrompt(), resolvedDecisionNote(), stageInstructions, reviewedPlanGuidance, reviewedPlanGuideDigest, isQAStage(), legacyQA() (+5 more)

### Community 105 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 106 - ".activeClaims"
Cohesion: 0.22
Nodes (14): deliveryIntakeBlocker(), boardPreflightCandidate(), savedActivationFailure(), stoppedBaseUpdateCandidate(), recoverBoardPreflights(), runDeliveryRecoveries(), recoverStoppedBaseUpdates(), nativeDeliveryReadbackCandidate() (+6 more)

### Community 107 - ".api"
Cohesion: 0.25
Nodes (14): harnessCloseout(), PASSING, verifyMergeActions(), withHarnessWork(), runHarnessStage(), harnessStageResult(), receipt(), Check (+6 more)

### Community 108 - "knowledge-views.ts"
Cohesion: 0.27
Nodes (10): knowledgeActivity(), knowledgeActivityPage(), knowledgeSnapshot(), bounded(), committedKnowledgeMap(), knowledgeMap(), KnowledgeActivity, KnowledgeActivityPage (+2 more)

### Community 109 - "candidate.ts"
Cohesion: 0.08
Nodes (30): file, folder, logs, root, GitRead, nativeGitRead(), patchArgs, savedImplementation() (+22 more)

### Community 110 - "brain-audit-reuse.ts"
Cohesion: 0.20
Nodes (13): bindBrainAuditEffects(), Effect, Known, assertPriorBrainAudit(), brainAuditRetryFingerprint(), Context, jsonAfter(), nativeSessionPath() (+5 more)

### Community 111 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 112 - "model-routes.ts"
Cohesion: 0.18
Nodes (12): CODEX_DEFAULT_EFFORT, CODEX_DEFAULT_MODEL, CODEX_EFFORTS, CODEX_ROLES, ModelRoute, qaPolicyRoute(), resolveModelRoute(), validModelSetting() (+4 more)

### Community 114 - "github-context.ts"
Cohesion: 0.30
Nodes (8): reviewInstructions(), deliveryTask(), DeliveryTaskInput, DISCOVERY_GUIDANCE, compactSteps(), deliveryHumanInputs(), deliveryResearchContext(), deliveryResearchSha256()

### Community 115 - "cost-totals.ts"
Cohesion: 0.29
Nodes (9): isModelWork(), isTicketModelWork(), ScopePolicy, awaitingEvidence(), CaptureContext, inCostWindow(), TicketCost, ticketCosts() (+1 more)

### Community 116 - "stopped-base-provider.ts"
Cohesion: 0.38
Nodes (8): pinCourier, pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), discussion(), pages(), pullIdentity(), readStoppedBaseProviderContext(), reviewThreads()

### Community 117 - "Role"
Cohesion: 0.27
Nodes (6): assignmentDiagnostics(), diagnosticContext(), DeliverySlot, recommendedReply(), Role, deferredPickup()

### Community 118 - ".now"
Cohesion: 0.20
Nodes (4): checkpointMeasurement(), HEARTBEAT_GAP_MS, HEARTBEAT_MS, WorkOutcome

### Community 119 - "accepted.ts"
Cohesion: 0.62
Nodes (5): citations(), recordAcceptedKnowledge(), stageName(), knowledgeCitation(), lessonCitation()

### Community 121 - "qa-results.ts"
Cohesion: 0.60
Nodes (3): qaResultChanges(), QA_STAGES, qaResults()

### Community 122 - "stopped-reason.ts"
Cohesion: 0.67
Nodes (3): explanation(), LABELS, stoppedReason()

## Knowledge Gaps
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `workKey`, `digest`, `dependency-bots/adopt.ts`, `accept-stage-result.ts`, `github-delivery.ts`, `session-bridge.ts`, `agents.ts`, `ref_node_path`, `source-amendment-scope.ts`, `App.tsx`, `features/workflow.ts`, `scheduled-captures.ts`, `run-retrospective.ts`, `record-trigger.ts`, `worker-runtime.ts`, `requests.ts`, `featureById`, `harnessDelivers`, `knowledge.ts`, `maintenance/maintenance.ts`, `office-lessons.ts`, `artifact`, `coordination.ts`, `packed165-admission.ts`, `digest`, `conversations/conversations.ts`, `CEC`, `cost-ledger.ts`, `run-accounting.ts`, `Store`, `.getEffect`, `verifyRepairCandidate`, `time-scope.ts`, `harnessEffect`, `.save`, `scheduled-work.ts`, `activation-recovery.ts`, `features/commands.ts`, `pilot-delivery.ts`, `demand-facts.ts`, `.emit`, `notifications.ts`, `cec/workflow.ts`, `ref_zod`, `weekly-rollup.ts`, `scheduler.ts`, `process.ts`, `continue-unsealed-qa.ts`, `harnessEffect`, `ticket-evidence.ts`, `ref_zod`, `coordination-tick.ts`, `saved-candidate-admission.ts`, `WorkTime`, `admit-improvement.ts`, `shared.ts`, `GitHubIssuePublisher`, `control-store.ts`, `retrospective-subject.ts`, `blocker-followups.ts`, `ledger.ts`, `ledger.ts`, `tracking-issue.ts`, `lesson-selection.ts`, `jira-operations.ts`, `learning-events.ts`, `api-routes.ts`, `fact-bounds.ts`, `coordination.ts`, `it-specialist.ts`, `retire-history.ts`, `scope-repair-resume.ts`, `Ticket`, `.activeClaims`, `candidate.ts`, `brain-audit-reuse.ts`, `github-context.ts`, `stopped-base-provider.ts`, `Role`, `.now`, `accepted.ts`, `QuestionNotifications`?**
  _High betweenness centrality (0.106) - this node is a cross-community bridge._
- **Should `workKey` be split into smaller, more focused modules?**
  _Cohesion score 0.103954802259887 - nodes in this community are weakly interconnected._
- **Why does `OfficeSnapshot` connect `App.tsx` to `Inspector.tsx`, `ref_react`, `ref_node_path`, `record-trigger.ts`, `outbox.ts`, `PeoplePanel.tsx`, `maintenance/maintenance.ts`, `index.tsx`, `conversations/conversations.ts`, `CEC`, `OfficeScene.tsx`, `assignment-poll.ts`, `cec/workflow.ts`, `TimeBook.tsx`, `Goals.tsx`, `work.ts`, `Store`, `shared.ts`, `harness-baseline.ts`, `cli.ts`, `ledger.ts`, `scene-motion.ts`, `api-routes.ts`, `Outbox.tsx`, `useOfficePreferences.ts`, `fact-bounds.ts`, `it-specialist.ts`, `Role`, `qa-results.ts`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Should `digest` be split into smaller, more focused modules?**
  _Cohesion score 0.09317051108095885 - nodes in this community are weakly interconnected._
- **Why does `GitHubDelivery` connect `github-delivery.ts` to `workKey`, `digest`, `accept-stage-result.ts`, `ref_node_path`, `source-amendment-scope.ts`, `requests.ts`, `artifact`, `coordination.ts`, `packed165-admission.ts`, `digest`, `conversations/conversations.ts`, `queue-repairs.ts`, `.getEffect`, `verifyRepairCandidate`, `harnessEffect`, `activation-recovery.ts`, `assignment-poll.ts`, `notifications.ts`, `Store`, `saved-candidate-admission.ts`, `shared.ts`, `scope-repair-resume.ts`, `.api`, `stopped-base-provider.ts`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Should `accept-stage-result.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10218579234972677 - nodes in this community are weakly interconnected._
- **Should `Inspector.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10362047440699126 - nodes in this community are weakly interconnected._