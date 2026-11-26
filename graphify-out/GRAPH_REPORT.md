# Graph Report - the-office  (2026-11-26)

## Corpus Check
- 1362 files · ~616,476 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 7635 nodes · 32491 edges · 178 communities (169 shown, 9 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 1096 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `32e21c82`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- IncidentLedger
- OrgChart.tsx
- worker-runtime.ts
- features/workflow.ts
- InspectorContent.tsx
- github-delivery.ts
- budget-ledger.ts
- index.tsx
- incidents/routes.ts
- TelemetryPanel.tsx
- ref_node_crypto
- overseer/commands.ts
- App.tsx
- learningDigest
- request.ts
- scheduled-captures.ts
- run-retrospective.ts
- record-trigger.ts
- route-activation.ts
- worker-sandbox-run.ts
- activation-recovery.ts
- overseer-launch.mjs
- setup-stop-cap.ts
- jira-time.ts
- effects.ts
- github.ts
- controller-runtime.ts
- fact-bounds.ts
- assertDeliveryMayMutate
- work-summary.ts
- digest
- .activeClaims
- .transaction
- run.ts
- identity-runtime.ts
- common.cjs
- scheduled-work.ts
- routing.cjs
- validate-stage.ts
- task-briefing.ts
- knowledge.ts
- time-scope.ts
- assignments.ts
- .save
- Offices
- harness-baseline.ts
- credential-spans.ts
- delivery-repairs.ts
- deploy.ts
- index.ts
- QuestionStepper.tsx
- Ticket
- investigations/ledger.ts
- ref_node_sqlite
- JiraIssuePublisher
- app-config.ts
- halt-report.ts
- pass.ts
- sandbox-qualification.ts
- intent.ts
- cost-ledger.ts
- demand-facts.ts
- maintenance/maintenance.ts
- PanelHeader
- constellation-runtime.ts
- validate_pr_body.cjs
- audit-plan-candidates.cjs
- office-client.ts
- work.ts
- alert-issue.ts
- cx
- spawn-command.ts
- session-context-file.ts
- local-config.ts
- session-scope.ts
- service-health.ts
- azure.ts
- closeout-recovery.ts
- incidents.ts
- agents.ts
- session-bridge.ts
- Coordinator
- metadata-park-words.ts
- remove-candidate.ts
- viewer.js
- api-routes.ts
- stopped-record.ts
- conversations/conversations.ts
- superseded-wiki-pr.ts
- ref_node_child_process
- sanitize
- OfficeProject
- session-context-client.ts
- plans.cjs
- .emit
- capture-session-clone.py
- continue-ownership-read.ts
- pr-observation-shape.ts
- pilot-delivery.ts
- archive-plan.cjs
- call-scope.ts
- jira-attempts.ts
- ref_node_path
- on-merge-sync.cjs
- backup-stores.ts
- extract-worker.mjs
- ref_zod
- harnessEffect
- judge-resumes.ts
- pr-observation-graphql.ts
- blocker-followups.ts
- unsent-time.ts
- interrupted-work-recovery.ts
- Goals.tsx
- slack-supersession.ts
- run-accounting.ts
- qa.ts
- qa-plan-continuation.ts
- writer-restart.ts
- store.ts
- deploy-plan.ts
- .getEffect
- ControlStore
- deploy-command.ts
- refresh-issue-state.cjs
- notifications.ts
- accept-stage-result.ts
- sign-in-unpark.ts
- it-specialist.ts
- retrospective-subject.ts
- pre-push-boundary.ts
- shared.ts
- http/commands.ts
- InFlightOperations
- weekly-rollup.ts
- observe-projects.ts
- office/readiness.ts
- checkpoint-completion.ts
- goal-reviews.ts
- OfficeSnapshot
- GitHubDelivery
- daily-cto.ts
- scheduler.ts
- production.ts
- reconcile-merges.cjs
- timed-statements.ts
- holdReason
- Store
- runner-root.ts
- resume-control.ts
- serve-graph.cjs
- coordination.ts
- runner-routes.ts
- projects.ts
- DeploymentFence
- recorded-gh-command.ts
- cec.ts
- observe-github-merges.ts
- http/context.ts
- routing.js
- write-credential-scope.ts
- security.ts
- workKey
- closeout.ts
- telemetry/report.ts
- effect.ts
- launch.mjs
- CommittedBrain
- incident-command.ts
- preferences-store.ts
- release-manifest.ts
- validate_wiki_pr_body.cjs
- build-overseer-launcher.mjs
- parked-card-refusal.ts
- evidence-artifacts.ts
- write-boundary.ts
- session-snapshot-cleanup.ts
- inspect-closed-plan.ts

## God Nodes (most connected - your core abstractions)
1. `Store` - 478 edges
2. `TicketJob` - 233 edges
3. `digest()` - 175 edges
4. `command()` - 158 edges
5. `GitHubDelivery` - 143 edges
6. `holdReason()` - 143 edges
7. `OfficeSnapshot` - 123 edges
8. `artifact()` - 116 edges
9. `workKey()` - 110 edges
10. `StageResult` - 110 edges

## Surprising Connections (you probably didn't know these)
- `BreakdownTable()` --indirect_call--> `cell()`  [INFERRED]
  src/telemetry/BreakdownTable.tsx → scripts/wiki/archive-plan.cjs
- `apply()` --indirect_call--> `note()`  [INFERRED]
  src/conversations/OutboxSavedImplementation.tsx → server/cec/parking/resume-parked.ts
- `UnrecordedResult` --references--> `StageResult`  [EXTRACTED]
  server/cec/unrecorded-result.ts → src/shared.ts
- `CurrentMark()` --indirect_call--> `marker()`  [INFERRED]
  src/work/timeline/TicketTimeline.tsx → server/delivery/closeout/superseded-wiki-pr.ts
- `TicketTimeline()` --indirect_call--> `marker()`  [INFERRED]
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

## Communities (178 total, 9 thin omitted)

### Community 0 - "IncidentLedger"
Cohesion: 0.07
Nodes (53): inHistoryOf(), CompareMemory, compareMemory(), COMPARES_PER_PASS, comparison(), DeployedFixes, DeployedFixesInput, recordDeployedFixes() (+45 more)

### Community 1 - "OrgChart.tsx"
Cohesion: 0.10
Nodes (42): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+34 more)

### Community 2 - "worker-runtime.ts"
Cohesion: 0.05
Nodes (55): candidateWorkspaceEnvironment(), assignmentSubject(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), LessonSelection (+47 more)

### Community 3 - "features/workflow.ts"
Cohesion: 0.08
Nodes (63): approveFeature(), commandFeature(), featureById(), mutation(), reviewQuestions(), assertFeatureDependencyOrder(), featureDependencyEdges(), key() (+55 more)

### Community 4 - "InspectorContent.tsx"
Cohesion: 0.08
Nodes (84): Outbox(), FeatureReading(), FeatureWorkspace(), labels, ServiceHealthRow(), BlockerFollowups(), lessonsView(), DrawerRow() (+76 more)

### Community 5 - "github-delivery.ts"
Cohesion: 0.04
Nodes (109): writerRestartInstruction(), findingsBlock(), metadataCarriedAdvisoryIds(), ownedBefore(), QA_STAGES, reviewAdvisoryIds(), Reviewed, withoutReviewAdvisories() (+101 more)

### Community 6 - "budget-ledger.ts"
Cohesion: 0.06
Nodes (57): abandonExpired(), Admission, admit(), admitDeployment(), balance(), bindEvidence(), count(), errcode() (+49 more)

### Community 7 - "index.tsx"
Cohesion: 0.08
Nodes (62): LessonDecisionAction, lessonDecisionState(), readLessonDecision(), OutboxLessonDecision(), act(), readStatus(), OutboxLessonDigest(), evidenceText() (+54 more)

### Community 8 - "incidents/routes.ts"
Cohesion: 0.05
Nodes (65): citationFault(), CitationSchema, SourceVersions, sourceVersions(), dismiss(), DISMISSAL_CITATIONS, DISMISSAL_REASON, DismissalFacts (+57 more)

### Community 9 - "TelemetryPanel.tsx"
Cohesion: 0.11
Nodes (34): TelemetryReport, AzureBuild, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens(), usd() (+26 more)

### Community 10 - "ref_node_crypto"
Cohesion: 0.06
Nodes (71): packedConsumerPnpmRepair(), sha256(), currentApproval(), featureGate(), predecessorComplete(), automaticIntakeWait(), DELAYS, MAX_EXECUTIONS (+63 more)

### Community 11 - "overseer/commands.ts"
Cohesion: 0.07
Nodes (47): reconcile(), guardPresent(), overseerCommand(), reconcileArgs(), resolveCliRoot(), runnerStatus(), DEFAULT_OFFICE_URL, officeUrl() (+39 more)

### Community 12 - "App.tsx"
Cohesion: 0.05
Nodes (73): Conversation(), ConversationDraft, createConversationDrafts(), ChatMarkdown, MessageText(), slackMessageStatus(), SlackDeliveryCard(), BrainDrawer() (+65 more)

### Community 13 - "learningDigest"
Cohesion: 0.29
Nodes (11): distinct(), identity(), improvementIncident(), improvementIncidentKey(), learningDigest(), expireLearningPackets(), packetReferences(), IMPROVEMENT_POLICY (+3 more)

### Community 14 - "request.ts"
Cohesion: 0.08
Nodes (67): refusal(), AdoptionBinding, assertAutomationAuthority(), observeAutomationConflict(), VERB, assertAutomationEffects(), automationMergePolicy(), observeAutomationMerge() (+59 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.11
Nodes (60): accounting, DeliverySubject, nonDelivery, originalReads, createFeature(), approvedDelivery(), bindDelivery(), featureEffectGate() (+52 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.08
Nodes (46): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, BlockingTrigger, blockingTrigger(), isBlocking() (+38 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.12
Nodes (33): LEARNING_BASELINES, clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates(), maintenanceCompletedId(), maintenanceKey(), visibleMaintenanceTriggerIds() (+25 more)

### Community 18 - "route-activation.ts"
Cohesion: 0.14
Nodes (33): RouteEntry, appHistory(), bindingMatches(), configuredBinding(), held(), promoteRoute(), proofRefusal(), revokeRoute() (+25 more)

### Community 19 - "worker-sandbox-run.ts"
Cohesion: 0.06
Nodes (72): timeoutsValid(), assertOwnedDirectory(), checkRunDirectories(), Child, CHILDREN, code(), createRunDirectories(), DIRECTORY_MODES (+64 more)

### Community 20 - "activation-recovery.ts"
Cohesion: 0.07
Nodes (55): PrerequisitesSchema, classifyStop(), stopReason(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation() (+47 more)

### Community 21 - "overseer-launch.mjs"
Cohesion: 0.07
Nodes (80): acquireLauncherLock(), alone(), ancestry(), assertDirectoryOrAbsent(), attemptRecord(), bounded(), boundedString(), checkOwnedFile() (+72 more)

### Community 22 - "setup-stop-cap.ts"
Cohesion: 0.11
Nodes (28): parksInJira(), currentEnvironmentWait(), environmentWait(), rerunsInterruptedQA(), officeRefusedQA(), confirmSetupStopCap(), consecutiveSetupStops(), Counted (+20 more)

### Community 23 - "jira-time.ts"
Cohesion: 0.10
Nodes (37): unresolvedAttempts(), bindingOf(), connectWith(), data(), envelope(), finishVerifiedEffects(), JiraWorklogs, locks (+29 more)

### Community 24 - "effects.ts"
Cohesion: 0.09
Nodes (25): FeaturePublisher, PublicationReceipt, publishFeature(), reconcilePublication(), uncertainPublications(), reserveIdentity(), writerRefused(), writerSuccessor() (+17 more)

### Community 25 - "github.ts"
Cohesion: 0.13
Nodes (20): withGitHubOperation(), GitHubMonitor, Api, terminalPRs(), backgroundHold(), CORE_RESERVE, GRAPHQL_WORK, PROBE_INTERVAL_MS (+12 more)

### Community 26 - "controller-runtime.ts"
Cohesion: 0.11
Nodes (15): [cmd,...rawArgs], projectData(), StoreDatabase, controllerEffects(), DEPLOY_PROJECT, alive(), ControllerMachine, option() (+7 more)

### Community 27 - "fact-bounds.ts"
Cohesion: 0.25
Nodes (15): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+7 more)

### Community 28 - "assertDeliveryMayMutate"
Cohesion: 0.08
Nodes (74): ProjectCard, assertDeliveryMayMutate(), advanceMetadataPark(), Parked, releaseWords(), sentAnything(), cardResumeRoute(), effectiveParkPickup() (+66 more)

### Community 29 - "work-summary.ts"
Cohesion: 0.09
Nodes (44): jiraQueueProgress(), nextStage(), JiraQueueProgress, TicketProgress, STAGE_LABELS, STAGE_ROLE, deliveryRepairProjection(), DependencyNotice() (+36 more)

### Community 30 - "digest"
Cohesion: 0.06
Nodes (91): runHarnessStage(), createdContentSha256(), Binding, historyBeforeWrite(), matchesBoundDescription(), DescriptionEdit, DescriptionHistory, DescriptionHistoryUnavailable (+83 more)

### Community 31 - ".activeClaims"
Cohesion: 0.06
Nodes (61): ownershipReadHistory(), ATTEMPT_DELAYS_MS, nextAttemptAt(), restartStoppedWriters(), unchangedSinceAccepted(), NOT_RETRYABLE, releaseFunds(), StoppedWriter (+53 more)

### Community 32 - ".transaction"
Cohesion: 0.18
Nodes (12): featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), wakeFeature(), recoverFeatures(), observeHelperGroups(), stopReview(), dispatchExposure() (+4 more)

### Community 33 - "run.ts"
Cohesion: 0.14
Nodes (21): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_FIX_PROMPT, OfficeFixResult (+13 more)

### Community 34 - "identity-runtime.ts"
Cohesion: 0.09
Nodes (25): KeychainKeySource, appJwt(), base64url(), signingKey(), AppKeySource, Execute, keychainKeySource(), AppReadiness (+17 more)

### Community 35 - "common.cjs"
Cohesion: 0.14
Nodes (28): connections(), fs, main(), path, crypto, { execFileSync }, fs, path (+20 more)

### Community 36 - "scheduled-work.ts"
Cohesion: 0.07
Nodes (46): freshOwnershipRead(), dueSlackReread(), rereadUncertainSlack(), runningRevision(), deliverySlot(), closeoutRequestResolved(), Ownership, ownershipContext (+38 more)

### Community 37 - "routing.cjs"
Cohesion: 0.15
Nodes (24): adjacency(), edgeCost(), edgeKey(), edgeType(), EVIDENCE_TYPE_PRIORITY, formatBytes(), formatGithubRef(), formatRoute() (+16 more)

### Community 38 - "validate-stage.ts"
Cohesion: 0.17
Nodes (16): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+8 more)

### Community 39 - "task-briefing.ts"
Cohesion: 0.19
Nodes (19): guidanceExcerpt(), digest(), lessonText(), citations(), recordAcceptedKnowledge(), stageName(), knowledgeCitation(), lessonCitation() (+11 more)

### Community 40 - "knowledge.ts"
Cohesion: 0.07
Nodes (34): LessonBrainAudit, LessonBrainOverlap, BRAIN_SCOPE, SUBJECT, Kind, RetrospectiveResult, RetrospectiveResultSchema, RollupResultSchema (+26 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.14
Nodes (27): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence(), CaptureContext (+19 more)

### Community 42 - "assignments.ts"
Cohesion: 0.09
Nodes (27): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, GraphNode (+19 more)

### Community 43 - ".save"
Cohesion: 0.10
Nodes (57): enumerateIntakeList(), inPickupOrder(), Intake, text(), resolveBlockedTransition(), document(), transitionWithComment(), jiraAccount() (+49 more)

### Community 44 - "Offices"
Cohesion: 0.15
Nodes (3): QuestionNotifications, Offices, SessionBridge

### Community 45 - "harness-baseline.ts"
Cohesion: 0.15
Nodes (22): BaselineReport, baselineReport(), BaselineSource, baselineText(), millions(), row(), share(), add() (+14 more)

### Community 46 - "credential-spans.ts"
Cohesion: 0.05
Nodes (69): BareValue, bareValue(), deeperValueEnd(), ENDS, isSeparator(), plainEscape(), queryValue(), separatorEscapeAt() (+61 more)

### Community 47 - "delivery-repairs.ts"
Cohesion: 0.10
Nodes (36): namedRepairIds(), pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), stoppedBaseCheckout(), discussion(), pages(), pullIdentity(), readStoppedBaseProviderContext() (+28 more)

### Community 48 - "deploy.ts"
Cohesion: 0.13
Nodes (36): ControllerEffects, abandon(), advance(), DeployContext, DeployTimings, DEPLOY_STEPS, ROLLED_BACK, holdFence() (+28 more)

### Community 49 - "index.ts"
Cohesion: 0.08
Nodes (41): incidentsRoute(), resumeSwitch(), failure(), halt(), parse(), readFailure(), runnerRoute(), writeFailure() (+33 more)

### Community 50 - "QuestionStepper.tsx"
Cohesion: 0.19
Nodes (18): FeatureQuestionProjection, OutboxQuestionRound(), send(), draftKey(), readDraft(), saveDraft(), QuestionRound(), nextQuestion() (+10 more)

### Community 51 - "Ticket"
Cohesion: 0.10
Nodes (31): carriedNotRepeated(), changeScopeNote(), Scoped, CommentPage, commentReadback(), devUpdate(), HEADLINE, JiraOperations (+23 more)

### Community 52 - "investigations/ledger.ts"
Cohesion: 0.12
Nodes (29): projectSlackDeliveries(), settleRequestedSlackReplacement(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint(), supersedingDelivery(), acceptedCompletionResolution() (+21 more)

### Community 53 - "ref_node_sqlite"
Cohesion: 0.10
Nodes (19): checkpointLabel(), readSavedState(), LARGE_KEY_CHARS, plain(), RedactedEntries, RedactedEntry, redactEntries(), joinParts() (+11 more)

### Community 54 - "JiraIssuePublisher"
Cohesion: 0.20
Nodes (5): contentSchema(), JiraIssuePublisher, descriptionPreimage(), plain(), publicationDescription()

### Community 55 - "app-config.ts"
Cohesion: 0.12
Nodes (24): ActiveEntry, effectId(), entry(), fail(), KnownProject, only(), parseGitHubApp(), positive() (+16 more)

### Community 56 - "halt-report.ts"
Cohesion: 0.08
Nodes (25): FailureReceipt, haltCondition(), forwardFailures(), forwardIntent(), ForwardSummary, Standing, EMPTY_HALT, ForwardCursor (+17 more)

### Community 57 - "pass.ts"
Cohesion: 0.08
Nodes (47): failureLine(), LINE_LIMIT, RunnerLimits, appendFailureLine(), JournalRefused, JournalView, syncPath(), journalDigest() (+39 more)

### Community 58 - "sandbox-qualification.ts"
Cohesion: 0.06
Nodes (41): within(), ALLOW_PROBES, Binding, boundTo(), Cleanup, CLEANUP_PROBES, CleanupProbe, collectProbe() (+33 more)

### Community 59 - "intent.ts"
Cohesion: 0.11
Nodes (23): savedImplementation(), ContinuationIO, continueImplementation(), nativeIO, absent(), candidateParent(), copySavedImplementation(), Saved (+15 more)

### Community 60 - "cost-ledger.ts"
Cohesion: 0.14
Nodes (30): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress(), effectId() (+22 more)

### Community 61 - "demand-facts.ts"
Cohesion: 0.17
Nodes (16): clip(), DEMAND_LIMIT, demandFacts(), key(), LessonKey, notes(), clip(), MISSED_QUERY_LIMIT (+8 more)

### Community 62 - "maintenance/maintenance.ts"
Cohesion: 0.08
Nodes (39): maintenancePolicies(), accessibilitySources(), sourceFindings, sourceReview(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, brainResultStop() (+31 more)

### Community 63 - "PanelHeader"
Cohesion: 0.09
Nodes (39): KnowledgeActivity, KnowledgeActivityPage, ChatMarkdown(), Activity(), ActivityTimeline(), AssignmentKnowledge(), Lookup(), BrainWorkspace() (+31 more)

### Community 64 - "constellation-runtime.ts"
Cohesion: 0.05
Nodes (58): KnowledgeEdge, KnowledgeMap, KnowledgeNode, ATMOSPHERE, mapAtmosphere(), Particle, system(), unit() (+50 more)

### Community 65 - "validate_pr_body.cjs"
Cohesion: 0.36
Nodes (8): fs, main(), readableText(), REQUIRED_CHECKS, REQUIRED_SECTIONS, sections(), validatePullRequestBody(), withoutComments()

### Community 66 - "audit-plan-candidates.cjs"
Cohesion: 0.14
Nodes (31): audit(), branchIssueNumbers(), classify(), distinctiveTitleWords(), { execFileSync }, extractPaths(), findPrForMergeSubject(), fmtCommit() (+23 more)

### Community 67 - "office-client.ts"
Cohesion: 0.10
Nodes (23): FailureAnswer, HaltAnswer, bodyWithin(), bounded(), Envelope, HealthReading, ObservationSkipped, OfficeReader (+15 more)

### Community 68 - "work.ts"
Cohesion: 0.10
Nodes (71): DeliveryAuthorityInput, canonical(), assessResumes(), Standing, CheckpointEligibility, checkpointEligibility(), admitAssignmentResume(), forAssignment() (+63 more)

### Community 69 - "alert-issue.ts"
Cohesion: 0.13
Nodes (30): AlertIssue, alertIssueBody(), alertIssueTitle(), alertMarker(), closeAlertIssue(), ensureAlertIssue(), findAlertIssue(), Guard (+22 more)

### Community 70 - "cx"
Cohesion: 0.08
Nodes (60): displayAgentTask(), withoutElapsed(), CameraBookmark, restoreBookmark(), LiveAgentTask(), Props, RunningTask(), text() (+52 more)

### Community 71 - "spawn-command.ts"
Cohesion: 0.12
Nodes (24): childEnvironment(), exitFailure(), inactivityWatch(), At, Errno, errno(), GroupInventory, GroupProbe (+16 more)

### Community 72 - "session-context-file.ts"
Cohesion: 0.19
Nodes (16): Bound, unpackContextFailure(), ContextFoldPrefix, contextFoldPrefix(), SessionContextCheckpoint, captureSessionContextClone(), ContextReadPhase, SessionContextDeadline (+8 more)

### Community 73 - "local-config.ts"
Cohesion: 0.10
Nodes (37): escaped(), IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), projectListScope(), AUTO_ADOPT_BOTS, assertFeaturePlanningConfig() (+29 more)

### Community 74 - "session-scope.ts"
Cohesion: 0.21
Nodes (15): claudeScopeParser(), claudeSessionScope(), CODEX_ROLLOUTS, contextReaders(), retainSessionMessage(), SessionConversation, escaped(), jiraCommandIssues() (+7 more)

### Community 75 - "service-health.ts"
Cohesion: 0.11
Nodes (25): ClaudeLoginRefusal, claudeLoginRefusal(), claudeRefusalWords(), RECORDED_REFUSALS, refusedClaudeRow(), listenerHealth(), providers, ProviderStatusChecks (+17 more)

### Community 76 - "azure.ts"
Cohesion: 0.12
Nodes (30): az(), buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs(), fullActivePRs(), observation() (+22 more)

### Community 77 - "closeout-recovery.ts"
Cohesion: 0.08
Nodes (58): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+50 more)

### Community 78 - "incidents.ts"
Cohesion: 0.07
Nodes (64): attributedRecords(), foldsItsRun(), groupCandidates(), ObservedIncident, ObservedSubject, digest(), fingerprint(), incidentId() (+56 more)

### Community 79 - "agents.ts"
Cohesion: 0.05
Nodes (65): implementationWorkerContext(), intakeMembership(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), plainResume(), readbackDispatchGuidance() (+57 more)

### Community 80 - "session-bridge.ts"
Cohesion: 0.10
Nodes (29): codexDaemonProcesses(), accountCodexProcesses(), CodexProcessInventory, codexProcessInventory(), DesktopSessions, unaccountedProcesses(), codexThreadMetadata(), METADATA_CHUNK (+21 more)

### Community 82 - "metadata-park-words.ts"
Cohesion: 0.22
Nodes (15): OUTCOME, qaComment(), remote(), STAGE, plainWords(), tidy(), field(), FIELDS (+7 more)

### Community 83 - "remove-candidate.ts"
Cohesion: 0.18
Nodes (19): recordCandidateCleanup(), interruptedRemoval(), maintenanceCandidate(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot() (+11 more)

### Community 84 - "viewer.js"
Cohesion: 0.19
Nodes (25): addMetaLink(), addMetaRow(), addRelationship(), applyView(), buildIndexes(), buildLegend(), buildModel(), buildRenderer() (+17 more)

### Community 85 - "api-routes.ts"
Cohesion: 0.18
Nodes (16): implementationContinuationRoute(), qaPlanRetryRoute(), servedOutbox(), isNotice(), readNotices(), goalHistory(), apiRoute(), fileResponse() (+8 more)

### Community 86 - "stopped-record.ts"
Cohesion: 0.08
Nodes (53): capabilityBlockedReviews(), latestReviews(), WRITER_STAGES, boundedEvidence(), expectedWait(), StopFacts, normalizeCause(), IncidentCollector (+45 more)

### Community 87 - "conversations/conversations.ts"
Cohesion: 0.10
Nodes (25): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+17 more)

### Community 88 - "superseded-wiki-pr.ts"
Cohesion: 0.10
Nodes (53): abandon(), assertOpenSnapshot(), awaitingContainment(), closeIssue(), CloseRevalidationError, closeSuperseded(), comment(), CommentStep (+45 more)

### Community 89 - "ref_node_child_process"
Cohesion: 0.09
Nodes (24): changedPaths(), { execFileSync }, files, isMapInput(), mapOnly(), { execFileSync }, git(), publish() (+16 more)

### Community 90 - "sanitize"
Cohesion: 0.08
Nodes (43): correlatedBuild(), awaitingJiraStatus(), awaitingProduction(), FOLLOW_DAYS, followed(), isFollowed(), Azure, AzureRead (+35 more)

### Community 91 - "OfficeProject"
Cohesion: 0.12
Nodes (27): assetDownloader(), attachmentKind(), evidenceDirectory(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS, EvidenceAttachment (+19 more)

### Community 92 - "session-context-client.ts"
Cohesion: 0.11
Nodes (18): claudeSessionContext(), readTranscript, codexSessionContext(), readRollout, packContextFailure(), PackedContextFailure, ContextThread, contextThread() (+10 more)

### Community 93 - "plans.cjs"
Cohesion: 0.16
Nodes (22): fs, main(), parse(), path, walk(), association(), auditedDigests(), candidate() (+14 more)

### Community 94 - ".emit"
Cohesion: 0.06
Nodes (50): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), currentOutbox(), admitReadyCards(), confirmedGone(), goneQuery(), STOPPED (+42 more)

### Community 96 - "continue-ownership-read.ts"
Cohesion: 0.21
Nodes (16): continueOwnershipRead(), expiredOwnershipRead(), handoffOwnership(), ReadbackOwnerDecision, ownershipReadGate(), ownershipReadState(), ownershipReadSource(), ReadOwnershipCandidate (+8 more)

### Community 97 - "pr-observation-shape.ts"
Cohesion: 0.21
Nodes (19): githubPRDescription(), closingDirectives(), ObservedPR, enumValue(), fail(), graphqlPR(), mapped(), member() (+11 more)

### Community 98 - "pilot-delivery.ts"
Cohesion: 0.05
Nodes (84): candidateBranchMoved(), applyChangeScope(), endChangeScope(), levels(), MAX_CHECKS, owedUnderScope(), scopeBase(), scopeOutgrown() (+76 more)

### Community 99 - "archive-plan.cjs"
Cohesion: 0.11
Nodes (35): fs, main(), parse(), path, archive(), cell(), ensureIndex(), fromArgs() (+27 more)

### Community 100 - "call-scope.ts"
Cohesion: 0.06
Nodes (56): boardReadFailure(), add(), addSource(), busiest(), CallLedger, Entry, sourceRows(), Sources (+48 more)

### Community 101 - "jira-attempts.ts"
Cohesion: 0.10
Nodes (25): attempted(), attemptState(), bound(), covers(), JiraAttempt, jiraAttempts(), JiraAttemptState, open() (+17 more)

### Community 102 - "ref_node_path"
Cohesion: 0.08
Nodes (44): GitRead, nativeGitRead(), patchArgs, sha(), sourceCopyMatches(), sourceFiles(), interruptedImplementation(), verifyContinuationPreservation() (+36 more)

### Community 103 - "on-merge-sync.cjs"
Cohesion: 0.13
Nodes (35): fs, main(), path, { spawnSync }, fieldSpan(), frontmatterProblems(), keyPattern(), list() (+27 more)

### Community 104 - "backup-stores.ts"
Cohesion: 0.09
Nodes (38): absentAdmission(), AdmissionComparison, AdmissionSnapshot, compareAdmissions(), snapshotAdmissions(), BackupEntry, BackupInput, BackupInventory (+30 more)

### Community 105 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 106 - "ref_zod"
Cohesion: 0.22
Nodes (6): Body, DeploymentFenceState, Health, IdleObservation, IdleResult, WaitIdleInput

### Community 107 - "harnessEffect"
Cohesion: 0.08
Nodes (65): effectKey(), LaneOperation, laneWrite(), moveCardOnce(), initialManualStart(), Lane, MOVABLE, moveLane() (+57 more)

### Community 108 - "judge-resumes.ts"
Cohesion: 0.07
Nodes (41): boundaryCrossed(), Crossing, Progress, CheckpointProgress, checkpointProgress(), names(), nativeProof(), Step (+33 more)

### Community 109 - "pr-observation-graphql.ts"
Cohesion: 0.13
Nodes (29): ChildRequest, headCheckRuns(), includeBody(), readOpenPRs(), commitOf(), ConnectionPages, embeddedHead(), fail() (+21 more)

### Community 110 - "blocker-followups.ts"
Cohesion: 0.11
Nodes (48): conversationReadbackReady(), followupOf(), pendingReadback(), queueConversationReadback(), readbackEnding(), uncertainConversations(), readBackConversations(), followupRecord() (+40 more)

### Community 111 - "unsent-time.ts"
Cohesion: 0.20
Nodes (15): JiraWorklogAttempt, publishableEntry(), settlementPending(), superseded(), ticketUnresolved(), ScopeRow, dueUnsent(), releaseUnsent() (+7 more)

### Community 112 - "interrupted-work-recovery.ts"
Cohesion: 0.27
Nodes (9): interruptAdoptions(), legacy(), REMOVED_FIELDS, retireLegacyRecovery(), goalNoticeNeverDispatched(), maintenanceNoticeNeverDispatched(), checkpointOutcome(), Outcome (+1 more)

### Community 113 - "Goals.tsx"
Cohesion: 0.08
Nodes (36): GoalProgress, SendMessage, OutboxSavedImplementation(), apply(), review(), OutboxSavedPlan(), reconcile(), FeatureDelivery() (+28 more)

### Community 114 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 115 - "run-accounting.ts"
Cohesion: 0.05
Nodes (68): BoundedRead, done(), readBoundedNoFollow(), reasonOf(), comparable(), EvidenceOutcome, recordRunEvidence(), backfillClaudeCost() (+60 more)

### Community 119 - "store.ts"
Cohesion: 0.07
Nodes (32): leadershipContext(), captureLearning(), recordLearningOpportunity(), baselined(), maintainLearning(), captureMaintenanceStep(), knowledgeEntries(), knowledgeOfficeState() (+24 more)

### Community 120 - "deploy-plan.ts"
Cohesion: 0.34
Nodes (13): fenceTokenDigest(), operationPaths(), planDeployment(), createDeployToken(), readDeployToken(), removeDeployToken(), publishDurable(), writeDurable() (+5 more)

### Community 121 - ".getEffect"
Cohesion: 0.08
Nodes (40): NOT_LANDED_SETTLE_MS, settleNotLanded(), GitHubOperations, executeGitHubWrite(), reconcileGitHubWrite(), withWriteCredential(), assignedToJoe(), fileLessonIssue() (+32 more)

### Community 122 - "ControlStore"
Cohesion: 0.13
Nodes (7): DailyCTO, EvidenceRequestConflict, queueGoalEvidenceRequest(), Briefing, saveReviewBriefing(), ControlStore, DailyCTOReport

### Community 123 - "deploy-command.ts"
Cohesion: 0.07
Nodes (65): CONTROLLER_ENTRY, ControllerPin, Pin, pinnedController(), readControllerPin(), writeControllerPin(), controllerOf(), deployCommand() (+57 more)

### Community 124 - "refresh-issue-state.cjs"
Cohesion: 0.22
Nodes (13): atomicWrite(), advanceFence(), key(), { execFileSync }, fs, issueRefs(), main(), markClosed() (+5 more)

### Community 125 - "notifications.ts"
Cohesion: 0.09
Nodes (33): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR (+25 more)

### Community 126 - "accept-stage-result.ts"
Cohesion: 0.06
Nodes (81): containedFile(), DECISION_KINDS, needsDecision(), acceptStageResult(), acceptConflictRepair(), APPROACH_GUARD_REJECTION, nextJobStage(), recordJobApproach() (+73 more)

### Community 127 - "sign-in-unpark.ts"
Cohesion: 0.18
Nodes (18): hasPendingDelivery(), resumeAfterSignIn(), signInWait(), MAX_SIGN_IN_UNPARKS, waitingStep(), BrowserPage, browserPages(), ReadPages (+10 more)

### Community 128 - "it-specialist.ts"
Cohesion: 0.19
Nodes (13): replacedReadback(), heldFor(), ITContext, recoveryHeld(), recoveryWait(), informationalRecovery(), ITSpecialist, ownAzureCheck() (+5 more)

### Community 129 - "retrospective-subject.ts"
Cohesion: 0.20
Nodes (14): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+6 more)

### Community 130 - "pre-push-boundary.ts"
Cohesion: 0.26
Nodes (10): Event, exactCommand(), Invocation, localHookCommand(), one(), prePushRejection(), PushIdentity, retirementBoundary() (+2 more)

### Community 131 - "shared.ts"
Cohesion: 0.06
Nodes (56): assignmentDiagnostics(), diagnosticContext(), diagnosticSnapshot(), followUpPicture(), publishITReport(), archiveOldReports(), RETAINED_REPORTS, archiveByMonth() (+48 more)

### Community 132 - "http/commands.ts"
Cohesion: 0.13
Nodes (23): requestQAPlanRetry(), approveMerge(), assertHarnessMayMerge(), HUMAN_MERGE, requeueWaitedImplement(), normalizeStatement(), baselineLearning(), configureKnowledge() (+15 more)

### Community 134 - "weekly-rollup.ts"
Cohesion: 0.16
Nodes (23): learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), RollupResult (+15 more)

### Community 135 - "observe-projects.ts"
Cohesion: 0.23
Nodes (13): FailedMailCheck, lastFailedMailCheck(), lastMailCheckOutcome(), MailCheckOutcome, ProjectObservation, LANES, observeProjects(), OfficeObservation (+5 more)

### Community 136 - "office/readiness.ts"
Cohesion: 0.19
Nodes (11): effectiveCause(), REPLACED, BLOCKED_CAUSES, blockedCauses(), NONE, projectReadiness(), explanation(), LABELS (+3 more)

### Community 137 - "checkpoint-completion.ts"
Cohesion: 0.16
Nodes (13): BrainStatusSchema, identity, brainCheckpointCompletion(), coverageSchema, verified, PublishedPR, publishedWorkCleanedUp(), nativeChecks (+5 more)

### Community 138 - "goal-reviews.ts"
Cohesion: 0.12
Nodes (21): currentCitations(), Fact, NOT_CURRENT, PROVIDER_ERROR, applyGoalReview(), DeliveryJob, EvidenceRefSchema, jobAccepted() (+13 more)

### Community 139 - "OfficeSnapshot"
Cohesion: 0.05
Nodes (62): ctoInputIdentityMatches(), ctoInputRecovered(), metadataParkAction(), ADOPTION_STALLED_MS, conversationResolved(), projectOutbox(), item(), syncOutbox() (+54 more)

### Community 140 - "GitHubDelivery"
Cohesion: 0.08
Nodes (30): GitHubDelivery, boardPreflightCandidate(), Ownership, reconcileBoardPreflight(), Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate() (+22 more)

### Community 141 - "daily-cto.ts"
Cohesion: 0.21
Nodes (9): evidenceRequestConflicts, dailyReviewPrompt(), reviewWeekday(), DailyResultSchema, FreshDailyResultSchema, GoalEvidenceRequestSchema, SeenReports, WAITING (+1 more)

### Community 142 - "scheduler.ts"
Cohesion: 0.12
Nodes (16): OfficeCapacity, PROJECT_LOCAL, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch() (+8 more)

### Community 144 - "reconcile-merges.cjs"
Cohesion: 0.22
Nodes (14): collectPulls(), copyWikiForDryRun(), { execFileSync }, flattenPages(), fs, githubRequest(), isWikiBotPull(), main() (+6 more)

### Community 145 - "timed-statements.ts"
Cohesion: 0.32
Nodes (11): NAMED, rowsText(), rowText(), SQL_TOKEN, statementName(), text(), timed(), timedRun() (+3 more)

### Community 146 - "holdReason"
Cohesion: 0.06
Nodes (103): removeAdoptedClone(), handsOff(), savedActivationFailure(), adoptCandidate(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent() (+95 more)

### Community 147 - "Store"
Cohesion: 0.04
Nodes (21): AzureMonitor, Assignment, jiraText(), Transition, GitHubFeaturePublisher, JiraFeaturePublisher, FeatureReviewRunner, boundGitHubRunner() (+13 more)

### Community 148 - "runner-root.ts"
Cohesion: 0.12
Nodes (31): LOOPBACK, privateDirectories(), RUNNER_DEFAULTS, RunnerPaths, runnerPaths(), officeDataRoot, realMachine(), RunnerPin (+23 more)

### Community 149 - "resume-control.ts"
Cohesion: 0.29
Nodes (7): absent(), NEVER_ENABLED, ResumeControl, stated(), Stored, unreadable(), ResumeSwitch

### Community 150 - "serve-graph.cjs"
Cohesion: 0.24
Nodes (9): createServer(), fs, http, listen(), attempt(), main(), path, resolveRequest() (+1 more)

### Community 151 - "coordination.ts"
Cohesion: 0.08
Nodes (41): reconcileNoticeConfirmations(), Admission, admit(), IntakeContext, WAIT_STATUSES, compatible(), dependencyCompletionKey(), dependencyEligibility() (+33 more)

### Community 152 - "runner-routes.ts"
Cohesion: 0.13
Nodes (17): incidentNotices(), NOTICE_KINDS, STATUS, RUNNER_INCIDENT, RUNNER_SUBJECT, IncidentsRouteContext, Digest, Evidence (+9 more)

### Community 153 - "projects.ts"
Cohesion: 0.08
Nodes (30): CEC, file, project, root, OfficeConfigInputs, officeConfigRoute(), officeConfigSummary(), projectSettingsSummary() (+22 more)

### Community 154 - "DeploymentFence"
Cohesion: 0.38
Nodes (3): assertToken(), DeploymentFence, DeploymentFenceRouteContext

### Community 155 - "recorded-gh-command.ts"
Cohesion: 0.19
Nodes (20): assignments(), changeDirectory(), closing(), CREATE, createGuard(), flags(), named(), read() (+12 more)

### Community 156 - "cec.ts"
Cohesion: 0.07
Nodes (49): cecPrompt(), resolvedDecisionNote(), stageInstructions, stageInstructionsFor(), REVIEW_FINDINGS_RULE, latestQA(), notPassedInLatestQA(), QACoverage (+41 more)

### Community 157 - "observe-github-merges.ts"
Cohesion: 0.30
Nodes (14): clearCooldown(), coolDown(), coolingDown(), MERGE_NOTICE_RECHECK_MS, waitKey(), waits, isMergeCommit(), issueOf() (+6 more)

### Community 158 - "http/context.ts"
Cohesion: 0.21
Nodes (8): PORT, RequestContext, ServiceContext, DelayHistogram, LOOP_SAMPLE_MS, LoopDelay, loopDelay(), LoopDelayReport

### Community 160 - "write-credential-scope.ts"
Cohesion: 0.25
Nodes (13): assertPushCredential(), Execute, assertBoundPushDestination(), digest(), Execute, file(), PUSH_HOOKS, pushHookChain() (+5 more)

### Community 161 - "security.ts"
Cohesion: 0.17
Nodes (12): BEARER_CREDENTIAL, escapedAt(), HEADER_CREDENTIAL, HEADER_OPERAND, HEADER_PREFIX, POSTGRES_URL, PROVIDER_TOKEN, QUERY_CREDENTIAL (+4 more)

### Community 162 - "workKey"
Cohesion: 0.14
Nodes (24): notOwned(), needsReconciliation(), mergedByOwner(), harnessMergeAttempted(), mergedByOfficeBot(), closeableIssue(), effectsSettled(), eligible() (+16 more)

### Community 163 - "closeout.ts"
Cohesion: 0.36
Nodes (8): harnessCloseout(), PASSING, verifyMergeActions(), harnessStageResult(), receipt(), harnessDraft(), appSelected(), Receipt

### Community 164 - "telemetry/report.ts"
Cohesion: 0.24
Nodes (14): TelemetryRow, TelemetrySync, Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount() (+6 more)

### Community 165 - "effect.ts"
Cohesion: 0.13
Nodes (32): commentId(), CommentIntent, CommentReceipt, conversation(), exact(), findProofComment(), matchesProofComment(), postProofComment() (+24 more)

### Community 166 - "launch.mjs"
Cohesion: 0.07
Nodes (93): RFC-9562, CHECKOUT, DEFAULT_DEADLINE_MS, existingPlist(), installOverseer(), LABEL, LAUNCHER_SOURCE, renderPlist() (+85 more)

### Community 168 - "incident-command.ts"
Cohesion: 0.38
Nodes (6): FLAGS, incidentCommand(), IncidentCommandIO, option(), USAGE, whole()

### Community 170 - "preferences-store.ts"
Cohesion: 0.23
Nodes (7): PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, OFFICE_PREFERENCE_DEFAULTS, OfficePreferences

### Community 171 - "release-manifest.ts"
Cohesion: 0.09
Nodes (39): runningRevision(), runningRevision(), DATA, ROOT, releaseIdentity(), runtimeRevision(), PIN_ENTRY, pinCommand() (+31 more)

### Community 173 - "validate_wiki_pr_body.cjs"
Cohesion: 0.33
Nodes (5): { execFileSync }, hasCanonicalWikiBody(), maintenanceBodies, matchesMaintenanceBody(), { readFileSync }

### Community 175 - "build-overseer-launcher.mjs"
Cohesion: 0.20
Nodes (8): BANNER, builtin(), bundleLauncher(), LAUNCHER_BUNDLE, LAUNCHER_ENTRY, launcherChunk(), REPOSITORY, SCRIPT

### Community 178 - "parked-card-refusal.ts"
Cohesion: 0.33
Nodes (5): BLOCK, harnessBlockMove(), harnessParkedCard(), noted(), ProjectProgress

### Community 179 - "evidence-artifacts.ts"
Cohesion: 0.31
Nodes (11): readEvidence(), ProviderEvidence, canonical(), evidenceDigest(), evidenceHash(), semantic(), stableUrl(), refreshFeatureEvidence() (+3 more)

### Community 180 - "write-boundary.ts"
Cohesion: 0.10
Nodes (29): GitHubAppConfig, AMBIENT_TOKENS, appCredential(), ChildCredential, CREDENTIAL_TRACING, GIT_HELPER, operatorRollbackCredential(), PROMPTS (+21 more)

### Community 183 - "session-snapshot-cleanup.ts"
Cohesion: 0.40
Nodes (5): SNAPSHOT_PREFIX, removeStaleSessionSnapshots(), SNAPSHOT_SWEEP_MS, STALE_SNAPSHOT_MS, sweepStaleSessionSnapshots()

### Community 186 - "inspect-closed-plan.ts"
Cohesion: 0.19
Nodes (12): closedReadonlyPlan(), Document, document(), entryExists(), inspectClosedQAPlan(), reviewedPlanGuidance, reviewedPlanGuideDigest, qaPlanEvidenceGap() (+4 more)

## Knowledge Gaps
- **1 isolated node(s):** `RFC-9562`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 1295 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `IncidentLedger`, `worker-runtime.ts`, `features/workflow.ts`, `github-delivery.ts`, `ref_node_crypto`, `learningDigest`, `request.ts`, `scheduled-captures.ts`, `run-retrospective.ts`, `record-trigger.ts`, `route-activation.ts`, `activation-recovery.ts`, `setup-stop-cap.ts`, `jira-time.ts`, `effects.ts`, `github.ts`, `controller-runtime.ts`, `assertDeliveryMayMutate`, `digest`, `.activeClaims`, `.transaction`, `run.ts`, `identity-runtime.ts`, `scheduled-work.ts`, `validate-stage.ts`, `task-briefing.ts`, `time-scope.ts`, `assignments.ts`, `.save`, `Offices`, `delivery-repairs.ts`, `index.ts`, `Ticket`, `investigations/ledger.ts`, `ref_node_sqlite`, `intent.ts`, `cost-ledger.ts`, `demand-facts.ts`, `maintenance/maintenance.ts`, `work.ts`, `alert-issue.ts`, `azure.ts`, `closeout-recovery.ts`, `agents.ts`, `session-bridge.ts`, `remove-candidate.ts`, `api-routes.ts`, `conversations/conversations.ts`, `superseded-wiki-pr.ts`, `sanitize`, `OfficeProject`, `.emit`, `continue-ownership-read.ts`, `pilot-delivery.ts`, `jira-attempts.ts`, `ref_node_path`, `harnessEffect`, `judge-resumes.ts`, `pr-observation-graphql.ts`, `blocker-followups.ts`, `unsent-time.ts`, `interrupted-work-recovery.ts`, `run-accounting.ts`, `store.ts`, `.getEffect`, `notifications.ts`, `accept-stage-result.ts`, `sign-in-unpark.ts`, `it-specialist.ts`, `retrospective-subject.ts`, `shared.ts`, `http/commands.ts`, `weekly-rollup.ts`, `observe-projects.ts`, `checkpoint-completion.ts`, `goal-reviews.ts`, `OfficeSnapshot`, `GitHubDelivery`, `scheduler.ts`, `holdReason`, `coordination.ts`, `cec.ts`, `observe-github-merges.ts`, `write-credential-scope.ts`, `workKey`, `effect.ts`, `parked-card-refusal.ts`, `evidence-artifacts.ts`, `write-boundary.ts`, `inspect-closed-plan.ts`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **What connects `RFC-9562` to the rest of the system?**
  _1 weakly-connected nodes found - possible missing edges._
- **Should `IncidentLedger` be split into smaller, more focused modules?**
  _Cohesion score 0.07063063063063063 - nodes in this community are weakly interconnected._
- **Why does `command()` connect `Store` to `IncidentLedger`, `worker-runtime.ts`, `features/workflow.ts`, `github-delivery.ts`, `weekly-rollup.ts`, `incidents/routes.ts`, `checkpoint-completion.ts`, `GitHubDelivery`, `holdReason`, `worker-sandbox-run.ts`, `activation-recovery.ts`, `coordination.ts`, `effects.ts`, `github.ts`, `runner-routes.ts`, `controller-runtime.ts`, `jira-time.ts`, `digest`, `.activeClaims`, `identity-runtime.ts`, `validate-stage.ts`, `assignments.ts`, `.save`, `release-manifest.ts`, `delivery-repairs.ts`, `deploy.ts`, `Ticket`, `inspect-closed-plan.ts`, `intent.ts`, `cost-ledger.ts`, `maintenance/maintenance.ts`, `service-health.ts`, `azure.ts`, `closeout-recovery.ts`, `agents.ts`, `session-bridge.ts`, `remove-candidate.ts`, `superseded-wiki-pr.ts`, `sanitize`, `OfficeProject`, `continue-ownership-read.ts`, `pilot-delivery.ts`, `jira-attempts.ts`, `ref_node_path`, `harnessEffect`, `.getEffect`, `deploy-command.ts`, `notifications.ts`, `accept-stage-result.ts`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Should `OrgChart.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09503843466107617 - nodes in this community are weakly interconnected._
- **Why does `TicketJob` connect `github-delivery.ts` to `it-specialist.ts`, `OrgChart.tsx`, `retrospective-subject.ts`, `shared.ts`, `http/commands.ts`, `InspectorContent.tsx`, `checkpoint-completion.ts`, `OfficeSnapshot`, `GitHubDelivery`, `request.ts`, `scheduled-captures.ts`, `scheduler.ts`, `record-trigger.ts`, `holdReason`, `activation-recovery.ts`, `fact-bounds.ts`, `assertDeliveryMayMutate`, `observe-github-merges.ts`, `digest`, `.activeClaims`, `cec.ts`, `work-summary.ts`, `workKey`, `closeout.ts`, `scheduled-work.ts`, `effect.ts`, `validate-stage.ts`, `delivery-repairs.ts`, `parked-card-refusal.ts`, `work.ts`, `alert-issue.ts`, `closeout-recovery.ts`, `remove-candidate.ts`, `stopped-record.ts`, `superseded-wiki-pr.ts`, `.emit`, `call-scope.ts`, `ref_node_path`, `harnessEffect`, `interrupted-work-recovery.ts`, `accept-stage-result.ts`, `sign-in-unpark.ts`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Should `worker-runtime.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05213089802130898 - nodes in this community are weakly interconnected._