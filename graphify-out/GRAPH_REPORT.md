# Graph Report - office-publication-recovery  (2026-11-11)

## Corpus Check
- 818 files · ~324,456 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4003 nodes · 18406 edges · 94 communities (91 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 110 edges (avg confidence: 0.74)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9c571198`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- schedule.ts
- artifact
- knowledge.ts
- knowledge/routes.ts
- github-delivery.ts
- requests.ts
- source-amendment.ts
- Button
- Inspector.tsx
- App.tsx
- index.tsx
- Store
- authorize.ts
- index.ts
- store.ts
- digest
- worker-runtime.ts
- OfficeScene.tsx
- TicketJob
- .transaction
- recovery/stopped-base-update.ts
- scheduled-captures.ts
- daily-cto.ts
- session-bridge.ts
- sanitize
- TelemetryPanel.tsx
- .getEffect
- digest
- it-specialist.ts
- offices.ts
- github-context.ts
- agents.ts
- JiraIssuePublisher
- PeoplePanel.tsx
- .emit
- assignment-poll.ts
- readback-evidence.ts
- run-accounting.ts
- cec/workflow.ts
- Goals.tsx
- outbox.ts
- Role
- publish-pr.ts
- ticket-evidence.ts
- investigations/run.ts
- engine.ts
- azure.ts
- WorkTime
- features.ts
- constellation-runtime.ts
- move-lane.ts
- cost-ledger.ts
- .save
- QuestionStepper.tsx
- run-cost.ts
- maintenance/maintenance.ts
- shared.ts
- remove-candidate.ts
- Coordinator
- scheduled-work.ts
- jira-time.ts
- intake/admission.ts
- contract.ts
- record-trigger.ts
- tracking-issue.ts
- office-lessons.ts
- fact-bounds.ts
- telemetry.ts
- closeout.ts
- accept-stage-result.ts
- retrospective-subject.ts
- coordination.ts
- workKey
- brain-maintenance.ts
- MaintenanceRun
- coordination-tick.ts
- migrations.ts
- seeded-office-lessons.ts
- delivery-task.ts
- preferences-store.ts
- checkpoint-completion.ts
- .pump
- .value
- create-candidate.ts
- codex-rollout.ts
- command-registry.ts
- WorkApproach
- learning-maintenance.ts
- extract-worker.mjs
- SlackIntakeStatus.tsx
- slack-supersession.ts
- helper-evidence.py
- packed-publication-repair.ts

## God Nodes (most connected - your core abstractions)
1. `Store` - 366 edges
2. `TicketJob` - 173 edges
3. `digest()` - 150 edges
4. `GitHubDelivery` - 148 edges
5. `artifact()` - 127 edges
6. `command()` - 111 edges
7. `workKey()` - 99 edges
8. `cx()` - 88 edges
9. `currentAssignment()` - 82 edges
10. `OfficeSnapshot` - 71 edges

## Surprising Connections (you probably didn't know these)
- `readAzurePRs()` --indirect_call--> `row()`  [INFERRED]
  server/cec/observed-prs.ts → src/telemetry/report.ts
- `DeliveryAuthorityInput` --references--> `HarnessRequest`  [EXTRACTED]
  server/delivery/harness/delivery-authority.ts → src/contracts/work.ts
- `Admission` --references--> `AssignmentReview`  [EXTRACTED]
  server/delivery/intake/admission.ts → src/shared.ts
- `rows()` --indirect_call--> `row()`  [INFERRED]
  server/delivery/recovery/source-amendment/source-amendment-held.ts → src/telemetry/report.ts
- `proveOutsideAmendmentUnchanged()` --indirect_call--> `row()`  [INFERRED]
  server/delivery/recovery/source-amendment/source-amendment-held.ts → src/telemetry/report.ts

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

## Communities (94 total, 3 thin omitted)

### Community 0 - "schedule.ts"
Cohesion: 0.06
Nodes (88): KnowledgeRunner, newTask(), recordObservation(), settlePage(), ChannelProgress, LIMITS, Observation, ReadKind (+80 more)

### Community 1 - "artifact"
Cohesion: 0.06
Nodes (121): containedFile(), recordJobApproach(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash (+113 more)

### Community 2 - "knowledge.ts"
Cohesion: 0.04
Nodes (110): Accepted, acceptRetrospective(), BLOCKED, RETROSPECTIVE_HISTORY, Shared, curateLesson(), Curation, CurationAction (+102 more)

### Community 3 - "knowledge/routes.ts"
Cohesion: 0.05
Nodes (88): intakeActivity(), knowledgeActivity(), knowledgeActivityPage(), uploadArtifact(), assignmentKnowledge(), guidanceExcerpt(), KnowledgeContext, independentDigestEvidence() (+80 more)

### Community 4 - "github-delivery.ts"
Cohesion: 0.06
Nodes (79): findingsBlock(), HANDS_OFF_PROJECTS, handsOff(), legacyRecovery(), BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction() (+71 more)

### Community 5 - "requests.ts"
Cohesion: 0.06
Nodes (74): boardPreflightCandidate(), Ownership, reconcileBoardPreflight(), partialLocalCleanupCandidate(), candidateInput(), children, oldAdoptionBasis(), savedCandidateAdmission (+66 more)

### Community 6 - "source-amendment.ts"
Cohesion: 0.05
Nodes (85): stagePrompt(), StagePromptInput, METADATA_FINDING_GUIDANCE, adoptCandidate(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent() (+77 more)

### Community 7 - "Button"
Cohesion: 0.06
Nodes (58): KnowledgeActivity, KnowledgeActivityPage, KnowledgeEdge, KnowledgeMap, KnowledgeNode, Activity(), ActivityStatus(), ActivityTimeline() (+50 more)

### Community 8 - "Inspector.tsx"
Cohesion: 0.07
Nodes (63): Conversation(), Outbox(), slackMessageStatus(), SlackDeliveryCard(), labels, BlockerFollowups(), BrainDrawer(), IntakeSummary() (+55 more)

### Community 9 - "App.tsx"
Cohesion: 0.04
Nodes (66): diagnosticContext(), itAgent(), itDiagnostics(), currentServices(), ServiceHealthPanel(), ServiceHealthRow(), themeColor, App() (+58 more)

### Community 10 - "index.tsx"
Cohesion: 0.06
Nodes (62): KnowledgeSourceSummary, AddPublicSource(), AddSourceForm(), SourceConnection, SourceCard(), UploadSource(), WithdrawSource(), SaveFeedback() (+54 more)

### Community 11 - "Store"
Cohesion: 0.05
Nodes (26): CommentPage, commentReadback(), Content, jiraText(), JiraOperations, plain(), unpack(), jiraRecord() (+18 more)

### Community 12 - "authorize.ts"
Cohesion: 0.06
Nodes (51): descriptionPreimage(), plain(), approveFeature(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), artifactPath() (+43 more)

### Community 13 - "index.ts"
Cohesion: 0.07
Nodes (51): args, [cmd,...rawArgs], commands, key, projectIndex, AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), assertAssessmentVisibility() (+43 more)

### Community 14 - "store.ts"
Cohesion: 0.06
Nodes (38): channelNoticeAuthorized(), notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR, plainSlackText(), section() (+30 more)

### Community 15 - "digest"
Cohesion: 0.06
Nodes (47): comparableSlackText(), committedNotePage(), BrainGraph, BrainNote, BrainReader, CommittedBrain, GraphNode, GraphPage (+39 more)

### Community 16 - "worker-runtime.ts"
Cohesion: 0.06
Nodes (50): SlackResultSchema, candidateWorkspaceEnvironment(), assignmentSubject(), catalogLine(), assertRetainedDispatchScope(), assertBriefingScope(), LOCAL_BINDINGS, contextPacket() (+42 more)

### Community 17 - "OfficeScene.tsx"
Cohesion: 0.06
Nodes (57): displayAgentTask(), githubStageLabels, withoutElapsed(), CameraBookmark, restoreBookmark(), LiveAgentTask(), Props, RunningTask() (+49 more)

### Community 18 - "TicketJob"
Cohesion: 0.11
Nodes (35): removeAdoptedClone(), namedRepairIds(), pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), StageContext, GitHubDelivery, stoppedBaseCheckout(), stoppedBasePackageInstruction() (+27 more)

### Community 19 - ".transaction"
Cohesion: 0.11
Nodes (40): featureItemComplete(), reconcileFeatureCompletion(), discoveryPrompt(), planPrompt(), readEvidence(), helperTelemetry(), DELAYS, MAX_EXECUTIONS (+32 more)

### Community 20 - "recovery/stopped-base-update.ts"
Cohesion: 0.08
Nodes (43): deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, requireDeliveryAuthority(), deliveryIntakeBlocker(), gateRegisteredDelivery(), resolveDeliveryWork() (+35 more)

### Community 21 - "scheduled-captures.ts"
Cohesion: 0.15
Nodes (44): createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest, captureRequests() (+36 more)

### Community 22 - "daily-cto.ts"
Cohesion: 0.07
Nodes (29): DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), queueGoalEvidenceRequest(), applyGoalReview(), DailyResultSchema, EvidenceRefSchema (+21 more)

### Community 23 - "session-bridge.ts"
Cohesion: 0.08
Nodes (37): claudeSessionContext(), readTranscript, root, claudeSessionScope(), accountCodexProcesses(), codexProcessInventory, DesktopSessions, unaccountedProcesses() (+29 more)

### Community 24 - "sanitize"
Cohesion: 0.09
Nodes (27): assertConversationReadback(), Conversations, GoalChangeSchema, ReplySchema, pumpCTO(), queueCTOHandoff(), saveGoals(), pumpIT() (+19 more)

### Community 25 - "TelemetryPanel.tsx"
Cohesion: 0.09
Nodes (39): cecChatPrompt(), TelemetryReport, AzureBuild, SlackDelivery, BreakdownTable(), CostBar(), coverage(), pricedLabel() (+31 more)

### Community 26 - ".getEffect"
Cohesion: 0.10
Nodes (23): featureById(), FeaturePublisher, publishFeature(), reconcilePublication(), uncertainPublications(), reserveIdentity(), GitHubOperations, Content (+15 more)

### Community 27 - "digest"
Cohesion: 0.16
Nodes (37): harnessDelivers(), admitPRMetadata(), assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema, savedMetadataAssessment(), validateSaved() (+29 more)

### Community 28 - "it-specialist.ts"
Cohesion: 0.09
Nodes (29): partialLocalCleanupKey(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), ITContext, diagnosticSnapshot(), publishITReport() (+21 more)

### Community 29 - "offices.ts"
Cohesion: 0.09
Nodes (27): expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), SlackReadAuthority, Command (+19 more)

### Community 30 - "github-context.ts"
Cohesion: 0.11
Nodes (41): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+33 more)

### Community 31 - "agents.ts"
Cohesion: 0.08
Nodes (30): cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), ConversationResultSchema, ctoChatPrompt(), slackSendPrompt(), slackVerifyPrompt() (+22 more)

### Community 32 - "JiraIssuePublisher"
Cohesion: 0.13
Nodes (14): Assignment, JiraIssuePublisher, keyOf(), Transition, publicationDescription(), PublicationReceipt, Assign, Board (+6 more)

### Community 33 - "PeoplePanel.tsx"
Cohesion: 0.11
Nodes (36): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+28 more)

### Community 34 - ".emit"
Cohesion: 0.10
Nodes (32): ChannelSettings, configureChannelNotices(), configureNotices(), NoticeSettings, retryRecipientLookup(), enqueueGreen156(), Assessment, bindDiscoveryResume() (+24 more)

### Community 35 - "assignment-poll.ts"
Cohesion: 0.12
Nodes (32): noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT (+24 more)

### Community 36 - "readback-evidence.ts"
Cohesion: 0.14
Nodes (30): accounting, DeliverySubject, nonDelivery, originalReads, HarnessControl, withHarnessWork(), admitPacked165(), history() (+22 more)

### Community 37 - "run-accounting.ts"
Cohesion: 0.10
Nodes (36): ghLogCacheEvidence(), BoundedRead, done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf(), comparable() (+28 more)

### Community 38 - "cec/workflow.ts"
Cohesion: 0.12
Nodes (35): correlatedBuild(), applyIntakeObservation(), checkMail(), drainMail(), requestMail(), parksInJira(), MISSING_INTAKE, reconcileMailbox() (+27 more)

### Community 39 - "Goals.tsx"
Cohesion: 0.08
Nodes (29): SendMessage, FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures(), TicketPlanningAction() (+21 more)

### Community 40 - "outbox.ts"
Cohesion: 0.11
Nodes (27): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), MessageInput, conversationResolved(), projectOutbox(), syncOutbox(), itChatPrompt() (+19 more)

### Community 41 - "Role"
Cohesion: 0.10
Nodes (27): ROLES, DeliverySlot, officeCapacity, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork() (+19 more)

### Community 42 - "publish-pr.ts"
Cohesion: 0.13
Nodes (30): activeEffectId(), harnessEffect, assertDeliveryMayMutate(), retryRead(), linkDraftIssue(), protectedOriginalClaim(), dispatchedMetadataEffect(), assertCandidate() (+22 more)

### Community 43 - "ticket-evidence.ts"
Cohesion: 0.13
Nodes (30): assetDownloader(), attachmentKind(), evidenceDirectory(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS, EvidenceAttachment (+22 more)

### Community 44 - "investigations/run.ts"
Cohesion: 0.13
Nodes (27): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationCandidates(), investigationId(), investigationEvidence(), investigationFollowUps(), INVOCATION_SOURCE_REFS, invocationSource() (+19 more)

### Community 45 - "engine.ts"
Cohesion: 0.15
Nodes (29): dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), resume(), startPilot(), eligibility(), approvedDelivery() (+21 more)

### Community 46 - "azure.ts"
Cohesion: 0.10
Nodes (27): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+19 more)

### Community 47 - "WorkTime"
Cohesion: 0.14
Nodes (32): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence(), CaptureContext (+24 more)

### Community 48 - "features.ts"
Cohesion: 0.14
Nodes (27): commandFeature(), reviewQuestions(), FeaturePlanningBindings, applyHarnessAction(), HarnessActionInput, recoveryPreconditions(), recoveryTarget(), canReleaseOrdinary() (+19 more)

### Community 49 - "constellation-runtime.ts"
Cohesion: 0.11
Nodes (25): CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point, Constellation(), ConstellationView (+17 more)

### Community 50 - "move-lane.ts"
Cohesion: 0.19
Nodes (27): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard, projectCards() (+19 more)

### Community 51 - "cost-ledger.ts"
Cohesion: 0.15
Nodes (27): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress(), effectId() (+19 more)

### Community 52 - ".save"
Cohesion: 0.18
Nodes (27): BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue(), readIssues(), commentDecision() (+19 more)

### Community 53 - "QuestionStepper.tsx"
Cohesion: 0.15
Nodes (20): FeatureHarnessOption, FeatureOption, FeatureQuestion, FeatureQuestionProjection, draftKey(), readDraft(), saveDraft(), QuestionRound() (+12 more)

### Community 54 - "run-cost.ts"
Cohesion: 0.11
Nodes (23): CodexRollout, CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL (+15 more)

### Community 55 - "maintenance/maintenance.ts"
Cohesion: 0.14
Nodes (18): ApproachSchema, candidateOwner(), SETTLED, skipOwnedCandidate(), Skipped, skippedCandidateLedger(), CmsFollowUpContext, cmsFollowUpInstructions() (+10 more)

### Community 56 - "shared.ts"
Cohesion: 0.11
Nodes (21): DECISION_KINDS, needsDecision(), park(), ProjectReadiness, Prerequisite, SchedulerState, WorkFailure, AssignmentReview (+13 more)

### Community 57 - "remove-candidate.ts"
Cohesion: 0.18
Nodes (18): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot() (+10 more)

### Community 58 - "Coordinator"
Cohesion: 0.09
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 59 - "scheduled-work.ts"
Cohesion: 0.16
Nodes (19): deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), metadataRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), requestPriority() (+11 more)

### Community 60 - "jira-time.ts"
Cohesion: 0.15
Nodes (17): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+9 more)

### Community 61 - "intake/admission.ts"
Cohesion: 0.20
Nodes (18): Admission, admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, compatible(), dependencyCompletionKey(), dependencyEligibility() (+10 more)

### Community 62 - "contract.ts"
Cohesion: 0.15
Nodes (16): Event, one(), prePushRejection(), PushIdentity, settledPushBoundary(), At, Errno, GroupInventory (+8 more)

### Community 63 - "record-trigger.ts"
Cohesion: 0.18
Nodes (22): MaintenanceCandidate, clip(), JobLike, recordCIBudget(), recordParked(), recordRepairBudget(), recordTicketParked(), recordTrigger() (+14 more)

### Community 64 - "tracking-issue.ts"
Cohesion: 0.19
Nodes (17): readBackOrThrow(), ensureTrackingIssue(), findTrackingIssue(), ownTracking(), TrackingIssue, trackingIssueBody(), trackingIssueTitle(), trackingMarker() (+9 more)

### Community 65 - "office-lessons.ts"
Cohesion: 0.20
Nodes (14): normalizeStatement(), retainedArtifactScope(), eventSourceBindings(), exposureBindings(), requestSourceBindings(), decideOfficeProposal(), now(), OfficeKnowledgeStore (+6 more)

### Community 66 - "fact-bounds.ts"
Cohesion: 0.21
Nodes (18): leadershipContext(), leadershipEntries(), knowledgeEntries(), collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime() (+10 more)

### Community 67 - "telemetry.ts"
Cohesion: 0.16
Nodes (19): CostCompleteness, CostEntry, TelemetryRow, TelemetrySync, UsageCompleteness, UsageSource, ValuationSource, Acc (+11 more)

### Community 68 - "closeout.ts"
Cohesion: 0.27
Nodes (14): harnessCloseout(), PASSING, verifyMergeActions(), runHarnessStage(), harnessStageResult(), receipt(), Check, harnessChecks() (+6 more)

### Community 69 - "accept-stage-result.ts"
Cohesion: 0.23
Nodes (16): acceptStageResult(), METADATA_FINDING, mergeAuthorized(), continuationReviewArtifacts(), reconcileContinuationReview(), savedNegativeContinuationReview(), discoveryReviewSatisfied(), ContinuationDecision (+8 more)

### Community 70 - "retrospective-subject.ts"
Cohesion: 0.19
Nodes (15): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, maintenanceKey(), azurePrUrl(), findSubject(), jobSubject() (+7 more)

### Community 71 - "coordination.ts"
Cohesion: 0.20
Nodes (16): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation(), checkpointWindow(), dueAt() (+8 more)

### Community 72 - "workKey"
Cohesion: 0.23
Nodes (12): completedPRReviews(), eligible(), mergedByOwner(), ownerSettles(), retireExternalDeliveries(), retireInactiveDeliveries(), retireUnstartedDelivery(), unstartedDelivery() (+4 more)

### Community 73 - "brain-maintenance.ts"
Cohesion: 0.21
Nodes (10): maintenancePolicies(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice(), easternDate(), weeklyDue() (+2 more)

### Community 74 - "MaintenanceRun"
Cohesion: 0.21
Nodes (11): BrainFollowup, checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), repeatedVendorReviewBlock(), stoppedInVendorReview(), maintenanceSuperseded(), REOBSERVED (+3 more)

### Community 75 - "coordination-tick.ts"
Cohesion: 0.22
Nodes (12): reconcileNoticeConfirmations(), PrerequisitesSchema, legacy, reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION, tick() (+4 more)

### Community 76 - "migrations.ts"
Cohesion: 0.23
Nodes (13): dropLessonGrading(), dropLessonGradingFields(), dropReportFields(), LEARNING, Stored, clip(), maintenanceBlockedId(), maintenanceCandidates() (+5 more)

### Community 77 - "seeded-office-lessons.ts"
Cohesion: 0.20
Nodes (13): REPOSITORY_ISSUES, Rewrite, rewriteLesson(), REWRITES, CONSOLIDATED, CONSOLIDATED_AT, projectSeed(), seedProjectLessons() (+5 more)

### Community 78 - "delivery-task.ts"
Cohesion: 0.21
Nodes (11): cecPrompt(), resolvedDecisionNote(), stageInstructions, APPROACH_GUIDANCE, reviewInstructions(), deliveryTask(), DeliveryTaskInput, DISCOVERY_GUIDANCE (+3 more)

### Community 79 - "preferences-store.ts"
Cohesion: 0.21
Nodes (9): PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, SettingsPanel(), OFFICE_PREFERENCE_DEFAULTS (+1 more)

### Community 80 - "checkpoint-completion.ts"
Cohesion: 0.23
Nodes (8): BrainStatusSchema, identity, parseBrainStatus(), brainCheckpointCompletion(), coverageSchema, followupSchema, verified, reconcileCompletedCheckpoints()

### Community 82 - ".value"
Cohesion: 0.27
Nodes (6): file, folder, logs, root, xml(), ProjectProgress

### Community 83 - "create-candidate.ts"
Cohesion: 0.31
Nodes (9): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+1 more)

### Community 84 - "codex-rollout.ts"
Cohesion: 0.29
Nodes (9): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO (+1 more)

### Community 85 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 86 - "WorkApproach"
Cohesion: 0.48
Nodes (5): CIRepair, CIRepairPlan, RepairCheckout, StoppedBaseUpdate, WorkApproach

### Community 87 - "learning-maintenance.ts"
Cohesion: 0.47
Nodes (5): baselineLearning(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences()

### Community 88 - "extract-worker.mjs"
Cohesion: 0.70
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 89 - "SlackIntakeStatus.tsx"
Cohesion: 0.60
Nodes (4): format, labels, SlackIntakeStatus(), time()

### Community 90 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

## Knowledge Gaps
- **440 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+435 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `schedule.ts`, `artifact`, `knowledge.ts`, `knowledge/routes.ts`, `github-delivery.ts`, `requests.ts`, `source-amendment.ts`, `Inspector.tsx`, `App.tsx`, `authorize.ts`, `index.ts`, `store.ts`, `digest`, `worker-runtime.ts`, `TicketJob`, `.transaction`, `recovery/stopped-base-update.ts`, `scheduled-captures.ts`, `daily-cto.ts`, `session-bridge.ts`, `sanitize`, `TelemetryPanel.tsx`, `.getEffect`, `digest`, `it-specialist.ts`, `offices.ts`, `github-context.ts`, `agents.ts`, `.emit`, `assignment-poll.ts`, `readback-evidence.ts`, `run-accounting.ts`, `outbox.ts`, `Role`, `publish-pr.ts`, `ticket-evidence.ts`, `investigations/run.ts`, `engine.ts`, `azure.ts`, `WorkTime`, `features.ts`, `move-lane.ts`, `cost-ledger.ts`, `.save`, `maintenance/maintenance.ts`, `remove-candidate.ts`, `scheduled-work.ts`, `jira-time.ts`, `intake/admission.ts`, `record-trigger.ts`, `tracking-issue.ts`, `office-lessons.ts`, `accept-stage-result.ts`, `retrospective-subject.ts`, `coordination.ts`, `workKey`, `brain-maintenance.ts`, `coordination-tick.ts`, `delivery-task.ts`, `checkpoint-completion.ts`, `create-candidate.ts`, `learning-maintenance.ts`?**
  _High betweenness centrality (0.138) - this node is a cross-community bridge._
- **Why does `OfficeSnapshot` connect `Inspector.tsx` to `knowledge/routes.ts`, `Button`, `App.tsx`, `index.tsx`, `Store`, `index.ts`, `store.ts`, `OfficeScene.tsx`, `daily-cto.ts`, `TelemetryPanel.tsx`, `it-specialist.ts`, `PeoplePanel.tsx`, `cec/workflow.ts`, `Goals.tsx`, `outbox.ts`, `Role`, `investigations/run.ts`, `azure.ts`, `maintenance/maintenance.ts`, `shared.ts`, `MaintenanceRun`, `migrations.ts`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `TicketJob` connect `TicketJob` to `artifact`, `github-delivery.ts`, `requests.ts`, `source-amendment.ts`, `Inspector.tsx`, `App.tsx`, `worker-runtime.ts`, `recovery/stopped-base-update.ts`, `digest`, `it-specialist.ts`, `github-context.ts`, `.emit`, `assignment-poll.ts`, `readback-evidence.ts`, `run-accounting.ts`, `cec/workflow.ts`, `Role`, `publish-pr.ts`, `engine.ts`, `move-lane.ts`, `shared.ts`, `remove-candidate.ts`, `intake/admission.ts`, `record-trigger.ts`, `tracking-issue.ts`, `fact-bounds.ts`, `closeout.ts`, `accept-stage-result.ts`, `retrospective-subject.ts`, `workKey`, `MaintenanceRun`, `delivery-task.ts`, `.value`, `create-candidate.ts`, `WorkApproach`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _440 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `schedule.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.060851737955456155 - nodes in this community are weakly interconnected._
- **Should `artifact` be split into smaller, more focused modules?**
  _Cohesion score 0.05668398677373642 - nodes in this community are weakly interconnected._
- **Should `knowledge.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.03531558608844998 - nodes in this community are weakly interconnected._