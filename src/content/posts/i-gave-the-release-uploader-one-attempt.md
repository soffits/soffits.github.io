---
title: "I gave the release uploader one attempt"
description: "An upload can succeed remotely after the client times out, so my Modrinth and CurseForge jobs retry by reading first."
pubDate: 2026-09-13
tags: ["automation", "releases", "reliability"]
---

One setting in the new release workflow for [Mekanism: Extra Modules](https://github.com/Lumysia/mekanism-extra-modules) looks like a typo:

```yaml
retry-attempts: 1
```

It appears twice, once for Modrinth and once for CurseForge. I put it there on purpose.

Most network reads in the workflow do retry. Looking up an existing version, listing project files, or downloading an artifact can survive a timeout without changing anything. An upload is different. The platform can accept and store the JAR, then lose the response before the GitHub runner receives it. From the runner's side, that looks like failure. A blind retry sends the same write again without first finding out whether the first one worked.

I wanted recovery to happen in a fresh job run, after another read.

Before uploading to Modrinth, the job looks for the exact mod version. If it exists, the job compares the published file's SHA-512 with the JAR from the release bundle. A match counts as recovered and skips the upload. A different file under the same version stops the job.

CurseForge does not expose the same lookup shape, so that check is more awkward. The job walks the project's file pages for the exact filename, downloads the match, and compares its bytes with the release JAR. Again, identical means done; different means stop. If the file is absent, the job gets its one upload attempt.

The [GitHub Release path](https://github.com/Lumysia/mekanism-extra-modules/blob/caaac8b975b814f285007facdff951ae3672561a/.github/workflows/release.yml) follows the same rule in more detail. A rerun verifies the release title, prerelease flag, JAR, and checksum. It can add a missing asset or publish an interrupted matching draft, but it will not quietly replace an asset with different bytes.

The three destinations also get separate jobs. Modrinth and CurseForge both wait for the GitHub Release, but neither waits for the other. If one fails, retrying it does not need to republish the destination that already succeeded. Each successful marketplace upload records a commit status tied to the release tag, while the next run still checks the marketplace itself rather than trusting that receipt.

I used the workflow for [0.1.0-alpha.3](https://github.com/Lumysia/mekanism-extra-modules/releases/tag/v1.21.1-0.1.0-alpha.3), then for [0.1.0-beta.1](https://github.com/Lumysia/mekanism-extra-modules/releases/tag/v1.21.1-0.1.0-beta.1). The beta run published `mekanism_extra_modules-0.1.0-beta.1.jar` to [GitHub](https://github.com/Lumysia/mekanism-extra-modules/releases/tag/v1.21.1-0.1.0-beta.1), [Modrinth](https://modrinth.com/mod/mekanism-extra-modules/version/CjQvwWFN), and [CurseForge](https://www.curseforge.com/minecraft/mc-mods/mekanism-extra-modules/files/8869997). I downloaded all three copies afterward. Each was 58,724 bytes, with SHA-256 `1222863ec5664ccbc5cbb96fa1cc2bf7eb02b667c57e412fb426f41bcbcc430f`.

That confirms the normal path produced the same artifact everywhere. It does not prove the recovery branch under a real half-failed upload; I have not caused a production upload to time out just to exercise it.

If a marketplace does time out, I want the next run to ask what happened before it acts. Three automatic upload attempts would only make the uncertainty more expensive.
