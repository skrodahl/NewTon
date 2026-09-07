# Release Notes — v5.1.8-beta.1 — Behind the Bar

**NewTon DC Tournament Manager v5.1.8-beta.1 — September 7, 2026**

*Beta — a small, targeted change to the analytics-only deployment. Feedback and bug reports welcome on [GitHub](https://github.com/skrodahl/NewTon/issues).*

---

## Overview

An Analytics instance used to be something one person ran. Now it is something a whole club can be given the address to — which is the point of it, and which quietly changes who is standing in front of those buttons at the top of the page.

One of them, **Import Register**, replaces the stored match history. Not for one person: for everyone using that instance. It sat in plain sight next to the scope selector, one file picker away from a curious member and a season's worth of results.

---

## What Changed

**Export Register**, **Import Register** and **Import Tournament** no longer appear in analytics-only mode. They are maintenance tools, and they now behave like maintenance tools: put away, rather than left on the bar.

Nothing is lost. Both tools remain exactly where they have always been in the full Tournament Manager, which is where the person doing maintenance is working anyway. Nothing new to configure.

Deleting a tournament from the register was already behind its own server setting, switched off by default, and is unchanged. The ordinary Tournament Manager is untouched: this affects the analytics-only deployment only, and everything on the Analytics page that is about *reading* your history stays exactly where it was.

---

## What This Is Not

This is not access control, and it would be wrong to describe it as such.

What this release removes is the *accident* — a destructive button sitting in plain view, inviting a click from somebody who came to look at the leaderboard. It is the difference between a tool being put away and a tool being locked away, and only the first of those is claimed here.

If your Analytics instance is reachable by anyone beyond the people you trust with the results, put it behind a password at the web server. That is what actually restricts access, and it is what the deployment documentation recommends.

---

## On the Network Beta

Network match handover, introduced in v5.1.7-beta.1, is **still experimental and still does not work** — transferring a match to a lane returns a server error. It remains switched off by default and nothing in this release depends on it.

---

## Migration

No migration required. Fully compatible with all existing tournament data, match history, and Analytics. Nothing is removed — the tools are hidden from one deployment mode and remain available in the full Tournament Manager. Installed Chalker PWAs refresh to the new version automatically on their next online launch.

`:latest` still points at v5.1.7. This beta is tagged separately.

---

*Fun fact: the buttons had been there since Analytics was a tool with exactly one user. Nothing about them changed — the room did.*

*NewTon DC Tournament Manager v5.1.8-beta.1 — Behind the Bar.*
