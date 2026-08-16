---
title: "A streamed download stopped at exactly 1 MiB"
description: "Seafile Vault CLI was writing safely to disk, but its in-memory read limit still rejected ordinary files."
pubDate: 2026-08-16
tags: ["python", "open-source", "security"]
---

[Seafile Vault CLI](https://github.com/soffits/seafile-vault-cli) could stream a remote file into a temporary file, calculate its SHA-256 while writing, and replace the destination only after the transfer was complete. It also refused to download anything larger than 1,048,576 bytes.

The error was unambiguous:

```text
file exceeds max read size (1048576 bytes)
```

What took me too long to question was the name. `SEAFILE_MAX_READ_SIZE` was meant to bound operations that return a complete result in memory: decoded text, raw bytes, or base64. The on-disk download path never assembled the complete file in memory. It wrote each chunk straight to a temporary file with mode `0600`, readable only by its owner.

But `download_file_path` checked both the response's `Content-Length` and the running byte count against `max_read_size`. The streaming implementation was doing what I wanted; the limit around it still treated a disk transfer like an in-memory read.

This showed up on ordinary files, not an exotic archive. Two live downloads of 1,485,615 and 2,434,047 bytes both crossed the default cap. Raising `SEAFILE_MAX_READ_SIZE` made them work, but it also enlarged the allowance for the operations that actually do hold their result in memory. That was the wrong knob.

I did not want the fix to be “large files are allowed now, safety removed.” The download path already had useful protections that were unrelated to file size. It required the download link to stay on the same trusted server, opened a fresh temporary file without letting a symbolic link redirect the write, checked `Content-Length` when present, hashed the stream, synced it to disk, and only then moved it into place. A failed transfer cleaned up its temporary file instead of damaging an existing destination.

[v0.4.1](https://github.com/soffits/seafile-vault-cli/releases/tag/v0.4.1) separates the two limits. Disk downloads have no size cap by default. Operators who need one can set `SEAFILE_MAX_DOWNLOAD_SIZE`; `SEAFILE_MAX_READ_SIZE` remains the default 1 MiB boundary for in-memory reads.

The explicit download cap is checked twice: once against `Content-Length`, and again as chunks arrive, because a server may omit the header or report it incorrectly. The tests also cover cleanup and preservation of an existing destination when that cap is exceeded. The release passed 259 tests, and both previously rejected live files downloaded successfully under the default configuration.

Setting `SEAFILE_MAX_DOWNLOAD_SIZE=1048576` still rejects them. It just does so for the reason that setting now says: the operator chose a 1 MiB limit for files written to disk.
