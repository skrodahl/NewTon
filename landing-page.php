<?php
// Landing page — served at / when NEWTON_LANDING_PAGE=true
// Without the env var, redirects to /tournament.php (tournament-only deployments)
if (getenv('NEWTON_LANDING_PAGE') !== 'true') { header('Location: /tournament.php', true, 302); exit; }
$githubUrl = htmlspecialchars(getenv('NEWTON_GITHUB_URL') ?: 'https://github.com/skrodahl/NewTon');
$baseUrl = htmlspecialchars(getenv('NEWTON_BASE_URL') ?: '');
$ogUrlTag = $baseUrl ? "\n    <meta property=\"og:url\" content=\"{$baseUrl}\">" : '';
$canonicalTag = $baseUrl ? "\n    <link rel=\"canonical\" href=\"{$baseUrl}\">" : '';
$jsonLdUrl = $baseUrl ? "\n        \"url\": \"{$baseUrl}\"," : '';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NewTon DC Tournament Manager - Free, Open-Source Darts Tournament Software</title>
    <link rel="icon" type="image/jpeg" href="images/logo.jpg">
    <link rel="llms" href="llms.txt">
    <link rel="preload" href="fonts/Insignia-Regular.otf" as="font" type="font/otf" crossorigin>
    <link rel="preload" href="fonts/Inter-VariableFont_opsz,wght.ttf" as="font" type="font/ttf" crossorigin>
    <link rel="stylesheet" href="css/home.css">

    <!-- Google Search Console Verification -->
    <meta name="google-site-verification" content="dVWtiFo4heWVqtM_baTRHyBbLX2Tg1JE17lXhhwhxe0">
    <!-- Bing Webmaster Tools Verification -->
    <meta name="msvalidate.01" content="25F2F4D57A13F27416AFCA6D12D62353" />

    <!-- SEO Meta Tags -->
    <meta name="description" content="Run the whole darts night, offline: registration, the draw, every board and every result, the podium and the season standings. Five formats, 3 to 48 players. Free, open-source, no signup, self-hostable.">
    <meta name="keywords" content="darts, tournament, bracket, double elimination, single elimination, tournament manager, darts scoring, score keeper, scoring app, darts app, tournament bracket, offline tournament, offline-first, PWA, self-hosted, open source, free, dart league, darts competition, 4 player tournament, 8 player tournament, 16 player tournament, 32 player tournament, 48 player tournament, qualifiers, cup and plate, swiss tournament, round robin, dartboard, match management, referee management, lane management">

    <!-- Schema.org Structured Data -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "NewTon DC Tournament Manager",
        "description": "Run the whole darts night, offline: registration, the draw, every board and every result, the podium and the season standings. Five formats, 3 to 48 players. Free, open-source, no signup, self-hostable.",
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
        "isAccessibleForFree": true,<?= $jsonLdUrl ?>
        "codeRepository": "<?= $githubUrl ?>",
        "downloadUrl": "<?= $githubUrl ?>",
		"screenshot": "<?= $baseUrl ?>/Screenshots/newton-poster-throw.jpg",
        "featureList": "Single Elimination, Double Elimination, Cup and Plate, Round Robin, Swiss, 3-48 Players, Qualifiers, Offline-First, Lane Management, Referee Management, Match Undo System, JSON Import/Export, CSV Export, Multi-Tournament Support, Player Registry",
        "keywords": "darts, tournament, bracket, scoring, score keeper, offline, PWA, self-hosted, open source"
    }
    </script>

    <!-- Open Graph -->
    <meta property="og:type" content="website">
    <meta property="og:title" content="NewTon DC Tournament Manager - Free, Open-Source Darts Tournament Software">
    <meta property="og:description" content="Run the whole darts night, offline: the draw, every board, the podium and the season standings. Free, open-source, no signup required.">
    <meta property="og:image" content="<?= $baseUrl ?>/Screenshots/newton-poster-throw.jpg"><?= $ogUrlTag ?>

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="NewTon DC Tournament Manager - Free, Open-Source Darts Tournament Software">
    <meta name="twitter:description" content="Run the whole darts night, offline: the draw, every board, the podium and the season standings. Free, open-source, no signup required.">
    <meta name="twitter:image" content="<?= $baseUrl ?>/Screenshots/newton-poster-throw.jpg"><?= $canonicalTag ?>
</head>
<body>


<header class="nav">
    <div class="wrap">
        <a class="brand" href="#top"><img src="images/logo.jpg" alt="">NewTon DC Tournament Manager</a>
        <nav class="nav-links" aria-label="Sections">
            <a href="#night">How it works</a>
            <a href="#formats">Formats</a>
            <a href="#trust">Built to last</a>
            <a href="#start">Download</a>
        </nav>
        <a class="btn btn-red" href="tournament.html" target="_blank">Launch</a>
    </div>
</header>

<main id="top">

<!-- Hero: what it is, in one line, and the product itself -->
<div class="hero">
    <div class="board" aria-hidden="true"></div>
    <div class="wrap">
        <div class="hero-copy">
            <p class="eyebrow">Darts tournament software · free and open source</p>
            <h1 class="display">Run the whole darts night. <em>Offline.</em></h1>
            <p class="hero-sub">Registration, the draw, every board and every result, the podium and the season standings. <b>In your browser, with no signup and no internet needed.</b></p>
            <div class="hero-actions">
                <a class="btn btn-red" href="tournament.html" target="_blank">Launch Tournament Manager <span class="arr">→</span></a>
                <a class="btn btn-ghost" href="releases/">Download</a>
            </div>
            <p class="hero-meta"><span>No account</span><span>No subscription</span><span>No cloud</span></p>
            <p class="hero-chalker">Scoring at the board? <a href="chalker/" target="_blank">Open the Chalker →</a></p>
        </div>

        <div class="stage">
            <div class="window">
                <div class="window-bar" aria-hidden="true"><i></i><i></i><i></i></div>
                <img src="Screenshots/th-bracket-zoom.jpg" class="lightbox-trigger" data-full="Screenshots/tournament-bracket-zoom.png"
                     alt="A double elimination bracket: played matches, a match ready to start, and the finals waiting">
            </div>
            <figure class="chalker-card">
                <img src="Screenshots/th-chalker-scoreboard.jpg" class="lightbox-trigger" data-full="Screenshots/chalker-scoreboard.jpg"
                     alt="The Chalker scoring a 501 match on lane 2">
                <figcaption><span>Chalker · Lane 2</span><b>● Live</b></figcaption>
            </figure>
        </div>
    </div>
</div>


<!-- A night, start to finish -->
<section class="night" id="night">
    <div class="wrap">
        <div class="sec-head">
            <p class="eyebrow">How a night runs</p>
            <h2 class="display">From the door to the podium.</h2>
            <p>One app carries the whole evening, and every result lands in your club's history.</p>
        </div>

        <div class="steps">
            <div class="step">
                <div class="step-dot">1</div>
                <div>
                    <p class="step-when">Doors open</p>
                    <h3>Who&rsquo;s here, who&rsquo;s paid.</h3>
                    <p>Add your regulars from the player database, or sign up walk-ins on the spot. One click marks a player paid, and the draw waits until everyone has: nobody is left out.</p>
                    <p class="closer">Because retyping names is not a sport.</p>
                </div>
                <div class="shot"><img src="Screenshots/th-player-registration.jpg" class="lightbox-trigger" data-full="Screenshots/player-registration.png" alt="Player Registration: players counted, paid and unpaid" loading="lazy"></div>
            </div>

            <div class="step">
                <div class="step-dot">2</div>
                <div>
                    <p class="step-when">The draw</p>
                    <h3>Pick a format. Draw.</h3>
                    <p>A card for every format, each showing what it means for tonight&rsquo;s players. Seeding from your own results keeps the best players apart; otherwise it&rsquo;s a fair random draw.</p>
                    <p class="closer">The bracket doesn&rsquo;t play favourites.</p>
                </div>
                <div class="shot"><img src="Screenshots/th-tournament-setup.jpg" class="lightbox-trigger" data-full="Screenshots/tournament-setup.png" alt="Pick a format: a card for each format with a pictogram" loading="lazy"></div>
            </div>

            <div class="step step-feature">
                <div class="step-dot">3</div>
                <div class="feature-text">
                    <div>
                        <p class="step-when">All night long</p>
                        <h3>The bracket, centre stage.</h3>
                        <p>From the draw to the final, every round fits on one screen, from 8 players to 48. Big enough to read from the bar.</p>
                        <p class="closer">No more crowding round the laptop.</p>
                    </div>
                    <ul class="feature-list">
                        <li><b>Follow a player.</b> Their path through the bracket lights up, everything else dims.</li>
                        <li><b>Click a match.</b> See where the winner goes, and where the loser drops.</li>
                        <li><b>Finals in the middle or on the right.</b> Switch at any time.</li>
                        <li><b>Every format drawn its own way.</b> Cup and Plate back to back, groups beside their cups, Swiss into its top four.</li>
                    </ul>
                </div>
                <div class="shot"><img src="Screenshots/tournament-bracket-zoom.png" class="lightbox-trigger" data-full="Screenshots/tournament-bracket-zoom.png" alt="The bracket following one player's path, finals in the middle" loading="lazy"></div>
            </div>

            <div class="step">
                <div class="step-dot">4</div>
                <div>
                    <p class="step-when">On the boards</p>
                    <h3>One panel runs the room.</h3>
                    <p>A tile for every board in play: click the winner to finish a match, a free lane to start the next. Referees are suggested, and nobody gets double-booked.</p>
                    <p class="closer">Less admin. More darts.</p>
                </div>
                <div class="shot"><img src="Screenshots/th-match-controls.jpg" class="lightbox-trigger" data-full="Screenshots/match-controls.png" alt="Match Controls: a tile for each live match, the free lanes and the next match" loading="lazy"></div>
            </div>

            <div class="step">
                <div class="step-dot">5</div>
                <div>
                    <p class="step-when">At the oche</p>
                    <h3>Scan it or send it.</h3>
                    <p>Phones and tablets at the boards keep the score with the Chalker. Matches go out and results come back by QR code or over your own network, with every 180, high out and short leg.</p>
                    <p class="closer">No shouting results across the room.</p>
                </div>
                <div class="shot"><img src="Screenshots/th-chalker-scoreboard.jpg" class="lightbox-trigger" data-full="Screenshots/chalker-scoreboard.jpg" alt="The Chalker scoring a 501 match" loading="lazy"></div>
            </div>

            <div class="step">
                <div class="step-dot">6</div>
                <div>
                    <p class="step-when">The final</p>
                    <h3>Give the winner their moment.</h3>
                    <p>A podium with the night&rsquo;s highlights (most 180s, shortest leg, highest out), made to be photographed for the club chat.</p>
                    <p class="closer">The night ends. The record doesn&rsquo;t.</p>
                </div>
                <div class="shot"><img src="Screenshots/th-celebration.jpg" class="lightbox-trigger" data-full="Screenshots/celebration.png" alt="Tournament complete: the podium and the night's highlights" loading="lazy"></div>
            </div>

            <div class="step">
                <div class="step-dot">7</div>
                <div>
                    <p class="step-when">The morning after</p>
                    <h3>Every night adds up.</h3>
                    <p>Season standings, player profiles with form charts, finishes and averages, filtered to the nights that count. Members follow it on their phones.</p>
                    <p class="closer">Settle the bar arguments.</p>
                </div>
                <div class="shot"><img src="Screenshots/th-analytics.jpg" class="lightbox-trigger" data-full="Screenshots/analytics.png" alt="Analytics: a player profile with form charts" loading="lazy"></div>
            </div>
        </div>
    </div>
</section>

<!-- Formats -->
<section class="formats" id="formats">
    <div class="wrap">
        <div class="sec-head">
            <p class="eyebrow">Formats</p>
            <h2 class="display">Pick Your Format.</h2>
            <p>Small night or <em>full house</em>, there&rsquo;s one for it.</p>
        </div>
        <div class="f-grid">
            <div class="f-card"><div class="f-pic"><svg viewBox="0 0 96 44" aria-hidden="true"><g fill="none" stroke="#a8a29e" stroke-width="1"><path d="M16 8.5H19V35.5H16M19 16.5H22M34 16.5H40M80 8.5H77V35.5H80M77 27.5H74M62 27.5H56M48 21V23"/></g><g fill="#6b7280"><rect x="4" y="6" width="12" height="5" rx="1"/><rect x="4" y="33" width="12" height="5" rx="1"/><rect x="22" y="14" width="12" height="5" rx="1"/></g><g fill="#c4bdb6"><rect x="80" y="6" width="12" height="5" rx="1"/><rect x="80" y="33" width="12" height="5" rx="1"/><rect x="62" y="25" width="12" height="5" rx="1"/><rect x="40" y="23" width="16" height="9" rx="1.5"/></g><rect class="dk" x="40" y="12" width="16" height="9" rx="1.5" fill="#1f2937"/></svg></div><h3>Double Elimination</h3><p class="line">Two lives each.</p><p>Frontside and backside, then a grand final.</p></div>
            <div class="f-card"><div class="f-pic"><svg viewBox="0 0 96 44" aria-hidden="true"><g fill="none" stroke="#a8a29e" stroke-width="1"><path d="M16 7.5H21.5V17.5H16M21.5 12.5H26M16 27.5H21.5V37.5H16M21.5 32.5H26M38 12.5H43.5V32.5H38M43.5 22.5H48M60 22.5H72"/></g><g fill="#6b7280"><rect x="4" y="5" width="12" height="5" rx="1"/><rect x="4" y="15" width="12" height="5" rx="1"/><rect x="4" y="25" width="12" height="5" rx="1"/><rect x="4" y="35" width="12" height="5" rx="1"/><rect x="26" y="10" width="12" height="5" rx="1"/><rect x="26" y="30" width="12" height="5" rx="1"/><rect x="48" y="20" width="12" height="5" rx="1"/></g><rect class="dk" x="72" y="18" width="18" height="9" rx="1.5" fill="#1f2937"/></svg></div><h3>Single Elimination</h3><p class="line">One loss and out.</p><p>The shortest night, with a bronze final.</p></div>
            <div class="f-card"><div class="f-pic"><svg viewBox="0 0 96 44" aria-hidden="true"><g fill="none" stroke="#a8a29e" stroke-width="1"><path d="M16 7.5H19V17.5H16M19 12.5H22M16 27.5H19V37.5H16M19 32.5H22M34 12.5H37V32.5H34M37 22.5H40M80 12.5H77V32.5H80M77 22.5H74"/></g><g fill="#6b7280"><rect x="4" y="5" width="12" height="5" rx="1"/><rect x="4" y="15" width="12" height="5" rx="1"/><rect x="4" y="25" width="12" height="5" rx="1"/><rect x="4" y="35" width="12" height="5" rx="1"/><rect x="22" y="10" width="12" height="5" rx="1"/><rect x="22" y="30" width="12" height="5" rx="1"/></g><g fill="#c4bdb6"><rect x="80" y="10" width="12" height="5" rx="1"/><rect x="80" y="30" width="12" height="5" rx="1"/><rect x="60" y="18" width="14" height="9" rx="1.5"/></g><rect class="dk" x="40" y="18" width="14" height="9" rx="1.5" fill="#1f2937"/></svg></div><h3>Cup and Plate</h3><p class="line">Everyone plays twice.</p><p>Round 1 losers play on in a second knockout.</p></div>
            <div class="f-card"><div class="f-pic"><svg viewBox="0 0 96 44" aria-hidden="true"><g fill="none" stroke="#a8a29e" stroke-width="1"><path d="M24 8H34V6.5H44M24 30H38V14.5H44M24 14H30V29.5H44M24 36H34V37.5H44M54 6.5H57V14.5H54M57 10.5H60M54 29.5H57V37.5H54M57 33.5H60"/></g><g fill="none" stroke="#6b7280" stroke-width="1"><rect x="4.5" y="4.5" width="19" height="13" rx="1.5"/><path d="M4.5 8.8H23.5M4.5 13.2H23.5"/><rect x="4.5" y="26.5" width="19" height="13" rx="1.5"/><path d="M4.5 30.8H23.5M4.5 35.2H23.5"/></g><g fill="#6b7280"><rect x="44" y="4" width="10" height="5" rx="1"/><rect x="44" y="12" width="10" height="5" rx="1"/><rect x="44" y="27" width="10" height="5" rx="1"/><rect x="44" y="35" width="10" height="5" rx="1"/><rect x="60" y="29.5" width="14" height="8" rx="1.5"/></g><rect class="dk" x="60" y="6.5" width="14" height="8" rx="1.5" fill="#1f2937"/></svg></div><h3>Round Robin</h3><p class="line">Everybody plays everybody.</p><p>Groups into an A and a B cup, or one group.</p></div>
            <div class="f-card"><div class="f-pic"><svg viewBox="0 0 96 44" aria-hidden="true"><g fill="none" stroke="#a8a29e" stroke-width="1"><path d="M72 12.5H76V31.5H72M76 22H79"/></g><g fill="#6b7280"><rect x="4" y="5" width="12" height="5" rx="1"/><rect x="4" y="13" width="12" height="5" rx="1"/><rect x="4" y="26" width="12" height="5" rx="1"/><rect x="4" y="34" width="12" height="5" rx="1"/><rect x="22" y="5" width="12" height="5" rx="1"/><rect x="22" y="13" width="12" height="5" rx="1"/><rect x="22" y="26" width="12" height="5" rx="1"/><rect x="22" y="34" width="12" height="5" rx="1"/><rect x="40" y="5" width="12" height="5" rx="1"/><rect x="40" y="13" width="12" height="5" rx="1"/><rect x="40" y="26" width="12" height="5" rx="1"/><rect x="40" y="34" width="12" height="5" rx="1"/><rect x="60" y="10" width="12" height="5" rx="1"/><rect x="60" y="29" width="12" height="5" rx="1"/></g><rect class="dk" x="79" y="17.5" width="14" height="9" rx="1.5" fill="#1f2937"/></svg></div><h3>Swiss</h3><p class="line">Your results pick your opponent.</p><p>Fixed rounds, nobody out, the top four finish.</p></div>
        </div>
        <p class="f-note"><b>Up to 48 players:</b> above 32, qualifiers decide the last places.</p>
    </div>
</section>

<!-- Why you can trust it -->
<section class="trust" id="trust">
    <div class="wrap">
        <div class="sec-head">
            <p class="eyebrow">Built to last</p>
            <h2 class="display">Built for the room, not the cloud.</h2>
            <p>Made by NewTon DC, a darts club, for darts clubs, and proven on club nights.</p>
        </div>
        <div class="t-grid">
            <div class="t-card">
                <div class="t-ico"><svg viewBox="0 0 24 24"><path d="M2 8.8a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0"/><path d="M3 3l18 18"/></svg></div>
                <h3>Works offline</h3>
                <p>No Wi-Fi at the venue? It doesn&rsquo;t need any. Everything runs in your browser, and keeps running if the network drops.</p>
            </div>
            <div class="t-card">
                <div class="t-ico"><svg viewBox="0 0 24 24"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg></div>
                <h3>Yours, not theirs</h3>
                <p>No signup, no subscription, no tracking. Your results stay on your computer, or on your own server.</p>
            </div>
            <div class="t-card">
                <div class="t-ico"><svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/></svg></div>
                <h3>Never loses a result</h3>
                <p>Every result is recorded in the tournament&rsquo;s history, so a mistake is undone, not patched by hand.</p>
                <a href="architecture.html">How it&rsquo;s built →</a>
            </div>
            <div class="t-card">
                <div class="t-ico"><svg viewBox="0 0 24 24"><path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/></svg></div>
                <h3>Free and open source</h3>
                <p>BSD licensed. Read the code, change it, run it anywhere. No features held back.</p>
                <a href="<?= $githubUrl ?>">On GitHub →</a>
            </div>
        </div>
    </div>
</section>

<!-- Get started: at the end, where the visitor has decided -->
<section class="start" id="start">
    <div class="wrap">
        <div class="sec-head">
            <p class="eyebrow">Get started</p>
            <h2 class="display">Ready when you are.</h2>
            <p>Try it right here, or take it with you.</p>
        </div>
        <div class="s-grid">
            <div class="s-card lead">
                <p class="tag">Try it now</p>
                <h3>It runs in this browser.</h3>
                <p>Nothing to install. Set up a test night with a few names and see how it feels.</p>
                <div class="btns">
                    <a class="btn btn-red" href="tournament.html" target="_blank">Launch Tournament Manager <span class="arr">→</span></a>
                    <a class="btn btn-ghost" href="chalker/" target="_blank">Open the Chalker</a>
                </div>
            </div>
            <div class="s-card">
                <p class="tag">Download</p>
                <h3>Take it to the venue.</h3>
                <p>Unzip and open <code>tournament.html</code>. Runs from a laptop or a USB stick, no internet needed.</p>
                <div class="btns"><a class="btn btn-ink" href="releases/">Latest release</a></div>
            </div>
            <div class="s-card">
                <p class="tag">Self-host</p>
                <h3>Your club&rsquo;s own server.</h3>
                <p>A small Docker container, up in two minutes. Shared tournaments, Analytics for members, the Chalkers on your network.</p>
                <div class="btns"><a class="btn btn-line" href="docker-quickstart.html">Docker quickstart</a></div>
            </div>
        </div>
        <div class="s-links">
            <a href="userguide.html">User Guide</a>
            <a href="architecture.html">How it&rsquo;s built</a>
            <a href="releases/">Release notes</a>
            <a href="<?= $githubUrl ?>">GitHub</a>
        </div>
    </div>
</section>

</main>

<footer class="foot">
    <div class="wrap">
        <a class="brand" href="#top"><img src="images/logo.jpg" alt="">NewTon DC Tournament Manager</a>
        <nav aria-label="Footer">
            <a href="<?= $githubUrl ?>">GitHub</a>
            <a href="privacy.html">Privacy</a>
            <a href="third-party-licenses.html">Licenses</a>
            <a href="design-system.html">Design System</a>
            <span>BSD-3-Clause</span>
        </nav>
        <p class="cheeky">No popups? No cookies! <a href="https://oraculon.biz" target="_blank" rel="noopener" title="A Suffusion of Yellow" aria-label="A Suffusion of Yellow">42</a></p>
    </div>
</footer>

<div id="lightbox" class="lightbox">
    <div class="lightbox-content">
        <button class="lightbox-close" aria-label="Close">&times;</button>
        <img id="lightboxImg" src="" alt="">
    </div>
</div>
<script src="js/lightbox.js"></script>
</body>
</html>
