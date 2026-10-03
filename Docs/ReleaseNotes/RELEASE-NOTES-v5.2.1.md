# Release Notes — v5.2.1 — Open Bar, Locked Cellar

**NewTon DC Tournament Manager v5.2.1 — October 4, 2026**

---

## Overview

A shared Analytics instance is meant for the whole club: members check the standings on their phones, and the venue computer sends each finished tournament there. Until now, the only way to stop strangers from uploading or deleting tournaments was to put the whole site behind a login, so members had to log in just to look.

This release separates the two. Reading is open to everyone. Changing anything needs a key that only the club has.

---

## An API Key for Writes

Set `NEWTON_API_KEY` on the Analytics instance, and every request that changes something must carry it: uploading or deleting a tournament, saving corrections, and relaying a backup on to another server. Reading never needs it, so the Analytics page, the tournament list and the tournament files stay open to everyone. Without the key, a write is refused.

On the venue computer, enter the same key in **Global Settings → Server & backup → Remote backup → API key**. It replaces the username and password, which are gone. Backups carry the key from then on.

With the key in place, you can remove the login from the web server in front of your Analytics instance. Members walk straight in.

Leave `NEWTON_API_KEY` unset and nothing changes: the API works as before, and you protect the instance the way you do today.

---

## Maintenance Works as Before

If you maintain the instance with `?tm` and a password (`NEWTON_TM_PASSWORD`), nothing changes for you. A page opened with the correct password is given the key, so correcting achievements and deleting tournaments work as they did. An instance without a `?tm` password never hands the key out.

Set the key on the instance that receives backups. On a venue computer that runs tournaments, its own Backup to server and Delete would then need `?tm` too.

---

## Credentials Stay Out of Tournament Files

Every tournament file carries a copy of the settings it was played with, so Analytics can score it with the original point values. That copy also included the remote username and password. Those files are exactly what a shared Analytics instance hands to everyone who opens it.

The copy now leaves out the API key and the old username and password, and so does the record Analytics keeps of each tournament.

**If you used a remote username and password before:** tournament files uploaded with earlier versions may contain them. Retire those credentials when you switch to the API key; once the login is removed from your web server, they no longer protect anything.

---

## Network Handover Stays at the Venue

Sending matches to Chalkers over the network is meant for the club's own network. On an Analytics-only instance (`NEWTON_MODE=analytics`), which is often public, it is now switched off.

---

## Migration

No migration required. Fully compatible with all existing tournament data, match history, Analytics and settings.

The remote username and password are removed from your settings the next time you save Server & backup. If your remote server still uses a login at the web server, uploads to it will stop working until you switch it to `NEWTON_API_KEY`.

This release moves `:latest` forward to v5.2.1. Installed Chalker apps refresh automatically on their next online launch.

---

*NewTon DC Tournament Manager v5.2.1 — Open Bar, Locked Cellar.*
