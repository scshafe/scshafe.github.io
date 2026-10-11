---
title: Mailroom & Switchyard
kicker: Mail sorting · TypeScript, PostgreSQL
summary: Switchyard is a small engine that moves units of work through a graph of checks, models and people, durably. Mailroom is the first thing built on it, an inbox sorter that runs on my own hardware and never sends a thing.
figure: switchyard
order: 2
featured: true
status: Deployed · going live
updated: 2026-10-05
spec:
  - label: Built with
    value: TypeScript, Node.js, PostgreSQL
  - label: Models
    value: Qwen 2.5 7B and Qwen 3 14B, run locally
  - label: Engine
    value: scshafe/switchyard
    href: https://github.com/scshafe/switchyard
  - label: Store
    value: scshafe/switchyard-postgres
    href: https://github.com/scshafe/switchyard-postgres
  - label: Mailroom source
    value: Private for now
---

My inbox is mostly not for me: sign-in codes, receipts, newsletters, job alerts and
promotions, with the occasional email from a person in between. I wanted something to sort
it the way I would, explain every decision it made, and never be trusted with more than it
needs. Building that properly needed an engine first.

## Switchyard: a rail yard for work

In Switchyard, a piece of work is a **unit**, and units move through a graph the way cars
move through a rail yard. Every node is a track with its own durable queue. A node can be
plain **code**, a **model**, an **agent**, a **person**, or a **callback** to some other
system. When a node finishes its turn, its outcome throws the switches, the sealed edges
that send the unit on to the next track; a join waits for arrivals from several tracks
before the unit continues.

The part I care most about is that finishing a turn is one atomic step. In a single
transaction it records the evidence, follows the edges, updates any joins, queues every
next node, writes the outbound events and releases the lease. A crash leaves a unit
exactly where it was, never half moved. Graph definitions are sealed by digest, so a running
unit can always say precisely which version of the graph it's on.

The engine has no dependencies. It doesn't import a database client, a model SDK or a
framework: the store and each kind of node are interfaces the host application provides.
[`switchyard-postgres`](https://github.com/scshafe/switchyard-postgres) is the PostgreSQL
store that Mailroom uses.

## Mailroom: the sieve

Mailroom reads one Gmail account with a read-only grant and turns each new message into a
unit. The graph it runs is a sieve: cheap, certain checks first, then small questions, then
a person.

1. **Screen.** Gmail's spam verdict and a check for prompt injection send anything suspect
   to quarantine.
2. **Codes.** A plain pattern catches one-time codes and sign-in links. Only if it's unsure does a
   model take a look.
3. **Rules.** My own allowlist: family, job applications and a few known senders.
4. **Four questions.** Is this about a job application? A job alert? A newsletter? A
   promotion? A small model answers each one yes, no or unsure; on unsure a larger model
   tries; if that's still unsure, the message goes to me.

The first match wins and every message ends in exactly one of eight buckets. Each one
carries its trail, every step with its answer and whether a rule, a model or I decided it,
so "why is this here?" always has an answer.

## What it keeps, and what it doesn't

Gmail stays the source of truth. Switchyard's records hold message ids, headers, a content
hash and the trail, never the text of an email. The body lives in a cache for at most a day
while the sieve reads it, then it's deleted. Mailroom can label, archive and move mail to
the trash through a separate, narrower permission. It can't send, draft or permanently
delete anything, and it refuses a sending permission if one is offered.

The models run on my own machines. Nothing about my mail goes to a hosted model.

## Behind the buckets

A bucket can hand its mail to a small program of its own. One trashes sign-in codes once they
expire, one files promotions and clears them after the offer ends, and one files
newsletters and, only when I say so, unsubscribes. A native desktop inbox shows every
bucket live, with the trail for each message and single-key sorting for anything that
reaches me.

Mailroom is deployed and in its last checks before it starts reading real mail.
