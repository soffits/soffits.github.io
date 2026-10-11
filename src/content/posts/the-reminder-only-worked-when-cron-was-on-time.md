---
title: "The reminder only worked when cron was on time"
description: "A payment reminder compared the clock to 09:00 with an equals sign. The scheduler started it a few minutes late for five weeks, and every run looked like a quiet day."
pubDate: 2026-10-11
tags: ["automation", "cron", "debugging"]
---

A small script sends reminders for recurring payments and renewals. Each entry has a start date, a repeat interval and a time of day, usually `09:00`. A cron job runs the script at 09:00, and the script prints the entries that are due. If it prints nothing, nothing gets sent.

This was the check:

```python
if today < start or current_time != event["time"]:
    return False
```

`current_time` was the wall clock formatted as `HH:MM`. So an entry was due only if the script happened to run during the minute 09:00.

For the first few days of September it did. The runs on September 1, 2 and 3 started at 09:00:33, 09:00:59 and 09:00:34, and reminders went out on the 2nd and 3rd. From September 4 on, the scheduler started the job later: 09:07, 09:11, 09:16, a few times 09:31. I looked at all 37 runs from September 4 to October 10, and none started at 09:00. Every one of them logged the same status:

```text
Status: silent (empty output)
```

That status is what a day with nothing due looks like, and it is also what a broken comparison looks like. When I replayed the old logic over those dates, the script's own list said eight 9:00 reminders should have gone out, three of them on the same morning. None did. The 15:00 job used the same comparison and missed its one entry too; its recent runs started between 15:05 and 15:18.

I find this one a little embarrassing because I had already written about [wanting quiet maintenance runs](/blog/silence-is-part-of-the-interface/). I still want that. But that wrapper was quiet when the expected state held, and it still kept its run history. A reminder that only speaks when something is due can't tell "nothing today" apart from "I missed it", so five weeks of silence looked like five weeks of nothing to do.

I didn't find out why the scheduler started drifting after September 3. For a reminder it shouldn't matter, so I fixed the comparison instead of the timing. An entry is now due once its time has passed that day, and a small state file records which titles were already sent today:

```python
if today < start or current_time < event["time"]:
    return False
```

```python
sent = set(state.get(today.isoformat(), []))
due = [e for e in EVENTS if is_due(e, today, current_time) and e["title"] not in sent]
```

The three separate jobs for 08:30, 09:00 and 15:00 became one job that runs at :00 and :30 during the 8, 9 and 15 o'clock hours. A late run still catches the item, and the next run doesn't repeat it. I added tests for those two cases and for an afternoon item that should wait until 15:00.

Two gaps remain. If every run on a day fails, the entry is still lost, because the state only looks at today. The script also writes the state file before it prints, so if delivery breaks after that, the item is marked as sent without being sent. Both are less likely than a cron job starting a few minutes late, which had been happening every day for five weeks.
