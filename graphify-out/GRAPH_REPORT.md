# Graph Report - office-cec-readback-nov13  (2026-11-13)

## Corpus Check
- 743 files · ~306,427 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3822 nodes · 17897 edges · 105 communities (103 shown, 2 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 582 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `412b2303`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- github-delivery.ts
- source-amendment.ts
- agents.ts
- dependency-bots/adopt.ts
- Button
- Inspector.tsx
- recovery/stopped-base-update.ts
- Store
- enrollment-gate.ts
- features/workflow.ts
- activation-recovery.ts
- Goals.tsx
- artifact
- index.tsx
- cec/issue-publication.ts
- index.ts
- session-bridge.ts
- closeout-recovery.ts
- features.ts
- conversations/conversations.ts
- github-readiness.ts
- requests.ts
- reader.ts
- shared.ts
- App.tsx
- Effects
- digest
- .transaction
- accept-stage-result.ts
- ref_zod
- run.ts
- run-retrospective.ts
- knowledge.ts
- record-trigger.ts
- publish-pr.ts
- remove-candidate.ts
- ticket-stage-runner.ts
- conversations/slack.ts
- retire-history.ts
- coordination.ts
- assignments.ts
- security.ts
- dependencies.ts
- .emit
- service-health.ts
- contract.ts
- cost-ledger.ts
- OfficeScene.tsx
- source-amendment-scope.ts
- github/issue-publication.ts
- TimeBook.tsx
- lesson-selection.ts
- telemetry.ts
- weekly-rollup.ts
- ticket-evidence.ts
- run-accounting.ts
- .save
- Coordinator
- time-scope.ts
- scheduled-features.ts
- admit-improvement.ts
- sanitize
- daily-cto.ts
- constellation-runtime.ts
- store.ts
- Engine
- assignment-poll.ts
- create-candidate.ts
- scheduled-work.ts
- Offices
- jira-time.ts
- retrospective-subject.ts
- blocker-followups.ts
- local-config.ts
- goal-reporting.ts
- report.ts
- scene-motion.ts
- scheduler.ts
- workKey
- RoomCamera.tsx
- Conversation.tsx
- Agents
- preferences-store.ts
- node-visuals.ts
- .getEffect
- engine.ts
- learning-events.ts
- cec/workflow.ts
- codex-rollout.ts
- extract-worker.mjs
- office-lessons.ts
- install-service.mjs
- run-evidence.ts
- http/context.ts
- OfficeConfigView.tsx
- helper-evidence.py
- it-specialist.ts
- evidence.ts
- approach.ts
- ProjectProgress
- cli.ts
- requeue-waited-implement.ts
- unblock-brief.ts
- delivery-task.ts
- highestStableAtLeast

## God Nodes (most connected - your core abstractions)
1. `Store` - 341 edges
2. `TicketJob` - 174 edges
3. `digest()` - 156 edges
4. `artifact()` - 129 edges
5. `GitHubDelivery` - 122 edges
6. `command()` - 108 edges
7. `workKey()` - 99 edges
8. `cx()` - 87 edges
9. `currentAssignment()` - 82 edges
10. `Button` - 77 edges

## Surprising Connections (you probably didn't know these)
- `projectOutbox()` --calls--> `deferredPickup()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/pickup-state.ts
- `projectOutbox()` --calls--> `parkedProviderWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts
- `projectOutbox()` --calls--> `readinessNeedsFollowup()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts
- `projectOutbox()` --calls--> `readinessWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts
- `replacementContext()` --calls--> `slackMessageUrl()`  [EXTRACTED]
  server/conversations/slack/supersession-proof.ts → src/shared.ts

## Import Cycles
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/parking/resume-provider-review.ts -> server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/parking/resume-provider-review.ts`
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

## Communities (105 total, 2 thin omitted)

### Community 0 - "github-delivery.ts"
Cohesion: 0.05
Nodes (85): ref_node_fs, ref_node_path, Execute, installDependencies(), major(), removeAdoptedClone(), namedRepairIds(), BOARD_RULE (+77 more)

### Community 1 - "source-amendment.ts"
Cohesion: 0.08
Nodes (64): adoptCandidate(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat() (+56 more)

### Community 2 - "agents.ts"
Cohesion: 0.05
Nodes (73): intakeMembership(), cecPrompt(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), resolvedDecisionNote(), stageInstructions (+65 more)

### Community 3 - "dependency-bots/adopt.ts"
Cohesion: 0.10
Nodes (41): Execute, readBackOrThrow(), adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR (+33 more)

### Community 4 - "Button"
Cohesion: 0.07
Nodes (60): ref_motion, ref_react, ref_react_markdown, ref_remark_gfm, ref_yaml, KnowledgeActivity, KnowledgeActivityPage, KnowledgeEdge (+52 more)

### Community 5 - "Inspector.tsx"
Cohesion: 0.13
Nodes (57): currentServices(), ServiceHealthPanel(), followUp(), labels, ServiceHealthRow(), BlockerFollowups(), LearningCoverage(), LessonsPanel() (+49 more)

### Community 6 - "recovery/stopped-base-update.ts"
Cohesion: 0.12
Nodes (28): pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), assertStoppedBaseAudit(), AuditRow, CoverageRow, Hash, Kind, stoppedBaseAuditMarker (+20 more)

### Community 7 - "Store"
Cohesion: 0.08
Nodes (12): GitHubFeaturePublisher, FeatureReviewRunner, Store, CommandRegistry, CommandScope, inside(), RegisteredCommand, inactivityWatch() (+4 more)

### Community 8 - "enrollment-gate.ts"
Cohesion: 0.15
Nodes (44): createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest, captureRequests() (+36 more)

### Community 9 - "features/workflow.ts"
Cohesion: 0.08
Nodes (48): approveFeature(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), discoveryPrompt(), planPrompt(), artifactPath() (+40 more)

### Community 10 - "activation-recovery.ts"
Cohesion: 0.07
Nodes (67): recordJobApproach(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal (+59 more)

### Community 11 - "Goals.tsx"
Cohesion: 0.06
Nodes (52): FeatureQuestionProjection, FeatureRound, GoalProgress, SendMessage, FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace() (+44 more)

### Community 12 - "artifact"
Cohesion: 0.06
Nodes (90): ref_node_os, ref_node_util, Candidate, recordedPush(), allowed, continuationNativeReview(), continuationWorkerProof(), negativeWorker() (+82 more)

### Community 13 - "index.tsx"
Cohesion: 0.08
Nodes (53): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS, PickupForm(), acceptPreferences() (+45 more)

### Community 14 - "cec/issue-publication.ts"
Cohesion: 0.10
Nodes (18): Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), Transition, descriptionPreimage(), plain() (+10 more)

### Community 15 - "index.ts"
Cohesion: 0.12
Nodes (20): ref_hono_node_server, ref_node_http, close(), config, itSpecialist, loadedRevision, offices, releaseLock (+12 more)

### Community 16 - "session-bridge.ts"
Cohesion: 0.07
Nodes (43): ref_ws, claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexDaemonProcesses(), accountCodexProcesses(), codexProcessInventory (+35 more)

### Community 17 - "closeout-recovery.ts"
Cohesion: 0.08
Nodes (54): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+46 more)

### Community 18 - "features.ts"
Cohesion: 0.10
Nodes (39): commandFeature(), reviewQuestions(), FeatureCommandSchema, confirmBrief(), FeaturePlanningBindings, applyHarnessAction(), HarnessActionInput, recoveryPreconditions() (+31 more)

### Community 19 - "conversations/conversations.ts"
Cohesion: 0.10
Nodes (19): ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff(), saveGoals() (+11 more)

### Community 20 - "github-readiness.ts"
Cohesion: 0.12
Nodes (37): resumeProviderReviews(), observe(), assertAutomationEffects(), automationMergePolicy(), observeAutomationMerge(), routeAutomationMerge(), checksFailed(), checksPassed() (+29 more)

### Community 21 - "requests.ts"
Cohesion: 0.11
Nodes (35): deliveryAdmission(), DeliveryAuthorityInput, requireDeliveryAuthority(), accounting, DeliverySubject, nonDelivery, originalReads, HarnessControl (+27 more)

### Community 22 - "reader.ts"
Cohesion: 0.09
Nodes (29): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, CommittedBrain (+21 more)

### Community 23 - "shared.ts"
Cohesion: 0.05
Nodes (69): ProjectReadiness, DailyCTOSummary, PackedPublicationRepair, Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId (+61 more)

### Community 24 - "App.tsx"
Cohesion: 0.05
Nodes (76): ref_lucide_react, ref_react_dom, compactSteps(), itAgent(), itDiagnostics(), BrainDrawer(), themeColor, App() (+68 more)

### Community 25 - "Effects"
Cohesion: 0.19
Nodes (19): activeEffectId(), harnessEffect, draftReadHeadMatches(), assertDraftClaimHistory(), linkDraftIssue(), protectedOriginalClaim(), publicationReadArgs(), readPublication() (+11 more)

### Community 26 - "digest"
Cohesion: 0.14
Nodes (41): ref_node_async_hooks, admitPRMetadata(), assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema, savedMetadataAssessment(), validateSaved() (+33 more)

### Community 27 - ".transaction"
Cohesion: 0.11
Nodes (34): ref_node_crypto, featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS, reserveReplacement() (+26 more)

### Community 28 - "accept-stage-result.ts"
Cohesion: 0.08
Nodes (53): containedFile(), findingsBlock(), assessDeliveryAuthority(), assessDeliveryEligibility(), deliveryIntakeBlocker(), gateRegisteredDelivery(), resolveDeliveryWork(), HANDS_OFF_PROJECTS (+45 more)

### Community 29 - "ref_zod"
Cohesion: 0.06
Nodes (42): ref_zod, maintenancePolicies(), captureMaintenanceStep(), completeNativeCheckpoint(), BRAIN_DEPENDENCY_MERGES, Result, BrainMaintenance, BrainResult (+34 more)

### Community 30 - "run.ts"
Cohesion: 0.15
Nodes (23): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationCandidates(), investigationId(), investigationFollowUps(), investigationResolution(), syncInvestigations(), NOTIFY_HELPER (+15 more)

### Community 31 - "run-retrospective.ts"
Cohesion: 0.17
Nodes (21): acceptRetrospective(), BLOCKING, blockingTrigger, isBlocking(), KnowledgeContext, withDemand(), appendLearningFacts(), freezeLearningPacket() (+13 more)

### Community 32 - "knowledge.ts"
Cohesion: 0.06
Nodes (50): Accepted, RETROSPECTIVE_HISTORY, Shared, curateLesson(), Curation, CurationAction, mergeEvidence(), DemandSection (+42 more)

### Community 33 - "record-trigger.ts"
Cohesion: 0.11
Nodes (35): LEARNING_BASELINES, maintainLearning(), clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates(), maintenanceCompletedId(), visibleMaintenanceTriggerIds() (+27 more)

### Community 34 - "publish-pr.ts"
Cohesion: 0.13
Nodes (29): moveLane(), harnessCloseout(), PASSING, verifyMergeActions(), assertDeliveryMayMutate(), withHarnessWork(), retryRead(), runHarnessStage() (+21 more)

### Community 35 - "remove-candidate.ts"
Cohesion: 0.18
Nodes (18): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot() (+10 more)

### Community 36 - "ticket-stage-runner.ts"
Cohesion: 0.22
Nodes (19): run(), publicationEvidenceGap(), qaEvidenceGap(), resultGate(), stageResultGap(), approachFingerprint(), enqueueRepairDiagnosis(), jiraRepairable() (+11 more)

### Community 37 - "conversations/slack.ts"
Cohesion: 0.14
Nodes (15): channelNoticeAuthorized(), ChannelSettings, notices(), queueChannelNotice(), comparableSlackText(), SlackMessages, SlackRequestSchema, goalNoticeAuthorized() (+7 more)

### Community 38 - "retire-history.ts"
Cohesion: 0.36
Nodes (6): historicalRecordDigest(), Intent, records(), retireIncompleteHistory(), HistoryRetirement, HistoryRetirementIntent

### Community 39 - "coordination.ts"
Cohesion: 0.11
Nodes (25): reconcileNoticeConfirmations(), dependencyCompletionKey(), brainCheckpointCompletion(), reconcileCompletedCheckpoints(), reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION (+17 more)

### Community 40 - "assignments.ts"
Cohesion: 0.11
Nodes (25): clip(), DEMAND_LIMIT, demandFacts(), key(), LessonKey, notes(), assignmentLookups, Binding (+17 more)

### Community 41 - "security.ts"
Cohesion: 0.11
Nodes (29): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+21 more)

### Community 42 - "dependencies.ts"
Cohesion: 0.09
Nodes (29): MergeNotifications, Admission, admit(), IntakeContext, WAIT_STATUSES, dependencyEligibility(), DependencyStores, observePrerequisites() (+21 more)

### Community 43 - ".emit"
Cohesion: 0.19
Nodes (20): configureChannelNotices(), configureNotices(), retryRecipientLookup(), enqueueGreen156(), bindDiscoveryResume(), DiscoveryResumeInput, enqueueMetadataRecovery(), baselineLearning() (+12 more)

### Community 44 - "service-health.ts"
Cohesion: 0.20
Nodes (8): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, ServiceHealth

### Community 45 - "contract.ts"
Cohesion: 0.17
Nodes (15): Event, one(), prePushRejection(), PushIdentity, settledPushBoundary(), At, errno, GroupInventory (+7 more)

### Community 46 - "cost-ledger.ts"
Cohesion: 0.17
Nodes (25): captureCost(), server_telemetry_cost_entries_costcoveragesummary, costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId() (+17 more)

### Community 47 - "OfficeScene.tsx"
Cohesion: 0.17
Nodes (33): withoutElapsed(), Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk() (+25 more)

### Community 48 - "source-amendment-scope.ts"
Cohesion: 0.08
Nodes (34): approvedText(), assert(), assert(), normalize(), officialUrls, ReleaseCapture, verifyReleaseCaptures(), capture (+26 more)

### Community 49 - "github/issue-publication.ts"
Cohesion: 0.20
Nodes (24): Lane, MOVABLE, resolveLane(), cardStatus(), ProjectCard, projectCards(), projectGraphql(), setCardStatus() (+16 more)

### Community 50 - "TimeBook.tsx"
Cohesion: 0.11
Nodes (37): LiveAnchor, AzureBuild, src_shared_liveanchor, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens() (+29 more)

### Community 51 - "lesson-selection.ts"
Cohesion: 0.10
Nodes (25): fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, LessonSelection (+17 more)

### Community 52 - "telemetry.ts"
Cohesion: 0.10
Nodes (25): CodexRollout, CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL (+17 more)

### Community 53 - "weekly-rollup.ts"
Cohesion: 0.12
Nodes (29): learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), RollupResult (+21 more)

### Community 54 - "ticket-evidence.ts"
Cohesion: 0.09
Nodes (38): ref_node_string_decoder, CommentPage, commentReadback(), JiraOperations, plain(), unpack(), jiraRecord(), assetDownloader() (+30 more)

### Community 55 - "run-accounting.ts"
Cohesion: 0.12
Nodes (32): BoundedRead, done(), readBoundedNoFollow(), reasonOf(), CompletionReader, codexHome(), createdAt(), dayDirs() (+24 more)

### Community 56 - ".save"
Cohesion: 0.24
Nodes (23): BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue(), readIssues(), commentDecision() (+15 more)

### Community 57 - "Coordinator"
Cohesion: 0.08
Nodes (3): seedOfficeLessons(), Coordinator, markCaptureStart()

### Community 58 - "time-scope.ts"
Cohesion: 0.12
Nodes (32): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), server_telemetry_billable_work_issue_key, isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence() (+24 more)

### Community 59 - "scheduled-features.ts"
Cohesion: 0.15
Nodes (21): compatible(), issueKey(), validatePrerequisites(), featureById(), currentApproval(), Link, linkFeature(), recoveryHeld() (+13 more)

### Community 60 - "admit-improvement.ts"
Cohesion: 0.20
Nodes (17): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+9 more)

### Community 61 - "sanitize"
Cohesion: 0.11
Nodes (25): projectOutbox(), syncOutbox(), projectSlackDeliveries(), settleRequestedSlackReplacement(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint() (+17 more)

### Community 62 - "daily-cto.ts"
Cohesion: 0.06
Nodes (44): leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), collectCTOFacts(), DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts (+36 more)

### Community 63 - "constellation-runtime.ts"
Cohesion: 0.10
Nodes (22): ref_3d_force_graph, ref_three, CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point (+14 more)

### Community 64 - "store.ts"
Cohesion: 0.12
Nodes (21): ref_node_sqlite, ref_smol_toml, Clock, file, project, root, projectById(), projectData() (+13 more)

### Community 65 - "Engine"
Cohesion: 0.10
Nodes (5): correlatedBuild(), Engine, observe(), observeParked(), parkedReadError

### Community 66 - "assignment-poll.ts"
Cohesion: 0.13
Nodes (20): clamp(), LIMITS, MergedPR, plainSlackText(), section(), shippedSummary(), Identity, mergeText() (+12 more)

### Community 67 - "create-candidate.ts"
Cohesion: 0.48
Nodes (6): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf()

### Community 68 - "scheduled-work.ts"
Cohesion: 0.13
Nodes (22): closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), metadataRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), legacy, requestPriority() (+14 more)

### Community 70 - "jira-time.ts"
Cohesion: 0.15
Nodes (19): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+11 more)

### Community 71 - "retrospective-subject.ts"
Cohesion: 0.18
Nodes (14): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, maintenanceKey(), azurePrUrl(), findSubject(), jobSubject() (+6 more)

### Community 72 - "blocker-followups.ts"
Cohesion: 0.24
Nodes (13): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), canFileGithubIssue(), readBackConversations(), diagnosticContext(), diagnosticSnapshot() (+5 more)

### Community 73 - "local-config.ts"
Cohesion: 0.14
Nodes (20): IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), projectListScope(), AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), goalEvidencePath() (+12 more)

### Community 74 - "goal-reporting.ts"
Cohesion: 0.11
Nodes (26): assertConversationReadback(), finishSupersededReadback(), pump(), savePickup(), GitHubMonitor, githubPRDescription(), harperHandoff(), azureGoalFacts() (+18 more)

### Community 75 - "report.ts"
Cohesion: 0.22
Nodes (15): TelemetryReport, TelemetryRow, TelemetrySync, Acc, bump(), EASTERN, easternDay(), modelShares() (+7 more)

### Community 76 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 77 - "scheduler.ts"
Cohesion: 0.15
Nodes (15): deliverySlot(), ROLES, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch() (+7 more)

### Community 78 - "workKey"
Cohesion: 0.21
Nodes (18): completedPRReviews(), dependencyVersion(), handoffSavedPrerequisites(), hasSavedPrerequisiteResult(), Ownership, qualified(), readDependencies(), requireSavedPrerequisites() (+10 more)

### Community 79 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (10): ref_react_three_drei, ref_react_three_fiber, ref_three_stdlib, CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility (+2 more)

### Community 80 - "Conversation.tsx"
Cohesion: 0.16
Nodes (23): Conversation(), Outbox(), LessonDecisionAction, lessonDecisionState(), readLessonDecision(), OutboxLessonDecision(), act(), readStatus() (+15 more)

### Community 81 - "Agents"
Cohesion: 0.15
Nodes (6): itChatPrompt(), featureDeliveryContext(), knowledgeChatPrompt(), Agents, WorkerRuntime, send()

### Community 82 - "preferences-store.ts"
Cohesion: 0.21
Nodes (8): PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS, OfficePreferences

### Community 83 - "node-visuals.ts"
Cohesion: 0.29
Nodes (7): LabelRectangle, visibleLabels(), stableHash(), stablePosition(), nodeVisuals(), SCENE_COLOR_TOKENS, TOKENS

### Community 84 - ".getEffect"
Cohesion: 0.26
Nodes (6): GitHubOperations, validateGitHubIssue(), Assessment, closeNativeRefresh(), fingerprint(), EffectIntent

### Community 85 - "engine.ts"
Cohesion: 0.27
Nodes (14): dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), resume(), startPilot(), eligibility(), assertFeatureGate() (+6 more)

### Community 86 - "learning-events.ts"
Cohesion: 0.25
Nodes (11): improvementIntakeGate(), learningDigest(), recordLearningOpportunity(), expireLearningPackets(), packetReferences(), citations(), recordAcceptedKnowledge(), stageName() (+3 more)

### Community 87 - "cec/workflow.ts"
Cohesion: 0.23
Nodes (10): applyIntakeObservation(), checkMail(), drainMail(), requestMail(), MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), advance() (+2 more)

### Community 88 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 89 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (6): ref_mammoth, ref_pdfjs_dist, bounded(), extract(), fail(), [path,kind]

### Community 90 - "office-lessons.ts"
Cohesion: 0.27
Nodes (9): normalizeStatement(), decideOfficeProposal(), now(), OfficeKnowledgeStore, proposeOfficeLessons(), retireOfficeLesson(), Input, promoteNoteLesson() (+1 more)

### Community 91 - "install-service.mjs"
Cohesion: 0.16
Nodes (11): ref_node_child_process, ref_node_url, file, folder, logs, root, GIT_NETWORK, LIVE_PROVIDERS (+3 more)

### Community 92 - "run-evidence.ts"
Cohesion: 0.38
Nodes (5): comparable(), EvidenceOutcome, recordRunEvidence(), backfillClaudeCost(), RunAccounting

### Community 93 - "http/context.ts"
Cohesion: 0.24
Nodes (10): ref_vite, ITSpecialist, ServiceContext, OfficeConfigInputs, officeConfigRoute(), officeConfigSummary(), CECBinding, runtimeRevision() (+2 more)

### Community 94 - "OfficeConfigView.tsx"
Cohesion: 0.52
Nodes (5): loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView(), OfficeConfigSummary

### Community 95 - "helper-evidence.py"
Cohesion: 0.33
Nodes (5): importlib_util, json, pathlib, Read-only protocol adapter for the installed review helper. No model dispatch., sys

### Community 96 - "it-specialist.ts"
Cohesion: 0.24
Nodes (12): partialLocalCleanupKey(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), ITContext, publishITReport(), delays (+4 more)

### Community 97 - "evidence.ts"
Cohesion: 0.26
Nodes (9): investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_SOURCE_PATHS, officeSource(), readOwnedSessionArtifact(), launchPolicyFacts() (+1 more)

### Community 98 - "approach.ts"
Cohesion: 0.49
Nodes (9): afterDraft(), firstBuildStage(), missingApproachStage(), plannedNext(), recordApproach(), reroute(), stageNeeded(), unresolvedVerification() (+1 more)

### Community 100 - "cli.ts"
Cohesion: 0.22
Nodes (7): ref_node_stream, ref_node_timers, args, [cmd,...rawArgs], commands, key, projectIndex

### Community 101 - "requeue-waited-implement.ts"
Cohesion: 0.36
Nodes (6): parksInJira(), DECISION_KINDS, needsDecision(), APPROACH_GUARD_REJECTION, failedWorker(), requeueWaitedImplement()

### Community 102 - "unblock-brief.ts"
Cohesion: 0.53
Nodes (5): clearUnblockBrief(), key(), saveUnblockBrief(), unblockBrief, src_shared_learningsubject

### Community 103 - "delivery-task.ts"
Cohesion: 0.50
Nodes (3): DeliveryTaskInput, DISCOVERY_GUIDANCE, AMENDMENT_REVIEW_PROOF

### Community 104 - "highestStableAtLeast"
Cohesion: 0.83
Nodes (3): compare(), highestStableAtLeast(), parts()

## Knowledge Gaps
- **477 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+472 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 606 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `github-delivery.ts`, `source-amendment.ts`, `agents.ts`, `dependency-bots/adopt.ts`, `recovery/stopped-base-update.ts`, `enrollment-gate.ts`, `features/workflow.ts`, `activation-recovery.ts`, `artifact`, `cec/issue-publication.ts`, `session-bridge.ts`, `closeout-recovery.ts`, `features.ts`, `conversations/conversations.ts`, `github-readiness.ts`, `requests.ts`, `reader.ts`, `App.tsx`, `Effects`, `digest`, `.transaction`, `accept-stage-result.ts`, `ref_zod`, `run.ts`, `run-retrospective.ts`, `knowledge.ts`, `record-trigger.ts`, `publish-pr.ts`, `remove-candidate.ts`, `ticket-stage-runner.ts`, `conversations/slack.ts`, `retire-history.ts`, `coordination.ts`, `assignments.ts`, `security.ts`, `dependencies.ts`, `.emit`, `cost-ledger.ts`, `github/issue-publication.ts`, `lesson-selection.ts`, `weekly-rollup.ts`, `ticket-evidence.ts`, `run-accounting.ts`, `.save`, `Coordinator`, `time-scope.ts`, `scheduled-features.ts`, `admit-improvement.ts`, `sanitize`, `daily-cto.ts`, `store.ts`, `assignment-poll.ts`, `create-candidate.ts`, `scheduled-work.ts`, `jira-time.ts`, `retrospective-subject.ts`, `blocker-followups.ts`, `goal-reporting.ts`, `scheduler.ts`, `workKey`, `Agents`, `.getEffect`, `engine.ts`, `learning-events.ts`, `office-lessons.ts`, `run-evidence.ts`, `it-specialist.ts`, `evidence.ts`, `requeue-waited-implement.ts`, `delivery-task.ts`?**
  _High betweenness centrality (0.101) - this node is a cross-community bridge._
- **Why does `command()` connect `Store` to `github-delivery.ts`, `source-amendment.ts`, `agents.ts`, `features/workflow.ts`, `artifact`, `cec/issue-publication.ts`, `session-bridge.ts`, `closeout-recovery.ts`, `github-readiness.ts`, `requests.ts`, `reader.ts`, `digest`, `.transaction`, `ref_zod`, `publish-pr.ts`, `remove-candidate.ts`, `ticket-stage-runner.ts`, `coordination.ts`, `security.ts`, `dependencies.ts`, `service-health.ts`, `contract.ts`, `cost-ledger.ts`, `github/issue-publication.ts`, `lesson-selection.ts`, `weekly-rollup.ts`, `ticket-evidence.ts`, `.save`, `Engine`, `assignment-poll.ts`, `create-candidate.ts`, `scheduled-work.ts`, `jira-time.ts`, `goal-reporting.ts`, `.getEffect`, `engine.ts`, `install-service.mjs`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `ControlStore` connect `daily-cto.ts` to `store.ts`, `office-lessons.ts`, `.transaction`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _477 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `github-delivery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.04924242424242424 - nodes in this community are weakly interconnected._
- **Should `source-amendment.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07511737089201878 - nodes in this community are weakly interconnected._
- **Should `agents.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05188118811881188 - nodes in this community are weakly interconnected._