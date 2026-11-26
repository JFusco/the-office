# Graph Report - the-office  (2026-11-26)

## Corpus Check
- 1333 files · ~594,267 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 7313 nodes · 31471 edges · 180 communities (172 shown, 8 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 1079 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8ef7cafe`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- incidents/routes.ts
- OrgChart.tsx
- worker-runtime.ts
- authorize.ts
- InspectorContent.tsx
- weekly-rollup.ts
- budget-ledger.ts
- index.tsx
- OfficeSnapshot
- TelemetryPanel.tsx
- features.ts
- kill-switch.ts
- App.tsx
- admit-improvement.ts
- request.ts
- scheduled-captures.ts
- run-retrospective.ts
- record-trigger.ts
- process-group.mjs
- maintenancePolicies
- activation-recovery.ts
- overseer-launch.mjs
- cec-reads.ts
- jira-time.ts
- dependencies.ts
- outbox.ts
- controller-runtime.ts
- goal-reporting.ts
- harnessEffect
- checkpoint-completion.ts
- workKey
- route-head.ts
- process.ts
- owned-artifact.ts
- rate-limit-samples.ts
- wiki-graph.cjs
- scheduled-work.ts
- routing.cjs
- github-delivery.ts
- knowledge.ts
- requests.ts
- time-scope.ts
- assignments.ts
- .save
- Offices
- harness-baseline.ts
- credential-spans.ts
- deployed-fixes.ts
- Ticket
- index.ts
- FeatureWorkspace.tsx
- features/commands.ts
- investigations/ledger.ts
- state-parts.ts
- jiraBinding
- shared.ts
- runner-report.ts
- pass.ts
- copy.ts
- jira-attempts.ts
- cost-ledger.ts
- lesson-selection.ts
- maintenance/maintenance.ts
- AssignmentKnowledge.tsx
- constellation-runtime.ts
- validate_pr_body.cjs
- audit-plan-candidates.cjs
- office-client.ts
- ref_node_crypto
- ticket-evidence.ts
- cx
- spawn-command.ts
- session-context-file.ts
- QAResultsCard.tsx
- session-scope.ts
- service-health.ts
- project-bindings.ts
- closeout-recovery.ts
- incidents.ts
- agents.ts
- session-bridge.ts
- Coordinator
- offices.ts
- follow-production.ts
- viewer.js
- restart-stopped-writers.ts
- stopped-record.ts
- conversations/conversations.ts
- superseded-wiki-pr.ts
- ref_node_child_process
- provider-observation.ts
- command
- session-context-client.ts
- plans.cjs
- quota-governor.ts
- capture-session-clone.py
- change-scope.ts
- deploy.ts
- ticket-stage-runner.ts
- archive-plan.cjs
- call-scope.ts
- harness-action.ts
- .emit
- on-merge-sync.cjs
- backup-stores.ts
- extract-worker.mjs
- deploy-plan.ts
- holdReason
- work.ts
- pr-observation-graphql.ts
- handoff-admission.ts
- unsent-time.ts
- notifications.ts
- judge-resumes.ts
- slack-supersession.ts
- run-accounting.ts
- qa.ts
- qa-plan-continuation.ts
- writer-restart.ts
- restoreInPlace
- sanitize
- install-overseer.mjs
- daily-cto.ts
- deploy-command.ts
- refresh-issue-state.cjs
- office-lessons.ts
- .activeClaims
- resume-after-sign-in.ts
- it-specialist.ts
- launcher-state.mjs
- pre-push-boundary.ts
- delivery-recoveries.ts
- release-verification.mjs
- pr-observation-shape.ts
- artifact
- digest
- ref_node_path
- Effects
- goal-reviews.ts
- officeUrl
- assertDeliveryMayMutate
- checkpoint-retry.ts
- scheduler.ts
- production.ts
- reconcile-merges.cjs
- blocker-followups.ts
- post-conflict-preparation.ts
- engine.ts
- overseer/commands.ts
- brain-maintenance.ts
- common.cjs
- coordination.ts
- command-registry.ts
- projects.ts
- enrollment-gate.ts
- recorded-gh-command.ts
- pilot-delivery.ts
- observe-github-merges.ts
- diagnostic-snapshot.ts
- routing.js
- GitHubIssuePublisher
- bareSpans
- remove-candidate.ts
- MaintenanceRun
- telemetry/report.ts
- conversation-recovery.ts
- launch.mjs
- metadata-park-words.ts
- json-layers.ts
- DeploymentFence
- preferences-store.ts
- release-manifest.ts
- delivery-ownership.ts
- session-snapshot-cleanup.ts
- ForwardingState
- build-overseer-launcher.mjs
- bare-value.ts
- owner-step-items.ts
- history-archive.ts
- packed-consumer-pnpm.ts

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

## Communities (180 total, 8 thin omitted)

### Community 0 - "incidents/routes.ts"
Cohesion: 0.05
Nodes (79): citationFault(), CitationSchema, SourceVersions, sourceVersions(), dismiss(), DISMISSAL_CITATIONS, DISMISSAL_REASON, DismissalFacts (+71 more)

### Community 1 - "OrgChart.tsx"
Cohesion: 0.10
Nodes (41): label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+33 more)

### Community 2 - "worker-runtime.ts"
Cohesion: 0.06
Nodes (44): SlackResultSchema, SlackVerificationSchema, candidateWorkspaceEnvironment(), ApproachSchema, assignmentSubject(), dispatchExposure(), prepareExposure(), LessonSelection (+36 more)

### Community 3 - "authorize.ts"
Cohesion: 0.09
Nodes (44): approveFeature(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), artifactPath(), digest(), document() (+36 more)

### Community 4 - "InspectorContent.tsx"
Cohesion: 0.05
Nodes (118): Conversation(), ConversationDraft, SendMessage, groups, Outbox(), ctoInputFailure(), OutboxCTOInput(), OutboxMaintenanceStatus() (+110 more)

### Community 5 - "weekly-rollup.ts"
Cohesion: 0.14
Nodes (25): learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), harperFolder() (+17 more)

### Community 6 - "budget-ledger.ts"
Cohesion: 0.06
Nodes (61): abandonExpired(), Admission, admit(), admitDeployment(), balance(), bindEvidence(), count(), errcode() (+53 more)

### Community 7 - "index.tsx"
Cohesion: 0.08
Nodes (61): Activity(), ActivityTimeline(), BrainWorkspace(), KnowledgeMotion, KnowledgeReveal(), LessonsView(), Library(), MapBrowser() (+53 more)

### Community 8 - "OfficeSnapshot"
Cohesion: 0.09
Nodes (47): jiraQueueProgress(), nextStage(), deliveryRoles, JiraQueueProgress, TicketProgress, OfficeSnapshot, ROLE_NAMES, STAGE_LABELS (+39 more)

### Community 9 - "TelemetryPanel.tsx"
Cohesion: 0.11
Nodes (34): TelemetryReport, AzureBuild, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens(), usd() (+26 more)

### Community 10 - "features.ts"
Cohesion: 0.10
Nodes (32): commandFeature(), reviewQuestions(), confirmBrief(), FeaturePlanningBindings, assertQuestionVisibility(), normalizeRound(), pendingQuestions(), FeatureApproval (+24 more)

### Community 11 - "kill-switch.ts"
Cohesion: 0.22
Nodes (14): bounded(), ControlRead, Halt, Pause, pauseRunner(), readControl(), readControlCondition(), readHalt() (+6 more)

### Community 12 - "App.tsx"
Cohesion: 0.05
Nodes (72): createConversationDrafts(), BrainDrawer(), themeColor, App(), BrainWorkspace, CONNECTION, CONNECTION_DOT, dockItemVariants (+64 more)

### Community 13 - "admit-improvement.ts"
Cohesion: 0.21
Nodes (16): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+8 more)

### Community 14 - "request.ts"
Cohesion: 0.08
Nodes (67): refusal(), MISSING_NATIVE_LINK, observeAutomationConflict(), VERB, assertAutomationEffects(), automationMergePolicy(), observeAutomationMerge(), routeAutomationMerge() (+59 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.15
Nodes (46): dispatchNightly(), requestDelivery(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), CaptureRequest, captureRequest() (+38 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.08
Nodes (48): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, BlockingTrigger, blockingTrigger(), isBlocking() (+40 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.08
Nodes (47): deliveryMetrics(), median(), baselined(), baselineLearning(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences() (+39 more)

### Community 18 - "process-group.mjs"
Cohesion: 0.21
Nodes (27): dispatch(), reportedOutcome(), stopOrWait(), bounded(), MAX_PID, message(), validPgid(), launch() (+19 more)

### Community 19 - "maintenancePolicies"
Cohesion: 0.47
Nodes (4): maintenancePolicies(), easternDate(), weeklyDue(), supersedablePriorRuns()

### Community 20 - "activation-recovery.ts"
Cohesion: 0.08
Nodes (56): recordJobApproach(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal (+48 more)

### Community 21 - "overseer-launch.mjs"
Cohesion: 0.07
Nodes (80): acquireLauncherLock(), alone(), ancestry(), assertDirectoryOrAbsent(), attemptRecord(), bounded(), boundedString(), checkOwnedFile() (+72 more)

### Community 22 - "cec-reads.ts"
Cohesion: 0.09
Nodes (38): escaped(), IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), intakeMembership(), projectListScope(), cecIntakePrompt() (+30 more)

### Community 23 - "jira-time.ts"
Cohesion: 0.09
Nodes (38): unresolvedAttempts(), bindingOf(), connectWith(), data(), envelope(), finishVerifiedEffects(), JiraWorklogs, locks (+30 more)

### Community 24 - "dependencies.ts"
Cohesion: 0.14
Nodes (25): PrerequisiteSchema, attributedRecords(), foldsItsRun(), groupCandidates(), FailedMailCheck, lastFailedMailCheck(), lastMailCheckOutcome(), MailCheckOutcome (+17 more)

### Community 25 - "outbox.ts"
Cohesion: 0.13
Nodes (22): metadataParkAction(), ADOPTION_STALLED_MS, conversationResolved(), projectOutbox(), item(), syncOutbox(), sameOwnerSteps(), settledSlackReadback() (+14 more)

### Community 26 - "controller-runtime.ts"
Cohesion: 0.10
Nodes (17): [cmd,...rawArgs], projectData(), StoreDatabase, controllerEffects(), alive(), ControllerMachine, option(), realMachine() (+9 more)

### Community 27 - "goal-reporting.ts"
Cohesion: 0.14
Nodes (25): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+17 more)

### Community 28 - "harnessEffect"
Cohesion: 0.05
Nodes (135): BLOCK, harnessBlockMove(), harnessParkedCard(), noted(), effectKey(), LaneOperation, laneWrite(), moveCardOnce() (+127 more)

### Community 29 - "checkpoint-completion.ts"
Cohesion: 0.18
Nodes (12): BrainStatusSchema, identity, brainCheckpointCompletion(), coverageSchema, verified, PublishedPR, publishedWorkCleanedUp(), nativeChecks (+4 more)

### Community 30 - "workKey"
Cohesion: 0.07
Nodes (73): runHarnessStage(), harnessDelivers(), Binding, historyBeforeWrite(), matchesBoundDescription(), DescriptionEdit, DescriptionHistory, DescriptionHistoryUnavailable (+65 more)

### Community 31 - "route-head.ts"
Cohesion: 0.08
Nodes (50): writerRestartPending(), closeoutRequestResolved(), preparationRequestResolved(), assertStoppedBaseAudit(), AuditRow, AWS_KEY_ID, readStoppedBaseAuditCompletion(), StoppedBaseAuditReader (+42 more)

### Community 32 - "process.ts"
Cohesion: 0.11
Nodes (31): featureItemComplete(), reconcileFeatureCompletion(), discoveryPrompt(), planPrompt(), GitHubFeaturePublisher, helperTelemetry(), reserveReplacement(), classifyFeatureFailure() (+23 more)

### Community 33 - "owned-artifact.ts"
Cohesion: 0.12
Nodes (23): INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_SOURCE_PATHS, officeSource(), Condition, count, ForwardingSummary (+15 more)

### Community 34 - "rate-limit-samples.ts"
Cohesion: 0.11
Nodes (16): Runner, GitHubCalls, GraphqlAnswer, graphqlAnswer(), responseBody(), QuotaGovernor, QuotaRefusal, iso() (+8 more)

### Community 35 - "wiki-graph.cjs"
Cohesion: 0.18
Nodes (22): connections(), fs, main(), path, ensureInside(), hasSymlinkComponent(), slash(), splitFrontmatter() (+14 more)

### Community 36 - "scheduled-work.ts"
Cohesion: 0.09
Nodes (38): freshOwnershipRead(), scheduledOwnershipRead(), deliverySlot(), withAmendmentOwnership(), metadataRequestResolved(), gateFeatureWork(), scheduledInvestigations(), requestPriority() (+30 more)

### Community 37 - "routing.cjs"
Cohesion: 0.14
Nodes (29): closingIssues(), githubRefs(), normalizeGithubQuery(), normalizeRepository(), parseGithubQuery(), ref(), withoutFencedCode(), adjacency() (+21 more)

### Community 38 - "github-delivery.ts"
Cohesion: 0.04
Nodes (121): queueMergeNotice(), writerRestartInstruction(), removeAdoptedClone(), findingsBlock(), namedRepairIds(), BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE (+113 more)

### Community 39 - "knowledge.ts"
Cohesion: 0.09
Nodes (33): clip(), DEMAND_LIMIT, demandFacts(), DemandSection, key(), LessonKey, notes(), clip() (+25 more)

### Community 40 - "requests.ts"
Cohesion: 0.11
Nodes (17): observePrerequisites(), Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership (+9 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.16
Nodes (25): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence(), CaptureContext (+17 more)

### Community 42 - "assignments.ts"
Cohesion: 0.07
Nodes (43): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, CommittedBrain (+35 more)

### Community 43 - ".save"
Cohesion: 0.09
Nodes (59): enumerateIntakeList(), inPickupOrder(), Intake, text(), resolveBlockedTransition(), document(), transitionWithComment(), jiraAccount() (+51 more)

### Community 44 - "Offices"
Cohesion: 0.10
Nodes (11): QuestionNotifications, leadershipContext(), mirrorOfficeKnowledge(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), file, project (+3 more)

### Community 45 - "harness-baseline.ts"
Cohesion: 0.15
Nodes (22): BaselineReport, baselineReport(), BaselineSource, baselineText(), millions(), row(), share(), add() (+14 more)

### Community 46 - "credential-spans.ts"
Cohesion: 0.06
Nodes (39): AFTER_LABEL, BARE_CREDENTIAL, BARE_LABEL, BARE_UNIT, BARE_VALUE, CAMEL_START, CONTROL_ESCAPE, CREDENTIAL_NAME (+31 more)

### Community 47 - "deployed-fixes.ts"
Cohesion: 0.14
Nodes (26): inHistoryOf(), CompareMemory, compareMemory(), COMPARES_PER_PASS, comparison(), DeployedFixes, DeployedFixesInput, recordDeployedFixes() (+18 more)

### Community 48 - "Ticket"
Cohesion: 0.07
Nodes (38): carriedNotRepeated(), changeScopeNote(), Scoped, cecPrompt(), cecReconcilePrompt(), resolvedDecisionNote(), stageInstructions, stageInstructionsFor() (+30 more)

### Community 49 - "index.ts"
Cohesion: 0.06
Nodes (50): implementationPreview(), implementationContinuationRoute(), qaPlanRetryRoute(), close(), config, itSpecialist, loadedRevision, offices (+42 more)

### Community 50 - "FeatureWorkspace.tsx"
Cohesion: 0.11
Nodes (28): FeatureQuestionProjection, OutboxQuestionRound(), send(), FeatureDelivery(), FeatureDocuments(), views, FeatureReading(), FeatureWorkspace() (+20 more)

### Community 51 - "features/commands.ts"
Cohesion: 0.13
Nodes (15): createFeature(), featureById(), assertEnrollable(), Link, linkFeature(), FeaturePublisher, publishFeature(), reconcilePublication() (+7 more)

### Community 52 - "investigations/ledger.ts"
Cohesion: 0.16
Nodes (20): acceptedCompletionResolution(), investigationCandidates(), investigationId(), finishedSubjectResolution(), investigationFollowUps(), interruptedQARerunResolution(), investigationResolution(), syncInvestigations() (+12 more)

### Community 53 - "state-parts.ts"
Cohesion: 0.06
Nodes (40): comparableRow(), START_EVENT_KINDS, START_STATE_SHAPES, withoutStartValue(), withoutStartValues(), readSavedState(), LARGE_KEY_CHARS, plain() (+32 more)

### Community 54 - "jiraBinding"
Cohesion: 0.16
Nodes (11): Assignment, contentSchema(), JiraIssuePublisher, jiraText(), Transition, descriptionPreimage(), plain(), publicationDescription() (+3 more)

### Community 55 - "shared.ts"
Cohesion: 0.04
Nodes (69): OwnershipRead, continueOwnershipRead(), expiredOwnershipRead(), handoffOwnership(), ReadbackOwnerDecision, ownershipReadGate(), ownershipReadState(), ownershipReadSource() (+61 more)

### Community 56 - "runner-report.ts"
Cohesion: 0.12
Nodes (29): Digest, Evidence, failureDigest(), FailureReceipt, haltCondition(), HaltReport, LINE_LIMIT, RUNNER_PROJECT (+21 more)

### Community 57 - "pass.ts"
Cohesion: 0.08
Nodes (47): failureLine(), RunnerLimits, appendFailureLine(), JournalRefused, JournalView, readFailures(), syncPath(), journalDigest() (+39 more)

### Community 58 - "copy.ts"
Cohesion: 0.14
Nodes (21): GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles(), ContinuationIO (+13 more)

### Community 59 - "jira-attempts.ts"
Cohesion: 0.10
Nodes (29): attempted(), attemptState(), bound(), covers(), JiraAttempt, jiraAttempts(), JiraAttemptState, open() (+21 more)

### Community 60 - "cost-ledger.ts"
Cohesion: 0.17
Nodes (25): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress(), effectId() (+17 more)

### Community 61 - "lesson-selection.ts"
Cohesion: 0.14
Nodes (21): assignedToJoe(), fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), tryReadyLessonIssue(), Wait, INSTALLED, installedLesson() (+13 more)

### Community 62 - "maintenance/maintenance.ts"
Cohesion: 0.12
Nodes (21): accessibilitySources(), sourceFindings, sourceReview(), candidateOwner(), SETTLED, skipOwnedCandidate(), Skipped, skippedCandidateLedger() (+13 more)

### Community 63 - "AssignmentKnowledge.tsx"
Cohesion: 0.10
Nodes (27): ChatMarkdown(), ChatMarkdown, MessageText(), AssignmentKnowledge(), Lookup(), DocumentMetadata, documentText(), KnowledgeDocumentText (+19 more)

### Community 64 - "constellation-runtime.ts"
Cohesion: 0.05
Nodes (57): KnowledgeActivity, KnowledgeActivityPage, KnowledgeEdge, KnowledgeMap, KnowledgeNode, ATMOSPHERE, mapAtmosphere(), Particle (+49 more)

### Community 65 - "validate_pr_body.cjs"
Cohesion: 0.36
Nodes (8): fs, main(), readableText(), REQUIRED_CHECKS, REQUIRED_SECTIONS, sections(), validatePullRequestBody(), withoutComments()

### Community 66 - "audit-plan-candidates.cjs"
Cohesion: 0.14
Nodes (31): audit(), branchIssueNumbers(), classify(), distinctiveTitleWords(), { execFileSync }, extractPaths(), findPrForMergeSubject(), fmtCommit() (+23 more)

### Community 67 - "office-client.ts"
Cohesion: 0.09
Nodes (29): FailureAnswer, FailureEvent, HaltAnswer, RUNNER_DEFAULTS, officeDataRoot, realMachine(), bodyWithin(), bounded() (+21 more)

### Community 68 - "ref_node_crypto"
Cohesion: 0.11
Nodes (65): DeliveryAuthorityInput, canonical(), CheckpointEligibility, checkpointEligibility(), admitAssignmentResume(), forAssignment(), admitCheckpointResume(), forCheckpoint() (+57 more)

### Community 69 - "ticket-evidence.ts"
Cohesion: 0.10
Nodes (34): jiraRecord(), Connection, twgConnection(), twgProfile(), assetDownloader(), attachmentKind(), evidenceDirectory(), storeEvidence() (+26 more)

### Community 70 - "cx"
Cohesion: 0.08
Nodes (60): displayAgentTask(), githubStageLabels, withoutElapsed(), CameraBookmark, restoreBookmark(), LiveAgentTask(), Props, RunningTask() (+52 more)

### Community 71 - "spawn-command.ts"
Cohesion: 0.16
Nodes (20): inactivityWatch(), At, Errno, errno(), GroupInventory, GroupProbe, Phase, Pid (+12 more)

### Community 72 - "session-context-file.ts"
Cohesion: 0.20
Nodes (14): ContextFoldPrefix, contextFoldPrefix(), SessionContextCheckpoint, captureSessionContextClone(), ContextReadPhase, SessionContextDeadline, sessionContextFile(), ContextReadChanged (+6 more)

### Community 73 - "QAResultsCard.tsx"
Cohesion: 0.23
Nodes (11): itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps(), qaResultChanges(), QA_STAGES, qaResults(), qaStatus() (+3 more)

### Community 74 - "session-scope.ts"
Cohesion: 0.18
Nodes (17): Bound, claudeScopeParser(), claudeSessionScope(), CLAUDE_TRANSCRIPTS, CODEX_ROLLOUTS, contextReaders(), retainSessionMessage(), SessionConversation (+9 more)

### Community 75 - "service-health.ts"
Cohesion: 0.11
Nodes (24): ClaudeLoginRefusal, claudeLoginRefusal(), claudeRefusalWords(), RECORDED_REFUSALS, refusedClaudeRow(), providers, ProviderStatusChecks, summary (+16 more)

### Community 76 - "project-bindings.ts"
Cohesion: 0.08
Nodes (38): AzureMonitor, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs(), fullActivePRs(), observation() (+30 more)

### Community 77 - "closeout-recovery.ts"
Cohesion: 0.10
Nodes (47): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+39 more)

### Community 78 - "incidents.ts"
Cohesion: 0.08
Nodes (47): ObservedIncident, ObservedSubject, eventId(), incidentId(), details(), planSync(), Provenance, retainedSubjectKeys() (+39 more)

### Community 79 - "agents.ts"
Cohesion: 0.06
Nodes (46): implementationWorkerContext(), RefusedQAResult, CECReadbackSchema, READBACK_OWNER_SCOPE, savedStageCompletion(), assertContinuableWorktree(), CONTINUABLE, continuationPrompt() (+38 more)

### Community 80 - "session-bridge.ts"
Cohesion: 0.10
Nodes (30): claudeSessionContext(), codexDaemonProcesses(), accountCodexProcesses(), CodexProcessInventory, codexProcessInventory(), DesktopSessions, unaccountedProcesses(), codexSessionContext() (+22 more)

### Community 81 - "Coordinator"
Cohesion: 0.08
Nodes (4): withGitHubSource(), coordination(), Coordinator, executeRequest()

### Community 82 - "offices.ts"
Cohesion: 0.07
Nodes (33): servedOutbox(), incidentNotices(), isNotice(), NOTICE_KINDS, readNotices(), STATUS, RUNNER_INCIDENT, RUNNER_SUBJECT (+25 more)

### Community 83 - "follow-production.ts"
Cohesion: 0.20
Nodes (17): awaitingJiraStatus(), awaitingProduction(), FOLLOW_DAYS, followed(), isFollowed(), Azure, AzureRead, containedIn() (+9 more)

### Community 84 - "viewer.js"
Cohesion: 0.19
Nodes (25): addMetaLink(), addMetaRow(), addRelationship(), applyView(), buildIndexes(), buildLegend(), buildModel(), buildRenderer() (+17 more)

### Community 85 - "restart-stopped-writers.ts"
Cohesion: 0.30
Nodes (10): restartStoppedWriters(), unchangedSinceAccepted(), releaseFunds(), writerRestartCandidate(), Execute, keptWork(), Read, refObject() (+2 more)

### Community 86 - "stopped-record.ts"
Cohesion: 0.08
Nodes (55): capabilityBlockedReviews(), latestReviews(), boundedEvidence(), expectedWait(), StopFacts, digest(), fingerprint(), normalizeCause() (+47 more)

### Community 87 - "conversations/conversations.ts"
Cohesion: 0.09
Nodes (20): ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff(), saveGoals() (+12 more)

### Community 88 - "superseded-wiki-pr.ts"
Cohesion: 0.08
Nodes (70): commentId(), CommentIntent, CommentReceipt, conversation(), exact(), findProofComment(), matchesProofComment(), postProofComment() (+62 more)

### Community 89 - "ref_node_child_process"
Cohesion: 0.10
Nodes (23): changedPaths(), { execFileSync }, files, isMapInput(), mapOnly(), { execFileSync }, git(), publish() (+15 more)

### Community 90 - "provider-observation.ts"
Cohesion: 0.13
Nodes (26): az(), correlatedBuild(), Azure, azurePipelines(), outcome(), Read, RUNS_PER_PIPELINE, Api (+18 more)

### Community 91 - "command"
Cohesion: 0.09
Nodes (27): CommentPage, commentReadback(), devUpdate(), HEADLINE, JiraOperations, unpack(), postDevUpdate(), statusHeld() (+19 more)

### Community 92 - "session-context-client.ts"
Cohesion: 0.13
Nodes (18): readTranscript, readRollout, packContextFailure(), PackedContextFailure, unpackContextFailure(), LiveSession, ContextThread, contextThread() (+10 more)

### Community 93 - "plans.cjs"
Cohesion: 0.19
Nodes (19): remoteSlug(), walk(), association(), auditedDigests(), candidate(), collapseByTitle(), discover(), fromMarkdown() (+11 more)

### Community 94 - "quota-governor.ts"
Cohesion: 0.14
Nodes (20): withGitHubOperation(), GitHubMonitor, Api, terminalPRs(), backgroundHold(), CORE_RESERVE, GRAPHQL_WORK, PROBE_INTERVAL_MS (+12 more)

### Community 96 - "change-scope.ts"
Cohesion: 0.09
Nodes (38): applyChangeScope(), levels(), MAX_CHECKS, owedUnderScope(), scopeBase(), settled(), statedApproach(), verifiedCandidate() (+30 more)

### Community 97 - "deploy.ts"
Cohesion: 0.10
Nodes (47): ControllerEffects, DEPLOY_PROJECT, abandon(), advance(), DeployContext, DeployTimings, Commit, DEPLOY_STEPS (+39 more)

### Community 98 - "ticket-stage-runner.ts"
Cohesion: 0.08
Nodes (55): confirmsMovedHead(), Moved, movedHeadUnconfirmed(), recordConfirmedHead(), routeConfirmedHead(), applyIntakeObservation(), movedHeadNote(), gateRefusedPass() (+47 more)

### Community 99 - "archive-plan.cjs"
Cohesion: 0.12
Nodes (33): fs, main(), parse(), path, archive(), cell(), ensureIndex(), fromArgs() (+25 more)

### Community 100 - "call-scope.ts"
Cohesion: 0.09
Nodes (39): add(), addSource(), busiest(), CallLedger, Entry, sourceRows(), Sources, CallCounts (+31 more)

### Community 101 - "harness-action.ts"
Cohesion: 0.16
Nodes (20): saveCaptureRequest(), readEvidence(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS, requestReplan(), stageBudget(), applyHarnessAction() (+12 more)

### Community 102 - ".emit"
Cohesion: 0.14
Nodes (23): assertOwnership(), decideImplementation(), ImplementationDecision, interruptedImplementation(), Decision, requestQAPlanRetry(), configureChannelNotices(), configureNotices() (+15 more)

### Community 103 - "on-merge-sync.cjs"
Cohesion: 0.14
Nodes (27): fs, main(), path, { spawnSync }, fieldSpan(), frontmatterProblems(), keyPattern(), list() (+19 more)

### Community 104 - "backup-stores.ts"
Cohesion: 0.13
Nodes (28): absentAdmission(), AdmissionComparison, AdmissionSnapshot, compareAdmissions(), snapshotAdmissions(), BackupEntry, BackupInput, BackupInventory (+20 more)

### Community 105 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 106 - "deploy-plan.ts"
Cohesion: 0.18
Nodes (23): Body, DeploymentFenceState, fenceTokenDigest(), operationPaths(), planDeployment(), createDeployToken(), readDeployToken(), removeDeployToken() (+15 more)

### Community 107 - "holdReason"
Cohesion: 0.04
Nodes (106): maintenanceCandidate(), removeCandidate(), retryCandidateCleanup(), metadataCarriedAdvisoryIds(), ownedBefore(), QA_STAGES, reviewAdvisoryIds(), Reviewed (+98 more)

### Community 108 - "work.ts"
Cohesion: 0.06
Nodes (51): Admission, FLAGS, incidentCommand(), IncidentCommandIO, option(), USAGE, whole(), boundaryCrossed() (+43 more)

### Community 109 - "pr-observation-graphql.ts"
Cohesion: 0.13
Nodes (29): ChildRequest, headCheckRuns(), includeBody(), readOpenPRs(), commitOf(), ConnectionPages, embeddedHead(), fail() (+21 more)

### Community 110 - "handoff-admission.ts"
Cohesion: 0.13
Nodes (29): actionKey(), bindings(), bound(), CATEGORIZED, claimed(), Entry, episodeAt(), executing() (+21 more)

### Community 111 - "unsent-time.ts"
Cohesion: 0.19
Nodes (13): publishableEntry(), settlementPending(), superseded(), ticketUnresolved(), TimeLedger, clearUnsent(), dueUnsent(), markUnsent() (+5 more)

### Community 112 - "notifications.ts"
Cohesion: 0.10
Nodes (23): channelNoticeAuthorized(), ChannelSettings, notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR, plainSlackText() (+15 more)

### Community 113 - "judge-resumes.ts"
Cohesion: 0.08
Nodes (32): absent(), IncidentChange, IncidentLedger, isOpen(), Recorded, judgeResumes(), JudgeResumesInput, Open (+24 more)

### Community 114 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 115 - "run-accounting.ts"
Cohesion: 0.05
Nodes (65): BoundedRead, comparable(), EvidenceOutcome, recordRunEvidence(), backfillClaudeCost(), CompletionReader, add(), CodexRequest (+57 more)

### Community 119 - "restoreInPlace"
Cohesion: 0.60
Nodes (5): identity(), Json, plain(), restorable(), restoreInPlace()

### Community 120 - "sanitize"
Cohesion: 0.11
Nodes (32): assertConversationReadback(), currentOutbox(), finishSupersededReadback(), projectSlackDeliveries(), dueSlackReread(), rereadUncertainSlack(), runningRevision(), settleRequestedSlackReplacement() (+24 more)

### Community 121 - "install-overseer.mjs"
Cohesion: 0.22
Nodes (19): CHECKOUT, DEFAULT_DEADLINE_MS, existingPlist(), installOverseer(), LABEL, LAUNCHER_SOURCE, renderPlist(), SCRIPT (+11 more)

### Community 122 - "daily-cto.ts"
Cohesion: 0.08
Nodes (24): DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), dailyReviewDate(), reviewWeekday(), Briefing, saveReviewBriefing() (+16 more)

### Community 123 - "deploy-command.ts"
Cohesion: 0.09
Nodes (46): CONTROLLER_ENTRY, ControllerPin, Pin, pinnedController(), readControllerPin(), writeControllerPin(), controllerOf(), deployCommand() (+38 more)

### Community 124 - "refresh-issue-state.cjs"
Cohesion: 0.23
Nodes (12): advanceFence(), key(), { execFileSync }, fs, issueRefs(), main(), markClosed(), openThreadLineIndexes() (+4 more)

### Community 125 - "office-lessons.ts"
Cohesion: 0.06
Nodes (34): normalizeStatement(), LessonBrainAudit, LessonBrainOverlap, decideOfficeProposal(), OfficeKnowledgeStore, proposeOfficeLessons(), retireOfficeLesson(), Input (+26 more)

### Community 126 - ".activeClaims"
Cohesion: 0.08
Nodes (36): ATTEMPT_DELAYS_MS, nextAttemptAt(), NOT_RETRYABLE, StoppedWriter, stoppedWriter(), WRITER_STAGES, WriterRestartCandidate, writerRestarted() (+28 more)

### Community 127 - "resume-after-sign-in.ts"
Cohesion: 0.18
Nodes (16): hasPendingDelivery(), resumeAfterSignIn(), signInWait(), BrowserPage, browserPages(), ReadPages, SignInState, signInState() (+8 more)

### Community 128 - "it-specialist.ts"
Cohesion: 0.19
Nodes (13): heldFor(), ITContext, recoveryWait(), informationalRecovery(), ITSpecialist, ownAzureCheck(), delays, recoverAttempt() (+5 more)

### Community 129 - "launcher-state.mjs"
Cohesion: 0.26
Nodes (19): RFC-9562, boundedString(), exactKeys(), isCount(), isIso(), isRfcUuid(), isUuid(), readOwner() (+11 more)

### Community 130 - "pre-push-boundary.ts"
Cohesion: 0.27
Nodes (10): Event, exactCommand(), Invocation, localHookCommand(), one(), prePushRejection(), PushIdentity, retirementBoundary() (+2 more)

### Community 131 - "delivery-recoveries.ts"
Cohesion: 0.19
Nodes (20): savedActivationFailure(), candidateInput(), children, oldAdoptionBasis(), savedAdmissionUnresolved(), SavedCandidateAdmission, savedCandidateAdmission(), completedConflictDraftUnresolved() (+12 more)

### Community 132 - "release-verification.mjs"
Cohesion: 0.24
Nodes (17): isDigest(), isSha(), digestOf(), entryOf(), PASS_ENTRY, releaseRevision(), validManifest(), validPin() (+9 more)

### Community 133 - "pr-observation-shape.ts"
Cohesion: 0.21
Nodes (19): githubPRDescription(), closingDirectives(), ObservedPR, enumValue(), fail(), graphqlPR(), mapped(), member() (+11 more)

### Community 134 - "artifact"
Cohesion: 0.08
Nodes (67): containedFile(), acceptStageResult(), acceptConflictRepair(), deliveryNextStage(), pendingPreparationCheck(), acceptMetadataReview(), mergeAuthorized(), completedPreparation() (+59 more)

### Community 135 - "digest"
Cohesion: 0.16
Nodes (19): ownershipReadHistory(), createdContentSha256(), adoptCandidate(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext() (+11 more)

### Community 136 - "ref_node_path"
Cohesion: 0.06
Nodes (53): file, folder, logs, root, ctoInputIdentityMatches(), ctoInputRecovered(), recoverCTOInput(), verifiedCloseoutCleanupRequest() (+45 more)

### Community 137 - "Effects"
Cohesion: 0.11
Nodes (31): settleNotLanded(), officeMergeProvenance(), reconcileMergeScannerRetry(), Retry, retryMergeScanner(), retryReadBack(), runIdentity(), savedRetry() (+23 more)

### Community 138 - "goal-reviews.ts"
Cohesion: 0.17
Nodes (17): currentCitations(), Fact, NOT_CURRENT, PROVIDER_ERROR, applyGoalReview(), DailyResultSchema, DeliveryJob, EvidenceRefSchema (+9 more)

### Community 139 - "officeUrl"
Cohesion: 0.07
Nodes (43): knowledgeOutbox(), LessonDecisionAction, lessonDecisionState(), readLessonDecision(), DAYS, dueLessonDecisions(), easternWeek(), isLessonDecision() (+35 more)

### Community 140 - "assertDeliveryMayMutate"
Cohesion: 0.06
Nodes (48): ProjectProgress, recordCandidateCleanup(), candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf() (+40 more)

### Community 141 - "checkpoint-retry.ts"
Cohesion: 0.52
Nodes (6): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation()

### Community 142 - "scheduler.ts"
Cohesion: 0.10
Nodes (20): Clock, PROJECT_LOCAL, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch() (+12 more)

### Community 144 - "reconcile-merges.cjs"
Cohesion: 0.22
Nodes (14): collectPulls(), copyWikiForDryRun(), { execFileSync }, flattenPages(), fs, githubRequest(), isWikiBotPull(), main() (+6 more)

### Community 145 - "blocker-followups.ts"
Cohesion: 0.21
Nodes (17): followupRecord(), handoff(), heldForRepair(), reconcileBlockerFollowups(), bindHandoff(), HandoffEvidence, settleHandoffs(), SOURCE_MISSING (+9 more)

### Community 146 - "post-conflict-preparation.ts"
Cohesion: 0.08
Nodes (53): assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), reconcileCompletedConflictDraft(), routeReadyPostConflictPublication(), verifyInitialDraftConflictPreparation() (+45 more)

### Community 147 - "engine.ts"
Cohesion: 0.08
Nodes (12): checkMail(), drainMail(), requestMail(), enableNightly(), ingest(), noQuotaHold, ResumeProject, drainMaintenance() (+4 more)

### Community 148 - "overseer/commands.ts"
Cohesion: 0.09
Nodes (47): guardPresent(), overseerCommand(), reconcileArgs(), resolveCliRoot(), runnerStatus(), DEFAULT_OFFICE_URL, LOOPBACK, officeUrl() (+39 more)

### Community 149 - "brain-maintenance.ts"
Cohesion: 0.22
Nodes (11): BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, brainResultStop(), GateMark, gateMark(), neverStarted(), unstartedCandidate() (+3 more)

### Community 150 - "common.cjs"
Cohesion: 0.11
Nodes (24): fs, main(), parse(), path, atomicWrite(), crypto, { execFileSync }, fs (+16 more)

### Community 151 - "coordination.ts"
Cohesion: 0.10
Nodes (26): dependencyCompletionKey(), deliverySource(), BrainFollowup, MAX_START_RETRIES, START_RETRY_MS, checkpointOutcome(), Outcome, reconcileContinuations() (+18 more)

### Community 152 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 153 - "projects.ts"
Cohesion: 0.07
Nodes (56): AUTO_ADOPT_BOTS, IntakeView, assertFeaturePlanningConfig(), goalEvidencePath(), azureSchema, deploymentSchema, jiraSchema, ownJiraSchema (+48 more)

### Community 154 - "enrollment-gate.ts"
Cohesion: 0.25
Nodes (19): eligibility(), admit(), compatible(), dependencyEligibility(), issueKey(), validatePrerequisites(), prerequisitesMet(), currentApproval() (+11 more)

### Community 155 - "recorded-gh-command.ts"
Cohesion: 0.19
Nodes (20): assignments(), changeDirectory(), closing(), CREATE, createGuard(), flags(), named(), read() (+12 more)

### Community 156 - "pilot-delivery.ts"
Cohesion: 0.10
Nodes (31): candidateBranchMoved(), endChangeScope(), scopeOutgrown(), draftHeadMovedForward(), git(), movedHeadEvent(), recordMovedHead(), continueImplementation() (+23 more)

### Community 157 - "observe-github-merges.ts"
Cohesion: 0.30
Nodes (14): clearCooldown(), coolDown(), coolingDown(), MERGE_NOTICE_RECHECK_MS, waitKey(), waits, isMergeCommit(), issueOf() (+6 more)

### Community 158 - "diagnostic-snapshot.ts"
Cohesion: 0.23
Nodes (12): itChatPrompt(), assignmentDiagnostics(), diagnosticContext(), diagnosticSnapshot(), followUpPicture(), publishITReport(), nativeDeliveryResolved(), itAgent() (+4 more)

### Community 160 - "GitHubIssuePublisher"
Cohesion: 0.31
Nodes (4): PublicationReceipt, GitHubIssuePublisher, number(), same()

### Community 161 - "bareSpans"
Cohesion: 0.19
Nodes (15): apostropheEnd(), bareSpans(), credentialSpans(), genuineGap(), headerValueEnd(), isQueryLabel(), labelBefore(), nameEnd() (+7 more)

### Community 162 - "remove-candidate.ts"
Cohesion: 0.12
Nodes (24): initialManualStart(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+16 more)

### Community 163 - "MaintenanceRun"
Cohesion: 0.25
Nodes (12): checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), repeatedVendorReviewBlock(), stoppedInVendorReview(), leftToNextRun(), NEXT_RUN_DUE_MS, night() (+4 more)

### Community 164 - "telemetry/report.ts"
Cohesion: 0.22
Nodes (15): CostEntry, TelemetryRow, TelemetrySync, Acc, bump(), EASTERN, easternDay(), modelShares() (+7 more)

### Community 165 - "conversation-recovery.ts"
Cohesion: 0.51
Nodes (9): conversationReadbackReady(), followupOf(), pendingReadback(), queueConversationReadback(), readbackEnding(), replacedReadback(), uncertainConversations(), readBackConversations() (+1 more)

### Community 166 - "launch.mjs"
Cohesion: 0.25
Nodes (11): LOOPBACK, officeOrigin(), passDeadline(), isObject(), alone(), helperMain(), send(), tail() (+3 more)

### Community 167 - "metadata-park-words.ts"
Cohesion: 0.20
Nodes (16): parksInJira(), OUTCOME, qaComment(), remote(), STAGE, plainWords(), tidy(), field() (+8 more)

### Community 168 - "json-layers.ts"
Cohesion: 0.26
Nodes (9): decode(), decodedIndex(), evenRunBefore(), JsonLayers, LayerString, opensValue(), SIMPLE, strings() (+1 more)

### Community 169 - "DeploymentFence"
Cohesion: 0.33
Nodes (4): assertToken(), DeploymentFence, DeploymentFenceGateContext, DeploymentFenceRouteContext

### Community 170 - "preferences-store.ts"
Cohesion: 0.19
Nodes (9): PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS, OfficePreferences (+1 more)

### Community 171 - "release-manifest.ts"
Cohesion: 0.10
Nodes (35): runningRevision(), runningRevision(), releaseIdentity(), runtimeRevision(), ActiveRelease, readActiveRelease(), BUILD_ENV, buildRelease() (+27 more)

### Community 172 - "delivery-ownership.ts"
Cohesion: 0.33
Nodes (4): Ownership, ownershipContext, refreshDeliveryOwnership(), RefreshOwnership

### Community 173 - "session-snapshot-cleanup.ts"
Cohesion: 0.40
Nodes (5): SNAPSHOT_PREFIX, removeStaleSessionSnapshots(), SNAPSHOT_SWEEP_MS, STALE_SNAPSHOT_MS, sweepStaleSessionSnapshots()

### Community 175 - "build-overseer-launcher.mjs"
Cohesion: 0.20
Nodes (8): BANNER, builtin(), bundleLauncher(), LAUNCHER_BUNDLE, LAUNCHER_ENTRY, launcherChunk(), REPOSITORY, SCRIPT

### Community 176 - "bare-value.ts"
Cohesion: 0.30
Nodes (11): BareValue, bareValue(), deeperValueEnd(), ENDS, isSeparator(), plainEscape(), queryValue(), separatorEscapeAt() (+3 more)

### Community 177 - "owner-step-items.ts"
Cohesion: 0.27
Nodes (8): OwnerStepItem, ownerStepItems(), signIn(), commands(), SIGN_IN_SERVICE_TROUBLE, signInSteps(), Step, OwnerSteps

### Community 178 - "history-archive.ts"
Cohesion: 0.35
Nodes (8): archiveOldReports(), RETAINED_REPORTS, archiveByMonth(), archiveHistory(), archiveMonth(), archiveOldTaskDetail(), TASK_DETAIL_DAYS, ITReport

## Knowledge Gaps
- **1 isolated node(s):** `RFC-9562`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 1214 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `shared.ts` to `incidents/routes.ts`, `worker-runtime.ts`, `authorize.ts`, `weekly-rollup.ts`, `OfficeSnapshot`, `features.ts`, `admit-improvement.ts`, `request.ts`, `scheduled-captures.ts`, `run-retrospective.ts`, `record-trigger.ts`, `activation-recovery.ts`, `cec-reads.ts`, `jira-time.ts`, `dependencies.ts`, `outbox.ts`, `controller-runtime.ts`, `goal-reporting.ts`, `harnessEffect`, `checkpoint-completion.ts`, `workKey`, `route-head.ts`, `process.ts`, `scheduled-work.ts`, `github-delivery.ts`, `knowledge.ts`, `requests.ts`, `time-scope.ts`, `assignments.ts`, `.save`, `Offices`, `Ticket`, `index.ts`, `features/commands.ts`, `investigations/ledger.ts`, `state-parts.ts`, `jiraBinding`, `copy.ts`, `jira-attempts.ts`, `cost-ledger.ts`, `lesson-selection.ts`, `maintenance/maintenance.ts`, `ref_node_crypto`, `ticket-evidence.ts`, `project-bindings.ts`, `closeout-recovery.ts`, `agents.ts`, `session-bridge.ts`, `Coordinator`, `offices.ts`, `follow-production.ts`, `conversations/conversations.ts`, `superseded-wiki-pr.ts`, `provider-observation.ts`, `command`, `quota-governor.ts`, `change-scope.ts`, `deploy.ts`, `ticket-stage-runner.ts`, `harness-action.ts`, `.emit`, `holdReason`, `pr-observation-graphql.ts`, `unsent-time.ts`, `notifications.ts`, `judge-resumes.ts`, `run-accounting.ts`, `sanitize`, `daily-cto.ts`, `office-lessons.ts`, `.activeClaims`, `resume-after-sign-in.ts`, `it-specialist.ts`, `delivery-recoveries.ts`, `artifact`, `digest`, `ref_node_path`, `Effects`, `goal-reviews.ts`, `assertDeliveryMayMutate`, `scheduler.ts`, `blocker-followups.ts`, `post-conflict-preparation.ts`, `engine.ts`, `brain-maintenance.ts`, `coordination.ts`, `enrollment-gate.ts`, `pilot-delivery.ts`, `observe-github-merges.ts`, `diagnostic-snapshot.ts`, `remove-candidate.ts`, `conversation-recovery.ts`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **What connects `RFC-9562` to the rest of the system?**
  _1 weakly-connected nodes found - possible missing edges._
- **Should `incidents/routes.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.04712880347746511 - nodes in this community are weakly interconnected._
- **Why does `command()` connect `command` to `incidents/routes.ts`, `worker-runtime.ts`, `authorize.ts`, `weekly-rollup.ts`, `Effects`, `assertDeliveryMayMutate`, `admit-improvement.ts`, `engine.ts`, `activation-recovery.ts`, `brain-maintenance.ts`, `coordination.ts`, `dependencies.ts`, `jira-time.ts`, `controller-runtime.ts`, `command-registry.ts`, `harnessEffect`, `pilot-delivery.ts`, `workKey`, `checkpoint-completion.ts`, `process.ts`, `remove-candidate.ts`, `github-delivery.ts`, `requests.ts`, `assignments.ts`, `.save`, `release-manifest.ts`, `deployed-fixes.ts`, `Ticket`, `features/commands.ts`, `jiraBinding`, `shared.ts`, `copy.ts`, `jira-attempts.ts`, `cost-ledger.ts`, `lesson-selection.ts`, `maintenance/maintenance.ts`, `ticket-evidence.ts`, `service-health.ts`, `project-bindings.ts`, `closeout-recovery.ts`, `agents.ts`, `session-bridge.ts`, `Coordinator`, `offices.ts`, `restart-stopped-writers.ts`, `provider-observation.ts`, `quota-governor.ts`, `change-scope.ts`, `deploy.ts`, `ticket-stage-runner.ts`, `call-scope.ts`, `deploy-plan.ts`, `holdReason`, `unsent-time.ts`, `notifications.ts`, `deploy-command.ts`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Should `OrgChart.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10122448979591837 - nodes in this community are weakly interconnected._
- **Why does `sceneColors()` connect `cx` to `constellation-runtime.ts`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Should `worker-runtime.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05706760316066725 - nodes in this community are weakly interconnected._