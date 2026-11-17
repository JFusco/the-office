# Graph Report - the-office  (2026-11-17)

## Corpus Check
- 859 files · ~338,233 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4176 nodes · 19185 edges · 127 communities (118 shown, 9 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 619 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2664b5e1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- TimeBook.tsx
- Role
- dependency-bots/adopt.ts
- config.ts
- Inspector.tsx
- artifact
- session-bridge.ts
- Button
- candidate.ts
- command
- worker-runtime.ts
- .getEffect
- App.tsx
- authorize.ts
- reader.ts
- scheduled-captures.ts
- run-retrospective.ts
- retrospective-triggers.ts
- http/commands.ts
- rootArtifact
- mutedCopy
- github-delivery.ts
- index.tsx
- telemetry.ts
- lesson-selection.ts
- maintenance/maintenance.ts
- cost-ledger.ts
- cto-input-resolution.ts
- knowledge.ts
- jira-time.ts
- digest
- agents.ts
- conversations/conversations.ts
- Goals.tsx
- sanitize
- features.ts
- scheduled-work.ts
- Store
- setup-stop-cap.ts
- QuestionStepper.tsx
- inspect-closed-plan.ts
- time-scope.ts
- closeout-recovery.ts
- ledger.ts
- .activeClaims
- harness-baseline.ts
- OfficeScene.tsx
- time-readback.ts
- create-candidate.ts
- assignments.ts
- interrupted-work-recovery.ts
- move-lane.ts
- outbox.ts
- cec.ts
- tracking-issue.ts
- weekly-rollup.ts
- publication.ts
- ServiceHealthPanel.tsx
- JiraIssuePublisher
- blocker-followups.ts
- pilot-delivery.ts
- run.ts
- knowledge-views.ts
- stopped-base-provider.ts
- ticket-evidence.ts
- run-accounting.ts
- remove-candidate.ts
- fact-bounds.ts
- continue-ownership-read.ts
- service-health.ts
- constellation-runtime.ts
- process.ts
- work.ts
- report.ts
- Ticket
- Offices
- node-visuals.ts
- daily-cto.ts
- scene-motion.ts
- ref_zod
- ref_node_path
- activation-recovery.ts
- coordination.ts
- local-config.ts
- OfficeSnapshot
- RoomCamera.tsx
- src_shared_workkey
- index.ts
- HOLDS
- it-specialist.ts
- superseded-receipts.ts
- CEC
- accept-stage-result.ts
- assignment-poll.ts
- github/issue-publication.ts
- capture-session-clone.py
- preferences-store.ts
- brain-maintenance.ts
- .emit
- codex-rollout.ts
- install-service.mjs
- recovery-ledger.ts
- shared.ts
- cli.ts
- ticket-stage-runner.ts
- extract-worker.mjs
- follow-up-alerts.ts
- read-retries.ts
- workKey
- retire-history.ts
- dependencies.ts
- executeRequest
- command-registry.ts
- admit-improvement.ts
- evidence-digest.ts
- continue-access-only-plan.ts
- ProjectProgress
- highestStableAtLeast
- server_delivery_harness_delivery_authority_resolvedeliverywork
- server_delivery_recovery_stopped_base_audit_native
- packed-consumer-pnpm.ts
- restoreInPlace
- server_cec_parking_jira_issue_execute
- server_cec_parking_jira_issue_jira
- delivery-ownership.ts
- extraction.ts
- handover-cms.ts

## God Nodes (most connected - your core abstractions)
1. `Store` - 375 edges
2. `TicketJob` - 172 edges
3. `digest()` - 150 edges
4. `command()` - 120 edges
5. `GitHubDelivery` - 116 edges
6. `artifact()` - 114 edges
7. `workKey()` - 97 edges
8. `OfficeSnapshot` - 88 edges
9. `cx()` - 88 edges
10. `currentAssignment()` - 88 edges

## Surprising Connections (you probably didn't know these)
- `UnrecordedResult` --references--> `StageResult`  [EXTRACTED]
  server/cec/unrecorded-result.ts → src/shared.ts
- `DeliveryAuthorityInput` --references--> `HarnessRequest`  [EXTRACTED]
  server/delivery/harness/delivery-authority.ts → src/contracts/work.ts
- `apply()` --indirect_call--> `note()`  [INFERRED]
  src/conversations/OutboxSavedImplementation.tsx → server/cec/parking/resume-parked.ts
- `writerRestartCandidate` --calls--> `workKey()`  [EXTRACTED]
  server/delivery/attempts/restart-writer.ts → src/contracts/work.ts
- `writerRestartCandidate` --references--> `WorkTime`  [EXTRACTED]
  server/delivery/attempts/restart-writer.ts → src/shared.ts

## Import Cycles
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/review-wait.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/parking/resume-provider-review.ts -> server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/parking/resume-provider-review.ts`
- 3-file cycle: `server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts`
- 4-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/readiness/review-wait.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 4-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 4-file cycle: `server/delivery/recovery/stopped-base-review.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/stopped-base-review.ts`
- 4-file cycle: `server/delivery/recovery/implementation/saved-prerequisite-handoff.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/implementation/saved-prerequisite-handoff.ts`
- 4-file cycle: `server/delivery/recovery/validation/validation-readback.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/validation/validation-readback.ts`
- 4-file cycle: `server/delivery/recovery/implementation/activation-recovery.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/implementation/activation-recovery.ts`
- 4-file cycle: `server/features/delivery-binding.ts -> server/features/enrollment-gate.ts -> server/features/progression/failure.ts -> server/store/effects.ts -> server/features/delivery-binding.ts`
- 5-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/stage-reconciliation.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 5-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 5-file cycle: `server/delivery/recovery/implementation/continuation-evidence.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/recovery/implementation/continuation-evidence.ts`
- 5-file cycle: `server/delivery/recovery/implementation/saved-prerequisite-handoff.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/recovery/implementation/saved-prerequisite-handoff.ts`
- 5-file cycle: `server/delivery/recovery/scope-repair/scope-repair-readback.ts -> server/delivery/recovery/scope-repair/scope-repair-resume.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/scope-repair/scope-repair-readback.ts`
- 5-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/scope-repair/scope-repair-resume.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 5-file cycle: `server/delivery/recovery/implementation/continuation-evidence.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/implementation/implementation-recovery.ts -> server/delivery/recovery/implementation/continuation-evidence.ts`
- 5-file cycle: `server/delivery/recovery/implementation/continuation-evidence.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/preparation/post-conflict-preparation.ts -> server/delivery/recovery/implementation/continuation-evidence.ts`

## Communities (127 total, 9 thin omitted)

### Community 0 - "TimeBook.tsx"
Cohesion: 0.15
Nodes (22): LiveAnchor, displayAgentTask(), withoutElapsed(), LiveAgentTask(), Props, RunningTask(), text(), Agent (+14 more)

### Community 1 - "Role"
Cohesion: 0.11
Nodes (41): DeliverySlot, Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona (+33 more)

### Community 2 - "dependency-bots/adopt.ts"
Cohesion: 0.17
Nodes (23): Execute, adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR, openDependabotPulls() (+15 more)

### Community 3 - "config.ts"
Cohesion: 0.11
Nodes (38): ref_node_crypto, featureItemComplete(), reconcileFeatureCompletion(), discoveryPrompt(), planPrompt(), readEvidence(), ProviderEvidence, helperTelemetry() (+30 more)

### Community 4 - "Inspector.tsx"
Cohesion: 0.10
Nodes (64): labels, ServiceHealthRow(), BlockerFollowups(), LearningCoverage(), Evidence(), LessonCard(), LessonShape(), LessonsPanel() (+56 more)

### Community 5 - "artifact"
Cohesion: 0.07
Nodes (71): ref_node_util, writerRestartPending(), continuationNativeReview(), continuationWorkerProof(), hash, originalMetadataWorker(), completedConflictDraftCandidate(), acceptedNativeGate() (+63 more)

### Community 6 - "session-bridge.ts"
Cohesion: 0.06
Nodes (53): ref_node_perf_hooks, ref_ws, claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexDaemonProcesses(), accountCodexProcesses() (+45 more)

### Community 7 - "Button"
Cohesion: 0.09
Nodes (51): ref_react, ref_react_markdown, ref_remark_gfm, ref_yaml, Activity(), ActivityTimeline(), AssignmentKnowledge(), Lookup() (+43 more)

### Community 8 - "candidate.ts"
Cohesion: 0.14
Nodes (22): ref_node_child_process, GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles() (+14 more)

### Community 9 - "command"
Cohesion: 0.05
Nodes (22): AzureMonitor, correlatedBuild(), applyIntakeObservation(), JiraOperations, checkMail(), drainMail(), requestMail(), enableNightly() (+14 more)

### Community 10 - "worker-runtime.ts"
Cohesion: 0.07
Nodes (36): candidateWorkspaceEnvironment(), ApproachSchema, assignmentSubject(), LOCAL_BINDINGS, contextPacket(), CODEX_DEFAULT_EFFORT, CODEX_DEFAULT_MODEL, CODEX_EFFORTS (+28 more)

### Community 11 - ".getEffect"
Cohesion: 0.15
Nodes (16): diagnosticProof(), ownedArtifact(), rawHash(), recoverDiscovery(), publishFeature(), GitHubOperations, fileLessonIssue(), lessonIssueBody() (+8 more)

### Community 12 - "App.tsx"
Cohesion: 0.06
Nodes (59): ref_lucide_react, ref_motion, ref_react_dom, compactSteps(), BrainDrawer(), themeColor, App(), BrainWorkspace (+51 more)

### Community 13 - "authorize.ts"
Cohesion: 0.08
Nodes (47): ref_node_url, approveFeature(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), artifactPath(), digest() (+39 more)

### Community 14 - "reader.ts"
Cohesion: 0.11
Nodes (21): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), BrainGraph, BrainNote, BrainReader, CommittedBrain, GraphNode (+13 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.15
Nodes (42): createFeature(), assertEnrollable(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest, captureRequests(), failCapture() (+34 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.09
Nodes (42): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, blockingTrigger, isBlocking(), brainOverlap (+34 more)

### Community 17 - "retrospective-triggers.ts"
Cohesion: 0.08
Nodes (46): deliveryMetrics(), median(), LEARNING_BASELINES, maintenanceSubject(), MaintenanceSubjectFacts, clip(), maintenanceBlockedId(), MaintenanceCandidate (+38 more)

### Community 18 - "http/commands.ts"
Cohesion: 0.14
Nodes (26): ChannelSettings, configureChannelNotices(), notices(), recoverCTOInput(), bindDiscoveryResume(), DiscoveryResumeInput, scopeNote(), enqueueMetadataRecovery() (+18 more)

### Community 19 - "rootArtifact"
Cohesion: 0.08
Nodes (61): assertPostConflictFiles(), assertPostConflictOwnership(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), reconcileCompletedConflictDraft(), routeReadyPostConflictPublication(), verifyInitialDraftConflictPreparation(), within() (+53 more)

### Community 20 - "mutedCopy"
Cohesion: 0.15
Nodes (33): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS, PickupForm(), acceptPreferences() (+25 more)

### Community 21 - "github-delivery.ts"
Cohesion: 0.05
Nodes (81): writerRestartInstruction(), findingsBlock(), BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction(), dependabotReviewGuidance(), discover() (+73 more)

### Community 22 - "index.tsx"
Cohesion: 0.09
Nodes (28): FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures(), ButtonLayout, ButtonVariant (+20 more)

### Community 23 - "telemetry.ts"
Cohesion: 0.09
Nodes (28): CodexRollout, CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL (+20 more)

### Community 24 - "lesson-selection.ts"
Cohesion: 0.08
Nodes (37): committedNotePage(), guidanceExcerpt(), digest(), lessonForProject(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT (+29 more)

### Community 25 - "maintenance/maintenance.ts"
Cohesion: 0.11
Nodes (24): maintenancePolicies(), BrainMaintenance, candidateOwner(), SETTLED, skipOwnedCandidate(), Skipped, skippedCandidateLedger(), CmsFollowUpContext (+16 more)

### Community 26 - "cost-ledger.ts"
Cohesion: 0.15
Nodes (28): captureCost(), server_telemetry_cost_entries_costcoveragesummary, costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId() (+20 more)

### Community 28 - "knowledge.ts"
Cohesion: 0.06
Nodes (42): curateLesson(), Curation, CurationAction, mergeEvidence(), lessonBrainAudit, LessonBrainOverlap, BRAIN_SCOPE, SUBJECT (+34 more)

### Community 29 - "jira-time.ts"
Cohesion: 0.16
Nodes (19): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+11 more)

### Community 30 - "digest"
Cohesion: 0.08
Nodes (69): harnessCloseout(), PASSING, verifyMergeActions(), requireDeliveryAuthority(), activeEffectId(), harnessEffect, assertDeliveryMayMutate(), retryRead() (+61 more)

### Community 31 - "agents.ts"
Cohesion: 0.05
Nodes (50): IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), intakeMembership(), projectListScope(), Assignment, Content (+42 more)

### Community 32 - "conversations/conversations.ts"
Cohesion: 0.08
Nodes (28): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, pumpCTO(), queueCTOHandoff(), saveGoals() (+20 more)

### Community 33 - "Goals.tsx"
Cohesion: 0.15
Nodes (20): CTOReview(), goalState, DailyCTO(), GoalHistory(), load(), reportDate(), reviewStatus, GoalList() (+12 more)

### Community 34 - "sanitize"
Cohesion: 0.13
Nodes (29): az(), base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs(), fullActivePRs() (+21 more)

### Community 35 - "features.ts"
Cohesion: 0.09
Nodes (44): commandFeature(), reviewQuestions(), automaticIntakeWait(), confirmBrief(), FeaturePlanningBindings, assertQuestionVisibility(), applyHarnessAction(), HarnessActionInput (+36 more)

### Community 36 - "scheduled-work.ts"
Cohesion: 0.10
Nodes (37): freshOwnershipRead(), deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), withAmendmentOwnership(), metadataRequestResolved(), preparationRequestResolved(), gateFeatureWork() (+29 more)

### Community 37 - "Store"
Cohesion: 0.05
Nodes (45): ref_node_sqlite, candidateBranchMoved(), admitReadyCards(), verifyFeatureEnhance(), GitHubFeaturePublisher, JiraFeaturePublisher, improvementIntakeGate(), leadershipContext() (+37 more)

### Community 38 - "setup-stop-cap.ts"
Cohesion: 0.60
Nodes (4): confirmSetupStopCap(), consecutiveSetupStops(), SETUP_STOP_CAP, setupStop()

### Community 39 - "QuestionStepper.tsx"
Cohesion: 0.19
Nodes (18): FeatureQuestionProjection, OutboxQuestionRound(), send(), draftKey(), readDraft(), saveDraft(), QuestionRound(), nextQuestion() (+10 more)

### Community 40 - "inspect-closed-plan.ts"
Cohesion: 0.09
Nodes (29): assertOwnership(), decideImplementation(), ImplementationDecision, OwnershipRead, interruptedImplementation(), closedReadonlyPlan(), Document, consumeQAPlanRetry() (+21 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.14
Nodes (29): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), server_telemetry_billable_work_issue_key, isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence() (+21 more)

### Community 42 - "closeout-recovery.ts"
Cohesion: 0.09
Nodes (50): ref_node_os, closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2 (+42 more)

### Community 43 - "ledger.ts"
Cohesion: 0.23
Nodes (13): acceptedCompletionResolution(), investigationCandidates(), investigationId(), ctoReplacementResolution(), finishedSubjectResolution(), investigationFollowUps(), implementationReplacementResolution(), investigationResolution() (+5 more)

### Community 44 - ".activeClaims"
Cohesion: 0.13
Nodes (15): ROLES, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch(), deliveryOccupied() (+7 more)

### Community 45 - "harness-baseline.ts"
Cohesion: 0.17
Nodes (19): baselineReport, BaselineSource, baselineText(), millions(), row(), share(), add(), BaselineState (+11 more)

### Community 46 - "OfficeScene.tsx"
Cohesion: 0.18
Nodes (31): Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk(), ElevatorStage() (+23 more)

### Community 47 - "time-readback.ts"
Cohesion: 0.31
Nodes (5): TimeLedger, Readback, READBACK_INTERVAL_MS, readBackTime(), SETTLE_MS

### Community 48 - "create-candidate.ts"
Cohesion: 0.48
Nodes (6): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf()

### Community 49 - "assignments.ts"
Cohesion: 0.10
Nodes (25): clip(), DEMAND_LIMIT, demandFacts(), key(), LessonKey, notes(), assignmentLookups, Binding (+17 more)

### Community 50 - "interrupted-work-recovery.ts"
Cohesion: 0.12
Nodes (15): channelNoticeAuthorized(), comparableSlackText(), SlackMessages, interruptAdoptions(), legacy(), REMOVED_FIELDS, retireLegacyRecovery(), goalNoticeAuthorized() (+7 more)

### Community 51 - "move-lane.ts"
Cohesion: 0.20
Nodes (24): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), ProjectCard, projectCards(), projectGraphql() (+16 more)

### Community 52 - "outbox.ts"
Cohesion: 0.17
Nodes (16): ADOPTION_STALLED_MS, projectOutbox(), syncOutbox(), projectSlackDeliveries(), settleRequestedSlackReplacement(), Input, supersedeSlackDelivery(), replacementContext() (+8 more)

### Community 53 - "cec.ts"
Cohesion: 0.12
Nodes (28): cecPrompt(), cecReconcilePrompt(), resolvedDecisionNote(), stageInstructions, settledReceiptNote(), ticketForWorker(), stagePrompt(), StagePromptInput (+20 more)

### Community 54 - "tracking-issue.ts"
Cohesion: 0.19
Nodes (17): readBackOrThrow(), ensureTrackingIssue(), findTrackingIssue(), ownTracking(), TrackingIssue, trackingIssueBody(), trackingIssueTitle(), trackingMarker() (+9 more)

### Community 55 - "weekly-rollup.ts"
Cohesion: 0.14
Nodes (27): learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), RollupResult (+19 more)

### Community 56 - "publication.ts"
Cohesion: 0.17
Nodes (9): featureById(), Link, linkFeature(), reconcilePublication(), uncertainPublications(), reserveIdentity(), FeatureReviewRunner, featureRoute() (+1 more)

### Community 57 - "ServiceHealthPanel.tsx"
Cohesion: 0.09
Nodes (39): TelemetryReport, blockedSummary(), itAgent(), itDiagnostics(), itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps() (+31 more)

### Community 58 - "JiraIssuePublisher"
Cohesion: 0.21
Nodes (6): JiraIssuePublisher, jiraText(), keyOf(), descriptionPreimage(), plain(), publicationDescription()

### Community 59 - "blocker-followups.ts"
Cohesion: 0.23
Nodes (15): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), ReplySchema, conversationResolved(), readBackConversations(), handoff(), reconcileBlockerFollowups() (+7 more)

### Community 60 - "pilot-delivery.ts"
Cohesion: 0.15
Nodes (34): continueImplementation(), dispatchNightly(), drainDelivery(), requestDelivery(), startPilot(), OfficeQAHandoffInput, eligibility(), IntakeContext (+26 more)

### Community 61 - "run.ts"
Cohesion: 0.12
Nodes (24): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_FIX_PROMPT, OfficeFixResult (+16 more)

### Community 62 - "knowledge-views.ts"
Cohesion: 0.22
Nodes (13): KnowledgeActivity, KnowledgeEdge, KnowledgeMap, KnowledgeNode, ConstellationView, DisplayNode, initialSelection, MapSelection (+5 more)

### Community 63 - "stopped-base-provider.ts"
Cohesion: 0.38
Nodes (8): pinCourier, pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), discussion(), pages(), pullIdentity(), readStoppedBaseProviderContext(), reviewThreads()

### Community 64 - "ticket-evidence.ts"
Cohesion: 0.21
Nodes (17): assetDownloader(), attachmentKind(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS, EvidenceAttachment, EvidenceReadContext (+9 more)

### Community 65 - "run-accounting.ts"
Cohesion: 0.13
Nodes (30): BoundedRead, done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf(), codexHome(), createdAt() (+22 more)

### Community 66 - "remove-candidate.ts"
Cohesion: 0.18
Nodes (18): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot() (+10 more)

### Community 67 - "fact-bounds.ts"
Cohesion: 0.25
Nodes (15): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+7 more)

### Community 68 - "continue-ownership-read.ts"
Cohesion: 0.28
Nodes (11): continueOwnershipRead(), expiredOwnershipRead(), ownershipReadGate(), ownershipReadState(), ownershipReadHistory(), ownershipReadSource(), readOwnershipCandidate, ReadOwnershipView (+3 more)

### Community 69 - "service-health.ts"
Cohesion: 0.16
Nodes (11): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, slackHealth() (+3 more)

### Community 70 - "constellation-runtime.ts"
Cohesion: 0.10
Nodes (22): ref_3d_force_graph, ref_three, CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point (+14 more)

### Community 71 - "process.ts"
Cohesion: 0.10
Nodes (25): Event, one(), prePushRejection(), PushIdentity, settledPushBoundary(), inactivityWatch(), At, errno (+17 more)

### Community 72 - "work.ts"
Cohesion: 0.12
Nodes (21): BLOCKED_CAUSES, blockedCauses(), projectReadiness(), ProjectReadiness, AssignmentResult, BlockedCause, CompletionCondition, Continuation (+13 more)

### Community 73 - "report.ts"
Cohesion: 0.29
Nodes (12): Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked(), row() (+4 more)

### Community 74 - "Ticket"
Cohesion: 0.25
Nodes (10): implementationWorkerContext(), savedStageCompletion(), assertContinuableWorktree(), CONTINUABLE, continuationPrompt(), recordedContinuation(), stageContinuation, completedOutput() (+2 more)

### Community 76 - "node-visuals.ts"
Cohesion: 0.20
Nodes (13): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+5 more)

### Community 77 - "daily-cto.ts"
Cohesion: 0.08
Nodes (26): DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), applyGoalReview(), DailyResultSchema, EvidenceRefSchema, FreshDailyResultSchema (+18 more)

### Community 78 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 79 - "ref_zod"
Cohesion: 0.23
Nodes (8): ref_zod, BrainStatusSchema, identity, brainCheckpointCompletion(), coverageSchema, followupSchema, verified, reconcileCompletedCheckpoints()

### Community 80 - "ref_node_path"
Cohesion: 0.07
Nodes (55): ref_node_fs, ref_node_path, containedFile(), Execute, installDependencies(), major(), removeAdoptedClone(), namedRepairIds() (+47 more)

### Community 81 - "activation-recovery.ts"
Cohesion: 0.06
Nodes (69): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+61 more)

### Community 82 - "coordination.ts"
Cohesion: 0.15
Nodes (13): checkpointWindow(), coordination(), dueAt(), hours, localDay(), ReviewResult, deferNonReady(), preparePR() (+5 more)

### Community 83 - "local-config.ts"
Cohesion: 0.25
Nodes (12): AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), GOAL_EVIDENCE_LIMITS, goalEvidencePath(), OfficeConfigInputs, officeConfigRoute(), officeConfigSummary(), CECBinding (+4 more)

### Community 84 - "OfficeSnapshot"
Cohesion: 0.07
Nodes (53): knowledgeOutbox(), Conversation(), SendMessage, LessonDecisionAction, lessonDecisionState(), readLessonDecision(), DAYS, dueLessonDecisions() (+45 more)

### Community 85 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (10): ref_react_three_drei, ref_react_three_fiber, ref_three_stdlib, CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility (+2 more)

### Community 87 - "index.ts"
Cohesion: 0.08
Nodes (40): ref_hono_node_server, ref_node_http, ref_vite, implementationPreview(), implementationContinuationRoute(), qaPlanRetryRoute(), close(), config (+32 more)

### Community 88 - "HOLDS"
Cohesion: 0.08
Nodes (42): nextAttemptAt(), restartStoppedWriters(), unchangedSinceAccepted(), NOT_RETRYABLE, WRITER_STAGES, writerRestartCandidate, writerRestarted(), Execute (+34 more)

### Community 89 - "it-specialist.ts"
Cohesion: 0.33
Nodes (8): ITContext, informationalRecovery(), publishITReport(), delays, recoverAttempt(), ITFollowUp, ITReport, ITState

### Community 90 - "superseded-receipts.ts"
Cohesion: 0.27
Nodes (8): Attempt, needsResumeReconciliation(), REVIEW_STAGES, stoppedInSetup(), Receipt, Settled, SETTLED_RECEIPT_NOTE, supersededReceipt()

### Community 91 - "CEC"
Cohesion: 0.12
Nodes (29): CommentPage, commentReadback(), devUpdate(), HEADLINE, jiraRecord(), unpack(), postDevUpdate(), OUTCOME (+21 more)

### Community 92 - "accept-stage-result.ts"
Cohesion: 0.08
Nodes (50): DECISION_KINDS, needsDecision(), park(), acceptStageResult(), acceptConflictRepair(), nextJobStage(), recordJobApproach(), unresolvedVerification() (+42 more)

### Community 93 - "assignment-poll.ts"
Cohesion: 0.13
Nodes (23): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), queueChannelNotice(), clamp(), LIMITS, MergedPR, plainSlackText() (+15 more)

### Community 94 - "github/issue-publication.ts"
Cohesion: 0.15
Nodes (10): FeaturePublisher, PublicationReceipt, Assign, Board, Content, GitHubIssuePublisher, number(), same() (+2 more)

### Community 95 - "capture-session-clone.py"
Cohesion: 0.15
Nodes (10): ctypes, errno, importlib_util, json, os, pathlib, Copy a coherent macOS clone of inherited reader fd3 to anonymous target fd4. No…, Read-only protocol adapter for the installed review helper. No model dispatch. (+2 more)

### Community 96 - "preferences-store.ts"
Cohesion: 0.21
Nodes (8): fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS, OfficePreferences, OfficePreferencesPatch

### Community 97 - "brain-maintenance.ts"
Cohesion: 0.26
Nodes (10): completeNativeCheckpoint(), BRAIN_DEPENDENCY_MERGES, BrainResult, capped(), queueMaintenanceNotice(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance() (+2 more)

### Community 98 - ".emit"
Cohesion: 0.12
Nodes (43): resolveBlockedTransition(), document(), transitionWithComment(), jiraAccount(), jiraCollection(), jiraCredential, KEYCHAIN_SERVICE, BLOCKED (+35 more)

### Community 99 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 100 - "install-service.mjs"
Cohesion: 0.33
Nodes (4): file, folder, logs, root

### Community 101 - "recovery-ledger.ts"
Cohesion: 0.23
Nodes (11): savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), assignmentDiagnostics(), diagnosticContext(), diagnosticSnapshot(), nativeDeliveryResolved() (+3 more)

### Community 102 - "shared.ts"
Cohesion: 0.08
Nodes (27): Admission, OfficeQAReport, QAPlanContinuation, SlackReplacementRequest, SlackSupersession, SlackSupersessionView, ConfirmedSegment, ObservationGap (+19 more)

### Community 103 - "cli.ts"
Cohesion: 0.17
Nodes (8): ref_node_stream, ref_node_timers, args, [cmd,...rawArgs], commands, key, projectIndex, PORT

### Community 104 - "ticket-stage-runner.ts"
Cohesion: 0.12
Nodes (30): parksInJira(), MISSING_SAVED_PLAN, recoverSavedPlan(), ownReceipts(), run(), verifiedTransition(), UnrecordedResult, unrecordedStageResult() (+22 more)

### Community 105 - "extract-worker.mjs"
Cohesion: 0.43
Nodes (6): ref_mammoth, ref_pdfjs_dist, bounded(), extract(), fail(), [path,kind]

### Community 106 - "follow-up-alerts.ts"
Cohesion: 0.33
Nodes (8): checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), repeatedVendorReviewBlock(), stoppedInVendorReview(), maintenanceSuperseded(), REOBSERVED, DailyCheckpoint

### Community 107 - "read-retries.ts"
Cohesion: 0.30
Nodes (9): ATTEMPT_DELAYS_MS, classifyStop(), stopReason(), reviewWait, incompleteReadOutput(), planReadRetry(), reconcileReadRetries(), temporaryReadFailure() (+1 more)

### Community 108 - "workKey"
Cohesion: 0.47
Nodes (7): completedPRReviews(), eligible(), mergedByOwner(), ownerSettles(), retireExternalDeliveries(), settledExternalRepair(), workKey()

### Community 109 - "retire-history.ts"
Cohesion: 0.31
Nodes (8): readHistoryScope(), enqueueHistoryRetirement(), historicalRecordDigest(), Intent, records(), retireIncompleteHistory(), HistoryRetirement, HistoryRetirementIntent

### Community 110 - "dependencies.ts"
Cohesion: 0.13
Nodes (22): MergeNotifications, reconcileNoticeConfirmations(), admit(), compatible(), dependencyCompletionKey(), dependencyEligibility(), issueKey(), observePrerequisites() (+14 more)

### Community 111 - "executeRequest"
Cohesion: 0.07
Nodes (3): Coordinator, executeRequest(), AssignedIssue

### Community 112 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 113 - "admit-improvement.ts"
Cohesion: 0.18
Nodes (19): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+11 more)

### Community 114 - "evidence-digest.ts"
Cohesion: 0.44
Nodes (7): canonical(), evidenceDigest(), evidenceHash(), semantic(), stableUrl(), requirementDrift(), RequirementPostimage

### Community 115 - "continue-access-only-plan.ts"
Cohesion: 0.57
Nodes (5): Document, isAccessOnlyPlan(), settledAccessOnlyState(), continueAccessOnlyPlan(), entryExists()

### Community 117 - "highestStableAtLeast"
Cohesion: 0.83
Nodes (3): compare(), highestStableAtLeast(), parts()

### Community 121 - "restoreInPlace"
Cohesion: 0.60
Nodes (5): identity(), Json, plain(), restorable(), restoreInPlace()

### Community 124 - "delivery-ownership.ts"
Cohesion: 0.33
Nodes (5): ref_node_async_hooks, Ownership, ownershipContext, refreshDeliveryOwnership(), RefreshOwnership

### Community 125 - "extraction.ts"
Cohesion: 0.33
Nodes (4): ref_node_string_decoder, extractDocument, Extraction, Extractor

### Community 126 - "handover-cms.ts"
Cohesion: 0.40
Nodes (4): ref_smol_toml, file, project, root

## Knowledge Gaps
- **498 isolated node(s):** `HEADLINE`, `Recorded`, `Props`, `LiveWorkerDisplay`, `PMQueueItem` (+493 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 641 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `dependency-bots/adopt.ts`, `config.ts`, `artifact`, `session-bridge.ts`, `candidate.ts`, `command`, `worker-runtime.ts`, `.getEffect`, `authorize.ts`, `reader.ts`, `scheduled-captures.ts`, `run-retrospective.ts`, `retrospective-triggers.ts`, `http/commands.ts`, `rootArtifact`, `github-delivery.ts`, `lesson-selection.ts`, `maintenance/maintenance.ts`, `cost-ledger.ts`, `jira-time.ts`, `digest`, `agents.ts`, `conversations/conversations.ts`, `sanitize`, `features.ts`, `scheduled-work.ts`, `inspect-closed-plan.ts`, `time-scope.ts`, `closeout-recovery.ts`, `ledger.ts`, `.activeClaims`, `time-readback.ts`, `create-candidate.ts`, `assignments.ts`, `interrupted-work-recovery.ts`, `move-lane.ts`, `outbox.ts`, `cec.ts`, `tracking-issue.ts`, `weekly-rollup.ts`, `publication.ts`, `JiraIssuePublisher`, `blocker-followups.ts`, `pilot-delivery.ts`, `run.ts`, `stopped-base-provider.ts`, `ticket-evidence.ts`, `run-accounting.ts`, `remove-candidate.ts`, `continue-ownership-read.ts`, `Ticket`, `daily-cto.ts`, `ref_zod`, `ref_node_path`, `activation-recovery.ts`, `coordination.ts`, `OfficeSnapshot`, `index.ts`, `HOLDS`, `it-specialist.ts`, `CEC`, `accept-stage-result.ts`, `assignment-poll.ts`, `github/issue-publication.ts`, `brain-maintenance.ts`, `.emit`, `recovery-ledger.ts`, `shared.ts`, `ticket-stage-runner.ts`, `read-retries.ts`, `workKey`, `retire-history.ts`, `dependencies.ts`, `admit-improvement.ts`, `continue-access-only-plan.ts`, `ProjectProgress`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._
- **Why does `Role` connect `Role` to `Inspector.tsx`, `worker-runtime.ts`, `App.tsx`, `retrospective-triggers.ts`, `http/commands.ts`, `github-delivery.ts`, `maintenance/maintenance.ts`, `agents.ts`, `conversations/conversations.ts`, `Store`, `.activeClaims`, `OfficeScene.tsx`, `outbox.ts`, `cec.ts`, `run-accounting.ts`, `work.ts`, `Ticket`, `scene-motion.ts`, `ref_node_path`, `OfficeSnapshot`, `index.ts`, `accept-stage-result.ts`, `.emit`, `recovery-ledger.ts`, `shared.ts`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `Coordinator` connect `executeRequest` to `conversations/conversations.ts`, `brain-maintenance.ts`, `scheduled-work.ts`, `Store`, `artifact`, `command`, `dependencies.ts`, `scheduled-captures.ts`, `activation-recovery.ts`, `coordination.ts`, `pilot-delivery.ts`, `assignment-poll.ts`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **What connects `HEADLINE`, `Recorded`, `Props` to the rest of the system?**
  _498 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `TimeBook.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1455026455026455 - nodes in this community are weakly interconnected._
- **Should `Role` be split into smaller, more focused modules?**
  _Cohesion score 0.10693877551020409 - nodes in this community are weakly interconnected._
- **Should `config.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11468926553672316 - nodes in this community are weakly interconnected._