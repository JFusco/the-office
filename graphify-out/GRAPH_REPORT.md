# Graph Report - the-office  (2026-11-28)

## Corpus Check
- 1400 files · ~646,457 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 8057 nodes · 33937 edges · 192 communities (180 shown, 12 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 1116 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f2e04276`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- codex-handoff.ts
- Role
- worker-runtime.ts
- process.ts
- cx
- link-draft-issue.ts
- budget-ledger.ts
- ref_react
- incidents/routes.ts
- TelemetryPanel.tsx
- checkpoint-retry.ts
- InFlightOperations
- outbox.ts
- redactEvidence
- github-readiness.ts
- scheduled-captures.ts
- run-retrospective.ts
- record-trigger.ts
- route-activation.ts
- sandbox-qualification.ts
- command-registry.ts
- overseer-launch.mjs
- delivery-retry.ts
- jira-time.ts
- ref_node_path
- index.ts
- notifications.ts
- Ticket
- advance-metadata-park.ts
- assignments.ts
- assignment-context.ts
- installation-token.ts
- ref_node_crypto
- artifact
- Coordinator
- common.cjs
- pr-observation-shape.ts
- routing.cjs
- entry.ts
- lesson-selection.ts
- Conversation.tsx
- time-scope.ts
- accessibility-sources.ts
- .save
- Offices
- harness-baseline.ts
- credential-spans.ts
- rate-limit-samples.ts
- goal-reviews.ts
- DeploymentFence
- QuestionStepper.tsx
- readable-jira-comment.ts
- investigations/ledger.ts
- run-model.ts
- currentAssignment
- weekly-rollup.ts
- runner-root.ts
- delivery-recoveries.ts
- fact-bounds.ts
- observe-projects.ts
- cost-ledger.ts
- demand-facts.ts
- work-summary.ts
- OfficeConfigView.tsx
- constellation-runtime.ts
- validate_pr_body.cjs
- audit-plan-candidates.cjs
- pass.ts
- resume-arrivals.ts
- App.tsx
- OfficeScene.tsx
- spawn-command.ts
- session-context-file.ts
- ref_zod
- session-scope.ts
- service-health.ts
- sanitizeObject
- closeout-recovery.ts
- incidents.ts
- agents.ts
- session-bridge.ts
- shared.ts
- coordination-tick.ts
- remove-candidate.ts
- viewer.js
- maintenance/maintenance.ts
- stopped-record.ts
- sanitize
- superseded-wiki-pr.ts
- ref_node_child_process
- provider-observation.ts
- office/config.ts
- session-context-client.ts
- plans.cjs
- holdReason
- capture-session-clone.py
- scheduled-features.ts
- jiraBinding
- pilot-delivery.ts
- archive-plan.cjs
- call-scope.ts
- time-ledger.ts
- Goals.tsx
- on-merge-sync.cjs
- backup-stores.ts
- extract-worker.mjs
- controller-runtime.ts
- harnessEffect
- judge-resumes.ts
- pr-observation-graphql.ts
- blocker-followups.ts
- follow-production.ts
- brain-maintenance.ts
- index.tsx
- slack-supersession.ts
- run-accounting.ts
- qa.ts
- qa-plan-continuation.ts
- writer-restart.ts
- store.ts
- retrospective-subject.ts
- write-boundary.ts
- daily-cto.ts
- deploy-command.ts
- refresh-issue-state.cjs
- .emit
- cec-reads.ts
- resume-after-sign-in.ts
- jira-move.ts
- recovery/stopped-base-update.ts
- retry-binding.ts
- MaintenanceRun
- runner-routes.ts
- work.ts
- state-parts.ts
- triage.ts
- knowledge.ts
- it-specialist.ts
- deploy-plan.ts
- scheduled-work.ts
- ticket-stage-runner.ts
- metadata-park-words.ts
- Store
- production.ts
- reconcile-merges.cjs
- inspect-closed-plan.ts
- requests.ts
- cec/workflow.ts
- reader-profiles.ts
- redact-evidence.ts
- repoRoot
- coordination-pump.ts
- JiraWorklogTransport
- checkpoint-completion.ts
- task-briefing.ts
- recorded-gh-command.ts
- change-scope.ts
- observe-github-merges.ts
- identity-runtime.ts
- routing.js
- bareSpans
- pre-push-boundary.ts
- github-context.ts
- json-layers.ts
- telemetry/report.ts
- reconcileGitHubWrite
- launch.mjs
- bare-value.ts
- admit-improvement.ts
- continue-access-only-plan.ts
- Button
- release-manifest.ts
- scope-repair-resume.ts
- lesson-issue-ready.ts
- call-ledger.ts
- refused-commented-park.ts
- .getEffect
- digest
- EffectIntent
- restart-writer.ts
- preferences-store.ts
- project-bindings.ts
- build-overseer-launcher.mjs
- session-snapshot-cleanup.ts
- quota-governor.ts
- normalize-question.ts
- deploy.ts
- create-candidate.ts
- retire-history.ts
- salvage-worktree.ts
- incident-command.ts
- SoundPlayer

## God Nodes (most connected - your core abstractions)
1. `Store` - 487 edges
2. `TicketJob` - 248 edges
3. `digest()` - 175 edges
4. `command()` - 163 edges
5. `GitHubDelivery` - 145 edges
6. `holdReason()` - 143 edges
7. `OfficeSnapshot` - 123 edges
8. `artifact()` - 116 edges
9. `StageResult` - 111 edges
10. `workKey()` - 110 edges

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
- 2-file cycle: `server/workers/process.ts -> server/workers/spawn-command.ts -> server/workers/process.ts`
- 2-file cycle: `src/contracts/people.ts -> src/shared.ts -> src/contracts/people.ts`
- 2-file cycle: `src/contracts/timing.ts -> src/shared.ts -> src/contracts/timing.ts`
- 2-file cycle: `src/contracts/work.ts -> src/shared.ts -> src/contracts/work.ts`
- 3-file cycle: `server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts`

## Communities (192 total, 12 thin omitted)

### Community 0 - "codex-handoff.ts"
Cohesion: 0.05
Nodes (90): claudeGeneration(), ClaudeSignIn, normalizeClaudeToken(), readClaudeSignIn(), claimText(), codexCanDispatch(), CodexEnvelope, codexGeneration() (+82 more)

### Community 1 - "Role"
Cohesion: 0.11
Nodes (39): DeliverySlot, Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona (+31 more)

### Community 2 - "worker-runtime.ts"
Cohesion: 0.06
Nodes (45): savedStageCompletion(), candidateWorkspaceEnvironment(), assignmentSubject(), assertBriefingScope(), clearUnblockBrief(), key(), saveUnblockBrief(), UnblockBrief (+37 more)

### Community 3 - "process.ts"
Cohesion: 0.06
Nodes (82): Assignment, jiraText(), Transition, descriptionPreimage(), plain(), approveFeature(), createFeature(), featureById() (+74 more)

### Community 4 - "cx"
Cohesion: 0.09
Nodes (88): blockedSummary(), itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps(), ServiceHealthPanel(), followUp(), labels (+80 more)

### Community 5 - "link-draft-issue.ts"
Cohesion: 0.28
Nodes (11): commentAuthor(), validCardRead(), assertExistingPublication(), ExistingPublicationConflict, assertDraftClaimHistory(), linkDraftIssue(), protectedOriginalClaim(), accountRead() (+3 more)

### Community 6 - "budget-ledger.ts"
Cohesion: 0.06
Nodes (58): abandonExpired(), Admission, admit(), admitDeployment(), balance(), bindEvidence(), count(), errcode() (+50 more)

### Community 7 - "ref_react"
Cohesion: 0.07
Nodes (57): KnowledgeActivity, KnowledgeActivityPage, KnowledgeEdge, KnowledgeMap, KnowledgeNode, Activity(), ActivityTimeline(), AssignmentKnowledge() (+49 more)

### Community 8 - "incidents/routes.ts"
Cohesion: 0.06
Nodes (61): citationFault(), CitationSchema, ClaimedRange, ResolvedRange, SourceVersions, dismiss(), DISMISSAL_CITATIONS, DISMISSAL_REASON (+53 more)

### Community 9 - "TelemetryPanel.tsx"
Cohesion: 0.11
Nodes (37): TelemetryReport, AzureBuild, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens(), usd() (+29 more)

### Community 10 - "checkpoint-retry.ts"
Cohesion: 0.26
Nodes (9): completeNativeCheckpoint(), BrainStatusSchema, identity, queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), legacy (+1 more)

### Community 12 - "outbox.ts"
Cohesion: 0.13
Nodes (22): metadataParkAction(), ADOPTION_STALLED_MS, projectOutbox(), item(), syncOutbox(), OwnerStepItem, ownerStepItems(), sameOwnerSteps() (+14 more)

### Community 13 - "redactEvidence"
Cohesion: 0.07
Nodes (58): sourceVersions(), inHistoryOf(), CompareMemory, compareMemory(), COMPARES_PER_PASS, comparison(), DeployedFixes, DeployedFixesInput (+50 more)

### Community 14 - "github-readiness.ts"
Cohesion: 0.07
Nodes (78): refusal(), MISSING_NATIVE_LINK, approveMerge(), AdoptionBinding, assertAutomationAuthority(), observeAutomationConflict(), VERB, assertAutomationEffects() (+70 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.09
Nodes (67): dispatchNightly(), requestDelivery(), accounting, DeliverySubject, nonDelivery, originalReads, featureEffectGate(), assertFeatureGate() (+59 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.10
Nodes (41): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, BlockingTrigger, blockingTrigger(), isBlocking() (+33 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.10
Nodes (38): bindLegacyRetries(), LEGACY_LIMIT, baselined(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences(), clip() (+30 more)

### Community 18 - "route-activation.ts"
Cohesion: 0.08
Nodes (57): ActiveEntry, effectId(), entry(), fail(), KnownProject, only(), parseGitHubApp(), positive() (+49 more)

### Community 19 - "sandbox-qualification.ts"
Cohesion: 0.04
Nodes (96): ReaderAuthentication, RunDirectories, storageOverlaps(), ValidatedRunnerPaths, within(), ALLOW_PROBES, BatteryExpected, Binding (+88 more)

### Community 20 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 21 - "overseer-launch.mjs"
Cohesion: 0.07
Nodes (80): acquireLauncherLock(), alone(), ancestry(), assertDirectoryOrAbsent(), attemptRecord(), bounded(), boundedString(), checkOwnedFile() (+72 more)

### Community 22 - "delivery-retry.ts"
Cohesion: 0.15
Nodes (30): DeliveryRetryDecision, deliveryRetryDecision(), readOnlyStageJob(), retryable(), RetryStore, UnsettledRead, BOARD_STOP, boardOnly() (+22 more)

### Community 23 - "jira-time.ts"
Cohesion: 0.11
Nodes (37): twgProfile(), unresolvedAttempts(), bindingOf(), connectWith(), data(), envelope(), finishVerifiedEffects(), JiraWorklogs (+29 more)

### Community 24 - "ref_node_path"
Cohesion: 0.06
Nodes (62): file, folder, logs, root, verifyContinuationPreservation(), ctoInputIdentityMatches(), ctoInputRecovered(), Candidate (+54 more)

### Community 25 - "index.ts"
Cohesion: 0.04
Nodes (71): implementationContinuationRoute(), qaPlanRetryRoute(), servedOutbox(), AutoAdoptBot, EffectiveAutoAdopt, effectiveAutoAdopt(), IntakeView, isNotice() (+63 more)

### Community 26 - "notifications.ts"
Cohesion: 0.09
Nodes (29): channelNoticeAuthorized(), ChannelSettings, notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR, plainSlackText() (+21 more)

### Community 27 - "Ticket"
Cohesion: 0.10
Nodes (31): carriedNotRepeated(), changeScopeNote(), Scoped, confirmsMovedHead(), movedHeadNote(), cecPrompt(), cecReconcilePrompt(), resolvedDecisionNote() (+23 more)

### Community 28 - "advance-metadata-park.ts"
Cohesion: 0.09
Nodes (69): ProjectCard, advanceMetadataPark(), Parked, releaseWords(), sentAnything(), CardResumeRoute, cardResumeRoute(), effectiveParkPickup() (+61 more)

### Community 29 - "assignments.ts"
Cohesion: 0.08
Nodes (32): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, CommittedBrain (+24 more)

### Community 30 - "assignment-context.ts"
Cohesion: 0.07
Nodes (71): activeRetry(), assertNoModelFallback(), Binding, historyBeforeWrite(), matchesBoundDescription(), DescriptionEdit, DescriptionHistory, DescriptionHistoryUnavailable (+63 more)

### Community 31 - "installation-token.ts"
Cohesion: 0.17
Nodes (15): appJwt(), base64url(), signingKey(), AppKeySource, API_VERSION, HttpsTransport, InstallationToken, InstallationTokens (+7 more)

### Community 32 - "ref_node_crypto"
Cohesion: 0.08
Nodes (52): packedConsumerPnpmRepair(), sha256(), commandFeature(), reviewQuestions(), featureItemComplete(), reconcileFeatureCompletion(), discoveryPrompt(), planPrompt() (+44 more)

### Community 33 - "artifact"
Cohesion: 0.10
Nodes (48): assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), readPostConflictPreparationFacts(), reconcileCompletedConflictDraft(), routeReadyPostConflictPublication(), verifyInitialDraftConflictPreparation() (+40 more)

### Community 35 - "common.cjs"
Cohesion: 0.16
Nodes (26): connections(), fs, main(), path, atomicWrite(), crypto, ensureInside(), { execFileSync } (+18 more)

### Community 36 - "pr-observation-shape.ts"
Cohesion: 0.19
Nodes (21): withGitHubOperation(), githubPRDescription(), closingDirectives(), ObservedPR, enumValue(), fail(), graphqlPR(), mapped() (+13 more)

### Community 37 - "routing.cjs"
Cohesion: 0.11
Nodes (30): fs, main(), path, { spawnSync }, frontmatterProblems(), adjacency(), edgeCost(), edgeKey() (+22 more)

### Community 38 - "entry.ts"
Cohesion: 0.08
Nodes (29): EntryRead, EntrySchema, ID_MAX, parseEntry(), PATH_MAX, PATHS_MAX, PLAYBOOK_KINDS, PLAYBOOK_STAGES (+21 more)

### Community 39 - "lesson-selection.ts"
Cohesion: 0.15
Nodes (16): INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), LessonSelection, MAINTENANCE, MAX_LESSONS (+8 more)

### Community 40 - "Conversation.tsx"
Cohesion: 0.09
Nodes (34): ChatMarkdown(), Conversation(), ConversationDraft, createConversationDrafts(), isLessonDecision(), ChatMarkdown, MessageText(), blocker() (+26 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.12
Nodes (31): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence(), CaptureContext (+23 more)

### Community 42 - "accessibility-sources.ts"
Cohesion: 0.23
Nodes (18): accessibilitySources(), actionable(), closingPull(), Finding, handoffIssue(), issueLines(), issueSource(), observation (+10 more)

### Community 43 - ".save"
Cohesion: 0.21
Nodes (25): resolveBlockedTransition(), findComment(), LiveIssue, readIssue(), readIssues(), jira(), commentDecision(), commentRefused() (+17 more)

### Community 45 - "harness-baseline.ts"
Cohesion: 0.15
Nodes (22): BaselineReport, baselineReport(), BaselineSource, baselineText(), millions(), row(), share(), add() (+14 more)

### Community 46 - "credential-spans.ts"
Cohesion: 0.06
Nodes (39): AFTER_LABEL, BARE_CREDENTIAL, BARE_LABEL, BARE_UNIT, BARE_VALUE, CAMEL_START, CONTROL_ESCAPE, CREDENTIAL_NAME (+31 more)

### Community 47 - "rate-limit-samples.ts"
Cohesion: 0.09
Nodes (23): bindGitHubRunner(), Runner, GitHubCalls, AppPrincipals, AMBIENT_TOKENS, ChildCredential, CREDENTIAL_TRACING, GIT_HELPER (+15 more)

### Community 48 - "goal-reviews.ts"
Cohesion: 0.14
Nodes (19): currentCitations(), Fact, NOT_CURRENT, PROVIDER_ERROR, applyGoalReview(), DeliveryJob, EvidenceRefSchema, jobAccepted() (+11 more)

### Community 50 - "QuestionStepper.tsx"
Cohesion: 0.19
Nodes (18): FeatureQuestionProjection, OutboxQuestionRound(), send(), draftKey(), readDraft(), saveDraft(), QuestionRound(), nextQuestion() (+10 more)

### Community 51 - "readable-jira-comment.ts"
Cohesion: 0.14
Nodes (23): CommentPage, commentReadback(), JiraOperations, jiraRecord(), unpack(), postDevUpdate(), statusHeld(), commentPayload() (+15 more)

### Community 52 - "investigations/ledger.ts"
Cohesion: 0.08
Nodes (43): diagnosticSnapshot(), acceptedCompletionResolution(), INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationCandidates(), investigationId(), investigationEvidence(), finishedSubjectResolution() (+35 more)

### Community 53 - "run-model.ts"
Cohesion: 0.08
Nodes (39): LedgerOptions, AttributedFailure, InvocationResult, GroupState, groupState(), RotationEvidence, StagedCodex, PassProof (+31 more)

### Community 54 - "currentAssignment"
Cohesion: 0.12
Nodes (41): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+33 more)

### Community 55 - "weekly-rollup.ts"
Cohesion: 0.13
Nodes (27): learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), RollupResult (+19 more)

### Community 56 - "runner-root.ts"
Cohesion: 0.05
Nodes (84): header(), readStanding(), BILLING_MODE, guardPresent(), overseerCommand(), reconcileArgs(), resolveCliRoot(), runnerStatus() (+76 more)

### Community 57 - "delivery-recoveries.ts"
Cohesion: 0.10
Nodes (29): boardPreflightCandidate(), savedActivationFailure(), candidateInput(), children, oldAdoptionBasis(), SavedCandidateAdmission, savedCandidateAdmission(), acceptedNativeGate() (+21 more)

### Community 58 - "fact-bounds.ts"
Cohesion: 0.25
Nodes (15): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+7 more)

### Community 59 - "observe-projects.ts"
Cohesion: 0.28
Nodes (11): deliveryRetryDecisions(), FailedMailCheck, lastFailedMailCheck(), lastMailCheckOutcome(), MailCheckOutcome, ProjectObservation, LANES, observeProjects() (+3 more)

### Community 60 - "cost-ledger.ts"
Cohesion: 0.16
Nodes (26): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId(), OutsideEdit (+18 more)

### Community 61 - "demand-facts.ts"
Cohesion: 0.16
Nodes (17): clip(), DEMAND_LIMIT, demandFacts(), key(), LessonKey, notes(), clip(), MISSED_QUERY_LIMIT (+9 more)

### Community 62 - "work-summary.ts"
Cohesion: 0.09
Nodes (41): jiraQueueProgress(), nextStage(), deliveryRoles, JiraQueueProgress, TicketProgress, ROLE_NAMES, STAGE_LABELS, deliveryRepairProjection() (+33 more)

### Community 63 - "OfficeConfigView.tsx"
Cohesion: 0.31
Nodes (9): loadOfficeConfig(), OfficeConfigSection(), autoAdoptText(), BOT_NAMES, OfficeConfigState, OfficeConfigView(), policyText(), OfficeConfigSummary (+1 more)

### Community 64 - "constellation-runtime.ts"
Cohesion: 0.07
Nodes (35): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), CameraPose, flightPose(), cameraTarget() (+27 more)

### Community 65 - "validate_pr_body.cjs"
Cohesion: 0.36
Nodes (8): fs, main(), readableText(), REQUIRED_CHECKS, REQUIRED_SECTIONS, sections(), validatePullRequestBody(), withoutComments()

### Community 66 - "audit-plan-candidates.cjs"
Cohesion: 0.14
Nodes (31): audit(), branchIssueNumbers(), classify(), distinctiveTitleWords(), { execFileSync }, extractPaths(), findPrForMergeSubject(), fmtCommit() (+23 more)

### Community 67 - "pass.ts"
Cohesion: 0.03
Nodes (99): Digest, Evidence, FAILURE_ID, FailureAnswer, FailureEvent, failureLine(), FailureReceipt, HaltAnswer (+91 more)

### Community 68 - "resume-arrivals.ts"
Cohesion: 0.11
Nodes (64): restartStoppedWriters(), unchangedSinceAccepted(), DeliveryAuthorityInput, canonical(), checkpointEligibility(), admitAssignmentResume(), forAssignment(), admitCheckpointResume() (+56 more)

### Community 69 - "App.tsx"
Cohesion: 0.05
Nodes (58): releaseSoundEvents, themeColor, App(), BrainWorkspace, CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants (+50 more)

### Community 70 - "OfficeScene.tsx"
Cohesion: 0.07
Nodes (64): itAgent(), itDiagnostics(), followUpStatus(), outstandingFollowUps(), displayAgentTask(), withoutElapsed(), CameraBookmark, restoreBookmark() (+56 more)

### Community 71 - "spawn-command.ts"
Cohesion: 0.13
Nodes (23): childEnvironment(), exitFailure(), At, Errno, errno(), GroupInventory, GroupProbe, LifecycleDiagnostic (+15 more)

### Community 72 - "session-context-file.ts"
Cohesion: 0.20
Nodes (14): ContextFoldPrefix, contextFoldPrefix(), SessionContextCheckpoint, captureSessionContextClone(), ContextReadPhase, SessionContextDeadline, sessionContextFile(), ContextReadChanged (+6 more)

### Community 73 - "ref_zod"
Cohesion: 0.06
Nodes (58): escaped(), IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), projectListScope(), cecIntakePrompt(), AUTO_ADOPT_BOTS (+50 more)

### Community 74 - "session-scope.ts"
Cohesion: 0.18
Nodes (17): Bound, claudeScopeParser(), claudeSessionScope(), CLAUDE_TRANSCRIPTS, CODEX_ROLLOUTS, contextReaders(), retainSessionMessage(), SessionConversation (+9 more)

### Community 75 - "service-health.ts"
Cohesion: 0.10
Nodes (28): githubAuthError(), revalidated, slurpedPages(), succeeded(), ClaudeLoginRefusal, claudeLoginRefusal(), claudeRefusalWords(), RECORDED_REFUSALS (+20 more)

### Community 76 - "sanitizeObject"
Cohesion: 0.10
Nodes (34): AzureMonitor, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs(), fullActivePRs(), observation() (+26 more)

### Community 77 - "closeout-recovery.ts"
Cohesion: 0.11
Nodes (45): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+37 more)

### Community 78 - "incidents.ts"
Cohesion: 0.08
Nodes (48): attributedRecords(), foldsItsRun(), groupCandidates(), ObservedIncident, ObservedSubject, incidentId(), mailboxFreeze(), details() (+40 more)

### Community 79 - "agents.ts"
Cohesion: 0.05
Nodes (55): implementationWorkerContext(), RefusedQAResult, assertContinuableWorktree(), CONTINUABLE, continuationPrompt(), MAX_CONTINUATIONS, recordedContinuation(), StageContinuation (+47 more)

### Community 80 - "session-bridge.ts"
Cohesion: 0.10
Nodes (30): claudeSessionContext(), codexDaemonProcesses(), accountCodexProcesses(), CodexProcessInventory, codexProcessInventory(), DesktopSessions, unaccountedProcesses(), codexSessionContext() (+22 more)

### Community 81 - "shared.ts"
Cohesion: 0.03
Nodes (161): writerRestartInstruction(), removeAdoptedClone(), harnessCloseout(), PASSING, verifyMergeActions(), findingsBlock(), namedRepairIds(), metadataCarriedAdvisoryIds() (+153 more)

### Community 82 - "coordination-tick.ts"
Cohesion: 0.12
Nodes (17): currentOutbox(), reconcileNoticeConfirmations(), interruptAdoptions(), legacy(), REMOVED_FIELDS, retireLegacyRecovery(), goalNoticeNeverDispatched(), BrainFollowup (+9 more)

### Community 83 - "remove-candidate.ts"
Cohesion: 0.15
Nodes (22): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), maintenanceCandidate(), moveAside(), moveBack(), purgeRemoved(), purging (+14 more)

### Community 84 - "viewer.js"
Cohesion: 0.19
Nodes (25): addMetaLink(), addMetaRow(), addRelationship(), applyView(), buildIndexes(), buildLegend(), buildModel(), buildRenderer() (+17 more)

### Community 85 - "maintenance/maintenance.ts"
Cohesion: 0.13
Nodes (20): captureMaintenanceStep(), sourceFindings, sourceReview(), candidateOwner(), SETTLED, skipOwnedCandidate(), Skipped, skippedCandidateLedger() (+12 more)

### Community 86 - "stopped-record.ts"
Cohesion: 0.06
Nodes (73): capabilityBlockedReviews(), latestReviews(), boundedEvidence(), expectedWait(), StopFacts, digest(), fingerprint(), incidentNotices() (+65 more)

### Community 87 - "sanitize"
Cohesion: 0.06
Nodes (48): assertConversationReadback(), Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff(), saveGoals() (+40 more)

### Community 88 - "superseded-wiki-pr.ts"
Cohesion: 0.09
Nodes (63): commentId(), CommentIntent, CommentReceipt, conversation(), exact(), findProofComment(), matchesProofComment(), postProofComment() (+55 more)

### Community 89 - "ref_node_child_process"
Cohesion: 0.08
Nodes (26): changedPaths(), { execFileSync }, files, isMapInput(), mapOnly(), { execFileSync }, git(), publish() (+18 more)

### Community 90 - "provider-observation.ts"
Cohesion: 0.13
Nodes (26): az(), correlatedBuild(), Azure, azurePipelines(), outcome(), Read, RUNS_PER_PIPELINE, Api (+18 more)

### Community 91 - "office/config.ts"
Cohesion: 0.11
Nodes (34): twgConnection(), assetDownloader(), attachmentKind(), evidenceDirectory(), readEvidence(), storeEvidence(), blankEvidence(), CoverageState (+26 more)

### Community 92 - "session-context-client.ts"
Cohesion: 0.13
Nodes (18): readTranscript, readRollout, packContextFailure(), PackedContextFailure, unpackContextFailure(), LiveSession, ContextThread, contextThread() (+10 more)

### Community 93 - "plans.cjs"
Cohesion: 0.16
Nodes (22): substantive(), walk(), association(), auditedDigests(), candidate(), collapseByTitle(), discover(), fromMarkdown() (+14 more)

### Community 94 - "holdReason"
Cohesion: 0.04
Nodes (85): BLOCK, harnessBlockMove(), harnessParkedCard(), noted(), IntakeContext, confirmedGone(), goneQuery(), STOPPED (+77 more)

### Community 96 - "scheduled-features.ts"
Cohesion: 0.40
Nodes (12): currentApproval(), featureGate(), predecessorComplete(), DeliveryPreflight, deliveryPreflight(), handoffBinding(), readHandoff(), sameBinding() (+4 more)

### Community 97 - "jiraBinding"
Cohesion: 0.11
Nodes (12): contentSchema(), JiraIssuePublisher, publicationDescription(), FeaturePublisher, PublicationReceipt, publishFeature(), GitHubIssuePublisher, number() (+4 more)

### Community 98 - "pilot-delivery.ts"
Cohesion: 0.15
Nodes (24): candidateBranchMoved(), endChangeScope(), scopeOutgrown(), Moved, movedHeadUnconfirmed(), recordConfirmedHead(), routeConfirmedHead(), draftHeadMovedForward() (+16 more)

### Community 99 - "archive-plan.cjs"
Cohesion: 0.12
Nodes (33): fs, main(), parse(), path, archive(), cell(), ensureIndex(), fromArgs() (+25 more)

### Community 100 - "call-scope.ts"
Cohesion: 0.11
Nodes (31): failed(), graphqlCounts(), boundGitHubRunner(), currentGitHubOperation(), currentGitHubProject(), currentGitHubSource(), githubCli(), GitHubOperation (+23 more)

### Community 101 - "time-ledger.ts"
Cohesion: 0.10
Nodes (28): JiraWorklogExpected, JiraWorklogReconcile, publishableEntry(), settlementPending(), superseded(), ticketUnresolved(), Ledger, Read (+20 more)

### Community 102 - "Goals.tsx"
Cohesion: 0.14
Nodes (21): SendMessage, CTOReview(), goalState, DailyCTO(), GoalHistory(), load(), reportDate(), reviewStatus (+13 more)

### Community 103 - "on-merge-sync.cjs"
Cohesion: 0.16
Nodes (31): fieldSpan(), keyPattern(), list(), parseListLiteral(), quote(), render(), scalar(), splitFrontmatter() (+23 more)

### Community 104 - "backup-stores.ts"
Cohesion: 0.10
Nodes (36): absentAdmission(), AdmissionComparison, AdmissionSnapshot, compareAdmissions(), snapshotAdmissions(), BackupEntry, BackupInput, BackupInventory (+28 more)

### Community 105 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 106 - "controller-runtime.ts"
Cohesion: 0.10
Nodes (30): projectData(), StoreDatabase, ControllerEffects, controllerEffects(), DEPLOY_PROJECT, alive(), ControllerMachine, option() (+22 more)

### Community 107 - "harnessEffect"
Cohesion: 0.07
Nodes (76): effectKey(), LaneOperation, laneWrite(), moveCardOnce(), Lane, MOVABLE, moveLane(), resolveLane() (+68 more)

### Community 108 - "judge-resumes.ts"
Cohesion: 0.06
Nodes (44): Admission, boundaryCrossed(), Crossing, Progress, CheckpointProgress, checkpointProgress(), names(), nativeProof() (+36 more)

### Community 109 - "pr-observation-graphql.ts"
Cohesion: 0.13
Nodes (29): ChildRequest, headCheckRuns(), includeBody(), readOpenPRs(), commitOf(), ConnectionPages, embeddedHead(), fail() (+21 more)

### Community 110 - "blocker-followups.ts"
Cohesion: 0.10
Nodes (51): conversationReadbackReady(), followupOf(), pendingReadback(), queueConversationReadback(), readbackEnding(), uncertainConversations(), conversationResolved(), readBackConversations() (+43 more)

### Community 111 - "follow-production.ts"
Cohesion: 0.20
Nodes (17): awaitingJiraStatus(), awaitingProduction(), FOLLOW_DAYS, followed(), isFollowed(), Azure, AzureRead, containedIn() (+9 more)

### Community 112 - "brain-maintenance.ts"
Cohesion: 0.15
Nodes (17): maintenancePolicies(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, brainResultStop(), GateMark, gateMark(), MAX_START_RETRIES (+9 more)

### Community 113 - "index.tsx"
Cohesion: 0.04
Nodes (88): knowledgeOutbox(), OfficeProposal, RetrospectiveRecord, WeeklyRollup, LessonDecisionAction, lessonDecisionState(), readLessonDecision(), DAYS (+80 more)

### Community 114 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 115 - "run-accounting.ts"
Cohesion: 0.05
Nodes (70): BoundedRead, done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf(), comparable(), EvidenceOutcome (+62 more)

### Community 119 - "store.ts"
Cohesion: 0.07
Nodes (34): leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), systemClock, DELIVERY_CONCURRENCY, projectById(), checkpointLabel() (+26 more)

### Community 120 - "retrospective-subject.ts"
Cohesion: 0.20
Nodes (14): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, maintenanceKey(), azurePrUrl(), findSubject(), jobSubject() (+6 more)

### Community 121 - "write-boundary.ts"
Cohesion: 0.10
Nodes (32): appCredential(), operatorRollbackCredential(), GitHubIdentityRuntime, canonicalDigest(), appToken(), bindingOf(), changeDigest(), claimRefusal() (+24 more)

### Community 122 - "daily-cto.ts"
Cohesion: 0.11
Nodes (16): DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), reviewWeekday(), DailyResultSchema, FreshDailyResultSchema, GoalEvidenceRequestSchema (+8 more)

### Community 123 - "deploy-command.ts"
Cohesion: 0.10
Nodes (40): CONTROLLER_ENTRY, ControllerPin, Pin, pinnedController(), readControllerPin(), writeControllerPin(), controllerStartFailure(), controllerOf() (+32 more)

### Community 124 - "refresh-issue-state.cjs"
Cohesion: 0.24
Nodes (10): { execFileSync }, fs, issueRefs(), main(), markClosed(), openThreadLineIndexes(), parseArgs(), path (+2 more)

### Community 125 - ".emit"
Cohesion: 0.13
Nodes (27): decideImplementation(), requestQAPlanRetry(), configureChannelNotices(), configureNotices(), bindDiscoveryResume(), DiscoveryResumeInput, requeueWaitedImplement(), enqueueMetadataRecovery() (+19 more)

### Community 126 - "cec-reads.ts"
Cohesion: 0.10
Nodes (32): intakeMembership(), cecReadbackPrompt(), cecTransitionPrompt(), plainResume(), readbackDispatchGuidance(), rerunsInterruptedQA(), officeRefusedQA(), confirmSetupStopCap() (+24 more)

### Community 127 - "resume-after-sign-in.ts"
Cohesion: 0.14
Nodes (20): parksInJira(), currentEnvironmentWait(), environmentWait(), hasPendingDelivery(), resumeAfterSignIn(), signInWait(), isSetupStop(), BrowserPage (+12 more)

### Community 128 - "jira-move.ts"
Cohesion: 0.19
Nodes (20): document(), transitionWithComment(), jiraAccount(), JiraCredential, jiraCredential(), KEYCHAIN_SERVICE, readFailure(), jiraRest() (+12 more)

### Community 129 - "recovery/stopped-base-update.ts"
Cohesion: 0.07
Nodes (52): writerRestartPending(), pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), closeoutRequestResolved(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), preparationRequestResolved(), publishedDraftConflictUnresolved() (+44 more)

### Community 130 - "retry-binding.ts"
Cohesion: 0.17
Nodes (22): iso(), planDeliveryRetry(), bindRetry(), freshRetry(), inScope(), queuedDetail(), scopedRetry(), withdrawRetry() (+14 more)

### Community 131 - "MaintenanceRun"
Cohesion: 0.19
Nodes (15): CheckpointEligibility, checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), repeatedVendorReviewBlock(), stoppedInVendorReview(), leftToNextRun(), NEXT_RUN_DUE_MS (+7 more)

### Community 132 - "runner-routes.ts"
Cohesion: 0.19
Nodes (15): IncidentsRouteContext, HaltReport, absent(), HaltResult, RunnerReports, failure(), halt(), parse() (+7 more)

### Community 133 - "work.ts"
Cohesion: 0.13
Nodes (19): effectiveCause(), REPLACED, BLOCKED_CAUSES, blockedCauses(), NONE, projectReadiness(), ProjectReadiness, AssignmentResult (+11 more)

### Community 134 - "state-parts.ts"
Cohesion: 0.11
Nodes (17): [cmd,...rawArgs], readSavedState(), LARGE_KEY_CHARS, plain(), RedactedEntries, RedactedEntry, redactEntries(), joinParts() (+9 more)

### Community 135 - "triage.ts"
Cohesion: 0.04
Nodes (91): resolveRange(), Agreement, agreement(), anchor(), compare(), disposition(), factsKey(), file() (+83 more)

### Community 136 - "knowledge.ts"
Cohesion: 0.07
Nodes (29): curateLesson(), Curation, CurationAction, mergeEvidence(), LessonBrainAudit, LessonBrainOverlap, BRAIN_SCOPE, SUBJECT (+21 more)

### Community 137 - "it-specialist.ts"
Cohesion: 0.16
Nodes (15): replacedReadback(), GRAPHQL_WORK, heldFor(), ITContext, recoveryWait(), informationalRecovery(), ITSpecialist, ownAzureCheck() (+7 more)

### Community 138 - "deploy-plan.ts"
Cohesion: 0.25
Nodes (16): Body, DeploymentFenceState, fenceTokenDigest(), operationPaths(), planDeployment(), createDeployToken(), readDeployToken(), removeDeployToken() (+8 more)

### Community 139 - "scheduled-work.ts"
Cohesion: 0.07
Nodes (46): freshOwnershipRead(), settledSlackReadback(), slackRequestSettled(), deliverySlot(), Ownership, ownershipContext, refreshDeliveryOwnership(), RefreshOwnership (+38 more)

### Community 140 - "ticket-stage-runner.ts"
Cohesion: 0.15
Nodes (26): GATE_REFUSED, gateRefusedPass(), QA_STAGES, QA_STAGES, REFUSED_RECEIPT, refusedQA(), refusedQABlocker(), Run (+18 more)

### Community 141 - "metadata-park-words.ts"
Cohesion: 0.18
Nodes (17): devUpdate(), HEADLINE, OUTCOME, qaComment(), remote(), STAGE, plainWords(), tidy() (+9 more)

### Community 142 - "Store"
Cohesion: 0.03
Nodes (49): checkMail(), drainMail(), requestMail(), enableNightly(), helperTelemetry(), FeatureReviewRunner, FeatureWorkflow, noQuotaHold (+41 more)

### Community 144 - "reconcile-merges.cjs"
Cohesion: 0.22
Nodes (14): collectPulls(), copyWikiForDryRun(), { execFileSync }, flattenPages(), fs, githubRequest(), isWikiBotPull(), main() (+6 more)

### Community 145 - "inspect-closed-plan.ts"
Cohesion: 0.13
Nodes (16): assertOwnership(), closedReadonlyPlan(), Document, document(), consumeQAPlanRetry(), entryExists(), inspectClosedQAPlan(), Decision (+8 more)

### Community 146 - "requests.ts"
Cohesion: 0.07
Nodes (65): adoptCandidate(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat() (+57 more)

### Community 147 - "cec/workflow.ts"
Cohesion: 0.18
Nodes (14): applyIntakeObservation(), Carried, findingsOwedToRetest(), missingRetestDispositions(), MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), eligibility() (+6 more)

### Community 148 - "reader-profiles.ts"
Cohesion: 0.12
Nodes (23): CODEX_LAST_MESSAGE_ARGUMENT, CODEX_SCHEMA_ARGUMENT, errorCode(), prepareReaderInput(), ReaderFiles, readerFiles(), writeExclusive(), CLAUDE_EFFORTS (+15 more)

### Community 149 - "redact-evidence.ts"
Cohesion: 0.18
Nodes (12): AWS_KEY_ID, JSON_WEB_TOKEN, PROVIDER_TOKEN, redactCredentials(), redactUnquoted(), absent(), NEVER_ENABLED, ResumeControl (+4 more)

### Community 150 - "repoRoot"
Cohesion: 0.17
Nodes (14): fs, main(), parse(), path, repoRoot(), createServer(), fs, http (+6 more)

### Community 151 - "coordination-pump.ts"
Cohesion: 0.06
Nodes (55): NOT_AT_TARGET, enterBoundRetry(), parentPrerequisite(), CARD_STATUS_QUERY, cardStatusFrom(), readBackSavedDraftUpdates(), deliveryAdmission(), assessDeliveryAuthority() (+47 more)

### Community 153 - "checkpoint-completion.ts"
Cohesion: 0.23
Nodes (9): brainCheckpointCompletion(), coverageSchema, verified, PublishedPR, publishedWorkCleanedUp(), nativeChecks, outcomeKnown(), reconcileCompletedCheckpoints() (+1 more)

### Community 154 - "task-briefing.ts"
Cohesion: 0.19
Nodes (15): citations(), recordAcceptedKnowledge(), stageName(), knowledgeCitation(), lessonCitation(), boundEvidence(), EvidenceSelection, taskBriefing() (+7 more)

### Community 155 - "recorded-gh-command.ts"
Cohesion: 0.19
Nodes (20): assignments(), changeDirectory(), closing(), CREATE, createGuard(), flags(), named(), read() (+12 more)

### Community 156 - "change-scope.ts"
Cohesion: 0.17
Nodes (23): applyChangeScope(), levels(), MAX_CHECKS, owedUnderScope(), scopeBase(), settled(), statedApproach(), verifiedCandidate() (+15 more)

### Community 157 - "observe-github-merges.ts"
Cohesion: 0.30
Nodes (14): clearCooldown(), coolDown(), coolingDown(), MERGE_NOTICE_RECHECK_MS, waitKey(), waits, isMergeCommit(), issueOf() (+6 more)

### Community 158 - "identity-runtime.ts"
Cohesion: 0.10
Nodes (21): KeychainKeySource, Execute, keychainKeySource(), AppReadiness, serviceAppPrincipals, bound, service, serviceIdentity (+13 more)

### Community 160 - "bareSpans"
Cohesion: 0.19
Nodes (15): apostropheEnd(), bareSpans(), credentialSpans(), genuineGap(), headerValueEnd(), isQueryLabel(), labelBefore(), nameEnd() (+7 more)

### Community 161 - "pre-push-boundary.ts"
Cohesion: 0.27
Nodes (10): Event, exactCommand(), Invocation, localHookCommand(), one(), prePushRejection(), PushIdentity, retirementBoundary() (+2 more)

### Community 162 - "github-context.ts"
Cohesion: 0.07
Nodes (64): queueMergeNotice(), resumeProviderReviews(), reviewInstructions(), deliveryTask(), DeliveryTaskInput, observe(), settleOwnerMergedStopped(), DISCOVERY_GUIDANCE (+56 more)

### Community 163 - "json-layers.ts"
Cohesion: 0.26
Nodes (9): decode(), decodedIndex(), evenRunBefore(), JsonLayers, LayerString, opensValue(), SIMPLE, strings() (+1 more)

### Community 164 - "telemetry/report.ts"
Cohesion: 0.21
Nodes (15): TelemetryRow, TelemetrySync, Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount() (+7 more)

### Community 165 - "reconcileGitHubWrite"
Cohesion: 0.20
Nodes (11): diagnosticProof(), recoverDiscovery(), scopeNote(), GitHubOperations, validateGitHubIssue(), reconcileGitHubWrite(), writerRefused(), writerSuccessor() (+3 more)

### Community 166 - "launch.mjs"
Cohesion: 0.07
Nodes (93): RFC-9562, CHECKOUT, DEFAULT_DEADLINE_MS, existingPlist(), installOverseer(), LABEL, LAUNCHER_SOURCE, renderPlist() (+85 more)

### Community 167 - "bare-value.ts"
Cohesion: 0.30
Nodes (11): BareValue, bareValue(), deeperValueEnd(), ENDS, isSeparator(), plainEscape(), queryValue(), separatorEscapeAt() (+3 more)

### Community 168 - "admit-improvement.ts"
Cohesion: 0.22
Nodes (16): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+8 more)

### Community 169 - "continue-access-only-plan.ts"
Cohesion: 0.54
Nodes (6): Document, document(), isAccessOnlyPlan(), settledAccessOnlyState(), continueAccessOnlyPlan(), entryExists()

### Community 170 - "Button"
Cohesion: 0.14
Nodes (36): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS, PickupForm(), acceptPreferences() (+28 more)

### Community 171 - "release-manifest.ts"
Cohesion: 0.08
Nodes (40): runningRevision(), runningRevision(), runtimeRevision(), ActiveRelease, readActiveRelease(), BUILD_ENV, buildRelease(), BuildReleaseOptions (+32 more)

### Community 172 - "scope-repair-resume.ts"
Cohesion: 0.31
Nodes (14): containedFile(), Ownership, reconcileScopeRepairReadback(), scopeRepairRequestResolved(), assertScopeRepairResumeFindings(), certain(), effects(), originalClaim() (+6 more)

### Community 173 - "lesson-issue-ready.ts"
Cohesion: 0.26
Nodes (13): assignedToJoe(), fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), firstLane(), instruction(), LaneMove, move() (+5 more)

### Community 174 - "call-ledger.ts"
Cohesion: 0.25
Nodes (10): add(), addSource(), busiest(), CallLedger, Entry, sourceRows(), Sources, CallCounts (+2 more)

### Community 175 - "refused-commented-park.ts"
Cohesion: 0.28
Nodes (10): enumerateIntakeList(), inPickupOrder(), Intake, text(), jiraCollection(), jiraResponse(), digest(), reconcileRefusedCommentedPark() (+2 more)

### Community 176 - ".getEffect"
Cohesion: 0.31
Nodes (3): NOT_LANDED_SETTLE_MS, settleNotLanded(), Effects

### Community 177 - "digest"
Cohesion: 0.07
Nodes (54): GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles(), ContinuationIO (+46 more)

### Community 178 - "EffectIntent"
Cohesion: 0.24
Nodes (12): Write, attempted(), attemptState(), bound(), covers(), JiraAttempt, jiraAttempts(), JiraAttemptState (+4 more)

### Community 179 - "restart-writer.ts"
Cohesion: 0.27
Nodes (10): ATTEMPT_DELAYS_MS, nextAttemptAt(), NOT_RETRYABLE, releaseFunds(), StoppedWriter, stoppedWriter(), WRITER_STAGES, WriterRestartCandidate (+2 more)

### Community 180 - "preferences-store.ts"
Cohesion: 0.21
Nodes (8): PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, soundFields, StoredBody, OFFICE_PREFERENCE_DEFAULTS, OfficePreferences

### Community 181 - "project-bindings.ts"
Cohesion: 0.26
Nodes (10): legacyCecPrompt(), CECBinding, bindings(), frozen(), legacyCecBindings(), projectBindings(), PromptBinding, Project (+2 more)

### Community 182 - "build-overseer-launcher.mjs"
Cohesion: 0.20
Nodes (8): BANNER, builtin(), bundleLauncher(), LAUNCHER_BUNDLE, LAUNCHER_ENTRY, launcherChunk(), REPOSITORY, SCRIPT

### Community 183 - "session-snapshot-cleanup.ts"
Cohesion: 0.40
Nodes (5): SNAPSHOT_PREFIX, removeStaleSessionSnapshots(), SNAPSHOT_SWEEP_MS, STALE_SNAPSHOT_MS, sweepStaleSessionSnapshots()

### Community 184 - "quota-governor.ts"
Cohesion: 0.15
Nodes (14): boardReadFailure(), refusedByRateLimit(), GitHubMonitor, CORE_RESERVE, PROBE_INTERVAL_MS, QuotaGate, QuotaRefusal, RefusalDeadline (+6 more)

### Community 185 - "normalize-question.ts"
Cohesion: 0.27
Nodes (10): normalizeRound(), FeatureHarnessOption, FeatureOption, FeatureQuestion, FeatureRoundAuthor, folded(), normalizeQuestion(), optionId() (+2 more)

### Community 186 - "deploy.ts"
Cohesion: 0.12
Nodes (40): abandon(), advance(), deploy(), DEPLOY_STEPS, DeployFacts, append(), assertNext(), deployJournalPath() (+32 more)

### Community 187 - "create-candidate.ts"
Cohesion: 0.31
Nodes (9): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+1 more)

### Community 188 - "retire-history.ts"
Cohesion: 0.22
Nodes (7): historicalRecordDigest(), Intent, records(), Admission, AdmissionKind, HistoryRetirement, HistoryRetirementIntent

### Community 189 - "salvage-worktree.ts"
Cohesion: 0.48
Nodes (6): Execute, keptWork(), Read, refObject(), SalvageRetry, salvageWorktree()

### Community 190 - "incident-command.ts"
Cohesion: 0.38
Nodes (6): FLAGS, incidentCommand(), IncidentCommandIO, option(), USAGE, whole()

## Knowledge Gaps
- **1 isolated node(s):** `RFC-9562`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 1416 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `worker-runtime.ts`, `process.ts`, `link-draft-issue.ts`, `checkpoint-retry.ts`, `redactEvidence`, `github-readiness.ts`, `scheduled-captures.ts`, `run-retrospective.ts`, `record-trigger.ts`, `route-activation.ts`, `delivery-retry.ts`, `jira-time.ts`, `ref_node_path`, `index.ts`, `notifications.ts`, `Ticket`, `advance-metadata-park.ts`, `assignments.ts`, `assignment-context.ts`, `ref_node_crypto`, `artifact`, `Coordinator`, `entry.ts`, `lesson-selection.ts`, `time-scope.ts`, `accessibility-sources.ts`, `.save`, `Offices`, `goal-reviews.ts`, `readable-jira-comment.ts`, `investigations/ledger.ts`, `currentAssignment`, `weekly-rollup.ts`, `delivery-recoveries.ts`, `observe-projects.ts`, `cost-ledger.ts`, `demand-facts.ts`, `resume-arrivals.ts`, `ref_zod`, `sanitizeObject`, `closeout-recovery.ts`, `agents.ts`, `session-bridge.ts`, `shared.ts`, `coordination-tick.ts`, `remove-candidate.ts`, `maintenance/maintenance.ts`, `sanitize`, `superseded-wiki-pr.ts`, `provider-observation.ts`, `office/config.ts`, `holdReason`, `scheduled-features.ts`, `pilot-delivery.ts`, `time-ledger.ts`, `controller-runtime.ts`, `harnessEffect`, `judge-resumes.ts`, `pr-observation-graphql.ts`, `blocker-followups.ts`, `follow-production.ts`, `brain-maintenance.ts`, `index.tsx`, `run-accounting.ts`, `store.ts`, `retrospective-subject.ts`, `write-boundary.ts`, `.emit`, `cec-reads.ts`, `resume-after-sign-in.ts`, `jira-move.ts`, `recovery/stopped-base-update.ts`, `retry-binding.ts`, `state-parts.ts`, `it-specialist.ts`, `scheduled-work.ts`, `ticket-stage-runner.ts`, `inspect-closed-plan.ts`, `requests.ts`, `cec/workflow.ts`, `coordination-pump.ts`, `checkpoint-completion.ts`, `task-briefing.ts`, `observe-github-merges.ts`, `identity-runtime.ts`, `github-context.ts`, `telemetry/report.ts`, `reconcileGitHubWrite`, `admit-improvement.ts`, `continue-access-only-plan.ts`, `scope-repair-resume.ts`, `lesson-issue-ready.ts`, `refused-commented-park.ts`, `.getEffect`, `digest`, `EffectIntent`, `restart-writer.ts`, `quota-governor.ts`, `create-candidate.ts`, `retire-history.ts`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **What connects `RFC-9562` to the rest of the system?**
  _1 weakly-connected nodes found - possible missing edges._
- **Should `codex-handoff.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.054199328107502796 - nodes in this community are weakly interconnected._
- **Why does `command()` connect `Store` to `jira-move.ts`, `worker-runtime.ts`, `process.ts`, `runner-routes.ts`, `link-draft-issue.ts`, `incidents/routes.ts`, `redactEvidence`, `github-readiness.ts`, `scheduled-captures.ts`, `inspect-closed-plan.ts`, `requests.ts`, `cec/workflow.ts`, `sandbox-qualification.ts`, `command-registry.ts`, `coordination-pump.ts`, `ref_node_path`, `checkpoint-completion.ts`, `notifications.ts`, `jira-time.ts`, `change-scope.ts`, `assignments.ts`, `assignment-context.ts`, `identity-runtime.ts`, `Coordinator`, `reconcileGitHubWrite`, `admit-improvement.ts`, `continue-access-only-plan.ts`, `accessibility-sources.ts`, `release-manifest.ts`, `lesson-issue-ready.ts`, `rate-limit-samples.ts`, `digest`, `readable-jira-comment.ts`, `weekly-rollup.ts`, `quota-governor.ts`, `create-candidate.ts`, `cost-ledger.ts`, `salvage-worktree.ts`, `service-health.ts`, `sanitizeObject`, `closeout-recovery.ts`, `agents.ts`, `session-bridge.ts`, `shared.ts`, `coordination-tick.ts`, `remove-candidate.ts`, `maintenance/maintenance.ts`, `provider-observation.ts`, `office/config.ts`, `pilot-delivery.ts`, `call-scope.ts`, `time-ledger.ts`, `controller-runtime.ts`, `harnessEffect`, `brain-maintenance.ts`, `deploy-command.ts`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Should `Role` be split into smaller, more focused modules?**
  _Cohesion score 0.1125886524822695 - nodes in this community are weakly interconnected._
- **Why does `TicketJob` connect `shared.ts` to `recovery/stopped-base-update.ts`, `retry-binding.ts`, `cx`, `link-draft-issue.ts`, `it-specialist.ts`, `scheduled-work.ts`, `outbox.ts`, `ticket-stage-runner.ts`, `github-readiness.ts`, `scheduled-captures.ts`, `Store`, `record-trigger.ts`, `requests.ts`, `delivery-retry.ts`, `coordination-pump.ts`, `ref_node_path`, `advance-metadata-park.ts`, `observe-github-merges.ts`, `assignment-context.ts`, `artifact`, `github-context.ts`, `scope-repair-resume.ts`, `digest`, `restart-writer.ts`, `currentAssignment`, `delivery-recoveries.ts`, `fact-bounds.ts`, `create-candidate.ts`, `observe-projects.ts`, `work-summary.ts`, `resume-arrivals.ts`, `App.tsx`, `closeout-recovery.ts`, `coordination-tick.ts`, `remove-candidate.ts`, `stopped-record.ts`, `superseded-wiki-pr.ts`, `holdReason`, `call-scope.ts`, `harnessEffect`, `retrospective-subject.ts`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Should `worker-runtime.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06246799795186892 - nodes in this community are weakly interconnected._