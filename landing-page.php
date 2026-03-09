<?php
// Landing page - rendered when NEWTON_LANDING_PAGE=true
// This file is included by tournament.php (renamed from tournament.html in Docker)
// It is never accessed directly by browsers - only via PHP include
$githubUrl = htmlspecialchars(getenv('NEWTON_GITHUB_URL') ?: 'https://github.com/skrodahl/NewTon');
$baseUrl = htmlspecialchars(getenv('NEWTON_BASE_URL') ?: '');
$ogUrlTag = $baseUrl ? "\n    <meta property=\"og:url\" content=\"{$baseUrl}\">" : '';
$canonicalTag = $baseUrl ? "\n    <link rel=\"canonical\" href=\"{$baseUrl}\">" : '';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NewTon DC - Free Open-Source Darts Tournament Manager</title>
    <link rel="icon" type="image/jpeg" href="images/logo.jpg">
    <link rel="stylesheet" href="css/landing.css">

    <!-- SEO Meta Tags -->
    <meta name="description" content="Free, open-source darts tournament manager with single and double elimination brackets. Offline-first, self-hostable, zero dependencies. Run professional darts tournaments from your browser.">
    <meta name="keywords" content="darts, tournament, bracket, double elimination, single elimination, tournament manager, darts scoring, score keeper, scoring app, darts app, tournament bracket, offline tournament, offline-first, PWA, self-hosted, open source, free, dart league, darts competition, 4 player tournament, 8 player tournament, 16 player tournament, 32 player tournament, dartboard, match management, referee management, lane management">

    <!-- Schema.org Structured Data -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "NewTon DC - Tournament Manager",
        "description": "Free, open-source darts tournament manager with single and double elimination brackets for 4 to 32 players. Offline-first, self-hostable, zero dependencies.",
        "applicationCategory": "SportsApplication",
        "applicationSubCategory": "Tournament Management",
        "operatingSystem": "Web Browser",
        "browserRequirements": "Chrome 80+, Firefox 75+, Safari 13+, Edge 80+",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
        },
        "license": "https://opensource.org/licenses/BSD-3-Clause",
        "isAccessibleForFree": true,
        "url": "<?= $githubUrl ?>",
        "downloadUrl": "<?= $githubUrl ?>",
        "screenshot": "<?= $baseUrl ?>/Screenshots/tournament-bracket-zoom.png",
        "featureList": "Single Elimination, Double Elimination, 4-32 Players, Offline-First, Lane Management, Referee Management, Match Undo System, JSON Import/Export, CSV Export, Multi-Tournament Support, Player Registry",
        "keywords": "darts, tournament, bracket, scoring, score keeper, offline, PWA, self-hosted, open source"
    }
    </script>

    <!-- Open Graph -->
    <meta property="og:type" content="website">
    <meta property="og:title" content="NewTon DC - Free Open-Source Darts Tournament Manager">
    <meta property="og:description" content="Professional single and double elimination darts tournament management. Offline-first, self-hostable, zero dependencies. No signup required.">
    <meta property="og:image" content="<?= $baseUrl ?>/Screenshots/tournament-bracket-zoom.png"><?= $ogUrlTag ?>

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="NewTon DC - Free Open-Source Darts Tournament Manager">
    <meta name="twitter:description" content="Professional single and double elimination darts tournament management. Offline-first, self-hostable, zero dependencies.">
    <meta name="twitter:image" content="<?= $baseUrl ?>/Screenshots/tournament-bracket-zoom.png"><?= $canonicalTag ?>
</head>
<body>

    <!-- Header - matches tournament app style -->
    <div class="landing-container">
        <div class="landing-header">
            <div class="landing-header-top">
                <h1>
                    <img src="images/logo.jpg" alt="NewTon DC Logo" class="landing-logo"
                         onerror="this.outerHTML='<div class=\'landing-logo-placeholder\'>CLUB<br>LOGO</div>'">
                    NewTon DC - Tournament Manager
                </h1>
            </div>
        </div>
    </div>

    <!-- Hero -->
    <div class="hero">
        <p class="hero-tagline">Free, Open-Source Darts Tournament Manager</p>
        <p class="hero-description">
            Run professional single and double elimination darts tournaments entirely from your browser.
            No server, no database, no internet connection required. Your data never leaves your device.
        </p>
        <div class="highlights-grid">
            <div class="highlight-card">
                <div class="number">0</div>
                <div class="label">External Dependencies</div>
            </div>
            <div class="highlight-card">
                <div class="number">4-32</div>
                <div class="label">Players per Tournament</div>
            </div>
            <div class="highlight-card">
                <div class="number">~60MB</div>
                <div class="label">Docker Image Size</div>
            </div>
            <div class="highlight-card">
                <div class="number">100%</div>
                <div class="label">Client-Side Privacy</div>
            </div>
        </div>
        <div class="hero-buttons">
            <a href="?launch" class="btn-launch">Launch Tournament Manager</a>
            <a href="<?= $githubUrl ?>" class="btn-github">View on GitHub</a>
        </div>
    </div>

    <!-- Key Features -->
    <div class="features">
        <h2>Key Features</h2>
        <div class="features-grid">
            <div class="feature-card">
                <h3>Single &amp; Double Elimination</h3>
                <p>Professional bracket structures for 4 to 32 players. Frontside/backside brackets with automatic progression, walkovers, and placement tracking. Interactive bracket visualization with click-to-zoom match cards.</p>
            </div>
            <div class="feature-card">
                <h3>Lane &amp; Referee Management</h3>
                <p>Assign matches to dartboard lanes with conflict prevention. Smart referee suggestions ensure no player referees their own match.</p>
            </div>
            <div class="feature-card">
                <h3>Complete Undo System</h3>
                <p>Transaction-based history enables surgical undo of any match result. Recover from mistakes without resetting the entire tournament.</p>
            </div>
            <div class="feature-card">
                <h3>Import &amp; Export</h3>
                <p>JSON-based backup and sharing between devices. CSV export for results. Multi-tournament support with persistent player registry.</p>
            </div>
            <div class="feature-card">
                <h3>Chalker Scoring App</h3>
                <p>Tablet-optimized x01 scoring companion for referees. Installable as a PWA with full offline support. Live stats, match history, tiebreak warnings, and ton rings — everything a chalker needs at the board.</p>
            </div>
            <div class="feature-card">
                <h3>Offline-First Design</h3>
                <p>Runs entirely in your browser with zero external dependencies. No internet connection, server, or database required. Pure HTML5, CSS3, and JavaScript.</p>
            </div>
            <div class="feature-card">
                <h3>Total Privacy</h3>
                <p>All tournament data lives in your browser's localStorage. No cloud, no tracking, no external data sharing. Complete privacy by architecture.</p>
            </div>
            <div class="feature-card">
                <h3>Self-Hostable with Docker</h3>
                <p>Deploy on your own server in under 2 minutes. Lightweight Alpine container with nginx and optional REST API for tournament sharing.</p>
            </div>
        </div>
    </div>

    <!-- Screenshots -->
    <div class="screenshots">
        <h2>See It in Action</h2>

        <div class="screenshot-item">
            <h3>16-Player Tournament Bracket with Match Card Magic Zoom</h3>
            <img src="Screenshots/tournament-bracket-zoom.png" alt="16-player tournament bracket showing Match Card Magic Zoom and status bar" loading="lazy">
        </div>

        <div class="screenshot-item">
            <h3>Match Controls with Referee Suggestions</h3>
            <img src="Screenshots/match-controls.png" alt="Match controls showing referee suggestions and conflict detection" loading="lazy">
        </div>

        <div class="screenshot-item">
            <h3>Player Registration with Dynamic Help</h3>
            <img src="Screenshots/player-registration-help.png" alt="Player registration page with saved players and dynamic help system" loading="lazy">
        </div>

        <div class="screenshot-item">
            <h3>Tournament Setup</h3>
            <img src="Screenshots/tournament-setup.png" alt="Tournament setup page with name, date, and bracket configuration" loading="lazy">
        </div>

        <div class="screenshot-item">
            <h3>Tournament Winner Celebration</h3>
            <img src="Screenshots/celebration.png" alt="Tournament winner celebration screen" loading="lazy">
        </div>
    </div>

    <!-- Footer -->
    <div class="landing-footer">
        <p>
            NewTon DC Tournament Manager &mdash; BSD-3-Clause License &mdash;
            <a href="<?= $githubUrl ?>">GitHub</a> &mdash;
            <a href="<?= $githubUrl ?>/blob/main/Docs/PRIVACY.md">Privacy</a>
        </p>
    </div>

</body>
</html>
