# Graph Report - the-office  (2026-11-26)

## Corpus Check
- 1319 files · ~583,015 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 7187 nodes · 31029 edges · 175 communities (165 shown, 10 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 1073 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `20c85363`
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
- work-summary.ts
- TelemetryPanel.tsx
- features/commands.ts
- overseer/commands.ts
- App.tsx
- admit-improvement.ts
- github-readiness.ts
- scheduled-captures.ts
- run-retrospective.ts
- record-trigger.ts
- launch.mjs
- StageResult
- activation-recovery.ts
- overseer-launch.mjs
- GitHubDelivery
- jira-time.ts
- admission.ts
- outbox.ts
- controller-runtime.ts
- fact-bounds.ts
- advance-metadata-park.ts
- MaintenanceRun
- metadata-context.ts
- verifyRepairCandidate
- offices.ts
- owned-artifact.ts
- rate-limit-samples.ts
- wiki-graph.cjs
- scheduled-work.ts
- routing.cjs
- github-context.ts
- assignments.ts
- requests.ts
- time-scope.ts
- reader.ts
- .save
- Offices
- harness-baseline.ts
- credential-spans.ts
- deployed-fixes.ts
- cec.ts
- index.ts
- FeatureWorkspace.tsx
- run.ts
- investigations/ledger.ts
- ref_node_sqlite
- cec/issue-publication.ts
- github-delivery.ts
- dependency-bots/adopt.ts
- pass.ts
- store.ts
- time-readback.ts
- cost-ledger.ts
- lesson-selection.ts
- maintenance/maintenance.ts
- Button
- constellation-runtime.ts
- validate_pr_body.cjs
- audit-plan-candidates.cjs
- office-client.ts
- resume-arrivals.ts
- ticket-evidence.ts
- OfficeScene.tsx
- retrospective-subject.ts
- session-context-file.ts
- ServiceHealthPanel.tsx
- session-scope.ts
- service-health.ts
- sanitizeObject
- continuation-evidence.ts
- incidents.ts
- agents.ts
- session-bridge.ts
- Coordinator
- resume-control.ts
- follow-production.ts
- viewer.js
- restart-writer.ts
- stopped-record.ts
- sanitize
- superseded-wiki-pr.ts
- ref_node_child_process
- provider-observation.ts
- Ticket
- session-context-client.ts
- plans.cjs
- quota-governor.ts
- capture-session-clone.py
- change-scope.ts
- deploy.ts
- pilot-delivery.ts
- archive-plan.cjs
- call-scope.ts
- accessibility-sources.ts
- http/commands.ts
- on-merge-sync.cjs
- backup-stores.ts
- extract-worker.mjs
- deploy-plan.ts
- .emit
- work.ts
- pr-observation-graphql.ts
- handoff-admission.ts
- time-ledger.ts
- notifications.ts
- judge-resumes.ts
- slack-supersession.ts
- run-accounting.ts
- qa.ts
- qa-plan-continuation.ts
- writer-restart.ts
- restoreInPlace
- conversations/slack.ts
- intake-enumeration.ts
- daily-cto.ts
- deploy-command.ts
- refresh-issue-state.cjs
- knowledge.ts
- shared.ts
- sign-in-unpark.ts
- interrupted-work-recovery.ts
- metadata-admission.ts
- pre-push-boundary.ts
- holdReason
- alert-issue.ts
- pr-observation-shape.ts
- artifact
- digest
- ref_node_path
- Effects
- proof-comment.ts
- OfficeSnapshot
- validate-stage.ts
- coordination.ts
- scheduler.ts
- production.ts
- reconcile-merges.cjs
- blocker-followups.ts
- preparation-readback.ts
- Store
- runner-root.ts
- project-graphql.ts
- common.cjs
- coordination-pump.ts
- CommandRegistry
- ref_zod
- features.ts
- recorded-gh-command.ts
- continue-access-only-plan.ts
- stop-service.ts
- diagnostic-snapshot.ts
- routing.js
- evidence.ts
- connectWith
- retire-backlogged.ts
- merge-scanner-retry.ts
- redactEvidence
- conversation-recovery.ts
- jira-attempts.ts
- TicketJob
- release-unpark.ts
- DeploymentFence
- QuestionNotifications
- release-manifest.ts
- delivery-ownership.ts
- session-snapshot-cleanup.ts
- InFlightOperations

## God Nodes (most connected - your core abstractions)
1. `Store` - 469 edges
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

## Communities (175 total, 10 thin omitted)

### Community 0 - "incidents/routes.ts"
Cohesion: 0.07
Nodes (57): citationFault(), CitationSchema, SourceVersions, sourceVersions(), dismiss(), DISMISSAL_CITATIONS, DISMISSAL_REASON, DismissalFacts (+49 more)

### Community 1 - "OrgChart.tsx"
Cohesion: 0.12
Nodes (38): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+30 more)

### Community 2 - "worker-runtime.ts"
Cohesion: 0.07
Nodes (37): savedStageCompletion(), candidateWorkspaceEnvironment(), assignmentSubject(), CODEX_DEFAULT_EFFORT, CODEX_DEFAULT_MODEL, CODEX_EFFORTS, CODEX_ROLES, ModelRoute (+29 more)

### Community 3 - "features/workflow.ts"
Cohesion: 0.07
Nodes (58): approveFeature(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), discoveryPrompt(), planPrompt(), artifactPath() (+50 more)

### Community 4 - "cx"
Cohesion: 0.08
Nodes (91): Outbox(), BlockerFollowups(), LearningCoverage(), lessonsView(), LessonsPanel(), when(), goalKey(), GoalList() (+83 more)

### Community 5 - "weekly-rollup.ts"
Cohesion: 0.13
Nodes (28): learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), RollupResult (+20 more)

### Community 6 - "budget-ledger.ts"
Cohesion: 0.06
Nodes (58): abandonExpired(), Admission, admit(), admitDeployment(), balance(), bindEvidence(), count(), errcode() (+50 more)

### Community 7 - "index.tsx"
Cohesion: 0.09
Nodes (50): LessonsView(), SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS, PickupForm() (+42 more)

### Community 8 - "work-summary.ts"
Cohesion: 0.09
Nodes (41): jiraQueueProgress(), nextStage(), deliveryRoles, JiraQueueProgress, TicketProgress, STAGE_LABELS, STAGE_ROLE, deliveryRepairProjection() (+33 more)

### Community 9 - "TelemetryPanel.tsx"
Cohesion: 0.10
Nodes (38): TelemetryReport, AzureBuild, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens(), usd() (+30 more)

### Community 10 - "features/commands.ts"
Cohesion: 0.20
Nodes (20): commandFeature(), reviewQuestions(), assertQuestionVisibility(), applyHarnessAction(), HarnessActionInput, recoveryPreconditions(), recoveryTarget(), normalizeRound() (+12 more)

### Community 11 - "overseer/commands.ts"
Cohesion: 0.17
Nodes (22): reconcile(), guardPresent(), overseerCommand(), reconcileArgs(), resolveCliRoot(), runnerStatus(), bounded(), ControlRead (+14 more)

### Community 12 - "App.tsx"
Cohesion: 0.05
Nodes (75): Conversation(), ConversationDraft, createConversationDrafts(), SendMessage, slackMessageStatus(), SlackDeliveryCard(), BrainDrawer(), themeColor (+67 more)

### Community 13 - "admit-improvement.ts"
Cohesion: 0.21
Nodes (16): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+8 more)

### Community 14 - "github-readiness.ts"
Cohesion: 0.06
Nodes (91): deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, accounting, DeliverySubject, nonDelivery, originalReads (+83 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.12
Nodes (55): requestDelivery(), createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), CaptureRequest (+47 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.09
Nodes (43): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, BlockingTrigger, blockingTrigger(), isBlocking() (+35 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.11
Nodes (39): baselined(), baselineLearning(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences(), configureKnowledge(), clip() (+31 more)

### Community 18 - "launch.mjs"
Cohesion: 0.06
Nodes (101): RFC-9562, BANNER, builtin(), bundleLauncher(), LAUNCHER_BUNDLE, LAUNCHER_ENTRY, launcherChunk(), REPOSITORY (+93 more)

### Community 19 - "StageResult"
Cohesion: 0.08
Nodes (54): findingsBlock(), metadataCarriedAdvisoryIds(), ownedBefore(), QA_STAGES, reviewAdvisoryIds(), Reviewed, withoutReviewAdvisories(), gateRegisteredDelivery() (+46 more)

### Community 20 - "activation-recovery.ts"
Cohesion: 0.08
Nodes (57): pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash (+49 more)

### Community 21 - "overseer-launch.mjs"
Cohesion: 0.07
Nodes (80): acquireLauncherLock(), alone(), ancestry(), assertDirectoryOrAbsent(), attemptRecord(), bounded(), boundedString(), checkOwnedFile() (+72 more)

### Community 22 - "GitHubDelivery"
Cohesion: 0.10
Nodes (20): assertParkDecision(), GitHubDelivery, adoptedReviewCandidate(), ciCheckout(), finishCISetup(), verifyCIHooks(), CIFailure, guardCIRepair() (+12 more)

### Community 23 - "jira-time.ts"
Cohesion: 0.12
Nodes (32): unresolvedAttempts(), bindingOf(), finishVerifiedEffects(), locks, matches(), publishJiraTime(), readBack(), readBackEntry() (+24 more)

### Community 24 - "admission.ts"
Cohesion: 0.15
Nodes (16): Admission, IntakeContext, WAIT_STATUSES, DependencyStores, lastFailedMailCheck(), lastMailCheckOutcome(), LANES, observeProjects() (+8 more)

### Community 25 - "outbox.ts"
Cohesion: 0.10
Nodes (26): metadataParkAction(), ADOPTION_STALLED_MS, conversationResolved(), projectOutbox(), item(), syncOutbox(), OwnerStepItem, ownerStepItems() (+18 more)

### Community 26 - "controller-runtime.ts"
Cohesion: 0.08
Nodes (37): projectData(), StoreDatabase, controllerEffects(), alive(), ControllerMachine, option(), realMachine(), runController() (+29 more)

### Community 27 - "fact-bounds.ts"
Cohesion: 0.18
Nodes (19): leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance() (+11 more)

### Community 28 - "advance-metadata-park.ts"
Cohesion: 0.13
Nodes (49): advanceMetadataPark(), Parked, releaseWords(), sentAnything(), effectiveParkPickup(), REVIEWABLE, advanceHistoricalPark(), assertParkAuthority() (+41 more)

### Community 29 - "MaintenanceRun"
Cohesion: 0.09
Nodes (29): BrainStatusSchema, identity, brainCheckpointCompletion(), coverageSchema, verified, PublishedPR, publishedWorkCleanedUp(), nativeChecks (+21 more)

### Community 30 - "metadata-context.ts"
Cohesion: 0.10
Nodes (53): harnessCloseout(), PASSING, verifyMergeActions(), runHarnessStage(), harnessStageResult(), receipt(), createdContentSha256(), historyBeforeWrite() (+45 more)

### Community 31 - "verifyRepairCandidate"
Cohesion: 0.10
Nodes (41): writerRestartPending(), removeAdoptedClone(), assertStoppedBaseAudit(), AuditRow, AWS_KEY_ID, readStoppedBaseAuditCompletion(), StoppedBaseAuditReader, CoverageRow (+33 more)

### Community 32 - "offices.ts"
Cohesion: 0.09
Nodes (37): featureItemComplete(), reconcileFeatureCompletion(), readEvidence(), helperTelemetry(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS, reserveReplacement() (+29 more)

### Community 33 - "owned-artifact.ts"
Cohesion: 0.27
Nodes (11): acquirePassLock(), Owner, PassLock, PassOwner, PassRefused, readPassOwner(), same(), done() (+3 more)

### Community 34 - "rate-limit-samples.ts"
Cohesion: 0.11
Nodes (14): GraphqlAnswer, graphqlAnswer(), responseBody(), QuotaGovernor, QuotaRefusal, iso(), RateLimitSamples, Reading (+6 more)

### Community 35 - "wiki-graph.cjs"
Cohesion: 0.18
Nodes (22): connections(), fs, main(), path, ensureInside(), hasSymlinkComponent(), slash(), splitFrontmatter() (+14 more)

### Community 36 - "scheduled-work.ts"
Cohesion: 0.10
Nodes (35): freshOwnershipRead(), Bot, deliverySlot(), withAmendmentOwnership(), metadataRequestResolved(), requestPriority(), closedTicketReport(), closedTicketRequest() (+27 more)

### Community 37 - "routing.cjs"
Cohesion: 0.14
Nodes (29): closingIssues(), githubRefs(), normalizeGithubQuery(), normalizeRepository(), parseGithubQuery(), ref(), withoutFencedCode(), adjacency() (+21 more)

### Community 38 - "github-context.ts"
Cohesion: 0.07
Nodes (59): reviewInstructions(), deliveryTask(), DeliveryTaskInput, observe(), DISCOVERY_GUIDANCE, compactSteps(), CheckJobAgreement, checkJobAgreement() (+51 more)

### Community 39 - "assignments.ts"
Cohesion: 0.06
Nodes (43): clip(), DEMAND_LIMIT, demandFacts(), key(), LessonKey, notes(), AssignmentLookups, assignmentLookups (+35 more)

### Community 40 - "requests.ts"
Cohesion: 0.06
Nodes (65): StoppedWriter, Ownership, continuationScope(), continuationWorktree(), Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate() (+57 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.17
Nodes (23): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence(), CaptureContext (+15 more)

### Community 42 - "reader.ts"
Cohesion: 0.09
Nodes (27): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, CommittedBrain (+19 more)

### Community 43 - ".save"
Cohesion: 0.09
Nodes (62): resolveBlockedTransition(), document(), transitionWithComment(), jiraAccount(), jiraCollection(), JiraCredential, jiraCredential(), KEYCHAIN_SERVICE (+54 more)

### Community 45 - "harness-baseline.ts"
Cohesion: 0.15
Nodes (22): BaselineReport, baselineReport(), BaselineSource, baselineText(), millions(), row(), share(), add() (+14 more)

### Community 46 - "credential-spans.ts"
Cohesion: 0.05
Nodes (72): BareValue, bareValue(), deeperValueEnd(), ENDS, isSeparator(), plainEscape(), queryValue(), separatorEscapeAt() (+64 more)

### Community 47 - "deployed-fixes.ts"
Cohesion: 0.13
Nodes (28): inHistoryOf(), CompareMemory, compareMemory(), COMPARES_PER_PASS, comparison(), DeployedFixes, DeployedFixesInput, recordDeployedFixes() (+20 more)

### Community 48 - "cec.ts"
Cohesion: 0.08
Nodes (37): movedHeadNote(), cecPrompt(), resolvedDecisionNote(), stageInstructions, stageInstructionsFor(), REVIEW_FINDINGS_RULE, capacityInterruptedRun(), providerSaid() (+29 more)

### Community 49 - "index.ts"
Cohesion: 0.06
Nodes (58): implementationPreview(), implementationContinuationRoute(), qaPlanRetryRoute(), resumeSwitch(), close(), config, itSpecialist, loadedRevision (+50 more)

### Community 50 - "FeatureWorkspace.tsx"
Cohesion: 0.11
Nodes (28): FeatureQuestionProjection, OutboxQuestionRound(), send(), FeatureDelivery(), FeatureDocuments(), views, FeatureReading(), FeatureWorkspace() (+20 more)

### Community 51 - "run.ts"
Cohesion: 0.21
Nodes (13): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, OFFICE_FIX_PROMPT, OfficeFixResult, validateOfficeFix(), investigationReady(), InvestigationOptions, InvestigationReport (+5 more)

### Community 52 - "investigations/ledger.ts"
Cohesion: 0.18
Nodes (18): acceptedCompletionResolution(), investigationCandidates(), investigationId(), finishedSubjectResolution(), investigationFollowUps(), interruptedQARerunResolution(), investigationResolution(), syncInvestigations() (+10 more)

### Community 53 - "ref_node_sqlite"
Cohesion: 0.05
Nodes (41): PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, checkpointLabel(), readSavedState(), LARGE_KEY_CHARS (+33 more)

### Community 54 - "cec/issue-publication.ts"
Cohesion: 0.08
Nodes (21): Assignment, contentSchema(), JiraIssuePublisher, jiraText(), Transition, descriptionPreimage(), plain(), publicationDescription() (+13 more)

### Community 55 - "github-delivery.ts"
Cohesion: 0.06
Nodes (40): writerRestartInstruction(), BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction(), dependabotReviewGuidance(), discover(), hasRoutingRefs() (+32 more)

### Community 56 - "dependency-bots/adopt.ts"
Cohesion: 0.09
Nodes (42): Execute, HarnessEffect, closesIssue(), linkPR(), DependabotPR, dependabotPR(), openDependabotPulls(), refusal() (+34 more)

### Community 57 - "pass.ts"
Cohesion: 0.09
Nodes (42): appendFailureLine(), Evidence, FAILURE_ID, FailureEvent, failureLine(), JournalRefused, JournalView, readFailures() (+34 more)

### Community 58 - "store.ts"
Cohesion: 0.06
Nodes (52): GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles(), ContinuationIO (+44 more)

### Community 59 - "time-readback.ts"
Cohesion: 0.14
Nodes (16): JiraAttempt, JiraWorklogExpected, JiraWorklogReconcile, Ledger, Read, TimeLedger, missedSinceVerified(), Readback (+8 more)

### Community 60 - "cost-ledger.ts"
Cohesion: 0.18
Nodes (24): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress(), effectId() (+16 more)

### Community 61 - "lesson-selection.ts"
Cohesion: 0.15
Nodes (16): INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), LessonSelection, MAINTENANCE, MAX_LESSONS (+8 more)

### Community 62 - "maintenance/maintenance.ts"
Cohesion: 0.08
Nodes (34): maintenancePolicies(), captureMaintenanceStep(), sourceReview(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, brainResultStop(), GateMark (+26 more)

### Community 63 - "Button"
Cohesion: 0.07
Nodes (57): KnowledgeActivity, KnowledgeEdge, KnowledgeMap, KnowledgeNode, ChatMarkdown(), ChatMarkdown, MessageText(), Activity() (+49 more)

### Community 64 - "constellation-runtime.ts"
Cohesion: 0.07
Nodes (37): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), CameraPose, flightPose(), cameraTarget() (+29 more)

### Community 65 - "validate_pr_body.cjs"
Cohesion: 0.36
Nodes (8): fs, main(), readableText(), REQUIRED_CHECKS, REQUIRED_SECTIONS, sections(), validatePullRequestBody(), withoutComments()

### Community 66 - "audit-plan-candidates.cjs"
Cohesion: 0.14
Nodes (31): audit(), branchIssueNumbers(), classify(), distinctiveTitleWords(), { execFileSync }, extractPaths(), findPrForMergeSubject(), fmtCommit() (+23 more)

### Community 67 - "office-client.ts"
Cohesion: 0.13
Nodes (19): systemClock, RUNNER_DEFAULTS, RunnerLimits, officeDataRoot, realMachine(), bodyWithin(), bounded(), Envelope (+11 more)

### Community 68 - "resume-arrivals.ts"
Cohesion: 0.11
Nodes (64): canonical(), CheckpointEligibility, checkpointEligibility(), admitAssignmentResume(), forAssignment(), admitCheckpointResume(), forCheckpoint(), admitResume() (+56 more)

### Community 69 - "ticket-evidence.ts"
Cohesion: 0.11
Nodes (31): Connection, twgConnection(), assetDownloader(), attachmentKind(), evidenceDirectory(), storeEvidence(), blankEvidence(), CoverageState (+23 more)

### Community 70 - "OfficeScene.tsx"
Cohesion: 0.08
Nodes (60): displayAgentTask(), withoutElapsed(), CameraBookmark, restoreBookmark(), LiveAgentTask(), Props, RunningTask(), text() (+52 more)

### Community 71 - "retrospective-subject.ts"
Cohesion: 0.20
Nodes (14): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+6 more)

### Community 72 - "session-context-file.ts"
Cohesion: 0.21
Nodes (14): unpackContextFailure(), ContextFoldPrefix, contextFoldPrefix(), SessionContextCheckpoint, captureSessionContextClone(), ContextReadPhase, SessionContextDeadline, sessionContextFile() (+6 more)

### Community 73 - "ServiceHealthPanel.tsx"
Cohesion: 0.10
Nodes (27): itRecoveryRequest(), blockedSummary(), itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps(), ServiceHealthPanel(), followUp() (+19 more)

### Community 74 - "session-scope.ts"
Cohesion: 0.20
Nodes (16): Bound, claudeScopeParser(), claudeSessionScope(), CODEX_ROLLOUTS, contextReaders(), retainSessionMessage(), SessionConversation, escaped() (+8 more)

### Community 75 - "service-health.ts"
Cohesion: 0.12
Nodes (23): ClaudeLoginRefusal, claudeLoginRefusal(), claudeRefusalWords(), RECORDED_REFUSALS, refusedClaudeRow(), providers, ProviderStatusChecks, summary (+15 more)

### Community 76 - "sanitizeObject"
Cohesion: 0.11
Nodes (34): az(), buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs(), fullActivePRs(), observation() (+26 more)

### Community 77 - "continuation-evidence.ts"
Cohesion: 0.09
Nodes (52): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+44 more)

### Community 78 - "incidents.ts"
Cohesion: 0.05
Nodes (69): attributedRecords(), foldsItsRun(), ObservedIncident, ObservedSubject, incidentId(), FLAGS, incidentCommand(), IncidentCommandIO (+61 more)

### Community 79 - "agents.ts"
Cohesion: 0.05
Nodes (58): implementationWorkerContext(), intakeEnumeration(), intakeMembership(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), plainResume() (+50 more)

### Community 80 - "session-bridge.ts"
Cohesion: 0.10
Nodes (29): codexDaemonProcesses(), accountCodexProcesses(), CodexProcessInventory, codexProcessInventory(), DesktopSessions, unaccountedProcesses(), codexThreadMetadata(), METADATA_CHUNK (+21 more)

### Community 81 - "Coordinator"
Cohesion: 0.09
Nodes (3): withGitHubSource(), coordination(), Coordinator

### Community 82 - "resume-control.ts"
Cohesion: 0.29
Nodes (7): absent(), NEVER_ENABLED, ResumeControl, stated(), Stored, unreadable(), ResumeSwitch

### Community 83 - "follow-production.ts"
Cohesion: 0.20
Nodes (17): awaitingJiraStatus(), awaitingProduction(), FOLLOW_DAYS, followed(), isFollowed(), Azure, AzureRead, containedIn() (+9 more)

### Community 84 - "viewer.js"
Cohesion: 0.19
Nodes (25): addMetaLink(), addMetaRow(), addRelationship(), applyView(), buildIndexes(), buildLegend(), buildModel(), buildRenderer() (+17 more)

### Community 85 - "restart-writer.ts"
Cohesion: 0.21
Nodes (16): nextAttemptAt(), restartStoppedWriters(), unchangedSinceAccepted(), NOT_RETRYABLE, releaseFunds(), stoppedWriter(), WRITER_STAGES, WriterRestartCandidate (+8 more)

### Community 86 - "stopped-record.ts"
Cohesion: 0.07
Nodes (63): capabilityBlockedReviews(), latestReviews(), boundedEvidence(), groupCandidates(), expectedWait(), StopFacts, digest(), fingerprint() (+55 more)

### Community 87 - "sanitize"
Cohesion: 0.08
Nodes (37): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+29 more)

### Community 88 - "superseded-wiki-pr.ts"
Cohesion: 0.12
Nodes (46): abandon(), assertOpenSnapshot(), awaitingContainment(), closeIssue(), CloseRevalidationError, closeSuperseded(), comment(), CommentStep (+38 more)

### Community 89 - "ref_node_child_process"
Cohesion: 0.06
Nodes (46): changedPaths(), { execFileSync }, files, isMapInput(), mapOnly(), { execFileSync }, git(), publish() (+38 more)

### Community 90 - "provider-observation.ts"
Cohesion: 0.13
Nodes (25): correlatedBuild(), Azure, azurePipelines(), outcome(), Read, RUNS_PER_PIPELINE, Api, githubWorkflows() (+17 more)

### Community 91 - "Ticket"
Cohesion: 0.09
Nodes (36): carriedNotRepeated(), changeScopeNote(), Scoped, CommentPage, commentReadback(), devUpdate(), HEADLINE, JiraOperations (+28 more)

### Community 92 - "session-context-client.ts"
Cohesion: 0.11
Nodes (19): claudeSessionContext(), readTranscript, codexSessionContext(), readRollout, packContextFailure(), PackedContextFailure, ContextThread, contextThread() (+11 more)

### Community 93 - "plans.cjs"
Cohesion: 0.19
Nodes (19): remoteSlug(), walk(), association(), auditedDigests(), candidate(), collapseByTitle(), discover(), fromMarkdown() (+11 more)

### Community 94 - "quota-governor.ts"
Cohesion: 0.15
Nodes (20): withGitHubOperation(), GitHubMonitor, Api, terminalPRs(), backgroundHold(), CORE_RESERVE, GRAPHQL_WORK, PROBE_INTERVAL_MS (+12 more)

### Community 96 - "change-scope.ts"
Cohesion: 0.12
Nodes (30): applyChangeScope(), levels(), MAX_CHECKS, owedUnderScope(), scopeBase(), settled(), statedApproach(), verifiedCandidate() (+22 more)

### Community 97 - "deploy.ts"
Cohesion: 0.12
Nodes (34): abandon(), advance(), DEPLOY_STEPS, DeployFacts, append(), assertNext(), deployJournalPath(), DeployJournalView (+26 more)

### Community 98 - "pilot-delivery.ts"
Cohesion: 0.05
Nodes (79): candidateBranchMoved(), endChangeScope(), scopeOutgrown(), confirmsMovedHead(), Moved, movedHeadUnconfirmed(), recordConfirmedHead(), routeConfirmedHead() (+71 more)

### Community 99 - "archive-plan.cjs"
Cohesion: 0.12
Nodes (33): fs, main(), parse(), path, archive(), cell(), ensureIndex(), fromArgs() (+25 more)

### Community 100 - "call-scope.ts"
Cohesion: 0.09
Nodes (42): add(), addSource(), busiest(), CallLedger, Entry, sourceRows(), Sources, CallCounts (+34 more)

### Community 101 - "accessibility-sources.ts"
Cohesion: 0.23
Nodes (18): deliveryIntakeBlocker(), accessibilitySources(), actionable(), closingPull(), Finding, handoffIssue(), issueLines(), issueSource() (+10 more)

### Community 102 - "http/commands.ts"
Cohesion: 0.15
Nodes (19): decideImplementation(), requestQAPlanRetry(), requeueWaitedImplement(), normalizeStatement(), declineLessonIssue(), reactivateLesson(), retireLesson(), decideOfficeProposal() (+11 more)

### Community 103 - "on-merge-sync.cjs"
Cohesion: 0.14
Nodes (27): fs, main(), path, { spawnSync }, fieldSpan(), frontmatterProblems(), keyPattern(), list() (+19 more)

### Community 104 - "backup-stores.ts"
Cohesion: 0.10
Nodes (36): absentAdmission(), AdmissionComparison, AdmissionSnapshot, compareAdmissions(), snapshotAdmissions(), BackupEntry, BackupInput, BackupInventory (+28 more)

### Community 105 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 106 - "deploy-plan.ts"
Cohesion: 0.27
Nodes (14): Body, DeploymentFenceState, fenceTokenDigest(), operationPaths(), planDeployment(), createDeployToken(), readDeployToken(), removeDeployToken() (+6 more)

### Community 107 - ".emit"
Cohesion: 0.12
Nodes (30): currentOutbox(), harnessBlockMove(), noted(), confirmedGone(), goneQuery(), STOPPED, stoppedReviewKeys(), adoptDependabot() (+22 more)

### Community 108 - "work.ts"
Cohesion: 0.14
Nodes (19): effectiveCause(), REPLACED, BLOCKED_CAUSES, blockedCauses(), NONE, projectReadiness(), ProjectReadiness, AssignmentResult (+11 more)

### Community 109 - "pr-observation-graphql.ts"
Cohesion: 0.13
Nodes (29): ChildRequest, headCheckRuns(), includeBody(), readOpenPRs(), commitOf(), ConnectionPages, embeddedHead(), fail() (+21 more)

### Community 110 - "handoff-admission.ts"
Cohesion: 0.13
Nodes (30): actionKey(), bindings(), bound(), CATEGORIZED, claimed(), Entry, episodeAt(), executing() (+22 more)

### Community 111 - "time-ledger.ts"
Cohesion: 0.19
Nodes (17): JiraWorklogAttempt, publishableEntry(), settlementPending(), superseded(), syncing, ScopeRow, clearUnsent(), dueUnsent() (+9 more)

### Community 112 - "notifications.ts"
Cohesion: 0.10
Nodes (35): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), clearCooldown(), coolDown(), coolingDown() (+27 more)

### Community 113 - "judge-resumes.ts"
Cohesion: 0.08
Nodes (34): PacketInput, absent(), IncidentChange, IncidentLedger, isOpen(), Recorded, judgeResumes(), JudgeResumesInput (+26 more)

### Community 114 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 115 - "run-accounting.ts"
Cohesion: 0.05
Nodes (70): BoundedRead, readBoundedNoFollow(), comparable(), EvidenceOutcome, recordRunEvidence(), backfillClaudeCost(), CompletionReader, add() (+62 more)

### Community 119 - "restoreInPlace"
Cohesion: 0.60
Nodes (5): identity(), Json, plain(), restorable(), restoreInPlace()

### Community 120 - "conversations/slack.ts"
Cohesion: 0.11
Nodes (23): comparableSlackText(), finishSupersededReadback(), labelIsUrl(), projectSlackDeliveries(), dueSlackReread(), rereadUncertainSlack(), runningRevision(), settleRequestedSlackReplacement() (+15 more)

### Community 121 - "intake-enumeration.ts"
Cohesion: 0.39
Nodes (7): enumerateIntakeList(), inPickupOrder(), Intake, text(), checkMail(), drainMail(), requestMail()

### Community 122 - "daily-cto.ts"
Cohesion: 0.06
Nodes (40): currentCitations(), Fact, NOT_CURRENT, PROVIDER_ERROR, DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt() (+32 more)

### Community 123 - "deploy-command.ts"
Cohesion: 0.11
Nodes (31): CONTROLLER_ENTRY, ControllerPin, Pin, pinnedController(), readControllerPin(), writeControllerPin(), controllerOf(), deployCommand() (+23 more)

### Community 124 - "refresh-issue-state.cjs"
Cohesion: 0.23
Nodes (12): advanceFence(), key(), { execFileSync }, fs, issueRefs(), main(), markClosed(), openThreadLineIndexes() (+4 more)

### Community 125 - "knowledge.ts"
Cohesion: 0.06
Nodes (38): curateLesson(), Curation, CurationAction, mergeEvidence(), LessonBrainAudit, LessonBrainOverlap, BRAIN_SCOPE, SUBJECT (+30 more)

### Community 126 - "shared.ts"
Cohesion: 0.07
Nodes (42): recordCandidateCleanup(), interruptedRemoval(), maintenanceCandidate(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot() (+34 more)

### Community 127 - "sign-in-unpark.ts"
Cohesion: 0.11
Nodes (31): readbackDispatchGuidance(), currentEnvironmentWait(), environmentWait(), waitText(), hasPendingDelivery(), resumeAfterSignIn(), signInWait(), confirmSetupStopCap() (+23 more)

### Community 128 - "interrupted-work-recovery.ts"
Cohesion: 0.36
Nodes (7): interruptAdoptions(), legacy(), REMOVED_FIELDS, retireLegacyRecovery(), goalNoticeNeverDispatched(), maintenanceNoticeNeverDispatched(), recover()

### Community 129 - "metadata-admission.ts"
Cohesion: 0.13
Nodes (31): Binding, matchesBoundDescription(), DescriptionEdit, DescriptionHistory, DescriptionHistoryUnavailable, descriptionRevision(), readDescriptionHistory(), text() (+23 more)

### Community 130 - "pre-push-boundary.ts"
Cohesion: 0.27
Nodes (10): Event, exactCommand(), Invocation, localHookCommand(), one(), prePushRejection(), PushIdentity, retirementBoundary() (+2 more)

### Community 131 - "holdReason"
Cohesion: 0.09
Nodes (44): replacedReadback(), boardPreflightCandidate(), partialLocalCleanupCandidate(), partialLocalCleanupKey(), candidateInput(), children, oldAdoptionBasis(), savedAdmissionUnresolved() (+36 more)

### Community 132 - "alert-issue.ts"
Cohesion: 0.16
Nodes (22): readBackOrThrow(), retryRead(), AlertIssue, alertIssueBody(), alertIssueTitle(), alertMarker(), closeAlertIssue(), ensureAlertIssue() (+14 more)

### Community 133 - "pr-observation-shape.ts"
Cohesion: 0.21
Nodes (19): githubPRDescription(), closingDirectives(), ObservedPR, enumValue(), fail(), graphqlPR(), mapped(), member() (+11 more)

### Community 134 - "artifact"
Cohesion: 0.11
Nodes (56): containedFile(), completedPreparation(), continuationNativeReview(), continuationWorkerProof(), assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence() (+48 more)

### Community 135 - "digest"
Cohesion: 0.12
Nodes (27): interruptedImplementation(), continueOwnershipRead(), expiredOwnershipRead(), ownershipReadGate(), ownershipReadState(), ownershipReadHistory(), ownershipReadSource(), ReadOwnershipCandidate (+19 more)

### Community 136 - "ref_node_path"
Cohesion: 0.06
Nodes (39): file, folder, logs, root, Candidate, recordedPush(), readRejection(), settledPushBoundary() (+31 more)

### Community 137 - "Effects"
Cohesion: 0.11
Nodes (28): harnessEffect(), NEEDS_EFFECT_ID, runGuard(), NOT_LANDED_SETTLE_MS, settleNotLanded(), assertDraftClaimHistory(), linkDraftIssue(), protectedOriginalClaim() (+20 more)

### Community 138 - "proof-comment.ts"
Cohesion: 0.41
Nodes (11): commentId(), CommentIntent, CommentReceipt, conversation(), exact(), findProofComment(), matchesProofComment(), postProofComment() (+3 more)

### Community 139 - "OfficeSnapshot"
Cohesion: 0.05
Nodes (55): knowledgeOutbox(), LessonDecisionAction, lessonDecisionState(), readLessonDecision(), DAYS, dueLessonDecisions(), easternWeek(), LESSON_DIGEST (+47 more)

### Community 140 - "validate-stage.ts"
Cohesion: 0.17
Nodes (17): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+9 more)

### Community 141 - "coordination.ts"
Cohesion: 0.31
Nodes (10): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), legacy, validateNativeContinuation(), checkpointWindow() (+2 more)

### Community 142 - "scheduler.ts"
Cohesion: 0.10
Nodes (20): Clock, OfficeCapacity, PROJECT_LOCAL, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork() (+12 more)

### Community 144 - "reconcile-merges.cjs"
Cohesion: 0.22
Nodes (14): collectPulls(), copyWikiForDryRun(), { execFileSync }, flattenPages(), fs, githubRequest(), isWikiBotPull(), main() (+6 more)

### Community 145 - "blocker-followups.ts"
Cohesion: 0.21
Nodes (17): NO_RECORD, recoveryRecord(), followupRecord(), handoff(), heldForRepair(), reconcileBlockerFollowups(), bindHandoff(), HandoffEvidence (+9 more)

### Community 146 - "preparation-readback.ts"
Cohesion: 0.12
Nodes (27): bindPreparationBoardOrigins(), claimSchema, eventSchema, PreparationBoardOrigin, readPreparationBoardOrigins(), timestamp, updateSchema, nativeCompletion() (+19 more)

### Community 147 - "Store"
Cohesion: 0.05
Nodes (17): AzureMonitor, enableNightly(), GitHubFeaturePublisher, JiraFeaturePublisher, Assign, Board, Content, noQuotaHold (+9 more)

### Community 148 - "runner-root.ts"
Cohesion: 0.09
Nodes (39): DEFAULT_OFFICE_URL, LOOPBACK, officeUrl(), privateDirectories(), RunnerPaths, runnerPaths(), base, count (+31 more)

### Community 149 - "project-graphql.ts"
Cohesion: 0.15
Nodes (36): BLOCK, harnessParkedCard(), effectKey(), LaneOperation, laneWrite(), moveCardOnce(), Lane, MOVABLE (+28 more)

### Community 150 - "common.cjs"
Cohesion: 0.11
Nodes (24): fs, main(), parse(), path, atomicWrite(), crypto, { execFileSync }, fs (+16 more)

### Community 151 - "coordination-pump.ts"
Cohesion: 0.08
Nodes (37): reconcileNoticeConfirmations(), ATTEMPT_DELAYS_MS, admit(), admitReadyCards(), resumeParked(), compatible(), dependencyCompletionKey(), dependencyEligibility() (+29 more)

### Community 153 - "ref_zod"
Cohesion: 0.05
Nodes (69): escaped(), IntakeBinding, intakeJql(), intakeLocation(), projectListScope(), AUTO_ADOPT_BOTS, IntakeView, assertFeaturePlanningConfig() (+61 more)

### Community 154 - "features.ts"
Cohesion: 0.13
Nodes (33): dispatchNightly(), eligibility(), currentApproval(), featureGate(), predecessorComplete(), automaticIntakeWait(), recoveryHeld(), DeliveryPreflight (+25 more)

### Community 155 - "recorded-gh-command.ts"
Cohesion: 0.19
Nodes (20): assignments(), changeDirectory(), closing(), CREATE, createGuard(), flags(), named(), read() (+12 more)

### Community 156 - "continue-access-only-plan.ts"
Cohesion: 0.54
Nodes (6): Document, document(), isAccessOnlyPlan(), settledAccessOnlyState(), continueAccessOnlyPlan(), entryExists()

### Community 157 - "stop-service.ts"
Cohesion: 0.21
Nodes (16): ControllerEffects, DEPLOY_PROJECT, installPlist(), bootout(), bootstrap(), Execute, serviceLoaded(), until() (+8 more)

### Community 158 - "diagnostic-snapshot.ts"
Cohesion: 0.16
Nodes (18): assignmentDiagnostics(), diagnosticContext(), diagnosticSnapshot(), followUpPicture(), publishITReport(), archiveOldReports(), RETAINED_REPORTS, archiveByMonth() (+10 more)

### Community 160 - "evidence.ts"
Cohesion: 0.29
Nodes (9): investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_SOURCE_PATHS, officeSource(), ROOT, launchPolicyFacts() (+1 more)

### Community 161 - "connectWith"
Cohesion: 0.33
Nodes (6): twgProfile(), connectWith(), data(), envelope(), JiraWorklogs, WorklogSave

### Community 162 - "retire-backlogged.ts"
Cohesion: 0.35
Nodes (8): initialManualStart(), needsReconciliation(), retireBacklogged(), STOPPED, draftPushEffectId(), readBackRejectedDraftPush(), rejectedDraftPushes(), likePrefix()

### Community 163 - "merge-scanner-retry.ts"
Cohesion: 0.40
Nodes (9): officeMergeProvenance(), reconcileMergeScannerRetry(), Retry, retryMergeScanner(), retryReadBack(), runIdentity(), savedRetry(), transientScannerJobs() (+1 more)

### Community 164 - "redactEvidence"
Cohesion: 0.11
Nodes (25): BARE_CREDENTIAL, URL_USERINFO, mailboxFreeze(), AWS_KEY_ID, JSON_WEB_TOKEN, PROVIDER_TOKEN, redactCredentials(), redactEvidence() (+17 more)

### Community 165 - "conversation-recovery.ts"
Cohesion: 0.58
Nodes (8): conversationReadbackReady(), followupOf(), pendingReadback(), queueConversationReadback(), readbackEnding(), uncertainConversations(), readBackConversations(), harperRequest()

### Community 166 - "jira-attempts.ts"
Cohesion: 0.33
Nodes (9): attempted(), attemptState(), bound(), covers(), jiraAttempts(), JiraAttemptState, open(), provenNeverSent() (+1 more)

### Community 167 - "TicketJob"
Cohesion: 0.14
Nodes (24): ProjectProgress, requireDeliveryAuthority(), assertDeliveryMayMutate(), assertMayMutate(), decisionMarker(), assertParkLocal(), Parked, field() (+16 more)

### Community 168 - "release-unpark.ts"
Cohesion: 0.43
Nodes (5): MAX_RELEASE_UNPARKS, RELEASE_CHECK_MS, compare(), highestStableAtLeast(), parts()

### Community 169 - "DeploymentFence"
Cohesion: 0.33
Nodes (4): assertToken(), DeploymentFence, DeploymentFenceGateContext, DeploymentFenceRouteContext

### Community 171 - "release-manifest.ts"
Cohesion: 0.09
Nodes (38): [cmd,...rawArgs], runningRevision(), runningRevision(), releaseIdentity(), runtimeRevision(), ActiveRelease, readActiveRelease(), BUILD_ENV (+30 more)

### Community 172 - "delivery-ownership.ts"
Cohesion: 0.33
Nodes (4): Ownership, ownershipContext, refreshDeliveryOwnership(), RefreshOwnership

### Community 173 - "session-snapshot-cleanup.ts"
Cohesion: 0.40
Nodes (5): SNAPSHOT_PREFIX, removeStaleSessionSnapshots(), SNAPSHOT_SWEEP_MS, STALE_SNAPSHOT_MS, sweepStaleSessionSnapshots()

## Knowledge Gaps
- **1 isolated node(s):** `RFC-9562`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 1184 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `worker-runtime.ts`, `features/workflow.ts`, `weekly-rollup.ts`, `features/commands.ts`, `admit-improvement.ts`, `github-readiness.ts`, `scheduled-captures.ts`, `run-retrospective.ts`, `record-trigger.ts`, `StageResult`, `activation-recovery.ts`, `jira-time.ts`, `admission.ts`, `outbox.ts`, `controller-runtime.ts`, `fact-bounds.ts`, `advance-metadata-park.ts`, `MaintenanceRun`, `metadata-context.ts`, `verifyRepairCandidate`, `offices.ts`, `scheduled-work.ts`, `github-context.ts`, `assignments.ts`, `requests.ts`, `time-scope.ts`, `reader.ts`, `.save`, `Offices`, `cec.ts`, `index.ts`, `run.ts`, `investigations/ledger.ts`, `ref_node_sqlite`, `cec/issue-publication.ts`, `github-delivery.ts`, `dependency-bots/adopt.ts`, `store.ts`, `time-readback.ts`, `cost-ledger.ts`, `lesson-selection.ts`, `maintenance/maintenance.ts`, `resume-arrivals.ts`, `ticket-evidence.ts`, `OfficeScene.tsx`, `retrospective-subject.ts`, `sanitizeObject`, `continuation-evidence.ts`, `agents.ts`, `session-bridge.ts`, `follow-production.ts`, `restart-writer.ts`, `sanitize`, `superseded-wiki-pr.ts`, `provider-observation.ts`, `Ticket`, `quota-governor.ts`, `pilot-delivery.ts`, `accessibility-sources.ts`, `http/commands.ts`, `.emit`, `pr-observation-graphql.ts`, `time-ledger.ts`, `notifications.ts`, `judge-resumes.ts`, `run-accounting.ts`, `conversations/slack.ts`, `daily-cto.ts`, `shared.ts`, `sign-in-unpark.ts`, `interrupted-work-recovery.ts`, `metadata-admission.ts`, `holdReason`, `alert-issue.ts`, `artifact`, `digest`, `ref_node_path`, `Effects`, `proof-comment.ts`, `OfficeSnapshot`, `validate-stage.ts`, `coordination.ts`, `scheduler.ts`, `blocker-followups.ts`, `preparation-readback.ts`, `project-graphql.ts`, `coordination-pump.ts`, `features.ts`, `continue-access-only-plan.ts`, `stop-service.ts`, `diagnostic-snapshot.ts`, `evidence.ts`, `retire-backlogged.ts`, `redactEvidence`, `conversation-recovery.ts`, `jira-attempts.ts`, `TicketJob`, `release-unpark.ts`, `QuestionNotifications`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **What connects `RFC-9562` to the rest of the system?**
  _1 weakly-connected nodes found - possible missing edges._
- **Should `incidents/routes.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06800804828973843 - nodes in this community are weakly interconnected._
- **Why does `command()` connect `Store` to `incidents/routes.ts`, `worker-runtime.ts`, `features/workflow.ts`, `alert-issue.ts`, `weekly-rollup.ts`, `digest`, `ref_node_path`, `Effects`, `validate-stage.ts`, `coordination.ts`, `github-readiness.ts`, `StageResult`, `activation-recovery.ts`, `project-graphql.ts`, `coordination-pump.ts`, `jira-time.ts`, `CommandRegistry`, `controller-runtime.ts`, `continue-access-only-plan.ts`, `MaintenanceRun`, `metadata-context.ts`, `verifyRepairCandidate`, `offices.ts`, `stop-service.ts`, `retire-backlogged.ts`, `connectWith`, `TicketJob`, `requests.ts`, `reader.ts`, `.save`, `release-manifest.ts`, `deployed-fixes.ts`, `cec/issue-publication.ts`, `github-delivery.ts`, `store.ts`, `time-readback.ts`, `cost-ledger.ts`, `maintenance/maintenance.ts`, `ticket-evidence.ts`, `service-health.ts`, `sanitizeObject`, `continuation-evidence.ts`, `agents.ts`, `session-bridge.ts`, `restart-writer.ts`, `provider-observation.ts`, `Ticket`, `quota-governor.ts`, `change-scope.ts`, `pilot-delivery.ts`, `call-scope.ts`, `accessibility-sources.ts`, `time-ledger.ts`, `notifications.ts`, `deploy-command.ts`, `shared.ts`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Should `OrgChart.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11655874190564293 - nodes in this community are weakly interconnected._
- **Why does `TicketJob` connect `TicketJob` to `interrupted-work-recovery.ts`, `metadata-admission.ts`, `holdReason`, `alert-issue.ts`, `cx`, `artifact`, `ref_node_path`, `Effects`, `proof-comment.ts`, `work-summary.ts`, `validate-stage.ts`, `App.tsx`, `github-readiness.ts`, `scheduler.ts`, `record-trigger.ts`, `preparation-readback.ts`, `StageResult`, `activation-recovery.ts`, `project-graphql.ts`, `GitHubDelivery`, `coordination-pump.ts`, `outbox.ts`, `fact-bounds.ts`, `advance-metadata-park.ts`, `MaintenanceRun`, `metadata-context.ts`, `verifyRepairCandidate`, `retire-backlogged.ts`, `merge-scanner-retry.ts`, `scheduled-work.ts`, `github-context.ts`, `release-unpark.ts`, `requests.ts`, `github-delivery.ts`, `dependency-bots/adopt.ts`, `store.ts`, `resume-arrivals.ts`, `retrospective-subject.ts`, `continuation-evidence.ts`, `restart-writer.ts`, `stopped-record.ts`, `superseded-wiki-pr.ts`, `pilot-delivery.ts`, `call-scope.ts`, `.emit`, `notifications.ts`, `shared.ts`, `sign-in-unpark.ts`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Should `worker-runtime.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07138047138047138 - nodes in this community are weakly interconnected._