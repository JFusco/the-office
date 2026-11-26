# Graph Report - the-office  (2026-11-26)

## Corpus Check
- 1334 files · ~594,460 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 7315 nodes · 31478 edges · 179 communities (171 shown, 8 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 1079 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b7e0d54c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- incidents/routes.ts
- OrgChart.tsx
- worker-runtime.ts
- features/workflow.ts
- cx
- github-check-selection.ts
- budget-ledger.ts
- index.tsx
- OfficeSnapshot
- TelemetryPanel.tsx
- features/commands.ts
- overseer/commands.ts
- App.tsx
- admit-improvement.ts
- request.ts
- scheduled-captures.ts
- run-retrospective.ts
- record-trigger.ts
- process-group.mjs
- redactEvidence
- activation-recovery.ts
- overseer-launch.mjs
- setup-stop-cap.ts
- jira-time.ts
- work.ts
- outbox.ts
- controller-runtime.ts
- offices.ts
- assertDeliveryMayMutate
- interrupted-work-recovery.ts
- GitHubDelivery
- artifact
- .transaction
- evidence.ts
- cec-reads.ts
- wiki-graph.cjs
- scheduled-work.ts
- routing.cjs
- github-delivery.ts
- knowledge.ts
- requests.ts
- time-scope.ts
- knowledge/routes.ts
- project-bindings-config.ts
- Offices
- harness-baseline.ts
- security.ts
- command
- cec.ts
- index.ts
- QuestionStepper.tsx
- park-ticket.ts
- investigations/ledger.ts
- state-parts.ts
- JiraIssuePublisher
- run.ts
- sanitize
- pass.ts
- digest
- api-routes.ts
- cost-ledger.ts
- Ticket
- accessibility-sources.ts
- MapView.tsx
- constellation-runtime.ts
- validate_pr_body.cjs
- audit-plan-candidates.cjs
- office-client.ts
- ref_node_crypto
- ticket-evidence.ts
- OfficeScene.tsx
- spawn-command.ts
- session-context-file.ts
- project-binding-blocks.ts
- session-scope.ts
- service-health.ts
- sanitizeObject
- closeout-recovery.ts
- subjectKey
- agents.ts
- session-bridge.ts
- Coordinator
- json
- follow-production.ts
- viewer.js
- restart-writer.ts
- incidents.ts
- conversations/conversations.ts
- superseded-wiki-pr.ts
- ref_node_child_process
- provider-observation.ts
- jiraBinding
- session-context-client.ts
- plans.cjs
- .emit
- capture-session-clone.py
- cec/workflow.ts
- deploy.ts
- ticket-stage-runner.ts
- archive-plan.cjs
- call-scope.ts
- goal-reporting.ts
- inspect-closed-plan.ts
- on-merge-sync.cjs
- backup-stores.ts
- extract-worker.mjs
- ref_zod
- harnessEffect
- resume-outcome.ts
- pr-observation-graphql.ts
- handoff-admission.ts
- unsent-time.ts
- shared.ts
- resume-arrivals.ts
- slack-supersession.ts
- run-accounting.ts
- qa.ts
- qa-plan-continuation.ts
- writer-restart.ts
- restoreInPlace
- supersedingDelivery
- install-overseer.mjs
- weekly-rollup.ts
- deploy-command.ts
- refresh-issue-state.cjs
- http/commands.ts
- harnessDelivers
- resume-after-sign-in.ts
- it-specialist.ts
- launcher-state.mjs
- pre-push-boundary.ts
- holdReason
- release-verification.mjs
- pr-observation-shape.ts
- accept-stage-result.ts
- node-visuals.ts
- ref_node_path
- GitHubOperations
- goal-reviews.ts
- Conversation.tsx
- read-retries.ts
- scene-motion.ts
- scheduler.ts
- production.ts
- reconcile-merges.cjs
- blocker-followups.ts
- workKey
- .save
- runner-root.ts
- RoomCamera.tsx
- common.cjs
- coordination-pump.ts
- resume-control.ts
- projects.ts
- features.ts
- recorded-gh-command.ts
- pilot-delivery.ts
- observe-github-merges.ts
- diagnostic-snapshot.ts
- routing.js
- SessionBridge
- credential-spans.ts
- remove-candidate.ts
- DailyCTO.tsx
- validTicket
- connectWith
- launch.mjs
- metadata-park-words.ts
- retire-external-delivery.ts
- provider-limit-resolution.ts
- preferences-store.ts
- deploy-plan.ts
- OfficeConfigView.tsx
- validate_wiki_pr_body.cjs
- live-reach.ts
- build-overseer-launcher.mjs
- highestStableAtLeast
- owner-step-items.ts
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

## Communities (179 total, 8 thin omitted)

### Community 0 - "incidents/routes.ts"
Cohesion: 0.05
Nodes (67): citationFault(), CitationSchema, SourceVersions, sourceVersions(), dismiss(), DISMISSAL_CITATIONS, DISMISSAL_REASON, DismissalFacts (+59 more)

### Community 1 - "OrgChart.tsx"
Cohesion: 0.11
Nodes (40): label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+32 more)

### Community 2 - "worker-runtime.ts"
Cohesion: 0.06
Nodes (45): savedStageCompletion(), candidateWorkspaceEnvironment(), assignmentSubject(), dispatchExposure(), prepareExposure(), catalogLine(), assertBriefingScope(), clearUnblockBrief() (+37 more)

### Community 3 - "features/workflow.ts"
Cohesion: 0.07
Nodes (58): approveFeature(), featureById(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), discoveryPrompt(), planPrompt() (+50 more)

### Community 4 - "cx"
Cohesion: 0.09
Nodes (89): Outbox(), blockedSummary(), itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps(), ServiceHealthPanel(), followUp() (+81 more)

### Community 5 - "github-check-selection.ts"
Cohesion: 0.10
Nodes (44): resumeProviderReviews(), observe(), CheckJobAgreement, checkJobAgreement(), isKnownCheckStatus(), positive(), STATE, UNFINISHED (+36 more)

### Community 6 - "budget-ledger.ts"
Cohesion: 0.06
Nodes (58): abandonExpired(), Admission, admit(), admitDeployment(), balance(), bindEvidence(), count(), errcode() (+50 more)

### Community 7 - "index.tsx"
Cohesion: 0.05
Nodes (86): OfficeProposal, RetrospectiveRecord, WeeklyRollup, SendMessage, groups, ctoInputFailure(), OutboxCTOInput(), recover() (+78 more)

### Community 8 - "OfficeSnapshot"
Cohesion: 0.07
Nodes (53): jiraQueueProgress(), nextStage(), deliveryRoles, JiraQueueProgress, TicketProgress, SnapshotAcceptance, tourStages, useOffice() (+45 more)

### Community 9 - "TelemetryPanel.tsx"
Cohesion: 0.09
Nodes (45): TelemetryReport, displayAgentTask(), githubStageLabels, LiveAgentTask(), Props, RunningTask(), text(), Agent (+37 more)

### Community 10 - "features/commands.ts"
Cohesion: 0.19
Nodes (22): commandFeature(), reviewQuestions(), confirmBrief(), applyHarnessAction(), HarnessActionInput, recoveryPreconditions(), recoveryTarget(), normalizeRound() (+14 more)

### Community 11 - "overseer/commands.ts"
Cohesion: 0.07
Nodes (47): reconcile(), guardPresent(), overseerCommand(), reconcileArgs(), runnerStatus(), readFailures(), Condition, count (+39 more)

### Community 12 - "App.tsx"
Cohesion: 0.04
Nodes (72): BrainDrawer(), themeColor, App(), BrainWorkspace, CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants (+64 more)

### Community 13 - "admit-improvement.ts"
Cohesion: 0.14
Nodes (23): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementIntakeGate(), improvementManifest() (+15 more)

### Community 14 - "request.ts"
Cohesion: 0.09
Nodes (63): refusal(), stopReason(), observeAutomationConflict(), VERB, assertAutomationEffects(), automationMergePolicy(), observeAutomationMerge(), routeAutomationMerge() (+55 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.12
Nodes (55): requestDelivery(), createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), CaptureRequest (+47 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.08
Nodes (50): BLOCKING, BlockingTrigger, blockingTrigger(), isBlocking(), BrainOverlap, brainOverlap(), brainOverlapQuery(), clip() (+42 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.12
Nodes (34): baselined(), LEARNING_BASELINES, maintainLearning(), clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates(), maintenanceCompletedId() (+26 more)

### Community 18 - "process-group.mjs"
Cohesion: 0.35
Nodes (15): stopOrWait(), MAX_PID, validPgid(), groupInventory(), helperCommandFits(), identify(), leaderMatches(), observation() (+7 more)

### Community 19 - "redactEvidence"
Cohesion: 0.10
Nodes (36): boundedEvidence(), normalizeCause(), IncidentCollector, classify(), isRestoration(), KEY, newer(), record() (+28 more)

### Community 20 - "activation-recovery.ts"
Cohesion: 0.07
Nodes (65): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+57 more)

### Community 21 - "overseer-launch.mjs"
Cohesion: 0.07
Nodes (80): acquireLauncherLock(), alone(), ancestry(), assertDirectoryOrAbsent(), attemptRecord(), bounded(), boundedString(), checkOwnedFile() (+72 more)

### Community 22 - "setup-stop-cap.ts"
Cohesion: 0.10
Nodes (32): readbackDispatchGuidance(), currentEnvironmentWait(), environmentWait(), waitText(), capacityInterruptedRun(), providerSaid(), rerunsInterruptedQA(), officeRefusedQA() (+24 more)

### Community 23 - "jira-time.ts"
Cohesion: 0.07
Nodes (54): attempted(), attemptState(), bound(), covers(), JiraAttempt, jiraAttempts(), JiraAttemptState, open() (+46 more)

### Community 24 - "work.ts"
Cohesion: 0.08
Nodes (34): FailedMailCheck, lastFailedMailCheck(), lastMailCheckOutcome(), MailCheckOutcome, ProjectObservation, LANES, observeProjects(), OfficeObservation (+26 more)

### Community 25 - "outbox.ts"
Cohesion: 0.12
Nodes (25): capabilityBlockedReviews(), latestReviews(), metadataParkAction(), ADOPTION_STALLED_MS, projectOutbox(), item(), syncOutbox(), sameOwnerSteps() (+17 more)

### Community 26 - "controller-runtime.ts"
Cohesion: 0.09
Nodes (20): [cmd,...rawArgs], DATA, projectData(), StoreDatabase, ControllerEffects, controllerEffects(), DEPLOY_PROJECT, alive() (+12 more)

### Community 27 - "offices.ts"
Cohesion: 0.08
Nodes (32): leadershipContext(), expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), knowledgeEntries() (+24 more)

### Community 28 - "assertDeliveryMayMutate"
Cohesion: 0.08
Nodes (79): ProjectCard, requireDeliveryAuthority(), assertDeliveryMayMutate(), assertMayMutate(), advanceMetadataPark(), Parked, releaseWords(), sentAnything() (+71 more)

### Community 29 - "interrupted-work-recovery.ts"
Cohesion: 0.08
Nodes (28): interruptAdoptions(), legacy(), REMOVED_FIELDS, retireLegacyRecovery(), goalNoticeNeverDispatched(), completeNativeCheckpoint(), BrainStatusSchema, identity (+20 more)

### Community 30 - "GitHubDelivery"
Cohesion: 0.06
Nodes (81): retryRead(), runHarnessStage(), GitHubDelivery, Binding, historyBeforeWrite(), matchesBoundDescription(), DescriptionEdit, DescriptionHistory (+73 more)

### Community 31 - "artifact"
Cohesion: 0.08
Nodes (47): writerRestartPending(), closeoutRequestResolved(), preparationRequestResolved(), scopeRepairRequestResolved(), assertStoppedBaseAudit(), AuditRow, AWS_KEY_ID, readStoppedBaseAuditCompletion() (+39 more)

### Community 32 - ".transaction"
Cohesion: 0.12
Nodes (29): featureItemComplete(), reconcileFeatureCompletion(), readEvidence(), helperTelemetry(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS, reserveReplacement() (+21 more)

### Community 33 - "evidence.ts"
Cohesion: 0.21
Nodes (11): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_SOURCE_PATHS, officeSource() (+3 more)

### Community 34 - "cec-reads.ts"
Cohesion: 0.11
Nodes (30): escaped(), IntakeBinding, intakeEnumeration(), intakeJql(), intakeMembership(), projectListScope(), cecReadbackPrompt(), cecReconcilePrompt() (+22 more)

### Community 35 - "wiki-graph.cjs"
Cohesion: 0.18
Nodes (22): connections(), fs, main(), path, ensureInside(), hasSymlinkComponent(), slash(), splitFrontmatter() (+14 more)

### Community 36 - "scheduled-work.ts"
Cohesion: 0.08
Nodes (40): freshOwnershipRead(), conversationResolved(), deliverySlot(), Ownership, ownershipContext, refreshDeliveryOwnership(), RefreshOwnership, withAmendmentOwnership() (+32 more)

### Community 37 - "routing.cjs"
Cohesion: 0.14
Nodes (29): closingIssues(), githubRefs(), normalizeGithubQuery(), normalizeRepository(), parseGithubQuery(), ref(), withoutFencedCode(), adjacency() (+21 more)

### Community 38 - "github-delivery.ts"
Cohesion: 0.03
Nodes (112): writerRestartInstruction(), BLOCK, harnessBlockMove(), harnessParkedCard(), noted(), ProjectProgress, candidateIdentity(), candidateSlug() (+104 more)

### Community 39 - "knowledge.ts"
Cohesion: 0.05
Nodes (67): guidanceExcerpt(), clip(), DEMAND_LIMIT, demandFacts(), key(), LessonKey, notes(), officeKnowledgeSnapshot() (+59 more)

### Community 40 - "requests.ts"
Cohesion: 0.07
Nodes (32): observePrerequisites(), CloseoutSupervisionProofRef, Envelope, hash, head, identity, instant(), known (+24 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.18
Nodes (22): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), midnight(), TicketDay (+14 more)

### Community 42 - "knowledge/routes.ts"
Cohesion: 0.11
Nodes (22): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, CommittedBrain (+14 more)

### Community 43 - "project-bindings-config.ts"
Cohesion: 0.11
Nodes (35): enumerateIntakeList(), inPickupOrder(), Intake, text(), checkMail(), drainMail(), requestMail(), document() (+27 more)

### Community 44 - "Offices"
Cohesion: 0.12
Nodes (6): QuestionNotifications, file, project, root, projectById(), Offices

### Community 45 - "harness-baseline.ts"
Cohesion: 0.15
Nodes (23): BaselineReport, baselineReport(), BaselineSource, baselineText(), millions(), row(), share(), add() (+15 more)

### Community 46 - "security.ts"
Cohesion: 0.07
Nodes (32): AFTER_LABEL, BARE_CREDENTIAL, BARE_LABEL, BARE_UNIT, BARE_VALUE, CAMEL_START, CONTROL_ESCAPE, CREDENTIAL_NAME (+24 more)

### Community 47 - "command"
Cohesion: 0.08
Nodes (37): inHistoryOf(), CompareMemory, compareMemory(), COMPARES_PER_PASS, comparison(), DeployedFixes, DeployedFixesInput, recordDeployedFixes() (+29 more)

### Community 48 - "cec.ts"
Cohesion: 0.14
Nodes (21): cecPrompt(), resolvedDecisionNote(), stageInstructions, stageInstructionsFor(), REVIEW_FINDINGS_RULE, applies(), interruptedRunNote(), placeholder() (+13 more)

### Community 49 - "index.ts"
Cohesion: 0.07
Nodes (31): close(), config, itSpecialist, loadedRevision, offices, releaseLock, respond(), server (+23 more)

### Community 50 - "QuestionStepper.tsx"
Cohesion: 0.19
Nodes (18): FeatureQuestionProjection, OutboxQuestionRound(), send(), draftKey(), readDraft(), saveDraft(), QuestionRound(), nextQuestion() (+10 more)

### Community 51 - "park-ticket.ts"
Cohesion: 0.19
Nodes (28): resolveBlockedTransition(), jiraCollection(), findComment(), LiveIssue, readIssue(), commentDecision(), commentRefused(), decisionComment() (+20 more)

### Community 52 - "investigations/ledger.ts"
Cohesion: 0.23
Nodes (13): acceptedCompletionResolution(), investigationCandidates(), investigationId(), finishedSubjectResolution(), investigationFollowUps(), interruptedQARerunResolution(), investigationResolution(), syncInvestigations() (+5 more)

### Community 53 - "state-parts.ts"
Cohesion: 0.08
Nodes (30): readSavedState(), LARGE_KEY_CHARS, plain(), RedactedEntries, RedactedEntry, redactEntries(), joinParts(), PartRow (+22 more)

### Community 54 - "JiraIssuePublisher"
Cohesion: 0.08
Nodes (18): JiraIssuePublisher, descriptionPreimage(), plain(), publicationDescription(), GitHubFeaturePublisher, JiraFeaturePublisher, FeaturePublisher, PublicationReceipt (+10 more)

### Community 55 - "run.ts"
Cohesion: 0.25
Nodes (11): OFFICE_FIX_PROMPT, OfficeFixResult, validateOfficeFix(), investigationReady(), InvestigationOptions, InvestigationReport, InvestigationRunner, runInvestigation() (+3 more)

### Community 56 - "sanitize"
Cohesion: 0.09
Nodes (26): FailureReceipt, haltCondition(), sanitize(), forwardFailures(), forwardIntent(), ForwardSummary, Standing, EMPTY_HALT (+18 more)

### Community 57 - "pass.ts"
Cohesion: 0.08
Nodes (43): FailureEvent, failureLine(), LINE_LIMIT, appendFailureLine(), JournalRefused, JournalView, syncPath(), bounded() (+35 more)

### Community 58 - "digest"
Cohesion: 0.07
Nodes (47): GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles(), ContinuationIO (+39 more)

### Community 59 - "api-routes.ts"
Cohesion: 0.13
Nodes (18): servedOutbox(), assertQuestionVisibility(), isNotice(), readNotices(), goalHistory(), PORT, apiRoute(), RequestContext (+10 more)

### Community 60 - "cost-ledger.ts"
Cohesion: 0.13
Nodes (31): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId(), OutsideEdit (+23 more)

### Community 61 - "Ticket"
Cohesion: 0.15
Nodes (16): carriedNotRepeated(), applyChangeScope(), levels(), MAX_CHECKS, changeScopeNote(), Scoped, owedUnderScope(), scopeBase() (+8 more)

### Community 62 - "accessibility-sources.ts"
Cohesion: 0.06
Nodes (56): maintenancePolicies(), captureMaintenanceStep(), accessibilitySources(), actionable(), closingPull(), Finding, handoffIssue(), issueLines() (+48 more)

### Community 63 - "MapView.tsx"
Cohesion: 0.06
Nodes (58): KnowledgeActivity, KnowledgeActivityPage, KnowledgeEdge, KnowledgeMap, KnowledgeNode, ChatMarkdown(), Activity(), ActivityTimeline() (+50 more)

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
Cohesion: 0.10
Nodes (23): FailureAnswer, HaltAnswer, bodyWithin(), bounded(), Envelope, HealthReading, ObservationSkipped, OfficeReader (+15 more)

### Community 68 - "ref_node_crypto"
Cohesion: 0.11
Nodes (59): DeliveryAuthorityInput, canonical(), CheckpointEligibility, checkpointEligibility(), admitAssignmentResume(), admitCheckpointResume(), admitResume(), ResumeAdmission (+51 more)

### Community 69 - "ticket-evidence.ts"
Cohesion: 0.11
Nodes (28): assetDownloader(), attachmentKind(), evidenceDirectory(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS, EvidenceAttachment (+20 more)

### Community 70 - "OfficeScene.tsx"
Cohesion: 0.16
Nodes (34): withoutElapsed(), Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk() (+26 more)

### Community 71 - "spawn-command.ts"
Cohesion: 0.19
Nodes (17): exitFailure(), inactivityWatch(), At, Errno, errno(), GroupInventory, GroupProbe, LifecycleDiagnostic (+9 more)

### Community 72 - "session-context-file.ts"
Cohesion: 0.20
Nodes (14): ContextFoldPrefix, contextFoldPrefix(), SessionContextCheckpoint, captureSessionContextClone(), ContextReadPhase, SessionContextDeadline, sessionContextFile(), ContextReadChanged (+6 more)

### Community 73 - "project-binding-blocks.ts"
Cohesion: 0.19
Nodes (18): azureSchema, deploymentSchema, jiraSchema, ownJiraSchema, promptSchema, DEFAULT_STAGE_STATUSES, intakeStatus, resolvedStatuses() (+10 more)

### Community 74 - "session-scope.ts"
Cohesion: 0.19
Nodes (17): Bound, claudeScopeParser(), claudeSessionScope(), CODEX_ROLLOUTS, contextReaders(), retainSessionMessage(), SessionConversation, escaped() (+9 more)

### Community 75 - "service-health.ts"
Cohesion: 0.12
Nodes (22): ClaudeLoginRefusal, claudeLoginRefusal(), claudeRefusalWords(), RECORDED_REFUSALS, refusedClaudeRow(), listenerHealth(), providers, ProviderStatusChecks (+14 more)

### Community 76 - "sanitizeObject"
Cohesion: 0.11
Nodes (34): az(), AzureMonitor, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs(), fullActivePRs() (+26 more)

### Community 77 - "closeout-recovery.ts"
Cohesion: 0.15
Nodes (33): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+25 more)

### Community 78 - "subjectKey"
Cohesion: 0.10
Nodes (41): attributedRecords(), foldsItsRun(), groupCandidates(), ObservedIncident, ObservedSubject, digest(), fingerprint(), incidentId() (+33 more)

### Community 79 - "agents.ts"
Cohesion: 0.05
Nodes (48): implementationWorkerContext(), assertContinuableWorktree(), CONTINUABLE, continuationPrompt(), MAX_CONTINUATIONS, recordedContinuation(), StageContinuation, stageContinuation() (+40 more)

### Community 80 - "session-bridge.ts"
Cohesion: 0.13
Nodes (22): codexDaemonProcesses(), accountCodexProcesses(), CodexProcessInventory, codexProcessInventory(), DesktopSessions, unaccountedProcesses(), codexThreadMetadata(), METADATA_CHUNK (+14 more)

### Community 82 - "json"
Cohesion: 0.09
Nodes (33): incidentNotices(), NOTICE_KINDS, STATUS, RUNNER_INCIDENT, RUNNER_SUBJECT, Digest, Evidence, FAILURE_ID (+25 more)

### Community 83 - "follow-production.ts"
Cohesion: 0.20
Nodes (17): awaitingJiraStatus(), awaitingProduction(), FOLLOW_DAYS, followed(), isFollowed(), Azure, AzureRead, containedIn() (+9 more)

### Community 84 - "viewer.js"
Cohesion: 0.19
Nodes (25): addMetaLink(), addMetaRow(), addRelationship(), applyView(), buildIndexes(), buildLegend(), buildModel(), buildRenderer() (+17 more)

### Community 85 - "restart-writer.ts"
Cohesion: 0.18
Nodes (17): ATTEMPT_DELAYS_MS, nextAttemptAt(), restartStoppedWriters(), unchangedSinceAccepted(), NOT_RETRYABLE, releaseFunds(), stoppedWriter(), WRITER_STAGES (+9 more)

### Community 86 - "incidents.ts"
Cohesion: 0.10
Nodes (38): expectedWait(), StopFacts, featureRecord(), foldMirroredTicketWorkers(), outboxCoverage(), COVERED, EXPECTED, FALLBACK (+30 more)

### Community 87 - "conversations/conversations.ts"
Cohesion: 0.10
Nodes (19): ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff(), saveGoals() (+11 more)

### Community 88 - "superseded-wiki-pr.ts"
Cohesion: 0.10
Nodes (56): ProofComment, abandon(), assertOpenSnapshot(), awaitingContainment(), closeIssue(), CloseRevalidationError, closeSuperseded(), comment() (+48 more)

### Community 89 - "ref_node_child_process"
Cohesion: 0.10
Nodes (22): changedPaths(), { execFileSync }, files, isMapInput(), mapOnly(), { execFileSync }, git(), publish() (+14 more)

### Community 90 - "provider-observation.ts"
Cohesion: 0.14
Nodes (24): Azure, azurePipelines(), outcome(), Read, RUNS_PER_PIPELINE, Api, githubWorkflows(), outcome() (+16 more)

### Community 91 - "jiraBinding"
Cohesion: 0.10
Nodes (39): CommentPage, commentReadback(), Assignment, contentSchema(), jiraText(), Transition, jiraRecord(), unpack() (+31 more)

### Community 92 - "session-context-client.ts"
Cohesion: 0.11
Nodes (19): claudeSessionContext(), readTranscript, codexSessionContext(), readRollout, packContextFailure(), PackedContextFailure, unpackContextFailure(), ContextThread (+11 more)

### Community 93 - "plans.cjs"
Cohesion: 0.19
Nodes (19): remoteSlug(), walk(), association(), auditedDigests(), candidate(), collapseByTitle(), discover(), fromMarkdown() (+11 more)

### Community 94 - ".emit"
Cohesion: 0.08
Nodes (45): currentOutbox(), retryCandidateCleanup(), confirmedGone(), goneQuery(), STOPPED, stoppedReviewKeys(), adoptDependabot(), settle() (+37 more)

### Community 96 - "cec/workflow.ts"
Cohesion: 0.10
Nodes (32): applyIntakeObservation(), latestQA(), notPassedInLatestQA(), QACoverage, qaCoverage(), same(), Tested, Carried (+24 more)

### Community 97 - "deploy.ts"
Cohesion: 0.10
Nodes (46): abandon(), advance(), DeployContext, DeployTimings, deploy(), DEPLOY_STEPS, append(), assertNext() (+38 more)

### Community 98 - "ticket-stage-runner.ts"
Cohesion: 0.10
Nodes (40): correlatedBuild(), scopeOutgrown(), confirmsMovedHead(), Moved, movedHeadUnconfirmed(), recordConfirmedHead(), routeConfirmedHead(), movedHeadNote() (+32 more)

### Community 99 - "archive-plan.cjs"
Cohesion: 0.12
Nodes (33): fs, main(), parse(), path, archive(), cell(), ensureIndex(), fromArgs() (+25 more)

### Community 100 - "call-scope.ts"
Cohesion: 0.06
Nodes (58): add(), addSource(), busiest(), CallLedger, Entry, sourceRows(), Sources, CallCounts (+50 more)

### Community 101 - "goal-reporting.ts"
Cohesion: 0.17
Nodes (13): assertConversationReadback(), SlackMessages, pump(), savePickup(), harperHandoff(), acceptedGoalReport(), GOAL_REPORT_GUIDANCE, GoalReport (+5 more)

### Community 102 - "inspect-closed-plan.ts"
Cohesion: 0.18
Nodes (13): closedReadonlyPlan(), Document, document(), entryExists(), inspectClosedQAPlan(), qaPlanRetryRoute(), reviewedPlanGuidance, reviewedPlanGuideDigest (+5 more)

### Community 103 - "on-merge-sync.cjs"
Cohesion: 0.14
Nodes (27): fs, main(), path, { spawnSync }, fieldSpan(), frontmatterProblems(), keyPattern(), list() (+19 more)

### Community 104 - "backup-stores.ts"
Cohesion: 0.09
Nodes (38): absentAdmission(), AdmissionComparison, AdmissionSnapshot, compareAdmissions(), snapshotAdmissions(), BackupEntry, BackupInput, BackupInventory (+30 more)

### Community 105 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 106 - "ref_zod"
Cohesion: 0.15
Nodes (16): assertToken(), Body, DeploymentFence, DeploymentFenceState, fenceTokenDigest(), operationPaths(), createDeployToken(), readDeployToken() (+8 more)

### Community 107 - "harnessEffect"
Cohesion: 0.05
Nodes (109): effectKey(), LaneOperation, laneWrite(), moveCardOnce(), Lane, MOVABLE, moveLane(), resolveLane() (+101 more)

### Community 108 - "resume-outcome.ts"
Cohesion: 0.09
Nodes (30): FLAGS, incidentCommand(), IncidentCommandIO, option(), USAGE, whole(), boundaryCrossed(), Crossing (+22 more)

### Community 109 - "pr-observation-graphql.ts"
Cohesion: 0.13
Nodes (29): ChildRequest, headCheckRuns(), includeBody(), readOpenPRs(), commitOf(), ConnectionPages, embeddedHead(), fail() (+21 more)

### Community 110 - "handoff-admission.ts"
Cohesion: 0.14
Nodes (31): actionKey(), bindings(), bound(), CATEGORIZED, claimed(), Entry, episodeAt(), executing() (+23 more)

### Community 111 - "unsent-time.ts"
Cohesion: 0.12
Nodes (21): publishableEntry(), settlementPending(), superseded(), ticketUnresolved(), Ledger, Read, TimeLedger, dueReadback() (+13 more)

### Community 112 - "shared.ts"
Cohesion: 0.04
Nodes (82): channelNoticeAuthorized(), ChannelSettings, notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR, plainSlackText() (+74 more)

### Community 113 - "resume-arrivals.ts"
Cohesion: 0.07
Nodes (45): eventId(), absent(), IncidentChange, IncidentLedger, isOpen(), Recorded, forAssignment(), forCheckpoint() (+37 more)

### Community 114 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 115 - "run-accounting.ts"
Cohesion: 0.05
Nodes (67): BoundedRead, done(), readBoundedNoFollow(), comparable(), EvidenceOutcome, recordRunEvidence(), backfillClaudeCost(), CompletionReader (+59 more)

### Community 119 - "restoreInPlace"
Cohesion: 0.60
Nodes (5): identity(), Json, plain(), restorable(), restoreInPlace()

### Community 120 - "supersedingDelivery"
Cohesion: 0.25
Nodes (12): finishSupersededReadback(), projectSlackDeliveries(), dueSlackReread(), rereadUncertainSlack(), runningRevision(), settleRequestedSlackReplacement(), Input, supersedeSlackDelivery() (+4 more)

### Community 121 - "install-overseer.mjs"
Cohesion: 0.23
Nodes (18): CHECKOUT, DEFAULT_DEADLINE_MS, existingPlist(), installOverseer(), LABEL, LAUNCHER_SOURCE, renderPlist(), SCRIPT (+10 more)

### Community 122 - "weekly-rollup.ts"
Cohesion: 0.06
Nodes (43): deliveryMetrics(), median(), learningMetrics(), BRAIN_SCOPE, harperFolder(), RETROSPECTIVE_TIMEOUT, lastFriday(), ROLLUP_HISTORY (+35 more)

### Community 123 - "deploy-command.ts"
Cohesion: 0.09
Nodes (48): CONTROLLER_ENTRY, ControllerPin, Pin, pinnedController(), readControllerPin(), writeControllerPin(), controllerOf(), deployCommand() (+40 more)

### Community 124 - "refresh-issue-state.cjs"
Cohesion: 0.23
Nodes (12): advanceFence(), key(), { execFileSync }, fs, issueRefs(), main(), markClosed(), openThreadLineIndexes() (+4 more)

### Community 125 - "http/commands.ts"
Cohesion: 0.06
Nodes (49): assertOwnership(), decideImplementation(), Decision, requestQAPlanRetry(), configureChannelNotices(), configureNotices(), noticeState(), retryRecipientLookup() (+41 more)

### Community 126 - "harnessDelivers"
Cohesion: 0.07
Nodes (50): notOwned(), metadataCarriedAdvisoryIds(), ownedBefore(), QA_STAGES, reviewAdvisoryIds(), Reviewed, withoutReviewAdvisories(), deliveryAdmission() (+42 more)

### Community 127 - "resume-after-sign-in.ts"
Cohesion: 0.18
Nodes (16): hasPendingDelivery(), resumeAfterSignIn(), signInWait(), BrowserPage, browserPages(), ReadPages, SignInState, signInState() (+8 more)

### Community 128 - "it-specialist.ts"
Cohesion: 0.19
Nodes (16): replacedReadback(), heldFor(), ITContext, followUpPicture(), recoveryHeld(), recoveryWait(), informationalRecovery(), publishITReport() (+8 more)

### Community 129 - "launcher-state.mjs"
Cohesion: 0.26
Nodes (19): RFC-9562, boundedString(), exactKeys(), isCount(), isIso(), isRfcUuid(), isUuid(), readOwner() (+11 more)

### Community 130 - "pre-push-boundary.ts"
Cohesion: 0.26
Nodes (10): Event, exactCommand(), Invocation, localHookCommand(), one(), prePushRejection(), PushIdentity, retirementBoundary() (+2 more)

### Community 131 - "holdReason"
Cohesion: 0.15
Nodes (24): interruptedImplementation(), Document, document(), isAccessOnlyPlan(), settledAccessOnlyState(), continueAccessOnlyPlan(), entryExists(), deliveryIntakeBlocker() (+16 more)

### Community 132 - "release-verification.mjs"
Cohesion: 0.24
Nodes (17): isDigest(), isSha(), digestOf(), entryOf(), PASS_ENTRY, releaseRevision(), validManifest(), validPin() (+9 more)

### Community 133 - "pr-observation-shape.ts"
Cohesion: 0.19
Nodes (21): withGitHubOperation(), githubPRDescription(), closingDirectives(), ObservedPR, enumValue(), fail(), graphqlPR(), mapped() (+13 more)

### Community 134 - "accept-stage-result.ts"
Cohesion: 0.07
Nodes (75): containedFile(), acceptStageResult(), acceptConflictRepair(), recordJobApproach(), deliveryNextStage(), pendingPreparationCheck(), acceptMetadataReview(), mergeAuthorized() (+67 more)

### Community 135 - "node-visuals.ts"
Cohesion: 0.20
Nodes (14): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+6 more)

### Community 136 - "ref_node_path"
Cohesion: 0.07
Nodes (53): ctoInputIdentityMatches(), ctoInputRecovered(), recoverCTOInput(), allowed, StoppedBaseAuditReader, readStoppedBaseAuditNative(), contentTypes, recordTypes (+45 more)

### Community 137 - "GitHubOperations"
Cohesion: 0.36
Nodes (4): GitHubOperations, Assessment, closeNativeRefresh(), fingerprint()

### Community 138 - "goal-reviews.ts"
Cohesion: 0.13
Nodes (20): currentCitations(), Fact, NOT_CURRENT, PROVIDER_ERROR, applyGoalReview(), DailyResultSchema, DeliveryJob, EvidenceRefSchema (+12 more)

### Community 139 - "Conversation.tsx"
Cohesion: 0.08
Nodes (39): knowledgeOutbox(), Conversation(), ConversationDraft, createConversationDrafts(), LessonDecisionAction, lessonDecisionState(), readLessonDecision(), DAYS (+31 more)

### Community 140 - "read-retries.ts"
Cohesion: 0.21
Nodes (14): defaultPickupStatus(), APPROACH_GUARD_REJECTION, classifyStop(), ReviewWait, incompleteReadOutput(), planReadRetry(), readOnlyStageJob(), readRetryPending() (+6 more)

### Community 141 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 142 - "scheduler.ts"
Cohesion: 0.09
Nodes (21): Clock, OfficeCapacity, PROJECT_LOCAL, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork() (+13 more)

### Community 144 - "reconcile-merges.cjs"
Cohesion: 0.22
Nodes (14): collectPulls(), copyWikiForDryRun(), { execFileSync }, flattenPages(), fs, githubRequest(), isWikiBotPull(), main() (+6 more)

### Community 145 - "blocker-followups.ts"
Cohesion: 0.28
Nodes (17): conversationReadbackReady(), followupOf(), pendingReadback(), queueConversationReadback(), readbackEnding(), uncertainConversations(), readBackConversations(), followupRecord() (+9 more)

### Community 146 - "workKey"
Cohesion: 0.09
Nodes (52): StoppedWriter, savedAdmissionUnresolved(), assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), completedConflictDraftUnresolved(), postConflictPreparationEvidence(), readPostConflictPreparationFacts() (+44 more)

### Community 147 - ".save"
Cohesion: 0.06
Nodes (15): enableNightly(), MergeNotifications, returnToPickup(), boardReadFailure(), GitHubMonitor, QuotaGate, heldBy(), ResumeProject (+7 more)

### Community 148 - "runner-root.ts"
Cohesion: 0.10
Nodes (37): resolveCliRoot(), DEFAULT_OFFICE_URL, LOOPBACK, officeUrl(), privateDirectories(), RUNNER_DEFAULTS, RunnerLimits, RunnerPaths (+29 more)

### Community 149 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (7): CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility, overlayEntranceDelays(), SceneOverlay()

### Community 150 - "common.cjs"
Cohesion: 0.11
Nodes (24): fs, main(), parse(), path, atomicWrite(), crypto, { execFileSync }, fs (+16 more)

### Community 151 - "coordination-pump.ts"
Cohesion: 0.11
Nodes (28): reconcileNoticeConfirmations(), Admission, admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, compatible(), dependencyCompletionKey() (+20 more)

### Community 152 - "resume-control.ts"
Cohesion: 0.29
Nodes (7): absent(), NEVER_ENABLED, ResumeControl, stated(), Stored, unreadable(), ResumeSwitch

### Community 153 - "projects.ts"
Cohesion: 0.14
Nodes (21): intakeLocation(), OfficeConfigInputs, officeConfigRoute(), officeConfigSummary(), projectSettingsSummary(), CECBinding, ProjectInput, ownProjectBindings() (+13 more)

### Community 154 - "features.ts"
Cohesion: 0.13
Nodes (32): dispatchNightly(), eligibility(), currentApproval(), featureGate(), predecessorComplete(), automaticIntakeWait(), recoveryHeld(), DeliveryPreflight (+24 more)

### Community 155 - "recorded-gh-command.ts"
Cohesion: 0.19
Nodes (20): assignments(), changeDirectory(), closing(), CREATE, createGuard(), flags(), named(), read() (+12 more)

### Community 156 - "pilot-delivery.ts"
Cohesion: 0.14
Nodes (24): candidateBranchMoved(), endChangeScope(), draftHeadMovedForward(), git(), movedHeadEvent(), recordMovedHead(), continueImplementation(), drainDelivery() (+16 more)

### Community 157 - "observe-github-merges.ts"
Cohesion: 0.30
Nodes (14): clearCooldown(), coolDown(), coolingDown(), MERGE_NOTICE_RECHECK_MS, waitKey(), waits, isMergeCommit(), issueOf() (+6 more)

### Community 158 - "diagnostic-snapshot.ts"
Cohesion: 0.28
Nodes (10): itChatPrompt(), assignmentDiagnostics(), diagnosticContext(), diagnosticSnapshot(), itAgent(), itDiagnostics(), followUpStatus(), outstandingFollowUps() (+2 more)

### Community 160 - "SessionBridge"
Cohesion: 0.29
Nodes (7): claudeSessions(), SessionBridge, completeSessionCoverage(), desktopCoverageGap(), knownActivity(), Report, unexplained()

### Community 161 - "credential-spans.ts"
Cohesion: 0.08
Nodes (51): BareValue, bareValue(), deeperValueEnd(), ENDS, isSeparator(), plainEscape(), queryValue(), separatorEscapeAt() (+43 more)

### Community 162 - "remove-candidate.ts"
Cohesion: 0.14
Nodes (23): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), maintenanceCandidate(), moveAside(), moveBack(), purgeRemoved(), purging (+15 more)

### Community 163 - "DailyCTO.tsx"
Cohesion: 0.35
Nodes (7): CTOReview(), goalState, DailyCTO(), reportDate(), reviewStatus, InlineText(), ReviewText()

### Community 164 - "validTicket"
Cohesion: 0.19
Nodes (17): validTicket(), telemetryRoute(), CostEntry, TelemetryRow, TelemetrySync, Acc, bump(), EASTERN (+9 more)

### Community 165 - "connectWith"
Cohesion: 0.38
Nodes (5): connectWith(), data(), envelope(), JiraWorklogs, WorklogSave

### Community 166 - "launch.mjs"
Cohesion: 0.16
Nodes (24): LOOPBACK, officeOrigin(), passDeadline(), dispatch(), reportedOutcome(), bounded(), isObject(), message() (+16 more)

### Community 167 - "metadata-park-words.ts"
Cohesion: 0.16
Nodes (20): devUpdate(), HEADLINE, parksInJira(), OUTCOME, qaComment(), remote(), STAGE, JiraCommentIntent (+12 more)

### Community 168 - "retire-external-delivery.ts"
Cohesion: 0.44
Nodes (7): completedPRReview(), completedPRReviews(), completedPreparation(), eligible(), ownerMergedWorkFinished(), ownerSettles(), settledExternalRepair()

### Community 169 - "provider-limit-resolution.ts"
Cohesion: 0.36
Nodes (6): investigatesLimitRefusal(), PROVIDER_RECOVERED, providerLimitResolution(), refusedAtLimit(), MONTHS, providerLimit()

### Community 170 - "preferences-store.ts"
Cohesion: 0.17
Nodes (10): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS (+2 more)

### Community 171 - "deploy-plan.ts"
Cohesion: 0.10
Nodes (44): runningRevision(), runningRevision(), ROOT, releaseIdentity(), runtimeRevision(), PIN_ENTRY, pinCommand(), ActiveRelease (+36 more)

### Community 172 - "OfficeConfigView.tsx"
Cohesion: 0.39
Nodes (7): loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView(), policyText(), OfficeConfigSummary, errorText

### Community 173 - "validate_wiki_pr_body.cjs"
Cohesion: 0.33
Nodes (5): { execFileSync }, hasCanonicalWikiBody(), maintenanceBodies, matchesMaintenanceBody(), { readFileSync }

### Community 174 - "live-reach.ts"
Cohesion: 0.47
Nodes (5): GIT_NETWORK, LIVE_PROVIDERS, liveReach(), networkUrl(), remoteUrls()

### Community 175 - "build-overseer-launcher.mjs"
Cohesion: 0.20
Nodes (8): BANNER, builtin(), bundleLauncher(), LAUNCHER_BUNDLE, LAUNCHER_ENTRY, launcherChunk(), REPOSITORY, SCRIPT

### Community 176 - "highestStableAtLeast"
Cohesion: 0.83
Nodes (3): compare(), highestStableAtLeast(), parts()

### Community 177 - "owner-step-items.ts"
Cohesion: 0.17
Nodes (12): OwnerStepItem, ownerStepItems(), signIn(), commands(), SIGN_IN_SERVICE_TROUBLE, signInSteps(), Step, OwnerSteps (+4 more)

## Knowledge Gaps
- **1 isolated node(s):** `RFC-9562`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 1214 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `shared.ts` to `incidents/routes.ts`, `worker-runtime.ts`, `features/workflow.ts`, `github-check-selection.ts`, `OfficeSnapshot`, `features/commands.ts`, `admit-improvement.ts`, `request.ts`, `scheduled-captures.ts`, `run-retrospective.ts`, `record-trigger.ts`, `activation-recovery.ts`, `setup-stop-cap.ts`, `jira-time.ts`, `work.ts`, `controller-runtime.ts`, `offices.ts`, `assertDeliveryMayMutate`, `interrupted-work-recovery.ts`, `GitHubDelivery`, `artifact`, `.transaction`, `evidence.ts`, `cec-reads.ts`, `scheduled-work.ts`, `github-delivery.ts`, `knowledge.ts`, `requests.ts`, `time-scope.ts`, `knowledge/routes.ts`, `project-bindings-config.ts`, `Offices`, `command`, `cec.ts`, `park-ticket.ts`, `investigations/ledger.ts`, `state-parts.ts`, `JiraIssuePublisher`, `run.ts`, `digest`, `api-routes.ts`, `cost-ledger.ts`, `Ticket`, `accessibility-sources.ts`, `ref_node_crypto`, `ticket-evidence.ts`, `sanitizeObject`, `closeout-recovery.ts`, `agents.ts`, `session-bridge.ts`, `follow-production.ts`, `restart-writer.ts`, `conversations/conversations.ts`, `superseded-wiki-pr.ts`, `provider-observation.ts`, `jiraBinding`, `.emit`, `ticket-stage-runner.ts`, `goal-reporting.ts`, `inspect-closed-plan.ts`, `harnessEffect`, `pr-observation-graphql.ts`, `unsent-time.ts`, `resume-arrivals.ts`, `run-accounting.ts`, `supersedingDelivery`, `weekly-rollup.ts`, `http/commands.ts`, `harnessDelivers`, `resume-after-sign-in.ts`, `it-specialist.ts`, `holdReason`, `accept-stage-result.ts`, `ref_node_path`, `GitHubOperations`, `goal-reviews.ts`, `read-retries.ts`, `scheduler.ts`, `blocker-followups.ts`, `workKey`, `.save`, `coordination-pump.ts`, `features.ts`, `pilot-delivery.ts`, `observe-github-merges.ts`, `diagnostic-snapshot.ts`, `SessionBridge`, `remove-candidate.ts`, `validTicket`, `retire-external-delivery.ts`, `provider-limit-resolution.ts`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **What connects `RFC-9562` to the rest of the system?**
  _1 weakly-connected nodes found - possible missing edges._
- **Should `incidents/routes.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.053164556962025315 - nodes in this community are weakly interconnected._
- **Why does `command()` connect `command` to `incidents/routes.ts`, `worker-runtime.ts`, `holdReason`, `features/workflow.ts`, `GitHubOperations`, `admit-improvement.ts`, `.save`, `activation-recovery.ts`, `coordination-pump.ts`, `jira-time.ts`, `controller-runtime.ts`, `offices.ts`, `pilot-delivery.ts`, `interrupted-work-recovery.ts`, `GitHubDelivery`, `SessionBridge`, `remove-candidate.ts`, `connectWith`, `github-delivery.ts`, `requests.ts`, `knowledge/routes.ts`, `project-bindings-config.ts`, `deploy-plan.ts`, `JiraIssuePublisher`, `digest`, `cost-ledger.ts`, `Ticket`, `accessibility-sources.ts`, `ticket-evidence.ts`, `service-health.ts`, `sanitizeObject`, `closeout-recovery.ts`, `agents.ts`, `session-bridge.ts`, `restart-writer.ts`, `provider-observation.ts`, `jiraBinding`, `.emit`, `deploy.ts`, `ticket-stage-runner.ts`, `call-scope.ts`, `inspect-closed-plan.ts`, `harnessEffect`, `unsent-time.ts`, `shared.ts`, `deploy-command.ts`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Should `OrgChart.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1096938775510204 - nodes in this community are weakly interconnected._
- **Why does `sanitize()` connect `sanitize` to `incidents/routes.ts`, `worker-runtime.ts`, `overseer/commands.ts`, `setup-stop-cap.ts`, `assertDeliveryMayMutate`, `GitHubDelivery`, `cec-reads.ts`, `knowledge.ts`, `security.ts`, `index.ts`, `run.ts`, `pass.ts`, `digest`, `office-client.ts`, `spawn-command.ts`, `service-health.ts`, `sanitizeObject`, `agents.ts`, `follow-production.ts`, `conversations/conversations.ts`, `provider-observation.ts`, `jiraBinding`, `.emit`, `goal-reporting.ts`, `inspect-closed-plan.ts`, `shared.ts`, `resume-arrivals.ts`, `supersedingDelivery`, `weekly-rollup.ts`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Should `worker-runtime.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.062003968253968256 - nodes in this community are weakly interconnected._