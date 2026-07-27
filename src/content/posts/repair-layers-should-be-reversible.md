---
title: "My self-heal script became the thing that needed repair"
description: "The script meant to repair Hermes hit PermissionError on an immutable source tree."
pubDate: 2026-06-21
tags: ["agents", "infrastructure", "maintenance"]
---

The self-heal path was supposed to repair Hermes. Instead, it hit `PermissionError` because the target it wanted to edit was no longer writable.

The repair script had made sense when it was written. It patched a Hermes application source tree after detecting a known mismatch. Later, upstream changed. Later still, the application source tree was intentionally root-owned and immutable for the runtime. The old repair expected to edit files it no longer had any business editing.

That failure was useful because it made the wrong assumption impossible to ignore. A repair that mutates upstream source is only comfortable while the upstream tree is writable, unchanged, and still shaped like the repair expects. Once those assumptions stop being true, the repair is not a safety net. It is another stale dependency.

The replacement was a separate Python overlay on `PYTHONPATH`.

That sounds less dramatic than a self-heal script, which is partly the point. The overlay shadows the narrow behavior that needed changing. It has explicit invariants. It has a smoke test. It can be removed without rewriting the application source tree back into a known-good state.

The new repair still helps the runtime start correctly, but it no longer pretends the upstream files belong to it. The overlay can be removed to return to upstream behavior, and the smoke test checks the narrow behavior it is meant to shadow.
