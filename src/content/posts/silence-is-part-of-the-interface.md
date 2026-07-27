---
title: "The best maintenance run printed nothing"
description: "A maintenance wrapper finished with rc=0 and no output, which was exactly the point."
pubDate: 2026-06-07
tags: ["agents", "automation", "interfaces"]
---

`rc=0 elapsed=42s stdout_bytes=0 stderr_bytes=0`.

That was the whole result from a deterministic maintenance wrapper, and the best part was that no chat notification arrived.

The empty output was not a missing log. The local run history kept the detail I would need if I went looking for it. The wrapper's job was different: let actionable changes through, let serious failures through, and leave the human channel alone when the expected state stayed expected.

I have made noisier versions of this, and they age badly. A watchdog that says "all good" every time it runs is asking to be muted mentally before it has anything useful to report. The daily proof of nothing becomes part of the room tone. Then the one line that should interrupt me has to fight the habit created by all the previous lines.

For this run, the numbers were enough. Exit zero. Forty-two seconds. No stdout. No stderr. If I needed the detail, it was still on the machine that produced it.

That is the version I trust more: a wrapper that can prove it ran without making me read proof every morning.
