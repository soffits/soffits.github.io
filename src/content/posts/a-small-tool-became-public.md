---
title: "I put a resource index on GitHub before it felt finished"
description: "The CSV had 1,382 rows, and recrawling all of them just to find no changes had become silly."
pubDate: 2026-04-28
tags: ["projects", "agpl"]
---

I made [`soffits/oogc-resource-index`](https://github.com/soffits/oogc-resource-index) public before there was anything resembling a launch plan.

The reason was less noble than that sounds. I had a CSV that was becoming expensive to regenerate badly. The working dataset had 1,382 resources, and rerunning a full scrape just to discover that nothing important changed was starting to feel silly.

So the private script turned into a Python/uv CLI for spreadsheet-ready OOGC resource indexing. It can crawl incrementally, handle an authenticated download URL path, write CSV or XLSX, and export to Seafile. The download side was the awkward part: browser-shaped enough that I had to keep the implementation honest without publishing credentials or brittle session details.

The test that made the incremental work feel real was deliberately plain. Page 1 had 30 entries. The run found 0 new fids, so it queued 0 updates instead of walking all 1,382 rows again. That is not a launch metric. It is the kind of boring result that means the tool stopped wasting time in the exact place I cared about.

The public repository has an AGPL-3.0 license and tests around the auth downloader, CLI, crawler, parser, dataset import, and incremental behavior. That was enough structure for me to stop treating it like something that had to hide until it became impressive.

It is still a modest utility. I am happier with that than with a private script I keep trusting because I forgot how much hand-checking it needed.
