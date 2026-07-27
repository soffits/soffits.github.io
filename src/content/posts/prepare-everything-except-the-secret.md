---
title: "The setup script worked until it met root"
description: "An iCloud integration installer separated credentials well, then hid the failing command and created files for the wrong owner."
pubDate: 2026-07-19
tags: ["security", "automation", "maintenance"]
---

I still like the shape of the iCloud integration setup: prepare everything reproducible, then ask for the app-specific credential only at the narrow local step.

The script got far enough to prove that shape was not imaginary. It verified the credential helper. It listed folders through Himalaya. It kept the real credential out of the general setup path.

Then `vdirsyncer discover` failed, and my installer made that failure harder to debug than it needed to be.

The stage output was redirected, so the command that mattered did not show the underlying error in the place I was looking. Even worse, the setup had also been run as root. That created root-owned credential, config, and calendar paths that the normal service user could not access.

So the problem was not "separate authorization from preparation." That part was right. The problem was that my preparation step was too pleased with itself and not strict enough about who was running it.

An installer like this needs to fail loudly on the boring details. It should refuse or clearly handle root execution when the service user should own the files, show the failing stage output when a verification command exits nonzero, and check ownership before pretending a generated path is usable. The credential entry can stay narrow without making every other error opaque.

The embarrassing part is that the credential handling was better designed than the failed run was to debug.

I still want integrations to reach "everything except the credential is ready" before any real authority is entered. The installer needs to stop before creating a root-owned trap, and it needs to show the line that explains why discovery failed.
