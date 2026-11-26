# Graph Report - the-office  (2026-11-26)

## Corpus Check
- 1263 files · ~542,147 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 6638 nodes · 28914 edges · 184 communities (174 shown, 10 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 1033 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ddc18dc1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- incidents/routes.ts
- OrgChart.tsx
- worker-runtime.ts
- features/workflow.ts
- cx
- ControlStore
- budget-ledger.ts
- index.tsx
- work-summary.ts
- TelemetryPanel.tsx
- ref_node_crypto
- overseer/commands.ts
- App.tsx
- admit-improvement.ts
- advance-metadata-park.ts
- scheduled-captures.ts
- run-retrospective.ts
- record-trigger.ts
- setup-stop-cap.ts
- github-delivery.ts
- artifact
- dependency-bots/adopt.ts
- retrospective-subject.ts
- jira-time.ts
- holdReason
- OfficeSnapshot
- controller-runtime.ts
- fact-bounds.ts
- draft-provenance.ts
- Store
- digest
- ref_node_path
- index.ts
- coordination.ts
- rate-limit-samples.ts
- common.cjs
- scheduled-work.ts
- routing.cjs
- redact-evidence.ts
- assignments.ts
- observe-github-merges.ts
- time-scope.ts
- pilot-delivery.ts
- jiraBinding
- Offices
- harness-baseline.ts
- OfficeScene.tsx
- lesson-selection.ts
- cec.ts
- .emit
- FeatureWorkspace.tsx
- ledger.ts
- projects.ts
- sanitizeObject
- cec/issue-publication.ts
- ref_node_child_process
- run-accounting.ts
- pass.ts
- copy.ts
- jira-attempts.ts
- cost-ledger.ts
- unsent-time.ts
- accessibility-sources.ts
- ref_react
- judge-resumes.ts
- validate_pr_body.cjs
- audit-plan-candidates.cjs
- office-client.ts
- resume-arrivals.ts
- ticket-evidence.ts
- constellation-runtime.ts
- agents.ts
- session-context-file.ts
- knowledge/routes.ts
- session-scope.ts
- service-health.ts
- project-bindings.ts
- closeout-recovery.ts
- incidents.ts
- prompts/conversations.ts
- session-bridge.ts
- Coordinator
- api-routes.ts
- project-bindings-config.ts
- viewer.js
- weekly-rollup.ts
- stopped-record.ts
- conversations/conversations.ts
- notifications.ts
- spawn-command.ts
- github-workflows.ts
- readable-jira-comment.ts
- session-context-client.ts
- plans.cjs
- timed-statements.ts
- capture-session-clone.py
- carried-checks.ts
- deploy.ts
- ticket-stage-runner.ts
- archive-plan.cjs
- call-outcome.ts
- workKey
- ref_zod
- on-merge-sync.cjs
- backup-stores.ts
- extract-worker.mjs
- deploy-plan.ts
- assignment-poll.ts
- office-config.ts
- StageResult
- blocker-followups.ts
- report.ts
- outbox.ts
- work.ts
- slack-supersession.ts
- telemetry.ts
- qa.ts
- qa-plan-continuation.ts
- writer-restart.ts
- alert-issue.ts
- conversations/slack.ts
- intent.ts
- connectWith
- deploy-command.ts
- refresh-issue-state.cjs
- knowledge.ts
- shared.ts
- sign-in-unpark.ts
- sanitize
- call-ledger.ts
- pre-push-boundary.ts
- it-specialist.ts
- ITFollowUps.tsx
- session-coverage.ts
- metadata-park-words.ts
- continue-ownership-read.ts
- Role
- Effects
- run.ts
- Goals
- session-snapshot-cleanup.ts
- ProjectProgress
- offices.ts
- production.ts
- reconcile-merges.cjs
- preferences-store.ts
- requests.ts
- goal-evidence.ts
- runner-root.ts
- project-graphql.ts
- serve-graph.cjs
- Conversation.tsx
- node-visuals.ts
- daily-cto.ts
- Ticket
- recorded-gh-command.ts
- scene-motion.ts
- provider-limit-resolution.ts
- it-report.ts
- routing.js
- interrupted-work-recovery.ts
- InFlightOperations
- command-registry.ts
- continue-access-only-plan.ts
- admit-repair-waits.ts
- RoomCamera.tsx
- dates.cjs
- validate-stage.ts
- useOfficePreferences.ts
- operationPaths
- tracking-issue.ts
- call-scope.ts
- intake-enumeration.ts
- read-retries.ts
- delivery-ownership.ts
- context-failure-transport.ts
- validate_wiki_pr_body.cjs
- QuestionNotifications
- endpoint-family.ts
- wait-idle.ts
- JiraWorklogTransport
- office-qa-handoff.ts
- closed-readonly-plan.ts
- qa-plan-retry.ts

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
- `SettleInputs` --references--> `AssignedIssue`  [EXTRACTED]
  server/delivery/intake/settle-stopped-reviews.ts → src/shared.ts

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

## Communities (184 total, 10 thin omitted)

### Community 0 - "incidents/routes.ts"
Cohesion: 0.05
Nodes (88): citationFault(), CitationSchema, SourceVersions, sourceVersions(), inHistoryOf(), CompareMemory, compareMemory(), COMPARES_PER_PASS (+80 more)

### Community 1 - "OrgChart.tsx"
Cohesion: 0.10
Nodes (41): label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+33 more)

### Community 2 - "worker-runtime.ts"
Cohesion: 0.06
Nodes (43): itChatPrompt(), candidateWorkspaceEnvironment(), assignmentDiagnostics(), diagnosticContext(), assignmentSubject(), lessonPurpose(), selectLessons(), catalogLine() (+35 more)

### Community 3 - "features/workflow.ts"
Cohesion: 0.08
Nodes (54): approveFeature(), featureById(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), discoveryPrompt(), planPrompt() (+46 more)

### Community 4 - "cx"
Cohesion: 0.09
Nodes (81): Outbox(), blockedSummary(), ServiceHealthPanel(), followUp(), labels, ServiceHealthRow(), BlockerFollowups(), LearningCoverage() (+73 more)

### Community 5 - "ControlStore"
Cohesion: 0.14
Nodes (11): DailyCTO, EvidenceRequestConflict, reviewWeekday(), queueGoalEvidenceRequest(), Briefing, saveReviewBriefing(), SeenReports, WAITING (+3 more)

### Community 6 - "budget-ledger.ts"
Cohesion: 0.06
Nodes (59): abandonExpired(), Admission, admit(), admitDeployment(), balance(), bindEvidence(), count(), errcode() (+51 more)

### Community 7 - "index.tsx"
Cohesion: 0.12
Nodes (42): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView() (+34 more)

### Community 8 - "work-summary.ts"
Cohesion: 0.09
Nodes (43): compactSteps(), envelopeCard, deliveryRepairProjection(), DependencyNotice(), ACTIVE, maintenanceUpdate(), MergeApproval(), PMQueueItem (+35 more)

### Community 9 - "TelemetryPanel.tsx"
Cohesion: 0.09
Nodes (44): TelemetryReport, displayAgentTask(), LiveAgentTask(), Props, RunningTask(), text(), Agent, AzureBuild (+36 more)

### Community 10 - "ref_node_crypto"
Cohesion: 0.06
Nodes (74): packedConsumerPnpmRepair(), sha256(), commandFeature(), reviewQuestions(), readEvidence(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS (+66 more)

### Community 11 - "overseer/commands.ts"
Cohesion: 0.17
Nodes (22): guardPresent(), overseerCommand(), reconcileArgs(), resolveCliRoot(), runnerStatus(), bounded(), ControlRead, Halt (+14 more)

### Community 12 - "App.tsx"
Cohesion: 0.06
Nodes (50): BrainDrawer(), themeColor, App(), BrainWorkspace, CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants (+42 more)

### Community 13 - "admit-improvement.ts"
Cohesion: 0.15
Nodes (21): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementIntakeGate(), improvementManifest() (+13 more)

### Community 14 - "advance-metadata-park.ts"
Cohesion: 0.10
Nodes (61): advanceMetadataPark(), Parked, releaseWords(), sentAnything(), cardResumeRoute(), effectiveParkPickup(), PICKUP_ASSIGNEE, REVIEWABLE (+53 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.15
Nodes (48): createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), CaptureRequest, captureRequest() (+40 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.08
Nodes (46): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, BlockingTrigger, blockingTrigger(), BrainOverlap (+38 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.10
Nodes (41): isBlocking(), baselined(), baselineLearning(), LEARNING_BASELINES, maintainLearning(), busyMaintenanceIds(), clip(), maintenanceBlockedId() (+33 more)

### Community 18 - "setup-stop-cap.ts"
Cohesion: 0.09
Nodes (32): readbackDispatchGuidance(), currentEnvironmentWait(), waitText(), capacityInterruptedRun(), providerSaid(), rerunsInterruptedQA(), officeRefusedQA(), QA_STAGES (+24 more)

### Community 19 - "github-delivery.ts"
Cohesion: 0.04
Nodes (99): writerRestartInstruction(), findingsBlock(), BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction(), dependabotReviewGuidance(), discover() (+91 more)

### Community 20 - "artifact"
Cohesion: 0.05
Nodes (110): containedFile(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal (+102 more)

### Community 21 - "dependency-bots/adopt.ts"
Cohesion: 0.12
Nodes (32): Execute, adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DependabotPR, dependabotPR(), inPickupLane() (+24 more)

### Community 22 - "retrospective-subject.ts"
Cohesion: 0.13
Nodes (20): deliveryMetrics(), median(), ARTIFACT_LIMIT, clip(), LEDGER_STEPS, MAINTENANCE_LIMIT, maintenanceFacts(), maintenanceSubject() (+12 more)

### Community 23 - "jira-time.ts"
Cohesion: 0.13
Nodes (34): unresolvedAttempts(), bindingOf(), finishVerifiedEffects(), locks, matches(), publishJiraTime(), readBack(), readBackEntry() (+26 more)

### Community 24 - "holdReason"
Cohesion: 0.06
Nodes (80): continueUnsealedQA(), entry(), qaPlanEvidenceGap(), qaRunDirectory(), ATTEMPT_DELAYS_MS, nextAttemptAt(), NOT_RETRYABLE, releaseFunds() (+72 more)

### Community 25 - "OfficeSnapshot"
Cohesion: 0.07
Nodes (47): knowledgeOutbox(), LessonDecisionAction, lessonDecisionState(), readLessonDecision(), DAYS, dueLessonDecisions(), easternWeek(), LESSON_DIGEST (+39 more)

### Community 26 - "controller-runtime.ts"
Cohesion: 0.07
Nodes (33): [cmd,...rawArgs], file, project, root, projectData(), StoreDatabase, ControllerEffects, controllerEffects() (+25 more)

### Community 27 - "fact-bounds.ts"
Cohesion: 0.25
Nodes (15): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+7 more)

### Community 28 - "draft-provenance.ts"
Cohesion: 0.20
Nodes (18): maintenanceVerifiedDraft(), returnDraftToPromotion(), DraftProvenance, draftStep(), draftWorker(), MaintenanceDraft, maintenanceDraftProvenance(), nativeBash() (+10 more)

### Community 29 - "Store"
Cohesion: 0.04
Nodes (39): featureItemComplete(), reconcileFeatureCompletion(), GitHubFeaturePublisher, helperTelemetry(), JiraFeaturePublisher, ResumeProject, dispatchExposure(), Result (+31 more)

### Community 30 - "digest"
Cohesion: 0.08
Nodes (72): ownershipReadHistory(), runHarnessStage(), Binding, historyBeforeWrite(), matchesBoundDescription(), DescriptionEdit, DescriptionHistory, DescriptionHistoryUnavailable (+64 more)

### Community 31 - "ref_node_path"
Cohesion: 0.05
Nodes (75): interruptedImplementation(), MISSING_SAVED_PLAN, writerRestartPending(), removeAdoptedClone(), DeliveryAuthorityInput, pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), assertStoppedBaseAudit() (+67 more)

### Community 32 - "index.ts"
Cohesion: 0.06
Nodes (33): close(), config, itSpecialist, loadedRevision, offices, releaseLock, respond(), server (+25 more)

### Community 33 - "coordination.ts"
Cohesion: 0.08
Nodes (43): reconcileNoticeConfirmations(), admit(), IntakeContext, WAIT_STATUSES, compatible(), dependencyCompletionKey(), dependencyEligibility(), issueKey() (+35 more)

### Community 34 - "rate-limit-samples.ts"
Cohesion: 0.16
Nodes (12): CallLedger, bindGitHubRunner(), Runner, GitHubCalls, iso(), RateLimitSamples, Reading, reading() (+4 more)

### Community 35 - "common.cjs"
Cohesion: 0.18
Nodes (22): connections(), fs, main(), path, crypto, ensureInside(), { execFileSync }, fs (+14 more)

### Community 36 - "scheduled-work.ts"
Cohesion: 0.08
Nodes (43): freshOwnershipRead(), deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), withAmendmentOwnership(), metadataRequestResolved(), preparationRequestResolved(), gateFeatureWork() (+35 more)

### Community 37 - "routing.cjs"
Cohesion: 0.14
Nodes (27): main(), parseArgs(), usage(), adjacency(), edgeCost(), edgeKey(), edgeType(), EVIDENCE_TYPE_PRIORITY (+19 more)

### Community 38 - "redact-evidence.ts"
Cohesion: 0.08
Nodes (26): AFTER_LABEL, ASSIGNMENT, AWS_KEY_ID, BARE_CREDENTIAL, BARE_UNIT, BARE_VALUE, CAMEL_START, CONTROL_ESCAPE (+18 more)

### Community 39 - "assignments.ts"
Cohesion: 0.10
Nodes (32): assignmentKnowledge(), KnowledgeContext, digest(), AssignmentLookups, Binding, lookupInstructions(), decodeLookupJournal(), LookupJournal (+24 more)

### Community 40 - "observe-github-merges.ts"
Cohesion: 0.30
Nodes (14): clearCooldown(), coolDown(), coolingDown(), MERGE_NOTICE_RECHECK_MS, waitKey(), waits, isMergeCommit(), issueOf() (+6 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.16
Nodes (24): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), ScopePolicy, scopeSelector(), ticketUnresolved(), midnight(), TicketDay, ticketDayTotals() (+16 more)

### Community 42 - "pilot-delivery.ts"
Cohesion: 0.15
Nodes (30): continueImplementation(), dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), startPilot(), OfficeQAHandoffInput, eligibility() (+22 more)

### Community 43 - "jiraBinding"
Cohesion: 0.11
Nodes (52): resolveBlockedTransition(), document(), transitionWithComment(), jiraAccount(), jiraCollection(), JiraCredential, jiraCredential(), KEYCHAIN_SERVICE (+44 more)

### Community 44 - "Offices"
Cohesion: 0.18
Nodes (4): mirrorOfficeKnowledge(), Offices, claudeSessions(), SessionBridge

### Community 45 - "harness-baseline.ts"
Cohesion: 0.15
Nodes (23): BaselineReport, baselineReport(), BaselineSource, baselineText(), millions(), row(), share(), add() (+15 more)

### Community 46 - "OfficeScene.tsx"
Cohesion: 0.17
Nodes (33): withoutElapsed(), Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk() (+25 more)

### Community 47 - "lesson-selection.ts"
Cohesion: 0.11
Nodes (19): INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, LessonSelection, MAINTENANCE, MAX_LESSONS, normalPath() (+11 more)

### Community 48 - "cec.ts"
Cohesion: 0.09
Nodes (30): movedHeadNote(), cecPrompt(), resolvedDecisionNote(), stageInstructions, stageInstructionsFor(), REVIEW_FINDINGS_RULE, applies(), interruptedRunNote() (+22 more)

### Community 49 - ".emit"
Cohesion: 0.25
Nodes (16): configureChannelNotices(), configureNotices(), recoverCTOInput(), bindDiscoveryResume(), DiscoveryResumeInput, requeueWaitedImplement(), enqueueMetadataRecovery(), configureKnowledge() (+8 more)

### Community 50 - "FeatureWorkspace.tsx"
Cohesion: 0.11
Nodes (28): FeatureQuestionProjection, OutboxQuestionRound(), send(), FeatureDelivery(), FeatureDocuments(), views, FeatureReading(), FeatureWorkspace() (+20 more)

### Community 51 - "ledger.ts"
Cohesion: 0.12
Nodes (24): ctoInputIdentityMatches(), ctoInputRecovered(), failureOutranks(), diagnosticSnapshot(), acceptedCompletionResolution(), investigationCandidates(), investigationId(), ctoReplacementResolution() (+16 more)

### Community 52 - "projects.ts"
Cohesion: 0.11
Nodes (29): escaped(), IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), projectListScope(), AUTO_ADOPT_BOTS, assertFeaturePlanningConfig() (+21 more)

### Community 53 - "sanitizeObject"
Cohesion: 0.12
Nodes (18): sanitizeObject(), readSavedState(), LARGE_KEY_CHARS, plain(), RedactedEntries, RedactedEntry, redactEntries(), joinParts() (+10 more)

### Community 54 - "cec/issue-publication.ts"
Cohesion: 0.08
Nodes (20): Assignment, contentSchema(), JiraIssuePublisher, jiraText(), Transition, descriptionPreimage(), plain(), publicationDescription() (+12 more)

### Community 55 - "ref_node_child_process"
Cohesion: 0.10
Nodes (22): changedPaths(), { execFileSync }, files, isMapInput(), mapOnly(), { execFileSync }, git(), publish() (+14 more)

### Community 56 - "run-accounting.ts"
Cohesion: 0.10
Nodes (36): BoundedRead, done(), readBoundedNoFollow(), reasonOf(), comparable(), EvidenceOutcome, recordRunEvidence(), backfillClaudeCost() (+28 more)

### Community 57 - "pass.ts"
Cohesion: 0.09
Nodes (42): appendFailureLine(), Evidence, FAILURE_ID, FailureEvent, failureLine(), JournalRefused, JournalView, readFailures() (+34 more)

### Community 58 - "copy.ts"
Cohesion: 0.18
Nodes (18): GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles(), ContinuationIO (+10 more)

### Community 59 - "jira-attempts.ts"
Cohesion: 0.12
Nodes (23): attempted(), attemptState(), bound(), covers(), JiraAttempt, jiraAttempts(), JiraAttemptState, open() (+15 more)

### Community 60 - "cost-ledger.ts"
Cohesion: 0.12
Nodes (33): isModelWork(), isTicketModelWork(), captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled() (+25 more)

### Community 61 - "unsent-time.ts"
Cohesion: 0.23
Nodes (10): settlementPending(), superseded(), TimeLedger, clearUnsent(), dueUnsent(), markUnsent(), UNSENT_RETRY_MAX_MS, UNSENT_RETRY_MS (+2 more)

### Community 62 - "accessibility-sources.ts"
Cohesion: 0.05
Nodes (68): maintenancePolicies(), captureMaintenanceStep(), accessibilitySources(), actionable(), closingPull(), Finding, handoffIssue(), issueLines() (+60 more)

### Community 63 - "ref_react"
Cohesion: 0.07
Nodes (59): guidanceExcerpt(), KnowledgeActivity, KnowledgeActivityPage, KnowledgeEdge, KnowledgeMap, KnowledgeNode, Activity(), ActivityTimeline() (+51 more)

### Community 64 - "judge-resumes.ts"
Cohesion: 0.05
Nodes (53): Admission, absent(), IncidentLedger, isOpen(), boundaryCrossed(), Crossing, Progress, CheckpointProgress (+45 more)

### Community 65 - "validate_pr_body.cjs"
Cohesion: 0.36
Nodes (8): fs, main(), readableText(), REQUIRED_CHECKS, REQUIRED_SECTIONS, sections(), validatePullRequestBody(), withoutComments()

### Community 66 - "audit-plan-candidates.cjs"
Cohesion: 0.14
Nodes (31): audit(), branchIssueNumbers(), classify(), distinctiveTitleWords(), { execFileSync }, extractPaths(), findPrForMergeSubject(), fmtCommit() (+23 more)

### Community 67 - "office-client.ts"
Cohesion: 0.10
Nodes (27): DEFAULT_OFFICE_URL, LOOPBACK, officeUrl(), RUNNER_DEFAULTS, RunnerLimits, RunnerPaths, officeDataRoot, realMachine() (+19 more)

### Community 68 - "resume-arrivals.ts"
Cohesion: 0.10
Nodes (70): restartStoppedWriters(), unchangedSinceAccepted(), WRITER_STAGES, Execute, keptWork(), Read, refObject(), SalvageRetry (+62 more)

### Community 69 - "ticket-evidence.ts"
Cohesion: 0.12
Nodes (31): assetDownloader(), attachmentKind(), evidenceDirectory(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS, EvidenceAttachment (+23 more)

### Community 70 - "constellation-runtime.ts"
Cohesion: 0.09
Nodes (21): CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point, ConstellationRuntime, createConstellation() (+13 more)

### Community 71 - "agents.ts"
Cohesion: 0.08
Nodes (33): implementationWorkerContext(), RefusedQAResult, savedStageCompletion(), assertContinuableWorktree(), CONTINUABLE, continuationPrompt(), MAX_CONTINUATIONS, recordedContinuation() (+25 more)

### Community 72 - "session-context-file.ts"
Cohesion: 0.27
Nodes (12): ContextFoldPrefix, contextFoldPrefix(), SessionContextCheckpoint, captureSessionContextClone(), sessionContextFile(), ContextReadChanged, MAX_CONTEXT_READ_MS, sameContextFile() (+4 more)

### Community 73 - "knowledge/routes.ts"
Cohesion: 0.10
Nodes (20): knowledgeActivity(), knowledgeActivityPage(), committedNotePage(), BrainGraph, BrainNote, BrainReader, CommittedBrain, GraphNode (+12 more)

### Community 74 - "session-scope.ts"
Cohesion: 0.18
Nodes (17): Bound, claudeScopeParser(), claudeSessionScope(), CLAUDE_TRANSCRIPTS, CODEX_ROLLOUTS, contextReaders(), retainSessionMessage(), SessionConversation (+9 more)

### Community 75 - "service-health.ts"
Cohesion: 0.11
Nodes (23): ClaudeLoginRefusal, claudeLoginRefusal(), claudeRefusalWords(), RECORDED_REFUSALS, refusedClaudeRow(), listenerHealth(), PROJECT_BINDINGS, providers (+15 more)

### Community 76 - "project-bindings.ts"
Cohesion: 0.10
Nodes (37): az(), AzureMonitor, buildUrl(), correlatedBuild(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+29 more)

### Community 77 - "closeout-recovery.ts"
Cohesion: 0.13
Nodes (37): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+29 more)

### Community 78 - "incidents.ts"
Cohesion: 0.07
Nodes (58): attributedRecords(), foldsItsRun(), groupCandidates(), ObservedIncident, ObservedSubject, digest(), fingerprint(), incidentId() (+50 more)

### Community 79 - "prompts/conversations.ts"
Cohesion: 0.12
Nodes (24): intakeMembership(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), plainResume(), Receipt, Settled (+16 more)

### Community 80 - "session-bridge.ts"
Cohesion: 0.13
Nodes (22): codexDaemonProcesses(), accountCodexProcesses(), CodexProcessInventory, codexProcessInventory(), DesktopSessions, unaccountedProcesses(), codexThreadMetadata(), METADATA_CHUNK (+14 more)

### Community 81 - "Coordinator"
Cohesion: 0.08
Nodes (3): withGitHubSource(), coordination(), Coordinator

### Community 82 - "api-routes.ts"
Cohesion: 0.17
Nodes (19): implementationContinuationRoute(), qaPlanRetryRoute(), goalHistory(), ROOT, apiRoute(), RequestContext, ServiceContext, fileResponse() (+11 more)

### Community 83 - "project-bindings-config.ts"
Cohesion: 0.15
Nodes (23): awaitingJiraStatus(), awaitingProduction(), FOLLOW_DAYS, followed(), isFollowed(), Azure, AzureRead, containedIn() (+15 more)

### Community 84 - "viewer.js"
Cohesion: 0.19
Nodes (25): addMetaLink(), addMetaRow(), addRelationship(), applyView(), buildIndexes(), buildLegend(), buildModel(), buildRenderer() (+17 more)

### Community 85 - "weekly-rollup.ts"
Cohesion: 0.13
Nodes (27): learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), BRAIN_SCOPE (+19 more)

### Community 86 - "stopped-record.ts"
Cohesion: 0.07
Nodes (60): boundedEvidence(), expectedWait(), StopFacts, FailedMailCheck, lastFailedMailCheck(), lastMailCheckOutcome(), MailCheckOutcome, normalizeCause() (+52 more)

### Community 87 - "conversations/conversations.ts"
Cohesion: 0.08
Nodes (33): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+25 more)

### Community 88 - "notifications.ts"
Cohesion: 0.15
Nodes (18): channelNoticeAuthorized(), ChannelSettings, notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR, plainSlackText() (+10 more)

### Community 89 - "spawn-command.ts"
Cohesion: 0.15
Nodes (21): inactivityWatch(), At, Errno, errno(), GroupInventory, GroupProbe, LifecycleDiagnostic, Phase (+13 more)

### Community 90 - "github-workflows.ts"
Cohesion: 0.15
Nodes (21): Azure, azurePipelines(), outcome(), Read, RUNS_PER_PIPELINE, Api, githubWorkflows(), outcome() (+13 more)

### Community 91 - "readable-jira-comment.ts"
Cohesion: 0.15
Nodes (24): CommentPage, commentReadback(), devUpdate(), HEADLINE, jiraRecord(), unpack(), postDevUpdate(), statusHeld() (+16 more)

### Community 92 - "session-context-client.ts"
Cohesion: 0.12
Nodes (17): claudeSessionContext(), readTranscript, codexSessionContext(), readRollout, packContextFailure(), PackedContextFailure, ContextThread, contextThread() (+9 more)

### Community 93 - "plans.cjs"
Cohesion: 0.12
Nodes (27): fs, main(), parse(), path, atomicWrite(), substantive(), walk(), association() (+19 more)

### Community 94 - "timed-statements.ts"
Cohesion: 0.22
Nodes (12): StoreTimings, NAMED, rowsText(), rowText(), SQL_TOKEN, statementName(), text(), timed() (+4 more)

### Community 96 - "carried-checks.ts"
Cohesion: 0.16
Nodes (21): latestQA(), notPassedInLatestQA(), QACoverage, qaCoverage(), same(), Tested, safeWebUrl(), officeValidation() (+13 more)

### Community 97 - "deploy.ts"
Cohesion: 0.13
Nodes (37): abandon(), advance(), deploy(), DEPLOY_STEPS, DeployFacts, append(), assertNext(), deployJournalPath() (+29 more)

### Community 98 - "ticket-stage-runner.ts"
Cohesion: 0.08
Nodes (55): candidateBranchMoved(), applyChangeScope(), endChangeScope(), levels(), MAX_CHECKS, owedUnderScope(), scopeBase(), scopeOutgrown() (+47 more)

### Community 99 - "archive-plan.cjs"
Cohesion: 0.17
Nodes (22): fs, main(), parse(), path, archive(), cell(), ensureIndex(), fromArgs() (+14 more)

### Community 100 - "call-outcome.ts"
Cohesion: 0.27
Nodes (11): failed(), githubAuthError(), noCalls(), refusedByRateLimit(), revalidated, slurpedPages(), succeeded(), activeGitHubAccount() (+3 more)

### Community 101 - "workKey"
Cohesion: 0.15
Nodes (22): notOwned(), DependencyStores, mergedByOwner(), closeableIssue(), effectsSettled(), eligible(), officePublished(), ownerMerged() (+14 more)

### Community 102 - "ref_zod"
Cohesion: 0.19
Nodes (18): azureSchema, deploymentSchema, jiraSchema, ownJiraSchema, promptSchema, DEFAULT_STAGE_STATUSES, intakeStatus, resolvedStatuses() (+10 more)

### Community 103 - "on-merge-sync.cjs"
Cohesion: 0.15
Nodes (28): fs, main(), path, { spawnSync }, fieldSpan(), frontmatterProblems(), keyPattern(), list() (+20 more)

### Community 104 - "backup-stores.ts"
Cohesion: 0.10
Nodes (36): absentAdmission(), AdmissionComparison, AdmissionSnapshot, compareAdmissions(), snapshotAdmissions(), BackupEntry, BackupInput, BackupInventory (+28 more)

### Community 105 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 106 - "deploy-plan.ts"
Cohesion: 0.12
Nodes (36): runningRevision(), runningRevision(), runtimeRevision(), BUILD_ENV, buildRelease(), BuildReleaseOptions, Execute, pinnedVersions() (+28 more)

### Community 107 - "assignment-poll.ts"
Cohesion: 0.10
Nodes (28): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), admitReadyCards(), confirmedGone(), goneQuery(), STOPPED, stoppedReviewKeys() (+20 more)

### Community 108 - "office-config.ts"
Cohesion: 0.28
Nodes (10): OfficeConfigInputs, officeConfigRoute(), officeConfigSummary(), projectSettingsSummary(), ProjectBindings, parseHolds(), policySchema, ProjectPolicyInput (+2 more)

### Community 109 - "StageResult"
Cohesion: 0.08
Nodes (46): applyIntakeObservation(), namedRepairIds(), DECISION_KINDS, needsDecision(), acceptStageResult(), StageContext, acceptConflictRepair(), APPROACH_GUARD_REJECTION (+38 more)

### Community 110 - "blocker-followups.ts"
Cohesion: 0.10
Nodes (51): conversationReadbackReady(), followupOf(), pendingReadback(), queueConversationReadback(), readbackEnding(), uncertainConversations(), conversationResolved(), readBackConversations() (+43 more)

### Community 111 - "report.ts"
Cohesion: 0.26
Nodes (13): Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked(), row() (+5 more)

### Community 112 - "outbox.ts"
Cohesion: 0.12
Nodes (22): capabilityBlockedReviews(), latestReviews(), metadataParkAction(), ADOPTION_STALLED_MS, projectOutbox(), item(), syncOutbox(), OwnerStepItem (+14 more)

### Community 113 - "work.ts"
Cohesion: 0.08
Nodes (30): FLAGS, incidentCommand(), IncidentCommandIO, option(), USAGE, whole(), effectiveCause(), REPLACED (+22 more)

### Community 114 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 115 - "telemetry.ts"
Cohesion: 0.07
Nodes (36): add(), CodexRequest, CodexRollout, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens() (+28 more)

### Community 119 - "alert-issue.ts"
Cohesion: 0.18
Nodes (21): readBackOrThrow(), AlertIssue, alertIssueBody(), alertIssueTitle(), alertMarker(), closeAlertIssue(), ensureAlertIssue(), findAlertIssue() (+13 more)

### Community 120 - "conversations/slack.ts"
Cohesion: 0.10
Nodes (15): slackVerifyPrompt(), comparableSlackText(), labelIsUrl(), SlackMessages, SlackRequestSchema, SlackResultSchema, SlackVerificationSchema, canFileGithubIssue() (+7 more)

### Community 121 - "intent.ts"
Cohesion: 0.14
Nodes (17): assertOwnership(), decideImplementation(), ImplementationDecision, OwnershipRead, consumeQAPlanRetry(), entryExists(), inspectClosedQAPlan(), Decision (+9 more)

### Community 122 - "connectWith"
Cohesion: 0.38
Nodes (5): connectWith(), data(), envelope(), JiraWorklogs, WorklogSave

### Community 123 - "deploy-command.ts"
Cohesion: 0.08
Nodes (49): CONTROLLER_ENTRY, ControllerPin, Pin, pinnedController(), readControllerPin(), writeControllerPin(), controllerOf(), deployCommand() (+41 more)

### Community 124 - "refresh-issue-state.cjs"
Cohesion: 0.20
Nodes (19): advanceFence(), closingIssues(), githubRefs(), key(), normalizeGithubQuery(), normalizeRepository(), parseGithubQuery(), ref() (+11 more)

### Community 125 - "knowledge.ts"
Cohesion: 0.06
Nodes (37): normalizeStatement(), LessonBrainAudit, LessonBrainOverlap, decideOfficeProposal(), OfficeKnowledgeStore, proposeOfficeLessons(), retireOfficeLesson(), Input (+29 more)

### Community 126 - "shared.ts"
Cohesion: 0.04
Nodes (94): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), maintenanceCandidate(), moveAside(), moveBack(), purgeRemoved(), purging (+86 more)

### Community 127 - "sign-in-unpark.ts"
Cohesion: 0.18
Nodes (19): hasPendingDelivery(), resumeAfterSignIn(), signInWait(), MAX_SIGN_IN_UNPARKS, unparkSignedIn(), waitingStep(), BrowserPage, browserPages() (+11 more)

### Community 128 - "sanitize"
Cohesion: 0.20
Nodes (15): projectSlackDeliveries(), dueSlackReread(), rereadUncertainSlack(), runningRevision(), settleRequestedSlackReplacement(), Input, supersedeSlackDelivery(), replacementContext() (+7 more)

### Community 129 - "call-ledger.ts"
Cohesion: 0.27
Nodes (8): add(), addSource(), busiest(), Entry, sourceRows(), Sources, CallCounts, GitHubSource

### Community 130 - "pre-push-boundary.ts"
Cohesion: 0.27
Nodes (10): Event, exactCommand(), Invocation, localHookCommand(), one(), prePushRejection(), PushIdentity, retirementBoundary() (+2 more)

### Community 131 - "it-specialist.ts"
Cohesion: 0.13
Nodes (24): replacedReadback(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), heldFor(), ITContext, recoveryHeld() (+16 more)

### Community 132 - "ITFollowUps.tsx"
Cohesion: 0.24
Nodes (10): itAgent(), itDiagnostics(), itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps(), followUpStatus(), outstandingFollowUps() (+2 more)

### Community 133 - "session-coverage.ts"
Cohesion: 0.60
Nodes (5): completeSessionCoverage(), desktopCoverageGap(), knownActivity(), Report, unexplained()

### Community 134 - "metadata-park-words.ts"
Cohesion: 0.19
Nodes (17): parksInJira(), OUTCOME, qaComment(), remote(), STAGE, environmentWait(), plainWords(), tidy() (+9 more)

### Community 135 - "continue-ownership-read.ts"
Cohesion: 0.25
Nodes (14): continueOwnershipRead(), expiredOwnershipRead(), handoffOwnership(), ReadbackOwnerDecision, ownershipReadGate(), ownershipReadState(), ownershipReadSource(), ReadOwnershipCandidate (+6 more)

### Community 136 - "Role"
Cohesion: 0.15
Nodes (13): jiraQueueProgress(), nextStage(), OfficeCapacity, deliveryRoles, JiraQueueProgress, TicketProgress, isLessonDecision(), blocker() (+5 more)

### Community 137 - "Effects"
Cohesion: 0.11
Nodes (23): MergeNotifications, NOT_LANDED_SETTLE_MS, settleNotLanded(), Write, diagnosticProof(), ownedArtifact(), rawHash(), recoverDiscovery() (+15 more)

### Community 138 - "run.ts"
Cohesion: 0.14
Nodes (21): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_FIX_PROMPT, OfficeFixResult (+13 more)

### Community 139 - "Goals"
Cohesion: 0.17
Nodes (14): CTOReview(), goalState, DailyCTO(), GoalHistory(), load(), reportDate(), reviewStatus, blank() (+6 more)

### Community 140 - "session-snapshot-cleanup.ts"
Cohesion: 0.40
Nodes (5): SNAPSHOT_PREFIX, removeStaleSessionSnapshots(), SNAPSHOT_SWEEP_MS, STALE_SNAPSHOT_MS, sweepStaleSessionSnapshots()

### Community 142 - "offices.ts"
Cohesion: 0.09
Nodes (25): assertQuestionVisibility(), pendingQuestions(), leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), queueImprovements(), DELIVERY_CONCURRENCY (+17 more)

### Community 144 - "reconcile-merges.cjs"
Cohesion: 0.22
Nodes (14): collectPulls(), copyWikiForDryRun(), { execFileSync }, flattenPages(), fs, githubRequest(), isWikiBotPull(), main() (+6 more)

### Community 145 - "preferences-store.ts"
Cohesion: 0.23
Nodes (7): PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, OFFICE_PREFERENCE_DEFAULTS, OfficePreferences

### Community 146 - "requests.ts"
Cohesion: 0.07
Nodes (62): assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), reconcileCompletedConflictDraft(), routeReadyPostConflictPublication(), verifyInitialDraftConflictPreparation() (+54 more)

### Community 147 - "goal-evidence.ts"
Cohesion: 0.18
Nodes (12): GitHubMonitor, githubPRDescription(), azureGoalFacts(), azurePRDescription(), boundedEvidence(), collectAzureGoalDocuments(), EvidenceStore, GOAL_EVIDENCE_LIMITS (+4 more)

### Community 148 - "runner-root.ts"
Cohesion: 0.23
Nodes (18): privateDirectories(), runnerPaths(), ancestry(), assertDirectoryOrAbsent(), checkDatabaseFiles(), CHECKOUT, checkOwnedFile(), code() (+10 more)

### Community 149 - "project-graphql.ts"
Cohesion: 0.12
Nodes (42): BLOCK, harnessBlockMove(), harnessParkedCard(), noted(), effectKey(), LaneOperation, laneWrite(), moveCardOnce() (+34 more)

### Community 150 - "serve-graph.cjs"
Cohesion: 0.24
Nodes (9): createServer(), fs, http, listen(), attempt(), main(), path, resolveRequest() (+1 more)

### Community 151 - "Conversation.tsx"
Cohesion: 0.10
Nodes (32): ChatMarkdown(), Conversation(), ConversationDraft, createConversationDrafts(), SendMessage, ChatMarkdown, MessageText(), slackMessageStatus() (+24 more)

### Community 152 - "node-visuals.ts"
Cohesion: 0.20
Nodes (14): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+6 more)

### Community 153 - "daily-cto.ts"
Cohesion: 0.11
Nodes (24): currentCitations(), Fact, NOT_CURRENT, PROVIDER_ERROR, evidenceRequestConflicts, dailyReviewPrompt(), applyGoalReview(), DailyResultSchema (+16 more)

### Community 154 - "Ticket"
Cohesion: 0.18
Nodes (8): carriedNotRepeated(), changeScopeNote(), Scoped, JiraOperations, Carried, findingsOwedToRetest(), missingRetestDispositions(), Ticket

### Community 155 - "recorded-gh-command.ts"
Cohesion: 0.19
Nodes (20): assignments(), changeDirectory(), closing(), CREATE, createGuard(), flags(), named(), read() (+12 more)

### Community 156 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 157 - "provider-limit-resolution.ts"
Cohesion: 0.33
Nodes (7): investigatesLimitRefusal(), PROVIDER_RECOVERED, providerLimitResolution(), refusedAtLimit(), exitFailure(), MONTHS, providerLimit()

### Community 158 - "it-report.ts"
Cohesion: 0.27
Nodes (10): followUpPicture(), publishITReport(), archiveOldReports(), RETAINED_REPORTS, archiveByMonth(), archiveHistory(), archiveMonth(), archiveOldTaskDetail() (+2 more)

### Community 160 - "interrupted-work-recovery.ts"
Cohesion: 0.25
Nodes (10): currentOutbox(), interruptAdoptions(), legacy(), REMOVED_FIELDS, retireLegacyRecovery(), goalNoticeNeverDispatched(), maintenanceNoticeNeverDispatched(), checkpointOutcome() (+2 more)

### Community 162 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 163 - "continue-access-only-plan.ts"
Cohesion: 0.26
Nodes (11): Document, document(), isAccessOnlyPlan(), settledAccessOnlyState(), continueAccessOnlyPlan(), entryExists(), identity(), Json (+3 more)

### Community 164 - "admit-repair-waits.ts"
Cohesion: 0.23
Nodes (13): admitRepairWaits(), Covered, COVERING, expiryEvent(), expiryId(), lastProgress(), progressOf(), RepairWaitEntry (+5 more)

### Community 165 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (7): CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility, overlayEntranceDelays(), SceneOverlay()

### Community 166 - "dates.cjs"
Cohesion: 0.31
Nodes (12): today(), dateFromPlanBasename(), dateFromSessionPath(), evidenceDates(), fileMtimeDate(), fs, gitCommitDate(), inferPlanDate() (+4 more)

### Community 167 - "validate-stage.ts"
Cohesion: 0.17
Nodes (17): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+9 more)

### Community 168 - "useOfficePreferences.ts"
Cohesion: 0.23
Nodes (11): acceptPreferences(), PreferenceCandidate, PreferenceState, strip(), UNKNOWN_PREFERENCES, PreferenceFeedback, PreferenceField, requestPreferences() (+3 more)

### Community 169 - "operationPaths"
Cohesion: 0.19
Nodes (13): assertToken(), Body, DeploymentFence, DeploymentFenceState, fenceTokenDigest(), DeploymentFenceRouteContext, operationPaths(), createDeployToken() (+5 more)

### Community 170 - "tracking-issue.ts"
Cohesion: 0.33
Nodes (10): ensureTrackingIssue(), findTrackingIssue(), ownTracking(), TrackingIssue, trackingIssueBody(), trackingIssueTitle(), trackingMarker(), centralCompanionHandoff() (+2 more)

### Community 171 - "call-scope.ts"
Cohesion: 0.35
Nodes (8): boundGitHubRunner(), currentGitHubProject(), currentGitHubSource(), githubCli(), scopes, STAGES, meteredRunner(), readRateLimitHeaders()

### Community 172 - "intake-enumeration.ts"
Cohesion: 0.36
Nodes (8): enumerateIntakeList(), inPickupOrder(), Intake, text(), checkMail(), drainMail(), requestMail(), ingest()

### Community 173 - "read-retries.ts"
Cohesion: 0.38
Nodes (9): classifyStop(), incompleteReadOutput(), IntakeResult, planReadRetry(), readOnlyStageJob(), readRetryPending(), reconcileReadRetries(), RETRY_PLAN_GRACE_MS (+1 more)

### Community 174 - "delivery-ownership.ts"
Cohesion: 0.33
Nodes (4): Ownership, ownershipContext, refreshDeliveryOwnership(), RefreshOwnership

### Community 175 - "context-failure-transport.ts"
Cohesion: 0.39
Nodes (4): unpackContextFailure(), ContextReadPhase, SessionContextDeadline, sessionInventoryFailureDetail()

### Community 176 - "validate_wiki_pr_body.cjs"
Cohesion: 0.33
Nodes (5): { execFileSync }, hasCanonicalWikiBody(), maintenanceBodies, matchesMaintenanceBody(), { readFileSync }

### Community 178 - "endpoint-family.ts"
Cohesion: 0.38
Nodes (6): endpoint(), GitHubCall, githubCall(), OPAQUE, repositoryFamily(), VALUE_FLAGS

### Community 179 - "wait-idle.ts"
Cohesion: 0.40
Nodes (4): Health, IdleObservation, IdleResult, WaitIdleInput

### Community 181 - "office-qa-handoff.ts"
Cohesion: 0.60
Nodes (4): OfficeQAHandoff, OfficeQAHandoffInput, OfficeQAHandoffRequest, QAOwnershipProof

### Community 182 - "closed-readonly-plan.ts"
Cohesion: 0.67
Nodes (3): closedReadonlyPlan(), Document, document()

### Community 183 - "qa-plan-retry.ts"
Cohesion: 0.67
Nodes (3): QAPlanRetry, QAPlanRetryProof, QAPlanRetryRequest

## Knowledge Gaps
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `worker-runtime.ts`, `features/workflow.ts`, `ref_node_crypto`, `admit-improvement.ts`, `advance-metadata-park.ts`, `scheduled-captures.ts`, `run-retrospective.ts`, `record-trigger.ts`, `setup-stop-cap.ts`, `github-delivery.ts`, `artifact`, `dependency-bots/adopt.ts`, `retrospective-subject.ts`, `jira-time.ts`, `holdReason`, `OfficeSnapshot`, `controller-runtime.ts`, `draft-provenance.ts`, `digest`, `ref_node_path`, `coordination.ts`, `scheduled-work.ts`, `assignments.ts`, `observe-github-merges.ts`, `time-scope.ts`, `pilot-delivery.ts`, `jiraBinding`, `Offices`, `lesson-selection.ts`, `cec.ts`, `.emit`, `ledger.ts`, `sanitizeObject`, `cec/issue-publication.ts`, `run-accounting.ts`, `copy.ts`, `jira-attempts.ts`, `cost-ledger.ts`, `unsent-time.ts`, `accessibility-sources.ts`, `judge-resumes.ts`, `resume-arrivals.ts`, `ticket-evidence.ts`, `agents.ts`, `knowledge/routes.ts`, `project-bindings.ts`, `closeout-recovery.ts`, `prompts/conversations.ts`, `session-bridge.ts`, `api-routes.ts`, `project-bindings-config.ts`, `weekly-rollup.ts`, `stopped-record.ts`, `conversations/conversations.ts`, `notifications.ts`, `github-workflows.ts`, `readable-jira-comment.ts`, `ticket-stage-runner.ts`, `workKey`, `assignment-poll.ts`, `StageResult`, `blocker-followups.ts`, `outbox.ts`, `alert-issue.ts`, `conversations/slack.ts`, `intent.ts`, `knowledge.ts`, `shared.ts`, `sign-in-unpark.ts`, `sanitize`, `it-specialist.ts`, `ITFollowUps.tsx`, `continue-ownership-read.ts`, `Role`, `Effects`, `run.ts`, `offices.ts`, `requests.ts`, `goal-evidence.ts`, `project-graphql.ts`, `daily-cto.ts`, `Ticket`, `provider-limit-resolution.ts`, `interrupted-work-recovery.ts`, `continue-access-only-plan.ts`, `admit-repair-waits.ts`, `validate-stage.ts`, `tracking-issue.ts`, `read-retries.ts`, `QuestionNotifications`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **Should `incidents/routes.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.04938867438867439 - nodes in this community are weakly interconnected._
- **Why does `command()` connect `Store` to `incidents/routes.ts`, `worker-runtime.ts`, `features/workflow.ts`, `continue-ownership-read.ts`, `Role`, `Effects`, `ref_node_crypto`, `requests.ts`, `github-delivery.ts`, `artifact`, `project-graphql.ts`, `goal-evidence.ts`, `jira-time.ts`, `holdReason`, `controller-runtime.ts`, `digest`, `ref_node_path`, `coordination.ts`, `command-registry.ts`, `continue-access-only-plan.ts`, `validate-stage.ts`, `pilot-delivery.ts`, `jiraBinding`, `call-scope.ts`, `cec/issue-publication.ts`, `copy.ts`, `jira-attempts.ts`, `cost-ledger.ts`, `accessibility-sources.ts`, `resume-arrivals.ts`, `ticket-evidence.ts`, `agents.ts`, `knowledge/routes.ts`, `service-health.ts`, `project-bindings.ts`, `closeout-recovery.ts`, `session-bridge.ts`, `weekly-rollup.ts`, `notifications.ts`, `readable-jira-comment.ts`, `ticket-stage-runner.ts`, `deploy-plan.ts`, `StageResult`, `connectWith`, `deploy-command.ts`, `shared.ts`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Should `OrgChart.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09877551020408164 - nodes in this community are weakly interconnected._
- **Why does `workKey()` connect `workKey` to `features/workflow.ts`, `Effects`, `run.ts`, `offices.ts`, `requests.ts`, `github-delivery.ts`, `artifact`, `dependency-bots/adopt.ts`, `holdReason`, `Store`, `digest`, `ref_node_path`, `interrupted-work-recovery.ts`, `coordination.ts`, `scheduled-work.ts`, `ledger.ts`, `accessibility-sources.ts`, `closeout-recovery.ts`, `stopped-record.ts`, `StageResult`, `work.ts`, `shared.ts`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Should `worker-runtime.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06440677966101695 - nodes in this community are weakly interconnected._
- **Should `features/workflow.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07825507825507826 - nodes in this community are weakly interconnected._