# Graph Report - the-office  (2026-11-25)

## Corpus Check
- 1232 files · ~520,961 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 6347 nodes · 27984 edges · 167 communities (158 shown, 9 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 1024 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `58fa8c58`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- incidents/routes.ts
- OrgChart.tsx
- worker-runtime.ts
- process.ts
- cx
- weekly-rollup.ts
- run.ts
- Button
- GitHubDelivery
- TelemetryPanel.tsx
- ref_node_crypto
- Store
- App.tsx
- admit-improvement.ts
- advance-metadata-park.ts
- scheduled-captures.ts
- work-summary.ts
- record-trigger.ts
- deploy-command.ts
- closeout-recovery.ts
- holdReason
- dependency-bots/adopt.ts
- retrospective-subject.ts
- jira-time.ts
- deploy-plan.ts
- candidate-child-context.ts
- agents.ts
- owner-merged-stopped.ts
- github-delivery.ts
- index.tsx
- digest
- command
- index.ts
- remove-candidate.ts
- call-scope.ts
- common.cjs
- scheduled-work.ts
- routing.cjs
- redact-evidence.ts
- assignments.ts
- read-retries.ts
- time-scope.ts
- engine.ts
- jiraBinding
- Offices
- harness-baseline.ts
- OfficeScene.tsx
- change-scope.ts
- cec.ts
- pilot-delivery.ts
- QuestionStepper.tsx
- brain-maintenance.ts
- ref_zod
- state-parts.ts
- JiraIssuePublisher
- ref_node_child_process
- features.ts
- deploy.ts
- shared.ts
- jira-attempts.ts
- cost-ledger.ts
- unsent-time.ts
- maintenance/maintenance.ts
- MapView.tsx
- judge-resumes.ts
- validate_pr_body.cjs
- audit-plan-candidates.cjs
- goal-reviews.ts
- resume-arrivals.ts
- ticket-evidence.ts
- constellation-runtime.ts
- cec-reads.ts
- session-context-file.ts
- reader.ts
- session-scope.ts
- service-health.ts
- project-bindings.ts
- it-report.ts
- incidents.ts
- fact-bounds.ts
- session-bridge.ts
- Coordinator
- release-unpark.ts
- diagnostic-snapshot.ts
- viewer.js
- continue-ownership-read.ts
- stopped-record.ts
- conversations/conversations.ts
- QAResultsCard.tsx
- spawn-command.ts
- provider-observation.ts
- cec/issue-publication.ts
- session-context-client.ts
- plans.cjs
- report.ts
- capture-session-clone.py
- sign-in-unpark.ts
- .activeClaims
- Ticket
- archive-plan.cjs
- assignment-poll.ts
- http/commands.ts
- coordination-tick.ts
- on-merge-sync.cjs
- backup-stores.ts
- extract-worker.mjs
- service-plist.ts
- work.ts
- DeploymentFence
- rate-limit-samples.ts
- blocker-followups.ts
- dependencies.ts
- outbox.ts
- checkpoint-completion.ts
- slack-supersession.ts
- telemetry.ts
- qa.ts
- qa-plan-continuation.ts
- writer-restart.ts
- featureById
- lesson-selection.ts
- .emit
- resume-control.ts
- createConstellation
- refresh-issue-state.cjs
- knowledge.ts
- ref_node_path
- cli.ts
- node-visuals.ts
- accessibility-sources.ts
- pre-push-boundary.ts
- it-specialist.ts
- run-accounting.ts
- owned-artifact.ts
- follow-up-alerts.ts
- controller-runtime.ts
- enrollment-gate.ts
- Effects
- ledger.ts
- FeatureWorkflow
- session-snapshot-cleanup.ts
- scene-motion.ts
- scheduler.ts
- production.ts
- reconcile-merges.cjs
- preferences-store.ts
- RoomCamera.tsx
- metadata-park-words.ts
- call-ledger.ts
- harnessEffect
- repoRoot
- LessonsPanel.tsx
- coordination.ts
- qa-plan-retry.ts
- inspect-closed-plan.ts
- command-registry.ts
- delivery-ownership.ts
- codex-rollout.ts
- continue-access-only-plan.ts
- routing.js
- packed-consumer-pnpm.ts
- helper-usage.ts
- run-usage.ts
- restoreInPlace
- run-evidence.ts
- InFlightOperations
- office-qa-handoff.ts

## God Nodes (most connected - your core abstractions)
1. `Store` - 451 edges
2. `TicketJob` - 217 edges
3. `digest()` - 160 edges
4. `command()` - 155 edges
5. `holdReason()` - 141 edges
6. `GitHubDelivery` - 129 edges
7. `OfficeSnapshot` - 123 edges
8. `artifact()` - 114 edges
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

## Communities (167 total, 9 thin omitted)

### Community 0 - "incidents/routes.ts"
Cohesion: 0.06
Nodes (51): citationFault(), CitationSchema, SourceVersions, dismiss(), DISMISSAL_CITATIONS, DISMISSAL_REASON, DismissalFacts, DismissalRequest (+43 more)

### Community 1 - "OrgChart.tsx"
Cohesion: 0.12
Nodes (38): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+30 more)

### Community 2 - "worker-runtime.ts"
Cohesion: 0.07
Nodes (39): savedStageCompletion(), SlackResultSchema, SlackVerificationSchema, candidateWorkspaceEnvironment(), assignmentSubject(), assignmentLookups, contextPacket(), CODEX_DEFAULT_EFFORT (+31 more)

### Community 3 - "process.ts"
Cohesion: 0.07
Nodes (49): approveFeature(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), artifactPath(), digest(), document() (+41 more)

### Community 4 - "cx"
Cohesion: 0.09
Nodes (82): Conversation(), Outbox(), slackMessageStatus(), SlackDeliveryCard(), blockedSummary(), ServiceHealthPanel(), labels, ServiceHealthRow() (+74 more)

### Community 5 - "weekly-rollup.ts"
Cohesion: 0.07
Nodes (38): learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), RollupResult (+30 more)

### Community 6 - "run.ts"
Cohesion: 0.14
Nodes (21): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_FIX_PROMPT, OfficeFixResult (+13 more)

### Community 7 - "Button"
Cohesion: 0.19
Nodes (29): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView() (+21 more)

### Community 8 - "GitHubDelivery"
Cohesion: 0.04
Nodes (90): assertParkDecision(), idle(), intentState(), METADATA_PARKS_PER_OBSERVATION, observeMetadataParks(), sentState(), APPROACH_GUIDANCE, reviewInstructions() (+82 more)

### Community 9 - "TelemetryPanel.tsx"
Cohesion: 0.09
Nodes (44): TelemetryReport, displayAgentTask(), LiveAgentTask(), Props, RunningTask(), text(), AzureBuild, ROLE_NAMES (+36 more)

### Community 10 - "ref_node_crypto"
Cohesion: 0.11
Nodes (39): featureItemComplete(), reconcileFeatureCompletion(), discoveryPrompt(), planPrompt(), readEvidence(), helperTelemetry(), DELAYS, MAX_EXECUTIONS (+31 more)

### Community 11 - "Store"
Cohesion: 0.08
Nodes (19): ProjectProgress, Clock, systemClock, checkpointLabel(), applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration (+11 more)

### Community 12 - "App.tsx"
Cohesion: 0.04
Nodes (74): createConversationDrafts(), SendMessage, BrainDrawer(), themeColor, App(), BrainWorkspace, CONNECTION, CONNECTION_DOT (+66 more)

### Community 13 - "admit-improvement.ts"
Cohesion: 0.21
Nodes (17): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+9 more)

### Community 14 - "advance-metadata-park.ts"
Cohesion: 0.10
Nodes (59): ProjectCard, advanceMetadataPark(), Parked, releaseWords(), sentAnything(), effectiveParkPickup(), PICKUP_ASSIGNEE, REVIEWABLE (+51 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.14
Nodes (51): requestDelivery(), createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), CaptureRequest (+43 more)

### Community 16 - "work-summary.ts"
Cohesion: 0.10
Nodes (37): jiraQueueProgress(), nextStage(), deliveryRoles, JiraQueueProgress, TicketProgress, STAGE_LABELS, STAGE_ROLE, envelopeCard (+29 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.07
Nodes (61): acceptRetrospective(), BLOCKING, BlockingTrigger, blockingTrigger(), isBlocking(), brainOverlapQuery(), withDemand(), improvementIntakeGate() (+53 more)

### Community 18 - "deploy-command.ts"
Cohesion: 0.12
Nodes (30): CONTROLLER_ENTRY, ControllerPin, Pin, pinnedController(), readControllerPin(), writeControllerPin(), controllerOf(), deployCommand() (+22 more)

### Community 19 - "closeout-recovery.ts"
Cohesion: 0.11
Nodes (41): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+33 more)

### Community 20 - "holdReason"
Cohesion: 0.04
Nodes (148): partialLocalCleanupCandidate(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal (+140 more)

### Community 21 - "dependency-bots/adopt.ts"
Cohesion: 0.07
Nodes (57): readBackOrThrow(), adoptDependabot(), alertIssueBody(), alertIssueTitle(), alertMarker(), ensureAlertIssue(), findAlertIssue(), listOwnIssues() (+49 more)

### Community 22 - "retrospective-subject.ts"
Cohesion: 0.20
Nodes (14): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+6 more)

### Community 23 - "jira-time.ts"
Cohesion: 0.09
Nodes (38): unresolvedAttempts(), bindingOf(), connectWith(), data(), envelope(), finishVerifiedEffects(), JiraWorklogs, locks (+30 more)

### Community 24 - "deploy-plan.ts"
Cohesion: 0.20
Nodes (19): Body, DeploymentFenceState, fenceTokenDigest(), ControllerEffects, DEPLOY_PROJECT, operationPaths(), planDeployment(), createDeployToken() (+11 more)

### Community 25 - "candidate-child-context.ts"
Cohesion: 0.38
Nodes (8): adoptCandidate(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat()

### Community 26 - "agents.ts"
Cohesion: 0.05
Nodes (50): implementationWorkerContext(), RefusedQAResult, assertContinuableWorktree(), CONTINUABLE, continuationPrompt(), MAX_CONTINUATIONS, recordedContinuation(), StageContinuation (+42 more)

### Community 27 - "owner-merged-stopped.ts"
Cohesion: 0.17
Nodes (18): mergedByOwner(), closeableIssue(), effectsSettled(), eligible(), officePublished(), ownerMerged(), prerequisitesMet(), settle() (+10 more)

### Community 28 - "github-delivery.ts"
Cohesion: 0.04
Nodes (122): applyIntakeObservation(), containedFile(), writerRestartInstruction(), removeAdoptedClone(), findingsBlock(), namedRepairIds(), QA_STAGES, reviewAdvisoryIds() (+114 more)

### Community 29 - "index.tsx"
Cohesion: 0.04
Nodes (81): knowledgeOutbox(), ConversationDraft, DAYS, dueLessonDecisions(), easternWeek(), isLessonDecision(), LESSON_DIGEST, LessonDecision (+73 more)

### Community 30 - "digest"
Cohesion: 0.12
Nodes (49): admitPRMetadata(), evaluatePRMetadata(), MetadataHumanEdit, unbound(), assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema (+41 more)

### Community 31 - "command"
Cohesion: 0.08
Nodes (50): sourceVersions(), inHistoryOf(), CompareMemory, compareMemory(), COMPARES_PER_PASS, comparison(), DeployedFixes, DeployedFixesInput (+42 more)

### Community 32 - "index.ts"
Cohesion: 0.05
Nodes (62): implementationPreview(), implementationContinuationRoute(), qaPlanRetryRoute(), Link, linkFeature(), featureRoute(), incidentsRoute(), resumeSwitch() (+54 more)

### Community 33 - "remove-candidate.ts"
Cohesion: 0.13
Nodes (27): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), maintenanceCandidate(), moveAside(), moveBack(), purgeRemoved(), purging (+19 more)

### Community 34 - "call-scope.ts"
Cohesion: 0.15
Nodes (23): failed(), githubAuthError(), noCalls(), refusedByRateLimit(), revalidated, slurpedPages(), succeeded(), boundGitHubRunner() (+15 more)

### Community 35 - "common.cjs"
Cohesion: 0.16
Nodes (25): fromArgs(), connections(), fs, main(), path, atomicWrite(), crypto, digest() (+17 more)

### Community 36 - "scheduled-work.ts"
Cohesion: 0.09
Nodes (42): freshOwnershipRead(), dueSlackReread(), rereadUncertainSlack(), runningRevision(), deliverySlot(), verifiedCloseoutCleanupRequest(), withAmendmentOwnership(), metadataRequestResolved() (+34 more)

### Community 37 - "routing.cjs"
Cohesion: 0.11
Nodes (33): fs, main(), path, { spawnSync }, frontmatterProblems(), main(), parseArgs(), usage() (+25 more)

### Community 38 - "redact-evidence.ts"
Cohesion: 0.10
Nodes (19): AFTER_LABEL, ASSIGNMENT, AWS_KEY_ID, BARE_CREDENTIAL, BARE_UNIT, BARE_VALUE, CAMEL_START, CONTROL_ESCAPE (+11 more)

### Community 39 - "assignments.ts"
Cohesion: 0.11
Nodes (26): assignmentKnowledge(), clip(), DEMAND_LIMIT, demandFacts(), key(), LessonKey, notes(), AssignmentLookups (+18 more)

### Community 40 - "read-retries.ts"
Cohesion: 0.30
Nodes (10): ATTEMPT_DELAYS_MS, PrerequisitesSchema, classifyStop(), incompleteReadOutput(), planReadRetry(), readOnlyStageJob(), readRetryPending(), reconcileReadRetries() (+2 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.18
Nodes (22): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), midnight(), TicketDay (+14 more)

### Community 42 - "engine.ts"
Cohesion: 0.07
Nodes (14): AzureMonitor, checkMail(), drainMail(), requestMail(), enableNightly(), ingest(), GitHubMonitor, ResumeProject (+6 more)

### Community 43 - "jiraBinding"
Cohesion: 0.10
Nodes (57): enumerateIntakeList(), inPickupOrder(), Intake, text(), resolveBlockedTransition(), document(), transitionWithComment(), jiraAccount() (+49 more)

### Community 44 - "Offices"
Cohesion: 0.10
Nodes (7): CommittedBrain, file, project, root, projectById(), Offices, SessionBridge

### Community 45 - "harness-baseline.ts"
Cohesion: 0.15
Nodes (22): BaselineReport, baselineReport(), BaselineSource, baselineText(), millions(), row(), share(), add() (+14 more)

### Community 46 - "OfficeScene.tsx"
Cohesion: 0.17
Nodes (33): withoutElapsed(), Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk() (+25 more)

### Community 47 - "change-scope.ts"
Cohesion: 0.18
Nodes (20): applyChangeScope(), levels(), MAX_CHECKS, owedUnderScope(), scopeBase(), settled(), statedApproach(), verifiedCandidate() (+12 more)

### Community 48 - "cec.ts"
Cohesion: 0.08
Nodes (39): intakeMembership(), movedHeadNote(), cecPrompt(), resolvedDecisionNote(), stageInstructions, stageInstructionsFor(), REVIEW_FINDINGS_RULE, waitText() (+31 more)

### Community 49 - "pilot-delivery.ts"
Cohesion: 0.08
Nodes (53): candidateBranchMoved(), endChangeScope(), scopeOutgrown(), confirmsMovedHead(), Moved, movedHeadUnconfirmed(), recordConfirmedHead(), routeConfirmedHead() (+45 more)

### Community 50 - "QuestionStepper.tsx"
Cohesion: 0.19
Nodes (18): FeatureQuestionProjection, OutboxQuestionRound(), send(), draftKey(), readDraft(), saveDraft(), QuestionRound(), nextQuestion() (+10 more)

### Community 51 - "brain-maintenance.ts"
Cohesion: 0.19
Nodes (12): BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, brainResultStop(), GateMark, gateMark(), MAX_START_RETRIES, neverStarted() (+4 more)

### Community 52 - "ref_zod"
Cohesion: 0.06
Nodes (63): projectListScope(), AUTO_ADOPT_BOTS, IntakeView, assertFeaturePlanningConfig(), goalEvidencePath(), azureSchema, deploymentSchema, jiraSchema (+55 more)

### Community 53 - "state-parts.ts"
Cohesion: 0.08
Nodes (30): readSavedState(), LARGE_KEY_CHARS, plain(), RedactedEntries, RedactedEntry, redactEntries(), joinParts(), PartRow (+22 more)

### Community 54 - "JiraIssuePublisher"
Cohesion: 0.19
Nodes (5): contentSchema(), JiraIssuePublisher, descriptionPreimage(), plain(), publicationDescription()

### Community 55 - "ref_node_child_process"
Cohesion: 0.08
Nodes (27): changedPaths(), { execFileSync }, files, isMapInput(), mapOnly(), { execFileSync }, git(), publish() (+19 more)

### Community 56 - "features.ts"
Cohesion: 0.09
Nodes (41): commandFeature(), reviewQuestions(), FeaturePlanningBindings, assertQuestionVisibility(), applyHarnessAction(), HarnessActionInput, recoveryPreconditions(), recoveryTarget() (+33 more)

### Community 57 - "deploy.ts"
Cohesion: 0.08
Nodes (47): StoreDatabase, abandon(), advance(), DeployContext, DeployTimings, append(), assertNext(), DeployJournalView (+39 more)

### Community 58 - "shared.ts"
Cohesion: 0.06
Nodes (55): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+47 more)

### Community 59 - "jira-attempts.ts"
Cohesion: 0.11
Nodes (25): attempted(), attemptState(), bound(), covers(), JiraAttempt, jiraAttempts(), JiraAttemptState, open() (+17 more)

### Community 60 - "cost-ledger.ts"
Cohesion: 0.13
Nodes (31): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress(), effectId() (+23 more)

### Community 61 - "unsent-time.ts"
Cohesion: 0.20
Nodes (14): publishableEntry(), settlementPending(), superseded(), ticketUnresolved(), TimeLedger, readBackTime(), clearUnsent(), dueUnsent() (+6 more)

### Community 62 - "maintenance/maintenance.ts"
Cohesion: 0.10
Nodes (27): ApproachSchema, maintenancePolicies(), captureMaintenanceStep(), sourceReview(), candidateOwner(), SETTLED, skipOwnedCandidate(), Skipped (+19 more)

### Community 63 - "MapView.tsx"
Cohesion: 0.06
Nodes (64): KnowledgeActivity, KnowledgeEdge, KnowledgeMap, KnowledgeNode, ChatMarkdown(), ChatMarkdown, MessageText(), Activity() (+56 more)

### Community 64 - "judge-resumes.ts"
Cohesion: 0.06
Nodes (49): FLAGS, incidentCommand(), IncidentCommandIO, option(), USAGE, whole(), boundaryCrossed(), Crossing (+41 more)

### Community 65 - "validate_pr_body.cjs"
Cohesion: 0.36
Nodes (8): fs, main(), readableText(), REQUIRED_CHECKS, REQUIRED_SECTIONS, sections(), validatePullRequestBody(), withoutComments()

### Community 66 - "audit-plan-candidates.cjs"
Cohesion: 0.14
Nodes (31): audit(), branchIssueNumbers(), classify(), distinctiveTitleWords(), { execFileSync }, extractPaths(), findPrForMergeSubject(), fmtCommit() (+23 more)

### Community 67 - "goal-reviews.ts"
Cohesion: 0.12
Nodes (22): currentCitations(), Fact, NOT_CURRENT, PROVIDER_ERROR, applyGoalReview(), DailyResultSchema, DeliveryJob, EvidenceRefSchema (+14 more)

### Community 68 - "resume-arrivals.ts"
Cohesion: 0.12
Nodes (60): canonical(), assessResumes(), Standing, CheckpointEligibility, checkpointEligibility(), admitAssignmentResume(), forAssignment(), admitCheckpointResume() (+52 more)

### Community 69 - "ticket-evidence.ts"
Cohesion: 0.10
Nodes (35): Connection, twgConnection(), twgProfile(), assetDownloader(), attachmentKind(), evidenceDirectory(), storeEvidence(), blankEvidence() (+27 more)

### Community 70 - "constellation-runtime.ts"
Cohesion: 0.15
Nodes (16): CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point, focusOverlayMotion(), FocusOverlayLayout (+8 more)

### Community 71 - "cec-reads.ts"
Cohesion: 0.09
Nodes (35): intakeEnumeration(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), plainResume(), readbackDispatchGuidance(), capacityInterruptedRun(), providerSaid() (+27 more)

### Community 72 - "session-context-file.ts"
Cohesion: 0.19
Nodes (16): Bound, ContextFoldPrefix, contextFoldPrefix(), SessionContextCheckpoint, captureSessionContextClone(), ContextReadPhase, SessionContextDeadline, ContextProject (+8 more)

### Community 73 - "reader.ts"
Cohesion: 0.07
Nodes (41): knowledgeActivity(), knowledgeActivityPage(), committedNotePage(), BrainOverlap, brainOverlap(), clip(), fits(), withBrainOverlap() (+33 more)

### Community 74 - "session-scope.ts"
Cohesion: 0.20
Nodes (15): claudeScopeParser(), claudeSessionScope(), CODEX_ROLLOUTS, contextReaders(), retainSessionMessage(), SessionConversation, escaped(), jiraCommandIssues() (+7 more)

### Community 75 - "service-health.ts"
Cohesion: 0.10
Nodes (24): ClaudeLoginRefusal, claudeLoginRefusal(), claudeRefusalWords(), RECORDED_REFUSALS, refusedClaudeRow(), listenerHealth(), providers, ProviderStatusChecks (+16 more)

### Community 76 - "project-bindings.ts"
Cohesion: 0.09
Nodes (38): az(), buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs(), fullActivePRs(), observation() (+30 more)

### Community 77 - "it-report.ts"
Cohesion: 0.27
Nodes (10): followUpPicture(), publishITReport(), archiveOldReports(), RETAINED_REPORTS, archiveByMonth(), archiveHistory(), archiveMonth(), archiveOldTaskDetail() (+2 more)

### Community 78 - "incidents.ts"
Cohesion: 0.08
Nodes (52): attributedRecords(), foldsItsRun(), groupCandidates(), ObservedIncident, ObservedSubject, digest(), fingerprint(), incidentId() (+44 more)

### Community 79 - "fact-bounds.ts"
Cohesion: 0.18
Nodes (19): leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance() (+11 more)

### Community 80 - "session-bridge.ts"
Cohesion: 0.10
Nodes (29): codexDaemonProcesses(), accountCodexProcesses(), CodexProcessInventory, codexProcessInventory(), DesktopSessions, unaccountedProcesses(), codexThreadMetadata(), METADATA_CHUNK (+21 more)

### Community 81 - "Coordinator"
Cohesion: 0.08
Nodes (3): withGitHubSource(), coordination(), Coordinator

### Community 82 - "release-unpark.ts"
Cohesion: 0.33
Nodes (8): due(), MAX_RELEASE_UNPARKS, RELEASE_CHECK_MS, returnToPickup(), unparkReleasedWaits(), compare(), highestStableAtLeast(), parts()

### Community 83 - "diagnostic-snapshot.ts"
Cohesion: 0.21
Nodes (14): assignmentDiagnostics(), diagnosticContext(), diagnosticSnapshot(), itAgent(), itDiagnostics(), itFollowUpView(), sessionVisibilityCopy(), date() (+6 more)

### Community 84 - "viewer.js"
Cohesion: 0.19
Nodes (25): addMetaLink(), addMetaRow(), addRelationship(), applyView(), buildIndexes(), buildLegend(), buildModel(), buildRenderer() (+17 more)

### Community 85 - "continue-ownership-read.ts"
Cohesion: 0.23
Nodes (14): continueOwnershipRead(), expiredOwnershipRead(), handoffOwnership(), ReadbackOwnerDecision, ownershipReadGate(), ownershipReadState(), ownershipReadSource(), ReadOwnershipCandidate (+6 more)

### Community 86 - "stopped-record.ts"
Cohesion: 0.10
Nodes (43): WRITER_STAGES, boundedEvidence(), expectedWait(), StopFacts, normalizeCause(), IncidentCollector, improvements(), itInvestigations() (+35 more)

### Community 87 - "conversations/conversations.ts"
Cohesion: 0.08
Nodes (28): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+20 more)

### Community 88 - "QAResultsCard.tsx"
Cohesion: 0.40
Nodes (7): qaResultChanges(), QA_STAGES, qaResults(), qaStatus(), artifact(), QAResultsCard(), Report()

### Community 89 - "spawn-command.ts"
Cohesion: 0.12
Nodes (24): exitFailure(), inactivityWatch(), At, Errno, errno(), GroupInventory, GroupProbe, LifecycleDiagnostic (+16 more)

### Community 90 - "provider-observation.ts"
Cohesion: 0.13
Nodes (25): correlatedBuild(), Azure, azurePipelines(), outcome(), Read, RUNS_PER_PIPELINE, Api, githubWorkflows() (+17 more)

### Community 91 - "cec/issue-publication.ts"
Cohesion: 0.12
Nodes (26): CommentPage, commentReadback(), escaped(), IntakeBinding, intakeJql(), intakeLocation(), Assignment, jiraText() (+18 more)

### Community 92 - "session-context-client.ts"
Cohesion: 0.11
Nodes (18): claudeSessionContext(), readTranscript, codexSessionContext(), readRollout, packContextFailure(), PackedContextFailure, unpackContextFailure(), ContextThread (+10 more)

### Community 93 - "plans.cjs"
Cohesion: 0.19
Nodes (19): walk(), association(), auditedDigests(), candidate(), cleanCursor(), collapseByTitle(), discover(), fromMarkdown() (+11 more)

### Community 94 - "report.ts"
Cohesion: 0.29
Nodes (12): Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked(), row() (+4 more)

### Community 96 - "sign-in-unpark.ts"
Cohesion: 0.16
Nodes (22): currentEnvironmentWait(), environmentWait(), hasPendingDelivery(), resumeAfterSignIn(), signInWait(), isSetupStop(), MAX_SIGN_IN_UNPARKS, unparkSignedIn() (+14 more)

### Community 97 - ".activeClaims"
Cohesion: 0.07
Nodes (47): nextAttemptAt(), restartStoppedWriters(), unchangedSinceAccepted(), NOT_RETRYABLE, releaseFunds(), StoppedWriter, stoppedWriter(), WriterRestartCandidate (+39 more)

### Community 98 - "Ticket"
Cohesion: 0.19
Nodes (8): carriedNotRepeated(), changeScopeNote(), Scoped, JiraOperations, Carried, findingsOwedToRetest(), missingRetestDispositions(), Ticket

### Community 99 - "archive-plan.cjs"
Cohesion: 0.13
Nodes (29): fs, main(), parse(), path, archive(), cell(), ensureIndex(), fs (+21 more)

### Community 100 - "assignment-poll.ts"
Cohesion: 0.06
Nodes (48): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice() (+40 more)

### Community 101 - "http/commands.ts"
Cohesion: 0.08
Nodes (43): GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles(), ContinuationIO (+35 more)

### Community 102 - "coordination-tick.ts"
Cohesion: 0.15
Nodes (12): dependencyCompletionKey(), deliverySource(), BrainFollowup, Result, checkpointOutcome(), Outcome, reconcileContinuations(), pruneCompletedReads() (+4 more)

### Community 103 - "on-merge-sync.cjs"
Cohesion: 0.19
Nodes (22): fieldSpan(), keyPattern(), list(), parseListLiteral(), quote(), render(), scalar(), splitFrontmatter() (+14 more)

### Community 104 - "backup-stores.ts"
Cohesion: 0.10
Nodes (36): absentAdmission(), AdmissionComparison, AdmissionSnapshot, compareAdmissions(), snapshotAdmissions(), BackupEntry, BackupInput, BackupInventory (+28 more)

### Community 105 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 106 - "service-plist.ts"
Cohesion: 0.10
Nodes (38): runningRevision(), runningRevision(), releaseIdentity(), runtimeRevision(), ActiveRelease, readActiveRelease(), BUILD_ENV, buildRelease() (+30 more)

### Community 107 - "work.ts"
Cohesion: 0.08
Nodes (37): admitRepairWaits(), Covered, COVERING, expiryEvent(), expiryId(), lastProgress(), progressOf(), RepairWaitEntry (+29 more)

### Community 108 - "DeploymentFence"
Cohesion: 0.33
Nodes (4): assertToken(), DeploymentFence, DeploymentFenceGateContext, DeploymentFenceRouteContext

### Community 109 - "rate-limit-samples.ts"
Cohesion: 0.16
Nodes (12): bindGitHubRunner(), Runner, GitHubCalls, iso(), RateLimitSamples, Reading, reading(), readRateLimitHeaders() (+4 more)

### Community 110 - "blocker-followups.ts"
Cohesion: 0.11
Nodes (48): conversationReadbackReady(), followupOf(), pendingReadback(), queueConversationReadback(), readbackEnding(), uncertainConversations(), readBackConversations(), followupRecord() (+40 more)

### Community 111 - "dependencies.ts"
Cohesion: 0.17
Nodes (17): dependencyEligibility(), issueKey(), observePrerequisites(), PrerequisiteSchema, FailedMailCheck, lastFailedMailCheck(), lastMailCheckOutcome(), MailCheckOutcome (+9 more)

### Community 112 - "outbox.ts"
Cohesion: 0.10
Nodes (29): capabilityBlockedReviews(), latestReviews(), metadataParkAction(), ADOPTION_STALLED_MS, conversationResolved(), projectOutbox(), item(), syncOutbox() (+21 more)

### Community 113 - "checkpoint-completion.ts"
Cohesion: 0.18
Nodes (11): BrainStatusSchema, identity, brainCheckpointCompletion(), coverageSchema, verified, PublishedPR, publishedWorkCleanedUp(), nativeChecks (+3 more)

### Community 114 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 115 - "telemetry.ts"
Cohesion: 0.10
Nodes (22): CodexRollout, CacheWriteDuration, CODEX_ROWS, ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL, Rates (+14 more)

### Community 119 - "featureById"
Cohesion: 0.14
Nodes (13): featureById(), FeaturePublisher, PublicationReceipt, publishFeature(), reconcilePublication(), uncertainPublications(), reserveIdentity(), GitHubIssuePublisher (+5 more)

### Community 120 - "lesson-selection.ts"
Cohesion: 0.15
Nodes (16): INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), LessonSelection, MAINTENANCE, MAX_LESSONS (+8 more)

### Community 121 - ".emit"
Cohesion: 0.10
Nodes (32): awaitingJiraStatus(), awaitingProduction(), FOLLOW_DAYS, followed(), isFollowed(), Azure, AzureRead, containedIn() (+24 more)

### Community 122 - "resume-control.ts"
Cohesion: 0.29
Nodes (7): absent(), NEVER_ENABLED, ResumeControl, stated(), Stored, unreadable(), ResumeSwitch

### Community 123 - "createConstellation"
Cohesion: 0.18
Nodes (5): ConstellationRuntime, createConstellation(), enter(), finishTap(), move()

### Community 124 - "refresh-issue-state.cjs"
Cohesion: 0.20
Nodes (19): advanceFence(), closingIssues(), githubRefs(), key(), normalizeGithubQuery(), normalizeRepository(), parseGithubQuery(), ref() (+11 more)

### Community 125 - "knowledge.ts"
Cohesion: 0.04
Nodes (64): Accepted, normalizeStatement(), RETROSPECTIVE_HISTORY, Shared, curateLesson(), Curation, CurationAction, mergeEvidence() (+56 more)

### Community 126 - "ref_node_path"
Cohesion: 0.05
Nodes (103): interruptedImplementation(), continueUnsealedQA(), entry(), ownershipReadHistory(), recoverCTOInput(), pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), Candidate (+95 more)

### Community 127 - "cli.ts"
Cohesion: 0.20
Nodes (8): args, [cmd,...rawArgs], commands, key, projectIndex, LessonBrainAudit, lessonBrainAudit(), LessonBrainOverlap

### Community 128 - "node-visuals.ts"
Cohesion: 0.20
Nodes (14): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+6 more)

### Community 129 - "accessibility-sources.ts"
Cohesion: 0.24
Nodes (17): accessibilitySources(), actionable(), closingPull(), Finding, handoffIssue(), issueLines(), issueSource(), observation (+9 more)

### Community 130 - "pre-push-boundary.ts"
Cohesion: 0.24
Nodes (11): Event, exactCommand(), Invocation, localHookCommand(), one(), prePushRejection(), PushIdentity, retirementBoundary() (+3 more)

### Community 131 - "it-specialist.ts"
Cohesion: 0.13
Nodes (22): replacedReadback(), partialLocalCleanupKey(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), heldFor(), recoveryHeld() (+14 more)

### Community 132 - "run-accounting.ts"
Cohesion: 0.18
Nodes (15): codexPriceRef(), codexAccounting(), COMPLETION_MAX_BYTES, markCaptureStart(), merge(), readCompletion(), RECONCILE_GRACE_MS, reconcileUncapturedRuns() (+7 more)

### Community 133 - "owned-artifact.ts"
Cohesion: 0.22
Nodes (12): BoundedRead, done(), readBoundedNoFollow(), reasonOf(), CompletionReader, createdAt(), dayDirs(), header() (+4 more)

### Community 134 - "follow-up-alerts.ts"
Cohesion: 0.21
Nodes (13): checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), repeatedVendorReviewBlock(), stoppedInVendorReview(), leftToNextRun(), NEXT_RUN_DUE_MS, night() (+5 more)

### Community 135 - "controller-runtime.ts"
Cohesion: 0.10
Nodes (33): projectData(), controllerEffects(), alive(), ControllerMachine, option(), realMachine(), runController(), DEFAULT_TIMINGS (+25 more)

### Community 136 - "enrollment-gate.ts"
Cohesion: 0.13
Nodes (31): dispatchNightly(), eligibility(), Admission, admit(), admitReadyCards(), WAIT_STATUSES, compatible(), validatePrerequisites() (+23 more)

### Community 137 - "Effects"
Cohesion: 0.11
Nodes (24): settleDevUpdate(), settleDevUpdates(), closeoutRequestResolved(), GitHubOperations, assignedToJoe(), fileLessonIssue(), lessonIssueBody(), lessonIssueMarker() (+16 more)

### Community 138 - "ledger.ts"
Cohesion: 0.14
Nodes (23): ctoInputIdentityMatches(), ctoInputRecovered(), acceptedCompletionResolution(), investigationCandidates(), investigationId(), ctoReplacementResolution(), finishedSubjectResolution(), investigationFollowUps() (+15 more)

### Community 140 - "session-snapshot-cleanup.ts"
Cohesion: 0.40
Nodes (5): SNAPSHOT_PREFIX, removeStaleSessionSnapshots(), SNAPSHOT_SWEEP_MS, STALE_SNAPSHOT_MS, sweepStaleSessionSnapshots()

### Community 141 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 142 - "scheduler.ts"
Cohesion: 0.13
Nodes (16): OfficeCapacity, PROJECT_LOCAL, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch() (+8 more)

### Community 144 - "reconcile-merges.cjs"
Cohesion: 0.21
Nodes (15): remoteSlug(), collectPulls(), copyWikiForDryRun(), { execFileSync }, flattenPages(), fs, githubRequest(), isWikiBotPull() (+7 more)

### Community 145 - "preferences-store.ts"
Cohesion: 0.21
Nodes (8): PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, OFFICE_PREFERENCE_DEFAULTS, OfficePreferences, OfficePreferencesPatch

### Community 146 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (7): CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility, overlayEntranceDelays(), SceneOverlay()

### Community 147 - "metadata-park-words.ts"
Cohesion: 0.17
Nodes (18): devUpdate(), HEADLINE, parksInJira(), OUTCOME, qaComment(), remote(), STAGE, plainWords() (+10 more)

### Community 148 - "call-ledger.ts"
Cohesion: 0.25
Nodes (9): add(), addSource(), busiest(), CallLedger, Entry, sourceRows(), Sources, CallCounts (+1 more)

### Community 149 - "harnessEffect"
Cohesion: 0.12
Nodes (45): BLOCK, harnessBlockMove(), harnessParkedCard(), noted(), effectKey(), LaneOperation, laneWrite(), moveCardOnce() (+37 more)

### Community 150 - "repoRoot"
Cohesion: 0.13
Nodes (18): fs, main(), parse(), path, repoRoot(), substantive(), main(), path (+10 more)

### Community 151 - "LessonsPanel.tsx"
Cohesion: 0.13
Nodes (29): LessonDecisionAction, lessonDecisionState(), readLessonDecision(), OutboxLessonDecision(), act(), readStatus(), followUp(), BlockerFollowups() (+21 more)

### Community 152 - "coordination.ts"
Cohesion: 0.13
Nodes (21): IntakeContext, DependencyStores, completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), legacy (+13 more)

### Community 153 - "qa-plan-retry.ts"
Cohesion: 0.67
Nodes (3): QAPlanRetry, QAPlanRetryProof, QAPlanRetryRequest

### Community 154 - "inspect-closed-plan.ts"
Cohesion: 0.33
Nodes (7): closedReadonlyPlan(), Document, document(), entryExists(), inspectClosedQAPlan(), qaPlanEvidenceGap(), qaRunDirectory()

### Community 155 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 156 - "delivery-ownership.ts"
Cohesion: 0.33
Nodes (4): Ownership, ownershipContext, refreshDeliveryOwnership(), RefreshOwnership

### Community 157 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 158 - "continue-access-only-plan.ts"
Cohesion: 0.54
Nodes (6): Document, document(), isAccessOnlyPlan(), settledAccessOnlyState(), continueAccessOnlyPlan(), entryExists()

### Community 161 - "helper-usage.ts"
Cohesion: 0.36
Nodes (7): backfillClaudeCost(), codexHome(), HELPER_STDOUT_MAX_BYTES, helperAccounting(), claudeAccounting(), completionAccounting(), withReason()

### Community 162 - "run-usage.ts"
Cohesion: 0.38
Nodes (5): claudeCrashZero(), claudeUsage(), codexUsage(), count(), RunUsage

### Community 163 - "restoreInPlace"
Cohesion: 0.60
Nodes (5): identity(), Json, plain(), restorable(), restoreInPlace()

### Community 164 - "run-evidence.ts"
Cohesion: 0.47
Nodes (4): comparable(), EvidenceOutcome, recordRunEvidence(), RunAccounting

### Community 166 - "office-qa-handoff.ts"
Cohesion: 0.60
Nodes (4): OfficeQAHandoff, OfficeQAHandoffInput, OfficeQAHandoffRequest, QAOwnershipProof

## Knowledge Gaps
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `worker-runtime.ts`, `process.ts`, `weekly-rollup.ts`, `run.ts`, `GitHubDelivery`, `ref_node_crypto`, `admit-improvement.ts`, `advance-metadata-park.ts`, `scheduled-captures.ts`, `record-trigger.ts`, `closeout-recovery.ts`, `holdReason`, `dependency-bots/adopt.ts`, `retrospective-subject.ts`, `jira-time.ts`, `deploy-plan.ts`, `candidate-child-context.ts`, `agents.ts`, `owner-merged-stopped.ts`, `github-delivery.ts`, `index.tsx`, `digest`, `command`, `index.ts`, `remove-candidate.ts`, `scheduled-work.ts`, `assignments.ts`, `read-retries.ts`, `time-scope.ts`, `engine.ts`, `jiraBinding`, `Offices`, `cec.ts`, `pilot-delivery.ts`, `brain-maintenance.ts`, `state-parts.ts`, `JiraIssuePublisher`, `features.ts`, `shared.ts`, `jira-attempts.ts`, `cost-ledger.ts`, `unsent-time.ts`, `maintenance/maintenance.ts`, `judge-resumes.ts`, `goal-reviews.ts`, `resume-arrivals.ts`, `ticket-evidence.ts`, `cec-reads.ts`, `reader.ts`, `project-bindings.ts`, `fact-bounds.ts`, `session-bridge.ts`, `Coordinator`, `release-unpark.ts`, `diagnostic-snapshot.ts`, `continue-ownership-read.ts`, `conversations/conversations.ts`, `provider-observation.ts`, `cec/issue-publication.ts`, `sign-in-unpark.ts`, `.activeClaims`, `Ticket`, `assignment-poll.ts`, `http/commands.ts`, `coordination-tick.ts`, `work.ts`, `blocker-followups.ts`, `dependencies.ts`, `checkpoint-completion.ts`, `featureById`, `lesson-selection.ts`, `.emit`, `knowledge.ts`, `ref_node_path`, `accessibility-sources.ts`, `it-specialist.ts`, `run-accounting.ts`, `owned-artifact.ts`, `controller-runtime.ts`, `enrollment-gate.ts`, `Effects`, `ledger.ts`, `FeatureWorkflow`, `scheduler.ts`, `harnessEffect`, `coordination.ts`, `inspect-closed-plan.ts`, `continue-access-only-plan.ts`, `run-evidence.ts`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **Should `incidents/routes.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.061621621621621624 - nodes in this community are weakly interconnected._
- **Why does `command()` connect `command` to `incidents/routes.ts`, `accessibility-sources.ts`, `worker-runtime.ts`, `process.ts`, `weekly-rollup.ts`, `controller-runtime.ts`, `GitHubDelivery`, `Effects`, `enrollment-gate.ts`, `Store`, `ref_node_crypto`, `FeatureWorkflow`, `admit-improvement.ts`, `scheduler.ts`, `deploy-command.ts`, `closeout-recovery.ts`, `holdReason`, `harnessEffect`, `jira-time.ts`, `coordination.ts`, `agents.ts`, `inspect-closed-plan.ts`, `github-delivery.ts`, `command-registry.ts`, `continue-access-only-plan.ts`, `digest`, `remove-candidate.ts`, `call-scope.ts`, `engine.ts`, `jiraBinding`, `Offices`, `change-scope.ts`, `pilot-delivery.ts`, `brain-maintenance.ts`, `JiraIssuePublisher`, `deploy.ts`, `shared.ts`, `jira-attempts.ts`, `cost-ledger.ts`, `maintenance/maintenance.ts`, `ticket-evidence.ts`, `reader.ts`, `service-health.ts`, `project-bindings.ts`, `session-bridge.ts`, `Coordinator`, `continue-ownership-read.ts`, `provider-observation.ts`, `cec/issue-publication.ts`, `.activeClaims`, `Ticket`, `assignment-poll.ts`, `http/commands.ts`, `coordination-tick.ts`, `service-plist.ts`, `dependencies.ts`, `checkpoint-completion.ts`, `featureById`, `ref_node_path`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Should `OrgChart.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11933395004625347 - nodes in this community are weakly interconnected._
- **Why does `TicketJob` connect `github-delivery.ts` to `cx`, `follow-up-alerts.ts`, `GitHubDelivery`, `enrollment-gate.ts`, `Store`, `advance-metadata-park.ts`, `scheduler.ts`, `work-summary.ts`, `record-trigger.ts`, `closeout-recovery.ts`, `holdReason`, `harnessEffect`, `dependency-bots/adopt.ts`, `retrospective-subject.ts`, `candidate-child-context.ts`, `owner-merged-stopped.ts`, `digest`, `remove-candidate.ts`, `call-scope.ts`, `scheduled-work.ts`, `read-retries.ts`, `cec.ts`, `shared.ts`, `resume-arrivals.ts`, `fact-bounds.ts`, `release-unpark.ts`, `QAResultsCard.tsx`, `sign-in-unpark.ts`, `.activeClaims`, `assignment-poll.ts`, `dependencies.ts`, `outbox.ts`, `ref_node_path`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Should `worker-runtime.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06936026936026936 - nodes in this community are weakly interconnected._
- **Should `process.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07423423423423424 - nodes in this community are weakly interconnected._