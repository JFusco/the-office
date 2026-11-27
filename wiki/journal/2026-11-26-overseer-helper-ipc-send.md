---
topics: [releases-and-incidents]
plans: [2026-11-26-fix-the-overseer-helper-s-failed-ipc-send-for-jfusco-the-office-711-8d09b56b3b.md]
issue: 'https://github.com/jfusco/the-office/issues/711'
issues: ['https://github.com/jfusco/the-office/issues/711']
---

# Overseer helper survives a failed send to its launcher

The launcher test "a launcher that dies while its stop waits out TERM leaves the helper to escalate" failed three times: once locally in phase 7c, and twice on hosted CI on the same head. Each time, the helper or its TERM-resistant grandchild was still there after 25 seconds. Main itself passed on identical code.

The cause found is in the launcher's helper, not the test. The helper's `send` checked `process.connected` and caught synchronous errors. But Node reports a write that fails on a closing channel later, as an `error` event on the process, and nothing listened for it. A launcher dying just as the helper sent its exit report could therefore crash the helper before its `disconnect` cleanup sent KILL. In production that would leave a pass's group running, the very case the helper exists for.

The test's timing makes this race likely. It kills the launcher one second after TERM, and the helper's exit report goes out when its one-second drain ends.

That this race explains the historical failures is the supported hypothesis, not an observation: their logs do not say which process survived. Load never reproduced the failure locally. An isolated probe did crash with an uncaught `EPIPE` without the callback, and never with it.

The fix passes a callback to `process.send`, so the failure goes to the callback. A deterministic test now fails the helper's exit report the way Node does. Without the callback, the helper ends with code 1 and leaves the grandchild alive; with it, the helper stops its group once disconnected. The original test now records which process outlived its window, should it ever recur.

[Issue #711](https://github.com/JFusco/the-office/issues/711)
