# Graph Report - the-office  (2026-11-27)

## Corpus Check
- 1396 files · ~645,051 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 8025 nodes · 33833 edges · 174 communities (164 shown, 10 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 1114 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c3a67d15`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- codex-handoff.ts
- Role
- worker-runtime.ts
- features.ts
- cx
- publish-pr.ts
- budget-ledger.ts
- index.tsx
- incidents/routes.ts
- TelemetryPanel.tsx
- coordination-pump.ts
- .transaction
- shared.ts
- propose-improvements.ts
- request.ts
- scheduled-captures.ts
- run-retrospective.ts
- record-trigger.ts
- route-activation.ts
- sandbox-qualification.ts
- command-registry.ts
- overseer-launch.mjs
- delivery-retry.ts
- jira-time.ts
- artifact
- sanitize
- conversations/slack.ts
- Ticket
- advance-metadata-park.ts
- knowledge/routes.ts
- digest
- identity-runtime.ts
- run-model.ts
- run.ts
- Coordinator
- common.cjs
- github.ts
- routing.cjs
- entry.ts
- lesson-selection.ts
- blocker-followups.ts
- time-scope.ts
- task-briefing.ts
- .save
- Offices
- harness-baseline.ts
- credential-spans.ts
- rate-limit-samples.ts
- daily-cto.ts
- json
- QuestionStepper.tsx
- jiraBinding
- investigations/ledger.ts
- timed-statements.ts
- alert-issue.ts
- lesson-exits.ts
- pass.ts
- .emit
- fact-bounds.ts
- work.ts
- cost-ledger.ts
- assignments.ts
- unsent-time.ts
- ref_react
- constellation-runtime.ts
- validate_pr_body.cjs
- audit-plan-candidates.cjs
- runner-report.ts
- ref_node_crypto
- App.tsx
- OfficeScene.tsx
- spawn-command.ts
- session-context-file.ts
- local-config.ts
- session-scope.ts
- service-health.ts
- security.ts
- ref_node_path
- incidents.ts
- agents.ts
- session-bridge.ts
- github-delivery.ts
- coordination-tick.ts
- remove-candidate.ts
- viewer.js
- accessibility-sources.ts
- stopped-record.ts
- ref_zod
- superseded-wiki-pr.ts
- ref_node_child_process
- provider-observation.ts
- ticket-evidence.ts
- session-context-client.ts
- plans.cjs
- assignment-poll.ts
- capture-session-clone.py
- scheduled-features.ts
- normalize-question.ts
- pilot-delivery.ts
- archive-plan.cjs
- call-scope.ts
- jira-attempts.ts
- release-unpark.ts
- on-merge-sync.cjs
- backup-stores.ts
- extract-worker.mjs
- controller-runtime.ts
- harnessEffect
- judge-resumes.ts
- pr-observation-graphql.ts
- handoff-admission.ts
- follow-production.ts
- preferences.ts
- Conversation.tsx
- slack-supersession.ts
- run-accounting.ts
- qa.ts
- qa-plan-continuation.ts
- writer-restart.ts
- store.ts
- retrospective-subject.ts
- .getEffect
- ControlStore
- deploy-command.ts
- refresh-issue-state.cjs
- http/commands.ts
- cec-reads.ts
- sign-in-unpark.ts
- incident-command.ts
- requests.ts
- diagnostic-snapshot.ts
- learning-events.ts
- redactEvidence
- it-specialist.ts
- state-parts.ts
- triage.ts
- knowledge.ts
- sign-in-steps.ts
- deploy-plan.ts
- scheduled-work.ts
- delivery-repairs.ts
- metadata-park-words.ts
- scheduler.ts
- production.ts
- reconcile-merges.cjs
- delivery-task.ts
- accept-stage-result.ts
- Store
- wait-idle.ts
- offices.ts
- serve-graph.cjs
- workKey
- JiraWorklogTransport
- cli.ts
- seeded-office-lessons.ts
- recorded-gh-command.ts
- assignment.ts
- observe-github-merges.ts
- routing.js
- record-push.ts
- holdReason
- provider-limit-resolution.ts
- telemetry/report.ts
- projects.ts
- launch.mjs
- inspector-props.ts
- card-read.ts
- unblock-brief.ts
- inspect-closed-plan.ts
- restart-writer.ts
- session-snapshot-cleanup.ts
- quota-governor.ts
- deploy.ts
- packed-consumer-pnpm.ts

## God Nodes (most connected - your core abstractions)
1. `Store` - 486 edges
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

## Communities (174 total, 10 thin omitted)

### Community 0 - "codex-handoff.ts"
Cohesion: 0.04
Nodes (102): claudeGeneration(), ClaudeSignIn, normalizeClaudeToken(), readClaudeSignIn(), claimText(), codexCanDispatch(), CodexEnvelope, codexGeneration() (+94 more)

### Community 1 - "Role"
Cohesion: 0.12
Nodes (38): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+30 more)

### Community 2 - "worker-runtime.ts"
Cohesion: 0.07
Nodes (38): savedStageCompletion(), candidateWorkspaceEnvironment(), assignmentSubject(), contextPacket(), CODEX_DEFAULT_EFFORT, CODEX_DEFAULT_MODEL, CODEX_EFFORTS, CODEX_ROLES (+30 more)

### Community 3 - "features.ts"
Cohesion: 0.06
Nodes (79): approveFeature(), commandFeature(), featureById(), mutation(), reviewQuestions(), assertFeatureDependencyOrder(), featureDependencyEdges(), key() (+71 more)

### Community 4 - "cx"
Cohesion: 0.09
Nodes (92): Outbox(), blockedSummary(), ServiceHealthPanel(), followUp(), labels, ServiceHealthRow(), BlockerFollowups(), LearningCoverage() (+84 more)

### Community 5 - "publish-pr.ts"
Cohesion: 0.11
Nodes (32): activeRetry(), retryRead(), harnessStageResult(), receipt(), commentAuthor(), BoardRecoveryConflict, boardRecoveryDraft(), savedPublication() (+24 more)

### Community 6 - "budget-ledger.ts"
Cohesion: 0.06
Nodes (57): abandonExpired(), Admission, admit(), admitDeployment(), balance(), bindEvidence(), count(), errcode() (+49 more)

### Community 7 - "index.tsx"
Cohesion: 0.05
Nodes (79): groups, ctoInputFailure(), OutboxCTOInput(), recover(), OutboxMaintenanceStatus(), OutboxSavedImplementation(), apply(), review() (+71 more)

### Community 8 - "incidents/routes.ts"
Cohesion: 0.04
Nodes (86): citationFault(), CitationSchema, ClaimedRange, ResolvedRange, SourceVersions, inHistoryOf(), CompareMemory, compareMemory() (+78 more)

### Community 9 - "TelemetryPanel.tsx"
Cohesion: 0.10
Nodes (38): TelemetryReport, LiveAnchor, AzureBuild, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens() (+30 more)

### Community 10 - "coordination-pump.ts"
Cohesion: 0.22
Nodes (9): deliverySource(), captureGitHubFailures(), BrainFollowup, GateMark, MAX_START_RETRIES, START_RETRY_MS, pump(), ReviewResult (+1 more)

### Community 11 - ".transaction"
Cohesion: 0.08
Nodes (41): featureItemComplete(), reconcileFeatureCompletion(), automaticIntakeWait(), automaticTicketIntakeWait(), helperTelemetry(), reserveReplacement(), confirmBrief(), classifyFeatureFailure() (+33 more)

### Community 12 - "shared.ts"
Cohesion: 0.04
Nodes (102): metadataParkAction(), ADOPTION_STALLED_MS, projectOutbox(), item(), syncOutbox(), OwnerStepItem, ownerStepItems(), sameOwnerSteps() (+94 more)

### Community 13 - "propose-improvements.ts"
Cohesion: 0.33
Nodes (9): distinct(), identity(), improvementIncident(), improvementIncidentKey(), IMPROVEMENT_POLICY, improvementDigest(), ImprovementProposal, proposeImprovements() (+1 more)

### Community 14 - "request.ts"
Cohesion: 0.09
Nodes (64): observeAutomationConflict(), VERB, assertAutomationEffects(), automationMergePolicy(), observeAutomationMerge(), REBASE, rebaseArgs(), rebaseComment() (+56 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.10
Nodes (65): requestDelivery(), accounting, DeliverySubject, nonDelivery, originalReads, admit(), IntakeContext, WAIT_STATUSES (+57 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.08
Nodes (52): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, BLOCKING, BlockingTrigger, blockingTrigger(), isBlocking() (+44 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.10
Nodes (40): bindLegacyRetries(), LEGACY_LIMIT, baselined(), baselineLearning(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences() (+32 more)

### Community 18 - "route-activation.ts"
Cohesion: 0.06
Nodes (67): harnessMergeAttempted(), mergeEffects(), officeMerge(), ActiveEntry, effectId(), entry(), fail(), GitHubAppConfig (+59 more)

### Community 19 - "sandbox-qualification.ts"
Cohesion: 0.05
Nodes (87): ReaderAuthentication, prepare(), storageOverlaps(), within(), ALLOW_PROBES, Binding, boundTo(), Cleanup (+79 more)

### Community 20 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 21 - "overseer-launch.mjs"
Cohesion: 0.07
Nodes (80): acquireLauncherLock(), alone(), ancestry(), assertDirectoryOrAbsent(), attemptRecord(), bounded(), boundedString(), checkOwnedFile() (+72 more)

### Community 22 - "delivery-retry.ts"
Cohesion: 0.09
Nodes (58): decidedFor(), DeliveryRetryDecision, deliveryRetryDecision(), readOnlyStageJob(), retryable(), RetryStore, UnsettledRead, BOARD_STOP (+50 more)

### Community 23 - "jira-time.ts"
Cohesion: 0.11
Nodes (37): unresolvedAttempts(), bindingOf(), connectWith(), data(), envelope(), finishVerifiedEffects(), JiraWorklogs, locks (+29 more)

### Community 24 - "artifact"
Cohesion: 0.06
Nodes (83): ownershipReadHistory(), adoptCandidate(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related (+75 more)

### Community 25 - "sanitize"
Cohesion: 0.06
Nodes (44): implementationContinuationRoute(), qaPlanRetryRoute(), close(), config, itSpecialist, loadedRevision, offices, releaseLock (+36 more)

### Community 26 - "conversations/slack.ts"
Cohesion: 0.09
Nodes (26): channelNoticeAuthorized(), MergeNotifications, comparableSlackText(), labelIsUrl(), projectSlackDeliveries(), dueSlackReread(), rereadUncertainSlack(), runningRevision() (+18 more)

### Community 27 - "Ticket"
Cohesion: 0.08
Nodes (30): carriedNotRepeated(), changeScopeNote(), Scoped, JiraOperations, cecPrompt(), resolvedDecisionNote(), stageInstructions, stageInstructionsFor() (+22 more)

### Community 28 - "advance-metadata-park.ts"
Cohesion: 0.10
Nodes (61): ProjectCard, advanceMetadataPark(), Parked, releaseWords(), sentAnything(), cardResumeRoute(), effectiveParkPickup(), PICKUP_ASSIGNEE (+53 more)

### Community 29 - "knowledge/routes.ts"
Cohesion: 0.10
Nodes (24): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, CommittedBrain (+16 more)

### Community 30 - "digest"
Cohesion: 0.07
Nodes (79): Binding, historyBeforeWrite(), matchesBoundDescription(), DescriptionEdit, DescriptionHistory, DescriptionHistoryUnavailable, descriptionRevision(), readDescriptionHistory() (+71 more)

### Community 31 - "identity-runtime.ts"
Cohesion: 0.07
Nodes (32): KeychainKeySource, appJwt(), base64url(), signingKey(), AppKeySource, Execute, keychainKeySource(), AppReadiness (+24 more)

### Community 32 - "run-model.ts"
Cohesion: 0.05
Nodes (60): LedgerOptions, AttributedFailure, InvocationResult, NotDispatched, GroupState, retireStaged(), RotationEvidence, PassProof (+52 more)

### Community 33 - "run.ts"
Cohesion: 0.15
Nodes (19): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationEvidence(), INVOCATION_SOURCE_REFS, OFFICE_FIX_PROMPT, OfficeFixResult, validateOfficeFix(), OFFICE_SOURCE_PATHS (+11 more)

### Community 35 - "common.cjs"
Cohesion: 0.15
Nodes (26): connections(), fs, main(), path, crypto, ensureInside(), { execFileSync }, fs (+18 more)

### Community 36 - "github.ts"
Cohesion: 0.13
Nodes (27): boardReadFailure(), withGitHubOperation(), GitHubMonitor, githubPRDescription(), closingDirectives(), ObservedPR, enumValue(), fail() (+19 more)

### Community 37 - "routing.cjs"
Cohesion: 0.12
Nodes (28): fs, main(), path, { spawnSync }, frontmatterProblems(), adjacency(), edgeCost(), edgeKey() (+20 more)

### Community 38 - "entry.ts"
Cohesion: 0.10
Nodes (23): EntryRead, EntrySchema, ID_MAX, parseEntry(), PATH_MAX, PATHS_MAX, PLAYBOOK_KINDS, PLAYBOOK_STAGES (+15 more)

### Community 39 - "lesson-selection.ts"
Cohesion: 0.11
Nodes (23): INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), LessonSelection, MAINTENANCE, MAX_LESSONS (+15 more)

### Community 40 - "blocker-followups.ts"
Cohesion: 0.24
Nodes (22): conversationReadbackReady(), followupOf(), pendingReadback(), queueConversationReadback(), readbackEnding(), uncertainConversations(), readBackConversations(), followupRecord() (+14 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.14
Nodes (27): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence(), CaptureContext (+19 more)

### Community 42 - "task-briefing.ts"
Cohesion: 0.12
Nodes (24): BrainOverlap, brainOverlap(), clip(), fits(), withBrainOverlap(), guidanceExcerpt(), lessonText(), citations() (+16 more)

### Community 43 - ".save"
Cohesion: 0.10
Nodes (54): enumerateIntakeList(), inPickupOrder(), Intake, text(), resolveBlockedTransition(), document(), transitionWithComment(), jiraAccount() (+46 more)

### Community 44 - "Offices"
Cohesion: 0.14
Nodes (3): QuestionNotifications, Offices, markCaptureStart()

### Community 45 - "harness-baseline.ts"
Cohesion: 0.15
Nodes (22): BaselineReport, baselineReport(), BaselineSource, baselineText(), millions(), row(), share(), add() (+14 more)

### Community 46 - "credential-spans.ts"
Cohesion: 0.06
Nodes (68): BareValue, bareValue(), deeperValueEnd(), ENDS, isSeparator(), plainEscape(), queryValue(), separatorEscapeAt() (+60 more)

### Community 47 - "rate-limit-samples.ts"
Cohesion: 0.14
Nodes (17): GraphqlAnswer, graphqlAnswer(), responseBody(), WriteCredential, credentialOptions(), currentWriteCredential(), scope, withWriteCredential() (+9 more)

### Community 48 - "daily-cto.ts"
Cohesion: 0.12
Nodes (23): currentCitations(), Fact, NOT_CURRENT, PROVIDER_ERROR, evidenceRequestConflicts, dailyReviewPrompt(), applyGoalReview(), DailyResultSchema (+15 more)

### Community 49 - "json"
Cohesion: 0.13
Nodes (21): failure(), halt(), parse(), readFailure(), REPORT_LIMIT, runnerRoute(), writeFailure(), writeHalt() (+13 more)

### Community 50 - "QuestionStepper.tsx"
Cohesion: 0.19
Nodes (18): FeatureQuestionProjection, OutboxQuestionRound(), send(), draftKey(), readDraft(), saveDraft(), QuestionRound(), nextQuestion() (+10 more)

### Community 51 - "jiraBinding"
Cohesion: 0.06
Nodes (42): CommentPage, commentReadback(), Assignment, contentSchema(), JiraIssuePublisher, jiraText(), Transition, jiraRecord() (+34 more)

### Community 52 - "investigations/ledger.ts"
Cohesion: 0.18
Nodes (17): failureOutranks(), acceptedCompletionResolution(), investigationCandidates(), investigationId(), finishedSubjectResolution(), investigationFollowUps(), investigationHeld(), interruptedQARerunResolution() (+9 more)

### Community 53 - "timed-statements.ts"
Cohesion: 0.18
Nodes (14): StoreTiming, StoreTimings, storeTimings(), NAMED, rowsText(), rowText(), SQL_TOKEN, statementName() (+6 more)

### Community 54 - "alert-issue.ts"
Cohesion: 0.19
Nodes (21): AlertIssue, alertIssueBody(), alertIssueTitle(), alertMarker(), closeAlertIssue(), ensureAlertIssue(), findAlertIssue(), Guard (+13 more)

### Community 55 - "lesson-exits.ts"
Cohesion: 0.48
Nodes (6): expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire()

### Community 56 - "pass.ts"
Cohesion: 0.04
Nodes (130): FailureEvent, failureLine(), header(), readStanding(), BILLING_MODE, guardPresent(), overseerCommand(), reconcileArgs() (+122 more)

### Community 57 - ".emit"
Cohesion: 0.07
Nodes (52): Execute, adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DependabotPR, dependabotPR(), inPickupLane() (+44 more)

### Community 58 - "fact-bounds.ts"
Cohesion: 0.18
Nodes (19): leadershipContext(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance() (+11 more)

### Community 59 - "work.ts"
Cohesion: 0.08
Nodes (33): deliveryRetryDecisions(), compatible(), issueKey(), PrerequisiteSchema, validatePrerequisites(), FailedMailCheck, lastFailedMailCheck(), lastMailCheckOutcome() (+25 more)

### Community 60 - "cost-ledger.ts"
Cohesion: 0.16
Nodes (26): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress(), effectId() (+18 more)

### Community 61 - "assignments.ts"
Cohesion: 0.11
Nodes (24): clip(), DEMAND_LIMIT, demandFacts(), DemandSection, key(), LessonKey, notes(), AssignmentLookups (+16 more)

### Community 62 - "unsent-time.ts"
Cohesion: 0.20
Nodes (14): publishableEntry(), settlementPending(), superseded(), ticketUnresolved(), TimeLedger, readBackTime(), clearUnsent(), dueUnsent() (+6 more)

### Community 63 - "ref_react"
Cohesion: 0.08
Nodes (42): KnowledgeActivity, ChatMarkdown(), ChatMarkdown, MessageText(), Activity(), ActivityTimeline(), AssignmentKnowledge(), Lookup() (+34 more)

### Community 64 - "constellation-runtime.ts"
Cohesion: 0.05
Nodes (62): KnowledgeActivityPage, KnowledgeEdge, KnowledgeMap, KnowledgeNode, ATMOSPHERE, mapAtmosphere(), Particle, system() (+54 more)

### Community 65 - "validate_pr_body.cjs"
Cohesion: 0.36
Nodes (8): fs, main(), readableText(), REQUIRED_CHECKS, REQUIRED_SECTIONS, sections(), validatePullRequestBody(), withoutComments()

### Community 66 - "audit-plan-candidates.cjs"
Cohesion: 0.14
Nodes (31): audit(), branchIssueNumbers(), classify(), distinctiveTitleWords(), { execFileSync }, extractPaths(), findPrForMergeSubject(), fmtCommit() (+23 more)

### Community 67 - "runner-report.ts"
Cohesion: 0.05
Nodes (52): Digest, Evidence, FAILURE_ID, FailureAnswer, FailureReceipt, HaltAnswer, haltCondition(), HaltReport (+44 more)

### Community 68 - "ref_node_crypto"
Cohesion: 0.12
Nodes (61): DeliveryAuthorityInput, dependencyEligibility(), canonical(), assessResumes(), Standing, CheckpointEligibility, checkpointEligibility(), admitAssignmentResume() (+53 more)

### Community 69 - "App.tsx"
Cohesion: 0.05
Nodes (62): BrainDrawer(), themeColor, App(), BrainWorkspace, CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants (+54 more)

### Community 70 - "OfficeScene.tsx"
Cohesion: 0.08
Nodes (60): displayAgentTask(), withoutElapsed(), CameraBookmark, restoreBookmark(), LiveAgentTask(), Props, RunningTask(), text() (+52 more)

### Community 71 - "spawn-command.ts"
Cohesion: 0.15
Nodes (21): childEnvironment(), At, Errno, errno(), GroupInventory, GroupProbe, LifecycleDiagnostic, Phase (+13 more)

### Community 72 - "session-context-file.ts"
Cohesion: 0.20
Nodes (14): ContextFoldPrefix, contextFoldPrefix(), SessionContextCheckpoint, captureSessionContextClone(), ContextReadPhase, SessionContextDeadline, sessionContextFile(), ContextReadChanged (+6 more)

### Community 73 - "local-config.ts"
Cohesion: 0.11
Nodes (36): escaped(), IntakeBinding, intakeJql(), intakeLocation(), projectListScope(), assertFeaturePlanningConfig(), goalEvidencePath(), azureSchema (+28 more)

### Community 74 - "session-scope.ts"
Cohesion: 0.18
Nodes (17): Bound, claudeScopeParser(), claudeSessionScope(), CLAUDE_TRANSCRIPTS, CODEX_ROLLOUTS, contextReaders(), retainSessionMessage(), SessionConversation (+9 more)

### Community 75 - "service-health.ts"
Cohesion: 0.09
Nodes (31): failed(), githubAuthError(), noCalls(), refusedByRateLimit(), revalidated, slurpedPages(), succeeded(), ClaudeLoginRefusal (+23 more)

### Community 76 - "security.ts"
Cohesion: 0.06
Nodes (53): az(), AzureMonitor, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs(), fullActivePRs() (+45 more)

### Community 77 - "ref_node_path"
Cohesion: 0.05
Nodes (98): interruptedImplementation(), continueUnsealedQA(), entry(), ctoInputIdentityMatches(), ctoInputRecovered(), recoverCTOInput(), closeoutReceipt(), assertCoreCloseoutCoverage() (+90 more)

### Community 78 - "incidents.ts"
Cohesion: 0.06
Nodes (68): attributedRecords(), foldsItsRun(), groupCandidates(), ObservedIncident, ObservedSubject, digest(), fingerprint(), incidentId() (+60 more)

### Community 79 - "agents.ts"
Cohesion: 0.05
Nodes (50): implementationWorkerContext(), Document, document(), isAccessOnlyPlan(), settledAccessOnlyState(), continueAccessOnlyPlan(), entryExists(), RefusedQAResult (+42 more)

### Community 80 - "session-bridge.ts"
Cohesion: 0.10
Nodes (30): claudeSessionContext(), codexDaemonProcesses(), accountCodexProcesses(), CodexProcessInventory, codexProcessInventory(), DesktopSessions, unaccountedProcesses(), codexSessionContext() (+22 more)

### Community 81 - "github-delivery.ts"
Cohesion: 0.04
Nodes (80): writerRestartInstruction(), assertNoModelFallback(), enterBoundRetry(), parentPrerequisite(), ProjectProgress, readBackSavedDraftUpdates(), harnessCloseout(), PASSING (+72 more)

### Community 82 - "coordination-tick.ts"
Cohesion: 0.19
Nodes (13): reconcileNoticeConfirmations(), dependencyCompletionKey(), legacy, reconcileContinuations(), projectPolicy(), pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION (+5 more)

### Community 83 - "remove-candidate.ts"
Cohesion: 0.14
Nodes (24): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), maintenanceCandidate(), moveAside(), moveBack(), purgeRemoved(), purging (+16 more)

### Community 84 - "viewer.js"
Cohesion: 0.19
Nodes (25): addMetaLink(), addMetaRow(), addRelationship(), applyView(), buildIndexes(), buildLegend(), buildModel(), buildRenderer() (+17 more)

### Community 85 - "accessibility-sources.ts"
Cohesion: 0.06
Nodes (62): maintenancePolicies(), captureMaintenanceStep(), accessibilitySources(), actionable(), closingPull(), Finding, handoffIssue(), issueLines() (+54 more)

### Community 86 - "stopped-record.ts"
Cohesion: 0.09
Nodes (52): capabilityBlockedReviews(), latestReviews(), boundedEvidence(), expectedWait(), StopFacts, normalizeCause(), IncidentCollector, COLLECTORS (+44 more)

### Community 87 - "ref_zod"
Cohesion: 0.08
Nodes (32): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+24 more)

### Community 88 - "superseded-wiki-pr.ts"
Cohesion: 0.10
Nodes (57): commentId(), CommentIntent, CommentReceipt, conversation(), exact(), findProofComment(), matchesProofComment(), postProofComment() (+49 more)

### Community 89 - "ref_node_child_process"
Cohesion: 0.08
Nodes (26): changedPaths(), { execFileSync }, files, isMapInput(), mapOnly(), { execFileSync }, git(), publish() (+18 more)

### Community 90 - "provider-observation.ts"
Cohesion: 0.12
Nodes (27): correlatedBuild(), Azure, azurePipelines(), outcome(), Read, RUNS_PER_PIPELINE, Api, githubWorkflows() (+19 more)

### Community 91 - "ticket-evidence.ts"
Cohesion: 0.13
Nodes (30): assetDownloader(), attachmentKind(), evidenceDirectory(), readEvidence(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS (+22 more)

### Community 92 - "session-context-client.ts"
Cohesion: 0.13
Nodes (18): readTranscript, readRollout, packContextFailure(), PackedContextFailure, unpackContextFailure(), LiveSession, ContextThread, contextThread() (+10 more)

### Community 93 - "plans.cjs"
Cohesion: 0.14
Nodes (24): remoteSlug(), substantive(), walk(), association(), auditedDigests(), candidate(), cleanCursor(), collapseByTitle() (+16 more)

### Community 94 - "assignment-poll.ts"
Cohesion: 0.08
Nodes (42): currentOutbox(), admitReadyCards(), confirmedGone(), goneQuery(), STOPPED, stoppedReviewKeys(), pinCourier, wikiSync (+34 more)

### Community 96 - "scheduled-features.ts"
Cohesion: 0.35
Nodes (15): dispatchNightly(), drainDelivery(), startPilot(), eligibility(), currentApproval(), featureGate(), predecessorComplete(), recoveryHeld() (+7 more)

### Community 97 - "normalize-question.ts"
Cohesion: 0.29
Nodes (9): FeatureHarnessOption, FeatureOption, FeatureQuestion, FeatureRoundAuthor, folded(), normalizeQuestion(), optionId(), RawQuestion (+1 more)

### Community 98 - "pilot-delivery.ts"
Cohesion: 0.06
Nodes (69): candidateBranchMoved(), applyChangeScope(), endChangeScope(), levels(), MAX_CHECKS, owedUnderScope(), scopeBase(), scopeOutgrown() (+61 more)

### Community 99 - "archive-plan.cjs"
Cohesion: 0.12
Nodes (33): fs, main(), parse(), path, archive(), cell(), ensureIndex(), fromArgs() (+25 more)

### Community 100 - "call-scope.ts"
Cohesion: 0.09
Nodes (35): add(), addSource(), busiest(), CallLedger, Entry, sourceRows(), Sources, CallCounts (+27 more)

### Community 101 - "jira-attempts.ts"
Cohesion: 0.11
Nodes (26): attempted(), attemptState(), bound(), covers(), JiraAttempt, jiraAttempts(), JiraAttemptState, open() (+18 more)

### Community 102 - "release-unpark.ts"
Cohesion: 0.33
Nodes (8): due(), MAX_RELEASE_UNPARKS, RELEASE_CHECK_MS, returnToPickup(), unparkReleasedWaits(), compare(), highestStableAtLeast(), parts()

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
Cohesion: 0.08
Nodes (32): projectData(), StoreDatabase, controllerEffects(), alive(), ControllerMachine, option(), realMachine(), runController() (+24 more)

### Community 107 - "harnessEffect"
Cohesion: 0.12
Nodes (46): BLOCK, harnessBlockMove(), harnessParkedCard(), noted(), effectKey(), LaneOperation, laneWrite(), moveCardOnce() (+38 more)

### Community 108 - "judge-resumes.ts"
Cohesion: 0.07
Nodes (47): Admission, boundaryCrossed(), Crossing, Progress, CheckpointProgress, checkpointProgress(), names(), nativeProof() (+39 more)

### Community 109 - "pr-observation-graphql.ts"
Cohesion: 0.13
Nodes (29): ChildRequest, headCheckRuns(), includeBody(), readOpenPRs(), commitOf(), ConnectionPages, embeddedHead(), fail() (+21 more)

### Community 110 - "handoff-admission.ts"
Cohesion: 0.12
Nodes (27): actionKey(), bound(), CATEGORIZED, claimed(), Entry, episodeAt(), executing(), Execution (+19 more)

### Community 111 - "follow-production.ts"
Cohesion: 0.20
Nodes (17): awaitingJiraStatus(), awaitingProduction(), FOLLOW_DAYS, followed(), isFollowed(), Azure, AzureRead, containedIn() (+9 more)

### Community 112 - "preferences.ts"
Cohesion: 0.32
Nodes (3): preferencesRoute(), PreferencesRouteContext, PreferencesStore

### Community 113 - "Conversation.tsx"
Cohesion: 0.09
Nodes (37): knowledgeOutbox(), Conversation(), ConversationDraft, createConversationDrafts(), LessonDecisionAction, lessonDecisionState(), readLessonDecision(), DAYS (+29 more)

### Community 114 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 115 - "run-accounting.ts"
Cohesion: 0.05
Nodes (67): BoundedRead, done(), readBoundedNoFollow(), readOwnedSessionArtifact(), reasonOf(), backfillClaudeCost(), CompletionReader, add() (+59 more)

### Community 119 - "store.ts"
Cohesion: 0.09
Nodes (23): Clock, systemClock, checkpointLabel(), applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, identity() (+15 more)

### Community 120 - "retrospective-subject.ts"
Cohesion: 0.13
Nodes (19): deliveryMetrics(), median(), ARTIFACT_LIMIT, clip(), LEDGER_STEPS, MAINTENANCE_LIMIT, maintenanceFacts(), maintenanceSubject() (+11 more)

### Community 121 - ".getEffect"
Cohesion: 0.06
Nodes (50): publishFeature(), GitHubOperations, appCredential(), operatorRollbackCredential(), GitHubIdentityRuntime, canonicalDigest(), appToken(), bindingOf() (+42 more)

### Community 122 - "ControlStore"
Cohesion: 0.12
Nodes (11): DailyCTO, EvidenceRequestConflict, reviewWeekday(), queueGoalEvidenceRequest(), Briefing, saveReviewBriefing(), SeenReports, WAITING (+3 more)

### Community 123 - "deploy-command.ts"
Cohesion: 0.09
Nodes (44): CONTROLLER_ENTRY, ControllerPin, Pin, pinnedController(), readControllerPin(), writeControllerPin(), controllerStartFailure(), controllerOf() (+36 more)

### Community 124 - "refresh-issue-state.cjs"
Cohesion: 0.16
Nodes (15): fs, main(), parse(), path, atomicWrite(), { execFileSync }, fs, issueRefs() (+7 more)

### Community 125 - "http/commands.ts"
Cohesion: 0.09
Nodes (35): requestQAPlanRetry(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR (+27 more)

### Community 126 - "cec-reads.ts"
Cohesion: 0.08
Nodes (42): intakeEnumeration(), intakeMembership(), parksInJira(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), plainResume() (+34 more)

### Community 127 - "sign-in-unpark.ts"
Cohesion: 0.18
Nodes (18): hasPendingDelivery(), resumeAfterSignIn(), signInWait(), MAX_SIGN_IN_UNPARKS, waitingStep(), BrowserPage, browserPages(), ReadPages (+10 more)

### Community 128 - "incident-command.ts"
Cohesion: 0.38
Nodes (6): FLAGS, incidentCommand(), IncidentCommandIO, option(), USAGE, whole()

### Community 129 - "requests.ts"
Cohesion: 0.05
Nodes (77): writerRestartPending(), metadataCarriedAdvisoryIds(), ownedBefore(), QA_STAGES, reviewAdvisoryIds(), Reviewed, withoutReviewAdvisories(), deliveryAdmission() (+69 more)

### Community 130 - "diagnostic-snapshot.ts"
Cohesion: 0.17
Nodes (17): assignmentDiagnostics(), diagnosticContext(), diagnosticSnapshot(), followUpPicture(), publishITReport(), itAgent(), itDiagnostics(), itFollowUpView() (+9 more)

### Community 131 - "learning-events.ts"
Cohesion: 0.67
Nodes (4): improvementIntakeGate(), captureLearning(), learningDigest(), recordLearningOpportunity()

### Community 132 - "redactEvidence"
Cohesion: 0.11
Nodes (28): sourceVersions(), AWS_KEY_ID, JSON_WEB_TOKEN, PROVIDER_TOKEN, redactCredentials(), redactEvidence(), redactUnquoted(), admitRepairWaits() (+20 more)

### Community 133 - "it-specialist.ts"
Cohesion: 0.19
Nodes (13): replacedReadback(), heldFor(), ITContext, recoveryHeld(), recoveryWait(), informationalRecovery(), ITSpecialist, ownAzureCheck() (+5 more)

### Community 134 - "state-parts.ts"
Cohesion: 0.13
Nodes (16): readSavedState(), LARGE_KEY_CHARS, plain(), RedactedEntries, RedactedEntry, redactEntries(), joinParts(), PartRow (+8 more)

### Community 135 - "triage.ts"
Cohesion: 0.04
Nodes (91): resolveRange(), Agreement, agreement(), anchor(), compare(), disposition(), factsKey(), file() (+83 more)

### Community 136 - "knowledge.ts"
Cohesion: 0.08
Nodes (30): curateLesson(), Curation, CurationAction, mergeEvidence(), LessonBrainAudit, LessonBrainOverlap, Kind, RetrospectiveResult (+22 more)

### Community 137 - "sign-in-steps.ts"
Cohesion: 0.50
Nodes (4): commands(), SIGN_IN_SERVICE_TROUBLE, signInSteps(), Step

### Community 138 - "deploy-plan.ts"
Cohesion: 0.15
Nodes (26): Body, DeploymentFenceState, fenceTokenDigest(), concludeOperation(), instruction(), operationPaths(), planDeployment(), createDeployToken() (+18 more)

### Community 139 - "scheduled-work.ts"
Cohesion: 0.07
Nodes (45): freshOwnershipRead(), conversationResolved(), deliverySlot(), Ownership, ownershipContext, refreshDeliveryOwnership(), RefreshOwnership, withAmendmentOwnership() (+37 more)

### Community 140 - "delivery-repairs.ts"
Cohesion: 0.09
Nodes (44): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+36 more)

### Community 141 - "metadata-park-words.ts"
Cohesion: 0.18
Nodes (17): devUpdate(), HEADLINE, OUTCOME, qaComment(), remote(), STAGE, plainWords(), tidy() (+9 more)

### Community 142 - "scheduler.ts"
Cohesion: 0.15
Nodes (14): PROJECT_LOCAL, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch(), deliveryOccupied() (+6 more)

### Community 144 - "reconcile-merges.cjs"
Cohesion: 0.22
Nodes (14): collectPulls(), copyWikiForDryRun(), { execFileSync }, flattenPages(), fs, githubRequest(), isWikiBotPull(), main() (+6 more)

### Community 145 - "delivery-task.ts"
Cohesion: 0.33
Nodes (6): APPROACH_GUIDANCE, reviewInstructions(), deliveryTask(), DeliveryTaskInput, DISCOVERY_GUIDANCE, compactSteps()

### Community 146 - "accept-stage-result.ts"
Cohesion: 0.05
Nodes (122): containedFile(), DECISION_KINDS, needsDecision(), acceptStageResult(), acceptConflictRepair(), APPROACH_GUARD_REJECTION, nextJobStage(), recordJobApproach() (+114 more)

### Community 147 - "Store"
Cohesion: 0.04
Nodes (31): checkMail(), drainMail(), requestMail(), ingest(), Execute, GitHubFeaturePublisher, JiraFeaturePublisher, ResumeProject (+23 more)

### Community 148 - "wait-idle.ts"
Cohesion: 0.40
Nodes (4): Health, IdleObservation, IdleResult, WaitIdleInput

### Community 149 - "offices.ts"
Cohesion: 0.08
Nodes (23): servedOutbox(), incidentNotices(), isNotice(), NOTICE_KINDS, readNotices(), STATUS, RUNNER_INCIDENT, RUNNER_SUBJECT (+15 more)

### Community 150 - "serve-graph.cjs"
Cohesion: 0.24
Nodes (9): createServer(), fs, http, listen(), attempt(), main(), path, resolveRequest() (+1 more)

### Community 151 - "workKey"
Cohesion: 0.10
Nodes (32): StoppedWriter, notOwned(), mergedByOwner(), mergedByOfficeBot(), closeableIssue(), effectsSettled(), eligible(), officePublished() (+24 more)

### Community 154 - "seeded-office-lessons.ts"
Cohesion: 0.32
Nodes (5): CONSOLIDATED, CONSOLIDATED_AT, SEEDS, seedOfficeLessons(), SEEDS

### Community 155 - "recorded-gh-command.ts"
Cohesion: 0.19
Nodes (20): assignments(), changeDirectory(), closing(), CREATE, createGuard(), flags(), named(), read() (+12 more)

### Community 156 - "assignment.ts"
Cohesion: 0.11
Nodes (30): latestQA(), notPassedInLatestQA(), QACoverage, qaCoverage(), same(), Tested, stagePrompt(), StagePromptInput (+22 more)

### Community 157 - "observe-github-merges.ts"
Cohesion: 0.30
Nodes (14): clearCooldown(), coolDown(), coolingDown(), MERGE_NOTICE_RECHECK_MS, waitKey(), waits, isMergeCommit(), issueOf() (+6 more)

### Community 161 - "record-push.ts"
Cohesion: 0.13
Nodes (23): Event, exactCommand(), Invocation, localHookCommand(), one(), prePushRejection(), PushIdentity, retirementBoundary() (+15 more)

### Community 162 - "holdReason"
Cohesion: 0.06
Nodes (79): queueMergeNotice(), findingsBlock(), idle(), intentState(), METADATA_PARKS_PER_OBSERVATION, observeMetadataParks(), sentState(), observe() (+71 more)

### Community 163 - "provider-limit-resolution.ts"
Cohesion: 0.33
Nodes (7): investigatesLimitRefusal(), PROVIDER_RECOVERED, providerLimitResolution(), refusedAtLimit(), exitFailure(), MONTHS, providerLimit()

### Community 164 - "telemetry/report.ts"
Cohesion: 0.24
Nodes (14): TelemetryRow, TelemetrySync, Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount() (+6 more)

### Community 165 - "projects.ts"
Cohesion: 0.07
Nodes (45): AUTO_ADOPT_BOTS, AutoAdoptBot, EffectiveAutoAdopt, effectiveAutoAdopt(), IntakeView, NEXT_RUN_DUE_MS, STOPPED, REOBSERVED (+37 more)

### Community 166 - "launch.mjs"
Cohesion: 0.05
Nodes (105): RFC-9562, BANNER, builtin(), bundleLauncher(), LAUNCHER_BUNDLE, LAUNCHER_ENTRY, launcherChunk(), REPOSITORY (+97 more)

### Community 170 - "inspector-props.ts"
Cohesion: 0.13
Nodes (18): fields, PreferencesPatch, StoredBody, SendMessage, acceptPreferences(), PreferenceCandidate, PreferenceState, strip() (+10 more)

### Community 171 - "card-read.ts"
Cohesion: 0.09
Nodes (30): CARD_STATUS_QUERY, CARD_READ_ARGS, readSavedCard(), saved(), runningRevision(), runningRevision(), invocationSource(), sections (+22 more)

### Community 176 - "unblock-brief.ts"
Cohesion: 0.53
Nodes (5): clearUnblockBrief(), key(), saveUnblockBrief(), UnblockBrief, unblockBrief()

### Community 177 - "inspect-closed-plan.ts"
Cohesion: 0.06
Nodes (56): GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles(), ContinuationIO (+48 more)

### Community 179 - "restart-writer.ts"
Cohesion: 0.17
Nodes (18): ATTEMPT_DELAYS_MS, nextAttemptAt(), restartStoppedWriters(), unchangedSinceAccepted(), NOT_RETRYABLE, releaseFunds(), stoppedWriter(), WRITER_STAGES (+10 more)

### Community 183 - "session-snapshot-cleanup.ts"
Cohesion: 0.40
Nodes (5): SNAPSHOT_PREFIX, removeStaleSessionSnapshots(), SNAPSHOT_SWEEP_MS, STALE_SNAPSHOT_MS, sweepStaleSessionSnapshots()

### Community 184 - "quota-governor.ts"
Cohesion: 0.13
Nodes (14): CORE_RESERVE, noQuotaHold, PROBE_INTERVAL_MS, QuotaGate, QuotaGovernor, QuotaRefusal, RefusalDeadline, quotaRefusal() (+6 more)

### Community 186 - "deploy.ts"
Cohesion: 0.12
Nodes (41): ControllerEffects, DEPLOY_PROJECT, abandon(), advance(), DeployContext, DeployTimings, DEPLOY_STEPS, DeployFacts (+33 more)

## Knowledge Gaps
- **1 isolated node(s):** `RFC-9562`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 1405 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `worker-runtime.ts`, `features.ts`, `publish-pr.ts`, `incidents/routes.ts`, `.transaction`, `shared.ts`, `propose-improvements.ts`, `request.ts`, `scheduled-captures.ts`, `run-retrospective.ts`, `record-trigger.ts`, `route-activation.ts`, `delivery-retry.ts`, `jira-time.ts`, `artifact`, `sanitize`, `conversations/slack.ts`, `Ticket`, `advance-metadata-park.ts`, `knowledge/routes.ts`, `digest`, `identity-runtime.ts`, `run.ts`, `github.ts`, `lesson-selection.ts`, `blocker-followups.ts`, `time-scope.ts`, `task-briefing.ts`, `.save`, `Offices`, `daily-cto.ts`, `jiraBinding`, `investigations/ledger.ts`, `alert-issue.ts`, `lesson-exits.ts`, `.emit`, `fact-bounds.ts`, `work.ts`, `cost-ledger.ts`, `assignments.ts`, `unsent-time.ts`, `ref_node_crypto`, `OfficeScene.tsx`, `security.ts`, `ref_node_path`, `agents.ts`, `session-bridge.ts`, `github-delivery.ts`, `coordination-tick.ts`, `remove-candidate.ts`, `accessibility-sources.ts`, `ref_zod`, `superseded-wiki-pr.ts`, `provider-observation.ts`, `ticket-evidence.ts`, `assignment-poll.ts`, `scheduled-features.ts`, `pilot-delivery.ts`, `jira-attempts.ts`, `release-unpark.ts`, `controller-runtime.ts`, `harnessEffect`, `judge-resumes.ts`, `pr-observation-graphql.ts`, `follow-production.ts`, `run-accounting.ts`, `store.ts`, `retrospective-subject.ts`, `.getEffect`, `http/commands.ts`, `cec-reads.ts`, `sign-in-unpark.ts`, `requests.ts`, `diagnostic-snapshot.ts`, `learning-events.ts`, `redactEvidence`, `it-specialist.ts`, `state-parts.ts`, `scheduled-work.ts`, `delivery-repairs.ts`, `scheduler.ts`, `delivery-task.ts`, `accept-stage-result.ts`, `offices.ts`, `workKey`, `assignment.ts`, `observe-github-merges.ts`, `record-push.ts`, `holdReason`, `provider-limit-resolution.ts`, `card-read.ts`, `inspect-closed-plan.ts`, `restart-writer.ts`, `deploy.ts`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **What connects `RFC-9562` to the rest of the system?**
  _1 weakly-connected nodes found - possible missing edges._
- **Should `codex-handoff.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0446521287642783 - nodes in this community are weakly interconnected._
- **Why does `command()` connect `Store` to `requests.ts`, `worker-runtime.ts`, `features.ts`, `redactEvidence`, `publish-pr.ts`, `incidents/routes.ts`, `deploy-plan.ts`, `delivery-repairs.ts`, `accept-stage-result.ts`, `sandbox-qualification.ts`, `command-registry.ts`, `offices.ts`, `jira-time.ts`, `knowledge/routes.ts`, `digest`, `identity-runtime.ts`, `record-push.ts`, `holdReason`, `github.ts`, `.save`, `card-read.ts`, `rate-limit-samples.ts`, `inspect-closed-plan.ts`, `jiraBinding`, `restart-writer.ts`, `lesson-exits.ts`, `deploy.ts`, `work.ts`, `cost-ledger.ts`, `service-health.ts`, `security.ts`, `ref_node_path`, `agents.ts`, `session-bridge.ts`, `github-delivery.ts`, `remove-candidate.ts`, `accessibility-sources.ts`, `provider-observation.ts`, `ticket-evidence.ts`, `assignment-poll.ts`, `pilot-delivery.ts`, `call-scope.ts`, `jira-attempts.ts`, `controller-runtime.ts`, `harnessEffect`, `.getEffect`, `deploy-command.ts`, `http/commands.ts`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Should `Role` be split into smaller, more focused modules?**
  _Cohesion score 0.11524822695035461 - nodes in this community are weakly interconnected._
- **Why does `TicketJob` connect `github-delivery.ts` to `requests.ts`, `cx`, `publish-pr.ts`, `it-specialist.ts`, `scheduled-work.ts`, `shared.ts`, `delivery-repairs.ts`, `request.ts`, `scheduled-captures.ts`, `scheduler.ts`, `record-trigger.ts`, `accept-stage-result.ts`, `Store`, `delivery-task.ts`, `route-activation.ts`, `delivery-retry.ts`, `workKey`, `artifact`, `advance-metadata-park.ts`, `observe-github-merges.ts`, `assignment.ts`, `digest`, `record-push.ts`, `holdReason`, `card-read.ts`, `restart-writer.ts`, `alert-issue.ts`, `.emit`, `fact-bounds.ts`, `work.ts`, `ref_node_crypto`, `App.tsx`, `ref_node_path`, `remove-candidate.ts`, `stopped-record.ts`, `superseded-wiki-pr.ts`, `assignment-poll.ts`, `call-scope.ts`, `release-unpark.ts`, `harnessEffect`, `store.ts`, `retrospective-subject.ts`, `sign-in-unpark.ts`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Should `worker-runtime.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0726764500349406 - nodes in this community are weakly interconnected._