# Graph Report - the-office  (2026-11-11)

## Corpus Check
- 775 files · ~306,640 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3852 nodes · 17525 edges · 108 communities (105 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 107 edges (avg confidence: 0.74)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `805f9b37`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- artifact
- TicketJob
- github-delivery.ts
- index.tsx
- office/config.ts
- source-amendment.ts
- post-conflict-preparation.ts
- agents.ts
- knowledge/routes.ts
- Store
- shared.ts
- process.ts
- worker-runtime.ts
- cx
- record-trigger.ts
- App.tsx
- digest
- scheduled-captures.ts
- Button
- constellation-runtime.ts
- session-bridge.ts
- index.ts
- requests.ts
- knowledge.ts
- weekly-research.ts
- PeoplePanel.tsx
- mutedCopy
- features/commands.ts
- digest
- maintenance/maintenance.ts
- investigations/run.ts
- OfficeSnapshot
- run-retrospective.ts
- TelemetryPanel.tsx
- outbox.ts
- accept-stage-result.ts
- run-accounting.ts
- conversations/slack.ts
- WorkTime
- command
- IntakeLedger
- assignment-poll.ts
- azure.ts
- reader.ts
- cec/workflow.ts
- schedule.ts
- cost-ledger.ts
- Goals.tsx
- ticket-evidence.ts
- enrollment-gate.ts
- features.ts
- SourceRegistry
- scheduler.ts
- http/commands.ts
- .emit
- offices.ts
- slack-intake/report.ts
- telemetry.ts
- weekly-rollup.ts
- slack-intake/run.ts
- cec/issue-publication.ts
- registry.ts
- Coordinator
- knowledge/learning-events.ts
- .save
- harnessEffect
- scheduled-work.ts
- JiraIssuePublisher
- remove-candidate.ts
- tracking-issue.ts
- workKey
- admit-improvement.ts
- GitHubIssuePublisher
- it-specialist.ts
- jira-time.ts
- .getEffect
- lesson-selection.ts
- coordination.ts
- telemetry/report.ts
- HOLDS
- fact-bounds.ts
- blocker-followups.ts
- preferences-store.ts
- contract.ts
- dependencies.ts
- coordination-tick.ts
- .value
- discovery-recovery.ts
- work.ts
- evidence-digest.ts
- command-registry.ts
- QuestionDialogHost.tsx
- effects.ts
- codex-rollout.ts
- cli.ts
- documentText
- create-candidate.ts
- read-retries.ts
- wiki-sync.ts
- QuestionNotifications
- extract-worker.mjs
- extraction.ts
- BrainFollowup
- SlackIntakeStatus.tsx
- highestStableAtLeast
- slack-supersession.ts
- helper-evidence.py

## God Nodes (most connected - your core abstractions)
1. `Store` - 352 edges
2. `TicketJob` - 147 edges
3. `GitHubDelivery` - 133 edges
4. `command()` - 109 edges
5. `digest()` - 107 edges
6. `artifact()` - 98 edges
7. `workKey()` - 91 edges
8. `cx()` - 88 edges
9. `currentAssignment()` - 74 edges
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
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/preparation/post-conflict-preparation.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/pipeline/github-delivery.ts`

## Communities (108 total, 3 thin omitted)

### Community 0 - "artifact"
Cohesion: 0.06
Nodes (111): containedFile(), activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal (+103 more)

### Community 1 - "TicketJob"
Cohesion: 0.05
Nodes (71): MOVABLE, moveLane(), Execute, installDependencies(), major(), removeAdoptedClone(), harnessCloseout(), PASSING (+63 more)

### Community 2 - "github-delivery.ts"
Cohesion: 0.05
Nodes (87): findingsBlock(), HANDS_OFF_PROJECTS, handsOff(), legacyRecovery(), BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction() (+79 more)

### Community 3 - "index.tsx"
Cohesion: 0.06
Nodes (63): Conversation(), Outbox(), recommendedReply(), slackMessageStatus(), SlackDeliveryCard(), labels, BlockerFollowups(), IntakeSummary() (+55 more)

### Community 4 - "office/config.ts"
Cohesion: 0.08
Nodes (55): approveFeature(), featureById(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), discoveryPrompt(), planPrompt() (+47 more)

### Community 5 - "source-amendment.ts"
Cohesion: 0.06
Nodes (72): deliveryTask(), DeliveryTaskInput, DISCOVERY_GUIDANCE, compactSteps(), adoptCandidate(), reported, Scope, approvedText() (+64 more)

### Community 6 - "post-conflict-preparation.ts"
Cohesion: 0.07
Nodes (64): continuationNativeReview(), candidateInput(), children, oldAdoptionBasis(), savedAdmissionUnresolved(), savedCandidateAdmission, assertPostConflictFiles(), assertPostConflictOwnership() (+56 more)

### Community 7 - "agents.ts"
Cohesion: 0.07
Nodes (43): cecPrompt(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), resolvedDecisionNote(), stageInstructions, cecChatPrompt() (+35 more)

### Community 8 - "knowledge/routes.ts"
Cohesion: 0.12
Nodes (46): intakeActivity(), knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), KnowledgeContext, independentDigestEvidence(), digestKnowledge(), prepareDigestBodies() (+38 more)

### Community 9 - "Store"
Cohesion: 0.07
Nodes (32): featureItemComplete(), reconcileFeatureCompletion(), GitHubFeaturePublisher, helperTelemetry(), wakeFeature(), recoverFeatures(), observeHelperGroups(), stopHelperGroups() (+24 more)

### Community 10 - "shared.ts"
Cohesion: 0.05
Nodes (50): diagnosticContext(), listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, slackHealth() (+42 more)

### Community 11 - "process.ts"
Cohesion: 0.06
Nodes (40): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+32 more)

### Community 12 - "worker-runtime.ts"
Cohesion: 0.07
Nodes (48): candidateWorkspaceEnvironment(), AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), assignmentSubject(), dispatchExposure(), prepareExposure(), assertRetainedDispatchScope(), goalEvidencePath() (+40 more)

### Community 13 - "cx"
Cohesion: 0.06
Nodes (56): withoutElapsed(), CameraBookmark, restoreBookmark(), Avatar(), AzureWall(), Chair(), Coworker(), CTORoom() (+48 more)

### Community 14 - "record-trigger.ts"
Cohesion: 0.07
Nodes (54): deliveryMetrics(), median(), LEARNING_BASELINES, maintainLearning(), maintenanceSubject(), MaintenanceSubjectFacts, busyMaintenanceIds(), clip() (+46 more)

### Community 15 - "App.tsx"
Cohesion: 0.05
Nodes (49): BrainDrawer(), themeColor, BrainWorkspace, CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants, ElevatorPhase (+41 more)

### Community 16 - "digest"
Cohesion: 0.14
Nodes (43): activeEffectId(), runHarnessStage(), harnessDelivers(), admitPRMetadata(), assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema (+35 more)

### Community 17 - "scheduled-captures.ts"
Cohesion: 0.15
Nodes (44): createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest, captureRequests() (+36 more)

### Community 18 - "Button"
Cohesion: 0.10
Nodes (34): KnowledgeCapturePage, KnowledgeActivityPage, Activity(), ActivityStatus(), AssignmentKnowledge(), CaptureReviewDetail(), CaptureReviews(), empty (+26 more)

### Community 19 - "constellation-runtime.ts"
Cohesion: 0.08
Nodes (39): KnowledgeActivity, KnowledgeEdge, KnowledgeIntakeStatus, KnowledgeMap, KnowledgeNode, CameraPose, flightPose(), cameraTarget() (+31 more)

### Community 20 - "session-bridge.ts"
Cohesion: 0.08
Nodes (36): claudeSessionContext(), readTranscript, root, claudeSessionScope(), accountCodexProcesses(), codexProcessInventory, DesktopSessions, unaccountedProcesses() (+28 more)

### Community 21 - "index.ts"
Cohesion: 0.09
Nodes (38): assertAssessmentVisibility(), assertQuestionVisibility(), pendingQuestions(), close(), config, itSpecialist, loadedRevision, offices (+30 more)

### Community 22 - "requests.ts"
Cohesion: 0.10
Nodes (46): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+38 more)

### Community 23 - "knowledge.ts"
Cohesion: 0.09
Nodes (33): AssignmentLookups, Binding, lookupInstructions(), decodeLookupJournal(), lookupJournal, readLookupJournal(), citations(), recordAcceptedKnowledge() (+25 more)

### Community 24 - "weekly-research.ts"
Cohesion: 0.07
Nodes (25): retryDelay(), mirror(), runWeeklyResearch(), scheduledResearch(), dailyReviewPrompt(), queueGoalEvidenceRequest(), applyGoalReview(), DailyResultSchema (+17 more)

### Community 25 - "PeoplePanel.tsx"
Cohesion: 0.10
Nodes (40): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+32 more)

### Community 26 - "mutedCopy"
Cohesion: 0.12
Nodes (33): KnowledgeSourceSummary, AddPublicSource(), AddSourceForm(), SourceConnection, SourceCard(), Sources(), supported, UploadSource() (+25 more)

### Community 27 - "features/commands.ts"
Cohesion: 0.12
Nodes (33): commandFeature(), reviewQuestions(), evidenceDirectory(), readEvidence(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS, requestReplan() (+25 more)

### Community 28 - "digest"
Cohesion: 0.12
Nodes (31): comparableSlackText(), uploadArtifact(), AuthoredDigest, reconcileDigestAuthorship(), unitAuthorship(), annotateAuthoredUnits(), independentIntakeResult(), outboundBody() (+23 more)

### Community 29 - "maintenance/maintenance.ts"
Cohesion: 0.10
Nodes (27): maintenancePolicies(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice(), candidateOwner(), SETTLED (+19 more)

### Community 30 - "investigations/run.ts"
Cohesion: 0.11
Nodes (30): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationCandidates(), investigationId(), investigationEvidence(), investigationFollowUps(), INVOCATION_SOURCE_REFS, invocationSource() (+22 more)

### Community 31 - "OfficeSnapshot"
Cohesion: 0.11
Nodes (35): labels, App(), usePanelFocus(), displayAgentTask(), githubStageLabels, LiveAgentTask(), Props, RunningTask() (+27 more)

### Community 32 - "run-retrospective.ts"
Cohesion: 0.09
Nodes (33): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, appendLearningFacts(), freezeLearningPacket(), ARTIFACT_LIMIT, clip(), LEDGER_STEPS (+25 more)

### Community 33 - "TelemetryPanel.tsx"
Cohesion: 0.11
Nodes (34): AzureBuild, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens(), usd(), KpiTiles() (+26 more)

### Community 34 - "outbox.ts"
Cohesion: 0.10
Nodes (29): projectOutbox(), syncOutbox(), projectSlackDeliveries(), settleRequestedSlackReplacement(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint() (+21 more)

### Community 35 - "accept-stage-result.ts"
Cohesion: 0.13
Nodes (35): acceptStageResult(), PrerequisitesSchema, linkDraftIssue(), protectedOriginalClaim(), METADATA_FINDING, publicationReadArgs(), Read, readPublication() (+27 more)

### Community 36 - "run-accounting.ts"
Cohesion: 0.11
Nodes (35): ghLogCacheEvidence(), BoundedRead, done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf(), EvidenceOutcome (+27 more)

### Community 37 - "conversations/slack.ts"
Cohesion: 0.11
Nodes (21): channelNoticeAuthorized(), SlackMessages, SlackRequestSchema, SlackResultSchema, SlackVerificationSchema, assertDigestDispatch(), retainOutboundBody(), digestNoticeNeverDispatched() (+13 more)

### Community 38 - "WorkTime"
Cohesion: 0.12
Nodes (34): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence(), CaptureContext (+26 more)

### Community 39 - "command"
Cohesion: 0.07
Nodes (15): correlatedBuild(), checkMail(), drainMail(), requestMail(), enableNightly(), ingest(), MergeNotifications, drainMaintenance() (+7 more)

### Community 40 - "IntakeLedger"
Cohesion: 0.14
Nodes (27): captureProposal(), effectId(), newTask(), recordObservation(), settlePage(), ChannelProgress, IntakeLedger, acceptProposals() (+19 more)

### Community 41 - "assignment-poll.ts"
Cohesion: 0.10
Nodes (30): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), clamp() (+22 more)

### Community 42 - "azure.ts"
Cohesion: 0.10
Nodes (26): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+18 more)

### Community 43 - "reader.ts"
Cohesion: 0.08
Nodes (21): captureAfter(), CaptureMetadata, capturePage(), cursor(), key(), captureIdentityMatches(), BrainCaptureReceipt, hash (+13 more)

### Community 44 - "cec/workflow.ts"
Cohesion: 0.15
Nodes (28): applyIntakeObservation(), parksInJira(), run(), advance(), nextStage(), publicationEvidenceGap(), qaEvidenceGap(), resultGate() (+20 more)

### Community 45 - "schedule.ts"
Cohesion: 0.16
Nodes (19): reconcileIntakeStatus(), runSlackLinks(), scheduledSlackIntake(), sourceWork(), IntakeBudget, Collection, publicSourceWork(), lastFriday() (+11 more)

### Community 46 - "cost-ledger.ts"
Cohesion: 0.14
Nodes (28): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress(), effectId() (+20 more)

### Community 47 - "Goals.tsx"
Cohesion: 0.08
Nodes (27): SendMessage, FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures(), TicketPlanningAction() (+19 more)

### Community 48 - "ticket-evidence.ts"
Cohesion: 0.14
Nodes (23): CommentPage, commentReadback(), JiraOperations, plain(), unpack(), jiraRecord(), assetDownloader(), attachmentKind() (+15 more)

### Community 49 - "enrollment-gate.ts"
Cohesion: 0.17
Nodes (25): dispatchNightly(), drainDelivery(), requestDelivery(), resume(), startPilot(), eligibility(), bindDelivery(), featureEffectGate() (+17 more)

### Community 50 - "features.ts"
Cohesion: 0.11
Nodes (28): normalizeRound(), FeatureApproval, FeatureAttempt, FeatureAuthority, FeatureDocument, FeatureHandoff, FeatureHarnessAction, FeatureHarnessOption (+20 more)

### Community 51 - "SourceRegistry"
Cohesion: 0.14
Nodes (18): Config, configDigest(), IntakeConfig, readConfig(), Command, sourceCommand(), IntakeBinding, configDigestForSeed() (+10 more)

### Community 52 - "scheduler.ts"
Cohesion: 0.13
Nodes (19): deliveryIntakeBlocker(), Admission, admit(), IntakeContext, fifo(), ScheduledWork, Scheduler, selectWork() (+11 more)

### Community 53 - "http/commands.ts"
Cohesion: 0.16
Nodes (23): enqueueMetadataRecovery(), normalizeStatement(), configureDigestDelivery(), DigestSettings, baselineLearning(), configureKnowledge(), declineLessonIssue(), demoteLesson() (+15 more)

### Community 54 - ".emit"
Cohesion: 0.19
Nodes (23): Execute, adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR, inPickupLane() (+15 more)

### Community 55 - "offices.ts"
Cohesion: 0.14
Nodes (13): leadershipContext(), leadershipEntries(), knowledgeEntries(), readLocalIntakeReport(), DELIVERY_CONCURRENCY, file, project, root (+5 more)

### Community 56 - "slack-intake/report.ts"
Cohesion: 0.19
Nodes (24): Proposal, ReadTask, SourceUnit, isStoppingFor(), intakeProgress(), terminalDeferred(), unitKey(), verifiedCapture() (+16 more)

### Community 57 - "telemetry.ts"
Cohesion: 0.10
Nodes (25): CodexRollout, CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL (+17 more)

### Community 58 - "weekly-rollup.ts"
Cohesion: 0.11
Nodes (25): learningMetrics(), lessonsNeedingReview(), RollupResult, RollupResultSchema, harperFolder(), RETROSPECTIVE_TIMEOUT, SEEDS, scanCuration() (+17 more)

### Community 59 - "slack-intake/run.ts"
Cohesion: 0.16
Nodes (18): CaptureReceipt, IntakeResult, IntakeResultValue, LIMITS, Observation, ReadKind, Message, observeRead() (+10 more)

### Community 60 - "cec/issue-publication.ts"
Cohesion: 0.14
Nodes (13): Content, jiraText(), descriptionPreimage(), plain(), JiraFeaturePublisher, FeaturePublisher, publishFeature(), reconcilePublication() (+5 more)

### Community 61 - "registry.ts"
Cohesion: 0.17
Nodes (17): KnowledgeRunner, SlackReadAuthority, LinkResult, PublicReadPolicy, collectionAllowed(), collectionPolicy, readAuthority(), assertIntakeBinding() (+9 more)

### Community 62 - "Coordinator"
Cohesion: 0.08
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 63 - "knowledge/learning-events.ts"
Cohesion: 0.16
Nodes (18): retainedArtifactScope(), eventSourceBindings(), captureLearning(), learningDigest(), recordLearningOpportunity(), expireLearningPackets(), packetReferences(), exposureBindings() (+10 more)

### Community 64 - ".save"
Cohesion: 0.26
Nodes (22): BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue(), readIssues(), commentDecision() (+14 more)

### Community 65 - "harnessEffect"
Cohesion: 0.27
Nodes (19): Lane, resolveLane(), cardStatus(), ProjectCard, projectCards(), projectGraphql(), setCardStatus(), statusField (+11 more)

### Community 66 - "scheduled-work.ts"
Cohesion: 0.14
Nodes (19): deliverySlot(), ROLES, closeoutRequestResolved(), metadataRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), requestPriority(), deterministicActions (+11 more)

### Community 67 - "JiraIssuePublisher"
Cohesion: 0.25
Nodes (6): Assignment, JiraIssuePublisher, keyOf(), Transition, publicationDescription(), PublicationReceipt

### Community 68 - "remove-candidate.ts"
Cohesion: 0.20
Nodes (17): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+9 more)

### Community 69 - "tracking-issue.ts"
Cohesion: 0.19
Nodes (17): readBackOrThrow(), ensureTrackingIssue(), findTrackingIssue(), ownTracking(), TrackingIssue, trackingIssueBody(), trackingIssueTitle(), trackingMarker() (+9 more)

### Community 70 - "workKey"
Cohesion: 0.19
Nodes (15): boardPreflightCandidate(), Ownership, reconcileBoardPreflight(), completedPRReviews(), eligible(), mergedByOwner(), ownerSettles(), retireExternalDeliveries() (+7 more)

### Community 71 - "admit-improvement.ts"
Cohesion: 0.22
Nodes (16): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+8 more)

### Community 72 - "GitHubIssuePublisher"
Cohesion: 0.26
Nodes (6): Assign, Board, GitHubIssuePublisher, number(), same(), label()

### Community 73 - "it-specialist.ts"
Cohesion: 0.22
Nodes (12): ITContext, publishITReport(), delays, recoverAttempt(), ServiceHealthChecks, itFollowUpView(), sessionVisibilityCopy(), date() (+4 more)

### Community 74 - "jira-time.ts"
Cohesion: 0.21
Nodes (13): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+5 more)

### Community 75 - ".getEffect"
Cohesion: 0.27
Nodes (5): GitHubOperations, Assessment, closeNativeRefresh(), fingerprint(), EffectIntent

### Community 76 - "lesson-selection.ts"
Cohesion: 0.19
Nodes (16): knowledgeContext(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), LessonSelection, MAINTENANCE (+8 more)

### Community 77 - "coordination.ts"
Cohesion: 0.17
Nodes (17): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation(), checkpointWindow(), dueAt() (+9 more)

### Community 78 - "telemetry/report.ts"
Cohesion: 0.20
Nodes (16): telemetryRoute(), TelemetryReport, TelemetryRow, TelemetrySync, Acc, bump(), EASTERN, easternDay() (+8 more)

### Community 79 - "HOLDS"
Cohesion: 0.20
Nodes (13): deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, requireDeliveryAuthority(), gateRegisteredDelivery(), accounting, DeliverySubject (+5 more)

### Community 80 - "fact-bounds.ts"
Cohesion: 0.26
Nodes (15): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+7 more)

### Community 81 - "blocker-followups.ts"
Cohesion: 0.32
Nodes (10): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), readBackConversations(), diagnosticSnapshot(), nativeDeliveryResolved(), handoff() (+2 more)

### Community 82 - "preferences-store.ts"
Cohesion: 0.21
Nodes (9): preferencesRoute(), PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS (+1 more)

### Community 83 - "contract.ts"
Cohesion: 0.24
Nodes (10): At, Errno, GroupInventory, GroupProbe, Phase, Pid, groupInventory(), InventoryRunner (+2 more)

### Community 84 - "dependencies.ts"
Cohesion: 0.35
Nodes (11): resumeParked(), compatible(), dependencyCompletionKey(), dependencyEligibility(), DependencyStores, issueKey(), observePrerequisites(), PrerequisiteSchema (+3 more)

### Community 85 - "coordination-tick.ts"
Cohesion: 0.27
Nodes (9): reconcileNoticeConfirmations(), brainCheckpointCompletion(), reconcileCompletedCheckpoints(), legacy, reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION (+1 more)

### Community 86 - ".value"
Cohesion: 0.24
Nodes (6): file, folder, logs, root, xml(), ProjectProgress

### Community 87 - "discovery-recovery.ts"
Cohesion: 0.29
Nodes (10): Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership, rawHash() (+2 more)

### Community 88 - "work.ts"
Cohesion: 0.17
Nodes (11): AssignmentResult, CompletionCondition, Continuation, DeliveryAdmission, DependencyObservation, EligibilityState, FailureCategory, Prerequisite (+3 more)

### Community 89 - "evidence-digest.ts"
Cohesion: 0.40
Nodes (8): ProviderEvidence, canonical(), evidenceDigest(), evidenceHash(), semantic(), stableUrl(), requirementDrift(), RequirementPostimage

### Community 90 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 91 - "QuestionDialogHost.tsx"
Cohesion: 0.44
Nodes (7): FeatureQuestionProjection, nextQuestion(), orderedQuestions(), questionKey(), QuestionDialogHost(), readSuppressed(), Dialog()

### Community 92 - "effects.ts"
Cohesion: 0.36
Nodes (6): fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), EffectOperation, Effects, WorkRef

### Community 93 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 94 - "cli.ts"
Cohesion: 0.25
Nodes (6): args, [cmd,...rawArgs], commands, key, projectIndex, PORT

### Community 95 - "documentText"
Cohesion: 0.39
Nodes (5): guidanceExcerpt(), DocumentMetadata, documentText(), KnowledgeDocumentText, DocumentPreview()

### Community 96 - "create-candidate.ts"
Cohesion: 0.48
Nodes (6): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf()

### Community 97 - "read-retries.ts"
Cohesion: 0.38
Nodes (6): incompleteReadOutput(), IntakeResult, planReadRetry(), reconcileReadRetries(), WorkFailure, ReadRetry

### Community 98 - "wiki-sync.ts"
Cohesion: 0.33
Nodes (3): ACTIONS, OWNER, wikiSync

### Community 100 - "extract-worker.mjs"
Cohesion: 0.70
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 101 - "extraction.ts"
Cohesion: 0.50
Nodes (4): createExtractor(), extractDocument, Extraction, Extractor

### Community 103 - "SlackIntakeStatus.tsx"
Cohesion: 0.60
Nodes (4): format, labels, SlackIntakeStatus(), time()

### Community 104 - "highestStableAtLeast"
Cohesion: 0.83
Nodes (3): compare(), highestStableAtLeast(), parts()

### Community 105 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

## Knowledge Gaps
- **421 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+416 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `artifact`, `TicketJob`, `github-delivery.ts`, `office/config.ts`, `source-amendment.ts`, `post-conflict-preparation.ts`, `agents.ts`, `knowledge/routes.ts`, `shared.ts`, `process.ts`, `worker-runtime.ts`, `record-trigger.ts`, `digest`, `scheduled-captures.ts`, `session-bridge.ts`, `index.ts`, `requests.ts`, `knowledge.ts`, `weekly-research.ts`, `features/commands.ts`, `digest`, `maintenance/maintenance.ts`, `investigations/run.ts`, `OfficeSnapshot`, `run-retrospective.ts`, `outbox.ts`, `accept-stage-result.ts`, `run-accounting.ts`, `conversations/slack.ts`, `WorkTime`, `command`, `IntakeLedger`, `assignment-poll.ts`, `azure.ts`, `cec/workflow.ts`, `schedule.ts`, `cost-ledger.ts`, `ticket-evidence.ts`, `enrollment-gate.ts`, `SourceRegistry`, `scheduler.ts`, `http/commands.ts`, `.emit`, `offices.ts`, `slack-intake/report.ts`, `weekly-rollup.ts`, `slack-intake/run.ts`, `cec/issue-publication.ts`, `registry.ts`, `Coordinator`, `knowledge/learning-events.ts`, `.save`, `harnessEffect`, `scheduled-work.ts`, `JiraIssuePublisher`, `remove-candidate.ts`, `tracking-issue.ts`, `workKey`, `admit-improvement.ts`, `GitHubIssuePublisher`, `it-specialist.ts`, `jira-time.ts`, `.getEffect`, `lesson-selection.ts`, `coordination.ts`, `telemetry/report.ts`, `HOLDS`, `blocker-followups.ts`, `dependencies.ts`, `coordination-tick.ts`, `.value`, `discovery-recovery.ts`, `effects.ts`, `create-candidate.ts`, `read-retries.ts`, `QuestionNotifications`, `BrainFollowup`?**
  _High betweenness centrality (0.137) - this node is a cross-community bridge._
- **Why does `command()` connect `command` to `artifact`, `TicketJob`, `github-delivery.ts`, `office/config.ts`, `agents.ts`, `Store`, `shared.ts`, `process.ts`, `worker-runtime.ts`, `digest`, `session-bridge.ts`, `requests.ts`, `digest`, `maintenance/maintenance.ts`, `accept-stage-result.ts`, `assignment-poll.ts`, `azure.ts`, `reader.ts`, `cec/workflow.ts`, `cost-ledger.ts`, `ticket-evidence.ts`, `cec/issue-publication.ts`, `registry.ts`, `Coordinator`, `.save`, `harnessEffect`, `scheduled-work.ts`, `JiraIssuePublisher`, `remove-candidate.ts`, `admit-improvement.ts`, `GitHubIssuePublisher`, `it-specialist.ts`, `jira-time.ts`, `.getEffect`, `coordination.ts`, `contract.ts`, `dependencies.ts`, `.value`, `command-registry.ts`, `effects.ts`, `create-candidate.ts`, `BrainFollowup`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `Coordinator` connect `Coordinator` to `scheduled-work.ts`, `assignment-poll.ts`, `process.ts`, `coordination.ts`, `scheduled-captures.ts`, `session-bridge.ts`, `dependencies.ts`, `coordination-tick.ts`, `offices.ts`, `requests.ts`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `command()` (e.g. with `.constructor()` and `executeRequest()`) actually correct?**
  _`command()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _421 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `artifact` be split into smaller, more focused modules?**
  _Cohesion score 0.05652951699463327 - nodes in this community are weakly interconnected._
- **Should `TicketJob` be split into smaller, more focused modules?**
  _Cohesion score 0.04995579133510168 - nodes in this community are weakly interconnected._