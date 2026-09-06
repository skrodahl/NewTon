# Licensed Components

**Everything in this directory is under [`LICENSE.md`](LICENSE.md), not the
BSD 3-Clause License that covers the rest of the repository.**

Free to use right now — no key, no subscription, no registration. See Section 2
of `LICENSE.md` for the exact grant, and note that it is revocable for future
releases.

## What this is for

Network transfer of matches between the Tournament Manager and the Chalker over
the local network, using MQTT. It replaces the QR code round trip with a direct
connection when both are on the same LAN.

It is an **experimental proof of concept**. It may not work, and it may be
removed. The QR and manual entry paths are the supported ways to move match data
and are entirely unaffected by anything here.

See [`../Docs/NETWORK-LAYER.md`](../Docs/NETWORK-LAYER.md) for scope, design
decisions, and what the proof of concept is trying to establish.

## Why the separate licence

Network transfer may eventually become a paid feature. Keeping it in a
separately licensed directory from the very first commit preserves that option:
code published under BSD-3 stays BSD-3 for that version permanently, so the
boundary has to exist before the code does, not after.

That is the only reason. It is not a statement about quality, support, or how
finished anything is — and while Section 2 of `LICENSE.md` stands, it costs
users nothing.

## What lives here, and what does not

**Here:** the MQTT clients for both apps, their configuration, and any
vendored library they require.

**Not here:** anything the rest of the app depends on. Removing this directory
entirely must leave the Tournament Manager and the Chalker fully working. Call
sites in the BSD-licensed code are feature-detected guards and nothing more —
the same pattern used elsewhere in the codebase:

```js
if (typeof NetworkClient !== 'undefined' && NetworkClient.isConnected()) { ... }
```

No match progression, transaction history, or undo logic belongs in this
directory. Those are the application's core foundations, they stay BSD-licensed,
and the network layer is a transport for the payloads they already produce.
