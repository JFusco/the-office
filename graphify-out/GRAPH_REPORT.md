# Graph Report - the-office  (2026-11-17)

## Corpus Check
- 870 files · ~341,261 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4227 nodes · 19368 edges · 129 communities (125 shown, 4 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 675 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3d2762a5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- TelemetryPanel.tsx
- OrgChart.tsx
- ref_node_crypto
- Store
- Inspector.tsx
- sanitize
- session-bridge.ts
- ref_react
- processGroupAlive
- github-check-selection.ts
- agents.ts
- lesson-selection.ts
- App.tsx
- features.ts
- reader.ts
- scheduled-captures.ts
- run-retrospective.ts
- record-trigger.ts
- delivery-repairs.ts
- workKey
- index.tsx
- shared.ts
- work-summary.ts
- ref_node_path
- delivery-authority.ts
- maintenance/maintenance.ts
- cost-ledger.ts
- index.ts
- knowledge.ts
- jira-time.ts
- metadata-assessment.ts
- cec.ts
- azure.ts
- closeout-recovery.ts
- cec-reads.ts
- JiraIssuePublisher
- scheduled-work.ts
- run-accounting.ts
- dependency-bots/adopt.ts
- it-specialist.ts
- ticket-key.ts
- time-scope.ts
- github-delivery.ts
- ledger.ts
- activation-recovery.ts
- harness-baseline.ts
- OfficeScene.tsx
- task-briefing.ts
- command
- node-visuals.ts
- control-store.ts
- resume-provider-review.ts
- assignments.ts
- inspect-closed-plan.ts
- accept-stage-result.ts
- weekly-rollup.ts
- features/workflow.ts
- recovery/stopped-base-update.ts
- officeUrl
- scene-motion.ts
- Store
- tracking-issue.ts
- RoomCamera.tsx
- http/commands.ts
- ticket-evidence.ts
- telemetry.ts
- remove-candidate.ts
- retrospective-subject.ts
- .verifyPR
- owned-artifact.ts
- constellation-runtime.ts
- process.ts
- work.ts
- report.ts
- post-conflict-preparation.ts
- Offices
- rootArtifact
- daily-cto.ts
- preferences-store.ts
- assignment.ts
- artifact
- workKey
- brain-maintenance.ts
- stopped-base-provider.ts
- index.tsx
- Agents
- .getEffect
- cec-reads.ts
- restoreInPlace
- github-delivery.ts
- OutboxLessonDecision.tsx
- config.ts
- restart-writer.ts
- notifications.ts
- github/issue-publication.ts
- capture-session-clone.py
- recovery-ledger.ts
- highestStableAtLeast
- .save
- github-context.ts
- cec/workflow.ts
- Role
- prompts/conversations.ts
- worker-runtime.ts
- delivery-repairs.ts
- extract-worker.mjs
- digest
- createConstellation
- EffectIntent
- useOfficePreferences.ts
- superseded-receipts.ts
- coordination.ts
- CommandRegistry
- admit-improvement.ts
- slack-supersession.ts
- blocker-followups.ts
- qa.ts
- qa-plan-continuation.ts
- writer-restart.ts
- validate-stage.ts
- interrupted-work-recovery.ts
- pilot-delivery.ts
- QAResultsCard.tsx
- resume
- delivery-ownership.ts
- seeded-office-lessons.ts
- pre-push-boundary.ts
- OfficeConfigView.tsx
- ITFollowUps.tsx

## God Nodes (most connected - your core abstractions)
1. `Store` - 379 edges
2. `TicketJob` - 172 edges
3. `digest()` - 151 edges
4. `command()` - 120 edges
5. `GitHubDelivery` - 116 edges
6. `artifact()` - 114 edges
7. `workKey()` - 98 edges
8. `currentAssignment()` - 88 edges
9. `OfficeSnapshot` - 88 edges
10. `cx()` - 88 edges

## Surprising Connections (you probably didn't know these)
- `apply()` --indirect_call--> `note()`  [INFERRED]
  src/conversations/OutboxSavedImplementation.tsx → server/cec/parking/resume-parked.ts
- `LessonBrainOverlap` --references--> `Lesson`  [EXTRACTED]
  server/knowledge/lesson-brain-audit.ts → src/contracts/knowledge.ts
- `DeliverySlot` --references--> `Role`  [EXTRACTED]
  server/office/projects.ts → src/shared.ts
- `StageContinuation` --references--> `WorkTime`  [EXTRACTED]
  server/cec/stage-continuation.ts → src/shared.ts
- `UnrecordedResult` --references--> `StageResult`  [EXTRACTED]
  server/cec/unrecorded-result.ts → src/shared.ts

## Import Cycles
- 2-file cycle: `server/scheduling/coordination-pump.ts -> server/scheduling/coordination.ts -> server/scheduling/coordination-pump.ts`
- 2-file cycle: `server/scheduling/coordination-tick.ts -> server/scheduling/coordination.ts -> server/scheduling/coordination-tick.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/track-adopted-review.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/stage-reconciliation.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/pipeline/github-delivery.ts`
- 2-file cycle: `server/delivery/pipeline/accept-stage-result.ts -> server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/accept-stage-result.ts`
- 2-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/publication/metadata-context.ts -> server/delivery/pipeline/github-delivery.ts`
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
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/repairs/run-ci-repair.ts -> server/delivery/repairs/ci-guard.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`

## Communities (129 total, 4 thin omitted)

### Community 0 - "TelemetryPanel.tsx"
Cohesion: 0.16
Nodes (26): TelemetryRow, ROLE_NAMES, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens(), usd() (+18 more)

### Community 1 - "OrgChart.tsx"
Cohesion: 0.10
Nodes (43): label(), personaContext(), Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER (+35 more)

### Community 2 - "ref_node_crypto"
Cohesion: 0.12
Nodes (25): GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles(), ContinuationIO (+17 more)

### Community 3 - "Store"
Cohesion: 0.17
Nodes (22): featureItemComplete(), reconcileFeatureCompletion(), discoveryPrompt(), planPrompt(), GitHubFeaturePublisher, readEvidence(), reserveReplacement(), stageBudget() (+14 more)

### Community 4 - "Inspector.tsx"
Cohesion: 0.11
Nodes (68): Conversation(), send(), SendMessage, Outbox(), OutboxMaintenanceStatus(), savedImplementationFollowup(), slackMessageStatus(), SlackDeliveryCard() (+60 more)

### Community 5 - "sanitize"
Cohesion: 0.07
Nodes (42): assertConversationReadback(), Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff(), saveGoals() (+34 more)

### Community 6 - "session-bridge.ts"
Cohesion: 0.05
Nodes (55): claudeSessionContext(), readTranscript, root, claudeSessionScope(), codexDaemonProcesses(), accountCodexProcesses(), CodexProcessInventory, codexProcessInventory() (+47 more)

### Community 7 - "ref_react"
Cohesion: 0.08
Nodes (57): KnowledgeActivity, KnowledgeActivityPage, KnowledgeEdge, KnowledgeMap, KnowledgeNode, Activity(), ActivityTimeline(), AssignmentKnowledge() (+49 more)

### Community 8 - "processGroupAlive"
Cohesion: 0.16
Nodes (20): OwnershipRead, continueOwnershipRead(), expiredOwnershipRead(), handoffOwnership(), ReadbackOwnerDecision, ownershipReadGate(), ownershipReadState(), ownershipReadHistory() (+12 more)

### Community 9 - "github-check-selection.ts"
Cohesion: 0.17
Nodes (24): checksFailed(), checksPassed(), checksPending(), CurrentChecksWait, currentMergeChecks(), pass(), pending(), requireThat() (+16 more)

### Community 10 - "agents.ts"
Cohesion: 0.09
Nodes (30): implementationWorkerContext(), assertContinuableWorktree(), CONTINUABLE, continuationPrompt(), MAX_CONTINUATIONS, recordedContinuation(), StageContinuation, stageContinuation() (+22 more)

### Community 11 - "lesson-selection.ts"
Cohesion: 0.13
Nodes (19): lessonIssueBody(), lessonIssueMarker(), INSTALLED, installedLesson(), Bucket, LESSON_LIMIT, lessonPurpose(), LessonSelection (+11 more)

### Community 12 - "App.tsx"
Cohesion: 0.06
Nodes (47): BrainDrawer(), themeColor, App(), BrainWorkspace, CONNECTION, CONNECTION_DOT, dockItemVariants, dockVariants (+39 more)

### Community 13 - "features.ts"
Cohesion: 0.10
Nodes (31): commandFeature(), featureById(), reviewQuestions(), automaticIntakeWait(), confirmBrief(), assertQuestionVisibility(), applyHarnessAction(), HarnessActionInput (+23 more)

### Community 14 - "reader.ts"
Cohesion: 0.08
Nodes (32): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, CommittedBrain (+24 more)

### Community 15 - "scheduled-captures.ts"
Cohesion: 0.15
Nodes (48): createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), CaptureRequest, captureRequest() (+40 more)

### Community 16 - "run-retrospective.ts"
Cohesion: 0.09
Nodes (36): BLOCKING, BlockingTrigger, blockingTrigger(), isBlocking(), BrainOverlap, brainOverlap(), brainOverlapQuery(), clip() (+28 more)

### Community 17 - "record-trigger.ts"
Cohesion: 0.10
Nodes (38): improvementIntakeGate(), learningDigest(), recordLearningOpportunity(), expireLearningPackets(), LEARNING_BASELINES, packetReferences(), clip(), maintenanceBlockedId() (+30 more)

### Community 18 - "delivery-repairs.ts"
Cohesion: 0.16
Nodes (24): removeAdoptedClone(), stoppedBaseCheckout(), assertStoppedBaseApproach(), stoppedBaseNextStage(), adoptedReviewCandidate(), ciCheckout(), finishCISetup(), verifyCIHooks() (+16 more)

### Community 19 - "workKey"
Cohesion: 0.12
Nodes (35): observePrerequisites(), boardPreflightCandidate(), savedActivationFailure(), assertPostConflictOwnership(), completedConflictDraftCandidate(), postConflictPreparationEvidence(), reconcileCompletedConflictDraft(), bindPreparationBoardOrigins() (+27 more)

### Community 20 - "index.tsx"
Cohesion: 0.11
Nodes (41): LessonsView(), SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS, PickupForm() (+33 more)

### Community 21 - "shared.ts"
Cohesion: 0.09
Nodes (30): ctoInputIdentityMatches(), ctoInputRecovered(), ADOPTION_STALLED_MS, checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), repeatedVendorReviewBlock(), stoppedInVendorReview() (+22 more)

### Community 22 - "work-summary.ts"
Cohesion: 0.09
Nodes (40): displayAgentTask(), LiveAgentTask(), Props, RunningTask(), text(), AzureBuild, OfficeSnapshot, lastWall (+32 more)

### Community 23 - "ref_node_path"
Cohesion: 0.10
Nodes (15): file, folder, logs, root, savedStageCompletion(), Read, legacy, assertHistoricalArtifactPath() (+7 more)

### Community 24 - "delivery-authority.ts"
Cohesion: 0.17
Nodes (18): deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, deliveryIntakeBlocker(), gateRegisteredDelivery(), accounting, DeliverySubject (+10 more)

### Community 25 - "maintenance/maintenance.ts"
Cohesion: 0.10
Nodes (26): maintenancePolicies(), captureLearning(), captureMaintenanceStep(), BrainMaintenance, candidateOwner(), SETTLED, skipOwnedCandidate(), Skipped (+18 more)

### Community 26 - "cost-ledger.ts"
Cohesion: 0.15
Nodes (27): captureCost(), costLedger(), summary(), COST_FIELD, COST_OPERATION, costPublishingEnabled(), costPublishingInProgress(), effectId() (+19 more)

### Community 27 - "index.ts"
Cohesion: 0.07
Nodes (42): implementationContinuationRoute(), qaPlanRetryRoute(), Link, linkFeature(), featureRoute(), close(), config, itSpecialist (+34 more)

### Community 28 - "knowledge.ts"
Cohesion: 0.10
Nodes (26): Kind, RetrospectiveResult, RetrospectiveResultSchema, RollupResultSchema, Stage, BlockerFollowup, ImprovementGrant, KnowledgeRetry (+18 more)

### Community 29 - "jira-time.ts"
Cohesion: 0.16
Nodes (17): data(), envelope(), JiraWorklogs, localId(), locks, matches(), publishJiraTime(), requeueNeverSent() (+9 more)

### Community 30 - "metadata-assessment.ts"
Cohesion: 0.09
Nodes (56): activeEffectId(), HarnessEffect, harnessEffect(), retryRead(), assertDraftClaimHistory(), linkDraftIssue(), protectedOriginalClaim(), admitPRMetadata() (+48 more)

### Community 31 - "cec.ts"
Cohesion: 0.20
Nodes (14): cecPrompt(), resolvedDecisionNote(), stageInstructions, applies(), interruptedRunNote(), placeholder(), withoutInterruptedResult(), settledReceiptNote() (+6 more)

### Community 32 - "azure.ts"
Cohesion: 0.11
Nodes (29): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+21 more)

### Community 33 - "closeout-recovery.ts"
Cohesion: 0.08
Nodes (54): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+46 more)

### Community 34 - "cec-reads.ts"
Cohesion: 0.13
Nodes (22): AUTO_ADOPT_BOTS, assertFeaturePlanningConfig(), FeaturePlanningBindings, goalEvidencePath(), LocalBindings, localBindings(), BEFORE_POLICY, parseProjectPolicy() (+14 more)

### Community 35 - "JiraIssuePublisher"
Cohesion: 0.22
Nodes (5): JiraIssuePublisher, descriptionPreimage(), plain(), publicationDescription(), PublicationReceipt

### Community 36 - "scheduled-work.ts"
Cohesion: 0.09
Nodes (35): freshOwnershipRead(), deliverySlot(), withAmendmentOwnership(), metadataRequestResolved(), gateFeatureWork(), requestPriority(), closedTicketReport(), closedTicketRequest() (+27 more)

### Community 37 - "run-accounting.ts"
Cohesion: 0.10
Nodes (36): BoundedRead, CompletionReader, add(), CodexRequest, CodexTokens, FIELDS, codexHome(), createdAt() (+28 more)

### Community 38 - "dependency-bots/adopt.ts"
Cohesion: 0.15
Nodes (26): Execute, adoptDependabot(), closesIssue(), linkedBody(), linkPR(), DEPENDABOT, DependabotPR, dependabotPR() (+18 more)

### Community 39 - "it-specialist.ts"
Cohesion: 0.12
Nodes (18): ITContext, informationalRecovery(), publishITReport(), delays, recoverAttempt(), listenerHealth(), providers, ProviderStatusChecks (+10 more)

### Community 40 - "ticket-key.ts"
Cohesion: 0.13
Nodes (22): OfficeConfigInputs, officeConfigRoute(), officeConfigSummary(), CECBinding, azureBinding(), bindings(), AzureBinding, frozen() (+14 more)

### Community 41 - "time-scope.ts"
Cohesion: 0.13
Nodes (32): CURRENT_SCOPE_POLICY, isLegacyTicketWork(), isModelWork(), isTicketModelWork(), ScopePolicy, scopeSelector(), awaitingEvidence(), CaptureContext (+24 more)

### Community 42 - "github-delivery.ts"
Cohesion: 0.08
Nodes (13): writerRestartInstruction(), ProjectProgress, BOARD_RULE, conflictRefreshInstruction(), DECISION_RULE, implementInstruction(), dependabotReviewGuidance(), StageContext (+5 more)

### Community 43 - "ledger.ts"
Cohesion: 0.13
Nodes (26): acceptedCompletionResolution(), INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, ctoReplacementResolution(), finishedSubjectResolution(), implementationReplacementResolution(), interruptedQARerunResolution(), investigationResolution() (+18 more)

### Community 44 - "activation-recovery.ts"
Cohesion: 0.16
Nodes (23): PrerequisitesSchema, activationAuditResponseSchema(), ActivationAuditSchema, applySourceConfiguration(), cancelUnusedSourceReservation(), Hash, Proposal, reconcileActivation() (+15 more)

### Community 45 - "harness-baseline.ts"
Cohesion: 0.15
Nodes (23): BaselineReport, baselineReport(), BaselineSource, baselineText(), millions(), row(), share(), add() (+15 more)

### Community 46 - "OfficeScene.tsx"
Cohesion: 0.16
Nodes (34): withoutElapsed(), Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk() (+26 more)

### Community 47 - "task-briefing.ts"
Cohesion: 0.10
Nodes (22): args, [cmd,...rawArgs], commands, key, projectIndex, LessonBrainAudit, lessonBrainAudit(), LessonBrainOverlap (+14 more)

### Community 48 - "command"
Cohesion: 0.06
Nodes (18): checkMail(), drainMail(), requestMail(), enableNightly(), ingest(), GitHubMonitor, Result, drainMaintenance() (+10 more)

### Community 49 - "node-visuals.ts"
Cohesion: 0.20
Nodes (14): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+6 more)

### Community 50 - "control-store.ts"
Cohesion: 0.12
Nodes (16): Clock, checkpointLabel(), applyConnectionSettings(), closeConnection(), optimizeOnOpen(), CTOConfiguration, comparable(), EvidenceOutcome (+8 more)

### Community 51 - "resume-provider-review.ts"
Cohesion: 0.18
Nodes (26): initialManualStart(), Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), ProjectCard, projectCards() (+18 more)

### Community 52 - "assignments.ts"
Cohesion: 0.14
Nodes (20): clip(), DEMAND_LIMIT, demandFacts(), DemandSection, key(), LessonKey, notes(), clip() (+12 more)

### Community 53 - "inspect-closed-plan.ts"
Cohesion: 0.15
Nodes (14): closedReadonlyPlan(), Document, document(), entryExists(), inspectClosedQAPlan(), Decision, reviewedPlanGuidance, reviewedPlanGuideDigest (+6 more)

### Community 54 - "accept-stage-result.ts"
Cohesion: 0.14
Nodes (31): acceptStageResult(), mergeAuthorized(), allowed, continuationReviewArtifacts(), continuationWorktree(), negativeWorker(), reconcileContinuationReview(), savedNegativeContinuationReview() (+23 more)

### Community 55 - "weekly-rollup.ts"
Cohesion: 0.14
Nodes (27): learningMetrics(), expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), RollupResult (+19 more)

### Community 56 - "features/workflow.ts"
Cohesion: 0.06
Nodes (69): approveFeature(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), artifactPath(), digest(), document() (+61 more)

### Community 57 - "recovery/stopped-base-update.ts"
Cohesion: 0.14
Nodes (24): assertStoppedBaseAudit(), AuditRow, CoverageRow, Hash, Kind, stoppedBaseAuditMarker, Original, redact() (+16 more)

### Community 58 - "officeUrl"
Cohesion: 0.10
Nodes (26): ctoInputFailure(), OutboxCTOInput(), recover(), OutboxSavedImplementation(), apply(), review(), OutboxSavedPlan(), reconcile() (+18 more)

### Community 59 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 60 - "Store"
Cohesion: 0.07
Nodes (37): decideImplementation(), consumeQAPlanRetry(), continueAccessOnlyPlan(), entryExists(), continueUnsealedQA(), entry(), recoverSavedPlan(), recoverCTOInput() (+29 more)

### Community 61 - "tracking-issue.ts"
Cohesion: 0.19
Nodes (17): readBackOrThrow(), ensureTrackingIssue(), findTrackingIssue(), ownTracking(), TrackingIssue, trackingIssueBody(), trackingIssueTitle(), trackingMarker() (+9 more)

### Community 62 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (7): CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility, overlayEntranceDelays(), SceneOverlay()

### Community 63 - "http/commands.ts"
Cohesion: 0.15
Nodes (20): requestQAPlanRetry(), enqueueMetadataRecovery(), normalizeStatement(), baselineLearning(), configureKnowledge(), declineLessonIssue(), reactivateLesson(), retireLesson() (+12 more)

### Community 64 - "ticket-evidence.ts"
Cohesion: 0.12
Nodes (30): assetDownloader(), attachmentKind(), evidenceDirectory(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS, EvidenceAttachment (+22 more)

### Community 65 - "telemetry.ts"
Cohesion: 0.10
Nodes (26): CodexRollout, CacheWriteDuration, CODEX_ROWS, codexPriceRef(), ModelRow, OPENAI_LONG_CONTEXT_INPUT_TOKENS, OPENAI_PRICING_AS_OF, OPENAI_PRICING_URL (+18 more)

### Community 66 - "remove-candidate.ts"
Cohesion: 0.19
Nodes (17): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+9 more)

### Community 67 - "retrospective-subject.ts"
Cohesion: 0.19
Nodes (15): deliveryMetrics(), median(), maintenanceSubject(), MaintenanceSubjectFacts, azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject (+7 more)

### Community 68 - ".verifyPR"
Cohesion: 0.36
Nodes (9): officeMergeProvenance(), reconcileMergeScannerRetry(), Retry, retryMergeScanner(), retryReadBack(), runIdentity(), savedRetry(), transientScannerJobs() (+1 more)

### Community 69 - "owned-artifact.ts"
Cohesion: 0.19
Nodes (16): ghLogCacheEvidence(), investigationEvidence(), INVOCATION_SOURCE_REFS, invocationSource(), sections, OFFICE_SOURCE_PATHS, officeSource(), ROOT (+8 more)

### Community 70 - "constellation-runtime.ts"
Cohesion: 0.15
Nodes (16): CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point, focusOverlayMotion(), FocusOverlayLayout (+8 more)

### Community 71 - "process.ts"
Cohesion: 0.10
Nodes (24): Assignment, Content, jiraText(), Transition, JiraFeaturePublisher, inactivityWatch(), At, Errno (+16 more)

### Community 72 - "work.ts"
Cohesion: 0.11
Nodes (22): BLOCKED_CAUSES, blockedCauses(), projectReadiness(), explanation(), LABELS, stoppedReason(), ProjectReadiness, AssignmentResult (+14 more)

### Community 73 - "report.ts"
Cohesion: 0.29
Nodes (12): Acc, bump(), EASTERN, easternDay(), modelShares(), pricedAmount(), ranked(), row() (+4 more)

### Community 74 - "post-conflict-preparation.ts"
Cohesion: 0.17
Nodes (22): assertPostConflictFiles(), readPostConflictPreparationFacts(), routeReadyPostConflictPublication(), verifyInitialDraftConflictPreparation(), within(), preparationProviderVersion(), readPreparationProviderContext(), initialDraftConflictAnchor() (+14 more)

### Community 75 - "Offices"
Cohesion: 0.14
Nodes (7): QuestionNotifications, file, project, root, projectById(), projectData(), Offices

### Community 76 - "rootArtifact"
Cohesion: 0.22
Nodes (21): continuationNativeReview(), continuationWorkerProof(), nativeCompletion(), preparationCheckpoint(), preparationNativeAssessment(), preparationNativeCheckpoint(), acceptedNativeGate(), preparationGateEvidence() (+13 more)

### Community 77 - "daily-cto.ts"
Cohesion: 0.07
Nodes (36): collectCTOFacts(), DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), boundedIntake(), boundedJobs(), boundedMaintenance() (+28 more)

### Community 78 - "preferences-store.ts"
Cohesion: 0.21
Nodes (8): fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS, OfficePreferences, OfficePreferencesPatch

### Community 79 - "assignment.ts"
Cohesion: 0.14
Nodes (20): stagePrompt(), StagePromptInput, METADATA_FINDING_GUIDANCE, safeWebUrl(), officePreviewGuidance, officeQADirectory(), officeQAGuidance(), officeValidation() (+12 more)

### Community 80 - "artifact"
Cohesion: 0.12
Nodes (41): containedFile(), closeoutRequestResolved(), preparationRequestResolved(), originalPublication(), Ownership, reconcileScopeRepairReadback(), scopeRepairRequestResolved(), assertScopeRepairResumeFindings() (+33 more)

### Community 81 - "workKey"
Cohesion: 0.14
Nodes (28): assertSourceConfiguration(), assertContinuationWorker(), continuationJsonArtifact(), continuationScope(), continuationGuard(), brainImplementationCandidate(), BrainReadback, digest() (+20 more)

### Community 82 - "brain-maintenance.ts"
Cohesion: 0.15
Nodes (15): completeNativeCheckpoint(), BRAIN_DEPENDENCY_MERGES, BrainResult, BrainStatusSchema, identity, coverageSchema, followupSchema, verified (+7 more)

### Community 83 - "stopped-base-provider.ts"
Cohesion: 0.46
Nodes (7): pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), discussion(), pages(), pullIdentity(), readStoppedBaseProviderContext(), reviewThreads()

### Community 84 - "index.tsx"
Cohesion: 0.11
Nodes (28): FeatureQuestionProjection, OutboxQuestionRound(), send(), FeatureDelivery(), FeatureDocuments(), views, FeatureWorkspace(), phases (+20 more)

### Community 85 - "Agents"
Cohesion: 0.14
Nodes (6): canFileGithubIssue(), githubFollowupPrompt(), knowledgeChatPrompt(), goalReportContext(), Agents, WorkerRuntime

### Community 86 - ".getEffect"
Cohesion: 0.15
Nodes (16): Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership, rawHash() (+8 more)

### Community 87 - "cec-reads.ts"
Cohesion: 0.18
Nodes (15): IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), intakeMembership(), projectListScope(), cecIntakePrompt(), cecReadbackPrompt() (+7 more)

### Community 88 - "restoreInPlace"
Cohesion: 0.60
Nodes (5): identity(), Json, plain(), restorable(), restoreInPlace()

### Community 89 - "github-delivery.ts"
Cohesion: 0.09
Nodes (50): findingsBlock(), requireDeliveryAuthority(), assertDeliveryMayMutate(), handsOff(), harnessDelivers(), legacyRecovery(), discover(), refreshDependencies() (+42 more)

### Community 90 - "OutboxLessonDecision.tsx"
Cohesion: 0.11
Nodes (26): knowledgeOutbox(), LessonDecisionAction, lessonDecisionState(), readLessonDecision(), DAYS, dueLessonDecisions(), easternWeek(), isLessonDecision() (+18 more)

### Community 91 - "config.ts"
Cohesion: 0.10
Nodes (31): CommentPage, commentReadback(), devUpdate(), HEADLINE, JiraOperations, jiraRecord(), unpack(), parksInJira() (+23 more)

### Community 92 - "restart-writer.ts"
Cohesion: 0.21
Nodes (13): ATTEMPT_DELAYS_MS, nextAttemptAt(), restartStoppedWriters(), unchangedSinceAccepted(), NOT_RETRYABLE, WRITER_STAGES, WriterRestartCandidate, writerRestartCandidate() (+5 more)

### Community 93 - "notifications.ts"
Cohesion: 0.10
Nodes (27): channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice(), clamp(), LIMITS, MergedPR (+19 more)

### Community 94 - "github/issue-publication.ts"
Cohesion: 0.14
Nodes (11): FeaturePublisher, publishFeature(), Assign, Board, Content, GitHubIssuePublisher, number(), same() (+3 more)

### Community 96 - "recovery-ledger.ts"
Cohesion: 0.15
Nodes (17): itChatPrompt(), savedAdmissionUnresolved(), completedConflictDraftUnresolved(), publishedDraftConflictUnresolved(), repeatConflictRepairUnresolved(), assignmentDiagnostics(), diagnosticContext(), diagnosticSnapshot() (+9 more)

### Community 97 - "highestStableAtLeast"
Cohesion: 0.83
Nodes (3): compare(), highestStableAtLeast(), parts()

### Community 98 - ".save"
Cohesion: 0.12
Nodes (43): resolveBlockedTransition(), document(), transitionWithComment(), jiraAccount(), jiraCollection(), JiraCredential, jiraCredential(), KEYCHAIN_SERVICE (+35 more)

### Community 99 - "github-context.ts"
Cohesion: 0.12
Nodes (26): queueMergeNotice(), observeGitHubMergeNotices(), resume(), resumeProviderReviews(), APPROACH_GUIDANCE, reviewInstructions(), deliveryTask(), DeliveryTaskInput (+18 more)

### Community 100 - "cec/workflow.ts"
Cohesion: 0.23
Nodes (12): applyIntakeObservation(), qaPlanEvidenceGap(), MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), nextStage(), publicationEvidenceGap(), qaEvidenceGap() (+4 more)

### Community 101 - "Role"
Cohesion: 0.24
Nodes (12): ROLES, OfficeCapacity, fifo(), selectWork(), admitsWork(), canDispatch(), deliveryOccupied(), foreignWork() (+4 more)

### Community 102 - "prompts/conversations.ts"
Cohesion: 0.20
Nodes (10): cecReconcilePrompt(), ticketForWorker(), cecChatPrompt(), ctoChatPrompt(), slackSendPrompt(), slackVerifyPrompt(), PICKUP_CHAT, PickupSchema (+2 more)

### Community 103 - "worker-runtime.ts"
Cohesion: 0.10
Nodes (25): SlackResultSchema, SlackVerificationSchema, candidateWorkspaceEnvironment(), snapshot(), assignmentSubject(), assertBriefingScope(), sanitizeObject(), ModelRoute (+17 more)

### Community 104 - "delivery-repairs.ts"
Cohesion: 0.15
Nodes (29): correlatedBuild(), ownReceipts(), run(), verifiedTransition(), unrecordedStageResult(), advance(), namedRepairIds(), afterDraft() (+21 more)

### Community 105 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (4): bounded(), extract(), fail(), [path,kind]

### Community 106 - "digest"
Cohesion: 0.13
Nodes (24): verifiedCloseoutCleanupRequest(), adoptCandidate(), reported, Scope, advisoryPM(), assertCandidateChildContextCurrent(), readCandidateChildContext(), related (+16 more)

### Community 107 - "createConstellation"
Cohesion: 0.18
Nodes (5): ConstellationRuntime, createConstellation(), enter(), finishTap(), move()

### Community 108 - "EffectIntent"
Cohesion: 0.22
Nodes (10): Document, document(), isAccessOnlyPlan(), settledAccessOnlyState(), MISSING_SAVED_PLAN, SKILLS, persistReaderAnalysis(), readerAnalysisReference() (+2 more)

### Community 109 - "useOfficePreferences.ts"
Cohesion: 0.26
Nodes (10): acceptPreferences(), PreferenceCandidate, strip(), UNKNOWN_PREFERENCES, OfficePreferencesController, PreferenceFeedback, PreferenceField, requestPreferences() (+2 more)

### Community 110 - "superseded-receipts.ts"
Cohesion: 0.27
Nodes (8): Attempt, needsResumeReconciliation(), REVIEW_STAGES, stoppedInSetup(), Receipt, Settled, SETTLED_RECEIPT_NOTE, supersededReceipt()

### Community 111 - "coordination.ts"
Cohesion: 0.05
Nodes (51): reconcileNoticeConfirmations(), Admission, admit(), admitReadyCards(), IntakeContext, WAIT_STATUSES, resumeParked(), compatible() (+43 more)

### Community 112 - "CommandRegistry"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 113 - "admit-improvement.ts"
Cohesion: 0.10
Nodes (33): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, admitImprovement(), improvementEligible(), curateLesson(), Curation (+25 more)

### Community 114 - "slack-supersession.ts"
Cohesion: 0.50
Nodes (3): SlackReplacementRequest, SlackSupersession, SlackSupersessionView

### Community 115 - "blocker-followups.ts"
Cohesion: 0.56
Nodes (7): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), readBackConversations(), handoff(), reconcileBlockerFollowups()

### Community 119 - "validate-stage.ts"
Cohesion: 0.13
Nodes (28): UnrecordedResult, candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute (+20 more)

### Community 120 - "interrupted-work-recovery.ts"
Cohesion: 0.36
Nodes (7): interruptAdoptions(), legacy(), REMOVED_FIELDS, retireLegacyRecovery(), goalNoticeNeverDispatched(), maintenanceNoticeNeverDispatched(), recover()

### Community 121 - "pilot-delivery.ts"
Cohesion: 0.21
Nodes (15): continueImplementation(), dispatchNightly(), drainDelivery(), requestDelivery(), startPilot(), OfficeQAHandoffInput, eligibility(), approvedDelivery() (+7 more)

### Community 122 - "QAResultsCard.tsx"
Cohesion: 0.40
Nodes (7): qaResultChanges(), QA_STAGES, qaResults(), qaStatus(), artifact(), QAResultsCard(), Report()

### Community 123 - "resume"
Cohesion: 0.32
Nodes (6): candidateBranchMoved(), resume(), confirmSetupStopCap(), consecutiveSetupStops(), SETUP_STOP_CAP, setupStop()

### Community 124 - "delivery-ownership.ts"
Cohesion: 0.33
Nodes (4): Ownership, ownershipContext, refreshDeliveryOwnership(), RefreshOwnership

### Community 125 - "seeded-office-lessons.ts"
Cohesion: 0.32
Nodes (5): CONSOLIDATED, CONSOLIDATED_AT, SEEDS, seedOfficeLessons(), SEEDS

### Community 126 - "pre-push-boundary.ts"
Cohesion: 0.43
Nodes (5): Event, one(), prePushRejection(), PushIdentity, settledPushBoundary()

### Community 127 - "OfficeConfigView.tsx"
Cohesion: 0.52
Nodes (5): loadOfficeConfig(), OfficeConfigSection(), OfficeConfigState, OfficeConfigView(), OfficeConfigSummary

### Community 128 - "ITFollowUps.tsx"
Cohesion: 0.67
Nodes (4): itFollowUpView(), sessionVisibilityCopy(), date(), ITFollowUps()

## Knowledge Gaps
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `ref_node_crypto`, `Store`, `sanitize`, `session-bridge.ts`, `processGroupAlive`, `agents.ts`, `lesson-selection.ts`, `features.ts`, `reader.ts`, `scheduled-captures.ts`, `run-retrospective.ts`, `record-trigger.ts`, `delivery-repairs.ts`, `workKey`, `shared.ts`, `work-summary.ts`, `ref_node_path`, `delivery-authority.ts`, `maintenance/maintenance.ts`, `cost-ledger.ts`, `index.ts`, `jira-time.ts`, `metadata-assessment.ts`, `cec.ts`, `azure.ts`, `closeout-recovery.ts`, `JiraIssuePublisher`, `scheduled-work.ts`, `run-accounting.ts`, `dependency-bots/adopt.ts`, `it-specialist.ts`, `time-scope.ts`, `github-delivery.ts`, `ledger.ts`, `activation-recovery.ts`, `task-briefing.ts`, `command`, `control-store.ts`, `resume-provider-review.ts`, `assignments.ts`, `inspect-closed-plan.ts`, `accept-stage-result.ts`, `weekly-rollup.ts`, `features/workflow.ts`, `recovery/stopped-base-update.ts`, `tracking-issue.ts`, `http/commands.ts`, `ticket-evidence.ts`, `remove-candidate.ts`, `retrospective-subject.ts`, `owned-artifact.ts`, `process.ts`, `post-conflict-preparation.ts`, `Offices`, `rootArtifact`, `daily-cto.ts`, `assignment.ts`, `artifact`, `workKey`, `brain-maintenance.ts`, `Agents`, `.getEffect`, `cec-reads.ts`, `github-delivery.ts`, `config.ts`, `restart-writer.ts`, `notifications.ts`, `github/issue-publication.ts`, `recovery-ledger.ts`, `.save`, `github-context.ts`, `Role`, `prompts/conversations.ts`, `worker-runtime.ts`, `delivery-repairs.ts`, `digest`, `EffectIntent`, `coordination.ts`, `admit-improvement.ts`, `blocker-followups.ts`, `validate-stage.ts`, `interrupted-work-recovery.ts`, `pilot-delivery.ts`, `resume`?**
  _High betweenness centrality (0.099) - this node is a cross-community bridge._
- **Should `OrgChart.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09728506787330317 - nodes in this community are weakly interconnected._
- **Why does `Coordinator` connect `coordination.ts` to `scheduled-work.ts`, `session-bridge.ts`, `scheduled-captures.ts`, `brain-maintenance.ts`, `workKey`, `Store`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Should `ref_node_crypto` be split into smaller, more focused modules?**
  _Cohesion score 0.11904761904761904 - nodes in this community are weakly interconnected._
- **Why does `GitHubDelivery` connect `github-delivery.ts` to `github-check-selection.ts`, `delivery-repairs.ts`, `workKey`, `metadata-assessment.ts`, `closeout-recovery.ts`, `activation-recovery.ts`, `resume-provider-review.ts`, `accept-stage-result.ts`, `recovery/stopped-base-update.ts`, `.verifyPR`, `process.ts`, `post-conflict-preparation.ts`, `rootArtifact`, `artifact`, `workKey`, `stopped-base-provider.ts`, `.getEffect`, `github-delivery.ts`, `restart-writer.ts`, `github-context.ts`, `delivery-repairs.ts`, `digest`, `coordination.ts`, `validate-stage.ts`, `pilot-delivery.ts`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Should `Inspector.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10695970695970695 - nodes in this community are weakly interconnected._
- **Should `sanitize` be split into smaller, more focused modules?**
  _Cohesion score 0.06885758998435054 - nodes in this community are weakly interconnected._