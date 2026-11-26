# Graph Report - the-office  (2026-11-26)

## Corpus Check
- 1308 files · ~577,546 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 7101 nodes · 30720 edges · 180 communities (171 shown, 9 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 1066 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `47d3cc2d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- incidents/routes.ts
- OrgChart.tsx
- agents.ts
- ref_node_crypto
- cx
- weekly-rollup.ts
- budget-ledger.ts
- index.tsx
- queue-progress.ts
- TelemetryPanel.tsx
- office/config.ts
- overseer/commands.ts
- OfficeSnapshot
- admit-improvement.ts
- request.ts
- scheduled-captures.ts
- run-retrospective.ts
- record-trigger.ts
- launch.mjs
- github-delivery.ts
- artifact
- overseer-launch.mjs
- delivery-repairs.ts
- jira-time.ts
- redactEvidence
- Outbox.tsx
- controller-runtime.ts
- fact-bounds.ts
- advance-metadata-park.ts
- Store
- digest
- .activeClaims
- build-overseer-launcher.mjs
- coordination.ts
- rate-limit-samples.ts
- common.cjs
- scheduled-work.ts
- routing.cjs
- GitHubDelivery
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
- index.ts
- QuestionStepper.tsx
- investigations/ledger.ts
- OfficeProject
- sanitizeObject
- jiraBinding
- ref_node_child_process
- DrawerTopic.tsx
- pass.ts
- ref_node_path
- time-readback.ts
- cost-ledger.ts
- reader.ts
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
- MaintenanceRun
- session-scope.ts
- service-health.ts
- project-bindings.ts
- closeout-recovery.ts
- incidents.ts
- prompts/conversations.ts
- session-bridge.ts
- Coordinator
- resume-control.ts
- follow-production.ts
- viewer.js
- salvage-worktree.ts
- stopped-record.ts
- .emit
- superseded-wiki-pr.ts
- spawn-command.ts
- provider-observation.ts
- readable-jira-comment.ts
- session-context-client.ts
- plans.cjs
- quota-governor.ts
- capture-session-clone.py
- assignment.ts
- deploy.ts
- ticket-stage-runner.ts
- archive-plan.cjs
- call-scope.ts
- workKey
- intent.ts
- on-merge-sync.cjs
- backup-stores.ts
- extract-worker.mjs
- ref_zod
- assignment-poll.ts
- work.ts
- .transaction
- blocker-followups.ts
- telemetry/report.ts
- outbox.ts
- resume-outcome.ts
- slack-supersession.ts
- run-accounting.ts
- qa.ts
- qa-plan-continuation.ts
- writer-restart.ts
- store.ts
- notifications.ts
- ITFollowUps.tsx
- daily-cto.ts
- deploy-command.ts
- refresh-issue-state.cjs
- knowledge.ts
- remove-candidate.ts
- sign-in-unpark.ts
- coordination-tick.ts
- call-ledger.ts
- pre-push-boundary.ts
- it-specialist.ts
- diagnostic-snapshot.ts
- GitHubIssuePublisher
- shared.ts
- continue-ownership-read.ts
- draft-provenance.ts
- Effects
- time-ledger.ts
- Goals.tsx
- metadata-park-words.ts
- brain-maintenance.ts
- scheduler.ts
- production.ts
- reconcile-merges.cjs
- preferences-store.ts
- holdReason
- pilot-delivery.ts
- runner-root.ts
- harnessEffect
- serve-graph.cjs
- read-retries.ts
- node-visuals.ts
- project-bindings-config.ts
- effects.ts
- recorded-gh-command.ts
- timed-statements.ts
- security.ts
- it-report.ts
- routing.js
- scene-motion.ts
- delivery-ownership.ts
- RoomCamera.tsx
- dates.cjs
- judge-resumes.ts
- features/routes.ts
- connectWith
- ProjectProgress
- owned-artifact.ts
- DeploymentFence
- QAResultsCard.tsx
- build-release.ts
- jira-attempts.ts
- handover-cms.ts
- harness-parked-card.ts
- JiraWorklogTransport
- validate_wiki_pr_body.cjs
- office-qa-handoff.ts
- cli.ts
- qa-plan-retry.ts

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

## Communities (180 total, 9 thin omitted)

### Community 0 - "incidents/routes.ts"
Cohesion: 0.08
Nodes (46): citationFault(), CitationSchema, SourceVersions, sourceVersions(), dismiss(), DISMISSAL_CITATIONS, DISMISSAL_REASON, DismissalFacts (+38 more)

### Community 1 - "OrgChart.tsx"
Cohesion: 0.11
Nodes (39): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+31 more)

### Community 2 - "agents.ts"
Cohesion: 0.04
Nodes (69): implementationWorkerContext(), stageInstructions, savedStageCompletion(), assertContinuableWorktree(), CONTINUABLE, continuationPrompt(), MAX_CONTINUATIONS, recordedContinuation() (+61 more)

### Community 3 - "ref_node_crypto"
Cohesion: 0.05
Nodes (77): packedConsumerPnpmRepair(), sha256(), approveFeature(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), artifactPath() (+69 more)

### Community 4 - "cx"
Cohesion: 0.07
Nodes (103): TicketProgress, Outbox(), blockedSummary(), ServiceHealthPanel(), followUp(), labels, ServiceHealthRow(), BlockerFollowups() (+95 more)

### Community 5 - "weekly-rollup.ts"
Cohesion: 0.12
Nodes (28): learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), RollupResult (+20 more)

### Community 6 - "budget-ledger.ts"
Cohesion: 0.06
Nodes (59): abandonExpired(), Admission, admit(), admitDeployment(), balance(), bindEvidence(), count(), errcode() (+51 more)

### Community 7 - "index.tsx"
Cohesion: 0.13
Nodes (38): LearningCoverage(), when(), SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS (+30 more)

### Community 8 - "queue-progress.ts"
Cohesion: 0.31
Nodes (7): jiraQueueProgress(), nextStage(), deliveryRoles, JiraQueueProgress, STAGE_LABELS, STAGE_ROLE, jiraProgress()

### Community 9 - "TelemetryPanel.tsx"
Cohesion: 0.10
Nodes (39): TelemetryReport, LiveAnchor, AzureBuild, ROLE_NAMES, BreakdownTable(), CostBar(), coverage(), pricedLabel() (+31 more)

### Community 10 - "office/config.ts"
Cohesion: 0.12
Nodes (43): commandFeature(), featureById(), reviewQuestions(), featureItemComplete(), reconcileFeatureCompletion(), discoveryPrompt(), planPrompt(), automaticIntakeWait() (+35 more)

### Community 11 - "overseer/commands.ts"
Cohesion: 0.16
Nodes (23): guardPresent(), overseerCommand(), reconcileArgs(), resolveCliRoot(), runnerStatus(), bounded(), ControlRead, Halt (+15 more)

### Community 12 - "OfficeSnapshot"
Cohesion: 0.05
Nodes (69): themeColor, App(), BrainWorkspace, CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants, ElevatorPhase (+61 more)

### Community 13 - "admit-improvement.ts"
Cohesion: 0.20
Nodes (17): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+9 more)

### Community 14 - "request.ts"
Cohesion: 0.08
Nodes (67): MISSING_NATIVE_LINK, AdoptionBinding, assertAutomationAuthority(), observeAutomationConflict(), VERB, assertAutomationEffects(), automationMergePolicy(), observeAutomationMerge() (+59 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.13
Nodes (52): accounting, DeliverySubject, nonDelivery, originalReads, createFeature(), assertEnrollable(), enrolled(), assessmentSignal() (+44 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.07
Nodes (58): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, BlockingTrigger, blockingTrigger(), isBlocking() (+50 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.09
Nodes (49): requeueWaitedImplement(), enqueueMetadataRecovery(), baselined(), baselineLearning(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences() (+41 more)

### Community 18 - "launch.mjs"
Cohesion: 0.07
Nodes (93): RFC-9562, CHECKOUT, DEFAULT_DEADLINE_MS, existingPlist(), installOverseer(), LABEL, LAUNCHER_SOURCE, renderPlist() (+85 more)

### Community 19 - "github-delivery.ts"
Cohesion: 0.05
Nodes (94): applyIntakeObservation(), Carried, findingsOwedToRetest(), missingRetestDispositions(), qaPlanEvidenceGap(), qaRunDirectory(), containedFile(), findingsBlock() (+86 more)

### Community 20 - "artifact"
Cohesion: 0.06
Nodes (108): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+100 more)

### Community 21 - "overseer-launch.mjs"
Cohesion: 0.07
Nodes (80): acquireLauncherLock(), alone(), ancestry(), assertDirectoryOrAbsent(), attemptRecord(), bounded(), boundedString(), checkOwnedFile() (+72 more)

### Community 22 - "delivery-repairs.ts"
Cohesion: 0.09
Nodes (42): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+34 more)

### Community 23 - "jira-time.ts"
Cohesion: 0.15
Nodes (32): unresolvedAttempts(), bindingOf(), finishVerifiedEffects(), locks, matches(), publishJiraTime(), readBack(), readBackEntry() (+24 more)

### Community 24 - "redactEvidence"
Cohesion: 0.06
Nodes (46): clip(), clipLapse(), evidencePacket(), ordered(), PACKET_BYTES, PACKET_EVENTS, PACKET_RECORDS, PACKET_SUBJECTS (+38 more)

### Community 25 - "Outbox.tsx"
Cohesion: 0.06
Nodes (49): knowledgeOutbox(), ChatMarkdown(), Conversation(), ConversationDraft, SendMessage, LessonDecisionAction, lessonDecisionState(), readLessonDecision() (+41 more)

### Community 26 - "controller-runtime.ts"
Cohesion: 0.08
Nodes (37): projectData(), StoreDatabase, ControllerEffects, controllerEffects(), DEPLOY_PROJECT, alive(), ControllerMachine, option() (+29 more)

### Community 27 - "fact-bounds.ts"
Cohesion: 0.11
Nodes (28): GitHubMonitor, githubPRDescription(), QuotaHold, collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime() (+20 more)

### Community 28 - "advance-metadata-park.ts"
Cohesion: 0.10
Nodes (59): ProjectCard, advanceMetadataPark(), Parked, releaseWords(), sentAnything(), cardResumeRoute(), effectiveParkPickup(), PICKUP_ASSIGNEE (+51 more)

### Community 29 - "Store"
Cohesion: 0.06
Nodes (25): Assignment, jiraText(), Transition, descriptionPreimage(), plain(), GitHubFeaturePublisher, JiraFeaturePublisher, Result (+17 more)

### Community 30 - "digest"
Cohesion: 0.08
Nodes (72): activeEffectId(), Binding, historyBeforeWrite(), matchesBoundDescription(), DescriptionEdit, DescriptionHistory, DescriptionHistoryUnavailable, descriptionRevision() (+64 more)

### Community 31 - ".activeClaims"
Cohesion: 0.06
Nodes (63): continueUnsealedQA(), entry(), ownershipReadHistory(), writerRestartPending(), deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), deliveryIntakeBlocker() (+55 more)

### Community 32 - "build-overseer-launcher.mjs"
Cohesion: 0.20
Nodes (8): BANNER, builtin(), bundleLauncher(), LAUNCHER_BUNDLE, LAUNCHER_ENTRY, launcherChunk(), REPOSITORY, SCRIPT

### Community 33 - "coordination.ts"
Cohesion: 0.15
Nodes (20): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), legacy, validateNativeContinuation(), checkpointWindow() (+12 more)

### Community 34 - "rate-limit-samples.ts"
Cohesion: 0.13
Nodes (12): bindGitHubRunner(), Runner, GitHubCalls, QuotaGovernor, iso(), RateLimitSamples, Reading, reading() (+4 more)

### Community 35 - "common.cjs"
Cohesion: 0.18
Nodes (22): connections(), fs, main(), path, crypto, ensureInside(), { execFileSync }, fs (+14 more)

### Community 36 - "scheduled-work.ts"
Cohesion: 0.08
Nodes (41): freshOwnershipRead(), dueSlackReread(), rereadUncertainSlack(), runningRevision(), deliverySlot(), verifiedCloseoutCleanupRequest(), withAmendmentOwnership(), gateFeatureWork() (+33 more)

### Community 37 - "routing.cjs"
Cohesion: 0.14
Nodes (27): main(), parseArgs(), usage(), adjacency(), edgeCost(), edgeKey(), edgeType(), EVIDENCE_TYPE_PRIORITY (+19 more)

### Community 38 - "GitHubDelivery"
Cohesion: 0.06
Nodes (53): assertParkDecision(), resumeProviderReviews(), GitHubDelivery, observe(), stageRole(), stopReason(), returnDraftToPromotion(), CheckJobAgreement (+45 more)

### Community 39 - "assignments.ts"
Cohesion: 0.10
Nodes (27): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), KnowledgeContext, knowledgeSnapshot(), officeKnowledgeSnapshot(), lessonForProject(), AssignmentLookups (+19 more)

### Community 40 - "observe-github-merges.ts"
Cohesion: 0.30
Nodes (14): clearCooldown(), coolDown(), coolingDown(), MERGE_NOTICE_RECHECK_MS, waitKey(), waits, isMergeCommit(), issueOf() (+6 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.20
Nodes (21): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), ticketUnresolved(), ticketDayTotals() (+13 more)

### Community 42 - "coordination-pump.ts"
Cohesion: 0.15
Nodes (19): Admission, admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, compatible(), dependencyCompletionKey(), dependencyEligibility() (+11 more)

### Community 43 - ".save"
Cohesion: 0.10
Nodes (54): enumerateIntakeList(), inPickupOrder(), Intake, text(), resolveBlockedTransition(), document(), transitionWithComment(), jiraAccount() (+46 more)

### Community 44 - "Offices"
Cohesion: 0.12
Nodes (4): QuestionNotifications, InFlightOperations, Offices, SessionBridge

### Community 45 - "harness-baseline.ts"
Cohesion: 0.15
Nodes (22): BaselineReport, baselineReport(), BaselineSource, baselineText(), millions(), row(), share(), add() (+14 more)

### Community 46 - "credential-spans.ts"
Cohesion: 0.06
Nodes (68): BareValue, bareValue(), deeperValueEnd(), ENDS, isSeparator(), plainEscape(), queryValue(), separatorEscapeAt() (+60 more)

### Community 47 - "lesson-selection.ts"
Cohesion: 0.15
Nodes (16): INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), LessonSelection, MAINTENANCE, MAX_LESSONS (+8 more)

### Community 48 - "Ticket"
Cohesion: 0.06
Nodes (55): carriedNotRepeated(), changeScopeNote(), Scoped, JiraOperations, movedHeadNote(), cecPrompt(), resolvedDecisionNote(), stageInstructionsFor() (+47 more)

### Community 49 - "index.ts"
Cohesion: 0.07
Nodes (46): implementationPreview(), implementationContinuationRoute(), qaPlanRetryRoute(), close(), config, itSpecialist, loadedRevision, offices (+38 more)

### Community 50 - "QuestionStepper.tsx"
Cohesion: 0.21
Nodes (17): FeatureQuestionProjection, OutboxQuestionRound(), send(), draftKey(), readDraft(), saveDraft(), nextQuestion(), orderedQuestions() (+9 more)

### Community 51 - "investigations/ledger.ts"
Cohesion: 0.09
Nodes (40): acceptedCompletionResolution(), INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationCandidates(), investigationId(), investigationEvidence(), finishedSubjectResolution(), investigationFollowUps() (+32 more)

### Community 52 - "OfficeProject"
Cohesion: 0.13
Nodes (19): IntakeView, ServiceContext, OfficeConfigInputs, officeConfigRoute(), officeConfigSummary(), projectSettingsSummary(), DelayHistogram, LOOP_SAMPLE_MS (+11 more)

### Community 53 - "sanitizeObject"
Cohesion: 0.14
Nodes (17): sanitizeObject(), readSavedState(), LARGE_KEY_CHARS, plain(), RedactedEntries, RedactedEntry, redactEntries(), joinParts() (+9 more)

### Community 54 - "jiraBinding"
Cohesion: 0.17
Nodes (11): intakeMembership(), contentSchema(), JiraIssuePublisher, cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), plainResume() (+3 more)

### Community 55 - "ref_node_child_process"
Cohesion: 0.10
Nodes (22): changedPaths(), { execFileSync }, files, isMapInput(), mapOnly(), { execFileSync }, git(), publish() (+14 more)

### Community 56 - "DrawerTopic.tsx"
Cohesion: 0.11
Nodes (29): createConversationDrafts(), BrainDrawer(), DrawerNavigation, DrawerPage(), InspectorProps, DrawerEntry, DrawerPath, popPage() (+21 more)

### Community 57 - "pass.ts"
Cohesion: 0.09
Nodes (41): RunnerLimits, appendFailureLine(), Evidence, FAILURE_ID, FailureEvent, failureLine(), JournalRefused, JournalView (+33 more)

### Community 58 - "ref_node_path"
Cohesion: 0.07
Nodes (49): GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles(), absent() (+41 more)

### Community 59 - "time-readback.ts"
Cohesion: 0.16
Nodes (15): JiraAttempt, JiraWorklogExpected, JiraWorklogReconcile, hoursReadbackPending(), Ledger, Read, TimeLedger, dueReadback() (+7 more)

### Community 60 - "cost-ledger.ts"
Cohesion: 0.14
Nodes (29): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress(), effectId() (+21 more)

### Community 61 - "reader.ts"
Cohesion: 0.07
Nodes (31): committedNotePage(), BrainGraph, BrainNote, BrainReader, CommittedBrain, GraphNode, GraphPage, hash (+23 more)

### Community 62 - "maintenance/maintenance.ts"
Cohesion: 0.10
Nodes (28): maintenancePolicies(), captureMaintenanceStep(), accessibilitySources(), reconcileSourceScan(), sourceFindings, sourceReview(), candidateOwner(), SETTLED (+20 more)

### Community 63 - "Button"
Cohesion: 0.07
Nodes (64): guidanceExcerpt(), KnowledgeActivity, KnowledgeActivityPage, KnowledgeEdge, KnowledgeMap, KnowledgeNode, Activity(), ActivityTimeline() (+56 more)

### Community 64 - "constellation-runtime.ts"
Cohesion: 0.09
Nodes (21): CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point, ConstellationRuntime, createConstellation() (+13 more)

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
Cohesion: 0.11
Nodes (67): restartStoppedWriters(), unchangedSinceAccepted(), DeliveryAuthorityInput, canonical(), assessResumes(), Standing, checkpointEligibility(), admitAssignmentResume() (+59 more)

### Community 69 - "ticket-evidence.ts"
Cohesion: 0.11
Nodes (27): assetDownloader(), attachmentKind(), evidenceDirectory(), readEvidence(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS (+19 more)

### Community 70 - "OfficeScene.tsx"
Cohesion: 0.17
Nodes (33): withoutElapsed(), Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk() (+25 more)

### Community 71 - "retrospective-subject.ts"
Cohesion: 0.21
Nodes (13): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+5 more)

### Community 72 - "session-context-file.ts"
Cohesion: 0.19
Nodes (16): unpackContextFailure(), ContextFoldPrefix, contextFoldPrefix(), SessionContextCheckpoint, captureSessionContextClone(), ContextReadPhase, SessionContextDeadline, sessionContextFile() (+8 more)

### Community 73 - "MaintenanceRun"
Cohesion: 0.16
Nodes (16): CheckpointEligibility, BrainStatusSchema, identity, checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), repeatedVendorReviewBlock(), stoppedInVendorReview() (+8 more)

### Community 74 - "session-scope.ts"
Cohesion: 0.20
Nodes (16): Bound, claudeScopeParser(), claudeSessionScope(), CODEX_ROLLOUTS, contextReaders(), retainSessionMessage(), SessionConversation, escaped() (+8 more)

### Community 75 - "service-health.ts"
Cohesion: 0.11
Nodes (23): ClaudeLoginRefusal, claudeLoginRefusal(), claudeRefusalWords(), RECORDED_REFUSALS, refusedClaudeRow(), providers, ProviderStatusChecks, summary (+15 more)

### Community 76 - "project-bindings.ts"
Cohesion: 0.11
Nodes (32): az(), AzureMonitor, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs(), fullActivePRs() (+24 more)

### Community 77 - "closeout-recovery.ts"
Cohesion: 0.11
Nodes (42): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+34 more)

### Community 78 - "incidents.ts"
Cohesion: 0.08
Nodes (50): attributedRecords(), foldsItsRun(), groupCandidates(), ObservedIncident, ObservedSubject, incidentId(), mailboxFreeze(), ProjectObservation (+42 more)

### Community 79 - "prompts/conversations.ts"
Cohesion: 0.18
Nodes (13): ownReceipts(), Receipt, Settled, SETTLED_RECEIPT_NOTE, supersededReceipt(), ticketForWorker(), cecChatPrompt(), ctoChatPrompt() (+5 more)

### Community 80 - "session-bridge.ts"
Cohesion: 0.10
Nodes (29): codexDaemonProcesses(), accountCodexProcesses(), CodexProcessInventory, codexProcessInventory(), DesktopSessions, unaccountedProcesses(), codexThreadMetadata(), METADATA_CHUNK (+21 more)

### Community 81 - "Coordinator"
Cohesion: 0.07
Nodes (4): SettleInputs, coordination(), Coordinator, AssignedIssue

### Community 82 - "resume-control.ts"
Cohesion: 0.24
Nodes (9): ResumeArrivalsInput, absent(), NEVER_ENABLED, ResumeControl, stated(), Stored, unreadable(), IncidentsRouteContext (+1 more)

### Community 83 - "follow-production.ts"
Cohesion: 0.20
Nodes (17): awaitingJiraStatus(), awaitingProduction(), FOLLOW_DAYS, followed(), isFollowed(), Azure, AzureRead, containedIn() (+9 more)

### Community 84 - "viewer.js"
Cohesion: 0.19
Nodes (25): addMetaLink(), addMetaRow(), addRelationship(), applyView(), buildIndexes(), buildLegend(), buildModel(), buildRenderer() (+17 more)

### Community 85 - "salvage-worktree.ts"
Cohesion: 0.48
Nodes (6): Execute, keptWork(), Read, refObject(), SalvageRetry, salvageWorktree()

### Community 86 - "stopped-record.ts"
Cohesion: 0.08
Nodes (57): capabilityBlockedReviews(), latestReviews(), boundedEvidence(), expectedWait(), StopFacts, digest(), fingerprint(), normalizeCause() (+49 more)

### Community 87 - ".emit"
Cohesion: 0.08
Nodes (35): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+27 more)

### Community 88 - "superseded-wiki-pr.ts"
Cohesion: 0.09
Nodes (61): commentId(), CommentIntent, CommentReceipt, conversation(), exact(), findProofComment(), matchesProofComment(), postProofComment() (+53 more)

### Community 89 - "spawn-command.ts"
Cohesion: 0.12
Nodes (25): exitFailure(), inactivityWatch(), At, Errno, errno(), GroupInventory, GroupProbe, LifecycleDiagnostic (+17 more)

### Community 90 - "provider-observation.ts"
Cohesion: 0.12
Nodes (27): correlatedBuild(), Azure, azurePipelines(), outcome(), Read, RUNS_PER_PIPELINE, Api, githubWorkflows() (+19 more)

### Community 91 - "readable-jira-comment.ts"
Cohesion: 0.12
Nodes (33): CommentPage, commentReadback(), devUpdate(), HEADLINE, jiraRecord(), unpack(), postDevUpdate(), statusHeld() (+25 more)

### Community 92 - "session-context-client.ts"
Cohesion: 0.11
Nodes (18): claudeSessionContext(), readTranscript, codexSessionContext(), readRollout, packContextFailure(), PackedContextFailure, ContextThread, contextThread() (+10 more)

### Community 93 - "plans.cjs"
Cohesion: 0.12
Nodes (27): fs, main(), parse(), path, atomicWrite(), substantive(), walk(), association() (+19 more)

### Community 94 - "quota-governor.ts"
Cohesion: 0.26
Nodes (9): backgroundHold(), CORE_RESERVE, PROBE_INTERVAL_MS, QuotaGate, quotaLow(), QuotaRefusal, ResourceReading, quotaDeferred() (+1 more)

### Community 96 - "assignment.ts"
Cohesion: 0.13
Nodes (23): latestQA(), notPassedInLatestQA(), QACoverage, qaCoverage(), same(), Tested, safeWebUrl(), officeQAGuidance() (+15 more)

### Community 97 - "deploy.ts"
Cohesion: 0.09
Nodes (45): Body, DeploymentFenceState, fenceTokenDigest(), abandon(), advance(), DEPLOY_STEPS, DeployFacts, ROLLED_BACK (+37 more)

### Community 98 - "ticket-stage-runner.ts"
Cohesion: 0.08
Nodes (54): applyChangeScope(), levels(), MAX_CHECKS, owedUnderScope(), scopeBase(), settled(), statedApproach(), verifiedCandidate() (+46 more)

### Community 99 - "archive-plan.cjs"
Cohesion: 0.17
Nodes (22): fs, main(), parse(), path, archive(), cell(), ensureIndex(), fromArgs() (+14 more)

### Community 100 - "call-scope.ts"
Cohesion: 0.14
Nodes (25): failed(), githubAuthError(), refusedByRateLimit(), revalidated, slurpedPages(), succeeded(), boundGitHubRunner(), currentGitHubProject() (+17 more)

### Community 101 - "workKey"
Cohesion: 0.09
Nodes (33): notOwned(), mergedByOwner(), closeableIssue(), effectsSettled(), eligible(), officePublished(), ownerMerged(), prerequisitesMet() (+25 more)

### Community 102 - "intent.ts"
Cohesion: 0.09
Nodes (23): ContinuationIO, assertOwnership(), decideImplementation(), ImplementationDecision, OwnershipRead, assertCandidateIdle(), Read, closedReadonlyPlan() (+15 more)

### Community 103 - "on-merge-sync.cjs"
Cohesion: 0.15
Nodes (28): fs, main(), path, { spawnSync }, fieldSpan(), frontmatterProblems(), keyPattern(), list() (+20 more)

### Community 104 - "backup-stores.ts"
Cohesion: 0.10
Nodes (36): absentAdmission(), AdmissionComparison, AdmissionSnapshot, compareAdmissions(), snapshotAdmissions(), BackupEntry, BackupInput, BackupInventory (+28 more)

### Community 105 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 106 - "ref_zod"
Cohesion: 0.12
Nodes (32): runningRevision(), runningRevision(), ROOT, runtimeRevision(), CONTROLLER_ENTRY, ControllerPin, Pin, operationPaths() (+24 more)

### Community 107 - "assignment-poll.ts"
Cohesion: 0.06
Nodes (60): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), currentOutbox(), retryCandidateCleanup(), confirmedGone(), goneQuery(), STOPPED (+52 more)

### Community 108 - "work.ts"
Cohesion: 0.14
Nodes (19): effectiveCause(), REPLACED, BLOCKED_CAUSES, blockedCauses(), NONE, projectReadiness(), ProjectReadiness, AssignmentResult (+11 more)

### Community 109 - ".transaction"
Cohesion: 0.12
Nodes (17): bindDelivery(), bindFeature(), helperTelemetry(), helperInstallation(), observeHelperGroups(), stopHelperGroups(), FeatureReviewRunner, stopReview() (+9 more)

### Community 110 - "blocker-followups.ts"
Cohesion: 0.10
Nodes (51): conversationReadbackReady(), followupOf(), pendingReadback(), queueConversationReadback(), readbackEnding(), uncertainConversations(), conversationResolved(), readBackConversations() (+43 more)

### Community 111 - "telemetry/report.ts"
Cohesion: 0.26
Nodes (13): Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked(), row() (+5 more)

### Community 112 - "outbox.ts"
Cohesion: 0.14
Nodes (20): metadataParkAction(), ADOPTION_STALLED_MS, projectOutbox(), item(), syncOutbox(), OwnerStepItem, ownerStepItems(), sameOwnerSteps() (+12 more)

### Community 113 - "resume-outcome.ts"
Cohesion: 0.09
Nodes (31): FLAGS, incidentCommand(), IncidentCommandIO, option(), USAGE, whole(), boundaryCrossed(), Crossing (+23 more)

### Community 114 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 115 - "run-accounting.ts"
Cohesion: 0.05
Nodes (58): BoundedRead, add(), CodexRequest, CodexRollout, CodexTokens, FIELDS, codexHome(), createdAt() (+50 more)

### Community 119 - "store.ts"
Cohesion: 0.06
Nodes (38): leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), Clock, systemClock, DELIVERY_CONCURRENCY, ProjectPolicy (+30 more)

### Community 120 - "notifications.ts"
Cohesion: 0.07
Nodes (36): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR (+28 more)

### Community 121 - "ITFollowUps.tsx"
Cohesion: 0.67
Nodes (4): itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps()

### Community 122 - "daily-cto.ts"
Cohesion: 0.06
Nodes (38): currentCitations(), Fact, NOT_CURRENT, PROVIDER_ERROR, DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt() (+30 more)

### Community 123 - "deploy-command.ts"
Cohesion: 0.13
Nodes (32): pinnedController(), readControllerPin(), writeControllerPin(), controllerOf(), deployCommand(), DeployCommandOptions, report(), status() (+24 more)

### Community 124 - "refresh-issue-state.cjs"
Cohesion: 0.20
Nodes (19): advanceFence(), closingIssues(), githubRefs(), key(), normalizeGithubQuery(), normalizeRepository(), parseGithubQuery(), ref() (+11 more)

### Community 125 - "knowledge.ts"
Cohesion: 0.06
Nodes (39): normalizeStatement(), decideOfficeProposal(), OfficeKnowledgeStore, proposeOfficeLessons(), retireOfficeLesson(), Input, promoteNoteLesson(), BRAIN_SCOPE (+31 more)

### Community 126 - "remove-candidate.ts"
Cohesion: 0.14
Nodes (22): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), maintenanceCandidate(), moveAside(), moveBack(), purgeRemoved(), purging (+14 more)

### Community 127 - "sign-in-unpark.ts"
Cohesion: 0.19
Nodes (17): hasPendingDelivery(), resumeAfterSignIn(), signInWait(), MAX_SIGN_IN_UNPARKS, BrowserPage, browserPages(), ReadPages, SignInState (+9 more)

### Community 128 - "coordination-tick.ts"
Cohesion: 0.16
Nodes (16): reconcileNoticeConfirmations(), interruptAdoptions(), legacy(), REMOVED_FIELDS, retireLegacyRecovery(), goalNoticeNeverDispatched(), maintenanceNoticeNeverDispatched(), checkpointOutcome() (+8 more)

### Community 129 - "call-ledger.ts"
Cohesion: 0.25
Nodes (10): add(), addSource(), busiest(), CallLedger, Entry, sourceRows(), Sources, CallCounts (+2 more)

### Community 130 - "pre-push-boundary.ts"
Cohesion: 0.26
Nodes (10): Event, exactCommand(), Invocation, localHookCommand(), one(), prePushRejection(), PushIdentity, retirementBoundary() (+2 more)

### Community 131 - "it-specialist.ts"
Cohesion: 0.15
Nodes (20): replacedReadback(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), heldFor(), ITContext, recoveryHeld() (+12 more)

### Community 132 - "diagnostic-snapshot.ts"
Cohesion: 0.27
Nodes (10): itChatPrompt(), assignmentDiagnostics(), diagnosticContext(), diagnosticSnapshot(), nativeDeliveryResolved(), itAgent(), itDiagnostics(), followUpStatus() (+2 more)

### Community 133 - "GitHubIssuePublisher"
Cohesion: 0.31
Nodes (4): PublicationReceipt, GitHubIssuePublisher, number(), same()

### Community 134 - "shared.ts"
Cohesion: 0.04
Nodes (84): writerRestartInstruction(), NOT_RETRYABLE, StoppedWriter, stoppedWriter(), WRITER_STAGES, WriterRestartCandidate, writerRestarted(), requireDeliveryAuthority() (+76 more)

### Community 135 - "continue-ownership-read.ts"
Cohesion: 0.25
Nodes (14): continueOwnershipRead(), expiredOwnershipRead(), handoffOwnership(), ReadbackOwnerDecision, ownershipReadGate(), ownershipReadState(), ownershipReadSource(), ReadOwnershipCandidate (+6 more)

### Community 136 - "draft-provenance.ts"
Cohesion: 0.21
Nodes (17): maintenanceVerifiedDraft(), DraftProvenance, draftStep(), draftWorker(), MaintenanceDraft, maintenanceDraftProvenance(), nativeBash(), need() (+9 more)

### Community 137 - "Effects"
Cohesion: 0.10
Nodes (35): settleNotLanded(), defaultPickupStatus(), Write, GitHubOperations, assignedToJoe(), fileLessonIssue(), lessonIssueBody(), lessonIssueMarker() (+27 more)

### Community 138 - "time-ledger.ts"
Cohesion: 0.21
Nodes (16): JiraWorklogAttempt, publishableEntry(), settlementPending(), superseded(), syncing, ScopeRow, clearUnsent(), dueUnsent() (+8 more)

### Community 139 - "Goals.tsx"
Cohesion: 0.07
Nodes (40): ctoInputFailure(), OutboxCTOInput(), recover(), OutboxSavedImplementation(), apply(), review(), OutboxSavedPlan(), reconcile() (+32 more)

### Community 140 - "metadata-park-words.ts"
Cohesion: 0.19
Nodes (16): parksInJira(), OUTCOME, qaComment(), remote(), STAGE, plainWords(), tidy(), field() (+8 more)

### Community 141 - "brain-maintenance.ts"
Cohesion: 0.19
Nodes (12): BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, brainResultStop(), GateMark, gateMark(), MAX_START_RETRIES, neverStarted() (+4 more)

### Community 142 - "scheduler.ts"
Cohesion: 0.11
Nodes (16): OfficeCapacity, PROJECT_LOCAL, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch() (+8 more)

### Community 144 - "reconcile-merges.cjs"
Cohesion: 0.22
Nodes (14): collectPulls(), copyWikiForDryRun(), { execFileSync }, flattenPages(), fs, githubRequest(), isWikiBotPull(), main() (+6 more)

### Community 145 - "preferences-store.ts"
Cohesion: 0.19
Nodes (9): PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS, OfficePreferences (+1 more)

### Community 146 - "holdReason"
Cohesion: 0.05
Nodes (84): boardPreflightCandidate(), Ownership, reconcileBoardPreflight(), candidateInput(), children, oldAdoptionBasis(), SavedCandidateAdmission, savedCandidateAdmission() (+76 more)

### Community 147 - "pilot-delivery.ts"
Cohesion: 0.06
Nodes (38): candidateBranchMoved(), endChangeScope(), scopeOutgrown(), continueImplementation(), nativeIO, checkMail(), drainMail(), requestMail() (+30 more)

### Community 148 - "runner-root.ts"
Cohesion: 0.15
Nodes (26): DEFAULT_OFFICE_URL, LOOPBACK, officeUrl(), privateDirectories(), RunnerPaths, runnerPaths(), PIN_ENTRY, pinCommand() (+18 more)

### Community 149 - "harnessEffect"
Cohesion: 0.08
Nodes (68): effectKey(), LaneOperation, laneWrite(), moveCardOnce(), Lane, MOVABLE, moveLane(), resolveLane() (+60 more)

### Community 150 - "serve-graph.cjs"
Cohesion: 0.24
Nodes (9): createServer(), fs, http, listen(), attempt(), main(), path, resolveRequest() (+1 more)

### Community 151 - "read-retries.ts"
Cohesion: 0.18
Nodes (16): ATTEMPT_DELAYS_MS, nextAttemptAt(), releaseFunds(), writerRestartCandidate(), PrerequisitesSchema, classifyStop(), ReviewWait, incompleteReadOutput() (+8 more)

### Community 152 - "node-visuals.ts"
Cohesion: 0.20
Nodes (14): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+6 more)

### Community 153 - "project-bindings-config.ts"
Cohesion: 0.08
Nodes (47): escaped(), IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), projectListScope(), AUTO_ADOPT_BOTS, assertFeaturePlanningConfig() (+39 more)

### Community 154 - "effects.ts"
Cohesion: 0.14
Nodes (19): featureEffectGate(), currentApproval(), featureGate(), predecessorComplete(), FeaturePublisher, publishFeature(), DeliveryPreflight, deliveryPreflight() (+11 more)

### Community 155 - "recorded-gh-command.ts"
Cohesion: 0.19
Nodes (20): assignments(), changeDirectory(), closing(), CREATE, createGuard(), flags(), named(), read() (+12 more)

### Community 156 - "timed-statements.ts"
Cohesion: 0.22
Nodes (12): StoreTimings, NAMED, rowsText(), rowText(), SQL_TOKEN, statementName(), text(), timed() (+4 more)

### Community 157 - "security.ts"
Cohesion: 0.14
Nodes (15): snapshot(), snapshotText(), AFTER_JSON_ESCAPE, BEARER_CREDENTIAL, escapedAt(), HEADER_CREDENTIAL, HEADER_OPERAND, HEADER_PREFIX (+7 more)

### Community 158 - "it-report.ts"
Cohesion: 0.27
Nodes (10): followUpPicture(), publishITReport(), archiveOldReports(), RETAINED_REPORTS, archiveByMonth(), archiveHistory(), archiveMonth(), archiveOldTaskDetail() (+2 more)

### Community 160 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 161 - "delivery-ownership.ts"
Cohesion: 0.33
Nodes (4): Ownership, ownershipContext, refreshDeliveryOwnership(), RefreshOwnership

### Community 162 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (7): CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility, overlayEntranceDelays(), SceneOverlay()

### Community 163 - "dates.cjs"
Cohesion: 0.31
Nodes (12): today(), dateFromPlanBasename(), dateFromSessionPath(), evidenceDates(), fileMtimeDate(), fs, gitCommitDate(), inferPlanDate() (+4 more)

### Community 164 - "judge-resumes.ts"
Cohesion: 0.06
Nodes (54): inHistoryOf(), CompareMemory, compareMemory(), COMPARES_PER_PASS, comparison(), DeployedFixes, DeployedFixesInput, recordDeployedFixes() (+46 more)

### Community 165 - "features/routes.ts"
Cohesion: 0.33
Nodes (4): Link, linkFeature(), featureRoute(), FeatureWorkflow

### Community 166 - "connectWith"
Cohesion: 0.38
Nodes (5): connectWith(), data(), envelope(), JiraWorklogs, WorklogSave

### Community 168 - "owned-artifact.ts"
Cohesion: 0.11
Nodes (24): base, count, Current, guardStanding(), iso, LAUNCH_KINDS, LauncherState, LaunchRecord (+16 more)

### Community 169 - "DeploymentFence"
Cohesion: 0.18
Nodes (10): assertToken(), DeploymentFence, declaredWithin(), deploymentFenceGate(), DeploymentFenceGateContext, STOPPING_COMMANDS, stoppingCommand(), Action (+2 more)

### Community 170 - "QAResultsCard.tsx"
Cohesion: 0.40
Nodes (7): qaResultChanges(), QA_STAGES, qaResults(), qaStatus(), artifact(), QAResultsCard(), Report()

### Community 171 - "build-release.ts"
Cohesion: 0.13
Nodes (24): releaseIdentity(), ActiveRelease, readActiveRelease(), BUILD_ENV, buildRelease(), BuildReleaseOptions, Execute, pinnedVersions() (+16 more)

### Community 172 - "jira-attempts.ts"
Cohesion: 0.39
Nodes (8): attempted(), attemptState(), bound(), covers(), jiraAttempts(), JiraAttemptState, open(), provenNeverSent()

### Community 173 - "handover-cms.ts"
Cohesion: 0.40
Nodes (3): file, project, root

### Community 174 - "harness-parked-card.ts"
Cohesion: 0.60
Nodes (4): BLOCK, harnessBlockMove(), harnessParkedCard(), noted()

### Community 176 - "validate_wiki_pr_body.cjs"
Cohesion: 0.33
Nodes (5): { execFileSync }, hasCanonicalWikiBody(), maintenanceBodies, matchesMaintenanceBody(), { readFileSync }

### Community 177 - "office-qa-handoff.ts"
Cohesion: 0.60
Nodes (4): OfficeQAHandoff, OfficeQAHandoffInput, OfficeQAHandoffRequest, QAOwnershipProof

### Community 179 - "qa-plan-retry.ts"
Cohesion: 0.67
Nodes (3): QAPlanRetry, QAPlanRetryProof, QAPlanRetryRequest

## Knowledge Gaps
- **1 isolated node(s):** `RFC-9562`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 1167 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `agents.ts`, `ref_node_crypto`, `weekly-rollup.ts`, `office/config.ts`, `OfficeSnapshot`, `admit-improvement.ts`, `request.ts`, `scheduled-captures.ts`, `run-retrospective.ts`, `record-trigger.ts`, `github-delivery.ts`, `artifact`, `delivery-repairs.ts`, `jira-time.ts`, `redactEvidence`, `controller-runtime.ts`, `fact-bounds.ts`, `advance-metadata-park.ts`, `digest`, `.activeClaims`, `coordination.ts`, `scheduled-work.ts`, `GitHubDelivery`, `assignments.ts`, `observe-github-merges.ts`, `time-scope.ts`, `coordination-pump.ts`, `.save`, `Offices`, `lesson-selection.ts`, `Ticket`, `index.ts`, `investigations/ledger.ts`, `sanitizeObject`, `jiraBinding`, `ref_node_path`, `time-readback.ts`, `cost-ledger.ts`, `reader.ts`, `maintenance/maintenance.ts`, `resume-arrivals.ts`, `ticket-evidence.ts`, `retrospective-subject.ts`, `MaintenanceRun`, `project-bindings.ts`, `closeout-recovery.ts`, `prompts/conversations.ts`, `session-bridge.ts`, `follow-production.ts`, `stopped-record.ts`, `.emit`, `superseded-wiki-pr.ts`, `provider-observation.ts`, `readable-jira-comment.ts`, `ticket-stage-runner.ts`, `workKey`, `intent.ts`, `assignment-poll.ts`, `.transaction`, `blocker-followups.ts`, `run-accounting.ts`, `store.ts`, `notifications.ts`, `daily-cto.ts`, `knowledge.ts`, `remove-candidate.ts`, `sign-in-unpark.ts`, `coordination-tick.ts`, `it-specialist.ts`, `diagnostic-snapshot.ts`, `shared.ts`, `continue-ownership-read.ts`, `draft-provenance.ts`, `Effects`, `time-ledger.ts`, `brain-maintenance.ts`, `scheduler.ts`, `holdReason`, `pilot-delivery.ts`, `harnessEffect`, `read-retries.ts`, `effects.ts`, `judge-resumes.ts`, `features/routes.ts`, `jira-attempts.ts`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **What connects `RFC-9562` to the rest of the system?**
  _1 weakly-connected nodes found - possible missing edges._
- **Should `incidents/routes.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07622504537205081 - nodes in this community are weakly interconnected._
- **Why does `command()` connect `Store` to `incidents/routes.ts`, `agents.ts`, `ref_node_crypto`, `weekly-rollup.ts`, `shared.ts`, `continue-ownership-read.ts`, `Effects`, `office/config.ts`, `time-ledger.ts`, `brain-maintenance.ts`, `holdReason`, `pilot-delivery.ts`, `github-delivery.ts`, `harnessEffect`, `delivery-repairs.ts`, `artifact`, `redactEvidence`, `jira-time.ts`, `controller-runtime.ts`, `fact-bounds.ts`, `digest`, `coordination.ts`, `judge-resumes.ts`, `GitHubDelivery`, `connectWith`, `coordination-pump.ts`, `.save`, `build-release.ts`, `ref_node_path`, `time-readback.ts`, `cost-ledger.ts`, `reader.ts`, `maintenance/maintenance.ts`, `ticket-evidence.ts`, `service-health.ts`, `project-bindings.ts`, `closeout-recovery.ts`, `session-bridge.ts`, `resume-control.ts`, `salvage-worktree.ts`, `provider-observation.ts`, `readable-jira-comment.ts`, `deploy.ts`, `ticket-stage-runner.ts`, `call-scope.ts`, `ref_zod`, `.transaction`, `notifications.ts`, `deploy-command.ts`, `remove-candidate.ts`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Should `OrgChart.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11170212765957446 - nodes in this community are weakly interconnected._
- **Why does `OfficeSnapshot` connect `OfficeSnapshot` to `coordination-tick.ts`, `OrgChart.tsx`, `it-specialist.ts`, `diagnostic-snapshot.ts`, `cx`, `shared.ts`, `index.tsx`, `queue-progress.ts`, `TelemetryPanel.tsx`, `office/config.ts`, `Goals.tsx`, `record-trigger.ts`, `holdReason`, `github-delivery.ts`, `Outbox.tsx`, `Store`, `it-report.ts`, `scene-motion.ts`, `judge-resumes.ts`, `QAResultsCard.tsx`, `harness-baseline.ts`, `index.ts`, `investigations/ledger.ts`, `OfficeProject`, `sanitizeObject`, `DrawerTopic.tsx`, `ref_node_path`, `maintenance/maintenance.ts`, `Button`, `resume-arrivals.ts`, `OfficeScene.tsx`, `MaintenanceRun`, `service-health.ts`, `project-bindings.ts`, `incidents.ts`, `stopped-record.ts`, `.emit`, `quota-governor.ts`, `assignment-poll.ts`, `work.ts`, `outbox.ts`, `resume-outcome.ts`, `store.ts`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Should `agents.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.04040404040404041 - nodes in this community are weakly interconnected._