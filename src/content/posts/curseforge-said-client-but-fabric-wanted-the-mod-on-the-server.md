---
title: "CurseForge said Client, but Fabric wanted the mod on the server"
description: "AUTO_CURSEFORGE dropped Simply Tooltips from a Prominence II server even though two installed mods required it and the JAR declared support for both environments."
pubDate: 2026-09-20
tags: ["minecraft", "docker", "debugging"]
---

A new Prominence II server never made it past Fabric's dependency check:

```text
Mod 'Simply Swords' (simplyswords) 1.70.2-1.20.1 requires any version of simplytooltips, which is missing!
Mod 'Simply Bows' (simplybows) 0.1.4 requires any version of simplytooltips, which is missing!
```

That sounds like a plain missing-mod problem. The confusing part was that Simply Tooltips belonged to the modpack already. The server used `AUTO_CURSEFORGE` from [`itzg/minecraft-server`](https://github.com/itzg/docker-minecraft-server), which removes files marked as client-only when it prepares a dedicated server. CurseForge had marked the exact Fabric 1.20.1 file as `Client`, so the filter left it out.

Usually that is the right call. A dedicated server has no use for rendering, keybinding, or screen mods. I did not want to defeat the filter just because two other mods complained.

I downloaded [`SimplyTooltips-fabric-0.1.5-1.20.1.jar`](https://www.curseforge.com/minecraft/mc-mods/simply-tooltips/files/8715150) and checked the file itself. It was 5,518,319 bytes, and its SHA-1 matched the value from CurseForge: `754b2989e11389f99a032b9031e28b90d8f63205`.

Its `fabric.mod.json` disagreed with the marketplace label:

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

`"environment": "*"` allows the mod in both client and server environments. The JAR also has a common `main` entrypoint in addition to its client entrypoint. CurseForge called the file client-only; the file itself and the installed dependency graph said the server needed it.

The persistent fix in [Yggdrasil PR #37](https://github.com/Lumysia/Yggdrasil/pull/37) was one line:

```text
CF_FORCE_INCLUDE_MODS=simply-tooltips
```

This override does not fetch some unrelated latest version. [`CF_FORCE_INCLUDE_MODS`](https://github.com/itzg/docker-minecraft-server/blob/94494ed74431d6f68203344cce8860175e9a2bca/docs/types-and-platforms/mod-platforms/auto-curseforge.md#excludeinclude-mods) tells the server-pack filter to retain a project that the modpack already includes.

The existing installation added one more wrinkle. Its startup log said the requested Prominence II v4.1.0 pack was already installed, so changing the include rule alone would not rebuild the server files. I temporarily enabled `CF_FORCE_SYNCHRONIZE=true` for one reconciliation, then removed it instead of keeping a repair switch in the normal config.

The `Client` tag was a good reason to stop and inspect the file, but not a good reason to keep deleting it after that inspection. The config now preserves only the `simply-tooltips` slug. If a future JAR changes its own environment metadata, that exception will need another look.
