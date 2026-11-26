# Graph Report - the-office  (2026-11-26)

## Corpus Check
- 1288 files · ~560,852 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 6879 nodes · 29943 edges · 174 communities (167 shown, 7 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 1064 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1e501c22`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- incidents/routes.ts
- OrgChart.tsx
- worker-runtime.ts
- features.ts
- cx
- weekly-rollup.ts
- budget-ledger.ts
- index.tsx
- OfficeSnapshot
- TelemetryPanel.tsx
- features/commands.ts
- overseer/commands.ts
- App.tsx
- admit-improvement.ts
- github-readiness.ts
- scheduled-captures.ts
- run-retrospective.ts
- record-trigger.ts
- cec-reads.ts
- github-delivery.ts
- workKey
- dependency-bots/adopt.ts
- TicketJob
- jira-time.ts
- scope-repair-resume.ts
- Outbox.tsx
- controller-runtime.ts
- fact-bounds.ts
- assertDeliveryMayMutate
- Store
- metadata-admission.ts
- currentAssignment
- index.ts
- coordination.ts
- rate-limit-samples.ts
- common.cjs
- scheduled-work.ts
- routing.cjs
- project-holds.ts
- assignments.ts
- observe-github-merges.ts
- time-scope.ts
- coordination-pump.ts
- .save
- Offices
- harness-baseline.ts
- credential-spans.ts
- lesson-selection.ts
- Ticket
- api-routes.ts
- QuestionStepper.tsx
- investigations/ledger.ts
- projects.ts
- state-parts.ts
- jiraBinding
- ref_node_child_process
- run-accounting.ts
- pass.ts
- ref_node_path
- jira-attempts.ts
- cost-ledger.ts
- reader.ts
- maintenance/maintenance.ts
- MapView.tsx
- constellation-runtime.ts
- validate_pr_body.cjs
- audit-plan-candidates.cjs
- office-client.ts
- resume-arrivals.ts
- ticket-evidence.ts
- OfficeScene.tsx
- retrospective-subject.ts
- session-context-file.ts
- follow-up-alerts.ts
- session-scope.ts
- service-health.ts
- azure.ts
- closeout-recovery.ts
- incidents.ts
- agents.ts
- session-bridge.ts
- Coordinator
- resume-control.ts
- sanitize
- viewer.js
- restart-writer.ts
- stopped-record.ts
- conversations/conversations.ts
- superseded-wiki-pr.ts
- spawn-command.ts
- github-workflows.ts
- project-bindings.ts
- session-context-client.ts
- plans.cjs
- quota-governor.ts
- capture-session-clone.py
- change-scope.ts
- deploy.ts
- ticket-stage-runner.ts
- archive-plan.cjs
- call-scope.ts
- requests.ts
- ref_node_crypto
- on-merge-sync.cjs
- backup-stores.ts
- extract-worker.mjs
- deploy-plan.ts
- .emit
- work.ts
- continuation-evidence.ts
- blocker-followups.ts
- telemetry/report.ts
- outbox.ts
- judge-resumes.ts
- slack-supersession.ts
- telemetry.ts
- qa.ts
- qa-plan-continuation.ts
- writer-restart.ts
- store.ts
- notifications.ts
- Conversation.tsx
- daily-cto.ts
- deploy-command.ts
- refresh-issue-state.cjs
- knowledge.ts
- shared.ts
- sign-in-unpark.ts
- http/commands.ts
- call-ledger.ts
- pre-push-boundary.ts
- holdReason
- diagnostic-snapshot.ts
- accessibility-sources.ts
- harnessDelivers
- alert-issue.ts
- draft-provenance.ts
- Effects
- time-ledger.ts
- DailyCTO.tsx
- session-snapshot-cleanup.ts
- digest
- scheduler.ts
- production.ts
- reconcile-merges.cjs
- ref_zod
- artifact
- office/config.ts
- runner-root.ts
- harnessEffect
- serve-graph.cjs
- local-config.ts
- supersedingDelivery
- project-binding-blocks.ts
- .transaction
- recorded-gh-command.ts
- run.ts
- security.ts
- it-report.ts
- routing.js
- proof-comment.ts
- delivery-ownership.ts
- command-registry.ts
- evidence-artifacts.ts
- redactEvidence
- fix-identity.ts
- call-outcome.ts
- moveLane
- single-flight.ts
- deployment-fence.ts
- incident-command.ts
- release-floor.ts
- intake-enumeration.ts
- validate_wiki_pr_body.cjs

## God Nodes (most connected - your core abstractions)
1. `Store` - 468 edges
2. `TicketJob` - 231 edges
3. `digest()` - 175 edges
4. `command()` - 155 edges
5. `holdReason()` - 143 edges
6. `GitHubDelivery` - 142 edges
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
- `CurrentMark()` --indirect_call--> `marker()`  [INFERRED]
  src/work/timeline/TicketTimeline.tsx → server/delivery/closeout/superseded-wiki-pr.ts

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

## Communities (174 total, 7 thin omitted)

### Community 0 - "incidents/routes.ts"
Cohesion: 0.06
Nodes (58): citationFault(), CitationSchema, SourceVersions, dismiss(), DISMISSAL_CITATIONS, DISMISSAL_REASON, DismissalFacts, DismissalRequest (+50 more)

### Community 1 - "OrgChart.tsx"
Cohesion: 0.12
Nodes (37): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+29 more)

### Community 2 - "worker-runtime.ts"
Cohesion: 0.06
Nodes (45): savedStageCompletion(), candidateWorkspaceEnvironment(), assignmentSubject(), clearUnblockBrief(), key(), saveUnblockBrief(), UnblockBrief, unblockBrief() (+37 more)

### Community 3 - "features.ts"
Cohesion: 0.05
Nodes (80): approveFeature(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), discoveryPrompt(), planPrompt(), artifactPath() (+72 more)

### Community 4 - "cx"
Cohesion: 0.09
Nodes (79): FeatureReading(), FeatureWorkspace(), blockedSummary(), ServiceHealthPanel(), labels, ServiceHealthRow(), goalKey(), GoalList() (+71 more)

### Community 5 - "weekly-rollup.ts"
Cohesion: 0.14
Nodes (26): learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), RollupResult (+18 more)

### Community 6 - "budget-ledger.ts"
Cohesion: 0.06
Nodes (59): abandonExpired(), Admission, admit(), admitDeployment(), balance(), bindEvidence(), count(), errcode() (+51 more)

### Community 7 - "index.tsx"
Cohesion: 0.09
Nodes (53): FeatureDelivery(), FeatureDocuments(), views, phases, LinkedFeatures(), SaveFeedback(), TONE, GoalNoticeForm() (+45 more)

### Community 8 - "OfficeSnapshot"
Cohesion: 0.09
Nodes (45): jiraQueueProgress(), nextStage(), deliveryRoles, JiraQueueProgress, TicketProgress, OfficeSnapshot, STAGE_ROLE, deliveryRepairProjection() (+37 more)

### Community 9 - "TelemetryPanel.tsx"
Cohesion: 0.11
Nodes (34): TelemetryRow, LiveAnchor, AzureBuild, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens() (+26 more)

### Community 10 - "features/commands.ts"
Cohesion: 0.10
Nodes (53): commandFeature(), reviewQuestions(), featureItemComplete(), reconcileFeatureCompletion(), currentApproval(), featureGate(), predecessorComplete(), automaticIntakeWait() (+45 more)

### Community 11 - "overseer/commands.ts"
Cohesion: 0.16
Nodes (23): reconcile(), guardPresent(), overseerCommand(), reconcileArgs(), resolveCliRoot(), runnerStatus(), readFailures(), bounded() (+15 more)

### Community 12 - "App.tsx"
Cohesion: 0.04
Nodes (81): createConversationDrafts(), BrainDrawer(), themeColor, App(), BrainWorkspace, CONNECTION, CONNECTION_DOT, dockItemVariants (+73 more)

### Community 13 - "admit-improvement.ts"
Cohesion: 0.13
Nodes (25): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementIntakeGate(), improvementManifest() (+17 more)

### Community 14 - "github-readiness.ts"
Cohesion: 0.07
Nodes (78): MISSING_NATIVE_LINK, approveMerge(), AdoptionBinding, assertAutomationAuthority(), observeAutomationConflict(), VERB, assertAutomationEffects(), automationMergePolicy() (+70 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.10
Nodes (68): candidateBranchMoved(), continueImplementation(), dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), startPilot(), OfficeQAHandoffInput (+60 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.08
Nodes (53): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, BlockingTrigger, blockingTrigger(), isBlocking() (+45 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.12
Nodes (36): baselined(), baselineLearning(), LEARNING_BASELINES, maintainLearning(), clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates() (+28 more)

### Community 18 - "cec-reads.ts"
Cohesion: 0.08
Nodes (41): escaped(), IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), intakeMembership(), projectListScope(), cecIntakePrompt() (+33 more)

### Community 19 - "github-delivery.ts"
Cohesion: 0.05
Nodes (65): containedFile(), writerRestartInstruction(), findingsBlock(), metadataCarriedAdvisoryIds(), ownedBefore(), QA_STAGES, reviewAdvisoryIds(), Reviewed (+57 more)

### Community 20 - "workKey"
Cohesion: 0.09
Nodes (59): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+51 more)

### Community 21 - "dependency-bots/adopt.ts"
Cohesion: 0.09
Nodes (43): Execute, readBackOrThrow(), closesIssue(), linkPR(), DependabotPR, dependabotPR(), refusal(), ensureTrackingIssue() (+35 more)

### Community 22 - "TicketJob"
Cohesion: 0.07
Nodes (38): removeAdoptedClone(), namedRepairIds(), StageContext, GitHubDelivery, retireRefusedQA(), savedQAResult(), acceptableRefusedQA(), refusedByGate() (+30 more)

### Community 23 - "jira-time.ts"
Cohesion: 0.09
Nodes (38): unresolvedAttempts(), bindingOf(), connectWith(), data(), envelope(), finishVerifiedEffects(), JiraWorklogs, locks (+30 more)

### Community 24 - "scope-repair-resume.ts"
Cohesion: 0.32
Nodes (12): Ownership, reconcileScopeRepairReadback(), scopeRepairRequestResolved(), assertScopeRepairResumeFindings(), certain(), effects(), originalClaim(), Ownership (+4 more)

### Community 25 - "Outbox.tsx"
Cohesion: 0.07
Nodes (47): SendMessage, LessonDecisionAction, lessonDecisionState(), readLessonDecision(), DAYS, dueLessonDecisions(), easternWeek(), isLessonDecision() (+39 more)

### Community 26 - "controller-runtime.ts"
Cohesion: 0.11
Nodes (16): [cmd,...rawArgs], projectData(), StoreDatabase, controllerEffects(), alive(), ControllerMachine, option(), realMachine() (+8 more)

### Community 27 - "fact-bounds.ts"
Cohesion: 0.25
Nodes (15): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+7 more)

### Community 28 - "assertDeliveryMayMutate"
Cohesion: 0.08
Nodes (75): requireDeliveryAuthority(), assertDeliveryMayMutate(), assertMayMutate(), advanceMetadataPark(), Parked, releaseWords(), sentAnything(), effectiveParkPickup() (+67 more)

### Community 29 - "Store"
Cohesion: 0.04
Nodes (33): Assignment, jiraText(), Transition, descriptionPreimage(), plain(), Read, GitHubFeaturePublisher, JiraFeaturePublisher (+25 more)

### Community 30 - "metadata-admission.ts"
Cohesion: 0.07
Nodes (77): retryRead(), createdContentSha256(), Binding, historyBeforeWrite(), matchesBoundDescription(), DescriptionEdit, DescriptionHistory, DescriptionHistoryUnavailable (+69 more)

### Community 31 - "currentAssignment"
Cohesion: 0.09
Nodes (52): writerRestartPending(), deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), deliveryIntakeBlocker(), gateRegisteredDelivery(), resolveDeliveryWork(), completedPreparation() (+44 more)

### Community 32 - "index.ts"
Cohesion: 0.07
Nodes (27): close(), config, itSpecialist, loadedRevision, offices, releaseLock, respond(), server (+19 more)

### Community 33 - "coordination.ts"
Cohesion: 0.16
Nodes (17): completeNativeCheckpoint(), BrainStatusSchema, identity, queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation() (+9 more)

### Community 34 - "rate-limit-samples.ts"
Cohesion: 0.14
Nodes (11): bindGitHubRunner(), Runner, GitHubCalls, QuotaGovernor, iso(), RateLimitSamples, Reading, reading() (+3 more)

### Community 35 - "common.cjs"
Cohesion: 0.15
Nodes (27): connections(), fs, main(), path, crypto, ensureInside(), { execFileSync }, fs (+19 more)

### Community 36 - "scheduled-work.ts"
Cohesion: 0.08
Nodes (42): freshOwnershipRead(), dueSlackReread(), rereadUncertainSlack(), runningRevision(), deliverySlot(), withAmendmentOwnership(), metadataRequestResolved(), gateFeatureWork() (+34 more)

### Community 37 - "routing.cjs"
Cohesion: 0.12
Nodes (28): fs, main(), path, { spawnSync }, frontmatterProblems(), adjacency(), edgeCost(), edgeKey() (+20 more)

### Community 38 - "project-holds.ts"
Cohesion: 0.07
Nodes (65): dispatchLeadAssessment(), observe(), hasUncertainEffects(), CheckJobAgreement, checkJobAgreement(), isKnownCheckStatus(), positive(), STATE (+57 more)

### Community 39 - "assignments.ts"
Cohesion: 0.10
Nodes (27): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), KnowledgeContext, knowledgeSnapshot(), officeKnowledgeSnapshot(), lessonForProject(), AssignmentLookups (+19 more)

### Community 40 - "observe-github-merges.ts"
Cohesion: 0.30
Nodes (14): clearCooldown(), coolDown(), coolingDown(), MERGE_NOTICE_RECHECK_MS, waitKey(), waits, isMergeCommit(), issueOf() (+6 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.15
Nodes (27): HandlerRules, CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence() (+19 more)

### Community 42 - "coordination-pump.ts"
Cohesion: 0.07
Nodes (40): reconcileNoticeConfirmations(), Admission, admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, compatible(), dependencyCompletionKey() (+32 more)

### Community 43 - ".save"
Cohesion: 0.11
Nodes (50): resolveBlockedTransition(), document(), transitionWithComment(), jiraAccount(), jiraCollection(), JiraCredential, jiraCredential(), KEYCHAIN_SERVICE (+42 more)

### Community 45 - "harness-baseline.ts"
Cohesion: 0.15
Nodes (22): BaselineReport, baselineReport(), BaselineSource, baselineText(), millions(), row(), share(), add() (+14 more)

### Community 46 - "credential-spans.ts"
Cohesion: 0.05
Nodes (70): BareValue, bareValue(), deeperValueEnd(), ENDS, isSeparator(), plainEscape(), queryValue(), separatorEscapeAt() (+62 more)

### Community 47 - "lesson-selection.ts"
Cohesion: 0.15
Nodes (16): INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), LessonSelection, MAINTENANCE, MAX_LESSONS (+8 more)

### Community 48 - "Ticket"
Cohesion: 0.08
Nodes (35): carriedNotRepeated(), changeScopeNote(), Scoped, JiraOperations, movedHeadNote(), cecPrompt(), resolvedDecisionNote(), stageInstructionsFor() (+27 more)

### Community 49 - "api-routes.ts"
Cohesion: 0.14
Nodes (22): implementationPreview(), implementationContinuationRoute(), qaPlanRetryRoute(), Link, linkFeature(), assertQuestionVisibility(), featureRoute(), knowledgeRoute() (+14 more)

### Community 50 - "QuestionStepper.tsx"
Cohesion: 0.19
Nodes (18): FeatureQuestionProjection, OutboxQuestionRound(), send(), draftKey(), readDraft(), saveDraft(), QuestionRound(), nextQuestion() (+10 more)

### Community 51 - "investigations/ledger.ts"
Cohesion: 0.20
Nodes (17): acceptedCompletionResolution(), investigationCandidates(), investigationId(), finishedSubjectResolution(), investigationFollowUps(), interruptedQARerunResolution(), investigationResolution(), syncInvestigations() (+9 more)

### Community 52 - "projects.ts"
Cohesion: 0.09
Nodes (33): IntakeView, CEC, file, project, root, OfficeConfigInputs, officeConfigRoute(), officeConfigSummary() (+25 more)

### Community 53 - "state-parts.ts"
Cohesion: 0.08
Nodes (28): readSavedState(), LARGE_KEY_CHARS, plain(), RedactedEntries, RedactedEntry, redactEntries(), joinParts(), PartRow (+20 more)

### Community 54 - "jiraBinding"
Cohesion: 0.24
Nodes (5): contentSchema(), JiraIssuePublisher, publicationDescription(), PublicationReceipt, jiraBinding()

### Community 55 - "ref_node_child_process"
Cohesion: 0.13
Nodes (18): changedPaths(), { execFileSync }, files, isMapInput(), mapOnly(), { execFileSync }, git(), publish() (+10 more)

### Community 56 - "run-accounting.ts"
Cohesion: 0.11
Nodes (35): BoundedRead, done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf(), CompletionReader, codexHome() (+27 more)

### Community 57 - "pass.ts"
Cohesion: 0.07
Nodes (48): DEFAULT_OFFICE_URL, LOOPBACK, officeUrl(), RunnerLimits, RunnerPaths, appendFailureLine(), Evidence, FAILURE_ID (+40 more)

### Community 58 - "ref_node_path"
Cohesion: 0.09
Nodes (30): file, folder, logs, root, ctoInputIdentityMatches(), ctoInputRecovered(), recoverCTOInput(), Candidate (+22 more)

### Community 59 - "jira-attempts.ts"
Cohesion: 0.11
Nodes (26): attempted(), attemptState(), bound(), covers(), JiraAttempt, jiraAttempts(), JiraAttemptState, open() (+18 more)

### Community 60 - "cost-ledger.ts"
Cohesion: 0.15
Nodes (27): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress(), effectId() (+19 more)

### Community 61 - "reader.ts"
Cohesion: 0.07
Nodes (32): committedNotePage(), BrainGraph, BrainNote, BrainReader, CommittedBrain, GraphNode, GraphPage, hash (+24 more)

### Community 62 - "maintenance/maintenance.ts"
Cohesion: 0.08
Nodes (36): maintenancePolicies(), accessibilitySources(), sourceFindings, sourceReview(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, brainResultStop() (+28 more)

### Community 63 - "MapView.tsx"
Cohesion: 0.07
Nodes (57): KnowledgeActivity, KnowledgeActivityPage, KnowledgeEdge, KnowledgeMap, KnowledgeNode, Activity(), ActivityTimeline(), AssignmentKnowledge() (+49 more)

### Community 64 - "constellation-runtime.ts"
Cohesion: 0.07
Nodes (35): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), CameraPose, flightPose(), cameraTarget() (+27 more)

### Community 65 - "validate_pr_body.cjs"
Cohesion: 0.36
Nodes (8): fs, main(), readableText(), REQUIRED_CHECKS, REQUIRED_SECTIONS, sections(), validatePullRequestBody(), withoutComments()

### Community 66 - "audit-plan-candidates.cjs"
Cohesion: 0.14
Nodes (31): audit(), branchIssueNumbers(), classify(), distinctiveTitleWords(), { execFileSync }, extractPaths(), findPrForMergeSubject(), fmtCommit() (+23 more)

### Community 67 - "office-client.ts"
Cohesion: 0.20
Nodes (13): RUNNER_DEFAULTS, bodyWithin(), bounded(), Envelope, HealthReading, officeReader(), OfficeReadError, Release (+5 more)

### Community 68 - "resume-arrivals.ts"
Cohesion: 0.11
Nodes (63): canonical(), CheckpointEligibility, checkpointEligibility(), admitAssignmentResume(), forAssignment(), admitCheckpointResume(), forCheckpoint(), admitResume() (+55 more)

### Community 69 - "ticket-evidence.ts"
Cohesion: 0.14
Nodes (23): Connection, twgConnection(), twgProfile(), assetDownloader(), attachmentKind(), storeEvidence(), blankEvidence(), CoverageState (+15 more)

### Community 70 - "OfficeScene.tsx"
Cohesion: 0.08
Nodes (60): displayAgentTask(), withoutElapsed(), CameraBookmark, restoreBookmark(), LiveAgentTask(), Props, RunningTask(), text() (+52 more)

### Community 71 - "retrospective-subject.ts"
Cohesion: 0.21
Nodes (13): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+5 more)

### Community 72 - "session-context-file.ts"
Cohesion: 0.20
Nodes (14): ContextFoldPrefix, contextFoldPrefix(), SessionContextCheckpoint, captureSessionContextClone(), ContextReadPhase, SessionContextDeadline, sessionContextFile(), ContextReadChanged (+6 more)

### Community 73 - "follow-up-alerts.ts"
Cohesion: 0.23
Nodes (12): checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), repeatedVendorReviewBlock(), stoppedInVendorReview(), leftToNextRun(), NEXT_RUN_DUE_MS, night() (+4 more)

### Community 74 - "session-scope.ts"
Cohesion: 0.18
Nodes (17): Bound, claudeScopeParser(), claudeSessionScope(), CLAUDE_TRANSCRIPTS, CODEX_ROLLOUTS, contextReaders(), retainSessionMessage(), SessionConversation (+9 more)

### Community 75 - "service-health.ts"
Cohesion: 0.10
Nodes (25): ClaudeLoginRefusal, claudeLoginRefusal(), claudeRefusalWords(), RECORDED_REFUSALS, refusedClaudeRow(), listenerHealth(), providers, ProviderStatusChecks (+17 more)

### Community 76 - "azure.ts"
Cohesion: 0.12
Nodes (28): az(), AzureMonitor, buildUrl(), correlatedBuild(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+20 more)

### Community 77 - "closeout-recovery.ts"
Cohesion: 0.10
Nodes (44): closeoutReceipt(), readRejection(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2 (+36 more)

### Community 78 - "incidents.ts"
Cohesion: 0.09
Nodes (44): attributedRecords(), foldsItsRun(), groupCandidates(), ObservedIncident, ObservedSubject, incidentId(), mailboxFreeze(), details() (+36 more)

### Community 79 - "agents.ts"
Cohesion: 0.05
Nodes (47): implementationWorkerContext(), stageInstructions, RefusedQAResult, assertContinuableWorktree(), CONTINUABLE, continuationPrompt(), MAX_CONTINUATIONS, recordedContinuation() (+39 more)

### Community 80 - "session-bridge.ts"
Cohesion: 0.10
Nodes (30): claudeSessionContext(), codexDaemonProcesses(), accountCodexProcesses(), CodexProcessInventory, codexProcessInventory(), DesktopSessions, unaccountedProcesses(), codexSessionContext() (+22 more)

### Community 81 - "Coordinator"
Cohesion: 0.09
Nodes (3): withGitHubSource(), coordination(), Coordinator

### Community 82 - "resume-control.ts"
Cohesion: 0.26
Nodes (8): absent(), NEVER_ENABLED, ResumeControl, stated(), Stored, unreadable(), IncidentsRouteContext, ResumeSwitch

### Community 83 - "sanitize"
Cohesion: 0.20
Nodes (18): awaitingJiraStatus(), awaitingProduction(), FOLLOW_DAYS, followed(), isFollowed(), Azure, AzureRead, containedIn() (+10 more)

### Community 84 - "viewer.js"
Cohesion: 0.19
Nodes (25): addMetaLink(), addMetaRow(), addRelationship(), applyView(), buildIndexes(), buildLegend(), buildModel(), buildRenderer() (+17 more)

### Community 85 - "restart-writer.ts"
Cohesion: 0.18
Nodes (18): ATTEMPT_DELAYS_MS, nextAttemptAt(), restartStoppedWriters(), unchangedSinceAccepted(), NOT_RETRYABLE, releaseFunds(), StoppedWriter, stoppedWriter() (+10 more)

### Community 86 - "stopped-record.ts"
Cohesion: 0.07
Nodes (68): boundedEvidence(), expectedWait(), StopFacts, digest(), fingerprint(), FailedMailCheck, lastFailedMailCheck(), lastMailCheckOutcome() (+60 more)

### Community 87 - "conversations/conversations.ts"
Cohesion: 0.09
Nodes (27): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+19 more)

### Community 88 - "superseded-wiki-pr.ts"
Cohesion: 0.12
Nodes (46): abandon(), assertOpenSnapshot(), awaitingContainment(), closeIssue(), CloseRevalidationError, closeSuperseded(), comment(), CommentStep (+38 more)

### Community 89 - "spawn-command.ts"
Cohesion: 0.11
Nodes (26): exitFailure(), inactivityWatch(), At, Errno, errno(), GroupInventory, GroupProbe, LifecycleDiagnostic (+18 more)

### Community 90 - "github-workflows.ts"
Cohesion: 0.15
Nodes (21): Azure, azurePipelines(), outcome(), Read, RUNS_PER_PIPELINE, Api, githubWorkflows(), outcome() (+13 more)

### Community 91 - "project-bindings.ts"
Cohesion: 0.10
Nodes (34): CommentPage, commentReadback(), devUpdate(), HEADLINE, jiraRecord(), unpack(), parksInJira(), postDevUpdate() (+26 more)

### Community 92 - "session-context-client.ts"
Cohesion: 0.13
Nodes (18): readTranscript, readRollout, packContextFailure(), PackedContextFailure, unpackContextFailure(), LiveSession, ContextThread, contextThread() (+10 more)

### Community 93 - "plans.cjs"
Cohesion: 0.13
Nodes (27): fs, main(), parse(), path, repoRoot(), substantive(), walk(), association() (+19 more)

### Community 94 - "quota-governor.ts"
Cohesion: 0.33
Nodes (7): CORE_RESERVE, noQuotaHold, PROBE_INTERVAL_MS, QuotaRefusal, quotaRefusal(), retryAfterMs(), ResourceReading

### Community 96 - "change-scope.ts"
Cohesion: 0.14
Nodes (26): applyChangeScope(), levels(), MAX_CHECKS, owedUnderScope(), scopeBase(), settled(), statedApproach(), verifiedCandidate() (+18 more)

### Community 97 - "deploy.ts"
Cohesion: 0.12
Nodes (42): ControllerEffects, DEPLOY_PROJECT, abandon(), advance(), DeployContext, DeployTimings, DEPLOY_STEPS, operationPaths() (+34 more)

### Community 98 - "ticket-stage-runner.ts"
Cohesion: 0.08
Nodes (55): endChangeScope(), scopeOutgrown(), confirmsMovedHead(), Moved, movedHeadUnconfirmed(), recordConfirmedHead(), routeConfirmedHead(), draftHeadMovedForward() (+47 more)

### Community 99 - "archive-plan.cjs"
Cohesion: 0.12
Nodes (33): fs, main(), parse(), path, archive(), cell(), ensureIndex(), fromArgs() (+25 more)

### Community 100 - "call-scope.ts"
Cohesion: 0.20
Nodes (14): boundGitHubRunner(), currentGitHubProject(), currentGitHubSource(), githubCli(), scopes, STAGES, endpoint(), GitHubCall (+6 more)

### Community 101 - "requests.ts"
Cohesion: 0.09
Nodes (39): observePrerequisites(), continuationWorktree(), Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact() (+31 more)

### Community 102 - "ref_node_crypto"
Cohesion: 0.05
Nodes (61): GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles(), ContinuationIO (+53 more)

### Community 103 - "on-merge-sync.cjs"
Cohesion: 0.19
Nodes (22): fieldSpan(), keyPattern(), list(), parseListLiteral(), quote(), render(), scalar(), splitFrontmatter() (+14 more)

### Community 104 - "backup-stores.ts"
Cohesion: 0.10
Nodes (36): absentAdmission(), AdmissionComparison, AdmissionSnapshot, compareAdmissions(), snapshotAdmissions(), BackupEntry, BackupInput, BackupInventory (+28 more)

### Community 105 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 106 - "deploy-plan.ts"
Cohesion: 0.11
Nodes (42): runningRevision(), runningRevision(), releaseIdentity(), runtimeRevision(), ActiveRelease, readActiveRelease(), BUILD_ENV, buildRelease() (+34 more)

### Community 107 - ".emit"
Cohesion: 0.11
Nodes (35): currentOutbox(), confirmedGone(), goneQuery(), STOPPED, stoppedReviewKeys(), adoptDependabot(), pinCourier, wikiSync (+27 more)

### Community 108 - "work.ts"
Cohesion: 0.13
Nodes (20): effectiveCause(), REPLACED, NO_RECORD, BLOCKED_CAUSES, blockedCauses(), NONE, projectReadiness(), ProjectReadiness (+12 more)

### Community 109 - "continuation-evidence.ts"
Cohesion: 0.31
Nodes (14): allowed, continuationArtifacts(), continuationNativeReview(), continuationReviewArtifacts(), continuationWorkerProof(), negativeWorker(), savedNegativeContinuationReview(), negativeTechnicalReview() (+6 more)

### Community 110 - "blocker-followups.ts"
Cohesion: 0.09
Nodes (56): conversationReadbackReady(), followupOf(), pendingReadback(), queueConversationReadback(), readbackEnding(), replacedReadback(), uncertainConversations(), Bot (+48 more)

### Community 111 - "telemetry/report.ts"
Cohesion: 0.22
Nodes (15): telemetryRoute(), TelemetryReport, TelemetrySync, Acc, bump(), EASTERN, easternDay(), modelShares() (+7 more)

### Community 112 - "outbox.ts"
Cohesion: 0.09
Nodes (29): capabilityBlockedReviews(), latestReviews(), metadataParkAction(), ADOPTION_STALLED_MS, conversationResolved(), projectOutbox(), item(), syncOutbox() (+21 more)

### Community 113 - "judge-resumes.ts"
Cohesion: 0.06
Nodes (47): boundaryCrossed(), Crossing, Progress, CheckpointProgress, checkpointProgress(), names(), nativeProof(), Step (+39 more)

### Community 114 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 115 - "telemetry.ts"
Cohesion: 0.09
Nodes (29): add(), CodexRequest, CodexRollout, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens() (+21 more)

### Community 119 - "store.ts"
Cohesion: 0.06
Nodes (35): helperTelemetry(), leadershipContext(), dispatchExposure(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), systemClock, InFlightOperations (+27 more)

### Community 120 - "notifications.ts"
Cohesion: 0.07
Nodes (37): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR (+29 more)

### Community 121 - "Conversation.tsx"
Cohesion: 0.09
Nodes (41): ChatMarkdown(), Conversation(), send(), ConversationDraft, ChatMarkdown, MessageText(), slackMessageStatus(), SlackDeliveryCard() (+33 more)

### Community 122 - "daily-cto.ts"
Cohesion: 0.06
Nodes (39): currentCitations(), Fact, NOT_CURRENT, PROVIDER_ERROR, DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt() (+31 more)

### Community 123 - "deploy-command.ts"
Cohesion: 0.08
Nodes (57): CONTROLLER_ENTRY, ControllerPin, Pin, pinnedController(), readControllerPin(), writeControllerPin(), controllerOf(), deployCommand() (+49 more)

### Community 124 - "refresh-issue-state.cjs"
Cohesion: 0.19
Nodes (20): atomicWrite(), advanceFence(), closingIssues(), githubRefs(), key(), normalizeGithubQuery(), normalizeRepository(), parseGithubQuery() (+12 more)

### Community 125 - "knowledge.ts"
Cohesion: 0.10
Nodes (24): BRAIN_SCOPE, SUBJECT, Kind, RetrospectiveResult, RetrospectiveResultSchema, RollupResultSchema, Stage, ImprovementGrant (+16 more)

### Community 126 - "shared.ts"
Cohesion: 0.06
Nodes (51): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), maintenanceCandidate(), moveAside(), moveBack(), purgeRemoved(), purging (+43 more)

### Community 127 - "sign-in-unpark.ts"
Cohesion: 0.16
Nodes (21): currentEnvironmentWait(), environmentWait(), hasPendingDelivery(), resumeAfterSignIn(), signInWait(), isSetupStop(), MAX_SIGN_IN_UNPARKS, waitingStep() (+13 more)

### Community 128 - "http/commands.ts"
Cohesion: 0.10
Nodes (27): configureNotices(), requeueWaitedImplement(), enqueueMetadataRecovery(), normalizeStatement(), configureKnowledge(), declineLessonIssue(), reactivateLesson(), retireLesson() (+19 more)

### Community 129 - "call-ledger.ts"
Cohesion: 0.25
Nodes (9): add(), addSource(), busiest(), CallLedger, Entry, sourceRows(), Sources, CallCounts (+1 more)

### Community 130 - "pre-push-boundary.ts"
Cohesion: 0.26
Nodes (10): Event, exactCommand(), Invocation, localHookCommand(), one(), prePushRejection(), PushIdentity, retirementBoundary() (+2 more)

### Community 131 - "holdReason"
Cohesion: 0.10
Nodes (39): DeliveryAuthorityInput, boardPreflightCandidate(), partialLocalCleanupCandidate(), partialLocalCleanupKey(), savedActivationFailure(), sourceConfigurationRecoveryTarget(), candidateInput(), children (+31 more)

### Community 132 - "diagnostic-snapshot.ts"
Cohesion: 0.33
Nodes (9): assignmentDiagnostics(), diagnosticContext(), diagnosticSnapshot(), itAgent(), itDiagnostics(), followUpStatus(), outstandingFollowUps(), currentServices() (+1 more)

### Community 133 - "accessibility-sources.ts"
Cohesion: 0.13
Nodes (21): defaultPickupStatus(), GitHubIssuePublisher, number(), same(), actionable(), closingPull(), Finding, handoffIssue() (+13 more)

### Community 134 - "harnessDelivers"
Cohesion: 0.09
Nodes (36): harnessDelivers(), legacyRecovery(), cardResumeRoute(), field(), FIELDS, MetadataField, metadataFields(), metadataParkWords() (+28 more)

### Community 135 - "alert-issue.ts"
Cohesion: 0.18
Nodes (20): AlertIssue, alertIssueBody(), alertIssueTitle(), alertMarker(), closeAlertIssue(), ensureAlertIssue(), findAlertIssue(), Guard (+12 more)

### Community 136 - "draft-provenance.ts"
Cohesion: 0.13
Nodes (24): DraftProvenance, draftStep(), draftWorker(), MaintenanceDraft, maintenanceDraftProvenance(), nativeBash(), need(), output() (+16 more)

### Community 137 - "Effects"
Cohesion: 0.15
Nodes (18): GitHubOperations, assignedToJoe(), fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), firstLane(), instruction(), LaneMove (+10 more)

### Community 138 - "time-ledger.ts"
Cohesion: 0.20
Nodes (15): publishableEntry(), settlementPending(), superseded(), ticketUnresolved(), syncing, TimeLedger, readBackTime(), clearUnsent() (+7 more)

### Community 139 - "DailyCTO.tsx"
Cohesion: 0.32
Nodes (8): CTOReview(), goalState, DailyCTO(), reportDate(), reviewStatus, InlineText(), ReviewText(), LoadingMark()

### Community 140 - "session-snapshot-cleanup.ts"
Cohesion: 0.40
Nodes (5): SNAPSHOT_PREFIX, removeStaleSessionSnapshots(), SNAPSHOT_SWEEP_MS, STALE_SNAPSHOT_MS, sweepStaleSessionSnapshots()

### Community 141 - "digest"
Cohesion: 0.13
Nodes (25): ownershipReadHistory(), pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), adoptCandidate(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent() (+17 more)

### Community 142 - "scheduler.ts"
Cohesion: 0.12
Nodes (15): Clock, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch(), deliveryOccupied() (+7 more)

### Community 144 - "reconcile-merges.cjs"
Cohesion: 0.22
Nodes (14): collectPulls(), copyWikiForDryRun(), { execFileSync }, flattenPages(), fs, githubRequest(), isWikiBotPull(), main() (+6 more)

### Community 145 - "ref_zod"
Cohesion: 0.13
Nodes (13): PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, Health, IdleObservation, IdleResult (+5 more)

### Community 146 - "artifact"
Cohesion: 0.10
Nodes (49): assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), reconcileCompletedConflictDraft(), routeReadyPostConflictPublication(), verifyInitialDraftConflictPreparation() (+41 more)

### Community 147 - "office/config.ts"
Cohesion: 0.13
Nodes (18): Document, document(), isAccessOnlyPlan(), settledAccessOnlyState(), continueAccessOnlyPlan(), entryExists(), INVOCATION_SOURCE_REFS, invocationSource() (+10 more)

### Community 148 - "runner-root.ts"
Cohesion: 0.22
Nodes (19): privateDirectories(), runnerPaths(), ancestry(), assertDirectoryOrAbsent(), checkDatabaseFiles(), CHECKOUT, checkOwnedFile(), code() (+11 more)

### Community 149 - "harnessEffect"
Cohesion: 0.12
Nodes (44): BLOCK, harnessBlockMove(), harnessParkedCard(), noted(), effectKey(), LaneOperation, laneWrite(), moveCardOnce() (+36 more)

### Community 150 - "serve-graph.cjs"
Cohesion: 0.24
Nodes (9): createServer(), fs, http, listen(), attempt(), main(), path, resolveRequest() (+1 more)

### Community 151 - "local-config.ts"
Cohesion: 0.15
Nodes (22): AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), githubPRDescription(), azureGoalFacts(), azurePRDescription(), boundedEvidence(), collectAzureGoalDocuments(), EvidenceStore (+14 more)

### Community 152 - "supersedingDelivery"
Cohesion: 0.32
Nodes (9): projectSlackDeliveries(), settleRequestedSlackReplacement(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint(), supersedingDelivery(), slackHealth() (+1 more)

### Community 153 - "project-binding-blocks.ts"
Cohesion: 0.19
Nodes (18): azureSchema, deploymentSchema, jiraSchema, ownJiraSchema, promptSchema, DEFAULT_STAGE_STATUSES, intakeStatus, resolvedStatuses() (+10 more)

### Community 154 - ".transaction"
Cohesion: 0.23
Nodes (6): featureById(), FeaturePublisher, publishFeature(), reconcilePublication(), reserveIdentity(), EffectUncertainError

### Community 155 - "recorded-gh-command.ts"
Cohesion: 0.19
Nodes (20): assignments(), changeDirectory(), closing(), CREATE, createGuard(), flags(), named(), read() (+12 more)

### Community 156 - "run.ts"
Cohesion: 0.16
Nodes (15): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationEvidence(), OFFICE_FIX_PROMPT, OfficeFixResult, validateOfficeFix(), officeSource(), InvestigationOptions (+7 more)

### Community 157 - "security.ts"
Cohesion: 0.15
Nodes (14): redactUnquoted(), BEARER_CREDENTIAL, escapedAt(), HEADER_CREDENTIAL, HEADER_OPERAND, HEADER_PREFIX, isJsonText(), POSTGRES_URL (+6 more)

### Community 158 - "it-report.ts"
Cohesion: 0.27
Nodes (10): followUpPicture(), publishITReport(), archiveOldReports(), RETAINED_REPORTS, archiveByMonth(), archiveHistory(), archiveMonth(), archiveOldTaskDetail() (+2 more)

### Community 160 - "proof-comment.ts"
Cohesion: 0.38
Nodes (12): commentId(), CommentIntent, CommentReceipt, conversation(), exact(), findProofComment(), matchesProofComment(), postProofComment() (+4 more)

### Community 161 - "delivery-ownership.ts"
Cohesion: 0.33
Nodes (4): Ownership, ownershipContext, refreshDeliveryOwnership(), RefreshOwnership

### Community 162 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 163 - "evidence-artifacts.ts"
Cohesion: 0.35
Nodes (9): ProviderEvidence, canonical(), evidenceDigest(), evidenceHash(), semantic(), stableUrl(), requirementDrift(), RequirementPostimage (+1 more)

### Community 164 - "redactEvidence"
Cohesion: 0.09
Nodes (47): sourceVersions(), inHistoryOf(), CompareMemory, compareMemory(), COMPARES_PER_PASS, comparison(), DeployedFixes, DeployedFixesInput (+39 more)

### Community 165 - "fix-identity.ts"
Cohesion: 0.33
Nodes (7): FixIdentity, onMain(), PULL, readFix(), OFFICE_REPOSITORY, readGitHub(), IncidentRepair

### Community 166 - "call-outcome.ts"
Cohesion: 0.42
Nodes (8): failed(), githubAuthError(), noCalls(), refusedByRateLimit(), revalidated, slurpedPages(), succeeded(), activeGitHubAccount()

### Community 167 - "moveLane"
Cohesion: 0.12
Nodes (25): moveLane(), ProjectProgress, candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf() (+17 more)

### Community 168 - "single-flight.ts"
Cohesion: 0.28
Nodes (8): realMachine(), acquirePassLock(), Owner, PassLock, PassOwner, PassRefused, pidAlive(), same()

### Community 169 - "deployment-fence.ts"
Cohesion: 0.16
Nodes (13): assertToken(), Body, DeploymentFence, DeploymentFenceState, fenceTokenDigest(), declaredWithin(), deploymentFenceGate(), DeploymentFenceGateContext (+5 more)

### Community 170 - "incident-command.ts"
Cohesion: 0.38
Nodes (6): FLAGS, incidentCommand(), IncidentCommandIO, option(), USAGE, whole()

### Community 171 - "release-floor.ts"
Cohesion: 0.33
Nodes (6): AS_COMMITTED, Execute, FloorReading, message(), readReleaseFloor(), RELEASE_FLOOR

### Community 172 - "intake-enumeration.ts"
Cohesion: 0.36
Nodes (8): enumerateIntakeList(), inPickupOrder(), Intake, text(), checkMail(), drainMail(), requestMail(), ingest()

### Community 176 - "validate_wiki_pr_body.cjs"
Cohesion: 0.33
Nodes (5): { execFileSync }, hasCanonicalWikiBody(), maintenanceBodies, matchesMaintenanceBody(), { readFileSync }

## Knowledge Gaps
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `worker-runtime.ts`, `features.ts`, `weekly-rollup.ts`, `OfficeSnapshot`, `features/commands.ts`, `admit-improvement.ts`, `github-readiness.ts`, `scheduled-captures.ts`, `run-retrospective.ts`, `record-trigger.ts`, `cec-reads.ts`, `github-delivery.ts`, `workKey`, `dependency-bots/adopt.ts`, `TicketJob`, `jira-time.ts`, `scope-repair-resume.ts`, `controller-runtime.ts`, `assertDeliveryMayMutate`, `metadata-admission.ts`, `currentAssignment`, `coordination.ts`, `scheduled-work.ts`, `project-holds.ts`, `assignments.ts`, `observe-github-merges.ts`, `time-scope.ts`, `coordination-pump.ts`, `.save`, `Offices`, `lesson-selection.ts`, `Ticket`, `api-routes.ts`, `investigations/ledger.ts`, `state-parts.ts`, `run-accounting.ts`, `ref_node_path`, `jira-attempts.ts`, `cost-ledger.ts`, `reader.ts`, `maintenance/maintenance.ts`, `resume-arrivals.ts`, `ticket-evidence.ts`, `retrospective-subject.ts`, `azure.ts`, `closeout-recovery.ts`, `agents.ts`, `session-bridge.ts`, `sanitize`, `restart-writer.ts`, `stopped-record.ts`, `conversations/conversations.ts`, `superseded-wiki-pr.ts`, `github-workflows.ts`, `project-bindings.ts`, `deploy.ts`, `ticket-stage-runner.ts`, `requests.ts`, `ref_node_crypto`, `.emit`, `continuation-evidence.ts`, `blocker-followups.ts`, `telemetry/report.ts`, `judge-resumes.ts`, `store.ts`, `notifications.ts`, `daily-cto.ts`, `shared.ts`, `sign-in-unpark.ts`, `http/commands.ts`, `holdReason`, `diagnostic-snapshot.ts`, `accessibility-sources.ts`, `harnessDelivers`, `alert-issue.ts`, `draft-provenance.ts`, `Effects`, `time-ledger.ts`, `digest`, `scheduler.ts`, `artifact`, `office/config.ts`, `harnessEffect`, `local-config.ts`, `supersedingDelivery`, `.transaction`, `run.ts`, `proof-comment.ts`, `evidence-artifacts.ts`, `redactEvidence`, `moveLane`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **Should `incidents/routes.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05818395533352924 - nodes in this community are weakly interconnected._
- **Why does `command()` connect `Store` to `incidents/routes.ts`, `worker-runtime.ts`, `features.ts`, `weekly-rollup.ts`, `accessibility-sources.ts`, `Effects`, `time-ledger.ts`, `admit-improvement.ts`, `github-readiness.ts`, `office/config.ts`, `github-delivery.ts`, `harnessEffect`, `TicketJob`, `workKey`, `jira-time.ts`, `controller-runtime.ts`, `assertDeliveryMayMutate`, `metadata-admission.ts`, `coordination.ts`, `command-registry.ts`, `redactEvidence`, `fix-identity.ts`, `moveLane`, `coordination-pump.ts`, `.save`, `release-floor.ts`, `ref_node_path`, `jira-attempts.ts`, `cost-ledger.ts`, `reader.ts`, `maintenance/maintenance.ts`, `ticket-evidence.ts`, `service-health.ts`, `azure.ts`, `closeout-recovery.ts`, `agents.ts`, `session-bridge.ts`, `resume-control.ts`, `restart-writer.ts`, `project-bindings.ts`, `change-scope.ts`, `deploy.ts`, `ticket-stage-runner.ts`, `call-scope.ts`, `requests.ts`, `ref_node_crypto`, `deploy-plan.ts`, `notifications.ts`, `deploy-command.ts`, `shared.ts`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Should `OrgChart.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12077294685990338 - nodes in this community are weakly interconnected._
- **Why does `OfficeSnapshot` connect `OfficeSnapshot` to `OrgChart.tsx`, `diagnostic-snapshot.ts`, `cx`, `harnessDelivers`, `index.tsx`, `TelemetryPanel.tsx`, `features/commands.ts`, `DailyCTO.tsx`, `App.tsx`, `record-trigger.ts`, `supersedingDelivery`, `Outbox.tsx`, `Store`, `it-report.ts`, `harness-baseline.ts`, `api-routes.ts`, `investigations/ledger.ts`, `projects.ts`, `state-parts.ts`, `ref_node_path`, `maintenance/maintenance.ts`, `MapView.tsx`, `resume-arrivals.ts`, `OfficeScene.tsx`, `follow-up-alerts.ts`, `service-health.ts`, `azure.ts`, `incidents.ts`, `stopped-record.ts`, `ticket-stage-runner.ts`, `requests.ts`, `.emit`, `work.ts`, `outbox.ts`, `judge-resumes.ts`, `store.ts`, `notifications.ts`, `Conversation.tsx`, `shared.ts`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Should `worker-runtime.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06144393241167435 - nodes in this community are weakly interconnected._
- **Should `features.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05120883304778222 - nodes in this community are weakly interconnected._