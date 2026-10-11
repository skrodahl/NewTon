# Release Notes — v5.4.5 — Look Sharp!

**NewTon DC Tournament Manager v5.4.5 — October 11, 2026**

---

## Overview

The bracket is what everything on a club night runs around, and this release gives it its due. In the app, the line that shows where a match's loser goes now takes a clear, deliberate route. On the website, the bracket gets its own step in How a night runs. The README is rewritten to match the website, there's a new image for when the site is shared, and the Docker guide gives the right address again.

---

## The Bracket: Loser Drops You Can Follow

Click a match in a double elimination bracket and a dashed line shows where its loser goes on the backside.

- **The line now bends halfway:** out of the match, across in the gap nearest the middle, and straight into the player row it fills, an S or a Z. With the finals in the middle, that's usually the open space beside the finals.
- **It never runs along another line.** The bend is only placed where it crosses no match card and doesn't follow any of the bracket's own lines. Before, it turned in the gap just before the backside column, right on top of the backside's own forks, and was hard to follow.
- **Where there's no such place,** such as into the backside's first round, the line keeps its old route, which reads fine there. If that route shares its gap with a fork, the line now sits beside the fork rather than on it.

Only how the bracket is drawn has changed. Results, progression and undo are untouched.

---

## The Website

- **The bracket, centre stage.** How a night runs gets a new step 3, "All night long": the whole double elimination bracket, full width, with what it does. Follow a player, click a match to see where the winner goes and where the loser drops, finals in the middle or on the right, every format drawn its own way.
- **A new picture in the hero:** an 8-player single elimination bracket with the final in the middle and a semifinal live, readable at a glance. The hero's pictures are now just pictures; the timeline below is where you click to see the screenshots full size.
- **A new share image.** When the site is shared in a chat or on social media, the preview shows the website's own look: the headline, the bracket and the Chalker.

---

## The README, Rewritten

The README on GitHub had grown one addition at a time. It now follows the website: the headline and share image, the three promises, how a night runs in seven steps, a table of the five formats with their player ranges, the features grouped by the night (before the draw, during, after the final, built to last), and the three ways to get started.

The description for AI services (`llms.txt`) now calls the software by its full name throughout: NewTon DC Tournament Manager. NewTon DC is the darts club that makes it.

---

## Docker: Port 2020

The Docker guides now give the right address: **http://localhost:2020**. The container serves on port 2020 ("Double 20", double tops), and the compose files publish the same port. The guides had said 8080. The tip for when port 2020 is already taken now shows the change that works: a different host port in `docker-compose.yml`.

---

## Migration

No migration required. Fully compatible with all existing tournament data, match history, Analytics and settings. Nothing stored has changed; the export format is unchanged.

This release moves `:latest` forward to v5.4.5. Installed Chalker apps refresh automatically on their next online launch.

---

*NewTon DC Tournament Manager v5.4.5 — Look Sharp!*
