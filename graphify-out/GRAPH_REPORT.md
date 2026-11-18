# Graph Report - the-office  (2026-11-17)

## Corpus Check
- 889 files · ~349,211 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4357 nodes · 19959 edges · 127 communities (118 shown, 9 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 683 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `83f5b0e2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Outbox.tsx
- OrgChart.tsx
- candidate.ts
- config.ts
- Inspector.tsx
- ControlStore
- session-bridge.ts
- ref_react
- continue-ownership-read.ts
- github-delivery.ts
- agents.ts
- ledger.ts
- App.tsx
- OfficeSnapshot
- knowledge/routes.ts
- scheduled-captures.ts
- run-retrospective.ts
- record-trigger.ts
- TelemetryPanel.tsx
- artifact
- index.tsx
- harnessEffect
- config.ts
- jira-time.ts
- index.ts
- maintenance/maintenance.ts
- cost-ledger.ts
- http/commands.ts
- knowledge.ts
- connectWith
- metadata-assessment.ts
- harnessEffect
- sanitize
- ref_node_path
- accept-stage-result.ts
- jiraBinding
- scheduled-work.ts
- run-accounting.ts
- dependency-bots/adopt.ts
- lesson-selection.ts
- restoreInPlace
- time-scope.ts
- GitHubDelivery
- assignments.ts
- features/workflow.ts
- harness-baseline.ts
- OfficeScene.tsx
- retrospective-subject.ts
- command
- session-context-file.ts
- Store
- shared.ts
- cli.ts
- inspect-closed-plan.ts
- continue-access-only-plan.ts
- daily-cto.ts
- FeatureWorkspace.tsx
- .getEffect
- goal-reviews.ts
- project-bindings-config.ts
- goal-reporting.ts
- highestStableAtLeast
- run.ts
- createConstellation
- jiraBinding
- run-accounting.ts
- remove-candidate.ts
- coordination.ts
- session-context-file.ts
- publish-pr.ts
- constellation-runtime.ts
- session-scope.ts
- work.ts
- report.ts
- projects.ts
- Offices
- .emit
- owned-artifact.ts
- service-health.ts
- Ticket
- accept-retrospective.ts
- holdReason
- cec/issue-publication.ts
- command-registry.ts
- tracking-issue.ts
- scope-repair-resume.ts
- local-config.ts
- outbox.ts
- useOfficePreferences.ts
- jira-attempts.ts
- project-binding-blocks.ts
- config.ts
- FeatureWorkflow
- conversations/slack.ts
- workKey
- capture-session-clone.py
- recovery/stopped-base-update.ts
- process.ts
- jiraBinding
- time-readback.ts
- pilot-delivery.ts
- projectOutbox
- leadership.ts
- worker-runtime.ts
- Coordinator
- extract-worker.mjs
- delivery-ownership.ts
- run.ts
- codex-rollout-file.ts
- Conversation.tsx
- handover-cms.ts
- scheduled-features.ts
- codex-rollout.ts
- admit-improvement.ts
- slack-supersession.ts
- blocker-followups.ts
- qa.ts
- qa-plan-continuation.ts
- writer-restart.ts
- ProjectProgress
- it-specialist.ts
- OfficeConfigView.tsx
- office-state-view.ts
- JiraWorklogTransport
- office-qa-handoff.ts
- contract.ts
- packed-consumer-pnpm.ts

## God Nodes (most connected - your core abstractions)
1. `Store` - 384 edges
2. `TicketJob` - 172 edges
3. `digest()` - 151 edges
4. `holdReason()` - 124 edges
5. `command()` - 123 edges
6. `GitHubDelivery` - 116 edges
7. `artifact()` - 114 edges
8. `OfficeSnapshot` - 88 edges
9. `cx()` - 88 edges
10. `currentAssignment()` - 88 edges

## Surprising Connections (you probably didn't know these)
- `apply()` --indirect_call--> `note()`  [INFERRED]
  src/conversations/OutboxSavedImplementation.tsx → server/cec/parking/resume-parked.ts
- `UnrecordedResult` --references--> `StageResult`  [EXTRACTED]
  server/cec/unrecorded-result.ts → src/shared.ts
- `projectOutbox()` --calls--> `isSavedPlanFollowup()`  [EXTRACTED]
  server/conversations/outbox.ts → src/conversations/saved-plan-followup.ts
- `projectOutbox()` --calls--> `deferredPickup()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/pickup-state.ts
- `projectOutbox()` --calls--> `parkedProviderWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts

## Import Cycles
- 2-file cycle: `server/scheduling/coordination-pump.ts -> server/scheduling/coordination.ts -> server/scheduling/coordination-pump.ts`
- 2-file cycle: `server/scheduling/coordination-tick.ts -> server/scheduling/coordination.ts -> server/scheduling/coordination-tick.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/track-adopted-review.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/stage-reconciliation.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/accept-stage-result.ts -> server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/accept-stage-result.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/publication/metadata-context.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/refresh-merge-review.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/closeout/github-closeout.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/implementation/saved-prerequisite-handoff.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/queue-repairs.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/knowledge/lesson-exits.ts -> server/scheduling/requests.ts -> server/knowledge/lesson-exits.ts`
- 2-file cycle: `server/conversations/conversations.ts -> server/conversations/cto-conversations.ts -> server/conversations/conversations.ts`
- 2-file cycle: `server/conversations/notifications.ts -> server/conversations/slack.ts -> server/conversations/notifications.ts`
- 2-file cycle: `src/contracts/work.ts -> src/shared.ts -> src/contracts/work.ts`
- 2-file cycle: `src/contracts/people.ts -> src/shared.ts -> src/contracts/people.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-guard.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/review-wait.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`

## Communities (127 total, 9 thin omitted)

### Community 0 - "Outbox.tsx"
Cohesion: 0.08
Nodes (35): compactSteps(), knowledgeOutbox(), Conversation(), DAYS, dueLessonDecisions(), easternWeek(), isLessonDecision(), LESSON_DIGEST (+27 more)

### Community 1 - "OrgChart.tsx"
Cohesion: 0.11
Nodes (40): label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+32 more)

### Community 2 - "candidate.ts"
Cohesion: 0.23
Nodes (12): GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles(), verifyContinuationPreservation() (+4 more)

### Community 3 - "config.ts"
Cohesion: 0.11
Nodes (35): featureItemComplete(), reconcileFeatureCompletion(), discoveryPrompt(), planPrompt(), readEvidence(), helperTelemetry(), DELAYS, MAX_EXECUTIONS (+27 more)

### Community 4 - "Inspector.tsx"
Cohesion: 0.13
Nodes (59): Outbox(), blockedSummary(), ServiceHealthPanel(), followUp(), labels, ServiceHealthRow(), BlockerFollowups(), LessonsPanel() (+51 more)

### Community 5 - "ControlStore"
Cohesion: 0.15
Nodes (7): DailyCTO, EvidenceRequestConflict, queueGoalEvidenceRequest(), Briefing, saveReviewBriefing(), ControlStore, DailyCTOReport

### Community 6 - "session-bridge.ts"
Cohesion: 0.11
Nodes (22): codexDaemonProcesses(), accountCodexProcesses(), CodexProcessInventory, codexProcessInventory(), DesktopSessions, unaccountedProcesses(), idleExecServers(), isExecServer() (+14 more)

### Community 7 - "ref_react"
Cohesion: 0.08
Nodes (57): guidanceExcerpt(), KnowledgeActivity, KnowledgeActivityPage, KnowledgeEdge, KnowledgeMap, KnowledgeNode, Activity(), ActivityTimeline() (+49 more)

### Community 8 - "continue-ownership-read.ts"
Cohesion: 0.27
Nodes (12): continueOwnershipRead(), expiredOwnershipRead(), handoffOwnership(), ReadbackOwnerDecision, ownershipReadGate(), ownershipReadState(), ownershipReadSource(), ReadOwnershipCandidate (+4 more)

### Community 9 - "github-delivery.ts"
Cohesion: 0.05
Nodes (110): containedFile(), writerRestartInstruction(), findingsBlock(), assertDeliveryMayMutate(), handsOff(), harnessDelivers(), legacyRecovery(), BOARD_RULE (+102 more)

### Community 10 - "agents.ts"
Cohesion: 0.06
Nodes (48): implementationWorkerContext(), intakeMembership(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), readbackDispatchGuidance(), CECReadbackSchema, READBACK_OWNER_SCOPE (+40 more)

### Community 11 - "ledger.ts"
Cohesion: 0.22
Nodes (15): acceptedCompletionResolution(), investigationCandidates(), investigationId(), ctoReplacementResolution(), finishedSubjectResolution(), investigationFollowUps(), implementationReplacementResolution(), interruptedQARerunResolution() (+7 more)

### Community 12 - "App.tsx"
Cohesion: 0.05
Nodes (64): itAgent(), itDiagnostics(), BrainDrawer(), themeColor, App(), BrainWorkspace, CONNECTION, CONNECTION_DOT (+56 more)

### Community 13 - "OfficeSnapshot"
Cohesion: 0.06
Nodes (46): SendMessage, ctoInputFailure(), OutboxCTOInput(), recover(), OutboxSavedImplementation(), apply(), review(), OutboxSavedPlan() (+38 more)

### Community 14 - "knowledge/routes.ts"
Cohesion: 0.07
Nodes (37): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, CommittedBrain (+29 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.14
Nodes (50): requestDelivery(), createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), CaptureRequest (+42 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.14
Nodes (30): BLOCKING, BlockingTrigger, blockingTrigger(), isBlocking(), BrainOverlap, brainOverlap(), brainOverlapQuery(), clip() (+22 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.12
Nodes (35): baselineLearning(), LEARNING_BASELINES, maintainLearning(), configureKnowledge(), clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates() (+27 more)

### Community 18 - "TelemetryPanel.tsx"
Cohesion: 0.11
Nodes (37): TelemetryReport, AzureBuild, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens(), usd() (+29 more)

### Community 19 - "artifact"
Cohesion: 0.11
Nodes (39): assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), reconcileCompletedConflictDraft(), routeReadyPostConflictPublication(), verifyInitialDraftConflictPreparation() (+31 more)

### Community 20 - "index.tsx"
Cohesion: 0.11
Nodes (42): LessonsView(), SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS, PickupForm() (+34 more)

### Community 21 - "harnessEffect"
Cohesion: 0.18
Nodes (28): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), ProjectCard, projectCards(), projectGraphql() (+20 more)

### Community 22 - "config.ts"
Cohesion: 0.09
Nodes (43): commandFeature(), reviewQuestions(), automaticIntakeWait(), FeaturePlanningBindings, assertQuestionVisibility(), applyHarnessAction(), HarnessActionInput, recoveryPreconditions() (+35 more)

### Community 23 - "jira-time.ts"
Cohesion: 0.14
Nodes (33): unresolvedAttempts(), bindingOf(), finishVerifiedEffects(), locks, matches(), publishJiraTime(), readBack(), readBackEntry() (+25 more)

### Community 24 - "index.ts"
Cohesion: 0.08
Nodes (42): implementationPreview(), implementationContinuationRoute(), qaPlanRetryRoute(), close(), config, itSpecialist, loadedRevision, offices (+34 more)

### Community 25 - "maintenance/maintenance.ts"
Cohesion: 0.09
Nodes (31): maintenancePolicies(), captureMaintenanceStep(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, brainResultStop(), capped(), queueMaintenanceNotice() (+23 more)

### Community 26 - "cost-ledger.ts"
Cohesion: 0.16
Nodes (27): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId(), OutsideEdit (+19 more)

### Community 27 - "http/commands.ts"
Cohesion: 0.12
Nodes (27): retryRecipientLookup(), Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership (+19 more)

### Community 28 - "knowledge.ts"
Cohesion: 0.06
Nodes (47): deliveryMetrics(), median(), expireLearningPackets(), learningMetrics(), BRAIN_SCOPE, SUBJECT, Kind, RetrospectiveResult (+39 more)

### Community 29 - "connectWith"
Cohesion: 0.38
Nodes (5): connectWith(), data(), envelope(), JiraWorklogs, WorklogSave

### Community 30 - "metadata-assessment.ts"
Cohesion: 0.20
Nodes (31): admitPRMetadata(), assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema, savedMetadataAssessment(), validateSaved(), metadataClaim() (+23 more)

### Community 31 - "harnessEffect"
Cohesion: 0.22
Nodes (12): HarnessEffect, harnessEffect(), readBackOrThrow(), retryRead(), linkedBody(), DependabotPR, editorMatches(), relinkPinCourier() (+4 more)

### Community 32 - "sanitize"
Cohesion: 0.13
Nodes (27): az(), AzureMonitor, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs(), fullActivePRs() (+19 more)

### Community 33 - "ref_node_path"
Cohesion: 0.05
Nodes (123): closeoutReceipt(), Candidate, assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2 (+115 more)

### Community 34 - "accept-stage-result.ts"
Cohesion: 0.18
Nodes (19): assertDraftClaimHistory(), linkDraftIssue(), protectedOriginalClaim(), METADATA_FINDING, publicationReadArgs(), Read, readPublication(), mergeAuthorized() (+11 more)

### Community 36 - "scheduled-work.ts"
Cohesion: 0.10
Nodes (34): freshOwnershipRead(), deliverySlot(), verifiedCloseoutCleanupRequest(), withAmendmentOwnership(), gateFeatureWork(), requestPriority(), closedTicketReport(), closedTicketRequest() (+26 more)

### Community 37 - "run-accounting.ts"
Cohesion: 0.11
Nodes (31): BoundedRead, comparable(), EvidenceOutcome, recordRunEvidence(), backfillClaudeCost(), CompletionReader, codexHome(), createdAt() (+23 more)

### Community 38 - "dependency-bots/adopt.ts"
Cohesion: 0.19
Nodes (22): Execute, adoptDependabot(), closesIssue(), linkPR(), DEPENDABOT, dependabotPR(), inPickupLane(), openDependabotPulls() (+14 more)

### Community 39 - "lesson-selection.ts"
Cohesion: 0.15
Nodes (19): INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), MAINTENANCE, MAX_LESSONS, normalPath() (+11 more)

### Community 40 - "restoreInPlace"
Cohesion: 0.60
Nodes (5): identity(), Json, plain(), restorable(), restoreInPlace()

### Community 41 - "time-scope.ts"
Cohesion: 0.16
Nodes (26): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence(), CaptureContext (+18 more)

### Community 42 - "GitHubDelivery"
Cohesion: 0.06
Nodes (54): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+46 more)

### Community 43 - "assignments.ts"
Cohesion: 0.12
Nodes (22): clip(), DEMAND_LIMIT, demandFacts(), DemandSection, key(), LessonKey, notes(), clip() (+14 more)

### Community 44 - "features/workflow.ts"
Cohesion: 0.09
Nodes (47): approveFeature(), mutation(), assertFeatureDependencyOrder(), key(), artifactPath(), digest(), document(), featureRoot() (+39 more)

### Community 45 - "harness-baseline.ts"
Cohesion: 0.15
Nodes (22): BaselineReport, baselineReport(), BaselineSource, baselineText(), millions(), row(), share(), add() (+14 more)

### Community 46 - "OfficeScene.tsx"
Cohesion: 0.17
Nodes (32): Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk(), ElevatorStage() (+24 more)

### Community 47 - "retrospective-subject.ts"
Cohesion: 0.13
Nodes (20): ARTIFACT_LIMIT, clip(), LEDGER_STEPS, MAINTENANCE_LIMIT, maintenanceFacts(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl() (+12 more)

### Community 48 - "command"
Cohesion: 0.06
Nodes (20): correlatedBuild(), checkMail(), drainMail(), requestMail(), enableNightly(), GitHubMonitor, githubPRDescription(), GOAL_EVIDENCE_LIMITS (+12 more)

### Community 49 - "session-context-file.ts"
Cohesion: 0.20
Nodes (14): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+6 more)

### Community 50 - "Store"
Cohesion: 0.06
Nodes (36): ROLES, GitHubFeaturePublisher, improvementIntakeGate(), captureLearning(), recordLearningOpportunity(), Clock, systemClock, ProjectPolicy (+28 more)

### Community 51 - "shared.ts"
Cohesion: 0.06
Nodes (38): ctoInputIdentityMatches(), ctoInputRecovered(), ADOPTION_STALLED_MS, Admission, checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), repeatedVendorReviewBlock() (+30 more)

### Community 52 - "cli.ts"
Cohesion: 0.10
Nodes (15): args, [cmd,...rawArgs], commands, key, projectIndex, LessonBrainAudit, lessonBrainAudit(), LessonBrainOverlap (+7 more)

### Community 53 - "inspect-closed-plan.ts"
Cohesion: 0.14
Nodes (18): assertOwnership(), decideImplementation(), ImplementationDecision, OwnershipRead, closedReadonlyPlan(), Document, document(), consumeQAPlanRetry() (+10 more)

### Community 54 - "continue-access-only-plan.ts"
Cohesion: 0.54
Nodes (6): Document, document(), isAccessOnlyPlan(), settledAccessOnlyState(), continueAccessOnlyPlan(), entryExists()

### Community 55 - "daily-cto.ts"
Cohesion: 0.18
Nodes (17): expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), evidenceRequestConflicts, dailyReviewPrompt() (+9 more)

### Community 56 - "FeatureWorkspace.tsx"
Cohesion: 0.19
Nodes (18): FeatureQuestionProjection, OutboxQuestionRound(), send(), draftKey(), readDraft(), saveDraft(), QuestionRound(), nextQuestion() (+10 more)

### Community 57 - ".getEffect"
Cohesion: 0.15
Nodes (14): GitHubOperations, validateGitHubIssue(), admitImprovement(), fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), lessonText(), sendGoalNotice() (+6 more)

### Community 58 - "goal-reviews.ts"
Cohesion: 0.20
Nodes (12): applyGoalReview(), DailyResultSchema, EvidenceRefSchema, FreshDailyResultSchema, GoalEvidenceRequestSchema, statusAllowed(), workEvidence(), GoalInput (+4 more)

### Community 59 - "project-bindings-config.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 60 - "goal-reporting.ts"
Cohesion: 0.25
Nodes (15): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+7 more)

### Community 61 - "highestStableAtLeast"
Cohesion: 0.83
Nodes (3): compare(), highestStableAtLeast(), parts()

### Community 62 - "run.ts"
Cohesion: 0.22
Nodes (7): CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility, overlayEntranceDelays(), SceneOverlay()

### Community 63 - "createConstellation"
Cohesion: 0.18
Nodes (5): ConstellationRuntime, createConstellation(), enter(), finishTap(), move()

### Community 64 - "jiraBinding"
Cohesion: 0.09
Nodes (41): jiraRecord(), unpack(), metadataDigest(), verifiedTransition(), verifyAlreadyAtStatus(), Connection, twgConnection(), twgProfile() (+33 more)

### Community 65 - "run-accounting.ts"
Cohesion: 0.10
Nodes (26): CodexRollout, CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL (+18 more)

### Community 66 - "remove-candidate.ts"
Cohesion: 0.18
Nodes (18): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot() (+10 more)

### Community 67 - "coordination.ts"
Cohesion: 0.09
Nodes (38): MergeNotifications, admit(), IntakeContext, WAIT_STATUSES, compatible(), dependencyCompletionKey(), dependencyEligibility(), DependencyStores (+30 more)

### Community 68 - "session-context-file.ts"
Cohesion: 0.19
Nodes (14): ContextFoldPrefix, contextFoldPrefix(), SessionContextCheckpoint, captureSessionContextClone(), ContextReadPhase, SessionContextDeadline, sessionContextFile(), ContextReadChanged (+6 more)

### Community 69 - "publish-pr.ts"
Cohesion: 0.13
Nodes (20): commitlintRejection(), developerPRContent(), Execute, officePRContent(), PRContent, prContent(), PRContentRejected, Event (+12 more)

### Community 70 - "constellation-runtime.ts"
Cohesion: 0.15
Nodes (16): CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point, focusOverlayMotion(), FocusOverlayLayout (+8 more)

### Community 71 - "session-scope.ts"
Cohesion: 0.14
Nodes (20): claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexSessionContext(), readRollout, ContextProject, ContextReader (+12 more)

### Community 72 - "work.ts"
Cohesion: 0.08
Nodes (30): PrerequisitesSchema, classifyStop(), ReviewWait, BLOCKED_CAUSES, blockedCauses(), projectReadiness(), READ_OPERATIONS, RETAINED_PER_ACTION (+22 more)

### Community 73 - "report.ts"
Cohesion: 0.24
Nodes (14): TelemetryRow, TelemetrySync, Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount() (+6 more)

### Community 74 - "projects.ts"
Cohesion: 0.13
Nodes (19): CEC, LOCAL_BINDINGS, projectSettingsSummary(), ownProjectBindings(), explicitBindings(), BEFORE_POLICY, parseHolds(), policySchema (+11 more)

### Community 75 - "Offices"
Cohesion: 0.16
Nodes (4): QuestionNotifications, projectById(), Offices, markCaptureStart()

### Community 76 - ".emit"
Cohesion: 0.11
Nodes (26): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR (+18 more)

### Community 77 - "owned-artifact.ts"
Cohesion: 0.24
Nodes (13): investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_SOURCE_PATHS, officeSource(), done(), readBoundedNoFollow() (+5 more)

### Community 78 - "service-health.ts"
Cohesion: 0.20
Nodes (9): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, HealthReport (+1 more)

### Community 79 - "Ticket"
Cohesion: 0.06
Nodes (53): JiraOperations, cecPrompt(), resolvedDecisionNote(), stageInstructions, stageInstructionsFor(), capacityInterruptedRun(), providerSaid(), rerunsInterruptedQA() (+45 more)

### Community 80 - "accept-retrospective.ts"
Cohesion: 0.16
Nodes (19): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, curateLesson(), Curation, CurationAction, mergeEvidence() (+11 more)

### Community 81 - "holdReason"
Cohesion: 0.04
Nodes (100): interruptedImplementation(), continueUnsealedQA(), entry(), ownershipReadHistory(), recoverCTOInput(), deliveryIntakeBlocker(), pinCourierIdentityRefusal(), pinCourierVerifiedCommit() (+92 more)

### Community 82 - "cec/issue-publication.ts"
Cohesion: 0.17
Nodes (13): escaped(), IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), projectListScope(), Assignment, contentSchema() (+5 more)

### Community 83 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 84 - "tracking-issue.ts"
Cohesion: 0.19
Nodes (13): ensureTrackingIssue(), findTrackingIssue(), ownTracking(), TrackingIssue, trackingIssueBody(), trackingIssueTitle(), trackingMarker(), centralCompanionHandoff() (+5 more)

### Community 85 - "scope-repair-resume.ts"
Cohesion: 0.24
Nodes (15): metadataRequestResolved(), preparationRequestResolved(), Ownership, reconcileScopeRepairReadback(), scopeRepairRequestResolved(), assertScopeRepairResumeFindings(), certain(), effects() (+7 more)

### Community 86 - "local-config.ts"
Cohesion: 0.29
Nodes (12): AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), goalEvidencePath(), assertUniqueProjectKeys(), Entry, LocalBindings, localBindings(), ProjectInput (+4 more)

### Community 87 - "outbox.ts"
Cohesion: 0.09
Nodes (29): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+21 more)

### Community 88 - "useOfficePreferences.ts"
Cohesion: 0.26
Nodes (10): acceptPreferences(), PreferenceCandidate, strip(), UNKNOWN_PREFERENCES, OfficePreferencesController, PreferenceFeedback, PreferenceField, requestPreferences() (+2 more)

### Community 89 - "jira-attempts.ts"
Cohesion: 0.29
Nodes (9): attempted(), attemptState(), bound(), covers(), JiraAttempt, jiraAttempts(), JiraAttemptState, open() (+1 more)

### Community 90 - "project-binding-blocks.ts"
Cohesion: 0.18
Nodes (20): azureSchema, deploymentSchema, jiraSchema, ownJiraSchema, promptSchema, DEFAULT_STAGE_STATUSES, intakeStatus, resolvedStatuses() (+12 more)

### Community 91 - "config.ts"
Cohesion: 0.12
Nodes (27): CommentPage, commentReadback(), devUpdate(), HEADLINE, parksInJira(), postDevUpdate(), OUTCOME, qaComment() (+19 more)

### Community 93 - "conversations/slack.ts"
Cohesion: 0.10
Nodes (14): cecIntakePrompt(), slackSendPrompt(), slackVerifyPrompt(), comparableSlackText(), SlackMessages, SlackRequestSchema, SlackResultSchema, SlackVerificationSchema (+6 more)

### Community 94 - "workKey"
Cohesion: 0.12
Nodes (20): resumeLinkedDelivery(), completedPRReviews(), eligible(), mergedByOwner(), ownerSettles(), retireExternalDeliveries(), settledExternalRepair(), BrainStatusSchema (+12 more)

### Community 96 - "recovery/stopped-base-update.ts"
Cohesion: 0.07
Nodes (52): ATTEMPT_DELAYS_MS, nextAttemptAt(), restartStoppedWriters(), unchangedSinceAccepted(), NOT_RETRYABLE, WRITER_STAGES, WriterRestartCandidate, writerRestartCandidate() (+44 more)

### Community 97 - "process.ts"
Cohesion: 0.09
Nodes (28): ContinuationIO, nativeIO, absent(), candidateParent(), copySavedImplementation(), Saved, sha(), assertCandidateIdle() (+20 more)

### Community 98 - "jiraBinding"
Cohesion: 0.09
Nodes (54): resolveBlockedTransition(), document(), transitionWithComment(), jiraAccount(), jiraCollection(), JiraCredential, jiraCredential(), KEYCHAIN_SERVICE (+46 more)

### Community 99 - "time-readback.ts"
Cohesion: 0.11
Nodes (20): JiraWorklogAttempt, JiraWorklogReconcile, publishableEntry(), settlementPending(), superseded(), ticketUnresolved(), TimeLedger, Readback (+12 more)

### Community 100 - "pilot-delivery.ts"
Cohesion: 0.07
Nodes (58): candidateBranchMoved(), continueImplementation(), applyIntakeObservation(), drainDelivery(), resume(), startPilot(), OfficeQAHandoffInput, confirmSetupStopCap() (+50 more)

### Community 101 - "projectOutbox"
Cohesion: 0.14
Nodes (20): projectOutbox(), syncOutbox(), finishSupersededReadback(), projectSlackDeliveries(), settleRequestedSlackReplacement(), Input, supersedeSlackDelivery(), replacementContext() (+12 more)

### Community 102 - "leadership.ts"
Cohesion: 0.20
Nodes (8): DailyCTOBriefing, DailyCTOResult, DailyCTOSummary, DailyGoalUpdate, GoalEvidenceRef, GoalEvidenceRequest, GoalProgress, GoalStatus

### Community 103 - "worker-runtime.ts"
Cohesion: 0.07
Nodes (38): candidateWorkspaceEnvironment(), APPROACH_GUIDANCE, ApproachSchema, assignmentSubject(), dispatchExposure(), prepareExposure(), LessonSelection, catalogLine() (+30 more)

### Community 104 - "Coordinator"
Cohesion: 0.08
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 105 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 106 - "delivery-ownership.ts"
Cohesion: 0.33
Nodes (4): Ownership, ownershipContext, refreshDeliveryOwnership(), RefreshOwnership

### Community 107 - "run.ts"
Cohesion: 0.19
Nodes (14): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, OFFICE_FIX_PROMPT, OfficeFixResult, validateOfficeFix(), investigationReady(), InvestigationOptions, InvestigationReport (+6 more)

### Community 108 - "codex-rollout-file.ts"
Cohesion: 0.18
Nodes (7): FeaturePublisher, PublicationReceipt, GitHubIssuePublisher, number(), same(), FeatureManifestItem, FeatureOperation

### Community 109 - "Conversation.tsx"
Cohesion: 0.20
Nodes (17): LessonDecisionAction, lessonDecisionState(), readLessonDecision(), OutboxLessonDecision(), act(), readStatus(), evidenceText(), field() (+9 more)

### Community 110 - "handover-cms.ts"
Cohesion: 0.33
Nodes (4): file, project, root, projectData()

### Community 111 - "scheduled-features.ts"
Cohesion: 0.22
Nodes (19): dispatchNightly(), eligibility(), featureById(), currentApproval(), featureGate(), predecessorComplete(), recoveryHeld(), publishFeature() (+11 more)

### Community 112 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 113 - "admit-improvement.ts"
Cohesion: 0.35
Nodes (7): improvementEligible(), improvementManifest(), improvementMarker(), improvementProvider(), linkedRepairGap(), queueImprovements(), KnowledgeImprovement

### Community 114 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 115 - "blocker-followups.ts"
Cohesion: 0.15
Nodes (18): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), itChatPrompt(), assignmentDiagnostics(), readBackConversations(), diagnosticContext() (+10 more)

### Community 120 - "it-specialist.ts"
Cohesion: 0.15
Nodes (20): partialLocalCleanupKey(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), ITContext, informationalRecovery(), publishITReport() (+12 more)

### Community 121 - "OfficeConfigView.tsx"
Cohesion: 0.46
Nodes (6): loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView(), policyText(), OfficeConfigSummary

### Community 122 - "office-state-view.ts"
Cohesion: 0.60
Nodes (4): leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore()

### Community 124 - "office-qa-handoff.ts"
Cohesion: 0.60
Nodes (4): OfficeQAHandoff, OfficeQAHandoffInput, OfficeQAHandoffRequest, QAOwnershipProof

### Community 126 - "contract.ts"
Cohesion: 0.33
Nodes (4): file, folder, logs, root

## Knowledge Gaps
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `candidate.ts`, `config.ts`, `session-bridge.ts`, `continue-ownership-read.ts`, `github-delivery.ts`, `agents.ts`, `ledger.ts`, `OfficeSnapshot`, `knowledge/routes.ts`, `scheduled-captures.ts`, `run-retrospective.ts`, `record-trigger.ts`, `artifact`, `harnessEffect`, `config.ts`, `jira-time.ts`, `index.ts`, `maintenance/maintenance.ts`, `cost-ledger.ts`, `http/commands.ts`, `knowledge.ts`, `metadata-assessment.ts`, `harnessEffect`, `sanitize`, `ref_node_path`, `accept-stage-result.ts`, `scheduled-work.ts`, `run-accounting.ts`, `dependency-bots/adopt.ts`, `lesson-selection.ts`, `time-scope.ts`, `GitHubDelivery`, `assignments.ts`, `features/workflow.ts`, `retrospective-subject.ts`, `command`, `inspect-closed-plan.ts`, `continue-access-only-plan.ts`, `daily-cto.ts`, `.getEffect`, `goal-reviews.ts`, `jiraBinding`, `remove-candidate.ts`, `coordination.ts`, `publish-pr.ts`, `work.ts`, `Offices`, `.emit`, `owned-artifact.ts`, `Ticket`, `accept-retrospective.ts`, `holdReason`, `cec/issue-publication.ts`, `tracking-issue.ts`, `scope-repair-resume.ts`, `outbox.ts`, `jira-attempts.ts`, `config.ts`, `FeatureWorkflow`, `conversations/slack.ts`, `workKey`, `recovery/stopped-base-update.ts`, `process.ts`, `jiraBinding`, `time-readback.ts`, `pilot-delivery.ts`, `projectOutbox`, `worker-runtime.ts`, `Coordinator`, `run.ts`, `codex-rollout-file.ts`, `scheduled-features.ts`, `admit-improvement.ts`, `blocker-followups.ts`, `ProjectProgress`, `it-specialist.ts`, `office-state-view.ts`?**
  _High betweenness centrality (0.116) - this node is a cross-community bridge._
- **Should `Outbox.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07755102040816327 - nodes in this community are weakly interconnected._
- **Why does `OfficeSnapshot` connect `OfficeSnapshot` to `Outbox.tsx`, `OrgChart.tsx`, `Inspector.tsx`, `ref_react`, `ledger.ts`, `App.tsx`, `record-trigger.ts`, `TelemetryPanel.tsx`, `index.tsx`, `index.ts`, `maintenance/maintenance.ts`, `sanitize`, `harness-baseline.ts`, `OfficeScene.tsx`, `Store`, `shared.ts`, `cli.ts`, `project-bindings-config.ts`, `work.ts`, `service-health.ts`, `outbox.ts`, `useOfficePreferences.ts`, `pilot-delivery.ts`, `projectOutbox`, `leadership.ts`, `Conversation.tsx`, `office-state-view.ts`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Should `OrgChart.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10714285714285714 - nodes in this community are weakly interconnected._
- **Why does `Engine` connect `command` to `config.ts`, `continue-ownership-read.ts`, `github-delivery.ts`, `scheduled-captures.ts`, `maintenance/maintenance.ts`, `sanitize`, `scheduled-work.ts`, `.getEffect`, `coordination.ts`, `Offices`, `.emit`, `Ticket`, `holdReason`, `outbox.ts`, `FeatureWorkflow`, `conversations/slack.ts`, `process.ts`, `pilot-delivery.ts`, `Coordinator`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Should `config.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11278195488721804 - nodes in this community are weakly interconnected._
- **Should `Inspector.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12576896787423103 - nodes in this community are weakly interconnected._