---
title: "I still don't trust an inbox made for agents"
description: "I wanted an API-shaped inbox. Then I started asking who sees the mail, how I leave, and whether it even handles threads."
pubDate: 2026-05-03
tags: ["agents", "email", "infrastructure"]
---

An API-shaped inbox is tempting.

For project mail and automation mail, I can see the appeal immediately: create an address, receive messages through an API, trigger work from webhooks, attach history to a task, and stop pretending a human mail client is the right tool for every automated flow.

That is why I looked through agent-native inbox products and open-source projects instead of dismissing the category. AgentMail and OpenMail are the obvious hosted names. Around them, the code is more interesting because it exposes the tradeoffs: Cloudflare's `agentic-inbox`, `chekusu/mails`, `agenticmail/agenticmail`, `autopilot-mail/autopilot`, and `inboundemail/inbound` all draw the mailbox shape differently.

Some of the features are exactly what I would want before connecting real work to one of these systems: inbound parsing, attachments, threads, webhooks, per-agent keys, local or self-hosted storage options, and an SDK that does not make one provider the whole design.

The reasons I still hesitate are not abstract.

Hosted providers can generally read mail while processing it unless the content is encrypted before it reaches them. Young platforms can disappear, change pricing, or strand data in a shape that only their API understands. A mailbox without threading, attachments, webhook reliability, narrow keys, domain controls, and audit history is not a mailbox I want automation to depend on. It is a demo with an address.

Self-hosting does not erase the problem. It moves the work into deliverability, storage, abuse controls, attachment handling, access control, and backup. That may be the right trade for some project mail, but it is not free just because the repository is public.

The thing I want is still more specific than the current category gave me: an inbox that agents can use without turning project mail into a provider-shaped trap.

I have not adopted one. The research made the category harder to dismiss, but not trustworthy enough for my own project mail yet.
