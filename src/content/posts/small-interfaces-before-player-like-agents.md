---
title: "The NPC broke the log, then tried to break it again"
description: "It broke a spruce log, left the drop on the ground, then retried the now-empty coordinates."
pubDate: 2026-05-10
tags: ["agents", "games", "open-source"]
---

The useful OpenPlayer log was not a triumphant one.

An NPC was asked to make a furnace. It needed wood, so it went after a spruce log. The break action succeeded. Then the inventory delta stayed at none, and a dropped spruce log appeared nearby.

That is already a good failure: the agent changed the world but did not receive the item it needed.

The planner then made it better, or worse, by digging the same coordinates again. The block was already gone, so the result was `block_not_breakable`. After that, it repeated the pattern on the next log instead of picking up the dropped item.

This is why I do not trust broad claims about player-like agents until the tiny actions tell the truth. "Make a furnace" sounds like a planning problem. In this log, it was also an inventory reconciliation problem, a dropped-item perception problem, and a retry-decision problem.

[OpenPlayer](https://github.com/soffits/OpenPlayer) is a public Minecraft mod/API/runtime project, and the tempting story is the big one: companions, NPCs, automation, richer in-world behavior. The log pulls the work back down to the part that actually failed.

The primitive did break the block. The next step failed to act on what that result meant. No amount of ambitious language fixes that missing step.

The next useful surface is not a prettier demo. It is clearer state around the targeted block, the world change, the missing inventory change, the dropped item nearby, and whether retrying the same coordinate is nonsense now.

I like this kind of failure because it leaves less room for pretending. The NPC did not need a grander personality. It needed to notice the spruce log on the ground.
