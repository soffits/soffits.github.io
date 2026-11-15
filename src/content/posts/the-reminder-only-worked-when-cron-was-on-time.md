---
title: "Small bugs I ran into recently"
description: "A cron reminder that checked for the exact minute, a 133-byte Git LFS pointer that pickle read as opcode 118, and a busy Defender scan."
pubDatetime: 2026-10-11
tags: ["debugging", "python", "ops"]
---

Three small bugs from the last couple of months. None of them needs a whole post.

**A reminder script that only worked at 09:00 sharp.** I have a small script that checks recurring payment dates and prints anything due at `09:00`. It used `if today < start or current_time != event["time"]: return False`, where `current_time` was `HH:MM`. From September 1 to 3 the job started at `09:00` and everything worked. From September 4 to October 10 (37 runs) the scheduler started it a few minutes late (`09:07`, `09:11`, `09:16`), so the script printed nothing and logged `Status: silent (empty output)`. It missed eight 9:00 reminders and one 15:00 reminder that way. It now checks `current_time < event["time"]` and records today's sent titles in a small JSON file so late runs still fire once.

**`KeyError: 118` from a 133-byte model file.** On a fresh clone of `arxiv-topic-classifier`, `uv sync --locked` installed all 69 packages without complaint, and then `uv run arxiv-classifier smoke` died straight away inside `joblib.load` with `KeyError: 118`. `models/arxiv_topic_pipeline.joblib` was 133 bytes. I'd skipped `git lfs pull`, so pickle was reading the LFS pointer text `version https://git-lfs.github.com/spec/v1` and choked on the first byte (`v` is ASCII 118). `git lfs pull` fetched the real 36 MB file (`9dbb9ebe...`) and the smoke check passed. I still want a quick header check in `model.py` that tells you to run `git lfs pull` instead of throwing a pickle opcode error.

**A winget failure caused by another Defender scan.** When AionUi Community 2.1.60 went to `winget-pkgs`, the x64 and ARM64 installers both went through cleanly and passed the static scan, but installation validation failed. In the validation logs, Microsoft Defender's signature update returned `0x80070652` and its full scan returned `0x8050111c`, which means another scan was already running. A second look at the logs also showed the x64 runner starting the internal helper `aioncore.exe` directly, without the data-directory argument the main app passes. A maintainer reran the validation job and the PR merged with exactly the same installer hashes.
