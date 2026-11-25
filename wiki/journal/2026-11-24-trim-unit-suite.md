---
topics: [context-wiki-and-ci]
plans: [2026-11-24-trim-the-office-unit-suite-03daf197c2.md]
issue: 'https://github.com/jfusco/the-office/issues/565'
issues: ['https://github.com/jfusco/the-office/issues/565']
---

# Trim repeated recovery and publication checks

The two recovery matrices now use 13 whole-workflow cases, down from 48. Sixteen direct provider-reader cases cover each missing and malformed field. The remaining workflow cases check what the worker ran, what it preserved, and whether it could proceed.

Synthetic GitHub and session refresh retries advance a test clock. The socket stall still exercises Node's HTTP server, and the startup test checks the timeout advertised by the running Office. Store tests now exercise changed intent identity and concurrent dispatch together.

[Unit suite maintenance issue](https://github.com/JFusco/the-office/issues/565)
