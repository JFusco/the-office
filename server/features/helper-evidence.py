"""Read-only protocol adapter for the installed review helper. No model dispatch."""
import importlib.util
import json
from pathlib import Path
import sys

sys.dont_write_bytecode = True
helper, run, baseline = map(Path, sys.argv[1:4])
spec = importlib.util.spec_from_file_location("office_review_helper", helper)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
with module.project_lock(baseline.resolve()):
    state = module.read_json(run / "state.json")
    module.require_current_protocol(state)
    if (state.get("mode"), state.get("schema_version"), state.get("plan_protocol_version"), state.get("research_contract_version")) != ("plan", 3, 2, 1):
        raise ValueError("Unsupported plan review protocol")
    if Path(state["project"]).resolve() != baseline.resolve() or state["run_id"] != run.name:
        raise ValueError("Review belongs to another baseline or run")
    module.assert_fresh(state)
    research = module.accepted_research(state)
    parent = None
    terminal = None
    for entry in state["ledger"]:
        artifact_id = entry["artifact_id"]
        if not artifact_id.startswith("revision-") or "/" in artifact_id:
            raise ValueError("Invalid ledger artifact")
        artifact = module.read_json(run / "artifacts" / (artifact_id + ".json"))
        if artifact["run_id"] != state["run_id"] or artifact["parent_artifact_id"] != parent:
            raise ValueError("Broken review ledger")
        for key in ("stage", "target_before", "target_after", "handoff_revision"):
            if artifact[key] != entry[key]:
                raise ValueError("Review ledger differs from accepted artifact")
        parent = artifact_id
        terminal = artifact
    complete = state["status"] == "complete"
    if complete:
        if not research or not terminal or not module.complete_findings(state):
            raise ValueError("Review has unresolved findings or missing research")
        if terminal["target_after"] != state["target_fingerprint"] or terminal["findings"] != state["findings"]:
            raise ValueError("Terminal artifact differs from current review")
        if module.digest(terminal["target"]) != state["target_fingerprint"]:
            raise ValueError("Terminal target fingerprint mismatch")
    print(json.dumps({
        "run": str(run), "status": state["status"], "stage": state["stage"],
        "handoff": (run / "handoff.md").read_text() if (run / "handoff.md").exists() else "",
        "lockPath": str(module.LOCK_ROOT / f"agent-review-locks-{module.os.getuid()}" / (module.digest(str(baseline.resolve())) + ".lock")),
        "revision": state["handoff_revision"], "fingerprint": state["target_fingerprint"],
        "researchDigest": (state.get("research") or {}).get("digest", ""),
        "timeout": state["timeout"], "profiles": state["agent_profile"],
        "fallbacks": state.get("agent_fallbacks", {}),
        "error": state.get("error") or "",
        "findings": state["findings"],
        "plan": terminal["target"]["plan"] if complete else "",
        "artifact": str(run / "artifacts" / (parent + ".json")) if complete else ""
    }))
