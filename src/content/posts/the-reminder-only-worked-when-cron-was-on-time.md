---
title: "A reminder that only fired at 09:00 sharp, and two other small bugs"
description: "A cron reminder that checked for the exact minute, a 133-byte Git LFS pointer that pickle read as opcode 118, and a busy Defender scan."
pubDatetime: 2026-10-11
modDatetime: 2026-11-15
tags: ["debugging", "python", "ops"]
---

A payment reminder of mine went silent for five weeks and never once reported an error. It's one of three small bugs from the last couple of months, none of which needs a post of its own.

## The reminder that needed the scheduler to be on time

The script checks recurring payment dates and prints anything due at `09:00`. It used `if today < start or current_time != event["time"]: return False`, where `current_time` was `HH:MM`. From September 1 to 3 the job started at `09:00` and everything worked. From September 4 to October 10 (37 runs) the scheduler started it a few minutes late (`09:07`, `09:11`, `09:16`), so the script printed nothing and the job logged `Status: silent (empty output)`.

Silent output was a normal result for that job, since most days nothing is due. That's why it looked fine for so long. It missed eight 9:00 reminders and one 15:00 reminder that way. It now checks `current_time < event["time"]` and records the titles it has sent today in a small JSON file, so a late run still fires once.

## `KeyError: 118` from a 133-byte model file

On a fresh clone of `arxiv-topic-classifier`, `uv sync --locked` installed all 69 packages without complaint, and then `uv run arxiv-classifier smoke` died straight away inside `joblib.load` with `KeyError: 118`. `models/arxiv_topic_pipeline.joblib` was 133 bytes.

I'd skipped `git lfs pull`, which is entirely on me. Pickle was reading the LFS pointer text `version https://git-lfs.github.com/spec/v1` and choked on the first byte (`v` is ASCII 118). `git lfs pull` fetched the real 36 MB file (`9dbb9ebe...`) and the smoke check passed. I still want a quick header check in `model.py` that tells you to run `git lfs pull` instead of throwing a pickle opcode error.

## A winget failure caused by a Defender scan already running

When AionUi Community 2.1.60 went to `winget-pkgs`, the x64 and ARM64 installers both went through and passed the static scan, but installation validation failed. I went through the validation logs. Microsoft Defender's signature update returned `0x80070652` and its full scan returned `0x8050111c`, which means another scan was already running.

On a second read the logs also showed the x64 runner starting the internal helper `aioncore.exe` directly, without the data-directory argument the main app passes. A maintainer reran the validation job and the PR merged with exactly the same installer hashes, so there was nothing for me to fix, which was a relief and also a little unsatisfying.
