# Graph Report - office-outbox-followup-nov12  (2026-11-12)

## Corpus Check
- 739 files · ~304,619 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3690 nodes · 16517 edges · 115 communities (110 shown, 5 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 89 edges (avg confidence: 0.74)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `570ecc6d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- index.tsx
- run-accounting.ts
- source-amendment.ts
- OfficeScene.tsx
- App.tsx
- workKey
- constellation-runtime.ts
- worker-runtime.ts
- queue-repairs.ts
- scope-repair-resume.ts
- github-delivery.ts
- cec/workflow.ts
- session-bridge.ts
- Store
- digest
- scheduled-captures.ts
- admission.ts
- cost-ledger.ts
- readback-evidence.ts
- daily-cto.ts
- agents.ts
- TimeBook.tsx
- publish-pr.ts
- packed165-admission.ts
- metadata-context.ts
- liveReach
- process.ts
- artifact
- index.ts
- run.ts
- Library.tsx
- sanitize
- record-trigger.ts
- PeoplePanel.tsx
- ticket-evidence.ts
- MapView.tsx
- remove-candidate.ts
- QuestionStepper.tsx
- adopted-review-candidate.ts
- engine.ts
- offices.ts
- assignment-poll.ts
- knowledge.ts
- TicketJob
- run-retrospective.ts
- work-summary.ts
- dependency-bots/adopt.ts
- time-scope.ts
- outbox.ts
- weekly-rollup.ts
- Engine
- Offices
- telemetry.ts
- stopped-base-context.ts
- accept-stage-result.ts
- it-specialist.ts
- GitHubIssuePublisher
- github/issue-publication.ts
- activation-recovery.ts
- cec/issue-publication.ts
- .emit
- park-ticket.ts
- assignments.ts
- jira-time.ts
- shared.ts
- requests.ts
- config.ts
- .getEffect
- scheduler.ts
- Coordinator
- scheduled-work.ts
- task-briefing.ts
- store.ts
- record-push.ts
- retire-external-delivery.ts
- learning-events.ts
- checkpoint-completion.ts
- azure.ts
- currentAssignment
- reader.ts
- retrospective-subject.ts
- github-readiness.ts
- tracking-issue.ts
- evidence.ts
- fact-bounds.ts
- lesson-selection.ts
- work.ts
- coordination.ts
- cost-entries.ts
- useOfficePreferences.ts
- report.ts
- knowledgeSnapshot
- StageResult
- conversations/slack.ts
- command-registry.ts
- LearningSubject
- brain-audit-reuse.ts
- DailyCTO.tsx
- .value
- extract-worker.mjs
- WorkTime
- coordination-tick.ts
- QuestionDialogHost.tsx
- slack-supersession.ts
- helper-evidence.py
- packed-publication-repair.ts
- codex-rollout.ts
- packed165-candidate.ts
- accepted.ts
- read-retries.ts
- QuestionNotifications
- GitHubMonitor
- BrainFollowup
- run-evidence.ts

## God Nodes (most connected - your core abstractions)
1. `Store` - 340 edges
2. `TicketJob` - 174 edges
3. `digest()` - 152 edges
4. `GitHubDelivery` - 149 edges
5. `artifact()` - 129 edges
6. `command()` - 109 edges
7. `workKey()` - 99 edges
8. `cx()` - 83 edges
9. `currentAssignment()` - 80 edges
10. `OfficeSnapshot` - 73 edges

## Surprising Connections (you probably didn't know these)
- `readAzurePRs()` --indirect_call--> `row()`  [INFERRED]
  server/cec/observed-prs.ts → src/telemetry/report.ts
- `rows()` --indirect_call--> `row()`  [INFERRED]
  server/delivery/recovery/source-amendment/source-amendment-held.ts → src/telemetry/report.ts
- `proveOutsideAmendmentUnchanged()` --indirect_call--> `row()`  [INFERRED]
  server/delivery/recovery/source-amendment/source-amendment-held.ts → src/telemetry/report.ts
- `rows()` --indirect_call--> `row()`  [INFERRED]
  server/delivery/recovery/source-amendment/source-amendment-scope.ts → src/telemetry/report.ts
- `readStoppedBaseProviderContext()` --indirect_call--> `row()`  [INFERRED]
  server/delivery/recovery/stopped-base-provider.ts → src/telemetry/report.ts

## Import Cycles
- 3-file cycle: `src/knowledge/map/Constellation.tsx -> src/knowledge/map/constellation-runtime.ts -> src/knowledge/map/node-visuals.ts -> src/knowledge/map/Constellation.tsx`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/stage-reconciliation.ts -> server/delivery/recovery/implementation/continuation-review-readback.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/preparation/post-conflict-preparation.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/stopped-base-review.ts -> server/delivery/recovery/stopped-base-checkout.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/parking/resume-provider-review.ts -> server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/parking/resume-provider-review.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/recovery/packed165-draft-link.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/recovery/retire-external-delivery.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/stage-prompts.ts -> server/delivery/publication/metadata-admission.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/stage-prompts.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/publication/metadata-review.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/implementation/activation-recovery.ts -> server/delivery/recovery/validation/validation-provider-context.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/implementation/continuation-guard.ts -> server/delivery/recovery/validation/validation-provider-context.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/implementation/saved-prerequisite-handoff.ts -> server/delivery/recovery/validation/validation-provider-context.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/preparation/post-conflict-preparation.ts -> server/delivery/recovery/preparation/preparation-provider-context.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/preparation/post-conflict-preparation.ts -> server/delivery/recovery/validation/validation-provider-context.ts -> server/delivery/pipeline/github-delivery.ts`

## Communities (115 total, 5 thin omitted)

### Community 0 - "index.tsx"
Cohesion: 0.06
Nodes (86): Outbox(), SendMessage, slackMessageStatus(), SlackDeliveryCard(), currentServices(), ServiceHealthPanel(), labels, ServiceHealthRow() (+78 more)

### Community 1 - "run-accounting.ts"
Cohesion: 0.12
Nodes (31): BoundedRead, done(), readBoundedNoFollow(), reasonOf(), backfillClaudeCost(), CompletionReader, codexHome(), createdAt() (+23 more)

### Community 2 - "source-amendment.ts"
Cohesion: 0.06
Nodes (69): DeliveryTaskInput, DISCOVERY_GUIDANCE, adoptCandidate(), reported, Scope, approvedText(), assert(), AMENDMENT_REVIEW_PROOF (+61 more)

### Community 3 - "OfficeScene.tsx"
Cohesion: 0.06
Nodes (60): itAgent(), itDiagnostics(), displayAgentTask(), withoutElapsed(), CameraBookmark, restoreBookmark(), LiveAgentTask(), Props (+52 more)

### Community 4 - "App.tsx"
Cohesion: 0.06
Nodes (43): BrainDrawer(), BrainWorkspace, CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants, ElevatorPhase, floorVariants (+35 more)

### Community 5 - "workKey"
Cohesion: 0.11
Nodes (40): recordJobApproach(), PrerequisitesSchema, continuationScope(), continuationWorktree(), Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate() (+32 more)

### Community 6 - "constellation-runtime.ts"
Cohesion: 0.07
Nodes (42): KnowledgeEdge, KnowledgeMap, KnowledgeNode, CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance (+34 more)

### Community 7 - "worker-runtime.ts"
Cohesion: 0.08
Nodes (32): candidateWorkspaceEnvironment(), assignmentSubject(), dispatchExposure(), prepareExposure(), LessonSelection, catalogLine(), assertBriefingScope(), taskBriefing() (+24 more)

### Community 8 - "queue-repairs.ts"
Cohesion: 0.13
Nodes (30): checksFailed(), checksPassed(), checksPending(), CurrentChecksWait, currentMergeChecks(), pass(), pending(), requireThat() (+22 more)

### Community 9 - "scope-repair-resume.ts"
Cohesion: 0.16
Nodes (31): containedFile(), Assessment, outsideScanSources(), Ownership, reconcileScopeRepairReadback(), requireThat(), scopeRepairReadbackCandidate(), scopeRepairRequestResolved() (+23 more)

### Community 10 - "github-delivery.ts"
Cohesion: 0.10
Nodes (37): parksInJira(), findingsBlock(), assertDeliveryMayMutate(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery(), BOARD_RULE (+29 more)

### Community 11 - "cec/workflow.ts"
Cohesion: 0.05
Nodes (68): applyIntakeObservation(), checkMail(), drainMail(), requestMail(), MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), run() (+60 more)

### Community 12 - "session-bridge.ts"
Cohesion: 0.07
Nodes (43): claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexDaemonProcesses(), accountCodexProcesses(), codexProcessInventory, DesktopSessions (+35 more)

### Community 13 - "Store"
Cohesion: 0.10
Nodes (15): Clock, systemClock, applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, statementCache(), initialSnapshot() (+7 more)

### Community 14 - "digest"
Cohesion: 0.10
Nodes (52): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+44 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.15
Nodes (45): createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest, captureRequests() (+37 more)

### Community 16 - "admission.ts"
Cohesion: 0.24
Nodes (15): Admission, admit(), IntakeContext, compatible(), dependencyCompletionKey(), dependencyEligibility(), DependencyStores, issueKey() (+7 more)

### Community 17 - "cost-ledger.ts"
Cohesion: 0.18
Nodes (23): costLedger(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress(), effectId(), OutsideEdit, publishCost() (+15 more)

### Community 18 - "readback-evidence.ts"
Cohesion: 0.07
Nodes (65): advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat(), assertPostConflictFiles(), assertPostConflictOwnership(), readPostConflictPreparationFacts() (+57 more)

### Community 19 - "daily-cto.ts"
Cohesion: 0.09
Nodes (24): DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), dailyReviewDate(), reviewWeekday(), queueGoalEvidenceRequest(), applyGoalReview() (+16 more)

### Community 20 - "agents.ts"
Cohesion: 0.07
Nodes (41): cecPrompt(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), resolvedDecisionNote(), stageInstructions, cecChatPrompt() (+33 more)

### Community 21 - "TimeBook.tsx"
Cohesion: 0.12
Nodes (27): TelemetryReport, AzureBuild, tokens(), usd(), KpiTiles(), command(), ScopeCorrection(), ScopePreview (+19 more)

### Community 22 - "publish-pr.ts"
Cohesion: 0.13
Nodes (25): harnessEffect, retryRead(), draftReadHeadMatches(), assertDraftClaimHistory(), linkDraftIssue(), protectedOriginalClaim(), commitlintRejection(), developerPRContent() (+17 more)

### Community 23 - "packed165-admission.ts"
Cohesion: 0.30
Nodes (14): requireDeliveryAuthority(), admitPacked165(), history(), packed165CandidateIdentity(), packed165Subject(), retainedPacked165Effect(), assertPacked165Original(), enqueuePacked165() (+6 more)

### Community 24 - "metadata-context.ts"
Cohesion: 0.14
Nodes (36): activeEffectId(), admitPRMetadata(), METADATA_FINDING, assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema, savedMetadataAssessment() (+28 more)

### Community 25 - "liveReach"
Cohesion: 0.60
Nodes (5): GIT_NETWORK, LIVE_PROVIDERS, liveReach(), networkUrl(), remoteUrls()

### Community 26 - "process.ts"
Cohesion: 0.05
Nodes (76): approveFeature(), featureById(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), discoveryPrompt(), planPrompt() (+68 more)

### Community 27 - "artifact"
Cohesion: 0.10
Nodes (43): admitGreen156(), enqueueGreen156(), GREEN156, green156Subject(), retainedGreen156Audit(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved() (+35 more)

### Community 28 - "index.ts"
Cohesion: 0.09
Nodes (36): assertQuestionVisibility(), close(), config, itSpecialist, loadedRevision, offices, releaseLock, server (+28 more)

### Community 29 - "run.ts"
Cohesion: 0.16
Nodes (22): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationCandidates(), investigationId(), investigationFollowUps(), investigationResolution(), syncInvestigations(), OFFICE_FIX_PROMPT (+14 more)

### Community 30 - "Library.tsx"
Cohesion: 0.10
Nodes (28): KnowledgeActivity, Activity(), ActivityTimeline(), AssignmentKnowledge(), DocumentMetadata, documentText(), KnowledgeDocumentText, DocumentPreview() (+20 more)

### Community 31 - "sanitize"
Cohesion: 0.08
Nodes (35): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+27 more)

### Community 32 - "record-trigger.ts"
Cohesion: 0.16
Nodes (24): baselineLearning(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences(), clip(), JobLike, recordCIBudget() (+16 more)

### Community 33 - "PeoplePanel.tsx"
Cohesion: 0.10
Nodes (40): label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+32 more)

### Community 34 - "ticket-evidence.ts"
Cohesion: 0.08
Nodes (41): CommentPage, commentReadback(), JiraOperations, plain(), unpack(), jiraRecord(), ghLogCacheEvidence(), assetDownloader() (+33 more)

### Community 35 - "MapView.tsx"
Cohesion: 0.14
Nodes (29): filterNames, initial, SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), loadOfficeConfig(), OfficeConfigSection() (+21 more)

### Community 36 - "remove-candidate.ts"
Cohesion: 0.18
Nodes (18): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot() (+10 more)

### Community 37 - "QuestionStepper.tsx"
Cohesion: 0.19
Nodes (16): normalizeRound(), FeatureHarnessOption, FeatureOption, FeatureQuestion, FeatureRound, FeatureRoundAuthor, draftKey(), readDraft() (+8 more)

### Community 38 - "adopted-review-candidate.ts"
Cohesion: 0.21
Nodes (16): removeAdoptedClone(), stoppedBaseCheckout(), assertStoppedBaseApproach(), stoppedBaseNextStage(), adoptedReviewCandidate(), ciCheckout(), finishCISetup(), verifyCIHooks() (+8 more)

### Community 39 - "engine.ts"
Cohesion: 0.19
Nodes (22): dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), resume(), startPilot(), eligibility(), assertFeatureGate() (+14 more)

### Community 40 - "offices.ts"
Cohesion: 0.11
Nodes (44): commandFeature(), reviewQuestions(), featureItemComplete(), reconcileFeatureCompletion(), FeatureCommandSchema, helperTelemetry(), reserveReplacement(), stageBudget() (+36 more)

### Community 41 - "assignment-poll.ts"
Cohesion: 0.16
Nodes (19): clamp(), LIMITS, MergedPR, plainSlackText(), section(), shippedSummary(), configureNotices(), Identity (+11 more)

### Community 42 - "knowledge.ts"
Cohesion: 0.08
Nodes (37): normalizeStatement(), decideOfficeProposal(), now(), OfficeKnowledgeStore, proposeOfficeLessons(), retireOfficeLesson(), Input, promoteNoteLesson() (+29 more)

### Community 43 - "TicketJob"
Cohesion: 0.08
Nodes (16): dependabotReviewGuidance(), StageContext, deliveryTask(), GitHubDelivery, stagePrompt(), StagePromptInput, ROLES, stageRole() (+8 more)

### Community 44 - "run-retrospective.ts"
Cohesion: 0.10
Nodes (38): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, blockingTrigger, isBlocking(), curateLesson() (+30 more)

### Community 45 - "work-summary.ts"
Cohesion: 0.14
Nodes (26): compactSteps(), themeColor, App(), usePanelFocus(), TicketDetail(), deliveryRepairProjection(), InboxQueue(), ACTIVE (+18 more)

### Community 46 - "dependency-bots/adopt.ts"
Cohesion: 0.15
Nodes (25): Execute, adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR, openDependabotPulls() (+17 more)

### Community 47 - "time-scope.ts"
Cohesion: 0.27
Nodes (17): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), scopeSelector(), ticketDayTotals(), captureTime(), timeLedger(), artifact(), correctRecoveryClassification() (+9 more)

### Community 48 - "outbox.ts"
Cohesion: 0.13
Nodes (26): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), projectOutbox(), syncOutbox(), slackRequestSettled(), readBackConversations() (+18 more)

### Community 49 - "weekly-rollup.ts"
Cohesion: 0.11
Nodes (29): learningMetrics(), RollupResult, RollupResultSchema, harperFolder(), KnowledgeRunner, RETROSPECTIVE_TIMEOUT, retryDelay(), mirror() (+21 more)

### Community 50 - "Engine"
Cohesion: 0.08
Nodes (7): correlatedBuild(), channelNoticeAuthorized(), MergeNotifications, Engine, observe(), observeParked(), parkedReadError

### Community 51 - "Offices"
Cohesion: 0.21
Nodes (3): seedOfficeLessons(), Offices, markCaptureStart()

### Community 52 - "telemetry.ts"
Cohesion: 0.09
Nodes (28): CodexRollout, CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL (+20 more)

### Community 53 - "stopped-base-context.ts"
Cohesion: 0.10
Nodes (25): pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), assertStoppedBaseCurrent(), originalVersion(), readStoppedBaseContext(), retainedJob(), contentTypes, readStoppedClaudeNative() (+17 more)

### Community 54 - "accept-stage-result.ts"
Cohesion: 0.14
Nodes (30): acceptStageResult(), mergeAuthorized(), allowed, continuationNativeReview(), continuationReviewArtifacts(), continuationWorkerProof(), negativeWorker(), savedNegativeContinuationReview() (+22 more)

### Community 55 - "it-specialist.ts"
Cohesion: 0.20
Nodes (12): ITContext, publishITReport(), delays, recoverAttempt(), ServiceHealthChecks, itFollowUpView(), sessionVisibilityCopy(), date() (+4 more)

### Community 56 - "GitHubIssuePublisher"
Cohesion: 0.27
Nodes (5): Assign, Board, GitHubIssuePublisher, number(), same()

### Community 57 - "github/issue-publication.ts"
Cohesion: 0.19
Nodes (25): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), ProjectCard, projectCards(), projectGraphql() (+17 more)

### Community 58 - "activation-recovery.ts"
Cohesion: 0.21
Nodes (26): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+18 more)

### Community 59 - "cec/issue-publication.ts"
Cohesion: 0.13
Nodes (15): Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), Transition, descriptionPreimage(), plain() (+7 more)

### Community 60 - ".emit"
Cohesion: 0.22
Nodes (15): ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), retryRecipientLookup(), configureKnowledge(), declineLessonIssue(), reactivateLesson() (+7 more)

### Community 61 - "park-ticket.ts"
Cohesion: 0.25
Nodes (22): BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue(), readIssues(), commentDecision() (+14 more)

### Community 62 - "assignments.ts"
Cohesion: 0.21
Nodes (11): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), KnowledgeContext, AssignmentLookups, Binding, lookupInstructions(), referenceVisible() (+3 more)

### Community 63 - "jira-time.ts"
Cohesion: 0.19
Nodes (15): expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), easternDay(), data() (+7 more)

### Community 64 - "shared.ts"
Cohesion: 0.05
Nodes (51): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ProjectReadiness, DailyCTOSummary (+43 more)

### Community 65 - "requests.ts"
Cohesion: 0.19
Nodes (22): deliveryIntakeBlocker(), boardPreflightCandidate(), reconcileBoardPreflight(), savedActivationFailure(), hasSavedPrerequisiteResult(), beginPacked165Setup(), packed165SetupReady(), completedConflictDraftCandidate() (+14 more)

### Community 66 - "config.ts"
Cohesion: 0.11
Nodes (22): args, [cmd,...rawArgs], commands, key, projectIndex, AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), FeaturePlanningBindings (+14 more)

### Community 67 - ".getEffect"
Cohesion: 0.12
Nodes (18): featureEffectGate(), GitHubOperations, admitImprovement(), improvementEligible(), improvementManifest(), improvementMarker(), improvementProvider(), linkedRepairGap() (+10 more)

### Community 68 - "scheduler.ts"
Cohesion: 0.18
Nodes (11): fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch(), deliveryOccupied(), foreignWork() (+3 more)

### Community 69 - "Coordinator"
Cohesion: 0.08
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 70 - "scheduled-work.ts"
Cohesion: 0.15
Nodes (18): deliverySlot(), closeoutRequestResolved(), metadataRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), requestPriority(), deterministicActions (+10 more)

### Community 71 - "task-briefing.ts"
Cohesion: 0.38
Nodes (7): guidanceExcerpt(), officeSearch(), retrieve(), words(), EvidenceSelection, KnowledgeHit, KnowledgeSearch

### Community 72 - "store.ts"
Cohesion: 0.11
Nodes (19): diagnosticContext(), diagnosticSnapshot(), nativeDeliveryResolved(), GoalInput, file, project, root, DeliverySlot (+11 more)

### Community 73 - "record-push.ts"
Cohesion: 0.14
Nodes (16): Event, one(), prePushRejection(), PushIdentity, Candidate, recordedPush(), settledPushBoundary(), At (+8 more)

### Community 74 - "retire-external-delivery.ts"
Cohesion: 0.44
Nodes (6): completedPRReviews(), eligible(), mergedByOwner(), ownerSettles(), retireExternalDeliveries(), settledExternalRepair()

### Community 75 - "learning-events.ts"
Cohesion: 0.16
Nodes (19): distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementIntakeGate(), captureLearning(), learningDigest(), recordLearningOpportunity() (+11 more)

### Community 76 - "checkpoint-completion.ts"
Cohesion: 0.24
Nodes (7): BrainStatusSchema, identity, brainCheckpointCompletion(), coverageSchema, followupSchema, verified, reconcileCompletedCheckpoints()

### Community 77 - "azure.ts"
Cohesion: 0.12
Nodes (24): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+16 more)

### Community 78 - "currentAssignment"
Cohesion: 0.18
Nodes (16): deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, gateRegisteredDelivery(), accounting, DeliverySubject, nonDelivery (+8 more)

### Community 79 - "reader.ts"
Cohesion: 0.13
Nodes (11): committedNotePage(), BrainGraph, BrainNote, BrainReader, CommittedBrain, GraphNode, GraphPage, hash (+3 more)

### Community 80 - "retrospective-subject.ts"
Cohesion: 0.13
Nodes (25): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates() (+17 more)

### Community 81 - "github-readiness.ts"
Cohesion: 0.20
Nodes (22): resume(), resumeProviderReviews(), observe(), assertAutomationEffects(), automationMergePolicy(), observeAutomationMerge(), routeAutomationMerge(), finishLeadReview() (+14 more)

### Community 82 - "tracking-issue.ts"
Cohesion: 0.19
Nodes (17): readBackOrThrow(), ensureTrackingIssue(), findTrackingIssue(), ownTracking(), TrackingIssue, trackingIssueBody(), trackingIssueTitle(), trackingMarker() (+9 more)

### Community 83 - "evidence.ts"
Cohesion: 0.17
Nodes (15): investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, NOTIFY_HELPER, notifyHelperResolution(), OFFICE_SOURCE_PATHS, officeSource() (+7 more)

### Community 84 - "fact-bounds.ts"
Cohesion: 0.26
Nodes (15): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+7 more)

### Community 85 - "lesson-selection.ts"
Cohesion: 0.16
Nodes (18): fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose() (+10 more)

### Community 86 - "work.ts"
Cohesion: 0.14
Nodes (13): AssignmentResult, CompletionCondition, Continuation, DeliveryAdmission, DependencyObservation, EligibilityState, ExecutionLane, FailureCategory (+5 more)

### Community 87 - "coordination.ts"
Cohesion: 0.19
Nodes (17): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation(), checkpointWindow(), dueAt() (+9 more)

### Community 88 - "cost-entries.ts"
Cohesion: 0.20
Nodes (14): isModelWork(), isTicketModelWork(), ScopePolicy, captureCost(), summary(), awaitingEvidence(), CaptureContext, inCostWindow() (+6 more)

### Community 89 - "useOfficePreferences.ts"
Cohesion: 0.11
Nodes (20): PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, acceptPreferences(), PreferenceCandidate, PreferenceState (+12 more)

### Community 90 - "report.ts"
Cohesion: 0.29
Nodes (12): Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked(), row() (+4 more)

### Community 91 - "knowledgeSnapshot"
Cohesion: 0.27
Nodes (10): knowledgeSnapshot(), officeKnowledgeSnapshot(), leadershipContext(), lessonForProject(), bounded(), committedKnowledgeMap(), knowledgeMap(), knowledgeEntries() (+2 more)

### Community 92 - "StageResult"
Cohesion: 0.13
Nodes (27): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+19 more)

### Community 93 - "conversations/slack.ts"
Cohesion: 0.18
Nodes (13): comparableSlackText(), SlackMessages, SlackRequestSchema, SlackResultSchema, SlackVerificationSchema, goalNoticeAuthorized(), goalNoticeNeverDispatched(), sendGoalNotice() (+5 more)

### Community 94 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 95 - "LearningSubject"
Cohesion: 0.15
Nodes (13): decodeLookupJournal(), lookupJournal, KnowledgeAssignment, LearningSubject, LessonExposure, LessonReference, KnowledgeLookupResponse, KnowledgeLookupSummary (+5 more)

### Community 96 - "brain-audit-reuse.ts"
Cohesion: 0.20
Nodes (13): bindBrainAuditEffects(), Effect, Known, assertPriorBrainAudit(), brainAuditRetryFingerprint(), Context, jsonAfter(), nativeSessionPath() (+5 more)

### Community 97 - "DailyCTO.tsx"
Cohesion: 0.26
Nodes (8): CTOReview(), goalState, DailyCTO(), GoalHistory(), reportDate(), reviewStatus, reviewExcerpt(), ReviewText()

### Community 98 - ".value"
Cohesion: 0.24
Nodes (6): file, folder, logs, root, xml(), ProjectProgress

### Community 99 - "extract-worker.mjs"
Cohesion: 0.70
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 100 - "WorkTime"
Cohesion: 0.21
Nodes (12): publishableEntry(), settlementPending(), superseded(), ticketUnresolved(), ConfirmedSegment, LiveAnchor, ObservationGap, SnapshotOrdering (+4 more)

### Community 101 - "coordination-tick.ts"
Cohesion: 0.33
Nodes (7): reconcileNoticeConfirmations(), legacy, reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION, tick()

### Community 102 - "QuestionDialogHost.tsx"
Cohesion: 0.44
Nodes (7): FeatureQuestionProjection, nextQuestion(), orderedQuestions(), questionKey(), QuestionDialogHost(), readSuppressed(), Dialog()

### Community 103 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 107 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 108 - "packed165-candidate.ts"
Cohesion: 0.50
Nodes (5): HarnessControl, makePacked165Candidate(), installPacked165(), packedConsumerPnpmRepair(), sha256()

### Community 109 - "accepted.ts"
Cohesion: 0.62
Nodes (5): citations(), recordAcceptedKnowledge(), stageName(), knowledgeCitation(), lessonCitation()

### Community 110 - "read-retries.ts"
Cohesion: 0.43
Nodes (6): incompleteReadOutput(), IntakeResult, planReadRetry(), reconcileReadRetries(), WorkFailure, ReadRetry

### Community 114 - "run-evidence.ts"
Cohesion: 0.67
Nodes (3): comparable(), EvidenceOutcome, recordRunEvidence()

## Knowledge Gaps
- **421 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+416 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `run-accounting.ts`, `source-amendment.ts`, `workKey`, `worker-runtime.ts`, `scope-repair-resume.ts`, `github-delivery.ts`, `cec/workflow.ts`, `session-bridge.ts`, `digest`, `scheduled-captures.ts`, `admission.ts`, `cost-ledger.ts`, `readback-evidence.ts`, `daily-cto.ts`, `agents.ts`, `publish-pr.ts`, `packed165-admission.ts`, `metadata-context.ts`, `process.ts`, `artifact`, `index.ts`, `run.ts`, `sanitize`, `record-trigger.ts`, `ticket-evidence.ts`, `remove-candidate.ts`, `adopted-review-candidate.ts`, `engine.ts`, `offices.ts`, `assignment-poll.ts`, `knowledge.ts`, `TicketJob`, `run-retrospective.ts`, `dependency-bots/adopt.ts`, `time-scope.ts`, `outbox.ts`, `weekly-rollup.ts`, `Engine`, `Offices`, `stopped-base-context.ts`, `accept-stage-result.ts`, `it-specialist.ts`, `GitHubIssuePublisher`, `github/issue-publication.ts`, `activation-recovery.ts`, `cec/issue-publication.ts`, `.emit`, `park-ticket.ts`, `assignments.ts`, `jira-time.ts`, `shared.ts`, `requests.ts`, `.getEffect`, `scheduler.ts`, `Coordinator`, `scheduled-work.ts`, `store.ts`, `record-push.ts`, `retire-external-delivery.ts`, `learning-events.ts`, `checkpoint-completion.ts`, `azure.ts`, `currentAssignment`, `retrospective-subject.ts`, `github-readiness.ts`, `tracking-issue.ts`, `evidence.ts`, `lesson-selection.ts`, `coordination.ts`, `cost-entries.ts`, `knowledgeSnapshot`, `StageResult`, `conversations/slack.ts`, `LearningSubject`, `brain-audit-reuse.ts`, `.value`, `coordination-tick.ts`, `packed165-candidate.ts`, `accepted.ts`, `read-retries.ts`, `QuestionNotifications`, `GitHubMonitor`, `BrainFollowup`, `run-evidence.ts`?**
  _High betweenness centrality (0.124) - this node is a cross-community bridge._
- **Why does `TicketJob` connect `TicketJob` to `index.tsx`, `source-amendment.ts`, `workKey`, `worker-runtime.ts`, `queue-repairs.ts`, `scope-repair-resume.ts`, `github-delivery.ts`, `cec/workflow.ts`, `digest`, `admission.ts`, `readback-evidence.ts`, `publish-pr.ts`, `packed165-admission.ts`, `metadata-context.ts`, `artifact`, `record-trigger.ts`, `ticket-evidence.ts`, `remove-candidate.ts`, `adopted-review-candidate.ts`, `engine.ts`, `work-summary.ts`, `dependency-bots/adopt.ts`, `stopped-base-context.ts`, `accept-stage-result.ts`, `it-specialist.ts`, `github/issue-publication.ts`, `activation-recovery.ts`, `shared.ts`, `record-push.ts`, `retire-external-delivery.ts`, `currentAssignment`, `retrospective-subject.ts`, `github-readiness.ts`, `tracking-issue.ts`, `fact-bounds.ts`, `work.ts`, `StageResult`, `brain-audit-reuse.ts`, `.value`, `packed165-candidate.ts`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `Role` connect `store.ts` to `index.tsx`, `run-accounting.ts`, `OfficeScene.tsx`, `App.tsx`, `worker-runtime.ts`, `github-delivery.ts`, `cec/workflow.ts`, `Store`, `agents.ts`, `sanitize`, `PeoplePanel.tsx`, `TicketJob`, `outbox.ts`, `accept-stage-result.ts`, `.emit`, `shared.ts`, `config.ts`, `scheduler.ts`, `retrospective-subject.ts`, `github-readiness.ts`, `work.ts`, `StageResult`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _421 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `index.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.055627987831377665 - nodes in this community are weakly interconnected._
- **Should `run-accounting.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11861861861861862 - nodes in this community are weakly interconnected._
- **Should `source-amendment.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06322624743677376 - nodes in this community are weakly interconnected._