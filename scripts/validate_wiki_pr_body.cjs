"use strict";

const { execFileSync } = require("node:child_process");
const { readFileSync } = require("node:fs");

const counts = "Processed (\\d+) merged PRs: (\\d+) changed, (\\d+) unchanged, 0 errors\\.";
const maintenanceBodies = new Map([
  ["docs(wiki): reconcile missed merges", new RegExp("^Automated, reviewable batch wiki reconciliation\\. " + counts + "$")],
  ["docs(wiki): weekly issue and merge reconciliation", new RegExp("^Automated, reviewable weekly refresh of cited issue state and missed merge reconciliation\\. " + counts + "$")],
]);

function matchesMaintenanceBody(title, body) {
  const match = maintenanceBodies.get(title)?.exec(body);
  if (!match) return false;

  const [, processed, changed, unchanged] = match;
  return BigInt(processed) === BigInt(changed) + BigInt(unchanged);
}

function hasCanonicalWikiBody(event, changedPaths) {
  const pull = event?.pull_request;
  const repository = event?.repository?.full_name;
  if (!repository || pull?.base?.ref !== "main" || pull.head?.repo?.full_name !== repository
    || pull.user?.id !== 486049 || pull.user.login !== "JFusco") return false;
  if (typeof pull.body !== "string" || typeof pull.head.ref !== "string") return false;

  const body = pull.body.trim().replace(/\r?\n\r?\nCloses #[1-9]\d*$/, "");
  const parent = /^bot\/wiki-sync\/([1-9]\d*)$/.exec(pull.head.ref)?.[1];
  const matches = parent
    ? pull.title === "docs(wiki): reconcile PR #" + parent
      && body === "Automated, reviewable wiki reconciliation for merged PR #" + parent + "."
    : pull.head.ref === "bot/wiki-maintenance" && matchesMaintenanceBody(pull.title, body);
  if (!matches) return false;

  const base = pull.base.sha;
  const head = pull.head.sha;
  if (!/^[0-9a-f]{40}$/.test(base) || !/^[0-9a-f]{40}$/.test(head)) return false;
  const files = changedPaths(base, head);
  return files.length > 0 && files.every(file => file === "scripts/wiki/graph/data/graph.json"
    || /^wiki\/.+\.md$/.test(file));
}

function listChangedPaths(base, head) {
  return execFileSync("git", ["diff", "--name-only", "--no-renames", "-z", base + "..." + head], { encoding: "utf8" })
    .split("\0").filter(Boolean);
}

if (require.main === module) {
  try {
    const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
    if (hasCanonicalWikiBody(event, listChangedPaths)) console.log("PASS canonical wiki pull request body and scope");
    else process.exitCode = 1;
  } catch (error) {
    console.error("Unable to verify the wiki pull request scope: " + error.message);
    process.exitCode = 1;
  }
}

module.exports = { hasCanonicalWikiBody };
