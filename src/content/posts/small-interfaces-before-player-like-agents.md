---
title: "OpenPlayer broke the spruce log and tried to mine the air"
description: "In an OpenPlayer furnace test, the NPC mined a spruce log, left the item on the ground, and kept digging the empty coordinates."
pubDatetime: 2026-05-10
modDatetime: 2026-11-15
tags: ["minecraft", "open-source"]
---

I asked an NPC in [OpenPlayer](https://github.com/soffits/OpenPlayer), my Minecraft mod that adds AI companions as player-shaped NPCs, to craft a furnace and throw it to me. It needed wood, so it walked over to a spruce log and broke the block. The log dropped on the ground next to it, its inventory stayed empty, and the planner sent it straight back to mine the same coordinates. That got `block_not_breakable`, and then it went off to chop the next log instead of picking up the one at its feet.

Reading the run log was funny, because every single action had worked. The dig succeeded. What the planner saw after it was only "the dig succeeded", so it had no way to know that the block was gone, that its inventory delta was zero, or that a spruce log item was lying a block away. From where it stood, mining that spot again was a reasonable next step.

The fix went in the next morning ([`852b955`](https://github.com/soffits/OpenPlayer/commit/852b955b19b481698c7806957e16762c1cc6fc85)). The planner session now keeps a small record of what its breaks did. A block it already broke, or one that came back unbreakable, is rejected if the planner picks it again (`stale_break_target`). A break that produced a nearby drop but no inventory gain leaves a pending item, and until it's picked up, more digging is rejected with a message telling the planner to call `pickup_items_nearby` for that item. The same hint goes into the next prompt.

I'd have liked the model to work this out on its own. But a model told "success" will believe it, and a few lines of bookkeeping were cheaper than hoping it would notice a log on the ground.
