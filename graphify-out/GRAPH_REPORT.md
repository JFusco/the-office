# Graph Report - office-coordination-receipts-nov15  (2026-11-15)

## Corpus Check
- 821 files · ~334,076 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4089 nodes · 19113 edges · 108 communities (106 shown, 2 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 620 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c60cfc7a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- github-delivery.ts
- closeout-recovery.ts
- artifact
- harnessEffect
- Inspector.tsx
- config.ts
- App.tsx
- Button
- source-amendment.ts
- session-context-file.ts
- ref_node_util
- lesson-selection.ts
- daily-cto.ts
- authorize.ts
- GitHubDelivery
- ref_node_path
- PeoplePanel.tsx
- digest
- index.tsx
- Engine
- scheduled-captures.ts
- reader.ts
- agents.ts
- assignments.ts
- run-retrospective.ts
- .transaction
- .emit
- readback-evidence.ts
- mutedCopy
- Role
- maintenance/maintenance.ts
- QuestionStepper.tsx
- record-trigger.ts
- outbox.ts
- TimeBook.tsx
- assignment-poll.ts
- Store
- scheduled-work.ts
- azure.ts
- candidate.ts
- run-accounting.ts
- approach.ts
- time-scope.ts
- engine.ts
- .save
- enrollment-gate.ts
- knowledge.ts
- source-amendment-scope.ts
- accept-retrospective.ts
- github-check-selection.ts
- OfficeScene.tsx
- index.ts
- process.ts
- weekly-rollup.ts
- constellation-runtime.ts
- Coordinator
- ticket-evidence.ts
- Ticket
- remove-candidate.ts
- retrospective-subject.ts
- github/issue-publication.ts
- jira-operations.ts
- discovery-recovery.ts
- create-candidate.ts
- features.ts
- learning-events.ts
- work.ts
- cec/issue-publication.ts
- coordination.ts
- security.ts
- coordination-tick.ts
- extraction.ts
- ledger.ts
- knowledge-views.ts
- shared.ts
- DailyCTO.tsx
- dependencies.ts
- node-visuals.ts
- session-bridge.ts
- offices.ts
- preferences-store.ts
- scene-motion.ts
- session-scope.ts
- evidence-digest.ts
- intent.ts
- capture-session-clone.py
- RoomCamera.tsx
- inspect-closed-plan.ts
- tracking-issue.ts
- http/commands.ts
- createConstellation
- session-coverage.ts
- dependency-bots/adopt.ts
- command-registry.ts
- MaintenanceRun
- recover-saved-plan.ts
- brain-maintenance.ts
- extract-worker.mjs
- features/routes.ts
- maintenancePolicies
- retire-history.ts
- checkpoint-completion.ts
- install-service.mjs
- continue-access-only-plan.ts
- pre-push-boundary.ts
- CommittedBrain
- office-qa-handoff.ts
- highestStableAtLeast

## God Nodes (most connected - your core abstractions)
1. `Store` - 365 edges
2. `TicketJob` - 176 edges
3. `digest()` - 167 edges
4. `artifact()` - 129 edges
5. `GitHubDelivery` - 122 edges
6. `command()` - 113 edges
7. `workKey()` - 101 edges
8. `currentAssignment()` - 88 edges
9. `cx()` - 88 edges
10. `Button` - 84 edges

## Surprising Connections (you probably didn't know these)
- `apply()` --indirect_call--> `note()`  [INFERRED]
  src/conversations/OutboxSavedImplementation.tsx → server/cec/parking/resume-parked.ts
- `projectOutbox()` --calls--> `isSavedPlanFollowup()`  [EXTRACTED]
  server/conversations/outbox.ts → src/conversations/saved-plan-followup.ts
- `projectOutbox()` --calls--> `deferredPickup()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/pickup-state.ts
- `projectOutbox()` --calls--> `parkedProviderWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts
- `projectOutbox()` --calls--> `readinessWait()`  [EXTRACTED]
  server/conversations/outbox.ts → src/work/work-summary.ts

## Import Cycles
- 3-file cycle: `server/delivery/parking/resume-provider-review.ts -> server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/parking/resume-provider-review.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/pipeline/observe-prs.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/delivery/repairs/refresh-conflicted.ts -> server/delivery/pipeline/github-delivery.ts`
- 3-file cycle: `server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/repairs/conflict-repair.ts -> server/delivery/repairs/conflict-chain.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts`
- 4-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 4-file cycle: `server/delivery/recovery/implementation/activation-recovery.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/implementation/activation-recovery.ts`
- 4-file cycle: `server/delivery/recovery/implementation/saved-prerequisite-handoff.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/implementation/saved-prerequisite-handoff.ts`
- 4-file cycle: `server/delivery/recovery/scope-repair/scope-repair-readback.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/scope-repair/scope-repair-readback.ts`
- 4-file cycle: `server/delivery/recovery/source-amendment/source-amendment.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/source-amendment/source-amendment.ts`
- 4-file cycle: `server/delivery/recovery/stopped-base-review.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/stopped-base-review.ts`
- 4-file cycle: `server/delivery/recovery/validation/validation-readback.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/validation/validation-readback.ts`
- 4-file cycle: `server/features/delivery-binding.ts -> server/features/enrollment-gate.ts -> server/features/progression/failure.ts -> server/store/effects.ts -> server/features/delivery-binding.ts`
- 5-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/stage-reconciliation.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 5-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/readiness/github-readiness.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 5-file cycle: `server/delivery/recovery/implementation/continuation-evidence.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/recovery/implementation/continuation-evidence.ts`
- 5-file cycle: `server/delivery/recovery/implementation/saved-prerequisite-handoff.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/preparation/published-draft-conflict.ts -> server/delivery/recovery/implementation/saved-prerequisite-handoff.ts`
- 5-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/scope-repair/scope-repair-resume.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`
- 5-file cycle: `server/delivery/recovery/scope-repair/scope-repair-readback.ts -> server/delivery/recovery/scope-repair/scope-repair-resume.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/scope-repair/scope-repair-readback.ts`
- 5-file cycle: `server/delivery/recovery/implementation/continuation-evidence.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/recovery/implementation/implementation-recovery.ts -> server/delivery/recovery/implementation/continuation-evidence.ts`
- 5-file cycle: `server/delivery/pipeline/github-delivery.ts -> server/delivery/recovery/closeout/github-closeout.ts -> server/workers/agents.ts -> server/knowledge/blocker-followups.ts -> server/scheduling/requests.ts -> server/delivery/pipeline/github-delivery.ts`

## Communities (108 total, 2 thin omitted)

### Community 0 - "github-delivery.ts"
Cohesion: 0.05
Nodes (82): interruptedImplementation(), recoverCTOInput(), findingsBlock(), deliveryAdmission(), assessDeliveryAuthority(), assessDeliveryEligibility(), DeliveryAuthorityInput, requireDeliveryAuthority() (+74 more)

### Community 1 - "closeout-recovery.ts"
Cohesion: 0.09
Nodes (52): closeoutReceipt(), assertCoreCloseoutCoverage(), Assessment, closeoutClaim(), CloseoutOwnership, CoreAssessment, CoreAssessmentV2, closeoutCheckpoint() (+44 more)

### Community 2 - "artifact"
Cohesion: 0.06
Nodes (111): acceptStageResult(), acceptConflictRepair(), recordJobApproach(), linkDraftIssue(), METADATA_FINDING, readPublication(), mergeAuthorized(), activationAuditResponseSchema() (+103 more)

### Community 3 - "harnessEffect"
Cohesion: 0.17
Nodes (28): initialManualStart(), Lane, MOVABLE, moveLane(), resolveLane(), cardStatus(), ProjectCard, projectCards() (+20 more)

### Community 4 - "Inspector.tsx"
Cohesion: 0.07
Nodes (91): ref_lucide_react, Conversation(), SendMessage, LessonDecisionAction, lessonDecisionState(), readLessonDecision(), Outbox(), OutboxLessonDecision() (+83 more)

### Community 5 - "config.ts"
Cohesion: 0.08
Nodes (32): IntakeBinding, intakeEnumeration(), intakeJql(), intakeLocation(), intakeMembership(), projectListScope(), cecIntakePrompt(), cecReadbackPrompt() (+24 more)

### Community 6 - "App.tsx"
Cohesion: 0.05
Nodes (72): ref_motion, ref_react_dom, compactSteps(), BrainDrawer(), themeColor, App(), BrainWorkspace, CONNECTION (+64 more)

### Community 7 - "Button"
Cohesion: 0.08
Nodes (53): ref_react, ref_react_markdown, ref_remark_gfm, ref_yaml, TicketPlanningAction(), Activity(), ActivityTimeline(), AssignmentKnowledge() (+45 more)

### Community 8 - "source-amendment.ts"
Cohesion: 0.07
Nodes (67): ref_node_async_hooks, stagePrompt(), StagePromptInput, METADATA_FINDING_GUIDANCE, adoptCandidate(), reported, Scope, advisoryPM() (+59 more)

### Community 9 - "session-context-file.ts"
Cohesion: 0.21
Nodes (13): ref_node_perf_hooks, contextFoldPrefix, SessionContextCheckpoint, captureSessionContextClone(), ContextReadPhase, SessionContextDeadline, sessionContextFile(), ContextReadChanged (+5 more)

### Community 10 - "ref_node_util"
Cohesion: 0.09
Nodes (62): ref_node_util, harnessCloseout(), PASSING, verifyMergeActions(), activeEffectId(), withHarnessWork(), retryRead(), runHarnessStage() (+54 more)

### Community 11 - "lesson-selection.ts"
Cohesion: 0.07
Nodes (34): ref_node_stream, ref_node_timers, args, [cmd,...rawArgs], commands, key, projectIndex, lessonBrainAudit (+26 more)

### Community 12 - "daily-cto.ts"
Cohesion: 0.06
Nodes (38): collectCTOFacts(), DailyCTO, EvidenceRequestConflict, evidenceRequestConflicts, dailyReviewPrompt(), boundedIntake(), boundedJobs(), boundedMaintenance() (+30 more)

### Community 13 - "authorize.ts"
Cohesion: 0.09
Nodes (47): approveFeature(), mutation(), assertFeatureDependencyOrder(), featureDependencyEdges(), key(), artifactPath(), digest(), document() (+39 more)

### Community 14 - "GitHubDelivery"
Cohesion: 0.04
Nodes (95): continueUnsealedQA(), entry(), handoffOwnership(), ReadbackOwnerDecision, StageContext, GitHubDelivery, reconcileBoardPreflight(), completedPRReviews() (+87 more)

### Community 15 - "ref_node_path"
Cohesion: 0.11
Nodes (37): ref_node_fs, ref_node_path, containedFile(), removeAdoptedClone(), namedRepairIds(), stoppedBaseCheckout(), stoppedBasePackageInstruction(), stoppedBaseReviewContext() (+29 more)

### Community 16 - "PeoplePanel.tsx"
Cohesion: 0.11
Nodes (38): Department, DEPARTMENTS, EMPLOYEE_IDS, EmployeeId, ManagerId, OWNER, Persona, PERSONAS (+30 more)

### Community 17 - "digest"
Cohesion: 0.12
Nodes (40): HarnessControl, refusal(), resumeProviderReviews(), observe(), assertDraftClaimHistory(), assertAutomationEffects(), automationMergePolicy(), observeAutomationMerge() (+32 more)

### Community 18 - "index.tsx"
Cohesion: 0.05
Nodes (51): ctoInputFailure(), OutboxCTOInput(), recover(), OutboxMaintenanceStatus(), OutboxSavedImplementation(), apply(), review(), OutboxSavedPlan() (+43 more)

### Community 19 - "Engine"
Cohesion: 0.09
Nodes (3): Engine, observe(), observeParked()

### Community 20 - "scheduled-captures.ts"
Cohesion: 0.15
Nodes (45): createFeature(), assertEnrollable(), enrolled(), assessmentSignal(), AssessmentSignals, failEvidenceCapture(), captureRequest, captureRequests() (+37 more)

### Community 21 - "reader.ts"
Cohesion: 0.11
Nodes (31): knowledgeActivity(), knowledgeActivityPage(), assignmentKnowledge(), committedNotePage(), BrainGraph, BrainNote, BrainReader, GraphNode (+23 more)

### Community 22 - "agents.ts"
Cohesion: 0.06
Nodes (53): ref_zod, SlackResultSchema, SlackVerificationSchema, candidateWorkspaceEnvironment(), HANDS_OFF_RESOLUTION_GUIDANCE, RESOLUTION_GUIDANCE, ApproachSchema, canFileGithubIssue() (+45 more)

### Community 23 - "assignments.ts"
Cohesion: 0.11
Nodes (19): assignmentLookups, Binding, lookupInstructions(), clip(), MISSED_QUERY_LIMIT, missedQueries(), decodeLookupJournal(), lookupJournal (+11 more)

### Community 24 - "run-retrospective.ts"
Cohesion: 0.10
Nodes (36): brainOverlap, brainOverlapQuery(), clip(), fits(), withBrainOverlap(), clip(), DEMAND_LIMIT, demandFacts() (+28 more)

### Community 25 - ".transaction"
Cohesion: 0.10
Nodes (39): ref_node_crypto, featureItemComplete(), reconcileFeatureCompletion(), discoveryPrompt(), planPrompt(), FreshDiscoverySchema, FreshPlanSchema, GitHubFeaturePublisher (+31 more)

### Community 26 - ".emit"
Cohesion: 0.07
Nodes (37): assertConversationReadback(), ConversationResultSchema, Conversations, GoalChangeSchema, MessageInput, ReplySchema, pumpCTO(), queueCTOHandoff() (+29 more)

### Community 27 - "readback-evidence.ts"
Cohesion: 0.09
Nodes (42): ref_node_os, pinCourierIdentityRefusal(), pinCourierVerifiedCommit(), assertStoppedBaseAudit(), AuditRow, readStoppedBaseAuditCompletion(), StoppedBaseAuditReader, CoverageRow (+34 more)

### Community 28 - "mutedCopy"
Cohesion: 0.14
Nodes (34): act(), SaveFeedback(), TONE, GoalNoticeForm(), MergeCloseoutForm(), OfficePreferencesForm(), SHORTCUTS, PickupForm() (+26 more)

### Community 29 - "Role"
Cohesion: 0.08
Nodes (28): ROLES, draftReadHeadMatches(), protectedOriginalClaim(), publicationReadArgs(), MaintenanceSubjectFacts, DeliverySlot, officeCapacity, PROJECTS (+20 more)

### Community 30 - "maintenance/maintenance.ts"
Cohesion: 0.13
Nodes (20): reviewInstructions(), candidateOwner(), SETTLED, skipOwnedCandidate(), Skipped, skippedCandidateLedger(), CmsFollowUpContext, cmsFollowUpInstructions() (+12 more)

### Community 31 - "QuestionStepper.tsx"
Cohesion: 0.19
Nodes (18): FeatureQuestionProjection, OutboxQuestionRound(), send(), draftKey(), readDraft(), saveDraft(), QuestionRound(), nextQuestion() (+10 more)

### Community 32 - "record-trigger.ts"
Cohesion: 0.11
Nodes (40): BLOCKING, blockingTrigger, isBlocking(), busyMaintenanceIds(), clip(), maintenanceBlockedId(), MaintenanceCandidate, maintenanceCandidates() (+32 more)

### Community 33 - "outbox.ts"
Cohesion: 0.13
Nodes (24): conversationReadbackReady(), queueConversationReadback(), uncertainConversations(), conversationResolved(), projectOutbox(), syncOutbox(), projectSlackDeliveries(), Input (+16 more)

### Community 34 - "TimeBook.tsx"
Cohesion: 0.11
Nodes (35): LiveAnchor, AzureBuild, src_shared_liveanchor, BreakdownTable(), CostBar(), coverage(), pricedLabel(), tokens() (+27 more)

### Community 35 - "assignment-poll.ts"
Cohesion: 0.13
Nodes (23): MISSING_INTAKE, reconcileMailbox(), unusedMailbox(), channelNoticeAuthorized(), ChannelSettings, configureChannelNotices(), notices(), queueChannelNotice() (+15 more)

### Community 36 - "Store"
Cohesion: 0.05
Nodes (40): ref_node_sqlite, Read, JiraFeaturePublisher, seedProjectLessons(), goalNoticeAuthorized(), goalNoticeNeverDispatched(), GoalInput, Result (+32 more)

### Community 37 - "scheduled-work.ts"
Cohesion: 0.07
Nodes (57): deliverySlot(), closeoutRequestResolved(), verifiedCloseoutCleanupRequest(), metadataRequestResolved(), preparationRequestResolved(), withAmendmentOwnership(), gateFeatureWork(), scheduledInvestigations() (+49 more)

### Community 38 - "azure.ts"
Cohesion: 0.09
Nodes (36): az(), AzureMonitor, base, buildUrl(), prUrl(), readInPairs(), ProviderPR, readAzurePRs() (+28 more)

### Community 39 - "candidate.ts"
Cohesion: 0.19
Nodes (17): GitRead, nativeGitRead(), patchArgs, savedImplementation(), sha(), sourceCopyMatches(), sourceFiles(), absent() (+9 more)

### Community 40 - "run-accounting.ts"
Cohesion: 0.05
Nodes (71): BoundedRead, done(), readBoundedNoFollow(), reasonOf(), EvidenceOutcome, backfillClaudeCost(), CompletionReader, add() (+63 more)

### Community 41 - "approach.ts"
Cohesion: 0.18
Nodes (24): correlatedBuild(), parksInJira(), run(), publicationEvidenceGap(), qaEvidenceGap(), stageResultGap(), DECISION_KINDS, needsDecision() (+16 more)

### Community 42 - "time-scope.ts"
Cohesion: 0.06
Nodes (64): expireLessons(), expiring(), graduateLessons(), graduating(), queueLessonIssueCheck(), retire(), dailyReviewDate(), reviewWeekday() (+56 more)

### Community 43 - "engine.ts"
Cohesion: 0.14
Nodes (19): continueImplementation(), applyIntakeObservation(), checkMail(), drainMail(), requestMail(), dispatchNightly(), drainDelivery(), enableNightly() (+11 more)

### Community 44 - ".save"
Cohesion: 0.09
Nodes (41): jiraCollection(), BLOCKED, findComment(), LiveIssue, readIssue(), readIssues(), Execute, jira() (+33 more)

### Community 45 - "enrollment-gate.ts"
Cohesion: 0.14
Nodes (24): featureById(), approvedDelivery(), bindDelivery(), featureDeliveryContext(), featureEffectGate(), assertFeatureGate(), bindFeature(), currentApproval() (+16 more)

### Community 46 - "knowledge.ts"
Cohesion: 0.07
Nodes (38): normalizeStatement(), decideOfficeProposal(), now(), OfficeKnowledgeStore, proposeOfficeLessons(), retireOfficeLesson(), Input, promoteNoteLesson() (+30 more)

### Community 47 - "source-amendment-scope.ts"
Cohesion: 0.08
Nodes (34): approvedText(), assert(), assert(), normalize(), officialUrls, ReleaseCapture, verifyReleaseCaptures(), capture (+26 more)

### Community 48 - "accept-retrospective.ts"
Cohesion: 0.12
Nodes (28): Accepted, acceptRetrospective(), RETROSPECTIVE_HISTORY, Shared, admitImprovement(), improvementEligible(), curateLesson(), Curation (+20 more)

### Community 49 - "github-check-selection.ts"
Cohesion: 0.21
Nodes (19): checksFailed(), checksPassed(), checksPending(), CurrentChecksWait, currentMergeChecks(), pass(), pending(), requireThat() (+11 more)

### Community 50 - "OfficeScene.tsx"
Cohesion: 0.16
Nodes (34): itAgent(), Avatar(), AzureWall(), Box(), Chair(), Coworker(), CTORoom(), Desk() (+26 more)

### Community 51 - "index.ts"
Cohesion: 0.07
Nodes (51): ref_hono_node_server, ref_node_http, ref_vite, implementationContinuationRoute(), qaPlanRetryRoute(), close(), config, itSpecialist (+43 more)

### Community 52 - "process.ts"
Cohesion: 0.21
Nodes (13): inactivityWatch(), At, errno, GroupInventory, GroupProbe, LifecycleDiagnostic, Phase, Pid (+5 more)

### Community 53 - "weekly-rollup.ts"
Cohesion: 0.22
Nodes (15): learningMetrics(), RollupResult, harperFolder(), RETROSPECTIVE_TIMEOUT, retryDelay(), lastFriday(), ROLLUP_HISTORY, rollupDue() (+7 more)

### Community 54 - "constellation-runtime.ts"
Cohesion: 0.15
Nodes (17): ref_3d_force_graph, ref_three, CameraPose, flightPose(), cameraTarget(), focusDistance, overviewDistance, Point (+9 more)

### Community 56 - "ticket-evidence.ts"
Cohesion: 0.22
Nodes (18): attachmentKind(), evidenceDirectory(), storeEvidence(), blankEvidence(), CoverageState, EVIDENCE_LIMITS, EvidenceAttachment, EvidenceReadContext (+10 more)

### Community 57 - "Ticket"
Cohesion: 0.19
Nodes (17): implementationWorkerContext(), cecPrompt(), resolvedDecisionNote(), stageInstructions, qaPlanEvidenceGap(), qaRunDirectory(), APPROACH_GUIDANCE, isQAStage() (+9 more)

### Community 58 - "remove-candidate.ts"
Cohesion: 0.19
Nodes (17): recordCandidateCleanup(), interruptedRemoval(), moveAside(), moveBack(), purgeRemoved(), purging, removedRoot(), CandidateRemoval (+9 more)

### Community 59 - "retrospective-subject.ts"
Cohesion: 0.14
Nodes (20): deliveryMetrics(), median(), maintenanceSubject(), azurePrUrl(), findSubject(), jobSubject(), RetrospectiveSubject, SubjectStepResult (+12 more)

### Community 60 - "github/issue-publication.ts"
Cohesion: 0.20
Nodes (9): PublicationReceipt, Assign, Board, Content, GitHubIssuePublisher, number(), same(), FeatureManifestItem (+1 more)

### Community 61 - "jira-operations.ts"
Cohesion: 0.27
Nodes (9): CommentPage, commentReadback(), JiraOperations, plain(), jiraRecord(), unpack(), metadataDigest(), verifiedTransition() (+1 more)

### Community 62 - "discovery-recovery.ts"
Cohesion: 0.26
Nodes (11): Assessment, bindDiscoveryResume(), diagnosticProof(), discoveryRecoveryCandidate(), DiscoveryResumeInput, ownedArtifact(), Ownership, rawHash() (+3 more)

### Community 63 - "create-candidate.ts"
Cohesion: 0.21
Nodes (12): candidateIdentity(), candidateSlug(), createCandidate(), Execute, readCandidate(), repositoryOf(), Execute, installDependencies() (+4 more)

### Community 64 - "features.ts"
Cohesion: 0.10
Nodes (40): commandFeature(), reviewQuestions(), automaticIntakeWait(), FeaturePlanningBindings, assertQuestionVisibility(), applyHarnessAction(), HarnessActionInput, recoveryPreconditions() (+32 more)

### Community 65 - "learning-events.ts"
Cohesion: 0.21
Nodes (14): improvementIntakeGate(), captureLearning(), learningDigest(), recordLearningOpportunity(), expireLearningPackets(), LEARNING_BASELINES, packetReferences(), captureMaintenanceStep() (+6 more)

### Community 66 - "work.ts"
Cohesion: 0.11
Nodes (21): BLOCKED_CAUSES, blockedCauses(), explanation(), LABELS, stoppedReason(), ProjectReadiness, AssignmentResult, BlockedCause (+13 more)

### Community 67 - "cec/issue-publication.ts"
Cohesion: 0.17
Nodes (10): Assignment, Content, JiraIssuePublisher, jiraText(), keyOf(), Transition, descriptionPreimage(), plain() (+2 more)

### Community 68 - "coordination.ts"
Cohesion: 0.21
Nodes (12): checkpointWindow(), coordination(), dueAt(), hours, localDay(), ReviewResult, deferNonReady(), preparePR() (+4 more)

### Community 69 - "security.ts"
Cohesion: 0.31
Nodes (7): safeOrigin(), safeWebUrl(), officeValidation(), contained(), officeQAEvidenceGap(), OfficeQAReportSchema, text

### Community 70 - "coordination-tick.ts"
Cohesion: 0.18
Nodes (15): reconcileNoticeConfirmations(), dependencyCompletionKey(), PrerequisitesSchema, brainCheckpointCompletion(), reconcileCompletedCheckpoints(), reconcileContinuations(), pruneCompletedReads(), READ_OPERATIONS (+7 more)

### Community 71 - "extraction.ts"
Cohesion: 0.18
Nodes (10): ref_node_child_process, ref_node_string_decoder, extractDocument, Extraction, Extractor, GIT_NETWORK, LIVE_PROVIDERS, liveReach() (+2 more)

### Community 72 - "ledger.ts"
Cohesion: 0.09
Nodes (34): ctoInputRecovered(), INVESTIGATION_ATTEMPTS, INVESTIGATION_TIMEOUT, investigationCandidates(), investigationId(), ctoReplacementResolution(), investigationEvidence(), investigationFollowUps() (+26 more)

### Community 73 - "knowledge-views.ts"
Cohesion: 0.17
Nodes (18): KnowledgeActivity, KnowledgeActivityPage, KnowledgeEdge, KnowledgeMap, KnowledgeNode, connectionSummary(), ConstellationView, DisplayNode (+10 more)

### Community 74 - "shared.ts"
Cohesion: 0.04
Nodes (54): IntakeContext, adoptDependabot(), openDependabotPulls(), GitHubMonitor, assignmentDiagnostics(), ITContext, diagnosticContext(), diagnosticSnapshot() (+46 more)

### Community 75 - "DailyCTO.tsx"
Cohesion: 0.22
Nodes (12): CTOReview(), goalState, DailyCTO(), reportDate(), reviewStatus, GoalList(), card(), InlineText() (+4 more)

### Community 76 - "dependencies.ts"
Cohesion: 0.17
Nodes (18): MergeNotifications, Admission, admit(), WAIT_STATUSES, resumeParked(), compatible(), dependencyEligibility(), DependencyStores (+10 more)

### Community 77 - "node-visuals.ts"
Cohesion: 0.20
Nodes (13): ATMOSPHERE, mapAtmosphere(), Particle, system(), unit(), LabelRectangle, visibleLabels(), domainAnchor() (+5 more)

### Community 78 - "session-bridge.ts"
Cohesion: 0.15
Nodes (15): ref_ws, claudeSessionContext(), codexDaemonProcesses(), codexSessionContext(), idleExecServers(), isExecServer(), processTable, claudeSessions() (+7 more)

### Community 79 - "offices.ts"
Cohesion: 0.09
Nodes (18): ref_smol_toml, QuestionNotifications, leadershipContext(), maintainLearning(), mirrorOfficeKnowledge(), knowledgeEntries(), knowledgeOfficeState(), knowledgePromptStore() (+10 more)

### Community 80 - "preferences-store.ts"
Cohesion: 0.21
Nodes (8): fields, PreferencesPatch, PreferencesStore, StoredBody, PreferenceState, OFFICE_PREFERENCE_DEFAULTS, OfficePreferences, OfficePreferencesPatch

### Community 81 - "scene-motion.ts"
Cohesion: 0.31
Nodes (14): avatarHome(), ctoPacingPath(), deliveryRoles, deliveryStage(), distance(), handoffPath(), pacingDelay(), sampleTrip() (+6 more)

### Community 82 - "session-scope.ts"
Cohesion: 0.16
Nodes (16): readTranscript, root, claudeSessionScope(), readRollout, ContextProject, ContextReader, retainSessionMessage(), SessionConversation (+8 more)

### Community 83 - "evidence-digest.ts"
Cohesion: 0.44
Nodes (7): canonical(), evidenceDigest(), evidenceHash(), semantic(), stableUrl(), requirementDrift(), RequirementPostimage

### Community 84 - "intent.ts"
Cohesion: 0.18
Nodes (14): ContinuationIO, nativeIO, assertOwnership(), decideImplementation(), ImplementationDecision, implementationPreview(), OwnershipRead, assertCandidateIdle() (+6 more)

### Community 85 - "capture-session-clone.py"
Cohesion: 0.15
Nodes (10): ctypes, errno, importlib_util, json, os, pathlib, Copy a coherent macOS clone of inherited reader fd3 to anonymous target fd4. No…, Read-only protocol adapter for the installed review helper. No model dispatch. (+2 more)

### Community 86 - "RoomCamera.tsx"
Cohesion: 0.22
Nodes (10): ref_react_three_drei, ref_react_three_fiber, ref_three_stdlib, CameraBookmark, restoreBookmark(), RoomCamera(), entranceDelayClasses, FloorVisibility (+2 more)

### Community 87 - "inspect-closed-plan.ts"
Cohesion: 0.23
Nodes (9): closedReadonlyPlan(), Document, entryExists(), inspectClosedQAPlan(), reviewedPlanGuidance, reviewedPlanGuideDigest, QAPlanRetry, QAPlanRetryProof (+1 more)

### Community 88 - "tracking-issue.ts"
Cohesion: 0.19
Nodes (17): readBackOrThrow(), ensureTrackingIssue(), findTrackingIssue(), ownTracking(), TrackingIssue, trackingIssueBody(), trackingIssueTitle(), trackingMarker() (+9 more)

### Community 89 - "http/commands.ts"
Cohesion: 0.22
Nodes (16): configureNotices(), retryRecipientLookup(), enqueueGreen156(), enqueueMetadataRecovery(), baselineLearning(), configureKnowledge(), declineLessonIssue(), reactivateLesson() (+8 more)

### Community 90 - "createConstellation"
Cohesion: 0.19
Nodes (5): ConstellationRuntime, createConstellation(), enter(), finishTap(), move()

### Community 91 - "session-coverage.ts"
Cohesion: 0.24
Nodes (11): View, accountCodexProcesses(), codexProcessInventory, DesktopSessions, unaccountedProcesses(), LiveSession, completeSessionCoverage(), desktopCoverageGap() (+3 more)

### Community 92 - "dependency-bots/adopt.ts"
Cohesion: 0.16
Nodes (22): Execute, closesIssue(), linkedBody(), linkPR(), DEPENDABOT, dependabotPR, inPickupLane(), readRepo() (+14 more)

### Community 93 - "command-registry.ts"
Cohesion: 0.29
Nodes (4): CommandRegistry, CommandScope, inside(), RegisteredCommand

### Community 94 - "MaintenanceRun"
Cohesion: 0.29
Nodes (10): checkpointHasMaintenanceAlert(), maintenanceNeedsFollowup(), maintenanceNeedsHumanFollowup(), repeatedVendorReviewBlock(), stoppedInVendorReview(), maintenanceSuperseded(), REOBSERVED, ReconciliationRequest (+2 more)

### Community 95 - "recover-saved-plan.ts"
Cohesion: 0.31
Nodes (9): resume(), MISSING_SAVED_PLAN, recoverSavedPlan(), advance(), nextStage(), resultGate(), persistReaderAnalysis(), readerAnalysisReference() (+1 more)

### Community 96 - "brain-maintenance.ts"
Cohesion: 0.35
Nodes (8): completeNativeCheckpoint(), BRAIN_DEPENDENCY_MERGES, BrainResult, queueCheckpointRetry(), readBackCheckpoint(), resumeRepairedMaintenance(), retryCheckpoint(), validateNativeContinuation()

### Community 97 - "extract-worker.mjs"
Cohesion: 0.31
Nodes (6): ref_mammoth, ref_pdfjs_dist, bounded(), extract(), fail(), [path,kind]

### Community 98 - "features/routes.ts"
Cohesion: 0.33
Nodes (4): Link, linkFeature(), featureRoute(), FeatureWorkflow

### Community 99 - "maintenancePolicies"
Cohesion: 0.29
Nodes (6): maintenancePolicies(), BrainMaintenance, capped(), queueMaintenanceNotice(), easternDate(), weeklyDue()

### Community 100 - "retire-history.ts"
Cohesion: 0.31
Nodes (8): readHistoryScope(), enqueueHistoryRetirement(), historicalRecordDigest(), Intent, records(), retireIncompleteHistory(), HistoryRetirement, HistoryRetirementIntent

### Community 101 - "checkpoint-completion.ts"
Cohesion: 0.28
Nodes (5): BrainStatusSchema, identity, coverageSchema, followupSchema, verified

### Community 102 - "install-service.mjs"
Cohesion: 0.29
Nodes (5): ref_node_url, file, folder, logs, root

### Community 103 - "continue-access-only-plan.ts"
Cohesion: 0.57
Nodes (5): Document, isAccessOnlyPlan(), settledAccessOnlyState(), continueAccessOnlyPlan(), entryExists()

### Community 104 - "pre-push-boundary.ts"
Cohesion: 0.43
Nodes (5): Event, one(), prePushRejection(), PushIdentity, settledPushBoundary()

### Community 106 - "office-qa-handoff.ts"
Cohesion: 0.60
Nodes (4): OfficeQAHandoff, OfficeQAHandoffInput, OfficeQAHandoffRequest, QAOwnershipProof

### Community 107 - "highestStableAtLeast"
Cohesion: 0.83
Nodes (3): compare(), highestStableAtLeast(), parts()

## Knowledge Gaps
- **497 isolated node(s):** `root`, `folder`, `file`, `logs`, `base` (+492 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 635 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `github-delivery.ts`, `closeout-recovery.ts`, `artifact`, `harnessEffect`, `config.ts`, `App.tsx`, `source-amendment.ts`, `ref_node_util`, `lesson-selection.ts`, `daily-cto.ts`, `authorize.ts`, `GitHubDelivery`, `ref_node_path`, `digest`, `scheduled-captures.ts`, `reader.ts`, `agents.ts`, `assignments.ts`, `run-retrospective.ts`, `.transaction`, `.emit`, `readback-evidence.ts`, `Role`, `maintenance/maintenance.ts`, `record-trigger.ts`, `outbox.ts`, `assignment-poll.ts`, `scheduled-work.ts`, `azure.ts`, `candidate.ts`, `run-accounting.ts`, `time-scope.ts`, `engine.ts`, `.save`, `enrollment-gate.ts`, `knowledge.ts`, `accept-retrospective.ts`, `index.ts`, `weekly-rollup.ts`, `ticket-evidence.ts`, `Ticket`, `remove-candidate.ts`, `retrospective-subject.ts`, `github/issue-publication.ts`, `jira-operations.ts`, `discovery-recovery.ts`, `create-candidate.ts`, `features.ts`, `learning-events.ts`, `cec/issue-publication.ts`, `coordination.ts`, `coordination-tick.ts`, `ledger.ts`, `shared.ts`, `dependencies.ts`, `session-bridge.ts`, `offices.ts`, `intent.ts`, `inspect-closed-plan.ts`, `tracking-issue.ts`, `http/commands.ts`, `dependency-bots/adopt.ts`, `recover-saved-plan.ts`, `features/routes.ts`, `retire-history.ts`, `checkpoint-completion.ts`, `continue-access-only-plan.ts`?**
  _High betweenness centrality (0.111) - this node is a cross-community bridge._
- **Why does `Coordinator` connect `Coordinator` to `brain-maintenance.ts`, `assignment-poll.ts`, `coordination.ts`, `Store`, `coordination-tick.ts`, `scheduled-work.ts`, `dependencies.ts`, `session-bridge.ts`, `offices.ts`, `GitHubDelivery`, `scheduled-captures.ts`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Why does `Role` connect `Role` to `github-delivery.ts`, `artifact`, `Inspector.tsx`, `config.ts`, `App.tsx`, `GitHubDelivery`, `ref_node_path`, `PeoplePanel.tsx`, `digest`, `index.tsx`, `agents.ts`, `.emit`, `maintenance/maintenance.ts`, `outbox.ts`, `Store`, `run-accounting.ts`, `approach.ts`, `OfficeScene.tsx`, `Ticket`, `work.ts`, `shared.ts`, `scene-motion.ts`, `http/commands.ts`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **What connects `root`, `folder`, `file` to the rest of the system?**
  _497 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `github-delivery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05322338830584707 - nodes in this community are weakly interconnected._
- **Should `closeout-recovery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08644067796610169 - nodes in this community are weakly interconnected._
- **Should `artifact` be split into smaller, more focused modules?**
  _Cohesion score 0.05813953488372093 - nodes in this community are weakly interconnected._