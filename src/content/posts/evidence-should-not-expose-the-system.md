---
title: "I want proof, not a dump of the machine"
description: "The file reached the vault, the client threw a JSON error anyway, and 'success' stopped being a useful report."
pubDate: 2026-07-05
tags: ["agents", "security", "maintenance"]
---

I do not trust reports that only say "done."

The test that reminded me of this was not subtle. A Seafile Vault bridge smoke test called `write_text_file`, the upload reached the remote vault, and then the client failed with `Extra data: line 1 column 3`.

The annoying part was that the file was already there. The service had returned an HTTP 2xx response, so the upload itself had succeeded, but the response body was not standard JSON. The client treated the body as something it could parse, failed after the upload, and left me with a result that looked broken from the caller side and successful from the storage side.

That is a bad place to stop the report. "Upload failed" would be false. "Upload succeeded" would be too confident without checking the content. Dumping the raw response body into the message would be worse, because service responses are not written for safe archival in a chat or issue.

The fix was narrower than the confusion. For upload calls, HTTP 2xx is accepted as success. If the body is JSON, the client parses it. If it is not JSON, the client keeps only a bounded safe `response_text` instead of copying the whole thing. Non-2xx responses still fail, and their diagnostics still go through redaction.

After that change, I ran the check I should have cared about most: write, upload, read back. The readback content matched. That did more for my confidence than the original successful status ever could.

I still want proof. I just want the proof to be the fact that answers the question, not a raw transcript of the system that happened to produce it.
