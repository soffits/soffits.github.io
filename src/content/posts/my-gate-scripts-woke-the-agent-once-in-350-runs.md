---
title: "My gate scripts woke the agent once in 350 runs"
description: "How gated jobs in dsh-cron-jobs work, what the run history says about seven frequent checks, and the daily job I gated for no reason."
pubDatetime: 2026-11-27
tags: ["dsh", "cron", "agents"]
---

DeepSeek Harness has a built-in Schedule that sends a prompt to an agent session at every tick. Every tick is a model turn, even when the task is "check whether the backup is stale" and the answer is no for the 49th time in a row. I wanted a cheap script to look first and wake the agent only when it found something, so I wrote [dsh-cron-jobs](https://github.com/soffits/dsh-cron-jobs).

Here's what that looks like in my own run history. I have seven gated jobs that fire every 5 to 60 minutes: a backup check, a host health check, and a few watchers for things I'm waiting on. The plugin keeps the last 50 runs of each job, so that's 350 runs, from the last 4 hours of the 5-minute job to the last two days of the hourly ones. 349 of them ended with the gate saying there was nothing to do. One woke the agent, when a backup run failed. The gates themselves took a median of 0.8 seconds, with the slowest at 18.

## How a gated job works

A job has a command and an agent prompt. The command runs first, and the agent is woken only when the output asks for it:

- A command that fails (non-zero exit, timeout, can't start) wakes nothing, and a failure note goes to the job's delivery target instead.
- Empty output wakes nothing.
- A last line of `{"wakeAgent": false}` wakes nothing. I took that convention from the cron gates in Hermes Agent, which I used before DSH, so my old scripts kept working.
- Anything else wakes the agent, and the script's output goes into the prompt.

A gate can be as small as this:

```sh
#!/usr/bin/env bash
count=$(gh issue list --label needs-triage --json number --jq length)
if [ "$count" -eq 0 ]; then
  echo '{"wakeAgent": false}'
  exit 0
fi
gh issue list --label needs-triage
```

If the agent's final answer is empty or ends in `[SILENT]`, nothing is delivered either, so a check that looked and found nothing stays quiet.

## Where I overdid it

When I moved my jobs over on November 6 I got into the habit of writing a gate for every new check. On November 9 I wrote one for a check that runs once a day: has any plugin got a new release. I gave it a memory of what it had already reported, and a rule to remind me again after seven days.

That saved nothing. One model turn a day isn't what I'm trying to cut, and now I had a script to maintain that could keep a half-fixed problem quiet for a week. I've written about this failure before: a [reminder that stayed silent for five weeks](/blog/the-reminder-only-worked-when-cron-was-on-time/), because empty output was a normal result for it. A gate has the same trap. "Nothing to do" and "the gate is wrong" look identical from outside.

The hourly check-in I started with was the other case. Its gate said wake in 32 of the 50 runs the plugin still had from those days, so it filtered out about a third of them and added a script. It runs four times a day now, with no gate.

The rule I use now: gate a job only if it runs often and is quiet nearly every time. If it matters, or runs rarely, let the agent look.

## What I didn't measure

The 350 runs are a window, not a long study, and the plugin's history can't give me more. I also haven't measured what one woken session costs me in tokens, so I won't give a dollar figure for what the gates saved. What I can say is how often a model turn would have started and found nothing.

If the source can push, a gate is the wrong tool anyway. A script or a mailbox watcher can emit an event with `dsh-cron-event`, and the job runs only when something arrives, with no polling at all. I moved the ones that could.

The plugin is on npm as `@soffits/dsh-cron-jobs` and the source is at [soffits/dsh-cron-jobs](https://github.com/soffits/dsh-cron-jobs).
