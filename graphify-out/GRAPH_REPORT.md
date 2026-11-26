# Graph Report - the-office  (2026-11-26)

## Corpus Check
- 1269 files · ~544,797 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 6671 nodes · 29091 edges · 172 communities (161 shown, 11 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 1037 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f1c96efe`
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
- timing/timing.ts
- offices.ts
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
- brain-maintenance.ts
- jira-time.ts
- assignment-context.ts
- Outbox.tsx
- controller-runtime.ts
- fact-bounds.ts
- park-writes.ts
- Store
- digest
- shared.ts
- index.ts
- coordination-pump.ts
- rate-limit-samples.ts
- common.cjs
- scheduled-work.ts
- routing.cjs
- redact-evidence.ts
- assignments.ts
- observe-github-merges.ts
- time-scope.ts
- effects.ts
- jiraBinding
- Offices
- harness-baseline.ts
- OfficeScene.tsx
- lesson-selection.ts
- cec.ts
- features/commands.ts
- FeatureWorkspace.tsx
- ledger.ts
- projects.ts
- state-parts.ts
- github/issue-publication.ts
- ref_node_child_process
- owned-artifact.ts
- pass.ts
- runner-state.ts
- time-readback.ts
- cost-ledger.ts
- service-plist.ts
- accessibility-sources.ts
- Button
- judge-resumes.ts
- validate_pr_body.cjs
- audit-plan-candidates.cjs
- office-client.ts
- ref_node_crypto
- ticket-evidence.ts
- constellation-runtime.ts
- .stage
- session-context-file.ts
- deploy-plan.ts
- session-scope.ts
- service-health.ts
- project-bindings.ts
- closeout-recovery.ts
- incidents.ts
- agents.ts
- session-bridge.ts
- Coordinator
- resume-control.ts
- follow-production.ts
- viewer.js
- restart-stopped-writers.ts
- stopped-record.ts
- conversations/conversations.ts
- .emit
- spawn-command.ts
- provider-observation.ts
- readable-jira-comment.ts
- session-context-client.ts
- plans.cjs
- quota-governor.ts
- capture-session-clone.py
- assignment.ts
- deploy.ts
- pilot-delivery.ts
- archive-plan.cjs
- call-outcome.ts
- workKey
- project-binding-blocks.ts
- on-merge-sync.cjs
- backup-stores.ts
- extract-worker.mjs
- release-manifest.ts
- assignment-poll.ts
- incident-command.ts
- stopped-base-validation.ts
- blocker-followups.ts
- report.ts
- outbox.ts
- work.ts
- slack-supersession.ts
- run-accounting.ts
- qa.ts
- qa-plan-continuation.ts
- writer-restart.ts
- restoreInPlace
- conversations/slack.ts
- ITFollowUps.tsx
- connectWith
- deploy-command.ts
- refresh-issue-state.cjs
- knowledge.ts
- remove-candidate.ts
- sign-in-unpark.ts
- run-evidence.ts
- call-ledger.ts
- pre-push-boundary.ts
- it-specialist.ts
- recovery-ledger.ts
- packed-consumer-pnpm.ts
- metadata-park-words.ts
- Effects
- run.ts
- GoalList.tsx
- session-snapshot-cleanup.ts
- ProjectProgress
- scheduler.ts
- production.ts
- reconcile-merges.cjs
- preferences-store.ts
- requests.ts
- sanitize
- runner-root.ts
- harnessEffect
- serve-graph.cjs
- Conversation.tsx
- node-visuals.ts
- goal-reviews.ts
- Ticket
- recorded-gh-command.ts
- scene-motion.ts
- it-report.ts
- routing.js
- interrupted-work-recovery.ts
- command-registry.ts
- continueAccessOnlyPlan
- redactEvidence
- RoomCamera.tsx
- dates.cjs
- GitHubDelivery
- ref_zod
- call-scope.ts
- intake-enumeration.ts
- context-failure-transport.ts
- validate_wiki_pr_body.cjs
- QuestionNotifications
- JiraWorklogTransport
- qa-plan-retry.ts

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
- `Admission` --references--> `AssignmentReview`  [EXTRACTED]
  server/delivery/intake/admission.ts → src/shared.ts

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

## Communities (172 total, 11 thin omitted)

### Community 0 - "incidents/routes.ts"
Cohesion: 0.06
Nodes (54): citationFault(), CitationSchema, SourceVersions, inHistoryOf(), dismiss(), DISMISSAL_CITATIONS, DISMISSAL_REASON, DismissalFacts (+46 more)

### Community 1 - "OrgChart.tsx"
Cohesion: 0.11
Nodes (39): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+31 more)

### Community 2 - "worker-runtime.ts"
Cohesion: 0.06
Nodes (48): candidateWorkspaceEnvironment(), assignmentSubject(), dispatchExposure(), prepareExposure(), LessonSelection, catalogLine(), assertBriefingScope(), clearUnblockBrief() (+40 more)

### Community 3 - "features.ts"
Cohesion: 0.06
Nodes (69): Assignment, Transition, descriptionPreimage(), plain(), approveFeature(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges() (+61 more)

### Community 4 - "cx"
Cohesion: 0.07
Nodes (99): Conversation(), SendMessage, blockedSummary(), ServiceHealthPanel(), followUp(), labels, ServiceHealthRow(), BlockerFollowups() (+91 more)

### Community 5 - "weekly-rollup.ts"
Cohesion: 0.05
Nodes (47): learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), BRAIN_SCOPE (+39 more)

### Community 6 - "budget-ledger.ts"
Cohesion: 0.06
Nodes (59): abandonExpired(), Admission, admit(), admitDeployment(), balance(), bindEvidence(), count(), errcode() (+51 more)

### Community 7 - "index.tsx"
Cohesion: 0.09
Nodes (49): LessonsView(), SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS, PickupForm() (+41 more)

### Community 8 - "OfficeSnapshot"
Cohesion: 0.08
Nodes (53): isFollowed(), jiraQueueProgress(), nextStage(), deliveryRoles, JiraQueueProgress, TicketProgress, OfficeSnapshot, STAGE_LABELS (+45 more)

### Community 9 - "timing/timing.ts"
Cohesion: 0.10
Nodes (32): TelemetryReport, displayAgentTask(), LiveAgentTask(), Props, RunningTask(), text(), AzureBuild, BreakdownTable() (+24 more)

### Community 10 - "offices.ts"
Cohesion: 0.08
Nodes (41): featureItemComplete(), reconcileFeatureCompletion(), discoveryPrompt(), planPrompt(), readEvidence(), helperTelemetry(), DELAYS, MAX_EXECUTIONS (+33 more)

### Community 11 - "overseer/commands.ts"
Cohesion: 0.17
Nodes (22): reconcile(), guardPresent(), overseerCommand(), reconcileArgs(), resolveCliRoot(), runnerStatus(), bounded(), ControlRead (+14 more)

### Community 12 - "App.tsx"
Cohesion: 0.05
Nodes (63): createConversationDrafts(), BrainDrawer(), themeColor, App(), BrainWorkspace, CONNECTION, CONNECTION_DOT, dockItemVariants (+55 more)

### Community 13 - "admit-improvement.ts"
Cohesion: 0.23
Nodes (14): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+6 more)

### Community 14 - "advance-metadata-park.ts"
Cohesion: 0.12
Nodes (39): BLOCK, ProjectCard, requireDeliveryAuthority(), advanceMetadataPark(), Parked, releaseWords(), sentAnything(), cardResumeRoute() (+31 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.08
Nodes (73): dispatchNightly(), requestDelivery(), accounting, DeliverySubject, nonDelivery, originalReads, Admission, admit() (+65 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.09
Nodes (46): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, BlockingTrigger, blockingTrigger(), isBlocking() (+38 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.08
Nodes (52): deliveryMetrics(), median(), baselined(), baselineLearning(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences() (+44 more)

### Community 18 - "setup-stop-cap.ts"
Cohesion: 0.09
Nodes (30): capacityInterruptedRun(), providerSaid(), rerunsInterruptedQA(), officeRefusedQA(), QA_STAGES, REFUSED_RECEIPT, RefusedQAResult, Run (+22 more)

### Community 19 - "github-delivery.ts"
Cohesion: 0.03
Nodes (159): writerRestartInstruction(), findingsBlock(), metadataCarriedAdvisoryIds(), ownedBefore(), QA_STAGES, reviewAdvisoryIds(), Reviewed, withoutReviewAdvisories() (+151 more)

### Community 20 - "artifact"
Cohesion: 0.05
Nodes (127): containedFile(), acceptStageResult(), acceptConflictRepair(), assertDraftClaimHistory(), linkDraftIssue(), protectedOriginalClaim(), publicationReadArgs(), Read (+119 more)

### Community 21 - "dependency-bots/adopt.ts"
Cohesion: 0.06
Nodes (64): Execute, readBackOrThrow(), AlertIssue, alertIssueBody(), alertIssueTitle(), alertMarker(), closeAlertIssue(), ensureAlertIssue() (+56 more)

### Community 22 - "brain-maintenance.ts"
Cohesion: 0.07
Nodes (36): maintenancePolicies(), completeNativeCheckpoint(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, brainResultStop(), BrainStatusSchema, identity (+28 more)

### Community 23 - "jira-time.ts"
Cohesion: 0.10
Nodes (45): attempted(), attemptState(), bound(), covers(), jiraAttempts(), JiraAttemptState, open(), provenNeverSent() (+37 more)

### Community 24 - "assignment-context.ts"
Cohesion: 0.08
Nodes (46): nextAttemptAt(), NOT_RETRYABLE, StoppedWriter, stoppedWriter(), WriterRestartCandidate, writerRestarted(), writerRestartPending(), deliveryAdmission() (+38 more)

### Community 25 - "Outbox.tsx"
Cohesion: 0.08
Nodes (45): knowledgeOutbox(), LessonDecisionAction, lessonDecisionState(), readLessonDecision(), DAYS, dueLessonDecisions(), easternWeek(), LESSON_DIGEST (+37 more)

### Community 26 - "controller-runtime.ts"
Cohesion: 0.12
Nodes (14): [cmd,...rawArgs], projectData(), StoreDatabase, controllerEffects(), alive(), ControllerMachine, option(), realMachine() (+6 more)

### Community 27 - "fact-bounds.ts"
Cohesion: 0.20
Nodes (17): leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance() (+9 more)

### Community 28 - "park-writes.ts"
Cohesion: 0.15
Nodes (36): activeMetadataPark(), finishMetadataPark(), startMetadataParkReadBack(), advanceHistoricalPark(), inspectMetadataPark(), recordMetadataParkIssueStop(), idle(), intentState() (+28 more)

### Community 29 - "Store"
Cohesion: 0.05
Nodes (23): externalPlanGap(), verifyFeatureEnhance(), GitHubFeaturePublisher, JiraFeaturePublisher, Link, linkFeature(), FeatureReviewRunner, featureRoute() (+15 more)

### Community 30 - "digest"
Cohesion: 0.07
Nodes (79): retryRead(), runHarnessStage(), harnessStageResult(), createdContentSha256(), Binding, historyBeforeWrite(), matchesBoundDescription(), DescriptionEdit (+71 more)

### Community 31 - "shared.ts"
Cohesion: 0.03
Nodes (123): GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles(), ContinuationIO (+115 more)

### Community 32 - "index.ts"
Cohesion: 0.05
Nodes (58): implementationPreview(), implementationContinuationRoute(), qaPlanRetryRoute(), incidentsRoute(), resumeSwitch(), close(), config, itSpecialist (+50 more)

### Community 33 - "coordination-pump.ts"
Cohesion: 0.11
Nodes (24): reconcileNoticeConfirmations(), ATTEMPT_DELAYS_MS, dependencyCompletionKey(), PrerequisitesSchema, classifyStop(), BrainFollowup, MAX_START_RETRIES, START_RETRY_MS (+16 more)

### Community 34 - "rate-limit-samples.ts"
Cohesion: 0.13
Nodes (12): bindGitHubRunner(), Runner, GitHubCalls, QuotaGovernor, iso(), RateLimitSamples, Reading, reading() (+4 more)

### Community 35 - "common.cjs"
Cohesion: 0.18
Nodes (22): connections(), fs, main(), path, crypto, ensureInside(), { execFileSync }, fs (+14 more)

### Community 36 - "scheduled-work.ts"
Cohesion: 0.07
Nodes (47): freshOwnershipRead(), deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), Ownership, ownershipContext, refreshDeliveryOwnership(), RefreshOwnership (+39 more)

### Community 37 - "routing.cjs"
Cohesion: 0.14
Nodes (27): main(), parseArgs(), usage(), adjacency(), edgeCost(), edgeKey(), edgeType(), EVIDENCE_TYPE_PRIORITY (+19 more)

### Community 38 - "redact-evidence.ts"
Cohesion: 0.09
Nodes (20): mailboxFreeze(), AFTER_LABEL, ASSIGNMENT, AWS_KEY_ID, BARE_CREDENTIAL, BARE_UNIT, BARE_VALUE, CAMEL_START (+12 more)

### Community 39 - "assignments.ts"
Cohesion: 0.06
Nodes (56): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, GraphNode (+48 more)

### Community 40 - "observe-github-merges.ts"
Cohesion: 0.28
Nodes (15): clearCooldown(), coolDown(), coolingDown(), MERGE_NOTICE_RECHECK_MS, waitKey(), waits, isMergeCommit(), issueOf() (+7 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.14
Nodes (27): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence(), CaptureContext (+19 more)

### Community 42 - "effects.ts"
Cohesion: 0.22
Nodes (20): drainDelivery(), startPilot(), eligibility(), approvedDelivery(), bindDelivery(), featureEffectGate(), assertFeatureGate(), bindFeature() (+12 more)

### Community 43 - "jiraBinding"
Cohesion: 0.11
Nodes (51): resolveBlockedTransition(), document(), transitionWithComment(), jiraAccount(), jiraCollection(), JiraCredential, jiraCredential(), KEYCHAIN_SERVICE (+43 more)

### Community 44 - "Offices"
Cohesion: 0.10
Nodes (7): CommittedBrain, file, project, root, InFlightOperations, projectById(), Offices

### Community 45 - "harness-baseline.ts"
Cohesion: 0.16
Nodes (22): BaselineReport, baselineReport(), BaselineSource, baselineText(), millions(), row(), share(), add() (+14 more)

### Community 46 - "OfficeScene.tsx"
Cohesion: 0.17
Nodes (33): withoutElapsed(), Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk() (+25 more)

### Community 47 - "lesson-selection.ts"
Cohesion: 0.12
Nodes (24): captureLearning(), recordLearningOpportunity(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), lessonText() (+16 more)

### Community 48 - "cec.ts"
Cohesion: 0.15
Nodes (18): movedHeadNote(), cecPrompt(), resolvedDecisionNote(), stageInstructions, stageInstructionsFor(), REVIEW_FINDINGS_RULE, waitText(), applies() (+10 more)

### Community 49 - "features/commands.ts"
Cohesion: 0.15
Nodes (28): commandFeature(), reviewQuestions(), automaticIntakeWait(), confirmBrief(), FeaturePlanningBindings, FeaturePlanningConfig, POLICY_VERSION, applyHarnessAction() (+20 more)

### Community 50 - "FeatureWorkspace.tsx"
Cohesion: 0.11
Nodes (29): FeatureQuestionProjection, OutboxQuestionRound(), send(), FeatureDelivery(), FeatureDocuments(), views, FeatureReading(), FeatureWorkspace() (+21 more)

### Community 51 - "ledger.ts"
Cohesion: 0.14
Nodes (23): failureOutranks(), acceptedCompletionResolution(), investigationCandidates(), investigationId(), ctoReplacementResolution(), finishedSubjectResolution(), investigationFollowUps(), investigationHeld() (+15 more)

### Community 52 - "projects.ts"
Cohesion: 0.09
Nodes (40): AUTO_ADOPT_BOTS, IntakeView, assertFeaturePlanningConfig(), goalEvidencePath(), LOCAL_BINDINGS, OfficeConfigInputs, projectSettingsSummary(), assertUniqueProjectKeys() (+32 more)

### Community 53 - "state-parts.ts"
Cohesion: 0.06
Nodes (40): comparableRow(), START_EVENT_KINDS, START_STATE_SHAPES, withoutStartValue(), withoutStartValues(), readSavedState(), LARGE_KEY_CHARS, plain() (+32 more)

### Community 54 - "github/issue-publication.ts"
Cohesion: 0.08
Nodes (20): contentSchema(), JiraIssuePublisher, jiraText(), publicationDescription(), featureById(), FeaturePublisher, PublicationReceipt, publishFeature() (+12 more)

### Community 55 - "ref_node_child_process"
Cohesion: 0.10
Nodes (22): changedPaths(), { execFileSync }, files, isMapInput(), mapOnly(), { execFileSync }, git(), publish() (+14 more)

### Community 56 - "owned-artifact.ts"
Cohesion: 0.20
Nodes (14): investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, NOTIFY_HELPER, notifyHelperResolution(), OFFICE_SOURCE_PATHS, officeSource() (+6 more)

### Community 57 - "pass.ts"
Cohesion: 0.15
Nodes (23): RunnerLimits, appendFailureLine(), Evidence, FAILURE_ID, FailureEvent, failureLine(), JournalRefused, JournalView (+15 more)

### Community 58 - "runner-state.ts"
Cohesion: 0.14
Nodes (19): at, EMPTY_STATE, IncidentSample, IncidentSummary, InFlight, Intent, JournalIntent, PASS_OUTCOMES (+11 more)

### Community 59 - "time-readback.ts"
Cohesion: 0.16
Nodes (14): JiraAttempt, JiraWorklogExpected, JiraWorklogReconcile, Ledger, Read, TimeLedger, missedSinceVerified(), Readback (+6 more)

### Community 60 - "cost-ledger.ts"
Cohesion: 0.12
Nodes (35): costLedger(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress(), effectId(), OutsideEdit, publishCost() (+27 more)

### Community 61 - "service-plist.ts"
Cohesion: 0.23
Nodes (14): ActiveRelease, readActiveRelease(), recordActive(), releaseCommitOf(), releasePaths(), renderPlist(), Execute, PlistSchema (+6 more)

### Community 62 - "accessibility-sources.ts"
Cohesion: 0.10
Nodes (36): accessibilitySources(), actionable(), closingPull(), Finding, handoffIssue(), issueLines(), issueSource(), observation (+28 more)

### Community 63 - "Button"
Cohesion: 0.06
Nodes (66): KnowledgeActivity, KnowledgeActivityPage, KnowledgeEdge, KnowledgeMap, KnowledgeNode, Activity(), ActivityTimeline(), AssignmentKnowledge() (+58 more)

### Community 64 - "judge-resumes.ts"
Cohesion: 0.08
Nodes (36): PacketInput, absent(), IncidentChange, IncidentLedger, isOpen(), Recorded, replayed(), judgeResumes() (+28 more)

### Community 65 - "validate_pr_body.cjs"
Cohesion: 0.36
Nodes (8): fs, main(), readableText(), REQUIRED_CHECKS, REQUIRED_SECTIONS, sections(), validatePullRequestBody(), withoutComments()

### Community 66 - "audit-plan-candidates.cjs"
Cohesion: 0.14
Nodes (31): audit(), branchIssueNumbers(), classify(), distinctiveTitleWords(), { execFileSync }, extractPaths(), findPrForMergeSubject(), fmtCommit() (+23 more)

### Community 67 - "office-client.ts"
Cohesion: 0.11
Nodes (26): DEFAULT_OFFICE_URL, LOOPBACK, officeUrl(), RUNNER_DEFAULTS, RunnerPaths, officeDataRoot, realMachine(), bodyWithin() (+18 more)

### Community 68 - "ref_node_crypto"
Cohesion: 0.11
Nodes (62): WRITER_STAGES, DeliveryAuthorityInput, validatePrerequisites(), canonical(), assessResumes(), Standing, CheckpointEligibility, checkpointEligibility() (+54 more)

### Community 69 - "ticket-evidence.ts"
Cohesion: 0.11
Nodes (32): jiraRecord(), assetDownloader(), attachmentKind(), evidenceDirectory(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS (+24 more)

### Community 70 - "constellation-runtime.ts"
Cohesion: 0.09
Nodes (21): CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point, ConstellationRuntime, createConstellation() (+13 more)

### Community 71 - ".stage"
Cohesion: 0.14
Nodes (18): implementationWorkerContext(), assertContinuableWorktree(), CONTINUABLE, continuationPrompt(), MAX_CONTINUATIONS, recordedContinuation(), StageContinuation, stageContinuation() (+10 more)

### Community 72 - "session-context-file.ts"
Cohesion: 0.27
Nodes (12): ContextFoldPrefix, contextFoldPrefix(), SessionContextCheckpoint, captureSessionContextClone(), sessionContextFile(), ContextReadChanged, MAX_CONTEXT_READ_MS, sameContextFile() (+4 more)

### Community 73 - "deploy-plan.ts"
Cohesion: 0.35
Nodes (12): fenceTokenDigest(), operationPaths(), planDeployment(), createDeployToken(), readDeployToken(), removeDeployToken(), publishDurable(), writeDurable() (+4 more)

### Community 74 - "session-scope.ts"
Cohesion: 0.20
Nodes (16): Bound, claudeScopeParser(), claudeSessionScope(), CODEX_ROLLOUTS, contextReaders(), retainSessionMessage(), SessionConversation, escaped() (+8 more)

### Community 75 - "service-health.ts"
Cohesion: 0.12
Nodes (22): quotaLow(), ClaudeLoginRefusal, claudeLoginRefusal(), claudeRefusalWords(), RECORDED_REFUSALS, refusedClaudeRow(), listenerHealth(), providers (+14 more)

### Community 76 - "project-bindings.ts"
Cohesion: 0.13
Nodes (22): prUrl(), ProviderPR, readAzurePRs(), fullActivePRs(), observation(), PRRead, nativeRead(), preflightPRs() (+14 more)

### Community 77 - "closeout-recovery.ts"
Cohesion: 0.11
Nodes (43): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+35 more)

### Community 78 - "incidents.ts"
Cohesion: 0.09
Nodes (45): attributedRecords(), foldsItsRun(), groupCandidates(), ObservedIncident, ObservedSubject, digest(), fingerprint(), incidentId() (+37 more)

### Community 79 - "agents.ts"
Cohesion: 0.06
Nodes (47): cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), plainResume(), readbackDispatchGuidance(), ownReceipts(), Receipt (+39 more)

### Community 80 - "session-bridge.ts"
Cohesion: 0.10
Nodes (30): codexDaemonProcesses(), accountCodexProcesses(), CodexProcessInventory, codexProcessInventory(), DesktopSessions, unaccountedProcesses(), codexThreadMetadata(), METADATA_CHUNK (+22 more)

### Community 82 - "resume-control.ts"
Cohesion: 0.24
Nodes (9): ResumeArrivalsInput, absent(), NEVER_ENABLED, ResumeControl, stated(), Stored, unreadable(), IncidentsRouteContext (+1 more)

### Community 83 - "follow-production.ts"
Cohesion: 0.21
Nodes (16): awaitingJiraStatus(), awaitingProduction(), FOLLOW_DAYS, followed(), Azure, AzureRead, containedIn(), followProduction() (+8 more)

### Community 84 - "viewer.js"
Cohesion: 0.19
Nodes (25): addMetaLink(), addMetaRow(), addRelationship(), applyView(), buildIndexes(), buildLegend(), buildModel(), buildRenderer() (+17 more)

### Community 85 - "restart-stopped-writers.ts"
Cohesion: 0.30
Nodes (10): restartStoppedWriters(), unchangedSinceAccepted(), releaseFunds(), writerRestartCandidate(), Execute, keptWork(), Read, refObject() (+2 more)

### Community 86 - "stopped-record.ts"
Cohesion: 0.06
Nodes (74): capabilityBlockedReviews(), latestReviews(), compatible(), dependencyEligibility(), DependencyStores, issueKey(), observePrerequisites(), PrerequisiteSchema (+66 more)

### Community 87 - "conversations/conversations.ts"
Cohesion: 0.09
Nodes (19): ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff(), saveGoals() (+11 more)

### Community 88 - ".emit"
Cohesion: 0.10
Nodes (33): decideImplementation(), requestQAPlanRetry(), channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), clamp() (+25 more)

### Community 89 - "spawn-command.ts"
Cohesion: 0.14
Nodes (22): exitFailure(), inactivityWatch(), At, Errno, errno(), GroupInventory, GroupProbe, Phase (+14 more)

### Community 90 - "provider-observation.ts"
Cohesion: 0.12
Nodes (28): az(), correlatedBuild(), Azure, azurePipelines(), outcome(), Read, RUNS_PER_PIPELINE, Api (+20 more)

### Community 91 - "readable-jira-comment.ts"
Cohesion: 0.20
Nodes (18): CommentPage, commentReadback(), devUpdate(), HEADLINE, postDevUpdate(), commentPayload(), JiraCommentIntent, postReadableComment() (+10 more)

### Community 92 - "session-context-client.ts"
Cohesion: 0.12
Nodes (16): claudeSessionContext(), readTranscript, codexSessionContext(), readRollout, ContextThread, contextThread(), postedProjects(), THREAD_ANSWER_MS (+8 more)

### Community 93 - "plans.cjs"
Cohesion: 0.12
Nodes (27): fs, main(), parse(), path, atomicWrite(), substantive(), walk(), association() (+19 more)

### Community 94 - "quota-governor.ts"
Cohesion: 0.31
Nodes (8): refusedByRateLimit(), CORE_RESERVE, noQuotaHold, PROBE_INTERVAL_MS, QuotaRefusal, quotaRefusal(), retryAfterMs(), ResourceReading

### Community 96 - "assignment.ts"
Cohesion: 0.13
Nodes (25): latestQA(), notPassedInLatestQA(), QACoverage, qaCoverage(), same(), Tested, stageResultGap(), safeWebUrl() (+17 more)

### Community 97 - "deploy.ts"
Cohesion: 0.10
Nodes (46): ControllerEffects, DEPLOY_PROJECT, abandon(), advance(), DeployContext, DeployTimings, DEPLOY_STEPS, append() (+38 more)

### Community 98 - "pilot-delivery.ts"
Cohesion: 0.09
Nodes (51): candidateBranchMoved(), applyChangeScope(), endChangeScope(), levels(), MAX_CHECKS, owedUnderScope(), scopeBase(), scopeOutgrown() (+43 more)

### Community 99 - "archive-plan.cjs"
Cohesion: 0.17
Nodes (22): fs, main(), parse(), path, archive(), cell(), ensureIndex(), fromArgs() (+14 more)

### Community 100 - "call-outcome.ts"
Cohesion: 0.19
Nodes (13): githubAuthError(), revalidated, slurpedPages(), succeeded(), endpoint(), GitHubCall, githubCall(), OPAQUE (+5 more)

### Community 101 - "workKey"
Cohesion: 0.11
Nodes (30): notOwned(), mergedByOwner(), closeableIssue(), effectsSettled(), eligible(), officePublished(), ownerMerged(), prerequisitesMet() (+22 more)

### Community 102 - "project-binding-blocks.ts"
Cohesion: 0.14
Nodes (26): escaped(), IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), intakeMembership(), projectListScope(), azureSchema (+18 more)

### Community 103 - "on-merge-sync.cjs"
Cohesion: 0.15
Nodes (28): fs, main(), path, { spawnSync }, fieldSpan(), frontmatterProblems(), keyPattern(), list() (+20 more)

### Community 104 - "backup-stores.ts"
Cohesion: 0.13
Nodes (28): absentAdmission(), AdmissionComparison, AdmissionSnapshot, compareAdmissions(), snapshotAdmissions(), BackupEntry, BackupInput, BackupInventory (+20 more)

### Community 105 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 106 - "release-manifest.ts"
Cohesion: 0.15
Nodes (20): runningRevision(), runningRevision(), runtimeRevision(), BUILD_ENV, buildRelease(), BuildReleaseOptions, Execute, pinnedVersions() (+12 more)

### Community 107 - "assignment-poll.ts"
Cohesion: 0.08
Nodes (42): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), currentOutbox(), admitReadyCards(), confirmedGone(), goneQuery(), STOPPED (+34 more)

### Community 108 - "incident-command.ts"
Cohesion: 0.38
Nodes (6): FLAGS, incidentCommand(), IncidentCommandIO, option(), USAGE, whole()

### Community 109 - "stopped-base-validation.ts"
Cohesion: 0.47
Nodes (8): continuationNativeReview(), assertStoppedBaseApproach(), stoppedBaseNextStage(), stoppedBasePackedCommands(), assertAcceptedFiles(), assertStoppedBaseMergeReady(), assertStoppedBaseValidation(), stoppedBaseStageProof()

### Community 110 - "blocker-followups.ts"
Cohesion: 0.11
Nodes (48): conversationReadbackReady(), followupOf(), pendingReadback(), queueConversationReadback(), readbackEnding(), uncertainConversations(), readBackConversations(), followupRecord() (+40 more)

### Community 111 - "report.ts"
Cohesion: 0.24
Nodes (14): TelemetryRow, TelemetrySync, Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount() (+6 more)

### Community 112 - "outbox.ts"
Cohesion: 0.09
Nodes (34): ctoInputIdentityMatches(), ctoInputRecovered(), metadataParkAction(), ADOPTION_STALLED_MS, conversationResolved(), projectOutbox(), item(), syncOutbox() (+26 more)

### Community 113 - "work.ts"
Cohesion: 0.06
Nodes (45): boundaryCrossed(), Crossing, Progress, CheckpointProgress, checkpointProgress(), names(), nativeProof(), Step (+37 more)

### Community 114 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 115 - "run-accounting.ts"
Cohesion: 0.05
Nodes (59): BoundedRead, add(), CodexRequest, CodexRollout, CodexTokens, FIELDS, codexHome(), createdAt() (+51 more)

### Community 119 - "restoreInPlace"
Cohesion: 0.60
Nodes (5): identity(), Json, plain(), restorable(), restoreInPlace()

### Community 120 - "conversations/slack.ts"
Cohesion: 0.09
Nodes (32): assertConversationReadback(), MergeNotifications, comparableSlackText(), finishSupersededReadback(), labelIsUrl(), projectSlackDeliveries(), dueSlackReread(), rereadUncertainSlack() (+24 more)

### Community 121 - "ITFollowUps.tsx"
Cohesion: 0.67
Nodes (4): itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps()

### Community 122 - "connectWith"
Cohesion: 0.38
Nodes (5): connectWith(), data(), envelope(), JiraWorklogs, WorklogSave

### Community 123 - "deploy-command.ts"
Cohesion: 0.07
Nodes (56): CONTROLLER_ENTRY, ControllerPin, Pin, pinnedController(), readControllerPin(), writeControllerPin(), controllerOf(), deployCommand() (+48 more)

### Community 124 - "refresh-issue-state.cjs"
Cohesion: 0.20
Nodes (19): advanceFence(), closingIssues(), githubRefs(), key(), normalizeGithubQuery(), normalizeRepository(), parseGithubQuery(), ref() (+11 more)

### Community 125 - "knowledge.ts"
Cohesion: 0.06
Nodes (44): normalizeStatement(), curateLesson(), Curation, CurationAction, mergeEvidence(), LessonBrainAudit, LessonBrainOverlap, decideOfficeProposal() (+36 more)

### Community 126 - "remove-candidate.ts"
Cohesion: 0.13
Nodes (26): recordCandidateCleanup(), interruptedRemoval(), maintenanceCandidate(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot() (+18 more)

### Community 127 - "sign-in-unpark.ts"
Cohesion: 0.16
Nodes (21): currentEnvironmentWait(), environmentWait(), hasPendingDelivery(), resumeAfterSignIn(), signInWait(), isSetupStop(), MAX_SIGN_IN_UNPARKS, waitingStep() (+13 more)

### Community 128 - "run-evidence.ts"
Cohesion: 0.67
Nodes (3): comparable(), EvidenceOutcome, recordRunEvidence()

### Community 129 - "call-ledger.ts"
Cohesion: 0.25
Nodes (10): add(), addSource(), busiest(), CallLedger, Entry, sourceRows(), Sources, CallCounts (+2 more)

### Community 130 - "pre-push-boundary.ts"
Cohesion: 0.23
Nodes (11): Event, exactCommand(), Invocation, localHookCommand(), one(), prePushRejection(), PushIdentity, retirementBoundary() (+3 more)

### Community 131 - "it-specialist.ts"
Cohesion: 0.19
Nodes (15): replacedReadback(), backgroundHold(), heldFor(), ITContext, recoveryHeld(), recoveryWait(), informationalRecovery(), ownAzureCheck() (+7 more)

### Community 132 - "recovery-ledger.ts"
Cohesion: 0.15
Nodes (19): savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), assignmentDiagnostics(), diagnosticContext(), diagnosticSnapshot(), nativeDeliveryResolved() (+11 more)

### Community 134 - "metadata-park-words.ts"
Cohesion: 0.19
Nodes (16): parksInJira(), OUTCOME, qaComment(), remote(), STAGE, plainWords(), tidy(), field() (+8 more)

### Community 137 - "Effects"
Cohesion: 0.20
Nodes (11): settleNotLanded(), GitHubOperations, assignedToJoe(), fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), tryReadyLessonIssue(), Wait (+3 more)

### Community 138 - "run.ts"
Cohesion: 0.21
Nodes (13): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, OFFICE_FIX_PROMPT, OfficeFixResult, validateOfficeFix(), investigationReady(), InvestigationOptions, InvestigationReport (+5 more)

### Community 139 - "GoalList.tsx"
Cohesion: 0.21
Nodes (13): goalState, goalKey(), GoalList(), card(), InlineText(), reviewExcerpt(), ReviewText(), useDrawerReturnRow() (+5 more)

### Community 140 - "session-snapshot-cleanup.ts"
Cohesion: 0.40
Nodes (5): SNAPSHOT_PREFIX, removeStaleSessionSnapshots(), SNAPSHOT_SWEEP_MS, STALE_SNAPSHOT_MS, sweepStaleSessionSnapshots()

### Community 142 - "scheduler.ts"
Cohesion: 0.10
Nodes (20): Clock, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch(), deliveryOccupied() (+12 more)

### Community 144 - "reconcile-merges.cjs"
Cohesion: 0.22
Nodes (14): collectPulls(), copyWikiForDryRun(), { execFileSync }, flattenPages(), fs, githubRequest(), isWikiBotPull(), main() (+6 more)

### Community 145 - "preferences-store.ts"
Cohesion: 0.19
Nodes (9): PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS, OfficePreferences (+1 more)

### Community 146 - "requests.ts"
Cohesion: 0.07
Nodes (69): continuationWorkerProof(), savedCandidateAdmission(), assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), reconcileCompletedConflictDraft() (+61 more)

### Community 147 - "sanitize"
Cohesion: 0.09
Nodes (34): AzureMonitor, buildUrl(), readInPairs(), GitHubMonitor, githubPRDescription(), azureGoalFacts(), azurePRDescription(), boundedEvidence() (+26 more)

### Community 148 - "runner-root.ts"
Cohesion: 0.23
Nodes (18): privateDirectories(), runnerPaths(), ancestry(), assertDirectoryOrAbsent(), CHECKOUT, checkOwnedFile(), code(), ensurePrivateDirectory() (+10 more)

### Community 149 - "harnessEffect"
Cohesion: 0.12
Nodes (44): harnessBlockMove(), harnessParkedCard(), noted(), effectKey(), LaneOperation, laneWrite(), moveCardOnce(), initialManualStart() (+36 more)

### Community 150 - "serve-graph.cjs"
Cohesion: 0.24
Nodes (9): createServer(), fs, http, listen(), attempt(), main(), path, resolveRequest() (+1 more)

### Community 151 - "Conversation.tsx"
Cohesion: 0.18
Nodes (13): ChatMarkdown(), ConversationDraft, isLessonDecision(), ChatMarkdown, MessageText(), blocker(), recommendedReply(), slackMessageStatus() (+5 more)

### Community 152 - "node-visuals.ts"
Cohesion: 0.20
Nodes (14): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+6 more)

### Community 153 - "goal-reviews.ts"
Cohesion: 0.13
Nodes (21): currentCitations(), Fact, NOT_CURRENT, PROVIDER_ERROR, applyGoalReview(), DailyResultSchema, DeliveryJob, EvidenceRefSchema (+13 more)

### Community 154 - "Ticket"
Cohesion: 0.18
Nodes (13): carriedNotRepeated(), changeScopeNote(), Scoped, JiraOperations, unpack(), Carried, findingsOwedToRetest(), missingRetestDispositions() (+5 more)

### Community 155 - "recorded-gh-command.ts"
Cohesion: 0.19
Nodes (20): assignments(), changeDirectory(), closing(), CREATE, createGuard(), flags(), named(), read() (+12 more)

### Community 156 - "scene-motion.ts"
Cohesion: 0.25
Nodes (15): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+7 more)

### Community 158 - "it-report.ts"
Cohesion: 0.25
Nodes (11): followUpPicture(), publishITReport(), archiveOldReports(), RETAINED_REPORTS, archiveByMonth(), archiveHistory(), archiveMonth(), archiveOldTaskDetail() (+3 more)

### Community 160 - "interrupted-work-recovery.ts"
Cohesion: 0.27
Nodes (9): interruptAdoptions(), legacy(), REMOVED_FIELDS, retireLegacyRecovery(), goalNoticeNeverDispatched(), maintenanceNoticeNeverDispatched(), checkpointOutcome(), Outcome (+1 more)

### Community 162 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 163 - "continueAccessOnlyPlan"
Cohesion: 0.48
Nodes (6): Document, document(), isAccessOnlyPlan(), settledAccessOnlyState(), continueAccessOnlyPlan(), entryExists()

### Community 164 - "redactEvidence"
Cohesion: 0.09
Nodes (45): sourceVersions(), CompareMemory, compareMemory(), COMPARES_PER_PASS, comparison(), DeployedFixes, DeployedFixesInput, recordDeployedFixes() (+37 more)

### Community 165 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (7): CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility, overlayEntranceDelays(), SceneOverlay()

### Community 166 - "dates.cjs"
Cohesion: 0.31
Nodes (12): today(), dateFromPlanBasename(), dateFromSessionPath(), evidenceDates(), fileMtimeDate(), fs, gitCommitDate(), inferPlanDate() (+4 more)

### Community 167 - "GitHubDelivery"
Cohesion: 0.05
Nodes (62): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+54 more)

### Community 169 - "ref_zod"
Cohesion: 0.15
Nodes (10): assertToken(), Body, DeploymentFence, DeploymentFenceState, DeploymentFenceGateContext, DeploymentFenceRouteContext, Health, IdleObservation (+2 more)

### Community 171 - "call-scope.ts"
Cohesion: 0.33
Nodes (9): failed(), boundGitHubRunner(), currentGitHubProject(), currentGitHubSource(), deliverySource(), githubCli(), scopes, STAGES (+1 more)

### Community 172 - "intake-enumeration.ts"
Cohesion: 0.36
Nodes (8): enumerateIntakeList(), inPickupOrder(), Intake, text(), checkMail(), drainMail(), requestMail(), ingest()

### Community 175 - "context-failure-transport.ts"
Cohesion: 0.29
Nodes (6): packContextFailure(), PackedContextFailure, unpackContextFailure(), ContextReadPhase, SessionContextDeadline, sessionInventoryFailureDetail()

### Community 176 - "validate_wiki_pr_body.cjs"
Cohesion: 0.33
Nodes (5): { execFileSync }, hasCanonicalWikiBody(), maintenanceBodies, matchesMaintenanceBody(), { readFileSync }

### Community 183 - "qa-plan-retry.ts"
Cohesion: 0.67
Nodes (3): QAPlanRetry, QAPlanRetryProof, QAPlanRetryRequest

## Knowledge Gaps
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `worker-runtime.ts`, `features.ts`, `weekly-rollup.ts`, `OfficeSnapshot`, `offices.ts`, `admit-improvement.ts`, `advance-metadata-park.ts`, `scheduled-captures.ts`, `run-retrospective.ts`, `record-trigger.ts`, `setup-stop-cap.ts`, `github-delivery.ts`, `artifact`, `dependency-bots/adopt.ts`, `brain-maintenance.ts`, `jira-time.ts`, `assignment-context.ts`, `controller-runtime.ts`, `fact-bounds.ts`, `park-writes.ts`, `digest`, `shared.ts`, `index.ts`, `coordination-pump.ts`, `scheduled-work.ts`, `assignments.ts`, `observe-github-merges.ts`, `time-scope.ts`, `effects.ts`, `jiraBinding`, `Offices`, `lesson-selection.ts`, `cec.ts`, `features/commands.ts`, `ledger.ts`, `state-parts.ts`, `github/issue-publication.ts`, `owned-artifact.ts`, `time-readback.ts`, `cost-ledger.ts`, `accessibility-sources.ts`, `judge-resumes.ts`, `ref_node_crypto`, `ticket-evidence.ts`, `.stage`, `project-bindings.ts`, `closeout-recovery.ts`, `agents.ts`, `session-bridge.ts`, `follow-production.ts`, `stopped-record.ts`, `conversations/conversations.ts`, `.emit`, `provider-observation.ts`, `readable-jira-comment.ts`, `deploy.ts`, `pilot-delivery.ts`, `workKey`, `assignment-poll.ts`, `stopped-base-validation.ts`, `blocker-followups.ts`, `run-accounting.ts`, `conversations/slack.ts`, `knowledge.ts`, `remove-candidate.ts`, `sign-in-unpark.ts`, `run-evidence.ts`, `it-specialist.ts`, `recovery-ledger.ts`, `Effects`, `run.ts`, `scheduler.ts`, `requests.ts`, `sanitize`, `harnessEffect`, `goal-reviews.ts`, `Ticket`, `scene-motion.ts`, `interrupted-work-recovery.ts`, `redactEvidence`, `GitHubDelivery`, `QuestionNotifications`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **Should `incidents/routes.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0649692712906058 - nodes in this community are weakly interconnected._
- **Why does `command()` connect `Store` to `incidents/routes.ts`, `worker-runtime.ts`, `features.ts`, `weekly-rollup.ts`, `Effects`, `offices.ts`, `scheduled-captures.ts`, `requests.ts`, `sanitize`, `github-delivery.ts`, `harnessEffect`, `artifact`, `brain-maintenance.ts`, `jira-time.ts`, `Ticket`, `controller-runtime.ts`, `digest`, `shared.ts`, `command-registry.ts`, `redactEvidence`, `GitHubDelivery`, `assignments.ts`, `jiraBinding`, `call-scope.ts`, `github/issue-publication.ts`, `time-readback.ts`, `cost-ledger.ts`, `service-plist.ts`, `accessibility-sources.ts`, `ticket-evidence.ts`, `.stage`, `service-health.ts`, `closeout-recovery.ts`, `agents.ts`, `session-bridge.ts`, `resume-control.ts`, `restart-stopped-writers.ts`, `stopped-record.ts`, `.emit`, `provider-observation.ts`, `readable-jira-comment.ts`, `deploy.ts`, `pilot-delivery.ts`, `release-manifest.ts`, `connectWith`, `deploy-command.ts`, `remove-candidate.ts`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Should `OrgChart.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11170212765957446 - nodes in this community are weakly interconnected._
- **Why does `OfficeSnapshot` connect `OfficeSnapshot` to `OrgChart.tsx`, `it-specialist.ts`, `recovery-ledger.ts`, `cx`, `weekly-rollup.ts`, `index.tsx`, `timing/timing.ts`, `App.tsx`, `scheduler.ts`, `record-trigger.ts`, `requests.ts`, `sanitize`, `Conversation.tsx`, `Outbox.tsx`, `fact-bounds.ts`, `scene-motion.ts`, `Store`, `it-report.ts`, `shared.ts`, `interrupted-work-recovery.ts`, `index.ts`, `redactEvidence`, `redact-evidence.ts`, `harness-baseline.ts`, `OfficeScene.tsx`, `features/commands.ts`, `FeatureWorkspace.tsx`, `ledger.ts`, `projects.ts`, `state-parts.ts`, `accessibility-sources.ts`, `Button`, `judge-resumes.ts`, `ref_node_crypto`, `service-health.ts`, `stopped-record.ts`, `assignment-poll.ts`, `outbox.ts`, `work.ts`, `conversations/slack.ts`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Should `worker-runtime.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05794556628621598 - nodes in this community are weakly interconnected._
- **Should `features.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.056687565308254965 - nodes in this community are weakly interconnected._