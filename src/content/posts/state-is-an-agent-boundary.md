---
title: "The restart was clean. The amnesia wasn't"
description: "Why I keep dull JSON state files beside scheduled jobs instead of deleting them as clutter."
pubDate: 2026-06-14
tags: ["agents", "security", "infrastructure"]
---

A clean restart can still be a bad operational event.

The process comes back. The service manager is happy. No stack trace survives. Then a scheduled tool behaves as if yesterday never happened.

The files that prevent this are not impressive. In my scheduled jobs they are usually little JSON records beside the runner: a dedupe key, `last_success`, the previous output after normalization, and a retry count with an expiry. They look like debris from a script that should have been cleaner.

I am tempted to delete them whenever I am tidying a directory. Config has a visible purpose. Logs at least look like records. State files sit in the middle, too current to archive and too plain to feel designed.

But removing them changes the behavior after a restart. The job no longer knows which alert it already sent. It cannot tell whether the last output is genuinely new or only new to this fresh process. A retry that was supposed to expire can become eligible again because the counter vanished with the old runtime.

I do not want these tools to remember everything. I only want them to remember the few facts that keep the next run from annoying me or touching stale work. The JSON file is boring. Duplicate alerts are worse.
