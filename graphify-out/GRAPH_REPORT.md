# Graph Report - office-fresh156  (2026-11-11)

## Corpus Check
- 799 files · ~317,902 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3937 nodes · 18145 edges · 97 communities (96 shown, 1 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 110 edges (avg confidence: 0.74)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `aae4d3c4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- artifact
- accept-stage-result.ts
- GitHubDelivery
- Store
- index.tsx
- schedule.ts
- knowledge/routes.ts
- features/workflow.ts
- Button
- App.tsx
- SourceRegistry
- scheduled-captures.ts
- OfficeSnapshot
- mutedCopy
- OfficeScene.tsx
- currentAssignment
- digest
- session-bridge.ts
- source-amendment.ts
- shared.ts
- constellation-runtime.ts
- agents.ts
- retrospective-triggers.ts
- TelemetryPanel.tsx
- github-delivery.ts
- effects.ts
- maintenance/maintenance.ts
- offices.ts
- run-retrospective.ts
- workKey
- source-amendment-scope.ts
- conversations/slack.ts
- reader.ts
- delivery-recoveries.ts
- digest
- office/config.ts
- ticket-evidence.ts
- time-scope.ts
- dependency-bots/adopt.ts
- closeout-recovery.ts
- .emit
- telemetry.ts
- azure.ts
- ticket-stage-runner.ts
- knowledge.ts
- .save
- conversations/conversations.ts
- blocker-followups.ts
- features.ts
- maintenance-facts.ts
- intake/admission.ts
- run-accounting.ts
- .transaction
- worker-runtime.ts
- scheduler.ts
- jira-time.ts
- cec/issue-publication.ts
- work.ts
- http/commands.ts
- cost-entries.ts
- maintenance-readback.ts
- .getEffect
- retrospective-subject.ts
- daily-cto.ts
- DailyCTO.tsx
- diagnostic-context.ts
- remove-candidate.ts
- features/commands.ts
- lessons-view.ts
- Coordinator
- goal-reporting.ts
- read-retries.ts
- investigations/run.ts
- admit-improvement.ts
- record-trigger.ts
- checkpoint-completion.ts
- needsDecision
- coordination.ts
- extraction.ts
- goal-reviews.ts
- assignment-poll.ts
- control-store.ts
- contract.ts
- fact-bounds.ts
- useOfficePreferences.ts
- telemetry/report.ts
- .value
- create-candidate.ts
- codex-rollout.ts
- command-registry.ts
- QuestionDialogHost.tsx
- notifications.ts
- OfficeConfigView.tsx
- extract-worker.mjs
- slack-supersession.ts
- helper-evidence.py

## God Nodes (most connected - your core abstractions)
1. `Store` - 361 edges
2. `TicketJob` - 165 edges
3. `GitHubDelivery` - 144 edges
4. `digest()` - 134 edges
5. `artifact()` - 117 edges
6. `command()` - 109 edges
7. `workKey()` - 97 edges
8. `cx()` - 88 edges
9. `currentAssignment()` - 82 edges
10. `OfficeSnapshot` - 71 edges

## Surprising Connections (you probably didn't know these)
- `readAzurePRs()` --indirect_call--> `row()`  [INFERRED]
  server/cec/observed-prs.ts → src/telemetry/report.ts
- `DeliveryAuthorityInput` --references--> `HarnessRequest`  [EXTRACTED]
  server/delivery/harness/delivery-authority.ts → src/contracts/work.ts
- `rows()` --indirect_call--> `row()`  [INFERRED]
  server/delivery/recovery/source-amendment/source-amendment-held.ts → src/telemetry/report.ts
- `proveOutsideAmendmentUnchanged()` --indirect_call--> `row()`  [INFERRED]
  server/delivery/recovery/source-amendment/source-amendment-held.ts → src/telemetry/report.ts
- `rows()` --indirect_call--> `row()`  [INFERRED]
  server/delivery/recovery/source-amendment/source-amendment-scope.ts → src/telemetry/report.ts

## Import Cycles
- 3-file cycle: `src/knowledge/map/Constellation.tsx -> src/knowledge/map/constellation-runtime.ts -> src/knowledge/map/node-visuals.ts -> src/knowledge/map/Constellation.tsx`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/stage-reconciliation.ts -> server/delivery/recovery/implementation/continuation-review-readback.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/preparation/post-conflict-preparation.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/stopped-base-review.ts -> server/delivery/recovery/stopped-base-checkout.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/parking/resume-provider-review.ts -> server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/parking/resume-provider-review.ts`
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
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/preparation/post-conflict-preparation.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/pipeline/github-delivery.ts`

## Communities (97 total, 1 thin omitted)

### Community 0 - "artifact"
Cohesion: 0.06
Nodes (103): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+95 more)

### Community 1 - "accept-stage-result.ts"
Cohesion: 0.06
Nodes (79): containedFile(), findingsBlock(), handsOff(), acceptStageResult(), acceptConflictRepair(), nextJobStage(), recordJobApproach(), unresolvedVerification() (+71 more)

### Community 2 - "GitHubDelivery"
Cohesion: 0.07
Nodes (51): GitHubDelivery, assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), reconcileCompletedConflictDraft(), routeReadyPostConflictPublication() (+43 more)

### Community 3 - "Store"
Cohesion: 0.04
Nodes (37): correlatedBuild(), applyIntakeObservation(), checkMail(), drainMail(), requestMail(), enableNightly(), ingest(), JiraFeaturePublisher (+29 more)

### Community 4 - "index.tsx"
Cohesion: 0.06
Nodes (72): Conversation(), Outbox(), SendMessage, slackMessageStatus(), SlackDeliveryCard(), labels, ServiceHealthRow(), BlockerFollowups() (+64 more)

### Community 5 - "schedule.ts"
Cohesion: 0.07
Nodes (81): independentIntakeResult(), captureProposal(), effectId(), newTask(), recordObservation(), settlePage(), CaptureReceipt, ChannelProgress (+73 more)

### Community 6 - "knowledge/routes.ts"
Cohesion: 0.07
Nodes (72): intakeActivity(), knowledgeActivity(), knowledgeActivityPage(), uploadArtifact(), assignmentKnowledge(), committedNotePage(), KnowledgeContext, independentDigestEvidence() (+64 more)

### Community 7 - "features/workflow.ts"
Cohesion: 0.07
Nodes (55): approveFeature(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), discoveryPrompt(), planPrompt(), artifactPath(), digest() (+47 more)

### Community 8 - "Button"
Cohesion: 0.07
Nodes (45): guidanceExcerpt(), evidenceTitle(), KnowledgeCapturePage, KnowledgeDigestDelivery, KnowledgeActivityPage, Activity(), ActivityStatus(), AssignmentKnowledge() (+37 more)

### Community 9 - "App.tsx"
Cohesion: 0.05
Nodes (48): BrainDrawer(), themeColor, BrainWorkspace, CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants, ElevatorPhase (+40 more)

### Community 10 - "SourceRegistry"
Cohesion: 0.11
Nodes (26): Config, configDigest(), IntakeConfig, readConfig(), SlackReadAuthority, collectPublicSource(), collectionAllowed(), readAuthority() (+18 more)

### Community 11 - "scheduled-captures.ts"
Cohesion: 0.14
Nodes (48): requestDelivery(), createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest (+40 more)

### Community 12 - "OfficeSnapshot"
Cohesion: 0.08
Nodes (42): compactSteps(), FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures(), TicketPlanningAction() (+34 more)

### Community 13 - "mutedCopy"
Cohesion: 0.10
Nodes (39): KnowledgeCadence, KnowledgeDestination, KnowledgeSourceKind, KnowledgeSourceState, KnowledgeSourceSummary, LessonsPanel(), when(), AddPublicSource() (+31 more)

### Community 14 - "OfficeScene.tsx"
Cohesion: 0.06
Nodes (58): displayAgentTask(), githubStageLabels, withoutElapsed(), CameraBookmark, restoreBookmark(), LiveAgentTask(), Props, RunningTask() (+50 more)

### Community 15 - "currentAssignment"
Cohesion: 0.08
Nodes (62): harnessCloseout(), PASSING, verifyMergeActions(), activeEffectId(), HarnessControl, withHarnessWork(), runHarnessStage(), harnessStageResult() (+54 more)

### Community 16 - "digest"
Cohesion: 0.09
Nodes (46): accounting, DeliverySubject, nonDelivery, originalReads, pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), admitGreen156(), assertStoppedBaseAudit() (+38 more)

### Community 17 - "session-bridge.ts"
Cohesion: 0.09
Nodes (36): claudeSessionContext(), readTranscript, root, claudeSessionScope(), accountCodexProcesses(), codexProcessInventory, DesktopSessions, unaccountedProcesses() (+28 more)

### Community 18 - "source-amendment.ts"
Cohesion: 0.11
Nodes (38): stagePrompt(), StagePromptInput, METADATA_FINDING_GUIDANCE, adoptCandidate(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent() (+30 more)

### Community 19 - "shared.ts"
Cohesion: 0.07
Nodes (54): ProjectReadiness, DailyCTOSummary, Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+46 more)

### Community 20 - "constellation-runtime.ts"
Cohesion: 0.08
Nodes (36): KnowledgeMap, KnowledgeNode, CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point (+28 more)

### Community 21 - "agents.ts"
Cohesion: 0.06
Nodes (44): cecPrompt(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), resolvedDecisionNote(), stageInstructions, cecChatPrompt() (+36 more)

### Community 22 - "retrospective-triggers.ts"
Cohesion: 0.17
Nodes (21): clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates(), maintenanceCompletedId(), visibleMaintenanceTriggerIds(), completedId(), JobRef (+13 more)

### Community 23 - "TelemetryPanel.tsx"
Cohesion: 0.10
Nodes (35): TelemetryReport, AzureBuild, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens(), usd() (+27 more)

### Community 24 - "github-delivery.ts"
Cohesion: 0.06
Nodes (65): removeAdoptedClone(), namedRepairIds(), assertDeliveryMayMutate(), BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction(), dependabotReviewGuidance() (+57 more)

### Community 25 - "effects.ts"
Cohesion: 0.10
Nodes (21): featureById(), GitHubFeaturePublisher, FeaturePublisher, PublicationReceipt, publishFeature(), reconcilePublication(), uncertainPublications(), reserveIdentity() (+13 more)

### Community 26 - "maintenance/maintenance.ts"
Cohesion: 0.11
Nodes (26): maintenancePolicies(), captureLearning(), captureMaintenanceStep(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice() (+18 more)

### Community 27 - "offices.ts"
Cohesion: 0.09
Nodes (22): normalizeStatement(), eventVisible(), leadershipContext(), leadershipEntries(), decideOfficeProposal(), mirrorOfficeKnowledge(), now(), OfficeKnowledgeStore (+14 more)

### Community 28 - "run-retrospective.ts"
Cohesion: 0.06
Nodes (72): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, improvementIntakeGate(), learningDigest(), recordLearningOpportunity(), appendLearningFacts(), learningMetrics() (+64 more)

### Community 29 - "workKey"
Cohesion: 0.08
Nodes (43): completedPRReviews(), continuationScope(), Assessment, diagnosticProof(), discoveryRecoveryCandidate(), ownedArtifact(), Ownership, rawHash() (+35 more)

### Community 30 - "source-amendment-scope.ts"
Cohesion: 0.08
Nodes (39): approvedText(), assert(), assert(), normalize(), officialUrls, ReleaseCapture, verifyReleaseCaptures(), amendmentCaptureObservation() (+31 more)

### Community 31 - "conversations/slack.ts"
Cohesion: 0.12
Nodes (18): channelNoticeAuthorized(), MergeNotifications, SlackMessages, SlackRequestSchema, SlackResultSchema, SlackVerificationSchema, digestNoticeNeverDispatched(), sendDigestNotice() (+10 more)

### Community 32 - "reader.ts"
Cohesion: 0.07
Nodes (26): captureAfter(), CaptureMetadata, capturePage(), cursor(), key(), captureIdentityMatches(), BrainCaptureReceipt, hash (+18 more)

### Community 33 - "delivery-recoveries.ts"
Cohesion: 0.12
Nodes (27): deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, requireDeliveryAuthority(), deliveryIntakeBlocker(), gateRegisteredDelivery(), resolveDeliveryWork() (+19 more)

### Community 34 - "digest"
Cohesion: 0.14
Nodes (27): comparableSlackText(), AuthoredDigest, reconcileDigestAuthorship(), unitAuthorship(), annotateAuthoredUnits(), outboundBody(), retainOutboundBody(), digestNoticeRequest() (+19 more)

### Community 35 - "office/config.ts"
Cohesion: 0.05
Nodes (58): args, [cmd,...rawArgs], commands, key, projectIndex, AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), assertAssessmentVisibility() (+50 more)

### Community 36 - "ticket-evidence.ts"
Cohesion: 0.15
Nodes (26): assetDownloader(), attachmentKind(), evidenceDirectory(), readEvidence(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS (+18 more)

### Community 37 - "time-scope.ts"
Cohesion: 0.18
Nodes (24): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), midnight(), TicketDay (+16 more)

### Community 38 - "dependency-bots/adopt.ts"
Cohesion: 0.07
Nodes (73): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard, projectCards() (+65 more)

### Community 39 - "closeout-recovery.ts"
Cohesion: 0.11
Nodes (44): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+36 more)

### Community 40 - ".emit"
Cohesion: 0.09
Nodes (44): deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), metadataRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), requestPriority() (+36 more)

### Community 41 - "telemetry.ts"
Cohesion: 0.10
Nodes (26): CodexRollout, CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL (+18 more)

### Community 42 - "azure.ts"
Cohesion: 0.20
Nodes (14): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+6 more)

### Community 43 - "ticket-stage-runner.ts"
Cohesion: 0.18
Nodes (25): run(), advance(), nextStage(), publicationEvidenceGap(), qaEvidenceGap(), resultGate(), stageResultGap(), afterDraft() (+17 more)

### Community 44 - "knowledge.ts"
Cohesion: 0.08
Nodes (37): retainedArtifactScope(), eventSourceBindings(), AssignmentLookups, Binding, exposureBindings(), requestSourceBindings(), lookupInstructions(), lookupJournal (+29 more)

### Community 45 - ".save"
Cohesion: 0.24
Nodes (23): BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue(), readIssues(), commentDecision() (+15 more)

### Community 46 - "conversations/conversations.ts"
Cohesion: 0.06
Nodes (46): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+38 more)

### Community 47 - "blocker-followups.ts"
Cohesion: 0.11
Nodes (33): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), partialLocalCleanupKey(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved() (+25 more)

### Community 48 - "features.ts"
Cohesion: 0.10
Nodes (40): dispatchNightly(), drainDelivery(), resume(), startPilot(), eligibility(), featureEffectGate(), assertFeatureGate(), bindFeature() (+32 more)

### Community 49 - "maintenance-facts.ts"
Cohesion: 0.33
Nodes (5): ARTIFACT_LIMIT, clip(), LEDGER_STEPS, MAINTENANCE_LIMIT, maintenanceFacts()

### Community 50 - "intake/admission.ts"
Cohesion: 0.12
Nodes (28): reconcileNoticeConfirmations(), Admission, admit(), IntakeContext, compatible(), dependencyCompletionKey(), dependencyEligibility(), DependencyStores (+20 more)

### Community 51 - "run-accounting.ts"
Cohesion: 0.11
Nodes (33): BoundedRead, done(), readBoundedNoFollow(), readBoundedNoFollowSync(), reasonOf(), backfillClaudeCost(), CompletionReader, codexHome() (+25 more)

### Community 52 - ".transaction"
Cohesion: 0.17
Nodes (15): featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), reserveReplacement(), stageBudget(), wakeFeature(), recoverFeatures(), observeHelperGroups() (+7 more)

### Community 53 - "worker-runtime.ts"
Cohesion: 0.08
Nodes (41): candidateWorkspaceEnvironment(), assertDigestDispatch(), assignmentSubject(), dispatchExposure(), prepareExposure(), assertRetainedDispatchScope(), contextPacket(), CODEX_DEFAULT_EFFORT (+33 more)

### Community 54 - "scheduler.ts"
Cohesion: 0.16
Nodes (14): ROLES, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch(), deliveryOccupied() (+6 more)

### Community 55 - "jira-time.ts"
Cohesion: 0.21
Nodes (13): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+5 more)

### Community 56 - "cec/issue-publication.ts"
Cohesion: 0.14
Nodes (15): CommentPage, commentReadback(), Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), Transition (+7 more)

### Community 57 - "work.ts"
Cohesion: 0.15
Nodes (12): AssignmentResult, CompletionCondition, DeliveryAdmission, DependencyObservation, EligibilityState, FailureCategory, ReconciliationAction, WorkAssignment (+4 more)

### Community 58 - "http/commands.ts"
Cohesion: 0.20
Nodes (18): retryRecipientLookup(), enqueueGreen156(), bindDiscoveryResume(), DiscoveryResumeInput, configureDigestDelivery(), DigestSettings, configureKnowledge(), declineLessonIssue() (+10 more)

### Community 59 - "cost-entries.ts"
Cohesion: 0.24
Nodes (10): captureCost(), summary(), awaitingEvidence(), CaptureContext, inCostWindow(), TicketCost, ticketCosts(), RECONCILE_GRACE_MS (+2 more)

### Community 60 - "maintenance-readback.ts"
Cohesion: 0.22
Nodes (9): MaintenanceSchema, Hash, MAINTENANCE_NATIVE_GUIDANCE, maintenanceCoveragePassed(), maintenanceCoverageSchema(), MaintenanceReadback, names, Receipt (+1 more)

### Community 61 - ".getEffect"
Cohesion: 0.32
Nodes (6): GitHubOperations, fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), closeNativeRefresh(), fingerprint()

### Community 62 - "retrospective-subject.ts"
Cohesion: 0.14
Nodes (20): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, maintenanceKey(), azurePrUrl(), findSubject(), jobSubject() (+12 more)

### Community 63 - "daily-cto.ts"
Cohesion: 0.17
Nodes (9): DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), queueGoalEvidenceRequest(), DailyResultSchema, GoalEvidenceRequestSchema, ControlStore (+1 more)

### Community 64 - "DailyCTO.tsx"
Cohesion: 0.26
Nodes (8): CTOReview(), goalState, DailyCTO(), GoalHistory(), reportDate(), reviewStatus, reviewExcerpt(), ReviewText()

### Community 65 - "diagnostic-context.ts"
Cohesion: 0.38
Nodes (6): diagnosticContext(), diagnosticSnapshot(), itAgent(), itDiagnostics(), currentServices(), ServiceHealthPanel()

### Community 66 - "remove-candidate.ts"
Cohesion: 0.20
Nodes (17): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+9 more)

### Community 67 - "features/commands.ts"
Cohesion: 0.11
Nodes (35): commandFeature(), mutation(), reviewQuestions(), FeatureCommandSchema, Link, linkFeature(), applyHarnessAction(), HarnessActionInput (+27 more)

### Community 68 - "lessons-view.ts"
Cohesion: 0.29
Nodes (8): OfficeProposal, RetrospectiveRecord, WeeklyRollup, IntakeSummary(), lessonsView, newest(), ROLLUP_ROWS, TRIGGER_LABEL

### Community 69 - "Coordinator"
Cohesion: 0.08
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 70 - "goal-reporting.ts"
Cohesion: 0.15
Nodes (16): GitHubMonitor, githubPRDescription(), azureGoalFacts(), azurePRDescription(), boundedEvidence(), collectAzureGoalDocuments(), EvidenceStore, GOAL_EVIDENCE_LIMITS (+8 more)

### Community 71 - "read-retries.ts"
Cohesion: 0.43
Nodes (6): PrerequisitesSchema, incompleteReadOutput(), IntakeResult, planReadRetry(), reconcileReadRetries(), temporaryReadFailure()

### Community 72 - "investigations/run.ts"
Cohesion: 0.12
Nodes (26): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_FIX_PROMPT, OfficeFixResult (+18 more)

### Community 73 - "admit-improvement.ts"
Cohesion: 0.24
Nodes (13): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+5 more)

### Community 74 - "record-trigger.ts"
Cohesion: 0.20
Nodes (16): baselineLearning(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences(), clip(), JobLike, recordCIBudget() (+8 more)

### Community 75 - "checkpoint-completion.ts"
Cohesion: 0.15
Nodes (14): BrainStatusSchema, identity, coverageSchema, followupSchema, verified, checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup() (+6 more)

### Community 76 - "needsDecision"
Cohesion: 0.70
Nodes (3): parksInJira(), DECISION_KINDS, needsDecision()

### Community 77 - "coordination.ts"
Cohesion: 0.17
Nodes (17): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation(), checkpointWindow(), dueAt() (+9 more)

### Community 78 - "extraction.ts"
Cohesion: 0.50
Nodes (4): createExtractor(), extractDocument, Extraction, Extractor

### Community 79 - "goal-reviews.ts"
Cohesion: 0.18
Nodes (12): applyGoalReview(), EvidenceRefSchema, FreshDailyResultSchema, statusAllowed(), workEvidence(), DailyCTOBriefing, DailyCTOResult, DailyGoalUpdate (+4 more)

### Community 80 - "assignment-poll.ts"
Cohesion: 0.22
Nodes (13): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), admitReadyCards(), WAIT_STATUSES (+5 more)

### Community 83 - "control-store.ts"
Cohesion: 0.18
Nodes (9): Briefing, saveReviewBriefing(), Clock, applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, statementCache() (+1 more)

### Community 84 - "contract.ts"
Cohesion: 0.22
Nodes (11): At, Errno, GroupInventory, GroupProbe, LifecycleDiagnostic, Phase, Pid, groupInventory() (+3 more)

### Community 85 - "fact-bounds.ts"
Cohesion: 0.26
Nodes (15): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+7 more)

### Community 88 - "useOfficePreferences.ts"
Cohesion: 0.11
Nodes (21): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, acceptPreferences(), PreferenceCandidate (+13 more)

### Community 90 - "telemetry/report.ts"
Cohesion: 0.16
Nodes (19): TelemetryRow, TelemetrySync, ConfirmedSegment, LiveAnchor, ObservationGap, SnapshotOrdering, TimeLedgerState, Acc (+11 more)

### Community 92 - ".value"
Cohesion: 0.27
Nodes (6): file, folder, logs, root, xml(), ProjectProgress

### Community 93 - "create-candidate.ts"
Cohesion: 0.31
Nodes (9): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+1 more)

### Community 94 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 95 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 96 - "QuestionDialogHost.tsx"
Cohesion: 0.44
Nodes (7): FeatureQuestionProjection, nextQuestion(), orderedQuestions(), questionKey(), QuestionDialogHost(), readSuppressed(), Dialog()

### Community 99 - "notifications.ts"
Cohesion: 0.20
Nodes (14): ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR, plainSlackText() (+6 more)

### Community 100 - "OfficeConfigView.tsx"
Cohesion: 0.48
Nodes (5): loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView(), OfficeConfigSummary

### Community 103 - "extract-worker.mjs"
Cohesion: 0.70
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 105 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

## Knowledge Gaps
- **434 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+429 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `artifact`, `accept-stage-result.ts`, `GitHubDelivery`, `schedule.ts`, `knowledge/routes.ts`, `features/workflow.ts`, `SourceRegistry`, `scheduled-captures.ts`, `OfficeSnapshot`, `currentAssignment`, `digest`, `session-bridge.ts`, `source-amendment.ts`, `agents.ts`, `retrospective-triggers.ts`, `github-delivery.ts`, `effects.ts`, `maintenance/maintenance.ts`, `offices.ts`, `run-retrospective.ts`, `workKey`, `conversations/slack.ts`, `delivery-recoveries.ts`, `digest`, `office/config.ts`, `ticket-evidence.ts`, `time-scope.ts`, `dependency-bots/adopt.ts`, `closeout-recovery.ts`, `.emit`, `azure.ts`, `ticket-stage-runner.ts`, `knowledge.ts`, `.save`, `conversations/conversations.ts`, `blocker-followups.ts`, `features.ts`, `intake/admission.ts`, `run-accounting.ts`, `.transaction`, `worker-runtime.ts`, `scheduler.ts`, `jira-time.ts`, `cec/issue-publication.ts`, `http/commands.ts`, `cost-entries.ts`, `maintenance-readback.ts`, `.getEffect`, `retrospective-subject.ts`, `diagnostic-context.ts`, `remove-candidate.ts`, `features/commands.ts`, `goal-reporting.ts`, `read-retries.ts`, `investigations/run.ts`, `admit-improvement.ts`, `record-trigger.ts`, `checkpoint-completion.ts`, `coordination.ts`, `goal-reviews.ts`, `control-store.ts`, `create-candidate.ts`, `notifications.ts`?**
  _High betweenness centrality (0.133) - this node is a cross-community bridge._
- **Why does `command()` connect `Store` to `accept-stage-result.ts`, `GitHubDelivery`, `schedule.ts`, `features/workflow.ts`, `currentAssignment`, `digest`, `session-bridge.ts`, `source-amendment.ts`, `agents.ts`, `github-delivery.ts`, `effects.ts`, `maintenance/maintenance.ts`, `reader.ts`, `office/config.ts`, `ticket-evidence.ts`, `dependency-bots/adopt.ts`, `closeout-recovery.ts`, `.emit`, `azure.ts`, `.save`, `intake/admission.ts`, `worker-runtime.ts`, `jira-time.ts`, `cec/issue-publication.ts`, `remove-candidate.ts`, `goal-reporting.ts`, `coordination.ts`, `contract.ts`, `create-candidate.ts`, `command-registry.ts`, `notifications.ts`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `OfficeSnapshot` connect `OfficeSnapshot` to `accept-stage-result.ts`, `Store`, `index.tsx`, `knowledge/routes.ts`, `Button`, `App.tsx`, `mutedCopy`, `OfficeScene.tsx`, `shared.ts`, `retrospective-triggers.ts`, `TelemetryPanel.tsx`, `maintenance/maintenance.ts`, `offices.ts`, `office/config.ts`, `azure.ts`, `conversations/conversations.ts`, `blocker-followups.ts`, `scheduler.ts`, `DailyCTO.tsx`, `diagnostic-context.ts`, `checkpoint-completion.ts`, `assignment-poll.ts`, `useOfficePreferences.ts`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _434 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `artifact` be split into smaller, more focused modules?**
  _Cohesion score 0.06357457017193123 - nodes in this community are weakly interconnected._
- **Should `accept-stage-result.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06366691560866318 - nodes in this community are weakly interconnected._
- **Should `GitHubDelivery` be split into smaller, more focused modules?**
  _Cohesion score 0.0745814307458143 - nodes in this community are weakly interconnected._