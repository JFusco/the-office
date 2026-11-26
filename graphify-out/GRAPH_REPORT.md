# Graph Report - the-office  (2026-11-26)

## Corpus Check
- 1259 files · ~536,780 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 6565 nodes · 28717 edges · 168 communities (159 shown, 9 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 1033 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `50c2f71a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- incidents/routes.ts
- OrgChart.tsx
- worker-runtime.ts
- features.ts
- cx
- ControlStore
- workKey
- index.tsx
- GitHubIssuePublisher
- TelemetryPanel.tsx
- office/config.ts
- kill-switch.ts
- App.tsx
- admit-improvement.ts
- advance-metadata-park.ts
- scheduled-captures.ts
- run-retrospective.ts
- record-trigger.ts
- sign-in-unpark.ts
- github-delivery.ts
- artifact
- .emit
- retrospective-subject.ts
- jira-time.ts
- holdReason
- OfficeSnapshot
- controller-runtime.ts
- fact-bounds.ts
- github-context.ts
- shared.ts
- digest
- route-head.ts
- index.ts
- pilot-delivery.ts
- call-scope.ts
- common.cjs
- scheduled-work.ts
- routing.cjs
- redact-evidence.ts
- assignments.ts
- observe-github-merges.ts
- time-scope.ts
- engine.ts
- .save
- Offices
- harness-baseline.ts
- OfficeScene.tsx
- lesson-selection.ts
- cec.ts
- http/commands.ts
- FeatureWorkspace.tsx
- ledger.ts
- ref_zod
- ref_node_sqlite
- JiraIssuePublisher
- ref_node_child_process
- owner-step-items.ts
- pass.ts
- intent.ts
- jira-attempts.ts
- cost-ledger.ts
- time-ledger.ts
- maintenance/maintenance.ts
- ref_react
- judge-resumes.ts
- validate_pr_body.cjs
- audit-plan-candidates.cjs
- office-client.ts
- resume-arrivals.ts
- ref_node_crypto
- constellation-runtime.ts
- agents.ts
- session-context-file.ts
- knowledge/routes.ts
- session-scope.ts
- service-health.ts
- jiraBinding
- requests.ts
- incidents.ts
- runner-state.ts
- session-bridge.ts
- Coordinator
- api-routes.ts
- brain-maintenance.ts
- viewer.js
- weekly-rollup.ts
- stopped-record.ts
- sanitize
- notifications.ts
- spawn-command.ts
- github-workflows.ts
- StageResult
- session-context-client.ts
- plans.cjs
- timed-statements.ts
- capture-session-clone.py
- control-store.ts
- deploy.ts
- ticket-stage-runner.ts
- archive-plan.cjs
- call-outcome.ts
- owner-merged-stopped.ts
- harness-action.ts
- on-merge-sync.cjs
- backup-stores.ts
- extract-worker.mjs
- deploy-plan.ts
- assignment-poll.ts
- json
- discovery-recovery.ts
- blocker-followups.ts
- report.ts
- outbox.ts
- work.ts
- slack-supersession.ts
- run-accounting.ts
- qa.ts
- qa-plan-continuation.ts
- writer-restart.ts
- restart-writer.ts
- features/routes.ts
- release-unpark.ts
- connectWith
- deploy-command.ts
- refresh-issue-state.cjs
- knowledge.ts
- delivery-repairs.ts
- accessibility-sources.ts
- single-flight.ts
- call-ledger.ts
- pre-push-boundary.ts
- it-specialist.ts
- diagnostic-snapshot.ts
- session-coverage.ts
- follow-up-alerts.ts
- release-floor.ts
- task-briefing.ts
- lesson-issue-ready.ts
- run.ts
- cto-replacement-resolution.ts
- session-snapshot-cleanup.ts
- ProjectProgress
- Store
- production.ts
- reconcile-merges.cjs
- preferences-store.ts
- rootArtifact
- inventory-startup-wait.ts
- runner-root.ts
- harnessEffect
- repoRoot
- Conversation.tsx
- ITFollowUps.tsx
- daily-cto.ts
- resume-outcome.ts
- recorded-gh-command.ts
- salvage-worktree.ts
- exit-failure.ts
- routing.js
- InFlightOperations
- CommandRegistry
- restoreInPlace
- validate-stage.ts
- operationPaths
- mutedCopy
- normalize-question.ts
- delivery-ownership.ts
- unblock-brief.ts

## God Nodes (most connected - your core abstractions)
1. `Store` - 458 edges
2. `TicketJob` - 221 edges
3. `digest()` - 175 edges
4. `command()` - 155 edges
5. `holdReason()` - 141 edges
6. `GitHubDelivery` - 131 edges
7. `OfficeSnapshot` - 123 edges
8. `artifact()` - 116 edges
9. `workKey()` - 110 edges
10. `StageResult` - 110 edges

## Surprising Connections (you probably didn't know these)
- `publish()` --indirect_call--> `title()`  [INFERRED]
  scripts/graphify/publish-refresh.cjs → src/knowledge/map/grouping.ts
- `BreakdownTable()` --indirect_call--> `cell()`  [INFERRED]
  src/telemetry/BreakdownTable.tsx → scripts/wiki/archive-plan.cjs
- `apply()` --indirect_call--> `note()`  [INFERRED]
  src/conversations/OutboxSavedImplementation.tsx → server/cec/parking/resume-parked.ts
- `UnrecordedResult` --references--> `StageResult`  [EXTRACTED]
  server/cec/unrecorded-result.ts → src/shared.ts
- `Write` --references--> `EffectIntent`  [EXTRACTED]
  server/delivery/publication/own-description.ts → src/contracts/work.ts

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
- 2-file cycle: `src/contracts/people.ts -> src/shared.ts -> src/contracts/people.ts`
- 2-file cycle: `src/contracts/timing.ts -> src/shared.ts -> src/contracts/timing.ts`
- 2-file cycle: `src/contracts/work.ts -> src/shared.ts -> src/contracts/work.ts`
- 2-file cycle: `server/workers/process.ts -> server/workers/spawn-command.ts -> server/workers/process.ts`
- 3-file cycle: `server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-guard.ts -> server/delivery/pipeline/github-delivery.ts`

## Communities (168 total, 9 thin omitted)

### Community 0 - "incidents/routes.ts"
Cohesion: 0.05
Nodes (68): citationFault(), CitationSchema, SourceVersions, sourceVersions(), inHistoryOf(), dismiss(), DISMISSAL_CITATIONS, DISMISSAL_REASON (+60 more)

### Community 1 - "OrgChart.tsx"
Cohesion: 0.11
Nodes (37): label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+29 more)

### Community 2 - "worker-runtime.ts"
Cohesion: 0.06
Nodes (43): candidateWorkspaceEnvironment(), assignmentDiagnostics(), diagnosticContext(), assignmentSubject(), dispatchExposure(), prepareExposure(), lessonPurpose(), LessonSelection (+35 more)

### Community 3 - "features.ts"
Cohesion: 0.06
Nodes (65): assertFeatureDependencyOrder(), featureDependencyEdges(), key(), artifactPath(), digest(), document(), featureRoot(), DiscoverySchema (+57 more)

### Community 4 - "cx"
Cohesion: 0.08
Nodes (88): DailyCTOSummary, Outbox(), blockedSummary(), currentServices(), ServiceHealthPanel(), followUp(), ServiceHealthRow(), goalKey() (+80 more)

### Community 5 - "ControlStore"
Cohesion: 0.13
Nodes (11): DailyCTO, EvidenceRequestConflict, reviewWeekday(), queueGoalEvidenceRequest(), Briefing, saveReviewBriefing(), SeenReports, WAITING (+3 more)

### Community 6 - "workKey"
Cohesion: 0.08
Nodes (46): ownershipReadHistory(), resumeLinkedDelivery(), needsReconciliation(), adoptCandidate(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent() (+38 more)

### Community 7 - "index.tsx"
Cohesion: 0.14
Nodes (36): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS, PickupForm(), ProjectForms() (+28 more)

### Community 8 - "GitHubIssuePublisher"
Cohesion: 0.18
Nodes (7): FeaturePublisher, PublicationReceipt, GitHubIssuePublisher, number(), same(), FeatureManifestItem, FeatureOperation

### Community 9 - "TelemetryPanel.tsx"
Cohesion: 0.11
Nodes (36): TelemetryReport, LiveAnchor, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens(), usd() (+28 more)

### Community 10 - "office/config.ts"
Cohesion: 0.12
Nodes (35): commandFeature(), featureById(), reviewQuestions(), discoveryPrompt(), planPrompt(), GitHubFeaturePublisher, automaticIntakeWait(), IntakeView (+27 more)

### Community 11 - "kill-switch.ts"
Cohesion: 0.18
Nodes (20): guardPresent(), overseerCommand(), resolveCliRoot(), runnerStatus(), bounded(), ControlRead, Halt, Pause (+12 more)

### Community 12 - "App.tsx"
Cohesion: 0.04
Nodes (83): jiraQueueProgress(), nextStage(), deliveryRoles, JiraQueueProgress, TicketProgress, themeColor, App(), BrainWorkspace (+75 more)

### Community 13 - "admit-improvement.ts"
Cohesion: 0.21
Nodes (17): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+9 more)

### Community 14 - "advance-metadata-park.ts"
Cohesion: 0.08
Nodes (69): advanceMetadataPark(), Parked, releaseWords(), sentAnything(), effectiveParkPickup(), PICKUP_ASSIGNEE, REVIEWABLE, decisionMarker() (+61 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.14
Nodes (45): accounting, DeliverySubject, nonDelivery, originalReads, createFeature(), assertEnrollable(), assessmentSignal(), AssessmentSignals (+37 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.09
Nodes (45): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, BlockingTrigger, blockingTrigger(), isBlocking() (+37 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.11
Nodes (37): learningDigest(), baselined(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences(), clip(), maintenanceBlockedId() (+29 more)

### Community 18 - "sign-in-unpark.ts"
Cohesion: 0.05
Nodes (57): parksInJira(), readbackDispatchGuidance(), currentEnvironmentWait(), environmentWait(), waitText(), rerunsInterruptedQA(), officeRefusedQA(), QA_STAGES (+49 more)

### Community 19 - "github-delivery.ts"
Cohesion: 0.04
Nodes (74): writerRestartInstruction(), harnessCloseout(), PASSING, verifyMergeActions(), metadataCarriedAdvisoryIds(), ownedBefore(), QA_STAGES, reviewAdvisoryIds() (+66 more)

### Community 20 - "artifact"
Cohesion: 0.06
Nodes (104): containedFile(), acceptStageResult(), acceptMetadataReview(), requireMetadataReview(), verdict(), mergeAuthorized(), activationAuditResponseSchema(), ActivationAuditSchema (+96 more)

### Community 21 - ".emit"
Cohesion: 0.08
Nodes (53): readBackOrThrow(), adoptDependabot(), AlertIssue, alertIssueBody(), alertIssueTitle(), alertMarker(), closeAlertIssue(), ensureAlertIssue() (+45 more)

### Community 22 - "retrospective-subject.ts"
Cohesion: 0.13
Nodes (20): deliveryMetrics(), median(), ARTIFACT_LIMIT, clip(), LEDGER_STEPS, MAINTENANCE_LIMIT, maintenanceFacts(), maintenanceSubject() (+12 more)

### Community 23 - "jira-time.ts"
Cohesion: 0.12
Nodes (33): unresolvedAttempts(), bindingOf(), finishVerifiedEffects(), locks, matches(), publishJiraTime(), readBack(), readBackEntry() (+25 more)

### Community 24 - "holdReason"
Cohesion: 0.05
Nodes (85): stoppedWriter(), writerRestarted(), findingsBlock(), deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), deliveryIntakeBlocker(), gateRegisteredDelivery() (+77 more)

### Community 25 - "OfficeSnapshot"
Cohesion: 0.06
Nodes (46): knowledgeOutbox(), DAYS, dueLessonDecisions(), easternWeek(), LESSON_DIGEST, LessonDecision, PARTS, pendingLessonDecisions() (+38 more)

### Community 26 - "controller-runtime.ts"
Cohesion: 0.16
Nodes (12): StoreDatabase, controllerEffects(), alive(), ControllerMachine, option(), realMachine(), runController(), DEFAULT_TIMINGS (+4 more)

### Community 27 - "fact-bounds.ts"
Cohesion: 0.18
Nodes (19): leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance() (+11 more)

### Community 28 - "github-context.ts"
Cohesion: 0.10
Nodes (43): observe(), returnDraftToPromotion(), CheckJobAgreement, checkJobAgreement(), isKnownCheckStatus(), positive(), STATE, UNFINISHED (+35 more)

### Community 29 - "shared.ts"
Cohesion: 0.03
Nodes (99): Document, document(), isAccessOnlyPlan(), settledAccessOnlyState(), continueAccessOnlyPlan(), entryExists(), continueOwnershipRead(), continueUnsealedQA() (+91 more)

### Community 30 - "digest"
Cohesion: 0.06
Nodes (97): retryRead(), createdContentSha256(), Binding, historyBeforeWrite(), matchesBoundDescription(), DescriptionEdit, DescriptionHistory, DescriptionHistoryUnavailable (+89 more)

### Community 31 - "route-head.ts"
Cohesion: 0.10
Nodes (36): writerRestartPending(), assertStoppedBaseAudit(), AuditRow, AWS_KEY_ID, CoverageRow, Hash, JSON_WEB_TOKEN, Kind (+28 more)

### Community 32 - "index.ts"
Cohesion: 0.07
Nodes (27): runningRevision(), runningRevision(), close(), config, itSpecialist, loadedRevision, offices, releaseLock (+19 more)

### Community 33 - "pilot-delivery.ts"
Cohesion: 0.07
Nodes (63): dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), startPilot(), OfficeQAHandoffInput, eligibility(), reconcileNoticeConfirmations() (+55 more)

### Community 34 - "call-scope.ts"
Cohesion: 0.14
Nodes (19): failed(), bindGitHubRunner(), currentGitHubProject(), currentGitHubSource(), githubCli(), Runner, scopes, STAGES (+11 more)

### Community 35 - "common.cjs"
Cohesion: 0.16
Nodes (25): fromArgs(), connections(), fs, main(), path, atomicWrite(), crypto, digest() (+17 more)

### Community 36 - "scheduled-work.ts"
Cohesion: 0.08
Nodes (44): freshOwnershipRead(), dueSlackReread(), rereadUncertainSlack(), runningRevision(), deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), withAmendmentOwnership() (+36 more)

### Community 37 - "routing.cjs"
Cohesion: 0.11
Nodes (33): fs, main(), path, { spawnSync }, frontmatterProblems(), main(), parseArgs(), usage() (+25 more)

### Community 38 - "redact-evidence.ts"
Cohesion: 0.06
Nodes (49): field(), FIELDS, MetadataField, metadataFields(), metadataParkWords(), metadataStopWords(), needed(), sentence() (+41 more)

### Community 39 - "assignments.ts"
Cohesion: 0.15
Nodes (15): AssignmentLookups, assignmentLookups, Binding, lookupInstructions(), clip(), MISSED_QUERY_LIMIT, missedQueries(), decodeLookupJournal() (+7 more)

### Community 40 - "observe-github-merges.ts"
Cohesion: 0.28
Nodes (15): clearCooldown(), coolDown(), coolingDown(), MERGE_NOTICE_RECHECK_MS, waitKey(), waits, isMergeCommit(), issueOf() (+7 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.15
Nodes (26): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence(), CaptureContext (+18 more)

### Community 42 - "engine.ts"
Cohesion: 0.07
Nodes (11): checkMail(), drainMail(), requestMail(), ingest(), GitHubMonitor, ResumeProject, drainMaintenance(), reconcileMaintenance() (+3 more)

### Community 43 - ".save"
Cohesion: 0.08
Nodes (59): enumerateIntakeList(), inPickupOrder(), Intake, text(), resolveBlockedTransition(), document(), transitionWithComment(), jiraAccount() (+51 more)

### Community 44 - "Offices"
Cohesion: 0.15
Nodes (3): QuestionNotifications, Offices, SessionBridge

### Community 45 - "harness-baseline.ts"
Cohesion: 0.15
Nodes (22): BaselineReport, baselineReport(), BaselineSource, baselineText(), millions(), row(), share(), add() (+14 more)

### Community 46 - "OfficeScene.tsx"
Cohesion: 0.08
Nodes (61): displayAgentTask(), githubStageLabels, withoutElapsed(), CameraBookmark, restoreBookmark(), LiveAgentTask(), Props, RunningTask() (+53 more)

### Community 47 - "lesson-selection.ts"
Cohesion: 0.19
Nodes (13): INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, MAINTENANCE, MAX_LESSONS, normalPath(), PURPOSES (+5 more)

### Community 48 - "cec.ts"
Cohesion: 0.07
Nodes (47): cecPrompt(), resolvedDecisionNote(), stageInstructions, stageInstructionsFor(), REVIEW_FINDINGS_RULE, latestQA(), notPassedInLatestQA(), QACoverage (+39 more)

### Community 49 - "http/commands.ts"
Cohesion: 0.12
Nodes (25): requestQAPlanRetry(), configureNotices(), noticeState(), recoverCTOInput(), requeueWaitedImplement(), normalizeStatement(), baselineLearning(), configureKnowledge() (+17 more)

### Community 50 - "FeatureWorkspace.tsx"
Cohesion: 0.11
Nodes (29): FeatureQuestionProjection, OutboxQuestionRound(), send(), FeatureDelivery(), FeatureDocuments(), views, FeatureReading(), FeatureWorkspace() (+21 more)

### Community 51 - "ledger.ts"
Cohesion: 0.18
Nodes (18): acceptedCompletionResolution(), investigationCandidates(), investigationId(), finishedSubjectResolution(), investigationFollowUps(), implementationReplacementResolution(), interruptedQARerunResolution(), investigationResolution() (+10 more)

### Community 52 - "ref_zod"
Cohesion: 0.05
Nodes (73): escaped(), IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), intakeMembership(), projectListScope(), Assignment (+65 more)

### Community 53 - "ref_node_sqlite"
Cohesion: 0.11
Nodes (18): readSavedState(), LARGE_KEY_CHARS, plain(), RedactedEntries, RedactedEntry, redactEntries(), joinParts(), PartRow (+10 more)

### Community 54 - "JiraIssuePublisher"
Cohesion: 0.17
Nodes (6): contentSchema(), JiraIssuePublisher, jiraText(), descriptionPreimage(), plain(), publicationDescription()

### Community 55 - "ref_node_child_process"
Cohesion: 0.08
Nodes (27): changedPaths(), { execFileSync }, files, isMapInput(), mapOnly(), { execFileSync }, git(), publish() (+19 more)

### Community 56 - "owner-step-items.ts"
Cohesion: 0.19
Nodes (11): OwnerStepItem, ownerStepItems(), signIn(), commands(), SIGN_IN_SERVICE_TROUBLE, signInSteps(), Step, OwnerSteps (+3 more)

### Community 57 - "pass.ts"
Cohesion: 0.17
Nodes (22): RunnerLimits, appendFailureLine(), Evidence, FAILURE_ID, FailureEvent, failureLine(), JournalRefused, JournalView (+14 more)

### Community 58 - "intent.ts"
Cohesion: 0.08
Nodes (38): GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles(), ContinuationIO (+30 more)

### Community 59 - "jira-attempts.ts"
Cohesion: 0.13
Nodes (22): attempted(), attemptState(), bound(), covers(), JiraAttempt, jiraAttempts(), JiraAttemptState, open() (+14 more)

### Community 60 - "cost-ledger.ts"
Cohesion: 0.15
Nodes (27): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress(), effectId() (+19 more)

### Community 61 - "time-ledger.ts"
Cohesion: 0.18
Nodes (16): publishableEntry(), settlementPending(), superseded(), ticketUnresolved(), syncing, TimeLedger, missedSinceVerified(), readBackTime() (+8 more)

### Community 62 - "maintenance/maintenance.ts"
Cohesion: 0.11
Nodes (27): maintenancePolicies(), captureMaintenanceStep(), accessibilitySources(), sourceReview(), candidateOwner(), SETTLED, skipOwnedCandidate(), Skipped (+19 more)

### Community 63 - "ref_react"
Cohesion: 0.07
Nodes (56): KnowledgeActivity, KnowledgeActivityPage, KnowledgeEdge, KnowledgeMap, KnowledgeNode, Activity(), ActivityTimeline(), AssignmentKnowledge() (+48 more)

### Community 64 - "judge-resumes.ts"
Cohesion: 0.06
Nodes (53): CompareMemory, compareMemory(), COMPARES_PER_PASS, comparison(), DeployedFixes, DeployedFixesInput, recordDeployedFixes(), sameRelease() (+45 more)

### Community 65 - "validate_pr_body.cjs"
Cohesion: 0.36
Nodes (8): fs, main(), readableText(), REQUIRED_CHECKS, REQUIRED_SECTIONS, sections(), validatePullRequestBody(), withoutComments()

### Community 66 - "audit-plan-candidates.cjs"
Cohesion: 0.14
Nodes (31): audit(), branchIssueNumbers(), classify(), distinctiveTitleWords(), { execFileSync }, extractPaths(), findPrForMergeSubject(), fmtCommit() (+23 more)

### Community 67 - "office-client.ts"
Cohesion: 0.14
Nodes (17): RUNNER_DEFAULTS, officeDataRoot, realMachine(), bodyWithin(), bounded(), Envelope, HealthReading, OfficeReader (+9 more)

### Community 68 - "resume-arrivals.ts"
Cohesion: 0.13
Nodes (56): restartStoppedWriters(), unchangedSinceAccepted(), DeliveryAuthorityInput, canonical(), CheckpointEligibility, checkpointEligibility(), admitAssignmentResume(), forAssignment() (+48 more)

### Community 69 - "ref_node_crypto"
Cohesion: 0.08
Nodes (39): ghLogCacheEvidence(), packedConsumerPnpmRepair(), sha256(), attachmentKind(), evidenceDirectory(), readEvidence(), storeEvidence(), blankEvidence() (+31 more)

### Community 70 - "constellation-runtime.ts"
Cohesion: 0.07
Nodes (35): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), CameraPose, flightPose(), cameraTarget() (+27 more)

### Community 71 - "agents.ts"
Cohesion: 0.04
Nodes (59): implementationWorkerContext(), cecReconcilePrompt(), cecTransitionPrompt(), RefusedQAResult, savedStageCompletion(), assertContinuableWorktree(), CONTINUABLE, continuationPrompt() (+51 more)

### Community 72 - "session-context-file.ts"
Cohesion: 0.21
Nodes (14): ContextFoldPrefix, contextFoldPrefix(), SessionContextCheckpoint, captureSessionContextClone(), ContextReadPhase, SessionContextDeadline, sessionContextFile(), ContextReadChanged (+6 more)

### Community 73 - "knowledge/routes.ts"
Cohesion: 0.10
Nodes (27): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, CommittedBrain (+19 more)

### Community 74 - "session-scope.ts"
Cohesion: 0.20
Nodes (16): Bound, claudeScopeParser(), claudeSessionScope(), CODEX_ROLLOUTS, contextReaders(), retainSessionMessage(), SessionConversation, escaped() (+8 more)

### Community 75 - "service-health.ts"
Cohesion: 0.14
Nodes (18): ClaudeLoginRefusal, claudeLoginRefusal(), claudeRefusalWords(), RECORDED_REFUSALS, refusedClaudeRow(), listenerHealth(), ProviderStatusChecks, claudeSignedOut() (+10 more)

### Community 76 - "jiraBinding"
Cohesion: 0.07
Nodes (58): az(), AzureMonitor, buildUrl(), correlatedBuild(), prUrl(), readInPairs(), interruptedImplementation(), ProviderPR (+50 more)

### Community 77 - "requests.ts"
Cohesion: 0.07
Nodes (56): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+48 more)

### Community 78 - "incidents.ts"
Cohesion: 0.08
Nodes (52): attributedRecords(), foldsItsRun(), groupCandidates(), ObservedIncident, ObservedSubject, digest(), fingerprint(), incidentId() (+44 more)

### Community 79 - "runner-state.ts"
Cohesion: 0.13
Nodes (21): IncidentRow, at, EMPTY_STATE, IncidentSample, IncidentSummary, InFlight, Intent, JournalIntent (+13 more)

### Community 80 - "session-bridge.ts"
Cohesion: 0.13
Nodes (22): codexDaemonProcesses(), accountCodexProcesses(), CodexProcessInventory, codexProcessInventory(), DesktopSessions, unaccountedProcesses(), codexThreadMetadata(), METADATA_CHUNK (+14 more)

### Community 81 - "Coordinator"
Cohesion: 0.09
Nodes (3): withGitHubSource(), coordination(), Coordinator

### Community 82 - "api-routes.ts"
Cohesion: 0.25
Nodes (10): goalHistory(), apiRoute(), fileResponse(), jsonText(), serviceBusy(), referencedQAArtifact(), refreshUntilComplete(), refreshWithin() (+2 more)

### Community 83 - "brain-maintenance.ts"
Cohesion: 0.14
Nodes (19): completeNativeCheckpoint(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, brainResultStop(), GateMark, gateMark(), MAX_START_RETRIES (+11 more)

### Community 84 - "viewer.js"
Cohesion: 0.19
Nodes (25): addMetaLink(), addMetaRow(), addRelationship(), applyView(), buildIndexes(), buildLegend(), buildModel(), buildRenderer() (+17 more)

### Community 85 - "weekly-rollup.ts"
Cohesion: 0.13
Nodes (27): learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), RollupResult (+19 more)

### Community 86 - "stopped-record.ts"
Cohesion: 0.08
Nodes (53): REFUSED_RECEIPT, capabilityBlockedReviews(), latestReviews(), boundedEvidence(), expectedWait(), StopFacts, normalizeCause(), IncidentCollector (+45 more)

### Community 87 - "sanitize"
Cohesion: 0.04
Nodes (71): awaitingJiraStatus(), awaitingProduction(), FOLLOW_DAYS, followed(), isFollowed(), Azure, AzureRead, containedIn() (+63 more)

### Community 88 - "notifications.ts"
Cohesion: 0.16
Nodes (16): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR (+8 more)

### Community 89 - "spawn-command.ts"
Cohesion: 0.16
Nodes (20): inactivityWatch(), At, Errno, errno(), GroupInventory, GroupProbe, Phase, Pid (+12 more)

### Community 90 - "github-workflows.ts"
Cohesion: 0.16
Nodes (20): Azure, azurePipelines(), outcome(), Read, RUNS_PER_PIPELINE, Api, outcome(), run() (+12 more)

### Community 91 - "StageResult"
Cohesion: 0.08
Nodes (39): carriedNotRepeated(), changeScopeNote(), Scoped, CommentPage, commentReadback(), devUpdate(), HEADLINE, JiraOperations (+31 more)

### Community 92 - "session-context-client.ts"
Cohesion: 0.11
Nodes (21): claudeSessionContext(), readTranscript, codexSessionContext(), readRollout, packContextFailure(), PackedContextFailure, unpackContextFailure(), LiveSession (+13 more)

### Community 93 - "plans.cjs"
Cohesion: 0.19
Nodes (19): walk(), association(), auditedDigests(), candidate(), cleanCursor(), collapseByTitle(), discover(), fromMarkdown() (+11 more)

### Community 94 - "timed-statements.ts"
Cohesion: 0.18
Nodes (14): StoreTiming, StoreTimings, storeTimings(), NAMED, rowsText(), rowText(), SQL_TOKEN, statementName() (+6 more)

### Community 96 - "control-store.ts"
Cohesion: 0.29
Nodes (5): applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, statementCache()

### Community 97 - "deploy.ts"
Cohesion: 0.12
Nodes (33): abandon(), advance(), DeployContext, DeployTimings, ROLLED_BACK, bootout(), bootstrap(), Execute (+25 more)

### Community 98 - "ticket-stage-runner.ts"
Cohesion: 0.07
Nodes (65): candidateBranchMoved(), applyChangeScope(), endChangeScope(), levels(), MAX_CHECKS, owedUnderScope(), scopeBase(), scopeOutgrown() (+57 more)

### Community 99 - "archive-plan.cjs"
Cohesion: 0.13
Nodes (29): fs, main(), parse(), path, archive(), cell(), ensureIndex(), fs (+21 more)

### Community 100 - "call-outcome.ts"
Cohesion: 0.17
Nodes (15): githubAuthError(), refusedByRateLimit(), revalidated, slurpedPages(), succeeded(), endpoint(), GitHubCall, githubCall() (+7 more)

### Community 101 - "owner-merged-stopped.ts"
Cohesion: 0.17
Nodes (19): mergedByOwner(), closeableIssue(), effectsSettled(), eligible(), officePublished(), ownerMerged(), prerequisitesMet(), settle() (+11 more)

### Community 102 - "harness-action.ts"
Cohesion: 0.32
Nodes (10): applyHarnessAction(), HarnessActionInput, harnessQuestion(), recoveryPreconditions(), recoveryTarget(), canReleaseOrdinary(), offerOrdinaryRelease(), QuestionOwnership (+2 more)

### Community 103 - "on-merge-sync.cjs"
Cohesion: 0.19
Nodes (22): fieldSpan(), keyPattern(), list(), parseListLiteral(), quote(), render(), scalar(), splitFrontmatter() (+14 more)

### Community 104 - "backup-stores.ts"
Cohesion: 0.09
Nodes (38): absentAdmission(), AdmissionComparison, AdmissionSnapshot, compareAdmissions(), snapshotAdmissions(), BackupEntry, BackupInput, BackupInventory (+30 more)

### Community 105 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 106 - "deploy-plan.ts"
Cohesion: 0.10
Nodes (42): releaseIdentity(), ActiveRelease, readActiveRelease(), BUILD_ENV, buildRelease(), BuildReleaseOptions, Execute, pinnedVersions() (+34 more)

### Community 107 - "assignment-poll.ts"
Cohesion: 0.07
Nodes (35): initialManualStart(), recordCandidateCleanup(), assertMayMutate(), NOT_LANDED_SETTLE_MS, confirmedGone(), goneQuery(), STOPPED, stoppedReviewKeys() (+27 more)

### Community 108 - "json"
Cohesion: 0.15
Nodes (17): incidentsRoute(), resumeSwitch(), respond(), server, assertToken(), DeploymentFence, declaredWithin(), deploymentFenceGate() (+9 more)

### Community 109 - "discovery-recovery.ts"
Cohesion: 0.27
Nodes (10): Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership, rawHash() (+2 more)

### Community 110 - "blocker-followups.ts"
Cohesion: 0.10
Nodes (50): conversationReadbackReady(), followupOf(), pendingReadback(), queueConversationReadback(), readbackEnding(), uncertainConversations(), conversationResolved(), readBackConversations() (+42 more)

### Community 111 - "report.ts"
Cohesion: 0.24
Nodes (14): telemetryRoute(), Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked() (+6 more)

### Community 112 - "outbox.ts"
Cohesion: 0.16
Nodes (18): metadataParkAction(), ADOPTION_STALLED_MS, projectOutbox(), item(), syncOutbox(), sameOwnerSteps(), finishSupersededReadback(), projectSlackDeliveries() (+10 more)

### Community 113 - "work.ts"
Cohesion: 0.07
Nodes (37): admitRepairWaits(), Covered, COVERING, expiryEvent(), expiryId(), lastProgress(), progressOf(), RepairWaitEntry (+29 more)

### Community 114 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 115 - "run-accounting.ts"
Cohesion: 0.06
Nodes (63): readBoundedNoFollow(), add(), CodexRequest, CodexRollout, CodexTokens, FIELDS, codexHome(), createdAt() (+55 more)

### Community 119 - "restart-writer.ts"
Cohesion: 0.31
Nodes (8): ATTEMPT_DELAYS_MS, nextAttemptAt(), NOT_RETRYABLE, releaseFunds(), StoppedWriter, WRITER_STAGES, WriterRestartCandidate, writerRestartCandidate()

### Community 120 - "features/routes.ts"
Cohesion: 0.14
Nodes (8): approveFeature(), mutation(), Link, linkFeature(), FeatureReviewRunner, featureRoute(), FeatureWorkflow, WorkerRuntime

### Community 121 - "release-unpark.ts"
Cohesion: 0.33
Nodes (8): due(), MAX_RELEASE_UNPARKS, RELEASE_CHECK_MS, returnToPickup(), unparkReleasedWaits(), compare(), highestStableAtLeast(), parts()

### Community 122 - "connectWith"
Cohesion: 0.38
Nodes (5): connectWith(), data(), envelope(), JiraWorklogs, WorklogSave

### Community 123 - "deploy-command.ts"
Cohesion: 0.08
Nodes (58): CONTROLLER_ENTRY, ControllerPin, Pin, pinnedController(), readControllerPin(), writeControllerPin(), controllerOf(), deployCommand() (+50 more)

### Community 124 - "refresh-issue-state.cjs"
Cohesion: 0.20
Nodes (19): advanceFence(), closingIssues(), githubRefs(), key(), normalizeGithubQuery(), normalizeRepository(), parseGithubQuery(), ref() (+11 more)

### Community 125 - "knowledge.ts"
Cohesion: 0.08
Nodes (32): curateLesson(), Curation, CurationAction, mergeEvidence(), Kind, RetrospectiveResultSchema, RollupResultSchema, Stage (+24 more)

### Community 126 - "delivery-repairs.ts"
Cohesion: 0.11
Nodes (38): removeAdoptedClone(), namedRepairIds(), pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), stoppedBaseCheckout(), assertStoppedBaseApproach(), stoppedBaseNextStage(), discussion() (+30 more)

### Community 127 - "accessibility-sources.ts"
Cohesion: 0.26
Nodes (16): actionable(), closingPull(), Finding, handoffIssue(), issueLines(), issueSource(), observation, reconcileSourceEffects() (+8 more)

### Community 128 - "single-flight.ts"
Cohesion: 0.33
Nodes (8): ensurePrivateDirectory(), acquirePassLock(), Owner, PassLock, PassOwner, PassRefused, readPassOwner(), same()

### Community 129 - "call-ledger.ts"
Cohesion: 0.25
Nodes (10): add(), addSource(), busiest(), CallLedger, Entry, sourceRows(), Sources, CallCounts (+2 more)

### Community 130 - "pre-push-boundary.ts"
Cohesion: 0.27
Nodes (10): Event, exactCommand(), Invocation, localHookCommand(), one(), prePushRejection(), PushIdentity, retirementBoundary() (+2 more)

### Community 131 - "it-specialist.ts"
Cohesion: 0.17
Nodes (20): replacedReadback(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), heldFor(), ITContext, recoveryHeld() (+12 more)

### Community 132 - "diagnostic-snapshot.ts"
Cohesion: 0.30
Nodes (8): diagnosticSnapshot(), followUpPicture(), publishITReport(), nativeDeliveryResolved(), itAgent(), itDiagnostics(), followUpStatus(), outstandingFollowUps()

### Community 133 - "session-coverage.ts"
Cohesion: 0.43
Nodes (6): claudeSessions(), completeSessionCoverage(), desktopCoverageGap(), knownActivity(), Report, unexplained()

### Community 134 - "follow-up-alerts.ts"
Cohesion: 0.23
Nodes (12): checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), repeatedVendorReviewBlock(), stoppedInVendorReview(), leftToNextRun(), NEXT_RUN_DUE_MS, night() (+4 more)

### Community 135 - "release-floor.ts"
Cohesion: 0.33
Nodes (6): AS_COMMITTED, Execute, FloorReading, message(), readReleaseFloor(), RELEASE_FLOOR

### Community 136 - "task-briefing.ts"
Cohesion: 0.15
Nodes (17): LessonBrainAudit, LessonBrainOverlap, citations(), recordAcceptedKnowledge(), stageName(), knowledgeCitation(), lessonCitation(), boundEvidence() (+9 more)

### Community 137 - "lesson-issue-ready.ts"
Cohesion: 0.13
Nodes (17): GitHubOperations, assignedToJoe(), fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), firstLane(), instruction(), LaneMove (+9 more)

### Community 138 - "run.ts"
Cohesion: 0.14
Nodes (20): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationEvidence(), INVOCATION_SOURCE_REFS, OFFICE_FIX_PROMPT, OfficeFixResult, validateOfficeFix(), OFFICE_SOURCE_PATHS (+12 more)

### Community 139 - "cto-replacement-resolution.ts"
Cohesion: 0.60
Nodes (3): ctoInputIdentityMatches(), ctoInputRecovered(), ctoReplacementResolution()

### Community 140 - "session-snapshot-cleanup.ts"
Cohesion: 0.40
Nodes (5): SNAPSHOT_PREFIX, removeStaleSessionSnapshots(), SNAPSHOT_SWEEP_MS, STALE_SNAPSHOT_MS, sweepStaleSessionSnapshots()

### Community 142 - "Store"
Cohesion: 0.07
Nodes (35): featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), reserveReplacement(), stageBudget(), wakeFeature(), recoverFeatures(), observeHelperGroups() (+27 more)

### Community 144 - "reconcile-merges.cjs"
Cohesion: 0.21
Nodes (15): remoteSlug(), collectPulls(), copyWikiForDryRun(), { execFileSync }, flattenPages(), fs, githubRequest(), isWikiBotPull() (+7 more)

### Community 145 - "preferences-store.ts"
Cohesion: 0.19
Nodes (9): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS (+1 more)

### Community 146 - "rootArtifact"
Cohesion: 0.09
Nodes (53): assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), reconcileCompletedConflictDraft(), routeReadyPostConflictPublication(), verifyInitialDraftConflictPreparation() (+45 more)

### Community 147 - "inventory-startup-wait.ts"
Cohesion: 0.40
Nodes (5): ALWAYS, HEADED, inventoryStartupWait(), readsInventory(), STARTUP_WAIT_REASON

### Community 148 - "runner-root.ts"
Cohesion: 0.22
Nodes (16): DEFAULT_OFFICE_URL, LOOPBACK, officeUrl(), privateDirectories(), RunnerPaths, runnerPaths(), ancestry(), assertDirectoryOrAbsent() (+8 more)

### Community 149 - "harnessEffect"
Cohesion: 0.12
Nodes (45): BLOCK, harnessBlockMove(), harnessParkedCard(), noted(), effectKey(), LaneOperation, laneWrite(), moveCardOnce() (+37 more)

### Community 150 - "repoRoot"
Cohesion: 0.13
Nodes (18): fs, main(), parse(), path, repoRoot(), substantive(), main(), path (+10 more)

### Community 151 - "Conversation.tsx"
Cohesion: 0.07
Nodes (47): ChatMarkdown(), Conversation(), send(), ConversationDraft, createConversationDrafts(), SendMessage, isLessonDecision(), ChatMarkdown (+39 more)

### Community 152 - "ITFollowUps.tsx"
Cohesion: 0.67
Nodes (4): itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps()

### Community 153 - "daily-cto.ts"
Cohesion: 0.11
Nodes (24): currentCitations(), Fact, NOT_CURRENT, PROVIDER_ERROR, evidenceRequestConflicts, dailyReviewPrompt(), applyGoalReview(), DailyResultSchema (+16 more)

### Community 154 - "resume-outcome.ts"
Cohesion: 0.09
Nodes (31): Admission, FLAGS, incidentCommand(), IncidentCommandIO, option(), USAGE, whole(), boundaryCrossed() (+23 more)

### Community 155 - "recorded-gh-command.ts"
Cohesion: 0.19
Nodes (20): assignments(), changeDirectory(), closing(), CREATE, createGuard(), flags(), named(), read() (+12 more)

### Community 156 - "salvage-worktree.ts"
Cohesion: 0.48
Nodes (6): Execute, keptWork(), Read, refObject(), SalvageRetry, salvageWorktree()

### Community 157 - "exit-failure.ts"
Cohesion: 0.60
Nodes (3): exitFailure(), MONTHS, providerLimit()

### Community 163 - "restoreInPlace"
Cohesion: 0.60
Nodes (5): identity(), Json, plain(), restorable(), restoreInPlace()

### Community 167 - "validate-stage.ts"
Cohesion: 0.15
Nodes (18): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+10 more)

### Community 169 - "operationPaths"
Cohesion: 0.24
Nodes (14): Body, DeploymentFenceState, fenceTokenDigest(), ControllerEffects, DEPLOY_PROJECT, operationPaths(), createDeployToken(), readDeployToken() (+6 more)

### Community 172 - "mutedCopy"
Cohesion: 0.09
Nodes (43): LessonDecisionAction, lessonDecisionState(), readLessonDecision(), OutboxLessonDecision(), act(), readStatus(), OutboxLessonDigest(), labels (+35 more)

### Community 173 - "normalize-question.ts"
Cohesion: 0.27
Nodes (10): normalizeRound(), FeatureHarnessOption, FeatureOption, FeatureQuestion, FeatureRoundAuthor, folded(), normalizeQuestion(), optionId() (+2 more)

### Community 174 - "delivery-ownership.ts"
Cohesion: 0.33
Nodes (4): Ownership, ownershipContext, refreshDeliveryOwnership(), RefreshOwnership

### Community 176 - "unblock-brief.ts"
Cohesion: 0.53
Nodes (5): clearUnblockBrief(), key(), saveUnblockBrief(), UnblockBrief, unblockBrief()

## Knowledge Gaps
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `worker-runtime.ts`, `features.ts`, `workKey`, `GitHubIssuePublisher`, `office/config.ts`, `admit-improvement.ts`, `advance-metadata-park.ts`, `scheduled-captures.ts`, `run-retrospective.ts`, `record-trigger.ts`, `sign-in-unpark.ts`, `github-delivery.ts`, `artifact`, `.emit`, `retrospective-subject.ts`, `jira-time.ts`, `holdReason`, `OfficeSnapshot`, `controller-runtime.ts`, `fact-bounds.ts`, `github-context.ts`, `shared.ts`, `digest`, `route-head.ts`, `pilot-delivery.ts`, `scheduled-work.ts`, `redact-evidence.ts`, `assignments.ts`, `observe-github-merges.ts`, `time-scope.ts`, `engine.ts`, `.save`, `Offices`, `lesson-selection.ts`, `cec.ts`, `http/commands.ts`, `ledger.ts`, `ref_zod`, `ref_node_sqlite`, `JiraIssuePublisher`, `intent.ts`, `jira-attempts.ts`, `cost-ledger.ts`, `time-ledger.ts`, `maintenance/maintenance.ts`, `judge-resumes.ts`, `resume-arrivals.ts`, `ref_node_crypto`, `agents.ts`, `knowledge/routes.ts`, `jiraBinding`, `requests.ts`, `session-bridge.ts`, `brain-maintenance.ts`, `weekly-rollup.ts`, `sanitize`, `notifications.ts`, `github-workflows.ts`, `StageResult`, `control-store.ts`, `ticket-stage-runner.ts`, `owner-merged-stopped.ts`, `harness-action.ts`, `assignment-poll.ts`, `discovery-recovery.ts`, `blocker-followups.ts`, `report.ts`, `outbox.ts`, `work.ts`, `run-accounting.ts`, `restart-writer.ts`, `features/routes.ts`, `release-unpark.ts`, `delivery-repairs.ts`, `accessibility-sources.ts`, `it-specialist.ts`, `diagnostic-snapshot.ts`, `task-briefing.ts`, `lesson-issue-ready.ts`, `run.ts`, `cto-replacement-resolution.ts`, `ProjectProgress`, `rootArtifact`, `inventory-startup-wait.ts`, `harnessEffect`, `daily-cto.ts`, `validate-stage.ts`, `operationPaths`?**
  _High betweenness centrality (0.099) - this node is a cross-community bridge._
- **Should `incidents/routes.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.050940438871473356 - nodes in this community are weakly interconnected._
- **Why does `command()` connect `shared.ts` to `incidents/routes.ts`, `worker-runtime.ts`, `features.ts`, `workKey`, `release-floor.ts`, `GitHubIssuePublisher`, `lesson-issue-ready.ts`, `office/config.ts`, `ProjectProgress`, `Store`, `admit-improvement.ts`, `github-delivery.ts`, `harnessEffect`, `jira-time.ts`, `holdReason`, `controller-runtime.ts`, `salvage-worktree.ts`, `digest`, `pilot-delivery.ts`, `CommandRegistry`, `validate-stage.ts`, `engine.ts`, `.save`, `Offices`, `ref_zod`, `JiraIssuePublisher`, `intent.ts`, `jira-attempts.ts`, `cost-ledger.ts`, `time-ledger.ts`, `maintenance/maintenance.ts`, `judge-resumes.ts`, `ref_node_crypto`, `agents.ts`, `knowledge/routes.ts`, `service-health.ts`, `jiraBinding`, `requests.ts`, `session-bridge.ts`, `brain-maintenance.ts`, `weekly-rollup.ts`, `notifications.ts`, `StageResult`, `deploy.ts`, `ticket-stage-runner.ts`, `deploy-plan.ts`, `assignment-poll.ts`, `features/routes.ts`, `connectWith`, `deploy-command.ts`, `delivery-repairs.ts`, `accessibility-sources.ts`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Should `OrgChart.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1072463768115942 - nodes in this community are weakly interconnected._
- **Why does `workKey()` connect `workKey` to `features.ts`, `diagnostic-snapshot.ts`, `lesson-issue-ready.ts`, `run.ts`, `Store`, `rootArtifact`, `github-delivery.ts`, `artifact`, `.emit`, `harnessEffect`, `holdReason`, `github-context.ts`, `shared.ts`, `digest`, `route-head.ts`, `pilot-delivery.ts`, `scheduled-work.ts`, `agents.ts`, `requests.ts`, `stopped-record.ts`, `owner-merged-stopped.ts`, `assignment-poll.ts`, `discovery-recovery.ts`, `work.ts`, `restart-writer.ts`, `delivery-repairs.ts`, `accessibility-sources.ts`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Should `worker-runtime.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06346153846153846 - nodes in this community are weakly interconnected._
- **Should `features.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0590751136059877 - nodes in this community are weakly interconnected._