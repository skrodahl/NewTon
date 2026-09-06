# NewTon Network Layer

**Status: proof of concept, not started. Nothing here is built yet.**

Direct transfer of matches between the Tournament Manager and the Chalker over
the local network, as an alternative to the QR code round trip.

This document supersedes the earlier design, preserved in full at the bottom under
[Appendix: Superseded Design (March–August 2026)](#appendix-superseded-design-marchaugust-2026).
Several of its central assumptions were wrong; the reasoning is recorded here so
they are not re-proposed.

---

## What this is

An experimental proof of concept. It may not work. It may be removed. **No
promise is made that it will be developed further.**

QR transfer and manual entry remain the supported ways to move match data, and
are unaffected. The application must work identically with the `licensed/`
directory deleted.

Code lives in `licensed/` under its own licence — see
[`../licensed/README.md`](../licensed/README.md). It is free to use, with no key
and no subscription. Licence gating, if it ever happens, is a later stage and is
explicitly **not** part of this work.

---

## Decisions

| Decision | Choice | Why |
|---|---|---|
| Topology | **LAN only** | Non-negotiable. No relay, no cloud, no internet at run time. |
| Transport — proof of concept | **REST over the existing PHP/nginx stack** | Needs no new infrastructure, no new dependency, and removes the riskiest unknown. See below. |
| Transport — intended direction | **MQTT over WebSocket** | Earns its place once live per-dart views exist. Same payloads, so the swap is cheap. |
| Chalker origin | **Served from the container** | A Chalker installed from `newtondarts.com` cannot reach the LAN. See [the origin problem](#the-origin-problem). |
| Discovery | **None required** | Both apps are clients of the container they were served from. Relative URLs. |
| Device onboarding | **QR carrying the container URL** | Scanned once per device with the *native camera app*, so it works on plain http. |
| Lane identity | **The Chalker claims a lane** | Boards are physical and fixed. No coordination step. |
| Presence | **Heartbeat POST + staleness timeout** | Survives phone sleep, which a live connection does not. |
| Server state | **JSON in the existing `tournaments/` volume** | Already mounted, already persistent. |
| Encryption | **None at the application layer** | The container is the club's own machine on their own network. |
| Licence keys | **None** | Not this stage. |

---

## Why REST first, MQTT later

MQTT is the right long-term answer and the plans that depend on it are real. It
is the wrong *first* step, for three reasons.

**The container already is a server.** nginx routes PHP through FastCGI to
php-fpm, `api/` holds five working endpoints, and `tournaments/` is a mounted
persistent volume. A REST match transfer is two PHP files and a JSON file.
Nothing new is installed, nothing new runs, and the zero-dependency property
survives — no mqtt.js, no Mosquitto, no libwebsockets packaging risk.

**It removes the question most likely to kill the idea.** Whether a phone holds a
live connection through screen sleep, backgrounding and roaming between access
points is the hardest thing to get right and the easiest thing to be defeated by.
With polling there is no connection to lose: the phone wakes, makes a request,
done. No reconnect logic, no backoff, no session state.

**What MQTT provides has cheap equivalents at this scale:**

| MQTT | REST equivalent |
|---|---|
| Last Will (lane offline) | Heartbeat with timestamp; stale after ~30s. More robust — it survives sleep. |
| Retained messages | A file on disk. The same semantics. |
| QoS 1 | Retry plus idempotency. Payloads already carry match IDs, and re-applying a result is the path a re-scanned QR already takes. |
| Push | Polling. Seconds of latency to say "here is your next match" is irrelevant. |

Eight lanes polling every two seconds is four requests per second against nginx
serving a static JSON file.

*Not SSE:* each open stream pins a php-fpm worker, and a handful of lanes would
exhaust a default pool. Polling is the safer shape on this stack.

**Where MQTT earns it back:** narrating a leg dart-by-dart to a spectator view or
big screen. Polling is fine for "here is your match" and "here is the result";
it is poor for live streaming. If those views become real, switch — and because
both transports carry the *same payload objects*, switching is cheap.

---

## How the pieces find each other

**They don't have to.** Both apps are served by the container, so the API is a
relative path from wherever the page was loaded. No IP, no hub URL, no config
setting, no mDNS. The superseded design needed a five-step discovery chain only
because its hub was a separate thing elsewhere on the network.

The one genuine step is human: getting the phone to the URL the first time.

**Onboarding.** The TM displays a QR containing its own origin —
`http://newton.local:2020/chalker/`. The phone scans it with its **native camera
app**, which opens the Chalker in the browser. Once per device, ever. The native
camera app is not the web `getUserMedia` API, so this works on the plain-http
deployment where the in-page scanner does not. QR ends up doing what it is best
at — carrying a URL to a phone — while REST carries the match data.

**Lane identity.** On first load the Chalker asks which board it is; the choice
is stored on the device. That matches physical reality — the phone sits at board
5 all evening — and needs no coordination. The existing lane concept (1–20, with
the excluded-lanes config) carries over unchanged. If two devices claim one lane,
the heartbeat's device ID lets the TM say so; last-writer-wins with a visible
warning is fine here.

**Device ID caveat.** `crypto.randomUUID()` is undefined outside a secure
context, so it is unavailable on the http deployment. The fallback already exists
at `js/results-config.js:80`, with a comment naming plain-HTTP LAN deploys
specifically. The Chalker needs the same treatment.

**Presence.** A heartbeat POST every few seconds carrying lane, device ID and
status. Anything older than ~30 seconds is offline.

---

## What the proof of concept is trying to establish

Choosing the cheaper transport shortened this list, which was the point.

1. **Does the round trip actually feel better than scanning a QR code?** The
   primary question. No amount of design answers it, and it decides whether any
   of this is worth building properly.
2. ~~**Does the Chalker survive being backgrounded for a whole match?**~~
   **ANSWERED 2026-09-06 — yes.** `saveCurrentMatch()` writes the full scoring
   state and input buffer to IndexedDB after every visit, undo, edit, tiebreak and
   match start, and `checkForActiveMatch()` auto-resumes on load. Crucially
   **IndexedDB is *not* a secure-context API**, so it works on the plain-http
   deployment — unlike service workers, `getUserMedia` and `crypto.randomUUID()`.
   An evicted tab therefore resumes mid-match with nothing lost.
   The residual http-vs-https difference is narrower than it looked: without a
   service worker the *app shell* must be re-fetched from the container to
   resume. Normally fine, since the container is what you are talking to; the
   failure case is a tab evicted **and** wifi briefly down, where https+SW would
   have loaded the shell from cache.
3. **Is polling acceptable on phone batteries** over a three-hour tournament?
4. **Does the operator flow feel right** — a match appearing on the correct board
   with nobody scanning anything?

### What does not need proving

The payload schemas, the CRC-32 integrity check, and the entire apply-a-result
path shipped in v5.0.0/v5.0.1 and are in daily use. `handleResultQRPayload()`
takes a raw string, not a camera; the Chalker's assignment handler does the same.
The proof of concept carries **those exact payloads over a different pipe** and
introduces no new semantics.

---

## The origin problem

**A Chalker installed from `https://newtondarts.com` cannot reach the LAN over
plain http or `ws://`, and the ways around that require infrastructure
incompatible with LAN-only.**

The rule, from the [Secure Contexts spec](https://w3c.github.io/webappsec-secure-contexts/):
an origin is *potentially trustworthy* if its scheme is `https` or `wss`, or its
host is loopback (`127.0.0.0/8`, `::1/128`, `localhost`). **Private ranges such as
`192.168.0.0/16` are deliberately not on that list.**

| From the hosted PWA | Result |
|---|---|
| `http://` or `ws://` to a LAN address | Blocked by mixed content. No workaround, no interstitial, no click-through. |
| `https://` or `wss://`, self-signed cert | Fails certificate validation. No override is possible for `fetch` or WebSocket. |
| `https://` or `wss://`, **publicly-trusted** cert | Works, subject to Private Network Access preflight |
| WebRTC data channel | Works — not a subresource fetch, so mixed content never applies |

Two things that are easy to get wrong:

- **Installing a PWA does not change its origin.** The installed Chalker still
  runs as `https://newtondarts.com`, under the same restrictions as a tab.
- **Network reachability is irrelevant.** The phone can ping the container all
  day; the *page* still cannot open an insecure request to it.

Verify the first row in seconds by running `fetch('http://192.168.1.50/api/api-check.php')`
in the installed Chalker — it fails before a packet leaves the device.

### Why the two working rows are still ruled out

A **publicly-trusted certificate on a LAN device** is achievable — it is how Plex
solved this — but it means your own domain with wildcard DNS mapping encoded
private addresses, per-installation issuance via DNS-01, and renewals. That needs
internet at setup and periodically after, which contradicts LAN-only. A real
option if that constraint ever softens.

**WebRTC** genuinely escapes mixed content, and an https PWA can open a data
channel to a LAN peer. But it is peer-to-peer between two WebRTC endpoints, and
neither Mosquitto nor nginx is one — so it reaches the TM's *browser tab*, not a
server, discarding everything a broker or an API gives you. It also needs
signalling, which from a hosted PWA means QR: two scans to establish what one
scan does today. Worth remembering as the only route that keeps the hosted PWA
*and* stays LAN-only; not a cheap path to anything.

### http or https for the container-served Chalker

Both work. They differ in what the Chalker keeps.

| | `docker-compose.yml` (http) | `docker-compose-ssl.yml` (self-signed) |
|---|---|---|
| Cert setup | None | Install and trust on every device — worst on iOS |
| Service worker | **No** — needs a secure context | Yes |
| Offline / installable PWA | **No** | Yes |
| In-page camera (QR fallback) | **No** — `mediaDevices` is undefined | Yes |
| `crypto.randomUUID()` | **No** — fallback required | Yes |
| REST transfer | Yes | Yes |

In network mode neither side needs the in-page camera, so the http row's losses
bite only in a failure mode. Note that a self-signed certificate must be
*trusted*, not merely clicked through: Chrome refuses to register a service worker
on a page that had a certificate error.

**Start on http.** Zero setup friction, and it exercises the uncertain parts.

---

## Keeping future freedom

The proof of concept must not constrain the real implementation. Six rules, all
cheap:

1. **Reuse the existing QR payloads verbatim.** No new wire format means no new
   format to be stuck with — and it is what makes a later MQTT swap cheap.
2. **Version the API path** — `/api/v1/…` from the first endpoint. Free now,
   expensive to retrofit.
3. **Keep network state out of persisted tournament records.** This matters most.
   The project's additive-only schema rule means anything written into
   `dartsTournaments` can never be renamed or repurposed — a field the proof of
   concept invents is a permanent commitment. Hold lane, dispatch status and
   result source in memory, or under a separate throwaway localStorage key, until
   the design settles.
4. **Nothing in exports.** Do not touch `exportVersion` or the export payload.
5. **Off by default, opt-in.** Nothing that is not enabled can be depended on.
6. **One choke point.** All network setup goes through a single initialisation
   function. If a licence check ever arrives it has exactly one place to live —
   and it is better structure regardless.

---

## A threat-model change worth naming

This introduces something the app has never had: **a shared datastore that
multiple devices write to.** The standing threat model — data is browser-local,
so attacks reduce to self-hacking — stops being strictly true. Anyone on the club
wifi can POST a result.

For a LAN proof of concept that does not justify building authentication. Two
things already in place make it comfortable, and both are free:

- **Results go through the existing preview-and-confirm path**
  (`showResultQRPreview` → `applyQRResult`) rather than being applied
  automatically. Nothing enters a tournament without the operator seeing it.
- **Undo already exists** if something slips through.

Recorded here as a deliberate, bounded exception rather than leaving the older
threat-model statement quietly untrue.

---

## What already exists (found 2026-09-06)

More of the Chalker side is built than the plan assumed.

**Chalker — the whole idle-mode scaffold is present and styled:**

- A **Network** button in the New Match modal → `handleNetworkModeFromModal()`
- A Network Mode modal with a lane select, persisted to IndexedDB
  (`settings` / `networkLane`) by `saveNetworkLane()` / `loadNetworkLane()` —
  i.e. **lane claiming is already implemented**, device-local, exactly as the
  decisions table proposes
- `startNetworkMode()` clears any active match and switches the scoring screen
  into a waiting state
- `updateDisplayForNetworkWaiting()` — a finished idle screen: `Lane N •
  Waiting...`, `---` placeholders, `network-mode` header styling, keypad disabled

**What is missing is only the transport.** `networkWaitingLane` is written once
and read once, for a label. Nothing polls and nothing receives. So the remaining
Chalker work is: a poll loop, wiring a received assignment into the existing
start-match path, and posting the result on completion.

**The TM has no network scaffold at all** — nothing outside the QR code. The
dispatch UI, lane status display and result collection are all still to build.

⚠️ **The Network modal reads "This feature requires a license and is not yet
available."** That predates the decision that the proof of concept is free with
no key, and must be corrected before this is usable — otherwise the first person
to open it is told something untrue.

---

## The one piece of real work — ✅ DONE 2026-09-06

Smaller than expected: **the Chalker side was already split.**
`buildResultPayload(match)` returns the signed payload and `showResultQRModal()`
renders it, so results were transport-agnostic already.

Only the TM needed it. `openMatchQR()` built the assignment payload and rendered
the QR in one function; **`buildAssignmentPayload(matchId)` is now extracted**
(`js/qr-bridge.js`), returning the signed payload or `null` for an unknown match.
`openMatchQR()` calls it and takes the referee name for its subtitle from
`signed.ref`, so the referee lookup is not duplicated.

Verified against the pre-change file: payload JSON byte-identical across 9 cases
(no lane/referee, lane only, referee only, both, a referee id with no matching
player, a string lane, missing config defaults, an apostrophe in a name, and an
unknown match id as a no-op) — 1258 bytes compared, with a frozen clock so `ts`
matches. A mutant that serialises the lane as a string fails exactly the
lane-bearing cases.

Everything downstream of "here is a payload string" was already
transport-agnostic and needed no changes. **Both directions can now be produced
without rendering a QR**, which is all the network layer needs from the BSD side.

---

## Sketch

```
TM (browser)            container: nginx + php-fpm          Chalker (browser)
     |                            |                                |
     |-- POST /api/v1/assign ---->| writes lanes/5.json            |
     |                            |<---- GET /api/v1/assign?lane=5 |  (poll)
     |                            |----- assignment payload ------>|
     |                            |                                |  (scoring)
     |                            |<---- POST /api/v1/result ------|
     |-- GET /api/v1/result ----->|                                |
     |<-- result payload ---------|                                |
     |                            |<---- POST /api/v1/heartbeat ---|  (every few s)
     |                                                             |
     | preview + confirm — the same handler a scanned QR goes through
```

Endpoints — **built 2026-09-06**, in `licensed/api/v1/`:

```
POST /licensed/api/v1/assign.php      {lane, payload}   TM queues a match for a lane
                                      {lane, clear:1}   TM frees the lane after accepting
GET  /licensed/api/v1/assign.php?lane=N                 Chalker collects what is queued
POST /licensed/api/v1/result.php      {payload}         Chalker posts a finished match
                                      {clear: matchId}  TM discards one after applying it
GET  /licensed/api/v1/result.php                        TM collects everything pending
POST /licensed/api/v1/heartbeat.php   {lane, deviceId, status, matchId}
GET  /licensed/api/v1/lanes.php                         registry, with `online` derived
```

They live under `licensed/` rather than `api/` deliberately: nginx's `location ~ \.php$`
already serves any `.php` under the document root, so this needs **no nginx change**,
and deleting the directory deletes the endpoints — which is the "the app works without
`licensed/`" property, enforced by construction rather than by discipline.

Two design points worth keeping:

- **An assignment is not cleared when collected.** A Chalker that reads one and then
  crashes would otherwise lose the match with no way to ask again. It stays until
  replaced or explicitly cleared, and the Chalker ignores an assignment for the match
  it is already scoring — so re-reading is harmless, which is what makes polling safe.
- **Results are keyed by match id**, so a corrected resend replaces the pending copy
  instead of queueing a second one. A result is only ever deleted by the TM after the
  operator accepts it; if they don't, it stays pending. That is what makes "declining"
  mean "not yet" without any decline action existing.

State lives in `tournaments/network/` — the volume that is already mounted and already
written to by the upload endpoint, so it survives a restart and needs no new config.
Writes are atomic (temp file plus rename) so a poller never reads a half-written mailbox.
Match ids reaching a filename are whitelisted to `[A-Za-z0-9-]`, which is the one place
request data touches a path.

---

## Open questions

1. **Free as in beer, or free as in freedom?** Currently the former: `licensed/`
   carries restrictive terms with a revocable free-use grant. Shipping under
   BSD-3 instead is a one-way door that closes on first publication.
2. **What becomes commercial later**, if anything: the transport alone, or
   Series/League as well? The superseded design gated Series/League behind
   encryption that no longer exists.
3. **Contributions** — the licence reserves the necessary rights (Section 5), but
   a proper CLA is the real answer if the commercial path is pursued.
4. **Multiple tournaments on one container** — the endpoints allow it; whether the
   UI should is a separate question.
5. **Does the Chalker's existing persistence survive a background eviction?**
   See question 2 of the proof-of-concept list.

---

## Related documents

- [`QR.md`](QR.md) — the payload protocol this reuses, unchanged
- [`CHALKER-PERSISTENCE.md`](CHALKER-PERSISTENCE.md) — bears on the eviction question
- [`MDNS.md`](MDNS.md) — `.local` hostname setup
- [`../licensed/README.md`](../licensed/README.md) — the licensing boundary
- [`../api/README.md`](../api/README.md) — the existing endpoints this builds on

---
---

# Appendix: Superseded Design (March–August 2026)

**Retained for reference. Do not implement from this section.** It is preserved
because several of its assumptions were wrong in instructive ways:

- **Encryption as the licence gate.** The design had encryption doing double duty
  — protecting data in transit *and* enforcing licensing. Those are separate
  concerns and coupling them made both awkward. In a LAN-only deployment there is
  nothing to protect the payload from anyway; the licence boundary is now the
  `licensed/` directory, and any future key check is independent of it.
- **A hub reachable from the hosted Chalker.** Not possible — see
  [the origin problem](#the-origin-problem--why-the-public-chalker-cannot-be-the-network-client).
- **Series/League gated behind the network bridge**, on the reasoning that no
  licence meant no decryption meant no MQTT. That gate no longer exists.
- **A separate `newton-hub` project.** The broker is Mosquitto in the existing
  container.

---

**Status:** Planning
**Last Updated:** March 14, 2026

---

### Storage Architecture Decision (March 2026, revised)

#### Hybrid Storage: localStorage + indexedDB

The storage layer does **not** need to migrate wholesale to indexedDB. Instead, a hybrid approach separates concerns cleanly:

| Store | What it holds | Nature |
|-------|--------------|--------|
| **localStorage** | Tournament structure, match state, config, rankings, undo history | Operational — run the tournament. Ephemeral by design. |
| **indexedDB** | Raw match archive: visit scores, leg data, timestamps | Archival — permanent record. Independent lifecycle. |

**Why this works:**
- Everything in localStorage today is small, fast, and synchronous. It works. Leave it alone.
- The heavy data (visit scores, full scoresheets) does not exist in the codebase yet — it can be built async and indexedDB-native from day one.
- No migration. No async refactoring of existing code. No risk to what is working.

**The archive is independent:**
The indexedDB match archive has its own lifecycle. It is not a cache of localStorage — it is a permanent record. Deleting a tournament from localStorage does not orphan the archive; the archive stands on its own. It can be queried for player statistics, trends, head-to-head records, and season history long after the operational tournament data is gone.

#### Match Archive Record

```javascript
{
  matchId:        'FS-1-3',        // TM match ID
  tournamentId:   'uuid',          // Soft reference — archive survives tournament deletion
  timestamp:      'ISO8601',       // Match start time
  player1:        { id, name },
  player2:        { id, name },
  format:         'Bo5',           // Match format
  startingPlayer: 1,               // 1 or 2
  visits:         []               // Raw per-visit scores, per leg
}
```

All derived values — averages, checkout percentages, high finishes, score ranges, head-to-head records — are calculated on read from the raw visits. The store stays lean; the queries stay flexible.

#### What this unblocks
- Full scoresheet storage (Chalker → TM result import)
- Series / League season history
- Player statistics and trends across tournaments
- External reporting / API hydration

#### Data Flow: Live Stream + Final Transfer

When network is active, Chalker sends data to TM in two phases:

**Live stream** — per-visit data flows from Chalker to TM as the match progresses. Provisional and best-effort. Enables real-time display in TM (live score, running averages, spectator view) without waiting for match completion.

**Final transfer** — complete match record sent on match completion. This is the source of truth. TM writes to the archive only if the incoming data differs from what is already present — making the transfer idempotent and safe to receive multiple times.

This means the live infrastructure is in place from the start. If the stream was uninterrupted, the final transfer is a no-op. If the connection dropped mid-match, the final transfer fills any gaps. Either way the archive ends up correct.

Live opportunities enabled from day one:
- Live score display on the TM bracket during a match
- Running statistics as legs are played
- Real-time leaderboard updates
- Spectator / operator view without manual entry
- **Celebration broadcast** — when the tournament completes and the Celebration Podium appears in TM, the podium is pushed to all connected Chalker tablets simultaneously. Every screen in the venue shows the champion at the same moment

#### Live Feed: MQTT Pub/Sub

External consumers (live-view displays, announcer screens, stats overlays) receive live data via the same MQTT broker already used for TM ↔ Chalker communication. No separate mechanism needed.

**TM publishes** live state updates to a dedicated topic (e.g. `newton/live/{tournamentId}`) as events occur — visit scored, leg completed, match completed, leaderboard updated.

**Any subscriber** — on any computer on the network — receives updates in real time simply by subscribing to the relevant topic. Any number of consumers, no polling, no additional infrastructure.

The hub routes messages. The TM is the publisher and source of truth. Consumers are read-only subscribers. This is MQTT used as intended.

The network layer features described below remain valid and unchanged.

#### Spectator View

A read-only mobile web UI that lets anyone in the venue follow the tournament in real time from their phone. No app install, no login, no configuration — scan a QR code on the wall and you're watching.

**Access:** The operator prints a QR code (or a single tournament QR is displayed on a screen) that opens the spectator UI in a browser with a topic parameter. The phone auto-subscribes to the tournament's MQTT feed. Zero UI footprint on the TM — nothing to enable, nothing to configure.

**Use cases:**

- **Can't see the board** — the venue is crowded, you're at the bar, you're playing on another board. Your phone becomes a personal scorecard for any match in the room.
- **What just happened?** — a roar goes up, you missed it. Check your phone for instant context instead of asking and getting five different versions.
- **The bragging problem** — "I hit 180, then 140, then..." — the replay settles it with the actual throws, not memory. Makes the bragging better because the details are real.
- **Visiting team** — in a league setting, the visiting team follows every match and the current standings from the moment they walk in. No waiting for announcements, no asking the operator. Hospitality through architecture.

**Features (high-impact, low-intrusion):**

- **Follow / Unfollow a match** — tap "follow" to see live play-by-play. Gentle vibration or alert when the leg ends or a notable score lands.
- **Match inspector** — per-leg throw breakdown, average per leg, time per throw. The bragging-player moment, with receipts.
- **"Replay last leg" timeline** — step through recorded throws from match events.
- **Search / filter players** — find a player and jump to their current match.
- **Persistent cached snapshot** — localStorage keeps last known state if connectivity drops. Phone shows stale-but-correct data rather than nothing.
- **Low-bandwidth mode** — only subscribe to match events for the match you're following.
- **Read-only by design** — no write, no claim, no referee assignments from spectators. Ever.

**UX & performance:**

- Publish snapshot at most once per meaningful state change (avoid flooding). Use delta events for live play.
- For large tournaments, clients subscribe only to relevant subtopics (`matches/{matchId}`) to reduce traffic.
- On connect, client reads retained snapshot then subscribes to real-time topics — ensures instant, correct UI state.
- Heartbeat from operator (TM presence) so spectators can show "live" vs "paused" indicator.

**Infrastructure cost:** Zero. The spectator view is just another MQTT subscriber. The hub, the broker, the topics — all already exist for TM ↔ Chalker communication. The spectator UI is a static HTML/JS page served from the same container. No additional backend, no additional deployment.

**Encryption & licensing model:**

The spectator topic is unencrypted and separate from the operational TM ↔ Chalker traffic:

| Topic | Encrypted | Licensed | Direction |
|-------|:---------:|:--------:|-----------|
| `newton/match/{tournamentId}` | Yes | Yes | TM ↔ Chalker (operational) |
| `newton/spectator/{tournamentId}` | No | No | TM → spectators (read-only) |

The TM publishes to the spectator topic as a side effect of processing incoming encrypted Chalker messages. The flow:

1. Licensed TM receives encrypted match data from Chalker via MQTT
2. TM decrypts, processes, updates bracket state
3. TM publishes a curated, unencrypted summary to the spectator topic

No license → no decryption → no incoming messages → nothing to publish → spectator topic is silent. The licensing model itself is the access control — no feature flags, no spectator-specific license check needed. The spectator view is a free feature, but it requires a licensed TM to have anything to show.

The spectator topic is not a decrypted mirror of the operational topic. The TM deliberately publishes only what spectators should see: scores, standings, match state. No assignment payloads, no internal IDs, no raw operational data.

#### Big Screen Display

The spectator topic powers more than phones — it's the foundation for a venue display. A TV, projector, or monitor running a full-screen browser subscribes to the same unencrypted spectator topic and becomes a live tournament board.

**What it shows:**

- Live bracket with match states updating in real time
- Current match scores as legs are played
- Leaderboard / standings after each completed match
- Celebration podium when the tournament completes

**How it works:** A static HTML page (e.g. `display.html`) served from the same container. Open it in a browser on any screen — a Raspberry Pi, a Smart TV browser, a laptop plugged into a projector. It subscribes to `newton/spectator/{tournamentId}`, reads the retained snapshot for instant state, and updates as events arrive. No interaction needed after initial load.

**Same model as the phone spectator view:** same topic, same data, different UI. The phone UI is compact and interactive (follow/unfollow, search players). The big screen UI is full-screen, auto-cycling, and hands-off. Both are read-only MQTT subscribers. The TM doesn't know or care what's consuming the feed.

**Infrastructure cost:** Still zero. Same broker, same topic, same published data. The display is just another subscriber.

---

### Overview

This document focuses on what changes are needed in **this project** (Tournament Manager and Chalker) to support network connectivity while preserving full standalone/offline functionality.

The network hub itself is a separate project (newton-hub). This document is about making TM and Chalker "network-ready" without breaking anything.

---

### Design Principle: Offline First, Network Optional

The apps must work identically in all scenarios:

| Scenario | TM | Chalker | Network |
|----------|-----|---------|---------|
| **Standalone** | Open HTML directly | Open HTML directly | None |
| **Docker (no hub)** | Served via nginx | Served via nginx | None |
| **Docker (with hub)** | Connected to hub | Connected to hub | Full sync |

**Rules:**
- Network code must be purely additive. No existing functionality depends on it.
- The newton-app Docker image must work standalone without newton-hub.
- Hub connectivity is an optional enhancement, not a requirement.
- Users who deploy only newton-app get the same experience as opening HTML directly.
- Network mode is toggled on/off in TM (master control).

#### Licensing Boundaries

| Feature | License Required | Notes |
|---------|:---:|-------|
| Tournament Manager (DE, future SE) | No | Fully open source with all features |
| Chalker | No | Fully open source, no limitations |
| QR code generation & scanning | No | Open source — the free path for match assignment and result transfer |
| Network bridge (MQTT) | **Yes** | Encryption is the license gate — TM cannot read unencrypted MQTT traffic |
| Series / League | **Yes** | Only available through the network bridge (no QR workflow) |

**Key principle:** Encryption serves double duty — it protects data in transit AND enforces licensing. No license = no decryption keys = MQTT is non-functional. QR bypasses this naturally because it's a visual/local channel requiring no encryption.

---

### Tournament Manager Changes

#### New UI Elements

**Lane Assignment on Match Start**
- When starting a match, option to assign to a lane
- Dropdown shows connected/available lanes (from hub) or manual entry (offline)
- Lane assignment stored in match data

**Network Status Indicator**
- Small indicator showing: Disconnected / Connected / Syncing
- Non-intrusive, doesn't block any operations
- Click to see connection details

**Match Dispatch Status**
- Visual feedback when match is sent to Chalker
- States: Not sent / Sending / Delivered / Failed
- Manual retry option if delivery fails

**Result Import**
- Receive results from Chalker via network
- QR code scanner fallback (camera-based)
- Manual entry always available (current behavior)

#### New JavaScript Module: `js/network-client.js`

```javascript
// Network client - optional module, app works without it
const NetworkClient = {
  socket: null,
  status: 'disconnected', // disconnected | connecting | connected

  // Attempt connection (fails silently if hub unavailable)
  init(hubUrl) { },

  // Query available lanes
  getLanes() { },

  // Send match to Chalker
  dispatchMatch(matchId, lane, matchData) { },

  // Listen for results
  onResult(callback) { },

  // Status change listener
  onStatusChange(callback) { }
};
```

#### Data Structure Extensions

**Match object additions:**
```javascript
{
  // Existing fields...

  // Network fields (optional, absent in offline mode)
  assignedLane: 5,           // Lane number if assigned
  dispatchStatus: 'delivered', // null | pending | delivered | failed
  dispatchTimestamp: 'ISO8601',
  resultSource: 'network'    // manual | network | qr
}
```

---

### Chalker Changes

#### New UI Elements

**Network Mode Toggle**
- Setting to enable/disable network mode
- When enabled: shows connection status, receives matches
- When disabled: current behavior (fully manual)

**Connection Status Indicator**
- Header area: Connected (green) / Disconnected (gray)
- Shows lane number when registered

**Incoming Match Alert**
- Modal/toast when match is dispatched from TM
- Shows players, format, accept/reject options
- Auto-accepts if Chalker is idle (configurable)

**Result Transmission**
- On match complete: auto-send results to hub
- Visual confirmation of delivery
- QR code generation as fallback

#### New JavaScript Module: `chalker/js/network-client.js`

```javascript
// Network client - optional module, app works without it
const ChalkerNetwork = {
  socket: null,
  status: 'disconnected',
  lane: null,

  // Connect and register lane
  init(hubUrl, laneNumber) { },

  // Send heartbeat (called on interval)
  heartbeat() { },

  // Listen for incoming matches
  onMatchAssigned(callback) { },

  // Send match result
  sendResult(matchId, resultData) { },

  // Status change listener
  onStatusChange(callback) { }
};
```

#### Data Structure Extensions

**State object additions:**
```javascript
{
  // Existing fields...

  // Network fields (optional)
  networkMode: false,
  matchId: 'FS-1-3',        // ID from TM (null if manual)
  tournamentId: 'uuid',      // Tournament reference
  resultSent: false          // Whether result was transmitted
}
```

---

### QR Code Communication (Open Source)

QR is the **free, unlicensed path** for match assignment and result transfer. It works in all scenarios — standalone, Docker, with or without a hub. No network or license required.

- **TM → Chalker**: Match assignment QR (player names, format, match/tournament IDs)
- **Chalker → TM**: Match result QR (raw visit scores, leg winners, checkout darts)
- **Fallback for network mode**: If MQTT delivery fails, QR is always available

The TM derives all statistics (averages, score ranges, high finishes, etc.) from raw visit scores in the result payload. Base64-encoded scores keep the payload compact (~380-500 bytes for typical Bo3-Bo5).

> **Full protocol specification:** See **Docs/QR.md** for payload schemas, field definitions, size analysis, encoding details, integrity checking, and verification procedures.

---

### Connection Detection

#### Hub URL Discovery

Priority order:
1. Explicit setting in app config
2. Query parameter: `?hub=wss://...`
3. Well-known path: `../hub` (relative to app)
4. Environment variable in Docker: `NEWTON_HUB_URL`
5. **mDNS** — only applicable to the local Docker + hub scenario. newton-hub advertises itself as `_newton._tcp.local` on the local network; TM and Chalker discover it automatically without manual IP/URL configuration. Not relevant for standalone (no hub) or cloud/VPS deployments (real domain + DNS). Browser JS has no mDNS API — discovery must happen server-side or via a Docker entrypoint helper that resolves the hub address and writes it to the app config before nginx starts.

#### Graceful Degradation

```javascript
// Pseudo-code for network initialization
async function initNetwork() {
  const hubUrl = discoverHubUrl();
  if (!hubUrl) return; // No hub configured, stay offline

  try {
    await NetworkClient.init(hubUrl);
    // Connected - enable network features
  } catch (e) {
    // Hub unavailable - continue in offline mode
    console.log('Hub unavailable, running offline');
  }
}
```

#### Reconnection

- Auto-reconnect with exponential backoff
- Max reconnect attempts before giving up
- Manual reconnect button in UI

---

### Message Schemas

#### Match Assignment & Result (via MQTT)

MQTT uses the **same payload schemas** as QR (see **Docs/QR.md**), wrapped in an encrypted envelope. The `t` field distinguishes message types (`"a"` for assignment, `"r"` for result). This means one schema definition, two transports.

The encrypted MQTT envelope adds:
- Encryption layer (license-gated — TM cannot decrypt without valid license keys)
- CRC-32 inside the encrypted payload for post-decryption integrity verification

#### Lane Registration (Chalker → Hub)
```json
{
  "type": "lane:register",
  "lane": 5,
  "deviceId": "uuid"
}
```

#### Heartbeat (Chalker → Hub)
```json
{
  "type": "heartbeat",
  "lane": 5,
  "status": "idle|busy",
  "matchId": "FS-1-3|null"
}
```

---

### File Structure

New files to add:

```
js/
  newton-integrity.js         # CRC-32 integrity module — shared with Chalker (new)
  qr-bridge.js                # TM: QR generation (assignments) + scanning (results) (new)
  network-client.js           # TM network client (new)

chalker/
  js/
    newton-integrity.js       # CRC-32 integrity module — same file as TM (new)
    qr-bridge.js              # Chalker: QR scanning (assignments) + generation (results) (new)
    network-client.js         # Chalker network client (new)

lib/
  qrcode-generator.min.js     # QR generation library — loaded on demand (new)
  html5-qrcode.min.js         # QR scanning library — loaded on demand (new)

chalker/lib/
  qrcode-generator.min.js     # Same, for Chalker (new)
  html5-qrcode.min.js         # Same, for Chalker (new)
```

Existing files to modify:

```
js/
  results-config.js      # Add serverId to global config (QR phase)
  main.js                # Init network client, add status indicator
  bracket-rendering.js   # Add QR display on Start Match, scan button, dispatch button

chalker/
  js/
    chalker.js           # Store network fields in state, generate result QR, scan assignment QR
  index.html             # QR display area on Match Complete, scan UI, network status indicator
tournament.html          # QR modal markup, camera viewport
```

---

### Implementation Phases

QR communication (Docs/QR.md) is the foundation for TM ↔ Chalker data exchange and must be completed before the MQTT network phases. QR is the free, offline path; MQTT is the licensed, networked path. Both use identical payload schemas.

#### QR Phase 1: Foundation
- Create `newton-integrity.js` (CRC-32 module, shared between TM and Chalker)
- Generate and persist `serverId` in TM global config (`results-config.js`)
- See **Docs/QR.md** for full phase breakdown

#### QR Phase 2: Match Assignment QR (TM → Chalker)
- TM generates assignment QR on "Start Match"
- Chalker scans QR to receive match details
- See **Docs/QR.md**

#### QR Phase 3: Match Result QR (Chalker → TM)
- Chalker generates result QR on Match Complete
- TM scans result QR and applies to bracket
- See **Docs/QR.md**

#### Network Phase 1: Network Mode Toggle (TM)
- Add network mode on/off toggle to TM settings
- When off: current behavior, no network features visible
- When on: attempt hub connection, show status indicator

#### Network Phase 2: Chalker Network Client
- Add network-client.js to Chalker
- Connection status indicator
- Receive match assignments
- Send results on completion

#### Network Phase 3: TM Network Client
- Add network-client.js to TM
- Lane status display
- Match dispatch UI
- Result reception

#### Network Phase 4: Polish
- Reconnection handling
- Error states and recovery
- Settings UI for network config

---

### Open Questions (App-Side)

1. **Network mode default:** Opt-in (must enable) or auto-detect?

2. **Match ID format:** Use TM's internal match ID, or hub assigns new ID?

3. **Partial results:** Send leg-by-leg updates, or only final result?

4. **Multiple tournaments:** Can one Chalker serve matches from different tournaments?

5. **Settings persistence:** Store hub URL and network preferences where? (LocalStorage config)

---

### Related Documents

- **Docs/QR.md**: QR communication protocol (payload schemas, encoding, integrity)
- **CHALKER-PERSISTENCE.md**: Chalker's offline storage architecture
- **CHANGELOG.md**: Version history
- **README.md**: Project overview

---

### Hub Reference (Separate Project)

The newton-hub handles:
- WebSocket server
- Message routing (pub/sub)
- Lane registry
- License validation
- Health monitoring

See newton-hub repository for hub-specific documentation.
