# Graph Report - the-office  (2026-11-10)

## Corpus Check
- 743 files · ~299,983 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3744 nodes · 16978 edges · 110 communities (104 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 100 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e0cf8310`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- dependency-bots/adopt.ts
- cec/workflow.ts
- App.tsx
- source-amendment-scope.ts
- command
- artifact
- .emit
- source-amendment.ts
- OfficeScene.tsx
- worker-runtime.ts
- Inspector.tsx
- github-readiness.ts
- index.ts
- ticket-evidence.ts
- closeout-recovery.ts
- agents.ts
- MapView.tsx
- harnessEffect
- index.tsx
- .getEffect
- goal-evidence.ts
- digest
- lesson-selection.ts
- constellation-runtime.ts
- SourceRegistry
- Role
- validate-stage.ts
- TimeBook.tsx
- azure.ts
- maintenance/maintenance.ts
- GitHubDelivery
- scheduled-work.ts
- features.ts
- .transaction
- enrollment-gate.ts
- policy.ts
- session-bridge.ts
- cec/issue-publication.ts
- goal-reporting.ts
- digest
- run-accounting.ts
- run-cost.ts
- admit-improvement.ts
- tracking-issue.ts
- GitHubIssuePublisher
- http/commands.ts
- cost-ledger.ts
- investigations/run.ts
- run-retrospective.ts
- slack-intake/run.ts
- process.ts
- it-specialist.ts
- IntakeLedger
- .save
- workKey
- jira-time.ts
- WorkTime
- Coordinator
- Feature
- knowledge/routes.ts
- captures.ts
- local-config.ts
- assignment-poll.ts
- dependencies.ts
- remove-candidate.ts
- slack-intake/report.ts
- documentText
- fact-bounds.ts
- coordination.ts
- OfficeSnapshot
- schedule.ts
- currentAssignment
- control-store.ts
- notifications.ts
- github-delivery.ts
- knowledge/learning-events.ts
- ControlStore
- outbox.ts
- BrainFollowup
- knowledge.ts
- .pump
- work.ts
- shared.ts
- Store
- DailyCTO.tsx
- codex-rollout.ts
- observations.ts
- telemetry/report.ts
- investigations/ledger.ts
- telemetry.ts
- scheduled-captures.ts
- checkpoint-completion.ts
- reader.ts
- coordination-tick.ts
- extraction.ts
- codex-rollout-file.ts
- owned-artifact.ts
- command-registry.ts
- Lesson
- merge-summary.ts
- SlackMessages
- run-usage.ts
- liveReach
- extract-worker.mjs
- slack-supersession.ts
- helper-evidence.py
- save-review-briefing.ts
- .value
- offices.ts

## God Nodes (most connected - your core abstractions)
1. `Store` - 339 edges
2. `TicketJob` - 144 edges
3. `GitHubDelivery` - 135 edges
4. `command()` - 108 edges
5. `digest()` - 105 edges
6. `artifact()` - 98 edges
7. `workKey()` - 91 edges
8. `cx()` - 88 edges
9. `currentAssignment()` - 71 edges
10. `OfficeSnapshot` - 70 edges

## Surprising Connections (you probably didn't know these)
- `readAzurePRs()` --indirect_call--> `row()`  [INFERRED]
  server/cec/observed-prs.ts → src/telemetry/report.ts
- `Admission` --references--> `AssignmentReview`  [EXTRACTED]
  server/delivery/intake/admission.ts → src/shared.ts
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

## Communities (110 total, 6 thin omitted)

### Community 0 - "dependency-bots/adopt.ts"
Cohesion: 0.14
Nodes (28): Execute, adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR, openDependabotPulls() (+20 more)

### Community 1 - "cec/workflow.ts"
Cohesion: 0.05
Nodes (76): correlatedBuild(), MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), run(), nextStage(), publicationEvidenceGap(), qaEvidenceGap() (+68 more)

### Community 2 - "App.tsx"
Cohesion: 0.05
Nodes (56): compactSteps(), themeColor, App(), BrainWorkspace, CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants (+48 more)

### Community 3 - "source-amendment-scope.ts"
Cohesion: 0.10
Nodes (33): approvedText(), assert(), amendmentCaptureObservation(), capture, generation, GenerationContext, head, ids (+25 more)

### Community 4 - "command"
Cohesion: 0.06
Nodes (15): JiraOperations, plain(), unpack(), checkMail(), drainMail(), requestMail(), ingest(), Result (+7 more)

### Community 5 - "artifact"
Cohesion: 0.09
Nodes (62): continuationNativeReview(), candidateInput(), children, oldAdoptionBasis(), savedCandidateAdmission, assertPostConflictFiles(), assertPostConflictOwnership(), completedConflictDraftCandidate() (+54 more)

### Community 6 - ".emit"
Cohesion: 0.09
Nodes (27): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+19 more)

### Community 7 - "source-amendment.ts"
Cohesion: 0.10
Nodes (48): adoptCandidate(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related, requireThat() (+40 more)

### Community 8 - "OfficeScene.tsx"
Cohesion: 0.05
Nodes (61): diagnosticContext(), itAgent(), itDiagnostics(), currentServices(), displayAgentTask(), withoutElapsed(), CameraBookmark, restoreBookmark() (+53 more)

### Community 9 - "worker-runtime.ts"
Cohesion: 0.08
Nodes (40): SlackVerificationSchema, candidateWorkspaceEnvironment(), CODEX_DEFAULT_EFFORT, CODEX_DEFAULT_MODEL, CODEX_EFFORTS, CODEX_ROLES, ModelRoute, qaPolicyRoute() (+32 more)

### Community 10 - "Inspector.tsx"
Cohesion: 0.06
Nodes (81): Conversation(), Outbox(), SendMessage, recommendedReply(), slackMessageStatus(), SlackDeliveryCard(), ServiceHealthPanel(), labels (+73 more)

### Community 11 - "github-readiness.ts"
Cohesion: 0.10
Nodes (46): APPROACH_GUIDANCE, hasUncertainEffects(), observe(), checksFailed(), checksPassed(), checksPending(), CurrentChecksWait, currentMergeChecks() (+38 more)

### Community 12 - "index.ts"
Cohesion: 0.07
Nodes (42): args, [cmd,...rawArgs], commands, key, projectIndex, close(), config, itSpecialist (+34 more)

### Community 13 - "ticket-evidence.ts"
Cohesion: 0.14
Nodes (27): assetDownloader(), attachmentKind(), evidenceDirectory(), readEvidence(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS (+19 more)

### Community 14 - "closeout-recovery.ts"
Cohesion: 0.09
Nodes (50): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+42 more)

### Community 15 - "agents.ts"
Cohesion: 0.07
Nodes (33): cecPrompt(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), resolvedDecisionNote(), stageInstructions, cecChatPrompt() (+25 more)

### Community 16 - "MapView.tsx"
Cohesion: 0.10
Nodes (34): KnowledgeActivityPage, Activity(), ActivityStatus(), AssignmentKnowledge(), CaptureReviewDetail(), CaptureReviews(), empty, EvidencePacket() (+26 more)

### Community 17 - "harnessEffect"
Cohesion: 0.18
Nodes (27): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), ProjectCard, projectCards(), projectGraphql() (+19 more)

### Community 18 - "index.tsx"
Cohesion: 0.08
Nodes (53): KnowledgeSourceSummary, BlockerFollowups(), IntakeSummary(), LessonsPanel(), when(), ResearchSummary(), completedTime, SlackSeedStatus() (+45 more)

### Community 19 - ".getEffect"
Cohesion: 0.22
Nodes (8): GitHubOperations, fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), closeNativeRefresh(), fingerprint(), Effects, EffectIntent

### Community 20 - "goal-evidence.ts"
Cohesion: 0.19
Nodes (10): GitHubMonitor, githubPRDescription(), azureGoalFacts(), boundedEvidence(), EvidenceStore, GOAL_EVIDENCE_LIMITS, AzureGoalDocument, GitHubBoard (+2 more)

### Community 21 - "digest"
Cohesion: 0.13
Nodes (45): activeEffectId(), retryRead(), admitPRMetadata(), assessPRMetadata(), captureAssessment(), originalProposal(), PRMetadataAssessmentSchema, savedMetadataAssessment() (+37 more)

### Community 22 - "lesson-selection.ts"
Cohesion: 0.15
Nodes (22): knowledgeContext(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), LessonSelection, MAINTENANCE (+14 more)

### Community 23 - "constellation-runtime.ts"
Cohesion: 0.08
Nodes (36): KnowledgeMap, KnowledgeNode, CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point (+28 more)

### Community 24 - "SourceRegistry"
Cohesion: 0.11
Nodes (21): SlackReadAuthority, collectionPolicy, readAuthority(), Command, sourceCommand(), assertIntakeBinding(), IntakeBinding, sourceList() (+13 more)

### Community 25 - "Role"
Cohesion: 0.12
Nodes (33): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+25 more)

### Community 26 - "validate-stage.ts"
Cohesion: 0.16
Nodes (17): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+9 more)

### Community 27 - "TimeBook.tsx"
Cohesion: 0.11
Nodes (32): TelemetryReport, AzureBuild, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens(), usd() (+24 more)

### Community 28 - "azure.ts"
Cohesion: 0.18
Nodes (16): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+8 more)

### Community 29 - "maintenance/maintenance.ts"
Cohesion: 0.10
Nodes (30): ApproachSchema, maintenancePolicies(), captureMaintenanceStep(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice() (+22 more)

### Community 30 - "GitHubDelivery"
Cohesion: 0.08
Nodes (36): removeAdoptedClone(), GitHubDelivery, providerFacts(), retireInactiveDeliveries(), retireUnstartedDelivery(), unstartedDelivery(), adoptedReviewCandidate(), ciCheckout() (+28 more)

### Community 31 - "scheduled-work.ts"
Cohesion: 0.14
Nodes (20): deliverySlot(), metadataRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), RollupResult, RollupHooks, deterministicActions (+12 more)

### Community 32 - "features.ts"
Cohesion: 0.08
Nodes (56): approveFeature(), commandFeature(), mutation(), reviewQuestions(), artifactPath(), digest(), document(), featureRoot() (+48 more)

### Community 33 - ".transaction"
Cohesion: 0.14
Nodes (17): featureById(), discoveryPrompt(), planPrompt(), Link, linkFeature(), FeatureErrorCode, RecoveryDecision, publishFeature() (+9 more)

### Community 34 - "enrollment-gate.ts"
Cohesion: 0.16
Nodes (26): dispatchNightly(), drainDelivery(), enableNightly(), resume(), startPilot(), advance(), eligibility(), approvedDelivery() (+18 more)

### Community 35 - "policy.ts"
Cohesion: 0.18
Nodes (21): featureItemComplete(), reconcileFeatureCompletion(), DELAYS, MAX_EXECUTIONS, MAX_REPLANS, reserveReplacement(), stageBudget(), classifyFeatureFailure() (+13 more)

### Community 36 - "session-bridge.ts"
Cohesion: 0.11
Nodes (27): claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexSessionContext(), readRollout, claudeSessions(), codexSessions() (+19 more)

### Community 37 - "cec/issue-publication.ts"
Cohesion: 0.16
Nodes (11): Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), plainDescription(), Transition, FeaturePublisher (+3 more)

### Community 38 - "goal-reporting.ts"
Cohesion: 0.14
Nodes (18): EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), GoalReport, queueGoalEvidenceRequest(), applyGoalReview(), DailyResultSchema, EvidenceRefSchema (+10 more)

### Community 39 - "digest"
Cohesion: 0.14
Nodes (26): comparableSlackText(), AuthoredDigest, reconcileDigestAuthorship(), unitAuthorship(), reconcileAuthoredEvidence(), Config, configDigest(), digest() (+18 more)

### Community 40 - "run-accounting.ts"
Cohesion: 0.18
Nodes (17): BoundedRead, CompletionReader, readCodexRollout(), codexAccounting(), COMPLETION_MAX_BYTES, completionAccounting(), merge(), readCompletion() (+9 more)

### Community 41 - "run-cost.ts"
Cohesion: 0.16
Nodes (16): CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL, Rates (+8 more)

### Community 42 - "admit-improvement.ts"
Cohesion: 0.22
Nodes (15): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+7 more)

### Community 43 - "tracking-issue.ts"
Cohesion: 0.22
Nodes (16): readBackOrThrow(), ensureTrackingIssue(), findTrackingIssue(), ownTracking(), TrackingIssue, trackingIssueBody(), trackingIssueTitle(), trackingMarker() (+8 more)

### Community 44 - "GitHubIssuePublisher"
Cohesion: 0.26
Nodes (6): Assign, Board, GitHubIssuePublisher, number(), same(), label()

### Community 45 - "http/commands.ts"
Cohesion: 0.14
Nodes (28): retryRecipientLookup(), enqueueMetadataRecovery(), configureDigestDelivery(), DigestSettings, configureKnowledge(), declineLessonIssue(), demoteLesson(), reactivateLesson() (+20 more)

### Community 46 - "cost-ledger.ts"
Cohesion: 0.18
Nodes (23): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingInProgress(), effectId(), OutsideEdit (+15 more)

### Community 47 - "investigations/run.ts"
Cohesion: 0.14
Nodes (23): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_FIX_PROMPT, OfficeFixResult (+15 more)

### Community 48 - "run-retrospective.ts"
Cohesion: 0.10
Nodes (36): Accepted, acceptRetrospective(), normalizeStatement(), RETROSPECTIVE_HISTORY, appendLearningFacts(), freezeLearningPacket(), ARTIFACT_LIMIT, clip() (+28 more)

### Community 49 - "slack-intake/run.ts"
Cohesion: 0.12
Nodes (32): annotateAuthoredUnits(), independentIntakeResult(), retryDelay(), captureProposal(), newTask(), recordObservation(), settlePage(), LIMITS (+24 more)

### Community 50 - "process.ts"
Cohesion: 0.23
Nodes (12): At, Errno, GroupInventory, GroupProbe, LifecycleDiagnostic, Phase, Pid, groupInventory() (+4 more)

### Community 51 - "it-specialist.ts"
Cohesion: 0.14
Nodes (19): savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), ITContext, diagnosticSnapshot(), publishITReport(), nativeDeliveryResolved() (+11 more)

### Community 52 - "IntakeLedger"
Cohesion: 0.14
Nodes (25): uploadArtifact(), effectId(), CaptureReceipt, ChannelProgress, IntakeResult, IntakeResultValue, Proposal, ReadKind (+17 more)

### Community 53 - ".save"
Cohesion: 0.19
Nodes (27): BLOCKED, Execute, findComment(), jira(), LiveIssue, readIssue(), readIssues(), commentDecision() (+19 more)

### Community 54 - "workKey"
Cohesion: 0.06
Nodes (59): boardPreflightCandidate(), Ownership, reconcileBoardPreflight(), CloseoutSupervisionProofRef, completedPRReviews(), continuationScope(), Assessment, bindDiscoveryResume() (+51 more)

### Community 55 - "jira-time.ts"
Cohesion: 0.15
Nodes (17): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+9 more)

### Community 56 - "WorkTime"
Cohesion: 0.20
Nodes (22): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), ScopePolicy, scopeSelector(), midnight(), TicketDay, ticketDayTotals() (+14 more)

### Community 58 - "Feature"
Cohesion: 0.19
Nodes (8): assertFeatureDependencyOrder(), featureDependencyEdges(), key(), GitHubFeaturePublisher, observeHelperGroups(), stopHelperGroups(), FeatureReviewRunner, Feature

### Community 59 - "knowledge/routes.ts"
Cohesion: 0.11
Nodes (49): intakeActivity(), knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), KnowledgeContext, independentDigestEvidence(), digestKnowledge(), prepareDigestBodies() (+41 more)

### Community 60 - "captures.ts"
Cohesion: 0.23
Nodes (12): captureAfter(), CaptureMetadata, capturePage(), cursor(), key(), captureIdentityMatches(), BrainCaptureReceipt, hash (+4 more)

### Community 61 - "local-config.ts"
Cohesion: 0.43
Nodes (7): AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), FeaturePlanningBindings, goalEvidencePath(), localBindings, assertModelOverrides(), ModelOverrides

### Community 62 - "assignment-poll.ts"
Cohesion: 0.19
Nodes (13): noticeState(), queueMergeNotice(), observeGitHubMergeNotices(), admitReadyCards(), WAIT_STATUSES, due(), unparkReleasedWaits(), compare() (+5 more)

### Community 63 - "dependencies.ts"
Cohesion: 0.29
Nodes (15): Admission, admit(), IntakeContext, compatible(), dependencyCompletionKey(), dependencyEligibility(), DependencyStores, issueKey() (+7 more)

### Community 64 - "remove-candidate.ts"
Cohesion: 0.20
Nodes (16): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+8 more)

### Community 65 - "slack-intake/report.ts"
Cohesion: 0.18
Nodes (22): isStoppingFor(), reconcileIntakeStatus(), intakeProgress(), terminalDeferred(), unitKey(), verifiedCapture(), LinkRecord, byWeek() (+14 more)

### Community 66 - "documentText"
Cohesion: 0.33
Nodes (6): guidanceExcerpt(), evidenceTitle(), DocumentMetadata, documentText(), KnowledgeDocumentText, DocumentPreview()

### Community 67 - "fact-bounds.ts"
Cohesion: 0.26
Nodes (15): collectCTOFacts(), boundedIntake(), boundedJobs(), boundedMaintenance(), boundedTime(), clip(), FINISHED_JOB, goalReferences() (+7 more)

### Community 68 - "coordination.ts"
Cohesion: 0.19
Nodes (17): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation(), checkpointWindow(), dueAt() (+9 more)

### Community 69 - "OfficeSnapshot"
Cohesion: 0.08
Nodes (30): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, slackHealth(), DailyCTOSummary (+22 more)

### Community 70 - "schedule.ts"
Cohesion: 0.14
Nodes (26): deliveryMetrics(), median(), learningMetrics(), lessonsNeedingReview(), RollupResultSchema, harperFolder(), KnowledgeRunner, RETROSPECTIVE_TIMEOUT (+18 more)

### Community 71 - "currentAssignment"
Cohesion: 0.08
Nodes (77): containedFile(), PrerequisitesSchema, activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash (+69 more)

### Community 72 - "control-store.ts"
Cohesion: 0.21
Nodes (8): Clock, systemClock, applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, statementCache(), initialSnapshot()

### Community 73 - "notifications.ts"
Cohesion: 0.11
Nodes (26): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), configureNotices(), Identity, MergeNotifications (+18 more)

### Community 74 - "github-delivery.ts"
Cohesion: 0.05
Nodes (83): parksInJira(), findingsBlock(), assertMayMutate(), runHarnessStage(), HANDS_OFF_PROJECTS, handsOff(), harnessDelivers(), legacyRecovery() (+75 more)

### Community 75 - "knowledge/learning-events.ts"
Cohesion: 0.16
Nodes (18): retainedArtifactScope(), eventSourceBindings(), improvementIntakeGate(), captureLearning(), learningDigest(), recordLearningOpportunity(), exposureBindings(), requestSourceBindings() (+10 more)

### Community 76 - "ControlStore"
Cohesion: 0.17
Nodes (7): mirror(), runWeeklyResearch(), scheduledResearch(), DailyCTO, reviewWeekday(), ControlStore, DailyCTOReport

### Community 77 - "outbox.ts"
Cohesion: 0.17
Nodes (20): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), projectOutbox(), readBackConversations(), handoff(), reconcileBlockerFollowups() (+12 more)

### Community 79 - "knowledge.ts"
Cohesion: 0.08
Nodes (29): AssignmentLookups, lookupInstructions(), decodeLookupJournal(), lookupJournal, KnowledgeAssignment, ImprovementGrant, KnowledgeRetry, KnowledgeSourceBinding (+21 more)

### Community 81 - "work.ts"
Cohesion: 0.18
Nodes (11): ProjectReadiness, AssignmentResult, CompletionCondition, Continuation, DependencyObservation, EligibilityState, FailureCategory, ReconciliationAction (+3 more)

### Community 82 - "shared.ts"
Cohesion: 0.05
Nodes (54): maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject, SubjectStepResult, ticketSubject() (+46 more)

### Community 83 - "Store"
Cohesion: 0.10
Nodes (20): PICKUP_CHAT, helperTelemetry(), JiraFeaturePublisher, assignmentSubject(), dispatchExposure(), prepareExposure(), assertRetainedDispatchScope(), DATA (+12 more)

### Community 84 - "DailyCTO.tsx"
Cohesion: 0.26
Nodes (8): CTOReview(), goalState, DailyCTO(), GoalHistory(), reportDate(), reviewStatus, reviewExcerpt(), ReviewText()

### Community 85 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 86 - "observations.ts"
Cohesion: 0.22
Nodes (11): Message, observeRead(), Page, ReadUnavailable, IntakeRateLimit, readRateLimit(), compareTs(), micros() (+3 more)

### Community 87 - "telemetry/report.ts"
Cohesion: 0.16
Nodes (21): isTicketModelWork(), awaitingEvidence(), boardUsd(), CaptureContext, inCostWindow(), TicketCost, ticketCosts(), ISSUE_KEY (+13 more)

### Community 88 - "investigations/ledger.ts"
Cohesion: 0.25
Nodes (15): syncOutbox(), projectSlackDeliveries(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint(), slackRequestSettled(), supersedingDelivery() (+7 more)

### Community 89 - "telemetry.ts"
Cohesion: 0.14
Nodes (14): comparable(), EvidenceOutcome, recordRunEvidence(), backfillClaudeCost(), CostCompleteness, CostComponent, CostLedgerState, RunAccounting (+6 more)

### Community 90 - "scheduled-captures.ts"
Cohesion: 0.14
Nodes (48): requestDelivery(), createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest (+40 more)

### Community 91 - "checkpoint-completion.ts"
Cohesion: 0.24
Nodes (7): BrainStatusSchema, identity, coverageSchema, followupSchema, verified, ReconciliationRequest, DailyCheckpoint

### Community 92 - "reader.ts"
Cohesion: 0.12
Nodes (10): committedNotePage(), BrainGraph, BrainNote, BrainReader, CommittedBrain, GraphNode, GraphPage, hash (+2 more)

### Community 93 - "coordination-tick.ts"
Cohesion: 0.20
Nodes (13): reconcileNoticeConfirmations(), brainCheckpointCompletion(), reconcileCompletedCheckpoints(), legacy, reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION (+5 more)

### Community 94 - "extraction.ts"
Cohesion: 0.50
Nodes (4): createExtractor(), extractDocument, Extraction, Extractor

### Community 95 - "codex-rollout-file.ts"
Cohesion: 0.29
Nodes (8): codexHome(), createdAt(), dayDirs(), header(), ROLLOUT_MAX_BYTES, RolloutScan, scanCodexRollouts(), HELPER_STDOUT_MAX_BYTES

### Community 96 - "owned-artifact.ts"
Cohesion: 0.44
Nodes (7): ghLogCacheEvidence(), readLookupJournal(), done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf()

### Community 97 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 98 - "Lesson"
Cohesion: 0.36
Nodes (8): Lesson, OfficeProposal, RetrospectiveRecord, WeeklyRollup, lessonsView, newest(), ROLLUP_ROWS, TRIGGER_LABEL

### Community 99 - "merge-summary.ts"
Cohesion: 0.36
Nodes (7): clamp(), LIMITS, MergedPR, plainSlackText(), section(), shippedSummary(), mergeText()

### Community 101 - "run-usage.ts"
Cohesion: 0.33
Nodes (5): CodexRollout, claudeAccounting(), claudeUsage(), count(), RunUsage

### Community 102 - "liveReach"
Cohesion: 0.60
Nodes (5): GIT_NETWORK, LIVE_PROVIDERS, liveReach(), networkUrl(), remoteUrls()

### Community 103 - "extract-worker.mjs"
Cohesion: 0.70
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 104 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 108 - ".value"
Cohesion: 0.24
Nodes (6): file, folder, logs, root, xml(), ProjectProgress

### Community 112 - "offices.ts"
Cohesion: 0.09
Nodes (27): leadershipContext(), leadershipEntries(), knowledgeEntries(), privateFile(), readLocalIntakeReport(), readIntakeReport(), DELIVERY_CONCURRENCY, LOCAL_BINDINGS (+19 more)

## Knowledge Gaps
- **410 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+405 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `dependency-bots/adopt.ts`, `cec/workflow.ts`, `command`, `artifact`, `.emit`, `source-amendment.ts`, `OfficeScene.tsx`, `worker-runtime.ts`, `github-readiness.ts`, `index.ts`, `ticket-evidence.ts`, `closeout-recovery.ts`, `agents.ts`, `harnessEffect`, `.getEffect`, `goal-evidence.ts`, `digest`, `lesson-selection.ts`, `SourceRegistry`, `validate-stage.ts`, `azure.ts`, `maintenance/maintenance.ts`, `GitHubDelivery`, `scheduled-work.ts`, `features.ts`, `.transaction`, `enrollment-gate.ts`, `policy.ts`, `session-bridge.ts`, `cec/issue-publication.ts`, `goal-reporting.ts`, `digest`, `run-accounting.ts`, `admit-improvement.ts`, `tracking-issue.ts`, `GitHubIssuePublisher`, `http/commands.ts`, `cost-ledger.ts`, `investigations/run.ts`, `run-retrospective.ts`, `slack-intake/run.ts`, `it-specialist.ts`, `IntakeLedger`, `.save`, `workKey`, `jira-time.ts`, `WorkTime`, `Coordinator`, `Feature`, `knowledge/routes.ts`, `dependencies.ts`, `remove-candidate.ts`, `slack-intake/report.ts`, `coordination.ts`, `OfficeSnapshot`, `schedule.ts`, `currentAssignment`, `control-store.ts`, `notifications.ts`, `github-delivery.ts`, `knowledge/learning-events.ts`, `outbox.ts`, `BrainFollowup`, `knowledge.ts`, `shared.ts`, `investigations/ledger.ts`, `telemetry.ts`, `scheduled-captures.ts`, `checkpoint-completion.ts`, `coordination-tick.ts`, `.value`, `offices.ts`?**
  _High betweenness centrality (0.134) - this node is a cross-community bridge._
- **Why does `Engine` connect `command` to `cec/workflow.ts`, `.emit`, `github-readiness.ts`, `agents.ts`, `goal-evidence.ts`, `azure.ts`, `maintenance/maintenance.ts`, `scheduled-work.ts`, `.transaction`, `enrollment-gate.ts`, `.save`, `workKey`, `Coordinator`, `coordination.ts`, `notifications.ts`, `github-delivery.ts`, `BrainFollowup`, `Store`, `offices.ts`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `command()` connect `command` to `cec/workflow.ts`, `worker-runtime.ts`, `github-readiness.ts`, `ticket-evidence.ts`, `closeout-recovery.ts`, `agents.ts`, `harnessEffect`, `.getEffect`, `goal-evidence.ts`, `digest`, `validate-stage.ts`, `azure.ts`, `maintenance/maintenance.ts`, `GitHubDelivery`, `scheduled-work.ts`, `features.ts`, `.transaction`, `session-bridge.ts`, `cec/issue-publication.ts`, `admit-improvement.ts`, `GitHubIssuePublisher`, `cost-ledger.ts`, `process.ts`, `it-specialist.ts`, `IntakeLedger`, `.save`, `workKey`, `jira-time.ts`, `Coordinator`, `Feature`, `dependencies.ts`, `remove-candidate.ts`, `coordination.ts`, `OfficeSnapshot`, `currentAssignment`, `notifications.ts`, `github-delivery.ts`, `BrainFollowup`, `Store`, `reader.ts`, `command-registry.ts`, `liveReach`, `.value`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `command()` (e.g. with `.constructor()` and `executeRequest()`) actually correct?**
  _`command()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _410 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dependency-bots/adopt.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13813813813813813 - nodes in this community are weakly interconnected._
- **Should `cec/workflow.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05207835642618251 - nodes in this community are weakly interconnected._