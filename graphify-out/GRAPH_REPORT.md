# Graph Report - the-office  (2026-11-11)

## Corpus Check
- 794 files · ~315,963 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3929 nodes · 18024 edges · 97 communities (93 shown, 4 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 127 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9ee86d1b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- github-delivery.ts
- activation-recovery.ts
- GitHubDelivery
- resume-provider-review.ts
- IntakeLedger
- Inspector.tsx
- knowledge.ts
- features.ts
- verifyRepairCandidate
- knowledge/routes.ts
- .save
- OfficeScene.tsx
- currentAssignment
- SourceRegistry
- effects.ts
- source-amendment-scope.ts
- index.tsx
- Store
- MapView.tsx
- Button
- agents.ts
- cost-ledger.ts
- store.ts
- worker-runtime.ts
- daily-cto.ts
- schedule.ts
- ticket-evidence.ts
- it-specialist.ts
- record-trigger.ts
- shared.ts
- .transaction
- maintenance/maintenance.ts
- work-summary.ts
- published-draft-conflict.ts
- App.tsx
- features/commands.ts
- conversations/conversations.ts
- WorkTime
- scheduled-features.ts
- index.ts
- SlackMessages
- goal-reporting.ts
- http/commands.ts
- digest
- artifact
- projects.ts
- run-cost.ts
- github-context.ts
- sanitizeObject
- scheduler.ts
- run-accounting.ts
- outbox.ts
- intake/admission.ts
- run-retrospective.ts
- TicketJob
- QuestionStepper.tsx
- digest
- useOfficePreferences.ts
- investigations/run.ts
- assignment-poll.ts
- lesson-selection.ts
- remove-candidate.ts
- .getEffect
- TelemetryPanel.tsx
- Coordinator
- session-bridge.ts
- offices.ts
- slack-intake/run.ts
- checkpoint-completion.ts
- jira-time.ts
- service-health.ts
- publish-pr.ts
- contract.ts
- cec/issue-publication.ts
- registry.ts
- knowledge/learning-events.ts
- coordination.ts
- telemetry.ts
- dependency-bots/adopt.ts
- DailyCTO.tsx
- create-candidate.ts
- scheduled-work.ts
- command-registry.ts
- investigations/ledger.ts
- observations.ts
- tracking-issue.ts
- work.ts
- OfficeConfigView.tsx
- extract-worker.mjs
- SlackIntakeStatus.tsx
- slack-supersession.ts
- helper-evidence.py
- blocker-followups.ts
- .emit
- read-retries.ts
- queue-maintenance-notice.ts

## God Nodes (most connected - your core abstractions)
1. `Store` - 358 edges
2. `TicketJob` - 162 edges
3. `GitHubDelivery` - 141 edges
4. `digest()` - 130 edges
5. `artifact()` - 114 edges
6. `command()` - 109 edges
7. `workKey()` - 95 edges
8. `cx()` - 88 edges
9. `currentAssignment()` - 82 edges
10. `OfficeSnapshot` - 71 edges

## Surprising Connections (you probably didn't know these)
- `suppliedEvidence()` --indirect_call--> `reference()`  [INFERRED]
  src/knowledge/content/supplied-evidence.ts → server/knowledge/lesson-selection.ts
- `readAzurePRs()` --indirect_call--> `row()`  [INFERRED]
  server/cec/observed-prs.ts → src/telemetry/report.ts
- `rows()` --indirect_call--> `row()`  [INFERRED]
  server/delivery/recovery/source-amendment/source-amendment-held.ts → src/telemetry/report.ts
- `proveOutsideAmendmentUnchanged()` --indirect_call--> `row()`  [INFERRED]
  server/delivery/recovery/source-amendment/source-amendment-held.ts → src/telemetry/report.ts
- `rows()` --indirect_call--> `row()`  [INFERRED]
  server/delivery/recovery/source-amendment/source-amendment-scope.ts → src/telemetry/report.ts

## Import Cycles
- 3-file cycle: `src/knowledge/map/Constellation.tsx -> src/knowledge/map/constellation-runtime.ts -> src/knowledge/map/node-visuals.ts -> src/knowledge/map/Constellation.tsx`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/stage-reconciliation.ts -> server/delivery/recovery/implementation/continuation-review-readback.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/preparation/post-conflict-preparation.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/stopped-base-review.ts -> server/delivery/recovery/stopped-base-checkout.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/parking/resume-provider-review.ts -> server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/parking/resume-provider-review.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/recovery/retire-external-delivery.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/stage-prompts.ts -> server/delivery/publication/metadata-admission.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/stage-prompts.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/publication/metadata-review.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/implementation/activation-recovery.ts -> server/delivery/recovery/validation/validation-provider-context.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/implementation/continuation-guard.ts -> server/delivery/recovery/validation/validation-provider-context.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/implementation/saved-prerequisite-handoff.ts -> server/delivery/recovery/validation/validation-provider-context.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/preparation/post-conflict-preparation.ts -> server/delivery/recovery/preparation/preparation-provider-context.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/preparation/post-conflict-preparation.ts -> server/delivery/recovery/validation/validation-provider-context.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/preparation/post-conflict-preparation.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/pipeline/github-delivery.ts`

## Communities (97 total, 4 thin omitted)

### Community 0 - "github-delivery.ts"
Cohesion: 0.06
Nodes (86): cecPrompt(), resolvedDecisionNote(), containedFile(), findingsBlock(), namedRepairIds(), deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility() (+78 more)

### Community 1 - "activation-recovery.ts"
Cohesion: 0.08
Nodes (63): PrerequisitesSchema, activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal (+55 more)

### Community 2 - "GitHubDelivery"
Cohesion: 0.05
Nodes (90): GitHubDelivery, continuationScope(), continuationGuard(), Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput (+82 more)

### Community 3 - "resume-provider-review.ts"
Cohesion: 0.23
Nodes (23): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), ProjectCard, projectCards(), projectGraphql() (+15 more)

### Community 4 - "IntakeLedger"
Cohesion: 0.10
Nodes (32): createExtractor(), extractDocument, Extraction, Extractor, uploadArtifact(), privateFile(), ChannelProgress, IntakeResult (+24 more)

### Community 5 - "Inspector.tsx"
Cohesion: 0.07
Nodes (63): Conversation(), Outbox(), SendMessage, slackMessageStatus(), SlackDeliveryCard(), labels, ServiceHealthRow(), BlockerFollowups() (+55 more)

### Community 6 - "knowledge.ts"
Cohesion: 0.07
Nodes (38): ref_node_crypto, ref_node_fs, ref_node_path, lookupJournal, Kind, RetrospectiveResult, RetrospectiveResultSchema, RollupResultSchema (+30 more)

### Community 7 - "features.ts"
Cohesion: 0.06
Nodes (64): approveFeature(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), discoveryPrompt(), planPrompt(), artifactPath() (+56 more)

### Community 8 - "verifyRepairCandidate"
Cohesion: 0.08
Nodes (53): removeAdoptedClone(), pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), assertStoppedBaseAudit(), AuditRow, readStoppedBaseAuditCompletion(), StoppedBaseAuditReader, CoverageRow (+45 more)

### Community 9 - "knowledge/routes.ts"
Cohesion: 0.07
Nodes (66): intakeActivity(), knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), guidanceExcerpt(), KnowledgeContext, independentDigestEvidence(), retainOutboundBody() (+58 more)

### Community 10 - ".save"
Cohesion: 0.06
Nodes (67): file, folder, logs, root, xml(), correlatedBuild(), applyIntakeObservation(), checkMail() (+59 more)

### Community 11 - "OfficeScene.tsx"
Cohesion: 0.06
Nodes (60): displayAgentTask(), githubStageLabels, withoutElapsed(), CameraBookmark, restoreBookmark(), LiveAgentTask(), Props, RunningTask() (+52 more)

### Community 12 - "currentAssignment"
Cohesion: 0.14
Nodes (40): activeEffectId(), linkDraftIssue(), protectedOriginalClaim(), admitPRMetadata(), METADATA_FINDING, assessPRMetadata(), captureAssessment(), originalProposal() (+32 more)

### Community 13 - "SourceRegistry"
Cohesion: 0.14
Nodes (25): Config, configDigest(), IntakeConfig, readConfig(), isStoppingFor(), intakeProgress(), terminalDeferred(), unitKey() (+17 more)

### Community 14 - "effects.ts"
Cohesion: 0.09
Nodes (24): featureById(), FeaturePublisher, publishFeature(), reconcilePublication(), reserveIdentity(), Assign, Board, Content (+16 more)

### Community 15 - "source-amendment-scope.ts"
Cohesion: 0.08
Nodes (38): approvedText(), assert(), assert(), normalize(), officialUrls, ReleaseCapture, verifyReleaseCaptures(), amendmentCaptureObservation() (+30 more)

### Community 16 - "index.tsx"
Cohesion: 0.08
Nodes (53): KnowledgeSourceSummary, AddPublicSource(), AddSourceForm(), SourceConnection, SourceCard(), supported, UploadSource(), WithdrawSource() (+45 more)

### Community 17 - "Store"
Cohesion: 0.05
Nodes (15): enableNightly(), GitHubFeaturePublisher, GitHubMonitor, Result, drainMaintenance(), reconcileMaintenance(), requestMaintenance(), Engine (+7 more)

### Community 18 - "MapView.tsx"
Cohesion: 0.07
Nodes (46): KnowledgeActivity, KnowledgeMap, KnowledgeNode, BrainDrawer(), CameraPose, flightPose(), cameraTarget(), focusDistance (+38 more)

### Community 19 - "Button"
Cohesion: 0.11
Nodes (30): KnowledgeCapturePage, KnowledgeActivityPage, Activity(), ActivityStatus(), AssignmentKnowledge(), CaptureReviewDetail(), CaptureReviews(), empty (+22 more)

### Community 20 - "agents.ts"
Cohesion: 0.07
Nodes (36): cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), stageInstructions, cecChatPrompt(), ctoChatPrompt(), itChatPrompt() (+28 more)

### Community 21 - "cost-ledger.ts"
Cohesion: 0.14
Nodes (27): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId(), OutsideEdit (+19 more)

### Community 22 - "store.ts"
Cohesion: 0.11
Nodes (60): dispatchNightly(), drainDelivery(), requestDelivery(), resume(), startPilot(), eligibility(), createFeature(), approvedDelivery() (+52 more)

### Community 23 - "worker-runtime.ts"
Cohesion: 0.08
Nodes (42): candidateWorkspaceEnvironment(), requireDeliveryAuthority(), assertDigestDispatch(), assignmentSubject(), dispatchExposure(), prepareExposure(), assertRetainedDispatchScope(), contextPacket() (+34 more)

### Community 24 - "daily-cto.ts"
Cohesion: 0.09
Nodes (35): collectCTOFacts(), EvidenceRequestConflict, evidenceRequestConflicts, boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip() (+27 more)

### Community 25 - "schedule.ts"
Cohesion: 0.12
Nodes (31): learningMetrics(), lessonsNeedingReview(), harperFolder(), RETROSPECTIVE_TIMEOUT, newTask(), reconcileIntakeStatus(), scheduledSlackIntake(), sourceWork() (+23 more)

### Community 26 - "ticket-evidence.ts"
Cohesion: 0.11
Nodes (35): CommentPage, commentReadback(), JiraOperations, plain(), unpack(), jiraRecord(), assetDownloader(), attachmentKind() (+27 more)

### Community 27 - "it-specialist.ts"
Cohesion: 0.17
Nodes (14): savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), ITContext, publishITReport(), nativeDeliveryResolved(), delays (+6 more)

### Community 28 - "record-trigger.ts"
Cohesion: 0.07
Nodes (57): deliveryMetrics(), median(), baselineLearning(), LEARNING_BASELINES, maintainLearning(), maintenanceSubject(), MaintenanceSubjectFacts, busyMaintenanceIds() (+49 more)

### Community 29 - "shared.ts"
Cohesion: 0.06
Nodes (46): diagnosticContext(), ProjectReadiness, DailyCTOSummary, SchedulerState, recommendedReply(), FeatureDelivery(), FeatureDocuments(), views (+38 more)

### Community 30 - ".transaction"
Cohesion: 0.09
Nodes (35): featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS, reserveReplacement(), stageBudget() (+27 more)

### Community 31 - "maintenance/maintenance.ts"
Cohesion: 0.09
Nodes (31): GITHUB_ISSUE_SKILL, maintenancePolicies(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, candidateOwner(), SETTLED, skipOwnedCandidate() (+23 more)

### Community 32 - "work-summary.ts"
Cohesion: 0.13
Nodes (25): themeColor, App(), usePanelFocus(), OFFICE_CAST, PARTY_DURATION, secretPhrase(), useOfficeEasterEggs(), ROLE_NAMES (+17 more)

### Community 33 - "published-draft-conflict.ts"
Cohesion: 0.13
Nodes (27): nativeCompletion(), preparationCheckpoint(), preparationNativeAssessment(), preparationNativeCheckpoint(), acceptedNativeGate(), preparationGateEvidence(), within(), initialDraftConflictAnchor() (+19 more)

### Community 34 - "App.tsx"
Cohesion: 0.05
Nodes (69): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+61 more)

### Community 35 - "features/commands.ts"
Cohesion: 0.24
Nodes (15): commandFeature(), reviewQuestions(), FeatureCommandSchema, applyHarnessAction(), HarnessActionInput, harnessQuestion(), recoveryPreconditions(), recoveryTarget() (+7 more)

### Community 36 - "conversations/conversations.ts"
Cohesion: 0.10
Nodes (25): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+17 more)

### Community 37 - "WorkTime"
Cohesion: 0.12
Nodes (35): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence(), CaptureContext (+27 more)

### Community 38 - "scheduled-features.ts"
Cohesion: 0.45
Nodes (11): currentApproval(), featureGate(), predecessorComplete(), recoveryHeld(), deliveryPreflight, handoffBinding(), readHandoff(), sameBinding() (+3 more)

### Community 39 - "index.ts"
Cohesion: 0.07
Nodes (36): args, [cmd,...rawArgs], commands, key, projectIndex, close(), config, itSpecialist (+28 more)

### Community 40 - "SlackMessages"
Cohesion: 0.19
Nodes (9): channelNoticeAuthorized(), MergeNotifications, SlackMessages, SlackRequestSchema, goalNoticeAuthorized(), sendGoalNotice(), maintenanceNoticeAuthorized(), sendMaintenanceNotice() (+1 more)

### Community 41 - "goal-reporting.ts"
Cohesion: 0.10
Nodes (32): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+24 more)

### Community 42 - "http/commands.ts"
Cohesion: 0.16
Nodes (25): retryRecipientLookup(), enqueueMetadataRecovery(), normalizeStatement(), configureDigestDelivery(), DigestSettings, configureKnowledge(), declineLessonIssue(), demoteLesson() (+17 more)

### Community 43 - "digest"
Cohesion: 0.18
Nodes (19): comparableSlackText(), AuthoredDigest, reconcileDigestAuthorship(), unitAuthorship(), outboundBody(), reconcileAuthoredEvidence(), digest(), exactly() (+11 more)

### Community 44 - "artifact"
Cohesion: 0.08
Nodes (66): adoptCandidate(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat() (+58 more)

### Community 45 - "projects.ts"
Cohesion: 0.06
Nodes (29): captureAfter(), CaptureMetadata, capturePage(), cursor(), key(), captureIdentityMatches(), BrainCaptureReceipt, hash (+21 more)

### Community 46 - "run-cost.ts"
Cohesion: 0.09
Nodes (30): add(), CodexRequest, CodexRollout, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens() (+22 more)

### Community 47 - "github-context.ts"
Cohesion: 0.11
Nodes (33): observe(), checksFailed(), checksPassed(), checksPending(), CurrentChecksWait, currentMergeChecks(), pass(), pending() (+25 more)

### Community 48 - "sanitizeObject"
Cohesion: 0.08
Nodes (20): snapshot(), mirror(), runWeeklyResearch(), scheduledResearch(), DailyCTO, dailyReviewPrompt(), DailyResultSchema, Briefing (+12 more)

### Community 49 - "scheduler.ts"
Cohesion: 0.13
Nodes (16): ROLES, stageRole(), officeCapacity, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork() (+8 more)

### Community 50 - "run-accounting.ts"
Cohesion: 0.11
Nodes (32): ghLogCacheEvidence(), BoundedRead, done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf(), EvidenceOutcome (+24 more)

### Community 51 - "outbox.ts"
Cohesion: 0.17
Nodes (18): conversationResolved(), projectOutbox(), syncOutbox(), slackRequestSettled(), knowledgeOutbox(), checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup() (+10 more)

### Community 52 - "intake/admission.ts"
Cohesion: 0.22
Nodes (20): reconcileNoticeConfirmations(), Admission, admit(), IntakeContext, compatible(), dependencyCompletionKey(), dependencyEligibility(), DependencyStores (+12 more)

### Community 53 - "run-retrospective.ts"
Cohesion: 0.12
Nodes (29): ref_zod, Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, appendLearningFacts(), freezeLearningPacket(), ARTIFACT_LIMIT, clip() (+21 more)

### Community 54 - "TicketJob"
Cohesion: 0.09
Nodes (31): harnessCloseout(), PASSING, verifyMergeActions(), HarnessControl, withHarnessWork(), runHarnessStage(), harnessStageResult(), receipt() (+23 more)

### Community 55 - "QuestionStepper.tsx"
Cohesion: 0.12
Nodes (25): GIT_NETWORK, LIVE_PROVIDERS, liveReach(), networkUrl(), remoteUrls(), FeatureHarnessOption, FeatureOption, FeatureQuestion (+17 more)

### Community 56 - "digest"
Cohesion: 0.08
Nodes (59): accounting, DeliverySubject, nonDelivery, originalReads, closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim() (+51 more)

### Community 57 - "useOfficePreferences.ts"
Cohesion: 0.13
Nodes (18): fields, PreferencesPatch, StoredBody, acceptPreferences(), PreferenceCandidate, PreferenceState, strip(), UNKNOWN_PREFERENCES (+10 more)

### Community 58 - "investigations/run.ts"
Cohesion: 0.12
Nodes (26): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_FIX_PROMPT, OfficeFixResult (+18 more)

### Community 59 - "assignment-poll.ts"
Cohesion: 0.10
Nodes (30): ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR, plainSlackText() (+22 more)

### Community 60 - "lesson-selection.ts"
Cohesion: 0.13
Nodes (22): INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), LessonSelection, MAINTENANCE, MAX_LESSONS (+14 more)

### Community 61 - "remove-candidate.ts"
Cohesion: 0.20
Nodes (17): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+9 more)

### Community 62 - ".getEffect"
Cohesion: 0.17
Nodes (13): GitHubOperations, validateGitHubIssue(), digestNoticeNeverDispatched(), fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), goalNoticeNeverDispatched(), Assessment (+5 more)

### Community 63 - "TelemetryPanel.tsx"
Cohesion: 0.10
Nodes (36): AzureBuild, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens(), usd(), KpiTiles() (+28 more)

### Community 64 - "Coordinator"
Cohesion: 0.08
Nodes (4): coordination(), Coordinator, AssignedIssue, PickupPolicy

### Community 65 - "session-bridge.ts"
Cohesion: 0.09
Nodes (36): claudeSessionContext(), readTranscript, root, claudeSessionScope(), accountCodexProcesses(), codexProcessInventory, DesktopSessions, unaccountedProcesses() (+28 more)

### Community 66 - "offices.ts"
Cohesion: 0.09
Nodes (30): assertAssessmentVisibility(), assertQuestionVisibility(), pendingQuestions(), diagnosticSnapshot(), retainedArtifactScope(), eventSourceBindings(), eventVisible(), leadershipContext() (+22 more)

### Community 67 - "slack-intake/run.ts"
Cohesion: 0.16
Nodes (28): annotateAuthoredUnits(), independentIntakeResult(), KnowledgeRunner, retryDelay(), captureProposal(), effectId(), recordObservation(), settlePage() (+20 more)

### Community 68 - "checkpoint-completion.ts"
Cohesion: 0.24
Nodes (7): BrainStatusSchema, identity, brainCheckpointCompletion(), coverageSchema, followupSchema, verified, reconcileCompletedCheckpoints()

### Community 69 - "jira-time.ts"
Cohesion: 0.21
Nodes (13): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+5 more)

### Community 70 - "service-health.ts"
Cohesion: 0.26
Nodes (7): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealth

### Community 71 - "publish-pr.ts"
Cohesion: 0.12
Nodes (25): harnessEffect, readBackOrThrow(), retryRead(), editorMatches(), relinkPinCourier(), sha(), MISSING_NATIVE_LINK, resumeLinkedDelivery() (+17 more)

### Community 72 - "contract.ts"
Cohesion: 0.22
Nodes (11): At, Errno, GroupInventory, GroupProbe, LifecycleDiagnostic, Phase, Pid, groupInventory() (+3 more)

### Community 73 - "cec/issue-publication.ts"
Cohesion: 0.19
Nodes (11): Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), Transition, descriptionPreimage(), plain() (+3 more)

### Community 74 - "registry.ts"
Cohesion: 0.13
Nodes (20): CaptureReceipt, SlackReadAuthority, collectionAllowed(), collectionPolicy, readAuthority(), Command, assertIntakeBinding(), IntakeBinding (+12 more)

### Community 75 - "knowledge/learning-events.ts"
Cohesion: 0.13
Nodes (23): distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementIntakeGate(), captureLearning(), learningDigest(), recordLearningOpportunity() (+15 more)

### Community 76 - "coordination.ts"
Cohesion: 0.17
Nodes (18): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), legacy, validateNativeContinuation(), checkpointWindow() (+10 more)

### Community 77 - "telemetry.ts"
Cohesion: 0.17
Nodes (19): CostCompleteness, CostEntry, TelemetryReport, TelemetryRow, TelemetrySync, UsageCompleteness, UsageSource, ValuationSource (+11 more)

### Community 78 - "dependency-bots/adopt.ts"
Cohesion: 0.22
Nodes (21): Execute, adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR, openDependabotPulls() (+13 more)

### Community 79 - "DailyCTO.tsx"
Cohesion: 0.26
Nodes (8): CTOReview(), goalState, DailyCTO(), GoalHistory(), reportDate(), reviewStatus, reviewExcerpt(), ReviewText()

### Community 80 - "create-candidate.ts"
Cohesion: 0.31
Nodes (9): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+1 more)

### Community 81 - "scheduled-work.ts"
Cohesion: 0.15
Nodes (22): deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), metadataRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), RollupResult (+14 more)

### Community 82 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 83 - "investigations/ledger.ts"
Cohesion: 0.26
Nodes (13): projectSlackDeliveries(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint(), supersedingDelivery(), investigationCandidates(), investigationId() (+5 more)

### Community 84 - "observations.ts"
Cohesion: 0.20
Nodes (13): Message, observeRead(), Page, readArguments(), readMethod(), ReadUnavailable, intakePrompt(), IntakeRateLimit (+5 more)

### Community 85 - "tracking-issue.ts"
Cohesion: 0.20
Nodes (13): ensureTrackingIssue(), findTrackingIssue(), ownTracking(), TrackingIssue, trackingIssueBody(), trackingIssueTitle(), trackingMarker(), centralCompanionHandoff() (+5 more)

### Community 86 - "work.ts"
Cohesion: 0.13
Nodes (14): pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION, AssignmentResult, CompletionCondition, Continuation, DeliveryAdmission, DependencyObservation (+6 more)

### Community 87 - "OfficeConfigView.tsx"
Cohesion: 0.48
Nodes (5): loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView(), OfficeConfigSummary

### Community 88 - "extract-worker.mjs"
Cohesion: 0.70
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 89 - "SlackIntakeStatus.tsx"
Cohesion: 0.60
Nodes (4): format, labels, SlackIntakeStatus(), time()

### Community 90 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 93 - "blocker-followups.ts"
Cohesion: 0.53
Nodes (7): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), readBackConversations(), handoff(), reconcileBlockerFollowups(), BlockerFollowup

### Community 95 - "read-retries.ts"
Cohesion: 0.38
Nodes (6): incompleteReadOutput(), IntakeResult, planReadRetry(), reconcileReadRetries(), WorkFailure, ReadRetry

## Knowledge Gaps
- **435 isolated node(s):** `MAX_LESSONS`, `SECTION_LIMIT`, `LESSON_LIMIT`, `URL_LIMIT`, `Bucket` (+430 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 534 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `github-delivery.ts`, `activation-recovery.ts`, `GitHubDelivery`, `resume-provider-review.ts`, `IntakeLedger`, `knowledge.ts`, `features.ts`, `verifyRepairCandidate`, `knowledge/routes.ts`, `.save`, `OfficeScene.tsx`, `currentAssignment`, `SourceRegistry`, `effects.ts`, `agents.ts`, `cost-ledger.ts`, `store.ts`, `worker-runtime.ts`, `daily-cto.ts`, `schedule.ts`, `ticket-evidence.ts`, `it-specialist.ts`, `record-trigger.ts`, `shared.ts`, `.transaction`, `maintenance/maintenance.ts`, `published-draft-conflict.ts`, `features/commands.ts`, `conversations/conversations.ts`, `WorkTime`, `scheduled-features.ts`, `index.ts`, `SlackMessages`, `goal-reporting.ts`, `http/commands.ts`, `digest`, `artifact`, `github-context.ts`, `sanitizeObject`, `scheduler.ts`, `run-accounting.ts`, `intake/admission.ts`, `run-retrospective.ts`, `TicketJob`, `digest`, `investigations/run.ts`, `assignment-poll.ts`, `lesson-selection.ts`, `remove-candidate.ts`, `.getEffect`, `session-bridge.ts`, `offices.ts`, `slack-intake/run.ts`, `checkpoint-completion.ts`, `jira-time.ts`, `publish-pr.ts`, `cec/issue-publication.ts`, `registry.ts`, `knowledge/learning-events.ts`, `coordination.ts`, `dependency-bots/adopt.ts`, `create-candidate.ts`, `scheduled-work.ts`, `investigations/ledger.ts`, `tracking-issue.ts`, `blocker-followups.ts`, `.emit`, `read-retries.ts`, `queue-maintenance-notice.ts`?**
  _High betweenness centrality (0.145) - this node is a cross-community bridge._
- **Why does `Role` connect `App.tsx` to `github-delivery.ts`, `Inspector.tsx`, `OfficeScene.tsx`, `agents.ts`, `store.ts`, `worker-runtime.ts`, `record-trigger.ts`, `shared.ts`, `maintenance/maintenance.ts`, `work-summary.ts`, `conversations/conversations.ts`, `http/commands.ts`, `projects.ts`, `github-context.ts`, `scheduler.ts`, `run-accounting.ts`, `outbox.ts`, `TicketJob`, `offices.ts`, `work.ts`, `.emit`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `OfficeSnapshot` connect `shared.ts` to `Inspector.tsx`, `.save`, `OfficeScene.tsx`, `index.tsx`, `Store`, `Button`, `store.ts`, `it-specialist.ts`, `record-trigger.ts`, `maintenance/maintenance.ts`, `work-summary.ts`, `App.tsx`, `goal-reporting.ts`, `scheduler.ts`, `outbox.ts`, `useOfficePreferences.ts`, `TelemetryPanel.tsx`, `offices.ts`, `service-health.ts`, `DailyCTO.tsx`, `investigations/ledger.ts`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **What connects `MAX_LESSONS`, `SECTION_LIMIT`, `LESSON_LIMIT` to the rest of the system?**
  _435 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `github-delivery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05868347338935574 - nodes in this community are weakly interconnected._
- **Should `activation-recovery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08108108108108109 - nodes in this community are weakly interconnected._
- **Should `GitHubDelivery` be split into smaller, more focused modules?**
  _Cohesion score 0.047870967741935486 - nodes in this community are weakly interconnected._