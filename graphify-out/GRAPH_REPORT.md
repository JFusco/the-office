# Graph Report - the-office  (2026-11-26)

## Corpus Check
- 1274 files · ~549,208 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 6744 nodes · 29268 edges · 176 communities (167 shown, 9 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 1046 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3a58efa7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- incidents.ts
- OrgChart.tsx
- worker-runtime.ts
- features.ts
- cx
- weekly-rollup.ts
- budget-ledger.ts
- index.tsx
- work-summary.ts
- TelemetryPanel.tsx
- .transaction
- overseer/commands.ts
- App.tsx
- admit-improvement.ts
- parked-card-refusal.ts
- scheduled-captures.ts
- run-retrospective.ts
- record-trigger.ts
- setup-stop-cap.ts
- github-delivery.ts
- GitHubDelivery
- dependency-bots/adopt.ts
- coordination-pump.ts
- jira-time.ts
- holdReason
- Outbox.tsx
- controller-runtime.ts
- fact-bounds.ts
- advance-metadata-park.ts
- Store
- digest
- ref_node_path
- index.ts
- coordination-tick.ts
- rate-limit-samples.ts
- common.cjs
- scheduled-work.ts
- routing.cjs
- github-readiness.ts
- assignments.ts
- observe-github-merges.ts
- time-scope.ts
- effects.ts
- jiraBinding
- Offices
- harness-baseline.ts
- credential-spans.ts
- lesson-selection.ts
- cec.ts
- ref_node_crypto
- QuestionStepper.tsx
- ledger.ts
- projects.ts
- state-parts.ts
- cec/issue-publication.ts
- ref_node_child_process
- run-accounting.ts
- pass.ts
- reader.ts
- jira-attempts.ts
- cost-ledger.ts
- task-briefing.ts
- accessibility-sources.ts
- Button
- judge-resumes.ts
- validate_pr_body.cjs
- audit-plan-candidates.cjs
- office-client.ts
- resume-arrivals.ts
- ticket-evidence.ts
- OfficeScene.tsx
- retrospective-subject.ts
- session-context-file.ts
- MaintenanceRun
- session-scope.ts
- service-health.ts
- sanitizeObject
- requests.ts
- subjectKey
- agents.ts
- session-bridge.ts
- Coordinator
- resume-control.ts
- follow-production.ts
- viewer.js
- restart-writer.ts
- stopped-record.ts
- sanitize
- notifications.ts
- spawn-command.ts
- provider-observation.ts
- Ticket
- session-context-client.ts
- plans.cjs
- quota-governor.ts
- capture-session-clone.py
- assignment.ts
- deploy.ts
- pilot-delivery.ts
- archive-plan.cjs
- call-scope.ts
- owner-merged-stopped.ts
- intent.ts
- on-merge-sync.cjs
- backup-stores.ts
- extract-worker.mjs
- deploy-plan.ts
- .emit
- work.ts
- accept-stage-result.ts
- blocker-followups.ts
- report.ts
- outbox.ts
- resume-outcome.ts
- slack-supersession.ts
- telemetry.ts
- qa.ts
- qa-plan-continuation.ts
- writer-restart.ts
- store.ts
- conversations/slack.ts
- ITFollowUps.tsx
- ControlStore
- deploy-command.ts
- refresh-issue-state.cjs
- knowledge.ts
- remove-candidate.ts
- sign-in-unpark.ts
- http/commands.ts
- call-ledger.ts
- pre-push-boundary.ts
- it-specialist.ts
- diagnostic-snapshot.ts
- continue-ownership-read.ts
- metadata-park-words.ts
- alert-issue.ts
- draft-provenance.ts
- Effects
- unsent-time.ts
- OfficeSnapshot
- session-snapshot-cleanup.ts
- admit-repair-waits.ts
- scheduler.ts
- production.ts
- reconcile-merges.cjs
- shared.ts
- artifact
- daily-cto.ts
- runner-root.ts
- harnessEffect
- serve-graph.cjs
- deferredPickup
- supersedingDelivery
- goal-reviews.ts
- inspector-props.ts
- recorded-gh-command.ts
- office-lessons.ts
- seeded-office-lessons.ts
- leadership.ts
- routing.js
- interrupted-work-recovery.ts
- delivery-ownership.ts
- command-registry.ts
- QuotaGovernor
- redactEvidence
- office-state-view.ts
- dates.cjs
- validate-stage.ts
- inventory-startup-wait.ts
- deployment-fence.ts
- live-reach.ts
- wait-idle.ts
- intake-enumeration.ts
- office-qa-handoff.ts
- validate_wiki_pr_body.cjs
- JiraWorklogTransport

## God Nodes (most connected - your core abstractions)
1. `Store` - 461 edges
2. `TicketJob` - 222 edges
3. `digest()` - 175 edges
4. `command()` - 155 edges
5. `holdReason()` - 141 edges
6. `GitHubDelivery` - 133 edges
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

## Communities (176 total, 9 thin omitted)

### Community 0 - "incidents.ts"
Cohesion: 0.06
Nodes (61): citationFault(), CitationSchema, SourceVersions, dismiss(), DISMISSAL_CITATIONS, DISMISSAL_REASON, DismissalFacts, DismissalRequest (+53 more)

### Community 1 - "OrgChart.tsx"
Cohesion: 0.11
Nodes (37): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+29 more)

### Community 2 - "worker-runtime.ts"
Cohesion: 0.06
Nodes (46): savedStageCompletion(), candidateWorkspaceEnvironment(), assignmentSubject(), clearUnblockBrief(), key(), saveUnblockBrief(), UnblockBrief, unblockBrief() (+38 more)

### Community 3 - "features.ts"
Cohesion: 0.05
Nodes (72): approveFeature(), featureById(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), artifactPath(), digest() (+64 more)

### Community 4 - "cx"
Cohesion: 0.09
Nodes (88): blockedSummary(), ServiceHealthPanel(), followUp(), labels, ServiceHealthRow(), BlockerFollowups(), LearningCoverage(), lessonsView() (+80 more)

### Community 5 - "weekly-rollup.ts"
Cohesion: 0.14
Nodes (26): learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), RollupResult (+18 more)

### Community 6 - "budget-ledger.ts"
Cohesion: 0.06
Nodes (59): abandonExpired(), Admission, admit(), admitDeployment(), balance(), bindEvidence(), count(), errcode() (+51 more)

### Community 7 - "index.tsx"
Cohesion: 0.13
Nodes (37): LessonsView(), SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS, PickupForm() (+29 more)

### Community 8 - "work-summary.ts"
Cohesion: 0.08
Nodes (43): jiraQueueProgress(), nextStage(), deliveryRoles, JiraQueueProgress, TicketProgress, STAGE_LABELS, STAGE_ROLE, deliveryRepairProjection() (+35 more)

### Community 9 - "TelemetryPanel.tsx"
Cohesion: 0.09
Nodes (43): TelemetryReport, displayAgentTask(), withoutElapsed(), LiveAgentTask(), Props, RunningTask(), text(), AzureBuild (+35 more)

### Community 10 - ".transaction"
Cohesion: 0.13
Nodes (32): featureItemComplete(), reconcileFeatureCompletion(), discoveryPrompt(), planPrompt(), helperTelemetry(), reserveReplacement(), stageBudget(), confirmBrief() (+24 more)

### Community 11 - "overseer/commands.ts"
Cohesion: 0.12
Nodes (29): guardPresent(), overseerCommand(), reconcileArgs(), resolveCliRoot(), runnerStatus(), bounded(), ControlRead, Halt (+21 more)

### Community 12 - "App.tsx"
Cohesion: 0.05
Nodes (64): createConversationDrafts(), BrainDrawer(), themeColor, App(), BrainWorkspace, CONNECTION, CONNECTION_DOT, dockItemVariants (+56 more)

### Community 13 - "admit-improvement.ts"
Cohesion: 0.25
Nodes (13): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+5 more)

### Community 14 - "parked-card-refusal.ts"
Cohesion: 0.48
Nodes (5): BLOCK, harnessBlockMove(), harnessParkedCard(), noted(), BoardUpdate

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.10
Nodes (62): requestDelivery(), accounting, DeliverySubject, nonDelivery, originalReads, createFeature(), assertEnrollable(), enrolled() (+54 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.15
Nodes (26): acceptRetrospective(), blockingTrigger(), isBlocking(), BrainOverlap, brainOverlap(), brainOverlapQuery(), clip(), fits() (+18 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.12
Nodes (34): baselined(), baselineLearning(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences(), clip(), maintenanceBlockedId() (+26 more)

### Community 18 - "setup-stop-cap.ts"
Cohesion: 0.11
Nodes (27): readbackDispatchGuidance(), waitText(), capacityInterruptedRun(), providerSaid(), rerunsInterruptedQA(), officeRefusedQA(), confirmSetupStopCap(), consecutiveSetupStops() (+19 more)

### Community 19 - "github-delivery.ts"
Cohesion: 0.04
Nodes (111): containedFile(), writerRestartInstruction(), ProjectProgress, removeAdoptedClone(), harnessCloseout(), PASSING, verifyMergeActions(), namedRepairIds() (+103 more)

### Community 20 - "GitHubDelivery"
Cohesion: 0.05
Nodes (79): pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), GitHubDelivery, adoptCandidate(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent() (+71 more)

### Community 21 - "dependency-bots/adopt.ts"
Cohesion: 0.10
Nodes (34): readBackOrThrow(), closesIssue(), linkPR(), dependabotPR(), ensureTrackingIssue(), findTrackingIssue(), ownTracking(), trackingIssueBody() (+26 more)

### Community 22 - "coordination-pump.ts"
Cohesion: 0.14
Nodes (17): maintenancePolicies(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, brainResultStop(), GateMark, gateMark(), MAX_START_RETRIES (+9 more)

### Community 23 - "jira-time.ts"
Cohesion: 0.11
Nodes (37): twgProfile(), unresolvedAttempts(), bindingOf(), connectWith(), data(), envelope(), finishVerifiedEffects(), JiraWorklogs (+29 more)

### Community 24 - "holdReason"
Cohesion: 0.07
Nodes (56): ownershipReadHistory(), StoppedWriter, deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, requireDeliveryAuthority(), deliveryIntakeBlocker() (+48 more)

### Community 25 - "Outbox.tsx"
Cohesion: 0.07
Nodes (42): ChatMarkdown(), Conversation(), ConversationDraft, LessonDecisionAction, lessonDecisionState(), readLessonDecision(), ChatMarkdown, MessageText() (+34 more)

### Community 26 - "controller-runtime.ts"
Cohesion: 0.10
Nodes (29): StoreDatabase, ControllerEffects, controllerEffects(), DEPLOY_PROJECT, alive(), ControllerMachine, option(), realMachine() (+21 more)

### Community 27 - "fact-bounds.ts"
Cohesion: 0.26
Nodes (14): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+6 more)

### Community 28 - "advance-metadata-park.ts"
Cohesion: 0.09
Nodes (68): advanceMetadataPark(), Parked, releaseWords(), sentAnything(), cardResumeRoute(), effectiveParkPickup(), PICKUP_ASSIGNEE, REVIEWABLE (+60 more)

### Community 29 - "Store"
Cohesion: 0.04
Nodes (22): jiraText(), JiraFeaturePublisher, FeatureReviewRunner, FeatureWorkflow, GitHubMonitor, validateGitHubIssue(), QuotaGate, ResumeProject (+14 more)

### Community 30 - "digest"
Cohesion: 0.07
Nodes (83): retryRead(), createdContentSha256(), Binding, historyBeforeWrite(), matchesBoundDescription(), DescriptionEdit, DescriptionHistory, DescriptionHistoryUnavailable (+75 more)

### Community 31 - "ref_node_path"
Cohesion: 0.05
Nodes (82): GitRead, nativeGitRead(), patchArgs, sourceCopyMatches(), interruptedImplementation(), verifyContinuationPreservation(), closedReadonlyPlan(), Document (+74 more)

### Community 32 - "index.ts"
Cohesion: 0.06
Nodes (52): implementationPreview(), implementationContinuationRoute(), qaPlanRetryRoute(), close(), config, itSpecialist, loadedRevision, offices (+44 more)

### Community 33 - "coordination-tick.ts"
Cohesion: 0.11
Nodes (23): reconcileNoticeConfirmations(), dependencyCompletionKey(), BrainStatusSchema, brainCheckpointCompletion(), coverageSchema, verified, PublishedPR, publishedWorkCleanedUp() (+15 more)

### Community 34 - "rate-limit-samples.ts"
Cohesion: 0.15
Nodes (12): CallLedger, bindGitHubRunner(), Runner, GitHubCalls, iso(), RateLimitSamples, Reading, reading() (+4 more)

### Community 35 - "common.cjs"
Cohesion: 0.18
Nodes (22): connections(), fs, main(), path, crypto, ensureInside(), { execFileSync }, fs (+14 more)

### Community 36 - "scheduled-work.ts"
Cohesion: 0.09
Nodes (43): freshOwnershipRead(), dueSlackReread(), rereadUncertainSlack(), runningRevision(), deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), withAmendmentOwnership() (+35 more)

### Community 37 - "routing.cjs"
Cohesion: 0.14
Nodes (27): main(), parseArgs(), usage(), adjacency(), edgeCost(), edgeKey(), edgeType(), EVIDENCE_TYPE_PRIORITY (+19 more)

### Community 38 - "github-readiness.ts"
Cohesion: 0.08
Nodes (60): findingsBlock(), observe(), settleOwnerMergedStopped(), approveMerge(), assertAutomationEffects(), automationMergePolicy(), observeAutomationMerge(), routeAutomationMerge() (+52 more)

### Community 39 - "assignments.ts"
Cohesion: 0.10
Nodes (26): assignmentKnowledge(), clip(), DEMAND_LIMIT, demandFacts(), DemandSection, key(), LessonKey, notes() (+18 more)

### Community 40 - "observe-github-merges.ts"
Cohesion: 0.28
Nodes (15): clearCooldown(), coolDown(), coolingDown(), MERGE_NOTICE_RECHECK_MS, waitKey(), waits, isMergeCommit(), issueOf() (+7 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.12
Nodes (31): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence(), CaptureContext (+23 more)

### Community 42 - "effects.ts"
Cohesion: 0.11
Nodes (34): dispatchNightly(), eligibility(), admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, compatible(), dependencyEligibility() (+26 more)

### Community 43 - "jiraBinding"
Cohesion: 0.11
Nodes (52): resolveBlockedTransition(), document(), transitionWithComment(), jiraAccount(), jiraCollection(), JiraCredential, jiraCredential(), KEYCHAIN_SERVICE (+44 more)

### Community 44 - "Offices"
Cohesion: 0.11
Nodes (5): QuestionNotifications, InFlightOperations, Offices, markCaptureStart(), DailyCTOSummary

### Community 45 - "harness-baseline.ts"
Cohesion: 0.15
Nodes (22): BaselineReport, baselineReport(), BaselineSource, baselineText(), millions(), row(), share(), add() (+14 more)

### Community 46 - "credential-spans.ts"
Cohesion: 0.06
Nodes (68): BareValue, bareValue(), deeperValueEnd(), ENDS, isSeparator(), plainEscape(), queryValue(), separatorEscapeAt() (+60 more)

### Community 47 - "lesson-selection.ts"
Cohesion: 0.15
Nodes (16): INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), LessonSelection, MAINTENANCE, MAX_LESSONS (+8 more)

### Community 48 - "cec.ts"
Cohesion: 0.12
Nodes (21): cecPrompt(), cecReconcilePrompt(), resolvedDecisionNote(), stageInstructions, stageInstructionsFor(), REVIEW_FINDINGS_RULE, applies(), interruptedRunNote() (+13 more)

### Community 49 - "ref_node_crypto"
Cohesion: 0.14
Nodes (26): packedConsumerPnpmRepair(), sha256(), commandFeature(), reviewQuestions(), automaticIntakeWait(), automaticTicketIntakeWait(), assertQuestionVisibility(), applyHarnessAction() (+18 more)

### Community 50 - "QuestionStepper.tsx"
Cohesion: 0.19
Nodes (18): FeatureQuestionProjection, OutboxQuestionRound(), send(), draftKey(), readDraft(), saveDraft(), QuestionRound(), nextQuestion() (+10 more)

### Community 51 - "ledger.ts"
Cohesion: 0.08
Nodes (44): acceptedCompletionResolution(), INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationCandidates(), investigationId(), ctoReplacementResolution(), investigationEvidence(), finishedSubjectResolution() (+36 more)

### Community 52 - "projects.ts"
Cohesion: 0.06
Nodes (65): escaped(), IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), projectListScope(), AUTO_ADOPT_BOTS, IntakeView (+57 more)

### Community 53 - "state-parts.ts"
Cohesion: 0.08
Nodes (28): readSavedState(), LARGE_KEY_CHARS, plain(), RedactedEntries, RedactedEntry, redactEntries(), joinParts(), PartRow (+20 more)

### Community 54 - "cec/issue-publication.ts"
Cohesion: 0.08
Nodes (24): Assignment, contentSchema(), JiraIssuePublisher, Transition, descriptionPreimage(), plain(), publicationDescription(), GitHubFeaturePublisher (+16 more)

### Community 55 - "ref_node_child_process"
Cohesion: 0.10
Nodes (22): changedPaths(), { execFileSync }, files, isMapInput(), mapOnly(), { execFileSync }, git(), publish() (+14 more)

### Community 56 - "run-accounting.ts"
Cohesion: 0.13
Nodes (29): BoundedRead, done(), readBoundedNoFollow(), readBoundedNoFollowSync(), reasonOf(), codexHome(), createdAt(), dayDirs() (+21 more)

### Community 57 - "pass.ts"
Cohesion: 0.07
Nodes (50): DEFAULT_OFFICE_URL, LOOPBACK, officeUrl(), RUNNER_DEFAULTS, RunnerLimits, RunnerPaths, appendFailureLine(), Evidence (+42 more)

### Community 58 - "reader.ts"
Cohesion: 0.10
Nodes (18): knowledgeActivity(), knowledgeActivityPage(), BrainGraph, BrainNote, BrainReader, CommittedBrain, GraphNode, GraphPage (+10 more)

### Community 59 - "jira-attempts.ts"
Cohesion: 0.11
Nodes (23): attempted(), attemptState(), bound(), covers(), JiraAttempt, jiraAttempts(), JiraAttemptState, open() (+15 more)

### Community 60 - "cost-ledger.ts"
Cohesion: 0.15
Nodes (27): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId(), OutsideEdit (+19 more)

### Community 61 - "task-briefing.ts"
Cohesion: 0.14
Nodes (22): committedNotePage(), guidanceExcerpt(), digest(), citations(), recordAcceptedKnowledge(), stageName(), knowledgeCitation(), lessonCitation() (+14 more)

### Community 62 - "accessibility-sources.ts"
Cohesion: 0.09
Nodes (39): captureMaintenanceStep(), accessibilitySources(), actionable(), closingPull(), Finding, handoffIssue(), issueLines(), issueSource() (+31 more)

### Community 63 - "Button"
Cohesion: 0.07
Nodes (64): KnowledgeActivity, KnowledgeActivityPage, KnowledgeEdge, KnowledgeMap, KnowledgeNode, Activity(), ActivityTimeline(), AssignmentKnowledge() (+56 more)

### Community 64 - "judge-resumes.ts"
Cohesion: 0.08
Nodes (29): absent(), IncidentLedger, isOpen(), recordIncidentEvent(), replayed(), judgeResumes(), JudgeResumesInput, Open (+21 more)

### Community 65 - "validate_pr_body.cjs"
Cohesion: 0.36
Nodes (8): fs, main(), readableText(), REQUIRED_CHECKS, REQUIRED_SECTIONS, sections(), validatePullRequestBody(), withoutComments()

### Community 66 - "audit-plan-candidates.cjs"
Cohesion: 0.14
Nodes (31): audit(), branchIssueNumbers(), classify(), distinctiveTitleWords(), { execFileSync }, extractPaths(), findPrForMergeSubject(), fmtCommit() (+23 more)

### Community 67 - "office-client.ts"
Cohesion: 0.22
Nodes (12): bodyWithin(), bounded(), Envelope, HealthReading, officeReader(), OfficeReadError, Release, RESET (+4 more)

### Community 68 - "resume-arrivals.ts"
Cohesion: 0.11
Nodes (64): canonical(), assessResumes(), checkpointEligibility(), admitAssignmentResume(), forAssignment(), admitCheckpointResume(), forCheckpoint(), admitResume() (+56 more)

### Community 69 - "ticket-evidence.ts"
Cohesion: 0.09
Nodes (38): absent(), candidateParent(), copySavedImplementation(), Saved, sha(), jiraRecord(), assetDownloader(), attachmentKind() (+30 more)

### Community 70 - "OfficeScene.tsx"
Cohesion: 0.04
Nodes (88): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), CameraPose, flightPose(), cameraTarget() (+80 more)

### Community 71 - "retrospective-subject.ts"
Cohesion: 0.11
Nodes (24): deliveryMetrics(), median(), ARTIFACT_LIMIT, clip(), LEDGER_STEPS, MAINTENANCE_LIMIT, maintenanceFacts(), maintenanceSubject() (+16 more)

### Community 72 - "session-context-file.ts"
Cohesion: 0.20
Nodes (14): ContextFoldPrefix, contextFoldPrefix(), SessionContextCheckpoint, captureSessionContextClone(), ContextReadPhase, SessionContextDeadline, sessionContextFile(), ContextReadChanged (+6 more)

### Community 73 - "MaintenanceRun"
Cohesion: 0.13
Nodes (22): CheckpointEligibility, completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), legacy, validateNativeContinuation() (+14 more)

### Community 74 - "session-scope.ts"
Cohesion: 0.18
Nodes (17): Bound, claudeScopeParser(), claudeSessionScope(), CLAUDE_TRANSCRIPTS, CODEX_ROLLOUTS, contextReaders(), retainSessionMessage(), SessionConversation (+9 more)

### Community 75 - "service-health.ts"
Cohesion: 0.09
Nodes (27): ClaudeLoginRefusal, claudeLoginRefusal(), claudeRefusalWords(), RECORDED_REFUSALS, refusedClaudeRow(), ServiceContext, DelayHistogram, LOOP_SAMPLE_MS (+19 more)

### Community 76 - "sanitizeObject"
Cohesion: 0.09
Nodes (37): az(), AzureMonitor, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs(), fullActivePRs() (+29 more)

### Community 77 - "requests.ts"
Cohesion: 0.06
Nodes (86): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+78 more)

### Community 78 - "subjectKey"
Cohesion: 0.07
Nodes (56): attributedRecords(), foldsItsRun(), groupCandidates(), ObservedIncident, ObservedSubject, digest(), fingerprint(), incidentId() (+48 more)

### Community 79 - "agents.ts"
Cohesion: 0.05
Nodes (50): implementationWorkerContext(), intakeMembership(), cecIntakePrompt(), cecReadbackPrompt(), cecTransitionPrompt(), plainResume(), RefusedQAResult, assertContinuableWorktree() (+42 more)

### Community 80 - "session-bridge.ts"
Cohesion: 0.10
Nodes (30): claudeSessionContext(), codexDaemonProcesses(), accountCodexProcesses(), CodexProcessInventory, codexProcessInventory(), DesktopSessions, unaccountedProcesses(), codexSessionContext() (+22 more)

### Community 82 - "resume-control.ts"
Cohesion: 0.26
Nodes (8): absent(), NEVER_ENABLED, ResumeControl, stated(), Stored, unreadable(), IncidentsRouteContext, ResumeSwitch

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
Cohesion: 0.08
Nodes (54): capabilityBlockedReviews(), latestReviews(), Admission, boundedEvidence(), expectedWait(), StopFacts, normalizeCause(), IncidentCollector (+46 more)

### Community 87 - "sanitize"
Cohesion: 0.06
Nodes (52): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+44 more)

### Community 88 - "notifications.ts"
Cohesion: 0.18
Nodes (14): ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR, plainSlackText() (+6 more)

### Community 89 - "spawn-command.ts"
Cohesion: 0.18
Nodes (17): inactivityWatch(), At, Errno, errno(), GroupInventory, GroupProbe, LifecycleDiagnostic, Phase (+9 more)

### Community 90 - "provider-observation.ts"
Cohesion: 0.13
Nodes (25): correlatedBuild(), Azure, azurePipelines(), outcome(), Read, RUNS_PER_PIPELINE, Api, githubWorkflows() (+17 more)

### Community 91 - "Ticket"
Cohesion: 0.10
Nodes (31): carriedNotRepeated(), changeScopeNote(), Scoped, CommentPage, commentReadback(), devUpdate(), HEADLINE, JiraOperations (+23 more)

### Community 92 - "session-context-client.ts"
Cohesion: 0.13
Nodes (18): readTranscript, readRollout, packContextFailure(), PackedContextFailure, unpackContextFailure(), LiveSession, ContextThread, contextThread() (+10 more)

### Community 93 - "plans.cjs"
Cohesion: 0.12
Nodes (27): fs, main(), parse(), path, atomicWrite(), substantive(), walk(), association() (+19 more)

### Community 94 - "quota-governor.ts"
Cohesion: 0.29
Nodes (8): backgroundHold(), CORE_RESERVE, noQuotaHold, PROBE_INTERVAL_MS, QuotaHold, quotaLow(), quotaDeferred(), listenerHealth()

### Community 96 - "assignment.ts"
Cohesion: 0.09
Nodes (35): latestQA(), notPassedInLatestQA(), QACoverage, qaCoverage(), same(), Tested, stagePrompt(), StagePromptInput (+27 more)

### Community 97 - "deploy.ts"
Cohesion: 0.13
Nodes (38): abandon(), advance(), DEPLOY_STEPS, DeployFacts, append(), assertNext(), DeployJournalView, DeployStepState (+30 more)

### Community 98 - "pilot-delivery.ts"
Cohesion: 0.06
Nodes (75): candidateBranchMoved(), applyChangeScope(), endChangeScope(), levels(), MAX_CHECKS, owedUnderScope(), scopeBase(), scopeOutgrown() (+67 more)

### Community 99 - "archive-plan.cjs"
Cohesion: 0.17
Nodes (22): fs, main(), parse(), path, archive(), cell(), ensureIndex(), fromArgs() (+14 more)

### Community 100 - "call-scope.ts"
Cohesion: 0.12
Nodes (27): failed(), githubAuthError(), refusedByRateLimit(), revalidated, slurpedPages(), succeeded(), boundGitHubRunner(), currentGitHubProject() (+19 more)

### Community 101 - "owner-merged-stopped.ts"
Cohesion: 0.17
Nodes (18): mergedByOwner(), closeableIssue(), effectsSettled(), eligible(), officePublished(), ownerMerged(), prerequisitesMet(), settle() (+10 more)

### Community 102 - "intent.ts"
Cohesion: 0.12
Nodes (18): savedImplementation(), sha(), sourceFiles(), ContinuationIO, nativeIO, assertOwnership(), ImplementationDecision, OwnershipRead (+10 more)

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
Cohesion: 0.10
Nodes (42): runningRevision(), runningRevision(), runtimeRevision(), ActiveRelease, readActiveRelease(), BUILD_ENV, buildRelease(), BuildReleaseOptions (+34 more)

### Community 107 - ".emit"
Cohesion: 0.06
Nodes (52): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), twgConnection(), currentOutbox(), confirmedGone(), goneQuery(), STOPPED (+44 more)

### Community 108 - "work.ts"
Cohesion: 0.13
Nodes (20): effectiveCause(), REPLACED, BLOCKED_CAUSES, blockedCauses(), NONE, projectReadiness(), ProjectReadiness, AssignmentResult (+12 more)

### Community 109 - "accept-stage-result.ts"
Cohesion: 0.14
Nodes (29): acceptStageResult(), deliveryNextStage(), pendingPreparationCheck(), assertDraftClaimHistory(), linkDraftIssue(), protectedOriginalClaim(), publicationReadArgs(), Read (+21 more)

### Community 110 - "blocker-followups.ts"
Cohesion: 0.11
Nodes (49): conversationReadbackReady(), followupOf(), pendingReadback(), queueConversationReadback(), readbackEnding(), uncertainConversations(), readBackConversations(), followupRecord() (+41 more)

### Community 111 - "report.ts"
Cohesion: 0.22
Nodes (15): TelemetryRow, TelemetrySync, Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount() (+7 more)

### Community 112 - "outbox.ts"
Cohesion: 0.16
Nodes (17): ctoInputIdentityMatches(), ctoInputRecovered(), metadataParkAction(), ADOPTION_STALLED_MS, conversationResolved(), projectOutbox(), item(), syncOutbox() (+9 more)

### Community 113 - "resume-outcome.ts"
Cohesion: 0.10
Nodes (29): FLAGS, incidentCommand(), IncidentCommandIO, option(), USAGE, whole(), boundaryCrossed(), Crossing (+21 more)

### Community 114 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 115 - "telemetry.ts"
Cohesion: 0.08
Nodes (33): add(), CodexRequest, CodexRollout, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens() (+25 more)

### Community 119 - "store.ts"
Cohesion: 0.07
Nodes (33): Clock, systemClock, DELIVERY_CONCURRENCY, file, project, root, projectById(), projectData() (+25 more)

### Community 120 - "conversations/slack.ts"
Cohesion: 0.11
Nodes (15): channelNoticeAuthorized(), MergeNotifications, slackVerifyPrompt(), comparableSlackText(), labelIsUrl(), SlackMessages, SlackRequestSchema, SlackResultSchema (+7 more)

### Community 121 - "ITFollowUps.tsx"
Cohesion: 0.67
Nodes (4): itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps()

### Community 122 - "ControlStore"
Cohesion: 0.18
Nodes (5): DailyCTO, Briefing, saveReviewBriefing(), ControlStore, DailyCTOReport

### Community 123 - "deploy-command.ts"
Cohesion: 0.08
Nodes (50): [cmd,...rawArgs], CONTROLLER_ENTRY, ControllerPin, Pin, pinnedController(), readControllerPin(), writeControllerPin(), controllerOf() (+42 more)

### Community 124 - "refresh-issue-state.cjs"
Cohesion: 0.20
Nodes (19): advanceFence(), closingIssues(), githubRefs(), key(), normalizeGithubQuery(), normalizeRepository(), parseGithubQuery(), ref() (+11 more)

### Community 125 - "knowledge.ts"
Cohesion: 0.06
Nodes (46): Accepted, RETROSPECTIVE_HISTORY, Shared, BLOCKING, BlockingTrigger, curateLesson(), Curation, CurationAction (+38 more)

### Community 126 - "remove-candidate.ts"
Cohesion: 0.14
Nodes (24): recordCandidateCleanup(), interruptedRemoval(), maintenanceCandidate(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot() (+16 more)

### Community 127 - "sign-in-unpark.ts"
Cohesion: 0.16
Nodes (21): currentEnvironmentWait(), environmentWait(), hasPendingDelivery(), resumeAfterSignIn(), signInWait(), isSetupStop(), MAX_SIGN_IN_UNPARKS, waitingStep() (+13 more)

### Community 128 - "http/commands.ts"
Cohesion: 0.19
Nodes (20): decideImplementation(), requestQAPlanRetry(), configureNotices(), noticeState(), retryRecipientLookup(), DiscoveryResumeInput, requeueWaitedImplement(), enqueueMetadataRecovery() (+12 more)

### Community 129 - "call-ledger.ts"
Cohesion: 0.27
Nodes (9): add(), addSource(), busiest(), Entry, sourceRows(), Sources, CallCounts, noCalls() (+1 more)

### Community 130 - "pre-push-boundary.ts"
Cohesion: 0.24
Nodes (11): Event, exactCommand(), Invocation, localHookCommand(), one(), prePushRejection(), PushIdentity, retirementBoundary() (+3 more)

### Community 131 - "it-specialist.ts"
Cohesion: 0.12
Nodes (24): replacedReadback(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), heldFor(), ITContext, recoveryHeld() (+16 more)

### Community 132 - "diagnostic-snapshot.ts"
Cohesion: 0.22
Nodes (12): assignmentDiagnostics(), diagnosticContext(), diagnosticSnapshot(), followUpPicture(), publishITReport(), nativeDeliveryResolved(), itAgent(), itDiagnostics() (+4 more)

### Community 133 - "continue-ownership-read.ts"
Cohesion: 0.21
Nodes (15): continueOwnershipRead(), expiredOwnershipRead(), handoffOwnership(), ReadbackOwnerDecision, ownershipReadGate(), ownershipReadState(), ownershipReadSource(), ReadOwnershipCandidate (+7 more)

### Community 134 - "metadata-park-words.ts"
Cohesion: 0.19
Nodes (16): parksInJira(), OUTCOME, qaComment(), remote(), STAGE, plainWords(), tidy(), field() (+8 more)

### Community 135 - "alert-issue.ts"
Cohesion: 0.21
Nodes (19): AlertIssue, alertIssueBody(), alertIssueTitle(), alertMarker(), closeAlertIssue(), ensureAlertIssue(), findAlertIssue(), Guard (+11 more)

### Community 136 - "draft-provenance.ts"
Cohesion: 0.20
Nodes (18): maintenanceVerifiedDraft(), returnDraftToPromotion(), DraftProvenance, draftStep(), draftWorker(), MaintenanceDraft, maintenanceDraftProvenance(), nativeBash() (+10 more)

### Community 137 - "Effects"
Cohesion: 0.14
Nodes (21): settleNotLanded(), defaultPickupStatus(), GitHubOperations, assignedToJoe(), fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), firstLane() (+13 more)

### Community 138 - "unsent-time.ts"
Cohesion: 0.20
Nodes (14): publishableEntry(), settlementPending(), superseded(), ticketUnresolved(), TimeLedger, readBackTime(), clearUnsent(), dueUnsent() (+6 more)

### Community 139 - "OfficeSnapshot"
Cohesion: 0.07
Nodes (42): OutboxSavedImplementation(), apply(), review(), FeatureDelivery(), FeatureDocuments(), views, FeatureReading(), FeatureWorkspace() (+34 more)

### Community 140 - "session-snapshot-cleanup.ts"
Cohesion: 0.40
Nodes (5): SNAPSHOT_PREFIX, removeStaleSessionSnapshots(), SNAPSHOT_SWEEP_MS, STALE_SNAPSHOT_MS, sweepStaleSessionSnapshots()

### Community 141 - "admit-repair-waits.ts"
Cohesion: 0.19
Nodes (15): admitRepairWaits(), Covered, COVERING, expiryEvent(), expiryId(), lastProgress(), progressOf(), RepairWaitEntry (+7 more)

### Community 142 - "scheduler.ts"
Cohesion: 0.16
Nodes (15): OfficeCapacity, PROJECT_LOCAL, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch() (+7 more)

### Community 144 - "reconcile-merges.cjs"
Cohesion: 0.22
Nodes (14): collectPulls(), copyWikiForDryRun(), { execFileSync }, flattenPages(), fs, githubRequest(), isWikiBotPull(), main() (+6 more)

### Community 145 - "shared.ts"
Cohesion: 0.08
Nodes (26): applyIntakeObservation(), OwnerStepItem, ownerStepItems(), signIn(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore (+18 more)

### Community 146 - "artifact"
Cohesion: 0.10
Nodes (53): assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), reconcileCompletedConflictDraft(), routeReadyPostConflictPublication(), verifyInitialDraftConflictPreparation() (+45 more)

### Community 147 - "daily-cto.ts"
Cohesion: 0.23
Nodes (8): EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), reviewWeekday(), queueGoalEvidenceRequest(), SeenReports, WAITING, waitingReport()

### Community 148 - "runner-root.ts"
Cohesion: 0.22
Nodes (19): privateDirectories(), runnerPaths(), ancestry(), assertDirectoryOrAbsent(), checkDatabaseFiles(), CHECKOUT, checkOwnedFile(), code() (+11 more)

### Community 149 - "harnessEffect"
Cohesion: 0.15
Nodes (38): effectKey(), LaneOperation, laneWrite(), moveCardOnce(), initialManualStart(), Lane, MOVABLE, moveLane() (+30 more)

### Community 150 - "serve-graph.cjs"
Cohesion: 0.24
Nodes (9): createServer(), fs, http, listen(), attempt(), main(), path, resolveRequest() (+1 more)

### Community 151 - "deferredPickup"
Cohesion: 0.22
Nodes (11): DAYS, dueLessonDecisions(), easternWeek(), isLessonDecision(), LESSON_DIGEST, LessonDecision, PARTS, pendingLessonDecisions() (+3 more)

### Community 152 - "supersedingDelivery"
Cohesion: 0.32
Nodes (9): projectSlackDeliveries(), settleRequestedSlackReplacement(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint(), supersedingDelivery(), slackHealth() (+1 more)

### Community 153 - "goal-reviews.ts"
Cohesion: 0.18
Nodes (16): currentCitations(), Fact, NOT_CURRENT, PROVIDER_ERROR, applyGoalReview(), DailyResultSchema, DeliveryJob, EvidenceRefSchema (+8 more)

### Community 154 - "inspector-props.ts"
Cohesion: 0.22
Nodes (11): SendMessage, acceptPreferences(), PreferenceCandidate, strip(), UNKNOWN_PREFERENCES, OfficePreferencesController, PreferenceFeedback, PreferenceField (+3 more)

### Community 155 - "recorded-gh-command.ts"
Cohesion: 0.19
Nodes (20): assignments(), changeDirectory(), closing(), CREATE, createGuard(), flags(), named(), read() (+12 more)

### Community 156 - "office-lessons.ts"
Cohesion: 0.28
Nodes (7): normalizeStatement(), mirrorOfficeKnowledge(), OfficeKnowledgeStore, proposeOfficeLessons(), Input, promoteNoteLesson(), OfficeKnowledge

### Community 157 - "seeded-office-lessons.ts"
Cohesion: 0.32
Nodes (5): CONSOLIDATED, CONSOLIDATED_AT, SEEDS, seedOfficeLessons(), SEEDS

### Community 158 - "leadership.ts"
Cohesion: 0.29
Nodes (6): DailyCTOBriefing, DailyCTOResult, GoalEvidenceRef, GoalEvidenceRequest, GoalProgress, GoalStatus

### Community 160 - "interrupted-work-recovery.ts"
Cohesion: 0.27
Nodes (9): interruptAdoptions(), legacy(), REMOVED_FIELDS, retireLegacyRecovery(), goalNoticeNeverDispatched(), maintenanceNoticeNeverDispatched(), checkpointOutcome(), Outcome (+1 more)

### Community 161 - "delivery-ownership.ts"
Cohesion: 0.33
Nodes (4): Ownership, ownershipContext, refreshDeliveryOwnership(), RefreshOwnership

### Community 162 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 164 - "redactEvidence"
Cohesion: 0.10
Nodes (42): sourceVersions(), inHistoryOf(), CompareMemory, compareMemory(), COMPARES_PER_PASS, comparison(), DeployedFixes, DeployedFixesInput (+34 more)

### Community 165 - "office-state-view.ts"
Cohesion: 0.60
Nodes (4): leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore()

### Community 166 - "dates.cjs"
Cohesion: 0.31
Nodes (12): today(), dateFromPlanBasename(), dateFromSessionPath(), evidenceDates(), fileMtimeDate(), fs, gitCommitDate(), inferPlanDate() (+4 more)

### Community 167 - "validate-stage.ts"
Cohesion: 0.17
Nodes (17): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+9 more)

### Community 168 - "inventory-startup-wait.ts"
Cohesion: 0.40
Nodes (5): ALWAYS, HEADED, inventoryStartupWait(), readsInventory(), STARTUP_WAIT_REASON

### Community 169 - "deployment-fence.ts"
Cohesion: 0.29
Nodes (5): assertToken(), Body, DeploymentFence, DeploymentFenceState, fenceTokenDigest()

### Community 170 - "live-reach.ts"
Cohesion: 0.47
Nodes (5): GIT_NETWORK, LIVE_PROVIDERS, liveReach(), networkUrl(), remoteUrls()

### Community 171 - "wait-idle.ts"
Cohesion: 0.40
Nodes (4): Health, IdleObservation, IdleResult, WaitIdleInput

### Community 172 - "intake-enumeration.ts"
Cohesion: 0.36
Nodes (8): enumerateIntakeList(), inPickupOrder(), Intake, text(), checkMail(), drainMail(), requestMail(), ingest()

### Community 173 - "office-qa-handoff.ts"
Cohesion: 0.60
Nodes (4): OfficeQAHandoff, OfficeQAHandoffInput, OfficeQAHandoffRequest, QAOwnershipProof

### Community 176 - "validate_wiki_pr_body.cjs"
Cohesion: 0.33
Nodes (5): { execFileSync }, hasCanonicalWikiBody(), maintenanceBodies, matchesMaintenanceBody(), { readFileSync }

## Knowledge Gaps
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `worker-runtime.ts`, `features.ts`, `weekly-rollup.ts`, `.transaction`, `admit-improvement.ts`, `parked-card-refusal.ts`, `scheduled-captures.ts`, `run-retrospective.ts`, `record-trigger.ts`, `setup-stop-cap.ts`, `github-delivery.ts`, `GitHubDelivery`, `dependency-bots/adopt.ts`, `coordination-pump.ts`, `jira-time.ts`, `holdReason`, `controller-runtime.ts`, `advance-metadata-park.ts`, `digest`, `ref_node_path`, `index.ts`, `coordination-tick.ts`, `scheduled-work.ts`, `github-readiness.ts`, `assignments.ts`, `observe-github-merges.ts`, `time-scope.ts`, `effects.ts`, `jiraBinding`, `Offices`, `lesson-selection.ts`, `cec.ts`, `ref_node_crypto`, `ledger.ts`, `state-parts.ts`, `cec/issue-publication.ts`, `run-accounting.ts`, `reader.ts`, `jira-attempts.ts`, `cost-ledger.ts`, `task-briefing.ts`, `accessibility-sources.ts`, `judge-resumes.ts`, `resume-arrivals.ts`, `ticket-evidence.ts`, `retrospective-subject.ts`, `MaintenanceRun`, `sanitizeObject`, `requests.ts`, `subjectKey`, `agents.ts`, `session-bridge.ts`, `follow-production.ts`, `restart-writer.ts`, `sanitize`, `notifications.ts`, `provider-observation.ts`, `Ticket`, `assignment.ts`, `pilot-delivery.ts`, `owner-merged-stopped.ts`, `intent.ts`, `.emit`, `accept-stage-result.ts`, `blocker-followups.ts`, `store.ts`, `conversations/slack.ts`, `knowledge.ts`, `remove-candidate.ts`, `sign-in-unpark.ts`, `http/commands.ts`, `it-specialist.ts`, `diagnostic-snapshot.ts`, `continue-ownership-read.ts`, `alert-issue.ts`, `draft-provenance.ts`, `Effects`, `unsent-time.ts`, `OfficeSnapshot`, `admit-repair-waits.ts`, `scheduler.ts`, `artifact`, `harnessEffect`, `supersedingDelivery`, `goal-reviews.ts`, `office-lessons.ts`, `interrupted-work-recovery.ts`, `office-state-view.ts`, `validate-stage.ts`, `inventory-startup-wait.ts`?**
  _High betweenness centrality (0.108) - this node is a cross-community bridge._
- **Should `incidents.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.060833902939166094 - nodes in this community are weakly interconnected._
- **Why does `command()` connect `Store` to `incidents.ts`, `worker-runtime.ts`, `features.ts`, `continue-ownership-read.ts`, `weekly-rollup.ts`, `Effects`, `.transaction`, `scheduled-captures.ts`, `github-delivery.ts`, `GitHubDelivery`, `harnessEffect`, `coordination-pump.ts`, `jira-time.ts`, `controller-runtime.ts`, `digest`, `ref_node_path`, `coordination-tick.ts`, `command-registry.ts`, `redactEvidence`, `github-readiness.ts`, `validate-stage.ts`, `effects.ts`, `jiraBinding`, `cec/issue-publication.ts`, `reader.ts`, `jira-attempts.ts`, `cost-ledger.ts`, `accessibility-sources.ts`, `ticket-evidence.ts`, `service-health.ts`, `sanitizeObject`, `requests.ts`, `agents.ts`, `session-bridge.ts`, `resume-control.ts`, `restart-writer.ts`, `notifications.ts`, `provider-observation.ts`, `Ticket`, `pilot-delivery.ts`, `call-scope.ts`, `deploy-plan.ts`, `accept-stage-result.ts`, `deploy-command.ts`, `remove-candidate.ts`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Should `OrgChart.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11304347826086956 - nodes in this community are weakly interconnected._
- **Why does `OfficeSnapshot` connect `OfficeSnapshot` to `OrgChart.tsx`, `it-specialist.ts`, `diagnostic-snapshot.ts`, `cx`, `index.tsx`, `work-summary.ts`, `TelemetryPanel.tsx`, `App.tsx`, `shared.ts`, `github-delivery.ts`, `deferredPickup`, `supersedingDelivery`, `Outbox.tsx`, `inspector-props.ts`, `Store`, `interrupted-work-recovery.ts`, `index.ts`, `office-state-view.ts`, `Offices`, `harness-baseline.ts`, `ref_node_crypto`, `ledger.ts`, `projects.ts`, `state-parts.ts`, `accessibility-sources.ts`, `Button`, `judge-resumes.ts`, `resume-arrivals.ts`, `OfficeScene.tsx`, `MaintenanceRun`, `service-health.ts`, `sanitizeObject`, `requests.ts`, `subjectKey`, `restart-writer.ts`, `stopped-record.ts`, `sanitize`, `quota-governor.ts`, `.emit`, `work.ts`, `outbox.ts`, `resume-outcome.ts`, `store.ts`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Should `worker-runtime.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06013986013986014 - nodes in this community are weakly interconnected._
- **Should `features.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05422100205902539 - nodes in this community are weakly interconnected._