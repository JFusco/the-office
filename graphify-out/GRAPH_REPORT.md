# Graph Report - the-office  (2026-11-16)

## Corpus Check
- 825 files · ~326,490 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4045 nodes · 18651 edges · 109 communities (106 shown, 3 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 604 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0b121381`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- index.tsx
- ref_node_path
- dependency-bots/adopt.ts
- scheduled-features.ts
- Inspector.tsx
- artifact
- session-bridge.ts
- Button
- agents.ts
- Feature
- worker-runtime.ts
- slack-supersession.ts
- App.tsx
- command
- assignments.ts
- scheduled-captures.ts
- run-retrospective.ts
- record-trigger.ts
- accept-stage-result.ts
- workKey
- features.ts
- Ticket
- shared.ts
- resume-provider-review.ts
- knowledge.ts
- maintenance/maintenance.ts
- cost-ledger.ts
- activation-recovery.ts
- dependencies.ts
- jira-time.ts
- digest
- useOfficePreferences.ts
- sanitize
- lesson-selection.ts
- sanitizeObject
- config.ts
- scheduled-work.ts
- telemetry.ts
- closeout-recovery.ts
- owned-artifact.ts
- assignment-poll.ts
- time-scope.ts
- copy.ts
- run-accounting.ts
- pilot-delivery.ts
- Coordinator
- OfficeScene.tsx
- engine.ts
- enrollment-gate.ts
- demand-facts.ts
- .emit
- harness-baseline.ts
- notifications.ts
- cec/workflow.ts
- work.ts
- weekly-rollup.ts
- github-delivery.ts
- TimeBook.tsx
- continue-ownership-read.ts
- Store
- retrospective-subject.ts
- ledger.ts
- Effects
- remove-candidate.ts
- ticket-evidence.ts
- JiraIssuePublisher
- QuestionStepper.tsx
- daily-cto.ts
- effects.ts
- coordination.ts
- constellation-runtime.ts
- process.ts
- Offices
- report.ts
- index.ts
- admit-improvement.ts
- pre-push-boundary.ts
- TicketJob
- github/issue-publication.ts
- harnessEffect
- office-lessons.ts
- discovery-recovery.ts
- tracking-issue.ts
- preferences-store.ts
- checkpoint-completion.ts
- cto-input-resolution.ts
- local-config.ts
- api-routes.ts
- unblock-brief.ts
- interrupted-work-recovery.ts
- continue-unsealed-qa.ts
- time-readback.ts
- blocker-followups.ts
- evidence-digest.ts
- seeded-office-lessons.ts
- capture-session-clone.py
- document.ts
- Conversation.tsx
- .save
- create-candidate.ts
- CommittedBrain
- delivery-ownership.ts
- ProjectProgress
- outbox.ts
- highestStableAtLeast
- extract-worker.mjs
- command-registry.ts
- retire-history.ts
- merge-summary.ts

## God Nodes (most connected - your core abstractions)
1. `Store` - 365 edges
2. `TicketJob` - 168 edges
3. `digest()` - 150 edges
4. `command()` - 115 edges
5. `GitHubDelivery` - 114 edges
6. `artifact()` - 114 edges
7. `workKey()` - 94 edges
8. `OfficeSnapshot` - 88 edges
9. `cx()` - 88 edges
10. `currentAssignment()` - 86 edges

## Surprising Connections (you probably didn't know these)
- `LessonBrainOverlap` --references--> `Lesson`  [EXTRACTED]
  server/knowledge/lesson-brain-audit.ts → src/contracts/knowledge.ts
- `DeliverySlot` --references--> `Role`  [EXTRACTED]
  server/office/projects.ts → src/shared.ts
- `apply()` --indirect_call--> `note()`  [INFERRED]
  src/conversations/OutboxSavedImplementation.tsx → server/cec/parking/resume-parked.ts
- `touchesUnsettled()` --calls--> `workKey()`  [EXTRACTED]
  server/operations/stale-records.ts → src/contracts/work.ts
- `scheduledWork()` --calls--> `deliveryRepairProjection()`  [EXTRACTED]
  server/scheduling/scheduled-work.ts → src/work/delivery-repair-projection.ts

## Import Cycles
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/parking/resume-provider-review.ts -> server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/parking/resume-provider-review.ts`
- 3-file cycle: `server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts`
- 4-file cycle: `server/delivery/recovery/validation/validation-readback.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/validation/validation-readback.ts`
- 4-file cycle: `server/delivery/recovery/implementation/activation-recovery.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/implementation/activation-recovery.ts`
- 4-file cycle: `server/delivery/recovery/implementation/saved-prerequisite-handoff.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/implementation/saved-prerequisite-handoff.ts`
- 4-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 4-file cycle: `server/delivery/recovery/stopped-base-review.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/stopped-base-review.ts`
- 4-file cycle: `server/features/delivery-binding.ts -> server/features/enrollment-gate.ts -> server/features/progression/failure.ts -> server/store/effects.ts -> server/features/delivery-binding.ts`
- 5-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/stage-reconciliation.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 5-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 5-file cycle: `server/delivery/recovery/implementation/continuation-evidence.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/recovery/implementation/continuation-evidence.ts`
- 5-file cycle: `server/delivery/recovery/implementation/saved-prerequisite-handoff.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/recovery/implementation/saved-prerequisite-handoff.ts`
- 5-file cycle: `server/delivery/recovery/scope-repair/scope-repair-readback.ts -> server/delivery/recovery/scope-repair/scope-repair-resume.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/scope-repair/scope-repair-readback.ts`
- 5-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/scope-repair/scope-repair-resume.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 5-file cycle: `server/delivery/recovery/implementation/continuation-evidence.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/implementation/implementation-recovery.ts -> server/delivery/recovery/implementation/continuation-evidence.ts`
- 5-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/board-preflight.ts -> server/delivery/pipeline/github-delivery.ts`
- 5-file cycle: `server/delivery/recovery/implementation/continuation-evidence.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/preparation/post-conflict-preparation.ts -> server/delivery/recovery/implementation/continuation-evidence.ts`
- 5-file cycle: `server/delivery/recovery/preparation/post-conflict-preparation.ts -> server/delivery/recovery/preparation/preparation-checkpoint.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/preparation/post-conflict-preparation.ts`

## Communities (109 total, 3 thin omitted)

### Community 0 - "index.tsx"
Cohesion: 0.05
Nodes (57): FeatureRound, SendMessage, ctoInputFailure(), OutboxCTOInput(), recover(), OutboxMaintenanceStatus(), OutboxSavedImplementation(), apply() (+49 more)

### Community 1 - "ref_node_path"
Cohesion: 0.09
Nodes (47): ref_node_fs, ref_node_os, ref_node_path, ref_node_util, GitRead, patchArgs, sourceCopyMatches(), interruptedImplementation() (+39 more)

### Community 2 - "dependency-bots/adopt.ts"
Cohesion: 0.16
Nodes (22): Execute, adoptDependabot(), closesIssue(), DEPENDABOT, dependabotPR, openDependabotPulls(), readRepo(), refusal() (+14 more)

### Community 3 - "scheduled-features.ts"
Cohesion: 0.12
Nodes (37): featureItemComplete(), reconcileFeatureCompletion(), automaticIntakeWait(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS, reserveReplacement(), stageBudget() (+29 more)

### Community 4 - "Inspector.tsx"
Cohesion: 0.10
Nodes (67): Outbox(), blockedSummary(), itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps(), ServiceHealthPanel(), followUp() (+59 more)

### Community 5 - "artifact"
Cohesion: 0.08
Nodes (58): deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, gateRegisteredDelivery(), resolveDeliveryWork(), boardPreflightCandidate(), Ownership (+50 more)

### Community 6 - "session-bridge.ts"
Cohesion: 0.05
Nodes (59): ref_node_perf_hooks, ref_node_url, ref_ws, file, folder, logs, root, claudeSessionContext() (+51 more)

### Community 7 - "Button"
Cohesion: 0.07
Nodes (77): ref_react, ref_react_markdown, ref_remark_gfm, Activity(), ActivityTimeline(), AssignmentKnowledge(), Lookup(), BrainWorkspace() (+69 more)

### Community 8 - "agents.ts"
Cohesion: 0.05
Nodes (48): ref_zod, IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), intakeMembership(), projectListScope(), cecIntakePrompt() (+40 more)

### Community 9 - "Feature"
Cohesion: 0.14
Nodes (14): GitHubFeaturePublisher, helperTelemetry(), observeHelperGroups(), stopHelperGroups(), FeatureReviewRunner, stopReview(), dispatchExposure(), prepareExposure() (+6 more)

### Community 10 - "worker-runtime.ts"
Cohesion: 0.06
Nodes (46): SlackResultSchema, SlackVerificationSchema, candidateWorkspaceEnvironment(), ApproachSchema, assignmentSubject(), assertBriefingScope(), LOCAL_BINDINGS, contextPacket() (+38 more)

### Community 11 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 12 - "App.tsx"
Cohesion: 0.06
Nodes (50): ref_lucide_react, ref_motion, ref_react_dom, BrainDrawer(), themeColor, App(), BrainWorkspace, CONNECTION (+42 more)

### Community 13 - "command"
Cohesion: 0.08
Nodes (57): approveFeature(), commandFeature(), featureById(), mutation(), reviewQuestions(), discoveryPrompt(), planPrompt(), artifactPath() (+49 more)

### Community 14 - "assignments.ts"
Cohesion: 0.10
Nodes (34): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, GraphNode (+26 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.14
Nodes (48): dispatchNightly(), requestDelivery(), createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture() (+40 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.08
Nodes (46): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, blockingTrigger, brainOverlap, brainOverlapQuery() (+38 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.10
Nodes (43): isBlocking(), baselineLearning(), LEARNING_BASELINES, maintainLearning(), configureKnowledge(), busyMaintenanceIds(), clip(), maintenanceBlockedId() (+35 more)

### Community 18 - "accept-stage-result.ts"
Cohesion: 0.11
Nodes (40): acceptStageResult(), assertDraftClaimHistory(), linkDraftIssue(), protectedOriginalClaim(), METADATA_FINDING, publicationReadArgs(), Read, readPublication() (+32 more)

### Community 19 - "workKey"
Cohesion: 0.07
Nodes (61): partialLocalCleanupCandidate(), completedPRReviews(), assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), reconcileCompletedConflictDraft() (+53 more)

### Community 20 - "features.ts"
Cohesion: 0.08
Nodes (29): Assignment, Content, jiraText(), Transition, descriptionPreimage(), plain(), JiraFeaturePublisher, FeatureAttempt (+21 more)

### Community 21 - "Ticket"
Cohesion: 0.11
Nodes (28): implementationWorkerContext(), cecPrompt(), resolvedDecisionNote(), reviewedPlanGuidance, reviewedPlanGuideDigest, qaPlanEvidenceGap(), qaRunDirectory(), APPROACH_GUIDANCE (+20 more)

### Community 22 - "shared.ts"
Cohesion: 0.07
Nodes (55): DailyCTOSummary, Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona (+47 more)

### Community 23 - "resume-provider-review.ts"
Cohesion: 0.19
Nodes (27): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), ProjectCard, projectCards(), projectGraphql() (+19 more)

### Community 24 - "knowledge.ts"
Cohesion: 0.07
Nodes (32): lessonBrainAudit, LessonBrainOverlap, BRAIN_SCOPE, SUBJECT, Kind, RetrospectiveResult, RetrospectiveResultSchema, RollupResultSchema (+24 more)

### Community 25 - "maintenance/maintenance.ts"
Cohesion: 0.09
Nodes (30): maintenancePolicies(), captureLearning(), captureMaintenanceStep(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice() (+22 more)

### Community 26 - "cost-ledger.ts"
Cohesion: 0.15
Nodes (28): captureCost(), server_telemetry_cost_entries_costcoveragesummary, costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId() (+20 more)

### Community 27 - "activation-recovery.ts"
Cohesion: 0.06
Nodes (83): pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash (+75 more)

### Community 28 - "dependencies.ts"
Cohesion: 0.10
Nodes (31): deliveryIntakeBlocker(), Admission, admit(), IntakeContext, WAIT_STATUSES, resumeParked(), compatible(), dependencyCompletionKey() (+23 more)

### Community 29 - "jira-time.ts"
Cohesion: 0.14
Nodes (20): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+12 more)

### Community 30 - "digest"
Cohesion: 0.13
Nodes (46): activeEffectId(), admitPRMetadata(), assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema, savedMetadataAssessment(), validateSaved() (+38 more)

### Community 31 - "useOfficePreferences.ts"
Cohesion: 0.23
Nodes (11): acceptPreferences(), PreferenceCandidate, strip(), UNKNOWN_PREFERENCES, OfficePreferencesController, PreferenceFeedback, PreferenceField, requestPreferences() (+3 more)

### Community 32 - "sanitize"
Cohesion: 0.08
Nodes (36): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+28 more)

### Community 33 - "lesson-selection.ts"
Cohesion: 0.13
Nodes (22): installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), LessonSelection, MAINTENANCE, MAX_LESSONS, normalPath() (+14 more)

### Community 34 - "sanitizeObject"
Cohesion: 0.08
Nodes (35): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+27 more)

### Community 35 - "config.ts"
Cohesion: 0.11
Nodes (19): ref_node_stream, ref_node_timers, CommentPage, commentReadback(), JiraOperations, plain(), jiraRecord(), unpack() (+11 more)

### Community 36 - "scheduled-work.ts"
Cohesion: 0.10
Nodes (37): freshOwnershipRead(), deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), withAmendmentOwnership(), metadataRequestResolved(), preparationRequestResolved(), requestPriority() (+29 more)

### Community 37 - "telemetry.ts"
Cohesion: 0.12
Nodes (22): CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL, Rates (+14 more)

### Community 38 - "closeout-recovery.ts"
Cohesion: 0.11
Nodes (40): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+32 more)

### Community 39 - "owned-artifact.ts"
Cohesion: 0.22
Nodes (14): investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_SOURCE_PATHS, officeSource(), ROOT, done() (+6 more)

### Community 40 - "assignment-poll.ts"
Cohesion: 0.40
Nodes (7): noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), syncOutbox(), admitReadyCards(), poll(), readAssignments()

### Community 41 - "time-scope.ts"
Cohesion: 0.13
Nodes (31): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), server_telemetry_billable_work_issue_key, isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence() (+23 more)

### Community 42 - "copy.ts"
Cohesion: 0.20
Nodes (13): nativeGitRead(), savedImplementation(), sha(), sourceFiles(), ContinuationIO, nativeIO, absent(), candidateParent() (+5 more)

### Community 43 - "run-accounting.ts"
Cohesion: 0.08
Nodes (41): BoundedRead, EvidenceOutcome, backfillClaudeCost(), CompletionReader, add(), CodexRequest, CodexRollout, CodexTokens (+33 more)

### Community 44 - "pilot-delivery.ts"
Cohesion: 0.12
Nodes (22): candidateBranchMoved(), continueImplementation(), assertOwnership(), drainDelivery(), resume(), startPilot(), Document, isAccessOnlyPlan() (+14 more)

### Community 45 - "Coordinator"
Cohesion: 0.08
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 46 - "OfficeScene.tsx"
Cohesion: 0.07
Nodes (67): ref_react_three_drei, ref_react_three_fiber, ref_three_stdlib, itAgent(), itDiagnostics(), displayAgentTask(), withoutElapsed(), CameraBookmark (+59 more)

### Community 47 - "engine.ts"
Cohesion: 0.08
Nodes (12): correlatedBuild(), checkMail(), drainMail(), requestMail(), enableNightly(), drainMaintenance(), reconcileMaintenance(), requestMaintenance() (+4 more)

### Community 48 - "enrollment-gate.ts"
Cohesion: 0.18
Nodes (19): eligibility(), approvedDelivery(), bindDelivery(), featureDeliveryContext(), featureEffectGate(), assertFeatureGate(), bindFeature(), currentApproval() (+11 more)

### Community 49 - "demand-facts.ts"
Cohesion: 0.11
Nodes (22): clip(), DEMAND_LIMIT, demandFacts(), key(), LessonKey, notes(), clip(), MISSED_QUERY_LIMIT (+14 more)

### Community 50 - ".emit"
Cohesion: 0.18
Nodes (20): decideImplementation(), requestQAPlanRetry(), configureNotices(), retryRecipientLookup(), recoverCTOInput(), failedWorker(), requeueWaitedImplement(), enqueueMetadataRecovery() (+12 more)

### Community 51 - "harness-baseline.ts"
Cohesion: 0.16
Nodes (19): baselineReport, BaselineSource, baselineText(), millions(), row(), share(), add(), BaselineState (+11 more)

### Community 52 - "notifications.ts"
Cohesion: 0.16
Nodes (16): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), Identity, MergeNotifications, NoticeSettings (+8 more)

### Community 53 - "cec/workflow.ts"
Cohesion: 0.12
Nodes (34): applyIntakeObservation(), parksInJira(), MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), run(), ingest(), nextStage() (+26 more)

### Community 54 - "work.ts"
Cohesion: 0.09
Nodes (30): PrerequisitesSchema, classifyStop(), BLOCKED_CAUSES, blockedCauses(), projectReadiness(), incompleteReadOutput(), IntakeResult, planReadRetry() (+22 more)

### Community 55 - "weekly-rollup.ts"
Cohesion: 0.13
Nodes (28): expireLearningPackets(), packetReferences(), learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck() (+20 more)

### Community 56 - "github-delivery.ts"
Cohesion: 0.06
Nodes (86): containedFile(), findingsBlock(), requireDeliveryAuthority(), assertDeliveryMayMutate(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery() (+78 more)

### Community 57 - "TimeBook.tsx"
Cohesion: 0.10
Nodes (38): TelemetryReport, AzureBuild, src_shared_liveanchor, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens() (+30 more)

### Community 58 - "continue-ownership-read.ts"
Cohesion: 0.28
Nodes (11): continueOwnershipRead(), expiredOwnershipRead(), ownershipReadGate(), ownershipReadState(), ownershipReadHistory(), ownershipReadSource(), readOwnershipCandidate, ReadOwnershipView (+3 more)

### Community 59 - "Store"
Cohesion: 0.06
Nodes (37): ref_node_crypto, ref_node_sqlite, ROLES, packedConsumerPnpmRepair(), sha256(), QuestionNotifications, Clock, systemClock (+29 more)

### Community 60 - "retrospective-subject.ts"
Cohesion: 0.13
Nodes (23): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, maintenanceKey(), azurePrUrl(), findSubject(), jobSubject() (+15 more)

### Community 61 - "ledger.ts"
Cohesion: 0.14
Nodes (25): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationCandidates(), investigationId(), ctoReplacementResolution(), investigationFollowUps(), implementationReplacementResolution(), investigationResolution() (+17 more)

### Community 62 - "Effects"
Cohesion: 0.19
Nodes (11): publishFeature(), GitHubOperations, fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), lessonText(), Assessment, closeNativeRefresh() (+3 more)

### Community 63 - "remove-candidate.ts"
Cohesion: 0.18
Nodes (18): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot() (+10 more)

### Community 64 - "ticket-evidence.ts"
Cohesion: 0.13
Nodes (24): ref_node_string_decoder, assetDownloader(), attachmentKind(), evidenceDirectory(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS (+16 more)

### Community 65 - "JiraIssuePublisher"
Cohesion: 0.26
Nodes (3): JiraIssuePublisher, keyOf(), publicationDescription()

### Community 66 - "QuestionStepper.tsx"
Cohesion: 0.21
Nodes (17): FeatureQuestionProjection, OutboxQuestionRound(), send(), draftKey(), readDraft(), saveDraft(), nextQuestion(), orderedQuestions() (+9 more)

### Community 67 - "daily-cto.ts"
Cohesion: 0.05
Nodes (46): leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), collectCTOFacts(), DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts (+38 more)

### Community 68 - "effects.ts"
Cohesion: 0.17
Nodes (14): accounting, DeliverySubject, nonDelivery, originalReads, assertFeatureDependencyOrder(), featureDependencyEdges(), key(), reconcilePublication() (+6 more)

### Community 69 - "coordination.ts"
Cohesion: 0.19
Nodes (17): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation(), checkpointWindow(), dueAt() (+9 more)

### Community 70 - "constellation-runtime.ts"
Cohesion: 0.06
Nodes (53): ref_3d_force_graph, ref_three, KnowledgeActivity, KnowledgeEdge, KnowledgeMap, KnowledgeNode, ATMOSPHERE, mapAtmosphere() (+45 more)

### Community 71 - "process.ts"
Cohesion: 0.16
Nodes (18): ref_node_child_process, inactivityWatch(), At, errno, GroupInventory, GroupProbe, LifecycleDiagnostic, Phase (+10 more)

### Community 72 - "Offices"
Cohesion: 0.15
Nodes (8): ref_smol_toml, file, project, root, projectById(), projectData(), Offices, markCaptureStart()

### Community 73 - "report.ts"
Cohesion: 0.22
Nodes (15): telemetryRoute(), TelemetryRow, TelemetrySync, Acc, bump(), EASTERN, easternDay(), modelShares() (+7 more)

### Community 74 - "index.ts"
Cohesion: 0.08
Nodes (28): ref_hono_node_server, ref_node_http, ref_vite, close(), config, itSpecialist, loadedRevision, offices (+20 more)

### Community 75 - "admit-improvement.ts"
Cohesion: 0.23
Nodes (14): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+6 more)

### Community 76 - "pre-push-boundary.ts"
Cohesion: 0.43
Nodes (5): Event, one(), prePushRejection(), PushIdentity, settledPushBoundary()

### Community 77 - "TicketJob"
Cohesion: 0.06
Nodes (51): Execute, installDependencies(), major(), removeAdoptedClone(), harnessCloseout(), PASSING, verifyMergeActions(), namedRepairIds() (+43 more)

### Community 78 - "github/issue-publication.ts"
Cohesion: 0.15
Nodes (11): FeaturePublisher, PublicationReceipt, Assign, Board, Content, GitHubIssuePublisher, number(), same() (+3 more)

### Community 79 - "harnessEffect"
Cohesion: 0.22
Nodes (13): harnessEffect, readBackOrThrow(), retryRead(), linkedBody(), linkPR(), editorMatches(), relinkPinCourier(), sha() (+5 more)

### Community 80 - "office-lessons.ts"
Cohesion: 0.27
Nodes (9): normalizeStatement(), decideOfficeProposal(), now(), OfficeKnowledgeStore, proposeOfficeLessons(), retireOfficeLesson(), Input, promoteNoteLesson() (+1 more)

### Community 81 - "discovery-recovery.ts"
Cohesion: 0.26
Nodes (11): Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership, rawHash() (+3 more)

### Community 82 - "tracking-issue.ts"
Cohesion: 0.33
Nodes (10): ensureTrackingIssue(), findTrackingIssue(), ownTracking(), TrackingIssue, trackingIssueBody(), trackingIssueTitle(), trackingMarker(), centralCompanionHandoff() (+2 more)

### Community 83 - "preferences-store.ts"
Cohesion: 0.19
Nodes (9): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS (+1 more)

### Community 84 - "checkpoint-completion.ts"
Cohesion: 0.12
Nodes (17): BrainStatusSchema, identity, brainCheckpointCompletion(), coverageSchema, followupSchema, verified, reconcileCompletedCheckpoints(), checkpointHasMaintenanceAlert() (+9 more)

### Community 86 - "local-config.ts"
Cohesion: 0.28
Nodes (11): AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), FeaturePlanningBindings, goalEvidencePath(), OfficeConfigInputs, officeConfigRoute(), officeConfigSummary(), CECBinding (+3 more)

### Community 87 - "api-routes.ts"
Cohesion: 0.10
Nodes (27): implementationPreview(), implementationContinuationRoute(), closedReadonlyPlan(), Document, entryExists(), inspectClosedQAPlan(), qaPlanRetryRoute(), saveGoals() (+19 more)

### Community 88 - "unblock-brief.ts"
Cohesion: 0.53
Nodes (5): clearUnblockBrief(), key(), saveUnblockBrief(), unblockBrief, src_shared_learningsubject

### Community 89 - "interrupted-work-recovery.ts"
Cohesion: 0.36
Nodes (7): interruptAdoptions(), legacy(), REMOVED_FIELDS, retireLegacyRecovery(), goalNoticeNeverDispatched(), maintenanceNoticeNeverDispatched(), recover()

### Community 90 - "continue-unsealed-qa.ts"
Cohesion: 0.15
Nodes (15): ImplementationDecision, OwnershipRead, continueUnsealedQA(), entry(), handoffOwnership(), ReadbackOwnerDecision, Decision, ImplementationContinuation (+7 more)

### Community 91 - "time-readback.ts"
Cohesion: 0.31
Nodes (5): TimeLedger, Readback, READBACK_INTERVAL_MS, readBackTime(), SETTLE_MS

### Community 92 - "blocker-followups.ts"
Cohesion: 0.11
Nodes (29): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), projectOutbox(), itChatPrompt(), partialLocalCleanupKey(), savedAdmissionUnresolved() (+21 more)

### Community 93 - "evidence-digest.ts"
Cohesion: 0.44
Nodes (7): canonical(), evidenceDigest(), evidenceHash(), semantic(), stableUrl(), requirementDrift(), RequirementPostimage

### Community 94 - "seeded-office-lessons.ts"
Cohesion: 0.32
Nodes (5): CONSOLIDATED, CONSOLIDATED_AT, SEEDS, seedOfficeLessons(), SEEDS

### Community 95 - "capture-session-clone.py"
Cohesion: 0.15
Nodes (10): ctypes, errno, importlib_util, json, os, pathlib, Copy a coherent macOS clone of inherited reader fd3 to anonymous target fd4. No…, Read-only protocol adapter for the installed review helper. No model dispatch. (+2 more)

### Community 96 - "document.ts"
Cohesion: 0.38
Nodes (5): ref_yaml, guidanceExcerpt(), DocumentMetadata, documentText(), KnowledgeDocumentText

### Community 97 - "Conversation.tsx"
Cohesion: 0.11
Nodes (29): knowledgeOutbox(), Conversation(), LessonDecisionAction, lessonDecisionState(), readLessonDecision(), DAYS, dueLessonDecisions(), easternWeek() (+21 more)

### Community 98 - ".save"
Cohesion: 0.21
Nodes (27): jiraCollection(), BLOCKED, findComment(), LiveIssue, readIssue(), readIssues(), Execute, jira() (+19 more)

### Community 99 - "create-candidate.ts"
Cohesion: 0.48
Nodes (6): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf()

### Community 101 - "delivery-ownership.ts"
Cohesion: 0.33
Nodes (5): ref_node_async_hooks, Ownership, ownershipContext, refreshDeliveryOwnership(), RefreshOwnership

### Community 103 - "outbox.ts"
Cohesion: 0.15
Nodes (23): ADOPTION_STALLED_MS, compactSteps(), HumanAction, STAGE_ROLE, deliveryRepairProjection(), ACTIVE, maintenanceUpdate(), PMQueueItem (+15 more)

### Community 104 - "highestStableAtLeast"
Cohesion: 0.83
Nodes (3): compare(), highestStableAtLeast(), parts()

### Community 105 - "extract-worker.mjs"
Cohesion: 0.43
Nodes (6): ref_mammoth, ref_pdfjs_dist, bounded(), extract(), fail(), [path,kind]

### Community 111 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 114 - "retire-history.ts"
Cohesion: 0.31
Nodes (8): readHistoryScope(), enqueueHistoryRetirement(), historicalRecordDigest(), Intent, records(), retireIncompleteHistory(), HistoryRetirement, HistoryRetirementIntent

### Community 115 - "merge-summary.ts"
Cohesion: 0.36
Nodes (7): clamp(), LIMITS, MergedPR, plainSlackText(), section(), shippedSummary(), mergeText()

## Knowledge Gaps
- **481 isolated node(s):** `STOPPED`, `REOBSERVED`, `FINISHED`, `DELIVERY_RECOVERY`, `DeliverySubject` (+476 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 619 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `index.tsx`, `ref_node_path`, `dependency-bots/adopt.ts`, `scheduled-features.ts`, `artifact`, `session-bridge.ts`, `agents.ts`, `Feature`, `worker-runtime.ts`, `command`, `assignments.ts`, `scheduled-captures.ts`, `run-retrospective.ts`, `record-trigger.ts`, `accept-stage-result.ts`, `workKey`, `features.ts`, `Ticket`, `resume-provider-review.ts`, `maintenance/maintenance.ts`, `cost-ledger.ts`, `activation-recovery.ts`, `dependencies.ts`, `jira-time.ts`, `digest`, `sanitize`, `lesson-selection.ts`, `sanitizeObject`, `config.ts`, `scheduled-work.ts`, `closeout-recovery.ts`, `owned-artifact.ts`, `time-scope.ts`, `copy.ts`, `run-accounting.ts`, `pilot-delivery.ts`, `Coordinator`, `engine.ts`, `enrollment-gate.ts`, `demand-facts.ts`, `.emit`, `notifications.ts`, `cec/workflow.ts`, `work.ts`, `weekly-rollup.ts`, `github-delivery.ts`, `continue-ownership-read.ts`, `retrospective-subject.ts`, `ledger.ts`, `Effects`, `remove-candidate.ts`, `ticket-evidence.ts`, `JiraIssuePublisher`, `daily-cto.ts`, `effects.ts`, `coordination.ts`, `Offices`, `report.ts`, `admit-improvement.ts`, `TicketJob`, `github/issue-publication.ts`, `harnessEffect`, `office-lessons.ts`, `discovery-recovery.ts`, `tracking-issue.ts`, `checkpoint-completion.ts`, `api-routes.ts`, `interrupted-work-recovery.ts`, `continue-unsealed-qa.ts`, `time-readback.ts`, `blocker-followups.ts`, `.save`, `create-candidate.ts`, `ProjectProgress`, `retire-history.ts`?**
  _High betweenness centrality (0.100) - this node is a cross-community bridge._
- **Why does `TicketJob` connect `TicketJob` to `ref_node_path`, `dependency-bots/adopt.ts`, `Inspector.tsx`, `artifact`, `Button`, `App.tsx`, `record-trigger.ts`, `accept-stage-result.ts`, `workKey`, `Ticket`, `shared.ts`, `resume-provider-review.ts`, `activation-recovery.ts`, `dependencies.ts`, `digest`, `scheduled-work.ts`, `closeout-recovery.ts`, `enrollment-gate.ts`, `cec/workflow.ts`, `github-delivery.ts`, `Store`, `retrospective-subject.ts`, `remove-candidate.ts`, `daily-cto.ts`, `effects.ts`, `harnessEffect`, `discovery-recovery.ts`, `checkpoint-completion.ts`, `interrupted-work-recovery.ts`, `blocker-followups.ts`, `create-candidate.ts`, `ProjectProgress`, `outbox.ts`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `OfficeSnapshot` connect `index.tsx` to `Inspector.tsx`, `Button`, `App.tsx`, `record-trigger.ts`, `shared.ts`, `maintenance/maintenance.ts`, `useOfficePreferences.ts`, `sanitize`, `sanitizeObject`, `OfficeScene.tsx`, `harness-baseline.ts`, `cec/workflow.ts`, `work.ts`, `TimeBook.tsx`, `Store`, `ledger.ts`, `daily-cto.ts`, `index.ts`, `checkpoint-completion.ts`, `cto-input-resolution.ts`, `api-routes.ts`, `interrupted-work-recovery.ts`, `Conversation.tsx`, `outbox.ts`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **What connects `STOPPED`, `REOBSERVED`, `FINISHED` to the rest of the system?**
  _481 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `index.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.051189400782896716 - nodes in this community are weakly interconnected._
- **Should `ref_node_path` be split into smaller, more focused modules?**
  _Cohesion score 0.08558108558108558 - nodes in this community are weakly interconnected._
- **Should `scheduled-features.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12409288824383163 - nodes in this community are weakly interconnected._