# Graph Report - office-cec-list-intake-nov13  (2026-11-13)

## Corpus Check
- 742 files · ~305,726 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3817 nodes · 17864 edges · 113 communities (110 shown, 3 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 582 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8c67b00c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- artifact
- github-delivery.ts
- metadata-assessment.ts
- requests.ts
- MapView.tsx
- Inspector.tsx
- GitHubDelivery
- source-amendment.ts
- App.tsx
- Engine
- authorize.ts
- packed165-admission.ts
- shared.ts
- Button
- session-bridge.ts
- closeout-recovery.ts
- scheduled-captures.ts
- index.ts
- TimeBook.tsx
- store.ts
- conversations/slack.ts
- run.ts
- LessonsPanel.tsx
- run-retrospective.ts
- cec/workflow.ts
- record-trigger.ts
- index.tsx
- agents.ts
- digest
- time-scope.ts
- Role
- worker-runtime.ts
- .save
- process.ts
- weekly-rollup.ts
- JiraIssuePublisher
- outbox.ts
- assignments.ts
- scheduler.ts
- scheduled-work.ts
- lesson-selection.ts
- cost-ledger.ts
- OfficeScene.tsx
- features.ts
- maintenance/maintenance.ts
- telemetry.ts
- github/issue-publication.ts
- http/commands.ts
- demand-facts.ts
- goal-reporting.ts
- conversations/conversations.ts
- knowledge.ts
- ref_node_path
- admit-improvement.ts
- board-preflight.ts
- Effects
- features/commands.ts
- TicketJob
- ControlStore
- remove-candidate.ts
- dependency-bots/adopt.ts
- constellation-runtime.ts
- ticket-evidence.ts
- seeded-office-lessons.ts
- CommittedBrain
- run-accounting.ts
- Coordinator
- tracking-issue.ts
- local-config.ts
- control-store.ts
- azure.ts
- github-readiness.ts
- dependencies.ts
- assignment-poll.ts
- daily-cto.ts
- it-specialist.ts
- Store
- cec-reads.ts
- fact-bounds.ts
- projects.ts
- owned-artifact.ts
- scene-motion.ts
- accept-stage-result.ts
- publish-pr.ts
- ref_zod
- preferences-store.ts
- .emit
- Ticket
- effects.ts
- RoomCamera.tsx
- sanitize
- cec/issue-publication.ts
- createConstellation
- jira-time.ts
- WorkTime
- node-visuals.ts
- cli.ts
- useOfficePreferences.ts
- codex-rollout.ts
- command-registry.ts
- evidence-digest.ts
- mailbox.ts
- stopped-base-provider.ts
- extract-worker.mjs
- install-service.mjs
- .api
- workKey
- helper-evidence.py
- diagnostic-snapshot.ts
- pre-push-boundary.ts
- office-state-view.ts
- it-agent.ts
- ITFollowUps.tsx

## God Nodes (most connected - your core abstractions)
1. `Store` - 340 edges
2. `TicketJob` - 174 edges
3. `digest()` - 156 edges
4. `artifact()` - 129 edges
5. `GitHubDelivery` - 122 edges
6. `command()` - 109 edges
7. `workKey()` - 99 edges
8. `cx()` - 87 edges
9. `currentAssignment()` - 80 edges
10. `Button` - 77 edges

## Surprising Connections (you probably didn't know these)
- `DeliverySlot` --references--> `Role`  [EXTRACTED]
  server/office/projects.ts → src/shared.ts
- `projectOutbox()` --calls--> `deferredPickup()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/pickup-state.ts
- `projectOutbox()` --calls--> `parkedProviderWait()`  [EXTRACTED]
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

## Communities (113 total, 3 thin omitted)

### Community 0 - "artifact"
Cohesion: 0.09
Nodes (72): containedFile(), recordedPush(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash (+64 more)

### Community 1 - "github-delivery.ts"
Cohesion: 0.08
Nodes (48): findingsBlock(), HANDS_OFF_PROJECTS, handsOff(), BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction(), discover() (+40 more)

### Community 2 - "metadata-assessment.ts"
Cohesion: 0.14
Nodes (37): activeEffectId(), admitPRMetadata(), METADATA_FINDING, assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema, savedMetadataAssessment() (+29 more)

### Community 3 - "requests.ts"
Cohesion: 0.06
Nodes (78): boardPreflightCandidate(), recoveredFindingsResolved(), savedAdmissionUnresolved(), savedCandidateAdmission, hasSavedPrerequisiteResult(), beginPacked165Setup(), assertPostConflictFiles(), assertPostConflictOwnership() (+70 more)

### Community 4 - "MapView.tsx"
Cohesion: 0.07
Nodes (61): ref_react_markdown, ref_remark_gfm, ref_yaml, KnowledgeActivity, KnowledgeActivityPage, KnowledgeEdge, KnowledgeMap, KnowledgeNode (+53 more)

### Community 5 - "Inspector.tsx"
Cohesion: 0.12
Nodes (60): Conversation(), Outbox(), SendMessage, OutboxMaintenanceStatus(), SlackDeliveryCard(), ServiceHealthPanel(), followUp(), labels (+52 more)

### Community 6 - "GitHubDelivery"
Cohesion: 0.11
Nodes (26): removeAdoptedClone(), GitHubDelivery, stoppedBaseCheckout(), assertStoppedBaseApproach(), stoppedBaseNextStage(), stoppedBasePackageInstruction(), adoptedReviewCandidate(), ciCheckout() (+18 more)

### Community 7 - "source-amendment.ts"
Cohesion: 0.06
Nodes (77): adoptCandidate(), reported, Scope, assertScopeRepairResumeFindings(), directionContract(), directionPaths, originalClaim(), Ownership (+69 more)

### Community 8 - "App.tsx"
Cohesion: 0.05
Nodes (75): ref_lucide_react, ref_motion, ref_react_dom, compactSteps(), BrainDrawer(), themeColor, App(), BrainWorkspace (+67 more)

### Community 10 - "authorize.ts"
Cohesion: 0.07
Nodes (54): ref_node_url, approveFeature(), mutation(), approvedDelivery(), bindDelivery(), featureDeliveryContext(), featureEffectGate(), assertFeatureDependencyOrder() (+46 more)

### Community 11 - "packed165-admission.ts"
Cohesion: 0.18
Nodes (22): HarnessControl, withHarnessWork(), admitPacked165(), history(), makePacked165Candidate(), packed165CandidateIdentity(), packed165Subject(), retainedPacked165Effect() (+14 more)

### Community 12 - "shared.ts"
Cohesion: 0.06
Nodes (41): completedPRReviews(), eligible(), mergedByOwner(), ownerSettles(), retireExternalDeliveries(), settledExternalRepair(), ProjectReadiness, HistoryRetirement (+33 more)

### Community 13 - "Button"
Cohesion: 0.08
Nodes (43): FeatureQuestionProjection, FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), send(), phases, LinkedFeatures() (+35 more)

### Community 14 - "session-bridge.ts"
Cohesion: 0.07
Nodes (43): ref_ws, claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexDaemonProcesses(), accountCodexProcesses(), codexProcessInventory (+35 more)

### Community 15 - "closeout-recovery.ts"
Cohesion: 0.11
Nodes (46): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+38 more)

### Community 16 - "scheduled-captures.ts"
Cohesion: 0.15
Nodes (44): createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest, captureRequests() (+36 more)

### Community 17 - "index.ts"
Cohesion: 0.08
Nodes (39): ref_hono_node_server, ref_node_http, ref_vite, close(), config, itSpecialist, loadedRevision, offices (+31 more)

### Community 18 - "TimeBook.tsx"
Cohesion: 0.10
Nodes (39): TelemetryReport, AzureBuild, src_shared_liveanchor, ROLE_NAMES, BreakdownTable(), CostBar(), coverage(), pricedLabel() (+31 more)

### Community 19 - "store.ts"
Cohesion: 0.11
Nodes (41): ref_node_crypto, featureItemComplete(), reconcileFeatureCompletion(), discoveryPrompt(), planPrompt(), readEvidence(), helperTelemetry(), DELAYS (+33 more)

### Community 20 - "conversations/slack.ts"
Cohesion: 0.13
Nodes (16): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), MergeNotifications, comparableSlackText(), SlackMessages (+8 more)

### Community 21 - "run.ts"
Cohesion: 0.10
Nodes (34): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationCandidates(), investigationId(), investigationEvidence(), investigationFollowUps(), INVOCATION_SOURCE_REFS, invocationSource() (+26 more)

### Community 22 - "LessonsPanel.tsx"
Cohesion: 0.25
Nodes (15): LessonDecisionAction, lessonDecisionState(), readLessonDecision(), OutboxLessonDecision(), act(), readStatus(), LearningCoverage(), Evidence() (+7 more)

### Community 23 - "run-retrospective.ts"
Cohesion: 0.10
Nodes (41): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, blockingTrigger, isBlocking(), curateLesson() (+33 more)

### Community 24 - "cec/workflow.ts"
Cohesion: 0.14
Nodes (33): parksInJira(), run(), publicationEvidenceGap(), qaEvidenceGap(), resultGate(), stageResultGap(), namedRepairIds(), afterDraft() (+25 more)

### Community 25 - "record-trigger.ts"
Cohesion: 0.10
Nodes (41): LEARNING_BASELINES, maintenanceSubject(), MaintenanceSubjectFacts, clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates(), maintenanceCompletedId() (+33 more)

### Community 26 - "index.tsx"
Cohesion: 0.11
Nodes (44): ref_react, SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS, PickupForm() (+36 more)

### Community 27 - "agents.ts"
Cohesion: 0.10
Nodes (25): cecChatPrompt(), ctoChatPrompt(), itChatPrompt(), slackSendPrompt(), slackVerifyPrompt(), HANDS_OFF_RESOLUTION_GUIDANCE, RESOLUTION_GUIDANCE, PICKUP_CHAT (+17 more)

### Community 28 - "digest"
Cohesion: 0.08
Nodes (56): deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, deliveryIntakeBlocker(), gateRegisteredDelivery(), accounting, DeliverySubject (+48 more)

### Community 29 - "time-scope.ts"
Cohesion: 0.13
Nodes (29): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), server_telemetry_billable_work_issue_key, isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence() (+21 more)

### Community 30 - "Role"
Cohesion: 0.11
Nodes (42): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+34 more)

### Community 31 - "worker-runtime.ts"
Cohesion: 0.07
Nodes (35): SlackResultSchema, SlackVerificationSchema, candidateWorkspaceEnvironment(), ApproachSchema, assignmentSubject(), LessonSelection, catalogLine(), assertBriefingScope() (+27 more)

### Community 32 - ".save"
Cohesion: 0.17
Nodes (29): correlatedBuild(), BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue(), readIssues() (+21 more)

### Community 33 - "process.ts"
Cohesion: 0.11
Nodes (21): ref_node_child_process, inactivityWatch(), At, errno, GroupInventory, GroupProbe, LifecycleDiagnostic, Phase (+13 more)

### Community 34 - "weekly-rollup.ts"
Cohesion: 0.11
Nodes (30): deliveryMetrics(), median(), learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck() (+22 more)

### Community 35 - "JiraIssuePublisher"
Cohesion: 0.26
Nodes (3): JiraIssuePublisher, keyOf(), publicationDescription()

### Community 36 - "outbox.ts"
Cohesion: 0.14
Nodes (22): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), projectOutbox(), readBackConversations(), handoff(), reconcileBlockerFollowups() (+14 more)

### Community 37 - "assignments.ts"
Cohesion: 0.09
Nodes (34): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, GraphNode (+26 more)

### Community 38 - "scheduler.ts"
Cohesion: 0.12
Nodes (18): officeCapacity, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch(), deliveryOccupied() (+10 more)

### Community 39 - "scheduled-work.ts"
Cohesion: 0.16
Nodes (21): deliverySlot(), metadataRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), requestPriority(), deterministicActions, eligible(), requestResolved() (+13 more)

### Community 40 - "lesson-selection.ts"
Cohesion: 0.14
Nodes (20): INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), MAINTENANCE, MAX_LESSONS, normalPath() (+12 more)

### Community 41 - "cost-ledger.ts"
Cohesion: 0.18
Nodes (24): captureCost(), server_telemetry_cost_entries_costcoveragesummary, costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId() (+16 more)

### Community 42 - "OfficeScene.tsx"
Cohesion: 0.15
Nodes (35): withoutElapsed(), Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk() (+27 more)

### Community 43 - "features.ts"
Cohesion: 0.11
Nodes (39): dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), resume(), startPilot(), advance(), eligibility() (+31 more)

### Community 44 - "maintenance/maintenance.ts"
Cohesion: 0.09
Nodes (31): maintenancePolicies(), captureLearning(), captureMaintenanceStep(), BrainMaintenance, candidateOwner(), SETTLED, skipOwnedCandidate(), Skipped (+23 more)

### Community 45 - "telemetry.ts"
Cohesion: 0.10
Nodes (27): CodexRollout, CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL (+19 more)

### Community 46 - "github/issue-publication.ts"
Cohesion: 0.15
Nodes (11): FeaturePublisher, PublicationReceipt, Assign, Board, Content, GitHubIssuePublisher, number(), same() (+3 more)

### Community 47 - "http/commands.ts"
Cohesion: 0.12
Nodes (27): DiscoveryResumeInput, enqueueMetadataRecovery(), normalizeStatement(), baselineLearning(), configureKnowledge(), declineLessonIssue(), reactivateLesson(), retireLesson() (+19 more)

### Community 48 - "demand-facts.ts"
Cohesion: 0.11
Nodes (24): clip(), DEMAND_LIMIT, demandFacts(), DemandSection, key(), LessonKey, notes(), clip() (+16 more)

### Community 49 - "goal-reporting.ts"
Cohesion: 0.19
Nodes (14): githubPRDescription(), azureGoalFacts(), azurePRDescription(), boundedEvidence(), collectAzureGoalDocuments(), EvidenceStore, GOAL_EVIDENCE_LIMITS, GOAL_REPORT_GUIDANCE (+6 more)

### Community 50 - "conversations/conversations.ts"
Cohesion: 0.10
Nodes (25): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+17 more)

### Community 51 - "knowledge.ts"
Cohesion: 0.09
Nodes (28): SUBJECT, Kind, RetrospectiveResult, RetrospectiveResultSchema, RollupResultSchema, Stage, BlockerFollowup, ImprovementGrant (+20 more)

### Community 52 - "ref_node_path"
Cohesion: 0.10
Nodes (35): ref_node_fs, ref_node_os, ref_node_path, ref_node_util, Read, Candidate, advisoryPM(), assertCandidateChildContextCurrent() (+27 more)

### Community 53 - "admit-improvement.ts"
Cohesion: 0.14
Nodes (24): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementIntakeGate(), improvementManifest() (+16 more)

### Community 54 - "board-preflight.ts"
Cohesion: 0.19
Nodes (26): initialManualStart(), Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), ProjectCard, projectCards() (+18 more)

### Community 55 - "Effects"
Cohesion: 0.20
Nodes (11): GitHubOperations, validateGitHubIssue(), fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), lessonText(), Assessment, closeNativeRefresh() (+3 more)

### Community 56 - "features/commands.ts"
Cohesion: 0.15
Nodes (24): commandFeature(), reviewQuestions(), GitHubFeaturePublisher, FeaturePlanningBindings, assertQuestionVisibility(), applyHarnessAction(), HarnessActionInput, recoveryPreconditions() (+16 more)

### Community 57 - "TicketJob"
Cohesion: 0.07
Nodes (20): ProjectProgress, dependabotReviewGuidance(), DECISION_KINDS, needsDecision(), StageContext, APPROACH_GUIDANCE, deliveryTask(), DeliveryTaskInput (+12 more)

### Community 58 - "ControlStore"
Cohesion: 0.18
Nodes (7): DailyCTO, EvidenceRequestConflict, reviewWeekday(), Briefing, saveReviewBriefing(), ControlStore, DailyCTOReport

### Community 59 - "remove-candidate.ts"
Cohesion: 0.19
Nodes (17): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+9 more)

### Community 60 - "dependency-bots/adopt.ts"
Cohesion: 0.15
Nodes (29): Execute, readBackOrThrow(), adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR (+21 more)

### Community 61 - "constellation-runtime.ts"
Cohesion: 0.15
Nodes (17): ref_3d_force_graph, ref_three, CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point (+9 more)

### Community 62 - "ticket-evidence.ts"
Cohesion: 0.15
Nodes (22): ref_node_string_decoder, assetDownloader(), attachmentKind(), evidenceDirectory(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS (+14 more)

### Community 63 - "seeded-office-lessons.ts"
Cohesion: 0.38
Nodes (4): CONSOLIDATED, CONSOLIDATED_AT, SEEDS, SEEDS

### Community 65 - "run-accounting.ts"
Cohesion: 0.11
Nodes (30): BoundedRead, EvidenceOutcome, backfillClaudeCost(), CompletionReader, codexHome(), createdAt(), dayDirs(), header() (+22 more)

### Community 67 - "tracking-issue.ts"
Cohesion: 0.18
Nodes (14): ensureTrackingIssue(), findTrackingIssue(), ownTracking(), TrackingIssue, trackingIssueBody(), trackingIssueTitle(), trackingMarker(), DependencyBot (+6 more)

### Community 68 - "local-config.ts"
Cohesion: 0.18
Nodes (15): AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), goalEvidencePath(), localBindings, assertModelOverrides(), CODEX_DEFAULT_EFFORT, CODEX_DEFAULT_MODEL, CODEX_EFFORTS (+7 more)

### Community 69 - "control-store.ts"
Cohesion: 0.16
Nodes (11): ref_node_sqlite, Clock, applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, statementCache(), initialSnapshot() (+3 more)

### Community 70 - "azure.ts"
Cohesion: 0.20
Nodes (14): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+6 more)

### Community 71 - "github-readiness.ts"
Cohesion: 0.12
Nodes (34): harnessDelivers(), legacyRecovery(), resumeProviderReviews(), observe(), draftReadHeadMatches(), assertDraftClaimHistory(), linkDraftIssue(), protectedOriginalClaim() (+26 more)

### Community 72 - "dependencies.ts"
Cohesion: 0.19
Nodes (18): Admission, admit(), IntakeContext, WAIT_STATUSES, compatible(), dependencyEligibility(), DependencyStores, issueKey() (+10 more)

### Community 73 - "assignment-poll.ts"
Cohesion: 0.16
Nodes (19): clamp(), LIMITS, MergedPR, plainSlackText(), section(), shippedSummary(), configureNotices(), Identity (+11 more)

### Community 74 - "daily-cto.ts"
Cohesion: 0.10
Nodes (24): evidenceRequestConflicts, dailyReviewPrompt(), applyGoalReview(), DailyResultSchema, EvidenceRefSchema, FreshDailyResultSchema, GoalEvidenceRequestSchema, statusAllowed() (+16 more)

### Community 75 - "it-specialist.ts"
Cohesion: 0.14
Nodes (16): ITContext, publishITReport(), delays, recoverAttempt(), listenerHealth(), providers, ProviderStatusChecks, summary (+8 more)

### Community 76 - "Store"
Cohesion: 0.12
Nodes (9): seedOfficeLessons(), Store, markCaptureStart(), checkpointMeasurement(), HEARTBEAT_GAP_MS, HEARTBEAT_MS, startMeasurement(), WorkOutcome (+1 more)

### Community 77 - "cec-reads.ts"
Cohesion: 0.20
Nodes (15): IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), intakeMembership(), projectListScope(), cecPrompt(), cecIntakePrompt() (+7 more)

### Community 78 - "fact-bounds.ts"
Cohesion: 0.25
Nodes (15): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+7 more)

### Community 79 - "projects.ts"
Cohesion: 0.14
Nodes (11): ref_smol_toml, LOCAL_BINDINGS, file, project, root, DeliverySlot, projectById(), projectData() (+3 more)

### Community 80 - "owned-artifact.ts"
Cohesion: 0.54
Nodes (6): ghLogCacheEvidence(), done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf()

### Community 81 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 82 - "accept-stage-result.ts"
Cohesion: 0.15
Nodes (25): ref_node_async_hooks, acceptStageResult(), mergeAuthorized(), continuationNativeReview(), continuationReviewArtifacts(), savedNegativeContinuationReview(), discoveryReviewSatisfied(), ContinuationDecision (+17 more)

### Community 83 - "publish-pr.ts"
Cohesion: 0.15
Nodes (24): requireDeliveryAuthority(), harnessEffect, assertDeliveryMayMutate(), retryRead(), park(), assertCandidate(), Candidate, Execute (+16 more)

### Community 84 - "ref_zod"
Cohesion: 0.13
Nodes (18): ref_zod, completeNativeCheckpoint(), BRAIN_DEPENDENCY_MERGES, BrainResult, BrainStatusSchema, identity, coverageSchema, followupSchema (+10 more)

### Community 85 - "preferences-store.ts"
Cohesion: 0.17
Nodes (10): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS (+2 more)

### Community 86 - ".emit"
Cohesion: 0.08
Nodes (27): reconcileNoticeConfirmations(), dependencyCompletionKey(), PrerequisitesSchema, BrainFollowup, Result, brainCheckpointCompletion(), reconcileCompletedCheckpoints(), reconcileContinuations() (+19 more)

### Community 87 - "Ticket"
Cohesion: 0.23
Nodes (3): Agents, WorkerRuntime, Ticket

### Community 88 - "effects.ts"
Cohesion: 0.14
Nodes (14): featureById(), Link, linkFeature(), publishFeature(), reconcilePublication(), uncertainPublications(), reserveIdentity(), FeatureReviewRunner (+6 more)

### Community 89 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (10): ref_react_three_drei, ref_react_three_fiber, ref_three_stdlib, CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility (+2 more)

### Community 90 - "sanitize"
Cohesion: 0.23
Nodes (13): syncOutbox(), projectSlackDeliveries(), settleRequestedSlackReplacement(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint(), slackRequestSettled() (+5 more)

### Community 91 - "cec/issue-publication.ts"
Cohesion: 0.17
Nodes (12): CommentPage, commentReadback(), Assignment, Content, jiraText(), Transition, JiraOperations, plain() (+4 more)

### Community 92 - "createConstellation"
Cohesion: 0.19
Nodes (5): ConstellationRuntime, createConstellation(), enter(), finishTap(), move()

### Community 93 - "jira-time.ts"
Cohesion: 0.22
Nodes (13): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+5 more)

### Community 94 - "WorkTime"
Cohesion: 0.15
Nodes (21): TelemetryRow, TelemetrySync, ConfirmedSegment, LiveAnchor, ObservationGap, SnapshotOrdering, TimeLedgerState, WorkTime (+13 more)

### Community 95 - "node-visuals.ts"
Cohesion: 0.29
Nodes (7): LabelRectangle, visibleLabels(), stableHash(), stablePosition(), nodeVisuals(), SCENE_COLOR_TOKENS, TOKENS

### Community 96 - "cli.ts"
Cohesion: 0.20
Nodes (8): ref_node_stream, ref_node_timers, args, [cmd,...rawArgs], commands, key, projectIndex, PORT

### Community 97 - "useOfficePreferences.ts"
Cohesion: 0.26
Nodes (10): acceptPreferences(), PreferenceCandidate, strip(), UNKNOWN_PREFERENCES, OfficePreferencesController, PreferenceFeedback, PreferenceField, requestPreferences() (+2 more)

### Community 98 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 99 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 100 - "evidence-digest.ts"
Cohesion: 0.44
Nodes (7): canonical(), evidenceDigest(), evidenceHash(), semantic(), stableUrl(), requirementDrift(), RequirementPostimage

### Community 101 - "mailbox.ts"
Cohesion: 0.24
Nodes (8): applyIntakeObservation(), checkMail(), drainMail(), requestMail(), MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), ingest()

### Community 102 - "stopped-base-provider.ts"
Cohesion: 0.44
Nodes (7): pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), discussion(), pages(), pullIdentity(), readStoppedBaseProviderContext(), reviewThreads()

### Community 103 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (6): ref_mammoth, ref_pdfjs_dist, bounded(), extract(), fail(), [path,kind]

### Community 104 - "install-service.mjs"
Cohesion: 0.33
Nodes (4): file, folder, logs, root

### Community 105 - ".api"
Cohesion: 0.14
Nodes (23): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+15 more)

### Community 106 - "workKey"
Cohesion: 0.11
Nodes (35): recordJobApproach(), continuationScope(), Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), ownedArtifact(), Ownership (+27 more)

### Community 107 - "helper-evidence.py"
Cohesion: 0.33
Nodes (5): importlib_util, json, pathlib, Read-only protocol adapter for the installed review helper. No model dispatch., sys

### Community 108 - "diagnostic-snapshot.ts"
Cohesion: 0.46
Nodes (4): diagnosticContext(), diagnosticSnapshot(), nativeDeliveryResolved(), currentServices()

### Community 109 - "pre-push-boundary.ts"
Cohesion: 0.43
Nodes (5): Event, one(), prePushRejection(), PushIdentity, settledPushBoundary()

### Community 110 - "office-state-view.ts"
Cohesion: 0.60
Nodes (4): leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore()

### Community 111 - "it-agent.ts"
Cohesion: 0.60
Nodes (3): itAgent(), itDiagnostics(), Agent

### Community 112 - "ITFollowUps.tsx"
Cohesion: 0.67
Nodes (4): itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps()

## Knowledge Gaps
- **476 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+471 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 605 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `artifact`, `github-delivery.ts`, `metadata-assessment.ts`, `requests.ts`, `GitHubDelivery`, `source-amendment.ts`, `App.tsx`, `Engine`, `authorize.ts`, `packed165-admission.ts`, `shared.ts`, `session-bridge.ts`, `closeout-recovery.ts`, `scheduled-captures.ts`, `index.ts`, `store.ts`, `conversations/slack.ts`, `run.ts`, `run-retrospective.ts`, `cec/workflow.ts`, `record-trigger.ts`, `agents.ts`, `digest`, `time-scope.ts`, `worker-runtime.ts`, `.save`, `process.ts`, `weekly-rollup.ts`, `JiraIssuePublisher`, `outbox.ts`, `assignments.ts`, `scheduler.ts`, `scheduled-work.ts`, `lesson-selection.ts`, `cost-ledger.ts`, `features.ts`, `maintenance/maintenance.ts`, `github/issue-publication.ts`, `http/commands.ts`, `demand-facts.ts`, `goal-reporting.ts`, `conversations/conversations.ts`, `ref_node_path`, `admit-improvement.ts`, `board-preflight.ts`, `Effects`, `features/commands.ts`, `TicketJob`, `remove-candidate.ts`, `dependency-bots/adopt.ts`, `ticket-evidence.ts`, `run-accounting.ts`, `Coordinator`, `tracking-issue.ts`, `control-store.ts`, `azure.ts`, `github-readiness.ts`, `dependencies.ts`, `assignment-poll.ts`, `daily-cto.ts`, `it-specialist.ts`, `cec-reads.ts`, `accept-stage-result.ts`, `publish-pr.ts`, `ref_zod`, `.emit`, `Ticket`, `effects.ts`, `sanitize`, `cec/issue-publication.ts`, `jira-time.ts`, `stopped-base-provider.ts`, `.api`, `workKey`, `diagnostic-snapshot.ts`, `office-state-view.ts`?**
  _High betweenness centrality (0.098) - this node is a cross-community bridge._
- **Why does `command()` connect `process.ts` to `github-delivery.ts`, `metadata-assessment.ts`, `requests.ts`, `GitHubDelivery`, `source-amendment.ts`, `Engine`, `authorize.ts`, `packed165-admission.ts`, `shared.ts`, `session-bridge.ts`, `closeout-recovery.ts`, `store.ts`, `conversations/slack.ts`, `cec/workflow.ts`, `agents.ts`, `worker-runtime.ts`, `.save`, `weekly-rollup.ts`, `JiraIssuePublisher`, `assignments.ts`, `scheduler.ts`, `scheduled-work.ts`, `cost-ledger.ts`, `features.ts`, `maintenance/maintenance.ts`, `github/issue-publication.ts`, `goal-reporting.ts`, `ref_node_path`, `admit-improvement.ts`, `board-preflight.ts`, `Effects`, `features/commands.ts`, `TicketJob`, `remove-candidate.ts`, `ticket-evidence.ts`, `Coordinator`, `azure.ts`, `github-readiness.ts`, `dependencies.ts`, `assignment-poll.ts`, `it-specialist.ts`, `publish-pr.ts`, `ref_zod`, `.emit`, `Ticket`, `effects.ts`, `cec/issue-publication.ts`, `jira-time.ts`, `command-registry.ts`, `.api`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `Coordinator` connect `Coordinator` to `artifact`, `github-delivery.ts`, `requests.ts`, `scheduled-work.ts`, `dependencies.ts`, `assignment-poll.ts`, `Store`, `scheduled-captures.ts`, `store.ts`, `ref_zod`, `.emit`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _476 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `artifact` be split into smaller, more focused modules?**
  _Cohesion score 0.08858024691358024 - nodes in this community are weakly interconnected._
- **Should `github-delivery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07867494824016563 - nodes in this community are weakly interconnected._
- **Should `metadata-assessment.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1396078431372549 - nodes in this community are weakly interconnected._