# Session evidence and ownership

Assistant transcripts supply evidence for recovery and coordination. A session's identity, project association, and observed state determine what the Office can infer about its work. A failed or incomplete capture cannot establish ownership or justify repeating a provider write.

Claude capture and Codex capture share a bounded evidence policy. The Codex reader reuses a parsed checkpoint only after validating the prior bytes. The point-in-time snapshot, incremental parser, and diagnostic receipts were separate changes with distinct evidence.

## Evidence

- [Session awareness](../../docs/session-awareness.md) and [worker lifecycle diagnostics](../../docs/worker-lifecycle-diagnostics.md)
- [Session ownership](https://github.com/JFusco/the-office/pull/21), [point-in-time capture](https://github.com/JFusco/the-office/pull/185), and [incremental capture](https://github.com/JFusco/the-office/pull/196)
