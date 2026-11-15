---
title: "CurseForge said the mod was client-only, and two server mods needed it"
description: "CurseForge tagged Simply Tooltips as client-only, so itzg/minecraft-server stripped it from a Prominence II server even though two other mods depended on it."
pubDatetime: 2026-09-20
modDatetime: 2026-11-15
tags: ["minecraft", "docker"]
---

I was setting up a Prominence II server for someone in my family under [`itzg/minecraft-server`](https://github.com/itzg/docker-minecraft-server), and the first start failed Fabric's dependency check:

```text
Mod 'Simply Swords' (simplyswords) 1.70.2-1.20.1 requires any version of simplytooltips, which is missing!
Mod 'Simply Bows' (simplybows) 0.1.4 requires any version of simplytooltips, which is missing!
```

That looked wrong, because Simply Tooltips is in the modpack. It was missing on purpose. `AUTO_CURSEFORGE` strips files tagged as client-only when it builds a dedicated server, and CurseForge had [`SimplyTooltips-fabric-0.1.5-1.20.1.jar`](https://www.curseforge.com/minecraft/mc-mods/simply-tooltips/files/8715150) (5,518,319 bytes, SHA-1 `754b2989e11389f99a032b9031e28b90d8f63205`) marked `Client`.

So the image did what CurseForge told it to, and the tag was wrong. Inside the JAR, `fabric.mod.json` declares support for both sides and registers a common `main` entrypoint alongside `client`:

```json
{
  "id": "simplytooltips",
  "version": "0.1.5-1.20.1",
  "environment": "*",
  "entrypoints": {
    "main": [
      "net.sweenus.simplytooltips.fabric.SimplyTooltipsFabric"
    ],
    "client": [
      "net.sweenus.simplytooltips.fabric.client.SimplyTooltipsFabricClient"
    ]
  }
}
```

Adding [`CF_FORCE_INCLUDE_MODS=simply-tooltips`](https://github.com/itzg/docker-minecraft-server/blob/94494ed74431d6f68203344cce8860175e9a2bca/docs/types-and-platforms/mod-platforms/auto-curseforge.md#excludeinclude-mods) to the server's environment tells the filter to keep the modpack's file for that project instead of skipping it. The container already saw Prominence II v4.1.0 as installed and wouldn't look at the mods again, so I ran it once with `CF_FORCE_SYNCHRONIZE=true` to reconcile the server directory, then took the flag back out.

I like that the fix is one line in the environment. I like less that it's me overriding CurseForge's metadata for one mod by name. If another mod in the pack carries the same wrong tag, the server will fail the same way, though at least Fabric's error says exactly which mod is missing.
