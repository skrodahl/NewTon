# Release Notes — v5.1.8 — Off the Wire

**NewTon DC Tournament Manager v5.1.8 — September 13, 2026**

---

## Overview

A dart that catches the wire looks like a good throw and scores nothing. Three things in NewTon were doing exactly that — working as far as anyone could see, achieving nothing at all — and this release takes them off the wire.

The largest affects anyone running the Docker container on Linux, where **uploading a tournament has been failing silently**. If you have ever wondered why Shared Tournaments stayed empty, this is why.

---

## Tournament Upload on Linux

The container stores tournaments in a folder supplied by the host. When that folder does not already exist, Docker creates it — owned by `root`. The web server inside the container does not run as root, so it could not write there, and every upload failed.

Nothing announced this. The tournament simply never arrived, and the folder stayed empty. Tools that manage container stacks for you, like Dockge or Portainer, make it the normal outcome rather than the exception, because they create the folder themselves.

It also hid unusually well: on macOS and Windows, Docker's file sharing papers over the ownership mismatch entirely, so the same setup works there. Only real Linux deployments were affected — which is to say, most servers.

The container now checks at startup whether it can actually write to that folder and corrects it if not, saying so in its log. A folder you have already set up correctly is left exactly as it is. If it cannot fix things, it says so loudly, with the command to run — rather than failing silently hours later when you are trying to save a tournament.

---

## Network Handover Works

Sending a match straight to a Chalker over the local network — introduced as an experiment in v5.1.7-beta.1 — never worked. Every transfer returned a server error, for the same reason as above: it writes to the same folder.

It works now, and has been run end to end: a match dispatched from the Tournament Manager appearing on a phone across the room, scored, and the result coming back on its own. No scanning at either end.

It is still **experimental and still switched off by default**. It has not yet been through a real tournament — a full evening of phones sleeping, being pocketed, and wandering between access points is the test that matters, and it has not had one. Turn it on under Config → Chalker → Handover if you would like to help find out — it needs the Docker image, since it relies on the server that comes with it.

One smaller change with it: when something does go wrong, the Tournament Manager now shows you what the server actually said. Previously it reported a bare failure and discarded the explanation — which is the only reason this took as long to find as it did.

---

## The Welcome Guide

Opening NewTon for the first time — a fresh install, or simply a new browser — shows a short welcome guide after a couple of seconds. It had been displaying *"Overview: undefined"* and none of its actual content. The **Common Issues** list inside the help window was broken in the same way, and had never displayed at all.

Both are fixed. If you have used NewTon for a while you will never have seen either, which is precisely why it went unnoticed: the only people affected were people opening it for the very first time.

---

## Analytics, Explained

Press **F1** on the Analytics page and you now get an explanation of what is actually there.

The built-in help had only ever described the Register — the tournament and match records — because that is all Analytics was when the help was written. Everything added since, which is most of what people use it for, went undocumented.

- **The four views** — Dashboard, Leaderboard, Players and Register, and what each is for.
- **The Lens**, including the part that is easy to miss: you set it under Register → Tournaments, but it governs the Dashboard, Leaderboard and Players as well. If a number ever looks wrong, the indicator at the top of the page is the first thing to check — and it is usually the answer.
- **Original and Current points**, and the Ranking and Attendance toggles — what each one changes, and the reassurance that none of them alters a stored result.
- **What the Leaderboard columns mean**, including why the three-dart average is blank for matches entered by hand: only the Chalker records the individual throws it needs.
- **How players are matched by name** across tournaments, which is why consistent spelling at registration is worth the small effort.

Automatic backup also has help for the first time. Uploading a finished tournament to your server without anyone having to remember is one of the better reasons to run the container, and it was not mentioned anywhere in the app.

---

## A Password for Maintenance Mode

An Analytics-only instance hides tournament management, and adding `?tm` to the address brings the full Tournament Manager back for that browser — which is how a shared instance gets maintained. Until now anyone who knew that could use it.

Set `NEWTON_TM_PASSWORD` in your container configuration and a password is required. A wrong or missing one simply loads the ordinary Analytics page — no error, no prompt, no hint that a maintenance mode exists at all.

Leave it unset and nothing changes. To be plain about the limits: this is one shared password, not user accounts, and it appears in the server's log and your browser history. It stops a curious club member. An instance reachable beyond people you broadly trust still wants a password at the web server itself.

---

## Analytics Tools Put Away

Carried over from v5.1.8-beta.1: **Export Register**, **Import Register** and **Import Tournament** no longer appear on an Analytics-only instance. One of them replaces the stored match history for everyone using it, and a shared Analytics address is something a whole club can be handed. They remain available in the full Tournament Manager, where maintenance is done.

---

## Migration

No migration required. Fully compatible with all existing tournament data, match history, and Analytics.

**Docker users on Linux should update.** If tournament upload has never worked for you, this release is the reason why and the fix for it. Nothing needs to be done by hand — the container sorts it out at startup and logs what it did.

This release moves `:latest` forward to v5.1.8. Installed Chalker apps refresh automatically on their next online launch.

---

*Fun fact: the network layer was blamed for a week. The network layer was fine. Docker had created a folder as the wrong user, and nothing in the chain was willing to say so out loud.*

*NewTon DC Tournament Manager v5.1.8 — Off the Wire.*
