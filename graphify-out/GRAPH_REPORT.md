# Graph Report - office-qa-read-continuation-nov15  (2026-11-15)

## Corpus Check
- 829 files · ~335,896 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4105 nodes · 19215 edges · 101 communities
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 628 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a3c686e1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- github-delivery.ts
- requests.ts
- digest
- github-context.ts
- Inspector.tsx
- artifact
- Ticket
- ref_react
- currentAssignment
- dependency-bots/adopt.ts
- engine.ts
- features.ts
- App.tsx
- offices.ts
- index.tsx
- OfficeScene.tsx
- process.ts
- ref_node_path
- .save
- sanitize
- agents.ts
- ref_zod
- shared.ts
- scheduled-captures.ts
- constellation-runtime.ts
- Goals.tsx
- run-retrospective.ts
- features/commands.ts
- azure.ts
- completedExecution
- lesson-selection.ts
- ControlStore
- PeoplePanel.tsx
- pilot-delivery.ts
- TimeBook.tsx
- weekly-rollup.ts
- task-briefing.ts
- record-trigger.ts
- scheduled-work.ts
- ledger.ts
- time-scope.ts
- source-amendment.ts
- run-accounting.ts
- cost-ledger.ts
- telemetry.ts
- coordination.ts
- ref_node_crypto
- notifications.ts
- knowledge.ts
- session-bridge.ts
- candidate.ts
- assignments.ts
- ticket-evidence.ts
- work.ts
- outbox.ts
- Role
- office-lessons.ts
- admit-improvement.ts
- remove-candidate.ts
- executeRequest
- it-specialist.ts
- daily-cto.ts
- FeatureWorkspace.tsx
- workKey
- .emit
- service-health.ts
- jira-time.ts
- github-check-selection.ts
- index.ts
- .getEffect
- record-push.ts
- assignment-poll.ts
- store.ts
- retrospective-subject.ts
- node-visuals.ts
- Store
- goal-reporting.ts
- preferences-store.ts
- learning-events.ts
- scene-motion.ts
- blocker-followups.ts
- capture-session-clone.py
- RoomCamera.tsx
- discovery-recovery.ts
- lessons-view.ts
- evidence-digest.ts
- OfficeSnapshot
- report.ts
- useOfficePreferences.ts
- conversations/slack.ts
- time-readback.ts
- create-candidate.ts
- stopped-base-validation.ts
- retire-history.ts
- command-registry.ts
- codex-rollout.ts
- extract-worker.mjs
- cec-reads.ts
- continue-access-only-plan.ts
- extraction.ts
- it-agent.ts

## God Nodes (most connected - your core abstractions)
1. `Store` - 370 edges
2. `TicketJob` - 176 edges
3. `digest()` - 173 edges
4. `artifact()` - 131 edges
5. `GitHubDelivery` - 122 edges
6. `command()` - 115 edges
7. `workKey()` - 101 edges
8. `currentAssignment()` - 90 edges
9. `cx()` - 88 edges
10. `Button` - 84 edges

## Surprising Connections (you probably didn't know these)
- `apply()` --indirect_call--> `note()`  [INFERRED]
  src/conversations/OutboxSavedImplementation.tsx → server/cec/parking/resume-parked.ts
- `projectOutbox()` --calls--> `isSavedPlanFollowup()`  [EXTRACTED]
  server/conversations/outbox.ts → src/conversations/saved-plan-followup.ts
- `projectOutbox()` --calls--> `deferredPickup()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/pickup-state.ts
- `replacementContext()` --calls--> `slackMessageUrl()`  [EXTRACTED]
  server/conversations/slack/supersession-proof.ts → src/shared.ts
- `pump()` --calls--> `deferredPickup()`  [EXTRACTED]
  server/conversations/team-conversation-pump.ts → src/work/pickup-state.ts

## Import Cycles
- 3-file cycle: `server/delivery/parking/resume-provider-review.ts -> server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/parking/resume-provider-review.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts`
- 4-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 4-file cycle: `server/delivery/recovery/implementation/activation-recovery.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/implementation/activation-recovery.ts`
- 4-file cycle: `server/delivery/recovery/implementation/saved-prerequisite-handoff.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/implementation/saved-prerequisite-handoff.ts`
- 4-file cycle: `server/delivery/recovery/scope-repair/scope-repair-readback.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/scope-repair/scope-repair-readback.ts`
- 4-file cycle: `server/delivery/recovery/source-amendment/source-amendment.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/source-amendment/source-amendment.ts`
- 4-file cycle: `server/delivery/recovery/stopped-base-review.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/stopped-base-review.ts`
- 4-file cycle: `server/delivery/recovery/validation/validation-readback.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/validation/validation-readback.ts`
- 4-file cycle: `server/features/delivery-binding.ts -> server/features/enrollment-gate.ts -> server/features/progression/failure.ts -> server/store/effects.ts -> server/features/delivery-binding.ts`
- 5-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/stage-reconciliation.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 5-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 5-file cycle: `server/delivery/recovery/implementation/continuation-evidence.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/recovery/implementation/continuation-evidence.ts`
- 5-file cycle: `server/delivery/recovery/implementation/saved-prerequisite-handoff.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/recovery/implementation/saved-prerequisite-handoff.ts`
- 5-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/scope-repair/scope-repair-resume.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 5-file cycle: `server/delivery/recovery/scope-repair/scope-repair-readback.ts -> server/delivery/recovery/scope-repair/scope-repair-resume.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/scope-repair/scope-repair-readback.ts`
- 5-file cycle: `server/delivery/recovery/implementation/continuation-evidence.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/implementation/implementation-recovery.ts -> server/delivery/recovery/implementation/continuation-evidence.ts`
- 5-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/closeout/github-closeout.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`

## Communities (101 total, 0 thin omitted)

### Community 0 - "github-delivery.ts"
Cohesion: 0.05
Nodes (89): containedFile(), harnessCloseout(), PASSING, verifyMergeActions(), findingsBlock(), assertDeliveryMayMutate(), runHarnessStage(), HANDS_OFF_PROJECTS (+81 more)

### Community 1 - "requests.ts"
Cohesion: 0.11
Nodes (42): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+34 more)

### Community 2 - "digest"
Cohesion: 0.06
Nodes (75): ownershipReadHistory(), deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, deliveryIntakeBlocker(), gateRegisteredDelivery(), accounting (+67 more)

### Community 3 - "github-context.ts"
Cohesion: 0.10
Nodes (40): removeAdoptedClone(), namedRepairIds(), pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), stoppedBaseCheckout(), stoppedBaseHandoffResolved(), stoppedBaseUpdateResolved(), stoppedBasePackageInstruction() (+32 more)

### Community 4 - "Inspector.tsx"
Cohesion: 0.10
Nodes (70): blockedSummary(), ServiceHealthPanel(), followUp(), labels, ServiceHealthRow(), BlockerFollowups(), LearningCoverage(), LessonsPanel() (+62 more)

### Community 5 - "artifact"
Cohesion: 0.07
Nodes (84): partialLocalCleanupCandidate(), savedActivationFailure(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related (+76 more)

### Community 6 - "Ticket"
Cohesion: 0.11
Nodes (26): implementationWorkerContext(), cecPrompt(), resolvedDecisionNote(), stageInstructions, reviewedPlanGuidance, reviewedPlanGuideDigest, APPROACH_GUIDANCE, reviewInstructions() (+18 more)

### Community 7 - "ref_react"
Cohesion: 0.06
Nodes (64): ref_react, ref_react_markdown, ref_remark_gfm, ref_yaml, KnowledgeNode, Activity(), ActivityTimeline(), AssignmentKnowledge() (+56 more)

### Community 8 - "currentAssignment"
Cohesion: 0.07
Nodes (84): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+76 more)

### Community 9 - "dependency-bots/adopt.ts"
Cohesion: 0.07
Nodes (73): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard, projectCards() (+65 more)

### Community 10 - "engine.ts"
Cohesion: 0.08
Nodes (9): checkMail(), drainMail(), requestMail(), enableNightly(), ingest(), drainMaintenance(), reconcileMaintenance(), requestMaintenance() (+1 more)

### Community 11 - "features.ts"
Cohesion: 0.06
Nodes (71): approveFeature(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), discoveryPrompt(), planPrompt(), artifactPath() (+63 more)

### Community 12 - "App.tsx"
Cohesion: 0.07
Nodes (42): ref_lucide_react, ref_motion, ref_react_dom, BrainDrawer(), themeColor, App(), BrainWorkspace, CONNECTION (+34 more)

### Community 13 - "offices.ts"
Cohesion: 0.09
Nodes (14): ref_smol_toml, QuestionNotifications, leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), DELIVERY_CONCURRENCY, file (+6 more)

### Community 14 - "index.tsx"
Cohesion: 0.14
Nodes (38): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS, PickupForm(), ProjectForms() (+30 more)

### Community 15 - "OfficeScene.tsx"
Cohesion: 0.15
Nodes (35): withoutElapsed(), Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk() (+27 more)

### Community 16 - "process.ts"
Cohesion: 0.06
Nodes (31): Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), Transition, descriptionPreimage(), plain() (+23 more)

### Community 17 - "ref_node_path"
Cohesion: 0.07
Nodes (51): ref_node_fs, ref_node_os, ref_node_path, ref_node_util, interruptedImplementation(), verifyContinuationPreservation(), nativeCompletion(), Assessment (+43 more)

### Community 18 - ".save"
Cohesion: 0.05
Nodes (80): correlatedBuild(), CommentPage, commentReadback(), JiraOperations, plain(), jiraRecord(), unpack(), jiraCollection() (+72 more)

### Community 19 - "sanitize"
Cohesion: 0.07
Nodes (32): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+24 more)

### Community 20 - "agents.ts"
Cohesion: 0.05
Nodes (57): cecChatPrompt(), ctoChatPrompt(), itChatPrompt(), SlackResultSchema, SlackVerificationSchema, candidateWorkspaceEnvironment(), requireDeliveryAuthority(), HANDS_OFF_RESOLUTION_GUIDANCE (+49 more)

### Community 21 - "ref_zod"
Cohesion: 0.06
Nodes (50): ref_zod, ApproachSchema, maintenancePolicies(), completeNativeCheckpoint(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, BrainStatusSchema (+42 more)

### Community 22 - "shared.ts"
Cohesion: 0.08
Nodes (23): applyIntakeObservation(), ctoInputIdentityMatches(), ctoInputRecovered(), ctoReplacementResolution(), PackedPublicationRepair, OfficeQAReport, QAPlanContinuation, SlackReplacementRequest (+15 more)

### Community 23 - "scheduled-captures.ts"
Cohesion: 0.15
Nodes (41): createFeature(), assertEnrollable(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest, captureRequests(), failCapture() (+33 more)

### Community 24 - "constellation-runtime.ts"
Cohesion: 0.10
Nodes (22): ref_3d_force_graph, ref_three, CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point (+14 more)

### Community 25 - "Goals.tsx"
Cohesion: 0.15
Nodes (18): SendMessage, CTOReview(), goalState, DailyCTO(), GoalHistory(), load(), reportDate(), reviewStatus (+10 more)

### Community 26 - "run-retrospective.ts"
Cohesion: 0.09
Nodes (46): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, blockingTrigger, isBlocking(), brainOverlap (+38 more)

### Community 27 - "features/commands.ts"
Cohesion: 0.15
Nodes (26): commandFeature(), reviewQuestions(), automaticIntakeWait(), assertQuestionVisibility(), applyHarnessAction(), HarnessActionInput, recoveryPreconditions(), recoveryTarget() (+18 more)

### Community 28 - "azure.ts"
Cohesion: 0.16
Nodes (20): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+12 more)

### Community 29 - "completedExecution"
Cohesion: 0.12
Nodes (45): retryRead(), admitPRMetadata(), assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema, savedMetadataAssessment(), validateSaved() (+37 more)

### Community 30 - "lesson-selection.ts"
Cohesion: 0.07
Nodes (37): ref_node_stream, ref_node_timers, args, [cmd,...rawArgs], commands, key, projectIndex, fileLessonIssue() (+29 more)

### Community 31 - "ControlStore"
Cohesion: 0.18
Nodes (5): DailyCTO, Briefing, saveReviewBriefing(), ControlStore, DailyCTOReport

### Community 32 - "PeoplePanel.tsx"
Cohesion: 0.10
Nodes (39): label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+31 more)

### Community 33 - "pilot-delivery.ts"
Cohesion: 0.17
Nodes (29): continueImplementation(), dispatchNightly(), drainDelivery(), requestDelivery(), resume(), startPilot(), OfficeQAHandoffInput, Attempt (+21 more)

### Community 34 - "TimeBook.tsx"
Cohesion: 0.09
Nodes (43): TelemetryReport, displayAgentTask(), LiveAgentTask(), Props, RunningTask(), text(), AzureBuild, src_shared_liveanchor (+35 more)

### Community 35 - "weekly-rollup.ts"
Cohesion: 0.09
Nodes (35): learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), BRAIN_SCOPE (+27 more)

### Community 36 - "task-briefing.ts"
Cohesion: 0.17
Nodes (16): guidanceExcerpt(), citations(), recordAcceptedKnowledge(), stageName(), knowledgeCitation(), lessonCitation(), officeSearch(), words() (+8 more)

### Community 37 - "record-trigger.ts"
Cohesion: 0.11
Nodes (36): LEARNING_BASELINES, clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates(), maintenanceCompletedId(), maintenanceKey(), visibleMaintenanceTriggerIds() (+28 more)

### Community 38 - "scheduled-work.ts"
Cohesion: 0.11
Nodes (29): deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), metadataRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), legacy (+21 more)

### Community 39 - "ledger.ts"
Cohesion: 0.10
Nodes (35): diagnosticSnapshot(), INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationCandidates(), investigationId(), investigationEvidence(), investigationFollowUps(), implementationReplacementResolution() (+27 more)

### Community 40 - "time-scope.ts"
Cohesion: 0.12
Nodes (34): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), server_telemetry_billable_work_issue_key, isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence() (+26 more)

### Community 41 - "source-amendment.ts"
Cohesion: 0.07
Nodes (67): ref_node_async_hooks, adoptCandidate(), directionContract(), scopeRepairDirection(), approvedText(), assert(), amendmentInstruction(), amendmentIssueSha256() (+59 more)

### Community 42 - "run-accounting.ts"
Cohesion: 0.11
Nodes (34): BoundedRead, done(), readBoundedNoFollow(), reasonOf(), EvidenceOutcome, backfillClaudeCost(), CompletionReader, codexHome() (+26 more)

### Community 43 - "cost-ledger.ts"
Cohesion: 0.16
Nodes (27): captureCost(), server_telemetry_cost_entries_costcoveragesummary, costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress() (+19 more)

### Community 44 - "telemetry.ts"
Cohesion: 0.09
Nodes (28): CodexRollout, CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL (+20 more)

### Community 45 - "coordination.ts"
Cohesion: 0.07
Nodes (46): MergeNotifications, reconcileNoticeConfirmations(), Admission, admit(), IntakeContext, WAIT_STATUSES, compatible(), dependencyCompletionKey() (+38 more)

### Community 46 - "ref_node_crypto"
Cohesion: 0.14
Nodes (29): ref_node_crypto, featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), reserveReplacement(), stageBudget(), classifyFeatureFailure(), automaticEnabled() (+21 more)

### Community 47 - "notifications.ts"
Cohesion: 0.17
Nodes (14): ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR, plainSlackText() (+6 more)

### Community 48 - "knowledge.ts"
Cohesion: 0.12
Nodes (27): clip(), DEMAND_LIMIT, demandFacts(), DemandSection, key(), LessonKey, notes(), clip() (+19 more)

### Community 49 - "session-bridge.ts"
Cohesion: 0.06
Nodes (53): ref_node_perf_hooks, ref_ws, claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexDaemonProcesses(), accountCodexProcesses() (+45 more)

### Community 50 - "candidate.ts"
Cohesion: 0.10
Nodes (26): ref_node_child_process, ref_node_url, file, folder, logs, root, GitRead, nativeGitRead() (+18 more)

### Community 51 - "assignments.ts"
Cohesion: 0.08
Nodes (29): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, CommittedBrain (+21 more)

### Community 52 - "ticket-evidence.ts"
Cohesion: 0.20
Nodes (20): assetDownloader(), attachmentKind(), evidenceDirectory(), readEvidence(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS (+12 more)

### Community 53 - "work.ts"
Cohesion: 0.11
Nodes (22): BLOCKED_CAUSES, blockedCauses(), projectReadiness(), explanation(), LABELS, stoppedReason(), ProjectReadiness, AssignmentResult (+14 more)

### Community 54 - "outbox.ts"
Cohesion: 0.11
Nodes (30): projectOutbox(), syncOutbox(), projectSlackDeliveries(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint(), slackRequestSettled() (+22 more)

### Community 55 - "Role"
Cohesion: 0.11
Nodes (19): ROLES, DeliverySlot, officeCapacity, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork() (+11 more)

### Community 56 - "office-lessons.ts"
Cohesion: 0.25
Nodes (10): normalizeStatement(), decideOfficeProposal(), mirrorOfficeKnowledge(), now(), OfficeKnowledgeStore, proposeOfficeLessons(), retireOfficeLesson(), Input (+2 more)

### Community 57 - "admit-improvement.ts"
Cohesion: 0.21
Nodes (16): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+8 more)

### Community 58 - "remove-candidate.ts"
Cohesion: 0.18
Nodes (18): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot() (+10 more)

### Community 59 - "executeRequest"
Cohesion: 0.08
Nodes (4): packed165SetupReady(), coordination(), Coordinator, executeRequest()

### Community 60 - "it-specialist.ts"
Cohesion: 0.17
Nodes (18): partialLocalCleanupKey(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), ITContext, publishITReport(), nativeDeliveryResolved() (+10 more)

### Community 61 - "daily-cto.ts"
Cohesion: 0.10
Nodes (24): EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), applyGoalReview(), DailyResultSchema, EvidenceRefSchema, FreshDailyResultSchema, statusAllowed() (+16 more)

### Community 62 - "FeatureWorkspace.tsx"
Cohesion: 0.11
Nodes (28): FeatureQuestionProjection, OutboxQuestionRound(), send(), FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases (+20 more)

### Community 63 - "workKey"
Cohesion: 0.14
Nodes (21): draftReadHeadMatches(), assertDraftClaimHistory(), linkDraftIssue(), protectedOriginalClaim(), publicationReadArgs(), Read, readPublication(), boardPreflightCandidate() (+13 more)

### Community 64 - ".emit"
Cohesion: 0.21
Nodes (23): decideImplementation(), requestQAPlanRetry(), configureNotices(), retryRecipientLookup(), recoverCTOInput(), enqueueGreen156(), failedWorker(), requeueWaitedImplement() (+15 more)

### Community 65 - "service-health.ts"
Cohesion: 0.16
Nodes (11): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, slackHealth() (+3 more)

### Community 66 - "jira-time.ts"
Cohesion: 0.15
Nodes (18): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+10 more)

### Community 67 - "github-check-selection.ts"
Cohesion: 0.21
Nodes (19): checksFailed(), checksPassed(), checksPending(), CurrentChecksWait, currentMergeChecks(), pass(), pending(), requireThat() (+11 more)

### Community 68 - "index.ts"
Cohesion: 0.09
Nodes (36): ref_hono_node_server, ref_node_http, ref_vite, implementationPreview(), implementationContinuationRoute(), qaPlanRetryRoute(), close(), config (+28 more)

### Community 69 - ".getEffect"
Cohesion: 0.11
Nodes (19): featureById(), Link, linkFeature(), publishFeature(), reconcilePublication(), uncertainPublications(), reserveIdentity(), featureRoute() (+11 more)

### Community 70 - "record-push.ts"
Cohesion: 0.15
Nodes (17): Event, one(), prePushRejection(), PushIdentity, Candidate, recordedPush(), settledPushBoundary(), At (+9 more)

### Community 71 - "assignment-poll.ts"
Cohesion: 0.19
Nodes (11): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), admitReadyCards(), resumeParked() (+3 more)

### Community 72 - "store.ts"
Cohesion: 0.10
Nodes (24): ref_node_sqlite, snapshot(), Clock, EASTERN, easternDayFormatter, easternPartsFormatter, systemClock, DATA (+16 more)

### Community 73 - "retrospective-subject.ts"
Cohesion: 0.18
Nodes (15): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+7 more)

### Community 74 - "node-visuals.ts"
Cohesion: 0.20
Nodes (13): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+5 more)

### Community 75 - "Store"
Cohesion: 0.08
Nodes (34): assertOwnership(), ImplementationDecision, OwnershipRead, closedReadonlyPlan(), Document, consumeQAPlanRetry(), continueOwnershipRead(), continueUnsealedQA() (+26 more)

### Community 76 - "goal-reporting.ts"
Cohesion: 0.09
Nodes (32): GitHubMonitor, githubPRDescription(), collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip() (+24 more)

### Community 77 - "preferences-store.ts"
Cohesion: 0.21
Nodes (8): fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS, OfficePreferences, OfficePreferencesPatch

### Community 78 - "learning-events.ts"
Cohesion: 0.24
Nodes (11): improvementIntakeGate(), captureLearning(), learningDigest(), recordLearningOpportunity(), baselineLearning(), expireLearningPackets(), maintainLearning(), packetReferences() (+3 more)

### Community 79 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 80 - "blocker-followups.ts"
Cohesion: 0.28
Nodes (13): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), readBackConversations(), handoff(), reconcileBlockerFollowups(), clearUnblockBrief() (+5 more)

### Community 81 - "capture-session-clone.py"
Cohesion: 0.15
Nodes (10): ctypes, errno, importlib_util, json, os, pathlib, Copy a coherent macOS clone of inherited reader fd3 to anonymous target fd4. No…, Read-only protocol adapter for the installed review helper. No model dispatch. (+2 more)

### Community 82 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (10): ref_react_three_drei, ref_react_three_fiber, ref_three_stdlib, CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility (+2 more)

### Community 83 - "discovery-recovery.ts"
Cohesion: 0.26
Nodes (11): Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership, rawHash() (+3 more)

### Community 84 - "lessons-view.ts"
Cohesion: 0.23
Nodes (11): OfficeProposal, RetrospectiveRecord, WeeklyRollup, lessonsView, newest(), ROLLUP_ROWS, TRIGGER_LABEL, src_shared_officeknowledge (+3 more)

### Community 85 - "evidence-digest.ts"
Cohesion: 0.44
Nodes (7): canonical(), evidenceDigest(), evidenceHash(), semantic(), stableUrl(), requirementDrift(), RequirementPostimage

### Community 86 - "OfficeSnapshot"
Cohesion: 0.08
Nodes (45): Conversation(), LessonDecisionAction, lessonDecisionState(), readLessonDecision(), Outbox(), ctoInputFailure(), OutboxCTOInput(), recover() (+37 more)

### Community 87 - "report.ts"
Cohesion: 0.29
Nodes (12): Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked(), row() (+4 more)

### Community 88 - "useOfficePreferences.ts"
Cohesion: 0.26
Nodes (10): acceptPreferences(), PreferenceCandidate, strip(), UNKNOWN_PREFERENCES, OfficePreferencesController, PreferenceFeedback, PreferenceField, requestPreferences() (+2 more)

### Community 89 - "conversations/slack.ts"
Cohesion: 0.11
Nodes (16): channelNoticeAuthorized(), slackSendPrompt(), slackVerifyPrompt(), comparableSlackText(), settleRequestedSlackReplacement(), SlackMessages, knowledgeChatPrompt(), goalNoticeAuthorized() (+8 more)

### Community 90 - "time-readback.ts"
Cohesion: 0.29
Nodes (6): TimeLedger, dueReadback(), Readback, READBACK_INTERVAL_MS, readBackTime(), SETTLE_MS

### Community 91 - "create-candidate.ts"
Cohesion: 0.26
Nodes (10): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+2 more)

### Community 92 - "stopped-base-validation.ts"
Cohesion: 0.47
Nodes (8): continuationNativeReview(), assertStoppedBaseApproach(), stoppedBaseNextStage(), stoppedBasePackedCommands(), assertAcceptedFiles(), assertStoppedBaseMergeReady(), assertStoppedBaseValidation(), stoppedBaseStageProof()

### Community 93 - "retire-history.ts"
Cohesion: 0.33
Nodes (7): readHistoryScope(), historicalRecordDigest(), Intent, records(), retireIncompleteHistory(), HistoryRetirement, HistoryRetirementIntent

### Community 94 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 95 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 96 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (6): ref_mammoth, ref_pdfjs_dist, bounded(), extract(), fail(), [path,kind]

### Community 97 - "cec-reads.ts"
Cohesion: 0.09
Nodes (31): IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), intakeMembership(), projectListScope(), cecIntakePrompt(), cecReadbackPrompt() (+23 more)

### Community 98 - "continue-access-only-plan.ts"
Cohesion: 0.57
Nodes (5): Document, isAccessOnlyPlan(), settledAccessOnlyState(), continueAccessOnlyPlan(), entryExists()

### Community 99 - "extraction.ts"
Cohesion: 0.33
Nodes (4): ref_node_string_decoder, extractDocument, Extraction, Extractor

### Community 100 - "it-agent.ts"
Cohesion: 0.60
Nodes (3): itAgent(), itDiagnostics(), Agent

## Knowledge Gaps
- **497 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+492 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 635 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `github-delivery.ts`, `requests.ts`, `digest`, `github-context.ts`, `artifact`, `Ticket`, `currentAssignment`, `dependency-bots/adopt.ts`, `engine.ts`, `features.ts`, `offices.ts`, `process.ts`, `ref_node_path`, `.save`, `sanitize`, `agents.ts`, `ref_zod`, `shared.ts`, `scheduled-captures.ts`, `run-retrospective.ts`, `features/commands.ts`, `azure.ts`, `completedExecution`, `lesson-selection.ts`, `pilot-delivery.ts`, `weekly-rollup.ts`, `task-briefing.ts`, `record-trigger.ts`, `scheduled-work.ts`, `ledger.ts`, `time-scope.ts`, `source-amendment.ts`, `run-accounting.ts`, `cost-ledger.ts`, `coordination.ts`, `ref_node_crypto`, `notifications.ts`, `knowledge.ts`, `session-bridge.ts`, `candidate.ts`, `assignments.ts`, `ticket-evidence.ts`, `outbox.ts`, `Role`, `office-lessons.ts`, `admit-improvement.ts`, `remove-candidate.ts`, `it-specialist.ts`, `daily-cto.ts`, `workKey`, `.emit`, `jira-time.ts`, `index.ts`, `.getEffect`, `record-push.ts`, `assignment-poll.ts`, `store.ts`, `retrospective-subject.ts`, `goal-reporting.ts`, `learning-events.ts`, `blocker-followups.ts`, `discovery-recovery.ts`, `OfficeSnapshot`, `conversations/slack.ts`, `time-readback.ts`, `create-candidate.ts`, `stopped-base-validation.ts`, `retire-history.ts`, `cec-reads.ts`, `continue-access-only-plan.ts`?**
  _High betweenness centrality (0.116) - this node is a cross-community bridge._
- **Why does `TicketJob` connect `github-delivery.ts` to `requests.ts`, `digest`, `github-context.ts`, `Inspector.tsx`, `artifact`, `Ticket`, `currentAssignment`, `dependency-bots/adopt.ts`, `App.tsx`, `ref_node_path`, `.save`, `agents.ts`, `ref_zod`, `shared.ts`, `completedExecution`, `pilot-delivery.ts`, `record-trigger.ts`, `source-amendment.ts`, `coordination.ts`, `outbox.ts`, `Role`, `remove-candidate.ts`, `it-specialist.ts`, `workKey`, `github-check-selection.ts`, `record-push.ts`, `assignment-poll.ts`, `retrospective-subject.ts`, `goal-reporting.ts`, `discovery-recovery.ts`, `OfficeSnapshot`, `create-candidate.ts`, `stopped-base-validation.ts`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `command()` connect `process.ts` to `github-delivery.ts`, `requests.ts`, `digest`, `github-context.ts`, `currentAssignment`, `dependency-bots/adopt.ts`, `engine.ts`, `features.ts`, `.save`, `agents.ts`, `ref_zod`, `azure.ts`, `completedExecution`, `lesson-selection.ts`, `weekly-rollup.ts`, `cost-ledger.ts`, `coordination.ts`, `ref_node_crypto`, `notifications.ts`, `session-bridge.ts`, `candidate.ts`, `assignments.ts`, `ticket-evidence.ts`, `remove-candidate.ts`, `executeRequest`, `workKey`, `service-health.ts`, `jira-time.ts`, `.getEffect`, `record-push.ts`, `Store`, `goal-reporting.ts`, `time-readback.ts`, `create-candidate.ts`, `command-registry.ts`, `continue-access-only-plan.ts`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _497 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `github-delivery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05216831258050666 - nodes in this community are weakly interconnected._
- **Should `requests.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1125886524822695 - nodes in this community are weakly interconnected._
- **Should `digest` be split into smaller, more focused modules?**
  _Cohesion score 0.0628212450028555 - nodes in this community are weakly interconnected._