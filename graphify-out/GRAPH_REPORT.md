# Graph Report - the-office  (2026-11-13)

## Corpus Check
- 765 files · ~314,394 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3903 nodes · 18239 edges · 108 communities (99 shown, 9 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 590 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1c6685f5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- github-context.ts
- github-delivery.ts
- workKey
- agents.ts
- Button
- daily-cto.ts
- Inspector.tsx
- cec/workflow.ts
- source-amendment-scope.ts
- ref_node_crypto
- shared.ts
- App.tsx
- session-bridge.ts
- knowledge.ts
- review-run.ts
- scheduled-captures.ts
- metadata-assessment.ts
- record-trigger.ts
- command
- lesson-selection.ts
- PeoplePanel.tsx
- index.ts
- conversations/conversations.ts
- GitHubDelivery
- FeatureWorkspace.tsx
- digest
- ref_node_path
- azure.ts
- maintenance/maintenance.ts
- TimeBook.tsx
- accept-stage-result.ts
- run-retrospective.ts
- demand-facts.ts
- assignments.ts
- time-scope.ts
- dependencies.ts
- index.tsx
- ref_node_fs
- github/issue-publication.ts
- activation-recovery.ts
- source-amendment.ts
- run.ts
- retrospective-subject.ts
- worker-runtime.ts
- OfficeScene.tsx
- process.ts
- cost-ledger.ts
- engine.ts
- dependency-bots/adopt.ts
- weekly-rollup.ts
- JiraIssuePublisher
- GitHubIssuePublisher
- admit-improvement.ts
- run-accounting.ts
- .emit
- goal-reviews.ts
- features.ts
- OfficeSnapshot
- Role
- scheduled-work.ts
- work-summary.ts
- outbox.ts
- remove-candidate.ts
- it-specialist.ts
- jira-time.ts
- .save
- assignment-poll.ts
- constellation-runtime.ts
- cec/issue-publication.ts
- Effects
- validate-stage.ts
- .transaction
- coordination.ts
- ticket-evidence.ts
- evidence-digest.ts
- work.ts
- DailyCTO.tsx
- conversations/slack.ts
- Store
- supersedingDelivery
- node-visuals.ts
- preferences-store.ts
- report.ts
- scene-motion.ts
- evidence.ts
- config.ts
- RoomCamera.tsx
- createConstellation
- recovery-ledger.ts
- OfficeConfigView.tsx
- Offices
- publish-pr.ts
- document.ts
- command-registry.ts
- CommittedBrain
- provider-observation.ts
- ProjectProgress
- extract-worker.mjs
- unblock-brief.ts
- helper-evidence.py
- it-agent.ts
- ITFollowUps.tsx
- server_delivery_harness_delivery_authority_resolvedeliverywork
- server_features_questions_pending_round_pendinground
- server_features_questions_pending_round_pendingrounds
- server_features_questions_pending_round_roundauthor
- src_shared_personas
- src_shared_workkey

## God Nodes (most connected - your core abstractions)
1. `Store` - 344 edges
2. `TicketJob` - 174 edges
3. `digest()` - 160 edges
4. `artifact()` - 129 edges
5. `GitHubDelivery` - 122 edges
6. `command()` - 108 edges
7. `workKey()` - 99 edges
8. `cx()` - 88 edges
9. `currentAssignment()` - 82 edges
10. `Button` - 82 edges

## Surprising Connections (you probably didn't know these)
- `projectOutbox()` --calls--> `parkedProviderWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts
- `projectOutbox()` --calls--> `readinessNeedsFollowup()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts
- `projectOutbox()` --calls--> `readinessWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts
- `replacementContext()` --calls--> `slackMessageUrl()`  [EXTRACTED]
  server/conversations/slack/supersession-proof.ts → src/shared.ts
- `pump()` --calls--> `deferredPickup()`  [EXTRACTED]
  server/conversations/team-conversation-pump.ts → src/work/pickup-state.ts

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

## Communities (108 total, 9 thin omitted)

### Community 0 - "github-context.ts"
Cohesion: 0.10
Nodes (44): ref_node_os, closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2 (+36 more)

### Community 1 - "github-delivery.ts"
Cohesion: 0.06
Nodes (75): findingsBlock(), deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), gateRegisteredDelivery(), resolveDeliveryWork(), assertDeliveryMayMutate(), HANDS_OFF_PROJECTS (+67 more)

### Community 2 - "workKey"
Cohesion: 0.08
Nodes (43): recordJobApproach(), completedPRReviews(), assertSourceConfiguration(), validateSourceProposal(), continuationScope(), continuationGuard(), Assessment, diagnosticProof() (+35 more)

### Community 3 - "agents.ts"
Cohesion: 0.06
Nodes (48): IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), intakeMembership(), projectListScope(), cecPrompt(), cecIntakePrompt() (+40 more)

### Community 4 - "Button"
Cohesion: 0.09
Nodes (55): ref_react, ref_react_markdown, ref_remark_gfm, KnowledgeActivity, KnowledgeActivityPage, KnowledgeEdge, KnowledgeMap, KnowledgeNode (+47 more)

### Community 5 - "daily-cto.ts"
Cohesion: 0.07
Nodes (31): ref_node_sqlite, expireLessons(), expiring(), graduateLessons(), graduating(), retire(), DailyCTO, EvidenceRequestConflict (+23 more)

### Community 6 - "Inspector.tsx"
Cohesion: 0.10
Nodes (67): FeatureWorkspace(), TicketPlanningAction(), blockedSummary(), ServiceHealthPanel(), followUp(), labels, ServiceHealthRow(), BlockerFollowups() (+59 more)

### Community 7 - "cec/workflow.ts"
Cohesion: 0.10
Nodes (40): applyIntakeObservation(), checkMail(), drainMail(), requestMail(), parksInJira(), MISSING_INTAKE, reconcileMailbox(), unusedMailbox() (+32 more)

### Community 8 - "source-amendment-scope.ts"
Cohesion: 0.08
Nodes (34): approvedText(), assert(), assert(), normalize(), officialUrls, ReleaseCapture, verifyReleaseCaptures(), capture (+26 more)

### Community 9 - "ref_node_crypto"
Cohesion: 0.08
Nodes (56): ref_node_crypto, approveFeature(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), discoveryPrompt(), planPrompt() (+48 more)

### Community 10 - "shared.ts"
Cohesion: 0.11
Nodes (26): harnessCloseout(), PASSING, verifyMergeActions(), runHarnessStage(), harnessStageResult(), receipt(), harnessDraft(), metadataAppliesToHead() (+18 more)

### Community 11 - "App.tsx"
Cohesion: 0.07
Nodes (45): ref_lucide_react, ref_motion, ref_react_dom, BrainDrawer(), themeColor, App(), BrainWorkspace, CONNECTION (+37 more)

### Community 12 - "session-bridge.ts"
Cohesion: 0.07
Nodes (45): ref_ws, claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexDaemonProcesses(), accountCodexProcesses(), codexProcessInventory (+37 more)

### Community 13 - "knowledge.ts"
Cohesion: 0.05
Nodes (49): normalizeStatement(), curateLesson(), Curation, CurationAction, mergeEvidence(), lessonBrainAudit, LessonBrainOverlap, decideOfficeProposal() (+41 more)

### Community 14 - "review-run.ts"
Cohesion: 0.14
Nodes (31): featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS, reserveReplacement(), stageBudget() (+23 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.15
Nodes (45): createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest, captureRequests() (+37 more)

### Community 16 - "metadata-assessment.ts"
Cohesion: 0.16
Nodes (35): activeEffectId(), admitPRMetadata(), METADATA_FINDING, METADATA_FINDING_GUIDANCE, assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema (+27 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.10
Nodes (46): isBlocking(), learningDigest(), baselineLearning(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences(), configureKnowledge() (+38 more)

### Community 18 - "command"
Cohesion: 0.07
Nodes (5): BrainFollowup, Result, Engine, command(), workerFailure()

### Community 19 - "lesson-selection.ts"
Cohesion: 0.10
Nodes (27): lessonIssueBody(), lessonIssueMarker(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), LessonSelection (+19 more)

### Community 20 - "PeoplePanel.tsx"
Cohesion: 0.10
Nodes (42): label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+34 more)

### Community 21 - "index.ts"
Cohesion: 0.06
Nodes (44): ref_hono_node_server, ref_node_http, ref_node_stream, ref_node_timers, ref_vite, args, [cmd,...rawArgs], commands (+36 more)

### Community 22 - "conversations/conversations.ts"
Cohesion: 0.10
Nodes (30): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, pumpCTO(), queueCTOHandoff(), saveGoals() (+22 more)

### Community 23 - "GitHubDelivery"
Cohesion: 0.08
Nodes (37): StageContext, GitHubDelivery, checksFailed(), checksPassed(), checksPending(), CurrentChecksWait, currentMergeChecks(), pass() (+29 more)

### Community 24 - "FeatureWorkspace.tsx"
Cohesion: 0.12
Nodes (26): FeatureQuestionProjection, OutboxQuestionRound(), send(), FeatureDelivery(), FeatureDocuments(), views, phases, LinkedFeatures() (+18 more)

### Community 25 - "digest"
Cohesion: 0.07
Nodes (73): partialLocalCleanupCandidate(), candidateInput(), children, oldAdoptionBasis(), savedCandidateAdmission, assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate() (+65 more)

### Community 26 - "ref_node_path"
Cohesion: 0.06
Nodes (69): ref_node_path, ref_node_util, removeAdoptedClone(), pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), assertStoppedBaseAudit(), AuditRow, readStoppedBaseAuditCompletion() (+61 more)

### Community 27 - "azure.ts"
Cohesion: 0.08
Nodes (34): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+26 more)

### Community 28 - "maintenance/maintenance.ts"
Cohesion: 0.07
Nodes (35): maintenancePolicies(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, BrainStatusSchema, identity, coverageSchema, followupSchema (+27 more)

### Community 29 - "TimeBook.tsx"
Cohesion: 0.16
Nodes (26): TelemetryReport, ROLE_NAMES, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens(), usd() (+18 more)

### Community 30 - "accept-stage-result.ts"
Cohesion: 0.09
Nodes (48): containedFile(), park(), acceptStageResult(), acceptConflictRepair(), nextJobStage(), deliveryNextStage(), pendingPreparationCheck(), mergeAuthorized() (+40 more)

### Community 31 - "run-retrospective.ts"
Cohesion: 0.11
Nodes (36): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, blockingTrigger, brainOverlap, brainOverlapQuery() (+28 more)

### Community 32 - "demand-facts.ts"
Cohesion: 0.11
Nodes (22): clip(), DEMAND_LIMIT, demandFacts(), key(), LessonKey, notes(), clip(), MISSED_QUERY_LIMIT (+14 more)

### Community 33 - "assignments.ts"
Cohesion: 0.10
Nodes (33): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, GraphNode (+25 more)

### Community 34 - "time-scope.ts"
Cohesion: 0.14
Nodes (29): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), server_telemetry_billable_work_issue_key, isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence() (+21 more)

### Community 35 - "dependencies.ts"
Cohesion: 0.08
Nodes (38): MergeNotifications, reconcileNoticeConfirmations(), Admission, admit(), IntakeContext, WAIT_STATUSES, compatible(), dependencyCompletionKey() (+30 more)

### Community 36 - "index.tsx"
Cohesion: 0.09
Nodes (50): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS, PickupForm(), acceptPreferences() (+42 more)

### Community 37 - "ref_node_fs"
Cohesion: 0.12
Nodes (34): ref_node_fs, DeliveryAuthorityInput, requireDeliveryAuthority(), accounting, DeliverySubject, nonDelivery, originalReads, HarnessControl (+26 more)

### Community 38 - "github/issue-publication.ts"
Cohesion: 0.17
Nodes (28): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), ProjectCard, projectCards(), projectGraphql() (+20 more)

### Community 39 - "activation-recovery.ts"
Cohesion: 0.11
Nodes (32): deliveryIntakeBlocker(), handsOff(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal (+24 more)

### Community 40 - "source-amendment.ts"
Cohesion: 0.07
Nodes (81): ref_node_async_hooks, adoptCandidate(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related (+73 more)

### Community 41 - "run.ts"
Cohesion: 0.13
Nodes (25): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationCandidates(), investigationId(), investigationFollowUps(), investigationResolution(), syncInvestigations(), NOTIFY_HELPER (+17 more)

### Community 42 - "retrospective-subject.ts"
Cohesion: 0.19
Nodes (17): maintenanceSubject(), MaintenanceSubjectFacts, maintenanceKey(), azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject, SubjectStepResult (+9 more)

### Community 43 - "worker-runtime.ts"
Cohesion: 0.06
Nodes (40): ref_zod, MISSING_SAVED_PLAN, candidateWorkspaceEnvironment(), diagnosticContext(), assignmentSubject(), assertBriefingScope(), contextPacket(), CODEX_DEFAULT_EFFORT (+32 more)

### Community 44 - "OfficeScene.tsx"
Cohesion: 0.17
Nodes (33): withoutElapsed(), Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk() (+25 more)

### Community 45 - "process.ts"
Cohesion: 0.12
Nodes (22): ref_node_child_process, file, folder, logs, root, inactivityWatch(), At, errno (+14 more)

### Community 46 - "cost-ledger.ts"
Cohesion: 0.15
Nodes (27): captureCost(), server_telemetry_cost_entries_costcoveragesummary, costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress() (+19 more)

### Community 47 - "engine.ts"
Cohesion: 0.13
Nodes (33): dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), resume(), startPilot(), recoverSavedPlan(), advance() (+25 more)

### Community 48 - "dependency-bots/adopt.ts"
Cohesion: 0.09
Nodes (46): Execute, readBackOrThrow(), adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR (+38 more)

### Community 49 - "weekly-rollup.ts"
Cohesion: 0.14
Nodes (19): deliveryMetrics(), median(), learningMetrics(), BRAIN_SCOPE, RollupResult, KnowledgeRunner, RETROSPECTIVE_TIMEOUT, lastFriday() (+11 more)

### Community 50 - "JiraIssuePublisher"
Cohesion: 0.26
Nodes (3): JiraIssuePublisher, keyOf(), publicationDescription()

### Community 51 - "GitHubIssuePublisher"
Cohesion: 0.19
Nodes (7): FeaturePublisher, PublicationReceipt, GitHubIssuePublisher, number(), same(), FeatureManifestItem, FeatureOperation

### Community 52 - "admit-improvement.ts"
Cohesion: 0.23
Nodes (16): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+8 more)

### Community 53 - "run-accounting.ts"
Cohesion: 0.05
Nodes (71): BoundedRead, done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf(), EvidenceOutcome, backfillClaudeCost() (+63 more)

### Community 54 - ".emit"
Cohesion: 0.12
Nodes (28): configureChannelNotices(), configureNotices(), retryRecipientLookup(), recoverCTOInput(), enqueueGreen156(), bindDiscoveryResume(), DiscoveryResumeInput, failedWorker() (+20 more)

### Community 55 - "goal-reviews.ts"
Cohesion: 0.09
Nodes (30): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+22 more)

### Community 56 - "features.ts"
Cohesion: 0.10
Nodes (40): commandFeature(), reviewQuestions(), automaticIntakeWait(), confirmBrief(), assertQuestionVisibility(), applyHarnessAction(), HarnessActionInput, recoveryPreconditions() (+32 more)

### Community 57 - "OfficeSnapshot"
Cohesion: 0.10
Nodes (37): Conversation(), SendMessage, LessonDecisionAction, lessonDecisionState(), readLessonDecision(), Outbox(), ctoInputFailure(), OutboxCTOInput() (+29 more)

### Community 58 - "Role"
Cohesion: 0.09
Nodes (26): ref_smol_toml, ROLES, Clock, DATA, LOCAL_BINDINGS, file, project, root (+18 more)

### Community 59 - "scheduled-work.ts"
Cohesion: 0.12
Nodes (24): deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), metadataRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), requestPriority() (+16 more)

### Community 60 - "work-summary.ts"
Cohesion: 0.09
Nodes (37): compactSteps(), displayAgentTask(), LiveAgentTask(), Props, RunningTask(), text(), AzureBuild, src_shared_liveanchor (+29 more)

### Community 61 - "outbox.ts"
Cohesion: 0.10
Nodes (28): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), ReplySchema, ctoInputRecovered(), conversationResolved(), projectOutbox(), canFileGithubIssue() (+20 more)

### Community 62 - "remove-candidate.ts"
Cohesion: 0.18
Nodes (18): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot() (+10 more)

### Community 63 - "it-specialist.ts"
Cohesion: 0.12
Nodes (18): partialLocalCleanupKey(), ITContext, publishITReport(), delays, recoverAttempt(), listenerHealth(), providers, ProviderStatusChecks (+10 more)

### Community 64 - "jira-time.ts"
Cohesion: 0.14
Nodes (22): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+14 more)

### Community 65 - ".save"
Cohesion: 0.24
Nodes (23): BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue(), readIssues(), commentDecision() (+15 more)

### Community 66 - "assignment-poll.ts"
Cohesion: 0.12
Nodes (21): ChannelSettings, notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR, plainSlackText(), section() (+13 more)

### Community 67 - "constellation-runtime.ts"
Cohesion: 0.15
Nodes (17): ref_3d_force_graph, ref_three, CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point (+9 more)

### Community 68 - "cec/issue-publication.ts"
Cohesion: 0.15
Nodes (15): CommentPage, commentReadback(), Assignment, Content, jiraText(), Transition, JiraOperations, plain() (+7 more)

### Community 69 - "Effects"
Cohesion: 0.27
Nodes (7): GitHubOperations, fileLessonIssue(), Assessment, closeNativeRefresh(), fingerprint(), Effects, EffectIntent

### Community 70 - "validate-stage.ts"
Cohesion: 0.18
Nodes (16): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+8 more)

### Community 71 - ".transaction"
Cohesion: 0.13
Nodes (13): featureById(), Link, linkFeature(), publishFeature(), reconcilePublication(), reserveIdentity(), FeatureReviewRunner, featureRoute() (+5 more)

### Community 72 - "coordination.ts"
Cohesion: 0.07
Nodes (19): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation(), checkpointWindow(), coordination() (+11 more)

### Community 73 - "ticket-evidence.ts"
Cohesion: 0.14
Nodes (22): ref_node_string_decoder, assetDownloader(), attachmentKind(), evidenceDirectory(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS (+14 more)

### Community 74 - "evidence-digest.ts"
Cohesion: 0.44
Nodes (7): canonical(), evidenceDigest(), evidenceHash(), semantic(), stableUrl(), requirementDrift(), RequirementPostimage

### Community 75 - "work.ts"
Cohesion: 0.14
Nodes (18): BLOCKED_CAUSES, blockedCauses(), projectReadiness(), ProjectReadiness, AssignmentResult, BlockedCause, CompletionCondition, DeliveryAdmission (+10 more)

### Community 76 - "DailyCTO.tsx"
Cohesion: 0.17
Nodes (14): CTOReview(), goalState, DailyCTO(), GoalHistory(), load(), reportDate(), reviewStatus, blank() (+6 more)

### Community 77 - "conversations/slack.ts"
Cohesion: 0.17
Nodes (11): channelNoticeAuthorized(), comparableSlackText(), SlackMessages, SlackRequestSchema, SlackResultSchema, SlackVerificationSchema, goalNoticeAuthorized(), sendGoalNotice() (+3 more)

### Community 78 - "Store"
Cohesion: 0.08
Nodes (23): verifyFeatureEnhance(), GitHubFeaturePublisher, JiraFeaturePublisher, QuestionNotifications, leadershipContext(), queueLessonIssueCheck(), knowledgeEntries(), knowledgeOfficeState() (+15 more)

### Community 79 - "supersedingDelivery"
Cohesion: 0.24
Nodes (12): syncOutbox(), finishSupersededReadback(), projectSlackDeliveries(), settleRequestedSlackReplacement(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint() (+4 more)

### Community 80 - "node-visuals.ts"
Cohesion: 0.20
Nodes (13): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+5 more)

### Community 81 - "preferences-store.ts"
Cohesion: 0.19
Nodes (9): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS (+1 more)

### Community 82 - "report.ts"
Cohesion: 0.29
Nodes (12): Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked(), row() (+4 more)

### Community 83 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 84 - "evidence.ts"
Cohesion: 0.29
Nodes (9): investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_SOURCE_PATHS, officeSource(), ROOT, launchPolicyFacts() (+1 more)

### Community 85 - "config.ts"
Cohesion: 0.33
Nodes (8): ref_node_url, assertFeaturePlanningConfig(), FeaturePlanningBindings, DELIVERY_CONCURRENCY, CECBinding, localBindings, assertModelOverrides(), ModelOverrides

### Community 86 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (10): ref_react_three_drei, ref_react_three_fiber, ref_three_stdlib, CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility (+2 more)

### Community 87 - "createConstellation"
Cohesion: 0.19
Nodes (5): ConstellationRuntime, createConstellation(), enter(), finishTap(), move()

### Community 88 - "recovery-ledger.ts"
Cohesion: 0.35
Nodes (8): savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), diagnosticSnapshot(), nativeDeliveryResolved(), reconcileRecoveryLedger(), stoppedBaseUpdateUnresolved()

### Community 89 - "OfficeConfigView.tsx"
Cohesion: 0.43
Nodes (6): loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView(), OfficeConfigSummary, errorText

### Community 91 - "publish-pr.ts"
Cohesion: 0.16
Nodes (18): harnessEffect, retryRead(), Event, one(), prePushRejection(), PushIdentity, assertCandidate(), Candidate (+10 more)

### Community 92 - "document.ts"
Cohesion: 0.38
Nodes (5): ref_yaml, guidanceExcerpt(), DocumentMetadata, documentText(), KnowledgeDocumentText

### Community 93 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 95 - "provider-observation.ts"
Cohesion: 0.47
Nodes (4): correlatedBuild(), observe(), observeParked(), parkedReadError

### Community 97 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (6): ref_mammoth, ref_pdfjs_dist, bounded(), extract(), fail(), [path,kind]

### Community 98 - "unblock-brief.ts"
Cohesion: 0.53
Nodes (5): clearUnblockBrief(), key(), saveUnblockBrief(), unblockBrief, src_shared_learningsubject

### Community 99 - "helper-evidence.py"
Cohesion: 0.33
Nodes (5): importlib_util, json, pathlib, Read-only protocol adapter for the installed review helper. No model dispatch., sys

### Community 100 - "it-agent.ts"
Cohesion: 0.47
Nodes (3): itAgent(), itDiagnostics(), Agent

### Community 101 - "ITFollowUps.tsx"
Cohesion: 0.67
Nodes (4): itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps()

## Knowledge Gaps
- **481 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+476 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 616 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `github-context.ts`, `github-delivery.ts`, `workKey`, `agents.ts`, `daily-cto.ts`, `cec/workflow.ts`, `ref_node_crypto`, `session-bridge.ts`, `knowledge.ts`, `review-run.ts`, `scheduled-captures.ts`, `metadata-assessment.ts`, `record-trigger.ts`, `command`, `lesson-selection.ts`, `index.ts`, `conversations/conversations.ts`, `GitHubDelivery`, `digest`, `ref_node_path`, `azure.ts`, `maintenance/maintenance.ts`, `accept-stage-result.ts`, `run-retrospective.ts`, `demand-facts.ts`, `assignments.ts`, `time-scope.ts`, `dependencies.ts`, `ref_node_fs`, `github/issue-publication.ts`, `activation-recovery.ts`, `source-amendment.ts`, `run.ts`, `retrospective-subject.ts`, `worker-runtime.ts`, `cost-ledger.ts`, `engine.ts`, `dependency-bots/adopt.ts`, `weekly-rollup.ts`, `JiraIssuePublisher`, `admit-improvement.ts`, `run-accounting.ts`, `.emit`, `goal-reviews.ts`, `features.ts`, `OfficeSnapshot`, `Role`, `scheduled-work.ts`, `outbox.ts`, `remove-candidate.ts`, `it-specialist.ts`, `jira-time.ts`, `.save`, `assignment-poll.ts`, `cec/issue-publication.ts`, `Effects`, `validate-stage.ts`, `.transaction`, `coordination.ts`, `ticket-evidence.ts`, `conversations/slack.ts`, `supersedingDelivery`, `evidence.ts`, `recovery-ledger.ts`, `publish-pr.ts`, `ProjectProgress`, `it-agent.ts`?**
  _High betweenness centrality (0.121) - this node is a cross-community bridge._
- **Why does `workKey()` connect `workKey` to `github-context.ts`, `github-delivery.ts`, `ref_node_crypto`, `shared.ts`, `metadata-assessment.ts`, `digest`, `ref_node_path`, `accept-stage-result.ts`, `dependencies.ts`, `ref_node_fs`, `github/issue-publication.ts`, `activation-recovery.ts`, `source-amendment.ts`, `dependency-bots/adopt.ts`, `Role`, `scheduled-work.ts`, `outbox.ts`, `remove-candidate.ts`, `Effects`, `.transaction`, `work.ts`, `Store`, `evidence.ts`, `recovery-ledger.ts`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `GitHubDelivery` connect `GitHubDelivery` to `github-context.ts`, `github-delivery.ts`, `assignment-poll.ts`, `dependencies.ts`, `workKey`, `ref_node_fs`, `validate-stage.ts`, `github/issue-publication.ts`, `activation-recovery.ts`, `source-amendment.ts`, `shared.ts`, `engine.ts`, `metadata-assessment.ts`, `command`, `digest`, `ref_node_path`, `publish-pr.ts`, `accept-stage-result.ts`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _481 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `github-context.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10352941176470588 - nodes in this community are weakly interconnected._
- **Should `github-delivery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.061277705345501955 - nodes in this community are weakly interconnected._
- **Should `workKey` be split into smaller, more focused modules?**
  _Cohesion score 0.08051948051948052 - nodes in this community are weakly interconnected._