---
title: "Idempotent Modrinth and CurseForge uploads in GitHub Actions"
description: "Checking remote hashes before uploading a release JAR instead of letting the upload step blindly retry after a timeout."
pubDate: 2026-09-13
tags: ["github-actions", "minecraft"]
---

In the [release workflow for Mekanism: Extra Modules](https://github.com/Lumysia/mekanism-extra-modules/blob/caaac8b975b814f285007facdff951ae3672561a/.github/workflows/release.yml), both the Modrinth and CurseForge upload steps set `retry-attempts: 1` while all the read steps before them are allowed to retry.

Read calls (checking an existing version, listing project files, or downloading an artifact) can retry after a timeout without changing anything on the remote service. Uploads are different: Modrinth or CurseForge can accept and store the JAR, then drop the connection before the GitHub runner sees the response. If the uploader immediately retries the POST, it sends a duplicate write without checking whether the first one landed.

Instead, recovery happens by rerunning the job and reading first:

- **Modrinth**: the job looks up the exact mod version before uploading. If it already exists, it compares the published file's SHA-512 against the local release JAR. A match skips the upload and succeeds; a mismatch fails the run.
- **CurseForge**: since the API does not offer the same version lookup, the job walks the project's file list for the exact filename, downloads any match, and compares its bytes with the release JAR before deciding whether to skip, stop, or upload.
- **GitHub Releases**: a rerun checks the release title, prerelease flag, JAR, and checksum so it can attach a missing asset or finish publishing an interrupted draft without overwriting an existing file with different bytes.

Modrinth and CurseForge run in separate jobs after the GitHub Release step, so rerunning one marketplace never touches the other. I ran this workflow for [0.1.0-alpha.3](https://github.com/Lumysia/mekanism-extra-modules/releases/tag/v1.21.1-0.1.0-alpha.3) and [0.1.0-beta.1](https://github.com/Lumysia/mekanism-extra-modules/releases/tag/v1.21.1-0.1.0-beta.1), which published `mekanism_extra_modules-0.1.0-beta.1.jar` (58,724 bytes, SHA-256 `1222863ec5664ccbc5cbb96fa1cc2bf7eb02b667c57e412fb426f41bcbcc430f`) to [GitHub](https://github.com/Lumysia/mekanism-extra-modules/releases/tag/v1.21.1-0.1.0-beta.1), [Modrinth](https://modrinth.com/mod/mekanism-extra-modules/version/CjQvwWFN), and [CurseForge](https://www.curseforge.com/minecraft/mc-mods/mekanism-extra-modules/files/8869997).
