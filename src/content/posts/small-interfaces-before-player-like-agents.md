---
title: "Small Interfaces Before Player-Like Agents"
description: "A note on building agentic game companions from bounded primitives, visible state, and honest failure modes."
pubDate: 2026-05-10
tags: ["agents", "games", "open-source"]
---

A player-like agent is not one large behavior. It is many small interfaces learning to tell the truth.

That has become the useful lesson in `OpenPlayer`, an open AGPL Minecraft companion runtime. The tempting description is always broad: local companions, NPCs, planning, automation, and a path toward richer in-world behavior. The safer architecture starts much smaller. Can an entity move to a loaded position? Can it notice nearby items? Can it report why a primitive is still running, blocked, or complete? Can a planner ask for work without pretending the world is more available than it is?

Those questions sound modest, but they are the difference between an agent that performs confidence and an agent that can be maintained. Movement policy caps, structured world perception, resource planning foundations, runtime telemetry, planner progress, and localized status strings are not glamour features. They are the surfaces that make larger behavior inspectable.

The public shape of the work is also important. `OpenPlayer` is deliberately local-first and legally clean. It does not need to inherit opaque runtime assumptions or copy another implementation to be useful. It can grow by naming capabilities clearly, keeping primitive execution bounded, and removing internal designs that no longer match the real path through the code.

That makes the project feel less like a promise of a finished autonomous character and more like a careful runtime becoming legible. The meaningful progress is not that an agent can be described in ambitious language. It is that each small action has a boundary, a status, and a place to be reviewed.

For now, that is the right kind of foundation: quiet, inspectable, and resistant to fake success.
