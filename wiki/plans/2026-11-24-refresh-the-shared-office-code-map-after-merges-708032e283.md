---
status: "implemented"
executed: true
evidence: ["https://github.com/JFusco/the-office/issues/573 and .github/workflows/graphify-refresh.yml"]
source_tool: "repository"
source: "/private/tmp/office-graphify-auto.hSFkgl/automatic-office-graphify-refresh.md"
topics: ["context-wiki-and-ci"]
digest: "708032e283b37ada30811196ad5a02e2b4d8e3b48a270854e3835789b3b4c69f"
---

# Refresh the shared Office code map after merges

Compare the mapped source revision to the latest GitHub main after updates to that branch. Use pinned Graphify code extraction and stage only the approved tracked artifacts. Publish the generated changes through a dedicated bot PR. Require Quality, commit lint, and Wiki integrity on the exact generated head before merging. Preserve the local hooks for working-copy previews and expose a manual retry.
