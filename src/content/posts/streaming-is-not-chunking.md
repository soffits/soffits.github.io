---
title: "Streaming Is Not Chunking"
description: "A note on solving request-body limits at the protocol boundary, with bounded requests, resumable state, and end-to-end verification."
pubDate: 2026-07-26
tags: ["infrastructure", "reliability", "protocols"]
---

A large upload fails at the edge with a request-body limit. The client already streams from disk, so memory use is flat. It is tempting to conclude that the upload is chunked and that the remaining problem belongs to the proxy.

It is not.

I ran into this distinction while implementing native multi-request uploads in [Seafile Vault CLI](https://github.com/soffits/seafile-vault-cli). The single-request path was already memory-efficient. It was still structurally unable to cross a proxy's per-request ceiling.

Streaming and chunking solve different constraints.

Streaming controls how a client produces one request body. It can avoid loading an entire file into memory, preserve backpressure, and make local resource use predictable. But the proxy still receives one HTTP request whose body is the size of the file. If that request exceeds an enforced limit, streaming changes nothing about the decision.

Chunking controls the size of each request. A file becomes a sequence of independently bounded HTTP requests, and the server participates in assembling those requests into one remote object. The distinction is not an implementation detail. It is the difference between managing memory and changing the wire protocol.

This leads to a useful rule: infrastructure limits must be addressed at the layer that measures them.

A memory limit can be addressed by streaming. A per-request body limit requires smaller requests. A timeout may require shorter operations, resumable progress, or different routing. Renaming one mechanism after another does not move the boundary.

Correct chunking is also more than slicing a byte array and repeatedly calling an ordinary upload endpoint. The server must understand that the requests belong to one object. Each request needs an explicit range or offset. The final request needs a defined completion meaning. Retries must account for the possibility that the server accepted bytes even when the client did not receive the response.

That last case is where a basic implementation becomes a reliable one.

Suppose the final chunk reaches the server, the file is committed, and the response disappears. Blindly retrying the final chunk may duplicate data, restart an upload, or produce a conflict depending on server behavior. Treating the timeout as proof of failure is unsafe because network errors describe what the client observed, not necessarily what the server did.

The recovery path should reconcile state before retransmission:

1. query the server's uploaded offset or final object metadata;
2. compare remote state with the local file size;
3. resume from the confirmed boundary when the upload is incomplete;
4. accept completion only when the final remote object satisfies the expected invariant.

This is why resumability and verification belong together. An offset endpoint is useful during transfer, but it does not prove that the completed object is visible, indexed, or the correct size. A successful final response is encouraging, but it is still weaker than asking the system of record what now exists.

For an ordinary file upload, the minimum completion invariant is often simple: the remote object exists at the intended path and reports the same integer size as the opened local file. For higher-value artifacts, a fresh download and hash comparison can provide stronger end-to-end evidence. The check should match the consequence of being wrong.

Request bounds need the same precision. A configured chunk size is not necessarily the complete HTTP body size; multipart framing and headers add overhead. A robust client limits the payload conservatively and checks the fully constructed request before sending it. The invariant belongs on the request that crosses the boundary, not only on the slice read from disk.

There is an operational lesson here too. Bypassing a proxy and connecting directly to an origin can appear to solve a body limit, but it trades a protocol problem for a deployment exception. Direct routing depends on firewall policy, certificates, name resolution, origin exposure, and a second set of server limits. It can be a deliberate fallback. It should not be mistaken for a portable design.

Native multi-request upload support is usually the cleaner answer because it preserves the normal public route while respecting the route's limits. It also makes the behavior testable: force small chunks, record the ranges received by a mock server, simulate lost responses, resume from known offsets, and verify that completion is not reported before remote metadata agrees.

The broad principle extends beyond file transfer.

A system should not claim to have crossed a boundary merely because it behaved efficiently on its own side of that boundary. Low client memory does not prove bounded network requests. A returned success does not prove durable remote state. A timeout does not prove remote failure.

Name the measured boundary, choose a mechanism that changes what crosses it, and verify the result from the other side.
