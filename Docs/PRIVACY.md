# Privacy Architecture

**NewTon DC Tournament Manager: Total Privacy by Design**

---

## Overview

NewTon's privacy model is simple: **your data lives in your browser, period**. This isn't a privacy policy you have to trust - it's an architectural guarantee. Your tournament data physically cannot leave your device unless you explicitly export and share it.

**The Guarantee:**
- All tournament data stored in browser localStorage only
- No analytics, no telemetry, no tracking
- No external dependencies or CDN calls
- Works 100% offline (even without internet)
- Demo site operates identically - your data still never leaves your device

**Privacy by architecture, not by policy.** The system is designed so that even if we wanted to collect your data, we couldn't.

---

## How It Works: Browser LocalStorage

### What Is LocalStorage?

LocalStorage is a browser feature that stores data **on your computer**, isolated per website domain. When NewTon saves your tournament, it goes into your browser's localStorage - a sandboxed storage area that:

- **Exists only on your device** - Not sent to any server
- **Domain-isolated** - Only NewTon can access NewTon's data (other websites cannot read it)
- **Persistent** - Survives browser restarts and computer reboots
- **Private** - Stored in your browser's profile directory on your hard drive

### Technical Details

**Storage Location (Examples):**
- **Chrome/Edge**: `%LocalAppData%\Google\Chrome\User Data\Default\Local Storage` (Windows)
- **Firefox**: `~/.mozilla/firefox/[profile]/storage/default` (Linux/Mac)
- **Safari**: `~/Library/Safari/LocalStorage` (Mac)

**Storage Limits:**
- Most browsers allow 5-10MB per domain
- NewTon uses ~1-2MB for typical tournaments
- 32-player tournament with full history: ~110KB

**Who Can Access Your Data:**
1. **You** - Through NewTon's interface
2. **Browser Developer Tools** - You can inspect localStorage directly
3. **Nobody else** - Not even NewTon's authors can access your data

### What This Means

When you run a tournament:
1. You open `tournament.html` (locally or on demo site)
2. NewTon loads data from **your browser's localStorage**
3. All processing happens **in your browser** (JavaScript on your device)
4. Changes are saved back to **your browser's localStorage**
5. **Nothing is transmitted anywhere**

Even on the demo site (https://darts.skrodahl.net), the server only delivers the HTML/CSS/JavaScript files. Once loaded, all data stays in your browser.

---

## What NewTon Doesn't Do

### No Analytics
- No Google Analytics
- No visitor tracking
- No usage statistics
- No page view counters

### No Telemetry
- No error reporting to external servers
- No performance metrics collection
- No feature usage tracking

### No External Dependencies
- No CDN (Content Delivery Network) calls
- No external fonts loaded from Google/Adobe
- No external JavaScript libraries from CDN
- All assets served from the same domain or included in the HTML file

### No Cookies
- No tracking cookies
- No session cookies
- No authentication cookies
- Browser localStorage only (not cookies)

### No User Accounts
- No registration required
- No login system
- No passwords to remember
- No email addresses collected

**Result:** NewTon cannot "phone home" even if it wanted to. There's no analytics endpoint, no telemetry server, no external service to send data to.

---

## Storage Architecture: Isolated and Deletable

### Per-Tournament Isolation (v4.0+)

Starting with version 4.0, NewTon uses per-tournament storage isolation:

**How It Works:**
```
localStorage:
  tournament_1729251357350        → Tournament data
  tournament_1729251357350_history → Transaction history
  tournament_1729456789123        → Different tournament
  tournament_1729456789123_history → Its history
  dartsTournaments                 → Tournament registry
  dartsGlobalConfig               → Global settings
  dartsSavedPlayers               → Saved player names
```

**What This Means for Privacy:**
- Each tournament stores its data in dedicated keys
- Deleting a tournament removes **all** associated data (no residue)
- Tournament A's data cannot contaminate Tournament B's data
- Clean data deletion - when you delete a tournament, it's truly gone

### Complete Data Deletion

**When you delete a tournament:**
1. Tournament data removed from registry
2. Tournament matches/players deleted
3. Transaction history deleted (per-tournament key)
4. **Zero traces left** - complete removal

**Before v4.0:** Deleting a tournament could leave transaction residue in global history.
**v4.0 and later:** Complete isolation means complete deletion.

---

## Export Privacy: What's In Your Files

### What's Included in Exports

When you export a tournament (v4.0+ format):
```json
{
  "exportVersion": "4.0",
  "name": "Tournament Name",
  "date": "2025-10-23",
  "players": [...],           // Tournament players
  "matches": [...],           // Match results
  "bracket": [...],           // Bracket structure
  "placements": {...},        // Final rankings
  "history": [...],           // Transaction history for undo
  "playerList": [...],        // Saved players snapshot
  "exportedAt": "timestamp"
}
```

**What's NOT Included:**
- ❌ Other tournaments' data
- ❌ Your browser information
- ❌ Your IP address or location
- ❌ Global configuration (stays private)
- ❌ Any personal information beyond what you entered (player names)

### Export File Privacy

**Your export file contains:**
- ✅ Only the data you entered (tournament name, player names, match scores)
- ✅ Only the specific tournament you exported
- ✅ Nothing NewTon added automatically (no IDs, no metadata beyond timestamps)

**Sharing Exports:**
If you share an export file, recipients will see:
- Tournament name and date
- Player names you entered
- Match results and final placements
- **Nothing else** - no hidden metadata, no browser fingerprints

---

## Demo Site Model: Same Privacy Guarantees

### How the Demo Site Works

**Demo Site:** https://darts.skrodahl.net

**Privacy Model:**
1. Server delivers HTML/CSS/JavaScript files (one-time download)
2. Your browser runs the application locally
3. All data stored in **your browser's localStorage** (same as running locally)
4. Server never receives any tournament data
5. **Your data never leaves your browser**

### Server-Side Architecture

**What the server does:**
- ✅ Serves static HTML/CSS/JavaScript files
- ✅ Provides optional "Shared Tournaments" folder (pre-created demo tournaments)
- ✅ Returns list of available shared tournaments (filenames only)

**What the server does NOT do:**
- ❌ Does not receive your tournament data
- ❌ Does not log your actions
- ❌ Does not track your usage
- ❌ Does not see your localStorage data

**REST API Disabled on Demo Site:**
The demo site has the REST API disabled (`NEWTON_API_ENABLED=false`), meaning:
- No upload functionality available
- No delete functionality available
- Read-only access to shared tournaments
- **Impossible for your data to leave your device**

### Privacy Banner

The demo site displays a privacy banner:

> 📍 Demo Site. Everything you do is stored locally in your browser. Your data never leaves your device.

This isn't just a policy statement - it's an architectural guarantee. Even the server administrator cannot access your tournament data because it never reaches the server.

---

## Self-Hosting Considerations: The REST API Exception

### When Privacy Model Changes

NewTon includes an **optional REST API** for self-hosters who want to share tournaments across devices or users. This is the **only exception** to the "data never leaves your device" model.

**REST API Features (when enabled):**
- Upload tournament exports to server
- Download shared tournaments from server
- Delete tournaments from server
- List available shared tournaments

### Privacy Implications

**If REST API is enabled on your self-hosted instance:**

**What gets sent to the server:**
- ✅ Tournament export files you explicitly upload
- ✅ Filenames and metadata of uploaded tournaments

**What does NOT get sent:**
- ❌ Tournaments you don't upload
- ❌ Your browser's localStorage content
- ❌ Your IP address (unless server logging enabled)
- ❌ Analytics or telemetry of any kind

**Control:**
- **You decide** what to upload (manual action required)
- **You can disable** the REST API entirely via `NEWTON_API_ENABLED=false`
- **You control the server** (self-hosted means you own the data)

### Recommended Privacy Configuration

**For maximum privacy (demo sites, public deployments):**
```yaml
environment:
  - NEWTON_API_ENABLED=false  # Disable server uploads
  - NEWTON_DEMO_MODE=true     # Show privacy banner
```

**For private self-hosting (trusted environment):**
```yaml
environment:
  - NEWTON_API_ENABLED=true   # Allow tournament sharing
  # Data stays on your server, under your control
```

**For public self-hosting (club website):**
```yaml
environment:
  - NEWTON_API_ENABLED=true   # Members can share tournaments
  # Consider: Only allow uploads from authenticated users
  # Consider: Add nginx access controls
```

### Self-Hosting Privacy Guarantee

**Even with REST API enabled:**
- Data only leaves your device when you click "Upload to Server"
- Data goes to **your server** (not a third party)
- No telemetry or analytics ever sent anywhere
- You control who has access to the server
- You can delete all data at any time

**Self-hosting means data sovereignty.** Your tournament data lives on your infrastructure, under your control.

### Security Headers and Privacy

Version 4.0.0 Docker images include comprehensive security headers that complement NewTon's privacy-by-architecture model:

**Privacy-Enhancing Headers:**
- **Referrer-Policy: strict-origin-when-cross-origin** - Reduces data leakage by limiting referrer information sent to other sites
- **Content-Security-Policy (CSP)** - Prevents unauthorized network requests and blocks loading external resources, ensuring data cannot be exfiltrated
- **Permissions-Policy** - Disables browser features (geolocation, microphone, camera) that could compromise privacy

**Additional Security Headers:**
- X-Frame-Options (prevents clickjacking)
- X-Content-Type-Options (prevents MIME sniffing)
- Server tokens hidden (reduces information disclosure)

These headers are enabled by default in Docker deployments with no configuration required. They achieve an **A grade** on [securityheaders.com](https://securityheaders.com).

**Why This Matters for Privacy:**
- CSP prevents any script from making unauthorized network requests
- Referrer-Policy limits what information leaks when you click links
- Combined with localhost-only storage, these headers create multiple layers of privacy protection

See [DOCKER-QUICKSTART.md](../DOCKER-QUICKSTART.md) for complete security headers documentation.

---

## Offline Operation: No Internet Required

### 100% Offline Capable

NewTon works completely offline because:
1. **No external dependencies** - Everything bundled in HTML file
2. **No API calls required** - All processing local
3. **LocalStorage doesn't need internet** - Browser-native feature
4. **No CDN calls** - Fonts and libraries included

### Use Cases

**Venue without internet:**
1. Download `tournament.html` while you have internet
2. Copy to USB drive
3. Open on tournament laptop (no internet needed)
4. Run entire tournament offline
5. Export results when done
6. Upload results later when internet available

**Air-gapped security:**
- Run tournaments on isolated networks
- No data leakage possible (literally no network)
- Perfect for privacy-critical environments

**Mobile offline:**
- Works on tablets/phones without data connection
- Great for traveling to venues
- LocalStorage persists across airplane mode

### Testing Offline Operation

**Try it yourself:**
1. Open NewTon (locally or demo site)
2. Disconnect from internet
3. Create tournament, add players, run matches
4. Export tournament
5. **Everything works** - no internet required

---

## Frequently Asked Questions

### Can NewTon track me even if I run it locally?

**No.** When you open `tournament.html` directly from your file system, there's literally no network connection to send data anywhere. JavaScript running in `file://` protocol cannot make network requests without explicit permission.

### Can the demo site see my tournament data?

**No.** The demo site server only delivers the HTML/CSS/JavaScript files once. After that, your browser runs the application locally. All data is stored in your browser's localStorage, which the server cannot access.

### What if I use browser sync (Chrome sync, Firefox sync)?

**Your choice.** If you have browser sync enabled, your browser *may* sync localStorage data across your devices (depending on browser settings). This is a browser feature, not a NewTon feature. Your data still doesn't go to NewTon - it goes to Google/Mozilla's sync servers (if you've enabled that).

To avoid sync:
- Use a browser profile without sync enabled
- Use private/incognito mode (data deleted when closed)
- Disable localStorage sync in browser settings

### What about browser extensions?

**Browser extensions can access localStorage.** If you have extensions installed, they *could* theoretically read NewTon's localStorage data. This is true for any website - it's a browser security model limitation.

For maximum privacy:
- Use a clean browser profile without extensions
- Review extension permissions
- Use dedicated browser for sensitive data

### Does NewTon comply with GDPR?

**GDPR doesn't apply to NewTon in most cases** because:
1. No data processing by NewTon (data stays on your device)
2. No personal data collected by NewTon's authors
3. Self-hosting means you are the data controller

**If you collect player data (names, emails):**
- You are responsible for GDPR compliance
- NewTon is just a tool (like Excel)
- Same rules apply as any record-keeping system

### Can I verify these privacy claims?

**Yes! NewTon is open source.**

**Verify yourself:**
1. View source code: https://github.com/skrodahl/NewTon
2. Inspect network requests in browser DevTools (should be zero)
3. Examine localStorage in browser DevTools
4. Read the HTML file directly (all code visible)
5. Use browser privacy tools (e.g., Privacy Badger, uBlock Origin - should show zero trackers)

**Don't trust, verify.** The privacy model is verifiable by design.

### What data does NewTon actually store?

**In LocalStorage:**
- Tournament name, date, status
- Player names and statistics (what you enter)
- Match results and scores (what you enter)
- Bracket structure and placements
- Transaction history (for undo)
- Global configuration (point values, settings)
- Saved player names (optional convenience feature)

**That's it.** No IP addresses, no browser fingerprints, no usage analytics, no timestamps beyond tournament creation date.

### What if I delete my browser data?

**Your tournaments are deleted.** LocalStorage is part of browser data, so clearing browser storage clears your tournaments. This is expected behavior.

**Backup strategy:**
1. Export tournaments regularly
2. Keep export files in safe location
3. Import when needed

**Think of it like:**
- LocalStorage = RAM (temporary working storage)
- Export files = Hard drive (permanent backup)

### Can tournament participants see each other's data?

**Only what you choose to display.** If you project the bracket on a screen, participants see what's on screen. NewTon doesn't automatically share data between users.

**For multi-user scenarios:**
- Each person's browser has their own localStorage
- Use export/import to share tournaments between devices
- Or use self-hosted REST API with access controls

---

## Summary: Privacy Guarantees

**What NewTon guarantees:**
- ✅ Your data stored in your browser's localStorage only
- ✅ No analytics, telemetry, or tracking of any kind
- ✅ No external dependencies or network calls
- ✅ Works 100% offline without internet
- ✅ Complete data deletion when you delete tournaments
- ✅ Export files contain only the data you entered
- ✅ Demo site operates with same privacy model
- ✅ Open source - verify the claims yourself

**The only exception:**
- ❌ REST API (optional, disabled by default on demo site) can upload exports to self-hosted server
- ✅ Even then, you control what's uploaded and where it goes

**Privacy by architecture.** NewTon is designed so your data cannot leave your device unless you explicitly export and share it. This isn't a promise - it's how the system is built.

---

**Questions about privacy?** [Open an issue](https://github.com/skrodahl/NewTon/issues) or review the source code directly.

**Last updated:** October 2025 (v4.0.0)
