---
title: "Evidence Should Not Expose the System"
description: "A note on designing agent reports and operational logs so they prove what happened without leaking the authority that made it possible."
pubDate: 2026-07-05
tags: ["agents", "security", "maintenance"]
---

A maintained system needs evidence, but not every piece of evidence belongs in the report.

This becomes visible whenever automation touches an authenticated surface, a private integration, or a fragile external service. The system needs to prove that it did the right thing. It may need to show that a request succeeded, that a page was reachable, that a deployment finished, that a token-bearing path was not accidentally printed, or that a recovery step changed the expected state. The naive version of that proof is to dump everything: headers, responses, cookies, configuration, environment, logs.

That is not transparency. It is exposure.

Operational evidence should be designed as an interface, not treated as whatever happened to be available at the end of a run. A useful report answers the question a maintainer is likely to ask next: did the system reach the intended state, what changed, and where should I look if it did not? It does not need to carry the raw authority that allowed the action to happen.

The distinction is simple but important. A status code can be evidence. A resource name can be evidence. A timestamp, commit, workflow run, deployment URL, or sanitized error class can be evidence. The names of cookies present in a browser context may be evidence. The cookie values are almost never evidence. A checksum can prove an artifact. The secret used to fetch it proves too much.

Agents make this boundary easier to violate because they often explain their work in natural language. A tool call returns a large object, the model summarizes it, and the summary may accidentally inherit more authority than the user needed to see. The leak does not have to be dramatic. It can be a session token in a debug line, a private endpoint in a traceback, a user identifier in a pasted form, or a configuration path that quietly reveals how the system is wired.

The better pattern is evidence minimization.

Before a report is written, the system should decide which facts are sufficient to support the conclusion. If the claim is that an authenticated check succeeded, the report might include the account label, the resulting state, the response class, and whether a known anti-abuse challenge was present. If the claim is that a deployment completed, the report might include the commit, build result, public URL, and HTTP status. If the claim is that a recovery path worked, the report might include the invariant that passed and the local change that remains for review.

This is not secrecy for its own sake. It is maintainability. Reports that avoid raw authority are easier to store, forward, search, and audit. They can be kept in issue threads, build logs, chat transcripts, or run history without turning every archive into a credential liability. They also make failure clearer, because the maintainer sees the shape of the problem instead of a pile of incidental material.

Good evidence design has a few practical rules.

Name the invariant, not just the mechanism. Report what was verified, not every byte used to verify it. Prefer classes of sensitive objects over their values: token present, cookie names observed, credential source configured, secret not printed. Keep raw logs local unless there is a clear reason to extract a sanitized fragment. Treat screenshots, copied forms, and browser output as potentially sensitive by default. And make redaction part of the path, not a cleanup step after the message is already composed.

The goal is not to make systems opaque. A maintainer should still be able to reproduce the run, inspect detailed logs in the right place, and understand why the automation believed it was done. The goal is to separate evidence from authority: enough information to trust the result, not enough information to replay the privilege casually.

For agentic systems, that separation is a design surface. The agent is not only choosing actions. It is choosing which traces become durable, which traces enter human channels, and which traces should expire with the process that needed them.

A good report leaves the system more legible without making it more exposed.
