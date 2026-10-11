---
title: Leyline
kicker: macOS window manager · Swift
summary: Keeps the windows on a Mac neatly arranged side by side, so you never drag or resize them by hand. Open an app and it takes its own space; close it and the others fill the gap. It's all driven from the keyboard.
figure: leyline
order: 1
featured: true
status: Released · 1.0.0
updated: 2026-10-09
spec:
  - label: Platform
    value: macOS 14 or later, Apple silicon and Intel
  - label: Built with
    value: Swift 6
  - label: Install
    value: brew install scshafe/tap/leyline
    href: https://github.com/scshafe/homebrew-tap
  - label: Source
    value: scshafe/leyline-wm
    href: https://github.com/scshafe/leyline-wm
  - label: Licence
    value: MIT
---

I spend most of the day with a terminal, an editor and a browser open side by side, and
I want them arranged without thinking about it. Leyline does that on a Mac: open a window
and it takes a tile; close one and its neighbours take the space back. The keyboard moves
focus, resizes boundaries and moves windows, and nothing in the layout is left to chance.

It started as a stack of small helpers: a hotkey daemon, a border overlay, a menu bar and a
broker passing messages between them. Version 1.0 folds all of them into one native resident
that owns the layout, the keyboard, the borders, the move previews and the menu. Every change
it makes to a window goes through a single planner and is journaled first, so there is one
place that decides and one record of what it did.

## How it feels

Every shortcut starts with **Hyper**, which is Command, Control, Option and Shift held
together. (I map it to Caps Lock with a keyboard remapper; Leyline doesn't remap keys
itself.)

| Shortcut | What it does |
| --- | --- |
| <kbd>Hyper</kbd> <kbd>A</kbd> | Turn tiling on or off for the current desktop Space |
| <kbd>Hyper</kbd> <kbd>H</kbd> <kbd>J</kbd> <kbd>K</kbd> <kbd>L</kbd> | Move focus left, down, up, right, across displays |
| <kbd>Hyper</kbd> <kbd>R</kbd>, then a direction | Resize by moving the shared boundary; Escape ends it |
| <kbd>Hyper</kbd> <kbd>M</kbd> | Move, with a preview of exactly where the window will land |

## Decisions I care about

**Each Space decides for itself.** Some desktops want tiling and some don't, so every Space
has its own on/off switch, and Leyline remembers it. Turning a Space off hands its windows
back untouched.

**One border, one gap.** Borders are a single point wide by default. That width also sets
the one gap between neighbours and just enough room at the edges of the display, so the
whole screen reads as one evenly ruled grid, from below the menu bar or notch down to the
bottom edge.

**See the move before you make it.** Move mode shows the exact destination, whether a swap
or an insertion at an edge, and only commits when you press Return.

**When unsure, let go.** If Leyline can't tell which Space a window belongs to, it releases
management rather than guess. An application that refuses a size gets a crowded layout or an
explicit refusal, never a silent fight.

## What it doesn't do

Fullscreen and system Spaces aren't managed, and neither are windows on inactive Spaces.
Keyboard handling assumes physical US key positions. The downloadable app is ad-hoc signed
and not notarized, so installing through Homebrew, which builds it from source on your Mac, is
the smoother path:

```sh
brew install scshafe/tap/leyline
ley install --start
```

Everything is stored locally: there's no account and no network service.
