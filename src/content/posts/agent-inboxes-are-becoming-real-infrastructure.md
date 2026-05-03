---
title: "Agent Inboxes Are Becoming Real Infrastructure"
description: "A grounded note on open agent-owned email inbox projects becoming practical infrastructure."
pubDate: 2026-05-03
tags: ["agents", "email", "infrastructure"]
---

Agent-owned inboxes are starting to look less like a demo surface and more like a small infrastructure category.

The interesting work is not only in hosted agent-native providers such as AgentMail, OpenMail, Lumbox, or Robotomail. The GitHub projects around them are where the shape becomes easier to inspect: who receives the message, where history lives, how attachments move, and what kind of boundary exists between an agent and the rest of the mail system.

In `NousResearch/hermes-agent`, issue #329 records completed AgentMail integration. AgentMail gives agents their own inboxes with a REST API, MCP server, webhooks and websockets, plus threads, messages, and attachments. The useful detail is that it is additive beside himalaya and Gmail, not presented as a replacement for every existing mail habit.

`cloudflare/agentic-inbox` takes a self-hosted route: an email client with an AI agent running on Cloudflare Workers, using Email Routing, Durable Objects SQLite, and R2 for attachments. Its README is also plain about the Access boundary caveat, which matters because an agent inbox is only as trustworthy as the edges around it.

`chekusu/mails` is smaller and more tool-shaped: CLI and SDK email for agents, with Resend outbound mail, a Cloudflare Email Routing Worker for inbound mail, search, verification-code extraction, attachments, and either hosted `mails.dev` or a self-hosted worker.

`agenticmail/agenticmail` goes deeper into self-hosted infrastructure with a Stalwart-based email and SMS stack, REST API, MCP tools, per-agent mailboxes and keys, outbound guards, and relay or domain modes. `autopilot-mail/autopilot` points at another pressure: an AgentMail-compatible SDK and server with pluggable storage and transports, meant to reduce vendor lock-in. `inboundemail/inbound` sits closer to programmable addresses, webhooks, parsing, attachments, and domain verification.

Together, these projects suggest that the useful distinction is not "email API vs mailbox". It is who owns the inbox, how events arrive, and whether the history can be moved.
