---
title: "Three transfer bugs in seafile-vault-cli"
description: "Streaming to disk still hit a 1 MiB in-memory read cap, streaming uploads hit a 100 MB proxy limit, and a 2xx upload crashed on non-JSON output."
pubDatetime: 2026-08-16
tags: ["python", "open-source"]
---

[Seafile Vault CLI](https://github.com/soffits/seafile-vault-cli) is how my scripts read and write files on my own Seafile server. I hit three bugs in its file transfers, and in each one the code was careful about one thing and then tripped over a limit right next to it.

The funniest was in downloads. `download_file_path` streamed a remote file into a temporary file with mode `0600`, calculated its SHA-256 while writing, synced it to disk, and moved it into place only after the transfer finished. All that care, and then it refused two ordinary files (1,485,615 and 2,434,047 bytes) with:

```text
file exceeds max read size (1048576 bytes)
```

`SEAFILE_MAX_READ_SIZE` was meant to bound operations that return a complete file in memory: decoded text, raw bytes, or base64. The download-to-disk path never held the whole file in memory, but it still checked both `Content-Length` and the running byte count against `max_read_size`. Raising `SEAFILE_MAX_READ_SIZE` would have loosened the limit for actual in-memory reads too, so [v0.4.1](https://github.com/soffits/seafile-vault-cli/releases/tag/v0.4.1) splits the setting: `SEAFILE_MAX_READ_SIZE` stays at 1 MiB for in-memory calls, while disk downloads are uncapped by default and honour an optional `SEAFILE_MAX_DOWNLOAD_SIZE` (checked against both `Content-Length` and the byte stream, cleaning up the temporary file if exceeded).

Uploads had the same kind of blind spot. The upload path streamed from disk without loading the whole file into RAM, so I called it a streaming upload and moved on. Then a proxy rejected a transfer because the single multipart request body went over its 100,000,000-byte limit. The proxy didn't care how little memory the client used, only how big the request was. Supporting large uploads meant splitting transfers into multiple requests that stay under the limit after multipart framing overhead, checking the server's confirmed offset before resuming an interrupted chunk, and verifying the remote metadata at the end.

A small upload got me too. A smoke test called `write_text_file`, the file landed in the remote vault with an HTTP 2xx status, and the client still threw `Extra data: line 1 column 3` because the 2xx response body was not standard JSON. Upload calls now treat HTTP 2xx as success, parse JSON only when the body is JSON (keeping a short redacted `response_text` snippet otherwise), and verify in the smoke test by reading the uploaded file back.
