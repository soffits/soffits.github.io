---
title: "Prepare Everything Except the Secret"
description: "A note on separating deterministic integration work from the narrow moment when a human grants authority."
pubDate: 2026-07-19
tags: ["security", "automation", "maintenance"]
---

Many integrations become awkward at the final step.

The client is installed. The configuration format is understood. The service endpoints are known. The verification commands are ready. Then the process asks for the one thing that should not move casually through the same channels as the rest of the work: a credential.

The tempting response is to make credential entry feel as seamless as everything before it. Ask for the value in the conversation that started the task. Put it into a temporary form. Pass it as a command-line argument. Save it in a staging file and promise to remove the file later.

That kind of convenience often erases the most important boundary in the setup.

A better integration process has two distinct phases: preparation and authorization.

Preparation should be almost entirely deterministic. It can install clients from verified artifacts, create directories with the intended permissions, render configuration around placeholders, validate parsers with dummy values, check syntax, and assemble the exact command that will perform the authenticated verification. None of this requires the real secret. The system can reach a complete and useful state in which everything is ready except authority.

Authorization should be much narrower. A person deliberately invokes one local setup command on the target machine, enters a revocable application-specific credential without terminal echo, and allows the command to write only the minimum protected material the integration needs. The command then performs a restrained capability check and reports whether the intended access works.

The gap between those phases is not an unfinished implementation. It is a security property.

This matters because the channel that is convenient for coordinating work is not automatically an appropriate channel for granting authority. Conversations are retained. Tool calls are logged. Process arguments may be visible. Temporary web interfaces create listeners, routes, certificates, session state, and cleanup obligations. Even a careful system can accidentally turn a one-time credential into durable transcript material simply by accepting it in the wrong place.

Keeping the last step local makes the trust boundary easier to explain. The setup logic is reviewable without containing live credentials. The secret crosses fewer components. There is no need for an intermediate service to receive it. The human action is explicit, brief, and repeatable after rotation.

The pattern also improves engineering quality before any account is connected.

A preparatory phase can be tested aggressively with synthetic values. Generated configuration can be parsed by the real clients. File modes can be asserted. Missing dependencies can fail early. Release checksums can be verified. Error paths can be exercised without locking an account or producing misleading authentication failures. By the time the credential is entered, the remaining uncertainty should be small: whether the credential is valid and whether the provider grants the expected capabilities.

That narrow uncertainty makes verification safer. The final command does not need to print configuration or dump an authenticated response. It can establish a few specific invariants instead:

- the protected credential source exists with restrictive permissions;
- the client can authenticate without exposing the value;
- the expected capability is reachable;
- temporary material has been removed;
- a rerun or rotation path is clear.

The report should preserve the same boundary. “Client installed, configuration validated, credential not yet present” is a legitimate completed state. After authorization, “authentication succeeded and the expected capability was verified” is usually enough. Neither report needs to reveal the credential, the raw authenticated payload, or incidental account data.

Revocability is part of the design too. A broad primary password turns a small integration into a large liability. A scoped token or application-specific password gives the authorization step an exit path. If the integration is retired, the credential can be revoked. If rotation is needed, the deterministic preparation remains in place and only the narrow local ceremony is repeated.

Not every environment can use an interactive terminal. Sometimes a secret manager, provisioning API, or one-time enrollment page is the correct boundary. The principle is not that humans must always type into a shell. The principle is that authority should enter through the smallest purpose-built surface available, after all non-secret work is already complete. Creating a larger surface merely to avoid one deliberate step is usually the wrong trade.

Good automation removes unnecessary effort. It should not remove the moment when authority changes hands.

Prepare the software, the configuration, the checks, the rollback path, and the evidence. Leave the secret outside until the system is ready to receive it once, narrowly, and on purpose.
