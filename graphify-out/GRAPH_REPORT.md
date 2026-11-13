# Graph Report - the-office  (2026-11-13)

## Corpus Check
- 746 files · ~308,797 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3837 nodes · 17942 edges · 103 communities (100 shown, 3 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 583 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6230c6a9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- workKey
- github-readiness.ts
- digest
- artifact
- Button
- Inspector.tsx
- api-routes.ts
- source-amendment.ts
- App.tsx
- .emit
- authorize.ts
- requests.ts
- shared.ts
- Goals.tsx
- session-bridge.ts
- github-context.ts
- engine.ts
- index.ts
- TimeBook.tsx
- Effects
- SlackMessages
- run.ts
- icons.tsx
- run-retrospective.ts
- cec/workflow.ts
- record-trigger.ts
- mutedCopy
- config.ts
- ref_node_path
- time-scope.ts
- PeoplePanel.tsx
- worker-runtime.ts
- index.tsx
- process.ts
- JiraIssuePublisher
- azure.ts
- evidence-artifacts.ts
- reader.ts
- scheduler.ts
- run-accounting.ts
- lesson-selection.ts
- cost-ledger.ts
- OfficeScene.tsx
- enrollment-gate.ts
- maintenance/maintenance.ts
- telemetry.ts
- github/issue-publication.ts
- assignment-poll.ts
- assignments.ts
- cli.ts
- ref_zod
- knowledge.ts
- currentAssignment
- Offices
- harnessEffect
- .save
- ref_node_crypto
- github-delivery.ts
- goal-reviews.ts
- dependency-bots/adopt.ts
- retire-history.ts
- constellation-runtime.ts
- ticket-evidence.ts
- features.ts
- scope-repair-resume.ts
- remove-candidate.ts
- Coordinator
- command
- agents.ts
- Store
- validate-stage.ts
- GitHubDelivery
- scheduled-work.ts
- dependencies.ts
- Role
- MaintenanceRun
- .transaction
- it-specialist.ts
- fact-bounds.ts
- http/commands.ts
- owned-artifact.ts
- scene-motion.ts
- tracking-issue.ts
- discovery-recovery.ts
- command-registry.ts
- preferences-store.ts
- coordination-tick.ts
- ProjectProgress
- blocker-followups.ts
- RoomCamera.tsx
- channel-notice.ts
- accept-retrospective.ts
- display-scene.ts
- jira-time.ts
- report.ts
- node-visuals.ts
- install-service.mjs
- ITFollowUps.tsx
- highestStableAtLeast
- extract-worker.mjs
- coordination.ts
- delivery-repairs.ts
- helper-evidence.py

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
- `Admission` --references--> `AssignmentReview`  [EXTRACTED]
  server/delivery/intake/admission.ts → src/shared.ts
- `DeliverySlot` --references--> `Role`  [EXTRACTED]
  server/office/projects.ts → src/shared.ts
- `RetrospectiveSubject` --references--> `CIRepair`  [EXTRACTED]
  server/knowledge/retrospective-subject.ts → src/contracts/ci-repair.ts
- `DeliveryAuthorityInput` --references--> `HarnessRequest`  [EXTRACTED]
  server/delivery/harness/delivery-authority.ts → src/contracts/work.ts
- `ITContext` --references--> `HarnessRequest`  [EXTRACTED]
  server/it/context.ts → src/contracts/work.ts

## Import Cycles
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/parking/resume-provider-review.ts -> server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/parking/resume-provider-review.ts`
- 3-file cycle: `server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts`
- 4-file cycle: `server/delivery/recovery/implementation/activation-recovery.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/implementation/activation-recovery.ts`
- 4-file cycle: `server/delivery/recovery/implementation/saved-prerequisite-handoff.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/implementation/saved-prerequisite-handoff.ts`
- 4-file cycle: `server/delivery/recovery/validation/validation-readback.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/validation/validation-readback.ts`
- 4-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 4-file cycle: `server/delivery/recovery/scope-repair/scope-repair-readback.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/scope-repair/scope-repair-readback.ts`
- 4-file cycle: `server/delivery/recovery/source-amendment/source-amendment.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/source-amendment/source-amendment.ts`
- 4-file cycle: `server/delivery/recovery/stopped-base-review.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/stopped-base-review.ts`
- 4-file cycle: `server/features/delivery-binding.ts -> server/features/enrollment-gate.ts -> server/features/progression/failure.ts -> server/store/effects.ts -> server/features/delivery-binding.ts`
- 5-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/stage-reconciliation.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 5-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 5-file cycle: `server/delivery/recovery/implementation/saved-prerequisite-handoff.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/recovery/implementation/saved-prerequisite-handoff.ts`
- 5-file cycle: `server/delivery/recovery/implementation/continuation-evidence.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/recovery/implementation/continuation-evidence.ts`
- 5-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/scope-repair/scope-repair-resume.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 5-file cycle: `server/delivery/recovery/scope-repair/scope-repair-readback.ts -> server/delivery/recovery/scope-repair/scope-repair-resume.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/scope-repair/scope-repair-readback.ts`
- 5-file cycle: `server/delivery/recovery/implementation/continuation-evidence.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/implementation/implementation-recovery.ts -> server/delivery/recovery/implementation/continuation-evidence.ts`
- 5-file cycle: `server/delivery/recovery/implementation/activation-recovery.ts -> server/delivery/recovery/implementation/continuation-evidence.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/implementation/activation-recovery.ts`

## Communities (103 total, 3 thin omitted)

### Community 0 - "workKey"
Cohesion: 0.07
Nodes (74): recordJobApproach(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal (+66 more)

### Community 1 - "github-readiness.ts"
Cohesion: 0.11
Nodes (36): requireDeliveryAuthority(), assertDeliveryMayMutate(), pinCourier, wikiSync, resumeProviderReviews(), observe(), draftReadHeadMatches(), assertDraftClaimHistory() (+28 more)

### Community 2 - "digest"
Cohesion: 0.11
Nodes (50): activeEffectId(), retryRead(), runHarnessStage(), harnessStageResult(), receipt(), harnessDraft(), admitPRMetadata(), assessPRMetadata() (+42 more)

### Community 3 - "artifact"
Cohesion: 0.07
Nodes (68): stagePrompt(), StagePromptInput, METADATA_FINDING_GUIDANCE, advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat() (+60 more)

### Community 4 - "Button"
Cohesion: 0.07
Nodes (59): ref_react, ref_react_markdown, ref_remark_gfm, ref_yaml, Activity(), ActivityTimeline(), AssignmentKnowledge(), Lookup() (+51 more)

### Community 5 - "Inspector.tsx"
Cohesion: 0.11
Nodes (68): Conversation(), Outbox(), slackMessageStatus(), SlackDeliveryCard(), ServiceHealthPanel(), followUp(), labels, ServiceHealthRow() (+60 more)

### Community 6 - "api-routes.ts"
Cohesion: 0.22
Nodes (12): goalHistory(), apiRoute(), RequestContext, preferencesRoute(), PreferencesRouteContext, fileResponse(), json(), staticRoute() (+4 more)

### Community 7 - "source-amendment.ts"
Cohesion: 0.06
Nodes (68): ref_node_async_hooks, adoptCandidate(), reported, Scope, approvedText(), assert(), AMENDMENT_REVIEW_PROOF, amendmentInstruction() (+60 more)

### Community 8 - "App.tsx"
Cohesion: 0.05
Nodes (71): ref_motion, ref_react_dom, projectOutbox(), compactSteps(), knowledgeOutbox(), checkpointSuperseded(), itAgent(), itDiagnostics() (+63 more)

### Community 10 - "authorize.ts"
Cohesion: 0.08
Nodes (47): approveFeature(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), artifactPath(), digest(), document() (+39 more)

### Community 11 - "requests.ts"
Cohesion: 0.15
Nodes (28): DeliveryAuthorityInput, HarnessControl, admitPacked165(), history(), makePacked165Candidate(), packed165CandidateIdentity(), packed165Subject(), retainedPacked165Effect() (+20 more)

### Community 12 - "shared.ts"
Cohesion: 0.06
Nodes (44): ScopeRow, ProjectReadiness, HistoryRetirement, HistoryRetirementIntent, DailyCTOSummary, PackedPublicationRepair, SlackReplacementRequest, SlackSupersession (+36 more)

### Community 13 - "Goals.tsx"
Cohesion: 0.12
Nodes (26): SendMessage, send(), TicketPlanningAction(), CTOReview(), goalState, DailyCTO(), GoalHistory(), load() (+18 more)

### Community 14 - "session-bridge.ts"
Cohesion: 0.07
Nodes (43): ref_ws, claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexDaemonProcesses(), accountCodexProcesses(), codexProcessInventory (+35 more)

### Community 15 - "github-context.ts"
Cohesion: 0.11
Nodes (44): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+36 more)

### Community 16 - "engine.ts"
Cohesion: 0.12
Nodes (54): dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), resume(), startPilot(), eligibility(), createFeature() (+46 more)

### Community 17 - "index.ts"
Cohesion: 0.09
Nodes (25): ref_hono_node_server, ref_node_http, ref_vite, close(), config, itSpecialist, loadedRevision, offices (+17 more)

### Community 18 - "TimeBook.tsx"
Cohesion: 0.10
Nodes (39): TelemetryReport, LiveAnchor, AzureBuild, src_shared_liveanchor, BreakdownTable(), CostBar(), coverage(), pricedLabel() (+31 more)

### Community 19 - "Effects"
Cohesion: 0.25
Nodes (8): GitHubOperations, fileLessonIssue(), Assessment, closeNativeRefresh(), fingerprint(), maintenanceNoticeAuthorized(), sendMaintenanceNotice(), Effects

### Community 20 - "SlackMessages"
Cohesion: 0.25
Nodes (5): comparableSlackText(), SlackMessages, goalNoticeAuthorized(), sendGoalNotice(), MergeNotice

### Community 21 - "run.ts"
Cohesion: 0.17
Nodes (21): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationCandidates(), investigationId(), investigationFollowUps(), investigationResolution(), syncInvestigations(), OFFICE_FIX_PROMPT (+13 more)

### Community 22 - "icons.tsx"
Cohesion: 0.20
Nodes (14): ref_lucide_react, LessonDecisionAction, lessonDecisionState(), readLessonDecision(), OutboxLessonDecision(), act(), readStatus(), Evidence() (+6 more)

### Community 23 - "run-retrospective.ts"
Cohesion: 0.08
Nodes (46): acceptRetrospective(), BLOCKING, blockingTrigger, isBlocking(), brainOverlap, brainOverlapQuery(), clip(), fits() (+38 more)

### Community 24 - "cec/workflow.ts"
Cohesion: 0.10
Nodes (38): applyIntakeObservation(), checkMail(), drainMail(), requestMail(), parksInJira(), MISSING_INTAKE, reconcileMailbox(), unusedMailbox() (+30 more)

### Community 25 - "record-trigger.ts"
Cohesion: 0.09
Nodes (46): maintainLearning(), maintenanceSubject(), MaintenanceSubjectFacts, clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates(), maintenanceCompletedId() (+38 more)

### Community 26 - "mutedCopy"
Cohesion: 0.16
Nodes (31): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS, PickupForm(), acceptPreferences() (+23 more)

### Community 27 - "config.ts"
Cohesion: 0.08
Nodes (36): CommentPage, commentReadback(), IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), intakeMembership(), projectListScope() (+28 more)

### Community 28 - "ref_node_path"
Cohesion: 0.06
Nodes (82): ref_node_fs, ref_node_os, ref_node_path, ref_node_util, pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), allowed, continuationNativeReview() (+74 more)

### Community 29 - "time-scope.ts"
Cohesion: 0.14
Nodes (29): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), server_telemetry_billable_work_issue_key, isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence() (+21 more)

### Community 30 - "PeoplePanel.tsx"
Cohesion: 0.09
Nodes (43): label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+35 more)

### Community 31 - "worker-runtime.ts"
Cohesion: 0.08
Nodes (36): candidateWorkspaceEnvironment(), diagnosticContext(), assignmentSubject(), lessonPurpose(), selectLessons(), catalogLine(), assertBriefingScope(), taskBriefing() (+28 more)

### Community 32 - "index.tsx"
Cohesion: 0.07
Nodes (45): FeatureQuestionProjection, OutboxMaintenanceStatus(), FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures() (+37 more)

### Community 33 - "process.ts"
Cohesion: 0.11
Nodes (25): ref_node_child_process, Event, one(), prePushRejection(), PushIdentity, Candidate, settledPushBoundary(), NOTIFY_HELPER (+17 more)

### Community 34 - "JiraIssuePublisher"
Cohesion: 0.21
Nodes (6): JiraIssuePublisher, jiraText(), keyOf(), descriptionPreimage(), plain(), publicationDescription()

### Community 35 - "azure.ts"
Cohesion: 0.08
Nodes (32): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+24 more)

### Community 36 - "evidence-artifacts.ts"
Cohesion: 0.31
Nodes (10): readEvidence(), ProviderEvidence, canonical(), evidenceDigest(), evidenceHash(), semantic(), stableUrl(), requirementDrift() (+2 more)

### Community 37 - "reader.ts"
Cohesion: 0.07
Nodes (42): knowledgeActivity(), knowledgeActivityPage(), committedNotePage(), BrainGraph, BrainNote, BrainReader, CommittedBrain, GraphNode (+34 more)

### Community 38 - "scheduler.ts"
Cohesion: 0.05
Nodes (34): ref_node_sqlite, ROLES, DailyCTO, EvidenceRequestConflict, dailyReviewPrompt(), Briefing, saveReviewBriefing(), Clock (+26 more)

### Community 39 - "run-accounting.ts"
Cohesion: 0.12
Nodes (28): BoundedRead, backfillClaudeCost(), CompletionReader, codexHome(), createdAt(), dayDirs(), header(), readCodexRollout() (+20 more)

### Community 40 - "lesson-selection.ts"
Cohesion: 0.09
Nodes (25): lessonIssueBody(), lessonIssueMarker(), lessonBrainAudit, LessonBrainOverlap, INSTALLED, installedLesson(), Bucket, LESSON_LIMIT (+17 more)

### Community 41 - "cost-ledger.ts"
Cohesion: 0.11
Nodes (35): captureCost(), server_telemetry_cost_entries_costcoveragesummary, costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress() (+27 more)

### Community 42 - "OfficeScene.tsx"
Cohesion: 0.17
Nodes (33): Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk(), ElevatorStage() (+25 more)

### Community 43 - "enrollment-gate.ts"
Cohesion: 0.27
Nodes (15): featureEffectGate(), assertFeatureGate(), bindFeature(), currentApproval(), featureGate(), predecessorComplete(), recoveryHeld(), deliveryPreflight (+7 more)

### Community 44 - "maintenance/maintenance.ts"
Cohesion: 0.09
Nodes (28): ApproachSchema, maintenancePolicies(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice(), candidateOwner() (+20 more)

### Community 45 - "telemetry.ts"
Cohesion: 0.08
Nodes (36): add(), CodexRequest, CodexRollout, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens() (+28 more)

### Community 46 - "github/issue-publication.ts"
Cohesion: 0.15
Nodes (10): FeaturePublisher, PublicationReceipt, Assign, Board, Content, GitHubIssuePublisher, number(), same() (+2 more)

### Community 47 - "assignment-poll.ts"
Cohesion: 0.14
Nodes (22): clamp(), LIMITS, MergedPR, plainSlackText(), section(), shippedSummary(), configureNotices(), Identity (+14 more)

### Community 48 - "assignments.ts"
Cohesion: 0.14
Nodes (16): assignmentKnowledge(), assignmentLookups, Binding, lookupInstructions(), clip(), MISSED_QUERY_LIMIT, missedQueries(), decodeLookupJournal() (+8 more)

### Community 49 - "cli.ts"
Cohesion: 0.20
Nodes (8): ref_node_stream, ref_node_timers, args, [cmd,...rawArgs], commands, key, projectIndex, PORT

### Community 50 - "ref_zod"
Cohesion: 0.07
Nodes (42): ref_zod, assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO() (+34 more)

### Community 51 - "knowledge.ts"
Cohesion: 0.08
Nodes (32): Kind, RollupResultSchema, Stage, clearUnblockBrief(), key(), saveUnblockBrief(), unblockBrief, ImprovementGrant (+24 more)

### Community 52 - "currentAssignment"
Cohesion: 0.11
Nodes (31): deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), deliveryIntakeBlocker(), gateRegisteredDelivery(), accounting, DeliverySubject, nonDelivery (+23 more)

### Community 54 - "harnessEffect"
Cohesion: 0.24
Nodes (22): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), ProjectCard, projectCards(), projectGraphql() (+14 more)

### Community 55 - ".save"
Cohesion: 0.24
Nodes (23): BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue(), readIssues(), commentDecision() (+15 more)

### Community 56 - "ref_node_crypto"
Cohesion: 0.12
Nodes (35): ref_node_crypto, featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS, requestReplan() (+27 more)

### Community 57 - "github-delivery.ts"
Cohesion: 0.07
Nodes (60): findingsBlock(), HANDS_OFF_PROJECTS, handsOff(), BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction(), dependabotReviewGuidance() (+52 more)

### Community 58 - "goal-reviews.ts"
Cohesion: 0.11
Nodes (20): applyGoalReview(), DailyResultSchema, EvidenceRefSchema, FreshDailyResultSchema, GoalEvidenceRequestSchema, statusAllowed(), workEvidence(), GoalInput (+12 more)

### Community 59 - "dependency-bots/adopt.ts"
Cohesion: 0.16
Nodes (27): Execute, readBackOrThrow(), adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR (+19 more)

### Community 60 - "retire-history.ts"
Cohesion: 0.53
Nodes (5): enqueueHistoryRetirement(), historicalRecordDigest(), Intent, records(), retireIncompleteHistory()

### Community 61 - "constellation-runtime.ts"
Cohesion: 0.10
Nodes (22): ref_3d_force_graph, CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point, ConstellationView (+14 more)

### Community 62 - "ticket-evidence.ts"
Cohesion: 0.16
Nodes (20): ref_node_string_decoder, attachmentKind(), evidenceDirectory(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS, EvidenceAttachment (+12 more)

### Community 63 - "features.ts"
Cohesion: 0.10
Nodes (41): commandFeature(), reviewQuestions(), assertQuestionVisibility(), applyHarnessAction(), HarnessActionInput, recoveryPreconditions(), recoveryTarget(), normalizeRound() (+33 more)

### Community 64 - "scope-repair-resume.ts"
Cohesion: 0.14
Nodes (28): Assessment, outsideScanSources(), Ownership, requireThat(), scopeRepairReadbackCandidate(), scopeRepairRequestResolved(), sha, assertScopeRepairResumeFindings() (+20 more)

### Community 65 - "remove-candidate.ts"
Cohesion: 0.15
Nodes (21): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot() (+13 more)

### Community 66 - "Coordinator"
Cohesion: 0.08
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 67 - "command"
Cohesion: 0.11
Nodes (14): correlatedBuild(), listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, slackHealth() (+6 more)

### Community 68 - "agents.ts"
Cohesion: 0.09
Nodes (26): cecPrompt(), resolvedDecisionNote(), stageInstructions, SlackResultSchema, SlackVerificationSchema, HANDS_OFF_RESOLUTION_GUIDANCE, RESOLUTION_GUIDANCE, APPROACH_GUIDANCE (+18 more)

### Community 69 - "Store"
Cohesion: 0.06
Nodes (39): ref_smol_toml, GitHubFeaturePublisher, JiraFeaturePublisher, admitImprovement(), improvementEligible(), improvementManifest(), improvementMarker(), improvementProvider() (+31 more)

### Community 70 - "validate-stage.ts"
Cohesion: 0.16
Nodes (18): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+10 more)

### Community 71 - "GitHubDelivery"
Cohesion: 0.09
Nodes (30): GitHubDelivery, checksFailed(), checksPassed(), checksPending(), CurrentChecksWait, currentMergeChecks(), pass(), pending() (+22 more)

### Community 72 - "scheduled-work.ts"
Cohesion: 0.07
Nodes (48): deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), metadataRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), deliveryMetrics() (+40 more)

### Community 73 - "dependencies.ts"
Cohesion: 0.20
Nodes (18): MergeNotifications, Admission, admit(), IntakeContext, WAIT_STATUSES, compatible(), dependencyCompletionKey(), dependencyEligibility() (+10 more)

### Community 74 - "Role"
Cohesion: 0.15
Nodes (8): canFileGithubIssue(), githubFollowupPrompt(), officeCapacity, Agents, WorkerRuntime, recommendedReply(), Role, deferredPickup()

### Community 75 - "MaintenanceRun"
Cohesion: 0.16
Nodes (15): BrainStatusSchema, identity, coverageSchema, followupSchema, verified, checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup() (+7 more)

### Community 76 - ".transaction"
Cohesion: 0.13
Nodes (15): featureById(), discoveryPrompt(), planPrompt(), publishFeature(), beginReader(), reconcilePublication(), reserveIdentity(), FeatureReviewRunner (+7 more)

### Community 77 - "it-specialist.ts"
Cohesion: 0.23
Nodes (13): partialLocalCleanupKey(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), ITContext, publishITReport(), delays (+5 more)

### Community 78 - "fact-bounds.ts"
Cohesion: 0.23
Nodes (16): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+8 more)

### Community 79 - "http/commands.ts"
Cohesion: 0.19
Nodes (20): enqueueMetadataRecovery(), normalizeStatement(), baselineLearning(), configureKnowledge(), declineLessonIssue(), reactivateLesson(), retireLesson(), decideOfficeProposal() (+12 more)

### Community 80 - "owned-artifact.ts"
Cohesion: 0.22
Nodes (14): investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, notifyHelperResolution(), OFFICE_SOURCE_PATHS, officeSource(), done() (+6 more)

### Community 81 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 82 - "tracking-issue.ts"
Cohesion: 0.21
Nodes (12): ensureTrackingIssue(), findTrackingIssue(), ownTracking(), TrackingIssue, trackingIssueBody(), trackingIssueTitle(), trackingMarker(), centralCompanionHandoff() (+4 more)

### Community 83 - "discovery-recovery.ts"
Cohesion: 0.27
Nodes (10): Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership, rawHash() (+2 more)

### Community 84 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 85 - "preferences-store.ts"
Cohesion: 0.21
Nodes (8): fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS, OfficePreferences, OfficePreferencesPatch

### Community 86 - "coordination-tick.ts"
Cohesion: 0.16
Nodes (15): reconcileNoticeConfirmations(), PrerequisitesSchema, brainCheckpointCompletion(), reconcileCompletedCheckpoints(), legacy, reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS (+7 more)

### Community 88 - "blocker-followups.ts"
Cohesion: 0.23
Nodes (12): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), readBackConversations(), diagnosticSnapshot(), nativeDeliveryResolved(), handoff() (+4 more)

### Community 89 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (10): ref_react_three_drei, ref_react_three_fiber, ref_three_stdlib, CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility (+2 more)

### Community 90 - "channel-notice.ts"
Cohesion: 0.28
Nodes (5): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice()

### Community 91 - "accept-retrospective.ts"
Cohesion: 0.12
Nodes (24): Accepted, RETROSPECTIVE_HISTORY, Shared, curateLesson(), Curation, CurationAction, mergeEvidence(), distinct() (+16 more)

### Community 92 - "display-scene.ts"
Cohesion: 0.39
Nodes (7): KnowledgeNode, DisplayNode, MapSelection, KnowledgeGroup, knowledgeGroups(), title(), titles

### Community 93 - "jira-time.ts"
Cohesion: 0.21
Nodes (14): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+6 more)

### Community 94 - "report.ts"
Cohesion: 0.25
Nodes (14): validTicket(), telemetryRoute(), Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount() (+6 more)

### Community 95 - "node-visuals.ts"
Cohesion: 0.19
Nodes (14): ref_three, ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels() (+6 more)

### Community 96 - "install-service.mjs"
Cohesion: 0.29
Nodes (5): ref_node_url, file, folder, logs, root

### Community 97 - "ITFollowUps.tsx"
Cohesion: 0.67
Nodes (4): itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps()

### Community 98 - "highestStableAtLeast"
Cohesion: 0.83
Nodes (3): compare(), highestStableAtLeast(), parts()

### Community 103 - "extract-worker.mjs"
Cohesion: 0.43
Nodes (6): ref_mammoth, ref_pdfjs_dist, bounded(), extract(), fail(), [path,kind]

### Community 104 - "coordination.ts"
Cohesion: 0.19
Nodes (17): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation(), checkpointWindow(), dueAt() (+9 more)

### Community 105 - "delivery-repairs.ts"
Cohesion: 0.11
Nodes (37): containedFile(), removeAdoptedClone(), namedRepairIds(), stoppedBasePackageInstruction(), adoptedReviewCandidate(), ciCheckout(), finishCISetup(), verifyCIHooks() (+29 more)

### Community 107 - "helper-evidence.py"
Cohesion: 0.33
Nodes (5): importlib_util, json, pathlib, Read-only protocol adapter for the installed review helper. No model dispatch., sys

## Knowledge Gaps
- **477 isolated node(s):** `initial`, `filterNames`, `SourceReservation`, `Ownership`, `Ownership` (+472 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 604 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `workKey`, `github-readiness.ts`, `digest`, `artifact`, `source-amendment.ts`, `App.tsx`, `.emit`, `authorize.ts`, `requests.ts`, `session-bridge.ts`, `github-context.ts`, `engine.ts`, `Effects`, `SlackMessages`, `run.ts`, `run-retrospective.ts`, `record-trigger.ts`, `config.ts`, `ref_node_path`, `time-scope.ts`, `worker-runtime.ts`, `process.ts`, `JiraIssuePublisher`, `azure.ts`, `evidence-artifacts.ts`, `reader.ts`, `scheduler.ts`, `run-accounting.ts`, `lesson-selection.ts`, `cost-ledger.ts`, `enrollment-gate.ts`, `maintenance/maintenance.ts`, `github/issue-publication.ts`, `assignment-poll.ts`, `assignments.ts`, `ref_zod`, `currentAssignment`, `harnessEffect`, `.save`, `ref_node_crypto`, `github-delivery.ts`, `goal-reviews.ts`, `dependency-bots/adopt.ts`, `retire-history.ts`, `ticket-evidence.ts`, `features.ts`, `scope-repair-resume.ts`, `remove-candidate.ts`, `command`, `agents.ts`, `validate-stage.ts`, `GitHubDelivery`, `scheduled-work.ts`, `dependencies.ts`, `Role`, `MaintenanceRun`, `.transaction`, `it-specialist.ts`, `http/commands.ts`, `owned-artifact.ts`, `tracking-issue.ts`, `discovery-recovery.ts`, `coordination-tick.ts`, `ProjectProgress`, `blocker-followups.ts`, `channel-notice.ts`, `accept-retrospective.ts`, `jira-time.ts`, `report.ts`, `coordination.ts`, `delivery-repairs.ts`?**
  _High betweenness centrality (0.106) - this node is a cross-community bridge._
- **Why does `WorkerRuntime` connect `Role` to `engine.ts`, `.transaction`, `worker-runtime.ts`, `agents.ts`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `Role` connect `Role` to `github-readiness.ts`, `Inspector.tsx`, `App.tsx`, `.emit`, `requests.ts`, `shared.ts`, `github-context.ts`, `record-trigger.ts`, `config.ts`, `PeoplePanel.tsx`, `worker-runtime.ts`, `scheduler.ts`, `run-accounting.ts`, `OfficeScene.tsx`, `maintenance/maintenance.ts`, `ref_zod`, `github-delivery.ts`, `agents.ts`, `Store`, `http/commands.ts`, `scene-motion.ts`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `initial`, `filterNames`, `SourceReservation` to the rest of the system?**
  _477 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `workKey` be split into smaller, more focused modules?**
  _Cohesion score 0.07099080694586313 - nodes in this community are weakly interconnected._
- **Should `github-readiness.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11215686274509803 - nodes in this community are weakly interconnected._
- **Should `digest` be split into smaller, more focused modules?**
  _Cohesion score 0.11261872455902307 - nodes in this community are weakly interconnected._