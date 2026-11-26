# Graph Report - the-office  (2026-11-26)

## Corpus Check
- 1309 files · ~578,061 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 7107 nodes · 30757 edges · 172 communities (163 shown, 9 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 1067 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `48987a27`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- incidents/routes.ts
- OrgChart.tsx
- worker-runtime.ts
- features/workflow.ts
- cx
- weekly-rollup.ts
- budget-ledger.ts
- index.tsx
- OfficeSnapshot
- TimeBook.tsx
- features.ts
- overseer/commands.ts
- App.tsx
- admit-improvement.ts
- request.ts
- scheduled-captures.ts
- run-retrospective.ts
- record-trigger.ts
- launch.mjs
- github-delivery.ts
- workKey
- overseer-launch.mjs
- delivery-repairs.ts
- jira-time.ts
- observe-projects.ts
- Conversation.tsx
- controller-runtime.ts
- fact-bounds.ts
- advance-metadata-park.ts
- MaintenanceRun
- digest
- GitHubDelivery
- ref_node_crypto
- run-accounting.ts
- call-scope.ts
- common.cjs
- scheduled-work.ts
- routing.cjs
- github-check-selection.ts
- assignments.ts
- observe-github-merges.ts
- time-scope.ts
- knowledge/routes.ts
- .save
- Offices
- harness-baseline.ts
- credential-spans.ts
- service-ticks.ts
- Ticket
- security.ts
- QuestionStepper.tsx
- run.ts
- investigations/ledger.ts
- state-parts.ts
- jiraBinding
- ref_node_child_process
- goal-reviews.ts
- pass.ts
- ref_node_path
- time-ledger.ts
- cost-ledger.ts
- lesson-selection.ts
- maintenance/maintenance.ts
- Button
- constellation-runtime.ts
- validate_pr_body.cjs
- audit-plan-candidates.cjs
- office-client.ts
- dispatch-resume.ts
- process.ts
- OfficeScene.tsx
- retrospective-subject.ts
- session-context-file.ts
- projectPolicy
- session-scope.ts
- service-health.ts
- azure.ts
- github-context.ts
- incidents.ts
- agents.ts
- session-bridge.ts
- Coordinator
- resume-arrivals.ts
- follow-production.ts
- viewer.js
- restart-writer.ts
- stopped-record.ts
- sanitize
- superseded-wiki-pr.ts
- spawn-command.ts
- provider-observation.ts
- readable-jira-comment.ts
- session-context-client.ts
- plans.cjs
- quota-governor.ts
- capture-session-clone.py
- cec/workflow.ts
- deploy.ts
- pilot-delivery.ts
- archive-plan.cjs
- call-outcome.ts
- observe-prs.ts
- http/commands.ts
- on-merge-sync.cjs
- backup-stores.ts
- extract-worker.mjs
- deploy-plan.ts
- .emit
- work.ts
- Store
- blocker-followups.ts
- telemetry/report.ts
- notifications.ts
- judge-resumes.ts
- slack-supersession.ts
- telemetry.ts
- qa.ts
- qa-plan-continuation.ts
- writer-restart.ts
- store.ts
- conversations/slack.ts
- engine.ts
- daily-cto.ts
- deploy-command.ts
- refresh-issue-state.cjs
- knowledge.ts
- remove-candidate.ts
- sign-in-unpark.ts
- interrupted-work-recovery.ts
- call-ledger.ts
- pre-push-boundary.ts
- it-specialist.ts
- bareSpans
- json-layers.ts
- artifact
- continue-ownership-read.ts
- draft-provenance.ts
- Effects
- proof-comment.ts
- Outbox.tsx
- bare-value.ts
- coordination.ts
- scheduler.ts
- production.ts
- reconcile-merges.cjs
- useOfficePreferences.ts
- post-conflict-preparation.ts
- Engine
- runner-root.ts
- harnessEffect
- serve-graph.cjs
- holdReason
- command-registry.ts
- ref_zod
- enrollment-gate.ts
- recorded-gh-command.ts
- continue-access-only-plan.ts
- delivery-task.ts
- diagnostic-snapshot.ts
- routing.js
- session-coverage.ts
- unblock-brief.ts
- delivery-subject.ts
- dates.cjs
- admit-repair-waits.ts
- ProjectProgress
- launcher-state.ts
- DeploymentFence
- release-manifest.ts
- handover-cms.ts
- validate_wiki_pr_body.cjs
- cli.ts

## God Nodes (most connected - your core abstractions)
1. `Store` - 468 edges
2. `TicketJob` - 232 edges
3. `digest()` - 175 edges
4. `command()` - 155 edges
5. `GitHubDelivery` - 143 edges
6. `holdReason()` - 143 edges
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
- `OwnerStepItem` --references--> `OwnerSteps`  [EXTRACTED]
  server/conversations/owner-step-items.ts → src/contracts/owner-steps.ts

## Import Cycles
- 2-file cycle: `server/scheduling/coordination-pump.ts -> server/scheduling/coordination.ts -> server/scheduling/coordination-pump.ts`
- 2-file cycle: `server/scheduling/coordination-tick.ts -> server/scheduling/coordination.ts -> server/scheduling/coordination-tick.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/track-adopted-review.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/stage-reconciliation.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/readiness/automation-conflict.ts -> server/delivery/readiness/automation-merge.ts -> server/delivery/readiness/automation-conflict.ts`
- 2-file cycle: `server/delivery/pipeline/accept-stage-result.ts -> server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/accept-stage-result.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/publication/metadata-context.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/pipeline/github-delivery.ts`
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

## Communities (172 total, 9 thin omitted)

### Community 0 - "incidents/routes.ts"
Cohesion: 0.07
Nodes (50): citationFault(), CitationSchema, SourceVersions, dismiss(), DISMISSAL_CITATIONS, DISMISSAL_REASON, DismissalFacts, DismissalRequest (+42 more)

### Community 1 - "OrgChart.tsx"
Cohesion: 0.07
Nodes (59): label(), personaContext(), DailyCTOSummary, GoalProgress, Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId (+51 more)

### Community 2 - "worker-runtime.ts"
Cohesion: 0.06
Nodes (42): savedStageCompletion(), candidateWorkspaceEnvironment(), APPROACH_GUIDANCE, ApproachSchema, assignmentSubject(), lessonPurpose(), selectLessons(), catalogLine() (+34 more)

### Community 3 - "features/workflow.ts"
Cohesion: 0.08
Nodes (54): approveFeature(), featureById(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), discoveryPrompt(), planPrompt() (+46 more)

### Community 4 - "cx"
Cohesion: 0.10
Nodes (80): Outbox(), ServiceHealthPanel(), followUp(), labels, ServiceHealthRow(), BlockerFollowups(), LearningCoverage(), lessonsView() (+72 more)

### Community 5 - "weekly-rollup.ts"
Cohesion: 0.15
Nodes (19): deliveryMetrics(), median(), expireLearningPackets(), packetReferences(), learningMetrics(), RollupResult, harperFolder(), RETROSPECTIVE_TIMEOUT (+11 more)

### Community 6 - "budget-ledger.ts"
Cohesion: 0.06
Nodes (58): abandonExpired(), Admission, admit(), admitDeployment(), balance(), bindEvidence(), count(), errcode() (+50 more)

### Community 7 - "index.tsx"
Cohesion: 0.11
Nodes (44): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView() (+36 more)

### Community 8 - "OfficeSnapshot"
Cohesion: 0.08
Nodes (50): jiraQueueProgress(), deliveryRoles, JiraQueueProgress, TicketProgress, ProgressionItem, BARE_UUID, COMPOSITE, strip() (+42 more)

### Community 9 - "TimeBook.tsx"
Cohesion: 0.10
Nodes (35): TelemetryReport, LiveAnchor, AzureBuild, ROLE_NAMES, BreakdownTable(), CostBar(), coverage(), pricedLabel() (+27 more)

### Community 10 - "features.ts"
Cohesion: 0.08
Nodes (48): commandFeature(), reviewQuestions(), confirmBrief(), FeaturePlanningBindings, publishFeature(), assertQuestionVisibility(), applyHarnessAction(), HarnessActionInput (+40 more)

### Community 11 - "overseer/commands.ts"
Cohesion: 0.12
Nodes (31): reconcile(), guardPresent(), overseerCommand(), reconcileArgs(), runnerStatus(), bounded(), ControlRead, Halt (+23 more)

### Community 12 - "App.tsx"
Cohesion: 0.05
Nodes (59): SendMessage, themeColor, App(), BrainWorkspace, CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants (+51 more)

### Community 13 - "admit-improvement.ts"
Cohesion: 0.23
Nodes (16): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+8 more)

### Community 14 - "request.ts"
Cohesion: 0.07
Nodes (74): awaitingContainment(), refusal(), MISSING_NATIVE_LINK, approveMerge(), AdoptionBinding, assertAutomationAuthority(), observeAutomationConflict(), VERB (+66 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.14
Nodes (50): requestDelivery(), createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), CaptureRequest (+42 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.11
Nodes (38): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, BlockingTrigger, blockingTrigger(), isBlocking() (+30 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.12
Nodes (34): baselined(), LEARNING_BASELINES, maintainLearning(), clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates(), maintenanceCompletedId() (+26 more)

### Community 18 - "launch.mjs"
Cohesion: 0.06
Nodes (101): RFC-9562, BANNER, builtin(), bundleLauncher(), LAUNCHER_BUNDLE, LAUNCHER_ENTRY, launcherChunk(), REPOSITORY (+93 more)

### Community 19 - "github-delivery.ts"
Cohesion: 0.06
Nodes (73): writerRestartInstruction(), findingsBlock(), assertDeliveryMayMutate(), runHarnessStage(), harnessDelivers(), legacyRecovery(), BOARD_RULE, conflictRefreshInstruction() (+65 more)

### Community 20 - "workKey"
Cohesion: 0.06
Nodes (77): ownershipReadHistory(), StoppedWriter, observePrerequisites(), completedPRReview(), completedPRReviews(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration() (+69 more)

### Community 21 - "overseer-launch.mjs"
Cohesion: 0.07
Nodes (80): acquireLauncherLock(), alone(), ancestry(), assertDirectoryOrAbsent(), attemptRecord(), bounded(), boundedString(), checkOwnedFile() (+72 more)

### Community 22 - "delivery-repairs.ts"
Cohesion: 0.07
Nodes (53): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+45 more)

### Community 23 - "jira-time.ts"
Cohesion: 0.08
Nodes (47): attempted(), attemptState(), bound(), covers(), jiraAttempts(), JiraAttemptState, open(), provenNeverSent() (+39 more)

### Community 24 - "observe-projects.ts"
Cohesion: 0.24
Nodes (12): FailedMailCheck, lastFailedMailCheck(), lastMailCheckOutcome(), MailCheckOutcome, ProjectObservation, LANES, observeProjects(), OfficeObservation (+4 more)

### Community 25 - "Conversation.tsx"
Cohesion: 0.08
Nodes (39): knowledgeOutbox(), ChatMarkdown(), Conversation(), ConversationDraft, createConversationDrafts(), LessonDecisionAction, lessonDecisionState(), readLessonDecision() (+31 more)

### Community 26 - "controller-runtime.ts"
Cohesion: 0.09
Nodes (35): StoreDatabase, ControllerEffects, controllerEffects(), DEPLOY_PROJECT, alive(), ControllerMachine, option(), realMachine() (+27 more)

### Community 27 - "fact-bounds.ts"
Cohesion: 0.18
Nodes (19): leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance() (+11 more)

### Community 28 - "advance-metadata-park.ts"
Cohesion: 0.08
Nodes (74): ProjectCard, advanceMetadataPark(), Parked, releaseWords(), sentAnything(), cardResumeRoute(), effectiveParkPickup(), PICKUP_ASSIGNEE (+66 more)

### Community 29 - "MaintenanceRun"
Cohesion: 0.11
Nodes (24): reconcileNoticeConfirmations(), dependencyCompletionKey(), BrainStatusSchema, identity, brainCheckpointCompletion(), coverageSchema, verified, publishedWorkCleanedUp() (+16 more)

### Community 30 - "digest"
Cohesion: 0.08
Nodes (74): createdContentSha256(), Binding, historyBeforeWrite(), matchesBoundDescription(), DescriptionEdit, DescriptionHistory, DescriptionHistoryUnavailable, descriptionRevision() (+66 more)

### Community 31 - "GitHubDelivery"
Cohesion: 0.05
Nodes (63): writerRestartPending(), GitHubDelivery, Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact() (+55 more)

### Community 32 - "ref_node_crypto"
Cohesion: 0.11
Nodes (35): packedConsumerPnpmRepair(), sha256(), featureItemComplete(), reconcileFeatureCompletion(), evidenceDirectory(), readEvidence(), ProviderEvidence, canonical() (+27 more)

### Community 33 - "run-accounting.ts"
Cohesion: 0.11
Nodes (33): NOTIFY_HELPER, BoundedRead, done(), readBoundedNoFollow(), readOwnedSessionArtifact(), reasonOf(), backfillClaudeCost(), CompletionReader (+25 more)

### Community 34 - "call-scope.ts"
Cohesion: 0.12
Nodes (20): failed(), bindGitHubRunner(), boundGitHubRunner(), currentGitHubProject(), currentGitHubSource(), githubCli(), Runner, scopes (+12 more)

### Community 35 - "common.cjs"
Cohesion: 0.18
Nodes (22): connections(), fs, main(), path, crypto, ensureInside(), { execFileSync }, fs (+14 more)

### Community 36 - "scheduled-work.ts"
Cohesion: 0.07
Nodes (46): freshOwnershipRead(), deliverySlot(), verifiedCloseoutCleanupRequest(), Ownership, ownershipContext, refreshDeliveryOwnership(), RefreshOwnership, withAmendmentOwnership() (+38 more)

### Community 37 - "routing.cjs"
Cohesion: 0.14
Nodes (27): main(), parseArgs(), usage(), adjacency(), edgeCost(), edgeKey(), edgeType(), EVIDENCE_TYPE_PRIORITY (+19 more)

### Community 38 - "github-check-selection.ts"
Cohesion: 0.11
Nodes (36): CheckJobAgreement, checkJobAgreement(), isKnownCheckStatus(), positive(), STATE, UNFINISHED, checksFailed(), checksPassed() (+28 more)

### Community 39 - "assignments.ts"
Cohesion: 0.11
Nodes (22): clip(), DEMAND_LIMIT, demandFacts(), key(), LessonKey, notes(), AssignmentLookups, Binding (+14 more)

### Community 40 - "observe-github-merges.ts"
Cohesion: 0.30
Nodes (14): clearCooldown(), coolDown(), coolingDown(), MERGE_NOTICE_RECHECK_MS, waitKey(), waits, isMergeCommit(), issueOf() (+6 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.19
Nodes (22): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), ticketUnresolved(), ticketDayTotals() (+14 more)

### Community 42 - "knowledge/routes.ts"
Cohesion: 0.10
Nodes (20): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, CommittedBrain (+12 more)

### Community 43 - ".save"
Cohesion: 0.11
Nodes (50): resolveBlockedTransition(), document(), transitionWithComment(), jiraAccount(), jiraCollection(), JiraCredential, jiraCredential(), KEYCHAIN_SERVICE (+42 more)

### Community 44 - "Offices"
Cohesion: 0.12
Nodes (4): QuestionNotifications, InFlightOperations, Offices, SessionBridge

### Community 45 - "harness-baseline.ts"
Cohesion: 0.15
Nodes (22): BaselineReport, baselineReport(), BaselineSource, baselineText(), millions(), row(), share(), add() (+14 more)

### Community 46 - "credential-spans.ts"
Cohesion: 0.06
Nodes (39): AFTER_LABEL, BARE_CREDENTIAL, BARE_LABEL, BARE_UNIT, BARE_VALUE, CAMEL_START, CONTROL_ESCAPE, CREDENTIAL_NAME (+31 more)

### Community 47 - "service-ticks.ts"
Cohesion: 0.17
Nodes (24): sourceVersions(), inHistoryOf(), CompareMemory, compareMemory(), COMPARES_PER_PASS, comparison(), DeployedFixes, DeployedFixesInput (+16 more)

### Community 48 - "Ticket"
Cohesion: 0.05
Nodes (61): carriedNotRepeated(), changeScopeNote(), Scoped, implementationWorkerContext(), JiraOperations, movedHeadNote(), cecPrompt(), resolvedDecisionNote() (+53 more)

### Community 49 - "security.ts"
Cohesion: 0.05
Nodes (59): implementationPreview(), implementationContinuationRoute(), qaPlanRetryRoute(), close(), config, itSpecialist, loadedRevision, offices (+51 more)

### Community 50 - "QuestionStepper.tsx"
Cohesion: 0.19
Nodes (18): FeatureQuestionProjection, OutboxQuestionRound(), send(), draftKey(), readDraft(), saveDraft(), QuestionRound(), nextQuestion() (+10 more)

### Community 51 - "run.ts"
Cohesion: 0.12
Nodes (28): failureOutranks(), INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationEvidence(), investigationHeld(), INVOCATION_SOURCE_REFS, invocationSource(), sections (+20 more)

### Community 52 - "investigations/ledger.ts"
Cohesion: 0.17
Nodes (16): acceptedCompletionResolution(), investigationCandidates(), investigationId(), ctoReplacementResolution(), finishedSubjectResolution(), investigationFollowUps(), implementationReplacementResolution(), interruptedQARerunResolution() (+8 more)

### Community 53 - "state-parts.ts"
Cohesion: 0.08
Nodes (28): readSavedState(), LARGE_KEY_CHARS, plain(), RedactedEntries, RedactedEntry, redactEntries(), joinParts(), PartRow (+20 more)

### Community 54 - "jiraBinding"
Cohesion: 0.09
Nodes (17): intakeJql(), Assignment, contentSchema(), JiraIssuePublisher, jiraText(), Transition, descriptionPreimage(), plain() (+9 more)

### Community 55 - "ref_node_child_process"
Cohesion: 0.10
Nodes (22): changedPaths(), { execFileSync }, files, isMapInput(), mapOnly(), { execFileSync }, git(), publish() (+14 more)

### Community 56 - "goal-reviews.ts"
Cohesion: 0.13
Nodes (21): currentCitations(), Fact, NOT_CURRENT, PROVIDER_ERROR, applyGoalReview(), DailyResultSchema, DeliveryJob, EvidenceRefSchema (+13 more)

### Community 57 - "pass.ts"
Cohesion: 0.08
Nodes (47): DEFAULT_OFFICE_URL, LOOPBACK, officeUrl(), RunnerLimits, RunnerPaths, appendFailureLine(), Evidence, FAILURE_ID (+39 more)

### Community 58 - "ref_node_path"
Cohesion: 0.05
Nodes (64): GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles(), ContinuationIO (+56 more)

### Community 59 - "time-ledger.ts"
Cohesion: 0.10
Nodes (29): JiraAttempt, JiraWorklogExpected, JiraWorklogReconcile, publishableEntry(), settlementPending(), superseded(), Ledger, Read (+21 more)

### Community 60 - "cost-ledger.ts"
Cohesion: 0.13
Nodes (32): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress(), effectId() (+24 more)

### Community 61 - "lesson-selection.ts"
Cohesion: 0.09
Nodes (34): guidanceExcerpt(), digest(), lessonForProject(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, LessonSelection (+26 more)

### Community 62 - "maintenance/maintenance.ts"
Cohesion: 0.11
Nodes (24): maintenancePolicies(), accessibilitySources(), sourceReview(), SETTLED, skipOwnedCandidate(), Skipped, skippedCandidateLedger(), CmsFollowUpContext (+16 more)

### Community 63 - "Button"
Cohesion: 0.07
Nodes (57): KnowledgeActivity, FeatureDelivery(), FeatureDocuments(), views, FeatureReading(), FeatureWorkspace(), phases, LinkedFeatures() (+49 more)

### Community 64 - "constellation-runtime.ts"
Cohesion: 0.05
Nodes (63): KnowledgeActivityPage, KnowledgeEdge, KnowledgeMap, KnowledgeNode, BrainDrawer(), ATMOSPHERE, mapAtmosphere(), Particle (+55 more)

### Community 65 - "validate_pr_body.cjs"
Cohesion: 0.36
Nodes (8): fs, main(), readableText(), REQUIRED_CHECKS, REQUIRED_SECTIONS, sections(), validatePullRequestBody(), withoutComments()

### Community 66 - "audit-plan-candidates.cjs"
Cohesion: 0.14
Nodes (31): audit(), branchIssueNumbers(), classify(), distinctiveTitleWords(), { execFileSync }, extractPaths(), findPrForMergeSubject(), fmtCommit() (+23 more)

### Community 67 - "office-client.ts"
Cohesion: 0.14
Nodes (17): RUNNER_DEFAULTS, officeDataRoot, realMachine(), bodyWithin(), bounded(), Envelope, HealthReading, OfficeReader (+9 more)

### Community 68 - "dispatch-resume.ts"
Cohesion: 0.14
Nodes (50): canonical(), CheckpointEligibility, checkpointEligibility(), admitAssignmentResume(), admitCheckpointResume(), admitResume(), ResumeAdmission, ResumeIntent (+42 more)

### Community 69 - "process.ts"
Cohesion: 0.07
Nodes (40): jiraRecord(), unpack(), statusHeld(), metadataDigest(), verifiedTransition(), verifyAlreadyAtStatus(), assetDownloader(), attachmentKind() (+32 more)

### Community 70 - "OfficeScene.tsx"
Cohesion: 0.07
Nodes (62): itAgent(), itDiagnostics(), displayAgentTask(), withoutElapsed(), CameraBookmark, restoreBookmark(), LiveAgentTask(), Props (+54 more)

### Community 71 - "retrospective-subject.ts"
Cohesion: 0.17
Nodes (16): ARTIFACT_LIMIT, clip(), LEDGER_STEPS, MAINTENANCE_LIMIT, maintenanceFacts(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl() (+8 more)

### Community 72 - "session-context-file.ts"
Cohesion: 0.17
Nodes (18): Bound, ContextFoldPrefix, contextFoldPrefix(), SessionContextCheckpoint, captureSessionContextClone(), ContextReadPhase, SessionContextDeadline, ContextProject (+10 more)

### Community 73 - "projectPolicy"
Cohesion: 0.18
Nodes (14): checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), repeatedVendorReviewBlock(), stoppedInVendorReview(), leftToNextRun(), NEXT_RUN_DUE_MS, night() (+6 more)

### Community 74 - "session-scope.ts"
Cohesion: 0.20
Nodes (15): claudeScopeParser(), claudeSessionScope(), CODEX_ROLLOUTS, contextReaders(), retainSessionMessage(), SessionConversation, escaped(), jiraCommandIssues() (+7 more)

### Community 75 - "service-health.ts"
Cohesion: 0.13
Nodes (21): ClaudeLoginRefusal, claudeLoginRefusal(), claudeRefusalWords(), RECORDED_REFUSALS, refusedClaudeRow(), providers, ProviderStatusChecks, summary (+13 more)

### Community 76 - "azure.ts"
Cohesion: 0.08
Nodes (38): AzureMonitor, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs(), fullActivePRs(), observation() (+30 more)

### Community 77 - "github-context.ts"
Cohesion: 0.08
Nodes (54): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+46 more)

### Community 78 - "incidents.ts"
Cohesion: 0.08
Nodes (55): attributedRecords(), foldsItsRun(), groupCandidates(), ObservedIncident, ObservedSubject, digest(), fingerprint(), incidentId() (+47 more)

### Community 79 - "agents.ts"
Cohesion: 0.06
Nodes (43): cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), plainResume(), CECReadbackSchema, READBACK_OWNER_SCOPE, ticketForWorker(), Connection (+35 more)

### Community 80 - "session-bridge.ts"
Cohesion: 0.13
Nodes (22): codexDaemonProcesses(), accountCodexProcesses(), CodexProcessInventory, codexProcessInventory(), DesktopSessions, unaccountedProcesses(), codexThreadMetadata(), METADATA_CHUNK (+14 more)

### Community 82 - "resume-arrivals.ts"
Cohesion: 0.09
Nodes (34): eventId(), AWS_KEY_ID, JSON_WEB_TOKEN, PROVIDER_TOKEN, redactCredentials(), redactUnquoted(), assessResumes(), Standing (+26 more)

### Community 83 - "follow-production.ts"
Cohesion: 0.20
Nodes (17): awaitingJiraStatus(), awaitingProduction(), FOLLOW_DAYS, followed(), isFollowed(), Azure, AzureRead, containedIn() (+9 more)

### Community 84 - "viewer.js"
Cohesion: 0.19
Nodes (25): addMetaLink(), addMetaRow(), addRelationship(), applyView(), buildIndexes(), buildLegend(), buildModel(), buildRenderer() (+17 more)

### Community 85 - "restart-writer.ts"
Cohesion: 0.18
Nodes (17): ATTEMPT_DELAYS_MS, nextAttemptAt(), restartStoppedWriters(), unchangedSinceAccepted(), NOT_RETRYABLE, releaseFunds(), stoppedWriter(), WRITER_STAGES (+9 more)

### Community 86 - "stopped-record.ts"
Cohesion: 0.09
Nodes (51): capabilityBlockedReviews(), latestReviews(), boundedEvidence(), expectedWait(), StopFacts, normalizeCause(), IncidentCollector, improvements() (+43 more)

### Community 87 - "sanitize"
Cohesion: 0.05
Nodes (59): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+51 more)

### Community 88 - "superseded-wiki-pr.ts"
Cohesion: 0.11
Nodes (50): abandon(), assertOpenSnapshot(), closeIssue(), CloseRevalidationError, closeSuperseded(), comment(), CommentStep, continueSupersededWikiPR() (+42 more)

### Community 89 - "spawn-command.ts"
Cohesion: 0.12
Nodes (25): exitFailure(), inactivityWatch(), At, Errno, errno(), GroupInventory, GroupProbe, LifecycleDiagnostic (+17 more)

### Community 90 - "provider-observation.ts"
Cohesion: 0.11
Nodes (29): az(), correlatedBuild(), nativeRead(), Azure, azurePipelines(), outcome(), Read, RUNS_PER_PIPELINE (+21 more)

### Community 91 - "readable-jira-comment.ts"
Cohesion: 0.11
Nodes (33): CommentPage, commentReadback(), devUpdate(), HEADLINE, postDevUpdate(), OUTCOME, qaComment(), remote() (+25 more)

### Community 92 - "session-context-client.ts"
Cohesion: 0.11
Nodes (18): claudeSessionContext(), readTranscript, codexSessionContext(), readRollout, packContextFailure(), PackedContextFailure, unpackContextFailure(), ContextThread (+10 more)

### Community 93 - "plans.cjs"
Cohesion: 0.12
Nodes (27): fs, main(), parse(), path, atomicWrite(), substantive(), walk(), association() (+19 more)

### Community 94 - "quota-governor.ts"
Cohesion: 0.27
Nodes (9): backgroundHold(), CORE_RESERVE, noQuotaHold, PROBE_INTERVAL_MS, quotaLow(), QuotaRefusal, ResourceReading, quotaDeferred() (+1 more)

### Community 96 - "cec/workflow.ts"
Cohesion: 0.09
Nodes (36): applyIntakeObservation(), latestQA(), notPassedInLatestQA(), QACoverage, qaCoverage(), same(), Tested, GATE_REFUSED (+28 more)

### Community 97 - "deploy.ts"
Cohesion: 0.10
Nodes (42): abandon(), advance(), controllerOf(), Commit, DEPLOY_STEPS, DeployFacts, DeployStatus, Digest (+34 more)

### Community 98 - "pilot-delivery.ts"
Cohesion: 0.08
Nodes (58): candidateBranchMoved(), applyChangeScope(), endChangeScope(), levels(), MAX_CHECKS, owedUnderScope(), scopeBase(), scopeOutgrown() (+50 more)

### Community 99 - "archive-plan.cjs"
Cohesion: 0.17
Nodes (22): fs, main(), parse(), path, archive(), cell(), ensureIndex(), fromArgs() (+14 more)

### Community 100 - "call-outcome.ts"
Cohesion: 0.17
Nodes (15): githubAuthError(), refusedByRateLimit(), revalidated, slurpedPages(), succeeded(), endpoint(), GitHubCall, githubCall() (+7 more)

### Community 101 - "observe-prs.ts"
Cohesion: 0.09
Nodes (40): notOwned(), deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, requireDeliveryAuthority(), deliveryIntakeBlocker(), gateRegisteredDelivery() (+32 more)

### Community 102 - "http/commands.ts"
Cohesion: 0.13
Nodes (25): assertOwnership(), decideImplementation(), requestQAPlanRetry(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), requeueWaitedImplement() (+17 more)

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
Cohesion: 0.28
Nodes (13): Body, DeploymentFenceState, fenceTokenDigest(), operationPaths(), planDeployment(), createDeployToken(), readDeployToken(), publishDurable() (+5 more)

### Community 107 - ".emit"
Cohesion: 0.05
Nodes (78): currentOutbox(), BLOCK, harnessBlockMove(), harnessParkedCard(), noted(), retryCandidateCleanup(), confirmedGone(), goneQuery() (+70 more)

### Community 108 - "work.ts"
Cohesion: 0.13
Nodes (19): effectiveCause(), REPLACED, BLOCKED_CAUSES, blockedCauses(), NONE, projectReadiness(), ProjectReadiness, AssignmentResult (+11 more)

### Community 109 - "Store"
Cohesion: 0.09
Nodes (17): GitHubFeaturePublisher, helperTelemetry(), JiraFeaturePublisher, helperInstallation(), observeHelperGroups(), stopHelperGroups(), FeatureReviewRunner, stopReview() (+9 more)

### Community 110 - "blocker-followups.ts"
Cohesion: 0.11
Nodes (50): conversationReadbackReady(), followupOf(), pendingReadback(), queueConversationReadback(), readbackEnding(), uncertainConversations(), readBackConversations(), followupRecord() (+42 more)

### Community 111 - "telemetry/report.ts"
Cohesion: 0.22
Nodes (15): TelemetryRow, TelemetrySync, Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount() (+7 more)

### Community 112 - "notifications.ts"
Cohesion: 0.17
Nodes (16): clamp(), LIMITS, MergedPR, plainSlackText(), section(), shippedSummary(), configureNotices(), Identity (+8 more)

### Community 113 - "judge-resumes.ts"
Cohesion: 0.05
Nodes (53): Admission, FLAGS, incidentCommand(), IncidentCommandIO, option(), USAGE, whole(), boundaryCrossed() (+45 more)

### Community 114 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 115 - "telemetry.ts"
Cohesion: 0.08
Nodes (33): add(), CodexRequest, CodexRollout, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens() (+25 more)

### Community 119 - "store.ts"
Cohesion: 0.09
Nodes (27): queueImprovements(), Clock, systemClock, DELIVERY_CONCURRENCY, projectById(), applyConnectionSettings(), closeConnection(), optimizeOnOpen() (+19 more)

### Community 120 - "conversations/slack.ts"
Cohesion: 0.14
Nodes (15): channelNoticeAuthorized(), comparableSlackText(), labelIsUrl(), dueSlackReread(), rereadUncertainSlack(), runningRevision(), SlackMessages, SlackRequestSchema (+7 more)

### Community 121 - "engine.ts"
Cohesion: 0.21
Nodes (13): enumerateIntakeList(), inPickupOrder(), Intake, text(), checkMail(), drainMail(), requestMail(), enableNightly() (+5 more)

### Community 122 - "daily-cto.ts"
Cohesion: 0.08
Nodes (26): expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), DailyCTO, EvidenceRequestConflict (+18 more)

### Community 123 - "deploy-command.ts"
Cohesion: 0.12
Nodes (34): CONTROLLER_ENTRY, ControllerPin, Pin, pinnedController(), readControllerPin(), writeControllerPin(), deployCommand(), report() (+26 more)

### Community 124 - "refresh-issue-state.cjs"
Cohesion: 0.20
Nodes (19): advanceFence(), closingIssues(), githubRefs(), key(), normalizeGithubQuery(), normalizeRepository(), parseGithubQuery(), ref() (+11 more)

### Community 125 - "knowledge.ts"
Cohesion: 0.06
Nodes (37): curateLesson(), Curation, CurationAction, mergeEvidence(), LessonBrainAudit, LessonBrainOverlap, BRAIN_SCOPE, SUBJECT (+29 more)

### Community 126 - "remove-candidate.ts"
Cohesion: 0.14
Nodes (22): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), maintenanceCandidate(), moveAside(), moveBack(), purgeRemoved(), purging (+14 more)

### Community 127 - "sign-in-unpark.ts"
Cohesion: 0.11
Nodes (32): parksInJira(), readbackDispatchGuidance(), currentEnvironmentWait(), environmentWait(), waitText(), hasPendingDelivery(), resumeAfterSignIn(), signInWait() (+24 more)

### Community 128 - "interrupted-work-recovery.ts"
Cohesion: 0.36
Nodes (7): interruptAdoptions(), legacy(), REMOVED_FIELDS, retireLegacyRecovery(), goalNoticeNeverDispatched(), maintenanceNoticeNeverDispatched(), recover()

### Community 129 - "call-ledger.ts"
Cohesion: 0.25
Nodes (10): add(), addSource(), busiest(), CallLedger, Entry, sourceRows(), Sources, CallCounts (+2 more)

### Community 130 - "pre-push-boundary.ts"
Cohesion: 0.27
Nodes (10): Event, exactCommand(), Invocation, localHookCommand(), one(), prePushRejection(), PushIdentity, retirementBoundary() (+2 more)

### Community 131 - "it-specialist.ts"
Cohesion: 0.13
Nodes (23): replacedReadback(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), heldFor(), ITContext, recoveryHeld() (+15 more)

### Community 132 - "bareSpans"
Cohesion: 0.19
Nodes (15): apostropheEnd(), bareSpans(), credentialSpans(), genuineGap(), headerValueEnd(), isQueryLabel(), labelBefore(), nameEnd() (+7 more)

### Community 133 - "json-layers.ts"
Cohesion: 0.26
Nodes (9): decode(), decodedIndex(), evenRunBefore(), JsonLayers, LayerString, opensValue(), SIMPLE, strings() (+1 more)

### Community 134 - "artifact"
Cohesion: 0.08
Nodes (81): containedFile(), acceptStageResult(), PrerequisitesSchema, assertDraftClaimHistory(), linkDraftIssue(), protectedOriginalClaim(), publicationReadArgs(), Read (+73 more)

### Community 135 - "continue-ownership-read.ts"
Cohesion: 0.20
Nodes (16): continueOwnershipRead(), expiredOwnershipRead(), handoffOwnership(), ReadbackOwnerDecision, ownershipReadGate(), ownershipReadState(), ownershipReadSource(), ReadOwnershipCandidate (+8 more)

### Community 136 - "draft-provenance.ts"
Cohesion: 0.21
Nodes (17): maintenanceVerifiedDraft(), returnDraftToPromotion(), DraftProvenance, draftStep(), draftWorker(), MaintenanceDraft, maintenanceDraftProvenance(), nativeBash() (+9 more)

### Community 137 - "Effects"
Cohesion: 0.09
Nodes (38): settleNotLanded(), dispatchedMetadataEffect(), Write, GitHubOperations, assignedToJoe(), fileLessonIssue(), lessonIssueBody(), lessonIssueMarker() (+30 more)

### Community 138 - "proof-comment.ts"
Cohesion: 0.38
Nodes (12): commentId(), CommentIntent, CommentReceipt, conversation(), exact(), findProofComment(), matchesProofComment(), postProofComment() (+4 more)

### Community 139 - "Outbox.tsx"
Cohesion: 0.07
Nodes (37): OwnerSteps, groups, ctoInputFailure(), OutboxCTOInput(), recover(), OutboxMaintenanceStatus(), OutboxOwnerSteps(), OutboxSavedImplementation() (+29 more)

### Community 140 - "bare-value.ts"
Cohesion: 0.30
Nodes (11): BareValue, bareValue(), deeperValueEnd(), ENDS, isSeparator(), plainEscape(), queryValue(), separatorEscapeAt() (+3 more)

### Community 141 - "coordination.ts"
Cohesion: 0.10
Nodes (27): completeNativeCheckpoint(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, brainResultStop(), GateMark, gateMark(), MAX_START_RETRIES (+19 more)

### Community 142 - "scheduler.ts"
Cohesion: 0.14
Nodes (15): OfficeCapacity, PROJECT_LOCAL, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch() (+7 more)

### Community 144 - "reconcile-merges.cjs"
Cohesion: 0.22
Nodes (14): collectPulls(), copyWikiForDryRun(), { execFileSync }, flattenPages(), fs, githubRequest(), isWikiBotPull(), main() (+6 more)

### Community 145 - "useOfficePreferences.ts"
Cohesion: 0.12
Nodes (18): PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, acceptPreferences(), PreferenceCandidate, PreferenceState (+10 more)

### Community 146 - "post-conflict-preparation.ts"
Cohesion: 0.08
Nodes (56): assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), reconcileCompletedConflictDraft(), routeReadyPostConflictPublication(), verifyInitialDraftConflictPreparation() (+48 more)

### Community 147 - "Engine"
Cohesion: 0.07
Nodes (6): MergeNotifications, deliverySource(), ResumeProject, BrainFollowup, pump(), Engine

### Community 148 - "runner-root.ts"
Cohesion: 0.19
Nodes (23): resolveCliRoot(), privateDirectories(), runnerPaths(), PIN_ENTRY, pinCommand(), ancestry(), assertDirectoryOrAbsent(), checkDatabaseFiles() (+15 more)

### Community 149 - "harnessEffect"
Cohesion: 0.09
Nodes (65): effectKey(), LaneOperation, laneWrite(), moveCardOnce(), Lane, MOVABLE, moveLane(), resolveLane() (+57 more)

### Community 150 - "serve-graph.cjs"
Cohesion: 0.24
Nodes (9): createServer(), fs, http, listen(), attempt(), main(), path, resolveRequest() (+1 more)

### Community 151 - "holdReason"
Cohesion: 0.10
Nodes (36): metadataCarriedAdvisoryIds(), ownedBefore(), QA_STAGES, reviewAdvisoryIds(), Reviewed, withoutReviewAdvisories(), handsOff(), discover() (+28 more)

### Community 152 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 153 - "ref_zod"
Cohesion: 0.05
Nodes (73): escaped(), IntakeBinding, intakeEnumeration(), intakeLocation(), intakeMembership(), projectListScope(), cecTransitionPrompt(), AUTO_ADOPT_BOTS (+65 more)

### Community 154 - "enrollment-gate.ts"
Cohesion: 0.12
Nodes (33): dispatchNightly(), eligibility(), admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, compatible(), dependencyEligibility() (+25 more)

### Community 155 - "recorded-gh-command.ts"
Cohesion: 0.19
Nodes (20): assignments(), changeDirectory(), closing(), CREATE, createGuard(), flags(), named(), read() (+12 more)

### Community 156 - "continue-access-only-plan.ts"
Cohesion: 0.54
Nodes (6): Document, document(), isAccessOnlyPlan(), settledAccessOnlyState(), continueAccessOnlyPlan(), entryExists()

### Community 157 - "delivery-task.ts"
Cohesion: 0.39
Nodes (6): reviewInstructions(), deliveryTask(), DeliveryTaskInput, DISCOVERY_GUIDANCE, compactSteps(), featureDeliveryContext()

### Community 158 - "diagnostic-snapshot.ts"
Cohesion: 0.19
Nodes (14): diagnosticSnapshot(), followUpPicture(), publishITReport(), nativeDeliveryResolved(), archiveOldReports(), RETAINED_REPORTS, archiveByMonth(), archiveHistory() (+6 more)

### Community 160 - "session-coverage.ts"
Cohesion: 0.43
Nodes (6): claudeSessions(), completeSessionCoverage(), desktopCoverageGap(), knownActivity(), Report, unexplained()

### Community 161 - "unblock-brief.ts"
Cohesion: 0.53
Nodes (5): clearUnblockBrief(), key(), saveUnblockBrief(), UnblockBrief, unblockBrief()

### Community 162 - "delivery-subject.ts"
Cohesion: 0.40
Nodes (4): accounting, DeliverySubject, nonDelivery, originalReads

### Community 163 - "dates.cjs"
Cohesion: 0.31
Nodes (12): today(), dateFromPlanBasename(), dateFromSessionPath(), evidenceDates(), fileMtimeDate(), fs, gitCommitDate(), inferPlanDate() (+4 more)

### Community 164 - "admit-repair-waits.ts"
Cohesion: 0.12
Nodes (23): PacketInput, absent(), IncidentChange, IncidentLedger, isOpen(), Recorded, admitRepairWaits(), COVERING (+15 more)

### Community 168 - "launcher-state.ts"
Cohesion: 0.17
Nodes (12): base, count, Current, guardStanding(), iso, LAUNCH_KINDS, LauncherState, LaunchRecord (+4 more)

### Community 169 - "DeploymentFence"
Cohesion: 0.38
Nodes (3): assertToken(), DeploymentFence, DeploymentFenceRouteContext

### Community 171 - "release-manifest.ts"
Cohesion: 0.08
Nodes (39): runningRevision(), runningRevision(), runtimeRevision(), ActiveRelease, readActiveRelease(), BUILD_ENV, buildRelease(), BuildReleaseOptions (+31 more)

### Community 173 - "handover-cms.ts"
Cohesion: 0.33
Nodes (4): file, project, root, projectData()

### Community 176 - "validate_wiki_pr_body.cjs"
Cohesion: 0.33
Nodes (5): { execFileSync }, hasCanonicalWikiBody(), maintenanceBodies, matchesMaintenanceBody(), { readFileSync }

## Knowledge Gaps
- **1 isolated node(s):** `RFC-9562`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 1169 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `OrgChart.tsx`, `worker-runtime.ts`, `features/workflow.ts`, `weekly-rollup.ts`, `OfficeSnapshot`, `features.ts`, `admit-improvement.ts`, `request.ts`, `scheduled-captures.ts`, `run-retrospective.ts`, `record-trigger.ts`, `github-delivery.ts`, `workKey`, `delivery-repairs.ts`, `jira-time.ts`, `observe-projects.ts`, `controller-runtime.ts`, `fact-bounds.ts`, `advance-metadata-park.ts`, `MaintenanceRun`, `digest`, `GitHubDelivery`, `ref_node_crypto`, `run-accounting.ts`, `scheduled-work.ts`, `assignments.ts`, `observe-github-merges.ts`, `time-scope.ts`, `knowledge/routes.ts`, `.save`, `Offices`, `Ticket`, `security.ts`, `run.ts`, `investigations/ledger.ts`, `state-parts.ts`, `jiraBinding`, `goal-reviews.ts`, `ref_node_path`, `time-ledger.ts`, `cost-ledger.ts`, `lesson-selection.ts`, `maintenance/maintenance.ts`, `dispatch-resume.ts`, `process.ts`, `OfficeScene.tsx`, `retrospective-subject.ts`, `azure.ts`, `github-context.ts`, `agents.ts`, `session-bridge.ts`, `resume-arrivals.ts`, `follow-production.ts`, `restart-writer.ts`, `sanitize`, `superseded-wiki-pr.ts`, `provider-observation.ts`, `readable-jira-comment.ts`, `cec/workflow.ts`, `pilot-delivery.ts`, `observe-prs.ts`, `http/commands.ts`, `.emit`, `blocker-followups.ts`, `notifications.ts`, `judge-resumes.ts`, `store.ts`, `conversations/slack.ts`, `engine.ts`, `daily-cto.ts`, `remove-candidate.ts`, `sign-in-unpark.ts`, `interrupted-work-recovery.ts`, `it-specialist.ts`, `artifact`, `continue-ownership-read.ts`, `draft-provenance.ts`, `Effects`, `proof-comment.ts`, `coordination.ts`, `scheduler.ts`, `post-conflict-preparation.ts`, `Engine`, `harnessEffect`, `holdReason`, `enrollment-gate.ts`, `continue-access-only-plan.ts`, `delivery-task.ts`, `diagnostic-snapshot.ts`, `delivery-subject.ts`, `admit-repair-waits.ts`, `ProjectProgress`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **What connects `RFC-9562` to the rest of the system?**
  _1 weakly-connected nodes found - possible missing edges._
- **Should `incidents/routes.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06721311475409836 - nodes in this community are weakly interconnected._
- **Why does `command()` connect `process.ts` to `incidents/routes.ts`, `worker-runtime.ts`, `features/workflow.ts`, `artifact`, `continue-ownership-read.ts`, `Effects`, `admit-improvement.ts`, `coordination.ts`, `scheduler.ts`, `Engine`, `github-delivery.ts`, `harnessEffect`, `delivery-repairs.ts`, `workKey`, `jira-time.ts`, `command-registry.ts`, `enrollment-gate.ts`, `controller-runtime.ts`, `continue-access-only-plan.ts`, `MaintenanceRun`, `digest`, `GitHubDelivery`, `call-scope.ts`, `ProjectProgress`, `knowledge/routes.ts`, `.save`, `release-manifest.ts`, `Offices`, `service-ticks.ts`, `Ticket`, `jiraBinding`, `ref_node_path`, `time-ledger.ts`, `cost-ledger.ts`, `maintenance/maintenance.ts`, `service-health.ts`, `azure.ts`, `github-context.ts`, `agents.ts`, `session-bridge.ts`, `resume-arrivals.ts`, `restart-writer.ts`, `provider-observation.ts`, `readable-jira-comment.ts`, `pilot-delivery.ts`, `Store`, `notifications.ts`, `engine.ts`, `daily-cto.ts`, `deploy-command.ts`, `remove-candidate.ts`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Should `OrgChart.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0656140350877193 - nodes in this community are weakly interconnected._
- **Why does `sanitize()` connect `sanitize` to `worker-runtime.ts`, `Effects`, `overseer/commands.ts`, `advance-metadata-park.ts`, `assignments.ts`, `service-ticks.ts`, `Ticket`, `security.ts`, `run.ts`, `pass.ts`, `ref_node_path`, `office-client.ts`, `process.ts`, `service-health.ts`, `azure.ts`, `agents.ts`, `resume-arrivals.ts`, `follow-production.ts`, `spawn-command.ts`, `provider-observation.ts`, `readable-jira-comment.ts`, `.emit`, `store.ts`, `conversations/slack.ts`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Should `worker-runtime.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06448087431693988 - nodes in this community are weakly interconnected._