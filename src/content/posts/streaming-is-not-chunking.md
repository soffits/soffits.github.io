---
title: "My streaming upload still hit the proxy limit"
description: "Seafile Vault CLI needed bounded multi-request uploads, not just a memory-efficient single request."
pubDate: 2026-07-26
tags: ["infrastructure", "reliability", "protocols"]
---

I had one of those bugs where the word I was using made the work sound finished.

The upload path in [Seafile Vault CLI](https://github.com/soffits/seafile-vault-cli) already streamed from disk. It did not load the whole file into memory, so calling it a streaming upload felt accurate. Then a proxy rejected the request because the complete multipart request body was still too large. Each complete multipart request body had to remain below the 100,000,000-byte ceiling, and I was still sending one request body.

That was the irritating part. Nothing was wrong with the local memory behavior. The client could be perfectly disciplined on its own machine and still hand the proxy one oversized HTTP request.

The fix was not a different buffer size. It was native multi-request upload support.

Each request had to stay bounded after multipart overhead, not just after slicing the file payload. The remote side also had to be treated as stateful. If a response vanished after the server accepted bytes, the client could not assume the upload had failed and blindly repeat the same data. It needed to ask what offset the server had, resume from the confirmed position, and only report success after the final remote metadata passed verification.

The useful distinction became embarrassingly plain. Streaming answers how the client produces the body. Chunking answers how large the body is when it crosses the proxy. Verification answers what the remote system says exists now.

I had been treating the first answer as if it covered the second. The proxy was not confused. I was measuring the wrong thing.

The resulting upload path is less magical and more annoying to implement: bounded requests, remote-offset recovery, and final remote metadata verification.

I still like streaming. It just does not negotiate with a proxy that counts the whole request.
