# Release Notes — v5.1.7-beta.1 — Look, No Camera

**NewTon DC Tournament Manager v5.1.7-beta.1 — September 6, 2026**

*Beta — network match handover between the Tournament Manager and the Chalker. It is a proof of concept and it may not work. Feedback and bug reports welcome on [GitHub](https://github.com/skrodahl/NewTon/issues).*

---

## Overview

Since v5.0.0, moving a match to the Chalker and its result back again has meant a QR code: the Tournament Manager shows one, someone points a phone at it; the phone shows one back, someone points the Tournament Manager at that. It works, it works offline, and it will keep working.

This beta adds an alternative for venues where every device is already on the same network: **the match is simply sent to the board, and the result comes back on its own.** Nobody scans anything.

It is genuinely experimental. It has not been tested at a real tournament, it is off by default, and **the QR and manual paths are untouched** — if this turns out to be a bad idea, nothing you rely on goes with it.

---

## How It Works

A new setting on the Config page, under Chalker, called **Handover**:

- **QR code** — the default, and exactly what you have today.
- **Network** — the new path. QR buttons disappear and a Transfer button takes their place.
- **None** — neither, for clubs entering every result by hand.

With Network selected:

1. Each Chalker device says which board it is sitting at, once.
2. You give the match a lane and start it, then press **Transfer**. It appears on that board.
3. The players play. Nobody touches the Tournament Manager.
4. When the match finishes, the card shows a result is waiting.

**The result is never applied on its own.** You accept it, and accepting opens the same review you already know from scanning a result QR — the leg-by-leg breakdown, the achievements, the lollipop counters. Nothing enters your tournament without you seeing it first. A result you do not accept simply keeps waiting.

If a result is wrong, it is fixed on the Chalker — the thing that knows how to score darts, and which can undo back through legs to correct a mistake. The corrected result then replaces the one waiting. The Tournament Manager never rewrites what the Chalker recorded: a result either comes from the device, or you declare it by hand, and it is always clear which.

### Why polling, and not a live connection

A phone sleeps, gets backgrounded, and wanders between access points across an evening. A live connection has to survive all of that, and reconnect cleanly every time it does not. A request that simply happens again in a few seconds does not care: there is nothing to lose and nothing to re-establish. It is the least clever option, which for a first attempt is the point.

---

## What You Need

**This only works with the Docker deployment, and the Chalker has to be opened from your own server — not from newtondarts.com.**

That is not an arbitrary restriction. A page loaded from a public https address is not permitted by any browser to reach a device on your local network; it is blocked before a single packet leaves the phone, with no setting or permission that changes it. So the Chalker doing the talking has to be served from the same machine it is talking to.

In practice: on the phone, open your container's address and go to the Chalker from there. The Tournament Manager displays that address as a QR code you can point the phone's ordinary camera app at — a code to get you to a page, once, rather than a code for every match.

The Chalker at newtondarts.com is unaffected and continues to work exactly as before, over QR.

---

## What It Does Not Do

Being honest about a first attempt:

- **It has not been tested at a real tournament.** Not on a busy network, not across a long evening, not with a room full of phones.
- **It needs everything on one network.** No internet, no cloud, nothing leaves the building — which is the point, but it does mean the venue needs working wifi that lets devices talk to each other.
- **There is no live scoring view.** A match is sent and a result comes back; the darts in between stay on the board.
- **Opened from your own server, the Chalker loses its offline mode** unless you run the HTTPS variant with a certificate. In network mode that matters less — the server it talks to is the same one it loads from — but it is a real difference.

---

## A Note on Licensing

The network code lives in its own `licensed/` directory, which is **not open source**. Everything else in NewTon remains BSD 3-Clause and always will be.

It is **free to use**, with no key, no subscription and no registration — including at a real tournament. What the separate licence reserves is the possibility that network handover becomes a paid feature one day. Drawing that line before the code existed was the only moment it could be drawn at all: anything published as open source stays open source, permanently, and no later decision takes that back.

It may well end up open source anyway. This is a door left open, not a door closed. And the application works completely without that directory — delete it and both apps carry on exactly as before, minus a button.

---

## Also in This Release

**The Chalker's install banner can be dismissed again.** On some setups the "Install NewTon Chalker" bar sat permanently across the bottom row of the keypad with both of its buttons dead — nothing happened when you tapped Install, and the ✕ would not close it.

Its two buttons turned out to be the only ones in the whole Chalker wired the old-fashioned way, with the handler written into the markup rather than attached in code. That made them the only two buttons in the app that a strict server security policy could quietly disable. They are now wired like everything else.

Separately, the Install button used to do nothing at all in the case where the browser had withdrawn its install offer — a silent dead end. It now closes the banner instead of pretending.

---

## Migration

No migration required. Fully compatible with all existing tournament data, match history, and Analytics. The new Handover setting defaults to QR code, so an existing installation behaves exactly as it did before — nothing switches on unless you switch it on. Installed Chalker PWAs refresh to the new version automatically on their next online launch.

Note that **`:latest` on Docker Hub still points at v5.1.6**. This beta is tagged separately; pull it explicitly if you want to try the network path.

---

*Fun fact: the first design for this had an encrypted MQTT broker doing double duty as a licence check. It was abandoned once a simpler question got asked — what is the least we can build that answers whether anyone actually wants this? The answer turned out to be a few files of PHP and no broker at all.*

*NewTon DC Tournament Manager v5.1.7-beta.1 — Look, No Camera.*
