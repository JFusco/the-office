# Graph Report - office-final-recovery  (2026-11-09)

## Corpus Check
- 661 files · ~276,624 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3420 nodes · 15167 edges · 103 communities (102 shown, 1 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 92 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6d5c9350`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- accept-stage-result.ts
- knowledge/routes.ts
- OfficeScene.tsx
- Inspector.tsx
- artifact
- daily-cto.ts
- github-delivery.ts
- schedule.ts
- Store
- TicketJob
- index.tsx
- SourceRegistry
- shared.ts
- worker-runtime.ts
- digest
- requests.ts
- agents.ts
- Library.tsx
- index.ts
- conversations/slack.ts
- record-trigger.ts
- source-amendment.ts
- scheduled-work.ts
- slack-intake/run.ts
- TimeBook.tsx
- App.tsx
- investigations/run.ts
- cec/workflow.ts
- run-retrospective.ts
- engine.ts
- OfficeSnapshot
- maintenance.ts
- WorkTime
- conversations/conversations.ts
- assertMayMutate
- offices.ts
- reader.ts
- digest
- source-amendment-scope.ts
- .transaction
- .save
- .emit
- session-bridge.ts
- sanitize
- Role
- http/commands.ts
- knowledge.ts
- blocker-followups.ts
- resume-provider-review.ts
- cec/issue-publication.ts
- outbox.ts
- .getEffect
- notifications.ts
- dependencies.ts
- github-check-selection.ts
- activation-recovery.ts
- Coordinator
- discovery-recovery.ts
- lesson-selection.ts
- telemetry.ts
- retrospective-subject.ts
- weekly-rollup.ts
- approval.ts
- features/workflow.ts
- sources/admission.ts
- useOfficePreferences.ts
- FeatureWorkspace.tsx
- validate-stage.ts
- coordination.ts
- handsOff
- harnessEffect
- GitHubIssuePublisher
- jira-time.ts
- admit-improvement.ts
- contract.ts
- tracking-issue.ts
- OfficeProject
- service-health.ts
- MaintenanceRun
- run-accounting.ts
- coordination-tick.ts
- knowledge/learning-events.ts
- publication.ts
- enrollment-gate.ts
- work.ts
- DailyCTO.tsx
- telemetry/report.ts
- .value
- price-table.ts
- command-registry.ts
- codex-rollout.ts
- helper-usage.ts
- owned-artifact.ts
- codex-rollout-file.ts
- lessons-view.ts
- OfficeConfigView.tsx
- extract-worker.mjs
- research-topics.ts
- highestStableAtLeast
- dependency-edges.ts
- slack-supersession.ts
- helper-evidence.py

## God Nodes (most connected - your core abstractions)
1. `Store` - 314 edges
2. `TicketJob` - 132 edges
3. `GitHubDelivery` - 121 edges
4. `command()` - 102 edges
5. `artifact()` - 87 edges
6. `digest()` - 86 edges
7. `cx()` - 84 edges
8. `workKey()` - 83 edges
9. `OfficeSnapshot` - 70 edges
10. `digest()` - 66 edges

## Surprising Connections (you probably didn't know these)
- `readAzurePRs()` --indirect_call--> `row()`  [INFERRED]
  server/cec/observed-prs.ts → src/telemetry/report.ts
- `rows()` --indirect_call--> `row()`  [INFERRED]
  server/delivery/recovery/source-amendment/source-amendment-held.ts → src/telemetry/report.ts
- `proveOutsideAmendmentUnchanged()` --indirect_call--> `row()`  [INFERRED]
  server/delivery/recovery/source-amendment/source-amendment-held.ts → src/telemetry/report.ts
- `rows()` --indirect_call--> `row()`  [INFERRED]
  server/delivery/recovery/source-amendment/source-amendment-scope.ts → src/telemetry/report.ts
- `tree()` --indirect_call--> `row()`  [INFERRED]
  server/features/planning-baseline.ts → src/telemetry/report.ts

## Import Cycles
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/stage-reconciliation.ts -> server/delivery/recovery/implementation/continuation-review-readback.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/preparation/post-conflict-preparation.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts`
- 3-file cycle: `server/conversations/notifications.ts -> server/conversations/slack.ts -> server/knowledge/digests/outbound.ts -> server/conversations/notifications.ts`
- 3-file cycle: `server/conversations/notifications.ts -> server/knowledge/digests/send-notice.ts -> server/knowledge/digests/outbound.ts -> server/conversations/notifications.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-guard.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/queue-repairs.ts -> server/delivery/repairs/reconcile-ci-diagnosis.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/parking/resume-provider-review.ts -> server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/parking/resume-provider-review.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-publication.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/conversations/conversations.ts -> server/conversations/slack.ts -> server/workers/agents.ts -> server/conversations/conversations.ts`
- 3-file cycle: `server/conversations/slack.ts -> server/workers/agents.ts -> server/workers/worker-runtime.ts -> server/conversations/slack.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/scope-repair/scope-repair-resume.ts -> server/delivery/recovery/validation/validation-provider-context.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/recovery/retire-external-delivery.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/conversations/conversations.ts -> server/scheduling/engine.ts -> server/workers/agents.ts -> server/conversations/conversations.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/stage-prompts.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-checkout.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-evidence.ts -> server/delivery/pipeline/github-delivery.ts`

## Communities (103 total, 1 thin omitted)

### Community 0 - "accept-stage-result.ts"
Cohesion: 0.09
Nodes (73): acceptStageResult(), mergeAuthorized(), allowed, assertContinuationWorker(), continuationArtifacts(), continuationReviewArtifacts(), continuationWorkerProof(), continuationWorktree() (+65 more)

### Community 1 - "knowledge/routes.ts"
Cohesion: 0.11
Nodes (48): intakeActivity(), knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), KnowledgeContext, independentDigestEvidence(), prepareDigestBodies(), retainDigestBody() (+40 more)

### Community 2 - "OfficeScene.tsx"
Cohesion: 0.05
Nodes (63): diagnosticContext(), itAgent(), itDiagnostics(), currentServices(), displayAgentTask(), githubStageLabels, withoutElapsed(), CameraBookmark (+55 more)

### Community 3 - "Inspector.tsx"
Cohesion: 0.08
Nodes (54): Conversation(), Outbox(), SendMessage, slackMessageStatus(), SlackDeliveryCard(), ServiceHealthPanel(), labels, ServiceHealthRow() (+46 more)

### Community 4 - "artifact"
Cohesion: 0.09
Nodes (63): closeoutRequestResolved(), continuationNativeReview(), candidateInput(), children, oldAdoptionBasis(), savedCandidateAdmission, assertPostConflictFiles(), assertPostConflictOwnership() (+55 more)

### Community 5 - "daily-cto.ts"
Cohesion: 0.06
Nodes (46): mirror(), runWeeklyResearch(), scheduledResearch(), collectCTOFacts(), DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt() (+38 more)

### Community 6 - "github-delivery.ts"
Cohesion: 0.08
Nodes (55): containedFile(), findingsBlock(), harnessDelivers(), BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction(), discover() (+47 more)

### Community 7 - "schedule.ts"
Cohesion: 0.11
Nodes (45): KnowledgeRunner, CaptureReceipt, ChannelProgress, IntakeResult, IntakeResultValue, LIMITS, Observation, Proposal (+37 more)

### Community 8 - "Store"
Cohesion: 0.06
Nodes (24): GitHubFeaturePublisher, Result, applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, statementCache(), initialSnapshot() (+16 more)

### Community 9 - "TicketJob"
Cohesion: 0.08
Nodes (38): removeAdoptedClone(), namedRepairIds(), dependabotReviewGuidance(), StageContext, GitHubDelivery, stageRole(), implementationContinuationInstruction(), amendmentRepairView() (+30 more)

### Community 10 - "index.tsx"
Cohesion: 0.08
Nodes (51): KnowledgeCadence, KnowledgeDestination, KnowledgeSourceKind, KnowledgeSourceState, KnowledgeSourceSummary, AddPublicSource(), AddSourceForm(), SourceConnection (+43 more)

### Community 11 - "SourceRegistry"
Cohesion: 0.08
Nodes (34): SlackReadAuthority, runSlackLinks(), sourceWork(), collectPublicSource(), collectionAllowed(), readAuthority(), Command, sourceCommand() (+26 more)

### Community 12 - "shared.ts"
Cohesion: 0.07
Nodes (57): ProjectReadiness, DailyCTOSummary, Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+49 more)

### Community 13 - "worker-runtime.ts"
Cohesion: 0.07
Nodes (43): candidateWorkspaceEnvironment(), assignmentSubject(), dispatchExposure(), prepareExposure(), LessonSelection, assertRetainedDispatchScope(), contextPacket(), assertModelOverrides() (+35 more)

### Community 14 - "digest"
Cohesion: 0.09
Nodes (53): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+45 more)

### Community 15 - "requests.ts"
Cohesion: 0.08
Nodes (43): boardPreflightCandidate(), Ownership, reconcileBoardPreflight(), completedPRReviews(), continuationScope(), brainImplementationCandidate(), BrainReadback, digest() (+35 more)

### Community 16 - "agents.ts"
Cohesion: 0.08
Nodes (37): cecPrompt(), cecIntakePrompt(), cecReadbackPrompt(), cecReconcilePrompt(), cecTransitionPrompt(), resolvedDecisionNote(), stageInstructions, cecChatPrompt() (+29 more)

### Community 17 - "Library.tsx"
Cohesion: 0.09
Nodes (33): KnowledgeCapture, KnowledgeCapturePage, KnowledgeHit, KnowledgeReference, KnowledgeActivity, KnowledgeActivityPage, KnowledgeEdge, KnowledgeIntakeStatus (+25 more)

### Community 18 - "index.ts"
Cohesion: 0.07
Nodes (39): args, [cmd,...rawArgs], commands, key, projectIndex, close(), config, itSpecialist (+31 more)

### Community 19 - "conversations/slack.ts"
Cohesion: 0.09
Nodes (28): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), MergeNotifications, SlackMessages, SlackRequestSchema (+20 more)

### Community 20 - "record-trigger.ts"
Cohesion: 0.09
Nodes (43): baselineLearning(), expireLearningPackets(), LEARNING_BASELINES, maintainLearning(), packetReferences(), busyMaintenanceIds(), clip(), maintenanceBlockedId() (+35 more)

### Community 21 - "source-amendment.ts"
Cohesion: 0.09
Nodes (42): deliveryTask(), DeliveryTaskInput, DISCOVERY_GUIDANCE, compactSteps(), adoptCandidate(), reported, Scope, advisoryPM() (+34 more)

### Community 22 - "scheduled-work.ts"
Cohesion: 0.11
Nodes (38): deliverySlot(), withAmendmentOwnership(), deterministicActions, eligible(), scheduledWork(), withActiveClaims(), captureCost(), costLedger() (+30 more)

### Community 23 - "slack-intake/run.ts"
Cohesion: 0.11
Nodes (35): independentIntakeResult(), retryDelay(), captureProposal(), effectId(), newTask(), recordObservation(), settlePage(), DERIVED (+27 more)

### Community 24 - "TimeBook.tsx"
Cohesion: 0.10
Nodes (36): TelemetryReport, LiveAnchor, AzureBuild, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens() (+28 more)

### Community 25 - "App.tsx"
Cohesion: 0.06
Nodes (39): themeColor, CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants, ElevatorPhase, floorVariants, leftDoor (+31 more)

### Community 26 - "investigations/run.ts"
Cohesion: 0.11
Nodes (32): INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationCandidates(), investigationId(), investigationEvidence(), investigationFollowUps(), INVOCATION_SOURCE_REFS, invocationSource() (+24 more)

### Community 27 - "cec/workflow.ts"
Cohesion: 0.13
Nodes (34): parksInJira(), MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), run(), advance(), nextStage(), publicationEvidenceGap() (+26 more)

### Community 28 - "run-retrospective.ts"
Cohesion: 0.11
Nodes (34): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, learningDigest(), appendLearningFacts(), freezeLearningPacket(), ARTIFACT_LIMIT, clip() (+26 more)

### Community 29 - "engine.ts"
Cohesion: 0.08
Nodes (21): correlatedBuild(), checkMail(), drainMail(), requestMail(), dispatchNightly(), drainDelivery(), enableNightly(), requestDelivery() (+13 more)

### Community 30 - "OfficeSnapshot"
Cohesion: 0.12
Nodes (32): App(), SnapshotAcceptance, demoSnapshot(), tourStages, OfficeSnapshot, STAGE_ROLE, envelopeCard, deliveryRepairProjection() (+24 more)

### Community 31 - "maintenance.ts"
Cohesion: 0.10
Nodes (26): maintenancePolicies(), BRAIN_DEPENDENCY_MERGES, BrainMaintenance, BrainResult, capped(), queueMaintenanceNotice(), candidateOwner(), SETTLED (+18 more)

### Community 32 - "WorkTime"
Cohesion: 0.12
Nodes (35): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence(), CaptureContext (+27 more)

### Community 33 - "conversations/conversations.ts"
Cohesion: 0.10
Nodes (23): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+15 more)

### Community 34 - "assertMayMutate"
Cohesion: 0.14
Nodes (27): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+19 more)

### Community 35 - "offices.ts"
Cohesion: 0.14
Nodes (17): diagnosticSnapshot(), eventVisible(), leadershipContext(), leadershipEntries(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore(), deniedAssignments() (+9 more)

### Community 36 - "reader.ts"
Cohesion: 0.08
Nodes (20): captureAfter(), CaptureMetadata, capturePage(), cursor(), key(), captureIdentityMatches(), BrainCaptureReceipt, hash (+12 more)

### Community 37 - "digest"
Cohesion: 0.14
Nodes (28): comparableSlackText(), AuthoredDigest, reconcileDigestAuthorship(), unitAuthorship(), annotateAuthoredUnits(), reconcileAuthoredEvidence(), Config, configDigest() (+20 more)

### Community 38 - "source-amendment-scope.ts"
Cohesion: 0.10
Nodes (33): approvedText(), assert(), amendmentCaptureObservation(), capture, generation, GenerationContext, head, ids (+25 more)

### Community 39 - ".transaction"
Cohesion: 0.13
Nodes (22): reviewQuestions(), featureItemComplete(), reconcileFeatureCompletion(), document(), featureRoot(), helperTelemetry(), recoverFeatures(), EvidenceSchema (+14 more)

### Community 40 - ".save"
Cohesion: 0.17
Nodes (27): JiraOperations, plain(), unpack(), BLOCKED, Execute, findComment(), jira(), LiveIssue (+19 more)

### Community 41 - ".emit"
Cohesion: 0.15
Nodes (24): adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR, openDependabotPulls(), readRepo() (+16 more)

### Community 42 - "session-bridge.ts"
Cohesion: 0.13
Nodes (23): claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexSessionContext(), readRollout, claudeSessions(), codexSessions() (+15 more)

### Community 43 - "sanitize"
Cohesion: 0.13
Nodes (24): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+16 more)

### Community 44 - "Role"
Cohesion: 0.13
Nodes (17): ROLES, DATA, LOCAL_BINDINGS, DeliverySlot, officeCapacity, fifo(), ScheduledWork, Scheduler (+9 more)

### Community 45 - "http/commands.ts"
Cohesion: 0.17
Nodes (24): normalizeStatement(), configureDigestDelivery(), DigestSettings, configureKnowledge(), declineLessonIssue(), demoteLesson(), reactivateLesson(), retireLesson() (+16 more)

### Community 46 - "knowledge.ts"
Cohesion: 0.10
Nodes (24): Binding, decodeLookupJournal(), lookupJournal, readLookupJournal(), KnowledgeAssignment, ImprovementGrant, KnowledgeRetry, KnowledgeSourceBinding (+16 more)

### Community 47 - "blocker-followups.ts"
Cohesion: 0.16
Nodes (21): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved() (+13 more)

### Community 48 - "resume-provider-review.ts"
Cohesion: 0.21
Nodes (23): Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), Execute, ProjectCard, projectCards() (+15 more)

### Community 49 - "cec/issue-publication.ts"
Cohesion: 0.22
Nodes (8): Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), plainDescription(), Transition, JiraFeaturePublisher

### Community 50 - "outbox.ts"
Cohesion: 0.16
Nodes (16): projectOutbox(), syncOutbox(), projectSlackDeliveries(), settleRequestedSlackReplacement(), Input, supersedeSlackDelivery(), replacementContext(), slackFingerprint() (+8 more)

### Community 51 - ".getEffect"
Cohesion: 0.19
Nodes (12): GitHubOperations, digestNoticeNeverDispatched(), fileLessonIssue(), lessonIssueBody(), lessonIssueMarker(), goalNoticeNeverDispatched(), Assessment, closeNativeRefresh() (+4 more)

### Community 52 - "notifications.ts"
Cohesion: 0.16
Nodes (19): clamp(), LIMITS, MergedPR, plainSlackText(), section(), shippedSummary(), configureNotices(), Identity (+11 more)

### Community 53 - "dependencies.ts"
Cohesion: 0.18
Nodes (20): Admission, admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, resumeParked(), compatible(), dependencyCompletionKey() (+12 more)

### Community 54 - "github-check-selection.ts"
Cohesion: 0.20
Nodes (19): checksFailed(), checksPassed(), checksPending(), CurrentChecksWait, currentMergeChecks(), pass(), pending(), requireThat() (+11 more)

### Community 55 - "activation-recovery.ts"
Cohesion: 0.21
Nodes (24): activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), assertSourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+16 more)

### Community 56 - "Coordinator"
Cohesion: 0.09
Nodes (3): coordination(), Coordinator, AssignedIssue

### Community 57 - "discovery-recovery.ts"
Cohesion: 0.13
Nodes (18): Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership, rawHash() (+10 more)

### Community 58 - "lesson-selection.ts"
Cohesion: 0.16
Nodes (20): knowledgeContext(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), MAINTENANCE, MAX_LESSONS (+12 more)

### Community 59 - "telemetry.ts"
Cohesion: 0.13
Nodes (21): CodexRollout, codexPriceRef(), basisOf(), claudeCost(), codexCost(), toMicroUsd(), unpriced(), claudeCrashZero() (+13 more)

### Community 60 - "retrospective-subject.ts"
Cohesion: 0.15
Nodes (19): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+11 more)

### Community 61 - "weekly-rollup.ts"
Cohesion: 0.13
Nodes (20): learningMetrics(), lessonsNeedingReview(), Kind, RetrospectiveResult, RollupResult, RollupResultSchema, Stage, RETROSPECTIVE_TIMEOUT (+12 more)

### Community 62 - "approval.ts"
Cohesion: 0.26
Nodes (15): approveFeature(), assertRetainedItems(), commandFeature(), createFeature(), featureById(), mutation(), artifactPath(), digest() (+7 more)

### Community 63 - "features/workflow.ts"
Cohesion: 0.19
Nodes (17): discoveryPrompt(), planPrompt(), DiscoverySchema, identity, manifestFromPlan(), ManifestSchema, PlanSchema, text (+9 more)

### Community 64 - "sources/admission.ts"
Cohesion: 0.16
Nodes (17): createExtractor(), extractDocument, Extraction, Extractor, uploadArtifact(), privateFile(), readLocalIntakeReport(), readIntakeReport() (+9 more)

### Community 65 - "useOfficePreferences.ts"
Cohesion: 0.13
Nodes (18): fields, PreferencesPatch, StoredBody, acceptPreferences(), PreferenceCandidate, PreferenceState, strip(), UNKNOWN_PREFERENCES (+10 more)

### Community 66 - "FeatureWorkspace.tsx"
Cohesion: 0.16
Nodes (16): FeatureRound, FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases, LinkedFeatures(), draftKey() (+8 more)

### Community 67 - "validate-stage.ts"
Cohesion: 0.16
Nodes (17): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+9 more)

### Community 68 - "coordination.ts"
Cohesion: 0.17
Nodes (19): completeNativeCheckpoint(), queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation(), readAssignments(), checkpointWindow() (+11 more)

### Community 69 - "handsOff"
Cohesion: 0.20
Nodes (16): activeEffectId(), HANDS_OFF_PROJECTS, handsOff(), legacyRecovery(), APPROACH_GUARD_REJECTION, failedWorker(), requeueWaitedImplement(), officeMergeProvenance() (+8 more)

### Community 70 - "harnessEffect"
Cohesion: 0.21
Nodes (15): harnessEffect, retryRead(), developerPRContent(), Execute, lintPRContent(), officePRContent(), prContent, assertCandidate() (+7 more)

### Community 71 - "GitHubIssuePublisher"
Cohesion: 0.27
Nodes (7): PublicationReceipt, Assign, Board, GitHubIssuePublisher, number(), same(), label()

### Community 72 - "jira-time.ts"
Cohesion: 0.22
Nodes (12): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+4 more)

### Community 73 - "admit-improvement.ts"
Cohesion: 0.25
Nodes (13): admitImprovement(), improvementEligible(), distinct(), identity(), improvementIncident(), improvementIncidentKey(), improvementManifest(), improvementMarker() (+5 more)

### Community 74 - "contract.ts"
Cohesion: 0.20
Nodes (12): At, Errno, GroupInventory, GroupProbe, LifecycleDiagnostic, Phase, Pid, lifecycleFacts() (+4 more)

### Community 75 - "tracking-issue.ts"
Cohesion: 0.23
Nodes (14): readBackOrThrow(), ensureTrackingIssue(), findTrackingIssue(), ownTracking(), TrackingIssue, trackingIssueBody(), trackingIssueTitle(), trackingMarker() (+6 more)

### Community 76 - "OfficeProject"
Cohesion: 0.18
Nodes (11): AUTO_ADOPT_BOTS, GitHubMonitor, githubPRDescription(), GOAL_EVIDENCE_LIMITS, goalEvidencePath(), localBindings, ModelOverrides, GitHubBoard (+3 more)

### Community 77 - "service-health.ts"
Cohesion: 0.19
Nodes (8): listenerHealth(), providers, ProviderStatusChecks, summary, Probe, probes, ServiceHealthChecks, ServiceHealth

### Community 78 - "MaintenanceRun"
Cohesion: 0.21
Nodes (11): BrainFollowup, checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), repeatedVendorReviewBlock(), stoppedInVendorReview(), maintenanceSuperseded(), REOBSERVED (+3 more)

### Community 79 - "run-accounting.ts"
Cohesion: 0.19
Nodes (14): BoundedRead, backfillClaudeCost(), CompletionReader, COMPLETION_MAX_BYTES, completionAccounting(), readCompletion(), RECONCILE_GRACE_MS, reconcileUncapturedRuns() (+6 more)

### Community 80 - "coordination-tick.ts"
Cohesion: 0.21
Nodes (12): reconcileNoticeConfirmations(), PrerequisitesSchema, legacy, reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS, RETAINED_PER_ACTION, tick() (+4 more)

### Community 81 - "knowledge/learning-events.ts"
Cohesion: 0.28
Nodes (10): retainedArtifactScope(), eventSourceBindings(), captureLearning(), recordLearningOpportunity(), exposureBindings(), requestSourceBindings(), captureMaintenanceStep(), acceptedSourceBindings() (+2 more)

### Community 82 - "publication.ts"
Cohesion: 0.26
Nodes (6): FeaturePublisher, publishFeature(), reserveIdentity(), FeatureManifest, FeatureManifestItem, FeatureOperation

### Community 83 - "enrollment-gate.ts"
Cohesion: 0.29
Nodes (10): bindFeature(), currentApproval(), enrolled(), featureGate(), predecessorComplete(), scheduledFeatures(), gateFeatureWork(), improvementIntakeGate() (+2 more)

### Community 84 - "work.ts"
Cohesion: 0.15
Nodes (12): AssignmentResult, CompletionCondition, Continuation, DependencyObservation, EligibilityState, FailureCategory, ProgressionItem, ReconciliationAction (+4 more)

### Community 85 - "DailyCTO.tsx"
Cohesion: 0.26
Nodes (8): CTOReview(), goalState, DailyCTO(), GoalHistory(), reportDate(), reviewStatus, reviewExcerpt(), ReviewText()

### Community 86 - "telemetry/report.ts"
Cohesion: 0.33
Nodes (11): Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked(), row() (+3 more)

### Community 87 - ".value"
Cohesion: 0.27
Nodes (6): file, folder, logs, root, xml(), ProjectProgress

### Community 88 - "price-table.ts"
Cohesion: 0.20
Nodes (8): CacheWriteDuration, CODEX_ROWS, ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL, Rates, PriceRef

### Community 89 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 90 - "codex-rollout.ts"
Cohesion: 0.33
Nodes (8): add(), CodexRequest, CodexTokens, FIELDS, parseCodexRollout(), same(), tokens(), ZERO

### Community 91 - "helper-usage.ts"
Cohesion: 0.31
Nodes (8): readCodexRollout(), HELPER_STDOUT_MAX_BYTES, helperAccounting(), claudeAccounting(), codexAccounting(), merge(), withReason(), codexUsage()

### Community 92 - "owned-artifact.ts"
Cohesion: 0.54
Nodes (6): ghLogCacheEvidence(), done(), readBoundedNoFollow(), readBoundedNoFollowSync(), readOwnedSessionArtifact(), reasonOf()

### Community 93 - "codex-rollout-file.ts"
Cohesion: 0.36
Nodes (7): codexHome(), createdAt(), dayDirs(), header(), ROLLOUT_MAX_BYTES, RolloutScan, scanCodexRollouts()

### Community 94 - "lessons-view.ts"
Cohesion: 0.39
Nodes (7): OfficeProposal, RetrospectiveRecord, WeeklyRollup, lessonsView, newest(), ROLLUP_ROWS, TRIGGER_LABEL

### Community 95 - "OfficeConfigView.tsx"
Cohesion: 0.48
Nodes (5): loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView(), OfficeConfigSummary

### Community 96 - "extract-worker.mjs"
Cohesion: 0.70
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 97 - "research-topics.ts"
Cohesion: 0.70
Nodes (4): publicTopicSafe(), researchTopics(), TEMPLATES, ResearchTopic

### Community 98 - "highestStableAtLeast"
Cohesion: 0.83
Nodes (3): compare(), highestStableAtLeast(), parts()

### Community 99 - "dependency-edges.ts"
Cohesion: 1.00
Nodes (3): assertFeatureDependencyOrder(), featureDependencyEdges(), key()

### Community 100 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

## Knowledge Gaps
- **378 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+373 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `accept-stage-result.ts`, `knowledge/routes.ts`, `OfficeScene.tsx`, `artifact`, `daily-cto.ts`, `github-delivery.ts`, `schedule.ts`, `TicketJob`, `SourceRegistry`, `worker-runtime.ts`, `digest`, `requests.ts`, `agents.ts`, `index.ts`, `conversations/slack.ts`, `record-trigger.ts`, `source-amendment.ts`, `scheduled-work.ts`, `slack-intake/run.ts`, `investigations/run.ts`, `cec/workflow.ts`, `run-retrospective.ts`, `engine.ts`, `OfficeSnapshot`, `maintenance.ts`, `WorkTime`, `conversations/conversations.ts`, `assertMayMutate`, `offices.ts`, `digest`, `.transaction`, `.save`, `.emit`, `session-bridge.ts`, `sanitize`, `Role`, `http/commands.ts`, `knowledge.ts`, `blocker-followups.ts`, `resume-provider-review.ts`, `cec/issue-publication.ts`, `outbox.ts`, `.getEffect`, `notifications.ts`, `dependencies.ts`, `activation-recovery.ts`, `discovery-recovery.ts`, `lesson-selection.ts`, `retrospective-subject.ts`, `weekly-rollup.ts`, `approval.ts`, `features/workflow.ts`, `sources/admission.ts`, `validate-stage.ts`, `coordination.ts`, `handsOff`, `harnessEffect`, `jira-time.ts`, `admit-improvement.ts`, `tracking-issue.ts`, `OfficeProject`, `run-accounting.ts`, `coordination-tick.ts`, `knowledge/learning-events.ts`, `publication.ts`, `enrollment-gate.ts`, `research-topics.ts`, `dependency-edges.ts`?**
  _High betweenness centrality (0.126) - this node is a cross-community bridge._
- **Why does `command()` connect `Store` to `github-delivery.ts`, `schedule.ts`, `TicketJob`, `worker-runtime.ts`, `digest`, `requests.ts`, `agents.ts`, `conversations/slack.ts`, `scheduled-work.ts`, `cec/workflow.ts`, `engine.ts`, `maintenance.ts`, `assertMayMutate`, `reader.ts`, `.transaction`, `.save`, `session-bridge.ts`, `sanitize`, `resume-provider-review.ts`, `cec/issue-publication.ts`, `.getEffect`, `notifications.ts`, `dependencies.ts`, `approval.ts`, `features/workflow.ts`, `sources/admission.ts`, `validate-stage.ts`, `coordination.ts`, `harnessEffect`, `jira-time.ts`, `admit-improvement.ts`, `contract.ts`, `OfficeProject`, `service-health.ts`, `publication.ts`, `command-registry.ts`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `Role` connect `Role` to `accept-stage-result.ts`, `OfficeScene.tsx`, `Inspector.tsx`, `github-delivery.ts`, `Store`, `TicketJob`, `shared.ts`, `worker-runtime.ts`, `agents.ts`, `App.tsx`, `cec/workflow.ts`, `OfficeSnapshot`, `maintenance.ts`, `conversations/conversations.ts`, `.emit`, `http/commands.ts`, `outbox.ts`, `retrospective-subject.ts`, `validate-stage.ts`, `run-accounting.ts`, `knowledge/learning-events.ts`, `work.ts`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `command()` (e.g. with `.constructor()` and `executeRequest()`) actually correct?**
  _`command()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _378 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `accept-stage-result.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08901363271852446 - nodes in this community are weakly interconnected._
- **Should `knowledge/routes.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10664556962025316 - nodes in this community are weakly interconnected._