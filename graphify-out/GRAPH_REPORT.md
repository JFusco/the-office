# Graph Report - office-publication-recovery  (2026-11-11)

## Corpus Check
- 784 files · ~312,735 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3857 nodes · 17586 edges · 109 communities (105 shown, 4 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 103 edges (avg confidence: 0.74)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6045cfbe`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- github-delivery.ts
- index.tsx
- shared.ts
- rootArtifact
- post-conflict-preparation.ts
- workKey
- TicketJob
- cx
- record-trigger.ts
- Button
- source-amendment.ts
- process.ts
- knowledge/routes.ts
- scheduled-captures.ts
- run-retrospective.ts
- Store
- constellation-runtime.ts
- artifact
- sanitize
- digest
- App.tsx
- config.ts
- session-bridge.ts
- SourceRegistry
- notifications.ts
- knowledge.ts
- offices.ts
- Role
- mutedCopy
- easternDay
- worker-runtime.ts
- maintenance/maintenance.ts
- TelemetryPanel.tsx
- weekly-rollup.ts
- features.ts
- agents.ts
- accept-stage-result.ts
- digest
- authorize.ts
- exposureSourceVisible
- features/commands.ts
- cec/issue-publication.ts
- azure.ts
- readback-evidence.ts
- scope-repair-resume.ts
- dependency-bots/adopt.ts
- .emit
- cost-ledger.ts
- run-accounting.ts
- telemetry.ts
- .save
- time-scope.ts
- github/issue-publication.ts
- .getEffect
- .transaction
- scheduler.ts
- ticket-evidence.ts
- Coordinator
- jira-time.ts
- TeamMessage
- remove-candidate.ts
- publish-pr.ts
- enrollment-gate.ts
- index.ts
- scheduled-work.ts
- ticket-stage-runner.ts
- model-routes.ts
- admit-improvement.ts
- intake/admission.ts
- tracking-issue.ts
- GitHubIssuePublisher
- goal-reviews.ts
- delivery-authority.ts
- run.ts
- engine.ts
- Engine
- evidence.ts
- coordination.ts
- it-specialist.ts
- api-routes.ts
- cec/workflow.ts
- approach.ts
- assignment-poll.ts
- coordination-tick.ts
- fact-bounds.ts
- blocker-followups.ts
- report.ts
- preferences-store.ts
- checkpoint-completion.ts
- work.ts
- .value
- DailyCTO.tsx
- delivery-task.ts
- jira-operations.ts
- json
- investigations/ledger.ts
- documentText
- evidence-digest.ts
- codex-rollout.ts
- cli.ts
- lesson-exits.ts
- brain-followup.ts
- owned-artifact.ts
- extract-worker.mjs
- highestStableAtLeast
- slack-supersession.ts
- helper-evidence.py
- packed-publication-repair.ts

## God Nodes (most connected - your core abstractions)
1. `Store` - 361 edges
2. `TicketJob` - 173 edges
3. `digest()` - 150 edges
4. `GitHubDelivery` - 148 edges
5. `artifact()` - 127 edges
6. `command()` - 110 edges
7. `workKey()` - 99 edges
8. `cx()` - 86 edges
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

## Communities (109 total, 4 thin omitted)

### Community 0 - "github-delivery.ts"
Cohesion: 0.06
Nodes (96): containedFile(), findingsBlock(), assertDeliveryMayMutate(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery(), BOARD_RULE (+88 more)

### Community 1 - "index.tsx"
Cohesion: 0.06
Nodes (76): Outbox(), SendMessage, slackMessageStatus(), SlackDeliveryCard(), FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace() (+68 more)

### Community 2 - "shared.ts"
Cohesion: 0.05
Nodes (72): projectOutbox(), compactSteps(), knowledgeOutbox(), checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), repeatedVendorReviewBlock(), stoppedInVendorReview() (+64 more)

### Community 3 - "rootArtifact"
Cohesion: 0.06
Nodes (82): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+74 more)

### Community 4 - "post-conflict-preparation.ts"
Cohesion: 0.07
Nodes (66): partialLocalCleanupCandidate(), candidateInput(), children, oldAdoptionBasis(), savedCandidateAdmission, assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate() (+58 more)

### Community 5 - "workKey"
Cohesion: 0.07
Nodes (64): completedPRReviews(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat() (+56 more)

### Community 6 - "TicketJob"
Cohesion: 0.08
Nodes (39): removeAdoptedClone(), harnessCloseout(), PASSING, verifyMergeActions(), namedRepairIds(), runHarnessStage(), harnessStageResult(), receipt() (+31 more)

### Community 7 - "cx"
Cohesion: 0.06
Nodes (63): itAgent(), itDiagnostics(), ServiceHealthPanel(), EvidenceCard(), TicketHeading(), displayAgentTask(), withoutElapsed(), CameraBookmark (+55 more)

### Community 8 - "record-trigger.ts"
Cohesion: 0.07
Nodes (59): deliveryMetrics(), median(), baselineLearning(), LEARNING_BASELINES, maintainLearning(), configureKnowledge(), maintenanceSubject(), MaintenanceSubjectFacts (+51 more)

### Community 9 - "Button"
Cohesion: 0.07
Nodes (47): KnowledgeDigestDelivery, KnowledgeSourceSummary, KnowledgeActivity, KnowledgeActivityPage, Activity(), ActivityTimeline(), AssignmentKnowledge(), empty (+39 more)

### Community 10 - "source-amendment.ts"
Cohesion: 0.07
Nodes (63): adoptCandidate(), approvedText(), assert(), amendmentIssueSha256(), authorizeSourceAmendment(), Binding, assert(), normalize() (+55 more)

### Community 11 - "process.ts"
Cohesion: 0.06
Nodes (43): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+35 more)

### Community 12 - "knowledge/routes.ts"
Cohesion: 0.13
Nodes (40): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), KnowledgeContext, prepareDigestBodies(), retainDigestBody(), knowledgeSnapshot(), officeKnowledgeSnapshot() (+32 more)

### Community 13 - "scheduled-captures.ts"
Cohesion: 0.15
Nodes (45): createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest, captureRequests() (+37 more)

### Community 14 - "run-retrospective.ts"
Cohesion: 0.07
Nodes (48): Accepted, acceptRetrospective(), BLOCKED, RETROSPECTIVE_HISTORY, Shared, curateLesson(), Curation, CurationAction (+40 more)

### Community 15 - "Store"
Cohesion: 0.07
Nodes (28): helperTelemetry(), dispatchExposure(), prepareExposure(), Clock, systemClock, sanitizeObject(), applyConnectionSettings(), closeConnection() (+20 more)

### Community 16 - "constellation-runtime.ts"
Cohesion: 0.08
Nodes (40): KnowledgeEdge, KnowledgeMap, KnowledgeNode, CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance (+32 more)

### Community 17 - "artifact"
Cohesion: 0.10
Nodes (45): pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), admitGreen156(), GREEN156, green156Admitted(), green156Subject(), retainedGreen156Audit(), assertStoppedBaseAudit() (+37 more)

### Community 18 - "sanitize"
Cohesion: 0.08
Nodes (35): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+27 more)

### Community 19 - "digest"
Cohesion: 0.10
Nodes (32): createExtractor(), extractDocument, Extraction, Extractor, uploadArtifact(), digest(), assertDigestDispatch(), outboundBody() (+24 more)

### Community 20 - "App.tsx"
Cohesion: 0.05
Nodes (48): BrainDrawer(), themeColor, App(), BrainWorkspace, CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants (+40 more)

### Community 21 - "config.ts"
Cohesion: 0.08
Nodes (33): discoveryPrompt(), planPrompt(), document(), featureRoot(), DiscoverySchema, HarnessCommand, identity, manifestFromPlan() (+25 more)

### Community 22 - "session-bridge.ts"
Cohesion: 0.08
Nodes (37): claudeSessionContext(), readTranscript, root, claudeSessionScope(), accountCodexProcesses(), codexProcessInventory, DesktopSessions, unaccountedProcesses() (+29 more)

### Community 23 - "SourceRegistry"
Cohesion: 0.10
Nodes (23): KnowledgeRunner, collectionAllowed(), Command, sourceCommand(), assertIntakeBinding(), IntakeBinding, IntakeBudget, sourceList() (+15 more)

### Community 24 - "notifications.ts"
Cohesion: 0.09
Nodes (28): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR (+20 more)

### Community 25 - "knowledge.ts"
Cohesion: 0.08
Nodes (33): learningMetrics(), AssignmentLookups, Binding, lookupInstructions(), lookupJournal, KnowledgeAssignment, ImprovementGrant, KnowledgeRetry (+25 more)

### Community 26 - "offices.ts"
Cohesion: 0.06
Nodes (30): committedNotePage(), BrainGraph, BrainNote, BrainReader, CommittedBrain, GraphNode, GraphPage, hash (+22 more)

### Community 27 - "Role"
Cohesion: 0.10
Nodes (41): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+33 more)

### Community 28 - "mutedCopy"
Cohesion: 0.11
Nodes (35): SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView() (+27 more)

### Community 29 - "easternDay"
Cohesion: 0.10
Nodes (21): DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), dailyReviewDate(), reviewWeekday(), queueGoalEvidenceRequest(), DailyResultSchema (+13 more)

### Community 30 - "worker-runtime.ts"
Cohesion: 0.08
Nodes (36): candidateWorkspaceEnvironment(), assignmentSubject(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), LessonSelection (+28 more)

### Community 31 - "maintenance/maintenance.ts"
Cohesion: 0.09
Nodes (28): maintenancePolicies(), captureMaintenanceStep(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice(), candidateOwner() (+20 more)

### Community 32 - "TelemetryPanel.tsx"
Cohesion: 0.10
Nodes (36): TelemetryReport, AzureBuild, ROLE_NAMES, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens() (+28 more)

### Community 33 - "weekly-rollup.ts"
Cohesion: 0.09
Nodes (37): improvementIntakeGate(), captureLearning(), learningDigest(), recordLearningOpportunity(), expireLearningPackets(), packetReferences(), citations(), recordAcceptedKnowledge() (+29 more)

### Community 34 - "features.ts"
Cohesion: 0.09
Nodes (36): normalizeRound(), FeatureApproval, FeatureAttempt, FeatureAuthority, FeatureBaseline, FeatureDocument, FeatureHandoff, FeatureHarnessAction (+28 more)

### Community 35 - "agents.ts"
Cohesion: 0.07
Nodes (31): cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), ctoChatPrompt(), SlackResultSchema, SlackVerificationSchema, HANDS_OFF_RESOLUTION_GUIDANCE (+23 more)

### Community 36 - "accept-stage-result.ts"
Cohesion: 0.13
Nodes (33): acceptStageResult(), linkDraftIssue(), protectedOriginalClaim(), METADATA_FINDING, publicationReadArgs(), Read, readPublication(), mergeAuthorized() (+25 more)

### Community 37 - "digest"
Cohesion: 0.20
Nodes (31): admitPRMetadata(), assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema, savedMetadataAssessment(), validateSaved(), metadataClaim() (+23 more)

### Community 38 - "authorize.ts"
Cohesion: 0.12
Nodes (23): approveFeature(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), artifactPath(), digest(), Link (+15 more)

### Community 39 - "exposureSourceVisible"
Cohesion: 0.11
Nodes (20): normalizeStatement(), retainedArtifactScope(), eventSourceBindings(), exposureBindings(), requestSourceBindings(), decideOfficeProposal(), mirrorOfficeKnowledge(), now() (+12 more)

### Community 40 - "features/commands.ts"
Cohesion: 0.15
Nodes (28): commandFeature(), reviewQuestions(), FeatureCommandSchema, readEvidence(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS, requestReplan() (+20 more)

### Community 41 - "cec/issue-publication.ts"
Cohesion: 0.15
Nodes (13): Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), Transition, descriptionPreimage(), plain() (+5 more)

### Community 42 - "azure.ts"
Cohesion: 0.10
Nodes (27): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+19 more)

### Community 43 - "readback-evidence.ts"
Cohesion: 0.17
Nodes (25): HarnessControl, withHarnessWork(), admitPacked165(), history(), makePacked165Candidate(), packed165CandidateIdentity(), packed165Subject(), retainedPacked165Effect() (+17 more)

### Community 44 - "scope-repair-resume.ts"
Cohesion: 0.13
Nodes (34): deliveryTask(), stagePrompt(), StagePromptInput, METADATA_FINDING_GUIDANCE, Assessment, outsideScanSources(), Ownership, reconcileScopeRepairReadback() (+26 more)

### Community 45 - "dependency-bots/adopt.ts"
Cohesion: 0.15
Nodes (26): Execute, adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR, openDependabotPulls() (+18 more)

### Community 46 - ".emit"
Cohesion: 0.12
Nodes (29): configureNotices(), retryRecipientLookup(), enqueueGreen156(), Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput (+21 more)

### Community 47 - "cost-ledger.ts"
Cohesion: 0.15
Nodes (25): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId(), OutsideEdit (+17 more)

### Community 48 - "run-accounting.ts"
Cohesion: 0.11
Nodes (30): BoundedRead, backfillClaudeCost(), CompletionReader, codexHome(), createdAt(), dayDirs(), header(), readCodexRollout() (+22 more)

### Community 49 - "telemetry.ts"
Cohesion: 0.09
Nodes (28): CodexRollout, CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL (+20 more)

### Community 50 - ".save"
Cohesion: 0.18
Nodes (27): correlatedBuild(), BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue(), readIssues() (+19 more)

### Community 51 - "time-scope.ts"
Cohesion: 0.16
Nodes (27): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence(), CaptureContext (+19 more)

### Community 52 - "github/issue-publication.ts"
Cohesion: 0.22
Nodes (24): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), ProjectCard, projectCards(), projectGraphql() (+16 more)

### Community 53 - ".getEffect"
Cohesion: 0.17
Nodes (13): publishFeature(), GitHubOperations, digestNoticeNeverDispatched(), fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), goalNoticeNeverDispatched(), Assessment (+5 more)

### Community 54 - ".transaction"
Cohesion: 0.20
Nodes (18): featureItemComplete(), reconcileFeatureCompletion(), automaticEnabled(), automaticFeature(), FeaturePlanningConfig, POLICY_VERSION, recoveryHeld(), wakeFeature() (+10 more)

### Community 55 - "scheduler.ts"
Cohesion: 0.15
Nodes (14): ROLES, fifo(), ScheduledWork, Scheduler, selectWork(), admitsWork(), canDispatch(), deliveryOccupied() (+6 more)

### Community 56 - "ticket-evidence.ts"
Cohesion: 0.20
Nodes (20): unpack(), assetDownloader(), attachmentKind(), evidenceDirectory(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS (+12 more)

### Community 57 - "Coordinator"
Cohesion: 0.08
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 58 - "jira-time.ts"
Cohesion: 0.14
Nodes (19): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+11 more)

### Community 59 - "TeamMessage"
Cohesion: 0.16
Nodes (16): cecChatPrompt(), itChatPrompt(), slackSendPrompt(), PICKUP_CHAT, diagnosticContext(), DATA, SKILLS, itFollowUpView() (+8 more)

### Community 60 - "remove-candidate.ts"
Cohesion: 0.18
Nodes (18): initialManualStart(), recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot() (+10 more)

### Community 61 - "publish-pr.ts"
Cohesion: 0.15
Nodes (19): harnessEffect, retryRead(), park(), commitlintRejection(), developerPRContent(), Execute, officePRContent(), prContent (+11 more)

### Community 62 - "enrollment-gate.ts"
Cohesion: 0.25
Nodes (16): featureById(), bindFeature(), currentApproval(), featureGate(), predecessorComplete(), deliveryPreflight, handoffBinding(), readHandoff() (+8 more)

### Community 63 - "index.ts"
Cohesion: 0.13
Nodes (17): close(), config, itSpecialist, loadedRevision, offices, releaseLock, server, serviceHealth (+9 more)

### Community 64 - "scheduled-work.ts"
Cohesion: 0.17
Nodes (19): deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), metadataRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), requestPriority() (+11 more)

### Community 65 - "ticket-stage-runner.ts"
Cohesion: 0.23
Nodes (18): run(), publicationEvidenceGap(), qaEvidenceGap(), resultGate(), stageResultGap(), approachFingerprint(), enqueueRepairDiagnosis(), jiraRepairable() (+10 more)

### Community 66 - "model-routes.ts"
Cohesion: 0.16
Nodes (19): AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), FeaturePlanningBindings, goalEvidencePath(), OfficeConfigInputs, officeConfigRoute(), officeConfigSummary(), CECBinding (+11 more)

### Community 67 - "admit-improvement.ts"
Cohesion: 0.22
Nodes (16): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+8 more)

### Community 68 - "intake/admission.ts"
Cohesion: 0.25
Nodes (17): deliveryIntakeBlocker(), Admission, admit(), IntakeContext, compatible(), dependencyCompletionKey(), dependencyEligibility(), DependencyStores (+9 more)

### Community 69 - "tracking-issue.ts"
Cohesion: 0.20
Nodes (17): readBackOrThrow(), ensureTrackingIssue(), findTrackingIssue(), ownTracking(), TrackingIssue, trackingIssueBody(), trackingIssueTitle(), trackingMarker() (+9 more)

### Community 70 - "GitHubIssuePublisher"
Cohesion: 0.24
Nodes (7): Assign, Board, GitHubIssuePublisher, number(), same(), label(), personaContext()

### Community 71 - "goal-reviews.ts"
Cohesion: 0.14
Nodes (16): applyGoalReview(), EvidenceRefSchema, FreshDailyResultSchema, statusAllowed(), workEvidence(), GoalInput, saveGoal(), queueGoalNotice() (+8 more)

### Community 72 - "delivery-authority.ts"
Cohesion: 0.20
Nodes (15): deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, requireDeliveryAuthority(), gateRegisteredDelivery(), accounting, DeliverySubject (+7 more)

### Community 73 - "run.ts"
Cohesion: 0.20
Nodes (14): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, OFFICE_FIX_PROMPT, OfficeFixResult, validateOfficeFix(), investigationReady(), InvestigationOptions, InvestigationReport (+6 more)

### Community 74 - "engine.ts"
Cohesion: 0.22
Nodes (15): requestMail(), dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery(), resume(), startPilot(), advance() (+7 more)

### Community 76 - "evidence.ts"
Cohesion: 0.20
Nodes (13): investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_SOURCE_PATHS, officeSource(), ROOT, LaunchPolicy (+5 more)

### Community 77 - "coordination.ts"
Cohesion: 0.17
Nodes (17): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation(), checkpointWindow(), dueAt() (+9 more)

### Community 78 - "it-specialist.ts"
Cohesion: 0.24
Nodes (12): partialLocalCleanupKey(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), ITContext, publishITReport(), delays (+4 more)

### Community 79 - "api-routes.ts"
Cohesion: 0.32
Nodes (10): assertAssessmentVisibility(), assertQuestionVisibility(), pendingQuestions(), eventVisible(), knowledgeOfficeState(), knowledgePromptStore(), goalHistory(), apiRoute() (+2 more)

### Community 80 - "cec/workflow.ts"
Cohesion: 0.24
Nodes (9): applyIntakeObservation(), checkMail(), drainMail(), MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), ingest(), Stage (+1 more)

### Community 81 - "approach.ts"
Cohesion: 0.28
Nodes (13): parksInJira(), DECISION_KINDS, needsDecision(), afterDraft(), ApproachSchema, firstBuildStage(), missingApproachStage(), plannedNext() (+5 more)

### Community 82 - "assignment-poll.ts"
Cohesion: 0.24
Nodes (12): noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), syncOutbox(), admitReadyCards(), WAIT_STATUSES, pinCourier, due() (+4 more)

### Community 83 - "coordination-tick.ts"
Cohesion: 0.22
Nodes (12): reconcileNoticeConfirmations(), PrerequisitesSchema, legacy, reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION, tick() (+4 more)

### Community 84 - "fact-bounds.ts"
Cohesion: 0.28
Nodes (14): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+6 more)

### Community 85 - "blocker-followups.ts"
Cohesion: 0.32
Nodes (10): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), readBackConversations(), diagnosticSnapshot(), nativeDeliveryResolved(), handoff() (+2 more)

### Community 86 - "report.ts"
Cohesion: 0.27
Nodes (13): telemetryRoute(), Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked() (+5 more)

### Community 87 - "preferences-store.ts"
Cohesion: 0.21
Nodes (9): PreferencesRouteContext, fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, SettingsPanel(), OFFICE_PREFERENCE_DEFAULTS (+1 more)

### Community 88 - "checkpoint-completion.ts"
Cohesion: 0.23
Nodes (8): BrainStatusSchema, identity, parseBrainStatus(), brainCheckpointCompletion(), coverageSchema, followupSchema, verified, reconcileCompletedCheckpoints()

### Community 89 - "work.ts"
Cohesion: 0.15
Nodes (12): AssignmentResult, CompletionCondition, Continuation, DeliveryAdmission, DependencyObservation, EligibilityState, FailureCategory, ReconciliationAction (+4 more)

### Community 90 - ".value"
Cohesion: 0.24
Nodes (6): file, folder, logs, root, xml(), ProjectProgress

### Community 91 - "DailyCTO.tsx"
Cohesion: 0.26
Nodes (8): CTOReview(), goalState, DailyCTO(), GoalHistory(), reportDate(), reviewStatus, reviewExcerpt(), ReviewText()

### Community 92 - "delivery-task.ts"
Cohesion: 0.25
Nodes (8): cecPrompt(), resolvedDecisionNote(), stageInstructions, APPROACH_GUIDANCE, reviewInstructions(), DeliveryTaskInput, DISCOVERY_GUIDANCE, AMENDMENT_REVIEW_PROOF

### Community 93 - "jira-operations.ts"
Cohesion: 0.31
Nodes (5): CommentPage, commentReadback(), JiraOperations, plain(), jiraRecord()

### Community 94 - "json"
Cohesion: 0.36
Nodes (6): featureRoute(), RequestContext, preferencesRoute(), fileResponse(), json(), staticRoute()

### Community 95 - "investigations/ledger.ts"
Cohesion: 0.51
Nodes (7): investigationCandidates(), investigationId(), investigationFollowUps(), investigationResolution(), syncInvestigations(), requeueInvestigationEvidence(), ITInvestigation

### Community 96 - "documentText"
Cohesion: 0.33
Nodes (6): guidanceExcerpt(), evidenceTitle(), DocumentMetadata, documentText(), KnowledgeDocumentText, DocumentPreview()

### Community 97 - "evidence-digest.ts"
Cohesion: 0.44
Nodes (7): canonical(), evidenceDigest(), evidenceHash(), semantic(), stableUrl(), requirementDrift(), RequirementPostimage

### Community 98 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 99 - "cli.ts"
Cohesion: 0.25
Nodes (6): args, [cmd,...rawArgs], commands, key, projectIndex, PORT

### Community 100 - "lesson-exits.ts"
Cohesion: 0.48
Nodes (6): expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire()

### Community 102 - "owned-artifact.ts"
Cohesion: 0.73
Nodes (5): done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf()

### Community 103 - "extract-worker.mjs"
Cohesion: 0.70
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 104 - "highestStableAtLeast"
Cohesion: 0.83
Nodes (3): compare(), highestStableAtLeast(), parts()

### Community 105 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

## Knowledge Gaps
- **429 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+424 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `github-delivery.ts`, `shared.ts`, `rootArtifact`, `post-conflict-preparation.ts`, `workKey`, `TicketJob`, `record-trigger.ts`, `source-amendment.ts`, `process.ts`, `knowledge/routes.ts`, `scheduled-captures.ts`, `run-retrospective.ts`, `artifact`, `sanitize`, `digest`, `config.ts`, `session-bridge.ts`, `SourceRegistry`, `notifications.ts`, `knowledge.ts`, `offices.ts`, `easternDay`, `worker-runtime.ts`, `maintenance/maintenance.ts`, `weekly-rollup.ts`, `agents.ts`, `accept-stage-result.ts`, `digest`, `authorize.ts`, `exposureSourceVisible`, `features/commands.ts`, `cec/issue-publication.ts`, `azure.ts`, `readback-evidence.ts`, `scope-repair-resume.ts`, `dependency-bots/adopt.ts`, `.emit`, `cost-ledger.ts`, `run-accounting.ts`, `.save`, `time-scope.ts`, `github/issue-publication.ts`, `.getEffect`, `.transaction`, `scheduler.ts`, `ticket-evidence.ts`, `Coordinator`, `jira-time.ts`, `TeamMessage`, `remove-candidate.ts`, `publish-pr.ts`, `enrollment-gate.ts`, `scheduled-work.ts`, `ticket-stage-runner.ts`, `admit-improvement.ts`, `intake/admission.ts`, `tracking-issue.ts`, `GitHubIssuePublisher`, `goal-reviews.ts`, `delivery-authority.ts`, `run.ts`, `engine.ts`, `Engine`, `evidence.ts`, `coordination.ts`, `it-specialist.ts`, `api-routes.ts`, `cec/workflow.ts`, `coordination-tick.ts`, `blocker-followups.ts`, `report.ts`, `checkpoint-completion.ts`, `.value`, `delivery-task.ts`, `jira-operations.ts`, `investigations/ledger.ts`, `lesson-exits.ts`, `brain-followup.ts`?**
  _High betweenness centrality (0.142) - this node is a cross-community bridge._
- **Why does `command()` connect `config.ts` to `github-delivery.ts`, `shared.ts`, `rootArtifact`, `workKey`, `TicketJob`, `process.ts`, `Store`, `artifact`, `sanitize`, `digest`, `session-bridge.ts`, `notifications.ts`, `offices.ts`, `worker-runtime.ts`, `maintenance/maintenance.ts`, `agents.ts`, `accept-stage-result.ts`, `authorize.ts`, `cec/issue-publication.ts`, `azure.ts`, `readback-evidence.ts`, `cost-ledger.ts`, `.save`, `github/issue-publication.ts`, `.getEffect`, `.transaction`, `ticket-evidence.ts`, `Coordinator`, `jira-time.ts`, `remove-candidate.ts`, `publish-pr.ts`, `index.ts`, `scheduled-work.ts`, `ticket-stage-runner.ts`, `admit-improvement.ts`, `intake/admission.ts`, `GitHubIssuePublisher`, `engine.ts`, `Engine`, `coordination.ts`, `.value`, `jira-operations.ts`, `lesson-exits.ts`, `brain-followup.ts`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `TicketJob` connect `TicketJob` to `github-delivery.ts`, `index.tsx`, `shared.ts`, `rootArtifact`, `post-conflict-preparation.ts`, `workKey`, `record-trigger.ts`, `source-amendment.ts`, `process.ts`, `artifact`, `worker-runtime.ts`, `accept-stage-result.ts`, `digest`, `readback-evidence.ts`, `scope-repair-resume.ts`, `dependency-bots/adopt.ts`, `.emit`, `github/issue-publication.ts`, `scheduler.ts`, `remove-candidate.ts`, `publish-pr.ts`, `ticket-stage-runner.ts`, `intake/admission.ts`, `tracking-issue.ts`, `delivery-authority.ts`, `it-specialist.ts`, `approach.ts`, `fact-bounds.ts`, `.value`, `delivery-task.ts`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _429 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `github-delivery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.055664488017429195 - nodes in this community are weakly interconnected._
- **Should `index.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05555555555555555 - nodes in this community are weakly interconnected._
- **Should `shared.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.049494949494949494 - nodes in this community are weakly interconnected._