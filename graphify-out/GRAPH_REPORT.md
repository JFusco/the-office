# Graph Report - the-office  (2026-11-13)

## Corpus Check
- 753 files · ~311,082 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3862 nodes · 18034 edges · 98 communities (96 shown, 2 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 583 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `cc7f8ba2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- github-delivery.ts
- config.ts
- dependency-bots/adopt.ts
- Inspector.tsx
- artifact
- ticket-evidence.ts
- GitHubIssuePublisher
- scheduler.ts
- publication.ts
- digest
- App.tsx
- agents.ts
- currentAssignment
- preparation-readback.ts
- worker-runtime.ts
- reader.ts
- Button
- session-bridge.ts
- ControlStore
- TicketJob
- maintenance/maintenance.ts
- security.ts
- run-retrospective.ts
- lesson-selection.ts
- scheduled-captures.ts
- features.ts
- api-routes.ts
- index.tsx
- preferences-store.ts
- source-amendment.ts
- harnessEffect
- ref_node_path
- assignments.ts
- PeoplePanel.tsx
- enrollment-gate.ts
- cec/workflow.ts
- requests.ts
- TimeBook.tsx
- index.ts
- record-trigger.ts
- cost-ledger.ts
- source-amendment-scope.ts
- constellation-runtime.ts
- remove-candidate.ts
- control-store.ts
- scheduled-work.ts
- OfficeScene.tsx
- .emit
- run.ts
- telemetry.ts
- owned-artifact.ts
- FeatureWorkspace.tsx
- coordination.ts
- it-specialist.ts
- jira-time.ts
- dependencies.ts
- daily-cto.ts
- retire-history.ts
- ITFollowUps.tsx
- JiraIssuePublisher
- Store
- knowledge.ts
- time-scope.ts
- assignment-poll.ts
- scene-motion.ts
- fact-bounds.ts
- ref_node_crypto
- install-service.mjs
- admit-improvement.ts
- shared.ts
- ref_zod
- node-visuals.ts
- store.ts
- .getEffect
- DailyCTO.tsx
- cec/issue-publication.ts
- report.ts
- RoomCamera.tsx
- icons.tsx
- local-config.ts
- diagnostic-snapshot.ts
- codex-rollout.ts
- command-registry.ts
- tracking-issue.ts
- extract-worker.mjs
- helper-evidence.py
- .save
- run-accounting.ts
- ledger.ts
- blocker-followups.ts
- create-candidate.ts
- leadership.ts
- evidence-digest.ts
- highestStableAtLeast
- createConstellation
- Offices
- useOfficePreferences.ts
- ProjectProgress

## God Nodes (most connected - your core abstractions)
1. `Store` - 341 edges
2. `TicketJob` - 174 edges
3. `digest()` - 156 edges
4. `artifact()` - 129 edges
5. `GitHubDelivery` - 122 edges
6. `command()` - 108 edges
7. `workKey()` - 92 edges
8. `cx()` - 87 edges
9. `currentAssignment()` - 82 edges
10. `Button` - 77 edges

## Surprising Connections (you probably didn't know these)
- `DeliveryAuthorityInput` --references--> `HarnessRequest`  [EXTRACTED]
  server/delivery/harness/delivery-authority.ts → src/contracts/work.ts
- `LessonBrainOverlap` --references--> `Lesson`  [EXTRACTED]
  server/knowledge/lesson-brain-audit.ts → src/contracts/knowledge.ts
- `scheduledWork()` --calls--> `deliveryRepairProjection()`  [EXTRACTED]
  server/scheduling/scheduled-work.ts → src/work/delivery-repair-projection.ts
- `scheduledWork()` --calls--> `deferredPickup()`  [EXTRACTED]
  server/scheduling/scheduled-work.ts → src/work/pickup-state.ts
- `EffectOperation` --references--> `WorkRef`  [EXTRACTED]
  server/store/effects.ts → src/contracts/work.ts

## Import Cycles
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/parking/resume-provider-review.ts -> server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/parking/resume-provider-review.ts`
- 3-file cycle: `server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts`
- 4-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 4-file cycle: `server/delivery/recovery/stopped-base-review.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/stopped-base-review.ts`
- 4-file cycle: `server/delivery/recovery/implementation/activation-recovery.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/implementation/activation-recovery.ts`
- 4-file cycle: `server/delivery/recovery/implementation/saved-prerequisite-handoff.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/implementation/saved-prerequisite-handoff.ts`
- 4-file cycle: `server/delivery/recovery/scope-repair/scope-repair-readback.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/scope-repair/scope-repair-readback.ts`
- 4-file cycle: `server/delivery/recovery/source-amendment/source-amendment.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/source-amendment/source-amendment.ts`
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

## Communities (98 total, 2 thin omitted)

### Community 0 - "github-delivery.ts"
Cohesion: 0.06
Nodes (98): containedFile(), removeAdoptedClone(), findingsBlock(), namedRepairIds(), assertDeliveryMayMutate(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers() (+90 more)

### Community 1 - "config.ts"
Cohesion: 0.10
Nodes (31): featureItemComplete(), reconcileFeatureCompletion(), discoveryPrompt(), planPrompt(), helperTelemetry(), reserveReplacement(), stageBudget(), classifyFeatureFailure() (+23 more)

### Community 2 - "dependency-bots/adopt.ts"
Cohesion: 0.16
Nodes (27): Execute, readBackOrThrow(), adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR (+19 more)

### Community 3 - "Inspector.tsx"
Cohesion: 0.08
Nodes (88): Conversation(), send(), Outbox(), SendMessage, recommendedReply(), slackMessageStatus(), SlackDeliveryCard(), FeatureWorkspace() (+80 more)

### Community 4 - "artifact"
Cohesion: 0.05
Nodes (117): boardPreflightCandidate(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal (+109 more)

### Community 5 - "ticket-evidence.ts"
Cohesion: 0.17
Nodes (21): plain(), unpack(), jiraRecord(), assetDownloader(), attachmentKind(), evidenceDirectory(), storeEvidence(), blankEvidence() (+13 more)

### Community 6 - "GitHubIssuePublisher"
Cohesion: 0.19
Nodes (7): FeaturePublisher, PublicationReceipt, GitHubIssuePublisher, number(), same(), FeatureManifestItem, FeatureOperation

### Community 7 - "scheduler.ts"
Cohesion: 0.07
Nodes (34): ROLES, BLOCKED_CAUSES, blockedCauses(), systemClock, fifo(), ScheduledWork, Scheduler, selectWork() (+26 more)

### Community 8 - "publication.ts"
Cohesion: 0.18
Nodes (12): featureById(), mutation(), Link, linkFeature(), publishFeature(), reconcilePublication(), uncertainPublications(), reserveIdentity() (+4 more)

### Community 9 - "digest"
Cohesion: 0.08
Nodes (69): Execute, installDependencies(), major(), harnessCloseout(), PASSING, verifyMergeActions(), activeEffectId(), retryRead() (+61 more)

### Community 10 - "App.tsx"
Cohesion: 0.05
Nodes (62): ref_motion, ref_react_dom, compactSteps(), FeatureDelivery(), FeatureDocuments(), views, BrainDrawer(), themeColor (+54 more)

### Community 11 - "agents.ts"
Cohesion: 0.06
Nodes (41): applyIntakeObservation(), intakeMembership(), cecPrompt(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), resolvedDecisionNote() (+33 more)

### Community 12 - "currentAssignment"
Cohesion: 0.09
Nodes (44): deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, requireDeliveryAuthority(), resolveDeliveryWork(), draftReadHeadMatches(), assertDraftClaimHistory() (+36 more)

### Community 13 - "preparation-readback.ts"
Cohesion: 0.12
Nodes (29): assertPostConflictOwnership(), bindPreparationBoardOrigins(), claimSchema, eventSchema, PreparationBoardOrigin, readPreparationBoardOrigins(), timestamp, updateSchema (+21 more)

### Community 14 - "worker-runtime.ts"
Cohesion: 0.05
Nodes (48): ref_smol_toml, candidateWorkspaceEnvironment(), assignmentSubject(), lessonPurpose(), catalogLine(), assertBriefingScope(), LOCAL_BINDINGS, file (+40 more)

### Community 15 - "reader.ts"
Cohesion: 0.10
Nodes (22): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, CommittedBrain (+14 more)

### Community 16 - "Button"
Cohesion: 0.07
Nodes (69): ref_react, ref_react_markdown, ref_remark_gfm, ref_yaml, KnowledgeActivity, KnowledgeActivityPage, KnowledgeEdge, KnowledgeMap (+61 more)

### Community 17 - "session-bridge.ts"
Cohesion: 0.07
Nodes (45): ref_ws, claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexDaemonProcesses(), accountCodexProcesses(), codexProcessInventory (+37 more)

### Community 18 - "ControlStore"
Cohesion: 0.15
Nodes (8): DailyCTO, EvidenceRequestConflict, reviewWeekday(), Briefing, saveReviewBriefing(), ControlStore, OfficeKnowledge, DailyCTOReport

### Community 19 - "TicketJob"
Cohesion: 0.06
Nodes (59): dependabotReviewGuidance(), pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), StageContext, deliveryTask(), GitHubDelivery, StagePromptInput, stageRole() (+51 more)

### Community 20 - "maintenance/maintenance.ts"
Cohesion: 0.06
Nodes (44): maintenancePolicies(), captureMaintenanceStep(), completeNativeCheckpoint(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, BrainStatusSchema, identity (+36 more)

### Community 21 - "security.ts"
Cohesion: 0.11
Nodes (28): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+20 more)

### Community 22 - "run-retrospective.ts"
Cohesion: 0.08
Nodes (50): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, blockingTrigger, brainOverlap, brainOverlapQuery() (+42 more)

### Community 23 - "lesson-selection.ts"
Cohesion: 0.08
Nodes (37): guidanceExcerpt(), digest(), lessonBrainAudit, LessonBrainOverlap, INSTALLED, installedLesson(), Bucket, LESSON_LIMIT (+29 more)

### Community 24 - "scheduled-captures.ts"
Cohesion: 0.14
Nodes (46): createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest, captureRequests() (+38 more)

### Community 25 - "features.ts"
Cohesion: 0.05
Nodes (73): ref_node_url, approveFeature(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), artifactPath(), digest(), document() (+65 more)

### Community 26 - "api-routes.ts"
Cohesion: 0.20
Nodes (14): ref_vite, ITSpecialist, goalHistory(), apiRoute(), RequestContext, ServiceContext, fileResponse(), json() (+6 more)

### Community 27 - "index.tsx"
Cohesion: 0.13
Nodes (36): OutboxMaintenanceStatus(), SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS, PickupForm() (+28 more)

### Community 28 - "preferences-store.ts"
Cohesion: 0.17
Nodes (10): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS (+2 more)

### Community 29 - "source-amendment.ts"
Cohesion: 0.12
Nodes (36): ref_node_async_hooks, adoptCandidate(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related (+28 more)

### Community 30 - "harnessEffect"
Cohesion: 0.16
Nodes (30): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), ProjectCard, projectCards(), projectGraphql() (+22 more)

### Community 31 - "ref_node_path"
Cohesion: 0.06
Nodes (103): ref_node_fs, ref_node_os, ref_node_path, ref_node_util, closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim() (+95 more)

### Community 32 - "assignments.ts"
Cohesion: 0.15
Nodes (15): assignmentLookups, Binding, lookupInstructions(), clip(), MISSED_QUERY_LIMIT, missedQueries(), MissedQuery, decodeLookupJournal() (+7 more)

### Community 33 - "PeoplePanel.tsx"
Cohesion: 0.09
Nodes (43): label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+35 more)

### Community 34 - "enrollment-gate.ts"
Cohesion: 0.21
Nodes (23): dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), resume(), startPilot(), eligibility(), approvedDelivery() (+15 more)

### Community 35 - "cec/workflow.ts"
Cohesion: 0.14
Nodes (30): parksInJira(), MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), run(), advance(), nextStage(), publicationEvidenceGap() (+22 more)

### Community 36 - "requests.ts"
Cohesion: 0.08
Nodes (45): accounting, DeliverySubject, nonDelivery, originalReads, HarnessControl, withHarnessWork(), assertAutomationEffects(), automationMergePolicy() (+37 more)

### Community 37 - "TimeBook.tsx"
Cohesion: 0.09
Nodes (41): displayAgentTask(), LiveAgentTask(), Props, RunningTask(), text(), src_shared_liveanchor, BreakdownTable(), CostBar() (+33 more)

### Community 38 - "index.ts"
Cohesion: 0.08
Nodes (22): ref_hono_node_server, ref_node_http, ref_node_stream, ref_node_timers, args, [cmd,...rawArgs], commands, key (+14 more)

### Community 39 - "record-trigger.ts"
Cohesion: 0.07
Nodes (58): isBlocking(), deliveryMetrics(), median(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences(), maintenanceSubject() (+50 more)

### Community 40 - "cost-ledger.ts"
Cohesion: 0.12
Nodes (32): captureCost(), server_telemetry_cost_entries_costcoveragesummary, costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress() (+24 more)

### Community 41 - "source-amendment-scope.ts"
Cohesion: 0.08
Nodes (34): approvedText(), assert(), assert(), normalize(), officialUrls, ReleaseCapture, verifyReleaseCaptures(), capture (+26 more)

### Community 42 - "constellation-runtime.ts"
Cohesion: 0.15
Nodes (17): ref_3d_force_graph, ref_three, CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point (+9 more)

### Community 43 - "remove-candidate.ts"
Cohesion: 0.17
Nodes (18): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot() (+10 more)

### Community 44 - "control-store.ts"
Cohesion: 0.18
Nodes (10): ref_node_sqlite, Clock, applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, statementCache(), initialSnapshot() (+2 more)

### Community 45 - "scheduled-work.ts"
Cohesion: 0.07
Nodes (50): gateRegisteredDelivery(), deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), metadataRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork() (+42 more)

### Community 46 - "OfficeScene.tsx"
Cohesion: 0.15
Nodes (35): withoutElapsed(), Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk() (+27 more)

### Community 47 - ".emit"
Cohesion: 0.12
Nodes (33): configureChannelNotices(), configureNotices(), retryRecipientLookup(), enqueueGreen156(), bindDiscoveryResume(), DiscoveryResumeInput, failedWorker(), requeueWaitedImplement() (+25 more)

### Community 48 - "run.ts"
Cohesion: 0.14
Nodes (22): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_FIX_PROMPT, OfficeFixResult (+14 more)

### Community 49 - "telemetry.ts"
Cohesion: 0.11
Nodes (23): CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL, Rates (+15 more)

### Community 50 - "owned-artifact.ts"
Cohesion: 0.20
Nodes (15): done(), readBoundedNoFollow(), readBoundedNoFollowSync(), reasonOf(), codexHome(), createdAt(), dayDirs(), header() (+7 more)

### Community 51 - "FeatureWorkspace.tsx"
Cohesion: 0.16
Nodes (19): FeatureQuestionProjection, phases, LinkedFeatures(), draftKey(), readDraft(), saveDraft(), QuestionRound(), nextQuestion() (+11 more)

### Community 52 - "coordination.ts"
Cohesion: 0.05
Nodes (38): deliveryIntakeBlocker(), Admission, admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, compatible(), dependencyCompletionKey() (+30 more)

### Community 53 - "it-specialist.ts"
Cohesion: 0.20
Nodes (15): partialLocalCleanupKey(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), ITContext, publishITReport(), nativeDeliveryResolved() (+7 more)

### Community 54 - "jira-time.ts"
Cohesion: 0.14
Nodes (20): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+12 more)

### Community 55 - "dependencies.ts"
Cohesion: 0.13
Nodes (15): PrerequisiteSchema, PrerequisitesSchema, seedProjectLessons(), GoalInput, saveGoal(), queueGoalNotice(), incompleteReadOutput(), migrateSnapshot() (+7 more)

### Community 56 - "daily-cto.ts"
Cohesion: 0.20
Nodes (12): evidenceRequestConflicts, dailyReviewPrompt(), applyGoalReview(), DailyResultSchema, EvidenceRefSchema, FreshDailyResultSchema, GoalEvidenceRequestSchema, statusAllowed() (+4 more)

### Community 57 - "retire-history.ts"
Cohesion: 0.36
Nodes (6): historicalRecordDigest(), Intent, records(), retireIncompleteHistory(), HistoryRetirement, HistoryRetirementIntent

### Community 58 - "ITFollowUps.tsx"
Cohesion: 0.67
Nodes (4): itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps()

### Community 59 - "JiraIssuePublisher"
Cohesion: 0.29
Nodes (3): JiraIssuePublisher, keyOf(), publicationDescription()

### Community 60 - "Store"
Cohesion: 0.04
Nodes (44): correlatedBuild(), CommentPage, commentReadback(), JiraOperations, checkMail(), drainMail(), requestMail(), ingest() (+36 more)

### Community 61 - "knowledge.ts"
Cohesion: 0.06
Nodes (38): Kind, RetrospectiveResult, RetrospectiveResultSchema, RollupResultSchema, Stage, CONSOLIDATED, CONSOLIDATED_AT, SEEDS (+30 more)

### Community 62 - "time-scope.ts"
Cohesion: 0.13
Nodes (31): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), server_telemetry_billable_work_issue_key, isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence() (+23 more)

### Community 63 - "assignment-poll.ts"
Cohesion: 0.17
Nodes (13): noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), DependencyBot, pinCourier, ACTIONS, OWNER, wikiSync (+5 more)

### Community 64 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 65 - "fact-bounds.ts"
Cohesion: 0.20
Nodes (17): leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance() (+9 more)

### Community 66 - "ref_node_crypto"
Cohesion: 0.17
Nodes (23): ref_node_crypto, commandFeature(), reviewQuestions(), confirmBrief(), FeaturePlanningBindings, assertQuestionVisibility(), applyHarnessAction(), HarnessActionInput (+15 more)

### Community 67 - "install-service.mjs"
Cohesion: 0.12
Nodes (14): ref_node_child_process, ref_node_string_decoder, file, folder, logs, root, extractDocument, Extraction (+6 more)

### Community 68 - "admit-improvement.ts"
Cohesion: 0.18
Nodes (18): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+10 more)

### Community 69 - "shared.ts"
Cohesion: 0.05
Nodes (50): projectOutbox(), syncOutbox(), projectSlackDeliveries(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint(), slackRequestSettled() (+42 more)

### Community 70 - "ref_zod"
Cohesion: 0.07
Nodes (40): ref_zod, assertConversationReadback(), Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+32 more)

### Community 71 - "node-visuals.ts"
Cohesion: 0.20
Nodes (13): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+5 more)

### Community 72 - "store.ts"
Cohesion: 0.06
Nodes (46): channelNoticeAuthorized(), ChannelSettings, notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR, plainSlackText() (+38 more)

### Community 73 - ".getEffect"
Cohesion: 0.20
Nodes (12): diagnosticProof(), ownedArtifact(), rawHash(), recoverDiscovery(), scopeNote(), GitHubOperations, fileLessonIssue(), lessonIssueBody() (+4 more)

### Community 74 - "DailyCTO.tsx"
Cohesion: 0.22
Nodes (12): CTOReview(), goalState, DailyCTO(), reportDate(), reviewStatus, GoalList(), card(), InlineText() (+4 more)

### Community 75 - "cec/issue-publication.ts"
Cohesion: 0.22
Nodes (11): IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), projectListScope(), Assignment, Content, jiraText() (+3 more)

### Community 76 - "report.ts"
Cohesion: 0.22
Nodes (15): TelemetryReport, TelemetryRow, TelemetrySync, Acc, bump(), EASTERN, easternDay(), modelShares() (+7 more)

### Community 77 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (10): ref_react_three_drei, ref_react_three_fiber, ref_three_stdlib, CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility (+2 more)

### Community 78 - "icons.tsx"
Cohesion: 0.15
Nodes (18): ref_lucide_react, LessonDecisionAction, lessonDecisionState(), readLessonDecision(), OutboxLessonDecision(), act(), readStatus(), Evidence() (+10 more)

### Community 79 - "local-config.ts"
Cohesion: 0.28
Nodes (11): AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), goalEvidencePath(), OfficeConfigInputs, officeConfigRoute(), officeConfigSummary(), CECBinding, localBindings (+3 more)

### Community 80 - "diagnostic-snapshot.ts"
Cohesion: 0.38
Nodes (5): diagnosticContext(), diagnosticSnapshot(), itAgent(), itDiagnostics(), currentServices()

### Community 81 - "codex-rollout.ts"
Cohesion: 0.27
Nodes (10): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO (+2 more)

### Community 82 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 83 - "tracking-issue.ts"
Cohesion: 0.33
Nodes (10): ensureTrackingIssue(), findTrackingIssue(), ownTracking(), TrackingIssue, trackingIssueBody(), trackingIssueTitle(), trackingMarker(), centralCompanionHandoff() (+2 more)

### Community 84 - "extract-worker.mjs"
Cohesion: 0.43
Nodes (6): ref_mammoth, ref_pdfjs_dist, bounded(), extract(), fail(), [path,kind]

### Community 85 - "helper-evidence.py"
Cohesion: 0.33
Nodes (5): importlib_util, json, pathlib, Read-only protocol adapter for the installed review helper. No model dispatch., sys

### Community 86 - ".save"
Cohesion: 0.22
Nodes (24): BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue(), readIssues(), commentDecision() (+16 more)

### Community 87 - "run-accounting.ts"
Cohesion: 0.14
Nodes (19): BoundedRead, backfillClaudeCost(), CompletionReader, CodexRollout, claudeAccounting(), COMPLETION_MAX_BYTES, completionAccounting(), readCompletion() (+11 more)

### Community 88 - "ledger.ts"
Cohesion: 0.41
Nodes (8): investigationCandidates(), investigationId(), investigationFollowUps(), investigationResolution(), syncInvestigations(), notifyHelperResolution(), requeueInvestigationEvidence(), retriedReadResolution()

### Community 89 - "blocker-followups.ts"
Cohesion: 0.31
Nodes (11): conversationReadbackReady(), queueConversationReadback(), conversationResolved(), readBackConversations(), handoff(), reconcileBlockerFollowups(), improvementIntakeGate(), captureLearning() (+3 more)

### Community 90 - "create-candidate.ts"
Cohesion: 0.48
Nodes (6): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf()

### Community 91 - "leadership.ts"
Cohesion: 0.20
Nodes (8): DailyCTOBriefing, DailyCTOResult, DailyCTOSummary, DailyGoalUpdate, GoalEvidenceRef, GoalEvidenceRequest, GoalStatus, HealthReport

### Community 92 - "evidence-digest.ts"
Cohesion: 0.44
Nodes (7): ProviderEvidence, canonical(), evidenceDigest(), evidenceHash(), semantic(), stableUrl(), RequirementPostimage

### Community 93 - "highestStableAtLeast"
Cohesion: 0.83
Nodes (3): compare(), highestStableAtLeast(), parts()

### Community 100 - "createConstellation"
Cohesion: 0.19
Nodes (5): ConstellationRuntime, createConstellation(), enter(), finishTap(), move()

### Community 103 - "useOfficePreferences.ts"
Cohesion: 0.26
Nodes (10): acceptPreferences(), PreferenceCandidate, strip(), UNKNOWN_PREFERENCES, OfficePreferencesController, PreferenceFeedback, PreferenceField, requestPreferences() (+2 more)

## Knowledge Gaps
- **481 isolated node(s):** `PrerequisiteSchema`, `BLOCKED_CAUSES`, `LABELS`, `WorkKind`, `DeliveryAdmission` (+476 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 608 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `github-delivery.ts`, `config.ts`, `dependency-bots/adopt.ts`, `artifact`, `ticket-evidence.ts`, `scheduler.ts`, `publication.ts`, `digest`, `App.tsx`, `agents.ts`, `currentAssignment`, `preparation-readback.ts`, `worker-runtime.ts`, `reader.ts`, `session-bridge.ts`, `TicketJob`, `maintenance/maintenance.ts`, `security.ts`, `run-retrospective.ts`, `lesson-selection.ts`, `scheduled-captures.ts`, `features.ts`, `source-amendment.ts`, `harnessEffect`, `ref_node_path`, `assignments.ts`, `enrollment-gate.ts`, `requests.ts`, `record-trigger.ts`, `cost-ledger.ts`, `remove-candidate.ts`, `control-store.ts`, `scheduled-work.ts`, `.emit`, `run.ts`, `coordination.ts`, `it-specialist.ts`, `jira-time.ts`, `dependencies.ts`, `daily-cto.ts`, `retire-history.ts`, `time-scope.ts`, `assignment-poll.ts`, `fact-bounds.ts`, `ref_node_crypto`, `admit-improvement.ts`, `shared.ts`, `ref_zod`, `store.ts`, `.getEffect`, `cec/issue-publication.ts`, `diagnostic-snapshot.ts`, `tracking-issue.ts`, `.save`, `run-accounting.ts`, `ledger.ts`, `blocker-followups.ts`, `create-candidate.ts`?**
  _High betweenness centrality (0.109) - this node is a cross-community bridge._
- **Why does `Role` connect `worker-runtime.ts` to `github-delivery.ts`, `Inspector.tsx`, `scheduler.ts`, `App.tsx`, `agents.ts`, `TicketJob`, `maintenance/maintenance.ts`, `PeoplePanel.tsx`, `cec/workflow.ts`, `requests.ts`, `record-trigger.ts`, `OfficeScene.tsx`, `.emit`, `Store`, `scene-motion.ts`, `shared.ts`, `ref_zod`, `store.ts`, `run-accounting.ts`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `command()` connect `Store` to `github-delivery.ts`, `config.ts`, `artifact`, `ticket-evidence.ts`, `digest`, `agents.ts`, `currentAssignment`, `worker-runtime.ts`, `reader.ts`, `session-bridge.ts`, `maintenance/maintenance.ts`, `security.ts`, `features.ts`, `harnessEffect`, `ref_node_path`, `requests.ts`, `cost-ledger.ts`, `remove-candidate.ts`, `scheduled-work.ts`, `coordination.ts`, `jira-time.ts`, `dependencies.ts`, `install-service.mjs`, `admit-improvement.ts`, `shared.ts`, `ref_zod`, `store.ts`, `cec/issue-publication.ts`, `command-registry.ts`, `.save`, `create-candidate.ts`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **What connects `PrerequisiteSchema`, `BLOCKED_CAUSES`, `LABELS` to the rest of the system?**
  _481 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `github-delivery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.060378218272955114 - nodes in this community are weakly interconnected._
- **Should `config.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1025974025974026 - nodes in this community are weakly interconnected._
- **Should `Inspector.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07754182754182753 - nodes in this community are weakly interconnected._