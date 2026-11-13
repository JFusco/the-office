# Graph Report - the-office  (2026-11-13)

## Corpus Check
- 750 files · ~310,530 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3851 nodes · 18017 edges · 90 communities (87 shown, 3 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 583 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a210c889`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- github-delivery.ts
- .transaction
- dependency-bots/adopt.ts
- Inspector.tsx
- activation-recovery.ts
- ticket-evidence.ts
- JiraIssuePublisher
- Role
- features/workflow.ts
- ref_node_util
- App.tsx
- agents.ts
- digest
- artifact
- worker-runtime.ts
- assignments.ts
- Button
- session-bridge.ts
- ControlStore
- TicketJob
- maintenance/maintenance.ts
- sanitizeObject
- run-retrospective.ts
- lesson-selection.ts
- scheduled-captures.ts
- features.ts
- index.ts
- index.tsx
- shared.ts
- work-summary.ts
- record-push.ts
- closeout-recovery.ts
- demand-facts.ts
- PeoplePanel.tsx
- engine.ts
- cec/workflow.ts
- readback-evidence.ts
- TimeBook.tsx
- weekly-rollup.ts
- record-trigger.ts
- cost-ledger.ts
- source-amendment.ts
- constellation-runtime.ts
- learning-events.ts
- control-store.ts
- easternDay
- OfficeScene.tsx
- http/commands.ts
- run.ts
- telemetry.ts
- run-accounting.ts
- OfficeSnapshot
- config.ts
- CEC
- jira-time.ts
- workKey
- daily-cto.ts
- retire-history.ts
- ITFollowUps.tsx
- Store
- knowledge.ts
- time-scope.ts
- scope-repair-resume.ts
- scene-motion.ts
- fact-bounds.ts
- ref_node_crypto
- admit-improvement.ts
- outbox.ts
- .emit
- node-visuals.ts
- notifications.ts
- Effects
- report.ts
- RoomCamera.tsx
- OutboxLessonDecision.tsx
- it-agent.ts
- codex-rollout.ts
- CommandRegistry
- extract-worker.mjs
- helper-evidence.py
- .save
- run-evidence.ts
- blocker-followups.ts
- create-candidate.ts
- createConstellation
- Offices
- useOfficePreferences.ts
- ProjectProgress
- CommittedBrain
- offices.ts

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
- `projectOutbox()` --calls--> `parkedProviderWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts
- `projectOutbox()` --calls--> `readinessWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts
- `replacementContext()` --calls--> `slackMessageUrl()`  [EXTRACTED]
  server/conversations/slack/supersession-proof.ts → src/shared.ts
- `pump()` --calls--> `deferredPickup()`  [EXTRACTED]
  server/conversations/team-conversation-pump.ts → src/work/pickup-state.ts
- `DeliveryAuthorityInput` --references--> `HarnessRequest`  [EXTRACTED]
  server/delivery/harness/delivery-authority.ts → src/contracts/work.ts

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

## Communities (90 total, 3 thin omitted)

### Community 0 - "github-delivery.ts"
Cohesion: 0.05
Nodes (117): findingsBlock(), deliveryIntakeBlocker(), gateRegisteredDelivery(), assertDeliveryMayMutate(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery() (+109 more)

### Community 1 - ".transaction"
Cohesion: 0.10
Nodes (29): featureItemComplete(), reconcileFeatureCompletion(), readEvidence(), helperTelemetry(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS, requestReplan() (+21 more)

### Community 2 - "dependency-bots/adopt.ts"
Cohesion: 0.05
Nodes (90): initialManualStart(), Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard (+82 more)

### Community 3 - "Inspector.tsx"
Cohesion: 0.16
Nodes (51): Conversation(), Outbox(), SendMessage, OutboxMaintenanceStatus(), SlackDeliveryCard(), ServiceHealthPanel(), followUp(), labels (+43 more)

### Community 4 - "activation-recovery.ts"
Cohesion: 0.05
Nodes (107): ref_node_os, activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal (+99 more)

### Community 5 - "ticket-evidence.ts"
Cohesion: 0.06
Nodes (48): ref_node_child_process, ref_node_string_decoder, ref_node_url, file, folder, logs, root, CommentPage (+40 more)

### Community 6 - "JiraIssuePublisher"
Cohesion: 0.14
Nodes (9): JiraIssuePublisher, keyOf(), publicationDescription(), PublicationReceipt, GitHubIssuePublisher, number(), same(), FeatureManifestItem (+1 more)

### Community 7 - "Role"
Cohesion: 0.10
Nodes (23): ROLES, DATA, LOCAL_BINDINGS, DeliverySlot, officeCapacity, PROJECTS, withCECGoalEvidence(), fifo() (+15 more)

### Community 8 - "features/workflow.ts"
Cohesion: 0.13
Nodes (20): featureById(), discoveryPrompt(), planPrompt(), document(), Link, linkFeature(), confirmBrief(), automaticEnabled() (+12 more)

### Community 9 - "ref_node_util"
Cohesion: 0.13
Nodes (45): ref_node_util, activeEffectId(), admitPRMetadata(), assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema, savedMetadataAssessment() (+37 more)

### Community 10 - "App.tsx"
Cohesion: 0.06
Nodes (52): ref_lucide_react, ref_motion, ref_react_dom, BrainDrawer(), themeColor, App(), BrainWorkspace, CONNECTION (+44 more)

### Community 11 - "agents.ts"
Cohesion: 0.06
Nodes (47): IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), intakeMembership(), projectListScope(), cecPrompt(), cecIntakePrompt() (+39 more)

### Community 12 - "digest"
Cohesion: 0.07
Nodes (68): deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, requireDeliveryAuthority(), accounting, DeliverySubject, nonDelivery (+60 more)

### Community 13 - "artifact"
Cohesion: 0.09
Nodes (63): continuationNativeReview(), assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), reconcileCompletedConflictDraft(), routeReadyPostConflictPublication() (+55 more)

### Community 14 - "worker-runtime.ts"
Cohesion: 0.06
Nodes (43): ref_zod, candidateWorkspaceEnvironment(), assignmentSubject(), lessonPurpose(), selectLessons(), catalogLine(), assertBriefingScope(), contextPacket() (+35 more)

### Community 15 - "assignments.ts"
Cohesion: 0.09
Nodes (35): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, GraphNode (+27 more)

### Community 16 - "Button"
Cohesion: 0.07
Nodes (66): ref_react, ref_react_markdown, ref_remark_gfm, ref_yaml, KnowledgeActivity, KnowledgeActivityPage, KnowledgeEdge, KnowledgeMap (+58 more)

### Community 17 - "session-bridge.ts"
Cohesion: 0.07
Nodes (46): ref_ws, claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexDaemonProcesses(), accountCodexProcesses(), codexProcessInventory (+38 more)

### Community 18 - "ControlStore"
Cohesion: 0.16
Nodes (6): DailyCTO, Briefing, saveReviewBriefing(), ControlStore, OfficeKnowledge, DailyCTOReport

### Community 19 - "TicketJob"
Cohesion: 0.06
Nodes (56): ref_node_fs, ref_node_path, Execute, installDependencies(), major(), removeAdoptedClone(), harnessCloseout(), PASSING (+48 more)

### Community 20 - "maintenance/maintenance.ts"
Cohesion: 0.07
Nodes (39): maintenancePolicies(), captureMaintenanceStep(), completeNativeCheckpoint(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, BrainStatusSchema, identity (+31 more)

### Community 21 - "sanitizeObject"
Cohesion: 0.10
Nodes (32): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+24 more)

### Community 22 - "run-retrospective.ts"
Cohesion: 0.09
Nodes (45): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, blockingTrigger, isBlocking(), brainOverlap (+37 more)

### Community 23 - "lesson-selection.ts"
Cohesion: 0.07
Nodes (31): ref_node_stream, ref_node_timers, args, [cmd,...rawArgs], commands, key, projectIndex, lessonBrainAudit (+23 more)

### Community 24 - "scheduled-captures.ts"
Cohesion: 0.15
Nodes (44): createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest, captureRequests() (+36 more)

### Community 25 - "features.ts"
Cohesion: 0.06
Nodes (61): descriptionPreimage(), plain(), approveFeature(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), artifactPath() (+53 more)

### Community 26 - "index.ts"
Cohesion: 0.07
Nodes (44): ref_hono_node_server, ref_node_http, ref_vite, AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), close(), config, itSpecialist (+36 more)

### Community 27 - "index.tsx"
Cohesion: 0.10
Nodes (46): LearningCoverage(), when(), LessonsView(), SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm() (+38 more)

### Community 28 - "shared.ts"
Cohesion: 0.05
Nodes (39): fields, PreferencesPatch, PreferencesStore, StoredBody, ProjectReadiness, PackedPublicationRepair, SlackReplacementRequest, SlackSupersession (+31 more)

### Community 29 - "work-summary.ts"
Cohesion: 0.12
Nodes (28): compactSteps(), BARE_UUID, COMPOSITE, strip(), SUBJECT, subjectLabel(), envelopeCard, deliveryRepairProjection() (+20 more)

### Community 30 - "record-push.ts"
Cohesion: 0.14
Nodes (17): Event, one(), prePushRejection(), PushIdentity, Candidate, recordedPush(), settledPushBoundary(), At (+9 more)

### Community 31 - "closeout-recovery.ts"
Cohesion: 0.10
Nodes (41): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+33 more)

### Community 32 - "demand-facts.ts"
Cohesion: 0.11
Nodes (23): clip(), DEMAND_LIMIT, demandFacts(), DemandSection, key(), LessonKey, notes(), clip() (+15 more)

### Community 33 - "PeoplePanel.tsx"
Cohesion: 0.12
Nodes (37): Department, DEPARTMENTS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS, Directory() (+29 more)

### Community 34 - "engine.ts"
Cohesion: 0.17
Nodes (26): dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), resume(), startPilot(), eligibility(), featureEffectGate() (+18 more)

### Community 35 - "cec/workflow.ts"
Cohesion: 0.12
Nodes (36): applyIntakeObservation(), checkMail(), drainMail(), requestMail(), parksInJira(), MISSING_INTAKE, reconcileMailbox(), unusedMailbox() (+28 more)

### Community 36 - "readback-evidence.ts"
Cohesion: 0.10
Nodes (38): HarnessControl, withHarnessWork(), draftReadHeadMatches(), assertDraftClaimHistory(), linkDraftIssue(), protectedOriginalClaim(), publicationReadArgs(), Read (+30 more)

### Community 37 - "TimeBook.tsx"
Cohesion: 0.09
Nodes (44): TelemetryReport, displayAgentTask(), withoutElapsed(), LiveAgentTask(), Props, RunningTask(), text(), AzureBuild (+36 more)

### Community 38 - "weekly-rollup.ts"
Cohesion: 0.14
Nodes (19): deliveryMetrics(), median(), learningMetrics(), BRAIN_SCOPE, RollupResult, KnowledgeRunner, RETROSPECTIVE_TIMEOUT, lastFriday() (+11 more)

### Community 39 - "record-trigger.ts"
Cohesion: 0.08
Nodes (55): LEARNING_BASELINES, maintainLearning(), maintenanceSubject(), MaintenanceSubjectFacts, clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates() (+47 more)

### Community 40 - "cost-ledger.ts"
Cohesion: 0.14
Nodes (29): captureCost(), server_telemetry_cost_entries_costcoveragesummary, costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress() (+21 more)

### Community 41 - "source-amendment.ts"
Cohesion: 0.06
Nodes (67): ref_node_async_hooks, DeliveryTaskInput, DISCOVERY_GUIDANCE, approvedText(), assert(), AMENDMENT_REVIEW_PROOF, amendmentIssueSha256(), authorizeSourceAmendment() (+59 more)

### Community 42 - "constellation-runtime.ts"
Cohesion: 0.15
Nodes (17): ref_3d_force_graph, ref_three, CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point (+9 more)

### Community 43 - "learning-events.ts"
Cohesion: 0.25
Nodes (12): captureLearning(), learningDigest(), recordLearningOpportunity(), expireLearningPackets(), packetReferences(), citations(), recordAcceptedKnowledge(), stageName() (+4 more)

### Community 44 - "control-store.ts"
Cohesion: 0.12
Nodes (15): ref_node_sqlite, Clock, applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, statementCache(), initialSnapshot() (+7 more)

### Community 45 - "easternDay"
Cohesion: 0.19
Nodes (17): expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), dailyReviewDate(), reviewWeekday() (+9 more)

### Community 46 - "OfficeScene.tsx"
Cohesion: 0.16
Nodes (34): Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk(), ElevatorStage() (+26 more)

### Community 47 - "http/commands.ts"
Cohesion: 0.14
Nodes (25): configureNotices(), noticeState(), retryRecipientLookup(), PrerequisitesSchema, enqueueGreen156(), bindDiscoveryResume(), discoveryRecoveryCandidate(), DiscoveryResumeInput (+17 more)

### Community 48 - "run.ts"
Cohesion: 0.10
Nodes (34): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationCandidates(), investigationId(), investigationEvidence(), investigationFollowUps(), INVOCATION_SOURCE_REFS, invocationSource() (+26 more)

### Community 49 - "telemetry.ts"
Cohesion: 0.10
Nodes (25): CodexRollout, CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL (+17 more)

### Community 50 - "run-accounting.ts"
Cohesion: 0.12
Nodes (30): BoundedRead, done(), readBoundedNoFollow(), readBoundedNoFollowSync(), reasonOf(), CompletionReader, codexHome(), createdAt() (+22 more)

### Community 51 - "OfficeSnapshot"
Cohesion: 0.07
Nodes (46): FeatureQuestionProjection, FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), send(), phases, LinkedFeatures() (+38 more)

### Community 52 - "config.ts"
Cohesion: 0.04
Nodes (64): MergeNotifications, Admission, admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, resumeParked(), compatible() (+56 more)

### Community 53 - "CEC"
Cohesion: 0.09
Nodes (26): savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), ITContext, diagnosticContext(), diagnosticSnapshot(), publishITReport() (+18 more)

### Community 54 - "jira-time.ts"
Cohesion: 0.11
Nodes (26): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+18 more)

### Community 55 - "workKey"
Cohesion: 0.47
Nodes (7): completedPRReviews(), eligible(), mergedByOwner(), ownerSettles(), retireExternalDeliveries(), settledExternalRepair(), workKey()

### Community 56 - "daily-cto.ts"
Cohesion: 0.10
Nodes (25): EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), applyGoalReview(), DailyResultSchema, EvidenceRefSchema, FreshDailyResultSchema, GoalEvidenceRequestSchema (+17 more)

### Community 57 - "retire-history.ts"
Cohesion: 0.33
Nodes (7): enqueueHistoryRetirement(), historicalRecordDigest(), Intent, records(), retireIncompleteHistory(), HistoryRetirement, HistoryRetirementIntent

### Community 58 - "ITFollowUps.tsx"
Cohesion: 0.67
Nodes (4): itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps()

### Community 60 - "Store"
Cohesion: 0.04
Nodes (37): correlatedBuild(), Assignment, Content, jiraText(), Transition, GitHubFeaturePublisher, JiraFeaturePublisher, GitHubMonitor (+29 more)

### Community 61 - "knowledge.ts"
Cohesion: 0.08
Nodes (35): normalizeStatement(), decideOfficeProposal(), now(), OfficeKnowledgeStore, proposeOfficeLessons(), retireOfficeLesson(), Input, promoteNoteLesson() (+27 more)

### Community 62 - "time-scope.ts"
Cohesion: 0.14
Nodes (26): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), server_telemetry_billable_work_issue_key, isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence() (+18 more)

### Community 63 - "scope-repair-resume.ts"
Cohesion: 0.14
Nodes (33): containedFile(), candidateInput(), children, oldAdoptionBasis(), savedCandidateAdmission, Assessment, outsideScanSources(), Ownership (+25 more)

### Community 64 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 65 - "fact-bounds.ts"
Cohesion: 0.26
Nodes (14): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+6 more)

### Community 66 - "ref_node_crypto"
Cohesion: 0.15
Nodes (28): ref_node_crypto, commandFeature(), reviewQuestions(), FeaturePlanningBindings, FeaturePlanningConfig, POLICY_VERSION, assertQuestionVisibility(), applyHarnessAction() (+20 more)

### Community 68 - "admit-improvement.ts"
Cohesion: 0.21
Nodes (16): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+8 more)

### Community 69 - "outbox.ts"
Cohesion: 0.11
Nodes (25): conversationResolved(), projectOutbox(), syncOutbox(), projectSlackDeliveries(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint() (+17 more)

### Community 70 - ".emit"
Cohesion: 0.08
Nodes (35): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+27 more)

### Community 71 - "node-visuals.ts"
Cohesion: 0.20
Nodes (13): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+5 more)

### Community 72 - "notifications.ts"
Cohesion: 0.16
Nodes (16): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR (+8 more)

### Community 73 - "Effects"
Cohesion: 0.19
Nodes (13): diagnosticProof(), ownedArtifact(), rawHash(), recoverDiscovery(), GitHubOperations, fileLessonIssue(), lessonIssueBody(), lessonIssueMarker() (+5 more)

### Community 76 - "report.ts"
Cohesion: 0.26
Nodes (13): TelemetryRow, TelemetrySync, Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount() (+5 more)

### Community 77 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (10): ref_react_three_drei, ref_react_three_fiber, ref_three_stdlib, CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility (+2 more)

### Community 78 - "OutboxLessonDecision.tsx"
Cohesion: 0.35
Nodes (10): LessonDecisionAction, lessonDecisionState(), readLessonDecision(), OutboxLessonDecision(), act(), readStatus(), Evidence(), LessonCard() (+2 more)

### Community 80 - "it-agent.ts"
Cohesion: 0.60
Nodes (3): itAgent(), itDiagnostics(), Agent

### Community 81 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 84 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (6): ref_mammoth, ref_pdfjs_dist, bounded(), extract(), fail(), [path,kind]

### Community 85 - "helper-evidence.py"
Cohesion: 0.33
Nodes (5): importlib_util, json, pathlib, Read-only protocol adapter for the installed review helper. No model dispatch., sys

### Community 86 - ".save"
Cohesion: 0.23
Nodes (23): BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue(), readIssues(), commentDecision() (+15 more)

### Community 87 - "run-evidence.ts"
Cohesion: 0.38
Nodes (5): comparable(), EvidenceOutcome, recordRunEvidence(), backfillClaudeCost(), RunAccounting

### Community 89 - "blocker-followups.ts"
Cohesion: 0.27
Nodes (13): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), readBackConversations(), handoff(), reconcileBlockerFollowups(), clearUnblockBrief(), key() (+5 more)

### Community 90 - "create-candidate.ts"
Cohesion: 0.48
Nodes (6): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf()

### Community 100 - "createConstellation"
Cohesion: 0.19
Nodes (5): ConstellationRuntime, createConstellation(), enter(), finishTap(), move()

### Community 102 - "Offices"
Cohesion: 0.18
Nodes (3): QuestionNotifications, projectById(), Offices

### Community 103 - "useOfficePreferences.ts"
Cohesion: 0.23
Nodes (11): acceptPreferences(), PreferenceCandidate, PreferenceState, strip(), UNKNOWN_PREFERENCES, OfficePreferencesController, PreferenceFeedback, PreferenceField (+3 more)

### Community 106 - "offices.ts"
Cohesion: 0.17
Nodes (13): ref_smol_toml, leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), seedOfficeLessons(), DELIVERY_CONCURRENCY, file (+5 more)

## Knowledge Gaps
- **476 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+471 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 605 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `github-delivery.ts`, `.transaction`, `dependency-bots/adopt.ts`, `activation-recovery.ts`, `ticket-evidence.ts`, `Role`, `features/workflow.ts`, `ref_node_util`, `agents.ts`, `digest`, `artifact`, `worker-runtime.ts`, `assignments.ts`, `session-bridge.ts`, `TicketJob`, `maintenance/maintenance.ts`, `sanitizeObject`, `run-retrospective.ts`, `lesson-selection.ts`, `scheduled-captures.ts`, `features.ts`, `index.ts`, `record-push.ts`, `closeout-recovery.ts`, `demand-facts.ts`, `engine.ts`, `readback-evidence.ts`, `weekly-rollup.ts`, `record-trigger.ts`, `cost-ledger.ts`, `source-amendment.ts`, `learning-events.ts`, `control-store.ts`, `easternDay`, `http/commands.ts`, `run.ts`, `run-accounting.ts`, `OfficeSnapshot`, `config.ts`, `CEC`, `jira-time.ts`, `workKey`, `daily-cto.ts`, `retire-history.ts`, `knowledge.ts`, `time-scope.ts`, `scope-repair-resume.ts`, `ref_node_crypto`, `admit-improvement.ts`, `outbox.ts`, `.emit`, `notifications.ts`, `Effects`, `.save`, `run-evidence.ts`, `blocker-followups.ts`, `create-candidate.ts`, `Offices`, `offices.ts`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **Why does `Role` connect `Role` to `github-delivery.ts`, `Inspector.tsx`, `App.tsx`, `agents.ts`, `worker-runtime.ts`, `TicketJob`, `maintenance/maintenance.ts`, `shared.ts`, `closeout-recovery.ts`, `PeoplePanel.tsx`, `cec/workflow.ts`, `readback-evidence.ts`, `record-trigger.ts`, `OfficeScene.tsx`, `http/commands.ts`, `run-accounting.ts`, `Store`, `scene-motion.ts`, `outbox.ts`, `.emit`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `TicketJob` connect `TicketJob` to `github-delivery.ts`, `dependency-bots/adopt.ts`, `Inspector.tsx`, `activation-recovery.ts`, `Role`, `ref_node_util`, `digest`, `artifact`, `worker-runtime.ts`, `shared.ts`, `work-summary.ts`, `record-push.ts`, `closeout-recovery.ts`, `engine.ts`, `cec/workflow.ts`, `readback-evidence.ts`, `record-trigger.ts`, `source-amendment.ts`, `config.ts`, `CEC`, `workKey`, `Store`, `scope-repair-resume.ts`, `fact-bounds.ts`, `create-candidate.ts`, `ProjectProgress`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _476 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `github-delivery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.04644037732806579 - nodes in this community are weakly interconnected._
- **Should `.transaction` be split into smaller, more focused modules?**
  _Cohesion score 0.09568627450980392 - nodes in this community are weakly interconnected._
- **Should `dependency-bots/adopt.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05168067226890756 - nodes in this community are weakly interconnected._