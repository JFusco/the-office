# Graph Report - the-office  (2026-11-26)

## Corpus Check
- 1336 files · ~596,012 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 7341 nodes · 31533 edges · 185 communities (177 shown, 8 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 1079 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8b4658a6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- incidents/routes.ts
- OrgChart.tsx
- worker-runtime.ts
- features.ts
- cx
- GitHubDelivery
- budget-ledger.ts
- index.tsx
- shared.ts
- TelemetryPanel.tsx
- normalize-question.ts
- ref_zod
- App.tsx
- propose-improvements.ts
- request.ts
- scheduled-captures.ts
- run-retrospective.ts
- record-trigger.ts
- process-group.mjs
- dependency-bots/adopt.ts
- holdReason
- overseer-launch.mjs
- Ticket
- jira-time.ts
- admit-repair-waits.ts
- github.ts
- controller-runtime.ts
- fact-bounds.ts
- advance-metadata-park.ts
- Store
- digest
- recovery/stopped-base-update.ts
- .transaction
- run.ts
- local-config.ts
- wiki-graph.cjs
- scheduled-work.ts
- routing.cjs
- TicketJob
- lesson-selection.ts
- knowledge.ts
- time-scope.ts
- assignments.ts
- .save
- Offices
- harness-baseline.ts
- security.ts
- deployed-fixes.ts
- deploy-context.ts
- index.ts
- QuestionStepper.tsx
- bare-value.ts
- investigations/ledger.ts
- state-parts.ts
- github/issue-publication.ts
- run-directories.ts
- runner-report.ts
- sanitize
- continue-ownership-read.ts
- api-routes.ts
- cost-ledger.ts
- LearningSubject
- accessibility-sources.ts
- MapView.tsx
- constellation-runtime.ts
- validate_pr_body.cjs
- audit-plan-candidates.cjs
- office-client.ts
- resume-arrivals.ts
- ticket-evidence.ts
- OfficeScene.tsx
- spawn-command.ts
- session-context-lines.ts
- project-binding-blocks.ts
- session-scope.ts
- service-health.ts
- project-bindings.ts
- closeout-recovery.ts
- incidents.ts
- agents.ts
- session-bridge.ts
- Coordinator
- json
- promotion-pr.ts
- viewer.js
- restart-writer.ts
- stopped-record.ts
- conversations/conversations.ts
- superseded-wiki-pr.ts
- ref_node_child_process
- provider-observation.ts
- readable-jira-comment.ts
- session-context-file.ts
- plans.cjs
- assignment-poll.ts
- capture-session-clone.py
- assignment.ts
- rollback.ts
- pilot-delivery.ts
- archive-plan.cjs
- call-scope.ts
- time-readback.ts
- inspect-closed-plan.ts
- on-merge-sync.cjs
- snapshot-stores.ts
- extract-worker.mjs
- deploy.ts
- harnessEffect
- work.ts
- pr-observation-graphql.ts
- blocker-followups.ts
- time-ledger.ts
- Effects
- judge-resumes.ts
- slack-supersession.ts
- run-accounting.ts
- qa.ts
- qa-plan-continuation.ts
- writer-restart.ts
- store.ts
- supersedingDelivery
- install-overseer.mjs
- daily-cto.ts
- deploy-command.ts
- refresh-issue-state.cjs
- http/commands.ts
- github-delivery.ts
- sign-in-unpark.ts
- it-specialist.ts
- launcher-state.mjs
- pre-push-boundary.ts
- continue-access-only-plan.ts
- release-verification.mjs
- pr-observation-shape.ts
- weekly-rollup.ts
- node-visuals.ts
- draft-provenance.ts
- retrospective-subject.ts
- goal-reviews.ts
- Outbox.tsx
- delivery-recoveries.ts
- scene-motion.ts
- scheduler.ts
- production.ts
- reconcile-merges.cjs
- timed-statements.ts
- artifact
- engine.ts
- runner-root.ts
- RoomCamera.tsx
- common.cjs
- .emit
- resume-control.ts
- projects.ts
- deployment-fence.ts
- recorded-gh-command.ts
- prompts/conversations.ts
- observe-github-merges.ts
- ServiceHealthPanel.tsx
- routing.js
- ForwardingState
- credential-spans.ts
- remove-candidate.ts
- createConstellation
- telemetry/report.ts
- proof-comment.ts
- launch.mjs
- defaultPickupStatus
- jira-attempts.ts
- provider-limit-resolution.ts
- useOfficePreferences.ts
- deploy-plan.ts
- QAResultsCard.tsx
- validate_wiki_pr_body.cjs
- live-reach.ts
- build-overseer-launcher.mjs
- candidate.ts
- delivery-task.ts
- seeded-office-lessons.ts
- ref_node_crypto
- delivery-ownership.ts
- parked-card-refusal.ts
- save-report.ts
- office-qa-handoff.ts
- evidenceText

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

## Communities (185 total, 8 thin omitted)

### Community 0 - "incidents/routes.ts"
Cohesion: 0.07
Nodes (56): citationFault(), CitationSchema, SourceVersions, sourceVersions(), dismiss(), DISMISSAL_CITATIONS, DISMISSAL_REASON, DismissalFacts (+48 more)

### Community 1 - "OrgChart.tsx"
Cohesion: 0.10
Nodes (41): label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+33 more)

### Community 2 - "worker-runtime.ts"
Cohesion: 0.08
Nodes (36): candidateWorkspaceEnvironment(), assignmentSubject(), lessonPurpose(), selectLessons(), catalogLine(), assertBriefingScope(), contextPacket(), sanitizeObject() (+28 more)

### Community 3 - "features.ts"
Cohesion: 0.05
Nodes (118): approveFeature(), commandFeature(), createFeature(), featureById(), mutation(), reviewQuestions(), assertFeatureDependencyOrder(), featureDependencyEdges() (+110 more)

### Community 4 - "cx"
Cohesion: 0.07
Nodes (105): Conversation(), Outbox(), SlackDeliveryCard(), BlockerFollowups(), LearningCoverage(), Evidence(), LessonCard(), LessonShape() (+97 more)

### Community 5 - "GitHubDelivery"
Cohesion: 0.05
Nodes (76): notOwned(), resumeProviderReviews(), GitHubDelivery, mergedByOwner(), observe(), closeableIssue(), effectsSettled(), eligible() (+68 more)

### Community 6 - "budget-ledger.ts"
Cohesion: 0.06
Nodes (56): abandonExpired(), Admission, admit(), admitDeployment(), balance(), bindEvidence(), count(), errcode() (+48 more)

### Community 7 - "index.tsx"
Cohesion: 0.07
Nodes (68): ctoInputFailure(), OutboxCTOInput(), recover(), OutboxSavedImplementation(), apply(), review(), OutboxSavedPlan(), reconcile() (+60 more)

### Community 8 - "shared.ts"
Cohesion: 0.05
Nodes (82): jiraQueueProgress(), ctoInputIdentityMatches(), ctoInputRecovered(), metadataParkAction(), ADOPTION_STALLED_MS, conversationResolved(), projectOutbox(), item() (+74 more)

### Community 9 - "TelemetryPanel.tsx"
Cohesion: 0.08
Nodes (44): labels, TelemetryReport, displayAgentTask(), githubStageLabels, LiveAgentTask(), Props, RunningTask(), text() (+36 more)

### Community 10 - "normalize-question.ts"
Cohesion: 0.33
Nodes (8): FeatureHarnessOption, FeatureOption, FeatureQuestion, folded(), normalizeQuestion(), optionId(), RawQuestion, StepperRound

### Community 11 - "ref_zod"
Cohesion: 0.06
Nodes (56): BrainStatusSchema, identity, header(), readStanding(), BILLING_MODE, guardPresent(), overseerCommand(), reconcileArgs() (+48 more)

### Community 12 - "App.tsx"
Cohesion: 0.05
Nodes (63): createConversationDrafts(), BrainDrawer(), themeColor, App(), BrainWorkspace, CONNECTION, CONNECTION_DOT, dockItemVariants (+55 more)

### Community 13 - "propose-improvements.ts"
Cohesion: 0.38
Nodes (8): distinct(), identity(), improvementIncident(), improvementIncidentKey(), IMPROVEMENT_POLICY, improvementDigest(), ImprovementProposal, proposeImprovements()

### Community 14 - "request.ts"
Cohesion: 0.09
Nodes (63): refusal(), observeAutomationConflict(), VERB, assertAutomationEffects(), automationMergePolicy(), observeAutomationMerge(), REBASE, rebaseArgs() (+55 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.12
Nodes (53): requestDelivery(), accounting, DeliverySubject, nonDelivery, originalReads, featureEffectGate(), assertFeatureGate(), bindFeature() (+45 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.08
Nodes (48): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, BlockingTrigger, blockingTrigger(), BrainOverlap (+40 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.10
Nodes (43): isBlocking(), baselined(), baselineLearning(), LEARNING_BASELINES, maintainLearning(), configureKnowledge(), busyMaintenanceIds(), clip() (+35 more)

### Community 18 - "process-group.mjs"
Cohesion: 0.35
Nodes (15): stopOrWait(), MAX_PID, validPgid(), groupInventory(), helperCommandFits(), identify(), leaderMatches(), observation() (+7 more)

### Community 19 - "dependency-bots/adopt.ts"
Cohesion: 0.10
Nodes (28): closesIssue(), linkPR(), dependabotPR(), openDependabotPulls(), adoptDependencyBot(), adoptOne(), DependencyBot, Guard (+20 more)

### Community 20 - "holdReason"
Cohesion: 0.05
Nodes (106): interruptedImplementation(), continueUnsealedQA(), entry(), StoppedWriter, needsReconciliation(), assertDraftClaimHistory(), protectedOriginalClaim(), publicationReadArgs() (+98 more)

### Community 21 - "overseer-launch.mjs"
Cohesion: 0.07
Nodes (80): acquireLauncherLock(), alone(), ancestry(), assertDirectoryOrAbsent(), attemptRecord(), bounded(), boundedString(), checkOwnedFile() (+72 more)

### Community 22 - "Ticket"
Cohesion: 0.05
Nodes (63): carriedNotRepeated(), changeScopeNote(), Scoped, intakeMembership(), JiraOperations, parksInJira(), cecPrompt(), cecIntakePrompt() (+55 more)

### Community 23 - "jira-time.ts"
Cohesion: 0.09
Nodes (39): twgProfile(), unresolvedAttempts(), bindingOf(), connectWith(), data(), envelope(), finishVerifiedEffects(), JiraWorklogs (+31 more)

### Community 24 - "admit-repair-waits.ts"
Cohesion: 0.12
Nodes (23): admitRepairWaits(), Covered, COVERING, expiryEvent(), expiryId(), lastProgress(), progressOf(), RepairWaitEntry (+15 more)

### Community 25 - "github.ts"
Cohesion: 0.15
Nodes (18): GitHubMonitor, backgroundHold(), CORE_RESERVE, GRAPHQL_WORK, PROBE_INTERVAL_MS, QuotaGate, QuotaGovernor, QuotaHold (+10 more)

### Community 26 - "controller-runtime.ts"
Cohesion: 0.11
Nodes (17): [cmd,...rawArgs], projectData(), StoreDatabase, controllerEffects(), alive(), ControllerMachine, option(), realMachine() (+9 more)

### Community 27 - "fact-bounds.ts"
Cohesion: 0.15
Nodes (23): githubPRDescription(), collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB (+15 more)

### Community 28 - "advance-metadata-park.ts"
Cohesion: 0.08
Nodes (73): ProjectCard, advanceMetadataPark(), Parked, releaseWords(), sentAnything(), CardResumeRoute, cardResumeRoute(), effectiveParkPickup() (+65 more)

### Community 29 - "Store"
Cohesion: 0.05
Nodes (27): Assignment, jiraText(), Transition, candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate() (+19 more)

### Community 30 - "digest"
Cohesion: 0.06
Nodes (92): retryRead(), createdContentSha256(), Binding, historyBeforeWrite(), matchesBoundDescription(), DescriptionEdit, DescriptionHistory, DescriptionHistoryUnavailable (+84 more)

### Community 31 - "recovery/stopped-base-update.ts"
Cohesion: 0.08
Nodes (38): writerRestartPending(), pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), assertStoppedBaseAudit(), AuditRow, AWS_KEY_ID, CoverageRow, Hash (+30 more)

### Community 32 - ".transaction"
Cohesion: 0.13
Nodes (17): featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), reserveReplacement(), stageBudget(), wakeFeature(), recoverFeatures(), observeHelperGroups() (+9 more)

### Community 33 - "run.ts"
Cohesion: 0.13
Nodes (23): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_FIX_PROMPT, OfficeFixResult (+15 more)

### Community 34 - "local-config.ts"
Cohesion: 0.44
Nodes (10): assertFeaturePlanningConfig(), FeaturePlanningBindings, goalEvidencePath(), assertUniqueProjectKeys(), LocalBindings, localBindings(), parseBindingBlocks(), parseProjectPolicy() (+2 more)

### Community 35 - "wiki-graph.cjs"
Cohesion: 0.18
Nodes (22): connections(), fs, main(), path, ensureInside(), hasSymlinkComponent(), slash(), splitFrontmatter() (+14 more)

### Community 36 - "scheduled-work.ts"
Cohesion: 0.07
Nodes (49): freshOwnershipRead(), dueSlackReread(), rereadUncertainSlack(), runningRevision(), Bot, deliverySlot(), withAmendmentOwnership(), metadataRequestResolved() (+41 more)

### Community 37 - "routing.cjs"
Cohesion: 0.14
Nodes (29): closingIssues(), githubRefs(), normalizeGithubQuery(), normalizeRepository(), parseGithubQuery(), ref(), withoutFencedCode(), adjacency() (+21 more)

### Community 38 - "TicketJob"
Cohesion: 0.08
Nodes (53): Execute, installDependencies(), major(), removeAdoptedClone(), namedRepairIds(), HarnessControl, withHarnessWork(), harnessStageResult() (+45 more)

### Community 39 - "lesson-selection.ts"
Cohesion: 0.09
Nodes (28): LessonBrainAudit, LessonBrainOverlap, INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, LessonSelection, MAINTENANCE (+20 more)

### Community 40 - "knowledge.ts"
Cohesion: 0.09
Nodes (26): Input, Kind, RetrospectiveResult, RetrospectiveResultSchema, RollupResultSchema, Stage, ImprovementGrant, KnowledgeRetry (+18 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.17
Nodes (23): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), ticketUnresolved(), midnight() (+15 more)

### Community 42 - "assignments.ts"
Cohesion: 0.09
Nodes (30): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, GraphNode (+22 more)

### Community 43 - ".save"
Cohesion: 0.09
Nodes (61): enumerateIntakeList(), inPickupOrder(), Intake, text(), resolveBlockedTransition(), document(), transitionWithComment(), jiraAccount() (+53 more)

### Community 44 - "Offices"
Cohesion: 0.10
Nodes (5): QuestionNotifications, CommittedBrain, InFlightOperations, Offices, SessionBridge

### Community 45 - "harness-baseline.ts"
Cohesion: 0.15
Nodes (22): BaselineReport, baselineReport(), BaselineSource, baselineText(), millions(), row(), share(), add() (+14 more)

### Community 46 - "security.ts"
Cohesion: 0.07
Nodes (35): AFTER_LABEL, BARE_CREDENTIAL, BARE_LABEL, BARE_UNIT, BARE_VALUE, CAMEL_START, CONTROL_ESCAPE, CREDENTIAL_NAME (+27 more)

### Community 47 - "deployed-fixes.ts"
Cohesion: 0.14
Nodes (25): inHistoryOf(), CompareMemory, compareMemory(), COMPARES_PER_PASS, comparison(), DeployedFixes, DeployedFixesInput, recordDeployedFixes() (+17 more)

### Community 48 - "deploy-context.ts"
Cohesion: 0.19
Nodes (17): ControllerEffects, DEPLOY_PROJECT, DeployContext, DeployTimings, bootout(), bootstrap(), Execute, serviceLoaded() (+9 more)

### Community 49 - "index.ts"
Cohesion: 0.07
Nodes (31): close(), config, itSpecialist, loadedRevision, offices, releaseLock, respond(), server (+23 more)

### Community 50 - "QuestionStepper.tsx"
Cohesion: 0.21
Nodes (17): FeatureQuestionProjection, OutboxQuestionRound(), send(), draftKey(), readDraft(), saveDraft(), nextQuestion(), orderedQuestions() (+9 more)

### Community 51 - "bare-value.ts"
Cohesion: 0.16
Nodes (18): BareValue, bareValue(), deeperValueEnd(), ENDS, isSeparator(), plainEscape(), SIMPLE, Unit (+10 more)

### Community 52 - "investigations/ledger.ts"
Cohesion: 0.23
Nodes (13): acceptedCompletionResolution(), investigationCandidates(), investigationId(), finishedSubjectResolution(), investigationFollowUps(), interruptedQARerunResolution(), investigationResolution(), syncInvestigations() (+5 more)

### Community 53 - "state-parts.ts"
Cohesion: 0.13
Nodes (16): readSavedState(), LARGE_KEY_CHARS, plain(), RedactedEntries, RedactedEntry, redactEntries(), joinParts(), PartRow (+8 more)

### Community 54 - "github/issue-publication.ts"
Cohesion: 0.08
Nodes (21): contentSchema(), JiraIssuePublisher, descriptionPreimage(), plain(), publicationDescription(), FeaturePublisher, PublicationReceipt, Assign (+13 more)

### Community 55 - "run-directories.ts"
Cohesion: 0.14
Nodes (23): assertOwnedDirectory(), checkRunDirectories(), Child, CHILDREN, code(), createRunDirectories(), DIRECTORY_MODES, DirectoryFacts (+15 more)

### Community 56 - "runner-report.ts"
Cohesion: 0.11
Nodes (31): Digest, Evidence, FAILURE_ID, failureDigest(), FailureReceipt, haltCondition(), HaltReport, LINE_LIMIT (+23 more)

### Community 57 - "sanitize"
Cohesion: 0.08
Nodes (46): FailureEvent, failureLine(), sanitize(), RunnerLimits, appendFailureLine(), JournalRefused, JournalView, syncPath() (+38 more)

### Community 58 - "continue-ownership-read.ts"
Cohesion: 0.25
Nodes (14): continueOwnershipRead(), expiredOwnershipRead(), handoffOwnership(), ReadbackOwnerDecision, ownershipReadGate(), ownershipReadState(), ownershipReadSource(), ReadOwnershipCandidate (+6 more)

### Community 59 - "api-routes.ts"
Cohesion: 0.19
Nodes (15): implementationContinuationRoute(), qaPlanRetryRoute(), servedOutbox(), isNotice(), goalHistory(), apiRoute(), jsonText(), serviceBusy() (+7 more)

### Community 60 - "cost-ledger.ts"
Cohesion: 0.13
Nodes (32): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress(), effectId() (+24 more)

### Community 61 - "LearningSubject"
Cohesion: 0.14
Nodes (17): clip(), MISSED_QUERY_LIMIT, missedQueries(), MissedQuery, decodeLookupJournal(), LookupJournal, clearUnblockBrief(), key() (+9 more)

### Community 62 - "accessibility-sources.ts"
Cohesion: 0.06
Nodes (57): maintenancePolicies(), captureMaintenanceStep(), accessibilitySources(), actionable(), closingPull(), Finding, handoffIssue(), issueLines() (+49 more)

### Community 63 - "MapView.tsx"
Cohesion: 0.05
Nodes (72): KnowledgeActivity, KnowledgeActivityPage, KnowledgeEdge, KnowledgeMap, KnowledgeNode, ChatMarkdown(), ChatMarkdown, MessageText() (+64 more)

### Community 64 - "constellation-runtime.ts"
Cohesion: 0.15
Nodes (16): CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point, focusOverlayMotion(), FocusOverlayLayout (+8 more)

### Community 65 - "validate_pr_body.cjs"
Cohesion: 0.36
Nodes (8): fs, main(), readableText(), REQUIRED_CHECKS, REQUIRED_SECTIONS, sections(), validatePullRequestBody(), withoutComments()

### Community 66 - "audit-plan-candidates.cjs"
Cohesion: 0.14
Nodes (31): audit(), branchIssueNumbers(), classify(), distinctiveTitleWords(), { execFileSync }, extractPaths(), findPrForMergeSubject(), fmtCommit() (+23 more)

### Community 67 - "office-client.ts"
Cohesion: 0.10
Nodes (26): FailureAnswer, HaltAnswer, RUNNER_DEFAULTS, officeDataRoot, realMachine(), bodyWithin(), bounded(), Envelope (+18 more)

### Community 68 - "resume-arrivals.ts"
Cohesion: 0.11
Nodes (63): canonical(), CheckpointEligibility, checkpointEligibility(), admitAssignmentResume(), forAssignment(), admitCheckpointResume(), forCheckpoint(), admitResume() (+55 more)

### Community 69 - "ticket-evidence.ts"
Cohesion: 0.15
Nodes (21): assetDownloader(), attachmentKind(), evidenceDirectory(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS, EvidenceAttachment (+13 more)

### Community 70 - "OfficeScene.tsx"
Cohesion: 0.17
Nodes (33): withoutElapsed(), Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk() (+25 more)

### Community 71 - "spawn-command.ts"
Cohesion: 0.16
Nodes (19): exitFailure(), inactivityWatch(), At, Errno, errno(), GroupInventory, GroupProbe, LifecycleDiagnostic (+11 more)

### Community 72 - "session-context-lines.ts"
Cohesion: 0.23
Nodes (12): Bound, ContextFoldPrefix, contextFoldPrefix(), SessionContextCheckpoint, captureSessionContextClone(), sessionContextFile(), ContextReadChanged, sameContextFile() (+4 more)

### Community 73 - "project-binding-blocks.ts"
Cohesion: 0.12
Nodes (27): escaped(), IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), projectListScope(), azureSchema, deploymentSchema (+19 more)

### Community 74 - "session-scope.ts"
Cohesion: 0.21
Nodes (15): claudeScopeParser(), claudeSessionScope(), CODEX_ROLLOUTS, contextReaders(), retainSessionMessage(), SessionConversation, escaped(), jiraCommandIssues() (+7 more)

### Community 75 - "service-health.ts"
Cohesion: 0.10
Nodes (26): commands(), SIGN_IN_SERVICE_TROUBLE, signInSteps(), Step, ClaudeLoginRefusal, claudeLoginRefusal(), claudeRefusalWords(), RECORDED_REFUSALS (+18 more)

### Community 76 - "project-bindings.ts"
Cohesion: 0.11
Nodes (33): buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs(), fullActivePRs(), observation(), PRRead (+25 more)

### Community 77 - "closeout-recovery.ts"
Cohesion: 0.07
Nodes (59): closeoutReceipt(), readRejection(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2 (+51 more)

### Community 78 - "incidents.ts"
Cohesion: 0.06
Nodes (64): attributedRecords(), foldsItsRun(), groupCandidates(), ObservedIncident, ObservedSubject, eventId(), digest(), fingerprint() (+56 more)

### Community 79 - "agents.ts"
Cohesion: 0.09
Nodes (28): implementationWorkerContext(), RefusedQAResult, savedStageCompletion(), assertContinuableWorktree(), CONTINUABLE, continuationPrompt(), MAX_CONTINUATIONS, recordedContinuation() (+20 more)

### Community 80 - "session-bridge.ts"
Cohesion: 0.10
Nodes (30): codexDaemonProcesses(), accountCodexProcesses(), CodexProcessInventory, codexProcessInventory(), DesktopSessions, unaccountedProcesses(), codexSessionContext(), codexThreadMetadata() (+22 more)

### Community 82 - "json"
Cohesion: 0.16
Nodes (21): classify(), recordRunnerFailure(), resumeSwitch(), failure(), halt(), parse(), readFailure(), REPORT_LIMIT (+13 more)

### Community 83 - "promotion-pr.ts"
Cohesion: 0.18
Nodes (16): awaitingJiraStatus(), awaitingProduction(), FOLLOW_DAYS, followed(), isFollowed(), Azure, AzureRead, containedIn() (+8 more)

### Community 84 - "viewer.js"
Cohesion: 0.19
Nodes (25): addMetaLink(), addMetaRow(), addRelationship(), applyView(), buildIndexes(), buildLegend(), buildModel(), buildRenderer() (+17 more)

### Community 85 - "restart-writer.ts"
Cohesion: 0.18
Nodes (17): ATTEMPT_DELAYS_MS, nextAttemptAt(), restartStoppedWriters(), unchangedSinceAccepted(), NOT_RETRYABLE, releaseFunds(), stoppedWriter(), WRITER_STAGES (+9 more)

### Community 86 - "stopped-record.ts"
Cohesion: 0.07
Nodes (63): capabilityBlockedReviews(), latestReviews(), boundedEvidence(), expectedWait(), StopFacts, FailedMailCheck, lastFailedMailCheck(), lastMailCheckOutcome() (+55 more)

### Community 87 - "conversations/conversations.ts"
Cohesion: 0.09
Nodes (29): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+21 more)

### Community 88 - "superseded-wiki-pr.ts"
Cohesion: 0.10
Nodes (54): abandon(), assertOpenSnapshot(), awaitingContainment(), closeIssue(), CloseRevalidationError, closeSuperseded(), comment(), CommentStep (+46 more)

### Community 89 - "ref_node_child_process"
Cohesion: 0.10
Nodes (22): changedPaths(), { execFileSync }, files, isMapInput(), mapOnly(), { execFileSync }, git(), publish() (+14 more)

### Community 90 - "provider-observation.ts"
Cohesion: 0.13
Nodes (26): az(), correlatedBuild(), Azure, azurePipelines(), outcome(), Read, RUNS_PER_PIPELINE, Api (+18 more)

### Community 91 - "readable-jira-comment.ts"
Cohesion: 0.10
Nodes (38): CommentPage, commentReadback(), devUpdate(), HEADLINE, jiraRecord(), unpack(), postDevUpdate(), OUTCOME (+30 more)

### Community 92 - "session-context-file.ts"
Cohesion: 0.11
Nodes (22): claudeSessionContext(), readTranscript, readRollout, packContextFailure(), PackedContextFailure, unpackContextFailure(), ContextThread, contextThread() (+14 more)

### Community 93 - "plans.cjs"
Cohesion: 0.19
Nodes (19): remoteSlug(), walk(), association(), auditedDigests(), candidate(), collapseByTitle(), discover(), fromMarkdown() (+11 more)

### Community 94 - "assignment-poll.ts"
Cohesion: 0.11
Nodes (32): currentOutbox(), confirmedGone(), goneQuery(), STOPPED, stoppedReviewKeys(), adoptDependabot(), pinCourier, wikiSync (+24 more)

### Community 96 - "assignment.ts"
Cohesion: 0.09
Nodes (34): latestQA(), notPassedInLatestQA(), QACoverage, qaCoverage(), same(), Tested, stagePrompt(), StagePromptInput (+26 more)

### Community 97 - "rollback.ts"
Cohesion: 0.13
Nodes (28): controllerOf(), Commit, DEPLOY_STEPS, DeployFacts, DeployStatus, Digest, RollbackFacts, append() (+20 more)

### Community 98 - "pilot-delivery.ts"
Cohesion: 0.06
Nodes (81): candidateBranchMoved(), applyChangeScope(), endChangeScope(), levels(), MAX_CHECKS, owedUnderScope(), scopeBase(), scopeOutgrown() (+73 more)

### Community 99 - "archive-plan.cjs"
Cohesion: 0.12
Nodes (33): fs, main(), parse(), path, archive(), cell(), ensureIndex(), fromArgs() (+25 more)

### Community 100 - "call-scope.ts"
Cohesion: 0.06
Nodes (53): boardReadFailure(), add(), addSource(), busiest(), CallLedger, Entry, sourceRows(), Sources (+45 more)

### Community 101 - "time-readback.ts"
Cohesion: 0.14
Nodes (16): JiraAttempt, JiraWorklogExpected, JiraWorklogReconcile, Ledger, Read, TimeLedger, missedSinceVerified(), Readback (+8 more)

### Community 102 - "inspect-closed-plan.ts"
Cohesion: 0.10
Nodes (26): savedImplementation(), ContinuationIO, nativeIO, assertOwnership(), ImplementationDecision, implementationPreview(), OwnershipRead, assertCandidateIdle() (+18 more)

### Community 103 - "on-merge-sync.cjs"
Cohesion: 0.14
Nodes (27): fs, main(), path, { spawnSync }, fieldSpan(), frontmatterProblems(), keyPattern(), list() (+19 more)

### Community 104 - "snapshot-stores.ts"
Cohesion: 0.13
Nodes (30): absentAdmission(), AdmissionComparison, AdmissionSnapshot, compareAdmissions(), snapshotAdmissions(), storeMissing(), APPENDED_TABLE, comparableOrder() (+22 more)

### Community 105 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 106 - "deploy.ts"
Cohesion: 0.13
Nodes (28): fenceTokenDigest(), ActiveRelease, readActiveRelease(), BackupEntry, BackupInput, BackupInventory, backupStores(), INVENTORY_FILE (+20 more)

### Community 107 - "harnessEffect"
Cohesion: 0.08
Nodes (71): effectKey(), LaneOperation, laneWrite(), moveCardOnce(), Lane, MOVABLE, moveLane(), resolveLane() (+63 more)

### Community 108 - "work.ts"
Cohesion: 0.07
Nodes (41): FLAGS, incidentCommand(), IncidentCommandIO, option(), USAGE, whole(), boundaryCrossed(), Crossing (+33 more)

### Community 109 - "pr-observation-graphql.ts"
Cohesion: 0.13
Nodes (30): responseBody(), ChildRequest, headCheckRuns(), includeBody(), readOpenPRs(), commitOf(), ConnectionPages, embeddedHead() (+22 more)

### Community 110 - "blocker-followups.ts"
Cohesion: 0.10
Nodes (51): conversationReadbackReady(), followupOf(), pendingReadback(), queueConversationReadback(), readbackEnding(), uncertainConversations(), readBackConversations(), nativeDeliveryResolved() (+43 more)

### Community 111 - "time-ledger.ts"
Cohesion: 0.22
Nodes (15): publishableEntry(), settlementPending(), superseded(), syncing, clearUnsent(), dueUnsent(), markUnsent(), releaseUnsent() (+7 more)

### Community 112 - "Effects"
Cohesion: 0.06
Nodes (44): absent(), candidateParent(), copySavedImplementation(), Saved, sha(), channelNoticeAuthorized(), MergeNotifications, comparableSlackText() (+36 more)

### Community 113 - "judge-resumes.ts"
Cohesion: 0.08
Nodes (34): PacketInput, absent(), IncidentChange, IncidentLedger, isOpen(), Recorded, replayed(), judgeResumes() (+26 more)

### Community 114 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 115 - "run-accounting.ts"
Cohesion: 0.05
Nodes (64): BoundedRead, done(), readBoundedNoFollow(), reasonOf(), add(), CodexRequest, CodexRollout, CodexTokens (+56 more)

### Community 119 - "store.ts"
Cohesion: 0.05
Nodes (46): improvementEligible(), leadershipContext(), captureLearning(), recordLearningOpportunity(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), queueImprovements() (+38 more)

### Community 120 - "supersedingDelivery"
Cohesion: 0.32
Nodes (9): projectSlackDeliveries(), settleRequestedSlackReplacement(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint(), supersedingDelivery(), slackHealth() (+1 more)

### Community 121 - "install-overseer.mjs"
Cohesion: 0.23
Nodes (18): CHECKOUT, DEFAULT_DEADLINE_MS, existingPlist(), installOverseer(), LABEL, LAUNCHER_SOURCE, renderPlist(), SCRIPT (+10 more)

### Community 122 - "daily-cto.ts"
Cohesion: 0.10
Nodes (21): expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), DailyCTO, EvidenceRequestConflict (+13 more)

### Community 123 - "deploy-command.ts"
Cohesion: 0.09
Nodes (44): CONTROLLER_ENTRY, ControllerPin, Pin, pinnedController(), readControllerPin(), writeControllerPin(), deployCommand(), DeployCommandOptions (+36 more)

### Community 124 - "refresh-issue-state.cjs"
Cohesion: 0.23
Nodes (12): advanceFence(), key(), { execFileSync }, fs, issueRefs(), main(), markClosed(), openThreadLineIndexes() (+4 more)

### Community 125 - "http/commands.ts"
Cohesion: 0.09
Nodes (35): decideImplementation(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR (+27 more)

### Community 126 - "github-delivery.ts"
Cohesion: 0.05
Nodes (98): containedFile(), writerRestartInstruction(), ProjectProgress, findingsBlock(), metadataCarriedAdvisoryIds(), ownedBefore(), QA_STAGES, reviewAdvisoryIds() (+90 more)

### Community 127 - "sign-in-unpark.ts"
Cohesion: 0.19
Nodes (17): hasPendingDelivery(), resumeAfterSignIn(), signInWait(), MAX_SIGN_IN_UNPARKS, BrowserPage, browserPages(), ReadPages, SignInState (+9 more)

### Community 128 - "it-specialist.ts"
Cohesion: 0.19
Nodes (13): replacedReadback(), heldFor(), ITContext, recoveryHeld(), recoveryWait(), informationalRecovery(), ITSpecialist, ownAzureCheck() (+5 more)

### Community 129 - "launcher-state.mjs"
Cohesion: 0.26
Nodes (19): RFC-9562, boundedString(), exactKeys(), isCount(), isIso(), isRfcUuid(), isUuid(), readOwner() (+11 more)

### Community 130 - "pre-push-boundary.ts"
Cohesion: 0.26
Nodes (10): Event, exactCommand(), Invocation, localHookCommand(), one(), prePushRejection(), PushIdentity, retirementBoundary() (+2 more)

### Community 131 - "continue-access-only-plan.ts"
Cohesion: 0.44
Nodes (7): Document, document(), isAccessOnlyPlan(), settledAccessOnlyState(), continueAccessOnlyPlan(), entryExists(), SKILLS

### Community 132 - "release-verification.mjs"
Cohesion: 0.24
Nodes (17): isDigest(), isSha(), digestOf(), entryOf(), PASS_ENTRY, releaseRevision(), validManifest(), validPin() (+9 more)

### Community 133 - "pr-observation-shape.ts"
Cohesion: 0.19
Nodes (20): withGitHubOperation(), closingDirectives(), ObservedPR, enumValue(), fail(), graphqlPR(), mapped(), member() (+12 more)

### Community 134 - "weekly-rollup.ts"
Cohesion: 0.19
Nodes (18): expireLearningPackets(), packetReferences(), learningMetrics(), RollupResult, harperFolder(), RETROSPECTIVE_TIMEOUT, retryDelay(), lastFriday() (+10 more)

### Community 135 - "node-visuals.ts"
Cohesion: 0.20
Nodes (14): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+6 more)

### Community 136 - "draft-provenance.ts"
Cohesion: 0.21
Nodes (17): maintenanceVerifiedDraft(), returnDraftToPromotion(), DraftProvenance, draftStep(), draftWorker(), MaintenanceDraft, maintenanceDraftProvenance(), nativeBash() (+9 more)

### Community 137 - "retrospective-subject.ts"
Cohesion: 0.21
Nodes (13): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+5 more)

### Community 138 - "goal-reviews.ts"
Cohesion: 0.13
Nodes (21): currentCitations(), Fact, NOT_CURRENT, PROVIDER_ERROR, applyGoalReview(), DailyResultSchema, DeliveryJob, EvidenceRefSchema (+13 more)

### Community 139 - "Outbox.tsx"
Cohesion: 0.08
Nodes (33): knowledgeOutbox(), ConversationDraft, LessonDecisionAction, lessonDecisionState(), readLessonDecision(), DAYS, dueLessonDecisions(), easternWeek() (+25 more)

### Community 140 - "delivery-recoveries.ts"
Cohesion: 0.12
Nodes (30): deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, requireDeliveryAuthority(), deliveryIntakeBlocker(), gateRegisteredDelivery(), resolveDeliveryWork() (+22 more)

### Community 141 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 142 - "scheduler.ts"
Cohesion: 0.14
Nodes (15): OfficeCapacity, PROJECT_LOCAL, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch() (+7 more)

### Community 144 - "reconcile-merges.cjs"
Cohesion: 0.22
Nodes (14): collectPulls(), copyWikiForDryRun(), { execFileSync }, flattenPages(), fs, githubRequest(), isWikiBotPull(), main() (+6 more)

### Community 145 - "timed-statements.ts"
Cohesion: 0.22
Nodes (12): StoreTimings, NAMED, rowsText(), rowText(), SQL_TOKEN, statementName(), text(), timed() (+4 more)

### Community 146 - "artifact"
Cohesion: 0.05
Nodes (122): ownershipReadHistory(), recoverCTOInput(), completedPreparation(), cancelUnusedSourceReservation(), allowed, continuationNativeReview(), continuationReviewArtifacts(), continuationWorkerProof() (+114 more)

### Community 147 - "engine.ts"
Cohesion: 0.06
Nodes (17): AzureMonitor, checkMail(), drainMail(), requestMail(), dispatchNightly(), enableNightly(), slackSendPrompt(), slackVerifyPrompt() (+9 more)

### Community 148 - "runner-root.ts"
Cohesion: 0.15
Nodes (28): resolveCliRoot(), DEFAULT_OFFICE_URL, LOOPBACK, officeUrl(), privateDirectories(), RunnerPaths, runnerPaths(), PIN_ENTRY (+20 more)

### Community 149 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (7): CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility, overlayEntranceDelays(), SceneOverlay()

### Community 150 - "common.cjs"
Cohesion: 0.11
Nodes (24): fs, main(), parse(), path, atomicWrite(), crypto, { execFileSync }, fs (+16 more)

### Community 151 - ".emit"
Cohesion: 0.07
Nodes (49): reconcileNoticeConfirmations(), Admission, admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, resumeParked(), compatible() (+41 more)

### Community 152 - "resume-control.ts"
Cohesion: 0.15
Nodes (12): ResumeArrivalsInput, absent(), NEVER_ENABLED, ResumeControl, stated(), Stored, unreadable(), IncidentsRouteContext (+4 more)

### Community 153 - "projects.ts"
Cohesion: 0.09
Nodes (26): LOCAL_BINDINGS, file, project, root, officeConfigRoute(), officeConfigSummary(), projectSettingsSummary(), CECBinding (+18 more)

### Community 154 - "deployment-fence.ts"
Cohesion: 0.24
Nodes (6): assertToken(), Body, DeploymentFence, DeploymentFenceState, DeploymentFenceGateContext, DeploymentFenceRouteContext

### Community 155 - "recorded-gh-command.ts"
Cohesion: 0.19
Nodes (20): assignments(), changeDirectory(), closing(), CREATE, createGuard(), flags(), named(), read() (+12 more)

### Community 156 - "prompts/conversations.ts"
Cohesion: 0.17
Nodes (10): ctoChatPrompt(), itChatPrompt(), READABLE_REPLY, canFileGithubIssue(), githubFollowupPrompt(), knowledgeChatPrompt(), boundedCTOContext(), project() (+2 more)

### Community 157 - "observe-github-merges.ts"
Cohesion: 0.28
Nodes (15): clearCooldown(), coolDown(), coolingDown(), MERGE_NOTICE_RECHECK_MS, waitKey(), waits, isMergeCommit(), issueOf() (+7 more)

### Community 158 - "ServiceHealthPanel.tsx"
Cohesion: 0.08
Nodes (35): assignmentDiagnostics(), diagnosticContext(), diagnosticSnapshot(), followUpPicture(), publishITReport(), archiveOldReports(), RETAINED_REPORTS, archiveByMonth() (+27 more)

### Community 161 - "credential-spans.ts"
Cohesion: 0.11
Nodes (33): queryValue(), separatorEscapeAt(), apostropheEnd(), BARE, bareSpans(), credentialSpans(), genuineGap(), HEADER_VALUE (+25 more)

### Community 162 - "remove-candidate.ts"
Cohesion: 0.14
Nodes (22): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), maintenanceCandidate(), moveAside(), moveBack(), purgeRemoved(), purging (+14 more)

### Community 163 - "createConstellation"
Cohesion: 0.18
Nodes (5): ConstellationRuntime, createConstellation(), enter(), finishTap(), move()

### Community 164 - "telemetry/report.ts"
Cohesion: 0.27
Nodes (13): telemetryRoute(), Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked() (+5 more)

### Community 165 - "proof-comment.ts"
Cohesion: 0.41
Nodes (11): commentId(), CommentIntent, CommentReceipt, conversation(), exact(), findProofComment(), matchesProofComment(), postProofComment() (+3 more)

### Community 166 - "launch.mjs"
Cohesion: 0.16
Nodes (24): LOOPBACK, officeOrigin(), passDeadline(), dispatch(), reportedOutcome(), bounded(), isObject(), message() (+16 more)

### Community 167 - "defaultPickupStatus"
Cohesion: 0.40
Nodes (7): defaultPickupStatus(), firstLane(), instruction(), LaneMove, move(), readyLessonIssue(), settle()

### Community 168 - "jira-attempts.ts"
Cohesion: 0.33
Nodes (9): attempted(), attemptState(), bound(), covers(), jiraAttempts(), JiraAttemptState, open(), provenNeverSent() (+1 more)

### Community 169 - "provider-limit-resolution.ts"
Cohesion: 0.39
Nodes (6): investigatesLimitRefusal(), PROVIDER_RECOVERED, providerLimitResolution(), refusedAtLimit(), MONTHS, providerLimit()

### Community 170 - "useOfficePreferences.ts"
Cohesion: 0.13
Nodes (17): fields, PreferencesPatch, PreferencesStore, StoredBody, acceptPreferences(), PreferenceCandidate, PreferenceState, strip() (+9 more)

### Community 171 - "deploy-plan.ts"
Cohesion: 0.11
Nodes (40): runningRevision(), runningRevision(), ReleaseIdentity, releaseIdentity(), runtimeRevision(), BUILD_ENV, buildRelease(), BuildReleaseOptions (+32 more)

### Community 172 - "QAResultsCard.tsx"
Cohesion: 0.40
Nodes (7): qaResultChanges(), QA_STAGES, qaResults(), qaStatus(), artifact(), QAResultsCard(), Report()

### Community 173 - "validate_wiki_pr_body.cjs"
Cohesion: 0.33
Nodes (5): { execFileSync }, hasCanonicalWikiBody(), maintenanceBodies, matchesMaintenanceBody(), { readFileSync }

### Community 174 - "live-reach.ts"
Cohesion: 0.47
Nodes (5): GIT_NETWORK, LIVE_PROVIDERS, liveReach(), networkUrl(), remoteUrls()

### Community 175 - "build-overseer-launcher.mjs"
Cohesion: 0.20
Nodes (8): BANNER, builtin(), bundleLauncher(), LAUNCHER_BUNDLE, LAUNCHER_ENTRY, launcherChunk(), REPOSITORY, SCRIPT

### Community 176 - "candidate.ts"
Cohesion: 0.42
Nodes (7): GitRead, nativeGitRead(), patchArgs, sha(), sourceCopyMatches(), sourceFiles(), verifyContinuationPreservation()

### Community 177 - "delivery-task.ts"
Cohesion: 0.33
Nodes (7): APPROACH_GUIDANCE, reviewInstructions(), deliveryTask(), DeliveryTaskInput, DISCOVERY_GUIDANCE, compactSteps(), featureDeliveryContext()

### Community 178 - "seeded-office-lessons.ts"
Cohesion: 0.32
Nodes (5): CONSOLIDATED, CONSOLIDATED_AT, SEEDS, seedOfficeLessons(), SEEDS

### Community 179 - "ref_node_crypto"
Cohesion: 0.23
Nodes (13): packedConsumerPnpmRepair(), sha256(), readEvidence(), ProviderEvidence, canonical(), evidenceDigest(), evidenceHash(), semantic() (+5 more)

### Community 180 - "delivery-ownership.ts"
Cohesion: 0.33
Nodes (4): Ownership, ownershipContext, refreshDeliveryOwnership(), RefreshOwnership

### Community 181 - "parked-card-refusal.ts"
Cohesion: 0.60
Nodes (4): BLOCK, harnessBlockMove(), harnessParkedCard(), noted()

### Community 182 - "save-report.ts"
Cohesion: 0.60
Nodes (5): contained(), officeReport(), parsed(), saveQAReport(), settled()

### Community 183 - "office-qa-handoff.ts"
Cohesion: 0.60
Nodes (4): OfficeQAHandoff, OfficeQAHandoffInput, OfficeQAHandoffRequest, QAOwnershipProof

### Community 184 - "evidenceText"
Cohesion: 0.80
Nodes (4): evidenceText(), field(), jsonString(), opening()

## Knowledge Gaps
- **1 isolated node(s):** `RFC-9562`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 1224 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `worker-runtime.ts`, `features.ts`, `GitHubDelivery`, `shared.ts`, `ref_zod`, `propose-improvements.ts`, `request.ts`, `scheduled-captures.ts`, `run-retrospective.ts`, `record-trigger.ts`, `dependency-bots/adopt.ts`, `holdReason`, `Ticket`, `jira-time.ts`, `admit-repair-waits.ts`, `github.ts`, `controller-runtime.ts`, `fact-bounds.ts`, `advance-metadata-park.ts`, `digest`, `recovery/stopped-base-update.ts`, `.transaction`, `run.ts`, `scheduled-work.ts`, `TicketJob`, `lesson-selection.ts`, `knowledge.ts`, `time-scope.ts`, `assignments.ts`, `.save`, `Offices`, `deploy-context.ts`, `investigations/ledger.ts`, `state-parts.ts`, `github/issue-publication.ts`, `continue-ownership-read.ts`, `api-routes.ts`, `cost-ledger.ts`, `LearningSubject`, `accessibility-sources.ts`, `resume-arrivals.ts`, `ticket-evidence.ts`, `project-bindings.ts`, `closeout-recovery.ts`, `agents.ts`, `session-bridge.ts`, `promotion-pr.ts`, `restart-writer.ts`, `stopped-record.ts`, `conversations/conversations.ts`, `superseded-wiki-pr.ts`, `provider-observation.ts`, `readable-jira-comment.ts`, `assignment-poll.ts`, `assignment.ts`, `pilot-delivery.ts`, `time-readback.ts`, `inspect-closed-plan.ts`, `harnessEffect`, `pr-observation-graphql.ts`, `blocker-followups.ts`, `time-ledger.ts`, `Effects`, `judge-resumes.ts`, `run-accounting.ts`, `store.ts`, `supersedingDelivery`, `daily-cto.ts`, `http/commands.ts`, `github-delivery.ts`, `sign-in-unpark.ts`, `it-specialist.ts`, `continue-access-only-plan.ts`, `weekly-rollup.ts`, `draft-provenance.ts`, `retrospective-subject.ts`, `goal-reviews.ts`, `delivery-recoveries.ts`, `scheduler.ts`, `artifact`, `engine.ts`, `.emit`, `prompts/conversations.ts`, `observe-github-merges.ts`, `ServiceHealthPanel.tsx`, `remove-candidate.ts`, `telemetry/report.ts`, `proof-comment.ts`, `defaultPickupStatus`, `jira-attempts.ts`, `provider-limit-resolution.ts`, `candidate.ts`, `delivery-task.ts`, `ref_node_crypto`, `parked-card-refusal.ts`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **What connects `RFC-9562` to the rest of the system?**
  _1 weakly-connected nodes found - possible missing edges._
- **Should `incidents/routes.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06564364876385337 - nodes in this community are weakly interconnected._
- **Why does `command()` connect `Store` to `incidents/routes.ts`, `worker-runtime.ts`, `continue-access-only-plan.ts`, `features.ts`, `GitHubDelivery`, `engine.ts`, `holdReason`, `.emit`, `resume-control.ts`, `github.ts`, `controller-runtime.ts`, `jira-time.ts`, `digest`, `remove-candidate.ts`, `TicketJob`, `defaultPickupStatus`, `assignments.ts`, `.save`, `deploy-plan.ts`, `deployed-fixes.ts`, `deploy-context.ts`, `github/issue-publication.ts`, `continue-ownership-read.ts`, `cost-ledger.ts`, `accessibility-sources.ts`, `ticket-evidence.ts`, `service-health.ts`, `project-bindings.ts`, `closeout-recovery.ts`, `agents.ts`, `session-bridge.ts`, `restart-writer.ts`, `provider-observation.ts`, `readable-jira-comment.ts`, `pilot-delivery.ts`, `time-readback.ts`, `inspect-closed-plan.ts`, `harnessEffect`, `time-ledger.ts`, `Effects`, `daily-cto.ts`, `deploy-command.ts`, `http/commands.ts`, `github-delivery.ts`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Should `OrgChart.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10196078431372549 - nodes in this community are weakly interconnected._
- **Why does `sanitize()` connect `sanitize` to `incidents/routes.ts`, `worker-runtime.ts`, `ref_zod`, `Ticket`, `.emit`, `fact-bounds.ts`, `advance-metadata-park.ts`, `prompts/conversations.ts`, `digest`, `Store`, `run.ts`, `scheduled-work.ts`, `.save`, `security.ts`, `index.ts`, `runner-report.ts`, `api-routes.ts`, `LearningSubject`, `office-client.ts`, `resume-arrivals.ts`, `spawn-command.ts`, `service-health.ts`, `project-bindings.ts`, `agents.ts`, `promotion-pr.ts`, `conversations/conversations.ts`, `provider-observation.ts`, `readable-jira-comment.ts`, `Effects`, `store.ts`, `supersedingDelivery`, `daily-cto.ts`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Should `worker-runtime.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0792156862745098 - nodes in this community are weakly interconnected._