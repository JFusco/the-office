# Graph Report - office-fresh156  (2026-11-11)

## Corpus Check
- 799 files · ~317,798 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3936 nodes · 18138 edges · 108 communities (105 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 110 edges (avg confidence: 0.74)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8f998ed8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- digest
- github-delivery.ts
- GitHubDelivery
- Store
- index.tsx
- schedule.ts
- knowledge/routes.ts
- features.ts
- Button
- App.tsx
- offices.ts
- scheduled-captures.ts
- shared.ts
- mutedCopy
- cx
- metadata-context.ts
- requests.ts
- session-bridge.ts
- source-amendment.ts
- Role
- constellation-runtime.ts
- agents.ts
- record-trigger.ts
- TelemetryPanel.tsx
- delivery-repairs.ts
- github/issue-publication.ts
- maintenance/maintenance.ts
- http/commands.ts
- read-links.ts
- accept-stage-result.ts
- source-amendment-scope.ts
- notifications.ts
- projects.ts
- currentAssignment
- digest
- index.ts
- ticket-evidence.ts
- WorkTime
- dependency-bots/adopt.ts
- harnessEffect
- cost-ledger.ts
- telemetry.ts
- goal-reporting.ts
- cec/workflow.ts
- knowledge.ts
- park-ticket.ts
- conversations/conversations.ts
- it-specialist.ts
- office/config.ts
- run-retrospective.ts
- .emit
- run-accounting.ts
- .transaction
- worker-runtime.ts
- scheduler.ts
- jira-time.ts
- lesson-selection.ts
- intake/admission.ts
- featureById
- .save
- owned-artifact.ts
- .getEffect
- retrospective-subject.ts
- ControlStore
- Goals.tsx
- sanitize
- remove-candidate.ts
- features/commands.ts
- weekly-rollup.ts
- Coordinator
- blocker-followups.ts
- api-routes.ts
- investigations/run.ts
- admit-improvement.ts
- knowledge/learning-events.ts
- outbox.ts
- QuestionStepper.tsx
- coordination.ts
- service-health.ts
- daily-cto.ts
- assignment-poll.ts
- tracking-issue.ts
- scheduled-work.ts
- control-store.ts
- contract.ts
- fact-bounds.ts
- Ticket
- model-routes.ts
- preferences-store.ts
- .pump
- telemetry/report.ts
- checkpoint-completion.ts
- .value
- create-candidate.ts
- codex-rollout.ts
- command-registry.ts
- QuestionDialogHost.tsx
- mailbox.ts
- cli.ts
- merge-summary.ts
- OfficeConfigView.tsx
- QuestionNotifications
- run-evidence.ts
- extract-worker.mjs
- SlackIntakeStatus.tsx
- slack-supersession.ts
- helper-evidence.py

## God Nodes (most connected - your core abstractions)
1. `Store` - 361 edges
2. `TicketJob` - 165 edges
3. `GitHubDelivery` - 144 edges
4. `digest()` - 134 edges
5. `artifact()` - 117 edges
6. `command()` - 109 edges
7. `workKey()` - 97 edges
8. `cx()` - 88 edges
9. `currentAssignment()` - 82 edges
10. `OfficeSnapshot` - 71 edges

## Surprising Connections (you probably didn't know these)
- `readAzurePRs()` --indirect_call--> `row()`  [INFERRED]
  server/cec/observed-prs.ts → src/telemetry/report.ts
- `DeliveryAuthorityInput` --references--> `HarnessRequest`  [EXTRACTED]
  server/delivery/harness/delivery-authority.ts → src/contracts/work.ts
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

## Communities (108 total, 3 thin omitted)

### Community 0 - "digest"
Cohesion: 0.05
Nodes (135): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+127 more)

### Community 1 - "github-delivery.ts"
Cohesion: 0.05
Nodes (110): harnessCloseout(), PASSING, verifyMergeActions(), findingsBlock(), assertDeliveryMayMutate(), runHarnessStage(), HANDS_OFF_PROJECTS, handsOff() (+102 more)

### Community 2 - "GitHubDelivery"
Cohesion: 0.05
Nodes (81): observePrerequisites(), GitHubDelivery, approveMerge(), completedPRReviews(), Assessment, diagnosticProof(), discoveryRecoveryCandidate(), ownedArtifact() (+73 more)

### Community 3 - "Store"
Cohesion: 0.04
Nodes (40): CommentPage, commentReadback(), Content, jiraText(), JiraOperations, plain(), unpack(), jiraRecord() (+32 more)

### Community 4 - "index.tsx"
Cohesion: 0.05
Nodes (74): Conversation(), Outbox(), recommendedReply(), slackMessageStatus(), SlackDeliveryCard(), labels, ServiceHealthRow(), BlockerFollowups() (+66 more)

### Community 5 - "schedule.ts"
Cohesion: 0.09
Nodes (58): independentIntakeResult(), captureProposal(), effectId(), newTask(), recordObservation(), settlePage(), CaptureReceipt, ChannelProgress (+50 more)

### Community 6 - "knowledge/routes.ts"
Cohesion: 0.08
Nodes (53): intakeActivity(), knowledgeActivity(), knowledgeActivityPage(), createExtractor(), extractDocument, Extraction, Extractor, uploadArtifact() (+45 more)

### Community 7 - "features.ts"
Cohesion: 0.07
Nodes (65): approveFeature(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), discoveryPrompt(), planPrompt(), artifactPath() (+57 more)

### Community 8 - "Button"
Cohesion: 0.07
Nodes (52): guidanceExcerpt(), evidenceTitle(), EvidenceSelection, KnowledgeCapture, KnowledgeCapturePage, KnowledgeDigestDelivery, KnowledgeHit, KnowledgeReference (+44 more)

### Community 9 - "App.tsx"
Cohesion: 0.05
Nodes (66): compactSteps(), BrainDrawer(), themeColor, App(), BrainWorkspace, CONNECTION, CONNECTION_DOT, dockItemVariants (+58 more)

### Community 10 - "offices.ts"
Cohesion: 0.08
Nodes (41): Config, configDigest(), IntakeConfig, privateFile(), readConfig(), isStoppingFor(), reconcileIntakeStatus(), intakeProgress() (+33 more)

### Community 11 - "scheduled-captures.ts"
Cohesion: 0.13
Nodes (51): dispatchNightly(), drainDelivery(), requestDelivery(), resume(), startPilot(), eligibility(), createFeature(), assertEnrollable() (+43 more)

### Community 12 - "shared.ts"
Cohesion: 0.06
Nodes (44): labels, toolActivity(), workerActivity(), ProjectReadiness, DailyCTOSummary, ProgressionItem, SchedulerState, FeatureDelivery() (+36 more)

### Community 13 - "mutedCopy"
Cohesion: 0.09
Nodes (42): KnowledgeSourceSummary, AddPublicSource(), AddSourceForm(), SourceConnection, SourceCard(), Sources(), UploadSource(), WithdrawSource() (+34 more)

### Community 14 - "cx"
Cohesion: 0.07
Nodes (51): withoutElapsed(), CameraBookmark, restoreBookmark(), Avatar(), AzureWall(), Chair(), Coworker(), CTORoom() (+43 more)

### Community 15 - "metadata-context.ts"
Cohesion: 0.12
Nodes (45): activeEffectId(), retryRead(), admitPRMetadata(), assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema, savedMetadataAssessment() (+37 more)

### Community 16 - "requests.ts"
Cohesion: 0.08
Nodes (47): CloseoutSupervisionProofRef, Envelope, hash, head, identity, instant(), known, pid (+39 more)

### Community 17 - "session-bridge.ts"
Cohesion: 0.08
Nodes (37): claudeSessionContext(), readTranscript, root, claudeSessionScope(), accountCodexProcesses(), codexProcessInventory, DesktopSessions, unaccountedProcesses() (+29 more)

### Community 18 - "source-amendment.ts"
Cohesion: 0.11
Nodes (47): containedFile(), adoptCandidate(), reported, Scope, scopeRepairRequestResolved(), assertScopeRepairResumeFindings(), certain(), directionContract() (+39 more)

### Community 19 - "Role"
Cohesion: 0.09
Nodes (43): label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+35 more)

### Community 20 - "constellation-runtime.ts"
Cohesion: 0.08
Nodes (36): KnowledgeMap, KnowledgeNode, CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point (+28 more)

### Community 21 - "agents.ts"
Cohesion: 0.08
Nodes (34): cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), cecChatPrompt(), ctoChatPrompt(), itChatPrompt(), slackSendPrompt() (+26 more)

### Community 22 - "record-trigger.ts"
Cohesion: 0.10
Nodes (42): baselineLearning(), LEARNING_BASELINES, maintainLearning(), configureKnowledge(), busyMaintenanceIds(), clip(), maintenanceBlockedId(), MaintenanceCandidate (+34 more)

### Community 23 - "TelemetryPanel.tsx"
Cohesion: 0.09
Nodes (39): displayAgentTask(), LiveAgentTask(), Props, RunningTask(), text(), AzureBuild, BreakdownTable(), CostBar() (+31 more)

### Community 24 - "delivery-repairs.ts"
Cohesion: 0.12
Nodes (35): removeAdoptedClone(), namedRepairIds(), pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), stoppedBaseCheckout(), stoppedBasePackageInstruction(), discussion(), pages() (+27 more)

### Community 25 - "github/issue-publication.ts"
Cohesion: 0.13
Nodes (14): Assignment, JiraIssuePublisher, keyOf(), Transition, publicationDescription(), PublicationReceipt, Assign, Board (+6 more)

### Community 26 - "maintenance/maintenance.ts"
Cohesion: 0.10
Nodes (29): maintenancePolicies(), captureMaintenanceStep(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice(), candidateOwner() (+21 more)

### Community 27 - "http/commands.ts"
Cohesion: 0.12
Nodes (34): enqueueGreen156(), bindDiscoveryResume(), DiscoveryResumeInput, enqueueMetadataRecovery(), Accepted, acceptRetrospective(), normalizeStatement(), RETROSPECTIVE_HISTORY (+26 more)

### Community 28 - "read-links.ts"
Cohesion: 0.11
Nodes (29): KnowledgeRunner, retryDelay(), linkKey(), LinkResult, PublicReadPolicy, runSlackLinks(), admitUnits(), checkedReceipt() (+21 more)

### Community 29 - "accept-stage-result.ts"
Cohesion: 0.11
Nodes (36): acceptStageResult(), METADATA_FINDING, mergeAuthorized(), continuationNativeReview(), continuationReviewArtifacts(), reconcileContinuationReview(), savedNegativeContinuationReview(), discoveryReviewSatisfied() (+28 more)

### Community 30 - "source-amendment-scope.ts"
Cohesion: 0.08
Nodes (39): approvedText(), assert(), assert(), normalize(), officialUrls, ReleaseCapture, verifyReleaseCaptures(), amendmentCaptureObservation() (+31 more)

### Community 31 - "notifications.ts"
Cohesion: 0.12
Nodes (21): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), configureNotices(), Identity, MergeNotifications (+13 more)

### Community 32 - "projects.ts"
Cohesion: 0.08
Nodes (27): captureAfter(), CaptureMetadata, capturePage(), cursor(), key(), captureIdentityMatches(), BrainCaptureReceipt, hash (+19 more)

### Community 33 - "currentAssignment"
Cohesion: 0.11
Nodes (30): deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, requireDeliveryAuthority(), gateRegisteredDelivery(), accounting, DeliverySubject (+22 more)

### Community 34 - "digest"
Cohesion: 0.13
Nodes (29): comparableSlackText(), AuthoredDigest, reconcileDigestAuthorship(), unitAuthorship(), assertDigestDispatch(), annotateAuthoredUnits(), outboundBody(), retainOutboundBody() (+21 more)

### Community 35 - "index.ts"
Cohesion: 0.11
Nodes (28): close(), config, itSpecialist, loadedRevision, offices, releaseLock, server, serviceHealth (+20 more)

### Community 36 - "ticket-evidence.ts"
Cohesion: 0.14
Nodes (29): assetDownloader(), attachmentKind(), evidenceDirectory(), readEvidence(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS (+21 more)

### Community 37 - "WorkTime"
Cohesion: 0.14
Nodes (31): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence(), CaptureContext (+23 more)

### Community 38 - "dependency-bots/adopt.ts"
Cohesion: 0.15
Nodes (28): readBackOrThrow(), adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR, openDependabotPulls() (+20 more)

### Community 39 - "harnessEffect"
Cohesion: 0.19
Nodes (27): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard, projectCards() (+19 more)

### Community 40 - "cost-ledger.ts"
Cohesion: 0.16
Nodes (25): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId(), OutsideEdit (+17 more)

### Community 41 - "telemetry.ts"
Cohesion: 0.09
Nodes (29): CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL, Rates (+21 more)

### Community 42 - "goal-reporting.ts"
Cohesion: 0.12
Nodes (26): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+18 more)

### Community 43 - "cec/workflow.ts"
Cohesion: 0.16
Nodes (27): applyIntakeObservation(), parksInJira(), run(), advance(), nextStage(), publicationEvidenceGap(), qaEvidenceGap(), resultGate() (+19 more)

### Community 44 - "knowledge.ts"
Cohesion: 0.11
Nodes (25): lookupJournal, KnowledgeAssignment, ImprovementGrant, KnowledgeRetry, KnowledgeSourceBinding, LearningMetrics, LearningSubject, LessonExposure (+17 more)

### Community 45 - "park-ticket.ts"
Cohesion: 0.18
Nodes (27): correlatedBuild(), BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue(), readIssues() (+19 more)

### Community 46 - "conversations/conversations.ts"
Cohesion: 0.11
Nodes (16): ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff(), saveGoals() (+8 more)

### Community 47 - "it-specialist.ts"
Cohesion: 0.14
Nodes (21): savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), ITContext, diagnosticContext(), diagnosticSnapshot(), publishITReport() (+13 more)

### Community 48 - "office/config.ts"
Cohesion: 0.19
Nodes (21): currentApproval(), featureGate(), predecessorComplete(), classifyFeatureFailure(), automaticEnabled(), automaticFeature(), FeaturePlanningBindings, FeaturePlanningConfig (+13 more)

### Community 49 - "run-retrospective.ts"
Cohesion: 0.14
Nodes (24): appendLearningFacts(), freezeLearningPacket(), ARTIFACT_LIMIT, clip(), LEDGER_STEPS, MAINTENANCE_LIMIT, maintenanceFacts(), MaintenancePacketSection (+16 more)

### Community 50 - ".emit"
Cohesion: 0.13
Nodes (21): reconcileNoticeConfirmations(), resumeParked(), compatible(), dependencyCompletionKey(), dependencyEligibility(), DependencyStores, issueKey(), PrerequisiteSchema (+13 more)

### Community 51 - "run-accounting.ts"
Cohesion: 0.13
Nodes (27): BoundedRead, backfillClaudeCost(), CompletionReader, codexHome(), createdAt(), dayDirs(), header(), readCodexRollout() (+19 more)

### Community 52 - ".transaction"
Cohesion: 0.17
Nodes (16): featureItemComplete(), reconcileFeatureCompletion(), helperTelemetry(), reserveReplacement(), stageBudget(), wakeFeature(), recoverFeatures(), helperInstallation() (+8 more)

### Community 53 - "worker-runtime.ts"
Cohesion: 0.14
Nodes (20): candidateWorkspaceEnvironment(), SlackReadAuthority, readAuthority(), assertIntakeBinding(), IntakeBinding, publicUrl(), ModelRoute, codexArguments() (+12 more)

### Community 54 - "scheduler.ts"
Cohesion: 0.15
Nodes (15): ROLES, officeCapacity, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch() (+7 more)

### Community 55 - "jira-time.ts"
Cohesion: 0.13
Nodes (20): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+12 more)

### Community 56 - "lesson-selection.ts"
Cohesion: 0.12
Nodes (22): assignmentSubject(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), LessonSelection, MAINTENANCE (+14 more)

### Community 57 - "intake/admission.ts"
Cohesion: 0.10
Nodes (23): deliveryIntakeBlocker(), Admission, admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, AssignmentResult, CompletionCondition (+15 more)

### Community 58 - "featureById"
Cohesion: 0.16
Nodes (11): featureById(), Link, linkFeature(), FeaturePublisher, publishFeature(), reconcilePublication(), uncertainPublications(), reserveIdentity() (+3 more)

### Community 59 - ".save"
Cohesion: 0.12
Nodes (10): dispatchExposure(), prepareExposure(), checkpointMeasurement(), HEARTBEAT_GAP_MS, HEARTBEAT_MS, startMeasurement(), WorkOutcome, ClaudeStream (+2 more)

### Community 60 - "owned-artifact.ts"
Cohesion: 0.15
Nodes (19): ghLogCacheEvidence(), investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_SOURCE_PATHS, officeSource(), ROOT (+11 more)

### Community 61 - ".getEffect"
Cohesion: 0.20
Nodes (11): GitHubOperations, digestNoticeNeverDispatched(), fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), goalNoticeNeverDispatched(), closeNativeRefresh(), fingerprint() (+3 more)

### Community 62 - "retrospective-subject.ts"
Cohesion: 0.15
Nodes (19): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+11 more)

### Community 63 - "ControlStore"
Cohesion: 0.18
Nodes (5): DailyCTO, queueGoalEvidenceRequest(), GoalEvidenceRequestSchema, ControlStore, DailyCTOReport

### Community 64 - "Goals.tsx"
Cohesion: 0.13
Nodes (19): GoalProgress, SendMessage, CTOReview(), goalState, DailyCTO(), GoalHistory(), reportDate(), reviewStatus (+11 more)

### Community 65 - "sanitize"
Cohesion: 0.23
Nodes (15): projectSlackDeliveries(), settleRequestedSlackReplacement(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint(), supersedingDelivery(), investigationCandidates() (+7 more)

### Community 66 - "remove-candidate.ts"
Cohesion: 0.20
Nodes (17): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+9 more)

### Community 67 - "features/commands.ts"
Cohesion: 0.26
Nodes (16): commandFeature(), reviewQuestions(), FeatureCommandSchema, applyHarnessAction(), HarnessActionInput, harnessQuestion(), recoveryPreconditions(), recoveryTarget() (+8 more)

### Community 68 - "weekly-rollup.ts"
Cohesion: 0.14
Nodes (21): learningMetrics(), lessonsNeedingReview(), Kind, RetrospectiveResult, RollupResult, RollupResultSchema, Stage, harperFolder() (+13 more)

### Community 69 - "Coordinator"
Cohesion: 0.09
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 70 - "blocker-followups.ts"
Cohesion: 0.22
Nodes (17): assertConversationReadback(), conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), finishSupersededReadback(), pump(), canFileGithubIssue() (+9 more)

### Community 71 - "api-routes.ts"
Cohesion: 0.22
Nodes (15): assertAssessmentVisibility(), assertQuestionVisibility(), pendingQuestions(), retainedArtifactScope(), eventVisible(), leadershipContext(), leadershipEntries(), knowledgeEntries() (+7 more)

### Community 72 - "investigations/run.ts"
Cohesion: 0.20
Nodes (15): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, OFFICE_FIX_PROMPT, OfficeFixResult, validateOfficeFix(), investigationReady(), InvestigationOptions, InvestigationReport (+7 more)

### Community 73 - "admit-improvement.ts"
Cohesion: 0.22
Nodes (16): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+8 more)

### Community 74 - "knowledge/learning-events.ts"
Cohesion: 0.19
Nodes (15): eventSourceBindings(), captureLearning(), learningDigest(), recordLearningOpportunity(), expireLearningPackets(), packetReferences(), exposureBindings(), requestSourceBindings() (+7 more)

### Community 75 - "outbox.ts"
Cohesion: 0.20
Nodes (15): projectOutbox(), syncOutbox(), slackRequestSettled(), knowledgeOutbox(), checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), repeatedVendorReviewBlock() (+7 more)

### Community 76 - "QuestionStepper.tsx"
Cohesion: 0.19
Nodes (16): normalizeRound(), FeatureHarnessOption, FeatureOption, FeatureQuestion, FeatureRound, FeatureRoundAuthor, draftKey(), readDraft() (+8 more)

### Community 77 - "coordination.ts"
Cohesion: 0.15
Nodes (18): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), legacy, validateNativeContinuation(), checkpointWindow() (+10 more)

### Community 78 - "service-health.ts"
Cohesion: 0.18
Nodes (9): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, slackHealth() (+1 more)

### Community 79 - "daily-cto.ts"
Cohesion: 0.15
Nodes (15): EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), applyGoalReview(), DailyResultSchema, EvidenceRefSchema, FreshDailyResultSchema, statusAllowed() (+7 more)

### Community 80 - "assignment-poll.ts"
Cohesion: 0.21
Nodes (13): noticeState(), queueMergeNotice(), retryRecipientLookup(), observeGitHubMergeNotices(), due(), unparkReleasedWaits(), compare(), highestStableAtLeast() (+5 more)

### Community 81 - "tracking-issue.ts"
Cohesion: 0.20
Nodes (13): ensureTrackingIssue(), findTrackingIssue(), ownTracking(), TrackingIssue, trackingIssueBody(), trackingIssueTitle(), trackingMarker(), centralCompanionHandoff() (+5 more)

### Community 82 - "scheduled-work.ts"
Cohesion: 0.22
Nodes (16): deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), metadataRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), requestPriority() (+8 more)

### Community 83 - "control-store.ts"
Cohesion: 0.18
Nodes (9): Briefing, saveReviewBriefing(), Clock, applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, statementCache() (+1 more)

### Community 84 - "contract.ts"
Cohesion: 0.22
Nodes (11): At, Errno, GroupInventory, GroupProbe, LifecycleDiagnostic, Phase, Pid, groupInventory() (+3 more)

### Community 85 - "fact-bounds.ts"
Cohesion: 0.28
Nodes (14): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+6 more)

### Community 86 - "Ticket"
Cohesion: 0.20
Nodes (10): cecPrompt(), resolvedDecisionNote(), stageInstructions, APPROACH_GUIDANCE, reviewInstructions(), DeliveryTaskInput, DISCOVERY_GUIDANCE, AMENDMENT_REVIEW_PROOF (+2 more)

### Community 87 - "model-routes.ts"
Cohesion: 0.22
Nodes (13): AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), goalEvidencePath(), localBindings, assertModelOverrides(), CODEX_DEFAULT_EFFORT, CODEX_DEFAULT_MODEL, CODEX_EFFORTS (+5 more)

### Community 88 - "preferences-store.ts"
Cohesion: 0.21
Nodes (9): PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, SettingsPanel(), OFFICE_PREFERENCE_DEFAULTS (+1 more)

### Community 90 - "telemetry/report.ts"
Cohesion: 0.29
Nodes (12): Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked(), row() (+4 more)

### Community 91 - "checkpoint-completion.ts"
Cohesion: 0.24
Nodes (7): BrainStatusSchema, identity, brainCheckpointCompletion(), coverageSchema, followupSchema, verified, reconcileCompletedCheckpoints()

### Community 92 - ".value"
Cohesion: 0.27
Nodes (6): file, folder, logs, root, xml(), ProjectProgress

### Community 93 - "create-candidate.ts"
Cohesion: 0.31
Nodes (9): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+1 more)

### Community 94 - "codex-rollout.ts"
Cohesion: 0.25
Nodes (10): add(), CodexRequest, CodexRollout, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens() (+2 more)

### Community 95 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 96 - "QuestionDialogHost.tsx"
Cohesion: 0.44
Nodes (7): FeatureQuestionProjection, nextQuestion(), orderedQuestions(), questionKey(), QuestionDialogHost(), readSuppressed(), Dialog()

### Community 97 - "mailbox.ts"
Cohesion: 0.31
Nodes (7): checkMail(), drainMail(), requestMail(), MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), ingest()

### Community 98 - "cli.ts"
Cohesion: 0.25
Nodes (6): args, [cmd,...rawArgs], commands, key, projectIndex, PORT

### Community 99 - "merge-summary.ts"
Cohesion: 0.36
Nodes (7): clamp(), LIMITS, MergedPR, plainSlackText(), section(), shippedSummary(), mergeText()

### Community 100 - "OfficeConfigView.tsx"
Cohesion: 0.48
Nodes (5): loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView(), OfficeConfigSummary

### Community 102 - "run-evidence.ts"
Cohesion: 0.47
Nodes (4): comparable(), EvidenceOutcome, recordRunEvidence(), RunAccounting

### Community 103 - "extract-worker.mjs"
Cohesion: 0.70
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 104 - "SlackIntakeStatus.tsx"
Cohesion: 0.60
Nodes (4): format, labels, SlackIntakeStatus(), time()

### Community 105 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

## Knowledge Gaps
- **434 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+429 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `digest`, `github-delivery.ts`, `GitHubDelivery`, `schedule.ts`, `knowledge/routes.ts`, `features.ts`, `offices.ts`, `scheduled-captures.ts`, `shared.ts`, `metadata-context.ts`, `requests.ts`, `session-bridge.ts`, `source-amendment.ts`, `agents.ts`, `record-trigger.ts`, `delivery-repairs.ts`, `github/issue-publication.ts`, `maintenance/maintenance.ts`, `http/commands.ts`, `read-links.ts`, `accept-stage-result.ts`, `notifications.ts`, `currentAssignment`, `digest`, `index.ts`, `ticket-evidence.ts`, `WorkTime`, `dependency-bots/adopt.ts`, `harnessEffect`, `cost-ledger.ts`, `goal-reporting.ts`, `knowledge.ts`, `park-ticket.ts`, `conversations/conversations.ts`, `it-specialist.ts`, `office/config.ts`, `run-retrospective.ts`, `.emit`, `run-accounting.ts`, `.transaction`, `worker-runtime.ts`, `scheduler.ts`, `jira-time.ts`, `lesson-selection.ts`, `intake/admission.ts`, `featureById`, `.save`, `owned-artifact.ts`, `.getEffect`, `retrospective-subject.ts`, `sanitize`, `remove-candidate.ts`, `features/commands.ts`, `weekly-rollup.ts`, `blocker-followups.ts`, `api-routes.ts`, `investigations/run.ts`, `admit-improvement.ts`, `knowledge/learning-events.ts`, `coordination.ts`, `daily-cto.ts`, `assignment-poll.ts`, `tracking-issue.ts`, `scheduled-work.ts`, `control-store.ts`, `Ticket`, `checkpoint-completion.ts`, `create-candidate.ts`, `QuestionNotifications`, `run-evidence.ts`?**
  _High betweenness centrality (0.121) - this node is a cross-community bridge._
- **Why does `command()` connect `Store` to `digest`, `github-delivery.ts`, `GitHubDelivery`, `schedule.ts`, `features.ts`, `metadata-context.ts`, `requests.ts`, `session-bridge.ts`, `source-amendment.ts`, `agents.ts`, `delivery-repairs.ts`, `github/issue-publication.ts`, `maintenance/maintenance.ts`, `read-links.ts`, `notifications.ts`, `projects.ts`, `currentAssignment`, `ticket-evidence.ts`, `harnessEffect`, `cost-ledger.ts`, `goal-reporting.ts`, `park-ticket.ts`, `.emit`, `.transaction`, `worker-runtime.ts`, `jira-time.ts`, `.save`, `.getEffect`, `remove-candidate.ts`, `admit-improvement.ts`, `coordination.ts`, `service-health.ts`, `contract.ts`, `create-candidate.ts`, `command-registry.ts`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `Role` connect `Role` to `github-delivery.ts`, `Store`, `index.tsx`, `App.tsx`, `shared.ts`, `cx`, `agents.ts`, `maintenance/maintenance.ts`, `http/commands.ts`, `accept-stage-result.ts`, `projects.ts`, `currentAssignment`, `cec/workflow.ts`, `conversations/conversations.ts`, `.emit`, `run-accounting.ts`, `worker-runtime.ts`, `scheduler.ts`, `intake/admission.ts`, `.save`, `retrospective-subject.ts`, `knowledge/learning-events.ts`, `outbox.ts`, `Ticket`, `model-routes.ts`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _434 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `digest` be split into smaller, more focused modules?**
  _Cohesion score 0.05210936908278421 - nodes in this community are weakly interconnected._
- **Should `github-delivery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.04756494736044838 - nodes in this community are weakly interconnected._
- **Should `GitHubDelivery` be split into smaller, more focused modules?**
  _Cohesion score 0.04750815090824406 - nodes in this community are weakly interconnected._