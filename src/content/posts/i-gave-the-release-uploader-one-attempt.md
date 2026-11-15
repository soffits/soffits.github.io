---
title: "I gave the release uploader one attempt"
description: "Checking remote hashes before uploading a release JAR instead of letting the upload step blindly retry after a timeout."
pubDatetime: 2026-09-13
modDatetime: 2026-11-15
tags: ["github-actions", "minecraft"]
---

I set up the release workflow for Mekanism: Extra Modules, a small Minecraft add-on I help maintain, so that a tag publishes the JAR to GitHub, Modrinth and CurseForge without anyone clicking through three upload forms. In that workflow, the Modrinth and CurseForge upload steps are set to `retry-attempts: 1`, while every read step before them is allowed to retry.

That looks backwards, since the steps that matter most get the fewest retries. A read (checking for an existing version, listing project files, downloading an artifact) can be retried after a timeout and nothing changes on the other end. An upload can't. Modrinth or CurseForge can accept and store the JAR and then drop the connection before the GitHub runner sees the response. An uploader that just sends the POST again writes a second time without knowing whether the first one landed.

So a failed upload isn't retried. You rerun the job, and every upload looks before it writes.

On Modrinth, the job looks up the exact mod version first. If it already exists, it compares the published file's SHA-512 with the local release JAR. If they match, the upload is skipped and the job succeeds; if they don't, the run fails.

CurseForge's API has no lookup like that, so the job goes through the project's file list for the exact filename, downloads any match and compares its bytes with the release JAR before it decides to skip, stop or upload.

For GitHub Releases, a rerun checks the release title, the prerelease flag, the JAR and the checksum. That way it can attach a missing asset or finish a draft that got interrupted, without overwriting an existing file that has different bytes.

Modrinth and CurseForge are separate jobs that run after the GitHub Release step, so rerunning one never touches the other. I've used this workflow for 0.1.0-alpha.3 and 0.1.0-beta.1, which published `mekanism_extra_modules-0.1.0-beta.1.jar` (58,724 bytes, SHA-256 `1222863ec5664ccbc5cbb96fa1cc2bf7eb02b667c57e412fb426f41bcbcc430f`) to GitHub, [Modrinth](https://modrinth.com/mod/mekanism-extra-modules/version/CjQvwWFN) and [CurseForge](https://www.curseforge.com/minecraft/mc-mods/mekanism-extra-modules/files/8869997).

If I set this up again for another project, I'd write the look-before-write checks first and the upload calls second. The checks are what make a rerun boring, and boring is what you want from a release job.
