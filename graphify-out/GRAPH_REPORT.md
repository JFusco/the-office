# Graph Report - the-office  (2026-11-22)

## Corpus Check
- 1103 files · ~443,506 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 5436 nodes · 24214 edges · 144 communities (136 shown, 8 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 799 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `efaf56a3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- incidents/routes.ts
- OrgChart.tsx
- GitHubDelivery
- features/workflow.ts
- SectionTitle
- ControlStore
- workKey
- Button
- http/commands.ts
- TelemetryPanel.tsx
- pilot-delivery.ts
- .emit
- App.tsx
- admit-improvement.ts
- assignments.ts
- scheduled-captures.ts
- OfficeSnapshot
- record-trigger.ts
- deploy-command.ts
- ref_node_path
- ref_node_path
- harnessEffect
- weekly-rollup.ts
- jira-time.ts
- deploy.ts
- maintenance/maintenance.ts
- worker-runtime.ts
- agents.ts
- shared.ts
- carried-checks.ts
- digest
- accept-stage-result.ts
- alert-issue.ts
- remove-candidate.ts
- ledger.ts
- jira-attempts.ts
- scheduled-work.ts
- project-bindings-config.ts
- enrollment-gate.ts
- run-retrospective.ts
- projectPolicy
- time-scope.ts
- Store
- run-accounting.ts
- process.ts
- harness-baseline.ts
- cx
- brain-maintenance.ts
- sanitize
- ticket-stage-runner.ts
- ref_node_crypto
- coordination-pump.ts
- projects.ts
- store.ts
- JiraIssuePublisher
- create-candidate.ts
- QuestionStepper.tsx
- controller-runtime.ts
- delivery-authority.ts
- retrospective-subject.ts
- cost-ledger.ts
- time-ledger.ts
- Coordinator
- daily-cto.ts
- incidents.ts
- validate_pr_body.cjs
- assignment-poll.ts
- telemetry.ts
- dispatch-resume.ts
- ticket-evidence.ts
- constellation-runtime.ts
- StageResult
- session-context-file.ts
- knowledge/routes.ts
- session-scope.ts
- it-specialist.ts
- project-bindings.ts
- diagnostic-snapshot.ts
- IncidentLedger
- cec.ts
- session-bridge.ts
- deployed-fixes.ts
- Offices
- dependency-bots/adopt.ts
- outbox.ts
- github-delivery.ts
- observation.ts
- conversations/conversations.ts
- index.tsx
- record-push.ts
- provider-observation.ts
- jiraBinding
- session-context-client.ts
- coordination.ts
- report.ts
- capture-session-clone.py
- mutedCopy
- retire-external-delivery.ts
- .save
- stopped-record.ts
- Effects
- continue-ownership-read.ts
- prompts/conversations.ts
- interrupted-work-recovery.ts
- snapshot-stores.ts
- extract-worker.mjs
- deploy-plan.ts
- work.ts
- Ticket
- release-unpark.ts
- blocker-followups.ts
- features/commands.ts
- goal-reporting.ts
- operationPaths
- slack-supersession.ts
- sign-in-unpark.ts
- qa.ts
- qa-plan-continuation.ts
- writer-restart.ts
- qa-plan-retry.ts
- knowledge.ts
- follow-production.ts
- session-coverage.ts
- admit-repair-waits.ts
- JiraWorklogTransport
- cli.ts
- Conversation.tsx
- release-identity.ts
- codex-rollout.ts
- install-service.mjs
- CommandRegistry
- fact-bounds.ts
- codex-rollout-file.ts
- read-retries.ts
- resume-control.ts
- checkpoint-completion.ts
- team-conversation-pump.ts
- run-usage.ts
- run-evidence.ts
- restoreInPlace
- session-snapshot-cleanup.ts
- evidenceText
- packed-consumer-pnpm.ts
- production.ts

## God Nodes (most connected - your core abstractions)
1. `Store` - 429 edges
2. `TicketJob` - 192 edges
3. `command()` - 157 edges
4. `digest()` - 151 edges
5. `holdReason()` - 139 edges
6. `GitHubDelivery` - 119 edges
7. `artifact()` - 114 edges
8. `StageResult` - 108 edges
9. `workKey()` - 102 edges
10. `OfficeSnapshot` - 100 edges

## Surprising Connections (you probably didn't know these)
- `DeliveryAuthorityInput` --references--> `HarnessRequest`  [EXTRACTED]
  server/delivery/harness/delivery-authority.ts → src/contracts/work.ts
- `DeliverySlot` --references--> `Role`  [EXTRACTED]
  server/office/projects.ts → src/shared.ts
- `UnrecordedResult` --references--> `StageResult`  [EXTRACTED]
  server/cec/unrecorded-result.ts → src/shared.ts
- `apply()` --indirect_call--> `note()`  [INFERRED]
  src/conversations/OutboxSavedImplementation.tsx → server/cec/parking/resume-parked.ts
- `projectOutbox()` --calls--> `deferredPickup()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/pickup-state.ts

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
- 2-file cycle: `src/contracts/work.ts -> src/shared.ts -> src/contracts/work.ts`
- 2-file cycle: `src/contracts/people.ts -> src/shared.ts -> src/contracts/people.ts`
- 2-file cycle: `src/contracts/timing.ts -> src/shared.ts -> src/contracts/timing.ts`
- 3-file cycle: `server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-guard.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/parking/resume-provider-review.ts -> server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/parking/resume-provider-review.ts`

## Communities (144 total, 8 thin omitted)

### Community 0 - "incidents/routes.ts"
Cohesion: 0.07
Nodes (56): citationFault(), CitationSchema, SourceVersions, sourceVersions(), dismiss(), DISMISSAL_CITATIONS, DISMISSAL_REASON, DismissalFacts (+48 more)

### Community 1 - "OrgChart.tsx"
Cohesion: 0.11
Nodes (40): label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+32 more)

### Community 2 - "GitHubDelivery"
Cohesion: 0.06
Nodes (62): writerRestartPending(), removeAdoptedClone(), namedRepairIds(), pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), GitHubDelivery, assertStoppedBaseAudit(), AuditRow (+54 more)

### Community 3 - "features/workflow.ts"
Cohesion: 0.07
Nodes (59): mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), artifactPath(), digest(), document(), featureRoot() (+51 more)

### Community 4 - "SectionTitle"
Cohesion: 0.10
Nodes (66): LessonDecisionAction, lessonDecisionState(), readLessonDecision(), Outbox(), OutboxLessonDecision(), readStatus(), blockedSummary(), ServiceHealthPanel() (+58 more)

### Community 5 - "ControlStore"
Cohesion: 0.18
Nodes (5): DailyCTO, Briefing, saveReviewBriefing(), ControlStore, DailyCTOReport

### Community 6 - "workKey"
Cohesion: 0.06
Nodes (68): deliveryIntakeBlocker(), boardPreflightCandidate(), savedActivationFailure(), Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), ownedArtifact() (+60 more)

### Community 7 - "Button"
Cohesion: 0.09
Nodes (41): guidanceExcerpt(), Activity(), ActivityTimeline(), AssignmentKnowledge(), Lookup(), BrainWorkspace(), DocumentMetadata, documentText() (+33 more)

### Community 8 - "http/commands.ts"
Cohesion: 0.08
Nodes (37): decideImplementation(), requestQAPlanRetry(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), clamp(), LIMITS (+29 more)

### Community 9 - "TelemetryPanel.tsx"
Cohesion: 0.10
Nodes (38): TelemetryReport, AzureBuild, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens(), usd() (+30 more)

### Community 10 - "pilot-delivery.ts"
Cohesion: 0.10
Nodes (28): candidateBranchMoved(), endChangeScope(), scopeOutgrown(), confirmsMovedHead(), Moved, movedHeadUnconfirmed(), recordConfirmedHead(), movedHeadNote() (+20 more)

### Community 11 - ".emit"
Cohesion: 0.07
Nodes (28): leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), seedOfficeLessons(), reconcileNativeDelivery(), DELIVERY_CONCURRENCY, OfficeCapacity (+20 more)

### Community 12 - "App.tsx"
Cohesion: 0.06
Nodes (50): BrainDrawer(), themeColor, App(), BrainWorkspace, CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants (+42 more)

### Community 13 - "admit-improvement.ts"
Cohesion: 0.14
Nodes (23): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementIntakeGate(), improvementManifest() (+15 more)

### Community 14 - "assignments.ts"
Cohesion: 0.09
Nodes (28): clip(), DEMAND_LIMIT, demandFacts(), DemandSection, key(), LessonKey, notes(), AssignmentLookups (+20 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.16
Nodes (41): assessmentSignal(), AssessmentSignals, failEvidenceCapture(), CaptureRequest, captureRequest(), captureRequests(), failCapture(), requestCapture() (+33 more)

### Community 16 - "OfficeSnapshot"
Cohesion: 0.12
Nodes (32): knowledgeOutbox(), DAYS, dueLessonDecisions(), easternWeek(), LESSON_DIGEST, LessonDecision, PARTS, pendingLessonDecisions() (+24 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.12
Nodes (35): baselined(), baselineLearning(), LEARNING_BASELINES, maintainLearning(), clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates() (+27 more)

### Community 18 - "deploy-command.ts"
Cohesion: 0.10
Nodes (43): CONTROLLER_ENTRY, ControllerPin, Pin, pinnedController(), readControllerPin(), writeControllerPin(), controllerOf(), deployCommand() (+35 more)

### Community 19 - "ref_node_path"
Cohesion: 0.05
Nodes (120): interruptedImplementation(), ownershipReadHistory(), ctoInputIdentityMatches(), ctoInputRecovered(), recoverCTOInput(), closeoutReceipt(), Candidate, recordedPush() (+112 more)

### Community 20 - "ref_node_path"
Cohesion: 0.07
Nodes (63): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+55 more)

### Community 21 - "harnessEffect"
Cohesion: 0.16
Nodes (36): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), ProjectCard, projectCards(), projectGraphql() (+28 more)

### Community 22 - "weekly-rollup.ts"
Cohesion: 0.14
Nodes (26): learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), RollupResult (+18 more)

### Community 23 - "jira-time.ts"
Cohesion: 0.10
Nodes (39): Connection, twgProfile(), unresolvedAttempts(), bindingOf(), connectWith(), data(), envelope(), finishVerifiedEffects() (+31 more)

### Community 24 - "deploy.ts"
Cohesion: 0.11
Nodes (40): abandon(), advance(), deploy(), DEPLOY_STEPS, DeployFacts, append(), assertNext(), deployJournalPath() (+32 more)

### Community 25 - "maintenance/maintenance.ts"
Cohesion: 0.11
Nodes (24): maintenancePolicies(), captureMaintenanceStep(), candidateOwner(), SETTLED, skipOwnedCandidate(), Skipped, skippedCandidateLedger(), CmsFollowUpContext (+16 more)

### Community 26 - "worker-runtime.ts"
Cohesion: 0.05
Nodes (54): candidateWorkspaceEnvironment(), assignmentSubject(), dispatchExposure(), prepareExposure(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT (+46 more)

### Community 27 - "agents.ts"
Cohesion: 0.05
Nodes (47): implementationWorkerContext(), intakeEnumeration(), cecIntakePrompt(), cecReconcilePrompt(), cecTransitionPrompt(), RefusedQAResult, savedStageCompletion(), assertContinuableWorktree() (+39 more)

### Community 28 - "shared.ts"
Cohesion: 0.03
Nodes (126): containedFile(), nextAttemptAt(), writerRestartInstruction(), restartStoppedWriters(), unchangedSinceAccepted(), NOT_RETRYABLE, WRITER_STAGES, WriterRestartCandidate (+118 more)

### Community 29 - "carried-checks.ts"
Cohesion: 0.16
Nodes (21): latestQA(), notPassedInLatestQA(), QACoverage, qaCoverage(), same(), Tested, safeWebUrl(), officeValidation() (+13 more)

### Community 30 - "digest"
Cohesion: 0.12
Nodes (47): admitPRMetadata(), METADATA_FINDING, assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema, savedMetadataAssessment(), validateSaved() (+39 more)

### Community 31 - "accept-stage-result.ts"
Cohesion: 0.12
Nodes (35): acceptStageResult(), assertDraftClaimHistory(), linkDraftIssue(), protectedOriginalClaim(), publicationReadArgs(), Read, readPublication(), mergeAuthorized() (+27 more)

### Community 32 - "alert-issue.ts"
Cohesion: 0.17
Nodes (25): Execute, adoptDependabot(), AlertIssue, alertIssueBody(), alertIssueTitle(), alertMarker(), closeAlertIssue(), ensureAlertIssue() (+17 more)

### Community 33 - "remove-candidate.ts"
Cohesion: 0.15
Nodes (21): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), maintenanceCandidate(), moveAside(), moveBack(), purgeRemoved(), purging (+13 more)

### Community 34 - "ledger.ts"
Cohesion: 0.10
Nodes (35): acceptedCompletionResolution(), INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationCandidates(), investigationId(), investigationEvidence(), finishedSubjectResolution(), investigationFollowUps() (+27 more)

### Community 35 - "jira-attempts.ts"
Cohesion: 0.10
Nodes (29): attempted(), attemptState(), bound(), covers(), JiraAttempt, jiraAttempts(), JiraAttemptState, open() (+21 more)

### Community 36 - "scheduled-work.ts"
Cohesion: 0.09
Nodes (38): freshOwnershipRead(), dueSlackReread(), rereadUncertainSlack(), runningRevision(), deliverySlot(), Ownership, ownershipContext, refreshDeliveryOwnership() (+30 more)

### Community 37 - "project-bindings-config.ts"
Cohesion: 0.12
Nodes (30): enumerateIntakeList(), inPickupOrder(), Intake, text(), document(), transitionWithComment(), jiraAccount(), JiraCredential (+22 more)

### Community 38 - "enrollment-gate.ts"
Cohesion: 0.15
Nodes (35): dispatchNightly(), drainDelivery(), requestDelivery(), startPilot(), eligibility(), Admission, WAIT_STATUSES, approvedDelivery() (+27 more)

### Community 39 - "run-retrospective.ts"
Cohesion: 0.10
Nodes (40): acceptRetrospective(), BLOCKING, BlockingTrigger, blockingTrigger(), isBlocking(), BrainOverlap, brainOverlap(), brainOverlapQuery() (+32 more)

### Community 40 - "projectPolicy"
Cohesion: 0.22
Nodes (13): checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), repeatedVendorReviewBlock(), stoppedInVendorReview(), leftToNextRun(), NEXT_RUN_DUE_MS, night() (+5 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.19
Nodes (21): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), midnight(), TicketDay (+13 more)

### Community 42 - "Store"
Cohesion: 0.04
Nodes (35): Assignment, jiraText(), Transition, descriptionPreimage(), plain(), Execute, SalvageRetry, salvageWorktree() (+27 more)

### Community 43 - "run-accounting.ts"
Cohesion: 0.23
Nodes (12): BoundedRead, readOwnedSessionArtifact(), reasonOf(), CompletionReader, COMPLETION_MAX_BYTES, readCompletion(), reconcileUncapturedRuns(), reconciling (+4 more)

### Community 44 - "process.ts"
Cohesion: 0.12
Nodes (32): featureItemComplete(), reconcileFeatureCompletion(), discoveryPrompt(), planPrompt(), helperTelemetry(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS (+24 more)

### Community 45 - "harness-baseline.ts"
Cohesion: 0.15
Nodes (22): BaselineReport, baselineReport(), BaselineSource, baselineText(), millions(), row(), share(), add() (+14 more)

### Community 46 - "cx"
Cohesion: 0.08
Nodes (61): displayAgentTask(), withoutElapsed(), CameraBookmark, restoreBookmark(), LiveAgentTask(), Props, RunningTask(), text() (+53 more)

### Community 47 - "brain-maintenance.ts"
Cohesion: 0.19
Nodes (12): BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, brainResultStop(), GateMark, gateMark(), MAX_START_RETRIES, neverStarted() (+4 more)

### Community 48 - "sanitize"
Cohesion: 0.04
Nodes (65): implementationPreview(), implementationContinuationRoute(), qaPlanRetryRoute(), assertQuestionVisibility(), resumeSwitch(), close(), config, itSpecialist (+57 more)

### Community 49 - "ticket-stage-runner.ts"
Cohesion: 0.08
Nodes (54): applyChangeScope(), levels(), MAX_CHECKS, owedUnderScope(), scopeBase(), settled(), statedApproach(), verifiedCandidate() (+46 more)

### Community 50 - "ref_node_crypto"
Cohesion: 0.07
Nodes (40): GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles(), ContinuationIO (+32 more)

### Community 51 - "coordination-pump.ts"
Cohesion: 0.16
Nodes (19): MergeNotifications, reconcileNoticeConfirmations(), ATTEMPT_DELAYS_MS, admit(), compatible(), dependencyCompletionKey(), dependencyEligibility(), issueKey() (+11 more)

### Community 52 - "projects.ts"
Cohesion: 0.06
Nodes (58): escaped(), IntakeBinding, intakeJql(), intakeLocation(), projectListScope(), AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), FeaturePlanningBindings (+50 more)

### Community 53 - "store.ts"
Cohesion: 0.07
Nodes (33): Clock, ProjectPolicy, checkpointLabel(), applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, readSavedState() (+25 more)

### Community 54 - "JiraIssuePublisher"
Cohesion: 0.12
Nodes (9): contentSchema(), JiraIssuePublisher, publicationDescription(), PublicationReceipt, GitHubIssuePublisher, number(), same(), FeatureManifestItem (+1 more)

### Community 55 - "create-candidate.ts"
Cohesion: 0.31
Nodes (9): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+1 more)

### Community 56 - "QuestionStepper.tsx"
Cohesion: 0.12
Nodes (28): FeatureHarnessOption, FeatureOption, FeatureQuestion, FeatureQuestionProjection, FeatureRound, FeatureRoundAuthor, OutboxQuestionRound(), send() (+20 more)

### Community 57 - "controller-runtime.ts"
Cohesion: 0.10
Nodes (28): projectData(), StoreDatabase, ControllerEffects, controllerEffects(), DEPLOY_PROJECT, alive(), ControllerMachine, option() (+20 more)

### Community 58 - "delivery-authority.ts"
Cohesion: 0.22
Nodes (13): writerRestarted(), deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, requireDeliveryAuthority(), gateRegisteredDelivery(), accounting (+5 more)

### Community 59 - "retrospective-subject.ts"
Cohesion: 0.20
Nodes (14): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+6 more)

### Community 60 - "cost-ledger.ts"
Cohesion: 0.13
Nodes (32): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress(), effectId() (+24 more)

### Community 61 - "time-ledger.ts"
Cohesion: 0.20
Nodes (14): publishableEntry(), settlementPending(), superseded(), ticketUnresolved(), syncing, TimeLedger, clearUnsent(), dueUnsent() (+6 more)

### Community 62 - "Coordinator"
Cohesion: 0.07
Nodes (4): SettleInputs, coordination(), Coordinator, AssignedIssue

### Community 63 - "daily-cto.ts"
Cohesion: 0.10
Nodes (22): EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), queueGoalEvidenceRequest(), applyGoalReview(), DailyResultSchema, DeliveryJob, EvidenceRefSchema (+14 more)

### Community 64 - "incidents.ts"
Cohesion: 0.08
Nodes (36): ObservedIncident, ObservedSubject, digest(), fingerprint(), FLAGS, incidentCommand(), IncidentCommandIO, option() (+28 more)

### Community 65 - "validate_pr_body.cjs"
Cohesion: 0.36
Nodes (8): fs, main(), readableText(), REQUIRED_CHECKS, REQUIRED_SECTIONS, sections(), validatePullRequestBody(), withoutComments()

### Community 66 - "assignment-poll.ts"
Cohesion: 0.11
Nodes (23): twgConnection(), BLOCK, harnessBlockMove(), harnessParkedCard(), noted(), admitReadyCards(), confirmedGone(), goneQuery() (+15 more)

### Community 67 - "telemetry.ts"
Cohesion: 0.11
Nodes (23): CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL, Rates (+15 more)

### Community 68 - "dispatch-resume.ts"
Cohesion: 0.10
Nodes (33): eventId(), admitResume(), PENDING, Refusal, ResumeAdmission, ResumeIntent, Undone, judgeResumes() (+25 more)

### Community 69 - "ticket-evidence.ts"
Cohesion: 0.11
Nodes (31): assetDownloader(), attachmentKind(), evidenceDirectory(), readEvidence(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS (+23 more)

### Community 70 - "constellation-runtime.ts"
Cohesion: 0.06
Nodes (52): KnowledgeActivity, KnowledgeEdge, KnowledgeMap, KnowledgeNode, ATMOSPHERE, mapAtmosphere(), Particle, system() (+44 more)

### Community 71 - "StageResult"
Cohesion: 0.09
Nodes (32): cecReadbackPrompt(), plainResume(), readbackDispatchGuidance(), capacityInterruptedRun(), providerSaid(), rerunsInterruptedQA(), officeRefusedQA(), QA_STAGES (+24 more)

### Community 72 - "session-context-file.ts"
Cohesion: 0.17
Nodes (17): Bound, packContextFailure(), PackedContextFailure, unpackContextFailure(), ContextFoldPrefix, contextFoldPrefix(), SessionContextCheckpoint, captureSessionContextClone() (+9 more)

### Community 73 - "knowledge/routes.ts"
Cohesion: 0.08
Nodes (33): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, CommittedBrain (+25 more)

### Community 74 - "session-scope.ts"
Cohesion: 0.21
Nodes (15): claudeScopeParser(), claudeSessionScope(), CODEX_ROLLOUTS, contextReaders(), retainSessionMessage(), SessionConversation, escaped(), jiraCommandIssues() (+7 more)

### Community 75 - "it-specialist.ts"
Cohesion: 0.08
Nodes (33): savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), heldFor(), ITContext, recoveryHeld(), recoveryWait() (+25 more)

### Community 76 - "project-bindings.ts"
Cohesion: 0.11
Nodes (33): AzureMonitor, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs(), fullActivePRs(), observation() (+25 more)

### Community 77 - "diagnostic-snapshot.ts"
Cohesion: 0.18
Nodes (15): diagnosticSnapshot(), publishITReport(), archiveOldReports(), RETAINED_REPORTS, archiveByMonth(), archiveHistory(), archiveMonth(), archiveOldTaskDetail() (+7 more)

### Community 78 - "IncidentLedger"
Cohesion: 0.13
Nodes (21): attributedRecords(), groupCandidates(), canonical(), incidentId(), absent(), IncidentChange, IncidentLedger, isOpen() (+13 more)

### Community 79 - "cec.ts"
Cohesion: 0.11
Nodes (27): intakeMembership(), cecPrompt(), resolvedDecisionNote(), stageInstructions, stageInstructionsFor(), REVIEW_FINDINGS_RULE, currentEnvironmentWait(), environmentWait() (+19 more)

### Community 80 - "session-bridge.ts"
Cohesion: 0.13
Nodes (22): codexDaemonProcesses(), accountCodexProcesses(), CodexProcessInventory, codexProcessInventory(), DesktopSessions, unaccountedProcesses(), codexThreadMetadata(), METADATA_CHUNK (+14 more)

### Community 81 - "deployed-fixes.ts"
Cohesion: 0.13
Nodes (28): inHistoryOf(), CompareMemory, compareMemory(), COMPARES_PER_PASS, comparison(), DeployedFixes, DeployedFixesInput, recordDeployedFixes() (+20 more)

### Community 82 - "Offices"
Cohesion: 0.10
Nodes (7): QuestionNotifications, file, project, root, InFlightOperations, projectById(), Offices

### Community 83 - "dependency-bots/adopt.ts"
Cohesion: 0.10
Nodes (37): readBackOrThrow(), retryRead(), closesIssue(), linkedBody(), linkPR(), DependabotPR, dependabotPR(), ensureTrackingIssue() (+29 more)

### Community 84 - "outbox.ts"
Cohesion: 0.13
Nodes (21): currentOutbox(), ADOPTION_STALLED_MS, conversationResolved(), projectOutbox(), syncOutbox(), projectSlackDeliveries(), settleRequestedSlackReplacement(), settledSlackReadback() (+13 more)

### Community 85 - "github-delivery.ts"
Cohesion: 0.07
Nodes (73): queueMergeNotice(), observeGitHubMergeNotices(), resumeProviderReviews(), dispatchLeadAssessment(), observe(), approveMerge(), assertAutomationEffects(), automationMergePolicy() (+65 more)

### Community 86 - "observation.ts"
Cohesion: 0.22
Nodes (18): boundedEvidence(), normalizeCause(), IncidentCollector, COLLECTORS, SOURCE_OF, improvements(), itInvestigations(), itRecoveries() (+10 more)

### Community 87 - "conversations/conversations.ts"
Cohesion: 0.11
Nodes (17): ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff(), saveGoals() (+9 more)

### Community 88 - "index.tsx"
Cohesion: 0.05
Nodes (66): SendMessage, ctoInputFailure(), OutboxCTOInput(), recover(), OutboxMaintenanceStatus(), OutboxSavedImplementation(), apply(), review() (+58 more)

### Community 89 - "record-push.ts"
Cohesion: 0.16
Nodes (17): Event, one(), prePushRejection(), PushIdentity, settledPushBoundary(), At, Errno, errno() (+9 more)

### Community 90 - "provider-observation.ts"
Cohesion: 0.11
Nodes (30): az(), correlatedBuild(), nativeRead(), Azure, azurePipelines(), outcome(), Read, RUNS_PER_PIPELINE (+22 more)

### Community 91 - "jiraBinding"
Cohesion: 0.12
Nodes (31): CommentPage, commentReadback(), devUpdate(), HEADLINE, jiraRecord(), unpack(), postDevUpdate(), OUTCOME (+23 more)

### Community 92 - "session-context-client.ts"
Cohesion: 0.12
Nodes (18): claudeSessionContext(), readTranscript, codexSessionContext(), readRollout, LiveSession, ContextThread, contextThread(), postedProjects() (+10 more)

### Community 93 - "coordination.ts"
Cohesion: 0.12
Nodes (22): IntakeContext, DependencyStores, completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), legacy (+14 more)

### Community 94 - "report.ts"
Cohesion: 0.29
Nodes (12): Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked(), row() (+4 more)

### Community 96 - "mutedCopy"
Cohesion: 0.12
Nodes (40): act(), SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState (+32 more)

### Community 97 - "retire-external-delivery.ts"
Cohesion: 0.38
Nodes (8): completedPRReview(), completedPRReviews(), eligible(), mergedByOwner(), ownerMergedWorkFinished(), ownerSettles(), retireExternalDeliveries(), settledExternalRepair()

### Community 98 - ".save"
Cohesion: 0.14
Nodes (32): resolveBlockedTransition(), jiraCollection(), findComment(), LiveIssue, readIssue(), readIssues(), jira(), commentDecision() (+24 more)

### Community 99 - "stopped-record.ts"
Cohesion: 0.15
Nodes (24): StopFacts, failed(), handedBack(), includes(), INTERRUPTED_RECEIPT, issue(), jobWriteUnconfirmed(), lastRun() (+16 more)

### Community 100 - "Effects"
Cohesion: 0.09
Nodes (23): channelNoticeAuthorized(), SlackMessages, settleNotLanded(), publishFeature(), reconcilePublication(), uncertainPublications(), GitHubOperations, assignedToJoe() (+15 more)

### Community 101 - "continue-ownership-read.ts"
Cohesion: 0.18
Nodes (17): continueOwnershipRead(), expiredOwnershipRead(), handoffOwnership(), ReadbackOwnerDecision, ownershipReadGate(), ownershipReadState(), ownershipReadSource(), ReadOwnershipCandidate (+9 more)

### Community 102 - "prompts/conversations.ts"
Cohesion: 0.12
Nodes (18): ownReceipts(), Receipt, Settled, SETTLED_RECEIPT_NOTE, supersededReceipt(), ticketForWorker(), cecChatPrompt(), ctoChatPrompt() (+10 more)

### Community 103 - "interrupted-work-recovery.ts"
Cohesion: 0.36
Nodes (7): interruptAdoptions(), legacy(), REMOVED_FIELDS, retireLegacyRecovery(), goalNoticeNeverDispatched(), maintenanceNoticeNeverDispatched(), recover()

### Community 104 - "snapshot-stores.ts"
Cohesion: 0.15
Nodes (22): AdmissionComparison, AdmissionSnapshot, compareAdmissions(), snapshotAdmissions(), APPENDED_TABLE, comparableOrder(), comparableRow(), START_EVENT_KINDS (+14 more)

### Community 105 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 106 - "deploy-plan.ts"
Cohesion: 0.11
Nodes (36): runningRevision(), runningRevision(), DATA, runtimeRevision(), BUILD_ENV, buildRelease(), BuildReleaseOptions, Execute (+28 more)

### Community 107 - "work.ts"
Cohesion: 0.13
Nodes (19): effectiveCause(), REPLACED, BLOCKED_CAUSES, NONE, ProjectReadiness, AssignmentResult, BlockedCause, CompletionCondition (+11 more)

### Community 108 - "Ticket"
Cohesion: 0.11
Nodes (17): carriedNotRepeated(), changeScopeNote(), Scoped, JiraOperations, checkMail(), drainMail(), requestMail(), enableNightly() (+9 more)

### Community 109 - "release-unpark.ts"
Cohesion: 0.33
Nodes (8): due(), MAX_RELEASE_UNPARKS, RELEASE_CHECK_MS, returnToPickup(), unparkReleasedWaits(), compare(), highestStableAtLeast(), parts()

### Community 110 - "blocker-followups.ts"
Cohesion: 0.12
Nodes (32): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), expectedWait(), ProjectObservation, LANES, observeProjects(), OfficeObservation (+24 more)

### Community 111 - "features/commands.ts"
Cohesion: 0.28
Nodes (16): commandFeature(), createFeature(), reviewQuestions(), assertEnrollable(), applyHarnessAction(), HarnessActionInput, recoveryPreconditions(), recoveryTarget() (+8 more)

### Community 112 - "goal-reporting.ts"
Cohesion: 0.15
Nodes (15): GitHubMonitor, githubPRDescription(), azureGoalFacts(), azurePRDescription(), boundedEvidence(), collectAzureGoalDocuments(), EvidenceStore, GOAL_EVIDENCE_LIMITS (+7 more)

### Community 113 - "operationPaths"
Cohesion: 0.21
Nodes (12): assertToken(), Body, DeploymentFence, DeploymentFenceState, fenceTokenDigest(), operationPaths(), createDeployToken(), readDeployToken() (+4 more)

### Community 114 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 115 - "sign-in-unpark.ts"
Cohesion: 0.19
Nodes (17): resumeAfterSignIn(), MAX_SIGN_IN_UNPARKS, unparkSignedIn(), waitingStep(), BrowserPage, browserPages(), ReadPages, SignInState (+9 more)

### Community 119 - "qa-plan-retry.ts"
Cohesion: 0.67
Nodes (3): QAPlanRetry, QAPlanRetryProof, QAPlanRetryRequest

### Community 120 - "knowledge.ts"
Cohesion: 0.08
Nodes (31): Accepted, RETROSPECTIVE_HISTORY, Shared, curateLesson(), Curation, CurationAction, mergeEvidence(), BRAIN_SCOPE (+23 more)

### Community 121 - "follow-production.ts"
Cohesion: 0.21
Nodes (16): awaitingJiraStatus(), awaitingProduction(), FOLLOW_DAYS, followed(), Azure, AzureRead, containedIn(), followProduction() (+8 more)

### Community 122 - "session-coverage.ts"
Cohesion: 0.36
Nodes (7): claudeSessions(), completeSessionCoverage(), desktopCoverageGap(), knownActivity(), Report, unexplained(), sessionInventoryFailureDetail()

### Community 123 - "admit-repair-waits.ts"
Cohesion: 0.20
Nodes (18): admitRepairWaits(), COVERING, expiryEvent(), expiryId(), lastProgress(), progressOf(), RepairWaitPass, REPAIR_WAIT_MS (+10 more)

### Community 125 - "cli.ts"
Cohesion: 0.09
Nodes (21): args, [cmd,...rawArgs], commands, key, projectIndex, LessonBrainAudit, lessonBrainAudit(), LessonBrainOverlap (+13 more)

### Community 126 - "Conversation.tsx"
Cohesion: 0.22
Nodes (13): ChatMarkdown(), Conversation(), isLessonDecision(), ChatMarkdown, MessageText(), blocker(), recommendedReply(), slackMessageStatus() (+5 more)

### Community 127 - "release-identity.ts"
Cohesion: 0.23
Nodes (13): releaseIdentity(), ActiveRelease, readActiveRelease(), BackupEntry, BackupInput, BackupInventory, backupStores(), INVENTORY_FILE (+5 more)

### Community 128 - "codex-rollout.ts"
Cohesion: 0.27
Nodes (10): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO (+2 more)

### Community 129 - "install-service.mjs"
Cohesion: 0.18
Nodes (5): file, folder, logs, root, Read

### Community 131 - "fact-bounds.ts"
Cohesion: 0.25
Nodes (15): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+7 more)

### Community 132 - "codex-rollout-file.ts"
Cohesion: 0.19
Nodes (15): done(), readBoundedNoFollow(), codexHome(), createdAt(), dayDirs(), header(), readCodexRollout(), ROLLOUT_MAX_BYTES (+7 more)

### Community 133 - "read-retries.ts"
Cohesion: 0.29
Nodes (11): PrerequisitesSchema, SourceClosed, classifyStop(), stopReason(), incompleteReadOutput(), planReadRetry(), readOnlyStageJob(), readRetryPending() (+3 more)

### Community 134 - "resume-control.ts"
Cohesion: 0.29
Nodes (7): absent(), NEVER_ENABLED, ResumeControl, stated(), Stored, unreadable(), ResumeSwitch

### Community 135 - "checkpoint-completion.ts"
Cohesion: 0.25
Nodes (8): BrainStatusSchema, brainCheckpointCompletion(), coverageSchema, verified, publishedWorkCleanedUp(), nativeChecks, reconcileCompletedCheckpoints(), settledRun()

### Community 136 - "team-conversation-pump.ts"
Cohesion: 0.42
Nodes (8): assertConversationReadback(), finishSupersededReadback(), pump(), savePickup(), harperHandoff(), acceptedGoalReport(), permitsGoalEvidenceReturn(), queueCompletedGoalEvidenceReport()

### Community 137 - "run-usage.ts"
Cohesion: 0.32
Nodes (6): CodexRollout, claudeCrashZero(), claudeUsage(), codexUsage(), count(), RunUsage

### Community 138 - "run-evidence.ts"
Cohesion: 0.38
Nodes (5): comparable(), EvidenceOutcome, recordRunEvidence(), backfillClaudeCost(), RunAccounting

### Community 139 - "restoreInPlace"
Cohesion: 0.60
Nodes (5): identity(), Json, plain(), restorable(), restoreInPlace()

### Community 140 - "session-snapshot-cleanup.ts"
Cohesion: 0.40
Nodes (5): SNAPSHOT_PREFIX, removeStaleSessionSnapshots(), SNAPSHOT_SWEEP_MS, STALE_SNAPSHOT_MS, sweepStaleSessionSnapshots()

### Community 141 - "evidenceText"
Cohesion: 0.80
Nodes (4): evidenceText(), field(), jsonString(), opening()

## Knowledge Gaps
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `GitHubDelivery`, `features/workflow.ts`, `workKey`, `http/commands.ts`, `pilot-delivery.ts`, `.emit`, `admit-improvement.ts`, `assignments.ts`, `scheduled-captures.ts`, `OfficeSnapshot`, `record-trigger.ts`, `ref_node_path`, `ref_node_path`, `harnessEffect`, `weekly-rollup.ts`, `jira-time.ts`, `maintenance/maintenance.ts`, `worker-runtime.ts`, `agents.ts`, `shared.ts`, `digest`, `accept-stage-result.ts`, `alert-issue.ts`, `remove-candidate.ts`, `ledger.ts`, `jira-attempts.ts`, `scheduled-work.ts`, `project-bindings-config.ts`, `enrollment-gate.ts`, `run-retrospective.ts`, `time-scope.ts`, `run-accounting.ts`, `process.ts`, `brain-maintenance.ts`, `sanitize`, `ticket-stage-runner.ts`, `ref_node_crypto`, `coordination-pump.ts`, `store.ts`, `create-candidate.ts`, `controller-runtime.ts`, `delivery-authority.ts`, `retrospective-subject.ts`, `cost-ledger.ts`, `time-ledger.ts`, `Coordinator`, `daily-cto.ts`, `assignment-poll.ts`, `dispatch-resume.ts`, `ticket-evidence.ts`, `StageResult`, `knowledge/routes.ts`, `it-specialist.ts`, `project-bindings.ts`, `diagnostic-snapshot.ts`, `IncidentLedger`, `cec.ts`, `session-bridge.ts`, `Offices`, `dependency-bots/adopt.ts`, `outbox.ts`, `github-delivery.ts`, `conversations/conversations.ts`, `provider-observation.ts`, `jiraBinding`, `coordination.ts`, `retire-external-delivery.ts`, `.save`, `Effects`, `continue-ownership-read.ts`, `prompts/conversations.ts`, `interrupted-work-recovery.ts`, `Ticket`, `release-unpark.ts`, `blocker-followups.ts`, `features/commands.ts`, `goal-reporting.ts`, `sign-in-unpark.ts`, `knowledge.ts`, `follow-production.ts`, `admit-repair-waits.ts`, `read-retries.ts`, `checkpoint-completion.ts`, `team-conversation-pump.ts`, `run-evidence.ts`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `command()` (e.g. with `startServiceTicks()` and `realMachine()`) actually correct?**
  _`command()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Should `incidents/routes.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07111501316944688 - nodes in this community are weakly interconnected._
- **Why does `command()` connect `Store` to `incidents/routes.ts`, `GitHubDelivery`, `features/workflow.ts`, `CommandRegistry`, `workKey`, `checkpoint-completion.ts`, `http/commands.ts`, `pilot-delivery.ts`, `admit-improvement.ts`, `deploy-command.ts`, `ref_node_path`, `ref_node_path`, `harnessEffect`, `weekly-rollup.ts`, `jira-time.ts`, `maintenance/maintenance.ts`, `worker-runtime.ts`, `agents.ts`, `shared.ts`, `digest`, `accept-stage-result.ts`, `remove-candidate.ts`, `jira-attempts.ts`, `project-bindings-config.ts`, `process.ts`, `brain-maintenance.ts`, `ticket-stage-runner.ts`, `ref_node_crypto`, `coordination-pump.ts`, `create-candidate.ts`, `controller-runtime.ts`, `cost-ledger.ts`, `time-ledger.ts`, `Coordinator`, `ticket-evidence.ts`, `knowledge/routes.ts`, `it-specialist.ts`, `project-bindings.ts`, `session-bridge.ts`, `deployed-fixes.ts`, `dependency-bots/adopt.ts`, `github-delivery.ts`, `record-push.ts`, `provider-observation.ts`, `jiraBinding`, `coordination.ts`, `.save`, `Effects`, `continue-ownership-read.ts`, `deploy-plan.ts`, `Ticket`, `goal-reporting.ts`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Should `OrgChart.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11139455782312925 - nodes in this community are weakly interconnected._
- **Why does `Role` connect `OrgChart.tsx` to `SectionTitle`, `http/commands.ts`, `.emit`, `App.tsx`, `maintenance/maintenance.ts`, `worker-runtime.ts`, `agents.ts`, `shared.ts`, `accept-stage-result.ts`, `run-accounting.ts`, `cx`, `ticket-stage-runner.ts`, `projects.ts`, `store.ts`, `retrospective-subject.ts`, `StageResult`, `cec.ts`, `outbox.ts`, `github-delivery.ts`, `conversations/conversations.ts`, `index.tsx`, `prompts/conversations.ts`, `work.ts`, `Conversation.tsx`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Should `GitHubDelivery` be split into smaller, more focused modules?**
  _Cohesion score 0.05891016200294551 - nodes in this community are weakly interconnected._