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
    <link rel="llms" href="llms.txt">
    <link rel="preload" href="fonts/Insignia-Regular.otf" as="font" type="font/otf" crossorigin>
    <link rel="preload" href="fonts/Manrope-VariableFont_wght.ttf" as="font" type="font/ttf" crossorigin>
    <link rel="stylesheet" href="css/landing.css">

    <!-- Google Search Console Verification -->
    <meta name="google-site-verification" content="ThljhtU_21C5vnMmp7H3GvlWL70ltl-U3Wy46WVe_HU">

    <!-- SEO Meta Tags -->
    <meta name="description" content="Free, open-source darts tournament manager with single and double elimination brackets. Offline-first, self-hostable, zero dependencies. Run tournaments from your browser.">
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
        "screenshot": "<?= $baseUrl ?>/Screenshots/newton-cartoon.jpg",
        "featureList": "Single Elimination, Double Elimination, 4-32 Players, Offline-First, Lane Management, Referee Management, Match Undo System, JSON Import/Export, CSV Export, Multi-Tournament Support, Player Registry",
        "keywords": "darts, tournament, bracket, scoring, score keeper, offline, PWA, self-hosted, open source"
    }
    </script>

    <!-- Open Graph -->
    <meta property="og:type" content="website">
    <meta property="og:title" content="NewTon DC - Free Open-Source Darts Tournament Manager">
    <meta property="og:description" content="Professional single and double elimination darts tournament management. Offline-first, self-hostable, zero dependencies. No signup required.">
    <meta property="og:image" content="<?= $baseUrl ?>/Screenshots/newton-poster-throw.jpg"><?= $ogUrlTag ?>

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="NewTon DC - Free Open-Source Darts Tournament Manager">
    <meta name="twitter:description" content="Professional single and double elimination darts tournament management. Offline-first, self-hostable, zero dependencies.">
    <meta name="twitter:image" content="<?= $baseUrl ?>/Screenshots/newton-poster-throw.jpg"><?= $canonicalTag ?>
</head>
<body>

    <!-- Header -->
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
        <div class="hero-image">
            <img src="Screenshots/newton-cartoon.jpg" alt="NewTon DC Tournament Manager — retro comic illustration of a darts tournament bracket in action">
        </div>
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
                <div class="number">2</div>
                <div class="label">Tournament Formats</div>
            </div>
            <div class="highlight-card">
                <div class="number">100%</div>
                <div class="label">Client-Side Privacy</div>
            </div>
        </div>
        <div class="hero-buttons">
            <a href="?launch" class="btn-launch" target="_blank">Launch Tournament Manager</a>
            <a href="chalker/" class="btn-chalker" target="_blank">Open Chalker App</a>
            <a href="<?= $githubUrl ?>" class="btn-github">View on GitHub</a>
        </div>
    </div>

    <!-- Divider -->
    <div class="section-divider"><hr></div>

    <!-- Get Started -->
    <div class="get-started">
        <h2>Get Started</h2>
        <div class="get-started-grid">
            <div class="get-started-card">
                <h3>Local Use</h3>
                <p>Download the latest release, unzip, and double-click <code>tournament.html</code>. No installation required — runs entirely in your browser.</p>
                <a href="https://github.com/skrodahl/NewTon/releases/latest" class="btn-github" target="_blank">Download Latest Release</a>
            </div>
            <div class="get-started-card">
                <h3>Self-Hosted</h3>
                <p>Deploy on your own server in under 2 minutes. Lightweight Docker container with nginx — perfect for club or venue use.</p>
                <a href="https://github.com/skrodahl/NewTon/blob/main/DOCKER-QUICKSTART.md" class="btn-github" target="_blank">Docker Quickstart</a>
            </div>
        </div>
    </div>

    <!-- Divider -->
    <div class="section-divider"><hr></div>

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
                <p>Assign matches to dartboard lanes and referees with smart conflict detection. Players officiating a match are blocked from playing until they're free, and players in a live match are excluded from referee selection. Suggestions prioritise recent losers, winners, and referee history.</p>
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

    <!-- Divider -->
    <div class="section-divider"><hr></div>

    <!-- Feature Showcase -->
    <div class="showcase">
        <h2>See It in Action</h2>

        <div class="showcase-item">
            <div class="showcase-image">
                <img src="Screenshots/tournament-bracket-zoom.png" alt="16-player tournament bracket showing Match Card Magic Zoom and status bar" loading="lazy">
            </div>
            <div class="showcase-text">
                <span class="showcase-label">Bracket View</span>
                <h3>Interactive Tournament Bracket</h3>
                <p>The full bracket rendered as a zoomable, pannable canvas. Click any match card to zoom in and see player details, scores, and match status. Progression lines trace the path from round one to the final. Works beautifully from 4-player brackets all the way up to 32.</p>
            </div>
        </div>

        <div class="showcase-item">
            <div class="showcase-image">
                <img src="Screenshots/match-controls.png" alt="Match controls showing referee suggestions and conflict detection" loading="lazy">
            </div>
            <div class="showcase-text">
                <span class="showcase-label">Match Controls</span>
                <h3>Run Your Tournament from One Panel</h3>
                <p>The Match Controls panel is your command center. See which matches are ready, assign lanes and referees, start matches, and record results — all without leaving the page. Smart referee suggestions highlight available players and flag conflicts automatically.</p>
            </div>
        </div>

        <div class="showcase-item">
            <div class="showcase-image">
                <img src="Screenshots/player-registration-help.png" alt="Player registration page with saved players and dynamic help system" loading="lazy">
            </div>
            <div class="showcase-text">
                <span class="showcase-label">Player Management</span>
                <h3>Registration Made Simple</h3>
                <p>Add players from your saved roster or register new ones on the spot. The dynamic help system guides first-time users through every step. Player data persists across tournaments, so your regulars are always one click away.</p>
            </div>
        </div>

        <div class="showcase-item">
            <div class="showcase-image">
                <img src="Screenshots/tournament-setup.png" alt="Tournament setup page with name, date, and bracket configuration" loading="lazy">
            </div>
            <div class="showcase-text">
                <span class="showcase-label">Setup</span>
                <h3>From Zero to Bracket in 60 Seconds</h3>
                <p>Name your tournament, pick a date, choose single or double elimination, and you're ready to go. The bracket size adapts automatically to your player count. No configuration rabbit holes — just the essentials.</p>
            </div>
        </div>

        <div class="showcase-item">
            <div class="showcase-image">
                <img src="Screenshots/tournament-bracket.png" alt="Tournament bracket showing fair draw seeding and BYE placement" loading="lazy">
            </div>
            <div class="showcase-text">
                <span class="showcase-label">Fair Draw</span>
                <h3>Intelligent Seeding &amp; BYE Handling</h3>
                <p>The draw algorithm distributes players fairly across the bracket, and when the field isn't a perfect power of two, BYEs are placed strategically so no player gets an unfair advantage. Real players advance automatically past empty slots — no manual intervention needed.</p>
            </div>
        </div>

        <div class="showcase-item">
            <div class="showcase-image">
                <img src="Screenshots/celebration.png" alt="Tournament winner celebration screen" loading="lazy">
            </div>
            <div class="showcase-text">
                <span class="showcase-label">Tournament Complete</span>
                <h3>Celebrate the Champion</h3>
                <p>When the final dart lands, the winner gets the spotlight they deserve. Full podium results, final standings, and the satisfaction of a tournament well run. Export results as CSV for your league records or share the JSON for next time.</p>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <div class="landing-footer">
        <p>
            NewTon DC Tournament Manager &mdash; BSD-3-Clause License &mdash;
            <a href="<?= $githubUrl ?>">GitHub</a> &mdash;
            <a href="<?= $githubUrl ?>/blob/main/Docs/PRIVACY.md">Privacy</a>
        </p>
        <p><em style="color: #a89080;">No popups? No cookies!</em></p>
    </div>

</body>
</html>
