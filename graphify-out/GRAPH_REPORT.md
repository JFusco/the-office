# Graph Report - the-office  (2026-11-28)

## Corpus Check
- 1434 files · ~665,639 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 8274 nodes · 34988 edges · 189 communities (179 shown, 10 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 1130 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `91189585`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- run-model.ts
- features.ts
- agents.ts
- features/workflow.ts
- InspectorContent.tsx
- marker-correction.ts
- budget-ledger.ts
- Button
- incidents/routes.ts
- TelemetryPanel.tsx
- sanitize
- route-activation.ts
- outbox.ts
- api-routes.ts
- request.ts
- scheduled-captures.ts
- run-retrospective.ts
- record-trigger.ts
- app-config.ts
- sandbox-qualification.ts
- command-registry.ts
- overseer-launch.mjs
- delivery-retry.ts
- jira-time.ts
- checkpoint-completion.ts
- index.ts
- notifications.ts
- change-scope.ts
- activeEffectId
- assignments.ts
- digest
- identity-runtime.ts
- offices.ts
- artifact
- work.ts
- common.cjs
- pr-observation-shape.ts
- routing.cjs
- lesson-selection.ts
- engine.ts
- shared.ts
- time-scope.ts
- accessibility-sources.ts
- .save
- Offices
- harness-baseline.ts
- security.ts
- RateLimitSamples
- store.ts
- DeploymentFence
- FeatureWorkspace.tsx
- conversations/conversations.ts
- investigations/ledger.ts
- trial-comment.ts
- office-config.ts
- alert-issue.ts
- runner-root.ts
- Coordinator
- fact-bounds.ts
- incidents.ts
- cost-ledger.ts
- supersedingDelivery
- Conversation.tsx
- redactEvidence
- publication.ts
- validate_pr_body.cjs
- audit-plan-candidates.cjs
- run.ts
- resume-arrivals.ts
- App.tsx
- cx
- spawn-command.ts
- session-context-file.ts
- local-config.ts
- session-scope.ts
- service-health.ts
- projects.ts
- ref_node_path
- call-ledger.ts
- dates.cjs
- session-bridge.ts
- accept-stage-result.ts
- interrupted-work-recovery.ts
- workKey
- viewer.js
- maintenance/maintenance.ts
- stopped-record.ts
- ForwardingState
- superseded-wiki-pr.ts
- ref_node_child_process
- provider-observation.ts
- process.ts
- session-context-client.ts
- plans.cjs
- holdReason
- capture-session-clone.py
- enrollment-gate.ts
- jiraBinding
- pilot-delivery.ts
- archive-plan.cjs
- call-scope.ts
- jira-attempts.ts
- blocker-followups.ts
- on-merge-sync.cjs
- backup-stores.ts
- extract-worker.mjs
- controller-runtime.ts
- dependency-bots/adopt.ts
- goal-reporting.ts
- pr-observation-graphql.ts
- create-candidate.ts
- work-summary.ts
- brain-maintenance.ts
- index.tsx
- slack-supersession.ts
- pre-push-boundary.ts
- qa.ts
- qa-plan-continuation.ts
- writer-restart.ts
- timed-statements.ts
- worker-sandbox-runtime.ts
- write-boundary.ts
- weekly-rollup.ts
- deploy-command.ts
- refresh-issue-state.cjs
- .emit
- merge-summary.ts
- StageResult
- indeterminate
- handsOff
- incident-command.ts
- MaintenanceRun
- release-marker-stop.ts
- coordination-pump.ts
- ref_node_sqlite
- triage.ts
- knowledge.ts
- it-specialist.ts
- likePrefix
- scheduled-work.ts
- classify-marked-commits.ts
- metadata-park-words.ts
- scheduler.ts
- production.ts
- reconcile-merges.cjs
- restoreInPlace
- implementation-recovery.ts
- run-accounting.ts
- reader-profiles.ts
- resume-control.ts
- serve-graph.cjs
- sanitizeObject
- Store
- refusal-capture.ts
- recorded-gh-command.ts
- observe-github-merges.ts
- write-credential-scope.ts
- routing.js
- ServiceHealthPanel.tsx
- github-readiness.ts
- original-git.ts
- telemetry/report.ts
- .getEffect
- launch.mjs
- release-marker-policy.ts
- admit-improvement.ts
- continue-access-only-plan.ts
- it-report.ts
- deploy-plan.ts
- goal-reviews.ts
- EffectIntent
- copy.ts
- restart-writer.ts
- preferences-store.ts
- session-snapshot-cleanup.ts
- quota-governor.ts
- deploy.ts
- github-delivery.ts
- return-marked-candidate.ts
- ref_node_crypto
- harnessEffect
- evidence.ts
- validate_wiki_pr_body.cjs
- proof-comment.ts
- Goals.tsx
- coordination.ts
- ref_zod
- cli.ts
- evidenceText

## God Nodes (most connected - your core abstractions)
1. `Store` - 504 edges
2. `TicketJob` - 263 edges
3. `digest()` - 183 edges
4. `command()` - 167 edges
5. `GitHubDelivery` - 149 edges
6. `holdReason()` - 145 edges
7. `OfficeSnapshot` - 123 edges
8. `artifact()` - 121 edges
9. `StageResult` - 117 edges
10. `workKey()` - 112 edges

## Surprising Connections (you probably didn't know these)
- `publish()` --indirect_call--> `title()`  [INFERRED]
  scripts/graphify/publish-refresh.cjs → src/knowledge/map/grouping.ts
- `BreakdownTable()` --indirect_call--> `cell()`  [INFERRED]
  src/telemetry/BreakdownTable.tsx → scripts/wiki/archive-plan.cjs
- `apply()` --indirect_call--> `note()`  [INFERRED]
  src/conversations/OutboxSavedImplementation.tsx → server/cec/parking/resume-parked.ts
- `OwnerStepItem` --references--> `OwnerSteps`  [EXTRACTED]
  server/conversations/owner-step-items.ts → src/contracts/owner-steps.ts
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

## Communities (189 total, 10 thin omitted)

### Community 0 - "run-model.ts"
Cohesion: 0.04
Nodes (119): LedgerOptions, AttributedFailure, NotDispatched, claudeGeneration(), ClaudeSignIn, normalizeClaudeToken(), readClaudeSignIn(), claimText() (+111 more)

### Community 1 - "features.ts"
Cohesion: 0.08
Nodes (43): commandFeature(), reviewQuestions(), GitHubFeaturePublisher, DELAYS, MAX_EXECUTIONS, MAX_REPLANS, applyHarnessAction(), HarnessActionInput (+35 more)

### Community 2 - "agents.ts"
Cohesion: 0.03
Nodes (91): implementationWorkerContext(), savedStageCompletion(), assertContinuableWorktree(), CONTINUABLE, continuationPrompt(), MAX_CONTINUATIONS, recordedContinuation(), StageContinuation (+83 more)

### Community 3 - "features/workflow.ts"
Cohesion: 0.07
Nodes (52): approveFeature(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), discoveryPrompt(), planPrompt(), artifactPath() (+44 more)

### Community 4 - "InspectorContent.tsx"
Cohesion: 0.08
Nodes (90): Outbox(), ServiceHealthPanel(), followUp(), labels, ServiceHealthRow(), BlockerFollowups(), LearningCoverage(), Evidence() (+82 more)

### Community 5 - "marker-correction.ts"
Cohesion: 0.11
Nodes (30): correctionChecks(), HISTORY_SENSITIVE, HISTORY_UNRUNNABLE, REQUIRED_HISTORY_CHECKS, requiredScripts(), applyCorrection(), moveBranch(), CorrectionInput (+22 more)

### Community 6 - "budget-ledger.ts"
Cohesion: 0.05
Nodes (65): abandonExpired(), Admission, admit(), admitDeployment(), balance(), bindEvidence(), count(), errcode() (+57 more)

### Community 7 - "Button"
Cohesion: 0.04
Nodes (94): KnowledgeActivity, KnowledgeActivityPage, KnowledgeEdge, KnowledgeMap, KnowledgeNode, Activity(), ActivityTimeline(), AssignmentKnowledge() (+86 more)

### Community 8 - "incidents/routes.ts"
Cohesion: 0.06
Nodes (53): citationFault(), CitationSchema, ClaimedRange, ResolvedRange, SourceVersions, sourceVersions(), dismiss(), DISMISSAL_CITATIONS (+45 more)

### Community 9 - "TelemetryPanel.tsx"
Cohesion: 0.10
Nodes (38): TelemetryReport, LiveAnchor, AzureBuild, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens() (+30 more)

### Community 10 - "sanitize"
Cohesion: 0.03
Nodes (116): Digest, Evidence, FAILURE_ID, FailureAnswer, failureDigest(), FailureEvent, failureLine(), FailureReceipt (+108 more)

### Community 11 - "route-activation.ts"
Cohesion: 0.12
Nodes (38): ActiveEntry, GitHubAppConfig, RouteEntry, githubIdentity(), appSelected(), discoveredAuthor(), discoveryAuthors(), expectedAuthor() (+30 more)

### Community 12 - "outbox.ts"
Cohesion: 0.11
Nodes (30): capabilityBlockedReviews(), latestReviews(), ctoInputIdentityMatches(), ctoInputRecovered(), metadataParkAction(), ADOPTION_STALLED_MS, conversationResolved(), projectOutbox() (+22 more)

### Community 13 - "api-routes.ts"
Cohesion: 0.18
Nodes (16): implementationContinuationRoute(), qaPlanRetryRoute(), servedOutbox(), isNotice(), readNotices(), goalHistory(), apiRoute(), fileResponse() (+8 more)

### Community 14 - "request.ts"
Cohesion: 0.08
Nodes (61): MISSING_NATIVE_LINK, observeAutomationConflict(), VERB, REBASE, rebaseArgs(), rebaseComment(), belongsTo(), botOf() (+53 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.16
Nodes (45): createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), CaptureRequest, captureRequest() (+37 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.07
Nodes (54): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, BlockingTrigger, blockingTrigger(), isBlocking() (+46 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.07
Nodes (54): bindLegacyRetries(), LEGACY_LIMIT, deliveryMetrics(), median(), baselined(), baselineLearning(), expireLearningPackets(), LEARNING_BASELINES (+46 more)

### Community 18 - "app-config.ts"
Cohesion: 0.14
Nodes (22): effectId(), entry(), fail(), KnownProject, only(), parseGitHubApp(), positive(), record() (+14 more)

### Community 19 - "sandbox-qualification.ts"
Cohesion: 0.04
Nodes (97): timeoutsValid(), ReaderAuthentication, checkRunDirectories(), Child, CHILDREN, DIRECTORY_MODES, DirectoryFacts, layout() (+89 more)

### Community 20 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 21 - "overseer-launch.mjs"
Cohesion: 0.07
Nodes (80): acquireLauncherLock(), alone(), ancestry(), assertDirectoryOrAbsent(), attemptRecord(), bounded(), boundedString(), checkOwnedFile() (+72 more)

### Community 22 - "delivery-retry.ts"
Cohesion: 0.10
Nodes (49): DeliveryRetryDecision, deliveryRetryDecision(), deliveryRetryDecisions(), retryable(), RetryStore, UnsettledRead, BOARD_STOP, boardOnly() (+41 more)

### Community 23 - "jira-time.ts"
Cohesion: 0.09
Nodes (38): unresolvedAttempts(), bindingOf(), connectWith(), data(), envelope(), finishVerifiedEffects(), JiraWorklogs, locks (+30 more)

### Community 24 - "checkpoint-completion.ts"
Cohesion: 0.21
Nodes (10): BrainStatusSchema, brainCheckpointCompletion(), coverageSchema, verified, PublishedPR, publishedWorkCleanedUp(), nativeChecks, outcomeKnown() (+2 more)

### Community 25 - "index.ts"
Cohesion: 0.09
Nodes (24): close(), config, itSpecialist, loadedRevision, offices, releaseLock, respond(), server (+16 more)

### Community 26 - "notifications.ts"
Cohesion: 0.14
Nodes (18): channelNoticeAuthorized(), ChannelSettings, notices(), queueChannelNotice(), Identity, MergeNotifications, NoticeSettings, reconcileNoticeConfirmations() (+10 more)

### Community 27 - "change-scope.ts"
Cohesion: 0.10
Nodes (36): applyChangeScope(), levels(), MAX_CHECKS, owedUnderScope(), scopeBase(), settled(), statedApproach(), verifiedCandidate() (+28 more)

### Community 28 - "activeEffectId"
Cohesion: 0.10
Nodes (61): activeEffectId(), advanceMetadataPark(), Parked, releaseWords(), sentAnything(), CardResumeRoute, cardResumeRoute(), effectiveParkPickup() (+53 more)

### Community 29 - "assignments.ts"
Cohesion: 0.06
Nodes (53): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, CommittedBrain (+45 more)

### Community 30 - "digest"
Cohesion: 0.07
Nodes (80): retryRead(), createdContentSha256(), Binding, historyBeforeWrite(), matchesBoundDescription(), DescriptionEdit, DescriptionHistory, DescriptionHistoryUnavailable (+72 more)

### Community 31 - "identity-runtime.ts"
Cohesion: 0.08
Nodes (27): KeychainKeySource, appJwt(), base64url(), signingKey(), AppKeySource, Execute, keychainKeySource(), AppReadiness (+19 more)

### Community 32 - "offices.ts"
Cohesion: 0.13
Nodes (26): featureItemComplete(), reconcileFeatureCompletion(), reserveReplacement(), stageBudget(), confirmBrief(), classifyFeatureFailure(), automaticEnabled(), automaticFeature() (+18 more)

### Community 33 - "artifact"
Cohesion: 0.05
Nodes (93): boardPreflightCandidate(), Ownership, candidateInput(), children, oldAdoptionBasis(), SavedCandidateAdmission, savedCandidateAdmission(), assertPostConflictFiles() (+85 more)

### Community 34 - "work.ts"
Cohesion: 0.05
Nodes (56): boundaryCrossed(), Crossing, Progress, CheckpointProgress, checkpointProgress(), names(), nativeProof(), Step (+48 more)

### Community 35 - "common.cjs"
Cohesion: 0.18
Nodes (22): connections(), fs, main(), path, crypto, ensureInside(), { execFileSync }, fs (+14 more)

### Community 36 - "pr-observation-shape.ts"
Cohesion: 0.21
Nodes (19): githubPRDescription(), closingDirectives(), ObservedPR, enumValue(), fail(), graphqlPR(), mapped(), member() (+11 more)

### Community 37 - "routing.cjs"
Cohesion: 0.14
Nodes (27): main(), parseArgs(), usage(), adjacency(), edgeCost(), edgeKey(), edgeType(), EVIDENCE_TYPE_PRIORITY (+19 more)

### Community 38 - "lesson-selection.ts"
Cohesion: 0.05
Nodes (48): officeKnowledgeSnapshot(), lessonForProject(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), LessonSelection (+40 more)

### Community 39 - "engine.ts"
Cohesion: 0.07
Nodes (12): AzureMonitor, checkMail(), drainMail(), requestMail(), enableNightly(), ingest(), ResumeProject, drainMaintenance() (+4 more)

### Community 40 - "shared.ts"
Cohesion: 0.04
Nodes (101): DailyCTOSummary, OwnerSteps, Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+93 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.18
Nodes (22): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), midnight(), TicketDay (+14 more)

### Community 42 - "accessibility-sources.ts"
Cohesion: 0.12
Nodes (25): PublicationReceipt, Assign, Board, Content, GitHubIssuePublisher, number(), same(), actionable() (+17 more)

### Community 43 - ".save"
Cohesion: 0.07
Nodes (76): enumerateIntakeList(), inPickupOrder(), Intake, text(), resolveBlockedTransition(), document(), transitionWithComment(), jiraAccount() (+68 more)

### Community 44 - "Offices"
Cohesion: 0.12
Nodes (7): GitHubCalls, seedOfficeLessons(), file, project, root, projectById(), Offices

### Community 45 - "harness-baseline.ts"
Cohesion: 0.15
Nodes (22): BaselineReport, baselineReport(), BaselineSource, baselineText(), millions(), row(), share(), add() (+14 more)

### Community 46 - "security.ts"
Cohesion: 0.04
Nodes (84): BareValue, bareValue(), deeperValueEnd(), ENDS, isSeparator(), plainEscape(), queryValue(), separatorEscapeAt() (+76 more)

### Community 47 - "RateLimitSamples"
Cohesion: 0.18
Nodes (7): AppPrincipals, WriteCredential, SelectedWriter, iso(), of(), RateLimitSamples, view()

### Community 48 - "store.ts"
Cohesion: 0.08
Nodes (43): assertOwnership(), decideImplementation(), ImplementationDecision, OwnershipRead, interruptedImplementation(), closedReadonlyPlan(), Document, document() (+35 more)

### Community 50 - "FeatureWorkspace.tsx"
Cohesion: 0.11
Nodes (29): FeatureQuestionProjection, OutboxQuestionRound(), send(), FeatureDelivery(), FeatureDocuments(), views, FeatureReading(), FeatureWorkspace() (+21 more)

### Community 51 - "conversations/conversations.ts"
Cohesion: 0.09
Nodes (18): ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff(), saveGoals() (+10 more)

### Community 52 - "investigations/ledger.ts"
Cohesion: 0.16
Nodes (20): acceptedCompletionResolution(), investigationCandidates(), investigationId(), finishedSubjectResolution(), investigationFollowUps(), interruptedQARerunResolution(), investigationResolution(), syncInvestigations() (+12 more)

### Community 53 - "trial-comment.ts"
Cohesion: 0.13
Nodes (37): CommentReceipt, ProofComment, dispatchSecond(), issueUrl(), proofCommentQualification(), QualifyEntry, assertSavedTrial(), isTrialWriter() (+29 more)

### Community 54 - "office-config.ts"
Cohesion: 0.11
Nodes (20): AUTO_ADOPT_BOTS, AutoAdoptBot, EffectiveAutoAdopt, effectiveAutoAdopt(), ServiceContext, OfficeConfigInputs, officeConfigRoute(), officeConfigSummary() (+12 more)

### Community 55 - "alert-issue.ts"
Cohesion: 0.16
Nodes (24): AlertIssue, alertIssueBody(), alertIssueTitle(), alertMarker(), closeAlertIssue(), ensureAlertIssue(), findAlertIssue(), Guard (+16 more)

### Community 56 - "runner-root.ts"
Cohesion: 0.06
Nodes (69): readCeiling(), reconcile(), guardPresent(), overseerCommand(), reconcileArgs(), resolveCliRoot(), runnerStatus(), officeUrl() (+61 more)

### Community 58 - "fact-bounds.ts"
Cohesion: 0.18
Nodes (19): leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance() (+11 more)

### Community 59 - "incidents.ts"
Cohesion: 0.06
Nodes (66): attributedRecords(), foldsItsRun(), groupCandidates(), ObservedIncident, ObservedSubject, digest(), fingerprint(), incidentId() (+58 more)

### Community 60 - "cost-ledger.ts"
Cohesion: 0.13
Nodes (32): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress(), effectId() (+24 more)

### Community 61 - "supersedingDelivery"
Cohesion: 0.26
Nodes (11): finishSupersededReadback(), projectSlackDeliveries(), dueSlackReread(), rereadUncertainSlack(), runningRevision(), settleRequestedSlackReplacement(), Input, supersedeSlackDelivery() (+3 more)

### Community 62 - "Conversation.tsx"
Cohesion: 0.09
Nodes (33): ChatMarkdown(), Conversation(), ConversationDraft, isLessonDecision(), ChatMarkdown, MessageText(), blocker(), recommendedReply() (+25 more)

### Community 63 - "redactEvidence"
Cohesion: 0.06
Nodes (60): inHistoryOf(), CompareMemory, compareMemory(), COMPARES_PER_PASS, comparison(), DeployedFixes, DeployedFixesInput, recordDeployedFixes() (+52 more)

### Community 64 - "publication.ts"
Cohesion: 0.26
Nodes (7): featureById(), FeaturePublisher, publishFeature(), reconcilePublication(), uncertainPublications(), reserveIdentity(), EffectUncertainError

### Community 65 - "validate_pr_body.cjs"
Cohesion: 0.36
Nodes (8): fs, main(), readableText(), REQUIRED_CHECKS, REQUIRED_SECTIONS, sections(), validatePullRequestBody(), withoutComments()

### Community 66 - "audit-plan-candidates.cjs"
Cohesion: 0.14
Nodes (31): audit(), branchIssueNumbers(), classify(), distinctiveTitleWords(), { execFileSync }, extractPaths(), findPrForMergeSubject(), fmtCommit() (+23 more)

### Community 67 - "run.ts"
Cohesion: 0.21
Nodes (13): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, OFFICE_FIX_PROMPT, OfficeFixResult, validateOfficeFix(), investigationReady(), InvestigationOptions, InvestigationReport (+5 more)

### Community 68 - "resume-arrivals.ts"
Cohesion: 0.10
Nodes (68): SETUP_STOP_CAP, canonical(), assessResumes(), Standing, CheckpointEligibility, checkpointEligibility(), admitAssignmentResume(), forAssignment() (+60 more)

### Community 69 - "App.tsx"
Cohesion: 0.05
Nodes (65): createConversationDrafts(), BrainDrawer(), App(), BrainWorkspace, CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants (+57 more)

### Community 70 - "cx"
Cohesion: 0.08
Nodes (59): displayAgentTask(), withoutElapsed(), CameraBookmark, restoreBookmark(), LiveAgentTask(), Props, RunningTask(), text() (+51 more)

### Community 71 - "spawn-command.ts"
Cohesion: 0.13
Nodes (23): childEnvironment(), exitFailure(), inactivityWatch(), At, Errno, errno(), GroupInventory, GroupProbe (+15 more)

### Community 72 - "session-context-file.ts"
Cohesion: 0.20
Nodes (14): ContextFoldPrefix, contextFoldPrefix(), SessionContextCheckpoint, captureSessionContextClone(), ContextReadPhase, SessionContextDeadline, sessionContextFile(), ContextReadChanged (+6 more)

### Community 73 - "local-config.ts"
Cohesion: 0.12
Nodes (32): escaped(), projectListScope(), assertFeaturePlanningConfig(), goalEvidencePath(), azureSchema, deploymentSchema, jiraSchema, ownJiraSchema (+24 more)

### Community 74 - "session-scope.ts"
Cohesion: 0.18
Nodes (17): Bound, claudeScopeParser(), claudeSessionScope(), CLAUDE_TRANSCRIPTS, CODEX_ROLLOUTS, contextReaders(), retainSessionMessage(), SessionConversation (+9 more)

### Community 75 - "service-health.ts"
Cohesion: 0.11
Nodes (22): ClaudeLoginRefusal, claudeLoginRefusal(), claudeRefusalWords(), RECORDED_REFUSALS, refusedClaudeRow(), listenerHealth(), providers, ProviderStatusChecks (+14 more)

### Community 76 - "projects.ts"
Cohesion: 0.07
Nodes (52): az(), buildUrl(), prUrl(), readInPairs(), intakeLocation(), ProviderPR, readAzurePRs(), fullActivePRs() (+44 more)

### Community 77 - "ref_node_path"
Cohesion: 0.06
Nodes (73): recoverCTOInput(), closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2 (+65 more)

### Community 78 - "call-ledger.ts"
Cohesion: 0.25
Nodes (10): add(), addSource(), busiest(), CallLedger, Entry, sourceRows(), Sources, CallCounts (+2 more)

### Community 79 - "dates.cjs"
Cohesion: 0.31
Nodes (12): today(), dateFromPlanBasename(), dateFromSessionPath(), evidenceDates(), fileMtimeDate(), fs, gitCommitDate(), inferPlanDate() (+4 more)

### Community 80 - "session-bridge.ts"
Cohesion: 0.10
Nodes (30): claudeSessionContext(), codexDaemonProcesses(), accountCodexProcesses(), CodexProcessInventory, codexProcessInventory(), DesktopSessions, unaccountedProcesses(), codexSessionContext() (+22 more)

### Community 81 - "accept-stage-result.ts"
Cohesion: 0.06
Nodes (77): containedFile(), needsDecision(), acceptStageResult(), StageContext, acceptConflictRepair(), recordJobApproach(), deliveryNextStage(), pendingPreparationCheck() (+69 more)

### Community 82 - "interrupted-work-recovery.ts"
Cohesion: 0.36
Nodes (7): interruptAdoptions(), legacy(), REMOVED_FIELDS, retireLegacyRecovery(), goalNoticeNeverDispatched(), maintenanceNoticeNeverDispatched(), recover()

### Community 83 - "workKey"
Cohesion: 0.06
Nodes (59): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), maintenanceCandidate(), moveAside(), moveBack(), purgeRemoved(), purging (+51 more)

### Community 84 - "viewer.js"
Cohesion: 0.19
Nodes (25): addMetaLink(), addMetaRow(), addRelationship(), applyView(), buildIndexes(), buildLegend(), buildModel(), buildRenderer() (+17 more)

### Community 85 - "maintenance/maintenance.ts"
Cohesion: 0.11
Nodes (24): captureMaintenanceStep(), accessibilitySources(), reconcileSourceScan(), sourceFindings, sourceReview(), SETTLED, skipOwnedCandidate(), Skipped (+16 more)

### Community 86 - "stopped-record.ts"
Cohesion: 0.08
Nodes (60): boundedEvidence(), expectedWait(), StopFacts, FailedMailCheck, lastFailedMailCheck(), lastMailCheckOutcome(), MailCheckOutcome, normalizeCause() (+52 more)

### Community 88 - "superseded-wiki-pr.ts"
Cohesion: 0.12
Nodes (48): abandon(), assertOpenSnapshot(), awaitingContainment(), closeIssue(), CloseRevalidationError, closeSuperseded(), comment(), CommentStep (+40 more)

### Community 89 - "ref_node_child_process"
Cohesion: 0.10
Nodes (22): changedPaths(), { execFileSync }, files, isMapInput(), mapOnly(), { execFileSync }, git(), publish() (+14 more)

### Community 90 - "provider-observation.ts"
Cohesion: 0.08
Nodes (42): correlatedBuild(), currentEnvironmentWait(), hasPendingDelivery(), resumeAfterSignIn(), signInWait(), Azure, azurePipelines(), outcome() (+34 more)

### Community 91 - "process.ts"
Cohesion: 0.07
Nodes (57): CommentPage, commentReadback(), devUpdate(), HEADLINE, Assignment, jiraText(), Transition, jiraRecord() (+49 more)

### Community 92 - "session-context-client.ts"
Cohesion: 0.13
Nodes (18): readTranscript, readRollout, packContextFailure(), PackedContextFailure, unpackContextFailure(), LiveSession, ContextThread, contextThread() (+10 more)

### Community 93 - "plans.cjs"
Cohesion: 0.12
Nodes (27): fs, main(), parse(), path, atomicWrite(), substantive(), walk(), association() (+19 more)

### Community 94 - "holdReason"
Cohesion: 0.06
Nodes (63): currentOutbox(), metadataCarriedAdvisoryIds(), ownedBefore(), QA_STAGES, reviewAdvisoryIds(), Reviewed, withoutReviewAdvisories(), confirmedGone() (+55 more)

### Community 96 - "enrollment-gate.ts"
Cohesion: 0.32
Nodes (14): bindFeature(), currentApproval(), featureGate(), predecessorComplete(), automaticIntakeWait(), DeliveryPreflight, deliveryPreflight(), handoffBinding() (+6 more)

### Community 97 - "jiraBinding"
Cohesion: 0.20
Nodes (6): contentSchema(), JiraIssuePublisher, descriptionPreimage(), plain(), publicationDescription(), jiraBinding()

### Community 98 - "pilot-delivery.ts"
Cohesion: 0.06
Nodes (74): candidateBranchMoved(), endChangeScope(), scopeOutgrown(), confirmsMovedHead(), Moved, movedHeadUnconfirmed(), recordConfirmedHead(), routeConfirmedHead() (+66 more)

### Community 99 - "archive-plan.cjs"
Cohesion: 0.17
Nodes (22): fs, main(), parse(), path, archive(), cell(), ensureIndex(), fromArgs() (+14 more)

### Community 100 - "call-scope.ts"
Cohesion: 0.10
Nodes (42): failed(), githubAuthError(), graphqlCounts(), refusedByRateLimit(), revalidated, slurpedPages(), succeeded(), bindGitHubRunner() (+34 more)

### Community 101 - "jira-attempts.ts"
Cohesion: 0.09
Nodes (34): attempted(), attemptState(), bound(), covers(), JiraAttempt, jiraAttempts(), JiraAttemptState, open() (+26 more)

### Community 102 - "blocker-followups.ts"
Cohesion: 0.09
Nodes (56): conversationReadbackReady(), followupOf(), pendingReadback(), queueConversationReadback(), readbackEnding(), replacedReadback(), uncertainConversations(), readBackConversations() (+48 more)

### Community 103 - "on-merge-sync.cjs"
Cohesion: 0.15
Nodes (28): fs, main(), path, { spawnSync }, fieldSpan(), frontmatterProblems(), keyPattern(), list() (+20 more)

### Community 104 - "backup-stores.ts"
Cohesion: 0.10
Nodes (36): absentAdmission(), AdmissionComparison, AdmissionSnapshot, compareAdmissions(), snapshotAdmissions(), BackupEntry, BackupInput, BackupInventory (+28 more)

### Community 105 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 106 - "controller-runtime.ts"
Cohesion: 0.11
Nodes (24): projectData(), StoreDatabase, ControllerEffects, controllerEffects(), DEPLOY_PROJECT, alive(), ControllerMachine, option() (+16 more)

### Community 107 - "dependency-bots/adopt.ts"
Cohesion: 0.09
Nodes (42): Execute, readBackOrThrow(), closesIssue(), linkPR(), DependabotPR, dependabotPR(), ensureTrackingIssue(), findTrackingIssue() (+34 more)

### Community 108 - "goal-reporting.ts"
Cohesion: 0.35
Nodes (10): assertConversationReadback(), pump(), savePickup(), harperHandoff(), acceptedGoalReport(), GOAL_REPORT_GUIDANCE, GoalReport, permitsGoalEvidenceReturn() (+2 more)

### Community 109 - "pr-observation-graphql.ts"
Cohesion: 0.13
Nodes (30): responseBody(), ChildRequest, headCheckRuns(), includeBody(), readOpenPRs(), commitOf(), ConnectionPages, embeddedHead() (+22 more)

### Community 110 - "create-candidate.ts"
Cohesion: 0.31
Nodes (9): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+1 more)

### Community 111 - "work-summary.ts"
Cohesion: 0.12
Nodes (32): deliveryRoles, JiraQueueProgress, TicketProgress, ROLE_NAMES, STAGE_LABELS, STAGE_ROLE, deliveryRepairProjection(), ACTIVE (+24 more)

### Community 112 - "brain-maintenance.ts"
Cohesion: 0.15
Nodes (16): maintenancePolicies(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, brainResultStop(), GateMark, gateMark(), MAX_START_RETRIES (+8 more)

### Community 113 - "index.tsx"
Cohesion: 0.08
Nodes (49): releaseSoundEvents, themeColor, SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS (+41 more)

### Community 114 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 115 - "pre-push-boundary.ts"
Cohesion: 0.27
Nodes (10): Event, exactCommand(), Invocation, localHookCommand(), one(), prePushRejection(), PushIdentity, retirementBoundary() (+2 more)

### Community 119 - "timed-statements.ts"
Cohesion: 0.17
Nodes (14): StoreTiming, StoreTimings, storeTimings(), NAMED, rowsText(), rowText(), SQL_TOKEN, statementName() (+6 more)

### Community 120 - "worker-sandbox-runtime.ts"
Cohesion: 0.39
Nodes (8): code(), INSTALLATION, overlaps(), packageFolder(), regularFile(), RuntimeFacts, SANDBOX_RUNTIME, trustedSandbox()

### Community 121 - "write-boundary.ts"
Cohesion: 0.13
Nodes (24): AMBIENT_TOKENS, appCredential(), ChildCredential, CREDENTIAL_TRACING, GIT_HELPER, operatorRollbackCredential(), PROMPTS, GitHubIdentityRuntime (+16 more)

### Community 122 - "weekly-rollup.ts"
Cohesion: 0.05
Nodes (50): learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), BRAIN_SCOPE (+42 more)

### Community 123 - "deploy-command.ts"
Cohesion: 0.08
Nodes (58): CONTROLLER_ENTRY, ControllerPin, Pin, pinnedController(), readControllerPin(), writeControllerPin(), controllerStartFailure(), controllerOf() (+50 more)

### Community 124 - "refresh-issue-state.cjs"
Cohesion: 0.20
Nodes (19): advanceFence(), closingIssues(), githubRefs(), key(), normalizeGithubQuery(), normalizeRepository(), parseGithubQuery(), ref() (+11 more)

### Community 125 - ".emit"
Cohesion: 0.20
Nodes (14): requestQAPlanRetry(), configureChannelNotices(), configureNotices(), noticeState(), retryRecipientLookup(), DiscoveryResumeInput, requeueWaitedImplement(), declineLessonIssue() (+6 more)

### Community 126 - "merge-summary.ts"
Cohesion: 0.36
Nodes (7): clamp(), LIMITS, MergedPR, plainSlackText(), section(), shippedSummary(), mergeText()

### Community 127 - "StageResult"
Cohesion: 0.04
Nodes (86): carriedNotRepeated(), changeScopeNote(), Scoped, IntakeBinding, intakeEnumeration(), intakeJql(), intakeMembership(), JiraOperations (+78 more)

### Community 128 - "indeterminate"
Cohesion: 0.21
Nodes (19): CommitObject, commitOid(), MAX_SUFFIX, parseCommit(), readCommit(), readSuffix(), withFinalLF(), Git (+11 more)

### Community 129 - "handsOff"
Cohesion: 0.06
Nodes (71): writerRestartPending(), removeAdoptedClone(), deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, deliveryIntakeBlocker(), gateRegisteredDelivery() (+63 more)

### Community 130 - "incident-command.ts"
Cohesion: 0.38
Nodes (6): FLAGS, incidentCommand(), IncidentCommandIO, option(), USAGE, whole()

### Community 131 - "MaintenanceRun"
Cohesion: 0.22
Nodes (14): checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), repeatedVendorReviewBlock(), stoppedInVendorReview(), leftToNextRun(), NEXT_RUN_DUE_MS, night() (+6 more)

### Community 132 - "release-marker-stop.ts"
Cohesion: 0.17
Nodes (19): attachCheckout(), interruptCorrectionAtStartup(), interruptedCorrection(), observeCorrectionCheckout(), observeInterruptedCorrections(), pendingOf(), persistMarkerStop(), correctionIdentity() (+11 more)

### Community 133 - "coordination-pump.ts"
Cohesion: 0.11
Nodes (29): Admission, admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, compatible(), dependencyCompletionKey(), dependencyEligibility() (+21 more)

### Community 134 - "ref_node_sqlite"
Cohesion: 0.11
Nodes (19): checkpointLabel(), readSavedState(), LARGE_KEY_CHARS, plain(), RedactedEntries, RedactedEntry, redactEntries(), joinParts() (+11 more)

### Community 135 - "triage.ts"
Cohesion: 0.04
Nodes (91): resolveRange(), Agreement, agreement(), anchor(), compare(), disposition(), factsKey(), file() (+83 more)

### Community 136 - "knowledge.ts"
Cohesion: 0.05
Nodes (45): normalizeStatement(), curateLesson(), Curation, CurationAction, mergeEvidence(), LessonBrainAudit, LessonBrainOverlap, decideOfficeProposal() (+37 more)

### Community 137 - "it-specialist.ts"
Cohesion: 0.14
Nodes (22): savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), heldFor(), ITContext, recoveryHeld(), recoveryWait() (+14 more)

### Community 138 - "likePrefix"
Cohesion: 0.47
Nodes (3): NOT_LANDED_SETTLE_MS, settleNotLanded(), likePrefix()

### Community 139 - "scheduled-work.ts"
Cohesion: 0.06
Nodes (48): freshOwnershipRead(), deliverySlot(), Ownership, ownershipContext, refreshDeliveryOwnership(), RefreshOwnership, withAmendmentOwnership(), metadataRequestResolved() (+40 more)

### Community 140 - "classify-marked-commits.ts"
Cohesion: 0.11
Nodes (32): Classification, ClassifyInput, classifyMarkedCommits(), assertSingleRoot(), Inventory, npmEnvironment(), NpmTool, PACK_FLAGS (+24 more)

### Community 141 - "metadata-park-words.ts"
Cohesion: 0.42
Nodes (9): field(), FIELDS, MetadataField, metadataFields(), metadataParkWords(), metadataStopWords(), needed(), sentence() (+1 more)

### Community 142 - "scheduler.ts"
Cohesion: 0.15
Nodes (14): PROJECT_LOCAL, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch(), deliveryOccupied() (+6 more)

### Community 144 - "reconcile-merges.cjs"
Cohesion: 0.22
Nodes (14): collectPulls(), copyWikiForDryRun(), { execFileSync }, flattenPages(), fs, githubRequest(), isWikiBotPull(), main() (+6 more)

### Community 145 - "restoreInPlace"
Cohesion: 0.60
Nodes (5): identity(), Json, plain(), restorable(), restoreInPlace()

### Community 146 - "implementation-recovery.ts"
Cohesion: 0.06
Nodes (94): blob(), Execute, inspectPartialWorktree(), partialLocalCleanupCandidate(), partialLocalCleanupKey(), requireProof(), statIdentity(), activationAuditResponseSchema() (+86 more)

### Community 147 - "run-accounting.ts"
Cohesion: 0.05
Nodes (66): knownAmount(), BoundedRead, done(), readBoundedNoFollow(), reasonOf(), comparable(), EvidenceOutcome, recordRunEvidence() (+58 more)

### Community 148 - "reader-profiles.ts"
Cohesion: 0.12
Nodes (23): CODEX_LAST_MESSAGE_ARGUMENT, CODEX_SCHEMA_ARGUMENT, errorCode(), prepareReaderInput(), ReaderFiles, readerFiles(), writeExclusive(), CLAUDE_EFFORTS (+15 more)

### Community 149 - "resume-control.ts"
Cohesion: 0.14
Nodes (12): absent(), NEVER_ENABLED, ResumeControl, stated(), Stored, unreadable(), IncidentsRouteContext, absent() (+4 more)

### Community 150 - "serve-graph.cjs"
Cohesion: 0.24
Nodes (9): createServer(), fs, http, listen(), attempt(), main(), path, resolveRequest() (+1 more)

### Community 152 - "sanitizeObject"
Cohesion: 0.16
Nodes (23): incidentsRoute(), resumeSwitch(), failure(), halt(), parse(), readFailure(), REPORT_LIMIT, runnerRoute() (+15 more)

### Community 153 - "Store"
Cohesion: 0.13
Nodes (14): helperTelemetry(), helperInstallation(), observeHelperGroups(), stopHelperGroups(), FeatureReviewRunner, importReview(), stopReview(), RepairWaitEntry (+6 more)

### Community 154 - "refusal-capture.ts"
Cohesion: 0.27
Nodes (5): QuotaGovernor, Resource, CapturedFailure, captures, GitHubRefusalEvidence

### Community 155 - "recorded-gh-command.ts"
Cohesion: 0.19
Nodes (20): assignments(), changeDirectory(), closing(), CREATE, createGuard(), flags(), named(), read() (+12 more)

### Community 157 - "observe-github-merges.ts"
Cohesion: 0.30
Nodes (14): clearCooldown(), coolDown(), coolingDown(), MERGE_NOTICE_RECHECK_MS, waitKey(), waits, isMergeCommit(), issueOf() (+6 more)

### Community 158 - "write-credential-scope.ts"
Cohesion: 0.22
Nodes (13): assertPushCredential(), Execute, assertBoundPushDestination(), digest(), Execute, file(), PUSH_HOOKS, pushHookChain() (+5 more)

### Community 160 - "ServiceHealthPanel.tsx"
Cohesion: 0.15
Nodes (19): assignmentDiagnostics(), diagnosticContext(), diagnosticSnapshot(), ProjectReadiness, CountedCause, SchedulerState, blockedSummary(), LABELS (+11 more)

### Community 162 - "github-readiness.ts"
Cohesion: 0.05
Nodes (83): queueMergeNotice(), findingsBlock(), refusal(), resume(), resumeProviderReviews(), deliveryTask(), DeliveryTaskInput, observe() (+75 more)

### Community 163 - "original-git.ts"
Cohesion: 0.23
Nodes (19): admitMarkedPush(), Candidate, MarkerObservation, pullRequestObservation(), remoteRefs(), hasCommit(), isSha(), Options (+11 more)

### Community 164 - "telemetry/report.ts"
Cohesion: 0.22
Nodes (15): CostEntry, TelemetryRow, TelemetrySync, Acc, bump(), EASTERN, easternDay(), modelShares() (+7 more)

### Community 165 - ".getEffect"
Cohesion: 0.14
Nodes (21): dispatchedMetadataEffect(), GitHubOperations, reconcileGitHubWrite(), writerRefused(), writerSuccessor(), assignedToJoe(), fileLessonIssue(), lessonIssueBody() (+13 more)

### Community 166 - "launch.mjs"
Cohesion: 0.06
Nodes (101): RFC-9562, BANNER, builtin(), bundleLauncher(), LAUNCHER_BUNDLE, LAUNCHER_ENTRY, launcherChunk(), REPOSITORY (+93 more)

### Community 167 - "release-marker-policy.ts"
Cohesion: 0.21
Nodes (11): active(), ACTIVE_ANALYZER, ACTIVE_FILTER, count(), readReleasePolicy(), ReleasePolicy, SELECTS_ANALYZER, RELEASE_MARKER (+3 more)

### Community 168 - "admit-improvement.ts"
Cohesion: 0.21
Nodes (17): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+9 more)

### Community 169 - "continue-access-only-plan.ts"
Cohesion: 0.54
Nodes (6): Document, document(), isAccessOnlyPlan(), settledAccessOnlyState(), continueAccessOnlyPlan(), entryExists()

### Community 170 - "it-report.ts"
Cohesion: 0.27
Nodes (10): followUpPicture(), publishITReport(), archiveOldReports(), RETAINED_REPORTS, archiveByMonth(), archiveHistory(), archiveMonth(), archiveOldTaskDetail() (+2 more)

### Community 171 - "deploy-plan.ts"
Cohesion: 0.10
Nodes (43): runningRevision(), runningRevision(), releaseIdentity(), runtimeRevision(), ActiveRelease, readActiveRelease(), BUILD_ENV, buildRelease() (+35 more)

### Community 172 - "goal-reviews.ts"
Cohesion: 0.13
Nodes (21): currentCitations(), Fact, NOT_CURRENT, PROVIDER_ERROR, applyGoalReview(), DailyResultSchema, DeliveryJob, EvidenceRefSchema (+13 more)

### Community 176 - "EffectIntent"
Cohesion: 0.22
Nodes (6): Write, Effects, EffectVerification, verification(), WriterRefused, EffectIntent

### Community 177 - "copy.ts"
Cohesion: 0.14
Nodes (22): GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles(), ContinuationIO (+14 more)

### Community 179 - "restart-writer.ts"
Cohesion: 0.17
Nodes (18): ATTEMPT_DELAYS_MS, nextAttemptAt(), restartStoppedWriters(), unchangedSinceAccepted(), NOT_RETRYABLE, releaseFunds(), StoppedWriter, stoppedWriter() (+10 more)

### Community 180 - "preferences-store.ts"
Cohesion: 0.12
Nodes (11): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, soundFields, StoredBody, PreferenceState (+3 more)

### Community 183 - "session-snapshot-cleanup.ts"
Cohesion: 0.40
Nodes (5): SNAPSHOT_PREFIX, removeStaleSessionSnapshots(), SNAPSHOT_SWEEP_MS, STALE_SNAPSHOT_MS, sweepStaleSessionSnapshots()

### Community 184 - "quota-governor.ts"
Cohesion: 0.14
Nodes (16): boardReadFailure(), withGitHubOperation(), GitHubMonitor, Api, terminalPRs(), CORE_RESERVE, GRAPHQL_WORK, noQuotaHold (+8 more)

### Community 186 - "deploy.ts"
Cohesion: 0.15
Nodes (32): fenceTokenDigest(), abandon(), advance(), operationPaths(), ROLLED_BACK, createDeployToken(), readDeployToken(), removeDeployToken() (+24 more)

### Community 187 - "github-delivery.ts"
Cohesion: 0.04
Nodes (88): writerRestartInstruction(), assertNoModelFallback(), enterBoundRetry(), parentPrerequisite(), harnessCloseout(), PASSING, verifyMergeActions(), requireDeliveryAuthority() (+80 more)

### Community 188 - "return-marked-candidate.ts"
Cohesion: 0.30
Nodes (12): originalGit(), recordReturn(), short(), inspectReleaseMarkers(), carriesMarker(), dispatchedCorrection(), MAX_RELEASE_MARKER_RETURNS, pendingReturn() (+4 more)

### Community 189 - "ref_node_crypto"
Cohesion: 0.22
Nodes (14): packedConsumerPnpmRepair(), sha256(), readEvidence(), ProviderEvidence, canonical(), evidenceDigest(), evidenceHash(), semantic() (+6 more)

### Community 190 - "harnessEffect"
Cohesion: 0.09
Nodes (47): NOT_AT_TARGET, BLOCK, harnessBlockMove(), harnessParkedCard(), noted(), effectKey(), LaneOperation, laneWrite() (+39 more)

### Community 191 - "evidence.ts"
Cohesion: 0.26
Nodes (9): investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_SOURCE_PATHS, officeSource(), readOwnedSessionArtifact(), launchPolicyFacts() (+1 more)

### Community 192 - "validate_wiki_pr_body.cjs"
Cohesion: 0.33
Nodes (5): { execFileSync }, hasCanonicalWikiBody(), maintenanceBodies, matchesMaintenanceBody(), { readFileSync }

### Community 194 - "proof-comment.ts"
Cohesion: 0.53
Nodes (10): commentId(), CommentIntent, conversation(), exact(), findProofComment(), matchesProofComment(), postProofComment(), readCommentId() (+2 more)

### Community 195 - "Goals.tsx"
Cohesion: 0.13
Nodes (23): GoalProgress, CTOReview(), goalState, DailyCTO(), GoalHistory(), load(), reportDate(), reviewStatus (+15 more)

### Community 198 - "coordination.ts"
Cohesion: 0.17
Nodes (18): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation(), checkpointWindow(), dueAt() (+10 more)

### Community 199 - "ref_zod"
Cohesion: 0.12
Nodes (12): Body, DeploymentFenceState, Commit, DEPLOY_STEPS, DeployFacts, DeployStatus, Digest, RollbackFacts (+4 more)

### Community 208 - "evidenceText"
Cohesion: 0.80
Nodes (4): evidenceText(), field(), jsonString(), opening()

## Knowledge Gaps
- **1 isolated node(s):** `RFC-9562`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 1451 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `features.ts`, `agents.ts`, `features/workflow.ts`, `marker-correction.ts`, `route-activation.ts`, `outbox.ts`, `api-routes.ts`, `request.ts`, `scheduled-captures.ts`, `run-retrospective.ts`, `record-trigger.ts`, `delivery-retry.ts`, `jira-time.ts`, `checkpoint-completion.ts`, `notifications.ts`, `activeEffectId`, `assignments.ts`, `digest`, `identity-runtime.ts`, `offices.ts`, `artifact`, `work.ts`, `lesson-selection.ts`, `engine.ts`, `shared.ts`, `time-scope.ts`, `accessibility-sources.ts`, `.save`, `Offices`, `store.ts`, `conversations/conversations.ts`, `investigations/ledger.ts`, `trial-comment.ts`, `alert-issue.ts`, `Coordinator`, `fact-bounds.ts`, `cost-ledger.ts`, `supersedingDelivery`, `redactEvidence`, `publication.ts`, `run.ts`, `resume-arrivals.ts`, `cx`, `projects.ts`, `ref_node_path`, `session-bridge.ts`, `accept-stage-result.ts`, `interrupted-work-recovery.ts`, `workKey`, `maintenance/maintenance.ts`, `stopped-record.ts`, `superseded-wiki-pr.ts`, `provider-observation.ts`, `process.ts`, `holdReason`, `enrollment-gate.ts`, `jiraBinding`, `pilot-delivery.ts`, `jira-attempts.ts`, `blocker-followups.ts`, `controller-runtime.ts`, `dependency-bots/adopt.ts`, `goal-reporting.ts`, `pr-observation-graphql.ts`, `create-candidate.ts`, `brain-maintenance.ts`, `write-boundary.ts`, `weekly-rollup.ts`, `.emit`, `StageResult`, `indeterminate`, `handsOff`, `release-marker-stop.ts`, `coordination-pump.ts`, `ref_node_sqlite`, `knowledge.ts`, `it-specialist.ts`, `likePrefix`, `scheduled-work.ts`, `classify-marked-commits.ts`, `scheduler.ts`, `implementation-recovery.ts`, `run-accounting.ts`, `sanitizeObject`, `observe-github-merges.ts`, `write-credential-scope.ts`, `ServiceHealthPanel.tsx`, `github-readiness.ts`, `original-git.ts`, `.getEffect`, `admit-improvement.ts`, `continue-access-only-plan.ts`, `goal-reviews.ts`, `EffectIntent`, `copy.ts`, `restart-writer.ts`, `quota-governor.ts`, `github-delivery.ts`, `return-marked-candidate.ts`, `ref_node_crypto`, `harnessEffect`, `evidence.ts`, `proof-comment.ts`, `coordination.ts`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **What connects `RFC-9562` to the rest of the system?**
  _1 weakly-connected nodes found - possible missing edges._
- **Should `run-model.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.03897756187832524 - nodes in this community are weakly interconnected._
- **Why does `TicketJob` connect `github-delivery.ts` to `handsOff`, `MaintenanceRun`, `release-marker-stop.ts`, `marker-correction.ts`, `InspectorContent.tsx`, `it-specialist.ts`, `scheduled-work.ts`, `outbox.ts`, `classify-marked-commits.ts`, `request.ts`, `scheduler.ts`, `record-trigger.ts`, `implementation-recovery.ts`, `delivery-retry.ts`, `activeEffectId`, `observe-github-merges.ts`, `digest`, `artifact`, `github-readiness.ts`, `original-git.ts`, `release-marker-policy.ts`, `shared.ts`, `restart-writer.ts`, `alert-issue.ts`, `fact-bounds.ts`, `return-marked-candidate.ts`, `harnessEffect`, `Conversation.tsx`, `proof-comment.ts`, `resume-arrivals.ts`, `App.tsx`, `ref_node_path`, `accept-stage-result.ts`, `interrupted-work-recovery.ts`, `workKey`, `stopped-record.ts`, `superseded-wiki-pr.ts`, `holdReason`, `pilot-delivery.ts`, `call-scope.ts`, `dependency-bots/adopt.ts`, `create-candidate.ts`, `work-summary.ts`, `StageResult`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Should `features.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08116883116883117 - nodes in this community are weakly interconnected._
- **Why does `command()` connect `process.ts` to `handsOff`, `agents.ts`, `features/workflow.ts`, `features.ts`, `coordination-pump.ts`, `marker-correction.ts`, `incidents/routes.ts`, `scheduled-work.ts`, `implementation-recovery.ts`, `sandbox-qualification.ts`, `command-registry.ts`, `resume-control.ts`, `jira-time.ts`, `checkpoint-completion.ts`, `Store`, `notifications.ts`, `change-scope.ts`, `index.ts`, `assignments.ts`, `digest`, `identity-runtime.ts`, `write-credential-scope.ts`, `artifact`, `github-readiness.ts`, `original-git.ts`, `.getEffect`, `engine.ts`, `admit-improvement.ts`, `continue-access-only-plan.ts`, `accessibility-sources.ts`, `.save`, `deploy-plan.ts`, `store.ts`, `copy.ts`, `restart-writer.ts`, `quota-governor.ts`, `Coordinator`, `deploy.ts`, `github-delivery.ts`, `cost-ledger.ts`, `harnessEffect`, `redactEvidence`, `coordination.ts`, `service-health.ts`, `projects.ts`, `ref_node_path`, `session-bridge.ts`, `accept-stage-result.ts`, `workKey`, `maintenance/maintenance.ts`, `provider-observation.ts`, `jiraBinding`, `pilot-delivery.ts`, `call-scope.ts`, `controller-runtime.ts`, `create-candidate.ts`, `brain-maintenance.ts`, `weekly-rollup.ts`, `deploy-command.ts`, `.emit`, `StageResult`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Should `agents.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.03333333333333333 - nodes in this community are weakly interconnected._