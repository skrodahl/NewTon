# Chalker

A mobile-first darts scoring app designed for quick, reliable match tracking.

**Live version:** [darts.skrodahl.net/chalker](https://darts.skrodahl.net/chalker/)

## Install as App

Chalker is a **Progressive Web App (PWA)** - install it on your phone or tablet for the best experience:

1. Visit [darts.skrodahl.net/chalker](https://darts.skrodahl.net/chalker/) in Safari (iOS) or Chrome (Android)
2. Tap "Add to Home Screen"
3. Launch from your home screen like a native app

Once installed, Chalker works **completely offline** with no internet required.

## Features

### Always-On Chalkboard
- Traditional darts chalkboard layout
- Large touch targets for fast score entry
- Ton scores (100+) displayed with ring styling
- 180s highlighted in green

### Crash-Proof Persistence
- Match survives page reload, app restart, or phone reboot
- Settings remembered between sessions
- Full match history stored locally (up to 1000 matches)

### Flexible Match Setup
- Starting scores: 101 to 1001
- Best-of format: 1 to 9 legs
- Double-in option
- Configurable max rounds with tiebreak

### Score Editing
- Tap any score to edit
- Delete last visit by submitting empty edit
- Validation prevents invalid game states

### Match Statistics
- Live stats during play
- Tons, 140+, 180s tracking
- Short legs and high checkouts
- First 9 and match averages
- Leg-by-leg scoresheets

### Visual Cues
- Tiebreak warning gradient on final rounds
- Active player highlighting
- Checkout prompts with dart count

## Quick Start

1. Tap **NEW** to configure a match
2. Enter player names and settings
3. Start scoring - tap numbers, then **OK**
4. On checkout, select darts used
5. View stats anytime with **STATS**
6. Browse past matches with **HISTORY**

## Technical

- Pure HTML, CSS, JavaScript - no frameworks
- IndexedDB for persistent storage
- Service Worker for offline capability
- No server or internet connection needed

---

Part of [NewTon DC Tournament Manager](../README.md)
