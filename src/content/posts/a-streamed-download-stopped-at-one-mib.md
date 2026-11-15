---
title: "My Seafile CLI streamed downloads to disk and still stopped at 1 MiB"
description: "Streaming to disk still hit a 1 MiB in-memory read cap, streaming uploads hit a 100 MB proxy limit, and a 2xx upload crashed on non-JSON output."
pubDatetime: 2026-08-16
modDatetime: 2026-11-15
tags: ["python", "open-source"]
---

I was pulling two scanned documents off my Seafile server for someone in my family, and [Seafile Vault CLI](https://github.com/soffits/seafile-vault-cli), the tool my scripts use to read and write files there, refused both. They were 1,485,615 and 2,434,047 bytes, and the error was:

```text
file exceeds max read size (1048576 bytes)
```

My first explanation was that the tool was refusing them on purpose, as some kind of guard for sensitive documents, and I said that before I'd read the code. There was no such guard. Nothing in the CLI looks at file names, types or paths. It was a plain 1 MiB limit applied in a place it was never meant for.

The download code was actually careful. `download_file_path` streamed the remote file into a temporary file with mode `0600`, calculated its SHA-256 while writing, synced it to disk, and moved it into place only after the transfer finished. It never held the whole file in memory. But it still checked both `Content-Length` and the running byte count against `max_read_size`.

`SEAFILE_MAX_READ_SIZE` exists to bound the calls that do return a whole file in memory: decoded text, raw bytes, or base64. Raising it would have loosened those too, so [v0.4.1](https://github.com/soffits/seafile-vault-cli/releases/tag/v0.4.1) splits the setting. `SEAFILE_MAX_READ_SIZE` stays at 1 MiB for in-memory calls. Downloads to disk are uncapped by default and honour an optional `SEAFILE_MAX_DOWNLOAD_SIZE`, checked against both `Content-Length` and the byte stream, with the temporary file cleaned up if it's exceeded.

The obvious next question was whether the tool had other limits like that. It had had two already, both in uploads.

A few weeks earlier, a proxy had rejected an upload because the single multipart request body went over its 100,000,000-byte limit. The upload path streamed from disk without loading the file into RAM, so I'd called it a streaming upload and moved on. The proxy didn't care how little memory the client used, only how big the request was. Large uploads now go out as several requests that each stay under the limit after multipart framing, check the server's confirmed offset before resuming an interrupted chunk, and verify the remote metadata at the end.

The other one was a small upload. A smoke test called `write_text_file`, the file landed in the remote vault with an HTTP 2xx status, and the client still threw `Extra data: line 1 column 3` because the 2xx response body wasn't standard JSON. Upload calls now treat HTTP 2xx as success, parse JSON only when the body is JSON (keeping a short redacted `response_text` snippet otherwise), and the smoke test checks by reading the uploaded file back.

All three were the same mistake: the code was careful about one thing and tripped over a limit sitting right next to it. The part I'm less happy about is the first one, where I explained a limit as a deliberate feature before checking whether anyone had meant it that way.
