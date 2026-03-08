<?php
// Landing page - only shown when NEWTON_LANDING_PAGE=true
// Otherwise, redirect to the tournament app
if (getenv('NEWTON_LANDING_PAGE') !== 'true') {
    header('Location: tournament.php');
    exit;
}

$githubUrl = getenv('NEWTON_GITHUB_URL') ?: 'https://github.com/skrodahl/NewTon';
$baseUrl = getenv('NEWTON_BASE_URL') ?: '';
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
    <meta name="keywords" content="darts, tournament, bracket, double elimination, single elimination, tournament manager, open source, self-hosted, offline, darts scoring">

    <!-- Open Graph -->
    <meta property="og:type" content="website">
    <meta property="og:title" content="NewTon DC - Free Open-Source Darts Tournament Manager">
    <meta property="og:description" content="Professional single and double elimination darts tournament management. Offline-first, self-hostable, zero dependencies. No signup required.">
    <meta property="og:image" content="<?= htmlspecialchars($baseUrl) ?>/Screenshots/tournament-bracket-zoom.png">
    <?php if ($baseUrl): ?>
    <meta property="og:url" content="<?= htmlspecialchars($baseUrl) ?>">
    <?php endif; ?>

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="NewTon DC - Free Open-Source Darts Tournament Manager">
    <meta name="twitter:description" content="Professional single and double elimination darts tournament management. Offline-first, self-hostable, zero dependencies.">
    <meta name="twitter:image" content="<?= htmlspecialchars($baseUrl) ?>/Screenshots/tournament-bracket-zoom.png">

    <?php if ($baseUrl): ?>
    <link rel="canonical" href="<?= htmlspecialchars($baseUrl) ?>">
    <?php endif; ?>
</head>
<body>

    <!-- Header - matches tournament app style -->
    <div class="landing-header">
        <div class="landing-header-top">
            <h1>
                <img src="images/logo.jpg" alt="NewTon DC Logo" class="landing-logo"
                     onerror="this.outerHTML='<div class=\'landing-logo-placeholder\'>CLUB<br>LOGO</div>'">
                NewTon DC - Tournament Manager
            </h1>
        </div>
    </div>

    <!-- Hero -->
    <div class="hero">
        <p class="hero-tagline">Free, Open-Source Darts Tournament Manager</p>
        <p class="hero-description">
            Run professional single and double elimination darts tournaments entirely from your browser.
            No server, no database, no internet connection required. Your data never leaves your device.
        </p>
        <div class="hero-buttons">
            <a href="tournament.php" class="btn-launch">Launch Tournament Manager</a>
            <a href="<?= htmlspecialchars($githubUrl) ?>" class="btn-github">View on GitHub</a>
        </div>
    </div>

    <!-- Key Features -->
    <div class="features">
        <h2>Key Features</h2>
        <div class="features-grid">
            <div class="feature-card">
                <h3>Single &amp; Double Elimination</h3>
                <p>Professional bracket structures for 4 to 32 players. Frontside/backside brackets with automatic progression, walkovers, and placement tracking.</p>
            </div>
            <div class="feature-card">
                <h3>Offline-First Design</h3>
                <p>Runs entirely in your browser with zero external dependencies. No internet connection, server, or database required. Pure HTML5, CSS3, and JavaScript.</p>
            </div>
            <div class="feature-card">
                <h3>Self-Hostable with Docker</h3>
                <p>Deploy on your own server in under 2 minutes. Lightweight Alpine container with nginx and optional REST API for tournament sharing.</p>
            </div>
            <div class="feature-card">
                <h3>Complete Undo System</h3>
                <p>Transaction-based history enables surgical undo of any match result. Recover from mistakes without resetting the entire tournament.</p>
            </div>
            <div class="feature-card">
                <h3>Lane &amp; Referee Management</h3>
                <p>Assign matches to dartboard lanes with conflict prevention. Smart referee suggestions ensure no player referees their own match.</p>
            </div>
            <div class="feature-card">
                <h3>Total Privacy</h3>
                <p>All tournament data lives in your browser's localStorage. No cloud, no tracking, no external data sharing. Complete privacy by architecture.</p>
            </div>
            <div class="feature-card">
                <h3>Match Card Magic Zoom</h3>
                <p>Interactive bracket visualization with automatic zoom on individual matches. Click to select winners, hover for status and progression info.</p>
            </div>
            <div class="feature-card">
                <h3>Import &amp; Export</h3>
                <p>JSON-based backup and sharing between devices. CSV export for results. Multi-tournament support with persistent player registry.</p>
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

    <!-- Highlights -->
    <div class="highlights">
        <div class="highlights-grid">
            <div class="highlight-item">
                <div class="number">0</div>
                <div class="label">External Dependencies</div>
            </div>
            <div class="highlight-item">
                <div class="number">4-32</div>
                <div class="label">Players per Tournament</div>
            </div>
            <div class="highlight-item">
                <div class="number">~60MB</div>
                <div class="label">Docker Image Size</div>
            </div>
            <div class="highlight-item">
                <div class="number">100%</div>
                <div class="label">Client-Side Privacy</div>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <div class="landing-footer">
        <p>
            NewTon DC Tournament Manager &mdash; BSD-3-Clause License &mdash;
            <a href="<?= htmlspecialchars($githubUrl) ?>">GitHub</a> &mdash;
            <a href="<?= htmlspecialchars($githubUrl) ?>/blob/main/Docs/PRIVACY.md">Privacy</a>
        </p>
    </div>

</body>
</html>
