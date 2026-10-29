---
title: "OpenPlayer broke the spruce log and tried to mine the air"
description: "In an OpenPlayer furnace test, the NPC mined a spruce log, left the item on the ground, and kept digging the empty coordinates."
pubDate: 2026-05-10
tags: ["minecraft", "open-source"]
---

I asked an NPC in [OpenPlayer](https://github.com/soffits/OpenPlayer) to craft a furnace. It needed wood, walked over to a spruce log, and broke the block. Its inventory stayed empty while the dropped log sat on the ground next to it, and the planner immediately tried to mine the same coordinates again—getting back `block_not_breakable` before moving on to chop the next log instead of picking up the drop.

The block-breaking action itself worked fine, which made the failure funny to read in the run log. The planner only checked whether the dig action succeeded; it did not see that the target coordinates were now empty, that its inventory delta was still zero, or that a dropped spruce log was sitting right there. Passing those details back after each action is the next thing to fix.
