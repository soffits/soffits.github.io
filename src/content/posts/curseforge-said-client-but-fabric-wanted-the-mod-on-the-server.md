---
title: "When AUTO_CURSEFORGE drops a required server mod"
description: "CurseForge tagged Simply Tooltips as client-only, so itzg/minecraft-server stripped it from a Prominence II server even though two other mods depended on it."
pubDate: 2026-09-20
tags: ["minecraft", "docker"]
---

A new Prominence II server under [`itzg/minecraft-server`](https://github.com/itzg/docker-minecraft-server) failed Fabric's dependency check on startup:

```text
Mod 'Simply Swords' (simplyswords) 1.70.2-1.20.1 requires any version of simplytooltips, which is missing!
Mod 'Simply Bows' (simplybows) 0.1.4 requires any version of simplytooltips, which is missing!
```

Simply Tooltips was already in the modpack, but `AUTO_CURSEFORGE` strips files tagged as client-only when building a dedicated server, and CurseForge had [`SimplyTooltips-fabric-0.1.5-1.20.1.jar`](https://www.curseforge.com/minecraft/mc-mods/simply-tooltips/files/8715150) (5,518,319 bytes, SHA-1 `754b2989e11389f99a032b9031e28b90d8f63205`) marked `Client`.

Inside the JAR, `fabric.mod.json` declared support for both sides and registered a common `main` entrypoint alongside `client`:

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

Adding [`CF_FORCE_INCLUDE_MODS=simply-tooltips`](https://github.com/itzg/docker-minecraft-server/blob/94494ed74431d6f68203344cce8860175e9a2bca/docs/types-and-platforms/mod-platforms/auto-curseforge.md#excludeinclude-mods) in [Yggdrasil PR #37](https://github.com/Lumysia/Yggdrasil/pull/37) tells the filter to keep the modpack's existing file for that project rather than skipping it. Because the container saw Prominence II v4.1.0 as already installed, I also ran once with `CF_FORCE_SYNCHRONIZE=true` so it would reconcile the server directory, then removed the flag.
