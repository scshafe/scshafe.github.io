---
title: Voice Lab
kicker: Private voice platform · Python, Qt
summary: A lab for my own voice, run entirely on hardware I own. It records calibrated sessions, follows my singing back to 2019, and tests open speech models on my voice in blind listening rounds.
figure: voice
order: 3
featured: true
status: In progress
updated: 2026-10-11
spec:
  - label: Built with
    value: Python 3.12, PySide6 and QML, ROCm
  - label: Capture
    value: miniDSP UMIK-1, 48 kHz, 24-bit
  - label: Models compared
    value: Qwen3-TTS, Chatterbox, F5-TTS, Seed-VC
  - label: Runs on
    value: My own machines; no cloud, nothing paid
  - label: Source
    value: Private; being prepared for release under MIT
---

Voice Lab started with two questions. Could an open speech model learn to sound like me
without a single recording leaving my own machines? And what has actually changed in my
singing over the years I've been recording myself on my phone?

A voice is biometric data, so the answer to the first question shaped everything else.

## Nothing leaves

Every recording, every model weight and every consent record stays on hardware I own. There
is no cloud storage, no hosted GPU and no paid model or API anywhere in the platform. When
data does have to move between my machines, it's sealed first, and each transfer is bound to
an approval of its exact digest. The code repository holds code, schemas and policy only. A
guard rejects any commit that would add audio, weights or consent evidence.

## Measured, not guessed

Training sessions are recorded with a calibrated measurement microphone (a miniDSP UMIK-1)
as unprocessed 48 kHz, 24-bit audio. The native recording app checks every buffer for
continuity, so a dropped block is caught when it happens rather than heard months later in a
model. Each session is checksum-manifested before it moves, and the intake that receives it
fails closed: it verifies everything and refuses anything it can't, and once raw audio is
accepted it is never modified.

The app works through a catalog of prompts, including standard sentence sets like Harvard
and CMU ARCTIC. Record a take, listen back on headphones, keep it or try again, and the
library keeps the history.

## Blind listening

Several open models are candidates: Qwen3-TTS, two Chatterbox variants, F5-TTS and the
voice converter Seed-VC. Each runs in its own isolated worker, pinned to an exact code and
weight revision and without network access. Every candidate gets the same held-out inputs,
the outputs are normalised, and I choose between them blind. A model is promoted only through
a manifest that pins every hash. From the recording library, one command fine-tunes F5-TTS
on the latest kept take of every prompt and writes listening samples next to the untouched
base model.

## The longer journey

Since 2019 I've recorded myself singing on my phone, roughly 2,400 voice memos. Voice Lab
reads that collection without ever writing to it. It separates singing from speech, flags
noise and music, and is building toward trends in pitch, tuning, vibrato and range, with
seeded statistics so every chart can be reproduced exactly.

## Where it's going

Voice Lab is becoming one platform. The memo analysis is merging in, the whole backend is
moving to my Linux workstation and its GPU, and a single desktop app built on my own Qt
component library will run on both macOS and Linux, with a small read-only view for my
phone. Once the code is ready it will be published under the MIT licence. The recordings
never will be.
